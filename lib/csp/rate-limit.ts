import 'server-only'
import { hashIp } from '@/lib/contact/rate-limit'

/**
 * Rate limit for the CSP-Report receiver.
 *
 * This is intentionally a standalone, in-memory limiter — distinct from
 * the contact-form limiter (Upstash + memory fallback). Reports are a
 * best-effort observability signal: if Upstash were a hard dependency
 * here, an Upstash outage would either fail-open (no protection) or
 * degrade to per-process memory anyway. Going straight to in-memory
 * is simpler and matches the threat model.
 *
 * Threat: anonymous flood of POSTs to `/api/csp-report` to drain log
 * pipeline budget (denial-of-wallet) or to drown out legitimate CSP
 * reports during a real attack. 60 reports/minute/IP-hash is generous
 * for browsers (typical first-paint emits 0–2 reports, retries cap at
 * a handful) and tight enough to make flooding obvious.
 *
 * Privacy: IPs are SHA-256-hashed via `hashIp` before bucketing —
 * plaintext IP never reaches this module's state.
 *
 * Per-process memory: deliberate. Multiple Vercel instances won't
 * share state, but the alternative (Upstash round-trip per report)
 * adds latency and a coupling for a non-critical signal.
 */

const WINDOW_MS = 60_000
const LIMIT = 60

interface Bucket {
  count: number
  expiresAt: number
}

const store = new Map<string, Bucket>()

export interface CspRateLimitResult {
  ok: boolean
  retryAfterSeconds: number
}

export function rateLimitCspReport(ip: string): CspRateLimitResult {
  const now = Date.now()
  const key = hashIp(ip || 'unknown')
  let bucket = store.get(key)

  if (!bucket || bucket.expiresAt <= now) {
    bucket = { count: 0, expiresAt: now + WINDOW_MS }
    store.set(key, bucket)
  }

  bucket.count += 1
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.expiresAt - now) / 1000),
  )

  return { ok: bucket.count <= LIMIT, retryAfterSeconds }
}

// Test-only escape hatch — Vitest's module reset does not clear our
// closure-scoped Map, and per-test isolation matters for deterministic
// assertions. Not exported on the public surface (see route.ts; nothing
// else imports this).
export function _resetCspRateLimitForTests(): void {
  store.clear()
}
