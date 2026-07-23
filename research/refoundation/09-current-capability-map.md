---
canonical: false
status: capability-map-complete
date: 2026-07-22
depends_on:
  - research/refoundation/08-k1-falsification-results.md
methodology_wave_observed: 96
published_cli_observed: 0.7.0
---

# Current Blueprint capability map against K1

## Executive finding

Blueprint does not need to be discarded to be rebuilt from first principles.
Its most recent work has already converged on much of K1:

- decision 05 replaced a fixed portal contract with actors, outcomes, outputs,
  and structured assurance;
- decision 06 added explicit asks, authority, capture, and disposition records;
- decision 07 made handoff conditional on a receiving actor;
- the DoD ladder and scenario-results tools already insist that presence does
  not prove behavior; and
- `doctor`, reviewer wiring, and derivation tools already prefer mechanical
  evidence over agent assertion.

The re-foundation is therefore primarily a **semantic consolidation and
boundary correction**, followed by selective reuse. The current system has
proto-claims and proto-receipts, but no governing charter contract, no general
claim graph, no unified receipt compatibility model, and no authorized
disposition log. Stages, variants, portal types, evidence grades, and several
special-purpose registries currently approximate pieces of those missing
records.

## Inventory basis

Read-only inventory on 2026-07-22 found:

- methodology state through wave 96;
- published CLI `0.7.0` with eight commands: `init`, `review`, `cost`, `fleet`,
  `upgrade`, `doctor`, `hive`, and `stage`;
- 23 reviewer specifications, 18 executable reviewers discovered by the CLI;
- 12 dependency-free libraries under `template/tools/lib/`;
- 14 registered consumers;
- four declarative stage models; and
- the root self-application actively routed through `actor-output.yml`, with a
  truthful `PENDING` result rather than portal conformance.

The root `doctor` result was `WARN`, not green: actor-output pending, stateful
claim mismatches, no reader contract, and incomplete lint jurisdiction remained
visible. That is useful evidence that several current controls already honor the
“unknown is not pass” direction.

## Classification vocabulary

| Disposition | Meaning |
|---|---|
| **Absorb** | semantics belong in the four-record kernel |
| **Adapt** | keep capability as a claim/receipt/disposition adapter or conditional module |
| **Retain** | keep as platform, governance, distribution, or authoring infrastructure outside kernel truth |
| **Demote** | preserve as a work recipe, preset, view, or teaching aid; remove readiness authority |
| **Deprecate** | support temporarily for compatibility, then retire |
| **Exclude** | integrate as an optional companion; do not absorb into Blueprint |

## Four-record gap map

| K1 record | Closest current capability | What is already sound | Missing or unsafe |
|---|---|---|---|
| Charter | `blueprint.yml` project, pilot profile, variant, tier, access blocks | names project, some actors, a pilot, execution posture, and optional capabilities | no immutable revisions; intent/scope/actors/authority are fragmented; universal pilot profile overfits external-user initiatives; an agent-visible config can change without an authorized re-charter disposition |
| Claim graph | actor-output actor outcomes, stage gates, proof obligations, state-derive capabilities, prescription items | testable outcome statements and some explicit dependencies exist | claims are split across files and domain-specific schemas; stage completion can stand in for consequential truth; no general scope/dependency contract or exact claim ceiling |
| Receipt ledger | actor-output assurance receipts, reviewer results, stage-state fingerprints, scenario results, recipient issuance attestations, live logs | structured provenance, freshness fingerprints, immutable tool outputs, and no-silent-upgrade rules already exist in places | receipts are fragmented; actor-output uses a global grade plus pass/fail, lacking object, oracle execution, exact scope, source compatibility, `could-not-observe`, and cross-claim reuse |
| Disposition log | ADRs, steering disposition-records, feedback, stage assertions, amendments, waivers embedded in prose | rationale and history are valued; steering now requires visible consequence | no common proposer/decider/authority/basis/change contract; stage assertions can authorize fuzzy transitions without connecting to claims; intent changes are not mechanically distinguished from ordinary config edits |

## Capability-by-capability disposition

### Truth and orchestration

| Current capability | Current job | K1 disposition | Required change |
|---|---|---|---|
| `blueprint.yml project:` | project name, description, product, audiences | **Adapt → Charter** | keep convenient authoring fields, but derive an immutable effective charter revision with explicit intent, scope, actors, and authority |
| required `pilot_profile` | lock one pilot and prevent silent persona substitution | **Adapt → Discovery/Human-surface module** | an intrinsic actor is always named; the full external-pilot profile activates only when such a pilot governs the initiative |
| actor-output `actors` and `outcomes` | declare evidenced actors and observable success | **Absorb → Charter + Claim graph** | retain exact outcome statements; add authority and effective scope; do not require every claim to be an actor outcome |
| actor-output `account` | name canonical truth locations | **Retain → Artifact/evidence index** | use as locators referenced by claims, receipts, and dispositions; do not make “account” a fifth truth record |
| actor-output `outputs` and lifecycle | connect artifacts/surfaces to outcomes; distinguish planned/draft/ready/issued/retired | **Adapt → Output module** | preserve artifact lifecycle separately from claim assurance; `issued` must never imply usable, safe, or outcome-proven |
| actor-output preconditions | enforce simple artifact ordering | **Adapt → Claim dependencies/work recipes** | convert consequential orderings into claim dependencies; keep purely procedural order in recipes |
| actor-output three-state verdict | prevent planned or unproven output from appearing green | **Absorb principle, replace state model** | render exact K1 states and checkpoint reasons; compact PASS/PENDING/BLOCKED may remain a projection only |
| stage models and `stage status/advance` | report a pipeline frontier and gate transitions | **Demote → Checkpoint/recipe view** | stages may summarize evidence-production progress; stage state stores no independent product truth; advance becomes an authorized disposition over named claims/checkpoint |
| non-derivable stage assertions | let an operator confirm fuzzy gates | **Deprecate in current form** | replace with a compatible receipt, explicit waiver, or disposition; free-text assertion cannot manufacture claim satisfaction |
| greenfield/midstream/brownfield/research variants | choose a stage sequence and reviewers | **Demote → Preset bundles** | retain useful starting recipes/module suggestions; allow claim topology to diverge without “wrong variant, restart” semantics |
| Tier 0/1/2 | choose artifact sophistication | **Retain as delivery-form preset** | separate scaffold/product form from evidence strength, readiness, and lifecycle maturity; consider renaming to avoid ordinal maturity inference |
| `execution.depth` | choose how much work/documentation to produce | **Retain as work-budget policy** | never use it as evidence or a required artifact count independent of activated claims |
| cost effort/model dial | control reasoning spend and record under-processing | **Retain as execution policy** | bind cost decisions to work recipes/claims, not stage truth; telemetry is operational evidence about execution, not product outcome |

### Evidence, review, and derivation

| Current capability | Current job | K1 disposition | Required change |
|---|---|---|---|
| actor-output assurance grades (`mechanical`, `cold-agent`, `simulated-walk`, `observed-human`) | prevent simulated evidence from becoming human proof | **Adapt → Human-surface shorthand** | retain useful labels as oracle profiles, not a global ladder; every claim still declares object, oracle, observer, scope, version, and freshness |
| actor-output structured receipts | back output assurance | **Absorb → Receipt ledger adapter** | add `supports/contradicts/could-not-observe`, oracle execution, exact scope, evidence target, freshness/invalidation, and immutable identity |
| reviewer registry and `blueprint review` | discover and execute canonical or org reviewers | **Retain → Oracle adapter SDK** | reviewers declare what claim/evidence object they evaluate and emit normalized receipts; prose-only reviewers remain judgment oracles with explicit authority limits |
| reviewer-wired stage advance | prevent a mapped reviewer from being silently skipped | **Adapt → Checkpoint evaluation** | preserve fail-closed resolution and input fingerprinting; attach result to claims rather than a numbered stage |
| `doctor` | aggregate conformance, reviewer load, drift, and skipped checks | **Retain → Integrity/observability surface** | report kernel validity, claim states, stale receipts, unobservable oracles, and explicitly untested dimensions; it is not a universal readiness gate |
| DoD G1–G5 ladder | separate specification, prototype, presence, behavior, and live proof | **Adapt → Implementation-module claim families** | retain where a feature contract needs the progression; stop treating the ladder as global evidence maturity |
| state-derive | derive capability state from source/schema/scenario checks | **Retain → Receipt generator** | emit observations with object/oracle/scope/version; its register becomes a view over claims rather than an independent truth source |
| scenario-results normalizer | turn test-runner output into AC-keyed behavioral evidence | **Retain → Behavior receipt adapter** | preserve commit freshness and many-to-many AC linkage; normalize into receipt ledger without a second status store |
| proof-obligation/spec-obligation registries | enumerate required proof per feature/AC | **Adapt → Claim authoring/implementation module** | project rows into claims and evidence requirements; eliminate duplicated manual status fields |
| roadmap-registry sync | stop registry/view status drift | **Retain as integrity adapter** | views derive from governing claims/dispositions; avoid maintaining parallel status prose |
| stateful-claim lint | detect rotting count/version/currency prose | **Retain as freshness adapter** | connect findings to stale/contradicted claims where a governing claim exists |
| document currency and citation checks | verify live links, paths, CLI mentions, and decision references | **Retain as artifact-content oracle** | issue scoped receipts; existence cannot establish that a citation supports the language attributed to it |
| recipient issuance attestation | hash package bytes and bind issuer/destination/as-of | **Retain → Recipient-safe receipt adapter** | map issuer authority and package scope through charter/disposition; keep post-attestation mutation invalidation |

### Conditional method modules

| Current capability family | K1 module | Disposition |
|---|---|---|
| research completeness, three-pass research, source/reference grading, sibling scan, current-state prompts, personas/JTBD, architect challenge | Discovery/research | **Adapt** as claim templates, source oracles, and work recipes activated by consequential uncertainty |
| design principles, design-system foundation, prototype forge, prototype smoke, UI rendering states, portal walks, encounter audit, terminology and reader contracts | Human-surface design | **Adapt**; distinguish artifact/source checks from observed human outcomes and activate only when a human-facing surface is claimed |
| traceability, proof obligations, G1–G5, scenario normalizer, spec registry, implementation audits | Implementation | **Adapt**; this is the strongest existing evidence adapter family and should not govern configure-only or research-only work |
| Cloudflare, commerce-platform profiles, cited vendor contracts, blocked-external catalog state | External-system contract | **Adapt selectively**; environment profiles supply claim templates/oracles, never universal fields |
| deploy skills, packaging, portal deployment, launch checks | Distribution/launch | **Adapt**, but add missing cold-install, first-value, recovery, update, and exit claim templates where the charter crosses those boundaries |
| telemetry, recovery brief, stateful claims, doc currency, support/diagnostics patterns, archaeology | Ongoing operation | **Adapt** when repeated service is promised; archaeology remains an optional provenance source |
| steering packets, asks, authority, capture, feedback, disposition records | Steering | **Absorb disposition semantics; retain output recipe** only when an outside actor has contribution/decision authority |
| clearance projections, allowlists, leakage lint, destination policy, issuance | Recipient-safe delivery | **Adapt** almost intact as a high-risk specialized module |
| actor-gated Stage 8 and handoff manifest | Handoff | **Adapt** as a conditional checkpoint/output; remove its need to occupy universal ordinal position 8 |
| parallel-dispatch checks, worktree discipline, Hive contract | Multi-operator coordination | **Retain/Exclude**: Blueprint declares when coordination is required; Hive continues as a companion substrate rather than kernel |

### Platform, distribution, and governance

| Current capability | Disposition | Why |
|---|---|---|
| `init` stamper and clean `template/` boundary | **Retain** | distribution infrastructure is independent of method truth; the directory boundary remains load-bearing |
| fleet registry, version pins, `fleet`, and `upgrade` | **Retain** | methodology distribution and compatibility control remain necessary under any kernel |
| wave log, freeze rule, semver, release automation | **Retain with promotion hardening** | provenance and safe rollout are strengths; waves should record semantic/module/tool changes separately |
| amendments and four-bucket promotion triage | **Retain with stricter evidence gate** | field learning should compound, but one incident must not become universal ceremony without cross-case or critical-risk justification |
| org reviewer SDK and git-host governance | **Retain** | extension and authority enforcement support team adoption but are not product/readiness truth |
| account derivation, boot packet, recovery brief | **Retain as generated operator/agent outputs** | these reduce restart cost and should consume kernel projections rather than define them |
| portal derivation and portal shells | **Retain as renderer toolkit** | generate only the views demanded by actor/output claims; no portal or route set is required by the method |
| Pattern A/B portal conformance | **Deprecate** | decision 05 already established that route/chrome compliance can pass while every reader fails; keep only compatibility routing during migration |
| archaeology substrate | **Retain optional** | valuable receipt/provenance source for long-running work; too expensive and infrastructure-specific for kernel |
| Hive implementation | **Exclude as companion** | identity, contention, and shared mutable coordination are a separate system with a clean integration boundary |
| Forge Signal and Specchain integrations | **Exclude as optional adapters** | they may produce artifacts/receipts but must not define Blueprint semantics or vendor-lock the runtime |
| portal UI packages, design tokens, tool-shell, demos | **Retain as starter assets** | useful product accelerators, not methodology invariants |
| owner-spec, frontmatter, cited-URL, defrag, and general lint tools | **Retain as optional integrity tools** | they become oracles when a claim activates them; their mere presence is not a universal gate |

## Reviewer routing under K1

The 23 reviewer specifications should not all run on every initiative. Their
future registration needs four pieces of metadata:

1. module and activation condition;
2. evidence object(s) the reviewer can observe;
3. oracle method and whether it is mechanical, agent judgment, or human; and
4. claim/checkpoint families it may support or contradict.

The current executable set maps as follows:

| Reviewer group | Likely route |
|---|---|
| cost gate | execution policy, not claim assurance |
| research completeness, persona fit, pilot profile, prescription evidence/JTBD | Discovery/research claims |
| design principles, prototype provenance, prototype smoke | Human-surface or Implementation claims depending on object observed |
| encounter audit, terminology | Human-surface artifact/content receipts; never observed-human outcome receipts |
| portal initiative/review/chrome conformance | legacy compatibility or renderer integrity; fixed portal-type reviewers retire |
| roadmap sync, stateful claim lint, doc currency | Ongoing-operation/integrity receipts |
| defrag | codebase-maintenance oracle activated by maintainability claims |

The five Markdown-only reviewers remain valid as judgment recipes, but they
must not be counted as executed receipts until an authorized evaluator actually
runs them and records the observation.

## Principles to preserve

Several current principles survive first-principles reconstruction:

- shell is replaceable; evidence, rationale, and methodology artifacts persist;
- an unavailable or skipped oracle never yields green;
- a lower-strength observation never silently becomes a stronger actor outcome;
- derived state should come from source artifacts and real tool output, not a
  manually edited status column;
- solo actors may occupy multiple roles without inventing people;
- handoff, steering, portals, and coordination activate only when a real actor
  or claim requires them;
- template contamination is a product-boundary failure and remains guarded;
- consumer migration and methodology editing need explicit coordination; and
- failures should produce durable capabilities when promotion evidence supports
  reuse.

The last principle needs one correction. “Agent struggle is a missing
capability” cannot mean every struggle becomes a universal gate. The durable
response may be a kernel rule, a conditional module, a local adapter, a work
recipe, a model-selection change, or no methodology change. Promotion requires
an explicit scope classification and a negative fixture or independent case.

## Capabilities to demote or retire

1. **The numbered pipeline as governing truth.** Keep it as a teachable recipe
   and progress view; remove independent readiness authority.
2. **Fixed portal types and navigation.** Continue the already accepted
   actor-output migration; render outputs, not methodology lanes.
3. **A global evidence ladder.** Keep grade labels only as convenient oracle
   profiles inside relevant modules.
4. **Universal external-pilot ceremony.** Every initiative needs a chartered
   actor; only initiatives governed by an external pilot need the full profile.
5. **Assertion-only completion.** Replace it with receipts, bounded waivers, or
   authorized dispositions.
6. **Variant-as-destiny.** Variants become editable presets, not a reason to
   restart when reality diverges.
7. **Tier as implied maturity.** Preserve scaffold/delivery choices under a
   non-assurance label.
8. **Blueprint as Claude-Code-specific.** Runtime adapters may differ; the
   kernel contract must remain model- and harness-neutral.

## Reuse assessment

| Area | Estimated semantic reuse | Notes |
|---|---:|---|
| actor/output and steering contracts | high | closest precursor to K1; generalize outcomes into claims and steering dispositions into all dispositions |
| behavioral evidence/state derivation | high | strong adapters with known evidence ceilings; normalize receipt format |
| recipient safety | high | already specific, executable, and properly conditional |
| reviewer/doctor infrastructure | medium-high | sound invocation and fail-closed patterns; needs claim-aware routing and receipt output |
| stage/variant orchestration | medium as UX, low as truth | recipes and teaching survive; state authority does not |
| portals and UI assets | medium as optional renderer | valuable scaffolding; no longer methodology center |
| governance/distribution | high | largely orthogonal and should survive |
| current manifest schemas | low-medium | useful compatibility sources, too fragmented and verbose to become the new direct schema |

These are directional, not code estimates. The architecture comparison must
measure actual coupling before choosing amend-in-place, v2 coexistence, or a
clean implementation.

## Mapping verdict

The current repository contains enough correct primitives that a literal clean
rewrite would sacrifice substantial field-tested behavior. It also contains
enough conflicting truth models that amendment-by-amendment layering would
likely preserve the confusion.

The architecture phase should therefore evaluate a fourth practical shape
inside the three requested options: **a clean semantic core with compatibility
adapters around proven current capabilities**. That can be implemented as a v2
namespace or package without treating all existing code as disposable. The
next comparison must decide whether that shape is best expressed as amend in
place, side-by-side v2, or clean rewrite—not assume the label in advance.
