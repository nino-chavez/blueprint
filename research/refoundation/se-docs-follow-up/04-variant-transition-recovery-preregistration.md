# Variant transition v1 — crash recovery and local support preregistration

**Frozen before implementation:** 2026-07-27

**Status:** preregistered candidate follow-up; not published

**Depends on:** `01-variant-transition-preregistration.md`,
`01a-variant-transition-preregistration-disposition.md`, and the corrected
candidate through `03-variant-transition-promotion-audit.md`

## Why this follow-up exists

The first candidate restores its preimage after exceptions that remain inside
the running process. A hard process exit after one atomic filesystem operation
can leave the initiative between variants with only a stale Git-metadata lock.
That is not a supportable public migration boundary.

The same candidate leaves completed and interrupted transition state invisible
to `doctor`, while `upgrade --apply` can still change the methodology pin during
an interrupted transition. These are local support gaps. They do not authorize
a fleet-wide migration claim or substitute for a live operator rollback.

## Frozen recovery contract

Before the first initiative mutation, apply or rollback must publish a durable,
single-operation journal in Git metadata. The journal is:

- schema-versioned and content-addressed;
- bound to the canonical worktree device/inode and Git baseline;
- written atomically and flushed before the corresponding initiative mutation;
- sufficient to restore the operation's exact preimage without fetching,
  installing, or trusting current template bytes; and
- removed only after a visible success receipt exists and its complete
  postimage verifies, or after recovery restores and verifies the preimage.

Every mutating action has an intent already present in the journal before the
action begins. Recovery inspects hashes rather than assuming whether an
interrupted action completed.

`blueprint variant recover` is explicit and read-only by default:

```text
blueprint variant recover --target=<initiative>
blueprint variant recover --target=<initiative> --apply
```

Planning reports the interrupted operation, exact restore/remove actions,
conflicts, stale-lock disposition, and expected terminal state. `--apply`
requires a conflict-free fresh recovery plan and acquires the same single-writer
boundary as transition and rollback.

Recovery always returns an incomplete operation to its pre-operation state. It
does not guess that an interrupted transition or rollback should be completed.
If the success receipt and complete postimage already exist, recovery only
clears the stale journal/lock and reports the operation as completed.

## Lock and path boundary

- A live lock owner blocks recovery.
- A dead lock may be removed only when its exact token matches the journal that
  recovery validated.
- A dead lock with no published journal is safe to clear because no initiative
  mutation may begin before the journal is durable.
- A mismatched, malformed, or path-escaped lock/journal blocks automatic
  recovery.
- Journal and lock files live in Git metadata, never below a consumer-controlled
  symlink.
- Target replacement, copied checkouts, changed Git ancestry, unsafe path
  ancestors, and concurrent edits preserve the affected bytes and block with an
  explicit recovery conflict.

## Local support visibility

One read-only status function owns transition state for all local callers. It
classifies:

- no transition history;
- applied with rollback currently available;
- applied with rollback blocked by post-transition edits;
- rolled back;
- interrupted apply or rollback;
- active operation; and
- corrupt or ambiguous support state.

`blueprint variant status` renders that function directly. `doctor` reports an
interrupted, active-without-valid-journal, corrupt, or ambiguous state as FAIL;
an applied receipt with blocked rollback as WARN; and a clean applied,
rolled-back, or absent state as PASS.

`blueprint upgrade --apply` refuses while status is interrupted, active,
corrupt, or ambiguous. Dry-run includes the transition status and remains
read-only. A completed applied or rolled-back receipt does not itself block a
pin preview or bump.

Fleet remains methodology-side and cannot inspect arbitrary consumer
worktrees. This slice does not add manually mirrored receipt claims to
`consumers.yml` and does not claim fleet support complete. Fleet integration
must be preregistered against a real receive/support protocol rather than
laundering local state through stale registry metadata.

## Preregistered tests

The candidate is not mechanically complete unless tests prove:

1. the journal exists and parses before the first initiative mutation;
2. subprocess death after each apply mutation recovers byte-for-byte to the
   pre-transition state without a success receipt;
3. subprocess death after each rollback mutation recovers to the exact applied
   state and preserves the original transition receipt;
4. death after success-receipt publication is recognized as completed and
   clears only stale support metadata;
5. recovery plan mode changes no bytes, paths, or mtimes;
6. a live lock, mismatched lock token, corrupt journal, target replacement,
   copied checkout, unsafe ancestor, and concurrent edit all refuse without
   overwriting evidence;
7. a dead pre-journal lock clears safely only under explicit recovery apply;
8. `variant status`, Doctor, and upgrade expose the same interrupted/completed
   classification;
9. upgrade apply refuses interrupted/corrupt state while dry-run remains
   informative and read-only;
10. existing 113 transition assertions, full `test:core`, stamp smoke, package
    dry-run, doctor, and diff checks remain green.

## Promotion ceiling

Passing this follow-up closes only the repository-side crash-recovery and local
support-visibility gaps. It does not close fleet support, define a public
compatibility/support window, supply a contrasting prospective external
transition, or create an operator-owned rollback receipt.

No consumer will be mutated. No package will be published. No charter-first,
steering, native, universal-stage, SE Docs-specific, portal, or model-allowlist
semantics enter this operation.
