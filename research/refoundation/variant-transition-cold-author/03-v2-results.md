---
status: blocked-packet-scorer-contract-defect
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
observation_id: 72de2fcc-8d30-4562-b2ac-b378c35d835d
score: 25/27
---

# Variant-transition cold-author rerun v2 — results

## Disposition

**BLOCKED for cold-author clearance.** The sealed transition operation passed,
but the observation cannot clear the gate because the author packet omitted
two representation/explanation requirements retained by the governing
preregistration.

The author completed exactly one successful dry-run and one successful apply in
29 seconds, with zero questions and zero creator interventions. The transition
plan and receipt were bound to plan ID
`2a400b66b4388327c7f2deafb27c345f23a5626e0331d8674817f3da3ed9b638`.
All preservation, decision, plan/apply binding, cleanup non-execution, journal,
status, and sealed-boundary checks passed.

The original scorer returned **FAIL (25/27)**:

1. The v2 packet required `methodology_creator_interventions` but accidentally
   omitted the v1 numeric shape. The author truthfully used an empty array; the
   scorer required numeric `0`.
2. The v2 packet asked the author to explain preservation, creation, rollback,
   accountability, and review, but accidentally omitted the preregistered
   requirement to distinguish operator-review-only cleanup. The author did not
   discuss cleanup in the explanation, although the mechanical
   `cleanup-unapplied` check passed.

The first mismatch is representational and could be normalized without changing
the evidence. The second is a missing substantive authored explanation retained
by `00-preregistration.md` and imported by
`02-boundary-receipt-preregistration.md` as an ordinary task check. It therefore
cannot be repaired or waived after exposure. The author files were not edited,
and this observation was not rescored into a pass.

## Immutable evidence identities

The disposable raw evidence remained unchanged after scoring:

| Artifact | SHA-256 |
|---|---|
| observation boundary | `2c8556d789873343f9541155d6f4dae8ef963cd959ba138f0e74ca27361ff6c6` |
| fixture manifest | `59fbfb51a00399261466faa3a6750efe3834f493e781cb1386ed19bff08e4d41` |
| author session | `e776619d331539b9394e6d2cddef3ff28c74f03c498380f7a50ac7f327a69e02` |
| dry-run JSON | `5b5a4ea59ce03e6adda936a73ab8e23340c8116722c6390dfdd1303fe05c7896` |
| apply JSON | `20b686e025ae40edab5a14d762bddece1630b9786b93f54ea7034972ae3155e5` |
| author explanation | `2b884844805f59aa179ee952d0063888faad01758abfd611c5f7e879cea70aee` |
| transition decision | `a381cb241845beae5bce0c5b340a7fa12120e97c3c28b5db95529f62d74f0f89` |
| append-only receipt | `af9ec93b6fa8ac21e2ee2babcd30fef762ff7e1e22100bbfd94e484cdec7d324` |
| original 25/27 score | `d4e81b2cc71914015dd6b188d7cb309192d2d2e445761181570b23e494a879f7` |

## Next evidence

A fresh observation may proceed only after a prospective packet/scorer
correction makes both retained criteria explicit. It requires a new context-cold
author, boundary receipt, observation ID, fixture, and score. This result
remains useful fixture evidence but does not clear `continued cold-author
success`.

