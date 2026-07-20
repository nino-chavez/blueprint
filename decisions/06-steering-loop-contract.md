# decisions/06 — The steering loop: actor communication, contribution, and disposition become contract

**Status:** Accepted (ratified 2026-07-20, "ratify both")
**Date:** 2026-07-20
**Wave:** 92 (freeze check 2026-07-20: 14 consumers, 5 behind at rest, 0 mid-migration — no waiver needed)

## Context

decisions/05 (accepted, wave 89) governs *which outputs exist and who they serve*. The 2026-07-20 multi-lens reassessment (four persona/red-team walks + a director-walk of film-room's scope aid + four Codex review rounds) exposed that Blueprint's loop is specified for its first seven stages and implicit for its last three:

```
context → research → decisions → specs → prototypes → implementation → receipts
   → actor-specific communication → steering contribution → disposition
```

METHODOLOGY.md:388 promises stakeholder feedback updates decisions, docs, and prototypes — but names no mechanism. The historical assumption was that deploying a portal causes useful feedback. The fleet evidence says it never did: no surface in any consumer implements an open-decision register, explicit asks, authority statements, feedback capture, or visible disposition. "Operators steer" currently means only the *original* operator can steer, because every other human faces either repo access or an undirected portal.

The first real steering artifact — film-room's scope-decision aid — surfaced the deep rule in its first simulated walk: the director could decide scope **in kind** but not **in size**, because the `pricing` forbidden class silently removed the axis the decision needed, and the aid never said so. Projection boundaries and decision outcomes can be in tension; papering over it corrupts the steering it exists to enable.

## Decision

1. **Six job families become the output interrogation taxonomy**: *orient, learn/use, steer, audit, receive, operate*. They are questions asked of an initiative's manifest — "which of these do your real actors need, and which output serves each?" — **never** a navigation or page contract. An initiative activates only the families its declared actors evidence. (Anti-regression clause: rendering all six as site sections for every initiative would recreate the retired 6-verb mistake with better vocabulary. A two-page brief satisfying three families is a valid, often optimal, projection.)

2. **Three new output types** complete the loop:
   - `orientation-brief` — cold newcomer → understand relevance, choose where to go. Problem, audience, thesis, findings, current product, open questions, artifact map.
   - `steering-packet` — advisor/stakeholder/buyer → influence live decisions. MUST declare: the open decisions, explicit asks, the reader's authority, the capture destination (e.g. `feedback/`), and — see 3 — its omissions.
   - `disposition-record` — closes the loop: what each contribution changed, or why it changed nothing. Without it, contributors are consulted once and never see consequence, and the methodology cannot claim the feedback stage exists.

3. **The projection-tension rule.** When a projection's forbidden class removes an axis a served outcome requires, the output must name the omission explicitly ("cost is deliberately not in this document; it is a meeting conversation"). Mechanically: any output serving a decision-class outcome (`decide-*`, `steer-*`) with a `projection.forbidden` list MUST carry an `omissions:` field naming what is withheld and where it gets resolved. Validator: ERROR when absent.

4. **Steering receipts.** A steering-packet's success is observed-human by construction (a real contribution, recorded at the capture destination, with a disposition-record reference). Simulated walks remain valid interim grades.

5. **Validator hardening from the same audit** (folded here because they share the release): (a) citation-integrity — a manifest or shipped-code comment citing `decisions/NNNN` must resolve to a file that exists; grade the "authorizes what the citation implies" half as a reviewer check, not a regex; (b) `status: issued|ready` outputs MUST declare an `artifact:` (film-room's scope aid slipped through without one).

## Build order (after acceptance)

1. `actor-output.mjs`: three output types recognized; `omissions:` requirement (R3 extension); artifact-field requirement (R2 extension); citation-existence check (R7 extension). Self-tests per house rules.
2. Steering-packet + disposition conventions documented in the methodology docs; `feedback/` named as the default capture destination (already stamped).
3. Prose reconciliation rides the same wave: README.md:5 ("one portal that serves…"), METHODOLOGY.md:362 ("deployed URL is the primary deliverable"), METHODOLOGY.md:388 (feedback promise gains its mechanism reference).

## Consequences

- Steering becomes as verifiable as research and prototyping: an initiative claiming "stakeholders steer" without a steering-packet + disposition-record is now mechanically visible as unserved.
- The six families give reviewers and doctor a vocabulary for "which job is this surface doing" without prescribing form.
- Ceremony stays evidence-gated: a solo initiative with no external actors activates none of this.

## Ratification items (operator)

| # | Item | Recommendation |
|---|---|---|
| 1 | Six families as interrogation taxonomy (not nav) | ☑ ratified |
| 2 | Three output types + omissions rule | ☑ ratified |
| 3 | Validator hardening (citation-exists, artifact-required) | ☑ ratified |
| 4 | Prose reconciliation in same wave | ☑ ratified |
