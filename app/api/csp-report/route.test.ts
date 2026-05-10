/**
 * @owner: @tester (Maclean)
 *
 * /api/csp-report — receiver of browser CSP violation reports for the
 * shadow Report-Only policy. Tests verify:
 *
 *   - Legacy `application/csp-report` body parsed and logged
 *   - Legacy CT with `; charset=utf-8` suffix still matches (RFC 7231)
 *   - Modern `application/reports+json` array body parsed and logged
 *   - Body cap enforced (413) without parsing
 *   - Empty body returns 204 (browser ping with nothing to say)
 *   - Malformed JSON returns 400
 *   - Logs never include full URLs (host only — anti PII/session leak)
 *   - Logs sanitize \r\n\t in user-controlled fields (anti-injection)
 *   - Per-IP rate limit: 60/min; 61st silently 429s (no log)
 *   - Loose CT match `application/csp-report-fake` does NOT match legacy
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { _resetCspRateLimitForTests } from '@/lib/csp/rate-limit'

function makeRequest(
  body: string,
  contentType = 'application/csp-report',
  ip = '203.0.113.10',
): Request {
  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'x-forwarded-for': ip,
    },
    body,
  })
}

describe('/api/csp-report', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    _resetCspRateLimitForTests()
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
  })

  it('accepts a legacy csp-report body and logs host-only details', async () => {
    const body = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://elemento-x.com/?utm=secret',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/inject.js',
        'source-file': 'https://elemento-x.com/page',
      },
    })

    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(body))
    expect(res.status).toBe(204)

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(infoSpy.mock.calls[0]?.[0] as string)
    expect(logged).toMatchObject({
      tag: 'csp:report-only',
      directive: 'script-src-elem',
      document: 'elemento-x.com',
      blocked: 'evil.example',
    })
    // Anti-PII: query string and path MUST NOT leak
    const raw = infoSpy.mock.calls[0]?.[0] as string
    expect(raw).not.toContain('utm=secret')
    expect(raw).not.toContain('/page')
  })

  it('matches legacy CT with charset suffix (RFC 7231 parameters)', async () => {
    const body = JSON.stringify({
      'csp-report': { 'effective-directive': 'script-src' },
    })
    const res = await POST(
      // @ts-expect-error — Next route handler accepts plain Request in tests
      makeRequest(body, 'application/csp-report; charset=utf-8'),
    )
    expect(res.status).toBe(204)
    expect(infoSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(infoSpy.mock.calls[0]?.[0] as string)
    expect(logged.directive).toBe('script-src')
  })

  it('does NOT match a look-alike like application/csp-report-fake', async () => {
    const body = JSON.stringify({
      'csp-report': { 'effective-directive': 'script-src' },
    })
    const res = await POST(
      // @ts-expect-error — Next route handler accepts plain Request in tests
      makeRequest(body, 'application/csp-report-fake'),
    )
    expect(res.status).toBe(204)
    // Falls into the unknown_shape branch (no array, not modern reports+json)
    const logged = JSON.parse(infoSpy.mock.calls[0]?.[0] as string)
    expect(logged.event).toBe('unknown_shape')
    expect(logged.directive).toBeUndefined()
  })

  it('accepts a modern reports+json array and logs each csp-violation', async () => {
    const body = JSON.stringify([
      {
        type: 'csp-violation',
        url: 'https://elemento-x.com/',
        body: {
          documentURL: 'https://elemento-x.com/',
          blockedURL: 'inline',
          effectiveDirective: 'script-src-elem',
          violatedDirective: 'script-src',
          disposition: 'report',
        },
      },
      {
        type: 'deprecation', // ignored — not a csp-violation
        body: { reason: 'whatever' },
      },
    ])

    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(body, 'application/reports+json'))
    expect(res.status).toBe(204)

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(infoSpy.mock.calls[0]?.[0] as string)
    expect(logged).toMatchObject({
      tag: 'csp:report-only',
      directive: 'script-src-elem',
      disposition: 'report',
    })
  })

  it('escapes \\r\\n\\t in user fields (structured JSON neutralizes log injection)', async () => {
    const body = JSON.stringify([
      {
        type: 'csp-violation',
        body: {
          documentURL: 'https://elemento-x.com/',
          // Crafted payload: tries to forge a fake log line
          effectiveDirective:
            'script-src\n[csp:report-only] directive=FAKE document=evil.com',
          disposition: 'report\nfaked',
        },
      },
    ])

    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(body, 'application/reports+json'))
    expect(res.status).toBe(204)

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const raw = infoSpy.mock.calls[0]?.[0] as string
    // The serialized log line MUST be a single line — JSON.stringify
    // escapes newlines as `\n` (literal backslash-n), so the raw output
    // contains no actual newline character that downstream sinks could
    // split on.
    expect(raw.split('\n')).toHaveLength(1)
    expect(raw.split('\r')).toHaveLength(1)
    // The forged content remains as a single string FIELD — when JSON
    // is parsed downstream, it is exactly one record with one directive
    // value, not two. There is no key/value text format anymore for an
    // attacker to forge a second entry within.
    const logged = JSON.parse(raw)
    expect(logged.directive).toContain('script-src')
    expect(logged.directive).toContain('FAKE') // payload preserved intact in field
    expect(logged.tag).toBe('csp:report-only') // single record
    // Crucially, there is no second log call.
    expect(infoSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects bodies larger than 8 KB with 413 (no parse, no log)', async () => {
    const big = 'x'.repeat(8 * 1024 + 1)
    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(big))
    expect(res.status).toBe(413)
    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('returns 204 on empty body (browser ping with nothing to say)', async () => {
    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(''))
    expect(res.status).toBe(204)
    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('returns 400 on malformed JSON', async () => {
    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest('not json {'))
    expect(res.status).toBe(400)
    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('buckets IPv6 by /64 prefix — rotation within own /64 cannot bypass the limit', async () => {
    // Threat: an attacker with a residential IPv6 /64 rotates through
    // their own 2^64 addresses to bypass per-IP rate limiting. The
    // limiter must collapse the prefix.
    const body = JSON.stringify({
      'csp-report': { 'effective-directive': 'script-src' },
    })
    const prefix = '2001:db8:1:1' // /64 prefix the "attacker" owns

    // 60 requests across DIFFERENT addresses inside the same /64 must
    // all share a bucket: the 61st (any address still within the /64)
    // gets 429.
    for (let i = 0; i < 60; i++) {
      const ip = `${prefix}::${i.toString(16)}`
      const res = await POST(
        // @ts-expect-error — Next route handler accepts plain Request in tests
        makeRequest(body, 'application/csp-report', ip),
      )
      expect(res.status).toBe(204)
    }

    // 61st — different address, same /64
    const flooded = await POST(
      // @ts-expect-error — Next route handler accepts plain Request in tests
      makeRequest(body, 'application/csp-report', `${prefix}::ffff`),
    )
    expect(flooded.status).toBe(429)

    // Different /64 (fully separate subscriber) is unaffected
    const otherPrefix = await POST(
      // @ts-expect-error — Next route handler accepts plain Request in tests
      makeRequest(body, 'application/csp-report', '2001:db8:2:2::1'),
    )
    expect(otherPrefix.status).toBe(204)
  })

  it('rate-limits flood per IP-hash silently after 60/min (61st returns 429)', async () => {
    const body = JSON.stringify({
      'csp-report': { 'effective-directive': 'script-src' },
    })
    const ip = '198.51.100.7'

    // 60 requests pass
    for (let i = 0; i < 60; i++) {
      // @ts-expect-error — Next route handler accepts plain Request in tests
      const res = await POST(makeRequest(body, 'application/csp-report', ip))
      expect(res.status).toBe(204)
    }
    expect(infoSpy).toHaveBeenCalledTimes(60)

    // 61st: 429 silent (no additional log)
    // @ts-expect-error — Next route handler accepts plain Request in tests
    const res = await POST(makeRequest(body, 'application/csp-report', ip))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBeTruthy()
    expect(infoSpy).toHaveBeenCalledTimes(60) // unchanged — 429 is silent

    // Different IP-hash still passes
    const otherRes = await POST(
      // @ts-expect-error — Next route handler accepts plain Request in tests
      makeRequest(body, 'application/csp-report', '203.0.113.99'),
    )
    expect(otherRes.status).toBe(204)
  })
})
