# jira-confluence-export

Spike tooling for **Hive #685** — retro-generate a populated Jira + Confluence
from the blueprint-example substrate, at high enough fidelity that an external
eng / business / QA / due-diligence audience experiences it as a real project.

Status: **walking-skeleton slice.** Proves the full extract → emit → import
round-trip on a minimal slice (1 Epic + 1 Story + 1 page). Scaling to the full
67-epic / 623-issue substrate is a follow-on once the skeleton is verified live.

Companion analysis: [`docs/methodology/2026-05-14-jira-confluence-handoff-readiness.md`](../../docs/methodology/2026-05-14-jira-confluence-handoff-readiness.md).

## The honest-path decision (2026-06-01)

Backdating — landing the real Jan–Jun build chronology into Jira's `created`
metadata so it looks "used from the start" — was **deferred**. Reasons:

1. **No clean automation.** Backdating requires the Jira *External System Import*
   (JSON/CSV) and Confluence *space XML import* — both **admin-UI wizards with no
   REST API**. Headless automation isn't possible; you'd browser-drive the wizard.
2. **Detectable + integrity risk.** The import event itself is logged with the
   real date; 623 issues entering on one day is a tell. For the audience that
   most wants timeline evidence (M&A / compliance), backdated synthetic records
   read as *fabricated history* — worse than an honest "imported today."

**What we do instead (honest path):** preserve the real chronology as **visible
content** — a `## Build timeline` section + a `Source:` provenance line in every
issue/page — while everything imports stamped "now". This keeps the chronology
truthful *as data*, enables trivial headless REST automation, and carries zero
misrepresentation. The exporter still extracts the real dates (from `git log` /
GH `createdAt`); they just land in the body, not in metadata.

The backdate path is not deleted — `export.py --emit jira-import-json` is reserved
and errors with a pointer here. Revisit only for a pure methodology *demo*
audience (where nobody is deceived).

## Mapping (substrate → Jira / Confluence)

| Substrate artifact | Jira | Confluence |
|---|---|---|
| `[Epic-N]` GH issue | Epic | — |
| BRD `US-N.M` (+ AC/UX/data-contract) | Story | — |
| Hive task | Sub-task | — |
| `hive-meta.surface` | Component | — |
| `hive-meta.estimate` (Effort) | Story Points | — |
| Priority `P0..Backlog` | Priority | — |
| ADR (`docs/decisions/`) | — | Decisions space |
| Methodology (`docs/methodology/`) | — | Methodology space |
| Dossier (`docs/handoffs/`) | issue description | Handoffs space |
| Audit (`docs/audits/`) | — | Audits space |
| **Attestation (`docs/attestations/`)** † | Attestation issue type | Compliance space |
| **Runbook (`docs/runbooks/`)** † | — | Operations space |

† New corpora since the original spec (2026-05-14). The attestations corpus (42
files) is exactly what an M&A/QA/compliance audience wants — high value to map.

## Usage

```bash
# 1. Extract Epic-1 sample -> _out/*.json  (instance-agnostic intermediate model)
python3 export.py                      # Epic-1 (GH #30) + US-1.1..1.7 + relevant ADRs

# 2. Dry-run the import (DEFAULT — sends nothing, prints the REST plan)
python3 importer.py --skeleton         # 1 Epic + 1 Story + 1 page
python3 importer.py                     # full export, still dry-run

# 3. Live import — requires a free sandbox you admin (NOT corporate prod)
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="…"          # id.atlassian.com/manage-profile/security/api-tokens
python3 importer.py --skeleton --execute \
    --site https://your-sandbox.atlassian.net \
    --project-key SUBS --space-id 12345
```

The importer **refuses** any site matching the configured production-host guard so synthetic data can't
leak into corporate prod.

## What the operator must provide for the live round-trip

The skeleton is proven in dry-run; the live leg needs (operator-only):

1. A **free Atlassian Cloud site** where you are admin.
2. A **Jira project** (team-managed; the Story→Epic `parent` link assumes team-managed)
   — pass its key as `--project-key`.
3. A **Confluence space** — pass its numeric id as `--space-id`.
4. An **API token** in `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN`.

Then `--skeleton --execute` creates 1 Epic + 1 Story + 1 page and prints the
created keys to read back.

## Known refinements (post-skeleton)

- Strip the leading H1 from Confluence bodies (it duplicates the page title).
- Join `docs/audits/derived/_state.json` for real Story done-state (today the
  status hint is coarse-mapped from BRD phase, informational only).
- Inline Markdown (bold/links/code spans) is passed through literally in ADF —
  fine for a spike, would want a proper inline parser for full fidelity.
- Company-managed Jira projects need the Epic Link custom field instead of `parent`.
- Sub-tasks (Hive tasks) and issue-links (synthesis chains) not yet emitted.

## Full-SDLC scope

This tool started as Jira+Confluence (#685) and now covers more of the idea→launch
chain. See [`docs/methodology/sdlc-atlassian-coverage.md`](../../docs/methodology/sdlc-atlassian-coverage.md)
for the full product mapping and the BigEng test-management finding (Xray is the org standard).

| Emitter | Output | Live-proven |
|---|---|---|
| `export.py` → Jira | Epic + Stories + dependency links (REST v3) | ✅ KAN-1/KAN-2 + issueLink 201 |
| `export.py` → Confluence | ADR/methodology pages (REST v2 storage) | ✅ page 524290 |
| `xray_csv.py` | Xray Test Case Importer CSV — Manual (from AC) + Cucumber (from `.feature`) | dry-run (UI-wizard path) |
| `xray_graphql.py` | **Headless** Xray test creation via Xray Cloud GraphQL `createTest` + AC-coverage links | dry-run (needs Xray API key) |
| `compass.py` | Compass components + 10-gate DoD scorecard + per-epic results ⚠️ Compass→DX Fabric, EOL 2026-12-31 — retarget DX for green-field | dry-run (needs Compass) |

```bash
python3 export.py        # Jira + Confluence intermediate model
python3 xray_csv.py      # -> _out/xray-tests.csv  (Testing Board → Test Case Importer)
python3 compass.py       # -> _out/compass.json    (Compass GraphQL)
```

## Files

- `export.py` — substrate → intermediate model → `_out/{jira-issues,confluence-pages}.json`; Jira/Confluence REST import lives in `importer.py`
- `importer.py` — intermediate model → Jira REST v3 (issues + links) / Confluence REST v2 (dry-run default)
- `xray_csv.py` — test-management leg: Xray Test Case Importer CSV (BigEng convention)
- `compass.py` — verify/operate leg: Compass component + scorecard payloads
- `_out/` — generated payloads (gitignored)
