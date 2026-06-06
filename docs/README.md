# Blueprint documentation

This is the navigation index for the Blueprint methodology corpus. The docs are organized by the [Diátaxis](https://diataxis.fr/) framework: Tutorials, How-to guides, Reference, Explanation. Links are relative to this file (`docs/`); `../` points at the repo root.

## New here? Read these 3 first

The universal on-ramp. In order:

1. **[`START-HERE.md`](../START-HERE.md)** — 5-minute overview. What Blueprint is, see it running, how to try it. The only doc that answers "should we use this?" in under 10 minutes.
2. **[`README.md`](../README.md)** — project scope, quickstart, command table, design principles. Moves from "interesting" to "here's what the output looks like."
3. **[`docs/variant-selection.md`](variant-selection.md)** — greenfield / midstream / brownfield decision tree, with the stage pipeline shape per variant. "Which variant are we?" gates every downstream decision; pick wrong and the retrofit costs a restart.

After step 3, jump to your role's read-first set under [By role](#by-role).

## The corpus by purpose

### Tutorials (learning-oriented)

| Doc | What it does |
|---|---|
| [`START-HERE.md`](../START-HERE.md) | 5-minute pitch — what it is, see it running, how to try |
| [`docs/prompts/add-blueprint-to-project.md`](prompts/add-blueprint-to-project.md) | Onboard an existing project into Blueprint |
| [`docs/prompts/pick-up-blueprint-updates.md`](prompts/pick-up-blueprint-updates.md) | Pull methodology updates into a live initiative |

### How-to guides (task-oriented)

Decision trees, setup, integration recipes, and actionable patterns.

| Doc | What it does |
|---|---|
| [`docs/variant-selection.md`](variant-selection.md) | greenfield / midstream / brownfield decision tree + per-variant pipeline shapes |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | The one routing question (4-bucket taxonomy); RFC vs plain PR; PR checklist |
| [`template/docs/methodology/methodology-amendments-convention.md`](../template/docs/methodology/methodology-amendments-convention.md) | How to record a promotable amendment in `METHODOLOGY-AMENDMENTS.md` |
| [`docs/browser-legibility.md`](browser-legibility.md) | Stage 0 sensor setup + Chrome DevTools escalation triggers |
| [`docs/cloudflare-deployment-pattern.md`](cloudflare-deployment-pattern.md) | Stage 6 deploy recipe for Cloudflare |
| [`docs/prompts/run-validate-to-goal.md`](prompts/run-validate-to-goal.md) | Drive the Stage 4 validate loop to a goal state |
| [`docs/bc-b2b-buyer-portal-integration.md`](bc-b2b-buyer-portal-integration.md) | the commerce platform B2B buyer-portal integration recipe |
| [`docs/team-roles-and-conventions.md`](team-roles-and-conventions.md) | Running with >1 operator: the three zero-infra conventions + the crawl→walk→run litmus for escalating to Hive |
| [`docs/hive-coordination-pattern.md`](hive-coordination-pattern.md) | Hive-enabled multi-agent coordination + `blueprint hive setup` |
| [`docs/hive-identity-gap.md`](hive-identity-gap.md) | Hive's shared-bearer trust limitation; read before any client engagement |
| [`docs/multi-operator-collab-pattern.md`](multi-operator-collab-pattern.md) | Multi-operator coordination rules + memory management |
| [`docs/operator-handoff-pattern.md`](operator-handoff-pattern.md) | Stage-transition handoff template + when to write one |
| [`docs/tiered-orchestration-pattern.md`](tiered-orchestration-pattern.md) | Orchestrator / Specialist / Implementer / Janitor roles; wave sequencing |
| [`docs/doc-surface-discipline-pattern.md`](doc-surface-discipline-pattern.md) | Two-surface model for corpora over 50 docs |
| [`docs/inventory-as-evidence-pattern.md`](inventory-as-evidence-pattern.md) | Cleanup methodology — inventory before you delete |

### Reference (information-oriented)

Specs, checklists, decision records, stage methodology, conventions.

**Canonical, required before project init:**

| Doc | What it specifies |
|---|---|
| [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md) | Portal Pattern A vs B; Tier 0/1/2 ladder; bespoke-with-ADR escape |
| [`docs/design-system-audit.md`](design-system-audit.md) | 15-dimension acceptance checklist (R-1..R-5 research, D-1..D-10 decision) |
| [`docs/voice-template.md`](voice-template.md) | Canonical voice rules, quality-audit 5-checks, citation rules, 8 anti-patterns |
| [`docs/amendment-classification-pattern.md`](amendment-classification-pattern.md) | 4-bucket triage taxonomy + decision tree (consumer-local / template / reviewer / methodology) |

**Reviewers & gates:**

| Doc | What it specifies |
|---|---|
| [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) | Reviewer roster; which gate each covers; index to every spec |
| [`docs/voice-b2b-addendum.md`](voice-b2b-addendum.md) | B2B addendum to the voice rules |

**Decision records (platform ADRs):**

| Doc | Decision |
|---|---|
| [`docs/decisions/ADR-0003-cost-effort-dial.md`](decisions/ADR-0003-cost-effort-dial.md) | Cost-effort dial + enforcement |
| [`docs/decisions/ADR-0004-native-access-governance.md`](decisions/ADR-0004-native-access-governance.md) | Native access + governance model |
| [`docs/decisions/ADR-0005-bidirectional-update-protocol.md`](decisions/ADR-0005-bidirectional-update-protocol.md) | Version / deprecation gates; bidirectional update |
| [`docs/decisions/ADR-0006-native-extensibility.md`](decisions/ADR-0006-native-extensibility.md) | The `review()` extensibility contract |
| [`docs/decisions/ADR-0007-versioning-distribution-toolchain.md`](decisions/ADR-0007-versioning-distribution-toolchain.md) | Versioning + distribution toolchain |

Numbered consumer-local decisions (`docs/decisions/0001`..`0005`) cover narrower, initiative-scoped calls.

**Variant context packs:**

| Doc | Context |
|---|---|
| [`docs/bc-marketplace-context.md`](bc-marketplace-context.md) | the commerce platform Marketplace |
| [`docs/bc-b2b-edition-context.md`](bc-b2b-edition-context.md) | the commerce platform B2B Edition |

**Pattern library** (reference patterns, applied as needed): [`docs/archaeology-substrate-pattern.md`](archaeology-substrate-pattern.md), [`docs/clustered-tool-surface-pattern.md`](clustered-tool-surface-pattern.md), [`docs/dependency-graph-view-pattern.md`](dependency-graph-view-pattern.md), [`docs/doc-discipline-micro-patterns.md`](doc-discipline-micro-patterns.md), [`docs/hive-closure-drift-sync-pattern.md`](hive-closure-drift-sync-pattern.md), [`docs/invariants-registry-pattern.md`](invariants-registry-pattern.md), [`docs/owner-spec-pattern.md`](owner-spec-pattern.md), [`docs/proposal-grain-pattern.md`](proposal-grain-pattern.md), [`docs/prototype-vs-production-traceability-sweep.md`](prototype-vs-production-traceability-sweep.md), [`docs/register-pattern.md`](register-pattern.md), [`docs/skill-categories-pattern.md`](skill-categories-pattern.md), [`docs/traceability-state-join-pattern.md`](traceability-state-join-pattern.md), [`docs/wave-log-digest-pattern.md`](wave-log-digest-pattern.md).

### Explanation (understanding-oriented)

Why the methodology exists and how it reasons.

| Doc | What it explains |
|---|---|
| [`METHODOLOGY.md`](../METHODOLOGY.md) | First-principles narrative; agent-struggle-is-missing-capability; pipeline; Stage 0 legibility; variant taxonomy; design-discipline sub-track |
| [`docs/productization/README.md`](productization/README.md) | The goal, the gap scorecard, the six tracks, the ADR→feature→wave map |
| [`docs/case-study-pp-cx.md`](case-study-pp-cx.md) | Worked example — 11 pages, embedded agent |
| [`docs/case-study-v3-portal-css-gap.md`](case-study-v3-portal-css-gap.md) | Incident → encoding → durable fix |
| [`docs/case-study-subs-initiative-skipped-stages-2-4.md`](case-study-subs-initiative-skipped-stages-2-4.md) | Worked example — skipping stages 2 and 4 with justification |
| [`docs/2026-05-25-three-session-reconciliation.md`](2026-05-25-three-session-reconciliation.md) | Concurrent-drift analysis + eight encoding solutions |
| [`docs/2026-05-27-extended-audit-findings.md`](2026-05-27-extended-audit-findings.md) | Extended audit findings |
| [`docs/2026-05-27-loom-market-comparison.md`](2026-05-27-loom-market-comparison.md) | Loom market comparison |
| [`docs/2026-05-27-loom-inspiration-candidates.md`](2026-05-27-loom-inspiration-candidates.md) | Loom inspiration candidates |
| [`research/00-recon-synthesis.md`](../research/00-recon-synthesis.md) | 6-agent gap analysis (self-application) |
| [`research/01-canonical-research.md`](../research/01-canonical-research.md) | Vendor-canonical research |

## By role

Each role: read the 3 universal on-ramp docs above, then this set.

### Operator — runs an initiative end to end

Core bootstrap before Stage 0:

1. [`METHODOLOGY.md`](../METHODOLOGY.md) — how the methodology thinks about product work.
2. [`docs/variant-selection.md`](variant-selection.md) — which pipeline you're running.
3. [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md) — how you externalize to stakeholders (orthogonal to variant).

Then stage-specific:

- **Stage 0 (legibility):** [`docs/browser-legibility.md`](browser-legibility.md)
- **Stage 1 (research):** `METHODOLOGY.md` § Stage 1 / variant section + [`docs/design-system-audit.md`](design-system-audit.md) research dimensions
- **Stage 2 (design principles):** [`docs/design-system-audit.md`](design-system-audit.md) + `template/methodology/design/` if a custom design system
- **Stage 3 (prototype):** [`template/prototype/DESIGN.md`](../template/prototype/DESIGN.md) + [`docs/case-study-pp-cx.md`](case-study-pp-cx.md)
- **Stage 4 (fact-check):** [`docs/voice-template.md`](voice-template.md) + [`docs/prompts/run-validate-to-goal.md`](prompts/run-validate-to-goal.md)
- **Stage 5 (documents):** [`docs/voice-template.md`](voice-template.md)
- **Stage 6 (deploy):** [`docs/cloudflare-deployment-pattern.md`](cloudflare-deployment-pattern.md) (Cloudflare) or `README.md` § Deploy (Vercel)

Variant context: [`docs/bc-marketplace-context.md`](bc-marketplace-context.md), [`docs/bc-b2b-edition-context.md`](bc-b2b-edition-context.md) + [`docs/bc-b2b-buyer-portal-integration.md`](bc-b2b-buyer-portal-integration.md), [`docs/hive-coordination-pattern.md`](hive-coordination-pattern.md).

Coordination + infra (>1 operator): [`docs/team-roles-and-conventions.md`](team-roles-and-conventions.md) (start here — the litmus), [`docs/hive-coordination-pattern.md`](hive-coordination-pattern.md) + [`docs/hive-identity-gap.md`](hive-identity-gap.md), [`docs/multi-operator-collab-pattern.md`](multi-operator-collab-pattern.md), [`docs/operator-handoff-pattern.md`](operator-handoff-pattern.md), [`docs/tiered-orchestration-pattern.md`](tiered-orchestration-pattern.md), [`CLAUDE.md`](../CLAUDE.md) § Operating Invariants.

Fixing drift / scaling past one project: [`docs/doc-surface-discipline-pattern.md`](doc-surface-discipline-pattern.md), [`docs/inventory-as-evidence-pattern.md`](inventory-as-evidence-pattern.md).

### Contributor — files fixes and proposals to the methodology

1. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to propose a change; RFC vs PR.
2. [`docs/amendment-classification-pattern.md`](amendment-classification-pattern.md) — which surface your change touches.
3. [`template/docs/methodology/methodology-amendments-convention.md`](../template/docs/methodology/methodology-amendments-convention.md) — how to write a promotable amendment.

Then by intent:

- **New reviewer gate:** [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) + a reference `reviewer.md`/`.mjs` pair.
- **Stage change or new variant:** [`METHODOLOGY.md`](../METHODOLOGY.md) + [`docs/variant-selection.md`](variant-selection.md).
- **Access / governance change:** [`docs/decisions/ADR-0004-native-access-governance.md`](decisions/ADR-0004-native-access-governance.md) + `CONTRIBUTING.md` § Access & roles.
- **Promoting an amendment:** `CONTRIBUTING.md` promotion routing + the Amendment RFC issue template.

### Reviewer — enforces gates, writes conformance checks

1. [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) — what reviewers exist and where.
2. [`METHODOLOGY.md`](../METHODOLOGY.md) — the stage architecture gates sit in.
3. One stage-relevant spec: [`docs/design-system-audit.md`](design-system-audit.md), [`docs/voice-template.md`](voice-template.md), or [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md). All `.md` specs share the shape: status, source evidence, rubric, acceptance checklist.

Then by gate type:

- **Writing a new reviewer:** reviewers README + a reference `.md`/`.mjs` pair + [`docs/decisions/ADR-0006-native-extensibility.md`](decisions/ADR-0006-native-extensibility.md) (the `review()` contract).
- **Design-system gate:** [`docs/design-system-audit.md`](design-system-audit.md) (R-1..R-5, D-1..D-10).
- **Voice / copy gate:** [`docs/voice-template.md`](voice-template.md).
- **Amendment review:** [`docs/amendment-classification-pattern.md`](amendment-classification-pattern.md) + the initiative's `METHODOLOGY-AMENDMENTS.md`.
- **Conformance / health gate:** [`docs/decisions/ADR-0003-cost-effort-dial.md`](decisions/ADR-0003-cost-effort-dial.md) + [`docs/decisions/ADR-0005-bidirectional-update-protocol.md`](decisions/ADR-0005-bidirectional-update-protocol.md).

### Stakeholder — executive oversight, approval authority

1. [`START-HERE.md`](../START-HERE.md) — why we're using this.
2. [`decisions/00-charter.md`](../decisions/00-charter.md) — the charter: six requirements, gap scorecard, scope-ceiling decision.
3. [`docs/productization/README.md`](productization/README.md) — what shipped and when.

As work progresses:

- **Portal launch / user research:** [`apps/portal/README.md`](../apps/portal/README.md) (Pattern A reference impl).
- **Team onboarding:** [`docs/prompts/add-blueprint-to-project.md`](prompts/add-blueprint-to-project.md).
- **Cost / scaling:** [`docs/decisions/ADR-0003-cost-effort-dial.md`](decisions/ADR-0003-cost-effort-dial.md).
- **Cross-team governance:** [`docs/decisions/ADR-0004-native-access-governance.md`](decisions/ADR-0004-native-access-governance.md).

## Cross-role docs everyone should know exist

- [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md) — portal + tier decisions; required before init.
- [`docs/voice-template.md`](voice-template.md) — voice rules + quality audit for every document-producing role.
- [`docs/variant-selection.md`](variant-selection.md) — variant decision tree for all initiation work.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) + [`docs/amendment-classification-pattern.md`](amendment-classification-pattern.md) — the amendment workflow.

## Live reference implementations

- **Pattern A (platform portal):** [`apps/portal/README.md`](../apps/portal/README.md) → live at `blueprint-platform.pages.dev`.
- **Pattern B (brownfield review portal):** `apps/rally-hq/blueprint/`, `apps/website-nc-v3/blueprint/` (at rest, reference impls).

## Archive & history

Not required onboarding — kept for historical context.

- [`WAVE-LOG.md`](../WAVE-LOG.md) — full wave history; filter with the wave-digest tool.
- [`decisions/01-prescription.md`](../decisions/01-prescription.md) — v1 build order (complete, reference only).
- `docs/_archive/handoffs/` — old handoffs. Use [`template/methodology/handoff/handoff-template.md`](../template/methodology/handoff/handoff-template.md) for new ones.
- [`docs/productization/recon-synthesis.md`](productization/recon-synthesis.md) + [`docs/productization/canonical-research.md`](productization/canonical-research.md) — mirrored self-application research.
