---
status: preregistered-before-author-observation
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
candidate_command: blueprint variant transition
fixture: fixture-baseline
---

# Variant-transition cold-author observation — preregistration

## Question

Can a context-cold author, using only the exact candidate command help, this
packet, and a disposable greenfield fixture, create the required initiative
transition decision and carry out the documented preservation-first transition
without methodology-creator intervention?

This tests authoring usability of the candidate boundary. It does not test
whether a real initiative should change variants.

## Frozen materials and boundary

The candidate is exactly commit
`d372a63ee31433b720f066e81f3ab17fe2c5a7fa`. The observation facilitator must
copy `fixture-baseline/` into a new disposable Git repository before the author
begins, record that fixture's initial commit, and provide the author only:

1. `AUTHOR-PACKET.md`;
2. the exact candidate's `blueprint variant --help` and
   `blueprint variant transition --help` output; and
3. the disposable fixture.

The author must not read the candidate repository source, tests, research,
existing transition receipts, prior observation history, or any scorer. They
must not receive creator chat, repair, interpretation, or intervention. They
may run the documented candidate CLI against the disposable fixture and may
repair their own submitted files after a command failure, recording every
attempt.

The fixture is not a registered consumer, is not a proxy for an external
initiative, and must never be added to `consumers.yml`.

## Required author outputs

The author creates only:

- `decisions/variant-transition.json`;
- `cold-author-session.json`; and
- `cold-author-explanation.md`.

They must run one dry-run plan, capture its exact content-addressed plan ID,
then apply using that exact ID. The session record supplies the start and finish
times, attempts, questions, assumptions, and methodology-creator intervention
count. The explanation states the preservation boundary, expected authored-file
collision, created transition evidence, and the meaning of the declared
rollback route and review point.

## Pass criteria

The observation passes only when an independent evaluator confirms all of the
following at the frozen candidate revision:

1. the author was context-cold under the boundary above and records zero
   methodology-creator interventions;
2. the decision is valid `blueprint-variant-transition-decision/1`, with a
   nonempty accountable party and rollback route, a real calendar-date receipt
   review point, and `acknowledged: true`;
3. the dry-run succeeds and its decision hash and plan ID are recorded;
4. apply succeeds only with that exact plan ID and retains the decision in its
   append-only receipt;
5. the fixture's pre-authored research and decision sentinels remain preserved;
6. the session record is complete and every self-repair attempt is disclosed;
   and
7. the explanation distinguishes automated preservation/creation from
   operator-review-only cleanup and does not claim an external migration.

A command failure, question, intervention, altered packet/fixture, or an
unrecorded repair is an observation result, not material to hide or repair by
the methodology creator.

## Promotion ceiling

A passing observation can clear only the variant-transition candidate's
**continued cold-author success** gate. It is fixture-only usability evidence.
It does not establish an external pilot, a re-chartered initiative's intent, a
prospective external rollback, delayed preservation, support operation,
release/Wave authorization, or migration-freeze clearance. The capability
remains a candidate until those separately required gates have their own
evidence.
