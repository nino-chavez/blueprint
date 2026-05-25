# Case Study: How an Agent Built a Product Initiative from Scratch

## The Setup

On March 13, 2026, a product strategist at BigCommerce opened a terminal and pasted a plan. The plan described two parallel workstreams for a Pricing & Packaging initiative: strategic documents for leadership alignment, and an agentic billing support prototype. The instruction was: "Implement the following plan."

What happened over the next 48 hours produced: 11 interactive prototype pages deployed to Vercel, an AI billing support agent with 8 tools and 6 mock merchant personas, 4 strategic documents validated against the production codebase, cross-industry research covering 14 platforms with 30+ cited sources, a design system extracted from screenshots of the existing product, and a reusable methodology (Blueprint) that was A/B tested against its own origin project.

The human didn't write a single line of code, a single word of document copy, or a single design spec. Every artifact was produced by Claude, directed through prompts.

This is the retrospective.

## What Actually Happened

### Hour 1-2: The Wrong Voice

The plan called for signal-forge to generate strategic documents. Signal-forge is a content generation system with a ghost writer → copywriter → editor pipeline. It produced documents that read like blog posts.

"Here's where I've landed — for now." "I used to think X, now I think Y." Narrative arcs, provisional hedging, rhetorical questions.

The human's feedback: "why do we have references for Accenture? I work for BigCommerce."

Signal-forge's prompts were hardcoded for external consultant voice. The ghost writer and copywriter both assumed they were writing *to* a client, not *as* a team member. Three changes fixed this:
1. Default company changed from "Accenture Song" to configurable via environment variable
2. Ghost writer perspective changed from "external consultant" to "internal team member"
3. Copywriter perspective check changed from "reads as consultant" to "reads as internal"

But the deeper problem wasn't Accenture. It was the voice itself. Signal-forge's pipeline applies thought-leadership voice by default — narrative structure, personal reflection, "showing the work." Internal strategy documents need the opposite: conclusions first, evidence second, tables for data, bullets for facts.

This led to creating the Internal Strategy voice mode — the fourth mode in signal-forge's taxonomy, alongside Thought Leadership, Executive Advisory, and Solution Architecture.

### Hour 3-5: The Wrong Components

The prototype looked good. Blue alert banners, colored type tags, progress bars, inline explainer boxes with monospace calculation blocks.

None of these existed in the actual product.

The human's feedback: "are these callout boxes and colors used aligned with existing design from the screenshots we reviewed of the current portal, or did we invent these?"

Honest answer: we invented most of them. The existing C.UI uses white cards, simple tables, green badges, blue links, and label-value pairs. No colored alerts, no type tags, no progress bars, no explainer boxes.

This led to the first design principle: **match the existing product.** If a component doesn't exist today, mark it as PROPOSED. Don't present aspirational UI as buildable reality.

Stripping the prototype to C.UI reality meant: replacing colored alerts with BUI message components (which actually exist in the codebase), replacing colored type pills with muted lozenges, replacing blue explainer boxes with simple gray detail sections, and removing all emoji icons.

### Hour 5-8: The Wrong Words

"Surcharge." "Non-preferred gateway." "Downgrade." "BLOCKED." "You exceeded your GMV cap."

Every one of these words creates merchant anxiety. "Surcharge" sounds like a penalty. "Non-preferred" implies the merchant made a bad choice. "Downgrade" frames a cost-saving action as a demotion. "BLOCKED" implies fault.

The human asked: "should all buttons just say 'select' if not 'current plan' and allow gestalt principle provide cognition?"

This reframing — that the price and position convey direction, so the button doesn't need to — changed every plan comparison page. But it also triggered a broader audit: what other words are we using that create friction?

The answer: 120+ replacements across 16 files. "Surcharge" → "processing fee." "Non-preferred" → "third-party." "GMV cap" → "sales limit." "TTM" → "12-month." "10% haircut" → "10% adjustment." "Auto-upgraded" → "plan will be updated."

And the framing flip: every cost-related message now leads with savings, not charges. "Save $38/mo by switching to BigCommerce Payments" — not "You're being charged $38 because you don't use BigCommerce Payments."

### Hour 8-12: The Research Spikes

The human said: "would it help to look at utility billing and invoice portals?"

This wasn't in the original plan. But it produced some of the strongest evidence in the entire project:
- Utility portals achieve 25-65% call center reduction with self-service billing (E Source)
- Only 17% of customers report "very good" bill understanding (EY)
- Comcast moved to all-in pricing in December 2025 after $9.1M AG judgment
- AT&T's AI deployment cut call center costs by 90% with fine-tuned small models

Then: "what about Comcast and AT&T?"

This produced the mid-contract surcharge legal precedent that became the strongest argument in the strategy doc: Cox ($70M+ exposure), RCN ($11.5M settlement), AT&T ($14M settlement) for adding fees during fixed-rate contracts.

Then: "I just put a bunch of screenshots from my own SaaS services."

42 screenshots from Vercel, Resend, Supabase, and Cloudflare. This produced the specific UI patterns adopted in the prototype: Vercel's grouped invoice line items, Cloudflare's billing tab navigation, Supabase's upcoming invoice preview, Resend's plan selection cards.

None of these research spikes were in the original plan. They came from the human seeing the output and thinking "what else should we look at?" This is the 25-30% of content quality that the agent can't produce on its own.

### Hour 12-18: The Credibility Check

The human asked the agent to validate its own claims against screenshots and source code. The agent found:

- "Self-service plan changes: No" was wrong — self-service *upgrades* exist with a detailed feature comparison flow. Only downgrades are missing.
- "Click-to-cancel" was framed as Phase 3 future work — but a cancel flow already exists (Standard/Plus plans with direct billing only).
- "Usage/GMV dashboard: No" was misleading — the Store Details page already shows trailing 12-month sales volume and plan limits.
- Invoice PDFs contain line item detail — the docs implied they didn't.

If a VP had checked any of these claims against the actual product, they'd have lost trust in the entire document package.

Then Gemini reviewed the output and found: the EY "88%" figure was actually 92%. The Comcast "all-in pricing" claim was more nuanced — legacy subscribers still see itemized fees. The billing case baseline table had a logic gap: if 84.7% of cases are uncategorized, how do you know 59% are invoice inquiries?

The methodology answer (Jayna classified email subjects using Claude, not from SFDC reason codes) resolved the logic gap — but only because the human forwarded Jayna's original email with the methodology description.

### Hour 18-24: The Extraction

Everything above happened once. The question became: can it happen again for a different initiative?

Blueprint extracted the methodology into a reusable jig:
- Template with configurable CSS, JS components, and CLAUDE.md
- 5 skills (slash commands for each pipeline stage)
- 4 agent definitions (researcher, prototype-builder, doc-writer, validator)
- Configuration file (blueprint.yml) with execution depth, voice modes, and research scope
- Composable integration with Signal Forge and Specchain

### Hour 24-30: The A/B Test

The test: start a new project from the Blueprint template, point it at the same inputs, and see if it produces comparable output without human feedback loops.

**Result: 70-80% quality in 10-15x less time.**

The first test failed on terminology (used "deflectable" instead of "resolvable without support"), didn't flag the methodology gap, and had no source URLs. Six template fixes were applied:
1. docs/package.json (blocked the doc pipeline)
2. Populated terminology table (placeholder terms → actual product terms)
3. Citation URL requirement
4. Methodology questioning in the quality audit
5. Skeleton index.html
6. .gitkeep files for empty directories

The re-test passed all six checks. The agent used correct terminology on the first draft, flagged the 84.7% methodology contradiction, cited 19 URLs, and spontaneously self-reviewed its output against the banned words list.

Two more fixes were found in the prototype and doc stages:
7. Doc-writer still generated metadata headers despite being told not to (needed explicit ban in agent definition)
8. Strategy doc buried the lede (needed "first sentence of the DOCUMENT" rule, not just "first sentence of each section")

## What We Learned

### About agent-assisted work

1. **Structure is free, depth costs.** The agent produces well-organized first drafts consistently. But the research spikes that produced the strongest evidence (utility billing, Comcast litigation, SaaS screenshots) all came from the human saying "what about X?"

2. **Rules must be explicit and repeated.** "No metadata fluff" in CLAUDE.md wasn't enough — the agent still generated Date/Audience/Status headers. The rule had to be in BOTH the project instructions AND the agent definition with specific banned patterns.

3. **Self-review emerges from explicit rules.** When the DESIGN.md had a populated terminology table with specific banned words, the agent spontaneously searched its own output and fixed violations. Vague rules like "use appropriate terminology" don't trigger this.

4. **The agent doesn't question its own data.** "84.7% uncategorized" and "59% are invoice inquiries" coexisted in the same table without the agent flagging the contradiction — until the quality audit explicitly said to check for this pattern.

5. **Visual design requires human eyes.** The agent matched C.UI from screenshots and CSS, but every visual design issue (invented components, competing alerts, wrong button colors) was caught by the human looking at the prototype in a browser.

### About the methodology

6. **Prototype and docs must be simultaneous.** The prototype tests design decisions. The documents capture rationale. Building one after the other means the second is always out of date.

7. **The strategy panel is the best feature.** Embedding "why we made this decision" directly on each prototype page means any stakeholder can understand the rationale without reading a separate document.

8. **Current-state comparison prevents "what's different?" questions.** The left drawer with screenshots of the existing product eliminates the most common stakeholder question.

9. **The four-check audit catches real issues.** "So what?" placement, mental math, logic gaps, and scannable format — these four checks found the same problems that iterative human review found, but in one pass instead of three.

10. **Composable tools beat monolithic platforms.** Blueprint works standalone. Signal Forge adds content generation. Specchain adds implementation specs. Each can be added or removed without breaking the others.

---

## Epilogue: The Trust Problem

I didn't write a word of this.

Not the 11 prototype pages. Not the 4 strategic documents. Not the cross-industry research with 30+ citations. Not the codebase validation against fat-controller. Not the design system documentation. Not the terminology rules. Not the Blueprint methodology. Not the A/B test. Not this retrospective.

I also didn't write a line of code. Not the AI billing agent with 8 tools. Not the strategy panel JavaScript. Not the current-state comparison drawer. Not the footer navigation. Not the Vercel serverless function. Not the md-to-docs converter. Not the chat widget. Not the CSS design system.

I wrote prompts. Hundreds of them, over two days. "Implement this plan." "Why does the deck reference Accenture?" "That reads like a blog." "Should buttons say select instead of upgrade?" "Look at utility billing portals." "Is this actually true?" "That agent response is too long." "What would it take to build this into fat-controller?"

Everything else — every line of code, every word of copy, every design decision, every research finding, every fact-check, every iteration — was produced by Claude.

So how do we trust any of it?

### The provenance problem

The work product exists. The prototype is deployed. The documents are written. The research cites sources. The claims are validated against source code. But the *thinking* — the reasoning that connected research to design decisions to copy choices to architectural recommendations — is buried in a prompt session in a terminal.

There is no design file a designer made. There is no code a developer committed with their reasoning in the PR description. There is no document a strategist drafted with tracked changes showing their thought process. There is no research report an analyst compiled with their methodology section.

There is a conversation. Thousands of messages between a human and an AI, where the human provided direction and judgment, and the AI provided labor and synthesis. The final artifacts look like they were produced by a team of specialists over weeks. They were produced by one person and one model over two days.

### Where do we show our work?

The strategy panel on each prototype page is one answer. It explains why each design decision was made, with citations. But it doesn't show the five wrong versions that came before the right one.

The TEST-LOG.md from the A/B test is another answer. It shows exactly what the agent got right and wrong, what the human corrected, and what template fixes were needed. But it only exists because we decided to test the methodology.

The git history of this project is a third answer. Every commit is a checkpoint. But the commits don't capture the prompt that triggered the change.

The honest answer is: we don't have a good system for this yet.

### What this means

The work product can be validated. Every claim cites a source. Every codebase reference can be checked against fat-controller. Every competitive assertion can be verified. Every prototype page can be compared against the actual product.

What can't be validated is the *reasoning path* — why this framing instead of that one, why this research direction instead of another, why this terminology instead of the alternative. That reasoning lives in the prompt session, which is ephemeral by default.

This is the trust challenge for agent-assisted product work. The outputs are verifiable. The inputs (prompts) are documented. But the connection between them — the chain of reasoning that turned "implement this plan" into a deployed prototype with validated strategic documents — is a black box to anyone who wasn't in the session.

Blueprint's strategy panels, current-state drawers, and design principles documentation are an attempt to make the reasoning visible after the fact. The A/B test is an attempt to make the methodology reproducible. The document quality audit is an attempt to make the outputs trustworthy regardless of how they were produced.

But the fundamental question remains: when the work and the thinking are buried in prompt sessions in a terminal, what does "showing your work" mean?

We don't have a complete answer. But we have a starting point: make the methodology explicit (Blueprint), make the design decisions visible (strategy panels), make the claims verifiable (citations + codebase validation), and make the process reproducible (A/B tested template).

Trust the outputs by validating them. Trust the process by testing it. And trust the human by recognizing that their contribution — the prompts, the judgment, the "what about X?" moments — is what separates a useful product initiative from a well-structured pile of generated text.
