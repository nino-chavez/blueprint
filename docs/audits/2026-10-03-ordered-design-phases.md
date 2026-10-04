# Ordered phases prepare the stage engine for application-definition checks

Verification record: implemented, locally tested, and independently code-reviewed
on October 3, 2026, before source publication. The user subsequently authorized
push and merge. This record does not establish an npm release or consumer acceptance.

The stage engine needs to stop within a numbered design stage. A project must be
able to finish the definition phase while selection and freeze remain ahead.
An optional ordered `phases` array supplies those stops. Existing stage numbers
and models remain intact.

```text
Stage 2: Design
  definition  — check the application before concepts
  selection   — record the chosen direction
  freeze      — check the reconciled definition
Stage 3: Validation
```

These names illustrate the accepted application-definition direction. This slice
adds generic phase mechanics only. It does not install that example model or
claim to verify a human decision.

## Keep phase order separate from stage numbers

| Candidate | Test against existing models and the accepted design sequence | Decision |
|---|---|---|
| Add fractional or replacement stage numbers | Breaks numbered-stage identity or overloads numeric comparisons; cannot preserve the existing stage contract. | Reject. |
| Add only exit gates to the existing design stage | Preserves numbers but cannot stop concept work before selection and freeze are available. | Reject. |
| Add ordered phases beneath an unchanged stage | Exposes the internal stops and preserves numbered stages and phase-free models. | Select. |

Retain the existing gate/checker/reviewer machinery from the exit-gate option.
Retain explicit sequential traversal from a flat stage list, using declared array
positions rather than comparing phase names or decimal numbers. Do not retain
renumbering or an exit-only check.

Stage-level gates are prerequisites for that stage's phases. A phase uses the
same gate and reviewer shape as an ordinary stage. Gate IDs must be unique across
a phase-bearing model, so assertions and review records cannot refer to two
checks. A separate `phaseCursor` records progress within the numbered stage.
Recording a phase means its configured checks passed; it is not authenticated
product approval.

## Existing data must remain usable

A model without phases keeps its current derive and advance behavior. An older
saved numeric cursor does not count as completed phases when a project opts in.
The engine checks current evidence and phase order before recording each step.
Changed earlier evidence must block the next transition while preserving the
historical record. A malformed explicitly selected model must report an error;
falling back to greenfield would hide the intended gate.

An independent comparison used the original engine at `1091bbc` and the changed
engine on identical inputs. All existing status and dry-run advance fields
matched across all four variants in both root and nested layouts. Three legacy
custom forms also matched: an empty stage list, omitted stage gates, and a
non-slug gate ID. Additive phase fields were excluded from that comparison.
This is fixture-based compatibility evidence, not proof for every consumer.

Explicitly selected malformed models now refuse instead of falling back. The
CLI also refuses corrupt saved state instead of warning and continuing. New
assertions sent directly to `recordAdvance` must name non-derivable gates and
carry nonempty evidence strings, matching the CLI's validation. In phase-bearing
models, saved assertions must also have valid evidence and cannot target future
phases. Old records with such assertions need explicit reconciliation before
opting in. These are intentional safety changes; valid phase-free records keep
their prior interpretation.

## Live pilot enforcement still has prerequisites

RFC #65 accepts the direction. The earlier source-document trial recommends one
whole-application case and one bounded comparison. That trial is closed and is
not being repeated here. This slice prepares the shared engine independently of
live pilot activation.

Before activating application-definition enforcement, bind the accountable
reviewer and trusted human-decision source for the chosen pilot. Implement the
owned manifest checker, source-bound substantive review, and authority adapter.
Then connect them to producing-work preflight and prove the real pilot and
bounded-refit cases. The source inspector remains non-authorizing.

The root/nested best-result lookup remains the generic artifact behavior. The
later application-definition adapter must select one declared source scope
before validating a manifest and its receipts. This slice does not claim to fix
that separate boundary.

## Freeze and delivery boundary

The October 3 fleet check found 16 registered consumers: six behind and ten
unpinned. Those are version diagnostics; the command has no live migration
field. The active Aisles work inspected in the app concerns product implementation,
not a Blueprint migration. No conflicting methodology migration was identified.
No consumer file or methodology pin is part of this change.

The source changes stay in an isolated worktree. Built-in stage models, npm
version, CI configuration, authority providers, and rollout are outside this
slice. A later release does not automatically migrate a consumer.

## Verification

The old engine ignored `phases` entirely. A custom Stage 2 with two missing
phase files reported `cursor: 2`, zero gates, and a completed advance. The new
regression leaves the first phase pending. That negative control was reproduced
against `1091bbc` before implementation.

Review also caught a completed-phase predicate being skipped on later unphased
work. A new test failed with `completed phase predicate stays blocking after the
last phase`, then passed after the traversal fix. The same traversal now keeps
phase history across unphased stages and verifies reviewers on later complete
stages before granting their cursor credit.

A final parent check added the legal gate ID `constructor`. JavaScript's
inherited property falsely satisfied that manual gate without a recorded
assertion. Its regression failed, then passed after requiring an own assertion
property. The focused stage-model suite was rerun after this narrow fix.

Executed local checks:

- `npm run test:core`: all 23 steps ran and printed their pass lines.
- Stage-model self-test: ordered transitions, prepopulated later evidence,
  stale predicates and reviewer code, unresolved reviewers, invalid models,
  malformed saved assertions, inconsistent history, dry run, mixed stage types,
  and the pipeline-complete path passed.
- Workflow smoke: fresh stamping delivers phase support; CLI text/JSON,
  execution, rejected phase selectors, and doctor health/readiness separation
  passed. Subprocesses ignore stdin and have bounded timeouts.
- `git diff --check`: no whitespace errors.
- `npm run manifest:check`: exit 0. Existing pending human-outcome receipts
  remain pending; this work does not establish product outcomes.

A read-only reviewer independently identified history loss, missed later
reviewers, invalid stored assertions, and omitted-gates compatibility. The parent
checked these against source, fixed them, and added regressions. The final
read-only review found no remaining material defects before the final own-property
regression above. Its sandbox could not
create temporary test fixtures, so executed fixture evidence comes from the
parent's runs, not that review. The dispatch receipts record requested
Terra/high; the runtime did not expose model or effort, so those fields remain
unverified.

No real consumer was migrated. No application-definition authority or semantic
review gate was exercised. Local state can establish workflow order but cannot
authenticate a person or resist deliberate fabrication by someone who can edit
that state.
