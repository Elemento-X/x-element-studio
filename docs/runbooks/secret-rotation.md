# Runbook — Secret rotation

> **Scope:** how to rotate the three production secrets used by the contact form (`NOTION_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`).
> **Owner:** @devops on-call. **Read time:** 4 min.

---

## When to rotate

### Calendar default

| Secret                       | Default cadence | Rationale                                              |
|------------------------------|-----------------|--------------------------------------------------------|
| `NOTION_API_KEY`             | Every 6 months  | Token sees only DBs explicitly connected, but PII (lead emails) lives there. |
| `RESEND_API_KEY`             | Every 6 months  | Account-wide send authority. Compromise = spam-from-our-domain. |
| `UPSTASH_REDIS_REST_TOKEN`   | Every 12 months | Rate-limit DB only (no PII). Lower urgency, but still rotate. |

Set a quarterly recurring reminder in the team calendar covering all three.

### Leak triggers (rotate IMMEDIATELY)

Rotate without waiting for cadence if **any** of these happen:

- Secret pasted in Slack / chat / Discord / email (even DM, even "I'll delete it").
- Secret printed in logs (Vercel runtime, CI, local terminal screenshare).
- Secret committed to git (even if reverted — git history is forever; assume compromised).
- Laptop with `.env.local` lost or stolen.
- Suspected unauthorized access (unexpected Notion edits, unknown Resend sends, Upstash command volume anomaly).
- Team member with access leaves the project.

The cost of rotating unnecessarily is ~10 minutes. The cost of NOT rotating after a leak is data exposure. Always err toward rotation.

---

## Pre-flight (any rotation)

Before touching any secret:

1. **Confirm you are on-call** or have explicit handoff.
2. **Open the incident channel** (`#elemento-x-ops`) — even routine rotations get logged. Format: `Rotating <secret> at <UTC timestamp> — reason: <calendar | leak suspected | offboarding>`.
3. **Do not rotate during peak traffic** unless responding to leak. Schedule routine rotation for low-traffic windows (weekday morning UTC, never Friday afternoon).
4. **Have the smoke test ready** in another terminal: `BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh`.

---

## NOTION_API_KEY

### Procedure

1. **Generate the new token.**
   - Go to https://www.notion.so/profile/integrations → click your "Elemento-X form" integration.
   - **Do NOT delete it** — that breaks the connection to the Contacts DB. Just generate a new token.
   - Click "Show" on the existing secret → "Regenerate". Copy the new value (`secret_…`) immediately; it is shown once.

2. **Update Vercel env (Production scope only first).**
   - Vercel → Project → Settings → Environment Variables.
   - Find `NOTION_API_KEY` → "Edit" → paste new value → check "Production" only → Save.
   - **Do NOT update Preview/Development at this stage** — keeps the old token alive in case you need to roll back.

3. **Trigger a redeploy of Production.**
   - Vercel → Deployments → ⋯ on latest production deploy → "Redeploy" with the **same source code**.
   - Wait for green checkmark (typical: 60-120s).

4. **Run validation (next section).**

5. **Update Preview & Development envs once production is verified.**
   - Same env in Vercel → also check "Preview" + "Development" → Save.

6. **Communicate completion** in `#elemento-x-ops`: `NOTION_API_KEY rotated successfully at <UTC timestamp>.`

### Validation

After redeploy:

- Run `BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh` — must exit 0.
- Submit one real test (`name="SMOKE TEST ROTATE"`, valid email) → confirm Notion row appears within 5s.
- In Vercel logs, look for `[contact:persist] ok attempt=1` for the new submit. `permanent_error code=unauthorized` means the new token did not propagate (forgot the redeploy?).
- Archive the test Notion row.

### Rollback

If validation fails:

1. **Re-paste the old token** (you should still have it in your password manager for at least 24h after rotation).
2. Redeploy.
3. Smoke test again.
4. Investigate: usually the new token was copy-pasted wrong (trailing whitespace, missing first char) or the integration was inadvertently disconnected from the DB (rare — regeneration normally preserves connections, but verify in DB → ⋯ → Connections).

---

## RESEND_API_KEY

### Procedure

1. **Generate a new key, side-by-side with the old one.**
   - https://resend.com/api-keys → "Create API Key".
   - Name: `elemento-x-prod-<YYYYMMDD>` (date in the name makes audit obvious).
   - Permission: **Sending access** (least privilege; do NOT grant Full access for the contact form's needs).
   - Copy the key (`re_…`) immediately.
   - **Do NOT revoke the old key yet** — keep both alive for the cutover window.

2. **Update Vercel envs (Production first).**
   - Same flow as Notion: edit `RESEND_API_KEY`, paste new value, Production-scope first, redeploy.

3. **Validate (next section).**

4. **Revoke the old key** at https://resend.com/api-keys → ⋯ on the old entry → Revoke. Wait at least 5 minutes after a clean smoke test before revoking — gives any in-flight requests time to drain.

5. **Update Preview/Dev envs.**

6. **Communicate completion** in `#elemento-x-ops`.

### Validation

- Smoke test exits 0.
- Real test submit (`name="SMOKE TEST ROTATE"`) → confirm:
  - Notion row appears.
  - Operator inbox receives the email within 30s.
  - Vercel log shows `[contact:notify] ok latency_ms=…` for that `rid`.
- `resend_error name=unauthorized` in logs = new key not propagated.

### Rollback

If validation fails **before** you revoke the old key:

1. Re-paste old key in Vercel env. Redeploy. Smoke test.

If you already revoked the old key:

1. Generate a brand-new key with same permission.
2. Repeat from step 2 of the procedure.
3. The original new key is now dead too — investigate after recovery (likely a typo on copy-paste or a wrong account/scope).

---

## UPSTASH_REDIS_REST_TOKEN

### Procedure

1. **Open the Upstash console** for the production DB: https://console.upstash.com.
2. Click your DB → **Details** tab → "REST API" section.
3. Click **"Reset Token"**. Confirm. The new token replaces the old one immediately — there is no grace period at Upstash. Plan for ~30 seconds of degraded mode (form falls back to in-memory rate-limit; not user-facing).

   > **Important:** unlike Notion/Resend, Upstash does NOT support side-by-side tokens. The old token dies the instant you reset.

4. **Update Vercel env (Production).**
   - Edit `UPSTASH_REDIS_REST_TOKEN` → paste new value → Production scope → Save.
   - Note: `UPSTASH_REDIS_REST_URL` does NOT change on a token rotation. Leave it.

5. **Trigger redeploy of Production.**

6. **Validate (next section).**

7. **Update Preview/Dev envs** with the same new token (Upstash uses one DB across envs unless you provisioned separate ones).

8. **Communicate completion** in `#elemento-x-ops`. Mention the brief degraded-mode window.

### Validation

- Smoke test exits 0.
- Submit `CONTACT_RATE_LIMIT_PER_HOUR + 1` valid requests in quick succession from one IP → first 5 succeed, 6th returns `429 RATE_LIMITED`. If the 6th does NOT 429, the rate limiter is on memory fallback (token wrong or stale). In Vercel logs, look for `[contact:ratelimit] upstash_unavailable error=…` to confirm.
- After clean smoke, expect zero `upstash_unavailable` warnings for new requests.

### Rollback

The old token is **gone the moment you reset**. If validation fails:

1. The form continues to work in degraded mode — not user-facing. There is no panic.
2. Reset the token AGAIN at Upstash → new value.
3. Update Vercel env with this newer value.
4. Redeploy. Smoke test.
5. Investigate the typo / propagation issue.

---

## Audit log

Every rotation creates one entry. Append-only file at `docs/runbooks/secret-rotation-log.md` (create on first entry):

```markdown
## YYYY-MM-DD HH:MM UTC — <secret name>
- Operator: <name>
- Reason: calendar | leak-suspected | offboarding | other
- Old token last 4 chars: ****abcd
- New token last 4 chars: ****wxyz
- Rollback used: yes | no
- Notes: <anything notable>
```

Last 4 chars only — never the full token. Never the value.

---

## Anti-patterns (do NOT do)

- **Rotate secret without redeploying.** The Vercel build embeds env into the function bundle; updating the env without redeploy keeps the OLD value live until next deploy.
- **Rotate Notion/Resend secrets simultaneously.** If validation fails, you don't know which one is the problem. Rotate one at a time with a clean smoke test between them.
- **Paste the new token in Slack to "save it for later".** Even DM. Use 1Password / shared vault.
- **Skip the audit log entry.** Future operators (and postmortems) need to reconstruct what happened when.
- **Rotate during peak traffic on a Friday.** If something breaks, you debug on the weekend.
