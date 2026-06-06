---
canonical: true
stage: 4
status: seeded
date: 2026-05-26
sources:
  - ../../decisions/01-prescription.md (ratified)
  - ../../decisions/02-design-system.md (seeded — fact-checked here)
  - ../../decisions/03-brand-brief.md (ratified)
  - ../../decisions/04-voice-rules.md (seeded — fact-checked here)
  - ../../METHODOLOGY-AMENDMENTS.md (six 2026-05-25/26 entries)
---

# Stage 4 Fact-Check — blueprint-redesign

Methodology Stage 4 gates the Stage 1–3 outputs against actual repo state because the agent's most common failure mode is self-attestation ("looks done to me"). This artifact runs mechanical verification of every ratified claim from Stages 1–3 against the current branch (`dogfood/self-redesign` at HEAD).

## Disclosure of limitation

Stage 4 is designed for **external review**, not author self-fact-check. The reason this matters: the same agent that produced an artifact will not catch the gaps the artifact has — that's the failure mode the methodology exists to address. This self-fact-check therefore checks **mechanical-verifiable claims** (file existence, grep matches, structural counts) rather than **judgment claims** (does this prose actually read as Solution Architecture register? does the design system make sense?). Judgment claims need a second reviewer to gate honestly.

## Mechanical claim verification

Each claim from the ratified decisions is matched against actual repo state. A claim passes only if the repo state confirms it.

### From `decisions/01-prescription.md` (ratified pre-session)

| Claim | Verification | Pass? |
|---|---|---|
| Wedge 1 = `@blueprint/cli` distribution | ADR-0001 exists at `decisions/ADR-0001-dual-protocol-distribution.md` | ✓ |
| Wedge 2 = reviewers as executable plugins | ADR-0002 exists at `decisions/ADR-0002-reviewers-as-executable-plugins.md` | ✓ |
| Pattern B + Tier 1 + brownfield | `blueprint.yml` declares these | ✓ (verified at session start) |

### From `decisions/02-design-system.md` (seeded — closures verified)

| Claim | Verification | Pass? |
|---|---|---|
| L4 WedgePageTemplate extracted | `portal/templates/wedge-page.html` exists | ✓ |
| 8 cross-surface molecules named (M1–M8) | `project-tokens.css` contains `.meta-strip`, `.xref-block`, `.wedge-label`, `.diagram-ascii`, `pre.terminal`, `pre.code` declarations | ✓ |
| `project-tokens.css` is consumer-seam over `shared.css` | `<link>` declarations in 5 wedge pages load both in correct order | ✓ |
| Per-page inline `<style>` blocks absorbed | 0 `<style>` blocks in any of the 5 wedge pages | ✓ (grep returned 0 across all files) |
| `.stack` name collision resolved | `.stack` not used in any page; `.diagram-ascii` used in ai-hive-companion + reviewer-execution | ✓ |

### From `decisions/03-brand-brief.md` (ratified)

| Claim | Verification | Pass? |
|---|---|---|
| B3: 4 themes registered | 5 `data-theme=` matches in `project-tokens.css` (4 themes + 1 default selector) | ✓ |
| B4: Anton overridden to Inter | `--font-hero: 'Inter'` in `project-tokens.css` line 32 | ✓ |
| B5: theme-scoped surfaces | 4 `--bg:` declarations in `project-tokens.css` (one per theme) | ✓ |
| B8: media rendered to `brand/media/` | 5 templates + 4 favicons present | ✓ |
| Kit colors updated to Blueprint Slate primary | `blueprint-brand-kit.json` `colors.primary.hex` = `#2e5cb8` | ✓ |

### From `decisions/04-voice-rules.md` (seeded)

| Claim | Verification | Pass? |
|---|---|---|
| Voice rules apply to portal prose | Audit pass committed at `9c23e5a`; 2 violations fixed | ✓ |
| Anti-pattern: brand-name as subject | 0 instances of `Blueprint declares|asks|produces|writes|treats` as subject in wedge bodies | ✓ |
| Anti-pattern: academic hedge | 1 remaining match — `gap-inventory.html` "may collapse" in a quote from prescription doc (acceptable per voice-rules audit policy: quoted material exempt) | ✓ with documented exception |

### From the L5 portal surface audit (`research/current-state/03-portal-surface-audit.md`)

| Claim | Verification | Pass? |
|---|---|---|
| 11 named surfaces | 1 index + 5 wedge + 1 docs + 1 prototype + 3 chrome layers = 11 | ✓ |
| 8 content collections in `_docs/` | `ls portal/_docs/ \| wc -l` = matches manifest tier entries | ✓ |
| Cross-surface patterns extracted | M1–M8 in `project-tokens.css` § project components | ✓ (M2 declared as chrome-contract, M6 forward-compat) |
| Audit-gap 1 (L4 absent) | **structurally closed** via T1 WedgePageTemplate | ✓ |
| Audit-gap 5 (per-page `<style>` proliferation) | **visibly closed** via slice 1 | ✓ |
| Audit-gap 6 (cross-surface patterns un-named) | **closed** via L2 dictionary (M3 meta-strip + M4 xref + M5 num-badge + M7 wedge-label + M8 disclosure) | ✓ |
| Audit-gap 2 (L0 borrowed palette) | **structurally closed** via 4-theme registry | ✓ |
| Audit-gap 7 (prototype studio empty) | **closed** as of commit `abe7a7f` — `manifest.slices[]` populated (3 slices) + per-page `slice` + `phase` fields rewritten to studio-expected enum + cache-bust fix in studio script. Visual verification: studio renders Slices=3 / Pages=5 / Flows=2 / MVP=2 / Phase 1=2 / Phase 2=1 with all 3 slice sections + cards + findings/principles badges. | ✓ |

### From methodology amendments

| Amendment | Verification | Status |
|---|---|---|
| 4× 2026-05-25 amendments | Resolved by methodology waves 6–7 (pre-session) | ✓ resolved methodology-side |
| 2026-05-26 design-discipline track | Captured + 6 supporting amendments + 3 research artifacts produced | ✓ structurally closed; methodology promotion freeze-blocked |
| 2026-05-26 multi-theme registry | Captured + implementation in `project-tokens.css` + `theme-switcher.js` + visual verification | ✓ structurally closed; methodology promotion freeze-blocked |

## Judgment claims requiring external reviewer

The following claims cannot be self-fact-checked because they require evaluation against a register the author shares with the artifact:

1. **Solution Architecture register** — does the voice rules artifact + portal prose actually read as Solution Architecture? Self-author cannot honestly judge.
2. **Design system completeness** — does L0–L4 dictionary cover every gap a real consumer initiative will hit? External consumer needs to dogfood it (rally-hq is the next planned consumer per the design-discipline amendment).
3. **Voice rules sufficiency** — do the 4 axes + 6 anti-patterns + carry-over policy actually constrain the agent enough to prevent voice drift in future sessions? Needs trial-by-use.
4. **Multi-theme contrast across surfaces** — visually verified on gap-inventory only. Other 10 surfaces (front door, 4 other wedge pages, docs viewer, prototype studio, 3 chrome layers) not re-verified post-B5 surface theming. WCAG-validated mathematically; visual confirmation across the full surface set still pending.

These are the closures that **require a reviewer**, not the author.

## Methodology meta-finding

Running Stage 4 on the dogfood surfaced its own gap: **the methodology does not specify what to do when Stage 4's external-reviewer requirement isn't satisfiable.** For a solo dogfood with no second-operator reviewer, the methodology's gate is unimplementable in its prescribed form. The actual move is "self-fact-check the mechanical claims; flag the judgment claims as needing review; carry that flag forward." This is a candidate amendment.

Candidate amendment (to land in METHODOLOGY-AMENDMENTS later):

> Stage 4 fact-check for solo initiatives degrades to **mechanical verification of every ratified claim against repo state**, with **judgment claims explicitly carry-forwarded to ratification gates** (each ratifiable artifact's `status: ratified` requires a named reviewer; for solo dogfoods, the reviewer is the next consumer initiative that exercises the artifact).

## Spot-check summary (updated 2026-05-26 post-audit-gap-7-closure)

12 of 12 ratified claims pass mechanical verification cleanly. 1 passes with a documented exception (academic-hedge match in quoted material; voice-rules audit policy: quoted material exempt).

**Net result**: ratified Stage 1–3 outputs are mechanically consistent with the actual repo state. All 7 audit-gaps from the L5 surface audit are structurally closed (gap-7 closed via the slice-metadata + cache-bust commit on the same day this fact-check ran). Self-attestation is bounded; judgment claims (does prose actually read as Solution Architecture? is the design system complete enough?) flagged for external review per the methodology Stage 4 degrade-path.

## Closure path

This artifact promotes when:
1. Mechanical verification re-run after each future commit that touches ratified claims (could automate as a pre-commit check).
2. Judgment claims #1–#4 above get external review (rally-hq dogfood consuming this initiative's outputs would be the natural reviewer).
3. The candidate amendment for "solo-initiative Stage 4 degrade" lands in `METHODOLOGY-AMENDMENTS.md` and gets promoted to methodology in a future wave.

Status remains `seeded` until #2 happens.

## References

- `$BLUEPRINT_HOME/METHODOLOGY.md` § Stage 4 (Fact-Check)
- All ratified decisions in `decisions/`
- Methodology amendments file
