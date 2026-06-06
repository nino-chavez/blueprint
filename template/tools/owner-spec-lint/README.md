# `tools/owner-spec-lint`

Enforces the OWNER-SPEC convention defined at [`docs/methodology/owner-spec-convention.md`](../../docs/methodology/owner-spec-convention.md).

## What it does

Two distinct checks:

### `coupling.ts` — per-PR warning

Runs in CI on every PR. Reads the diff between BASE_SHA and HEAD_SHA. For each OWNER-SPEC, checks whether the PR touched any watched path (the tool dir + the `couples_with` entries) WITHOUT also touching the OWNER-SPEC itself.

Emits GitHub Actions `::warning` annotations. **Not blocking** — small fixes (typo, test add) shouldn't require OWNER-SPEC churn. The warning surfaces the question; operator decides per-case.

### `staleness.ts` — nightly report

Runs nightly (or on-demand). Walks every OWNER-SPEC.md under `tools/` and `apps/`. Emits findings into `docs/audits/derived/_owner-spec-staleness.{json,md}`:

- **Age + churn**: `last_attested + max_unattested_days < now()` AND the tool dir has commits since `last_attested`
- **Coupling drift**: any `couples_with` path has been modified since `last_attested`

The report surfaces on the status page under `/derive` alongside other derived health signals.

## Usage

```sh
# Per-PR coupling check
BASE_SHA=$(git merge-base origin/main HEAD) HEAD_SHA=HEAD npx tsx tools/owner-spec-lint/coupling.ts

# Nightly staleness report
npx tsx tools/owner-spec-lint/staleness.ts
```

## CI integration

- Coupling check: wired into `.github/workflows/owner-spec-lint.yml` (per-PR, non-blocking)
- Staleness report: wired into `.github/workflows/owner-spec-staleness-nightly.yml` (scheduled + on-demand)

## OWNER-SPEC frontmatter contract

```yaml
---
tool: <tool-name>                 # canonical identifier
last_attested: 2026-05-23         # YYYY-MM-DD; bump when re-attesting
max_unattested_days: 90           # how long until staleness fires
couples_with:                     # paths that may invalidate this spec
  - docs/decisions/0030-bigeng-pattern-alignment.md
  - tools/<sibling>/
convention_version: 1             # version of the convention this OWNER-SPEC follows
output_schema_hash: <hex>         # optional; computed from tool output JSON
---
```

See the canary at [`tools/archaeology/OWNER-SPEC.md`](../archaeology/OWNER-SPEC.md) for a worked example.

## Why this exists

Stale OWNER-SPECs are worse than no OWNER-SPECs — they confidently mislead future sessions. The lint catches drift mechanically so the operator (or a skill-mediated agent) can re-attest. Without this enforcement layer, OWNER-SPECs become the same kind of dead doc they're meant to replace.

## Pattern

Mirrors the human-attestation substrate (Hive #1269) — manual flip of `last_attested`, machine-tracked freshness, periodic re-attestation. Same lifecycle pattern, applied to substrate-tool expert knowledge instead of compliance attestations.
