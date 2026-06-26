# Proof-Obligation Registry — generalizing the DoD ladder to N obligations

**Status: single-initiative (subs-initiative, 2026-06-25) — promotion candidate.** This generalizes [`dod-verification-ladder-pattern.md`](dod-verification-ladder-pattern.md): the five-gate ladder is five *fixed* proof obligations; this pattern makes the table **open** so a project can register the obligations its own spec implies. Promote to cross-consumer law when a second initiative registers a non-ladder obligation and the registry catches a real defect. The portable engine shipped to [`template/tools/spec-obligation-registry/`](../../tools/spec-obligation-registry/); the canonical instance-1 (a requirement-grain completeness lint) lives in the subs-initiative.

## The principle: "done" is not five questions, it is N

The DoD ladder decomposes "is this AC done?" into five mechanically answerable gates (G1 spec · G2 prototype · G3 presence · G4 behavior · G5 live), each with a **named oracle**, and forbids claiming a gate without the ones below it. That is exactly right — and it is a *special case*. The ladder answers five fixed questions about an **acceptance criterion**. A real spec makes more claims than that, and at finer grain:

- *Did we cover all the use cases? Prove it.*
- *Did every normative requirement inside a story get verified — not just its ACs? Prove it.*
- *Is every built handler reachable over the wire, not just unit-green? Prove it.*
- *Does every cross-boundary contract match its live counterpart, not a mock? Prove it.*

Each is the same shape as a ladder gate. So instead of hard-coding five, register **N proof obligations** in one table, and let the ladder be five rows of it. The ladder pattern already gestures at this — it notes "G4-green ≠ fully tested … the same authority-bleed this ladder kills, recursed one gate up." The registry is what that recursion terminates in: a uniform obligation shape, applied to every claim the spec makes.

## The obligation shape

Every "did we X? prove it" claim is one obligation:

```
claim → universe-source → coverage → oracle/tier → verdict
        × freshness  (PROVEN-as-of-<commit> + per-oracle TTL)
        × cadence    (continuous CI / on-demand / periodic)
```

- **universe-source** — *where the complete set the claim quantifies over is enumerated from.* The single most important field (see § The three failure axes). "Prove we covered all X" is unprovable until "all X" is an enumerable, re-derivable set.
- **oracle / tier** — `mechanical` (grep/schema/count) · `behavioral` (a recorded scenario run) · `judgment` (an attestation) · `external` (live env / partner). Higher tiers subsume lower; the ladder's G3→G4→G5 is this axis.
- **verdict** — never a bare "yes." It is **PROVEN-as-of-`<commit>`**, **GAP** (the named uncovered subset), or **UNPROVABLE** (no registered oracle). A proof is a claim against a commit; PROVEN against stale evidence is a false-green, so freshness is part of the verdict, not a footnote.
- **cadence** — "prove everything on every commit" is infeasible (it is how a behavioral CI job ends up cancelling at 15 minutes). Each obligation is assigned continuous / on-demand / periodic.

## THE LAW

> **A proof's evidence must come from a source the claim does not control** — not the spec that declares it, not a test that mocks it, not a name-list that announces it, not a human attestation when the thing is mechanically checkable.

This is the proof-grain statement of `ground-truth-over-proxy`'s spine ("a representation of the system is not the system"). That lesson set catalogs how a *representation drifts from the system*; THE LAW adds the case where the representation is faithful but the **proof reads the wrong source** — the claim's own declaration — as evidence.

## The three failure axes

Every false "prove it" reduces to one of three. The registry's structural contract (the engine's `validate`, a CI gate) resists each:

| Axis | The lie | Grounding instance | Structural guard |
|---|---|---|---|
| **Rigged denominator** | the universe silently excludes members — the proof is true *of the wrong set* | subs-initiative US-8.1: the completeness universe was "ACs in the traceability registry", excluding a story's deeper-section normative requirements → a named telemetry event shipped with zero producers, invisible to every gate | `universeSource.enumeratedFrom` is **required** and must name a concrete, re-derivable source; an `active` obligation may not rest on an unestablished universe |
| **Too-weak oracle** | proves a proxy and calls it the thing — presence ≠ function; "a string exists" ≠ "it passes" | the ladder's own G3-presence-read-as-done; `scenario-coverage` caps that grep a test *exists* | `oracle.tier` is explicit; a mechanical oracle above presence must `bindToProducer`, not a declaration |
| **Oracle self-reference** | the proof reads the claim's *own declaration* as evidence | US-8.1 again: the event name `widget.impression` appears in the spec file and a derived projection, so a grep that doesn't exclude them proves the requirement against itself | a `grep` oracle must declare the **four-guard binding** below |

The **rigged denominator** is the axis the existing `ground-truth-over-proxy` lessons do not cover — they are all representation-drift (axes 2–3). It is added there as the lesson "the denominator is the proof" (L8). The denominator is also where mechanical proof bottoms out: you can prove *coverage of a declared set*; you cannot mechanically prove the *set is complete* (see § The achievability ceiling).

## The four guards (the operational form of THE LAW)

Every `grep`-style mechanical oracle declares a binding:

- **(a) source-scoped** — evidence is impl/emit source only; the spec, derived projections, and tests/mocks are excluded. *A claim may not prove itself.*
- **(b) producer-bound** — comment lines don't count; a `// TODO: emit X` is not a producer, and neither is a `const NAMES = ['X']` catalog of declarations.
- **(c) per-artifact** — N named artifacts are N checks; closing one never closes the others.
- **(d) no attestation escape for mechanically-checkable claims** — a thing that is emittable and scenario-testable may not route to a human attestation; attestations are for genuinely judgment-bearing claims only.

## The achievability ceiling — what a prover can and cannot do

Three tiers; only two are mechanical. Stating the boundary is the most useful thing the pattern does — a prover that pretends the third is solved is a new false-confidence source:

- **T1 — internal completeness/consistency** (every named member of the declared universe closes; every check traces to a requirement). **Mechanical.** This is most of the value.
- **T2 — requirement *quality*** (is the fit criterion meaningful; is the AC really testable; is this normative or merely informative). **Semi-mechanical** — a regex sees that a fit criterion *exists*; only judgment sees that it is *meaningful*. This is a skill's job, not a gate's.
- **T3 — external completeness** ("did we omit a requirement the system actually needs?"). **Not mechanically provable** — there is no ground-truth set to diff against. The registry's move is to make the universe **explicit**, put a **human signature** on "this set is complete," and run **adversarial search** against it. Absence of findings raises confidence; it never proves completeness.

## Rollout for authored-grain obligations — format-on-touch, not a big-bang parse

When an obligation's universe lives in hand-written prose (e.g. a story's deeper-section requirements), do **not** try to retro-parse it. A reliable regex over heterogeneous prose manufactures false-greens — the exact failure the obligation exists to kill. Instead:

- the requirement is **authored** in a parseable block on touch (a fenced or comment-delimited block with a fit criterion per artifact);
- the lint runs **WARN** for the un-migrated backlog and **ERROR** for a story that has adopted the block and left an artifact orphaned;
- a known-but-unbuilt artifact closes via an explicit `gap:<tracked-issue>` — surfaced as a visible WARN, never silently green.

The clean, machine-checkable surface grows one story at a time; the gate never blocks un-migrated work.

## The registry is thin; the prover routes, it does not judge

The registry is **declarative data** plus a `validate` contract — not an engine. The per-obligation lints are the engines; the existing substrate (`state-derive` for presence, `scenario-results` for behavior, an attestation derive for judgment) supplies the oracles. A `prove`-style front-end over the registry **routes and composes only**: given a claim it resolves the universe, runs the registered oracle, and reports the verdict. With **no registered oracle it returns UNPROVABLE — never an LLM judgment dressed as proof.** Generality is earned by registering real obligations, not by building a grand prover first.

## Adopting it in a consumer

1. Lift [`template/tools/spec-obligation-registry/`](../../tools/spec-obligation-registry/). Its `OBLIGATIONS` ship seeded with the five ladder gates (project-agnostic) plus a commented instance-1 example.
2. Register the obligations your spec implies — each naming a real `universeSource.enumeratedFrom`; for a `grep` oracle, the four-guard binding.
3. Wire `validate` as a CI gate (the structural contract) next to your existing DoD-ladder derive.
4. Carry an `OWNER-SPEC.md` per [`owner-spec-convention.md`](owner-spec-convention.md).

## Cross-references

- [`dod-verification-ladder-pattern.md`](dod-verification-ladder-pattern.md) — the five-gate ladder this generalizes (its five gates are five obligations here).
- [`../../../docs/lessons/ground-truth-over-proxy.md`](../../../docs/lessons/ground-truth-over-proxy.md) — the spine; THE LAW is its proof-grain statement, and L8 (the denominator) is the failure axis the six representation-drift lessons miss.
- [`test-discipline-pattern.md`](test-discipline-pattern.md) — the "G4-green ≠ fully tested" companion; a per-AC × per-test-type coverage matrix is itself a registrable obligation.
- [`owner-spec-convention.md`](owner-spec-convention.md) — every portable tool carries an OWNER-SPEC.
