# Candidate B — the layered viewer-output contract (full draft)

**Date:** 2026-07-20
**Status:** candidate contract for ratification against candidate A (`02`), using `03` as the comparison record. Incorporates Codex review round 2 (contract-sentence rescope, `outputs:` schema, evidence grading, build-scope honesty). Not an ADR.

## Scope — what this contract is and is not

This is the **viewer-output contract**: how an initiative's truth reaches its readers. It is NOT the whole methodology. Research, decisions, validation evidence, prototypes, specs, and implementation controls remain stage obligations that exist regardless of any viewer — they feed the account layer; they are not conditional on it.

## The contract sentence

> A Blueprint initiative maintains a canonical account of its state and rationale, declares evidenced viewer outcomes and access boundaries, emits only the views or packages needed to reach those outcomes, and records whether each output is current, safe, traceable, and demonstrably usable.

Four layers: truth (account) → need (viewer contracts) → delivery (outputs) → assurance (receipts).

## Layer 1 — Initiative account (canonical truth)

Purpose/boundaries · capabilities and actual state · decisions and invalidated paths · claims with evidence, confidence, freshness · deltas, risks, open questions · next actions, commands, operating invariants.

**No new files demanded.** The account IS the existing substrate: `decisions/`, `research/`, derived state, the demand log, `METHODOLOGY-AMENDMENTS.md`. The contract names the layer so outputs can cite into it and receipts can check freshness against it. New build (see Build scope): a stable machine projection of it.

## Layer 2 — Viewer contracts (need)

```yaml
viewers:
  - id: club-director
    kind: human                    # human | agent
    evidence:
      status: observed             # intrinsic | observed | assumed
      source: local:demand-evidence   # de-named path indirection via roots.local.yml
    outcomes:
      - id: verify-event-value
        success:
          statement: understands and accepts what was delivered
          proof:
            method: observed-human        # the evidence grade this outcome requires (Layer 4)
            signal: delivery accepted without a clarification round-trip
```

- **Outcomes must be testable, not prose assertions.** `success` carries both the statement and the proof contract: which evidence grade validates it and what observable signal counts. An outcome with no `proof` block is a schema warning — it can exist while being drafted, but it can never produce a "reader served" receipt.
- **Proof carries a target grade and optionally an interim grade** (resolved 2026-07-20; was deferred to the ADR): `proof: { target: {method, signal}, interim: {method, signal} }`. A human viewer's outcome MUST target `observed-human` — cold-agent or simulated proof can only ever be the interim receipt, never establish "reader served" (validator rule R5). A bare `{method, signal}` proof is read as the target.
- **Outcomes are open-vocabulary success statements**, not an enum. A viewer holds multiple outcomes; duplicating a viewer per job is a schema error.
- **Intrinsic defaults** (the only ones stamped): `maintainer` with outcome *recover context and resume* (they arise from using Blueprint at all), and `next-agent` with outcome *bootstrap with canonical context* when the initiative is agent-operated. A recurring `operate` outcome activates only when the initiative actually has an operation. Research-only and one-shot initiatives stamp with maintainer alone.
- **Evidence status is load-bearing:** `observed` requires a source citation; `assumed` is legal but changes gating (Layer 4).

## Layer 3 — Outputs (delivery)

```yaml
outputs:
  - id: event-delivery-report
    type: issued-package           # from the open library below
    serves: [club-director.verify-event-value]
    renderer: local-html
    clearance: recipient-safe      # internal | recipient-safe | public
    projection:
      mode: allowlist              # allowlist (counterparty) | cite (internal lens)
      sources: [event-substrate]
    assurance:
      freshness: per-event
      leakage_lint: required
      human_validation: pending
```

- **Outputs carry lifecycle status** (added 2026-07-20, Codex round 4): `status: planned | draft | ready | issued | retired`. Only `ready`/`issued` outputs count as *serving* an outcome; an outcome served only by planned/draft outputs reports as PENDING, never green. This closes the declared-therefore-served false-green — film-room's recovery brief and se-docs' Slack surface are honestly `planned` today, and the validator says so. Declared `artifact`/`config_source` paths must resolve on disk once status requires them.
- **Mechanical assurances use typed assertions, not open vocabulary** (added 2026-07-20): open-vocabulary labels are right for human success statements and wrong for machine-checked gates. Orderings like "baseline before go-live" are declared as typed preconditions — `{artifact, assertion: exists, blocks: <output>}` — meaning the blocked output cannot advance to ready/issued while unmet (validator rule R6).
- **Output library (open set, never a conformance target):** recovery brief · agent boot packet · live proof · console/runbook · review context (the drawer primitive) · takeover corpus · issued recipient-safe package · plain-language orientation · change digest. Consumers may author types not in the library; the library exists for reuse, not enforcement.
- **Many-to-many:** one output may serve several outcomes; one outcome may need several outputs.
- **Projection modes are the security model.** `cite` composes from the account and may reference anything internal (lenses). `allowlist` is the counterparty mode, and naming an allowed *source* is not enough — a source can itself hold mixed-clearance content (the GSI BRD did). The full counterparty contract, all mechanically checked:
  - allowed files/sections/fields (selector-level, not file-level, where the source is mixed)
  - explicit forbidden patterns/classifications (the leakage lint's denylist)
  - `as_of` source version/hash stamped into the issued package
  - leakage-lint policy: `required`, hard-fail before write (never write-then-check)
  - human issuance attestation (clearance is a *proven state* recorded by a person, not declared metadata)
  - destination/access policy (frozen bundle vs gated preview vs public — a draft preview URL is never the issued artifact)

  `clearance` is declared per output and checked against all of the above — the pilot-club hazard class (internal prep reachable from a rendered surface) fails here, by construction.
- **Front door:** optional; just another output (`type: orientation` or an index). Hand-authored per initiative until two consumers independently want a generated one.

## Layer 4 — Assurance receipts (proof it works)

Each output accumulates receipts; each receipt carries an **evidence grade**:

| Grade | Receipt examples | May claim |
|---|---|---|
| mechanical | build passes, links resolve, sources trace, freshness within contract, clearance/leakage lint green | "output is current, safe, traceable" |
| cold-agent | a context-free agent completes the outcome using only the output | "agent-usable" |
| simulated-walk | persona-walk agent reaches the outcome | "contract-legible" — **never** "reader served" |
| observed-human | the named human reached the declared success | "reader served" |

- Grades never silently upgrade: a simulation reporting as human validation is the false-green this session's provenance caveat exists to prevent — here it becomes a schema violation, not a discipline.
- **Assumed-viewer rule (three tiers):** assumed with no output → gates nothing. Assumed with a rendered output → mechanical receipts required (quality, safety, placeholder marking), reader-success stays unvalidated and visibly so. Observed → mechanical + success receipts both gate.
- **Gate architecture is an orchestration, not one reviewer:** manifest/schema validity → source traceability → freshness → clearance/leakage → renderer conformance (build, a11y, links) → then fitness receipts by grade. The existing mechanical reviewers slot in; nothing collapses into a monolith.

## What carries over from candidate A unchanged

- Initiative Portal retires; Review Portal demotes to the `review-context` output type (drawer only; candidate status honestly labeled — no external reader has validated it).
- **Migration is dual-validation, not replacement** (the two statements "shim keeps validating" and "reviewers replaced" conflict for unmigrated consumers — resolved as):
  - legacy `portal_type` present, no viewer-output schema → the *existing* portal reviewers still run, plus a deprecation warn;
  - new schema present → the Layer-4 orchestration runs, legacy reviewers skipped;
  - both declared → hard error (or an explicit `migration:` mode while converting);
  - legacy validators are removed only when every supported legacy consumer has migrated or been permanently grandfathered.

## Build scope (honest, per Codex round 2)

New engineering, not renames: stable canonical state projection (Layer 1 machine rendering) · versioned agent boot packet · standing recovery-brief derivation · viewer/output schema + validation · evidence-grade receipt model · gate orchestration · generic sanitization policy (generalizing GSI's lint) · migration/compat logic. Precedents exist for each; productizing them is the wave's real cost and belongs in the ADR's build order, sequenced smallest-first.

## First adoption — specimen falsification before any template edit

Film-room alone would overfit solo/operator — the inverse of the original error. Before the ADR: author four specimen declarations and manually exercise the receipts, **with one deliberate failure seeded per specimen** to verify the contract blocks the right things (not just describes them):

1. **film-room** — solo operator + counterparty (allowlist projection, clearance, issued-package); seeded failure: clearance leak.
2. **Blueprint self-app** — orientation/evaluation/contribution; seeded failure: simulated receipt mislabeled as observed.
3. **se-docs-frontdoor** — configure-first; the product surface is a Slack channel (externally hosted, not a generated file); seeded failure: stale state (missing pre-go-live baseline).
4. **bc-subscriptions** — read-only mapping of its existing canonical/lens/GSI/handoff architecture with zero changes; seeded failure: an outcome with no serving output (the CFO's real historical failure). If it doesn't describe cleanly, the schema is wrong, not bc-subs.

Specimens live in `specimens/`; the design walk is `05-specimen-walk.md` and the **executed** pass is `06-validator-run.md`: an experimental validator (`validator/validate.mjs`, outside `template/`) implementing all eight rule families, run against the four specimens (pass) and six real negative fixtures (`fixtures/`, fail on the named rules), with account/artifact paths resolved against the actual consumer repos. Template changes land only after ratification.

## Ratification items (operator)

1. A (`02`) vs B (this doc), with `03` as the comparison — or order another round.
2. Terminology: account / viewer contracts / outputs / receipts.
3. The ceremony floor — **measured from specimens, correcting the earlier ~8-line estimate (wrong by ~9x)**: full manifests run 70–91 functional lines (film-room 73, se-docs 70, self-app 76, bc-subs 91); an intrinsic-only manifest (maintainer + boot, no external viewers) is ~15–20. See `05-specimen-walk.md` for whether that weight is justified.
4. Confirm the two-archetype first wave before any `template/` edit.
