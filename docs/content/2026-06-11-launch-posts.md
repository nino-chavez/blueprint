# Launch posts — Show HN, r/ClaudeAI, lobste.rs

Drafts for the first public launch round, written 2026-06-11. Every claim in
these drafts is checkable against the repo at time of writing; if you edit,
keep the adoption honesty intact — overclaiming here poisons the one asset
the project has (receipts). Voice: plain and technical per venue norms;
vulnerable competence only where grounded (the disconfirmed assumptions are
real, in `validation-script.md`).

**Pre-flight (do before posting anywhere):**

1. Paste the CF Web Analytics token into `Layout.astro` `CF_BEACON_TOKEN`
   and deploy — launch attention is a one-time spike; unmeasured, it's gone.
2. Sanity-pass the live site one more time: `/`, `/demo`, `/faq`, quickstart
   commands.
3. Block 3–4 hours after each post to answer comments. Fast, non-defensive
   replies are most of the outcome.

**Sequencing:** HN first (Tue–Thu, 8–10am ET is the conventional window).
Reddit the next day. lobste.rs requires an invited account — whenever that
exists. Do not post all three the same day; the communities overlap and
notice.

---

## 1. Show HN

**Title** (plain, no superlatives — HN strips/penalizes marketing):

> Show HN: Blueprint – executable stage gates for AI-assisted product work

**URL:** `https://blueprint-platform.pages.dev`

**Text field:** leave empty; post the author comment below immediately after
submitting (first-comment convention).

**Author comment:**

> Author here. Blueprint started as a private rule-set after AI-assisted
> projects kept failing the same way for me: work that looked finished and
> didn't hold up — confident claims nobody verified, decisions nobody wrote
> down.
>
> It's a methodology plus a CLI (MIT, on npm). The agent does the building —
> Claude Code today, though 15 of the 18 reviewer gates are plain Node
> scripts that run from any terminal or CI. The method forces artifacts at
> each of seven stages: research with evidence paths, decision records that
> cite the research that grounds them, a fact-check pass that traces claims
> to source. A reviewer gate blocks each stage until it's actually done, and
> `blueprint doctor` ends its report with what it did NOT check — which I've
> come to think is the most important line of output in the project.
>
> Two things that might be interesting even if you never use it:
>
> - The site is the product's own output, and the gates run on the site's
>   copy too. A prebuild lint fails the deploy if the homepage claims a
>   command count that contradicts the CLI's help text or shows the stage
>   chain out of order. The audit that motivated it found the homepage
>   miscounting the CLI's own commands — on a product whose pitch is
>   fact-checking. That class of rot is now a build failure.
> - The /demo route replays real captured CLI transcripts — typed-out
>   terminal scenes, but nothing mocked. Faking terminal output in a demo of
>   a fact-checking tool felt like failing its own gate.
>
> Honest state: this is mostly me. One external team engagement is in
> flight and the registry has one independent adopter. The demand
> assumptions — including two that early field conversations already
> disconfirmed — are written down in the repo (docs/content/validation-script.md).
>
> The thing I'd most like beaten up: whether teams actually want a shared
> methodology layer, or whether every senior engineer keeps their own
> kitchen and the seam never gets crossed. The strongest objection I've
> heard so far came from exactly that direction.

**Likely objections + the honest line (don't paste; internalize):**

- "Yet another AI process framework" → agree it's a crowded shape; the
  differentiator is executable gates + the self-application receipts, not
  the stage names. Link /faq.
- "Solo cycle isn't prod-grade" → agree; agent gates layer under human
  sign-offs, never replace them (a stakeholder said exactly this; it's in
  the FAQ).
- "Why Claude Code only?" → 15/18 gates + all 7 CLI commands run anywhere;
  the stage skills are Claude Code today. True gap, named on /faq.

---

## 2. r/ClaudeAI

**Format:** text post, link inline. Pick the showcase/project flair at
submit time.

**Title:**

> I turned my product-work guardrails into a Claude Code methodology —
> stages as skills, reviewer agents as gates (MIT)

**Body:**

> After a year of running product initiatives with Claude Code, the failure
> mode I kept hitting wasn't capability — it was rot. Fast, convincing
> output; claims nobody verified; decisions nobody wrote down.
>
> Blueprint is the rule-set I ended up with, packaged: seven stages
> (research → prototype → fact-check → docs → deploy), each one a slash
> skill (`/blueprint-research`, `/blueprint-prototype`, …), each gated by a
> reviewer that blocks the next stage until the artifacts actually exist.
> 15 of the 18 reviewers are plain Node scripts with exit codes, so they run
> in CI too — your agent can't talk its way past them.
>
> Scaffold is one command: `npx @nino-chavez-labs/blueprint-cli init
> --name=my-initiative`
>
> The 35-second demo replays real CLI transcripts (nothing mocked):
> https://blueprint-platform.pages.dev/demo — and the site itself is the
> methodology's own output, gates on the copy included.
>
> Honest state: mostly me, one external team mid-engagement. I wrote down
> the demand assumptions including the ones early conversations
> disconfirmed.
>
> What I'm actually asking this sub: how do you keep agent output honest on
> real multi-session projects today? If you have your own loop, what would
> it take to share it with a team — or is that seam not worth crossing?

---

## 3. lobste.rs

**Mechanics:** invited accounts only. Check the "I am the author" box.
Tags: `ai`, `practices`. Lobsters skews more skeptical of product sites than
HN — submit the GitHub repo, not the marketing page.

**URL:** `https://github.com/nino-chavez/blueprint`

**Title** (no "Show HN"-style prefix; plain description):

> Blueprint: executable stage gates and artifact receipts for AI-assisted
> product work

**First comment (author):**

> Author. The short version: an agent runs a seven-stage product pipeline;
> executable reviewers gate each stage on artifacts (research with evidence
> paths, decisions citing their research, claims traced to source); the
> doctor command reports what it didn't check. 15 of 18 gates are
> dependency-free Node scripts with exit codes — CI-runnable, agent-
> agnostic; the orchestration skills are Claude Code today.
>
> The repo is its own first consumer — the product site deploys through the
> same gates, including a prebuild lint that fails the build when site copy
> contradicts the CLI (command counts, stage order, version literals).
> Adoption is honestly small: one external team engagement in flight, one
> independent adopter, assumptions-with-disconfirmations on the record in
> docs/content/validation-script.md.

---

## After posting

- Add each thread URL to `feedback/` as a capture file; comments are
  stakeholder feedback and triage through `/blueprint-triage` like any other
  (HN objections are A3/A6/A7 evidence either way).
- Watch the analytics funnel: demo views → quickstart clicks → npm
  downloads. That's the A2 instrument this launch exists to read.
- One re-post of a Show HN that got no traction is tolerated weeks later;
  more than that is not.
