---
canonical: true
---

# Portal Patterns, Shell, and the Tier Ladder

Canonical reference for how a Blueprint initiative externalizes itself across audiences, which portal pattern to choose, and how that surface evolves as the initiative matures.

## Why this exists

The first generation of Blueprint shipped a static-HTML "portal" template. It was a copy source, not a dependency. Three projects pulled it at different times — Signal Dispatch blog (`_providers.js` + `_shell.css` shape), Rally HQ (path-drifted to `blueprint/prototype/`), ninochavez.co v3 (`blueprint/portal/` v2 static). They drifted from each other and from the template.

The `bc-subscriptions` initiative built a *different* portal — Astro 5 + React 19 + Tailwind 3 consuming `@blueprint/ui` and `@blueprint/design-tokens` as workspace packages — with a 6-verb IA and audience switcher.

**Both are canonical.** They are two patterns for two different use cases, not two generations of one pattern. The drift between the four projects was real, but the fix isn't to collapse them into one shape. The fix is to name the two patterns explicitly and let each project pick the one that fits.

| Concept | What it is | Lives where |
|---|---|---|
| **Blueprint** | Methodology: research → prototype → docs → ship, with variant-aware stages and reviewer-agent gates | `METHODOLOGY.md`, `template/.claude/agents/blueprint/` |
| **Portal Pattern A** (platform-portal) | IA contract for the unified front door over a multi-audience product family | `template/apps/portal/` |
| **Portal Pattern B** (redesign-review-portal) | Strategy + current-state drawer + comparison-toggle shell for brownfield-audit review | `template/portal/` |
| **Shell** (Pattern A) | `@blueprint/ui` + `@blueprint/design-tokens` workspace packages | `template/packages/` |
| **Shell** (Pattern B) | Static HTML + `_portal-shell.js` + `shared.css` + Cloudflare Pages Functions | `template/portal/` |

Blueprint is methodology. Portal is information architecture. Shell is the component kit. There are two portals because there are two distinct audience-and-artifact shapes; each needs its own canonical shell.

## Variant × Tier matrix (read this before scaffolding)

**Variant** = pipeline shape (greenfield / midstream / brownfield), per `docs/variant-selection.md`. **Tier** = deliverable sophistication (0 / 1 / 2) — pre-portal scratch / portal app / portal + product surfaces. They are orthogonal axes; conflating them produced the three-session reconciliation on 2026-05-25.

|                 | Tier 0 (pre-portal) | Tier 1 (portal) | Tier 2 (portal + product) |
|---|---|---|---|
| **Greenfield** | ≤ 1 week pre-decision exploration only | **Default starting tier** for new initiatives | When a real product surface ships from day one |
| **Midstream**  | Not applicable — the product already exists | When the portal is the only mid-build artifact | Default — product exists, portal is the front door |
| **Brownfield** | Doc-only audit, no portal needed | Default for redesign-review work | When the audit ships a new product surface alongside |

Read the table this way: pick the variant first (decision tree in `docs/variant-selection.md`), then pick the tier (the bolded cell unless you have a reason to deviate). A greenfield initiative at Tier 0 is for ≤ 1 week of pre-decision exploration before committing to a portal — beyond that the deliberation belongs in `decisions/` ADRs, not in tier-0 scratch.

The previous methodology drift used "tier" and "variant" interchangeably (Tier 0 read as "the greenfield discovery phase"). They are not the same axis. A brownfield audit can be at Tier 0 (pure docs) or Tier 1 (Pattern B redesign-review portal). A midstream initiative is never at Tier 0.

## Choosing between Pattern A and Pattern B

Pick before scaffolding. Wrong choice produces retrofit feel that costs a full rebuild.

### Pattern A — platform-portal

**Use when:** the initiative is a product with multiple distinct surfaces and multiple audiences who each need a different lane into the artifact family.

- Multi-app monorepo or platform with separable surfaces (admin, storefront, API, SDK)
- Audiences: executive (strategy), evaluator (hands-on / trial evaluation), engineering (methodology + behind-the-scenes)
- Live demos embedded via iframe
- Hive / state-derive substrate optional
- **Canonical reference:** `bc-subscriptions` (`subs-portal.pages.dev`)

### Pattern B — redesign-review-portal

**Use when:** the initiative is a brownfield audit or redesign where stakeholders need to compare current-state vs. proposed-state, per-page, with strategy rationale and stakeholder chat alongside.

- Single-product redesign (brownfield variant typically)
- Audiences: redesign reviewers, the project owner, peer architects
- Per-prototype-page strategy + current-state drawers
- PROPOSED / COMPARE / SHIPPED comparison toggle
- AI chat FAB grounded in the project's content corpus
- **Canonical reference:** `apps/rally-hq` (`blueprint.rallyhq.app`) and `apps/website-nc-v3` (`blueprint.ninochavez.co`)

### Decision tree

```
Is the initiative a brownfield audit / redesign with a current-state vs. proposed comparison?
├── Yes → Pattern B (redesign-review-portal)
│   └── Static HTML + drawers + comparison toggle + chat FAB
└── No
    └── Does the initiative have multiple distinct surfaces and multiple audiences?
        ├── Yes → Pattern A (platform-portal)
        │   └── Astro + React + @blueprint/ui + @blueprint/design-tokens
        └── No → consider whether a portal is needed at all
            └── Solo-audience product (single-surface) may not need a portal.
                The product itself is the deliverable.
```

Pattern A and Pattern B can coexist in the same project if the surfaces are genuinely separate (e.g., a platform that also publishes audit docs). That's a Tier 2 monorepo with both `apps/portal/` (A) and `portal/` (B). Rare. Document via ADR.

## Pattern A — The IA contract (mandatory)

Every Pattern A portal exposes the same six verbs and the same audience switcher. Stack is project choice (Astro, SvelteKit, Next.js — fine, with `@blueprint/ui-svelte` etc. for non-React stacks). Routes and audience-switcher behavior are not.

| Route | Verb | Answers the question |
|---|---|---|
| `/` | (overview) | What is this, who is it for, how do I enter? |
| `/discover` | Discover | What's the bet? Strategy, PRD/BRD excerpts, north star. |
| `/try` | Try | Show me. Live demos + scenarios + prototypes. |
| `/build` | Build | How is it built? API, ADRs, SDKs, component kit, integration patterns. |
| `/operate` | Operate | How is it run? Merchant/admin/end-user guides, runbooks. |
| `/inspect` | Inspect | Show your work. Methodology, decision lineage, derived state, audits. |
| `/roadmap` | Roadmap | What's next? Epic progress, swimlanes, ready queue. |

**Audience switcher** in the top-right with three pills: **executive / evaluator / engineering**. Reorders lanes by priority for the viewing audience and persists to `localStorage`. Evaluator is default. Naming rationale: ADR-0001.

Routes ship with placeholder content if not yet authored. An empty `/operate` signals operate-mode hasn't been authored, not that it's been removed from the contract.

### Pattern A is not a deliberation venue

The portal is the stakeholder deliverable. It is not a workshop. It is not where you walk variant A / B / C side by side and ask "which one?" That work belongs in `blueprint/prototype/` (Tier 0 design-principles scratch) or in `decisions/` (ADRs).

Concrete consequences:

- **One confident preview per route.** No `try-a.astro` + `try-b.astro` + `try-c.astro`. Pick in the design-principles deliberation, ship one in the portal.
- **Index pages render a navigable map of the artifact family, not a multi-choice question.**
- **Copy reads declaratively, not interrogatively.**

The failure mode this prevents: agent reaches for the portal as a deliberation surface because variant-walking *feels* like the right shape for design exploration, ships a portal that asks stakeholders to choose between options, stakeholders correctly say "I came here for a preview, not a workshop." (Surfaced by the Signal Dispatch blog session on 2026-05-25.)

## Pattern B — The drawer contract (mandatory)

Every Pattern B portal exposes the same per-prototype-page chrome. Routes mirror the redesigned product's surface tree; the contract is the shell, not the IA.

### Required primitives per page

1. **Strategy drawer (right side)** — populated from `_meta/<page-id>.json` `strategy.*` fields. Surfaces the design rationale: what's the decision, why, what research / sources support it, what trade-offs were considered.
2. **Current-state drawer (left side)** — populated from `_meta/<page-id>.json` `currentState.*` fields. Surfaces a screenshot of the v2 (or pre-redesign) state with a "what changes" summary.
3. **Comparison toggle** — `PROPOSED / COMPARE / SHIPPED` view modes via `data-view` attribute on `<body>`. Lets reviewers flip between the three states without leaving the page.
4. **AI chat FAB** — Cloudflare Pages Function at `functions/api/chat.js`. Backed by the project's content corpus (Vectorize index, RAG over project docs). Lets stakeholders ask "why this decision" or "what's the source for X" without leaving the portal.
5. **Page-level metadata** — `_meta/<page-id>.json` per prototype page. Pages declare only `window.PROTO_PAGE = { id: '<page-id>' };` in HTML; all other state lives in JSON (I-2 invariant).
6. **Cross-cutting providers** — `_portal-shell.js` (or `_providers.js` in v1) is the single source for drawer + toggle + chat behavior (I-3 invariant).
7. **CSS coverage** — `shared.css` is the single token + layout primitive source. No orphan styles. Component-specific styles co-locate with the page (I-5 invariant).

### Pattern B is also not a deliberation venue

Same rule as Pattern A: one confident preview per route. The COMPARE toggle is the comparison primitive; multiple A/B variants of the same page are not. If you have two competing redesign approaches, walk them in `prototype/` (Tier 0), pick one, ship that in the portal.

### Pattern B deployment

The Pattern B portal deploys as a separate Cloudflare Pages project (e.g., `ninochavez-blueprint` paired with `ninochavez-main`). Zero build pipeline — static HTML + Pages Functions. Custom domain typical (`blueprint.<host>` paired with the redesigned product at `<host>`).

The paired-deploy pattern lets the portal stay `noindex` while the redesigned product ships at the canonical URL. Strategy + current-state + chat live separate from the product they review.

## The shell

### Pattern A canonical packages

Two workspace packages live in `template/packages/` and are consumed by `template/apps/portal/`:

**`@blueprint/design-tokens`** — framework-agnostic OKLCH tokens, Tailwind 3 preset, CSS variables, types.

| Export | Purpose |
|---|---|
| `./css` | `:root { --…; }` CSS variables for any framework |
| `./tailwind` | Tailwind preset extending colors/spacing/type-scale |
| `./tokens` | Raw `tokens.json` for design-time tooling |
| `./types` | TypeScript type definitions |

**`@blueprint/ui`** — React component library, Storybook dev surface, monolith + composable dual API.

Portal-specific primitives: `Shell`, `NavBar`, `AudienceSwitcher`, `LaneCard`, `StatusBadge`, `LiveIframe`. Generic kit: `Button`, `Badge`, `Alert`, `Card`, `Tabs`, `Modal`. Roadmap viz: `Swimlane`, `TaskBar`, `DependencyArrow`. Subpath exports (`@blueprint/ui/shell`, etc.) for tree-shaking.

### Pattern B canonical shell

The Pattern B shell lives at `template/portal/` and is consumed by **copy-stamp**, not workspace-link. The static-HTML shell is deliberately zero-build — adding a dependency-resolution step defeats the "deploys in one push" property that makes Pattern B fast.

Contents:

| Path | Purpose |
|---|---|
| `index.html` | Portal entry (renders cards from `_meta/index.json` manifest) |
| `shared.css` | Tokens, layout primitives, components (single source) |
| `_portal-shell.js` | Drawers, comparison toggle, flow mode, page metadata wiring |
| `chat-widget.js` | AI chat FAB (UI; backend in `functions/api/chat.js`) |
| `proto-nav.js` | Footer nav + drawer toggles |
| `proto-annotate.js` | Annotation overlay (opt-in stakeholder notes) |
| `_meta/index.json` | Portal manifest: groups, pages, flows |
| `_meta/<page-id>.json` | Per-prototype-page metadata (strategy + currentState fields) |
| `pages/` | Per-prototype-page HTML files |
| `functions/api/chat.js` | Pages Function: AI chat backend |
| `_headers`, `_redirects`, `wrangler.toml` | Cloudflare Pages config |

### Divergence rule (canonical-pattern-first, both patterns)

Custom shells must justify themselves against the canonical for the chosen pattern. Naming the canonical, naming the disqualifier, choosing the alternative — all in an ADR. Silence is not an acceptable answer. Same rule as auth/payments infrastructure.

Examples of legitimate divergence (each requires an ADR):

- Pattern A with SvelteKit instead of Astro+React → cite `@blueprint/ui-svelte` (when it ships) or shim against `@blueprint/design-tokens`
- Pattern B with build pipeline (e.g., add a CSS bundler) → cite the performance or DX gain that justifies leaving zero-build
- Pattern B replacing strategy drawer with side-by-side full-screen panels → cite the audit shape that requires it

## The tier ladder (orthogonal to pattern choice)

A Blueprint initiative occupies one tier at a time. The tier ladder applies independently of which portal pattern the initiative uses.

### Tier 0 — Idea

- `decisions/` (ADRs, optional at this tier), `research/`, optional `prototype.md` for design-principle scratch
- **No portal yet.** This tier is pre-portal.
- Expected duration: ≤ 1 week.

### Tier 1 — Portal

- A portal exists. Either Pattern A (`apps/portal/`) or Pattern B (`portal/`) — pick by the decision tree above.
- All required primitives for the chosen pattern are present (6 IA routes + audience switcher for A; drawers + toggle + chat + I-2/I-3/I-5 invariants for B).
- Content can be placeholder for routes/pages not yet authored.
- **This is the default starting tier for any serious initiative.** New initiatives scaffold straight to Tier 1.

### Tier 2 — Production + portal

- Monorepo with the portal **plus** one or more product surfaces.
- Pattern A Tier 2: `apps/portal/` + `apps/<product>/`. The portal links to product surfaces; it does not contain them.
- Pattern B Tier 2: `portal/` + `apps/<product>/` (or `src/` for single-app projects). The portal reviews the product; the product ships separately.
- `bc-subscriptions` is the canonical Pattern A Tier 2 reference.
- `apps/website-nc-v3` is the canonical Pattern B Tier 2 reference (post-graduation; currently on the redesign branch).

**The portal is forever.** Even at Tier 2, the portal stays. It gains depth (live iframes for A; populated drawers / chat corpus / shipped comparisons for B) but doesn't get deleted.

## Migration recipe for existing projects

For projects sitting at an older or path-drifted portal:

1. **Determine the pattern.** Is the project a multi-audience platform (A) or a brownfield audit/redesign (B)? Check by use case, not by current implementation — implementation may have drifted from intent.
2. **Determine the tier.** Has the project shipped product surfaces yet, or is the portal still the only deliverable? Tier 1 vs Tier 2.
3. **Audit the current shell against the canonical for the chosen pattern.**
   - Pattern A: are the 6 IA routes present? Is `@blueprint/ui` imported (not copy-pasted)? Audience switcher rendered?
   - Pattern B: are drawers, comparison toggle, chat FAB, I-2/I-3/I-5 invariants honored? Is `_meta/<page-id>.json` populated per page?
4. **Fix only what diverges.** Pattern B projects that path-drifted (e.g., `blueprint/prototype/` instead of `blueprint/portal/`) get renamed in place. Pattern A projects that are still on Tier 0 static HTML get a separate apps/portal/ Astro app.
5. **Archive only if the project graduated past the portal.** If the initiative was Tier 0 design-principles scratch (variant-walking workshop) that has now produced a single confident product, the workshop scratch goes to `_archive/`. The portal stays.

## Applied to the four reference projects (as of 2026-05-25)

| Project | Pattern | Current tier | Migration |
|---|---|---|---|
| `bc-subscriptions` | A — canonical | Tier 2 | None. This is the source of `@blueprint/ui` + `@blueprint/design-tokens` + `apps/portal/`. |
| `apps/website-nc-v3` | B — canonical (per ADR-0008) | Tier 2 (in flight on redesign branch) | None for the portal pattern itself. Continue ADR-0008's paired-deploy buildout. Optional follow-up: convert Pattern B static HTML to Astro consuming `@blueprint/design-tokens` (keeps Pattern B chrome, gains token consistency) — future ADR. |
| `apps/rally-hq` | B — canonical | Tier 2 | Rename `blueprint/prototype/` → `blueprint/portal/` (path drift only). Otherwise conformant. |
| `apps/blog` | B — pre-pivot (still on v1 `_providers.js` + `_shell.css`; the v1→v2 shell upgrade hasn't landed) | Tier 1 → Tier 2 | Two paths: upgrade to v2 Pattern B shell (drawers + toggle + chat), or graduate past the portal entirely if the redesign is shipping at `astro-build/` and no audit review is needed. The blog session is currently rebuilding from variant-walking v1 to confident-preview v2 — that work covers the upgrade. |

## What this doc replaces / supersedes

- The implicit "copy the portal directory" pattern in the previous template
- Any per-project README guidance about portal structure that predates 2026-05-25
- The earlier draft of this doc (2026-05-25, earlier today) that collapsed both patterns into a single tier ladder over Pattern A only

When in doubt: blueprint is process, portals are IA contracts (two patterns, A or B), shells are component kits (one per pattern).

## Open questions tracked as ADRs

- **Pattern A v2 reviewer**: ~~the existing `portal-shell-conformance-reviewer` checks Pattern A only. A parallel Pattern B reviewer is required.~~ **Resolved 2026-05-25.** Both reviewers ship in `template/.claude/agents/blueprint/reviewers/portal-pattern-a-conformance-reviewer.md` and `portal-pattern-b-conformance-reviewer.md`. Wired into the reviewer roster as Stage 3 + portal-touching-commit gates.
- **Pattern B Astro variant**: should Pattern B keep static HTML or move to Astro consuming `@blueprint/design-tokens`? Trade-off: zero-build property vs. design-token consistency with Pattern A. Future ADR.
- **`@blueprint/ui-svelte` parity**: when does the React-only `@blueprint/ui` get a Svelte equivalent for Pattern A SvelteKit consumers? Demand-driven.
- ~~**Audience switcher pill naming**: bc-subscriptions uses `executive / discovery / internal`. "Internal" is overloaded. ADR candidate.~~ **Resolved 2026-05-25.** Renamed to `executive / evaluator / engineering` per [ADR-0001](decisions/0001-audience-pill-naming.md). Storage-key prefix cleanup (`bcs-` → `blueprint-`) tracked as follow-up ADR-0002.
- **Pattern coexistence**: when a project genuinely needs both A and B portals (multi-audience platform that *also* publishes audit work), how does the workspace plumb both? Single project with `apps/portal/` (A) and `portal/` (B)? Future ADR.
