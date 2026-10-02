---
canonical: false
status: proposed-entry-not-applied
date: 2026-10-02
---

# Proposed wedding amendment

For the owning chat to review and append to the top of the wedding initiative's `METHODOLOGY-AMENDMENTS.md`. The entry below would become Active only when applied there. It does not authorize implementation or change the frozen v0.4 files. Paths inside the entry are relative to that initiative.

## 2026-10-02 — Review the next implementation design beyond the stack choice

**Trigger**: The selected experience and technical target left consequential implementation decisions without a completed, candidate-specific design review.
**Scope**: Candidate for methodology promotion
**Bucket**: methodology
**Status**: Active

The v0.4 BRD, PRD, stories and experience architecture define substantial functional behavior. The selected A+C direction remains the experience source. Decision 0002 and the MVP handoff add a system outline, data invariants, transaction guidance, preview restrictions and an operations plan. The gap is not that these subjects are absent.

Before a durable implementation slice begins, bind its requirements to sufficiently precise data, permission and operation contracts. Name the source for each decision and the test that will verify its consequence. For the first save/correction slice, complete the relational constraints, actor/resource/action permissions, operation inputs/results/errors, concurrency and uncertain-write recovery rules. Review the affected system boundaries and representative sequences. Use diagrams only when they make those relationships easier to check.

Record Ready, Missing or Not applicable for the selected scope against its exact candidate. Ready means the applicable design has been reviewed; it does not mean behavior, deployment or customer value is proven. Missing includes unresolved, stale and contradictory evidence. Not applicable needs an explicit reason reviewed against the requirements. Planned tests remain NOT_RUN until executed.

Preserve the frozen definition and historical research stage. The October 2 technical decision is a scoped overlay, not an implicit rewrite of open v0.4 product choices. Resolve a decision before implementing work that depends on it. D-12/D-13 may remain open for a seeded save-only slice that excludes event editing; they must close before their editing paths ship. Keep technical spikes bounded and separate from accepted product behavior.

Pilot this as a manual prerequisite by extending the existing handoff and owned design sources. The owning chat checks the handoff's `Implementation design readiness` section and its scope-specific record under `docs/design/reviews/` before issuing a durable-code brief. Missing, stale or rejected review evidence holds the affected assignment. No current CLI command enforces this new prerequisite. Do not create a new stage, reset the completed research run, invent a receiving team, or copy a large template package. A broader Blueprint change needs comparison with another consumer and evidence that it catches consequential omissions without duplicate maintenance. The subscriptions boundary-contract case and Rally HQ's shared-layout case support owned contracts; neither proves this proposed gate effective.

**References**:
- `docs/baselines/definition-v0.4/manifest.json`; `docs/brd.md`; `docs/prd.md`; `docs/user-stories.md`.
- `docs/design/experience-architecture.json`; `docs/design/experience-architecture-notes.md`; `docs/design/combined-direction.md`.
- `decisions/0002-mvp-technical-target.md`; `docs/mvp-build-handoff.md`; `docs/dispatch/stack-target/result.json`.
- `docs/audits/blueprint-continuation.md` and the existing amendment on a completed research run's revised candidate.
- Blueprint proposal, researched against base revision `4aaed42`: `research/design-documentation-amendment/proposal.md` and its evidence/implementation plan, on local branch `codex/design-documentation-amendment`. `packet-manifest.json` fingerprints the proposal files; the containing repository commit records publication. The [pilot outcome](pilot/outcome.md) records the later scoped design review. Publication is not methodology adoption.
- Blueprint canonical owners: `template/docs/methodology/methodology-amendments-convention.md`, `docs/patterns/amendment-classification-pattern.md`, `template/docs/methodology/proof-obligation-registry-pattern.md`, and `template/docs/methodology/handoff-manifest-convention.md`.
