---
canonical: false
---

# Archived Handoffs

These docs produced four-way root-doc drift in 2026-05-25's three-session reconciliation: METHODOLOGY.md, METHODOLOGY-v2-harness-engineering-patch.md, HANDOFF-v2-patch.md, HANDOFF-v3-variant-taxonomy.md all answered "what is Blueprint" differently. Three live consumer sessions reasoned from first principles instead of reading any of them.

**The single source of truth is now `METHODOLOGY.md`.** These archives are historical record only. Do not load them into a Blueprint session as canonical context.

| File | What it was | Where its content lives now |
|---|---|---|
| `METHODOLOGY-v2-harness-engineering-patch.md` | v2 patch introducing the first-principle + reviewer set | METHODOLOGY.md § "First Principle" + reviewer roster |
| `HANDOFF-v2-patch.md` | Increment-2 handoff between v2 patch sessions | Superseded by reviewers landing in `template/.claude/agents/blueprint/reviewers/` |
| `HANDOFF-v3-variant-taxonomy.md` | v3 variant taxonomy handoff | `docs/variant-selection.md` |

If a current doc still links to one of these by name, the link points here on purpose — it preserves history without promoting the drift sources back to canonical status.

Archived 2026-05-25 as part of the three-session reconciliation. See `docs/2026-05-25-three-session-reconciliation.md` for the failure-mode write-up.
