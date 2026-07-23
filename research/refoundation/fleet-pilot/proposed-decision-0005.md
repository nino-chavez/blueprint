# Decision 0005 — run the first Blueprint native-contract pilot

Status: accepted 2026-07-22 after the independent cold-author gate passed and
the operator authorized an isolated consumer worktree.

## Context

Fleet Observability is a clean, single-operator consumer whose product boundary
is narrower than Blueprint's current universal workflow. The current
`blueprint.yml` remains useful configuration for the stamped portal and legacy
stage tools, but it does not encode the exact scheduled-operation claim or its
receipt contract.

The pre-pilot read-only shadow at commit `2989aa4` derived:

- incident evidence artifacts: `satisfied`;
- implementation artifacts: `satisfied`;
- scheduled report received by the operator: `open` (no receipt);
- current Blueprint doctor boundary: `contradicted` (two failures, two
  warnings); and
- K1 record validity: valid.

## Decision

Add `blueprint-native.yml` using research schema `blueprint-compact/0` and
profile set `k1-research-0`. For the pilot, that file is authoritative for the
initiative charter, exact claims, native receipts, checkpoints, and modules.

Keep `blueprint.yml` as frozen compatibility/configuration input for existing
portal and stage tooling. Do not author initiative progress or evidence in both
files. A legacy tool reading `blueprint.yml` is a compatibility view, not the
native claim ledger.

The operator explicitly holds `correct-receipt` authority. This is not implied
by work, observation, or general disposition authority; it is granted here so
an erroneous receipt can be corrected append-only during the pilot.

The pilot intentionally separates three checkpoints:

1. implementation artifacts are present;
2. the legacy doctor view has no failing result; and
3. scheduled operation has actually been observed by the operator.

This prevents inherited portal/scanner conformance from laundering or blocking
the product's operation claim while keeping the discrepancy visible.

## Doctor discrepancy disposition

The current doctor findings remain evidence and are not rewritten green:

- `portal-conformance` fails because the unused stamped initiative portal still
  contains 12 `REPLACE_FOR_PROJECT` markers. The product's live operator
  surface is the authenticated Worker report, not this scaffold. Keep the
  `legacy-doctor-view` checkpoint contradicted until the portal is removed,
  populated, or explicitly re-scoped in a separate product decision.
- `terminology` fails on the same scaffold plus developer-facing PRD/research
  terminology. Do not mass-rewrite technical records as a migration side
  effect. Re-run under an explicit reader contract before deciding which
  findings have the correct jurisdiction.
- `reader-encounter` warns because wave 96's `reader-contract.json` did not exist
  when this consumer was stamped. This is a compatibility gap, not evidence of
  scheduled operation.
- `lint-jurisdiction` warns that one UI preview HTML file is uncovered. Retain
  the warning and address it only in a scanner-coverage change.

## Receipt rule

Do not add a support receipt until the intrinsic operator actually observed a
scheduled report in the declared daily window on the exact recorded source
version. A tool log proving cron execution is not equivalent to operator
receipt. If the run could not be observed, record `could-not-observe`; if it ran
and did not arrive, record `contradicts`.

Receipts are append-only. A mistaken receipt remains in history and can be
excluded from current evaluation only by an actor with `correct-receipt`
authority through an explicit correction disposition.

## Verification

Evaluate from the Blueprint methodology checkout without copying generated
state into this repository:

```sh
node research/refoundation/v2-shadow/compile-compact.mjs \
  --source=/absolute/path/to/fleet-observability/blueprint-native.yml \
  --output=research/refoundation/v2-shadow/generated/compact-overlays/fleet-live.json
node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/generated/compact-overlays/fleet-live.json \
  --root=/absolute/path/to/fleet-observability \
  --output-label=fleet-live
```

The consumer checkout receives no generated normalized JSON or report.

## Rollback

Rollback is a new decision that marks `blueprint-native.yml` dormant and
returns charter/claim authoring authority to the legacy contract. Keep the
native source and receipts in git history; do not delete or translate evidence
to manufacture continuity. No production application file, deployment, D1
schema, secret, schedule, or portal configuration changes in this pilot, so
application rollback is unnecessary.
