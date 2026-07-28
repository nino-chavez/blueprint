# Variant transition v1 — crash recovery and local support results

**Status:** implemented and mechanically verified candidate follow-up

**Branch:** `codex/variant-transition-capability`

**Public distribution:** not published

**Consumer mutation:** none

## Result

The repository-side crash-recovery and local support-visibility slice
preregistered in `04` passes.

Apply and rollback now publish a content-addressed journal in Git metadata
before the first initiative mutation. Journal publication uses a create-only
temporary file, file flush, create-only hard link, and directory flush. The
journal is bound to the canonical worktree device/inode, Git baseline, and the
exact single-writer lock token.

`blueprint variant recover` plans by default. Explicit `--apply` returns an
interrupted apply to its greenfield preimage or an interrupted rollback to its
applied preimage. It does not resume or complete an ambiguous operation. When a
success receipt and the complete postimage already exist, recovery removes only
the stale journal/lock metadata.

Recovery refuses a live writer, malformed or mismatched lock, corrupt or
modified journal, replaced worktree root, non-descendant Git history, unsafe
path ancestor, unexpected support entry, and any file that matches neither the
journaled preimage nor postimage. Concurrent edits are preserved.

`blueprint variant status`, Doctor, and upgrade now consume one read-only state
classifier:

- Doctor fails interrupted, active, corrupt, or ambiguous support state;
- Doctor warns when an applied transition's generated files changed and
  automatic rollback is therefore blocked;
- upgrade dry-run reports transition state; and
- upgrade apply refuses interrupted, active, corrupt, or ambiguous state before
  changing `methodology_version`.

Completed applied or rolled-back receipts do not themselves block an upgrade.

## Verification

- focused transition suite: **237 assertions**, PASS;
- subprocess-death recovery after every planned create-directory/create-file
  action, scalar mutation, stage-state archive/restore, and apply/rollback
  success-receipt boundary: PASS;
- exact worktree byte/path restoration after interrupted apply and rollback:
  PASS;
- read-only recovery-plan byte/path/mtime checks: PASS;
- stale/live/mismatched lock, corrupt journal, concurrent edit, copied/replaced
  checkout, symlink, and receipt-tamper refusals: PASS;
- shared CLI status, Doctor, and upgrade state tests: PASS;
- Doctor self-test: **18 assertions**, PASS;
- `npm run test:core`, including both stamp modes and research stamp smoke:
  PASS;
- `npm pack --dry-run --json`: PASS, 521 entries; dispatcher, transition
  library/test, and Doctor present;
- `blueprint doctor --json`: exit 0 / WARN with
  `variant-transition: pass`; existing unrelated advisory warnings remain;
- `git diff --check`: PASS.

## Closed and open gates

Closed mechanically on this candidate:

- durable interrupted-operation evidence;
- explicit, non-resuming crash recovery;
- stale-lock handling;
- local status and Doctor visibility; and
- upgrade apply refusal during unsafe transition state.

Still open under Decision 08:

- fleet support tied to a real consumer receive/support protocol;
- a documented public compatibility and support window with an accountable
  owner;
- a second contrasting prospective external transition; and
- an operator-owned rollback encounter.

Fleet remains methodology-side and cannot inspect arbitrary consumer
worktrees. This candidate deliberately does not mirror local receipt claims
into `consumers.yml`, because manually copied state would become a stale
false-green.

The candidate therefore remains unpublishable and unmergeable as a public
capability. No prospective validation is claimed. SE Docs Front Door remains
unchanged, and no charter-first, steering, native, universal-stage,
SE Docs-specific, portal, or model-allowlist semantics were added.
