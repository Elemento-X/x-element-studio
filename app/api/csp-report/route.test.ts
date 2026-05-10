/**
 * @owner: @tester (Maclean)
 *
 * /api/csp-report — receiver of browser CSP violation reports for the
 * shadow Report-Only policy. Tests verify:
 *
 *   - Legacy `application/csp-report` body parsed and logged
 *   - Modern `application/reports+json` array body parsed and logged
 *   - Body cap enforced (413) without parsing
 *   - Empty body returns 204 (browser ping with nothing to say)
 *   - Malformed JSON returns 400
 *   - Logs never include full URLs (host only — anti PII/session leak)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

function makeRequest(
  body: string,
  contentType = 'application/csp-report',
): Request {
  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  })
}

describe('/api/csp-report', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
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
    const logged = infoSpy.mock.calls[0]?.[0] as string
    expect(logged).toContain('directive=script-src-elem')
    expect(logged).toContain('document=elemento-x.com')
    expect(logged).toContain('blocked=evil.example')
    // Anti-PII: query string MUST NOT leak into the log line
    expect(logged).not.toContain('utm=secret')
    expect(logged).not.toContain('/page')
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
    expect(infoSpy.mock.calls[0]?.[0]).toContain('directive=script-src-elem')
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
})
