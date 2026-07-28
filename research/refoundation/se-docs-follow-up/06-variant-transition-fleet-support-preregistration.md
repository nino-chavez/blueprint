# Variant transition v1 — fleet compatibility and support-window preregistration

**Frozen before implementation:** 2026-07-27

**Status:** preregistered candidate follow-up; not published

**Depends on:** transition candidate through
`05-variant-transition-recovery-results.md`

## Why this follow-up exists

Local status, Doctor, upgrade refusal, and crash recovery are now mechanically
covered. Methodology-side fleet visibility and the public support-window
decision remain open under Decision 08.

Fleet cannot inspect arbitrary consumer worktrees without cloning them, and the
current registry is explicitly a dated mirror. Copying receipt state into
`consumers.yml` would turn a local support fact into a stale methodology-side
claim. This follow-up therefore reports compatibility and candidate eligibility
only. Consumer-local receipt truth remains owned by `blueprint variant status`
and Doctor.

## Read-only candidate audit

The registered local snapshot contains three explicit greenfield initiatives:
Blog, Fleet Observability, and the separately registered Adaptive Commerce
initiative outside `consumers.yml`. None currently has evidence that its
deliverable changed from a product/initiative outcome to a research decision
memo.

Adaptive Commerce is excluded by the follow-up charter. Blog and Fleet remain
product initiatives. No initiative is selected merely to satisfy the pilot
counter. A contrasting prospective pilot must begin with a real operator or
sponsor re-charter.

## Frozen fleet contract

The methodology source gains one machine-readable capability record containing:

- capability and schema identifiers;
- supported source/target variants;
- plan, receipt, rollback, and journal schema versions;
- distribution state (`candidate` until a separately authorized release);
- the proposed compatibility/support window;
- the remaining promotion gates.

The consumer registry may add an optional, explicitly mirrored `variant` and
`variant_synced_at` for rows verified from a local consumer. Missing values stay
unknown. They are not inferred from portal pattern, repository name, or prior
case-study prose.

`blueprint fleet --capability=variant-transition` reports, per consumer:

- mirrored source variant and snapshot date;
- source eligibility (`eligible`, `unsupported-source`, or `unknown`);
- distribution availability from the capability record;
- whether the consumer's methodology pin can be evaluated against an
  `introduced_in` release; and
- a plain statement that eligibility is not transition intent, receipt state,
  or validation.

While the capability is `candidate` or has no `introduced_in` release, every
consumer reports `not-distributed`; no pin is presented as transition-capable.
After a future authorized release records `introduced_in`, the existing semver
classifier may report pin compatibility. A SHA or unpinned consumer remains
unknown unless the exact revision can be resolved.

Default `blueprint fleet` behavior and exit semantics remain unchanged. The
capability view is opt-in and read-only.

## Proposed support window

The candidate support policy is:

- receipt and journal schema `/1` remain readable and recoverable for at least
  two subsequent minor releases and 90 days after the first public opt-in
  release, whichever is later;
- an active receipt is not abandoned at the end of that minimum window:
  removal requires a compatible migration reader or an explicit
  operator-recorded retirement/rollback;
- the deprecation clock yields to the methodology freeze;
- support covers status, recovery planning, recovery execution, rollback
  preflight, and rollback execution for the documented v1 boundary;
- support does not include repairing authored post-transition changes,
  non-Git/nested layouts, other variant pairs, or cleanup execution; and
- escalation evidence is a sanitized status/Doctor JSON result plus the exact
  methodology revision, never a consumer secret or an invented receipt.

The capability record defines this reusable policy; it does not assign a
methodology-wide support owner. Before an initiative applies a transition, its
transition decision must record the accountable party, the rollback route, and
the receipt review point. That is a per-initiative responsibility for the
specific transition evidence and recovery decision, not a standing Blueprint
support promise or an assignment of repository ownership.

## Preregistered tests

1. capability schema rejects invalid schema ids, unsupported variant shapes, and
   contradictory candidate/release fields;
2. candidate/no-release state reports every consumer as `not-distributed`;
3. eligible, unsupported-source, and unknown rows classify from explicit
   mirrored variants only;
4. absent optional registry fields preserve existing parsing and default fleet
   output byte-for-byte;
5. the capability view labels registry data as a dated mirror and never emits
   receipt/applied/validated claims;
6. future semver compatibility is exercised with synthetic introduced versions,
   including behind, current, unpinned, SHA, and unresolvable pins;
7. malformed optional variant fields are visible registry warnings rather than
   silently normalized;
8. focused tests, full `test:core`, stamp smoke, Doctor, package dry-run, and
   diff checks remain green; and
9. apply refuses a missing, invalid, unsafe, or changed initiative-local
   transition decision, while a valid declaration is content-addressed into the
   plan and retained by the receipt.

## Promotion ceiling

Passing this slice supplies a mechanically honest fleet compatibility view and
a reviewable proposed support policy. It does not assign standing methodology
support ownership, release the capability, mutate a consumer, select a live
pilot, or satisfy the prospective transition/rollback gates.

No public Wave entry is warranted while distribution remains blocked.
