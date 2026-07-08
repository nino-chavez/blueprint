---
canonical: false
---

# Session State — <Initiative Name>

> Running operational state. Update as you work. Distinct from forward-looking spec
> (which lives in BRD/PRD/proposed-changes). This is *what's true right now*.

---

## ⚠ Tiered usage — read this first

This file ships in the template scaffold as a **fallback** for solo projects without a coordination substrate. If your project enables Hive, state-derive, or has an ADR pattern, **skip the corresponding sections below** rather than maintaining duplicate state. Hand-maintained state that competes with derived state always drifts.

| Section | Skip when | Use instead |
|---|---|---|
| **Key Decisions** table | Project has `docs/decisions/` ADRs OR Hive `hive_log_decision` substrate | ADRs (authoritative); link from this file as `[D-NN → ADR-NNNN](docs/decisions/NNNN-*.md)` if you want a project-level index |
| **Active / Resolved Blockers** | Project has issue tracker (GitHub Issues, Linear, Jira) OR Hive task substrate | The tracker. This file can link to a saved filter URL, but don't re-state the blockers here. |
| **Current Status / Next Steps** | Project has `tools/state-derive/` or equivalent derived snapshot | The derived snapshot (`docs/audits/derived/_state.md` or similar). This file becomes a thin pointer. |
| **Stage / pipeline position** | Always — the stage machine derives it | `blueprint stage status` (ADR-0008): derives the current stage from artifacts-on-disk + recorded assertions. Never hand-maintain "we're at Stage N" here — the machine owns it, and a hand-copied cursor drifts. |
| **Session Log** | Project has commit history with conventional commits + Hive checkpoints | Git log + Hive trace. Append-only history is the commit graph. |
| **Patterns Established** | Project has ≥3 entries | Promote to `docs/lessons/` or a dedicated register; STATE.md is the wrong home once it grows past a few entries |

**The anti-pattern this guidance prevents:** STATE.md becomes a parallel decision register that drifts from ADRs, a parallel blocker tracker that drifts from issues, and a parallel session log that drifts from git. Three drift surfaces, none authoritative, all hand-maintained. See `$BLUEPRINT_HOME/docs/patterns/doc-discipline-micro-patterns.md` § "Avoid multi-role template files" for the rationale.

**If your project has Hive + state-derive + ADRs:** you probably don't need STATE.md at all. Delete it and rely on the derived sources. The `blueprint-example` project filed retirement of its STATE.md in Hive #929 for exactly this reason.

---

## Current Status

> Skip if `tools/state-derive/` is in place; link to the derived snapshot instead.

- **Phase**: <Research / Design / Implementation / Validation / Ship>
- **Last Session**: <YYYY-MM-DD>
- **Next Steps**: <1-3 concrete next moves>

## Key Decisions

> **Skip this section if the project has ADRs or Hive `hive_log_decision`.** ADRs are authoritative; this table just creates drift.

| # | Decision | Date | Context |
|---|----------|------|---------|
| S-01 | <decision> | YYYY-MM-DD | <one-line context or link> |

## Active Blockers

> **Skip this section if the project has an issue tracker or Hive task substrate.** Use the tracker.

> One section per blocker. Delete when resolved (move to Resolved Blockers section).

### B-01: <blocker title>

- **Issue**: <what's blocking>
- **Source**: <who/where flagged it>
- **Impact**: <what can't move forward>
- **Status**: <Pending / In-Progress / Awaiting Decision>
- **Resolution path**: <concrete steps to unblock>
- **Reference**: <link to spec/doc/issue/conversation>

## Resolved Blockers

> Append-only history of blockers that have been cleared.

(none yet)

## Patterns Established

> Working conventions discovered during execution. Note the *why* not just the *what*.
>
> **Promote out of STATE.md once this grows past ~3 entries** — patterns belong in `design_principles.md` or a dedicated `docs/patterns/` register, not buried in session state.

- (e.g.) Research docs go in `research/<category>/`; reference materials in `rag-ref/`
- (e.g.) Logic flows use ASCII decision trees in markdown rather than embedded diagrams

## Session Log

> **Skip this section if the project uses conventional commits + Hive checkpoints.** Git log is the append-only history.

> Append-only. Most recent at top. Include what was decided, what shifted, what's next.

### YYYY-MM-DD — <session title>

- <bullet of work done>
- <bullet of decisions made>
- <bullet of blockers discovered or resolved>
- <bullet of next-session entry point>
