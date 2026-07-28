# Variant-transition cold-author packet — rerun

You are the independent author in observation `<observation_id>`, supplied by
the facilitator before you begin. Record that exact ID in your session file.
Work only from this packet, the supplied hash-identified candidate CLI help and
executable, and the disposable fixture. Do not read candidate repository source,
tests, research, existing transition receipts, prior observation history, or a
scorer. Do not ask the methodology creator to repair or reinterpret the work.

## Task

The fixture is a greenfield Blueprint initiative whose real deliverable is now
a research decision. Prepare and apply its preservation-first transition to
`research`.

Create `decisions/variant-transition.json` in this exact shape, choosing
truthful fixture-local values:

```json
{
  "schema": "blueprint-variant-transition-decision/1",
  "accountable_party": "<person or role responsible for this transition>",
  "rollback_route": "<how this fixture's transition decision is routed for rollback>",
  "receipt_review_at": "YYYY-MM-DD",
  "acknowledged": true
}
```

From the fixture root, dry-run then apply with the plan ID returned by that same
dry-run:

```sh
blueprint variant transition --to=research --transition-decision=decisions/variant-transition.json --json
blueprint variant transition --to=research --transition-decision=decisions/variant-transition.json --apply --plan-id=<exact dry-run plan ID> --json
```

Do not run cleanup or rollback. Do not modify or delete the fixture's existing
authored research or decision sentinels.

## Record the observation

Create `cold-author-session.json` with `observation_id`, ISO-8601
`started_at`/`finished_at`, integer `attempts`, arrays `questions_asked` and
`assumptions`, and `methodology_creator_interventions`. Record every attempt,
question, assumption, and intervention truthfully.

Preserve the dry-run JSON as `cold-author-plan.json` and the apply JSON as
`cold-author-apply.json`. Add `command_attempts` to the session: one object per
invocation with `command`, `operation` (`plan` or `apply`), `exit_code`, and
`output_path`. The plan and apply IDs must match. Do not omit a failed or
repaired attempt.

Create `cold-author-explanation.md` identifying the exact plan ID, what was
preserved versus created, and why the accountable party, rollback route, and
receipt review point belong to this transition rather than a standing Blueprint
support role. Do not inspect or modify the evaluator or scorer.
