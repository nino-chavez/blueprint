# Variant-transition cold-author packet — v5

The repository operator explicitly authorized this observation and the local
writes required by this packet, but only inside the supplied disposable fixture.
That authority does not permit writes to the frozen candidate checkout,
Blueprint repository, any consumer, or any network/publishing/release surface.

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

From the fixture root, replace `<candidate-executable>` below with the supplied
absolute executable path. Run the plan exactly once and capture that first
invocation's JSON. Both output files are initially absent:

```sh
node <candidate-executable> variant transition --to=research --transition-decision=decisions/variant-transition.json --json > cold-author-plan.json
```

Read the exact `planId` from `cold-author-plan.json`, replace `<plan-id>` below,
then run apply exactly once and capture its JSON:

```sh
node <candidate-executable> variant transition --to=research --transition-decision=decisions/variant-transition.json --apply --plan-id=<plan-id> --json > cold-author-apply.json
```

Do not run cleanup or rollback. Do not modify or delete the fixture's existing
authored research or decision sentinels.

## Record the observation

Create `cold-author-session.json` with the facilitator-supplied
`observation_id`, ISO-8601 `started_at`/`finished_at`, integer `attempts`, arrays
`questions_asked` and `assumptions`, and integer
`methodology_creator_interventions` (`0` means none). Record every candidate
invocation, question, assumption, and intervention truthfully.

The redirected files are the required `cold-author-plan.json` and
`cold-author-apply.json`. Add `command_attempts` to the session: one object per
candidate invocation with the exact command including redirection, operation
(`plan` or `apply`), integer `exit_code`, and `output_path`. Set `attempts` to
the number of entries in `command_attempts`. The plan and apply IDs must match.
Do not omit a failed or repaired invocation.

Reading the saved plan file is not another candidate invocation and must not
rerun the plan.

Create `cold-author-explanation.md` identifying the exact plan ID and explaining:

- what the operation preserved;
- what it created;
- that cleanup is operator-review-only and whether cleanup or rollback ran; and
- why the accountable party, rollback route, and receipt review point belong to
  this transition rather than a standing Blueprint support role.

Do not inspect or modify the evaluator or scorer.
