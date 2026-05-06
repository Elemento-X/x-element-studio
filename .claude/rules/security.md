---
paths:
  - "src/middleware/**/*.ts"
  - "src/lib/auth/**/*.ts"
  - "src/lib/crypto/**/*.ts"
  - "src/modules/auth/**/*.ts"
  - "src/modules/billing/**/*.ts"
  - "src/config/env.ts"
  - "src/config/rate-limit.ts"
  - "src/errors/**/*.ts"
  - "src/http/routes/**/*.ts"
  - "src/plugins/**/*.ts"
  - "src/api/**/*.ts"
  - "app/api/**/*.ts"
---

# Security (backend é a única barreira real)

## Referência cruzada

- **`api-routes.md`** — estrutura de rotas, timeouts, health check, graceful degradation.
- **`api-contract.md`** — disciplina de contrato: envelope, versionamento, breaking changes, idempotency, ETag, paginação, bulk ops, webhooks outbound, SDK.
- **`qa-pipeline.md`** — path-matrix que determina quais rules e agentes carregam por arquivo tocado.

## Princípio

- Toda validação do frontend é UX. O server é a única barreira real. Replique TODAS as validações aqui, mesmo as triviais.
- Em dúvida de decisão de segurança, errar para o lado mais restritivo.
- Qualquer alteração em auth, middleware de autenticação, crypto utilities ou handlers de webhook exige auditoria manual do @security antes de merge.

## Autenticação

- **Deny-by-default**: auth middleware DEVE ser global. Rotas públicas são exceção explícita via allowlist. Toda rota nova nasce autenticada — nunca o contrário.
- **CSRF**: API com Bearer token no header é naturalmente CSRF-safe. Se migrar para cookie-based auth, CSRF token é OBRIGATÓRIO (double-submit cookie ou synchronizer token).
- **Tokens de API / sessão**: mínimo 256 bits de entropia via `crypto.randomBytes` (Node), `secrets.token_bytes` (Python), ou equivalente. Nunca usar `Math.random`, `random.random()`, ou geradores não-criptográficos.
- **Comparação timing-safe obrigatória**: toda comparação de token/secret DEVE usar `crypto.timingSafeEqual` (Node), `hmac.compare_digest` (Python), ou equivalente. Nunca `===` / `==` para segredos — side-channel timing attack permite brute force caractere a caractere.
- **JWT**: nunca aceitar algoritmo `none`. Sempre verificar `exp`. Chave de assinatura com mínimo 32 chars.
- **Vinculação de contexto**: tokens vinculados a sessão/device/fingerprint não devem permitir rebind silencioso.
- **Refresh**: nunca renovar token sem validar que o usuário/subscription ainda está ativo.
- **Revogação**: se implementada, usar denylist por `jti` com TTL = tempo restante do token.

## Secrets rotation

- Todos os secrets (JWT signing key, webhook secrets, API keys, DB credentials) devem ter política de rotação.
- **Signing keys**: rotação exige período de dual-key (aceitar assinatura com key antiga por grace period). Nunca trocar atomicamente.
- **Regra prática**: se um secret vazar (log, commit, chat), rotação IMEDIATA é obrigatória. Não "depois".
- Toda rotação deve ser documentada em `.env.example` com comentário de quando e por que rotacionar.

## Validação de input (OWASP A03 — Injection)

- **Schema validation obrigatório** (Zod, Yup, Pydantic, Joi) em todo input externo (body, params, query, headers relevantes). Nunca modo permissivo (`.passthrough()`, `z.any()`, `extra = "allow"`).
- **ORM/Query builder**: usar sempre queries parametrizadas. NUNCA interpolar input em query raw/SQL string.
- **Path traversal**: nomes de arquivo vindos do usuário devem ser sanitizados. Nunca concatenar direto em path.
- **Prototype pollution** (JS/TS): não usar `Object.assign` nem spread em JSON externo sem validar schema antes.

## Multitenancy e ownership isolation (OWASP A01 — Broken Access Control)

- **Regra absoluta**: toda query que retorna dados de um tenant DEVE filtrar por ownership (userId, organizationId, etc). Nunca confiar em ID vindo do client sem validar ownership.
- **Pattern obrigatório**: services recebem userId do token autenticado (middleware), não do body/params. Body/params informam o recurso; token informa quem está pedindo.
- **IDOR prevention**: antes de update/delete, SEMPRE verificar que o recurso pertence ao usuário autenticado.
- **Testes de ownership**: todo endpoint que acessa recurso de usuário deve ter teste explícito de "usuário A não acessa recurso do usuário B".

## Request size limits

- **Body limit**: configurar limite global razoável (ex: 1MB) e override por rota quando necessário.
- Rotas de upload: limite explícito alinhado com limites de plano. Nunca aceitar upload sem limite.
- Rotas de API (JSON): 256KB é suficiente para 99% dos casos. Payload maior é smell de design.
- **Query string**: limitar tamanho via framework config ou validação com `.max()` em campos string.

## File upload hardening

- **Validação em camadas**: MIME type + extensão + magic bytes (assinatura de arquivo). Nunca confiar só em extensão/MIME (spoofável).
- **Storage isolado**: arquivos uploadados vão para bucket (S3/R2/GCS), nunca filesystem local do servidor.
- **URLs de acesso**: signed URLs com TTL curto (15min max). Nunca URL pública permanente para uploads de usuário.
- **Limites**: tamanho máximo por arquivo, total por request, e por período (anti-abuse).

## Error handling defensivo (information disclosure)

- **Nunca vazar estado interno via mensagem de erro.** Respostas de erro devem ser genéricas pro cliente.
- **Error discrimination proibida**: não diferenciar "email não encontrado" vs "senha incorreta" vs "conta desativada" — resposta única genérica.
- **Token errors**: não diferenciar "inválido" vs "expirado" vs "não encontrado" para o cliente.
- **Rate limit hit**: retornar 429 sem informar quantas tentativas restam.
- Nunca expor stack trace ao cliente. Error handler global cuida disso — não criar handlers paralelos.
- **ORM errors**: capturar erros do ORM e mapear para HTTP status sem expor código interno.

## Headers e CORS

- Helmet/equivalente ativo com CSP em produção. Qualquer relaxamento exige justificativa documentada.
- CORS com origin **fixo**. Nunca usar `origin: true` nem wildcard em produção.
- **`Access-Control-Max-Age`**: configurar cache de preflight (ex: 86400s / 24h) para evitar preflight flood.
- `X-Content-Type-Options: nosniff` obrigatório.

## Rate limiting

- **Camadas de rate limit**: (1) global por IP (proteção DDoS básica), (2) por rota (config específica), (3) por usuário autenticado (evita abuso com conta válida). As três camadas são complementares.
- Toda rota pública passa por rate limiter com config específica.
- Rotas de autenticação com limite agressivo contra brute force.
- Webhooks de terceiros ficam sem rate limit quando a verificação de assinatura é a barreira.

## Content-Type enforcement

- **Validar `Content-Type` em toda rota que aceita body.** Framework pode validar JSON por default, mas rotas com custom parsers devem rejeitar content-types inesperados explicitamente.
- Nunca aceitar `application/x-www-form-urlencoded` em rota que espera JSON.
- Rotas de upload: aceitar apenas MIME types esperados. Rejeitar o resto com 415 Unsupported Media Type.

## Webhooks (de terceiros)

- **Verificação de assinatura obrigatória**. Nunca confiar em header puro.
- **Idempotência**: mesmo event ID pode chegar múltiplas vezes. Usar tabela de eventos processados ou upsert defensivo.
- **Replay window**: rejeitar eventos com timestamp > 5 minutos do clock do servidor. Protege contra replay de evento legítimo capturado.
- **Raw body**: garantir que o framework não parse o body antes da verificação de assinatura.

## Logs e dados sensíveis

- NUNCA logar: tokens, JWT completo, `Authorization` header, body de auth, body de webhooks, emails em massa, credenciais de banco.
- Em desenvolvimento: payload sanitizado (sem campos sensíveis). Em produção: apenas metadata (request id, rota, status, latência).
- Nunca expor stack trace ao cliente.

## Cookies e sessão

- Se usar cookies: `httpOnly`, `Secure` (prod), `SameSite=Strict`. Nunca armazenar JWT em cookie sem essas flags.

## Env vars

- Toda env var validada no boot via schema validation. Novo segredo = nova entrada no schema + `.env.example`.
- `.env` NUNCA commitado. `.env.example` sem valores reais.

## Supply chain e dependências (OWASP A06 — Vulnerable Components)

- **Audit de deps** (npm audit, pip-audit, cargo audit) deve rodar em CI e antes de deploy. Vulnerabilidade `high` ou `critical` bloqueia deploy.
- **Lockfile integrity**: lockfile commitado e respeitado em CI (`npm ci`, `pip install --require-hashes`, etc).
- **Dependabot / Renovate**: manter habilitado. PRs de security patch são prioridade.
- **Deps novas**: toda dependência nova exige justificativa. Preferir deps com poucos transitive deps.
- **Monitoramento contínuo**: verificar advisories de deps críticas do projeto (auth, parsing, crypto, framework).

## Análise estática de segurança

- **Linter com regras de segurança**: eslint-plugin-security (JS/TS), bandit (Python), clippy security lints (Rust). Deve estar configurado e sem findings ignorados.
- **Semgrep** (ou equivalente): considerar para regras customizadas do projeto (ex: "nunca interpolar input em query raw").
- Findings de análise estática são tratados como findings de @security no pipeline.

## OWASP Top 10 — checklist de revisão

- [ ] A01 Broken Access Control → auth + ownership check + IDOR tests
- [ ] A02 Cryptographic Failures → signing key forte, token 256 bits, TLS em prod, timingSafeEqual
- [ ] A03 Injection → schema validation + ORM parametrizado, nunca raw query com input
- [ ] A04 Insecure Design → rate limit + limites de plano como barreira + error discrimination
- [ ] A05 Security Misconfiguration → helmet + CORS fixo + env validado + body limit
- [ ] A06 Vulnerable Components → audit de deps, lockfile, dependabot, supply chain review
- [ ] A07 Identification/Auth Failures → rate limit em auth, token curto, secrets rotation
- [ ] A08 Software/Data Integrity → webhook signature + replay window
- [ ] A09 Logging/Monitoring → sem dados sensíveis em log
- [ ] A10 SSRF → HTTP client só para domínios conhecidos; validar qualquer URL vinda de input
