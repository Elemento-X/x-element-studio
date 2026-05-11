import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type { ImgHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

// Baseline env for tests. `config/env.ts` validates process.env at module
// load — without these defaults, importing any module that transitively
// imports `@/config/env` blows up before the test body runs. Tests that
// need different env values use `vi.stubEnv` + `vi.resetModules` to
// re-import with overrides (see config/env.test.ts).
//
// Defaults chosen to match `.env.example` dev profile:
//  - NODE_ENV=test (Zod enum allows it; isProd=false → permissive)
//  - Form ENABLED so the route can be exercised in route.test.ts
//  - FROM_EMAIL/NOTIFY_EMAIL present (no defaults in the schema anymore)
//  - Notion/Resend keys absent → libs run in stub mode by default
//  - Upstash absent → memory adapter for rate-limit
// Baseline env for tests — written directly to process.env (not via
// vi.stubEnv) so `vi.unstubAllEnvs()` inside individual tests doesn't
// wipe our setup defaults. Bracket access bypasses `next-env.d.ts`'s
// readonly NODE_ENV typing without sacrificing safety elsewhere.
const baseTestEnv: Record<string, string> = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_CONTACT_FORM_ENABLED: 'true',
  CONTACT_RATE_LIMIT_PER_HOUR: '5',
  CONTACT_GLOBAL_LIMIT_PER_HOUR: '200',
  CONTACT_EMAIL_LIMIT_PER_HOUR: '2',
  EMAIL_PROVIDER: 'resend',
  FROM_EMAIL: 'Elemento-X <onboarding@resend.dev>',
  NOTIFY_EMAIL: 'ops@example.com',
}
const envBag = process.env as Record<string, string | undefined>
for (const [k, v] of Object.entries(baseTestEnv)) {
  if (envBag[k] === undefined) envBag[k] = v
}

// `server-only` is a runtime sentinel that throws when imported from a
// client bundle. Vitest under jsdom looks like a client to it. Mocking it
// to a no-op lets server modules (lib/contact/*, app/api/**/route.ts)
// run inside unit tests without polluting the production behavior — the
// real bundler still enforces the rule outside tests.
vi.mock('server-only', () => ({}))

// next-intl mock: tests don't run the real i18n pipeline (no middleware,
// no per-request locale). We resolve every `t(key)` against the EN
// source-of-truth (`messages/en.json`) so assertions read real copy.
// `t.rich(key, tags)` strips inline tags to plain text — adequate for
// unit-level matching; React tree shape is exercised by E2E.
import enMessages from './messages/en.json'

type MessageNode = string | { [key: string]: MessageNode }

function readMessage(path: string): string {
  const segments = path.split('.')
  let node: MessageNode = enMessages as unknown as MessageNode
  for (const seg of segments) {
    if (typeof node !== 'object' || node === null) return path
    node = (node as { [k: string]: MessageNode })[seg] ?? path
  }
  return typeof node === 'string' ? node : path
}

type TFn = ((
  key: string,
  values?: Record<string, string | number>,
) => string) & {
  rich: (
    key: string,
    tags?: Record<string, (chunks: ReactNode) => ReactNode>,
  ) => string
}

function makeT(namespace?: string): TFn {
  const resolve = (key: string) => (namespace ? `${namespace}.${key}` : key)
  const t = ((key: string, values?: Record<string, string | number>) => {
    let msg = readMessage(resolve(key))
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return msg
  }) as TFn
  t.rich = (key: string) => {
    const msg = readMessage(resolve(key))
    // Strip inline tags like <strong>x</strong> → x for unit assertions.
    return msg.replace(/<(\w+)>([^<]*)<\/\1>/g, '$2')
  }
  return t
}

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => makeT(namespace),
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
  hasLocale: () => true,
}))

vi.mock('next-intl/server', () => ({
  getTranslations: async (param?: string | { namespace?: string }) => {
    const namespace = typeof param === 'string' ? param : param?.namespace
    return makeT(namespace)
  },
  setRequestLocale: () => {},
}))

afterEach(() => {
  cleanup()
})

// next/image: render as plain <img> in jsdom (skip optimizer/loader, which
// are heavy and irrelevant for component-level tests).
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- jsdom mock; next/image isn't usable in unit tests
    <img src={src} alt={alt} {...rest} />
  ),
}))

// next/link: render as plain <a> so role-based queries work and href values
// can be asserted directly.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    children: ReactNode
  }) => (
    // eslint-disable-next-line react/jsx-no-target-blank -- jsdom mock; tests assert on attributes directly, defense-in-depth lives in real Link/Button components.
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
