# Feedback — "V." (engineering lead) + "J." (engineering manager), internal thread

Thread of June 7 + June 9, captured 2026-06-11. Third and fourth organic
stakeholder signals; the first to review the *generated output itself* against
their own codebase. Identities anonymized for the public repo per the
anonymize-by-default capture rule — verbatim original in `feedback/raw/`
(gitignored, local only).

## The thread (condensed)

V. watched the shared walkthrough and engaged across two days:

- **Their own practice first**: "it's actually very similar to the mobbing
  idea we tried last week" — his team already runs an AI-facilitated mobbing
  process; their named pain is the refinement burden ("the main challenge is
  constantly refine our setup and instructions so they produce better
  results"), and their codegen "copies some of the patterns we are trying to
  get away from."
- **The accuracy finding (bug)**: "It's not very accurate — for example, the
  promotion one was pointed at the promotion service repo which contains only
  multi-lang translation behavior, where the main promotion logic still lives
  in [the monolith]." The architectural recommendation was grounded in the
  wrong repo — the analyzed codebase didn't implement the domain.
- **His model of the lifecycle**: three cycles — product discovery → clear
  user requirements → engineering spec (what API/UI, what protocol) →
  close-to-production code for engineer final review. "The idea is definitely
  valid, a lot of people are trying the same thing both internally and
  externally."
- **The team-gating thesis**: the approach "needs to land within the team" —
  PM assesses generated requirements (learning shared across PMs), PM+Eng
  jointly assess the spec ("most variable" across teams), Eng continuously
  assesses codegen/testing/ops. And the sharpest line: "we would never enter
  eng spec phase when the product requirement hasn't been fully vetted and
  signed off from domain team's PM… having someone trying to solo the entire
  cycle may look good for demo project, but probably not the ideal way to go
  with anything we want to push to prod."

J. (manager) brokered the engagement — asked his people to respond, framed a
structured retro for the author (what worked / didn't / would iterate / was
accelerated / was actually slowed), framed the broader effort as "testing and
learning how this works globally" — and made the load-bearing move:

> "even if the current recommendation is wrong … is that due to his lack of
> knowledge of the repo. If we pointed everything to him, could he try for a
> second attempt and we see if the AI got it any closer?"

V.'s answer: "it would definitely get closer" — with the caveat that the goal
is PM/Eng deciding faster with the right people assessing at each stage.

## What this is (in methodology terms)

1. **A bug with a methodology-shaped root cause.** The output was inaccurate
   because Stage-1 ran against a repo that doesn't implement the domain — and
   Stage-4 fact-check *verified green against the wrong ground truth*. The
   fact-check loop validates claims against the codebase it was pointed at; it
   has no check that the codebase is the right scope. False green, ground-truth
   edition.
2. **Market-signal, second instance.** V.'s mobbing practice + 3-cycle model is
   evidence about *their* practice, not the deliverable — the same class R.'s
   four-skill loop hit on 2026-06-10. The deferred `market-signal` triage
   category now has its second instance: the rule fires.
3. **The solo-cycle objection, named by the buyer.** "Solo the entire cycle…
   demo project, not prod" — with the constructive half: role-gated sign-offs
   per stage (PM → PM+Eng → Eng). His gates ARE Blueprint's stage-gate
   architecture, independently specified — but Blueprint's reviewers are
   agent/operator gates, not role-mapped team sign-offs. That gap is the
   adoption surface.
4. **An inbound advancement.** Nobody asked them for anything in this thread —
   they *proposed* a second-attempt experiment: full repo access + their
   review time, hypothesis on the table ("would the AI get closer?"). Per the
   ask-outcome discipline this is the strongest signal class in the log so
   far: a commitment offered, not extracted.

## Mom Test annotations

- **V. gave**: time, substantively — watched the walkthrough, reviewed the
  generated architecture against his real codebase knowledge, wrote a
  structured assessment across two days. The first stakeholder to evaluate
  the *artifact* rather than the pitch.
- **J. gave**: reputation — directed his team's attention onto the experiment,
  sponsored a structured retro, proposed the second attempt, framed org-level
  learning ("globally").
- **Said vs gave**: "the idea is definitely valid" is an opinion and weighs as
  one; the second-attempt proposal and two days of engineering review are the
  evidence.
- **Assumptions touched**: A3 strengthened (problem AND solution-shape, with
  the team-gates condition); A6 gains a partial counter-datum (incumbent loop
  + engaged anyway); NEW A7 (solo-operator prod credibility) challenged
  directly. See `docs/content/validation-script.md`.
