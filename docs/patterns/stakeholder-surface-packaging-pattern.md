---
canonical: true
pattern: stakeholder-surface-packaging
status: proven
proven_in: bc-subscriptions (2026-06-30..07-02)
related:
  - handoff-corpus-pattern
  - doc-surface-discipline-pattern
---

# Stakeholder-Surface Packaging Pattern

Turn an accreted stakeholder surface — the portal / review site / status
dashboards a blueprint-run project grows — into a **knowledge-transfer
deliverable**: one destination a receiving team (exec, product, eng, sales, an
external vendor, an acquirer) can evaluate, take over, or extend cold. The move
is architectural, not cosmetic: separate *truth* from *audience fitness*, quarantine
the construction harness from the recipient account, and gate every audience-facing
view on a persona walk — instead of iterating a pitch surface that reads as
marketing to the people who need a deliverable.

## Why this pattern exists

A project built bottom-up accumulates surfaces without a stated delivery goal,
and three failure modes follow — each observed empirically in the proving
project, each caught by a *test*, not an assertion:

1. **The harness is surfaced as the deliverable.** A blueprint-run project's most
   visible artifacts are its *construction-control* system — gate ladders,
   coverage matrices, provenance dashboards. A clean-room corpus classification
   found **~43%** of the docs were agentic-process substrate a delivery-first team
   would never produce. Surfacing them as the handoff buries the account under
   process vocabulary that actively misleads outsiders.
2. **Raw derivation serves no one.** Five real personas walked the actual live
   derived artifacts; **5 of 5 failed.** A CFO and an engineering director reading
   the *same* status number failed *differently* and needed *two different lenses*
   — proof that audience fitness is a real axis, orthogonal to truth, not a
   coat of paint.
3. **The pitch surface is the wrong thing to keep OR rebuild.** A 6-lens
   adversarial red team (each finding re-verified against re-pulled sources)
   converged, across five independent lenses, on: **do not rebuild the shell.**
   The derivation engine (the islands, the derive libraries, the review pages)
   is the most expensive asset and would be rebuilt identically; the failures were
   all IA/nav/altitude, never platform. So neither "reshell the pitch content"
   (too generous to content a delivery team would never build) nor "fresh from
   scratch" (wasteful of the engine) is right.

The pattern splits all three: **keep the engine, quarantine the harness, replace
the pitch surface with a lens layer.**

## The two-axis architecture: canonical layer + lens layer

Two orthogonal axes that projects routinely conflate:

| Axis | Question | Mechanism |
|---|---|---|
| **Truth / freshness** | Is this fact true and current? | Derivation + attestation |
| **Audience fitness** | Does it land for *this* reader — right altitude, their job-to-be-done? | Lens layer + persona-walk testing |

- **Canonical layer** — the single source of truth, audience-neutral. Two classes:
  - **Derived** — auto-regenerated from committed sources. Split further, a
    distinction that is load-bearing:
    - **durable-derived** — tied to committed code/schema/git; regenerates
      deterministically, survives handoff (coverage, ERD, decision records, API
      specs). *Only these anchor a durable deliverable claim.*
    - **point-in-time-derived** — tied to external runtime that drifts (demo-seed
      state, live health). Must be as-of-stamped and **never load-bearing** on a
      handoff page — it belongs on a separate live-demo surface. (The proving
      project shipped a "222 live / 1 live" demo count on a stakeholder page; it
      was transient and unclear, and was replaced with a durable-derived
      "verified end-to-end" capability count.)
  - **Attested** — human-authored, carrying `owner` + `last_attested` + a
    staleness contract. Holds facts derivation cannot (cost-to-complete, GA date,
    a competitor comparison, a scale ceiling). Drifts *visibly* — a lint flags it.
- **Lens layer** — per-audience *attested-composition* views that PULL from
  canonical, set altitude / voice / ordering / caveats, and **cite facts, never
  author them.** The hard fabrication guard: a lens selects, orders, and captions;
  the moment it emits a number, date, or external fact not traceable to a cited
  canonical row, it has fabricated and must stop. (This is the same failure the
  handoff-corpus pattern's attestations guard, applied at the composition layer.)

## The class-boundary manifest (content vs. ceremony)

Before assembling the surface, classify every artifact into one of three classes —
the principle is *knowledge = project; coordination/enforcement plumbing = harness*:

- **Class P — project knowledge (recipient-facing).** The account of the product:
  intent, as-built, delta, operations. This is the deliverable.
- **Class H — construction harness (internal).** The gates, coverage vocabulary,
  coordination substrate, agent prompts. Real and valuable *to the builder, not
  the recipient*. **Never deleted — de-weighted and labeled** (collapse behind one
  nav entry; banner each page to *orient* the evaluator who drills in, not shoo
  them: "build-verification substrate; the narrative account lives in [the KB]").
- **Class D — demo / GTM surfaces.** Live proof; recipient-facing but not
  documents. Kept separate from the durable account (see point-in-time-derived).

The classification is the deliverable's table of contents. In the proving project
it mapped ~35 portal pages and ~29 doc corpora into keep-P / keep-D /
de-weight-H / retire (raw dumps superseded by projections → redirect).

## Definition of done — two axes, both required

An artifact or surface is done when **both** hold:

1. **Truth** — zero unowned narrated content. Every surface is Derived or Attested
   (with an owner + staleness contract), or retired. No hand-typed number that
   isn't computed at build time or re-verified against its live source.
2. **Fitness** — the reader's persona walk reaches their decision. The persona-walk
   harness *is* the recurring gate: green means every named reader reaches their
   job-to-be-done.

## The three-layer verification gate

Every audience-facing view clears three layers before it ships. The proving
pilot passed all three (15/15 stats independently re-confirmed, zero jargon
leaks) — and the gate *still* caught two real issues, which is the point.

1. **Mechanical (CI, every artifact)** — a jargon denylist fails the build on any
   un-glossed internal term (gate codes, coverage jargon, decision/ticket refs,
   coordination vocabulary); a provenance-diff requires every stat to bind to a
   live canonical key (re-derive; fail on untraceable or drifted). Catches all
   *gross* failures deterministically and cheaply.
2. **Semantic (persona walk, before ship)** — the reader reaches their decision or
   fails with a *named* mode. Catches what mechanical cannot: a **true-but-
   overclaiming frame** ("verified end-to-end" when the scenario bypasses the real
   entrypoint). Not jargon, not a false number — a misleading frame only a
   skeptical-reader walk surfaces.
3. **Adversarial (high-stakes cuts only)** — independent re-pull of every cited
   source; no charitable self-attestation. Reserve for the exec / decision-maker
   lenses.

**Sustainable ratio:** mechanical on every artifact · persona walk before ship ·
adversarial for the highest-stakes lenses.

### Lens authoring rules the pilot surfaced

- **"Verified" ≠ "runs end-to-end."** Scenario-level verification often calls
  handlers directly, bypassing the real routing. A lens says "verified by an
  automated scenario," never "runs the real flow start to finish."
- **"Seeded/demoable" ≠ "adopted/traction."** A live demo proves the capability
  works, not that a market wants it. Never blur capability-works with market-demand.
- **Durable deliverables anchor on durable-derived facts only.** Transient facts
  (live status, seed counts) never appear as load-bearing proof on a handoff page.

## The adversarial lens-walk (post-ratification)

Ratifying the architecture is not the end. Walk every lens end-to-end as its
persona *after* the plan locks; the walk repeatedly surfaces refinements a
static review misses:

- **Repoint, don't redirect.** Every in-lens link to a retiring page gets a direct
  new target in the *same* change-set. Redirects are a bookmark safety net; a
  persona mid-walk must never depend on one.
- **Dead-end leaves get onward paths.** A well-built page with zero outbound links
  truncates every walk that reaches it. Give each terminal page an onward step.
- **De-weighting banners must orient, not shoo.** The evaluator drilling from a
  lens into a harness page is your primary audience there — point them onward,
  don't tell them to leave.

## Portal IA & content conventions (the recurring drift modes)

These codify the fixes that otherwise recur every time the surface grows. Adopt
them as review rules:

1. **Audience-fit, not zero-jargon-everywhere.** Internal (Class-H) pages may stay
   technical; the violation is jargon on *first-contact* pages.
2. **Gloss a term at its first occurrence in the whole file set** — grep the term
   across all files, gloss once in reading order, leave repeats bare. (Per-page
   audits gloss the flagged sentence and miss the same term in three sibling files.)
3. **A citation that looks like a reference must be clickable** — link decision/
   ticket refs through a helper, never hand-roll per page; a dead-looking cite
   reads as more rigorous than it is.
4. **Un-linkable sources get an honest parenthetical**, never a fake link.
5. **Moving/renaming a page ships its redirect in the same change** — verify live.
6. **Don't merge pages by name similarity — verify they read the same underlying
   data through different layouts** before merging.
7. **A new destination needs real nav reachability from day one** — link it from
   the page its audience actually lands on first, not a buried sibling.
8. **Nav weight tracks audience, not page count** — collapse internal-process
   pages behind one low-traffic entry.
9. **Verify every stat against its live source before shipping it** — compute at
   build time from the real source, or re-verify by hand on every touch.

## Evidence (worked example)

**bc-subscriptions, 2026-06-30..07-02.** A real evaluation thread (a CFO weighing
build-vs-hire-vs-buy; eng directors asked for a code-quality sniff test) triggered
the reframe from "iterate the portal" to "package a knowledge-transfer
deliverable." Three empirical stress-tests grounded it:

- **Red team** — 6 adversarial lenses, each verified against re-pulled sources; 18
  findings survived, 0 critical; dominant result across 5 lenses: *keep the engine*.
- **Audience-fitness test** — 5 personas walked the live derived artifacts; 5/5
  failed; the cross-altitude control (CFO vs. eng director on one number) failed
  differently, proving role-based entry is real.
- **Clean-room corpus survival** — 12-category classification; ~38% survive
  verbatim, ~19% survive-and-reshape, ~43% is harness substrate → quarantine.

The verification gate was proven on the exec-readiness lens (15/15 stats
re-confirmed) and *still* caught a true-but-overclaiming "verified end-to-end"
frame the mechanical layer passed. Consumer canonical sources:
`docs/methodology/2026-06-30-delivery-packaging-blueprint.md` (the architecture),
`docs/methodology/2026-07-02-surface-assembly-design.md` (the class-boundary
manifest + one-surface mount plan), `docs/methodology/2026-06-30-portal-ux-conventions.md`
(the nine conventions, codified from a 39-agent portal audit).

## Activation criteria

**Adopt when:**
- A project has accreted a stakeholder/review/portal surface bottom-up and now
  faces a real handoff or evaluation (internal exec/product/eng, an external
  vendor, an acquirer).
- The surface derives real artifacts but reads as a pitch, or the same page must
  serve readers at different altitudes.
- You can name the specific readers (persona list) — the lens layer and the
  fitness gate are meaningless without them.

**Skip when:**
- The project is early / single-audience — a stakeholder surface with one reader
  needs no lens layer; the two-axis DoD is over-engineering below the handoff
  threshold. (Same activation-threshold discipline as `doc-surface-discipline`.)
- There is no derivation engine yet — build the canonical layer first; lenses
  over nothing just move the fabrication risk up a level.

## Cross-reference

- **`handoff-corpus-pattern`** — the per-capability page generator that plugs into
  this pattern's *canonical layer* (Input-A + attested Input-B). This pattern is
  the surface architecture that holds those pages alongside lenses and the class
  boundary; handoff-corpus is how the durable per-domain account inside it is
  produced.
- **`doc-surface-discipline-pattern`** — the `canonical: true|false` two-surface
  model and classification taxonomy this pattern's class-boundary manifest builds on.
- Consumer files (bc-subscriptions): the three `docs/methodology/` docs cited under
  Evidence; the portal derivation engine + review pages are the "kept engine."
