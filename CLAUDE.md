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
- Wave 6 (`0cc1f9b` → `b9ecc90`, 4 fixes) — amendments from blueprint-redesign consumer: repo-role declaration convention, `<title>` suffix dedupe, prose-doc audit for stale `rally-*` storage keys, manifest-driven `prep-deploy.sh` + ADR-0003
- Wave 7 (`4a4aa7e` → `1072308`, 4 fixes) — amendments from website-nc-v3 consumer (two failures, one root cause): ADR-0004 JTBD continuity + forge-pipeline provenance, `research-completeness-reviewer` JTBD-per-persona extension, new `prescription-jtbd-traceability-reviewer` (Stage 2→3), new `prototype-forge-provenance-reviewer` (Stage 3 completion)
- Wave 8 (`1c11968`) — amendment from blueprint-redesign consumer (dogfood-v1): design-discipline track added to METHODOLOGY.md — Stage 1 design-discovery sub-track (4 required brownfield artifacts + greenfield variant), Stage 2 design-system dictionary section (L0-L4 atomic-design), Stage 4 solo-initiative degrade-path. Three independent dogfoods (rally-hq, signal-dispatch blog, blueprint-redesign) converged on the L4-absent finding.
- Wave 9 (`ae8c574`) — amendment from blueprint-redesign consumer: multi-theme registry as canonical chrome. `shared.css` gains 4 `[data-theme]` blocks (slate default + coral + forest + minimal); `theme-switcher.js` promoted from initiative-side to canonical chrome; `stamp.mjs PATTERN_B_CHROME_FILES` extended. Operator reframe during dogfood: "implement all four as options to apply" turned L0 brand decisions from per-consumer pickup to methodology-owned registry.
- Wave 10 (`0a3b28a`) — reference artifacts from blueprint-redesign: 5 EXAMPLE/template files in `template/methodology/design/` (audit template + surface audit example + design system example + Stage 4 fact-check example) + `template/methodology/voice/` (voice rules example), plus 2 README files documenting consumer use.
- Wave 11 (`0af1a35`) — completes multi-theme integration: `blueprint.yml` schema gains `prototype.theme` field (slate | coral | forest | minimal | custom; default slate); `stamp.mjs` accepts `--theme` CLI flag + substitutes `<html lang="en">` → `<html lang="en" data-theme="{theme}">` so the default applies before JS loads.
- Wave 12 (`5990226`) — brand kit + wedge-page template fold from blueprint-redesign: `template/brand/blueprint-brand-kit.json` (forge-brand-compatible canonical kit for Blueprint-the-product), `template/portal/templates/wedge-page.html` (canonical L4 template for comparison-toggle archetypes), 2 README files.
- Wave 13 (`59ab781`) — wave-log entries for 8-12 + freeze-lift acknowledgment in this CLAUDE.md.
- Wave 14 (`9c91d36`) — amendment from rally-hq consumer (commit `1aa3c35` in apps/rally-hq, 3 amendments captured 2026-05-26): `--mode=audit-chrome` read-only diff command + `--portal-dir` CLI flag + `blueprint.yml prototype.portal_dir` schema field + `restamp-chrome` overwrite gate (refuses to run on diverged chrome without `--accept-overwrite=`). Closes RH §1 gaps 1+2 (silent-destruction risk against 4 brownfield consumers). Validated against rally-hq's portal; gate correctly refused destructive restamp.
- Wave 15 (`b7b3495`) — extends wave 14 with git-history per-file classification: each diverged chrome file labeled LAG (matches an older canonical commit @ SHA + date) or CUSTOMIZATION-OR-ROT (no canonical match in last 30 commits). Audit output produces actionable restamp command for LAG files + manual-review list for CUSTOMIZATION-OR-ROT files. Closes RH §1 gap 3. Validated against rally-hq: 5 LAG / 2 CUSTOMIZATION-OR-ROT correctly identified.
- Wave 16 — `prototype.brand_axes` schema in `blueprint.yml` for multi-tenant / multi-axis brand models (closes RH §3 — wave 9-11 multi-theme registry assumed single-axis consumers but rally-hq has chrome × per-tournament-accent). Documentation-only this wave; future waves wire CLI flags + chrome-canonical-reviewer to interpret the axis declarations.
- Wave 17 (`74fa02f`) — four bc-promo-rules amendments promoted as a single bundled wave. **Commit message labels itself "wave 14" — that label is a numbering bug; wave 14 was already taken by `9c91d36` (audit-chrome). The commit belongs at wave 17 in the wave log.** Amendments: (1) scaffold contamination fixes — `stamp.mjs` blanks the bc-subs archaeology `WORKER_URL` at stamp time + upgrades `BANNER_FILES` text from warning → block; `ArchaeologyChat.tsx` renders a disabled "substrate not configured" button when `WORKER_URL === ''`; `strategy/delivery-fork.astro` + `strategy/index.astro` replaced with project-neutral skeletons. (2) `template/docs/methodology/current-state-research-prompt.md` — "what needs to be true" research frame. (3) `template/docs/methodology/architect-challenge-pattern.md` — expression-surface comparison pattern. (4) `template/docs/methodology/reference-sessions.md` — bc-promo-rules dogfood session as canonical first-run reference entry. Authored on a parallel session/machine in May 2026 (commit `74fa02f`, dated 2026-05-26 23:05); pushed to origin before the 2026-05-27 session could promote the same amendments. Waves 18-22 below extend wave 17 with the gates / reviewer enforcement / schema fields / methodology-stage placement that wave 17 stopped short of.
- Wave 18 — Runtime `ARCHAEOLOGY_READY` gate added to `template/apps/portal/src/layouts/Layout.astro`. Defense-in-depth above wave 17's stamp-time `WORKER_URL` blanking + wave 17's component-side empty-URL guard. Reason a third layer is needed: wave 17 ensures the widget is safe when present and when `WORKER_URL` is empty, but does not give the operator a single-flip gate to control whether the widget mounts at all (e.g., during a phase where the substrate is deployed but the operator does not yet want the widget visible to stakeholders). The flag pattern + conditional dynamic import keeps the bundle clean when disabled. Documented preconditions to flip the flag are inline in the file. Authored in the same multi-session collision as wave 17.

The blueprint-redesign consumer initiative is at rest as of `dogfood-v1` (commit `cc4f62f` on `dogfood/self-redesign`). Rally-hq consumer at rest as of `1aa3c35` (amendments file post peer-review revises). Methodology freeze lifted; methodology can now advance in parallel with future consumer initiatives. Consumer-sync command for existing Pattern B portals to pull waves 8-16: first run `--mode=audit-chrome --pattern=B --target=<portal-root>` to classify divergences, then `--mode=restamp-chrome --pattern=B --target=<portal-root> --accept-overwrite=<LAG-files-from-audit>` to pull forward safely.

Each wave includes a freeze-rule acknowledgment in the commit message and a recommended consumer-sync command.

## Methodology canonical docs

- `METHODOLOGY.md` — first-principles, agent-struggle-is-missing-capability
- `docs/variant-selection.md` — greenfield / midstream / brownfield decision tree
- `docs/portal-and-tier-ladder.md` — Pattern A / B portal + tier 0/1/2 ladder
- `docs/methodology/methodology-amendments-convention.md` — how consumers record candidate-for-promotion gaps

## See also

- `template/CLAUDE.md` — the CLAUDE.md shipped to consumers (the inverse of this file)
