# blueprint-redesign

Blueprint methodology applied to itself. Variant: brownfield. Pattern: B (redesign-review portal). Tier: 1.

**Current-state product**: `~/Workspace/dev/wip/blueprint/` (the live methodology repo).
**Proposed-state product**: a production-quality Blueprint distribution that closes the eight gaps documented in Stage 1 + the four design-discipline gaps surfaced by the dogfood itself.

## Status as of 2026-05-27

All six methodology stages have run end-to-end against this initiative. Stage 6 deploy lives at **<https://methodology.ninochavez.co>** (Cloudflare Pages project `blueprint-methodology`, custom domain attached 2026-05-27; cert propagation may lag the first ~5 min after attachment).

| Stage | Artifact set | Status |
|---|---|---|
| 1 Research | `research/competitive/` + `research/current-state/` + `research/architecture/` | ratified pre-session |
| 1 Research (design-discovery) | `research/current-state/03-portal-surface-audit.md` + `research/architecture/02-stage1-design-audit-template.md` | seeded (this session) |
| 2 Prescription | `decisions/01-prescription.md` + ADR-0001 + ADR-0002 | ratified pre-session |
| 2 Design system | `decisions/02-design-system.md` (L0–L4 dictionary) | seeded; mechanical fact-check passes |
| 2 Brand | `decisions/03-brand-brief.md` (B1–B8) | ratified |
| 2 Voice | `decisions/04-voice-rules.md` (4-axis spine) | seeded |
| 3 Prototype | Pattern B portal at `portal/` — 11 surfaces, 4 themes, voice-audited prose | complete — `/prototype/` studio is a populated landing surface (audit-gap 7 closed structurally; iframe-stub framing in prior docs is stale) |
| 4 Fact-check | `research/current-state/04-stage4-fact-check.md` | seeded — mechanical-pass; judgment claims carry-forwarded to ratification gates |
| 5 Docs | `README.md` (this file) + `HANDOFF.md` | done |
| 6 Deploy | Cloudflare Pages → `methodology.ninochavez.co` | deployed 2026-05-27; post-deploy audit-fix wave landed same day (16 voice fixes + 8 CSS polish + citation manifest + cross-page nav + next/prev CTA + docs sidebar tier labels) |

## Stage 1 — Research (seeded + new design-discovery)

Five primary research artifacts plus two new ones from this session:

| File | What it covers |
|---|---|
| `competitive/01-lopopolo-harness-engineering.md` | OpenAI's "Harness engineering" piece. The methodology peer at the production-codebase layer; source of Blueprint's first principle. |
| `competitive/02-appleton-zero-alignment.md` | Maggie Appleton's "Zero Alignment" / Ace positioning. The alignment-layer pattern above Blueprint. |
| `competitive/03-adjacent-tools.md` | Backstage, Yeoman/CRA/Vite, Cookiecutter, Hygen/Plop, Shape Up, Linear/Jira, GitHub Spec Kit, Cursor/Claude Code. Where Blueprint fits and where it doesn't. |
| `current-state/01-ai-hive-as-companion.md` | How subs-initiative composes Blueprint + ai-hive at Tier 2; the four-layer stack (Ace / ai-hive / Blueprint / Lopopolo's harness). |
| `current-state/02-blueprint-production-quality-gaps.md` | Eight named gaps + each gap's named-pattern closure + the two prescription wedges they collapse into. |
| `current-state/03-portal-surface-audit.md` | **New.** L5 inventory of `portal/` — 11 surfaces, L0–L5 atomic-design coverage with ✓/✗ markers, 7 named audit-gaps. First proof-of-concept of the design-discovery sub-track. |
| `current-state/04-stage4-fact-check.md` | **New.** Methodology Stage 4 gate run mechanically against every ratified claim. 10/12 pass clean; 1 with documented exception; 1 deferred (audit-gap 7). |
| `architecture/01-hive-cli-vs-mcp-with-optionality.md` | Protocol-choice investigation for ai-hive; recommendation feeds the Blueprint distribution shape. |
| `architecture/02-stage1-design-audit-template.md` | **New.** Cross-audit reconciliation across this initiative's audit + rally-hq + blog audits. Three independent dogfoods converged on L4 absent finding. Proposes the canonical Stage 1 design-discovery audit template. |

## Stage 2 — Prescription, Design System, Brand, Voice

The original two-wedge prescription + ADRs (`decisions/01`, ADR-0001, ADR-0002) are ratified.

New Stage 2 outputs from this session, each with `decisions/0X` filenames:

- **`02-design-system.md`** — L0–L4 atomic-design dictionary for the portal. Closes audit-gaps 1/3/4/5/6 from the L5 inventory. L0 Class B brand decisions deferred to forge-brand; closure via `03-brand-brief.md`.
- **`03-brand-brief.md`** — B1–B8 brand decisions. B3 reframed mid-session from single-palette to multi-theme registry. All 8 closed.
- **`04-voice-rules.md`** — 4-axis voice spine extracted via operator-grilled session. Methodology-as-actor in 3rd-person abstract using role-names; grounded hedging; audience-tuned cadence.

## Stage 3 — Portal at `portal/`

11 named surfaces:

- 1 front door (`index.html`)
- 5 wedge pages (`pages/{gap-inventory, distribution-shape, reviewer-execution, ai-hive-companion, shipping-order}.html`)
- 1 docs viewer (`docs/index.html`) — manifest-driven sidebar + markdown render
- 1 prototype studio (`prototype/index.html`) — shell exists, iframes deferred (audit-gap 7)
- 3 chrome layers (proto-nav, proto-annotate, chat-widget — canonical Pattern B chrome)

Initiative-specific additions (not chrome):
- 4-theme registry in `project-tokens.css` ([data-theme="slate|coral|forest|minimal"])
- Runtime theme switcher at `theme-switcher.js`
- L4 wedge-page template reference at `templates/wedge-page.html`

The redesign portal **is** the production-quality reference deploy that closes Gap 3 (discoverability). Self-applying.

## Stage 4 — Fact-Check

Mechanical verification at `research/current-state/04-stage4-fact-check.md`. 10/12 ratified claims pass clean. Judgment claims (does prose actually read as Solution Architecture? is design system complete enough?) carry-forwarded to ratification gates because the self-author cannot honestly judge.

**Stage 4 surfaced its own methodology gap** (candidate amendment): solo initiatives can't satisfy the external-reviewer requirement. The degrade-path: mechanical verification + carry-forward judgment claims to ratification.

## Stage 5 — Docs (this file + `HANDOFF.md`)

This README is the consumer-facing summary. `HANDOFF.md` targets the methodology repo — every methodology-side change this dogfood requires, packaged for future wave commits.

## Stage 6 — Deploy (pending)

Cloudflare Pages deploy. Portal at `portal/` deploys via `portal/scripts/prep-deploy.sh` (canonical chrome script that syncs `_docs/` from manifest sources before deploy). Final URL: TBD (`blueprint.nino-chavez.dev` or similar).

## Methodology amendments surfaced this session

Six total amendments captured in `METHODOLOGY-AMENDMENTS.md`:

| Date | Amendment | Promotion status |
|---|---|---|
| 4× 2026-05-25 | Pattern B chrome fixes | Resolved methodology-side (waves 6–7) |
| 2026-05-26 | Stage 1 missing design-discovery sub-track | Captured; freeze-blocked |
| 2026-05-26 | Multi-theme registry as canonical Blueprint architecture | Captured; freeze-blocked |
| 2026-05-26 (candidate) | Stage 4 degrade-path for solo initiatives | In fact-check artifact; not yet amended |

## Companion: ai-hive

`hive.enabled: false` for now (solo). When a second operator joins, flip it true and bootstrap a hive instance per `~/Workspace/dev/wip/ai-hive/docs/BOOTSTRAP.md`. The CLI vs MCP investigation feeds back into ai-hive itself as a parallel architecture decision.

## Methodology freeze in effect

Per L8 (`~/Workspace/dev/wip/blueprint/template/CLAUDE.md` § "Methodology freeze during consumer migration"): while this initiative is in flight, **no edits to `~/Workspace/dev/wip/blueprint/template/`**. The six amendments above get promoted to methodology in wave commits after this initiative merges.
