// Security headers applied globally. CSP starts permissive (`unsafe-inline`
// in script-src) because Next.js 16 production embeds inline runtime hooks;
// tightening to a nonce-based CSP requires a Routing Middleware that injects
// per-request nonce — tracked as Bucket B follow-up. Other headers are
// strict from the start.
const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Keep info/warn/error in prod: lib/contact uses console.info for
    // structured operational logs ([contact:persist] ok, [contact:notify] ok,
    // [contact] honeypot_hit). Stripping them blinds the operator to
    // throughput in prod. Only debug/log/trace get removed.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn', 'info'] }
        : false,
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
