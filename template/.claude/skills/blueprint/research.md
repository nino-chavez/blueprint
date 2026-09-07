---
name: blueprint-research
description: Research or Diagnose work for a Blueprint initiative. Produces current-state evidence, competitive analysis, and comparables. Runs comprehensive product experience audits within the existing brownfield stages.
---

# /blueprint-research

Research or Diagnose work for a Blueprint initiative. Follow the selected variant's stage and output contracts.

## When to use
At the start of an initiative, or when new competitive/market context is needed.

## Product experience audit

When the request concerns the usability, workflows, IA, interaction, visual
quality, or art direction of an existing product, first load
`$BLUEPRINT_HOME/template/docs/methodology/product-experience-audit.md`.
An audit-first initiative uses the existing `brownfield` variant. A scoped audit
within a midstream initiative keeps that initiative's lifecycle.

Use that procedure as the controlling sequence. Perform the applicable general
research steps below where it places them. It owns live capture, role
simulation, review isolation, coverage, and staged assignments.
Preserve the cold review before consulting code, prior verdicts, or competitor
designs. Where this session already has that context, use a fresh reviewer for
the blind portion and disclose any isolation limit.

For brownfield, write current-state evidence to `research/current-state/`, roles
to `research/personas/`, journey analysis to `research/funnel/`, and comparisons
to `research/competitive/`. `01-diagnose.md` at the initiative root cites all
four. Stage 1 ends with named gaps; remedies go to `02-prescription.yml` and
design direction to `03-design-brief.md` in the following stages. This skill is
the entry point; it does not create an additional audit phase or claim that a
mechanical reviewer has performed the observed reviews.

## What it does

1. **Current-state analysis** — If `research.screenshots_path` is set in blueprint.yml, read all screenshots and document what exists today: components, terminology, data displayed, navigation patterns, gaps.

2. **Codebase exploration** — If `research.codebase_path` is set, explore the production repo to assess:
   - What data is available for the proposed features
   - What models, controllers, and services exist
   - What integration points are available (APIs, databases, external services)
   - What UI patterns and CSS frameworks are in use
   Save findings to `research/current-state/codebase-analysis.md`.

3. **Competitive analysis** — For each competitor listed in `research.competitors`, cover the **five research dimensions** from `$BLUEPRINT_HOME/docs/case-studies/design-system-audit.md` (R-1 through R-5):
   - **R-1 IA + dynamic-surface mechanics** — default-view logic, freshness contract, filter/sort affordances above the fold, scale budget, server-side filter/sort (per ux-ui-auditor Phase 8)
   - **R-2 Voice + microcopy** — imperative vs declarative; chrome vs framing; empty-state voice; CTA labels (audit actual UI copy, not marketing)
   - **R-3 Visual language** — palette anchors, type families + display/body split, density, elevation strategy, border strategy
   - **R-4 Motion + micro-interaction** — hover/focus treatment, page transitions, optimistic UI, loading-state pattern (skeleton vs spinner)
   - **R-5 Onboarding / first-60-seconds** — empty canvas vs starter-kit; guided tour vs jump-into-product; where the IA reveals itself
   Document specific patterns with screenshots or descriptions; note what they do well and what they do poorly. If `blueprint.yml prototype.design_system: custom`, all five dimensions are mandatory.
   For brownfield, save to `research/competitive/`; for other variants, honor their declared research directories. Preserve and link existing `research/competitive-analysis/` material rather than duplicating it. Link visual/voice/motion observations from the synthesis; a separate `research/visual-voice-motion-research.md` is optional.

4. **Analogous industry research** — For each industry in `research.analogous_industries`:
   - Search for how that industry solves the same problem
   - Look for call deflection / self-service resolution benchmarks
   - Find regulatory precedent if applicable
   Save beside the competitive analysis in the variant's research directory.

5. **Pattern synthesis** — Compile all research into a comparables doc:
   - Organize by pattern category (not by source)
   - For each pattern: what it is, who does it, how it maps, and the evidence for that interpretation
   - Keep brownfield adopt/reject decisions and remedies in the following prescription; other variants follow their synthesis contract
   For brownfield, synthesize in `01-diagnose.md` with explicit references to all four research legs. Keep proposed remedies in the subsequent prescription. For other variants, use `docs/content/research-comparables.md` or their declared synthesizing artifact.

## Output files
- `research/current-state/` — screenshots analysis, codebase findings
- `research/competitive/` — brownfield per-competitor and per-industry analysis; other variants follow their declared directories
- `research/personas/` and `research/funnel/` — brownfield roles/jobs and observed journeys
- `01-diagnose.md` — brownfield diagnosis citing all four research legs
- `docs/content/research-comparables.md` — comparables synthesis for variants using this document shape

## Specchain integration

If `specchain.enabled` is true in blueprint.yml:
- Use specchain's `project-discovery` pattern for codebase exploration (four-pass protocol: structure → patterns → data flow → integration points)
- Governance principles from `specchain/governance/principles.md` apply to how findings are reported (scope minimization, traceability, boundary validation)
- In squad mode, parallelize independent research. For experience audits, follow the protocol's capture-before-review order, fresh cold context, and shared-state ownership.
- Write findings to STATE.md for session persistence across conversations

If specchain is not available, use the host's supported tools directly. Parallelism is optional; record any inability to obtain a fresh blind review rather than silently substituting an informed one.

## Quality checks
- Every claim cites a source (URL, screenshot reference, or code path)
- Patterns are organized by category, not by source
- Each pattern has evidence and a clear interpretation. Brownfield recommendations belong in the subsequent prescription.
- **R-1 through R-5 each have at least one per-anchor finding** (per `$BLUEPRINT_HOME/docs/case-studies/design-system-audit.md`). A research pass that covers IA + behavior (R-1, R-2) but skips visual/motion/onboarding (R-3, R-4, R-5) is incomplete when `prototype.design_system: custom`.
- The synthesis identifies cross-cutting patterns and what is distinctive to one anchor. Brownfield diagnosis ends with named gaps; Design Principles and selected direction belong in the subsequent design work.

## Output discipline

Research is the widest read surface in the pipeline — screenshots, codebases, competitors, the web. What each research agent (and this skill) returns is the **synthesis, not the corpus**: claims and patterns organized by category, every load-bearing claim carrying a `file:line` / URL / screenshot pointer, sized to the conclusion. Handing back raw file contents or untrimmed tool output makes the orchestrator re-read what the agent already read — the read fan-out only pays off if the finding, not the input, crosses back. Canonical rule + tier dial: `$BLUEPRINT_HOME/template/docs/methodology/agent-output-discipline-pattern.md`.
