# Feedback — "R.", engineering lead, Slack channel thread

Captured 2026-06-10. The thread itself predates the repo going public — the
author's message offers to add folks to the then-private repo, which places it
before the 2026-06-05 fold. Second organic stakeholder signal after
`feedback/2026-06-09-casual-visitor.md`, and the first from the buyer persona
(an engineering lead who runs his own spec-driven loop). Identities anonymized
for the public repo — verbatim original retained in `feedback/raw/`
(gitignored, local only).

## The thread (condensed)

Another engineer ("E.") asked R. to share use cases and approaches for his
spec-driven loop. R. described it as "nothing ground breaking," for building
something meaty (an entire feature):

1. **create-spec** with one model against a robust prompt — "the hard part to
   get right": too technical and models over-engineer; the target is
   high-level enough for a human to review, low-level enough that details are
   complete.
2. **review-spec** with an adversarial model — most important output is a
   "build ready" flag ("tricky to get right because nothing is perfect"). He
   highlights **"contradictions"** — "any time an idea conflicts with reality,
   but model still goes with it because the user asked for it" — which he
   calls AI's #1 failure mode. Run adversarially until all models agree it's
   build ready.
3. **implement-spec** — plans once more against the codebase, implements the
   spec lifecycle/side effects (documentation, status updates).
4. **review-implementation** — adversarial review of code against spec; record
   tech debt/shortcuts/trade-offs, browser-use tests, coverage.

Not automated — he's in the loop for each skill call. "A bit tedious but I
find I have to pull less hair out at the end of the day."

The author then shared the Blueprint README, the two demo portals
(the subscriptions and promotions demos — private), a Loom on the tooling's evolution, and an
explicit ask: would folks throw some tokens at the tooling; repo access
offered.

R.'s response: "This is very cool!" — then the substance:

> It's almost a fact-of-life at this point that spec-driven with the right
> artifacts + review cycles is The Way. The hardest part is generalizing and
> team adoption — it's easy for everyone to have their own spec-driven
> process, it's incredibly difficult to get a whole team to align on
> something. [To E.'s point,] it's hard to even convince individuals that
> another provider is better, let alone an entirely new way of doing things
> at an organizational level.

He closed with two questions: "How has your experience been? What do you want
to get out of the tooling, in a broader sense?" The author answered in-thread:
field response to personal tooling is "stay out of my kitchen"; the broader
goal is the michelin-kitchen framing — shared raw materials, tools, and
techniques that optimize consistency/quality/scale when working with LLMs
("Are there reusable harnesses? Are there primitives in here that we should
maintain and standardize on?") — plus two blog posts carrying that narrative.

## What this is (in methodology terms)

Three distinct signals, two of them gold and neither of them the compliment:

1. **Past-specific behavior from the buyer persona.** Before seeing Blueprint,
   R. described his own hand-rolled loop: create-spec → adversarial
   review-spec (with a "build ready" gate and "contradictions" as the named
   failure class) → implement-spec → review-implementation, human in the loop
   at each step. That is Blueprint's stage/gate/reviewer shape, independently
   converged on. Per the Mom Test, this is the evidence class that counts —
   what he *does*, not what he says about our thing.
2. **The problem half of A3, unprompted, in the persona's own words.** "It's
   easy for everyone to have their own spec-driven process, it's incredibly
   difficult to get a whole team to align on something." Second independent
   source for the team-alignment problem (after the first team engagement),
   and the first from an eng lead with no relationship obligation.
3. **A live conversion non-event.** An explicit commitment ask was made in the
   thread (throw tokens at it; repo access offered). R. responded with a
   compliment and two good questions — and took neither ask. The persona whose
   problem statement matches the pitch did not convert on first contact. He
   has a loop he likes; the field response the author himself names is "stay
   out of my kitchen".

The compliment ("This is very cool") and the belief statement ("spec-driven is
The Way") are logged and discounted — kudos never validates, and generalized
beliefs about the field are opinions, not evidence.

## Mom Test annotations

- **Gave**: none. A considered Slack reply is engagement, but below the time
  bar (no session booked, no repo access requested, no tokens committed, no
  evidence he opened the demo portals). Compare the 2026-06-09 casual-visitor
  report, which scored `time` for actually attempting the product.
- **Said vs gave**: the gap IS the finding. Enthusiastic words, zero
  commitment, explicit ask on the table. This is the false-positive trap the
  weighting axis exists to catch.
- **Assumptions touched**: see `docs/content/validation-script.md` — A3
  problem-half supported (second source); NEW A6 (personal-incumbent
  displacement) named with R. as the embodiment; A2/A3 conversion ask logged
  as not-taken.
