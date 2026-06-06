---
layout: ../../layouts/DocLayout.astro
title: "Tutorial — Run Your First Initiative"
description: "Run a brownfield Blueprint initiative end to end: scaffold, every stage, each reviewer gate, deploy, verify."
---

# Tutorial — Run Your First Initiative

This walks a single brownfield initiative end to end: a team adds Blueprint to an existing, live product to plan a real redesign. You will scaffold the portal, run every stage in order, clear each reviewer gate, deploy, and verify with `blueprint doctor`.

Brownfield is the common case. Your product already ships to real users; the work is audit-first — diagnose what exists, prescribe ordered changes, then optionally prototype the result for stakeholders to compare against current state. The deliverables are the diagnose and prescription documents plus a Pattern B review portal.

Running example throughout: **`acme-checkout`** — an existing e-commerce checkout flow that converts poorly. The team wants to redesign it and needs leadership, engineering, and reviewers all looking at the same evidence.

---

## Before you start

### Pick the variant (do this first, it is not reversible cheaply)

Run the decision tree. First "yes" wins:

1. Is the product already live in production with real users? **Yes** → continue.
2. Is the work scoped to active in-flight development (new features, mid-build revisions)? **No** → continue.
3. Is the work audit-first — diagnose what exists, prescribe changes, optionally prototype the result? **Yes → Brownfield.**

`acme-checkout` is live, not mid-build, and audit-first. Brownfield.

### Pick the pattern

Brownfield audit/redesign with current-state vs proposed comparison → **Pattern B (redesign-review portal)**. Pattern B gives stakeholders a per-page strategy drawer, a current-state drawer, a `PROPOSED / COMPARE / SHIPPED` toggle, and an AI chat FAB grounded in the project corpus. Stack is static HTML + Cloudflare Pages Functions (zero-build).

### Pick the tier

Tier 1 (Portal) is the default starting tier for any serious initiative. Brownfield defaults to Tier 1 for redesign-review work.

### Install the CLI

```bash
npm install -g @nino-chavez-labs/blueprint-cli
# or invoke ad hoc:
npx @nino-chavez-labs/blueprint-cli <command>
```

Requires Node.js >= 18. The binary is `blueprint`. Confirm:

```bash
blueprint --version
```

---

## Scaffold the portal — `blueprint init`

`blueprint init` delegates to the canonical stamper. Stamp a fresh Pattern B portal for the brownfield initiative:

```bash
npx @nino-chavez-labs/blueprint-cli init \
  --name=acme-checkout \
  --display-name="Acme Checkout Redesign" \
  --repo-url=https://github.com/acme/acme-checkout-blueprint \
  --tagline="Audit-driven redesign of the Acme checkout flow" \
  --variant=brownfield \
  --tier=1 \
  --pattern=B \
  --target=/abs/path/to/acme-checkout-blueprint
```

What lands: a stamped initiative directory with `blueprint.yml`, the Pattern B portal shell (`portal/` with `index.html`, `shared.css`, `_portal-shell.js`, `chat-widget.js`, `proto-nav.js`, `_meta/index.json`), and a post-stamp grep that confirms no template project strings leaked through.

After stamping, declare the brownfield variant and its stage requirements in `blueprint.yml`:

```yaml
variant: brownfield

stages:
  stage_1:
    output: "01-diagnose.md"
    requires:
      - "research/current-state/"
      - "research/personas/"
      - "research/funnel/"
      - "research/competitive/"
```

You will also fill in the `pilot_profile:` block — Stage 0's gate reads it.

---

## Stage 0 — Application Legibility

**You run:** the one-time sensor wiring. Brownfield makes Stage 0 mandatory — the product exists, so every audit claim must ground in a captured surface.

The default sensor is `browse-tool`; wire it once per initiative (setup + the escalation rubric to Chrome DevTools MCP live in [`docs/browser-legibility.md`](https://github.com/nino-chavez/blueprint/blob/main/docs/browser-legibility.md)). Each initiative claims a free port via its `serve.sh` and uses a per-initiative browser profile:

```
--profile-name acme-checkout-blueprint
```

**The agent does:** boots the live checkout, navigates it, runs JavaScript against it, and screenshots every surface the audit will diagnose. There is no skill for Stage 0 — it is initialization, reused by every downstream stage that validates against the live UI.

**Artifact:** a wired browser session plus the captured screenshots that Stage 1 diagnoses against.

**Gate (0 → 1): `pilot-profile-lock-reviewer`.** Verifies `blueprint.yml` carries a complete `pilot_profile:` block:

- `slug`, `display_name`
- `pain_point` — concrete, verb-based ("Abandons cart at the shipping step", not marketing prose)
- `monetization_side` — a specific market side (buyer / seller / operator / etc., never "user")
- `walkthrough_citation` — a path to a real artifact (transcript, competitive walkthrough doc, screenshot set)
- `competitors_in_scope` — at least one entry, derived from the walkthrough
- `out_of_scope_pilots` — at least one explicitly declared
- an ADR if the pilot was amended mid-pipeline

Run it:

```bash
blueprint review pilot-profile-lock-reviewer --target=/abs/path/to/acme-checkout-blueprint
```

PASS unblocks Stage 1. If it BLOCKS, the `pilot_profile:` block is incomplete — fill the missing field and re-run.

---

## Stage 1 — Diagnose (Research)

**You run:**

```
/blueprint-research
```

**The agent does (brownfield):** reads the Stage 0 screenshots and documents current state (components, terminology, data, navigation, gaps); explores the codebase if `research.codebase_path` is set; runs competitive analysis across the five research dimensions (R-1 IA + mechanics, R-2 voice + microcopy, R-3 visual language, R-4 motion, R-5 onboarding) for each entry in `research.competitors`; researches each `research.analogous_industries`; and synthesizes patterns into the comparables doc. It then synthesizes the findings into `01-diagnose.md`.

**Artifacts:**

- `research/current-state/` — screenshot analysis, codebase findings
- `research/competitive/` — per-competitor and per-industry analysis
- `research/personas/` — personas with JTBD entries
- `research/funnel/` — the conversion funnel
- `01-diagnose.md` — the synthesis (brownfield's numbered convention: `01-` signals stage order at the filesystem level)
- `docs/content/research-comparables.md` — patterns organized by category, each with an adopt/reject recommendation

**Gate (1 → 2): `research-completeness-reviewer`.** Brownfield requires all **five** research legs populated (`current-state/`, `personas/`, `funnel/`, `competitive/`, plus the `01-diagnose.md` synthesizing them), each with substantive content (≥500 bytes). It also verifies every persona declares a JTBD with four fields per surface:

- `surface` — path-like (`/checkout`, `/cart`)
- `time_budget` — duration or qualifier (`30 seconds`, `before deciding`)
- `job` — a sentence starting with a verb (`Confirm the total before paying`)
- `acceptance` — at least one testable condition (`Sees final total incl. tax + shipping within one scroll`)

And it checks funnel ↔ persona ↔ JTBD coherence: every persona-surface pair in the funnel has a matching JTBD entry.

```bash
blueprint review research-completeness-reviewer --target=/abs/path/to/acme-checkout-blueprint
```

PASS unblocks Stage 2.

---

## Stage 2 — Prescription

**You run:** no skill — this is an authoring stage. The agent reads `01-diagnose.md` and drafts `02-prescription.yml`.

**The agent does:** writes an impact-ordered list of change items. Each item carries:

- **What** — the specific change (component, page, copy, IA, behavior)
- **Why** — the motivating finding, cited to a section in `01-diagnose.md` or a research-file path
- **Impact ranking** — explicit (high / medium / low); silence on impact fails the gate
- **Evidence** — a screenshot path, codebase path, or research-file path. "Common in the competitive landscape" without a specific citation fails
- **Monetization side** — which market side the change serves; single-sided initiatives may use the `single-sided` literal
- **`serves_jtbd:`** — the Stage 1 JTBD(s) the item improves, as `<persona>/<surface>/<job-slug>` entries, or `serves_jtbd: none-deferred` with a substantive reason

**Artifact:** `02-prescription.yml` at the initiative root.

**Gate (2 → 3): two reviewers in parallel.** Both must PASS.

1. **`prescription-evidence-reviewer`** — every change item cites evidence and names a monetization side; items are ordered by impact (not by surface or ease); every item references a finding in `01-diagnose.md`; and every "critical"/"high" diagnose finding has a corresponding prescription item or a deliberate `deferred: <reason>` note. Findings that vanish between diagnose and prescription without acknowledgment fail.

2. **`prescription-jtbd-traceability-reviewer`** — every prescription item declares `serves_jtbd:` resolving to a real Stage 1 JTBD, or `serves_jtbd: none-deferred` with a reason ≥10 words. Unanchored items (no `serves_jtbd:` field) BLOCK; broken JTBD references BLOCK. This prevents the prescription drifting away from the JTBD shape Stage 1 produced.

```bash
blueprint review prescription-evidence-reviewer --target=/abs/path/to/acme-checkout-blueprint
blueprint review prescription-jtbd-traceability-reviewer --target=/abs/path/to/acme-checkout-blueprint
```

Both PASS unblocks Stage 3.

---

## Stage 3 — Design Brief + Prototype (Pattern B portal)

**You run:** the agent first authors `03-design-brief.md` (visual + IA direction for the prescribed changes). For the tangible artifact:

```
/blueprint-prototype
```

**The agent does (Pattern B):** builds the redesign-review portal under `portal/` — `index.html` (landing), `_meta/index.json` (manifest), `_meta/<page-id>.json` (per-page metadata with `strategy`/`currentState`), `pages/*.html` (the proposed checkout pages), and wires the shell files (`shared.css`, `_portal-shell.js`, `chat-widget.js`, `proto-nav.js`). Each page gets a strategy drawer, a current-state drawer, the `PROPOSED / COMPARE / SHIPPED` toggle, and the chat FAB.

**Artifacts:** the populated `portal/` shell with per-page metadata and the proposed checkout pages.

**Gates (after Stage 3):**

1. **`portal-pattern-b-conformance-reviewer`** — verifies the required shell files exist (`index.html`, `shared.css`, `_portal-shell.js`, `chat-widget.js`, `proto-nav.js`, `_meta/index.json`), per-page metadata is populated, and the strategy drawer + current-state drawer + comparison toggle + chat FAB are wired.

2. **`portal-chrome-canonical-reviewer`** (parallel) — verifies your chrome files (`shared.css`, `_portal-shell.js`, `proto-nav.js`, `proto-annotate.js`, `_headers`, `_redirects`) are byte-identical to the template canonical. Edit project tokens, not chrome.

3. **`prototype-forge-provenance-reviewer`** (substantive prototypes ≥500 HTML/CSS lines) — verifies the prototype surfaces could plausibly satisfy the Stage 1 JTBDs named in the prescription. This is a structural check; behavioral verification is Stage 6.

```bash
blueprint review portal-pattern-b-conformance-reviewer --target=/abs/path/to/acme-checkout-blueprint
blueprint review portal-chrome-canonical-reviewer --target=/abs/path/to/acme-checkout-blueprint
blueprint review prototype-forge-provenance-reviewer --target=/abs/path/to/acme-checkout-blueprint
```

All PASS unblocks Stage 4. These same gates re-fire on any `portal/`-touching commit.

---

## Stage 4 — Fact-Check

**You run:**

```
/blueprint-validate
```

Brownfield runs this whether or not Stage 3 produced a prototype.

**The agent does:** runs mechanical Phase 0 gates first (build, typecheck, contrast, DESIGN.md lint, token discipline, h1/page, font-display, banned terminology, aria-labels, skip-nav), then the diagnosis loop — builds feedback loops per claim category (current product behavior, codebase capability, quantitative claims, terminology, citations), reproduces every failure, hypothesizes root causes, instruments to distinguish hypotheses, fixes at root, and adds regression seams. Findings report by severity (CRITICAL / HIGH / MEDIUM / LOW).

**Artifact:** `validation/[date]-validate.md` — the structured diagnosis report.

**Gate (Stage 4 convergence): `fact-check-loop-reviewer`.** It fans out to sub-reviewers and decides convergence:

- `citation-checker` — market-research and strategy-panel claims resolve to real sources
- `current-state-claim-verifier` — existence claims match the screenshots in `research/current-state/`
- `codebase-claim-verifier` — buildability claims match actual code

All sub-reviewers must PASS. The loop caps at 5 iterations before escalating to the operator. PASS unblocks Stage 5.

---

## Stage 5 — Documents

**You run:**

```
/blueprint-docs
```

**The agent does:** reads the `blueprint.yml` document definitions, generates each document type, runs a quality audit (so-what placement, mental math, logic gaps, scannable format), converts markdown to HTML + Word, and copies the HTML into the prototype for deployment.

**Artifacts:**

- `docs/content/strategy.md` — leadership audience, internal-strategy voice
- `docs/content/feasibility.md` — engineering audience, solution-architecture voice
- `docs/content/research.md` — everyone audience, organized by pattern category with adopt/reject decisions
- `docs/content/integration-plan.md` — engineering audience, with architecture diagram and phased rollout
- `docs/deliverables/*.html` + `docs/deliverables/*.docx`
- `prototype/docs-*.html` — copies for the deployed site

**Gate (5 → 6): two reviewers in parallel. Both must PASS.**

1. **`doc-quality-auditor`** — audits every document against four checks: "so what?" placement (takeaway in the first sentence of each section), mental math (tables show conclusions; numbers carry comparison framing), logic gaps (sections don't contradict), and scannable format (context not trapped in paragraphs). Severity ranges CRITICAL (misleads) to LOW (sentence-level).

2. **`terminology-linter`** — scans user-facing copy across documents, prototype pages, and strategy panels. Locates the glossary (`docs/terminology.md`, `prototype/DESIGN.md`, or inferred from `research/current-state/`), then flags internal team jargon, engineering jargon in customer-facing copy, and undefined acronyms; enforces anti-pattern terms.

```bash
blueprint review doc-quality-auditor --target=/abs/path/to/acme-checkout-blueprint
blueprint review terminology-linter --target=/abs/path/to/acme-checkout-blueprint
```

Both PASS unblocks Stage 6.

---

## Stage 6 — Deploy

**Precondition:** a current validation report must exist. `/blueprint-deploy` soft-gates on it — if `validation/[date]-validate.md` is missing or older than the latest prototype/docs commit, it prompts you to run `/blueprint-validate` first or pass `--skip-validation` for a deliberate, copy-only skip.

**You run:**

```
/blueprint-deploy
```

**The agent does:** copies the HTML doc files to `prototype/docs-*.html`, updates the landing page, runs `cd prototype && vercel --prod`, then opens the deployed URL and verifies all doc links work, all prototype pages load, strategy panels open, current-state panels show the correct screenshots, footer navigation works, and the chat widget connects.

**Artifact:** the deployed URL — the primary deliverable. Share this one link with all stakeholders.

**Gate (Stage 6 ship): `prototype-smoke-runner`.** It:

- verifies `serve.sh` exists at the initiative root
- boots the prototype (`bash serve.sh &`) and waits for reachability on the declared port
- runs the `@smoke` Playwright specs (`npx playwright test --grep @smoke`)
- captures viewport screenshots per changed page (at minimum the landing page and every page in `_meta/index.json`)
- runs a JS-class-output ↔ CSS-coverage check (every class-name literal in the shell files has a CSS rule unless allow-listed)
- tears down the boot process (no orphan servers)

Both green `@smoke` and the visual CSS-coverage check are required — neither alone is sufficient. For a brownfield initiative that shipped a prototype, this gate is a hard block (the audience is VPs clicking a Slack link). PASS means the deliverable is ready to share.

---

## Verify the install — `blueprint doctor`

Run the conformance capstone against the deployed initiative:

```bash
blueprint doctor --target=/abs/path/to/acme-checkout-blueprint
```

It loads the config, loads every discovered reviewer, and runs portal conformance — then reports what it did **not** check, so a green here is never mistaken for a build/browser green.

```
blueprint doctor — /abs/path/to/acme-checkout-blueprint

  ✓ methodology-home       resolved at /methodology/home
  ✓ blueprint-yml          tier 1
  ✓ cost-config            all stages at/above anchor or justified
  ✓ portal-conformance     Pattern B portal structure valid

  not checked (by design — a green here is not a build/browser green):
    · full build (npm run build)
    · browser verification (screenshot/interactive)
    · deployment connectivity

overall: PASS → exit 0
```

Exit 0 means pass/warn; exit 1 means a check failed. Use `--json` for machine-readable output.

You can also confirm the cost profile is honest before/after deploy:

```bash
blueprint cost --target=/abs/path/to/acme-checkout-blueprint
```

It resolves the per-stage effort/model vector and flags any stage below its anchor without a `skip_justification` (which trips the Stage 6 cost gate). Telemetry stays PROVISIONAL until roughly ten cycles accumulate.

---

## Stage 7 — Iterate

When stakeholder feedback arrives, run:

```
/blueprint-triage
```

It runs feedback through a state machine. Categories: bug, scope-add, scope-clarify, opinion, question, kudos. States: needs-review → scoped-in | deferred | answered | wontfix | clarified | kudos. The loop categorizes each item, recommends a state, applies the disposition (create a task for scoped-in, write to `deferred.md` for deferred, write rationale to `decisions.md` for wontfix, and so on), updates the validation report when the item is a bug, and sends a triage summary. The portal stays forever — it gains depth, it does not get deleted.

---

## What you have now

A deployed Pattern B portal at one URL, serving three audiences off the same evidence base:

- **Leadership** reads `strategy.md` through the portal and the per-page strategy drawers — the why, the priorities, the risk register.
- **Engineering** reads `feasibility.md` and `integration-plan.md` — codebase mapping, effort per capability, phased rollout, open questions with code references.
- **Reviewers / stakeholders** flip the `PROPOSED / COMPARE / SHIPPED` toggle per page, open the current-state drawer to see exactly what exists today, and ask the chat FAB "why this decision" or "what's the source for X" without leaving the portal.

Behind the URL: `01-diagnose.md`, `02-prescription.yml`, and `03-design-brief.md` — the brownfield artifact package, each stage gated by a reviewer that passed before you moved on. The deliverable is the link, and it is grounded in evidence at every claim.

---

## Next steps

**Keep current with the methodology.** Check your version pin against the methodology source:

```bash
blueprint upgrade --target=/abs/path/to/acme-checkout-blueprint
```

Dry-run by default (terraform-plan style): it classifies your pin (current / behind / on-deprecated), narrates the CHANGELOG delta in range, and proposes the `methodology_version` bump. Add `--apply` to write the bump (dirty-tree-guarded, breaking-gated). Add `--require-pin` to fail if the initiative is unpinned.

**Contribute back.** When you hit an agent failure no existing reviewer, invariant, sensor, or doc covers, the question is not "how do I prompt around this" — it is "what capability is missing, and how do I encode it." File a methodology amendment:

```
/blueprint-amendment
```

It guides you through the canonical entry shape, applies the four-bucket classification taxonomy, and appends to your initiative's `METHODOLOGY-AMENDMENTS.md` in newest-first order. Use it when you notice a gap your initiative had to work around, add a hook/reviewer/doc the methodology doesn't supply, or skip a stage with justification.
