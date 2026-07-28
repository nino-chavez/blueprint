---
status: preregistered-before-rerun
date: 2026-07-27
supersedes_for_cold_author_clearance: 01-results.md
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
packet: AUTHOR-PACKET-v2.md
---

# Variant-transition cold-author rerun — boundary-receipt preregistration

## Why a rerun is required

The first fixture observation passed its 18 mechanical checks, but retained no
independent pre-access evidence that its author was context-cold or received
only the permitted materials. Its self-reported zero creator interventions is
not a substitute for that boundary evidence. It remains fixture CLI usability
evidence and cannot be retrospectively relabelled as cold-author clearance.

## Frozen rerun boundary

Before the author receives any material, a facilitator who is not the author
must create and retain one immutable boundary receipt. It must contain a new
opaque `observation_id`, a deidentified `author_id`, the exact candidate
revision and executable/package SHA-256, SHA-256 values for
`AUTHOR-PACKET-v2.md`, the captured candidate help output, and every supplied
fixture-baseline file, and an issuance time recorded before delivery.

The receipt must enumerate the complete allowed-material set: the v2 packet,
the hash-identified help capture, the hash-identified disposable fixture, and
the candidate executable needed to run that help. The facilitator must attest
that the author received a fresh, non-forked context; had no prior
candidate/repository/history access; had no source, tests, research, prior
submission/receipt, or scorer access; and had no methodology-creator contact
before or during the observation. It must name the facilitator's identity or
accountable role and state that it was written before access.

The facilitator prepares and hashes the disposable Git fixture before issuing
the receipt. The author receives no material until after that receipt is
written. The fixture remains unregistered and is never a consumer or pilot.

## Required scorer boundary checks

The rerun scorer must reject a missing, malformed, or post-access boundary
receipt. It must verify the receipt's observation ID against the author session,
verify its issuance time precedes the session start, and recompute and match
every recorded candidate, packet, help, and fixture SHA-256 before evaluating
the author outputs. It retains the verified boundary receipt and its check
result with the rerun score.

The author must also retain the exact JSON outputs as
`cold-author-plan.json` and `cold-author-apply.json`. The session must disclose
`command_attempts`, with one record per invocation containing the exact command,
operation (`plan` or `apply`), exit code, and output path. A PASS requires
exactly the disclosed successful plan and apply attempts: both exit 0, the plan
ID in the apply output matching the plan output, and the receipt binding the
decision path and SHA-256. The scorer must verify these transcript bindings;
session self-report alone is insufficient.

## Same task and ceiling

The author performs the same v1 task: create the valid initiative-local
transition decision, dry-run, apply with the exact plan ID, and record the
session and explanation. A PASS requires the ordinary task checks and the
boundary checks above.

Only a passing rerun can clear **continued cold-author success**. It is still
fixture-only usability evidence: it does not establish an external pilot or
intent, prospective external transition or rollback, delayed preservation,
support operation, release/Wave authorization, or freeze clearance.
