# Blueprint methodology source — and its own first consumer

**Repo role: I am the Blueprint methodology source AND its reference-implementation consumer.** This repo holds two things that share one tree (folded 2026-06-05):

1. **The methodology distribution** (what external consumers pull): `METHODOLOGY.md`, `docs/`, and `template/` — the stamper substrate + reviewer agents + hooks shipped to consumers.
2. **Blueprint applied to itself** (the self-application / reference portal): a root `blueprint.yml`, `research/`, `decisions/`, `feedback/` (stakeholder captures + triage; demand-evidence log at `docs/content/validation-script.md`), `apps/portal/`, `packages/`, `tools/archaeology/` — the productization initiative, run *as* a Blueprint initiative, in this repo. The portal at `apps/portal/` is the live Pattern A reference implementation, demo, and onboarding knowledge base for new consumers.

The dual role is deliberate: a methodology proves itself by being its own first consumer — the compiler that compiles itself. Verify `pwd` ends in `tools/blueprint` before any commit.

## The boundary that matters is a DIRECTORY boundary, not a repo boundary

The rule that keeps the methodology reusable is NOT "no consumer artifacts in this repo" (the root IS a consumer now). It is:

- **`template/` is the stampable substrate — keep it clean.** External consumers stamp from `template/` and ONLY `template/`: `template/tools/blueprint-init/stamp.mjs` walks the passed `src` and never reads the repo root; its `mechanicalCheck` is scoped to the stamped target. The self-application's `blueprint.yml`, `research/`, `decisions/`, and `apps/portal/` at the root **never reach what a consumer stamps**, so they cannot pollute it. A change to `template/` is a methodology change; a change to the root is self-application work.
- **If you find yourself editing `template/` to make the self-application's portal build, stop — that's the leak.** Fix it at the root (`apps/portal/`, `packages/`). The portal under `apps/` is the *instance*; `template/apps/portal/` is the *boilerplate*. Keep them distinct.

## Operating invariants

- **Shell is throwaway; artifacts are forever**: "artifacts" here means BOTH the methodology (`METHODOLOGY.md`, `docs/`, `template/`) AND the self-application's evidence (`research/`, `decisions/`, `blueprint.yml`, committed `*.md` rationale). Scaffolding (`apps/portal/dist`, `node_modules`, `.wrangler`, `.astro`) is throwaway — regenerate it. Treat both artifact columns with the care a consumer gives its `research/`.
- **Methodology freeze during consumer migration**: when an EXTERNAL consumer is mid-migration picking up a methodology update, no `template/` edits land without an explicit operator waiver ("patch upstream now, consumer keeps local fixes"; see wave 5 commit `53fe1f0`). The in-repo self-application is pinned to `methodology_version: self` and does NOT trip this. The freeze is about concurrent *editing*, not repo topology — concurrent SESSIONS editing this repo still use worktrees (the `worktree-guard` hook enforces it; a solo session in main is never blocked).

Operator check before editing `template/`: confirm which external consumer initiatives are in flight and whether the edit has waiver authority. Editing the root self-application never trips the freeze. The consumer registry is `consumers.yml` (13 registered; inspect with `blueprint fleet`) — external initiatives at rest (subs-initiative mid-flight on its own pinned methodology copy — not mid-migration); verify with `blueprint fleet` rather than trusting this sentence.

## Wave log

Methodology changes ship in waves (freeze-rule acknowledgment + consumer-sync command per wave). The full log moved to **`WAVE-LOG.md`** (2026-05-29) to keep this charter scannable — filter it with `node template/tools/wave-digest/digest.mjs --source=WAVE-LOG.md --since=N` / `--keyword=<regex>`.

**Current state: read the LAST entry of `WAVE-LOG.md`** — that file is the single source of wave state (claim-ownership rule, wave 59; this charter used to cache the tail here and the cache rotted every wave). Filter it: `node template/tools/wave-digest/digest.mjs --source=WAVE-LOG.md --since=N`, or `tail -3 WAVE-LOG.md` for the latest entry.

**Standing state:** build order 0–13 COMPLETE across tracks A–E. The CLI is **PUBLISHED** — `@nino-chavez-labs/blueprint-cli` on npm (MIT, public repo; `npm view` for the live version — releases ship via `bin/release-if-unpublished.mjs` on main pushes); `npx @nino-chavez-labs/blueprint-cli init` is the public scaffolder and `init/review/cost/fleet/upgrade/doctor/hive setup` are all real (six dependency-free libs under `template/tools/lib/` + the hive bootstrap, each with self-tests). The `main-protection` ruleset is bound + active (2026-06-05, id 17343422 — PR + 1 code-owner review + linear history, admin-bypass during the solo phase). Reviewer fleet: 22 specs (17 executable outside Codex — `blueprint review --list`); `doctor` runs 12 checks. Consumers: 13 registered in `consumers.yml` (inspect with `blueprint fleet`); external initiatives at rest. Pattern A consumers re-stamp to inherit the generic harness + author a `blueprint.yml portal:` block; Pattern B consumer-sync: `--mode=audit-chrome` to classify divergences, then `--mode=restamp-chrome --accept-overwrite=<LAG-files>`.

## Methodology canonical docs

- `METHODOLOGY.md` — first-principles, agent-struggle-is-missing-capability
- `docs/variant-selection.md` — greenfield / midstream / brownfield decision tree
- `docs/portal-and-tier-ladder.md` — Pattern A / B portal + tier 0/1/2 ladder
- `template/docs/methodology/methodology-amendments-convention.md` — how consumers record candidate-for-promotion gaps
- `docs/productization/README.md` — **why Blueprint became a team-adoptable platform + how it maps to the code** (the goal, the gap scorecard, the six tracks, ADR→feature→wave map, mirrored research). The platform ADRs themselves live at `docs/decisions/ADR-0003..0007` (promoted from the `blueprint-platform` dogfood, wave 43).

## See also

- `template/AGENTS.md` — the AGENTS.md shipped to consumers (the inverse of this file)
