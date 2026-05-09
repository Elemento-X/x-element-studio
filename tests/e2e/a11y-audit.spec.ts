import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Landing accessibility audit', () => {
  test('axe-core finds zero violations on /', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()

    if (results.violations.length > 0) {
      console.log('\n=== AXE VIOLATIONS ===')
      for (const v of results.violations) {
        console.log(`\n[${v.impact}] ${v.id}: ${v.help}`)
        console.log(`  ${v.helpUrl}`)
        for (const node of v.nodes) {
          console.log(`  → ${node.target.join(' ')}`)
        }
      }
      console.log('======================\n')
    }

    expect(results.violations).toEqual([])
  })
})
