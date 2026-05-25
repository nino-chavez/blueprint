---
canonical: true
---

# frontmatter-lint

Enforces the `canonical: true | false` frontmatter convention on every `*.md` file under `docs/` (excluding `docs/rag/` and `docs/archive/`).

## Why

See `~/Workspace/dev/tools/blueprint/docs/doc-surface-discipline-pattern.md` for the convention's rationale. Short version: every doc declares its class (canonical-present vs anything else) so readers — human and agent — know at a glance whether to trust it as current.

## Usage

```bash
node tools/frontmatter-lint/index.mjs              # lint ./docs
node tools/frontmatter-lint/index.mjs path/to/dir  # lint a specific dir
```

Exits 0 if every file passes; exits 1 on any violation. Each violation prints as `<path>: <reason>`.

## What it checks

For every `*.md` file under the target directory (excluding `rag/`, `archive/`, `node_modules/`, `.git/`, and any dotfile dirs):

1. File starts with a `---\n` frontmatter block (and the block is properly closed with `\n---\n`)
2. Frontmatter contains a `canonical` key
3. The `canonical` value is exactly `true` or `false` (string-equality; no truthy-coercion)

Any other key in the frontmatter is fine — the lint only enforces the one convention.

## CI integration

Add to `.github/workflows/lint-docs.yml`:

```yaml
name: lint-docs
on:
  pull_request:
    paths:
      - 'docs/**/*.md'
      - 'tools/frontmatter-lint/**'
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node tools/frontmatter-lint/index.mjs docs
```

## What it does NOT check

- Frontmatter validity beyond the `canonical` key (other YAML in the block is not parsed strictly)
- Whether the file's *content* matches its declared class (a file marked `canonical: true` that contains dated hedges is the author's problem, not the lint's)
- Files outside `docs/` (root canonical files like PRD.md, ARCHITECTURE.md are NOT linted by default — extend the dir arg if desired)

## Activation threshold

Apply this lint when the project has >20 markdown docs. Below that, hand-discipline is cheaper than scaffold maintenance. See `doc-surface-discipline-pattern.md` § Activation thresholds.

## Source

`~/Workspace/dev/tools/blueprint/template/tools/frontmatter-lint/`. Distilled from `subs-initiative` doc-reorg work (Hive #929, May 2026).
