import { test, expect } from '@playwright/test'

test.describe('Landing smoke', () => {
  test('renders / with no console errors and all landmarks', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto('/')

    expect(response?.status()).toBe(200)

    // Title from app/layout.tsx metadata
    await expect(page).toHaveTitle(/Elemento-X/)

    // ARIA landmarks (Card 2 Semantic HTML Sweep guarantees these exist)
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()

    // Single H1 (Hero) — heading hierarchy invariant
    await expect(page.locator('h1')).toHaveCount(1)

    // Brand link in the Nav header (Elemento-X home)
    await expect(
      page.getByRole('link', { name: /Elemento.X home/i }),
    ).toBeVisible()

    // No JS errors during load + first paint
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})
