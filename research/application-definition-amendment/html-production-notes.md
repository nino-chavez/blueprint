# Application-definition RFC review kit — production notes

These notes describe the initial production handoff before parent review and RFC filing. See `html-review.md` for subsequent corrections and the current review boundary.

## Purpose and boundary

This is a portable, local static review package for the prepared application-definition amendment. Its reader is Nino, deciding whether the RFC draft is ready to file. It does not record approval, file an issue, or represent a shipped Blueprint capability.

The page leads with that decision, then progressively reveals workflow, a synthetic fixture, an illustrative gate, and source links. The interactive gate is explicitly illustrative; it does not execute `gate.mjs` or grant any authority.

## Preserve intent and source tokens

Design intent is **preserve**: extend Blueprint's own light editorial documentation identity without importing another product's visual language. The small inline token subset in `review-kit.css` is sourced from `packages/design-tokens/css/variables.css`; its Space Grotesk heading override follows `apps/portal/src/styles/global.css`. The standalone folder does not request external fonts, so Space Grotesk and Inter fall back to local system faces when unavailable.

The layout keeps one reading column, teal as the only brand accent, thin rules, calm spacing, and low box count. It borrows only the walkthrough clarity of the inspected format references: direct front-door framing, explicit prototype boundaries, and useful source handoff. It does not borrow their cream/serif presentation.

## Copy locks and limits carried forward

- The 37 controls are a count of synthetic probe execution, not a product result.
- The existing gate finding is limited to an individual design-document name check, not whole-pipeline advancement.
- Synthetic authority and copied stage-engine injection do not prove shipped phases, a trusted human-authority adapter, real completeness, or outcomes.
- The fixture is labeled as invented on the figure and again in the surrounding prose. Its IDs match `fixture.mjs`.
- “Proposed”, “RFC not filed”, “no CLI/consumer change”, and “maintainer acceptance before implementation” remain visible near the recommendation.

## Handoff

No design verdict is claimed here. Parent review should inspect the rendered page on desktop and phone, test keyboard navigation and the illustrative scenario buttons, and assess print output separately from the source checks.
