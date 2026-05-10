import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // CI runs against a production build (`next start`) to avoid the dev-server
  // (Turbopack) intermittently serving stale chunk manifests during HMR.
  // Locally, default to `npm run dev` for fast iteration; pass PW_PROD=1 to
  // exercise the production path before pushing.
  webServer: {
    command:
      process.env.CI || process.env.PW_PROD
        ? 'npm run build && npx next start'
        : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
