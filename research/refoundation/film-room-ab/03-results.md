---
status: complete-inconclusive
date: 2026-07-22
consumer: film-room
consumer_mode: read-only-blind-paired-pilot
native_candidate: amber
current_candidate: cobalt
native_score: 30
current_score: 27
preregistered_threshold: 4
consumer_writes: 0
---

# Film Room blind A/B steering pilot results

## Verdict

The native claim/evidence contract led the current Blueprint contract by three
points, 30/30 to 27/30. The preregistered threshold was four points, so the
formal result is **inconclusive**.

This is still informative. Both candidates correctly classified all five
consequential Film Room boundaries, kept structural success below actor
success, recommended signed-package inspection before an independent operator
encounter, asked no questions, invented no evidence, and made no Film Room
writes. The current method therefore performed materially better than the
failure that triggered the refoundation. The native contract's narrower
advantage was explicit semantic control, not a different operational answer.

## Assignment reveal

The hidden commitment was created before either arm ran:

- commitment: `a9924c21485eb974ce90c59be83a6ff6da92f311c0718b3ddf99ad3dd68f889b`;
- reveal: `amber=native;cobalt=current`;
- nonce: `e7769708291c79b55036f73bf3a3061c`;
- exact preimage:
  `amber=native;cobalt=current;nonce=e7769708291c79b55036f73bf3a3061c`;
  and
- SHA-256 of that preimage: exact match.

The evaluator finalized scores without access to either contract packet or the
assignment. The mapping was revealed only after `scores.json` was written.

## Primary and secondary results

| Measure | Native (amber) | Current (cobalt) |
|---|---:|---:|
| Blind rubric score | 30/30 | 27/30 |
| Consequential boundaries correct | 5/5 | 5/5 |
| Dependency-ordered first move | yes | yes |
| Structural/actor separation | yes | yes |
| Questions | 0 | 0 |
| Assumptions | 4 | 5 |
| Elapsed time | 248 s | 183 s |
| Explicitly opened files | 22 | 25 |
| Commands recorded | 10 | 13 |
| Film Room writes | 0 | 0 |

Neither arm recommended portal or provenance work ahead of package and actor
evidence. Neither triggered a disqualification or score cap.

## Where the scores differed

The native candidate received the three points the current candidate did not:

1. It explicitly preserved **scheduled operator assistance** while requiring
   first value without developer intervention.
2. It explicitly kept **commercial validation** outside the current charter,
   alongside payments and public self-service distribution.
3. It explicitly identified the required **founder/maintainer encounter
   observer** instead of leaving that evidence-source condition implicit.

The current candidate was 65 seconds faster and consulted a broader lifecycle
and package context. It nevertheless reached the same boundary states and
highest-leverage next move. The observed tradeoff is therefore explicitness of
semantic ceilings versus breadth and speed, not correctness versus failure.

## Interpretation

The result does not justify a superiority claim. A three-point lead on one
paired run is below the threshold fixed in advance, and both agents operated
against a Film Room contract that has already been hardened since the original
failure. That creates a useful ceiling effect: the control is no longer the
version that failed.

The result does support three narrower conclusions:

- the native contract preserves the current method's operational steering
  quality on this difficult consumer;
- it makes several authority and scope conditions more reliably explicit; and
- the refoundation should remain an opt-in pilot, because this trial does not
  demonstrate enough separation to justify a default-method migration.

## Rollout consequence

Film Room remains unchanged. This read-only A/B is a method-comparison pilot,
not the second contrasting **live** native consumer required by Decision 08.
Do not migrate Film Room, change `template/`, or broaden public distribution on
the strength of this result alone.

A later Film Room live pilot should begin only after the launch work stabilizes
and the exact signed-package or founder encounter evidence can be captured.
That trial should test native authoring and receipt correction in normal use,
not repeat this assessment against the same frozen evidence. Until then, Fleet
remains the sole live native consumer.

## Integrity record

Both candidates began and ended at Film Room HEAD
`7ed37ae6bb49f72233aacbf16c078c60915b3d85` with dirty-status fingerprint
`bd71e8c69200d1446e3a63aef29ddbbac068e8c00f8a96675a91916f3e8c77bf`.
Both session records report `consumer_writes: 0`. The evaluator's section sums,
totals, delta, and threshold interpretation were independently recomputed after
the reveal.

The detailed blind rationale is in `evaluation/evaluation.md`; machine-readable
scores are in `evaluation/scores.json`; candidate reports and trace records are
under `arms/amber/` and `arms/cobalt/`.
