# research/current-state/

> Map of **what exists today**. Distinct from `proposed-changes/` (forward-looking spec).
>
> This is where you catalogue the reality the initiative is operating against:
> - What pages / surfaces are working in production?
> - What functions / routes / adapters are scaffolded but stubbed?
> - What feature flags gate which code paths?
> - What's the actual runtime behavior, not the spec-aspirational behavior?

## When to populate

Stage 1 of the blueprint pipeline. Authoring this *before* design principles
(Stage 2) means the design-principles "What this CAN'T do today" section can be
grounded in mechanical evidence, not assumptions.

## What goes here

- `runtime-audit.md` — mechanical sweep findings (which routes work, which throw,
  which are gated by feature flags). Sister artifact to a payments-fixture audit
  if one exists.
- `capability-inventory.md` — per-capability status: WORKING / PARTIAL / STUBBED /
  NOT-IMPLEMENTED. Cross-referenced to state-derive catalog if used.
- Snapshots of canonical-source docs (e.g., BC developer docs, vendor API references)
  with retrieval dates.
- Screenshots of existing product surfaces if the initiative touches UX.

## What does NOT go here

- BRD / PRD / spec text → `../proposed-changes/`
- Risk register → `../impact-analysis/`
- Open questions for stakeholders → `../open-questions/tracking.md`
- Competitor / cross-industry research → `../competitive-analysis/`
