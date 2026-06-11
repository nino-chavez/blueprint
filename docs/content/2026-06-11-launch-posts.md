# Launch posts — HN, r/ClaudeAI (+ r/ClaudeCode), lobste.rs

Drafts for the first public launch round, rewritten 2026-06-11 around the
comparison-led angle. The reception research (4-lens, 2026-06-11) was blunt:
methodology launches have a median of 2 points on HN (n=892 comparables;
BMAD went 0-for-8 submissions; GitHub's own Spec Kit needed ~20 attempts for
one 84-point hit), while ANALYSIS of the field outperforms the field
(Fowler's SDD-tools piece: 128 points; the "Waterfall Strikes Back" critique:
225). So the lead artifact is not Blueprint — it is the comparison page at
`/compare`: a dated, source-cited read of how 14 spec-driven dev tools
implement their gates, with Blueprint as one disclosed row among them.

Honesty rules for every draft below (these are the asset; do not trade them):

- Every competitor claim traces to a source the research actually read —
  their repo file, README, or a cited vendor page. Nothing asserted beyond it.
- Competitors get their best feature named generously: GSD's adversarial
  verifier, Kiro's property-based testing, OpenSpec's visible dogfooding,
  BMAD's breadth, Spec Kit's reach. Generosity is the credibility mechanism.
- Blueprint's row carries its own caveats: stage skills are Claude Code only;
  adoption is one team engagement in flight plus one independent adopter; the
  gates verify artifacts and copy — they do not make the work good.
- Everything is a dated snapshot ("sources read 2026-06-11", star counts
  approximate) with a corrections-welcome line pointing at GitHub issues.
- Wording trap, never violate: Spec Kit's `check-prerequisites.sh` IS an
  exit-code gate — on artifact file EXISTENCE. Blueprint's claim is
  "executable gates on artifact CONTENT and evidence", never "the only
  executable gates."

**Pre-flight (do before posting anywhere):**

1. Paste the CF Web Analytics token into `Layout.astro` `CF_BEACON_TOKEN`
   and deploy — launch attention is a one-time spike; unmeasured, it's gone.
2. Sanity-pass the live site: `/`, `/demo`, `/faq`, `/compare`, quickstart
   commands. On `/compare` specifically: every competitor row cites its
   source file, the snapshot date reads 2026-06-11, and the Blueprint row
   carries its caveats.
3. Block 3–4 hours after each post to answer comments. Fast, non-defensive
   replies are most of the outcome.

**Sequencing:** HN first (Tue–Thu, 8–10am ET is the conventional window).
Reddit the next day. lobste.rs requires an invited account — whenever that
exists. Do not post all three the same day; the communities overlap and
notice.

---

## 1. HN (regular submission, NOT Show HN)

This is a link submission of the comparison page, not a Show HN of the
methodology. The research is unambiguous: none of the 50+ point winners in
the space led with "methodology", "framework", or "spec-driven" as the title
noun, and commentary about the field outscores the field's tools.

**Title** (plain, falsifiable, no "methodology"/"framework"):

> I read how 14 spec-driven dev tools' gates actually work

**URL:** `https://blueprint.ninochavez.co/compare`

**Author comment** (post immediately after submitting):

> Author here, with the disclosure first: I built a 15th tool in this
> category — Blueprint, the last row on the page — so discount that row
> accordingly. The page cites every competitor's source file so you can
> check me.
>
> What I did: read the README and, where the repo is public, the actual gate
> implementation — the shell scripts, the workflow-step source, the verifier
> prompts — of 14 spec-driven dev tools (Spec Kit, BMAD, GSD, OpenSpec,
> PRP, and the rest of the page's rows). For the commercial closed ones
> (Kiro, Tessl, Intent) I used the vendor's own docs. One row — Superpowers —
> is tabled from community data only and flagged as such on the page;
> corrections especially welcome there. Sources read 2026-06-11; star counts
> are approximate as of the same day.
>
> The finding, in one sentence: almost every "gate" in this field is either a
> human approve/reject prompt or a checklist an LLM runs against itself. The
> exceptions, and what they actually execute:
>
> - Spec Kit's `check-prerequisites.sh` exits non-zero when stage artifacts
>   are missing — a real exit-code gate, on file existence. Its content-level
>   checks (`/speckit.checklist`, `/speckit.analyze`) are LLM-interpreted,
>   and the workflow engine's "gate" step is an interactive human
>   approve/reject that falls back to PAUSED in CI.
> - Kiro generates property-based tests from EARS requirements — the most
>   credible executable verification in the market, aimed at code-vs-spec.
> - PRP embeds real validation loops — type-check, lint, tests, build —
>   that iterate until green. Code quality, not stage artifacts.
> - OpenSpec's `validate --strict` is a real CI-runnable CLI check of spec
>   structure — and OpenSpec explicitly rejects blocking phase gates as a
>   philosophy. Their argument is worth reading even if you end up on the
>   other side. They're also the only tool I found that visibly dogfoods
>   itself: their repo carries its own dated change archive.
> - GSD has the best distrust-the-agent stance in the field — its verifier
>   instructions literally say "Do NOT trust SUMMARY.md claims." The gates
>   themselves are mostly prompt-enforced, with a few real exit-code scripts.
> - BMAD has the broadest scope — research and briefs and PRDs through
>   implementation — with checklist-and-handoff enforcement, all agent-run.
>
> Blueprint's row, with its caveats: 15 of its 18 stage reviewers are
> dependency-free Node scripts with exit codes that check artifact content
> and evidence — research files with evidence paths, decisions that cite
> their research, site copy that doesn't contradict the CLI. The
> orchestration skills are Claude Code only. Adoption is one external team
> engagement in flight plus one independent adopter. And the gates verify
> that artifacts exist and claims trace — they do not make the work good.
>
> If I've misread your tool, file an issue
> (https://github.com/nino-chavez/blueprint/issues) and I'll correct the
> page — it's a dated snapshot, not scripture.

**Internal notes (don't paste; internalize):**

- Base rate: the modal outcome for anything in this space is single-digit
  points and zero comments (median 2 across 892 comparables). The comparison
  format moves the odds — analysis outperforms launches — it does not
  guarantee anything. Do not let a 2-point result trigger a framing rewrite.
- "You built one of them, of course yours wins" → the page is what each
  tool's gate executes, not a ranking; concede on the spot what others do
  better (Kiro's code-level verification is stronger than anything Blueprint
  does at the code layer; GSD's distrust stance is the right instinct).
- "Spec Kit has executable gates too" → yes, `check-prerequisites.sh`,
  existence-level — the page says exactly that. The claim is content/evidence
  gates, never "only executable gates."
- "Token burn" → the gates are Node scripts; running them costs zero tokens.
- "Is the amendments/contribution story real?" → cite wave 62 (2026-06-11):
  the DoD verification-ladder spec deferred its mechanics; a consumer
  initiative built them, ran them at scale, and promoted the proven half
  upstream (template/docs/methodology/dod-verification-ladder-pattern.md).
  HONESTY GUARD: that initiative is author-operated — say "a consumer
  initiative promoted its workaround upstream," never "an external
  contributor." External amendments are still zero (validation-script A5).

**Fallback (separate, later attempt):** the original Show HN — site URL
`https://blueprint.ninochavez.co` plus the self-application/receipts author
comment — remains viable weeks after this submission as its own attempt; the
prior draft is preserved in this file's git history. Re-attempts are normal
and cheap: Spec Kit's one 84-point hit was roughly attempt 15 of 20.

---

## 2. r/ClaudeAI — and r/ClaudeCode

**Venue note:** the research found r/ClaudeCode is the denser scene for this
genre (the framework threads, the fatigue threads, and the incumbent
comparisons live there). Post to r/ClaudeAI per the original plan, and treat
r/ClaudeCode as the second submission a few days later — not the same day.

**Format:** text post, comparison-post format. The launch-announcement genre
is capped (~50–250 points ceiling) and draws reflexive sarcasm; honest
comparisons that name incumbents are what the community itself asked for
("every week theres a new best claude code workflow post and nobody compares
them side by side").

**Title** (names the incumbents — the credible posts all do):

> Spec Kit vs BMAD vs GSD vs OpenSpec: I read what each one's gates actually
> execute — mostly human prompts and LLM-graded checklists

**Body:**

> Disclosure first: I built one of the tools in this comparison (Blueprint),
> so discount that row accordingly. Every competitor claim below cites the
> file it came from; full table with sources:
> https://blueprint.ninochavez.co/compare (snapshot dated 2026-06-11).
>
> Token cost, since it's the first question on every one of these threads:
> Blueprint's gates are Node scripts — they cost zero tokens to run. The
> agent stages cost what your normal sessions cost; effort is a per-stage
> dial, not a fixed ceremony tax.
>
> By "gates" I mean the verification steps between stages — the thing that's
> supposed to stop the pipeline advancing on unverified work. I read the gate
> implementations (scripts, workflow-step source, verifier prompts) of 14
> spec-driven tools. The short version: most gates are prompts an LLM runs
> against itself, or a human approve/reject. The compressed table:
>
> | Tool | Stars (~, 2026-06-11) | The "gate" is | It checks |
> |---|---|---|---|
> | Spec Kit | ~111k | exit-code script + human approve/reject + LLM checklists | file existence (script); content only via LLM/human |
> | BMAD | ~49k | agent-run checklists and handoffs | nothing executable |
> | GSD | ~64k | 4-type gate taxonomy, mostly prompt-enforced; a few real exit-code scripts | adversarial verifier distrusts the agent's own claims |
> | OpenSpec | ~54k | `validate --strict` (real CLI); rejects phase gates by philosophy | spec structure/schema |
> | Kiro | commercial | property tests generated from EARS requirements | code vs requirements |
> | spec-workflow-mcp | ~4.2k | dashboard approval that genuinely blocks | a human decides |
> | PRP | ~2.2k | validation loops until green | type-check/lint/tests/build |
> | Blueprint (mine) | — | 15 of 18 reviewers are Node exit-code scripts | artifact content + evidence paths + site copy |
>
> Credit where it's due, because each of these does something best: GSD's
> verifier literally says "Do NOT trust SUMMARY.md claims" — the right
> instinct, and nobody else states it that plainly. Kiro's property-based
> testing is the most credible executable verification anywhere in the field.
> OpenSpec is the only tool that visibly dogfoods itself (its repo carries
> its own dated change archive), and its anti-gate argument is worth reading.
> BMAD is the only one with real product-scope breadth — research through
> implementation. Spec Kit has the reach: ~111k stars, 30+ agent
> integrations.
>
> Blueprint's caveats, stated plainly: the stage skills are Claude Code only
> (the gates and CLI run anywhere). Adoption is one external team engagement
> in flight plus one independent adopter. And the gates verify that artifacts
> exist, claims trace to evidence, and the site copy doesn't contradict the
> CLI — they don't make the work good.
>
> When NOT to use this: solo with a working loop — keep your kitchen. That's
> what Blueprint's own FAQ says, and it matches the strongest objection I've
> heard so far.
>
> If I got your tool wrong: https://github.com/nino-chavez/blueprint/issues
> and I'll fix the page.
>
> Actual question for the sub: what does your verification step execute
> today? A script with an exit code, a verifier prompt, a human look, or
> nothing? Especially interested in what survives multi-session work.

---

## 3. lobste.rs

**Mechanics:** invited accounts only. Check the "I am the author" box.
Tags: `ai`, `practices`. Submit the comparison page — lobsters rewards
analysis over launches, and this is the analysis.

**URL:** `https://blueprint.ninochavez.co/compare`

**Title** (plain; matches the page):

> I read how 14 spec-driven dev tools' gates actually work

**First comment (author):**

> Author, disclosure first: I built a 15th tool in this category —
> Blueprint, the last row — so discount that row; every competitor cell
> cites the file it came from so you can check me.
>
> Method: I read the README and, where public, the actual gate source —
> shell scripts, workflow-step code, verifier prompts — of 14 spec-driven
> dev tools; vendor docs for the closed ones; one row (Superpowers) is
> tabled from community data only and flagged as such. Snapshot dated
> 2026-06-11.
>
> Finding: almost every "gate" in the field is a human approve/reject prompt
> or a checklist an LLM runs against itself. The exceptions execute real
> checks at other layers — file existence (Spec Kit's
> `check-prerequisites.sh`), spec schema (OpenSpec's `validate --strict`),
> code-quality loops (PRP), property tests from requirements (Kiro). What I
> couldn't find elsewhere is executable gating on artifact content and
> evidence — claims traced to sources, decisions citing their research.
> That's Blueprint's row. Its caveats, stated rather than deferred: the
> orchestration skills are Claude Code only, adoption is one external team
> engagement in flight plus one independent adopter, and the gates verify
> that artifacts exist and claims trace — they don't make the work good.
> Corrections via GitHub issues welcome.

---

## After posting

- Add each thread URL to `feedback/` as a capture file; comments are
  stakeholder feedback and triage through `/blueprint-triage` like any other
  (objections are A3/A6/A7 evidence either way; the Reddit closing question
  is the A6 instrument — their verification approaches are evidence whether
  or not they like Blueprint).
- Watch the analytics funnel: compare views → demo views → quickstart clicks
  → npm downloads. That's the A2 instrument this launch exists to read.
- Expectation, set honestly: the modal HN outcome for this space is single
  digits (median 2 points across 892 comparables). The comparison format
  moves the odds — analysis outperforms launches in the data — it does not
  guarantee them. A low-point result is the base rate, not a verdict on the
  page.
- One later re-attempt with the original Show HN angle (site URL +
  self-application receipts comment, preserved in git history) is tolerated
  weeks after this; Spec Kit's single hit was attempt ~15. More than one
  re-post of the same artifact is not.
