#!/usr/bin/env bash
# apply-ruleset.sh — idempotently create-or-update the `main-protection`
# repository ruleset from main-ruleset.json (ADR-0004, build-order step 9).
#
# This is an OPERATOR action: it changes repository settings via the GitHub API
# and requires `gh` authenticated with admin on the repo. It is NOT run by the
# build pipeline. Re-running is safe (it PUTs the existing ruleset if present,
# POSTs a new one otherwise).
#
#   Usage: REPO=nino-chavez/blueprint docs/governance/apply-ruleset.sh
#          (REPO defaults to the gh-resolved current repo)
#
# Preconditions:
#   - gh CLI authenticated: `gh auth status`
#   - jq available
#   - The `_comment` key is stripped before sending (GitHub rejects unknown keys).
#
# After applying, REMOVE any classic branch protection on the default branch —
# rulesets + classic protection on the same branch are two sources of truth.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
json="$here/main-ruleset.json"
repo="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
name="$(jq -r .name "$json")"

# Strip the documentation-only `_comment` key before sending.
payload="$(jq 'del(._comment)' "$json")"

echo "Applying ruleset '$name' to $repo ..."

# Find an existing ruleset by name (org/user-repo rulesets live under the repo).
existing_id="$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id" 2>/dev/null || true)"

if [ -n "${existing_id:-}" ]; then
  echo "  updating existing ruleset id=$existing_id (PUT)"
  echo "$payload" | gh api -X PUT "repos/$repo/rulesets/$existing_id" --input - >/dev/null
else
  echo "  creating new ruleset (POST)"
  echo "$payload" | gh api -X POST "repos/$repo/rulesets" --input - >/dev/null
fi

echo "Done. Verify: gh api repos/$repo/rulesets --jq '.[].name'"
echo "Reminder: remove any CLASSIC branch protection on the default branch (two layers = two sources of truth)."
