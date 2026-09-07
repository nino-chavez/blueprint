# Changesets

Root CLI release notes belong in [CHANGELOG.md](../CHANGELOG.md#unreleased).
Do not add a changeset for `@nino-chavez-labs/blueprint-cli`.

## Root releases

For each change that affects consumers, add its intent and any migration steps
to the changelog's **Unreleased** section.

When a root package release is approved:

1. Choose the semver bump and record the release scope in `CHANGELOG.md`.
2. Update the root `package.json` version and matching root metadata in
   `package-lock.json`.
3. Merge through the normal review path. The [Release workflow](../.github/workflows/release.yml)
   runs core tests, stamped template checks, and doctor before calling
   [the root publisher](../bin/release-if-unpublished.mjs).

The publisher skips a version already on npm. A source-only amendment can
therefore merge without publishing a package.

## Legacy tooling

ADR-0007 originally selected Changesets. The workspace layout excludes the
publishable root CLI from Changesets' package discovery. A changeset naming
that package stops the workflow before publication.

`npm run changeset` and `npm run version` still invoke Changesets; they do not
version the root CLI. The existing root publisher and changelog remain the
release path. Replacing that tooling is a separate release-engineering decision.

## Deprecations

Record each `BP-DEPR-NNN` code and migration in the changelog. Deprecations
progress from documentation to warnings, then removal in a major release.
Under ADR-0005, removal waits for the next major release after the methodology
freeze ends.
