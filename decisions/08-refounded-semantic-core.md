# Decision 08 — adopt the refounded semantic core as the root contract

**Status:** Accepted 2026-07-22 after K1 falsification, three-consumer replay,
root dogfood, and independent cold authoring passed.

## Context

Film Room exposed a failure that changing agents corrected locally but did not
prevent structurally: output and process progress could look healthy while the
founder's actual product and distribution claims remained unsupported. A
six-month corpus review found the same class in different forms across
Blueprint itself, Fleet Observability, BC Subscriptions, Rally HQ, SE Docs Front
Door, and QuantifAI.

The failure was mixed. The executing agent made local steering choices, but the
method let those choices appear legitimate because stages, portal lifecycle,
proof grades, and broad status words were not bound tightly enough to exact
chartered claims. A model change is not a durable control.

The re-foundation derived a smaller kernel from first principles: chartered
actors and authority, falsifiable claims, claim-specific evidence contracts,
append-only receipts, explicit dispositions, dependencies, checkpoints, and
conditional modules. Current Blueprint capabilities remain adapters or views
rather than becoming kernel truth by historical default.

Evidence before adoption:

- K1 falsification: 18/18 positive and adversarial specimens matched;
- Film Room, Fleet, and BC compact replay: exact semantics and states, 642 to
  143 authored nonblank lines (77.7% reduction);
- root compact replay: exact semantics and states, 116 to 40 lines (65.5%
  reduction);
- compiler hardening: native receipts, append-only correction, deterministic
  rebuild, source diagnostics, versioned profiles, sanitization, and twelve
  negative fixtures passed;
- independent cold author: 34/34 in two attempts, zero questions, zero
  methodology-creator interventions; and
- first live consumer: Fleet native pilot committed on its isolated branch with
  implementation satisfied, doctor contradiction retained, and operation open.

## Decision

`blueprint-native.yml` is the root self-application's governing contract for
charter, actor authority, claims, native receipts, dispositions, checkpoints,
and conditional modules.

Its precise category is:

> Blueprint is a repository-native, evidence-steered initiative protocol for
> human-authorized, agent-executed work.

“Operators steer. Agents execute. Evidence governs advancement.” remains the
short explanation. “Method for steering agentic work” is directionally true but
is not the formal category: Blueprint governs initiatives across agents,
humans, tools, external systems, and time.

The **Blueprint** name remains the brand. It is not a promise of a fixed,
complete up-front plan. Naming reopens only when cold target users repeatedly
infer fixed specification, waterfall planning, or document generation after
seeing the qualified descriptor, or when the separate commercial threshold in
Decision 04 is reached.

## Source ownership during the strangler period

There is one governing contract graph, not two competing progress ledgers:

- `blueprint-native.yml` owns charter, authority, explicit claims, receipts,
  dispositions, checkpoints, and module activation;
- `actor-output.yml` remains the compatibility-owned output inventory and
  authors the outcome statements explicitly imported by the native contract;
  lifecycle and human-validation status do not become native receipts;
- `blueprint.yml` remains legacy stage, portal, cost, distribution, and
  integration configuration; it no longer asserts native claim progress; and
- generated normalized K1 and reports are disposable and never hand-edited.

An overlapping fact must have one owning source. Adapters may read it; they may
not duplicate it as a second writable assertion.

The maintainer explicitly holds `correct-receipt` authority. Correction keeps
the mistaken receipt in append-only history and requires a same-claim
replacement or explicit invalidation.

## Architecture

Adopt the strangler architecture rather than a wholesale greenfield rewrite:

1. compact author-facing charter/claim/receipt contract;
2. versioned, inspectable actor and evidence profiles;
3. normalized K1 record and deterministic evaluator;
4. bounded adapters for current tools and consumer sources; and
5. stages, doctor, progress, portals, and reviewer summaries as recipes/views.

This refounds semantics from scratch while preserving proven capability. A
simultaneous rewrite of tooling, distribution, portals, and consumers would
discard edge-case coverage and create unnecessary migration risk.

## Consequences

Benefits now demonstrated:

- process completion can no longer satisfy an unrelated outcome claim;
- contradiction, staleness, inability to observe, invalidation, and absence are
  distinct states;
- authority and re-chartering are explicit;
- solo operation does not pay universal handoff ceremony;
- model identity is outside the correctness boundary; and
- the author-facing contract is materially smaller than the normalized record.

Costs now accepted:

- compiler, parser, schema, profile versioning, migrations, and error UX become
  product obligations;
- adapters must be maintained until each legacy source is migrated or retired;
- dual views can confuse operators unless source ownership stays explicit;
- profiles can become hidden methodology if their expansion is not inspectable;
  and
- the research schema is not yet a public/default compatibility promise.

## Rollout ceiling

Do not change `template/`, the default CLI contract, or public methodology
semantics yet. Public opt-in distribution requires at least two contrasting
live consumers, continued cold-author success, upgrade/doctor/fleet support,
and a documented support/rollback window.

Fleet is the first live native pilot. Film Room follows only after its launch
work stabilizes and a founder receipt can be captured. BC Subscriptions follows
last because freshness, scenarios, and receiving-team authority make it the
highest-blast-radius migration.

## Post-decision rollout evidence

Fleet's first operation encounter refined the native contract at `7274d30`:
report arrival is satisfied, report use is contradicted, and the combined
operation checkpoint remains contradicted.

Film Room's launch work was preserved, integrated, and fully verified at
`83d85fc`. Its authorized native pilot was then committed on
`codex/film-room-native-pilot` at `5de85b0`, with a two-file-only rollback
surface. The migration is valid, exact unsigned package inspection is
satisfied, the native window is unobservable, current-matrix and launch
information claims are contradicted, and founder operation remains open.

The first live founder encounter was subsequently recorded at `0e89411`. The
maintainer could not enter the real-footage path from the disabled-looking
first-run control, so founder operation at exact `83d85fc` is contradicted.
Commit `0db4285` pins all affected claims and receipts to that product revision
so later work cannot inherit them implicitly.

Decision 0012 and exact product commit `e1c21d9` repair the entry boundary.
Exact staged entry encounters, 13/13 Playwright, unsigned package inspection,
and packaged-process startup pass. Semantic tip `c5ecf1e` adds only
candidate-specific claims and receipts: repaired package readiness is
satisfied, the replacement founder claim remains open pending a fresh
maintainer event, and assisted-beta readiness remains contradicted.

That next maintainer encounter contradicted the `e1c21d9` claim: normal launch
entered Review because the practice sample existed, and the visible Ingest
chooser produced no native folder panel. Evidence-only commit `5ec5398`
preserves the failure. Decision 0013 and exact product `5cc4fd2` repair the
default route, dynamic-loopback Tauri capability, and visible picker recovery.
Semantic tip `2a72970` binds active claims to that exact product; its machine
entry/package/process checkpoint is satisfied while native-window and founder
outcomes remain open.

The following encounter satisfied `5cc4fd2` native launch and real folder
selection but contradicted founder operation when Analyze required manual
creation/editing of `operator.json`; evidence tip `0cd7aef` preserves both
receipts. Decision 0014 and exact product `5496edd` separate sample/library
state from operator readiness and provide in-app, atomic, draft-preserving setup
recovery. Semantic tip `ada6cf6` binds active claims to that candidate; its
machine entry/package/process checkpoint is satisfied while native-window and
founder outcomes remain open. During the live encounter, keyboard Back restored
the preserved Ingest draft after successful setup and Analyze began running;
tip `a370647` therefore satisfies the exact native-window recovery claim while
founder completion remains open. Missing visible return navigation and
misleading confirmation copy remain an explicit usability finding.

This establishes a second contrasting live native contract without overriding
the rollout ceiling. Film Room's first Phase 4 operation encounter failed; its
replacement candidate is now built and awaits a new compatible real-event
receipt. Upgrade, doctor/fleet, compatibility-window, and support-window work
also remains before any public opt-in distribution.

## Rollback

Rollback is an append-only decision that marks `blueprint-native.yml` dormant
and restores the prior contract's authoring authority. Keep the native source,
receipts, and this decision in history. Current compatibility files remain
readable, so rollback requires no translation or deletion of evidence.
