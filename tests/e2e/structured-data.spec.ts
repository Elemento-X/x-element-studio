import { test, expect } from '@playwright/test'

/**
 * Cross-locale assertion of the JSON-LD Organization + WebSite
 * payload (F5.2). Validates the structured-data shape Google reads
 * for the knowledge panel and rich results — runtime regression in
 * the layout's `buildStructuredData` would land here, not in the
 * smoke spec.
 *
 * Per locale, asserts:
 *   1. exactly one `<script type="application/ld+json">` exists
 *   2. payload parses as JSON and follows the `@graph` shape
 *   3. Organization node carries name, url, logo, description,
 *      sameAs, contactPoint with the expected fields
 *   4. WebSite node uses the correct BCP-47 `inLanguage` per locale
 *      (`pt-br` → `pt-BR`)
 *   5. JSON-LD `description` matches the `<meta name="description">`
 *      of the same page — guards against SERP ↔ knowledge-panel drift
 *   6. raw payload does not contain a literal `</script>` (escape
 *      `<` → `<` still neutralizes script-context injection)
 */

const LOCALES = [
  { code: 'en', path: '/', inLanguage: 'en' },
  { code: 'pt-br', path: '/pt-br', inLanguage: 'pt-BR' },
  { code: 'es', path: '/es', inLanguage: 'es' },
  { code: 'fr', path: '/fr', inLanguage: 'fr' },
] as const

const EXPECTED_LANGS = ['en', 'pt-BR', 'es', 'fr']

test.describe('JSON-LD structured data (cross-locale)', () => {
  for (const loc of LOCALES) {
    test(`${loc.code} (${loc.path}) emits a valid Organization + WebSite payload`, async ({
      page,
    }) => {
      const response = await page.goto(loc.path)
      expect(response?.status()).toBe(200)

      // (1) exactly one JSON-LD script
      const scripts = page.locator('script[type="application/ld+json"]')
      await expect(scripts).toHaveCount(1)

      const raw = await scripts.first().textContent()
      expect(raw).toBeTruthy()
      // (6) escape `<` → `<` neutralizes any embedded `</script>`
      // — the literal sequence must not appear in the rendered payload
      expect(raw).not.toContain('</script>')

      // (2) parseable JSON with @graph shape
      const ld = JSON.parse(raw as string)
      expect(ld['@context']).toBe('https://schema.org')
      expect(Array.isArray(ld['@graph'])).toBe(true)
      expect(ld['@graph']).toHaveLength(2)

      const [org, site] = ld['@graph']

      // (3) Organization node
      expect(org['@type']).toBe('Organization')
      expect(org['@id']).toBe('https://xelement.studio/#organization')
      expect(org.name).toBe('X Element')
      expect(org.url).toBe('https://xelement.studio')
      expect(org.logo).toBe('https://xelement.studio/apple-icon')
      expect(typeof org.description).toBe('string')
      expect((org.description as string).length).toBeGreaterThan(0)
      expect(org.sameAs).toEqual([])

      // contactPoint subfield — the whole point of F5.2
      expect(org.contactPoint['@type']).toBe('ContactPoint')
      expect(org.contactPoint.contactType).toBe('customer support')
      expect(org.contactPoint.url).toBe('https://xelement.studio/#contact')
      expect(org.contactPoint.availableLanguage).toEqual(EXPECTED_LANGS)

      // (4) WebSite node + BCP-47 `inLanguage`
      expect(site['@type']).toBe('WebSite')
      expect(site['@id']).toBe('https://xelement.studio/#website')
      expect(site.url).toBe('https://xelement.studio')
      expect(site.name).toBe('X Element')
      expect(site.publisher).toEqual({
        '@id': 'https://xelement.studio/#organization',
      })
      expect(site.inLanguage).toBe(loc.inLanguage)

      // (5) parity: JSON-LD description == <meta name="description">
      const metaDescription = await page
        .locator('meta[name="description"]')
        .getAttribute('content')
      expect(org.description).toBe(metaDescription)
    })
  }
})
