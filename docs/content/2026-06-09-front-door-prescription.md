# Prescription — front door fails the casual visitor (2026-06-09)

Scoped micro-iteration on the self-app, driven by the first organic portal
feedback (`feedback/2026-06-09-casual-visitor.md`, triaged in
`feedback/2026-06-09-triage.md`). Two assumptions disconfirmed in one
exchange: A1 (front-door comprehension within a casual attention budget) and
A4 (the ask-an-agent fallback). Demand-evidence record:
`docs/content/validation-script.md`.

## Diagnosis (scoped to the hero + first scroll of `apps/portal/src/pages/index.astro`)

The hero serves exactly one persona: a practitioner already convinced that
agent-assisted delivery needs process. The headline ("Run a product
initiative, end to end") is abstract until you already know the problem; the
supporting paragraph leads with practitioner vocabulary ("screenshots, BRDs,
codebase, competitive intel"); the first interactive element is an install
command. A visitor with declared intent ("I want to understand this") and a
single-scroll budget gets no answer to *what is this* or *why would anyone
care* in plain language — and the implicit fallback ("ask Claude") was
explicitly rejected by the first real visitor it was offered to.

The page is a filter when it should be a funnel: it selects for people who
already understand it.

## The missing persona

| Field | Value |
|---|---|
| persona | Curious non-practitioner ("D.") — smart, busy, not agent-pilled; arrived via a shared link |
| surface | `/` (hero + first scroll) |
| time_budget | single scroll, ≤60 seconds |
| job | Understand what Blueprint is, who it is for, and whether it is relevant to me — without learning practitioner vocabulary |
| acceptance | After one scroll, can say in their own words what Blueprint is and who needs it (testable via the A1 cold-open narrate protocol in the validation script) |

Fold into the self-app's research on the next research pass — the persona must
exist where `research-completeness-reviewer` can see it, not only here.

## Prescription

| # | Change | Why (evidence) | serves_jtbd |
|---|---|---|---|
| P1 | Add a plain-language explainer beat to the hero: one sentence a smart friend with no agent context can repeat. Shape (not final copy): the problem ("AI-assisted projects move fast and rot fast") then the thing ("Blueprint is the checklist + paper trail that keeps one honest"). Final copy drafted under the voice guide — Thought Leadership register, not Documentation | A1 disconfirmed: declared-intent visitor bounced at the current hero (Log 2026-06-09) | D. JTBD above |
| P2 | Insert a 30-second lane between hero and pipeline: three beats — What it is / Why it exists / Who it's for — in non-practitioner language, each ≤2 sentences. Practitioner depth (stages, tiers, reviewers) moves *behind* this strip, not in front of it | Same; the current first scroll goes hero → install command → seven-stage pipeline, which is the dig-in path only | D. JTBD |
| P3 | The page answers for itself: no "ask your agent" framing anywhere in the comprehension path. Agent-assisted exploration stays as an affordance for practitioners (the Discover card), never as the remediation for confusion | A4 disconfirmed: the fallback was offered verbatim and rejected ("I don't want to replace real humans with claude") | D. JTBD |
| P4 | Re-run the A1 protocol after shipping: one cold-open narrate test with a non-practitioner (D. is the obvious ask — she already gave time once). Log the result in the validation script | The fix's acceptance criterion is her test, not our judgment — shipping the rewrite without re-testing repeats the original error (hypothesis presented as fix) | — |

## Out of scope (named so they don't creep)

- Full homepage redesign / IA changes beyond the hero + new strip.
- New portal pages or audience switcher (the bespoke ADR stands).
- Changing the practitioner content below the fold — it serves its persona.

## Sequencing

P1 + P2 + P3 are one build slice (copy + one section component, voice-guide
loaded first per the prose-voice rule). P4 follows the deploy. Operator
reviews the prescription and the draft copy before it ships — this is the
public product site's voice.
