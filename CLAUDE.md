# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Elemento-X Studio** — landing site for a high-performance technology studio. Brand voice: *"Darkness as default. Gold as signal."* — controlled, minimal, never warm.

Repo: https://github.com/Elemento-X/elemento-x-studio

The full project context (brand, tokens, sections, design rules) lives in `.claude/commands/elemento-x-studio.md`. Read that first; it is the source of truth for any visual or copy decision.

## Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **CSS Modules** + design tokens in `app/tokens.css` (no Tailwind by design — the system is token-first, not utility-first)
- **`next/font/local`** for Inter (WOFF2 from `public/fonts/`, weights 300/400/500/600 only); **Exo 2** + **JetBrains Mono** via `next/font/google` (self-hosted at build time, zero render-blocking external requests)
- **lucide-react** for functional UI icons (brand motifs are bespoke SVG in `public/assets/`)

## Commands

```bash
npm run dev        # next dev — http://localhost:3000
npm run build      # next build — production output
npm run lint       # next lint (ESLint + Prettier via @rocketseat/eslint-config/next)
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write .
```

The hooks in `.claude/hooks/` run lint, typecheck, prettier, secret-scan, and protect-files automatically on every Edit/Write. They use `npx --no-install`, so they only fire when the local tool is installed.

## Architecture

### Top-level layout

```
app/
  layout.tsx          # Root layout — Inter local font, body data-attrs (atmosphere/density/accent)
  page.tsx            # Landing — composes section components in order
  globals.css         # Reset + .container utility + reduced-motion
  tokens.css          # All design tokens + atmosphere/accent mode overrides
  _components/        # App Router private folder (underscore = no route generated)
    <Section>/
      <Section>.tsx           # Component (server by default; "use client" only when needed)
      <Section>.module.css    # Co-located styles
public/
  fonts/              # Inter 18pt WOFF2 (300/400/500/600 only) — Exo 2 + JetBrains via next/font/google
  assets/             # Brand SVG/PNG (logo flask, wordmarks, motif icons)
src/docs/             # Claude Design handoff bundles (READ-ONLY reference)
  elemento-x/                 # Landing page source-of-truth (HTML/CSS prototype)
  elemento-x-design-system/   # Brand bible + DS preview cards + dashboard kit
.claude/
  agents/             # Specialized QA/review/security/etc. agents
  commands/           # Slash commands — including elemento-x-studio.md (project context)
  hooks/              # PreToolUse/PostToolUse JS scripts (format/lint/protect/secret-scan)
  rules/              # Path-scoped rules (qa-pipeline, security, api-contract, api-routes)
  metrics/            # pipeline.jsonl + categories.json (QA telemetry)
```

### Section composition (Landing)

`app/page.tsx` mounts: `Nav → Hero → Trust → Capabilities → Process → Work → Manifesto → FinalCta → Footer`. Each is co-located in `app/_components/<Section>/` and imported from `./_components/<Section>/<Section>` (relative) or `@/app/_components/<Section>/<Section>` (cross-route).

Shared primitives:

- **`Button`** — single component with `variant: 'primary' | 'ghost'`, polymorphic `as: 'a' | 'button'`, optional `withArrow`. Hover/press states match `colors_and_type.css` rules (gold dim on primary, border-strong on ghost).
- **`Reveal`** — IntersectionObserver-based fade+translate-Y entrance. `'use client'`. All in-view animation goes through this — do not hand-roll.
- **`SectionHead`** — eyebrow + numbered label + display H2 + lead copy, in the canonical 1fr/2fr grid.
- **`Eyebrow`** — uppercase 11px tracked label with the gold leading hairline.

### Modes (atmosphere / density / accent)

The body carries three `data-` attributes set in `layout.tsx`:

- `data-atmosphere`: `signal` (default) | `shadow` | `classified` — controlled by token overrides in `tokens.css`
- `data-density`: `editorial` | `standard` (default) | `dense` — currently set on body but not yet wired through section padding (originally driven by the `tweaks-panel.jsx` overlay we **do not** ship)
- `data-accent`: `gold` (default) | `ember` | `bone` | `oxide` — swaps `--ex-gold` and `--line-gold`

If you add a new section, respect these modes by reading from `var(--ex-gold)` and friends, never a literal hex.

## Brand non-negotiables (from `.claude/commands/elemento-x-studio.md`)

- **One** gold element per primary viewport. Gold is never a background, never a gradient.
- **No pure white.** `--fg-1` is `#EAEAEA`.
- **Borders separate, not shadows.** Max border-radius `8px`. Never pill.
- **No emoji. No unicode glyphs as icons.**
- **Motion budget:** opacity, color, translate ≤ 4px. Duration `150ms` (default) / `220ms` (modal). Curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. **No** scale, rotate, spring, bounce.
- **Print/copy:** sentence case in body; UPPERCASE with wide tracking on buttons and labels. *Subject — verb — outcome*. No hedges, no hype, no apologies.

If a change makes the page look "cool," it's wrong. If it looks **inevitable**, it's right.

## QA pipeline (see `.claude/rules/qa-pipeline.md`)

Code delivery: `(@tester + @security) → @reviewer`. Extended path-matrix triggers `@design-qa`, `@copywriter`, `@performance`, `@seo` automatically based on what files change. UI changes must reconcile against `src/docs/elemento-x/project/Landing Page-print.html` (the source of visual truth).

## Notes for future agents

- The HTML in `src/docs/` is **prototype**, not production. Recreate visually, do not transliterate structure.
- Do not render the prototype HTML in a browser to "check" — read the source. Dimensions and rules are spelled out.
- Inter ships locally as WOFF2 (rsms/inter 18pt optical, weights 300/400/500/600) — cinematic typography is brand identity. Exo 2 + JetBrains Mono come via `next/font/google`, which self-hosts the WOFF2 at build time (no Google CDN at runtime, no render-blocking `@import`).
- The `tweaks-panel.jsx` and `Landing Page-print.html` `<script>` tags from the design bundle are **not** ported. We replicate the visual states only.
