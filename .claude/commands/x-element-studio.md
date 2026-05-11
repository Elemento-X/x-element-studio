---
description: Contexto completo do projeto X Element Studio. Carregado automaticamente em toda sessão.
---

# X Element Studio — Contexto do Projeto

## O que é

Site marketing / landing page do **X Element Studio** — estúdio de tecnologia que constrói sistemas inteligentes, pipelines de automação e produtos digitais escaláveis. Marca posicionada como *high-end private intelligence platform*, não como agência criativa.

- **Tagline (PT-BR):** *Sistemas inteligentes. Impacto real.*
- **Tagline (EN):** *Intelligent systems. Real impact.*
- **Voz:** *We are not seen. But everything works because of us.*

## Stack (alvo)

> A definir com Maclean antes do scaffolding. Recomendação atual: **Next.js 14 (App Router) + TypeScript + CSS Modules** — SSR/SEO out-of-the-box, alinhado com `@rocketseat/eslint-config/next`, sem Tailwind (a marca prefere tokens manuais via `colors_and_type.css`, não classes utilitárias).

## Estrutura

```
x-element-studio/
├── .claude/                       # Equipe de agentes, hooks, rules, metrics
├── src/
│   ├── docs/
│   │   ├── x-element/            # Handoff Claude Design — Landing Page
│   │   │   └── project/
│   │   │       ├── Landing Page-print.html  # Source de verdade do design
│   │   │       ├── colors_and_type.css      # Tokens (cores, type, spacing)
│   │   │       ├── tweaks-panel.jsx         # Ignorar (overlay de design)
│   │   │       ├── assets/                  # Logos, ícones brand (svg/png)
│   │   │       └── fonts/                   # Inter (18/24/28pt)
│   │   └── x-element-design-system/        # Sistema completo
│   │       └── project/
│   │           ├── Design.md                # Guia de bolso (PT-BR)
│   │           ├── README.md                # Brand bible (EN)
│   │           ├── colors_and_type.css      # = mesmo dos tokens da landing
│   │           ├── preview/                 # Cards do DS (cores, type, btns)
│   │           ├── ui_kits/dashboard/       # Ops Console (futuro produto)
│   │           ├── assets/                  # Brand board, conceitos, marks
│   │           └── fonts/                   # Inter
└── (a criar) app/, components/, public/, package.json...
```

## Filosofia de marca (inegociável)

- **Darkness as default. Gold as signal.** UI 90% escuro, 10% sinal.
- **Apenas UM elemento dourado por viewport primário.** Gold nunca é fundo.
- **Sem branco puro** (`#FFFFFF`) — usa `--xe-soft-white` (`#EAEAEA`).
- **Bordas separam, não sombras.** Border-radius máximo: `8px`. Nunca pill.
- **Sem gradientes como background.** Permitido apenas: gold shaft vertical + grain 1–3%.
- **Sem emoji. Sem unicode decorativo.**
- **Motion:** `150ms cubic-bezier(0.2, 0.8, 0.2, 1)`. Apenas opacity, color, translate ≤ 4px. Sem scale, sem bounce, sem rotate.
- **Tom:** direto, controlado, mínimo. Sentence case no body, UPPERCASE em botões/labels com tracking largo.
- **Copy:** sujeito → verbo → resultado. Sem hedges, sem hype, sem desculpas.

Se parece "cool", foi longe demais. Se parece **inevitável**, acertou.

## Tokens críticos (resumo — fonte: `colors_and_type.css`)

```
Cores
  --xe-deep-black   #0D0D0F   canvas
  --xe-near-black   #111114   panels
  --xe-graphite     #1A1A1E   raised
  --xe-dark-gray    #2B2B2E   borders, inputs
  --xe-gold         #F5C21A   acento — uma vez por tela
  --xe-gold-dim     #C89E14   hover gold
  --xe-soft-white   #EAEAEA   texto primário (--fg-1)
  #B8B8BD                     texto secundário (--fg-2)
  --xe-muted-gray   #6A6A6F   meta (--fg-3)

Tipografia
  Display       Exo 2          uppercase, tracking 0.02em
  Body / UI     Inter          (Inter Display 20–32px, Inter Headline 32+)
  Data / Mono   JetBrains Mono tabular numerals

Spacing (grid 4px)  4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
Radii               2 / 4 / 6 / 8 (max)
```

## Landing Page — seções (em ordem)

1. **Nav** — sticky 72px, logo flask em chip dourado, links numerados, status `OPERATIONAL · HH:MM UTC` (live), ghost CTA "Start"
2. **Hero** — `min-h: 100vh - 72px`, grid 80px com mask radial, gold shaft à direita, glyph SVG (flask + orbit + X + nodes), display heading com `gold` + `thin` spans, sub, dois CTAs, scroll indicator + coords (LAT/LNG/NODE)
3. **Trust** (4 stats) — engagements 42 / flows 128 / uptime 99.98% / time saved 11.4k hrs
4. **Capabilities** (7 services) — 3 colunas, hover gold top-line, número, título, copy, meta · duração + tagline cell de span 2
5. **Process** — 4 fases (Discover · Architect · Build · Scale) com markers circulares, signal no step 02, conector horizontal degradê
6. **Signal / Work** — 5 cases (1 destaque + 2 + 2) com viz SVG (chart, orbit, bars, layers, crosshair) e stats mono
7. **Manifesto** — flask glyph dourado + 3 linhas: *"We are not seen. / But everything works / because of us."*
8. **Final CTA** — *Book a discovery call* + engagement brief card com rows mono
9. **Footer** — 4 colunas + bottom mono

Modos (controlados por `data-` attrs no `<body>`):
- `data-atmosphere`: `signal` (default) / `shadow` / `classified`
- `data-density`: `editorial` / `standard` (default) / `dense`
- `data-accent`: `gold` (default) / `ember` / `bone` / `oxide`

## Comandos (a configurar pós-scaffold)

- Dev: `npm run dev`
- Build: `npm run lint && npm run build`
- Lint: `npx eslint .`
- Typecheck: `npm run typecheck` (`tsc --noEmit`)

## Equipe ativa

- **@reviewer** — gate final do pipeline QA
- **@tester** — coverage 90%+, comportamento, não implementação
- **@security** — OWASP, supply chain, secrets
- **@designer / @design-qa** — fidelidade ao brand book + Landing Page-print.html
- **@copywriter** — tom de voz "we are not seen", PT-BR ↔ EN coerentes
- **@performance / @seo** — Core Web Vitals e indexação (landing pública)

Pipeline core: `(@tester + @security) → @reviewer`. Ver `.claude/rules/qa-pipeline.md`.

## Skills instaladas

`find-skills`, `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max` (este último flagged High Risk pelo Gen — usar com revisão antes).

## Princípios de execução para esta página

- **Recriar pixel-perfect** o `Landing Page-print.html` em React. Não copiar estrutura interna do protótipo se não couber em React; copiar visual.
- **Não renderizar o HTML em browser nem tirar screenshot** sem pedido explícito. As medidas estão no source.
- **Sempre sentar nos tokens** do `colors_and_type.css`. Nenhum valor hex inline fora do design system.
- **Lucide para ícones funcionais** (CDN ou pacote). Brand motifs em SVG (assets/).
- **Acessibilidade:** focus ring dourado obrigatório (1px + glow 24px @ 10%). Hit targets ≥ 44px no mobile.
