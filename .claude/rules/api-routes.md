---
paths:
  - "src/http/routes/**/*.ts"
  - "src/http/controllers/**/*.ts"
  - "src/http/middlewares/**/*.ts"
  - "src/api/**/*.ts"
  - "src/routes/**/*.ts"
  - "app/api/**/*.ts"
  - "src/modules/**/*.routes.ts"
  - "src/modules/**/*.schema.ts"
  - "src/schemas/**/*.ts"
---

# API Routes

> **Escopo desta rule:** padrões práticos e operacionais de rotas — estrutura, config do framework, health checks, timeouts, graceful degradation. Para disciplina de **contrato** (breaking changes, versionamento, envelope, idempotency, ETag, paginação, bulk ops, precisão numérica, webhooks outbound, SDK), ver `api-contract.md`.

## Referência cruzada

- **`api-contract.md`** — disciplina de contrato: versionamento, breaking changes, envelope `{ "data" }` / `{ "error" }`, paginação cursor-based, idempotency, ETag, bulk ops, LRO, precisão numérica, webhooks outbound, SDK generation, CI gate, deprecation.
- **`security.md`** — auth (deny-by-default, CSRF, timing-safe), rate limit (3 camadas), input validation, multitenancy/IDOR, error discrimination, Content-Type enforcement, supply chain.
- **`qa-pipeline.md`** — path-matrix que determina quais rules e agentes carregam por arquivo tocado.

## Estrutura obrigatória

- Routes são declarativas: só mapeamento `path → handler`. Lógica de orquestração vai no controller, regras de negócio no service.
- Schema validation obrigatório (Zod, Yup, Pydantic, Joi) para request (body/params/query) e response.
- Nunca declarar schema inline na rota — schemas ficam em módulo dedicado, compartilhados quando necessário.

## Sorting e filtering (complemento ao api-contract)

- **Sort**: query param `?sort=field:direction` (ex: `?sort=created_at:desc`). Múltiplos sorts separados por vírgula.
- **Filter**: query param com nome do campo (ex: `?status=active`). Nunca aceitar filtros arbitrários — cada rota define quais campos são filtráveis via schema (allowlist).
- **Validação**: campos de sort e filter DEVEM ser validados via enum/allowlist. Nunca passar valor do client direto pro ORM — injection via sort field é real.
- **Schema compartilhado**: helpers de sort/filter reutilizáveis.

## HTTP status codes (quick reference)

Tabela rápida pra consulta durante implementação. Definição autoritativa em `api-contract.md`.

| Operação | Sucesso | | Erro | Status |
|----------|---------|---|------|--------|
| GET recurso | `200` | | Validação | `400` |
| GET lista | `200` | | Não autenticado | `401` |
| POST criação | `201` + `Location` | | Sem permissão | `403` |
| PUT/PATCH | `200` | | Não encontrado | `404` |
| DELETE | `204` | | Conflito | `409` |
| Ação sem retorno | `204` | | Rate limited | `429` |

## Request ID e rastreabilidade

- **`X-Request-Id`**: se o cliente enviar, usar o valor. Se não, gerar UUID v4 automaticamente.
- Request ID deve estar em **todo log** daquela request.
- Request ID deve ser retornado no **response header** `X-Request-Id`.
- **Correlation**: se a request dispara chamada a serviço externo, logar o request ID junto.

## Timeout por rota

- **Timeout global**: configurar no framework (ex: 30s).
- **Rotas de processamento pesado**: timeout estendido explícito.
- **Regra**: se uma rota pode demorar > 10s, ela deve ser assíncrona (aceitar, processar em background, retornar status via polling ou webhook). Pattern LRO detalhado em `api-contract.md`.

## Health check

- **`/health`** (ou `/healthz`): verifica conectividade real, não só uptime.
  - DB: query trivial
  - Serviços externos: API key válida (com cache)
  - Resultado: `200 { "status": "healthy", "checks": { ... } }` ou `503` se check crítico falhar.
- Health check NÃO passa por auth middleware nem rate limit.

## Graceful degradation

- **Fail fast**: dependência crítica down → `503` imediato. Não retry dentro do request.
- **Dependência não-crítica**: continuar sem o dado, logar warning, resposta parcial.
- **Circuit breaker mental**: dependência falhando consistentemente → erro rápido, não acumular timeouts.
- **Regra**: nunca mascarar falha como sucesso. Comunicar degradação ao cliente.

## Cache headers (quick reference)

Detalhes de ETag, `If-None-Match`, optimistic concurrency em `api-contract.md`.

- **GET estável**: `Cache-Control: public, max-age=300` + `ETag`.
- **GET dinâmico**: `Cache-Control: private, no-cache` + `ETag`.
- **Respostas autenticadas**: sempre `Cache-Control: private`.
- **Mutations**: `Cache-Control: no-store`.
- **Regra**: toda rota GET DEVE ter `Cache-Control` explícito.

## Segurança por rota

Regras completas em `security.md`. Quick reference:

- **Rate limiting obrigatório** em toda rota pública (exceto webhooks e health check).
- **Auth middleware** em toda rota protegida por default (deny-by-default, conforme `security.md`).
- **Validação de limites de plano** via service — nunca hardcodar limites.
- **Content-Type** validado pelo schema; rotas de upload devem aceitar apenas MIME types esperados.

## Erros

- Usar error classes tipadas do projeto. Nunca `throw new Error()` cru em route/controller.
- Formato, error codes e envelope definidos em `api-contract.md`.
- Nunca expor stack trace, SQL error, nem mensagem do ORM ao cliente em produção.

## Webhooks (recebidos)

- **Verificação de assinatura obrigatória**. Nunca confiar em header sem verificar.
- **Raw body**: garantir que o framework não parse antes da verificação.
- Handler de webhook deve ser **idempotente** — mesmo evento pode chegar múltiplas vezes.
- Webhooks **enviados** (outbound): ver `api-contract.md`.

## Documentação de API

- Toda rota nova precisa de tags, summary, description e schemas de input/output para documentação automática (Swagger/OpenAPI).
- OpenAPI components e SDK discipline em `api-contract.md`.

## Proibições

- NÃO registrar rotas fora do diretório padrão de rotas.
- NÃO usar `as any` — sempre tipagem via schema.
- NÃO logar headers de autorização, tokens, nem body de rotas sensíveis.
- NÃO retornar entidades do ORM direto — mapear para DTO do response schema.
- NÃO retornar objeto solto no top-level — sempre envelope `{ "data": ... }`.
- Lista completa de proibições de contrato em `api-contract.md`.
