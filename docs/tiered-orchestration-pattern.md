# Tiered Orchestration — Walk-Away Model for Autonomous Implementation

**Purpose:** Capture the tiered agent model (Orchestrator / Specialist / Implementer / Janitor) and wave-based PR sequencing that lets a single operator dispatch large bodies of work to autonomous agents and walk away. Includes calibration discipline (don't ship default numbers — calibrate per project), anchor-don't-punt for fork decisions, and memory-as-inoculation when filing foundational specs.

**Last updated:** 2026-05-16

**Source:** `bc-subscriptions` autonomous-execution sessions (April–May 2026). Tier α 6-PR batch validated the empirical anchor; Hive #929 doc-reorg refined the orchestration discipline.

---

## What this is for

A project hits a point where one operator + one Opus session can no longer keep up with the work in flight — too many PRs, too many parallel decisions, too much waiting for sequential merges. The tiered model dispatches across agent tiers so the operator's attention becomes a scarce resource spent on judgment, not mechanical execution.

The goal is **walk-away time**: the operator goes to a meeting, returns N hours later, and finds N waves of work merged or escalated with clear stop-and-check points where their input is genuinely needed.

## The four tiers

| Tier | Model | Role | Cost gate |
|---|---|---|---|
| **Orchestrator** | Opus (operator's session) | Wave planning, conflict arbitration, ADR drafts, escalation triage, fork resolution | Always |
| **Specialist** | Opus subagent (foreground) | Spec authoring, complex multi-file integration design, platform-cap verification | Only when Sonnet would block |
| **Implementer** | Sonnet subagent (background) | TDD implementation from a clean spec, single-domain edits, migrations, route handlers | Default for all dispatch |
| **Janitor** | Sonnet subagent (background) | Rebase resolution, spec-compliance review, code-quality review | Post-implement |

**Cost discipline:** Opus is ~10x the cost of Sonnet. The Specialist tier exists to catch the cases where Sonnet would burn cycles on a stuck problem — better to spend Opus minutes than waste Sonnet hours.

## The walk-away loop (per wave)

```
1. Plan       (Orchestrator) — re-derive state, pick 4-6 parallel-safe slices,
                               draft [Spec] / [Decision-Fast] if needed, write
                               file-scoped dispatch dossiers
2. Dispatch   (Implementers, parallel bg) — N isolated worktrees, TDD, push, open PR
3. Poll+Merge (Orchestrator) — on green CI + scope-match → squash-merge
                               on conflict → Janitor for rebase
                               on platform-cap drift → Orchestrator pulls in
4. Transition (Orchestrator) — mark Hive tasks merged, re-run state-derive,
                               update memory if new pattern emerged
5. Repeat     until done or escalation hits
```

Operator attention per wave: ~5min on a smooth wave, 30-60min on a wave with conflicts.

## Wave sequencing — parallel vs sequential

A well-formed implementation plan annotates per-wave PR count and parallel-vs-sequential dependencies:

```markdown
### Wave 1 — foundation (4 PRs, parallel-safe)
- PR A: ...
- PR B: ...
- PR C: ...
- PR D: ...

### Wave 2 — opportunistic (6 PRs, parallel-safe)
- PR E-J: each touches different canonical files; no merge conflicts

### Wave 3 — retirements (3 PRs, sequential — wave 1 must land first)
- PR L: ... [Operator-Review-Required]
- PR M: ...
- PR N: ...
```

The annotation lets the orchestrator dispatch wave 1 immediately, wave 2 in parallel-after-wave-1, and wave 3 sequentially once dependencies settle. `[Operator-Review-Required]` tags flag PRs where the orchestrator pings the operator for diff review before merge (highest-risk changes).

## Calibration discipline — don't ship default numbers

The empirical anchors that worked for `bc-subscriptions`:
- Median Sonnet cycle: ~47min (including cascade-rebase)
- Parallel-safe wave size: ~6 PRs
- Cascade-rebase overhead: ~3.5× sequential cost

**Do not ship these as defaults for new projects.** They're calibration data from one project's surface (Cloudflare Workers + D1 + Svelte + React, ~150 doc surface, BC platform integration). A different project (different stack, different team velocity, different CI duration) will have different anchors.

The discipline:
1. Run waves 1-2 without anchors — let the project's actual cycle time and parallel-safe size emerge from telemetry.
2. After ~10 PRs through the loop, calibrate. Median cycle, conflict rate, cascade-rebase ratio.
3. From that point, plan waves against the project's own anchor.

## Stops (these escalate, do not auto-resolve)

The orchestrator escalates rather than working around these:

- **Spec edit needed** (PRD/BRD/ARCHITECTURE drift) → file `[Spec]`, pause that thread, keep others moving
- **Platform-cap drift** (vendor doc verification fails) → file ADR or `[Spike]`, park the thread
- **Security finding** (gitleaks / secret scan / CVE) → stop the wave, escalate to operator immediately
- **Operator-only task** (live sandbox testing, UI smoke, real payment flows) → tag `[Operator-Task]`, park the thread, loop continues around it
- **2× failed rebase attempts on same surface** → orchestrator takes over directly, do not retry blind

## Anchor-don't-punt — fork resolution discipline

Before filing a foundational `[Spec]` proposal, resolve forks the orchestrator can resolve with rationale + a logged decision. Punt to synthesis only when:

- (a) Picking wrong wastes >30min of work
- (b) Genuinely ambiguous (not just a continuation)
- (c) Scope expands materially beyond what was authorized

For every other fork: pick, log a `[Decision-Fast]` or memory entry with rationale and the trigger-to-revisit condition, move on.

**Why this matters:** Synthesis is expensive (operator attention, time-to-ratify). Punting forks you could have anchored means each fork takes a synthesis cycle to resolve. The discipline trades ~5min of orchestrator judgment for a multi-hour synthesis delay.

Worked example: `bc-subscriptions` Hive #929 had two structural forks (root vs `spec/`, single-vs-split register). Both anchored before filing with logged decision `ade0ccd5` capturing rationale + trigger-to-revisit. Synthesis ratifies the spec, not the forks.

## Memory-as-inoculation — when filing foundational [Spec]

Every foundational `[Spec]` proposal should be paired with a memory entry that points future sessions at the proposal:

```markdown
---
name: <project>-reorg-in-flight
description: <one-line summary>; check before proposing competing work
metadata:
  type: project
---

`[Spec]` proposal Hive #NNN filed YYYY-MM-DD — <what it does>.

Check before proposing: <list of specific things future sessions might re-propose that this spec already covers>.

Anchored forks: <fork 1>, <fork 2>. See decision `<id>`.
```

The memory entry catches the next session before it re-proposes work already in flight. Without it, a fresh agent reads canonical surfaces, doesn't see the in-flight spec, and refiles a competing proposal.

**Filing checklist for foundational Specs:**
1. `[Spec]` filed in Hive
2. Anchored forks logged as `[Decision-Fast]` with rationale + trigger-to-revisit
3. Memory entry written naming the spec + specific things future sessions might re-propose
4. (Optional) Slack/team digest announcing the spec

## When to use this pattern

| Practice | Activates when |
|---|---|
| Tiered orchestration (Orchestrator / Specialist / Implementer / Janitor) | Planned work > what one operator can hand-execute in a week |
| Wave sequencing with parallel-safe annotation | >3 PRs are parallel-safe in the planned work |
| Calibration before defaults | After ~10 PRs through the loop |
| Anchor-don't-punt | **Always** when filing foundational `[Spec]` proposals |
| Memory-as-inoculation | Project has persistent multi-session memory + foundational specs |

Skip when:
- Solo + sequential — one operator can hand-execute, no parallelism needed
- Pre-product spike where everything is in flux — orchestration overhead exceeds value
- No persistent memory across sessions — memory-inoculation is moot

## Origin

Distilled from `bc-subscriptions` autonomous-execution sessions (April–May 2026). The Tier α 6-PR batch (May 2026) validated the empirical anchors with `n=6, median=47.0min, σ=11.8min`. Hive #929 (2026-05-16) refined the anchor-don't-punt + memory-as-inoculation disciplines.
