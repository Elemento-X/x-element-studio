import { NextResponse, type NextRequest } from 'next/server'

// Routing Middleware — generates a per-request CSP nonce and injects a
// strict Content-Security-Policy in production.
//
// Why a middleware (and not just next.config.mjs `headers()`):
//   The static-headers approach can't generate a per-request nonce, so
//   the CSP had to fall back to `'unsafe-inline'` + `'unsafe-eval'` in
//   script-src (any XSS would amplify into full RCE-equivalent). With a
//   middleware we can mint a nonce, propagate it to Next so internal
//   inline scripts inherit it, and lock the CSP to nonce-based.
//
// Pattern: "strict-dynamic with fallback" recommended by Google CSP team
//   and OWASP. Modern browsers honor `'nonce-X' 'strict-dynamic'` and
//   ignore the `'unsafe-inline'` fallback. Older browsers without
//   strict-dynamic support fail-open to `'unsafe-inline'` instead of
//   breaking the site outright.
//
// Dev: skip CSP entirely. Turbopack/HMR rely on eval and inline scripts
//   that don't carry our nonce; trying to enforce CSP in dev makes the
//   page unrecoverable. Dev parity with prod isn't worth the boot pain.

const isProd = process.env.NODE_ENV === 'production'

export function middleware(request: NextRequest) {
  if (!isProd) return NextResponse.next()

  // 16-byte random nonce, base64. crypto.randomUUID() also works but
  // randomBytes gives a slightly tighter base64 surface.
  const nonceBuffer = new Uint8Array(16)
  crypto.getRandomValues(nonceBuffer)
  const nonce = btoa(String.fromCharCode(...nonceBuffer))

  // Cloudflare Turnstile loads its widget script + iframe from
  // challenges.cloudflare.com. Allowlisted explicitly so the CSP holds
  // even when 'strict-dynamic' isn't honored by older browsers (the
  // legacy 'unsafe-inline' fallback wouldn't cover a 3rd-party host).
  const cspHeader = [
    "default-src 'self'",
    // 'strict-dynamic' lets scripts loaded by trusted (nonce'd) scripts
    // run without their own nonce. 'unsafe-inline' is the legacy
    // fallback; modern browsers ignore it when nonce + strict-dynamic
    // are present. challenges.cloudflare.com is the Turnstile origin.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://challenges.cloudflare.com`,
    // Style-src keeps 'unsafe-inline' deliberately. Next.js + CSS
    // Modules emit critical inline <style> blocks during streaming;
    // forcing nonce on them would require non-trivial wiring with no
    // matching threat (inline-style XSS is a much narrower vector
    // than inline-script XSS).
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    // Turnstile makes a verify call from the widget to its own origin.
    "connect-src 'self' https://challenges.cloudflare.com",
    // Turnstile renders its challenge inside an iframe.
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  // Propagate the nonce via request header so Next.js (and any layout
  // that reads `headers()`) can attach it to internal inline scripts.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also surface the CSP header on the response so the browser actually
  // enforces it.
  response.headers.set('Content-Security-Policy', cspHeader)
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
