---
status: preregistered-before-arm-execution
date: 2026-07-22
consumer: film-room
snapshot_head: 7ed37ae6bb49f72233aacbf16c078c60915b3d85
snapshot_dirty_fingerprint: bd71e8c69200d1446e3a63aef29ddbbac068e8c00f8a96675a91916f3e8c77bf
assignment_commitment_sha256: a9924c21485eb974ce90c59be83a6ff6da92f311c0718b3ddf99ad3dd68f889b
---

# Film Room blind A/B steering pilot preregistration

## Question

On the same active Film Room snapshot and the same incoming-agent task, does a
native claim/evidence contract produce a more accurate and higher-leverage
steering assessment than the current Blueprint contract?

This is a paired, blinded pilot—not a population estimate. It tests the
specific failure class that triggered the re-foundation: procedural/output
progress appearing healthier than founder, package, or second-operator evidence.

## Blinding and assignment

- Two fresh agents receive identical common instructions and the same read-only
  Film Room checkout.
- Each receives one contract packet labelled only `amber` or `cobalt`.
- One packet represents current Blueprint; one represents the native semantic
  contract. Agents are not told which is control or treatment and may not read
  the sibling packet or Blueprint's refoundation research.
- A third fresh evaluator sees the two assessments and this preregistered rubric
  but not the arm contract packets or assignment.
- The mapping plus a random nonce was committed before execution by the SHA-256
  value in frontmatter. Mapping and nonce are revealed only after the evaluator
  finalizes scores.
- Both arms use the inherited model and reasoning configuration. Neither may
  write to Film Room.

## Frozen source boundary

Both arms inspect the same live read-only checkout:

- HEAD `7ed37ae6bb49f72233aacbf16c078c60915b3d85`;
- dirty-status fingerprint
  `bd71e8c69200d1446e3a63aef29ddbbac068e8c00f8a96675a91916f3e8c77bf`;
- current branch is 14 commits ahead of `origin/main`; and
- the large launch/distribution worktree is intentionally dirty.

If this fingerprint changes before both arms finish, the pair is invalid and
must be rerun against a new frozen boundary.

## Primary endpoint

Blind evaluator total on the 30-point rubric in `02-evaluator-rubric.md`.

Interpretation fixed before execution:

- native contract leads by **4 or more**: directional pass;
- absolute difference under 4: inconclusive;
- current contract leads by 4 or more: directional failure for the native
  intervention; and
- any consumer write or invented human receipt disqualifies that arm.

## Secondary endpoints

- correct classification of five consequential boundaries;
- whether structural/gate success is kept separate from actor success;
- whether the first recommended move follows the dependency graph;
- number of questions and assumptions;
- elapsed time and number of files consulted; and
- whether portal/provenance work is recommended ahead of package/encounter
  evidence.

## Known limitations

This is one pair, on one difficult consumer, with self-reported trace metrics.
The treatment includes a derived state view because that is part of the
proposed product; the control includes the current manifest and launch gate
views for the same reason. A win supports rollout learning, not a universal
claim about all agents or projects.
