# Decision 0011 — run the Film Room native Blueprint pilot

Status: accepted for the isolated native-pilot branch based on integrated
product boundary `83d85fc92edcae2de323c5e7575cbd5acd0e385e`.

## Context

Film Room is the contrasting active-product consumer required after the
single-operator Fleet pilot. Its current initiative is an assisted
design-partner beta for a local macOS media application, so its consequential
evidence comes from package, trust-chain, native-window, accessibility,
operator, support-authority, and second-person boundaries rather than a
scheduled web report.

The blind paired A/B favored the refounded semantic core 99/100 to 96/100, but
did not meet its preregistered material-superiority threshold. It authorized no
consumer write. The later release preservation and integration work established
a safe source boundary:

- first merge parent: `c39a7311bd0998ef9cf3126e6578c569ee44658f`;
- second merge parent:
  `3c4419fbd3d3616203800f5e2873863ba2df37e4`;
- exact integration commit:
  `83d85fc92edcae2de323c5e7575cbd5acd0e385e`; and
- full integration verification passed without rewriting either parent.

The integrated candidate has strong unsigned-package and process evidence. It
does not have a signed/notarized DMG, an exact merged native-window receipt, a
full current-candidate D-series matrix, complete launch information, or a
second-operator receipt.

The pre-application native shadow also found a clean-clone compatibility
discrepancy. `actor-output.yml` names `data/filmroom.db` as account state and
marks the scope decision aid and event delivery report `issued`, but the entire
`data/` boundary is deliberately gitignored and absent from an isolated
worktree. The actual actor-output gate is therefore blocked by three path
errors and retains three human-validation pendings. The integration worktree
held an ignored local database and reported only the two output errors; a prior
dirty release checkout also held local outputs. Both concealed part of the
clean-clone condition.

## Decision

Add `blueprint-native.yml` using research schema `blueprint-compact/0` and
profile set `k1-research-0`. On the pilot branch, that file is authoritative for
the initiative charter, exact native claims, native receipts, checkpoints, and
modules.

Keep these existing sources as compatibility or specialist inputs:

- `blueprint.yml` remains frozen portal, lifecycle, and legacy-tool
  configuration;
- `launch-contract.yml` remains the detailed product lifecycle contract; and
- `actor-output.yml` remains the canonical source of its existing actor outcomes
  and output inventory, imported into the native evaluation rather than copied.

Do not author the same claim or receipt in both native and legacy files. A
legacy tool result is a bounded compatibility view, not evidence that a native
checkpoint is globally ready.

The maintainer explicitly holds `correct-receipt` authority. The named
`release-agent` may issue only receipts whose authored evidence contract names
that agent and exact oracle. It gains no authority to change intent, accept
distribution risk, designate support, invite a beta operator, or issue another
actor's outcome receipt.

## Evidence boundaries

The native contract deliberately keeps these states separate:

1. release programs exist at the native migration boundary;
2. the legacy actor-output clean-clone view is contradicted by its absent
   gitignored account state and two issued artifacts and remains a separate
   compatibility checkpoint;
3. the exact merged unsigned app builds, inspects, and starts its packaged
   service;
4. the exact merged native window could not be observed because the Mac was
   locked;
5. the full current-candidate visual matrix is contradicted because only six
   captures are current and the rest are explicitly historical;
6. launch information is contradicted because final candidate/package material
   and the real support contact/schedule remain absent;
7. signing, notarization, stapling, and Gatekeeper are open;
8. the founder's current real-event workflow is open until the maintainer
   performs it and issues the compatible receipt; and
9. second-operator first value remains dependency-blocked.

The legacy actor-output contradiction is accepted for this methodology-only
pilot, not resolved or hidden. It does not prove package failure, and a native
package receipt does not prove those recipient artifacts exist. Any later
product fix must choose explicitly whether issued generated outputs are
regenerated before the gate, represented by a durable issuance receipt, or no
longer required to resolve as checkout paths.

An unsigned process start is not a native-window receipt. A window receipt is
not a signed distribution receipt. A signed package is not second-operator
activation. Report or receipt presence is not human use.

## Source-version rule

The five initial native receipts apply to the product bytes at integration
commit `83d85fc`. The pilot commit adds only this decision and
`blueprint-native.yml`, so compiling `source_version: current` after that commit
does not claim that a different product candidate was rebuilt. Any later change
to runtime, package, launch information, visual sources, or release
configuration creates a new product boundary and requires new compatible
receipts. Method-only receipt additions remain append-only evidence changes and
must say which product revision they observed.

## Verification

Evaluate from the Blueprint methodology checkout without copying generated
state into Film Room:

```sh
node research/refoundation/v2-shadow/compile-compact.mjs \
  --source=/absolute/path/to/film-room/blueprint-native.yml \
  --output=research/refoundation/v2-shadow/generated/compact-overlays/film-room-live.json
node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/generated/compact-overlays/film-room-live.json \
  --root=/absolute/path/to/film-room \
  --output-label=film-room-live
```

The Film Room checkout receives no generated normalized JSON or report.

## Rollback

Semantic rollback is a new decision that marks `blueprint-native.yml` dormant
and returns top-level charter, claim, receipt, checkpoint, and module authority
to the legacy contracts. Keep the native source and receipts in history; do not
delete or translate them to manufacture continuity.

The mechanical rollback surface is exactly two files:

- `blueprint-native.yml`; and
- `decisions/0011-native-blueprint-pilot.md`.

No runtime, package, test, portal, launch-contract, actor-output, legacy
Blueprint, lockfile, generated evidence, secret, media, or release
configuration file changes in this pilot. The preserved parent branches and
both merge parents remain additional recovery boundaries.
