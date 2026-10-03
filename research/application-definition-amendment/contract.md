---
canonical: false
status: experimental-contract-not-adopted
date: 2026-10-02
---

# Proposed application-definition contract

This is the implementation boundary of the [RFC](proposal.md). Names below are proposed research fields, not supported Blueprint configuration. `gate.mjs` owns the executable prototype's field lists; this document explains their meaning and the work needed for promotion.

Current review: [RFC #65](https://github.com/nino-chavez/blueprint/issues/65) was filed on 2026-10-03. The maintainer accepted the bucket, applicability and two-phase structure on 2026-10-03; see [rfc-acceptance.json](rfc-acceptance.json). A document-input prototype now reads mapped source documents; phase integration and trusted authority remain pending.

## One scope owns the inventory being checked

A project supplies one `application_definition` pointer to an owned manifest. The manifest references existing sources; it does not copy the BRD or PRD into a second narrative. Production paths should be explicit and relative to the initiative root. The prototype uses fixed local paths only to keep its experiment small.

| Record | Required content |
|---|---|
| Scope | For every extent: version; stable ID; accountable owner; application boundary; change extent; `design_intent`; source evidence; included/excluded jobs; for applicable full definitions, expected requirement/story/page/state/permission/interaction/journey IDs and per-page state obligations; for exclusions, an affected-surface roster and hashed preserved-contract/existing-method references; justified exclusions |
| Source | Path; content hash; artifact roles (BRD, PRD, stories, pages, interactions, journey words, journey diagrams). One file may serve several roles. |
| Requirement | Stable ID; source section; business outcome/job trace; product rule; acceptance. Keep BRD and PRD IDs distinct in real projects. |
| Story | Stable ID; actor; requirement references; Given/When/Then acceptance; evidence class needed for each criterion |
| Page/surface | Stable ID; task; source; roles; entry/exit/return context; related states and interactions. Includes dialogs, sheets, access and recovery; does not prescribe a URL per ID. |
| State | Stable ID; owning page/object; meaning; applicable obligation and evidence class. Domain state and display state must remain distinguishable. |
| Permission | Stable ID; actor; resource and action; scope; allow/deny decision; source and enforcement/deny expectation. A missing row is unresolved, never an implicit grant. |
| Interaction | Stable ID; actor, page/object and action; permission; guards; source/destination states; mutation/side effects; feedback; cancellation, reverse/retry/recovery behavior |
| Journey | Stable ID; actor/job/story trace; trigger/preconditions; ordered interaction path; terminal outcome; words and visual representation of the same path; alternate/recovery branches |
| State coverage | One disposition for every scoped obligation: covered with state IDs, or not applicable with a reviewed reason. A missing disposition blocks. |
| Open decision | Question; accountable owner; status; affected IDs; actions it blocks; permitted bounded work; evidence and trigger needed to resolve/revisit |
| Selection | Exact candidate and input baseline; artifact hashes; named human decision source; retained/rejected alternatives and graft rationale |
| Reconciliation/freeze | Prior reviewed baseline; selected candidate; current packet fingerprint; disposition for every prior/current ID; owner freeze receipt |
| Authority/review receipt | Kind, subject/scope, input/method fingerprint, verdict, actor/role, timestamp, source of authority and allowed action. Verified by the host, not by a name string in the artifact. |

Separate the inventory source from the scored definition. The reviewer checks it against actor jobs, source capabilities, current navigation and approved scope. Structural checks cannot discover a job absent from both lists. Complete means every obligation in an explicitly bounded, substantively reviewed application has a disposition; it does not mean all possible future features have been invented.

The research schema implements a subset: field presence, independent ID sets, source hashes/roles, cross-references, journey continuity, permission actor/action matching, denied mutation checks, state dispositions and reconciled IDs. It does not parse Given/When/Then, discover business omissions, infer feasibility or prove that a diagram communicates clearly. Those require substantive review. The miniature fixture combines BRD/PRD trace in prose; production needs explicit links between their distinct IDs. It retains a separate baseline directory with the scope, definition, source files and receipts; selection rechecks that snapshot through Gate D. A host still has to verify that the baseline review actually preceded concept work.

For the prototype only, journey diagrams use one Mermaid edge per transition (`S-1 -->|I-1| S-2`). An optional `diagram_nodes` mapping connects simple Mermaid node aliases to existing state IDs containing dots, slashes or colons; interaction labels retain the existing IDs. The checker compares edge IDs and mapped endpoints with the structured path. IDs containing a pipe or line break need a richer diagram adapter; the prototype does not cover them. This is a bounded test representation, not a proposed ban on richer diagrams or a rendered diagram acceptance. In production, generate diagram edges from the owned interaction graph or retain equivalent verifiable IDs. Review both the narrative and the rendered diagram for comprehension.

## Readiness and permission are separate results

Use readable phase states: **Missing**, **Ready for concepts**, **Awaiting selection**, **Reconciliation needed**, **Frozen**, **Excluded**. Report the current blocking IDs and owners beneath the state. In machine output, distinguish a failed predicate, unresolved human decision, stale receipt and checker error. The prototype maps all failures to the current engine's `absent` state with diagnostic codes; a production adapter should preserve those distinct reasons.

| Transition | Required evidence | Permitted next action |
|---|---|---|
| Start definition | Scope identified; input sources; drafting authority | Draft and investigate within scope |
| Definition -> concepts | Full structural coverage; current substantive definition review; no concept-blocking decision | Concepts, only under existing or explicit concept-work authority |
| Concepts -> reconciliation | Same reviewed baseline used for alternatives; required scenario coverage; human selection; graft record | Reconcile the selected direction |
| Reconciliation -> freeze | Current coverage/review; complete delta dispositions; no validation/build-blocking decision; explicit product-owner freeze | Freeze the requirements; begin authorized selected-candidate validation |
| Freeze -> durable implementation | Freeze still current; existing validation gates; applicable technical design readiness; scoped implementation authority | Build only that approved scope |

Do not infer a later permission from an earlier transition. Do not require repeated permission if the existing human authorization already covers the action. A host adapter may represent one authorization in several scoped receipts after checking its actual wording.

The default prototype authority adapter always rejects. The synthetic adapter exists only in `fixture.mjs`; it is not a real authorization provider. Adoption requires a tested host adapter that validates roles, provenance, scope, chronology, expiry/revocation and the action authorized. No current CLI command may be advertised as providing that verification.

## Read existing documents without rewriting them

The research checker now has an explicit document-input mode. Run it against a
source snapshot with a separately owned JSON mapping:

```text
node research/application-definition-amendment/gate.mjs --documents <source-root> <mapping.json>
```

This command inspects sources. It does not advance a stage or authorize work.
Its exit code is 0 for successful source checks, 1 for source/mapping findings,
and 2 for a CLI or input-file error. Read the returned `state`, `authority`, and
`allowed_actions`: even clean input returns `pending`, `not-verified`, and `[]`.
The original `evaluate(root, phase, authority)` still requires the structured
packet; a failed structured check never falls back to document inspection.

The mapping has `version: 1`, a declared `scope`, `sources`, and `inventories`.
Scope names `id`, `owner`, `boundary`, `extent`, `included` jobs, and `excluded`
jobs. The declared owner is metadata, not authenticated authority. Extents are
the existing new/whole/bounded/non-application values. Bounded input must name
excluded jobs and still needs substantive scope review.

Each source names its relative `path`, pinned `sha256`, `roles`, and explicit
`scan_references` boolean. Roles use the artifact roles above, plus `context`
and `contract`. One source can serve multiple roles. Whole/new-application
input needs every application artifact role; a bounded input requires BRD,
PRD, and stories without demanding a new whole-application diagram. Role labels
do not prove that a document fulfills its job.

Each owned inventory names `name`, `prefix`, minimum `digits`, `source`, and
`format` (`heading`, `table`, or `list`). For example:

```json
{"name":"stories","prefix":"US-","digits":2,"source":"docs/stories.md","format":"heading"}
```

The extractor preserves IDs and records file/line locations. Definitions are
IDs at the start of a Markdown heading, first table cell, or list item, with
optional bold or inline-code markup. Fenced examples do not define records.
References are inspected only in declared namespaces and opted-in files.
Fenced code examples are excluded; Mermaid diagram references are checked.
Numeric ranges and slash shorthand are expanded; unsupported descending,
cross-section, or over-200-step ranges fail. This is a bounded Markdown
extractor, not an inference engine for prose relationships.

An inventory omitted from a public export can declare `source: null`, an
`unavailable_reason`, and `evidence: {source, text}` pointing to an exact passage
in a declared source. Omit `format`. Its references remain explicitly
unverified in `external_references`; they are never counted as resolved.
Missing local inventory files, in contrast, are errors. Source paths cannot
escape the declared root, including through symlinks.

The result includes source hashes, source-located IDs/references, unresolved
external references, and a fingerprint covering the mapping, actual source
bytes, adapter method, and gate entry point. Changing a pin creates new input;
it does not restore a prior approval. Prose permissions, state coverage,
actor handoffs, branches, decisions, and rendered comprehension still need
substantive review. No JSON application definition or acceptance receipt is
manufactured from prose.

Three input approaches were compared against the two captured document sets:

| Approach | Decision |
|---|---|
| Convert prose directly into the full structured gate schema | Reject for this step: the sources do not supply every machine field, and filling them would invent reviewed semantics. |
| Keep one source mapping and inspect owned IDs/references | Select: source identity and broken references are mechanically testable while semantic review stays explicit. |
| Write a separate parser for each project | Reject: their heading/table/list conventions fit the same small extractor. |

Retain source locations and fingerprints from the conversion approach, but
omit inferred approvals and transitions. Retain explicit file/ID ownership
from project-specific parsers, but keep consumer paths in their local mappings.
Private mappings and reports stay outside the public packet. The focused
controls are in `document-input.test.mjs`. Repeat `--case <source-root>
<mapping.json>` to run stale-source, unknown-reference, and deleted-definition
controls on disposable copies of real snapshots. Originals are rehashed to
verify preservation. The separate structured/engine
controls remain in `probe.mjs`.

## Promotion and integration

1. **Complete pilot setup for the accepted RFC.** Filing and admin acceptance of bucket, shape and applicability are complete. Before implementation begins, name the pilot, its accountable product owner/reviewer, and the trusted source for human decisions. Keep the RFC open through implementation review.
2. **Add opt-in ordered phases to the existing engine.** Preserve existing stage IDs. Add validated `phases` beneath a design-stage definition and an explicit phase cursor/order; do not encode phases as fractional numbers or reuse the existing numeric-stage comparison for strings. Existing models without phases retain current behavior. The proposal's research test flattens phases to temporary integer stages; it does not verify the new schema implementation.
3. **Bind the definition gate.** Add the owned manifest schema/checker and a substantive review receipt contract under `template/tools/lib/`, then bind `application-definition-draft` and `application-definition-freeze` in the applicable opt-in design stages. Mechanical gates are derivable and cannot be bypassed with `--assert-*`. Root versus nested `blueprint/` resolution must choose one declared manifest; never take a passing packet from the wrong scope under the current best-of-two fallback.
4. **Enforce entry as well as exit.** `stage status` reports the current phase, allowed next actions and blocked actions. `stage advance` rechecks the entire dependent prefix, including recorded phases. The concept-producing skill and authorized worker-brief path must query this preflight before concept dispatch. Validation/build/handoff paths do the same for the freeze and implementation permission. A tool does not prevent an unrestricted agent from editing files outside the workflow; document that boundary. Do not claim the CLI dispatches producing skills today.
5. **Preserve review boundaries.** Existing screen-composition, design-system, baseline cold review, selected-candidate cold/conformance and implementation-design responsibilities remain owned where they are. A new definition review checks scope/coverage/contradictions; it does not become an art director or replace product approval.
6. **Expose the same result in doctor.** Extend the workflow readiness section, not the environment-health result. Unknown/malformed selected schemas fail closed for the action; no silent fallback to a cheaper legacy model. Re-derive from current sources, not the stored cursor alone.
7. **Prove it on cases.** Pilot one authorized new/whole-app definition and one bounded refit. The owner confirms a real omission caught, remaining unknowns and maintenance cost. Keep the provided synthetic tests, but do not count them as consumer acceptance.
8. **Promote only after review.** Amend `METHODOLOGY.md`, variant selection, judged-screen timing, the template configuration, stage/reviewer bindings and producing skills together. Re-run stage-model, reviewer-registry, doctor and stamp tests; verify a fresh stamp through the public CLI path. Include root/nested layouts, all variants, custom models, old cursors, checker errors, stale review-method hashes and skipped-phase attempts. Run `test:core` and the manifest check for the actual shipped change. Check external migrations before `template/` edits and record the wave/freeze/sync note. No automatic consumer rewrite or pin change.

A phase extension is the accepted direction for the opt-in implementation. The research fields above are not supported configuration until the implementation and its reviews land. The source-document trial does not finish implementation-pilot setup: its accountable reviewer and trusted decision source still need to be bound before enforcement. The previous [implementation-design proposal](../design-documentation-amendment/proposal.md) remains separate and unadopted.

## Run the bounded experiment

From the Blueprint worktree, run `node research/application-definition-amendment/probe.mjs`. It uses temporary directories, records `checks.json`, then removes only its own fixtures. It makes no network calls. All authority and application records are synthetic. The experiment never writes a consumer, the root `blueprint.yml`, a distributed template or a live stage cursor.

The engine test creates a disposable copy of `template/tools/lib/`, appends an export of its private check registry, and injects this prototype into that copy. Review this instrumentation when assessing the evidence. The original engine supplies the derive/advance behavior; the proposed phase schema and real authority integration remain work for an accepted implementation.
