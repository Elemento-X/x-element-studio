import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/config'

// Routing Middleware — chains:
//   1. next-intl locale routing (rewrite/redirect to `/[locale]/…`)
//   2. CSP injection on the response (production only)
//
// next-intl is the source of truth for the response object once the
// request hits a locale-aware route. We run it first, then layer our
// security headers onto whatever response it produced.
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
//     - Single allowed `dangerouslySetInnerHTML` use: JSON-LD in
//       app/[locale]/layout.tsx (Schema.org Organization + WebSite).
//       Payload is fully code-controlled (no user input), `<` is
//       escaped to `\\u003c` against `</script>` injection, and the
//       site-wide ESLint rule `react/no-danger: 'error'` gates any
//       new use behind a block-level disable with audit reference.
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

const intlMiddleware = createIntlMiddleware(routing)

export function middleware(request: NextRequest): NextResponse {
  // Step 1: locale routing. next-intl returns a NextResponse that may
  // be a redirect (e.g. `/` → `/pt-br`), a rewrite, or `next()`.
  const response = intlMiddleware(request) as NextResponse

  // Step 2: CSP only in prod. Dev keeps the page recoverable under
  // Turbopack/HMR (which rely on eval + inline scripts without nonce).
  if (!isProd) return response

  // 16-byte random nonce for the SHADOW (Report-Only) policy. The
  // active enforced policy does not use a nonce — see history note.
  const nonceBuffer = new Uint8Array(16)
  crypto.getRandomValues(nonceBuffer)
  const nonce = btoa(String.fromCharCode(...nonceBuffer))

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
//
// `icon` is excluded explicitly: app/icon.tsx generates the route
// `/icon` for the favicon. Without this, the next-intl middleware
// would try to treat `/icon` as a locale path → redirect to
// `/<locale>/icon` which doesn't exist → browser logs a 404 console
// error that the smoke E2E spec catches as a regression. Same
// reasoning for sitemap.xml/robots.txt when F4.4 SEO adds them.
export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|sitemap.xml|robots.txt|fonts|assets).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
        // RSC payload fetches (Next 16 hits `/?_rsc=...` to grab the
        // server-component tree). Running the i18n middleware on those
        // ends up redirecting the RSC request and the browser logs a
        // 404 console error. Skipping middleware on RSC traffic is
        // correct: no HTML is rendered, no CSP / locale routing needed.
        { type: 'header', key: 'rsc' },
        { type: 'header', key: 'next-router-state-tree' },
      ],
    },
  ],
}
