# @nino-chavez-labs/blueprint-cli

The Blueprint methodology distribution. Versions follow [semver](https://semver.org).

Entries are authored via [Changesets](https://github.com/changesets/changesets): every consumer-affecting change adds a `.changeset/*.md` describing intent, and breaking changes carry a hand-written migration note (per ADR-0007 — the changelog is a stakeholder-facing migration guide, not a commit dump).

Methodology evolution prior to this baseline is recorded as 29 waves in [WAVE-LOG.md](./WAVE-LOG.md).

## Unreleased

## 0.4.1

Patch — fixes a defect in the wave-74 `portal-chrome-canonical-reviewer` two-profile change.

### Fixed

- `loadChromeManifests` computed the manifest `source` label *after* assigning the hard-coded fallbacks, so the post-assignment arrays were always non-empty and `source` could never read `fallback` — a hard-coded (stale/broken `stamp.mjs`) manifest mislabeled as `live`, masking the condition. Now determined from whether the parse actually succeeded.
- The reviewer's self-test fixture still wrote the pre-wave-74 `PATTERN_B_CHROME_FILES` constant; updated to the two-profile `PATTERN_B_CHROME_FILES_PROFILE_A/B` names so the self-test exercises the live-parse path. All 15 reviewer self-tests pass.

## 0.4.0

Waves 62–74 rollup. Wave-level detail in [WAVE-LOG.md](./WAVE-LOG.md). **All changes are backward-compatible** — every new schema field is optional and defaults to prior behavior; the two structural items ship opt-in and default off.

### Added

- **Agent output discipline** (wave 73): research/dispatch agents return the synthesized conclusion + citations, never the corpus they read.
- **Research-discipline patterns** (wave 74): three-pass research (architectural-principles re-test), peer-vs-modifier test, back-door-native anti-pattern — wired as `design-principles-reviewer` Stage 2→3 gates.
- **Citation correctness**: `cited-url-lint` substrate tool + `citation-correctness-pattern.md` + anti-circular-audit guard in the fact-check loop.
- **New reviewers**: `research-sibling-scanner` (Stage-1 sibling-project scan), `roadmap-registry-sync` (+ `doctor` check + `stateful_pairs` schema field), `foundation-stage` (proposed).
- **Stamper**: Review Portal initial stamp (`--pattern=B`), scoped `--accept-overwrite` restamp (overwrite accepted, skip un-accepted diverged), chrome-profile-aware manifest selection.
- **Shared initiative-root resolution** for all reviewers + the SessionStart hook (walk up for `blueprint.yml`; subdir layouts now work).
- **Global methodology rules** distribution (`docs/methodology/global-rules/`) + install snippet + non-fatal hook verification.
- Portal chrome ergonomics, DoD-ladder hardening, test discipline, and the Initiative/Review Portal rename (waves 62–72) — see WAVE-LOG.

### Proposed (opt-in, default off)

- **Foundation: Design System + IA** capability stage (`foundation.enabled`).
- **Portal-chrome two-profile model** (`prototype.chrome_profile: methodology-themed | consumer-themed`) for brand-owning consumers.

### Migration

None required. New fields are optional with backward-compatible defaults; proposed items are off unless explicitly enabled.

## 0.3.0

Waves 57–61 rollup.

### Added

- **`blueprint init` scaffolds with defaults** (wave 61): `--name` is the only required flag — display-name (title-cased slug), tagline, repo-url placeholder, `--variant=greenfield --tier=1 --pattern=A`, and `--target=./<name>` (created when missing) all derive; every applied default is echoed on a `defaulted:` line. Explicit flags override everything; existing full-flag scripts are unaffected.
- `terminology-linter` scan-set extension (wave 60): `.md` pages join the scan set via a Markdown text extractor; root README scanned; operator-doc basenames exempt; universally-understood dev acronyms allow-listed.
- `stateful-claim-lint-reviewer` (wave 59) — lints hardcoded counts/versions/"latest" claims in living docs against their sources of truth (WAVE-LOG, consumers.yml, the reviewer registry, doctor.mjs, package.json); wired as `doctor` check 8. Checks skip gracefully in consumer repos that lack the sources.
- `market-signal` triage category + `logged` state in `/blueprint-triage`; assumption-archetype checklist in the Mom Test pattern doc (wave 57).
- README § "Evaluating Blueprint for your team?" replaces `START-HERE.md` (wave 58); reader-path manifest gains set-level review questions (deletion test, claim ownership).

## 0.2.0

Waves 49–56 rollup. Authored by hand: the changeset→root-package linkage broke silently at the wave-45 fold (the root became a workspace monorepo root, which `@changesets/cli` excludes from its package set), so the two pending changesets crashed the release workflow — folded here instead, and the breakage is filed as an amendment.

### Added

- `blueprint hive setup` — one-command Hive provisioning (CF D1 + Worker + Pages) from a vendored ai-hive kit; dry-run PLAN by default, `--execute` applies (wave 49). Team onboarding docs: `docs/governance/team-roles-and-conventions.md`, `docs/governance/hive-identity-gap.md`, `template/tools/hive/ONBOARDING.md`.
- Two fleet reviewers: `defrag-reviewer` (fragmentation census, never blocks) and `doc-currency-reviewer` (broken internal links BLOCK; wired into `doctor` as check 7) (wave 50).
- Mom Test validation bridge: `/blueprint-docs` emits a `validation-script.md` companion; `/blueprint-triage` weighs feedback by commitment given; ask outcomes (taken / not taken / no-ask-made) are first-class log data (waves 51 + 53). Canonical: `template/docs/methodology/mom-test-validation-pattern.md`.
- DoD verification ladder: five gates per AC; `state-derive` honestly relabeled as a presence oracle (wave 52). Canonical: `template/docs/methodology/dod-verification-ladder-pattern.md`.
- CI enforcement: `.github/workflows/doctor.yml` gates every push/PR on doctor's 7 checks; `/blueprint-triage` captures anonymize-by-default (wave 55).

### Changed — migration notes

- **docs/ reorganized into typed subdirs** (wave 54): only `variant-selection.md`, `portal-and-tier-ladder.md`, `README.md` remain at `docs/` top level; patterns → `docs/patterns/`, case studies → `docs/case-studies/`, team/identity → `docs/governance/`, dated artifacts → `docs/_archive/`. Stamped consumers: re-paste `docs/prompts/pick-up-blueprint-updates.md` to refresh your CLAUDE.md reference table.
- **Template source identity is now neutral** (wave 56): the stampable substrate's reference strings are `blueprint-example` / `Blueprint Example` / `@blueprint-example/` / `--bpx-` / `An example product initiative`; `stamp.mjs`'s substitution table and mechanical check key on these. Consumers stamped before this version: `restamp-chrome` no longer rewrites the OLD source strings — re-stamp, or run one manual find/replace.
- **Platform context packs unbundled** (wave 56): the B2B edition / buyer-portal / marketplace context docs are supplied privately per engagement; the `b2b_edition.enabled` flag and `docs/context/voice-b2b-addendum.md` remain.
- **Tool rename**: the content-generation companion is **Forge Signal** (the `signal_forge:` blueprint.yml key reflects the prior name and is kept for compatibility).
- **Registry**: `consumers.yml` carries neutral slugs for de-named consumers; operator-local identities live in gitignored `consumers.local.yml`.
- Repositioning: README/METHODOLOGY describe the full loop (research → BRD/PRD docs → prototype → fact-check → build handoff).

## 0.1.0

First semver-tagged release of the Blueprint distribution — establishes the version primitive that the bidirectional update channel (ADR-0005) and consumer pinning depend on.

### Added

- **Version primitive.** `package.json` is the single source of truth for the methodology version (no separate `VERSION` file — single source, no drift, per the centralization rule). Changesets manages bumps + this changelog; `.github/workflows/release.yml` publishes on merge to `main` (dormant until `NPM_TOKEN` is set).
- **Portable `BLUEPRINT_HOME` resolution.** The SessionStart hook resolves the methodology source via `$BLUEPRINT_HOME` → `blueprint.yml` `methodology_home:` → local canonical path (`~/Workspace/dev/tools/blueprint`) → npm-installed `@nino-chavez-labs/blueprint-cli`; a candidate counts only if it contains `METHODOLOGY.md`. Removes the single hardcoded `~/Workspace/dev/wip/blueprint` default. A team member who `npm install`s the CLI resolves with zero config.
- **Stale-path leaks removed.** `stamp.mjs` no longer writes `~/Workspace/dev/wip/blueprint` doc paths into every stamped consumer's `blueprint.yml`; `frontmatter-lint` stale `big-blueprint` reference corrected.
- **Methodology-version banner.** The SessionStart hook surfaces the methodology's current version and the initiative's pinned `methodology_version`, flagging drift and pointing to `blueprint upgrade`.
