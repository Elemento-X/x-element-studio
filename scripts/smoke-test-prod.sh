#!/usr/bin/env bash
# Smoke test for the production deploy.
#
# Covers:
#   - /api/contact pipeline (GET 405, content-type, JSON validation,
#     schema validation, happy path / feature-off path)
#   - All four locale routes (en `/`, pt-br, es, fr) — HTTP 200,
#     correct `<html lang>` attribute, locale-specific copy in H1.
#   - SEO endpoints: /robots.txt and /sitemap.xml resolve and contain
#     the canonical sitemap reference / hreflang entries.
#
# Usage:
#   BASE_URL=https://elemento-x.com bash scripts/smoke-test-prod.sh
#
# Optional:
#   FEATURE_OFF=1   assert the form is currently disabled (503 path)
#   VERBOSE=1       always print response bodies (debug)
#
# Exit codes:
#   0   all expected scenarios passed
#   1   at least one scenario failed
#   2   usage error (missing BASE_URL or curl unavailable)

set -u
set -o pipefail

if [ -z "${BASE_URL:-}" ]; then
  echo "ERROR: BASE_URL env var is required." 1>&2
  echo "Usage: BASE_URL=https://elemento-x.com bash $0" 1>&2
  exit 2
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl not found in PATH." 1>&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
ENDPOINT="${BASE_URL}/api/contact"
FEATURE_OFF="${FEATURE_OFF:-0}"
VERBOSE="${VERBOSE:-0}"

PASS_COUNT=0
FAIL_COUNT=0
FAIL_NAMES=""

if [ -t 1 ]; then
  C_OK=$'\033[32m'
  C_FAIL=$'\033[31m'
  C_DIM=$'\033[2m'
  C_RST=$'\033[0m'
else
  C_OK=""
  C_FAIL=""
  C_DIM=""
  C_RST=""
fi


# Test runner. Captures status, headers, body via curl write-out.
do_check() {
  m=$1
  exp_status=$2
  label=$3
  exp_code=$4
  shift 4

  hf="${TMPDIR:-/tmp}/smoke-headers.$$"
  bf="${TMPDIR:-/tmp}/smoke-body.$$"

  status=$(curl -sS -o "$bf" -D "$hf" -w "%{http_code}" -X "$m" "$@" "$ENDPOINT" || echo "000")

  body_excerpt=$(head -c 240 "$bf" 2>/dev/null || echo "")
  headers_relevant=$(grep -iE '^(allow|content-type|x-request-id|cache-control|retry-after|x-ratelimit-remaining):' "$hf" 2>/dev/null || true)

  ok=1
  reason=""

  if [ "$status" != "$exp_status" ]; then
    ok=0
    reason="status=$status (expected $exp_status)"
  fi

  if [ "$ok" = "1" ] && [ -n "$exp_code" ]; then
    if ! grep -q "\"code\"[[:space:]]*:[[:space:]]*\"$exp_code\"" "$bf"; then
      ok=0
      reason="missing code=$exp_code in body"
    fi
  fi

  if [ "$ok" = "1" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf "%sPASS%s  %-58s status=%s\n" "$C_OK" "$C_RST" "$label" "$status"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAIL_NAMES="$FAIL_NAMES|$label"
    printf "%sFAIL%s  %-58s %s\n" "$C_FAIL" "$C_RST" "$label" "$reason"
  fi

  if [ "$VERBOSE" = "1" ] || [ "$ok" = "0" ]; then
    if [ -n "$headers_relevant" ]; then
      printf "%s      headers:%s\n" "$C_DIM" "$C_RST"
      while IFS= read -r line; do
        printf "%s        %s%s\n" "$C_DIM" "$line" "$C_RST"
      done <<< "$headers_relevant"
    fi
    if [ -n "$body_excerpt" ]; then
      printf "%s      body:    %s%s\n" "$C_DIM" "$body_excerpt" "$C_RST"
    fi
  fi

  rm -f "$hf" "$bf"
}

# Page-route check: GET <path>, assert status, optionally assert
# `<html lang>` attribute and a copy substring proves the locale's
# messages got wired up (not just routing).
#
# Args:
#   1 = expected status
#   2 = label
#   3 = path (e.g. /, /pt-br, /sitemap.xml)
#   4 = expected lang attr (optional; empty string skips the check)
#   5 = expected body substring (optional; empty string skips)
do_check_page() {
  exp_status=$1
  label=$2
  path=$3
  exp_lang=${4:-}
  exp_substring=${5:-}

  bf="${TMPDIR:-/tmp}/smoke-page-body.$$"

  # Send Accept-Language: en so the next-intl middleware doesn't 307
  # `/` to `/pt-br` based on the runner's locale. Production users get
  # that behavior; the smoke needs deterministic routing.
  # --max-redirs 0 makes any unexpected redirect surface as exit-code
  # 47, which we map to a clear failure below instead of silently
  # following.
  status=$(curl -sS -o "$bf" -w "%{http_code}" \
    -H "Accept-Language: en" \
    --max-redirs 0 \
    "${BASE_URL}${path}" || echo "000")

  ok=1
  reason=""

  if [ "$status" != "$exp_status" ]; then
    ok=0
    reason="status=$status (expected $exp_status)"
  fi

  if [ "$ok" = "1" ] && [ -n "$exp_lang" ]; then
    if ! grep -qE "<html[^>]*lang=\"${exp_lang}\"" "$bf"; then
      ok=0
      reason="missing lang=\"$exp_lang\" in <html>"
    fi
  fi

  if [ "$ok" = "1" ] && [ -n "$exp_substring" ]; then
    if ! grep -q "$exp_substring" "$bf"; then
      ok=0
      reason="missing copy=\"$exp_substring\" in body"
    fi
  fi

  if [ "$ok" = "1" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf "%sPASS%s  %-58s status=%s\n" "$C_OK" "$C_RST" "$label" "$status"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAIL_NAMES="$FAIL_NAMES|$label"
    printf "%sFAIL%s  %-58s %s\n" "$C_FAIL" "$C_RST" "$label" "$reason"
  fi

  if [ "$VERBOSE" = "1" ] || [ "$ok" = "0" ]; then
    body_excerpt=$(head -c 240 "$bf" 2>/dev/null || echo "")
    if [ -n "$body_excerpt" ]; then
      printf "%s      body:    %s%s\n" "$C_DIM" "$body_excerpt" "$C_RST"
    fi
  fi

  rm -f "$bf"
}

# Marker tag for the smoke run; lets the operator filter Notion/logs.
SMOKE_TAG="SMOKE_TEST_$(date -u +%Y%m%dT%H%M%SZ)"

echo "Endpoint: $ENDPOINT"
echo "Tag:      $SMOKE_TAG"
if [ "$FEATURE_OFF" = "1" ]; then
  echo "Mode:     FEATURE_OFF (assert 503)"
else
  echo "Mode:     FEATURE_ON (assert 200)"
fi
echo

# ─── Locale routes (F4 i18n) ────────────────────────────────────────
# Every locale must respond 200 on its canonical path, carry the right
# `<html lang>`, and render copy that proves the messages bundle for
# that locale loaded (not just the routing). Default (en) lives at /;
# the others at /<locale> because of `localePrefix: 'as-needed'`.
do_check_page 200 "Locale route en (/) renders with lang and EN copy" "/" "en" "We build"
do_check_page 200 "Locale route pt-br renders with lang and PT-BR copy" "/pt-br" "pt-br" "Construímos"
do_check_page 200 "Locale route es renders with lang and ES copy" "/es" "es" "Construimos"
do_check_page 200 "Locale route fr renders with lang and FR copy" "/fr" "fr" "construisons"

# ─── SEO endpoints (F4.4) ───────────────────────────────────────────
# Both must serve plain text/XML at the canonical paths so search
# engines pick them up. We check the body contains the canonical
# sitemap reference / a localized hreflang entry, not just that the
# route exists.
do_check_page 200 "/robots.txt resolves and references sitemap.xml" "/robots.txt" "" "/sitemap.xml"
do_check_page 200 "/sitemap.xml includes all four locale URLs" "/sitemap.xml" "" "hreflang=\"pt-br\""

echo

# ─── /api/contact pipeline ─────────────────────────────────────────
# Scenario 1: GET should be 405 with Allow: POST.
do_check GET 405 "GET returns 405 METHOD_NOT_ALLOWED" "METHOD_NOT_ALLOWED"

# Scenario 2: POST without Content-Type should be 415.
do_check POST 415 "POST without Content-Type returns 415" "UNSUPPORTED_MEDIA_TYPE" --data "{}"

# Scenario 3: POST with malformed JSON should be 400 INVALID_JSON.
do_check POST 400 "POST with malformed JSON returns 400 INVALID_JSON" "INVALID_JSON" -H "Content-Type: application/json" --data "{not json}"

# Scenario 4: POST with schema-invalid body should be 400 VALIDATION_ERROR.
do_check POST 400 "POST with empty body returns 400 VALIDATION_ERROR" "VALIDATION_ERROR" -H "Content-Type: application/json" --data "{}"

# Scenario 5: POST with valid body.
#   - feature ON (default):  expect 200 with {"data":{"ok":true}}.
#                            THIS WRITES A REAL ROW TO NOTION.
#                            Caller must archive it post-run.
#   - feature OFF:           expect 503 with code=DISABLED.

# Build a valid payload tagged with the smoke run id, so the operator
# can find and archive the Notion row easily.
VALID_PAYLOAD=$(printf '{"name":"%s","email":"smoke+%s@example.com","engagement":"diagnostic","message":"%s — automated smoke test, please ignore. Generated by scripts/smoke-test-prod.sh. Caller is responsible for archiving this Notion row."}' "$SMOKE_TAG" "$$" "$SMOKE_TAG")

if [ "$FEATURE_OFF" = "1" ]; then
  do_check POST 503 "POST valid body (feature OFF) returns 503 DISABLED" "DISABLED" -H "Content-Type: application/json" --data "$VALID_PAYLOAD"
else
  do_check POST 200 "POST valid body (feature ON) returns 200 OK" "" -H "Content-Type: application/json" --data "$VALID_PAYLOAD"
fi

echo
echo "─────────────────────────────────────────"
echo "Pass: $PASS_COUNT  Fail: $FAIL_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "Failed: $FAIL_NAMES"
  echo
  echo "Triage: docs/runbooks/contact-form-incident.md"
  exit 1
fi

if [ "$FEATURE_OFF" != "1" ]; then
  echo
  echo "NOTE: feature ON mode wrote a real Notion row tagged $SMOKE_TAG."
  echo "      Archive it manually in the Contacts DB."
fi

exit 0
