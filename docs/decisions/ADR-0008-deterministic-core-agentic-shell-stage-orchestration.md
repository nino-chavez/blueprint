---
canonical: true
adr: 0008
status: accepted
date: 2026-07-07
deciders: ["Nino Chavez"]
ratification: "explicitly ratified by operator 2026-07-07 ('ratify it'); rollout (a)+(b) status command + (c1) config-driven model shipped in wave 80 (46f7eaf); (c2) advance --execute follows"
scope_ceiling: "A — methodology-native only (state derives from artifacts-on-disk; no external substrate)"
informs: ../../decisions/01-prescription.md
depends_on:
  - ../../decisions/00-charter.md
  - ./ADR-0007-versioning-distribution-toolchain.md
references:
  - "external: David Khourshid, 'Beyond the Prompt — Goodbye slop; welcome determinism', AG Grid (London, 2026-06-26), https://www.youtube.com/watch?v=uMvTAF280so"
  - "internal: template/tools/lib/stage-model.mjs + `blueprint stage status` — the deterministic-core derivation this ADR is grounded in (reproduces the 11/14 finding via `blueprint stage status --json`)"
  - "internal precedent: blueprint-triage skill (an already-complete, explicit state machine)"
  - "../../METHODOLOGY.md § The Pipeline (greenfield variant) — the prose control flow this ADR promotes to executable"
---

# ADR-0008 — Deterministic core / agentic shell for stage orchestration

> **Authored in the self-application; shipped across waves 80–81 on ratification (2026-07-07).** This is
> a methodology change (a new `blueprint stage` command + a stage model that ships to consumers).
> The fleet was audited before touching `template/` (no consumer mid-migration — 3 behind, 10
> unpinned, none picking up an update), so the methodology-freeze is not tripped. Live: `blueprint
> stage status` (wave 80), `stage advance` with the entry-guard + `--execute` state recording to
> `.blueprint/stage-state.json` (wave 81), and the midstream/brownfield/research models
> auto-selected from `blueprint.yml` `variant:` (wave 82). Remaining: STATE.md retirement + a doctor
> model-conformance check (e). Lands under a wave with the freeze acknowledgment per the charter.

Status: **accepted** (operator go 2026-07-07) — grounded in a run of the derivability probe against this repo.

## Context

An external talk (Khourshid, AG Grid 2026-06) named, in sharper vocabulary than the methodology
currently uses, the exact architecture Blueprint converged on from its own first principle — and
also named the gap Blueprint has not yet closed. Both halves are load-bearing here.

**The convergence is real, not coincidental.** Blueprint's founding principle — "agent struggle is
a missing capability; encode it into the repo as a lint / doc / skill / agent / **stage gate**, never
a better prompt" (`METHODOLOGY.md` § First Principle) — is the same move as the talk's thesis: *make
the core logic explicit; a missing model of the codebase is a missing blueprint; the model is for
your agents.* The evidence in-tree:

- The **`blueprint-triage` skill is already a complete, explicit state machine** — categories ×
  commitment-weight × states with defined transitions (`needs-review → {scoped-in, deferred, answered,
  wontfix, clarified, logged}`). It is the best-modeled sub-domain in the system, precisely because
  someone forced the model.
- **Variant selection** (`greenfield | midstream | brownfield | research`) selects between four stage
  sequences with distinct gates — state-machine *selection* by a config field.
- Real deterministic guards already execute: `stamp.mjs` mechanicalCheck, `doctor` (12 checks), 17
  executable reviewers, and the `worktree-guard` / `frontmatter-lint` / `terminology-linter` /
  `cited-url-lint` hooks.

**The gap is the stage spine itself.** In the talk's two-app taxonomy — "LLMs that call programs"
vs. "programs that call LLMs" — Blueprint today is mostly the former for *sequencing*: the agent
reads `METHODOLOGY.md` and decides which stage it is in, whether the stage is done, and when to run
the guards. That is the talk's named **"prose control flow"** failure mode ("if your skills say do
step 1, step 2, step 3, you're representing control flow in natural language and hoping the agent
follows it"). Confirmed mechanically: the CLI surface is `init / review / cost / upgrade / fleet /
doctor / hive` — all point-checks, **no stage-sequencer**; and `template/STATE.md` is a
hand-maintained status doc whose own header admits it drifts ("three drift surfaces, none
authoritative"). The guards are real but advisory-until-invoked — "a sprinkling of deterministic
tools on an agent-driven flow," the shape the talk (quoting Ken Wheeler) calls a fool's errand.

**Why this matters for THIS product specifically.** The `blueprint-platform` pilot's stated pain
point (`blueprint.yml` pilot_profile) is verbatim: adoption *"stalls at 'read METHODOLOGY.md and
hope.'"* "Read the markdown and hope the agent follows the stages" **is** prose control flow. For a
solo operator it works because the operator *is* the deterministic core — they hold stage state in
their head and run gates by hand. The platform's entire reason to exist is to remove that operator
from the loop (multi-operator, multi-agent, unsupervised). At that point the hoped-for spine is gone
and the gates rot. This ADR closes the platform's central productization gap.

**Grounded in evidence, not theory.** The derivation (now shipping as
`template/tools/lib/stage-model.mjs`, surfaced by `blueprint stage status`) reads stage state
purely from artifacts-on-disk + `blueprint.yml`. Run against this repo (`blueprint stage status`):

```
derivability: 11/14 gates machine-derivable, 3/14 need assertion
```

The 3 non-derivable gates are exactly the fuzzy edges — *sensor actually drives the app*, *claims
actually re-derived against source*, *deployed URL actually reachable*. Those are the "agentic
shell." The 11 derivable gates (pilot profile present, research artifacts + sibling scan, portal
shell, validation report, ADR count, deploy config, feedback + triage) are the "deterministic core"
a program can own. **~79% of the stage-gate state is already legible from disk** — the precondition
for the inversion is met.

The first cut also exposed a design question a real machine must answer: a naive "furthest stage
whose gates all pass" cursor reported Stage 7 even though Stage 2's gate failed, because it scored
stages independently. The shipped lib fixes this — the main pipeline is a **linear spine** (the
cursor is the highest N with *every* stage ≤ N passing; `blueprint stage status` now correctly
reports Stage 1 here and names Stage 2 as next-to-work), while capability stages (`S-A`, `S-B`) run
**in parallel**, gated independently by yml flags and outside the main cursor. That Stage 2 miss is
itself a live instance of the cost noted below: a naive presence-scan gate false-negatives, so gate
authoring is real work, not a freebie.

## Decision

Adopt **deterministic core / agentic shell** as the stage-orchestration architecture. Concretely:

1. **Explicit stage model.** Promote the stage pipeline from `METHODOLOGY.md` prose into a declared
   `stages:` model (in `blueprint.yml` or a canonical stage-model file the yml references). Each
   stage declares entry/exit **gates**; each gate is classified `derivable: true | false`. Derivable
   gates are checked mechanically; non-derivable gates require a recorded assertion (see #3). This is
   the "model" in the talk's sense — structured, natural-language-friendly, and the single artifact
   both program and agent read.

2. **`blueprint stage {status, advance}` — the deterministic core.**
   - `status` derives current state from artifacts-on-disk + the stage model and reports it (the
     probe, promoted from report-only to a first-class CLI command).
   - `advance` runs the target stage's entry-guard as a **hard gate**: all derivable gates must PASS,
     and each non-derivable gate must have a recorded assertion. Only then does it dispatch the stage
     skill/agent as the **node executor**. On completion it runs the exit-guard.
   - This is the inversion: from "the LLM decides it is done" to "the program requires the gate to
     pass, then calls the LLM."

3. **Non-derivable gates stay at the edges — but the assertion is recorded, not hoped.** The 3
   fuzzy gates do not become code. Instead, `advance` blocks until an explicit assertion exists —
   from the operator, or from a named reviewer agent (e.g. Stage 4's "claims verified" is asserted by
   the validate loop, not by presence of a report file). "Hope the agent did it" becomes "the
   transition is blocked until evidence of it exists." The assertion lands in a machine-read state
   file, replacing the drift-prone hand-maintained `STATE.md` for this slice.

4. **State semantics: linear spine + parallel capability tracks.** The main pipeline is a strict
   chain — the cursor is the highest N such that *all* stages ≤ N pass their gates (reject the
   naive "furthest independent pass" the probe demonstrated). Capability stages (`S-A`, `S-B`) are
   independent, gated by their `blueprint.yml` flags, and do not advance the main cursor.

5. **Scope discipline — model the confusing parts only.** Per the talk's own caveat ("you don't have
   to model everything formally, only the confusing parts") and the operator's over-engineering red
   line: only the stage **spine + gate-closing** becomes deterministic. The fuzzy node work — writing
   research, drafting the prototype, judging feedback — stays LLM and stays non-deterministic. The
   `blueprint-triage` state machine is the precedent and the proof this does not read as ceremony.

## Why not the alternatives

- **Status quo (prose control flow).** Rejected: it is the named failure mode. It survives on
  solo-Nino only because the operator is the missing deterministic core — the exact dependency the
  platform exists to remove.
- **A full workflow engine (XState / Temporal / BPMN).** Rejected as over-engineering for a
  document pipeline whose state is *already derivable from disk* (probe: 11/14). A thin derive-and-gate
  command suffices. Named escalation: adopt a real engine only if stage state stops being
  disk-derivable (e.g. long-running async human-in-the-loop steps that need durable timers). The
  irony is noted and accepted — the talk's author builds XState; the honest reading of his own
  "model the confusing parts only" caveat is that a linear doc pipeline is not confusing enough to
  warrant one.
- **More context / better skill prose / more reviewers.** Rejected: "more context does not mean more
  structure." Reviewers are the *guards*, not the *sequencer*; adding guards does not close a
  control-flow gap.

## Consequences

**Positive.** Multi-operator initiatives get a defensible, mechanical answer to "what stage am I in
and may I advance" that does not rest on an agent's self-attestation (the failure mode
`METHODOLOGY.md` § Stage 4 already calls out). Advisory guards become blocking transitions. The
platform's central pilot pain gets a concrete fix rather than more documentation.

**Cost.** Gates must be authored per stage, with the same care as reviewers — the probe's Stage 2
false-negative (a naive presence-scan missed the design-principles artifact) shows a sloppy gate is
worse than none. The stage model must be back-filled into `blueprint.yml` and kept in step with the
variant taxonomy (four sequences, not one). `doctor` should gain a check that the declared stage
model matches the reviewers/hooks actually wired.

**Freeze / rollout.** This ships to consumers (`template/` + `bin/`), so it lands under a wave with
the freeze acknowledgment. Sequencing:
- **(a) ratify this ADR** — DONE (operator go 2026-07-07).
- **(b) `blueprint stage status`** (read-only, zero blast radius) — SHIPPED: `template/tools/lib/stage-model.mjs` + the `stage` subcommand; lib self-test green; `doctor` unaffected.
- **(c1) config-driven model** — SHIPPED (wave 80): declarative model + `stage_model:` select in `blueprint.yml`; **(c2) `advance` entry-guard + `--execute`** — SHIPPED (wave 81, corrected in the same wave's review-fix): dry-run by default, records to `.blueprint/stage-state.json`, `--assert-<gate>` confirms shell gates; a recorded assertion satisfies a non-derivable gate but never a derivable one the disk contradicts. **Two cursors, because the domain has two:** `artifactCursor` = how far the disk artifacts reach (derivable gates only); `cursor` = the confirmed position (all gates, shell gates via recorded assertion) — the one `advance` moves. Completeness folds *all* gates (the first cut checked only derivable ones, making `advance` unsatisfiable on the shipped model — caught in review); `advance` targets the fixed frontier and records incrementally.
- **(d) other three variants** — SHIPPED (wave 82): declarative `midstream` / `brownfield` / `research` models encoded from `docs/variant-selection.md` (§ Stage shapes + sub-deliverables). `loadStageModel` now follows the declared `blueprint.yml` `variant:` when no explicit `stage_model:` is set (one declaration, not two). Added an `any-exists` check kind (sub-deliverable dir populated / portal-or-prototype shell) and an `optional` gate flag (brownfield's optional prototype, research's iterate never wedge the cursor). Research starts at Inputs Intake (no sensor — there's no app).
- **(e) STATE.md retirement + doctor conformance** — SHIPPED (wave 83): `template/STATE.md`'s tiered-usage table gains a "Stage / pipeline position" row pointing at `blueprint stage status` (the machine owns the cursor; hand-maintaining "we're at Stage N" drifts). New `doctor` **stage-model** check (12th) — the declared `variant:`/`stage_model:` must resolve to a real model and derive without error; a misdeclared `variant: midstreem` that silently falls back to greenfield is a first-class WARN, not an invisible wrong-pipeline. The program owns the guard.

**Rollout complete — (a) through (e) all shipped (waves 80–83).**

**Calibration (wave 84, 2026-07-08).** Running `blueprint stage status` against the seven local
consumers found the gates derived a sensible cursor for **0/7** — the self-tests + synthetic fixtures
had been circular (shaped to match the gates). Four layout-mismatch classes were fixed (greenfield
subdir bug; `blueprint/`-nested roots; `pilot_profile` made optional; leg-name divergence). This
**reversed** the wave-82 per-leg-AND-by-canonical-name decision — no real initiative uses the
canonical leg names, so a layout-tolerant `research-legs` gate replaced it, with the reviewer still
owning "the right legs." The deeper finding: real initiatives complete stages **non-contiguously**
(the linear spine under-reports; a `stagesComplete` coverage metric now reports alongside it). The
strict-vs-tolerant fork was an operator decision, resolved to tolerant on the 0/7 evidence.

Shipped in waves 80–81 (46f7eaf, f41a1d9, c698198 pushed; wave 81 this commit).
