# Blueprint compact cold-author packet

You are the independent author in a usability observation. Work only from this
packet and the files under `research/refoundation/cold-author/fixture/`. Do not
read the compact compiler, its existing fixtures, refoundation reports, or a
completed submission from another author.

Your job is to author a compact Blueprint contract for the scenario below,
predict the evaluator's exact states, and run the sealed scorer. You may repair
your own submission after a scorer failure; record every attempt. Do not ask the
methodology creator to repair or reinterpret the contract.

## Scenario

The initiative is `cold-author-reporter`. A single intrinsic operator owns and
builds a repository-local inventory reporter.

- The implementation artifact is
  `research/refoundation/cold-author/fixture/reporter.mjs`.
- The operator ran the reporter manually against the current checkout at
  `2026-07-22T15:00:00Z` and observed the declared inventory output.
- The operator attempted to observe the daily scheduled delivery at
  `2026-07-22T15:10:00Z`, but the fixture has no scheduler credentials, so the
  scheduled run could not be executed or observed.
- Artifact presence proves only presence. The manual run proves only the manual
  operator task. Neither proves scheduled delivery.

Use charter revision `1`, evaluation time `2026-07-22T16:00:00Z`, operator id
`operator`, profile `operator-builder`, and governing scope
`{product_mode: intrinsic-operator-tool, environment: cold-author-fixture}`.

Author exactly these claims:

- `reporter-artifact-present`: the declared reporter implementation artifact
  exists; evidence profile `file`, source path as above.
- `manual-report-observed`: the intrinsic operator runs the reporter manually
  and observes the declared inventory output; evidence profile `observed-task`,
  actor `operator`, freshness `current`, and dependency on
  `reporter-artifact-present`.
- `scheduled-report-arrives`: the intrinsic operator receives the inventory
  report in the daily delivery window; evidence profile `live-scheduled-run`,
  actor `operator`, freshness `current`, scope `{schedule: daily-window}`, and
  dependency on `manual-report-observed`.

Record the two encounter receipts described above. Use the exact oracle bound
by each claim's evidence profile. For the unavailable scheduled run, use result
`could-not-observe`; do not turn absence of credentials into support or
contradiction. Use observer role `operator`, source version `current`, and a
short de-identified source description.

Author these checkpoints:

- `manual-operation-proven` requires the artifact and manual-run claims.
- `scheduled-operation-proven` requires the scheduled-delivery claim.

Author one `ongoing-operation` module activated by the scheduled-delivery
claim.

## Compact syntax reference

The contract begins:

```yaml
schema: blueprint-compact/0
profiles: k1-research-0
initiative: your-safe-slug
as_of: 2026-07-22T16:00:00Z
operator: operator
```

The supported shapes needed here are:

```yaml
charter:
  revision: 1
  intent: A falsifiable sentence naming the initiative's purpose.
  scope: {key: value}

actors:
  - {id: operator, profile: operator-builder}

claims:
  - id: safe-claim-id
    says: A scoped, falsifiable statement.
    actor: operator        # only for actor-bound evidence
    evidence: file         # file | observed-task | live-scheduled-run
    source: relative/path  # required by file
    fresh: current         # use when required by the scenario
    scope: {key: value}    # optional claim-specific scope
    needs: [other-claim]   # optional dependencies

receipts:
  - id: safe-receipt-id
    claim: safe-claim-id
    result: supports       # supports | contradicts | could-not-observe
    via: observed-task-run
    observer: operator
    role: operator
    source_version: current
    at: 2026-07-22T15:00:00Z
    observation: What was actually observed or could not be observed.
    source: de-identified encounter record

checkpoints:
  - {id: checkpoint-id, requires: [claim-id]}

modules:
  - {id: module-id, claims: [claim-id]}
```

Evidence profiles own their object, oracle, observer contract, and governing
scope. A receipt adds encounter facts; it cannot redefine those fields. The
`observed-task` oracle is `observed-task-run`. The `live-scheduled-run` oracle
is `observed-scheduled-run`.

## Deliverables

Create only these authored files:

- `research/refoundation/cold-author/submission/submission.yml`
- `research/refoundation/cold-author/submission/explanation.md`
- `research/refoundation/cold-author/submission/session.json`

In `explanation.md`, predict every claim and checkpoint state and explain why
the evidence is compatible or insufficient. Explicitly explain why the manual
run cannot satisfy scheduled delivery.

In `session.json`, record valid ISO timestamps for `started_at` and
`finished_at`, integer `attempts`, an array `questions_asked`, an array
`assumptions`, and `methodology_creator_interventions: 0` if none occurred.

Run:

```sh
node research/refoundation/cold-author/score-cold-author.mjs
```

The observation passes only when the scorer reports `PASS`. Do not inspect or
modify the scorer.
