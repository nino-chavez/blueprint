---
canonical: true
---

# Browser-Seat Convergence Pattern

**Status**: Single-initiative — promote to cross-consumer pattern when a second initiative independently ships this two-layer model. Source: subs-initiative 2026-06-25 (ADR-0065 amendment).

**The core thesis**: one BRD-anchored spec produces BOTH the end-user behavioral test AND the captured demo asset. The proof doubles as the demo; no separate demo authoring.

## Problem

A passing backend scenario (handler called directly, real schema, real router) proves persistence, emission, and classification — but nothing about whether any UI renders the result or calls the correct endpoint. An untested UI can serve incorrect data, call the wrong route, or silently crash on edge states.

A separate "demo" that isn't a test drifts from the shipped product. A test that doesn't capture demo stills leaves demo assets as a manual task.

## The two-layer model

Neither layer alone is "the AC is done." They compose:

| Layer | What it proves | What it does NOT prove |
|---|---|---|
| **Backend behavioral** (direct handler call + minted auth + real schema + event sink) | route persists / emits / classifies correctly; router resolves the path | that any UI renders it or calls the correct endpoint |
| **Browser-seat RENDER** (real UI + stubbed API responses) | the real UI renders the right state, calls the **correct wired endpoint** (`serveOrAssert` assertion), handles error/edge states | persistence / emission (stubbed here — the backend layer's job) |
| **Browser-seat REAL** (real UI + real deployed backend + real seeded data) | for data-reading flows, the deployed system renders real data end-to-end; publishable demo stills | anything whose selector isn't deployed yet (deployment-lag constraint); injection-bound flows |

The backend layer lives in the initiative's API test suite. The browser-seat layer drives the real UI via a headless browser.

## RENDER vs REAL — one spec, two run modes

A single browser-seat spec runs in two modes, switched by environment variable:

**RENDER** (default, per-PR CI gate):
- Drives a locally-built UI (`vite preview` or equivalent)
- API responses served from `page.route` fixtures
- Deterministic, fast, no real backend
- `serveOrAssert` still asserts the UI called the correct wired endpoint — the route-orphan / wiring proof a render-only stub can't give without this assertion
- No new CI workflow needed: unskipped runnable scenarios ride the existing browser-tier job

**REAL** (out-of-band, dispatched post-deploy):
- Drives the **deployed** UI against the **deployed** backend with real seeded data
- Data-reading flows (list, detail, settings) hit real seeded state and emit **publishable** real-data demo stills
- Flows requiring injected states (forced errors, specific enum values the real backend can't produce on demand) stay `page.route`-injected even in REAL — they validate render-against-state, not "real-ness"
- Mutations are **always** `forceStub`-injected — never mutate prod data

**Mode discipline**: assert exact values only in RENDER (fixture-controlled); in REAL assert shape/presence (real data drifts between runs).

## The deployment-lag constraint (name it, don't hide it)

REAL mode drives the **currently deployed** build. A change that adds new selectors passes RENDER (local build has the selectors) but fails REAL until the change deploys.

**CORS origin-pin**: a preview build cannot substitute for the deployed canonical origin. If the backend's CORS allowlist pins the canonical origin (e.g. `subs-admin.pages.dev`), real API calls from a preview origin (`<hash>.subs-admin.pages.dev`) return CORS errors. The two coverage gaps (new-selector proof and CORS-gated data flows) are each independently provable but **not in a single REAL run against a preview build**. The genuine proof requires the canonical origin with the new selectors = the production deploy.

This is standard CI topology, not a defect. Name it in the flow's coverage note; don't reach for workarounds that paper over it.

## Demo-as-proof convention

The published demo per feature is the **headline** (`@demo`-tagged) scenario's walk — the most representative success path. Gate `startTour()` on the demo tag:

```ts
Given('...', async ({ page, $tags }) => {
  if ($tags.includes('@demo')) startTour(TOUR_ID, 'Title');
  // ...
});
```

Every flow needs at minimum: one headline success scenario (`@demo`) + one error/edge scenario. The demo asset is the headline walk's screenshots, not whichever scenario ran last.

## Coverage note per flow

Document what the browser-seat layer proves and explicitly defers:

```
// browser layer: proves the UI renders <X>, calls <endpoint>, handles <error>
// deferred to backend layer: persistence, event emission (see <scenario-file>.scenario.ts)
// deferred external: <any live integration that can't complete in the test environment>
```

## Spec structure (minimal shape)

```gherkin
# BRD: §US-X.Y. Two-layer model:
#   browser proves render+wiring+error; backend proves persist/emit.
#   One spec → test + demo.
@ac:US-X.Y @<surface>
Feature: <surface> (browser-seat)

  Background:
    Given the merchant opens the <surface> page

  @runnable @demo
  Scenario: <headline success walk>
    ...

  @runnable
  Scenario: <error or edge path>
    ...
```

## Grounding a new flow (do this BEFORE writing)

For each new flow, resolve these before authoring a step:

1. **Route** — the URL path + component it renders
2. **Component** — every `data-testid`/`data-demo` attribute and role/label selector for the controls
3. **GET endpoint + response shape** — include **every required field** in the fixture; a missing field crashes the render before your selector mounts
4. **Mutation endpoints** — any POST/PATCH/DELETE the actions call; always `forceStub` (assert the wired payload, never mutate)
5. **Existing stub test** — if an existing stub test solved selectors for this surface, mirror them exactly

## Promotion criteria

Promote to a cross-consumer gate or `template/` reviewer when:
- A second initiative ships this two-layer model (backend-scenario + browser-seat RENDER + optional REAL)
- The CORS/deployment-lag constraint surfaces and is resolved in a reusable harness layer

**Related patterns**:
- [docs/patterns/api-load-testing-pattern.md](api-load-testing-pattern.md) — the traffic-level proof that this pattern and backend-behavioral together still don't cover (load/concurrency)
- [docs/patterns/invariants-registry-pattern.md](invariants-registry-pattern.md) — where the "two layers compose" contract becomes a mechanical invariant

**Source**: subs-initiative `e2e/support/harness.ts`, `docs/methodology/2026-06-25-browser-seat-convergence.md`, ADR-0065 amendment (2026-06-25).
