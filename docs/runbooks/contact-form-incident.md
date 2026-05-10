# Runbook — Contact form incident

> **Use when:** form returns 5xx, leads not arriving in Notion, operator inbox silent, or users report "form broken".
> **Owner:** @devops on-call. **Read time:** 3 min. **Time-to-mitigation target:** 10 min.

---

## Symptoms

You are in the right place if **any** of these are true:

1. `/api/contact` returns `500 PERSISTENCE_ERROR` to the user.
2. Notion DB **Contacts** has no new rows for > 24h despite expected traffic.
3. Operator inbox (`NOTIFY_EMAIL`) silent for > 24h despite Notion rows arriving.
4. Form returns `503 DISABLED` when it should be on (kill-switch flipped accidentally).
5. Form returns `429 RATE_LIMITED` to legitimate users (global cap hit, hot from spam).
6. Vercel function logs show `[contact:persist] permanent_error` or `[contact:persist] retries_exhausted` repeatedly.
7. Sentry (if wired) firing on `/api/contact` route.

---

## Triage — where to look first

Follow the steps **in order**. Each step takes < 60s.

### 1. Check the kill-switch first (cheapest signal)

Is the form supposed to be ON?

```
NEXT_PUBLIC_CONTACT_FORM_ENABLED=true   # form active
NEXT_PUBLIC_CONTACT_FORM_ENABLED=false  # 503 DISABLED returned to all submits
```

- Open Vercel → Project → Settings → Environment Variables → Production.
- If accidentally `false`, set to `true` and trigger a redeploy. `NEXT_PUBLIC_*` is build-time, not runtime — without redeploy, nothing changes.
- If correct, continue.

### 2. Vercel runtime logs (the source of truth)

Filter logs for the contact pipeline:

```
# Vercel Dashboard → Project → Logs → filter:
[contact:
```

Tags emitted (all include `rid=<requestId>` for correlation):

| Tag                                       | Meaning                                       |
|-------------------------------------------|-----------------------------------------------|
| `[contact:persist] ok attempt=N`          | Notion write succeeded                        |
| `[contact:persist] permanent_error`       | Notion auth/schema error (NOT a transient)    |
| `[contact:persist] retries_exhausted`     | Notion timed out / rate-limited 2x            |
| `[contact:persist] stub-mode`             | NOTION envs not set (dev or misconfig)        |
| `[contact:notify] ok`                     | Email sent                                    |
| `[contact:notify] resend_error name=X`    | Resend rejected (auth, domain, quota)         |
| `[contact:notify] exception type=X`       | Network / timeout — type only, never err msg  |
| `[contact:notify] stub-mode`              | RESEND_API_KEY not set                        |
| `[contact:ratelimit] upstash_unavailable` | Upstash unreachable, fell back to memory      |
| `[contact:ratelimit] global_cap_hit`      | Global hourly cap hit — likely under attack   |
| `[contact:ratelimit] email_cap_hit`       | Per-email cap hit — likely targeted spam      |
| `[contact] honeypot_hit`                  | Bot caught (silent 200, expected)             |
| `[contact] turnstile_failed code=X`       | Turnstile rejected the token or siteverify failed. CF codes: `missing-input-response`, `invalid-input-response`, `invalid-input-secret`, `timeout-or-duplicate`, `bad-request`, `internal-error`. Our wrapper codes: `http_5xx`, `transport`, `timeout`, `unknown` (CF returned success=false without an error-code — likely API change). |

If you see `permanent_error` go to step 3 (Notion). If `resend_error` go to step 4 (Resend). If `upstash_unavailable` go to step 5 (Upstash). If `turnstile_failed` go to step 6 (Turnstile).

### 3. Notion dashboard

- Open the Contacts DB (link in 1Password / shared vault).
- Verify:
  - **Integration is still connected** (DB → ⋯ → Connections → "Elemento-X form" present).
  - Schema unchanged. Required props: Name, Email, Company, Engagement, Engagement detail, Message, Status. A renamed property breaks `lib/contact/persist.ts` → `permanent_error code=validation_error`.
  - Token not revoked: https://www.notion.so/profile/integrations → "Elemento-X form" status **Active**.
- Most recent row vs Vercel log timestamp: if logs say `ok` but the row is missing, you are looking at the wrong DB (or the integration was reconnected to a copy).

### 4. Resend dashboard

- https://resend.com/emails → filter by date.
- Check:
  - **API key still valid** (Settings → API Keys → green dot).
  - **Sending domain still verified** (Domains → SPF/DKIM **Verified**). Domain unverification = silent reject.
  - **Quota not exhausted** (free tier: 100/day, 3000/month). Spam burst can drain it.
- If domain unverified: re-verify DNS records (TTL up to 48h, but typically minutes).
- If quota hit: upgrade plan OR rotate `FROM_EMAIL` to a backup verified domain.

### 5. Upstash status

- https://status.upstash.com → check current incidents.
- https://console.upstash.com → your DB → **Status: Active** + recent commands graph not flat.
- If Upstash is down, the route degrades to in-memory rate-limit (per-process, not shared across Vercel instances). Form **continues to work** — you'll see `[contact:ratelimit] upstash_unavailable` warnings, no user-facing 5xx. Mitigation: wait or rotate URL/token (see `secret-rotation.md`).

### 6. Turnstile (Cloudflare bot challenge)

- https://www.cloudflarestatus.com → check Turnstile component status.
- https://dash.cloudflare.com → Turnstile → your site → **Analytics** tab → look for spike in `failed` solves.
- Read the `code` from the log line `[contact] turnstile_failed code=X`:
  - `missing-input-response` — token absent on the request (client widget failed to render or solve, or JS bug stripped the token). Self-heal: user refreshes form. Sustained across many submits = the widget is broken in production; kill-switch the keys to fall back to honeypot + rate-limit while you debug the client.
  - `invalid-input-response` — token expired or malformed (user took too long; widgets expire ~5 min). Self-heal: user refreshes form.
  - `invalid-input-secret` — server has the wrong `TURNSTILE_SECRET_KEY` (typo / propagation issue / not redeployed). Rotate or fix env (see `secret-rotation.md` Turnstile section).
  - `timeout-or-duplicate` — token already used (replay) or expired. Self-heal.
  - `bad-request` — malformed POST to siteverify (our wrapper bug). Open issue and patch.
  - `internal-error` — Cloudflare-side issue. Check status page; transient.
  - `http_5xx` / `transport` / `timeout` — Cloudflare unreachable from Vercel. Likely transient. Sustained = consider kill-switch (Option 1) until restored; honeypot + rate-limit remain active without the widget.
  - `unknown` — Cloudflare returned `success=false` with no error-code. Treat as `internal-error` operationally (transient). Also: open an issue/Cloudflare community thread — it signals a CF API change and our parser needs hardening.
- If keys are missing entirely (operator removed them by mistake), the widget doesn't render and the route skips verify. Form continues to work in degraded mode.

---

## Common causes (with reproduction)

### Cause A — Notion integration disconnected

**Reproduce:** revoke the Notion integration → submit form → see `[contact:persist] permanent_error code=unauthorized`.
**Fix:** reconnect the integration to the Contacts DB. Verify with one test submit.

### Cause B — Notion schema renamed (e.g. operator renamed "Engagement" → "Type")

**Reproduce:** rename the Engagement select property in Notion → submit form → `[contact:persist] permanent_error code=validation_error`.
**Fix:** rename the Notion property back to match `lib/contact/persist.ts:buildProperties`. Renaming in code as a hotfix requires a deploy — slower than restoring the property name in Notion.

### Cause C — Resend domain unverified

**Reproduce:** delete DKIM record → submit form → Notion row appears, operator inbox silent. Logs: `resend_error name=unauthorized` or `resend_error name=invalid_from_address`.
**Fix:** restore DKIM/SPF in DNS. Notion has the lead — recover it manually until email comes back.

### Cause D — Resend free-tier daily quota drained by spam burst

**Reproduce:** 100+ submits in a day with valid emails → 101st returns 200 (Notion ok), no email. Logs: `resend_error name=quota_exceeded`.
**Fix:** lower `CONTACT_GLOBAL_LIMIT_PER_HOUR` (e.g. 200 → 50) to keep daily volume below quota; OR upgrade Resend plan; OR rotate to backup domain. Not user-facing — leads still in Notion.

### Cause E — Upstash credentials rotated without redeploy

**Reproduce:** rotate `UPSTASH_REDIS_REST_TOKEN` in Upstash console without updating Vercel envs → all submits log `[contact:ratelimit] upstash_unavailable error=UpstashError fallback=memory`. Form continues in degraded mode.
**Fix:** see `docs/runbooks/secret-rotation.md` (Upstash section).

### Cause F — `NEXT_PUBLIC_CONTACT_FORM_ENABLED` flipped to `false`

**Reproduce:** flip env in Vercel and redeploy → form section renders mailto fallback. Stale tabs still showing the form return `503 DISABLED` on submit.
**Fix:** flip back to `true`, redeploy. Stale tabs auto-recover on next page load.

### Cause G — Origin check rejects legitimate cross-subdomain traffic

**Reproduce:** site moved from `elemento-x.com` to `www.elemento-x.com` without updating `NEXT_PUBLIC_SITE_URL` → submits return `403 FORBIDDEN`.
**Fix:** update `NEXT_PUBLIC_SITE_URL` to the canonical origin currently serving traffic, redeploy.

### Cause H — Turnstile siteverify timeout / Cloudflare outage

**Reproduce:** Cloudflare Turnstile API unreachable (network partition or CF outage) → submits with widget rendered return `403 TURNSTILE_FAILED`. Logs: `[contact] turnstile_failed code=timeout` or `code=transport` or `code=http_5xx`.
**Fix:** check https://www.cloudflarestatus.com. If transient (< 5 min), wait. If sustained:
1. **Short-term mitigation:** clear `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` from Vercel envs (Production), redeploy. The widget stops rendering, the route skips verify, form falls back to honeypot + rate-limit only. Communicate degraded state in `#elemento-x-ops`.
2. **Recovery:** restore both envs, redeploy, validate per `secret-rotation.md` Turnstile section.

If the failure is `code=invalid-input-secret`, the secret is wrong (not a CF outage) — go to `secret-rotation.md` Turnstile section.

---

## Mitigation — buy time while you fix root cause

### Option 1 — Kill-switch the form (preferred)

1. Vercel → Project → Settings → Environment Variables → Production.
2. Set `NEXT_PUBLIC_CONTACT_FORM_ENABLED=false`.
3. **Trigger redeploy** (Settings → Deployments → ⋯ on latest → "Redeploy"). `NEXT_PUBLIC_*` is build-time — without redeploy, nothing changes.
4. Verify: visit `/#contact` → mailto fallback rendered (`contact@elemento-x.com`).
5. Communicate: post in `#elemento-x-ops`: "Form temporarily disabled, mailto active. ETA <X min>."

The fallback is wired in `app/_components/FinalCta/FinalCta.tsx:50,56` — no code change needed.

### Option 2 — Roll back to last known-good deploy

If breakage came from a recent deploy:

1. Vercel → Deployments → find last green deploy before the incident timestamp.
2. ⋯ → **Promote to Production**.
3. Verify with smoke test (`docs/runbooks/deploy.md`).
4. **Do not** touch envs unless rollback proves env is the cause.

### Option 3 — Tighten rate limit (under spam attack)

If `[contact:ratelimit] global_cap_hit` is firing repeatedly and legitimate users are 429'd:

1. Lower `CONTACT_RATE_LIMIT_PER_HOUR` (per-IP) from 5 to 2.
2. Lower `CONTACT_GLOBAL_LIMIT_PER_HOUR` from 200 to 50.
3. Redeploy.
4. If attack persists: enable Vercel Firewall rules (block by ASN/country if pattern is geographic), or kill-switch (Option 1).

---

## Recovery — turning it back ON

1. **Verify root cause is fixed** (don't restore traffic to a broken backend).
2. Restore env: `NEXT_PUBLIC_CONTACT_FORM_ENABLED=true` → redeploy.
3. Run `BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh` (full smoke).
4. Submit one **real test** through the live form (`name="SMOKE TEST"`, message contains `"SMOKE TEST"`); confirm:
   - Notion row appears with `Status=New`.
   - Operator inbox receives the email within 30s.
   - Vercel logs show `[contact:persist] ok` and `[contact:notify] ok` with the same `rid`.
5. **Archive the test row** in Notion (don't delete — keep audit trail). Tag it `Smoke test` if helpful.
6. Communicate recovery in `#elemento-x-ops`.

---

## Postmortem template

Open within 48h of any incident with user-facing 5xx or > 1h of mitigation in place. File at `docs/postmortems/PM-YYYY-MM-DD-<short-slug>.md`. Blameless — system failed, not a person.

```markdown
# PM-YYYY-MM-DD — <short title>

## 1. What happened?
<Timeline: detection → triage → mitigation → recovery. Use UTC timestamps.>

## 2. What was the impact?
<Number of failed submits / leads lost / users affected. Best estimate is fine; don't over-engineer.>

## 3. What was the root cause?
<Technical cause AND process cause. "Resend domain unverified" is technical; "no monitoring on DKIM record" is the process gap.>

## 4. What did we get right?
<Detection time, communication, fast rollback. Don't skip — pattern matters.>

## 5. Action items (concrete, with owners and due dates)
- [ ] <e.g. "Add Resend webhook for delivery failures to Sentry — @devops, due 2026-05-20">
- [ ] <e.g. "Add CI check that Notion DB schema matches `persist.ts` shape — @devops, due 2026-06-01">
- [ ] <e.g. "Document quota tuning in `.env.example` — @devops, due 2026-05-15">

## 6. Notes for future agents
<Any nuance that the runbook should absorb so the next incident is faster.>
```

After filling in #5, **create one Trello card per action item** in Backlog with labels `pipeline-discovery` + `postmortem` and link back to this PM doc.
