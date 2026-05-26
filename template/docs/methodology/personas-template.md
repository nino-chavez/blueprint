---
canonical: true
---

# Personas — Initiative Template

A Blueprint initiative's personas table is the structured representation of WHO the work serves. It expands on `blueprint.yml` `pilot_profile:` by adding the per-stage detail that informs design decisions: what does the user do at each stage of the journey, what side of the market are they on, what monetizes their engagement?

This template lives at `template/docs/methodology/personas-template.md` (canonical). Consumer projects copy it to `<initiative>/personas.md` and fill in the rows for their specific personas.

## Why the monetization column exists

On 2026-05-22, the `apps/rally-hq` initiative ran a vs-volleyballlife competitive walkthrough. The persona table at the time had columns for `Stage`, `Goal`, `Pain`, `Tool`. It did NOT have a monetization column. The result: prescription items got authored that improved one persona's experience while implicitly degrading another's. The cross-persona cost was invisible because the table had no field for it.

The encoded response is this template's `Monetization side` column. Every persona × stage row names which side of the market the user occupies at that moment. The same human can occupy different sides at different stages (e.g., a coach is a `coach` when scouting players but an `organizer` when running a clinic). The table makes that explicit.

## The schema

```markdown
# Personas × Stages

## <Persona name>

**Profile**: <short profile — pulled from blueprint.yml pilot_profile.display_name for the primary>
**Walkthrough citation**: <path to real artifact>
**Monetization side(s)**: <primary side(s) this persona occupies across stages>

| Stage | Goal | Pain | Tool today | Monetization side | Cross-side cost |
|---|---|---|---|---|---|
| Discover | <verb-phrase> | <specific pain> | <current tool/workflow> | <side> | <effect on other sides, if any> |
| Try | ... | ... | ... | <side> | ... |
| Buy | ... | ... | ... | <side> | ... |
| Use | ... | ... | ... | <side> | ... |
| Renew/expand | ... | ... | ... | <side> | ... |

**Notes**:
- <Edge cases, multi-side situations, stages that don't apply to this persona>
```

## Field semantics

| Field | What it captures | Failure mode if weak |
|---|---|---|
| Stage | Where in the journey this row applies | "Whole journey" rows hide stage-specific dynamics |
| Goal | One verb phrase. "Find tournaments near me" not "have a good experience" | Marketing prose that doesn't yield a testable design decision |
| Pain | Specific failure mode the persona experiences at this stage today | Generic complaints ("it's hard") that don't constrain design |
| Tool today | Concrete tool/workflow the persona currently uses (competitor app, spreadsheet, paper, etc.) | "Nothing" is rare — surface the workaround |
| Monetization side | Which side of the multi-sided market this persona occupies at this stage. The pilot's primary side comes from `blueprint.yml pilot_profile.monetization_side`. Other rows can name secondary sides | Empty cells re-create the rally-hq cross-side cost bug |
| Cross-side cost | If a design that helps this row would degrade another row, name the degraded row | "None" is a valid value; emptiness ≠ none |

## How this gets used downstream

- **Stage 1 (Research)**: research-completeness-reviewer cross-references the personas table against research findings — every persona × stage cell should have a research finding that grounds the goal/pain/tool claims.
- **Stage 2 (Prescription)**: prescription-evidence-reviewer (midstream/brownfield) cross-references the `Monetization side` column against prescription items — every declared side with no item must have an explicit `deferred: <reason>` somewhere.
- **Stage 3 (Prototype)**: strategy panels on prototype pages cite the persona row(s) the page serves. A page that doesn't trace back to any persona row is decoration, not deliberate.

## How to amend

The personas table evolves as the initiative learns. Amendments to the SHAPE of the table (adding a column, splitting a persona) are methodology-level changes — open an ADR. Amendments to the CONTENT of rows (refining a goal statement, updating a pain after new evidence) are routine and need only a commit message.

If you add a persona mid-initiative, that's a real change that affects everything downstream. Follow the pilot-profile amendment pattern: write an ADR at `decisions/NNNN-personas-amendment.md`, update `personas.md`, re-run `prescription-evidence-reviewer` and `research-completeness-reviewer`.

## Cross-references

- Schema this expands: `template/blueprint.yml` § `pilot_profile:`
- Methodology context: `template/docs/methodology/pilot-profile-template.md`
- Enforcement: `template/.claude/agents/blueprint/reviewers/prescription-evidence-reviewer.md`
- Trigger incident: 2026-05-22 rally-hq monetization-axis miss; see `docs/2026-05-25-three-session-reconciliation.md` § "Rally HQ session caught"
