# Inventory-as-Evidence — From Open-Ended Cleanup to Dispatchable Spec

**Purpose:** Capture the methodology pattern that turns "we should clean up the docs" into a Sonnet-dispatchable `[Spec]` proposal in one orchestrator session. The pattern: read-only walk → classify against a rubric → surface the surprises → present to the operator → file the inventory as the spec body's evidence section.

**Last updated:** 2026-05-16

**Source:** `subs-initiative` Hive #929 doc-reorg session (May 2026). The pattern emerged in a single Opus session that went from "I think it's time to clean up the docs" to a filed 13-PR spec ready for autonomous execution.

---

## What problem this solves

The operator says "we should clean up X" — where X is doc surface, dead code, stale infra, etc. The natural failure modes:

1. **Plan-without-evidence** — agent drafts a plan based on assumptions; plan is wrong because the agent's mental model of X is stale
2. **Spec-without-plan** — agent dives into rewriting before classifying; halfway through realizes the classification rubric was wrong; restart costs time
3. **Inventory-without-decision** — agent produces a thorough list, dumps it on the operator, asks "what do you want to do?" — operator now owns the synthesis

The fix: turn the inventory into the spec's evidence section. The walk produces the classification table, which the operator reacts to, which becomes the body of the [Spec] that gets filed and dispatched.

## The five-step pattern

### 1. Choose the rubric before the walk

Don't walk the surface without a classification rubric — you'll end up with notes you can't act on. Pick the rubric first (e.g., the 6-bucket taxonomy from `doc-surface-discipline-pattern.md` for doc surfaces; the equivalent for code surfaces would be: live / dead / experimental / vendored / generated).

State the rubric to the operator before starting the walk. Lets them adjust before you commit. Lets them push back if the rubric is wrong for their context.

### 2. Read-only walk

Walk the entire surface (every `*.md`, every `*.ts`, every infra file — whatever scope was set). No commits, no edits. Classify each item against the rubric. For each item, capture:

- Primary class (one of the rubric's buckets)
- Disposition (what happens to it in the cleanup)
- Notes (1 line — surprises, divergences, dependencies)

Read enough of each file to classify confidently. For directories with consistent patterns (e.g., ADRs in `docs/decisions/`), classify by pattern + verify with one sample read.

### 3. Surface the surprises

Before presenting the table, name what surprised you. These are the items where your mental model didn't match reality. Examples:

- "STATE.md duplicates ADR content + carries session state + has next-steps — three doc roles in one file"
- "The project already has a `canonical: true|false` frontmatter convention, used unevenly"
- "31 dispatch dossiers in `docs/handoffs/` are mostly for shipped tasks — they were intent capture; the code is now canonical"
- "HANDOFF.md (root) is a stale single-session bootstrap dated 9 days ago"

Surprises are signal. They're where the cleanup will create the most value (highest-divergence items) and where the operator needs to weigh in (because the cleanup will be contentious or scope-expanding).

### 4. Present table + propose target shape

Single table, collapsed by pattern (don't list 150 items individually — bucket by directory/pattern with counts). Then propose:

- Target shape (where things move to / what gets retired)
- Anchored fork choices (with rationale + trigger-to-revisit) for any structural decision the orchestrator can resolve
- Sequencing (waves, parallel-vs-sequential)
- Acceptance criteria (mechanical, per AC)

The operator reacts to the surprises + target shape. They don't need to vet every classification — they need to anchor the structural choices and flag any surprises you misread.

### 5. File the spec — inventory IS the evidence section

Once the operator reacts, file the `[Spec]` proposal with the inventory table embedded as the evidence section. The spec body now carries:

- Goal + AC
- The rubric (for downstream reviewer / implementer reference)
- The inventory (the evidence)
- Target shape + anchored forks
- Wave sequencing
- Acceptance commands

This makes the spec self-contained: a Sonnet implementer reads one dossier and can execute, without needing to re-do the walk or re-derive the classification.

## What this is NOT

- **Not an audit.** Audits are deeper — they verify claims against canonical sources. The inventory pass classifies; it doesn't verify. Verification belongs in the implementation slices.
- **Not a refactor plan.** The inventory says what each thing IS, not how to change it. The target shape proposes change; the inventory is the input to that proposal.
- **Not a delegate-and-dump.** The orchestrator owns the synthesis — what's surprising, what the target shape should be. The inventory is evidence the orchestrator uses, not a deliverable to hand off raw.

## Why "evidence" matters for spec quality

A `[Spec]` proposal without evidence asks the synthesizer + downstream implementers to trust the proposer's mental model. With the inventory embedded:

- The classification is **auditable** — anyone can re-walk the surface and check the rubric application
- The target shape is **grounded** — every "move X to Y" has a corresponding inventory row showing X's current state
- The acceptance criteria are **mechanical** — every AC maps to specific inventory items, not vague "cleanup happens"

The downstream implementer doesn't have to ask "wait, what does this file currently look like?" — the inventory tells them.

## Variants for non-doc surfaces

The pattern generalizes beyond doc cleanup. Adapt the rubric to the surface:

| Surface | Rubric buckets |
|---|---|
| **Docs** | canonical-present / decision-lineage / ephemeral-artifact / duplicate-divergent / external-reference / derived-mechanical (see `doc-surface-discipline-pattern.md`) |
| **Code modules** | live / dead-eligible-for-deletion / experimental / vendored / generated |
| **Infra resources** | live / orphaned / staging / deprecated-by-superseding-resource / vendor-managed |
| **Schema tables** | live / write-only-legacy / read-only-frozen / scratch / vendor-shape |

Same five-step pattern; different rubric.

## When to apply this

Apply when:
- Operator asks for "cleanup" / "reorg" / "consolidation" on a surface with >50 items
- The surface has accumulated through ≥1 major pivot
- The cleanup will dispatch to Sonnet implementers (otherwise a less formal scratchpad works)

Skip when:
- Small surface (<20 items) — just do the cleanup directly
- Surface is well-understood and rubric is obvious — go straight to spec
- One-shot operator-execution — overhead exceeds value

## Worked example

`subs-initiative` Hive #929 (2026-05-16):
1. **Rubric:** 6-bucket doc taxonomy (canonical-present / decision-lineage / ephemeral-artifact / duplicate-divergent / external-reference / derived-mechanical)
2. **Walk:** ~150 `*.md` files across 13 directories (RAG corpus excluded). ~10 sample reads where pattern-classification was ambiguous.
3. **Surprises surfaced:** STATE.md tri-role file; existing `canonical:` frontmatter convention; differentiators.md as register-shape model; ~26 of 31 handoff dossiers for shipped tasks; HANDOFF.md stale; orphan `docs/architecture/` appendices.
4. **Operator reaction:** anchored two structural forks (root-vs-spec/, single-vs-split register).
5. **[Spec] filed:** Hive #929 with the inventory as the evidence section, 9 ACs, 3-wave / 13-PR sequencing.

One Opus session, ~3 hours wall-clock from "cleanup the docs" to filed-spec-ready-for-dispatch.

## Companion patterns

- **`doc-surface-discipline-pattern.md`** — the rubric for doc surfaces
- **`tiered-orchestration-pattern.md`** — how the filed spec gets dispatched
- **`register-pattern.md`** — the invalidated-paths register that seeds the spec's decision-lineage

## Origin

Pattern extracted from `subs-initiative` Hive #929 doc-reorg session (2026-05-16). The session is the canonical reference implementation.
