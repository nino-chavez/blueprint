# Structure comparison — three candidate replacements, six consumer tests

**Date:** 2026-07-20
**Status:** brainstorm record. Inputs: `00` (evidence), `01` (framing), `02` (candidate A, strawman), Codex external review 2026-07-20 (candidate B's layer cut; concessions logged below). No ADR lands until the operator ratifies a winner.

**Codex-review disposition (per the external-review verification discipline):** conceded — nine-class taxonomy mixes truth/jobs/outputs/distribution; counterparty output is *allowlisted projection from canonical truth* (the GSI mechanism), not "never derived"; `operator/run` is not intrinsic; assumed readers with rendered surfaces still need safety gates; job vocabulary stays open (outcome strings, not enums); front-door generator deferred to the second-instance rule. Flagged — "SE Docs Front Door" absent from the registry; **CORRECTED 2026-07-20 (later same day)**: it exists at `wip/se-docs-frontdoor/` (stamped 2026-07-09, Stage 1 closed, unregistered, no git remote — which is why the registry-driven sweep missed it). The flag was wrong; the consumer joins the specimen set in `05-specimen-walk.md`, and its absence from `consumers.yml` joins the registry-reconciliation side-findings. Corrected — candidate A's §4 already kept mechanical lints separate from the fitness gate; "one giant reviewer" was a strawman of it.

---

## The candidates

**A — Reader manifest + nine artifact classes** (`02-proposed-contract-draft.md`). One flat declaration: readers → classes → jobs-served gate.

**B — Four-layer initiative account** (Codex, generalizing bc-subs' ratified architecture):
1. *Initiative account* — durable truth: purpose/boundaries, capabilities + actual state, decisions + invalidated paths, claims with evidence/confidence/freshness, deltas/risks/open questions, next actions + operating invariants.
2. *Viewer-job contracts* — who, why, the outcome they must reach; `clearance` and `freshness` per job; evidence status (intrinsic / observed / assumed) per viewer; a viewer holds multiple jobs.
3. *Viewer outputs* — renderings serving jobs, many-to-many: recovery brief, agent boot packet, live proof, console/runbook, review context, takeover corpus, issued recipient-safe report, plain-language orientation, change digest.
4. *Assurance receipts* — evidence an output works: sources resolve, state fresh, claims traceable, clearance passes, cold agent resumes, named human reaches decision, counterparty export passes positive-selection + leakage checks.

**C — Minimal** — canonical state + declared outcomes + consumer-authored renderers. No standard output vocabulary at all.

## Test matrix

| Consumer (shape) | A | B | C |
|---|---|---|---|
| **film-room** (operator console + one counterparty) | Works, with patches: run-default wrong for its Tier-0 phase; counterparty phrasing contradicted GSI mechanism | Clean: account = substrate + decisions; viewers = operator{run,recover}, agent{boot}, director{verify-event-value, clearance: recipient-safe}; outputs = console/runbook, boot packet, issued report; receipts = leakage lint, cold-resume | Works but re-derives everything film-room already hand-built; no shared gate catches the pilot-club leak class |
| **bc-subscriptions** (multi-audience, GSI, takeover) | Handles it, but lenses don't fit the flat class list (open question in A) | **Maps 1:1 onto what it already built**: account = canonical layer; contracts = five named readers + the GSI estimator; outputs = lenses, handoff corpus, GSI bundle; receipts = attestations, persona walks, sanitize lint. Convergent, not imposed | Describes it, constrains nothing — exactly the bottom-up accretion SSP had to untangle |
| **rally-hq** (B-portal, synthetic readers, SSP lenses) | Class-vs-lens membership problem (its own filed amendment) unresolved in flat classes | Clean: lens membership is an output-to-job mapping, orthogonal to nav de-weighting — dissolves the amendment's tension; assumed `broader` viewers get safety gates, not inertness | No answer to the amendment; every consumer re-invents banners/provenance |
| **Blueprint self-app** (product homepage + evaluators + contributors) | Bespoke ADR-02 collapses into a manifest — works | Clean: viewers = casual visitor{orient}, team lead{evaluate}, contributor{engage}; validation-script log IS the viewer-evidence ledger; walk gate IS a receipt. The standing-RED walk becomes a first-class failing receipt, not a buried note | Works — but it's the status quo that produced the RED walk with no standing gate |
| **tna** (product absorbs portal) | Needs the "no front door" footnote honored | Clean without special pleading: the site is the output; job = evaluate-and-buy; no front door because no job needs one | Identical to B here (C's best case) |
| **atelier-dashboard** (one-shot design review, feedback never fired) | `review` class is "candidate," so this consumer sits in limbo | Clean, and *names the historical failure*: outputs shipped, but the reach-decision receipt never existed — the model surfaces "unreviewed" as a missing receipt instead of a silent green | Nothing would have flagged the un-fired loop |

## Findings

1. **B handles all six without special pleading.** A needs patches on four; C handles individual consumers but abandons the fleet — it's the pre-pattern world (four drifting portals, 2026-05-25) formalized as policy.
2. **B's decisive property is convergence, not elegance:** the most mature consumer (bc-subs) built B's four layers independently under real-reader pressure, and rally-hq's filed amendment (class ≠ lens membership) dissolves in B's output-to-job mapping where A leaves it open.
3. **B's real risk is ceremony weight** — four layers reads heavy for a solo Tier-0 initiative, and over-engineering is a standing red line. Mitigation is in the defaults, not the model: the intrinsic footprint is two viewers (future-self{recover}, agent{boot}), an account that IS the repo's existing substrate (decisions/, research/, state — no new files demanded), two outputs (recovery brief, boot packet — both derivable), receipts mechanical-only. Everything else activates on evidence. A solo initiative's manifest is ~6 lines.
4. **C survives as B's floor, not a rival:** B with zero declared non-intrinsic viewers and consumer-authored renderers *is* C. The standard output vocabulary is a library (open set), never a closed conformance target — which also answers A's "premature enum" weak point.

## Recommendation

**Adopt B's four-layer model with C's restraint as the default posture.** Concretely, relative to candidate A:

- `readers:` becomes `viewers:` with nested multi-job contracts, outcome strings (open vocabulary), `clearance` + `freshness` per job, evidence status per viewer (`intrinsic | observed | assumed`).
- Intrinsic default: future-self{recover} + agent{boot} only. `run` activates with a product surface; everything else on evidence.
- Assumed viewers are gated, not inert: any rendered surface for an assumed viewer carries placeholder + clearance receipts (the pilot-club-class hazard is exactly an assumed audience with a rendered surface).
- The nine classes become the **output library** (open, non-conformance); truth items (decision lineage, demand log) move into the account layer where they belong.
- Gates: reader-job fitness receipts + per-output mechanical conformance (build, links, a11y, leakage) as separate layers — receipts don't replace renderer checks.
- Counterparty output = allowlisted projection from the account with hard-fail leakage lint (GSI mechanism, stated correctly this time).
- Front door: hand-authored per initiative until two consumers independently want a generated index (second-instance rule applied to our own tooling).
- Patterns A/B retire/demote as in candidate A §5 — that section survives unchanged.

## What ratification needs from the operator

1. Accept/reject the B-with-C-restraint recommendation (or order another round with a different candidate).
2. Name check: "initiative account / viewer contracts / outputs / receipts" — terminology will fossilize; naming is a decision, not a detail.
3. Confirm the intrinsic default (recover + boot) and the ~6-line solo manifest as the acceptable ceremony floor.
4. Then: ADR in `decisions/`, wave entry, `blueprint fleet` freeze check, and the migration sequence from candidate A §6 (which carries over with the schema rename).
