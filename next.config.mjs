// Static security headers applied globally via Next's headers() config.
// Content-Security-Policy lives in middleware.ts (it needs a per-request
// nonce, which a static config can't generate). Everything else is
// header-static and goes here.
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
