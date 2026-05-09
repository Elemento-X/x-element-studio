import { randomUUID } from 'node:crypto'
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
 * Response envelope (api-contract.md):
 *  - Success: { "data": { ... } }
 *  - Error:   { "error": { "code": "<STABLE_CODE>", "message": "...", "fields"?: {...} } }
 *
 * `code` is the stable discriminator (SCREAMING_SNAKE_CASE). `message` is
 * human-readable and may change without versioning. `fields` only on
 * VALIDATION_ERROR.
 *
 * All responses include:
 *  - `X-Request-Id` (echoed from client header if valid, otherwise UUID v4).
 *  - `Cache-Control: no-store` (form responses must not be cached).
 *
 * Status codes:
 *  - 200  OK
 *  - 400  INVALID_JSON | VALIDATION_ERROR
 *  - 403  FORBIDDEN (cross-origin in prod)
 *  - 405  METHOD_NOT_ALLOWED
 *  - 413  PAYLOAD_TOO_LARGE
 *  - 415  UNSUPPORTED_MEDIA_TYPE
 *  - 429  RATE_LIMITED (with Retry-After)
 *  - 500  PERSISTENCE_ERROR
 *  - 503  DISABLED (kill-switch)
 *
 * Honeypot: silent 200 — never signal to bots that they were caught.
 *
 * Logging policy: never log PII (name, email, company, message). Only
 * operation, IP class (hashed by rate-limit), latency, outcome, requestId.
 */

export const runtime = 'nodejs'

const MAX_BODY_SIZE = 16 * 1024

// Echo client X-Request-Id when it looks safe (alnum + dashes, 8-128 chars
// to block CRLF header injection); otherwise mint a fresh UUID v4.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,128}$/

function getOrCreateRequestId(req: NextRequest): string {
  const fromClient = req.headers.get('x-request-id')
  if (fromClient && REQUEST_ID_PATTERN.test(fromClient)) return fromClient
  return randomUUID()
}

interface JsonResponseInit {
  status: number
  requestId: string
  headers?: Record<string, string>
}

function jsonResponse(body: unknown, init: JsonResponseInit): NextResponse {
  return NextResponse.json(body, {
    status: init.status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Request-Id': init.requestId,
      ...init.headers,
    },
  })
}

interface ErrorPayload {
  code: string
  message: string
  fields?: Record<string, string>
}

function errorResponse(
  status: number,
  payload: ErrorPayload,
  requestId: string,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return jsonResponse(
    { error: payload },
    { status, requestId, headers: extraHeaders },
  )
}

function okResponse(
  requestId: string,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return jsonResponse(
    { data: { ok: true } },
    { status: 200, requestId, headers: extraHeaders },
  )
}

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
  const requestId = getOrCreateRequestId(req)

  if (!env.NEXT_PUBLIC_CONTACT_FORM_ENABLED) {
    return errorResponse(
      503,
      { code: 'DISABLED', message: 'Contact form is currently disabled.' },
      requestId,
    )
  }

  if (!isOriginAllowed(req)) {
    return errorResponse(
      403,
      { code: 'FORBIDDEN', message: 'Origin not allowed.' },
      requestId,
    )
  }

  const contentType = (req.headers.get('content-type') ?? '').toLowerCase()
  if (!contentType.startsWith('application/json')) {
    return errorResponse(
      415,
      {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json.',
      },
      requestId,
    )
  }

  const ip = getClientIp(req)
  const rl = await rateLimitContact(ip)
  if (!rl.ok) {
    return errorResponse(
      429,
      { code: 'RATE_LIMITED', message: 'Too many requests.' },
      requestId,
      {
        'Retry-After': String(rl.retryAfterSeconds),
        'X-RateLimit-Remaining': '0',
      },
    )
  }

  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_SIZE) {
      return errorResponse(
        413,
        { code: 'PAYLOAD_TOO_LARGE', message: 'Body exceeds 16 KB.' },
        requestId,
      )
    }
    raw = JSON.parse(text)
  } catch {
    return errorResponse(
      400,
      { code: 'INVALID_JSON', message: 'Body is not valid JSON.' },
      requestId,
    )
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_root'
      if (!fields[key]) fields[key] = issue.message
    }
    return errorResponse(
      400,
      {
        code: 'VALIDATION_ERROR',
        message: 'One or more fields failed validation.',
        fields,
      },
      requestId,
    )
  }

  const data = parsed.data

  // Honeypot trip: silent 200. Don't tell bots they were caught.
  if (data.honeypot) {
    console.info(`[contact] honeypot_hit rid=${requestId}`)
    return okResponse(requestId)
  }

  const persistResult = await persistContact(data)
  if (!persistResult.ok) {
    console.error(
      `[contact] persist_failed error=${persistResult.error} rid=${requestId}`,
    )
    return errorResponse(
      500,
      { code: 'PERSISTENCE_ERROR', message: 'Could not persist submission.' },
      requestId,
    )
  }

  // Notify is best-effort. We await for ordering (so dev logs are clean)
  // but ignore failures — Notion is the source of truth.
  await notifyContact(data)

  return okResponse(requestId, {
    'X-RateLimit-Remaining': String(rl.remaining),
  })
}

export async function GET(req: NextRequest) {
  const requestId = getOrCreateRequestId(req)
  return errorResponse(
    405,
    { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' },
    requestId,
    { Allow: 'POST' },
  )
}
