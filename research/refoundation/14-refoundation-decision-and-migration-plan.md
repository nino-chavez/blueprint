---
canonical: false
status: recommended-for-operator-ratification
date: 2026-07-22
depends_on:
  - research/refoundation/03-ratification-register.md
  - research/refoundation/09-current-capability-map.md
  - research/refoundation/10-architecture-options.md
  - research/refoundation/12-consumer-shadow-results.md
  - research/refoundation/13-compact-authoring-results.md
related_decision:
  - decisions/04-naming-reconfirmation.md
template_change_authorized: false
consumer_change_authorized: false
---

# Re-foundation decision and migration plan

## Recommended decision

Re-found Blueprint at the semantic layer while preserving the current product
as a compatibility and capability source.

Adopt the following working definition:

> **Blueprint is a repository-native, evidence-steered initiative protocol for
> human-authorized, agent-executed work.** It keeps intent, claims, evidence,
> and changes of direction inspectable across agents, people, tools, and time.

Use a side-by-side clean core plus adapters. Keep **Blueprint** provisionally as
the brand. Replace the category promise—not the name—with the more precise
definition above. Do not ship a methodology wave, change `template/`, or write
to a consumer until the remaining authoring and cold-use gates pass.

## Direct answers to the operator's questions

### Was Film Room an issue with Claude, the method, or both?

Both, with different responsibility.

- The agent made local steering choices that over-invested in portal/provenance
  work and allowed intermediate proof to carry too much meaning.
- The method permitted those choices to look procedurally legitimate because
  output lifecycle, stages, portal roles, and evidence grades were not tied to
  exact chartered claims strongly enough.
- The operator supplied the missing authority and corrected intent boundary.
- Codex exposed the mismatch through audit and re-steering, but a model change
  is not a durable control. Another capable agent could repeat the drift under
  the same ambiguous contract.

The method should own prevention. Model-specific adapters may help execution,
but correctness cannot depend on choosing Claude or Codex.

### Is Blueprint's intent defined correctly today?

Not quite. The current corpus mixes at least four ideas:

1. a staged product-discovery and implementation-readiness process;
2. a repository-native evidence and rationale system;
3. a toolchain of reviewers, derivations, portals, fleet controls, and gates;
   and
4. a human-authorized steering loop for agent-executed work.

The fourth is the governing idea. The first is one recipe, the second is the
durable record, and the third is implementation capability. Treating the
staged recipe as the methodology itself caused many of the category errors the
consumer shadows surfaced.

### Is it really “a method for steering agentic work”?

That phrase is true but too agent-centered and too prompt-adjacent. Blueprint
governs initiatives, not agents. It must still work when the critical evidence
comes from a human encounter, a scheduled system, a package inspector, a
receiving team, or an external platform.

Use “evidence-steered initiative protocol for human-authorized,
agent-executed work” as the precise category. “Operators steer; agents execute;
evidence governs advancement” remains a useful short explanation.

### Is Blueprint still the right name?

Provisionally yes as a brand; not as a literal description of the ontology.

Decision 04 correctly found no superior, clear, ownable replacement and a high
migration cost. The re-foundation does not produce a better candidate. It does,
however, constitute new product-definition information: the method is less an
up-front construction plan than a revisable control loop.

Therefore:

- retain Blueprint now;
- update the descriptor and promise;
- do not run another candidate-generation sprint;
- add cold category-inference evidence to the revisit trigger; and
- reopen naming only if target users repeatedly infer fixed specification,
  waterfall planning, or document generation after hearing the qualified
  description—or if commercial-brand investment triggers the existing
  Decision 04 threshold.

### What is gained by rebuilding from first principles?

- a minimal semantic contract independent of current stages and portals;
- claim-specific evidence instead of global readiness labels;
- explicit authority and re-chartering;
- deterministic separation of open, stale, contradicted, unobservable,
  invalidated, and satisfied;
- conditional modules instead of universal ceremony;
- model neutrality; and
- the ability to retain current capabilities only where evidence shows they
  belong.

### What is lost or made harder?

- current terminology and workflow familiarity;
- direct one-to-one mapping from stages to “where are we?”;
- simplicity inside the implementation—the compiler, profiles, adapters,
  migrations, schemas, and error UX become product obligations;
- short-term single-system clarity during shadow migration;
- confidence from years of accumulated current-tool edge cases unless they are
  deliberately ported or adapted; and
- the illusion that a clean ontology is automatically a usable product.

The compact replay mitigates authoring cost but does not erase these costs.

## Proposed architecture

```text
author-facing contract
  charter + actors + claims + receipts + dispositions
                         │
                         ▼
                 recipe/compiler layer
        actor profiles · evidence profiles · modules
                         │
                         ▼
                    normalized K1
    charter revisions · claim graph · receipt ledger · disposition log
                         │
                         ▼
              deterministic state + reasons
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          doctor       progress    human views
           view         recipes     and portals

current Blueprint sources ── compatibility adapters ──┘
```

### Kernel

The kernel owns only record validation, evidence compatibility, authority,
dependencies, dispositions, and derived states.

### Recipe/compiler layer

Named actor profiles, evidence profiles, conditional modules, and compact
authoring compile into the kernel. Profiles are inspectable versioned policy,
not hidden inference.

### Adapters

Current actor-output, doctor, reviewer, state/scenario, issuance, and artifact
records may issue bounded receipts or claims. They may yield open or invalid
mappings; they may never invent authority or upgrade evidence to make a report
green.

### Views

Stages, variants, tiers, portals, and doctor summaries remain useful views and
recipes. They do not become kernel truth and do not map automatically to a K1
checkpoint.

## Consumer context used

The decision is not based only on Film Room.

| Consumer/archetype | Contribution to the decision |
|---|---|
| Blueprint self-application | proved current tool adapters and exposed stage/doctor/actor-output question mismatch |
| Film Room | assisted-distribution re-charter, simulated-versus-human proof, stale agent receipt, active operator correction |
| Fleet Observability | intrinsic single-operator boundary, implementation-versus-operation split, no universal handoff |
| BC Subscriptions | large brownfield state graph, source-version freshness, behavior evidence, receiving-team handoff |
| Rally HQ | could-not-observe semantics and human-surface evidence |
| SE Docs Front Door | configure-first external-system boundary and actor task evidence |
| QuantifAI | unavailable actor/environment and authorized re-chartering |
| external adopter | metadata-only boundary; no invented end-to-end success claim |

The registry's remaining consumers matter for compatibility inventory and later
read-only fleet scans, but they do not need to become hand-authored case studies
unless they add a new semantic boundary.

## Migration principles

1. **One writable truth at a time.** During shadow, current files are
   authoritative and v2 is disposable. During a native pilot, the compact
   contract becomes authoritative and legacy views must derive or freeze; never
   hand-edit both.
2. **No bulk restamp.** Consumers migrate individually by boundary and only
   after their shadow discrepancies are understood.
3. **No evidence upgrades.** Missing scope, authority, observer, version, or
   oracle yields open/invalid mapping, not a convenient default.
4. **Compatibility before deletion.** Keep current reviewers and safeguards
   until an exact adapter, replacement, or explicit retirement decision exists.
5. **Generated state is disposable.** Normalized K1 and views are rebuilt; only
   authored contracts, receipts, and decisions are durable.
6. **Rollback is designed first.** Every phase names how to return to the prior
   authoritative contract without rewriting consumer history.
7. **The methodology freeze still applies.** A v2 experiment is not a waiver to
   edit `template/` while an external consumer migration is in flight.

## Migration sequence

| Phase | Scope | Authority | Exit gate | Rollback |
|---|---|---|---|---|
| 0. Research hardening | root research tree only | current operator continuation | negative compiler fixtures, native encounter-receipt path, compact schema diagnostics, all current tests | delete generated/research prototype |
| 1. Cold authoring | disposable fixture plus a context-cold agent/operator | explicit operator authorization for the exercise | author reaches a valid charter/claims/checkpoint report without methodology-creator intervention; ambiguity log reviewed | discard fixture |
| 2. Root native shadow | Blueprint self-application; current root contract remains authoritative | explicit root migration decision | compact source reproduces root shadow, receipt UX exercised, rollback rehearsed | remove native source; current root files unchanged |
| 3. First live consumer | Fleet Observability, because it is clean and single-operator | separate live-write authorization | one authoritative compact contract, scheduled-operation receipt path, doctor discrepancies dispositioned, normal operation unaffected | restore current manifest authority; retain migration receipt |
| 4. Active-product consumer | Film Room after its dirty launch work stabilizes | separate authorization and isolated worktree | founder receipt captured, package inspection and second-operator claims remain honest, actor-output adapter discrepancy zero or accepted | return to actor-output authority |
| 5. Brownfield/handoff consumer | BC Subscriptions last | separate high-blast-radius authorization | state freshness and scenario receipt generation automated; receiving-team authority/acceptance remains explicit | return to existing state/handoff sources |
| 6. Public experimental distribution | opt-in CLI command/schema; no default change | methodology wave after freeze check | two contrasting live pilots, cold-author pass, upgrade/doctor/fleet support, documented rollback | remove experimental command in next release; native sources remain readable |
| 7. Default/sunset decision | only after fleet evidence | explicit major semantic decision | migration coverage threshold met; adapter cost and unresolved mappings below accepted limits | keep compatibility reader for a declared support window |

Phase numbers are gates, not dates. No phase is earned by completing documents
alone.

### 2026-07-23 gate application

Phase 4's control-contract migration is complete, but the exact founder outcome
is open and operator feedback is explicitly deferred. The subsequent Film Room
UX work was governed by a separate Steering plan while Blueprint was frozen;
it cannot substitute for the Phase 4 human receipt.

A refreshed read-only BC shadow therefore does not advance Phase 5 authority.
It remains K1-valid while current behavior evidence is contradicted by a stale
state register plus absent normalized scenario results, and handoff acceptance
is open. See `21-bc-subscriptions-phase5-readiness.md`. A live Phase 5 write
requires either the existing sequence gate or an explicit operator waiver; a
read-only readiness audit requires neither.

## Remaining Phase 0 gates

The semantic and compact replays pass, but Phase 0 is not complete until:

- compact compiler negative fixtures reject unknown profiles, unauthorized
  dispositions, missing actors, unsafe paths, and malformed claim dependencies;
- native human/encounter receipts can be authored without editing normalized
  K1 JSON;
- receipt supersession and contradiction policy is decided;
- compiler diagnostics cite compact source locations;
- schemas and profile versions are explicit;
- generated-output deletion/rebuild is tested;
- the current K1 adversarial suite and `test:core` remain green; and
- public-repository sanitization is automatic rather than a manual grep.

## Wave and release policy

### What is not a wave

Root research files, generated shadows, compact fixtures, and decision drafts
do not change the distributed methodology and do not receive wave numbers.

### First eligible wave

The first possible methodology wave may add only an opt-in, read-only
experimental shadow command and its schemas/tests. It must not change default
stage, doctor, portal, init, or upgrade semantics.

Before that wave:

1. inspect `blueprint fleet` for external migrations in flight;
2. obey the existing freeze/waiver rule;
3. rerun core and stamp smoke;
4. prove the command writes only disposable generated output; and
5. document uninstall/rollback.

### Native authoring wave

Native compact authoring is a later, separate wave. It remains opt-in until at
least two live consumers with different boundaries pass. A default semantic
switch requires an explicit compatibility and support-window decision even
while the npm package remains pre-1.0.

### No wave laundering

Do not distribute a root experiment by calling it documentation-only if it
changes how a stamped consumer is evaluated. Any `template/` or public CLI
behavior change is a methodology change and must obey the wave/freeze rules.

## Compatibility contract

During the strangler period:

- existing consumer files and commands remain supported inputs;
- v2 adapters publish exact mapping provenance and unresolved fields;
- a current `PASS`, stage completion, or `issued` output never automatically
  becomes a satisfied K1 outcome;
- a K1 result does not rewrite current stage assertions in shadow mode;
- compact/profile schema versions are pinned per native consumer;
- profile changes cannot silently alter previously authored authority or
  evidence requirements;
- migration creates a durable disposition naming the new authoritative source;
  and
- compatibility readers outlive compatibility writers: old sources remain
  readable after new native authoring becomes preferred.

## Naming and positioning policy

### Brand decision

Retain **Blueprint**. This proposal does not supersede Decision 04's name
selection. It adds new product-definition evidence and narrows what the name is
allowed to promise.

### Category line

Preferred:

> Blueprint is a repository-native, evidence-steered initiative protocol for
> human-authorized, agent-executed work.

Short form:

> Operators steer. Agents execute. Evidence governs advancement.

### Avoid

- “a blueprint generated by AI”;
- “the complete plan before implementation”;
- “a portal-first product methodology”;
- “an autonomous agent framework”;
- “a method for prompting agents”; and
- any claim that stages or documents are the product's invariant core.

### New revisit evidence

Add category-inference tests to the existing naming trigger. Ask cold target
users what they think Blueprint does after seeing only name + descriptor. A
rename becomes justified if the qualified brand repeatedly causes a materially
wrong fixed-plan/document-generation inference and a candidate clears Decision
04's collision, credibility, and migration thresholds.

## Success and stop conditions

### Continue the strangler path when

- compact semantics remain equal across new archetypes;
- adapters are bounded and mostly mechanical;
- cold authors can produce valid contracts with fewer decisions than the
  explicit interchange form;
- native receipts reduce, rather than relocate, narrative evidence debt; and
- rollback remains trivial before each default switch.

### Reconsider a separate clean rewrite when any two occur

- compatibility adapters exceed equivalent native implementation complexity;
- most consequential legacy mappings remain unavailable or require operator
  guesses;
- dual validation causes a real false green or data-loss incident;
- package boundaries prevent a filesystem-neutral kernel;
- native authoring cannot remain compact while legacy compatibility is loaded;
  or
- current release/governance coupling makes opt-in isolation impossible.

### Stop the re-foundation when

- cold authoring requires methodology-creator intervention for ordinary cases;
- profile magic hides authority or scope changes;
- K1 adds ceremony without changing consequential decisions or evidence
  quality; or
- live operation is less reliable than the current method with no compensating
  reduction in false greens.

## Ratification boundary

This document recommends four decisions for operator ratification:

1. accept the four-record K1 semantic core;
2. accept side-by-side v2 plus adapters as the migration architecture;
3. retain Blueprint as the brand while replacing its category promise; and
4. authorize Phase 0 root-only hardening.

It does **not** authorize root current-manifest migration, consumer writes,
`template/` edits, a methodology wave, release changes, or a live pilot. Each
is gated above.
