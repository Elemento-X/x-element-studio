import 'server-only'
import { Client, isNotionClientError } from '@notionhq/client'
import { env } from '@/config/env'
import type { ContactOutput, EngagementValue } from './schema'

/**
 * Persist a contact submission to Notion DB.
 *
 * Required Notion DB properties (operator-side setup):
 *  - Name              (title)
 *  - Email             (email)
 *  - Company           (rich_text, optional)
 *  - Engagement        (select: New project | Diagnostic | Partnership | Other)
 *  - Engagement detail (rich_text, optional — used when Engagement = "Other")
 *  - Message           (rich_text)
 *  - Status            (select: New | Contacted | Closed; default "New")
 *
 * Submitted At is auto-populated by Notion's `Created time` property.
 *
 * Logging policy: NEVER log PII (name, email, company, message). Logs
 * carry only operation, attempt count, latency, and outcome class.
 *
 * Stub mode: if NOTION_API_KEY or NOTION_DATABASE_ID is missing, the
 * function returns `{ ok: true, pageId: 'stub' }` without calling Notion.
 * This lets dev environments run the form pipeline end-to-end without
 * a Notion workspace.
 */

const MAX_RETRIES = 3
const BASE_DELAY_MS = 200

const ENGAGEMENT_LABELS: Record<EngagementValue, string> = {
  'new-project': 'New project',
  diagnostic: 'Diagnostic',
  partnership: 'Partnership',
  other: 'Other',
}

export interface PersistResult {
  ok: boolean
  pageId?: string
  error?: 'config' | 'transient' | 'permanent'
}

let _notion: Client | null = null
function getNotion(): Client {
  if (!_notion) {
    if (!env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY not configured.')
    }
    _notion = new Client({ auth: env.NOTION_API_KEY })
  }
  return _notion
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type CreatePageProperties = Parameters<
  Client['pages']['create']
>[0]['properties']

function buildProperties(input: ContactOutput): CreatePageProperties {
  const props: CreatePageProperties = {
    Name: {
      title: [{ text: { content: input.name } }],
    },
    Email: { email: input.email },
    Engagement: { select: { name: ENGAGEMENT_LABELS[input.engagement] } },
    Message: {
      rich_text: [{ text: { content: input.message } }],
    },
    Status: { select: { name: 'New' } },
  }

  if (input.company) {
    props.Company = {
      rich_text: [{ text: { content: input.company } }],
    }
  }
  if (input.engagementOther) {
    props['Engagement detail'] = {
      rich_text: [{ text: { content: input.engagementOther } }],
    }
  }

  return props
}

async function createNotionPage(input: ContactOutput): Promise<string> {
  const notion = getNotion()
  const page = await notion.pages.create({
    parent: { database_id: env.NOTION_DATABASE_ID as string },
    properties: buildProperties(input),
  })
  return page.id
}

function classifyError(err: unknown): 'transient' | 'permanent' {
  if (isNotionClientError(err)) {
    // Rate limit, timeout, server error → retry
    const transientCodes = [
      'rate_limited',
      'request_timeout',
      'service_unavailable',
      'internal_server_error',
      'conflict_error',
    ]
    if (transientCodes.includes(err.code)) return 'transient'
    return 'permanent'
  }
  // Network errors, fetch failures, unknown — treat as transient (retry once).
  return 'transient'
}

export async function persistContact(
  input: ContactOutput,
): Promise<PersistResult> {
  if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
    console.info('[contact:persist] stub-mode (Notion env vars missing)')
    return { ok: true, pageId: 'stub' }
  }

  const start = Date.now()
  let lastClass: 'transient' | 'permanent' = 'transient'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const pageId = await createNotionPage(input)
      console.info(
        `[contact:persist] ok attempt=${attempt} latency_ms=${Date.now() - start}`,
      )
      return { ok: true, pageId }
    } catch (err) {
      lastClass = classifyError(err)
      // Permanent errors (auth, validation, db not found) — stop retrying.
      if (lastClass === 'permanent') {
        console.error(
          `[contact:persist] permanent_error attempt=${attempt} latency_ms=${Date.now() - start}`,
        )
        return { ok: false, error: 'permanent' }
      }
      // Transient — backoff + retry.
      const isLast = attempt === MAX_RETRIES
      if (!isLast) {
        const delay = BASE_DELAY_MS * Math.pow(4, attempt - 1)
        await sleep(delay)
      }
    }
  }

  console.error(
    `[contact:persist] retries_exhausted attempts=${MAX_RETRIES} latency_ms=${Date.now() - start}`,
  )
  return { ok: false, error: lastClass }
}
