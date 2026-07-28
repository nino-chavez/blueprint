---
status: preregistered-before-v4-author-access
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
packet: AUTHOR-PACKET-v4.md
---

# Variant-transition cold-author v4 — execution-authority preregistration

The v3 observation was blocked before attempt 1 because its fresh delegated
context did not carry trusted authority for fixture-local writes.

Before v4 author access, the hashed author packet will state that the repository
operator authorized the observation and its writes only inside the named
disposable fixture. That authority does not extend to the candidate checkout,
Blueprint repository, consumers, network, publication, merge, or release.

The v4 run requires a new author context, deidentified author binding,
observation ID, disposable Git fixture, and pre-access boundary receipt. It
retains the v3 session schema, explanation requirements, frozen candidate,
allowed materials, task, checks, and promotion ceiling. The blocked v3 author
and fixture are not reused.

