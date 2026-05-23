---
tool: frontmatter-lint
last_attested: 2026-05-23
max_unattested_days: 90
couples_with:
  - docs/
  - .frontmatter-lint-allowlist
  - .github/workflows/frontmatter-lint.yml
convention_version: 1
---

# Owner-spec: frontmatter-lint (template)

> **Template OWNER-SPEC.** When a project enables doc-surface discipline, this OWNER-SPEC starts as the baseline. Bump `last_attested:` to scaffold-date; customize the allowlist and any project-specific schema extensions.

## Purpose

Validates that every `*.md` under `docs/` (excluding `docs/rag/` and `docs/archive/`) carries a `canonical:` frontmatter key with boolean value. Surface-level discipline that makes the doc corpus machine-queryable.

## Inputs / outputs

### Inputs
- `docs/**/*.md` (with conventional exclusions)
- `.frontmatter-lint-allowlist` (one path per line; exempt files)

### Outputs
- Console findings (missing/invalid frontmatter)
- Exit 0 (clean) / 1 (findings)

## Failure modes seen

(Populate on first incident. Common shape: someone ships a new `docs/<category>/` corpus without frontmatter; lint blocks every subsequent PR until the new files get frontmatter or the allowlist is updated.)

## Coupling

- `docs/` corpus — every doc file
- `.frontmatter-lint-allowlist` — allowlist for wave-2 retrofit
- `.github/workflows/frontmatter-lint.yml` — production runner

## Maintainer playbook

### Add an allowlist exemption

Append to `.frontmatter-lint-allowlist`. Document in PR description WHY the exemption.

### Tighten the schema (e.g., add `last_updated:` as required)

1. Update validator logic
2. Provide migration guidance for existing docs
3. Roll out as a wave (not all PRs at once)
4. Bump `last_attested:`

## Danger zones

- **Allowlist accumulates retrofit debt** — periodically sweep to graduate items off
- **Schema changes break every doc lacking the new field** — schedule as wave migrations

## Known limits

- Only validates `canonical:` key presence + type
- Doesn't enforce other useful frontmatter (title, last_updated, type)
- Won't detect malformed YAML — only checks for the canonical key
