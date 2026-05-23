---
canonical: true
---

# `docs/inputs/` — provenance manifest

The **objective axis** of the trust-restoration surface — every external input that informed this project, with `included_why` for what was used and `excluded_why` for what was deliberately not used. Companion to [`../iterations/`](../iterations/) (the non-objective axis — what we tried and rejected) and [`../decisions/`](../decisions/) (the affirmative decisions themselves).

## Why this exists

Traditional due diligence reflexes can flag AI-compressed timelines as suspicious ("did you really write 62 ADRs in 16 days?"). The defense is exhaustive provenance:

- Every input cataloged with `included_why` (selection rationale)
- Every gap acknowledged with `excluded_why` (deliberate exclusion rationale)
- Each entry linking to the ADRs / specs / epics it `influenced`

The archaeology substrate's `inputs.py` ingester reads `_manifest.yaml` directly and emits one event per entry, making provenance queryable: `/derive?question=what+inputs+informed+<feature>` returns citation-bound answers.

## Files

- **`_manifest.yaml`** — the canonical entries (hand-edited)
- **`_manifest.schema.json`** — JSON Schema validating the manifest shape
- **`README.md`** — this file (regenerate from `_manifest.yaml` via `tools/inputs-derive/` if you adopt that tool)

## Adding a real entry

```yaml
- id: <stable-slug>
  category: competitive  # or licensed-source / bc-internal / merchant-interview / external-standard / analyst-report / conversation
  title: <human-readable title>
  source: <URL or vendor name>
  acquired: '2026-05-22'  # ISO date
  local_path: docs/audits/<filename>.md  # null if external-only
  influenced:
    - PRD§16
    - ADR-NNNN
    - epic-04
    - synthesis-N
    - hive-N
  included_why: >-
    Why this input was selected — what gap it filled or what perspective it gave.
```

## Adding a gap entry

When a reasonable expectation is *deliberately not* included:

```yaml
- id: gap-<stable-slug>
  category: analyst-report  # or whatever category the missing input would belong to
  title: 'GAP: <human-readable summary>'
  excluded_why: >-
    Why this input is NOT present despite being a reasonable expectation.
```

## Validation

If you have `ajv-cli` installed:

```bash
ajv validate -s docs/inputs/_manifest.schema.json -d docs/inputs/_manifest.yaml
```

The archaeology substrate's GH Action (`.github/workflows/archaeology-tail-docs.yml`) re-ingests on every push that touches this file, so the substrate stays current automatically.
