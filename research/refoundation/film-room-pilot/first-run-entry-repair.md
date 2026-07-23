# Film Room first-run real-footage entry repair

Status: superseded after exact `e1c21d9` failed its restarted founder
encounter. Failure preserved at `5ec5398`; native-Ingest successor product
`5cc4fd2` subsequently failed at manual operator configuration, preserved at
`0cd7aef`. Operator-onboarding successor product `5496edd` and semantic tip
`a370647` have reached running analysis in a fresh native encounter; founder
completion remains open.

## Failure

At exact product revision `83d85fc`, the maintainer interpreted the first-run
**Use my footage** card as the footage chooser and could not use it. The element
looked disabled and, while setup was incomplete, its click behavior only
focused the archive field and wrote a precondition message. The actual
camera-card chooser existed later in Ingest.

The operator did not reach Ingest. This is a product encounter failure, not an
instruction error and not a receipt that can be corrected away.

## Repair contract

Create a new product candidate with these behaviors:

1. Before setup is complete, the second activation card is an enabled,
   keyboard-operable control labeled **Set up for my footage**.
2. Its supporting copy says that archive and finished-work locations are chosen
   below and that the camera-card folder is selected later in Ingest.
3. Activation moves the setup fields into view, focuses **Archive folder**, and
   announces the exact next action in the existing live status region.
4. After valid setup is saved, the same control becomes **Use my footage** and
   navigates directly to `/?start=ingest`.
5. No pre-setup control pretends to select camera footage. No terminal path,
   hidden automatic choice, or default external folder is introduced.

## Required proof

- source contract asserts the pre-setup and ready labels, helper copy, focus
  target, status message, and ready navigation;
- an executed browser encounter clicks the pre-setup control and observes
  visible movement/focus plus the status message;
- an executed ready-state encounter activates the same control and lands in
  Ingest;
- keyboard activation and visible focus remain intact;
- current first-run visual evidence is recaptured if the card copy or layout
  changes;
- release-stage, rendered-data/CSP, and relevant package tests remain green;
  and
- no historical 83d receipt is rebound to the new candidate.

## Evidence transition

The six existing native receipts remain bound to exact product revision
`83d85fc`. The first product-fix commit creates a new candidate identity. Add
new candidate-specific claims or advance the active candidate claim only after
the product commit exists; old receipts must then derive stale or remain scoped
to 83d.

Do not issue a new founder support receipt until the maintainer begins again
from the repaired first-run candidate. Agent/browser verification may satisfy
only its declared tool or UI-contract claim.

## Stop conditions

Stop rather than calling the repair complete if:

- the pre-setup control still appears disabled;
- its action is only an invisible focus change;
- camera-card selection remains ambiguously conflated with archive location;
- ready-state navigation does not land in Ingest;
- the visual baseline is refreshed without a candidate-bound receipt; or
- any old package or founder receipt becomes compatible with the new product
  revision through a moving `current` placeholder.
