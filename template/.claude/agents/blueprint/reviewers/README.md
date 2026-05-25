# Blueprint Reviewer Agents

Stage-gate agents that block premature stage completion. Variant-aware: each gate behaves differently per `blueprint.yml` `variant:` declaration.

Canonical reference: `wip/blueprint/docs/variant-selection.md`.

## Roster

| Agent | Gate | Variants |
|---|---|---|
| `research-completeness-reviewer` | Stage 1 → Stage 2 | All |
| `design-principles-reviewer` | Stage 2 → Stage 3 | Greenfield |
| `prescription-evidence-reviewer` | Stage 2 → Stage 3 | Midstream, Brownfield |
| `portal-pattern-a-conformance-reviewer` | Stage 3 completion (Pattern A) **and** any commit touching `apps/portal/` | All initiatives at Tier 1+ on Pattern A |
| `portal-pattern-b-conformance-reviewer` | Stage 3 completion (Pattern B) **and** any commit touching `portal/` or `blueprint/portal/` | All initiatives at Tier 1+ on Pattern B |
| `fact-check-loop-reviewer` | Stage 4 convergence orchestrator | All |
| `doc-quality-auditor` | Stage 5 → Stage 6 | All |
| `terminology-linter` | Stage 5 → Stage 6 (parallel with doc-quality-auditor) | All |
| `prototype-smoke-runner` | Stage 6 ship gate | Greenfield, Midstream, Brownfield-if-prototype |

### Pattern selection for the portal-conformance gate

Run exactly one of the two portal-conformance reviewers per initiative — whichever matches the pattern declared in `blueprint.yml` (or inferred from the directory layout: `apps/portal/` ⇒ Pattern A, `portal/` or `blueprint/portal/` ⇒ Pattern B). Running both is a configuration error; running neither at Stage 3 on a Tier 1+ initiative is a methodology violation (the failure mode is the v1-with-deliberation-shape, 11-variants-walking portal the blog session shipped pre-2026-05-25).

The "any portal-touching commit" trigger applies to midstream and brownfield variants — those variants can edit a portal anywhere along the pipeline, not just at Stage 3. Greenfield gets the gate at Stage 3 completion only (no portal exists earlier).

## Behavior model

- **Read-only audit, with one exception.** Most reviewers audit; they do not patch. The calling agent owns the fix. The exception is `prototype-smoke-runner`, which actively boots the prototype + drives browse-tool to capture screenshots — it produces artifacts (`.smoke-screenshots/`) but does not modify source files.
- **Variant-aware.** Each reviewer reads `blueprint.yml` to determine variant and adjusts checks accordingly.
- **Block on failure.** A reviewer's verdict is binary — PASS or BLOCKED. The calling agent must resolve all findings before re-invoking.
- **Convergence cap.** `fact-check-loop-reviewer` caps at 5 iterations before escalating to the operator. Persistent failure after 5 loops is a signal that the underlying claims are unsupportable, not that more loops will help.
- **Visual gates beat protocol gates.** `prototype-smoke-runner` requires viewport screenshots + CSS-coverage checks alongside the `@smoke` Playwright run. A 200 response from curl is not enough; a green `@smoke` is not enough. Both are blind to unstyled chrome (see `docs/case-study-v3-portal-css-gap.md`).

## Location convention

Reviewers live in the **shared template** at `template/.claude/agents/blueprint/reviewers/`. Per-initiative overrides go in the consumer's `.claude/agents/blueprint/reviewers/` and merge on top — but override only for threshold tuning (e.g., a project that needs 6 research legs instead of 4), never for behavior change.

## Runtime model

Reviewers run inside a single orchestrator agent (`fact-check-loop-reviewer` orchestrates the fact-check sub-reviewers; non-fact-check reviewers are invoked directly at their respective gates). Worktree-per-reviewer isolation is deferred until reviewers gain write authority — none of the current set has it.

## Origin

Promoted from the v2 patch Increment 2 deferred set (archived; see `docs/_archive/handoffs/METHODOLOGY-v2-harness-engineering-patch.md` for the original §"Open questions to resolve before increment 2"). The v3 variant taxonomy provided the missing per-variant gating that made the reviewer set codifiable; its current home is `docs/variant-selection.md`.
