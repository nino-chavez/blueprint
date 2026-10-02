---
canonical: false
status: proposal-not-adopted
date: 2026-10-02
blueprint_base_revision: 4aaed42
template_changed: false
---

# Close design decisions before implementing the work they govern

Require a reviewed design contract for the next durable implementation change. Reuse the requirements, prototype, decisions and tests already owned by the project. Add only the missing decisions and links. Pilot this as a manual prerequisite in the wedding build before adding a shared gate or changing Blueprint defaults.

The wedding handoff already describes much of the intended system. Its remaining gap is that an engineer must still choose important details while writing code: database constraints, precise permissions, operation inputs and results, and recovery rules across service boundaries. A stack decision does not settle those choices. More documents would not necessarily settle them either.

Blueprint should make that unfinished work visible at the point it matters. Experience design, information architecture and art direction still lead the prototype. Functional and technical design develop alongside it. Decisions that govern a particular implementation must close before that implementation starts; unrelated future decisions can remain open.

**Reader and decision:** Nino decides whether to authorize a bounded consumer pilot. The Blueprint maintainer needs an implementation path if the pilot earns promotion. This is a practitioner-level decision proposal, not a product specification or an authorization to build. Frozen requirements, human selections, evidence classes and source revisions remain exact. The writing borrows the voice guide's evidence and clarity rules, not its blog cadence.

**Review packet:** [evidence and limits](evidence.md), [implementation and test sequence](implementation-plan.md), [proposed wedding amendment](consumer-amendment.md), [review and checks](review-and-checks.md), [source fingerprints](source-snapshot.json), [current gate reproduction](current-gates.json).

## Existing rules leave implementation readiness unproved

| Existing owner | What it requires or supplies | What the inspected code establishes |
|---|---|---|
| `METHODOLOGY.md`, Stage 2 | Design principles, design dictionary, testing baseline; intent-specific experience work | Greenfield `principles-doc` finds a matching document. It does not test backend design completeness. |
| Optional Foundation S-B | Shared scope, route archetypes, layout and component contracts | Written reviewer exists; no executable counterpart or built-in S-B stage binding was found. Its subject is UI structure. |
| Stage 5 Documents | Technical Feasibility and Integration Plan alongside strategy and research; not all are required | Greenfield requires a decision document and runs `doc-quality-auditor`. That executable reviews figure attribution in selected deliverables, not implementation contracts. |
| Stage 8 handoff convention | Per-feature spec, acceptance, nonfunctional requirements, failure states, accepted render, decision links and owner | Actor-gated declaration check. Per-feature assembly remains deferred. A solo implementer may legitimately have no receiving team. |
| Proof-obligation registry | A named claim, enumerated scope, appropriate proof method and freshness | Structural validation of obligation declarations. It does not run the referenced proof methods or supply a design reviewer. |
| Refounded semantic core | Claims and evidence tied to exact candidates, with explicit authority | Existing native pilots can express design readiness as a claim. The research contract remains subject to its distribution ceiling. |

The [reproduction](current-gates.json) supplies a stack ADR without a design contract: the Documents gate passes. Contradictory permission prose also passes the mechanical document reviewer. A known attribution defect does fail, so this is a coverage limit, not a claim that the reviewer does nothing. A minimal declared handoff passes its individual stage gate without feature contracts. These are component-level results, not proof that the entire pipeline or actor-output validator accepts the fixtures. Source details are in [the evidence table](evidence.md#current-requirements-and-enforcement).

**What it means:** extending the existing document-quality rubric alone would leave the important design question unanswered.

## Consumer evidence supports explicit contracts, not a universal document package

| Case | Directly checked evidence | Supported conclusion and limit |
|---|---|---|
| Wedding, before durable implementation | Frozen requirements and experience inventory; current stack decision and handoff; no receiving app directory | Precise schema, permission and operation choices remain open despite substantial design work. No implementation defect or customer outcome is established. |
| Subscriptions consumer, historical implementation | Producer and reader at `8b75791a^` disagree on namespace and payload; the fixing diff and current shared imports resolve that mismatch | A boundary contract needs one owner and a real producer/consumer test. This does not prove that an extra pre-build document would have prevented the incident. |
| Rally HQ, shared UI structure | Consumer amendment plus current route registry, test adapter and coverage test | Shared design decisions need an owner beyond feature specs. This is an IA/layout precedent, not independent validation of a backend-design gate. |

The cross-project need for owned contracts is established at this narrow level. A candidate-specific implementation-readiness review is a promotion candidate. The wedding's relational model, OTP assumption and hosting choices are consumer-local. No second consumer has prospectively demonstrated the proposed checkpoint in this research. [Primary-source detail and counterevidence](evidence.md#consumer-cases).

**What it means:** approve a pilot of the contract, not a fleet-wide gate. The existing [amendment convention](../../template/docs/methodology/methodology-amendments-convention.md) and [classification pattern](../../docs/patterns/amendment-classification-pattern.md) already provide that path.

## A scoped review fits more cases than another universal stage

| Approach | Wedding durable save | Existing product change | Memo or static page | Tradeoff |
|---|---|---|---|---|
| Strengthen only Documents and team handoff | Adds detail late; solo work can bypass team handoff | Fits a receiving team, less well a small local change | Little extra ceremony if actor-gated | Smallest code change, but wrong boundary for many implementations. |
| Add an engineering Foundation stage before feature work | Makes shared decisions explicit early | Risks demanding a retrofit of unaffected architecture | Requires broad exemptions | Easy to name, but conflates prototype exploration with implementation readiness and adds another cursor problem. |
| **Review the next implementation scope using existing contracts** | Reviews the schema, authority and save semantics before that slice | Reviews only changed boundaries and their dependencies | No engineering package without relevant implementation work | Requires explicit scope and review discipline; can later gain a small opt-in checker. **Recommended.** |

Keep the first option's per-feature trace and receiving-owner acceptance. Keep the second option's early ownership of cross-cutting decisions. Leave out a new numbered stage, a mandatory document set and blanket retrofit. Use the existing proof-obligation pattern: enumerate what the change promises, then assign an appropriate check to each promise.

```text
Experience direction and requirements
  Prototype + functional design + technical exploration
    Selected implementation scope and affected shared contracts
      Design review: decisions closed, evidence current, exclusions explicit
        Implement that scope
          Behavior tests -> release checks -> observed use
```

Design review authorizes no external action by itself. It also cannot turn a planned test into passing behavior evidence.

## The contract answers questions; it does not demand separate files

For each scope, record the intended change, accountable implementer, requirement set, candidate revision, affected shared contracts, exclusions and allowed next action. Then answer the applicable questions below. An existing feature spec, handoff, schema, typed interface or decision record can supply the answer.

| Concern | Minimum answer before the corresponding implementation | Smallest useful representation |
|---|---|---|
| Functional behavior | Actors and jobs; domain objects; allowed actions; guards; saved versus draft state; success, denial, failure, cancellation and recovery; acceptance references | Object/action/state table and concrete examples, linked to the prototype where observable |
| System structure | Responsibilities; external dependencies; trust boundaries; source of truth; ownership of shared policy | Component/responsibility table or a context/container sketch |
| Persistent data | Identity and relationships; cardinality; keys and constraints; lifecycle/deletion rules; migration impact; source of derived values | Schema or typed model plus invariants; relational diagram when relationships are hard to follow |
| Authorization | Actor/resource/action permissions; tenant or ownership scope; delegation/revocation; enforcement location; deny behavior | Permission matrix with negative cases; UI visibility never stands in for enforcement |
| Operations and consistency | Callable operation and caller; input/output and errors; validation; transaction boundary; ordering, concurrency, retry/idempotency and external failure where relevant | Typed signatures or an interface schema, transaction pseudocode and representative sequences |
| Quality and operation | Relevant measurable quality constraints; runtime/environment boundaries; secrets/configuration ownership; deployment/migration order; observability, recovery and backup obligations | Environment table and runbook; explicit unknowns with a due boundary |

These are applicability prompts. A static page has no invented database or tenant model. A local tool still needs a file-loss/recovery contract if it edits valuable files. A framework-internal action needs an exact callable contract, not a separate REST service or an OpenAPI file by default. A standard library function may need a signature and failure test rather than a sequence diagram.

Use current vendor guidance and an applicable internal implementation before choosing infrastructure details. That rule already exists in the operator's canonical-pattern-first guidance; this proposal supplies a place to reference the result, not another copy of the vendor instructions.

## Diagrams earn their place by resolving a reader's question

Use a diagram when topology, ordering, branching or cardinality is materially easier to review visually. Name that question, the source it renders and the intended reader. Otherwise retain the table, signature or numbered sequence. There is no target diagram count.

- Use a system view to expose separately reachable services and trust boundaries that a stack list hides.
- Use a sequence for cross-service ordering, concurrency or a retry that could duplicate a change. Cover the consequential alternate path, not just success.
- Use a state diagram when allowed transitions are difficult to check in a table. Keep state axes separate, such as answer value and save progress.
- Use a relational diagram when relationship cardinality matters; the schema still owns keys, constraints and deletion behavior.
- Use a deployment view when environment separation or release ordering is unclear from the environment table.

Keep diagrams beside their owning contracts, with source references and a revision. Generated views derive from that owner; hand-authored views participate in the same review and freshness check. Contradiction between a diagram and its owner is unresolved work. Render and inspect any diagram used in the review; successful parsing is not evidence of legibility or correctness.

This selection follows [C4's guidance to use only useful levels](https://c4model.com/diagrams), its [selective use of dynamic diagrams](https://c4model.com/diagrams/dynamic), and arc42's [representative runtime scenarios](https://docs.arc42.org/section-6/) and [environment views](https://docs.arc42.org/section-7/). These are authoring guides, not evidence that this Blueprint amendment improves outcomes.

## Readiness belongs to a scope and candidate

Separate applicability from evidence. Present three reader-facing states:

| Display | Meaning | Consequence |
|---|---|---|
| **Ready** | Applicable decisions are resolved; sources and references are current; the required structural checks and substantive design review cover this exact scope | Implementation may begin within existing authorization. Runtime and release claims remain unproved. |
| **Missing** | Required work is absent, unresolved, unreviewed, stale or contradicted | Name the reason, owner and affected work. Hold that work and its dependents. |
| **Not applicable** | A named concern does not apply to this scope, with a reviewed reason and no dependent obligation that needs it | Exclude it from required coverage. An empty file or omitted row cannot establish this state. |

Do not author a free-standing `ready: true` field. Derive readiness from obligations and compatible review evidence. The scope's requirement inventory is owned outside the checklist being checked. Review exclusions against that inventory so deleting a difficult row cannot make the report greener. A reviewer must also look for missing requirements; structural coverage cannot prove the inventory complete. The [receipt contract and machine-result mapping](implementation-plan.md#3-build-a-consumer-local-checker-only-for-demonstrated-mechanical-gaps) distinguish a valid record from its substantive verdict, and both from a checker error.

An open decision names its owner, affected scope, blocked actions and required evidence. If it changes permissions, data identity, irreversible behavior or the contract of the next operation, that operation stays Missing. A bounded technical spike may proceed under its own scope and disposal/retention rule. A documented assumption may permit reversible work only with the authorized decision-maker's acceptance and a named invalidation trigger. It never becomes a settled product decision through implementation.

Changing a cited requirement, schema, prototype contract, decision, interface or review method invalidates the affected review and dependent scopes. Preserve the older receipt. A harmless edit outside those inputs should not reopen the scope. Candidate IDs alone are insufficient: bind local uncommitted work by content hashes and committed work by an exact revision plus relevant inputs.

## Depth follows the change and its risk

| Lifecycle or risk | Appropriate scope |
|---|---|
| Research or disposable prototype | Preserve experience direction, functional hypotheses and simulation limits. No claim of implementation readiness is needed. |
| Simple static or local change | A small spec or existing file can own the contract. Review applicable behavior, dependencies and failure risk; explicitly exclude irrelevant infrastructure. |
| New authenticated, persistent product | Establish shared identity, data and authorization contracts before dependent feature code; refine operations per slice. |
| Midstream feature | Review the delta, its callers, stored data, compatibility and affected shared contracts. Reuse unchanged accepted contracts. |
| Brownfield audit | Record observed behavior separately from the target. Do not demand historical documents before diagnosing; design the authorized remedy before changing it. |
| Destructive data change, payment, privacy or external side effect | Resolve the affected transaction, compatibility, failure, recovery and authority contracts before implementation. Add an independent domain review appropriate to the risk. |
| Release or real operation | Close environment-specific deployment, recovery and evidence obligations then. A local implementation review cannot prove hosted access, restoration or customer success. |

The high-risk boundary cannot be deferred merely by calling the project an MVP. Conversely, a backup retention choice for future real data need not block an isolated fictional local experiment. The experiment must name that exclusion and cannot graduate itself into real use.

## The wedding pilot preserves the selected experience and fills precise gaps

The source remains the frozen v0.4 definition and selected A+C direction. The technical decision is a dated overlay, not a rewrite of those files. The current handoff already contains all the partial answers listed here; each row names the remaining work, not a missing document title.

| Concern | Current evidence | Next design work and boundary |
|---|---|---|
| Functional design | BRD/PRD, atomic stories, experience JSON and journey/state inventory | Map the first durable scope to exact criteria and resolve any decision that affects it. Keep prototype checks distinct from production criteria. |
| System structure | Stack ADR's text tree and responsibility table | Label browser, Worker, Auth, database API and preview boundaries, including direct database access. A small system diagram may make this clearer. |
| Data | Domain objects and invariants; one answer per person/question | Define concrete entities, keys, foreign keys, cardinality, uniqueness, archive behavior and cross-wedding constraints before migrations. |
| Permissions | Membership/delegation rules, RLS requirement and explicit inert-preview design | Enumerate read/write operations by actor and resource; bind each to its enforcement point and deny tests before handlers/policies. |
| Save and correction | Transaction/version/idempotency guidance and current-state recovery | Specify exact operation inputs/results/errors, receipt lookup, version conflict and concurrent scope-change behavior. Review one shared-save sequence and its correction/uncertainty variants. |
| Entry, preview, recovery | Managed OTP demo assumption, request identity guidance, sandbox preview and two-gate onboarding | Define operation/state transitions and failures. Entry suitability remains a product assumption, not accepted guest evidence. |
| Operations | Three environments, deployment order, ownership and restore expectations | Close resource identities, sender, access roster, cost and recovery parameters only before the actions that need them. Production restoration remains an observed release/operation obligation. |

For the first durable save: trace `BR-03/06/07 -> FR-04/06/07/10 -> US-04/06/07/08/11` to the relevant experience IDs, the new operation/schema/permission contracts, then the named tests. Include `AC-02.5`, `AC-04.3/4`, `AC-05.4/6`, `AC-07.4`, `AC-08.4`, `AC-10.4` and `AC-11.4` where their behavior is in scope. Add the handoff's `M-02/M-03` negative-permission and real-persistence checks. This is an example trace, not a declaration that all these criteria already pass or that the list is complete.

The technical handoff calls out D-12/D-13 for event editing. Those decisions need not block a save against seeded, already-valid events if the scope explicitly excludes event editing. They must close before those editing paths ship. Authentication and concurrent authorization choices that affect that save cannot be similarly deferred.

**Pilot verdict today: Missing for the first durable slice.** The existing design work is useful and remains the source. No new schema, API contract or engineering review has been produced or accepted here. The [consumer entry](consumer-amendment.md) is ready for the owning chat to review and apply; it has not been appended there.

## Promotion depends on evidence the pilot has not produced

Use the [phased implementation plan](implementation-plan.md). First apply the consumer learning, define and review one actual slice, and record what the review changed. The wedding owning chat checks the handoff's proposed `Implementation design readiness` section and exact review record before issuing a durable-code brief. This is a manual prerequisite, not an installed automatic gate. Then test the same contract on a contrasting consumer and a simple non-applicable case. Compare against the existing handoff process, including authoring effort, decisions discovered, reader comprehension and missed contradictions. Do not count files or diagrams as success.

The recommendation would change if the wedding's next engineer can answer the missing questions from an existing source we missed; if a revised handoff rubric performs as well with less work; if the scope contract duplicates the native claim source; or if prospective use adds ceremony without catching consequential decisions before implementation. Any of those can justify stopping at a consumer-local convention.

Operator judgment remains on pilot authorization, the consumer's allowed implementation scope, who can accept product assumptions and exclusions, and whether a later measured result earns opt-in distribution. No new recurring approval is proposed for routine implementation choices already covered by the contract. Public-default enforcement would require separate evidence and authorization.

## Provenance and delivery limits

Reviewed Blueprint at `4aaed42`, with direct source reads, a narrow executable reproduction, consumer source comparisons and fetched primary documentation. The [evidence record](evidence.md) distinguishes direct observations from historical reports and proposals. No claim here relies on the parent's interpretation as verification. No UI quality verdict, production test, cloud inventory or customer observation was performed.

This packet changes research files in the isolated Blueprint worktree only. It implements no gate, changes no template, edits no consumer and alters no historical stage state. The repository commit containing this packet records its publication. The later [wedding pilot result](pilot/outcome.md) records the accepted scoped design; shared gates remain unimplemented.
