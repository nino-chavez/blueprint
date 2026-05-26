# Blueprint Project

Agent-assisted jig for product planning, prototyping, and stakeholder alignment. This file is a **map**, not a manual — pointers to canonical docs, not inlined content. See `blueprint.yml` for project configuration.

## Operating invariants (read before any methodology-shaped work)

These two rules govern the relationship between an initiative's repo and the Blueprint methodology repo. Both are encoded responses to drift modes observed on 2026-05-25.

### 1. Shell is throwaway; artifacts are forever

A Blueprint initiative grows two kinds of directories. They have different durability rules.

| Kind | Directories | Survival rule |
|---|---|---|
| **Evidence** (preserve) | `research/`, `decisions/`, `content/`, `docs/`, `blueprint.yml`, any committed `*.md` capturing rationale | Never delete without explicit "yes, that file" approval. These are the artifacts the methodology exists to produce. |
| **Scaffolding** (throwaway) | `prototype/`, `portal/`, `apps/portal/`, `serve.sh`, `_meta/`, `.smoke-screenshots/`, generated assets | Safe to `rm -rf` when the initiative pivots or restarts. Regenerate from the template via `template/tools/blueprint-init.*`. |

When an initiative loses trust mid-stream and the operator wants to restart from a clean shell: walk the evidence column first, confirm each item is committed, then the scaffolding column is free to delete. The reason this rule needs to be stated explicitly: on 2026-05-25 a restart-mid-session conversation almost lost research artifacts because the boundary between "the messed-up portal" and "the work that produced it" wasn't named. Without this list, the next restart repeats the mistake.

### 2. Methodology freeze during consumer migration

`wip/blueprint/template/` (the methodology source) and any consumer initiative using it cannot evolve in parallel. The drift mode this prevents was the 2026-05-25 four-way root-doc divergence: methodology was being edited under three live consumer sessions simultaneously, and each session produced a different "what is Blueprint" answer.

**The rule, in two directions:**

- While `wip/blueprint/template/` is being edited (methodology change in flight), **no consumer Blueprint session opens.** Consumer sessions paused until the methodology change lands.
- While a consumer initiative is migrating (picking up a methodology update), **no template edits land.** Template changes paused until the consumer migration completes.

Sequenced, not parallel. The methodology repo holds one "live consumer" lock at a time. A second concurrent consumer is fine when the methodology is stable; a second concurrent consumer during methodology edits is forbidden.

Operator check before starting a Blueprint-touching session: `git -C ~/Workspace/dev/wip/blueprint status` and any in-flight consumer worktree should both be clean of methodology edits, or one of them is paused.

## Per-initiative methodology amendments

`METHODOLOGY-AMENDMENTS.md` at the initiative root captures methodology learnings specific to this initiative — gaps you worked around, hooks you added, stages you skipped, candidates for methodology promotion. Append-only, reverse-chronological. Convention: `~/Workspace/dev/wip/blueprint/template/docs/methodology/methodology-amendments-convention.md`.

## Variant declaration (read this first)

Every initiative declares a variant in `blueprint.yml`:

```yaml
variant: greenfield   # or: midstream | brownfield
```

Canonical taxonomy: `~/Workspace/dev/wip/blueprint/docs/variant-selection.md` — pattern-match decision tree, per-variant stage shapes, required sub-deliverables, reviewer-agent gate mapping. Pick the variant before Stage 0 runs.

## Optional capabilities (check `blueprint.yml`)

| Flag | Reference doc | Read when starting |
|---|---|---|
| `b2b_edition.enabled: true` | `~/Workspace/dev/wip/blueprint/docs/bc-b2b-edition-context.md` + `bc-b2b-buyer-portal-integration.md` + `voice-b2b-addendum.md` | Stage 1 research |
| `hive.enabled: true` | `~/Workspace/dev/wip/blueprint/docs/hive-coordination-pattern.md` | Session start — register with Hive before any work |
| `cloudflare.enabled: true` | `~/Workspace/dev/wip/blueprint/docs/cloudflare-deployment-pattern.md` | Before writing infra code; produce ADR for CF resource inventory |
| `archaeology.enabled: true` | `~/Workspace/dev/wip/blueprint/docs/archaeology-substrate-pattern.md` | Stage 0 — run `bash tools/archaeology/scaffold.sh` BEFORE first commit |
| `owner_spec.enabled: true` | `~/Workspace/dev/wip/blueprint/docs/owner-spec-pattern.md` | When project has >3 substrate tools |
| Marketplace app (any BC initiative) | `~/Workspace/dev/wip/blueprint/docs/bc-marketplace-context.md` | Stage 1 research |

## Pipeline

Pipeline shape depends on the variant. The greenfield variant is the canonical reference; midstream and brownfield diverge per `docs/variant-selection.md`.

```
[Stage 0: Application Legibility] → /blueprint-research → /blueprint-prototype → /blueprint-docs → /blueprint-validate → /blueprint-deploy → /blueprint-triage
```

## Stage 0 — browser sensor

Default sensor: `browse-tool`. Install once per initiative:

```bash
export PATH="$HOME/Workspace/dev/tools/browse-tool/bin:$PATH"
# In Claude Code: /add-dir /Users/nino/Workspace/dev/tools/browse-tool
```

Override the per-initiative profile name (`--profile-name <initiative-slug>-blueprint`) and claim the next free port in `serve.sh`. Full reference + escalation rubric: `~/Workspace/dev/wip/blueprint/docs/browser-legibility.md`.

## Skills

| Command | Stage | What it does |
|---|---|---|
| `/blueprint-research` | Research / Diagnose | Codebase exploration, competitive analysis, market comparables |
| `/blueprint-prototype` | Prototype | Build HTML pages, strategy/current-state panels, landing page |
| `/blueprint-docs` | Documents | Generate strategy, feasibility, research, integration docs |
| `/blueprint-validate` | Fact-Check | Reviewer-loop convergence + diagnose-loop structured fixes |
| `/blueprint-deploy` | Deploy | Package and deploy to Vercel / Cloudflare Pages |
| `/blueprint-triage` | Iterate | Triage stakeholder feedback through state machine |

## Agents

Four workhorse agents under `.claude/agents/blueprint/`:

| Agent | Role |
|---|---|
| `researcher` | Codebase exploration, screenshot analysis, web research |
| `prototype-builder` | HTML/CSS pages matching existing product, strategy/current-state panel config |
| `doc-writer` | Strategic documents in the voice declared by `blueprint.yml` voices block |
| `validator` | **Deprecated** — superseded by the reviewer set. See `.claude/agents/blueprint/reviewers/README.md`. |

## Reviewer agents — stage gates

Variant-aware gates that block premature stage completion. Full roster + behavior: `.claude/agents/blueprint/reviewers/README.md`.

| Gate | Reviewer(s) |
|---|---|
| Stage 0 → 1 | `pilot-profile-lock-reviewer` |
| Stage 1 → 2 | `research-completeness-reviewer` |
| Stage 2 → 3 (greenfield) | `design-principles-reviewer` |
| Stage 2 → 3 (midstream / brownfield) | `prescription-evidence-reviewer` |
| Stage 3 completion (Pattern A) + any `apps/portal/` commit | `portal-pattern-a-conformance-reviewer` |
| Stage 3 completion (Pattern B) + any `portal/` or `blueprint/portal/` commit | `portal-pattern-b-conformance-reviewer` + `portal-chrome-canonical-reviewer` |
| Stage 4 convergence | `fact-check-loop-reviewer` (orchestrator) |
| Stage 5 → 6 | `doc-quality-auditor` + `terminology-linter` (parallel) |
| Stage 6 ship | `prototype-smoke-runner` |

Run exactly one of the two portal-conformance reviewers per initiative — pick by pattern (A or B) per `docs/portal-and-tier-ladder.md`.

## Document voice

Per `blueprint.yml` `voices:` block. Canonical voice rules + quality audit + citation rules + anti-patterns: `~/Workspace/dev/wip/blueprint/docs/voice-template.md`. B2B-specific addendum (loaded only when `b2b_edition.enabled: true`): `docs/voice-b2b-addendum.md`.

## Prototype design

Visual rules + architectural invariants: `prototype/DESIGN.md`. Both are checked at Stage 4 by the reviewer agents.

## Configuration

Edit `blueprint.yml` for: variant, execution depth, voice modes, prototype settings, research scope, document package, optional-capability flags.

## Scaffolding a new initiative (Pattern A)

Do not copy `template/apps/portal/` by hand. Use the stamper:

```bash
node ~/Workspace/dev/wip/blueprint/template/tools/blueprint-init/stamp.mjs \
  --name=<project-slug> \
  --display-name="<Project Display Name>" \
  --repo-url=https://github.com/<owner>/<repo> \
  --tagline="<one-line tagline>" \
  --variant=greenfield|midstream|brownfield \
  --tier=0|1|2 \
  --pattern=A \
  --target=<absolute path to initiative root>
```

The stamper substitutes the subs-initiative reference strings, renames the logo, writes a `blueprint.yml` with variant + tier + pattern, validates against the Variant × Tier matrix in `docs/portal-and-tier-ladder.md`, and runs a post-stamp grep that fails the exit code if any unexpected source strings remain. See `template/tools/blueprint-init/README.md` for the full contract. Pattern B has no stamper yet — copy `template/portal/` and rely on `portal-pattern-b-conformance-reviewer` to catch drift at Stage 3.

## Session prompts

Reusable prompts for common Blueprint adoption / update scenarios:

- `~/Workspace/dev/wip/blueprint/docs/prompts/add-blueprint-to-project.md` — paste at start of a fresh session in a project taking on Blueprint for the first time
- `~/Workspace/dev/wip/blueprint/docs/prompts/pick-up-blueprint-updates.md` — paste in a session resuming an existing Blueprint initiative to refresh methodology context

## SessionStart canonical-context injection (required)

Install `template/.claude/hooks/blueprint-session-start.py` to `~/.claude/hooks/` and merge the SessionStart block from `template/.claude/settings.json.example` into `~/.claude/settings.json`. The hook detects Blueprint initiatives (walks up for `blueprint.yml`) and injects `METHODOLOGY.md` + `docs/variant-selection.md` + `docs/portal-and-tier-ladder.md` at the top of every session.

**Why this is mandatory, not optional**: on 2026-05-25, three live consumer sessions reasoned about Blueprint shape from first principles instead of reading the canonical docs, then disagreed about what Blueprint is. Failing to encode this is a direct violation of Blueprint's own first principle (`METHODOLOGY.md` § "First Principle: Agent Struggle Is a Missing Capability") applied to Blueprint itself. The session-prompts paste-snippets above are a fallback for operators who haven't installed the hook; the hook is the encoding.

## Converter

`node docs/scripts/md-to-docs.mjs docs/content/my-doc.md --out docs/deliverables/`
