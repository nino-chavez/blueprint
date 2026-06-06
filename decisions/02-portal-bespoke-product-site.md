# 02 — Portal divergence: bespoke product site (neither Pattern A nor B)

**Status:** Accepted (2026-06-06)
**Type:** Portal divergence ADR (wave-46 bespoke-with-ADR escape)
**Supersedes:** the `portal_pattern: A` declaration for this initiative's `apps/portal/`.

## Context

This initiative's portal (`apps/portal/`) was stamped as **Pattern A** — the
platform-portal-as-harness: a 6-verb audience-routed index (Discover / Try /
Build / Operate / Inspect / Roadmap) with an audience switcher that reorders
lanes for Executive / Evaluator / Engineering. Pattern A is the correct shape for
a portal whose job is to be a **stakeholder front door to an initiative's
deliverables**.

After the fold (wave 45), this portal's job changed. It is no longer a
stakeholder deliverables harness — it is **Blueprint's own product homepage**, the
adoption surface for a public, shareable dev tool. A product homepage has a
different job than a stakeholder dashboard: orient a stranger in ten seconds, show
the one install command, get them running it with zero choices. So the home was
rebuilt into a dev-tool **product site** (the shape Astro / Bun / Vite have): hero
+ `npx … init` with a copy button, the seven-stage pipeline, a five-step
quickstart, command cards, a `/learn` enablement hub, contribute. The
audience-routed lane router and the audience switcher were removed.

That rebuild makes the portal fit **neither pattern**:

- **Not Pattern A** — it dropped the mandatory audience switcher and the 6-verb
  lane-router home; the `portal-pattern-a-conformance-reviewer` correctly BLOCKS it.
- **Not Pattern B** — Pattern B is the redesign-review shape (current-state vs
  proposed drawers + a PROPOSED/COMPARE/SHIPPED toggle). This is a product
  marketing site, not a redesign review.

This is exactly the archetype wave 46 named: a deliverable that fits neither
pattern. Wave 46's rule is that such a portal may go bespoke, but the divergence
**must be recorded in an ADR** — a bespoke portal's gate is the ADR's *presence*;
its absence is the violation. Wave 46 left enforcement as a documented condition,
to be **automated on the second bespoke instance**. The first was
`ai-content-engine`'s ops cockpit. This product-site portal is the second — so
the trigger fires here.

## Decision

1. Declare `portal_pattern: bespoke` in this initiative's `blueprint.yml`.
2. Record the divergence in this ADR (the why above + the consequences below).
3. **Automate the escape** (wave 48): `blueprint doctor` no longer runs the
   Pattern A conformance reviewer when `portal_pattern: bespoke`. Instead it
   checks for a divergence ADR in `decisions/` — present → `portal-conformance:
   pass` (bespoke, recorded; Pattern A/B conformance not applicable); absent →
   `portal-conformance: fail` (declared bespoke without recording the divergence).

The generic, conformant **Pattern A reference stays in `template/apps/portal/`** —
untouched. Consumers still stamp a clean Pattern A shell. Only this instance's
`apps/portal/` is bespoke. This is the fold's directory boundary working as
designed: the instance can diverge to be a product site; the template stays the
reusable reference.

## Consequences

- **`blueprint doctor` passes** for this self-application (the bespoke portal is
  accepted because this ADR exists), instead of failing Pattern A conformance for
  a divergence that was deliberate.
- **The bespoke-with-ADR mechanism is now enforced in code**, not just documented
  — any consumer can declare `portal_pattern: bespoke` and doctor will require the
  ADR. This is wave 46's promised second-instance automation.
- **A bespoke portal forfeits Pattern A's guarantees** — no audience switcher, no
  6-verb IA contract, no canonical-chrome conformance. That is the trade for a
  purpose-built surface, and it is the operator's to make per portal, recorded here.
- **Candidate Pattern C is not created.** Two bespoke instances now exist (ops
  cockpit; product site), but they are different archetypes — an operator console
  and a product homepage. Per wave 46, a third frozen pattern waits for a *second
  instance of the same archetype*, not a second bespoke portal of any kind.

## References

- `docs/portal-and-tier-ladder.md` — Pattern A/B contracts, the "when neither
  pattern fits" subsection, the bespoke-with-ADR escape.
- `WAVE-LOG.md` — wave 46 (the escape + the second-instance trigger), wave 48 (this
  automation), wave 45 (the fold that repositioned the portal).
- `template/tools/lib/doctor.mjs` — the automated check (`findDivergenceAdr`).
- `apps/portal/src/pages/index.astro` — the bespoke product-site home.
