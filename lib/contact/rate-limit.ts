import 'server-only'
import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { env } from '@/config/env'

/**
 * Contact form rate limit — fixed window, 1 hour bucket.
 *
 * Adapters:
 *  - In-memory Map (dev/test): no external deps, resets on process restart
 *  - Upstash Redis (prod): HTTP-based, set up via Vercel Marketplace
 *
 * Privacy: IP is SHA-256'd and truncated to 16 hex chars before key
 * formation. Plaintext IP never reaches the store. Truncation reduces
 * collision resistance but is acceptable for rate-limit bucketing —
 * the threat model is "throttle abusers", not "uniquely identify users".
 *
 * Edge case (acknowledged): fixed window allows a 2x burst across the
 * hour boundary (e.g. 5 at 13:59 + 5 at 14:00). For a form with a
 * 5/hour limit and bot-traffic threat profile, this is acceptable. If
 * the limit ever drops to 1/hour or the threat changes, swap to sliding
 * window.
 */

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

const WINDOW_SECONDS = 3600

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

function currentHourBucket(): number {
  return Math.floor(Date.now() / (WINDOW_SECONDS * 1000))
}

const memoryStore = new Map<string, { count: number; expiresAt: number }>()

function memoryRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now()
  let entry = memoryStore.get(key)

  // Increment-first, compare-after — same shape as upstashRateLimit so
  // both adapters share identical reading semantics. Effective behaviour
  // was already equivalent (5 ok, 6th blocks for limit=5), but the old
  // adapters used `count >= limit` vs `count > limit` after different
  // increment timings — confusing for readers and a footgun for any
  // future change.
  if (!entry || entry.expiresAt <= now) {
    entry = { count: 0, expiresAt: now + WINDOW_SECONDS * 1000 }
    memoryStore.set(key, entry)
  }

  entry.count += 1
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((entry.expiresAt - now) / 1000),
  )

  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds }
  }
  return {
    ok: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds,
  }
}

let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis env vars are not configured.')
    }
    _redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

async function upstashRateLimit(
  key: string,
  limit: number,
  bucket: number,
): Promise<RateLimitResult> {
  const redis = getRedis()

  // retryAfter is deterministic from the bucket + now: the bucket ends at
  // (bucket+1)*WINDOW. No need to ask Redis for TTL — saves one round-trip.
  const nowSec = Math.floor(Date.now() / 1000)
  const bucketEndSec = (bucket + 1) * WINDOW_SECONDS
  const retryAfterSeconds = Math.max(1, bucketEndSec - nowSec)

  // Single pipelined round-trip: INCR is atomic; EXPIRE NX sets the TTL
  // only when the key didn't have one (first hit of the bucket). Subsequent
  // hits in the same bucket skip the EXPIRE work.
  const pipe = redis.pipeline()
  pipe.incr(key)
  pipe.expire(key, WINDOW_SECONDS, 'NX')
  const [count] = (await pipe.exec()) as [number, unknown]

  if (count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds }
  }
  return {
    ok: true,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  }
}

export async function rateLimitContact(ip: string): Promise<RateLimitResult> {
  const hashed = hashIp(ip || 'unknown')
  const bucket = currentHourBucket()
  const key = `ratelimit:contact:${hashed}:${bucket}`
  const limit = env.CONTACT_RATE_LIMIT_PER_HOUR

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await upstashRateLimit(key, limit, bucket)
    } catch (err) {
      // Fail-open: if Upstash is unreachable, degrade to the per-process
      // memory adapter rather than 503'ing every submit. The threat
      // model (5/h contact form, no PII to exfil, no financial action)
      // does not justify failing closed; an attacker would need to
      // coincide with an Upstash outage AND only gets to spam.
      // The global cap (added in a follow-up commit) backstops the
      // degradation window. The warn log is the on-call signal.
      const errType = err instanceof Error ? err.name : 'unknown'
      console.warn(
        `[contact:ratelimit] upstash_unavailable error=${errType} fallback=memory`,
      )
      return memoryRateLimit(key, limit)
    }
  }
  return memoryRateLimit(key, limit)
}
