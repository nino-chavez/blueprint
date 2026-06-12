# Methodology amendments — Blueprint self-application

Append-only, reverse-chronological. Methodology learnings from applying Blueprint to itself (the in-repo self-application, folded from `blueprint-platform` in wave 45): gaps worked around, candidates for promotion into the methodology (`template/`). Convention: `template/docs/methodology/methodology-amendments-convention.md`.

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
