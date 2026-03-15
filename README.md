# BigBlueprint

Agent-assisted jig for product planning, prototyping, and stakeholder alignment.

## What This Is

BigBlueprint is a methodology and toolset for running product initiatives with AI assistance. You provide the context — screenshots, BRDs, codebase access, competitive intelligence. The agent does research, builds prototypes, writes strategic documents, validates claims against source code, and iterates based on stakeholder feedback.

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

| Tool | Role in BigBlueprint |
|------|---------------------|
| **Specchain** | Agent orchestration patterns, execution profiles, governance principles |
| **Signal Forge** | Content generation, voice taxonomy, quality validation |
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

### Optional: Add Signal Forge (strategic content generation)

If your initiative needs thought-leadership voice, slide decks, or Signal Forge's full content pipeline:

```bash
# Clone Signal Forge (if not already installed)
git clone git@github.com:nino-chavez/signal-forge.git ~/tools/signal-forge
cd ~/tools/signal-forge && npm install

# Enable in your initiative
# Edit blueprint.yml:
#   signal_forge:
#     enabled: true
#     path: "~/tools/signal-forge"
```

What this gives you: four voice modes (thought-leadership, executive-advisory, solution-architecture, internal-strategy), document quality audit framework, content generation with Ghost Writer → Copywriter → Editor pipeline, and export to Word/PDF/PPTX/HTML.

GitHub: https://github.com/nino-chavez/signal-forge

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

BigBlueprint works standalone. Without Signal Forge, the doc-writer agent uses built-in internal-strategy voice rules. Without Specchain, there's no implementation spec generation — the initiative stays at the strategy/prototype/feasibility level. Both can be added at any point.

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

Full audit framework in Signal Forge: `docs/voice/document-quality-audit.md`

## Voice Modes

Documents map to Signal Forge's content modes:

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

Extracted from the BigCommerce Pricing & Packaging CX initiative (March 2026). That project produced: 11 prototype pages, 4 strategic documents, cross-industry research across 14 platforms, technical feasibility against a production Rails codebase, and an embedded AI billing support agent — all deployed as a single Vercel site.

## Related Tools

- **[Signal Forge](https://github.com/nino-chavez/signal-forge)** — strategic content generation with voice taxonomy
- **Specchain** — spec-driven development with multi-agent orchestration
- **bc-figma-generator** — design asset generation from Figma specs
