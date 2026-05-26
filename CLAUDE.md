# Blueprint methodology source

**Repo role: I am the Blueprint methodology source.** This repo holds the canonical methodology — `METHODOLOGY.md`, `docs/`, and `template/` — that consumer initiatives reference and stamp from. Verify `pwd` ends in `wip/blueprint` (not `wip/blueprint-redesign` or any consumer-shaped path) before any commit; if it ends in a consumer path, stop and switch sessions.

## What this repo is, and is not

- **Is**: the methodology distribution — `METHODOLOGY.md` (first-principles), `docs/` (canonical taxonomies, variant + tier + pattern decision trees, ADRs), `template/` (the stamper substrate + reviewer agents + hooks shipped to consumers).
- **Is not**: a consumer initiative. There is no `blueprint.yml` at this root, no `research/`, no `decisions/`, no `portal/`. If you find yourself reaching for those, you opened the wrong repo.

The dogfooding consumer for this methodology is `~/Workspace/dev/wip/blueprint-redesign/` (Blueprint applied to itself). Other live consumers: `apps/rally-hq/`, `apps/website-nc-v3/`, `apps/blog/blueprint/`, `wip/bc-subscriptions/`.

## Operating invariants

The two rules from `template/CLAUDE.md` apply here in reverse:

- **Shell is throwaway; artifacts are forever**: in this repo "artifacts" means the methodology — `METHODOLOGY.md`, `docs/`, `template/`. Treat edits to those with the same care as edits to a consumer's `research/` or `decisions/`.
- **Methodology freeze during consumer migration**: the rule's intent reads from this side as — when a consumer is in flight, no template edits land here without an explicit operator waiver ("patch upstream now, consumer keeps local fixes"; see wave 5 commit `53fe1f0` for the pattern). Otherwise consumers and methodology evolve sequentially.

Operator check before editing `template/`: confirm which consumer initiatives are in flight (`ls ~/Workspace/dev/wip/blueprint-redesign/.git/HEAD`, peer consumer worktrees) and whether the current edit has waiver authority.

## Wave log

Methodology changes ship in waves so consumers can sync coherently:

- Wave 2 (`0731ccb`) — pilot profile lock + confident preview + monetization axis
- Wave 3 (`ecedef3`) — Pattern B chrome canonical split + restamp + reviewer
- Wave 4 (`86baf7c`) — manifest-driven Pattern B chrome + Rally HQ leak excision
- Wave 5 (`53fe1f0`) — 6 chrome/docs bug fixes from blog consumer

Each wave includes a freeze-rule acknowledgment in the commit message and a recommended consumer-sync command.

## Methodology canonical docs

- `METHODOLOGY.md` — first-principles, agent-struggle-is-missing-capability
- `docs/variant-selection.md` — greenfield / midstream / brownfield decision tree
- `docs/portal-and-tier-ladder.md` — Pattern A / B portal + tier 0/1/2 ladder
- `docs/methodology/methodology-amendments-convention.md` — how consumers record candidate-for-promotion gaps

## See also

- `template/CLAUDE.md` — the CLAUDE.md shipped to consumers (the inverse of this file)
