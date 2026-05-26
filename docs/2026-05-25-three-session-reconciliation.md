---
canonical: true
---

# Three-Session Reconciliation — Blueprint Portal & Shell Intent

**Date**: 2026-05-25
**Trigger**: Nino observed drift across four Blueprint reference projects (`bc-subscriptions`, `apps/website-nc-v3`, `apps/rally-hq`, `apps/blog`) and asked three independent Claude Code sessions — running in different project repos — the same question: "step back and determine the goal and intent of blueprint and the portal and shell approach. then how do we make it consistent when blueprint is applied on any project or idea new or existing."

This doc captures where the three answers converged, where they diverged, and how they reconcile into the canonical reference at [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md).

## The three sessions

| Session | Source repo | Frame of reference | Strength |
|---|---|---|---|
| **Rally HQ session** | `apps/rally-hq` | Hot off vs-volleyballlife competitive walkthrough + pilot-profile correction | Failure-mode diagnosis from real work — pilot-profile drift, competitive-scope derivation, monetization gap, framing-vs-feature findings |
| **Blog session** | `apps/blog` (Signal Dispatch) | Mid-Stage-3 v1 rebuild after recognizing the 11-variant portal was workshop-shape, not deliverable-shape | Methodology depth — grounded in existing template invariants (I-2, I-3, I-5), voice modes, per-initiative port registry, variant × stage matrix |
| **Website-nc-v3 session** (this doc's author) | `apps/website-nc-v3` | Cross-repo audit of all four projects + extraction of bc-subs canonical packages | Saw the v1 → v2 portal jump bc-subs already made; defined the tier ladder; landed the IA contract |

## Where the three converged

All three sessions independently said:

1. **Blueprint is methodology**, not a product. It converts ambiguous initiatives into evidence-grounded artifacts that survive across sessions and agents.
2. **Reviewer agents are the right enforcement plane.** Self-attestation (the agent saying "looks done to me") is the most common failure mode; gates exist because that self-attestation, unchecked, ships incomplete work that stakeholders catch later instead of agents catching now.
3. **The portal is a stakeholder-facing surface**, not an internal scratch space. It's the front door over the artifact family.
4. **The shell must be canonical**, not copy-pasted. Each session reached for a different word for the same thing: "shared chrome" (Rally HQ), "_shell.css + _providers.js" (Blog), "`@blueprint/ui` + `@blueprint/design-tokens`" (website-nc-v3).

## Where the three diverged — and the reconciliation

### Divergence 1: Portal shell shape

**Rally HQ session**: portal is "walkable static surfaces stakeholders can review without the agent in the loop." Implied static-HTML shape.

**Blog session**: portal is "a static-HTML container served on a per-initiative port (8765 = Rally HQ, 8766 = website-nc-v3, 8767 = blog)... zero deploy dependencies, runs on python3 -m http.server, and Cloudflare Pages can ship it to a preview URL in one push." Explicitly static-HTML.

**Website-nc-v3 session**: portal is "an Astro 5 + React 19 + Tailwind 3 app consuming `@blueprint/ui` + `@blueprint/design-tokens` as workspace packages." Explicitly NOT static-HTML.

**The reconciliation**: tier ladder. Both shapes are correct, at different tiers.

- **Tier 0** — `blueprint/prototype/` is the static-HTML scratch surface for design-principles deliberation. The blog session's "one confident preview, not a deliberation venue" rule applies here.
- **Tier 1** — `apps/portal/` is the Astro app consuming workspace packages. This is the stakeholder front door. The IA contract (six verbs + audience switcher) governs.
- **Tier 2** — `apps/portal/` + `apps/<product>/` monorepo. The portal stays as the navigable spine; product surfaces ship behind it.

`bc-subscriptions` is at Tier 2. The Rally HQ and Blog sessions were proposing improvements to Tier 0 without realizing Tier 1 had already been built and shipped. Both sets of improvements remain valid — they apply to Tier 0 surfaces, where variant-walking design-principles deliberation correctly belongs.

### Divergence 2: What gets lifted into the template

**Rally HQ session** proposed: lift `prototype/_meta/*.json` schema, drawer pattern, destination taxonomy, state-derive catalog into `template/prototype/`.

**Blog session** proposed: lift `prototype/PORTAL.md` template with "one confident preview, not a deliberation venue" rule into `template/prototype/`.

**Website-nc-v3 session** did: extract bc-subs' `apps/portal/`, `packages/ui/`, `packages/design-tokens/` into `template/apps/portal/`, `template/packages/ui/`, `template/packages/design-tokens/` with `@blueprint/*` rename.

**The reconciliation**: both lifts land, at different layers.

- Tier 0 layer (`template/prototype/`) gets Rally HQ's `_meta/*.json` schema lift and Blog's `prototype/PORTAL.md` "confident preview" rule.
- Tier 1 layer (`template/apps/portal/` + `template/packages/`) gets the bc-subs canonical extraction.

The v1 static shell that all three sessions had different opinions about is now archived at `template/_archive/portal-v1-static/` — not deleted (historical record), not promoted (it's the wrong tier for stakeholder-facing work).

### Divergence 3: Failure modes named

**Rally HQ session** named: pilot-profile drift, competitive-scope-not-derived-from-pilot, framing-level findings not tested against pilot, missing monetization axis, scattered methodology amendments.

**Blog session** named: agent self-attestation (sharp, diagnosable); workshop-shape Stage 3 drift (variant-walking that should be a confident preview).

**Website-nc-v3 session** named: shell drift across four projects from different generations of a copy-paste template; the absence of a graduation contract between tiers.

**The reconciliation**: these are different failure modes at different stages. Rally HQ's are Stage 1 → Stage 2 gates (research → prescription). Blog's is Stage 2 → Stage 3 gate (design-principles → prototype). Website-nc-v3's is Tier 0 → Tier 1 gate (prototype → portal). All three land as separate reviewer agents:

- `pilot-profile-lock-reviewer` (Stage 0 → 1, Rally HQ session writes)
- `competitive-completeness-reviewer` (Stage 1 → 2, Rally HQ session writes)
- `prescription-completeness-reviewer` extended with monetization (Rally HQ session writes)
- Existing `design-principles-reviewer` extended with "not a deliberation venue" rule for greenfield Stage 3 (Blog session writes)
- `portal-shell-conformance-reviewer` (Tier 0 → 1, this session wrote — landed at `template/.claude/agents/blueprint/reviewers/portal-shell-conformance-reviewer.md`)

## What each session got that the others missed

### Rally HQ session caught

- **Pilot-profile lock as a first-class gate.** No other session named this. The vs-volleyballlife → Let's Pepper drift is a real failure mode that re-runs the moment a Blueprint initiative has more than one possible pilot.
- **Monetization as a persona × stage dimension.** Three-sided monetization (player / coach / organizer) caught in a real walkthrough.
- **Framing-level findings need pilot-anchoring.** "Multi-sport is a moat" is a framing claim that drifted from pilot truth. Feature-level findings wouldn't have.

### Blog session caught

- **"Self-attestation" as the named failure mode that gates protect against.** Sharper than generic "drift" or "agent struggle."
- **The portal is not a deliberation venue.** Normative rule with directly observable consequences.
- **Existing invariants** (I-2 `_meta/{id}.json`, I-3 `_providers.js`, I-5 CSS coverage) are real and the template already has them. Tier 1 portals need v2 equivalents, not replacement.
- **Per-initiative port registry** for concurrent comparison across initiatives.
- **Voice modes as a consistency plane** declared in frontmatter, enforced by reviewers.

### Website-nc-v3 session caught

- **bc-subscriptions already built the next-generation shell** (`apps/portal/` Astro + `@bc-subscriptions/ui` + `@bc-subscriptions/design-tokens`) — neither other session knew this.
- **The tier ladder concept.** Tier 0 (Idea / scratch) vs Tier 1 (Portal app) vs Tier 2 (Production + portal). Both other sessions were operating exclusively in Tier 0.
- **The IA contract** (Discover · Try · Build · Operate · Inspect · Roadmap + executive/discovery/internal audience switcher). Codified in `docs/portal-and-tier-ladder.md`.
- **Workspace packages as the consistency mechanism.** Not copy sources — actual npm/pnpm workspace dependencies. Fixes the drift root cause technically.

## Combined execution plan (across all three sessions' work)

Five template additions, ordered by dependency:

1. **Tier 1 canonical extraction** (done — this session). `template/apps/portal/` + `template/packages/ui/` + `template/packages/design-tokens/` lifted from bc-subs.
2. **`portal-shell-conformance-reviewer`** (done — this session). Tier 0 → 1 gate.
3. **`pilot-profile-lock-reviewer` + `pilot_profile` required field in `blueprint.yml`** (Rally HQ session's responsibility). Stage 0 → 1 gate.
4. **`template/prototype/PORTAL.md`** with the "one confident preview, not a deliberation venue" rule, enforced via extended `design-principles-reviewer` (Blog session's responsibility). Stage 2 → 3 gate.
5. **`prescription-completeness-reviewer` extended with monetization check + `personas-template.md` with monetization column + `METHODOLOGY-AMENDMENTS.md` append-only convention** (Rally HQ session's responsibility). Stage 2 → 3 and ongoing.

After all five land, the next Blueprint initiative scaffolds straight to Tier 1 with mechanically-enforced contracts at every stage gate. The drift that triggered this exercise becomes structurally impossible.

## The single alignment all three sessions must hold

**v1 static shell is retired, not promoted.** The v1 invariants (I-2, I-3, I-5) transfer to v2 equivalents in `apps/portal/`. The static-HTML shape lives on as Tier 0 design-principles scratch only. Stakeholder-facing portals are Tier 1+ and consume the workspace packages.

If Rally HQ lifts v1 conventions into `template/prototype/_meta/_schema.json` and Blog session's portal stays at v1 ports without graduating, the three sessions re-diverge — the very drift this exercise was supposed to fix. The reconciliation is: Tier 0 surfaces keep v1 conventions where they apply to design-principles work; Tier 1 surfaces consume `@blueprint/ui` + `@blueprint/design-tokens` as workspace packages.

## What this doc replaces

Nothing yet — this is the first reconciliation across the three sessions. Future sessions resuming any of the five execution-plan items above should read this doc first to avoid re-litigating the convergence.

## Correction — added 2026-05-25 evening

The reconciliation above (drafted earlier the same day) collapsed both portal patterns into a single tier ladder over Pattern A (the bc-subs Astro shape). That was wrong.

**What I missed:** ADR-0008 in `apps/website-nc-v3/blueprint/portal/_docs/` — accepted 2026-05-25, hours before this reconciliation was drafted — explicitly names the static-HTML `portal/` shell as canonical for non-BC projects, citing rally-hq's `blueprint.rallyhq.app` as the reference deploy. The ADR rejects the React/BigDesign `prototype/` shell as BC-specific and the bc-subs "deliverables-index" pattern as insufficient (lacks strategy drawers, current-state, comparison toggle, chat).

The static-HTML shell is not a deprecated v1. It is **Pattern B** — the redesign-review portal, with its own canonical primitives (strategy drawer + current-state drawer + PROPOSED/COMPARE/SHIPPED toggle + AI chat FAB + I-2/I-3/I-5 invariants).

The bc-subs Astro shell is **Pattern A** — the platform-portal, with its own canonical primitives (6-verb IA + audience switcher + LaneCard + StatusBadge + LiveIframe).

**Both are canonical.** They are two patterns for two distinct audience-and-artifact shapes, not two generations of one shape.

### What each session's answer was correct about

- **Rally HQ session** — proposing improvements to Pattern B (the rally-hq portal IS Pattern B; vs-volleyballlife walkthrough was a Pattern B per-page review). The pilot-profile lock, competitive-scope-from-pilot, monetization axis, framing-vs-feature gates are all Pattern B-applicable methodology gates.
- **Blog session** — describing Pattern B accurately ("static HTML container on a per-initiative port", "_shell.css + _providers.js + _meta/<page-id>.json"). The "not a deliberation venue" rule applies to both A and B but was diagnosed against a Pattern B failure.
- **This session** — describing Pattern A accurately (Astro + workspace packages + 6-verb IA + audience switcher). But I conflated this as "the canonical" rather than "one of two canonicals."

### The corrected synthesis

- `template/portal/` is the canonical Pattern B template (restored from premature archival)
- `template/apps/portal/` is the canonical Pattern A template (extracted from bc-subs)
- `template/packages/` is the Pattern A component-kit + design tokens
- Pattern B does NOT consume workspace packages; it consumes the static-HTML shell by copy-stamp (zero-build is intentional)
- The tier ladder applies independently to each pattern
- `docs/portal-and-tier-ladder.md` has been rewritten to reflect this

### What this means for execution

- The Pattern A reviewer (`portal-shell-conformance-reviewer.md`) needs to be renamed to clarify scope (e.g., `portal-pattern-a-conformance-reviewer.md`) and a parallel Pattern B reviewer added.
- The migration recipe is now: determine the pattern by use case → audit against that pattern's canonical → fix only what diverges. Cross-pattern migration (B → A or A → B) is a real decision but rare and requires an ADR.
- The four reference projects fall into clearer rows:
  - `bc-subscriptions`: Pattern A, Tier 2, canonical
  - `apps/website-nc-v3`: Pattern B, Tier 2 in flight, conformant (per ADR-0008)
  - `apps/rally-hq`: Pattern B, Tier 2, path-drifted (`blueprint/prototype/` should be `blueprint/portal/`)
  - `apps/blog`: Pattern B, Tier 1, on the older v1 shell (`_providers.js` + `_shell.css`); upgrading to v2 Pattern B chrome OR graduating past the portal entirely

### Apology to the other two sessions

The earlier reconciliation framed the other two sessions as "operating from the v1 worldview" and proposing improvements "within that worldview." That framing was condescending and wrong. They were operating from the correct Pattern B worldview that ADR-0008 had just ratified. The drift I diagnosed was not "they're behind on the v2 jump"; it was "the template never named the two patterns explicitly, so each project made an implicit choice."

The fix is the explicit naming in `docs/portal-and-tier-ladder.md`. The other two sessions' Pattern B work proceeds as they proposed.

## Open follow-ups

- ~~**Tier mapping for variants.** Greenfield + midstream + brownfield each potentially land at different default tiers. Greenfield → Tier 1 (or Tier 2 if a real product surface exists from day one); midstream → Tier 2 (the product exists); brownfield → Tier 1 by default but Tier 0 is permitted for doc-only audits. Tracked as ADR-required if an initiative diverges.~~ **Resolved 2026-05-25.** Variant × Tier matrix codified in `docs/portal-and-tier-ladder.md` § "Variant × Tier matrix" (with bolded default cells) and mirrored mechanically in `template/tools/blueprint-init/stamp.mjs` `VARIANT_TIER_MATRIX`. Wrong variant + tier combinations fail the stamp.
- ~~**Variant pill naming.** bc-subscriptions uses `executive / discovery / internal`. "Internal" is overloaded (internal to what?). ADR candidate to rename `internal` → `engineering` or keep as-is.~~ **Resolved 2026-05-25** via [ADR-0001](decisions/0001-audience-pill-naming.md). All three pills renamed to role-based labels: `executive / evaluator / engineering`. Default audience: `evaluator`. Storage-key prefix cleanup deferred to ADR-0002.
- **Stack flexibility.** Canonical is Astro + React. SvelteKit and Next variants would need `@blueprint/ui-svelte` and `@blueprint/ui-next` parallel packages — tracked as future ADR. Deferred until a second Pattern A initiative on a non-React stack lands.
- ~~**Voice modes per route.** Discover = executive-advisory voice; Build = solution-architecture; Inspect = methodology/evidence-led. Worth codifying per-route voice modes in `docs/portal-and-tier-ladder.md` once the Blog session's voice-mode-frontmatter convention lands.~~ **Resolved 2026-05-25 evening.** Per-route voice modes codified in `docs/portal-and-tier-ladder.md` § "Voice mode per route (mandatory)". Enforced by `terminology-linter` + `doc-quality-auditor` at Stage 5 → 6. Per-page `voice_mode:` frontmatter override available for the rare cross-mode page.

## Encoding waves landed since reconciliation

- **2026-05-25 morning**: items 1-2 (Tier 1 canonical extraction, portal-pattern-A/B conformance reviewers).
- **2026-05-25 evening, wave 1**: items 3-5 (pilot-profile-lock-reviewer + pilot_profile schema; confident-preview-rule + extended design-principles-reviewer; prescription-evidence-reviewer monetization extension + personas-template + METHODOLOGY-AMENDMENTS convention).
- **2026-05-25 evening, wave 2**: three v3 consumer-bug encodings folded in (chrome canonical drift → shared.css split + restamp-chrome mode + portal-chrome-canonical-reviewer; docs viewer Rally HQ leak → manifest-driven sidebar + manifest-aware brand bar + docs/index.html added to chrome manifest; chat-widget.js Rally HQ string excised + added to chrome manifest).
- **2026-05-25 evening, wave 3**: open follow-ups closed (variant × tier matrix codified; voice modes per route codified).
- **2026-05-25 evening, wave 4**: Pattern B chrome storage-key + identifier audit. Applied ADR-0002 convention (`blueprint-` prefix) to `template/portal/index.html`, `proto-nav.js`, `proto-annotate.js`. Footer + chat.js OpenRouter attribution made manifest-driven. ADR-0002 addendum records the parallel rename. After this wave, `grep -rE 'rally|nino|chavez|bc-subscription' template/portal/` returns only documentation and historical-comment references in code-path files.
