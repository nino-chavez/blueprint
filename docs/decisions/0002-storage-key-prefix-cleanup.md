---
canonical: true
---

# ADR-0002 — Storage-key prefix cleanup (`bcs-audience` → `blueprint-audience`)

**Date**: 2026-05-25
**Status**: Accepted
**Follows**: [ADR-0001](0001-audience-pill-naming.md) (deferred this scope)

## Context

When `template/apps/portal/` and `template/packages/ui/` were extracted from `bc-subscriptions` on 2026-05-25, the `useAudiencePreference` hook brought its localStorage key and CustomEvent name with it:

- `STORAGE_KEY = 'bcs-audience'`
- `CHANGE_EVENT = 'bcs-audience-change'`

The `bcs-` prefix is a bc-subscriptions-era artifact ("BigCommerce Subscriptions"). The methodology was renamed BigBlueprint → Blueprint in commit `55d6080` on the same day. ADR-0001 renamed the pill values but explicitly deferred this cleanup to its own ADR to keep blast radius separate.

## Decision

Rename the audience-switcher persistence identifiers to the Blueprint namespace:

| Identifier | Before | After |
|---|---|---|
| localStorage key | `bcs-audience` | `blueprint-audience` |
| CustomEvent name | `bcs-audience-change` | `blueprint-audience-change` |

**Out of scope**: the `--bcs-*` CSS-variable prefix in `template/packages/design-tokens/` is **not** renamed here. That prefix has documented collision-avoidance rationale (`template/packages/design-tokens/README.md` § "All variables are prefixed `--bcs-*` so they never collide with merchant-supplied tokens on the storefront, BigDesign tokens in the admin marketplace shell, or BC platform tokens elsewhere"). Renaming it requires a separate decision weighing the BC-collision-avoidance against project-agnostic consistency. Tracked as ADR-0003 if picked up.

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

## Addendum — 2026-05-25 evening: Pattern B parallel rename

The ADR above was scoped to Pattern A (`template/apps/portal/` + `template/packages/ui/audience-switcher`). Audit of `template/portal/` (Pattern B) on the same day surfaced an analogous storage-key leak class — Pattern B chrome carried Rally-HQ-prefixed identifiers from its extraction:

| File | Before | After |
|---|---|---|
| `template/portal/index.html` | `'rally-bp-audience'` | `'blueprint-audience'` |
| `template/portal/proto-nav.js` | `'rally-hq-blueprint-chrome-preview'` | `'blueprint-chrome-preview'` |
| `template/portal/proto-annotate.js` | `'rally-anno-enabled'` | `'blueprint-anno-enabled'` |
| `template/portal/proto-annotate.js` | `'rally-anno-notes-v1'` | `'blueprint-anno-notes-v1'` |
| `template/portal/proto-annotate.js` | `window.rallyAnno` | `window.blueprintAnno` |

Same convention (`blueprint-` prefix), same rationale (consistency with the methodology name; canonical chrome must ship with zero project-specific identifiers). Treated as application of this ADR's convention, not a new decision — no separate ADR.

**Reused storage key (`blueprint-audience`) across patterns**: Pattern A and Pattern B both use `blueprint-audience` as the localStorage key for audience selection. The valid VALUES differ — Pattern A: `executive / evaluator / engineering`; Pattern B: `reviewer / engineer / operator`. A user who has both pattern-A and pattern-B portals in the same browser will see Pattern B's `isAudience` guard reject Pattern A's stored value and default to `reviewer`. Acceptable cost — same default-reset behavior this ADR already established. Pill-naming unification across patterns is a separate decision (not in scope here).

Additional non-storage Rally HQ leaks excised in the same audit (not ADR-worthy, just cleanup):

- `template/portal/index.html` footer line + GitHub link were hardcoded Rally HQ content; now manifest-driven via new `footer: { line, repo_url }` block in `_meta/index.json`
- `template/portal/proto-annotate.js` header comment said "Rally HQ Blueprint — Annotation overlay"; now "Blueprint — Annotation overlay (canonical chrome)"
- `template/portal/chat-widget.js` header comment said "Rally HQ Blueprint — AI chat widget"; now "Blueprint — AI chat widget (canonical chrome)"
- `template/portal/functions/api/chat.js` OpenRouter `HTTP-Referer: 'https://blueprint.rallyhq.app'` and `X-Title: 'Rally HQ Blueprint'` were hardcoded; now derived from request URL + manifest at runtime
