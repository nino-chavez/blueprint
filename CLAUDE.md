# Blueprint methodology source

**Repo role: I am the Blueprint methodology source.** This repo holds the canonical methodology — `METHODOLOGY.md`, `docs/`, and `template/` — that consumer initiatives reference and stamp from. Verify `pwd` ends in `tools/blueprint` (not `wip/blueprint-redesign` or any consumer-shaped path) before any commit; if it ends in a consumer path, stop and switch sessions.

## What this repo is, and is not

- **Is**: the methodology distribution — `METHODOLOGY.md` (first-principles), `docs/` (canonical taxonomies, variant + tier + pattern decision trees, ADRs), `template/` (the stamper substrate + reviewer agents + hooks shipped to consumers).
- **Is not**: a consumer initiative. There is no `blueprint.yml` at this root, no `research/`, no `decisions/`, no `portal/`. If you find yourself reaching for those, you opened the wrong repo.

The dogfooding consumer for this methodology is `~/Workspace/dev/wip/blueprint-redesign/` (Blueprint applied to itself). Other live consumers: `apps/rally-hq/`, `apps/website-nc-v3/`, `apps/blog/blueprint/`, `wip/subs-initiative/`.

## Operating invariants

The two rules from `template/CLAUDE.md` apply here in reverse:

- **Shell is throwaway; artifacts are forever**: in this repo "artifacts" means the methodology — `METHODOLOGY.md`, `docs/`, `template/`. Treat edits to those with the same care as edits to a consumer's `research/` or `decisions/`.
- **Methodology freeze during consumer migration**: the rule's intent reads from this side as — when a consumer is in flight, no template edits land here without an explicit operator waiver ("patch upstream now, consumer keeps local fixes"; see wave 5 commit `53fe1f0` for the pattern). Otherwise consumers and methodology evolve sequentially.

Operator check before editing `template/`: confirm which consumer initiatives are in flight (`ls ~/Workspace/dev/wip/blueprint-redesign/.git/HEAD`, peer consumer worktrees) and whether the current edit has waiver authority.

## Wave log

Methodology changes ship in waves (freeze-rule acknowledgment + consumer-sync command per wave). The full log moved to **`WAVE-LOG.md`** (2026-05-29) to keep this charter scannable — filter it with `node template/tools/wave-digest/digest.mjs --source=WAVE-LOG.md --since=N` / `--keyword=<regex>`.

**Current state:** wave 42 logged (`225d3ab` — `blueprint doctor` conformance capstone, build-order step 12; the **build order is COMPLETE, every CLI command real**). doctor gates on real runtime verification (loads config + every reviewer + runs portal conformance), honest about what it didn't check (build/browser = deploy gate). Recent: wave 41 (`96f60db`) org-authored reviewer discovery; wave 40 (`42369ab`) amendment/RFC triage; wave 39 (`ab4e9e2`) access + governance (operator action to bind: `docs/governance/apply-ruleset.sh`); wave 38 (`3d3904b`) `blueprint upgrade`; wave 37 (`1bfdc19`) consumer registry + `blueprint fleet`; wave 36 (`d95dadd`) cost telemetry + gate; wave 35 (`eb250e5`) cost dial. From the `wip/blueprint-platform` productization dogfood (scope ceiling A — methodology-native; design + a **deployed + public** Pattern A portal at blueprint-platform.pages.dev / github.com/nino-chavez/blueprint-platform). **Build order 0–13 COMPLETE** across tracks A–E. Remaining is operator-gated activation, NOT new steps: run `docs/governance/apply-ruleset.sh` (bind the ruleset) and `npm publish @nino-chavez/blueprint-cli` (then `npx @nino-chavez/blueprint-cli init` is the public scaffolder + the real commands ship). CLI: `init/review/cost/fleet/upgrade/doctor` all real; six dependency-free libs under `template/tools/lib/` with self-tests (cost-dial/telemetry/consumers-registry/upgrade/reviewer-registry/doctor). blueprint-redesign at rest (`cc4f62f`); rally-hq at rest (`1aa3c35`); blueprint-platform active. Pattern A consumers re-stamp to inherit the generic harness + author a `blueprint.yml portal:` block (Tier-0 default builds clean without one); `npx @nino-chavez/blueprint-cli init` is the scaffolder once published. Methodology freeze lifted. Pattern B consumer-sync (waves 8-16): `--mode=audit-chrome` to classify divergences, then `--mode=restamp-chrome --accept-overwrite=<LAG-files>` to pull forward safely.

## Methodology canonical docs

- `METHODOLOGY.md` — first-principles, agent-struggle-is-missing-capability
- `docs/variant-selection.md` — greenfield / midstream / brownfield decision tree
- `docs/portal-and-tier-ladder.md` — Pattern A / B portal + tier 0/1/2 ladder
- `docs/methodology/methodology-amendments-convention.md` — how consumers record candidate-for-promotion gaps

## See also

- `template/CLAUDE.md` — the CLAUDE.md shipped to consumers (the inverse of this file)
