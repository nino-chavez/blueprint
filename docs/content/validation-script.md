# Validation script — Blueprint (self-application)

The self-app's demand assumptions, named per
`template/docs/methodology/mom-test-validation-pattern.md` (wave 51). This is
the first validation script the methodology has emitted — for itself. The
product's technical claims are fact-check-gated; the claims below are the
*demand* hypotheses that were never written down until the first organic
stakeholder feedback (`feedback/2026-06-09-casual-visitor.md`) disconfirmed two
of them in one Slack exchange.

## Riskiest assumptions

| # | Assumption | Evidence class | Kills the prescription if false? |
|---|---|---|---|
| A1 | A first-time visitor understands what Blueprint is and why it matters from the homepage, within a single-scroll / sub-60-second attention budget | agent-hypothesis — **DISCONFIRMED 2026-06-09** for the casual-visitor segment (see Log) | Yes — the portal is the front door; a front door that only works for visitors willing to dig is a filter, not a funnel |
| A2 | A practitioner who understands the pitch will install via `npx @nino-chavez-labs/blueprint-cli` and run an initiative | agent-hypothesis — no install/run telemetry from anyone outside this workspace | Yes — the published CLI is the productization thesis |
| A3 | Teams adopting agent-assisted delivery want a *methodology layer* (gates + artifacts + portal), not just better prompts | stakeholder-given (partial) — the partner-SA engagement committed reputation + time (client build on Blueprint + hive, wave 49); n=1, known relationship. **Problem-half gained a second source 2026-06** (see Log, R.): an unprompted eng lead — "incredibly difficult to get a whole team to align on something" — but the same source took no commitment ask, so the *solution*-demand half is still unproven | Yes — this is the core demand thesis |
| A4 | A confused visitor self-serves by asking an agent ("Claude, how do I use this?") | agent-hypothesis — **DISCONFIRMED 2026-06-09**: the remediation was offered verbatim and explicitly rejected ("I don't want to replace real humans with claude") | No, but it removes the assumed safety net under A1 — A1 must stand on its own |
| A5 | Users become contributors via the amendments convention | agent-hypothesis — zero external amendments to date; every wave to date is author-originated | No — but false means the flywheel narrative in the docs is aspiration, not mechanism |
| A6 | A practitioner who already runs a personal spec-driven loop will align it to (or swap it for) a shared methodology layer | agent-hypothesis — live counter-pressure: the first eng-lead respondent (R., see Log) runs his own four-skill loop, names org-level adoption "incredibly difficult", complimented the work, and took no commitment ask; field response per the author's own report is "stay out of my kitchen" | No — but false caps adoption at practitioners *without* an incumbent loop; the BYO-loop crosswalk (`docs/content/deferred.md`) is the hedge |

## Three scary questions

Asked first, while being wrong is cheap:

1. **Can anyone who isn't the author say what Blueprint is after 60 seconds on the homepage?** (Kills A1. D.'s answer: no.)
2. **Has anyone run an initiative end-to-end without the author in the loop?** (Kills A2/A3. The partner-SA engagement is the live test — its outcome is the answer.)
3. **When someone wanted to adopt, what did they actually reach for first — the methodology, or just the reviewer gates / one tool?** (Kills the packaging thesis if adopters consistently cherry-pick.)
4. **When a practitioner with a working personal loop sees the pitch, do they ask to align their loop to it — or compliment it and keep theirs?** (Kills A6. First datum: R. complimented, asked good questions, kept his loop — explicit ask on the table, not taken.)

## Conversation plan (per assumption)

### A1 — front-door comprehension
- Ask: "You opened the site — walk me through what you did in the first thirty seconds. Where did your eyes go, where did you stop?"
- Ask: "What did you think it was, in your own words, when you closed the tab?"
- Listen for: a wrong-but-confident answer (worse than "no idea" — it means the page teaches the wrong thing).

### A2 — install conversion
- Ask: "When you last tried a new dev tool from a landing page, what made you actually run the install command vs file it away?"
- Ask: "What was the last CLI you installed and abandoned inside a week? What happened?"
- Listen for: the abandonment trigger — if it's "the first run asked too much of me," Tier 0's entry cost is the exposure.

### A3 — methodology-layer demand
- Ask: "On your current AI-assisted project, what broke last time two sessions/people worked the same repo?" (their life, not our idea)
- Ask: "What did you do about docs/review gates on that project — what exists today?"
- Listen for: whether they describe the entropy-wall signals unprompted (`docs/variant-selection.md` § entropy wall). If they don't have the problem, they won't want the layer.

### A4 — agent-assisted fallback
- Ask: "Last time a tool confused you, what did you actually do next — in order?"
- Listen for: where "asked an AI" actually ranks vs "asked the person who sent it" / "closed the tab." (D.: closed the tab, then asked the human.)

### A5 — contribution flywheel
- Ask: "Have you ever filed an issue/PR on a tool you adopted? What pushed you over the line that time?"
- Listen for: whether the trigger was friction they felt vs goodwill — the amendments convention assumes felt-friction converts.

### A6 — personal-incumbent displacement
- Ask: "Walk me through the last time you actually changed your own dev loop — what forced it?"
- Ask: "What would your current loop have to fail at before you'd adopt someone else's?"
- Listen for: whether the trigger is ever "a better loop existed" vs "my loop broke at a team seam." If it's only the latter, sell to the seam (multi-session entropy, handoffs, review consistency), never to the individual's kitchen.

## Commitment asks

- **Time**: a 30-minute screen-share watching them open the portal cold and narrate (A1), or run `npx … init` on a real repo (A2).
- **Reputation**: an intro to one team lead who has the multi-session entropy problem (A3).
- **Money**: a scoped engagement where Blueprint is the contracted delivery method (A3 — the partner-SA engagement is this ask, in flight).
- **Time (A6, named target)**: a working session with R. mapping his four-skill loop onto Blueprint primitives. Whether he shows up IS the A6 test — a second compliment-and-keep-theirs is a second disconfirming datum.

## Log

| Date | Who | What they said (summary) | What they GAVE | Ask made → outcome | Assumptions touched |
|---|---|---|---|---|---|
| 2026-06-09 | D. — casual-visitor persona (Slack DM, unprompted) | Opened the portal wanting to understand it; bounced — more than a casual visit's attention budget; explicitly rejected ask-an-agent as the fallback | time (visited, engaged, articulated the bounce) | no ask made (unprompted exchange; the P4 cold-open re-test ask is pending) | A1 **disconfirmed** (casual segment); A4 **disconfirmed** |
| 2026-06-05→ | the partner SA, T. (client engagement, wave 49) | Adopting Blueprint + hive for a real client commerce-platform build with his team | reputation + time (client delivery staked on it) | money-class ask in flight — the engagement IS the ask | A3 supporting (n=1, known relationship); A2 in test |
| 2026-06 (pre-public thread; captured 06-10) | R. (eng lead, Slack channel) | Unprompted, described his own four-skill spec loop (create-spec → adversarial review-spec with "build ready" gate and "contradictions" → implement-spec → review-implementation); called spec-driven "The Way"; named team alignment the hardest part ("incredibly difficult to get a whole team to align"); asked what the tooling is for, in a broader sense | none — "this is very cool" discounted per the kudos rule | time ask (tokens, repo access) → **not taken** | A3 problem-half supported (2nd source, buyer persona, no relationship obligation); **A6 named and embodied** (incumbent loop, no conversion); scary question 4 answered once: compliment-and-keep-theirs |
