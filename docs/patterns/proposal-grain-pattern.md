# Proposal-Grain Pattern — Right-Sizing Hive Issue Filing

**Purpose:** Codify the right unit of issue-filing for Hive substrate work. The default-of-one-proposal-per-slice pattern produces ~80% wasted issue-event workflow runs on short-lived wedges. This pattern names the cost, the signals for choosing grain, and the rule to follow.

**Last updated:** 2026-05-20

**Source:** `subs-initiative` Catalyst Phase-1 wedge (2026-05-20). 4 sister proposals (#809/#812/#814/#815) filed for slices that all merged within 30 minutes — none independently re-opened, none independently synthesized. The substrate cost (~32 issue-event workflow runs across open + close) was paid with no benefit returned. Hive #1371 ratified the rule.

---

## What this is for

A project using Hive (ai-hive substrate, embedded `.hive/`) files proposals for trackable work. Each proposal becomes a GitHub Issue with a full event cascade — `issues:[opened,closed,reopened,edited]` triggers 4–5 workflow runs per event in a typical setup (state-derive, hive-reconcile, parse-proposal-edges, populate-project-fields, backfill-hive-meta). Multiply by the issue's lifecycle (open → close → maybe edits) and a single proposal costs ~8 workflow runs.

The atomic-issue default treats every slice as if it deserves the same lifecycle infrastructure as a 6-month Epic. Most slices don't. They live <24h, never re-open independently, never independently synthesize.

This pattern: **graduate the filing grain so issue lifecycle is paid for only when its features are used.**

## The cost model

| Event | Workflows that fire | Approximate count |
|---|---|---|
| `issues: opened` | state-derive + hive-board-derive + parse-proposal-edges + populate-project-fields-on-issue + backfill-hive-meta | ~5 |
| `issues: closed` | state-derive + hive-reconcile + hive-board-derive | ~3 |
| `issues: edited` | All of the above (if not throttled) | ~5 |

A 4-slice wedge filed atomically = 4 × (5 open + 3 close) = **32 workflow runs just from proposal lifecycle.** Plus ~5 PR-event workflows per slice's PR = +20–40 more. Plus the dev→main sync's main-event cascade.

Aggregating those 4 slices under one parent proposal collapses the 32-count to **~8** (one open + one close on the parent).

## The two layers Hive already provides

The substrate has two primitives — we tend to conflate them:

| Primitive | Mirror to GH? | Event cost | What it's for |
|---|---|---|---|
| **Proposal** (`hive_propose`) | Yes — full event cascade | High (~8 runs/lifecycle) | Capital-S "ideas worth filing publicly" — strategic decisions, ADRs, tracked external risks |
| **Task** (`hive_create_task`) | No — Hive D1 only | Zero issue-events | Execution units — claimable by agents, file_scope locks, parallel-safe dispatch |

The corrective is to use **tasks for execution, proposals for the strategic surface**, rather than filing both for every slice.

## Grain rule

| Work shape | Filing |
|---|---|
| **Epic** (multi-week, multi-synthesis, multiple work streams) | Parent `[Epic-N]` proposal + child proposals per work stream |
| **Wedge** (<24h dispatch, 3–6 parallel-safe slices, single theme — TODO sweeps, related-fix bundles) | **ONE proposal + N Hive tasks** (no per-slice GH issues). Implementation PRs reference the wedge proposal in `closes #N`. The wedge proposal closes when the last slice merges. |
| **One-off slice** | One proposal |
| **ADR / strategic decision** | One proposal (pair with `[Spec]` if the ADR has deferred-build clauses) |
| **Spike / time-boxed investigation** | One proposal |
| **Tracked external risk** (platform bug, dependency upgrade) | One proposal — own lifecycle |

## The signal for wedge-grain

Three traits, all together:

1. **All slices land within ~24h.** Same operator, same session window, no inter-day handoff.
2. **No slice is expected to be independently re-opened.** A re-open implies the slice has its own lifecycle worth tracking on the GH issue board.
3. **No slice is expected to be independently synthesized.** A synthesis crossing slice boundaries works at the wedge level too — file the wedge as the synthesis subject.

When all three hold, **the per-slice GH issue is paying for features that are never used.** File as a wedge.

## The signal for atomic-grain (when each slice DOES earn its own proposal)

Even one of these means atomic is correct:

- Slice might re-open weeks later (e.g., partial close-out, follow-up bugs).
- Slice's lifecycle informs an independent synthesis trail.
- Slice represents a tracked external risk (separate from the wedge's main goal).
- Slice has stakeholders watching its specific GH issue.
- Slice spans days — too long for "wedge" framing.

## Dispatching a wedge under this rule

1. **File one proposal** — describe the theme + list the slices in the body as sub-items (numbered list with file scope per item).
2. **Create N Hive tasks** via `hive_create_task` — one per slice. Each gets a file_scope array; that's the per-slice lock. Tasks have UUIDs but no GH issue numbers.
3. **Dispatch agents** — each agent claims its task UUID (not a GH issue number).
4. **Each PR includes `closes #<wedge-proposal>` in the commit subject.** GitHub's auto-close fires on first matching close-keyword in the default-branch commit history. So one PR closes it; subsequent PRs from the same wedge are tracked via Hive task status (not GH closure).
5. **Optional: PR description summarizes which sub-item it implements** (e.g., "Implements sub-item B of #<wedge-proposal>"). Good for humans, not load-bearing.

## What about per-slice cross-references in syntheses?

Hive `hive_synthesize` operates on a corpus of proposals. If slices are aggregated under one wedge proposal, the synthesis cites the wedge — which is correct: the wedge IS the unit being decided about. Per-slice cross-refs are unnecessary when the wedge's body lists the sub-items inline.

If you LATER need a per-slice reference (e.g., one sub-item turns out to deserve its own follow-up), file the new proposal at that point. The cost paid then is justified by the new use case.

## When this pattern fails

- **Over-aggregation**: bundling slices that don't actually share a theme. The wedge proposal becomes incoherent and the substrate loses information.
- **Wedge that grows beyond 24h**: if a wedge's slices end up taking days, the lifecycle assumption breaks. At that point, split it into per-slice proposals retroactively (file new ones; don't try to retrofit).
- **Cross-team slices**: if different teams own different slices, each team's slice needs its own GH issue for stakeholder visibility. The wedge collapses across team boundaries.

## See also

- `tiered-orchestration-pattern.md` — wave-based PR sequencing; this pattern is the substrate-grain corollary
- `hive-coordination-pattern.md` — Hive substrate fundamentals
- `hive-closure-drift-sync-pattern.md` — what to do when issue closures fall out of sync with reality

## Implementation companion in subs-initiative

- [`WAYS-OF-WORKING.md` — Proposal taxonomy, Proposal grain rule section](the subscriptions initiative's repo (private)/blob/main/WAYS-OF-WORKING.md#proposal-grain-rule-hive-1371-ratified-2026-05-20) — the per-project codification.
- Hive #1371 — ratifying proposal.
- Adjacent CI cost-reduction levers (gitleaks → PR-only, derive-state throttle on `issues:edited`, state-derive-ci path narrowing, staleness exemption for auto-derived files) — same PR landed those alongside the grain rule.
