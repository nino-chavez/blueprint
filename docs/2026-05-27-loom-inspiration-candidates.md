---
status: candidates-pending-validation
---

# Loom-Inspiration Candidates — Modality Bridging for Blueprint

**Date**: 2026-05-27

**Trigger**: Operator (Nino) recorded a ~20-minute Loom walking colleagues through the promo-initiative portal — the first dogfood of Blueprint produced end-to-end (research → decisions → strategy → prototype screens → CICD + provenance layer over Claude session JSONL). The act of reaching for Loom *on top of* the portal — instead of just sharing the portal URL — is the dogfood signal: the portal alone doesn't onboard a colleague; it answers questions for someone already asking them.

**Status**: Operator-synthesis candidates, pre-promotion. No methodology wave is authored from this doc until at least one consumer files `METHODOLOGY-AMENDMENTS.md` entries against the candidates below. Promotion convention at `template/docs/methodology/methodology-amendments-convention.md`.

## The reframe that anchors the analysis

Loom's AI capabilities are not "video editing made easier." They solve **modality bridging** — a single rich source (the recording) gets transformed into multiple structured views (transcript, chapters, summary, action items, doc draft) because different consumers need different views of the same content. That pattern transfers to Blueprint because Blueprint also produces a single rich source (the portal-plus-provenance) that today only supports one consumption mode: walk the portal yourself. The Loom inspirations below are all "build the generator that produces a new view from artifacts that already exist" — except candidate 5, which is structurally different.

## Source signals

- Loom recording 2026-05-27, ~20 minutes, walking promo-initiative portal. Transcript captured in session conversation 2026-05-27. Notable artifact: the transcript contains a dead-zone at 04:27-05:37 where "Thank you so much for joining me today" repeats — Loom's own modality has friction the operator didn't catch in-flight.
- promo-initiative portal output — first end-to-end dogfood of Blueprint per wave 17 reference-sessions entry. Repo not on local disk under `~/Workspace/dev/` as of 2026-05-27.
- Existing wave-log evidence: wave 17 (promo-initiative dogfood as canonical first-run reference), wave 21 (Stage S-A documents how non-pipeline capability stages get placed), wave 22 (traceability-sweep pattern — same "generate structured views from rich artifact" family), wave 23 (register-asymmetry — methodology grew past one-sitting reading).

## Candidate inspirations (triaged by leverage)

### Candidate 1 — Operator-handoff pattern [PROMOTED wave 25, 2026-05-27]

**Originally framed as**: "stage-bridge summaries" — auto-generated digests at every stage gate.

**Loom analog**: AI action-item extraction (translate 20 minutes of talking into 3 things to do).

**Blueprint analog (refined by audit)**: a template + canonical shape for operator-written handoffs at three transition types — stage transitions, session restarts, cross-repo dispatches. The audit refined scope from "stage-bridge specifically" to "operator-context broadly" because the consumer evidence supports the broader frame.

**Promotion evidence (2026-05-27 audit)**: two consumers independently produced hand-written HANDOFF docs with overlapping structure within the same week — rally-hq's `blueprint/HANDOFF-blueprint-template-gaps.md` (2026-05-25, cross-repo dispatch) + subs-initiative' `HANDOFF.md` (2026-05-06, session restart). Common shape: state header → what's-live → what's-done → what's-pending → sequencing → local refs/secrets → out-of-scope.

**Promotion shape (wave 25)**: new canonical doc `docs/operator-handoff-pattern.md` + new template subdir `template/methodology/handoff/` (with `README.md` + `handoff-template.md`) matching the existing `template/methodology/{design,voice}/` convention. No reviewer gate — both consumer examples are *successful* voluntary handoffs; the audit didn't surface failure-mode evidence to justify forcing a Stage N→N+1 reviewer. A future amendment can add the reviewer when ≥2 consumers report stage-transition failures attributable to missing handoffs.

### Candidate 2 — Drift reports as generative output [PROMOTED wave 24, 2026-05-27]

**Loom analog**: AI generates docs from video — modality translation from rich-but-unstructured to structured-and-referenceable.

**Blueprint analog**: extend wave 22's `prototype-vs-production-traceability-sweep` so output is *generative* (drafts an amendment, drafts a `strategy.shipped` correction) rather than *diagnostic* (lists issues).

**Why this is sharpening, not new**: wave 22 established the sweep cadence and 4-link chain. The Loom inspiration reinforces that the next iteration bridges modality — from "list of drift" to "draft amendment ready for review."

**Promotion evidence (2026-05-27 audit)**: three distinct drift surfaces across two consumers — rally-hq wave 22 sweep (diagnostic baseline) + rally-hq waves 14-16 audit-chrome (LAG/CUSTOMIZATION-OR-ROT classification, generative-output-shaped) + subs-initiative `tools/state-derive/` (TypeScript capability catalogs + check primitives → `_state.json`; built independently in May 2026 to solve the same audit-decay problem). The third piece — a built reference implementation already in production at a sibling consumer — accelerated the promotion past the watch-and-wait threshold the candidates doc originally specified.

**Promotion shape (wave 24)**: extended `docs/prototype-vs-production-traceability-sweep.md` § "Generative output formats (wave 24)" with: per-verdict draft-artifact template + the subs-initiative `state-derive` pattern as canonical companion + activation order for two-layer consumers. Reference implementation: `template/tools/state-derive/` (lifted at commit `780932b`; engine + check primitives + renderers, with subs-initiative's catalog stripped out — consumers add their own `catalog/*.ts` files).

### Candidate 3 — Methodology onboarding digests [PROMOTED wave 26, 2026-05-27]

**Loom analog**: chapters + summary — solve the wall-of-content problem.

**Blueprint analog**: auto-generated "what changed in the last N waves" + filter-by-keyword digests pulled from the wave log.

**Why real**: wave 23 already flagged the register-asymmetry problem. The wave log + reviewer prompt set is ~1500 lines for a new contributor. Wave 23's fix was front-matter framing; wave 26 adds the filter tool.

**Promotion evidence (2026-05-27 audit)**: wave 23 self-evidence (methodology grew past one-sitting reading; wave 23 fix addressed register but not wall-of-content) + rally-hq's 738-line onboarding burden (`blueprint/CLAUDE.md` 332 + `STATE.md` 406). subs-initiative does NOT exhibit C3 friction (`CLAUDE.md` only 48 lines) — promotion accepted on single-consumer + methodology-as-consumer evidence per this doc's "borderline" verdict.

**Promotion shape (wave 26)**: new canonical doc `docs/wave-log-digest-pattern.md` + new tool subdir `template/tools/wave-digest/` with `README.md` + `digest.mjs` (small Node script, no dependencies, ~60 lines — parses `## Wave log` section of any CLAUDE.md, filters by `--since=N` and/or `--keyword=<regex>`, emits markdown). Tool scope deliberately narrow: deterministic filter only; no LLM, no semantic summary, no "what's load-bearing for surface X" feature. Defers richer features to second-consumer evidence under the same gating discipline waves 24-25 applied. Composes with wave 23's front matter (front matter sets reading register; tool surfaces relevant subset).

### Candidate 4 — Amendment classification [PROMOTED wave 27, 2026-05-27 — doc-only; tool defer-and-buy]

**Loom analog**: AI categorization of action items.

**Blueprint analog**: 4-bucket taxonomy (consumer-local / template / reviewer / methodology) + decision tree + manual→automated flip criteria.

**Why defer was reconsidered**: extended audit (2026-05-27) found blueprint-redesign's `WAVE-2-BACKLOG.md:76` explicitly names the triage convention as a methodology gap and forecasts "10+ amendments next cycle." Manual bucketing already in practice across rally-hq + blueprint-redesign METHODOLOGY-AMENDMENTS files. Two-consumer evidence with operator-named promotion-bar met the wave-promotion threshold even at modest absolute volume.

**Promotion shape (wave 27)**: doc-only — new canonical doc `docs/amendment-classification-pattern.md` documents the taxonomy + decision tree + manual→automated flip criteria. Tool defer to second-consumer adoption of automated triage; build-when-triggered path is GitHub Copilot SDK shipped as a GitHub Action (per market-comparison C4 verdict — matches per-developer pricing model; closed-taxonomy SaaS options don't fit). Doc includes the tool sketch for the future build.

### Candidate 5 — Multi-operator collaboration pattern [PROMOTED wave 28, 2026-05-27 — doc-only; substrate deferred to platform-feature dogfood]

**Loom analog**: comment-on-this-specific-thing async — timestamped comments on a shared artifact.

**Blueprint analog**: pattern doc naming three sub-patterns (attribution-loss / cross-context-confusion / parallel-work-workaround) + deferred architectural shape (inline annotations on portal sections → structured bubble-up to AMENDMENTS via wave 27's 4-bucket taxonomy).

**Why this is the only candidate that scales across operators**: candidates 1-4 scale operator work *within* a session. This one scales work *across* operators.

**Promotion evidence (2026-05-27 extended audit)**: three consumers across three distinct sub-patterns — rally-hq `0c074d5` commit-attribution loss + blueprint-redesign wrong-directory amendment + portal/CONVENTIONS.md peer-canonical-contamination + blog pilot success-criterion #3 explicitly naming parallel-work failure mode. The three-consumer threshold exceeded the candidates-doc's "1 strong consumer" borderline verdict.

**Promotion shape (wave 28)**: doc-only — substrate deferred. New canonical doc `docs/multi-operator-collab-pattern.md` names the pattern, the sub-patterns, the deferred architectural shape, and three lightweight conventions consumers can adopt today (per-repo role declaration, worktree isolation per parallel agent, no-workaround success criterion). Substrate build (annotation surface + routing + identity layer) deferred because it expands Blueprint into auth/identity/persistence scope — real-product-scope, not methodology-scope. Three named substrate-promotion criteria documented; none met today.

## Video-script generation angle (secondary, raised mid-conversation)

The conversation 2026-05-27 raised a second angle — could Blueprint generate walkthrough videos. The honest shape:

**Script generation, not audio generation.** Blueprint generates a walkthrough script keyed to portal sections — opening framing, journey context (pulled from wave log + prescription), then section-by-section narration cues with timestamps. Operator records audio against the script. Blueprint indexes the resulting transcript back into the provenance RAG (so the Loom-transcript becomes a substrate input alongside the existing chat-shaped JSONL).

**Why this beats full TTS auto-narration**: operator voice carries tone the auto-script doesn't ("I started thinking about the hackathon" — Loom transcript 06:50 — lands differently than auto-script reading the same words). Operator bandwidth cost drops from "what do I cover when" to "press record." Full TTS is the wrong direction because it loses the only thing the walkthrough has over the portal — voice.

**Dogfood test**: does Blueprint shipping a "stakeholder-walkthrough" workflow template (Loom's "AI Workflows" pattern, applied to Blueprint) reduce the next Loom recording from 20 minutes to 5? If yes, real. If still 20 minutes because script-gen can't capture journey-framing nuance, value concentrates in the indexing-back step (Loom-transcript → provenance RAG) — kill the script-generation and ship just the indexer.

**Status**: same consumer-validation gate before promotion. The dogfood test above is what would justify a wave.

## Cross-cutting observation

Candidates 1, 2, 3, and the video-script angle are all the same architectural pattern — **artifacts already exist; build the generator that produces the new view from them.** Candidate 5 is structurally different because it requires accepting input back into the artifact — the only candidate carrying genuinely new-direction risk.

If only one candidate gets exercised first, candidate 1 has the highest leverage-to-risk ratio because the stage-transition friction is repeatable (every consumer hits it at every stage gate), the source material is already structured (existing stage artifacts), and the output shape is familiar Blueprint surface (reviewer + template artifact). Candidate 5 has the highest absolute leverage if it works but carries the highest risk of scope expansion that pulls Blueprint into adjacent-product territory.

## What this doc is and is not

- **Is**: operator synthesis from a self-dogfood (Loom-as-fillgap signal); source for future consumer-amendment validation; reading list for the operator the next time a consumer hits modality-bridging friction.
- **Is not**: a methodology wave; not promoted; no reviewer enforcement; no schema field; no Stage gate. Promotion happens only after consumer evidence per `template/docs/methodology/methodology-amendments-convention.md`.

## Next step

Watch for these patterns in incoming `METHODOLOGY-AMENDMENTS.md` entries across consumers. When a consumer entry maps onto one of the candidates above, link it from this doc. When 2+ consumers map to the same candidate, promotion is justified — author the wave at that point, not before.
