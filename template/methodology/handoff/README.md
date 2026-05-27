# `template/methodology/handoff/`

Operator-handoff template promoted as canonical methodology infrastructure in wave 25 (2026-05-27).

## What's in here

- `handoff-template.md` — slot-filled template. Copy to the initiative root as `HANDOFF.md` (or to `blueprint/HANDOFF-<topic>.md` for scoped handoffs), fill the slots, delete sections that don't apply.

## When to use

See the canonical pattern doc: `~/Workspace/dev/wip/blueprint/docs/operator-handoff-pattern.md` § "When to write one." Briefly: write a handoff at stage transitions / session restarts / cross-repo dispatches where the next operator session can't recover context from `git log` + the standard pipeline artifacts alone.

## What this is NOT

- Not a replacement for `STATE.md` (living per-initiative status)
- Not a replacement for `prescription.yml` (change-item ledger)
- Not a replacement for `METHODOLOGY-AMENDMENTS.md` (methodology-learning log)
- Not reviewer-enforced as of wave 25 — operators decide when handoff cost > template-fill cost. A future amendment may add a Stage N → N+1 reviewer gate once evidence accumulates of stage-transition failures attributable to missing handoffs.

## Reference examples (consumer-side)

- `apps/rally-hq/blueprint/HANDOFF-blueprint-template-gaps.md` (cross-repo dispatch — 5 template additions handed from rally-hq to wip/blueprint)
- `wip/subs-initiative/HANDOFF.md` (session restart — Hive bootstrap continuation)

Both predate the template and are kept as historical examples. New handoffs should use the template.
