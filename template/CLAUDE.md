# the original employer-prefixed name Project

Agent-assisted jig for product planning, prototyping, and stakeholder alignment. See `blueprint.yml` for project configuration.

## Pipeline

```
/blueprint-research → /blueprint-prototype → /blueprint-docs → /blueprint-validate → /blueprint-deploy
```

Each stage has a skill definition in `.claude/skills/blueprint/` and uses agents defined in `.claude/agents/blueprint/`.

## Skills

| Command | Stage | What it does |
|---------|-------|-------------|
| `/blueprint-research` | Research | Codebase exploration, competitive analysis, market comparables |
| `/blueprint-prototype` | Prototype | Build HTML pages, strategy panels, current-state panels, landing page |
| `/blueprint-docs` | Documents | Generate strategy, feasibility, research, integration docs |
| `/blueprint-validate` | Validate | Fact-check against screenshots/code, audit quality, check consistency |
| `/blueprint-deploy` | Deploy | Package and deploy to Vercel |

## Agents

| Agent | Role |
|-------|------|
| `researcher` | Codebase exploration, screenshot analysis, web research, market benchmarks |
| `prototype-builder` | HTML/CSS pages matching existing product, strategy/current-state panel config |
| `doc-writer` | Strategic documents in internal-strategy voice with quality audit |
| `validator` | Fact-checking, quality audit, cross-document consistency |

## Document Voice: Internal Strategy

- "So what?" in the first sentence of every section
- Short context paragraphs (1-3 sentences), then bullets/tables for facts
- Bold labels for scannability
- Named owners and deadlines on every open question

### Quality Audit (before sharing)

1. Is the takeaway in the first sentence, or buried?
2. Do data presentations require mental math?
3. Does any section contradict another?
4. Is context in scannable format?

### Anti-Patterns

1. **Blog voice** — no narrative arcs, no provisional hedging
2. **Book prose** — no burying lists in sentences
3. **Slide-as-doc** — if content needs tables, use document format
4. **Duplicate content** — cross-reference other docs, don't repeat

## Prototype Design

See `prototype/DESIGN.md`. Key rules:
- Match existing product design language
- Mark new components as PROPOSED
- Customer terminology (check the product for actual labels)
- Savings-first framing
- One primary CTA per page
- Progressive disclosure

## Configuration

Edit `blueprint.yml` for: execution depth, voice modes, prototype settings, research scope, document package.

## Converter

`node docs/scripts/md-to-docs.mjs docs/content/my-doc.md --out docs/deliverables/`
