---
canonical: true
---

# ADR-0005 — Consumer registry (`consumers.yml`) + `blueprint fleet`

**Date**: 2026-06-04
**Status**: Accepted
**Surfaced by**: `wip/blueprint-platform` productization dogfood, build-order step 7 (Distribution & Versioning track A). Operationalizes the bidirectional-update vision recorded in the blueprint-platform consumer's `decisions/ADR-0005-bidirectional-update-protocol.md`; this methodology-source ADR fixes the concrete v1 shape (the consumer ADR is a sibling, not a duplicate — it argues the protocol, this one ships the registry + read command).

## Context

The methodology ships to a fleet of consumer initiatives (`rally-hq`, `blog`, `blueprint-redesign`, `blueprint-platform`, …). Each consumer can pin the methodology version it was built against via `methodology_version` in its own `blueprint.yml`; the SessionStart hook (`template/.claude/hooks/blueprint-session-start.py:201`) reads that pin and shows an in-consumer drift banner. But there is **no methodology-side view of the whole fleet** — no way to answer "which consumers are behind, and by how much" from the source repo. That answer is the precondition for any push-to-fleet (step 8 `blueprint upgrade`) and for release hygiene.

Two facts constrain the v1 shape, both verified against the live repo on 2026-06-04:

1. **No semver tags exist yet.** `package.json` `version` is `0.1.0` (the single source the hook already uses); there are zero `vX.Y.Z` git tags (only `dogfood-v*`). The only real pin in the fleet is a **git sha** — `blueprint-platform` pins `methodology_version: "010945a"` (23 commits behind HEAD `4d8f319`). So fleet must be honest across **three worlds at once**: semver pins, sha pins, and unpinned consumers — it cannot assume semver.
2. **Scope ceiling A (methodology-native).** No hosted catalog service, no daemon. Everything computes from a committed file + the methodology's own git history. The command must not clone or fetch consumer repos.

## Decision

Add a hand-maintained registry file, **`consumers.yml` at the methodology source root** (beside `package.json` / `METHODOLOGY.md`), and promote the `blueprint fleet` CLI stub to a real **read-only, visibility-only** command that classifies each registered consumer's drift from the current methodology version.

### `consumers.yml` is a MIRROR, not the source of truth

The **authoritative** pin for a consumer is `methodology_version` in *that consumer's* `blueprint.yml` (where the hook reads it). `consumers.yml` is a methodology-side **mirror** of those pins, aggregated here only because the no-clone constraint forbids `fleet` from reading N consumer repos in one sweep. A mirror can be stale: a consumer can bump its own pin without updating this file. Therefore:

- `fleet` reports **drift-against-the-mirror**, never authoritative drift.
- Each entry carries `synced_at` (the date the mirror was last reconciled to the consumer's `blueprint.yml`); `fleet` emits a per-row staleness note so the operator knows how much to trust each row.
- Auto-deriving the mirror (`blueprint fleet --register`) is **deferred** (step 7.5). v1 is read-only.

This is the inverted-lockfile shape: a normal lockfile lives in the consumer and pins the dependency; here the manifest lives in the dependency (the methodology) and records each consumer's pin — forced registry-side by no-clone. The disqualifier for the vanilla consumer-side lockfile is that it would require cloning every consumer to read N lockfiles.

### The version model — two anchors, selected by pin SHAPE

`fleet` resolves the current methodology version into two **co-equal** anchors (not a precedence chain):

- `version` — `package.json` `version` (today `0.1.0`). The anchor for **semver-shape** pins.
- `head` — `git rev-parse HEAD`. The anchor for **sha-shape** pins.
- `latestSemverTag` — informational header context only; never a classification input in v1 (none exist today).

Classification is **intra-shape only**. A semver pin is compared to `version` via semver ordering; a sha pin is compared to `head` via git ancestry. There is no cross-shape comparison — "is sha `010945a` behind semver `0.1.0`?" is meaningless until the sha is tagged. A pin that can't be placed by its own native ordering is `unresolvable`, never a faked behind/ahead.

### Drift classes

| Class | Definition | Counts as drift? |
|---|---|---|
| **current** | semver: `pin == version`. sha: pin resolves to an OID **== `head`** (checked FIRST, before any ancestry probe). | no (exit 0) |
| **behind** | semver: `pin < version`. sha: pin resolves `!= head` and `git merge-base --is-ancestor <pin> HEAD` → distance `git rev-list --count <pin>..HEAD`. | **yes (exit 1)** |
| **ahead** | semver: `pin > version`. sha: pin resolves `!= head`, not an ancestor of HEAD, but HEAD is an ancestor of pin. (Rarely computable natively — the forward commit usually lives only in the consumer's clone, so it degrades to `unresolvable`.) | no by default; `--strict` counts it |
| **on-deprecated** | pin is orderable AND the entry carries `deprecated_pin: true` (explicit operator flag; schema-aware detection deferred). | **yes (exit 1)** |
| **unpinned** | pin is `null`/absent. The majority of the live fleet. "I cannot compute a position" ≠ "there is a position and it is behind." | no (exit 0, informational) |
| **unresolvable** | pin is a non-null string that is neither valid semver nor a commit resolvable in THIS repo (`git rev-parse --verify <pin>^{commit}` fails: fork sha, typo, ambiguous prefix, non-commit object). A pin pointing nowhere is a defect. | **yes (exit 1)** |

The sha decision order is exactly: `rev-parse --verify` → fail ⇒ `unresolvable`; OID `== head` ⇒ `current` (FIRST — because `git merge-base --is-ancestor HEAD HEAD` is true in both directions, so an equals-HEAD pin would otherwise fabricate "behind 0"); ancestor-of-HEAD ⇒ `behind`; HEAD-ancestor-of-pin ⇒ `ahead`; else ⇒ `unresolvable` (off the HEAD line).

### Exit codes

- `0` — clean: every consumer is `current`, `ahead`, or `unpinned`.
- `1` — actionable drift: ≥1 consumer `behind` / `on-deprecated` / `unresolvable`, **or** the registry is structurally suspect (any malformed/skipped item, or a duplicate `repo` key). A registry that *looks* populated but yields zero usable consumers never exits 0 — that false-green is worse than a crash.
- `2` — input error: `consumers.yml` missing, empty, or `blueprint_home` unresolvable.

`ahead` is excluded from drift by default (a consumer forward of source `main` is a real, non-drift state); `--strict` folds `ahead` into the tally for a strict "everyone == current" gate.

## Rationale

1. **Honest across three version worlds.** Most of the live fleet is unpinned; treating unpinned as exit-1 drift would make day-one CI a hard failure on the honest bucket and incentivize fake pins. Splitting `unpinned` (informational) from `unresolvable` (a real defect) keeps the gate meaningful.
2. **Methodology-native.** The command lifts `stamp.mjs`'s git-history divergence walk from file-granularity to version-granularity. No service, no clone — it reads one committed file and the methodology's own git objects.
3. **Catalog-shaped without the catalog service.** Backstage's software catalog is the canonical "registry of who-owns-what," but it is a hosted backend — out by ceiling A. We take its entity-descriptor idea (`{repo, owner, …}` per consumer, ownership via a CODEOWNERS-shaped handle) and drop its control plane: the "service" is `blueprint fleet` run on demand, not a daemon. The `owner` field is deliberately catalog-shaped so a future hosted catalog could ingest `consumers.yml` unchanged.

## Consequences

### Non-breaking

- Purely additive: a new root file + a new lib (`template/tools/lib/consumers-registry.mjs`) + the `fleet` subcommand promoted from stub to real. No existing behavior changes; a consumer that never registers is simply absent from the fleet view.
- The SessionStart banner is unchanged. Note it does a sha-blind string compare (`pinned != package.json.version`), so for a sha pin it always says "differs" even when `fleet` correctly computes "behind 23 commits." For sha pins, `fleet` is the more precise channel and supersedes the banner; the banner-agreement claim holds only for semver pins. Teaching the hook the same intra-shape comparison is a follow-up.

### Limitations (named, not hidden)

- The mirror can be confidently wrong until `--register` lands; `synced_at` + staleness notes mitigate but do not close the gap.
- sha-`ahead` is best-effort (the forward commit usually isn't in this repo's object store → degrades to `unresolvable`). Semver-`ahead` is reliable.

## Alternatives considered

| Option | Why rejected |
|---|---|
| `consumers.yml` carries identity only; `fleet` reads each pin from the consumer's `blueprint.yml` | Requires reading N consumer repos — violates the no-clone constraint. The mirror exists precisely to avoid this. |
| Treat every non-current pin (incl. unpinned) as drift | Fails CI on the honest unpinned majority day one; incentivizes fake pins to go green. |
| Cross-order sha vs semver (e.g. "sha == the commit package.json was bumped at") | Verified `package.json` post-dates the only real pin (`git show 010945a:package.json` is empty); the anchor is unresolvable for any pre-baseline sha, and it forces a cross-shape comparison the honesty rule forbids. |
| Backstage / hosted catalog | A running backend — out by scope ceiling A. We keep the descriptor shape, drop the service. |

## Follow-ups

- **Step 7.5 `blueprint fleet --register`** — auto-derive the mirror from each consumer's `blueprint.yml` (closes the stale-mirror gap when a clone is available).
- **Step 8 `blueprint upgrade`** — semver-aware pull keyed off the Changesets CHANGELOG delta; consumes the `behind` distance this command computes.
- **Teach the SessionStart hook intra-shape comparison** (a methodology-amendment) so its banner agrees with `fleet` for sha pins.
- **When the first `vX.Y.Z` tag ships** (ADR-0007 Changesets pipeline), confirm whether `behind` distance for a semver pin should be tag-count-between or minor/patch delta — they diverge if releases skip versions.
