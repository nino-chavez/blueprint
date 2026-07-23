---
canonical: false
status: validated-root-experiment
date: 2026-07-23
scope: root research only
template_change_authorized: false
consumer_methodology_change_authorized: false
---

# Headless execution-boundary results

## Result

The preregistered execution-routing follow-up passed.

`blueprint-steering/1` can now distinguish:

1. whether a claim is ready;
2. who performs the selected action;
3. the authority under which they act;
4. the venue where the action occurs;
5. the artifact crossing the boundary;
6. where the result is captured;
7. whether the current task must pause; and
8. the condition that resumes evaluation.

The complete steering-layer suite passes 110 assertions. All version-0 fixtures
retain their prior recipe selection. Version 0 remains accepted, but a selected
human or decision action now exposes its route as `legacy-unspecified` instead
of presenting an apparently complete handoff.

## Preregistered outcomes

| Outcome | Result |
|---|---|
| Version-0 recipe compatibility | pass |
| Machine work defaults to `agent-autonomous` | pass |
| Machine venue defaults to `current-harness` | pass |
| Machine work requires no handoff | pass |
| External operator route names the BigCommerce sandbox venue | pass |
| External operator route carries exact artifact, capture, and resume semantics | pass |
| Active version-1 human or decision claims require authored routes | pass |
| Duplicate and unsupported routes are rejected with source-line diagnostics | pass |
| JSON and Markdown are deterministic and redact absolute user paths | pass |
| Evaluator cannot issue receipts, spend touches, mutate claims, or infer operator authority | pass |

An added adversarial case also proves that a ready, non-blocking human claim
does not interrupt remaining autonomous work.

## Interpretation

The initiating failure was not “the operator has not acted.” It was “the packet
did not say whether operator action was needed.” Claim kind, evidence readiness,
decision authority, and execution routing are separate concerns.

For a headless initiative, “next” is incomplete unless it answers both:

- **what work is selected**, and
- **where the control boundary is**.

The evaluator may default machine work into the current harness because that is
part of the version-1 contract. It may not invent human authority, an external
venue, or a receipt. Those remain authored inputs.

## Disposition

Use version 1 for the prospective external pilot and continue root dogfood.
Keep version 0 valid for compatibility.

Do not promote this into `template/`, the public CLI, or a methodology wave
from fixture-scale proof alone. Promotion requires at least one real consumer
to use the contract prospectively and show that the generated boundary prevents
an accidental operator interruption without hiding a genuine external gate.
