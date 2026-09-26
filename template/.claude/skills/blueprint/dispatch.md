---
name: blueprint-dispatch
description: Orchestrate a parallel agent dispatch wave when a planning thread has produced multiple inspectable artifact briefs whose file scopes don't overlap. Use when there are ≥2 artifacts with named target files, complete specs, non-overlapping file scopes, and no mid-flight orchestrator synthesis needed. Triggers on operator saying "dispatch", "wave", "in parallel", or "across agents".
---

# /blueprint-dispatch

Orchestrate a parallel agent dispatch wave when a planning thread has produced multiple inspectable artifact briefs whose file scopes don't overlap.

The general workflow is owned by the `dispatch-wave` skill: the pre-flight checks, the mandatory brief fields, model selection, dispatch mechanics, inline work during the wait, post-flight cross-review, and commit shape. Read it there, not here:

- Installed: invoke `dispatch-wave`.
- Not installed: <https://github.com/nino-chavez/agentic-ways-of-working/blob/main/skills/dispatch-wave/SKILL.md>

This file holds only what a Blueprint initiative adds or makes stricter. Where the two disagree, this file wins inside a Blueprint initiative.

Worked example: blueprint-example commit `09036602` (2026-05-27) — three Sonnet agents drafted platform-shims feasibility + sibling strategy doc + methodology amendment in parallel while the orchestrator wrote a parallel ingester. `dispatch-wave` cites the same example.

## What Blueprint makes stricter

1. **The overlap check is mandatory, not conditional.** `dispatch-wave` says to run a project's overlap tool if one exists and otherwise check by inspection. A Blueprint initiative always has one. Run `template/tools/parallel-dispatch-check/check.sh` with each agent's file globs as separate args before every dispatch. Exit 0 → safe; exit 1 → switch to serial or narrow scopes.
2. **Judgment an agent can carry goes to Opus; judgment only the orchestrator can make stays inline.** If an artifact needs judgment only the orchestrator can make, dispatch it to Opus or do inline. `dispatch-wave` names only the inline option at pre-flight.
3. **Reporting follows the output-discipline rule.** Each agent reports the synthesized result plus pointers (file path, line count, cross-refs they couldn't resolve, judgment calls), never the corpus it read. Canonical rule + tier dial: `template/docs/methodology/agent-output-discipline-pattern.md`.
4. **Push to the integration branch** (`dev` for blueprint-example and similarly-shaped projects) per the project's pattern-1 local-integration workflow. Fast-forward from remote before committing if behind. Include the `Co-Authored-By:` footer per the project CLAUDE.md template.

## The workflow in one screen

For when `dispatch-wave` is not to hand. Each line is a step it specifies in full.

1. Pre-flight: ≥2 artifacts with named target files; specs complete; file scopes disjoint (item 1 above); no orchestrator synthesis needed mid-flight (item 2 above); the brief set matches what was actually asked.
2. One self-contained brief per artifact: goal and audience, READ-FIRST sources, full output structure, cross-references with forward-links marked, a don't-do list, voice and length, reporting expectations (item 3 above), and cleanup of anything the agent starts.
3. Sonnet for execution from a complete brief; Opus for judgment-bearing work. Sonnet is the default.
4. Make the wave visible as tasks, then launch all agents in a single message, in the background. Do not poll.
5. Do bounded inline work during the wait. Nothing that overlaps an agent's file scope or contradicts an in-flight brief.
6. Post-flight cross-review is mandatory: compare shared content across briefs, resolve forward-links, check frontmatter and run the project's lints, and verify each agent's file scope and cleanup against the repo, not against its report.
7. Commit at end of wave with specific files staged by name (never `git add -A`), then push (item 4 above).

## Output

- Commit landed on the project's integration branch (typically `dev`) containing N parallel artifacts + any inline orchestrator side-work.
- TaskList shows all wave tasks completed.
- Per-artifact reporting from each subagent has been read and any cross-doc inconsistencies fixed in cross-review.

## What this skill does NOT do

- Does not bypass `template/tools/parallel-dispatch-check/check.sh`. The mechanical overlap check is the difference between this skill and ad-hoc dispatch — don't skip it.
- Does not replace `isolation: "worktree"` for cases where it's required (multi-operator-collab pattern). This skill assumes non-overlapping file scopes are sufficient isolation for additive new files; cross-edits of existing files still need worktrees.
- Does not dispatch work the orchestrator should do inline (mechanical pattern-edits, single-artifact work, briefs that aren't yet complete).
- Does not generate the briefs themselves. The orchestrator constructs the briefs from the planning thread; this skill is the workflow around dispatch, not a brief-generator.
- Does not commit on the orchestrator's behalf when the trigger is mid-thread analysis. Commit happens at end-of-wave, not after each agent return.

## Cross-skill invocation

Consider proactively suggesting this skill when:
- A `/blueprint-handoff` describes ≥2 parallel-safe next moves with named target files
- A planning thread closes with ≥2 artifact briefs fully specified
- `/blueprint-research` produces a research scope that decomposes into independent corpora
- The operator says "dispatch", "wave", "in parallel", or "across agents"

## Reference

- `dispatch-wave` — owner of the general workflow (link above)
- `template/tools/parallel-dispatch-check/check.sh` — pre-flight file-scope overlap detector (run before every dispatch)
- `template/tools/wave-digest/digest.mjs` — post-wave filter for the methodology log
- `template/methodology/handoff/handoff-template.md` — the cross-session handoff format; precursor to multi-agent dispatch
- `template/docs/methodology/agent-output-discipline-pattern.md` — what an agent reports back, and the tier dial
- blueprint-example `09036602` (2026-05-27) — canonical worked example: three Sonnet agents in parallel + orchestrator inline ingester work + post-flight cross-review caught one §C reclassification mismatch + commit-and-push to dev. Brief shape visible in the orchestrator's parent session.
