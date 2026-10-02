# The save design passed review; implementation remains untested

**October 2, 2026 · For Nino and the wedding owning chat**

The bounded design pilot is complete. A separate reviewer accepted the revised [RSVP design contract](design-contract.md) after finding two gaps in the first draft. The review does not establish that the application works or that another Blueprint gate would improve delivery.

The contract is ready for the wedding owning chat to apply. That application has not happened. Nino authorized pushing, merging and relaying this package on October 2. Relay follows the merge; the wedding owning chat retains responsibility for applying it. This commit publishes the research and review evidence, not an implemented application or a shared Blueprint gate.

## The review changed decisions that matter to a save

The first draft did not return the current scope version during recovery. An engineer following it could not construct the next safe save after an invitation change. The revision returns current scope and request versions together and requires the next intent to use them.

The first draft also reconstructed too much history from current relationships. After invitations changed, its audit could no longer show which events an earlier answer covered. The revision records that event scope with the answer, audit and receipt in the same transaction.

The final reviewer closed both findings and found no remaining material design defect within the selected slice. The [review record](review.json) identifies the exact candidate and sources. [First review](reviews/r1-review.md) and [final review](reviews/r2-review.md) preserve the independent judgments; the [first candidate](design-contract-r1.md) preserves what was actually rejected.

The author also clarified cancellation records, database privileges and response filtering. A past operation result is now separate from the current answer, which may have changed since that operation. These changes were included in the final review.

## The existing handoff already supplied most of the baseline

The handoff already required tenant isolation, explicit authority, atomic answers/audit/receipts, version checks, derived totals and recovery after a lost response. It was not missing an architecture wholesale.

The pilot made those requirements precise at one boundary: a persistent slot for an unanswered request; one serialized transaction; direct table writes denied; a terminal cancellation record that prevents a delayed request from committing after recovery; and totals/detail read from one snapshot. The reviewer judged those choices proportionate to a small fictional demo. They still need real database and browser tests.

**What this means for Blueprint:** continue with one manual design review tied to the implementation scope. Do not distribute a new shared validator yet. This was a prospective document review, not completed consumer adoption, an implementation trial or a blinded comparison against handoff-only work. Delivery benefit and maintenance cost remain unmeasured. The retrospective subscriptions/Rally examples still do not count as prospective adoption.

## Apply it without changing the frozen definition

The wedding owner should perform these steps when the package is handed over:

1. Recheck [source identities](source-manifest.json) and the v0.4 manifest. Resolve any changed requirement before adoption. Keep the historical research cursor intact.
2. Place the accepted contract in `docs/design/mvp-implementation-contract.md` and its review evidence under `docs/design/reviews/`. Relink local references for the receiving location, preserve the reviewed original, and record the adopted hash plus the relocation-only diff. Substantive changes need another review; relocating references does not establish a new semantic verdict.
3. Append the [proposed consumer amendment](../consumer-amendment.md), adding this pilot's actual review result and its untested limits. It remains a consumer learning, not a promoted methodology rule.
4. Add an `Implementation design readiness` section to the existing handoff. Identify scope `wedding-durable-rsvp-01`, accepted candidate revision 2 and the copied review record. State that P1–P8 are NOT_RUN; event editing, preview, style, travel, notifications and real-use operations remain outside this slice. Keep product decisions D-03/D-07/D-12/D-13 with their owners.
5. Before issuing any separately authorized durable-code brief, verify that the scoped candidate and review still match. Carry their references and P1–P8 into the brief. Hold any newly included behavior until its design questions are answered. There is no new CLI gate enforcing this checkpoint.

This package grants no application-build, infrastructure, publication, real-guest or email authority. Applying documentation and authorizing implementation are separate actions.

## Evidence and limits

The consumer's stage status and advance dry-run still report the completed research lifecycle. They do not assess this new design. Their compact results are saved as [status](stage-status.json) and [dry-run](stage-advance.json). No `advance --execute` was run.

[Checks](checks.json) verify the source hashes, local references, and the frozen files against both current and archived copies. The source files and recorded research stage are unchanged. Vendor guidance was fetched in-session; [fetch records](vendor-sources.json) distinguish the direct-fetch failure for PostgREST from the successful web-source read.

The reviewers were separate read-only workers. Operator selected a model and effort, but its runtime receipts did not report either field; the actual model/effort remains unverified. This is independent agent review, not human acceptance or a blinded experiment. No database, application, browser behavior, performance, hosted configuration, backup or restore check ran.

Reopen the design if implementation tests contradict its transaction/permission assumptions, if contention makes the wedding lock impractical, or if the selected scope expands. Stop shared-tooling work unless real adoption demonstrates a repeatable gap that the existing handoff and manual review cannot cover.
