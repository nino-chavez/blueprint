# Steering-loop convention (decisions/06, wave 92)

Feedback is a contract, not a hope. "Operators steer" extends to every human you invite into the initiative — but only if each invitation is an *output* with a declared reader, explicit asks, and a visible consequence. Deploying a surface does not produce steering; this convention does.

## The six job families (interrogation taxonomy — NOT pages)

Ask of your manifest: which of these do my *declared, evidenced* actors need, and which output serves each?

| Family | Actor's job | Typical output |
|---|---|---|
| orient | understand relevance, choose where to go | orientation-brief |
| learn/use | learn and use the product | Diátaxis docs (when a second user exists) |
| steer | influence live decisions | steering-packet |
| audit | assess whether the work was rigorous | provenance/evidence pack, case study |
| receive | receive a scoped deliverable | issued-package (recipient-safe) |
| operate | resume and execute | recovery-brief, boot-packet |

**Anti-regression clause:** these are questions, never a navigation contract. Rendering all six as site sections for every initiative recreates the retired 6-verb portal with better vocabulary. A two-page brief satisfying three families is a valid — often optimal — projection. An initiative activates only the families its real actors evidence.

## The three loop output types

- **`orientation-brief`** — for a cold newcomer: problem, audience, thesis, key findings, current product, open questions, artifact map. One document; a site never before recurring readers.
- **`steering-packet`** — for an advisor/stakeholder/buyer influencing live decisions. Required fields (validator-enforced):
  - `asks:` — the explicit contribution requested, per open decision
  - `authority:` — which decisions are the reader's to influence vs. informational
  - `capture:` — where contributions land (default: `feedback/`; must resolve on disk)
  - `omissions:` — see the tension rule below
- **`disposition-record`** — closes the loop: what each contribution changed, or why it changed nothing. Without it contributors are consulted once and never see consequence.

## The projection-tension rule (validator: ERROR)

When a projection's forbidden class removes an axis a served decision *needs*, name the omission — never withhold silently. Any output serving a `decide-*` / `steer-*` outcome with a `projection.forbidden` list must carry `omissions:` entries of the form "X is deliberately absent; resolved at Y."

Origin: a director-walk of a real scope aid — the reader could decide scope *in kind* but not *in size*, because cost was walled off by the `pricing` class and the aid never said so. The silence read as a gap, not a boundary.

## Receipts

A steering-packet's success is observed-human by construction: a real contribution, recorded at the capture destination, referenced by a disposition-record. Simulated walks (persona agents) are valid *interim* grades — never upgrade them.

When the reader can review independently of the operator, make that loop
executable with `review-contract.json` per
`docs/methodology/review-disposition-loop.md`. The steering packet remains the
invitation; the review contract pins the candidate, adapter, submissions,
dispositions, and return-to-reader receipt. A synchronous meeting or private
thread may remain mediated, but the contract must say so rather than implying
self-service capture.

## Steering ≠ clearance

Inviting someone to steer does not grant internal clearance. A counterparty steering scope receives a recipient-safe packet (their facts, their decisions, named omissions); a trusted advisor may receive internal strategy. Same loop, different projections — declare each as its own output.
