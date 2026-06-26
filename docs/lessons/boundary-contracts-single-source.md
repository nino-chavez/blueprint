---
canonical: true
---

# Boundary Contracts Need a Single Source — Lessons From a Flow That Was Dead Since Inception

**Status**: Captured 2026-06-25 from the `subs-initiative`. A foundational user
flow — storefront *subscribe → checkout → subscription created* — had **never
worked in the project's entire history**, while every test layer was green. It
was found not by a test but by a manual database audit (`subscriptions.from_order
= 0`). **Cross-validating**: this is a *second* initiative reproducing the
"mocked-contract false-green" lesson already captured in
[ground-truth-over-proxy.md](./ground-truth-over-proxy.md) (US-15.3) — two
independent occurrences, so that lesson graduates from single-initiative to
**reproduced**, and the mechanical preventions below become promotion candidates.

**Source evidence** (re-verified against commits/lines before capture):
- The incident: the storefront wrote BC cart metafield namespace `bc_subscriptions`
  (underscore) with shape `{id,name,interval,interval_count,amount_cents,currency}`;
  the api webhook read `bc-subscriptions` (hyphen) expecting `{plan_id,cadence}`.
  Both intent-fetch paths returned `{}`; every checkout silently produced a
  one-time order. Fix: `8b75791a` (`apps/api/src/routes/webhooks.ts`).
- The contract was hand-copied into each consumer per a ratified **"port-not-pull"**
  decision (the storefront sits outside the npm workspace, in a different build
  system, so shared types were *copied* not *imported*). 4+ hand-maintained copies
  of one wire contract.
- Why no test caught it: the unit mocks returned the webhook's *own* (wrong)
  namespace + shape — the mock encoded the same defect as the code, so the test
  was structurally incapable of failing. No test ever ran the real writer's output
  into the real reader.
- Why CI didn't catch it: the api unit suite had **no `pull_request` trigger**; the
  two storefront e2e suites that *name* the subscribe flow were both disabled
  (`flows.spec.ts:100` hardcoded `test.skip(true)`; `subscribe-end-to-end.feature:21`
  `@skip`); the one real subscribe e2e ran on a weekly cron only; and the storefront
  was excluded from CI entirely (workspace-only test job).
- The fix (prevention): `7ba87d20` — a single zero-dependency, framework-agnostic
  contract package (`@bc-subscriptions/storefront-contract`, ships raw TS) imported
  by *both* sides so drift is a compile error; a cross-boundary contract test
  (shared encoder → shared decoder, no mock between); `3462b34f` — a path-scoped
  PR gate running that test + a storefront typecheck.
- Full retro: `subs-initiative` `docs/methodology/2026-06-25-storefront-contract-drift-retro.md`.

**Related patterns / lessons**:
- [ground-truth-over-proxy.md](./ground-truth-over-proxy.md) — the parent lessons set
  (Lesson "mocked-contract false-green" is the one this reproduces; "presence ≠
  function" is Lesson 5 below restated).
- [docs/patterns/invariants-registry-pattern.md](../patterns/invariants-registry-pattern.md) —
  where Lessons 1, 2, 4 become mechanical invariants.

---

## Why this lessons set exists

A contract that crosses a boundary — a process, a network hop, a hosted-checkout
redirect, a package boundary between two build systems — is the single highest-risk
seam in a system, *and* the one most likely to be tested in two halves that never
meet. When the producer and consumer are tested in isolation against hand-written
mocks, the mocks become a place for the bug to hide in plain sight, agreed to by
both sides. The cost is uncapped: a foundational flow can be dead for the lifetime
of the project with a fully green board, because nothing ever asked the two halves
to agree on real bytes.

---

## The lessons

### 1. A boundary contract gets ONE shared, typed source — and a cross-boundary test.
Any value serialized across a process / network / host / cross-build-system
boundary (metafields, webhook payloads, queue messages, cross-package types) MUST
have one shared typed definition that **both** sides import, so a divergence is a
compile error. Pair it with a test that runs the *real* producer's output into the
*real* consumer with **no mock between them**. The shared import prevents drift; the
test proves the bytes round-trip. Neither alone is enough — the import can be
bypassed, the test can rot — but together they make the seam observable.

> Mechanical form: a zero-dependency, framework-agnostic contract package both
> sides depend on. Framework-agnostic matters when the consumers are heterogeneous
> (a Worker, a SvelteKit SSR build, a React app, a web-component) — a heavy or
> platform-coupled shared package gets *copied* instead of imported, which is how
> the drift started.

### 2. Mocks must be derived from the real producer — never hand-written to match the consumer's assumption.
A mock that encodes the same assumption as the code under test cannot fail on a
contract bug; it certifies the bug. When you mock a boundary, generate the fixture
from the other side's actual output (ideally the shared encoder from Lesson 1), or
assert the two sides' constants against each other. "The handler correctly parses
the mock" is not coverage if the mock is wrong in the same way the handler is.

### 3. CI must gate the user's primary acquisition path — not just post-state.
Most suites test what happens *after* the user is already a subscriber (manage,
cancel, portal). The acquisition path — the click that creates the relationship —
is the one that pays, and the hardest to test (it crosses hosted checkout + an
async webhook), so it's the one most often skipped. A `skip`-ped or scheduled-only
test on the headline flow is **worse than no test**: it reads as coverage on the
board. Headline-flow tests gate PRs, or they don't exist.

### 4. Standalone hosts excluded from the workspace stay in CI for the contract.
Decoupling a host's build from the monorepo ("port-not-pull") is a legitimate
choice — but the wire contract it copies must still be shared (Lesson 1) and the
host must still run a typecheck + the contract test in CI. A host that's excluded
from CI is a place where types drift from the canonical source with *zero* signal
until a manual audit. Build-decoupling without contract-coupling is just
slow-motion drift.

### 5. Presence ≠ function — assert the real artifact, not the 200.
Green tests, present files, registered routes, and a 200 response are proxies. The
only proof a flow works is the flow producing its real artifact — here, a
subscription *row*. Where the flow can't be exercised end-to-end in CI (hosted
checkout + async webhook), assert the artifact directly: drive the webhook over a
real ephemeral DB and `SELECT count(*) … WHERE source = 'from_order'`. That is
exactly the query the manual audit ran to discover the dead flow — automate the
audit, don't accept the proxy.

---

## Promotion path

- **Lesson 1** (shared source + cross-boundary test) is mechanical today: a contract
  package + a `pull_request`-triggered contract test. Promote to a scaffold default
  for any initiative with >1 consumer of a serialized contract.
- **Lesson 2** (mocks from the real producer) is a lint candidate: flag boundary
  fixtures that are hand-authored object literals rather than derived from a shared
  encoder.
- **Lessons 3–4** are CI-config invariants: a check that the acquisition-path test
  exists, is not `skip`-ped, and runs on `pull_request`; and that every host with a
  contract dependency runs a typecheck in CI. **Shipped instance**: `subs-initiative`
  `3462b34f` — a path-scoped `.github/workflows/contract-gate.yml` that runs on
  `pull_request` paths matching the storefront, api, or contract package; executes
  the cross-boundary contract test + storefront typecheck. This is the PR-gate shape
  for Lessons 3–4 ready to copy.
- **Lesson 5** reuses the `inventory-as-evidence` / ground-truth spine — assert the
  derived artifact, already mechanized as `state-derive` for presence; extend to a
  row-materialization assertion for function.
