# V2 root shadow

This is the reversible prototype authorized by
`research/refoundation/10-architecture-options.md`.

It reads the root self-application's current `actor-output.yml`, executes the
current actor-output gate, doctor, and stage derivation, and builds a normalized
K1 candidate. Only exact current tool observations become receipts. Output
lifecycle, actor evidence, stage completion, and simulated interim proof are not
promoted to product/outcome evidence.

Run:

```sh
node research/refoundation/v2-shadow/shadow-root.mjs
node research/refoundation/k1/validate-k1.mjs --selftest
```

Generated files live in `generated/` and may be deleted and rebuilt. The
explicit `root-overlay.json` supplies only information the current manifests do
not safely encode at K1 precision: governing intent/scope, actor authority and
kinds, proof-grade adapter profiles, exact tool claims, checkpoints, and module
activation.

This prototype does not edit `template/`, current manifests, consumers, or
release metadata. It is not a public v2 schema.

## Read-only consumer shadows

The same isolated K1 evaluator can project a consumer checkout through a
sanitized overlay without writing to that checkout:

```sh
node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/consumer-overlays/film-room.json \
  --root=/path/to/film-room
```

The three research overlays cover different boundaries:

- `film-room.json` adapts the current actor-output contract and its structured
  assurance receipts;
- `fleet-observability.json` tests an intrinsic solo-operator initiative with
  implementation artifacts but no durable operation receipt; and
- `bc-subscriptions.json` tests source-version freshness, behavior-state
  evidence, and a team-handoff boundary.

Generated consumer projections and reports live under `generated/consumers/`.
The reports and overlays use de-identified actor aliases and contain no
absolute consumer paths. They are research evidence, not consumer state and
not a proposed public authoring format.

## Compact authoring experiment

The `compact/*.yml` files test a smaller author-facing contract. The research
compiler expands named actor/evidence profiles, explicit authority deltas,
checkpoints, and conditional modules into the same shadow overlay:

```sh
node research/refoundation/v2-shadow/compile-compact.mjs \
  --source=research/refoundation/v2-shadow/compact/film-room.yml \
  --output=research/refoundation/v2-shadow/generated/compact-overlays/film-room.json

node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/generated/compact-overlays/film-room.json \
  --root=/path/to/film-room \
  --output-label=film-room-compact

node research/refoundation/v2-shadow/compare-compact.mjs
```

The comparison requires exact equality across charter intent/scope/authority,
claim statements and evidence contracts, normalized receipt semantics,
dispositions, checkpoints, modules, and every derived state. It excludes only
compiler provenance and receipt IDs. This remains research syntax; it has no
stability or migration promise.

Compact sources pin `profiles: k1-research-0`; actor and evidence profiles are
versioned policy, not inferred roles. A native receipt reuses its claim's
object and scope and must explicitly name result, matching oracle (`via`),
observer, role, source version when required, observation time, observation,
and provenance source. See `compact/fixtures/receipt-positive.yml`.

Receipt history is append-only. An authorized `correct-receipt` disposition
can retract an erroneous receipt from current evaluation only when its actor
holds that exact authority and the disposition supplies a same-claim
replacement or invalidates the affected claim. The original record remains
visible. See `compact/fixtures/correction-positive.yml`.

Run the compiler hardening suite:

```sh
node research/refoundation/v2-shadow/test-compact.mjs
```

It proves a native receipt can satisfy its exact claim, rejects unsafe actor,
authority, path, dependency, oracle, and independence cases with source-line
diagnostics, verifies byte-deterministic deletion/rebuild, and enforces that
generated public research output contains no absolute user paths.

## Root compact dogfood

Blueprint's self-application has a compact root contract at
`blueprint-native.yml`. It was promoted from the proven research copy after the
independent cold-author gate passed. Current legacy files remain bounded
compatibility/configuration inputs:

```sh
node research/refoundation/v2-shadow/shadow-root.mjs
node research/refoundation/v2-shadow/compile-compact.mjs \
  --source=blueprint-native.yml \
  --output=research/refoundation/v2-shadow/generated/compact-overlays/blueprint-self.json
node research/refoundation/v2-shadow/shadow-consumer.mjs \
  --overlay=research/refoundation/v2-shadow/generated/compact-overlays/blueprint-self.json \
  --root=. \
  --output-label=blueprint-self-compact
node research/refoundation/v2-shadow/compare-root-compact.mjs
```

The comparison retains the root charter, actor authority, claim/evidence
contracts, receipt semantics, checkpoints, modules, and all derived states. It
normalizes only generated receipt IDs and the different concrete encodings of
the current dirty-checkout fingerprint.

## Independent cold-author gate

The sealed exercise lives in `research/refoundation/cold-author/`. A fresh
author receives only `AUTHOR-PACKET.md` and its fixture, creates the three
declared submission files, and runs:

```sh
node research/refoundation/cold-author/score-cold-author.mjs
```

The scorer was harness-tested against a temporary known-good submission and
reset. A separate context-cold author then passed 34/34 with a new 55-line
submission in two attempts, zero questions, and zero methodology-creator
interventions. The durable result is `generated/cold-author-score.md`.
