# Blueprint Methodology

Agent-assisted product delivery pipeline — research feeds BRD/PRD-class documents (business- and product-requirements strategy docs), the documents plan the prototype, the prototype validates the plan, and the validated package hands off to build

## State of the methodology

Blueprint is a methodology I've been refining across a growing set of consumer initiatives — projects that run the methodology — `rally-hq`, `website-nc-v3`, `apps/blog`, `blueprint-redesign`, and two commerce-platform initiatives (subscriptions management, promotions targeting — real industry work, de-named here because this repo is public) were the first six; the live registry is [consumers.yml](consumers.yml). Every change ships as a **wave** — a numbered batch of methodology changes released together — captured in [WAVE-LOG.md](WAVE-LOG.md). Each initiative has caught gaps that became reviewer checks, schema fields, or logic in the stamper (the scaffolder that generates new initiatives from `template/`) in subsequent waves.

If you run an initiative through Blueprint and a gate feels wrong, or the methodology is missing a check you'd expect to find, [template/docs/methodology/methodology-amendments-convention.md](template/docs/methodology/methodology-amendments-convention.md) describes how to upstream the finding so the next initiative inherits it. The amendments convention is how a reader of this document becomes a contributor to it.

The rest of this document describes the current state of the methodology, not its finished form. Sections below are written declaratively because that's the right register for someone running an initiative — but the methodology itself is still being shaped by the initiatives that run through it.

## Overview

Blueprint is a repeatable structure for running a product initiative end to end with an agent carrying the heavy lifting — more than a prototyping aid. The human provides context (screenshots, existing requirements, codebase access, competitive intelligence). The agent executes a seven-stage pipeline whose outputs feed each other: research produces the evidence; the documents stage turns that evidence into the BRD/PRD-class strategy package; those documents plan the prototype; the prototype validates the decisions the documents record; and the validated package hands off to build/implementation. A subscriptions-management initiative (May 2026) ran the full loop — research → BRD/PRD → planning → prototype → implementation — against a production commerce platform.

The methodology integrates three existing tools:
- **Specchain** — agent orchestration patterns and governance principles
- **Forge Signal** — content generation engine with voice taxonomy and quality validation
- **Claude Code** — agent runtime with tool use, codebase analysis, and web research

Extracted from a pricing & packaging CX initiative at a commerce platform (March 2026), where it produced: 11 prototype pages, 4 strategic documents, cross-industry research across 14 platforms, technical feasibility validated against a production Rails codebase, and an embedded AI billing support agent.

## First Principle: Agent Struggle Is a Missing Capability

When the agent fails at a stage, the response is *never* "try harder" or "prompt better." The response is:

1. **Identify what's missing** — tool, guardrail, doc, sensor, invariant, reviewer agent
2. **Encode it into the repo** — lint, doc, skill, agent definition, stage gate
3. **Have the agent itself write the encoding** — the failure produces durable infrastructure
4. **Re-run the stage** — now the capability exists for every future initiative too

The alternative — patching prompts session-by-session — produces zero compounding leverage. Every encoded capability multiplies across every future initiative.

This principle is the reason the methodology accumulates: Stage 0 (browser sensor) was an encoded response to "the agent can't see the running app." Reviewer agents (`template/.claude/agents/blueprint/reviewers/`) were an encoded response to "the agent declares stages complete with sub-deliverables empty." The variant taxonomy was an encoded response to "the agent retrofits brownfield work into greenfield pipelines." None of these are prompt fixes; all are repo-level encodings.

The 2026-05-25 reconciliation added eight more encodings against the same principle — each one a repo change, not a prompt:

| Failure observed in the 24-hour window | Encoding |
|---|---|
| Three live consumer sessions reasoned about Blueprint from first principles instead of reading canonical docs | `template/.claude/hooks/blueprint-session-start.py` injects `METHODOLOGY.md` + `docs/variant-selection.md` + `docs/portal-and-tier-ladder.md` at SessionStart in every Blueprint initiative |
| Four-way root-doc drift (METHODOLOGY + v2 patch + 2 handoffs) generated three different "what is Blueprint" answers | The three drift sources archived to `docs/_archive/handoffs/`; `METHODOLOGY.md` is the single source of truth |
| Variant and tier got conflated in mid-stream reasoning | Variant × Tier matrix added to top of `docs/portal-and-tier-ladder.md`; they are orthogonal axes |
| Port-registry literals (8765/8766/8767) got promoted to methodology invariant | Struck from Stage 0 here; replaced with "each initiative claims a free port via serve.sh; port assignments do not survive Tier 1 promotion" |
| Copy-paste of `template/apps/portal/` left source-project strings embedded in 6+ files | `template/tools/blueprint-init/stamp.mjs` stamps a fresh portal with mechanical post-stamp grep |
| `portal-shell-conformance-reviewer` existed but wasn't wired as a gate | Renamed to `portal-pattern-a-conformance-reviewer`; parallel `portal-pattern-b-conformance-reviewer` shipped; both wired at Stage 3 + any portal-touching commit |
| "What survives a restart" rule was implicit; the next restart would have repeated the swirl | "Shell is throwaway; artifacts are forever" section added to `template/CLAUDE.md` enumerating evidence vs scaffolding directories |
| Methodology evolved under three live consumer sessions at the same time, producing the drift | "Methodology freeze during consumer migration" rule added to `template/CLAUDE.md`: methodology repo and consumer sessions advance sequentially, not in parallel |
| A consumer (website-nc-v3) lost 268 lines of chrome (the shared portal shell — header, drawers, nav styling) from `shared.css` mid-edit, then restored from `curl https://blueprint.rallyhq.app/shared.css` — promoting a peer consumer's 832-line project drift into a de facto "canonical" position no methodology doc declared | `template/portal/shared.css` split into canonical chrome (do-not-edit) + new `template/portal/project-tokens.css` overlay (consumer-editable). `stamp.mjs --mode=restamp-chrome --pattern=B` refreshes only the canonical manifest (`PATTERN_B_CHROME_FILES`) without touching the overlay. `portal-chrome-canonical-reviewer` gate diffs byte-identical against template canonical at Stage 3 + every portal-touching commit. Full incident: `docs/case-studies/case-study-v3-portal-css-gap.md` § "Follow-up — 2026-05-25 evening" |
| Same consumer (website-nc-v3) opened `/docs/` and found 13 Rally HQ doc slugs hardcoded in the template's docs viewer sidebar, plus `productName: 'Rally HQ'` baked into PORTAL_SHELL_CONFIG, plus default-doc `'cx-strategy'`. Third leak on the same Pattern B surface in one evening, same root pattern: template ships a file that mixes canonical chrome with project data; consumers inherit the project data when they copy | `template/portal/docs/index.html` refactored to render sidebar + TITLES + STRATEGIC_DOCS from `_meta/index.json` `docs.tiers[].docs[]`. `_portal-shell.js` refactored to read productName from `_meta/index.json` `name` (strips " Blueprint" suffix); dropped the hardcoded `'/docs/?doc=cx-strategy'` default. `docs/index.html` added to `PATTERN_B_CHROME_FILES` (now canonical chrome with zero project defaults). README updated with manifest-driven setup steps. Full incident + pattern naming: `docs/case-studies/case-study-v3-portal-css-gap.md` § "Follow-up — 2026-05-25 evening: docs viewer Rally HQ leak" |

Non-learnings explicitly excluded from this round (kept in their respective project repos, not promoted to methodology): personal-software / harness positioning, buy-vs-build threshold thesis, port registry as a "concurrent comparison" feature. Positioning is project-specific; methodology is general-purpose. Conflating them is how Blueprint stops being reusable.

The reconciliation execution plan (`docs/_archive/2026-05-25-three-session-reconciliation.md` lines 102-111) closed in two waves: items 1-2 in the morning (Tier 1 canonical extraction + portal-pattern-A/B conformance reviewers), items 3-5 in the evening (`pilot-profile-lock-reviewer` + `pilot_profile` block in `blueprint.yml`; `confident-preview-rule.md` + extended `design-principles-reviewer`; `prescription-evidence-reviewer` monetization extension + `personas-template.md` + `METHODOLOGY-AMENDMENTS.md` append-only convention). Three concurrent v3 consumer bugs surfaced and were folded into the same evening wave: chrome canonical drift (`shared.css` split + restamp-chrome mode + `portal-chrome-canonical-reviewer`); docs viewer Rally HQ leak (`docs/index.html` data-driven refactor + `_portal-shell.js` manifest-aware brand bar). A subsequent audit excised the remaining Pattern B leaks: chat-widget.js header comment, chat.js OpenRouter attribution (now request-URL + manifest-derived), index.html footer line + GitHub link (now manifest-driven via new `_meta/index.json footer:` block), and the four `rally-*` storage-key identifiers (`rally-bp-audience`, `rally-hq-blueprint-chrome-preview`, `rally-anno-enabled`, `rally-anno-notes-v1`, `window.rallyAnno`) renamed to the `blueprint-` prefix per ADR-0002 convention (recorded as ADR-0002 addendum). The pattern across all v3 bugs: template ships files that mix canonical chrome with project data — consumers either edit the chrome (drift) or copy verbatim (inherit project leak). Encoded fix: manifest-driven data + byte-identical chrome + reviewer-enforced separation. After all waves, a grep for source-project strings (`rally|nino|chavez|<source-slug>`) over `template/portal/` returns only documentation comments + ADR addendum references in code-path files.

When you hit an agent failure that isn't covered by an existing reviewer / invariant / sensor / doc, the question is not "how do I prompt around this." The question is "what capability is missing, and how do I encode it." Source: OpenAI's harness engineering practice (Ryan Lopopolo, Feb 11, 2026); adopted into Blueprint per the v2 patch.

## Variant Selection

Blueprint serves four project lifecycles — **greenfield** / **midstream** / **brownfield** / **research** — each with its own stage sequence and reviewer gates. The pipeline described in the rest of this document is the **greenfield variant**; midstream, brownfield, and research diverge per the canonical taxonomy at [docs/variant-selection.md](docs/variant-selection.md). The **research variant** — strategy/decision work driven by input assets (briefs, decks, datasets), whose deliverable is a decision memo and whose portal is optional provenance — was added from the mrr-automation dogfood (see `docs/variant-selection.md` § Research and `METHODOLOGY-AMENDMENTS.md`). It makes persona/JTBD grounding a mandatory Stage-1 gate (greenfield defers it) and adds `persona-fit-reviewer` as the structural defense against producing artifacts no input-derived persona can use.

Declare at `blueprint.yml`: `variant: greenfield | midstream | brownfield | research`. Default is `greenfield`. Pick the variant before Stage 0 runs — the wrong variant produces retrofit feel that cannot be un-retrofitted without restarting.

## The Pipeline (greenfield variant)

```
Stage 0: Application Legibility → Research → Design Principles → Prototype → Fact-Check → Documents → Deploy → Iterate

Optional capability stages (run alongside, gated by blueprint.yml flags):
   Stage S-A: Archaeology Substrate    (when archaeology.enabled: true)
```

Each main-pipeline stage feeds the next. The key insight: **the prototype and the documents are built simultaneously, not sequentially.** The prototype tests the design decisions, the documents capture the rationale, and the strategy panels on each prototype page connect the two.

Capability stages (the `S-` prefix denotes substrate / sidecar) are independent of the main pipeline — they activate based on per-initiative flags in `blueprint.yml`, have their own Done-criteria, and feed UI affordances back into the main-pipeline surfaces (e.g. the archaeology substrate populates the "Ask the substrate" widget that mounts in the portal layout). The "Optional Capability Stages" section below documents each.

## Stage 0: Application Legibility

Before any other stage runs, the agent must be able to drive the running app — boot the prototype, navigate it, run JS against it, screenshot it. This is wired once per initiative and reused at every downstream stage that validates against the live UI.

Stage 0 is mandatory for midstream and brownfield variants (the product already exists; every audit claim grounds in a captured surface). For greenfield, Stage 0 wiring often defers to Stage 3 — there's nothing to drive until the prototype shell is up.

**Research variant exception.** For `variant: research` there is no app to drive. Stage 0 is reinterpreted as **Inputs Intake** — catalog every input asset (briefs, decks, datasets, dashboards) with provenance into `research/sources/`. The browser sensor described in the rest of this section does not apply. See `docs/variant-selection.md` § Research — strategy pipeline.

### Default sensor: `browse-tool`

`browse-tool` (`~/Workspace/dev/tools/browse-tool`) is the default. Token economics: Chrome DevTools MCP costs ~18k tokens of always-loaded schema; browse-tool's README costs a few hundred tokens loaded on-demand. The four primitives the harness actually needs — `browse-start` / `browse-nav` / `browse-eval` / `browse-screenshot` — cover the entire stakeholder-prototype validation surface.

**Install** (once per initiative):

```bash
export PATH="$HOME/Workspace/dev/tools/browse-tool/bin:$PATH"
# In Claude Code: /add-dir /Users/nino/Workspace/dev/tools/browse-tool
```

**Per-initiative profile override**: always pass `--profile-name <initiative-slug>-blueprint`. Default profile name = cwd basename = `blueprint`, which collides across initiatives.

**Per-worktree bootability**: each initiative claims a free port via `serve.sh` at the initiative root. Port assignments do not survive Tier 1 promotion — at Tier 1 the Astro dev server picks its own port. The "static-HTML on a known port" shape is a Tier 0 / Pattern B convenience, not a methodology invariant. Concurrent comparison of two Tier 0 surfaces on adjacent ports is a coincidence, not a feature.

### Escalate to Chrome DevTools MCP only when

Each trigger below is something `browse-eval` cannot synthesize from DOM access alone. When none of these fire, the agent does not load MCP schemas.

| Trigger | Reason MCP is required |
|---|---|
| "capture network requests" / "watch XHR" | `browse-eval` can call `fetch` but cannot intercept ambient traffic |
| "stream console errors" / "log capture" | `eval` reads page state, doesn't subscribe to console events |
| "lighthouse audit" / "perf trace" | MCP wraps the CDP performance domain directly |
| "accessibility tree" / "ARIA snapshot" | MCP exposes the a11y tree; DOM-only eval misses computed ARIA |

Full Stage 0 reference + escalation rubric: [docs/context/browser-legibility.md](docs/context/browser-legibility.md).

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

### Design-discovery sub-track (added 2026-05-26 wave 8 — design-discipline track)

Persona / funnel / evidence research is inventory-naive. Design work is inventory-led. The reason this matters: three independent consumer dogfoods (rally-hq, signal-dispatch blog, blueprint-redesign) converged on the same finding — L4 templates were absent because Stage 1 produced no L5 surface inventory to derive them from. Stage 2 design-system work then filled the void with templates (shadcn defaults, ad-hoc per-page CSS), missing entire content types and surfaces that existed in production.

For brownfield variants, Stage 1 produces four additional artifacts:

| Artifact | What it inventories |
|---|---|
| `research/surface-audit.md` | Every route + purpose + auth state + content source |
| `research/component-audit.md` | Every UI primitive in use, classified by atomic-design level (L0-L5) with ✓ / ✗ / partial markers |
| `research/content-type-taxonomy.md` | Every content collection + frontmatter shape + rendering contract + cross-collection bindings |
| `research/auth-boundary-map.md` | Public / token-gated / authenticated tiers + the design treatment for each tier |

For greenfield variants: a planned surface map covering the same fields ahead of build.

**Diagnostic test (codified)**: when a cluster of layout or composition bugs surfaces on a single page in a single session, the signal is that L4 templates are missing, NOT that L1 atoms are wrong. Patching at L1 when the missing primitive is at L4 produces a sequence where the bug "moves" — each fix shifts the symptom to a new surface rather than closing it.

Canonical audit template at `template/methodology/design/audit-template.md`. Canonical example at `template/methodology/design/EXAMPLE-surface-audit.md` (from blueprint-redesign's own portal audit).

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

### Design-system dictionary (added 2026-05-26 wave 8)

The five rules above name BEHAVIOR. Stage 2 also produces a STRUCTURAL dictionary at the atomic-design layer, derived deterministically from the Stage 1 design-discovery audit:

| Level | Artifact |
|---|---|
| L0 | Tokens (color, type, spacing) — brand kit via `forge-brand` OR theme registry per the multi-theme amendment |
| L1 | Atom dictionary — every primitive in use + extraction gaps |
| L2 | Molecule dictionary — cross-surface patterns named as primitives |
| L3 | Organism dictionary — composed sections + cross-surface usage |
| L4 | Template dictionary — page archetypes the L5 inventory revealed |

L4 cannot be authored without L5 (the audit). Without an L4 dictionary, every page becomes a one-off. The methodology amendment captured this finding across three independent consumer audits (rally-hq, blog, blueprint-redesign).

Canonical example at `template/methodology/design/EXAMPLE-design-system.md` (from blueprint-redesign's own design-system definition).

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

### Two shells, two paths

As of 2026-05-23 there are two prototype-shell templates. Pick the one that matches your stack constraints.

| Shell | When to use | Template | Reference deploy |
|---|---|---|---|
| **`portal/` — static HTML + Pages Functions** *(default for new projects)* | Cloudflare-first stack, no framework/design-system coupling, want zero build pipeline, want stakeholder-facing static site | `template/portal/` | `blueprint.rallyhq.app` (Rally HQ) |
| **`prototype/` — Vite + React + platform design system** *(legacy for platform-coupled initiatives)* | Targeting the production platform's React design system, need full SPA routing for many slices, building toward production-grade React components | `template/prototype/` | the subscriptions initiative's prototype (private) |

The static-HTML `portal/` is the default for any initiative not bound to a platform design system — it's faster to read, faster to ship, zero build tax, and stakeholders can inspect-element directly. Drop into React only when the production target itself is React.

### Structure (both shells)

Each prototype page has three layers:

1. **The product experience** — what the customer sees. UI matching the existing product's design language.
2. **Strategy panel** (right drawer) — explains the "why" behind each design decision with market research citations. Audience: stakeholders.
3. **Current-state panel** (left drawer) — shows screenshots of what exists today for side-by-side comparison.

The `portal/` shell additionally provides:

- **Proposed / Side-by-side / Shipped toggle** — page-level comparison view.
- **Flow mode** — `?flow=<flow-id>` URL param threads multi-page journeys with a top-of-page breadcrumb.
- **Annotation overlay** — opt-in stakeholder note-taking (`localStorage.setItem('rally-anno-enabled', 'true')`).
- **AI chat** — Pages Function calling OpenRouter with the blueprint docs corpus preloaded as system context.

### Slice metadata contract

Both shells use per-page metadata files:

- **Portal shell:** `_meta/<page-id>.json` with `id`, `title`, `group`, `surface`, `phase`, `summary`, `strategy`, `currentState`. The page HTML only declares `window.PROTO_PAGE = { id: '<page-id>' };` — all other data flows from the JSON.
- **Prototype shell:** `prototypes/<slice-name>/prototype.config.json` with `name`, `description`, `brdRef`, `phase`, `pages`, `flows`. Each page wraps in `<SliceShell>` and is auto-discovered via `import.meta.glob`.

### Navigation

- **Sticky footer nav** — page picker + drawer toggles. Auto-derived from the manifest in both shells.
- **Chat widget** — built into both shells.

### Key principle

The prototype is not a design comp. It is a **stakeholder communication tool**. Every page should be self-explanatory to someone who opens it cold — the strategy panel provides the context they need. See `template/portal/CONVENTIONS.md` for the full contract.

### Companion deliverable: Demo Storyboard

When a project grows beyond a single surface (prototype + production app + admin, or N storefronts + back-office), the demo storyboard at `apps/demos/` becomes the index that prevents "where do I click to demo X" from turning into tribal knowledge.

Architecture:
- Static HTML site (no build step) — `index.html` + `app.js` + `styles.css` + `scenarios.json`
- Schema-driven: each scenario lists per-surface status + click-paths + prose guide
- Optional `state.json` overlay from a mechanical capability tracker (e.g., `state-derive`) cross-checks declared status against artifact presence (DoD gate 3 — not behavior; see `template/docs/methodology/dod-verification-ladder-pattern.md`)
- Mode toggle — same content serves as **demo script** (presenter-paced) and **how-to guide** (self-serve docs)

The prototype Studio Home links to the deployed demos page via `DemoStoryboardPanel`. Symmetric: the demos page's header nav links back to the prototype harness, traceability matrix, and any other family Pages deploys.

See `template/apps/demos/README.md` for the full setup recipe. Origin: extracted from the subscriptions initiative (May 2026) where it answered the multi-surface demo problem across several storefront paradigms plus the platform admin.

## Stage 4: Fact-Check

Before writing strategic documents, validate every claim against reality:

1. **Screenshot validation** — does the existing product actually work the way you described? Open every screenshot, check every claim.
2. **Codebase validation** — if you have access to the source code, verify what data exists, what APIs are available, what's buildable vs. greenfield.
3. **Data validation** — are the numbers sourced? Is the methodology stated? Can a skeptical reader verify them?

### The credibility rule

If a VP reads your document and opens the product to check one claim, and it's wrong, they stop trusting the rest. Fact-check everything.

### Solo-initiative degrade-path (added 2026-05-26 wave 8)

Stage 4 is designed for external review. The reason this matters: the agent's most common failure mode is self-attestation ("looks done to me"), and the same author that produced an artifact rarely catches the gaps the artifact has.

For solo initiatives with no second-operator reviewer, the gate degrades to:

1. **Mechanical verification of every ratified claim** — file existence, grep counts, structural matches. Self-fact-check is bounded to mechanical claims because the author can honestly evaluate them.
2. **Judgment claims carry-forward to ratification gates** — claims like "does the prose actually read as Solution Architecture register?" or "is the design system complete enough?" cannot be self-judged. Each ratifiable artifact's `status: ratified` requires a named reviewer; for solo dogfoods, the reviewer is the next consumer initiative that exercises the artifact.

Canonical example at `template/methodology/design/EXAMPLE-stage4-fact-check.md` (from blueprint-redesign's own Stage 4 run).

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

Before sharing any document, run the five checks (canonical definitions + failure thresholds: [docs/context/voice-template.md](docs/context/voice-template.md) § Quality audit, enforced by `doc-quality-auditor` at the Stage 5 → 6 gate):

1. **"So what?" placement** — Is the takeaway in the first sentence, or buried?
2. **Mental math** — Do tables show the conclusion, or require calculation?
3. **Logic gaps** — Does any section contradict another?
4. **Scannable format** — Is context trapped in paragraphs?
5. **Methodology statement for derived data** — Can a skeptical reader see how every derived number was produced?

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

## Optional Capability Stages

Capability stages run alongside the main pipeline, gated by `blueprint.yml` flags. Each has its own Done-criteria and produces UI affordances that mount into the main-pipeline portal. Capability stages are NOT optional in the "skip if you want" sense — they are optional in the "activate per initiative need" sense. When the flag is `true`, the stage is mandatory and gated.

### Stage S-A: Archaeology Substrate (added 2026-05-27 wave 21 — promotions-initiative amendment)

**Flag**: `blueprint.yml archaeology.enabled: true | false` (default: `false`)

**Reference**: [docs/patterns/archaeology-substrate-pattern.md](docs/patterns/archaeology-substrate-pattern.md) — full design, lifecycle, six-stream model

**Activates when**: initiative will run more than a few weeks, multi-agent / multi-session work expected, accumulating ADRs / Hive proposals, onboarding new engineers periodically, OR wants exhaustive provenance queryable as evidence

**Skips when**: throwaway prototype that won't outlive the week, solo single-session work with no Hive coordination, strict regulatory environment that can't tolerate default-on session capture

**Why this is a stage, not a cross-cutting discipline**: the substrate has a discrete linear lifecycle (scaffold → deploy → ingest → flip UI flag) with distinct Done-criteria at each step, and the wrong choreography produces the observed failure mode where a portal ships with the "Ask the substrate" widget live but pointed at a non-existent or wrong-project substrate.

**Lifecycle (when `archaeology.enabled: true`):**

| Step | What lands | Done-criterion |
|---|---|---|
| S-A.1: Scaffold | `bash tools/archaeology/scaffold.sh` provisions CF Worker + D1 + R2 + Vectorize and installs the SessionEnd hook | Worker URL reachable; `wrangler tail` shows the deployed Worker; `.github/workflows/archaeology-tail-docs.yml` installed |
| S-A.2: Ingest | First batch of session JSONLs + ADRs + Hive proposals ingested via `tools/archaeology/ingesters/` | `/derive?question=X` returns ranked events with citations; at least one ingester run per source stream the initiative uses |
| S-A.3: Wire the UI | Update `apps/portal/src/components/ArchaeologyChat.tsx` `WORKER_URL` to point at THIS project's Worker (wave 17 stamper blanks the URL at scaffold time) | `curl <WORKER_URL>/health` returns 200; `WORKER_URL` is no longer an empty string; wave 17's component-side guard now passes-through to the live drawer instead of rendering the "substrate not configured" disabled button |
| S-A.4: Flip the gate | Edit `apps/portal/src/layouts/Layout.astro` `ARCHAEOLOGY_READY = true` (wave 18 gate) | Portal renders the "Ask the substrate" trigger button; clicking it opens the drawer and a test query returns a grounded answer |

**Stage-gate enforcement**: three layers prevent S-A.3 and S-A.4 from being flipped before S-A.1 and S-A.2 complete:
- Wave 17 stamp-time: `stamp.mjs` blanks `WORKER_URL` at scaffold so the stamped component is born with an empty URL
- Wave 17 component-time: `ArchaeologyChat.tsx` renders a disabled "substrate not configured" button when `WORKER_URL` is empty (so even an erroneously-mounted component is harmless)
- Wave 18 operator-time: `ARCHAEOLOGY_READY = false` in `Layout.astro` means the component is never imported / mounted unless the operator explicitly flips the flag

The `portal-pattern-{a,b}-conformance-reviewer` agents do NOT gate Stage S-A — the substrate is initiative-side infrastructure, not portal chrome. The gate is the combination of the three runtime + stamp-time defenses above.

**Why the gates exist**: the promotions initiative (May 2026) deployed a live "Ask the substrate" widget pointed at the subscriptions initiative's reference Worker, because the canonical Layout stamped the component unconditionally AND the component's `WORKER_URL` was hardcoded to the source project. The widget surfaced the *other* initiative's suggested questions to this initiative's stakeholders. Waves 17 + 18 closed the leak at three layers; this stage codifies the correct lifecycle so future consumers know when the operator flag flip is earned.

## Tools

| Tool | Purpose | Location |
|------|---------|----------|
| **md-to-docs.mjs** | Convert markdown to HTML + Word | `docs/scripts/` |
| **forge-signal** | AI-powered document generation (when blog/thought-leadership voice is wanted) | External tool |
| **figma generator** | Design asset generation from Figma specs | External tool (private) |
| **Vercel** | Prototype deployment | `prototype/vercel.json` |
| **Strategy panel** | Embedded design decision context | `prototype/strategy-panel.js` |
| **Current-state panel** | Screenshot comparison | `prototype/current-state-panel.js` |
| **Chat widget** | AI agent for interactive exploration | `prototype/chat-widget.js` |

## Naming

Originally carried an employer-prefixed name following the platform's tooling conventions. Renamed to **Blueprint** on 2026-05-25 once the methodology proved project-agnostic across Rally HQ, Signal Dispatch, website-nc-v3, and the original platform work.

## Cross-Cutting Disciplines

The seven pipeline stages above describe *what to produce*. The following patterns describe *how to maintain the doc + decision surface that accumulates around a long-running initiative*. Apply per activation threshold; don't gold-plate small projects.

| Pattern | Activates when | What it codifies |
|---|---|---|
| [docs/patterns/doc-surface-discipline-pattern.md](docs/patterns/doc-surface-discipline-pattern.md) | >50 docs + ≥1 pivot | Two-surface model (canonical-present vs decision-lineage), 6-bucket classification, frontmatter convention |
| [docs/patterns/register-pattern.md](docs/patterns/register-pattern.md) | ≥1 pivot, or peer products to compare against | Immutable append-only registers — `invalidated-paths` (high-value default) + `differentiators` (optional) |
| [docs/patterns/tiered-orchestration-pattern.md](docs/patterns/tiered-orchestration-pattern.md) | Work > one operator-week + parallel-safe PRs | Orchestrator/Specialist/Implementer/Janitor tiering, wave sequencing, calibration discipline |
| [docs/patterns/inventory-as-evidence-pattern.md](docs/patterns/inventory-as-evidence-pattern.md) | Cleanup/reorg on >50 items | Read-only walk → classify → file as [Spec] body's evidence |
| [docs/patterns/doc-discipline-micro-patterns.md](docs/patterns/doc-discipline-micro-patterns.md) | Always (low overhead) | Small disciplines — surface-existing, capture-ambiguity, wrong-copy-is-signal, avoid multi-role templates |
| [docs/case-studies/prototype-vs-production-traceability-sweep.md](docs/case-studies/prototype-vs-production-traceability-sweep.md) | Post-major-arc closure OR quarterly baseline (initiatives with a `destination: product` meta cohort) | Recurring 4-link chain walk (research → meta → prototype HTML → production code) per product-destination meta; 5-verdict taxonomy (bug / refinement / open-question / already-reconciled / structural-divergence); meta-schema extensions; feeds prescription P-items |

These disciplines emerged from the subscriptions initiative (May 2026) and the rally-hq 17-meta fan-out (May 2026). When they apply, they belong cross-cutting (not as a pipeline stage) — the pipeline produces the deliverables; the disciplines keep the surface around the deliverables coherent.

The archaeology substrate, while it ingests artifacts the cross-cutting disciplines produce, is NOT a cross-cutting discipline — it has a discrete lifecycle and a stamp-gated UI surface. See "Optional Capability Stages" → Stage S-A above.

## Origin

Extracted from a pricing & packaging CX initiative at a commerce platform (March 2026) — real industry work, de-named here because this repo is public. Cross-cutting disciplines added May 2026 from the subscriptions initiative's doc-reorg work.
