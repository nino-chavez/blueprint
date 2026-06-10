# HANDOFF — Blueprint methodology source (self-hosting)

**Date:** 2026-06-06
**State:** Productization **COMPLETE**. The methodology is published, public, and self-hosting — it is its own first consumer. Current frontier: **team adoption** (Blueprint + hive for a real client build) and doc/quality hygiene.

> This file orients the next session. It replaced a 2026-06-04 pre-fold snapshot (blueprint-platform as a separate in-progress repo) — all of which is now done; see git history if you need it.

## Where things stand

- **Folded (wave 45):** `blueprint-platform` is no longer a separate repo — it is this repo's in-repo self-application. Root `blueprint.yml`, `research/`, `decisions/`, `apps/portal/`, `packages/`, `tools/archaeology/`. Source≠consumer is a **DIRECTORY boundary** (`template/` is the clean stampable substrate), not a repo boundary. See `CLAUDE.md`.
- **CLI published:** `@nino-chavez-labs/blueprint-cli@0.1.0` on npm (MIT, public repo). All commands real: `init / review / cost / fleet / upgrade / doctor / hive`. Six dependency-free libs under `template/tools/lib/` + the hive `bootstrap.mjs`, each with a `--self-test`.
- **Build order 0–13 complete** across tracks A–E. `main-protection` ruleset bound + active.
- **Portal:** bespoke product site at `apps/portal/` → deploys to `blueprint-platform.pages.dev` via `.github/workflows/deploy-portal.yml`. `portal_pattern: bespoke` with a divergence ADR (`decisions/02-portal-bespoke-product-site.md`); `doctor` is green.
- **Latest wave (49):** Blueprint + hive **team onboarding/adoption kit** — `docs/governance/team-roles-and-conventions.md`, `docs/governance/hive-identity-gap.md`, `template/tools/hive/{ONBOARDING,BOOTSTRAP}.md`, and the keystone `blueprint hive setup --slug=<x>` (`template/tools/hive/bootstrap.mjs`). Full log in `WAVE-LOG.md`.

## In flight / next

- **Team adoption (the live driver):** T. is adopting Blueprint + hive for a client the commerce platform build — the first real *team* engagement. Treat his needs as the priority signal for hive productization. The `blueprint hive setup --execute` path is operator-gated (real billable CF infra; needs the client repo) — do not run it autonomously.
- **Hive identity hardening — TRIGGER, not yet due:** the substrate authenticates with a shared bearer (spoofable attribution; see `docs/governance/hive-identity-gap.md`). For ≤3 trusted/co-located operators, option (a) trust + risk-register is the accepted call. **Harden to per-session JWT BEFORE a 2nd team or any external contributor joins** — that onboarding is the trigger, and the hardening must land before it.
- **Multi-operator chaos test:** the substrate is built but never run under contention. Owned by the first real parallel engagement (T.).
- **The false-green gap (no-regret, deferred):** Fact-Check (Stage 4) does not gate on runtime/browser verification; `doctor` is honest about this boundary. Closing it is the next quality frontier.

## Standing constraints

- **Methodology freeze:** no `template/` edits land while an EXTERNAL consumer is mid-migration without an explicit operator waiver. The in-repo self-application (`methodology_version: self`) does not trip this. Consumers currently at rest: `apps/rally-hq`, `apps/website-nc-v3`, `apps/blog/blueprint`, `wip/subs-initiative`.
- **Concurrent sessions use worktrees** (the `worktree-guard` hook enforces it; a solo session in main is never blocked).
- **ai-hive: integrate, not absorb.** Hold the line against SaaS-scope-creep — scope ceiling A (methodology-native: git-host + npm + local files, no hosted service).
- **`template/` is the clean substrate.** If you find yourself editing `template/` to make the self-application's portal build, that's the leak — fix it at the root (`apps/portal/`, `packages/`).
