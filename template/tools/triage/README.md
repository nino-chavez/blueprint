# Amendment triage — the UP-channel classifier

Completes the bidirectional update protocol's UP channel (ADR-0004 / ADR-0005,
build-order step 10): an amendment/RFC issue is filed via the form
(`.github/ISSUE_TEMPLATE/amendment-rfc.yml`), and this classifier labels it by the
**4-bucket taxonomy** so the operator can triage by `bucket:` + `kind:` at a
glance instead of reading every issue.

## Pieces

| File | What |
|---|---|
| `classify.mjs` | The classifier. Pure function `classifyIssue({title, body})` → `{bucket, kind, source, labels}` + a CLI mode that reads a GitHub issue event. Dependency-free, never throws, 13-assertion self-test (`node classify.mjs --self-test`). |
| `amendment-triage.yml` | The GitHub Action that runs `classify.mjs` and applies the labels. **Dormant** — parked here, NOT under `.github/workflows/`. |

## How it classifies

1. **Declared (primary).** The issue form collects `bucket` + `kind` as dropdowns.
   GitHub renders them as `### <label>` sections; the classifier reads the
   operator's choice directly — not a guess. `source: 'declared'`.
2. **Heuristic (fallback).** A free-form issue with no form fields gets a keyword
   inference (reviewer → methodology → template → else consumer-local) and a
   `triage:needs-human` label, because a guess must be confirmed. `source: 'heuristic'`.

## Labels applied

- `amendment` (the form already sets this; the workflow keys on it)
- `bucket:consumer-local` | `bucket:template` | `bucket:reviewer` | `bucket:methodology`
- `kind:rfc` + `needs-rfc` (substantial) — or — `kind:bug-fix` + `pr-ok`
- `stays-in-consumer` when the bucket is `consumer-local` (do not promote upstream)
- `triage:needs-human` when the bucket was inferred, not declared

It **labels only** — never merges, closes, or edits issue content.

## Activate it (operator choice — adds CI automation)

It is dormant by design so installing the methodology adds no surprise automation.
To turn it on for a repo:

```bash
# from the repo root
mkdir -p .github/workflows
cp tools/triage/amendment-triage.yml .github/workflows/amendment-triage.yml
# ensure tools/triage/classify.mjs is present at that path (adjust the path in
# the workflow if you vendored the methodology tools elsewhere)
git add .github/workflows/amendment-triage.yml tools/triage/classify.mjs
git commit -m "ci: activate amendment triage"
```

The Action needs the default `GITHUB_TOKEN` with `issues: write` (declared in the
workflow). No secrets, no external services (scope ceiling A).
