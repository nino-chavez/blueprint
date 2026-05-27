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

### Candidate 1 — Stage-bridge summaries [highest leverage]

**Loom analog**: AI action-item extraction (translate 20 minutes of talking into 3 things to do).

**Blueprint analog**: at every stage gate (Stage 1 → 2, 2 → 3, etc.), auto-generate a "what does the next-stage operator need to know" digest from upstream artifacts.

**Why highest leverage**: stage transitions are exactly where operators today re-read everything to rebuild context. The artifacts already carry the source material. This is a reviewer-class feature, not a media-generation feature — fits the existing methodology shape without expanding it into a new competence.

**What would validate promotion**: one consumer (greenfield or brownfield) reporting in `METHODOLOGY-AMENDMENTS.md` that re-context cost at stage transition was high enough that they hand-wrote a "next-stage handoff" doc themselves. Promotion shape: new reviewer in the Stage N → N+1 set + new template artifact `stage-bridge-digest.md`.

### Candidate 2 — Drift reports as generative output [PROMOTED wave 24, 2026-05-27]

**Loom analog**: AI generates docs from video — modality translation from rich-but-unstructured to structured-and-referenceable.

**Blueprint analog**: extend wave 22's `prototype-vs-production-traceability-sweep` so output is *generative* (drafts an amendment, drafts a `strategy.shipped` correction) rather than *diagnostic* (lists issues).

**Why this is sharpening, not new**: wave 22 established the sweep cadence and 4-link chain. The Loom inspiration reinforces that the next iteration bridges modality — from "list of drift" to "draft amendment ready for review."

**Promotion evidence (2026-05-27 audit)**: three distinct drift surfaces across two consumers — rally-hq wave 22 sweep (diagnostic baseline) + rally-hq waves 14-16 audit-chrome (LAG/CUSTOMIZATION-OR-ROT classification, generative-output-shaped) + subs-initiative `tools/state-derive/` (TypeScript capability catalogs + check primitives → `_state.json`; built independently in May 2026 to solve the same audit-decay problem). The third piece — a built reference implementation already in production at a sibling consumer — accelerated the promotion past the watch-and-wait threshold the candidates doc originally specified.

**Promotion shape (wave 24)**: extended `docs/prototype-vs-production-traceability-sweep.md` § "Generative output formats (wave 24)" with: per-verdict draft-artifact template + the subs-initiative `state-derive` pattern as canonical companion + activation order for two-layer consumers. Reference implementation stays in subs-initiative at `tools/state-derive/` (one-consumer shape; lift to `template/tools/state-derive/` when a second consumer adopts).

### Candidate 3 — Methodology onboarding digests [medium leverage]

**Loom analog**: chapters + summary — solve the wall-of-content problem.

**Blueprint analog**: auto-generated "what changed in the last N waves" + "what's load-bearing for surface X" digests pulled from the wave log + reviewer prompts.

**Why real**: wave 23 already flagged the register-asymmetry problem. The wave log + reviewer prompt set is ~1500 lines for a new contributor. Wave 23's fix was front-matter framing; the next iteration is generated digests.

**What would validate promotion**: a new contributor (or a returning operator after a 30+ day gap) reports the wave log alone insufficient for onboarding, and they hand-wrote a summary themselves. Promotion shape: tool at `template/tools/wave-digest/` that reads `wip/blueprint/CLAUDE.md` wave-log entries and outputs scoped digests.

### Candidate 4 — Amendment auto-classification [defer]

**Loom analog**: AI categorization of action items.

**Blueprint analog**: auto-classify amendments into "fix here / fix in template / fix in reviewer / consumer-specific."

**Why defer**: amendment volume is not yet high enough across consumers to justify automation. The current manual triage at promotion time (operator reads `METHODOLOGY-AMENDMENTS.md` across initiatives via the grep loop in the convention doc) works.

**Reconsider when**: ≥3 consumers are actively producing amendments at a rate where manual triage becomes the bottleneck.

### Candidate 5 — Multi-operator collaboration substrate [real gap, no Blueprint motion]

**Loom analog**: comment-on-this-specific-thing async — timestamped comments on a shared artifact.

**Blueprint analog**: portal sections accept inline amendment proposals that bubble up to `METHODOLOGY-AMENDMENTS.md` with section anchor as context.

**Why this is the only candidate that scales across operators**: candidates 1-4 scale operator work *within* a session. This one scales work *across* operators. The Loom transcript at 07:10-07:43 articulates this exact concern as unresolved: "How would that work if someone else was doing it?... does it scale once you add agents and you lose the context that integration is?"

**Why it carries more risk than 1-4**: requires accepting *input back into the artifact* (comments, amendment proposals), which is a new direction for Blueprint. All other candidates extend existing artifact-generation patterns. The substrate needs auth, identity, persistence — none of which Blueprint currently owns.

**What would validate promotion**: a multi-operator initiative (≥2 operators collaborating on one Blueprint application) reports that out-of-band commenting (Slack, AMENDMENTS.md hand-edits, Loom comments) was lossy enough that they needed a structured in-artifact channel. Promotion shape: new optional capability stage S-? alongside S-A; new portal mode; new schema field in `blueprint.yml`.

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
