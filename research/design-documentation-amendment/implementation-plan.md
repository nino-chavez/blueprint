---
canonical: false
status: shared-implementation-proposed-pilot-reviewed-adoption-pending
date: 2026-10-02
---

# Pilot the contract before distributing a gate

Start with one reviewed wedding implementation scope. Keep the first pilot in the consumer's existing handoff and design files. The shared tooling below is conditional on evidence that a small checker helps; none of it is implemented by this packet.

## 1. Apply the learning and review one real scope

The wedding owning chat reviews and appends the [proposed amendment](consumer-amendment.md). It preserves v0.4 and `.blueprint/stage-state.json`. It records the implementation scope independently of the completed research run. Do not invent a receiving team, change the research variant or reset its cursor to make a new gate appear.

The implementing engineer extends `docs/mvp-build-handoff.md` with scope and design-readiness references. Keep stable architecture decisions in `decisions/0002-mvp-technical-target.md` or a superseding ADR. Put the concrete schema, permission and operation contracts in `docs/design/mvp-implementation-contract.md` if they cannot fit clearly in the handoff. These are proposed consumer paths, not files this chat may create there.

The source contract must state:

1. The exact requirement candidate and selected implementation scope, including exclusions and dependencies.
2. Applicable design questions and the owning answer for each, with trace to requirements and experience states.
3. Unresolved decisions, their owners, blocked actions and acceptance authority.
4. Planned behavior tests and their proof boundary; `NOT_RUN` is expected before implementation.
5. A substantive review of that candidate, with accepted findings or unresolved contradictions.

Use a separate reviewer for consequential design judgment. The reviewer works from requirements, domain constraints and the proposed design; it does not accept the author's completeness declaration as proof. A qualified agent can perform the technical review where permitted. Human product choices, visual selection and external-action authority stay with their existing owners. Record reviewer identity and method honestly; do not label an agent review human acceptance.

**Manual prerequisite and owner:** the wedding owning chat, acting within Nino's delegated authority, checks the proposed `Implementation design readiness` section in `docs/mvp-build-handoff.md` before issuing the first durable-code brief for each scope. That section names the scope/candidate, links `docs/design/reviews/<scope>-<candidate>.json`, lists unresolved decisions and states which work may proceed. The brief carries those same references. If the record is missing, stale or rejects the design, the owning chat holds the affected code assignment. Nino remains the decision-maker for unresolved product choices or expanded authority; this adds no approval round for routine choices already delegated.

This is a manual prerequisite; no command in the current CLI enforces it. Local compatibility spikes can run under their own bounded scope. Before the handoff's receiving app is created, its owner confirms the authorized scope and applicable lifecycle; this research chat does neither.

**Exit evidence:** the engineer can identify where each consequential design decision is owned and how each will be tested. Record the questions caught, decisions changed and work still held. No claim of product correctness or faster delivery follows from passing this review.

## 2. Compare the review with the existing handoff process

Use the wedding scope, a contrasting real consumer change, and a simple static/local case. The subscriptions incident and Rally layout evidence are retrospective controls; they do not count as prospective adoption of this proposal.

Before comparing, fix the selected requirement set, task and evaluation questions. Compare the existing handoff process with the scoped contract using the same material. Blind the evaluator to the arm when scoring judgment. Have the evaluator answer concrete implementation questions and identify seeded missing or contradictory decisions. Record authoring/review effort and any duplicate maintenance. Keep artificial defects labeled as test controls, not real consumer incidents.

The contract earns further work only if it exposes consequential design gaps the current handoff misses without forcing irrelevant documents or obscuring source ownership. No diagram/document tally is a success measure. If handoff-only works as well, use it and stop. Set any time or spending allowance with Nino before running a paid experiment; this plan supplies no new budget authority.

**Promotion limit:** manual review can succeed without a new shared validator. The proof-obligation registry already describes this kind of extension, but its broader promotion status does not change merely because this packet cites it.

## 3. Build a consumer-local checker only for demonstrated mechanical gaps

If the pilot needs automated coverage or freshness, first use the existing `spec-obligation-registry` contract: scope enumeration, proof method, tier, freshness and references. Its validator checks declarations; it does not execute the proof method. Do not present its `contract OK` output as design readiness.

Where a consumer already owns a requirements/obligations register, extend that owner and derive the readiness view. Do not add a second editable status ledger. An existing native-contract pilot may use its claims, dependencies and receipts instead; importing a new public native schema is outside this amendment.

For a consumer with no such owner, test one compact design index. The proposed logical shape is below; field names are provisional until cold authoring demonstrates they are usable. The index contains references and applicability, not copied requirements or prose architecture.

```text
Implementation scope
  id, candidate, allowed_action, owner, requirement_source, requirement_ids
  exclusions (reason + decision authority), dependencies
  sources (id, path, content hash)
  obligations
    id, concern, requirement_refs, contract_refs, dependencies
    applicability: required | not-applicable
    not_applicable_reason + accepting authority, where applicable
    proof method + tier + receipt reference, following the existing registry
  decision_refs, review_refs

Derived report
  scope + candidate
  ready | missing | not-applicable, with reasons per obligation
  structural result, judgment result, runtime evidence and authorization separately
```

Use a content fingerprint over the requirement inventory, selected design sources, dependencies, review method and receipt inputs. A revision number written into the same checklist is not enough. Resolve references within explicit project roots; reject missing paths, traversal, circular dependencies, duplicate IDs and unrecognized schema versions. Resolve current hashes before trusting a claimed snapshot. A supplied receipt cannot make its own stale inputs current.

Keep `missing` reasons explicit: absent, open-decision, unreviewed, stale or contradicted. Use this adapter table; do not introduce a second authorable status source:

| Condition | Reader result | Machine result / gate action |
|---|---|---|
| All required obligations structurally valid and accepted by compatible substantive review | Ready for the named implementation scope | Design PASS; allow that scope within existing authority |
| Required source/decision/review absent, unresolved or stale | Missing, with reason | PENDING; mapped reviewer returns BLOCKED because the existing reviewer API has no PENDING; refuse |
| Required substantive review rejects the design or a contradiction remains | Missing — contradicted/rejected | BLOCKED; refuse |
| Reviewed exclusion, consistent with requirements and dependencies | Not applicable | PASS-with-exclusion for that obligation only; no implementation claim |
| Opt-in not adopted | Design readiness not assessed | Advisory policy status; preserve legacy transition behavior, never infer an exclusion |
| Invalid schema/evidence or checker could not execute | Assessment error; no readiness verdict | BLOCKED/error diagnostic; refuse adopted check |

The structural checker can verify references, coverage and compatible receipts. It cannot establish whether the schema preserves the right business meaning or an exclusion is wise. The substantive review record supplies that judgment. Its minimum fields are:

| Field | Required content |
|---|---|
| Target | Scope ID, candidate ID, exact requirement/design/dependency hashes and review-method version |
| Reviewer | Identity, role, method, date, design author identity, and a reference establishing that this reviewer was separately assigned |
| Coverage | Applicable obligations examined, exclusions reviewed, and search for omitted decisions beyond the author's checklist |
| Findings | Requirement/contract references, consequence, disposition and unresolved items; an empty list must still identify the reviewed scope |
| Verdict | Accept or reject this design scope, with rationale; no behavior/release acceptance implied |
| Authority | The existing authority source for technical review and any separately required product decision or exception; no invented human sign-off |

Accept only when the target matches current inputs, the reviewer is distinct from the design author, every required obligation is covered, and no blocking finding or dependent decision remains. Identity strings alone cannot prove independence: the owning chat checks the assignment record and authority. A valid JSON record proves only **receipt valid**; its recorded substantive judgment supplies **design review accepted**. Overall Ready requires both, and must show both. Automated validation is not authentication of the author or reproduction of the judgment. Suspected fabricated or self-certified evidence is rejected pending that check.

**Suggested local scope:** `tools/implementation-design/` only if no existing consumer validator owns the work. Reuse the owner's test runner. Do not create a second checker for wedding experience-architecture IDs; call or consume the existing inventory validation instead.

## 4. Promote only the demonstrated portable portion

Recheck current Blueprint source, open amendments, live migration activity and freeze authority at implementation time. `blueprint fleet` reports registry pins; it does not prove that no migration is running. This proposal is not a freeze waiver. Split conceptual, template and reviewer amendments by fix location instead of assigning one entry several buckets.

If the consumer results warrant opt-in distribution, the following is the proposed source diff. Paths marked **new** do not exist as a result of this task.

| Owner path | Proposed change |
|---|---|
| `METHODOLOGY.md` | Briefly distinguish experience direction, iterative design, implementation readiness and release proof. Link the owned convention from Stages 2/5/8; no renumbering. |
| `template/docs/methodology/implementation-design-contract.md` **new** | Own applicability, concern questions, review requirements and ready/missing/not-applicable semantics. Prefer references to existing DoD, proof-obligation and judged-screen rules. |
| `template/docs/methodology/handoff-manifest-convention.md` | Add a reference to the scoped design evidence for applicable receiving-feature work. Preserve actor gating and receiving acceptance. |
| `template/docs/methodology/proof-obligation-registry-pattern.md` | Link the demonstrated design-obligation example and its evidence; do not silently promote the registry's broader candidate status. |
| `template/docs/methodology/examples/implementation-design.example.json` **new, conditional** | A small synthetic index only if the consumer pilot needs that carrier. Show a meaningful exclusion and missing decision; label it as an example. |
| `template/tools/lib/implementation-design.mjs` **new, conditional** | Dependency-free structural evaluation and derived report for the demonstrated index shape. It owns validation rules; the reviewer, stage and doctor adapters call it. Include self-tests. If an existing consumer register can supply the same report, adapt it rather than double-author. |
| `template/.claude/agents/blueprint/reviewers/implementation-design-reviewer.md` **new** | Own substantive design review questions, applicability judgment and evidence limits. Keep visual-composition judgment with the existing reviewer. |
| `template/.claude/agents/blueprint/reviewers/implementation-design-reviewer.mjs` **new, conditional** | Pair the structural evaluator with receipt checks. Export dynamic `inputs(root)` covering all referenced sources and the index. It must not claim to perform the `.md` semantic review by inspecting file presence. |
| `template/blueprint.yml` | Add a commented top-level scalar `implementation_design_contract` path. Read with the existing `ymlScalar` helper; no nested-block parser is assumed. No enabled default and no inferred opt-in from a filename or `design_intent`. |
| `template/tools/lib/stage-model.mjs` | Add a conditional `implementation-design` gate and mapped reviewer with `onWarn: block` for adopted scopes, as described below. Preserve existing models when undeclared. |
| `template/tools/lib/doctor.mjs` | Read-only view of the same selected scope. Keep tooling errors separate from unfinished design, and report policy-not-adopted distinctly from design-ready. |
| `template/CLAUDE.md` | Point pre-implementation work at the scoped review command and owned convention. Use the existing root guide delivery; do not add an independent AGENTS rule owner. |
| `bin/test-core.mjs` | Include the new module/reviewer regression checks if they land. |
| `WAVE-LOG.md` and the normal release/change record | Record measured scope, compatibility limits, freeze acknowledgment and receive path only after authorized implementation. No wave is claimed by this proposal. |

No global hook, Operator change, hosted service, diagram generator, new state engine or new CLI subcommand is proposed. The existing reviewer discovery and `blueprint review` route should suffice. Any need to change them is a new finding to justify, not assumed work.

## 5. Bind the gate without rewriting stage history

The proposed `implementation_design_contract` scalar selects one active implementation contract relative to the initiative root. Undeclared means not adopted; a declared empty value, duplicate key, unsafe path or unreadable target is an error. The adapter checks key presence separately from `ymlScalar`, which returns null for both absent and empty values. Explicit use of the unsupported `implementation_design` nested block produces a configuration error rather than silently disabling the policy. There is one selector and no fallback to an inferred file. Shared contracts remain separately owned and referenced; completing one slice does not approve the next one. Consumers with a native contract use its readiness claim as authority and derive any compatibility view; they do not author both statuses. A simultaneous independently authored native and legacy selection is a configuration error, not a precedence guess.

For adopted legacy product scopes, bind the same check at greenfield Documents (Stage 5), midstream/brownfield Documents (Stage 6), and applicable Handoff (Stage 8). The Handoff gate still adds nothing without a receiving actor. The **implementation review itself applies to solo work too**, so a solo builder does not need an invented handoff actor.

Those stage bindings are reporting and transition checks. They are not early enough to control all coding, because prototypes precede Documents. Require the existing `blueprint review implementation-design-reviewer --target=<initiative>` route immediately before durable implementation of each selected scope. This command is proposed, not currently runnable with that reviewer. Project-owned dispatch/build preparation must require its result. Do not wire it into the prototype build or a global shell hook.

This is an explicit invocation boundary: it cannot stop arbitrary coding commands or a worker whose brief omits the check. Claim enforcement only for the stage/dispatch path actually exercised. If the pilot shows that omission remains common, propose a separate enforcement change with its own owner and authorization.

No implicit rewind, no new stage number and no manual edits to historical `.blueprint/stage-state.json`. A completed research initiative stays completed for its earlier delivery. New design review evidence attaches to the new candidate. The known terminal-revision limitation remains a separate amendment; this gate must not pretend to fix it.

When opt-in is absent, preserve legacy behavior and say **design readiness not assessed**. Do not convert absence into a claim of not-applicability. When opt-in is present but its index/reviewer is missing or invalid, refuse the selected transition. Old clients cannot enforce a new capability: require a tested minimum version at opt-in and show an explicit compatibility diagnostic. Do not depend on old clients noticing an unknown configuration key.

## Tests must fail on the defects they claim to see

These tests are a future implementation plan. Only the [current narrow reproduction](current-gates.json) has run in this task.

| Deliberate input/change | Required result and test boundary |
|---|---|
| Requirement in the independent scope inventory has no design obligation | Missing with that requirement ID; removing the row must not shrink the denominator silently. |
| Stack ADR and all expected document filenames exist; schema/permission/operation content is absent | Missing or blocked substantive review. Presence is insufficient. |
| Required reference is broken, uses an unsafe path, has an unknown ID, or forms a dependency cycle | Structural error; no Ready result. |
| Contract sources change after an accepted review | Stale for affected obligations and their dependents; old receipt retained. |
| Unrelated copy file changes | Unaffected design evidence stays current. |
| Reviewer code or rubric changes | Prior review is not silently reused under a new method. |
| Guest-only requirement contradicts an all-users write contract | Semantic review rejects it. Structured contradictions may also be caught mechanically; free prose is never promised complete machine detection. |
| Diagram permits a write while the permission table denies it | Review identifies the conflicting owner/view and holds the affected operation. A rendered review checks the actual diagram. |
| An unresolved decision affects a required operation | That operation and dependents remain Missing. An independent bounded spike may remain allowed. |
| Permission or persistence marked not-applicable for a durable guest-save scope | Applicability review rejects the exemption. A static-page fixture with neither behavior is valid. |
| Author writes `ready`, supplies a self-authored checklist, or references another candidate's PASS | No promotion to substantive design acceptance; require the proper review evidence and exact inputs. |
| All planned test files exist but no behavioral runs exist | Design review may be Ready if the plan is adequate; implementation behavior remains NOT_RUN. |
| Producer/consumer contract diverges; both mocked unit tests pass | A test crossing the actual boundary fails. A known incompatible payload is rejected before trusting the positive case. |
| Authorization fixture deliberately permits a forbidden write; concurrency fixture drops a version check | Relevant behavior tests fail, then pass only after the defect is removed. These are implementation tests, not pre-code design proof. |
| No opt-in, no receiving actor, research-only work, existing S-B configuration | Existing stage behavior stays unchanged; no invented team or backend package. |
| Opt-in absent versus declared empty, duplicate, unsupported nested form or missing target; mapped reviewer cannot load | Distinct not-assessed versus error outcomes; declared missing checks cannot skip green. The supported top-level scalar must activate the checker. |
| Terminal research state inspected during a new candidate review | New review result returned without rewriting its historical cursor/assertions. |
| Dry-run, clean clone, package/stamp receive and legacy upgrade | No writes on dry-run; source references resolve without sibling repos; optional feature is delivered when declared; old consumers remain usable. |

After focused tests pass, run the owning module/reviewer tests, stage/doctor integration and `npm run test:core`. Test a clean packaged/stamped consumer before claiming distribution works. Do not broaden into production deployment or fleet restamping under test authorization.

## Rollout and reversal remain explicit

Ship opt-in only after the contrasting cases, cold authoring and compatibility tests support it. Existing consumers stay on their current pins and conventions until separately upgraded. Existing project instruction files are preserved by stamping; updating their guidance requires a reviewed receive step.

If the pilot is unhelpful, stop and retain its evidence. If a shared opt-in causes harm, record a scoped decision disabling that opt-in, retain prior contracts and reviews, and continue under the earlier supported path. Disabling a check does not turn unresolved design into Ready. No fleet migration, default mandate, commit, push or release is authorized by this plan.
