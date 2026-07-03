# Blueprint

**Run a product initiative end-to-end, agent-assisted** — research feeds the strategy documents (business- and product-requirements class — BRD/PRD), the docs plan the prototype, the prototype validates the plan, and the fact-checked package hands off to build. You bring the context (screenshots, existing requirements, codebase, competitive intel); an AI agent runs the pipeline and ships one portal that serves leadership, engineering, and everyone.

[![npm](https://img.shields.io/npm/v/@nino-chavez-labs/blueprint-cli?color=2563eb&label=npm)](https://www.npmjs.com/package/@nino-chavez-labs/blueprint-cli) · MIT · [Live demo →](https://blueprint.ninochavez.co)

```bash
npx @nino-chavez-labs/blueprint-cli init --name=my-initiative
```

## Quickstart

```bash
# 1. Scaffold a new initiative + its portal. --name is the only required flag;
#    variant/tier/pattern default (greenfield/1/A) and are validated at scaffold time
#    (docs/variant-selection.md + docs/portal-and-tier-ladder.md). Defaults are echoed back.
npx @nino-chavez-labs/blueprint-cli init --name=my-initiative

# 2. Configure blueprint.yml — set variant (greenfield|midstream|brownfield), tier (0–2),
#    and portal_pattern (A|B). Then run the pipeline in Claude Code:
#    /blueprint-research → /blueprint-prototype → /blueprint-validate → /blueprint-docs → /blueprint-deploy

# 3. Push to deploy your portal, then verify conformance
npx @nino-chavez-labs/blueprint-cli doctor
```

Seven commands, all real: `init` · `review` · `cost` · `fleet` · `upgrade` · `doctor` · `hive`. (`fleet` reports how far each project running Blueprint has fallen behind the current methodology; `hive` sets up multi-agent coordination — see the Hive note below.) Pull non-breaking updates with `blueprint upgrade`; file fixes and requests upstream via [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

A note on the name: originally carried an employer-prefixed name (extracted from a commerce-platform CX initiative, March 2026); renamed **Blueprint** on 2026-05-25 once it proved general-purpose. The methodology never required a vertical.

## Evaluating Blueprint for your team?

The five-minute path (formerly `START-HERE.md`):

- **See it running first**: [blueprint.ninochavez.co](https://blueprint.ninochavez.co) is Blueprint applied to *itself* — the same shape of portal it generates for any initiative, so it doubles as "here's what the output looks like." Worth clicking: **discover** (what it is), **roadmap** (the build, end-to-end), **inspect** (the ADRs + research behind every choice).
- **Blueprint vs Hive — two parts, on purpose**: Blueprint (this repo) is the planning/prototyping methodology + toolchain; **Hive** lets several agents — or several people's agents — work the same initiative in parallel without colliding (separate repo, separately maintained; the pattern: [`docs/patterns/hive-coordination-pattern.md`](docs/patterns/hive-coordination-pattern.md)). Blueprint *plans*; Hive *coordinates*. Companions, integrated, not merged.
- **Try it**: the [Quickstart](#quickstart) above — nothing to install to explore; the CLI is live on npm.
- **Go deeper**: [`decisions/00-charter.md`](decisions/00-charter.md) (the why + the six tracks), [`decisions/01-prescription.md`](decisions/01-prescription.md) (what shipped, the build order).
- Want a 20-minute walkthrough for the team, or to be a pilot? Open an issue on this repo.

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

The pipeline runs Stage 0 (application legibility — the agent can drive the running app) plus seven stages whose outputs feed each other ([METHODOLOGY.md](METHODOLOGY.md) is the canonical description; this is the sketch):

1. **Research** — competitive analysis, codebase exploration, market comparables
2. **Design Principles** — codify what the prototype can/can't do before building
3. **Prototype** — HTML pages matching the existing product's design language
4. **Fact-Check** — validate every claim against screenshots and source code
5. **Documents** — the BRD/PRD-class strategy package: strategy, feasibility, research, integration plans
6. **Deploy** — a deployable stakeholder site (Vercel or Cloudflare Pages) with docs + prototype + AI chat
7. **Iterate** — stakeholder feedback, AI review, copy/IA audit

Two key loops: **prototype and documents are built simultaneously** (the prototype tests the decisions the documents record), and the fact-checked package **hands off to build/implementation** — research feeds the docs, the docs plan the prototype, the prototype validates the plan.

## Built On

| Tool | Role in Blueprint |
|------|---------------------|
| **Specchain** | Agent orchestration patterns, execution profiles, governance principles |
| **Forge Signal** | Content generation, voice taxonomy, quality validation |
| **Claude Code** | Agent runtime, tool use, codebase analysis |
| **Vercel** | Prototype deployment |

## Project Structure

What `init --pattern=A` actually generates today:

```
my-initiative/
├── blueprint.yml                  # Variant, tier, portal type, capability flags
├── package.json                   # Workspace root
├── apps/
│   └── portal/                    # The Astro stakeholder portal (Initiative Portal)
├── packages/                      # @<name>/ui, design tokens (workspace pkgs)
└── portal/                        # Static-HTML shell (Review Portal surface)
```

The initiative then grows `research/`, `docs/content/`, `decisions/`, and (per
variant) `prototype/` as the stages run — the evidence column the methodology
exists to produce. Review Portal initiatives stamp via
`stamp.mjs --mode=stamp --pattern=B` or copy `template/portal/`.

## Command-line interface — `@nino-chavez-labs/blueprint-cli`

Blueprint ships a thin, dependency-free CLI that operationalizes the methodology
as a team-adoptable, portable platform (scope ceiling A — methodology-native: no
hosted server; everything runs on the git host + npm + local files). A
**consumer**, here and in the registry ([`consumers.yml`](consumers.yml)), is a
project that runs Blueprint. The
methodology home is resolved automatically (`$BLUEPRINT_HOME` → a consumer's
`blueprint.yml methodology_home` → the CLI's own installed package → local dev
paths), so an `npm install` user gets a working CLI with zero config.

```bash
# scaffold a new initiative's portal (--name is the only required flag; defaults echoed)
npx @nino-chavez-labs/blueprint-cli init --name=my-initiative

blueprint review <name> [--target=<dir>] [--json]   # run an executable reviewer (ADR-0002);
blueprint review --list                              #   discovers canonical + org reviewers (ADR-0006)
blueprint cost   [--target=<dir>] [--json]           # per-stage effort/model config + telemetry (ADR-0003)
blueprint fleet  [--json] [--strict]                 # how far each consumer has drifted from the current
                                                     #   methodology (registry: consumers.yml, ADR-0005)
blueprint upgrade [--target=<dir>] [--apply]         # preview/apply a bump of a consumer's pinned
                                                     #   methodology version (ADR-0005);
                  [--ack-untagged] [--require-pin]    #   dry-run by default (terraform-plan style)
blueprint doctor [--target=<dir>] [--json]           # conformance/health — loads the config + every reviewer
                                                     #   + runs portal conformance (the false-green guard)
blueprint hive setup --slug=<x> [--execute]          # stand up the team coordination substrate — dry-run
                                                     #   plan by default; --execute provisions (see the Hive note)
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

> Status: **published** — `@nino-chavez-labs/blueprint-cli` is live on npm (`npm view` for the current version; releases ship automatically from main).
> `npx @nino-chavez-labs/blueprint-cli <command>` works for anyone; all seven
> commands (`init`/`review`/`cost`/`fleet`/`upgrade`/`doctor`/`hive`) are real.

## This repo is its own first consumer (the reference portal)

Blueprint applies its own methodology to itself. The productization pass — turning
Blueprint from a single-operator workflow into a team-adoptable platform — was run
*as a Blueprint initiative*, in this repo, and its evidence lives at the root:

- **`blueprint.yml`** — the self-application config (`variant: brownfield`, `tier: 2`,
  `portal_pattern: bespoke` with a divergence ADR at `decisions/02-portal-bespoke-product-site.md`). The methodology working on itself.
- **`apps/portal/`** — the live product site (bespoke pattern): the public demo
  of Blueprint *and* the onboarding knowledge base for new consumers
  (discover → try → build → operate → inspect → roadmap, plus `/learn`).
- **`research/`, `decisions/`** — the recon synthesis, canonical research, charter, and
  prescription that drove the productization. The promoted ADRs are canon at
  [`docs/decisions/ADR-0003..0007`](docs/decisions/); the methodology's own decision
  record renders in the portal's *inspect* surface.
- **`tools/archaeology/`** — an event-sourced provenance substrate over the whole
  productization history (sessions, ADRs, git, memory) — "what did we know on date T,
  why X, who decided Z." See `docs/patterns/archaeology-substrate-pattern.md`.
- **[Evaluating Blueprint for your team?](#evaluating-blueprint-for-your-team)** — the team on-ramp (folded from the former `START-HERE.md`).

The boundary that keeps the methodology reusable is a **directory boundary, not a repo
boundary**: external consumers only ever stamp from `template/` (the stamper reads
nothing outside it). The root is Blueprint-applied-to-itself; `template/` is the clean
substrate everyone else pulls. See `CLAUDE.md` for the invariant.

### Optional: Add Forge Signal (strategic content generation)

If your initiative needs thought-leadership voice, slide decks, or Forge Signal's full content pipeline (recently renamed — the `signal_forge:` config key reflects the prior name and is kept for compatibility):

```bash
# Clone Forge Signal (private repo — request access)
git clone git@github.com:nino-chavez/forge-signal.git ~/tools/forge-signal
cd ~/tools/forge-signal && npm install

# Enable in your initiative
# Edit blueprint.yml:
#   signal_forge:
#     enabled: true
#     path: "~/tools/forge-signal"
```

What this gives you: four voice modes (thought-leadership, executive-advisory, solution-architecture, internal-strategy), document quality audit framework, content generation with Ghost Writer → Copywriter → Editor pipeline, and export to Word/PDF/PPTX/HTML.

### Optional: Add Specchain (implementation specs)

If your initiative needs to produce implementation specs, task breakdowns, or multi-agent development workflows:

```bash
# Clone Specchain (private repo — request access)
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

Every document passes a five-check audit before sharing — "so what?" placement, mental math, logic gaps, scannable format, and a methodology statement for derived data. The owning doc (definitions, failure thresholds, the enforcing reviewer): [`docs/context/voice-template.md`](docs/context/voice-template.md) § Quality audit. The full content-generation framework lives in the Forge Signal toolchain (separate, private repo).

## Voice Modes

Each document type maps to a voice mode (internal-strategy, solution-architecture, research/evidence). The owning doc — the per-type mapping, characteristics, and the `voices:` config that selects them: [`docs/context/voice-template.md`](docs/context/voice-template.md) § When to use which voice.

## Design Principles

Every prototype follows five rules (detailed in `template/prototype/DESIGN.md`; stamped into each initiative as `prototype/DESIGN.md`):

1. **Match the existing product** — only use components that exist today
2. **User terminology** — no internal jargon in user-facing copy
3. **Savings-first framing** — lead with gains, not charges
4. **One primary action per page** — no competing CTAs
5. **Progressive disclosure** — summary first, detail on demand

## Origin

Extracted from a pricing & packaging CX initiative at a commerce platform (March 2026) — real industry work, de-named here because this repo is public. That project produced: 11 prototype pages, 4 strategic documents, cross-industry research across 14 platforms, technical feasibility against a production Rails codebase, and an embedded AI billing support agent — all deployed as a single Vercel site.

## Related Tools

- **Forge Signal** — strategic content generation with voice taxonomy (private)
- **Specchain** — spec-driven development with multi-agent orchestration (private)
- **Figma generator** — design asset generation from Figma specs (private)

## Initiative Context Reference Library

Reusable Stage-1 baseline docs for common initiative targets. Copy the relevant ones into your initiative's `research/current-state/` directory.

Platform-specific context packs (marketplace apps, B2B edition, buyer-portal integration — activated by `b2b_edition.enabled: true`) are **supplied privately per engagement**: they document a specific commerce platform's APIs and are not published in this public repo.

| Doc | When to use | Reference for |
|---|---|---|
| [docs/patterns/hive-coordination-pattern.md](docs/patterns/hive-coordination-pattern.md) | Initiative needs multiple agents working in parallel | When to use Hive, bootstrap sequence, working rules, integration with Blueprint stages |
| [docs/patterns/cloudflare-deployment-pattern.md](docs/patterns/cloudflare-deployment-pattern.md) | Initiative deploys on Cloudflare (Workers, Pages, D1, Workers AI, Vectorize, etc.) | Wrangler config conventions, path-scoped GitHub Actions, secrets, multi-environment, cost envelope |
| [docs/context/browser-legibility.md](docs/context/browser-legibility.md) | Every initiative with a `prototype/` or `portal/` shell (Stage 0) | `browse-tool` as the default browser sensor (~few hundred tokens vs MCP's ~18k), four-trigger escalation rubric to Chrome DevTools MCP, per-worktree bootability via cwd-named profiles |
| [docs/variant-selection.md](docs/variant-selection.md) | Every new initiative — picked at `blueprint.yml` init | Three-variant taxonomy (greenfield / midstream / brownfield), pattern-match decision tree, per-variant stage shapes, required sub-deliverables, reviewer-agent gate mapping. Wrong variant produces retrofit feel that cannot be un-retrofitted without restart. |
| [docs/context/voice-template.md](docs/context/voice-template.md) | Every initiative producing deliverables — loaded on demand by `doc-writer` agent | Canonical voice rules + 5-check document quality audit + citation rules + 7 universal anti-patterns. Carved out of `template/CLAUDE.md` 2026-05-25 so the per-session map stays slim. Enforced by `doc-quality-auditor` + `terminology-linter` reviewers. |
| [docs/context/voice-b2b-addendum.md](docs/context/voice-b2b-addendum.md) | Platform B2B initiatives (`b2b_edition.enabled: true`) only | B2B-specific anti-patterns (8-13), actor-naming rules (Owner/Payer/Beneficiary/Manager/Org Admin), terminology overrides (Buyer not User, Quote not RFQ), platform-fidelity citation requirements |
| [docs/lessons/ground-truth-over-proxy.md](docs/lessons/ground-truth-over-proxy.md) | Running a build wave where a single gate decides "done" (esp. with AI-authored designs) | Six lessons on why representations of a system drift from the system — done-is-a-test-not-a-tag, mocked-dependency false-greens, red-first as discovery, test-the-seam, destructive-ops-from-live-state, generated-plan drift. Pre-build checklist + promotion criteria. |
| [docs/prompts/add-blueprint-to-project.md](docs/prompts/add-blueprint-to-project.md) | Adopting Blueprint in a project that doesn't yet use it | Paste-ready prompt for a fresh Claude Code session. Manual invocation only — adoption is a human decision, not a default. |
| [docs/prompts/pick-up-blueprint-updates.md](docs/prompts/pick-up-blueprint-updates.md) | Resuming a Blueprint initiative across the 2026-05-25 rename + v3 taxonomy + reviewer-agents threshold | Paste-ready prompt + optional `SessionStart` hook recipe for auto-injection per initiative. Removes drift between when an initiative was last touched and current methodology state. |

**How blueprint.yml flags activate these:**
- `b2b_edition.enabled: true` → request the platform B2B context packs (supplied privately per engagement)
- `hive.enabled: true` → use `hive-coordination-pattern.md`
- `cloudflare.enabled: true` → use `cloudflare-deployment-pattern.md` and switch `prototype.deploy_target: cloudflare-pages`

**Origin context:** distilled from real commerce-platform initiatives (a marketplace CX initiative, March 2026; a B2B client engagement, May 2026; the subscriptions initiative, March 2026) plus the platform's open-source buyer-portal repo — de-named here because this repo is public.

## Methodology Reference Library

Cross-cutting disciplines that apply across initiative types. Pull in when the activation threshold for each is met.

| Doc | Activates when | Reference for |
|---|---|---|
| [docs/patterns/doc-surface-discipline-pattern.md](docs/patterns/doc-surface-discipline-pattern.md) | Project has >50 docs and ≥1 major pivot in its history | Two-surface model (canonical-present vs decision-lineage), 6-bucket classification taxonomy, `canonical: true\|false` frontmatter convention, activation thresholds |
| [docs/patterns/register-pattern.md](docs/patterns/register-pattern.md) | Project has ≥1 pivot to capture as invalidated-paths, or peer products to capture as differentiators | Immutable append-only register shape — numbered entries, source citations, supersession via reference. Used by `template/docs/invalidated-paths.md` and `template/docs/differentiators.md` skeletons |
| [docs/patterns/tiered-orchestration-pattern.md](docs/patterns/tiered-orchestration-pattern.md) | Planned work > what one operator can hand-execute in a week; >3 PRs parallel-safe | Orchestrator/Specialist/Implementer/Janitor tiering, wave sequencing, calibration discipline, anchor-don't-punt for forks, memory-as-inoculation for foundational [Spec]s |
| [docs/patterns/inventory-as-evidence-pattern.md](docs/patterns/inventory-as-evidence-pattern.md) | Operator asks for cleanup/reorg/consolidation on a surface with >50 items | Methodology pattern: read-only walk → classify against rubric → surface surprises → present to operator → file as [Spec] body's evidence section |
| [docs/patterns/doc-discipline-micro-patterns.md](docs/patterns/doc-discipline-micro-patterns.md) | Always (small disciplines, low overhead) | Surface-existing-discipline-before-inventing-new; capture-ambiguity-via-secondary-tags; wrong-copy-is-signal; avoid-multi-role-template-files; memory-entries-point-at-proposals; trigger-to-revisit on anchored forks |
| [docs/patterns/clustered-tool-surface-pattern.md](docs/patterns/clustered-tool-surface-pattern.md) | New project decision: how the tooling around the project deploys (Hive dashboard / prototype / demos / traceability) | Unify by **auth profile**, not by vibes. Three modes (unified / clustered / separate) gated on auth cleavage. Companion: `template/apps/tool-shell/` (Vite+React skeleton) and `blueprint.yml` `tool_surface:` schema |
| [docs/portal-and-tier-ladder.md](docs/portal-and-tier-ladder.md) | Every initiative that needs to externalize itself to an audience (stakeholders, hiring managers, peer reviewers) | Two canonical portal types: the **Initiative Portal** (platform-portal — the subscriptions-initiative Astro shape, 6-verb IA + audience switcher, consumes `@blueprint/ui` + `@blueprint/design-tokens`) and the **Review Portal** (redesign-review-portal — rally-hq/ninochavez.co static-HTML shape, strategy + current-state drawers + PROPOSED/COMPARE/SHIPPED toggle + chat FAB, stamped from `template/portal/`). Three-tier ladder applies independently to each type. Decision tree for choosing between them — plus a bespoke-with-ADR escape for archetypes that fit neither (e.g. an operator-facing process console; a third frozen type waits for a second instance of the same archetype). Migration recipe for path-drifted projects. Enforced by `portal-initiative-conformance-reviewer` and `portal-review-conformance-reviewer`. |

**Companion template artifacts** (in `template/` — get stamped into new projects):
- `template/docs/invalidated-paths.md` — register skeleton (high-value default for any project with pivots)
- `template/docs/differentiators.md` — register skeleton (optional, project-dependent)
- `template/tools/frontmatter-lint/` — Node validator + CI workflow scaffold for the `canonical: true|false` convention
- `template/STATE.md` (refactored) — tiered guidance for solo / Hive-enabled / state-derive-enabled projects, prevents the multi-role drift the subscriptions-initiative retrofit hit

**Origin:** Methodology patterns distilled from the subscriptions initiative's doc-reorg session (May 2026). That session is the canonical worked example.
