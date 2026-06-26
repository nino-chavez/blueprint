---
status: proposed
wave: 74
date: 2026-06-27
---

# Chrome Profile Pattern — Methodology-Themed vs Consumer-Themed

**Status:** Proposed (wave 74) — opt-in field; existing consumers default to Profile A (no behavior change).

## Overview

Pattern B portals can declare how they relate to the canonical chrome (`template/portal/`). Two profiles model the two cases:

| Profile | Model | For | shared.css | Reviewer |
|---------|-------|-----|------------|----------|
| **A — Methodology-Themed** | Consumer starts from canonical, brands via `project-tokens.css` overlay | Consumers whose brand is a thin override on methodology defaults | Canonical (byte-identical) | Enforces byte-identity on `shared.css` |
| **B — Consumer-Themed** | Consumer owns `shared.css` (design system); imports canonical primitives | Consumers whose design system is named, branded, load-bearing | Consumer-owned (drift allowed) | Enforces byte-identity on `canonical-primitives.css` only |

Pick Profile B when your design system has a name (e.g., "Midnight & Indigo"), is a core product asset, and is documented as such. Pick Profile A otherwise.

## Declaration

In `blueprint.yml`, add:

```yaml
prototype:
  chrome_profile: methodology-themed   # default (Profile A)
  # OR:
  # chrome_profile: consumer-themed    # Profile B
```

When the field is absent, the default is `methodology-themed` (Profile A). Existing consumers remain on Profile A with no changes.

## Profile A — Methodology-Themed (Default)

**Your model:** The methodology owns the chrome. Your brand lives in the overlay.

**Files:**
- `shared.css` — canonical, byte-identical to template. Never edit in your repo.
- `project-tokens.css` — your overlay. Define brand tokens here, override via the cascade.

**Restamp:**
```bash
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome --portal-type=review --target=<your-initiative>
```

Refreshes `shared.css` from canonical. Your `project-tokens.css` is never touched.

**Reviewer scope:**
The `portal-chrome-canonical-reviewer` gate enforces byte-identity on the full `PATTERN_B_CHROME_FILES` manifest, including `shared.css`.

**When to use:**
- Greenfield portals (canonical is the right starting point)
- Portals whose visual identity is secondary to the product UI (e.g., documentation portals, review/audit portals)
- Cases where "championship" design tooling (forges, tokens libraries) doesn't apply

## Profile B — Consumer-Themed (Opt-In)

**Your model:** Your design system IS your chrome. The methodology supplies canonical primitives you build on top of.

**Files:**
- `shared.css` — yours. Defines your brand tokens, theme registry, and design system. Drift allowed.
- `canonical-primitives.css` — methodology-supplied. Read-only, byte-identical.

**Your shared.css composes canonical primitives:**
```css
@layer canonical, consumer;

@import url('./canonical-primitives.css') layer(canonical);

:root {
  /* Your brand tokens */
  --brand-50: your-lightest;
  --brand-100: your-light;
  --brand-600: your-primary;
  --tournament-accent: your-accent; /* or similar product-specific tokens */
  
  /* Your surfaces (override canonical defaults) */
  --bg: your-background;
  --card: your-card-background;
  --card-border: your-card-border;
  
  /* Your theme registry if you use [data-theme] */
  /* OR just one theme, either way works */
}

/* Your rest of shared.css — components, utilities, theme variants, etc. */
```

The `@layer canonical` ensures canonical primitives are foundational; your styles win for any property you override, without specificity arms races.

**Restamp:**
```bash
# First, audit to classify divergences
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=audit-chrome --portal-type=review --target=<your-initiative>

# Then refresh canonical-primitives only (if it's LAG-classified)
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome --portal-type=review --target=<your-initiative> \
  --accept-overwrite=canonical-primitives.css
```

Restamps `canonical-primitives.css` from canonical. Your `shared.css` stays untouched (you own it).

**Reviewer scope:**
The `portal-chrome-canonical-reviewer` gate enforces byte-identity on `canonical-primitives.css` only. Drift in your `shared.css` is allowed (it's your design system).

**When to use:**
- Portals whose visual identity is a named, documented design system (e.g., "Midnight & Indigo", "Rally Orange")
- Products where design system is a competitive asset (brand, consistency, engineering leverage)
- Multi-theme or multi-accent systems where one theme is insufficient
- Brownfield portals that predate the canonical chrome (legacy design systems)

## Open Decision: Migrating Existing shared.css to Profile B

When Profile B is chosen for an initiative that already has a customized `shared.css`:

**Current model (consumer migration choice, not methodology):**
1. Audit your current `shared.css` to extract brand tokens (colors, type families, surfaces) and component customizations
2. Refactor into two parts:
   - Canonical primitives (reset, type scale, spacing, elevation, radius, motion) → keep in canonical-primitives or align with new canonical version
   - Brand + components → move to your shared.css
3. Add `@layer` composition to your shared.css (wrap canonical-primitives.css)
4. Test that your design system renders correctly (semantic tokens apply, no specificity issues)

**This is a consumer-side migration path, not a methodology gate.** Different consumers will handle existing shared.css differently:
- Some will surgically extract primitives and rebase on canonical-primitives.css
- Some will wrap canonical-primitives.css underneath their existing shared.css and deal with minor selector conflicts
- Some will treat the migration as an opportunity to rationalize their design system

**No methodology prescription here.** The contract is simple: if you declare Profile B, the reviewer checks byte-identity only on canonical-primitives.css and lets your shared.css drift.

## Design Rationale

### Why two profiles?

**Wave 1 assumption (now invalidated by rally-hq):** All Pattern B consumers have thin brand overlays. The split between `shared.css` (methodology chrome) and `project-tokens.css` (overlay) works when brand is secondary.

**Reality:** Brand-owning consumers (those with named, load-bearing design systems) cannot fit their design system into a `project-tokens.css` overlay. Their design system IS the chrome. Forcing the split creates friction and false promises (the reviewer can't prevent drift on the actual design artifact — the consumer has to choose between breaking the boundary or living with the drift).

The two-profile model names this reality: Profile A for thin-overlay consumers, Profile B for design-system-owning consumers. Each profile comes with the reviewer scope it deserves.

### Why @layer for composition?

`@layer` is the CSS primitive that solves "I want canonical defaults, but my custom rules win without rewriting specificity." The alternative (rewriting specificity selectors or using !important) creates maintenance debt. `@layer` is the right tool.

## References

- Origin amendment: `~/Workspace/dev/apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md` § "2026-05-26 — The portal-chrome-canonical-reviewer model breaks..."
- Canonical primitives file: `template/portal/canonical-primitives.css`
- Reviewer agent: `template/.claude/agents/blueprint/reviewers/portal-chrome-canonical-reviewer.mjs`
- Stamper implementation: `template/tools/blueprint-init/stamp.mjs` (reads `prototype.chrome_profile` from `blueprint.yml`)
- Pattern B restamp contract: `template/tools/blueprint-init/README.md` § "Usage — restamp chrome (Pattern B)"
