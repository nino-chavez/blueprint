# Decision 0012 — repair first-run real-footage entry

Status: accepted for the next product candidate after the first native founder
encounter contradicted `founder-live-workflow`.

## Context

At product revision `83d85fc`, first-run setup presented a disabled-looking
**Use my footage** card. The maintainer reasonably treated it as the footage
chooser and reported that they could not click it to select footage.

Source and live UI inspection showed that the card did not select footage. It
only focused the required Archive folder field and wrote a setup-precondition
message. Camera-card selection was available later in Ingest. The operator did
not reach Ingest, so native receipt
`founder-live-workflow-blocked-at-footage-entry-20260723` correctly contradicts
the founder workflow.

## Decision

Replace the ambiguous two-state link with one visibly operable,
keyboard-accessible control:

- before setup, label it **Set up for my footage**;
- state directly that archive and finished-work locations are chosen below and
  camera-card footage is selected later in Ingest;
- on activation, move the setup fields into view, focus Archive folder, and
  announce the next action in the existing live status region; and
- after valid setup is saved, relabel it **Use my footage** and navigate to
  `/?start=ingest`.

Do not open a camera-card picker before setup, invent default external
locations, or hide the archive/finished-work distinction.

## Evidence and candidate boundary

All existing package, visual, launch, and founder receipts remain bound to
exact product revision `83d85fc`. This decision creates a new product candidate;
none of those receipts may satisfy it merely because the repository HEAD
changed.

The repair requires:

- source-contract assertions for labels, helper copy, focus, announcement, and
  ready navigation;
- an executed pre-setup browser encounter;
- an executed ready-state browser encounter;
- keyboard and visible-focus preservation;
- current first-run visual recapture if rendered copy/layout changes;
- release-stage and rendered-data/CSP checks; and
- explicit candidate identity before any new package or founder receipt.

## Rollback

Revert only the candidate's setup, test, current visual-evidence, and this
decision changes. Keep the contradictory founder receipt and exact 83d evidence
in history. Rolling back product code does not retract the failed encounter.
