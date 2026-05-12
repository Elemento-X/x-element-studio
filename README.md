# X Element Studio

Landing site for **X Element Studio** — a high-performance technology studio. Brand voice: *"Darkness as default. Gold as signal."*

[![CI](https://github.com/Elemento-X/x-element-studio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Elemento-X/x-element-studio/actions/workflows/ci.yml)

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **next-intl** for i18n (PT-BR · EN · ES · FR) under `app/[locale]/`
- **CSS Modules** + design tokens in `app/tokens.css` (no Tailwind — token-first by design)
- **`next/font/local`** (Inter WOFF2) + **`next/font/google`** (Exo 2, JetBrains Mono — self-hosted at build)
- **Resend** + **Notion** + **Upstash Redis** + **Cloudflare Turnstile** for the contact pipeline
- **Vitest** (unit/integration) + **Playwright** (E2E pinned to container `mcr.microsoft.com/playwright:vX.Y.Z-jammy`)

## Quickstart

```bash
git clone git@github.com:Elemento-X/x-element-studio.git
cd x-element-studio
npm ci
cp .env.example .env.local   # fill in secrets (see "Environment" below)
npm run dev                  # http://localhost:3000 → serves EN at root; /pt-br · /es · /fr for translations
```

## Commands

```bash
npm run dev              # next dev
npm run build            # npm run lint && next build (lint is a build gate)
npm run start            # next start
npm run lint             # eslint . (flat config: eslint.config.mjs)
npm run lint:fix         # eslint . --fix
npm run typecheck        # tsc --noEmit
npm run format           # prettier --write .

npm run test             # vitest (watch mode)
npm run test:run         # vitest run (one-shot)
npm run test:ui          # vitest --ui (local debug)
npm run test:coverage    # vitest run --coverage

npm run test:e2e         # playwright test (needs running server)
npm run test:e2e:ui      # playwright test --ui
```

## Environment

Copy `.env.example` to `.env.local`. The Zod schema in `config/env.ts` validates at boot (fail-fast). Variables that affect runtime behavior:

| Variable | Used by | Required for |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | absolute links, JSON-LD, CORS check | Always (default `http://localhost:3000` in dev) |
| `NEXT_PUBLIC_CONTACT_FORM_ENABLED` | kill-switch (`true` / `false` literal) | Renders the contact form vs mailto fallback |
| `EMAIL_PROVIDER` | enum (`resend` only today) | Gates provider swap in `config/env.ts` |
| `RESEND_API_KEY` | `lib/contact/` | Contact form mail delivery |
| `FROM_EMAIL` | `lib/contact/` | Outbound sender (validated at runtime) |
| `NOTIFY_EMAIL` | `lib/contact/` | Inbound notification recipient |
| `NOTION_API_KEY` | `lib/contact/` | Lead persistence in Notion |
| `NOTION_DATABASE_ID` | `lib/contact/` | Lead persistence in Notion |
| `UPSTASH_REDIS_REST_URL` | `lib/csp/`, `lib/contact/` | CSP report rate-limit + lead idempotency |
| `UPSTASH_REDIS_REST_TOKEN` | `lib/csp/`, `lib/contact/` | Same |
| `TURNSTILE_SECRET_KEY` | `lib/contact/` | Bot verification (fail-closed if missing) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | client widget | Bot verification |

`CONTACT_RATE_LIMIT_PER_HOUR` / `CONTACT_GLOBAL_LIMIT_PER_HOUR` / `CONTACT_EMAIL_LIMIT_PER_HOUR` have safe defaults; `SENTRY_DSN` is optional (stub at `lib/observability/sentry.ts`). See `.env.example` for the full annotated list.

`next build` succeeds even when `FROM_EMAIL`/`NOTIFY_EMAIL` are absent (commit `8f3a6ec`) — runtime fails fast on the affected route only.

## Architecture

```
app/
  [locale]/
    layout.tsx          # Root layout (Inter local, body data-attrs)
    page.tsx            # Landing — composes Nav → Hero → ... → Footer
  _components/<Section>/
    <Section>.tsx
    <Section>.module.css
  api/
    contact/route.ts    # POST — Zod + Turnstile + Notion + Resend + rate-limit
    csp-report/route.ts # POST — CSP violation collector (Report-Only)
  globals.css           # Reset + .container utility
  tokens.css            # Design tokens + atmosphere/accent overrides
  {apple-icon,icon,opengraph-image,twitter-image}.tsx
  {robots,sitemap}.ts
i18n/
  request.ts            # next-intl request config
  config.ts             # locale list + defaultLocale ('en') + localePrefix ('as-needed')
messages/
  {pt-br,en,es,fr}.json # translation catalogs (lowercase slugs)
config/
  env.ts                # Zod env schema (fail-fast at boot)
lib/
  contact/              # schema + Resend client + Notion + idempotency
  csp/                  # rate-limit (IPv6 /64 bucketing) + receiver
  observability/        # sentry stub (not wired)
  seo/                  # JSON-LD + BCP-47 mapper
public/
  fonts/                # Inter 18pt WOFF2 (300/400/500/600)
  assets/               # Brand SVG/PNG
docs/
  runbooks/             # deploy · secret-rotation · contact-form-incident
  api/openapi-contact.yaml
  copy-*.md             # @copywriter briefs
  spikes/, visual-audit-*.md
  x-element/, x-element-design-system/  # READ-ONLY design handoff
.claude/                # Agents, hooks, rules, plans, metrics
.github/workflows/ci.yml
```

## Brand non-negotiables

Full bible lives in [`.claude/commands/x-element-studio.md`](.claude/commands/x-element-studio.md). Short version:

- **One** gold element per primary viewport. Gold is never a background, never a gradient.
- **No pure white.** `--fg-1` is `#EAEAEA`.
- **Borders separate, not shadows.** Max border-radius `8px`. Never pill.
- **No emoji. No unicode glyphs as icons.**
- **Motion budget:** opacity, color, translate ≤ 4px. `150ms` (default) / `220ms` (modal). Curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. No scale, rotate, spring, or bounce.
- **Copy:** sentence case in body; UPPERCASE with wide tracking on buttons/labels. *Subject — verb — outcome.*

> If a change makes the page look *"cool"*, it's wrong. If it looks **inevitable**, it's right.

## CI

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Four jobs:

1. **Lint, Typecheck & Build** (gate — others depend on it)
2. **Unit & Integration Tests** (Vitest)
3. **E2E Tests (Playwright)** — runs inside `mcr.microsoft.com/playwright:vX.Y.Z-jammy`
4. **Dependency Audit** (`npm audit --audit-level=high`)

> **Lockstep rule:** when bumping `@playwright/test` in `package.json`, bump the container tag in `ci.yml` in the same PR. Mismatch fails E2E with `browserType.launch: Executable doesn't exist`.

The weekly schedule (`0 6 * * 1`) catches advisories Dependabot may not have raised yet.

## QA pipeline

Every code delivery goes through the pipeline defined in [`.claude/rules/qa-pipeline.md`](.claude/rules/qa-pipeline.md):

```
(@tester ∥ @security) → @reviewer
```

Extended path-matrix triggers `@design-qa`, `@copywriter`, `@performance`, `@seo`, `@dba`, `@devops` automatically based on changed files. Hotfixes have a documented fast-path with mandatory 48h postmortem.

## Branches

- `main` — production-ready, protected (CI required).
- `dev` — integration; PRs from feature branches land here, then promoted to `main`.
- `feat/Maclean` — Maclean's reusable feature branch; reset to `main` between features.

Dependabot PRs target `main` directly.

## License

Private — © X Element Studio.
