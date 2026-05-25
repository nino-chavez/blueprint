---
canonical: false
---

# Handoff — De-bcization of the Snapshot

This `apps/portal/` directory was extracted from `subs-initiative` at `origin/main` on 2026-05-25 as the canonical Tier 1 portal scaffold. The mechanical `@subs-initiative/*` → `@blueprint/*` package rename is complete. The remaining `subs-initiative` strings are surface-level project-name + repo-URL references that need to be parameterized before this scaffold is ready for new initiatives.

## What's still subs-initiative-specific

Run from `template/apps/portal/`:

```bash
grep -rln "subs-initiative" .
```

Categories of remaining references:

### 1. Project name string (high-traffic)

Hard-coded `"subs-initiative"` appears as:

- Page title in `src/pages/index.astro` (`title="subs-initiative"`)
- Layout title concatenation in `src/layouts/Layout.astro` (`title === 'subs-initiative' ? title : ...`)
- Footer brand string in `src/layouts/Layout.astro`
- Page headings in `/discover`, `/try`, `/build`, `/operate`, `/inspect`, `/strategy`, `/strategy/delivery-fork`

**Fix:** read project name from a `blueprint.config.ts` (or `package.json` `description` field) at build time. Surface as a single import: `import { projectName } from '@/lib/blueprint-config'`.

### 2. GitHub repo URL (medium-traffic)

Hard-coded `the subscriptions initiative's repo (private)` appears as:

- `DEFAULT_REPO_PREFIX` in `src/components/ExcerptCard.tsx`
- GitHub footer link in `src/layouts/Layout.astro`
- Source-link prefixes inside excerpt-generating utilities

**Fix:** same `blueprint.config.ts` — expose `repoUrl` and `repoBranch` (default `main`). All "Read full" / source links derive from this.

### 3. Brand logo

`public/project-logo.png` is the subs-initiative logo. Layout.astro references it via `<img src="/project-logo.png">`.

**Fix:** rename to `public/project-logo.png`. Update Layout.astro reference. Logo asset is replaceable per project.

### 4. Description copy

Footer copy in `src/layouts/Layout.astro` says "An example product initiative" — subs-initiative-specific tagline.

**Fix:** `blueprint.config.ts` → `tagline` field. Layout reads it.

### 5. Content paths (low-priority; project-shape dependent)

`src/lib/content.ts` reads markdown files from the repo root (`PRD.md`, `BRD.md`, `STRATEGY.md`, etc.). The paths are hard-coded but the resolution mechanism (`repoRoot()` → `readFileSync`) is generic.

**Fix:** parameterize the doc-name list via `blueprint.config.ts` → `documents: { prd: 'PRD.md', brd: 'BRD.md', ... }`. Default to subs-initiative shape. Initiatives that use different filenames override.

### 6. Hive integration (substrate-specific)

`src/lib/derived.ts` and `src/components/DerivedRoadmap.tsx` read `docs/audits/_state.json` (subs-initiative' state-derive output) and Hive substrate data.

**Fix:** gate behind `blueprint.config.ts` → `substrate: 'hive' | 'manual' | 'none'`. When `'manual'`, the roadmap reads a hand-authored markdown file instead. When `'none'`, the `/roadmap` route ships placeholder content.

### 7. Inspect-mode dashboards (substrate-specific)

`src/components/SubstrateDashboards.tsx` + `src/pages/inspect/gates.astro`, `coverage.astro`, `dependencies.astro`, `attestations.astro` are subs-initiative-specific governance views.

**Fix:** these are advanced Tier-2 features. For Tier 1 initiatives, ship `/inspect` as a single methodology overview page that links to `docs/decisions/` (ADRs). Move the subs-initiative-specific views to `@blueprint/ui-substrate-hive` as an optional add-on package.

## Suggested file ordering

Fix in this order to keep each commit reviewable:

1. Create `src/lib/blueprint-config.ts` reading from `blueprint.config.ts` at the project root (or fall back to `package.json` description / GitHub remote).
2. Parameterize Layout.astro (title, footer brand, GitHub link, logo path).
3. Parameterize index.astro + each lane page (title + heading).
4. Parameterize ExcerptCard.tsx (`DEFAULT_REPO_PREFIX`).
5. Rename `public/project-logo.png` → `public/project-logo.png` and add a placeholder.
6. Gate substrate-specific Inspect pages behind `substrate !== 'none'`.

After step 5, the scaffold passes `grep -L "subs-initiative" .` for everything except inline `subs-initiative` references in the README (which is a separate de-bcization pass on the doc).

## What NOT to change in this scaffold

- The IA — six routes + audience switcher — is canonical per `docs/portal-and-tier-ladder.md`. Don't add or remove routes.
- The `@blueprint/ui` + `@blueprint/design-tokens` dependency wiring. Snapshot is correct; only the project-name / repo-URL surface needs parameterization.
- The Astro + React + Tailwind stack choice. That's the reference stack. Variants (SvelteKit, Next) are tracked as future work in `docs/portal-and-tier-ladder.md`.

## Origin trace

- Extracted via `git archive` from `subs-initiative@origin/main` on 2026-05-25
- Source commits: see subs-initiative git log for `apps/portal/`, `packages/ui/`, `packages/design-tokens/`
- Methodology: `docs/portal-and-tier-ladder.md` § "Migration recipe for existing projects"
