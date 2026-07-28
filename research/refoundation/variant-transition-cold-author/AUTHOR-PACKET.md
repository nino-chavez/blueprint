# Variant-transition cold-author packet

You are the independent author in a bounded usability observation. Work only
from this packet, the supplied candidate CLI help, and the disposable fixture.
Do not read the candidate repository source, tests, research, existing
transition receipts, prior observation history, or a scorer. Do not ask the
methodology creator to repair or reinterpret the work.

## Task

The fixture is a greenfield Blueprint initiative whose real deliverable is now
a research decision. Prepare and apply its preservation-first transition to the
`research` variant.

Before applying, create `decisions/variant-transition.json` exactly in this
shape, choosing truthful fixture-local values:

```json
{
  "schema": "blueprint-variant-transition-decision/1",
  "accountable_party": "<person or role responsible for this transition>",
  "rollback_route": "<how this fixture's transition decision is routed for rollback>",
  "receipt_review_at": "YYYY-MM-DD",
  "acknowledged": true
}
```

Then run these operations from the disposable fixture root, using the supplied
candidate CLI:

```sh
blueprint variant transition --to=research --transition-decision=decisions/variant-transition.json --json
blueprint variant transition --to=research --transition-decision=decisions/variant-transition.json --apply --plan-id=<exact plan ID from the dry run> --json
```

Do not run cleanup or rollback. The task is to use the transition surface, not
to decide whether a real external initiative should migrate.

## Preserve the authored evidence

The fixture already contains authored research and a decision. They are
sentinels: do not modify or delete them. The transition may add its own
scaffolding and receipt, but it must preserve collisions with those authored
files.

## Record the observation

Create `cold-author-session.json` with this shape:

```json
{
  "started_at": "ISO-8601 timestamp",
  "finished_at": "ISO-8601 timestamp",
  "attempts": 1,
  "questions_asked": [],
  "assumptions": [],
  "methodology_creator_interventions": 0
}
```

Record every command attempt, question, assumption, and creator intervention
truthfully. Create `cold-author-explanation.md` that identifies the exact plan
ID, explains what was preserved versus created, and explains why the declared
accountable party, rollback route, and receipt review point are specific to
this transition rather than a standing Blueprint support role.

The observation is complete only when the evaluator can inspect your three
authored outputs, the dry-run/apply output, and the resulting receipt. Do not
inspect or modify any evaluator or scorer.
