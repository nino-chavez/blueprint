# Case Study — Blueprint against the verifiability taxonomy (the Kepler scorecard)

> **Provenance.** Vinoo Ganesh (CEO/co-founder, Kepler), *"How Kepler Built
> Verifiable AI for Financial Services"* — AI Engineer channel, published
> 2026-07-29, 22:29, https://www.youtube.com/watch?v=Tt2kX2sgQio. Source read
> for this analysis is the **auto-generated caption track** (`yt-dlp`, `en`),
> not a publisher transcript: proper nouns and model/version tokens in it are
> unreliable, so no figure or product name from the talk is treated as verified
> here. The talk references an Anthropic case study on Kepler; that document was
> **not fetched**, and nothing below is attributed to it.
>
> Same shape as [`case-study-determinism-scorecard.md`](case-study-determinism-scorecard.md)
> (Khourshid, AG Grid 2026-06) and captured for the same reason — the repo's own
> "promote rationale, not just code" rule. That analysis produced
> [ADR-0008](../decisions/ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md).
> **This one produces no ADR** (see § What was acted on).

## The thesis, stated once

AI turned a writing problem into a reading problem. Producing work product —
code, a model, a memo — is now cheap; establishing that the produced thing is
*correct* is the bottleneck, and it did not get cheaper. The talk's sharpest
move is separating two things the industry conflates:

- **A citation** shows where a value came from. It is an after-the-fact audit,
  and it is roughly half the job.
- **A verification** is a deterministic, repeatable check that the value is
  right — re-derivable from the source without asking a probability machine
  again.

Its second claim: you cannot eval your way from a non-deterministic model to a
deterministic output. A model fine-tuned to high extraction accuracy still emits
wrong values at its error rate, and in a domain where a wrong number is a
compliance event, that rate is not a score — it is the whole problem.

Its answer is three tenets: **atomic provenance** (the model emits a *reference*
to a value, never the value; anything that fails an independent check is
stripped before a human sees it), **scope determinism** (the model decides
*what* to compute and never performs the computation), and **derivation chains**
(a replayable record of what produced each derived figure, under the
organization's own definitions).

One more point does real work, and it is the one most likely to be skipped:
**verification is not ground truth.** Two desks can hold identical data and take
opposite positions. What gets verified is conformance to *your organization's*
declared rules — its nouns and verbs — not correspondence to a universal fact.

## The translation — what is Blueprint's "number"?

Kepler's domain makes this concrete: a revenue figure lifted out of a filing.
Blueprint produces strategy documents, prototypes, decision memos and handoff
manifests. Importing "the model must never write the number" literally would
point at a numeric-extraction substrate Blueprint has no demand for. The useful
question is which claim classes in a Blueprint deliverable carry the same risk
profile, and the answer is four, with very different coverage:

| Blueprint's "number" | Where it appears | Mechanical coverage today |
|---|---|---|
| Counts, versions, "latest N" | Living docs (README, METHODOLOGY, CLAUDE) | `stateful-claim-lint-reviewer` — five claim shapes against located sources; under-matches by design |
| External citations | Research, feasibility, strategy docs | `cited-url-lint` — proves the URL **resolves**; says nothing about the claim |
| Implementation verdicts ("this is done") | Registers, portal tiles, roadmaps | DoD ladder G1–G5 + `state-derive` + `scenario_passes` |
| **Derived figures in stakeholder documents** | Strategy docs, decision memos, prescriptions | **Judgment only** — see § The gap |

Three of four are mechanized. The fourth is the soft spot, and it is exactly the
one the talk is about.

## Scorecard

| Talk concept | Blueprint stance | Grade |
|---|---|---|
| **Writing problem → reading problem** (production is cheap, verification isn't) | The entire gate apparatus is an answer to reading cost. `agent-output-discipline-pattern.md` is the same insight one level down: a dispatched agent returns the conclusion, never the corpus, so the orchestrator doesn't pay to re-read it. | Converged |
| **Citation ≠ verification** | Stated in nearly the same words. `citation-correctness-pattern.md` names citations "a distinct claim class with a distinct failure mode," and `cited-url-lint` is explicitly scoped to the *mechanical half* — a URL resolves, the substance still needs judgment. Blueprint's citation layer **is** the ~50% the talk describes, and it says so. | Converged |
| **Evals don't produce determinism; a wrong value is still wrong** | Blueprint is ahead here, with receipts. `dod-verification-ladder-pattern.md` § "a presence oracle is not a function oracle" is the same argument mechanized: a presence check can never catch a seam bug, so `COMPLIANT` means *present*, never *shipped*. The `audit-discipline` global rule states the general form — self-attestation is not verification. | Blueprint ahead |
| **Atomic provenance** — the model emits a reference, never the value | **The gap.** Blueprint binds *references*, not *values*. See § The gap. | Gap |
| **Scope determinism** — the model decides what to compute, never computes | Already the declared architecture. [ADR-0008](../decisions/ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md) adopts "deterministic core / agentic shell" for stage orchestration — 11/14 gates machine-derived from disk, the 3 fuzzy ones blocked pending a *recorded* assertion. Reached independently, from a different talk and from Blueprint's own first principle. | Converged (documented) |
| **Derivation chains** — replayable record of what produced a figure | Partial. Blueprint has rich lineage at the **decision** grain — ADRs, the append-only registers, disposition records, `derived/`, the archaeology substrate ingesting sessions + ADRs + proposals. It has none at the **value** grain: nothing replays how a specific figure in a specific document was produced. | Partial |
| **Verification is org-relative, not ground truth** | Arguably Blueprint's native strength. `blueprint.yml`, `actor-output.yml`, `DESIGN.md`, the `terminology-linter`, the variant taxonomy, and the `invariants-registry-pattern`'s prescribed consumer-side `INVARIANTS.md` are the declared nouns and verbs; every gate checks conformance to *those*, not to a universal standard. The talk argues for this posture; Blueprint's whole config layer already is it. | Converged |
| **The work product is the proof** (finance should have what code has: PRs, reviews, tests, kept forever) | Converged by construction. "Shell is throwaway; artifacts are forever" splits evidence (`research/`, `decisions/`, committed rationale) from scaffolding, and the archaeology substrate makes that corpus queryable. The talk describes wanting this; Blueprint's durability rule is it. | Converged |
| **Token-maxing is the wrong metric; a cost-optimization wave is coming** | Already anticipated. ADR-0003's cost dial (`template/tools/lib/cost-dial.mjs`) resolves a per-stage effort/model vector against PROVISIONAL anchors, and `cost-gate-reviewer` (spec + `.mjs`, sharing the same resolver as `blueprint cost`) blocks a stage resolved below its anchor with no written `skip_justification` — silent under-processing is the named failure mode. The anchors are explicitly uncalibrated; the reviewer spec declares `.blueprint/telemetry.jsonl` as the recalibration input after ~10 cycles (no such file exists in this repo yet). | Anticipated |
| **The last mile is personalization / a firm-specific ontology** | Partial. Blueprint's ontology is **declared** (config, invariants, terminology, pilot profile), not **mined** from the artifact corpus. The archaeology substrate is the closest thing and it retrieves rather than induces. | Partial |

### Where Blueprint is ahead of the talk

The talk guarantees each extracted value is right. It does not address whether
the **set** of values is complete. Blueprint does, and names it as law:

> A proof's evidence must come from a source the claim does not control.
> — [`proof-obligation-registry-pattern.md`](../../template/docs/methodology/proof-obligation-registry-pattern.md)

with its denominator face in
[`ground-truth-over-proxy.md`](../lessons/ground-truth-over-proxy.md) L9: *a true
check of the wrong set still lies.* Atomic provenance is oracle-independence for
one value. The proof-obligation registry generalizes it to N claims and then
adds the harder question — where does the complete set of things-to-verify come
from — which perfect per-value provenance leaves entirely open.

The receipts for the presence-vs-function argument are also stronger than the
talk's: instance 1's ladder run surfaced features that read `COMPLIANT` and had
never worked (a privacy data-export crashing on every record), and an audit of
43 `manual_review` presence caps resolved 29 as false flags and 14 as real
path-drift — by *running the derive*, never by an agent's say-so.

## The gap — Blueprint verifies references, not values

Verified mechanically before this was written, not inferred:

1. **`state-derive` has no value primitive.** Its check union
   (`template/tools/state-derive/types.ts`) is `file_exists` · `file_absent` ·
   `grep_present` · `grep_absent` · `grep_count` · `schema_has_table` ·
   `schema_has_column` · `commit_message_grep` · `scenario_passes`. Every one
   answers *does this artifact exist / did this run pass*. None binds a stated
   figure to a re-derivation of it.
2. **`cited-url-lint` proves resolution, not correctness.** By design — the
   pattern doc says so.
3. **`stateful-claim-lint-reviewer` is the closest existing thing**, and it is
   deliberately narrow: five fixed claim shapes (wave currency, consumer count,
   reviewer count, doctor checks, version pin) each against one located source,
   "under-matching by design" so the gate doesn't manufacture noise.
4. **Both gates that could catch a fabricated figure are the two with no
   executable half.** ADR-0008's wave-86 addendum names exactly two `.md`-only
   mapped reviewers: `doc-quality-auditor` (check 5, "methodology statement for
   derived data" — can a skeptical reader see how this number was produced?) and
   `fact-check-loop-reviewer` (the Stage-4 orchestrator, whose stage's own third
   validation point is *are the numbers sourced, is the methodology stated, can a
   skeptical reader verify them*). Confirmed by directory listing: neither has a
   `.mjs`. So the highest-stakes claim class in a stakeholder document is graded
   by the same class of system that produced it.

Stated plainly: **a Blueprint document could carry a fabricated figure through
every gate, provided the surrounding prose was well-structured and any URLs near
it resolved.** That is precisely the failure the talk's atomic-provenance tenet
exists to close.

**Closed in part, wave 99.** Finding 4 is fixed: `doc-quality-auditor` now ships
a `.mjs` implementing check 5's mechanical core — `derivation-methodology`
(BLOCK) catches a percentage breakdown over an admittedly-incomplete denominator
with no *deliberately declared* derivation, and `figure-attribution` (WARN)
catches an unattributed figure in a shipping deliverable. The declaration
predicate is structural, never lexical, because the one real instance on record
(`case-study-pp-cx.md:91–93`) contains ambient prose about methodology that a
lexical check would have accepted. Findings 1–3 stand: this binds *declarations*,
not values — nothing re-derives a figure from its source. The full
atomic-provenance shape remains the deliberately-not-taken option below.

One mitigation exists and is worth naming precisely, because it is *not* a gate:
the `evidence-audit` skill runs an adversarial provenance pass over a draft —
re-derive load-bearing claims at their sources, downgrade what fails. It is
operator-invoked, wired to no stage transition. The distinction is the repo's own
prose-vs-gate line: the capability exists, the enforcement does not.

The shape a fix would take, if it is ever warranted: derived figures in shipping
documents declare a source + derivation (source artifact, extraction, formula)
in a machine-readable sidecar; a lint re-derives and diffs; a figure that fails
re-derivation is blocked rather than shipped-with-a-caveat — the talk's "strip
it before a human sees it," which is a materially stronger posture than
Blueprint's current flag-and-let-the-author-judge.

**This is a candidate, not a decision.** Two reasons to hold. First, the
second-instance rule: this gap has been surfaced once, by an external talk in a
domain with regulatory stakes Blueprint's deliverables do not carry. Promote
when a *real initiative* ships a document whose derived figure was wrong and no
gate caught it. Second, the over-engineering line: most Blueprint documents
carry few derived figures, and a sidecar-per-figure contract could easily cost
more than the class of error it prevents. The honest interim move is the cheap
one — `doc-quality-auditor` check 5 already asks the right question and simply
has no teeth; giving *it* a mechanical half is a far smaller step than building
a provenance substrate.

## Already on the roadmap (planned work the talk lands on)

Three items already scheduled or promotion-pending sit on the same axis as the
talk's tenets. None was authored in response to it; listing them is how the
"plan to implement" half of the comparison gets answered honestly.

| Planned work | Status | Which tenet it moves |
|---|---|---|
| **Reviewer dispatch with assertion freshness** — `blueprint stage advance` invokes the transition's mapped reviewer and records its PASS as the gate assertion, carrying reviewer name, reviewer-file hash, timestamp, and a content fingerprint of the reviewer's *declared input globs*, so a later `advance` invalidates a stale PASS | **SHIPPED** (`template/tools/lib/stage-model.mjs:725–750`) — ADR-0008's wave-86 addendum scheduled it and the machinery landed. What pends is per-gate *mapping* calibration: only Stage 0→1 (`pilot-profile-lock-reviewer`, line 345) is machine-wired; the rest run manually | **Derivation chains**, at the gate grain. The closest thing in Blueprint to a replayable, invalidatable verification record — verification recorded with its provenance, not hoped |
| **Seam-coverage linter (L4) + destructive-migration source-from-current gate (L5)** | Named as the strongest mechanization candidates in `ground-truth-over-proxy.md` § Promotion criteria; both still discipline, not gates | **Evals ≠ verification** — both target false-greens that pass every existing check |
| **Proof-obligation registry → cross-consumer law** | Single-initiative (subs-initiative); engine ships at `template/tools/spec-obligation-registry/`; promotes when a second initiative registers a non-ladder obligation and it catches a real defect | **Atomic provenance**, generalized — oracle-independence plus the denominator |

Note the shape: the shipped and scheduled work moves derivation chains and
false-green detection forward, and moved value-binding **not at all**. The gap
above was not one the roadmap was already quietly closing.

## What was acted on, and what was deliberately left

- **Acted on (wave 99):** the cheapest step named below was taken —
  `doc-quality-auditor` gained its `.mjs`, implementing check 5's mechanical
  core. This required no ADR and no new methodology: check 5 was already
  ratified with CRITICAL severity, and ADR-0002's contract says the `.mjs`
  implements the `.md`. The second-instance rule governs *new* checks; finishing
  a half-made encoding is what the first principle already demands. Freeze check
  ran first (`blueprint fleet`: 16 consumers, none mid-migration).
- **Still a candidate:** value-provenance proper — binding a figure to a
  re-derivation of it, per the promotion criterion above. Wave 99 binds
  declarations, not values.
- **Deliberately not acted on:** a numeric-extraction substrate, a
  per-value derivation-chain store, or an ontology-mining layer over the
  archaeology corpus. Each is a real Kepler capability with no Blueprint demand
  behind it. Recorded here so a future session doesn't re-open them as gaps.

## The meta-finding

This is the second external talk scored against Blueprint (after Khourshid), and
the two converge from opposite directions on the same architecture: determinism
in the core, non-determinism at the edges, the model choosing *what* rather than
computing *how*. Blueprint reached it from its own first principle — agent
struggle is a missing capability, encoded into the repo — and both talks supply
vocabulary rather than correction.

The difference between the two scorecards is where they land. Khourshid's
exposed a gap in **control flow** (stage sequencing was prose, not a machine)
and produced an ADR. Ganesh's exposes a gap in **claim binding** (references are
checked, values are not) and produces a candidate. That the second analysis
surfaced exactly one gap, in a class Blueprint had never mechanized, is the same
signal the first one gave: the boundary is mostly right, and the exceptions are
findable.

## See also

- [`case-study-determinism-scorecard.md`](case-study-determinism-scorecard.md) — the prior external-talk scorecard
- [ADR-0008](../decisions/ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md) — deterministic core / agentic shell
- [`dod-verification-ladder-pattern.md`](../../template/docs/methodology/dod-verification-ladder-pattern.md) — presence vs function
- [`proof-obligation-registry-pattern.md`](../../template/docs/methodology/proof-obligation-registry-pattern.md) — THE LAW + the denominator
- [`citation-correctness-pattern.md`](../../template/docs/methodology/citation-correctness-pattern.md) — the citation/verification split
- [`ground-truth-over-proxy.md`](../lessons/ground-truth-over-proxy.md) — nine faces of representation drift
