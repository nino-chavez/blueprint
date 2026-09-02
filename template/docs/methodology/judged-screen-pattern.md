# Judged Screen Pattern — the rendered frame is the source, and nothing was reading it

**Status: promotion candidate (Minder native iOS 2026-09-01; design-qa web program 2026-07; blog 11-variant portal 2026-05-23). Pattern promotion-ready; the `.mjs` reviewer's mechanical half ships now, the judged half is a protocol.**

**Promotion criterion:** the executable gate stays WARN by default until a second product has run it end to end — declared a design intent, authored the brief, and recorded both reviews. One product's experience is a hypothesis about what the gate should block. A gate promoted to BLOCK on one instance inherits that instance's blind spots, which is the failure `ui-rendering-contract-tier.md` § "Authoring discipline" names. A consumer that wants blocking behavior before then opts in per initiative with `screen_review_policy: strict`.

Three consumers reached the same failure from different stacks. This pattern is the shared fix.

## 1. Authority belongs to the claim, not to the artifact — and no gate held the appearance claim

Blueprint's gates read artifacts. A reviewer greps a spec, resolves a citation, counts rules in `DESIGN.md`, or confirms a test passed. Each one is honest about what it reads. None of them look at the screen.

The fix is not "UI claims are settled by screenshots." That overcorrects, and it is wrong about three of the four claims a screen makes. **Each claim has its own canonical source:**

| The claim | Settled by | Not by |
|---|---|---|
| Appearance and composition — what it looks like, what competes, what the eye finds | The rendered frame on the target device | Source, tests, a design file, a simulator capture |
| Interaction — what happens when the user acts | Observed behavior on the target device | A screenshot, or the handler's source |
| Accessibility — whether it is reachable and legible | The accessibility tree, plus observed behavior with the assistive technology | A screenshot, or an ARIA attribute in source |
| Implementation — what the code does, and whether the rule was followed | Source and tests | A screenshot |

A screenshot is evidence for exactly one row. Reading a static frame as proof that a control works, or that a screen reader can reach it, is the same authority bleed in the other direction — and it is easier to commit, because a capture feels more like ground truth than a grep does.

The gap this pattern closes is the first row, which no gate held. `global-rules/audit-discipline.md` tells a reviewer to "grep the actual file, read the actual code." For an appearance claim that resolves to the wrong artifact. Source is evidence of **intent**. The frame is the **result**. A reviewer can verify every rule in the source, correctly, and still be describing a screen other than the one that shipped.

Minder — a greenfield native-iOS consumer — shipped a Today screen that a zero-context reply beat from a single screenshot. Every gate was green. The artifacts say why:

- The design review recorded that the refinements created no new module, tab, dashboard, or visual system. True, and beside the point. The reviewer was checking whether the change introduced new structure. Nobody was asking whether the existing structure was any good.
- Both design reviews obeyed audit discipline, verified the layout, color, and card rules in source, and concluded no revision was needed. The rules were followed. The screen was still weak. Source verification cannot distinguish those two outcomes.
- The shipped screen was the sum of the slices that preceded it, each of which passed. Closeout is additive-only, so nothing at any point asked what should come off.

A fourth symptom shows the same root reaching into interaction. A read-only calendar event carried a mark-done / mark-not-done control — an interaction invented from a boolean rather than from what the object is and who owns it. UI tests then asserted the label text, which locked it.

**Provenance.** Resolved at source on 2026-09-01 in Minder's release worktree (branch `codex/minder-ai-native-release-plan`, commit `0a10091`), not relayed from a brief. The design review sentence is `docs/evidence/research/category-design-review-2026-08-31.md:15`: "These refinements do not create a new module, tab, dashboard, or visual system." The source-verification claim is line 5 of the same file: "layout/color/card rules were verified in source at `de47425`." The comparison review's verdict is `docs/evidence/research/comparable-web-ios-interaction-review-2026-09-01.md`, § Revision candidates: "No new candidate survives source comparison." The label assertions are `ios/Minder/MinderUITests/VisualCorrectionUITests.swift:107,156` and `MinderUITests.swift:2254,2258,2458`. The additive-only closeout is `docs/definition-of-done.md` § Slice closeout, which lists five items and no removal. Minder's own amendment entry (`METHODOLOGY-AMENDMENTS.md`, 2026-09-01) carries the same citations; a consumer citing this section should still resolve them at source, which is the rule § 8 says this pattern extends rather than contradicts.

**What it means:** a gate that reads source can prove a screen conforms. It can never judge whether the screen is good. Those need different oracles, and Blueprint had only the first.

### The same shape on two other stacks

This is not a native-iOS problem, and it is not one consumer's taste.

- **Web, 2026-07.** `tools/design-qa` plus a per-surface `DIRECTION.md` (rally-hq, letspepper, blog and others) exists because a mechanical scan could not judge. The scan reports findings; `DIRECTION.md` records an art-direction thesis and a ledger of which devices are authorized to cite it. A finding with no ledger row is a defect. The mechanical tier needed a judged record above it before its output meant anything.
- **Portal, 2026-05-23.** The blog initiative reached mid-Stage-3 with eleven whole-screen variants because Stage 2 had nowhere to put divergence. `confident-preview-rule.md` correctly sent deliberation "upstream to Stage 2" — and Stage 2, as METHODOLOGY.md defines it, produces five behavior rules, an atomic-design dictionary, and a testing baseline. There is no artifact there to receive a divergent concept. So the divergence surfaced in Stage 3, where it broke the stakeholder surface.

That is the breadth pass `ui-rendering-contract-tier.md` § "Authoring discipline" requires before a single-slice finding becomes a template. Three consumers, three stacks, one gap.

## 2. Stage 2 declares a design intent, and the intent decides what Stage 2 owes

`confident-preview-rule.md` points variant deliberation upstream to Stage 2. This section is where that pointer now lands — but not for every change, because most changes do not deserve a concept exercise.

### 2a. `design_intent` says how much design work this change is

Declare it as a top-level scalar in `blueprint.yml`:

```yaml
design_intent: refit   # preserve | refit | rethink
```

| Intent | Means | Stage 2 owes |
|---|---|---|
| `preserve` | The existing approved direction stands. This change works inside it. | A pointer to the approved direction record — `design_direction:` in `blueprint.yml`, naming a `DIRECTION.md` or an ADR that exists, plus a surface roster. **No brief beyond that roster, no concepts.** |
| `refit` | Change the presentation; the named behavior stays. | A `design_direction:` pointer to the existing approved record, **and** the experience brief (§ 2b) including the object / action / state matrix. **No concepts.** |
| `rethink` | The direction itself is the question. | The brief, **three divergent whole-screen concepts** (§ 2c), and a selection ADR that names the human who chose. The ADR **is** the new direction record; no prior pointer is owed. |

**Why this field exists.** Without it the pattern fails in one of two directions, and both were live. Skip divergence entirely and Stage 2 has nowhere to put it, which is how eleven variants surfaced in Stage 3 on the blog initiative. Mandate three concepts for every change and a one-line copy fix owes a design exercise, which is the ceremony that gets a methodology ignored rather than followed. The intent is the operator's declaration of which situation this is, made once, in a place both reviewers read.

**Undeclared is not `preserve`.** A missing `design_intent` reads as undeclared and WARNs. Defaulting silently to the cheapest intent would let every change opt out of design work by saying nothing, which is the behavior the field exists to make visible.

**`preserve` and `refit` both owe a direction record, for the same reason.** Both work inside a direction someone already approved — `preserve` leaves it alone, `refit` changes the presentation within it. Neither creates one. So both point at it with `design_direction:`, and **the file it names must exist**: a pointer to a deleted record is not an approved direction. Under `rethink` the selection ADR is the record, so no prior pointer is owed. This is what the conformance review of § 3b reads; requiring that review while nothing guarantees a record to read against would be a gate with no artifact behind it.

**Every intent owes the surface roster**, including `preserve`. The roster is the `## Surfaces` list in the experience brief (§ 2b names where that may live), and it is the only part of the brief `preserve` owes — a `preserve` brief may be that one section and nothing else. A roster bullet may carry a description after the name — `- **Today.** …`, `- Today: …`, `- Today — …`, `- Today - …`, or the bare `- today` — and the reviewer reads the name only, splitting on a *spaced* hyphen so a hyphenated name like `Add-activity review sheet` stays whole, then matching `surface:` case-insensitively. Without it nothing declares which surfaces exist, and the cold review § 3 requires under every intent has no roster to be required against. Declaring an intent is what adopts the pattern; from that point a missing roster is a gap the reviewer reports. An initiative with no declared intent has not adopted the pattern, and the reviewer stays quiet.

### 2b. The experience brief states the user's situation before anyone draws

It is authored before the first concept, and it is the document the screen review reads the job questions from.

**Where these artifacts live — the accepted set, stated once.** Projects organize design work differently and the reviewers accept either layout. This table is the whole contract; nothing else in this pattern names a path.

| Artifact | Accepted locations |
|---|---|
| Experience brief | `prototype/EXPERIENCE-BRIEF.md`, `portal/EXPERIENCE-BRIEF.md`, or `docs/design/experience-brief.md` |
| Object / action / state matrix | Inside the brief, inside `DIRECTION.md` (or whatever `design_direction` names), or `docs/design/object-action-state.md` |
| Concepts | `prototype/concepts/`, `portal/concepts/`, `research/design-explorations/`, or `docs/design/concepts/` |
| Selection ADR | Anywhere under `decisions/`, including subdirectories |
| Screen reviews | `docs/evidence/screen-reviews/`, captures in `<surface>-<build>/` beside the record |

The `## Surfaces` roster lives in the brief wherever the brief lives, and the heading text is exact — it is the one literal format requirement here, because two mechanical readers walk it.

It carries ten parts.

**The job, in five questions.** What is happening right now. What is next. Who is involved. When and where this is read. What the user can do from here. Those are the shape, not the wording — a scheduling surface and a checkout surface ask different questions in the same five slots. Minder's are the worked example, not the contract.

**Five character attributes.** What the surface should feel like, in five words a person could disagree with. "Calm" is a choice. "Good" is not.

**Five anti-goals.** What it must not become. Anti-goals do more work than goals because they can be violated visibly.

**A density target.** How much belongs in one frame, stated as something checkable — objects visible without scrolling, or lines of text at the default type size.

**Hierarchy principles.** What the eye should land on first, second, third, and why that order serves the job.

**Content and microcopy principles.** How things are named and how they read. This is where copy gets its content read, which section 6 depends on.

**Motion and feedback principles.** What moves, what confirms, what stays still.

**Platform strategy.** Which platform conventions the surface adopts, which it declines, and the reason for each decline.

**A `## Surfaces` list.** One bullet per surface the brief governs, under that exact heading. This is the only part of the brief with a literal format requirement, because it is the roster two mechanical readers walk: `screen-composition-reviewer` enumerates it to find which surfaces need a cold review, and nothing else declares that list. A brief without the heading reads as governing zero surfaces, and the gate goes quiet rather than failing.

**An object / action / state matrix.** Every object the screen shows gets a row:

| Object | Owner | Valid actions | States | Reverse action |
|---|---|---|---|---|

The matrix is what prevents "Mark not done." A calendar event owned by an external source has no local completion action, so no row grants one, so no boolean gets invented at implementation time to fill the gap. Write the owner column first; it settles most of the rest.

**Relationship to `DIRECTION.md`.** The brief is the upstream half — it says what the surface is for, before anything is drawn. A `DIRECTION.md` ledger is the downstream record of the devices that shipped and which part of the thesis each one cites. A consumer with both writes the brief first and keeps the ledger current; a consumer with neither starts with the brief.

### 2c. Three divergent concepts and a human selection — `rethink` only

This subsection applies when `design_intent: rethink`. Under `refit` or `preserve` it does not.

**`rethink` splits Stage 2 into two phases, in order.** Collapsing them is how a token decision gets mistaken for a direction.

**Phase 1 — Direction.** What the surface should be.

1. **A blind cold review of the current rendered product, before reading any prior rationale.** On an existing product this comes first, because the shipped screen is the evidence for what needs rethinking, and prior rationale is exactly what makes a weak screen look justified.

   This is a real record, not a scratch note: same protocol, same frontmatter, `kind: cold`, at **the build it judged** — the old one. So a surface accumulates several cold reviews over its life, which is correct and expected. What is not acceptable is ambiguity about which one the gate is reading: once more than one review exists for a surface and kind, `release_marker` must be declared so the current record is identifiable. The reviewer reports the ambiguity rather than picking, because picking silently is how a stale accept passes for a fresh one.
2. The experience brief and the object / action / state matrix (§ 2b).
3. **Curated prior art, one question per reference.** Name what you are asking each reference — how it handles density, how it opens, how it fails — not "here is a site we like." A reference list with no question attached asks the surface to look like the category, which is the opposite of art direction.
4. Three concepts, rendered on the same representative states.
5. A named human selection, with the rejected concepts preserved rather than deleted. Preservation is not approval to continue them; it keeps the comparison auditable.

**Phase 2 — System.** How the selected direction becomes buildable. The chosen direction converts into tokens, components, templates, motion rules, and `prototype/DESIGN.md`. This is the layer the design-system audit measures, and it is downstream of a direction — a complete system built with no direction selected is the boilerplate outcome forge-site names in § 8.

**Only then production implementation.** Blueprint governs the sequence and demands the evidence. It is not the art director, and no gate in it is a person approving (§ 8, film-room ADR-0042 Decision 2).

Author three whole-screen concepts. Not three treatments of one layout — three takes on how the job gets done. Render each on the same representative states so they are comparable.

The canonical state set:

1. Active object
2. Upcoming
3. Actionable
4. Dense
5. Empty
6. Failure
7. Changed by source
8. Largest accessibility text size
9. Increased contrast
10. Completed, with undo available

A project prunes this list, and records the reason next to the pruned state. A surface with no external source has no "changed by source" state, and saying so is the work. Pruning silently is not.

Converge with an ADR in `decisions/` before Stage 3 begins. The ADR names the chosen concept, names the rejected ones, says what the choice buys, and **names the human who chose**. A selection an agent made for itself is not a selection; it is the agent's first draft with a decision record attached. This is the artifact `confident-preview-rule.md` § "When deliberation is appropriate" already asks for — the concepts are the deliberation it presumed had happened somewhere.

The internal reference implementation is film-room's ADR-0010 item 5 (§ 8), which serves developed directions at a route on live data and has the operator pick. Serving them live rather than as static comps is what makes the choice real: the operator judges the thing, not a picture of it.

**Claude Design (`/design` in Claude Code) is an accepted Phase 1 render vehicle for a static surface** — a landing page, a marketing page, a one-pager, a deck — where the concepts have no data states to serve and a comp is the thing itself. Put the three concepts on one canvas, and give each an appearance tweak so the light and dark captures the gate wants come from the same artboard. It is not accepted for an app screen: the canvas cannot show the dense, empty, failure, or changed-by-source states above, and a static comp of those is exactly the "picture of it" the previous paragraph rules out. Two rules carry over unchanged. The system a concept is built on comes from the brand kit or `DESIGN.md`, never from a reference screenshot fed to the tool (§ 2c item 3 is how prior art enters). And a comment thread on the canvas is not the cold review; the record is still written to the protocol in § 3, at the build it judged. (Added 2026-09-01 after Rogoff's "Claude Design is Insane", whose three-versions-on-one-artboard step is this section with the ADR and the human removed.)

**What it means:** one confident preview reaches stakeholders, and the convergence that produced it is now a real Stage 2 activity rather than an assumption.

### 2d. The order of work

Each step's output is the next step's input, and the two reviews sit at the end because neither can run before there is something rendered to judge.

```
product truth        what is actually true of the domain and the data
  ↓
design_intent        preserve | refit | rethink          (§ 2a)
  ↓
cold review of what ships today                           (§ 2c step 1, rethink on an existing product)
  ↓
experience brief     the job, the surfaces, the object / action / state matrix   (§ 2b, refit + rethink)
  ↓
concepts + human selection ADR                            (§ 2c, rethink only)
  ↓
DESIGN.md + implementation
  ↓
blind cold review    does this screen work on sight?      (§ 3a)
  ↓
direction-conformance review   did we build the selected idea?   (§ 3b)
  ↓
physical behavior acceptance                              (§ 5)
```

## 3. The gate is two reviews asking different questions, and neither proves the other

The judged screen review is the gate this pattern adds. It is judged, not mechanical, and it is deliberately outside the oracle model the five DoD gates use. It comes in two kinds:

| Kind | Asks | The reviewer reads |
|---|---|---|
| **Blind cold** (`kind: cold`) | Does this screen work on sight? | The screens. The brief's five job questions. Nothing else. |
| **Direction conformance** (`kind: conformance`) | Did we build the selected idea? | The direction record and the selection ADR, then the screens. |

**Neither substitutes for the other, in either direction.** A screen can execute the chosen direction faithfully and still be hard to read — conformance passes, cold fails. A screen can read beautifully and be a different product than the one selected — cold passes, conformance fails. Collapsing them into one review loses whichever question the reviewer was not holding, and a reviewer holding both at once is not cold, because the direction record is exactly the context the cold review exists to exclude.

They also cannot be the same pass by construction: the cold reviewer is disqualified from the conformance review the moment they read the direction record. Run cold first. A cold review that happens after the conformance read is not recoverable.

**When each is required.** The cold review is required for every surface, under every intent — a `preserve` change still ships a frame nobody judged. The conformance review is additionally required under `refit` and `rethink`, because those are the intents where a selected direction exists to conform to. Under `preserve` the direction was approved earlier and the pointer in `blueprint.yml` is the record.

### 3a. The blind cold review

#### Who reviews

A reviewer who has **not** read `DESIGN.md`, the PRD, the experience brief's rationale, or the implementation. Cold. They may read the brief's five job questions — that is the standard they judge against — and nothing else.

The reviewer is never the implementer. It may be a second model, a second session, or a person. The requirement is only that the reviewer arrives without the context that makes a weak screen look justified. Context is what the person shipping already has, and it is precisely what stops them from seeing the frame.

#### What is reviewed

Device captures, one per representative state. A real device for native. A real viewport for web. Not a simulator screenshot passed off as a device capture, not a component in isolation, not a design file.

Captures live beside the record they belong to, at `docs/evidence/screen-reviews/<surface>-<build>/`, one file per state named for that state. Keeping them next to the review is what lets a later reader check the verdict against what was actually judged; a review pointing at captures that have since moved or been regenerated is a claim with no evidence behind it.

#### How it is judged

The reviewer answers, in order:

1. **Does the frame answer the job questions?** Take them from the brief. What is happening now, what is next, who, when and where, what can I do.
2. **What does the eye land on first, second, third?** Report the actual order, not the intended one.
3. **What competes?** Name the elements fighting for the same rank.
4. **What can be removed, combined, demoted, or disclosed?** Every element gets tested against these four, and "keep as is" is a verdict that has to be earned.
5. **Classify every element** as one of: correct, usable but weak, appealing but wrong, unnecessary, defect. The middle three are the ones a passing test suite cannot distinguish from correct.

#### What is written down

A file at `docs/evidence/screen-reviews/<surface>-<build>.md` with this frontmatter:

```yaml
---
surface: today                    # the surface reviewed
kind: cold                        # cold | conformance
build: 12                         # build number, or a commit sha
device: iPhone 15 Pro, iOS 18.2   # real device / real viewport
reviewer: <who judged>            # a person, model, or session id
implementer: <who built it>       # must differ from reviewer
cold: true                        # true for kind: cold, false for kind: conformance
states: [active, upcoming, empty, failure, largest-text]
verdict: accept                   # accept | revise
---
```

Then the answers to the five questions above, in prose.

Name the file `<surface>-<build>-<kind>.md`, so the two reviews of one build do not collide. The frontmatter is what the mechanical half matches on; the filename is a convenience for the reader.

**Passing tests and source verification never satisfy this item.** A green suite says the code does what the code was told to do. A source check says the rules were followed. Neither has looked at the frame. When a review is recorded as `accept` on the strength of either one, the gate has been skipped, not passed.

### 3b. The direction-conformance review

This reviewer starts where the cold reviewer is forbidden to go. Read the direction record, then the same device captures. Which record that is depends on the intent, and § 2a guarantees one exists in each case:

| Intent | The direction record | Conformance owed? |
|---|---|---|
| `preserve` | The record `design_direction` names | No — nothing changed inside the direction |
| `refit` | The record `design_direction` names | Yes |
| `rethink` | The selection ADR from § 2c | Yes |

One question, in three parts:

1. **Which direction was selected, and what does it claim?** State it in your own words before looking at the screens. If the record does not say clearly enough to restate, that is the finding: an unstatable direction cannot be conformed to, and the gap is in the record, not the build.
2. **Does each device on the screen cite that direction?** This is `DIRECTION.md`'s ledger discipline: a device that cannot cite the thesis is unauthorized, whatever else can be said for it. Absence of a record is not permission.
3. **What shipped that the direction did not ask for, and what did it ask for that did not ship?** Both halves. Drift shows up as addition more often than omission, and addition is the half a conformance reviewer skips when they are reading for fidelity rather than for excess.

Record it the same way, with `kind: conformance` and `cold: false`. A conformance review claiming `cold: true` has misunderstood its job — it read the direction record, which is the point.

**A conformance pass is not an appearance verdict.** "It matches the ADR" says the team built what it chose. Whether what it chose reads well on the device is the cold review's question, and the cold review is the one that gets skipped when a conformance pass is in hand.

### How it relates to the DoD ladder

`dod-verification-ladder-pattern.md` builds five gates on mechanically answerable oracles — a registry parse, a presence check, a recorded test result. Its honesty comes from every gate resolving to something a machine can check.

This gate has no such oracle, and pretending otherwise would be the failure the ladder exists to prevent, inverted. So it sits **outside** the ladder rather than as a sixth gate. What is mechanical here is only the **record**: does each required review exist for this surface, does its `kind` carry the matching `cold` value, is the reviewer someone other than the implementer, does it accept, is it current with the build. That is what `screen-composition-reviewer.mjs` checks. The judgment inside the file is not machine-checkable and the reviewer does not pretend to check it.

## 4. Closeout asks what came off, not only what went on

Slice closeout is additive today: it records what the slice added and what now passes. Twenty-seven such closeouts sum to a screen nobody designed.

Every slice closeout gains one line:

> **Removed / combined / demoted / disclosed:** … If nothing, why.

"If nothing, why" is the load-bearing half. A slice that adds without subtracting may be correct; a slice that cannot say why is accreting.

## 5. Six acceptance states, one new ladder rung, and no collapsing them into "done"

A consumer that runs a physical-evidence ladder inserts one rung:

| | Rung |
|---|---|
| … | the artifact installs and launches on the target |
| **new** | **the rendered whole has been judged by someone who did not build it** |
| … | the artifact's behavior is accepted |

A consumer running a physical-evidence ladder already has names for the outer two rungs; slot the new one between them under whatever those names are. Those are three different claims.

**Which reviews satisfy the new rung is set by `design_intent` — see § 3.** Under `preserve` it is the blind cold review; under `refit` and `rethink` it is cold and then conformance, in that order. The rung is one step on the ladder and up to two reviews inside it; § 3 owns the count, so this table does not restate it. Installing proves it launches. Accepting behavior proves it does the thing. Neither one has judged the frame, and without the middle rung a ladder walks straight past the only question this pattern is about.

### Six receipts, six different claims

"Done" is six separate acceptances wearing one word. Each has its own oracle, and none implies any other:

| # | Acceptance | The claim it settles |
|---|---|---|
| 1 | Standards-compliant | It meets the external standard it is measured against — accessibility checks, platform guidelines, lint. |
| 2 | Behaviorally correct | It does the thing. Tests pass against the required behavior, not the implemented one. |
| 3 | Design-system-conformant | It uses the system's tokens, components, and rules. Completeness, per the 15 dimensions in § 8. |
| 4 | Visually reviewed (cold) | Someone who did not build it judged the rendered frame on sight and accepted it (§ 3a). |
| 5 | Direction-conformant | What shipped is the direction a human selected (§ 3b). |
| 6 | Accepted in real use | A person did their actual job with it and it held. |

**They collapse in one direction only: never.** A screen can be 1, 2 and 3 and fail 4 — that combination is what Minder shipped. It can be 4 and fail 5, or 5 and fail 4, which is why § 3 keeps those two reviews apart. And 1 through 5 together are not 6: every earlier receipt is a proxy for someone doing the work, and only the last one is the work.

Record them separately. A closeout that says "done" has thrown away which of the six it earned, and the next reader cannot recover it.

### "Best in class" needs comparative task evidence

A claim that something is best-in-class, optimal, or better than a named alternative is a **comparative** claim, and it needs comparative evidence: the same task, attempted on the live comparable, captured the way § 7 requires.

Passing accessibility checks is receipt 1 and says nothing about the comparison. Resembling the comparables is not a receipt at all — naming category leaders as references asks the surface to look like the category, which is the opposite of a direction (§ 8, design-qa). Without the task evidence, downgrade the word rather than keep it.

### An acceptance is current, not permanent

A recorded acceptance holds until a real encounter contradicts it. It is not permanent authority, and superseding it is normal rather than a failure of the earlier gate.

Film-room's ADR-0042 is the worked example (§ 8). A prototype direction had been approved and recorded; later operator encounters found the composition wrong in real use; the new decision superseded the layout and the visual authority **while explicitly preserving** the interaction behavior, source safety, and stored operator decisions that still worked. On the implementation left behind, its own words: "Preservation is not approval to continue that composition."

Two rules follow. **Supersede narrowly** — name which claims the encounter overturns and which survive, because a supersession that takes everything discards working behavior along with the bad layout. **Preserving is not endorsing** — keeping superseded work for reference is not permission to keep building on it, and the record has to say which it is.

## 6. Tests assert semantics; a test that pins unreviewed copy is a lock

UI tests assert **role, state, and reversibility** — not copy — until that copy has passed a content read recorded in the experience brief.

Minder's tests asserted "Mark done" / "Mark not done" on a read-only calendar event. The assertion was correct about the code and wrong about the product, and once written it made the fix expensive. The copy was never reviewed; the test made it permanent anyway.

**A test that protects unreviewed copy is a lock, not coverage.** Coverage protects a decision someone made. A lock protects an accident. The two are indistinguishable from inside the suite, which is why the rule is about what the assertion targets rather than about whether the test passes.

Once copy has had its content read and the brief records the wording, asserting it is legitimate — the test is now protecting a decision.

## 7. Only device captures of a live comparable can ground a comparable claim

A "no revision needed" verdict that rests on a comparison to another product needs the comparable captured the same way the subject was: on a real device, at the real viewport, in the states being compared.

Marketing captures are the vendor's best frame under the vendor's chosen conditions. A source check on a competitor tells you what their code intends. Neither is what their users see. A verdict grounded in either one is a claim about marketing or about intent, and it must be labeled that way — downgrade the label rather than keep the word "verified."

## 8. Where this sits among the existing patterns

| Pattern | Relationship |
|---|---|
| [`confident-preview-rule.md`](confident-preview-rule.md) | It sends variant deliberation upstream to Stage 2. § 2 is the artifact that was missing at the other end of that pointer. |
| [`ui-rendering-contract-tier.md`](ui-rendering-contract-tier.md) | **Complementary, and deliberately not overlapping.** That pattern asks whether the non-happy-path states were specified and whether they render — mechanical, per state. This one asks whether the rendered whole is any good — judged, across states. A surface can pass the contract tier on all six states and still fail this gate. Its authoring-discipline lesson is why § 1 carries three consumers rather than one. |
| [`dod-verification-ladder-pattern.md`](dod-verification-ladder-pattern.md) | The five gates are mechanical oracles. This gate is outside that model by construction — see § 3, "How it relates to the DoD ladder." Only the review record is machine-checkable. |
| [`org-reviewer-authoring.md`](org-reviewer-authoring.md) | The reviewer shipped with this pattern follows the ADR-0002 `review()` contract; a consumer that wants a stricter screen gate writes its own reviewer under a different name rather than shadowing this one. |
| [`methodology-amendments-convention.md`](methodology-amendments-convention.md) | How a consumer files what it learns running this pattern. |
| [`global-rules/audit-discipline.md`](global-rules/audit-discipline.md) | Extended, not contradicted. Audit discipline says resolve the canonical source. § 1 says which source is canonical for a rendered surface. |
| film-room `decisions/0042-product-and-desktop-review-rebaseline.md` Decision 2 | **The role boundary, stated by a consumer.** "Blueprint remains the source of governance and evidence discipline. It is not the art director or the source of human product approval." That is the ceiling on everything in this pattern: it sequences the work and demands the receipts. It does not choose the direction, and a gate passing is not a person approving. Its context is the supersession rule in § 5. |
| forge-site `playbook/3.5-design-brief.md` § Purpose | **The same gap on a marketing site.** "Sites pass token review and still read as boilerplate, because token decisions (forge-brand) don't constrain page composition, signature visual moves, imagery direction, motion, or iconography." Different stack, different artifact, identical shape: a conformance check that passes while the composition nobody specified gets made implicitly at build time. |
| design-qa `design-qa-program.RECOVERED.md:103` § The missing layer: art direction | **Why a defect scanner needs a direction above it.** That program maps five layers of design intent and finds layer 4, art direction for a surface, empty — which is what made several of its own questions undecidable. It notes that naming category leaders as references "is arguably the opposite of art direction — it asks the surface to look like the category." design-qa enforces an approved direction; it never chooses one. Neither does this gate. |
| `docs/case-studies/design-system-audit.md` § The 15 dimensions | **Completeness is not coherence.** Those fifteen dimensions prove a design system is complete — color, type, icons, spacing, components, accessibility, responsiveness, data formatting. Every one can be specified and applied consistently while the screen is still incoherent, characterless, or undesirable. A completeness audit and a judged review answer different questions, and a green audit is not evidence for the second. |
| film-room `decisions/0010-desktop-design-pass.md` item 5 | **The internal reference implementation of the `rethink` path.** It reads: "Human gates run for real. G1 = operator picks from 2–3 developed design directions served at `/design` on live APIs (the mock-pass pattern)." Two things transfer. The directions are *developed* and served *live*, not sketched — the operator judges the thing rather than a picture of it. And the pick is a human gate that runs, which is what § 2c means by naming the human who chose. |
| `prototype-smoke-runner.md:36` | **The methodology's own admission of this gap.** It captures a screenshot per page and then says: "Their existence is the artifact; the agent doesn't visually inspect them but operators can." That is the honest ceiling of a smoke runner — and "operators can" was the whole gate, offered without a step that makes anyone do it. This pattern is that step. The smoke runner keeps producing the captures; the cold review is what turns them from an artifact into a verdict. |
| `render-judged` agent (`~/.claude/agents/render-judged.md`) | The judged tier already exists for **assets** — "nothing mechanical catches a wrong answer here," so a person judges appearance and wording. This pattern extends that same tier from an asset to a screen. Its rule that "a second copy of a gate is how a gate goes stale" is why the reviewer `.md` points here instead of restating the protocol. |

## 9. Retrofitting a consumer that already shipped

Minder is the worked example. The order matters — the cold review comes before the concepts, because reviewing what shipped tells you what the concepts have to beat.

1. **File the amendment entry.** Per `methodology-amendments-convention.md`, so the consumer's adoption is on the record.
2. **Write the experience brief and the object / action / state matrix** for the surface, against what shipped. The matrix usually finds the interaction defects on its own — an action with no owner, a state with no reverse.
3. **Run the blind cold review on the shipped build.** A reviewer who has not read the code, on real device captures, across the representative states. Record it with `kind: cold`. Expect `verdict: revise`; that is the point of running it.
4. **Now declare `design_intent`,** informed by what the cold review found. This is the one step whose order differs from a greenfield run: greenfield declares the intent before there is anything to look at, and a retrofit has a shipped build to read first. A cold review that finds the composition sound and the presentation tired is a `refit`. One that finds the screen is answering the wrong question is a `rethink`. Declaring before reading is guessing.
5. **If `rethink`: author the concepts and the selection ADR,** with a human making the pick. If `refit`: skip to the next step — the brief plus the cold review's findings are the direction.
6. **Implement, removing the obsolete UI and its tests rather than layering.** A retrofit that only adds reproduces the additive closeout that caused the problem. The tests pinning unreviewed copy come out in this step, not later.
7. **Run both reviews on the new build** — cold first, then conformance against the direction you selected.
