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
 * IPv6 /64 normalization: an ISP typically allocates a /64 to a single
 * device, so a motivated attacker controls 2^64 addresses they can
 * rotate through. We bucket per /64 (the first 4 hextets) instead of
 * per literal address — collapses the rotation vector while keeping
 * separation across distinct subscribers. IPv4 stays per-address.
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

// Collapse a raw client IP to the bucket key string before hashing.
// IPv4 addresses pass through untouched. IPv6 is expanded (resolves the
// `::` shorthand) and truncated to the first 4 hextets — the /64 prefix
// — so that 2^64 addresses inside the same prefix collapse to one
// bucket. This blocks the trivial "rotate within my own /64" bypass
// and is the same coarsening that anti-abuse systems in the industry
// use for IPv6 rate limiting.
function ipBucketKey(rawIp: string): string {
  if (!rawIp) return 'unknown'
  // Drop IPv6 zone identifier (`fe80::1%eth0`) before parsing.
  const ip = rawIp.split('%')[0] ?? rawIp
  if (!ip.includes(':')) return ip // IPv4 → as-is

  // Expand the optional `::` group to fill enough zero hextets so the
  // address is always exactly 8 segments long. Then take the first 4
  // and normalize each (parseInt + toString(16)) so different shorthand
  // spellings of the same prefix collapse to one canonical form.
  const [head = '', tail = ''] = ip.split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const fill = Math.max(0, 8 - headParts.length - tailParts.length)
  const expanded = [...headParts, ...Array(fill).fill('0'), ...tailParts]
  if (expanded.length < 4) return ip // malformed — fall back to literal

  const prefix = expanded
    .slice(0, 4)
    .map((s) => parseInt(s || '0', 16).toString(16))
    .join(':')
  return `${prefix}::/64`
}

export function rateLimitCspReport(ip: string): CspRateLimitResult {
  const now = Date.now()
  const key = hashIp(ipBucketKey(ip || 'unknown'))
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
