# research/impact-analysis/

> Risk register + dependency impact for major decisions in this initiative.

## When to populate

Anytime an ADR or major Spec carries non-trivial dependencies, blast radius, or
risk that warrants explicit tracking. Don't fill this folder pre-emptively —
let it grow as decisions surface their consequences.

## What goes here

- `risk-register.md` — known risks with severity / likelihood / mitigation
- Per-decision impact analyses (e.g., `<ADR-NNNN>-impact.md`)
- Dependency graphs showing what blocks what, when, and why
- Rollback strategies for decisions that turn out wrong

## Patterns

- **Lead with impact, not method.** "If we ship X without Y, then Z fails for class W of users."
- **Cite the source-of-truth.** Each risk traces back to a concrete code path / spec section / external dependency, not just intuition.
- **Mark decay timestamps.** A risk based on an external dependency's state should note when that state was last verified.
