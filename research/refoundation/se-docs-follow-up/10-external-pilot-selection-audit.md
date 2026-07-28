---
status: no-legitimate-pilot-selected
date: 2026-07-27
capability_candidate: fc17bd7
consumer_mutation: none
---

# Variant-transition external pilot selection audit

## Question

Does the current registered fleet contain a real external initiative whose
governing deliverable has independently changed from a greenfield product to a
research decision, making it a legitimate prospective transition pilot?

Mechanical source eligibility is not initiative intent. Blueprint needing a
pilot is not a reason for an initiative to re-charter.

## Fleet result

At candidate `fc17bd7`, the
`blueprint fleet --capability=variant-transition --json` check reports:

- 15 registered consumers;
- 2 explicitly mirrored `greenfield` rows that are source-shape eligible;
- 4 explicitly mirrored non-greenfield rows that are unsupported as a source;
- 9 rows whose source variant remains unknown;
- 15 rows with the capability `not-distributed`; and
- 3 remaining evidence gates: prospective external transition, prospective
  external rollback, and delayed preservation.

The two eligible rows are Blog and Fleet Observability. Both local repositories
were clean during this read-only audit.

## Candidate dispositions

### Signal Dispatch Blog — do not select

**Pinned state:** `main` at
`4d6535bf30a7d7b37400f9cf39f024d94929b1a3`.

The root `blueprint.yml` deliberately declares `variant: greenfield` for a new
publication: new name, voice, identity, information architecture, and surfaces.
It documents the earlier brownfield-to-greenfield correction and preserves the
old audit artifacts only as inputs. Current repository work continues the live
publication and brand implementation. Its reader contract serves published
essays, tutorials, series, and research notes as publication content.

There is no present-tense operator or sponsor decision replacing that
publication deliverable with a research decision. Selecting Blog would reverse
an intentional variant correction and fabricate transition intent.

**Disposition:** source-shape eligible; no evidenced transition intent.

### Fleet Observability — do not select

**Pinned state:** `main` at
`2989aa4fe8e69d4cfe1b797f8006dc615db52baf`.

Its `blueprint.yml` declares an active greenfield product and locked
`solo-fleet-operator` pilot. The repository contains a product PRD, product
research, build decisions, a live report, and recent authentication, guide, and
fleet-scope delivery. ADR-0004 requires a superseding decision for any future
pilot substitution.

There is no re-charter, transition decision, product-retirement disposition, or
research-decision memo replacing the live product deliverable. Its research
artifacts are inputs to the product, not the terminal output.

**Disposition:** source-shape eligible; no evidenced transition intent.

## Explicit exclusions and unavailable rows

- SE Docs supplies the migration defect and completed manual transition
  evidence, but its transition is retrospective, it is not a registered fleet
  row, and it cannot be relabelled as a prospective pilot.
- Adaptive Commerce remains excluded from this capability pilot.
- Unknown-variant registry rows cannot be promoted into source eligibility by
  repo name, pattern, or methodology need. An unavailable or unverified
  initiative requires its own authoritative variant and intent evidence before
  consideration.

## Decision

**No legitimate prospective external pilot exists in the currently verified
fleet state.** No transition decision was authored, no dry-run or apply was
performed, and no consumer was mutated.

This is a valid gate result, not a reason to lower the bar or manufacture a
re-charter. The three external evidence gates remain open.

## Required next step

The next action belongs to an initiative, not to Blueprint:

1. An initiative operator or sponsor identifies a real change in that
   initiative's governing deliverable for initiative-specific reasons.
2. The initiative records an authorized re-charter before transition execution.
3. As part of that transition step, the initiative chooses its accountable
   party, rollback route, and receipt review point. Blueprint validates that the
   step was completed; it does not choose a universal support owner.
4. Only then may the methodology-side pilot preregister the pinned consumer
   baseline, preservation inventory, transition/apply receipt, rollback, and
   delayed preservation observation.
5. Fleet/freeze and release/Wave authorization remain separate checks.

Until an operator nominates an initiative with that evidence, the candidate
branch should remain unmerged and undistributed.
