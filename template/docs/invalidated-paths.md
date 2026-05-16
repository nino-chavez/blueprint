---
canonical: true
---

# Invalidated-Paths Register — <Initiative Name>

> **What this is:** A register of paths/approaches this project has **explicitly ruled out**, with the date, source decision, and the pattern future proposals will recognize. This is NOT a backlog or to-do list. Every entry below points at a proposal/approach the project considered and rejected.
>
> **What this is for:**
> - **Future-proposal triage** — when a new proposal lands that re-proposes a ruled-out path, the reviewer cites the entry here rather than re-running the analysis
> - **Onboarding context** — new contributors / agents see the "and here's what we tried that didn't work" half of the design history
> - **ADR cross-reference target** — ADRs that supersede prior decisions link to the matching `IP-NN` entry
>
> **What this is NOT:**
> - Not a backlog (work items live in tickets / proposals)
> - Not a deprecation log (deprecations are about removed code; this is about rejected proposals)
> - Not exhaustive — entries here are *load-bearing* rejections (the kind future agents would re-propose), not every option considered

**Authority:** Each entry cites the source ADR + synthesis + memory + audit. Entries are **immutable once added**; supersession is via new entries that reference the prior one (`Supersedes: IP-NN`).

**Maintenance cadence:**
- On ratification of a new ADR with deferred-build or supersession: add the corresponding invalidated-path entry in the same PR.
- On synthesis of a `[Decision]` that resolves a fork: if the rejected option is the kind of thing future agents would re-propose, add an entry.
- Quarterly review (optional): mark entries as `## ARCHIVED` if the context truly no longer applies (rare).

**Companion registers:**
- `differentiators.md` — the positive register ("things this project does that comparable products don't")

**Source pattern:** See `~/Workspace/dev/tools/big-blueprint/docs/register-pattern.md` for the shared register discipline used by this and the differentiators register.

---

## How to seed this register

Comb these sources for "ruled out" decisions and convert each into an entry below:

1. **ADR `Superseded-by` chains** — every supersession is an invalidated-path (the superseded approach is the ruled-out one)
2. **Synthesis notes** — anywhere a proposal was rejected during synthesis with a stated reason
3. **Memory entries flagged as pivots** — major direction changes ("we used to think X")
4. **Audit findings that reversed prior claims** — the prior claim is the invalidated path

Start with 5-10 seed entries from the project's history. Sparse registers don't help; aim for enough that future proposals find a hit.

---

## Per-entry format

```markdown
## IP-NN — <short title naming the ruled-out approach>

**Source:** <ADR-NNNN + synthesis-ID + memory-entry-name + audit ref>
**Ruled out:** YYYY-MM-DD
**What was proposed:** <one line — the approach future agents might propose>
**Why ruled out:** <2-3 lines — the reason it was rejected, with enough detail that a future agent can judge whether their context is genuinely different>
**Where future proposals hit this:** <pattern — keywords/framing a re-proposal would use, so this entry is findable by search>
**Supersedes:** <IP-NN if applicable> (optional)
```

---

<!-- Section headers below; uncomment / add as the register grows. -->

<!--
## Architecture

(architecture-domain entries)

## Methodology

(methodology / workflow entries)

## Process

(process / tooling entries)

## Platform

(platform / vendor-integration entries)
-->

---

## Entries

(none yet — seed by combing the sources listed above)

<!--
EXAMPLE entry shape — delete after writing real ones:

## IP-01 — Separate delivery repos per surface

**Source:** synthesis #525 + memory `one-repo-strategy`
**Ruled out:** 2026-05-08
**What was proposed:** Split the project into per-surface delivery repos (admin app, storefront, API each in own repo)
**Why ruled out:** Delivery collapsed into the spec repo; prototype is the design oracle, and tight feedback between spec and delivery is more valuable than the per-surface independence. Per-surface deploys can be path-scoped within one repo.
**Where future proposals hit this:** "let's split out a delivery repo for X" / "monorepo is slowing us down" / "the admin app needs its own repo for CI isolation"
-->
