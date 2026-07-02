---
canonical: true
pattern: handoff-corpus
status: proven
proven_in: bc-subscriptions (2026-07-01..02)
---

# Handoff-Corpus Pattern

Generate the third-party handoff — the document set a colleague, agency, or
acquirer reads to **evaluate, take over, or extend** a system cold — from two
inputs, gated by human-ratified attestations, instead of hand-writing docs that
rot or shipping the build harness as if it were the deliverable.

## Why this pattern exists

Two failure modes, both observed empirically in the proving project:

1. **The harness is not the handoff.** A blueprint-run project accumulates
   world-class *construction-control* artifacts — gate ladders, coverage
   matrices, provenance lints. Recipients don't want the anti-drift harness;
   they want a faithful *account*: what was this meant to be, what is it
   actually, where's the gap, how do I work with it. Surfacing the control
   system as the deliverable buries the account under process vocabulary
   ("dark," "COMPLIANT," "G4-pass") that actively misleads outsiders.
2. **Generated docs confabulate; hand-written docs rot.** A code-scanning
   generator cannot recover intent, rationale, or the honest delta — and the
   repo's own artifacts mislead it (a superseded adapter *looks* canonical;
   a green gate *looks* like live proof). Pure hand-writing captures those but
   drifts the moment reality moves.

The pattern splits the difference: **generate from two inputs**, where the
second input carries exactly the knowledge generation cannot derive.

## The two-input model

```
Input-A: the code, read fresh at generation time (mechanism, seams, config)
Input-B: a per-domain file a human co-authors — intent, rationale,
         typed deltas, and two ATTESTATIONS (below)
        └────────────── generation prompt ──────────────┘
                              ↓
            one recipient-facing page per capability domain
```

- **Domain = a capability a recipient reasons about** ("dunning", "the charge
  rail") — never a file, epic, or team boundary.
- Every page follows a **four-move arc**: what it's for (intent + load-bearing
  decisions + THE invariant, stated first) → how it actually works → where
  intent and reality diverge → how to operate & extend.
- Voice is instructional-design-governed (cognitive-load minimization: one
  mode per block, bottom-line-up-front, chunk over run-on; diagrams are
  transcluded from canonical derived sources, never redrawn).

## The delta vocabulary

The divergence section is the pattern's differentiator — the thing no status
dashboard produces. Every divergence is **typed**; an untyped "verified" hides
which kind of gap it is:

1. **Verified-but-incomplete** — core path passes; an affordance is unfinished.
2. **Dependency-gated** — "verified" is conditional on an external capability.
3. **Built-but-untrodden** — reachable branch the defaults never exercise.
4. **Named-deferred** — recorded in a decision as out-of-phase; not implemented.
5. **Contract-verified, not live-verified** — gates pass against a stub; type
   each *seam*, and check the live test hits the canonical path, not a
   same-named edge path.
6. **Superseded-framing residue** — an artifact from a model a later decision
   corrected; still real *and* a trap; name canonical vs residual.

## The attestation gate — trace first, human ratifies

Generation is **blocked per domain** until two attestations exist. Each is a
mandatory *tracing procedure* that produces the claim; the human confirms or
refutes it (the process originates, the human ratifies — where trace and
recollection disagree, the trace wins and the disagreement is investigated):

1. **Canonical-framing** — which artifact is canonical, which is residual,
   citing the deciding decision record. Procedure: read the deciding decision
   before any framing claim; never infer the design from code presence. When
   no deciding record exists, the human authors the framing and files the
   missing record (that gap is itself a finding).
2. **Live-state** — what has actually run/been observed live. Procedure: trace
   to running reality (what a config selects, what an outbound call targets,
   what production data recorded); never infer from a decision doc, a test's
   name, or memory; absence claims need exhaustive search including env-gated
   tests.

Why this design: a blind-model experiment (cold agents re-authoring proven
pages) showed *instructed* agents following these two procedures avoid both
trap classes unaided, while unsteered agents — and once, the operator's own
recollection — fell into them. The scarce ingredient is authority, not
derivation; the deliberate cost is that generation never runs fully unattended.

## What this pattern ships (consumer shape)

- `docs/handoff-corpus/` — the corpus: `README.md` (lifecycle), `_input-b/`
  (template + per-domain files), generated `<domain>.md` pages.
- A generation prompt (paste-in for a fresh agent) enforcing: read order
  (contract → voice → Input-B → code), the attested hard gate, trace
  discipline, diagram transclusion with provenance, and a lint acceptance gate.
- A mechanical linter (structure, delta-type enum, attestation completeness +
  freshness) — the *semantic* half (voice, citation quality) stays with
  human/agent review.
- Archaeology/ingest wiring if the consumer indexes doc corpora.

## Lifecycle

author Input-B (traced) → operator ratifies (draft → attested) → generate →
lint → **re-attest + regenerate when the architecture, its deciding decisions,
or the traced live-state change**. Pages carry `as_of_commit`; staleness is
visible, not silent.

## Evidence (worked example)

bc-subscriptions, 2026-07-01..02: two hand-authored specimens (state-machine
domain + external-integration domain) → ratified contract
(`docs/methodology/handoff-corpus-input-spec.md`) → pipeline (template, lint,
prompt) → first two generated pages. The first cold generation caught two real
Input-B/code divergences via the trace discipline (an "implemented but not
registry-reachable" adapter; a non-uniform diagram sign-off vocabulary) and
returned pipeline feedback that was folded in the same day. The contract's
attestation design was itself corrected mid-arc by the trace-beats-recollection
evidence (five recollection-vs-trace conflicts, all resolved in the trace's
favor, during the payments audit).

## Activation criteria

Adopt when a project needs to hand knowledge to a party who wasn't in the
room — vendor onboarding, acquisition diligence, team rotation — and the
existing doc surface is either the build harness or a rotting wiki. Skip for
single-maintainer projects with no transfer horizon, or where the recipient is
the author (the corpus's value is exactly the gap between author-memory and
traced reality).

## Cross-reference

- Consumer canonical files: `bc-subscriptions/docs/methodology/`
  (`handoff-corpus-input-spec.md`, `voice-guides/handoff-voice.md`,
  `prompts/handoff-generation.md`, the two `handoff-specimen-*.md` exemplars)
  and `bc-subscriptions/tools/handoff-lint/`.
- Sibling patterns: doc-surface-discipline (which surface owns what),
  archaeology-substrate (corpus indexing), amendment-classification (where
  fixes land).
