---
canonical: false
status: working-contract
date: 2026-07-22
depends_on: research/refoundation/00-charter.md
---

# Claim-control incident record contract

## Purpose

The record keeps the re-foundation from turning memorable agent mistakes into
universal methodology rules. It forces each case to connect an initiative
claim, the evidence available for that claim, the authority that issued or
challenged it, and the earliest reusable control that could have changed the
outcome.

An incident is eligible only when at least one canonical source, executed check,
observed encounter, or source-sampled transcript supports it. A summary written
by the same agent that performed the work is not sufficient on its own.

## Required record

```yaml
id: FR-01
initiative: film-room
initiative_shape: founder-operated-to-distributable
period: 2026-07-16..2026-07-22
status: evidenced | partial | disputed | metadata-only

intent_before:
  statement: What outcome and scope governed immediately before the incident?
  source: Canonical artifact or observed operator statement.

actors:
  - id: operator
    role: decide | execute | validate | receive | operate | support
    authority: What could this actor legitimately decide or certify?
    evidence_status: intrinsic | observed | assumed

claim:
  statement: The exact progress/readiness/outcome claim at issue.
  scope: founder-operated | assisted-beta | self-serve | team-handoff | other
  claimed_ceiling: documented | prototyped | present | behavioral | live | observed-human
  issuer: actor id or system surface

evidence_at_time:
  - observation: What was actually known then?
    grade: documented | prototyped | present | behavioral | live | observed-human
    observer: builder | mechanical | independent-agent | simulated-human | observed-human
    source: Canonical source or executed receipt.
    freshness: current | stale | unknown

transition:
  attempted: advance | continue | revise | stop | re-charter | handoff
  actual: What happened?
  detector: operator | builder | independent-reviewer | gate | test | real-user | external-event

classification:
  primary: one value from the taxonomy below
  contributing: []
  rationale: Why this classification fits better than adjacent ones.

earliest_safe_catch:
  point: Before which irreversible or compounding action?
  signal: What fact was already available?
  candidate_control: A portable rule to test, not an adopted solution.

counterevidence:
  - Alternative explanation, successful behavior, or fact that limits the conclusion.

sources:
  - source id and locator

confidence: high | medium | low
open_questions: []
```

The dossiers may use prose and tables instead of literal YAML, but every field
above must be answerable before an incident can enter kernel falsification.

## Classification taxonomy

| Class | Meaning | Typical response candidate |
|---|---|---|
| `intent-change` | The governing outcome, actor, assistance level, or distribution boundary changed | re-charter/claim invalidation rule |
| `existing-rule-noncompliance` | A relevant rule existed and was available but work did not follow it | enforcement, visibility, or authority fix—not new universal prose |
| `enforcement-gap` | A rule existed but no transition or workflow made violation consequential | executable transition/precondition |
| `method-gap` | No current rule represented a repeated, consequential need | candidate kernel or conditional-module capability |
| `oracle-claim-mismatch` | The check was correct about a weaker fact but its result was rendered as a stronger claim | claim ceiling + typed evidence |
| `stale-evidence` | A once-valid source was cited outside its freshness or scope | expiry/re-derivation rule |
| `authority-violation` | An actor issued a receipt or decision beyond its declared authority | issuer/observer separation |
| `tooling-defect` | Implementation contradicted the declared method even if the method was sound | tooling repair; do not reshape kernel unless repeated |
| `project-specific` | The issue belongs to one product or environment and has no portable invariant yet | keep in consumer |
| `positive-control` | A gate or low-ceremony path produced the intended outcome | preserve/falsify candidate against it |

Multiple classes are allowed, but one primary class is required. "Agent failed"
and "method failed" are conclusions to decompose, not valid classifications.

## Evidence dimensions

Do not use a single ambiguous maturity word. Record at least these independent
dimensions:

1. **Object proved** — documented, prototyped, artifact present, behavior
   passing, live in its target environment, or actor outcome achieved.
2. **Observer** — builder/self-report, mechanical system, independent agent,
   simulated human walk, or observed human.
3. **Scope** — the actor, environment, assistance level, and product mode for
   which the evidence holds.
4. **Freshness** — when the source was observed and what invalidates it.

Examples:

- A signed application file is `present`; it is not a successful cold install.
- A test file is `present`; an executed passing result is `behavioral`.
- A founder completing a real event is `live` for founder-operated production;
  it is not observed-human proof for a second operator.
- A cold-agent persona walk is independent-agent evidence; it remains interim
  for a human comprehension outcome.

## Record-writing rules

1. **State the prior intent before judging the result.** A founder tool is not a
   failed self-serve product until self-serve becomes the governing claim.
2. **Use evidence available at the time.** Later audits may expose the gap but
   must not make earlier actors appear to have known facts they did not.
3. **Separate detection from cause.** Codex detecting a gap does not establish
   that Claude uniquely caused it; the operator detecting a gap does not make
   the operator responsible for it.
4. **Name the claim issuer.** A chat response, stage state, portal tile, ADR,
   checklist, and human statement have different authority and persistence.
5. **Record positive controls.** The future kernel must preserve working gates,
   not only catch failures.
6. **Include an alternate explanation.** Deadline pressure, evolving scope,
   missing access, stale registries, and fresh-reviewer advantage may contribute
   without excusing the incident.
7. **Keep controls provisional.** Incident records identify what a candidate
   kernel must accomplish; they do not pre-ratify a schema or reviewer.
8. **Promote invariants, not anecdotes.** A vendor/model name, UI label, file
   layout, or product-specific seam is not a kernel concept unless it expresses
   a portable invariant.

## Corpus admission gate

An incident reaches `evidenced` only when:

- intent and claim are separately identified;
- at least one source is canonical or independently sampled;
- evidence ceiling and observer are stated;
- the primary classification is justified;
- counterevidence is recorded; and
- the earliest-safe-catch signal existed before the correction.

`partial` incidents may guide further research but cannot be used to require a
universal kernel field. `metadata-only` cases establish adoption or initiative
shape, not causal conclusions.
