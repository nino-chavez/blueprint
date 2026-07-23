---
canonical: false
status: phase-0-complete-cold-author-passed
date: 2026-07-22
depends_on:
  - research/refoundation/13-compact-authoring-results.md
  - research/refoundation/14-refoundation-decision-and-migration-plan.md
prototype: research/refoundation/v2-shadow
template_changed: false
consumer_changed: false
---

# Phase 0 compiler and receipt hardening results

## Verdict

The root-only compact compiler, native-receipt, authorized receipt-correction,
and root dogfood gates pass. A compact source can now author claim-scoped
receipts and append-only corrections without editing normalized K1 JSON, and
the compiler rejects the principal authority, evidence, dependency, path, and
profile failures before producing an overlay.

Phase 0 is complete at research scale. A context-isolated author subsequently
passed the sealed exercise 34/34 in two self-corrected attempts, with zero
questions and zero methodology-creator interventions. That independent result
clears the usability gate for a separately authorized live-consumer pilot.

## Executed controls

`node research/refoundation/v2-shadow/test-compact.mjs` runs two positive
replays and twelve negative compiler fixtures.

### Positive path

- compiles `compact/fixtures/receipt-positive.yml`;
- deletes and rebuilds its generated overlay;
- proves the rebuilt overlay is byte-identical;
- runs the generated overlay through the read-only consumer shadow;
- validates the normalized document with K1;
- derives the exact claim as `satisfied`;
- derives its checkpoint as `satisfied`; and
- verifies generated JSON and Markdown contain no absolute user path.

The second positive path authors two compatible receipts for one claim, then
uses an authorized append-only disposition to retract the mistaken support in
favor of the corrected contradiction. K1 derives the claim and checkpoint as
`contradicted`; the mistaken receipt remains in the ledger with
`retracted-by-disposition` in its evaluation.

### Negative paths

| Fixture | Required rejection |
|---|---|
| unknown actor profile | profile is absent from the pinned profile set |
| unknown profile version | source requests an unsupported policy version |
| unauthorized re-charter | decision maker lacks `change-intent` authority |
| missing actor | claim actor is not chartered |
| unsafe evidence path | authored path escapes the consumer root |
| absolute path in prose | compiled public artifact would expose a machine path |
| unknown claim dependency | prerequisite does not resolve |
| dependency cycle | claim graph is cyclic |
| receipt oracle mismatch | receipt's `via` oracle differs from its claim contract |
| receipt self-certification | builder claims not-builder independence |
| unauthorized receipt correction | decision maker lacks `correct-receipt` authority |
| cross-claim receipt correction | replacement belongs to a different claim |

Every rejection includes the compact source file and a source line.

## Versioned policy

Compact sources now pin:

```yaml
schema: blueprint-compact/0
profiles: k1-research-0
```

The schema identifies syntax. The profile set identifies actor authority and
evidence recipe policy. Changing either requires an explicit compatibility
decision; a compiler may not silently reinterpret an existing profile name.

## Native receipt contract

A compact native receipt authors only encounter-specific facts:

```yaml
receipts:
  - id: solo-operation-receipt-1
    claim: solo-operation-observed
    result: supports
    via: observed-task-run
    observer: operator
    role: operator
    source_version: current
    at: 2026-07-22T11:30:00Z
    observation: The operator completed the declared operation and recorded its result.
    source: de-identified encounter record
```

The compiler reuses the claim's evidence object and governing scope. It rejects
an oracle mismatch, observer/role mismatch, missing required independence,
builder self-certification, scope replacement, missing freshness version, or
undeclared observer. This removes repetitive fields without allowing the
receipt to redefine what it proves.

`could-not-observe` compiles with `oracle.executed: false`; support and
contradiction compile with an executed oracle. A source-versioned claim requires
`current` or an exact recorded version, so stale evidence can be represented
honestly rather than rejected or upgraded.

## Receipt contradiction and correction policy

The research policy is now explicit:

1. **Receipts are append-only.** Never edit or delete a receipt to improve a
   claim state.
2. **Compatible contradiction wins.** If the same current claim has compatible
   support and contradiction, the claim is `contradicted` until disposition.
3. **Time alone does not supersede evidence.** A newer timestamp does not erase
   an older compatible contradiction.
4. **Version boundaries do normal historical separation.** When a claim
   requires the current source version, receipts for prior versions become
   stale rather than conflicting with the current observation.
5. **Mistaken receipts require an authorized append-only correction
   disposition.** It must identify the bad receipt, decision maker, authority,
   rationale, and replacement or invalidation effect. Silent retraction is
   forbidden.
6. **Correction is an explicit authority.** The deciding actor must hold
   `correct-receipt`; normal work, observation, or disposition authority does
   not imply it.
7. **Replacement cannot launder scope between claims.** Every replacement must
   target the same claim as a retracted receipt, unless that claim is explicitly
   invalidated by the same disposition.

This policy avoids “latest receipt wins,” which would make a sufficiently new
optimistic observation capable of hiding an unresolved contradiction.

## Sanitization and rebuild boundary

The compiler rejects absolute user paths anywhere in the compiled overlay, not
only in evidence path fields. The shadow then sanitizes consumer/methodology
roots and source actor aliases and refuses to write normalized or report output
if a forbidden value remains.

Generated overlays and reports are disposable. The self-test deletes a
generated overlay, rebuilds it, and requires identical bytes. Durable inputs
remain the compact contract, receipt facts, and decisions.

## Remaining Phase 0 work

| Gate | State | Why |
|---|---|---|
| negative compiler fixtures | pass | ten adversarial cases rejected |
| native encounter receipt | pass | exact claim and checkpoint satisfied |
| profile/schema versioning | pass at research scale | both versions pinned; no migration promise yet |
| source diagnostics | pass with prototype caveat | file and line emitted through token lookup, not a production YAML AST |
| deterministic rebuild | pass | deleted overlay rebuilt byte-identically |
| output sanitization | pass | compiler and shadow enforcement plus fixture |
| receipt correction disposition | pass | K1 and compact compiler; positive replay plus unauthorized and cross-claim negatives |
| root compact dogfood | pass | root semantics/states exact; 116 explicit lines to 40 compact lines |
| context-cold authoring | pass | isolated author, 34/34; 55 lines; 2 attempts; 0 questions; 0 creator interventions |
| production parser/error UX | pending | current subset parser remains a research dependency |

## Decision

Compiler policy validation, native receipt authoring, correction, root shadow
dogfood, and independent compact authoring now pass. Phase 0 is complete. The
next permitted step is the separately authorized Fleet live-consumer pilot;
this result does not itself authorize a methodology wave or default migration.

The sealed exercise used only the compact author packet and disposable fixture.
The author reached valid output in 56 recorded seconds, after two attempts,
and explained why manual evidence could not satisfy scheduled delivery. The
record is `research/refoundation/v2-shadow/generated/cold-author-score.md`.
