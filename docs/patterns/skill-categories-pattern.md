---
canonical: true
---

# Skill Categories Pattern — Stage vs Routine

**Status**: Promoted 2026-05-27 wave 29 from two-example evidence (`/blueprint-handoff` + `/blueprint-amendment`). The two-example bar named in the pattern-pending-validation precursor doc is met; pattern now canonical.

**Last updated**: 2026-05-27

**Source observation**: extended audit + the 2026-05-27 meta-question (*"are there skills that should ship with blueprint, like a skill that knows to create and maintain a handoff doc?"*) revealed that Blueprint's existing 6-skill set is incomplete by construction. The set models the pipeline (stage advancement) but not the convention-maintenance (continuous practice).

**Related patterns**:
- [docs/patterns/operator-handoff-pattern.md](operator-handoff-pattern.md) (wave 25) — the first routine the new category addresses
- [docs/patterns/amendment-classification-pattern.md](amendment-classification-pattern.md) (wave 27) — second candidate routine
- [docs/patterns/multi-operator-collab-pattern.md](multi-operator-collab-pattern.md) (wave 28) — third candidate routine

---

## The two categories

| Category | Invocation trigger | Cadence | Example |
|---|---|---|---|
| **STAGE skill** | Operator advances from Stage N to Stage N+1 | Once per stage transition (~6× per initiative) | `/blueprint-research`, `/blueprint-prototype`, `/blueprint-docs`, `/blueprint-validate`, `/blueprint-deploy`, `/blueprint-triage` |
| **ROUTINE skill** | Operator runs a recurring convention-maintenance routine | Many times per initiative (varies — handoffs at every session break; amendments when methodology learning surfaces; parallel-dispatch-checks before every parallel dispatch) | `/blueprint-handoff`, `/blueprint-amendment`, `/blueprint-dispatch` (shipped); future candidate: `/blueprint-sweep` |

The categories differ in three load-bearing ways:

1. **Trigger discoverability** — STAGE skills are findable because the operator knows what stage they're in (the `blueprint.yml` stage field declares it). ROUTINE skills are not findable from any single state field; the operator has to know the routine exists AND know to invoke it.

2. **Invocation count** — STAGE skills run roughly once per stage transition (the pipeline is linear, ~6 stages). ROUTINE skills run many times per initiative, at unpredictable moments.

3. **Composition with other skills** — STAGE skills run sequentially (Stage N completes, then Stage N+1 starts). ROUTINE skills run cross-cutting, often invoked from within a stage skill rather than instead of one (e.g., `/blueprint-validate` could suggest `/blueprint-handoff` at Stage 4 closure).

## Why ROUTINE skills need the SessionStart hook

The skill-discovery problem hits ROUTINE skills hard. STAGE skills have a clear "I'm at Stage N" trigger. ROUTINE skills don't.

Two mechanisms close the discovery gap:

1. **Cross-skill invocation** — existing pipeline skills suggest routine skills at the right moments:
   - `/blueprint-validate` detects Stage 4 closure → suggests `/blueprint-handoff`
   - `/blueprint-deploy` detects amendment file change → suggests `/blueprint-amendment` if the new entry is unstructured
   - Parent session detects parallel-agent dispatch intent → suggests `/blueprint-dispatch`

2. **SessionStart hook hints** — the existing canonical-context-injection hook (per `template/CLAUDE.md` § "SessionStart canonical-context injection") surfaces routine-skill availability per session shape. E.g., "Multi-agent dispatch detected in conversation — `/blueprint-dispatch` invokes the pre-flight check."

Both mechanisms exist in Blueprint already. Wiring them is incremental. The hook + skills cross-reference already happen for `/blueprint-research` etc. — extending this to routine skills is a small composition change.

## When to author each category

**STAGE skill** when:
- A pipeline stage's work is well-enough understood to encode as a procedure
- The stage has clear entry conditions (`blueprint.yml` state) and exit conditions (reviewer pass)
- The work happens once per stage transition

**ROUTINE skill** when:
- A convention-maintenance routine is well-enough understood to encode as a procedure
- The routine wraps a template-fill or a tool invocation that operators currently do manually
- Manual practice has friction that mechanical pre-fill removes (state header from git, taxonomy decision-tree, pre-flight check, etc.)
- The routine has cross-consumer evidence — i.e., ≥2 initiatives have hit the friction the routine addresses

## Authoring guidance for ROUTINE skills

The first routine skill (`/blueprint-handoff`) establishes the shape. Future routine skills should mirror its structure:

1. **Single-line opening** naming what the skill does in one sentence
2. **Implements wave N's <pattern> from `<canonical-doc>`** — every routine skill is the executable form of a canonical pattern doc; cross-reference both ways
3. **When to use** — list the trigger types (the routine usually has multiple triggers, not just one)
4. **What it does** — numbered procedural steps. Each step either derives state mechanically (from git, pwd, blueprint.yml, files) OR asks the operator for what cannot be derived
5. **Output** — name the file path(s) the skill writes to
6. **What this skill does NOT do** — explicit cap to prevent scope creep
7. **Cross-skill invocation** — name the moments other skills should proactively suggest this routine

The "what cannot be derived" line is load-bearing. Routine skills are valuable precisely because they automate the mechanical 80% of a convention-fill, leaving the operator-judgment 20%. If a routine skill tries to automate the judgment (e.g., decide "what's pending" without asking), it produces wrong output. The shape should always be: derive state → ask for judgment → compose → write.

## Promotion history

This pattern was first authored as `pattern-pending-validation` alongside `/blueprint-handoff` (commit `cf6103d`). The bar named at that time: ≥1 additional routine skill authored against this pattern.

`/blueprint-amendment` is that second example. Both skills follow the routine-skill shape: derive state mechanically (git for handoff; the 4-bucket decision tree for amendment), ask operator for judgment that cannot be derived, compose, write. The pattern is now canonical.

Future routine skills should mirror this shape; future skill-category additions (e.g., REVIEWER skills, CADENCE skills) would require their own pattern-pending-validation → two-example promotion arc.

The second promotion-bar named at first-author time (cross-consumer evidence that a single consumer invokes both a STAGE and a ROUTINE skill in one session and reports on whether discovery mechanisms work) is NOT yet met. This wave promotes the category pattern based on methodology-internal evidence (two routine skills successfully authored). If a consumer later reports the discovery mechanism is insufficient — they didn't find the routine skill when they needed it — that finding would drive a follow-on amendment to this doc rather than invalidate the wave-29 promotion.

## Inventory

As of 2026-05-27:

**STAGE skills** (6, in `template/.claude/skills/blueprint/`):
- `research.md` (`/blueprint-research`)
- `prototype.md` (`/blueprint-prototype`)
- `docs.md` (`/blueprint-docs`)
- `validate.md` (`/blueprint-validate`)
- `deploy.md` (`/blueprint-deploy`)
- `triage.md` (`/blueprint-triage`)

**ROUTINE skills** (3, in `template/.claude/skills/blueprint/`):
- `handoff.md` (`/blueprint-handoff`) — generates HANDOFF.md by deriving state from git + pwd; asks operator for "what's pending" + sequencing
- `amendment.md` (`/blueprint-amendment`) — files a METHODOLOGY-AMENDMENTS entry via wave 27's 4-bucket decision tree; initializes the amendments file from template if absent
- `dispatch.md` (`/blueprint-dispatch`) — runs `parallel-dispatch-check` as pre-flight before parallel-agent dispatch

**Routine candidates** (deferred — each awaits its own promotion-evidence threshold):
- `/blueprint-sweep` — orchestrates wave 22 + 24 two-layer drift-detection recipe (state-derive prefilter + sweep on MANUAL_REVIEW remainder + per-verdict draft emission). Defer until a consumer runs the two-layer recipe and reports back on whether the orchestration adds value vs the manual workflow.
- `/blueprint-archaeology-ready` — verifies all 4 wave 21 preconditions before flipping the operator gate. Defer until a consumer actually deploys Stage S-A end-to-end and reports back on whether the manual gate-flip carries enough cognitive load to need automation.
