---
canonical: false
status: falsified-and-surviving-with-constraints
date: 2026-07-22
depends_on:
  - research/refoundation/07-counterfactual-replay.md
evaluator: research/refoundation/k1/validate-k1.mjs
---

# K1 falsification results

## Verdict

K1 survives as a **semantic kernel candidate**, not as an implementation schema.
The executable prototype reproduced all six expected case states and rejected
all nine adversarial constructions. It also exposed enough authoring and model
gaps that adopting the JSON shape, or immediately rewriting Blueprint around
it, would be premature.

## Reproduction

```sh
node research/refoundation/k1/validate-k1.mjs --selftest
```

Result on 2026-07-22:

```text
15/15 K1 research fixtures matched expected verdicts.
```

The passing corpus contains 6 specimens, 15 claims, 8 receipts, 10 checkpoints,
and 8 module activations. The adversarial corpus contains 9 fixtures targeting
the failure boundaries discovered in the consumer audit.

## Positive specimens

| Specimen | Expected | Executed | Principal distinction |
|---|---:|---:|---|
| `film-room.json` | pass | pass | founder proof does not satisfy second-operator distribution |
| `bc-subscriptions.json` | pass | pass | artifact presence stops below behavior and delivery |
| `rally-hq.json` | pass | pass | missing oracle produces `unobservable` |
| `se-docs-frontdoor.json` | pass | pass | configure-first initiative activates only relevant modules |
| `quantifai.json` | pass | pass | lost actor plus accepted new intent invalidates old charter claim |
| `fleet-observability.json` | pass | pass | intrinsic-operator operation needs no fictional handoff |

## Adversarial fixtures

| Fixture | Attempted invalid promotion | Derived/rejected result |
|---|---|---|
| `film-room-scope-launder.json` | use a founder/origin-machine receipt as second-operator/clean-machine proof | claim remains `open`; asserted green rejected |
| `bc-presence-upgrade.json` | use file presence and static scan as executed behavior | claim remains `open`; asserted green rejected |
| `rally-could-not-run-pass.json` | use a failed observation attempt as a pass | claim becomes `unobservable`; asserted green rejected |
| `self-certification.json` | let a builder satisfy a required non-builder review | receipt incompatible; claim remains `open` |
| `stale-receipt.json` | reuse an expired prior-version receipt | claim becomes `stale`; asserted green rejected |
| `unauthorized-recharter.json` | let an agent expand governing intent without authority | disposition rejected by authority contract |
| `universal-handoff.json` | require handoff for a private intrinsic-operator utility | module rejected for no activation claim and no recipient actor |
| `contradictory-evidence-green.json` | keep a claim green despite a compatible refuting run | claim becomes `contradicted`; asserted green rejected |
| `contradictory-disposition.json` | retain and invalidate one claim in the same re-charter | disposition rejected as internally contradictory |

## What the prototype established

### 1. The four-record decomposition is executable

Charters, claims, receipts, and dispositions are sufficient to derive the
tested states and checkpoints. Stages, portals, variants, tiers, actor-output,
and G1–G5 were not needed as kernel primitives.

### 2. Evidence compatibility can enforce a claim ceiling

Exact matching of object, oracle, observer, scope, source version, freshness,
and dependency state blocked the audit's principal evidence promotions. The
method does not need one global evidence ladder to preserve evidence strength.

### 3. Multi-role actors are representable without either fiction or impunity

Fleet's operator can prove their own real operating outcome. The same actor
cannot satisfy a claim that explicitly requires a non-builder observer. This is
the intended distinction between first-party operation and independent review.

### 4. Scope change is a disposition, not a stage transition

Film Room and QuantifAI can preserve historical evidence while changing the
claims that govern current progress. The authority fixture prevents a working
agent from granting itself that change.

### 5. Conditional ceremony is mechanically testable

Modules can require both a consequential activation claim and an actor kind.
That is enough to reject universal handoff in the tested solo case while
activating distribution, human-surface, recipient-safe delivery, or ongoing
operation where the charter actually needs them.

## What the prototype falsified or left unresolved

### Direct hand-authoring is too expensive

The six positive JSON specimens occupy 927 formatted lines for only 15 claims
and 8 receipts. Some of that is deliberate explicitness, but this is not an
acceptable everyday authoring interface. A production design must infer safe
defaults, project existing artifacts, and generate receipts from real tools.
Otherwise K1 becomes the status spreadsheet it was meant to replace.

### Charter inheritance is underspecified

The conceptual candidate says omitted claim scope inherits explicitly from the
charter. The evaluator avoids guessing and requires tested scope dimensions on
receipts, but it does not yet implement a deterministic inheritance or override
rule. Production semantics need canonical scope normalization and a visible
effective-scope projection.

### Authority must be evaluated in historical revision context

The prototype checks claim observers against the claim's charter revision, but
disposition authority currently resolves from a cross-revision actor index.
That is sufficient for these fixtures and unsafe as a final contract. Every
disposition needs an explicit governing charter revision, and authority must be
evaluated at `decided_at`.

### Freshness is only minimally modeled

The evaluator implements explicit expiry and exact source-version matching. It
does not yet implement semantic invalidation triggers, maximum source age,
mutable external state, or derived staleness propagation.

### Contradiction control needs a supersession rule

Any compatible contradiction currently controls over support. That is safer
than false green, but a repaired system needs a principled way to supersede a
prior contradiction by later version/scope or authorized disposition without
deleting history.

### Dependency semantics remain narrow

The executable graph implements only a strict `requires` relationship plus
disposition invalidation. Candidate relationships such as `derived-from`,
`scoped-by`, `contradicts`, and `supersedes` remain unproven and should not enter
the kernel until a replay requires them.

### Receipt reuse and adapters are not implemented

The conceptual contract allows one observation to support several compatible
claims. The prototype attaches each receipt to one claim. It also consumes
handwritten JSON rather than test reports, source audits, browser runs, ADRs, or
feedback records. Both are product-design work, not settled kernel semantics.

### Module activation is declared, not inferred

The evaluator validates a module's activation claims and actor dependency. It
does not infer that a newly declared machine boundary should activate
Distribution or that a repeated-service promise should activate Ongoing
Operation. The next design must determine which inferences are safe defaults
and which require operator confirmation.

### Aggregation and teaching remain untested

The corpus is small. K1 has not demonstrated that a large claim graph stays
legible, or that demoting stages to recipes preserves Blueprint's onboarding
value. These are explicit pilot criteria, not assumptions.

## Constraints carried into capability mapping

The next phase may map current Blueprint capabilities onto K1 only under these
constraints:

1. the research JSON is not the proposed consumer format;
2. routine receipts should be generated from existing work and tools;
3. current ADRs, research, tests, feedback, and outputs should be referenced or
   projected rather than duplicated;
4. the operator should author only consequential intent/scope/authority changes
   and non-inferable claim requirements;
5. exact derived reasons must remain visible even when a compact status is
   rendered;
6. stages may survive as teaching and evidence-production recipes, never as an
   independent readiness oracle;
7. modules remain conditional and must not recreate a universal initiative
   persona; and
8. no current methodology or consumer migration begins until the capability
   map, architecture comparison, and root-only prototype are reviewed.

## Gate decision

Advance K1 to current-capability mapping. Do not promote it to methodology,
edit `template/`, announce a version, or migrate a consumer. Its semantics have
earned another test phase; its product form has not.
