# Personas & Jobs-to-be-Done

**Stage 1 (research variant) — MANDATORY GATE.** No synthesis, decisions, or deliverables proceed until this is populated. `persona-fit-reviewer` blocks any downstream artifact that does not trace to a job below.

**Derived-from-inputs rule:** every persona and job is grounded in a specific input asset (see `research/sources/`). Do not invent personas. If the inputs don't name a role, don't list it — flag the gap instead.

---

## How to fill this in

For each persona the input assets actually name or imply:

```
### <Persona name or role> (`<slug>`)
- **Slug:** <short-kebab id used in every serves: tag, e.g. `revops`, `partner-ops`>
- **Source:** <which input asset names/implies this persona — file + section>
- **Who:** <role, where they sit, what they own>
- **Jobs:**
  - **JOB-<n>:** When <situation>, I need to <motivation>, so I can <expected outcome>.
    - **Acceptance:** <what "done well" looks like — observable, not aspirational>
    - **Today:** <how they do this now, and what's painful>
    - **Decision dependency:** <which decision/recommendation this job is waiting on, if any>
```

Job-id convention (the `persona-fit-reviewer` resolves `serves:` against these): `<slug>/JOB-<n>`. Put the slug in the heading backticks AND the `Slug:` field so resolution is unambiguous.

---

## Personas

<!-- One block per persona, grounded in research/sources/. Delete this comment. -->

### <Persona name> (`<slug>`)
- **Slug:** <slug>
- **Source:**
- **Who:**
- **Jobs:**
  - **JOB-1:** When …, I need to …, so I can …
    - **Acceptance:**
    - **Today:**
    - **Decision dependency:**

---

## Coverage check (the reviewer reads this)

- [ ] Every persona traces to a named input asset in `research/sources/`.
- [ ] Every job has observable acceptance criteria (not "better experience").
- [ ] Every job notes its decision dependency (or `none`).
- [ ] Gaps named explicitly: which roles the inputs imply but don't detail.

## The test this artifact exists to pass

Before any decision, deck, portal page, or memo section ships, it must answer: **which persona's named job does this serve?** If the answer is "none," it is vanity — cut it or justify it as infrastructure with a one-line reason. This is the gate that the greenfield pipeline lacked, which let a prior initiative accumulate product-shaped scaffolding no stakeholder could use.
