import { describe, it, expect } from 'vitest'
import { toBCP47 } from '@/lib/seo/bcp47'

/**
 * Unit test for the BCP-47 mapper used by the JSON-LD Organization
 * payload. Two reasons this test exists despite the production
 * fallback branch being structurally unreachable:
 *
 *   1. Locks the canonical form per locale (regression detector if
 *      someone changes the table — e.g. someone writes `pt-br`
 *      lowercase and that ships to Google's knowledge panel).
 *   2. Covers the `?? 'en'` fallback so a future change to
 *      `generateStaticParams` introducing an off-enum locale doesn't
 *      generate a JSON-LD with the literal string "undefined" as
 *      `inLanguage`.
 */
describe('toBCP47', () => {
  it('maps en → en', () => {
    expect(toBCP47('en')).toBe('en')
  })

  it('maps pt-br → pt-BR (region subtag uppercase per BCP-47 canonical form)', () => {
    expect(toBCP47('pt-br')).toBe('pt-BR')
  })

  it('maps es → es', () => {
    expect(toBCP47('es')).toBe('es')
  })

  it('maps fr → fr', () => {
    expect(toBCP47('fr')).toBe('fr')
  })

  it('falls back to "en" for any locale outside the routing enum', () => {
    expect(toBCP47('zz')).toBe('en')
    expect(toBCP47('')).toBe('en')
    expect(toBCP47('PT-BR')).toBe('en') // case-sensitive lookup intentional
  })
})
