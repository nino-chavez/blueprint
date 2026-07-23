# Fleet native-pilot packet

This directory preserves the preparation and result of the first live consumer
pilot. The proposed files were applied to an isolated Fleet worktree and first
committed on `codex/blueprint-v2-pilot` at `609edb8`. The first operation
encounter then refined the contract and committed two native receipts at
`7274d30`; Fleet `main` remains unchanged at `2989aa4`.

Read-only resolution on 2026-07-22 found the local Fleet checkout clean on
`main`, aligned with `origin/main` at `2989aa4`. It has a stamped `blueprint.yml`, no
`actor-output.yml`, no methodology pin, and no entry in the current Blueprint
consumer registry. The live Worker has a daily cron and an authenticated report
surface.

The migration copied:

- `proposed-blueprint-native.yml` to consumer root `blueprint-native.yml`; and
- `proposed-decision-0005.md` to `decisions/0005-native-blueprint-pilot.md`.

It changed no production code or legacy configuration. The
decision records the one-writable-truth boundary, current doctor discrepancy,
receipt ceiling, verification commands, and rollback.

The follow-up added `decisions/0006-separate-report-arrival-from-use.md` and
refined `blueprint-native.yml` after the operator confirmed receiving the
report without reading it. Arrival and use are now separate claims instead of a
single checkpoint becoming green from delivery alone.

Post-commit verification passed:

- compact compiler: valid, 66 nonblank lines;
- K1 shadow: valid, zero kernel errors;
- implementation checkpoint: `satisfied`;
- legacy doctor checkpoint: `contradicted`, retained by decision;
- scheduled-report arrival: `satisfied`;
- scheduled-report use: `contradicted`, because the operator did not read it;
- solo-operation checkpoint: `contradicted`;
- portal build: pass;
- Astro typecheck: zero errors, two pre-existing hints; and
- rollback surface: exactly three pilot files, with all application and legacy
  configuration paths byte-identical to `main`.

## Gates before applying

1. Independent cold author scores `PASS` with zero methodology-creator
   intervention. **Passed:** 34/34, two attempts, zero questions.
2. Operator authorizes an isolated `codex/blueprint-v2-pilot` worktree/branch
   and writes to the Fleet repository. **Passed and committed at `609edb8`.**
3. Fleet remains clean and at the inspected commit, or the shadow is refreshed
   against its new head. **Passed; both checkouts clean.**
4. The operator supplies an actual scheduled-delivery observation or accepts an
   honest `open`, `unobservable`, or `contradicted` operation checkpoint.
   **Passed at `7274d30`:** arrival is satisfied, use is contradicted, and the
   combined checkpoint remains contradicted.
5. Blueprint's dirty `consumers.yml` is reconciled without overwriting its
   existing Film Room/subscriptions edits. **Fleet registered as an unpinned
   local native pilot.**

The research copy is not consumer authority and is not a receipt. The committed
Fleet branch owns the live pilot contract and native receipts. A future actual
use encounter is still an operator evidence step, not an implementation task.
