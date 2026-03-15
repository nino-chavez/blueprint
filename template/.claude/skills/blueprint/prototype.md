# /blueprint-prototype

Prototype phase of a the original employer-prefixed name initiative. Builds interactive HTML pages matching the existing product's design language.

## When to use
After research is complete and design principles are codified in `prototype/DESIGN.md`.

## What it does

1. **Read design principles** — Load `prototype/DESIGN.md` for rules on components, terminology, framing, and CTA hierarchy.

2. **Build shared CSS** — If `prototype.design_system` is `existing` in blueprint.yml:
   - Extract colors, typography, spacing, and component patterns from screenshots and codebase
   - Create `prototype/shared.css` with CSS custom properties
   - Match the existing product pixel-for-pixel where possible

3. **Create prototype pages** — For each proposed feature:
   - Build HTML pages using only components from the existing product
   - Mark any new components as `<!-- PROPOSED: [name] -->`
   - Apply terminology rules from DESIGN.md
   - Use savings-first framing for cost-related copy
   - Ensure one primary CTA per page

4. **Configure strategy panel** — For each page, define:
   - `window.STRATEGY_CONTEXT[page]` with title, strategy rationale, design decisions, and research citations
   - Link each decision to a specific finding from the research phase

5. **Configure current-state panel** — For each page:
   - Map to the relevant current-state screenshots
   - Write a "what the prototype changes" delta summary
   - Set `window.CURRENT_STATE[page]` configuration

6. **Build landing page** — Create `index.html` with:
   - Strategic documents in 2-column grid (compact cards)
   - Prototype flows in 2-column grid (grouped by feature)
   - Coverage summary headline numbers

7. **Configure navigation** — Set `window.PROTO_NAV` with:
   - Flow groupings for the footer nav
   - Drawer toggle buttons

## Output files
- `prototype/*.html` — interactive prototype pages
- `prototype/shared.css` — design system CSS
- `prototype/index.html` — landing page
- Strategy and current-state panel configurations embedded in pages

## Quality checks
- Every page matches existing product design language
- No invented components without PROPOSED marker
- No internal jargon in user-facing copy
- One primary action per page
- Strategy panel has research citations for every design decision
- Current-state panel maps to actual screenshots
