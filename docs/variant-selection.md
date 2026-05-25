# Variant Selection

**Canonical reference for picking the right blueprint variant at project init.**

BigBlueprint serves three distinct project lifecycles. Each has its own stage sequence, deliverables, and reviewer-agent gates. Pick the variant *before* the first stage runs — the wrong variant produces retrofit feel that cannot be un-retrofitted without restarting.

| Variant | When the product is… | Center of gravity | Canonical artifact set |
|---|---|---|---|
| **Greenfield (build)** | New. No production surfaces. North-star-driven. | Prototype as the central deliverable. | Research → Design Principles → Prototype → Docs |
| **Midstream (hybrid)** | Active, mid-development. Prototype revises in-flight work. | Targeted diagnose + revision prototype. | Targeted Diagnose → Prescription → Prototype-as-Patch → Docs |
| **Brownfield (audit)** | Mature, live, under-audited. Prototype optional. | Diagnose + prescription as the deliverables. | Diagnose → Prescription → Design Brief → (optional Prototype) |

If no variant is selected, the methodology defaults to greenfield — which is wrong for two of three lifecycles. Selection happens at `blueprint.yml` init, before Stage 0 runs.

## Pattern-match decision tree

Run this at project init. Answer in order; first "yes" wins.

```
1. Is the product already live in production with real users?
   └─ No  → Greenfield
   └─ Yes → continue

2. Is the work scoped to active in-flight development (new features, mid-build revisions, north-star
   surfaces that don't exist yet)?
   └─ Yes → Midstream
   └─ No  → continue

3. Is the work audit-first — diagnose what exists, prescribe changes, optionally prototype the result?
   └─ Yes → Brownfield
   └─ No  → review the answers; one of the three should fit. If genuinely none of them do, the
            project may not be a blueprint candidate.
```

**Worked examples:**

- **Rally HQ** — live tournament platform, but blueprint work targets unbuilt north-star surfaces (multi-format support, league standings, bracket export). Q1=yes, Q2=yes → **midstream**.
- **website-nc-v3** — existing v2 site, blueprint work is an audit-driven redesign. Q1=yes, Q2=no (no in-flight build), Q3=yes → **brownfield**.
- **Signal Dispatch blog** — live blog (275 items, RSS subscribers), blueprint work is UX/UI/CX audit. Q1=yes, Q2=no, Q3=yes → **brownfield**.
- **bc-subscriptions** — gated; revisit at session reopen.
- **A new product idea (no code yet)** — Q1=no → **greenfield**.

## Stage shapes per variant

All three variants share **Stage 0 (Application Legibility)**. Sensor wiring is identical; the difference is what Stage 0 captures. Greenfield captures nothing yet (the app may not exist); midstream and brownfield capture the live surfaces that subsequent stages diagnose against.

### Greenfield — build pipeline

Inherits the existing `METHODOLOGY.md` pipeline verbatim. No changes — this variant is the canonical "blueprint" that the rest of the doc describes.

```
Stage 0: Application Legibility (if app exists yet — often deferred to Stage 3)
Stage 1: Research            → research/{current-state,competitive,personas,funnel}/
Stage 2: Design Principles   → prototype/DESIGN.md + testing baseline
Stage 3: Prototype           → portal/ or prototype/ shell
Stage 4: Fact-Check          → Ralph Wiggum convergence loop
Stage 5: Documents           → four-doc package (strategy, feasibility, market, integration)
Stage 6: Deploy              → Vercel / Cloudflare Pages
Stage 7: Iterate             → stakeholder feedback loop
```

### Midstream — hybrid pipeline

The product exists; only the *area the prototype touches* gets diagnosed. Full greenfield research is overkill (you already know the product) and full brownfield audit is misdirected (most of the product isn't being touched). The discipline is **scope the diagnose to the prototype's blast radius**.

```
Stage 0: Application Legibility (mandatory — diagnose the current touchpoint)
Stage 1: Targeted Diagnose   → research/current-state/ (scoped) + research/competitive/ (scoped)
Stage 2: Prescription        → prescription.yml — what changes, why, against what evidence
Stage 3: Design Principles   → prototype/DESIGN.md (inherits from existing product where possible)
Stage 4: Prototype-as-Patch  → portal/ or prototype/ — shows the revision, not a new product
Stage 5: Fact-Check          → Ralph Wiggum convergence loop
Stage 6: Documents           → typically strategy + integration only (skip market research unless the
                               prescription introduces a net-new pattern)
Stage 7: Deploy + Iterate
```

The reason for inserting Prescription before Design Principles (Stage 2 vs greenfield's Stage 2): the prescription names which existing patterns to preserve and which to revise. The design principles inherit accordingly.

### Brownfield — audit pipeline

The product is mature. The deliverables are the diagnose + prescription documents themselves. A prototype is optional — sometimes the design brief is enough; sometimes a tangible reference helps the prescription land. The pattern was first formalized informally in website-nc-v3 (`01-diagnose.md` / `02-prescription.yml` / `03-design-brief.md`) and adopted by the blog blueprint.

```
Stage 0: Application Legibility (mandatory — every audit claim grounds in a captured surface)
Stage 1: Diagnose            → research/{current-state,personas,funnel,competitive}/ + 01-diagnose.md
Stage 2: Prescription        → 02-prescription.yml — what to change, ordered by impact
Stage 3: Design Brief        → 03-design-brief.md — visual + IA direction for the prescribed changes
Stage 4: Prototype (optional) → portal/ only if the brief justifies a tangible artifact
Stage 5: Fact-Check          → Ralph Wiggum convergence loop (mandatory whether or not Stage 4 ran)
Stage 6: Documents           → strategy summary + the three numbered artifacts as the package
Stage 7: Deploy + Iterate    → share-link is the brief if no prototype; the prototype if Stage 4 ran
```

The numbered file convention (`01-` / `02-` / `03-`) is canonical for brownfield. It signals stage ordering at the filesystem level — a reader opening the directory sees diagnose before prescription before brief, with no guessing.

## Required sub-deliverables per stage

Reviewer agents (next section) enforce these. Empty directories next to a stage marked "complete" should trigger a reviewer block, not pass.

| Stage | Variant | Required sub-deliverables |
|---|---|---|
| 1 Research | Greenfield | `current-state/`, `competitive/`, `personas/`, `funnel/` — all four populated |
| 1 Diagnose | Midstream | `current-state/` (scoped to prototype area), `competitive/` (scoped) — two populated |
| 1 Diagnose | Brownfield | `current-state/`, `personas/`, `funnel/`, `competitive/` + `01-diagnose.md` synthesizing them — all five populated |
| 2 Design Principles | Greenfield | `prototype/DESIGN.md` with five visual rules + testing baseline + architectural invariants |
| 2 Prescription | Midstream | `prescription.yml` naming preserved patterns + revised patterns + evidence cite per item |
| 2 Prescription | Brownfield | `02-prescription.yml` with impact-ordered changes + evidence cite per item |
| 3 Prototype / Design Brief | Greenfield | Prototype shell + per-page `_meta/<id>.json` |
| 3 Design Principles | Midstream | Inherited from existing product + delta noted |
| 3 Design Brief | Brownfield | `03-design-brief.md` with visual + IA direction |
| 4 Fact-Check | All | Ralph Wiggum convergence — all reviewer agents pass |
| 5 Documents | All | At minimum the strategy doc; full package per variant |
| 6 Deploy | All | Live URL + green CI gates |

## Reviewer agents per variant

Reviewer agents enforce stage-completion gates. The single source of truth is `template/.claude/agents/`; per-initiative override only when a project tunes thresholds (e.g., midstream's research-completeness requires 2 legs, brownfield requires 5 — same agent, different config).

| Agent | Gate | Greenfield | Midstream | Brownfield |
|---|---|---|---|---|
| `research-completeness-reviewer` | Stage 1 → Stage 2 | ✓ (4 legs) | ✓ (2 legs) | ✓ (5 legs) |
| `design-principles-reviewer` | Stage 2 → Stage 3 | ✓ | — | — |
| `prescription-evidence-reviewer` | Stage 2 → Stage 3 | — | ✓ | ✓ |
| `fact-check-loop-reviewer` | Stage 4 convergence | ✓ | ✓ | ✓ |
| `doc-quality-auditor` | Stage 5 → Stage 6 | ✓ | ✓ | ✓ |
| `terminology-linter` | Stage 5 → Stage 6 | ✓ | ✓ | ✓ |
| `prototype-smoke-runner` | Stage 6 ship | ✓ | ✓ | ✓ (if Stage 4 ran) |

The `fact-check-loop-reviewer` is the orchestrator that fans out to `citation-checker` and `current-state-claim-verifier` (and any future fact-check sub-agents) and decides convergence. Naming convention: the *-reviewer suffix denotes a gate agent; the *-checker and *-verifier suffixes denote leaf sub-agents the orchestrator fans out to.

## Open-question resolutions (carried forward from v2 patch Increment 2)

1. **Reviewer agent location** → **shared** at `template/.claude/agents/`. Per-initiative override only for threshold tuning, never for behavior. Reason: variant-aware reviewer behavior is the multiplier across every future initiative; behavior drift across initiatives defeats the gate.

2. **Convergence loop runtime** → **single orchestrator** initially. Reason: reviewers are currently read-only audit agents; worktree-per-reviewer would buy isolation against a failure mode that does not exist yet. Promote to worktree-per-reviewer when a reviewer gains write authority (e.g., a future auto-fix mode for terminology-linter).

3. **Smoke-flake policy** → **block** for share-link-to-stakeholder paths (greenfield Stage 6, brownfield Stage 6 when a prototype shipped); **follow-up runs** for internal-only paths (midstream intermediate convergence loops where the prototype is not yet shared). Default is block. Reason: Blueprint's audience is VPs clicking Slack links — Codex's throughput argument doesn't transfer to that audience, but does transfer to mid-loop iteration.

## Variant declaration in `blueprint.yml`

Add a top-level `variant` key. Existing initiatives without one default to `greenfield` (matches today's behavior).

```yaml
project:
  name: "..."
  ...

# One of: greenfield | midstream | brownfield
variant: brownfield

stages:
  # Variant-specific stage gating. The reviewer agents read this block to know
  # which sub-deliverables are required before declaring a stage complete.
  stage_1:
    output: "01-diagnose.md"
    requires:
      - "research/current-state/"
      - "research/personas/"
      - "research/funnel/"
      - "research/competitive/"
```

The blog blueprint's existing `variant: "diagnose-prescription-brief"` is the same thing under an older name — it gets aliased to `brownfield` during the cleanup pass on consumer blueprints.

## Cross-references

- Canonical methodology: `wip/big-blueprint/METHODOLOGY.md` (build-variant inherits from this verbatim)
- v2 patch source: `wip/big-blueprint/METHODOLOGY-v2-harness-engineering-patch.md`
- v3 handoff: `wip/big-blueprint/HANDOFF-v3-variant-taxonomy.md`
- Stage 0 reference: `wip/big-blueprint/docs/browser-legibility.md`
- Reviewer agent definitions: `wip/big-blueprint/template/.claude/agents/` (to be populated)
- Brownfield reference impl: `apps/website-nc-v3/blueprint/` (informal) and `apps/blog/blueprint/` (paused at Stage 1)
- Midstream reference impl: `apps/rally-hq/blueprint/` (to be migrated from forced-greenfield)
