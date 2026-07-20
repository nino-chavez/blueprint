---
canonical: true
---

# Decision 05 — Retire the 6-verb portal IA; adopt the actor-output contract (candidate B)

**Date**: 2026-07-20
**Status**: Accepted — operator ratified all four calls with the recommended dispositions (2026-07-20)
**Wave**: 89

## Context

The Initiative Portal's 6-verb IA (discover/try/build/operate/inspect/roadmap) plus three-pill audience switcher was an n=1 extraction from one consumer's content piles — and that consumer subsequently deleted the switcher and replaced the IA with a canonical-layer + lens architecture (2026-06-25), while the fleet gate kept enforcing the abandoned contract at component level. A cross-fleet evidence inventory (film-room's stale/hazardous portal was the triggering symptom) produced seven verdicts, the strongest being: the verbs organized the builder's content, not any reader's job; the switcher was dead weight for solo consumers and an active clearance hazard for counterparty-facing ones; and route-presence conformance is satisfiable while failing every actual reader.

Full evidence chain: `research/portal-ia-rederivation/00`–`06` — evidence inventory, artifact-class seed, candidate A (retired strawman), three-candidate comparison across six consumers, the candidate-B contract, a design walk, and an **executed falsification pass**: four specimen manifests authored from real consumer facts, validated by an experimental validator (`research/portal-ia-rederivation/validator/validate.mjs`) against five real negative fixtures, each failing on its intended rule. Three rounds of external adversarial review (OpenAI Codex) were incorporated with verify-before-concede discipline; Codex independently reran the validator suite and confirmed the results.

## Decision

Replace the portal-type conformance contract with the **actor-output contract** (candidate B, `research/portal-ia-rederivation/04-candidate-b-contract.md`):

> A Blueprint initiative maintains a canonical account of its state and rationale, declares evidenced actor outcomes and access boundaries, emits only the views or packages needed to reach those outcomes, and records whether each output is current, safe, traceable, and demonstrably usable.

Four layers:

1. **Initiative account** — canonical truth; the existing substrate (`decisions/`, `research/`, derived state, demand log) named as a layer, plus a stable machine projection.
2. **Actors and outcome contracts** — `actors:` (humans and agents who read, operate, decide, configure, or receive), each with evidence status (`intrinsic | observed | assumed`) and testable outcomes carrying `proof: {target, interim}` — human outcomes MUST target `observed-human`; agent/simulated proof is only ever interim.
3. **Outputs** — open library, many-to-many `serves:`, lifecycle `status: planned | draft | ready | issued | retired` (only ready/issued serve; planned-only service is PENDING, never green), projection modes as the security model (`clearance: recipient-safe` ⇒ allowlist projection + denylist + hard-fail leakage lint + human issuance + destination policy), and typed preconditions for mechanical orderings.
4. **Assurance receipts** — evidence grades (mechanical / cold-agent / simulated-walk / observed-human) that never silently upgrade; three-tier assumed-actor gating.

The Initiative Portal retires; the Review Portal demotes to the `review-context` output type. Migration is **dual-validation**: legacy `portal_type` routes to the existing portal reviewers plus a deprecation warn; the new schema routes to the receipt orchestration; declaring both is a hard error; legacy validators are removed only when every supported consumer has migrated or been permanently grandfathered.

## Ratification items (operator) — ratified 2026-07-20 as recommended

| # | Call | Recommended (Claude + Codex concur) | Operator |
|---|---|---|---|
| 1 | Candidate A vs B | **B** — won all six consumer comparisons; survived executed falsification | ☑ ratified |
| 2 | Terminology | **`actors:`** (not `viewers:`) — the schema covers people/agents who operate, decide, configure, receive, not merely view; keep account / outputs / assurance receipts | ☑ ratified |
| 3 | Ceremony floor | **Accept measured floor**: ~15–20 functional lines intrinsic-only; 70–91 fully declared with external actors — justified because the manifest references canonical facts rather than duplicating them | ☑ ratified |
| 4 | First-wave scope | **Four consumers**: film-room + blueprint-self active adopters; se-docs-frontdoor as the configuration-first validation case; bc-subscriptions read-only compatibility standard | ☑ ratified |

## Freeze check (recorded 2026-07-20)

`blueprint fleet`: 14 consumers — 4 behind, 9 unpinned, 0 mid-migration, 0 unresolvable. No external consumer is mid-migration, so the methodology freeze rule is not tripped by this wave. Film-room is current at 0.6.0.

## Build order (smallest-first; template edits land only after acceptance)

1. **Schema + validator** — productize the experimental validator's eight rule families into `template/tools/lib/` (dependency-free, self-tested, per house rules); replace the string-sniffed grade heuristic with structured receipts (grade, observer, timestamp, source version, result, evidence location, expiry).
2. **Gate semantics** — three-state output: `PASS` (valid + required outcomes served) / `PENDING` (structurally valid; planned outputs or unmet receipts) / `BLOCKED` (invalid/unsafe/stale). A stage transition never treats PENDING as green. Gate mode requires resolvable roots — skipped path validation cannot produce green.
3. **Routing shim** — dual-validation per above; the legacy route actually invokes the existing portal reviewers, not just a warn.
4. **Recipient safety made evidentiary** — selector-level allowlists, required `as_of` + destination policy, executed leakage lint (generalizing the GSI `sanitize.py` mechanism), recorded issuance attestation. "Configured to be checked" ≠ "recipient-safe proven."
5. **Account projection + intrinsic outputs** — stable machine projection of the account layer; versioned agent boot packet; standing recovery-brief derivation.
6. **Stamper + docs** — stamp intrinsic-only manifests (~15–20 lines: maintainer + next-agent); retire the 6-verb boilerplate; update `docs/portal-and-tier-ladder.md`; deprecate the portal-type conformance reviewers per the routing shim.
7. **Portal derivation** *(added wave 90 — promoted from two hand-reshapes, blueprint-self + film-room, per the ≥2-consumer rule; film-room `METHODOLOGY-AMENDMENTS.md` 2026-07-20 is the evidence entry)* — outputs declare `views: [{path, label, presents?}]`; `portal-derive.mjs` validates them (presents resolves to an output id or account key), emits `derived/portal-views.json`, and `--check <dist>` executes the walk (front door + every view populated, no empty-state shell). The template shell is dual-mode: derived views render as the reader-job nav + front-door cards (audience switcher off); no views → legacy verb shell. Intrinsic stamps declare no views and stamp none.

Full acceptance criteria: `research/portal-ia-rederivation/06-validator-run.md` § Production acceptance criteria.

## Consequences

### Breaking (post-migration)
- `portal_type:` becomes a deprecated field; the portal-initiative/review conformance reviewers stop being the gate once a consumer declares the new schema.
- Consumers with an Initiative Portal lose the enforced 6-verb/switcher contract; what replaces it is their declared actor-output manifest.

### Non-breaking
- No consumer is forced to migrate; legacy routing keeps existing reviewers running with a warn indefinitely until per-consumer migration or grandfathering.
- The account layer demands no new files — it names existing substrate.
- The Review Portal shell survives as an output type; bespoke escape (decision 02 precedent) remains legal.

### Risks
- Ceremony rejection in practice: if first-wave authors experience the manifest as a hand-maintained summary layer rather than concentrated existing claims, the floor call (#3) gets revisited — the wave must make intrinsic sections stamped/derived, not hand-written.
- "Actor" naming is untested with external consumers; rename cost later is a wave-72-class mechanical rename (decision 03 precedent exists).

## History NOT modified

`docs/portal-and-tier-ladder.md`, the portal conformance reviewers, and prior decisions 02/03 remain true-at-time-of-writing; they are amended by the implementation wave, not rewritten by this ADR.
