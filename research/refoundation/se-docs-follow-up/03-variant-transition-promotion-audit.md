# Variant transition v1 — independent promotion audit disposition

**Date:** 2026-07-27

**Input tip audited:** `4413c8984af5f39e0b16de26940516995aa3c6fa`

**Disposition:** eleven blockers accepted and corrected on the candidate branch

**Promotion state:** still candidate-only; Decision 08 gates remain open

## Findings

An independent adversarial audit first reproduced five defects that the initial
55-assertion suite did not cover:

1. The legacy initial stamper still accepted an authored Blueprint target.
   Re-running it with `--variant=research` overwrote the authored
   `research/personas-and-jtbd.md`, preserved the old greenfield
   `blueprint.yml`, and exited successfully.
2. A symlink at `.blueprint/variant-transitions` let apply write its receipt
   outside the initiative. The escaped receipt then could not authorize
   rollback from the initiative.
3. Plan/apply and rollback had no single-writer boundary or immediate preimage
   check. A file edited after preflight could be replaced or removed.
4. Parseable but noncanonical stage state such as `[]` was accepted for
   archive/reset even though the canonical stage-state reader rejects it.
5. Receipt validation required the original absolute checkout path, so merely
   renaming a worktree made rollback unavailable.

Continued audit of the corrections found six more defects:

6. Apply and rollback could verify their final postimage, then receive a
   concurrent mutation before publishing the success receipt.
7. Treating every path mismatch as a worktree move let a copied checkout with
   shared Git history claim the original receipt once the recorded original
   path was removed.
8. Apply failure recovery could follow a transaction-created directory
   ancestor after it was replaced by a symlink, deleting a byte-identical file
   outside the initiative.
9. `requireGitRoot` validated a target's real path but retained its lexical
   path. Retargeting a symlinked parent after preflight could redirect writes
   and the success receipt into a second byte-identical checkout while the
   first checkout's Git lock was held.
10. Canonicalizing the root path did not by itself protect against replacement
    of that canonical directory after preflight. Recovery could otherwise
    inspect the replacement checkout through the now-reused pathname.
11. Receipt validation allowed any planned scaffold ancestor in
    `createdDirectories`, including a pre-existing empty root such as
    `research/`; a modified receipt could make rollback delete it.

These are migration-safety defects, not evidence for expanding the operation's
variant scope or promotion ceiling.

## Corrections

- Initial `--mode=stamp` is now mechanically create-once after
  `blueprint.yml` exists. It refuses before writes and points authored
  initiatives to `blueprint variant transition`, `blueprint upgrade`, or the
  bounded chrome restamp operation.
- Planning and apply validate the exact content-addressed receipt path.
  Directory creation walks every path component with `lstat`, rejects
  symlinks/non-directories, and cannot escape the Git root.
- The target is canonicalized before planning, locking, or mutation. Every
  later join stays anchored to that resolved worktree root even if a lexical
  parent symlink is retargeted. Its device/inode identity is rechecked at
  mutation and verification boundaries. Recovery first verifies the same
  identity and refuses without inspecting a replacement root.
- Apply and rollback acquire one `wx` lock in Git metadata. Every destructive
  replace/remove also rechecks the exact expected hash immediately before the
  operation. Test-only mutation hooks make the after-preflight race
  deterministic.
- Failure recovery removes/restores only bytes owned by the transaction. If a
  concurrent writer changed a transaction output, recovery preserves that
  edit and reports `RECOVERY_CONFLICT` rather than overwriting it. Recovery
  revalidates every in-target ancestor and will neither inspect nor delete
  through a swapped symlink.
- Stage-state archival reuses `stage-model.mjs`’s canonical
  `isValidStateShape`; arrays, null, scalars, malformed `history`, and malformed
  `reviews` refuse without writes.
- Receipt validation derives the exact created-directory set from the
  content-addressed pre-transition inventory and requires equality. It cannot
  expand rollback deletion authority to a pre-existing empty ancestor.
- Receipts retain the original absolute checkout path as provenance, while
  rollback authority is repository-relative and bound to both the original
  root directory's device/inode and the original Git baseline as an ancestor
  of the current `HEAD`. A same-filesystem rename preserves rollback; a copied
  receipt or checkout cannot impersonate that rename, even after the original
  path is removed.

Receipt creation and rollback-receipt creation now use create-only hard links
from same-directory temporary files, so a concurrent file cannot be silently
replaced. Each operation repeats its whole-postimage verification immediately
before that create-only publication.

## Added regressions

The focused suite now covers:

- full byte/path/mtime preservation when legacy init is rejected;
- receipt-root symlink escape with an untouched outside directory;
- a lexical parent symlink retargeted from repository A to byte-identical
  repository B after preflight, with both mutation and receipt pinned to A;
- replacement of the canonical root itself before the first apply or rollback
  mutation, with neither the moved original nor replacement checkout modified
  by recovery;
- active-lock refusal for both apply and rollback;
- a concurrent edit immediately before apply replacement;
- a concurrent edit after apply has written, exercising ownership-aware
  recovery;
- a transaction-created directory swapped for an outside symlink before
  failure recovery, with the outside file and symlink preserved and the safe
  scalar preimage restored;
- a concurrent edit immediately before rollback removal, with the applied
  scalar state restored and the edit preserved;
- apply and rollback mutations at the final success-receipt boundary, neither
  of which may receive a success record;
- all five parseable malformed stage-state classes;
- refusal when a modified receipt claims a pre-existing empty ancestor, with
  that directory preserved;
- refusal when a valid receipt is copied into unrelated Git history;
- refusal when a full copied checkout attempts rollback both before and after
  the recorded original target is removed;
- successful rollback after the entire checkout directory is renamed on the
  same filesystem.

## Residual boundary

The lock coordinates Blueprint transition writers and the final hash checks
protect against ordinary external editors. It is not a crash journal. Process
death or power loss between filesystem operations still requires a dedicated
recovery command or journal before public promotion.

`doctor`, `fleet`, and `upgrade` still do not surface transition/support state.
A contrasting prospective external transition and an operator-owned rollback
encounter remain required. No consumer was mutated, no package was published,
and this audit does not count as prospective validation.
