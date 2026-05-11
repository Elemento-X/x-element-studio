# Visual Audit F6.1 — 2026-05-11

> Auditoria sistemática 5 breakpoints × 9 sections do landing X Element Studio.
> Executor: @design-qa (v2.0)
> Modo: full-audit estático (sem screenshots — Round 2 se necessário)
> Card Trello: [F6.1 #58](https://trello.com/c/FpT8jdGN)

## Sumário

| Severity   | Count | IDs |
|------------|-------|---|
| **CRÍTICO**| 1     | F-NAV-01 |
| **ALTO**   | 9     | F-NAV-02, F-HERO-01, F-CAP-01, F-PROC-01, F-WORK-01, F-MANI-01, F-CTA-01, F-CTA-03, F-SYS-01 |
| **MÉDIO**  | 16    | F-NAV-03, F-HERO-02, F-HERO-03, F-CAP-02, F-CAP-03, F-PROC-02, F-PROC-03, F-WORK-02, F-WORK-03, F-MANI-02, F-CTA-02, F-CTA-04, F-CTA-05, F-FOOT-01, F-FOOT-02, F-A11Y-01, F-SYS-02, F-SYS-03, F-SYS-04 |
| **BAIXO**  | 6     | F-NAV-04, F-HERO-04, F-TRUST-01, F-CAP-04, F-MANI-03, F-FOOT-03, F-SYS-05, T-01 |

**Stats:** 32 findings | 9 sections + 4 primitives | 5 breakpoints | 195 ocorrências de spacing hardcoded (sistema de tokens declarado mas não usado fora de ContactForm) | 100% radius tokenizado | 0 shadow tokens consumidos.

## Contexto

**SPEC do @designer:** CLAUDE.md referencia `src/docs/x-element/...` mas o diretório real é `docs/x-element/` (drift de path documental — não afeta este audit). Audit operou em **modo sem-spec pixel-a-pixel** — fidelidade aferida contra:

1. Brand non-negotiables explícitos em `CLAUDE.md` (motion budget, 1 gold/viewport, radius ≤8px, no shadows decorativas, no pure white, sentence/UPPERCASE rules).
2. Design tokens em `app/tokens.css` (única source of truth ativa).
3. Consistência transversal entre as 9 sections.

**Breakpoints na cascata atual (CSS Modules):**

- 320 → cascata mobile padrão (cai no `max-width: 720px`)
- 720 → breakpoint mobile primário
- 1024 → breakpoint tablet/desktop
- 1280 → desktop padrão (cai no default, `container` max-width: 1280px)
- 1440+ → wide (`container-wide` max-width: 1440px)

**Observação estrutural:** não existe nenhum breakpoint entre 720px e 1024px. A faixa 721–1023px (tablet portrait/landscape) herda o desktop layout integral — fonte de findings de "orphan layouts" em Capabilities, Work e Process.

## Matriz 5 × 9

Legenda: `✓` ok, `⚠` finding (não-bloqueante até MÉDIO), `✗` finding ALTO+ ou múltiplos issues empilhados.

| Section / BP            | 320px | 720px | 1024px | 1280px | 1440+ |
|-------------------------|:-----:|:-----:|:------:|:------:|:-----:|
| 1. Nav                  |  ✗    |  ⚠    |   ✓    |   ✓    |   ✓   |
| 2. Hero                 |  ⚠    |  ⚠    |   ✓    |   ✓    |   ✓   |
| 3. Trust                |  ✓    |  ✓    |   ✓    |   ✓    |   ✓   |
| 4. Capabilities         |  ⚠    |  ⚠    |   ⚠    |   ✓    |   ✓   |
| 5. Process              |  ⚠    |  ⚠    |   ⚠    |   ✓    |   ✓   |
| 6. Work                 |  ⚠    |  ⚠    |   ✗    |   ✓    |   ✓   |
| 7. Manifesto            |  ⚠    |  ⚠    |   ⚠    |   ✓    |   ✓   |
| 8. FinalCta + Form      |  ⚠    |  ⚠    |   ⚠    |   ✓    |   ✓   |
| 9. Footer               |  ⚠    |  ⚠    |   ⚠    |   ✓    |   ✓   |

**Padrão sistêmico:** mobile (320) e mobile-mid (720) carregam a maior parte dos findings; a faixa "tablet sem breakpoint próprio" (sub-1024, especificamente 720–1023) é onde Work e Process pioram. Desktop ≥1280px é sólido.

## Findings detalhados

### Section 1 — Nav

#### F-NAV-01 — [CRÍTICO | confidence: high] missing-mobile-nav

- **File:** `app/_components/Nav/Nav.module.css:116-126`
- **Breakpoint:** 320–1023px
- **Fingerprint:** `design-qa:missing-mobile-nav:Nav.module.css:.links`

Em `max-width: 1024px` o seletor `.links { display: none }` esconde todos os links de navegação sem nenhum substituto (sem hamburger, sem drawer, sem bottom-sheet, sem menu, sem ícone). Em viewport mobile sobra apenas: brand + CTA "begin a brief". Usuário no celular não consegue navegar para nenhuma section que não seja contact via header.

**Impacto:** quebra de UX primária em todo viewport <1024px. ~60% do tráfego típico de uma landing. CTAs internos no body conseguem navegar, mas o pattern de "navegar pelo Nav" não existe — anti-pattern para SPA-style landing.

**Recomendação:** mobile menu (hamburger → drawer ou inline expanding). Mínimo: ícone visível em mobile que abre lista.

#### F-NAV-02 — [ALTO | confidence: high] content-overflow-risk

- **File:** `app/_components/Nav/Nav.module.css:1-10` + `:82-95`
- **Breakpoint:** 320–540px aprox.
- **Fingerprint:** `design-qa:content-overflow:Nav.module.css:.inner`

Em mobile, brand (logo+wordmark) + CTA "begin a brief" justificados com gap 32px. Status sumiu em 720px. Em 320px com container padding `0 20px`, restando ~280px úteis. Conjunto chega perto de transbordar ou transborda em PT-BR/FR.

**Recomendação:** variant abreviado do CTA em mobile, ou esconder o `dot` da CTA e usar somente ícone-arrow, ou reduzir `letter-spacing` no btn em mobile.

#### F-NAV-03 — [MÉDIO | confidence: high] decorative-shadow

- **File:** `app/_components/Nav/Nav.module.css:97-104`
- **Fingerprint:** `design-qa:decorative-shadow:Nav.module.css:.dot`

`.dot` tem `box-shadow: 0 0 8px rgba(245, 194, 26, 0.6)` — glow decorativo de 8px. Viola brand rule "borders separate, not shadows".

**Recomendação:** remover o box-shadow. O `pulse 2.4s ease-in-out infinite` já é signal suficiente.

#### F-NAV-04 — [BAIXO | confidence: medium] tablet-not-designed

- **File:** `app/_components/Nav/Nav.module.css:116-119`
- **Breakpoint:** 720–1023px (tablet)
- **Fingerprint:** `design-qa:tablet-not-designed:Nav.module.css:tablet-range`

Tablet portrait ganha o mesmo tratamento de mobile (links sumidos). Faria sentido manter links visíveis em tablet com escala menor. Não-bloqueante mas é "mobile esticado".

### Section 2 — Hero

#### F-HERO-01 — [ALTO | confidence: high] viewport-overflow-mobile

- **File:** `app/_components/Hero/Hero.module.css:2`
- **Breakpoint:** 320–720px
- **Fingerprint:** `design-qa:viewport-overflow:Hero.module.css:.hero-min-height`

`min-height: calc(100vh - 72px)` aplicado em todos viewports. Em mobile landscape (568×320 com URL bar = ~245px útil) hero ocupa tela inteira sem mostrar headline + sub + CTAs. `100vh` em iOS Safari não conta com UI bar.

**Recomendação:** `min-height: 100svh - 72px` ou override em mobile: `@media (max-width: 720px) { min-height: auto; padding: 64px 0 48px }`.

#### F-HERO-02 — [MÉDIO | confidence: high] typography-fluidity-floor

- **File:** `app/_components/Hero/Hero.module.css:133-141`
- **Breakpoint:** 320px
- **Fingerprint:** `design-qa:type-floor:Hero.module.css:.headline`

`font-size: clamp(48px, 7.2vw, 104px)` — em 320px clamp pega floor 48px. Headline uppercase Exo 2 weight 600 em 48px com letter-spacing 0.005em. Palavras de 11+ chars em 48px transbordam container de 280px úteis.

**Recomendação:** `clamp(36px, 7.2vw, 104px)` ou breakpoint dedicado em 360px-, considerar `word-break: break-word`.

#### F-HERO-03 — [MÉDIO | confidence: medium] layout-collapse

- **File:** `app/_components/Hero/Hero.module.css:168-205`
- **Breakpoint:** 720px e abaixo
- **Fingerprint:** `design-qa:layout-collapse:Hero.module.css:.bottom`

Em mobile `.bottomInner` continua `display: flex` com gap 48px. Scroll-hint + coords lado-a-lado em 280px é apertado e visualmente desbalanceado (coords tem 3 linhas, `align-items: flex-end`).

**Recomendação:** `@media (max-width: 540px)`: `.bottomInner { flex-direction: column; align-items: flex-start; gap: 24px }`.

#### F-HERO-04 — [BAIXO | confidence: medium] decorative-shaft

- **File:** `app/_components/Hero/Hero.module.css:30-46`
- **Fingerprint:** `design-qa:decorative-shaft:Hero.module.css:.shaft`

`.shaft` (linha vertical dourada `right: 8%`) e `::before` ficam a 8% do viewport mesmo em 320px (~25px da borda). Esconder em mobile (`@media (max-width:720px) { display: none }`) para limpar.

### Section 3 — Trust

#### F-TRUST-01 — [BAIXO | confidence: medium] type-large-stat

- **File:** `app/_components/Trust/Trust.module.css:78-86`
- **Breakpoint:** 320px
- **Fingerprint:** `design-qa:type-large-stat:Trust.module.css:.stat`

`.stat` 38px JetBrains Mono medium não fluido — mantém 38px em qualquer viewport. Em 320px ainda cabe (stats ~3-4 chars). Estável.

**Nota positiva:** Trust é a section mais bem comportada do audit. Todos breakpoints OK (4→2→1 col linear).

### Section 4 — Capabilities

#### F-CAP-01 — [ALTO | confidence: high] odd-card-orphan

- **File:** `app/_components/Capabilities/Capabilities.module.css:25` + `:110-120`
- **Breakpoint:** 720–1023px
- **Fingerprint:** `design-qa:odd-card-orphan:Capabilities.module.css:.grid`

7 service cards + 1 tagline-card (span 2). Em tablet `max-width: 1024px → repeat(2, 1fr)`: tagline mantém `grid-column: span 2`, 7 cards em 2 cols = 3.5 linhas → 7º card fica órfão sozinho na primeira coluna da row 4 com coluna 2 vazia.

**Recomendação:** em tablet acrescentar dummy card visual, ou `.svc:last-child:not(.tagline) { grid-column: span 2 }` em max-width:1024.

#### F-CAP-02 — [MÉDIO | confidence: high] tagline-not-responsive

- **File:** `app/_components/Capabilities/Capabilities.module.css:147-155`
- **Breakpoint:** 320px (e PT-BR/FR)
- **Fingerprint:** `design-qa:tagline-not-responsive:Capabilities.module.css:.taglineLine`

`.taglineLine` 22px uppercase Exo 2 weight 500 com `padding: 36px 32px` em mobile. Em 320px → 216px úteis pra frase tipo "Engineering is a posture" em 22px tracked. Pode quebrar feio com locales longos.

**Recomendação:** `@media (max-width: 720px) { .taglineLine { font-size: 18px } .tagline { padding: 24px } }`.

#### F-CAP-03 — [MÉDIO | confidence: high] multi-gold-cards

- **File:** `app/_components/Capabilities/Capabilities.module.css:30-39`
- **Fingerprint:** `design-qa:multi-gold-cards:Capabilities.module.css:.svc::before`

Cada `.svc:hover` revela `::before` gold (width 0→100%). No grid 3 cols com 7 cards, hover rápido pode coexistir 2 golds (transition 280ms). Plus `.taglineEyebrow::before` gold. Transient violation de "1 gold per viewport".

**Recomendação:** aceitar como hover state legítimo e documentar exceção, ou só desenhar hover line em viewport ≥1024 (desativar em hover-coarse).

#### F-CAP-04 — [BAIXO | confidence: high] min-height-stale

- **File:** `app/_components/Capabilities/Capabilities.module.css:25`
- **Breakpoint:** 720px
- **Fingerprint:** `design-qa:min-height-stale:Capabilities.module.css:.svc`

`.svc { min-height: 280px }` permanece em mobile (1 col). Cards com pouca copy geram espaço vazio. Em mobile usuário scrolla 280px × 7 cards = 1960px só de capabilities.

**Recomendação:** `@media (max-width: 720px) { .svc { min-height: 220px } }`.

### Section 5 — Process

#### F-PROC-01 — [ALTO | confidence: high] anim-positional

- **File:** `app/_components/Process/Process.module.css:900-909`
- **Breakpoint:** 720–1023px (e mobile)
- **Fingerprint:** `design-qa:anim-positional:Process.module.css:.gridActive-2col`

Animação sequencial usa `nth-child(1..4)` para timings (Step 1: 400ms → Step 4: 3950ms). Em tablet 2×2 a animação rola top-left → top-right → bottom-left → bottom-right (estranho visualmente porque leitor scrolla linhas). Em mobile 1×4 a animação dura 5350ms até `enable-hover` — usuário scrolla pra próxima section antes de terminar. **`pointer-events: none` por 5.35s mesmo em mobile** (que não tem hover) bloqueia tap accidental.

**Recomendação:**
- `@media (hover: none) and (pointer: coarse) { .gridActive .step { pointer-events: auto } }` — libertar tap imediatamente
- Ou: refatorar pra `data-step-index` no JSX em vez de `nth-child`, com timings menores em mobile

#### F-PROC-02 — [MÉDIO | confidence: high] illust-aspect

- **File:** `app/_components/Process/Process.module.css:120-124`
- **Breakpoint:** 320–720px
- **Fingerprint:** `design-qa:illust-aspect:Process.module.css:.illust`

`.illust { aspect-ratio: 4 / 5 }` — em mobile cards ficam ~240×300, mais 4 steps = ~1440px de scroll só de illustrations. Plus 4 coord labels nos cantos podem ficar apertados.

**Recomendação:** `aspect-ratio: 1/1` ou `5/4` em mobile.

#### F-PROC-03 — [MÉDIO | confidence: medium] num-mobile

- **File:** `app/_components/Process/Process.module.css:60-68`
- **Breakpoint:** 320px
- **Fingerprint:** `design-qa:num-mobile:Process.module.css:.num`

`.num` 56px italic Exo 2 — ratio 2.5x maior que `.title` (22px). Desproporcional em mobile.

**Recomendação:** `font-size: 44px` em mobile.

### Section 6 — Work

#### F-WORK-01 — [ALTO | confidence: high] work-row-tablet

- **File:** `app/_components/Work/Work.module.css:172-179`
- **Breakpoint:** 1024px
- **Fingerprint:** `design-qa:work-row-tablet:Work.module.css:.row`

3 cards (`.row`) em 2 cols → 3º card "Finance Ops" fica órfão na linha 2, coluna esquerda, coluna 2 vazia. Gold-stat (`vSignal`) do card órfão quebra "1 gold per viewport".

**Recomendação:** `.row .case:last-child { grid-column: span 2 }`, ou `grid-template-columns: 1fr` em tablet (full-width como mobile).

#### F-WORK-02 — [MÉDIO | confidence: high] viz-height-fixed

- **File:** `app/_components/Work/Work.module.css:73-90`
- **Breakpoint:** 320px
- **Fingerprint:** `design-qa:viz-height-fixed:Work.module.css:.viz`

`.viz { height: 180px }` fixo. Em 320- card ~240px largura fica quadrado-ish, visualizations apertadas.

**Recomendação:** `aspect-ratio: 16/9` em mobile.

#### F-WORK-03 — [MÉDIO | confidence: high] stats-flex

- **File:** `app/_components/Work/Work.module.css:106-111`
- **Breakpoint:** 320–720px
- **Fingerprint:** `design-qa:stats-flex:Work.module.css:.stats`

`.stats { display: flex; gap: 24px }` com 3 stats por card. Em 280px largura, 3 stats × ~80-100px + 2×24px gap = ~260-340px. Provavelmente transborda em 320 com PT-BR/FR.

**Recomendação:** `flex-wrap: wrap` ou `grid-template-columns: repeat(3, 1fr)` com `font-size: 18px` em mobile.

### Section 7 — Manifesto

#### F-MANI-01 — [ALTO | confidence: high] no-mobile-breakpoint

- **File:** `app/_components/Manifesto/Manifesto.module.css:1-2`
- **Breakpoint:** 320–1023px
- **Fingerprint:** `design-qa:no-mobile-breakpoint:Manifesto.module.css:.manifesto`

**Zero breakpoints na section inteira.** `padding: 160px 0` em todos viewports — em 320×640 consume 320px = 50% do viewport só em padding vertical.

**Recomendação:** `@media (max-width: 720px) { .manifesto { padding: 80px 0 } .flask { margin-bottom: 32px } .body { margin-top: 32px } .sig { margin-top: 32px } }`.

#### F-MANI-02 — [MÉDIO | confidence: high] decorative-shadow

- **File:** `app/_components/Manifesto/Manifesto.module.css:62-74`
- **Fingerprint:** `design-qa:decorative-shadow:Manifesto.module.css:.flask`

`.flask box-shadow: 0 0 0 1px rgba(245, 194, 26, 0.4), 0 0 60px rgba(245, 194, 26, 0.18)` — 1px ring que deveria ser border + 60px glow decorativo. Anti-brand.

**Recomendação:** trocar `0 0 0 1px` por `border: 1px solid var(--line-gold)` e remover o `0 0 60px`.

#### F-MANI-03 — [BAIXO | confidence: medium] shaft-glow-mobile

- **File:** `app/_components/Manifesto/Manifesto.module.css:32-44`
- **Breakpoint:** 320px
- **Fingerprint:** `design-qa:shaft-glow-mobile:Manifesto.module.css:.shaft`

`.glow { width: 500px }` fixo. Em 320px viewport o 500px centrado vai além das bordas (clipped por overflow:hidden).

**Recomendação:** `width: min(500px, 90vw)`.

### Section 8 — FinalCta + ContactForm

#### F-CTA-01 — [ALTO | confidence: high] missing-tablet

- **File:** `app/_components/FinalCta/FinalCta.module.css:8-12`
- **Breakpoint:** 720–1023px
- **Fingerprint:** `design-qa:missing-tablet:FinalCta.module.css:.inner`

Entre 641px e 720px (faixa estreita), form renderiza 2 colunas dentro de card já em mobile-mode. Plus ContactForm usa breakpoint 640px (único do projeto — resto usa 720).

**Recomendação:** alinhar breakpoint do ContactForm em 720px e `.card { padding: 24px }` em max-width: 720.

#### F-CTA-02 — [MÉDIO | confidence: high] touch-target

- **File:** `app/_components/ContactForm/ContactForm.module.css:78-91` + `Button.module.css`
- **Breakpoint:** 320px (e geral)
- **Fingerprint:** `design-qa:touch-target:ContactForm.module.css:.input`

`.submitBone` e Button.primary/ghost — `padding: 14px 22px; line-height: 1; font-size: 12px` → 40px altura. **40px < 44px (WCAG 2.5.5 AAA / Apple HIG)**. Afeta TODOS os CTAs primários do site.

**Recomendação:** Button `padding: 16px 22px` em mobile, ou `min-height: 44px`.

> **Em pre-release severity escala para ALTO** (regra do pipeline rule).

#### F-CTA-03 — [ALTO | confidence: high] loading-state

- **File:** `app/_components/ContactForm/ContactForm.tsx:340-352`
- **Fingerprint:** `design-qa:loading-state:ContactForm.tsx:submitBone`

`isSubmitting` muda só o texto do botão (`tSubmit('submitting')` vs `tSubmit('idle')`) — sem spinner, dots ou progress. Disabled (`opacity: 0.5`) sinaliza mas sem affordance de "carregando".

**Recomendação:** adicionar dot pulsante (reusar pattern Nav.dot sem glow) ou mini spinner mono — mantém brand budget (opacity + animation).

#### F-CTA-04 — [MÉDIO | confidence: high] error-visual

- **File:** `app/_components/ContactForm/ContactForm.module.css:127-135`
- **Fingerprint:** `design-qa:error-visual:ContactForm.module.css:.input-invalid`

Error state `[aria-invalid='true']`: `border-color: var(--line-strong) + box-shadow: inset 2px 0 0 var(--fg-1)` — bone branca. Não diferencia suficientemente do hover (que também sobe pra `--line-strong`).

**Recomendação:** criar token `--signal-error` (variante sutil ex: ember) E usar como border-color em error, ou aumentar `inset 3px 0 0 var(--fg-1)`.

#### F-CTA-05 — [MÉDIO | confidence: high] bp-mismatch

- **File:** `app/_components/ContactForm/ContactForm.module.css:13-17`
- **Fingerprint:** `design-qa:bp-mismatch:ContactForm.module.css:row-mobile`

ContactForm único módulo com breakpoint 640px. Resto usa 720+1024. Anti-pattern.

**Recomendação:** padronizar em 720px.

### Section 9 — Footer

#### F-FOOT-01 — [MÉDIO | confidence: high] redundant-bp

- **File:** `app/_components/Footer/Footer.module.css:113-124`
- **Breakpoint:** 720px
- **Fingerprint:** `design-qa:redundant-bp:Footer.module.css:.grid`

`1024` e `720` declaram a mesma regra (`1fr 1fr`). Em mobile com 4 sub-blocks em 2 cols, "brand" (logo+wordmark+tagline) compete com "practice" (lista curta) — brand esticado, practice meia-vazia.

**Recomendação:** `@media (max-width: 720px) { .grid { grid-template-columns: 1fr } .brand { max-width: none } }`.

#### F-FOOT-02 — [MÉDIO | confidence: high] bottom-row-mobile

- **File:** `app/_components/Footer/Footer.module.css:82-92`
- **Breakpoint:** 320–640px
- **Fingerprint:** `design-qa:bottom-row-mobile:Footer.module.css:.bottom`

`.bottom { display: flex; justify-content: space-between }` sem media query mobile. Locales longos podem transbordar.

**Recomendação:** `@media (max-width: 540px) { .bottom { flex-direction: column; align-items: flex-start; gap: 16px } }`.

#### F-FOOT-03 — [BAIXO | confidence: medium] logo-chip-inconsistent

- **File:** `app/_components/Footer/Footer.module.css:21-30`
- **Fingerprint:** `design-qa:logo-chip-inconsistent:Footer.module.css:.logoChip`

3 tamanhos diferentes do mesmo asset (logo-flask.png): Nav 32×32, Footer 44×44, Manifesto 96×96. Considerar tokens `--logo-sm/md/lg`.

### Findings transversais (sistêmicos)

#### F-SYS-01 — [ALTO | confidence: high] spacing-hardcoded

- **Files:** todos os `*.module.css` exceto ContactForm
- **Fingerprint:** `design-qa:spacing-hardcoded:_components:spacing-system`

Tokens `--s-1..9` definidos mas **não consumidos** fora do ContactForm. **195 ocorrências** de spacing hardcoded. Sistema design tokens é decorativo, não funcional.

**Recomendação:** refactor sistemático para `var(--s-*)`. Cirúrgico (1 section por PR) ou em massa.

#### F-SYS-02 — [MÉDIO | confidence: high] dead-attr

- **File:** `app/[locale]/layout.tsx:256`
- **Fingerprint:** `design-qa:dead-attr:layout.tsx:data-density`

`<body data-density="standard">` setado mas nenhum CSS consome `[data-density]`. **F6.4 vai decidir: remover OU wirar.**

#### F-SYS-03 — [MÉDIO | confidence: high] shadow-tokens-unused

- **Fingerprint:** `design-qa:shadow-tokens-unused:tokens.css:shadows`

Tokens `--shadow-1/2/3`, `--glow-gold` declarados mas só `--glow-gold` consumido (em `:focus-visible` global). Shadows literais existentes violam brand. Considerar remover tokens ou consumir.

#### F-SYS-04 — [MÉDIO | confidence: high] doc-drift

- **Fingerprint:** `design-qa:doc-drift:CLAUDE.md:src-docs-path`

`CLAUDE.md` referencia `src/docs/...` mas spec está em `docs/x-element/`. Doc drift.

**Recomendação:** atualizar CLAUDE.md path.

#### F-SYS-05 — [BAIXO | confidence: high] atmosphere-modes-untestable

- **Fingerprint:** `design-qa:atmosphere-modes:tokens.css:dark-mode`

3 atmosphere modes (`signal/shadow/classified`) + 4 accent modes definidos, só `signal/gold` usado. Código morto a menos que haja toggle no roadmap.

#### T-01 — [BAIXO | confidence: high] hex-in-data-uri

- **File:** `app/_components/ContactForm/ContactForm.module.css:154`
- **Fingerprint:** `design-qa:hex-in-data-uri:ContactForm.module.css:chevron`

`#8e8e94` hardcoded no SVG data URI do chevron — único hex literal aberto no codebase. Documentado em comentário como Bucket B refactor.

#### F-A11Y-01 — [MÉDIO | confidence: high] no-reduced-motion-explicit

- **File:** `app/_components/Reveal/Reveal.module.css`
- **Fingerprint:** `design-qa:no-reduced-motion:Reveal.module.css:.reveal`

Reveal `opacity 0→1 + translateY(4px→0)` em 700ms. Globals.css força `transition-duration: 0.01ms` em prefers-reduced-motion. Funciona por cascata mas é frágil.

**Recomendação:** explicitar override no próprio Reveal:
```css
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none }
}
```

## Estados auditados

Todos os componentes têm estados default + hover + focus (herdado global) + disabled (onde aplicável). Faltando:

- Loading state visual em submit (F-CTA-03)
- Focus rings dedicados em cards (Capabilities, Work) — herdam global mas sem tematização
- Error state diferenciado de hover (F-CTA-04)

## Acessibilidade

| Critério | Status | Observações |
|---|---|---|
| Contraste body | ✓ | ~16:1 |
| Contraste muted | ✓ | ~5.1:1 (borderline em captions 12px) |
| Contraste gold | ✓ | ~12:1 |
| Focus states | ⚠ | Global OK, cards sem dedicado |
| Touch targets | ✗ | Buttons 40px (<44px floor) — F-CTA-02 |
| Color blindness | ✓ | Cor não é único diferenciador |
| `prefers-reduced-motion` | ⚠ | Reveal frágil — F-A11Y-01 |

## Padrões transversais (alvos de fix em massa)

1. **Spacing não tokenizado** (F-SYS-01) — 12 arquivos, refactor em série
2. **Tablet skipped** (F-CAP-01, F-WORK-01, F-PROC-01) — todo grid 3/4-col orphan em <1024
3. **Mobile padding/typography** (F-MANI-01, F-CAP-02, F-FOOT-01) — `@media (max-width: 720px)` consistente
4. **Brand-rule shadows** (F-NAV-03, F-MANI-02) — duas violações
5. **Touch target 40px** (F-CTA-02) — single fix no Button

## Sections ranqueadas (mais → menos problemáticas)

1. **Nav** (1 crítico + 1 alto + 2 médios) — falta mobile menu inteiramente
2. **FinalCta/ContactForm** (1 alto + 4 médios) — touch target, loading, error clarity, breakpoint
3. **Process** (1 alto + 2 médios) — animação não considera layouts não-row
4. **Manifesto** (1 alto + 2 médios) — zero breakpoints, shadow decorativa
5. **Capabilities** (1 alto + 3 médios) — orphan card em tablet, tagline rígido
6. **Work** (1 alto + 2 médios) — orphan em tablet, viz fixa, stats overflow
7. **Hero** (1 alto + 3 médios) — viewport overflow risk
8. **Footer** (3 médios) — 2-col com brand orphan
9. **Trust** (1 baixo) — section limpa, aprovada

## APROVADO (estados sólidos)

- Trust em todos os 5 breakpoints (única section limpa)
- Border-radius 100% tokenizado
- Reveal brand budget respeitado
- Process motion sequence em desktop
- ContactForm focus override justificado
- iOS zoom-on-focus mitigado (font-size 16px floor)
- Button reverse-tabnabbing defense-in-depth
- Tipografia self-hosted
- Contraste WCAG AA em todas combinações
- Touch target em inputs (48px ≥ 44 floor)

## Próximos passos

- **F6.2** (triage) — operador agrupa findings em batches lógicos pra F6.3
- **F6.3** (fix em batches) — implementação dos fixes, cada batch passa pipeline core (@design-qa mandatório por PR)
- **F6.4** (data-density) — F-SYS-02: decisão remover OU wirar
- **F6.5** (final review pre-deploy) — smart re-run + gate de release v1

**Smart re-run após fixes:** re-rodar @design-qa **somente** nos paths afetados por cada PR; auditoria completa só em pre-release final.
