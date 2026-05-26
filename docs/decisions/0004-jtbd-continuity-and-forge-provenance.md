---
canonical: true
---

# ADR-0004 — JTBD continuity + forge-pipeline provenance as encoded Stage 1→2→3 gates

**Date**: 2026-05-26
**Status**: Accepted
**Surfaced by**: two consumer sessions on 2026-05-25/26 (`website-nc-v3` "forge-pipeline-bypass" + `website-nc-v3` follow-up "rallyhq-worked-for-functional-product, this-didn't-for-positioning"). Both diagnosed by the operating agent post-failure — neither caught by a methodology gate.

## Context

Two consumer-side failures surfaced the same root cause at two different layers.

**Failure 1 — forge-pipeline-bypass**: agent built a portfolio prototype by hand-crafting HTML/CSS/copy instead of running the `forge-brand → forge-signal → gen-images → forge-site` pipeline that Blueprint's `CLAUDE.md` and `METHODOLOGY.md` reference. The agent had the right tools enumerated in its session context, knew the pattern existed, and still defaulted to LLM-aesthetic invention. The agent's post-failure self-diagnosis identified every missed step in detail — proving the diagnostic capacity existed but only surfaced after the operator complained.

**Failure 2 — JTBD discontinuity**: on the same project, agent identified that the prototype lacked acceptance criteria. Stage 1 produced JTBD-shaped personas + funnel (concrete arrival paths, time budgets, completion tests). Stage 2 prescription and Stage 3 brief abstracted those into positioning directives ("surface receipt density," "rewrite identity frame"). By Stage 4, the prototype had no testable design constraints — every choice became aesthetic. Rally HQ avoided this because its product function (create tournament → form, view bracket → tree) carried JTBD forward implicitly; positioning-shaped initiatives have no such forcing function.

The two are **one root cause at two layers**:

| Layer | What's missing | Symptom |
|---|---|---|
| Information (Stage 1 → 2 → 3) | JTBD acceptance criteria preserved across stage boundaries | Vague prescription/brief, design has no constraints to satisfy |
| Procedure (Stage 3 → 4) | Forge-pipeline invocation evidence + JTBD-satisfaction check | Hand-built prototype that bypasses the deterministic generation layer entirely |

Either failure alone produces bad prototypes. Together they reinforce: without JTBD, even a forge-run produces generic output; without a forge-pipeline gate, the agent skips the tools that would consume the JTBD. Fixing one without the other leaves the failure mode intact.

This is the same shape as wave 6's four amendments (wrong-dir, title-collision, prose-doc audit, docs duplication): *Blueprint had information that should have stopped the failure but didn't encode it as a gate.* Five instances of this meta-pattern in 48 hours means the rate-of-surface exceeds the rate-of-encoding. Wave 7 starts closing the gap on the most-recent two.

## Decision

Wire three Stage-gate changes, all variant-aware:

### 1. Extend `research-completeness-reviewer` (Stage 1 → 2)

Current behavior: verifies required research directories exist and are populated. New requirement (added to existing reviewer, not a new reviewer): for every persona in `research/personas/`, verify there is at least one JTBD entry that names:

- **Surface**: the page/route/screen this JTBD applies to
- **Time budget**: how long the persona has to complete the job (seconds, minutes, "before deciding," etc.)
- **Job**: the task the persona is trying to accomplish on this surface
- **Acceptance criteria**: ≥1 testable condition (e.g., "Within 5 seconds, sees 3+ named shipped products with live URLs")

JTBD can be inline in the persona file or in a sibling `research/personas/<persona>/jtbd.md`. The acceptance criteria are what downstream stages will trace against and the Stage 3 reviewer will test the prototype against.

Variant-aware: greenfield + brownfield require JTBD per persona per surface (positioning-shaped initiatives need it most; functional initiatives benefit even when their function carries some of it implicitly). Midstream requires JTBD only for personas the scoped change affects.

### 2. New `prescription-jtbd-traceability-reviewer` (Stage 2 → 3, brownfield + midstream)

Every prescription item in `02-prescription.yml` (brownfield) or `prescription.yml` (midstream) must trace to ≥1 Stage 1 JTBD via a `serves_jtbd: [<persona>/<surface>/<job-slug>, ...]` field. Items that don't trace get flagged as "positioning directive without functional anchor — rewrite as JTBD-derived requirement or mark `serves_jtbd: none-deferred` with a reason."

This catches the exact drift Failure 2 named: "surface receipt density" is a positioning directive; "Peer Architect arriving from Signal Dispatch sees 3+ named products within 5 seconds" is the JTBD it derives from. Naming the trace forces the prescription to stay anchored.

Greenfield uses `design-principles-reviewer` instead; that reviewer should grow an equivalent JTBD-trace check in a future ADR (out of scope here — greenfield's design-brief structure differs from brownfield's prescription).

### 3. New `prototype-forge-provenance-reviewer` (Stage 3 completion)

Two checks, both variant-aware:

**Check A — Forge-pipeline evidence files present.** Scans the consumer repo for artifacts produced by the canonical generation tools:

| Tool | Expected evidence file(s) |
|---|---|
| `forge-brand` | `brand-kit.json`, `tokens.css` / `tokens.tailwind.json`, `brand-kit/voice.md` |
| `forge-signal` | bridge YAML produced by `forge-brand export forge-signal`, generated copy output in `content/` |
| `gen-images` | output manifest, generated assets in `media/` or referenced from the brand kit |
| `forge-site` | archetype reference in `blueprint.yml` (`forge_site.archetype: <name>`) or composition skeleton imported in the prototype |

If `portal/` or `prototype/` contains substantive HTML/CSS (≥500 lines or ≥3 hand-coded routes) AND no forge-pipeline evidence files exist, flag as `FORGE_PIPELINE_BYPASSED` and BLOCK Stage 3 completion.

For Tier 0 (no prototype) and Tier 1 initiatives whose `blueprint.yml` declares `forge_pipeline.skip: true` with a reason, the check passes with `STATUS: SKIPPED-BY-DECLARATION` and the reason logged. Skipping must be explicit; silence on the field is treated as default-required.

**Check B — JTBD acceptance criteria satisfied by prototype surfaces.** For every Stage 1 JTBD with `acceptance:` criteria, verify the prototype contains a surface that *plausibly* satisfies the criteria. The reviewer cannot mechanically test "within 5 seconds, sees 3+ named products" — it instead checks that the surface named in the JTBD exists, has a section identifiable as the surface's "above-the-fold," and the acceptance criteria's named elements (e.g., "3+ named products with live URLs") have corresponding selectors in the prototype HTML.

This is a weak check by design — strict mechanical verification (Playwright-driven timed assertions) would belong in a Stage 6 smoke test, not a Stage 3 gate. The Stage 3 gate's job is to surface "the prototype doesn't even have a section that COULD satisfy this JTBD" before the operator runs forge tools against a brief that's missing constraints.

## Rationale

1. **One root cause, three encoding points.** The failure spans Stage 1→2 (information loss), Stage 2→3 (positioning drift), and Stage 3→4 (procedure bypass). A single reviewer can't catch all three because the failure modes are different at each layer. Three reviewers, one ADR — the decision is the meta-pattern, the reviewers are the encoding.

2. **JTBD is testable; positioning isn't.** "Surface receipt density" cannot fail a check. "Visitor sees 3+ named products in 5 seconds" can. The methodology already produces JTBD-shaped artifacts at Stage 1 (personas + funnel); the work is preventing Stage 2/3 from losing them.

3. **Forge-pipeline gate respects consumer agency.** Some initiatives (greenfield products with novel UI patterns; Tier 0 research-only initiatives) shouldn't be forced through `forge-brand`. The `forge_pipeline.skip: true` declaration is the operator's explicit "I know what I'm doing here." Silence on the field defaults to required because silence is exactly what produced the failures.

4. **Weak prototype-satisfaction check is a feature, not a bug.** Mechanical "did the prototype meet the timed JTBD" testing belongs in Stage 6 (`prototype-smoke-runner` already exists for that). The Stage 3 reviewer's job is to surface "this prototype has no surface that could ever satisfy this JTBD" — that's a structural check, not a behavioral one.

## Consequences

### Breaking

- **All in-flight greenfield + brownfield consumers must add JTBD to existing personas.** The Stage 1 reviewer will start blocking until personas have `jtbd:` blocks. Migration: walk each existing `research/personas/<persona>.md`, derive the JTBD from the funnel artifact (which already captures arrival-path + intent), add the four required fields.
- **All in-flight brownfield + midstream consumers must add `serves_jtbd:` to each prescription item.** The Stage 2→3 reviewer will block until prescription items either trace to a JTBD or declare `serves_jtbd: none-deferred` with a reason.
- **All in-flight consumers with substantive `portal/` or `prototype/` content must either show forge-pipeline evidence OR declare `forge_pipeline.skip: true` with a reason.** The Stage 3 completion reviewer will block portal-touching commits until one of those is present.

### Non-breaking

- The chrome-canonical reviewer (wave 3 → wave 6) is unaffected. Chrome integrity and JTBD/forge gates are orthogonal.
- The portal-pattern-{A,B}-conformance reviewers are unaffected. They check structural shape (drawers populated, comparison toggle wired); the new gate checks information flow.
- Greenfield uses `design-principles-reviewer` instead of `prescription-jtbd-traceability-reviewer`; the greenfield equivalent is a future ADR.

### Migration for in-flight consumers

```bash
# Per-consumer migration order:

# 1. Add JTBD blocks to existing personas
# Walk research/personas/, derive JTBD from funnel + arrival paths,
# add a `jtbd:` block to each persona file with surface/time-budget/
# job/acceptance for every page in the funnel.

# 2. Add serves_jtbd traceability to prescription items
# Each item in 02-prescription.yml (brownfield) or prescription.yml
# (midstream) gains a serves_jtbd: [<persona>/<surface>/<job-slug>]
# field. Items that genuinely don't serve a JTBD declare
# serves_jtbd: none-deferred with a reason.

# 3. Run forge pipeline OR declare skip
# Either run forge-brand init --from-exploration with Stage 1+2 docs as
# discovery input, generate brand-kit + tokens + bridge exports, run
# forge-signal + gen-images, build prototype against forge-site archetype.
# OR declare in blueprint.yml:
#   forge_pipeline:
#     skip: true
#     reason: "Tier 0 research-only — no prototype"
```

Per the methodology freeze rule, this lands in the methodology repo first; consumer initiatives migrate sequentially.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Single combined "Stage 1-3 information flow" reviewer | Conflates three different check points (presence at Stage 1, trace at Stage 2, satisfaction at Stage 3). Single reviewer would need to re-derive context at each invocation; three reviewers stay focused and composable. |
| Mechanical Playwright-driven JTBD satisfaction at Stage 3 | Belongs at Stage 6 (`prototype-smoke-runner` already does this kind of work). Stage 3 should be structural — "could this prototype ever satisfy" — not behavioral. |
| Make forge-pipeline mandatory with no skip declaration | Forces forge-brand on Tier 0 research-only initiatives where it's irrelevant. The explicit-skip-with-reason pattern preserves operator agency without allowing silent bypass. |
| Wait for a third instance before encoding | Already two instances in one project, plus the meta-pattern from wave 6's four amendments. The rate of surfacing exceeds the rate of encoding; waiting compounds the backlog. |

## Follow-ups

- **Greenfield JTBD-trace reviewer.** `design-principles-reviewer` (the greenfield Stage 2→3 gate) should grow an equivalent JTBD-trace check. Greenfield's artifact shape differs (design-brief vs prescription); the trace mechanism transfers but the file targets don't. Defer until the next greenfield consumer hits the failure.
- **Stage 6 mechanical JTBD verification.** `prototype-smoke-runner` could drive browse-tool through each JTBD's acceptance criteria and measure satisfaction (time-to-fold, element counts, click depth to action). Defer until Stage 3 weak check is field-tested.
- **Forge-pipeline evidence schema.** This ADR enumerates expected files per tool informally. A `forge-provenance.json` manifest at the consumer root (written by each forge tool on run) would let the reviewer do exact lookups instead of pattern-matching. Defer to a future ADR (likely paired with `forge-brand` extension to emit it).
