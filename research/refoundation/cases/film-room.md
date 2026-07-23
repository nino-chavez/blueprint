---
canonical: false
status: evidence-ready
date: 2026-07-22
initiative_shape: founder-operated-to-distributable
period: 2026-07-16..2026-07-22
---

# Film Room claim-control dossier

## Governing intent and scope changes

Film Room began as a feasibility-first, local-first product initiative for one
known operator. Its initial evidence explicitly rejected a second user as part
of the validated pain and deferred a native Mac package until the tool would be
distributed. That original contract matters: a founder-operated tool is not a
failed self-serve product merely because it does not yet serve a cold second
operator.

The initiative later crossed two boundaries:

1. a real second organization expressed interest in the tool and adjacent
   automation; and
2. the operator explicitly pursued a standalone Mac product that could install
   and run without an engineer.

The product core proved useful on real events. The delayed control was not
"discover whether the core works"; it was "replace the governing scope and
claim ceiling before distributable-product work advances."

## Incident FR-01 — method conformance was inspectable but not imposed

**Status:** evidenced · **Confidence:** high

- **Intent before:** advance a newly stamped Blueprint initiative through its
  declared stages and guards.
- **Claim:** the deterministic state machine and completed artifacts made the
  next stage/deploy work the natural continuation.
- **Issuer:** builder chat plus stage-state interpretation.
- **Evidence at the time:** the state machine itself was deterministic, and
  some Stage-4 mechanical checks were performed; however, `blueprint doctor`
  had never been run at a gate, the initiative was not registered/pinned, and
  a portal shell could read green while replacement markers remained.
- **Transition:** the builder continued until the operator asked whether the
  rules had actually been followed. The first Doctor run then exposed the
  false-green conditions and prompted remediation.
- **Classification:** `existing-rule-noncompliance` primary;
  `enforcement-gap` contributing. The guard existed and canonical methodology
  context was injected into the session. The missing capability was not more
  prose explaining Doctor; it was making required preflight consequential at
  transition time.
- **Earliest safe catch:** before the first stage advance or any conclusion
  based on stage state. The signal already existed: Doctor had no passing
  receipt for the initiative version.
- **Candidate control to test:** an advance operation derives and records every
  required preflight; absence/could-not-run is non-green and cannot be replaced
  by builder recollection.
- **Counterevidence:** the builder's audit distinguished deterministic state
  from missing guard execution instead of claiming the whole state machine was
  random. Remediation followed once the operator requested the check.

**Sources**

- Local Claude JSONL session `4fef2992-f24d-4889-92cb-37310293aed1`, sampled
  around the operator's "have we been following the rules?" audit.
- `film-room:blueprint.yml` and the remediation history recorded in that
  session.

## Incident FR-02 — implementation began before the promised design loop

**Status:** evidenced · **Confidence:** high

- **Intent before:** research and design how a human operator should use the
  application, prototype the proposed interaction, iterate with the operator,
  then implement.
- **Claim:** UX design was complete enough to begin building the application
  shell.
- **Issuer:** builder chat and implementation action.
- **Evidence at the time:** pipeline-oriented navigation and initial screens
  existed, but no dedicated UI/UX research pass or operator-reviewed
  click-through prototype had occurred. Requirements existed across several
  artifacts, but no canonical PRD spine answered "show me the requirements."
- **Transition:** implementation began. The operator interrupted and asked
  whether the design had been prototyped as Blueprint required. The builder
  deleted the premature fork, created a read-only `/mock`, and consolidated a
  requirements spine.
- **Classification:** `existing-rule-noncompliance` primary;
  `enforcement-gap` contributing. The prototype-before-implementation promise
  was already part of the method; Stage 5 could nevertheless appear satisfied
  from a directory/artifact condition.
- **Earliest safe catch:** before the first production UI edit. The available
  signal was the absence of an operator-reviewed prototype receipt and a
  resolvable requirements owner.
- **Candidate control to test:** production implementation of a user-facing
  claim requires a traceable prototype decision and the appropriate actor's
  disposition; a file or route alone is not that receipt.
- **Counterevidence:** the correction was cheap because the implementation fork
  was only two edits old. Some research and requirement content did exist; the
  defect was its authority and sequence, not total absence.

**Sources**

- Local Claude JSONL session `4fef2992-f24d-4889-92cb-37310293aed1`, sampled
  around "did we prototype the design" and the stacked BRD/PRD question.
- `film-room:docs/content/product-requirements.md` — corrective consolidated
  spine produced after the interruption.

## Incident FR-03 — the distribution trigger fired before re-chartering

**Status:** evidenced · **Confidence:** high

- **Intent before:** one operator, one computer, local-first; a second paying
  operator would trigger a new initiative/pilot, and native packaging would
  trigger when the tool went to a second user.
- **Claim:** portability, packaging, and standalone-app work could continue as
  the next iteration of the completed greenfield initiative.
- **Issuer:** work sequencing and the stale greenfield declaration.
- **Evidence at the time:** the console had shipped its original arc; a second
  organization had expressed real interest; a cold second-laptop walk required
  three engineering interventions; standalone distribution work was already in
  flight.
- **Transition:** the initiative was re-declared `midstream` on 2026-07-21, but
  its own ADR states that Stage 0/1 work had run organically before the
  declaration—the "stamp overdue" condition.
- **Classification:** `intent-change` primary; `enforcement-gap` contributing.
  The conceptual triggers existed, but no transition invalidated the old
  governing contract or blocked new-scope work.
- **Earliest safe catch:** when distribution of the tool or the no-engineer
  install outcome became intended—not only when willingness-to-pay was proven.
  Interest, paid adoption, assisted beta, and self-serve are different claim
  ceilings and need not share one trigger.
- **Candidate control to test:** a scope-changing event preserves prior evidence
  but opens a mandatory re-charter that names product mode, actors, assistance
  level, lifecycle claims, and invalidated assumptions before advancement.
- **Counterevidence:** willingness-to-pay was deliberately not tested, so the
  evidence did not justify a paid-product claim. The eventual ADR records that
  distinction honestly and keeps the second persona uninstantiated.

**Sources**

- `film-room:decisions/0001-solo-first-local-first.md`
- `film-room:decisions/0003-output-layer-shape.md`
- `film-room:decisions/0007-midstream-redeclaration.md`
- `film-room:research/current-state/630-director-interest.md` (identity remains
  de-named here as `pilot-club director`).

## Incident FR-04 — one green stage state could not answer "ready for whom?"

**Status:** evidenced · **Confidence:** high

- **Intent before:** first the founder-operated workflow, later a second-operator
  distributable product.
- **Claim:** the initiative's substantially green later stages and phrases such
  as "done" or "end to end" could stand in for product readiness.
- **Issuer:** stage-status surfaces and ambiguous completion language—not one
  single false statement.
- **Evidence at the time:** real event operation supported founder-production
  readiness. The later independent audit found no verified distributable,
  incomplete mutable-data separation, founder-specific integrations and docs,
  weak cold-entry orientation, and no complete release lifecycle.
- **Transition:** repeated operator questions forced narrower answers; the fresh
  Codex audit supplied the explicit three-level verdict: founder-operated ready,
  assisted beta reachable, self-serve paid Mac product not ready.
- **Classification:** `oracle-claim-mismatch` primary. Stage completion and
  artifact progress did not encode the actor, environment, assistance level, or
  evidence ceiling required by "ready."
- **Earliest safe catch:** every status render and completion response. The
  product mode and strongest receipt were already knowable.
- **Candidate control to test:** every consequential green status renders a
  scoped claim ceiling such as founder-live, assisted-beta, cold-install-live,
  or observed-second-operator—never bare "done."
- **Counterevidence:** the independent audit validates the differentiated core
  and founder workflow. It does not conclude that the original initiative built
  the wrong product.

**Sources**

- User-supplied Codex Film Room audit, 2026-07-22, lines 1–31 and 61–109.
- `film-room:research/personas/solo-media-operator.md` J6-day-one.
- Local Claude JSONL sessions containing the operator's "are we done?" and
  "all app features" questions.

## Incident FR-05 — distributable artifacts did not prove packaged behavior

**Status:** evidenced technical finding; causal attribution partial ·
**Confidence:** high on defect, medium on method classification

- **Claim:** signing/notarization scripts, an application bundle target, and
  passing source-level checks represented progress toward a usable Mac release.
- **Evidence at the time:** those artifacts existed, but the packaged shell
  moved only database/config state to app data; renders, analysis, thumbnails,
  and logs still resolved below the bundled resource root. No clean-Mac DMG
  install and complete event receipt existed.
- **Transition:** the independent audit classified distribution and packaged
  runtime integrity red and required a single mutable-data seam plus a real
  cold-install/event/recovery pass.
- **Classification:** `oracle-claim-mismatch` primary if any release readiness
  depended on the artifacts; otherwise a `project-specific` packaging defect.
- **Earliest safe catch:** before a signed build could count toward
  distributable readiness. The portable signal is absence of an executed
  package-boundary and cold-install receipt.
- **Candidate control to test:** distributable-product claims activate an
  immutable-resource/mutable-state boundary audit and target-environment
  journey receipt. Source tests remain useful but cannot upgrade themselves.
- **Counterevidence:** the audit states the engineering substrate is real and
  its test suite passed; those checks prove useful weaker claims.

**Sources**

- User-supplied Codex Film Room audit, 2026-07-22, readiness table and P0
  sequence.
- `film-room:apps/shell/src-tauri/src/main.rs`
- `film-room:pipeline/serve.py`, `pipeline/jobs.py`, and
  `pipeline/analyze.sh` as cited by the audit.

## Positive control FR-P1 — founder-operated production earned its claim

**Status:** evidenced · **Confidence:** high

The core workflow processed real footage and real events for the initiating
operator. The independent audit calls founder-operated production ready and
already proven. A future kernel that reacts to the later launch gap by marking
the entire initiative failed would destroy valid evidence and encourage
ceremony before a product earns it.

**Preservation requirement:** a re-charter invalidates only claims whose actor,
environment, assistance level, or outcome changed. It carries forward valid
substrate and receipts with their original scope.

## Operator ratification items

1. Was the intended second-operator mode at the trigger **assisted design
   partner**, **self-serve**, or intentionally unresolved? The control must not
   infer self-serve merely from interest.
2. Did any persistent surface explicitly state "launch ready," or was the harm
   primarily repeated ambiguity around "done"? FR-04 is written as the latter.
3. Which point should count as the formal scope trigger: expressed external
   interest, decision to package, first no-engineer acceptance criterion, or a
   pay ask?
4. Should FR-05 remain in the kernel corpus or stay a conditional distribution
   module fixture?
