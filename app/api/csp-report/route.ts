import { type NextRequest, NextResponse } from 'next/server'

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

function logLegacy(report: LegacyReport['csp-report']): void {
  if (!report) return
  console.info(
    `[csp:report-only] directive=${report['effective-directive'] ?? report['violated-directive'] ?? 'unknown'}` +
      ` document=${hostOf(report['document-uri'])}` +
      ` blocked=${hostOf(report['blocked-uri'])}` +
      ` source=${hostOf(report['source-file'])}`,
  )
}

function logModern(reports: ModernReport[]): void {
  for (const r of reports) {
    if (r.type !== 'csp-violation') continue
    const body = r.body ?? {}
    console.info(
      `[csp:report-only] directive=${body.effectiveDirective ?? body.violatedDirective ?? 'unknown'}` +
        ` document=${hostOf(body.documentURL)}` +
        ` blocked=${hostOf(body.blockedURL)}` +
        ` source=${hostOf(body.sourceFile)}` +
        ` disposition=${body.disposition ?? 'report'}`,
    )
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/csp-report')) {
    logLegacy((parsed as LegacyReport)['csp-report'])
  } else if (
    contentType.includes('application/reports+json') ||
    Array.isArray(parsed)
  ) {
    const reports = Array.isArray(parsed)
      ? (parsed as ModernReport[])
      : [parsed as ModernReport]
    logModern(reports)
  } else {
    // Unknown shape — log a single line marker so we know browsers in
    // the wild are sending something we don't recognize.
    console.info(`[csp:report-only] unknown_shape ct=${hostOf(contentType)}`)
  }

  return new NextResponse(null, { status: 204 })
}
