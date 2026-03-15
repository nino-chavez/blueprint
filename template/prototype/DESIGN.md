# Prototype Design Principles

Rules for all user-facing UI in this prototype.

## 1. Match the Existing Product

Only use components that exist in the current product. If a design requires a new component, mark it:

```html
<!-- PROPOSED: [Component name] — does not exist in current product -->
```

Inventory what exists by reviewing screenshots and source code before building.

## 2. Terminology

Replace internal jargon with user-facing language in all prototype copy.

| Never use | Always use | Why |
|-----------|-----------|-----|
| [internal term] | [user-facing term] | [reason] |

## 3. Framing

Lead with what the user gains, not what they're losing or being charged.

| Wrong | Right |
|-------|-------|
| "You're being charged $X" | "Save $X by switching to [preferred option]" |
| "You exceeded your limit" | "Your usage has grown past your plan" |

## 4. One Primary Action Per Page

- **Primary** (filled button): The single recommended action
- **Secondary** (outlined button): Alternative action
- **Tertiary** (text link): Navigation

Never stack competing alerts above the fold.

## 5. Progressive Disclosure

Summary and action first. Detail is collapsible or on a secondary page.

## 6. Current-State Comparison

Add screenshots of the existing product to `current-state/` and configure the mapping in `current-state-panel.js`. Each prototype page should show what exists today for side-by-side comparison.
