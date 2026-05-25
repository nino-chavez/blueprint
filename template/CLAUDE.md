# the original employer-prefixed name Project

Agent-assisted jig for product planning, prototyping, and stakeholder alignment. This file is a **map**, not a manual — pointers to canonical docs, not inlined content. See `blueprint.yml` for project configuration.

## Variant declaration (read this first)

Every initiative declares a variant in `blueprint.yml`:

```yaml
variant: greenfield   # or: midstream | brownfield
```

Canonical taxonomy: `~/Workspace/dev/wip/big-blueprint/docs/variant-selection.md` — pattern-match decision tree, per-variant stage shapes, required sub-deliverables, reviewer-agent gate mapping. Pick the variant before Stage 0 runs.

## Optional capabilities (check `blueprint.yml`)

| Flag | Reference doc | Read when starting |
|---|---|---|
| `b2b_edition.enabled: true` | `~/Workspace/dev/wip/big-blueprint/docs/bc-b2b-edition-context.md` + `bc-b2b-buyer-portal-integration.md` + `voice-b2b-addendum.md` | Stage 1 research |
| `hive.enabled: true` | `~/Workspace/dev/wip/big-blueprint/docs/hive-coordination-pattern.md` | Session start — register with Hive before any work |
| `cloudflare.enabled: true` | `~/Workspace/dev/wip/big-blueprint/docs/cloudflare-deployment-pattern.md` | Before writing infra code; produce ADR for CF resource inventory |
| `archaeology.enabled: true` | `~/Workspace/dev/wip/big-blueprint/docs/archaeology-substrate-pattern.md` | Stage 0 — run `bash tools/archaeology/scaffold.sh` BEFORE first commit |
| `owner_spec.enabled: true` | `~/Workspace/dev/wip/big-blueprint/docs/owner-spec-pattern.md` | When project has >3 substrate tools |
| Marketplace app (any BC initiative) | `~/Workspace/dev/wip/big-blueprint/docs/bc-marketplace-context.md` | Stage 1 research |

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

Override the per-initiative profile name (`--profile-name <initiative-slug>-blueprint`) and claim the next free port in `serve.sh`. Full reference + escalation rubric: `~/Workspace/dev/wip/big-blueprint/docs/browser-legibility.md`.

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
| Stage 1 → 2 | `research-completeness-reviewer` |
| Stage 2 → 3 (greenfield) | `design-principles-reviewer` |
| Stage 2 → 3 (midstream / brownfield) | `prescription-evidence-reviewer` |
| Stage 4 convergence | `fact-check-loop-reviewer` (orchestrator) |
| Stage 5 → 6 | `doc-quality-auditor` + `terminology-linter` (parallel) |
| Stage 6 ship | `prototype-smoke-runner` |

## Document voice

Per `blueprint.yml` `voices:` block. Canonical voice rules + quality audit + citation rules + anti-patterns: `~/Workspace/dev/wip/big-blueprint/docs/voice-template.md`. B2B-specific addendum (loaded only when `b2b_edition.enabled: true`): `docs/voice-b2b-addendum.md`.

## Prototype design

Visual rules + architectural invariants: `prototype/DESIGN.md`. Both are checked at Stage 4 by the reviewer agents.

## Configuration

Edit `blueprint.yml` for: variant, execution depth, voice modes, prototype settings, research scope, document package, optional-capability flags.

## Converter

`node docs/scripts/md-to-docs.mjs docs/content/my-doc.md --out docs/deliverables/`
