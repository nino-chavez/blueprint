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
- Stage 0 recipe: `docs/context/browser-legibility.md`
- First principle (why this case study exists): `METHODOLOGY.md` §"First Principle: Agent Struggle Is a Missing Capability"
- Sibling case studies: `docs/case-studies/case-study-subs-initiative-skipped-stages-2-4.md`, `docs/case-studies/case-study-pp-cx.md`

---

## Follow-up — 2026-05-25 evening: chrome canonical drift

A second incident on the same `shared.css` surface, hours after the morning's I-5 / smoke-runner encoding.

### What broke (second time)

The v3 session was iterating on its portal `shared.css`. To remove an old v0.1 v3 token block, it truncated 268 lines from `shared.css`. The truncation cut into the chrome CSS (not just the token block).

Symptom: prototype pages rendered with no chrome. `body.children[0]` was `HEADER.proto-top-bar` — the class that `proto-nav.js` emits but the now-truncated `shared.css` had no rule for.

Recovery move: the session diffed its `shared.css` against `https://blueprint.rallyhq.app/shared.css`, found the 268 missing lines, and restored them from rally-hq.

### Why this was bad even though it "worked"

The recovery promoted rally-hq's deployed `shared.css` (1939 lines) to the "canonical" position. The template's `shared.css` is 1107 lines — the extra 832 lines in rally-hq are Rally HQ project-specific drift (hero variants, scoreboard chrome, monetization-page styles).

Two failure modes, both serious:

1. **Drift propagates without going through the methodology.** Every subsequent consumer reaching for "the canonical" would now find rally-hq's project drift baked in, and would adopt it. The methodology repo has no idea this happened. The next methodology bump can't propagate because consumers don't see the methodology as the canonical anymore.

2. **The deployed sibling is the de facto canonical now.** No doc declares this. The first consumer (v3) made an implicit choice; the next consumer would have no reason not to repeat it.

This is the same root failure as the 2026-05-25 morning four-way root-doc drift the reconciliation diagnosed — "no single source of truth, so each session picks the freshest sibling." Encoded for docs that morning; not yet encoded for chrome CSS.

### What got encoded (second wave)

Per the same first principle, three repo-level changes:

1. **`shared.css` split into canonical chrome + project-tokens overlay.** `template/portal/shared.css` is now canonical chrome with a do-not-edit-in-consumer banner. New `template/portal/project-tokens.css` is the consumer-editable seam — token overrides land there. Cascade picks the override because the overlay loads second.

2. **`stamp.mjs --mode=restamp-chrome --pattern=B` mode.** Refreshes the canonical chrome manifest (`PATTERN_B_CHROME_FILES`) in a consumer's portal from `template/portal/` without touching the overlay or any project-owned file. Replaces the "curl a peer consumer's deploy" recovery move with a methodology-canonical recovery move.

3. **`portal-chrome-canonical-reviewer` gate.** Stage 3 + portal-touching-commit. Byte-identical diff of each consumer chrome file against template canonical. Failure mode: drift caught at commit time, fix command emitted in the report.

The first wave (morning) made the symptom legible — invariant I-5 + smoke-runner screenshots prevent the silent-rendering failure. The second wave (evening) makes the chrome itself diffable and re-stampable — preventing the silent-drift failure that the morning's first incident also exhibited but wasn't yet diagnosed.

### Why the morning encoding wasn't enough

I-5 (CSS coverage check) catches *missing* CSS rules — JS emits a class, no rule exists, lint fails. It doesn't catch *drifted* CSS rules — JS emits a class, a rule exists, the rule is the wrong rule because the consumer copied it from a non-canonical source. Morning encoding: did the CSS exist? Evening encoding: is the CSS the canonical CSS? Both are required because they fail differently.

### What this means for the subs-initiative / rally-hq / v3 consumers

Each consumer now needs to migrate (per the methodology freeze rule: sequenced, one at a time):

- **rally-hq**: split its 1939-line `shared.css` into canonical chrome (1107 lines, byte-identical to template) + project-tokens.css (the 832 lines of rally-specific tokens, hero variants, scoreboard chrome). Run `stamp.mjs --mode=restamp-chrome --pattern=B` to verify byte-identical.
- **website-nc-v3**: re-run `stamp.mjs --mode=restamp-chrome --pattern=B` to drop the rally-hq-derived drift; lift any v3-specific overrides into `project-tokens.css`.
- **subs-initiative** (Pattern A): no migration yet. Pattern A canonical chrome surface needs an audit before the manifest can be declared. Tracked.

Migration order: rally-hq first (it's the "freshest source" that v3 was reaching for; canonicalizing rally-hq de-canonicalizes the bad pattern). Then v3 (one-command restamp). Bc-subs separately when Pattern A surface is audited.

---

## Follow-up — 2026-05-25 evening: docs viewer Rally HQ leak

A third incident on the same Pattern B portal surface, same evening. Different file (`docs/index.html`), same root failure shape.

### What broke (third time)

The v3 session opened `https://blueprint.ninochavez.co/docs/` and found the sidebar listing 13 Rally HQ doc slugs (CX Strategy, Research synthesis, Monetization narrative, etc.) instead of the 11 brownfield Pattern B docs v3 had authored. The `productName` in the brand bar said "Rally HQ." Default doc was `cx-strategy`, which 404'd.

Direct cause: `template/portal/docs/index.html` shipped with:

- 13 hardcoded `<a data-doc>` sidebar entries (Rally HQ doc slugs)
- `TITLES` map with 13 Rally HQ slug → label mappings
- `STRATEGIC_DOCS` Set with 6 Rally HQ slugs
- `window.PORTAL_SHELL_CONFIG = { productName: 'Rally HQ' }` (the other two HTML files use `'PROJECT_NAME'` placeholder; docs/ leaked the actual Rally HQ string)
- Default doc fallback: `'cx-strategy'`

The template README's setup checklist mentioned `index.html` and `pages/example.html` for placeholder substitution but omitted `docs/index.html` — so a consumer following the README inherits a Rally HQ docs viewer by default and only notices when a stakeholder opens `/docs/`.

### Why the morning + first-evening encodings didn't catch this

- I-5 (CSS coverage check, morning): catches missing CSS, not stale content
- Chrome canonical drift reviewer (first evening): only ran against `shared.css`, `_portal-shell.js`, `proto-nav.js`, `proto-annotate.js`, `_headers`, `_redirects`. `docs/index.html` wasn't in the manifest because at the time it was considered project-substitutable (PROJECT_NAME placeholder pattern) rather than canonical chrome.

The realization: the docs viewer had Rally HQ project content baked in at the source. Substituting "PROJECT_NAME" wouldn't have helped because the sidebar slugs were Rally HQ slugs, not placeholders. The viewer was *partially canonical* (JS, CSS, layout) and *partially project data* (sidebar, TITLES, STRATEGIC_DOCS, default) — but ALL of it shipped as a single file. Consumers got the canonical parts AND the project parts in one copy.

### What got encoded (third wave)

Same first principle, three more repo-level changes:

1. **Refactored `template/portal/docs/index.html` to be data-driven.** The sidebar is rendered from `_meta/index.json` `docs.tiers[].docs[]`. The TITLES map and STRATEGIC_DOCS Set are built from the same manifest. Default doc falls back to first doc in first non-empty tier. The HTML / JS / CSS of the viewer is now true canonical chrome with zero project-specific defaults.

2. **Refactored `_portal-shell.js` to be manifest-aware.** The brand bar's productName reads from `_meta/index.json` `name` (strips " Blueprint" suffix). Pages no longer need `window.PORTAL_SHELL_CONFIG = { productName: 'PROJECT_NAME' }` — that placeholder pattern was the root cause shape for *all* three Pattern B leak incidents. Removed the `docsLandingHref: '/docs/?doc=cx-strategy'` default (another Rally HQ leak) → now `/docs/`, with the docs viewer resolving its own default internally.

3. **Added `docs/index.html` to `PATTERN_B_CHROME_FILES` manifest in `stamp.mjs`.** With the refactor, the file is truly canonical chrome — every consumer should run byte-identical against template. The `portal-chrome-canonical-reviewer` now diffs it.

Also: README updated to call out the manifest-driven branding + docs setup explicitly, and added a "Stay current with methodology updates" section with the restamp command.

### What this means for consumers

After this wave lands, a new consumer:

- Edits ONE field (`_meta/index.json` `name`) to set their brand. Brand bar updates everywhere automatically.
- Edits ONE field (`_meta/index.json` `docs.tiers`) to declare their docs. Sidebar populates automatically.
- Does NOT edit `docs/index.html`, `_portal-shell.js`, `proto-nav.js`, `shared.css`, or any chrome file. The reviewer enforces this.

Existing consumers (rally-hq, v3) migrate by:

1. Run `stamp.mjs --mode=restamp-chrome --pattern=B --target=<root>` to pull canonical chrome (incl. the new docs viewer)
2. Move their project-specific doc list from inline HTML into `_meta/index.json` `docs.tiers`
3. Remove `window.PORTAL_SHELL_CONFIG` from their portal HTML files (let the manifest-aware shell read it)

### The pattern, now named

Three consecutive incidents on the same Pattern B surface in one evening, all caused by **Rally HQ's working version being more complete than the canonical template, with the divergences propagating to every new consumer**:

| Incident | Surface | Leak type |
|---|---|---|
| Morning | proto-nav.js class hierarchy vs shared.css | Missing CSS coverage (template's shell emits classes the template's CSS doesn't style) |
| Evening 1 | shared.css | Truncation → restored from peer consumer's deploy → peer's drift becomes "canonical" |
| Evening 2 | docs/index.html + _portal-shell.js | Rally HQ project content baked into shell file; no manifest path for consumer's data |

The generalization: **any time the template ships a file that mixes canonical chrome with project data, consumers either edit the file (which de-canonicalizes the chrome part) or copy it verbatim (which inherits the project part)**. The fix is the same in all three cases: split chrome from project data, make the chrome canonical and re-stampable, surface the project data through a manifest.

Future audit candidate: walk every file in `template/portal/` and ask "does this mix chrome with project data?" Files that pass: `_portal-shell.js`, `proto-nav.js`, `proto-annotate.js`, `chat-widget.js` (almost — has a Rally HQ string in its header comment), `_headers`, `_redirects`, `shared.css` (post split), `docs/index.html` (post refactor), `project-tokens.css` (intentionally empty overlay). Files that need attention: `index.html` and `prototype/index.html` `<title>` tags still use `PROJECT_NAME` placeholder (server-rendered, no manifest path because the JS upgrade flickers); `chat-widget.js` header comment leak; `wrangler.toml` requires project name substitution.
