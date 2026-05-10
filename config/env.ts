import 'server-only'
import { z } from 'zod'

// `next build` evaluates server modules with NODE_ENV=production to
// collect page data — at that point, real production envs (RESEND_API_KEY,
// NOTION_*, UPSTASH_*, HTTPS site URL) may not be set (e.g. local builds
// before deploying, preview builds, CI without secrets). NEXT_PHASE
// distinguishes build phase from runtime. Strict checks fire only at
// runtime (`phase-production-server`), so deploys still fail-fast in
// prod if a real env is missing — but builds remain unblocked.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const isProd = process.env.NODE_ENV === 'production' && !isBuildPhase

const envSchema = z
  .object({
    // Runtime
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Public site URL (CORS, links absolutos, structured data).
    // HTTPS é validado em prod via superRefine.
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

    // Contact form kill-switch (F2). Enum estrito + transform: evita o bug
    // clássico de `z.coerce.boolean("false") === true`. Operador escrevendo
    // `NEXT_PUBLIC_CONTACT_FORM_ENABLED="false"` LIGARIA a feature — kill-
    // switch quebrado. Enum força valor literal.
    NEXT_PUBLIC_CONTACT_FORM_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    // Rate limit per IP (F2). 5 req/h default — ajustável via env sem rebuild.
    CONTACT_RATE_LIMIT_PER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .max(1000)
      .default(5),

    // Global cap (F2). All submits across all IPs count against this single
    // bucket per hour. Defends against IPv6 /64 rotation that bypasses the
    // per-IP cap — attacker needs ~40 IPs to drain a 200/h cap; with 200/h
    // they can also drain Resend free tier (100/day) before this triggers,
    // so tune in tandem with the email provider's quota.
    CONTACT_GLOBAL_LIMIT_PER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .max(100000)
      .default(200),

    // Per-email cap (F2). Catches attackers who rotate IPs but reuse a
    // single submitter email (e.g. targeted spam to a specific address).
    // Default 2/h is conservative — legitimate users rarely submit twice
    // in an hour with the same address.
    CONTACT_EMAIL_LIMIT_PER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .max(1000)
      .default(2),

    // Email — Resend (F2). FROM_EMAIL/NOTIFY_EMAIL have no defaults so
    // the operator must declare them explicitly per environment. The
    // dev defaults that used to live here were dangerous in prod (sandbox
    // sender = silent reject; gmail.com = personal inbox leak).
    EMAIL_PROVIDER: z.enum(['resend']).default('resend'),
    RESEND_API_KEY: z.string().optional(),
    FROM_EMAIL: z.string(),
    NOTIFY_EMAIL: z.string().email(),

    // Persistence — Notion (F2)
    NOTION_API_KEY: z.string().optional(),
    NOTION_DATABASE_ID: z.string().optional(),

    // Rate limit storage — Upstash Redis via Vercel Marketplace (F2).
    // Regex anchor previne SSRF via config drift (atacante interno troca a
    // URL pra https://attacker.com e o adapter manda token pro host). Mesmo
    // pattern aplicado a SENTRY_DSN/SUPABASE_URL no template original.
    //
    // preprocess: trata string vazia ("UPSTASH_REDIS_REST_URL=" no .env.local)
    // como undefined. Sem isso, .url() falha em "" antes do .optional() conseguir
    // perdoar — e o boot quebra mesmo com a feature OFF.
    UPSTASH_REDIS_REST_URL: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z
        .string()
        .url()
        .regex(
          /^https:\/\/[a-z0-9-]+\.upstash\.io$/i,
          'UPSTASH_REDIS_REST_URL deve seguir https://<id>.upstash.io',
        )
        .optional(),
    ),
    UPSTASH_REDIS_REST_TOKEN: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().optional(),
    ),

    // Observability — Sentry (optional). Lazy-loaded by lib/observability/sentry.ts
    // when DSN is set; otherwise zero runtime weight. preprocess turns empty
    // string into undefined so a blank entry in .env does not fail .url().
    SENTRY_DSN: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().url().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    // FROM_EMAIL: aceita "Nome <email@host>" OU "email@host" puro.
    // Validação leve (não substitui o enforcement do Resend), apenas
    // protege contra typo grosseiro no .env.
    const fromEmailRegex =
      /^(?:[^<>]+\s+<[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+>|[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+)$/
    if (!fromEmailRegex.test(data.FROM_EMAIL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FROM_EMAIL'],
        message: 'FROM_EMAIL inválido. Use "Nome <user@host>" ou "user@host".',
      })
    }

    if (isProd) {
      // NEXT_PUBLIC_SITE_URL deve ser HTTPS em prod (sem localhost).
      const siteHostname = (() => {
        try {
          return new URL(data.NEXT_PUBLIC_SITE_URL).hostname
        } catch {
          return ''
        }
      })()
      if (
        siteHostname === 'localhost' ||
        !data.NEXT_PUBLIC_SITE_URL.startsWith('https://')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['NEXT_PUBLIC_SITE_URL'],
          message:
            'NEXT_PUBLIC_SITE_URL deve ser HTTPS em produção (sem localhost).',
        })
      }

      // Form ON em prod exige stack completo (Resend + Notion + Upstash).
      // Se a feature está OFF, deps são opcionais — landing puramente
      // estática até o form ir ao ar.
      if (data.NEXT_PUBLIC_CONTACT_FORM_ENABLED) {
        if (!data.RESEND_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['RESEND_API_KEY'],
            message:
              'RESEND_API_KEY é obrigatório em produção quando NEXT_PUBLIC_CONTACT_FORM_ENABLED=true.',
          })
        }
        if (!data.NOTION_API_KEY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['NOTION_API_KEY'],
            message:
              'NOTION_API_KEY é obrigatório em produção quando NEXT_PUBLIC_CONTACT_FORM_ENABLED=true.',
          })
        }
        if (!data.NOTION_DATABASE_ID) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['NOTION_DATABASE_ID'],
            message:
              'NOTION_DATABASE_ID é obrigatório em produção quando NEXT_PUBLIC_CONTACT_FORM_ENABLED=true.',
          })
        }
        if (!data.UPSTASH_REDIS_REST_URL) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['UPSTASH_REDIS_REST_URL'],
            message:
              'UPSTASH_REDIS_REST_URL é obrigatório em produção quando NEXT_PUBLIC_CONTACT_FORM_ENABLED=true (rate limiting).',
          })
        }
        if (!data.UPSTASH_REDIS_REST_TOKEN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['UPSTASH_REDIS_REST_TOKEN'],
            message:
              'UPSTASH_REDIS_REST_TOKEN é obrigatório em produção quando NEXT_PUBLIC_CONTACT_FORM_ENABLED=true (rate limiting).',
          })
        }

        // Reject dev placeholders in prod. Resend sandbox sender silently
        // fails in prod (notify is best-effort → operator gets nothing,
        // leads pile up in Notion only). Personal Gmail as NOTIFY_EMAIL
        // is data-leak risk + never the right operator inbox in prod.
        if (/@resend\.dev\b/i.test(data.FROM_EMAIL)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['FROM_EMAIL'],
            message:
              'FROM_EMAIL não pode usar @resend.dev em produção (sandbox sender). Verifique um domínio próprio no Resend.',
          })
        }
        // Reject any free-mail provider as the operator inbox in prod —
        // not just the dev default. A trocar por outro Gmail/Hotmail/etc
        // pessoal seria igualmente errado: leads sensíveis indo pra
        // inbox individual + zero política corporativa de retenção.
        // Defesa em profundidade: a defesa primária é o operador
        // configurar o inbox da equipe; este é o garde-fou caso ele
        // esqueça e copie o default literal ou troque por outro Gmail.
        if (
          /@(gmail|hotmail|outlook|live|yahoo|icloud|proton(mail)?)\.com$/i.test(
            data.NOTIFY_EMAIL,
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['NOTIFY_EMAIL'],
            message:
              'NOTIFY_EMAIL não pode ser inbox pessoal (gmail/hotmail/outlook/yahoo/icloud/proton) em produção. Configure inbox da equipe em domínio próprio.',
          })
        }
      }
    }
  })

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  // NUNCA emitir `_env.error.format()` — inclui o VALOR recebido de cada
  // campo. Se uma env sensível (RESEND_API_KEY, NOTION_API_KEY,
  // UPSTASH_REDIS_REST_TOKEN) falhar a validação com valor parcial, o
  // stderr → log aggregator vaza o secret. Listamos apenas path + mensagem.
  const issues = _env.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  console.error(`Invalid environment variables:\n${issues}`)
  throw new Error('Invalid environment variables!')
}

export const env = _env.data
