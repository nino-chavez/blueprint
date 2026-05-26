---
canonical: false
---

# Methodology Amendments — blueprint-redesign

This file captures methodology-level learnings specific to this initiative. Append at the top; supersede via new entry; never rewrite history. Full convention: `~/Workspace/dev/wip/blueprint/template/docs/methodology/methodology-amendments-convention.md`.

This initiative is unique: it IS Blueprint applied to itself. Every methodology gap surfaced here is a first-hand data point on the canonical methodology, since the same operator runs both repos sequentially per the methodology freeze rule.

---

<!-- Entries below, newest first. -->

## 2026-05-26 — L0 brand decisions should be multi-theme registry, not single-palette pickup

**Trigger**: During the L0 brand-work session on this initiative (commit `e26c98b`), the agent surfaced a fork-in-the-road question to the operator: which color family should Blueprint-the-product anchor on — slate, deeper coral, forest, or neutral-minimal? The agent expected a single-family pick. The operator's response was "make it a choice when using the blueprint. implement all four as options to apply." This reframed the entire L0 work from "pick one brand" to "implement a theme registry that consumer initiatives pick from at init time or runtime."

**Scope**: Candidate for methodology promotion (medium priority — closes a real architectural gap in how Blueprint thinks about brand at the methodology level)
**Status**: Structural closure proven in this initiative (`portal/project-tokens.css` § L0 theme registry + `portal/theme-switcher.js` + visual verification across all 4 themes). Methodology promotion deferred until this initiative lands per the freeze rule.

The reason this matters: the methodology amendment from earlier today (§ Stage 1 missing design-discovery sub-track) named tool integration ("integrate `forge-brand` via `blueprint.yml` config; don't absorb") but framed brand as a single-decision flow — `brand_source: forge-brand | manual | imported`. The multi-theme reframe is structurally different. Blueprint itself owns a theme REGISTRY; consumer initiatives select from it; `forge-brand` is the tool that proposes NEW theme additions to the registry, not a tool that produces a one-shot consumer brand.

This is a Layer 0 architectural decision Blueprint has been silently missing: methodology products serve multiple consumer initiatives with different brand register needs. Forcing every consumer to invoke `forge-brand` from scratch to produce its own palette reproduces the "agent fills void with templates" failure mode at scale (every consumer's first session would either invoke forge-brand for a one-off or, more likely, skip it and inherit canonical chrome defaults — which is what already happened across rally-hq, website-nc-v3, blog, and this initiative).

Multi-theme registry shape (validated in this initiative):

- **4 themes registered**: `slate` (cool methodology default, Linear/Vercel/Notion register), `coral` (warmth, signal-dispatch-adjacent but methodology-product), `forest` (craft-tool, Stripe-early register), `minimal` (type-led restraint, lethain shape).
- **Implementation**: `[data-theme="X"]` selectors in `project-tokens.css` overriding `--brand-*` ramps. WCAG AA contrast validated per theme.
- **Runtime selection**: query param + localStorage + switcher UI; switcher is initiative-side JS, NOT canonical chrome.
- **Brand-kit shape**: each theme has its own `brand-kit.json` (a `forge-brand`-compatible structure); consumer initiatives pick by reference, not by forking.

Candidate solutions for methodology promotion:

1. **Theme registry as canonical chrome + `blueprint.yml` schema extension** (recommended). Concretely:

   - **Canonical chrome `shared.css`**: declare the 4 themes' `--brand-*` overrides as `[data-theme="X"]` blocks. Themes ship with every Pattern B portal, byte-identical.
   - **`blueprint.yml` schema**: add `design.theme: slate | coral | forest | minimal | custom`. Default = `slate`. `custom` means consumer-overrides theme tokens locally in `project-tokens.css`.
   - **`stamp.mjs --pattern=B` substitution**: write `<html data-theme="{theme}">` into every Pattern B page at scaffold time + restamp time. The `prep-deploy.sh` build picks up the attribute via the manifest.
   - **`@blueprint/cli init`**: surface the theme choice as one of the init questions (after variant + tier + pattern). Show a one-line description of each theme; operator picks.
   - **`forge-brand` role**: shifts from "produce a consumer brand" to "propose a new theme for the registry." Adding a 5th theme is a methodology-level PR with `forge-brand` outputs; consumer initiatives don't fork brands ad-hoc.
   - **Runtime switcher**: methodology promotes `portal/theme-switcher.js` to canonical chrome (`shared.theme-switcher.js`) so every Pattern B portal gets the preview-switcher for free. Stakeholders see all theme options regardless of consumer's default pick.
   - **Operator override path**: if the 4 themes don't fit a consumer's brand needs (e.g., a brand client with mandated colors), the consumer sets `design.theme: custom` + writes their own `[data-theme="custom"]` block in `project-tokens.css`. `forge-brand export css --kit ...` outputs the right shape.

2. **Theme registry as initiative-only (this initiative's current state)**. Don't promote to methodology. Each consumer initiative either inherits canonical chrome defaults (Rally HQ palette) or writes its own theme registry. This is the path of least change but reproduces the failure mode for every new consumer.

3. **Hybrid — theme registry NOT in chrome but documented in methodology as an opt-in pattern**. Methodology ships a `template/portal/themes/` directory with the 4 theme `:root[data-theme]` blocks as a reference file; consumers can `@import` it from `project-tokens.css` if they want the multi-theme system, or ignore it. Lower-cost methodology change; consumer onboarding tax remains.

Option 1 is the recommended shape because it closes the L0 borrowed-palette failure at the methodology layer rather than the consumer layer. The reason it matters: every consumer initiative since the rally-hq dogfood started has inherited Rally HQ's Midnight & Copper palette via canonical chrome. The cross-audit reconciliation flagged this as the L0 layer of the design-discipline gap. Theme registry as canonical chrome closes this once for all future consumers.

**References**:
- This initiative's implementation: commit `e26c98b` (`portal/project-tokens.css` § L0 theme registry + `portal/theme-switcher.js`)
- Brand brief context: `decisions/03-brand-brief.md` § 2026-05-26 update — Multi-theme decision
- Related earlier amendment: `METHODOLOGY-AMENDMENTS.md` § 2026-05-26 — Stage 1 missing design-discovery sub-track (the broader design-discipline gap; this entry is a Layer-0 specific extension)
- `forge-brand` schema: `~/Workspace/dev/tools/forge-brand/presets/*.json` (existing presets are operator's other brands; methodology themes would live at `template/brand/themes/*.json` once promoted)
- Operator's verbatim reframe: "make it a choice when using the blueprint. implement all four as options to apply" (2026-05-26 session)

---

## 2026-05-26 — Stage 1 missing design-discovery sub-track; Stage 2 design-system work has no L4/L5 anchor

**Trigger**: Two independent dogfood sessions on consumer initiatives (Signal Dispatch blog redesign and Rally HQ public-surface redesign) converged within hours on the same methodology gap from different starting points. The blog session, after generating an 8-surface "page builder" derived from design principles, discovered on operator pushback that production actually carries 20 distinct page types across 24 routes (fiction, presentations, tutorials, research notes, tag taxonomy, drafts, private-share, logout — entire categories absent from the derivation). The Rally HQ session worked through seven reactive CSS patches before the operator pulled the camera back; the audit that followed identified L4 templates as entirely absent across 95 routes / 11 archetypes, with every page negotiating its own shell.

**Scope**: Candidate for methodology promotion (highest priority of any 2026-05-25/26 amendment because the failure mode is silent — it ships partial systems without the agent or operator noticing)
**Status**: Open

The reason this matters is that it's a categorical gap, not a scope gap. Blueprint's current shape was built for functional discipline (BRD → PRD → spec → implementation), where research is interview-led — personas, funnels, evidence catalogs, current-state diagnose. Design discipline is structurally different: it is **inventory-led**, not interview-led. Every Stage 2 design-system attempt across recent dogfood sessions has produced a partial system because the inventory Stage 1 should have produced never existed. The agent fills the void with shadcn defaults and theory-derived component dictionaries, the operator catches the gap on review, the session loops, and the cost compounds across initiatives.

**Atomic-design vocabulary makes the gap precise** (vocabulary borrowed from the 2026-05-26 Rally HQ session because it gives Blueprint a missing grammar — composition levels are orthogonal to workflow stages and Blueprint only declares the latter):

| Level | What it is | Blueprint coverage today | Canonical tool when integrated |
|---|---|---|---|
| L0 | Tokens (color, type, spacing) | Brand kit (Gap 11 closure) ✓ | `forge-brand` |
| L1 | Atoms | Partial (shadcn defaults; tool integration not declared) | `forge-brand` |
| L2 | Molecules | Ad-hoc, per-page | — |
| L3 | Organisms | None named | `forge-site` modules |
| L4 | Templates / page archetypes | **None — the load-bearing gap** | `forge-site` archetypes |
| L5 | Pages (instances + audit) | None required as Stage 1 artifact | Surface audit (manual / brownfield) |

L4 cannot be authored without L5 (you cannot name templates without auditing the surfaces they generalize). Brownfield audits L5 from production; greenfield plans L5 from the surface map. Either way, L5 is a required *input* to L4, and Blueprint's Stage 1 does not currently ask for it. This is the same failure mode as Gap 11 closure (agent fills void with templates because the required earlier-stage artifact does not exist) but at the structural/architecture layer rather than the brand layer.

**Diagnostic test that belongs in methodology prose** (from the Rally HQ session's process-gap analysis): when a cluster of layout or composition bugs surfaces on a single page in a single session, the signal is that L4 is missing, NOT that L1 is wrong. Patching at L1 when the missing primitive is at L4 produces a sequence where the bug "moves" — each fix shifts the symptom to a new surface rather than closing it — which is exactly the trajectory of the seven Rally HQ CSS patches before the audit.

**Tool integration question** (operator raised 2026-05-26): "Is this a gap in `forge-brand`/`forge-signal`, and should those tools fold into Blueprint instead of staying separate?"

Investigation finding: the capability mostly already exists. `forge-site` literally contains archetypes (L4) and modules (L3) as prose knowledge artifacts (no runtime — `~/Workspace/dev/tools/forge-site/playbook/*.md`, `archetypes/*.md`, `modules/*.md`). Agents in both dogfood sessions never reached for it because Blueprint methodology never declared the integration. The gap is integration/declaration, not capability — and not tool consolidation.

Folding `forge-brand` / `forge-signal` / `gen-images` into Blueprint would solve the wrong problem because each has use cases outside Blueprint initiatives (brand work that isn't an initiative; content generation against a finished brand kit; one-off social cards). Coupling their release cadence to Blueprint forces non-Blueprint consumers to pull a methodology repo for a brand kit generator. `forge-site` is the exception — it is prose, not code, and shares the shape of methodology documentation.

Candidate solutions for methodology promotion:

1. **Declare the design-discipline track in methodology with surface audit as a required Stage 1 artifact; integrate (not absorb) `forge-brand`/`forge-signal` via `blueprint.yml` config; fold `forge-site` prose into `blueprint/methodology/design/`**. Concretely:

   - **METHODOLOGY.md amendment**: add a design-discipline sub-track to Stage 1 that produces L5 artifacts. For brownfield: `surface-audit.md` (every route + purpose + auth state), `component-audit.md` (every UI primitive in use), `content-type-taxonomy.md` (every frontmatter shape + rendering contract), `auth-boundary-map.md` (public / token-gated / authenticated surfaces). For greenfield: planned surface map covering the same fields ahead of build.
   - **Stage 2 amendment**: declare L3 organism + L4 template dictionary as required artifacts derived deterministically from the L5 audit. Stage 2 design-system definition becomes "name what exists + close named gaps," not "derive from principles."
   - **`blueprint.yml` schema extension**: add a `design:` block declaring sources for each level — `brand_source: forge-brand | manual | imported`, `archetype_source: forge-site | custom`, `content_source: forge-signal | manual`, `surface_audit_required: true | false` (default true for brownfield variant, true for greenfield Tier 2+).
   - **forge-site relocation**: move `~/Workspace/dev/tools/forge-site/` content into `~/Workspace/dev/wip/blueprint/template/methodology/design/` (archetypes/modules/playbook). Delete `tools/forge-site/` after the move because it is reference prose, not a tool. The global CLAUDE.md description ("knowledge artifact, no runtime") confirms this is a methodology-side artifact misfiled as a tool.
   - **Diagnostic test in methodology prose**: codify the "bug cluster on one page = L4 missing, not L1 wrong" test in the brownfield variant guide and METHODOLOGY.md § "Stage 2 design system."

2. **Declare the design-discipline track as above but leave `forge-site` where it is**, with a methodology-side `INTEGRATIONS.md` page that points to `~/Workspace/dev/tools/forge-site/` as the canonical L3/L4 reference. Lower-cost migration; preserves the existing tool-directory convention; pays an ongoing discoverability tax (two paths to read).

3. **Methodology-side prose only — no tool integration declared.** Add the Stage 1 audit requirement and Stage 2 template-dictionary requirement, but leave operators to choose tools per initiative. Lowest-cost methodology change; highest-cost consumer onboarding (every initiative re-derives the toolchain).

Option 1 is the right shape because it closes the gap at both the artifact layer (required audits + template dictionary) AND the discoverability layer (config flags + folded forge-site prose). Option 2 is a viable incremental landing if the operator wants to defer the forge-site relocation pending validation that the L3/L4 reference is load-bearing. Option 3 is insufficient — it reproduces the same discoverability failure that produced this amendment in the first place.

**References**:
- Blog dogfood session producing `surface-audit-live.md` (2026-05-26): 20 page types, 25+ components, 8 content collections, 3 auth tiers
- Rally HQ dogfood session producing `audits/page-system-audit-2026-05-26.md`: 95 routes, 11 archetypes, 8 first-principles gaps, 9-phase migration plan
- Atomic design vocabulary: Brad Frost, *Atomic Design* (the L0-L5 framing this amendment adopts)
- forge-site canonical location (candidate for relocation under option 1): `~/Workspace/dev/tools/forge-site/`
- Global CLAUDE.md describing forge-site as "knowledge artifact, no runtime": `~/.claude/CLAUDE.md` § Tools table
- Related closure precedent (Gap 11, brand-anchor layer): the existing brand-kit requirement closed the same failure mode at L0; this amendment closes it at L3/L4/L5
- Methodology freeze rule: any wave-commit closing this amendment must wait for this initiative to land first per `~/Workspace/dev/wip/blueprint/template/CLAUDE.md` § "Methodology freeze during consumer migration"

---

## 2026-05-25 — Pattern B `prototype/index.html` title template collides when project name contains "Blueprint"

**Trigger**: The canonical template at `~/Workspace/dev/wip/blueprint/template/portal/prototype/index.html` line 7 declares `<title>Prototype Studio — PROJECT_NAME Blueprint</title>`. When `PROJECT_NAME` is substituted with this consumer's display name "Blueprint Redesign", the rendered title becomes "Prototype Studio — Blueprint Redesign Blueprint" — a visible duplication in the browser tab.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 2 (commit `3eb88be` in `wip/blueprint/`). Methodology chose amendment option 1 (drop trailing " Blueprint" suffix from `<title>` tags) instead of option 2 (substitution dedupe) because investigation showed `PROJECT_NAME` is not auto-substituted by `stamp.mjs` — it's a manual operator step per `portal/README.md`. The brand bar's runtime `deriveProductName` already strips " Blueprint" from the manifest `name` for display, so title-tag alignment is consistency, not regression. Pick up via `--mode=restamp-chrome` after next manual `<title>` pass.

For typical consumer names ("rally-hq", "subs-initiative", "website-nc-v3") the convention reads naturally: "Prototype Studio — rally-hq Blueprint". The template's substitution assumes consumer project names will not already contain the word "Blueprint" — an assumption this initiative is the first to violate, since it is Blueprint applied to itself.

`prototype/index.html` is NOT in `PATTERN_B_CHROME_FILES` (confirmed by reading `template/tools/blueprint-init/stamp.mjs` line 46–55) so the consumer can hand-edit the `<title>` without tripping the chrome-canonical reviewer. The hand-edit is the unblock; the methodology gap remains.

Candidate solutions for methodology promotion:

1. **Drop the trailing "Blueprint" suffix from the template**: change canonical to `<title>Prototype Studio — PROJECT_NAME</title>`. Cleaner across all consumers; loses the "this is a Blueprint deliverable" cue in the tab.
2. **Detect and dedupe in substitution**: extend `stamp.mjs` substitutions to check whether `PROJECT_NAME` ends with "Blueprint" (case-insensitive) and skip the suffix when it does. Preserves the cue for normal consumers; handles the dogfooding case automatically.

Option 2 is more general (also handles future "Foo Blueprint" or "Blueprint Studio" project names) and is invisible to consumers whose names don't trigger it. Recommend option 2.

**References**:
- Consumer-side fix in this commit: `portal/prototype/index.html` line 7
- Template source: `~/Workspace/dev/wip/blueprint/template/portal/prototype/index.html` line 7
- Chrome manifest (confirms `prototype/index.html` is consumer-owned): `template/tools/blueprint-init/stamp.mjs` line 46–55

---

## 2026-05-25 — Pattern B docs viewer requires markdown duplication into portal/_docs/

**Trigger**: Migrating blueprint-redesign from its custom path-index `docs/index.html` to the canonical sidebar viewer (wave 4 of the 2026-05-25 reconciliation) required copying 9 markdown files from canonical authoring paths (`decisions/`, `research/competitive/`, `research/current-state/`, `research/architecture/`) into `portal/_docs/` because the canonical viewer fetches `/_docs/<id>.md` directly with no path-mapping layer.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 4 (commit `b9ecc90` in `wip/blueprint/`) + ADR-0003. Methodology chose amendment option 1 (build step). `_meta/index.json` `docs.tiers[].docs[]` schema extended with optional `source` field; `template/portal/scripts/prep-deploy.sh` rewritten as manifest-driven (no more hardcoded Rally HQ SOURCES table). Consumer migration here: add `source` field to each of the 9 doc entries in this initiative's `_meta/index.json` pointing at the canonical authoring path, then delete the 9 duplicated copies from `portal/_docs/` and let `prep-deploy.sh` re-sync them.

The canonical viewer was just shipped (commit `86baf7c`) and has zero published consumers yet — blueprint-redesign is the first to consume it. The duplication cost is real:

- 9 markdown files now exist in two paths (canonical authoring path + `portal/_docs/<prefixed-id>.md`)
- Edits in one place don't propagate; the operator has to remember to sync
- Cloudflare Pages deploys only see `portal/_docs/` (parent paths are outside the Pages root), so symlinks fail at deploy

Candidate solutions for methodology promotion:

1. **Build step**: `scripts/sync-portal-docs.sh` that runs on Cloudflare Pages build, copies canonical paths → `portal/_docs/`. Single source authoring; rendered copy at deploy. Adds a build step to the "static HTML, zero build" Pattern B claim.
2. **Manifest path mapping**: extend `docs.tiers[].docs[]` entries with `{ id, title, source: "decisions/01-prescription.md" }`. Viewer reads `source` to resolve fetch URL when present. Requires the consumer's portal to deploy with the parent directory inside the deploy root.
3. **Author in `portal/_docs/` directly**: move docs FROM canonical paths INTO `portal/_docs/`. Breaks the canonical doc-discipline directory convention but gives the viewer a single source.

Option 1 is most aligned with how Pattern B consumers operate (rally-hq, subs-initiative both deploy from their portal root). Recommend the methodology surface this as an open ADR.

**References**:
- Migration commit (this initiative): TBD after commit lands
- Methodology canonical viewer: `~/Workspace/dev/wip/blueprint/template/portal/docs/index.html` line 691 (`fetch('/_docs/${docId}.md')`)
- Trigger conversation: dogfooding migration of blueprint-redesign to wave-4 methodology

---

## 2026-05-25 — Template's CONVENTIONS.md + OWNER-SPEC.md docs not audited in wave 4 storage-key rename

**Trigger**: After running `stamp.mjs --mode=restamp-chrome --pattern=B` on blueprint-redesign and pulling the latest `template/portal/CONVENTIONS.md`, `proto-annotate.OWNER-SPEC.md`, and `proto-nav.OWNER-SPEC.md` from the methodology repo, the docs STILL contain stale `rally-anno-enabled`, `rally-anno-notes-v1`, `rally-hq-blueprint-chrome-preview` storage-key references. The wave 4 audit updated the JS code paths (which the chrome restamp delivers byte-identical to consumers) but did not audit the prose documentation that ships alongside the chrome.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 3 (commit `68d85f9` in `wip/blueprint/`). Methodology chose amendment option 2 (fix this time, defer manifest extension to a future ADR if a third audit-miss occurs). 7 stale refs in `CONVENTIONS.md` + `proto-annotate.OWNER-SPEC.md` + `chat.OWNER-SPEC.md` migrated to `blueprint-*` namespace, audited against the JS source of truth. Pick up via next manual sync of these prose docs into this initiative's `portal/` directory (these files are consumer-owned copies, not chrome-canonical).

A consumer reading `CONVENTIONS.md` line 8 sees `localStorage.setItem('rally-anno-enabled','true')` and would integrate their tooling against the wrong key. The chrome-canonical-reviewer doesn't catch this because it only diffs `PATTERN_B_CHROME_FILES` (8 files) — the prose docs are not in the manifest.

Candidate solutions for methodology promotion:

1. **Extend PATTERN_B_CHROME_FILES with the prose docs**: add `CONVENTIONS.md`, `proto-annotate.OWNER-SPEC.md`, `proto-nav.OWNER-SPEC.md` to the chrome manifest. Restamp pulls latest; consumers can't drift these. Risk: consumers may want project-specific append-only sections; chrome manifest forbids edits.
2. **Re-audit the prose docs in the methodology repo and ship a fix commit** (the simpler, lower-risk move). Pair with a manifest extension only if a second drift incident occurs.

Recommend option 2 short-term; track option 1 as a future ADR if a third audit miss occurs.

**References**:
- Stale references confirmed: `grep "rally-anno-" template/portal/CONVENTIONS.md template/portal/proto-annotate.OWNER-SPEC.md`
- Wave 4 commit that should have caught this: `86baf7c`

---

## 2026-05-25 — Operating in the wrong directory on dogfooding work

**Trigger**: A session opened in `wip/blueprint/` (the methodology repo) to "continue the work on applying blueprint to itself" — and ran 4 substantive commits on the methodology repo before realizing the dogfooding consumer at `wip/blueprint-redesign/` was the intended target. The methodology-repo commits were independently legitimate (encoding waves 2–4 of the 2026-05-25 reconciliation), but the dogfooding exercise was paused for a full session by operator/agent confusion about which repo was which.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 1 (commit `0cc1f9b` in `wip/blueprint/`). Methodology chose amendment option 2 (per-repo CLAUDE.md opening-line convention). New `wip/blueprint/CLAUDE.md` declares "Repo role: I am the Blueprint methodology source"; `wip/blueprint/template/CLAUDE.md` opens with "Repo role: I am a Blueprint consumer initiative." Both include `pwd`-check guidance. This consumer's `CLAUDE.md` was already updated with the same convention at `a35a1e2` (the consumer-side patch that surfaced this amendment).

The mismatch is structural: methodology source (`wip/blueprint/`) and dogfooding consumer (`wip/blueprint-redesign/`) have similar-shaped names, both contain Blueprint artifacts, and both have legitimate parallel work streams. The methodology freeze rule (`template/CLAUDE.md` § 2) sequences them — but doesn't help the operator notice WHICH repo a session is supposed to operate in.

Candidate solutions for methodology promotion:

1. **SessionStart hook check**: when opening a session in a Blueprint-shaped repo, the hook should print the repo's role (methodology source vs consumer initiative) prominently. The existing `blueprint-session-start.py` hook walks up for `blueprint.yml` — extend it to ALSO detect whether `cwd` matches `wip/blueprint/` (methodology source) and print a distinct banner.
2. **Per-repo `.claude/CLAUDE.md` opening line**: methodology repo and consumer repo each declare "I am the methodology source / I am consumer initiative X" as the first sentence of their CLAUDE.md. The session opener can't miss it.

Recommend option 2 (no code, just convention). Option 1 is the harder encoding if option 2 fails.

**References**:
- This session's commits in the wrong-then-right directory: `wip/blueprint/` at `0731ccb`, `ecedef3`, `86baf7c`, `6d4a3d8` (all methodology-side, legitimate)
- The recovery: `wip/blueprint-redesign/` migration (this commit)
