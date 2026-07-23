---
canonical: false
status: live-pilot-arrival-satisfied-use-contradicted
date: 2026-07-22
depends_on:
  - research/refoundation/16-root-dogfood-and-pilot-readiness.md
consumer_changed: true
consumer_branch: codex/blueprint-v2-pilot
consumer_commit: 7274d30
template_changed: false
---

# Fleet live-pilot results

## Verdict

Fleet Observability is the first committed Blueprint native-contract pilot. It
passes the migration's structural, isolation, compiler, kernel, build,
typecheck, doctor-disposition, and rollback gates. Its first operation encounter
establishes that the scheduled report arrived and that the operator did not read
or use it. Arrival is therefore `satisfied`, use is `contradicted`, and the
combined operation checkpoint is `contradicted`.

This is the intended distinction between migrating the control contract and
claiming product success. The live encounter also exposed an incomplete claim:
arrival alone did not cover the charter's requirement that the report be used.

## Applied change

An isolated worktree created branch `codex/blueprint-v2-pilot` from clean Fleet
`main` at `2989aa4`. Commit `609edb8` adds exactly:

- `blueprint-native.yml`; and
- `decisions/0005-native-blueprint-pilot.md`.

The native contract is authoritative for charter, claims, receipts,
checkpoints, and modules on the pilot branch. Legacy `blueprint.yml` is frozen
as compatibility and portal configuration. No application source, schedule,
deployment, secret, D1 schema, package manifest, lockfile, portal file, or
legacy Blueprint configuration changed.

Follow-up commit `7274d30` adds Decision 0006 and refines only the native
contract. It separates report arrival from report use and appends the operator's
two claim-scoped receipts. Production application and legacy configuration
remain unchanged.

## Derived state after commit

| Checkpoint | State | Why |
|---|---|---|
| `implementation-boundary-present` | satisfied | both incident records and all four declared implementation artifacts exist at commit `7274d30` |
| `legacy-doctor-view` | contradicted | doctor still reports two failures and two warnings; Decision 0005 retains and scopes them |
| `solo-operation-observed` | contradicted | report arrival is supported, but the operator confirmed that the report was not read or used |

The normalized K1 record is valid with zero errors. Separation of these
checkpoints prevents the legacy portal/scanner failures from becoming evidence
about scheduled operation while refusing to hide either condition. The
underlying arrival claim is `satisfied`; the dependent use claim is
`contradicted`.

## Independent author prerequisite

Before the consumer write, a context-isolated author passed the sealed compact
exercise 34/34 in two attempts, with 55 authored nonblank lines, zero questions,
and zero methodology-creator interventions. This clears the principal stop
condition in the migration plan: ordinary compact authoring did not require the
methodology creator to repair the file.

## Consumer verification

- compact compilation: pass;
- K1 shadow: pass;
- portal production build: pass, 14 pages;
- Astro typecheck: pass, zero errors and two existing unused-symbol hints;
- npm install audit observation: six dependency findings (one low, five high),
  not introduced or changed by the pilot; incidental lockfile rewrite restored;
- branch status after follow-up commit: clean; and
- original `main` checkout: clean and still aligned with `origin/main`.

## Rollback rehearsal

Before the first commit, the worktree differed from `main` only by the two pilot files.
Tracked application/configuration paths compared byte-identical. After commit,
the branch still has no diff from `main` outside `blueprint-native.yml` and the
two pilot decisions.

Semantic rollback is an append-only decision that marks the native source
dormant and restores legacy authoring authority. Because the pilot touched no
runtime file, application rollback is unnecessary. Git branch removal remains
an additional mechanical escape hatch, but it must not be used to pretend the
pilot or its future receipts never existed.

## First operation evidence

Authorization, code presence, cron configuration, a successful build, and a
tool log did not prove that the intrinsic operator received and used the daily
report. The authenticated encounter established a sharper result:

- `scheduled-health-report-arrives`: `satisfied` from the operator's receipt;
- `scheduled-health-report-used`: `contradicted` from the operator's statement
  that the report was not read; and
- `solo-operation-observed`: `contradicted` because it requires both.

This is not a product implementation failure. It is evidence that delivery has
not yet changed operator behavior, and that the initial native contract was too
coarse to express the difference.

The first post-pilot observation attempt is recorded in
`fleet-pilot/operation-observation-attempt-2026-07-22.md`. Both available local
browser sessions first reached the report's sign-in boundary after the daily
window. The operator then authenticated and supplied the arrival/non-use
statement. Decision 0006 and both receipts are committed at `7274d30`.
