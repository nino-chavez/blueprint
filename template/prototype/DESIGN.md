---
# ============================================================================
# Blueprint Prototype DESIGN.md
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
  # D-1 — Color system. Single brand primary; no `secondary` brand slot
  # (use outlined-button shape for "secondary CTA"). Semantic scales carry
  # state. Dark mode tokens declared even if dark build is deferred.
  primary:       "#000000"      # REPLACE: the single primary CTA color
  primary_hover: "#000000"      # REPLACE
  text:
    primary:   "#000000"        # REPLACE
    secondary: "#000000"        # REPLACE
    muted:     "#000000"        # REPLACE
    inverse:   "#ffffff"        # REPLACE
  surfaces:
    background: "#ffffff"       # REPLACE
    card:       "#ffffff"       # REPLACE
    raised:     "#f5f5f5"       # REPLACE
    border:     "#000000"       # REPLACE
  semantic:
    success: "#15803D"
    warning: "#B45309"
    error:   "#B91C1C"
    info:    "#1E40AF"
  dark:                          # D-1 — dark mode tokens REQUIRED; build optional
    enabled: false               # set true when dark layer is shipped
    background: ""               # REPLACE on enable
    card:       ""
    text_primary: ""

typography:
  # D-2 — Typography is a SYSTEM, not a font list. Required fields:
  # ramp tuples (size, leading, weight, tracking, family) per token;
  # three-weight rule; tabular numerals policy; italic policy; eyebrow token.
  # See docs/case-studies/design-system-audit.md for the contract.
  fonts:
    display:
      family: System              # REPLACE
      fallbacks: [system-ui, sans-serif]
      optical_sizing: auto        # set "auto" if family supports opsz axis
      features: []                # OpenType features (ss01, dlig, etc.)
    body:
      family: System
      fallbacks: [system-ui, sans-serif]
      features: []
    mono:
      family: Menlo
      fallbacks: [ui-monospace, monospace]
  ramp:                            # REQUIRED: tuples per type token
    h1:      { size: "1.875rem",  leading: 1.15, weight: 600, tracking: "-0.015em", family: display }
    h2:      { size: "1.5rem",    leading: 1.2,  weight: 600, tracking: "-0.012em", family: display }
    h3:      { size: "1.25rem",   leading: 1.25, weight: 600, tracking: "-0.01em",  family: display }
    h4:      { size: "1.0625rem", leading: 1.35, weight: 600, tracking: "-0.005em", family: body }
    body:    { size: "1rem",      leading: 1.5,  weight: 400, tracking: "0",        family: body }
    body_em: { size: "1rem",      leading: 1.5,  weight: 500, tracking: "0",        family: body }
    sm:      { size: "0.875rem",  leading: 1.45, weight: 400, tracking: "0",        family: body }
    xs:      { size: "0.75rem",   leading: 1.4,  weight: 400, tracking: "0",        family: body }
    eyebrow: { size: "0.625rem",  leading: 1,    weight: 500, tracking: "0.08em",   family: body, transform: uppercase }
    code:    { size: "0.875rem",  leading: 1.45, weight: 400, tracking: "0",        family: mono }
  weights_in_use: [400, 500, 600]   # REQUIRED: three weights total (anchor pattern)
  numerals:
    tabular: [counter, timestamp, trace_id, code, fencing_token, badge]   # apply tabular-nums
    lining:  [prose, heading]
  italics:                          # Anchor pattern: prose only, never chrome
    allowed_in:    [prose_emphasis]
    forbidden_in:  [chrome, labels, buttons, nav, eyebrows]
  measure:
    prose: "60-72ch"
    label: uncapped
    code:  uncapped

spacing:                         # D-4 — observed/chosen spacing scale + rationale
  "1": 0.25rem
  "2": 0.5rem
  "3": 0.75rem
  "4": 1rem
  "6": 1.5rem
  "8": 2rem
  rationale: "REQUIRED: 4px base / 8px base / Tailwind default / custom"

rounded:                         # D-4 — radius scale
  sm: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  full: 9999px

elevation:                       # D-4 — REQUIRED: flat vs layered strategy
  strategy: flat                 # "flat" | "layered"
  none: "none"
  sm:   "0 1px 2px 0 rgba(0,0,0,0.04)"
  md:   "0 2px 8px -2px rgba(0,0,0,0.08)"
  lg:   "0 8px 24px -8px rgba(0,0,0,0.12)"
  ring: "0 0 0 3px rgba(0,0,0,0.15)"

motion:                          # D-5 — REQUIRED durations + easings
  durations:
    fast: "120ms"
    base: "200ms"
    slow: "320ms"
  easings:
    standard:   "cubic-bezier(0.2, 0, 0, 1)"
    emphasized: "cubic-bezier(0.3, 0, 0, 1)"
  reduced_motion: "respected via prefers-reduced-motion"

iconography:                     # D-3 — REQUIRED: library + sizing
  library: ""                    # REPLACE: "lucide-react" | "heroicons" | "phosphor" | "custom"
  stroke_width: 1.5
  sizes:
    xs: 12
    sm: 16
    md: 20
    lg: 24
  rules:
    - "Decoration icons: muted color, no aria-label"
    - "Action icons: full color, aria-label required"

a11y:                            # D-7 — REQUIRED: baseline declared
  focus_visible: true
  contrast_target: "WCAG AA"     # AA | AAA
  one_h1_per_route: true
  skip_nav: true

responsive:                      # D-8 — REQUIRED: mobile decision
  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
  mobile_nav: ""                 # REPLACE: "off-canvas" | "bottom" | "collapse"
  touch_target_min: "44px"
  sanity_checked_at: "375px"

data_formatting:                 # D-9 — REQUIRED: format rules
  date:
    relative_under: "7d"         # use relative ("3h ago") under this; absolute beyond
    absolute_format: "MMM D"
  number:
    compact_above: 10000         # render 12.3k above this; full digits below
    thousands_separator: ","
    pluralization: "Intl.PluralRules"

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

---

## Architectural Invariants

The seven principles above constrain *visual and copy* behavior. The invariants below constrain *structure*. They are enforced mechanically via lints + structural tests. They define *what* must be true, not *how* it's implemented — the agent picks the library.

The reason for separating invariants from visual rules: visual rules guide the prototype-builder agent; invariants prevent the agent from drifting across pages as the prototype scales. Both are checked at Stage 4 (Fact-Check) by the reviewer agents.

### I-1. Boundary Parsing Required

Every external input is parsed at the boundary. That includes:
- URL params (`new URLSearchParams(window.location.search)`)
- `postMessage` payloads
- `fetch` responses (typed at the call site)
- `localStorage` reads (the stored shape may be stale)
- Pages Function (`functions/`) request bodies

Choice of parser is unconstrained — Zod, Valibot, hand-rolled type guards, or framework-native (e.g., SvelteKit's `loadEvent.params`) all qualify. The constraint is that no untrusted value flows into application logic without a parse step.

**Why this matters:** prototypes degrade into "looks fine, crashes on the malformed URL the VP shared" without boundary parsing. The fix is per-call-site cheap; the absence costs a stakeholder demo.

### I-2. Pages Declare Their Own Metadata

Every page-level HTML declares a single source-of-truth identifier:

```html
<script>window.PROTO_PAGE = { id: 'tournament-detail' };</script>
```

Everything else — title, group, surface, phase, summary, strategy citations, current-state crops — flows from `_meta/<page-id>.json` (portal shell) or `prototypes/<slice>/prototype.config.json` (prototype shell).

**No inline strategy content in page HTML.** The page HTML is structure + the id; the metadata file is content. This makes meta updates a single-file edit rather than a hunt across N pages.

### I-3. Cross-Cutting Concerns Through a Single Providers Interface

Analytics, feature flags, auth state, telemetry, AI-chat config — all flow through one `Providers` interface (object, module, or React context, depending on shell). Pages do not reach for `window.gtag` directly, do not read flags from `localStorage` ad-hoc, do not import auth helpers per-page.

**Why this matters:** when the analytics provider switches, the auth model changes, or feature flags get added, one file changes — not N pages. The invariant is structural even if the prototype currently has zero cross-cutting concerns; adding the first one without the interface produces the per-page tax that compounds.

### I-4. One Primary CTA Per Page (Structural)

Visual rule 4 says one primary CTA per page (filled button, `{colors.primary}`). The structural form: every primary CTA carries `[data-primary-cta]`, and a lint enforces `count([data-primary-cta]) === 1` per page.

**Why promote visual to structural:** the visual rule depends on the prototype-builder agent's judgment about "primary." The structural rule depends on attribute presence. The agent that built the page may have judged correctly; the agent making a later edit may not. The lint catches the second case automatically.

### I-5. JS Class Output ↔ CSS Coverage

Every class name emitted by JS shells (`proto-nav.js`, `_portal-shell.js`, `chat-widget.js`, `proto-annotate.js`, any future shell module) must have a corresponding CSS rule in the shipping stylesheet. The invariant catches the failure mode where the JS template emits a class hierarchy (e.g., `.proto-top-bar`, `.top-bar-inner`, `.top-bar-lead`) but the template ships zero CSS for those classes — pages return 200 with unstyled chrome.

**Why this exists:** the v3 ninochavez.co session (2026-05-25) shipped portal pages where `proto-nav.js` generated the full `.proto-top-bar` class hierarchy but the template's stylesheet had no rules for any of those classes. Front-door + docs viewer pages worked because they used `.portal-shell` (which IS styled) via `<header data-portal-shell>`; prototype pages bypassed that path and got unstyled chrome. Rally HQ didn't hit the bug because Rally HQ has its own additional CSS that fills the gaps. The template ships incomplete for non-Rally-HQ consumers.

**Structural form:** a lint walks every `.js` file in the shell directory, extracts class-name string literals (anything matching `className = '...'`, `classList.add('...')`, `class="..."` in template strings), then diffs against CSS selectors in the shipping stylesheet. Any class emitted by JS without a matching `.{class}` selector in CSS fails the lint.

**Pass criterion:** zero JS-emitted classes without CSS selectors. Per-consumer override is acceptable for opt-in chrome (e.g., a project that deliberately doesn't ship the annotation overlay can skip `.proto-anno-*` rules), declared via a `--allow-missing` list in the lint config.

**Why a 200 response is not enough:** curl smoke tests check that the server responds. They cannot detect unstyled chrome. This invariant + the strengthened smoke-runner (which now requires viewport screenshots) close the gap.

### Lint Errors as Remediation Prompts

When a custom lint (`design-md lint`, `[data-primary-cta]` enforcement, token discipline, terminology-linter) fires, its error message must include the *fix*, not just the violation. The cost is one extra sentence per lint rule; the multiplier is every CI run that becomes self-healing because the agent that reads the error is the agent that will write the patch.

Example:

```diff
- "Page has 2 primary CTAs"
+ "Page has 2 primary CTAs. Blueprint enforces one. Remove the [data-primary-cta]
+  attribute from the secondary action and re-style as a tertiary link. See
+  DESIGN.md §I-4 + visual rule 4."
```

This applies to every custom lint shipped with the prototype shell.

---

## When Targeting BC B2B Edition

Apply this section if `blueprint.yml` has `b2b_edition.enabled: true`. Otherwise delete during initiative customization.

### Additional Terminology Rules

Mirror these in frontmatter `terminology.replace:` so `design-md lint` enforces them.

| Never use | Always use | Why |
|---|---|---|
| User | Buyer | BC B2B Edition entity tied to a Company |
| Org / Organization | Company | BC term for the multi-buyer entity |
| RFQ | Quote | BC has Quote objects; RFQ is industry jargon BC doesn't use |
| Order admin | Senior Buyer / Company Admin | Specific B2B Edition roles |
| Customer (in B2B-specific copy) | Buyer or Company (specify) | Customer is BC core; ambiguous in B2B context |

### Additional Rule: Name the Actor

Every flow must name *which actor* (per the multi-actor role pattern):

- **Owner** — Company Admin or ultimate authority
- **Payer** — settles invoices (may differ from Owner)
- **Beneficiary** — receives goods (may differ from Owner & Payer)
- **Manager** — operates day-to-day with limited spending power
- **Org Admin** — configures Company-level settings

"The user creates a quote" → "The Junior Buyer creates a quote; the Senior Buyer approves it." The actor must be visible in the slice copy (or the strategy panel if implicit in the UI).

### Additional Platform-Fidelity Requirement

Every storefront claim that touches B2B surfaces must cite a contract method from `docs/context/bc-b2b-buyer-portal-integration.md`:

| Surface | Required citation |
|---|---|
| Buyer login | `loginWithB2B()` server-side token exchange |
| PDP B2B button | `useAddToQuote()` or `useAddToShoppingList()` hook |
| Cart sync after quote acceptance | `on-cart-created` event listener |
| B2B catalog visibility | Customer Group filtering (BC core) |
| Per-buyer pricing | Customer Contracts (B2B Edition) — not Price Lists |

### Additional Reference

- `$BLUEPRINT_HOME/docs/context/bc-b2b-edition-context.md` — data model, surfaces, ownership boundaries
- `$BLUEPRINT_HOME/docs/context/bc-b2b-buyer-portal-integration.md` — framework-agnostic integration contract
- Multi-actor role pattern: `wip/subs-initiative/docs/decisions/0023-b2b-checkout-ownership.md`
