---
canonical: true
---

# ADR-0002 — Storage-key prefix cleanup (`bcs-audience` → `blueprint-audience`)

**Date**: 2026-05-25
**Status**: Accepted
**Follows**: [ADR-0001](0001-audience-pill-naming.md) (deferred this scope)

## Context

When `template/apps/portal/` and `template/packages/ui/` were extracted from `subs-initiative` on 2026-05-25, the `useAudiencePreference` hook brought its localStorage key and CustomEvent name with it:

- `STORAGE_KEY = 'bcs-audience'`
- `CHANGE_EVENT = 'bcs-audience-change'`

The `bcs-` prefix is a subs-initiative-era artifact ("the commerce platform Subscriptions"). The methodology was renamed the original employer-prefixed name → Blueprint in commit `55d6080` on the same day. ADR-0001 renamed the pill values but explicitly deferred this cleanup to its own ADR to keep blast radius separate.

## Decision

Rename the audience-switcher persistence identifiers to the Blueprint namespace:

| Identifier | Before | After |
|---|---|---|
| localStorage key | `bcs-audience` | `blueprint-audience` |
| CustomEvent name | `bcs-audience-change` | `blueprint-audience-change` |

**Out of scope**: the `--bcs-*` CSS-variable prefix in `template/packages/design-tokens/` is **not** renamed here. That prefix has documented collision-avoidance rationale (`template/packages/design-tokens/README.md` § "All variables are prefixed `--bcs-*` so they never collide with merchant-supplied tokens on the storefront, the platform design system tokens in the admin marketplace shell, or BC platform tokens elsewhere"). Renaming it requires a separate decision weighing the BC-collision-avoidance against project-agnostic consistency. Tracked as ADR-0003 if picked up.

## Rationale

1. **Consistency with the methodology name.** The hook is canonical Blueprint methodology code; its persistence identifiers should match.
2. **No migration cost in the methodology repo.** No consumers depend on the existing `bcs-audience` key — the audience-switcher pattern is new (lifted 2026-05-25, no production storage exists yet from this template).
3. **Narrower than the CSS-variable rename.** The hook owns these identifiers privately; one file holds the constants. The CSS-variable prefix has a 30+ file blast radius and intentional design reasoning, so it stays out of this ADR.

## Consequences

### Breaking

- Any consumer initiative that hand-coded the literal `'bcs-audience'` (instead of using the exported hook) will need to update. Audit before merging consumer migrations.
- localStorage entries at `bcs-audience` are not migrated. The `isAudience` guard treats absent values as invalid and falls through to the `'evaluator'` default. Acceptable cost — no real users on the new methodology template yet.

### Non-breaking

- Hook signature (`useAudiencePreference`), exported constants (`AUDIENCES`), and types are unchanged.
- The `--bcs-*` CSS-variable namespace is unchanged.

### Migration for consumers

```diff
- window.localStorage.getItem('bcs-audience')
+ window.localStorage.getItem('blueprint-audience')

- window.dispatchEvent(new CustomEvent('bcs-audience-change', { detail }))
+ window.dispatchEvent(new CustomEvent('blueprint-audience-change', { detail }))
```

Per the [methodology freeze rule](../../template/CLAUDE.md), this lands in the methodology repo first; consumer initiatives migrate sequentially.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Rename `--bcs-*` CSS variables in the same ADR | Different blast radius, different rationale (the prefix exists for BC token collision-avoidance). Bundling them would conflate two separate decisions. |
| Add a migration shim that reads from both old + new keys for one release | Premature complexity. No production data exists yet at the old key in the methodology template. Default-reset behavior is acceptable. |
| Keep `bcs-` for hook identifiers, only rename pill values (ADR-0001 only) | Status quo bias in a heritage namespace. The pill-naming cleanup is incoherent without addressing the matching persistence-identifier drift. |

## Follow-ups

- **ADR-0003 (open)**: should `--bcs-*` CSS variables in `template/packages/design-tokens/` rename to `--blueprint-*`? Decision pivots on whether the BC-collision-avoidance rationale still applies in the project-agnostic methodology context. Defer until a non-BC consumer initiative actually adopts the design-tokens package and surfaces collision data.
