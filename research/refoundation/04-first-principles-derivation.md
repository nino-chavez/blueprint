---
canonical: false
status: candidate-derivation
date: 2026-07-22
depends_on:
  - research/refoundation/03-ratification-register.md
informs:
  - research/refoundation/05-kernel-candidate-k1.md
  - research/refoundation/06-foundational-contracts.md
---

# First-principles derivation — from incidents to a minimal kernel

## Derivation rule

A concept enters the kernel only when removing it makes at least two materially
different accepted incidents impossible to explain or control. A concept that
is useful in one lifecycle, product type, tool, or delivery surface belongs in
a conditional module or implementation layer instead.

The derivation does not ask "which current Blueprint component should survive?"
It asks:

> What durable information must exist so an initiative can know what it is
> trying to make true, who may decide or certify it, what has actually been
> observed, and what should happen next?

## Accepted incident demands

| Field demand | Incidents that make it irreducible |
|---|---|
| Governing intent and scope | FR-03/FR-04, QI-01/QI-02/QI-03, RH-01 |
| Actors and authority | RH-03, SE-02/SE-03, QI-01/QI-02, FO-P1 |
| Exact consequential claims | FR-04, BC-01, RH-02/RH-03, SE-02 |
| Claim dependencies/invalidation | FR-03, RH-02, QI-03 |
| Evidence object, oracle, observer, scope, and freshness | BC-01/BC-02/BC-03, RH-04/RH-05, FR-05 |
| Authorized response to evidence | FR-01/FR-02, QI-02/QI-03, SE-02 |
| Pending/refuted/unobservable without false green | BC-P1, SE-02, QI-P1, RH-05 |
| Conditional activation rather than universal ceremony | FR-05, SE-01/SE-03, FO-P1/FO-02 |

These demands do not require a universal document set, portal, prototype
format, stage order, or implementation runtime.

## Candidate concepts tested

### Intent

**Keep, inside the charter.** Intent is not merely another claim. It determines
which claims belong to the initiative and when a newly accepted outcome makes
the prior claim set insufficient. Film Room's founder workflow remained true
while the governing intent expanded; QuantifAI's prior research remained
historically true while its buyer-specific conclusions stopped governing.

### Scope

**Keep, inside the charter and each claim/receipt.** Evidence only proves
something for an actor, environment, assistance level, version, and time. Scope
is the mechanism that carries valid old proof forward without laundering it
into a new product mode.

### Actors

**Keep, inside the charter.** Human outcome, decision, operation, receipt, and
handoff claims cannot be evaluated without knowing who acts. Actor job labels
such as `orient`, `steer`, or `operate` may remain useful vocabularies, but the
kernel needs identities/roles and authority—not one universal taxonomy.

### Authority

**Keep, inside actor grants and receipt/decision rules.** Producing work,
observing an outcome, changing intent, and accepting a transition are different
authorities. The same person may hold several roles, but the record cannot
silently collapse them.

### Claims

**Keep as a graph.** A consequential progress or readiness state must resolve to
an exact statement whose evidence and dependencies are inspectable. This is the
smallest response to BC's presence/function bleed and Film Room's "ready for
whom?" ambiguity.

Claims form a graph because changing a pilot, source authority, or product mode
invalidates some downstream conclusions while preserving others. A flat list
would reproduce QuantifAI's manually reconstructed blast radius and Rally HQ's
drifting status projections.

### Evidence

**Keep as immutable receipts.** A receipt records an observation; it does not
store the initiative's preferred conclusion. The claim evaluator decides
whether the observation's object, oracle, observer, scope, and freshness satisfy
a requirement.

The kernel does not assume one global evidence ladder. A live deployment does
not prove a PRD exists; a document does not prove behavior; a simulated reader
does not prove human comprehension. Modules may define useful partial orders
such as G1–G5, but compatibility remains claim-specific.

### Decisions

**Collapse into dispositions.** The kernel needs an authorized, reasoned record
of what the initiative does in response to intent and evidence: proceed,
revise, wait, stop, re-charter, accept, reject, or hand off. ADRs are one durable
representation of dispositions; they are not a separate primitive.

### Transitions

**Collapse into dispositions plus derived claim state.** A transition request
names the intended action and required claims. The evaluator determines whether
those claims are satisfied; an authorized actor records the disposition.

### Work

**Do not keep as kernel state.** Research, design, code, configuration, review,
and interviews are actions selected to produce evidence or change reality. They
may be planned and logged by tooling, but the kernel does not become more
truthful because a task is marked complete. SE Docs proves the correct work may
be configuration rather than code; BC proves completed artifacts may still not
prove behavior.

### Artifacts and outputs

**Do not keep as universal primitives.** Files, live surfaces, configured
systems, packages, and human conversations are objects that actors use and
receipts observe. The actor-output contract remains a strong conditional module
for initiatives with delivery/reader outcomes. Treating output as kernel would
again bias the method toward a portal or file.

### Stages

**Do not keep as kernel primitives.** Stages are work/evidence recipes and
reporting views. Film Room shows a green stage can hide a narrower claim;
SE Docs shows a canonical prototype stage may select the wrong intervention;
QuantifAI shows scope change can invalidate work across several stages at once.

Research, design, prototype, implementation, deploy, iterate, and handoff remain
useful default recipes. The kernel evaluates their claims; it does not derive
truth from their ordinal completion.

### Variants, tiers, and portal patterns

**Do not keep as kernel primitives.** Variants are initialization/recipe bundles
based on current product state and blast radius. Tiers describe delivery
sophistication. Portal patterns are output implementations. They may survive as
compatibility views if the later map shows continued value.

## Minimal result: four durable records

```text
Charter
  current intent + scope
  actors + authority
        │
        ▼
Claim graph
  exact statements
  dependencies + evidence requirements
        │
        ▼
Receipt ledger
  immutable observations
  oracle + observer + scope + freshness
        │
        ▼
Disposition log
  authorized proceed / revise / wait / stop / re-charter / accept / handoff
```

Evaluation is derived from these records. No stored stage status, portal tile,
or chat assertion may outrank them.

## Why each record cannot collapse further

### Charter cannot be just top-level claims

Claims can be refuted or replaced; governing intent and authority determine who
may replace them and which historical evidence remains relevant. Without a
charter, an agent can pivot toward the easiest reachable user without an
authorized scope decision.

### Claims cannot be just receipt labels

The same receipt can support one claim and fail another. A successful founder
event supports founder-live operation, not cold self-serve installation.
Without exact claims, evidence grades become ambiguous status words again.

### Receipts cannot be embedded in claims

Receipts need independent provenance, version, freshness, and reuse. Embedding
"passed" in a claim recreates hand-maintained status and loses the ability to
re-evaluate when scope or requirements change.

### Dispositions cannot be inferred from green claims

Evidence informs but does not own intent, risk tolerance, spend, or authority.
An initiative may stop despite technically satisfiable claims, or proceed with
an explicit waiver. The decision and its accountable actor must survive.

## Kernel invariants derived from the corpus

1. **No observation, no verdict.** `could-not-observe` cannot become pass or
   fail evidence.
2. **No compatible receipt, no satisfied claim.** Compatibility includes object,
   oracle, observer/independence, scope, and freshness.
3. **No authority, no disposition.** An agent may propose a transition; only a
   declared authority may change governing intent or accept a human outcome.
4. **No silent scope upgrade.** Existing evidence remains immutable and may
   satisfy only compatible new claims.
5. **No bare readiness.** Readiness is a named set of exact claims for a named
   scope, not a universal project state.
6. **No universal output.** The product, evidence, canonical account, and
   recipient artifact may be different things in different systems.
7. **No universal ceremony.** Modules activate from accepted claims, actors, and
   risk boundaries.
8. **No stored truth that can be derived.** Claim state and checkpoints are
   evaluated from current charter, graph, receipts, and dispositions.

## What this derivation does not yet prove

- That four records are usable without excessive authoring burden.
- That existing Blueprint artifacts can map mechanically into them.
- That claim graphs remain understandable on a large initiative.
- That exact evidence requirements can be declared before useful exploration.
- That stage recipes can become views without losing practical guidance.
- That a solo operator can maintain role separation without artificial process.

Those are falsification and compatibility questions, not reasons to add more
kernel concepts before testing K1.
