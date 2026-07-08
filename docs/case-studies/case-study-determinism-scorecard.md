# Case Study — Blueprint against the determinism taxonomy (the "goodbye slop" scorecard)

> Provenance: prompted by David Khourshid's talk *"Beyond the Prompt — Goodbye
> slop; welcome determinism"* (AG Grid, London, 2026-06-26,
> https://www.youtube.com/watch?v=uMvTAF280so). The talk named — in sharper
> vocabulary than the methodology used — the architecture Blueprint had already
> converged on, and a taxonomy of failure modes worth scoring Blueprint against.
> The **stage-orchestration** slice of that analysis became [ADR-0008](../decisions/ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md)
> (the `blueprint stage` machine, waves 80–83). This doc captures the *rest* of
> the analysis — the full scorecard + a skill-by-skill control-flow audit — per
> the repo's own "promote rationale, not just code" rule, so the finding has a
> durable home instead of living only in a session transcript.

## The convergence, stated once

Khourshid's thesis: move **non-determinism to the edges** and **determinism to
the core** — write "programs that call LLMs," not "LLMs that call programs." A
*model* (states, events, transitions; the "given/when/then" of behaviour) is the
explicit representation the agent works against; a missing model is a "missing
blueprint." Model the **confusing parts only** — "modeling is not ceremony when
it replaces confusion," but it *is* ceremony when it doesn't.

Blueprint arrived at the same place from its own first principle — *agent
struggle is a missing capability; encode it into the repo as a lint / doc / gate,
never a better prompt*. This is not borrowed framing; it is convergent design,
and the evidence is in-tree (the triage state machine, the variant pipelines, the
reviewer gates). The value of the talk is the **vocabulary** it lends for scoring
where Blueprint already stood — and the one gap it exposed (stage sequencing),
now closed by ADR-0008.

## Failure-mode scorecard

Each row is one failure mode the talk names, and where Blueprint stands — graded
honestly, with the mechanism that earns the grade.

| Failure mode (talk) | Blueprint stance | Grade |
|---|---|---|
| **One-shotting** (prompt → result, no iteration) | The pipeline *is* staged iteration; Stage 4 is an explicit reproduce → hypothesise → fix → re-run convergence loop. ADR-0008 now makes the stage progression a gated machine, not a hoped sequence. | Addressed |
| **Prose control flow** ("skills that say do step 1, 2, 3, and hope the agent follows") | The subtle one — see the skill audit below. The skills *read* as step-1-2-3 prose, but the load-bearing control flow (what **blocks**) is mechanical: reviewer gates, the stage model, `doctor`. Khourshid's critique bites on *unenforced* prose; Blueprint's prose is node-guidance backed by gates. The genuine exception was **stage sequencing** — prose-only until ADR-0008 — now a machine. | Addressed (was the one real gap) |
| **Agents as the system** ("throw more agents at it → chaos without constraint") | `dispatch` requires ≥2 artifacts with **named, non-overlapping** file scopes and no mid-flight synthesis; `hive` is gated behind a contention litmus (`docs/governance/team-roles-and-conventions.md`), not adopted by reflex. Structured fan-out, not agent soup. | Addressed |
| **Entangled concerns** ("mix everything to get the job done") | Separation is structural: each stage has distinct deliverables + its own gate; evidence (`research/`, `decisions/`) is split from scaffolding (`portal/`); the `template/` substrate is walled from the root self-application. | Addressed |
| **Larger context ≠ more structure** | Blueprint's answer to "the agent doesn't know X" is never "shove X into context" — it is *encode X as a repo invariant* (a reviewer, a hook, a doc the SessionStart hook injects). Structure over context is the first principle restated. | Addressed |
| **Compounding slop** (agents fill gaps with wrong assumptions, amplified) | The anti-slop machinery is mechanical: `stateful-claim-lint`, `doc-currency-reviewer`, `defrag-reviewer`, the fact-check loop. The first principle — encode the missing capability — *is* the slop brake. | Addressed |
| **Missing model = missing blueprint** | Literally the name. `blueprint.yml` + the stage model (ADR-0008) + the four variant pipelines are the explicit, inspectable model both human and agent read. | Addressed (by construction) |

The scorecard's honest summary: Blueprint was already strong on six of seven, and
the seventh (prose stage sequencing) is what ADR-0008 fixed. This is not a to-do
list — it is confirmation that the methodology's first principle and the talk's
thesis are the same idea, plus the receipts.

## The skill audit — which "step 1, 2, 3" is hidden control flow?

The sharp question the talk raises: Blueprint has nine `blueprint-*` skills that
encode numbered steps. Are they the "prose control flow" Khourshid warns against —
sequences the agent is *hoped* to follow — and should they be promoted to models?

The test applied to each: **is this hidden control flow (promote to a model), or
fuzzy node-work whose determinism is already extracted to a gate (correctly stays
prose)?**

| Skill | Shape | Verdict |
|---|---|---|
| **triage** | Discrete classification: each feedback item → one category × commitment-weight × disposition, with defined state transitions. | **Already a state machine** — and correctly so. A discrete-decision domain is exactly what a state machine fits. It is the proof the promotion is possible when the domain warrants it. |
| **validate** | A genuine convergence **loop** (Phase 0 mechanical gates → build loops → reproduce → hypothesise → fix at root → re-run until converged). | **Closest remaining candidate, but already extracted.** The loop's determinism lives in `fact-check-loop-reviewer` (the Stage-4 orchestrator) + the Phase-0 mechanical gates; the prose that remains is fuzzy diagnostic *reasoning* (hypothesise the root cause), which is node-work that must stay non-deterministic. Modeling it further would model the fuzzy part — the ceremony Khourshid warns against. |
| **research** | Five research *dimensions* to cover (current-state, competitive, analogous, synthesis) — order-independent, exploratory. | **Correctly prose.** Generative/exploratory node-work. The determinism (which sub-deliverables must exist) is already the Stage-1 gate (`research-completeness-reviewer` + the stage model's per-leg gates). |
| **prototype** | Clone → customise → build pages → wire — plus a quality-gate block. | **Correctly prose.** The build is fuzzy (design, per-slice variation — "start rough, iterate," which the talk explicitly says stays non-deterministic). The gates are already extracted to the portal-conformance reviewers + `prototype-smoke-runner`. |
| **docs** | Read config → generate docs → audit → package (md→HTML/Word) → copy. | **Correctly prose.** Doc *writing* is fuzzy node-work; the deterministic packaging is already a script (`template/docs/scripts/md-to-docs.mjs`), and the audit is a gate (`doc-quality-auditor`). |

### The finding

The audit does **not** produce a backlog of skills to convert to state machines.
It produces a structural observation:

**Blueprint's skill layer already separates the two things the talk says to
separate.** The deterministic control flow — *which stage is next, what must
exist before it, what blocks* — was extracted long ago into reviewers, the stage
model, `doctor`, and scripts. What remains in the skill prose is the fuzzy
node-work — research, design, drafting, diagnostic reasoning — which is exactly
what should stay non-deterministic. The numbered steps read *like* control flow
but are node-guidance; the enforced control flow is mechanical.

Two calibration points prove the discipline was applied, not lucked into:
- **triage** was promoted to a full state machine — because its domain is
  discrete classification, which warrants one.
- **research / prototype / docs** were *not* — because promoting them would model
  generative work, the "ceremony that doesn't replace confusion."

The one place the separation had *not* been made — stage sequencing lived only in
`METHODOLOGY.md` prose and was hoped, not gated — is precisely what ADR-0008
closed. That the analysis surfaced exactly one real gap, in the one place the
determinism had never been extracted, is the strongest evidence the rest of the
methodology already had the boundary right.

## What was acted on, and what was deliberately left

- **Acted on:** stage sequencing → `blueprint stage status|advance`, the four
  variant models, `--execute` state recording, the `doctor` stage-model gate
  (ADR-0008, waves 80–83).
- **Deliberately not acted on:** converting research / prototype / docs / validate
  to state machines. Per "model the confusing parts only," these are node-work
  with their determinism already gated; further modeling would be ceremony. This
  is a decision, recorded here so a future session doesn't re-open it as a "gap."

## See also

- [ADR-0008](../decisions/ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md) — the stage-orchestration slice this analysis produced.
- `METHODOLOGY.md` § First Principle — the convergent origin of the same idea.
- `docs/variant-selection.md` — the four pipelines the stage models encode.
