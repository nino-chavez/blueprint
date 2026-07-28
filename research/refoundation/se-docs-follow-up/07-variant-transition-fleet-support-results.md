# Variant transition v1 — fleet compatibility and support-window results

**Executed:** 2026-07-27

**Preregistration:** `06-variant-transition-fleet-support-preregistration.md`

**Candidate commits:**

- preregistration: `e816fd2`
- implementation and tests: `928fd74`

**Verdict:** candidate implementation verified; public promotion remains blocked

## Implemented boundary

The candidate adds a machine-readable capability record at
`docs/compatibility/variant-transition-v1.json` and an opt-in read-only view:

```text
blueprint fleet --capability=variant-transition
```

The view reads explicit optional `variant` and `variant_synced_at` mirrors from
`consumers.yml`. It does not infer a variant from a portal pattern, repository
name, prior pilot, or narrative. It labels the registry as a dated mirror and
states that eligibility is not transition intent, receipt state, applied state,
or validation.

The ordinary `blueprint fleet` path remains unchanged. A direct comparison of
the computed default fleet object before and after the optional registry fields
passed byte-for-byte with the same Git probe.

## Exact fleet finding

The capability view reported:

- 15 registered consumers;
- 2 explicitly mirrored greenfield rows eligible by source shape: Blog and
  Fleet Observability;
- 4 explicitly mirrored non-greenfield rows unsupported as a source;
- 9 rows with unknown source variant; and
- all 15 rows `not-distributed`.

Neither eligible row is evidence of transition intent. The local read-only
audit found no genuine deliverable re-charter from greenfield to research, so
no consumer was selected or mutated merely to produce a pilot receipt.
Adaptive Commerce remains outside this work.

The normal fleet check still reported 5 behind and 10 unpinned consumers, with
no malformed or duplicate rows. Wave 98 records zero external consumers
mid-migration; the template freeze was not tripped for this isolated candidate.
No Wave entry was added because the capability is not landing or distributing.

## Support and rollback implication

The proposed record keeps plan, receipt, rollback, and journal schema `/1`
explicit. Its minimum support window is two subsequent minor releases and 90
days after the first public opt-in release, whichever is later. An active
receipt cannot be abandoned at that minimum boundary: retirement requires a
compatible reader/migration or an explicit operator-recorded
retirement/rollback, and the methodology freeze takes precedence.

Covered operations are status, recovery planning, recovery execution, rollback
preflight, and rollback execution. Authored post-transition changes,
non-Git/nested layouts, other variant pairs, and cleanup execution remain out of
scope.

The accountable support owner is deliberately unnamed with acceptance
`pending`. Repository ownership was not converted into an implied human
support promise.

## Verification

Focused:

- `consumers-registry` self-test: PASS, 41 assertions;
- `capability-support` self-test: PASS, 16 assertions, including CLI
  candidate/unknown-capability behavior;
- candidate capability JSON and plain output: expected exit 1;
- unknown capability: expected exit 2;
- default fleet output compatibility comparison: PASS;
- variant-transition suite: PASS, 237 assertions; and
- `git diff --check`: PASS.

Distribution and repository checks:

- `npm run test:core`: PASS, including stamp smoke;
- root Doctor: WARN only on existing advisory checks; methodology home,
  variant-transition state, registry, loadability, and doc-currency checks
  passed;
- `npm pack --dry-run`: the first attempt failed on the machine's root-owned
  default npm cache; the isolated-cache rerun passed with 523 entries and both
  `docs/compatibility/variant-transition-v1.json` and
  `template/tools/lib/capability-support.mjs` present;
- package dry-run left no tarball; and
- normal fleet: expected exit 1 for existing drift, 5 behind and 10 unpinned.

## Open gates

Public promotion remains blocked on all of the following:

1. an operator names and explicitly accepts the support owner;
2. a real contrasting external initiative is re-chartered and prospectively
   executes the transition;
3. that initiative prospectively exercises rollback inside the documented
   boundary;
4. a delayed preservation check confirms the retained authored artifact state;
5. the release/version and Wave are separately authorized; and
6. any then-active external consumer migration freeze is cleared or waived.

This slice does not publish npm, mutate a consumer, open or merge a transition
PR, accept support ownership, claim prospective validation, or promote
steering-layer semantics.

## Recommended promotion sequence

1. Review this candidate and the proposed support obligation without merging.
2. Name the support owner and record explicit acceptance.
3. Select a genuinely re-chartered, contrasting external pilot.
4. Execute prospective dry-run, apply, rollback, and delayed preservation
   checks at a pinned candidate revision.
5. Update the capability record to a separately authorized release version only
   after those receipts pass.
6. Re-run fleet/freeze, full core, stamp, Doctor, package, and diff checks.
7. Land through a public Wave, then publish only through the normal authorized
   release path.
