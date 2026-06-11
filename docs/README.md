# Blueprint documentation

This is the navigation index for the Blueprint methodology corpus. The docs are organized by the [Diátaxis](https://diataxis.fr/) framework: Tutorials, How-to guides, Reference, Explanation. Links are relative to this file (`docs/`); `../` points at the repo root.

## The reader-path manifest (Stage-4-gated surface)

The docs a **stranger** reads to answer "what is this and how do I use it" have no usage-feedback loop (a confused reader bounces; they don't file amendments), so they drift silently. This manifest names that surface; each doc on it gets a periodic Stage-4-style fact-check (sanitize + adjudicate every claim: accurate / drifted / stale-evidence) — the same gate consumer deliverables get. Functional docs (patterns, reviewer specs, prompts read mid-initiative) are NOT on it: usage self-heals them via the amendments loop.

`README.md` · `METHODOLOGY.md` · `CONTRIBUTING.md` · `docs/README.md` (this file) · `docs/variant-selection.md` · `docs/portal-and-tier-ladder.md` · `docs/prompts/add-blueprint-to-project.md` · `docs/prompts/pick-up-blueprint-updates.md` · `template/CLAUDE.md` · the portal `/` + `/learn` pages

Last full review: 2026-06-10 (wave 56); first set-level pass 2026-06-11 (wave 58 — START-HERE folded into README, claim-ownership fixes: the five-check audit and voice-mode tables now have one owning doc each). Cadence: every wave that touches positioning, naming, or the portal — and any time a reader's question reveals a wrong claim.

**Set-level questions the per-file review must ALSO ask** (added after the wave-56 review missed both — per-file claim adjudication can't see between-doc problems):

1. **Deletion test, per doc**: if this doc disappeared, what would a reader lose that no other surface provides? A doc that fails it gets folded, not maintained. (Miss it caught: README vs START-HERE — three surfaces answering "what is this" once the portal became the evaluator front door.)
2. **Claim ownership, per shared claim**: every reader-path claim (the pipeline shape, the command list, the positioning) has ONE owning doc; every other surface links or sketches-with-a-pointer, never restates in full. Duplicated claims rot at different rates — the wave-56 repositioning reached the README tagline but not its "How It Works" section, and the Project Structure tree drifted a whole portal-architecture behind the stamper. Partial updates are the symptom; duplication is the disease.

## New here? Read these 3 first

The universal on-ramp. In order:

1. **The live portal** — [blueprint.ninochavez.co](https://blueprint.ninochavez.co): what Blueprint is and what it produces, in the product's own front door. The only surface that answers "should we use this?" in under 5 minutes.
2. **[`README.md`](../README.md)** — the team-evaluation path (§ "Evaluating Blueprint for your team?", folded from the former START-HERE), quickstart, command table, design principles.
3. **[`docs/variant-selection.md`](variant-selection.md)** — greenfield / midstream / brownfield decision tree, with the stage pipeline shape per variant. "Which variant are we?" gates every downstream decision; pick wrong and the retrofit costs a restart.

After step 3, jump to your role's read-first set under [By role](#by-role).

## The corpus by purpose

### Tutorials (learning-oriented)

| Doc | What it does |
|---|---|
| [`docs/prompts/add-blueprint-to-project.md`](prompts/add-blueprint-to-project.md) | Onboard an existing project into Blueprint |
| [`docs/prompts/pick-up-blueprint-updates.md`](prompts/pick-up-blueprint-updates.md) | Pull methodology updates into a live initiative |

### How-to guides (task-oriented)

Decision trees, setup, integration recipes, and actionable patterns.

| Doc | What it does |
|---|---|
| [`docs/variant-selection.md`](variant-selection.md) | greenfield / midstream / brownfield decision tree + per-variant pipeline shapes |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | The one routing question (4-bucket taxonomy); RFC vs plain PR; PR checklist |
| [`template/docs/methodology/methodology-amendments-convention.md`](../template/docs/methodology/methodology-amendments-convention.md) | How to record a promotable amendment in `METHODOLOGY-AMENDMENTS.md` |
| [`docs/context/browser-legibility.md`](context/browser-legibility.md) | Stage 0 sensor setup + Chrome DevTools escalation triggers |
| [`docs/patterns/cloudflare-deployment-pattern.md`](patterns/cloudflare-deployment-pattern.md) | Stage 6 deploy recipe for Cloudflare |
| [`docs/prompts/run-validate-to-goal.md`](prompts/run-validate-to-goal.md) | Drive the Stage 4 validate loop to a goal state |
| Platform B2B buyer-portal integration recipe | private context pack — supplied per engagement |
| [`docs/governance/team-roles-and-conventions.md`](governance/team-roles-and-conventions.md) | Running with >1 operator: the three zero-infra conventions + the crawl→walk→run litmus for escalating to Hive |
| [`docs/patterns/hive-coordination-pattern.md`](patterns/hive-coordination-pattern.md) | Hive-enabled multi-agent coordination + `blueprint hive setup` |
| [`docs/governance/hive-identity-gap.md`](governance/hive-identity-gap.md) | Hive's shared-bearer trust limitation; read before any client engagement |
| [`docs/patterns/multi-operator-collab-pattern.md`](patterns/multi-operator-collab-pattern.md) | Multi-operator coordination rules + memory management |
| [`docs/patterns/operator-handoff-pattern.md`](patterns/operator-handoff-pattern.md) | Stage-transition handoff template + when to write one |
| [`docs/patterns/tiered-orchestration-pattern.md`](patterns/tiered-orchestration-pattern.md) | Orchestrator / Specialist / Implementer / Janitor roles; wave sequencing |
| [`docs/patterns/doc-surface-discipline-pattern.md`](patterns/doc-surface-discipline-pattern.md) | Two-surface model for corpora over 50 docs |
| [`docs/patterns/inventory-as-evidence-pattern.md`](patterns/inventory-as-evidence-pattern.md) | Cleanup methodology — inventory before you delete |

### Reference (information-oriented)

Specs, checklists, decision records, stage methodology, conventions.

**Canonical, required before project init:**

| Doc | What it specifies |
|---|---|
| [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md) | Portal Pattern A vs B; Tier 0/1/2 ladder; bespoke-with-ADR escape |
| [`docs/case-studies/design-system-audit.md`](case-studies/design-system-audit.md) | 15-dimension acceptance checklist (R-1..R-5 research, D-1..D-10 decision) |
| [`docs/context/voice-template.md`](context/voice-template.md) | Canonical voice rules, quality-audit 5-checks, citation rules, 8 anti-patterns |
| [`docs/patterns/amendment-classification-pattern.md`](patterns/amendment-classification-pattern.md) | 4-bucket triage taxonomy + decision tree (consumer-local / template / reviewer / methodology) |

**Reviewers & gates:**

| Doc | What it specifies |
|---|---|
| [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) | Reviewer roster; which gate each covers; index to every spec |
| [`docs/context/voice-b2b-addendum.md`](context/voice-b2b-addendum.md) | B2B addendum to the voice rules |

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
| Platform marketplace + B2B Edition context packs | private — supplied per engagement (`b2b_edition.enabled: true`) |

**Pattern library** (reference patterns, applied as needed): [`docs/patterns/archaeology-substrate-pattern.md`](patterns/archaeology-substrate-pattern.md), [`docs/patterns/clustered-tool-surface-pattern.md`](patterns/clustered-tool-surface-pattern.md), [`docs/patterns/dependency-graph-view-pattern.md`](patterns/dependency-graph-view-pattern.md), [`docs/patterns/doc-discipline-micro-patterns.md`](patterns/doc-discipline-micro-patterns.md), [`docs/patterns/hive-closure-drift-sync-pattern.md`](patterns/hive-closure-drift-sync-pattern.md), [`docs/patterns/invariants-registry-pattern.md`](patterns/invariants-registry-pattern.md), [`docs/patterns/owner-spec-pattern.md`](patterns/owner-spec-pattern.md), [`docs/patterns/proposal-grain-pattern.md`](patterns/proposal-grain-pattern.md), [`docs/case-studies/prototype-vs-production-traceability-sweep.md`](case-studies/prototype-vs-production-traceability-sweep.md), [`docs/patterns/register-pattern.md`](patterns/register-pattern.md), [`docs/patterns/skill-categories-pattern.md`](patterns/skill-categories-pattern.md), [`docs/patterns/traceability-state-join-pattern.md`](patterns/traceability-state-join-pattern.md), [`docs/patterns/wave-log-digest-pattern.md`](patterns/wave-log-digest-pattern.md).

### Explanation (understanding-oriented)

Why the methodology exists and how it reasons.

| Doc | What it explains |
|---|---|
| [`METHODOLOGY.md`](../METHODOLOGY.md) | First-principles narrative; agent-struggle-is-missing-capability; pipeline; Stage 0 legibility; variant taxonomy; design-discipline sub-track |
| [`docs/productization/README.md`](productization/README.md) | The goal, the gap scorecard, the six tracks, the ADR→feature→wave map |
| [`docs/case-studies/case-study-pp-cx.md`](case-studies/case-study-pp-cx.md) | Worked example — 11 pages, embedded agent |
| [`docs/case-studies/case-study-v3-portal-css-gap.md`](case-studies/case-study-v3-portal-css-gap.md) | Incident → encoding → durable fix |
| [`docs/case-studies/case-study-subs-skipped-stages-2-4.md`](case-studies/case-study-subs-skipped-stages-2-4.md) | Worked example — skipping stages 2 and 4 with justification |
| [`docs/_archive/2026-05-25-three-session-reconciliation.md`](_archive/2026-05-25-three-session-reconciliation.md) | Concurrent-drift analysis + eight encoding solutions |
| [`docs/_archive/2026-05-27-extended-audit-findings.md`](_archive/2026-05-27-extended-audit-findings.md) | Extended audit findings |
| [`docs/_archive/2026-05-27-loom-market-comparison.md`](_archive/2026-05-27-loom-market-comparison.md) | Loom market comparison |
| [`docs/_archive/2026-05-27-loom-inspiration-candidates.md`](_archive/2026-05-27-loom-inspiration-candidates.md) | Loom inspiration candidates |
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

- **Stage 0 (legibility):** [`docs/context/browser-legibility.md`](context/browser-legibility.md)
- **Stage 1 (research):** `METHODOLOGY.md` § Stage 1 / variant section + [`docs/case-studies/design-system-audit.md`](case-studies/design-system-audit.md) research dimensions
- **Stage 2 (design principles):** [`docs/case-studies/design-system-audit.md`](case-studies/design-system-audit.md) + `template/methodology/design/` if a custom design system
- **Stage 3 (prototype):** [`template/prototype/DESIGN.md`](../template/prototype/DESIGN.md) + [`docs/case-studies/case-study-pp-cx.md`](case-studies/case-study-pp-cx.md)
- **Stage 4 (fact-check):** [`docs/context/voice-template.md`](context/voice-template.md) + [`docs/prompts/run-validate-to-goal.md`](prompts/run-validate-to-goal.md)
- **Stage 5 (documents):** [`docs/context/voice-template.md`](context/voice-template.md)
- **Stage 6 (deploy):** [`docs/patterns/cloudflare-deployment-pattern.md`](patterns/cloudflare-deployment-pattern.md) (Cloudflare) or `README.md` § Deploy (Vercel)

Variant context: the private platform context packs (marketplace, B2B edition, buyer portal — supplied per engagement), [`docs/patterns/hive-coordination-pattern.md`](patterns/hive-coordination-pattern.md).

Coordination + infra (>1 operator): [`docs/governance/team-roles-and-conventions.md`](governance/team-roles-and-conventions.md) (start here — the litmus), [`docs/patterns/hive-coordination-pattern.md`](patterns/hive-coordination-pattern.md) + [`docs/governance/hive-identity-gap.md`](governance/hive-identity-gap.md), [`docs/patterns/multi-operator-collab-pattern.md`](patterns/multi-operator-collab-pattern.md), [`docs/patterns/operator-handoff-pattern.md`](patterns/operator-handoff-pattern.md), [`docs/patterns/tiered-orchestration-pattern.md`](patterns/tiered-orchestration-pattern.md), [`CLAUDE.md`](../CLAUDE.md) § Operating Invariants.

Fixing drift / scaling past one project: [`docs/patterns/doc-surface-discipline-pattern.md`](patterns/doc-surface-discipline-pattern.md), [`docs/patterns/inventory-as-evidence-pattern.md`](patterns/inventory-as-evidence-pattern.md).

### Contributor — files fixes and proposals to the methodology

1. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to propose a change; RFC vs PR.
2. [`docs/patterns/amendment-classification-pattern.md`](patterns/amendment-classification-pattern.md) — which surface your change touches.
3. [`template/docs/methodology/methodology-amendments-convention.md`](../template/docs/methodology/methodology-amendments-convention.md) — how to write a promotable amendment.

Then by intent:

- **New reviewer gate:** [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) + a reference `reviewer.md`/`.mjs` pair.
- **Stage change or new variant:** [`METHODOLOGY.md`](../METHODOLOGY.md) + [`docs/variant-selection.md`](variant-selection.md).
- **Access / governance change:** [`docs/decisions/ADR-0004-native-access-governance.md`](decisions/ADR-0004-native-access-governance.md) + `CONTRIBUTING.md` § Access & roles.
- **Promoting an amendment:** `CONTRIBUTING.md` promotion routing + the Amendment RFC issue template.

### Reviewer — enforces gates, writes conformance checks

1. [`template/.claude/agents/blueprint/reviewers/README.md`](../template/.claude/agents/blueprint/reviewers/README.md) — what reviewers exist and where.
2. [`METHODOLOGY.md`](../METHODOLOGY.md) — the stage architecture gates sit in.
3. One stage-relevant spec: [`docs/case-studies/design-system-audit.md`](case-studies/design-system-audit.md), [`docs/context/voice-template.md`](context/voice-template.md), or [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md). All `.md` specs share the shape: status, source evidence, rubric, acceptance checklist.

Then by gate type:

- **Writing a new reviewer:** reviewers README + a reference `.md`/`.mjs` pair + [`docs/decisions/ADR-0006-native-extensibility.md`](decisions/ADR-0006-native-extensibility.md) (the `review()` contract).
- **Design-system gate:** [`docs/case-studies/design-system-audit.md`](case-studies/design-system-audit.md) (R-1..R-5, D-1..D-10).
- **Voice / copy gate:** [`docs/context/voice-template.md`](context/voice-template.md).
- **Amendment review:** [`docs/patterns/amendment-classification-pattern.md`](patterns/amendment-classification-pattern.md) + the initiative's `METHODOLOGY-AMENDMENTS.md`.
- **Conformance / health gate:** [`docs/decisions/ADR-0003-cost-effort-dial.md`](decisions/ADR-0003-cost-effort-dial.md) + [`docs/decisions/ADR-0005-bidirectional-update-protocol.md`](decisions/ADR-0005-bidirectional-update-protocol.md).

### Stakeholder — executive oversight, approval authority

1. [`README.md` § Evaluating Blueprint for your team?](../README.md#evaluating-blueprint-for-your-team) — why we're using this (+ the live portal).
2. [`decisions/00-charter.md`](../decisions/00-charter.md) — the charter: six requirements, gap scorecard, scope-ceiling decision.
3. [`docs/productization/README.md`](productization/README.md) — what shipped and when.

As work progresses:

- **Portal launch / user research:** [`apps/portal/README.md`](../apps/portal/README.md) (Pattern A reference impl).
- **Team onboarding:** [`docs/prompts/add-blueprint-to-project.md`](prompts/add-blueprint-to-project.md).
- **Cost / scaling:** [`docs/decisions/ADR-0003-cost-effort-dial.md`](decisions/ADR-0003-cost-effort-dial.md).
- **Cross-team governance:** [`docs/decisions/ADR-0004-native-access-governance.md`](decisions/ADR-0004-native-access-governance.md).

## Cross-role docs everyone should know exist

- [`docs/portal-and-tier-ladder.md`](portal-and-tier-ladder.md) — portal + tier decisions; required before init.
- [`docs/context/voice-template.md`](context/voice-template.md) — voice rules + quality audit for every document-producing role.
- [`docs/variant-selection.md`](variant-selection.md) — variant decision tree for all initiation work.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) + [`docs/patterns/amendment-classification-pattern.md`](patterns/amendment-classification-pattern.md) — the amendment workflow.

## Live reference implementations

- **Pattern A (platform portal):** [`apps/portal/README.md`](../apps/portal/README.md) → live at `blueprint.ninochavez.co`.
- **Pattern B (brownfield review portal):** `apps/rally-hq/blueprint/`, `apps/website-nc-v3/blueprint/` (at rest, reference impls).

## Self-application working artifacts

The repo runs Blueprint on itself; the live initiative's evidence lives at the root and in `docs/content/`, not in the methodology corpus above:

- [`feedback/`](../feedback/) — stakeholder feedback captures + triage records (per `/blueprint-triage`). Anonymized for the public repo; verbatim originals stay local in gitignored `feedback/raw/`.
- [`docs/content/validation-script.md`](content/validation-script.md) — the demand-evidence record: riskiest assumptions, scary questions, commitment asks, and the Log every triage appends to.
- [`docs/content/`](content/) — prescriptions, deferred items, and the self-application's Stage-3 content.
- [`METHODOLOGY-AMENDMENTS.md`](../METHODOLOGY-AMENDMENTS.md) — candidate-for-promotion gaps observed while running the methodology on itself.
- [`research/`](../research/) + [`decisions/`](../decisions/) — the self-application's Stage-1 research and initiative ADRs.

## Archive & history

Not required onboarding — kept for historical context.

- [`WAVE-LOG.md`](../WAVE-LOG.md) — full wave history; filter with the wave-digest tool.
- [`decisions/01-prescription.md`](../decisions/01-prescription.md) — v1 build order (complete, reference only).
- `docs/_archive/handoffs/` — old handoffs. Use [`template/methodology/handoff/handoff-template.md`](../template/methodology/handoff/handoff-template.md) for new ones.
- [`docs/productization/recon-synthesis.md`](productization/recon-synthesis.md) + [`docs/productization/canonical-research.md`](productization/canonical-research.md) — mirrored self-application research.
