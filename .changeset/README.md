# Changesets

This directory powers versioning + the changelog for the Blueprint methodology distribution. See the [Changesets docs](https://github.com/changesets/changesets) for the full workflow.

## The Blueprint discipline (ADR-0007)

Every change that affects consumers adds a changeset:

```bash
npm run changeset
```

Pick the bump (patch / minor / major) and **write the consumer-facing intent** in the generated markdown. For a **breaking** change (major), the changeset body IS the migration guide — name what breaks and the exact migration step. This is why Blueprint uses Changesets over commit-parsing tools: the changelog is a stakeholder artifact, not a commit dump.

- `npm run version` folds pending changesets into `CHANGELOG.md` + bumps `package.json`.
- `npm run release` publishes (CI, on merge to `main`, via `.github/workflows/release.yml`).

Deprecations follow the staged Node model (doc-only → warn → removed-on-MAJOR) with a `BP-DEPR-NNN` code named in the changeset (ADR-0007). Removal of a deprecated primitive yields to the methodology-freeze cadence (ADR-0005): EOL slips to the next post-freeze MAJOR, never forcing a waiver mid-migration.
