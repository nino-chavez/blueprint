---
canonical: true
---

# `blueprint-init` — stamper for new Blueprint initiatives

Mechanically-checkable scaffold for a Tier 1 Blueprint portal. Replaces the previous "copy `template/apps/portal/` and remember to de-bc-ize" pattern that left `subs-initiative` strings embedded in 6+ files (historical context: [`docs/_archive/handoffs/HANDOFF-debcization.md`](../../../docs/_archive/handoffs/HANDOFF-debcization.md)).

**The reason for a stamper, not a copier**: a stamper is mechanically checkable. After running, `grep -rl '<source-project-slug>' <target>/` returns only the substantive content files the operator chose to keep — never package metadata, footer brand, or repo URLs. A copier requires self-attestation ("did I get all the strings?"), which is the failure mode this tool exists to remove.

## Modes

The stamper has two modes, dispatched by `--mode=<mode>` (default `stamp`).

| Mode | What it does | When to use |
|---|---|---|
| `stamp` *(default)* | Initial scaffold. Copies `template/apps/portal/` + `template/packages/` (Pattern A) into a fresh `<target>`, runs substitutions, writes `blueprint.yml`, executes the mechanical check. | Once, per new Blueprint initiative. |
| `restamp-chrome` | Re-stamp canonical chrome files only. Overwrites the canonical chrome surface in `<target>` from `template/portal/` (Pattern B) or `template/apps/portal` styles (Pattern A — not yet implemented). Leaves project-owned files (`project-tokens.css`, `_meta/*`, `pages/*`, `index.html`) untouched. | Any time the methodology bumps the chrome and a consumer needs to catch up. Run instead of `curl`-ing a peer consumer's deployed CSS. |

## Usage — initial stamp (Pattern A)

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
  --target=~/Workspace/dev/wip/my-project
```

## Usage — restamp chrome (Pattern B)

```bash
node ~/Workspace/dev/wip/blueprint/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome \
  --pattern=B \
  --target=~/Workspace/dev/apps/website-nc
```

The Pattern B chrome manifest (`PATTERN_B_CHROME_FILES` in `stamp.mjs`) refreshes:

- `shared.css` — canonical chrome CSS (tokens + layout + components + drawers + nav)
- `_portal-shell.js` — canonical chrome JS (top bar, slice header, footer nav injection)
- `proto-nav.js` — canonical chrome JS (footer nav, drawers, compare toggle)
- `proto-annotate.js` — canonical annotation overlay
- `_headers` — Cloudflare Pages cache headers
- `_redirects` — Cloudflare Pages redirects

What the mode **does not** overwrite (project-owned surface):

- `project-tokens.css` — your overlay. Created from canonical if absent; never overwritten.
- `_meta/*` — your slice metadata
- `pages/*` — your project HTML pages
- `index.html`, `prototype/index.html`, `docs/index.html` — project-stamped shells (PROJECT_NAME tokens already substituted)
- `functions/*` — your API endpoints
- `wrangler.toml` — your deploy config
- `chat-widget.js` — NOT in chrome manifest yet (template version has a Rally HQ brand leak; add after fix)

The mode auto-resolves the consumer's portal directory by checking, in order: `<target>/portal/` then `<target>/blueprint/portal/`. If the consumer's portal lives elsewhere, that's an ADR-worthy path divergence — add the path to `PATTERN_B_PORTAL_CANDIDATES` in `stamp.mjs`.

## Restamping Pattern A chrome

Not yet implemented. The Pattern A canonical chrome surface spans `template/packages/ui/`, `template/packages/design-tokens/`, and parts of `template/apps/portal/src/styles/` and `src/layouts/Layout.astro`. Before a manifest can be declared, that surface needs an audit to separate "canonical chrome" from "project-stampable scaffold." Until then, Pattern A drift detection runs through `portal-pattern-a-conformance-reviewer`'s diff-against-template check at Stage 3.

## Flags reference

| Flag | Required for `--mode=stamp` | Required for `--mode=restamp-chrome` | What it sets |
|---|---|---|---|
| `--mode` | no (defaults to `stamp`) | yes (`restamp-chrome`) | Mode dispatch. See table above. |
| `--pattern` | yes | yes | `A` \| `B`. Pattern A scaffolds `apps/portal/` + `packages/`. Pattern B targets the static-HTML `portal/`. |
| `--target` | yes | yes | Initiative root directory. Must exist. |
| `--name` | yes | — | Project slug. Substitutes `subs-initiative`. |
| `--display-name` | yes | — | Human-facing brand string. |
| `--repo-url` | yes | — | Full GitHub URL. |
| `--tagline` | yes | — | Footer tagline. |
| `--variant` | yes | — | `greenfield` \| `midstream` \| `brownfield`. |
| `--tier` | yes | — | `0` \| `1` \| `2`. Validated against Variant × Tier matrix. |
| `--logo` | no | — | Path to PNG for `public/project-logo.png`. |
| `--dry-run` | no | no | Print what would be written, don't write. |

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

The stamper performs only the substitutions below. Business content (e.g., the 10-gate framework in `inspect/gates.astro`, the strategy delivery-fork content) and substrate-aware governance views (`inspect/coverage.astro`, `inspect/attestations.astro`, `inspect/dependencies.astro` — these call `loadState`/`loadBoard` and will fail at build time without Hive / state-derive substrate) are subs-initiative-specific and left as example data with a `REPLACE_FOR_PROJECT` banner injected at the top of each affected file. Operators choose between rewriting, deleting, or running the substrate tooling. See `template/apps/portal/README.md` § "Known limitation — substrate build coupling" for workarounds.

| Source string | Replaced with |
|---|---|
| `subs-initiative` | `<name>` |
| `BC Subscriptions` | `<display-name>` |
| `@subs-initiative/` | `@<name>/` (already done in v1 snapshot, but checked for drift) |
| `the subscriptions initiative's repo (private)` | `<repo-url>` |
| `An example product initiative` | `<tagline>` |
| `/project-logo.png` | `/project-logo.png` |
| `--bcs-` (CSS variable prefix) | `--<short>-` where `<short>` = first 4 chars of `<name>` (lowercase, alphanum) |

## Mechanical check (the property a stamper provides over a copier)

After running, the stamper executes:

```bash
grep -rl 'subs-initiative\|An example product initiative\|/project-logo.png\|--bcs-' \
  <target>/apps/portal/ <target>/packages/
```

Any hits are reported. Expected hits: the `REPLACE_FOR_PROJECT`-banner files (gates, coverage, attestations, dependencies, delivery-fork, strategy index) where business content or substrate-aware governance views live. Unexpected hits block exit code 0 and emit a non-zero exit — the stamper has missed a substitution path and the methodology bug must be fixed before the consumer continues.

## Why this lives at `template/tools/blueprint-init/`

The stamper is methodology infrastructure (one of two encoded responses to the 2026-05-25 de-bcization drift; the other is the SessionStart canonical-context hook). It belongs alongside the other template-level tools (`archaeology/`, `state-derive/`) and is updated whenever the canonical `template/apps/portal/` shape evolves. The reviewer agent `portal-pattern-a-conformance-reviewer` validates the stamped output at Stage 3.

## Pattern B stamper

Pattern B has two modes:

- **Initial stamp** (`--mode=stamp --pattern=B`): still deferred. Pattern B has a narrower substitution surface (project name in `index.html`, repo URL in `functions/api/chat.js`, brand in `_portal-shell.js`). Until the initial stamp lands, Pattern B initiatives copy `template/portal/` by hand and rely on `portal-pattern-b-conformance-reviewer` at Stage 3.
- **Chrome refresh** (`--mode=restamp-chrome --pattern=B`): **implemented**. Refreshes the canonical chrome manifest (`PATTERN_B_CHROME_FILES` in `stamp.mjs`) without touching project-owned files. This is the encoded response to the 2026-05-25 v3 chrome-drift bug where a consumer truncated 268 lines from `shared.css` mid-edit and restored from a peer consumer's deploy. The `portal-chrome-canonical-reviewer` gate enforces it.
