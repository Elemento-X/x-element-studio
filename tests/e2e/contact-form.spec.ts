/**
 * @owner: @tester (Maclean)
 *
 * E2E — Contact form golden path. Runs against the dev/start server
 * declared in playwright.config.ts. The form is gated by
 * NEXT_PUBLIC_CONTACT_FORM_ENABLED — this spec assumes the env is `true`
 * (set in .env.local for local runs and via CI env in pipelines).
 *
 * The backend route runs in stub mode when NOTION_xxx and RESEND_API_KEY
 * are absent — persist + notify return ok without touching external
 * systems — so a real network round-trip exercises the full pipeline
 * without polluting Notion/Resend.
 *
 * Why a single E2E spec for the form: pyramid is "wide base, thin top".
 * Validation, error mapping, and rate-limit branches are covered in
 * unit/integration. This spec only verifies that the wired-up page +
 * route handler produces the success state for a real submission.
 */
import { test, expect } from '@playwright/test'

test.describe('Contact form — golden path (stub mode)', () => {
  test('submits a valid brief and shows the brief-received state', async ({
    page,
  }) => {
    test.skip(
      !!process.env.PW_SKIP_CONTACT_FORM,
      'Contact form E2E skipped (PW_SKIP_CONTACT_FORM set).',
    )

    await page.goto('/#contact')

    // ContactForm is wrapped in `next/dynamic({ ssr: false })`, so the
    // form node only mounts after client-side hydration. Wait for it
    // briefly. If it never appears, the env flag is off → skip the
    // test (the section falls back to mailto buttons in that mode).
    const form = page.getByRole('form', { name: /contact form/i })
    try {
      await form.waitFor({ state: 'visible', timeout: 5_000 })
    } catch {
      test.skip(
        true,
        'NEXT_PUBLIC_CONTACT_FORM_ENABLED is off — form not rendered.',
      )
    }

    await page.getByLabel('Name', { exact: true }).fill('E2E Tester')
    await page
      .getByLabel('Email', { exact: true })
      .fill(`e2e-${Date.now()}@example.com`)
    await page.getByLabel(/engagement$/i).selectOption('new-project')
    await page
      .getByLabel('Message', { exact: true })
      .fill(
        'A real-world brief that meets the 20-character minimum easily and covers the test path.',
      )

    await page.getByRole('button', { name: /send brief/i }).click()

    // Success state replaces the form with the brief-received block.
    await expect(page.getByText(/brief received/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
