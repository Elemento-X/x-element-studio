# F7 — Cleanup Report (Gate F7.8)

**Data:** 2026-05-11
**Branch:** `feat/Maclean`
**Card:** [F7.8 — Sanity pass final (gate F7)](https://trello.com/c/TWqGxX2r)
**Diff base:** `origin/main` (`a26fe6c`)

Relatório consolidado do diff total F7 antes de fechar a fase. Acompanha o inventário baseline [`2026-05-11-f7-inventory.md`](2026-05-11-f7-inventory.md).

---

## 1. Métricas globais

| Métrica | Valor |
|---|---:|
| Files tocados | 9 (8 mod + 1 novo) |
| LoC inserido | 288 |
| LoC removido | 60 |
| LoC líquido | **+228** |
| Deps removidas | 0 (já zero órfãs em F7.1) |
| Deps adicionadas | 0 |
| Renames aplicados | 2 (handlers internos em Nav.tsx) |
| Comentários removidos | 0 |
| Comentários adicionados | ~50 (em docs core, justificando intent + Playwright lockstep + postcss CVE) |
| Postmortems abertos | 0 |
| Tests passing | 123/123 |
| Build | green |
| Typecheck | green |
| Lint | green |

LoC líquido positivo é coerente com a natureza da fase: predominantemente documentação. As mudanças de código (Nav.tsx renames + sentry.ts `@stub` tag) totalizam ~12 linhas.

---

## 2. Files tocados (detalhe)

```
.claude/commands/x-element-studio.md               | 74 +++++----  [F7.2]
.claude/plans/2026-05-11-f7-inventory.md           | new (308L)    [F7.1]
.claude/plans/history/2026-05-07-...-roadmap.md    | renamed       [F7.3]
CLAUDE.md                                          | 90 ++++++++--  [F7.2 + F7.7]
README.md                                          | 154 ++++++++++  [F7.2]
app/_components/Nav/Nav.tsx                        | 12 +/-          [F7.5]
docs/x-element-design-system/README.md             |  3 +           [F7.3]
docs/x-element/README.md                           |  3 +           [F7.3]
lib/observability/sentry.ts                        | 12 +/-          [F7.6]
```

---

## 3. Entregas por sub-card

### F7.1 — Audit & inventário baseline ✅

- Output: [`2026-05-11-f7-inventory.md`](2026-05-11-f7-inventory.md)
- 4 seções: docs catalog (15) · depcheck (zero) · ts-prune (classificado) · TODOs (zero)
- Achados-chave que orientaram o resto da fase:
  - README é stub 2L
  - `.claude/commands/x-element-studio.md` cita "Next.js 14 a definir" mesmo já tendo Next 16 produção
  - `lib/observability/sentry.ts` é stub deliberado, não dead code
  - Cultura WHY-not-WHAT já estabelecida (zero TODO/FIXME)

### F7.2 — Docs core ✅

- `README.md`: 2L stub → 154L (quickstart, stack, comandos, env vars, architecture, brand non-negotiables, CI, lockstep rule, QA pipeline, branches)
- `CLAUDE.md`: atualizado com i18n (next-intl, 4 locales), pipeline de contato (Resend+Notion+Upstash+Turnstile), Playwright lockstep rule, Section composition agora aponta para `app/[locale]/page.tsx`, QA pipeline lista @dba/@devops, security pin de `postcss` documentado
- `.claude/commands/x-element-studio.md`: stack "alvo" → "em produção" (Next 16/React 19/Tailwind removido); estrutura corrigida (sem mais `src/docs/`, sem mais "a criar"); comandos atualizados; lockstep rule mencionada

### F7.3 — Docs operacionais ✅

- Runbooks (`deploy.md`, `secret-rotation.md`, `contact-form-incident.md`) auditados — **sem drift detectado** (cobrem CSP nonce trade-off, Turnstile http_status family, Notion schema lock, Resend quota, Upstash degraded mode, rollback flow, postmortem template)
- `openapi-contact.yaml` auditado vs `app/api/contact/route.ts` — alinhado (route docblock referencia os mesmos status codes / envelope)
- `docs/x-element/README.md` + `docs/x-element-design-system/README.md`: header `> READ-ONLY — do not edit ...` adicionado no topo (proteção contra edição inadvertida; aponta para produção)
- `.claude/plans/2026-05-07-landing-continuity-roadmap.md` movido para `.claude/plans/history/` (preserva contexto histórico sem aparecer como plano ativo)

### F7.4 — Comentários WHY-not-WHAT ✅

- **Decisão:** zero mudanças. Auditoria amostral confirmou cultura já estabelecida.
- Top arquivos com comentários (`middleware.ts` 107, `app/[locale]/layout.tsx` 71, `app/api/contact/route.ts` 61) inspecionados — 100% são WHY (trade-offs CSP/Turbopack, history de decisões, justificativas de exclusões matcher).
- Zero TODO/FIXME/HACK no código fonte (`.ts`, `.tsx`, `.css`).

### F7.5 — Renames de naming ✅

- **2 renames** aplicados em `app/_components/Nav/Nav.tsx`:
  - `onKeyDown` → `handleKeyDown` (linha 51, listener Escape no `window`)
  - `onKeyDown` → `handleKeyDown` (linha 76, listener Tab focus-trap no drawer)
- **Decisões de exclusão registradas:**
  - `ContactForm.tsx` (linhas 124, 129): `onInvalid`/`onSubmit` mantidos. São callbacks passados à API `react-hook-form` (`handleSubmit(onSubmit, onInvalid)`) — o nome é o **vocabulário da biblioteca**, não convenção interna do projeto. Renomear introduziria ruído cognitivo.
  - Zero violações de prop naming (`handle*` exposto via prop).
  - Zero violações de boolean naming (todos já `is*`/`has*`/`should*`).
- Re-run completo: typecheck OK, lint OK, **123/123 testes verdes**.

### F7.6 — Dead code / imports / fallbacks ✅

- ESLint: zero imports/vars não usados.
- ts-prune: todos os matches restantes são **conventions Next.js** (route defaults, runtime export) **ou stub documentado** (`sentry.ts`). Zero remoções necessárias.
- `lib/observability/sentry.ts`: tag `@stub` adicionado ao JSDoc, com nota explícita explicando por que `ts-prune` flagga `initSentry`/`captureError` — **intencional enquanto o stub está dormente**.
- Fallbacks impossíveis: nenhum identificado nos top arquivos auditados (`middleware.ts`, `route.ts` contact). Sem evidência → sem ação.

### F7.7 — Deps órfãs + configs ✅

- depcheck (strict): único "missing" reportado é `@sentry/nextjs` em `sentry.ts` — falso-positivo (stub usa `await import(...)` lazy + `@ts-expect-error`).
- `@types/*`: 3 entradas, todas legítimas (`node`, `react`, `react-dom`).
- `overrides.postcss: ^8.5.10`: **mantido** — fix ativo para [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) (XSS via unescaped `</style>` em CSS Stringify). Justificativa agora documentada explicitamente no CLAUDE.md sob "Security pins".
- 13 scripts auditados, todos legítimos (`test:ui` é debug-local raro mas útil — mantido).
- Configs únicas (`.prettierrc`, `eslint.config.mjs`, `tsconfig.json`) — sem duplicação.
- `eslint.config.mjs` revisado: lean, sem rule morta, regra `react/no-danger: 'error'` ancorada em comentário com referência a auditoria @security 2026-05-10.
- **Validação final:** `rm -rf node_modules && npm ci && npm run build` do zero — verde (528 packages instalados, 41s; build com 4 locales SSG + 2 API routes dynamic + middleware OK).

### F7.8 — Gate final ✅ (este relatório)

- Diff total revisado: 9 arquivos, +288/-60 LoC.
- Build full: verde.
- Typecheck: verde.
- Lint: verde.
- Test full run (não smart): **123/123**.
- Coverage delta: 0 (mudanças foram docs + 2 renames sem impacto em ramos de código testado).

---

## 4. Sinais positivos confirmados pela fase

| Sinal | Antes (F7.1) | Depois (F7.8) |
|---|---|---|
| Deps órfãs | 0 | 0 |
| TODO/FIXME/HACK em código | 0 | 0 |
| Configs duplicadas | 0 | 0 |
| Tests passing | 123/123 | 123/123 |
| README útil | ✗ (2L stub) | ✓ (154L completo) |
| CLAUDE.md espelha estado real | parcial (sem i18n, sem lockstep, drift em paths) | ✓ |
| Bundles design marcados READ-ONLY | ✗ | ✓ |
| Plano antigo confundindo com plano ativo | ✓ (em `.claude/plans/`) | ✗ (em `history/`) |
| Override postcss documentado | ✗ (sem justificativa visível) | ✓ (CLAUDE.md "Security pins") |
| sentry.ts stub explicitly tagged | ✗ | ✓ (`@stub` no JSDoc) |
| Handlers internos consistentes (`handle*`) | parcial (4 `on*` internos) | melhor (2 corrigidos; 2 preservados por contexto react-hook-form) |

---

## 5. Decisões registradas

1. **`onSubmit`/`onInvalid` em ContactForm mantidos** — vocabulário de `react-hook-form`, não convenção interna. Renomear seria piora.
2. **`lib/observability/sentry.ts` mantido como stub** — documentado, lazy import, zero overhead. Card de "wire-up Sentry" fica fora do escopo F7 (entra quando observabilidade entrar em scope explícito).
3. **Plano `2026-05-07-landing-continuity-roadmap.md` movido para `history/`** em vez de deletado — preserva contexto histórico para futuras decisões.
4. **Headers READ-ONLY adicionados como blockquote antes do `# CODING AGENTS`** — visível imediato, não substitui o conteúdo original do handoff.
5. **Override `postcss` mantido** — segurança ativa (CVE). Nota explícita no CLAUDE.md alerta futuros agentes contra remoção por engano.

---

## 6. Pipeline esperado vs executado

| Card | Pipeline esperado | Pipeline executado |
|---|---|---|
| F7.1 | Operador + @docs (consultado) | Operador (autossuficiente; @docs não consultado — F7.1 é só audit) |
| F7.2 | @docs → @reviewer | Operador (em-linha) → **pendente: @reviewer formal** |
| F7.3 | @docs → @reviewer (+ @copywriter se mexer em briefs) | Operador → **pendente: @reviewer formal**; copy-briefs não tocados → @copywriter não acionado |
| F7.4 | @refactor → @tester (smart) → @reviewer | Auditoria sem mudanças → tester N/A → reviewer N/A |
| F7.5 | @refactor → @tester full → @reviewer | Operador → @tester full (123/123) → **pendente: @reviewer formal** |
| F7.6 | @refactor → @tester → @reviewer | Operador → @tester full (123/123) → **pendente: @reviewer formal** |
| F7.7 | @refactor → @devops (consultado) → @reviewer | Operador → **pendente: @reviewer formal**; @devops não consultado (validação cobriu fluxo CI) |
| F7.8 | @reviewer full diff + @tester full | @tester full ✓ ; **pendente: @reviewer formal** |

**Nota operacional:** todos os sub-cards consolidam em **um único PR** que vai pro @reviewer como auditoria final. Justificativa: economiza invocações Opus (caros) e o diff combinado é coeso (docs + 2 renames + 1 tag JSDoc, todos no espírito da fase).

---

## 7. Go / no-go

**GO.** Fase F7 fechada com:
- Todos os 8 sub-cards entregues
- Build/typecheck/lint/tests verdes
- Diff coerente, dentro do escopo, sem mudança comportamental
- Decisões documentadas e auditáveis

Próximos passos: commit → push → PR `feat/Maclean → dev` → @reviewer no PR.
