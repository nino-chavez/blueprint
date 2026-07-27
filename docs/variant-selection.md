# Variant Selection

**Canonical reference for picking the right blueprint variant at project init.**

Blueprint serves four distinct project lifecycles. Each has its own stage sequence, deliverables, and reviewer-agent gates. Pick the variant *before* the first stage runs — the wrong variant produces retrofit feel that cannot be un-retrofitted without restarting.

| Variant | When the work is… | Center of gravity | Canonical artifact set |
|---|---|---|---|
| **Greenfield (build)** | A new product. No production surfaces. North-star-driven. | Prototype as the central deliverable. | Research → Design Principles → Prototype → Docs |
| **Midstream (hybrid)** | An active, mid-development product. Prototype revises in-flight work. | Targeted diagnose + revision prototype. | Targeted Diagnose → Prescription → Prototype-as-Patch → Docs |
| **Brownfield (audit)** | A mature, live, under-audited product. Prototype optional. | Diagnose + prescription as the deliverables. | Diagnose → Prescription → Design Brief → (optional Prototype) |
| **Research (strategy)** | Not a product at all — a decision/strategy question driven by input assets (briefs, decks, datasets). | Decision memo + grounded evidence. Portal optional (provenance only). | Inputs Intake → Personas/JTBD → Research → Synthesis/Decisions → Decision Memo |

If no variant is selected, the methodology defaults to greenfield — which is wrong for **three of four** lifecycles. Selection happens at `blueprint.yml` init, before Stage 0 runs.

> **Check variant-fit BEFORE you stamp — `init` does not.** The greenfield default + the full Initiative Portal is the wrong shape for a decision/strategy question, and the cost is paid in throwaway scaffolding. Fast triage on the input: **is there a product (built or being built)?** No, and the input is a brief / deck / dataset / a "should we build this / is this investable?" question → **`research`**, not greenfield. Stamping greenfield here gives you the product-build pipeline and a portal no stakeholder can use — exactly the failure the research variant exists to prevent. Observed twice now (mrr-automation dogfood; ChapterZero, which ran research→prototype→docs→validate→deploy on a greenfield stamp before the variant was corrected — see `METHODOLOGY-AMENDMENTS.md` 2026-06-25).

## Pattern-match decision tree

Run this at project init. Answer in order; first "yes" wins.

```
0. Is the deliverable a decision or strategy recommendation — not a product or prototype?
   (Work starts from input assets — briefs, decks, datasets — and ends in a memo someone acts on.)
   └─ Yes → Research
   └─ No  → continue

1. Is the product already live in production with real users?
   └─ No  → Greenfield
   └─ Yes → continue

2. Is the work scoped to active in-flight development (new features, mid-build revisions, north-star
   surfaces that don't exist yet)?
   └─ Yes → Midstream
   └─ No  → continue

3. Is the work audit-first — diagnose what exists, prescribe changes, optionally prototype the result?
   └─ Yes → Brownfield
   └─ No  → review the answers; one of the four should fit. If genuinely none of them do, the
            project may not be a blueprint candidate.
```

**Worked examples:**

- **Rally HQ** — live tournament platform, but blueprint work targets unbuilt north-star surfaces (multi-format support, league standings, bracket export). Q1=yes, Q2=yes → **midstream**.
- **website-nc-v3** — existing v2 site, blueprint work is an audit-driven redesign. Q1=yes, Q2=no (no in-flight build), Q3=yes → **brownfield**.
- **Signal Dispatch blog** — live blog (275 items, RSS subscribers), blueprint work is UX/UI/CX audit. Q1=yes, Q2=no, Q3=yes → **brownfield**.
- **the subscriptions initiative** — gated; revisit at session reopen.
- **A new product idea (no code yet)** — Q1=no → **greenfield**.

## The entropy wall — the signal that it's time to adopt

Teams that vibe-coded their way to a working product rarely arrive at this doc from first principles — they arrive because the build stopped feeling fast. That moment has a recognizable signature. If two or more of these are true, the product has hit the entropy wall, and the answer to "which variant" is **midstream** (still actively building) or **brownfield** (mature, needs an audit before more building):

1. **The codebase grows outward, not denser.** Every feature lands in its own file with its own patterns; utilities get reimplemented because the agent didn't know they existed.
2. **Bugs cluster at the seams between features**, not inside them.
3. **PRs are getting harder to review** — you can't tell whether code is intentionally different or just inconsistently generated.
4. **Docs lag the code**, so the agent can't reference what the product already does — and starts contradicting or duplicating it.

None of this means the vibe coding failed; demand-first building is how the product earned the right to structure (the Glass/Ramp case in `research/03-comparable-glass-ramp.md` hit this exact wall at ~20 daily users and retrofitted gates rather than rewriting). The wall is the signal that the missing capability is now *coherence*, not features. Adopting at Tier 0 costs one stamped `blueprint.yml` + the reviewer gates; the alternative is paying the wall tax compounding on every subsequent feature. Once adopted, the `defrag-reviewer` cadence pass is the standing repair for signal #1 and #3, and `doc-currency-reviewer` for #4.

## Stage shapes per variant

All four variants share a Stage 0, but research uses **Inputs Intake** rather
than Application Legibility. Greenfield may have no app to capture yet;
midstream and brownfield capture live surfaces that subsequent stages diagnose;
research catalogs the input assets its later claims must resolve to.

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

### Research — strategy pipeline

There is no product to build, prototype, or audit. The work starts from **input assets** (briefs, decks, datasets, dashboards) and ends in a **decision memo** someone acts on. The two failure modes this pipeline exists to prevent — both observed in the mrr-automation dogfood (`METHODOLOGY-AMENDMENTS.md` 2026-06-16) — are (a) synthesizing before grounding in *who the work is for*, and (b) producing product-shaped scaffolding (a portal, frontmatter ceremony, "axioms") that no stakeholder can use. The persona/JTBD gate fixes (a); the decision-memo-as-deliverable + `persona-fit-reviewer` fix (b).

```
Stage 0: Inputs Intake       → research/sources/ — provenance catalog of every input asset
                               (author, date, type, where it lives, verification status)
Stage 1: Personas & JTBD     → research/personas-and-jtbd.md — input-grounded personas + jobs
                               (MANDATORY GATE; persona-fit-reviewer blocks downstream work without it)
Stage 2: Research            → research/{problem-space,competitive,prior-art}/ — primary-source-grounded
Stage 3: Synthesis & Decisions → decisions/ ADRs, each with serves: tracing to a persona job
Stage 4: Fact-Check          → primary-source reconciliation + verification (the highest-value gate
                               for a strategy call — claims verified against authoritative sources, not self-attested)
Stage 5: Decision Memo       → docs/decision-memo.md (the deliverable) + evidence appendix;
                               optional companion deck via Forge Signal (Executive Advisory)
Stage 6: Deliver             → share the memo (+ deck) where the audience is; portal optional, provenance-only
Stage 7: Iterate
```

The repo is the **reasoning/provenance layer** (correct, git-native, keep it). The **deliverable** is the memo — a rendered artifact for humans who don't live in git. Conflating the two (treating the portal as the deliverable) is the canonical research-variant mistake.

**The deployed deliverable shape (when the audience is non-technical and a repo link won't do).** "Portal optional, provenance-only" does not mean "nothing deployed." The shape that works: the deployed page **is** the decision memo — one scroll, `argument → embedded interactive proof (the optional prototype) → research-as-evidence → honest economics → recommendation` — consolidating the memo, any demo, and the evidence into one forwardable link. It stays faithful to "the deliverable is the memo"; it just renders the memo for humans who don't live in git, rather than handing them a portal to navigate. Two reuse notes: (a) **ground the stakeholder chat in a `session-log`, not only the final docs** — a `docs/content/session-log.md` capturing the session's decisions/reasoning, compiled into the chat corpus, lets it answer "why did you conclude X?" not just "what does the doc say"; (b) **passphrase-gate it** with a Pages-Functions middleware (see `docs/patterns/cloudflare-deployment-pattern.md`) so a private analysis can be shared by link without exposing the repo. (ChapterZero, 2026-06-25.)

**Fact-check for research is internal reconciliation, not just external citation-checking.** Inputs are often confidential binaries (not URL-resolvable) and there is no running app to verify current-state claims against, so the standard `fact-check-loop-reviewer` fan-out (citation-checker + current-state-claim-verifier) only half-applies. The highest-value Stage-4 check is **cross-asset reconciliation** — does source A's figure match source B's? does the recommended "live" signal match what FinOps actually pays on? — plus an independent re-pull of any *external* claim the inputs cite (never trust an input's own citation appendix). Two source hazards to handle explicitly: (a) **un-openable / operator-relayed assets** — record `verification: relayed` in `research/sources/` and cross-check the relayed figures against another asset; (b) **partly-illustrative primary sources** (e.g. a prototype dashboard mixing real and placeholder rows) — cite the asset only for its real rows, and use placeholder rows to describe risk *shape*, never as fact. (Both hazards surfaced in the mrr-automation dogfood.)

## Foundation stage placement (when `foundation.enabled: true`)

The Foundation stage (Stage S-B) is an optional capability stage that activates when declared in `blueprint.yml`. It runs after Stage 1 (Research / Targeted Diagnose / Diagnose) and BEFORE feature-spec implementation or feature prototyping. Its purpose: declare the scope model, archetype taxonomy, token/type/icon/component-anatomy contracts, and enforcement scaffold that all downstream feature work renders into.

**When the stage is enabled:**

| Variant | Placement | Reason |
|---|---|---|
| **Greenfield** | After Stage 1 Research, before Stage 2 Design Principles | Greenfield routes are planned; Foundation declares which are account-scope vs entity-scope and which archetype each occupies before Design Principles authors the rules those archetypes use. |
| **Midstream** | After Stage 1 Targeted Diagnose, before Stage 2 Prescription | The product exists; Foundation reconciles existing routes against scope/archetype, discovers drift, and prescribes the enforcement scaffold before any revision features are specced. |
| **Brownfield** | After Stage 1 Diagnose, before Stage 2 Prescription | Brownfield is audit-first; Foundation is a sub-audit within that (layout/nav-specific reconciliation) that feeds into the overall prescription. |
| **Research** | N/A | Foundation applies only to initiatives building products. Skip for research variants. |

**When to skip:** throwaway prototype that won't outlive the week, single-purpose single-route deliverable, or initiatives with no plan for multi-session feature work.

**When the gate runs:** `foundation-stage-reviewer` enforces the stage gate when `foundation.enabled: true` and blocks downstream work until all five declarations are present and the enforcement scaffold is wired.

## Required sub-deliverables per stage

Reviewer agents (next section) enforce these. Empty directories next to a stage marked "complete" should trigger a reviewer block, not pass.

| Stage | Variant | Required sub-deliverables |
|---|---|---|
| 1 Research | Greenfield | `current-state/`, `competitive/`, `personas/`, `funnel/` — all four populated |
| 1 Diagnose | Midstream | `current-state/` (scoped to prototype area), `competitive/` (scoped) — two populated |
| 1 Diagnose | Brownfield | `current-state/`, `personas/`, `funnel/`, `competitive/` + `01-diagnose.md` synthesizing them — all five populated |
| 0 Inputs Intake | Research | `research/sources/` — provenance catalog of every input asset (author, date, type, verification status) |
| 1 Personas/JTBD | Research | `research/personas-and-jtbd.md` — input-grounded personas + jobs with observable acceptance (MANDATORY gate) |
| 2 Research | Research | `research/{problem-space,competitive,prior-art}/` — primary-source-grounded; ≥3 legs |
| 3 Synthesis | Research | `decisions/` ADRs, each with a `serves:` field tracing to a persona job |
| 5 Decision Memo | Research | `docs/decision-memo.md` — the deliverable; portal optional (provenance only) |
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

**Research variant reviewers.** Research swaps the prototype/portal gates for `persona-fit-reviewer` (Stage 1 → 2 gate, plus every decision/memo/portal surface must trace to a persona job or be cut as vanity), keeps `research-completeness-reviewer` (3 legs: problem-space, competitive, prior-art), `fact-check-loop-reviewer` (primary-source verification — the highest-value gate for a strategy call), and `doc-quality-auditor` (the decision memo). The portal-conformance reviewers do NOT run — the portal is optional provenance, not the deliverable. Unlike greenfield (where JTBD-trace is deferred per ADR-0004), research makes persona-job traceability mandatory from Stage 1.

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

# One of: greenfield | midstream | brownfield | research
variant: research

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

- Canonical methodology: `tools/blueprint/METHODOLOGY.md` (build-variant inherits from this verbatim)
- v2 patch source (archived historical record): `tools/blueprint/docs/_archive/handoffs/METHODOLOGY-v2-harness-engineering-patch.md`
- v3 handoff (archived historical record): `tools/blueprint/docs/_archive/handoffs/HANDOFF-v3-variant-taxonomy.md`
- Stage 0 reference: `tools/blueprint/docs/context/browser-legibility.md`
- Reviewer agent definitions: `tools/blueprint/template/.claude/agents/blueprint/reviewers/` (12 executable reviewers + 3 spec-only)
- Brownfield reference impl: `apps/website-nc-v3/blueprint/` (informal) and `apps/blog/blueprint/` (paused at Stage 1)
- Midstream reference impl: `apps/rally-hq/blueprint/` (to be migrated from forced-greenfield)
