import { z } from 'zod'

/**
 * Engagement options. Source-of-truth for the form select AND for the
 * Notion DB "Type" property mapping (lib/contact/persist.ts).
 *
 * Naming: kebab-case values for stability over time. Labels are the EN
 * copy shown in the form select.
 */
export const ENGAGEMENT_OPTIONS = [
  { value: 'new-project', label: 'New project' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
] as const

export type EngagementValue = (typeof ENGAGEMENT_OPTIONS)[number]['value']

// value → label lookup. Single source for persist.ts (Notion select name)
// and notify.ts (email subject + body). Don't redefine in either consumer.
export const ENGAGEMENT_LABELS = Object.fromEntries(
  ENGAGEMENT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<EngagementValue, string>

const engagementValues = ENGAGEMENT_OPTIONS.map((o) => o.value) as [
  EngagementValue,
  ...EngagementValue[],
]

/**
 * Contact form schema. Source-of-truth for client (RHF resolver) AND
 * server (api/contact/route.ts). Errors in EN, brand voice (terse, no
 * "please"/"sorry"). Strict mode — unknown keys are rejected (anti-bot
 * + safer Notion mapping).
 *
 * Honeypot: field present in form but hidden via CSS (`aria-hidden`,
 * `tabIndex={-1}`, off-screen). Bots fill it; humans don't. Must be
 * empty. Server treats non-empty honeypot as silent 200 (no signal to
 * the bot that it was caught).
 */
export const contactSchema = z
  .object({
    name: z
      .string('Required.')
      .trim()
      .min(2, 'Too short.')
      .max(80, 'Too long.'),

    email: z
      .string('Required.')
      .trim()
      .email('Invalid email.')
      .max(254, 'Too long.'),

    // Optional: empty string from form → undefined post-parse.
    company: z
      .string()
      .max(120, 'Too long.')
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed && trimmed.length > 0 ? trimmed : undefined
      }),

    engagement: z.enum(engagementValues, 'Choose an engagement type.'),

    // Required only when engagement === 'other'. Validated in superRefine
    // (Zod has no native conditional-required without discriminatedUnion,
    // and we want a flat schema so RHF/Notion mapping stays simple).
    engagementOther: z
      .string()
      .max(120, 'Too long.')
      .optional()
      .transform((v) => {
        const trimmed = v?.trim()
        return trimmed && trimmed.length > 0 ? trimmed : undefined
      }),

    message: z
      .string('Required.')
      .trim()
      .min(20, 'Too short. Aim for 20+ characters.')
      .max(2000, 'Too long. Keep it under 2000 characters.'),

    // Anti-bot. Must be empty. Field is hidden in the rendered form.
    honeypot: z.string().max(0, 'Invalid submission.').optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.engagement === 'other') {
      if (!data.engagementOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['engagementOther'],
          message: 'Specify the engagement type.',
        })
      } else if (data.engagementOther.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['engagementOther'],
          message: 'Too short.',
        })
      }
    }
  })

export type ContactInput = z.input<typeof contactSchema>
export type ContactOutput = z.output<typeof contactSchema>
