# Blueprint steering-layer experiment

This root-only prototype evaluates the recipe layer above Blueprint's semantic
kernel. It does not change `template/`, the public CLI, or any consumer.

The authored `blueprint-steering/0` packet contains exact claims, journeys,
incidents, dispositions, and operator touches. The generated result provides:

- encounter readiness and deterministic blockers;
- repeated-incident cluster detection;
- an active claim view plus historical summary;
- operator-touch budget state;
- one deterministic next recipe; and
- longitudinal burden metrics.

It never issues a receipt, changes a claim, spends human attention, or mutates a
consumer.

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
`00-preregistration.md` before `steering.mjs` existed.

The completed fixture-scale results and distribution disposition are recorded
in `01-results.md`. Generated files remain disposable; neither the results nor
the evaluator are part of the stampable methodology.
