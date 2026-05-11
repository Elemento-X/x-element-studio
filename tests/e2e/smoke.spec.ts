import { test, expect } from '@playwright/test'

/**
 * Cross-locale smoke (F4.5). For each of the four locales:
 *   - HTTP 200 on the locale's canonical path
 *   - `<html lang>` matches the routing locale tag
 *   - the H1 renders the locale-specific copy (proves messages
 *     wiring + correct request locale propagation, not just routing)
 *   - all three semantic landmarks present (header, main, footer)
 *   - no JS errors, no broken sub-resources
 *
 * Locale ↔ path mapping follows `localePrefix: 'as-needed'`:
 *   en (default) → `/`
 *   pt-br, es, fr → `/<locale>`
 */
const LOCALES = [
  { code: 'en', path: '/', headline: 'We build', lang: 'en' },
  { code: 'pt-br', path: '/pt-br', headline: 'Construímos', lang: 'pt-br' },
  { code: 'es', path: '/es', headline: 'Construimos', lang: 'es' },
  { code: 'fr', path: '/fr', headline: 'Nous bâtissons', lang: 'fr' },
] as const

test.describe('Landing smoke (cross-locale)', () => {
  for (const loc of LOCALES) {
    test(`${loc.code} (${loc.path}) renders cleanly with correct lang and copy`, async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const realResponseFailures: string[] = []

      page.on('pageerror', (err) => {
        pageErrors.push(err.message)
      })

      page.on('console', (msg) => {
        if (msg.type() !== 'error') return
        const text = msg.text()
        if (/Failed to load resource/.test(text)) return
        consoleErrors.push(text)
      })

      page.on('response', (res) => {
        if (res.status() < 400) return
        const url = res.url()
        if (/[?&]_rsc=/.test(url)) return
        realResponseFailures.push(`${res.status()} ${url}`)
      })

      const response = await page.goto(loc.path)
      expect(response?.status()).toBe(200)

      // Title from app/[locale]/layout.tsx metadata is localized — only
      // assert the brand suffix is present (it stays "Elemento-X"
      // across every locale).
      await expect(page).toHaveTitle(/Elemento-X/)

      // <html lang> attribute matches the routing locale exactly
      const langAttr = await page.locator('html').getAttribute('lang')
      expect(langAttr).toBe(loc.lang)

      // H1 carries locale-specific copy. Each locale opens with a
      // different word in messages.<locale>.json::hero.headlineLine1.
      const h1 = page.locator('h1')
      await expect(h1).toHaveCount(1)
      await expect(h1).toContainText(loc.headline)

      // Heading hierarchy: exactly 1 h1, and at least one h2 and h3
      // per locale. The four locales share the same React component
      // tree (Hero → Trust → Capabilities → Process → Work →
      // Manifesto → FinalCta → Footer), so h2/h3 counts are
      // structurally identical across locales — only the copy
      // changes. The cross-locale parametrization here means a
      // missing heading in any one locale fails its own test.
      expect(await page.locator('h2').count()).toBeGreaterThanOrEqual(1)
      expect(await page.locator('h3').count()).toBeGreaterThanOrEqual(1)

      // hreflang: every locale's <head> must advertise the full set
      // of alternates plus x-default. Next emits these from
      // `metadata.alternates.languages` in app/[locale]/layout.tsx.
      // This is the internal equivalent of running Google's hreflang
      // validator — Google's tool just verifies the tags Next is
      // already generating from `routing.locales` here.
      const hreflangAttrs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) =>
          els.map((el) => el.getAttribute('hreflang') ?? ''),
        )
      for (const expected of ['en', 'pt-br', 'es', 'fr', 'x-default']) {
        expect(hreflangAttrs).toContain(expected)
      }

      // ARIA landmarks remain present in every locale
      await expect(page.locator('header').first()).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('footer').first()).toBeVisible()

      // Brand link in the Nav header — `aria-label` is localized but
      // always contains "Elemento" in every translation.
      await expect(
        page.getByRole('link', { name: /Elemento.X/i }).first(),
      ).toBeVisible()

      expect(pageErrors).toEqual([])
      expect(consoleErrors).toEqual([])
      expect(realResponseFailures).toEqual([])
    })
  }
})
