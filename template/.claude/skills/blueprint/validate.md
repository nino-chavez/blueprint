# /blueprint-validate

Validation phase of a BigBlueprint initiative. Fact-checks claims, audits copy/UX, and verifies feasibility against source code — structured as a diagnosis loop, not a static checklist.

## When to use

Before sharing any deliverable with stakeholders. Run after docs and prototype are built, and again after any revision.

## Why diagnose-shaped, not checklist-shaped

The previous version was a five-check checklist. Checklists pass each item independently and can miss patterns where multiple inaccuracies share a root cause. The diagnose structure forces: build a feedback loop → reproduce the failure → hypothesize root cause → fix at the cause, not the symptom.

A blueprint with three "inaccurate cost figures" and two "wrong terminology references" probably has *one* underlying cause (an outdated source the writer pulled from) — not five separate copy edits.

## Process

### Phase 1 — Build feedback loops (one per claim category)

A feedback loop in this context is anything that gives a fast, deterministic accuracy verdict on a claim. Build one per category before validating:

| Claim category | Feedback loop |
|---|---|
| **Current product behavior** | Open the relevant screenshot in `prototype/screenshots/`. Loop = visual match check + transcribed UI text comparison. |
| **Codebase capability** | If `research.codebase_path` is set: a grep/file-read script that confirms the claimed module/method/route exists. |
| **Quantitative claims** | A snippet that re-derives the number from its source (CSV, query result, citation). |
| **Terminology consistency** | A regex sweep across all docs + prototype copy looking for forbidden synonyms (e.g., "deflection" — see anti-patterns in CLAUDE.md). |
| **Citation completeness** | Every numerical/factual claim must have a source. Loop = grep for assertion patterns, check for adjacent citation. |

**A 30-second flaky validation pass is barely better than none.** Iterate on the loops:
- Cache the screenshot OCR
- Pre-index the source files
- Pre-compile the citation pattern set

Goal: any claim can be re-verified in under 5 seconds.

### Phase 2 — Reproduce

Run all loops. Capture every failure. For each failure confirm:
- [ ] The failure is the *real* claim, not a false positive (e.g., the regex matched a quoted example, not an actual claim)
- [ ] The failure mode is documented exactly (what the doc says vs. what the source says)
- [ ] The failure is reproducible — re-running gives the same verdict

Do not move to hypothesise until you've reproduced and tagged every failure.

### Phase 3 — Hypothesise root causes

For each cluster of related failures, generate 2-3 ranked hypotheses. **Do not single-fix without checking for patterns.**

Common cluster shapes in BigBlueprint validation:

| Pattern | Hypothesis | Prediction |
|---|---|---|
| Multiple wrong cost figures | "Pulled from an outdated pricing page snapshot" | Re-pulling current source matches all wrong figures |
| Multiple wrong terminology | "Strategy doc was drafted before terminology was finalized" | All wrong terms appear in one doc; later docs are clean |
| Multiple "feature exists" claims that are wrong | "Reading from product roadmap, not codebase" | All wrong claims are forward-looking features |
| Multiple unverifiable claims | "Source citation step was skipped" | Every unverifiable claim was added in the same revision |
| Inconsistent across docs | "No single source of truth — each doc cites independently" | Docs disagree because they pulled from different revisions |

Show the ranked hypotheses to the user before fixing. They have context that re-ranks instantly.

### Phase 4 — Instrument

For each top hypothesis, run one specific check that would distinguish it from alternatives. Examples:

- "Outdated source" → find the source's modification date; compare to doc draft date
- "Drafted pre-finalization" → check git history for when the doc was first written vs. when terminology was decided
- "Skipped citation step" → grep for assertion verbs (claims, shows, indicates) without nearby citations

**Do not start fixing yet.** Confirm the cause first.

### Phase 5 — Fix at the root + regression seam

For each confirmed root cause:

1. **Fix the source first**, then propagate the fix downstream. If the root cause was "outdated pricing snapshot," update the pricing reference in the research folder, then re-derive the affected claims.
2. **Add a regression seam** so this category of failure can be caught earlier next time:
   - For source-drift: add a "source freshness" check to `/blueprint-research`
   - For terminology drift: add the forbidden term to CLAUDE.md anti-patterns + the regex sweep
   - For missing citations: add a "no orphan claim" pre-check
3. **Apply the propagated fix** to every affected location (doc, prototype, deck).
4. **Re-run the Phase 1 feedback loops** against the affected areas. All loops must pass.

If no regression seam is possible, that itself is a finding — flag for the next initiative's process improvements.

### Phase 6 — Cleanup + handoff

Required before declaring validation passed:

- [ ] All Phase 1 loops pass (or remaining failures are documented as accepted, with rationale)
- [ ] Regression seams added (or absence noted as findings)
- [ ] Each cluster of failures has a documented root cause + fix
- [ ] Validation report written to `validation/[date]-validate.md`

**Then ask: what would have prevented this entire validation pass from finding anything?** That answer points to upstream improvements — usually in `/blueprint-research` or `/blueprint-docs`. Make the recommendation after the validation pass, not before.

## Output

Validation report at `validation/[date]-validate.md` with:

- Phase 1: Feedback loops constructed (one per category, with re-run command)
- Phase 2: Reproduction results (every claim, verdict, source location)
- Phase 3: Hypothesis clusters and rankings
- Phase 4: Probe results (which hypothesis was confirmed for each cluster)
- Phase 5: Root-cause fixes applied + regression seams added
- Phase 6: Cleanup confirmation + upstream improvement recommendations

Severity ranking applied to remaining issues: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW**. Critical = stakeholder-visible falsehood; High = internally embarrassing inaccuracy; Medium = minor terminology drift; Low = cosmetic.

## When to re-run

- After any document revision
- After prototype copy changes
- After new research is incorporated
- Before every deployment
- After fixing one cluster — re-run feedback loops to confirm the fix didn't introduce new issues

## Lineage

Phase structure adapted from [matt-pocock/skills `diagnose`](https://github.com/mattpocock/skills) (MIT). The original BigBlueprint validate checklist's content is preserved in the loop construction (Phase 1) and severity ranking; the diagnostic structure is the addition.
