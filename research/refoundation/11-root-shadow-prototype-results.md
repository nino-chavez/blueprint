---
canonical: false
status: root-shadow-passed-with-open-design-work
date: 2026-07-22
depends_on:
  - research/refoundation/10-architecture-options.md
prototype: research/refoundation/v2-shadow
template_changed: false
consumer_changed: false
---

# Root v2 shadow prototype results

## Verdict

The side-by-side architecture works at root-prototype scale. A read-only adapter
consumed the current self-application, executed current tools, produced a valid
four-record projection, and preserved stricter claim ceilings than the current
summary views.

The prototype passes its root gate. It is ready for a bounded consumer shadow,
not for a methodology wave or live migration.

## What executed

```sh
node research/refoundation/v2-shadow/shadow-root.mjs
node research/refoundation/k1/validate-k1.mjs --selftest
npm run test:core
```

Observed results:

- root shadow: valid K1 contract, 9 claims, 2 generated tool receipts;
- K1 corpus: 15/15 expected verdicts;
- current Blueprint core and stamp smoke: all pass;
- actor-output compatibility view: `PENDING`;
- doctor compatibility view: `WARN`; and
- stage compatibility view: five non-contiguous stages complete, no confirmed
  cursor, next frontier Stage 0.

The generated detailed report is
`research/refoundation/v2-shadow/generated/shadow-report.md`.

## Exact root result

| Claim family | Result | Why |
|---|---|---|
| seven current actor outcomes | all `open` | actor evidence, output lifecycle, and target/interim proof declarations are contracts, not completed observations |
| actor-output structural gate | `satisfied` | the current gate executed against resolvable root paths with zero blocking errors; its pending outcome remains visible |
| doctor execution boundary | `satisfied` | doctor executed its declared checks without a blocking result; its warnings and named untested areas remain visible |
| integrity-tools checkpoint | `satisfied` | both exact tool-execution claims have compatible receipts |
| public-orientation checkpoint | `open` | no structured compatible receipt was ingested for the casual-visitor outcome |
| external-adoption checkpoint | `open` | registry presence and an issued CLI do not prove end-to-end adoption without the author |

This is the desired separation. The prototype does not interpret `issued`,
`ready`, an observed actor record, five complete stages, or a doctor warning as
product-outcome success.

## Discrepancy findings

### Actor-output and K1 agree on the consequential gap

Actor-output is `PENDING` because the product site's human validation is marked
failing. K1 leaves the human outcome open because the current manifest contains
no structured receipt with observer, time, scope, and evidence result.

The underlying feedback artifact is strong enough to author a contradiction,
but the adapter correctly refuses to promote a status string into one. The next
receipt adapter should ingest a structured feedback record or require a small
explicit receipt—not parse narrative optimism/pessimism from prose.

### Stage state answers a different question

The stage model reports Research, Prototype, Documents, Iterate, and Handoff
complete while its linear cursor remains before Stage 0 because manual sensor
confirmation is absent. That is internally honest, but neither result says
whether public orientation or external adoption is proven.

Keeping this view as a recipe/progress projection is useful. Ingesting it as a
K1 receipt would recreate the scope error the kernel is designed to prevent.

### Doctor can support only a bounded integrity claim

Doctor's `WARN` includes actor-output pending, stateful-claim mismatches, no
reader contract, and lint-jurisdiction gaps. It also explicitly excludes the
full build and browser/runtime rendering. The generated receipt therefore says
only that doctor executed without a blocking result inside that named boundary.
It does not claim overall health or readiness.

## Authoring burden result

The explicit overlay is 116 nonblank formatted JSON lines. It generated a
466-line normalized projection containing 8 actors, 9 claims, 2 receipts, 3
checkpoints, and 3 module activations.

Compared with the 927 lines in the six hand-authored K1 specimens, the overlay
is materially smaller and derives seven of nine claims plus both receipts. That
passes the prototype's relative-burden criterion. It is still too much ceremony
for a normal solo initiative.

Most remaining overlay volume comes from:

- actor kind and authority overrides absent from the current manifest;
- mapping four legacy proof grades to claim-specific oracle profiles;
- two exact tool claims; and
- explicit checkpoints/module activations.

The next authoring experiment should infer safe actor kinds, ship module oracle
profiles, and use a compact charter/authority delta. It must not reduce lines by
guessing consequential authority or scope.

## Acceptance criteria

| Criterion | Result | Evidence |
|---|---|---|
| nine adversarial cases remain rejected | pass | K1 selftest 15/15 overall |
| no adapter inference upgrades source evidence | pass | all legacy actor outcomes remain open |
| every derived state has reason/provenance | pass | report contains state reason plus receipt/source mapping |
| routine tools generate receipts without transcription | pass | actor-output gate and doctor receipts generated from live execution |
| authored overlay materially smaller than research schema | pass with caveat | 116 authored lines versus 466 derived here and 927 hand-authored corpus lines; still not consumer-lean |
| current core and stamp smoke remain passing | pass | `npm run test:core` all pass |
| discrepancies distinguish different questions | pass | actor-output, doctor, and stage analyses are separate in report |
| deleting generated output restores prior operation | pass by construction | only `v2-shadow/generated/` is written; no current runtime reads it |

## Architecture lessons

1. **A clean core plus adapters is viable.** The K1 evaluator imports no current
   Blueprint library; only the root adapter does.
2. **Actor-output is a valuable source, not the new kernel.** It supplied seven
   claims and actor identities but could not safely supply authority or receipts.
3. **Current tools can become receipt producers.** Their claim language must be
   narrower than their familiar summary label.
4. **Legacy ambiguity should create authoring demand, not optimistic defaults.**
   The overlay's authority declarations are explicit because inferring them
   would change governance.
5. **The current human-validation record needs normalization.** A structured
   feedback/encounter receipt adapter is the highest-value next adapter.
6. **The public authoring model should not expose the normalized projection.**
   It is an internal interchange/evaluation form.

## Remaining root-prototype gaps

- no native compact receipt authoring for human encounters;
- no historical charter revision or re-charter disposition in the root shadow;
- no adapter for ADR/disposition authority;
- no safe receipt reuse across claims;
- no contradiction supersession semantics;
- no module-default inference experiment;
- no large-graph legibility view; and
- no external consumer has run the adapter against its own current artifacts.

## Gate decision

Complete the root-only prototype phase. The next authorized research step is a
read-only shadow on selected consumers, beginning with Film Room and Fleet
Observability as opposite-boundary cases, followed by BC Subscriptions for the
presence/behavior contract. Any live consumer write, template change, or
migration remains a separate decision.
