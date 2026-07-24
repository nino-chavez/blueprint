---
canonical: false
status: completed-convergence-review
date: 2026-07-23
atelier_historical_revision: 6e35dbb
atelier_current_revision: d1aec33114abe330422b25e9c3addd10f83f45ba
blueprint_base_revision: dce8dac570eaf3b19d51565423a7ccd16aa890eb
template_changed: true
---

# Atelier convergence review: Blueprint owns the loop, not the substrate

## Verdict

The Film Room and Adaptive Commerce Content findings converge with what Atelier
attempted to become, but they do not imply that Blueprint should absorb Atelier
or ship a mandatory hosted feedback service.

The shared result is a layered boundary:

1. **Blueprint methodology** owns intent, actors, authority, exact candidates,
   asks, evidence, review semantics, dispositions, and resume consequences.
2. **A coordination substrate** may own identity, sessions, presence,
   annotations, transport, persistence, and triage queues.
3. **An initiative presentation** owns the reader-specific narrative and
   interaction: generic portal, bespoke site, native application, document, or
   external venue.

The reusable object is therefore the review/disposition contract. Atelier is
one possible adapter/substrate, not Blueprint's runtime destination.

## What Atelier attempted to become

The archived `atelier-dashboard-blueprint` initiative asked whether
BigBlueprint should become an Atelier feature. Its meta-evaluation answered:

> No — not as a feature. Yes — as a first-class supported usage pattern.

It rejected embedding Blueprint stages because that would make Atelier a
domain-specific workflow engine. It later split prototype methodology from
generic harness chrome:

- Blueprint-specific slices, stages, deliverables, and gates stayed a usage
  pattern.
- Reviewer drawer, strategy notes, annotation overlay, traceability, and
  presence became substrate features.

Atelier ADR-057 encoded that split. Current repository revision
`d1aec33114abe330422b25e9c3addd10f83f45ba` still contains:

- `/prototype/<project_id>` mounted harness chrome;
- self-service annotation creation through the existing `claim` primitive;
- annotations rendered from design contributions;
- reviewer scenario/scale controls;
- presence and strategy panels; and
- a feedback queue where external comments remain untrusted until a human
  approves or rejects them.

ADR-018 is the critical authority boundary: external content never auto-merges.

## Where the current findings match

| Finding from the current session | Atelier precedent | Convergence |
|---|---|---|
| The generic Blueprint portal is not the right presentation for every reader | Atelier separated project-owned content from generic harness chrome | Standardize the contract, not one presentation |
| Film Room feedback was useful only when pinned to the exact candidate | Atelier anchored annotations to project surfaces and trace IDs | Review input needs an exact target and durable anchor |
| The adaptive site can explain the initiative but cannot capture team feedback directly | Atelier supplied an authenticated annotation write surface | Reader self-service needs an adapter, not more narrative |
| The operator should not manually classify every reversible finding | Atelier used queues and classifier signals before human approval | Automate capture/classification/proposals while preserving authority |
| External input must not mutate product truth | Atelier ADR-018 required explicit approval | Submissions are untrusted; disposition owns consequence |
| Blueprint should remain model/harness-neutral | Atelier remained client-agnostic across Claude, Codex, Cursor, and others | The loop belongs in repository contracts, not one coding client |

## Where Atelier does not prove the conclusion

Atelier is precedent, not completed validation.

- The archived dashboard initiative left Stage 6 triage open.
- Its standalone Cloudflare review deployment was deleted after the substrate
  mount became canonical.
- No observed reader submission and returned disposition survives in the
  initiative record.
- The harness requires an Atelier deployment and authenticated composer,
  inappropriate as a mandatory dependency for every Blueprint consumer.
- Annotation pins were encoded inside `contributions.content_ref`, a pragmatic
  adapter decision rather than a portable methodology schema.
- Human approval was mandatory for every external draft; current Blueprint
  evidence shows classification and proposal work can be delegated while
  canonical application remains authority-bound.

Therefore the convergence supports a semantic capability and adapter interface,
not the Atelier application as Blueprint infrastructure.

## Resulting capability boundary

Blueprint now defines three durable records:

1. `review-contract.json`
2. `feedback/submissions/*.json`
3. `feedback/dispositions/*.json`

The validator rejects:

- floating candidate revisions;
- feedback relabeled across candidates;
- reader submissions that set acceptance, evidence, claim, decision, or product
  status;
- approval from a merely advisory reader;
- delegated application without an authority reference; and
- required reader-return claims with no return receipt.

The CLI and doctor surface the loop. Stage feedback gates recognize the
structured records alongside legacy Markdown triage.

This does not duplicate wave 96. `reader-contract.json` and encounter-audit own
the outbound reader path (rendered surface, copy sources, encounter). The new
`review-contract.json` owns the inbound steering path (candidate-pinned
submission, authority, disposition, return). Adaptive Commerce Content proved
the distinction: its share site can be a valid presentation while its review
loop remains pending.

## Replay result

The replay fixtures produce:

- Atelier: `PENDING` — self-service adapter implemented, but the replay remains
  `ready` rather than falsely claiming issuance; no observed closed reader loop
  survives in the preserved initiative.
- Film Room: `PASS` — one exact-candidate feedback item closed and returned,
  but capture was operator-mediated through Codex.
- Adaptive Commerce Content: `PENDING` — exact review artifact and asks exist,
  but no direct adapter or team response exists yet.

This is sufficient to promote the semantic contract because the pattern appears
across three distinct initiative shapes. It is not sufficient to canonize a
hosted adapter.

## Prospective falsification

The next observed review of Adaptive Commerce Content should falsify or support
the remaining adapter hypothesis:

> A reader can submit candidate-pinned feedback, understand their authority,
> and receive a visible disposition without the operator manually copying,
> classifying, or routing the contribution.

Until that happens, Blueprint may ship the contract and validator, but any
Cloudflare/D1 widget remains a reference-adapter candidate.
