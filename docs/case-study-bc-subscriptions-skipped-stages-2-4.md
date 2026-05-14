# Case Study — bc-subscriptions: What Happens When Stages 2 and 4 Get Skipped

> Sibling to `case-study-pp-cx.md` (positive precedent). This is the negative
> precedent — a project that did NOT follow the big-blueprint pipeline and
> accumulated systemic debt that took multi-day recovery work to surface and fix.

## Context

bc-subscriptions is a BigCommerce-native subscription management platform built
incrementally over weeks across multiple Claude Code sessions. It accumulated
substantial structural substrate — BRD / PRD / ARCHITECTURE / decision records
(ADRs) / per-task handoff dossiers / state-derive capability registry — but
**without** following the big-blueprint stages explicitly. In particular, the
project skipped:

- **Stage 2 — Design Principles** ("codify what the prototype CAN'T do before building")
- **Stage 4 — Fact-Check** ("validate every claim against screenshots and source code")

The cost of these two omissions became visible on 2026-05-14 during a single
multi-hour conversation where a series of user-prompted questions uncovered:

1. **Zero production charge path.** `apps/api/src/adapters/bc-payments.ts:70`
   throws on the production branch; no other processor adapter exists. Every
   `_state.json` COMPLIANT capability for the charge pipeline was structurally
   accurate but runtime-stubbed.
2. **`ensureFixturePaymentMethod` called unconditionally from 3 production
   routes.** Every subscription created in production attached a hardcoded
   Visa 4242 with `fixture_pm_<uuid>` reference. No real tokenization anywhere.
3. **Phase-2 consumers absent.** Magic-link emails, webhook delivery, and
   reconciliation cron — all "queued successfully and dropped on the floor"
   per a comment in `db.ts:1917`.
4. **Memory `bc-payments-mit-verified` accumulated 3 compounding framing
   errors** that took 3 rounds of user-prompted research to fully correct.

The recovery work (walking-skeleton v0.1 + v0.1.1 syntheses) produced ~15 PRs
across 12+ Sonnet-hours to address what would have been surfaced up-front by
Stage 2 + Stage 4 discipline.

## What was structurally present (the substrate that LOOKED complete)

- BRD.md — 60+ user stories with full AC tables
- PRD.md — surface area documentation
- ARCHITECTURE.md — stack + integration map
- 34 ADRs covering charge sequencing, schema migration, observability, etc.
- 27 per-task handoff dossiers at `docs/handoffs/`
- `state-derive` tooling with 315 capabilities (117 COMPLIANT, 176 MANUAL_REVIEW)
- Hive substrate with 67+ proposals and 30+ synthesis records
- 5 persona journey traces with explicit gap callouts
- BC marketplace + WCSubs competitive analysis

By any structural measure, the project looked far along. But none of this
substrate captured the truth that **the production charge path didn't work
end-to-end with real money.**

## What was missing (the Stage 2 + Stage 4 gap)

### Missing — Stage 2 Design Principles

The project had no equivalent of `template/design_principles.md`. No
explicit "What this CAN'T do today" doc. The fixture-mode flag
(`HACKATHON_FIXTURE`) proliferated from a single intentional demo-mode
escape hatch into 4+ production code paths over time. No artifact existed
to flag this drift.

Hard constraints that a Design Principles doc would have enforced (and
which the bc-subscriptions retrofit Decision now codifies, see
`feature/bc-subs-retrofit-contribution`):

- "No fixture-mode helpers imported by production routes"
- "No COMPLIANT capability without runtime verification"
- "No deferred-build clauses without paired implementation Spec"

### Missing — Stage 4 Fact-Check

The project had `state-derive` as a mechanical truth-derivation tool, but the
existing derivation checks (`file_exists`, `grep_present`, `schema_has_table`,
etc.) verify **structural** existence, not **runtime** behavior. A `throw` on
the production branch of `bc-payments.ts` returns ✓ for every existing check
because:
- The file exists
- The `charge()` method exists
- The MIT classification logic exists
- The `requiresPreExistingOrder: true` flag is set correctly

A fact-check discipline that ran the production code path (not just the
fixture-mode path) would have caught the throw immediately. The project's
fix was to add a new `feature_flag_inactive` derivation check that detects
"code paths gated behind fixture flags with a throw in the non-fixture
branch" — but this was retrofitted as part of v0.1, not present at
scaffold time.

## Pattern-level lessons (applicable beyond bc-subscriptions)

### 1. "COMPLIANT" ≠ "shipped"

Structural existence checks (does the file exist, does the function exist,
does the schema have the column) are necessary but not sufficient for
claiming a capability is shipped. A scaffold that throws on the production
branch will pass every structural check while delivering zero runtime
behavior. Runtime-behavior verification is its own discipline.

### 2. Fixture-mode flags need explicit containment

A `HACKATHON_FIXTURE` / `DEMO_MODE` / `MOCK_*` flag is harmless when
contained to test paths. It becomes existential debt when production
routes import it and accept it as a valid runtime mode. Without explicit
Design Principles that say "production routes MUST NOT import fixture
helpers," the flag spreads, because each new feature is built against
the easiest available scaffolding.

### 3. Platform-claim memories must distinguish rails and endpoints

bc-subscriptions's `bc-payments-mit-verified` memory said "BC Payments
MIT verified" — which was technically correct about the architecture
spike but misleadingly framed (1) the standard vs beta API distinction,
(2) BCP-as-PPCP-not-Braintree, and (3) that the production endpoint was
publicly documented. Each error required separate user-prompted research
to surface. **Memories that claim platform capabilities should name the
specific endpoint, rail, and beta-vs-GA status explicitly.**

### 4. Open questions in code comments get forgotten

`Hive #363` was referenced in a code comment as the source of unresolved
implementation questions for the BC Payments adapter. But "Hive #363" did
not exist on this project's substrate — it was a dangling reference. The
questions it pointed to (PAT mint endpoint, payment_method_id namespace)
were answered in publicly available BC docs the entire time, but never
got tracked anywhere visible to drive resolution. An open-questions
tracker (`research/open-questions/tracking.md`) with owner + status would
have surfaced this gap.

### 5. Persona-first methodology can go too wide before going deep

bc-subscriptions ran a 5-persona journey-tracing exercise (the A→B→C
methodology) that produced rich substrate but never vertical-sliced a
single real-money flow. The walking-skeleton discovery happened only
when the user asked "can we actually take a real payment?" The lesson
is not that persona work was wrong, but that **the walking skeleton
should always come first**, and persona breadth should expand from a
verified vertical slice, not in lieu of one.

## Pre-completion checklist (apply to any big-blueprint initiative)

Before declaring an initiative complete (or even "v1 ready for review"),
verify these artifacts exist and are current:

- [ ] `STATE.md` — running session state with current Blockers + Last Session date within the last week of work
- [ ] `research/current-state/` — populated with audit findings (not just READMEs)
- [ ] `design_principles.md` — "What this CAN'T do today" section is non-empty
- [ ] `research/open-questions/tracking.md` — questions have owners + statuses, not just text
- [ ] `validation/<recent-date>-validate.md` — `/blueprint-validate` was run on the current state
- [ ] At least one end-to-end vertical slice runs against real backing systems (not fixtures) for the highest-value flow

If any are missing, the initiative is structurally complete but not
runtime-complete. That's the gap bc-subscriptions illustrates.

## Cross-references

- Sibling positive precedent: `docs/case-study-pp-cx.md` (pricing-packaging)
- bc-subscriptions walking-skeleton recovery work: synthesis `7f0691f9` + `53bcde79`
- bc-subscriptions retrofit Decision: `6db9cc0f` + synthesis `ad0346f5`
- This contribution: feature/bc-subs-retrofit-contribution branch on big-blueprint

---

> **What this case study is for**
>
> Adopters of big-blueprint who skip Stage 2 or Stage 4 because the artifacts
> feel like ceremony should read this case study first. The "ceremony" is what
> contains fixture-mode debt and prevents COMPLIANT-but-stubbed conflation.
> Without those two stages, the project accumulates a recovery cost that's
> orders of magnitude higher than the cost of authoring them up front.
