---
canonical: true
stage: 2
status: seeded
date: 2026-05-26
supersedes: none
informs:
  - portal/_meta/index.json (manifest)
  - portal/project-tokens.css (consumer overlay)
sources:
  - ../research/current-state/03-portal-surface-audit.md
  - ../research/architecture/02-stage1-design-audit-template.md
  - ../METHODOLOGY-AMENDMENTS.md (2026-05-26 design-discipline track entry)
---

# Stage 2 Design System — Portal v1

The L0–L4 dictionary the portal needs to stop reinventing composition per surface. Derived deterministically from the Stage 1 audit (`research/current-state/03-portal-surface-audit.md`) per the canonical Stage 1 → Stage 2 workflow proposed in `research/architecture/02-stage1-design-audit-template.md`.

This artifact closes the 7 named audit-gaps from the portal surface audit by naming each level of the atomic-design stack and the composition contracts each level carries. It does **not** invent the brand layer — token color decisions are explicitly deferred to brand work because inventing them now would reproduce the exact "agent fills void with templates" failure mode the methodology amendment exists to fix.

## What this artifact is

A dictionary, not a manifesto. Five levels (L0 tokens, L1 atoms, L2 molecules, L3 organisms, L4 templates) each declared with name + purpose + composition rules + canonical instance. Implementation is the next step — the existing `portal/` surfaces get migrated against the dictionary surface-by-surface.

The boundary: Stage 2 produces the dictionary. Stage 3 implements against it. The audit-gap closure in this document is structural (the L4 template exists once it's named); the visible-rendering closure happens in Stage 3 when the existing 5 wedge-page `.html` files are migrated to consume the template.

## What this artifact does NOT do

- Does not propose color palette / typography / brand identity for Blueprint-the-product. Audit-gap 2 names the gap (`project-tokens.css` is empty; L0 is borrowed from Rally HQ Midnight & Copper). Closing audit-gap 2 requires brand work that is out of scope here — the right closure is `forge-brand` invocation or operator-led brand decisions, not an agent-derived palette.
- Does not migrate existing surfaces. The 5 wedge-page `.html` files keep their hand-coded shape; migration is Stage 3 work scoped per surface.
- Does not propose changes to canonical chrome (`shared.css`, `proto-nav.js`, `proto-annotate.js`, `chat-widget.js`). The chrome is canonical and edits land via methodology PRs, not consumer decisions. This artifact builds **on top of** canonical chrome via `project-tokens.css` overrides + new initiative-specific primitives.

---

## L0 — Token decisions

Two classes of L0 work. Class A is **decided** (structural tokens that don't depend on brand choices). Class B is **deferred** (color/type/visual identity tokens that require brand work).

### Class A — Decided structural tokens

These already exist in canonical chrome (`shared.css`) and require no overrides. They are inherited by every Blueprint Pattern B portal and are correct for this initiative without modification:

- **Spacing scale** — `--space-1` through `--space-16` on an 8px base rhythm. Use exactly these; no off-grid values in `project-tokens.css` or per-page `<style>` blocks.
- **Radius scale** — `--radius-sm` / `--radius-md` / `--radius-lg`. Pick one of three per component; do not invent intermediate values.
- **Shadow scale** — `--shadow-sm` / `--shadow-md` / `--shadow-lg`. Same rule.
- **Layout container max-widths** — `--container-narrow` (720px), `--container-normal` (1200px), `--container-wide` (1400px). The wedge-page template uses `normal`; the docs viewer uses `narrow` for the main pane.
- **Type stack roles** — `--font-display` (hero/headings), `--font-body` (prose), `--font-mono` (metadata + code). Actual font-family values are Class B.

### Class B — Deferred brand-level tokens

These need brand decisions before being authored into `project-tokens.css`. Documenting the decision points so the next session does not silently borrow Rally HQ's palette:

| Token family | Decision needed | Current state |
|---|---|---|
| `--brand-50` through `--brand-900` | What is Blueprint-the-product's brand hue? Currently using Rally HQ's Electric Indigo (hsl 235) as default. | Borrowed. **Deferred.** |
| `--bg`, `--surface-1`, `--surface-2` | Light/warm-neutral (Rally HQ's Midnight & Copper baseline) or something else? | Borrowed. **Deferred.** |
| `--cta-bg`, `--header-bg` | Inverted-section treatment. Same Navy as Rally HQ or distinct? | Borrowed. **Deferred.** |
| `--font-display`, `--font-body` | Type stack. Inter + JetBrains Mono is the current default; display font is Anton (questionable for Blueprint-the-product's editorial register). | Borrowed + provisional. **Deferred.** |
| `--victory-*`, `--live-*` | Accent colors (Rally HQ-specific semantics). Likely irrelevant for Blueprint-the-product; rename or remove. | Borrowed. **Defer with intent to drop.** |

**Closure path**: invoke `forge-brand` with the Blueprint-the-product brand brief (or author the brand decisions directly into `project-tokens.css`). Until then, the borrowed palette is **flagged but not changed** — leaving it as-is honors audit-gap 2 by making the borrowing visible, instead of papering over it with an agent-invented alternative.

---

## L1 — Atom dictionary

Catalog of every atom in use. Marker convention from cross-audit: ✓ exists in canonical chrome, ✗ absent / inline, ◐ partial.

### Inherited from canonical chrome (✓)

- **Button** — `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-tertiary`. Composition: text + optional icon, single line, padding from `--space-3`/`--space-4`.
- **Container** — `.container`. Max-width per Class A scale; horizontal padding from `--space-4`.
- **Card** — `.card` + `.card-border`. Background `--card`, border `--card-border`, radius `--radius-md`.
- **Label** — `.label`. Mono uppercase with optional dot prefix; used for metadata.

### Initiative-extracted (○) — currently inline; promote to `project-tokens.css` component blocks

- **Logo / brand mark** (○) — `.logo` + `.logo-accent` pair. Used on every page; currently declared in canonical chrome but with brand-specific accent treatment. Move accent color to `--brand-500` via project-tokens.
- **Wedge label badge** (○) — `.wedge-label` with `.distribution` / `.portability` / `.independent` variants. Currently declared in `portal/pages/gap-inventory.html` `<style>` block only; used in cross-references on multiple pages. **Promote to `project-tokens.css`.**
- **Format / status pill** (◐) — pill-shape with optional dot indicator. Used inline in several wedge pages. **Promote to `project-tokens.css`.**

### Cross-audit-recommended (✗) — missing primitives the dictionary should name

- **Link variants** — text-link, nav-link, footer-link. Currently ad-hoc per surface. Declare three variants with explicit hover/focus/active states.
- **Input primitives** — text, search, textarea. Not yet used in this initiative; declare for forward compatibility when authenticated surfaces eventually exist.
- **Anchor / heading anchor** — invisible-until-hover `#` anchor on `<h2>` / `<h3>` headings in long-form docs. Currently absent in the docs viewer; declare for parity with conventional documentation sites.

---

## L2 — Molecule dictionary

The 8 cross-surface patterns identified in the audit (audit-gap 6) become named molecules. Each is declared with composition + variants + canonical instance.

### M1 — Header brand strip

Composition: `.container > .logo + .logo-accent + [optional .nav-strip]`
Variants: `default` (light background, used on all wedge pages + front door), `inverted` (dark background, used on no current surface — declared for forward compatibility).
Canonical instance: `portal/index.html` header. Currently rebuilt per page.
**Closes audit-gap 6 pattern 1.**

### M2 — Compare-toggle pair

Composition: `<body data-compare-root data-view="current|proposed"> + section.current-view + section.proposed-view`
Contract: `data-view` attribute on `<body>` switches which `section` displays. Toggle UI provided by chrome `proto-nav.js`; this molecule declares the page-side DOM contract.
Variants: `binary` (current/proposed, default), `single-state` (only proposed — for surfaces that don't yet have a current-state to compare against).
Canonical instance: all 5 wedge pages.
**Closes audit-gap 4** (implicit contract → named primitive).

### M3 — Section meta-strip

Composition: `.meta-strip > [date] · [status] · [wedge-tag]`
Variants: `wedge-page` (date + status + wedge-tag), `doc` (date + read-time + format-tag), `gap` (number + wedge-tag + cross-reference link).
Canonical instance: top of each wedge page.
**Closes audit-gap 6 pattern 3.**

### M4 — Cross-reference link block

Composition: `.xref-block > .xref-label + .xref-link[]`
Variants: `see-also` (default), `informs` (forward references — "this decision informs ADR-XXX"), `derived-from` (backward references).
Canonical instance: gap-inventory → wedge pages, wedge pages → ADRs.
**Closes audit-gap 6 pattern 4.**

### M5 — Step / phase number badge

Composition: `.num-badge > [number]` with optional `.num-badge-link` wrapper for clickable variants.
Variants: `circle` (default — used in gap-inventory grid), `square` (used in shipping-order grid), `pill` (used in flow breadcrumb).
Canonical instance: gap-inventory `.gap-grid .num` + shipping-order phase grid.
**Closes audit-gap 6 pattern 5.** Resolves the "two distinct implementations" finding by declaring three explicit variants.

### M6 — Cross-collection binding banner

Composition: `.binding-banner > .binding-label + .binding-target-link`
Variants: `informs` (this doc informs target), `derived-from` (this doc derives from target), `companion-of` (this doc pairs with target).
Canonical instance: not yet used in portal; declared per the blog audit's `companionOf` / `challengesPost` precedent. Forward compatibility for when this initiative's docs gain explicit binding markers.
**Closes audit-gap 6 pattern 4 (variant).**

### M7 — Format / tag pill

Composition: `.format-pill > [icon?] + [label]`
Variants: `format` (`whitepaper`, `adr`, `research`, `prescription`), `wedge` (`distribution`, `portability`, `independent`), `status` (`open`, `resolved`, `deferred`).
Canonical instance: gap-inventory grid + (forward) docs viewer tier headers.
**Closes audit-gap 6 pattern 8.**

### M8 — Disclosure / collapsible block

Composition: `<details class="disclosure"> <summary class="disclosure-label">…</summary> <div class="disclosure-body">…</div> </details>`
Variants: `default` (chevron prefix, body indents), `inline` (no body indent — used for terse asides), `nested` (within another disclosure).
Canonical instance: docs viewer sidebar tier collapse. Forward use case: long-form docs with optional sections.
**Net-new — not from audit-gap 6 but flagged here as a missing primitive the docs viewer needs.**

---

## L3 — Organism dictionary

7 organisms named — 3 inherited from canonical chrome + 4 initiative-specific. Each declared with composition (which molecules + atoms compose it) + canonical instance + cross-surface usage.

### O1 — Proto-nav chrome (inherited from canonical chrome)

Composition: top nav strip + flow breadcrumb + drawer system + compare toggle UI.
Source: `proto-nav.js` + corresponding `shared.css` blocks.
Cross-surface: every page that declares `window.PROTO_PAGE = { id }`.
No initiative-specific changes.

### O2 — Annotation overlay (inherited from canonical chrome)

Composition: persistent operator overlay with note pins + localStorage persistence.
Source: `proto-annotate.js` + `shared.css`.
Cross-surface: every page including the script.
Note: this is the **only** operator-vs-stakeholder differentiation in the portal. Declared in the auth-state vocabulary below.

### O3 — Chat widget (inherited from canonical chrome)

Composition: floating widget + chat panel + message renderer.
Source: `chat-widget.js` + `functions/api/chat.js` Cloudflare function.
Cross-surface: every page including the script.

### O4 — Front-door hero row (initiative-specific)

Composition: M1 header + hero text block + audience-pill switcher + flow card grid.
Currently inline in `portal/index.html`. Promote to a named organism in `project-tokens.css` if a second front-door variant emerges; otherwise leave as a one-off.

### O5 — Wedge body (initiative-specific) — load-bearing

Composition: M3 meta-strip + heading block + body sections + M4 cross-reference block + (optional) M2 compare-toggle root attribute on parent template.
**This is the organism the wedge-page template wraps.** Currently rebuilt per wedge page; closes audit-gap 3 by declaring the canonical composition.
Cross-surface: all 5 wedge pages.

### O6 — Doc shell (initiative-specific)

Composition: two-column grid + sidebar (manifest-driven tier list with M8 disclosure) + main pane (markdown render).
Currently inline in `portal/docs/index.html`. Promote to a named organism if a second doc-shell variant emerges (whitepaper viewer, presentation viewer, etc.). For now, leave as a one-off but extract the sidebar tier-render to a named utility.

### O7 — Prototype studio shell (initiative-specific)

Composition: sticky top-nav + design grid overlay + iframe slot.
Currently inline in `portal/prototype/index.html`. Same as O6 — leave one-off, extract design-grid utility if reused.

---

## L4 — Template dictionary (the load-bearing layer)

The audit's central finding: L4 is entirely absent. Four templates declared, ordered by extraction leverage.

### T1 — `WedgePageTemplate` (5 instances, highest leverage)

**This is the load-bearing extraction.** Closes audit-gap 1 (L4 absent) for the largest surface family.

Composition shape:

```
<body data-compare-root data-view="proposed">   ← M2 (compare-toggle root)
  <header>                                       ← M1 (header brand strip)
    .logo + .logo-accent
  </header>
  <main class="container">
    <section class="meta">                       ← M3 (meta-strip)
      [date] · [status] · [wedge-tag]
    </section>
    <h1>{wedge title}</h1>
    {optional deck}
    <section class="current-view">               ← M2 variant
      {current-state body}
    </section>
    <section class="proposed-view">              ← M2 variant
      {proposed body}
    </section>
    <section class="xref">                       ← M4 (cross-reference block)
      {informs / derived-from / see-also}
    </section>
  </main>
  <footer>
    {canonical footer chrome}
  </footer>
</body>
<script>window.PROTO_PAGE = { id: '{wedge-id}' };</script>
```

Variants:
- `compare-binary` — both `.current-view` and `.proposed-view` present (default; gap-inventory, distribution-shape, reviewer-execution, shipping-order use this).
- `compare-single` — only `.proposed-view` present (ai-hive-companion uses this since there's no "current ai-hive companion" state to compare).

Migration path (Stage 3 work, not this artifact):
1. Extract `portal/templates/wedge-page.html` (or as a JS render function, depending on chrome conventions) carrying the composition above.
2. Migrate the 5 existing wedge `.html` files to consume the template.
3. Delete per-page inline `<style>` blocks that the template now absorbs.
4. Re-run the surface audit to confirm L4 is no longer absent for this archetype.

### T2 — `DocsViewerTemplate` (1 instance, canonical chrome)

Composition: O6 doc shell.
Already Pattern B chrome canonical (`shared.css` declares the layout primitives + `docs/index.html` is the canonical instance). Declared as a template for completeness; no extraction migration needed.

### T3 — `PrototypeStudioTemplate` (1 instance, canonical chrome)

Composition: O7 prototype studio shell.
Same status as T2 — Pattern B chrome canonical. No migration.

### T4 — `FrontDoorTemplate` (1 instance, low priority)

Composition: O4 hero row + footer chrome.
Single instance; distinctive enough that extraction is low leverage unless a second front-door pattern emerges across consumer initiatives. **Defer.**

---

## Auth-state design vocabulary

Single-tier portal. All 11 surfaces are public; the only differentiation is the annotation overlay (operator-only, client-side toggle). The audit-boundary closure:

- **Public-state surfaces** — no special treatment; default chrome.
- **Operator overlay** — annotation pins, visible when overlay is toggled on. Persisted via `blueprint-anno-*` localStorage keys. No server boundary; no visual cue that the operator is "in" or "out" of overlay mode beyond the overlay's own visibility.

If this initiative ever gains authenticated surfaces (admin panel, internal review queue), the auth-state vocabulary expands per the blog audit's three-tier pattern (`DraftBanner` analogue, logout flow, token-share affordance). Out of scope for v1.

---

## Closure mapping — which audit-gap each section closes

| Audit-gap | Closed by | Status |
|---|---|---|
| Audit-gap 1 — L4 absent | L4 template dictionary (T1 `WedgePageTemplate` is load-bearing) | **Closed structurally** (Stage 3 migration ships the visible closure) |
| Audit-gap 2 — L0 borrowed | L0 § Class B decision points named + flagged | **Deferred** to brand work (out of scope here) |
| Audit-gap 3 — L3 sparsity | L3 organism dictionary (7 organisms named, 3 inherited + 4 initiative-specific) | **Closed structurally** |
| Audit-gap 4 — L2 implicit contracts | L2 molecule dictionary (M2 compare-toggle contract named) | **Closed** |
| Audit-gap 5 — Per-page `<style>` proliferation | L2/L3 dictionary absorbs the cross-surface patterns; remaining per-page styles move to `project-tokens.css` component blocks | **Closed structurally** (Stage 3 migration enacts the per-page cleanup) |
| Audit-gap 6 — Cross-surface patterns un-named | L2 molecule dictionary (8 patterns → M1–M8) | **Closed** |
| Audit-gap 7 — Prototype studio empty | Studio's slice mechanism populated — 3 slices (`diagnose` / `mvp-wedges` / `companion-rollout`) registered in `_meta/index.json` + `_meta/slices/*.json` + per-page slice/phase references. Studio cache-bust fix shipped. | **Closed structurally** |

7 of 7 audit-gaps closed structurally as of commit `abe7a7f`. Audit-gap 2 closed via the 4-theme registry (`decisions/03-brand-brief.md` § 2026-05-26 update). Audit-gap 7 closed via slice-metadata population in `_meta/index.json` + `_meta/slices/*.json` + per-page slice references + studio cache-bust fix.

## Implementation order (Stage 3 — not this artifact)

Sequence for the Stage 3 migration that ships visible closure:

1. **Slice 1 — `WedgePageTemplate` extraction** (highest leverage; closes audit-gap 1 visibly). Extract the template carrier; migrate `gap-inventory.html` first as the canonical instance; verify the chrome-canonical-reviewer doesn't trip; then migrate the other 4 wedge pages one-by-one.
2. **Slice 2 — `project-tokens.css` component blocks** (closes audit-gap 5 visibly). Promote `.wedge-label`, format pills, and other per-page-inline atoms to the component-overrides block.
3. **Slice 3 — L2 molecules in `project-tokens.css`** (closes audit-gap 6 visibly). Implement M1, M3, M4, M5, M7, M8 as named utility classes or CSS-only patterns; M2 is already chrome-contract-driven; M6 is forward-compat.
4. **Slice 4 — L0 Class B brand decisions** (closes audit-gap 2). Invoke `forge-brand` or operator-led brand work. Author actual values into `project-tokens.css` `:root` block.

Each slice is a separate commit. The full migration is ~4 slices spread across separate sessions; Slice 1 alone is the highest-impact unit.

## References

- `research/current-state/03-portal-surface-audit.md` — the L5 inventory this dictionary derives from
- `research/architecture/02-stage1-design-audit-template.md` — the cross-audit reconciliation validating the audit shape generalizes
- `METHODOLOGY-AMENDMENTS.md` § 2026-05-26 — the design-discipline track gap this artifact's existence helps close (proof-of-concept of the Stage 1 → Stage 2 workflow)
- `tools/forge-site/` — canonical L3/L4 archetype + module reference; this dictionary aligns with its conventions where applicable
- `$BLUEPRINT_HOME/template/portal/shared.css` — canonical chrome (do not edit in this consumer; overrides land in `portal/project-tokens.css`)
