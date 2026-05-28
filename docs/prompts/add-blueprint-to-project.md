# Prompt — Add Blueprint to an existing project

Paste at the start of a fresh Claude Code session, in the target project's working directory. Designed for **manual invocation**, not auto-injection: the decision to adopt Blueprint is a human decision, and the prompt operationalizes that decision.

## When to use this prompt

- An existing live project is adopting Blueprint for the first time to do a full redesign or audit-driven product evolution.
- The SessionStart auto-loader hook (`template/.claude/hooks/blueprint-session-start.py`) is not yet installed in the operator's `~/.claude/settings.json` — the prompt is the manual fallback that forces canonical-doc reading before the agent reasons about methodology.
- The default pattern-match this prompt encodes: **brownfield variant + Pattern B (redesign-review-portal) + Tier 1**. If the project is actually greenfield (no live product yet), the prompt tells the agent to flag the mismatch back to the operator before scaffolding.

## Prerequisites

- Filesystem access to `~/Workspace/dev/tools/blueprint` (or a cloned copy of `github.com/nino-chavez/blueprint`).
- `browse-tool` installed if the project will need Stage 0 browser sensing (most redesigns do — current-state screenshots are evidence).

## The prompt

```
I'm adopting Blueprint methodology for a full redesign of this existing project.
The canonical Blueprint repo is at ~/Workspace/dev/tools/blueprint. The SessionStart
auto-loader hook is NOT installed for this session, so you load canonical context
manually before reasoning about anything.

STEP 1 — Read these three docs in order. Do not skip and do not skim:
  1. ~/Workspace/dev/tools/blueprint/METHODOLOGY.md
     (focus on § "First Principle" and § "Variant Selection")
  2. ~/Workspace/dev/tools/blueprint/docs/variant-selection.md
     (decision tree + worked examples)
  3. ~/Workspace/dev/tools/blueprint/docs/portal-and-tier-ladder.md
     (Variant × Tier matrix near the top, Pattern A vs B decision tree,
      Pattern B drawer contract)

STEP 2 — Pattern-match this initiative against the canonical docs. Do not
propose methodology changes; the methodology is settled. The expected match
for "existing live product + full redesign":

  - Variant: BROWNFIELD. "Greenfield" in Blueprint means the product itself
    is new; here the redesigned product will be new-looking but the work
    references the existing product for current-state comparison. Per
    variant-selection.md Q1 (product live? yes) + Q3 (audit + prescribe +
    prototype the new state? yes), the canonical match is brownfield.
    Worked example: website-nc-v3.

  - Portal pattern: B (redesign-review-portal). Per portal-and-tier-ladder.md
    decision tree: a brownfield audit/redesign with current-state vs proposed
    comparison wants Pattern B's four primitives — strategy drawer,
    current-state drawer, PROPOSED/COMPARE/SHIPPED toggle, AI chat FAB.

  - Tier: 1 (per the Variant × Tier matrix; brownfield's default). Tier 2
    only once a real new product surface ships alongside the portal.

  Report your pattern-match back to me before scaffolding. If you reach a
  different conclusion from the canonical docs, state which doc + which
  step in its decision tree led you there.

STEP 3 — After I confirm, scaffold. Ask me first whether the blueprint
surface lives at `blueprint/` (subdirectory; the redesign sits alongside
the existing product) or at the repo root (the redesign replaces the project
entirely — bc-subscriptions did this). Then:

  - Copy ~/Workspace/dev/tools/blueprint/template/portal/ into the chosen
    location. Pattern B has no stamper yet (per the 2026-05-25 deferred-L5
    decision); copy-stamp by hand. The portal-pattern-b-conformance-reviewer
    catches drift mechanically at Stage 3, not at scaffold time.

  - Write blueprint.yml with:
        variant: brownfield
        tier: 1
        portal_pattern: B
        project:
          name: "<project-slug>"
          description: "<one-line tagline>"

  - Create (or update) the per-project CLAUDE.md as a *map*, not a manual:
    point at ~/Workspace/dev/tools/blueprint/template/CLAUDE.md as the
    canonical source. Do not inline Stage 0 recipes, voice rules, or
    citation rules — those load on-demand from the Blueprint repo.

  - Surface the SessionStart hook install for the *next* session: copy
    template/.claude/hooks/blueprint-session-start.py to ~/.claude/hooks/
    and merge the SessionStart block from template/.claude/settings.json.example
    into ~/.claude/settings.json. After install, future sessions in this
    project auto-load the three canonical docs.

STEP 4 — Inventory existing artifacts before authoring new ones. Find the
research notes, screenshots, ADRs, current-state docs, and competitive
analysis that already exist in this repo and map them to Blueprint stages.
Reference them from the new structure rather than recreating.

Hard rule: do not skip STEP 1. The 2026-05-25 reconciliation table in
METHODOLOGY.md § "First Principle" exists because three live sessions
reasoned about Blueprint from first principles instead of reading the
canonical docs, then produced three different "what is Blueprint" answers.
The SessionStart hook will enforce read-first automatically once installed.
This prompt is the manual fallback for the first session.
```

## Why no auto-injection

Adoption of a methodology is a decision, not a default. Auto-injecting this prompt would push every Claude Code session that lands in a project to consider Blueprint adoption regardless of fit — adds noise to non-Blueprint work. Manual paste keeps the decision explicit. Once Blueprint is adopted, the `blueprint.yml` becomes the marker that triggers the SessionStart hook's auto-loader, and the read-first discipline becomes automatic without further paste-prompts.

## When the pattern-match is different

This prompt encodes the most common case: an existing project doing a full redesign. Two adjacent cases the prompt tells the agent to flag rather than force:

- **The project is actually greenfield** (no live product at all). The agent should pattern-match to greenfield + Pattern A or B (pick by audience shape, per `docs/portal-and-tier-ladder.md`) and report the mismatch before scaffolding.
- **Active in-flight feature work, not a full redesign**. That's midstream variant, not brownfield. The agent should pattern-match to midstream + the pattern that fits the audience shape and report the mismatch.

In both cases the canonical docs (variant-selection.md + portal-and-tier-ladder.md) carry the decision; this prompt's role is to force them to be read first, not to make the decision unilaterally.
