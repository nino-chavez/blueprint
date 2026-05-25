---
canonical: true
---

# `blueprint-init` — stamper for new Blueprint initiatives

Mechanically-checkable scaffold for a Tier 1 Blueprint portal. Replaces the previous "copy `template/apps/portal/` and remember to de-bc-ize" pattern that left `bc-subscriptions` strings embedded in 6+ files (historical context: [`docs/_archive/handoffs/HANDOFF-debcization.md`](../../../docs/_archive/handoffs/HANDOFF-debcization.md)).

**The reason for a stamper, not a copier**: a stamper is mechanically checkable. After running, `grep -rl '<source-project-slug>' <target>/` returns only the substantive content files the operator chose to keep — never package metadata, footer brand, or repo URLs. A copier requires self-attestation ("did I get all the strings?"), which is the failure mode this tool exists to remove.

## Usage

```bash
node template/tools/blueprint-init/stamp.mjs \
  --name=my-project \
  --display-name="My Project" \
  --repo-url=https://github.com/owner/my-project \
  --tagline="One-line product tagline" \
  --variant=greenfield \
  --tier=1 \
  --pattern=A \
  --target=~/Workspace/dev/wip/my-project
```

| Flag | Required | What it sets |
|---|---|---|
| `--name` | yes | Project slug. Substitutes `bc-subscriptions` in code, package descriptions, source links. |
| `--display-name` | yes | Human-facing brand string (footer, PortalNav, page titles). |
| `--repo-url` | yes | Full GitHub URL (`https://github.com/owner/repo`). Substitutes `https://github.com/nino-chavez/bc-subscriptions`. |
| `--tagline` | yes | Footer tagline. Substitutes `BigCommerce-native subscription management`. |
| `--variant` | yes | `greenfield` \| `midstream` \| `brownfield`. Written to `blueprint.yml`. |
| `--tier` | yes | `0` \| `1` \| `2`. Validated against the Variant × Tier matrix (`docs/portal-and-tier-ladder.md`). |
| `--pattern` | yes | `A` \| `B`. Pattern A scaffolds `apps/portal/` + `packages/`. Pattern B scaffolds `portal/` (deferred — see issues). |
| `--target` | yes | Initiative root directory. Must exist; the stamper writes into it, doesn't create it. |
| `--logo` | no | Path to a PNG for `public/project-logo.png`. Defaults to a placeholder. |
| `--dry-run` | no | Print what would be written, don't write. |

## What the stamper writes (Pattern A)

```
<target>/
  apps/portal/              # copied from template/apps/portal/ with substitutions
    package.json            # name → @<slug>/portal, description → tagline
    src/layouts/Layout.astro
    src/pages/*.astro
    src/pages/inspect/*.astro
    src/components/*.tsx
    public/project-logo.png # renamed from subs-logo.png; replaced if --logo given
  packages/
    ui/                     # copied from template/packages/ui/ with substitutions
    design-tokens/          # copied from template/packages/design-tokens/ with substitutions
  blueprint.yml             # variant + tier + pattern written; rest stays default
```

## Substitution table

The stamper performs only the substitutions below. Business content (e.g., the 10-gate framework in `inspect/gates.astro`, the strategy delivery-fork content) is bc-subscriptions-specific and is left as example data with a `REPLACE_FOR_PROJECT` banner injected at the top of each affected file. Operators choose between rewriting or deleting those routes.

| Source string | Replaced with |
|---|---|
| `bc-subscriptions` | `<name>` |
| `BC Subscriptions` | `<display-name>` |
| `@bc-subscriptions/` | `@<name>/` (already done in v1 snapshot, but checked for drift) |
| `https://github.com/nino-chavez/bc-subscriptions` | `<repo-url>` |
| `BigCommerce-native subscription management` | `<tagline>` |
| `/subs-logo.png` | `/project-logo.png` |
| `--bcs-` (CSS variable prefix) | `--<short>-` where `<short>` = first 4 chars of `<name>` (lowercase, alphanum) |

## Mechanical check (the property a stamper provides over a copier)

After running, the stamper executes:

```bash
grep -rl 'bc-subscriptions\|BigCommerce-native subscription management\|/subs-logo.png\|--bcs-' \
  <target>/apps/portal/ <target>/packages/
```

Any hits are reported. Expected hits: the `REPLACE_FOR_PROJECT`-banner files (gates, delivery-fork) where business content lives. Unexpected hits block exit code 0 and emit a non-zero exit — the stamper has missed a substitution path and the methodology bug must be fixed before the consumer continues.

## Why this lives at `template/tools/blueprint-init/`

The stamper is methodology infrastructure (one of two encoded responses to the 2026-05-25 de-bcization drift; the other is the SessionStart canonical-context hook). It belongs alongside the other template-level tools (`archaeology/`, `state-derive/`) and is updated whenever the canonical `template/apps/portal/` shape evolves. The reviewer agent `portal-pattern-a-conformance-reviewer` validates the stamped output at Stage 3.

## Pattern B stamper

Deferred. Pattern B (`template/portal/`, static HTML) has a narrower substitution surface (project name in `index.html`, repo URL in `functions/api/chat.js`, brand in `_portal-shell.js`). A Pattern B stamper will land when the third Pattern B initiative needs it. Until then, Pattern B initiatives copy `template/portal/` and the `portal-pattern-b-conformance-reviewer` catches drift at Stage 3.
