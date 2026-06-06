---
canonical: true
---

# Differentiators Register — <Initiative Name>

> **What this is:** A register of things this project **already does** that comparable products **do not**. This is NOT a backlog or to-do list. Every entry below points at a shipped capability or in-place discipline. The doc exists to publicize, protect, and cite — not to build.
>
> **What this is for:**
> - **Partner / engineering-review evidence** — single artifact answering "what makes this project different?"
> - **Erosion protection** — if a future PR proposes a change that would unwind a differentiator, the reviewer sees the deliberate-divergence context here
> - **ADR cross-reference target** — ADRs that establish a differentiator link to the matching `D-NN` entry
>
> **What this is NOT:**
> - Not a feature roadmap (work items live in tickets / proposals)
> - Not a marketing pitch (it's the evidence base; marketing pulls from here)
> - Not exhaustive — entries here are *audit-surfaced* divergences, not every code-level distinctive

**Companion register:**
- `invalidated-paths.md` — the inverse register ("things this project ruled out, with reasons")

**Authority:** Each entry cites the source audit + finding tag + (where applicable) a `_state.json` capability ID confirming current implementation state. Entries are **immutable once added**; supersession is via new entries that reference the prior one.

**Maintenance cadence:**
- Quarterly review during release planning
- New ADRs with `### Differentiator` content add an entry here as part of ratification

**Source pattern:** See `$BLUEPRINT_HOME/docs/register-pattern.md` for the shared register discipline.

---

## When to use this register

Apply when:
- The project has identifiable peer products (competitive positioning matters)
- Partner / engineering-review evidence is needed
- The team has had erosion incidents where a refactor unwound a deliberate divergence

Skip if:
- No direct peer products
- Competitive positioning is irrelevant (internal tooling, research, single-purpose utility)
- The team has no recurring "what makes us different?" question to answer

---

## How to seed this register

1. Run / commission a comparison audit against 1-2 peer products
2. Extract divergences where this project's approach is materially different (not just "we use X library, they use Y")
3. For each, write an entry naming the source audit + the capability/discipline + the evidence

Sparse registers don't help; aim for 5-10 seed entries from initial audits.

---

## Per-entry format

```markdown
## D-NN — <short title naming the differentiator>

**Source:** <audit ref + section number>
**Claim:** <one line — what this project does that peer doesn't>
**Why it's a differentiator:** <2-3 lines — what the divergence achieves>
**Evidence:** <code path + state-derive capability ID + UI screenshot ref>
```

---

## Entries

(none yet — seed via comparison audit)

<!--
EXAMPLE entry shape — delete after writing real ones:

## D-01 — Flatter subscription FSM

**Source:** WCSubs F4.1 comparison audit
**Claim:** This project uses 5 lifecycle statuses (active / paused / cancelled / failed / expired) without inheriting from a parent Order entity. WCSubs uses 7 statuses inherited from `WC_Order`.
**Why it's a differentiator:** Charge-centric model decouples subscription state from order-level concerns. Subscriptions don't carry shipping/refund state because those live on the associated BC orders.
**Evidence:** `apps/api/src/types/subscription-status.ts`; FSM transitions enforced via `bigeng-04-typed-errors` state-derive entry: COMPLIANT.
-->
