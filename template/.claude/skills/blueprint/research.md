# /blueprint-research

Research phase of a BigBlueprint initiative. Produces competitive analysis, codebase exploration, and market comparables.

## When to use
At the start of an initiative, or when new competitive/market context is needed.

## What it does

1. **Current-state analysis** — If `research.screenshots_path` is set in blueprint.yml, read all screenshots and document what exists today: components, terminology, data displayed, navigation patterns, gaps.

2. **Codebase exploration** — If `research.codebase_path` is set, explore the production repo to assess:
   - What data is available for the proposed features
   - What models, controllers, and services exist
   - What integration points are available (APIs, databases, external services)
   - What UI patterns and CSS frameworks are in use
   Save findings to `research/current-state/codebase-analysis.md`.

3. **Competitive analysis** — For each competitor listed in `research.competitors`:
   - Search for their billing/pricing/plan management UX
   - Document specific patterns with screenshots or descriptions
   - Note what they do well and what they do poorly
   Save to `research/competitive-analysis/`.

4. **Analogous industry research** — For each industry in `research.analogous_industries`:
   - Search for how that industry solves the same problem
   - Look for call deflection / self-service resolution benchmarks
   - Find regulatory precedent if applicable
   Save to `research/competitive-analysis/`.

5. **Pattern synthesis** — Compile all research into a comparables doc:
   - Organize by pattern category (not by source)
   - For each pattern: what it is, who does it, how it maps, recommendation
   - What to adopt, what to reject, and why
   Save to `docs/content/research-comparables.md`.

## Output files
- `research/current-state/` — screenshots analysis, codebase findings
- `research/competitive-analysis/` — per-competitor and per-industry analysis
- `docs/content/research-comparables.md` — synthesized comparables doc

## Quality checks
- Every claim cites a source (URL, screenshot reference, or code path)
- Patterns are organized by category, not by source
- Each pattern has a concrete "adopt/reject" recommendation
