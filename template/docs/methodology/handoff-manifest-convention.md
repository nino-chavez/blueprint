# Handoff-manifest convention (decisions/07, wave 93)

"The validated package hands off to build" is Stage 8 — and it is **actor-gated**: the stage demands anything only when the manifest declares a receiving actor (`kind: team`, or an outcome id like `receive-handoff` / `build-intake`). A solo local tool never hands off and never pays this ceremony. Without a receiving actor the stage gate passes as not-applicable.

## The output

`type: handoff-manifest` — the build contract a receiving org can accept. One derivable document enumerating, **per feature**:

| Field | Source (already exists as a pattern) |
|---|---|
| Spec reference | BRD `§US-X.Y` reference contract |
| Acceptance criteria | DoD verification ladder (G1–G5, named oracles) |
| Non-functional requirements | authored — the one field with no upstream pattern yet |
| Off-happy-path UI states | ui-rendering-contract-tier (loading/error/empty) |
| Rendered surface accepted | judged-screen-pattern (a cold screen review with `verdict: accept`) |
| Decision links | decisions/ index |
| Owner | named person per feature, not per project |

The gate is field-completeness: a feature row missing any field is PENDING and visible — never silently green (three-state semantics, decisions/05). The receiving actor's acceptance is the observed-human receipt that closes Stage 8.

## Derivation status

The assembling derivation (`handoff-derive`) is **trigger-gated on the first consumer that declares a receiving actor** — building the generator before any initiative has a receiving org would be ceremony without a reader, the exact error this contract family exists to prevent. Until then: author the manifest by hand against the field table; the validator enforces the output's declaration (artifact required at ready/issued) and the stage gate enforces its existence.

## What this scopes

METHODOLOGY's promise is scoped honestly: initiatives without a receiving actor end at Stage 7 (Iterate) and say so. "Hands off to build" describes Stage 8, not every initiative's terminal state.
