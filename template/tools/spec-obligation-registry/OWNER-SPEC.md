---
tool: spec-obligation-registry
last_attested: 2026-06-25
max_unattested_days: 90
couples_with:
  - template/docs/methodology/proof-obligation-registry-pattern.md
  - template/docs/methodology/dod-verification-ladder-pattern.md
convention_version: 1
---

# Owner-spec: spec-obligation-registry (portable)

## Purpose

The portable proof-obligation registry. Generalizes the DoD verification ladder from
five fixed gates to N obligations, each `claim → universe-source → oracle/tier →
cadence → freshness`. Thin and declarative: the `OBLIGATIONS` data is the contract; the
per-obligation lints are the engines; a `prove` front-end (if built) is a VIEW that
routes and composes only. Pattern: `proof-obligation-registry-pattern.md`.

Ships seeded with the **five ladder gates** (project-agnostic) plus a commented
instance-1 example. A consumer adapts the scope/engine paths and appends the obligations
its own spec implies.

## The contract this tool enforces

`validateRegistry` (a CI gate, `tsx index.ts validate`) fails when an obligation violates
the three-axis structural contract — THE LAW: *a proof's evidence must come from a source
the claim does not control.*

1. **Rigged denominator** — `universeSource.enumeratedFrom` required; an `active`
   obligation may not have `completenessAttestedBy: none-yet`.
2. **Too-weak oracle** — `oracle.tier` explicit; a mechanical oracle above presence must
   `bindToProducer`.
3. **Oracle self-reference** — a `grep_present` oracle must declare a four-guard
   `SourceGrepBinding` (source-scoped · producer-bound · per-artifact · no-attest-escape).

## Inputs / outputs

- **Input:** the in-module `OBLIGATIONS` array.
- **`validate`** (default): exit 0 + summary, or exit 1 + per-violation lines.
- **`list`:** the registry-as-table (markdown) — the seed of a `prove` view.
- **Pure core:** `validateObligation`, `validateRegistry`, `renderTable` — unit-tested.

## Danger zones

- **A new obligation with a vague universe.** The validator requires a concrete
  `enumeratedFrom`; it cannot judge whether the source is genuinely *complete* — that is
  `completenessAttestedBy`. Do not set `mechanical-derive` unless the set is fully derived
  from ground truth (T3 is not mechanically provable; see the pattern doc).
- **Relaxing the four-guard binding to make a grep pass** reintroduces the exact
  false-greens the law exists to kill. Fix the evidence source, not the guard.
- **The registry never originates a verdict.** A `prove` front-end must return UNPROVABLE
  when no oracle is registered — never an LLM judgment dressed as proof.

## Maintainer playbook

- **Add an obligation:** append to `OBLIGATIONS` with a real `enumeratedFrom`; for a
  `grep_present` oracle declare the full binding; run `npm test`.
- **Adopt instance-1:** uncomment the requirement-completeness example, point it at your
  authored-block format + lint, flip `status` to `active`.
- **Re-attest:** confirm the obligations still describe the consumer's reality; bump
  `last_attested`.
