# Blueprint Reviewer Agents

Stage-gate agents that block premature stage completion. Variant-aware: each gate behaves differently per `blueprint.yml` `variant:` declaration.

Canonical reference: `wip/big-blueprint/docs/variant-selection.md`.

## Roster

| Agent | Gate | Variants |
|---|---|---|
| `research-completeness-reviewer` | Stage 1 → Stage 2 | All |
| `design-principles-reviewer` | Stage 2 → Stage 3 | Greenfield |
| `prescription-evidence-reviewer` | Stage 2 → Stage 3 | Midstream, Brownfield |
| `fact-check-loop-reviewer` | Stage 4 convergence orchestrator | All |
| `doc-quality-auditor` | Stage 5 → Stage 6 | All |
| `terminology-linter` | Stage 5 → Stage 6 (parallel with doc-quality-auditor) | All |
| `prototype-smoke-runner` | Stage 6 ship gate | Greenfield, Midstream, Brownfield-if-prototype |

## Behavior model

- **Read-only.** Reviewers audit; they do not patch. The calling agent owns the fix.
- **Variant-aware.** Each reviewer reads `blueprint.yml` to determine variant and adjusts checks accordingly.
- **Block on failure.** A reviewer's verdict is binary — PASS or BLOCKED. The calling agent must resolve all findings before re-invoking.
- **Convergence cap.** `fact-check-loop-reviewer` caps at 5 iterations before escalating to the operator. Persistent failure after 5 loops is a signal that the underlying claims are unsupportable, not that more loops will help.

## Location convention

Reviewers live in the **shared template** at `template/.claude/agents/blueprint/reviewers/`. Per-initiative overrides go in the consumer's `.claude/agents/blueprint/reviewers/` and merge on top — but override only for threshold tuning (e.g., a project that needs 6 research legs instead of 4), never for behavior change.

## Runtime model

Reviewers run inside a single orchestrator agent (`fact-check-loop-reviewer` orchestrates the fact-check sub-reviewers; non-fact-check reviewers are invoked directly at their respective gates). Worktree-per-reviewer isolation is deferred until reviewers gain write authority — none of the current set has it.

## Origin

Promoted from the v2 patch Increment 2 deferred set (`METHODOLOGY-v2-harness-engineering-patch.md` §"Open questions to resolve before increment 2"). The v3 variant taxonomy provided the missing per-variant gating that made the reviewer set codifiable.
