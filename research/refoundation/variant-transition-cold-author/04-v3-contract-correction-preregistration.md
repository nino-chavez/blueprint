---
status: preregistered-before-v3-author-access
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
packet: AUTHOR-PACKET-v3.md
---

# Variant-transition cold-author v3 — packet/scorer correction preregistration

## Reason

The sealed v2 observation remains a 25/27 failure. Its packet did not carry
forward two author-facing details from the original preregistration even though
the scorer retained them. No v2 author artifact will be repaired, supplemented,
or rescored into a pass.

## Prospective correction

Before a new author receives any material:

1. the packet will define `methodology_creator_interventions` as an integer
   count, with `0` meaning none;
2. the packet will explicitly require the explanation to distinguish automatic
   preservation/creation from operator-review-only cleanup and state whether
   cleanup or rollback was executed; and
3. the scorer will report those requirements semantically and test the numeric
   session representation it instructed.

The operational task, frozen candidate, fixture baseline, decision schema,
command-attempt boundary, preservation checks, and promotion ceiling do not
change.

## Freshness and pass rule

The v3 run requires a new author in a fresh non-forked context, new deidentified
author binding, new observation ID, new disposable Git fixture, new pre-access
boundary receipt, and new raw outputs. The v2 author and transitioned fixture
must not be reused.

A PASS requires all sealed boundary and operational checks plus a complete
session and explanation under the corrected packet. A failure remains evidence
and is not repaired in place.

Only a clean v3 PASS can clear `continued cold-author success`. It cannot clear
the prospective external transition, prospective external rollback, delayed
preservation, release/Wave, or migration-freeze gates.

