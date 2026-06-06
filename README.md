# Blueprint

**Run a product initiative end-to-end, agent-assisted** — research, prototype, strategy docs, fact-check, deploy. You bring the context (screenshots, BRDs, codebase, competitive intel); an AI agent runs the pipeline and ships one portal that serves leadership, engineering, and everyone.

[![npm](https://img.shields.io/npm/v/@nino-chavez-labs/blueprint-cli?color=2563eb&label=npm)](https://www.npmjs.com/package/@nino-chavez-labs/blueprint-cli) · MIT · [Live demo →](https://blueprint-platform.pages.dev)

```bash
npx @nino-chavez-labs/blueprint-cli init
```

## Quickstart

```bash
# 1. Scaffold a new initiative + its portal (validated against the variant × tier matrix)
npx @nino-chavez-labs/blueprint-cli init --pattern=A --target=my-initiative

# 2. Configure blueprint.yml — set variant (greenfield|midstream|brownfield), tier (0–2),
#    and portal_pattern (A|B). Then run the pipeline in Claude Code:
#    /blueprint-research → /blueprint-prototype → /blueprint-docs → /blueprint-validate → /blueprint-deploy

# 3. Push to deploy your portal, then verify conformance
npx @nino-chavez-labs/blueprint-cli doctor
```

Seven commands, all real: `init` · `review` · `cost` · `fleet` · `upgrade` · `doctor` · `hive`. Pull non-breaking updates with `blueprint upgrade`; file fixes and requests upstream via [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

A note on the name: originally **the original employer-prefixed name** (extracted from a the commerce platform CX initiative, March 2026); renamed **Blueprint** on 2026-05-25 once it proved general-purpose. The methodology never required a vertical.

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

## Command-line interface — `@nino-chavez-labs/blueprint-cli`

Blueprint ships a thin, dependency-free CLI that operationalizes the methodology
as a team-adoptable, portable platform (scope ceiling A — methodology-native: no
hosted server; everything runs on the git host + npm + local files). The
methodology home is resolved automatically (`$BLUEPRINT_HOME` → a consumer's
`blueprint.yml methodology_home` → the CLI's own installed package → local dev
paths), so an `npm install` user gets a working CLI with zero config.

```bash
# scaffold a new initiative's portal (Pattern A platform-portal or B redesign-review)
npx @nino-chavez-labs/blueprint-cli init --pattern=A --target=my-initiative

blueprint review <name> [--target=<dir>] [--json]   # run an executable reviewer (ADR-0002);
blueprint review --list                              #   discovers canonical + org reviewers (ADR-0006)
blueprint cost   [--target=<dir>] [--json]           # per-stage effort/model config + telemetry (ADR-0003)
blueprint fleet  [--json] [--strict]                 # classify each consumer's drift from consumers.yml (ADR-0005)
blueprint upgrade [--target=<dir>] [--apply]         # preview/apply a consumer's methodology pin bump (ADR-0005);
                  [--ack-untagged] [--require-pin]    #   dry-run by default (terraform-plan style)
blueprint doctor [--target=<dir>] [--json]           # conformance/health — loads the config + every reviewer
                                                     #   + runs portal conformance (the false-green guard)
```

Each command is a thin front door over a dependency-free, self-tested lib under
`template/tools/lib/` (`cost-dial`, `telemetry`, `consumers-registry`, `upgrade`,
`reviewer-registry`, `doctor`). Reviewers are paired `.md` spec + `.mjs`
executable (`template/.claude/agents/blueprint/reviewers/`); a department adds its
own without forking by dropping `.mjs` files in `.blueprint/reviewers/` or
publishing a `blueprint-reviewer-*` npm package — the `review()` signature is the
whole interface. Distribution + governance: a `consumers.yml` registry, a
`CONTRIBUTING.md` (Rust-RFC-lite) + amendment/RFC issue form + triage classifier,
`CODEOWNERS` + a committed `main` ruleset (`docs/governance/`).

> Status: **published** — `@nino-chavez-labs/blueprint-cli@0.1.0` is live on npm.
> `npx @nino-chavez-labs/blueprint-cli <command>` works for anyone; all seven
> commands (`init`/`review`/`cost`/`fleet`/`upgrade`/`doctor`/`hive`) are real.

## This repo is its own first consumer (the reference portal)

Blueprint applies its own methodology to itself. The productization pass — turning
Blueprint from a single-operator workflow into a team-adoptable platform — was run
*as a Blueprint initiative*, in this repo, and its evidence lives at the root:

- **`blueprint.yml`** — the self-application config (`variant: brownfield`, `tier: 2`,
  `portal_pattern: A`). The methodology working on itself.
- **`apps/portal/`** — the **reference-implementation Pattern A portal**: a live demo
  of what a Blueprint portal looks like, *and* the onboarding knowledge base for new
  consumers (discover → try → build → operate → inspect → roadmap).
- **`research/`, `decisions/`** — the recon synthesis, canonical research, charter, and
  prescription that drove the productization. The promoted ADRs are canon at
  [`docs/decisions/ADR-0003..0007`](docs/decisions/); the methodology's own decision
  record renders in the portal's *inspect* surface.
- **`tools/archaeology/`** — an event-sourced provenance substrate over the whole
  productization history (sessions, ADRs, git, memory) — "what did we know on date T,
  why X, who decided Z." See `docs/archaeology-substrate-pattern.md`.
- **`START-HERE.md`** — the team on-ramp.

The boundary that keeps the methodology reusable is a **directory boundary, not a repo
boundary**: external consumers only ever stamp from `template/` (the stamper reads
nothing outside it). The root is Blueprint-applied-to-itself; `template/` is the clean
substrate everyone else pulls. See `CLAUDE.md` for the invariant.

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
| [docs/prompts/add-blueprint-to-project.md](docs/prompts/add-blueprint-to-project.md) | Adopting Blueprint in a project that doesn't yet use it | Paste-ready prompt for a fresh Claude Code session. Manual invocation only — adoption is a human decision, not a default. |
| [docs/prompts/pick-up-blueprint-updates.md](docs/prompts/pick-up-blueprint-updates.md) | Resuming a Blueprint initiative across the 2026-05-25 rename + v3 taxonomy + reviewer-agents threshold | Paste-ready prompt + optional `SessionStart` hook recipe for auto-injection per initiative. Removes drift between when an initiative was last touched and current methodology state. |

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
| [docs/portal-and-tier-ladder.md](docs/portal-and-tier-ladder.md) | Every initiative that needs to externalize itself to an audience (stakeholders, hiring managers, peer reviewers) | Two canonical portal patterns: **Pattern A** (platform-portal — subs-initiative Astro shape, 6-verb IA + audience switcher, consumes `@blueprint/ui` + `@blueprint/design-tokens`) and **Pattern B** (redesign-review-portal — rally-hq/ninochavez.co static-HTML shape, strategy + current-state drawers + PROPOSED/COMPARE/SHIPPED toggle + chat FAB, copy-stamped from `template/portal/`). Three-tier ladder applies independently to each pattern. Decision tree for choosing A vs B — plus a bespoke-with-ADR escape for archetypes that fit neither (e.g. an operator-facing process console; candidate Pattern C, not yet canonized). Migration recipe for path-drifted projects. Enforced by `portal-pattern-a-conformance-reviewer` and `portal-pattern-b-conformance-reviewer`. |

**Companion template artifacts** (in `template/` — get stamped into new projects):
- `template/docs/invalidated-paths.md` — register skeleton (high-value default for any project with pivots)
- `template/docs/differentiators.md` — register skeleton (optional, project-dependent)
- `template/tools/frontmatter-lint/` — Node validator + CI workflow scaffold for the `canonical: true|false` convention
- `template/STATE.md` (refactored) — tiered guidance for solo / Hive-enabled / state-derive-enabled projects, prevents the multi-role drift the subs-initiative retrofit hit

**Origin:** Methodology patterns distilled from `subs-initiative` doc-reorg session (Hive #929, May 2026). That session is the canonical worked example.
