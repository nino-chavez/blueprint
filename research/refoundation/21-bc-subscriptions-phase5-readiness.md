---
canonical: false
status: phase-5-live-migration-not-earned-read-only-shadow-valid
date: 2026-07-23
depends_on:
  - research/refoundation/12-consumer-shadow-results.md
  - research/refoundation/20-film-room-method-validation.md
consumer_changed: false
template_changed: false
---

# BC Subscriptions Phase 5 readiness

## Verdict

BC Subscriptions is not ready for an authoritative native-contract migration.
Its read-only compact shadow remains valid and useful, but both governing
checkpoints are unresolved:

- current behavior evidence is `contradicted`; and
- handoff acceptance is `open`.

No BC file, branch, worktree, register, scenario result, or receiving-team
record changed during this audit.

## Exact observed boundary

- checkout: `/Users/nino/Workspace/dev/wip/bc-subscriptions`;
- branch: `dev`, aligned with `origin/dev`;
- HEAD: `df7fe076cb8f62343b58d6f2411be72d443f7e8a`;
- dirty boundary: four pre-existing untracked documents;
- shadow source identity:
  `df7fe076cb8f62343b58d6f2411be72d443f7e8a+dirty-a60938cfdc2d`; and
- native source: the 44-nonblank-line research compact contract at
  `research/refoundation/v2-shadow/compact/bc-subscriptions.yml`.

The refreshed generated report is
`research/refoundation/v2-shadow/generated/consumers/bc-subscriptions-phase5-readiness.shadow-report.md`.
It is K1-valid with zero errors and warnings.

## Current derived state

| Claim | State | Boundary |
|---|---|---|
| implementation register current | stale | `_state.json` records `aca809f7`, not current `df7fe076` plus its dirty fingerprint |
| behavior register current | stale | the behavior subset comes from the same stale state artifact |
| normalized scenario results present | contradicted | `docs/audits/derived/_scenario-results.json` is absent |
| handoff corpus present | satisfied | all four declared corpus artifacts resolve |
| receiving team accepts handoff | open | no compatible receiving-team encounter exists |

The state register contains 685 rows—590 `COMPLIANT`, 83 `MANUAL_REVIEW`, 9
`PARTIAL`, 2 `BLOCKED-EXTERNAL`, and 1 `NON-COMPLIANT`. Its 205 behavior-gate
rows contain 203 `COMPLIANT` and 2 `MANUAL_REVIEW`. Those counts remain useful
historical observations but cannot support current claims because the source
version is incompatible.

## Capability exists; evidence does not

BC already contains the required machinery:

- `tools/state-derive/` can regenerate the G3 presence register;
- `tools/scenario-results/` can normalize Vitest and Playwright result JSON into
  the G4 scenario artifact;
- `scenario_passes` treats absent, stale, skipped, or missing runs as unknown
  rather than compliant; and
- the handoff corpus separates artifact presence from receiving-team use.

The missing result is therefore not evidence that BC lacks implementation. It
is evidence that an authoritative migration would otherwise begin by blessing
stale and absent oracles—the exact failure class the refoundation exists to
prevent.

## Cross-consumer comparison

| Consumer | What the kernel caught | What it did not solve |
|---|---|---|
| Fleet Observability | report arrival and report use are different claims | the initial contract discovered that distinction only after the first operation encounter |
| Film Room | package, native window, founder operation, signing, and second-operator value cannot prove one another | the founder journey remained too coarse and consumed repeated operator encounters before a separate holistic UX plan |
| BC Subscriptions | presence counts, scenario-backed behavior, current freshness, corpus presence, and receiver acceptance remain separate | the kernel does not generate current scenario evidence or create receiving-team authority |
| cold-author exercise | a context-cold author can create a valid small contract without creator intervention | a sealed 55-line exercise does not establish longitudinal readability or live claim-design quality |
| Film Room blind A/B | native semantics preserve current steering quality and make scope/authority more explicit | the three-point lead was below the preregistered superiority threshold |

Across all three live/read-only consumer shapes, the strongest validated
property is **truthful refusal**. Blueprint reliably says what has not been
proven. The weakest property is **prospective work selection**. The compiler
cannot make an underspecified claim graph insightful, and no validated recipe
yet determines when to decompose, rerun, audit holistically, or stop.

## Preconditions for a future live Phase 5

Before requesting live-write authorization:

1. choose an exact clean or explicitly fingerprinted BC source boundary;
2. regenerate `_state.json` against that boundary without hand editing it;
3. run the declared scenario suites and produce
   `_scenario-results.json` through `tools/scenario-results/`;
4. verify source-version compatibility for both artifacts;
5. name the receiving team and the actor with authority to accept the transfer;
6. define the receiving encounter and what constitutes orientation, next owned
   action, and acceptance;
7. use an active/historical projection so the native contract does not repeat
   Film Room's longitudinal growth problem;
8. declare an operator-touch budget and keep machine-rederivable evidence out
   of the human encounter;
9. rehearse rollback with no application, derived-state, handoff, or CI
   mutation; and
10. obtain explicit Phase 5 authorization or an explicit waiver of the
    deferred Film Room sequence gate.

## Phase and distribution consequence

Phase 5 may continue only as a read-only counterfactual/readiness exercise.
The authoritative consumer write is not earned. Phase 6 public experimental
distribution is likewise not earned: BC currently supplies strong negative
control evidence, not a third completed migration or proof that Blueprint's
steering recipes are usable.

## Verification

- refreshed compact shadow: K1 valid, zero errors and warnings;
- derived checkpoints: behavior evidence `contradicted`, handoff acceptance
  `open`;
- BC HEAD before and after: exact `df7fe076`;
- BC tracked and untracked status before and after: unchanged;
- Blueprint K1 suite: 18/18 expected verdicts;
- compact compiler hardening: pass;
- Blueprint core/stamp smoke: pass; and
- `git diff --check`: pass.
