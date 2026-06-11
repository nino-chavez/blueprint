# Test Discipline: the test is a gated co-deliverable of the build, not a downstream audit

**Status: canonical (wave 66).** Surfaced by an operator interrogation of a consumer initiative ("we can't say a feature is built if it hasn't been tested — and shouldn't the methodology *drive* writing the test when the code is written, not wait for a tester?"). It closes a structural gap left by the DoD verification ladder: the ladder is entirely **detective** (it checks state *after* the fact), and nothing in the build flow binds **test-creation to code-creation**. This pattern adds the **preventive** half.

## The gap this closes

The DoD ladder (`dod-verification-ladder-pattern.md`) verifies, per AC: spec written (G1) → prototype (G2) → artifacts present (G3) → a scenario passes (G4) → live (G5). Every gate *inspects state that already exists*. In the common operating model, building the code and authoring its test are **two separate passes** — an implementation pass lands the code (G3), and a *later* drain authors the behavioral scenarios (G4). That models test-authoring as **downstream of building** — the exact "wait until a tester decides to test" anti-pattern a real engineering team rejects. The result: code ships untested, coverage lags by waves, and "present" silently masquerades as "built" until a much-later drain finds the present-but-broken features (a privacy export that crashed on every record was found this way — *after* it had read COMPLIANT for weeks).

## The principle: source over order

The instinct is "write the test first (TDD)." The discriminating variable is **not** order (before vs alongside the code) — it is **source**:

> **A behavioral test must assert the SPEC's *required* behavior, not the code's *implemented* behavior.**

This is why naive same-agent TDD fails for AI-built code: if one agent writes the test from its own interpretation of the AC and then writes code to pass it, the test and the code are wrong *in the same direction* when the agent misreads the AC — and it goes green (the "assert-the-bug" false-pass). The value of an independent test is that it encodes the contract from the **acceptance criterion**, so the code is measured against the spec, not against itself. (Mechanical corollary for agents: strict red-green is unreliable when the agent can't run tests locally; the load-bearing property is *sourced-from-spec + executed-in-CI*, not a literal failing-first step.)

So the rule is **spec-first, test-as-contract** — author the behavioral test *from the AC* as the contract the build must satisfy — rather than dogmatic red-green.

## The build-stage contract (the preventive control)

The implementation stage's Definition of Done makes the behavioral test a **first-class, gated co-deliverable of the code**:

1. **Co-deliverable.** The unit of work that builds code for AC *X* is not done until its behavioral test(s) are authored — in the **same** unit of work, sourced from the AC — and committed alongside the code. The dispatch brief for any code-producing task *requires* the test as an output, not a follow-up.
2. **Executed at the gate.** Those tests run in CI at that stage. "Code present without its behavioral test authored *and executing*" is a **gate failure at the build stage** — not a gap discovered three waves later.
3. **Independence for high-stakes ACs — the two-role build.** For regulated / payments / data-rights ACs, the agent that writes the spec-derived test is **not** the agent that makes it pass. One authors the contract from the AC; another builds to satisfy it; the orchestrator verifies against the recorded results. This is the independence that catches present-but-broken — the same independence that surfaced the privacy-export crash (the scenario asserted the AC's required behavior and the code *failed* it).

This composes with the ladder: the build-stage contract guarantees a G4 *scenario exists and runs* the moment G3 artifacts land; the ladder's `scenario_passes` then reports whether it's green (works), red (present-but-broken → real gap), or unknown.

## Configurable rigor — opt-out, tier-bound, declared

A throwaway prototype and a payments platform have genuinely different bars, so the *rigor* is configurable — but with an **opinionated default**:

- **Default ON (rigorous), dialed *down* explicitly.** If rigor were opt-in, the path of least resistance skips it and you are back at "test after the fact." Make it **opt-out**: the gate is on by default; relaxing it is a **declared, logged choice**, never a silent omission. The safe thing must be the easy thing.
- **Bound to the project tier** (the existing `--tier` axis):
  - **Tier 3 / regulated** — strict spec-first + two-role independence + the coverage gate (below). No code lands without its passing spec-test.
  - **Tier 2 / standard** — spec-first test-as-co-deliverable + executed-at-gate; two-role independence reserved for the high-stakes ACs.
  - **Tier 1 / prototype** — tests for non-trivial logic only, no coverage gate (matches the prototype testing baseline; UI-without-behavior tests are noise).
- Any reduction below the tier default is recorded the way an out-of-queue dispatch is — inspectable, not implicit.

## The detective backstop: the test-type coverage matrix

The preventive gate is primary; an after-the-fact register is the **backstop** that catches anything that slipped — and it also fixes a residual honesty risk in the ladder itself:

> **`G4`-green (a scenario passes) is NOT "fully tested."** G4 is satisfied by *at least one* passing behavioral scenario. A 100%-green G4 register can sit on top of a hollow pyramid — every AC covered by a single thin scenario, zero E2E / BDD / unit depth. Reading "G4 verified" as "fully tested" is the same authority-bleed the ladder was built to kill (presence read as function), recursed one gate up.

The backstop is a **per-AC × per-test-type coverage matrix**: for every AC, each test type (functional/unit, integration, E2E, BDD) renders as *not-defined / defined-but-failing / defined-and-green*, with gaps flagged. It is derivable only once tests carry an **AC tag** (the same `acs:` / `@ac:` join key the ladder uses) — so the tagging discipline is a prerequisite, and "untagged test" is itself a finding. The matrix is a register (a richer sibling of `state-derive`), not a gate the agent self-attests.

## What this is, in one line

The DoD ladder answers *"is each AC's behavior verified?"* (detective). This pattern answers *"is the test written, sourced from the spec, and run, as part of building the code?"* (preventive) — and *"is the full pyramid present per AC?"* (the coverage backstop). All three, with rigor dialed to the tier.
