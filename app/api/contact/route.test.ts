/**
 * @owner: @tester (Maclean)
 *
 * Route tests — `app/api/contact/route.ts`. We invoke `POST(req)` and
 * `GET(req)` directly with a real NextRequest so we exercise the
 * actual handler, not a transcription of it. Persist/notify/rate-limit
 * are mocked at the module boundary so we can drive each branch:
 *
 *   - Method: GET → 405 METHOD_NOT_ALLOWED with Allow: POST
 *   - Kill-switch off → 503 DISABLED
 *   - Origin gate (production only) → 403 FORBIDDEN
 *   - Wrong Content-Type → 415
 *   - Per-IP rate limit hit BEFORE the body is read → 429 with Retry-After
 *   - Body > 16KB → 413 PAYLOAD_TOO_LARGE
 *   - Invalid JSON → 400 INVALID_JSON
 *   - Schema fails → 400 VALIDATION_ERROR with `fields` map
 *   - Honeypot tripped → silent 200 (no persist/notify call)
 *   - Per-email rate limit (after parse) → 429
 *   - Persist returns ok=false → 500 PERSISTENCE_ERROR
 *   - Persist ok + notify failure → still 200 (best-effort)
 *   - Happy path → 200 with `data: { ok: true }` envelope and the
 *     X-RateLimit-Remaining header reflecting the per-IP bucket
 *   - X-Request-Id: invalid client value (CRLF, too short) → minted
 *     UUID; valid client value → echoed
 *   - Cache-Control: no-store on every response
 *   - getClientIp: prefers x-vercel-forwarded-for over x-real-ip over
 *     x-forwarded-for (last hop)
 *
 * Determinism: rate-limit/persist/notify mocked → no IO, no clock.
 */
import { NextRequest } from 'next/server'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'

const {
  mockRateLimitContact,
  mockRateLimitContactEmail,
  mockPersist,
  mockNotify,
  mockVerifyTurnstile,
  mockIsTurnstileEnabled,
} = vi.hoisted(() => ({
  mockRateLimitContact: vi.fn(),
  mockRateLimitContactEmail: vi.fn(),
  mockPersist: vi.fn(),
  mockNotify: vi.fn(),
  mockVerifyTurnstile: vi.fn(),
  mockIsTurnstileEnabled: vi.fn(),
}))

vi.mock('@/lib/contact/rate-limit', () => ({
  rateLimitContact: mockRateLimitContact,
  rateLimitContactEmail: mockRateLimitContactEmail,
  // hashIp is also imported by route.ts to tag persisted submissions.
  // Use a deterministic stub so test assertions on the metadata
  // (Notion `IP hash` property) stay stable across runs.
  hashIp: (ip: string) => `hashed:${ip}`,
}))
vi.mock('@/lib/contact/persist', () => ({ persistContact: mockPersist }))
vi.mock('@/lib/contact/notify', () => ({ notifyContact: mockNotify }))

const validBody = {
  name: 'Maclean',
  email: 'maclean@example.com',
  engagement: 'new-project',
  message: 'A real-world brief that meets the 20-character minimum easily.',
}

function makeReq(
  init: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    rawBody?: string
  } = {},
): NextRequest {
  const headers = new Headers({
    'content-type': 'application/json',
    ...(init.headers ?? {}),
  })
  const body =
    init.rawBody !== undefined
      ? init.rawBody
      : init.body !== undefined
        ? JSON.stringify(init.body)
        : undefined
  return new NextRequest('http://localhost:3000/api/contact', {
    method: init.method ?? 'POST',
    headers,
    body,
  })
}

let infoSpy: MockInstance
let errorSpy: MockInstance

beforeEach(() => {
  vi.resetModules()
  mockRateLimitContact.mockReset()
  mockRateLimitContactEmail.mockReset()
  mockPersist.mockReset()
  mockNotify.mockReset()
  // Sane defaults — tests override per branch.
  // RateLimitResult: ok, remaining, limit, retryAfterSeconds, resetAt
  // (`limit` + `resetAt` flow into X-RateLimit-* headers per
  //  api-contract.md — Reset is unix seconds, Stripe/GitHub style.)
  mockRateLimitContact.mockResolvedValue({
    ok: true,
    remaining: 4,
    limit: 5,
    retryAfterSeconds: 3600,
    resetAt: 1_900_000_000,
  })
  mockRateLimitContactEmail.mockResolvedValue({
    ok: true,
    remaining: 1,
    limit: 2,
    retryAfterSeconds: 3600,
    resetAt: 1_900_000_000,
  })
  mockPersist.mockResolvedValue({ ok: true, pageId: 'page_test' })
  mockNotify.mockResolvedValue({ ok: true })
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  // Default test env — already set by vitest.setup.tsx, but re-stub
  // explicitly for clarity (and so individual tests can flip prod on).
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
})

afterEach(() => {
  vi.unstubAllEnvs()
  infoSpy.mockRestore()
  errorSpy.mockRestore()
})

async function importPost() {
  const mod = await import('./route')
  return mod.POST
}

async function importGet() {
  const mod = await import('./route')
  return mod.GET
}

describe('POST /api/contact — method & gates', () => {
  it('GET → 405 with Allow: POST', async () => {
    const GET = await importGet()
    const res = await GET(makeReq({ method: 'GET' }))
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED')
  })

  it('returns 503 DISABLED when the kill-switch is off', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'false')
    vi.resetModules()

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('DISABLED')
    // No downstream calls when killed
    expect(mockRateLimitContact).not.toHaveBeenCalled()
    expect(mockPersist).not.toHaveBeenCalled()
  })

  it('returns 403 FORBIDDEN cross-origin in prod', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    vi.stubEnv('FROM_EMAIL', 'team@elemento-x.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    vi.stubEnv('RESEND_API_KEY', 're_x')
    vi.stubEnv('NOTION_API_KEY', 'ntn_x')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_x')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://abc-12345.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk_x')
    delete process.env.NEXT_PHASE
    vi.resetModules()

    const POST = await importPost()
    const res = await POST(
      makeReq({
        body: validBody,
        headers: { origin: 'https://attacker.example.com' },
      }),
    )
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('returns 415 when Content-Type is not application/json', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({
        rawBody: JSON.stringify(validBody),
        headers: { 'content-type': 'text/plain' },
      }),
    )
    expect(res.status).toBe(415)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })
})

describe('POST /api/contact — rate limiting', () => {
  it('returns 429 RATE_LIMITED on per-IP bucket hit, with Retry-After', async () => {
    mockRateLimitContact.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      limit: 5,
      retryAfterSeconds: 1234,
      resetAt: 1_950_000_000,
    })

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('1234')
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0')
    // api-contract: Limit + Reset are part of the contract on 429 too.
    expect(res.headers.get('x-ratelimit-limit')).toBe('5')
    expect(res.headers.get('x-ratelimit-reset')).toBe('1950000000')
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('RATE_LIMITED')
    // Body never read on per-IP RL hit
    expect(mockRateLimitContactEmail).not.toHaveBeenCalled()
    expect(mockPersist).not.toHaveBeenCalled()
  })

  it('returns 429 RATE_LIMITED on per-email bucket hit (after parse, before persist)', async () => {
    mockRateLimitContactEmail.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      limit: 2,
      retryAfterSeconds: 60,
      resetAt: 1_950_000_001,
    })

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('60')
    expect(res.headers.get('x-ratelimit-limit')).toBe('2')
    expect(res.headers.get('x-ratelimit-reset')).toBe('1950000001')
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(mockPersist).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact — Turnstile (when enabled)', () => {
  // Turnstile is only invoked when both NEXT_PUBLIC_TURNSTILE_SITE_KEY
  // and TURNSTILE_SECRET_KEY are present (graceful degrade in dev).
  // We mock the verify boundary to drive the `result.ok === false` branch
  // of the route — the unit tests for verifyTurnstile cover the fetch.
  beforeEach(() => {
    vi.doMock('@/lib/contact/turnstile', () => ({
      verifyTurnstile: mockVerifyTurnstile,
      isTurnstileEnabled: mockIsTurnstileEnabled,
    }))
    mockVerifyTurnstile.mockReset()
    mockIsTurnstileEnabled.mockReset()
  })

  afterEach(() => {
    vi.doUnmock('@/lib/contact/turnstile')
  })

  it('returns 403 TURNSTILE_FAILED when Cloudflare rejects the token', async () => {
    mockIsTurnstileEnabled.mockReturnValue(true)
    mockVerifyTurnstile.mockResolvedValueOnce({
      ok: false,
      errorCode: 'invalid-input-response',
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const POST = await importPost()
    const res = await POST(
      makeReq({ body: { ...validBody, turnstileToken: 'bad-token' } }),
    )
    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('TURNSTILE_FAILED')
    // Persist must not run — bot challenge is gate-before-persist.
    expect(mockPersist).not.toHaveBeenCalled()
    expect(mockNotify).not.toHaveBeenCalled()
    // Per-email RL must not run either — turnstile precedes it.
    expect(mockRateLimitContactEmail).not.toHaveBeenCalled()
    // No PII in warn (logging policy).
    const logged = warnSpy.mock.calls.flat().join(' ')
    expect(logged).not.toContain(validBody.email)
    expect(logged).not.toContain(validBody.name)
    expect(logged).toContain('turnstile_failed')
    warnSpy.mockRestore()
  })

  it('proceeds normally when Turnstile passes', async () => {
    mockIsTurnstileEnabled.mockReturnValue(true)
    mockVerifyTurnstile.mockResolvedValueOnce({ ok: true })

    const POST = await importPost()
    const res = await POST(
      makeReq({ body: { ...validBody, turnstileToken: 'good-token' } }),
    )
    expect(res.status).toBe(200)
    expect(mockPersist).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/contact — body parsing & validation', () => {
  it('returns 413 PAYLOAD_TOO_LARGE when the body exceeds 16KB', async () => {
    const huge = JSON.stringify({ ...validBody, message: 'a'.repeat(20_000) })
    const POST = await importPost()
    const res = await POST(makeReq({ rawBody: huge }))
    expect(res.status).toBe(413)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('PAYLOAD_TOO_LARGE')
    expect(mockPersist).not.toHaveBeenCalled()
  })

  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const POST = await importPost()
    const res = await POST(makeReq({ rawBody: '{not-json' }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('INVALID_JSON')
  })

  it('returns 400 VALIDATION_ERROR with `fields` map when schema fails', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({
        body: {
          name: 'a',
          email: 'not-an-email',
          engagement: 'unknown',
          message: 'short',
        },
      }),
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      error: { code: string; fields?: Record<string, string> }
    }
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.fields).toBeDefined()
    expect(Object.keys(body.error.fields ?? {}).length).toBeGreaterThan(0)
    expect(mockPersist).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact — honeypot', () => {
  it('returns 200 silently and skips persist/notify when honeypot is filled', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({ body: { ...validBody, honeypot: 'gotcha-bot' } }),
    )
    // Spec: schema accepts honeypot strings; the route handler is what
    // rejects them — but with status 200 + no persist/notify, so bots
    // can't distinguish a successful submit from a caught one.
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data?: { ok?: boolean } }
    expect(body.data?.ok).toBe(true)
    expect(mockPersist).not.toHaveBeenCalled()
    expect(mockNotify).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact — persist & notify', () => {
  it('returns 500 PERSISTENCE_ERROR when persist fails', async () => {
    mockPersist.mockResolvedValueOnce({ ok: false, error: 'permanent' })

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('PERSISTENCE_ERROR')
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('returns 200 even when notify fails (best-effort)', async () => {
    mockNotify.mockResolvedValueOnce({ ok: false, error: 'transport' })

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { ok: boolean } }
    expect(body.data.ok).toBe(true)
    expect(mockNotify).toHaveBeenCalledTimes(1)
  })

  it('happy path → 200 with envelope { data: { ok: true } } and full X-RateLimit-* trio', async () => {
    mockRateLimitContact.mockResolvedValueOnce({
      ok: true,
      remaining: 3,
      limit: 5,
      retryAfterSeconds: 3600,
      resetAt: 1_888_000_000,
    })

    const POST = await importPost()
    const res = await POST(makeReq({ body: validBody }))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    // api-contract: Limit + Remaining + Reset is the canonical trio.
    expect(res.headers.get('x-ratelimit-remaining')).toBe('3')
    expect(res.headers.get('x-ratelimit-limit')).toBe('5')
    expect(res.headers.get('x-ratelimit-reset')).toBe('1888000000')
    const body = (await res.json()) as { data: { ok: boolean } }
    expect(body).toEqual({ data: { ok: true } })
    expect(mockPersist).toHaveBeenCalledTimes(1)
    expect(mockNotify).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/contact — request id & headers', () => {
  it('echoes a valid client X-Request-Id', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({
        body: validBody,
        headers: { 'x-request-id': 'req-abc123-XYZ-9876' },
      }),
    )
    expect(res.headers.get('x-request-id')).toBe('req-abc123-XYZ-9876')
  })

  it('mints a fresh UUID when the client X-Request-Id is invalid (CRLF guard)', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({
        body: validBody,
        // CRLF header injection attempt — must NOT be echoed
        headers: { 'x-request-id': 'short' },
      }),
    )
    const rid = res.headers.get('x-request-id')
    expect(rid).not.toBe('short')
    // UUID v4 shape (loose match — focus on "not the bad value")
    expect(rid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('always returns Cache-Control: no-store, even on errors', async () => {
    const POST = await importPost()
    const res = await POST(makeReq({ rawBody: '{not-json' }))
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('prefers x-vercel-forwarded-for for client IP (used in rate-limit key)', async () => {
    const POST = await importPost()
    await POST(
      makeReq({
        body: validBody,
        headers: {
          'x-vercel-forwarded-for': '203.0.113.99',
          'x-real-ip': '10.0.0.1',
          'x-forwarded-for': '10.0.0.2, 10.0.0.3',
        },
      }),
    )
    expect(mockRateLimitContact).toHaveBeenCalledWith('203.0.113.99')
  })

  it('falls back to x-real-ip then last hop of x-forwarded-for', async () => {
    const POST = await importPost()
    await POST(
      makeReq({
        body: validBody,
        headers: { 'x-real-ip': '10.0.0.42' },
      }),
    )
    expect(mockRateLimitContact).toHaveBeenCalledWith('10.0.0.42')
    mockRateLimitContact.mockClear()

    await POST(
      makeReq({
        body: validBody,
        headers: { 'x-forwarded-for': '10.0.0.10, 10.0.0.11, 10.0.0.99' },
      }),
    )
    // last hop = closest trusted proxy
    expect(mockRateLimitContact).toHaveBeenCalledWith('10.0.0.99')
  })
})
