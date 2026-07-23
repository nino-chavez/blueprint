---
canonical: false
status: compact-authoring-passed-research-scale
date: 2026-07-22
depends_on:
  - research/refoundation/12-consumer-shadow-results.md
prototype: research/refoundation/v2-shadow
template_changed: false
consumer_changed: false
---

# Compact authoring results

## Verdict

A compact author-facing contract can compile into K1 without weakening the
semantic boundary.

Across Film Room, Fleet Observability, and BC Subscriptions, the compact files
reduced authored nonblank lines from 642 to 143 (77.7%) while preserving exact
equality across:

- charter intent, scope, actor kinds, and authority;
- claim statements, dependencies, and evidence compatibility contracts;
- normalized receipt semantics;
- re-charter dispositions;
- checkpoints and conditional modules; and
- every derived claim and checkpoint state.

This passes the compact-authoring experiment at research scale. It does not
make the syntax public, authorize migration, or prove operator usability.

## What changed

The explicit overlays exposed the full interchange form. The compact sources
retain consequential choices and compile repetitive mechanics:

| Authored concept | Remains explicit | Compiler-owned expansion |
|---|---|---|
| charter | revision, intent, governing scope | normalized record shape |
| actor | identity, named profile, any authority/kind removal | repeated kinds and authority sets |
| claim | statement, actor, evidence profile, scope delta, dependencies | object/oracle/observer/freshness fields |
| current-source evidence | source paths and claim | adapter record and current-version receipt shape |
| actor-output compatibility | import and actor alias | six claim projections, proof profiles, structured receipt normalization |
| checkpoint | named required claims | derived checkpoint state |
| module | activation claims and required actor kind | normalized activation record |
| re-charter | decision maker, retained claims, rationale, time | disposition boilerplate |

The compiler is a recipe layer. K1 remains the evaluation core and the current
consumer shadow remains an adapter layer.

## Measured result

| Consumer | Explicit overlay | Compact source | Reduction | Semantic comparison |
|---|---:|---:|---:|---|
| Film Room | 271 | 63 | 76.8% | exact |
| Fleet Observability | 165 | 36 | 78.2% | exact |
| BC Subscriptions | 206 | 44 | 78.6% | exact |
| **Total** | **642** | **143** | **77.7%** | **3/3 pass** |

The generated comparison is
`research/refoundation/v2-shadow/generated/compact-comparison.md`.

The comparison deliberately excludes only compiler/recipe provenance and
receipt IDs. It does not pass merely because the final state labels match.

## Why the compression is legitimate

### Named profiles are selected, not guessed

An author chooses `operator-builder`, `pilot-operator`, `decision-maker`,
`agent-worker`, or `receiving-team`. The compiler does not infer a governance
role from a repository username or prose description.

Where a profile is too broad, the compact source removes authority or actor
kinds explicitly. For example, the historical Film Room operator lacks the
later `accept-risk` authority, Fleet's operator removes that authority, and the
BC operator removes both pilot-user kind and self-observation authority. The
semantic comparison would fail if those deltas disappeared.

### Evidence profiles bind exact compatibility fields

`files`, `file`, `state`, `doctor`, `actor-output-gate`,
`package-inspection`, `observed-task`, `pilot-task`,
`live-scheduled-run`, and `handoff-run` are recipes for object/oracle/observer/
freshness contracts. They do not denote proof strength by themselves.

The author still names the claim, scope delta, actor, dependencies, and source.
That is the irreducible information needed to prevent one kind of evidence from
proving another kind of claim.

### Current contracts can be imported without becoming the kernel

Film Room's compact source imports `actor-output.yml`. The adapter still
generates six actor-outcome claims and normalizes only structured receipts.
Human-validation status strings and simulated proof retain their existing
ceilings. This is compatibility, not semantic inheritance.

## First-principles benefit now demonstrated

Starting over at the semantic layer provided four concrete advantages:

1. **Historical structure became optional.** Stages, tiers, portal patterns,
   and universal handoff were not copied into the core merely because they
   already existed.
2. **Evidence became claim-specific.** The same evaluator distinguishes old,
   incompatible, contradictory, and absent evidence instead of flattening all
   non-green conditions into “pending.”
3. **Current capability could be recovered selectively.** Actor-output and
   doctor remain useful as adapters and views; their summary models do not
   govern every initiative.
4. **The public contract can be smaller than the evaluator.** Operators author
   intent and consequential deltas while the program owns repeatable
   normalization.

## First-principles disadvantage now demonstrated

Compression does not remove complexity; it relocates and governs it.

The research implementation currently contains roughly 950 nonblank lines
across the compact compiler, consumer adapter, and semantic comparison. That is
reasonable infrastructure for a product, but it creates new obligations:

- profile definitions become versioned policy and require compatibility rules;
- compiler defaults can become hidden methodology if they are not inspectable;
- error messages and source locations must be much better than this prototype;
- generated forms need schema versions and migration tooling;
- a parser and formatter become product surface;
- adapter behavior needs negative fixtures, not only successful replays;
- native human/encounter receipt authoring is still absent; and
- an operator has not yet authored one of these files without the methodology
  creator present.

A clean rewrite of both semantics and product at once would take on all of
those obligations before delivering migration value. That remains the main
reason to keep the strangler architecture.

## What the compact result says about “steering agentic work”

The phrase is directionally right but incomplete.

The compact contract does not primarily steer an agent's next prompt. It
governs an initiative across agents, humans, time, evidence, and changes of
intent. Agents are executors, observers, reviewers, and proposal authors inside
that contract; they are not the unit the method ultimately controls.

The more precise category is:

> An evidence-steered initiative protocol for human-authorized, agent-executed
> work.

Its steering loop is:

1. charter intent, scope, actors, and authority;
2. declare falsifiable claims and their evidence contracts;
3. authorize work against open or contradicted claims;
4. record compatible receipts from executed oracles;
5. derive state and checkpoints without assertion upgrades; and
6. dispose transitions or re-charter when intent changes.

This includes agentic work, but it also explains solo operation, human
validation, external-system evidence, and team handoff without inventing a new
method for each.

## Implication for the Blueprint name

The compact syntax weakens the literal case for “blueprint.” It does not encode
a fixed up-front construction plan; it encodes a revisable charter, claim
graph, receipts, and dispositions.

Two naming layers can coexist:

- **Brand:** Blueprint can remain the product name because it already has
  identity and distribution value.
- **Category/promise:** describe it as an evidence-steered initiative protocol,
  not “the blueprint for building software” and not merely “a method for
  steering agents.”

Rename pressure should be evidence-triggered. If cold adopters repeatedly infer
fixed specification, waterfall stages, or document generation from the name,
the brand is actively misleading. Until that encounter evidence exists,
clarifying the category is cheaper and more reversible than renaming.

## Gate result

| Criterion | Result | Evidence |
|---|---|---|
| materially lower authoring burden | pass | 77.7% reduction across three cases |
| exact semantic preservation | pass | 3/3 generated semantic projections equal |
| exact derived-state preservation | pass | every claim/checkpoint state equal |
| consequential authority remains visible | pass | named profiles plus explicit removals |
| current consumers remain untouched | pass | generated artifacts live only under the root research tree |
| native encounter receipt UX | not yet tested | current structured receipts arrive only through adapters/imports |
| cold-operator usability | not yet tested | methodology creator authored all compact sources |
| public stability/migration contract | absent by design | research schema is `blueprint-compact/0` |

## Decision

1. Mark compact claim/charter authoring viable.
2. Keep K1 normalized form private to the evaluator.
3. Keep actor and evidence profiles inspectable, versioned recipes above K1.
4. Continue with the side-by-side clean core plus adapters.
5. Before any public or live-consumer pilot, add negative compiler fixtures and
   a minimal native receipt path, then run a cold-author exercise.
6. Use the next decision record to define migration sequence, compatibility
   guarantees, rollout gates, and category/name language.

No methodology wave, `template/` edit, release, or consumer migration is
authorized by this result.
