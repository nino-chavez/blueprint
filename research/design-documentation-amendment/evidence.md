---
canonical: false
status: research-evidence-not-methodology-adoption
date: 2026-10-02
---

# Evidence for the design-readiness proposal

The evidence supports better ownership and review of implementation decisions. It does not yet demonstrate that a new portable gate improves delivery. [Recommendation](proposal.md) · [implementation plan](implementation-plan.md) · [consumer amendment draft](consumer-amendment.md).

## Scope and source identity

- Blueprint: isolated branch `codex/design-documentation-amendment`, based on `4aaed42` (`Fix research workflow gates and outcome readiness (#63)`). The WAVE-LOG tail labels Wave 124 proposed/unreleased; that wording is not a live npm or deployment check. No publish-state claim is made here.
- Wedding: `/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star`. It has no commit at HEAD, so [source-snapshot.json](source-snapshot.json) records content hashes. Both the current files and frozen copies match all 40 entries in the v0.4 manifest. The historical stage cursor is 8; its file hash is recorded. The proposed app directory was absent when inspected. No remote cloud inventory was queried.
- Rally HQ: inspected local HEAD `d99bfa14ac517b62bf7322398adda3183bbdf0fd` plus hashes of the cited working files.
- Subscriptions consumer: inspected local HEAD `41fae517eac2abd6f44acf08186c2e14c6d58fe4`, historical producer/reader at `8b75791a^`, the fixing diff `8b75791a`, and current shared imports. Use the public name `private/subs-initiative` if any of this research is later prepared for distribution.

The source snapshot records source identities, not proof that everything those sources assert is true. Narrative incident outcomes below remain labeled as reports unless independently reproduced.

## Current requirements and enforcement

| ID | Canonical source inspected | Observed boundary |
|---|---|---|
| B1 | [Amendment convention](../../template/docs/methodology/methodology-amendments-convention.md), “Why this exists,” “Three scopes”; [classification](../../docs/patterns/amendment-classification-pattern.md) | Initiative learning precedes promotion. Scope and fix-location bucket are different axes. Multiple similar initiatives strengthen candidacy; a tool still needs adoption evidence. |
| B2 | [METHODOLOGY](../../METHODOLOGY.md), Stage 2 and Stage S-B; [Foundation spec](../../template/methodology/design/foundation-stage-spec.md) | Design direction and UI structure already have owners. S-B is explicitly opt-in/proposed; it addresses scope, layout, routes and components, not a complete backend design. |
| B3 | [stage-model.mjs](../../template/tools/lib/stage-model.mjs), `GREENFIELD_MODEL`, `CHECK_KINDS['handoff-manifest']`, `evaluateWorkflowReadiness`, `recordAdvance` | Documents has `dir-md-min` plus a mapped document reviewer. Handoff recognizes serving ready/issued output declarations for receiving actors. Existing reviewer fingerprints and terminal dry-run behavior can be reused but do not supply design completeness. |
| B4 | [doc-quality-auditor.mjs](../../template/.claude/agents/blueprint/reviewers/doc-quality-auditor.mjs), deliverable selection and review body | Mechanical figure-attribution/derivation checks. BRD, PRD, schema and operation semantics are not covered merely because an ADR exists. Semantic checks in the written rubric are not silently executed. |
| B5 | [Foundation reviewer](../../template/.claude/agents/blueprint/reviewers/foundation-stage-reviewer.md) and directory enumeration | A written reviewer exists. There is no `foundation-stage-reviewer.mjs`; the built-in stage models have no S-B binding. Do not describe the prose gate as automatic CLI enforcement. |
| B6 | [Handoff convention](../../template/docs/methodology/handoff-manifest-convention.md), “The output” and “Derivation status” | Per-feature completeness is intended. `handoff-derive` remains deferred; the existing declaration check is narrower than the feature contract. |
| B7 | [DoD ladder](../../template/docs/methodology/dod-verification-ladder-pattern.md); [proof-obligation pattern](../../template/docs/methodology/proof-obligation-registry-pattern.md); [registry source](../../template/tools/spec-obligation-registry/index.ts) | Already separates presence from behavior, scope from proof method, and structural from judgment completeness. `validateRegistry` validates declarations; it does not execute all their named engines. The general registry pattern is still labeled a promotion candidate. |
| B8 | [Decision 08](../../decisions/08-refounded-semantic-core.md), source ownership and rollout ceiling; [refoundation recommendation](../refoundation/18-final-recommendation.md); [review-loop follow-up](../refoundation/25-atelier-convergence-and-review-loop.md) | Claims, exact candidates and receipts already have a native owner for adopters. Keep stage adapters and consumer outputs separate; do not quietly publish the research schema or create a rival claim ledger. |

### Current-gate reproduction

[probe-current-gates.mjs](probe-current-gates.mjs) imports the actual current stage model and mechanical reviewer. It creates temporary fixtures inside this research directory, saves [current-gates.json](current-gates.json), and removes only its own fixtures. It changes no production or template code.

| Fixture | Observed result | Supported conclusion |
|---|---|---|
| No ADR/design | Documents gate absent | The presence check detects its intended missing input. |
| Stack ADR only | Documents gate pass; document reviewer PASS with no matching deliverables | A stack document can meet this individual gate without implementation design. |
| PRD restricts writes; technical prose permits anyone to overwrite | Document reviewer PASS | This semantic contradiction lies outside that executable reviewer's coverage. |
| Known incomplete-denominator attribution defect in `docs/content` | BLOCKED | Negative control demonstrates that the reviewer can reject its intended defect. |
| Receiving actor, no handoff output | Handoff gate absent | Actor-gated requirement functions at declaration level. |
| Ready handoff output backed by minimal prose without feature fields | Individual Handoff gate pass | The stage gate does not inspect those per-feature fields. |

This probe does not call full `recordAdvance`, doctor or actor-output validation. It cannot establish whole-pipeline acceptance, receipt acceptance or runtime correctness. Its synthetic permission contradiction is not a finding against the wedding product.

## Consumer cases

### Wedding: substantial functional design, unfinished implementation detail

Read [AGENTS](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/AGENTS.md) and [amendments](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/METHODOLOGY-AMENDMENTS.md) first. The latter already records the research-gate omission and the completed-run revision problem. This proposal does not claim either is a newly discovered design defect.

- [BRD](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/brd.md), [PRD](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/prd.md), and [stories](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/user-stories.md) already define objects, authority, save/recovery behavior and prototype versus production criteria. They explicitly leave schema/API and other production decisions open.
- [Experience JSON](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/design/experience-architecture.json) was parsed and its fields inspected alongside the [notes](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/design/experience-architecture-notes.md). It owns pages, components, independent state axes, interactions, transitions and journeys. The notes explicitly call these conceptual/interaction contracts, not production routes or storage design. Inventory size is not a correctness score.
- [Selected direction](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/design/combined-direction.md) records A+C selection and retained/rejected elements. No new visual judgment was made in this research.
- [Technical ADR](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/decisions/0002-mvp-technical-target.md) contains a responsibility table and text system tree. The [handoff](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/mvp-build-handoff.md) includes concrete data invariants, transactional save guidance, inert preview rules, environments, deployment order and recovery duties. Calling these subjects entirely absent would be wrong.
- The handoff leaves actual routes for the build and does not yet define a complete relational schema or operation input/result/error contract. The relevant current `docs`, `decisions`, `tools` and `tests` inventory was enumerated; no implemented migration/API design artifact supplying those missing choices was found there. The negative claim is scoped to this inspected package, not all local files or external systems.
- [Stack result](/Users/nino/Workspace/dev/initiatives/wedding-guest-experience/.worktrees/codex/north-star/docs/dispatch/stack-target/result.json) reports `PACKAGE_PREPARED` and runtime/deployment/restore/customer checks `NOT_RUN`. Those are recorded reports, not rerun tests. The source snapshot independently verifies the preserved baseline and historical state hash; it does not verify that cloud resources are absent.

### Subscriptions: a verified historical interface mismatch

The [consumer retro](/Users/nino/Workspace/dev/labs/bc-subscriptions/docs/methodology/2026-06-25-storefront-contract-drift-retro.md) attributes the incident partly to copied contracts and mocks that matched each side separately. The original production database observation and historical CI outcomes were not rerun here.

The narrower mechanism was independently checked with `git show`: at `8b75791a^`, `apps/storefront-svelte/src/lib/server/cart.ts` defines `CART_METAFIELD_NAMESPACE = 'bc_subscriptions'` and writes the full intent shape; `apps/api/src/routes/webhooks.ts` requests `bc-subscriptions` and expects `plan_id`/`cadence`. The actual fixing diff changes the namespace and decoder. Current [writer](/Users/nino/Workspace/dev/labs/bc-subscriptions/apps/storefront-svelte/src/lib/server/cart.ts) and [reader](/Users/nino/Workspace/dev/labs/bc-subscriptions/apps/api/src/routes/webhooks.ts) import the [shared contract](/Users/nino/Workspace/dev/labs/bc-subscriptions/packages/storefront-contract/src/index.ts).

This corroborates Blueprint's existing [single-source boundary lesson](../../docs/lessons/boundary-contracts-single-source.md). It supports owned wire contracts and real boundary tests. It does not establish the counterfactual that a diagram or this proposed gate would have prevented the bug, nor current hosted correctness.

### Rally HQ: an adjacent shared-design precedent

The [May 31 amendment](/Users/nino/Workspace/dev/apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md) identifies cross-cutting IA/layout decisions that feature specs did not own. Its historical adoption count is reported evidence; it was not recomputed.

Current source shows the concrete ownership shape: [layout taxonomy](/Users/nino/Workspace/dev/apps/rally-hq/docs/LAYOUT_TAXONOMY.md), [runtime surface registry](/Users/nino/Workspace/dev/apps/rally-hq/src/lib/design/surfaces.ts), [test adapter importing that registry](/Users/nino/Workspace/dev/apps/rally-hq/tests/e2e/surfaces.ts), and [bidirectional route coverage checks](/Users/nino/Workspace/dev/apps/rally-hq/src/lib/surface-coverage.test.ts). Tests were inspected, not run, and no screen review was performed. This is a reuse precedent, not proof that every design constraint is enforced today.

## External sources checked directly

Fetched October 2, 2026. These are primary authoring references, not vendor comparisons or experimental proof of this proposal.

| Source | Guidance used | Limit |
|---|---|---|
| [C4 diagrams](https://c4model.com/diagrams) | Select useful levels for the audience; all levels are not required. | Does not define a universal implementation gate. |
| [C4 dynamic diagrams](https://c4model.com/diagrams/dynamic) | Use selectively for meaningful runtime collaboration or complicated interactions. | Does not require one diagram per flow. |
| [arc42 building blocks](https://docs.arc42.org/section-5/) | Responsibilities and important interfaces; tables and signatures can carry detail, with depth chosen by relevance. | Its full documentation template is not proposed as mandatory Blueprint output. |
| [arc42 runtime view](https://docs.arc42.org/section-6/) | Representative architecturally relevant scenarios include errors and operation; numbered text and several diagram forms are valid. | Scenario presence alone does not prove behavior. |
| [arc42 deployment view](https://docs.arc42.org/section-7/) | Map software to relevant infrastructure and environments. | Does not settle a consumer's resource, cost or backup decisions. |

No vendor-version, pricing or authentication claim in the wedding stack ADR was revalidated here; those are outside this methodology proposal's evidence needs.
