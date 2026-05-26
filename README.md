# blueprint-redesign

Blueprint methodology applied to itself. Variant: brownfield. Pattern: B (redesign-review portal). Tier: 1.

**Current-state product**: `~/Workspace/dev/wip/blueprint/` (the live methodology repo).
**Proposed-state product**: a production-quality Blueprint distribution that closes the eight gaps documented in Stage 1.

## Stage 1 — Research (seeded)

Five primary research artifacts, all in `research/`:

| File | What it covers |
|---|---|
| `competitive/01-lopopolo-harness-engineering.md` | OpenAI's "Harness engineering" piece. The methodology peer at the production-codebase layer; source of Blueprint's first principle. |
| `competitive/02-appleton-zero-alignment.md` | Maggie Appleton's "Zero Alignment" / Ace positioning. The alignment-layer pattern above Blueprint. |
| `competitive/03-adjacent-tools.md` | Backstage, Yeoman/CRA/Vite, Cookiecutter, Hygen/Plop, Shape Up, Linear/Jira, GitHub Spec Kit, Cursor/Claude Code. Where Blueprint fits and where it doesn't. |
| `current-state/01-ai-hive-as-companion.md` | How subs-initiative composes Blueprint + ai-hive at Tier 2; the four-layer stack (Ace / ai-hive / Blueprint / Lopopolo's harness). |
| `current-state/02-blueprint-production-quality-gaps.md` | Eight named gaps + each gap's named-pattern closure + the two prescription wedges they collapse into. |
| `architecture/01-hive-cli-vs-mcp-with-optionality.md` | Protocol-choice investigation for ai-hive; recommendation feeds the Blueprint distribution shape. |

## Stage 2 — Prescription (pending)

Two load-bearing prescription wedges + three independent items, per `current-state/02-blueprint-production-quality-gaps.md`:

- **Distribution wedge** — `npx @blueprint/cli init`, semver, hosted reference deploy, interactive scaffold flow.
- **Agent-portability wedge** — executable reviewers callable via CLI + MCP + GitHub Actions.
- Independent items — contract tests in CI; methodology-gardening agent; tracker integration (GitHub Actions first).

## Stage 3 — Prototype (pending)

Pattern B portal at `portal/`. Strategy drawers per route explain "why proposed diverges from current." Current-state drawers show the existing methodology surface for comparison. PROPOSED/COMPARE/SHIPPED toggle flips between states.

The redesign portal **is** the production-quality reference deploy that closes Gap 3 (discoverability). Self-applying.

## Stages 4-6 (pending)

Fact-check → Docs → Deploy (paired Cloudflare Pages: portal stays `noindex`; eventually `blueprint.<tld>` ships as the canonical reference).

## Companion: ai-hive

`hive.enabled: false` for now (solo). When a second operator joins, flip it true and bootstrap a hive instance per `~/Workspace/dev/wip/ai-hive/docs/BOOTSTRAP.md`. The CLI vs MCP investigation feeds back into ai-hive itself as a parallel architecture decision.

## Methodology freeze in effect

Per L8 (`~/Workspace/dev/wip/blueprint/template/CLAUDE.md` § "Methodology freeze during consumer migration"): while this initiative is in flight, **no edits to `~/Workspace/dev/wip/blueprint/template/`**. If methodology changes are needed mid-redesign, pause this initiative, edit the methodology repo, then resume.
