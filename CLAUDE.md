# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**X Element Studio** — landing site for a high-performance technology studio. Brand voice: *"Darkness as default. Gold as signal."* — controlled, minimal, never warm.

Repo: https://github.com/Elemento-X/x-element-studio

The full project context (brand, tokens, sections, design rules) lives in `.claude/commands/x-element-studio.md`. Read that first; it is the source of truth for any visual or copy decision.

## Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **next-intl** for i18n (PT-BR · EN · ES · FR) under `app/[locale]/`
- **CSS Modules** + design tokens in `app/tokens.css` (no Tailwind — removed in commit `5b00b22`; the system is token-first, not utility-first)
- **`next/font/local`** for Inter (WOFF2 from `public/fonts/`, weights 300/400/500/600 only); **Exo 2** + **JetBrains Mono** via `next/font/google` (self-hosted at build time, zero render-blocking external requests)
- **lucide-react** for functional UI icons (brand motifs are bespoke SVG in `public/assets/`)
- **Contact pipeline:** Zod + Cloudflare Turnstile + Upstash Redis (rate-limit/idempotency) + Notion (persistence) + Resend (mail)
- **Vitest** (unit/integration) + **Playwright** (E2E pinned to container `mcr.microsoft.com/playwright:vX.Y.Z-jammy`)

### Security pins (do not remove without rotation)

`package.json` declares `overrides.postcss: ^8.5.10` to lift the transitive `postcss` graph above [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) (XSS via unescaped `</style>` in CSS Stringify). Next 16.2.6 still ships postcss 8.4.31 transitively — the override is the fix. Remove only if Next bumps its bundled postcss past 8.5.10 *and* this advisory remains the only reason for the pin.

## Commands

```bash
npm run dev              # next dev — http://localhost:3000 serves EN at root; /pt-br · /es · /fr for translations
npm run build            # npm run lint && next build (lint is a build gate)
npm run start            # next start
npm run lint             # eslint . (flat config: eslint.config.mjs)
npm run typecheck        # tsc --noEmit
npm run format           # prettier --write .
npm run test:run         # vitest run (one-shot)
npm run test:coverage    # vitest run --coverage
npm run test:e2e         # playwright test (needs running server + container)
```

The hooks in `.claude/hooks/` run lint, typecheck, prettier, secret-scan, and protect-files automatically on every Edit/Write. They use `npx --no-install`, so they only fire when the local tool is installed.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs four jobs on `push` and `pull_request` (branches `main`, `dev`) plus a weekly schedule:

1. **Lint, Typecheck & Build** — gate; the other jobs `needs:` this one.
2. **Unit & Integration Tests** — Vitest.
3. **E2E Tests (Playwright)** — runs **inside** `mcr.microsoft.com/playwright:vX.Y.Z-jammy`. Visual baselines are platform-sensitive; the container keeps them deterministic.
4. **Dependency Audit** — `npm audit --audit-level=high`.

> **Playwright lockstep rule (non-negotiable):** when bumping `@playwright/test` in `package.json`, bump the container tag in `ci.yml` in the **same PR**. Mismatch fails E2E with `browserType.launch: Executable doesn't exist`. The comment at the container declaration in `ci.yml` documents this — keep it accurate.

## Architecture

### Top-level layout

```
app/
  [locale]/                   # next-intl i18n root — pt-BR (default) | en | es | fr
    layout.tsx                # Root layout — Inter local font, body data-attrs (atmosphere/accent)
    page.tsx                  # Landing — composes section components in order
  _components/                # App Router private folder (underscore = no route generated)
    <Section>/
      <Section>.tsx           # Component (server by default; "use client" only when needed)
      <Section>.module.css    # Co-located styles
  api/
    contact/route.ts          # POST — Zod + Turnstile + Notion + Resend + rate-limit
    csp-report/route.ts       # POST — CSP violation collector (Report-Only)
  globals.css                 # Reset + .container utility + reduced-motion
  tokens.css                  # All design tokens + atmosphere/accent mode overrides
  {apple-icon,icon,opengraph-image,twitter-image}.tsx  # Next route convention
  {robots,sitemap}.ts                                  # Next route convention
i18n/
  request.ts                  # next-intl request config (locale → messages loader)
  config.ts                   # routing config — locales, defaultLocale ('en'), localePrefix ('as-needed')
messages/
  {pt-br,en,es,fr}.json       # translation catalogs (lowercase slugs)
config/
  env.ts                      # Zod env schema (fail-fast at boot)
lib/
  contact/                    # Zod schema + Resend client + Notion + idempotency
  csp/                        # Rate-limit (IPv6 /64 bucketing) + receiver
  observability/              # Sentry stub (not wired — see sentry.ts header)
  seo/                        # JSON-LD payload + BCP-47 mapper
middleware.ts                 # next-intl locale negotiation
public/
  fonts/                      # Inter 18pt WOFF2 (300/400/500/600 only)
  assets/                     # Brand SVG/PNG (logo flask, wordmarks, motif icons)
docs/                         # Operational docs (live) + design handoff (READ-ONLY)
  runbooks/                   # deploy · secret-rotation · contact-form-incident
  api/openapi-contact.yaml    # /api/contact contract
  copy-*.md                   # @copywriter briefs
  spikes/, visual-audit-*.md  # Historical snapshots
  x-element/                  # READ-ONLY — design handoff (HTML/CSS prototype)
  x-element-design-system/    # READ-ONLY — brand bible + DS preview cards
.claude/
  agents/                     # 14 specialized QA/review/security/etc. agents
  commands/                   # Slash commands — including x-element-studio.md (project context)
  hooks/                      # PreToolUse/PostToolUse JS scripts (format/lint/protect/secret-scan)
  rules/                      # Path-scoped rules (qa-pipeline, security, api-contract, api-routes)
  plans/                      # Planning artifacts (audit reports, roadmaps)
  metrics/                    # pipeline.jsonl + categories.json (QA telemetry)
```

### Section composition (Landing)

`app/[locale]/page.tsx` mounts: `Nav → Hero → Trust → Capabilities → Process → Work → Manifesto → FinalCta → Footer`. `FinalCta` renders `ContactForm` via `ContactFormLazy` when `NEXT_PUBLIC_CONTACT_FORM_ENABLED=true`, otherwise falls back to a mailto button. Each section is co-located in `app/_components/<Section>/` and imported from `@/app/_components/<Section>/<Section>` (cross-route). All copy is read through `next-intl`'s `useTranslations`/`getTranslations` — no hardcoded strings in section files.

Shared primitives:

- **`Button`** — single component with `variant: 'primary' | 'ghost'`, polymorphic `as: 'a' | 'button'`, optional `withArrow`. Hover/press states match `colors_and_type.css` rules (gold dim on primary, border-strong on ghost).
- **`Reveal`** — IntersectionObserver-based fade+translate-Y entrance. `'use client'`. All in-view animation goes through this — do not hand-roll.
- **`SectionHead`** — eyebrow + numbered label + display H2 + lead copy, in the canonical 1fr/2fr grid.
- **`Eyebrow`** — uppercase 11px tracked label with the gold leading hairline.

### Modes (atmosphere / density / accent)

The body carries three `data-` attributes set in `layout.tsx`:

- `data-atmosphere`: `signal` (default) | `shadow` | `classified` — controlled by token overrides in `tokens.css`
- `data-density`: `editorial` | `standard` (default) | `dense` — currently set on body but not yet wired through section padding (originally driven by the `tweaks-panel.jsx` overlay we **do not** ship)
- `data-accent`: `gold` (default) | `ember` | `bone` | `oxide` — swaps `--xe-gold` and `--line-gold`

If you add a new section, respect these modes by reading from `var(--xe-gold)` and friends, never a literal hex.

## Brand non-negotiables (from `.claude/commands/x-element-studio.md`)

- **One** gold element per primary viewport. Gold is never a background, never a gradient.
- **No pure white.** `--fg-1` is `#EAEAEA`.
- **Borders separate, not shadows.** Max border-radius `8px`. Never pill.
- **No emoji. No unicode glyphs as icons.**
- **Motion budget:** opacity, color, translate ≤ 4px. Duration `150ms` (default) / `220ms` (modal). Curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. **No** scale, rotate, spring, bounce.
- **Print/copy:** sentence case in body; UPPERCASE with wide tracking on buttons and labels. *Subject — verb — outcome*. No hedges, no hype, no apologies.

If a change makes the page look "cool," it's wrong. If it looks **inevitable**, it's right.

## QA pipeline (see `.claude/rules/qa-pipeline.md`)

Code delivery: `(@tester ∥ @security) → @reviewer`. Extended path-matrix triggers `@design-qa`, `@copywriter`, `@performance`, `@seo`, `@dba`, `@devops` automatically based on what files change. UI changes must reconcile against `docs/x-element/project/Landing Page-print.html` (the source of visual truth). The pipeline is non-negotiable; see the rule for state machine, severity gating, waivers, smart re-run, and the hotfix fast-path.

## Notes for future agents

- The HTML in `docs/` is **prototype**, not production. Recreate visually, do not transliterate structure.
- Do not render the prototype HTML in a browser to "check" — read the source. Dimensions and rules are spelled out.
- Inter ships locally as WOFF2 (rsms/inter 18pt optical, weights 300/400/500/600) — cinematic typography is brand identity. Exo 2 + JetBrains Mono come via `next/font/google`, which self-hosts the WOFF2 at build time (no Google CDN at runtime, no render-blocking `@import`).
- The `tweaks-panel.jsx` and `Landing Page-print.html` `<script>` tags from the design bundle are **not** ported. We replicate the visual states only.
