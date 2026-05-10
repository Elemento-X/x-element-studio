/**
 * @owner: @tester (Maclean)
 *
 * Notify tests — Resend adapter behavior. We mock the `resend` SDK at
 * the module boundary so we never make a real HTTP call. We exercise:
 *
 *   - Stub mode (no RESEND_API_KEY → returns ok without calling)
 *   - Happy path (single send, ok=true)
 *   - Resend returns a structured error → ok=false, error=name
 *   - Resend throws (network) → ok=false, error='transport'
 *   - Timeout: send() hangs longer than NOTIFY_TIMEOUT_MS → ok=false,
 *     error='transport' (caught as exception, logged as 'notify_timeout')
 *   - Subject formatting uses ENGAGEMENT_LABELS, includes the brand prefix,
 *     and the submitter's name
 *   - HTML body escapes user-controlled fields (XSS in name/company/message)
 *   - replyTo is set to the submitter's email
 *   - Logs never include PII (name, email, message)
 *
 * Determinism: fake timers for the timeout test; SDK promise resolution
 * controlled by mock implementation.
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

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('resend', () => {
  function Resend(this: unknown) {
    Object.assign(this as object, { emails: { send: mockSend } })
  }
  return { Resend }
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
  mockSend.mockReset()
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubEnv('RESEND_API_KEY', '')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  infoSpy.mockRestore()
  errorSpy.mockRestore()
})

describe('notifyContact — stub mode', () => {
  it('returns ok=true without calling Resend when RESEND_API_KEY is missing', async () => {
    const { notifyContact } = await import('./notify')
    const r = await notifyContact(validInput)

    expect(r).toEqual({ ok: true })
    expect(mockSend).not.toHaveBeenCalled()
  })
})

describe('notifyContact — happy path', () => {
  it('sends one email and returns ok=true', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_1' }, error: null })

    const { notifyContact } = await import('./notify')
    const r = await notifyContact(validInput)

    expect(r).toEqual({ ok: true })
    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('sets replyTo to the submitter email and uses ENGAGEMENT_LABELS in the subject', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('FROM_EMAIL', 'Test <test@example.com>')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')
    vi.resetModules()
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_2' }, error: null })

    const { notifyContact } = await import('./notify')
    await notifyContact({
      ...validInput,
      engagement: 'partnership',
      name: 'Subject Person',
      email: 'subject@example.com',
    })

    const arg = mockSend.mock.calls[0]?.[0] as {
      from: string
      to: string
      replyTo: string
      subject: string
      text: string
      html: string
    }
    expect(arg.replyTo).toBe('subject@example.com')
    expect(arg.from).toBe('Test <test@example.com>')
    expect(arg.to).toBe('ops@example.com')
    expect(arg.subject).toBe('[Elemento-X] Partnership — Subject Person')
  })

  it('escapes HTML in user-controlled fields (XSS hardening)', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_3' }, error: null })

    const { notifyContact } = await import('./notify')
    await notifyContact({
      ...validInput,
      name: '<script>alert(1)</script>',
      company: 'Acme & Co.',
      message: 'A "quoted" 20+ character message with <b>HTML</b>.',
    })

    const arg = mockSend.mock.calls[0]?.[0] as { html: string; text: string }
    // Raw script tag must be escaped, not present as live HTML.
    expect(arg.html).not.toContain('<script>alert(1)</script>')
    expect(arg.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(arg.html).toContain('Acme &amp; Co.')
    expect(arg.html).toContain('&quot;quoted&quot;')
    // Text body is not HTML — no escaping needed (and it should NOT be escaped).
    expect(arg.text).toContain('<script>alert(1)</script>')
  })
})

describe('notifyContact — error paths', () => {
  it('returns ok=false with error name when Resend returns an error object', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: 'invalid_recipient', message: 'Bad to address' },
    })

    const { notifyContact } = await import('./notify')
    const r = await notifyContact(validInput)

    expect(r).toEqual({ ok: false, error: 'invalid_recipient' })
  })

  it('returns ok=false with transport error when send() throws', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()
    mockSend.mockRejectedValueOnce(new Error('ECONNRESET'))

    const { notifyContact } = await import('./notify')
    const r = await notifyContact(validInput)

    expect(r).toEqual({ ok: false, error: 'transport' })
  })

  it('returns ok=false with transport error when send() exceeds NOTIFY_TIMEOUT_MS', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()
    // Hang forever — only the withTimeout race should resolve.
    mockSend.mockReturnValueOnce(new Promise(() => {}))

    const { notifyContact } = await import('./notify')
    const promise = notifyContact(validInput)
    // Advance past 8s (NOTIFY_TIMEOUT_MS)
    await vi.advanceTimersByTimeAsync(8001)
    const r = await promise

    expect(r).toEqual({ ok: false, error: 'transport' })
  })
})

describe('notifyContact — logging policy', () => {
  it('does not include PII (name, email, message) in logs on success or failure', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.resetModules()

    const piiInput: ContactOutput = {
      ...validInput,
      name: 'PIINAME-NOTIFY-UNIQUE',
      email: 'piinotify+unique@example.com',
      message: 'PIIMSG-NOTIFY-UNIQUE 20+ characters easily met here.',
    }

    // 1st call: success path
    mockSend.mockResolvedValueOnce({ data: { id: 'm' }, error: null })
    const { notifyContact } = await import('./notify')
    await notifyContact(piiInput)

    // 2nd call: error path (re-import not needed — same module instance)
    mockSend.mockRejectedValueOnce(new Error('boom'))
    await notifyContact(piiInput)

    const allLogged = [
      ...infoSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ]
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(' ')

    expect(allLogged).not.toContain('PIINAME-NOTIFY-UNIQUE')
    expect(allLogged).not.toContain('piinotify+unique@example.com')
    expect(allLogged).not.toContain('PIIMSG-NOTIFY-UNIQUE')
  })
})
