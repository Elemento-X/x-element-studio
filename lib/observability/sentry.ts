import 'server-only'

/**
 * Sentry stub. No-op when SENTRY_DSN is not set; loads `@sentry/nextjs`
 * lazily when it is.
 *
 * Why this shape:
 *  - We do NOT want Sentry as a hard dep yet. It adds runtime weight,
 *    requires DSN management, and the form is small enough to run on
 *    Vercel logs alone for the first few weeks.
 *  - But we want the *integration point* in place so wiring it later is
 *    a one-PR change (install dep + set DSN) rather than a refactor.
 */

/**
 * To enable in production:
 *  1. `npm install @sentry/nextjs`
 *  2. Set SENTRY_DSN in Vercel env (Production scope).
 *  3. Add `import { initSentry } from '@/lib/observability/sentry'` to
 *     `instrumentation.ts` (Next.js instrumentation hook) and call
 *     `await initSentry()` in `register()`.
 *  4. Optionally add `sentry.client.config.ts` and `sentry.server.config.ts`
 *     per Sentry Next.js docs for SSR/edge support.
 *
 * Until then, this module is a no-op and adds zero runtime weight.
 */

// Minimal structural type — avoids depending on @sentry/types until
// the package is installed. Matches the subset we mutate in beforeSend.
interface SentryEvent {
  request?: {
    data?: unknown
    cookies?: unknown
    headers?: Record<string, unknown>
  }
}

let _initialized = false

export async function initSentry(): Promise<void> {
  if (_initialized) return
  _initialized = true

  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    // No DSN — silent no-op. Cold-start hot path; do not log here.
    return
  }

  try {
    // Dynamic import: keeps `@sentry/nextjs` out of the bundle when DSN
    // is absent (which is most of dev/preview/test).
    // @ts-expect-error — package not installed yet; this is a stub. When
    // enabling, install `@sentry/nextjs` and remove this directive.
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
      tracesSampleRate: 0.1,
      // Scrub PII at the SDK level. The /api/contact route already avoids
      // logging PII, but defense-in-depth: if a future log accidentally
      // includes a body field, this strips it before transmission.
      beforeSend(event: SentryEvent) {
        if (event.request) {
          delete event.request.data
          delete event.request.cookies
          if (event.request.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
          }
        }
        return event
      },
    })

    console.info('[observability] sentry initialized')
  } catch (err) {
    const errType = err instanceof Error ? err.name : 'unknown'
    console.warn(`[observability] sentry_init_failed type=${errType}`)
  }
}

/**
 * Capture a non-fatal error. No-op when Sentry is not initialized.
 *
 * Use sparingly — most contact-form errors already log to Vercel and are
 * picked up by `[contact:*]` filters. Reach for this when an error needs
 * a real alert (e.g. `permanent_error` from Notion = operator action
 * required NOW).
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!_initialized || !process.env.SENTRY_DSN) return
  try {
    // @ts-expect-error — see initSentry.
    void import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(err, { extra: context })
    })
  } catch {
    // Swallow — failing the failure is just noise.
  }
}
