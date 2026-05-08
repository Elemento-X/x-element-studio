# Elemento-X — Design.md

> We are not loud. We are effective.
> We are not visible. We are essential.
> We don't decorate. We optimize.

Este documento é o guia de referência rápida para qualquer trabalho de design dentro do ecossistema Elemento-X. Use-o como ponto de partida antes de qualquer criação visual, interface, apresentação ou material de comunicação.

---

## 1. IDENTIDADE VISUAL

### Filosofia
- **Escuridão é o padrão. Ouro é o sinal.**
- O UI é 90% escuro, 10% sinal.
- O ouro nunca é fundo — é sempre ênfase intencional.
- Se parece "cool", você foi longe demais. Se parece **inevitável**, acertou.

### Logo
- **Primário:** flask/X dourado sobre fundo escuro (`assets/logo-mark-dark.svg`)
- **Wordmark inline:** `assets/wordmark-inline.svg` — para dark backgrounds
- **Mínimo:** 24px. Nunca distorcer, nunca adicionar efeitos.
- O logo representa autoridade. Não é decoração.

---

## 2. CORES

| Token | Hex | Uso |
|---|---|---|
| `--ex-deep-black` | `#0D0D0F` | Canvas principal |
| `--ex-near-black` | `#111114` | Painéis |
| `--ex-graphite` | `#1A1A1E` | Superfícies elevadas |
| `--ex-dark-gray` | `#2B2B2E` | Bordas, inputs |
| `--ex-gold` | `#F5C21A` | **Único acento. Uma vez por tela.** |
| `--ex-gold-dim` | `#C89E14` | Hover em botão gold |
| `--ex-soft-white` | `#EAEAEA` | Texto primário (nunca branco puro) |
| `--ex-muted-gray` | `#6A6A6F` | Metadata, timestamps, labels |

### Foreground semântico
| Token | Referência | Uso |
|---|---|---|
| `--fg-1` | `#EAEAEA` | Texto primário |
| `--fg-2` | `#B8B8BD` | Texto secundário |
| `--fg-3` | `#6A6A6F` | Terciário / meta |
| `--fg-signal` | `#F5C21A` | Acento dourado |

### Regras críticas
- **Nunca gradiente como fundo.**
- **Nunca mais de um elemento dourado por viewport primário.**
- Branco puro (`#FFFFFF`) é proibido — parece barato.
- Nenhuma cor nova inventada fora deste sistema.

---

## 3. TIPOGRAFIA

### Famílias

| Família | Uso | Fonte |
|---|---|---|
| **Exo 2** | Display, headlines, uppercase | Google Fonts |
| **Inter** | Body, UI (≤20px) | Brand-shipped (`fonts/`) |
| **Inter Display** | Médio heading (20–32px) | Brand-shipped |
| **Inter Headline** | Grande heading (32px+) | Brand-shipped |
| **JetBrains Mono** | Dados, código, timestamps | Google Fonts |

### Escala tipográfica

| Nome | Tamanho | Font | Case | Tracking |
|---|---|---|---|---|
| Display | 72px | Exo 2, 600 | UPPERCASE | 0.02em |
| H1 | 40px | Exo 2, 600 | UPPERCASE | 0.01em |
| H2 | 28px | Inter, 600 | Sentence | 0.02em |
| H3 | 20px | Inter, 600 | Sentence | 0.02em |
| Eyebrow | 11px | Inter, 500 | UPPERCASE | 0.22em |
| Body | 15px | Inter, 400 | Sentence | — |
| Small | 13px | Inter, 400 | — | — |
| Caption | 12px | Inter | — | — |
| Data XL | 48px | JetBrains Mono, 500 | — | -0.01em |
| Data LG | 32px | JetBrains Mono, 500 | — | -0.01em |
| Data MD | 20px | JetBrains Mono, 500 | — | — |

### Regras de casing
- **Botões:** UPPERCASE, tracking largo — lidos como comandos.
- **Labels de dados:** UPPERCASE, tracked. Valores em mono.
- **Eyebrows/kickers:** UPPERCASE, 0.22em tracking.
- **Body:** Sentence case. Nunca title case em UI.

### Mínimos
- Nada abaixo de **12px**.
- Slides: nada abaixo de **24px**.
- Mobile: hit targets nunca abaixo de **44px**.

---

## 4. ESPAÇAMENTO

Grid base: **4px**

| Token | Valor |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 24px |
| `--s-6` | 32px |
| `--s-7` | 48px |
| `--s-8` | 64px |
| `--s-9` | 96px |

- Padding de seção começa em **48–64px**.
- Gutters de dashboard mínimo **24px**.
- Espaço negativo generoso é **obrigatório**, não opcional.

---

## 5. BORDAS

| Token | Valor | Uso |
|---|---|---|
| `--line-hairline` | `rgba(234,234,234,0.06)` | Separação padrão |
| `--line-subtle` | `rgba(234,234,234,0.10)` | Painéis, cards |
| `--line-strong` | `rgba(234,234,234,0.16)` | Ênfase, elementos ativos |
| `--line-gold` | `rgba(245,194,26,0.45)` | Foco/active signal |

**Bordas são o mecanismo primário de separação — nunca sombras.**

---

## 6. BORDAS ARREDONDADAS

| Token | Valor | Uso |
|---|---|---|
| `--r-1` | 2px | Inputs, controles inline |
| `--r-2` | 4px | Botões, badges |
| `--r-3` | 6px | Cards, pequenos painéis |
| `--r-4` | 8px | **Máximo** — painéis grandes, modais |

- Nunca pill-shaped. Nunca totalmente arredondado. Sempre parece **engenheirado**.

---

## 7. SOMBRAS

| Token | Valor | Uso |
|---|---|---|
| `--shadow-1` | `0 1px 0 rgba(0,0,0,0.6)` | Sutilíssimo |
| `--shadow-2` | `0 2px 10px rgba(0,0,0,0.45)` | Menus flutuantes, modais |
| `--shadow-3` | `0 10px 40px rgba(0,0,0,0.55)` | Overlays |
| `--glow-gold` | `0 0 0 1px rgba(245,194,26,0.35), 0 0 24px rgba(245,194,26,0.10)` | Focus ring dourado |

- Nenhuma sombra colorida. Nenhum glow exceto o focus dourado.

---

## 8. CARDS E PAINÉIS

```
Background:  --bg-panel (#111114) ou --bg-raised (#1A1A1E)
Border:      1px --line-subtle em todos os lados
Radius:      6–8px
Padding:     24px mínimo
Header:      eyebrow (uppercase, tracked, muted) + título mono/display
```

---

## 9. ESTADOS DE INTERAÇÃO

| Estado | Comportamento |
|---|---|
| Hover (botão gold) | Shift para `--ex-gold-dim`, sem motion |
| Hover (ghost) | Border: subtle → strong; text: fg-2 → fg-1 |
| Hover (rows) | Background +4pt cinza (`rgba(234,234,234,0.03)`) |
| Press | Brightness -10%. **Sem scale. Sem bounce.** |
| Focus | 1px gold edge + glow dourado radial 24px @ 10% |

---

## 10. MOTION

- Transições: `150ms cubic-bezier(0.2, 0.8, 0.2, 1)` padrão. `220ms` para modais.
- **Apenas opacity, color, e translate ≤ 4px.**
- **Sem scale. Sem rotate. Sem spring. Sem bounce.**
- Motion comunica resposta do sistema, não personalidade da interface.

---

## 11. ICONOGRAFIA

### Motivos de marca (brand-only)
| Ícone | Arquivo | Uso |
|---|---|---|
| Flask com X | `assets/icon-flask.svg` | Identidade, loading states |
| Orbit | `assets/icon-orbit.svg` | Automação, sistema ativo |
| Target | `assets/icon-target.svg` | CTAs, pontos de dados-chave |
| Layers | `assets/icon-layers.svg` | Arquitetura, agrupamentos |

### UI funcional — Lucide
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="activity" class="icon"></i>
<script>lucide.createIcons();</script>
```
- Default: `--fg-2` | Hover: `--fg-1` | Ativo: `--ex-gold`
- Tamanho: 16px (UI), 20px (nav), 24px (hero)
- Stroke default do Lucide. Nunca filled. Nunca colorido fora dos 3 estados.

### Proibições absolutas
- **Nunca emoji.**
- **Nunca unicode como ícone decorativo.**

---

## 12. LAYOUT

| Elemento | Medida |
|---|---|
| Colunas desktop | 12-col |
| Colunas tablet | 8-col |
| Colunas mobile | 4-col |
| Nav top (fixo) | 56px |
| Sidebar expandida | 240px |
| Sidebar colapsada | 56px |
| Max content width | 1280px |
| Max reading width | 680px |

---

## 13. VISUALIZAÇÃO DE DADOS

- **Série base:** `--fg-3` (cinza muted)
- **Série destacada:** `--ex-gold` — **apenas uma por gráfico**
- Sem paletas multicoloridas. Máximo: gold + 2 tons de cinza.
- Gridlines: `--line-hairline`. Eixos: `--fg-3`.
- Labels: 11px, uppercase, tracked, muted.
- Tooltips: painel escuro, 1px border subtle, valores mono.

---

## 14. VOZ E TOM

### Casing
- Display/headlines: UPPERCASE com tracking largo
- Eyebrows/labels: UPPERCASE, 0.22em
- Body: Sentence case
- Botões: UPPERCASE — comandos, não convites

### Princípios
- **Direto.** Sujeito — verbo — resultado. Sem aquecimento.
- **Controlado.** Nunca hedges. Nunca hype. Nunca pede desculpa.
- **Mínimo.** Uma ideia por frase. Silêncio é formato.
- **"Nós"** para representar a empresa. **"Você"** raramente, apenas em empty states/dialogs diretos.

### Do / Avoid
| ✓ Faça | ✗ Evite |
|---|---|
| "We build systems that scale." | "Let's build something amazing! 🚀" |
| "Precision over noise." | "Clean, modern, and easy to use." |
| "Signal detected. 03:14 UTC." | "Heads up — something new!" |
| "Automation restored. 128 flows." | "Hooray! Your flows are back online." |
| "Review required. 3 items." | "Oops! 3 things need your attention." |

---

## 15. CHECKLIST DE ENTREGA

Antes de entregar qualquer artefato de design, confirme:

- [ ] Fundo em `--bg-canvas` (#0D0D0F) ou superfície escura correta
- [ ] Apenas **um** elemento dourado no viewport principal
- [ ] Tipografia dentro da escala definida, nada abaixo de 12px
- [ ] Espaçamento na grade de 4px
- [ ] Bordas como separação primária (não sombras)
- [ ] Border-radius máximo de 8px
- [ ] Sem gradientes como fundo
- [ ] Sem emoji
- [ ] Sem branco puro (#FFFFFF)
- [ ] Copy em sentence case (corpo) e UPPERCASE (labels/botões)
- [ ] Ícones Lucide nos estados corretos (fg-2 / fg-1 / gold)
- [ ] Motion apenas em opacity, color, translate ≤ 4px

---

## 16. SETUP RÁPIDO (HTML)

```html
<!-- 1. Tokens -->
<link rel="stylesheet" href="colors_and_type.css">

<!-- 2. Google Fonts (display + mono) -->
<!-- Já importados no colors_and_type.css -->

<!-- 3. Lucide (ícones UI) -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

<!-- 4. Base body -->
<body style="background: var(--bg-canvas); color: var(--fg-1);">
```

---

*Elemento-X Design System — versão derivada do brand board fundador.*
*Última atualização: Abril 2026.*
