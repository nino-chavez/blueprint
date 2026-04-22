---
# ============================================================================
# BigBlueprint Prototype DESIGN.md
# ============================================================================
#
# This file is a HYBRID: the frontmatter is MACHINE-AUTHORED during Stage 1
# (Research) by extracting tokens from screenshots and source code of the
# existing product. The markdown body is HUMAN-AUTHORED principles for copy,
# framing, and behavior.
#
# RULES:
#   - The `tokens` block is extracted, not invented. If a value can't be
#     observed in the current product, it is a PROPOSAL, and must be marked
#     with `proposed: true` at the sibling key.
#   - The `extraction` block records the provenance so reviewers can trace
#     every token back to its source. Do not leave any field blank — if the
#     source is missing, the token is a proposal and should be marked as
#     such.
#   - Existing body sections (Match, Terminology, Framing, One Primary
#     Action, Progressive Disclosure, Current-State) remain authoritative
#     for prototype behavior.
#   - `design-md lint` (Stage 4 Fact-Check) validates that every component
#     CSS value has a token reference and that contrast passes WCAG AA.
# ============================================================================

schemaVersion: 1
mode: light  # or dark — match the existing product's default

extraction:
  extractedBy: agent            # "agent" during Stage 1; "human" if hand-authored
  extractedOn: YYYY-MM-DD       # fill in during extraction
  sources:
    - screenshots/              # add one entry per authoritative source
    - src/styles/               # project-relative path into the existing product
  confidence: medium            # low | medium | high
  gaps:                          # list tokens we expected but couldn't find
    - elevation scale not observed in current product

# ---------------------------------------------------------------------------
# TOKENS — extracted from the existing product. Do not invent values.
# ---------------------------------------------------------------------------

colors:
  primary: "#000000"            # REPLACE: the single primary CTA color
  secondary: "#000000"          # REPLACE: secondary CTA / link color
  text:
    primary:   "#000000"        # REPLACE
    secondary: "#000000"        # REPLACE
    muted:     "#000000"        # REPLACE
  surfaces:
    background: "#ffffff"       # REPLACE
    card:       "#ffffff"       # REPLACE
    border:     "#000000"       # REPLACE
  semantic:
    success: "#000000"          # REPLACE or omit if product has no semantic palette
    warning: "#000000"
    error:   "#000000"
    info:    "#000000"

typography:
  fonts:
    display:
      family: System            # REPLACE: font family as it appears in product CSS
      fallbacks: [system-ui, sans-serif]
    body:
      family: System
      fallbacks: [system-ui, sans-serif]
    mono:
      family: Menlo
      fallbacks: [ui-monospace, monospace]
  scale:                         # REPLACE: step name → size (rem or clamp())
    h1:   2rem
    h2:   1.5rem
    h3:   1.25rem
    body: 1rem
    sm:   0.875rem

spacing:                         # REPLACE: observed spacing scale
  "1": 0.25rem
  "2": 0.5rem
  "3": 0.75rem
  "4": 1rem
  "6": 1.5rem
  "8": 2rem

rounded:                         # REPLACE: observed radius scale
  sm: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  full: 9999px

# ---------------------------------------------------------------------------
# TERMINOLOGY — populated during Stage 1 by auditing the actual product.
# Mirrors the "Terminology" body section below. Machine-readable form so
# agents can lint prototype copy against it.
# ---------------------------------------------------------------------------
terminology:
  replace: []                    # add entries like { from: "GMV", to: "Sales volume" }
  ban:
    - deflect
    - deflection
    - non-preferred
    - blocked
    - auto-upgraded
---

# Prototype Design Principles

Rules for all user-facing UI in this prototype.

Tokens above are **extracted**, not invented. Body principles below are **authored**.
Run `design-md lint` during Stage 4 (Fact-Check) to validate visual fidelity and contrast.

## 1. Match the Existing Product

Only use components that exist in the current product. If a design requires a new component, mark it:

```html
<!-- PROPOSED: [Component name] — does not exist in current product -->
```

Inventory what exists by reviewing screenshots and source code before building. Every token in the frontmatter must be traceable to a source listed under `extraction.sources`.

## 2. Terminology

Replace internal jargon with user-facing language in all prototype copy.

**IMPORTANT:** Populate this table during project setup by auditing the existing product for the terms it actually uses. Do not leave placeholders — the agent will use whatever terms are here. Check: labels in the UI, column headers in tables, help text, and locale/i18n files in the codebase.

Every row here should also appear under `terminology.replace:` in frontmatter so agents can lint copy automatically.

| Never use | Always use | Why |
|-----------|-----------|-----|
| [internal term] | [user-facing term from the actual product] | [reason] |

**Common patterns to check:**
- Does the product say "GMV" or "Sales volume"?
- Does it say "surcharge" or "processing fee" or "transaction fee"?
- Does it say "downgrade" or "change plan"?
- Does it say "cap" or "limit"?
- Does it use acronyms the user wouldn't know?

**Also ban these words in user-facing copy** (universal anti-patterns, mirrored in `terminology.ban`):
- "deflect" / "deflection" → use "resolve without support" / "self-service resolution"
- "non-preferred" → use "third-party" or just the provider name
- "blocked" → use "not eligible"
- "auto-upgraded" → use "plan will be updated"

## 3. Framing

Lead with what the user gains, not what they're losing or being charged.

| Wrong | Right |
|-------|-------|
| "You're being charged $X" | "Save $X by switching to [preferred option]" |
| "You exceeded your limit" | "Your usage has grown past your plan" |

## 4. One Primary Action Per Page

- **Primary** (filled button, `{colors.primary}`): The single recommended action
- **Secondary** (outlined button): Alternative action
- **Tertiary** (text link): Navigation

Never stack competing alerts above the fold. The primary button color must resolve to the extracted `{colors.primary}` — never a hand-picked hex.

## 5. Progressive Disclosure

Summary and action first. Detail is collapsible or on a secondary page.

## 6. Current-State Comparison

Add screenshots of the existing product to `current-state/` and configure the mapping in `current-state-panel.js`. Each prototype page should show what exists today for side-by-side comparison.

The screenshots under `current-state/` are also the source material for `extraction.sources` in frontmatter. The Fact-Check stage uses them to validate token fidelity.

## 7. Token Discipline

Every color, font family, spacing, and radius in component CSS must reference a token (`{colors.primary}`, `{spacing.4}`, `{rounded.md}`) — never a raw hex or `rem`/`px` literal. `design-md lint` enforces this.

If a component genuinely needs a value the extracted token set doesn't cover, add the token to frontmatter with `proposed: true` at the key level, e.g.:

```yaml
colors:
  surfaces:
    accent: "#f3f0ff"
    accent_proposed: true
```

A proposed token signals to reviewers that the extraction didn't find this value in the current product — it's a new design decision requiring approval.
