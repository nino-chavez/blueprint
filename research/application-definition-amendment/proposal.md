---
canonical: false
status: proposal-not-adopted
date: 2026-10-02
blueprint_base_revision: 363381459f3d4dfd15c017992be515d498a62532
template_changed: false
---

# Define the application before comparing concepts

Add two checked phases to Blueprint's existing design stage for a new application or a whole-application rethink. First, draft the complete application definition before concepts begin. After a human selects a concept, reconcile the definition with that choice and freeze it before blind validation of the selected application or durable implementation.

The definition covers business requirements (BRD), product requirements (PRD), user stories, every page, every interaction and state, and user journeys in words and diagrams. These are required kinds of information, not seven mandatory files. Reuse each project's existing sources and stable IDs.

**Decision for the maintainer:** confirm the scope and phase structure of [RFC #65](https://github.com/nino-chavez/blueprint/issues/65), filed on 2026-10-03, and name the first pilot before a bounded implementation can proceed. This packet is a substantial methodology RFC draft under [CONTRIBUTING.md](../../CONTRIBUTING.md), not an adopted rule. It contains a working research prototype and negative controls. It changes neither the distributed CLI nor a consumer. The issue is filed; acceptance remains pending.

## A collection of designed pages does not define an application

A private operator-console discovery prompted this request. Its records are not part of this public package, and this task did not test the running console. The public evidence is narrower: Blueprint's current design-document check can pass without an application inventory. The experiment below reproduces that limit; it does not prove a consumer product failure.

Gather Here's current public package carries BRD/PRD/stories, role journeys, explicit permissions, state requirements and stable acceptance IDs. It says to freeze before prototype testing and distinguishes those requirements from build authorization. Its public export omits private selection history and some source inventories. That supports preserving evidence boundaries and traceability. It does not prove a complete public page/interaction inventory, prove the historical order of authoring, or establish that this proposed Blueprint gate improves outcomes.

**What it means:** require a reviewable application model at the point concepts start; do not infer completeness from page quality or document names.

## Extend the current design stage instead of renumbering the pipeline

Blueprint's [judged-screen pattern](../../template/docs/methodology/judged-screen-pattern.md#2c-three-divergent-concepts-and-a-human-selection--rethink-only) already puts the brief before concepts, human selection before system design, and production implementation afterwards. The executable greenfield design-stage gate checks for a design document. The [probe](checks.json) shows that gate passing with only a `prototype/DESIGN.md`; removing it makes the same gate fail. This is an individual-gate result, not a claim that the whole pipeline passes.

| Candidate structure | New app | Whole-app rethink with accepted pages | Bounded refit | Decision |
|---|---|---|---|---|
| New numbered definition stage in every variant | Clear label | Moves existing stage IDs and historical cursors | Requires many exemptions | Reject the global renumbering; retain an explicit visible phase. |
| **Ordered phases inside the applicable design stage** | Definition precedes concepts | Whole boundary is checked while accepted pages are referenced | Reviewed exclusion retains existing rules | **Recommend.** Extends the existing design phases and gate engine. |
| Standalone optional checklist or capability track | Can be run early | Main cursor can advance without it | Lowest ceremony | Reject as the enforcement mechanism; retain a read-only diagnostic view. |

The selected structure keeps the first option's visible checkpoint and the third's diagnostic report. It leaves out global stage renumbering and an optional track that could be bypassed by the main cursor. A requirement added only to the design stage's *exit* would also be too late: concepts happen inside that stage.

```text
Existing-product blind baseline review (when applicable)
  Research + declared application boundary
    Draft application definition
      Gate D: complete, reviewed draft -> concepts may start
        Divergent application concepts -> human selection + graft record
          Reconcile requirements and every inventory ID
            Gate F: current product-owner freeze -> selected-candidate validation
              Existing validation / implementation-design checks
                Scoped implementation authorization -> durable build
```

Greenfield attaches these phases to Stage 2 Design Principles. Midstream and brownfield attach them to Stage 3 Design Principles / Design Brief after diagnosis and prescription. A research-only initiative remains research-only. If it later commissions an application concept, it opens a scoped application-design run; it does not rewrite the completed research history. An existing-product blind baseline review still happens before design rationale. Gate F governs the later blind validation of the selected candidate, not that earlier diagnostic review.

**What it means:** future runs cannot leave definition for concepts, or leave reconciliation for validation/build, merely because later artifacts already exist.

## Apply the full package only where the whole application is in question

Applicability uses separate fields for the change's extent and `design_intent`; one field must not mix scope, lifecycle and approval.

| Declared extent | Treatment |
|---|---|
| New application | Full definition of the proposed application boundary, including access, recovery, roles and non-happy paths. Direction work applies. |
| Whole-application rethink | Full application definition. Reference accepted page contracts and their evidence; enumerate how each page participates in the whole. Do not re-design every accepted page. |
| Bounded preserve/refit | No new full package. Record the affected surface roster, preserved contracts and why the change does not alter application structure or behavior. Existing judged-screen obligations still apply. |
| Bounded feature rethink | Define the affected journeys and shared contracts under the existing scoped design method. Do not demand a fleet or application-wide retrofit. Expanding navigation, role boundaries or cross-app lifecycle reopens the scope decision. |
| Research memo, standalone static page, infrastructure-only work | Reviewed non-applicability with the relevant existing method. No fictional pages or journeys invented to satisfy this gate. |
| Missing or conflicting declaration | Block application concept/implementation dispatch until the owner resolves the scope. Do not silently default to preserve. |

The product owner owns the application boundary and exclusions. A designer/analyst authors the definition. A reviewer checks completeness and contradictions against that boundary and the source evidence. The implementation owner verifies feasibility and supported versus simulated behavior. Existing authorization may cover these roles and actions; recording it is not a request to ask again.

A bounded exclusion cannot be asserted by deleting obligations from the candidate being scored. Its scope record is reviewed independently. Changes to that record invalidate dependent coverage. Unobserved personas and synthetic scenarios remain labeled hypotheses; they do not automatically block drafting. A missing decision about who may perform an action *does* block concepts that depend on that permission.

## Gate D checks a complete draft, not approved product requirements

Entry requires an identified owner, actor/job evidence, application boundary, preserved contracts, relevant source versions and authorization to draft. Existing-product work also brings observed current-state evidence and the required baseline review. An authorized investigation may gather missing evidence while dependent concept work stays blocked.

Gate D passes only when:

1. The BRD states the problem, outcomes, scope, exclusions and evidence limits. The PRD defines the product objects, behavior, permission rules and measurable acceptance. Stories connect actor jobs to requirements with stable IDs and concrete acceptance, including failure cases.
2. The page inventory covers the whole declared boundary: entry, exit, deep links, navigation context, access/recovery surfaces and role visibility. A page is a task surface, not necessarily one URL. Shared dialogs and sheets have explicit ownership and entry/return paths.
3. The interaction inventory enumerates actions, actors, object ownership, permission decisions, preconditions, source/destination states, side effects, feedback and recovery. Cross-page transitions preserve required context. Unsupported behavior is explicitly blocked or simulated; it is never depicted as proven service capability.
4. Every actor's in-scope job has end-to-end journeys in words and visual diagrams. Each path includes its trigger, prerequisites, steps, result, cancellation/return and failure/recovery branches. Both representations refer to the same page/interaction/state IDs.
5. Every page and action has an explicit disposition for applicable state obligations. Seed these from the canonical judged-screen state set and the domain's loading, denied, invalid-input, stale/concurrent-change, timeout/unknown-outcome and partial-success cases. Omitted and not-applicable are different states; exclusions need reasons and review. Actual accessibility testing remains later evidence.
6. Cross-links have no dangling references or unexplained orphans. A reviewer checks for *missing* obligations and contradictions against the independently owned scope, source capabilities and actor jobs. A graph with perfect links can still omit an entire job.
7. No unresolved decision affects the concepts' actors, permissions, core jobs, navigation boundary or required behavior. Other questions name an owner, blocked work and revisit trigger. Unsupported technical paths can be compared as clearly labeled hypotheses under a bounded concept authorization.

The [contract](contract.md) separates mechanical checks from substantive review. File existence, heading counts, word counts and an agent's `complete: true` are not completeness. Gate D confirms enough definition to compare concepts. It does not approve the product, spend, live actions or durable implementation. Concept authorization is distinct and must already exist or be obtained from the owner.

## Gate F reconciles selection and freezes an exact definition

Entry requires Gate D's reviewed baseline, the required divergent concepts on common representative scenarios, a human selection record and the record of useful elements taken from rejected candidates. Selecting a visual direction does not approve every product rule within it.

For every requirement, story, page, interaction, state, permission and journey ID, reconciliation records kept, changed, added or removed, with a reason. Preserve the earlier baseline. Changes that expand the application boundary require the owner's scope decision. Update the words, diagrams and acceptance criteria together. Review unresolved decisions again; anything affecting validation or the authorized build must close or explicitly exclude that work.

Gate F passes when the reconciled package passes Gate D's coverage checks, the selected candidate and its inputs match the reviewed versions, all dispositions are complete, and the product owner explicitly freezes that package. Record the source of human authority and its exact scope. A name typed into a JSON record is not verified authority.

Validation uses that frozen package for expected behavior. A blind reviewer sees the candidate and user tasks, without the author's rationale or preferred verdict; the conformance pass then uses the frozen contract. Preserve the existing order and review protocols. Durable implementation additionally needs the applicable technical design review, validation obligations and scoped implementation authorization. None is implied by a freeze.

**What it means:** drafting permission, concept permission, concept selection, product freeze and implementation permission remain separate facts. One owner message may authorize several; a tool must not infer the others from one.

## Current evidence must travel with each transition

Receipts bind the scope, package files, referenced source content, selected candidate, applicable review method and allowed action. Hash uncommitted files; a Git SHA alone does not identify dirty work. Keep old receipts as history. Derive current readiness again on status, advance, producer preflight and build handoff, including already-recorded phases.

- Changing requirements, an inventory, a permission, a journey, a diagram, a source capability or the review method invalidates the affected definition review and downstream freeze/validation/handoff evidence.
- Changing the selected candidate invalidates its selection-dependent reconciliation and review. A freeze cannot silently authorize a newer build.
- Changing scope or exclusions reopens scope acceptance. Deleting both an obligation and its implementation cannot improve coverage without a fresh scope decision.
- Unrelated repository edits do not invalidate the packet. A harmless edit inside the hashed inputs may conservatively require review during the pilot; do not silently normalize meaning-changing edits.
- Missing, stale, contradictory, malformed or unavailable evidence blocks the dependent action. Checker errors are reported separately from a substantive rejection and never converted to PASS. Blockers identify the affected ID, responsible role and evidence needed.

The host must verify human decisions from the configured authority source. Blueprint can check that an acceptance matches a candidate; it cannot authenticate a human from prose. No new identity service is proposed.

## The research prototype proves rejection behavior, not adoption

[gate.mjs](gate.mjs) implements an executable draft schema and coverage/freshness checks. [fixture.mjs](fixture.mjs) supplies an explicitly invented miniature application. [probe.mjs](probe.mjs) tests missing journeys, pages, transitions, permission decisions and state coverage, plus stale evidence, fabricated approval, exclusions and separate build authorization. [checks.json](checks.json) records the observed results and source hashes.

The stage integration test copies the existing engine into a disposable directory, adds an export for its private check registry, and registers the experimental check only in that process. Its flattened miniature stage model demonstrates blocking and re-derivation with the real derive/advance functions. It does **not** implement the proposed nested-phase API, producer dispatch checks, live authority adapter or consumer migration. The direct checker refuses approvals by default; only the synthetic test adapter can accept the invented records.

The fixture is deliberately small. It does not prove that all real application states were discovered, that the prose makes sense, that diagram rendering works, or that an owner accepted anything. A future pilot must review a real definition and demonstrate an omission the ordinary brief process misses. Compare that value with authoring/review effort. More files and passing controls are not product outcomes.

## Acceptance is the next boundary

Before changing shared behavior, the maintainer must accept the RFC's bucket (**methodology**, substantial), applicable scope and two-phase shape. The owner also chooses the first pilot, the accountable product owner/reviewer, and the trusted source for human decisions. The implementation plan is in [contract.md](contract.md#promotion-and-integration).

This proposal recommends application-wide coverage for new apps and whole-app rethink, with bounded changes excluded through a reviewed scope record. It recommends keeping technical implementation design as the separate scoped contract in the [existing proposal](../design-documentation-amendment/proposal.md), which is also not adopted. These proposals complement each other; neither silently promotes the other.

[RFC #65](https://github.com/nino-chavez/blueprint/issues/65) is filed and awaiting admin confirmation of its bucket and shape. After that confirmation, implement only the authorized opt-in change, run a real pilot and a bounded-refit control, then assess promotion. Recheck consumer migration state before editing `template/`, include a freeze acknowledgment and consumer-sync note in the eventual wave, and preserve historical consumer cursors. No wave number is reserved here. This request authorizes no push, production rollout or fleet-wide retrofit.

The recommendation changes if an existing accepted source already supplies this complete model; if a smaller existing gate can enforce both timing boundaries; or if the real pilot catches no consequential omissions beyond the current brief while adding duplicate maintenance. The appropriate response may then be a smaller contract or a consumer-local convention.
