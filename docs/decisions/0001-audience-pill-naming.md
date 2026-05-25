---
canonical: true
---

# ADR-0001 — Audience pill naming

**Date**: 2026-05-25
**Status**: Accepted
**Supersedes**: open follow-up #1 in `docs/2026-05-25-three-session-reconciliation.md`

## Context

Pattern A portals expose an audience switcher with three pills that reorder the home-lane priority. `bc-subscriptions` introduced them as **executive / discovery / internal**, and the names propagated into `template/apps/portal/` and `template/packages/ui/` when that shell was lifted into the methodology repo on 2026-05-25.

The three labels do not share a naming logic:

| Pill | Form | What it actually names |
|---|---|---|
| `executive` | Role | Leadership audience — strategy-first |
| `discovery` | Action | Audience evaluating the product — hands-on |
| `internal` | Direction | Engineers / methodology reviewers — behind-the-scenes |

`internal` is the worst offender — "internal to what?" — but `discovery` is also off-axis: it names what the audience *does*, not who the audience *is*. The pill set should pick one axis and hold it.

## Decision

Rename all three pills to role-based labels:

| Before | After | Hint |
|---|---|---|
| `executive` | `executive` *(unchanged)* | Strategy-first walkthrough |
| `discovery` | `evaluator` | Hands-on / trial evaluation |
| `internal` | `engineering` | Methodology + behind-the-scenes |

Default audience: `evaluator` (was `discovery`). Storage key (`bcs-audience`) and change event (`bcs-audience-change`) keep their bc-subs-era prefixes for now — separate cleanup, tracked below.

## Rationale

1. **One axis: role.** "Who is looking" is the natural frame for an audience switcher. Naming by action (`discovery`) or direction (`internal`) makes the pills resist memorization.
2. **`evaluator` survives translation.** Whether the audience is a merchant evaluating a SaaS install, a hiring manager scanning a portfolio, or a stakeholder reviewing a redesign, the role is the same — they're evaluating something against criteria.
3. **`engineering` is honest.** The "internal" audience in bc-subs is engineers + methodology folks reviewing the build. Naming them by their actual role removes the question.
4. **All three pills change.** Renaming only `internal` would leave `discovery` as the lone action-named pill, perpetuating the inconsistency at the next audit.

## Consequences

### Breaking

- `Audience` type values change. Any consumer importing `'discovery'` or `'internal'` as a literal will need to update.
- The `bcs-audience` localStorage value resets to the new default (`evaluator`) for users who had stored `'discovery'` or `'internal'`. The hook's `isAudience` guard treats the stale value as invalid and falls through to the default.
- Storybook story names (`Default`, `Executive`, `Internal`) update to (`Default`, `Executive`, `Engineering`).

### Non-breaking

- `Audience` type identifier and the `AUDIENCES` tuple shape are unchanged.
- `AudienceSwitcher` component API and `useAudiencePreference` hook signature are unchanged.
- Storage key + change event names are unchanged (separate cleanup — see Follow-ups).

### Migration for consumers

For any consumer initiative using the old names:

```diff
- import { AUDIENCES, type Audience } from '@blueprint/ui';
- const order: Record<Audience, Verb[]> = {
-   executive: [...],
-   discovery: [...],
-   internal:  [...],
- };
+ const order: Record<Audience, Verb[]> = {
+   executive: [...],
+   evaluator: [...],
+   engineering: [...],
+ };
```

Per the [methodology freeze rule](../../template/CLAUDE.md), this template change lands first; consumer initiatives pick it up in sequenced migration sessions — they do not advance in parallel.

## Alternatives considered

| Option | Why rejected |
|---|---|
| `internal → engineering` only | Leaves `discovery` (action-named) as the lone outlier. Re-litigates at the next audit. |
| `internal → practitioner` | Broader, but vaguer. "Practitioner of what?" recreates the original ambiguity. |
| Defer (write ADR, skip rename) | The rename has no consumer migration in flight; no reason to defer. The cost is a one-time global find-replace in the template + two ADR-referenced lines in consumers. |
| Keep `executive / discovery / internal` as-is | Status quo bias. The reconciliation explicitly flagged the ambiguity; not acting is the worst outcome. |

## Follow-ups

- **Storage key prefix `bcs-`**: `bcs-audience` and `bcs-audience-change` still carry the bc-subscriptions prefix from the original lift. Rename to `blueprint-audience` and `blueprint-audience-change` in a separate change, since it's a different concern (template-prefix cleanup, not pill naming). Tracked as ADR-0002 when picked up.
