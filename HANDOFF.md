# Methodology Promotion Handoff — blueprint-redesign

Every methodology-side change this dogfood discovered, packaged for the wave-commit promotion that runs after this initiative lands.

## Promotion gate

The methodology freeze rule (`~/Workspace/dev/wip/blueprint/template/CLAUDE.md` § "Methodology freeze during consumer migration") blocks methodology-side edits while this initiative is in flight. The reason: the 2026-05-25 four-way root-doc drift incident was caused by parallel methodology + consumer evolution; serializing them prevents the recurrence.

When this branch merges (or when the operator declares the freeze lifted), the changes below get promoted via methodology wave commits on `wip/blueprint/` main.

## Six amendments to promote

Each amendment lives at `METHODOLOGY-AMENDMENTS.md` § dated entry in this initiative. Order by methodology-impact:

### 1. Multi-theme registry as canonical Blueprint architecture (2026-05-26)

**Largest methodology change.** Reframes L0 brand decisions from per-consumer pickup to methodology-owned theme registry.

Methodology-side changes:
- **`shared.css`**: declare 4 themes (`slate | coral | forest | minimal`) as `[data-theme="X"]` blocks with `--brand-*` ramps + `--bg`/`--surface-{1,2}` overrides. WCAG AA contrast validated per theme.
- **`blueprint.yml` schema**: add `design.theme: slate | coral | forest | minimal | custom` field. Default = `slate`.
- **`stamp.mjs --pattern=B` substitution**: write `<html data-theme="{theme}">` into every Pattern B page at scaffold + restamp time.
- **`@blueprint/cli init`**: surface theme choice as one of the init questions (after variant + tier + pattern).
- **`forge-brand` role shift**: from "produce consumer brand" to "propose new theme for the registry." Adding a 5th theme is a methodology PR with `forge-brand` outputs.
- **`template/portal/theme-switcher.js`**: promote initiative-side `theme-switcher.js` to canonical chrome. Stakeholders see all theme options regardless of consumer's default.
- **`template/portal/PATTERN_B_CHROME_FILES`** in `stamp.mjs` line 46–55: add `theme-switcher.js` to the manifest.

Reference implementation: `portal/project-tokens.css` § L0 theme registry + `portal/theme-switcher.js` in this branch (commit `e26c98b`).

### 2. Stage 1 design-discovery sub-track (2026-05-26)

Stage 1's persona/funnel/evidence research does not produce surface inventory + component inventory + content-type taxonomy + auth-boundary map. Stage 2 design-system work has no L4/L5 anchor; agent fills void with templates.

Methodology-side changes:
- **`METHODOLOGY.md` § Stage 1**: add design-discovery sub-track to brownfield + greenfield variants. Required artifacts:
  - Brownfield: `surface-audit.md` + `component-audit.md` + `content-type-taxonomy.md` + `auth-boundary-map.md`
  - Greenfield: planned surface map covering the same fields ahead of build
- **`METHODOLOGY.md` § Stage 2**: declare L3 organism + L4 template dictionary as required outputs, derived deterministically from Stage 1 L5 audit.
- **`blueprint.yml` schema**: add `design:` block with sub-fields:
  - `brand_source: forge-brand | manual | imported`
  - `archetype_source: forge-site | custom`
  - `content_source: forge-signal | manual`
  - `surface_audit_required: true | false` (default true for brownfield, true for greenfield Tier 2+)
- **`forge-site` relocation**: move `~/Workspace/dev/tools/forge-site/` content into `~/Workspace/dev/wip/blueprint/template/methodology/design/` (archetypes/modules/playbook). Delete `tools/forge-site/` after the move — it is reference prose misfiled as a tool.
- **Diagnostic test codified**: "cluster of layout bugs on one page = L4 missing, not L1 wrong" lands in METHODOLOGY.md § "Stage 2 design system."

Reference: `research/current-state/03-portal-surface-audit.md` + `research/architecture/02-stage1-design-audit-template.md` in this branch.

### 3. Stage 4 degrade-path for solo initiatives (2026-05-26 candidate)

Stage 4's external-reviewer requirement is unimplementable for solo dogfoods. Methodology currently has no degrade-path.

Methodology-side change:
- **`METHODOLOGY.md` § Stage 4**: add solo-initiative degrade-path. "Stage 4 for solo initiatives degrades to mechanical verification of every ratified claim against repo state, with judgment claims carry-forwarded to ratification gates. Each ratifiable artifact's `status: ratified` requires a named reviewer; for solo dogfoods, the reviewer is the next consumer initiative that exercises the artifact."

Reference: `research/current-state/04-stage4-fact-check.md` § Methodology meta-finding.

### 4. Pattern B chrome fixes (4× 2026-05-25)

Already resolved methodology-side in waves 6–7. Consumer migrations remaining:

- `portal/_meta/index.json` `docs.tiers[].docs[]` schema migration (consumer adds `source` field; `prep-deploy.sh` re-syncs from canonical paths). **Partially done in this initiative** — `source` field present in current `_meta/index.json` but the 9 markdown duplicates in `portal/_docs/` haven't been deleted yet (the dogfood ships pre-migration shape for safety).
- Hand-edit `<title>` on `prototype/index.html` if methodology adopts Option 2 of the title-substitution amendment.
- Re-sync prose docs (`CONVENTIONS.md` + `proto-annotate.OWNER-SPEC.md` etc.) into consumer after next methodology pull.

## Six artifacts that promote to methodology reference set

Beyond the amendments, these artifacts from this initiative could land in methodology as canonical references:

| Artifact | Methodology destination | Purpose |
|---|---|---|
| `research/current-state/03-portal-surface-audit.md` | `template/methodology/design/EXAMPLE-surface-audit.md` | Canonical example of the design-discovery audit |
| `research/architecture/02-stage1-design-audit-template.md` | `template/methodology/design/audit-template.md` | The canonical Stage 1 design-discovery audit template (variant-aware) |
| `decisions/02-design-system.md` | `template/methodology/design/EXAMPLE-design-system.md` | Canonical example of Stage 2 design-system definition |
| `decisions/04-voice-rules.md` | `template/methodology/voice/EXAMPLE-voice-rules.md` | Canonical example of voice-rules artifact |
| `brand/blueprint-brand-kit.json` | `template/brand/blueprint-brand-kit.json` | Blueprint-the-product canonical brand kit (one of N) |
| `portal/theme-switcher.js` | `template/portal/theme-switcher.js` | Canonical chrome (per amendment #1) |

## Known carry-forward gaps

Things the dogfood discovered but didn't close because they require operator decisions or external review:

- **Audit-gap 7** — prototype studio empty. Real prototype iframes need authoring (e.g., mock `@blueprint/cli init`). Stage 3+ work.
- **`decisions/02-design-system.md`** + **`decisions/04-voice-rules.md`** sit at `status: seeded`. Promotion requires external reviewer (the next consumer initiative).
- **Visual verification of B5 surface theming** completed for `gap-inventory` only. Other 10 surfaces (front door, 4 other wedge pages, docs viewer, prototype studio, 3 chrome layers) not re-verified post-B5.
- **`forge-brand generate voice`** extension. Voice rules seeded but the anti-pattern corpus + worked examples extension via AI generators is operator-gated.
- **`@blueprint/cli` actual implementation**. Wedge 1's CLI is described in `decisions/01-prescription.md` + portrayed in `pages/distribution-shape.html`; no code exists. Out of this initiative's Tier 1 scope.
- **Reviewer plugin runtime**. Wedge 2's reviewers-as-executable-plugins, same shape — described + portrayed, not built.

## Next consumer initiative to exercise these outputs

Rally HQ is the natural next dogfood. The cross-audit reconciliation in `research/architecture/02-stage1-design-audit-template.md` cites Rally HQ's `blueprint/audits/page-system-audit-2026-05-26.md` as one of three convergent audits. Rally HQ consuming this initiative's Stage 1 audit template + Stage 2 design system + voice rules would be the external review the dogfood needs to promote seeded artifacts.

## Methodology-side wave commits expected

Estimating from the amendment list:

1. Wave 8 — design-discipline track Stage 1 + Stage 2 additions (amendment 2)
2. Wave 9 — multi-theme registry as canonical chrome (amendment 1)
3. Wave 10 — Stage 4 solo-initiative degrade-path + reference artifacts promotion (amendment 3 + the six reference artifacts)

Order matters: design-discipline (8) sets the L4/L5 vocabulary before multi-theme (9) lands as canonical chrome. Stage 4 degrade (10) covers both.

## References

- `METHODOLOGY-AMENDMENTS.md` — full amendment text
- `research/current-state/04-stage4-fact-check.md` — fact-check + Stage 4 meta-finding
- `decisions/01-04` — ratified + seeded Stage 2 outputs
- `~/Workspace/dev/wip/blueprint/template/CLAUDE.md` — methodology freeze rule
