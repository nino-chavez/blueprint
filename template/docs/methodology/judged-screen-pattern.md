# Judged Screen Pattern — the rendered frame is the source, and nothing was reading it

**Status: promotion candidate (Minder native iOS 2026-09-01; design-qa web program 2026-07; blog 11-variant portal 2026-05-23). Pattern promotion-ready; the `.mjs` reviewer's mechanical half ships now, the judged half is a protocol.**

Three consumers reached the same failure from different stacks. This pattern is the shared fix.

## 1. Every gate verifies text or source; for a screen the canonical source is the rendered frame

Blueprint's gates read artifacts. A reviewer greps a spec, resolves a citation, counts rules in `DESIGN.md`, or confirms a test passed. Each one is honest about what it reads. None of them look at the screen.

That is a gap, not an oversight, and it has a precise shape. `global-rules/audit-discipline.md` tells a reviewer to "grep the actual file, read the actual code." For a rendered surface that instruction resolves to the wrong artifact. Source is evidence of **intent**. The screen is the **result**. A reviewer can verify every rule in the source, correctly, and still be looking at something other than what the user sees.

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

## 2. Stage 2 gains two artifacts: an experience brief and three divergent concepts

`confident-preview-rule.md` points variant deliberation upstream to Stage 2. This section is where that pointer now lands.

### 2a. The experience brief states the user's situation before anyone draws

Write it at `prototype/EXPERIENCE-BRIEF.md` (or `portal/EXPERIENCE-BRIEF.md`, matching whichever shell the initiative uses). It is authored before the first concept and it is the document the screen review reads the job questions from.

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

### 2b. Three divergent concepts, one ADR, then Stage 3

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

Converge with an ADR in `decisions/` before Stage 3 begins. The ADR names the chosen concept, names the rejected ones, and says what the choice buys. This is exactly the artifact `confident-preview-rule.md` § "When deliberation is appropriate" already asks for; the concepts are the deliberation it presumed had happened somewhere.

**What it means:** one confident preview reaches stakeholders, and the convergence that produced it is now a real Stage 2 activity rather than an assumption.

## 3. The gate is a cold review of device captures, and nothing else satisfies it

The judged screen review is the gate this pattern adds. It is judged, not mechanical, and it is deliberately outside the oracle model the five DoD gates use.

### Who reviews

A reviewer who has **not** read `DESIGN.md`, the PRD, the experience brief's rationale, or the implementation. Cold. They may read the brief's five job questions — that is the standard they judge against — and nothing else.

The reviewer is never the implementer. It may be a second model, a second session, or a person. The requirement is only that the reviewer arrives without the context that makes a weak screen look justified. Context is what the person shipping already has, and it is precisely what stops them from seeing the frame.

### What is reviewed

Device captures, one per representative state. A real device for native. A real viewport for web. Not a simulator screenshot passed off as a device capture, not a component in isolation, not a design file.

Captures live beside the record they belong to, at `docs/evidence/screen-reviews/<surface>-<build>/`, one file per state named for that state. Keeping them next to the review is what lets a later reader check the verdict against what was actually judged; a review pointing at captures that have since moved or been regenerated is a claim with no evidence behind it.

### How it is judged

The reviewer answers, in order:

1. **Does the frame answer the job questions?** Take them from the brief. What is happening now, what is next, who, when and where, what can I do.
2. **What does the eye land on first, second, third?** Report the actual order, not the intended one.
3. **What competes?** Name the elements fighting for the same rank.
4. **What can be removed, combined, demoted, or disclosed?** Every element gets tested against these four, and "keep as is" is a verdict that has to be earned.
5. **Classify every element** as one of: correct, usable but weak, appealing but wrong, unnecessary, defect. The middle three are the ones a passing test suite cannot distinguish from correct.

### What is written down

A file at `docs/evidence/screen-reviews/<surface>-<build>.md` with this frontmatter:

```yaml
---
surface: today                    # the surface reviewed
build: 12                         # build number, or a commit sha
device: iPhone 15 Pro, iOS 18.2   # real device / real viewport
reviewer: <who judged>            # a person, model, or session id
implementer: <who built it>       # must differ from reviewer
cold: true                        # reviewer had not read spec, brief rationale, or source
states: [active, upcoming, empty, failure, largest-text]
verdict: accept                   # accept | revise
---
```

Then the answers to the five questions above, in prose.

**Passing tests and source verification never satisfy this item.** A green suite says the code does what the code was told to do. A source check says the rules were followed. Neither has looked at the frame. When a review is recorded as `accept` on the strength of either one, the gate has been skipped, not passed.

### How it relates to the DoD ladder

`dod-verification-ladder-pattern.md` builds five gates on mechanically answerable oracles — a registry parse, a presence check, a recorded test result. Its honesty comes from every gate resolving to something a machine can check.

This gate has no such oracle, and pretending otherwise would be the failure the ladder exists to prevent, inverted. So it sits **outside** the ladder rather than as a sixth gate. What is mechanical here is only the **record**: does a review file exist for this surface, is it cold, is the reviewer someone other than the implementer, does it accept, is it current with the build. That is what `screen-composition-reviewer.mjs` checks. The judgment inside the file is not machine-checkable and the reviewer does not pretend to check it.

## 4. Closeout asks what came off, not only what went on

Slice closeout is additive today: it records what the slice added and what now passes. Twenty-seven such closeouts sum to a screen nobody designed.

Every slice closeout gains one line:

> **Removed / combined / demoted / disclosed:** … If nothing, why.

"If nothing, why" is the load-bearing half. A slice that adds without subtracting may be correct; a slice that cannot say why is accreting.

## 5. The evidence ladder gains a rung: the rendered whole, reviewed cold

A consumer that runs a physical-evidence ladder inserts one rung:

| | Rung |
|---|---|
| … | the artifact installs and launches on the target |
| **new** | **the rendered whole has been judged by someone who did not build it** |
| … | the artifact's behavior is accepted |

A consumer running a physical-evidence ladder already has names for the outer two rungs; slot the new one between them under whatever those names are. Those are three different claims. Installing proves it launches. Accepting behavior proves it does the thing. Neither one has judged the frame, and without the middle rung a ladder walks straight past the only question this pattern is about.

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
| `render-judged` agent (`~/.claude/agents/render-judged.md`) | The judged tier already exists for **assets** — "nothing mechanical catches a wrong answer here," so a person judges appearance and wording. This pattern extends that same tier from an asset to a screen. Its rule that "a second copy of a gate is how a gate goes stale" is why the reviewer `.md` points here instead of restating the protocol. |

## 9. Retrofitting a consumer that already shipped

Minder is the worked example. The order matters — the cold review comes before the concepts, because reviewing what shipped tells you what the concepts have to beat.

1. **File the amendment entry.** Per `methodology-amendments-convention.md`, so the consumer's adoption is on the record.
2. **Write the experience brief and the object/action/state matrix** for the surface, against what shipped. The matrix usually finds the interaction defects on its own — an action with no owner, a state with no reverse.
3. **Run the cold screen review on the shipped build.** A reviewer who has not read the code, on real device captures, across the representative states. Record it under `docs/evidence/screen-reviews/`. Expect `verdict: revise`; that is the point of running it.
4. **Author three divergent concepts** on the same states, informed by the review.
5. **Write the selection ADR** in `decisions/`.
6. **Implement the chosen concept — removing the obsolete UI and its tests rather than layering.** A retrofit that only adds reproduces the additive closeout that caused the problem. The tests pinning unreviewed copy come out in this step, not later.
