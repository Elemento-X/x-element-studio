import 'server-only'
import { env } from '@/config/env'

/**
 * Cloudflare Turnstile server-side verification.
 *
 * Defense in depth — runs alongside honeypot + 3-layer rate-limit.
 * Activates only when BOTH `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client)
 * AND `TURNSTILE_SECRET_KEY` (server) are set. With either missing,
 * `isTurnstileEnabled()` returns false and the route skips verify
 * (graceful degrade — preserves dev DX without keys).
 *
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_ENDPOINT =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// 5s cap — Cloudflare typically responds in 100-300ms. A stuck verify
// shouldn't drag the whole request past the persist+notify window.
const VERIFY_TIMEOUT_MS = 5000

export interface TurnstileResult {
  ok: boolean
  errorCode?: string
}

export function isTurnstileEnabled(): boolean {
  return Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstile(
  token: string,
  remoteip?: string,
): Promise<TurnstileResult> {
  // Fail-closed: callers MUST gate on isTurnstileEnabled() first. A
  // refactor that drops the gate would otherwise silently bypass
  // the bot challenge — we'd rather surface that as a TypeError in
  // tests/dev than ship a regression in defense-in-depth.
  if (!env.TURNSTILE_SECRET_KEY) {
    throw new Error(
      'verifyTurnstile called without TURNSTILE_SECRET_KEY — caller must check isTurnstileEnabled() first.',
    )
  }

  if (!token) {
    return { ok: false, errorCode: 'missing-input-response' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS)

  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    })
    if (remoteip && remoteip !== 'unknown') {
      body.set('remoteip', remoteip)
    }

    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      body,
      signal: controller.signal,
    })

    if (!res.ok) {
      return { ok: false, errorCode: `http_${res.status}` }
    }

    const data = (await res.json()) as {
      success?: boolean
      'error-codes'?: string[]
    }

    if (data.success === true) return { ok: true }
    return {
      ok: false,
      errorCode: data['error-codes']?.[0] ?? 'unknown',
    }
  } catch (err) {
    const errType = err instanceof Error ? err.name : 'unknown'
    return {
      ok: false,
      errorCode: errType === 'AbortError' ? 'timeout' : 'transport',
    }
  } finally {
    clearTimeout(timer)
  }
}
