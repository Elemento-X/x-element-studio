# Runbook — Deploy

> **Scope:** every production deploy of `elemento-x-studio` to Vercel. Hotfix and routine deploys both follow this. Hotfix gets a fast-path note where it differs.
> **Owner:** @devops. **Read time:** 3 min. **Time budget:** 15 min for routine deploy, 5 min for hotfix.

---

## Pre-deploy checklist

Tick every box before clicking deploy. Skipping a box that turns out to matter is the most common cause of recovery cost.

### Code & build

- [ ] PR merged to `main` with @reviewer green.
- [ ] CI green on `main` (`.github/workflows/ci.yml` — lint + typecheck + unit + e2e + audit).
- [ ] `npm run build` clean locally (sanity, not a substitute for CI).
- [ ] No `console.log` debug noise in changed files (`console.info/warn/error` are fine — they survive prod by design).

### Env vars (production scope in Vercel)

- [ ] `NEXT_PUBLIC_SITE_URL` matches the domain that will serve traffic (HTTPS, no trailing slash).
- [ ] `NEXT_PUBLIC_CONTACT_FORM_ENABLED` is `true` (or intentionally `false` if shipping with the form gated).
- [ ] `FROM_EMAIL` uses a domain verified at Resend. **NOT** `onboarding@resend.dev` (boot validation rejects this; deploy will fail at runtime).
- [ ] `NOTIFY_EMAIL` is a corporate-domain inbox. Boot validation rejects **any** free-mail provider in prod: gmail, hotmail, outlook, live, yahoo, icloud, proton(mail).
- [ ] `RESEND_API_KEY`, `NOTION_API_KEY`, `NOTION_DATABASE_ID`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` all present (required when form is on).
- [ ] Rate-limit envs (`CONTACT_RATE_LIMIT_PER_HOUR`, `CONTACT_GLOBAL_LIMIT_PER_HOUR`, `CONTACT_EMAIL_LIMIT_PER_HOUR`) tuned vs Resend quota. Default 200/h global stays under Resend free tier (100/day) only because submits/h almost never sustain — re-read `docs/runbooks/contact-form-incident.md` Cause D before raising.

### External dependencies

- [ ] **Resend domain verified** (Domains page → SPF/DKIM both green). DNS records in our DNS provider untouched in last 24h. New TXT records propagate fast (minutes); MX changes can take longer.
- [ ] **Notion DB schema unchanged** since last successful deploy. Required props present and named exactly: Name, Email, Company, Engagement, Engagement detail, Message, Status. Renaming = `permanent_error` post-deploy.
- [ ] **Notion integration connected** to the Contacts DB.
- [ ] **Upstash DB Active** (https://console.upstash.com → status green).

### Operational

- [ ] On-call available for next 30 min (no flights, no commute, no meetings without laptop).
- [ ] Smoke test command ready to paste: `BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh`.
- [ ] Rollback target identified: note the URL of the previous green production deploy in case revert is needed.
- [ ] Window is OK: weekday between 09:00 and 16:00 local for routine deploys. Outside this window only for hotfixes (see Fast-path).
- [ ] Posted in `#elemento-x-ops`: `Deploying <commit-sha> to production at <UTC timestamp>. Expected duration: 5 min.`

---

## Deploy

Vercel is wired to deploy from `main` automatically on push. Manual deploy (preferred for control) below.

### Routine deploy

1. **Push merged commits** (already done if PR is merged). Vercel starts the build automatically.
2. **Watch the build.** Vercel → Deployments → newest → "Building".
   - If build fails: read logs, fix on a feature branch, repeat. **Do not** merge to `main` to "trigger another deploy" — that creates noise in the deploy history. Use Vercel "Redeploy" button if the failure was transient (e.g. network blip pulling deps).
3. **Verify the build was deployed to Production**, not Preview. The deploy card should show "Production" badge.
4. Move to **Post-deploy verification**.

### Manual deploy via CLI (alternative, when needed)

```bash
# From local machine, with vercel CLI authenticated
vercel deploy --prod
```

Use this when:
- You need to deploy a specific commit not at the head of `main` (rare; usually rollback territory).
- Vercel auto-deploy is misbehaving.

### Hotfix fast-path

For incidents requiring deploy outside business hours:

1. Skip "Window is OK" check. Keep all other pre-deploy boxes.
2. Open `#elemento-x-ops`: `HOTFIX deploying <commit-sha> at <UTC timestamp>. Issue: <one-liner>. Rollback target: <previous deploy URL>.`
3. Deploy as routine.
4. Post-deploy verification is **not optional** — even faster (skip the real test submit if it requires a long DKIM verification window; rely on smoke test exit code).
5. **Open postmortem in 48h** (`docs/postmortems/PM-…`). Hotfix without postmortem = recurrence guaranteed.

---

## Post-deploy verification

Run **all** of these. Total time: ~3 min.

### 1. Smoke test the API

```bash
BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh
```

Must exit `0`. If exit `1`, read the script's per-scenario output and triage with `docs/runbooks/contact-form-incident.md`. Do NOT proceed to step 2 if smoke test fails.

### 2. Vercel runtime logs

Tail logs for 60s after first traffic hits:

```
Vercel Dashboard → Project → Logs → live tail
```

Look for:
- ✅ `[contact:` tags appearing as expected when traffic flows.
- ❌ `Error` lines, especially `Invalid environment variables!` (boot validation rejected an env — re-check pre-deploy checklist).
- ❌ Repeated `permanent_error` or `retries_exhausted`.
- ❌ Any unhandled exception trace.

### 3. End-to-end real submit

Through the live site, not the API directly:

1. Open `https://elemento-x.com` in an incognito tab.
2. Scroll to the contact form.
3. Submit:
   - Name: `SMOKE TEST POST-DEPLOY`
   - Email: a real inbox you control (not the operator inbox).
   - Engagement: any
   - Message: `SMOKE TEST POST-DEPLOY <UTC timestamp> — please ignore`
4. Verify:
   - UI shows success state within 3s.
   - **Notion**: row appears in Contacts DB with all fields set, `Status=New`.
   - **Operator inbox**: notification email arrives within 30s. Reply-To equals the test inbox.
   - **Vercel logs**: matching `rid` shows `[contact:persist] ok attempt=1` + `[contact:notify] ok latency_ms=…`.
5. **Archive the test row** in Notion. Tag it `Smoke test`.

If any of #4 fails: rollback (next section), then debug.

### 4. Communicate

Post in `#elemento-x-ops`:

```
✅ Production deploy <commit-sha> verified at <UTC timestamp>.
- Smoke test: passed
- Live submit: passed (rid <X>)
- Logs clean
```

---

## Rollback

When to roll back (no second-guessing):

- Smoke test fails twice in a row (and the failure is not a transient network glitch).
- Live submit produces user-facing 5xx that did not happen on the previous deploy.
- Vercel logs show new `Error` patterns absent on previous deploy.
- New deploy degrades a metric that matters even if no error fires (e.g. p99 latency > 3s when previous was 800ms).

### Procedure

1. **Vercel → Deployments**.
2. Find the **previous green production deploy** (the rollback target you noted in pre-deploy).
3. Click ⋯ → **"Promote to Production"**. Confirm.
4. Vercel atomic-swaps the alias. New traffic hits the old deploy within seconds.
5. **Run smoke test on the rolled-back state** to confirm it is healthy: `BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh`.
6. **Post in `#elemento-x-ops`**: `Rolled back to <previous-sha> at <UTC timestamp>. Bad deploy: <bad-sha>. Reason: <one-liner>. Investigation in progress.`
7. **Open a Trello card** in Backlog: title `Investigate failed deploy <bad-sha>`, label `pipeline-discovery` + `regression`. Link to Vercel deploy URL + log excerpts.

### Notes

- **Rollback does NOT roll back env vars or external state.** If the bad deploy ran a Notion schema migration or wrote to Upstash with a different key prefix, that state persists. Audit external state before re-deploying any fix.
- **Rollback is free.** No penalty for rolling back; the penalty is for hesitating and leaving users on a broken deploy. The cost of a 60-second wrong rollback is far lower than the cost of 5 minutes of broken prod.

---

## Anti-patterns (do NOT do)

- **Deploy on Friday after 16:00.** If something breaks, you debug on the weekend. Routine deploys go Mon-Thu, business hours.
- **Skip the smoke test.** Smoke test is automated, takes 30 seconds, and catches 80% of broken deploys. Skipping it because "this is just a copy change" is how the next incident starts.
- **Deploy with envs scoped wrong (e.g. only Preview).** Always check Production scope explicitly when adding/editing envs.
- **Push a "fix" to `main` to trigger another deploy without local validation.** Build noise + history pollution. Use feature branches; merge when green.
- **Promote a Preview deploy to Production without first reviewing whose code is in it.** Preview deploys can include uncommitted/abandoned branches in some flows; verify the commit SHA matches what you intend.
- **Edit production envs and assume hot-reload.** `NEXT_PUBLIC_*` is build-time constant; non-public envs are read at runtime but functions cache the values per cold-start. Either way, redeploy after env changes.
