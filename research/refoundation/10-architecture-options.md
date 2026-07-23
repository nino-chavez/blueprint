---
canonical: false
status: architecture-recommendation
date: 2026-07-22
depends_on:
  - research/refoundation/09-current-capability-map.md
recommended_option: side-by-side-v2-semantic-core-with-compatibility-adapters
operator_ratification_required_for_template_change: true
---

# Architecture comparison — amend, v2, or clean rewrite

## Recommendation

Build a **side-by-side v2 semantic core with compatibility adapters**, using a
strangler migration:

1. implement the four-record evaluator as a small independent core;
2. adapt current actor-output, reviewers, scenarios, issuance receipts, and
   artifacts into its normalized input;
3. run it read-only in shadow against the root self-application;
4. expose existing stages, portals, and doctor status as views over the new
   semantics only after their discrepancies are understood; and
5. migrate consumers individually, retaining current tooling where it proves
   compatible.

This gives the first-principles redesign a clean semantic boundary without
throwing away field-tested adapters and governance. It is a v2 architecture,
not yet a public major-version decision and not a rename decision.

## Repository coupling evidence

The current dependency shape makes both big-bang extremes unattractive:

- the primary CLI/stamper/core files inspected total roughly 7,100 lines;
- `actor-output.mjs` is consumed by nine package/stamper/core locations,
  including account, portal, recipient-safety, stage, and doctor paths;
- stage-model coupling is narrower—five core/package locations—so it can be
  demoted behind a view without rewriting every tool;
- tier language appears across 19 tooling files, making an immediate schema
  removal unnecessarily disruptive;
- the CLI already uses dynamic library imports, providing a clean seam for a
  shadow evaluator or future command;
- the core test chain exercises 12 libraries, the pilot-profile reviewer, and a
  stamp-then-gate smoke; and
- actor-output, scenario-results, recipient issuance, fleet, upgrade, and
  reviewer invocation already embody incidents that a rewrite would need to
  rediscover or port.

The semantic core can be new. The adapters, safeguards, distribution machinery,
and test corpus should be presumed reusable until a concrete incompatibility is
shown.

## Decision criteria

Scores use 1 (poor) to 5 (strong). Weights reflect the purpose of this effort:
truthfulness and migration safety matter more than short-term code volume.

| Criterion | Weight | Amend in place | Side-by-side v2 + adapters | Clean rewrite |
|---|---:|---:|---:|---:|
| Semantic integrity against K1 | 25 | 2 | 5 | 5 |
| Reuse of field-tested capability | 15 | 5 | 4 | 1 |
| False-green reduction during transition | 20 | 3 | 5 | 3 |
| Consumer migration safety | 15 | 4 | 5 | 2 |
| Near-term implementation efficiency | 10 | 4 | 3 | 1 |
| Reversibility and shadow testing | 10 | 3 | 5 | 2 |
| Long-term conceptual coherence | 5 | 2 | 5 | 4 |
| **Weighted result / 100** | **100** | **65** | **93** | **56** |

The numbers are decision aids, not empirical precision. Changing any reasonable
single score does not change the ranking.

## Option 1 — amend the current architecture in place

### Shape

Extend `actor-output.yml` and `actor-output.mjs` with charter revisions, general
claims, scoped receipts, dependencies, and authorized dispositions. Gradually
teach `stage-model`, `doctor`, and reviewers to consume the additions.

### Benefits

- lowest immediate migration burden;
- maximum direct reuse of current parsers, manifests, commands, and tests;
- current consumers can receive additive fields without a new root contract;
- actor-output already contains actors, outcome statements, outputs, and some
  structured receipts; and
- fewer temporary namespaces and fewer public concepts during the first patch.

### Disadvantages

- makes outputs and reader outcomes the structural center even when claims are
  about systems, decisions, safety, or implementation behavior;
- risks turning one already-large manifest into the handwritten status layer
  K1 falsification rejected;
- forces four-record semantics through a YAML-subset parser and schema designed
  for a different contract;
- leaves stage and actor-output truth models active while incrementally adding a
  third generalized claim model;
- makes it difficult to tell whether a rule is new kernel semantics or legacy
  compatibility behavior; and
- invites “one more wave” layering, the accumulation pattern this re-foundation
  is meant to examine.

### When this option would become preferable

Choose amend-in-place only if the root prototype shows that nearly every K1
claim is naturally an actor-output outcome, every receipt can be expressed
without schema distortion, and no independent charter/disposition store is
needed. The current replay already makes that unlikely.

## Option 2 — side-by-side v2 semantic core with adapters

### Shape

Create a small, dependency-free normalized kernel with four inputs:

```text
charter revisions
      + claim graph
      + receipt ledger
      + disposition log
              ↓
       deterministic evaluator
              ↓
 exact claim/checkpoint states + reasons
```

Around it, adapters convert existing sources without rewriting them:

```text
blueprint.yml + actor-output.yml ─┐
reviewer/test/issuance outputs ───┼─> normalized K1 records ─> evaluator
ADRs + feedback/dispositions ─────┘                          ├─> doctor view
                                                            ├─> stage recipe view
                                                            └─> portal/operator views
```

Native v2 authoring is introduced only after shadow use reveals what cannot be
safely inferred.

### Benefits

- preserves a clean first-principles semantic boundary;
- makes current files evidence sources and compatibility inputs rather than
  forcing them to become the new ontology;
- allows old and new verdicts to run side by side on the same initiative;
- makes false-green differences visible before any consumer behavior changes;
- reuses reviewer, behavior, recipient-safety, fleet, upgrade, derivation, and
  portal capabilities through explicit adapters;
- supports per-consumer migration and rollback;
- permits the production authoring interface to be designed from measured
  inference gaps rather than from the verbose research JSON; and
- creates a natural place for model-neutral contracts while leaving runtime
  integrations outside the core.

### Disadvantages

- temporarily operates two semantic systems;
- adapter logic can become a permanent translation tax;
- ambiguous legacy data must yield `open`, `unobservable`, or an explicit
  mapping warning rather than a convenient green result;
- shadow reports may initially be noisy because current stages and K1 answer
  different questions;
- the team must resist adding v2 concepts directly to every legacy tool before
  the normalized contract stabilizes; and
- without explicit sunset gates, “temporary compatibility” could last
  indefinitely.

### Controls for the disadvantages

- only one system is writable during shadow mode: current files remain
  authoritative inputs; v2 output is derived and disposable;
- every adapter emits provenance and an `inferred | explicit | unavailable`
  field for consequential mappings;
- an adapter may produce open/invalid state, never invent scope or authority to
  make a fixture green;
- keep the kernel independent of filesystem, CLI, YAML, portal, and stage code;
- publish a discrepancy report with one row per changed verdict;
- define migration and deletion criteria before a consumer becomes native v2;
  and
- do not market or version v2 until at least one shadow and one live pilot meet
  the acceptance criteria.

## Option 3 — clean rewrite

### Shape

Create a new repository/package/schema/CLI from an empty implementation base and
rebuild only the capabilities selected from the map. Existing Blueprint becomes
historical reference or a separate legacy distribution.

### Benefits

- maximum freedom to design compact authoring, terminology, package boundaries,
  and APIs;
- no need to preserve stage, variant, tier, portal, or YAML-subset assumptions
  internally;
- easiest option for proving that the four-record kernel is genuinely minimal;
- clearest opportunity to make runtime neutrality and deterministic semantics
  explicit; and
- can produce a smaller conceptual product if the rewrite stays disciplined.

### Disadvantages

- throws away or requires reimplementation of field-tested false-green guards,
  reviewer discovery, recipient issuance, behavior normalization, distribution,
  fleet migration, and smoke coverage;
- creates a big-bang consumer decision and likely forks methodology knowledge
  across old and new repositories;
- replaces known complexity with untested omissions; a clean codebase is not
  evidence that the method works;
- delays shadow comparison because basic CLI, parsing, distribution, and
  adapters must be rebuilt first;
- makes historical wave/upgrade compatibility substantially harder;
- risks turning “from first principles” into “from no empirical constraints,”
  which would discard the reason for doing the six-month audit; and
- has the highest chance of spending time on product scaffolding before the
  semantic kernel proves authoring usability.

### When this option would become preferable

Escalate to a clean rewrite if the root prototype demonstrates any two of these:

1. compatibility adapters are larger or more complex than equivalent native
   implementations;
2. legacy schemas require semantic guessing on most consequential claims;
3. package boundaries prevent a filesystem-neutral evaluator;
4. shadow execution cannot avoid mutating or duplicating legacy truth;
5. a native authoring model is materially simpler only when legacy fields are
   absent; or
6. maintaining dual validation is more dangerous than a bounded migration.

That makes rewrite an evidence-triggered decision, not an aesthetic preference.

## Recommended v2 boundaries

### Core

Pure data in, deterministic data out:

- normalize and validate charter revisions;
- validate claim graph and exact statements;
- test receipt compatibility;
- validate disposition authority and effects;
- derive claim/checkpoint states with reason codes; and
- expose no filesystem, YAML, CLI, portal, stage, or model dependency.

### Modules

Declarative claim/evidence templates and activation rules for Discovery,
Human-surface, Implementation, External-system, Distribution, Ongoing operation,
Steering, Recipient-safe delivery, Handoff, and Multi-operator coordination.

### Adapters

- current Blueprint and actor-output manifests;
- reviewer results;
- state-derive/scenario results;
- recipient-safety attestations;
- ADRs, feedback, and steering dispositions;
- live operational observations; and
- eventually native compact authoring.

### Views

- exact discrepancy report;
- doctor/integrity summary;
- checkpoint and work-recipe progress;
- operator recovery brief;
- actor-specific output/portal projections; and
- compatibility status for migration.

### Governance/distribution

Keep fleet, upgrade, semver, wave log, freeze discipline, reviewer extension,
and git-host governance outside the core.

## Root-only prototype contract

The next phase may create files only under the root self-application's research
area. It must not edit `template/`, the published CLI, current manifests,
consumer repos, or release metadata.

The prototype should:

1. extract a normalized candidate from current root artifacts;
2. permit a minimal explicit overlay only where legacy data cannot safely supply
   charter scope, authority, or consequential claims;
3. ingest existing actor-output assurance and at least one real current tool
   result as receipts without copying their status by hand;
4. derive current root claim/checkpoint states and explain every incompatibility;
5. compare its results with actor-output and stage/doctor views without treating
   mismatch itself as failure;
6. rerun the 15 K1 fixtures unchanged or through a stable compatibility layer;
   and
7. measure author-authored lines separately from generated records.

## Prototype acceptance criteria

Advance from root shadow to a consumer pilot only if:

- all nine adversarial fixtures still fail for their intended reason;
- no adapter inference can upgrade a claim beyond its source evidence;
- every derived state includes a reason and provenance path;
- routine tool results become receipts without manual transcription;
- the operator-authored overlay is materially smaller than the 927-line research
  specimen corpus for comparable claims;
- current actor-output, doctor, and core tests remain untouched and passing;
- the root discrepancy report distinguishes changed question from actual
  contradiction; and
- deleting generated v2 output returns the repository to its prior operational
  state.

## Prototype stop conditions

Stop and revisit the architecture if:

- both old and new status stores require hand editing;
- legacy ambiguity is being resolved by optimistic defaults;
- claim authoring becomes a second project-management register;
- the core starts importing portal, stage, reviewer, or filesystem code;
- adapters erase source scope or authority to simplify mapping; or
- the prototype cannot explain its verdict to the operator without reading its
  implementation.

## Decision

Proceed with the side-by-side v2 semantic-core prototype in the root research
area. This recommendation authorizes only reversible research work. It does not
authorize a methodology wave, `template/` change, consumer migration, public
v2 announcement, or rename.
