---
canonical: true
---

# Redesign Evaluation — how divergent concepts get built, compared, and converged

`judged-screen-pattern.md` § 2c says what a `rethink` owes: a blind cold review of the shipped screen, curated prior art with a question per reference, three divergent whole-screen concepts, and a named human selection with the rejected concepts preserved. This pattern is the procedure that produced those five things twice, on two products, and states what each step actually takes to run — not a restatement of what § 2c already requires.

**Status: promotion candidate.** Rally HQ's art-direction pass (2026-09-22) is the origin; 630 Volleyball's visual-direction pass (2026-09-23) is the second instance, run from Rally HQ's own written method. Where the two diverge or where 630 found a gap in the first write-up, this version carries the correction.

## 1. Build every candidate on the real product, with the current look as a control

A concept judged as a static comp is a picture of a decision, not the decision. Both consumers found the same failure mode and the same fix: comps invite an open-ended "which do I like," and a candidate rendered in the live app on real data forces a real answer.

Build each candidate as a switchable layer on the real codebase — a dev-only query parameter or cookie that stamps an attribute the app's own styles key off, so every route renders in that direction with no flash, and it never reaches production by accident. The shipped, currently-approved look is one of the candidates, not a memory to compare against: it is the control, rendered the same way as the others.

630's direction record names the candidates this way: `current` (the shipped site, the control), plus three built directions, each described by where its boldness comes from rather than by a name alone. That framing — what makes each one bold, not just what it looks like — is what let the later bakeoff (§ 4) argue about substance instead of taste-by-adjective.

**Rally HQ's own miscue, corrected the same session:** static concept cards were re-rolled three times with no decision reached. The first round built on the real app produced a decision in one look. If a project is tempted to save the live-rendering step for later, that is the step to do first, not last.

## 2. Capture every candidate from one install, in one window, on the same fixtures

**Same data, same states, same moment.** Capture every candidate from one running instance, on the same database, minutes apart — 630's full capture set was taken from one install across a five-minute window, all ten pages at two widths, with the receipt recording which font each candidate actually rendered (a fact worth capturing mechanically rather than trusting from memory, per § 4). A state that can go stale between captures (live data, an expiring banner) gets refreshed and every candidate re-captured inside the same window; a comparison where one candidate shows a different state than another is not a comparison.

**Fixtures come from the product's own generators or API, not hand-scripted data.** Look for an existing demo/seed generator or an API with a key before writing one. Hand-scripted fixtures guess the domain's rules wrong and hit rate limits the real generator already accounts for. When a state the comparison needs is missing, extend the generator rather than script around it.

## 3. A named, bounded sample — and a named "not sampled" list

Pick a fixed set of screens that cover the audience's real jobs, not every route in the app: for a public site, the home page, key landing pages, a dense list, a detail page, a form, at mobile and desktop widths. 630's sample named ten pages by the family's actual question on each one, and named eleven more explicitly as **not sampled** — including "anything past the hand-off to LeagueApps," a boundary that mattered because it marked where the redesign's authority ended. State both lists. A sample with no stated boundary invites a later reviewer to assume coverage that was never claimed.

## 4. Diverge for real, run the blind and red-team passes, then converge and graft

**Diverge in structure, not palette.** Three candidates that differ in how the job gets done, not three recolors of one layout — this restates § 2c item 4 and does not relax it.

**Curated prior art enters as a question per reference**, per § 2c item 3: name what you are asking each source — how it handles density, how it opens, how it fails — never "here is a site we like." 630's record cites five sources this way, including two design-principle videos and Rally HQ's own style guide §12, each tied to a named claim the candidate was checked against, not offered as a mood board.

**A blind review judges the rendered frames**, per § 2c item 1 restated for a comparison rather than a single build: reviewers see only the candidates, under neutral labels, with the key held outside their packet. **Verify every deciding reason at source before trusting the verdict.** 630's blind bakeoff had two of three reviewers pick the same candidate for the same stated reason — "consistent headline font" and "switches typeface" — and both were checking pixel evidence: every candidate rendered one typeface; the actual defect was uneven page-title sizing on the other candidate, fixed in one commit once traced. A blind reviewer's stated reason is a hypothesis about what they saw, not a fact about the render, and it gets checked the same way any other finding does.

**A red-team pass, named rather than blind, argues each side and gets checked the same way.** Attacking a candidate and attacking its rival each surface claims that need a pixel check before they count — 630's record found three of a red team's four claims about color and case were false on inspection, and kept the one that held.

**Record the owner's taste in the words used, not a paraphrase**, so a later round does not re-offer what was already rejected. 630's record: Nino rejected two directions outright with a stated reason ("boxy and outdated"), and separately narrated what to keep and drop from the remaining two before a blended candidate was built — "keep buttons/actions style from current. adopt tabbed link style from clubhouse... build a new mock." That sentence is why the winning candidate exists at all; a summary of it as "he liked a mix" would have lost the instruction.

**Converge with the ADR § 2c already requires, then walk the rejected candidates once more for anything worth grafting.** A graft is not a concession that the loser had merit as a whole — it is naming one specific element worth taking, recording what was taken and what was deliberately left out, and folding it into the winner by hand so the result still holds together as one design (this is the same discipline the operator preferences call the arena's graft step, applied here to a design decision rather than a written one). 630's blended candidate is itself a graft — a button style from the control, a tab treatment and typeface from one rejected candidate, a color approach from another — recorded as such before the bakeoff, not reconstructed afterward.

## 5. Check the chosen look against the product's own rules before building it

A picked color, spacing value, or type choice can violate a rule the product already enforces — a contrast minimum, a reserved state color, a validator. Read the codebase's own color, contrast, and state rules before committing to the choice, not after building it out. Rally HQ's picked accent collided with a color its own validator reserved for a live-match state; 630's bakeoff record checks the winning candidate against the club's own brand-guide color reservation before the port, not as an afterthought.

## 6. Separate a pre-existing gap from a regression the redesign introduced

When a cold or informed review of the current product turns up a finding, check it against the production build before attributing it to the redesign: most findings on an existing product predate the change under review, which changes what the finding means (a debt to note, not a defect the redesign caused) versus a genuine regression the new direction introduced.

## 7. Port through the real system, then re-verify frame by frame

The comparison layer from § 1 is throwaway — it exists to let people judge live, not to ship. Once a direction is chosen, port it through the design tokens and the components that actually own the surface, then re-capture the ported build next to the approved comparison frames and diff them, state by state, at the same widths. 630's port (PR #172) pixel-diffed the shipped build against the approved frames at 2% fuzz across ten pages and two widths, and named the two frames that exceeded it along with the specific cause of each rather than rounding the diff down to "matches." Rally HQ's own first port drifted in six places a passing build had reported as done — the diff is what caught what the build status could not.

## 8. Where this sits among the existing patterns

| Pattern | Relationship |
|---|---|
| [`judged-screen-pattern.md`](judged-screen-pattern.md) § 2c | Owns what a `rethink` must produce — this pattern is the working procedure for producing it. |
| [`confident-preview-rule.md`](confident-preview-rule.md) | Governs what reaches the stakeholder-facing portal after convergence — one confident take, not the deliberation from this pattern's § 4. |
| [`product-experience-audit.md`](product-experience-audit.md) | A source-grounded principle scan — naming specific design principles from a cited source and pairing each with the product's own screen — is a Diagnose-stage technique under that procedure's "Informed review tracks," not a `rethink` concept exercise. Both consumers of this pattern ran that scan first, on the live product, before any candidate was built; its findings fed direct fixes in one case and the case for a `rethink` in the other. See that document's Gestalt/hierarchy and visual-system tracks for where the technique's questions already live. |
| `methodology-amendments-convention.md` | How a consumer files what it learns running this pattern. |

## 9. Provenance

Rally HQ's method write-up (`review/design-principle-scan-20260922/redesign-evaluation-method.md` in 630 Volleyball's repo, commit `c78f0cfb` — written there as a portable method for another session to apply, citing Rally HQ's own `design/art-direction-2026-09-22` branch, `DIRECTION.md`, `capture.mjs`, and PR #369) is instance one. 630 Volleyball's application is instance two, in two parts: the principle scan (`review/design-principle-scan-20260922/scan.md`, commit `c78f0cfb`; shipped as PRs #160–#168) and the direction bakeoff (`review/visual-directions-20260923/DIRECTION.md` on branch `design/visual-directions-20260923`, commit `58b34440`; ported in PR #172, merge commit `9cce4716`). Where 630's record corrected or extended Rally HQ's write-up — the deciding-reason verification in § 4, the graft-recording discipline, the product's-own-rules check in § 5 — this pattern carries 630's version.
