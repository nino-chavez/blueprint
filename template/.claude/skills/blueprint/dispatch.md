---
name: blueprint-dispatch
description: Orchestrate a parallel agent dispatch wave when a planning thread has produced multiple inspectable artifact briefs. Use when there are ≥2 artifacts with named target files, complete specs, separate writer worktrees, and no mid-flight orchestrator synthesis needed. Triggers on operator saying "dispatch", "wave", "in parallel", or "across agents".
---

# /blueprint-dispatch

Orchestrate a parallel agent dispatch wave when a planning thread has produced
multiple inspectable artifact briefs.

The general workflow is owned by the `dispatch-wave` skill and the configured
host dispatch route. They own the pre-flight checks, mandatory brief fields,
model selection, dispatch mechanics, inline work during the wait, post-flight
cross-review, and commit shape. Read the workflow there, not here:

- Installed: invoke `dispatch-wave`.
- Not installed: <https://github.com/nino-chavez/agentic-ways-of-working/blob/main/skills/dispatch-wave/SKILL.md>

This file holds only what a Blueprint initiative adds or makes stricter. It
does not override the host's worker route, model or effort policy, browser
policy, or publication authorization.

Worked example: the source example in `dispatch-wave`, commit `09036602`
(2026-05-27), covers parallel artifacts, parent work, and cross-review. It is
historical source evidence, not this initiative's commit history.

## What Blueprint makes stricter

1. **The overlap check is mandatory, not conditional.** `dispatch-wave` says to run a project's overlap tool if one exists and otherwise check by inspection. A Blueprint initiative always has one. Run `template/tools/parallel-dispatch-check/check.sh` with each agent's file globs as separate args before every dispatch. Exit 0 → safe; exit 1 → switch to serial or narrow scopes. A passing scope check does not replace separate worktrees for independent writers, including writers adding non-overlapping new files.
2. **Parent judgment stays with the parent.** Send a bounded brief through the host's configured dispatch route. Honor its classification, model, effort, and receipt requirements. Keep judgment only the parent can make inline; do not hard-code model names here.
3. **Reporting follows the output-discipline rule.** Each agent reports the synthesized result plus pointers (file path, line count, cross-refs they couldn't resolve, judgment calls), never the corpus it read. Canonical rule + tier dial: `template/docs/methodology/agent-output-discipline-pattern.md`.
4. **Publication follows existing authority.** A local-only task stays local. When the task or project workflow already authorizes commit or publication, complete that authorized step without adding a new confirmation. Follow the project's branch and attribution rules; this skill does not prescribe a branch or push.

## The workflow in one screen

For when `dispatch-wave` is not to hand. Each line is a step it specifies in full.

1. Pre-flight: ≥2 artifacts with named target files; specs complete; each writer has a separate linked worktree carrying the intended source state; file scopes checked (item 1 above); no orchestrator synthesis needed mid-flight; the brief set matches what was actually asked.
2. One self-contained brief per artifact: goal and audience, READ-FIRST sources, full output structure, cross-references with forward-links marked, a don't-do list, voice and length, reporting expectations (item 3 above), and cleanup of anything the agent starts.
3. Use the host's required route when configured; otherwise use the portable route in `dispatch-wave`. Follow its model and receipt policy. Do not substitute another worker-creation route if a required launch fails.
4. Make the wave visible in local task bookkeeping and launch through the configured dispatcher. Use completion notifications or bounded waits supported by the host; this does not authorize persistent sidebar chats.
5. Do bounded inline work during the wait. Nothing that overlaps an agent's file scope or contradicts an in-flight brief.
6. Post-flight cross-review is mandatory: compare shared content across briefs, resolve forward-links, check frontmatter and run the project's lints, and verify each agent's file scope and cleanup against the repo, not against its report.
7. Complete only the commit or publication the task or project workflow already authorizes. Stage named files, never `git add -A`.

## Output

- N parallel artifacts + any inline orchestrator side-work, with local commit and publication state reported separately.
- TaskList shows all wave tasks completed.
- Per-artifact reporting from each subagent has been read and any cross-doc inconsistencies fixed in cross-review.

## What this skill does NOT do

- Does not bypass `template/tools/parallel-dispatch-check/check.sh`. The mechanical overlap check is the difference between this skill and ad-hoc dispatch — don't skip it.
- Does not replace separate writer worktrees. File scopes detect overlap; they do not make concurrent additive writes safe in one checkout.
- Does not dispatch work the orchestrator should do inline (mechanical pattern-edits, single-artifact work, briefs that aren't yet complete).
- Does not generate the briefs themselves. The orchestrator constructs the briefs from the planning thread; this skill is the workflow around dispatch, not a brief-generator.
- Does not infer commit authority from mid-thread analysis or from completing a wave. When authorized, follow the project's commit timing and branch rules.

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
- `dispatch-wave` — canonical worked example and its source provenance; do not relabel its historical commit as a consumer commit.
