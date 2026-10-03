# [RFC] Define the application before whole-application concepts

Add two checked phases inside the existing design stage: define the whole application before comparing concepts, then reconcile and freeze that definition after human selection. This is a proposal for maintainer review. No shared behavior or consumer has changed.

### Fix-location bucket

methodology — METHODOLOGY.md / docs/ / a taxonomy or stage definition

### Change kind (routes RFC vs plain PR)

substantial — changes what may proceed; RFC first, admin confirmation before an implementation PR.

### Consumer that surfaced this

Aisles operator application. Private consumer drafts supplied the sequencing case; their contents and local paths are not published here. Gather Here supplies a public comparison for requirements, freeze, and separate build authority.

### Problem

Individually designed pages can leave a whole application undefined. A concept can look connected while omitting a role's job, a permission decision, a failure state, or a route back.

The existing experience brief is useful, but a filename gate does not establish complete application coverage. Adding requirements only to the design stage's exit would also be too late to govern concept work inside that stage.

### Evidence (required — never an imagined case)

- At Blueprint revision `363381459f3d4dfd15c017992be515d498a62532` (current `main` when checked on 2026-10-03), [greenfield Stage 2's `principles-doc` gate](https://github.com/nino-chavez/blueprint/blob/363381459f3d4dfd15c017992be515d498a62532/template/tools/lib/stage-model.mjs#L415-L420) uses `name-match`. It searches for a design-document filename; it does not inspect the linked application inventories proposed below. This is a claim about that individual gate, not a claim that the whole pipeline passes.
- [Gather Here's public BRD](https://github.com/nino-chavez/gather-here/blob/06e5e346519f0011ce68b9c2f6bd2d088050e683/docs/brd.md) says to freeze the baseline before prototype testing and explicitly separates requirements from build authorization. This supports keeping definition, validation, and authority distinct. It does not establish a complete public inventory or prove the historical authoring order.
- A local, unpublished research prototype passed 37 deliberate controls covering omissions, changed inputs, synthetic authority, selection/freeze gaps, exclusions, and separate build permission. Its stage-engine experiment injects a checker into a disposable copy. These are synthetic mechanical results; they do not prove real application completeness, product benefit, adopted phases, or a real human-authority adapter. The local packet has not been pushed and is not publicly inspectable through this issue.

The public source URLs were fetched and checked against the inspected content. Private case excerpts, private screenshots, local file links, and local preview URLs are intentionally absent.

### Proposed change

**Keep existing numbered stages.** Add ordered phases inside the applicable design stage: greenfield Stage 2, midstream/brownfield Stage 3. Preserve existing-product blind baseline review before design rationale; the later freeze governs blind validation of the selected candidate.

1. **Draft before concepts.** Define the business requirements (BRD), product requirements (PRD), user stories, every in-scope page, actions, permissions, states, transitions, feedback, recovery, and end-to-end journeys in both words and diagrams. Reuse existing files and stable IDs. These are required kinds of information, not seven mandatory new documents.
2. **Check coverage and substance.** Cross-links must resolve, but a linked graph can still omit a whole job. Review against an independently owned application boundary, actor jobs, and source capabilities. Missing or conflicting scope blocks dependent concept work. Concept-blocking decisions must be resolved.
3. **Compare and select.** Compare the required concepts on common representative cases. Record the human choice and the useful parts retained from rejected alternatives.
4. **Reconcile and freeze.** For every requirement and inventory ID, record what stayed, changed, was added, or was removed. Update the words, diagrams, and acceptance criteria together. Preserve the earlier baseline. The product owner freezes the exact reconciled package before selected-candidate validation.
5. **Recheck before acting.** Bind reviews and permissions to their actual inputs. Changed requirements, scope, sources, selection, or review methods invalidate dependent readiness. Re-derive readiness on status, advance, producer preflight, and handoff. An old completed cursor cannot supply a current pass.

Apply the full definition to new applications and whole-application rethinks. A whole-app rethink may preserve accepted page contracts. Bounded preserve/refit work follows its current method with a reviewed exclusion; it does not trigger an application-wide or fleet-wide retrofit. Scope expansion reopens that decision.

Drafting permission, concept permission, selection, product freeze, and implementation permission remain separate facts. Existing authorization can already cover several actions; this proposal does not require asking again when it does. A typed approver name is not verified human authority. Durable implementation still requires the existing technical/validation checks and scoped build authorization.

### Maintainer decisions and implementation boundary

Confirm the methodology bucket, applicability, and ordered-phase structure. Name the first authorized pilot, its product owner and reviewer, and the trusted source for human decisions before implementation begins.

After acceptance, implement an opt-in path and test one real new-app/whole-app case plus a bounded-refit control. Preserve old models, numbered stages, and historical cursors. Check consumer migration state before editing `template/`; the eventual implementation needs the existing wave, freeze, review, and consumer-sync requirements. This RFC does not authorize push, rollout, or automatic consumer changes.

Reduce or withdraw the proposal if an existing accepted source already provides the complete model, a smaller gate enforces both timing boundaries, or the pilot catches no consequential omissions while adding duplicate maintenance. More documents or passing checks are not a product outcome.

### Pre-flight

- [ ] I recorded this in my consumer's METHODOLOGY-AMENDMENTS.md. This remains with the Aisles owning work; no consumer file was edited here.
- [x] For this substantial change, this RFC precedes an implementation PR.
- [ ] Admin has accepted bucket, shape, applicability, and pilot.
- [ ] The real authority adapter, ordered-phase implementation, and consumer pilot have been reviewed.

Process: [Blueprint contribution rules](https://github.com/nino-chavez/blueprint/blob/363381459f3d4dfd15c017992be515d498a62532/CONTRIBUTING.md#L40-L63).
