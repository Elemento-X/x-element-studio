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
  const entry = memoryStore.get(key)

  if (!entry || entry.expiresAt <= now) {
    memoryStore.set(key, {
      count: 1,
      expiresAt: now + WINDOW_SECONDS * 1000,
    })
    return {
      ok: true,
      remaining: limit - 1,
      retryAfterSeconds: WINDOW_SECONDS,
    }
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
    }
  }

  entry.count += 1
  return {
    ok: true,
    remaining: limit - entry.count,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
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
): Promise<RateLimitResult> {
  const redis = getRedis()
  // INCR is atomic; EXPIRE is idempotent. Resetting TTL on every hit
  // doesn't matter because the key embeds the hour bucket — the next
  // bucket uses a new key. Auto-expiry just keeps Redis tidy.
  const count = await redis.incr(key)
  await redis.expire(key, WINDOW_SECONDS)
  const ttl = await redis.ttl(key)
  const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS

  if (count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: retryAfter }
  }
  return {
    ok: true,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: retryAfter,
  }
}

export async function rateLimitContact(ip: string): Promise<RateLimitResult> {
  const hashed = hashIp(ip || 'unknown')
  const bucket = currentHourBucket()
  const key = `ratelimit:contact:${hashed}:${bucket}`
  const limit = env.CONTACT_RATE_LIMIT_PER_HOUR

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashRateLimit(key, limit)
  }
  return memoryRateLimit(key, limit)
}
