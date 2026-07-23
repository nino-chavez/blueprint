---
canonical: false
status: consumer-shadow-passed-live-write-gated
date: 2026-07-22
depends_on:
  - research/refoundation/10-architecture-options.md
  - research/refoundation/11-root-shadow-prototype-results.md
prototype: research/refoundation/v2-shadow
template_changed: false
consumer_changed: false
---

# Consumer shadow results

## Verdict

The K1 side-by-side architecture survives three materially different consumer
boundaries. It preserved source-version freshness, separated artifact presence
from behavior and actor outcomes, and kept handoff conditional on an actual
receiving-team claim. All three generated contracts are valid; none required a
consumer or `template/` change.

The read-only consumer-shadow phase passes. The proposed semantics are viable
outside Blueprint's self-application.

The authoring model does **not** pass as a public format. The three explicit
research overlays total 642 nonblank lines to produce 1,117 normalized lines.
That is acceptable for inspecting the kernel, but far too much ceremony for a
normal initiative. The next architecture step is therefore a compact native
authoring experiment over the same kernel—not a methodology wave and not a
literal clean rewrite.

## What executed

```sh
node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/consumer-overlays/film-room.json \
  --root=<film-room-root>

node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/consumer-overlays/fleet-observability.json \
  --root=<fleet-observability-root>

node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/consumer-overlays/bc-subscriptions.json \
  --root=<bc-subscriptions-root>

node research/refoundation/k1/validate-k1.mjs \
  research/refoundation/v2-shadow/generated/consumers/*.normalized.json
```

Observed totals:

- 3/3 consumer projections valid with zero K1 warnings;
- 20 claims, 12 receipts, 7 checkpoints, and 7 conditional modules;
- 9 read-only evidence adapters executed;
- 15/15 adversarial/positive K1 research fixtures still match their expected
  verdicts; and
- zero consumer writes, zero current-manifest edits, and zero `template/`
  edits.

Detailed generated reports:

- `research/refoundation/v2-shadow/generated/consumers/film-room.shadow-report.md`
- `research/refoundation/v2-shadow/generated/consumers/fleet-observability.shadow-report.md`
- `research/refoundation/v2-shadow/generated/consumers/bc-subscriptions.shadow-report.md`

## Cross-consumer result

| Consumer boundary | Exact shadow result | What the separation prevented |
|---|---|---|
| assisted distribution plus current actor-output contract | release machinery present; package inspection and second-operator outcome open; cold-agent boot receipt stale | scripts, `issued`, or an old receipt becoming assisted-beta readiness |
| intrinsic solo operation | incident and implementation artifacts present; live scheduled-report outcome open; doctor claim contradicted | shipped code becoming proof that the operator receives value |
| brownfield behavior account plus team handoff | state receipts stale; normalized scenario result absent; corpus present; receiving-team acceptance open | high compliance counts or a large handoff corpus becoming current behavior proof or accepted transfer |

The cases did not need different kernels. They needed different claims,
evidence oracles, actors, and activated modules. That is the strongest evidence
so far that stages, portal types, and universal handoff are recipes rather than
foundational primitives.

## Film Room

### Exact result

| Claim/checkpoint | State | Why |
|---|---|---|
| distribution artifacts present | `satisfied` | four declared release/profile/build/signing/inspection programs exist in the current checkout |
| signed package inspects cleanly | `open` | no compatible current package-inspection receipt exists |
| second operator reaches first value | `open` | package inspection is still open, and no second-operator observation exists |
| founder live workflow | `open` | the repository contains narrative assertions but no structured receipt admitted by this adapter |
| next-agent bootstrap | `stale` | the structured cold-agent receipt otherwise matches, but its artifact source version differs from the current dirty checkout |
| two portal-served human outcomes | `open` | the simulated-walk receipt mismatches object, oracle, observer role, and source version |
| actor-output structural contract | `satisfied` | the current gate executed with zero blocking errors while retaining three pending obligations |
| assisted-beta checkpoint | `open` | package inspection and second-operator evidence remain open |

`actor-output` and K1 agree that the consumer is not outcome-complete, but K1
explains each ceiling separately. It does not let a simulated portal walk prove
a human outcome, and it does not let a structurally valid release toolchain
prove that a package was built, signed, installed, or used.

The founder claim being `open` is a durable-evidence statement, not a claim that
the workflow never occurred. The current readiness prose says it occurred; the
adapter deliberately refuses to convert prose into an observer/time/scope/
source-version receipt. A small native receipt would close that record without
requiring the operator to re-prove the experience.

This case supports the ratified re-charter: preserve the founder-operated claim
and add assisted-distribution claims. Payment and self-service remain absent
rather than being smuggled into “launch ready.”

## Fleet Observability

### Exact result

| Claim/checkpoint | State | Why |
|---|---|---|
| pilot incident source present | `satisfied` | both bounded first-party source records exist |
| scheduled-operation implementation present | `satisfied` | worker entry, evaluator, report, and schedule configuration exist |
| scheduled health report arrives | `open` | no durable observed scheduled-run receipt exists in the repository |
| doctor completes without a failing result | `contradicted` | doctor returned `FAIL`: 9 pass, 2 fail, and 2 warn |
| solo operation observed | `open` | implementation presence is not an operational encounter |

The two failing doctor checks are portal conformance and terminology; reader
encounter and lint jurisdiction warn. That is a real structural finding, but it
does not contradict the scheduled-report outcome. Conversely, implementation
presence cannot override the missing operation receipt. K1 keeps both truths
visible instead of compressing them into one project-health color.

This consumer also falsifies universal handoff. Its current charter has one
intrinsic operator and no receiving actor; activating handoff would add ritual
without adding information.

## BC Subscriptions

### Exact result

| Claim/checkpoint | State | Why |
|---|---|---|
| implementation register current | `stale` | the recorded derivation source version does not equal the current dirty checkout |
| behavior register current | `stale` | same source-version mismatch, even though 203 of 205 behavior-gate rows are recorded compliant |
| normalized scenario results present | `contradicted` | the declared normalized result artifact is absent from the current checkout |
| handoff corpus present | `satisfied` | the index and representative product-area packets exist |
| receiving team accepts handoff | `open` | no compatible receiving-team encounter receipt exists |
| current behavior evidence rederivable | `contradicted` | one required claim is stale and the normalized result artifact is absent |
| handoff accepted | `open` | corpus presence does not establish recipient orientation or acceptance |

The contradiction is deliberately narrow: the normalized scenario-result file
is absent now. It does not say the scenarios fail or cannot be regenerated. The
state receipts likewise preserve the historical 203/205 observation while
refusing to call it current.

This is the clearest proof that evidence grade cannot be only a global ladder.
“G4” is useful module shorthand, but compatibility still depends on the exact
claim object, oracle, scope, and source version.

## Architecture findings

### 1. The semantic core generalizes

All three consumers resolved through the same four records: charter, claim
graph, receipt ledger, and disposition log. Variance lived in overlays and
adapters. No consumer required a new universal stage, portal, tier, or handoff
state.

### 2. Current Blueprint contains reusable parts

The experiment reused current actor-output parsing/validation and doctor
execution as adapters. It did not reuse their summary labels as kernel states.
This supports a strangler architecture: current tools become sources and views
around a smaller semantic core.

### 3. The main method defect is evidence scope, not a single model

The original Film Room drift cannot be assigned only to Claude. A model made
poor steering choices, but the method also left enough semantic room for
output lifecycle, portal work, simulated proof, and readiness language to
stand in for the operator's actual acceptance boundary. Codex could re-steer
because the operator supplied a sharper intent and an audit supplied stronger
distinctions—not because a different model makes the old contract sufficient.

The causal answer remains a mix:

- agent behavior created and prolonged local drift;
- methodology ambiguity permitted that drift to look procedurally legitimate;
- operator intervention supplied the missing authority and intent boundary;
  and
- K1 makes those boundaries executable instead of relying on a model to infer
  them consistently.

### 4. The clean-core advantage is now demonstrated

Starting the semantics from first principles made it possible to distinguish
`open`, `stale`, `contradicted`, and `satisfied` without preserving historical
stage assumptions. It also exposed a current doctor `FAIL` that the first
adapter implementation accidentally treated as non-blocking; the explicit
claim/receipt contract made that mapping error obvious and correctable.

### 5. The clean-authoring disadvantage is also demonstrated

The overlays are too large:

| Overlay | Authored nonblank lines | Normalized nonblank lines |
|---|---:|---:|
| Film Room | 271 | 576 |
| Fleet Observability | 165 | 237 |
| BC Subscriptions | 206 | 304 |
| **Total** | **642** | **1,117** |

Much of this is repetitive actor authority, evidence profiles, scope fields,
and adapter wiring. Shipping this directly would replace ambiguous ceremony
with explicit ceremony. A successful v2 must compile a compact author-facing
contract into this normalized form while keeping consequential intent, scope,
authority, and evidence choices visible.

## Architecture gate

| Criterion | Result | Evidence |
|---|---|---|
| works outside the self-application | pass | three contrasting consumer projections are K1-valid |
| preserves evidence ceilings | pass | simulated proof remains incompatible; stale receipts remain stale; presence does not become behavior |
| distinguishes absence from failure | pass | open live outcomes, stale state, and exact missing-artifact contradiction remain separate |
| keeps modules conditional | pass | Fleet has no handoff; BC activates handoff only because a receiving team exists |
| reuses current capabilities safely | pass | actor-output and doctor execute as adapters with bounded claims |
| reversible with zero consumer mutation | pass | all generated output lives under `research/refoundation/v2-shadow/generated/consumers/` |
| acceptable normal-user authoring burden | fail | 642 authored nonblank lines across three overlays |

## Decision

1. Complete the read-only consumer-shadow phase.
2. Retain the side-by-side clean core plus compatibility adapters as the
   leading architecture.
3. Do not amend the current methodology around K1 and do not start a literal
   greenfield rewrite yet.
4. Build a root-only compact authoring prototype that compiles into the same
   normalized form. It should target a small charter, actor/outcome claims,
   module activation, and native receipt command—not expose K1 interchange
   JSON to operators.
5. Keep any live consumer write separately gated. If authorized later, begin
   with the clean, single-operator Fleet boundary; defer the actively dirty
   Film Room checkout and the higher-blast-radius BC checkout.

## What this means for the name

The evidence does not force an immediate rename. “Blueprint” still works as a
product name if its definition changes from a staged build plan to an
evidence-steered initiative contract. It is a misleading methodology name if
users reasonably hear “up-front specification” or “fixed construction plan.”

Naming should therefore follow—not precede—the compact authoring test. If the
operator experience centers on chartering claims, issuing receipts, and making
dispositions, the durable category is closer to an **initiative steering
protocol** or **evidence-control method** than a blueprint. The existing name
can remain the brand while the category and promise become precise.

## Next authorized step

Proceed only inside the Blueprint root with the compact authoring experiment
and migration decision record. Live consumer changes, `template/` changes, a
methodology wave, release metadata, and naming rollout remain out of scope
until separately accepted.
