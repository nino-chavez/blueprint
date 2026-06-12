---
canonical: true
---

# Decision 03 — Portal Type naming (Initiative Portal / Review Portal)

**Date**: 2026-06-12
**Status**: Accepted
**Wave**: 72

## Context

Blueprint's two portal shapes have been identified as "Pattern A" and "Pattern B" since their extraction and canonization in the 2026-05-25 reconciliation wave. The labels were functional for internal tooling but opaque to any reader who hasn't read `docs/portal-and-tier-ladder.md` first:

- "Pattern A" names a catalog position, not the shape's purpose or audience.
- "Pattern B" provides no signal about what the portal does.

The DX/CX failure: a new consumer choosing between portal options faces "Pattern A" vs "Pattern B" — two labels that require lookup before they carry meaning. The purpose of each pattern is already clear from its description; the label should carry that purpose.

Additionally, the `blueprint.yml` field `portal_pattern` stored the values `A` and `B` as single letters — equally opaque in serialized form.

## Decision

Rename across all live methodology surfaces (Wave 72):

| Before | After |
|---|---|
| Pattern A (platform-portal) | **Initiative Portal** |
| Pattern B (redesign-review-portal) | **Review Portal** |
| `portal_pattern: A` | `portal_type: initiative` |
| `portal_pattern: B` | `portal_type: review` |
| `portal_pattern: bespoke` | `portal_type: bespoke` |
| `--pattern=A` CLI flag | `--portal-type=initiative` |
| `portal-pattern-a-conformance-reviewer` | `portal-initiative-conformance-reviewer` |
| `portal-pattern-b-conformance-reviewer` | `portal-review-conformance-reviewer` |

## Rationale

1. **Self-describing labels.** "Initiative Portal" reads as "the portal for a product initiative" — which is exactly what it is (a multi-audience platform front-door). "Review Portal" reads as "the portal for a review surface" — which is exactly what it is (a brownfield audit/redesign review shell). No lookup required.

2. **`portal_type` is more semantic than `portal_pattern`.** "Type" names what kind of thing the portal is. "Pattern" names a catalog position. The field stores a type selection, not a pattern reference.

3. **Consistent with `initiative_type` (wave 20).** The existing `initiative_type: consumer-app | platform-feature` field uses the `_type` naming convention for classification fields. `portal_type` follows the same convention.

4. **Greenfield/Brownfield not reused as values.** Those values are already used by `variant:` (the pipeline shape field). Using them for `portal_type` would conflate two orthogonal axes.

## Backward compatibility

The CLI stamper (`stamp.mjs`) and the doctor (`doctor.mjs`) provide a thin deprecation shim:

- **`stamp.mjs`**: accepts `--portal-type=initiative|review|bespoke` as primary; accepts `--pattern=A|B` as deprecated alias with a console warning. Writes `portal_type:` in generated `blueprint.yml` files.
- **`doctor.mjs`**: reads `portal_type:` first; falls back to `portal_pattern:` with a `warn` finding and migration instruction. Maps legacy `A` → `initiative`, `B` → `review` internally.

Consumer migrations happen sequentially per the methodology freeze rule. Each consumer running `blueprint doctor` will see a warn finding and a one-line migration command.

## History NOT modified

Wave-log entries 1–71, existing `decisions/*.md`, CHANGELOG.md, and `docs/_archive/` retain "Pattern A/B" as they were true at the time of writing. This ADR explains the renaming; it does not rewrite prior history.

## Consequences

### Breaking

- `portal_pattern:` field in consumer `blueprint.yml` files produces a deprecation warn in `blueprint doctor` until migrated.
- Consumer code or scripts that reference the old reviewer filenames (`portal-pattern-a-conformance-reviewer.mjs`) need path updates.

### Non-breaking

- The portal shapes, IA contracts, shell implementations, and deployment patterns are unchanged — only the labels changed.
- `bespoke` value is unchanged.
- `blueprint doctor` degrades gracefully on old `portal_pattern:` field values (warn, not fail).

### Migration for consumers

```diff
- portal_pattern: A
+ portal_type: initiative
```

```diff
- portal_pattern: B
+ portal_type: review
```

```diff
- portal_pattern: bespoke
+ portal_type: bespoke
```

CLI flag migration:

```diff
- node stamp.mjs --name=my-initiative --pattern=A
+ node stamp.mjs --name=my-initiative --portal-type=initiative
```

Reviewer references:

```diff
- portal-pattern-a-conformance-reviewer
+ portal-initiative-conformance-reviewer

- portal-pattern-b-conformance-reviewer
+ portal-review-conformance-reviewer
```

Per the [methodology freeze rule](../template/CLAUDE.md), this template change lands first; consumer initiatives migrate sequentially.
