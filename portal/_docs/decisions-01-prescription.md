---
canonical: true
stage: 2
status: ratified
date: 2026-05-25
supersedes: none
informs:
  - ADR-0001-dual-protocol-distribution.md
  - ADR-0002-reviewers-as-executable-plugins.md
---

# Stage 2 Prescription — Production-quality Blueprint v1

What v1 of production-quality Blueprint is, what it isn't, and the order things ship in.

The eight production-quality gaps documented in `research/current-state/02-blueprint-production-quality-gaps.md` collapse into **two prescription wedges + three independent items**. This document ratifies which of those land in v1, which defer to v2, and which are out of scope indefinitely.

## What v1 ships

### Wedge 1 — Distribution shape

**Closes Gaps 1, 2, 7, 9** (filesystem coupling, no versioning, paste-prompt onboarding, Pattern B template-is-rally-hq).

The single artifact: `@blueprint/cli` published to npm. Operator runs `npx @blueprint/cli init` and gets an interactive scaffold flow that:

1. Asks the variant (greenfield / midstream / brownfield) with the canonical decision-tree questions inline.
2. Asks the tier (0 / 1 / 2) validated against the Variant × Tier matrix; rejects blocked combinations.
3. Asks the pattern (A / B) with the decision-tree questions inline; tells the operator which canonical reference matches their answers (subs-initiative for A, rally-hq/website-nc-v3 for B).
4. Asks for project slug + display name + repo URL + tagline.
5. Invokes the **Pattern A stamper or Pattern B stamper** depending on the choice. Both ship in v1 per Gap 9's revision — Pattern B is no longer copy-stamp-by-hand. The Pattern B stamper's substitution surface covers lane cards in index.html, system prompt + Referer + DOCS list in functions/api/chat.js, doc taxonomy in docs/index.html, navigation hrefs, and CSS variable names beyond just `PROJECT_NAME`.
6. Writes `blueprint.yml` with `variant` + `tier` + `portal_pattern` + `methodology_version`.
7. Offers to install the SessionStart hook (`~/.claude/hooks/blueprint-session-start.py` + settings.json patch).

**Pre-requisite for the Pattern B stamper**: `template/portal/` regenerates as a generic substrate. Rally-hq specifics get stripped (lane cards become placeholders, chat system prompt becomes parameterized, doc index reads from manifest, CSS variable names become brand-generic). This is a methodology-repo PR that lands once the L8 freeze lifts on the redesign initiative.

Methodology versioning lands as semver tags on the canonical repo + a `methodology_version` field in `blueprint.yml`. The SessionStart hook reads it and warns on mismatch between consumer-pinned version and methodology HEAD. Changelog auto-generated from conventional commits (the repo already uses the right prefixes — wiring is the missing piece).

**Defer to v2**: hosted methodology server (`blueprint-mcp.<subdomain>.workers.dev`) that exposes the canonical docs + reviewers as MCP tools. v1 keeps filesystem + npm distribution as the trust model.

### Wedge 2 — Agent portability

**Closes Gap 4** (reviewers Claude-Code-locked) **and half of Gap 8** (no GitHub Actions runner).

Each reviewer markdown spec gets a paired executable implementation at `template/.claude/agents/blueprint/reviewers/<name>.mjs`. The `.mjs` runs without an agent: takes a target directory + initiative context, returns structured output (PASS / BLOCKED / WARN + finding list + remediation instructions).

Three invocation surfaces, single source of business logic:

1. **CLI** — `blueprint review portal-pattern-a --target=./apps/portal/`. Output structured (`--json`) or human (default). Exit code reflects status.
2. **MCP tool** — same logic wrapped as an MCP tool callable from inside Claude Code / Cursor / any MCP client. The current markdown-spec-invoked-by-agent pattern stays as a *fallback* when MCP isn't available; the executable lint is the canonical path.
3. **GitHub Actions** — `.github/workflows/blueprint-review.yml` runs the CLI on every PR. Findings posted as PR comments. Blocking findings fail the check.

Error messages inject remediation instructions per Lopopolo's pattern. Example: a missing audience switcher emits *"BLOCKED: AudienceSwitcher component not rendered in Layout.astro. Fix: import { AudienceSwitcher } from '@blueprint/ui/audience-switcher' and render inside the navbar slot. See docs/portal-and-tier-ladder.md § Pattern A The IA contract."*

**Defer to v2**: third-party plugin SDK for custom reviewers per Backstage's plugin model. v1 ships the canonical reviewer set as the only plugin surface; consumers fork to extend.

### Independent item 1 — Self-applying redesign as hosted reference

**Closes Gap 3** (discoverability).

The current initiative (`wip/blueprint-redesign/`) is itself the closure. The Pattern B portal at `wip/blueprint-redesign/portal/` deploys to Cloudflare Pages at `blueprint-redesign.pages.dev`, eventually graduating to a custom domain. The portal demonstrates the methodology by being its own deliverable — Strategy drawer per route explains why production-quality Blueprint diverges from current state; Current-state drawer shows the existing methodology surface for comparison; AI chat FAB grounded in the methodology corpus answers "why this decision."

The portal also serves as the docs site (closes the "docs surface is GitHub markdown browsing" gap implicit in Gap 3). The Inspect lane renders the production-quality gap inventory + the prescription + the two ADRs as navigable pages.

### Independent item 2 — Contract tests in CI

**Closes Gap 5** (no tests on stamper or reviewers).

For each reviewer, ship a fixture directory at `template/tests/reviewers/<name>/passing/` and `failing-<failure-mode>/`. Contract test runs the reviewer against each fixture and asserts the expected status. CI workflow on the methodology repo runs the suite on every PR.

Stamper gets integration tests: stamp into a temp dir, assert the substitution table applied correctly, assert the mechanical grep passes. Smoke test from this morning's session becomes the first test case.

### Independent item 3 — Methodology-gardening agent

**Closes Gap 6** (no telemetry / feedback loop).

A scheduled Claude Code task that runs against the methodology repo on a recurring cadence (weekly initial; tunable). Scans for inconsistencies between:

- `METHODOLOGY.md` claims about reviewer behavior vs the reviewer spec files
- Reviewer spec content vs the executable `.mjs` implementation
- Stamper substitution table vs actual subs-initiative strings remaining in `template/apps/portal/`
- Cross-doc references (link rot, file moves, archived-but-still-linked)

When drift is found, opens a fix-up PR per Lopopolo's doc-gardening agent pattern. Continuous payment, not painful bursts.

**Lower priority in shipping order**: consumer scale is small today; this matters more at v2 when there are 10+ initiatives consuming Blueprint and drift compounds invisibly. v1 ships it as a stub that runs on demand, not on schedule.

## What v1 explicitly defers

| Item | Defer reason | Earliest revisit |
|---|---|---|
| Hosted methodology MCP server | v1 trust model is npm + filesystem; hosting adds auth/billing/multi-tenancy complexity without proven demand | v2 (after 5+ external consumers) |
| Third-party plugin SDK for reviewers | Forking is the v1 extension path; SDK design needs real consumer demand to shape correctly | v2 (when first consumer needs project-specific reviewer) |
| Custom-stack Pattern A variants (`@blueprint/ui-svelte`, `@blueprint/ui-next`) | Adds package-maintenance load with no proven consumer | When a real initiative needs a non-React Pattern A |
| Linear / Jira / external-tracker integrations | GitHub Actions covers the highest-leverage integration; others wait for demand | v2+ as opt-in plugins |
| Anonymous opt-in CLI telemetry | Privacy + infra complexity vs no current need (no consumer scale to learn from yet) | When consumer count exceeds 10 |
| Multi-operator coordination beyond ai-hive | ai-hive already covers this case; Blueprint should not absorb the alignment-surface scope | Never — companion stays separate |

## What v1 places explicitly out of scope

These are not deferred — they are not Blueprint's territory:

- **Multiplayer real-time alignment workspace** (Appleton's Ace's territory). Blueprint stays initiative-scoped + async; if multiplayer real-time matters, operators bring their own Ace-shaped tool.
- **Production-grade SaaS** (hosted multi-tenant, billing, SOC2, etc.). Linear / Jira / Backstage hosted are in this category. Blueprint's value is being a *distributable methodology + scaffolding*, not a hosted service.
- **Service catalog** (Backstage's primary surface). Blueprint scaffolds *initiatives* that may or may not become services; the catalog layer belongs to whatever production registry the org already runs.
- **Code-only scaffolders** (CRA / Vite / Yeoman territory). Blueprint scaffolds *initiatives*, which include scaffolded code but center on the artifact set (research + decisions + portal + reviewer gates). When operators want a code-only scaffold, they reach for CRA/Vite directly.

## Shipping order

The two wedges + three independent items don't ship in parallel. Order:

1. **First**: Independent item 1 (self-applying redesign). This initiative produces the portal that documents everything else. It must exist before the rest because it's the artifact stakeholders use to evaluate the prescription. Stage 3 prototype work starts immediately after this prescription ratifies.

2. **Second**: Wedge 2 (agent portability). Executable reviewers + GitHub Actions runner. This is the highest-leverage technical change because it unlocks the entire non-Claude-Code consumer surface. Lands as `template/.claude/agents/blueprint/reviewers/*.mjs` paired with the existing `.md` specs.

3. **Third**: Wedge 1 (distribution shape). `@blueprint/cli` with interactive scaffold + semver versioning. Lands once executable reviewers exist (CLI ships with both `init` and `review` subcommands at once; building one without the other is wrong shape).

4. **Fourth**: Independent item 2 (contract tests in CI). Lands incrementally with each reviewer's executable implementation; full coverage by the time Wedge 2 is shipped.

5. **Fifth**: Independent item 3 (methodology-gardening agent). Lands as a stub during Wedge 2; activates on schedule once 3+ external consumers exist.

Total v1 scope: ~15-20 working days of methodology-repo engineering, plus the Stage 3-6 work on this initiative's portal that demonstrates the v1 shape to stakeholders.

## What "production-quality" means after v1 ships

A new operator's experience:

1. They learn about Blueprint from `blueprint-redesign.pages.dev` (the hosted reference). Reading the portal Inspect lane, they see the four-layer stack + Blueprint's wedge + the canonical methodology.
2. They run `npx @blueprint/cli init` in their existing project repo or a fresh dir.
3. The CLI walks them through variant + tier + pattern decisions with inline help.
4. The stamper writes the scaffold; the SessionStart hook gets installed.
5. They open Claude Code; the methodology auto-loads via the SessionStart hook.
6. They work through stages 1-6; the conformance reviewers run as both in-session MCP tools (during development) and CI checks (on every PR).
7. When the methodology evolves, their next `npx @blueprint/cli upgrade` runs the migration; semver tells them what changed.

Zero filesystem-path dependencies. Zero paste-prompt rituals. Zero Claude-Code lock-in for the reviewer set. Three load-bearing operations (`init`, `review`, `upgrade`) cover 80% of the operator surface.

## Open questions for ADRs

Two ADRs follow this prescription:

- **ADR-0001 — Dual-protocol distribution shape.** Ratifies CLI + MCP + GitHub Actions as the three invocation surfaces for Blueprint, parallel to the same decision being made for ai-hive. References `research/architecture/01-hive-cli-vs-mcp-with-optionality.md`.
- **ADR-0002 — Reviewers as executable plugins.** Ratifies the markdown-spec → `.mjs` paired implementation pattern + the remediation-injection error format + the future plugin-registry direction (deferred to v2).

Two open questions tracked but not blocking v1:

- Should the hosted reference portal at `blueprint-redesign.pages.dev` graduate to a permanent custom domain (e.g., `blueprint.dev`) once v1 ships, or stay on the Pages subdomain as a temporary demonstrator while the methodology repo itself remains the canonical surface? Decision deferred until v1 ships and adoption signal is visible.
- Should the methodology-gardening agent run from a GitHub Action (free, public-repo-only) or a scheduled Claude Code task (paid, supports private consumers)? Decision deferred until the agent is built; both are easy.
