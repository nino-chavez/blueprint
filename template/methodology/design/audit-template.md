---
canonical: true
stage: 1
status: seeded
sources:
  - ../current-state/03-portal-surface-audit.md
  - ~/Workspace/dev/apps/rally-hq/blueprint/audits/page-system-audit-2026-05-26.md
  - ~/Workspace/dev/apps/blog/.worktree/pilot-decision-gate/blueprint/research/surface-audit-live.md
  - ../../METHODOLOGY-AMENDMENTS.md (2026-05-26 entry — design-discipline track)
related:
  - ../current-state/03-portal-surface-audit.md
---

# Cross-audit reconciliation — canonical Stage 1 design-discovery audit shape

## The question

The 2026-05-26 methodology amendment proposed a Stage 1 design-discovery sub-track that produces inventory-led artifacts (surface audit, component audit, content-type taxonomy, auth-boundary map) before Stage 2 design-system work begins. Three audits have been authored across three consumer initiatives independently:

- **`portal/` audit** (this initiative, `research/current-state/03-portal-surface-audit.md`) — Pattern B portal as a brownfield methodology dogfood. 11 surfaces, single-tier auth.
- **Rally HQ audit** (`apps/rally-hq/blueprint/audits/page-system-audit-2026-05-26.md`) — production SaaS app, brownfield. 95 routes, multi-tier auth (public / token-gated / authenticated).
- **Signal Dispatch blog audit** (`apps/blog/.worktree/pilot-decision-gate/blueprint/research/surface-audit-live.md`) — production publication, brownfield. 24 routes, 20 page types, three auth tiers, 8 content collections.

**Does the audit shape generalize across variants, and what is the canonical Stage 1 design-discovery template the methodology should promote?**

## Inputs: three audits compared

The reason this comparison matters is that one audit's shape might be project-specific accident. Three independent audits converging on the same sections is methodology signal; divergence reveals what's variant-conditional vs universal.

### Section-by-section mapping

| Section | Portal | Rally HQ | Blog | Universality |
|---|---|---|---|---|
| Surface inventory (L5) | §"L5 Surface inventory" | §1 "Page inventory by archetype" | §1 "Routes inventory" | **Universal** |
| Atomic-design level coverage (L0–L5 with ✓/✗) | L0–L5 sections | §3 + §5a layered diagram | Implicit in §2 components | **Universal** |
| Component inventory | L1–L3 sections | §3 (Atoms / Molecules / Organisms with ✓/✗) | §2 (Chrome / Reading aids / MDX / Presentations / Tutorials) | **Universal** |
| Content-type taxonomy | §"Content inventory" (manifests + docs) | None — app has no content collections | §3 (8 collections + bindings) | **Variant-conditional** (present iff content collections exist) |
| Auth-boundary map | §"Auth-boundary map" (single tier) | Implicit in §1 archetypes (C/E/G/I families = auth surfaces) | §4 (three tiers explicitly) | **Universal** (can be minimal for single-tier; can be folded into archetype inventory for app variants) |
| Cross-surface patterns | §"Cross-surface patterns" (8 candidates) | §3 ✗-marked entries + §4 first-principles | §5 (14 patterns, 8 candidates for extraction) | **Universal** |
| Per-archetype profile table | None | §2 (archetype × shell variant × hero × sections × nav × footer) | None | **Universal — gap in portal + blog audits** |
| Gap analysis | §"Named gaps" (7 gaps, leverage-ordered) | §4 (12 first-principles concerns) + summary of net gaps | §6 (surface gaps + chrome inconsistencies + duplicates + visual register) | **Universal** |
| Proposed system shape | Out of scope (deferred to Stage 2) | §5 (full layered system + 6 templates + organisms + spacing + state primitives) | §7 (implications for design system) | **Stage 2 work — should not live in Stage 1 audit** |
| Migration plan | Out of scope | §6 (9 phases, 25-35 hr) | §8 (next steps) | **Stage 3+ work — should not live in Stage 1 audit** |

### What every audit found independently

The atomic-design coverage finding is the load-bearing convergence:

| Level | Portal | Rally HQ | Blog |
|---|---|---|---|
| L0 (tokens) | Borrowed (Rally HQ defaults, `project-tokens.css` empty) | ✓ exists (`--color-*`, `--text-*`, `--space-*`) | ✓ exists (Tailwind + custom CSS vars) |
| L1 (atoms) | Partial (chrome utilities + per-page styles) | ✓ partial (buttons, badges; ✗ link variants, input primitives) | ✓ partial (chrome + reading aids) |
| L2 (molecules) | Implicit contracts (compare-toggle, meta-strip) | ✗ partial (form field implicit; nav item, breadcrumb, tab strip, empty/loading/error all ✗) | Partial (8 patterns un-extracted) |
| L3 (organisms) | Sparse (3 of 12 cross-surface; 9 one-offs) | ✗ partial (Header/Footer ✓ but inconsistent; Hero/Section/Card-stack/DataTable/Sidebar all ✗) | Partial (chrome + 3 MDX subsystems + presentations + tutorials) |
| **L4 (templates)** | **Absent** | **Absent — the largest gap** | **Absent (20 page types, no template dictionary)** |
| L5 (pages) | 11 surfaces, no audit before this exercise | 95+ surfaces, no audit before 2026-05-26 | 24 surfaces, no audit before 2026-05-26 |

Three independent audits arrived at the same finding: **L4 is entirely absent across all three initiatives.** This is the strongest validation of the methodology amendment's framing — it is not a project-specific accident.

## What generalizes (canonical audit sections)

Seven universal sections, each present in ≥2 of the three audits and applicable to all variants:

1. **Surface inventory** — every route classified by purpose. Format varies by variant (archetype families for apps; page-type families for publications; surface-type families for portals) but the work is the same: inventory every rendered route + its purpose + its content source.

2. **Atomic-design level coverage (L0–L5)** with ✓/✗/partial markers. Rally HQ's convention is the cleanest — explicit ✓ / ✗ / partial per primitive, scannable, deterministic. Portal audit used prose; blog audit used implicit lists. Promote Rally HQ's marker convention.

3. **Component inventory** — every UI primitive in use, classified by atomic-design level. Variant-specific categories (MDX primitives for publications; layout primitives for apps; chrome primitives for portals) but same shape: name + purpose + composition rules.

4. **Auth-boundary map** — public / token-gated / authenticated tiers. Universal even for single-tier portals (the minimal case is "all surfaces public; note any operator-only client-side affordances"). For app variants, this can be folded into the archetype inventory (Rally HQ subsumes it in §1).

5. **Cross-surface patterns** — patterns appearing on ≥2 surfaces that are not currently named primitives. All three audits found these; the count varies by variant (portal 8, Rally HQ 8 first-principles + several molecules, blog 8 candidates) but the section is structurally identical.

6. **Per-archetype profile table** — for each archetype/page-type family, declare: who reads it, primary job, shell variant, hero pattern, section structure, nav presence, footer presence. **This is the bridge from L5 inventory to L4 template extraction in Stage 2.** Rally HQ's §2 is the only audit that includes it. Portal + blog audits jumped from inventory to gaps without this intermediate step, weakening the bridge to Stage 2. Promote as canonical.

7. **Gap analysis** — named gaps ordered by leverage (closing each gap shortens the next). All three audits include this; structure is identical.

## What's variant-conditional

Two sections present in some audits but not others, conditional on initiative variant:

1. **Content-type taxonomy** — present iff the initiative has content collections (publications, methodology-as-product, CMS-backed apps). For function-led apps (Rally HQ tournament platform), there are no content collections and this section is absent. When present, it carries the rendering contract for each collection + cross-collection bindings (companion, challenges, series) that drive UI primitives.

2. **Cross-collection bindings** — sub-section under content-type taxonomy. Blog audit §3 names three bindings (`companionOf`, `challengesPost`, `series.slug`) that drive UI primitives the design system must name as components, not treat as one-off conditional logic. Portal has a structural analogue (manifest-driven `_meta` cross-references). Rally HQ has none.

## What does NOT belong in Stage 1 audit

Two sections that bled into Stage 1 audits in two of three cases but structurally belong elsewhere:

1. **Proposed system shape** (Rally HQ §5 + blog §7). This is Stage 2 design-system definition work. Including it in the Stage 1 audit collapses the inventory-led discipline back into the principles-derived discipline the amendment is meant to fix. The audit should END with "here are the named gaps the design system must close"; proposing the closure is the next artifact, not the same one.

2. **Migration plan** (Rally HQ §6 + blog §8). This is Stage 3+ implementation planning. It depends on the Stage 2 design system existing. Including it in Stage 1 forces premature implementation commitment.

Promoting the canonical template should explicitly cap the audit at "named gaps" and defer system proposal + migration to downstream artifacts.

## Proposed canonical Stage 1 design-discovery audit shape

Adopting the convergent findings + the Rally HQ archetype-profile bridge + the boundary cap:

```
# {Initiative} surface audit — Stage 1 design-discovery

## 1 · Surface inventory (L5)
[Every route, classified by purpose. Variant-aware framing: archetypes for apps,
 page-type families for publications, surface-type families for portals.]

## 2 · Atomic-design level coverage (L0–L5)
[Each level: ✓ exists / ✗ absent / partial. Scannable matrix or per-level subsection.]

## 3 · Component inventory (L1–L3)
[Every UI primitive in use, classified by atomic level. Variant-specific categories
 acceptable; each entry names purpose + composition rules + cross-surface usage.]

## 4 · Content-type taxonomy (variant-conditional)
[Present iff initiative has content collections. Each collection: count, frontmatter
 shape, rendering contract, cross-collection bindings.]

## 5 · Auth-boundary map
[Public / token-gated / authenticated tiers + the design treatment for each tier.
 Minimal for single-tier portals; foldable into archetype inventory for apps.]

## 6 · Cross-surface patterns (extraction candidates)
[Patterns appearing on ≥2 surfaces that are not currently named primitives.]

## 7 · Per-archetype profile table
[For each archetype: who reads, job, shell variant, hero pattern, section structure,
 nav presence, footer presence. Bridge to Stage 2 L4 template extraction.]

## 8 · Named gaps (leverage-ordered)
[Gaps the design system must close, ordered such that closing each shortens the next.]

## What this audit does NOT do
[Explicit non-goals: proposed system shape (Stage 2), migration plan (Stage 3+),
 brand identity, accessibility deep-audit, performance budgets.]
```

The non-goals section is load-bearing — it prevents the next operator from collapsing the audit back into principles-derived Stage 2 work.

## Validation of the methodology amendment

The cross-audit work tests three claims from the 2026-05-26 amendment against three independent consumer initiatives:

**Claim 1**: "Stage 1 should produce inventory-led artifacts before Stage 2 design-system work."
Validated. All three audits surfaced gaps invisible to principles-derived design dictionaries. The portal audit found L0 was borrowed (Rally HQ palette inherited via canonical chrome); Rally HQ found 12 first-principles concerns missing despite having tokens + R1–R10 principles; blog found 20 page types when prior sessions assumed 8.

**Claim 2**: "Bug cluster on one page = L4 missing, not L1 wrong."
Validated three times. Portal: 4 surfaces with proliferating inline `<style>` blocks. Rally HQ: 7 reactive CSS patches on `/pricing` before the audit revealed L4 absence. Blog: prior sessions kept rebuilding partial systems because the L4 template dictionary was missing.

**Claim 3**: "Tool integration declared, not absorbed; `forge-site` folds in because it is prose, not code."
Not directly testable from these audits (the audits surface the GAP; the amendment proposes the CLOSURE). But all three audits independently arrived at "L4 templates are the load-bearing gap," which is exactly the level `forge-site`'s archetypes already address. The convergence supports the amendment's framing that the capability exists in `forge-site` and the gap is integration/declaration.

## What this artifact does NOT do

- Does not propose the L4 template dictionary for any of the three initiatives (Stage 2 work, per the audit-boundary cap above).
- Does not commit the canonical template to the methodology repo (the methodology freeze rule applies; this artifact captures the framing; methodology wave promotion happens after this initiative lands).
- Does not audit a fourth or fifth consumer initiative. Three is convergent; more would strengthen but is not required for promotion. The next initiative that runs the audit shape will either confirm further or reveal an unhandled variant.

## Next moves

1. **For methodology promotion** (after this initiative lands): the canonical template shape above becomes `~/Workspace/dev/tools/blueprint/template/methodology/design/stage1-surface-audit-template.md`. Variant-conditional sections flagged with brownfield / greenfield + content-collection / no-collections branches.

2. **For this initiative**: Stage 2 design-system definition for the portal can now proceed deterministically — derive L4 templates from the portal audit's archetype profile (currently missing; needs to be backfilled into `research/current-state/03-portal-surface-audit.md` per the §7 promotion above), L0 tokens authored for Blueprint-the-product, L3 organism dictionary extracted from cross-surface patterns.

3. **For the amendment**: cite this cross-audit reconciliation as the framing validation when the amendment is promoted to methodology. Three independent audits arriving at the same L4-absent finding is the strongest possible evidence for the amendment's core claim.
