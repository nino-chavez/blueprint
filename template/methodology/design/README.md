# template/methodology/design/

Stage 1 design-discovery + Stage 2 design-system reference artifacts. Promoted from the blueprint-redesign dogfood (`dogfood-v1` @ commit `cc4f62f`) per methodology wave 8 (2026-05-26).

## What's here

| File | What it is |
|---|---|
| `audit-template.md` | Canonical Stage 1 design-discovery audit template. Cross-audit reconciliation across three independent consumer dogfoods (rally-hq, signal-dispatch blog, blueprint-redesign). Declares 7 universal audit sections + 2 variant-conditional sections + sections that explicitly cap out of Stage 1. |
| `EXAMPLE-surface-audit.md` | Worked example — blueprint-redesign's own L5 portal surface audit. 11 surfaces, L0-L5 atomic-design coverage, 7 named audit-gaps. |
| `EXAMPLE-design-system.md` | Worked example — blueprint-redesign's Stage 2 design-system definition. L0-L4 dictionary derived from the surface audit. Demonstrates the discipline of deferring L0 brand decisions instead of inventing them. |
| `EXAMPLE-stage4-fact-check.md` | Worked example — blueprint-redesign's Stage 4 fact-check run. Documents the solo-initiative degrade-path the methodology now codifies in METHODOLOGY.md § Stage 4. |

## How to use

For a new consumer initiative entering Stage 1:

1. Read `audit-template.md` to understand the audit shape.
2. Read `EXAMPLE-surface-audit.md` to see the shape applied to a real (small) consumer.
3. Run the audit against your own initiative — write `research/surface-audit.md` + the three companion files (component-audit, content-type-taxonomy, auth-boundary-map).
4. Use `EXAMPLE-design-system.md` as the shape for your Stage 2 design-system dictionary.

## Origin

These artifacts were authored during the blueprint-redesign dogfood (`dogfood/self-redesign` branch on this repo, tagged `dogfood-v1`). Three independent dogfoods (rally-hq, signal-dispatch blog, blueprint-redesign) converged on the same finding — L4 templates were absent because Stage 1 produced no L5 surface inventory to derive them from. The amendment + this reference set close that gap at the methodology layer.

See `METHODOLOGY-AMENDMENTS.md` (in the blueprint-redesign initiative) § 2026-05-26 entry "Stage 1 missing design-discovery sub-track" for the full discovery context.
