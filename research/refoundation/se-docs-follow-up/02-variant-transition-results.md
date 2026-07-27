# Variant transition v1 — candidate results

**Status:** implemented and mechanically verified candidate  
**Branch:** `codex/variant-transition-capability`  
**Public distribution:** not published  
**Consumer mutation:** none

## What was built

The candidate adds a separate `blueprint variant` operation; it does not turn
the initial stamper into an updater.

- `variant transition` plans by default and applies only with the exact current
  plan id.
- v1 accepts only a Git-root initiative with one explicit top-level
  `variant: greenfield`, targeting `research`.
- `variant` and a compatible explicit `stage_model` are patched without
  rewriting unrelated YAML or losing quote/comment style.
- Every canonical scaffold destination is classified `CREATE` or `PRESERVE`
  with its SHA-256 and size. Existing empty files are existing files.
- The operation creates only the bounded research files and empty leg
  directories preregistered in `01`/`01a`.
- `.claude`, the broad `tools/lib` surface, portal code, packages, nested portal
  configuration, package scripts, and reader contracts are not upgraded,
  overwritten, or deleted.
- A valid existing stage-state file blocks until
  `--accept-stage-reset`; an accepted file is carried inside the receipt and
  removed. Corrupt state refuses.
- Apply verifies protected-root inventories before writing an append-only
  receipt. In-process failure injection restores the preimage and leaves no
  receipt.
- Rollback preflights every file before writing. It restores scalar preimages,
  removes only byte-identical generated files, restores archived stage state
  only when no replacement exists, and retains the original receipt beside a
  rollback receipt.
- Receipt plan identity is content-addressed and receipt paths cannot expand
  rollback authority.

The initial research stamp now reads its source-index bytes from
`template/research/sources-index.template.md`; initial stamp output remains
byte-equivalent while transition and init share one canonical source.

## Pre-implementation preregistration correction

Contract review found two errors before implementation began and recorded them
in `01a`:

1. the created runner needs the one exact `yaml-scalar.mjs` dependency;
2. visible README files in each research leg would falsely advance the Stage 2
   cursor, so those directories remain empty.

No other preregistered behavior was expanded.

## Verification

Focused `variant-transition.test.mjs` coverage: **55 assertions**.

It covers:

- byte- and mtime-read-only planning;
- deterministic plan ids and CLI dispatch;
- exact inline-comment scalar patch/rollback;
- authored, binary, and zero-byte preservation across all protected roots;
- missing-scaffold creation, empty research legs, stage-model transition, and
  already-transitioned idempotence;
- missing/duplicate variants, custom stage model, corrupt stage state, and
  symlink refusals;
- stale plan, dirty planned path, and unrelated dirty path behavior;
- explicit stage-state archive/reset/restore;
- injected apply and rollback failure recovery;
- rollback refusal after generated content changes;
- tampered-receipt path refusal;
- real greenfield stamp → research derivation → rollback.

Repository checks:

- `npm run test:core`: PASS, including the 55 transition assertions and full
  stamp smoke.
- Research real-stamp smoke: PASS; expected memo/evidence tree present, portal
  and packages absent.
- `npm pack --dry-run --json`: PASS with an isolated temporary cache; the
  dispatcher, transition library/test, scalar dependency, and source-index
  template are present in the candidate package manifest.
- `blueprint doctor --json`: exit 0 / WARN. The pre-existing actor-output
  PENDING and stateful/terminology/reader/lint-jurisdiction WARNs remain; no
  transition-specific doctor check exists yet.
- `git diff --check`: PASS.

### Immutable SE Docs replay

No command ran in the SE Docs working tree. Both tests used `git archive` into
temporary Git roots.

At pre-transition commit `b78910f`:

- plan classified authored `research/personas-and-jtbd.md` as `PRESERVE`;
- apply created the missing source index, decision memo, decision template,
  runner, and exact scalar-helper dependency;
- the authored persona SHA-256 remained
  `f4720ff3fa0f04debd6d347588155602b7ea50b49660a62ec840baecd4bceed1`
  before apply, after apply, and after rollback;
- portal/packages and every other tracked artifact were untouched;
- rollback restored a clean Git diff, with only append-only transition receipts
  untracked.

At completed commit `95f6191`, the plan returned
`status: already-transitioned`, `from: research`, `to: research`, and zero
actions. The archive remained clean.

These are deterministic compatibility replays, not prospective validation and
not an operator support receipt.

## Support and rollback implications

The operation requires the initiative root to be a Git worktree root. This
keeps planned-path dirt and rollback scope mechanically resolvable but excludes
nested/non-Git layouts from v1.

The protected inventory can be large for initiatives that commit substantial
portal/package trees. That cost buys exact preservation evidence; a future
format may move the full inventory to a sidecar without weakening the receipt.

The tested transaction guarantee covers ordinary exceptions and injected
mid-operation failures in the running process. A hard process kill or power
loss between atomic file operations has no recovery-journal command yet. That
is an explicit public-promotion blocker, not a condition to hide behind the
successful failure-injection tests.

`doctor`, `fleet`, and `upgrade` do not yet report transition receipts,
in-progress recovery state, or compatibility windows. Support-window ownership,
crash recovery, a second contrasting live transition, and a real operator
rollback encounter remain open under Decision 08.

## Promotion ceiling and non-expansions

This branch is a candidate, not the published tenth CLI command. It does not
authorize npm publication or consumer rollout. Public consideration should
happen only after the correctness maintenance lands, consumers can receive
that prerequisite, the open support gates above close, and a prospective
external transition succeeds.

No universal problem-statement stage, SE Docs-specific variant, portal
requirement, model allowlist, or steering-layer semantics were added.
