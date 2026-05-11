import { test, expect } from '@playwright/test'

/**
 * Reduced-motion contract — F1.8
 *
 * Validates that:
 *   1. The landing renders cleanly with prefers-reduced-motion: reduce active.
 *   2. The Process grid still receives the .gridActive trigger class
 *      (state still applied — only animations are flattened by globals.css).
 *   3. The global rule in app/globals.css that flattens animation/transition
 *      duration to ~0ms is honored at runtime by every browser.
 *   4. No console errors fire under the reduced-motion path.
 *
 * Runs across chromium, firefox and webkit via projects in playwright.config.ts.
 */
test.describe('Reduced-motion contract', () => {
  test('renders / cleanly with reduced-motion and flattens animation duration', async ({
    page,
  }) => {
    // Force prefers-reduced-motion: reduce BEFORE navigating so that both the
    // Reveal observer threshold and the globals.css media query fire under
    // the reduced-motion code path.
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const realResponseFailures: string[] = []

    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      // Drop the browser's generic "Failed to load resource" boilerplate
      // — we track real failures with URL via page.on('response') below.
      // Same rationale as tests/e2e/smoke.spec.ts.
      if (/Failed to load resource/.test(text)) return
      consoleErrors.push(text)
    })

    page.on('response', (res) => {
      if (res.status() < 400) return
      const url = res.url()
      // Filter Next 16 + next-intl RSC prefetch 404s (framework interop,
      // not a regression). See smoke.spec.ts for the full rationale.
      if (/[?&]_rsc=/.test(url)) return
      realResponseFailures.push(`${res.status()} ${url}`)
    })

    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    // Sanity: media query is reported as reduce by the browser
    const reducedMotionMatches = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
    expect(reducedMotionMatches).toBe(true)

    // The landing still mounts ARIA landmarks
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer').first()).toBeVisible()

    // Bring the Process grid into view to trigger the IntersectionObserver
    // that toggles the active class. The class must still be applied — what
    // changes under reduced-motion is the animation duration, not the state.
    const processGrid = page.locator('ol[class*="grid"]').first()
    await processGrid.scrollIntoViewIfNeeded()

    // Wait until the observer flips the class. The active-class name is
    // hashed by CSS Modules, so we match by partial className.
    await expect(processGrid).toHaveClass(/gridActive/, { timeout: 5000 })

    // The flattening rule from globals.css must collapse animation-duration
    // and transition-duration to ~0ms on every animated descendant of the grid.
    // We sample a handful of descendants and assert every duration is < 50ms.
    const durations = await processGrid.evaluate((root) => {
      const samples: { animation: string; transition: string }[] = []
      const nodes = root.querySelectorAll('*')
      // Sample up to 40 descendants — enough to catch step glow/arrow/illust nodes
      const limit = Math.min(40, nodes.length)
      for (let i = 0; i < limit; i++) {
        const el = nodes[i] as HTMLElement
        const cs = getComputedStyle(el)
        samples.push({
          animation: cs.animationDuration,
          transition: cs.transitionDuration,
        })
      }
      return samples
    })

    const parseMs = (v: string): number => {
      // Computed value comes as comma-separated list when multiple anims/transitions
      // e.g. "0.01ms, 0.01ms" — take the max
      return v
        .split(',')
        .map((s) => s.trim())
        .map((s) => {
          if (s.endsWith('ms')) return parseFloat(s)
          if (s.endsWith('s')) return parseFloat(s) * 1000
          return 0
        })
        .reduce((a, b) => Math.max(a, b), 0)
    }

    for (const d of durations) {
      const animMs = parseMs(d.animation)
      const transMs = parseMs(d.transition)
      // globals.css forces 0.01ms — anything < 50ms means the rule applied.
      expect(
        animMs,
        `animation-duration should be flattened: ${d.animation}`,
      ).toBeLessThan(50)
      expect(
        transMs,
        `transition-duration should be flattened: ${d.transition}`,
      ).toBeLessThan(50)
    }

    // No JS errors during the reduced-motion render path
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
    expect(realResponseFailures).toEqual([])
  })
})
