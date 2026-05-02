# /blueprint-prototype

Prototype phase of a the original employer-prefixed name initiative. Builds React + the platform design system slices that demonstrate proposed CX changes while matching the existing product's design language.

## When to use
After research is complete and design tokens + principles are codified in `prototype/DESIGN.md`.

## What it does

1. **Read the contract** — Load:
   - `prototype/CONVENTIONS.md` (mandatory slice rules — SliceShell chrome, anti-patterns, file layout)
   - `prototype/DESIGN.md` (extracted tokens and principles)
   - `prototype/prototypes/_template/` (the skeleton you'll clone)

2. **Clone the template** — For each requested slice:
   ```bash
   cp -r prototype/prototypes/_template prototype/prototypes/<slice-name>
   ```

3. **Customize `prototype.config.json`** — Replace placeholder fields:
   - `name` — human-readable slice name
   - `description` — 1-2 sentences on what the slice covers
   - `brdRef` — the project's spec reference (e.g., "Epic 4 — Catalog enablement")
   - `phase` — "MVP" | "P2" | "P3"
   - `pages` — one entry per page, with `name`, `route`, optional `story` (spec shorthand) and `traces` (additional spec IDs)
   - `flows` — optional reviewer-facing suggested click-throughs

4. **Update `routes.tsx`** — Change `<Route path="_template">` to `<Route path="<slice-name>">`; add or rename child routes to match `pages[]` in the config; rename imports and the exported component.

5. **Build each page** — For every page:
   - Wrap in `<SliceShell config={sliceConfig} sliceName="<slice-name>" currentPageName="<exact name from config>" tools={tools} notes={notes}>`
   - Place real product UI (the merchant's or end user's view) inside `children`
   - Place harness controls (scenario switcher, reset, simulate-error) inside `tools`
   - Place explanatory context (where this renders in production, spec mapping) inside `notes`
   - Use only components from the platform design system and `@/components/SliceLayout` unless a new component is genuinely required
   - Apply terminology and CTA hierarchy rules from DESIGN.md
   - One primary CTA per page

6. **Replace mock data** — Edit `data/mock.ts` to match what the slice needs (typed; not `any`).

7. **Wire traceability (if the project has it)** — If `src/generated/traceability.json` is populated, ensure each page's `traces` and `story` IDs resolve. Missing IDs render as dashed chips, which signals a gap in the registry.

## Output files
- `prototype/prototypes/<slice-name>/prototype.config.json`
- `prototype/prototypes/<slice-name>/annotations.json` (empty array)
- `prototype/prototypes/<slice-name>/routes.tsx`
- `prototype/prototypes/<slice-name>/data/mock.ts`
- `prototype/prototypes/<slice-name>/pages/*.tsx`

The Studio Home page rediscovers slices automatically — do not edit `src/pages/Home.tsx` when adding a slice.

## Quality gates (must pass before declaring done)

- `npm run typecheck` is clean
- Every page wraps in `SliceShell` with `tools` / `notes` populated where appropriate
- Page body contains NONE of the anti-patterns from CONVENTIONS.md (no inline "Prototype controls" panels, no spec footers in body, no "in production this renders…" Messages in body, no reviewer-shortcut buttons in product UI)
- Page body looks like production UI when the harness drawer is closed
- One primary CTA per page
- Sidebar nav highlights the correct page; prev/next bar wires up correctly
