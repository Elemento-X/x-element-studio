# Landing Continuity Roadmap
**@planner v2.1 — 2026-05-07**

> Plano de continuidade da landing — motion design no Process (prioridade máxima), formulário de contato com pipeline de notificação, copy realista, i18n PT/EN/ES, SEO + GA4, fine-tuning de UI.

---

## 1. Entendimento & contexto

**Reformulação:**
A landing está visualmente entregue mas inerte: Process tem 4 SVGs estáticos potentes que pedem motion próprio do projeto; FinalCta tem `id="contact"` mas zero pipeline; copy é placeholder técnico; site é monolíngue inglês; SEO é só metadata raso; sem analytics; alinhamentos responsivos não foram auditados sistematicamente.

**Ambiguidades a decidir antes/durante execução:**
- [ ] Trigger de motion no Process: enter-in-view (auto, uma vez) ou também hover/loop sutil? **Recomendação: enter-in-view + hover boost** (D-6 abaixo).
- [ ] Notificação do form: email obrigatório; WhatsApp em fase separada (não bloqueia MVP).
- [ ] CRM de submissões: Notion API para MVP (D-2).
- [ ] i18n source-of-truth: manual com JSON files (volume é ~1 landing).
- [ ] GA4 vs Plausible vs ambos: **Plausible** (D-3).
- [ ] Persona/cliente ideal: **bloqueador de F3** (S-3 obrigatório).

---

## 2. Estado atual

**Arquivos-chave lidos:**
- `app/page.tsx` — composição linear das 9 seções
- `app/layout.tsx` — Inter local, metadata base, sem GA, sem hreflang, `lang="en"` hardcoded
- `app/tokens.css` — tokens sólidos; **Exo 2 e JetBrains Mono via Google Fonts CDN @import** (risco LCP)
- `app/_components/Process/illustrations.tsx` — SVGs puros, paths/circles/lines addressable via class/id
- `app/_components/Reveal/Reveal.tsx` — IntersectionObserver one-shot (unobserve após primeira intersecção)
- `app/_components/FinalCta/FinalCta.tsx` — Button `href="#"`, sem form, sem state
- `package.json` — **zero deps** de motion/forms/email/i18n/analytics

**Débito no caminho:**
- Google Fonts CDN @import em `tokens.css` (Exo 2 + JetBrains Mono) é render-blocking → tratado em F5
- `data-density` no body não é consumido por nenhum CSS — código morto, limpar em F6
- Botão primário FinalCta (`href="#"`) vira target do form em F2

---

## 3. Decisões de stack

| ID | Decisão | Escolha | Confidence |
|----|---------|---------|-----------|
| D-1 | Lib de motion Process | **CSS keyframes puro** (zero bundle cost) | High |
| D-2 | Persistência de submissões | **Notion API** (MVP) → Supabase (escala) | Medium |
| D-3 | Analytics | **Plausible** (cookie-less, sem banner LGPD) | Medium |
| D-4 | Locale default | **`/pt-br` default**, `/en` e `/es` variantes | Medium |
| D-5 | Provider email | **Resend** (DX ótima, free 3k/mês) | High |
| D-6 | Trigger motion | **Enter-in-view + hover boost**, ambient OFF | High |

---

## 4. Risk register

| ID | Risco | Likelihood | Impact | Mitigation |
|----|-------|-----------|--------|-----------|
| R-1 | Motion ficou "cool" em vez de "inevitável" | M | H | Spike S-1 com 1 illust antes de fechar as 4; @design-qa valida por illust |
| R-2 | 4 cards animam juntos em vez de per-card | L | M | Animações disparam via classe scoped no próprio `.step` |
| R-3 | Form vira vetor de spam | H | H | Honeypot + rate limit + Cloudflare Turnstile desde a v1 |
| R-4 | Resend API key vaza | L | M | env server-side only; secret-scan hook ativo |
| R-5 | i18n quebra SEO (URLs mudam) | H | H | Redirect 301 obrigatório; S-2 spike; hreflang; @seo review |
| R-6 | Tradução PT/ES off-tone | H | M | Usuário revisa PT-BR; @copywriter com tom guide explícito |
| R-7 | GA4 dispara sem consent (LGPD/GDPR) | M | H | Usar Plausible (sem cookie) — elimina o risco |
| R-8 | `app/` → `app/[locale]/` quebra build | M | H | Branch isolada; spike S-2; smoke test 3 rotas |
| R-9 | Copy escrita sem persona definida | H | H | F3 bloqueada até S-3 fechado pelo usuário |
| R-10 | Motion ambient drena bateria mobile | M | M | opacity + transform apenas (GPU-accel); pause quando sai de view |
| R-11 | Bundle creep cumulativo cross-fase | M | H | Budget declarado: F1 +0KB, F2 +30KB max, F4 +25KB next-intl |

---

## 5. Fases

### Fase 0 — Spikes (PREP) — bloqueador de F1/F3/F4

- [ ] **S-1**: Protótipo CSS-only de DiscoverIllust (2h) — validar que CSS keyframes cobre motion pedido
- [ ] **S-2**: Branch com 1 página migrada pra `app/[locale]/` (3h) — validar next-intl + build
- [ ] **S-3**: Sessão com usuário (1h) — 7 perguntas de produto/persona → `docs/copy-brief.md`

---

### Fase 1 — Motion Design no Process (PRIORIDADE MÁXIMA) — size: M

**Definition of Success:**
- 4 illusts animam ao entrar em view (one-shot)
- Hover no card intensifica gold (220ms)
- `prefers-reduced-motion` respeitado
- Lighthouse Perf não cai > 2 pontos vs baseline
- @design-qa aprova

#### Especificações de animação por ilustração

**1.1 — DiscoverIllust (varredura)**
- **Anel pontilhado externo** (`r=52, dasharray="3 5"`): `stroke-dashoffset` de 0 → 80 em 6s linear — cria ilusão de rotação sem usar `rotate`
- **Crosshair lines** (4 linhas externas): fade-in stagger 0 / 80 / 160 / 240ms via `opacity 0→1` + `translate 4px→0` (radial, dentro do budget)
- **Ponto central gold** (`r=4`): pulso `opacity 1.0 ↔ 0.55` em 2.4s ease infinite
- **Linha pontilhada gold** (centro → node ativo): trace-in via `stroke-dashoffset length→0` em 600ms easeOut after +400ms
- **Node ativo** (160,56): pulso `opacity 0.65↔1.0` em 1.6s, sincrono com linha
- **Texto SIG · 0.94**: typewriter via `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` em 800ms
- **Trigger**: classe `.in` no `.illust` quando o `.step` entra em view

**1.2 — ArchitectIllust (layer rise)**
- **4 camadas** (L4, L3, L2-gold, L1): cada uma `translate(0, 8px) opacity(0) → translate(0, 0) opacity(1)` em 320ms easeOut, stagger 120ms (L1 primeiro = construção de baixo pra cima)
- **Camada gold** (L2): após stagger, `fill opacity 0 → 0.06` em 400ms
- **Linha vertical conectora**: trace-in `stroke-dashoffset` em 800ms after stagger completo
- **Hover**: L2 ganha intensidade gold (`gold-dim → gold` em 220ms)

**1.3 — BuildIllust (pipeline fill)**
- **5 colunas**: reveal via `clip-path: inset(100% 0 0 0) → inset(0 0 0 0)` em 480ms easeOut, stagger 60ms da esquerda para direita (não usa translate — apenas mask)
- **Linhas de código gold**: stagger via `stroke-dashoffset` em 1s loop (suspenso após 1 ciclo)
- **Pipeline horizontal**: trace-in esquerda → direita em 600ms after columns reveal
- **Dot gold** (cx=101): pulso `opacity 0.7↔1.0` em 1.8s
- **Seta final**: `translateX 0→2px` loop 2s (dentro do budget ≤ 4px)
- **Hover**: colunas não-gold dimam `opacity → 0.35`; gold mantém

**1.4 — ScaleIllust (órbita)**
- **Anel dashed** (`r=58`): mesmo truque DiscoverIllust, `stroke-dashoffset` em 8s direção contrária
- **6 nodes orbitais**: fade-in stagger 80ms each após entry
- **Gold node** (100,183): pulso `opacity 0.7↔1.0` em 2s + linha trace-in em 700ms after +800ms
- **Crosshair central**: fade-in sincronizado com gold pulse
- **Target indicator** (178,50): `opacity 0→1` em 240ms after +1.6s
- **Texto "ALL · OK"** (gold): typewriter clip-path em 600ms after +1.4s
- **Hover**: `animation-duration 8s → 4s` em transição de 220ms

#### Tasks

- [ ] **1.1** `useInViewOnce.ts` hook + `useId()` nos SVG gradients (P)
- [ ] **1.2** DiscoverIllust animações CSS (M)
- [ ] **1.3** ArchitectIllust animações CSS (M)
- [ ] **1.4** BuildIllust animações CSS (M)
- [ ] **1.5** ScaleIllust animações CSS (M)
- [ ] **1.6** Wiring no `Process.tsx` — per-card `.in` class via IntersectionObserver (P)
- [ ] **1.7** Hover boost por card (P)
- [ ] **1.8** Test pass: Lighthouse + reduced-motion + Safari + Firefox (P)

**Pipeline:** core + @design-qa + @performance
**Rollback:** revert do commit — animações puramente aditivas, SVG estático preservado

---

### Fase 2 — Formulário de Contato + Pipeline de Notificação — size: G

**Stack:** React Hook Form + Zod · Resend (email) · Notion API (CRM) · Upstash Redis (rate limit) · Cloudflare Turnstile (anti-spam)

**Definition of Success:**
- Submissão válida → 200, email < 30s, registro no Notion
- Validação field-level inline (sem toast genérico)
- Honeypot + rate limit ativos desde v1
- Zero secrets no client bundle (verificável via grep no `.next/`)
- @security aprova

#### Tasks

- [ ] **2.1** `lib/contact/schema.ts` — Zod schema (P)
- [ ] **2.2** `ContactForm.tsx` + `.module.css` — client component com estados loading/success/error, aria-live, focus management (M)
- [ ] **2.3** Integrar form no `FinalCta.tsx` (P)
- [ ] **2.4** `lib/contact/rate-limit.ts` — 5/h por IP (Map em dev, Upstash em prod) (P)
- [ ] **2.5** `lib/contact/persist.ts` — Notion provider (M)
- [ ] **2.6** `lib/contact/notify.ts` — Resend provider (P)
- [ ] **2.7** `app/api/contact/route.ts` — pipeline: rate-limit → Zod → honeypot → origin check → persist → notify → 200; fail-fast se env vars faltam (M)
- [ ] **2.8** `.env.example` atualizado (P)
- [ ] **2.9** Testes: happy path, validação inválida, honeypot, rate limit (M)
- [ ] **2.10** Auditoria @security (P)

**Pipeline:** core + @security (mandatório) + @devops (env vars + supply chain)
**Feature flag:** `NEXT_PUBLIC_CONTACT_FORM_ENABLED`
**Rollback:** flag off (sem deploy) + remover route handler

---

### Fase 3 — Copy Real — size: M — BLOQUEADA por S-3

**Definição:** apenas textos in-place, sem arquivos novos exceto `docs/copy-brief.md`

**Tasks:**
- [ ] **3.1** Brief do copywriter (output de S-3)
- [ ] **3.2** Copy Hero (headline + sub + CTAs)
- [ ] **3.3** Copy Capabilities (7 cards)
- [ ] **3.4** Copy Process (ajustes finos)
- [ ] **3.5** Copy Work (case narratives)
- [ ] **3.6** Copy Manifesto
- [ ] **3.7** Copy FinalCta + labels/placeholders do form
- [ ] **3.8** Revisão final pelo usuário

**Pipeline:** @copywriter + usuário

---

### Fase 4 — i18n PT-BR / EN / ES — size: G — MAIOR RISCO

**Approach:** next-intl + `app/[locale]/` + middleware.ts + `/` 301 → `/pt-br`

**Requer S-2 fechado antes de iniciar.**

**Tasks:**
- [ ] **4.1** Instalar next-intl + `i18n/config.ts` + `middleware.ts`
- [ ] **4.2** `app/layout.tsx` → `app/[locale]/layout.tsx` (lang dinâmico)
- [ ] **4.3** `app/page.tsx` → `app/[locale]/page.tsx`
- [ ] **4.4** Extrair strings para `messages/{en,pt,es}.json`
- [ ] **4.5** Refactor componentes → `useTranslations()`
- [ ] **4.6** Tradução PT-BR (revisão usuário) + EN (manter atual)
- [ ] **4.7** Tradução ES (@copywriter com tom guide)
- [ ] **4.8** Sitemap dinâmico com hreflang
- [ ] **4.9** Redirect 301 raiz
- [ ] **4.10** Snapshot visual + smoke test 3 rotas

**Pipeline:** core + @reviewer (api-contract rule) + @seo + @copywriter
**Rollback:** 24h janela pós-deploy — revert + redirect `/pt-br → /` por 30d

---

### Fase 5 — SEO + Plausible + Perf Clean — size: M

- [ ] **5.1** `app/sitemap.ts` + `app/robots.ts`
- [ ] **5.2** JSON-LD Organization schema
- [ ] **5.3** OG image 1200x630
- [ ] **5.4** Substituir Google Fonts @import → `next/font/google` (Exo 2 + JetBrains Mono)
- [ ] **5.5** Plausible script via `next/script strategy="afterInteractive"`
- [ ] **5.6** Evento `contact_form_submit` no success
- [ ] **5.7** Lighthouse run final (target: Perf ≥ 90, SEO ≥ 95, A11y ≥ 95, BP ≥ 95)

**Pipeline:** core + @seo + @performance + @devops

---

### Fase 6 — UI Fine-Tune — size: M

- [ ] **6.1** Audit visual sistemático (320 / 720 / 1024 / 1280 / 1440px × 9 seções)
- [ ] **6.2** Lista de findings por severidade
- [ ] **6.3** Fix em batches por seção
- [ ] **6.4** Remover `data-density` morto OU wirar nas paddings (decisão)
- [ ] **6.5** Final review @design-qa

**Pipeline:** @design-qa + @reviewer

---

## 6. Sequência de execução

```
Sequência single-thread:  F0 → F1 → F2 → F3 → F4 → F5 → F6
Sequência otimizada:      F0 → F1 ‖ (S-3 sync) → (F2 ‖ F3) → F4 → (F5 ‖ F6)

Caminho crítico: F0 → F1 → F4
Estimativa total: 16-27 dias (série) / 11-18 dias (paralelo)
```

**Checkpoints com usuário obrigatórios:**
1. Após F0 — go/no-go por fase
2. Após F1 — validar motion vs brand antes de seguir
3. Antes de F2 ir a produção — form é compromisso
4. Antes de F4 — confirmar D-4 (locale default)
5. Após F4 deploy — canary 24h

---

## 7. Observabilidade

**Eventos Plausible:**
- `contact_form_view` — form entra em view
- `contact_form_submit` — submit 200
- `contact_form_error` — submit 4xx/5xx
- `cta_click` — qual CTA clicado

**Logs `/api/contact`:**
- `contact.received` (info) — `{ ip_hash, has_company, challenge }` — **NUNCA PII**
- `contact.rate_limited` (warn)
- `contact.persist_failed` (warn)
- `contact.notify_failed` (error)

---

## 8. Oportunidades no Backlog

- CMS para Work cases (hoje hardcoded em `Work.tsx`)
- Dark mode toggle de fato (`data-atmosphere` existe mas sem UI)
- Email automation pós-form (drip 3 emails)
- A/B testing de headline Hero (após F5)
- CI bundle budget (GitHub Action que falha se bundle cresce > X)

---

## 9. Definition of Success (plano completo)

- Process tem motion cinematográfica, valida com @design-qa, sem regressão Lighthouse > 2 pts
- Form em prod com email + Notion em < 30s, zero secrets vazados
- Copy real em todas as 9 seções, validada pelo usuário
- 3 locales sem regressão SEO ≥ 30 dias após deploy
- Plausible ativo, sitemap submetido, OG image dedicada
- Audit responsivo zerado em 5 breakpoints
- **Lighthouse final: Perf ≥ 90 · SEO ≥ 95 · A11y ≥ 95 · BP ≥ 95**
