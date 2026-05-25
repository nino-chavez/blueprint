# Blueprint

Agent-assisted jig for product planning, prototyping, and stakeholder alignment.

## A note on the name

Originally **the original employer-prefixed name** — the "Big" prefix followed the commerce platform tooling conventions (the platform design system, BigTools, the original employer-prefixed name) because the methodology was extracted from a the commerce platform CX initiative in March 2026. Renamed to **Blueprint** on 2026-05-25 once the methodology had proved general-purpose across Rally HQ (tournament management), Signal Dispatch (content platform audit), ninochavez.co v3 (personal portfolio brownfield), TNA (agency portfolio), and the original BC work. The methodology never required a vertical; the rename made that explicit.

## What This Is

Blueprint is a methodology and toolset for running product initiatives with AI assistance. You provide the context — screenshots, BRDs, codebase access, competitive intelligence. The agent does research, builds prototypes, writes strategic documents, validates claims against source code, and iterates based on stakeholder feedback.

The output is a deployable site that serves three audiences simultaneously:
- **Leadership** — strategic documents (CX strategy, roadmap, risk register)
- **Engineering** — technical feasibility (codebase mapping, open questions, integration plans)
- **Everyone** — interactive prototype with embedded design rationale and current-state comparison

## How It Works

```
You provide context → Agent executes the pipeline → Deployable deliverable package
```

The pipeline has seven stages. Each produces artifacts that feed the next:

1. **Research** — competitive analysis, codebase exploration, market comparables
2. **Design Principles** — codify what the prototype can/can't do before building
3. **Prototype** — HTML pages matching the existing product's design language
4. **Fact-Check** — validate every claim against screenshots and source code
5. **Documents** — strategy, feasibility, research, integration plans
6. **Deploy** — Vercel site with docs + prototype + AI chat
7. **Iterate** — stakeholder feedback, AI review, copy/IA audit

The key insight: **prototype and documents are built simultaneously.** The prototype tests design decisions. The documents capture rationale. Strategy panels on each prototype page connect the two.

## Built On

| Tool | Role in Blueprint |
|------|---------------------|
| **Specchain** | Agent orchestration patterns, execution profiles, governance principles |
| **Forge Signal** | Content generation, voice taxonomy, quality validation |
| **Claude Code** | Agent runtime, tool use, codebase analysis |
| **Vercel** | Prototype deployment |

## Project Structure

```
my-initiative/
├── CLAUDE.md                      # Agent instructions for this initiative
├── prototype/                     # Deployable interactive prototype
│   ├── index.html                # Landing page (docs + prototype links)
│   ├── shared.css                # Design system (CSS custom properties)
│   ├── proto-nav.js              # Footer nav with drawer toggles
│   ├── strategy-panel.js         # Right drawer: design decisions + citations
│   ├── current-state-panel.js    # Left drawer: screenshot comparison
│   ├── chat-widget.js            # AI agent (optional)
│   ├── current-state/            # Screenshots of current product
│   ├── DESIGN.md                 # Design principles for this initiative
│   ├── package.json
│   └── vercel.json
├── docs/
│   ├── content/                  # Markdown source files
│   ├── deliverables/             # Generated HTML + Word
│   └── scripts/
│       └── md-to-docs.mjs       # Markdown → HTML + Word converter
└── research/                     # Competitive analysis, market research
```

## Quick Start

```bash
# 1. Create your initiative from the template
cp -r template/ my-initiative/
cd my-initiative/

# 2. Configure
# Edit blueprint.yml — set project name, audience, research scope, execution depth

# 3. Add screenshots of the current product (if available)
# cp ~/screenshots/*.png prototype/current-state/

# 4. Run the pipeline
# The CLAUDE.md provides skills (/blueprint-research, /blueprint-prototype, etc.)
# and agent definitions that an AI assistant can use to execute each stage.
```

### Optional: Add Forge Signal (strategic content generation)

If your initiative needs thought-leadership voice, slide decks, or Forge Signal's full content pipeline:

```bash
# Clone Forge Signal (if not already installed)
git clone git@github.com:nino-chavez/forge-signal.git ~/tools/forge-signal
cd ~/tools/forge-signal && npm install

# Enable in your initiative
# Edit blueprint.yml:
#   signal_forge:
#     enabled: true
#     path: "~/tools/forge-signal"
```

What this gives you: four voice modes (thought-leadership, executive-advisory, solution-architecture, internal-strategy), document quality audit framework, content generation with Ghost Writer → Copywriter → Editor pipeline, and export to Word/PDF/PPTX/HTML.

GitHub: https://github.com/nino-chavez/forge-signal

### Optional: Add Specchain (implementation specs)

If your initiative needs to produce implementation specs, task breakdowns, or multi-agent development workflows:

```bash
# Clone Specchain
git clone git@github.com:nino-chavez/specchain.git ~/tools/specchain
cd ~/tools/specchain && bash setup.sh

# Enable in your initiative
# Edit blueprint.yml:
#   specchain:
#     enabled: true
```

What this gives you: spec-driven development workflow, execution profiles (solo/squad × lean/standard/thorough), 13 specialized agents (planners, implementers, verifiers), governance principles, and STATE.md session tracking.

GitHub: https://github.com/nino-chavez/specchain

### What works without either

Blueprint works standalone. Without Forge Signal, the doc-writer agent uses built-in internal-strategy voice rules. Without Specchain, there's no implementation spec generation — the initiative stays at the strategy/prototype/feasibility level. Both can be added at any point.

## The Three Layers of Every Prototype Page

Each page serves three audiences via three interaction layers:

1. **The experience** — what the user sees. HTML/CSS matching the existing product.
2. **Strategy panel** (right drawer, ▶ in footer) — why each design decision was made, with market research citations. For stakeholders reviewing the prototype.
3. **Current-state panel** (left drawer, ◀ in footer) — screenshots of what exists today, with a "what changes" summary. For anyone asking "how is this different?"

## Document Quality

Every document passes a four-check audit before sharing:

1. **"So what?" placement** — takeaway in the first sentence, not buried
2. **Mental math** — tables show conclusions, don't require calculation
3. **Logic gaps** — no section contradicts another
4. **Scannable format** — context in bullets/tables, not dense paragraphs

Full audit framework in Forge Signal: `docs/voice/document-quality-audit.md`

## Voice Modes

Documents map to Forge Signal's content modes:

| Document type | Voice mode | Characteristics |
|--------------|-----------|----------------|
| Strategy / CX plan | Internal Strategy | "We" voice, scannable, named owners |
| Technical feasibility | Solution Architecture | Precise, code references, open questions |
| Market research | Research / Evidence | Cited sources, pattern → decision mapping |
| Integration plan | Solution Architecture | Ruby/JS examples, phased rollout |

## Design Principles

Every prototype follows five rules (detailed in `prototype/DESIGN.md`):

1. **Match the existing product** — only use components that exist today
2. **User terminology** — no internal jargon in user-facing copy
3. **Savings-first framing** — lead with gains, not charges
4. **One primary action per page** — no competing CTAs
5. **Progressive disclosure** — summary first, detail on demand

## Origin

Extracted from the a commerce-platform pricing & packaging CX initiative (March 2026). That project produced: 11 prototype pages, 4 strategic documents, cross-industry research across 14 platforms, technical feasibility against a production Rails codebase, and an embedded AI billing support agent — all deployed as a single Vercel site.

## Related Tools

- **[Forge Signal](https://github.com/nino-chavez/forge-signal)** — strategic content generation with voice taxonomy
- **Specchain** — spec-driven development with multi-agent orchestration
- **a-figma-generator** — design asset generation from Figma specs

## BC + Cloudflare Reference Library

Reusable Stage-1 baseline docs for common initiative targets. Copy the relevant ones into your initiative's `research/current-state/` directory.

| Doc | When to use | Reference for |
|---|---|---|
| [docs/bc-marketplace-context.md](docs/bc-marketplace-context.md) | Initiative includes a BC marketplace app (admin UI in iframe under `/manage/app/{appId}`) | iframe canvas behavior, install-flow ownership, scope-list source, the platform design system patterns, `an-internal-admin-app` and `an-internal-assistant-app` references |
| [docs/bc-b2b-edition-context.md](docs/bc-b2b-edition-context.md) | Initiative integrates with BC B2B Edition (Companies, Buyers, Quotes, Customer Contracts) | Data model, two-API-host split, Buyer Portal SPA architecture, multi-actor role pattern, ownership boundaries |
| [docs/bc-b2b-buyer-portal-integration.md](docs/bc-b2b-buyer-portal-integration.md) | Initiative embeds the B2B Buyer Portal in any host storefront | Framework-agnostic integration contract (5-step), port table for React/SvelteKit/Solid/Vue/Astro, env vars, troubleshooting |
| [docs/hive-coordination-pattern.md](docs/hive-coordination-pattern.md) | Initiative needs multiple agents working in parallel | When to use Hive, bootstrap sequence, working rules, integration with Blueprint stages |
| [docs/cloudflare-deployment-pattern.md](docs/cloudflare-deployment-pattern.md) | Initiative deploys on Cloudflare (Workers, Pages, D1, Workers AI, Vectorize, etc.) | Wrangler config conventions, path-scoped GitHub Actions, secrets, multi-environment, cost envelope |
| [docs/browser-legibility.md](docs/browser-legibility.md) | Every initiative with a `prototype/` or `portal/` shell (Stage 0) | `browse-tool` as the default browser sensor (~few hundred tokens vs MCP's ~18k), four-trigger escalation rubric to Chrome DevTools MCP, per-worktree bootability via cwd-named profiles |
| [docs/variant-selection.md](docs/variant-selection.md) | Every new initiative — picked at `blueprint.yml` init | Three-variant taxonomy (greenfield / midstream / brownfield), pattern-match decision tree, per-variant stage shapes, required sub-deliverables, reviewer-agent gate mapping. Wrong variant produces retrofit feel that cannot be un-retrofitted without restart. |
| [docs/voice-template.md](docs/voice-template.md) | Every initiative producing deliverables — loaded on demand by `doc-writer` agent | Canonical voice rules + 5-check document quality audit + citation rules + 7 universal anti-patterns. Carved out of `template/CLAUDE.md` 2026-05-25 so the per-session map stays slim. Enforced by `doc-quality-auditor` + `terminology-linter` reviewers. |
| [docs/voice-b2b-addendum.md](docs/voice-b2b-addendum.md) | BC B2B Edition initiatives (`b2b_edition.enabled: true`) only | B2B-specific anti-patterns (8-13), actor-naming rules (Owner/Payer/Beneficiary/Manager/Org Admin), terminology overrides (Buyer not User, Quote not RFQ), platform-fidelity citation requirements |

**How blueprint.yml flags activate these:**
- `b2b_edition.enabled: true` → use both `bc-b2b-edition-context.md` and `bc-b2b-buyer-portal-integration.md`
- `hive.enabled: true` → use `hive-coordination-pattern.md`
- `cloudflare.enabled: true` → use `cloudflare-deployment-pattern.md` and switch `prototype.deploy_target: cloudflare-pages`

**Origin context:**
- Marketplace context distilled from the a marketplace pricing initiative CX initiative (March 2026) and `an-internal-admin-app` / `an-internal-assistant-app` reference apps
- B2B Edition + Buyer Portal docs distilled from a B2B client engagement (May 2026) and the open-source `the platform's open-source buyer portal` repo
- Hive + Cloudflare patterns distilled from `subs-initiative` (March 2026) and a B2B client engagement

## Methodology Reference Library

Cross-cutting disciplines that apply across initiative types. Pull in when the activation threshold for each is met.

| Doc | Activates when | Reference for |
|---|---|---|
| [docs/doc-surface-discipline-pattern.md](docs/doc-surface-discipline-pattern.md) | Project has >50 docs and ≥1 major pivot in its history | Two-surface model (canonical-present vs decision-lineage), 6-bucket classification taxonomy, `canonical: true\|false` frontmatter convention, activation thresholds |
| [docs/register-pattern.md](docs/register-pattern.md) | Project has ≥1 pivot to capture as invalidated-paths, or peer products to capture as differentiators | Immutable append-only register shape — numbered entries, source citations, supersession via reference. Used by `template/docs/invalidated-paths.md` and `template/docs/differentiators.md` skeletons |
| [docs/tiered-orchestration-pattern.md](docs/tiered-orchestration-pattern.md) | Planned work > what one operator can hand-execute in a week; >3 PRs parallel-safe | Orchestrator/Specialist/Implementer/Janitor tiering, wave sequencing, calibration discipline, anchor-don't-punt for forks, memory-as-inoculation for foundational [Spec]s |
| [docs/inventory-as-evidence-pattern.md](docs/inventory-as-evidence-pattern.md) | Operator asks for cleanup/reorg/consolidation on a surface with >50 items | Methodology pattern: read-only walk → classify against rubric → surface surprises → present to operator → file as [Spec] body's evidence section |
| [docs/doc-discipline-micro-patterns.md](docs/doc-discipline-micro-patterns.md) | Always (small disciplines, low overhead) | Surface-existing-discipline-before-inventing-new; capture-ambiguity-via-secondary-tags; wrong-copy-is-signal; avoid-multi-role-template-files; memory-entries-point-at-proposals; trigger-to-revisit on anchored forks |
| [docs/clustered-tool-surface-pattern.md](docs/clustered-tool-surface-pattern.md) | New project decision: how the tooling around the project deploys (Hive dashboard / prototype / demos / traceability) | Unify by **auth profile**, not by vibes. Three modes (unified / clustered / separate) gated on auth cleavage. Companion: `template/apps/tool-shell/` (Vite+React skeleton) and `blueprint.yml` `tool_surface:` schema |

**Companion template artifacts** (in `template/` — get stamped into new projects):
- `template/docs/invalidated-paths.md` — register skeleton (high-value default for any project with pivots)
- `template/docs/differentiators.md` — register skeleton (optional, project-dependent)
- `template/tools/frontmatter-lint/` — Node validator + CI workflow scaffold for the `canonical: true|false` convention
- `template/STATE.md` (refactored) — tiered guidance for solo / Hive-enabled / state-derive-enabled projects, prevents the multi-role drift the subs-initiative retrofit hit

**Origin:** Methodology patterns distilled from `subs-initiative` doc-reorg session (Hive #929, May 2026). That session is the canonical worked example.
