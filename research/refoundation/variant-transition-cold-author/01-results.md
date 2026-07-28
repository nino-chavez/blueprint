# Variant-transition cold-author observation — results

**Executed:** 2026-07-27 local / 2026-07-28 UTC

**Frozen candidate:** `d372a63ee31433b720f066e81f3ab17fe2c5a7fa`

**Fixture CLI verdict:** PASS — 18/18 sealed checks

**Cold-author gate disposition:** BLOCKED — the retained evidence does not
include the required facilitator-authored, pre-access boundary receipt or the
preserved plan/apply command transcripts.

## Observed result

The fixture observation recorded that an author used the copied author packet,
captured candidate help, the exact candidate executable, and a disposable clean
greenfield fixture. The author:

- completed in one attempt and 24 seconds;
- asked zero questions;
- received zero methodology-creator interventions;
- recorded three fixture-local assumptions;
- created a valid per-initiative transition decision;
- generated plan
  `4b210fd7057883d47383d4d9cee6e03fbf487bc6ab2740d8bcd61929ef9601bb`;
  and
- applied that exact plan without cleanup or rollback.

The sealed scorer passed 18/18. It independently verified the frozen candidate
revision and package hash, unchanged fixture baseline commit, exact decision
path and byte hash in the append-only receipt, the research variant/stage,
preservation of both authored sentinels, operator-review-only cleanup, absent
recovery journal, and `variant status` reporting one applied receipt with
rollback available.

## Harness correction before exposure

No author had been launched when the initial harness audit found a packet/scorer
filename mismatch, incomplete session validation, incorrect sentinel selection,
and missing frozen-revision/status checks. Those defects were corrected and the
harness committed at `6f4d1e6` before the author received any materials. The
preregistered packet and fixture were already committed at `c193903`; the
candidate executable remained the earlier frozen `d372a63`.

## Evidence

- `observation/cold-author-session.json` — author timing, attempts, questions,
  assumptions, and intervention count;
- `observation/variant-transition.json` — initiative-local decision;
- `observation/cold-author-explanation.md` — author explanation;
- `observation/fixture-manifest.json` — candidate and baseline identity;
- `observation/score.json` — sealed 18-check result; and
- `observation/receipt-summary.json` — receipt identity, byte hash, decision
  binding, preserved sentinels, and operation boundary.

The complete disposable receipt remained at the temporary observation path
during scoring. Its recorded SHA-256 is
`07a89e915c19604e5b6cb5c155b600f6e8dcccbaa98db375644c1977791be9d8`.
The summary retains the consequential fields without treating a temporary
absolute fixture path as a reusable consumer receipt.

## Gate disposition

This result does **not** clear continued cold-author success. The author session
records zero methodology-creator interventions, but it is not independent
evidence that the author was context-cold or received only the allowed
materials. It also retains no exact dry-run/apply JSON outputs or disclosed
command-attempt transcript. The score therefore establishes fixture CLI
usability of the per-initiative decision and preservation-first apply flow, not
cold-author clearance.

It does not count the fixture as a consumer, prove real initiative intent,
satisfy the prospective external transition or rollback gates, perform delayed
preservation, exercise support operations, authorize a release/Wave, or clear a
future migration freeze. The capability remains `candidate` and every fleet row
remains `not-distributed`.

## Remaining gates

1. A genuinely re-chartered contrasting external initiative prospectively
   executes the transition.
2. That initiative prospectively executes rollback inside the documented
   boundary.
3. A delayed preservation check confirms its authored artifacts remain intact.
4. A fresh boundary-receipt rerun demonstrates continued cold-author success.
5. Release/version and Wave authorization are separately granted.
6. Any active external consumer migration freeze is cleared or waived.
