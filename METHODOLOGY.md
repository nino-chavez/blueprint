# the original employer-prefixed name Methodology

Agent-assisted pipeline for product planning, prototyping, and stakeholder alignment

## Overview

the original employer-prefixed name is a jig — a repeatable structure that shapes how an agent assists with product initiatives. The human provides context (screenshots, BRDs, codebase access, competitive intelligence). The agent executes a seven-stage pipeline that produces an interactive prototype, strategic documents, and a deployable stakeholder site.

The methodology integrates three existing tools:
- **Specchain** — agent orchestration patterns and governance principles
- **Forge Signal** — content generation engine with voice taxonomy and quality validation
- **Claude Code** — agent runtime with tool use, codebase analysis, and web research

Extracted from the a commerce-platform pricing & packaging CX initiative (March 2026), where it produced: 11 prototype pages, 4 strategic documents, cross-industry research across 14 platforms, technical feasibility validated against a production Rails codebase, and an embedded AI billing support agent.

## The Pipeline

```
Research → Design Principles → Prototype → Fact-Check → Documents → Deploy → Iterate
```

Each stage feeds the next. The key insight: **the prototype and the documents are built simultaneously, not sequentially.** The prototype tests the design decisions, the documents capture the rationale, and the strategy panels on each prototype page connect the two.

## Stage 1: Research

### What to study

- **Existing product** — screenshots, codebase analysis, data model review. What exists today? What terminology does the product use?
- **Competitors** — direct competitors (same product category) and analogous products (similar billing/pricing/UX patterns in other industries)
- **Cross-industry** — utility billing, telecom, SaaS dashboards — any industry that solved the same problem

### How to organize

```
research/
├── competitive-analysis/
│   ├── direct-competitors.md
│   ├── cross-industry-patterns.md
│   └── saas-comparables.md
├── current-state/
│   └── [analysis of existing product]
└── proposed-changes/
    └── [BRD, requirements, proposals]
```

### Key output

For each pattern found: what it is, who does it, how it maps to your problem, and a concrete recommendation. Organize by pattern category (invoice presentation, plan comparison, usage dashboards, etc.) not by source.

## Stage 2: Design Principles

Before building anything, codify the rules. These prevent the prototype from inventing components, using jargon, or misrepresenting what's buildable.

### The five rules

1. **Match the existing product** — only use components that exist today. Mark anything new as PROPOSED.
2. **Use customer terminology** — audit the existing product for the terms it uses (not what internal teams call things).
3. **Lead with the positive** — savings-first, growth-positive, neutral plan selection.
4. **One action per page** — don't stack competing CTAs or alerts.
5. **Progressive disclosure** — summary first, detail on demand.

### Codify early

Write `prototype/DESIGN.md` before building the first page. Every design decision during prototyping should be checkable against these rules.

### Testing baseline

The prototype is a stakeholder communication tool, but it is still web code that gets deployed to Vercel and clicked through by VPs. Quality should match production-grade work, not throwaway demo-ware. Adopt the workspace-canonical testing baseline (Claude Code skill `test-stack-baseline` at `~/.claude/skills/test-stack-baseline/SKILL.md`) sized for the prototype's scope:

| Category | What to set up day 1 | Why |
|---|---|---|
| **Linting / typing** | eslint + strict `tsc --noEmit` (if TS) as a CI gate | Cheap; catches the "I forgot to import that" class of bug before deploy |
| **Unit** | Vitest, but only for any non-trivial logic — don't unit-test static HTML | Prototypes are mostly UI; unit tests on UI without behavior are noise |
| **E2E** | Playwright happy-path per top-level prototype flow (`@smoke` tag) | Catches "the strategy panel toggle broke" without manual click-through every push |
| **Performance** | Lighthouse-CI on Vercel preview URLs | Stakeholders will judge the prototype's polish by load speed; bad Lighthouse scores undercut credibility |
| **Security** | Gitleaks GH Action + Dependabot | Free; non-negotiable. Prevents leaked API keys in the prototype's `.env`. |

Skip: heavy unit-test suites (UI prototypes don't justify the cost), Snyk/CodeQL, mutation testing, coverage gates.

This belongs in `prototype/DESIGN.md` alongside the five visual rules — engineering rules and visual rules are codified together so the agent doesn't make engineering choices ad-hoc page by page.

## Stage 3: Prototype

### Structure

Each prototype page has three layers:

1. **The merchant experience** — what the customer sees. HTML/CSS matching the existing product's design language.
2. **Strategy panel** (right drawer) — explains the "why" behind each design decision with market research citations. Audience: stakeholders reviewing the prototype.
3. **Current-state panel** (left drawer) — shows screenshots of what exists today for side-by-side comparison. Answers "how is this different from what we have?"

### Navigation

- **Sticky footer nav** — page navigation + drawer toggles. Allows reviewers to move between scenarios and access context without leaving the page.
- **Chat widget** (optional) — AI agent for interactive exploration of the proposed experience.

### Key principle

The prototype is not a design comp. It is a **stakeholder communication tool**. Every page should be self-explanatory to someone who opens it cold — the strategy panel provides the context they need.

### Companion deliverable: Demo Storyboard

When a project grows beyond a single surface (prototype + production app + admin, or N storefronts + back-office), the demo storyboard at `apps/demos/` becomes the index that prevents "where do I click to demo X" from turning into tribal knowledge.

Architecture:
- Static HTML site (no build step) — `index.html` + `app.js` + `styles.css` + `scenarios.json`
- Schema-driven: each scenario lists per-surface status + click-paths + prose guide
- Optional `state.json` overlay from a mechanical capability tracker (e.g., `state-derive`) cross-checks declared status against reality
- Mode toggle — same content serves as **demo script** (presenter-paced) and **how-to guide** (self-serve docs)

The prototype Studio Home links to the deployed demos page via `DemoStoryboardPanel`. Symmetric: the demos page's header nav links back to the prototype harness, traceability matrix, and any other family Pages deploys.

See `template/apps/demos/README.md` for the full setup recipe. Origin: extracted from `subs-initiative` (May 2026) where it answered the multi-surface demo problem across Stencil / Catalyst / custom-headless / BC Admin.

## Stage 4: Fact-Check

Before writing strategic documents, validate every claim against reality:

1. **Screenshot validation** — does the existing product actually work the way you described? Open every screenshot, check every claim.
2. **Codebase validation** — if you have access to the source code, verify what data exists, what APIs are available, what's buildable vs. greenfield.
3. **Data validation** — are the numbers sourced? Is the methodology stated? Can a skeptical reader verify them?

### The credibility rule

If a VP reads your document and opens the product to check one claim, and it's wrong, they stop trusting the rest. Fact-check everything.

## Stage 5: Documents

### The four-document package

| Document | Audience | Purpose |
|----------|----------|---------|
| **Strategy** | Leadership | Why this matters, what to do, when to do it |
| **Technical Feasibility** | Engineering | What exists in the codebase, what's buildable, open questions |
| **Market Research** | Everyone | Evidence behind design decisions, cited sources |
| **Integration Plan** | Engineering | How to build it, phased rollout, cost estimates |

Not every initiative needs all four. But every initiative needs at least the Strategy doc.

### Document quality audit

Before sharing any document, run the four checks:

1. **"So what?" placement** — Is the takeaway in the first sentence, or buried?
2. **Mental math** — Do tables show the conclusion, or require calculation?
3. **Logic gaps** — Does any section contradict another?
4. **Scannable format** — Is context trapped in paragraphs?

### Voice: Internal Strategy

- Short context paragraphs (1-3 sentences) for "why," then structured elements for "what"
- Bullets for lists of facts, tables for data
- Bold labels for scannability
- Options with benefit / trade-off / risk
- Named owners and deadlines on every open question and next step

## Stage 6: Deploy

### Vercel deployment

The prototype directory is Vercel-ready:

```bash
cd prototype
vercel --prod
```

The deployed URL is the primary deliverable. Share one link that gives stakeholders access to: the interactive prototype, the strategic documents (linked from the landing page), and the current-state comparison.

### Quality gates

CI workflows fire on every push (preview deploys included). Per the testing baseline codified in Stage 2:

- `tsc --noEmit` + `eslint` + `npm audit --audit-level=high`
- Vitest unit suite (non-trivial logic only)
- Playwright `@smoke` E2E suite
- Lighthouse-CI against the Vercel preview URL (3-run averaging)
- Gitleaks secret scan

Failing gates block the preview-URL share to stakeholders. The whole point is that the link in Slack works the moment a VP clicks it — no "oh sorry, that's a build error, refresh in a minute."

### Landing page

The `index.html` landing page should show:
- Documents (2-column grid, compact cards)
- Prototype flows (2-column grid, grouped by feature area)
- Coverage summary (headline numbers)
- AI agent note (if applicable)

## Stage 7: Iterate

### Feedback loops

- **Stakeholder feedback on prototype** → update design decisions in strategy panel
- **Engineering feedback on feasibility** → update technical doc + prototype scope
- **Market feedback (Gemini, other AI review)** → audit for copy, IA, and UX issues
- **Codebase validation** → update claims, remove blockers, add new findings

### What to codify

After each iteration, capture what was learned:
- **Design principles** → update DESIGN.md
- **Terminology rules** → update the terminology table
- **Copy patterns** → update the document voice guide
- **Anti-patterns** → document what went wrong and why

## Tools

| Tool | Purpose | Location |
|------|---------|----------|
| **md-to-docs.mjs** | Convert markdown to HTML + Word | `docs/scripts/` |
| **forge-signal** | AI-powered document generation (when blog/thought-leadership voice is wanted) | External tool |
| **a-figma-generator** | Design asset generation from Figma specs | External tool |
| **Vercel** | Prototype deployment | `prototype/vercel.json` |
| **Strategy panel** | Embedded design decision context | `prototype/strategy-panel.js` |
| **Current-state panel** | Screenshot comparison | `prototype/current-state-panel.js` |
| **Chat widget** | AI agent for interactive exploration | `prototype/chat-widget.js` |

## Naming Convention

the original employer-prefixed name follows the commerce platform tooling naming: the platform design system, BigTools, the original employer-prefixed name.

## Cross-Cutting Disciplines

The seven pipeline stages above describe *what to produce*. The following patterns describe *how to maintain the doc + decision surface that accumulates around a long-running initiative*. Apply per activation threshold; don't gold-plate small projects.

| Pattern | Activates when | What it codifies |
|---|---|---|
| [docs/doc-surface-discipline-pattern.md](docs/doc-surface-discipline-pattern.md) | >50 docs + ≥1 pivot | Two-surface model (canonical-present vs decision-lineage), 6-bucket classification, frontmatter convention |
| [docs/register-pattern.md](docs/register-pattern.md) | ≥1 pivot, or peer products to compare against | Immutable append-only registers — `invalidated-paths` (high-value default) + `differentiators` (optional) |
| [docs/tiered-orchestration-pattern.md](docs/tiered-orchestration-pattern.md) | Work > one operator-week + parallel-safe PRs | Orchestrator/Specialist/Implementer/Janitor tiering, wave sequencing, calibration discipline |
| [docs/inventory-as-evidence-pattern.md](docs/inventory-as-evidence-pattern.md) | Cleanup/reorg on >50 items | Read-only walk → classify → file as [Spec] body's evidence |
| [docs/doc-discipline-micro-patterns.md](docs/doc-discipline-micro-patterns.md) | Always (low overhead) | Small disciplines — surface-existing, capture-ambiguity, wrong-copy-is-signal, avoid multi-role templates |

These disciplines emerged from `subs-initiative` (May 2026). When they apply, they belong cross-cutting (not as a pipeline stage) — the pipeline produces the deliverables; the disciplines keep the surface around the deliverables coherent.

## Origin

Extracted from the a commerce-platform pricing & packaging CX initiative (March 2026). The full project is at `~/Workspace/dev/wip/a-pricing-initiative/` with the deployed prototype at `private-demo.example`. Cross-cutting disciplines added May 2026 from `subs-initiative` doc-reorg work.
