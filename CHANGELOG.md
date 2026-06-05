# @nino-chavez-labs/blueprint-cli

The Blueprint methodology distribution. Versions follow [semver](https://semver.org).

Entries are authored via [Changesets](https://github.com/changesets/changesets): every consumer-affecting change adds a `.changeset/*.md` describing intent, and breaking changes carry a hand-written migration note (per ADR-0007 — the changelog is a stakeholder-facing migration guide, not a commit dump).

Methodology evolution prior to this baseline is recorded as 29 waves in [WAVE-LOG.md](./WAVE-LOG.md).

## 0.1.0

First semver-tagged release of the Blueprint distribution — establishes the version primitive that the bidirectional update channel (ADR-0005) and consumer pinning depend on.

### Added

- **Version primitive.** `package.json` is the single source of truth for the methodology version (no separate `VERSION` file — single source, no drift, per the centralization rule). Changesets manages bumps + this changelog; `.github/workflows/release.yml` publishes on merge to `main` (dormant until `NPM_TOKEN` is set).
- **Portable `BLUEPRINT_HOME` resolution.** The SessionStart hook resolves the methodology source via `$BLUEPRINT_HOME` → `blueprint.yml` `methodology_home:` → local canonical path (`~/Workspace/dev/tools/blueprint`) → npm-installed `@nino-chavez-labs/blueprint-cli`; a candidate counts only if it contains `METHODOLOGY.md`. Removes the single hardcoded `~/Workspace/dev/wip/blueprint` default. A team member who `npm install`s the CLI resolves with zero config.
- **Stale-path leaks removed.** `stamp.mjs` no longer writes `~/Workspace/dev/wip/blueprint` doc paths into every stamped consumer's `blueprint.yml`; `frontmatter-lint` stale `big-blueprint` reference corrected.
- **Methodology-version banner.** The SessionStart hook surfaces the methodology's current version and the initiative's pinned `methodology_version`, flagging drift and pointing to `blueprint upgrade`.
