---
canonical: true
stage: 1
status: seeded
sources:
  - 02-blueprint-production-quality-gaps.md
  - ../../METHODOLOGY-AMENDMENTS.md (2026-05-26 entry — design-discipline track)
---

# Portal surface audit — `portal/` as the L5 inventory

First proof-of-concept for the Stage 1 design-discovery sub-track proposed in the 2026-05-26 methodology amendment. Inventory of every surface, component, content artifact, and auth boundary in this initiative's `portal/` deliverable, organized by atomic-design levels (L0 tokens → L5 pages).

The reason this artifact exists: the methodology amendment claims Stage 1 should produce inventory-led artifacts before Stage 2 design-system work begins. This is the smallest brownfield test of that claim — Blueprint's own portal, scoped tightly enough to audit fully, structured enough to surface gaps the amendment predicts.

## L5 — Surface inventory

11 rendered surfaces across 4 surface types. All public (`<meta name="robots" content="noindex, nofollow">` on every page; no token gates, no auth state).

### Front door (1 surface)

| Route | File | Purpose | Primary affordance | Content source |
|---|---|---|---|---|
| `/` | `portal/index.html` | Audience-first landing | Audience pill switcher → flow entry | Hand-authored hero + flow cards |

### Wedge pages (5 surfaces — one per `_meta/index.json#pages`)

| Route | File | Purpose | Primary affordance | Content source |
|---|---|---|---|---|
| `/pages/gap-inventory.html` | `gap-inventory.html` | Stage 1 diagnose | Compare toggle (current/proposed) + gap grid | Hand-coded HTML, references `research/current-state/02-*.md` |
| `/pages/distribution-shape.html` | `distribution-shape.html` | Wedge 1 prescription | Compare toggle + wedge body | Hand-coded HTML, references `decisions/ADR-0001-*.md` |
| `/pages/reviewer-execution.html` | `reviewer-execution.html` | Wedge 2 prescription | Compare toggle + wedge body | Hand-coded HTML, references `decisions/ADR-0002-*.md` |
| `/pages/ai-hive-companion.html` | `ai-hive-companion.html` | Companion explainer | Stack diagram + integration shape | Hand-coded HTML, references `research/current-state/01-*.md` |
| `/pages/shipping-order.html` | `shipping-order.html` | Timeline / rollout | Phase grid + dependency map | Hand-coded HTML |

### Docs viewer (1 surface, dynamic content from manifest)

| Route | File | Purpose | Primary affordance | Content source |
|---|---|---|---|---|
| `/docs/index.html` | `docs/index.html` | Tiered doc reader | Sidebar (manifest-driven tiers) + main pane (markdown render) | `_meta/index.json#docs.tiers[]` + `_docs/<id>.md` |

### Prototype studio (1 surface)

| Route | File | Purpose | Primary affordance | Content source |
|---|---|---|---|---|
| `/prototype/index.html` | `prototype/index.html` | Pattern B prototype shell | Sticky top nav + design grid + slot for prototype iframes | Hand-authored shell (no prototype iframes seeded yet) |

### Chrome (3 surfaces — JS-injected layers over the above 8)

Not standalone routes, but rendered on every page that includes the script:

| Layer | File | Purpose | Page contract |
|---|---|---|---|
| Proto-nav | `proto-nav.js` | Top-nav + drawers + compare toggle + flow breadcrumb | Pages declare `window.PROTO_PAGE = { id }`; chrome reads `_meta/index.json` + `_meta/<id>.json` to render |
| Proto-annotate | `proto-annotate.js` | Operator annotation overlay | Toggle via keyboard chord; persists to `localStorage` under `blueprint-anno-*` keys |
| Chat widget | `chat-widget.js` | AI assistance overlay | POSTs to `functions/api/chat.js` Cloudflare Function |

**Surface count by category**: 1 front door + 5 wedge pages + 1 docs viewer + 1 prototype studio + 3 chrome layers = 11 named surfaces. Two unrendered referenced surfaces (`functions/api/chat.js` endpoint, `_portal-shell.js`) are infrastructure, not user-facing.

## L0 — Token inventory

Source of truth: `portal/shared.css` `:root` block (canonical chrome — byte-identical to template). Overrides in `portal/project-tokens.css` (consumer seam — currently empty/commented).

Token families declared:
- **brand-** (50/100/300/500/600/700/900) — Electric Indigo
- **arena-** (50–950, 11 stops) — Navy-based neutral
- **victory-** (300/500/600) — Gold accent
- **live-** (500/600) — Coral live-state accent
- **semantic** — `success-500`, `error-500`
- **surfaces** — `bg`, `surface-1`, `surface-2`, `card`, `card-border`, `cta-bg`, `header-bg`
- **text** — `primary`, `secondary`, `muted`, `on-dark`, `on-dark-muted`
- **type** — `font-hero`, `font-display`, `font-body`, `font-mono`
- **spacing scale** — `space-1` through `space-16` (8px-base rhythm)
- **radii** — `radius-sm`/`md`/`lg`
- **shadows** — `shadow-sm`/`md`/`lg`

**Token-inventory gap**: the comment header explicitly says the defaults are "Rally HQ's Midnight & Copper system as a reference baseline" — this initiative inherited Rally HQ tokens via the canonical chrome and has not declared its own. `project-tokens.css` is entirely commented-out scaffolding. The L0 layer is **borrowed**, not authored, for this initiative.

## L1 — Atom inventory

Declared in `shared.css` as canonical-chrome utilities + components. Atomic primitives identifiable from the CSS:

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-tertiary`
- **Pills / chips**: `.audience-pills` (segmented selector), `.wedge-label` (tag pill with `.distribution`/`.portability`/`.independent` variants)
- **Logo / brand mark**: `.logo` + `.logo-accent`
- **Labels**: `.label` (mono uppercase with dot prefix)
- **Containers**: `.container` (max-width + horizontal padding)
- **Cards**: `.card`, `.card-border` token usage
- **Headers**: `.header`, `.brand-mark`
- **Compare toggle**: `[data-compare-root]` + `[data-view]` attribute pair (proposed/current switch)

Per-page additions (declared in `<style>` blocks inside individual pages, NOT promoted to chrome):
- `.gap-grid` (4-column grid for gap inventory) — only used in `gap-inventory.html`
- `.hero-row` / `.hero-lead` (front-door hero pairing) — only used in `index.html`
- `.doc-shell` / `.doc-nav` / `.tier-label` (docs sidebar primitives) — only used in `docs/index.html`
- `.top-nav` / `.brand-mark` overrides — declared per-page in prototype studio

## L2 — Molecule inventory

Composed from atoms; appears across multiple surfaces.

| Molecule | Composition | Surfaces using it |
|---|---|---|
| Header brand strip | `.header` + `.logo` + `.logo-accent` | Front door, all 5 wedge pages |
| Audience pill switcher | `.audience-pills` + pill atoms | Front door only |
| Compare toggle pair | `[data-compare-root]` + `[data-view]` + `.current-view` / `.proposed-view` sections | All 5 wedge pages |
| Wedge label badge | `.wedge-label` + variant class | `gap-inventory.html` (cross-references show wedge ownership) |
| Tier blurb (docs sidebar) | `.tier-label` + `.tier-blurb` + `em` accent | `docs/index.html` only |

**Molecule inventory gap**: the compare-toggle pair is the highest-value molecule (used on 5 surfaces) but its contract is implicit — `[data-view="proposed"]` on `<body>` toggles which `.current-view` / `.proposed-view` section displays. The convention is documented in `CONVENTIONS.md` but the molecule itself is not named or extracted as a reusable primitive.

## L3 — Organism inventory

Larger composed sections; each typically owns ~30–80% of a surface's vertical space.

| Organism | Where it lives | Cross-surface? |
|---|---|---|
| Front-door hero row (`.hero-row`) | `index.html` | One-off |
| Audience flow grid (cards routed by pill switcher) | `index.html` | One-off |
| Compare-view section pair (`.current-view` + `.proposed-view`) | All 5 wedge pages | Yes — 5 surfaces |
| Gap grid (4-column with cross-references) | `gap-inventory.html` | One-off |
| Wedge body (prescription + ADR refs) | `distribution-shape.html`, `reviewer-execution.html` | 2 surfaces, similar shape |
| Companion stack diagram | `ai-hive-companion.html` | One-off |
| Phase grid + dependency map | `shipping-order.html` | One-off |
| Doc shell (two-column sidebar + main) | `docs/index.html` | One-off |
| Prototype-studio shell (sticky nav + design grid) | `prototype/index.html` | One-off |
| Proto-nav chrome (top-nav + drawers + breadcrumb) | All pages with the script | Yes — chrome |
| Annotation overlay | All pages with the script | Yes — chrome |
| Chat widget | All pages with the script | Yes — chrome |

**Organism inventory gap**: only 3 organisms are cross-surface (compare-view, proto-nav chrome, annotation overlay, chat widget — 4 if you count chrome separately). Of the 9 non-chrome organisms, 7 are one-offs. This is the textbook L3 sparsity the amendment names: each surface invents its own composition because no organism dictionary tells the author which compositions are canonical.

## L4 — Template inventory

**None.** No template / page-archetype declarations exist anywhere in `portal/`.

Implicit templates observable by inspection (what archetypes WOULD be declared if extracted from the inventory above):

1. **Front door** (1 instance) — landing with audience switcher + flow entry. Distinctive layout, unlikely to recur.
2. **Wedge page** (5 instances) — `gap-inventory`, `distribution-shape`, `reviewer-execution`, `ai-hive-companion`, `shipping-order`. Shared shape: header + compare-toggle + body sections. The strongest template candidate by far — already used 5 times, no canonical declaration.
3. **Docs viewer** (1 instance) — two-column sidebar + main reader. Single instance; could be declared as the canonical Pattern B docs archetype since the methodology already treats it as canonical chrome.
4. **Prototype studio** (1 instance) — sticky nav + design grid. Single instance; canonical Pattern B prototype archetype.

**L4 gap**: the wedge-page archetype is used 5 times with no canonical contract — each page rebuilds the same shape from atoms. This is the highest-leverage template extraction opportunity in the portal.

## Content inventory

Manifests: `_meta/index.json` (portal manifest — pages, flows, docs tiers, footer) + 5 per-page metadata files (`gap-inventory.json`, `distribution-shape.json`, `reviewer-execution.json`, `ai-hive-companion.json`, `shipping-order.json`).

Docs: 9 markdown files duplicated into `_docs/` from canonical authoring paths in `decisions/` + `research/`. The duplication is the gap captured in the 2026-05-25 amendment (`_meta` `source` field added to methodology wave 6 but consumer not yet migrated).

Prototypes: zero. The prototype studio at `prototype/index.html` has the shell but no prototype iframes have been authored for this initiative yet.

Owner specs: 3 (`proto-annotate.OWNER-SPEC.md`, `proto-nav.OWNER-SPEC.md`, `functions/api/chat.OWNER-SPEC.md`) — the contracts between chrome JS and consumer integration.

## Auth-boundary map

| Tier | Surfaces |
|---|---|
| Public | All 11 surfaces. `noindex,nofollow` set but no token gate. |
| Token-gated | None. |
| Authenticated | None. |
| Operator-only (client-side) | Annotation overlay (toggled via keyboard chord; not exposed in UI) |

Single-tier portal. The annotation overlay is the only operator-vs-stakeholder differentiation, and it's client-side enable, not a server boundary.

## Cross-surface patterns (candidates for L2/L3 extraction)

Eight patterns observed on ≥2 surfaces that are not currently declared as named primitives:

1. **Header brand strip** — recurs on all 5 wedge pages with identical structure; not extracted as a chrome component.
2. **Compare-toggle pair** — molecule used on all 5 wedge pages; declared as a chrome contract (`[data-compare-root]` + `[data-view]`) but no named primitive in CSS or JS.
3. **Section meta-strip** — date / status / wedge-tag combinations recur per page; ad-hoc formatting per surface.
4. **Cross-reference link block** — "see also" links between gap-inventory ↔ wedge pages ↔ ADRs; rolled fresh per page.
5. **Phase / step number badge** — number-in-circle pattern used in gap-inventory grid AND shipping-order grid; two distinct implementations.
6. **Two-column rail layout** — docs viewer uses it; could generalize to whitepaper/long-form pages if they existed.
7. **Sticky top-nav** — prototype studio defines `.top-nav` per-page; the front door and wedge pages use a non-sticky `.header`. Two top-nav patterns, no canonical.
8. **Wedge-label / tag pill** — declared once in `gap-inventory.html` `<style>` block, never promoted to shared chrome.

## Per-archetype profile table

Bridge from L5 inventory → L4 template extraction. For each archetype identified in the surface inventory, declare: who reads it, primary job, shell variant, hero pattern, section structure, nav presence, footer presence. (Section backfilled 2026-05-26 per the cross-audit reconciliation in `research/architecture/02-stage1-design-audit-template.md` — the original audit version missed this section; the cross-audit promoted it as universal.)

| Archetype | Instances | Who reads | Job | Shell variant | Hero | Sections | Nav | Footer |
|---|---|---|---|---|---|---|---|---|
| Front door | 1 (`index.html`) | New stakeholder | Pick a flow / audience | `frontdoor` — full-width, audience-pill switcher | Required (problem-led + pill switcher) | 1 (flow card grid) | `.header` brand strip | Brand footer with repo link |
| Wedge page | 5 (`gap-inventory`, `distribution-shape`, `reviewer-execution`, `ai-hive-companion`, `shipping-order`) | Reviewing stakeholder | Compare current vs proposed | `wedge` — body width, compare-toggle root | None (page-title header only) | 2+ (`.current-view` + `.proposed-view` mutually exclusive) | `.header` brand strip + proto-nav chrome (top nav + drawers) | Brand footer |
| Docs viewer | 1 (`docs/index.html`) | Stakeholder doing deep read | Read tiered docs (Stage 1 research + Stage 2 prescription + ADRs) | `docs` — two-column sidebar + main pane | None | Sidebar tiers (manifest-driven) + main markdown pane | Sidebar serves as nav | Brand footer |
| Prototype studio | 1 (`prototype/index.html`) | Stakeholder reviewing UI prototype | Inspect prototype iframes against design grid | `studio` — sticky top-nav + design grid + iframe slot | None | Iframe payload (currently empty) | Sticky `.top-nav` (per-page, NOT shared with chrome) | None |

**L4 template candidates** ordered by extraction leverage (count of instances × cross-archetype shape similarity):

1. **`WedgePageTemplate`** — 5 instances, identical structural shape (header + compare-toggle root + current/proposed view pair + body sections + footer). Strongest extraction candidate; would close audit-gap 1 single-handedly.
2. **`DocsViewerTemplate`** — 1 instance but Pattern B chrome treats it as canonical (`shared.css` declares the layout primitives). Could be promoted as a canonical archetype since the methodology repo already encodes it.
3. **`PrototypeStudioTemplate`** — 1 instance, also Pattern B chrome canonical. Same promotion path as docs viewer.
4. **`FrontDoorTemplate`** — 1 instance, distinctive layout (audience-pill switcher). Lowest extraction leverage unless multiple consumer initiatives need front-door archetypes; deferred.

The wedge-page archetype is the highest-leverage L4 extraction because it captures the cross-surface composition that 5 separate `.html` files currently rebuild from atoms. The other three archetypes are single-instance canonical chrome that could be declared as templates with no migration cost.

## Named gaps the audit reveals

Listed in order of leverage (closing each gap shortens the next):

**Audit-gap 1** — L4 absent. No template declarations exist; the wedge-page archetype is used 5 times without a canonical contract. This is the load-bearing gap the methodology amendment predicts.

**Audit-gap 2** — L0 borrowed, not authored. `project-tokens.css` is entirely commented-out. The initiative inherited Rally HQ's Midnight & Copper palette via canonical chrome; no token decisions have been made for Blueprint-the-product itself.

**Audit-gap 3** — L3 sparsity. 7 of 9 non-chrome organisms are one-offs. Without an organism dictionary, every new surface invents its own composition.

**Audit-gap 4** — L2 implicit contracts. Compare-toggle works via DOM-attribute convention documented in prose (`CONVENTIONS.md`), not declared as an extractable primitive.

**Audit-gap 5** — Per-page `<style>` proliferation. 4 distinct surfaces declare unique CSS in inline `<style>` blocks (`.gap-grid`, `.hero-row`, `.doc-shell`, `.top-nav` variants). These are page-specific compositions that should either land in chrome (if recurring) or in `project-tokens.css` component blocks (if initiative-specific). They live nowhere a dictionary would find them.

**Audit-gap 6** — Cross-surface patterns un-named (8 candidates, listed above).

**Audit-gap 7** — Prototype studio is empty. The shell exists; no prototype iframes have been authored. Tier 1 portal pattern technically allows this, but the design-discovery audit reveals that the L5 inventory is incomplete until the prototype payloads exist.

## What this audit validates about the amendment

Two methodology claims tested against a real consumer initiative:

1. **"Stage 1 should produce inventory-led artifacts before Stage 2 design-system work."** Validated. Writing this audit took ~10 minutes of structured inspection and surfaced 7 named gaps that would have been invisible to a principles-derived design-system definition. The L5 inventory predicts the L4 template-extraction opportunities deterministically.

2. **"Bug cluster on one page = L4 missing, not L1 wrong."** Validated by proxy. The 4 surfaces with proliferating per-page `<style>` blocks (audit-gap 5) are the exact symptom this diagnostic test predicts — page-specific CSS multiplies when the template/organism layer doesn't exist to absorb composition decisions.

## What this audit does NOT do

- It does not propose the closure (the L4 template dictionary). That's Stage 2 work. The amendment recommends Option 1 (`forge-site` archetypes folded into methodology), and Stage 2 design-system definition derives templates from this audit + the archetype reference.
- It does not propose L0 token decisions for Blueprint-the-product. Audit-gap 2 names the gap; Stage 2 brand work closes it.
- It does not audit consumer initiatives beyond this one. The methodology promotion will require running the same audit shape against Rally HQ, the blog redesign, and subs-initiative to confirm the framing generalizes.

## Next moves

1. **For this initiative**: Stage 2 design-system definition (L0 tokens authored for Blueprint-the-product + L3/L4 dictionary derived from this audit + L4 template extraction starting with the wedge-page archetype).
2. **For methodology promotion**: capture the audit shape (sections, level coverage, gap-naming convention) as the canonical Stage 1 design-discovery template. Run the same audit shape against Rally HQ and the blog to confirm the framing holds across variants.
3. **For the amendment**: cite this artifact as the first proof-of-concept evidence when the amendment is promoted to methodology.
