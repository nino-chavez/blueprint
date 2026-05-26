---
canonical: true
---

# ADR-0003 — Portal docs sync becomes manifest-driven

**Date**: 2026-05-25
**Status**: Accepted
**Surfaced by**: blueprint-redesign consumer (amendment 1 in `METHODOLOGY-AMENDMENTS.md`); applies the same manifest-driven refactor wave 5 fix #6 applied to `functions/api/chat.js`.

## Context

The Pattern B docs viewer (`template/portal/docs/index.html`) fetches `/_docs/<id>.md` directly — no path-mapping layer between manifest entries and on-disk file locations. Consumer initiatives author their canonical strategic artifacts in repo-discipline-directory paths (`decisions/`, `research/`, `content/`) but Cloudflare Pages deploys only see the deploy root (typically `portal/`), so the docs viewer cannot reach the canonical paths at runtime.

The existing solution is `template/portal/scripts/prep-deploy.sh`, which copies sources into `portal/_docs/` before deploy. But the script ships with a hardcoded `SOURCES=` table pre-filled with Rally HQ paths:

```bash
declare -a SOURCES=(
  "research/synthesis.md:research-synthesis"
  "DESIGN-PRINCIPLES.md:design-principles"
  "docs/cx-strategy.md:cx-strategy"
  "docs/roadmap.md:roadmap"
  "docs/gaps.md:gaps"
  "docs/feasibility.md:feasibility"
)
```

Three problems:

1. **Same Rally HQ leak class as wave 5 fix #6.** Wave 5 refactored `functions/api/chat.js` from a hardcoded `DOCS = [['research-synthesis', ...]]` array to a manifest read of `docs.tiers[].docs[]`. `prep-deploy.sh` was missed in that pass and still ships with the same six Rally-HQ-specific paths.
2. **Two sources of truth.** Consumers maintain doc references in both `_meta/index.json` `docs.tiers[].docs[]` (for the viewer sidebar) AND `SOURCES` in `prep-deploy.sh` (for the deploy copy). The two drift; consumers add to one and forget the other.
3. **Discoverability.** The `source` of each doc (its canonical authoring path) is only declared in the deploy script, not the manifest. A reader of the manifest has no way to know where the rendered `_docs/<id>.md` came from.

The amendment from `wip/blueprint-redesign/METHODOLOGY-AMENDMENTS.md` ranked three options:

1. Build step (sync at deploy) — chosen
2. Manifest path mapping (viewer resolves source at fetch) — rejected (requires viewer JS edit; mixes runtime concerns with build concerns)
3. Author directly in `portal/_docs/` (drop canonical paths) — rejected (breaks the doc-discipline directory convention)

## Decision

Refactor `template/portal/scripts/prep-deploy.sh` to be **manifest-driven**, applying the same pattern wave 5 fix #6 applied to `chat.js`. Extend the `docs.tiers[].docs[]` schema in `_meta/index.json` with an optional `source` field:

```json
{
  "id": "01-prescription",
  "title": "Prescription",
  "source": "decisions/01-prescription.md"
}
```

| Field | Required | Behavior |
|---|---|---|
| `id` | yes | The slug — becomes `_docs/<id>.md` after sync and the URL fragment in the viewer. |
| `title` | yes | The human-readable label rendered in the sidebar. |
| `source` | no | Repo-relative path (resolved against the portal's parent directory). When present, `prep-deploy.sh` copies this path → `_docs/<id>.md`. When absent, the file is assumed to already exist at `_docs/<id>.md` (consumers can author there directly when no canonical path applies). |

`prep-deploy.sh` reads the manifest, flattens `docs.tiers[].docs[]` across all tiers, and copies each entry's `source` (when present) to `_docs/<id>.md`. Missing sources emit a warning to stderr but do not fail the build — consumers are free to declare docs that aren't yet authored.

## Rationale

1. **Single source of truth.** The manifest already declares what docs the viewer should expose. Adding `source` lets it ALSO declare where each doc is authored. The deploy script becomes a thin executor of the manifest, not a parallel registry.
2. **Mirrors wave 5 fix #6.** That refactor moved `chat.js`'s `DOCS` array from hardcoded Rally HQ paths to a manifest read. This applies the same pattern to `prep-deploy.sh`, completing the "build + runtime both read the manifest" symmetry.
3. **Backwards compatibility.** Entries without a `source` field are skipped by the sync step (file expected to exist directly in `_docs/`). Consumers using the legacy shape continue to work without change.
4. **Build-time, not runtime.** Option 2 (viewer resolves source at fetch) would mix runtime concerns into the viewer. Build-time sync keeps the viewer pure (canonical chrome that fetches `/_docs/<id>.md`, full stop) and isolates the deploy-time path-resolution to a script consumers can replace if their deploy story differs.

## Consequences

### Breaking

- Consumers currently relying on the hardcoded `SOURCES=` table in `prep-deploy.sh` will see ZERO docs sync until they migrate to the manifest schema. The migration: for each entry in the old `SOURCES` table, add the corresponding `source` field to the matching `docs.tiers[].docs[]` entry in `_meta/index.json`, then delete the `SOURCES` table from `prep-deploy.sh` (which the refactor already does in the template).
- The Rally HQ default paths are removed entirely. Consumers who never edited `prep-deploy.sh` were always going to ship a broken doc sync — this just surfaces the breakage instead of hiding it.

### Non-breaking

- The viewer (`docs/index.html`) is unchanged. It still fetches `/_docs/<id>.md`. The chrome-canonical reviewer continues to enforce zero drift.
- The `chat.js` Pages Function is unchanged. It already reads the manifest for context lookup.
- Consumers who author their docs directly in `portal/_docs/` (no canonical-path authoring) continue to work — they just omit the `source` field.

### Migration for in-flight consumers

For each in-flight Pattern B consumer (`rally-hq`, `website-nc-v3`, `bc-subscriptions`, `blueprint-redesign`):

```bash
# 1. Pull this methodology bump
git -C ~/Workspace/dev/wip/blueprint pull
node ~/Workspace/dev/wip/blueprint/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome --pattern=B --target=$(pwd)

# 2. Edit your _meta/index.json: add `source` field to each
#    docs.tiers[].docs[] entry pointing at its canonical authoring path

# 3. Re-run the sync to verify
./portal/scripts/prep-deploy.sh

# 4. Confirm portal/_docs/ contains the expected files
ls -1 portal/_docs/
```

Note: `prep-deploy.sh` is consumer-owned (not in `PATTERN_B_CHROME_FILES`) so consumers who customized their copy will need to merge the refactor manually OR overwrite with the template version if they hadn't customized.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Viewer resolves `source` at fetch time | Mixes build-time concerns (path resolution) into runtime chrome. Forces the viewer to know about repo layout. The chrome should fetch `/_docs/<id>.md` and that's it. |
| Author all docs directly in `portal/_docs/` | Breaks the canonical doc-discipline convention (`decisions/`, `research/`, `content/` directories) that Blueprint methodology requires for non-portal Stage 2 / Stage 4 artifacts. Would also force consumers to maintain two copies of any doc that needs editing — the canonical one and the portal one. |
| Add the 9 amendment-1-affected files to `PATTERN_B_CHROME_FILES` | Wrong tool. The chrome manifest is for files that should never drift from canonical. Consumer-authored markdown is intentionally consumer-owned. Manifest extension would block consumer edits. |
| jq-based parsing in the shell script | jq is not guaranteed in CI environments; node is (already required for `stamp.mjs`). Using `node -e` for the JSON parse is more portable. |

## Follow-ups

- **Audit other prep-deploy paths.** Each in-flight consumer's `prep-deploy.sh` may have project-specific customizations. The methodology promotes the refactor; consumers do the migration manually.
- **Pattern B initial-stamp.** Wave 6 fix 2 noted that Pattern B has no initial-stamp (only restamp-chrome). When that work lands, the stamper should write a `prep-deploy.sh` already pointing at the consumer's manifest, and a `_meta/index.json` with `source` field examples.
- **Consider lint check.** The `portal-pattern-b-conformance-reviewer` could gate that every `docs.tiers[].docs[]` entry either has a `source` that resolves OR has a corresponding file in `portal/_docs/`. Defer until a consumer ships a broken sync.
