# Case Study — ninochavez.co v3 Portal CSS Gap

**Date:** 2026-05-25
**Project:** ninochavez.co v3 (brownfield blueprint, paired blueprint subdomain)
**Failure class:** Template stamp incomplete for non-Rally-HQ consumers
**Cost to detect manually:** A separate session, after the prototype was declared "live"
**Cost to detect via the encoded capability:** ~30s extra at Stage 6 ship gate
**Methodology change:** Invariant I-5 (DESIGN.md) + strengthened `prototype-smoke-runner` (screenshot + CSS-coverage check)

## What broke

The v3 blueprint deployed its `portal/` shell and reported success. A separate session opened the portal in a browser and found three concrete failures:

1. **Global `h1 { text-transform: uppercase }` leaking** — the template carried Rally HQ's tournament-hero aesthetic into every `h1` on every page. Sentence-case headings rendered as ALL CAPS.

2. **`.proto-top-bar` chrome had zero CSS.** `proto-nav.js` generates the class hierarchy (`.proto-top-bar`, `.top-bar-inner`, `.top-bar-lead`, `.top-bar-crumb`, `.top-bar-actions`, `.top-bar-nav`, `.brand-mark`, `.brand-mark-tag`) for prototype pages, but the template stylesheet had no rules for any of them. Front door + docs viewer worked because they use `.portal-shell` (which IS styled) via `<header data-portal-shell>`; prototype pages bypass that path and got unstyled chrome.

3. **Citation chip dumping raw findings strings.** `proto-nav.js`'s `renderCitationChip` reads `r.short` from a `MANIFEST.citations` lookup table. The template's `_meta/index.json` has no citations table, so `r.short` falls back to the full slice-JSON blob string. Chip rendered raw JSON instead of a short citation label.

The fix in the v3 session: ~200 lines of `.proto-top-bar` CSS authored locally; `h1 text-transform` removed; citation chip hidden via CSS until a proper citations table can be authored from `research/synthesis.md` + design-principles mappings.

## Underlying pattern

The template ships with **mismatched JS-output class names vs CSS selectors**. The v2 patch acknowledged that Increments 2 + 3 weren't fully shipped; the CSS-completeness gap is the same class of bug — the template's *stamp* is incomplete for any consumer that isn't Rally HQ.

Rally HQ doesn't hit the bug because Rally HQ ships its own additional CSS that fills the gaps. Every other consumer inherits the JS shell without inheriting Rally HQ's compensating styles.

## How this slipped through the methodology

The agent took curl-200 smoke tests as sufficient validation. They are not. A 200 response says nothing about whether the CSS class hierarchies line up. The Stage 0 reference recipe specifies browse-tool + viewport screenshot per page exactly because curl + Playwright `@smoke` are blind to unstyled chrome — but the recipe is guidance, not a gate. Without a gate, the discipline degrades to "the agent uses it when it remembers."

## What got encoded

Per the "agent struggle is a missing capability" first principle, the response is not "remember to screenshot next time." The response is repo-level capability:

1. **Invariant I-5 in `template/prototype/DESIGN.md`** — "JS class output ↔ CSS coverage." Every class name emitted by JS shells must have a corresponding CSS rule in the shipping stylesheet. Enforced mechanically: lint walks JS files, extracts class-name string literals, diffs against CSS selectors. Pass criterion: zero JS-emitted classes without CSS coverage.

2. **`prototype-smoke-runner` reviewer agent strengthened** — adds two new pass criteria on top of `@smoke` Playwright:
   - **Viewport screenshot per page.** browse-tool captures every modified page. Screenshots land in `.smoke-screenshots/` (gitignored). Their existence is the artifact.
   - **CSS coverage check.** Runs the I-5 lint as part of the gate.

3. **This case study** — written so future sessions reading the docs understand the *why* behind both the invariant and the screenshot discipline. The pattern (template incomplete for non-flagship consumers) generalizes; the cost compounds across N future consumers.

## Generalization

This isn't just a CSS-gap bug. It's a category: **the template ships shell modules that assume per-consumer compensating work that consumers don't know to do.** Examples beyond CSS:

- Citation chip behavior assumes a citations table that the template doesn't scaffold
- Strategy panel rendering assumes `_meta/<page-id>.json` shape that the template's example may not match
- Annotation overlay (`proto-annotate.js`) assumes opt-in localStorage flag the template doesn't document at the right level

Every shell module is a candidate for an "I-5-style" coverage check: what does this JS emit that the consumer must provide CSS / data / config for, and how does the template surface that requirement?

The methodology change here is one invariant + one stronger gate. The systemic fix is a `template-completeness-reviewer` agent that audits the full shell-vs-consumer contract — deferred until a second case of the same pattern surfaces.

## Validation discipline going forward

Per the strengthened `prototype-smoke-runner`: **no portal change is "complete" without a viewport screenshot of every affected page.** This is now non-negotiable at the Stage 6 ship gate, not aspirational guidance in Stage 0.

## Cross-references

- Invariant: `template/prototype/DESIGN.md` §"I-5. JS Class Output ↔ CSS Coverage"
- Strengthened gate: `template/.claude/agents/blueprint/reviewers/prototype-smoke-runner.md`
- Stage 0 recipe: `docs/browser-legibility.md`
- First principle (why this case study exists): `METHODOLOGY.md` §"First Principle: Agent Struggle Is a Missing Capability"
- Sibling case studies: `docs/case-study-subs-initiative-skipped-stages-2-4.md`, `docs/case-study-pp-cx.md`
