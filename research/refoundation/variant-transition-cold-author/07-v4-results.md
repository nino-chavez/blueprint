---
status: failed-three-command-attempts
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
observation_id: 6bdffc04-737c-45f8-b600-a44e3def1727
score: 24/27
---

# Variant-transition cold-author v4 — results

## Disposition

**FAIL (24/27).** The corrected packet, sealed boundary, session, explanation,
transition, and preservation checks were valid, but the author disclosed three
command attempts rather than the preregistered exact plan/apply pair.

The first dry-run succeeded. The author then repeated the same dry-run solely to
persist its JSON output before applying the matching plan ID
`6b363fda8b253a5b7c8852a203e1caf57131732aefba5d451fcc676b7fefc611`.
Both plan invocations returned that ID, and apply succeeded. The scorer
therefore failed `session-valid`, `exact-command-attempts`, and
`recorded-command-bindings`.

All other checks passed: the author asked zero questions, received zero creator
interventions, completed in 77 seconds, used a valid initiative-local decision,
preserved both authored sentinels, created only the planned substrate, left
cleanup operator-review-only, did not roll back, retained one valid append-only
receipt, and left no recovery journal. The explanation explicitly covered
preservation, creation, cleanup, rollback, accountability, and review.

This is actionable authoring evidence. The packet shows commands and separately
requires preserved JSON, but does not show how to capture the first invocation's
output. The disclosed self-repair is not hidden or waived. This result does not
clear `continued cold-author success`, and no further rerun is authorized by
this result.

## Immutable evidence identities

| Artifact | SHA-256 |
|---|---|
| observation boundary | `04eb0bb8d3bc9c023d54b664987fd6cef9144523782e3faa6a537a8c039d909e` |
| fixture manifest | `e266cd3010361c28c0a2182eb366d0b587c309e473d98c4e31992bab7e1c6f26` |
| author session | `b8afe29a78c22aa274317efc57781572ef67874fca3f21f6604c80332b3568d7` |
| dry-run JSON | `0e1d81b6daa72da4f47a477b059dbe43bfc3936f3a5a049e2f30752c50a46c3f` |
| apply JSON | `8d1ee6de4f27fe29bafdb40524694acc31efaae08e4cf5790c431e1f3238258c` |
| author explanation | `90d9c8ed0b55fe756a262b3fffa9ccadebe993710f88e8abaf5344937b54e997` |
| transition decision | `724f636575de120f3294ce8c054402f2ca7be5c05d7ba5640af04c52a10113d3` |
| append-only receipt | `57ed3843130d5115eb556e45126684b4194caf5fbb607f7fce6aa67de2e41beb` |
| sealed 24/27 score | `21344acaa8ae050ddcf264af5059e3d5bc21ec7c66fc56b445030f81f5413d47` |

## Gate and next decision

The capability remains `candidate`, with these evidence gates open:

1. prospective external transition;
2. prospective external rollback;
3. delayed preservation check; and
4. continued cold-author success.

Before another cold-author observation, decide prospectively whether the
author-facing packet should show an exact capture command or the CLI should
offer a first-class output-file option. Either change requires a newly frozen
packet/scorer boundary and fresh author; it must not rewrite this result.

