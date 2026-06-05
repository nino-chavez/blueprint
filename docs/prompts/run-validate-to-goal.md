# Prompt — Run /blueprint-validate to a bound-completion goal

Paste-prompt for the operator to drive Stage 4 validation under a `/goal` exit condition. It **raises the cost of self-attestation**: the agent cannot call the stage done unless it surfaces, to a fresh evaluator, the orchestrator verdict and the named sub-reviewer PASS behind each Phase 6 box. The bind is **evidentiary, not mechanical** — the evaluator judges what is in the transcript, not the file on disk. The airtight version would require a deterministic Stop-hook script that reads `validation/<date>-validate.md` directly (out of scope here; see the last section).

> **Token coupling (read before editing this file).** The quoted strings below — `CONVERGENCE: converged`, `STAGE 4: COMPLETE`, `ITERATIONS:`, `TOTAL_FINDINGS_RESOLVED:` — mirror the report protocol in `template/.claude/agents/blueprint/reviewers/fact-check-loop-reviewer.md` § "How to report". If that file's report format changes, update the quoted tokens here **in lockstep**, or the `/goal` evaluator will pattern-miss and return a false not-met. This prompt is an operator doc; it does **not** ship via `template/`, so a consumer that overrides its orchestrator report format must update these tokens by hand.

## Why this is an operator paste-prompt, not a skill edit

`/goal` is a session-scoped interactive command the operator types live (or runs headless via `claude -p`). It is NOT a setting, a CLI flag, or anything a skill can set on its own behalf — an instruction inside `validate.md` telling the agent to "set a /goal" is **inert**, because the agent does not run `/goal`, the operator does. The run-scoped loop condition therefore lives here in `docs/prompts/`, not baked into `validate.md` (methodology source, every-consumer blast radius) or `blueprint.yml` (durable per-initiative config). The skill stays declarative about phases; the operator owns the loop condition for a single run. Initiatives where the operator runs validate bare get zero benefit — that is by design: run-scoped intent stays off the forever surface.

Requires Claude Code v2.1.139+. Unavailable if `disableAllHooks` / `allowManagedHooksOnly` is set, or in an untrusted workspace — the command tells you why.

## How it coexists with the 5-iteration convergence cap (no double-gating)

The `fact-check-loop-reviewer` orchestrator owns the loop counter and the 5-iteration failure-ceiling; it escalates to the operator on persistent BLOCK. The `/goal` condition does **not** re-count iterations, impose its own retry budget, or re-block findings the reviewers intentionally PASSed. It is a **read-only consumer** of the verdict the orchestrator already prints to the transcript (`CONVERGENCE: converged | escalated`, the `STAGE 4: COMPLETE` block). It treats `CONVERGENCE: escalated` as **terminal** — the goal stops and hands to you, it never says "one more try" — so the failure-ceiling can't be laundered into a success-target. It carries its own `stop after N turns` clause so the `/goal` loop physically cannot out-run the cap. One loop counter, one escalation path: the cap escalates to the operator, and an unmet `/goal` hands to the same operator rather than auto-passing.

The 8-consecutive-blocks Stop-hook override is the real hard backstop and will force a stop regardless of the soft turn ceiling below.

## The gap this closes (and the gap it does not)

The 5-iteration cap only guarantees the fact-check loop *terminates honestly*. It does **not** bind that loop's verdict to the Phase 6 report (`validate.md` Phase 6 is a self-attested checklist; line ~119 carries the `or remaining failures documented as accepted, with rationale` escape hatch). So today a session can converge — or merely *escalate* — the loop and still hand-check Phase 6 boxes that no green sub-reviewer PASS backs. The `/goal` condition closes exactly that bind-gap by forcing each Phase 6 box to quote the orchestrator line that backs it. It does **not** defeat an agent that fabricates a quoted verdict in-transcript — that is the residual risk, mitigated only by quoting being harder to fake consistently than a bare checkbox.

## The condition (interactive)

Run validate first so the transcript contains the orchestrator's report, then set the goal:

```
/goal Stage 4 is done ONLY when this transcript contains, verbatim: (a) the fact-check-loop-reviewer's final report block with CONVERGENCE: converged — NOT escalated, NOT continuing — and a STAGE 4: COMPLETE block showing ITERATIONS: and TOTAL_FINDINGS_RESOLVED:; (b) the Phase 0 gate output path validation/<date>-phase-0-gates.md; and (c) for every Phase 6 box, the exact sub-reviewer PASS line (citation-checker / current-state-claim-verifier / codebase-claim-verifier) from that report that backs it — box-to-quoted-verdict pairs, not paraphrase. If the report block is absent, paraphrased, or its CONVERGENCE token is not the literal string "converged"; if the loop is escalated; or if any Phase 6 box has no matching quoted PASS line — the goal is NOT met: name the missing artifact and fix it, do not narrate around it and do not re-run the loop past its own 5-iteration cap. Constraints that must not change: do not re-block findings the reviewers PASSed as stylistic/speculative; do not patch findings inside the orchestrator. Stop after 6 turns and hand to the operator if not met by then.
```

## Headless variant

```
claude -p "/goal <same condition as above>"
```

`Ctrl+C` stops a non-interactive goal before the condition is met. A goal still active when the session ends is restored on `--resume` / `--continue` (turn count resets); it does **not** survive `/clear`.

## If you want the airtight bind later

The evidentiary bind above is the right altitude for an opt-in operator prompt. The mechanical version — confirm `validation/<date>-validate.md` exists on disk and its boxes match the converged loop — needs a **command-type Stop hook** in `template/.claude/hooks/` that reads the file. That is forever-surface, every-consumer blast radius, and belongs in its own wave with a `wave_entry` decision, not in this opt-in doc.
