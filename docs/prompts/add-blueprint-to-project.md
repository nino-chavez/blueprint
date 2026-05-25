# Prompt — Add Blueprint to an existing project

Paste at the start of a fresh Claude Code session, in the target project's working directory. Designed for **manual invocation**, not auto-injection: the decision to adopt Blueprint is a human decision, and the prompt operationalizes that decision.

## When to use this prompt

- A project does not yet use Blueprint but is taking on initiative-scoped work (prototype, strategy doc, audit, redesign brief) that would benefit from the methodology.
- You're starting fresh and want the agent to scaffold the blueprint subdirectory correctly the first time.

## Prerequisites

- Filesystem access to `~/Workspace/dev/wip/blueprint` (or a cloned copy of `github.com/nino-chavez/blueprint`).
- `browse-tool` installed if the project will need Stage 0 browser sensing (most do).

## The prompt

```
This project is adopting the Blueprint methodology (https://github.com/nino-chavez/blueprint,
local: ~/Workspace/dev/wip/blueprint).

Before doing any work:
1. Read ~/Workspace/dev/wip/blueprint/docs/variant-selection.md and pick the
   right variant for this project — greenfield (new product, no prod surfaces),
   midstream (active in-flight product, prototype revises in-flight work), or
   brownfield (mature product, audit-first). The wrong variant produces
   retrofit feel that cannot be un-retrofitted without restart.
2. Read ~/Workspace/dev/wip/blueprint/METHODOLOGY.md sections "First Principle"
   and "Variant Selection" only — the rest is greenfield-specific and you'll
   resolve it per-variant.
3. Read ~/Workspace/dev/wip/blueprint/template/CLAUDE.md as the map of what's
   available (skills, agents, reviewer gates, optional capabilities).

Then scaffold: copy ~/Workspace/dev/wip/blueprint/template/ into this project's
blueprint/ subdirectory, edit blueprint.yml to declare `variant:`, fill the
project block, flip the optional-capability flags this project actually needs.

Do NOT inline the Stage 0 recipe, voice rules, citation rules, or B2B addendum
into the per-project CLAUDE.md — those are loaded on-demand from blueprint/docs/
when the agent actually needs them. The per-project CLAUDE.md is a map, not a
manual.

If the project already has work in progress, identify which existing artifacts
map to which Blueprint stages (don't recreate them) before deciding what new
artifacts to author.

Pause after step 1 and confirm the variant with me before scaffolding —
everything else depends on it.
```

## Why no auto-injection

Adoption of a methodology is a decision, not a default. Auto-injecting this prompt would push every Claude Code session that lands in a project to consider Blueprint adoption regardless of fit — adds noise to non-Blueprint work. Manual paste keeps the decision explicit.
