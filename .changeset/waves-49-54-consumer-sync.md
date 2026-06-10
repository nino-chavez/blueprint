---
"@nino-chavez-labs/blueprint-cli": minor
---

Waves 49–54 rollup (the changeset discipline lapsed after 0.1.0; this restores it).

**Added**

- `blueprint hive setup` — one-command Hive provisioning (CF D1 + Worker + Pages) from a vendored ai-hive kit; dry-run PLAN by default, `--execute` applies (wave 49). Team onboarding docs: `docs/governance/team-roles-and-conventions.md`, `docs/governance/hive-identity-gap.md`, `template/tools/hive/ONBOARDING.md`.
- Two fleet reviewers: `defrag-reviewer` (fragmentation census, never blocks) and `doc-currency-reviewer` (broken internal links BLOCK; wired into `doctor` as check 7) (wave 50).
- Mom Test validation bridge: `/blueprint-docs` emits a `validation-script.md` companion; `/blueprint-triage` weighs feedback by commitment given; ask outcomes (taken / not taken / no-ask-made) are first-class log data. Canonical: `template/docs/methodology/mom-test-validation-pattern.md` (waves 51 + 53).
- DoD verification ladder: five gates per AC; `state-derive` honestly relabeled as a presence oracle (`COMPLIANT` ≠ works). Canonical: `template/docs/methodology/dod-verification-ladder-pattern.md` (wave 52).

**Changed — migration note (wave 54, path-only)**

`$BLUEPRINT_HOME/docs/` was reorganized into typed subdirs: pattern docs → `docs/patterns/`, platform/voice context → `docs/context/`, case studies + audits → `docs/case-studies/`, team/identity docs → `docs/governance/`, dated artifacts → `docs/_archive/`. Only `variant-selection.md`, `portal-and-tier-ladder.md`, and `README.md` remain at `docs/` top level. **Stamped consumers**: your local CLAUDE.md cites the old paths — re-stamp or re-paste `docs/prompts/pick-up-blueprint-updates.md` to refresh the reference table. Content is unchanged.
