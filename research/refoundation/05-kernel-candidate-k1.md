---
canonical: false
status: candidate-k1
date: 2026-07-22
depends_on:
  - research/refoundation/04-first-principles-derivation.md
not_implementation_schema: true
---

# Kernel candidate K1 — charter, claims, receipts, dispositions

## One-sentence definition

Blueprint K1 is a repository-native control method in which an authorized
charter defines the initiative's intent and actors, a graph states what must
become true, immutable receipts record what was actually observed, and
dispositions decide how the initiative responds.

This is a conceptual contract, not a proposed file format. YAML below exists to
make semantics falsifiable; it does not pre-decide whether an implementation
uses one manifest, several ledgers, derived files, Markdown, or a database.

## Record 1 — charter

The charter establishes the current governing frame.

```yaml
charter:
  id: film-room-distribution
  revision: 2
  intent: enable a second solo operator to install and run an assisted pilot
  scope:
    product_mode: assisted-beta
    assistance: scheduled operator support allowed
    environment: supported clean Mac
    distribution: signed application package
    commercial: no paid/self-serve claim yet
  actors:
    - id: initiative-operator
      kinds: [operator, builder, pilot-user]
      authority:
        - change-intent
        - authorize-work
        - disposition-transition
        - observe-own-operational-outcome
    - id: second-operator
      kinds: [pilot-user]
      evidence: assumed
      authority:
        - issue-own-outcome-receipt
  supersedes: charter-revision-1
  rationale: decision reference
```

Required semantics:

- `revision` is monotone and immutable once superseded.
- Scope dimensions are open vocabulary but explicit enough to compare receipts.
- Actors may hold several roles. Authority is operation-specific.
- Changing the charter is itself an authorized disposition.
- Prior charters and their compatible receipts remain historical evidence.

The kernel does not require every possible scope dimension. A module may add
dimensions such as regulatory boundary, clearance, supported device, tenancy,
or receiving organization when its claims activate them.

## Record 2 — claim graph

A claim is the smallest consequential statement the initiative wants to render
as supported, use as a transition prerequisite, or expose as readiness.

```yaml
claims:
  - id: install-without-engineer
    statement: a second operator installs and reaches first sample output without developer intervention
    charter_revision: 2
    scope:
      actor: second-operator
      environment: supported clean Mac
      assistance: none during the run
    owner: initiative-operator
    depends_on:
      - distributable-boundary-safe
      - first-run-path-complete
    evidence_requirement:
      result: supports
      object: actor-outcome
      oracle: observed-task-run
      observer:
        actor: second-operator
        independence: not-builder
      freshness:
        max_source_age: release-version
```

Required semantics:

- The statement is testable and does not contain an unqualified word such as
  ready, done, compliant, usable, or shipped.
- Scope narrows the claim. Omitted scope inherits from the charter explicitly,
  not silently.
- Dependencies are claim IDs, not filenames.
- Evidence requirements describe compatible observations; they do not assert
  that the observations exist.
- `owner` maintains the claim; ownership does not grant receipt or disposition
  authority.

Claims may describe documents, behaviors, live systems, safety boundaries,
decisions, or actor outcomes. K1 does not impose one universal hierarchy among
them.

## Record 3 — receipt ledger

A receipt is an immutable observation.

```yaml
receipts:
  - id: cold-install-run-003
    claim: install-without-engineer
    result: supports
    observation: pilot user installed release 0.2.0 and exported the sample without intervention
    object: actor-outcome
    oracle:
      method: observed-task-run
      executed: true
    observer:
      actor: second-operator
      role_during_observation: pilot-user
      independence: not-builder
    scope:
      release: 0.2.0
      environment: supported clean Mac
      assistance: none
    observed_at: 2026-08-01T15:00:00Z
    source: evidence locator
    expires_when:
      - release changes mutable-data or first-run behavior
```

Required semantics:

- `result` is `supports`, `contradicts`, or `could-not-observe`.
- `could-not-observe` records an attempted observation and reason; it cannot
  satisfy or refute a claim.
- `object` names what was observed, not a generic maturity score.
- The oracle records whether it actually executed.
- Observer identity and role permit independence checks without assuming every
  initiative has different people for every role.
- Scope and invalidation conditions make reuse safe.
- A receipt never changes. A later receipt or disposition supersedes its use,
  not its history.

Mechanical checks, tests, source audits, browser walks, external probes, and
human encounters all produce receipts through adapters. The kernel evaluates
their compatibility; it does not require all claims to use the same oracle.

## Record 4 — disposition log

A disposition is an authorized response to intent, evidence, or a requested
transition.

```yaml
dispositions:
  - id: adopt-assisted-beta-charter
    action: re-charter
    proposed_by: initiative-operator
    decided_by: initiative-operator
    authority: change-intent
    basis:
      - receipt: external-interest-observation
      - receipt: founder-live-event-004
      - claim: founder-workflow-proven
    changes:
      charter_revision: 2
      invalidates_claims:
        - solo-only-funnel-is-complete
      retains_claims:
        - founder-workflow-proven
    rationale: decision reference
    decided_at: 2026-07-21T00:00:00Z
```

Core disposition actions:

- `proceed` — authorize a named next intervention or checkpoint;
- `revise` — change a claim, plan, or implementation in response to evidence;
- `wait` — hold while a named condition remains unresolved;
- `stop` — close a claim or initiative deliberately;
- `re-charter` — change governing intent/scope/actors/authority;
- `accept` / `reject` — record an authorized outcome or handoff decision;
- `waive` — permit an exception with scope, owner, expiry, and rationale; and
- `handoff` — transfer accountable ownership to a receiving actor.

Modules may add domain actions, but every action retains proposer, authority,
basis, changes, rationale, and time.

## Derived claim evaluation

K1 derives one of these states per claim:

| State | Meaning | Permitted consequence |
|---|---|---|
| `satisfied` | all current compatible requirements have supporting receipts and no controlling contradiction | may satisfy a checkpoint |
| `open` | claim is valid but required evidence is incomplete | work may continue; cannot satisfy checkpoint |
| `contradicted` | a current compatible receipt refutes the claim | revise, stop, or explicitly waive; never silently green |
| `unobservable` | the required oracle cannot presently run or actor/evidence is unavailable | wait, change experiment, or re-charter; not pass/fail |
| `stale` | receipts once satisfied the claim but no longer match freshness/version | re-observe; prior history remains |
| `invalidated` | current charter/dependency no longer permits the claim to govern | replace/re-charter; not a product failure |
| `invalid` | claim/receipt/authority contract is malformed or contradictory | block evaluation until repaired |

`blocked` and `pending` may remain useful UI summaries, but they are projections
of these more precise reasons rather than primary truth values.

## Evidence compatibility

A receipt satisfies a claim only when all declared requirements match:

```text
object observed
  × oracle actually capable/executed
  × result supports
  × observer identity/independence authorized
  × scope compatible
  × source version compatible
  × freshness valid
  × dependencies satisfied
```

There is no implicit upgrade. For example:

- `file-present` cannot satisfy `scenario-passes`;
- `scenario-passes` cannot satisfy `human-understands`;
- `founder-live` cannot satisfy `second-operator-self-serve`;
- `simulated-walk` cannot satisfy an observed-human target; and
- a stale source audit cannot satisfy a current implementation claim.

## Checkpoints replace universal stage truth

A checkpoint is a named view over required claims:

```yaml
checkpoint:
  id: assisted-beta-ready
  requires:
    - distributable-boundary-safe
    - cold-install-behavior-passes
    - first-value-path-observed
    - support-owner-declared
```

It is satisfied only when every required claim is satisfied. It stores no
independent completion state.

The current stages may become checkpoint/work-recipe bundles:

- Research suggests claims and produces source receipts.
- Design/prototype creates interventions to test behavioral and actor claims.
- Fact-check re-evaluates receipt compatibility and contradictions.
- Documents produce decision/output objects with their own claims.
- Deploy changes the environment and invalidates or activates live claims.
- Iterate records new receipts and dispositions.
- Handoff activates only with a receiving actor and acceptance claim.

This preserves practical guidance without letting an ordinal cursor become a
product-readiness oracle.

## Control cycle

```text
1. Declare or inspect charter
2. Declare the consequential claim/checkpoint
3. Identify uncertainty and compatible evidence requirement
4. Choose work that can produce that evidence or change reality
5. Record receipts
6. Derive claim state
7. Authorized actor dispositions the result
8. Repeat, stop, or re-charter
```

An agent may execute steps 2–6 within granted authority. It may propose step 7.
It cannot grant itself charter-changing or human-acceptance authority.

## Claim-language rule

Every rendered status must be generated from an exact claim or checkpoint.

Allowed:

- "Founder completes a real event without the terminal — satisfied for release
  0.1.4, observed 2026-07-20."
- "Second-operator cold install — open; no compatible receipt."
- "Behavioral verification — 0/332 acceptance criteria satisfied."

Disallowed:

- "Film Room is done."
- "The feature is compliant" when only presence was checked.
- "Stakeholders can steer" when no contribution/disposition was observed.

## Minimal ceremony floor

A lean solo initiative needs only:

1. one charter revision with its intrinsic operator and authority;
2. a small set of consequential claims/checkpoint;
3. receipts produced by the actual work/tests/operation; and
4. dispositions only when evidence changes what happens next.

It does not need a portal, buyer, external stakeholder, acquisition funnel,
handoff manifest, lifecycle journey, or separate human merely to satisfy the
kernel.

## K1 risks to falsify next

1. Claim graphs may become a new hand-maintained status spreadsheet.
2. Evidence requirements may be too difficult to author during exploration.
3. Open scope vocabulary may make compatibility nondeterministic.
4. Disposition logging may duplicate ADRs and feedback records.
5. Existing stages may lose their teaching/onboarding value when demoted to
   views.
6. A solo operator's multiple roles may make independence rules either toothless
   or artificially burdensome.
7. Large initiatives may need aggregation without recreating false-green
   summary states.

The counterfactual replay and fixtures must try to break K1 on these axes.
