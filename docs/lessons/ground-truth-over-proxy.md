---
canonical: true
---

# Ground-Truth-Over-Proxy — Lessons From a Gate-Ladder Build Wave

**Status**: Captured 2026-06-16 from the subs-initiative G4 build wave (13 features driven from AI-authored designs to a passing behavioral scenario, one at a time). **Single-initiative** — candidate for cross-consumer promotion when a second initiative reproduces ≥2 of these lessons. The mechanical backbone for Lesson 1 already exists (`state-derive`); Lessons 2–7 are currently discipline, and each is a candidate for the methodology's advice→lint promotion path.

**Last updated**: 2026-06-24 (Lesson 7 added — load-testing surface from subs-initiative June 2026 perf work)

**Source evidence** (re-verified against commits/lines before capture):
- `subs-initiative` US-23.4 (commit `824dc003`) — the timestamp-format window bug + retry-sweep state omission. Fix lines: `apps/api/src/services/alert-threshold-evaluator.ts:38,47,57` (`datetime(col) >= datetime(?)`), `apps/api/src/db.ts:2884` (`status IN ('pending','failed')`).
- `subs-initiative` US-15.3 (commit `acbf7eac`) — the mocked-contract false-green. The design's consignment request field `shipping_address` was wrong; the live API uses `address` (`apps/api/src/services/tax-recalc-resolver.ts:12,113`, `apps/api/src/services/shipping-quote.ts:129`). Caught by an out-of-band sandbox probe before building.
- `subs-initiative` US-15.4 (commit `46d2d556`) — a table rebuild that sourced columns from the baseline migration instead of the current schema, silently dropping chargeback columns; caught by running every consumer scenario.
- Hive `#1658` — a SQLite `CHECK` on a table with incoming FKs is unchangeable in D1 (rebuild needs `PRAGMA foreign_keys=OFF`, which D1 blocks). Hive `#1083` — the resulting rule: no `CHECK` on application enums; validate in TS.
- `apps/api/test/scenarios/_helpers/fixtures.ts:28` — the shared seed helper's `INSERT OR IGNORE` under a `UNIQUE(store_hash, bc_customer_id)` constraint (the silent-collapse fixture seam).
- Deferred-surface tracking: proposals `#1661`–`#1666` (`[Spec-Reconciliation]`) — the gap between "demonstrable G4 path shipped" and "full AC" tracked as explicit debt, never buried.
- **Lesson 7 evidence** — `subs-initiative` load-test wave (commit `cfe3ae71`, 2026-06-24): three bugs invisible to all prior tests, found only by running real traffic: (a) thundering herd — BC Payments 429 retry timestamps landing at the same second (`apps/api/src/cron/charge-retry-sweep.ts`, fixed by applying `applyJitter` to the reschedule timestamp); (b) unique index blocking second portal customer per store (`apps/api/migrations/schema/0039_customers_portal_bc_id_index.sql`, fixed by converting to a partial index `WHERE bc_customer_id > 0`); (c) rate-limiter binding throwing in local dev (`apps/api/src/routes/portal/auth/request-link.ts:41–47`, fixed by wrapping in try/catch). All three passed unit tests, all three passed behavioral scenarios, none appeared in static analysis.

**Related patterns**:
- [docs/patterns/traceability-state-join-pattern.md](../patterns/traceability-state-join-pattern.md) — the state-join this lessons set generalizes from (derived state, not asserted state)
- [docs/patterns/invariants-registry-pattern.md](../patterns/invariants-registry-pattern.md) — where Lessons 4–5 become mechanical invariants
- [docs/patterns/inventory-as-evidence-pattern.md](../patterns/inventory-as-evidence-pattern.md) — evidence-over-assertion, the same spine at the inventory layer
- [docs/patterns/api-load-testing-pattern.md](../patterns/api-load-testing-pattern.md) — the six-tier framework that operationalizes Lesson 7
- [docs/case-studies/case-study-subs-skipped-stages-2-4.md](../case-studies/case-study-subs-skipped-stages-2-4.md) — the same initiative's earlier negative precedent (what skipping fact-check costs)

---

## Why this lessons set exists

A build wave is the methodology under load: many features, generated designs, a single gate deciding "done." The wave was clean — every feature reached a passing behavioral test — but the designs were wrong in patterned ways the whole time, and the bugs that surfaced clustered in one place: wherever a **representation of the system** stood in for the **system** and the two had drifted apart.

These six lessons are that cluster, extracted and abstracted off the stack. They are not stack-specific tips; the subs-initiative instances are grounding, not subject.

## The spine

One law, six faces:

> **A representation of the system is not the system, and it drifts by default. The work is to keep collapsing the distance to the real thing.**

"Done" → a passing test, not a tag. The contract → the live API, not the design's claim. The schema → the current migrations, not the baseline. "No new errors" → a differential count, not an absolute one. The plan → checked against the code, not trusted. Every win in the wave was a moment of touching ground; every bug was a moment of having trusted a proxy.

---

## The six lessons

### 1. "Done" is demonstrated, not claimed — and every proxy for it drifts

**Principle.** Derive completion state from the one signal that cannot be faked: a behavioral test passing against the real substrate. Every other "done" — a test tag, a static/presence check, a status field, an agent's report — is a claim, and a claim drifts the instant the work moves and the claim does not.

**Grounding.** The five-gate ladder (G1 spec → G2 prototype → G3 presence → G4 behavior → G5 live) made G4 the only "done." The anti-circling doctrine is explicit: a tag is a claim not a pass; a presence check (`COMPLIANT`) means *present*, not *built*; a "dark/untagged" marker means *no tagged test*, not *unbuilt*. Re-proven mid-wave when a fully-shipped AC read "dark."

**Generalization.** Any system that tracks its own state accumulates proxy state — dashboards, coverage tags, checklists. Proxies are convenient and they lie under load. Never estimate completion from a proxy; derive it from the artifact that can't.

### 2. A gate is only as honest as the dependency it refuses to mock

**Principle.** A test that stubs its hardest, most-uncertain dependency verifies everything *except* the part most likely to be wrong. The mock is where false-greens live.

**Grounding.** G4 stubs the external commerce-platform call by design (mock-now; live integration is G5). A renewal-tax scenario passed green over a wrong request field — the design said `shipping_address`; the live API uses `address`. The green said nothing about the part that actually mattered. It was caught only by an out-of-band probe of the real sandbox *before* building. Same shape one rung down: a unit test that builds its own `CHECK`-less inline table passes while the real schema rejects the write — it grades a model you wrote, not the system.

**Generalization.** The most-mocked dependency is usually the least-understood one — that's *why* it got mocked. Verify that contract out-of-band (probe the real interface), and run behavioral tests against the real schema, not a hand-built stand-in.

### 3. Red-first against the real substrate is information, not failure

**Principle.** When you write the test before the fix, over the real system, red usually means "never built right" or "code and schema disagree" — not "flaky test." The reflex to make red green fast destroys the signal.

**Grounding.** Scenarios written ahead of their fix went red with real constraint failures, and each red was a true bug: a force-charge `CHECK` mismatch (#1658), the timestamp window-comparison, the retry-sweep state omission, the destructive-migration regression. None were flaky.

**Generalization.** Test-first against production-shaped infrastructure turns the suite into a discovery tool, not just a regression net. Read what red is telling you before you silence it.

### 4. The bugs that ship don't throw — test the seam

**Principle.** The dangerous failures return wrong-or-empty *silently*. They pass any test that doesn't specifically cross the boundary where two things meet.

**Grounding.** Three silent killers in one wave:
- **Format seam.** A column defaulting to `CURRENT_TIMESTAMP` (space-format `2026-06-16 12:00:00`) compared against an ISO bound (`…T…Z`) → the range query is *always false* because `' '` sorts before `'T'`; a windowed alert silently never fires. Fix: `datetime()`-normalize both sides.
- **State-machine seam.** A "find due work" query selecting only `status='pending'` strands every `failed`-with-retry row forever. Fix: include all non-terminal states.
- **Fixture seam.** A shared seed helper hardcoding a unique key under `INSERT OR IGNORE` silently collapses the second record — every multi-record scenario built on it is quietly wrong.

**Generalization.** Write the test that crosses the seam: two formats for one field, a state machine's non-initial states, a fixture under a uniqueness constraint. A seam is invisible until something compares across it — and that something is usually production.

### 5. Destructive and irreversible operations need ground-truth sourcing and blast-radius testing

**Principle.** Derive a destructive change from *live* state, never from origin. Some platform choices are one-way doors. The safety net is everything downstream, not the thing you edited.

**Grounding.** A table rebuild sourced its columns from the baseline migration (11 columns) instead of the current schema (13, post a chargeback migration), silently dropping `processor_dispute_id`/`evidence_due_by` — caught only by running every *consumer* scenario, not the one under edit. And a one-way door: a SQLite `CHECK` on a table with incoming FKs cannot be changed in D1 (the rebuild needs `PRAGMA foreign_keys=OFF`, which D1 blocks), so a "simple" validation choice became permanent (#1658). That scar is exactly why the initiative bans `CHECK`-on-enum and validates in TS (#1083).

**Generalization.** Compute a destructive change from the system as it is *now*, and verify it by everything that reads what you touched. Before a one-way platform choice, ask whether you can walk it back; if not, don't make it for convenience.

### 6. Generated plans drift in patterned ways; the local rules encode scars

**Principle.** An AI-generated design isn't randomly wrong — it's *systematically* ignorant of a codebase's evolved local conventions. The fix is a known-drift checklist, not case-by-case rediscovery; and a rule the plan keeps violating usually encodes a past injury.

**Grounding.** Every design in the wave carried the same stale claims: a wrong next-migration number, a `CHECK`-on-enum the project had ratified *against* (#1083), a `behavior-gates.ts` file that doesn't exist, the `seedCustomer` collision. The type-drift between a source definition and its built `dist` had the same flavor — verified safe only by a *differential* error count ("did this change *add* errors"), never an absolute one.

**Generalization.** Treat a generated plan as a draft from a competent stranger to the codebase. Keep a checklist of known-stale claim types and check them mechanically. When the generator keeps re-proposing a banned pattern, read the ban before overriding it — it is a scar, not a preference.

### 7. Smoke tests are ground; unit tests are proxy — run traffic before you ship

**Principle.** Unit tests and behavioral scenarios verify that the code does what the test author expected. They cannot verify what happens when real traffic hits real infrastructure in real combinations. A smoke run — actual HTTP requests against the real handler stack — is a different category of evidence, not a redundant one.

**Grounding.** Three bugs shipped through a complete test suite (unit tests green, behavioral scenarios green, static analysis clean) and surfaced only when a 30-second load test ran real traffic:

1. **Thundering herd.** When BC Payments rate-limits the billing scheduler (429), all retried charges were rescheduled to `now + 2 hours` with no jitter. At the next cron tick, they all fired simultaneously, hit the same rate limit, and rescheduled again. The cycle was permanent. The test suite had no scenario that ran the retry path *and* measured the timestamp distribution of rescheduled charges. The load test did, implicitly — it exercised the retry path under realistic timing and the pattern became visible in the scheduler's D1 writes.

2. **Unique index blocking the second portal customer.** A full unique index on `(store_hash, bc_customer_id)` only allows one portal-only customer per store, because all portal customers share `bc_customer_id = 0` as a sentinel. The first magic-link request for a store succeeded; the second for a different email returned 500. The behavioral scenario had one customer per store. The load test rotated synthetic emails — the second one hit the constraint.

3. **Rate-limiter binding throwing in local dev.** The rate-limiter binding exists as an object in local dev (truthy) but has no Miniflare simulation — calling `.limit()` throws immediately. The handler called `.limit()` without a try/catch. Unit tests mocked the binding. Behavioral scenarios ran against the real local dev stack but with a single-VU fixture that never triggered the rate-limited path twice in sequence. The load test hit it on the first call.

None were subtle. All were invisible to the tests that existed. The shared structure: each test exercised a sub-path; the bug lived at the intersection of state + load + sequence that no individual test modeled.

**Generalization.** Add a smoke-mode load run to CI at the same tier as behavioral tests, not later. Thirty seconds of real traffic against the dev stack is enough to surface the class of bugs that live at the intersection of state, sequence, and realistic inputs — the class that unit and scenario tests structurally cannot reach. The smoke run is ground truth; everything before it is proxy.

---

## How to apply — the pre-build checklist

Distilled to what a builder does *before* and *as* they build:

1. **Define "done" as a test, then write that test first.** If "done" is a tag or a checkbox, you don't have a definition yet (L1, L3).
2. **List the dependencies the test will mock. Verify each mocked contract out-of-band before building.** The mock is the blind spot (L2).
3. **For every boundary the feature crosses — formats, states, identities — write the test that crosses it.** Not the happy path (L4).
4. **For any destructive change, source from live state and run every consumer of what you touch.** Check for one-way doors first (L5).
5. **Run the generated design against the known-drift checklist before trusting a line of it.** Verify "no regression" differentially, not absolutely (L6).
6. **Run a 30-second smoke load test against the dev stack before calling the feature done.** If the handler has never seen real traffic, it hasn't been tested (L7).

## Promotion criteria

Promote a lesson to a `docs/patterns/` pattern (or to a reviewer gate / `invariants-registry` entry) when a **second initiative independently reproduces it**. L1 is already mechanized (`state-derive`); L4 and L5 are the strongest mechanization candidates (a seam-coverage linter; a destructive-migration "source-from-current + run-consumers" gate). L7 is operationalized in [docs/patterns/api-load-testing-pattern.md](../patterns/api-load-testing-pattern.md) — a second initiative reproducing at least one of its three bug classes would promote it from single-initiative lesson to cross-consumer gate. Until then these stay lessons: load-bearing on one initiative's commits, not yet cross-consumer law.
