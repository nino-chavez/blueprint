# Blueprint steering-layer experiment

This root-only prototype evaluates the recipe layer above Blueprint's semantic
kernel. It does not change `template/`, the public CLI, or any consumer.

The authored packet contains exact claims, journeys, incidents, dispositions,
and operator touches. `blueprint-steering/0` remains valid.
`blueprint-steering/1` adds an explicit execution route for every active human
and decision claim. `blueprint-steering/2` adds bounded decision delegations:
an autonomous decision route is valid only when a satisfied human authorization
claim, decision class, effects, prohibitions, exact decision record, completed
disposition, and exercise receipt agree. It cannot turn a human claim into
agent evidence. Machine work defaults to the current harness. The generated
result provides:

- next actions with owner, authority, venue, artifact, capture, pause, and
  resume semantics;
- encounter readiness and deterministic blockers;
- repeated-incident cluster detection;
- an active claim view plus historical summary;
- operator-touch budget state;
- one deterministic next recipe; and
- longitudinal burden metrics.

It never issues a receipt, changes a claim, spends human attention, or mutates a
consumer.

The execution boundary distinguishes three questions that otherwise collapse
into a murky “operator gate”:

1. Is the claim ready to be tested?
2. Who is authorized to perform the next action, and where?
3. Must the current task pause, or can autonomous work continue?

A route mode is one of `agent-autonomous`, `operator-inline`,
`operator-external`, or `external-actor`. A handoff exists only for a selected
non-autonomous action. A ready human claim marked non-blocking does not
interrupt remaining autonomous work.

## Run

```sh
node research/refoundation/steering-layer/steering.mjs \
  --input=research/refoundation/steering-layer/fixtures/self-dogfood-initial.json \
  --json=research/refoundation/steering-layer/generated/self-dogfood-initial.json \
  --markdown=research/refoundation/steering-layer/generated/self-dogfood-initial.md
```

Generated files are disposable and ignored. Edit the packet, not the result.

Run the complete fixture and adversarial suite:

```sh
node research/refoundation/steering-layer/test-steering.mjs
```

The experiment and its fixed expected outcomes were preregistered in
`00-preregistration.md` before `steering.mjs` existed. The headless
execution-boundary follow-up was separately frozen in
`02-headless-execution-preregistration.md` before its implementation.

The original fixture-scale results are recorded in `01-results.md`; the
headless execution follow-up is recorded in
`03-headless-execution-results.md`; and the one-boundary-at-a-time follow-up is
recorded in `05-actionable-frontier-results.md`. Version 2 is preregistered in
the root `23-adaptive-pilot-promotion-preregistration.md` and evaluated in
`24-adaptive-pilot-promotion-results.md`. Decision 09 retains it as root
research while holding public promotion. The retrospective SE Docs Front Door
JSONL pilot is preregistered in
`06-se-docs-session-pilot-preregistration.md` and reported in
`07-se-docs-session-pilot-results.md`. Its in-progress snapshot is reconciled
against the completed consumer state in
`08-se-docs-completed-state-reconciliation.md`. Generated files remain
disposable; neither the results nor the evaluator are part of the stampable
methodology.
