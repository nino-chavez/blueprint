# `template/methodology/amendments/`

Methodology-amendments template + classification taxonomy promoted as canonical methodology infrastructure in wave 27 (2026-05-27).

## What's in here

- `METHODOLOGY-AMENDMENTS.template.md` — slot-filled template with the wave 27 4-bucket taxonomy (consumer-local / template / reviewer / methodology) pre-baked into the entry shape. Copy to `blueprint/METHODOLOGY-AMENDMENTS.md` at your initiative root and start appending entries at the top.

## When to use

Adopt this template when:
- You expect to file amendments (formal or informal) over the initiative's lifetime
- You want amendment entries pre-shaped for upstream-promotion routing (so the methodology operator can grep across consumers and find candidates by bucket)
- You're a new consumer starting from scratch (the template gives you the shape rally-hq and blueprint-redesign converged on independently)

Skip when:
- Your initiative is Tier 0 / one-shot / will never produce amendments
- You already have a `METHODOLOGY-AMENDMENTS.md` file that works for you — keep it, this template is for new adopters

## Convention dependency

The template assumes the conventions documented in two source files:

1. `~/Workspace/dev/wip/blueprint/template/docs/methodology/methodology-amendments-convention.md` — the append-only file convention (entry shape, scope axis, promotion path)
2. `~/Workspace/dev/wip/blueprint/docs/amendment-classification-pattern.md` — the wave 27 4-bucket taxonomy (where the fix lands, orthogonal to scope)

The template body comments cite both. Operators new to the convention should read both first.

## Reference examples (consumer-side)

- `apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md` — 4 entries, hand-bucketed by priority + impact-scope
- `wip/blueprint-redesign/METHODOLOGY-AMENDMENTS.md` — 6 entries, hand-bucketed by wave-promotion order

Both predate the template (filed before the convention was promoted). New initiatives should start from the template here.
