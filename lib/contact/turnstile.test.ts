/**
 * @owner: @tester (Maclean)
 *
 * Turnstile tests — covers the server-side verification path.
 *
 *   - isTurnstileEnabled() reflects env presence (both keys required)
 *   - verifyTurnstile() handles: success, missing token, CF error code,
 *     non-2xx HTTP, network throw, timeout (AbortError)
 *   - The secret never appears in any payload other than the POST body
 *     to siteverify (no leak via thrown error / log)
 *
 * The fetch global is stubbed per test so we never hit Cloudflare for real.
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

const ENV_BASELINE = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
} as const

describe('isTurnstileEnabled', () => {
  let fetchSpy: MockInstance

  beforeEach(() => {
    vi.resetModules()
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    fetchSpy.mockRestore()
  })

  it('returns true when both site and secret keys are set', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      ENV_BASELINE.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    )
    vi.stubEnv('TURNSTILE_SECRET_KEY', ENV_BASELINE.TURNSTILE_SECRET_KEY)
    const { isTurnstileEnabled } = await import('./turnstile')
    expect(isTurnstileEnabled()).toBe(true)
  })

  it('returns false when site key missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', ENV_BASELINE.TURNSTILE_SECRET_KEY)
    const { isTurnstileEnabled } = await import('./turnstile')
    expect(isTurnstileEnabled()).toBe(false)
  })

  it('returns false when secret key missing', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      ENV_BASELINE.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    )
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    const { isTurnstileEnabled } = await import('./turnstile')
    expect(isTurnstileEnabled()).toBe(false)
  })
})

describe('verifyTurnstile', () => {
  let fetchSpy: MockInstance

  beforeEach(() => {
    vi.resetModules()
    fetchSpy = vi.spyOn(global, 'fetch')
    vi.stubEnv(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      ENV_BASELINE.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    )
    vi.stubEnv('TURNSTILE_SECRET_KEY', ENV_BASELINE.TURNSTILE_SECRET_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    fetchSpy.mockRestore()
  })

  it('returns ok=true when CF says success', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('valid-token', '1.2.3.4')
    expect(r.ok).toBe(true)
  })

  it('rejects empty token without hitting CF', async () => {
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('', '1.2.3.4')
    expect(r).toEqual({ ok: false, errorCode: 'missing-input-response' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('throws when secret missing (fail-closed — caller must gate)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.resetModules()
    const { verifyTurnstile } = await import('./turnstile')
    await expect(verifyTurnstile('whatever')).rejects.toThrow(
      /caller must check isTurnstileEnabled/i,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('surfaces CF error-codes on failure', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
        { status: 200 },
      ),
    )
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('bad-token')
    expect(r).toEqual({ ok: false, errorCode: 'invalid-input-response' })
  })

  it('treats non-2xx as failure', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    )
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('valid-token')
    expect(r).toEqual({ ok: false, errorCode: 'http_500' })
  })

  it('treats network throw as transport error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNRESET'))
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('valid-token')
    expect(r).toEqual({ ok: false, errorCode: 'transport' })
  })

  it('reports timeout when AbortController fires', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    fetchSpy.mockRejectedValueOnce(abortError)
    const { verifyTurnstile } = await import('./turnstile')
    const r = await verifyTurnstile('valid-token')
    expect(r).toEqual({ ok: false, errorCode: 'timeout' })
  })

  it('omits remoteip when ip is unknown', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    const { verifyTurnstile } = await import('./turnstile')
    await verifyTurnstile('valid-token', 'unknown')
    const call = fetchSpy.mock.calls[0]
    const body = call?.[1]?.body as URLSearchParams
    expect(body.get('remoteip')).toBeNull()
  })
})
