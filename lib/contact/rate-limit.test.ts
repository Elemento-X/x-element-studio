/**
 * @owner: @tester (Maclean)
 *
 * Rate-limit tests — memory adapter (default in test env, no Upstash
 * configured). We exercise:
 *
 *   - Per-IP bucket: ok at the limit, blocked at limit+1
 *   - Global bucket: same submitter IP can blow past per-IP limit
 *     when global cap is the binding constraint
 *   - Per-email bucket: distinct from per-IP, lowercased before hashing
 *   - Window rollover: advancing the clock past WINDOW_SECONDS resets
 *     the count without leaking buckets across tests
 *   - Hashing: plaintext IP/email never appears in the store key (we
 *     can't observe the store directly, but we can check observable
 *     behavior — same email different case → same bucket; different
 *     email → different bucket)
 *   - retryAfterSeconds is positive and bounded by WINDOW_SECONDS
 *
 * Determinism: fake timers + fixed Date.now so bucket math is exact.
 * Each test resets modules to flush the in-memory map between tests.
 *
 * Note: the in-memory store is module-level state inside rate-limit.ts.
 * `vi.resetModules()` in beforeEach forces a fresh import → fresh map,
 * preventing cross-test bleed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fixed clock — Wed Jan 01 2025 12:34:56 UTC. Picked so that the
// hour-aligned bucket boundary is well in the future of `now`.
const FIXED_NOW = new Date('2025-01-01T12:34:56.000Z').getTime()

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
  vi.resetModules() // flush memoryStore between tests
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

async function importRl() {
  return await import('./rate-limit')
}

describe('rateLimitContact — per-IP bucket', () => {
  it('returns ok=true with decreasing remaining for the first N submits', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '3')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    const r1 = await rateLimitContact('203.0.113.7')
    const r2 = await rateLimitContact('203.0.113.7')
    const r3 = await rateLimitContact('203.0.113.7')

    expect(r1.ok).toBe(true)
    expect(r1.remaining).toBe(2)
    expect(r2.ok).toBe(true)
    expect(r2.remaining).toBe(1)
    expect(r3.ok).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks the (limit + 1)-th submit with retryAfterSeconds set', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '2')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    await rateLimitContact('198.51.100.1')
    await rateLimitContact('198.51.100.1')
    const blocked = await rateLimitContact('198.51.100.1')

    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(3600)
  })

  it('isolates buckets across distinct IPs', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    const a = await rateLimitContact('10.0.0.1')
    const b = await rateLimitContact('10.0.0.2')

    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
  })

  it('treats missing IP ("unknown") as a single bucket — defense-in-depth', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    const a = await rateLimitContact('')
    const b = await rateLimitContact('')

    expect(a.ok).toBe(true)
    expect(b.ok).toBe(false) // 2nd "unknown" submit blocks
  })
})

describe('rateLimitContact — window rollover', () => {
  it('resets the bucket after advancing past WINDOW_SECONDS (3600)', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    const first = await rateLimitContact('10.0.0.50')
    const blocked = await rateLimitContact('10.0.0.50')
    expect(first.ok).toBe(true)
    expect(blocked.ok).toBe(false)

    // Advance 1h + 1s → next bucket
    vi.setSystemTime(FIXED_NOW + 3601_000)

    const next = await rateLimitContact('10.0.0.50')
    expect(next.ok).toBe(true)
  })
})

describe('rateLimitContact — global cap', () => {
  it('engages the global cap once it is the binding constraint', async () => {
    // Per-IP very high (won't bind); global = 2
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '1000')
    vi.stubEnv('CONTACT_GLOBAL_LIMIT_PER_HOUR', '2')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    const a = await rateLimitContact('10.0.0.10')
    const b = await rateLimitContact('10.0.0.11')
    const c = await rateLimitContact('10.0.0.12')

    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    expect(c.ok).toBe(false)
    expect(c.retryAfterSeconds).toBeGreaterThan(0)
  })
})

describe('rateLimitContactEmail — per-email bucket', () => {
  it('is independent of per-IP and counts distinct emails separately', async () => {
    vi.stubEnv('CONTACT_EMAIL_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContactEmail } = await importRl()

    const a = await rateLimitContactEmail('one@example.com')
    const b = await rateLimitContactEmail('two@example.com')
    const c = await rateLimitContactEmail('one@example.com')

    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    expect(c.ok).toBe(false)
  })

  it('canonicalizes case (Foo@x === foo@x → same bucket)', async () => {
    // If hashEmail forgot to lowercase, attackers could trivially bypass.
    vi.stubEnv('CONTACT_EMAIL_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContactEmail } = await importRl()

    const a = await rateLimitContactEmail('Foo@Example.com')
    const b = await rateLimitContactEmail('foo@example.com')

    expect(a.ok).toBe(true)
    expect(b.ok).toBe(false) // would be true if not lowercased
  })

  it('exposes a positive retryAfterSeconds when the email cap is hit', async () => {
    vi.stubEnv('CONTACT_EMAIL_LIMIT_PER_HOUR', '1')
    vi.resetModules()
    const { rateLimitContactEmail } = await importRl()

    await rateLimitContactEmail('me@example.com')
    const blocked = await rateLimitContactEmail('me@example.com')

    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(3600)
  })
})

describe('rate-limit — adapter parity (memory has same `count > limit` semantics as upstash)', () => {
  it('limit=N → exactly N submits succeed, (N+1)th blocks', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_PER_HOUR', '5')
    vi.resetModules()
    const { rateLimitContact } = await importRl()

    let okCount = 0
    let blockedCount = 0
    for (let i = 0; i < 7; i++) {
      const r = await rateLimitContact('10.10.10.10')
      if (r.ok) okCount++
      else blockedCount++
    }

    expect(okCount).toBe(5)
    expect(blockedCount).toBe(2)
  })
})
