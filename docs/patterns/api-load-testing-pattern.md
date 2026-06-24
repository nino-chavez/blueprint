# API Load Testing Pattern

**Purpose:** A six-tier framework for establishing baseline performance, validating correctness under load, catching regressions before they ship, and proving resilience against dependency failures. Stack-agnostic methodology; tooling choices are left to the initiative.

**Last updated:** 2026-06-24

**Source:** `subs-initiative` — load testing scaffold built June 2026 (k6, Cloudflare Workers + D1, BC Payments API). Three real production bugs were found by running traffic that no prior test had caught: a thundering-herd reschedule collision, a unique-index blocking the second portal customer per store, and a rate-limiter binding throwing in local dev. None were visible to unit tests, scenario tests, or static analysis.

**Related:**
- `docs/lessons/ground-truth-over-proxy.md` — Lesson 7 (added 2026-06-24): smoke tests are ground, unit tests are proxy
- `docs/patterns/cloudflare-deployment-pattern.md` — CF Workers / D1 infra that this pattern tests

---

## When to Use This Pattern

Use it when:

- The initiative exposes an HTTP API with defined latency budgets
- Traffic has a meaningful shape (BFCM spikes, billing-day waves, bursty webhooks)
- Background work (queues, schedulers, crons) runs alongside the API
- A dependency has its own rate limits or SLA constraints (payment processors, external APIs)

Skip when:

- The surface is purely static (no dynamic compute, no DB writes)
- All traffic is human-interactive web UI with no API load concern

---

## The Six Tiers

Each tier answers a different question. They build on each other — don't skip to Tier 3 before Tier 0 is stable.

### Tier 0 — Smoke (every push)

**Question:** Did this commit break routing or auth?

- Duration: 30 seconds per scenario, low concurrency
- Target: local dev server with a seeded DB
- Gate: all custom error rate metrics = 0%; all scenarios reach 100% iteration completion
- Runs in CI on every push; failure blocks the branch

The 30-second smoke run is cheap enough to run constantly and catches the class of bugs that matter most before review: routing breaks, auth regressions, handler panics.

### Tier 1 — Regression (on merge)

**Question:** Did this change make anything measurably slower?

- Duration: 5 minutes, moderate concurrency on the highest-risk routes
- Target: same local dev server as Tier 0 (consistent environment — apples-to-apples matters more than absolute numbers)
- Gate: p95 latency must not regress >20% vs. a stored baseline
- Baseline stored in a JSON file in the repo; updated intentionally by the operator after measuring a clean state

The baseline file is the contract. If you want to change the numbers, change them explicitly — don't let them drift.

### Tier 2 — Integration (pre-release or 3× per week)

**Question:** Does the system perform correctly end-to-end, including real dependency round-trips?

- Duration: 5 minutes, ~50% of estimated production RPS per route
- Target: deployed staging environment against real dependencies (real database, real external APIs, real auth)
- Gate: p95 within the documented perf budgets; error rate matches Tier 0

This is the first tier that can catch latency problems caused by real dependency response times. A route that passes Tier 0 at 8ms can fail Tier 2 at 900ms if it makes a synchronous call to an external API under load.

### Tier 3 — Soak (pre-release, manual)

**Question:** Does the system stay stable over hours, or does it degrade?

- Duration: 2–4 hours, 30–50% of production RPS
- Target: staging environment
- Watch for: p99 latency trend (should be flat), DB query timing creep, connection pool exhaustion, error rate trend

What soak finds that shorter tests miss: memory growth in long-lived processes, DB query plan degradation as tables fill, cache TTL eviction behavior, connection pool exhaustion under sustained write load.

### Tier 4 — Spike (pre-release, manual)

**Question:** What happens when traffic goes from normal to 10× in 30 seconds?

Two scenarios that matter for most API-backed systems:

**Traffic spike:** 5 VU → 200 VU in 30s, hold 5 minutes. Tests auto-scale behavior and database read concurrency under sudden load. The BFCM scenario.

**Billing/batch wave:** Trigger the background scheduler while portal traffic is at its peak. Tests DB write contention when two high-write workloads overlap. The billing-day scenario.

The spike scenarios are where DB write contention surfaces — not from the peak load alone, but from simultaneous peaks on different workloads.

### Tier 5 — Chaos (pre-release, manual)

**Question:** When a dependency degrades, does the system degrade gracefully or does it take everything down?

Inject failures at the dependency boundary, not at the application boundary. A proxy (e.g., Toxiproxy) sitting in front of the external dependency is the right primitive — it intercepts real traffic and applies the fault, so your actual application code runs against it.

Three failure modes to model for any external dependency:

| Failure | Injection | What to assert |
|---------|-----------|----------------|
| Rate limiting | 429 on every request | Retry/backoff fires; no thundering herd on retry |
| Latency injection | +5s on every call | Timeout fires correctly; Worker stays alive |
| Full outage | Drop all connections | Reads still serve; writes queue or degrade gracefully |

**The thundering herd check** is the most important one: when all retries land at the same timestamp, the next batch job re-triggers the same rate limit, forever. Verify your retry uses jitter before chaos testing confirms it.

---

## Three Disciplines That Apply Across All Tiers

### 1. Custom error rates over built-in failure metrics

Load test frameworks typically provide a built-in "failed request" metric that counts any non-2xx response. This conflates intentional 4xx (auth probe returning 401, expired token returning 410, fixture gap returning 404) with real failures (5xx). The built-in metric fails CI cleanly every run, even when no real failure occurred.

Define custom error rate metrics per scenario. Gate CI on those. Let the built-in metric be informational only — and configure it to exclude expected 4xx so it doesn't produce noise.

The custom rate is the real signal. The built-in rate is the proxy.

### 2. Endpoint tests vs. session flows

Isolated endpoint tests (one VU hitting one route in a loop) establish per-route latency baselines and are cheap to run. But they miss the load pattern of a real user navigating sequentially: each step leaves D1 state, session context, or lock contention that the next step inherits.

Session flow tests model a full user journey with think-time between steps:
- Portal subscriber: login → view subscriptions → perform lifecycle action → view charges
- Admin merchant: app load → onboarding check → plan list → subscriber list → analytics

Run session flows alongside isolated tests, not instead of them. They catch interference between sequential steps that isolated tests miss.

### 3. Testing code with no HTTP surface

Background workers (queues, schedulers, crons) are often the highest-stakes code in the system — they move money, send notifications, expire tokens — but they have no public HTTP surface to load test.

Two approaches:
- **Dev-mode trigger endpoint:** Most local dev servers expose a test hook that manually fires the scheduled event (e.g., Cloudflare Workers' `cdn-cgi/handler/scheduled`). Measure trigger acceptance latency and assert no 5xx; measure scheduler completion indirectly via DB state queries.
- **Concurrent trigger testing:** Run multiple concurrent triggers intentionally. The scheduler should hold a lock and skip rather than double-process. Concurrent trigger tests validate the idempotency guard — the most likely point of failure during real cron overlap.

---

## Perf Budget Document

Each epic/feature area should have a `docs/perf-budgets/<area>.md` that records:

```
| Route | p50 | p95 | p99 | Source |
|---|---|---|---|---|
| POST /api/webhooks/bc | <200ms | ≤800ms | ≤1.5s | Operator-set (BC retry window) |
```

The budget document is the contract that Tier 1 regression gates enforce. It lives in the repo alongside the code, not in a spreadsheet. The p95 threshold is the gate; p99 is the alert level.

Budget numbers should reflect real constraints, not aspirations. A payment webhook that BC retries after 30 seconds needs a p95 well under that window — that's a constraint, not a preference.

---

## Fixture Design

A load test is only as honest as its fixtures. Four rules:

1. **Seeded state, not blank state.** A blank DB returns 404 on everything — the test measures routing latency, not handler latency. Seed the minimal rows needed to exercise the full handler path.

2. **Accept fixture gaps explicitly.** When a route returns 404 because a synthetic fixture doesn't exist (e.g., a subscription UUID that was never created), the check should accept 404 *and* record the latency. Auth + routing + DB lookup still ran; that's the measurement.

3. **Unique keys per VU for destructive operations.** Any test of a delete, erase, or cascade operation must use a unique identifier per VU call. Reusing the same key means the second call deletes nothing — the scenario grades a no-op, not the destructive path.

4. **Rate-limited paths need rotating inputs.** A route that rate-limits per email/IP at N req/hr needs the test to rotate through synthetic identifiers, not hammer one address. Otherwise the test measures the rate limiter, not the handler.

---

## Promotion Criteria

This is a single-initiative pattern. Promote to a methodology-level gate when a **second initiative** independently:
- Establishes per-route perf budgets and gates CI on them, OR
- Finds a production bug in load testing that no prior test caught

Until then: prescriptive guidance, not required gate.
