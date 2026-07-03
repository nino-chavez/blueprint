# Methodology amendments — Blueprint self-application

Append-only, reverse-chronological. Methodology learnings from applying Blueprint to itself (the in-repo self-application, folded from `blueprint-platform` in wave 45): gaps worked around, candidates for promotion into the methodology (`template/`). Convention: `template/docs/methodology/methodology-amendments-convention.md`.

---

## 2026-07-02 — Stateful-claim lint scans docs, not the portal source; a hand-typed stat rotted on the public compare page while the derivation lib sat unused

**Trigger**: Applying `docs/patterns/stakeholder-surface-packaging-pattern.md` (merged this day from the bc-subscriptions export) to the self-application's product site. The pattern's truth-axis DoD — "no hand-typed number that isn't computed at build time" — was checked against `apps/portal/` and failed on first contact: `apps/portal/src/pages/compare.astro` shipped "the executable set is 15 of 18 reviewers" on the live public site (truth: 17 of 22 since the wave-74 reviewer additions), inside a hand-authored narrative string, while `apps/portal/src/lib/derived.ts` exported `loadReviewerCount()` / `loadReviewerSpecCount()` in the same codebase. The same stale pair was caught in CLAUDE.md the same day by `stateful-claim-lint-reviewer` — which proves the lint works, and proves its scan surface stops short: it walks root docs + `docs/**` + `template/CLAUDE.md` (`.md` only), so portal page source is invisible to it. The drift class the wave-59 reviewer was built for reproduced one directory over, ungated.

**Observed**: The mechanical gate exists (reviewer, wave 59), the derivation layer exists (`lib/derived.ts`, thorough — wave/consumer/reviewer/ADR counts all read live sources), and the failure still shipped, because prose in `.astro` page source is in neither's jurisdiction. Instance fix applied in place: `compare.astro` now interpolates both counts at build time.

**Candidate fix** (mechanical realization second-instance-gated per convention): extend `stateful-claim-lint-reviewer`'s walk to the initiative's resolved portal source (`prototype.portal_dir`, else `apps/portal/src`), scanning `.astro`/`.html`/`.ts` prose strings with the same claim regexes and the same fenced-code stripping. Second-instance candidates: any consumer whose portal narrates fleet/count claims in page source — rally-hq's front door shows stats; bc-subscriptions' portal narrates coverage counts.

**Bucket**: reviewer (scan-surface extension)

**Status**: Active (instance 1; in-place fix shipped, lint extension awaits second instance)

---

## 2026-06-29 — The UI-rendering-contract gap is app-wide, not portal-local; enforcement is a lint EXTENSION, not a new reviewer; and a single-slice amendment shipped two blind spots a breadth pass corrected

**Trigger**: The same subscriber-portal audit that produced the entry below (the narrow, single-slice version) was re-grounded by a 7-agent recon+critique workflow that swept all three of the initiative's design languages (React/BigDesign admin, Svelte storefront, React/Next catalyst) plus the BRD spec structure and the existing enforcement substrate. The breadth pass changed three material conclusions of the entry below and added the hardest finding it missed. An adversarial completeness critic then caught that the draft plan's "smallest proof" was sequenced against an already-fixed component, not the still-broken keystone — verified true in the working tree.

**Scope**: Candidate for methodology promotion (instance 1, **generalized** + enforcement mechanism designed). Pattern doc shipped to `template/` below; the portable lint extension promotes once the consumer ratifies and builds it (it extends the already-shipped [[proof-obligation-registry-pattern]] lineage — the ui-state is one obligation class).

**Bucket**: methodology (spec tier + enforcement mechanism) + meta (amendment-promotion discipline)

**Status**: Active. Promotes and partly supersedes the 2026-06-29 entry below (the diagnosis holds; the candidate fixes are replaced).

---

### Finding 1 — The gap generalizes across every design language; the entry below under-scoped it to the subscriber portal

The breadth pass sampled 28 surfaces across ~90 app-functional interactive surfaces and found the missing-non-happy-path-rendering-contract gap in all three, with an **inverse profile** that proves it is a spec-tier cause, not a framework one:

- **Svelte storefront** (39 surfaces): 9/10 sampled miss ≥1 state; the most-missing are error and edge-status. `GiftClaimView` is the lone full-coverage control — same author, same framework, full 6-state coverage — which is the proof that the floor is *author-dependent*, i.e. a missing templated contract, not an impossible one.
- **React/Next catalyst** (~8 functional): 7/8 miss focus-mgmt, 4/8 miss edge-status; mutation forms ship with **no error catch at all** (rejected call = permanent spinner).
- **React/BigDesign admin** (43 surfaces): the *inverse* — the component library auto-provides error/badge rendering, so the silence shows through exactly where the library does NOT help: focus-mgmt absent 10/10, two hard P1 keyboard dead-ends (`<div onClick>` with no role/tabIndex; bare unlabeled `<input>`/`<select>`).

**The generalization**: a framework that bakes in error/badge rendering (BigDesign) masks the gap on the states it auto-provides and exposes it on the states it does not (loading, focus, keyboard). The contract tier is what forces the floor *regardless of framework*. Of the BRD's 218 stories, **181 are UI-surface** (37 backend, partitioned by a persona predicate), and only ~8–10 enumerate any state at all, in 6 inconsistent prose spellings, **zero machine-enforceable**. The gap is the spec template's, and every UI story written from it inherits it.

### Finding 2 — Enforcement is an EXTENSION of the requirement-completeness lint, not a new `ui-rendering-contract-reviewer` (corrects the entry below, failure-mode-3 candidate fix)

The entry below proposed a new bespoke reviewer that greps for ARIA/`window.confirm`/`aria-expanded`. The recon found that is the wrong host on minimum-complexity grounds: the initiative already runs `requirement-completeness-lint` — **the only completeness lint that descends *into* a story body** ("one grain below the AC," per its OWNER-SPEC), already carrying a block parser, a `closes:`-via taxonomy, and the format-on-touch WARN/ERROR rollout. The ui-states rule is an additive parser + three structural guards on that engine, not a new tool. A standalone DOM reviewer would fork the closure machinery and the AC↔scenario join the project already owns. **Generalizable rule: a new spec-grain check extends the body-descending completeness lint; it does not spawn a sibling reviewer.**

### Finding 3 — The contract is a schematized block with content-aware ERROR guards, not a markdown table (supersedes the entry below's candidate fix)

The entry below's `ui-states` markdown table is human-readable but enforces nothing beyond "a table exists." The ratified shape is a fenced ` ```yaml ui-states ` block with the full 6-state matrix and **three ERROR guards that fire on the actual defect classes observed**: (a) any `edge_status` entry with empty/missing `affordance` — the dead-end guard, the `past_due` P0 directly; (b) `error` missing `surfaced_at`/`recovery` — the vanishing-toast guard; (c) an `inputs` field over an enumerable domain typed `control: text` with no `allowed_values` — the raw-ISO-country guard. Key-presence alone is insufficient: it passes a story that hand-waves the highest-density gap (see Finding 4).

### Finding 4 — The hardest gap the entry below missed entirely: focus-mgmt/keyboard is the MOST-missing state AND the LEAST-tooled

Focus-management and keyboard-reachability is the single most-missing state across all three apps (admin 10/10, svelte 5/10, catalyst 7/8), and the existing render-assertion harness **cannot assert it**. The initiative's Playwright tier asserts badge visibility and `getByRole` *presence* — not focus movement, tab order, or the keyboard-reachability of `div-onClick` controls. Nothing in-repo asserts it. So the enforcement tier, if built naively, will mechanically pass on the easy route-badge cases while leaving the actual P0/P1 defects — keyboard dead-ends and inline-panel error holes — un-asserted and un-queued. **The contract tier must own a focus/keyboard-assertion capability explicitly (Playwright `keyboard.press('Tab')` sequencing + `:focus` checks, or axe-core for the dead-end class); it is not free, and it is exactly where the gap is largest.** Two structural corollaries the recon found: component-level inline panels are not route-mounted (the `page.goto` harness can't reach them — needs a component-mount tier or parent-route driving), and the binding rail should be the minimal `closes: render:<page-object#method>` against the *existing* Playwright tier, NOT a net-new scenario-spine render-state rail (that rail's only marginal value is demo-tour sync — defer it).

### Finding 5 (meta) — A single-slice amendment ships the slice's blind spots into every future project unless a breadth pass re-grounds it before promotion

The entry below was authored from one surface's audit. It got two things materially wrong — it scoped the gap to the subscriber portal (it is app-wide, with an inverse profile in component-library surfaces) and it proposed a new reviewer (the right host is the existing body-descending lint) — and it missed the hardest finding (focus-mgmt is both most-missing and least-tooled). None of these were visible from one slice; all three fell out of a breadth pass across the other design languages. **Promotion-gate rule: an amendment scoped "candidate for methodology promotion" from a *single* surface/slice must be re-grounded by a deliberate breadth pass (other surfaces, other frameworks, the enforcement substrate it assumes) before it lands in `template/` — otherwise the slice's framing and its tooling blind spots are inherited by every project that adopts the template.** This is the amendment-process analogue of the rigged-denominator axis in [[proof-obligation-registry-pattern]]: a faithful capture of too-narrow a universe.

### Promotion candidate (shipped into `template/` here)

`template/docs/methodology/ui-rendering-contract-tier.md` — the pattern: every UI-surface story carries a `ui-states` contract (the 6-state matrix) as required G1 material, authored before implementation; enforcement extends the body-descending completeness lint with three content-aware guards; render assertions bind via the existing component/e2e tier, with focus-mgmt called out as the capability that must be built, not assumed. The portable lint engine stays consumer-local until the subs-initiative ratifies+builds it; the pattern doc is promotion-ready now because it is a spec-authoring discipline, not code.

**References**:
- subs-initiative recon+critique workflow `wf_5f5b3afd-876` (7 agents, 768K tokens): 3 surface audits + BRD spec-structure analysis + enforcement-substrate analysis + synthesis + adversarial completeness critic
- Working-tree verification: `apps/storefront-svelte/src/lib/subscriptions/SubscriptionDetailView.svelte:52-58,99` (the still-broken keystone — `/portal/subscriptions/[id]`) vs `SubscriberPortalApp.svelte:528-542` (the fixed sibling at three other routes); the two are divergent duplicate detail surfaces
- Promotes the [[2026-06-29]] subscriber-surface entry below; extends [[proof-obligation-registry-pattern]] (the ui-state as an obligation class) and [[dod-verification-ladder-pattern]] (the contract is G1 material the ladder cannot evaluate when unauthored)
- Enforcement host: subs-initiative `tools/requirement-completeness-lint` (the body-descending completeness lint, instance-1 of the obligation registry)

---

## 2026-06-29 — Subscriber-surface IA audit surfaced three spec-grain gaps the DoD ladder and traceability sweep structurally cannot catch

**Trigger**: A subscriber portal IA/frontend design audit on the subs-initiative (bc-subscriptions) found five P0/P1 issues in shipped code: `past_due` subscriptions rendered a red badge with zero action affordance (subscriber stranded with no path forward); `window.confirm()` used for cancel/reactivate confirmation (browser-native dialog, not designed UI); a standalone "Apply discount" button that BRD US-20.3 scopes exclusively to the cancel funnel; misleading "Currently 1" quantity subtitle (field absent from the portal API type); ARIA violations across dialog, region, and status roles. Retroanalysis traced these to three distinct spec-grain failure modes — and found that the existing DoD ladder (G1–G5), the traceability sweep (prototype→production 4-link chain), and the proof-obligation registry all fail to catch them, because the gap is *before* any of these checks have material to evaluate.

**Scope**: Candidate for methodology promotion (instance 1, from subs-initiative)

**Bucket**: methodology (two failure modes) + reviewer (one failure mode, candidate)

**Status**: Superseded in part by the 2026-06-29 recon-grounded entry above — the three-failure-mode *diagnosis* holds and remains the audit trail; the *candidate fixes* (markdown `ui-states` table; a new `ui-rendering-contract-reviewer`) are replaced by the schematized block + `requirement-completeness-lint` extension, and the portal-local *scope* is corrected to app-wide.

---

### Failure mode 1 — The edge-state rendering contract tier is missing from spec (the primary gap)

**Observed:** ACs for subscriber-surface stories describe the golden path. None specify what the subscriber sees when the system is in an error or exception state — no AC for `past_due`, no AC for network failure on form submit, no AC for the empty-state (no subscriptions). The BRD defines the `past_due` status as a system concept (§US-11.x, dunning), but no story says "when subscription.status = past_due, the subscriber portal renders [badge copy] and [action affordance]." Implementers made judgment calls that shipped plausible-looking but subscriber-hostile UX.

**Why the DoD ladder doesn't catch it:** G1 (AC written in spec?) answers YES for "subscriber can view their subscriptions" — a real AC exists. It would answer "not applicable" for "past_due renders update-PM CTA" because that AC *was never written*. The ladder is an honest oracle; it cannot evaluate what was never authored. G2/G3/G4 are all downstream of G1.

**Why the traceability sweep doesn't catch it:** the 4-link chain (research → meta → prototype → production) walks the surfaces that exist. No meta captured a `past_due` state screen because no research finding named subscriber-visible `past_due` handling; no prototype page shows a `past_due` row. The chain faithfully concludes: "nothing to diff against." Absence is invisible.

**The gap:** A missing contract tier between the system-state definitions in BRD §epics and the per-story ACs. For every subscriber-visible status enum value the system can place a subscription into, there must be a corresponding **UI rendering contract** specifying: subscriber-visible label, action affordance(s), and error copy. Without it, the implementer authors the contract at implementation time — silently, with no gate.

**Candidate fix (methodology bucket, per-story section requirement):** For any BRD story whose surface is subscriber-facing (portal, widget, email) AND whose parent system emits multiple status values, add a required `ui-states` section to the AC:

```
| Status     | Badge / copy          | Primary CTA (if any)        |
|------------|-----------------------|-----------------------------|
| active     | "active"              | —                           |
| paused     | "paused"              | Resume now                  |
| past_due   | "Payment issue"       | Update payment method       |
| cancelled  | "cancelled"          | Reactivate (within grace)   |
```

This section is G1 material — without it, the subscriber-facing portal has no G1 AC to evaluate for error states. The table populates G2 (a prototype screen for each state), G4 (a scenario per non-happy-path state), and G5 if live-path behavior exists.

The retrofix check is mechanical: enumerate every enum value in the domain schema for the resource the surface renders, and confirm each has a corresponding row in a `ui-states` table in some BRD story. Any enum value without a row is a G1 gap.

---

### Failure mode 2 — Prototype screens are golden-path-only; error/edge states are never screened

**Observed:** The convergence stills and prototype screens for the subscriber portal capture the active subscription with management actions expanded. No screen captures: a `past_due` row, the cancel funnel mid-state, an empty subscriptions list, a NTI + prepaid banner stacked on the same row. These states are unreachable from the happy-path flow a prototype author naturally walks.

**Why this is different from failure mode 1:** Even when a `ui-states` table exists in the BRD, the G2 (prototype screen) check would fail if no screen shows the error state. Failure mode 1 is the missing spec; failure mode 2 is the missing prototype artifact for the spec that does exist.

**Why the traceability sweep doesn't catch it:** the sweep agents look for "what the prototype shows for this meta's route" — if no prototype page exists for the error state, the sweep produces no finding. It does not synthesize "there is no screen for past_due; this is a gap."

**Candidate fix (methodology bucket, prototype authoring convention):** Add a convention to the prototype-authoring stage: for any surface that renders a stateful domain object, the prototype MUST include a **states gallery** — one still or interaction screen per status enum value the object can hold. The states gallery is a G2 artifact; its absence makes G2 structurally incomplete for error states even when the happy-path G2 is COMPLIANT.

Practical shape: the Kibble/subs-initiative demo-stills pipeline already supports this — seed a D1 fixture with a `past_due` subscription and run stills capture against the portal route. The output is the states-gallery artifact. No manual Figma work required.

---

### Failure mode 3 — UI micro-contracts have no spec anchor; implementer judgment is the only gate

**Observed:** ARIA role violations (`role="region"` on an inline expansion widget, `role="note"` on a status banner, missing `aria-describedby` on an `alertdialog`); loading state copy missing from intervention buttons (bare "…" instead of "Pausing…" / "Applying…"); focus management on panel open unspecified and unimplemented; duplicate form components (shipping and billing address forms share identical code). None of these are specced in the BRD. No AC says "the cancel funnel alertdialog must carry aria-describedby." No prototype shows a loading state on a button.

**Why this is different from the first two:** This is not an edge-state problem — it is a **behavior-grain** problem. The happy-path AC is fully specified and prototyped. What is missing is a layer of implementation standards that constrains HOW the happy path is rendered — ARIA patterns, loading states, focus management, input type constraints — that are below the AC grain and above raw developer preference.

**Why no existing gate catches it:** The DoD ladder gates existence (G3) and behavior (G4). A G4 scenario "subscriber cancels subscription" passes when the cancel succeeds — it does not test `aria-describedby` presence. ARIA conformance is a structural property of the rendered DOM, not a behavioral property of the subscription lifecycle.

**Candidate fix (reviewer bucket, instance 1):** A `ui-rendering-contract-reviewer` that, for any PR touching subscriber-facing components, checks:

1. Every `role="alertdialog"` carries both `aria-labelledby` AND `aria-describedby`
2. Every inline disclosure widget uses `role="group"` (not `role="region"`, which is a landmark)
3. Every interactive state change (pending API call) has explicit loading copy (not a spinner alone)
4. No `window.confirm()` / `window.alert()` in component files
5. Interactive elements that open panels carry `aria-expanded`

This reviewer is a second-instance candidate; the subs-initiative audit is instance 1. The reviewer would run as part of the PR gate for any surface touching subscriber-facing or merchant-facing UI.

---

### Relationship to existing patterns

- **DoD Ladder (dod-verification-ladder-pattern.md):** Failure modes 1 and 2 are G1 gaps — the AC and the prototype screen were never authored for error states. The ladder is not the problem; the problem is upstream of G1. The fix belongs in the AC authoring convention (failure mode 1) and the prototype authoring convention (failure mode 2).
- **Traceability sweep (prototype-vs-production-traceability-sweep.md):** The sweep is designed to catch drift when a prototype screen EXISTS. It has no mechanism for surfacing the absence of a required prototype screen for an error state. A future extension of the sweep could add a "missing states gallery" check: for each meta whose resource has a status enum, verify each enum value has a corresponding sweep target.
- **Proof-obligation registry (proof-obligation-registry-pattern.md):** Failure mode 1 is the same obligation-grain gap the registry generalized from the DoD ladder — a normative requirement (the subscriber sees X when status = Y) lives implicitly in the domain but never gets registered as a provable claim. The `ui-states` table is the registration mechanism.

### What the retrofix looks like at the story level

For an existing BRD story covering a subscriber-facing surface:
1. Enumerate every status value the rendered resource can hold (from the D1 schema).
2. Add a `ui-states` table to the story body (closes G1 for each status).
3. For each row, add a prototype still showing that state (closes G2).
4. For each non-happy-path row, author a G4 scenario asserting the correct rendering.

For a new story:
- The `ui-states` table is required on any subscriber-surface story before the story moves to implementation. A story with a partially populated table (happy path only) is incomplete.

**References**:
- subs-initiative subscriber portal audit session 2026-06-28/29: `past_due` stranded user, `window.confirm()` removal, standalone discount button removal, ARIA fixes across `CancelSubscriptionButton`, `ManagePanel`, `UpdatePaymentForm`
- subs-initiative `apps/storefront-svelte/src/lib/subscriptions/` — the concrete artifact set
- Generalizes [[dod-verification-ladder-pattern]] (the G1 gap class) and [[prototype-vs-production-traceability-sweep]] (golden-path-only screens)
- Relates to [[proof-obligation-registry-pattern]] (unregistered normative claim → no provable obligation)

---

## 2026-06-25 — Canonical stakeholder chat: raw-markdown + unescaped innerHTML + mid-word truncation

**Trigger**: ChapterZero's deployed chat (the canonical OpenRouter-over-docs pattern) rendered answers with literal `**asterisks**` and `1.` list markers, and cut off mid-word ("…labeled unpr") on longer answers. Root cause sits in the canonical template: `chat-widget.js renderMessage` did `innerHTML = text.replace(/\n/g,'<br>')` (markdown unrendered AND model output injected unescaped — an XSS hole), and `chat.js` had `max_tokens: 800` with no `finish_reason` handling.

**Scope**: Candidate for methodology promotion → **promoted** (canonical template fixed in this commit)

**Bucket**: template (`template/portal/chat-widget.js` + `template/portal/functions/api/chat.js`)

**Status**: Promoted

Three fixes applied to the canonical Pattern-B chat:
1. **Markdown rendering, escape-first** — `renderMessage` now escapes HTML, then renders a minimal markdown subset (bold / italic / `code` / bullet + ordered lists / paragraphs / auto-linked URLs) for bot bubbles; user/system messages use `textContent`. Closes both the raw-markdown display bug and the unescaped-innerHTML XSS risk.
2. **No mid-word truncation** — `chat.js` raises `max_tokens` 800→2048 and, on `finish_reason: 'length'`, trims the reply to the last complete sentence + "_(Trimmed for length — ask me to focus…)_". The user never sees a mid-word cut regardless of model verbosity (haiku ignores word-count caps on "list everything" prompts; the server-side trim is the real guarantee).
3. CSS for the rendered elements (`.chat-msg.bot p/ul/ol/li/strong/code/a`).

**References**:
- ChapterZero session 2026-06-25; consumer `prototype/_site/chat-widget.js` + `functions/api/chat.js` (deployed live)
- Canonical fix (this commit): `template/portal/chat-widget.js`, `template/portal/functions/api/chat.js`

## 2026-06-25 — Greenfield is the wrong default for decision/strategy work; init has no variant-fit check (2nd instance)

**Trigger**: ChapterZero (a "is this investable?" read of an investor deck — no product, no code) was stamped `variant: greenfield` and inherited the full build pipeline + Initiative Portal; the mis-fit only surfaced at Stage 5, when the research/strategy variant was pulled. Second instance of the same trap — the research variant itself was born from the mrr-automation dogfood hitting it.

**Scope**: Candidate for methodology promotion (2nd instance — promotion bar met)

**Bucket**: methodology (doc) + template (stamp warning — deferred)

**Status**: Active

`init` defaults `variant: greenfield` and nothing checks fit. When the input is a brief/deck/dataset with no codebase, the correct variant is `research` (portal-optional, provenance-only, deliverable = decision memo) — but the operator gets the product-build pipeline by default, then builds "product-shaped scaffolding no stakeholder can use" (the exact failure the research variant names). ChapterZero ran research → prototype → docs → validate → deploy before the variant was corrected; most of the portal scaffold was throwaway.

Fix applied: `docs/variant-selection.md` now leads with a pre-stamp variant-fit check (no product/code + input is a brief/deck → research, not greenfield). Deferred follow-up (template bucket): `stamp.mjs` should echo a louder hint when greenfield is defaulted with no `--codebase`/`--screenshots` signal — "if this is a decision driven by a brief, re-run --variant=research."

**References**:
- ChapterZero session 2026-06-25 (consumer initiative); variant re-classified greenfield→research mid-pipeline
- mrr-automation dogfood (1st instance — birthed the research variant)

## 2026-06-25 — Cloudflare Pages Functions silently no-op without a root wrangler.toml; clean-URL rewrites loop .html gate pages

**Trigger**: Deploying the ChapterZero gated portal (passphrase gate + grounded chat as Pages Functions) via `wrangler pages deploy <dir>` uploaded `functions/*.js` as inert static files — no compile, no routing. The gate didn't gate (`/` served 200), `/_kb.md` was public, POST `/api/*` returned 405. Separately, the `/login.html` gate page hit `ERR_TOO_MANY_REDIRECTS`.

**Scope**: Candidate for methodology promotion (any Pattern-B / gated Pages consumer hits both)

**Bucket**: methodology (`docs/patterns/cloudflare-deployment-pattern.md`)

**Status**: Active

Two gotchas, both now documented in `cloudflare-deployment-pattern.md`:
1. **Functions only compile when a `wrangler.toml` (`pages_build_output_dir = "."`, `compatibility_flags = ["nodejs_compat"]`) sits at the deploy root AND wrangler runs from that directory.** Without it, `functions/` uploads as static assets and every Function route 405s. The deploy output is the tell: "✨ Compiled Worker successfully / Uploading Functions bundle" = good; bare "Uploaded N files" = functions ignored.
2. **Pages "clean URLs" 308-redirect `/x.html` → `/x`.** A gate middleware that allows `/login.html` and redirects unauth users to `/login.html` loops forever. Fix: allow BOTH `/login` and `/login.html` in the allowlist, and redirect unauth → `/login`.

**References**:
- ChapterZero session 2026-06-25; `prototype/_site/wrangler.toml` + `functions/_middleware.js`

## 2026-06-25 — Stage-4 validate has no primary-source gate for agent-synthesized figures, nor a cross-doc number reconciliation

**Trigger**: ChapterZero's Stage-4 fact-check caught a fabricated competitive claim ("OpenAI has no API reseller program" — false, and self-contradicting the doc's own 300K-partner citation) and a critical internal inconsistency (the $2,800 piloted ARPU vs the $10K vision ARPU — a 3.6× leap with no bridge). Neither was caught upstream.

**Scope**: Candidate for methodology promotion (every agent-accelerated research pass is exposed)

**Bucket**: reviewer (two new checks; implementation deferred)

**Status**: Active

Two regression seams the validate diagnose-loop surfaced:
1. **Research-stage primary-source gate** — any claim that is a specific dollar figure / headcount / named program must be verified against the vendor's CURRENT primary page (not a secondary aggregator or training-era assumption) and carry a capture-date. The ChapterZero errors were all "specific numbers that arrived polished" from one search.
2. **Docs-stage cross-doc number reconciliation** — load-bearing figures (ARPU, margin %, supplier rationale, pricing) must agree across strategy/feasibility/research before the package ships, or carry an explicit "differs because…" note. The $2.8K↔$10K gap spanned two docs with no check comparing them.

Filed as reviewer-bucket candidates; full reviewer agents deferred (this entry is the promotion signal).

**References**:
- ChapterZero session 2026-06-25; `validation/2026-06-25-validate.md` Phase 5–6

## 2026-06-25 — Research-variant deliverable: the deployed page can BE the decision memo (proof embedded, research as evidence, gated, grounded chat)

**Trigger**: For a non-technical recipient (the founder), "send a repo link" is non-viable, and "portal optional, provenance-only" left the research unused on the deployed surface. The shape that worked: the deployed page IS the decision memo — argument → embedded interactive proof → research-as-evidence → honest economics → recommendation — passphrase-gated, with a chat grounded in a compiled corpus.

**Scope**: Candidate for methodology promotion (research-variant deliverable pattern)

**Bucket**: methodology (`docs/variant-selection.md` research section)

**Status**: Active

Additions worth promoting into the research-variant playbook (noted in `variant-selection.md`):
- **Deployed decision-memo shape**: one scroll page = the memo, with the (optional) prototype embedded as the "proof" section and the validated research inline as the "evidence" section. Consolidates PDF + demo + repo into one forwardable link — faithful to "the deliverable is the memo," rendered for humans who don't live in git.
- **Ground the stakeholder chat in a session-log, not just final docs**: a `docs/content/session-log.md` capturing the session's decisions/reasoning, compiled into the chat corpus alongside the docs, lets the chat answer "why did you conclude X?" — not just "what does the doc say."
- **Passphrase-gate + grounded-chat reuse**: the canonical Blueprint chat (OpenRouter + corpus) plus a Pages-Functions passphrase gate makes a private, shareable, self-explaining deliverable.

**References**:
- ChapterZero session 2026-06-25; `prototype/_site/` (memo + walkthrough + functions), `docs/content/session-log.md`

---

## 2026-06-25 — The DoD ladder grounds ACs, not specs: generalize five fixed gates to N proof obligations

**Trigger**: subs-initiative found a normative requirement (US-8.1's `widget.impression` telemetry, named in a story's `**Data contract.**` deeper-section) that shipped "done" with zero producers — invisible to every gate because the DoD ladder grounds *acceptance criteria* and nothing grounds the requirements a story carries *below* its ACs. ~200 such deeper-section blocks existed; no existing completeness lint descends below AC grain into a story body. Independently verified (lint boundaries, orphan reproduced, parser-feasibility, industry citations) via a verification workflow.

**Scope**: Methodology pattern + portable tool. The five-gate ladder is a *special case* of a more general object — promotion-ready as a pattern doc + a portable registry engine; the requirement-grain instance-1 lint stays consumer-local (BRD-format-coupled) and is referenced as the canonical instance.

**Bucket**: methodology (verification-completeness generalization)

**Status**: Active. Single-initiative — promote to cross-consumer law when a second consumer registers a non-ladder obligation and the registry catches a real defect.

**Finding 1 — The ladder answers five fixed questions about an AC; a real spec makes more claims, at finer grain.** "Did we cover all use cases / verify every normative requirement inside a story / make every handler reachable / match every contract to live?" are all the same shape as a ladder gate. The fix is not a sixth gate — it is a **proof-obligation registry** where every "did we X? prove it" is one obligation (`claim → universe-source → oracle/tier → cadence → freshness`) and the five gates are five rows. The ladder pattern's own note "G4-green ≠ fully tested … recursed one gate up" is this generalization's starting point.

**Finding 2 — Every false "prove it" is one of three failure axes; two are mechanically guardable.** Rigged denominator (the universe silently excludes members — the new face), too-weak oracle (presence ≠ function — the ladder's own G3-read-as-done), oracle self-reference (the proof reads the claim's own declaration as evidence). THE LAW that unifies them, and generalizes the audit-discipline rule to the whole prover: *a proof's evidence must come from a source the claim does not control.* The registry's `validate` enforces axes 1+3 structurally (a `grep` oracle MUST declare a four-guard binding; every obligation MUST name its universe-source).

**Finding 3 — The denominator is the failure axis `ground-truth-over-proxy` was missing.** Its six (now seven) lessons are all representation-drift; the rigged-denominator is a *second spine* (a faithful check of the wrong set), added there as L8. This is also where the achievability ceiling sits: T1 internal completeness is mechanical, T2 requirement quality is a skill, **T3 external completeness ("did we omit a requirement the system needs?") is not mechanically provable** — make the universe explicit, sign it, attack it adversarially; never pretend it's solved.

**Finding 4 — Authored-grain obligations roll out format-on-touch, never a big-bang parse.** A reliable regex over heterogeneous prose deeper-sections is infeasible (verified) and would manufacture the exact false-greens the obligation kills. The requirement is *authored* in a parseable block on touch; the lint runs WARN for the backlog, ERROR for adopted stories, and a known-unbuilt artifact closes via a visible `gap:<issue>` — never silently green.

**Promotion candidates (shipped into `template/` here):** (1) `template/docs/methodology/proof-obligation-registry-pattern.md` (the generalization); (2) `template/tools/spec-obligation-registry/` (the portable registry engine + the three-axis structural contract, seeded with the five ladder gates + a commented instance-1); (3) a forward-pointer added to `dod-verification-ladder-pattern.md`; (4) L8 added to `docs/lessons/ground-truth-over-proxy.md`. The requirement-completeness lint + the parseable `normative-requirements` block format stay consumer-local until a second consumer reproduces them.

**References**: subs-initiative `[Spec] #1700` (proof-obligation registry), `ADR-0076`, `METHODOLOGY §8.1b`, `[Spec-Reconciliation] #1701` (the US-8.1 telemetry orphan); generalizes [[dod-verification-ladder-pattern]] (wave 52/62/63); extends [[ground-truth-over-proxy]] (L9). Relates to the [[2026-06-17]] honest-reckoning discipline (verification, not novelty, is Blueprint's contribution).

---

## 2026-06-17 — Dogfooding the research variant on a strong-input initiative: Blueprint's value is error-filtering, not strategy generation; research initiatives usually need NO portal

**Trigger**: End-to-end dogfood of the new `research` variant (PRs #22-24) on the mrr-automation / partner-NRR initiative — an A/B/B′ run on the same 8-document input set + a relayed dashboard — followed by an honest reckoning of what the produced decision memo actually *unlocks* versus its inputs.

**Scope**: Methodology-level expectation-setting + research-variant scoping guidance. Promotion-ready as doc guidance; the portal-default change is a code candidate (below).

**Bucket**: methodology (value model + research-variant scoping + anti-vanity discipline)

**Status**: Active

**Finding 1 — On a strong-input research initiative, Blueprint's contribution is *trustworthiness*, not novelty.** The B′ memo's strategic content ≈ the strongest single input (the Implementation Quality deck): measurement-first, decoupled from the incentive redesign, build-attribution-capture-now, advisory-before-binding, outcome tier gates, pay-on-verified-live. Every recommendation traced back to an input; the pipeline *re-derived* the inputs' own conclusions. What it genuinely added was narrow and verification-shaped: (a) caught errors *in the inputs* a human skim would propagate — an inverted BRD KPI (deflection vs GRR/NRR), an unverified "entitlement service already exists" claim, and a direct contradiction between two inputs (composite scorecard vs explicit no-composite); (b) one fact the FY26-dated inputs *couldn't* contain — a June-2026 re-pull showing the cited benchmark (Salesforce) is moving *away* from the multi-metric / many-tier model the inputs hold up to emulate. **Expectation to set with operators:** Blueprint makes a synthesis trustworthy; it does not make it novel. Sell the verification, not the strategy.

**Finding 2 — Production ≠ progress; run the vanity gate at every step.** Run A (greenfield default) over-produced: a portal, frontmatter, "axioms," a corpus, a deck — most of it ceremony for this initiative type. The discipline that fixed it generalizes the persona-fit-reviewer's intent into a standing principle: at each artifact, ask *"which named persona's named job does this serve, and what does it unlock versus the raw inputs?"* — and cut what can't answer. This is the single most reusable habit from the arc: refusing to mistake artifacts for value.

**Finding 3 — Research initiatives usually need NO portal; deliver to the team's existing surface.** The gated Cloudflare portal we built and deployed was a surface the consuming team would never visit — the inputs *originated* in a shared Claude Project + Google Drive, which is where the team already collaborates. The right research deliverable is the decision memo (+ optional deck) delivered *into that surface*, not a bespoke portal. The research variant should default to no portal and treat "stand up a portal" as the exception requiring justification. (Generalizable negative result: a portal nobody on the consuming team uses is pure overhead — and it actively misled us into "deploy" work that produced nothing the team can use.)

**Finding 4 — Name the goal: initiative-output vs methodology-hardening.** Most of this arc's *value* accrued to Blueprint (a new variant, a fixed install gap, hardened reviewers, a variant-aware runner), not to the initiative (a memo worth ≈ one new fact + one surfaced contradiction over its inputs, at high overhead). That trade is fine *when hardening the methodology against a real input is the stated goal* — and poor if the operator believes they are buying strategy. Make the goal explicit up front; the effort/value math is inverted between the two.

**Promotion candidates (for `template/`):** (1) research-variant default of **no portal** + a variant-selection note that a portal is the exception, not the default; (2) a **"value pre-check"** step in the research kickoff — *if the inputs are already a strong synthesis, scope the run to verification + decision-packaging, not full re-derivation plus a portal*; (3) fold the per-artifact vanity question (Finding 2) into the persona-fit-reviewer's operator-facing prose.

**References:** mrr-automation dogfood (this repo PRs #22-24, research variant); preserved evidence package `nino-chavez/partner-nrr-strategy-v2` (run B′); promoted deliverable `wip/mrr-automation/docs/content/decision-memo.md`; relates to the [[2026-06-12]] de-named-consumer entries (same consumer family). Honest-reckoning source: this session's "what does the memo unlock" / "what did we prove" exchange.

---

## 2026-06-12 — Candidates A + C realized in the flagship consumer; candidate A's second instance fired independently (atlas)

**Trigger**: Same-day convergence from two directions — the partner SA (T.) independently built `atlas-v0` (markdown workspace → typed graph → d3 viewer, with a STRATEGY question asking to merge the Blueprint/Hive node taxonomy into his schema), while the flagship consumer (bc-subscriptions) shipped the full mechanical realization of the [[2026-06-11]] candidates.

**Scope**: Status update on [[2026-06-11]] candidates A/B/C + the promotion-relevant contract

**Bucket**: methodology (status + convergence contract); template realization stays second-CONSUMER-gated

**Status**: Active

**Candidate A (decision/dependency-graph surface) — second instance FIRED.** Instance 1 was the partner session ask; instance 2 is T. independently *building* the surface (atlas-v0: zero-dep extractor + viewer, 3 layouts, 2-hop focus, scoped bundles with memory-as-traversal-leaf isolation). The realization shipped in bc-subscriptions the same day: a `/graph` projection endpoint over the archaeology events+refs store (lenses: receipts/decision/delivery/build/verify/requirements; `target_prefix` rooting) + the vendored atlas viewer. **The convergence contract is `ATLAS_DATA`** (`{nodes:[{id:"type:slug",type,label,…}], edges:[{source,target,type,provenance}]}`): two extractors (his walks markdown workspaces; ours projects the event store), one viewer. Taxonomy mapping (union-not-squash; `issue` deliberately ≠ `jira`) recorded standalone at `wip/bc-subscriptions/docs/methodology/atlas-taxonomy-convergence.md`. The graph-DB pushback held in practice: typed refs + a projection query answered the ripple-effect need; the reasonable remainder of T.'s "graph DB + MCP + Cypher" wish is an MCP tool over `/graph`+`/timeline`, no Cypher. Blueprint-side, the self-application portal carries a smaller ADR-frontmatter-only graph (`tools/dep-graph-derive` + portal island, commit 4af5ff9) built before the unified-store shape landed — keep as the Pattern-A portal-only fallback for consumers WITHOUT a substrate; the bc-subs shape is canonical for consumers WITH one. Template promotion of either still waits for a second *consumer* asking, but the contract decision is made and recorded now.

**Candidate C (audit-trail edges / skeletal ingesters) — COMPLETE in the flagship consumer.** `git.py`, `hive.py`, `github.py` all live (plus two the candidate didn't name: `brd.py` requirements and `state.py` verification verdicts). The receipt chain closes end-to-end: requirement (BRD US) ↔ decision (ADR) ↔ build (commit) ↔ coordination (proposal/synthesis) ↔ issue/PR ↔ capability/DoD verdict `as_of` a measured commit. Two transferable learnings for the methodology: (1) **coverage = reference discipline** — the graph is exactly as connected as commit messages/frontmatter/metadata cite each other; islands in the graph are a *writing* gap, not a tooling gap; (2) the verification axis ("is it done") was the silently-missing half of the provenance graph everywhere — intent/design/build get traced by default, verdicts don't; any consumer standing up an archaeology substrate should wire the state-derive/DoD stream from day one.

**Candidate B (hive ↔ DoD gate) — unchanged.** atelier ADR-061 remains the reference impl. bc-subs now has the verdict *events* in its store (state.py), which is the auditability half — but no coordinator-layer completion gate yet; B stays gated on that wiring.

**References:** `wip/bc-subscriptions` dev commits `b3624621..05aece91` (worker prep / brd / state / github / atlas convergence) + main commits `14054e35..1e03d1fb` (git/hive ingesters, /graph endpoint); `~/Downloads/atlas-v0` (T.'s extractor + viewer + README); `wip/bc-subscriptions/docs/methodology/atlas-taxonomy-convergence.md`; this repo commit 4af5ff9; relates to [[2026-06-11]] (all three candidates) and the consumer-identification entry below (same day).

---

## 2026-06-12 — Consumer-identification has no mechanical public-tree signal; the flagship consumer reads as a non-consumer

**Trigger**: An agent attributing decision-graph work to the right repo concluded bc-subscriptions was *not* a Blueprint consumer — when it is the first and flagship one (de-named `subs-initiative`, the only full `.hive/` consumer, 116k LOC shipped).

**Scope**: Candidate for methodology promotion (instance 1)

**Bucket**: methodology + tool (consumer-discovery convention; `blueprint fleet` discovery path)

**Status**: Active

**Observed:** Asked "where was this work done — is bc-subscriptions a Blueprint consumer?", an agent ran three checks and got three false negatives: (1) `ls blueprint.yml` → absent (bc-subs has no `blueprint.yml` anywhere — it consumes the methodology via `METHODOLOGY.md` + `.hive/`, the pre-portal Pattern-A shape); (2) name grep of `consumers.yml` for "bc-sub"/"subscription" → empty, because the registry entry is **deliberately de-named** (`private/subs-initiative`, real identity only in gitignored `consumers.local.yml`); (3) `methodology_version: null` in the registry, so no pinned-version marker. The agent weighted two absent modern-shape markers over four *present* consumer markers (`.hive/`, `METHODOLOGY.md`, `research/`, `docs/decisions/`) that were visible in the first directory listing — a hasty negative inference. **But the inference was enabled by a real gap:** there is no mechanical, public-tree signal that identifies a Pattern-A-via-`.hive` consumer. Every reliable identifier is either absent by design (no `blueprint.yml`), masked for public-repo hygiene (de-named registry), or behind a gitignored file (`consumers.local.yml`). "Is repo X a consumer?" has no answer a `blueprint fleet`-style command — or an agent — can compute from committed files alone.

**This is the same class as candidate A/C from the [[2026-06-11]] partner-session entry** (linkage that is real but not surfaced anywhere queryable): the consumer↔methodology edge exists, but lives only in gitignored config and prose, so it is invisible to mechanical traversal. The audit-trail/dependency-graph work is meant to *answer* "how does X connect to Y"; this is that question one level up — "is X even in the graph?" — failing for the same reason (the edge isn't committed in a machine-readable form).

**Candidate fix:** define a canonical consumer-identification signal that lives in committed, non-secret files. Two shapes, cheapest first: (a) a `METHODOLOGY.md` frontmatter marker (`blueprint_consumer: true` + `pattern: A|B`) that a fleet/discovery pass greps without needing `consumers.yml` at all; or (b) a committed marker file (`.blueprint-consumer` with pattern + methodology_version, secrets-free) so de-naming the public `consumers.yml` entry never costs discoverability. The reliable signal *today* is `.hive/` + `METHODOLOGY.md` presence — codify that as the documented fallback for discovery until a marker lands. Mechanical realization (the fleet-discovery check + the marker convention) second-instance-gated; the convention note (`.hive/` + `METHODOLOGY.md` = consumer signal, NOT `blueprint.yml` presence) is cheap to land now in the consumer-identification docs.

**References:** `consumers.yml` (the de-named `subs-initiative` entry, lines ~92–96); `wip/bc-subscriptions/` (`.hive/`, `METHODOLOGY.md`, no `blueprint.yml`); this session's mis-attribution; relates to [[2026-06-11]] candidates A/C (surface-the-real-but-invisible-edge class).

---

## 2026-06-11 — Blueprint↔Hive gaps from the partner working session: DoD-gate wiring, decision-graph surface, audit-trail edges

**Three new candidates (all instance 1); two meeting asks resolve to already-shipped capability.** Source: the first co-development working session with the partner SA (T.) — `feedback/2026-06-11-partner-working-session.md`. The meeting's own next-step assigned this analysis ("identify gaps between Blueprint and Hive regarding archaeology and definition-of-done"). The discipline holds: mechanical realization is second-instance-gated, **except** where the partner's live engagement can serve as the instance-1 calibration test (the same exception the ground-truth-scope fix took with the second-attempt experiment).

### First, what is NOT a gap (named so the methodology doesn't re-derive shipped work)

- **"Embed process invariants / definition of done"** → the DoD verification ladder, shipped waves 52/62/63 (`template/tools/state-derive` `scenario_passes` check + `template/tools/scenario-results` normalizer + the UNKNOWN→MANUAL_REVIEW fail-safe). The meeting's field anecdote — a teammate marking an incident addressed by *citing docs that don't match reality* — is the exact present-but-broken / claimed-done-via-presence class the ladder exists to kill. The capability exists; the gap is that it doesn't reach the team layer (see candidate B).
- **"Massive coordinated updates, the Google-monorepo shape"** → `blueprint fleet` + consumer-sync (`--mode=audit-chrome` / `restamp-chrome`) is that primitive at fleet scale; 12 consumers coordinate through it today.
- That the partner re-derived both is itself a minor signal: **shipped DoD/fleet capability isn't visible to active consumers.** Partially addressed already (the wave-63 primitive was surfaced on the portal `/compare` this week); logged, not filed — the onboarding-visibility gap waits for a second instance.

### Candidate A — decision/dependency graph surface (bucket: doc + tool)

**Observed:** T. and the author want a node-based graph (heatmap-like) to navigate decision/dependency context, explicitly *instead of* a rigid dashboard. Framed in the meeting as needing a graph database (or Supabase + Claude MCP) as the backing store.

**Reality check — the edges already exist; only the surface is missing:** archaeology events carry typed `refs[]` join keys (`{type: commit|doc, id}`); ADR frontmatter carries `supersedes`/`extends`/`informs`; the portal config already has a `dep_graph: null` placeholder waiting (`template/apps/portal/src/lib/portal-config.ts`). The gap is (1) a build-time pass that emits a nodes/edges JSON from those sources and (2) a force-graph portal island that renders it.

**Candidate fix:** a small emitter under `template/tools/` walking archaeology `refs[]` + decision frontmatter + wave-log references into `dep-graph.json`; a portal island that fills the existing `dep_graph` slot. **Push back on the graph-DB instinct:** D1 `refs[]` is already the edge store — adopting Neo4j / Supabase-graph before any multi-hop traversal-query need exists is over-engineering (same call as deferring hive identity-hardening until a second team showed up). Render the edges first; reach for a graph DB only when a traversal pattern actually demands it. Mechanical realization second-instance-gated (a second consumer wanting the surface); the emitter is cheap enough to prototype against the self-application now.

### Candidate B — Hive ↔ DoD-gate wiring (bucket: hook + schema) — the core Blueprint/Hive gap, highest priority

**Observed:** Blueprint has a DoD verdict (`state-derive` → `_state.json`: COMPLIANT / NON_COMPLIANT / MANUAL_REVIEW); hive has task completion (mark done, release locks). **They are disconnected** — a team member can mark a hive task done while `state-derive` says NON_COMPLIANT, and hive will not catch it. The meeting's field pain (a teammate declaring an issue resolved by citation, no clear DoD on the engagement, the partner forced to backfill BA/PM/SA roles) is this disconnect in the wild: "done" in the coordination layer is a self-reported flag, not an inherited verdict.

**Candidate fix:** the coordinator's completion path reads the `_state.json` verdict for the task's AC/feature and refuses (or at minimum annotates with `dod_verdict`) a "done" that the ladder hasn't cleared — so team-layer "done" inherits the ladder's fail-safe instead of being self-asserted. **This is the answer to the meeting's assigned Blueprint↔Hive gap question, and the highest-priority candidate** — smallest blast radius, and it has a live consumer (the partner's engagement) to calibrate against, so it does NOT wait for a synthetic second instance. Generalizes the field complaint into a mechanism.

**Reference impl landed 2026-06-11 — atelier ADR-061 (`atelier dod`).** Building it sharpened the placement: the gate does NOT live in the live completion *transition* when the coordinator is a deployed service. atelier's `update` is a pure Postgres write path and the deployed endpoint has no repo checkout, so `_state.json` (a build artifact stamped with `as_of_commit`) is not on disk at request time — reading it there is impossible. The gate belongs where the artifact lives and where the *real* completion is decided: the **CI / merge layer** that owns `review → merged` (the git merge), mirroring how atelier already ships its `find_similar` check (ADR-006). So the contract is "the coordinator reads the DoD verdict at the layer that owns completion," not "the live transition does an inline disk read." The fail-safe is load-bearing and confirmed in the wild on first run: atelier's `_state.json` was stale (last `state-derive` run predated HEAD), so the gate read MANUAL_REVIEW despite every capability showing pass — a stale green correctly cannot read done. Per-AC scoping (`atelier dod --trace-id`, joining a contribution's `BRD:Epic-N` trace_ids to the capabilities whose `reference` cites them) and the `--strict` CI gate landed the same day; remaining follow-ups (coordinator-response surfacing, verdict persistence + the `dod_verdict` schema field, and a structured `covers` field to replace the prose-reference join) are recorded in ADR-061.

### Candidate C — audit-trail edges: finish the skeletal ingesters + bidirectional decision refs (bucket: schema + tool)

**Observed:** T. wants an audit trail with *clear connection points between decision nodes* to recover the "why." Archaeology's `/derive` with `[E:event_id]` citations IS that trail — but `git.py` and `hive.py` ingesters are skeletal (only sessions + docs are full), so the decision→commit→outcome links are missing; and ADR citations are one-way prose (research→decision, no backlinks, no structured `research_refs[]` field on the frontmatter).

**Candidate fix:** finish the `git.py` + `hive.py` ingesters (commit metadata + hive proposal/synthesis events into the event log), and add a structured backlink field (`research_refs[]` / reciprocal `informed_by[]`) to ADR frontmatter so citations are machine-traversable both directions. **This is what gives candidate A real, bidirectional edges and makes candidate B's verdict auditable** — the three converge: C is the edges, A is the surface, B is the team-facing gate. The meeting's two assigned gap-areas (archaeology = the "why" = C; definition-of-done = B) are two faces of one wave. Mechanical realization second-instance-gated; the ingester skeletons already exist, so the lift is completion, not greenfield.

**Sequencing:** B first (smallest, live-consumer-calibrated, answers the assigned question), then C (edges), then A (surface) — A is the least urgent because it renders nothing until C supplies traversable edges.

**References:** `feedback/2026-06-11-partner-working-session.md`; `tools/archaeology/` (ingesters: `sessions.py`/`adr.py` full, `git.py`/`hive.py` skeletal); `template/tools/state-derive`, `template/tools/scenario-results` (waves 62/63); `template/apps/portal/src/lib/portal-config.ts` (`dep_graph` placeholder); `decisions/00-charter.md` frontmatter (`supersedes`/`extends`/`informs`); `docs/content/validation-script.md` (A3 Log row).

---

## 2026-06-11 — Ground-truth scope: fact-check verifies green against the wrong codebase; plus two second-instance promotions fired

**One new candidate (instance 1); two prior candidates PROMOTED (wave 57).**

**Observed (eng-team thread, June 7–9):** an engineering lead reviewed the promotions initiative's generated architecture against his own domain knowledge: "It's not very accurate" — the analysis was pointed at a service repo that implements only a slice of the domain (translation behavior); the main domain logic lives in the monolith. Stage-4 fact-check had verified the claims GREEN — correctly, against the repo it was given. The loop has no check that the analyzed codebase is the right ground truth. This is the false-green class at the research boundary: a domain insider catches it instantly; no in-repo gate can.

**Candidate fix (instance 1, second-instance gated for the mechanical half; spec-side question promoted into the archetype checklist now):**
- Stage-1 research gains a mandatory scope question: "name every system that implements this domain; is the analyzed repo the load-bearing one?" — answered by a stakeholder or flagged `unverified-scope`.
- Stage-4 fact-check gains a `GROUND_TRUTH_SCOPE` criterion: architectural claims carry which-repo-implements-this citations; a claim whose behavior could live elsewhere is flagged, not greened.
- The live test is the accepted second-attempt experiment (full repo scope) — its outcome calibrates the fix.

**Promoted this wave (second-instance rule fired):**
- **`market-signal` triage category** — instance 1: R.'s four-skill loop (2026-06-10, shoehorned into `opinion`); instance 2: V.'s AI-mobbing practice + 3-cycle model (2026-06-09 thread). Landed in `/blueprint-triage` (new category + explicit `logged` state).
- **Assumption-archetype checklist** — instance 1: A6 incumbent-displacement discovered from R.; instance 2: V.'s incumbent practice + the A7 solo-credibility challenge. Landed as `mom-test-validation-pattern.md` § "Assumption archetypes" (incumbent-displacement, solo-vs-team credibility, ground-truth scope).

**Also filed (instance 1):** role-mapped approval gates — V.'s model requires PM sign-off before spec, PM+Eng before codegen, Eng through ops; Blueprint's reviewer fleet is agent gates, not role sign-offs. `docs/governance/team-roles-and-conventions.md` covers the conventions half; the gate mechanics wait for a second instance (likely the partner-SA engagement).

**References:** `feedback/2026-06-09-eng-team-thread.md`, `feedback/2026-06-11-triage.md`, `docs/content/validation-script.md` (A7, both new Log rows).

---

## 2026-06-10 — Terminology-linter has no surface taxonomy; reader-facing jargon ships ungated

**Trigger**: an operator jargon audit of the self-application's entry surfaces ("what is Pattern A? without context it means nothing") found insider vocabulary used cold across the portal landing page, README, METHODOLOGY.md, and both learn pages — none of it caught by any gate.

**Scope**: Candidate for methodology promotion (instance 1; mechanical rewrite second-instance gated, scan-set extension promotable with the next reviewer-touching wave)

**Bucket**: reviewer

**Status**: Active

**Observed:** the 2026-06-10 audit found two distinct gaps in `terminology-linter`:

1. **Wrong scan set.** The spec scans "every HTML page in `prototype/` or `portal/`" plus `_meta/*.json` and `index.html`. Pattern A portals (`apps/portal/src/**` — `.astro` + `.md` pages) and the repo README are not in the scan set at all. The self-application's worst offenders — the portal landing page's CLI cards ("Classify every consumer's drift", "Bump a consumer's methodology pin"), README's command list, the learn pages — were never gateable, regardless of rules.
2. **No surface awareness.** The linter applies one rule class everywhere it does scan. The audit showed the correct policy is surface-scoped, two rule classes — and explicitly *not* a glossary artifact (a glossary externalizes the cost onto the reader and rots):
   - **Reader-facing surfaces** (portal pages, README, learn/tutorial content, deploy-visible meta descriptions): insider terms are banned outright — the fix is a plain-language rewrite, not a definition. Seed list from the audit: drift, methodology pin, stamp/stamper/restamp, chrome, wave, substrate, consumer (as a noun for a project), lanes, litmus, wired, design oracles, shared-bearer.
   - **Practitioner/canonical docs** (METHODOLOGY.md, `docs/*.md`): load-bearing vocabulary is allowed but must be defined or glossed on first use, with a link to the canonical definition when one exists elsewhere (`docs/variant-selection.md` is the in-repo model — it already passes).
   - **Agent-facing files** (CLAUDE.md files, `template/` internals, `.claude/**`): exempt — insider vocabulary is their working language.

**Worked around (manual):** two hand-audit-and-rewrite passes over the self-application, commits `a1dbd4a` (entry surfaces) + `7257539` (verb pages). The sweep also caught a broken instruction the jargon lens surfaced for free: `learn/tutorial.md` scaffolded with `init --pattern=B`, which `stamp.mjs:842` refuses — evidence that reader-path review has correctness teeth, not just tone teeth.

**Candidate fix:** extend the scan set per portal pattern (Pattern A: `apps/portal/src/pages/**`; Pattern B: existing HTML set; both: repo README + `docs/content/` deliverables), then teach the reviewer the three-surface taxonomy above — convention-defaulted by path, overridable via a `blueprint.yml` surfaces map. The scan-set extension is cheap and mechanical; the surface-scoped rule classes are the real rewrite and wait for a second instance (first external consumer whose portal copy ships jargon past the gate). **PROMOTED wave 60** (2026-06-10, scan-set half only; with a correction — the executable already walked `apps/portal/src`, so gap 1 was really the `.md` file-type drop + missing root README + the lagging spec). Surface taxonomy remains gated.

**References:** commits `a1dbd4a`, `7257539`; `template/.claude/agents/blueprint/reviewers/terminology-linter.md` (current spec, § "What you check"); the 2026-06-10 jargon-audit session.

---

## 2026-06-10 — Changesets cannot version the root package of a workspace monorepo; the release pipeline broke silently at the fold

**Candidate for promotion (release-engineering fix; latent since wave 45).**

**Observed:** the first changesets authored since 0.1.0 crashed the Release workflow: `Found changeset … for package @nino-chavez-labs/blueprint-cli which is not in the workspace`. Root cause: the publishable package IS the repo root, but the wave-45 fold added `workspaces: ["apps/*", "packages/*"]` — and `@changesets/cli` excludes the monorepo root from its package set. The pipeline was *present* and *green* for six waves only because no changeset existed to exercise it — the same presence ≠ function class as the doctor-CI gap, in the release layer. The deferred changeset-presence CI check (2026-06-10 enforcement-gaps entry) would have caught this six waves earlier by forcing a changeset (and thus this crash) at the first consumer-affecting wave.

**Worked around (this change):** version bumped to 0.2.0 by hand, the two pending changesets folded into a hand-written CHANGELOG entry (ADR-0007's register is the migration guide, not the tool), changeset files removed so the workflow's no-changeset path runs `changeset publish` for the unpublished 0.2.0. Whether `changeset publish` also root-blinds post-fold is answered by the next Release run — if it no-ops, the publish step swaps to a plain `npm publish --access public` + tag.

**Candidate fix (proper):** move the CLI into `packages/cli/` as a real workspace member (bin + template + libs relocate or get path-mapped), restoring the changesets flow end-to-end — or pin the policy to hand-written CHANGELOG entries for the root package and delete the changesets dependency. Decide at the next release-engineering wave; the changeset-presence CI check lands with it.

**References:** Release run failure on `277fbc1`, `CHANGELOG.md` § 0.2.0, `.github/workflows/release.yml`.

---

## 2026-06-10 — Enforcement gaps: checks exist but nothing runs them; claims rot that no reviewer reads

**Two candidates for promotion (one sibling promoted directly as wave 55).**

**Observed (operator challenge: "is Blueprint failing its own reviews?"):** a same-day audit found that every failure caught in the 2026-06-10 session — PII pushed public, a 41-file docs/ dump, stateful claims stale for 5 waves ("forty-nine waves captured in CLAUDE.md"), a 6-wave changeset lapse despite ADR-0007's own policy — was caught by the *operator*, not a gate. The mechanical gates that exist (doctor's 7 checks, doc-currency) were green and did catch what they cover (30 broken links during the reorg) — but they are invocation-gated: **no CI workflow ran doctor or any reviewer**, so a doctor-failing state could land on main and deploy. Presence ≠ function, applied to the enforcement layer itself (the wave-52 critique, one level up).

**Promoted directly (wave 55):** `.github/workflows/doctor.yml` — doctor's 7 checks run on every push/PR to main (dependency-free, bare checkout + node). Plus the `/blueprint-triage` privacy fix: anonymize-by-default capture (verbatim → gitignored `feedback/raw/`; committed files carry role + initial, paraphrased disclosures) — the skill previously *instructed* the verbatim-copy behavior that caused the 2026-06-09/10 PII leak.

**Candidate fixes (deferred):**
- **Changeset-presence check** (mechanical, near-free): CI fails when `template/**` changes without a `.changeset/*.md` in the same PR/push — enforces ADR-0007's "every consumer-affecting change adds a changeset" instead of trusting memory. Deferred only for sequencing; promote with the next CI touch.
- **Stateful-claim lint** (instance 1, second-instance gated): flag number-words and "latest X" claims near wave/consumer/reviewer nouns in prose docs and verify against the source of truth (WAVE-LOG count, consumers.yml length, reviewer registry). The 2026-06-10 sweep is instance one of the rot class; build the reviewer when it bites again. **PROMOTED wave 59** (2026-06-11, after the third sighting): `stateful-claim-lint-reviewer.{md,mjs}`, wired as doctor check 8.

**References:** `.github/workflows/doctor.yml`, `template/.claude/skills/blueprint/triage.md` § Step 1, the 2026-06-10 currency-sweep commit (`249c47d`).

---

## 2026-06-10 — Triage has no slot for market evidence; validation script has no assumption archetypes

**Candidate for promotion (two deferred candidates; a sibling gap promoted directly as wave 53).**

**Observed:** triaging the first buyer-persona feedback (`feedback/2026-06-10-eng-lead-thread.md`): an eng lead described his own four-skill spec loop — past-specific behavior about HIS practice, the highest-value Mom Test evidence class — and the triage state machine had no honest category for it. It is not bug / scope-add / scope-clarify / opinion / question / kudos; it is evidence about the market, not about the deliverable. It got shoehorned into `opinion` with a prose note (`feedback/2026-06-10-triage.md` item 3). Second gap from the same exchange: "personal-incumbent displacement" (practitioners with hand-rolled loops keep their kitchen) had to be *discovered* from the feedback as assumption A6 — the validation-script generator never prompted for it at script-generation time, though it is a predictable archetype for any tool whose buyers already hand-roll a version of the thing.

**Candidate fixes (second-instance gated):**
- A `market-signal` category in `/blueprint-triage`: evidence about the stakeholder's own practice/problem, not about the deliverable; weighted by the past-specific rule; logged to the validation script rather than dispositioned against the deliverable.
- An assumption-archetype checklist in the validation-script generator (`/blueprint-docs`): incumbent-displacement ("does the buyer already hand-roll this? displacement is its own assumption"), plus whatever archetypes the next instances surface.

**Promoted directly (wave 53), not deferred:** the ask-outcome gap — the Log shape recorded what stakeholders GAVE but had nowhere to record an ask made-and-not-taken, so the load-bearing negative datum of this instance (explicit time ask on the table, complimented, not taken) would have evaporated. Landed in `template/docs/methodology/mom-test-validation-pattern.md` (§ Ask outcomes + Log column) and the `/blueprint-triage` weighting rules. Direct promotion is justified because it is a faithful restatement of Fitzpatrick's advancement/zombie-lead rule — source-grounded, not invented from n=1.

**References:** `feedback/2026-06-10-triage.md` (the shoehorn note), `docs/content/validation-script.md` (A6, scary question 4, the re-shaped Log).

---

## 2026-06-05 — Pattern A/B portal contract has no archetype for an operator-facing process console (ops cockpit)

**Candidate for promotion (significant — missing pattern category).**

**Observed:** `ai-content-engine` (github.com/alejandrodavidvela/ai-content-engine), a greenfield Blueprint consumer whose deliverable is a daily content *operation*, not a product. It declared `tier: 0` with **no `portal_pattern`**, then hand-rolled a bespoke `prototype/` static bundle: an `index.html` front door over three surfaces (Ops cockpit / System overview / Work-with-us), a live cockpit reading a generated `state.json`, and Cloudflare-Pages deploy config. Its audience is `builders / ai_practitioners / ai_curious_execs`, not the Pattern A `executive / evaluator / engineering` pills.

**Why it matters:** neither Pattern A (a stakeholder front-door *to a product*) nor Pattern B (a brownfield redesign-review) fits an **operator-facing console for a recurring process** — a control surface whose audience is the team *running* the operation, not stakeholders *evaluating* a product. The consumer's response to the misfit was NOT to force content into the wrong verbs (the failure mode predicted in last session) — it dropped the pattern entirely and hand-rolled. That is precisely the drift the two-pattern naming exists to kill (`docs/portal-and-tier-ladder.md` § "Why this exists"), re-entering through the Tier-0 escape hatch. Three conformance symptoms:
1. A **Tier-1 deliverable wearing a Tier-0 label** — a deployed multi-surface portal with a live cockpit + deploy config is called Tier 0 because canonical Tier 1 demands an A/B portal it didn't want. "Tier 0" got locally redefined to mean "lightweight dashboard."
2. **No `decisions/` ADR records the bespoke divergence** — violates the Divergence rule (`portal-and-tier-ladder.md` § "Divergence rule": custom shells must justify against the canonical; silence is not acceptable). Silent drift.
3. The **ad-hoc verb labels** (cockpit / overview / work-with-us) are unversioned against any contract; the next ops-console consumer will pick different labels. That divergence is exactly the cost of real-time / derived IA.

**Root cause:** the portal model assumes **stakeholder-facing externalization** across both A and B. It has no first-class concept for operator-facing process consoles — even though Pattern A already smuggles the operate concern in as ONE of six verbs (the self-application fills `Operate` with fleet/upgrade/cost). The ops-console archetype is the **degenerate Pattern A where `Operate` *is* the product** and Discover/Try/Build/Roadmap collapse: same intent-slots, radically reweighted. That reweighting is an archetype-profile axis the methodology doesn't yet expose.

**Candidate fix (two parts, staged):**
- **NOW (this change):** close the Tier-0 escape hatch. Add a decision-tree lane in `docs/portal-and-tier-ladder.md` — *neither A nor B fits the archetype → a bespoke portal is allowed but ADR-mandatory* (reusing the existing Divergence rule) — plus a Tier-0 clarification ("a portal's existence makes the tier ≥ 1, however lightweight") and an Open-questions tracking item. This converts silent drift + tier-label fudging into documented divergence. **Done in `docs/portal-and-tier-ladder.md` this change.**
- **DEFER:** do NOT canonize "Pattern C — operator console" as a frozen contract from one instance. Pattern B was extracted from three consumers (subs-initiative + rally-hq + website-nc-v3), not one. Wait for a *second* ops-console consumer; let the second instance define the contract rather than guessing it. Sketch when it lands: same intent-slots, verbs reweighted/relabeled (cockpit / overview / convert), audience pills role-swapped (operator-first).

**References:**
- `ai-content-engine` `blueprint.yml` + `prototype/` (the bespoke portal); recommended `decisions/0001-bespoke-portal-ops-console.md` (proposed) records the consumer-side divergence.
- `docs/portal-and-tier-ladder.md` — decision-tree lane, Tier-0 clarification, Open-questions item (this change).

---

## 2026-06-04 — Pattern A portal (`template/apps/portal`) is over-coupled to the methodology's own dogfood substrate

**Candidate for promotion (significant — root cause).**

**Observed:** stamping `--pattern=A` produces a portal that cannot build/render a fresh consumer's deliverables, because the shell is hardwired to a substrate this (and any new) consumer doesn't have:
- `src/lib/repo-root.ts` keys `REPO_ROOT` on `METHODOLOGY.md` — exists only in the methodology source, never in a consumer.
- `src/lib/derived.ts` reads `docs/audits/derived/_state.json` (state-derive), `docs/hive/_board.json` (hive-board-derive), `docs/audits/derived/_epic-footprints.json`, plus GitHub Projects "Ready Queue" / Epic-N trackers (#30–#59).
- `src/lib/content.ts` + `derived.ts` read ADRs from `docs/decisions/NNNN-*.md`; consumers (incl. blueprint-redesign) use `decisions/ADR-NNNN-*.md`.
- `src/lib/scenarios.ts` reads `apps/demos/scenarios.json` — not created by the stamp.
- Pages bake methodology-specific narrative: trust axioms "ratified 2026-05-13 via synthesis #574", METHODOLOGY §8, WAYS-OF-WORKING.md, the five-actor model, `private-demo.example`.

**Why it matters:** the intent is "Blueprint ships a portal SHELL as the harness to all deliverables." Pattern A does NOT ship a generic harness — it ships the methodology's own dogfood portal with data-coupling + narrative baked in. The stamper substitutes strings but not the structural coupling. A consumer must rewrite the data model (`repo-root`/`content`/`derived`/`scenarios`) AND de-narrate every page before it renders their work. This is the v3-chrome-leak class escalated from CSS to the whole data model.

**Root cause:** `template/apps/portal` conflates reusable harness chrome with the methodology's dogfood content + substrate bindings; the bindings are hardcoded paths, not a config-driven data-source layer.

**Candidate fix (for promotion):** make `template/apps/portal` a genuinely generic harness — (a) `repo-root` marker = `blueprint.yml`, not `METHODOLOGY.md`; (b) a `blueprint.yml portal:` block declaring data sources (decisions dir + filename convention; optional state/board/scenarios paths) so missing sources degrade gracefully instead of throwing; (c) move methodology-specific narrative out of template pages into example content the stamper replaces/omits; (d) ADR catalog reads the consumer's `decisions/` convention.

**RESOLVED 2026-06-04 (template-level, North Star / campsite):** `template/apps/portal` refactored into a genuinely generic, config-driven harness on branch `platform/substrate` (a `tools/blueprint` worktree, under operator waiver). New `portal-config.ts` reads a `blueprint.yml portal:` block; all 5 loaders degrade-to-empty; the phantom `@blueprint/gate-derive` is vendored; the stamper writes a workspace root; `repo-root` keys on `blueprint.yml`. Verified: a fresh `stamp --pattern=A` → `npm install` → `astro check` (0 errors) → `astro build` (14 pages) clean with zero sources. blueprint-platform was re-stamped from it and renders its real deliverables (charter / ADRs / research / 14-step build-order) with no leak. Pending: merge `platform/substrate` → `tools/blueprint` main as a wave (operator's call).

---

## 2026-06-04 — Stamper mechanical-check false-positives on evidence docs that cite the source example project

**Candidate for promotion.**

**Observed:** `stamp.mjs --mode=stamp --pattern=A` into this initiative reported `UNEXPECTED RESIDUAL STRINGS (stamper bug — fix template/tools/blueprint-init/stamp.mjs)` for `CLAUDE.md`, `blueprint.yml`, and `research/00-recon-synthesis.md` — all matching the source-project slug `subs-initiative`.

**Why it's a false positive:** those three matches are *intentional references* to subs-initiative as the canonical Pattern A example (this is a methodology initiative that cites prior consumers as evidence). They are not leftover template strings. The mechanical check greps the **whole target** for the source slug, but a consumer's evidence docs (`decisions/`, `research/`, root `*.md`, `blueprint.yml`) legitimately name other consumers.

**Impact:** the "stamper bug" label invites an operator to "fix" correct references — exactly the kind of wrong-correction the mechanical check exists to prevent, inverted. For most consumers it never fires (they don't cite subs-initiative); for any Blueprint-on-itself initiative it always will.

**Root cause:** the post-stamp grep scans the entire target instead of the **template-copied paths** (`apps/portal/`, `packages/`). Evidence that predates the stamp can't contain leftover template strings by construction — only intentional references.

**Candidate fix (for `stamp.mjs`):** scope the mechanical residual check to the paths the stamper actually wrote (`apps/portal/`, `packages/`), excluding pre-existing evidence dirs (`decisions/`, `research/`) and root docs (`CLAUDE.md`, `blueprint.yml`, `README.md`, `HANDOFF.md`, `*AMENDMENTS*`). Or: classify whole-target matches in evidence files as `INFO (reference to another consumer)` rather than `UNEXPECTED RESIDUAL (bug)`.

**RESOLVED 2026-06-04 (template-level):** `stamp.mjs` `mechanicalCheck` now scopes its residual-string walk to the stamped paths (`apps/portal/` + `packages/` + the root `package.json`), not the whole target — so evidence dirs (`decisions/`, `research/`) and root docs that legitimately cite the example project no longer trip it. Re-stamping blueprint-platform now exits 0. The banner text was also genericized (no longer names the reference project), closing the last name leak in stamped pages.
