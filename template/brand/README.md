# template/brand/

Blueprint-the-product brand assets + reference kits. Promoted from the blueprint-redesign dogfood (`dogfood-v1` @ commit `cc4f62f`) per methodology wave 12 (2026-05-26).

## What's here

| File | What it is |
|---|---|
| `blueprint-brand-kit.json` | Blueprint-the-product's canonical `forge-brand`-compatible brand kit. Identity (B1 outcome-led tagline + B2 Solution Architecture register), colors (slate primary matching `[data-theme=slate]` default), typography (Inter + JetBrains Mono), voice block (4-axis spine from `template/methodology/voice/EXAMPLE-voice-rules.md`). |

## How consumer initiatives use this

The kit is a reference, not a default. Consumer initiatives have three paths:

1. **Use the multi-theme registry** (recommended for most) — pick `theme: slate | coral | forest | minimal` in `blueprint.yml`. Visual identity comes from the canonical theme; consumer doesn't author a brand kit at all.
2. **Fork this kit** as a starting point for `forge-brand init --from template/brand/blueprint-brand-kit.json -o ./brand/my-kit.json` and customize.
3. **Use `theme: custom`** in `blueprint.yml` + author `[data-theme="custom"]` overrides in `project-tokens.css`.

## How to propose a new canonical theme

The 4 themes in `template/portal/shared.css [data-theme]` blocks aren't fixed — methodology can add a 5th. Process:

1. Author a brand kit for the new theme using `forge-brand init` + `forge-brand generate palette/fonts/voice`.
2. Validate WCAG AA contrast for all `--brand-700` against `--bg` across all 4 themes.
3. PR adds the new `[data-theme="<name>"]` block to `shared.css` + updates `stamp.mjs` VALID_THEMES set + updates `blueprint.yml` doc.
4. The kit lives in `template/brand/<name>-brand-kit.json` as the canonical reference.

## Origin

`blueprint-brand-kit.json` was forked from `tools/forge-brand/presets/signal-dispatch.json` during the dogfood, then overridden with Blueprint-the-product identity (B1 outcome-led tagline, B2 Solution Architecture register, light surfaces, slate primary matching the default theme). Voice block authored from the 2026-05-26 operator-grilled session.

The kit's `media.templates[]` array is metadata-only — forge-brand's renderer has a hard-coded set (`social-card / story / flyer / favicon / prescription-label / heat-card / email-header / business-card`). Of those, social-card / story / email-header / business-card / favicon are appropriate for a methodology product; the rest are domain-specific.
