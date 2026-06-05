# Authoring an org reviewer

A department extends Blueprint by writing its own executable reviewers — **without
forking** the methodology (ADR-0006). This is the difference between a methodology
and a platform.

## The interface IS the SDK

There is no SDK to learn. A reviewer is an `.mjs` file with a default export
matching ADR-0002's `review()` contract:

```js
// .blueprint/reviewers/acme-naming-reviewer.mjs
export default async function review({ targetDir, blueprintYml, methodologyHome }) {
  const findings = [];
  // ... inspect targetDir; push { severity, location, message, remediation, reference } ...
  const status = findings.some((f) => f.severity === 'BLOCK')
    ? 'BLOCKED'
    : findings.some((f) => f.severity === 'WARN') ? 'WARN' : 'PASS';
  return { status, findings, metadata: { reviewer: 'acme-naming-reviewer', targetSummary: '...' } };
}
```

`blueprint review acme-naming-reviewer --target=<dir>` runs it; exit 1 on
`BLOCKED`. `blueprint review --list` shows it alongside the canonical set. The
validator checks the shape at load time (default export is a function taking the
context arg) — it does NOT invoke your reviewer to validate (no surprise side
effects).

## Two ways to distribute (convention, not central registration)

1. **In-repo** — drop the file in `.blueprint/reviewers/*.mjs` in the consumer.
   Discovered automatically. Files prefixed `_` are skipped (scratch/examples).
2. **npm package** — publish a package whose `package.json` declares
   `keywords: ["blueprint-reviewer"]` and ships `reviewers/*.mjs` (`files:
   ["reviewers/"]`, a `peerDependency` on `@nino-chavez-labs/blueprint-cli` to pin the
   contract version). Installing it makes its reviewers discoverable.

There is no central registration array to edit — that recreates the merge-conflict
choke point a platform exists to remove. Discovery is by convention; binding is
explicit (each reviewer declares its own gate).

## The rules that keep auto-discovery safe

- **Canonical runs first, and wins its name.** Canonical reviewers (the
  methodology's own) take precedence. An org reviewer that reuses a canonical
  **name** is a *shadow*: it is recorded, WARNed, and **not run** — the canonical
  one runs instead. An org reviewer may **tighten** policy via its OWN
  (differently-named) gate; it may never *relax* a canonical gate by replacing it.
- **Local overrides npm.** When an in-repo `.blueprint/reviewers/x.mjs` and an
  installed package both define `x`, the in-repo one wins (and the package one is
  flagged shadowed). Discovery is automatic; the override is visible.
- **Precedence is `canonical > org-local > org-npm`.** `blueprint review --list`
  prints the active set grouped by source plus the shadowed entries, so the
  binding is auditable.

## Trust model (v1)

Org `.mjs` reviewers run with **full Node privileges** — the v1 trust model is
"you trust whoever you `npm install` / commit to `.blueprint/reviewers/`." There
is no sandbox (WASM sandboxing was rejected for v1). Do not install reviewer
packages you don't trust; cross-department/third-party distribution should wait
for npm provenance + signing (an ADR-0007 supply-chain follow-up). For a single
team authoring its own reviewers, this is the same trust boundary as any other
dev dependency.
