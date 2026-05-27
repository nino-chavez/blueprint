# Prototype-vs-Production Traceability Sweep Pattern

**Status**: Promoted 2026-05-27 wave 20 from rally-hq amendment (commit `7629d2f`, *"Prescription encodes known drift; intent traceability needs its own recurring sweep"*) + the 17-meta fan-out evidence (commit `a4383a6`, `blueprint/audits/traceability-sweep-2026-05-26.md`). Synthesizes v1 amendment + 10 recipe-friction refinements into a single recipe.

**Last updated**: 2026-05-27

**Source evidence**:
- `apps/rally-hq` commit `7629d2f` — v1 amendment proposing the sweep + tournament-meta calibration (8 items, 4/4 known reproduced + 4 new)
- `apps/rally-hq` commit `a4383a6` — 17-meta fan-out (152 items, 7 HIGH bugs, 10 cross-cutting patterns rolled to 8 P-items, 10 recipe-friction notes documented)
- bc-subscriptions May 2026 — first articulation of the prescription's `known-known` vs `known-unknown` distinction

**Related patterns**:
- [docs/archaeology-substrate-pattern.md](archaeology-substrate-pattern.md) — when present, the substrate can answer many sweep questions via `/derive` queries; the sweep is the verification layer above it
- [docs/inventory-as-evidence-pattern.md](inventory-as-evidence-pattern.md) — same family: read-only walk → classify → file as evidence
- [docs/register-pattern.md](register-pattern.md) — `strategy.shipped` schema reform (friction note #5) follows the same append-only convention

---

## Why this pattern exists

The Stage 2 `prescription.yml` encodes change-items derived from synthesis at the time the synthesis was authored. It is a `known-known` artifact: every P-item came from a finding the operator could name. It is silent on `known-unknowns` — places where the implementation drifted from the prototype design without anyone filing a gap.

The other Stage-2/3 artifacts that look adjacent have related but different jobs:

| Artifact | What it catches | What it misses |
|---|---|---|
| `prescription.yml` | Known drift authored from synthesis | Drift that accumulated post-synthesis |
| `PROTOTYPE-AUDIT.md` | Prototype-internal issues (one-directional, prototype-to-prototype) | Production-vs-prototype divergence |
| Page-system audit | L4-template clustering + shell migration shape | Per-meta affordance drift (hero composition, tab order, accent propagation, font-token canonicalization, identity-element placement) |

None of these walks the **research → meta → prototype HTML → production code** chain end-to-end at per-meta granularity. That walk is what catches intent-vs-implementation drift, and rally-hq's calibration on `tournament.json` (2026-05-26) demonstrated the walk surfaces material drift in 10–15 minutes per meta with a sonnet agent. The 17-meta fan-out at `a4383a6` validated the recipe at scale: 152 items found total, 7 of them HIGH-severity bugs no existing artifact had flagged, including one root cause (commit `f04a983` shipped billing free-mode content to the retired `/manage/billing` route, never ported to `/account/billing`; meta's `strategy.shipped` falsely attested delivery).

---

## When to run

**Cadence**:
- After each major migration arc closes (e.g., Phase 6 closure on a multi-phase brownfield)
- Quarterly as a maintenance baseline if no major arc has closed
- Before a stakeholder-visible product launch where the deliverable claim is "the prototype intent is shipped"

**Skip when**:
- Initiative is greenfield-pre-Stage-3 (no production code yet to diff against the meta)
- Initiative is Tier 0 (no production destination — the prototype IS the deliverable)
- Per-meta `destination` field is `blueprint` for all metas (synthetic design study; no production-code projection exists)

---

## The 4-link chain

For each product-destination meta, walk all four links in order:

```
research finding (synthesis §4 / F-codes / R-codes)
  ↓ Link 1→2
prototype meta strategy.why (_meta/*.json)
  ↓ Link 2→3
prototype HTML page (prototype/pages/*.html)
  ↓ Link 3→4
production implementation (src/routes/ or equivalent)
```

Per-link checks:

| Link | What to verify | Common failure |
|---|---|---|
| **1→2** | `strategy.why` references findings that actually exist in synthesis / DESIGN-PRINCIPLES with the correct citation (`§4-#N`, F-code, or R-code) | Citation drift — the meta cites `§4-#5` but the actual finding lives in §2 or under a different number |
| **2→3** | Prototype HTML implements what the meta says it does | Usually the prototype is correct; when mismatched, flag the meta (the prototype was authored against the design; the meta is stale) |
| **3→4** | Production implements what the prototype shows AND what the meta intends | Where the bulk of real drift lives — production shipped a polish layer the prototype predates, or production omitted an affordance the meta declared |

---

## Pre-flight steps (run before per-link checks)

The 17-meta fan-out surfaced two recipe steps that, absent explicit, cost time and produce false-positive findings.

### Pre-flight 1: Destination check (friction note #2)

For each cross-link the prototype HTML references (e.g., a button to `/channel-partners`), look up the target meta's `destination` field BEFORE classifying the absence of the destination from production as a bug:

```yaml
# In _meta/<target>.json
destination: product    # implemented in production
destination: blueprint  # synthetic — exists only in the design study
```

A cross-link to a `destination: blueprint` target is *correct* if production omits it — that destination was never meant to ship. Without this step, the recipe will produce HIGH-severity "missing destination" findings that are actually correct-by-design.

### Pre-flight 2: Research-gated sort (friction note #6)

For metas with `strategy.question` fields naming a gating research signal (e.g., "deferred until Guide B interviews close"), sort findings into two buckets BEFORE filing:

| Bucket | Verdict treatment |
|---|---|
| Items the gating research could resolve | `open-question` verdict — gated on the named research signal |
| Items shippable today regardless of the gating research | `bug` or `refinement` verdict — file in prescription |

Without explicit sorting, the agent files everything as `open-question` because the meta's gating language is salient, missing the shippable-today subset. Captain meta in the rally-hq sweep produced two MEDIUM-severity bugs (up-next hero, accent wiring) that were initially filed as gated but were not — only the Variant-B work was actually gated.

---

## Verdict taxonomy (5 verdicts)

Each finding gets exactly one verdict. The v1 amendment had four; friction note #3 added `structural-divergence` to slot a recurring case the original taxonomy could not absorb.

| Verdict | Meaning | Severity field | Required follow-up |
|---|---|---|---|
| `bug` | Production violates research intent or a principle | `high` (R-code violation) / `medium` (synthesis finding violation) / `low` (cosmetic) | File as prescription P-item |
| `refinement` | Production added something the prototype didn't have, justified by post-prototype learning | n/a | Document in meta + cross-reference; preserve |
| `open-question` | Drift is real; resolution requires research signal not yet collected | n/a | File as gated prescription item with named gating signal |
| `already-reconciled` | Drift existed but was fixed in this session / arc | n/a | Note the commit; no follow-up |
| **`structural-divergence`** *(added wave 20)* | Prototype shape diverged from production shape intentionally; divergence is not documented | n/a | Required `rationale` field; update meta to record the divergence so future sweeps don't re-flag it |

The canonical `structural-divergence` case from the rally-hq sweep: `create-tournament` meta showed a flat single-form prototype; production ships a six-section progressive form. The change was intentional and correct, but no artifact documented the divergence — the sweep agent had no signal to distinguish "intentional architectural choice" from "implementation drift." A `structural-divergence` verdict with `rationale: "Production split flat form into six sections to scaffold field validation per BigEng DoD Gate 2"` slots the case without forcing the wrong-shaped verdict (`bug` is wrong because production is correct; `refinement` is wrong because the change isn't additive).

---

## Meta-schema extensions the recipe relies on

The recipe walks the meta files. These schema extensions surfaced from the 17-meta fan-out as fields that, absent, force the agent to infer from secondary sources (PROTOTYPE-AUDIT.md, code-grep, git-log archaeology). Adding them as first-class meta fields makes the walk mechanical.

| Field | Type | When required | Friction-note origin |
|---|---|---|---|
| `currentState.expected_size` | `"short"` \| `"medium"` \| `"long"` \| `"<N>-<M> sections"` | Content-heavy surfaces with no prototype HTML (docs pages, help center, runbooks) | #1 — without it, Link 2→3 collapses to subjective code review; help-center's "short friction reducer vs 556-line manual" was the canonical missed case |
| `currentState.expected_section_count` | integer | Same as `expected_size` when section count is the load-bearing dimension | #1 — a single `expected_section_count: 5` would have flagged the help-center divergence mechanically |
| `decomposedInto[]` | array of strings (route paths or meta IDs) | Retired surfaces that 1→N split to multiple production routes | #4 — without this, the meta's `route` field still points at the retired prototype URL; agent must infer from `currentState.sourceFiles` |
| `strategy.shipped.route` | string (current route path) | When `strategy.shipped` references a commit | #5 — billing's `strategy.shipped` was technically true but practically false; the commit landed on a retired route. Pairing the commit with the *current* route makes route-change invalidation detectable |
| `strategy.shipped.verified_date` | YYYY-MM-DD | When `strategy.shipped` lands | #5 — staleness signal; a sweep can prioritize re-verifying claims older than the last major arc |
| `affected_handlers[]` | array of file paths | Surfaces that depend on cron, webhooks, or edge functions outside the main route tree | #8 — spectator-follow's 15-min vs 10-min push timing required reading `cloudflare-worker/cron`, which was not in `currentState.sourceFiles` |
| `strategy.answer` | string (resolved statement) | When `strategy.question` lands in production | #10 — `manage-platform`'s "Stripe split vs Twilio merge" question was answered in production but the field still contains the open question text |
| `currentState.findings_refs[]` | array of strings (`§4-#N`, F-code, R-code) | Optional but recommended for any meta with non-trivial `strategy.why` | #7 — citation lint (Link 1→2 mechanical check); without this, prose-only `strategy.why` requires the agent to read synthesis top-to-bottom |
| `currentState.findings_status` | `"open"` \| `"resolved"` (per-finding) | When PROTOTYPE-AUDIT.md tracks findings against this meta | #9 — without per-finding status, sweeps re-audit confirmed-closed items repeatedly |

Schema extensions are **opt-in by recipe** — a consumer that doesn't run the sweep doesn't need to populate them. The recipe degrades gracefully on absent fields (logs the friction; doesn't fail).

---

## Per-sweep workflow

```
Step 1: Per-meta fan-out
  - Dispatch one sonnet agent per product-destination meta (skip blueprint-destination)
  - Each agent runs pre-flight steps 1+2, then walks the 4-link chain
  - Each agent classifies findings against the 5-verdict taxonomy
  - Per-meta agent runtime: ~10-15 min (faster for no-prototype-HTML metas, slower for research-gated ones)

Step 2: Aggregation
  - Aggregate per-meta reports into blueprint/audits/traceability-sweep-{date}.md
  - Cross-cutting pattern extraction is most effective at aggregation time
    (individual agents see their surface; the aggregator sees the union)
  - Severity-rank the backlog: CRITICAL > HIGH > MEDIUM > LOW

Step 3: Prescription integration
  - Bug-verdict findings become P-items (group cross-cutting patterns into single P-items, not per-finding fixes)
  - Open-question-verdict findings become gated prescription items with named gating signal
  - Structural-divergence findings drive meta updates (record the rationale)
  - Refinement-verdict findings become meta annotation updates

Step 4: Recipe-friction capture
  - Note any per-meta friction the agents encountered
  - File as candidates for the next iteration of this doc
  - The 10 friction notes that produced wave 20 came from this step on the rally-hq fan-out
```

---

## Output shape

`blueprint/audits/traceability-sweep-{date}.md` — single file, structured for prescription consumption:

```markdown
# Traceability Sweep — {date}

## Executive summary
{N} metas swept; {N} items found; {N} cross-cutting patterns;
{N} HIGH-severity bugs; {N} P-items proposed.

## Per-meta drift count
| Meta | bug | refinement | open-question | already-reconciled | structural-divergence |

## Master severity-ranked backlog
### CRITICAL (R-code principle violations)
### HIGH (R-code violation or major intent failure)
### MEDIUM (intent mismatches — visible but not principle violations)
### LOW (cosmetic / minor intent gaps — compact list)

## Cross-cutting patterns
{Each pattern: name, scope, root cause, proposed P-item}

## Proposed prescription P-items
{Numbered list with findings_traceability stubs}

## Recipe-friction notes for methodology amendment
{Per-friction note: what surfaced, where it bit, proposed methodology change}

## Calibration verdict
{Did the recipe scale? Where did it strain?}

## Closure
{What remains: P-items to land, HIGH bugs to schedule, methodology amendment cadence}
```

The "Recipe-friction notes for methodology amendment" section is load-bearing — it feeds the next iteration of this doc and is the staging artifact for future wip/blueprint promotions.

---

## Tooling proposals (non-blocking follow-ons)

Each compounds across sweeps. None blocks the recipe; fan-out can proceed without them.

| Tool | What it does | Friction note source |
|---|---|---|
| `blueprint/scripts/check-prototype-traceability.sh` | Orchestrator: lints `strategy.why` for `§4-#N` refs against `prescription.yml findings_traceability`; checks `strategy.shipped` commit-vs-current-route; confirms `strategy.question` fields older than 60 days have a `strategy.answer` | Wraps notes #5, #7, #10 into a CI check |
| Citation lint pass | Verifies every `§4-#N` reference in `strategy.why` resolves to the correct finding in `research/synthesis.md §4` | #7 |
| `strategy.shipped` verification script | For every meta where `strategy.shipped` cites a commit, verify (a) commit exists in git log, (b) commit touches files under `currentState.sourceFiles` paths | #5 |
| Webhook contract diff | Reads canonical event-type source (e.g., `src/lib/types/api.ts`) and diffs against documented events (e.g., `/docs/api/guides/webhooks/+page.svelte`) | Catches the rally-hq `tournament.started` / `bracket.advanced` omission class without a manual sweep |
| Meta-schema extension validator | JSON-schema validator that flags metas missing recipe-relied-on fields when those fields are recipe-required (per the table above) | #1, #4, #5, #8, #10 |

---

## Why this is a cross-cutting discipline, not a pipeline stage

The sweep does not feed the next pipeline stage — it runs *after* the pipeline has produced the stakeholder deliverable. It is recurring (cadence-gated, not flag-gated), it produces an output artifact (not a deliverable), and it feeds back into prescription as P-items rather than forward into the next stage.

The closest sibling capability is Stage S-A (Archaeology Substrate), but the substrate is flag-gated (`archaeology.enabled`) and has a discrete linear lifecycle. The sweep activates per cadence (post-major-arc or quarterly), runs as an orchestrated fan-out, and terminates. Different activation model, different lifecycle.

See [METHODOLOGY.md § "Cross-Cutting Disciplines"](../METHODOLOGY.md#cross-cutting-disciplines) for the table that activates this pattern.
