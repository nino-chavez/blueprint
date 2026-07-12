---
canonical: true
adr: 0009
status: accepted
date: 2026-07-11
deciders: ["Nino Chavez"]
ratification: "explicitly ratified by operator 2026-07-11 ('ratify both'); rollout (a)-(d) shipped wave 87 same day — pilot-profile gate mapped end-to-end (fingerprint helper, inputs export, advance invocation + freshness, smoke); remaining gate mappings expand per-gate after fleet calibration (the wave-84 lesson: strict gates shipped uncalibrated passed 0/7 consumers)"
scope_ceiling: "A — methodology-native only (reviewers run locally; assertion state stays in .blueprint/stage-state.json)"
depends_on:
  - ./ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md
references:
  - "internal: ../../template/tools/lib/stage-model.mjs — the stage model + assertion machinery this extends"
  - "internal: ../../template/tools/run-reviewers.mjs + the ADR-0002 review() contract the executable reviewers share"
  - "external review: Codex audit rounds 1–3 (2026-07-11) — the mapping-is-prose, .md-only-reviewer, and assertion-freshness requirements below are its review conditions, accepted"
---

# ADR-0009 — Reviewer-wired `advance`: the deterministic core consults its own gates

## Status

Accepted (operator: "ratify both", 2026-07-11). Rollout (a)–(d) shipped in wave
87: the machinery is live end-to-end for the pilot-profile gate (the calibrated
one); further gate mappings (research-legs → research-completeness-reviewer,
principles-doc → design-principles/prescription-evidence, portal gates) are
added per-gate only after running them against the consumer fleet — wave 84
proved that shipping strict gates without calibration wedges every real
initiative. Wave-86 shipped the narrow precedent
(the `pilot-profile` check kind reads the same policy source as
`pilot-profile-lock-reviewer`, so those two cannot disagree); this ADR generalizes
that property to every transition that has an executable reviewer.

## Context

ADR-0008 decision #2 promised `advance` would "dispatch the stage skill/agent as
the node executor." The wave-86 addendum split that promise: producing-skill
dispatch DECLINED (harness coupling), verifying-reviewer dispatch SCHEDULED —
this ADR. Today the reviewer roster and the stage machine are two disconnected
enforcement systems: the stage→reviewer mapping exists only as a prose table in
`template/CLAUDE.md`, reviewers run only when someone remembers to run them
(the wave-55 invocation-gated false-green class), and a recorded assertion never
expires — a PASS recorded against artifacts that have since changed remains
"confirmed" forever.

## Decision (proposed)

1. **Machine-readable mapping, in the model.** A gate that has an executable
   reviewer declares it in the stage-model data: `{ id, derivable, kind, params,
   reviewer: { name, onWarn } }`. The `template/CLAUDE.md` prose table becomes a
   rendering of this data, not a second source.

2. **`advance` runs mapped reviewers and records their result as the gate
   assertion.** For a frontier gate with a `reviewer:` declaration, `advance`
   invokes the reviewer (same `review({ targetDir })` contract as
   `run-reviewers.mjs`), and: PASS → assertion recorded automatically; BLOCKED →
   transition refused with the reviewer's findings; WARN → **per-reviewer
   policy** via `onWarn: 'pass' | 'block' | 'ask'` declared in the mapping — no
   single global WARN rule (a chrome-drift WARN and a pilot-substance WARN have
   different stakes).

3. **`.md`-only reviewers stay agentic-shell gates.** Two mapped reviewers
   (`fact-check-loop-reviewer`, `doc-quality-auditor`) have no `.mjs` today.
   Their gates keep `derivable: false` + manual assertion (`--assert-<gate>`),
   and `stage status` names the reviewer whose judgment the assertion stands in
   for. A spec-only reviewer is never silently skipped and never fabricated.

4. **Assertion freshness via input fingerprints.** Every reviewer-recorded
   assertion stores: reviewer name, **reviewer-file SHA-256** (its effective
   version), timestamp, and a **content fingerprint of the reviewer's declared
   input globs** — each reviewer `.mjs` exports `inputs: ['research/**', ...]`;
   the fingerprint hashes only those paths, not the whole repo (a README edit
   must not invalidate a portal-conformance PASS). On a later `advance`, a
   fingerprint mismatch invalidates the recorded PASS and the reviewer reruns;
   a matching fingerprint reuses the recorded result (no rerun-on-every-advance
   cost). A reviewer without an `inputs` export gets no fingerprint reuse — it
   reruns every time (safe default, visible in output).

5. **Scope discipline holds.** Only *verifying* reviewers wire in. Producing
   skills stay declined per the ADR-0008 addendum; the operating contract
   (agent executes, operator steers, program gates) is unchanged — this ADR
   makes the "program gates" leg self-executing instead of remembered.

## Consequences

The audit's residual finding — "a deterministic core that ignores its blocking
reviewer is incomplete" — closes structurally. Costs: reviewers gain an `inputs`
export (roster sweep), `stage-state.json` schema grows a versioned assertion
record (additive; old records read as fingerprint-less → rerun), and `advance`
execution time now includes reviewer runtime at the frontier.

## Rollout (on ratification)

(a) `inputs` export + fingerprint helper in the reviewer contract; (b) mapping
fields in the four built-in models; (c) `advance` invocation + freshness check;
(d) smoke: a stamped tree's `advance` runs the pilot reviewer and a stale
fingerprint forces a rerun. Each step self-tested; freeze acknowledgment per
wave.
