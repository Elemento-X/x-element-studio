import { type NextRequest, NextResponse } from 'next/server'
import { rateLimitCspReport } from '@/lib/csp/rate-limit'

/**
 * CSP violation report receiver (shadow / Report-Only mode).
 *
 * Why this exists: middleware.ts ships a permissive CSP today
 * (`script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com`)
 * because Next 16 + Turbopack does not propagate the nonce. To keep
 * visibility on what a tighter CSP WOULD block, we ship a
 * `Content-Security-Policy-Report-Only` header alongside the active
 * one, configured with the strict `nonce + 'strict-dynamic'` directive.
 * Browsers that violate the strict policy POST a JSON report here.
 *
 * Format: browsers send `application/csp-report` (legacy `report-uri`)
 * or `application/reports+json` (modern `report-to` / Reporting API).
 * We accept both, log a redacted summary, and 204.
 *
 * Hardening (added after @security audit 2026-05-10 #2):
 *  - Rate limit: 60 reports/minute/IP-hash (defense vs denial-of-wallet
 *    flood targeting log pipeline). 429 silently — no log on hit.
 *  - Structured JSON logs: every line is `console.info(JSON.stringify(...))`,
 *    not key=value text. JSON encoding natively escapes \r\n\t and quote
 *    chars in user-controlled fields, so a crafted POST cannot forge a
 *    fake log entry that downstream sinks (Vercel/Datadog) parse as a
 *    separate event.
 *  - Field length cap: each user-controlled string clipped to 64 chars
 *    before logging (prevents log bloat under flood + body-cap'd body).
 *  - Content-Type discrimination: prefix-match anchored on `;`, not
 *    `includes` — `application/csp-report-fake` no longer matches.
 *
 * Logging policy: never persist the full report (could include URLs
 * that leak query params from the user's session). Log only the
 * directive that fired, the violated source URI host (not full path),
 * and the document URI host. No payload bodies. No PII.
 */

export const runtime = 'nodejs'

const MAX_BODY_SIZE = 8 * 1024 // CSP reports are tiny; 8 KB is generous

interface LegacyReport {
  'csp-report'?: {
    'document-uri'?: string
    'violated-directive'?: string
    'effective-directive'?: string
    'blocked-uri'?: string
    'source-file'?: string
    'status-code'?: number
  }
}

interface ModernReport {
  type?: string
  url?: string
  body?: {
    documentURL?: string
    blockedURL?: string
    effectiveDirective?: string
    violatedDirective?: string
    sourceFile?: string
    disposition?: string
  }
}

// Truncate to host only — full URLs may carry query params with PII or
// session-bound values that we never want in logs.
function hostOf(input?: string): string {
  if (!input) return 'none'
  try {
    return new URL(input).host || 'none'
  } catch {
    return 'invalid'
  }
}

// Clip a user-controlled string field before it goes into the log
// payload. JSON encoding (below) escapes \r\n\t and quotes natively;
// length still matters so a crafted body can't bloat every log entry.
const FIELD_MAX = 64

function clip(input: string | undefined, max = FIELD_MAX): string {
  if (!input) return 'unknown'
  return String(input).slice(0, max)
}

function getClientIp(req: NextRequest): string {
  // Same precedence as /api/contact: prefer Vercel's verified header,
  // then x-real-ip, then x-forwarded-for last-hop, else 'unknown'.
  const vercel = req.headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const ip = vercel.split(',')[0]?.trim()
    if (ip) return ip
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const hops = xff
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
    const last = hops[hops.length - 1]
    if (last) return last
  }
  return 'unknown'
}

function logLegacy(report: LegacyReport['csp-report']): void {
  if (!report) return
  console.info(
    JSON.stringify({
      tag: 'csp:report-only',
      directive: clip(
        report['effective-directive'] ?? report['violated-directive'],
      ),
      document: hostOf(report['document-uri']),
      blocked: hostOf(report['blocked-uri']),
      source: hostOf(report['source-file']),
    }),
  )
}

function logModern(reports: ModernReport[]): void {
  for (const r of reports) {
    if (r.type !== 'csp-violation') continue
    const body = r.body ?? {}
    console.info(
      JSON.stringify({
        tag: 'csp:report-only',
        directive: clip(body.effectiveDirective ?? body.violatedDirective),
        document: hostOf(body.documentURL),
        blocked: hostOf(body.blockedURL),
        source: hostOf(body.sourceFile),
        disposition: clip(body.disposition ?? 'report', 16),
      }),
    )
  }
}

// Strict prefix-match for Content-Type. Per RFC 7231, Content-Type may
// include parameters (`; charset=utf-8`, `; boundary=...`) — accept
// either the bare media type or the media type followed by a `;`.
// Avoids false matches like `application/csp-report-fake` that
// `includes` would accept.
function ctIs(ct: string, mediaType: string): boolean {
  return ct === mediaType || ct.startsWith(`${mediaType};`)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit FIRST, before any work that costs CPU/memory/log volume.
  // 429 is silent on purpose — paying log cost for what we are limiting
  // would defeat the protection.
  const ip = getClientIp(req)
  const rl = rateLimitCspReport(ip)
  if (!rl.ok) {
    return new NextResponse(null, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSeconds) },
    })
  }

  // Reject bodies larger than the cap before parsing — protects against
  // a noisy/abusive client filling up the log pipeline.
  const text = await req.text()
  if (text.length > MAX_BODY_SIZE) {
    return new NextResponse(null, { status: 413 })
  }

  // Empty body = browser pinged but had nothing to say. Treat as OK.
  if (!text) return new NextResponse(null, { status: 204 })

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const contentTypeRaw = req.headers.get('content-type') ?? ''
  // Lowercase for case-insensitive prefix match (HTTP media types are
  // case-insensitive per RFC 7231).
  const contentType = contentTypeRaw.toLowerCase().trim()

  if (ctIs(contentType, 'application/csp-report')) {
    logLegacy((parsed as LegacyReport)['csp-report'])
  } else if (
    ctIs(contentType, 'application/reports+json') ||
    Array.isArray(parsed)
  ) {
    const reports = Array.isArray(parsed)
      ? (parsed as ModernReport[])
      : [parsed as ModernReport]
    logModern(reports)
  } else {
    // Unknown shape — log a single line marker so we know browsers in
    // the wild are sending something we don't recognize.
    console.info(
      JSON.stringify({
        tag: 'csp:report-only',
        event: 'unknown_shape',
        ct: clip(contentType, 32),
      }),
    )
  }

  return new NextResponse(null, { status: 204 })
}
