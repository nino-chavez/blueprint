# Prompt — Pick up Blueprint updates in an initiative already using it

Paste at the start of a session resuming work on a Blueprint initiative (or in a session where Blueprint work is already in flight) to bring the agent's context up to date with methodology changes.

## When to use this prompt

- The initiative was using Blueprint before the 2026-05-25 rename + v3 taxonomy + reviewer agents + I-5 invariant + smoke-runner strengthening landed.
- A new Claude session is resuming work on a Blueprint initiative and you want the methodology layer refreshed before any other work.
- You're not sure which Blueprint updates have been incorporated into a given initiative.

## Auto-injection option (per consumer initiative)

The prompt can be auto-injected via Claude Code's `SessionStart` hook configured in `.claude/settings.json` of the consumer initiative. See the example block at the end of this doc. The auto-injection is **opt-in per initiative** — never global — because not every project under `~/Workspace/dev/` uses Blueprint, and the prompt is noise in non-Blueprint sessions.

## The prompt

```
Blueprint was renamed from BigBlueprint on 2026-05-25. New location:
- GitHub: github.com/nino-chavez/blueprint
- Local: ~/Workspace/dev/wip/blueprint

Read these updates before continuing existing blueprint work — they change
how this initiative operates:

1. ~/Workspace/dev/wip/blueprint/docs/variant-selection.md
   — Three-variant taxonomy (greenfield / midstream / brownfield). If this
   initiative's blueprint.yml doesn't have a `variant:` key yet, add it.
   Default is greenfield; pick the actual variant if different.

2. ~/Workspace/dev/wip/blueprint/template/.claude/agents/blueprint/reviewers/
   — Seven new stage-gate reviewer agents replace the legacy `validator`.
   Variant-aware. They block premature stage completion (e.g., declaring
   Stage 1 complete with empty research/funnel/). Read reviewers/README.md
   for the roster.

3. ~/Workspace/dev/wip/blueprint/template/prototype/DESIGN.md
   §"Architectural Invariants" + §"I-5. JS Class Output ↔ CSS Coverage"
   — Five structural invariants now apply to every prototype. I-5 specifically
   catches the v3 portal CSS-gap failure mode (template ships JS shells
   emitting classes without matching CSS rules).

4. ~/Workspace/dev/wip/blueprint/template/.claude/agents/blueprint/reviewers/prototype-smoke-runner.md
   — Stage 6 ship gate now requires viewport screenshots per page via
   browse-tool AND CSS-coverage check, on top of @smoke Playwright. A 200
   response from curl + green @smoke is no longer enough.

5. Voice rules moved out of per-initiative CLAUDE.md:
   - ~/Workspace/dev/wip/blueprint/docs/voice-template.md (canonical)
   - ~/Workspace/dev/wip/blueprint/docs/voice-b2b-addendum.md (loaded only
     when b2b_edition.enabled: true)

6. Sweep this initiative for stale references: `big-blueprint` → `blueprint`,
   `BigBlueprint` → `Blueprint`, github.com/nino-chavez/big-blueprint →
   github.com/nino-chavez/blueprint. The Blueprint repo and Rally HQ already
   completed this sweep; this initiative may not have. Show the diff before
   committing — working trees may have unrelated WIP.

The first principle that drives all of this: agent struggle is a missing
capability. When you hit a failure that isn't covered by an existing reviewer
/ invariant / sensor / doc, the response is "what capability is missing, and
how do I encode it" — not "patch the prompt."
```

## Optional `SessionStart` hook (per consumer initiative)

If you want auto-injection on every session start in a specific Blueprint initiative, add this to that initiative's `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cat ~/Workspace/dev/wip/blueprint/docs/prompts/pick-up-blueprint-updates.md",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

The hook prints the prompt doc into the session's context window at startup. Claude reads it and applies the updates before acting on the user's first message.

**When to enable:** during the transition window when an initiative is catching up from pre-2026-05-25 Blueprint. Once the initiative is fully aligned with the new methodology, the hook is noise — remove it.

**When NOT to enable:** the Blueprint repo itself (would self-reference), or any non-Blueprint project (the prompt assumes Blueprint context).
