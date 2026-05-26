# blueprint-redesign

**Repo role: I am a Blueprint consumer initiative, hosted as a worktree of the methodology repo on the `dogfood/self-redesign` orphan branch.** The methodology source lives on `main` at `~/Workspace/dev/wip/blueprint/` — same git remote, different branch, different worktree path. Verify `git branch --show-current` returns `dogfood/self-redesign` before any commit; if it returns `main`, stop and switch worktrees (`cd ~/Workspace/dev/wip/blueprint`). The `pwd` check from the pre-conversion shape is now redundant because the worktree path (`wip/blueprint-redesign/`) and the main checkout path (`wip/blueprint/`) are git-tracked siblings — `git rev-parse --git-common-dir` resolves the same parent for both.

Blueprint applied to itself. The current Blueprint methodology on `main` is the **current-state product**; this branch produces the **proposed-state** redesign as a stakeholder-ready Pattern B portal.

This file is a map, not a manual. Canonical methodology lives on `main`.

## Branch shape (orphan, not feature-branch)

`dogfood/self-redesign` is an orphan branch — it has no shared commit history with `main`. The dogfood is a parallel development line, not a feature branch destined for merge. The way the dogfood influences methodology is via `METHODOLOGY-AMENDMENTS.md` → wave commits on `main` (the pattern proven in waves 6 + 7). Trying to merge dogfood content back to main would contaminate main with consumer-specific artifacts.

Push pulls and remote operations share the methodology origin (`github.com:nino-chavez/blueprint`). The branch tracks its own remote (`origin/dogfood/self-redesign`) once first push lands.

## Variant + tier + pattern (declared in `blueprint.yml`)

- **Variant**: `brownfield` — the methodology is live, audit-first work.
- **Tier**: 1 — the portal is the only deliverable for now.
- **Portal pattern**: B (redesign-review portal — current-state vs proposed comparison).

Decision tree references:
- `~/Workspace/dev/wip/blueprint/docs/variant-selection.md`
- `~/Workspace/dev/wip/blueprint/docs/portal-and-tier-ladder.md`

## Canonical context (load these first)

The SessionStart hook at `~/.claude/hooks/blueprint-session-start.py` auto-injects them when installed; the L1 encoding makes this mandatory. If the hook isn't installed in this session, paste the prompt from `~/Workspace/dev/wip/blueprint/docs/prompts/add-blueprint-to-project.md` to load the three canonical docs manually:

1. `~/Workspace/dev/wip/blueprint/METHODOLOGY.md`
2. `~/Workspace/dev/wip/blueprint/docs/variant-selection.md`
3. `~/Workspace/dev/wip/blueprint/docs/portal-and-tier-ladder.md`

## Companion: ai-hive

`~/Workspace/dev/wip/ai-hive/` is the installable multi-agent coordination kit. It is the alignment-layer companion to Blueprint in the four-layer stack:

```
Appleton's Ace     — multiplayer real-time alignment        (general code)
ai-hive            — async blackboard alignment             (initiative scope)
Blueprint          — methodology + scaffolding              (initiative deliverables)
Lopopolo's harness — repo-discipline for agent code         (production codebase)
```

Currently disabled (`hive.enabled: false`) — solo work. The hive CLI vs MCP investigation lives at `research/architecture/01-hive-cli-vs-mcp-with-optionality.md`.

## Stages (brownfield pipeline)

Per `docs/variant-selection.md` § "Brownfield variant":

1. **Targeted Diagnose** — audit current Blueprint (research/current-state/)
2. **Prescription** — what production-quality Blueprint looks like (decisions/)
3. **Design Brief** + optional Prototype (portal/ — Pattern B drawers + comparison toggle)
4. Fact-Check → Docs → Deploy

## Methodology freeze in effect (L8 rule)

While this initiative is in flight, **no edits to `~/Workspace/dev/wip/blueprint/template/`**. The methodology repo and consumer migrations advance sequentially, not in parallel. The reason: the 2026-05-25 four-way root-doc drift was caused by exactly this kind of parallel evolution. See `~/Workspace/dev/wip/blueprint/template/CLAUDE.md` § "Methodology freeze during consumer migration."

If methodology changes are needed mid-redesign, pause this initiative, edit the methodology repo, then resume.
