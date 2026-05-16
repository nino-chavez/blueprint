# Doc Surface Discipline — Two-Surface Model + Classification Taxonomy

**Purpose:** Capture and operationalize the discipline that keeps a project's documentation from accumulating drift across major pivots. Codifies the two-surface model (canonical-present vs decision-lineage), the 6-bucket classification taxonomy, the `canonical: true|false` frontmatter convention, and the activation thresholds that prevent gold-plating on small projects.

**Last updated:** 2026-05-16

**Source:** `subs-initiative` doc-reorg work (Hive #929, May 2026). The trigger: ~150 project-authored docs accumulated through 5+ major pivots; future agents kept re-proposing already-invalidated paths because the "no, we tried that" trail was scattered across audits, synthesis notes, memory, and ADR `Superseded-by` chains rather than concentrated in a discoverable register.

---

## The trap this prevents

A maturing project's docs accumulate the *journey*: "previously we thought X," "we used to do Y," dated section headers, hedge clauses, fragments of three superseded approaches in one file. The reader can't tell what's current from what's historical.

The naive fix — a "knew everything now" cleanup — produces the worse failure: it flattens decision lineage into the canonical surface, so future agents read a tidied canonical and re-propose paths the project already ruled out. The "no, we tried that" trail got tidied away.

The trap has two symptoms:
1. **Re-litigation pattern** — proposals that have already been ratified-then-superseded keep getting refiled because the "ruled out" trail isn't findable.
2. **Trust-but-verify tax** — every audit becomes a forensic reconstruction because reviewers can't tell which paragraphs are still load-bearing.

## The fix: two surfaces, not one

| Surface | Role | Voice | Stability |
|---|---|---|---|
| **Canonical-present** | What the system IS now | "X works like Y" (present tense, no hedges) | Rewritten as understanding shifts; reads as if always-was |
| **Decision-lineage** | WHY a choice was made, especially what was rejected | "We considered A and B; chose A because Z" | Immutable once added; superseded via new entries referencing prior |

**Canonical-present** files: PRD, BRD, ARCHITECTURE, METHODOLOGY, design principles, runbooks. Reader needs none of the history to understand the current state.

**Decision-lineage** files: ADRs (the existing pattern), plus a paired **invalidated-paths register** (see `register-pattern.md`) for the "we ruled out Y, here's why and when" half that ADRs underweight.

## The 6-bucket classification taxonomy

Every doc gets exactly one primary class. The disposition tells the operator what happens to it during cleanup.

### 1. Canonical-present

What the system IS now. Rewrite as if always-was. No "previously we thought X" hedges. Date-agnostic.

- **Frontmatter:** `canonical: true`
- **Examples:** PRD.md, ARCHITECTURE.md, METHODOLOGY.md, design principles, runbooks
- **Misclassification trap:** confusing "canonical" with "complete" — a canonical doc for an unfinished system describes what IS, not what will be built.

### 2. Decision-lineage

WHY a choice was made, especially what was rejected. Time-stamped, additive, never overwritten. Cross-linked from canonical.

- **Frontmatter:** `canonical: true` (it IS canonical decision-lineage — superseded entries stay alongside their replacement, both authoritative for their respective moments)
- **Examples:** ADRs, synthesis notes, invalidated-paths register entries, retro lessons
- **Misclassification trap:** collapsing lineage into canonical (loses the WHY); or pruning old ADRs as "no longer relevant" (loses the "we already invalidated this" trail future proposals need to hit).

### 3. Ephemeral-artifact

Produced for a moment, valuable then, low signal now. Status snapshots, weekly digests, one-shot audits superseded by derived state, dispatch dossiers for closed tasks.

- **Frontmatter:** `canonical: false`
- **Disposition:** archive under `docs/archive/<YYYY-MM>/`, don't delete (forensic trail preserved, active doc tree clean)
- **Misclassification trap:** leaving them in the active tree becomes "did we do this already?" noise; deleting them loses trust-but-verify value.

### 4. Duplicate / divergent

Same information in multiple places, often with subtle drift between copies. The divergence itself is signal — sometimes the "wrong" copy was closer to a true requirement the canonical missed.

- **Disposition:** reconcile divergence first, pick authoritative location, redirect others to a stub
- **Misclassification trap:** declaring one canonical without surfacing what was different — see `doc-discipline-micro-patterns.md` "wrong-copy-is-signal" rule.

### 5. External reference (corpus)

Not project-authored. Embedded for lookup.

- **Frontmatter:** `canonical: false` (it's authoritative externally, not authored by this project)
- **Examples:** vendor docs, RAG corpora, BC API references, language/framework docs
- **Misclassification trap:** citing external docs as if they were project decisions; treating the corpus as canonical of the project's design.

### 6. Derived / mechanical

Generated from source-of-truth, never hand-edited.

- **Frontmatter:** `canonical: false` (derived files aren't canonical authority — the generator's input is)
- **Header convention:** `> **GENERATED — DO NOT EDIT.** Re-run with <command>.`
- **Examples:** `_state.json`, board snapshots, traceability registries, coverage reports
- **Misclassification trap:** hand-edits that get blown away on next regen, or that fool readers into thinking the file is authored.

### Secondary tags

Capture ambiguity without forcing a coin-flip on primary class:
- `→ invalidated-path-candidate` — should seed the next register entries
- `← divergent-with(<other-path>)` — paired for reconciliation
- `<phase>-closeout` — special case of decision-lineage for a closed program phase

## The `canonical: true | false` frontmatter convention

Every `*.md` file under `docs/` declares its class via frontmatter:

```yaml
---
canonical: true
---
```

```yaml
---
canonical: false
---
```

Lint-enforce (see `template/tools/frontmatter-lint/`) on every PR. Refuses-to-merge if the key is missing or the value is anything other than `true` or `false`.

Exemptions: `docs/rag/` (external corpus), `docs/archive/` (ephemeral by location, not by frontmatter).

The convention's payoff: every reader (human and agent) knows the file's authority class at a glance, without re-reading content to decide whether to trust it as current.

## Activation thresholds

Don't apply this discipline on small projects — overhead exceeds value. Apply when:

| Practice | Activates when |
|---|---|
| 6-bucket taxonomy | >50 project-authored docs across >3 subdirs |
| Two-surface model (canonical + decision-lineage split) | At least one major pivot has happened (any "we used to think X" content exists) |
| Invalidated-paths register | Same trigger as two-surface — pivot count ≥1 |
| `canonical: true \| false` frontmatter lint | >20 markdown docs |
| Differentiators register | Project has identifiable peer products (competitive positioning matters) |
| Derive-don't-hand-maintain discipline | **Always.** Applies at any scale. |
| Invalidated-paths seeded retroactively | Apply once activated — comb through ADR `Superseded-by` chains, synthesis notes, memory pivot flags |

A 5-file CLI tool with no pivot history doesn't need any of this. A 20-file utility with one rewrite in its history needs the discipline but probably not the lint scaffold yet. The discipline scales with project complexity; the tooling scales with doc count.

## How to operationalize on an existing project

The full worked example is `subs-initiative` Hive #929. The shape:

1. **Inventory pass (read-only)** — walk every `*.md` under root + `docs/`. Classify into the 6 buckets. Identify duplicates and surprises. See `inventory-as-evidence-pattern.md` for the methodology.
2. **File the [Spec]** — the inventory is the evidence; the spec body describes the target shape, sequencing, and acceptance criteria.
3. **Wave 1 — foundation** (parallel-safe): invalidated-paths register seeded; frontmatter lint scaffold; derive-discipline tools (state-derive, registry-join).
4. **Wave 2 — opportunistic canonical refresh** (parallel-safe): one PR per canonical-present file. Rewrite as always-was, add `canonical: true` frontmatter, normalize cross-refs.
5. **Wave 3 — retirements** (sequential, dependent on wave 1): retire any multi-role files (e.g., a `STATE.md` that mixes decision register + session state + next steps), archive completed handoffs.

## Companion patterns

- **`register-pattern.md`** — the shape used by invalidated-paths and differentiators registers
- **`tiered-orchestration-pattern.md`** — how to dispatch the waves across Opus orchestrator + Sonnet implementers
- **`inventory-as-evidence-pattern.md`** — the read-only-walk → classify → file-as-spec methodology
- **`doc-discipline-micro-patterns.md`** — small patterns (surface-existing-discipline, capture-ambiguity, wrong-copy-is-signal, avoid-multi-role-template-files)

## Origin

Extracted from `subs-initiative` doc-reorg session (May 2026). Filed as Hive #929 with 13-PR / 3-wave implementation plan + 10 seed invalidated-path entries. The session triggered when the project's 150-doc surface had accumulated through hackathon→north-star, separate-repos→one-repo, marketplace-only→marketplace-first/native-ready, /docs-mirror→/traceability, PI-5062-as-blocker→vault-canonical-rail, and terraform-gcp-platform→hand-rolled-google pivots — each leaving residue in canonical surfaces.
