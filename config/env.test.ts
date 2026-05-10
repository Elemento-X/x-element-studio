/**
 * @owner: @tester (Maclean)
 *
 * Env validation tests — config/env.ts is parsed at module-load. Each
 * test stubs the env, resets modules, and re-imports to capture the
 * boot-time validation outcome.
 *
 * We exercise:
 *
 *   - Defaults applied when optional fields are absent (NODE_ENV,
 *     SITE_URL, kill-switch=false, rate-limit=5, global=200, email=2)
 *   - Kill-switch enum: "true"/"false" string → boolean (not coerce)
 *   - HTTPS-in-prod enforcement on NEXT_PUBLIC_SITE_URL
 *   - Form ON in prod requires Resend + Notion + Upstash envs
 *   - Reject @resend.dev sandbox sender in prod
 *   - Reject xelementcontact@gmail.com NOTIFY_EMAIL in prod
 *   - Upstash URL anchored regex (anti-SSRF) — non-upstash.io rejected
 *   - Upstash empty string → undefined (preprocess), not boot failure
 *   - FROM_EMAIL accepts both "user@host" and "Name <user@host>"
 *   - Invalid env throws — and the boot stderr message lists path+message
 *     only (never values, anti-secret-leak)
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'

let errorSpy: MockInstance

// Snapshot of env keys we mutate so we can fully reset between tests
// — `vi.unstubAllEnvs` only restores what was stubbed, not what we
// deleted via `delete process.env.X`. Keeping this matrix avoids cross-
// test bleed.
const ENV_KEYS = [
  'NODE_ENV',
  'NEXT_PHASE',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_CONTACT_FORM_ENABLED',
  'CONTACT_RATE_LIMIT_PER_HOUR',
  'CONTACT_GLOBAL_LIMIT_PER_HOUR',
  'CONTACT_EMAIL_LIMIT_PER_HOUR',
  'EMAIL_PROVIDER',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'NOTIFY_EMAIL',
  'NOTION_API_KEY',
  'NOTION_DATABASE_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const

const originalEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  vi.resetModules()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  for (const k of ENV_KEYS) originalEnv[k] = process.env[k]
})

afterEach(() => {
  // Full restore — vi.unstubAllEnvs() handles stubEnv, but we also did
  // direct `delete process.env.X` in some tests, so we explicitly
  // re-assign the originals via stubEnv (next-env.d.ts marks NODE_ENV
  // readonly, so direct assignment fails tsc).
  vi.unstubAllEnvs()
  for (const k of ENV_KEYS) {
    if (originalEnv[k] === undefined) delete process.env[k]
    else vi.stubEnv(k, originalEnv[k]!)
  }
  errorSpy.mockRestore()
})

describe('config/env — defaults', () => {
  it('applies dev defaults when optional fields are absent', async () => {
    // Set the bare minimum (FROM_EMAIL/NOTIFY_EMAIL are required, no defaults).
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('FROM_EMAIL', 'dev@example.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')
    // Strip everything else to confirm defaults
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED
    delete process.env.CONTACT_RATE_LIMIT_PER_HOUR
    delete process.env.CONTACT_GLOBAL_LIMIT_PER_HOUR
    delete process.env.CONTACT_EMAIL_LIMIT_PER_HOUR

    const { env } = await import('./env')

    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
    expect(env.NEXT_PUBLIC_CONTACT_FORM_ENABLED).toBe(false)
    expect(env.CONTACT_RATE_LIMIT_PER_HOUR).toBe(5)
    expect(env.CONTACT_GLOBAL_LIMIT_PER_HOUR).toBe(200)
    expect(env.CONTACT_EMAIL_LIMIT_PER_HOUR).toBe(2)
    expect(env.EMAIL_PROVIDER).toBe('resend')
  })

  it('parses kill-switch as strict enum (Boolean("false") footgun avoided)', async () => {
    vi.stubEnv('FROM_EMAIL', 'dev@example.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')

    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'false')
    let mod = await import('./env')
    expect(mod.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED).toBe(false)

    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    mod = await import('./env')
    expect(mod.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED).toBe(true)
  })
})

describe('config/env — production strict checks', () => {
  it('rejects http NEXT_PUBLIC_SITE_URL in prod', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'false')
    vi.stubEnv('FROM_EMAIL', 'team@elemento-x.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    delete process.env.NEXT_PHASE

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables!',
    )
  })

  it('rejects localhost NEXT_PUBLIC_SITE_URL in prod', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://localhost')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'false')
    vi.stubEnv('FROM_EMAIL', 'team@elemento-x.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    delete process.env.NEXT_PHASE

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables!',
    )
  })

  it('passes prod when SITE_URL is HTTPS and form is OFF (deps optional)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'false')
    vi.stubEnv('FROM_EMAIL', 'team@elemento-x.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    delete process.env.NEXT_PHASE

    const { env } = await import('./env')
    expect(env.NEXT_PUBLIC_CONTACT_FORM_ENABLED).toBe(false)
  })

  it('rejects prod-with-form-ON when Resend/Notion/Upstash envs are absent', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    vi.stubEnv('FROM_EMAIL', 'team@elemento-x.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    delete process.env.NEXT_PHASE
    delete process.env.RESEND_API_KEY
    delete process.env.NOTION_API_KEY
    delete process.env.NOTION_DATABASE_ID
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    await expect(import('./env')).rejects.toThrow(
      'Invalid environment variables!',
    )
  })

  it('rejects @resend.dev FROM_EMAIL in prod when form is enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    vi.stubEnv('FROM_EMAIL', 'Elemento-X <onboarding@resend.dev>')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@elemento-x.com')
    vi.stubEnv('RESEND_API_KEY', 're_x')
    vi.stubEnv('NOTION_API_KEY', 'ntn_x')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_x')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://abc-12345.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk_x')
    delete process.env.NEXT_PHASE

    await expect(import('./env')).rejects.toThrow()
  })

  it('rejects xelementcontact@gmail.com NOTIFY_EMAIL in prod when form is enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    vi.stubEnv('FROM_EMAIL', 'Team <team@elemento-x.com>')
    vi.stubEnv('NOTIFY_EMAIL', 'xelementcontact@gmail.com')
    vi.stubEnv('RESEND_API_KEY', 're_x')
    vi.stubEnv('NOTION_API_KEY', 'ntn_x')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_x')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://abc-12345.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk_x')
    delete process.env.NEXT_PHASE

    await expect(import('./env')).rejects.toThrow()
  })

  it('rejects build placeholder FROM_EMAIL/NOTIFY_EMAIL at runtime when form is ON', async () => {
    // Defense in depth: someone rebuilt on Vercel with placeholders still
    // in env (forgot to promote real values). At runtime the form is ON,
    // so we trip fast instead of silently sending from a fake address.
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://elemento-x.com')
    vi.stubEnv('NEXT_PUBLIC_CONTACT_FORM_ENABLED', 'true')
    vi.stubEnv('FROM_EMAIL', 'build-noop@example.com')
    vi.stubEnv('NOTIFY_EMAIL', 'build-noop@example.com')
    vi.stubEnv('RESEND_API_KEY', 're_x')
    vi.stubEnv('NOTION_API_KEY', 'ntn_x')
    vi.stubEnv('NOTION_DATABASE_ID', 'db_x')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://abc-12345.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk_x')
    delete process.env.NEXT_PHASE

    await expect(import('./env')).rejects.toThrow()
  })
})

describe('config/env — build phase (CI without secrets)', () => {
  it('substitutes inert placeholders for FROM_EMAIL/NOTIFY_EMAIL during next build', async () => {
    // CI runs `next build` with NODE_ENV=production but NEXT_PHASE=phase-production-build,
    // and without any project envs. The strict runtime checks must not trip
    // here — placeholders pass; notify.ts gates every send on RESEND_API_KEY
    // so the placeholder cannot reach a real SMTP.
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    delete process.env.FROM_EMAIL
    delete process.env.NOTIFY_EMAIL
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED
    delete process.env.RESEND_API_KEY
    delete process.env.NOTION_API_KEY
    delete process.env.NOTION_DATABASE_ID
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { env } = await import('./env')
    expect(env.FROM_EMAIL).toBe('build-noop@example.com')
    expect(env.NOTIFY_EMAIL).toBe('build-noop@example.com')
    expect(env.NEXT_PUBLIC_CONTACT_FORM_ENABLED).toBe(false)
  })
})

describe('config/env — Upstash URL anchoring (anti-SSRF)', () => {
  it('rejects a non-upstash.io URL', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('FROM_EMAIL', 'dev@example.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://attacker.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk_x')

    await expect(import('./env')).rejects.toThrow()
  })

  it('treats empty string as undefined (no boot failure with feature OFF)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('FROM_EMAIL', 'dev@example.com')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const { env } = await import('./env')
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined()
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBeUndefined()
  })
})

describe('config/env — secret leak protection', () => {
  it('logs only path+message on validation failure (never the value)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    // Plant a sentinel "secret" in a field that will fail validation.
    vi.stubEnv('FROM_EMAIL', 'this is not a valid email format AT ALL')
    vi.stubEnv('NOTIFY_EMAIL', 'ops@example.com')

    await expect(import('./env')).rejects.toThrow()

    const logged = errorSpy.mock.calls
      .flat()
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(' ')

    // The exact bad value must NOT leak into stderr; only field path + message.
    expect(logged).toContain('FROM_EMAIL')
    expect(logged).not.toContain('this is not a valid email format AT ALL')
  })
})
