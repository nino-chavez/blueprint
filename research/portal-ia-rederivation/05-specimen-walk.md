# Specimen walk — operational falsification of candidate B

**Date:** 2026-07-20
**Status:** walk record — **SUPERSEDED BY `06-validator-run.md` (later same day)**. Codex round 4 correctly rejected this document's claim to be an executed falsification: three of the four seeded failures below were comments demonstrating expected rules, not fixtures anything rejected, and "receipts exercised by hand" is a design walk. The executed pass — real validator, real negative fixtures, real path resolution — is `06`. This file stays as the design-walk record; its "real facts" claim is also corrected there (`filmroom.sqlite` was a transcription error for `filmroom.db`).

## Seeded-failure results — all four blocked, all at cheap layers

| Specimen | Seeded failure (class) | Blocked by | Layer cost |
|---|---|---|---|
| film-room | Counterparty view with `projection.mode: cite` over `research/` (clearance leak — would expose pilot-club negotiation prep) | Schema invariant: `clearance: recipient-safe` REQUIRES `projection.mode: allowlist` | mechanical, declaration-time |
| blueprint-self | `human_validation: passed` recorded from a persona-walk agent (simulated receipt mislabeled as observed) | Evidence grading: simulated-walk may claim "contract-legible" only; grade upgrade is a schema violation | mechanical, declaration-time |
| se-docs-frontdoor | Go-live with no pre-go-live ping baseline (stale state) | Freshness receipt on `measurement-plan` gates the `slack-frontdoor` launch: the proof signal becomes permanently unmeasurable if launch precedes baseline | mechanical, pre-launch |
| bc-subscriptions | `cfo-coo.build-hire-buy` outcome with no serving output — the TRUE historical state | Manifest validation: "unserved outcome" at declaration time | mechanical, declaration-time |

**The bc-subs result is the strongest single argument for candidate B:** the schema catches at declaration time, for free, what took a 39-agent audit to surface in June — the decision-maker's job had no artifact serving it. None of the four failures needed the expensive receipt grades (cold-agent, observed-human) to be caught; the contract blocks the right things at its cheapest layer.

## What authoring the specimens forced (schema findings)

1. **The output library must be open — proven, not asserted.** se-docs forced a type no draft anticipated: `configured-surface` with `renderer: external` and a `config_source` pointer. The load-bearing artifact is *config provenance* (deployed Claude Tag instructions match `prototype/DESIGN.md`), not a generated file. Candidate B absorbed it without schema surgery; a closed enum would have needed a version bump.
2. **A new mechanical invariant emerged:** `clearance: recipient-safe` ⇒ `projection.mode: allowlist`. Discovered by seeding film-room's failure, generalizes fleet-wide, costs one schema rule. This is the pilot-club/GSI hazard class reduced to a lint.
3. **"Viewer" strains where Codex predicted.** Modeling the operator as maintainer-with-a-`run`-outcome works (one viewer, multiple outcomes — no duplication), but "viewer" reads wrong for an actor *executing* the system. Naming candidates: `readers` (same problem), `parties`, `principals`, `audiences` (worst). Operator call; does not block the experiment.
4. **Outcomes sometimes want two proof grades** — bc-subs' vp-product/cpo outcomes honestly carry `simulated-walk` as their only available proof while the real bar is `observed-human`. The schema forces that weakness visible (good) but has no way to say "interim grade X, target grade Y." Candidate fix: `proof` accepts an ordered list; lowest satisfied grade is what the receipt reports. Defer to the ADR.
5. **bc-subs mapped cleanly, zero special pleading.** Its own vocabulary (canonical layer, lens, Class P/H/D, attestation, frozen bundle) lands 1:1 on account/outputs/projection/receipts. Class-H found its home only by admitting its reader is the maintainer — the de-weighting banner rule follows from that admission instead of being a separate convention.

## Ceremony, measured

| Specimen | Functional lines (non-comment) | Shape |
|---|---|---|
| se-docs-frontdoor | 70 | 4 viewers, 5 outputs |
| film-room | 73 | 3 viewers, 5 outputs |
| blueprint-self | 76 | 5 viewers, 5 outputs |
| bc-subscriptions | 91 | 7 viewers, 5 outputs |
| (intrinsic-only floor, derived) | ~15–20 | maintainer + boot, no external viewers |

The earlier "~8 lines" claim was wrong by ~9x and is corrected in `04`. Assessment: 70–91 lines is the *fully-declared* weight for initiatives with real external readers — and each line is a claim the initiative already makes implicitly today (in scattered ADRs, feedback logs, and READMEs) without any gate reading it. The manifest doesn't add the ceremony; it concentrates it where a validator can see it. The honest floor for a solo/research initiative is ~15–20 lines. Whether that trade is acceptable is ratification item 3.

## Verdict

Candidate B survives the falsification pass: four real consumers described without special pleading (including the externally-hosted-surface case), four seeded failures blocked at declaration-time/mechanical cost, one genuinely new invariant discovered, one schema pressure (interim proof grades) deferred to the ADR with a named fix. The architecture is ready for ratification; remaining open items are the four operator calls listed in `04` (candidate choice, terminology — including the "viewer" naming strain above — ceremony floor acceptance, first-wave scope).
