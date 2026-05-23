# Design System Audit — required coverage for the original employer-prefixed name initiatives

**Status:** harness contract (referenced by `/blueprint-research` + `/blueprint-prototype` skills)
**Codified from:** `wip/atelier-dashboard-blueprint/research/design-system-gap-audit.md` (2026-05-10)
**Why this exists:** the BB pipeline's IA + behavior coverage (Phase 8 dynamic-surface methodology) is rigorous; its design-system coverage was not. This doc closes the gap.

---

## So what?

Every BB initiative that produces a prototype must answer **15 design-system dimensions** explicitly. The research stage covers the 5 dimensions whose answers come from competitor evidence; the prototype stage covers the 10 dimensions whose answers are decisions the team makes against the substrate's constraints. A prototype that scaffolds, typechecks, and ships a Slice Shell — but leaves typography systemics / iconography / motion / a11y unspecified — fails this contract.

---

## The 15 dimensions

### Researched in Stage 1 (`/blueprint-research`)

These five dimensions need competitor evidence to justify a decision. The research skill must produce a comparable per anchor + a cross-cutting synthesis. If `blueprint.yml prototype.design_system: custom`, all five are mandatory. If targeting an existing design system (the platform design system etc.), R-3/R-4/R-5 may be inherited.

1. **R-1 — IA + dynamic-surface mechanics** (default-view logic, freshness contract, filter affordances, scale budget, server-side filter/sort). Per ux-ui-auditor Phase 8.
2. **R-2 — Voice + microcopy patterns** (imperative vs declarative; chrome vs framing; empty-state voice; error-message voice).
3. **R-3 — Visual language** (palette anchors, type families + display/body split, density, elevation strategy, border strategy).
4. **R-4 — Motion + micro-interaction language** (hover, focus, page transitions, optimistic UI, loading-state pattern).
5. **R-5 — Onboarding / first-60-seconds** (empty canvas vs starter-kit; guided tour vs jump-into-product; where does the IA reveal itself).

### Decided in Stage 2 (`/blueprint-prototype`)

These ten dimensions are decisions the prototype team makes against the substrate. The prototype skill's quality gates must check each is specified in `DESIGN.md` frontmatter AND applied consistently in code.

6. **D-1 — Color system** (palette + semantic scales + dark mode tokens). Dark mode tokens declared even if not yet built; switch UX specified.
7. **D-2 — Typography system** (ramp tuples, weight strategy, optical sizing, tabular numerals policy, italic policy, eyebrow token, measure). Per the DP-14 shape — not just a font list.
8. **D-3 — Iconography** (library decision: Lucide React / Heroicons / Phosphor / roll-own; sizing scale; stroke-width; decoration vs action distinction).
9. **D-4 — Spacing, shape, elevation** (scale + ratio rationale; elevation strategy: flat vs layered).
10. **D-5 — Motion durations + at least one applied transition** (focus, hover, expand, or list-reorder).
11. **D-6 — Component primitives** — at minimum: Button (primary/secondary/text variants + sizes + loading state), Field (label/input/hint/error), Card, Tabs, Banner, Filter Chip, Avatar. One example each of: Empty state, Loading state, Error state.
12. **D-7 — A11y baseline** — focus rings via `*:focus-visible`; WCAG AA contrast verified on every text+background combo; heading hierarchy (h1 once per route); skip-nav; aria-labels on icon buttons.
13. **D-8 — Responsive / mobile** — at least sanity-checked at 375px; mobile nav decision (off-canvas / bottom / collapse); touch target sizes (44px min); horizontal-scroll for tables.
14. **D-9 — Data formatting** — date/time format rules (relative vs absolute thresholds), number formatting (compact for large counts), pluralization, tabular numerals applied per D-2.
15. **D-10 — Content tokens** — `.label-eyebrow`, vocabulary lock (per `terminology.replace` in DESIGN.md), banned words enforced.

---

## Acceptance checklist (Stage 4 fact-check enforces)

A BB prototype is **done** when:

- [ ] R-1..R-5 each produce a section in `research/visual-voice-motion-research.md` (or extend the existing competitive-analysis doc) with anchor citations
- [ ] D-1..D-10 each have explicit frontmatter in `prototype/DESIGN.md`
- [ ] `design-md lint` passes (every CSS value is a token reference; no raw hex/rem literals; WCAG AA contrast on every token pairing)
- [ ] Heading hierarchy valid (single h1 per route)
- [ ] Every list view declares its scale budget in code or comment (per DP-6)
- [ ] Every dynamic surface has empty/loading/error states demonstrated (at least one each anywhere in the prototype)
- [ ] Iconography library is installed and at least one icon appears on each surface
- [ ] Mobile breakpoint reachable at 375px without horizontal scroll
- [ ] Focus-visible style applied; tab order audited on one full-task flow

---

## What this is NOT

- Not a replacement for the existing BB methodology (current-state analysis, competitive analysis, prototype slices) — extends it.
- Not a component-library-from-scratch mandate. Custom-design-system initiatives ship the primitives; existing-design-system initiatives (the platform design system, Radix Themes, shadcn) inherit and only define what's specific.
- Not exhaustive of all design-system concerns — illustration, complex data viz, advanced multiplayer presence, and i18n are out of scope at prototype stage; they get specified in DPs and deferred to v2 implementation.

---

## Why these specific 15 (and not 30 or 8)

15 is the count where:

- Every dimension changes how the prototype is judged at first look (a missing one is visually or functionally obvious).
- Every dimension has a documentable decision (not a "depends on the project" punt).
- The list is short enough to keep in working memory during a research pass.

Adding more (animation curve-per-component, illustration system, complex theming) creates checklist fatigue without proportional return. Cutting (combining motion with components, etc.) hides real decisions inside other dimensions.

---

## Carry-forward to other Atelier-ecosystem tools

The same gap exists for any tool whose output is a UI prototype:

- **`forge-brand` (brand-forge)** — generates tokens/components/docs from brand kit JSON. The brand kit schema should require D-1..D-4 + D-7 + D-9 + D-10 as mandatory fields. Today the schema covers D-1 + parts of D-2; the rest is implicit.
- **`signal-frontend-designer` skill** — three-phase Architect → Manager → Artist workflow. The Artist phase should check against D-1..D-10 before declaring done.
- **`ux-ui-auditor` agent (in `~/.claude/`)** — Phase 8 covers R-1 already. Add Phase 9 = design-system audit (R-2..R-5 + D-1..D-10) as a separate diagnostic mode.

## Harness vs content split (per Atelier ADR-057)

When `prototype.host: atelier` (per the paradigm-3 branch in the `/blueprint-prototype` skill), Atelier provides the harness chrome and the project provides surface content. The D-1..D-10 contract still applies to project content; the harness primitives (reviewer drawer, strategy panels, annotations, traceability resolver) are NOT the project's responsibility under paradigm 3.

What the project's prototype must still satisfy under paradigm 3:

- D-1 colors + D-2 typography + D-3 iconography + D-4 spacing/shape/elevation — required, project owns
- D-5 motion — durations + easings declared; project applies inside surface content
- D-6 component primitives — project owns Button/Field/Card/Tabs/Banner/Chip/Avatar inside its surfaces
- D-7 a11y baseline — focus rings + contrast + heading hierarchy required on project content
- D-8 responsive — project surfaces must be sanity-checked at 375px
- D-9 data formatting — project's responsibility per surface
- D-10 content tokens — project enforces vocabulary lock + `.label-eyebrow` equivalent

What Atelier's `/prototype` route provides under paradigm 3 (project does NOT re-implement):

- Reviewer drawer + scenario toggles + scale simulator UI
- Strategy panel chrome (rendered from `.atelier/prototype.yaml`)
- Annotation overlay + storage (writes via `claim` with `kind: 'design'`)
- Traceability resolver (via `get_context(scope_files)`)
- Presence indicator (from `sessions`)

A prototype targeting `prototype.host: atelier` that ships its own annotation system or reviewer drawer is duplicating substrate capability — fail Stage 4 with a "re-implements substrate primitive" finding.
