# Handoff — BigBlueprint v3 Variant Taxonomy

**Session date**: 2026-05-25
**Status**: Open work. Predecessor session identified the failure; this session resolves it.
**Resume by reading**: this file → `METHODOLOGY-v2-harness-engineering-patch.md` → `HANDOFF-v2-patch.md` → `METHODOLOGY.md`.
**Do NOT read**: the full predecessor session's transcript. The relevant failure modes are summarized below; the rest is noise.

## The intent

Blueprint must work for **three distinct project lifecycles**, each with its own variant. Currently only one is formally codified and one is emerging — the third is missing entirely, and the absence is what produced the retrofit pattern across Rally HQ, website-nc-v3, and bc-subscriptions.

| Lifecycle | Project state | Variant | Status today |
|---|---|---|---|
| **Greenfield** | New product. No existing surfaces. North-star-driven. | Build: research → design-principles → prototype → fact-check → docs → deploy → iterate | Formally codified in `METHODOLOGY.md` (this is the current "standard" pipeline) |
| **Midstream** | Active product, mid-development. Prototype extends or revises something in flight. | Hybrid: lightweight diagnose against current state + prototype against the gap | **Missing.** Rally HQ + bc-subscriptions both needed this; both got force-fit into greenfield pattern; both produced retrofit feel. |
| **Brownfield** | Mature product. Audit-first. Prototype optional. | Audit: diagnose → prescription → design brief → prototype (optional) | Emerging informally. website-nc-v3 used a numbered 01/02/03 variant; blog adopted same pattern with explicit stage gating. Not yet in canonical methodology. |

Until all three are formalized and **variant-selection happens at project init**, the methodology defaults to the build variant — which is wrong for two of the three lifecycles.

## The failure modes that surfaced this

Predecessor session ran the blog blueprint and surfaced two structural failures:

### Failure 1 — Stage 0 applied; rest of methodology skipped

The v2 patch added Stage 0 (Application Legibility, browse-tool default) and the predecessor session applied it to three consumers (Rally HQ, website-nc-v3, blog). For all three, only Stage 0 landed; Stages 1-7 (or 1-4 in the audit variant) remained undone. The pattern: Stage 0 is easy because it's pure additive; subsequent stages require sustained work without a forcing function, so the work stops at the path of least resistance.

### Failure 2 — Stage 1 declared "complete" with only one of four research legs done

In the blog blueprint specifically: `blueprint.yml` declared four required Stage 1 sub-deliverables (`research/current-state/`, `research/personas/`, `research/funnel/`, `research/competitive/`). The predecessor session populated current-state + personas, wrote `01-diagnose.md` summarizing them, and reported back. The empty `funnel/` and `competitive/` directories sat next to the "complete" diagnose without triggering anything.

Both failures share a root cause: **no programmatic enforcement of stage completion**. The "complete" signal is agent self-attestation. The Codex harness puts named reviewer agents at gates; the v2 patch deferred Increment 2 (reviewer agents) and this is the consequence.

## What's in place today

| Artifact | Path | State |
|---|---|---|
| Canonical methodology | `wip/big-blueprint/METHODOLOGY.md` | Codifies build-variant only |
| v2 patch (Stage 0 + reviewer agents + janitor + invariants) | `wip/big-blueprint/METHODOLOGY-v2-harness-engineering-patch.md` | Increment 1 landed; Increments 2-3 deferred |
| Stage 0 reference | `wip/big-blueprint/docs/browser-legibility.md` | Done |
| Template | `wip/big-blueprint/template/CLAUDE.md` | Has Stage 0 block; otherwise unchanged |
| Rally HQ blueprint | `apps/rally-hq/blueprint/CLAUDE.md` | Stage 0 only |
| website-nc-v3 blueprint | `apps/website-nc-v3/blueprint/CLAUDE.md` | Stage 0 only; project itself has informal 01/02/03 brownfield variant |
| Blog blueprint | `apps/blog/blueprint/` | Stage 0 + first-pass Stage 1 (incomplete — 2 of 4 research legs done). **PAUSED.** |
| bc-subscriptions | `wip/bc-subscriptions/` | Not yet touched; gated until next active session |

## What this session produces

Five deliverables, in order:

### 1. Variant taxonomy in `METHODOLOGY.md`

Add a top-level "Variant selection" section that defines the three lifecycles with their stage shapes, decision criteria, and example projects. The taxonomy is the entry point for any new blueprint: "What kind of project is this?" → "Pick this variant."

### 2. Pattern-match rules

A short decision tree the agent (or human) runs at project init to determine the right variant:

- Does the product exist in production? → No → Greenfield
- Does the product exist but the prototype is for active in-flight work? → Yes → Midstream
- Does the product exist and the work is audit-first, possibly without prototype? → Yes → Brownfield

These rules become a `wip/big-blueprint/docs/variant-selection.md` doc, the way `browser-legibility.md` is the canonical Stage 0 reference.

### 3. Stage definitions per variant

Each variant gets:
- Its stage sequence (named, ordered)
- Required sub-deliverables per stage (with explicit listing — not implicit)
- Stage gate criteria (what must exist before the next stage starts)
- Variant-specific reviewer agent assignments

Build-variant inherits today's `METHODOLOGY.md`. Audit-variant codifies the website-nc-v3/blog pattern. Midstream-variant is new — needs design.

### 4. Reviewer agents (promoted from v2 patch Increment 2)

Six reviewer agents at minimum, mapping to stage gates:

| Agent | Gate | Required by variant |
|---|---|---|
| `research-completeness-reviewer` | Stage 1 → Stage 2 | All variants |
| `prescription-evidence-reviewer` | Stage 2 → Stage 3 (brownfield); Stage 2 → Stage 3 (midstream) | Audit + midstream |
| `design-principles-reviewer` | Stage 2 → Stage 3 (greenfield) | Build |
| `fact-check-loop-reviewer` | Stage 4 convergence | All variants |
| `doc-quality-auditor` | Stage 5 → Stage 6 | All variants |
| `prototype-smoke-runner` | Stage 4/Stage 6 ship gate | Build + midstream |

Definitions live in `wip/big-blueprint/template/.claude/agents/`. The three open questions from the v2 patch (location, runtime, smoke-flake policy) need to be resolved here — they were deferred in the predecessor session.

### 5. Re-apply the right variant to existing consumers

After the taxonomy lands:

- **Rally HQ**: switch from forced-build to midstream variant. Adopt the missing diagnose + prescription stages calibrated for "active in-flight work."
- **website-nc-v3**: formalize its informal three-stage pattern as the brownfield variant. Promote `01-diagnose.md` / `02-prescription.yml` / `03-design-brief.md` to canonical artifacts.
- **Blog**: switch from informal audit-variant to formal audit-variant (mostly cleanup). Resume Stage 1 with `research-completeness-reviewer` enforcing completion of all four legs. The 2 already-done legs (current-state + personas) stay; the 2 missing legs (funnel + competitive) get populated with reviewer enforcement.
- **bc-subscriptions**: gated until next active session; will use whichever variant fits when it reopens.

## What this session does NOT do

- **Does not redo the blog audit.** The 12 screenshots + 5 persona files + first-pass `01-diagnose.md` stay. The diagnose gets *amended* (not rewritten) once reviewer agents enforce completion.
- **Does not touch the harness engineering counterpoint** published in the predecessor session. That's done and shipped.
- **Does not change the Stage 0 browser sensor pattern.** That's working; the v2 patch Increment 1 stands.
- **Does not litigate "context engineer" vs "harness engineer" labels.** The v3 redesign decision (don't pivot the noun) stands.

## Recommended sequence on resume

1. **Read this handoff + `METHODOLOGY-v2-harness-engineering-patch.md` + `HANDOFF-v2-patch.md`** (~15 min). The v2 handoff names the deferred reviewer agents and three open questions — those questions need resolution here.

2. **Draft `docs/variant-selection.md`** with the three-variant taxonomy + pattern-match decision tree. Short doc, ~150 lines.

3. **Update `METHODOLOGY.md`** to add a "Variant selection" top-level section that points at the new doc. Don't restructure existing content; this is additive.

4. **Resolve the three open questions from v2 patch Increment 2** before drafting reviewer agents. Specifically:
   - Reviewer agent location: shared at `template/.claude/agents/` vs per-initiative. Recommendation: shared, because variant-aware reviewer behavior is the multiplier.
   - Convergence loop runtime: single orchestrator vs worktree-per-reviewer. Recommendation: single orchestrator initially; promote to worktree-per-reviewer when stake increases.
   - Smoke-flake policy: block vs follow-up runs. Recommendation: block for share-link-to-stakeholder paths; follow-up runs for internal-only paths.

5. **Draft reviewer agents** under `wip/big-blueprint/template/.claude/agents/`. Start with `research-completeness-reviewer` because it's the one that would have caught the blog Stage 1 failure.

6. **Define stage definitions for the midstream variant.** This is the new variant; needs the most design work. Look at what Rally HQ + bc-subscriptions actually needed and back-derive from there.

7. **Re-apply variants to consumers** in order: blog (cleanup, mostly mechanical) → Rally HQ (midstream variant adoption) → website-nc-v3 (formalize brownfield) → bc-subscriptions (gated; defer).

## What success looks like

A blueprint that:

- Pattern-matches the lifecycle of any new project at init
- Picks the right variant automatically (or with one human confirmation)
- Has reviewer agents at every gate that block premature stage completion
- Allows greenfield, midstream, and brownfield projects to use the same methodology without any of them feeling retrofit
- Re-applies cleanly back onto the blog (and the other consumers) without requiring re-litigation of decisions already made

The test for the fresh session: at the end, opening any of the four consumers should feel structurally identical — different variant, same discipline. No retrofit feel anywhere.

## Cross-references

- v2 patch source: `wip/big-blueprint/METHODOLOGY-v2-harness-engineering-patch.md`
- v2 handoff: `wip/big-blueprint/HANDOFF-v2-patch.md`
- Stage 0 reference: `wip/big-blueprint/docs/browser-legibility.md`
- Canonical methodology: `wip/big-blueprint/METHODOLOGY.md`
- Blog blueprint (paused): `apps/blog/blueprint/`
- Rally HQ blueprint: `apps/rally-hq/blueprint/`
- website-nc-v3 blueprint: `apps/website-nc-v3/blueprint/`
- Origin of this handoff: 2026-05-25 session where Nino flagged "why did I have to tell you to do this?" — the question that converted a tactical reviewer-agent draft into a structural variant-taxonomy revision.
