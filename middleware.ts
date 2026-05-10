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
//     - Or we move to a stack where it is supported (webpack mode is
//       still available via `next build --webpack`, kept as escape
//       hatch in case the CSP regression becomes unacceptable)
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

export function middleware(_request: NextRequest) {
  if (!isProd) return NextResponse.next()

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', CSP_HEADER)
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
