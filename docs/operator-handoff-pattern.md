---
canonical: true
---

# Operator-Handoff Pattern

**Status**: Promoted 2026-05-27 wave 25 from converging consumer evidence (rally-hq + bc-subscriptions independently producing hand-written HANDOFF docs with overlapping structure).

**Last updated**: 2026-05-27

**Source evidence**:
- `apps/rally-hq/blueprint/HANDOFF-blueprint-template-gaps.md` (2026-05-25) — cross-repo dispatch handoff. 5 template additions identified by combining gaps rally-hq exposed with methodology framing the blog session articulated; handed off to a fresh `tools/blueprint` session to execute.
- `wip/bc-subscriptions/HANDOFF.md` (2026-05-06) — session-restart handoff. Hive bootstrap continuation context covering what's live, what's done, what's pending, and where secrets are cached locally.

**Related patterns**:
- [docs/prototype-vs-production-traceability-sweep.md](prototype-vs-production-traceability-sweep.md) § "Generative output formats (wave 24)" — sibling pattern: artifact-as-resumable-context for drift findings rather than for operator continuation
- [docs/2026-05-27-loom-inspiration-candidates.md](2026-05-27-loom-inspiration-candidates.md) C1 — the inspiration candidate this wave closes

---

## Why this pattern exists

Operators routinely write hand-crafted handoff docs at three transition types:

1. **Methodology stage transitions** — Stage N → N+1 within one initiative, when the next stage's operator is a different agent session
2. **Session restarts** — resume work after a cache window expires, a focus break, or a different machine
3. **Cross-repo dispatches** — work spawned in one repo continues in another (the rally-hq HANDOFF dispatched 5 additions from `apps/rally-hq` into `tools/blueprint` for execution)

Without a template, each operator re-derives the shape: state header, what-was-done, what's-pending, sequencing, scope-out. Two consumers independently produced docs with overlapping structure within the same week, signaling the shape is general enough to ship as a template rather than re-derive per initiative.

The scope refinement vs the original `2026-05-27-loom-inspiration-candidates.md` C1 framing: the evidence supports **operator-context handoffs broadly**, not stage-transition handoffs specifically. The three transition types above are the trigger set.

---

## The common shape

Distilled from the two consumer examples:

| Section | Purpose | rally-hq example | bc-subs example |
|---|---|---|---|
| State header | Date + working tree + last commit | "Date: 2026-05-25 — Origin: Rally HQ session..." | "Last updated: 2026-05-06 — Working tree — Most recent commit" |
| What's live | Currently-operating state the next operator inherits | (implicit — methodology state of the upstream repo) | "URLs / values / Cloudflare resources table" |
| What's done | Completed work the next operator can build on | (implicit — gaps already analyzed at consumer side) | Checklist: `[x] git subtree add of tpoolebigC/ai-hive...` |
| What's pending | Concrete next actions in priority/dependency order | "The five additions" with per-item sequencing | "What's pending" list |
| Sequencing | Dependency order for pending work | "Sequencing in the fresh session" (1→2→5→3→4) | implicit in list order |
| Local refs / secrets | Local-only state the next operator needs | (n/a — methodology repo is the destination, not the source) | "Local state — secrets (NEVER commit)" with path references |
| Out-of-scope | What this handoff is NOT | "What this doc is NOT" — explicit cap | implicit |

Not every section applies to every handoff. The template at `template/methodology/handoff/handoff-template.md` ships all sections; operators delete what doesn't apply.

---

## When to write one

- The next-stage operator is a different agent session and the stage transition carries non-trivial context (the agent can't recover state from `git log` + the canonical pipeline alone)
- A session restart is anticipated and the context window will expire before work resumes
- Work crosses repo boundaries (cross-repo dispatch — the destination operator opens a different working directory than the one that produced the handoff)
- A methodology promotion or amendment will be authored downstream, and the upstream session needs to preserve the reasoning that led to the promotion

**Skip when**:
- The work continues in the same session with no expected interruption
- A commit message + git log + a STATE.md or similar living doc gives the next reader everything they need
- The handoff would only restate the contents of `prescription.yml`, `synthesis.md`, or another stable artifact

---

## Why this is doc-pattern, not reviewer-enforced (yet)

The two consumer examples are operator-written voluntarily — no methodology rule forced their creation. This wave ships the template (lowers the cost of writing one); it does not add a reviewer gate (does not require one).

Two reasons:

1. **Demand is operator-driven, not methodology-driven.** The operator decides when handoff cost > template-fill cost. Forcing a handoff at every stage gate would over-fire — most stage transitions happen in a single session without a context break and don't need a written handoff.
2. **The evidence doesn't yet identify a recurring failure mode where a missing handoff demonstrably broke the next-stage work.** Both consumer examples are *successful* handoffs. The methodology rule's strongest version (reviewer-gated requirement) needs evidence of failure attributable to missing handoffs, which the audit didn't surface.

**Future amendment candidate**: when ≥2 consumers report stage-transition failures attributable to missing handoffs (and not, say, to missing tests or missing decision records), add a Stage N → N+1 reviewer that requires handoff presence as a gate condition. Until that evidence arrives, the template alone is the right intervention.

---

## What this pattern is and is not

- **Is**: a slot-filled template for operators to write a handoff faster + a canonical shape so downstream readers know where to look.
- **Is not**: a replacement for `STATE.md` (living per-initiative status), `prescription.yml` (change-item ledger), `METHODOLOGY-AMENDMENTS.md` (methodology-learning log), or `ARCHITECTURE.md` (architectural reference). Handoffs are momentary; the other artifacts are durable.

---

## Cross-reference

Promotes inspiration-candidate **C1** from `docs/2026-05-27-loom-inspiration-candidates.md` based on the consumer-evidence audit at the same date. Closes the C1 watch-and-promote loop. Loom's market analog (action-item extraction from a recording) is structurally similar but operates on the wrong source modality for Blueprint's shape — the handoffs operators write contain narrative reasoning, not just action items, and the template preserves both.
