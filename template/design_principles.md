# Design Principles — <Initiative Name>

> Stage 2 output. Codify what this initiative CAN and CAN'T do BEFORE building.
> The act of writing the "CAN'T do" section out loud is where most fixture-mode
> debt gets prevented. See `docs/case-study-subs-initiative-skipped-stages-2-4.md`
> for what happens without this artifact.

## What this can do today

> Per-phase capability list. For each: cite source-of-truth (spec section,
> ADR number, state-derive capability ID, or test file).

- (Phase 1) <capability> — source: <citation>
- (Phase 1) <capability> — source: <citation>
- (Phase 2) <capability> — source: <citation>

## What this CAN'T do today

> Explicit. Fixture-mode boundaries. Feature-flag gates. Phase-N deferrals.
> Each entry: what's missing, why it's deferred, when it lands.

- **<capability>** — DEFERRED to Phase N because <reason>. Tracking: <Hive proposal / ADR / spec section>.
- **<capability>** — GATED behind feature flag `<FLAG_NAME>` because <reason>. Production code path: <description>. Tracking: <link>.
- **<capability>** — STUBBED with placeholder; production implementation gated on <external blocker or future spec>. Tracking: <link>.

## Hard constraints

> Rules that ANY contributor must respect. Violations should fail review.

- **No fixture-mode helpers imported by production routes.** Production code paths must work end-to-end with real backing systems, not synthesized fixture responses.
- **No COMPLIANT capability without runtime verification.** Structural existence (`file_exists`, `grep_present`) is necessary but not sufficient. Runtime behavior must be verified at least once before claiming COMPLIANT.
- **No spec changes without proposal substrate.** BRD/PRD/ARCHITECTURE/STRATEGY edits go through proposal → synthesis → PR with synthesis ID in commit. No direct edits to canonical specs.
- **No deferred-build clauses without paired implementation Spec.** If an ADR / spec / proposal commits to building something "later," the implementation Spec must be filed in the same session, not deferred to "when we get to it."
- **<additional initiative-specific constraints>**

## Cross-references

- BRD/PRD/Spec sections describing intended forward-looking behavior: <links>
- ADRs ratifying architectural decisions: <links>
- State-derive catalog entries verifying current implementation state: <link>
- Open questions tracker (the *why* behind deferrals): <link>

---

> **Why this file matters**
>
> When this file doesn't exist or is just aspirational ("here's what we'll build"),
> the project accumulates fixture-mode debt. Implementers can't tell from the
> spec what's actually wired up vs. what's scaffold-with-throw-in-the-production-branch.
> The "What this CAN'T do today" section forces the team to be honest about the
> floor at any given moment, which is what allows new work to be scoped correctly
> against the real (not the spec-aspirational) state of the system.
