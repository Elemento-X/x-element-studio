import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/config/env'
import { notifyContact } from '@/lib/contact/notify'
import { persistContact } from '@/lib/contact/persist'
import { rateLimitContact } from '@/lib/contact/rate-limit'
import { contactSchema } from '@/lib/contact/schema'

/**
 * Contact form pipeline:
 *
 *   feature gate → method check → origin check → content-type check →
 *   rate limit (cheap, before body) → body size cap → parse JSON →
 *   schema validation → honeypot → persist (Notion) → notify (Resend) →
 *   200 OK.
 *
 * Failure semantics:
 *  - 400  invalid JSON or schema validation error (with field map)
 *  - 403  cross-origin request in production
 *  - 405  non-POST method
 *  - 413  body exceeds 16 KB (form payload is normally < 4 KB)
 *  - 415  Content-Type not application/json
 *  - 429  rate limit hit (Retry-After header)
 *  - 500  persistence failure (Notion error class != transient)
 *  - 503  feature flag off
 *
 * Honeypot: silent 200 — never signal to bots that they were caught.
 *
 * Logging policy: never log PII (name, email, company, message). Only
 * operation, IP class (hashed by rate-limit), latency, outcome.
 */

export const runtime = 'nodejs'

const MAX_BODY_SIZE = 16 * 1024

function getClientIp(req: NextRequest): string {
  // Vercel injects x-vercel-forwarded-for with the verified client IP
  // (header is sanitized at the edge — clients can't spoof it). Plain
  // x-forwarded-for is client-controlled and lets attackers reset the
  // rate-limit bucket by mutating one header.
  const vercel = req.headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const ip = vercel.split(',')[0]?.trim()
    if (ip) return ip
  }
  // Outside Vercel, x-real-ip is typically set by the platform proxy
  // (also non-spoofable in those setups).
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  // Last resort: x-forwarded-for. We take the LAST hop (closest to our
  // server, hardest to spoof) instead of the first. Attackers can still
  // prepend, but the last entry is the IP injected by the most recent
  // trusted proxy on the chain.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const hops = xff
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
    const last = hops[hops.length - 1]
    if (last) return last
  }
  return 'unknown'
}

function isOriginAllowed(req: NextRequest): boolean {
  // In dev, allow any origin (localhost, 127.0.0.1, LAN).
  if (env.NODE_ENV !== 'production') return true

  const origin = req.headers.get('origin')
  if (!origin) {
    // Same-origin from a Next.js form fetch may omit Origin in some
    // older browsers; fallback to Referer host check.
    const referer = req.headers.get('referer')
    if (!referer) return false
    try {
      const refUrl = new URL(referer)
      const expected = new URL(env.NEXT_PUBLIC_SITE_URL)
      return refUrl.origin === expected.origin
    } catch {
      return false
    }
  }

  try {
    const expected = new URL(env.NEXT_PUBLIC_SITE_URL).origin
    return origin === expected
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!env.NEXT_PUBLIC_CONTACT_FORM_ENABLED) {
    return NextResponse.json({ ok: false, error: 'disabled' }, { status: 503 })
  }

  if (!isOriginAllowed(req)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const contentType = (req.headers.get('content-type') ?? '').toLowerCase()
  if (!contentType.startsWith('application/json')) {
    return NextResponse.json(
      { ok: false, error: 'unsupported_media_type' },
      { status: 415 },
    )
  }

  const ip = getClientIp(req)
  const rl = await rateLimitContact(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'payload_too_large' },
        { status: 413 },
      )
    }
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_root'
      if (!fields[key]) fields[key] = issue.message
    }
    return NextResponse.json(
      { ok: false, error: 'validation', fields },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Honeypot trip: silent 200. Don't tell bots they were caught.
  if (data.honeypot) {
    console.info('[contact] honeypot_hit')
    return NextResponse.json({ ok: true })
  }

  const persistResult = await persistContact(data)
  if (!persistResult.ok) {
    console.error(`[contact] persist_failed error=${persistResult.error}`)
    return NextResponse.json(
      { ok: false, error: 'persistence' },
      { status: 500 },
    )
  }

  // Notify is best-effort. We await for ordering (so dev logs are clean)
  // but ignore failures — Notion is the source of truth.
  await notifyContact(data)

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    },
  )
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'method_not_allowed' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}
