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
| A3 | Teams adopting agent-assisted delivery want a *methodology layer* (gates + artifacts + portal), not just better prompts | stakeholder-given (partial) — the T. engagement committed reputation + time (client build on Blueprint + hive, wave 49); n=1, known relationship | Yes — this is the core demand thesis |
| A4 | A confused visitor self-serves by asking an agent ("Claude, how do I use this?") | agent-hypothesis — **DISCONFIRMED 2026-06-09**: the remediation was offered verbatim and explicitly rejected ("I don't want to replace real humans with claude") | No, but it removes the assumed safety net under A1 — A1 must stand on its own |
| A5 | Users become contributors via the amendments convention | agent-hypothesis — zero external amendments to date; all 51 waves are author-originated | No — but false means the flywheel narrative in the docs is aspiration, not mechanism |

## Three scary questions

Asked first, while being wrong is cheap:

1. **Can anyone who isn't the author say what Blueprint is after 60 seconds on the homepage?** (Kills A1. D.'s answer: no.)
2. **Has anyone run an initiative end-to-end without the author in the loop?** (Kills A2/A3. The T. engagement is the live test — its outcome is the answer.)
3. **When someone wanted to adopt, what did they actually reach for first — the methodology, or just the reviewer gates / one tool?** (Kills the packaging thesis if adopters consistently cherry-pick.)

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

## Commitment asks

- **Time**: a 30-minute screen-share watching them open the portal cold and narrate (A1), or run `npx … init` on a real repo (A2).
- **Reputation**: an intro to one team lead who has the multi-session entropy problem (A3).
- **Money**: a scoped engagement where Blueprint is the contracted delivery method (A3 — the T. engagement is this ask, in flight).

## Log

| Date | Who | What they said (summary) | What they GAVE | Assumptions touched |
|---|---|---|---|---|
| 2026-06-09 | D. (Slack DM, unprompted) | Opened the portal wanting to understand it; bounced — "my attention is not going to allow me to dig in"; explicitly rejected ask-an-agent as the fallback | time (visited, engaged, articulated the bounce) | A1 **disconfirmed** (casual segment); A4 **disconfirmed** |
| 2026-06-05→ | T. (client engagement, wave 49) | Adopting Blueprint + hive for a real client the commerce platform build with his team | reputation + time (client delivery staked on it) | A3 supporting (n=1, known relationship); A2 in test |
