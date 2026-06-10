# Blueprint methodology source — and its own first consumer

**Repo role: I am the Blueprint methodology source AND its reference-implementation consumer.** This repo holds two things that share one tree (folded 2026-06-05):

1. **The methodology distribution** (what external consumers pull): `METHODOLOGY.md`, `docs/`, and `template/` — the stamper substrate + reviewer agents + hooks shipped to consumers.
2. **Blueprint applied to itself** (the self-application / reference portal): a root `blueprint.yml`, `research/`, `decisions/`, `feedback/` (stakeholder captures + triage; demand-evidence log at `docs/content/validation-script.md`), `apps/portal/`, `packages/`, `tools/archaeology/`, `START-HERE.md` — the productization initiative, run *as* a Blueprint initiative, in this repo. The portal at `apps/portal/` is the live Pattern A reference implementation, demo, and onboarding knowledge base for new consumers.

The dual role is deliberate: a methodology proves itself by being its own first consumer — the compiler that compiles itself. Verify `pwd` ends in `tools/blueprint` before any commit.

## The boundary that matters is a DIRECTORY boundary, not a repo boundary

The rule that keeps the methodology reusable is NOT "no consumer artifacts in this repo" (the root IS a consumer now). It is:

- **`template/` is the stampable substrate — keep it clean.** External consumers stamp from `template/` and ONLY `template/`: `template/tools/blueprint-init/stamp.mjs` walks the passed `src` and never reads the repo root; its `mechanicalCheck` is scoped to the stamped target. The self-application's `blueprint.yml`, `research/`, `decisions/`, and `apps/portal/` at the root **never reach what a consumer stamps**, so they cannot pollute it. A change to `template/` is a methodology change; a change to the root is self-application work.
- **If you find yourself editing `template/` to make the self-application's portal build, stop — that's the leak.** Fix it at the root (`apps/portal/`, `packages/`). The portal under `apps/` is the *instance*; `template/apps/portal/` is the *boilerplate*. Keep them distinct.

## Operating invariants

- **Shell is throwaway; artifacts are forever**: "artifacts" here means BOTH the methodology (`METHODOLOGY.md`, `docs/`, `template/`) AND the self-application's evidence (`research/`, `decisions/`, `blueprint.yml`, committed `*.md` rationale). Scaffolding (`apps/portal/dist`, `node_modules`, `.wrangler`, `.astro`) is throwaway — regenerate it. Treat both artifact columns with the care a consumer gives its `research/`.
- **Methodology freeze during consumer migration**: when an EXTERNAL consumer is mid-migration picking up a methodology update, no `template/` edits land without an explicit operator waiver ("patch upstream now, consumer keeps local fixes"; see wave 5 commit `53fe1f0`). The in-repo self-application is pinned to `methodology_version: self` and does NOT trip this. The freeze is about concurrent *editing*, not repo topology — concurrent SESSIONS editing this repo still use worktrees (the `worktree-guard` hook enforces it; a solo session in main is never blocked).

Operator check before editing `template/`: confirm which external consumer initiatives are in flight and whether the edit has waiver authority. Editing the root self-application never trips the freeze. The consumer registry is `consumers.yml` (12 registered; inspect with `blueprint fleet`) — external initiatives at rest as of wave 54, with subs-initiative mid-flight on its own pinned methodology copy (not mid-migration).

## Wave log

Methodology changes ship in waves (freeze-rule acknowledgment + consumer-sync command per wave). The full log moved to **`WAVE-LOG.md`** (2026-05-29) to keep this charter scannable — filter it with `node template/tools/wave-digest/digest.mjs --source=WAVE-LOG.md --since=N` / `--keyword=<regex>`.

**Current state:** wave 57 — **market-signal triage category + assumption archetypes (two second-instance promotions) + the ground-truth-scope gap** — the eng-team thread (`feedback/2026-06-09-eng-team-thread.md`) was the first stakeholder review of a generated ARTIFACT against real domain knowledge: it fired the second-instance rule twice (`/blueprint-triage` gains `market-signal` + `logged`; the Mom Test pattern doc gains § Assumption archetypes), named a NEW false-green class (fact-check verifies against the repo it has, with no check that the repo implements the domain — candidate Stage-1 scope question + Stage-4 `GROUND_TRUTH_SCOPE` criterion), and logged the first **inbound advancement** (the team proposed a second-attempt experiment with full repo scope — acceptance pending, the hottest open item in `HANDOFF.md`). Validation script: NEW A7 (solo-operator prod credibility, challenged — the buyer's model is role-gated sign-offs per stage). Prior: wave 56 — **public-repo sanitization + reader-path review + neutral template source identity** (reader-path manifest in `docs/README.md`; employer/initiative names removed repo-wide + history rewritten; substrate re-keyed to `blueprint-example`, BREAKING for restamp; functional keeps: `@bigcommerce/big-design*` deps, `bigdesign` enum, `signal_forge:` key). Prior: wave 55 — **enforcement wiring + privacy-safe capture** (`.github/workflows/doctor.yml` gates every push/PR; `/blueprint-triage` anonymize-by-default capture). Prior: wave 54 — **docs/ reorg** (typed subdirs; BREAKING for stamped consumers until re-stamp / pick-up-updates). Prior: wave 53 — **Mom Test ask-outcome discipline** (§ Ask outcomes; an untaken ask is first-class negative evidence). **Full wave history: `WAVE-LOG.md`** — filter with `node template/tools/wave-digest/digest.mjs --source=WAVE-LOG.md --since=N`.

**Standing state:** build order 0–13 COMPLETE across tracks A–E. The CLI is **PUBLISHED** — `@nino-chavez-labs/blueprint-cli@0.1.0` on npm (MIT, public repo); `npx @nino-chavez-labs/blueprint-cli init` is the public scaffolder and `init/review/cost/fleet/upgrade/doctor/hive setup` are all real (six dependency-free libs under `template/tools/lib/` + the hive bootstrap, each with self-tests). The `main-protection` ruleset is bound + active (2026-06-05, id 17343422 — PR + 1 code-owner review + linear history, admin-bypass during the solo phase). Reviewer fleet: 14 (12 executable outside Claude Code); `doctor` runs 7 checks. Consumers: 12 registered in `consumers.yml` (inspect with `blueprint fleet`); external initiatives at rest. Pattern A consumers re-stamp to inherit the generic harness + author a `blueprint.yml portal:` block; Pattern B consumer-sync: `--mode=audit-chrome` to classify divergences, then `--mode=restamp-chrome --accept-overwrite=<LAG-files>`.

## Methodology canonical docs

- `METHODOLOGY.md` — first-principles, agent-struggle-is-missing-capability
- `docs/variant-selection.md` — greenfield / midstream / brownfield decision tree
- `docs/portal-and-tier-ladder.md` — Pattern A / B portal + tier 0/1/2 ladder
- `template/docs/methodology/methodology-amendments-convention.md` — how consumers record candidate-for-promotion gaps
- `docs/productization/README.md` — **why Blueprint became a team-adoptable platform + how it maps to the code** (the goal, the gap scorecard, the six tracks, ADR→feature→wave map, mirrored research). The platform ADRs themselves live at `docs/decisions/ADR-0003..0007` (promoted from the `blueprint-platform` dogfood, wave 43).

## See also

- `template/CLAUDE.md` — the CLAUDE.md shipped to consumers (the inverse of this file)
