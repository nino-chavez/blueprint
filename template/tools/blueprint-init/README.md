---
canonical: true
---

# `blueprint-init` — stamper for new Blueprint initiatives

Mechanically-checkable scaffold for a Tier 1 Blueprint portal. Replaces the previous "copy `template/apps/portal/` and remember to de-bc-ize" pattern that left `blueprint-example` strings embedded in 6+ files (historical context: [`docs/_archive/handoffs/HANDOFF-debcization.md`](../../../docs/_archive/handoffs/HANDOFF-debcization.md)).

**The reason for a stamper, not a copier**: a stamper is mechanically checkable. After running, `grep -rl '<source-project-slug>' <target>/` returns only the substantive content files the operator chose to keep — never package metadata, footer brand, or repo URLs. A copier requires self-attestation ("did I get all the strings?"), which is the failure mode this tool exists to remove.

## Modes

The stamper has two modes, dispatched by `--mode=<mode>` (default `stamp`).

| Mode | What it does | When to use |
|---|---|---|
| `stamp` *(default)* | Initial scaffold. Copies `template/apps/portal/` + `template/packages/` (Pattern A) or `template/portal/` (Pattern B) into a fresh `<target>`, runs substitutions, writes `blueprint.yml`, executes the mechanical check. | Once, per new Blueprint initiative. |
| `restamp-chrome` | Re-stamp canonical chrome files only. Overwrites the canonical chrome surface in `<target>` from `template/portal/` (Pattern B) or `template/apps/portal` styles (Pattern A — not yet implemented). Leaves project-owned files (`project-tokens.css`, `_meta/*`, `pages/*`, `index.html`) untouched. When `--accept-overwrite` is specified, treats it as scope (overwrite only those files) instead of consent (block if any diverge). | Any time the methodology bumps the chrome and a consumer needs to catch up. Run instead of `curl`-ing a peer consumer's deployed CSS. |

## Usage — initial stamp (Pattern A)

Minimal form — `--name` is the only required flag (wave 61); everything else
derives a default, every applied default is printed in the stamp header, and
the target directory is created when missing:

```bash
node template/tools/blueprint-init/stamp.mjs --name=my-project
```

Explicit form (any flag overrides its default):

```bash
node template/tools/blueprint-init/stamp.mjs \
  --mode=stamp \
  --name=my-project \
  --display-name="My Project" \
  --repo-url=https://github.com/owner/my-project \
  --tagline="One-line product tagline" \
  --variant=greenfield \
  --tier=1 \
  --pattern=A \
  --target=/path/to/your/project
```

## Usage — initial stamp (Pattern B)

Pattern B scaffolding creates a Review Portal at `blueprint/portal/` (or a custom path declared in `blueprint.yml`):

```bash
node template/tools/blueprint-init/stamp.mjs \
  --mode=stamp \
  --name=my-project \
  --pattern=B \
  --target=/path/to/your/initiative
```

Explicit form:

```bash
node template/tools/blueprint-init/stamp.mjs \
  --mode=stamp \
  --name=my-project \
  --display-name="My Project" \
  --repo-url=https://github.com/owner/my-project \
  --tagline="One-line product tagline" \
  --variant=midstream \
  --tier=1 \
  --pattern=B \
  --target=/path/to/your/initiative
```

### Chrome Profile Choice (Profile A vs Profile B)

After initial stamp, declare your chrome profile in `blueprint.yml` under `prototype.chrome_profile`:

**Profile A (methodology-themed, default):** Use when your brand is a thin override on canonical chrome.
```yaml
prototype:
  chrome_profile: methodology-themed
```
Your `shared.css` is canonical (byte-identical to template). Brand tokens go in `project-tokens.css` overlay.

**Profile B (consumer-themed, opt-in):** Use when your design system is named, branded, and load-bearing (e.g., "Midnight & Indigo").
```yaml
prototype:
  chrome_profile: consumer-themed
```
Your `shared.css` is yours (drift allowed). Import canonical primitives:
```css
@layer canonical, consumer;
@import url('./canonical-primitives.css') layer(canonical);

:root {
  /* your brand tokens */
}
```

See `docs/methodology/chrome-profile-pattern.md` for full details and when to pick each.

## Usage — restamp chrome (Pattern B)

The stamper reads your `prototype.chrome_profile` from `blueprint.yml` and selects the correct manifest automatically.

```bash
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome \
  --pattern=B \
  --target=/path/to/your/initiative
```

First, run `--mode=audit-chrome --pattern=B` to classify divergences (LAG / CUSTOMIZATION-OR-ROT):

```bash
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=audit-chrome \
  --pattern=B \
  --target=/path/to/your/initiative
```

The audit report will show which profile you're using and which files are scanned.

**For Profile A (methodology-themed):** Refresh shared.css and other canonical files:
```bash
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome \
  --pattern=B \
  --target=/path/to/your/initiative \
  --accept-overwrite=shared.css,_headers
```

**For Profile B (consumer-themed):** Refresh canonical-primitives.css only (your shared.css is never touched):
```bash
node $BLUEPRINT_HOME/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome \
  --pattern=B \
  --target=/path/to/your/initiative \
  --accept-overwrite=canonical-primitives.css
```

### Scoped restamp behavior

When `--accept-overwrite=<files>` is specified, it defines the scope of files to overwrite. Files not in the list are **skipped**, not blocked:

- Files in `--accept-overwrite` are overwritten from canonical (safe for LAG-classified files)
- Diverged files NOT in `--accept-overwrite` emit `SKIPPED <file> (diverged, not in --accept-overwrite)` and the restamp continues
- This allows LAG + CUSTOMIZATION coexistence: accept the LAG files, skip the CUSTOMIZATION ones in a single run

### Pattern B chrome manifest

The Pattern B chrome manifest (`PATTERN_B_CHROME_FILES` in `stamp.mjs`) includes:

- `shared.css` — canonical chrome CSS (tokens + layout + components + drawers + nav)
- `_portal-shell.js` — canonical chrome JS (top bar, slice header, footer nav injection)
- `proto-nav.js` — canonical chrome JS (footer nav, drawers, compare toggle)
- `proto-annotate.js` — canonical annotation overlay
- `chat-widget.js` — canonical chat widget
- `theme-switcher.js` — canonical multi-theme runtime switcher
- `_headers` — Cloudflare Pages cache headers
- `_redirects` — Cloudflare Pages redirects
- `docs/index.html` — canonical docs viewer

What the mode **does not** overwrite (project-owned surface):

- `project-tokens.css` — your overlay. Created from canonical if absent; never overwritten.
- `_meta/*` — your slice metadata
- `pages/*` — your project HTML pages
- `index.html`, `prototype/index.html` — project-stamped shells (PROJECT_NAME tokens already substituted)
- `functions/*` — your API endpoints (if Pattern B is extended with serverless support)
- Any consumer customization marked as `destination: blueprint` in `_meta/*.json`

The mode auto-resolves the consumer's portal directory by checking, in order: `<target>/portal/` then `<target>/blueprint/portal/`. If the consumer's portal lives elsewhere, that's an ADR-worthy path divergence — add the path to `PATTERN_B_PORTAL_CANDIDATES` in `stamp.mjs`.

## Restamping Pattern A chrome

Not yet implemented. The Pattern A canonical chrome surface spans `template/packages/ui/`, `template/packages/design-tokens/`, and parts of `template/apps/portal/src/styles/` and `src/layouts/Layout.astro`. Before a manifest can be declared, that surface needs an audit to separate "canonical chrome" from "project-stampable scaffold." Until then, Pattern A drift detection runs through `portal-pattern-a-conformance-reviewer`'s diff-against-template check at Stage 3.

## Flags reference

| Flag | `--mode=stamp` | Required for `--mode=restamp-chrome` | What it sets |
|---|---|---|---|
| `--mode` | no (defaults to `stamp`) | yes (`restamp-chrome`) | Mode dispatch. See table above. |
| `--pattern` | default `A` | yes | `A` \| `B`. Pattern A scaffolds `apps/portal/` + `packages/`. Pattern B targets the static-HTML `portal/`. |
| `--target` | default `./<name>`; created when missing | yes (must exist) | Initiative root directory. |
| `--name` | **required** | — | Project slug. Substitutes `blueprint-example`. |
| `--display-name` | default: title-cased `--name` | — | Human-facing brand string. |
| `--repo-url` | default: `https://github.com/your-org/<name>` placeholder | — | Full GitHub URL. |
| `--tagline` | default: `"<Display Name> — a Blueprint initiative"` | — | Footer tagline. |
| `--variant` | default `greenfield` | — | `greenfield` \| `midstream` \| `brownfield`. |
| `--tier` | default `1` | — | `0` \| `1` \| `2`. Validated against Variant × Tier matrix. |
| `--logo` | no | — | Path to PNG for `public/project-logo.png`. |
| `--dry-run` | no | no | Print what would be written, don't write. |

Every default the stamp applies is echoed on a `defaulted:` line in the run
header, so a scaffold never carries a value the operator didn't see.

## What the stamper writes (Pattern A)

```
<target>/
  apps/portal/              # copied from template/apps/portal/ with substitutions
    package.json            # name → @<slug>/portal, description → tagline
    src/layouts/Layout.astro
    src/pages/*.astro
    src/pages/inspect/*.astro
    src/components/*.tsx
    public/project-logo.png # renamed from project-logo.png; replaced if --logo given
  packages/
    ui/                     # copied from template/packages/ui/ with substitutions
    design-tokens/          # copied from template/packages/design-tokens/ with substitutions
  blueprint.yml             # variant + tier + pattern written; rest stays default
```

## Substitution table

The stamper performs only the substitutions below. Business content (e.g., the 10-gate framework in `inspect/gates.astro`, the strategy delivery-fork content) and substrate-aware governance views (`inspect/coverage.astro`, `inspect/attestations.astro`, `inspect/dependencies.astro` — these call `loadState`/`loadBoard` and will fail at build time without Hive / state-derive substrate) are blueprint-example-specific and left as example data with a `REPLACE_FOR_PROJECT` banner injected at the top of each affected file. Operators choose between rewriting, deleting, or running the substrate tooling. See `template/apps/portal/README.md` § "Known limitation — substrate build coupling" for workarounds.

| Source string | Replaced with |
|---|---|
| `blueprint-example` | `<name>` |
| `Blueprint Example` | `<display-name>` |
| `@blueprint-example/` | `@<name>/` (already done in v1 snapshot, but checked for drift) |
| `https://github.com/example/blueprint-example` | `<repo-url>` |
| `An example product initiative` | `<tagline>` |
| `--bpx-` (CSS variable prefix) | `--<short>-` where `<short>` = first 4 chars of `<name>` (lowercase, alphanum) |

## Mechanical check (the property a stamper provides over a copier)

After running, the stamper executes:

```bash
grep -rl 'blueprint-example\|An example product initiative\|--bpx-' \
  <target>/apps/portal/ <target>/packages/
```

Any hits are reported. Expected hits: the `REPLACE_FOR_PROJECT`-banner files (gates, coverage, attestations, dependencies, delivery-fork, strategy index) where business content or substrate-aware governance views live. Unexpected hits block exit code 0 and emit a non-zero exit — the stamper has missed a substitution path and the methodology bug must be fixed before the consumer continues.

## Why this lives at `template/tools/blueprint-init/`

The stamper is methodology infrastructure (one of two encoded responses to the 2026-05-25 de-bcization drift; the other is the SessionStart canonical-context hook). It belongs alongside the other template-level tools (`archaeology/`, `state-derive/`) and is updated whenever the canonical `template/apps/portal/` shape evolves. The reviewer agent `portal-pattern-a-conformance-reviewer` validates the stamped output at Stage 3.

## Pattern B stamper

Pattern B has two modes:

- **Initial stamp** (`--mode=stamp --pattern=B`): **implemented (2026-06-27, amendment 1)**. Copies `template/portal/` to `blueprint/portal/` (or a custom path declared in `blueprint.yml`), applies narrow substitutions (project name, repo URL, brand tokens), and runs the mechanical check. Pattern B initiatives no longer need to copy by hand.
- **Chrome refresh** (`--mode=restamp-chrome --pattern=B`): **implemented**. Refreshes the canonical chrome manifest (`PATTERN_B_CHROME_FILES` in `stamp.mjs`) without touching project-owned files. As of 2026-06-27 (amendment 2), `--accept-overwrite` defines scope, not consent: diverged files not in the list are skipped, not blocked. This is the encoded response to the 2026-05-25 v3 chrome-drift bug where a consumer truncated 268 lines from `shared.css` mid-edit and restored from a peer consumer's deploy. The `portal-chrome-canonical-reviewer` gate enforces it.
