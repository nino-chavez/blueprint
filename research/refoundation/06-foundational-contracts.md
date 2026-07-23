---
canonical: false
status: candidate-k1-contracts
date: 2026-07-22
depends_on:
  - research/refoundation/05-kernel-candidate-k1.md
---

# K1 foundational contracts and conditional modules

## Contract 1 — claim ceiling

### Rule

A claim is the strongest language Blueprint may render from its compatible
receipts. A receipt never carries a global maturity level that can silently
upgrade adjacent claims.

Every consequential claim defines:

- exact statement;
- inherited and overridden scope;
- owner;
- dependencies;
- evidence requirement; and
- invalidation/freshness conditions.

Words such as `ready`, `done`, `working`, `usable`, `compliant`, `shipped`, and
`validated` are permitted only inside a defined checkpoint whose underlying
claims are visible.

### Consequence

BC's G1–G5 remains a useful module-specific view, but `G3 present` cannot render
as `done`. Film Room can simultaneously show founder-live satisfied and
self-serve open without contradiction.

## Contract 2 — receipt truth

### Rule

A receipt records what the observer actually observed:

- `supports`;
- `contradicts`; or
- `could-not-observe`.

It includes object, oracle, execution result, observer role/identity,
independence relationship, scope, time, source version, evidence locator, and
expiry/invalidation conditions.

### Could-not-observe

`could-not-observe` is a receipt about the observation attempt, not the target
claim. It may explain why the claim evaluates `unobservable`; it cannot prove or
refute the claim. This captures Rally HQ's missing test runner and source-only
persona walk without inventing evidence.

### Reuse

A receipt may support several claims only when each requirement independently
matches it. Reuse does not change or duplicate the receipt.

## Contract 3 — authority and independence

### Authority operations

The charter assigns authority over operations, not vague titles:

- change governing intent/scope;
- declare or retire claims;
- authorize work or spend;
- issue specific receipt types;
- accept/waive risk;
- disposition transitions;
- accept a delivered outcome; and
- receive accountable handoff.

### Multi-role actors

One person may be operator, builder, and pilot user. K1 records which role they
occupied during an observation.

Accepted default:

- The solo operator may issue a receipt for their own real operational outcome.
- That receipt does not become independent evaluation of builder judgment.
- A claim that needs independent evaluation says so in its observer
  requirement—for example `not-builder`, `not-author`, named receiving actor, or
  separate mechanical oracle.

### Agents

Agents may declare candidate claims, execute authorized work, run or collect
receipts, and propose dispositions. They may not:

- change charter intent without delegated authority and recorded disposition;
- promote simulated/cold-agent proof to observed-human;
- waive their own failed required check; or
- certify that their own reasoning is independently correct.

Cross-model review is one way to satisfy an independence requirement, not a
kernel rule. A fresh same-model evaluator or mechanical/human oracle may be more
appropriate depending on the claim.

## Contract 4 — scope transition and re-charter

### Trigger semantics

An external event is evidence, not automatically a scope change. Re-charter is
required when an authorized disposition **accepts a new governing intent or
scope dimension** that existing claims do not cover.

Common candidate signals:

- a new operator, buyer, beneficiary, supporter, or receiving team;
- movement from founder-operated to assisted or self-serve;
- distribution to a new machine/environment;
- a payment/commercial claim;
- a materially different product boundary;
- new clearance, privacy, safety, or regulatory exposure; or
- permanent loss of access to an actor/oracle required by the current charter.

Film Room's external interest alone did not prove paid demand. The accepted
intent to build no-engineer distribution did require a new product-mode scope.
QuantifAI's loss of enterprise-owner access invalidated the pilot and required a
new charter before further pilot-specific work.

### Re-charter record

A re-charter disposition declares:

- old and new charter revisions;
- accepted trigger/evidence;
- changed actors, authority, outcomes, assistance, environment, or commercial
  boundary;
- retained claims/receipts;
- invalidated or stale claims;
- newly required claims/checkpoints; and
- rationale/decision authority.

No historical record is rewritten. New-scope work may explore, but a checkpoint
cannot advance until the new charter and its required claims exist.

## Contract 5 — dependencies and invalidation

Claims depend on claims, not directly on document locations. Artifacts and
surfaces appear in evidence locators or work recipes.

Dependency types to test during falsification:

- `requires` — dependency must be satisfied;
- `derived-from` — source claim change makes dependent stale;
- `scoped-by` — charter/scope incompatibility invalidates dependent;
- `contradicts` — both cannot be satisfied in the same scope; and
- `supersedes` — replacement preserves history and becomes governing.

The kernel should adopt only the minimum types that the replay proves
necessary. This list is a candidate, not an implementation schema.

## Contract 6 — checkpoint and transition

A checkpoint is a named set of claims for one scope. It stores no independent
status.

A transition proposal names:

- intended action;
- checkpoint or claims required;
- actor requesting it;
- authority needed; and
- consequences if accepted.

Evaluation produces the precise unsatisfied reasons. An authorized disposition
then proceeds, revises, waits, stops, re-charters, waives, or hands off.

A waiver must name:

- claim being waived;
- authority;
- bounded scope;
- rationale;
- risk owner;
- expiry/review trigger; and
- claims it may **not** upgrade. A waiver permits action; it does not fabricate a
  supporting receipt.

## Conditional modules

Modules contribute claim templates, evidence adapters, checkpoints, and work
recipes. They do not add silent universal requirements.

| Module | Activates when the charter/claims contain | Adds |
|---|---|---|
| Discovery/research | consequential uncertainty about problem, actor, market, feasibility, or current state | source/provenance claims, contradiction handling, research work recipes |
| Human-surface design | a human must understand, decide, configure, or operate through a surface | prototype/encounter claims, interface-state coverage, appropriate human receipts |
| Implementation | claims require product/code/configuration behavior to change | traceability, behavioral scenario, implementation/source receipts |
| External-system contract | behavior depends on a vendor/platform outside repository control | authoritative contract/sandbox/live oracle choices, blocked-external state |
| Distribution/launch | product crosses machine/operator/environment boundary | lifecycle, packaging boundary, cold install, first value, recovery, update/exit claims |
| Ongoing operation | initiative promises repeated service after first value | observability, support owner, backup/recovery, migration, diagnostics, freshness claims |
| Steering | an actor outside the primary operator has decision authority or contribution outcome | open-decision/ask/authority/capture/disposition claims |
| Recipient-safe delivery | a counterparty receives an output without internal account | allowlist projection, leakage lint, issuance and destination receipts |
| Handoff | a receiving actor takes build/operation ownership | handoff-content claims and observed receiving-actor acceptance |
| Multi-operator coordination | concurrent humans/agents share mutable work or authority | ownership/contention/worktree/coordination controls; may remain a separate companion tool |

### Module activation examples

- Fleet Observability does not activate Distribution merely because it has a
  deployed portal; its intrinsic operator and environment may be the entire
  charter. It does activate Ongoing Operation for scheduled health claims.
- Film Room activates Distribution when the accepted intent moves to a second
  operator on a clean Mac.
- SE Docs Front Door activates Human-surface and External-system modules even
  though it may not activate Implementation.
- BC Subscriptions activates External-system, Implementation, Steering,
  Recipient-safe delivery, and Handoff for different claims—not as one
  monolithic project tier.

## Work recipes versus truth

The current Blueprint stages may survive as recommended recipes:

| Recipe | Intended evidence job |
|---|---|
| Intake/legibility | make the current object observable and bound inputs |
| Research/diagnose | reduce uncertainty and author/refute claims |
| Design principles | constrain candidate interventions |
| Prototype | produce cheaper evidence before irreversible implementation |
| Fact-check | independently re-evaluate claims and receipts |
| Documents | produce decision/recipient objects where actors need them |
| Deploy | change environment and activate live claims |
| Iterate | collect outcome receipts and disposition feedback |
| Handoff | transfer responsibility when a receiving actor exists |

Their names and order are not kernel truth. A configure-first initiative may
prototype through a live pilot protocol; a mature brownfield audit may need no
new visual prototype; an experiment may implement a throwaway probe before a
formal document exists. The checkpoint still constrains what may be claimed.

## Output and account compatibility

Actor-output maps into K1 as a module:

- `account` → canonical evidence/decision objects referenced by claims;
- `actors/outcomes` → charter actors plus actor-scoped claims;
- `outputs` → artifacts/surfaces actors use, with availability/safety claims;
- `assurance receipts` → receipt ledger entries; and
- output lifecycle → checkpoints/dispositions over those claims.

This mapping preserves the field-tested contract without making outputs the
universal center of every initiative.

## Evidence-ladder compatibility

BC's G1–G5 maps into claim families:

- G1 specification claim;
- G2 prototype claim;
- G3 presence claim;
- G4 behavioral claim; and
- G5 target-environment/live claim.

The monotone ladder remains valid where a feature's own contract requires each
lower family. K1 does not assume it for unrelated claims. Human outcome and
recipient acceptance remain separate compatible-receipt requirements.

## Questions held for replay

1. Can claim requirements be inferred safely from modules, or will authors need
   to write too much schema?
2. Does `unobservable` need to be claim state, receipt result, or both as
   specified here?
3. Are open scope values deterministic enough for mechanical compatibility?
4. Do dependencies need typed edges beyond `requires` and scope invalidation?
5. Can current ADRs serve directly as dispositions without duplicate records?
6. Can current test/build outputs generate receipts without a new hand-maintained
   ledger?
7. Which modules are Blueprint, and which should remain separate tools or skills?

The next phase must answer these by replay and executable negative fixtures,
not further prose refinement.
