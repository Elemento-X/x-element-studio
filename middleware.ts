import { NextResponse, type NextRequest } from 'next/server'

// Routing Middleware — injects a static Content-Security-Policy in
// production builds.
//
// History note (security trade-off, intentional):
//   The first iteration of this file used a per-request nonce + the
//   `'strict-dynamic'` directive (Google CSP team / OWASP recommended
//   pattern). That broke under Next 16 + Turbopack production builds:
//   Turbopack injects its chunk-loader inline scripts without picking
//   up the nonce from the `x-nonce` request header (the propagation
//   that works under webpack does NOT work under Turbopack). With
//   `'strict-dynamic'` set, host-based allowlisting (`'self'`) is
//   disabled, so every `_next/static/chunks/*.js` was blocked by the
//   browser. The CI E2E smoke test caught it.
//
//   We degraded to a static CSP that is compatible with Turbopack:
//     - `'self'` allowlist for chunks (no strict-dynamic).
//     - `'unsafe-inline'` for inline scripts that Next/Turbopack
//        injects without nonce (chunk loader, font preload bootstrap).
//     - `https://challenges.cloudflare.com` for Turnstile.
//
//   We do NOT include a nonce in `script-src`, because the moment a
//   nonce is present in the directive, modern browsers IGNORE
//   `'unsafe-inline'` — and the inline scripts Next emits without a
//   nonce break again.
//
//   Trade-off accepted: an XSS-injected inline `<script>` would now
//   execute (was blocked by nonce before). Mitigations still in place:
//     - All user input is server-validated via Zod (lib/contact/schema.ts)
//     - DOMPurify-style escaping is N/A (we render via React; React
//       escapes by default)
//     - No `dangerouslySetInnerHTML` anywhere in the codebase
//     - Cross-origin script loading is still blocked (only `'self'`
//       and the Turnstile origin allowed)
//
//   Re-evaluate when:
//     - Next/Turbopack adds nonce propagation in a future minor
//     - Or we move to a stack where it is supported. The webpack mode
//       remains available as an escape hatch via `next build --webpack`.
//       Validated locally on Next 16.2.6 (2026-05-10): build green,
//       all routes (incl. /api/csp-report) emitted, no CSP regression
//       observed. If the trade-off becomes unacceptable, switch the
//       CI build step to `--webpack` and re-enable the strict policy
//       in this file.
//
//   Shadow CSP: alongside the active CSP we ship a
//   `Content-Security-Policy-Report-Only` header that mimics the strict
//   nonce + 'strict-dynamic' policy. Browsers do not enforce it but
//   POST violation reports to /api/csp-report. This keeps a signal
//   loop: when Next/Turbopack starts propagating nonce correctly, we
//   will see the strict policy stop firing reports and can flip back.
//
// Dev: skip CSP entirely. Turbopack/HMR rely on eval and inline scripts
//   that don't carry our nonce; trying to enforce CSP in dev makes the
//   page unrecoverable. Dev parity with prod isn't worth the boot pain.

const isProd = process.env.NODE_ENV === 'production'

// Cloudflare Turnstile loads its widget script + iframe + verify call
// from challenges.cloudflare.com. Allowlisted across script-src,
// connect-src, and frame-src so the widget renders, fetches its
// challenge, and posts back to siteverify.
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  // Style-src keeps 'unsafe-inline' deliberately. Next.js + CSS
  // Modules emit critical inline <style> blocks during streaming.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

// Shadow strict policy — what we WOULD ship if Turbopack propagated
// the nonce. Per-request nonce is generated below. Reports go to the
// `csp-endpoint` group declared in the Reporting-Endpoints header,
// which the browser POSTs to /api/csp-report.
function buildReportOnlyCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // NOTE: `upgrade-insecure-requests` is intentionally OMITTED here.
    // It is an enforce-only directive — browsers log a console error
    // ("directive ignored when delivered in a report-only policy")
    // every time it appears in CSP-Report-Only, which the smoke E2E
    // surfaces as a regression. The active enforced CSP still carries
    // it; the shadow policy is purely about catching script-src/etc
    // violations, where this directive plays no role anyway.
    //
    // Modern Reporting API — paired with `Reporting-Endpoints` below.
    'report-to csp-endpoint',
    // Legacy fallback for browsers that still honor `report-uri`.
    'report-uri /api/csp-report',
  ].join('; ')
}

export function middleware(_request: NextRequest) {
  if (!isProd) return NextResponse.next()

  // 16-byte random nonce for the SHADOW (Report-Only) policy. The
  // active enforced policy does not use a nonce — see history note.
  const nonceBuffer = new Uint8Array(16)
  crypto.getRandomValues(nonceBuffer)
  const nonce = btoa(String.fromCharCode(...nonceBuffer))

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', CSP_HEADER)
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    buildReportOnlyCsp(nonce),
  )
  // Declare the endpoint group named `csp-endpoint` referenced by
  // `report-to` above. Same-origin endpoint — no third party.
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"')
  return response
}

// Exclude static assets and API routes — they don't render HTML so
// don't need CSP. The `missing` clauses avoid running middleware on
// Next.js's prefetch traffic, which doesn't render either.
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|fonts|assets).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
