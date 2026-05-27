---
status: audit-findings
companion-to:
  - 2026-05-27-loom-inspiration-candidates.md
  - 2026-05-27-loom-market-comparison.md
---

# Extended Consumer Audit Findings — 2026-05-27

**Date**: 2026-05-27

**Trigger**: After the initial rally-hq + subs-initiative audit promoted C1 (wave 25), C2 (wave 24), and C3 (wave 26), an extended audit covered two additional local consumers (blueprint-redesign + blog) to (a) close C5 if a second/third signal exists, (b) confirm or refute C4's defer verdict, (c) surface novel candidates not anticipated by the original Loom-inspired five.

**Status**: Research artifact. Drives waves 27 (C4) and 28 (C5). Lists 7 deferred-but-noted patterns as candidates for future audits.

## Audit scope

Four consumer initiatives in the canonical "live consumers" list:

| Consumer | Local | Audited |
|---|---|---|
| `apps/rally-hq` | yes | yes (initial 2026-05-27 audit) |
| `wip/subs-initiative` | yes | yes (initial 2026-05-27 audit) |
| `wip/blueprint-redesign` | yes | **yes (this audit)** |
| `apps/blog` | yes | **yes (this audit)** |
| `apps/website-nc-v3` | no (not on local disk) | skipped |
| `wip/promo-initiative` | no (not on local disk) | skipped |

## Consolidated cross-consumer evidence matrix

| Candidate | rally-hq | subs-initiative | blueprint-redesign | blog | Verdict shift |
|---|---|---|---|---|---|
| **C1** Operator-handoff | HANDOFF-blueprint-template-gaps.md | HANDOFF.md | (consumed by wave 1) | none | **Promoted wave 25** |
| **C2** Drift-report generative | wave 22 sweep + audit-chrome | `tools/state-derive/` | (no production drift surface yet) | (no production drift surface yet) | **Promoted wave 24** |
| **C3** Onboarding digests | 738-line burden | 48 lines (no friction) | (none observed) | (none observed) | **Promoted wave 26** |
| **C4** Amendment classification | 4 amendments | none | **6 amendments + 10+ forecast + manual bucketing** | 2 informal | **Promote-ready (wave 27)** |
| **C5** Multi-operator collab | worktree-isolation `0c074d5` | none | **wrong-directory + peer-canonical-contamination** | **multi-session pilot + anti-workaround success criterion** | **Promote-ready 3+ consumers (wave 28)** |

## C4 promotion evidence (wave 27)

`/Users/nino/Workspace/dev/wip/blueprint-redesign/WAVE-2-BACKLOG.md:76` (operator writing in their own backlog):

> Wave-N amendment-promotion ordering — six amendments shipped as 6 waves in this session. Future iterations may surface 10+ amendments; methodology might need a triage convention (which amendments are MVP vs deferred?).

Plus `METHODOLOGY-AMENDMENTS.md:48` (manual bucketing already in practice):

> Wave 14 = audit-chrome + portal.dir (RH §1). Wave 15 = chrome divergence classification (RH §1 gap 3). Wave 16 = brand_axes (RH §3). Wave 14 is the highest-priority load-bearing change (silent destruction risk against 4 consumers).

The operator is hand-bucketing impact, priority, and wave-grouping. The forecast of "10+ amendments per cycle" is the volume threshold the candidates doc named as the C4-defer-no-longer-holds condition.

## C5 promotion evidence (wave 28)

Three consumers across three distinct sub-patterns:

1. **rally-hq — commit-attribution loss** (`METHODOLOGY-AMENDMENTS.md` worktree-isolation entry): commit `0c074d5` was labeled "P20-only" but bundled P14a+P14b changes from a sibling worktree. Per-agent attribution lost forever in git log.

2. **blueprint-redesign — wrong-directory + peer-canonical-contamination**:
   - `METHODOLOGY-AMENDMENTS.md:243` — "Operating in the wrong directory on dogfooding work" amendment; parallel-session confusion between `wip/blueprint` and `wip/blueprint-redesign`
   - `portal/CONVENTIONS.md:210` — website-nc-v3 incident where consumer truncated 268 lines from `shared.css` mid-edit, then restored by `curl`-ing from a peer consumer's deploy → promoted peer's project-specific drift into "canonical" position

3. **blog — multi-session pilot + anti-workaround success criterion** (`.blueprint/AGENTS.md:38`):
   > Pilot success criteria #3: No workaround emerges (agent doesn't reorder commits to land legal pieces while drifting; operator doesn't disable the hook).

Three distinct failure modes (attribution-loss / wrong-directory / parallel-work-coordination) across three consumers. The candidates doc's "1 strong consumer" threshold is exceeded; promotion justified.

## NEW patterns surfaced (7 deferred-but-noted)

The 5 original Loom-inspired candidates were a single-source enumeration. The extended audit surfaced 7 patterns not anticipated by that frame. Most have single-consumer evidence; defer until cross-consumer signal accumulates.

### Pattern N1 — Executable-enforcement harness lint at commit boundary

**Source**: `apps/blog/.worktree/pilot-decision-gate/.blueprint/lints/prescription-acceptance.lint.mjs` blocks Stage 3+ commits when prescription decisions are `status: provisional`.

**Pattern source declared**: *"Lopopolo, 'Harness engineering: leveraging Codex in an agent-first world' (OpenAI, 2026-02-11). Specifically the 'promote rule to code with remediation instructions injected into the error message' pattern."*

**Why it matters**: sits alongside wave 19's grep-reviewer pattern but moves enforcement from agent-prompt to git-hook. Higher reliability (mechanical, not LLM-mediated). Blog is explicitly designing for cross-consumer portability (generic `bets:` schema).

**Promotion bar**: ≥1 other consumer adopts the Lopopolo-style lint pattern. Blog's pilot success criteria include "no workaround emerges" — when that pilot closes successfully, wave-promotion candidate becomes ready.

### Pattern N2 — Wave-cadence + trigger-conditions canonicalization

**Source**: `wip/blueprint-redesign/WAVE-2-BACKLOG.md:34-46` (operator-invented Wave-N convention with formal trigger-conditions table that methodology never declared).

**Why it matters**: the dogfood invented a methodology-side discipline organically (wave 2 backlog with trigger conditions for what advances a wave). Methodology currently has wave-log convention but no formal cadence rule or trigger-condition framing.

**Promotion bar**: ≥1 other consumer adopts the wave-N-backlog shape. blueprint-redesign is the only consumer running its own "blueprint applied to itself" wave cadence; rally-hq + subs-initiative use the methodology's wave log directly.

### Pattern N3 — External-reviewer routing protocol

**Source**: `wip/blueprint-redesign/WAVE-2-BACKLOG.md:75`:
> External-reviewer assignment mechanism — Stage 4 degrade-path says "next consumer initiative is the natural reviewer." But which consumer becomes the reviewer for THIS dogfood's seeded artifacts? Needs an explicit hand-off (does rally-hq commit to reviewing on its next session, or does this happen passively?).

**Why it matters**: wave 7 promoted Stage 4 solo degrade-path but the assignment mechanism is unimplemented. Observable friction: rally-hq did pick up the reviewer role but only because operator manually routed.

**Promotion bar**: ≥1 documented assignment-failure case (consumer should have reviewed but didn't because no formal routing). Defer until a missed-review incident accrues.

### Pattern N4 — `restore-canonical` command

**Source**: `wip/blueprint-redesign/portal/CONVENTIONS.md:210,250` documenting the website-nc-v3 peer-fetch contamination.

**Why it matters**: pairs with `audit-chrome`/`restamp-chrome` (waves 14-15) to prevent peer-fetch contamination as a recovery path. Today consumers `curl` siblings; the methodology has no canonical-restore command.

**Promotion bar**: ≥1 other consumer hits the same peer-fetch recovery path. Today only website-nc-v3 documented (and that consumer isn't local for verification).

### Pattern N5 — Cross-audit corpus registry

**Source**: `wip/blueprint-redesign/WAVE-2-BACKLOG.md:77`:
> Cross-consumer audit convergence — wave 1's cross-audit reconciliation used 3 dogfoods to validate the design-discipline framing. Wave 2+ could keep adding to the cross-audit corpus; methodology may want a registry of "audits that informed amendment X."

**Why it matters**: amendments today cite consumer audits free-form. No canonical registry shape.

**Promotion bar**: ≥2 amendments cite audits that should be findable via a registry but aren't. Currently amendments self-cite paths inline; the friction is low.

### Pattern N6 — Stage 1 inventory-before-derivation audit set (Gap 13)

**Source**: blog commit `2805f27`:
> Prior sessions derived design systems from principles + personas without inventorying what already exists — produced partial systems missing entire content types.

Added 4 audit artifact types (surface / content-type / auth-boundary / component) as Stage 1 prerequisites in `apps/blog/.worktree/pilot-decision-gate/blueprint/research/`.

**Why it matters**: wave 8 added design-discovery sub-track from a different angle (brownfield audits for design). This signal extends it to surface/content/auth audits for any initiative with an existing production substrate.

**Promotion bar**: ≥1 other consumer hits the same "partial system because no inventory done" failure mode. Blog produced a four-artifact template; ready to lift when second consumer adopts.

### Pattern N7 — Variant misclassification reviewer

**Source**: blog commit `2708d4a` — pattern-match call ("v1 exists → brownfield") was wrong; correction landed late and required preserving brownfield artifacts under `v1-baseline/`.

**Why it matters**: small but real. Suggests a variant-classification reviewer / lint that checks variant against work-shape declarations rather than artifact-existence shortcuts.

**Promotion bar**: ≥1 other variant misclassification incident. Low priority — solo-incident evidence; the existing `variant-selection.md` decision tree handles the prevention layer.

## Updated next steps

**This audit's outputs land as waves 27 + 28** for C4 + C5 (covered in separate wave-log entries). The 7 deferred patterns (N1-N7) remain in watch-and-promote status — each promotion-bar names the specific cross-consumer signal that would justify wave authoring. Most are 1-consumer evidence; deliberate restraint applied to avoid wave-promotion from single-source data (the same discipline the original candidates doc applied).

The audit also confirms two observations from the prior research:

1. **The candidates doc's "borderline" verdicts were correctly calibrated** — C3 was borderline and promoted to wave 26 on weak evidence; C4 was defer and that defer held until blueprint-redesign's WAVE-2-BACKLOG.md surfaced the explicit operator-named need; C5 was borderline and the extended audit pushed it to 3-consumer evidence.

2. **The Loom-inspired five was incomplete by construction** — a single-source enumeration cannot anticipate patterns emerging from independent consumer practice. The 7 NEW patterns surfaced here add concrete future-wave candidates that no inspiration source predicted.

## Consumer initiatives not audited

`website-nc-v3` and `promo-initiative` are mentioned in wave log + the consumer list but not on local disk. When either becomes local-accessible (or when a future audit runs in a different session with access to them), repeat the same audit pattern. Expected surfaces to scan: METHODOLOGY-AMENDMENTS.md, HANDOFF docs, audits/, recent commits with friction keywords.
