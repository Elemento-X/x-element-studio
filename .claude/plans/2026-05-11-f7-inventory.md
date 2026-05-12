# F7.1 — Audit & Inventário Baseline

**Data:** 2026-05-11
**Branch:** `feat/Maclean`
**Card:** [F7.1 — Audit & inventário baseline](https://trello.com/c/CeojK6Is)
**Origem:** plano F7 do @planner — Doc & Cleanup pre-deploy
**Output:** insumo direto para F7.2 a F7.7. Sem decisões aqui, só evidência.

Estado base: commit `a26fe6c` (pós-merge dos 5 Dependabot PRs).

---

## 1. Docs catalogados

15 docs do projeto (excluindo `node_modules`, `.next`, `.agents/skills/*` que são fixture de SDK).

### Status

| Doc | LoC | Último commit | Status | Notas |
|---|---:|---|---|---|
| `CLAUDE.md` | 101 | 2026-05-11 (`1b0d642`) | **STALE** | Reflete X Element pós-rebrand, mas não menciona F5/F6 fechados nem deps atualizadas hoje. Alvo F7.2. |
| `README.md` | 2 | 2026-05-11 (`1b0d642`) | **STUB** | Apenas 2 linhas. Sem quickstart, sem stack, sem comandos. Alvo F7.2 (entrada do repo). |
| `.claude/commands/x-element-studio.md` | 127 | 2026-05-11 (`1b0d642`) | **OK** | Brand bible, design tokens, regras visuais. Verificar se reflete remoção do Tailwind v4 (commit `5b00b22`). Alvo F7.2. |
| `.claude/plans/2026-05-07-landing-continuity-roadmap.md` | 291 | 2026-05-08 (`d4a3724`) | **STALE/HISTORY** | Plano de 4 dias atrás, anterior a F4/F5/F6/F7. Manter como histórico ou mover para `docs/plans/history/`. |
| `docs/runbooks/deploy.md` | 172 | 2026-05-11 (`1b0d642`) | **REVIEW** | Confirmar se procedimento reflete fluxo `dev → main` atual + container Playwright v1.60.0. Alvo F7.3. |
| `docs/runbooks/secret-rotation.md` | 258 | 2026-05-11 (`1b0d642`) | **REVIEW** | Confirmar runbook cobre `FROM_EMAIL`, `NOTIFY_EMAIL`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `UPSTASH_*`. Alvo F7.3. |
| `docs/runbooks/contact-form-incident.md` | 233 | 2026-05-11 (`1b0d642`) | **REVIEW** | Triage do form de contato. Validar coverage dos códigos Turnstile (commits `2d3f092`/`b314fc0`/`9e73e0a` mencionam http_status family). Alvo F7.3. |
| `docs/api/openapi-contact.yaml` | 228 | 2026-05-11 (`1b0d642`) | **REVIEW** | Spec do endpoint `/api/contact`. Confirmar bate com `app/api/contact/route.ts` real. Alvo F7.3. |
| `docs/copy-brief.md` | 133 | 2026-05-11 (`1b0d642`) | **REVIEW** | Brief do @copywriter — verificar idiomas (PT/EN/ES/FR) e tom pós-rebrand. Alvo F7.3 (consultar @copywriter). |
| `docs/copy-proposal-2026-05-09.md` | 247 | 2026-05-11 (`1b0d642`) | **HISTORY** | Proposta com data no nome — candidato a `READ-ONLY history`. Alvo F7.3. |
| `docs/visual-audit-2026-05-11.md` | 486 | 2026-05-11 (`1b0d642`) | **HISTORY/RECENT** | Audit visual deste sprint. Marcar como snapshot histórico. Alvo F7.3. |
| `docs/spikes/2026-05-10-i18n-shape.md` | 197 | 2026-05-10 (`3a49773`) | **HISTORY** | Spike i18n já materializado em código. Snapshot. Alvo F7.3. |
| `docs/x-element/README.md` | 22 | 2026-05-11 (`1b0d642`) | **REFERENCE BUNDLE** | Bundle do design (prototype HTML/CSS). Adicionar header `READ-ONLY — do not edit`. Alvo F7.3. |
| `docs/x-element-design-system/README.md` | 22 | 2026-05-11 (`1b0d642`) | **REFERENCE BUNDLE** | Idem. Adicionar header `READ-ONLY`. Alvo F7.3. |
| `docs/x-element-design-system/project/Design.md` | 306 | 2026-05-11 (`1b0d642`) | **REFERENCE BUNDLE** | Idem. Adicionar header `READ-ONLY`. Alvo F7.3. |

### Conclusão Docs

- **0 docs órfãos** (todo doc tem propósito identificado).
- **0 docs duplicados** detectados.
- **F7.2 alvos:** CLAUDE.md, README.md, `.claude/commands/x-element-studio.md`.
- **F7.3 alvos:** todos os 4 runbooks + openapi + briefs de copy + headers READ-ONLY nos bundles.
- **Plano antigo** (`2026-05-07-landing-continuity-roadmap.md`) — mover ou marcar como histórico.

---

## 2. depcheck — deps órfãs

```
$ npx -y depcheck --skip-missing
No depcheck issue
```

**Zero deps órfãs.** Todas as 12 dependências de produção e 17 de desenvolvimento estão em uso (confirmado pelo depcheck após o ciclo Dependabot).

### Implicação para F7.7

F7.7 ainda precisa ser executado para:
- Auditar scripts do `package.json` (13 scripts; verificar se algum não é mais usado).
- Validar `npm ci && npm run build` do zero em CI limpo (já validado pelo merge dos 5 Dependabot PRs hoje, mas registrar).
- Auditar `eslint.config.mjs` / `tsconfig.json` / `.prettierrc` por entries mortos (configs únicas; sem duplicação detectada).
- Verificar `@types/*` separadamente (depcheck tem falso-positivo conhecido aqui).

---

## 3. ts-prune — dead exports

Output bruto (todos os matches), classificado por natureza:

### 3.1 Convenção do framework — IGNORAR

Exports exigidos pelo Next.js App Router e por configs de tooling. **Não remover.**

```
middleware.ts:127 - middleware
middleware.ts:163 - config
playwright.config.ts:3 - default
vitest.config.ts:5 - default
app/apple-icon.tsx:* - size/contentType/runtime/default
app/icon.tsx:* - size/contentType/runtime/default
app/opengraph-image.tsx:* - size/contentType/runtime/default
app/twitter-image.tsx:* - size/contentType/runtime/default
app/robots.ts:14 - default
app/sitemap.ts:59 - default
app/[locale]/layout.tsx:* - generateMetadata/generateStaticParams/default/metadataBase
app/[locale]/page.tsx:12 - default
i18n/request.ts:12 - default
app/api/csp-report/route.ts:38 - runtime
.next/types/routes.d.ts:* - (gerado, ignorar)
```

### 3.2 Falso-positivo do ts-prune

```
app/_components/Eyebrow/Eyebrow.tsx:10 - Eyebrow
```

`Eyebrow` é **importado em 4 arquivos** (`FinalCta.tsx`, `ContactForm.tsx`, `Capabilities.tsx`, + `Eyebrow.tsx` interno). ts-prune confunde nome de arquivo igual ao nome do export. **Não remover.**

### 3.3 Internal-only — candidatos a `@internal` ou remoção de export

Exports não consumidos fora do próprio arquivo. F7.6 decidirá entre remover, marcar `@internal` ou tornar `unexported`.

| Export | Arquivo:linha | Recomendação F7.6 |
|---|---|---|
| `EngagementValue` (type) | `lib/contact/schema.ts:17` | Usado só em `schema.ts`. **Manter export** (API pública do módulo; consumido por consumidores futuros de `engagementMessage`). |
| `CspRateLimitResult` (interface) | `lib/csp/rate-limit.ts:44` | Usado só em `rate-limit.ts`. **Manter export** (tipo de retorno de função pública). |

Ambos são tipos de retorno/derivados de funções públicas → manter export é correto para tooling externo (DX). **Não tocar em F7.6.**

### 3.4 Stub não integrado — candidatos reais

```
lib/observability/sentry.ts:40 - initSentry
lib/observability/sentry.ts:93 - captureError
```

`lib/observability/sentry.ts` é template/stub para integração futura com Sentry. As funções existem mas **nada no projeto as chama**. Comentário no arquivo (linha 19-21) explicita: instruções de wire-up futuro.

**Recomendação F7.6:**
- **Opção A** — manter como está, marcar com `@stub` no JSDoc + adicionar `@internal` para clareza de tooling.
- **Opção B** — remover, criar card no Backlog "Integrar Sentry quando observabilidade entrar em escopo".
- **Decisão final:** delegar à execução do F7.6 com input do @reviewer.

---

## 4. TODOs / FIXMEs / HACKs

### Em código (.ts, .tsx, .css)

```
(nada)
```

**Zero TODOs/FIXMEs/HACKs/XXX em código fonte.** Sinal forte de higiene pós-F6.

### Em docs (.md)

10 ocorrências, todas em arquivos de regras/agentes que usam "TODO" como termo *literal* (não dívida técnica):

- `.claude/agents/copywriter.md:124` — texto sobre "TODOS os idiomas"
- `.claude/agents/design-qa.md:44` — "TODOS os estados"
- `.claude/agents/performance.md:165` — placeholder `XXX KB`
- `.claude/agents/security.md:57,314` — meta-regra ("nenhum `TODO: validar isso`") e placeholder `CWE-XXX`
- `.claude/agents/tester.md:25,47,255` — meta-regras sobre flaky tests
- `.claude/rules/qa-pipeline.md:418` — "TODOS os seguintes precisam ser atualizados"
- `docs/visual-audit-2026-05-11.md:305` — "afeta TODOS os CTAs primários"

**Nenhum é dívida técnica.** Nada a fazer.

---

## 5. Bonus — Scripts e Configs

### Scripts em `package.json`

13 scripts, todos legítimos:

```
dev, build, start, lint, lint:fix, typecheck, format,
test, test:run, test:ui, test:coverage,
test:e2e, test:e2e:ui
```

**Atenção para F7.7:** `test:ui` (Vitest UI) raramente usado em CI/dev pessoal. Manter (ferramenta de debug local).

### Configs

```
.prettierrc            (Prettier)
eslint.config.mjs      (ESLint flat config)
tsconfig.json          (TypeScript)
```

**Zero duplicações.** Sem `.eslintrc*` legacy nem `tsconfig.build.json` extra.

### Lint live state

`npm run lint` é gate do `build` (`build: npm run lint && next build`). CI verde no `main` agora → lint passa.

---

## 6. Resumo executivo para os próximos cards

| Card | Esforço previsto | Risco | Achados |
|---|---|---|---|
| **F7.2** Docs core | M | Baixo | README é stub (2L); CLAUDE.md precisa refletir 5 Dependabots + lockstep Playwright; `.claude/commands/x-element-studio.md` confirmar Tailwind removido |
| **F7.3** Docs ops | M | Baixo | 4 runbooks + openapi precisam de pass de validação contra código real; 4 docs reference-bundle precisam de header READ-ONLY; mover plano antigo para history |
| **F7.4** Comments | M | Médio | Sem amostra inicial — vai exigir scan completo em F7.4; sinal positivo: zero TODO/FIXME |
| **F7.5** Renames | M | **ALTO** | A executar após F7.2/3/4/6/7 fecharem (regra do plano); ts-prune não cobre naming |
| **F7.6** Dead code | P | Médio | Apenas 2 candidatos reais (`initSentry`, `captureError`); imports não usados ainda não escaneados — fazer no card |
| **F7.7** Deps + configs | P | Baixo | depcheck zero, configs únicas. Validar `@types/*` separados + revisar scripts |
| **F7.8** Gate | P | Baixo | Sanity pass + relatório final |

### Sequência confirmada

```
F7.1 (este) ✅
  ↓
F7.2 ∥ F7.3 ∥ F7.7   (docs core, docs ops, deps — áreas distintas)
  ↓
F7.6 (dead code/imports — usa relatório acima como input)
  ↓
F7.4 (comentários — após F7.6 pra não triar comments de código que vai sumir)
  ↓
F7.5 (renames — último antes do gate, reduz conflito de merge)
  ↓
F7.8 (gate)
```

---

## 7. Sinais positivos do estado atual

1. **depcheck zero.** Higiene de dependências exemplar.
2. **Zero TODO/FIXME/HACK em código.** Sem dívida técnica explícita.
3. **Configs únicas.** Sem duplicação histórica.
4. **CI verde no `main`** pós merge dos 5 Dependabots.
5. **F5/F6/rebrand** entregues consistentemente (commits coerentes, branches limpas).

A fase F7 não vai encontrar grandes podridões — vai **destacar a higiene existente** com documentação fidedigna e remoção cirúrgica do pouco que sobrou.

---

**Próximo passo:** iniciar F7.2/F7.3/F7.7 em paralelo (áreas distintas, sem conflito de arquivos).
