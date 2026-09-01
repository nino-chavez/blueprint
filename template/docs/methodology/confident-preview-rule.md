---
canonical: true
---

# Confident Preview — Methodology Rule

A Blueprint portal is a stakeholder review surface, not a deliberation venue. Each route shows ONE confident take of what the team is proposing — not three competing variants walked through page-by-page, and not a tour of every option considered. Variant deliberation belongs upstream in Stage 2 (design-principles work) or in `decisions/` ADRs, not in the stakeholder-facing portal.

## Why this exists

On 2026-05-23, the `apps/blog` (Signal Dispatch) initiative reached mid-Stage-3 with an 11-variant portal — eleven complete shells, each presenting a different take of the same product, threaded together so a stakeholder could walk all of them. The intent was good: show the design-space considered. The effect was: stakeholder review collapsed into "which one do you like?" and the portal stopped functioning as a confident proposal.

The blog session's own diagnosis: "the portal is shaped as a deliberation venue, not a stakeholder review surface. Variant-walking is the correct shape for Stage 2 design-principles work. It is not correct for Stage 6 stakeholder portal review."

The cost was a Stage-3 rebuild — collapsing 11 variants to 1 confident preview, moving the deliberation evidence into ADRs and a Stage-2 design-principles doc.

The rule applies to both Pattern A (platform-portals) and Pattern B (redesign-review-portals). It was diagnosed against a Pattern B failure; the same shape can recur in Pattern A as multiple competing dashboard layouts threaded under one `inspect/` route.

## The rule, in two directions

1. **One confident preview per route.** Each portal route presents the team's current best take. Not "option A vs option B." Not "early sketch alongside polished version." Not "what we considered." The team converges before the portal lands.

2. **Comparison primitives are not variant-walking.** The Pattern B `PROPOSED / COMPARE / SHIPPED` toggle is a comparison primitive — proposed view vs what exists today, with stakeholders seeing both. That's not multiple variants of the proposed. The Pattern A audience switcher (`executive / evaluator / engineering`) is also a comparison primitive — same proposed, different framing. That's not multiple variants either.

If you find yourself wanting to ship `home-a.html` + `home-b.html` (or `dashboard-modern/` + `dashboard-classic/`), the answer is not "ship both for stakeholders to pick." The answer is: complete the convergence in Stage 2, write the ADR that explains why one was chosen, and ship the chosen one.

## When deliberation is appropriate

Stage 2 (design-principles). This is the place to walk through variants, weigh trade-offs, and converge. The artifacts of Stage 2 deliberation are:

- `prototype/DESIGN.md` (or `portal/DESIGN.md`) — the five rules the prototype follows, with rationale
- `decisions/NNNN-*.md` ADRs — discrete decisions ("we chose X over Y because Z") with the rejected alternative named
- Optional: `research/design-explorations/` — sketches, mockups, exploration artifacts kept for reference but never linked from the portal

The artifacts that give this deliberation somewhere to happen are the **experience brief** (`prototype/EXPERIENCE-BRIEF.md`) and the **divergent whole-screen concepts** converged by a selection ADR — see `judged-screen-pattern.md` § 2, which is where this rule's "upstream in Stage 2" now points. That pattern gates them on a declared `design_intent`, so the concepts are owed when the direction itself is the question and not on every change.

The portal links to the *decisions*, not the *explorations*. The strategy drawer (Pattern B) or the strategy panel (Pattern A) cites ADRs. The deliberation lives in those ADRs.

## What the reviewer checks

`design-principles-reviewer` (Stage 2 → 3 gate for greenfield) verifies:

- `DESIGN.md` acknowledges the confident preview rule (textually present)
- No variant-shaped page names in the planned page list (`home-a` / `home-b` / `-variant-` / `-v2.` patterns)

Pattern A/B conformance reviewers (Stage 3 completion) verify the rule at portal-build time — they grep for variant-shaped page names and BLOCK if multiple variants of the same base exist.

The two-gate enforcement is intentional: Stage 2 catches the *intent* to ship variants; Stage 3 catches the *artifact* of having shipped them. The rule slips past Stage 2 only if the agent doesn't yet know the page set; Stage 3 is the safety net.

## Pattern-specific notes

### Pattern B (redesign-review-portal)

The PROPOSED/COMPARE/SHIPPED toggle is the comparison primitive. If a stakeholder needs to see "what we're proposing vs what exists today," the toggle handles it. If a stakeholder needs to see "two different proposals," that's variant deliberation and belongs in Stage 2 or an ADR — not in the portal.

### Pattern A (platform-portal)

The audience switcher (`executive / evaluator / engineering`) is the comparison primitive. Same content, different framings for different readers. If you want to show "modernized dashboard vs classic dashboard" as two takes of the same surface, that's variant deliberation — converge in Stage 2, ship the chosen one, cite the rejected one in the ADR.

## Cross-references

- Stage 2 gate: `template/.claude/agents/blueprint/reviewers/design-principles-reviewer.md`
- Stage 3 gate (Pattern A): `template/.claude/agents/blueprint/reviewers/portal-pattern-a-conformance-reviewer.md`
- Stage 3 gate (Pattern B): `template/.claude/agents/blueprint/reviewers/portal-pattern-b-conformance-reviewer.md` § "Verify 'not a deliberation venue' rule"
- Trigger incident: 2026-05-23 apps/blog 11-variant portal; full diagnosis in `docs/_archive/2026-05-25-three-session-reconciliation.md` § "Blog session caught"
- Reconciliation execution plan item 4: `docs/_archive/2026-05-25-three-session-reconciliation.md` line 108
