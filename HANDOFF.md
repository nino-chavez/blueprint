# HANDOFF — Blueprint methodology source (self-hosting)

**Date:** 2026-06-10
**State:** Productization **COMPLETE**. The methodology is published, public, and self-hosting — it is its own first consumer. Current frontier: **team adoption** (Blueprint + hive for a real client build) and **demand validation** — organic stakeholder feedback is flowing (`feedback/`, demand-evidence log at `docs/content/validation-script.md`) and drove waves 51/53 (Mom Test bridge + ask-outcome discipline). Recent: wave 52 (DoD verification ladder), wave 54 (docs/ reorg into typed subdirs — stamped consumers carry stale `$BLUEPRINT_HOME/docs/` paths until they re-run pick-up-updates).

> This file orients the next session. It replaced a 2026-06-04 pre-fold snapshot (blueprint-platform as a separate in-progress repo) — all of which is now done; see git history if you need it.

## Where things stand

- **Folded (wave 45):** `blueprint-platform` is no longer a separate repo — it is this repo's in-repo self-application. Root `blueprint.yml`, `research/`, `decisions/`, `apps/portal/`, `packages/`, `tools/archaeology/`. Source≠consumer is a **DIRECTORY boundary** (`template/` is the clean stampable substrate), not a repo boundary. See `CLAUDE.md`.
- **CLI published:** `@nino-chavez-labs/blueprint-cli@0.1.0` on npm (MIT, public repo). All commands real: `init / review / cost / fleet / upgrade / doctor / hive`. Six dependency-free libs under `template/tools/lib/` + the hive `bootstrap.mjs`, each with a `--self-test`.
- **Build order 0–13 complete** across tracks A–E. `main-protection` ruleset bound + active.
- **Portal:** bespoke product site at `apps/portal/` → deploys to `blueprint-platform.pages.dev` via `.github/workflows/deploy-portal.yml`. `portal_pattern: bespoke` with a divergence ADR (`decisions/02-portal-bespoke-product-site.md`); `doctor` is green.
- **Latest wave (55):** enforcement wiring — `.github/workflows/doctor.yml` gates every push/PR to main on doctor's 7 checks (they were invocation-only before) + `/blueprint-triage` anonymize-by-default capture. Recent prior waves: 54 docs/ reorg into typed subdirs, 53 Mom Test ask-outcome discipline, 52 DoD verification ladder, 51 Mom Test validation bridge, 50 defrag + doc-currency gates, 49 team onboarding kit + `blueprint hive setup`. Full log in `WAVE-LOG.md`.

## In flight / next

- **Team adoption (the live driver):** The partner SA (T.) is adopting Blueprint + hive for a client commerce-platform build — the first real *team* engagement. Treat his needs as the priority signal for hive productization. The `blueprint hive setup --execute` path is operator-gated (real billable CF infra; needs the client repo) — do not run it autonomously.
- **Hive identity hardening — TRIGGER, not yet due:** the substrate authenticates with a shared bearer (spoofable attribution; see `docs/governance/hive-identity-gap.md`). For ≤3 trusted/co-located operators, option (a) trust + risk-register is the accepted call. **Harden to per-session JWT BEFORE a 2nd team or any external contributor joins** — that onboarding is the trigger, and the hardening must land before it.
- **Multi-operator chaos test:** the substrate is built but never run under contention. Owned by the first real parallel engagement (the partner SA (T.)).
- **Demand validation (open asks):** the A6 working-session ask to "R." (map his four-skill loop onto Blueprint primitives — whether he shows up IS the A6 test) and the P4 cold-open re-test with "D." after the front-door fix shipped. Both are operator sends; log outcomes in `docs/content/validation-script.md` (the Log's `Ask made → outcome` column is waiting).
- **Privacy/sanitization residuals (operator-only):** (1) file ONE GitHub Support request to purge unreachable objects from `nino-chavez/blueprint` — covers both 2026-06-10 history rewrites (PII + employer/initiative names); pre-rewrite commits stay fetchable by exact SHA until GitHub gc's (zero forks/watchers, low urgency). (2) Optional: `npm deprecate @nino-chavez-labs/blueprint-cli@0.1.0` — 0.2.0 (sanitized) is live as latest; 0.1.0's tarball still carries pre-sanitization names. (3) Decide the legacy `template/prototype/` shell's fate — it functionally depends on the platform design system (`@bigcommerce/big-design*` deps kept as the only employer-tech in the public repo); moving it private like the context packs is the consistent endpoint. (4) The live demo sites still run under initiative-named pages.dev subdomains (de-linked from the repo; renaming/retiring them happens in their own repos).
- **The false-green gap:** the *enforcement* half closed in wave 55 (`doctor` now gates CI on every push/PR to main). The *Stage-4* half remains deferred: Fact-Check does not gate on runtime/browser verification; `doctor` is honest about this boundary. Closing it is the next quality frontier.

## Standing constraints

- **Methodology freeze:** no `template/` edits land while an EXTERNAL consumer is mid-migration without an explicit operator waiver. The in-repo self-application (`methodology_version: self`) does not trip this. The consumer registry is `consumers.yml` (inspect with `blueprint fleet`); external initiatives at rest as of wave 55, with subs-initiative mid-flight on its own pinned methodology copy (not mid-migration).
- **Concurrent sessions use worktrees** (the `worktree-guard` hook enforces it; a solo session in main is never blocked).
- **ai-hive: integrate, not absorb.** Hold the line against SaaS-scope-creep — scope ceiling A (methodology-native: git-host + npm + local files, no hosted service).
- **`template/` is the clean substrate.** If you find yourself editing `template/` to make the self-application's portal build, that's the leak — fix it at the root (`apps/portal/`, `packages/`).
