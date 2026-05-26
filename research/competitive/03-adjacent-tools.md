---
canonical: true
stage: 1
status: seeded
---

# Adjacent tools — competitive landscape

Where Blueprint fits and where it doesn't, against the tools builders + crafters actually reach for today.

## The categories that matter

Six categories of tooling overlap with Blueprint at different scopes:

1. **Code scaffolders** — `create-next-app`, `npm create vite`, Yeoman, Cookiecutter, Hygen, Plop. One-shot generators that produce a stack-specific starter.
2. **Internal developer platforms** — Backstage (Spotify), Port, OpsLevel. Self-hosted platforms with scaffolders, service catalogs, plugin SDKs.
3. **Methodology playbooks** — Shape Up (Basecamp), RFC processes, ADR templates, Atlassian's playbook. Process discipline shipped as a doc/book.
4. **Issue + product trackers** — Linear, Jira, Shortcut, Asana. Where alignment, prioritization, and state currently live.
5. **Agent-first development surfaces** — Maggie Appleton's Ace, GitHub Spec Kit (spec-driven dev), Cursor, Claude Code. Tooling specifically designed for agent + human collaboration.
6. **Initiative-scoped methodology** — Blueprint. Closest analog: Shape Up, but Shape Up is pre-agent.

Blueprint is none of the above and partially all of them. The wedge: methodology + scaffolding for *initiative-scoped work where the deliverable is a stakeholder-ready artifact, not a production codebase, and the operator is an agent + human pair*.

## Detailed comparison

### Code scaffolders (Yeoman / CRA / Vite / Cookiecutter / Hygen / Plop)

**What they do.** Take a template + parameters → emit a project skeleton. One command, opinionated stack, sensible defaults.

| Tool | Distribution | Substitution mechanism | Use case |
|---|---|---|---|
| `create-next-app` | npx | Hard-coded prompts + a fixed template | Bootstrap a Next.js app |
| `npm create vite` | npx | Stack matrix (React/Vue/Svelte × JS/TS) | Bootstrap a Vite app |
| Yeoman | global install + generators | Plugin ecosystem of generators | General-purpose scaffolder |
| Cookiecutter | pip install | Jinja2 templating with variables | Python-world generic scaffolder |
| Hygen | npx | Per-file generators with EJS | Component / page / API-route scaffolding |
| Plop | global install | Per-microgenerator prompts | Inside-project component scaffolding |

**Where Blueprint overlaps.** The stamper (`template/tools/blueprint-init/stamp.mjs`) is a Cookiecutter-shaped tool — fixed substitution surface, mechanical post-stamp check, Pattern A portal scaffold. Same shape, narrower scope.

**Where Blueprint diverges.** These tools scaffold *code*. Blueprint scaffolds an *initiative* — research dir + decisions dir + portal + reviewer-gate config + variant/tier/pattern declaration in `blueprint.yml`. The deliverable is the *artifact set*, not the code skeleton.

**What Blueprint should adopt.** The `npx <name> init` distribution shape is universal across this category for a reason: zero-install, parameterized, idempotent. Blueprint v1 should ship as `npx blueprint init` (or equivalent). The L5 stamper is the foundation; the npx wrapper is the missing distribution layer.

### Internal developer platforms (Backstage / Port / OpsLevel)

**What they do.** Self-hosted platforms that combine:
- Service catalog (registry of every service the org runs)
- Scaffolders (per-template project generators with golden-path enforcement)
- Tech docs (per-service auto-generated docs from repo markdown)
- Plugin SDK (extend the platform with custom views)

**Backstage specifically.** Open-sourced by Spotify in 2020. Self-hosted Node + React. Plugin ecosystem with 100+ community plugins. Adopted at scale by Netflix, Expedia, Spotify, others. Production-grade in every dimension Blueprint isn't: versioned releases, hosted docs at docs.backstage.io, semver, plugin SDK, multi-tenant, telemetry.

**Where Blueprint overlaps.** Backstage's scaffolder is a parameterized Cookiecutter-shaped tool with golden-path enforcement — same as Blueprint's L5 stamper + L6 reviewers. Backstage's tech-docs concept (per-service docs auto-rendered from repo markdown) is the same shape as Pattern A's `/operate` route.

**Where Blueprint diverges.** Backstage scaffolds *services* in a service catalog; Blueprint scaffolds *initiatives* that may or may not become services. Backstage's plugin SDK assumes a self-hosted React + Node runtime; Blueprint's reviewer "plugins" are markdown specs invoked by Claude Code (the agent-portability gap).

**What Blueprint should learn from.** The plugin SDK pattern. If reviewer agents become executable lints (per the Lopopolo analysis), they should be a *plugin set*, not a fixed list. Operators can author project-specific reviewers (per Backstage's plugin model) and the methodology repo ships the canonical set. The reviewer registry pattern would be a clean Stage 2 prescription item.

### Methodology playbooks (Shape Up / RFC / ADR templates)

**What they do.** Process discipline shipped as documentation. The artifact is a book or a doc — Shape Up the book; RFC0001-template.md; ADR-style decision records.

**Shape Up specifically.** Basecamp's 6-week-cycle methodology — pitches → betting table → shape → ship. Released as a free PDF in 2019. Adopted broadly because it gives teams *a vocabulary* for product work (pitch / shape / appetite / circuit breaker) without prescribing tooling.

**Where Blueprint overlaps.** Blueprint is a methodology vocabulary (variant / tier / pattern / stage gate / reviewer / portal). The Variant × Tier matrix is the same kind of normative grid Shape Up provides.

**Where Blueprint diverges.** Shape Up is pre-agent. It assumes the implementation cost dominates the planning cost. With agent throughput at Lopopolo-scale (3.5 PRs/engineer/day), Shape Up's 6-week cycle is the wrong unit — too long. Blueprint's stage pipeline is shorter and assumes the agent generates most artifacts. Blueprint also produces stakeholder-facing *deliverables* (the portal); Shape Up produces internal coordination.

**What Blueprint should adopt.** The clean vocabulary pattern. Shape Up's success isn't its tooling (it has none); it's that "pitch" / "appetite" / "circuit breaker" became shared language. Blueprint's vocabulary (`variant: brownfield`, `Pattern B`, `Tier 1`, "Stage 3 → Stage 4 gate") is already in this shape. Production-quality Blueprint should be promotable to operators as a vocabulary they can use without adopting the tooling — exactly how Shape Up spread.

### Issue + product trackers (Linear / Jira / Shortcut / Asana)

**What they do.** Track work items + state + priority + assignment + reviews. SaaS. Multi-tenant. Integration ecosystems.

**Where Blueprint overlaps.** Blueprint's `decisions/` ADR pattern + research artifacts + variant declaration tracks initiative state. ai-hive's task/proposal/synthesis primitives are a tracker shape.

**Where Blueprint diverges (this is large).** Linear/Jira are operator-facing primary surfaces — you live in them. Blueprint's surfaces (portal, ADRs) are produced *as artifacts* but the operator's primary workspace is the agent session + the repo. Blueprint doesn't want to become Jira; it wants to *integrate with* whichever tracker the operator already uses.

**What Blueprint should adopt.** Integration points. ai-hive's hive-board-derive script already pulls GitHub issue state. A production-quality Blueprint should have similar derive points for Linear / Jira state, surfaced on the portal's Inspect route. *We don't reinvent the tracker; we externalize its state into the portal for stakeholder consumption.*

### Agent-first development surfaces

**Maggie Appleton's Ace** — covered in detail in `02-appleton-zero-alignment.md`. Multiplayer real-time workspace for general code development. The alignment layer above Blueprint in the four-layer stack.

**GitHub Spec Kit** — spec-driven development toolkit (open-source). Provides scaffolding for spec → impl flow. Adjacent to Blueprint's variant pipeline (research → prescription → prototype) but stops at the spec layer; doesn't produce stakeholder-facing artifacts.

**Cursor / Claude Code** — the agent runtimes that consume Blueprint methodology. Not competitors; substrate.

**Where Blueprint diverges.** Blueprint is the only one of these specifically scoped to *initiative work where the deliverable is a stakeholder-ready artifact*. Ace optimizes for build-team alignment; Spec Kit optimizes for spec-driven implementation; Blueprint optimizes for "stakeholder can open one URL and understand what the team is doing and why."

**What Blueprint should adopt.** Cursor's and Claude Code's ergonomics for agent invocation. The L1 SessionStart hook is in this shape — methodology loads automatically. Production-quality Blueprint should be invokable without paste-prompts; the runtime should know what Blueprint is.

## Where Blueprint actually competes (the wedge)

Blueprint occupies a specific niche the named tools don't fill:

| Dimension | Blueprint's position |
|---|---|
| Scope | Initiative-level (not service, not company-level, not feature) |
| Deliverable | Stakeholder-ready artifact (portal + docs + prototype) |
| Audience | Internal stakeholders (VPs, peer architects, hiring managers) — *not* the build team alone |
| Operator | Solo or small team + agent |
| Substrate | Filesystem + Claude Code + optional ai-hive companion |
| Maturity claim | "Methodology that's been used across 5+ initiatives at different variants" |

The wedge holds because:
- **Backstage** is too heavy (service catalog + plugin SDK + self-hosted runtime; assumes >50 engineers).
- **Shape Up** is too pre-agent (6-week cycles; doesn't address agent throughput).
- **Linear/Jira** is too generic (tracker; not methodology + deliverable shape).
- **Ace** is too general (cross-codebase alignment; not initiative-scoped artifact production).
- **Scaffolders (CRA/Vite/etc)** are too narrow (code-only; no methodology, no portal, no stage gates).
- **Spec Kit** is upstream of where Blueprint operates (spec, not deliverable).

The competitive table:

|              | Initiative-scoped | Stakeholder-facing artifacts | Multi-agent coordination | Production-grade distribution |
|---|---|---|---|---|
| Backstage    | No (service-scoped) | No (internal docs) | No | Yes |
| Shape Up     | Yes (pitch-scoped) | No (internal) | No | Doc-only |
| Linear/Jira  | No (item-scoped)  | No | Limited (assignments) | Yes |
| Ace          | No (general)      | No (build team) | Yes (real-time) | Eventually (preview) |
| CRA/Vite     | No (code-scoped)  | No | No | Yes |
| Spec Kit     | Yes (spec-scoped) | No | No | Yes |
| **Blueprint** | **Yes** | **Yes** | **Yes (via ai-hive)** | **Not yet — the gap this redesign closes** |

The two non-shaded cells where Blueprint already wins (initiative-scoped, stakeholder-facing) plus the third one ai-hive already covers (multi-agent coordination) defend the wedge. The fourth cell (production-grade distribution) is what the redesign produces.

## Implications for the prescription

Three concrete prescriptions emerge from the comparison:

### 1. Adopt the `npx` distribution shape

Universal across scaffolder tooling. The L5 stamper is the foundation; `npx @blueprint/init` is the missing layer. Same UX as `create-next-app` — operator runs one command, answers prompts, gets a scaffolded initiative. Underneath: invokes the stamper, validates against the Variant × Tier matrix, writes `blueprint.yml`.

### 2. Treat reviewers as plugins, not a fixed list

Backstage's plugin SDK is the canonical pattern. Blueprint's reviewer set ships as the canonical core; operators author project-specific reviewers; the registry pattern composes both. Same plugin shape used by Cursor's rule files and Claude Code's agents-as-markdown.

### 3. Stay narrow on the wedge

Don't become a tracker (Linear/Jira win). Don't become a multiplayer workspace (Ace wins). Don't become an internal developer platform (Backstage wins). Stay the methodology-plus-scaffolding-for-stakeholder-ready-deliverables tool. Integrate with the categories around the wedge; don't absorb them.

## Open questions for prescription

- Should Blueprint's portal templates ship Linear/Jira integration adapters by default (since most teams use one) or stay tracker-agnostic and rely on consumer integration?
- Should the canonical Blueprint distribution offer a hosted reference deploy (`blueprint.<some-tld>` showing the methodology applied to itself) — same pattern as ai-hive's reference Worker — or stay filesystem-only with the redesigned portal as the only "hosted Blueprint" surface?
- Where does the methodology stop and the consumer's stack choices begin? Currently Blueprint mandates Astro + React for Pattern A. Should the methodology be stack-agnostic at v1 (with `@blueprint/ui-svelte` etc as future packages) or stay opinionated as a forcing function for consistency?
