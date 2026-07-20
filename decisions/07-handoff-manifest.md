# decisions/07 — Stage 8: the handoff manifest (the pipeline's missing terminal artifact)

**Status:** Accepted (ratified 2026-07-20, "ratify both")
**Date:** 2026-07-20
**Wave:** 93 (freeze check 2026-07-20: 14 consumers, 5 behind at rest, 0 mid-migration — no waiver needed)

## Context

METHODOLOGY.md's first sentence promises "the validated package hands off to build." The 2026-07-20 enterprise-intake lens (simulated receiving-org product architect) found the promise has no stage, no gate, and no artifact: the pipeline (Stage 0 → 7) terminates at "deploy a demo URL and iterate." The defined package floor is one strategy document plus a prototype — a stakeholder-alignment package, not a build contract. Verdict as a build handoff: reject.

The intake gaps are specific: traceability (story→spec→decision) exists only as an *optional* pattern; non-functional requirements are absent as a concept; acceptance criteria live inside optional DoD patterns rather than the package contract; feature-level ownership is undefined at handoff. The consumer sample (film-room) confirms the promise isn't being met in practice: its PRD is retroactively assembled, self-describes as PRD-lite, and its acceptance/status columns are hand-maintained — the exact spreadsheet the DoD ladder pattern exists to kill.

Every ingredient of the fix already exists as an optional pattern: the DoD verification ladder (G1–G5 with named oracles), the proof-obligation registry, the BRD §US-X.Y reference contract, traceability-state-join. They have never been assembled into one required output.

## Decision

1. **Stage 8 — Handoff — enters the pipeline, actor-gated.** It activates only when the manifest declares a receiving actor (`kind: team` or a human with a `receive-handoff` / build-intake outcome). A solo local tool never hands off and never pays this ceremony. This keeps the ceremony floor intact: stages activate on evidence of the actor, not by default — the same rule that governs every other output.

2. **Its output is the handoff manifest** (`type: handoff-manifest`, an issued-package): a derivable document enumerating, per shipped/specified feature: spec reference (§US-X.Y), acceptance criteria, non-functional requirements, off-happy-path UI-state contract, decision links, and an owner. Derived from the existing artifacts wherever they exist; the gate is that the *fields* are present, not that a human formatted a document.

3. **The gate**: Stage 8 cannot close while any feature row is missing a field. Three-state per decisions/05 — PENDING rows are visible, never silently green. Receiving-actor acceptance is the observed-human receipt.

4. **METHODOLOGY.md's promise gets scoped honestly**: initiatives without a receiving actor end at Stage 7 and say so; "hands off to build" becomes the description of Stage 8, not a tagline for every initiative.

## Build order (after acceptance)

1. Schema: `handoff-manifest` output type + receiving-actor recognition in `actor-output.mjs`.
2. Derivation: a `handoff-derive` pass (new lib or `account-derive` extension) assembling rows from BRD/PRD refs, DoD ladder state, and decisions index; missing fields emit PENDING rows.
3. Stage model: Stage 8 with its gate, wired like the other reviewer-mapped gates (ADR-0009 pattern).
4. METHODOLOGY.md + template docs: the stage, the activation rule, the scoped promise.

## Consequences

- The pipeline's terminal artifact matches its terminal claim; a receiving org gets a contract, not a link.
- The optional patterns gain a forcing function without becoming universal ceremony — they're required exactly when a receiving actor exists.
- Blueprint's own enterprise-credibility story (its operator works in enterprise product architecture) gains its missing artifact.

## Ratification items (operator)

| # | Item | Recommendation |
|---|---|---|
| 1 | Stage 8, actor-gated (never universal) | ☑ ratified |
| 2 | Handoff manifest as derivable, field-gated output | ☑ ratified |
| 3 | Scope the "hands off to build" promise honestly | ☑ ratified |
| 4 | Build order 1–4 | ☑ ratified |
