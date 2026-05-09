import 'server-only'
import { Resend } from 'resend'
import { env } from '@/config/env'
import { ENGAGEMENT_LABELS, type ContactOutput } from './schema'

/**
 * Email notification on a new contact submission.
 *
 * Best-effort: a failure here does NOT fail the form submission. Notion
 * is the durable record; email is the realtime ping. If Resend goes
 * down, the data is still captured — operator just polls Notion.
 *
 * Reply-To is set to the submitter's email so the operator can reply
 * directly from Gmail without copy-pasting.
 *
 * Stub mode: missing RESEND_API_KEY → log and return ok. Lets the
 * pipeline run end-to-end in dev without a Resend account.
 */

// Hard cap on time spent inside Resend's send call. Resend doesn't expose
// a timeout option on the SDK; without this, a stuck network can hold the
// entire route for the Vercel function's max duration. 8s is generous
// against typical Resend latency (200-500ms) but tight enough that the
// total route stays well under api-contract.md's 5s LRO threshold for
// the user-perceived response (notify happens before the final 200, but
// in best-effort mode we don't fail the route on notify timeout).
const NOTIFY_TIMEOUT_MS = 8000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('notify_timeout')), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export interface NotifyResult {
  ok: boolean
  error?: string
}

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured.')
    }
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildSubject(input: ContactOutput): string {
  const engagement = ENGAGEMENT_LABELS[input.engagement]
  return `[Elemento-X] ${engagement} — ${input.name}`
}

function buildText(input: ContactOutput): string {
  const lines = [
    `New contact submission`,
    ``,
    `Name:        ${input.name}`,
    `Email:       ${input.email}`,
    `Company:     ${input.company ?? '—'}`,
    `Engagement:  ${ENGAGEMENT_LABELS[input.engagement]}${
      input.engagementOther ? ` (${input.engagementOther})` : ''
    }`,
    ``,
    `Message:`,
    input.message,
  ]
  return lines.join('\n')
}

function buildHtml(input: ContactOutput): string {
  const engagement = escapeHtml(ENGAGEMENT_LABELS[input.engagement])
  const detail = input.engagementOther
    ? ` <span style="color:#888">(${escapeHtml(input.engagementOther)})</span>`
    : ''
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,sans-serif;color:#111;background:#f6f6f6;padding:24px">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e5">
<tr><td style="padding:24px">
<h2 style="margin:0 0 16px;font-size:16px;font-weight:600;letter-spacing:.04em;text-transform:uppercase">New contact submission</h2>
<table cellpadding="6" cellspacing="0" style="font-size:14px;border-collapse:collapse">
<tr><td style="color:#888;padding-right:16px">Name</td><td>${escapeHtml(input.name)}</td></tr>
<tr><td style="color:#888;padding-right:16px">Email</td><td><a href="mailto:${encodeURIComponent(input.email)}" style="color:#111">${escapeHtml(input.email)}</a></td></tr>
<tr><td style="color:#888;padding-right:16px">Company</td><td>${escapeHtml(input.company ?? '—')}</td></tr>
<tr><td style="color:#888;padding-right:16px">Engagement</td><td>${engagement}${detail}</td></tr>
</table>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0"/>
<div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Message</div>
<div style="white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(input.message)}</div>
</td></tr>
</table>
</body></html>`
}

export async function notifyContact(
  input: ContactOutput,
): Promise<NotifyResult> {
  if (!env.RESEND_API_KEY) {
    console.info('[contact:notify] stub-mode (RESEND_API_KEY missing)')
    return { ok: true }
  }

  const start = Date.now()
  try {
    const resend = getResend()
    const { error } = await withTimeout(
      resend.emails.send({
        from: env.FROM_EMAIL,
        to: env.NOTIFY_EMAIL,
        replyTo: input.email,
        subject: buildSubject(input),
        text: buildText(input),
        html: buildHtml(input),
      }),
      NOTIFY_TIMEOUT_MS,
    )

    if (error) {
      console.error(
        `[contact:notify] resend_error name=${error.name} latency_ms=${Date.now() - start}`,
      )
      return { ok: false, error: error.name }
    }

    console.info(`[contact:notify] ok latency_ms=${Date.now() - start}`)
    return { ok: true }
  } catch (err) {
    // Network / unknown — never include `err` in log payload (could leak
    // headers/PII). Log type only.
    const errType = err instanceof Error ? err.name : 'unknown'
    console.error(
      `[contact:notify] exception type=${errType} latency_ms=${Date.now() - start}`,
    )
    return { ok: false, error: 'transport' }
  }
}
