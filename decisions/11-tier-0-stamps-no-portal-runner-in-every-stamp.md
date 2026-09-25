---
canonical: true
---

# Decision 11 — Tier 0 stamps no portal, and every stamp gets the reviewer runner

**Date**: 2026-09-25
**Status**: Proposed — implemented on branch `fix/tier0-portal-runner-contract`, based on `main` after #48 (wave 109) and #49 (wave 110) merged. Awaiting operator ratification; not pushed.
**Wave**: 113

## Summary

Two written contracts disagreed with what `template/tools/blueprint-init/stamp.mjs` writes. Both were confirmed on 2026-09-25.

1. **Tier 0 and the portal: the doc is right.** Tier 0 is pre-portal, so the stamper stops copying a portal at Tier 0. That applies to both portal types.
2. **The reviewer runner: the comment is right about the intent.** Every stamp gets `tools/run-reviewers.mjs`. The runner first has to stop running the other portal type's reviewers. As it stands, it would hand every Initiative Portal stamp BLOCKs from gates that can never apply to it.

Decision 2 lands first because decision 1 depends on it: a portal-free Tier 0 stamp gets a `package.json` whose `reviewers` script runs the runner.

## Decision 1 — Tier 0 and the portal

### What disagreed

`docs/portal-and-tier-ladder.md` § "Tier 0 — Idea" says: "No portal yet. This tier is pre-portal." Its Variant × Tier table gives greenfield Tier 0 as "≤ 1 week pre-decision exploration only" and brownfield Tier 0 as "Doc-only audit, no portal needed".

The stamper copied a portal at every tier for every variant except research. Stamped on the wave 109 base:

| Stamp | Result |
|---|---|
| greenfield, Tier 0, `--portal-type=initiative` | `apps/portal` + `packages/` |
| brownfield, Tier 0, `--portal-type=initiative` | `apps/portal` + `packages/` |
| brownfield, Tier 0, `--portal-type=review` | `blueprint/portal` (the Review Portal branch has no tier check either) |
| midstream, Tier 0 | refused by the matrix (exit 2), as the doc says |

### Evidence that the doc is the contract

- **The stamper's own matrix agrees with the doc.** `VARIANT_TIER_MATRIX` labels greenfield Tier 0 `exploration-only` and brownfield Tier 0 `doc-only-audit`. Only the behavior disagreed.
- **The reviewers already implement the doc.** Both portal conformance reviewers return PASS at Tier 0 with "tier 0 — no … portal contract". So a portal stamped at Tier 0 existed but nothing checked it.
- **Both real Tier 0 consumers behaved as the doc predicts.** A survey of 23 `blueprint.yml` files on the operator's machine found two non-research initiatives at Tier 0. Both are private, so they are de-named here, as `consumers.yml` de-names private initiatives.
  - **A private greenfield initiative**, stamped 2026-08-18. Its reader deliverable was a decision memo, not the portal. Its own Stage 7 record says that the `prototype-shell` gate "passes on file presence alone", because the template ships `apps/portal/package.json`: "a false positive; no prototype was built". Its stage record notes `terminology-linter` blocking "only on vendored apps/portal harness code". A commit on 2026-09-19 hand-fixed the unused portal's typecheck. The only other portal-path edits were to `packages/design-tokens/tokens.json`. It still declares `tier: 0` five weeks later.
  - **A private brownfield initiative**, stamped 2026-09-09. The stamp commit is the only commit that touches its Review Portal. The work is Stage 0 captures, which is the doc's "doc-only audit".

  What it means: at Tier 0 the stamped portal produced a false gate pass, lint noise and upkeep, and no reader used it.
- **Wave 109 did not decide this.** Its commit message says "The shape follows what was stamped, not the tier". It kept the portal workspace root for Tier 0 because the stamper wrote a portal there.

### Options and what each means for consumers

**A. The doc wins: Tier 0 stamps no portal.** Recommended.

- A new Tier 0 stamp (greenfield or brownfield, either portal type) gets no `apps/portal`, `packages/` or `blueprint/portal`.
- It gets the same root `package.json` as a research stamp: `derive` and `reviewers` scripts, no workspaces. No `npm install` is needed.
- `blueprint.yml` keeps `pilot_profile`, `portal_type` (the portal type the initiative will use at Tier 1) and the `portal:` block.
- `reader-contract.json` points at `docs/`. A missing rendered root is a WARN, and nothing BLOCKs.
- The `prototype-shell` gate no longer passes on a fresh Tier 0 stamp.
- Existing Tier 0 consumers do not change. The stamper never re-runs itself, and `blueprint upgrade` only bumps the version pin (`template/tools/lib/upgrade.mjs`: "v1 is pin-bump only").
- **The cost is moving to Tier 1.** It becomes a re-stamp plus hand edits, where today it is one edit. This was measured on a simulated portal-free Tier 0 initiative, committed, then re-stamped with `--tier=1`:
  - The re-stamp exits 0 and adds `apps/` and `packages/`.
  - It also overwrites `.claude/**` and `tools/lib/**`. An operator edit to `.claude/settings.json` was lost; any re-stamp does this today.
  - `package.json` is preserved without workspaces, so `npm run build` fails.
  - `blueprint.yml` is preserved with `tier: 0`, so both portal reviewers keep skipping.
  - `reader-contract.json` is preserved with no portal surface.
  - Nothing warned about any of it. The stamper now warns about the first two preserved files. The steps are in the tier-ladder doc.
- `template-health` CI is unaffected. It stamps with no `--tier`, and the stamper defaults to Tier 1. Tier 0 coverage belongs in `smoke.mjs`, which the `core-tests` job runs.

**B. The stamper wins: rewrite the doc so Tier 0 includes a dormant portal.**

- No code change, and moving to Tier 1 stays one edit to `tier:`.
- The doc's "No portal yet" goes. So does its rule that "if a portal exists … the initiative is ≥ Tier 1", because the stamper would create a portal at birth.
- The matrix cells "doc-only audit, no portal needed" become false.
- Every Tier 0 stamp keeps the false `prototype-shell` pass, the lint noise and the upkeep. The conformance reviewers keep skipping a portal that exists.

**C. The stamper refuses Tier 0 for product variants.**

- The stamped consumer guide's `--tier=0|1|2` for product variants becomes wrong.
- Greenfield exploration and doc-only audits either lose the pilot-profile gate and reviewers, or must pretend to be research initiatives.
- Neither real Tier 0 consumer could have been stamped.

**D. Tier 0 is portal-free by default, with a `--with-portal` flag.**

- The doc says a portal makes the tier ≥ 1, so the flag would recreate the contradiction on request.
- Anyone who wants a portal should stamp Tier 1.

## Decision 2 — The reviewer runner

### What disagreed

The comment in the Review Portal branch of `main()` says "the imposition layer (.claude reviewers + tools/lib + run-reviewers) is installed into EVERY stamped initiative". Wave 85's `WAVE-LOG.md` entry and the `smoke.mjs` header say the same.

Initiative Portal stamps (non-research Pattern A) got `.claude` and `tools/lib` but no `tools/run-reviewers.mjs`. Only `scaffoldResearch` and the Review Portal branch copied it.

### History

- `d82963d` (2026-06-16) created the runner "stamped into research initiatives". Initiative Portal stamps never had it. The install-gap fix of the same day (`08e8a9c`) wired `.claude` and `tools/lib` only.
- `c0b6aa7` (wave 85, 2026-07-09) added it to the Review Portal branch. Wave 85 did so believing that Initiative Portal stamps already had it.

What it means: the recorded intent is one imposition layer in every stamp. The comment's history is wrong, and nobody decided to leave the runner out of Initiative Portal stamps.

### Demand

`initiatives/adaptive-commerce-content` (greenfield, Initiative Portal) filed an amendment on 2026-07-23 ("Pattern A stamp omits the reviewer runner…"; Status: Active; Candidate for methodology promotion). Its ask: "copy `tools/run-reviewers.mjs` on every non-research Pattern A stamp". It also asked for a smoke assertion and a regression that executes the stamped runner. The consumer copied the runner in by hand.

### Measured: the runner on fresh product stamps

The runner has a per-variant list of reviewers only for research. Every other variant runs all 20 executable reviewers.

- **Fresh Initiative Portal stamp** (greenfield, Tier 1, runner copied in by hand). Two Review Portal reviewers BLOCK: `portal-chrome-canonical-reviewer` with 10 blocks and `portal-review-conformance-reviewer` with 1. The chrome reviewer's candidate list includes `apps/portal`.
- **Fresh Review Portal stamp** (brownfield, Tier 1). The Initiative Portal reviewer `portal-initiative-conformance-reviewer` BLOCKs once.
- **Doctor decides this differently**, and doctor is the release gate. It skips the Initiative Portal reviewer when the initiative follows the actor-output contract (decisions/05), and every fresh stamp does. It runs the two Review Portal reviewers only when a portal directory with Review Portal chrome exists (checks 6 and 6b in `template/tools/lib/doctor.mjs`).

What it means: installing the runner everywhere as it stands would teach people to ignore BLOCK. The runner exists to prevent exactly that.

### Options and what each means for consumers

**A. Install the runner everywhere, unchanged.**

- Every stamp gets the same imposition layer.
- Every Initiative Portal stamp gets 11 BLOCKs from gates that cannot apply to it.

**B. Install the runner everywhere, and decide portal reviewers the way doctor does.** Recommended.

- One helper, `template/tools/lib/portal-reviewer-routing.mjs`, decides which portal reviewers apply, and both doctor and the runner call it. That keeps one owner for the rule. Smoke checks that the runner's portal reviewers match doctor's routing on fresh stamps of each portal type.
- Every stamp has one command to run its reviewers. The portal workspace root gains `npm run reviewers`, the same as the research and Tier 0 roots.
- A Review Portal stamp still writes no `package.json`, so it uses `node tools/run-reviewers.mjs`.
- A fresh stamp still exits 1. The pilot-profile and stage gates BLOCK until work is done, and that is correct.
- **Existing consumers**: nothing changes until they copy the runner and the helper by hand. `blueprint upgrade` does not refresh `tools/`. Review Portal consumers that carry the old runner (`nino-chavez-site` and the private brownfield initiative) keep seeing the Initiative Portal reviewer BLOCK until they re-copy it.

**C. Research only: remove the runner from Review Portal stamps and fix the comment.**

- Review Portal stamps lose a command.
- This contradicts wave 85's recorded intent and the consumer amendment.
- The runner stays correct only for research.

**D. Status quo: fix the comment only.**

- Review Portal stamps keep a runner that BLOCKs on the Initiative Portal gate.
- Initiative Portal stamps keep none.
- Nothing justifies that split.

## How the two decisions interact

Portal-free stamps (research and Tier 0) get a `reviewers` script that runs `tools/run-reviewers.mjs`. So decision 1 depends on decision 2. The two land as separate commits, decision 2 first. To revert decision 2, revert decision 1 first, or remove `reviewers` from the portal-free `package.json` shape.

## Variant × Tier matrix check

| Variant | Tier | `VARIANT_TIER_MATRIX` | Doc cell | Behavior before | After |
|---|---|---|---|---|---|
| greenfield | 0 | `exploration-only` | ≤ 1 week exploration only | portal stamped | no portal |
| greenfield | 1 | `default` | default starting tier | portal | unchanged |
| greenfield | 2 | `if-product-day-one` | real product surface from day one | portal | unchanged |
| midstream | 0 | `blocked` | not applicable | refused | unchanged |
| midstream | 1 | `portal-only` | portal is the only mid-build artifact | portal | unchanged |
| midstream | 2 | `default` | default | portal | unchanged |
| brownfield | 0 | `doc-only-audit` | doc-only audit, no portal needed | portal stamped | no portal |
| brownfield | 1 | `default` | default for redesign review | portal | unchanged |
| brownfield | 2 | `audit-ships-product` | audit ships a product surface | portal | unchanged |
| research | 0 | `default` | evidence tree + memo, no portal | no portal | unchanged |
| research | 1 | `portal-optional-provenance` | optional reader surface added separately | no portal | unchanged |
| research | 2 | `blocked` | blocked | refused | unchanged |

Every label matches its doc cell. Two lines of text did not match:

- The matrix header comment described `true`/`false` values and a `--force` flag. The values are strings, and there is no `--force`; `main()` fails on `"blocked"`. The comment is corrected.
- The stamped `blueprint.yml` said "Tier-0 default: ZERO data sources wired". That used "Tier 0" to mean a portal configuration state. It now says "Stamped default".

## Not fixed here

Each of these is real, but none belongs to this decision:

- The private greenfield initiative declares `tier: 0` with a portal. By the ladder's rule it is Tier 1 or above, and nothing tells it so.
- `prototype-shell` still passes on file presence at Tier 1. It is the same kind of gap as wave 109's flagged Stages 0, 1 and 5.
- `--portal-type=bespoke` stamps an Initiative Portal.
- Review Portal stamps write no `package.json`.
- A re-stamp overwrites `.claude/**` and `tools/lib/**`, including an operator's `.claude/settings.json`.
- `portal-chrome-canonical-reviewer` treats `apps/portal` as a Review Portal location. That produced the 10 BLOCKs. The routing sidesteps it for the runner; the reviewer itself is unchanged.
- A fresh Initiative Portal stamp fails `terminology-linter` on its own vendored `ArchaeologyChat.tsx` ("payload", "endpoint").
- The same consumer amendment asked to keep `.DS_Store`, `__pycache__` and `*.pyc` out of `copyTree`, and to check stamped text for trailing whitespace.

## What would change this

- **Decision 1**: a Tier 0 product initiative that used its stamped portal as a reader surface before moving to Tier 1. That would favor option B or D. Or evidence that moving to Tier 1 is common enough that the hand edits cost more than unused portals do.
- **Decision 2**: evidence that consumers run gates only through `blueprint review`, `stage advance` and doctor, and never through the runner. That would favor option C. The `adaptive-commerce-content` amendment is evidence against.

## Provenance

Checked on 2026-09-25:

- Stamper behavior: seven real stamps from the wave 109 base (then `1ddb704`, now `207202c`) into a scratch directory.
- Runner behavior: executed against a fresh greenfield Tier 1 Initiative Portal stamp (runner copied in) and a fresh brownfield Tier 1 Review Portal stamp.
- Moving to Tier 1: a simulated portal-free Tier 0 stamp was committed, re-stamped at `--tier=1`, and read with `git status`.
- Consumers:
  - the private greenfield initiative's `git log`, Stage 7 decision record and `.blueprint/stage-state.json`;
  - the private brownfield initiative's `git log`;
  - the `METHODOLOGY-AMENDMENTS.md` entry of 2026-07-23 in `adaptive-commerce-content`;
  - 23 `blueprint.yml` files under `~/Workspace/dev`.
- History: `git log -S run-reviewers` on `stamp.mjs`; commits `d82963d`, `08e8a9c` and `c0b6aa7`.
- Doctor routing: `template/tools/lib/doctor.mjs` checks 2b, 6 and 6b.
- Freeze: `blueprint fleet` shows 16 consumers, 6 behind and 10 unpinned, with none mid-migration.

Not checked: consumers on other machines, and whether any external consumer re-stamps in place.
