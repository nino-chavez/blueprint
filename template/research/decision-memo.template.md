# Decision Memo — <Initiative>

**The deliverable of a research-variant initiative.** One page a decision-maker can act on. Everything below the line is evidence; everything above it is the decision. If a reader stops after the first screen, they should know the bet, the call, and what's blocked.

**Audience:** <named decision personas — e.g., the people who fund/approve> · **Date:** <date> · **Status:** Draft | Ready for decision

---

## The ask
<One sentence: the specific decision or approval being requested.>

## The bet (why now)
<2–3 sentences. The outcome at stake and why this matters now. No jargon, no process terms.>

## What we recommend
<The 3–5 decisions, each one line, each tagged with the persona job it serves.>

1. **<Decision>** — <one line>. _(serves: `<persona>/JOB-n`)_
2. …

## What's blocked (and who owns it)
<The gating items that prevent acting, each with a named owner. This is the honest part.>

| Blocker | Owner | Why it blocks |
|---|---|---|
| | | |

## What each persona can do once this lands
<The honest "so what." For each decision persona, the concrete capability this unlocks. If a persona gains nothing, say so.>

| Persona | What they can now do |
|---|---|
| | |

---

## Evidence appendix
<Links to the grounded research + decisions + verification that back every claim above. The repo is the source of record; this memo is the readable surface over it.>

- Decisions (ADRs): <link or list>
- Primary-source verification: <link — what was confirmed/refuted against authoritative sources>
- Personas & JTBD: `research/personas-and-jtbd.md`
- Source assets + provenance: `research/sources/`

---

### Authoring rules (delete before sharing)
- Above the line: plain language, no `OQ-`/`S1–S8`/`verified=`/`Pattern-X` notation. Those live in the repo, not the memo.
- Every recommendation traces to a persona job (the `serves:` tag). `persona-fit-reviewer` enforces this.
- Every number/claim resolves to the evidence appendix. `doc-quality-auditor` enforces methodology-statement-for-derived-data.
- The companion deck (optional) is generated from this memo via Forge Signal (Executive Advisory mode), not hand-built.
