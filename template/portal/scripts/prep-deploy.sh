#!/usr/bin/env bash
# Blueprint Portal — prep for Cloudflare Pages deploy
#
# Reads docs.tiers[].docs[] from _meta/index.json and copies each entry's
# `source` (repo-relative path, resolved against the portal's parent
# directory) into _docs/<id>.md so the canonical viewer
# (docs/index.html) and the chat function (functions/api/chat.js) can
# serve them from the deploy root.
#
# Manifest-driven; no hardcoded SOURCES table. Entries without a
# `source` field are assumed to already exist at _docs/<id>.md
# (consumers may author directly there when no canonical path applies).
#
# Full rationale: docs/decisions/0003-portal-docs-manifest-driven-sync.md
# in the methodology repo.

set -euo pipefail
PORTAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INITIATIVE_DIR="$(cd "$PORTAL_DIR/.." && pwd)"
DOCS_OUT="$PORTAL_DIR/_docs"
MANIFEST="$PORTAL_DIR/_meta/index.json"

if [ ! -f "$MANIFEST" ]; then
  echo "error: manifest not found at $MANIFEST" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node required for manifest parsing (install Node.js 18+)" >&2
  exit 1
fi

# ── Deployment-intent readiness gate (ADR-0010, wave 88) ─────────────────────
# --intent=preview      (default) shell/undeclared pages are WARNed, deploy proceeds
# --intent=stakeholder  ANY shell page BLOCKS; content-ready pages WARN (not yet
#                       fact-checked); undeclared (legacy, no readiness field)
#                       pages are listed as a WARN, not blocked (pre-ADR-0010
#                       consumers must not wedge). chat.access=open-capped needs
#                       a current spend-cap attestation in chat.OWNER-SPEC.md;
#                       chat.access=turnstile refuses (widget half ships in the
#                       d2 follow-up — declare open-capped or off until then).
INTENT="preview"
for arg in "$@"; do
  case "$arg" in
    --intent=preview) INTENT="preview" ;;
    --intent=stakeholder) INTENT="stakeholder" ;;
    --intent=*) echo "error: --intent must be preview or stakeholder (got ${arg#--intent=})" >&2; exit 2 ;;
  esac
done

node -e '
  const fs = require("fs"), path = require("path");
  const [portalDir, intent] = process.argv.slice(1);
  const metaDir = path.join(portalDir, "_meta");
  const census = { shell: [], "content-ready": [], "stakeholder-ready": [], undeclared: [], invalid: [] };
  for (const f of fs.readdirSync(metaDir)) {
    if (!f.endsWith(".json") || f === "index.json") continue;
    try {
      const m = JSON.parse(fs.readFileSync(path.join(metaDir, f), "utf8"));
      // invalid (present-but-unknown) is its OWN bucket, never downgraded to
      // legacy-undeclared — a typo like "stakholder-ready" must not slip a
      // stakeholder deploy as a WARN while the conformance reviewer BLOCKs the
      // same tree (review of ab0e084; the wave-86 control-systems-disagree class).
      // allowlist form (mirrors doctor) — a bracket lookup walks the prototype
      // chain, so readiness: "toString" would throw instead of WARN at preview
      if (m.readiness === undefined) census.undeclared.push(m.id || f);
      else if (["shell", "content-ready", "stakeholder-ready"].includes(m.readiness)) census[m.readiness].push(m.id || f);
      else census.invalid.push(`${m.id || f} (${JSON.stringify(m.readiness)})`); // no single quotes here — this whole script is a single-quoted shell arg
    } catch { census.undeclared.push(f + " (unparseable)"); }
  }
  const say = (s) => process.stderr.write(s + "\n");
  say(`readiness census: ${Object.entries(census).map(([k, v]) => `${k}=${v.length}`).join(" ")}`);
  let block = false;
  if (census.shell.length) {
    if (intent === "stakeholder") { say(`BLOCK: stakeholder deploy with shell page(s): ${census.shell.join(", ")}`); block = true; }
    else say(`warn: shell page(s) will deploy (preview intent): ${census.shell.join(", ")}`);
  }
  if (census.invalid.length) {
    if (intent === "stakeholder") { say(`BLOCK: invalid readiness value(s) — fix the field: ${census.invalid.join(", ")}`); block = true; }
    else say(`warn: invalid readiness value(s): ${census.invalid.join(", ")}`);
  }
  if (intent === "stakeholder" && census["content-ready"].length) say(`warn: content-ready (not fact-checked) page(s): ${census["content-ready"].join(", ")}`);
  if (intent === "stakeholder" && census.undeclared.length) say(`warn: page(s) with no readiness field (legacy, pre-ADR-0010): ${census.undeclared.join(", ")}`);
  // chat access preconditions (stakeholder intent only)
  let access = "off";
  try { const idx = JSON.parse(fs.readFileSync(path.join(metaDir, "index.json"), "utf8")); access = (idx.chat && idx.chat.access) || "off"; } catch {}
  if (intent === "stakeholder" && access === "turnstile") { say("BLOCK: chat.access=turnstile — widget half ships in ADR-0010 d2; use open-capped (with spend cap attested) or off"); block = true; }
  if (intent === "stakeholder" && access === "open-capped") {
    let spec = ""; try { spec = fs.readFileSync(path.join(portalDir, "functions", "api", "chat.OWNER-SPEC.md"), "utf8"); } catch {}
    // strip the inline comment before judging — the template default line is
    // `spend_cap_attested: none    # set to <YYYY-MM-DD> …` and a greedy
    // capture read the comment as an attestation (review of ab0e084).
    const att = spec.match(/^spend_cap_attested:\s*(.+)$/m);
    const attVal = att ? att[1].split("#")[0].trim() : "";
    if (!attVal || attVal === "none") { say("BLOCK: chat.access=open-capped on a stakeholder deploy requires a spend-cap attestation — set the OpenRouter key credit limit, then record spend_cap_attested: <date> in functions/api/chat.OWNER-SPEC.md"); block = true; }
    else say(`chat: open-capped, spend cap attested ${attVal}`);
  }
  process.exit(block ? 1 : 0);
' "$PORTAL_DIR" "$INTENT" || { echo "error: readiness gate refused --intent=$INTENT deploy (see above)" >&2; exit 1; }

mkdir -p "$DOCS_OUT"

# Extract source:id pairs from the manifest. Skips entries without `source`
# (those are assumed to already exist at _docs/<id>.md).
ENTRIES=$(node -e '
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const tiers = (m.docs && m.docs.tiers) || [];
  for (const t of tiers) {
    for (const d of (t.docs || [])) {
      if (d.source && d.id) process.stdout.write(d.source + ":" + d.id + "\n");
    }
  }
' "$MANIFEST")

count=0
missing=0
if [ -n "$ENTRIES" ]; then
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    src="${entry%%:*}"
    id="${entry##*:}"
    if [ -f "$INITIATIVE_DIR/$src" ]; then
      cp -f "$INITIATIVE_DIR/$src" "$DOCS_OUT/$id.md"
      count=$((count + 1))
    else
      echo "warn: source not found: $src (id=$id, expected at $INITIATIVE_DIR/$src)" >&2
      missing=$((missing + 1))
    fi
  done <<< "$ENTRIES"
fi

echo "Synced $count doc(s) into $DOCS_OUT/ ($missing source(s) missing)"
ls -1 "$DOCS_OUT" 2>/dev/null || true
