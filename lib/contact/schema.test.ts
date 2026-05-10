/**
 * @owner: @tester (Maclean)
 *
 * Schema tests — boundary + behavior. The schema is the single
 * source of truth for both client (RHF) and server (route.ts), so
 * every rule here is asserted twice in spirit: once via parse, once
 * via the surrounding rule. We exercise:
 *
 *   - Required string boundaries (length min/max, trim semantics)
 *   - Email shape (with trim) and length cap
 *   - Optional string transform (empty → undefined, trimmed → kept)
 *   - Engagement enum + the conditional `engagementOther` superRefine
 *   - Honeypot must-be-empty rule
 *   - Strict mode (unknown keys rejected)
 *   - ENGAGEMENT_LABELS map shape
 *
 * Determinism: pure validation, no mocks, no clock, no IO.
 */
import { describe, it, expect } from 'vitest'
import { contactSchema, ENGAGEMENT_OPTIONS, ENGAGEMENT_LABELS } from './schema'

const baseValid = {
  name: 'Maclean',
  email: 'maclean@example.com',
  engagement: 'new-project' as const,
  message: 'A real-world brief that meets the 20-character minimum easily.',
}

describe('contactSchema — happy path', () => {
  it('parses a minimal valid submission and applies trim semantics', () => {
    const out = contactSchema.parse({
      ...baseValid,
      name: '  Maclean  ',
      email: '  maclean@example.com  ',
      message:
        '  A real-world brief that meets the 20-character minimum easily.  ',
    })

    expect(out.name).toBe('Maclean')
    expect(out.email).toBe('maclean@example.com')
    expect(out.message).toBe(
      'A real-world brief that meets the 20-character minimum easily.',
    )
    expect(out.company).toBeUndefined()
    expect(out.engagementOther).toBeUndefined()
  })

  it('treats empty optional fields as undefined post-parse', () => {
    const out = contactSchema.parse({ ...baseValid, company: '   ' })
    expect(out.company).toBeUndefined()
  })

  it('keeps a trimmed, non-empty company value', () => {
    const out = contactSchema.parse({ ...baseValid, company: '  Acme  ' })
    expect(out.company).toBe('Acme')
  })
})

describe('contactSchema — name', () => {
  it('rejects names below 2 characters after trim', () => {
    const r = contactSchema.safeParse({ ...baseValid, name: ' a ' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'name')).toBe(true)
    }
  })

  it('rejects names above 80 characters', () => {
    const r = contactSchema.safeParse({ ...baseValid, name: 'a'.repeat(81) })
    expect(r.success).toBe(false)
  })

  it('accepts unicode names (emoji, accents) within bounds', () => {
    const r = contactSchema.safeParse({ ...baseValid, name: 'Áèîõü 🜂 Sócio' })
    expect(r.success).toBe(true)
  })
})

describe('contactSchema — email', () => {
  it('rejects malformed addresses', () => {
    for (const bad of ['not-an-email', 'a@b', '@x.com', 'a@@b.com']) {
      const r = contactSchema.safeParse({ ...baseValid, email: bad })
      expect(r.success).toBe(false)
    }
  })

  it('rejects emails over 254 characters (RFC 5321 cap)', () => {
    const local = 'a'.repeat(245)
    const long = `${local}@x.co` // 251... we still want > 254 to bite
    const tooLong = `${'a'.repeat(250)}@x.co` // 256 chars
    const r = contactSchema.safeParse({ ...baseValid, email: tooLong })
    expect(r.success).toBe(false)
    expect(long.length).toBeLessThanOrEqual(254) // sanity
  })
})

describe('contactSchema — engagement & engagementOther', () => {
  it('accepts every declared engagement value', () => {
    for (const opt of ENGAGEMENT_OPTIONS) {
      const r = contactSchema.safeParse({
        ...baseValid,
        engagement: opt.value,
        // satisfy the conditional rule for "other"
        engagementOther: opt.value === 'other' ? 'Audit' : undefined,
      })
      expect(r.success).toBe(true)
    }
  })

  it('rejects an unknown engagement value', () => {
    const r = contactSchema.safeParse({
      ...baseValid,
      engagement: 'consultancy', // not in enum
    })
    expect(r.success).toBe(false)
  })

  it('requires engagementOther when engagement is "other"', () => {
    const r = contactSchema.safeParse({ ...baseValid, engagement: 'other' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path[0] === 'engagementOther')
      expect(issue?.message).toBe('Specify the engagement type.')
    }
  })

  it('rejects engagementOther shorter than 4 characters when engagement = "other"', () => {
    const r = contactSchema.safeParse({
      ...baseValid,
      engagement: 'other',
      engagementOther: 'AB ',
    })
    expect(r.success).toBe(false)
  })

  it('accepts engagementOther of exactly 4 characters', () => {
    const r = contactSchema.safeParse({
      ...baseValid,
      engagement: 'other',
      engagementOther: 'Plan',
    })
    expect(r.success).toBe(true)
  })

  it('ignores engagementOther when engagement is not "other"', () => {
    const r = contactSchema.safeParse({
      ...baseValid,
      engagement: 'diagnostic',
      engagementOther: 'irrelevant',
    })
    // The schema does not strip the field — it just doesn't require validation.
    // We accept either: parsed cleanly, with engagementOther preserved.
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.engagementOther).toBe('irrelevant')
    }
  })
})

describe('contactSchema — message', () => {
  it('rejects messages below 20 characters', () => {
    const r = contactSchema.safeParse({ ...baseValid, message: 'too short' })
    expect(r.success).toBe(false)
  })

  it('rejects messages above 2000 characters', () => {
    const r = contactSchema.safeParse({
      ...baseValid,
      message: 'a'.repeat(2001),
    })
    expect(r.success).toBe(false)
  })
})

describe('contactSchema — honeypot & strict mode', () => {
  it('passes a non-empty honeypot through (silent rejection happens at runtime)', () => {
    // Schema is permissive on honeypot so the route handler can swallow
    // bot submits with status 200 (anti-bot signaling). The runtime check
    // in route.ts:POST is what actually rejects.
    const r = contactSchema.safeParse({ ...baseValid, honeypot: 'gotcha' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.honeypot).toBe('gotcha')
  })

  it('rejects unknown keys (strict)', () => {
    const r = contactSchema.safeParse({ ...baseValid, role: 'admin' })
    expect(r.success).toBe(false)
  })
})

describe('ENGAGEMENT_LABELS', () => {
  it('maps every value to its label and is exhaustive vs ENGAGEMENT_OPTIONS', () => {
    expect(Object.keys(ENGAGEMENT_LABELS)).toHaveLength(
      ENGAGEMENT_OPTIONS.length,
    )
    for (const opt of ENGAGEMENT_OPTIONS) {
      expect(ENGAGEMENT_LABELS[opt.value]).toBe(opt.label)
    }
  })
})
