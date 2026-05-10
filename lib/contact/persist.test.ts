/**
 * @owner: @tester (Maclean)
 *
 * Persist tests — Notion adapter behavior. We mock @notionhq/client at
 * the module boundary so we never make a real HTTP call. The mock lets
 * us exercise:
 *
 *   - Stub mode (no NOTION_* env → returns ok with pageId='stub')
 *   - Happy path (1 attempt, returns the page id)
 *   - Transient error → retry → success on attempt 2
 *   - Transient error on every attempt → exhausts MAX_RETRIES (=2),
 *     returns { ok:false, error:'transient' }
 *   - Permanent Notion errors (validation_error, unauthorized) → fail
 *     fast on attempt 1
 *   - Unknown (non-Notion) errors → permanent (post-fix behavior),
 *     not transient. Catches the regression where TypeError used to be
 *     retried 3x before surfacing.
 *   - PII never leaves the input — log assertions check that name/
 *     email/message do not appear in console output.
 *   - Engagement label mapping uses ENGAGEMENT_LABELS (not the raw
 *     kebab-case value).
 *   - Optional fields (company, engagementOther) only included when set.
 *
 * Determinism: the retry loop sleeps 200ms between attempt 1 and 2
 * (BACKOFF_FACTOR=2, BASE=200). With fake timers and `runAllTimersAsync`
 * the sleep is instantaneous and deterministic.
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import type { ContactOutput } from './schema'

// Hoisted mock factory so vi.mock can use it.
const { mockCreate, NotionAPIErrorMock } = vi.hoisted(() => {
  // Minimal stand-in for APIResponseError. The real `isNotionClientError`
  // checks for an instance of an internal error class — we make our own
  // class and intercept `isNotionClientError` below to recognize it.
  class NotionAPIErrorMock extends Error {
    code: string
    status: number
    constructor(code: string, status = 500, message = code) {
      super(message)
      this.name = 'APIResponseError'
      this.code = code
      this.status = status
    }
  }
  return { mockCreate: vi.fn(), NotionAPIErrorMock }
})

vi.mock('@notionhq/client', () => {
  // Vitest 4 wants a real `function` (or `class`) so `new Client(...)` works
  // — `vi.fn().mockImplementation(...)` triggered a runtime warning and the
  // construction returned undefined under jsdom.
  function Client(this: unknown) {
    Object.assign(this as object, { pages: { create: mockCreate } })
  }
  return {
    Client,
    isNotionClientError: (err: unknown) => err instanceof NotionAPIErrorMock,
  }
})

const validInput: ContactOutput = {
  name: 'Maclean',
  email: 'maclean@example.com',
  engagement: 'new-project',
  message: 'A real-world brief that meets the 20-character minimum easily.',
  company: undefined,
  engagementOther: undefined,
  honeypot: undefined,
}

let infoSpy: MockInstance
let errorSpy: MockInstance

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetModules()
  mockCreate.mockReset()
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  // Tests opt-in to "real" Notion env via stubEnv — default is stub.
  vi.stubEnv('NOTION_API_KEY', '')
  vi.stubEnv('NOTION_DATABASE_ID', '')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  infoSpy.mockRestore()
  errorSpy.mockRestore()
})

describe('persistContact — stub mode', () => {
  it('returns { ok:true, pageId:"stub" } when NOTION_* envs are missing', async () => {
    const { persistContact } = await import('./persist')
    const r = await persistContact(validInput)

    expect(r).toEqual({ ok: true, pageId: 'stub' })
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('persistContact — happy path', () => {
  it('calls Notion once and returns the page id', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockResolvedValueOnce({ id: 'page_abc' })

    const { persistContact } = await import('./persist')
    const r = await persistContact(validInput)

    expect(r).toEqual({ ok: true, pageId: 'page_abc' })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('maps engagement value to its label and includes optional fields when set', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockResolvedValueOnce({ id: 'page_xyz' })

    const { persistContact } = await import('./persist')
    await persistContact({
      ...validInput,
      engagement: 'other',
      engagementOther: 'Audit',
      company: 'Acme',
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const call = mockCreate.mock.calls[0]?.[0] as {
      parent: { database_id: string }
      properties: Record<string, unknown>
    }
    expect(call.parent.database_id).toBe('db_test_123')
    expect(call.properties.Engagement).toEqual({ select: { name: 'Other' } })
    expect(call.properties.Company).toBeDefined()
    expect(call.properties['Engagement detail']).toBeDefined()
    expect(call.properties.Status).toEqual({ select: { name: 'New' } })
  })

  it('omits optional Notion props when company / engagementOther are undefined', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockResolvedValueOnce({ id: 'page_clean' })

    const { persistContact } = await import('./persist')
    await persistContact(validInput)

    const call = mockCreate.mock.calls[0]?.[0] as {
      properties: Record<string, unknown>
    }
    expect(call.properties.Company).toBeUndefined()
    expect(call.properties['Engagement detail']).toBeUndefined()
  })
})

describe('persistContact — retry on transient', () => {
  it('retries once on rate_limited then succeeds', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate
      .mockRejectedValueOnce(new NotionAPIErrorMock('rate_limited', 429))
      .mockResolvedValueOnce({ id: 'page_after_retry' })

    const { persistContact } = await import('./persist')
    const promise = persistContact(validInput)

    // BASE=200ms backoff between attempt 1 → 2
    await vi.runAllTimersAsync()
    const r = await promise

    expect(r).toEqual({ ok: true, pageId: 'page_after_retry' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('exhausts MAX_RETRIES (=2) on persistent transient and returns transient error', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate
      .mockRejectedValueOnce(new NotionAPIErrorMock('service_unavailable', 503))
      .mockRejectedValueOnce(new NotionAPIErrorMock('service_unavailable', 503))

    const { persistContact } = await import('./persist')
    const promise = persistContact(validInput)
    await vi.runAllTimersAsync()
    const r = await promise

    expect(r).toEqual({ ok: false, error: 'transient' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})

describe('persistContact — permanent failures', () => {
  it('does NOT retry on a permanent Notion error (e.g. unauthorized)', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockRejectedValueOnce(
      new NotionAPIErrorMock('unauthorized', 401),
    )

    const { persistContact } = await import('./persist')
    const r = await persistContact(validInput)

    expect(r).toEqual({ ok: false, error: 'permanent' })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('treats unknown (non-Notion) errors as permanent — fail fast', async () => {
    // This is the post-fix behavior: previously TypeError/ReferenceError
    // would get retried as transient, masking real bugs.
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockRejectedValueOnce(new TypeError('boom'))

    const { persistContact } = await import('./persist')
    const r = await persistContact(validInput)

    expect(r).toEqual({ ok: false, error: 'permanent' })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

describe('persistContact — logging policy', () => {
  it('does not include PII (name, email, message, company) in logs', async () => {
    vi.stubEnv('NOTION_API_KEY', 'secret_test_key')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_test_123')
    vi.resetModules()

    mockCreate.mockResolvedValueOnce({ id: 'page_pii_check' })

    const piiInput: ContactOutput = {
      ...validInput,
      name: 'PIITESTNAME-UNIQUE',
      email: 'piitest+unique@example.com',
      message:
        'PIITESTMESSAGE-UNIQUE — a real-world brief, 20+ characters easy.',
      company: 'PIITESTCOMPANY-UNIQUE',
    }

    const { persistContact } = await import('./persist')
    await persistContact(piiInput)

    const allLogged = [
      ...infoSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ]
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(' ')

    expect(allLogged).not.toContain('PIITESTNAME-UNIQUE')
    expect(allLogged).not.toContain('piitest+unique@example.com')
    expect(allLogged).not.toContain('PIITESTMESSAGE-UNIQUE')
    expect(allLogged).not.toContain('PIITESTCOMPANY-UNIQUE')
  })
})
