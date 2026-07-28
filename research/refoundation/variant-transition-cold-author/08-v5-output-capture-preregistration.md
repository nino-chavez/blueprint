---
status: preregistered-before-v5-author-access
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
packet: AUTHOR-PACKET-v5.md
---

# Variant-transition cold-author v5 — output-capture preregistration

## Observed defect

The v4 author successfully planned, repeated the same plan only to persist its
JSON, then applied. The author disclosed all three attempts. The 24/27 failure
is retained in `07-v4-results.md`.

This finding is bounded to the observation packet: it required exact retained
JSON but showed invocations without a capture mechanism. It does not yet justify
a new public CLI output-file option.

## Prospective correction

Before v5 author access, the packet will show the exact plan and apply command
forms with shell redirection to `cold-author-plan.json` and
`cold-author-apply.json`. It will tell the author to read the captured plan ID
from the first file and use it in the one apply invocation.

The scorer will require exactly two disclosed candidate invocations:

1. one successful plan command redirected to `cold-author-plan.json`; and
2. one successful apply command redirected to `cold-author-apply.json`, bound
   to that plan ID.

No candidate CLI, public help, transition behavior, decision schema, fixture,
or pass criterion changes.

## Fresh boundary and ceiling

The v5 observation requires a fresh author context, new deidentified author
binding, observation ID, disposable Git fixture, and pre-access boundary
receipt. No earlier author, fixture, or output may be reused.

A clean sealed PASS may clear only `continued cold-author success`. It does not
establish an external transition, rollback, delayed preservation, public
support readiness, release/Wave authority, or migration-freeze clearance.

The resulting claim is limited to the **guided packet/candidate workflow**. It
does not show that bare CLI help is sufficient or that an author independently
discovers output-capture mechanics. The v4 result remains the evidence of that
instruction gap.
