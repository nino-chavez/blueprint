---
canonical: true
---

# `docs/audits/` — audit corpus

Categorized audit documents — competitive comparisons, runtime inventories, coverage matrices, drift sweeps. The archaeology substrate's `audits.py` ingester treats every markdown file here as one `audit_filed` event, with category inferred from filename and/or directory placement.

## Categories

Recommended subdirectory layout (the ingester also accepts a flat layout with category inferred from filename keywords):

```
docs/audits/
├── competitive/      # factsheets, head-to-head comparisons, market sweeps
├── runtime/          # inventories of what's actually shipping (surfaces, components, configs)
├── coverage/         # spec×implementation coverage matrices, fidelity gap analyses
└── sweeps/           # drift sweeps, triage runs, alignment reports
```

If you keep audits flat in `docs/audits/`, the ingester's filename heuristic still works — see `tools/archaeology/ingesters/audits.py::CATEGORY_HEURISTICS` for the patterns. Either layout is fine; subdirectories take precedence over filename inference when both apply.

## Filename convention

Date-prefix the filename so the ingester can extract `source_ts` without parsing frontmatter:

```
YYYY-MM-DD-<short-slug>.md      e.g. 2026-05-22-competitor-x-factsheet.md
```

Underscore-prefixed files (`_TEMPLATE.md`, `_proposal-sweep-2026-05-18.json`) are excluded from ingestion.

## Refs to include in audit bodies

The ingester extracts the following inline refs by regex over the body:

- `ADR-NNNN` → `mentions adr:ADR-NNNN`
- `Hive #N` → `mentions hive:proposal#N`
- `Synthesis #N` or `synthesis #N` → `mentions hive:synthesis#N`
- `PR #N` → `mentions github:pr#N`
- `#NNNN` (bare issue number) → `mentions github:issue#N`
- `` memory entry `<slug>` `` → `mentions memory:<slug>`

Including these explicitly in audit bodies makes the substrate's ref-graph rich enough that `/timeline?subject=adr:ADR-NNNN` surfaces every audit that touches that ADR.

## Large bodies

Audit files larger than 4 KB get their full body stored in R2 (via `blob_content` on the event); the D1 row keeps a 4 KB excerpt for fast scan. The full body remains queryable via the substrate's R2 bucket; the design doc §4 has details.
