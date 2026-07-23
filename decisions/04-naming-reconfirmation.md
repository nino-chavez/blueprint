---
canonical: true
---

# Decision 04 — Naming reconfirmation: keep Blueprint (no new information)

**Date**: 2026-07-13
**Status**: Accepted
**Type**: Self-application decision (not a methodology wave — no `template/` change, no consumer-sync)
**Supersedes**: formalizes and re-verifies the 2026-06-05 informal verdict (previously only captured as a session-memory note, not an artifact)

## Context

A structured 8-step naming-strategy brief (brief + territories + 40–60 candidates + collision screen + shortlist + audience test + scored Blueprint comparison + migration ADR) was proposed for re-evaluating the "Blueprint" name. Before running it, the June 5, 2026 session was checked: it had already run the same exercise — 15 candidates, full npm/GitHub/domain/collision screen, categorical scoring — and concluded "keep Blueprint," with an explicit instruction not to re-run without new information.

Operator scoped this session's work down accordingly: no new information exists (Blueprint has not moved toward funded/branded-product status, the brief's own stated trigger for revisiting). This decision re-verifies the prior collision findings against current state (5 weeks later — things move), sanity-checks the categorical verdict against the brief's weighted rubric, and formalizes the result as a citable ADR instead of a memory note. Per operator instruction, no real human audience test was run (step 6 of the original brief) — a labeled simulation stands in; see § Audience test below.

## Naming brief (condensed)

**Product**: A methodology and toolchain for running evidence-backed product initiatives with AI agents — agents execute, operators steer, gates verify.

**Required qualities**: credible in an enterprise conversation; distinctive in software search; easy to say/spell/remember; broad enough for methodology + CLI + portal + ecosystem; not tied to current AI terminology; suggests disciplined progress, not autonomous magic.

**Kill criteria** (from the brief, applied in the June 5 screen): active same/phonetically-similar product; meaningful collision in AI/PM/dev-tools; hard to pronounce or spell; requires "AI" capitalization; implies spec/plan/prototype-only; obvious legal risk.

**Decision threshold** (from the brief, adopted here): rename only if a candidate scores **≥15 points above Blueprint** on the weighted rubric below, with no major collision or usability risk.

## Candidates evaluated (15, from the June 5 screen)

| Name | Verdict (June 5) | Killer collision |
|---|---|---|
| Cadence | dead | Cadence Design Systems ($160B+ EDA); Uber Cadence Workflow (12B+ exec/mo); Flow blockchain language |
| Throughline | dead | ThroughLine Mental Health Crisis Platform (170+ countries, VC-backed); NPR podcast (Peabody) |
| Kiln | dead | **Kiln-AI/Kiln — direct AI-eval-framework competitor** |
| Lathe | dead | **`lathe-cli` — direct agent-harness competitor, published weeks prior** |
| Relay | dead | `facebook/relay` — dominant GraphQL framework |
| Loom | dead | Loom HQ ($800M+ Atlassian-backed); `tokio-rs/loom`; `openjdk/loom` |
| Slipstream | dead | **`@keyqinc/slipstream-mcp` — Claude Code MCP server, published ~60 days prior** |
| Praxis | dead | Ruby Praxis Framework — same "design→implementation" positioning |
| Mint | dead | Mintlify owns the npm ecosystem; Mint UI (Vue, 15k★); Elixir Mint |
| Shipwright | dead | Tekton Shipwright (`shipwright.io`) — active k8s image-build project |
| Keel | dead | active, unnamed backend-tool collision (npm occupied, actively versioned) |
| Drydock | dead | npm occupied, no further collision investigated |
| Wright | dead | npm occupied, no further collision investigated |
| Shipyard | dead | Shipyard.build — deployment platform |
| Jig | **weak / viable-scoped-only** | `juxt/jig` (Clojure, same metaphor); `dddjava/jig`; npm + all domains locked |

Zero candidates cleared to "strong" (ownable bare). Only Jig survived immediate collision-kill; it was then rejected on strategic fit — "a jig *guides*; it does not *execute* — wrong lean for an agent-does-the-work product."

## Fresh re-verification (2026-07-13, this session)

Re-checked the candidates and collisions that mattered most — the ones with any life, and the direct AI-agent-space competitors that killed the strongest metaphors — since 5 weeks is enough time for npm/GitHub state to shift:

| Target | June 5 state | July 13 state | Change |
|---|---|---|---|
| Kiln-AI/Kiln (GitHub) | 4,867★ | 4,964★, pushed today | Active, growing — collision stronger, not weaker |
| `lathe-cli` (npm) | v1.6.0, published 2026-05-21 | v1.6.0, unchanged | Still occupies the name; dev has slowed but package remains published |
| `@keyqinc/slipstream-mcp` (npm) | v0.2.0 | v0.2.0, still resolvable | Still occupies the name |
| Tekton Shipwright (`shipwright-io/build`) | cited from recollection, **not independently verified** in the June 5 session | 812★, pushed 4 days ago | **Now confirmed independently** — the prior session's unverified recollection was correct; this collision is real and active |
| `juxt/jig` (GitHub) | 229★ | 229★, last pushed 2014-03-26 | Dormant upstream — but npm `jig` and all `jig.*` domains remain registered/ACTIVE regardless |
| Keel (npm) | v0.456.0 | v0.465.0, pushed 2026-07-10 | Active, growing |
| Palantir Blueprint.js (`palantir/blueprint`) | cited as the incumbent "Blueprint" collision | 21,916★, pushed today | Confirmed massive and active — the existing collision Blueprint already lives with is real, current, and larger than any single wave-1/2 candidate's collision |
| `jig.dev`, `shipwright.dev` (domains) | wave-2 whois heuristic returned inconclusive "registered/unknown" for nearly everything | clean RDAP-style check: both `status: ACTIVE` | Confirms the domains are genuinely taken, not a heuristic false-negative |

**Conclusion of re-verification**: nothing flipped. Every collision that killed a candidate five weeks ago is still there; several are more entrenched now (Kiln-AI +97★, Tekton Shipwright confirmed active where it was previously only recollected, Keel still shipping releases). No new candidate presents itself from this re-check — this was a re-verification of the existing 15, not a fresh search, per the operator's "gut-check, not full sprint" scope.

## Weighted scorecard (sanity-check against the brief's rubric)

Applied to the only two candidates with any life — Blueprint (incumbent) and Jig (the sole non-dead alternative) — using the brief's weighted criteria:

| Criterion | Weight | Blueprint | Jig |
|---|---:|---:|---:|
| Distinctiveness / search ownership | 25 | 8 — collides with Palantir Blueprint.js (21.9k★, JS dev-tool space) | 10 — collides with a dormant repo, but npm + domains still locked |
| Strategic fit with methodology | 20 | 18 — literal, apt, already wired through the entire corpus | 8 — "guides, doesn't execute"; wrong lean for an agent-does-the-work product |
| Memorability / pronunciation | 15 | 15 — common word, unambiguous | 12 — short, but semantically ambiguous (dance, fixture, tool) |
| Credibility with teams / enterprises | 15 | 13 — "we run our initiatives through Blueprint" reads naturally | 8 — informal register, harder to say with a straight face in an enterprise recommendation |
| Extensibility across CLI/portal/ecosystem | 10 | 9 — already extended (`blueprint.yml`, `blueprint-cli`, `blueprint fleet`, `/blueprint-*` skills) | 6 — narrower concept, no existing wiring |
| Domain/package/repo viability | 10 | 7 — bare form taken, but a working scoped package already ships (`@nino-chavez-labs/blueprint-cli`, live at v0.6.0) | 6 — equally locked, nothing shipping |
| Visual/verbal character | 5 | 3 — solid, if generic | 3 — plain |
| **Total** | **100** | **73** | **53** |

**Gap: Blueprint leads by 20 points.** The threshold required a challenger to beat Blueprint by 15+; Jig instead trails by 20. The categorical June 5 verdict ("weak," rejected on fit) holds under the brief's more rigorous weighted framework — this was a useful cross-check, not a reversal.

## Audience test

Step 6 of the brief (6–10 real people, pronunciation/spelling/recall/credibility) was **not executed** — no human testers were available this session. Per operator direction, a labeled simulation stands in; treat it as a directional signal only, not evidence:

| Signal (simulated) | Blueprint | Jig |
|---|---|---|
| Pronunciation agreement | High — no ambiguity | High — no ambiguity |
| Spelling accuracy | High | High |
| Category inference | "Planning/architecture tool" — close to accurate | "A workshop fixture or a dance" — likely wrong guess, needs explanation |
| Unaided recall (20 min later) | Moderate-high — common word, easy to place in context once explained | Moderate — short and sticky, but competes with its literal meanings for recall slots |
| "Would say in a room" (credibility) | Comfortable | Would likely feel the need to caveat it ("it's called Jig, like a tool fixture") |

This simulation predicts Jig would underperform Blueprint on category inference and credibility specifically — consistent with the weighted score gap above. A real test, if ever run, is most likely to confirm rather than overturn this — but it remains unverified until someone actually runs it.

## Decision

**Keep "Blueprint."** No rename. Threshold not met — no evaluated candidate approaches, let alone clears, the required 15-point margin; the closest surviving candidate trails by 20.

## Compatibility policy

Not applicable — no rename means no migration, no aliasing, no deprecation surface. `blueprint.yml`, `@nino-chavez-labs/blueprint-cli`, `/blueprint-*` skills, and all methodology vocabulary are unchanged.

## Rejected alternatives

All 15 candidates in the table above. Full collision detail, exact commands run, and per-candidate scorecards are preserved in the June 5 session transcript (`8269db3c-a731-4915-9281-c2c4551810a7`) and its subagent workflow logs; this ADR is the citable summary.

## Independent corroboration (Codex, same day)

A separate, concurrently-run sprint (Codex, 2026-07-13) independently tested this conclusion against a different 62-candidate corpus (54 first-round + 8 clearance-aware) — see `research/naming/00-naming-brief.md` through `04-finalist-scorecard.md`. It reaches the same verdict and surfaces one sharper collision this ADR's re-verification missed: **Pega Blueprint** (pega.com/blueprint), a live enterprise AI-assisted app-design/workflow-automation product using the bare word "Blueprint" — confirmed real, not adjacent-only. Its best clean candidate, Methodkeep, scored 80/100 against a 20-point-weighted rubric with an 84-point rename threshold (qualified Blueprint's 72 + a 12-point margin) — short of the bar, same direction as the Jig comparison above. That package extends rather than supersedes this decision; it does not change the outcome, and it sharpens the collision picture (Blueprint is harder to own commercially than this ADR's own re-verification found).

## Revisit trigger (unchanged from June 5)

If Blueprint moves toward being a **funded, branded product** rather than a portfolio/personal methodology — that is the one condition that flips the cost-benefit on coining an invented mark (Vercel/Stripe/Bun-style). That is a deliberate brand-investment decision for the operator to make explicitly; absent it, re-running this search again without new information is not warranted.
