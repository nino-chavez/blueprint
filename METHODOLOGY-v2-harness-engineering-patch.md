# METHODOLOGY v2 — Harness Engineering Patch

**Status**: Increment 1 (Stage 0) **LANDED in `METHODOLOGY.md` 2026-05-25** — this doc is the historical proposal + the deferred increments. Stage 0 is now canonical; the section below describes what got promoted. Increment 2 (Ralph Wiggum Loop) was reshaped by the v3 variant taxonomy and the reviewer agents now live at `template/.claude/agents/blueprint/reviewers/`. Increment 3 (Map-not-manual + janitor + invariants) remains deferred.
**Source**: OpenAI, *Harness engineering: leveraging Codex in an agent-first world* (Ryan Lopopolo, Feb 11, 2026). Their 5-month / 1M-line / 1,500-PR / 3-engineer experiment.
**Scope**: Adds one stage, restructures one stage, codifies four cross-cutting disciplines. Does not change the existing seven-stage pipeline's outputs.

> **Forward-pointer**: Stage 0 canonical reference is now `METHODOLOGY.md` §"Stage 0: Application Legibility" + `docs/browser-legibility.md`. The reviewer agents promised in Increment 2 are defined at `template/.claude/agents/blueprint/reviewers/` with variant-aware gates documented in `docs/variant-selection.md`. The Stage 0 section that follows below is preserved for historical context.

## Why this patch exists

The Codex experiment surfaced primitives BigBlueprint either lacks or does manually. The gap that matters: BigBlueprint's agent can produce a deployed prototype but cannot *validate its own work in the browser*, cannot run a closed convergence loop against named reviewers, and cannot encode lint failures as remediation prompts. Stakeholder polish suffers as a result — fact-check and iterate stages stall on human attention.

The fix is not to rebuild the pipeline. The fix is to make the existing pipeline's sensors agentic and the existing knowledge base structurally legible.

## Diff summary

| Section | Current state | Proposed change |
|---|---|---|
| Stage 0 (new) | — | **Application Legibility** — make the running app inspectable by the agent before any other stage runs |
| Stage 4 | Fact-Check as one-shot human-supervised pass | **Ralph Wiggum Loop** — multi-reviewer convergence with named agent reviewers |
| Knowledge base | Per-initiative `CLAUDE.md` grows monolithic | **Map, not manual** — short `AGENTS.md` (~100 lines) + structured `docs/` tree |
| DESIGN.md | Five visual/IA rules | Adds **architectural invariants** section (boundary parsing, layer direction, Providers interface) |
| CI gates | Generic lint errors | **Lint errors as remediation prompts** — every error message teaches the fix |
| Janitor work | Doc-surface discipline activates at >50 docs + ≥1 pivot | **Continuous low-cost janitor** — drop threshold gating |
| Origin / meta | Implicit | Promote **"agent struggle is a missing capability"** to a first principle |

---

## Stage 0: Application Legibility (new)

Add a stage *before* Stage 1 (Research). The reason for placing it at zero rather than appending: every downstream stage benefits when the agent can drive the deployed product itself, and the wiring is once-per-initiative.

### What it produces

A repo where the agent can:

1. **Boot the prototype per git worktree** — every `git worktree add` produces an independently runnable instance. Codex's pattern; works for Vercel local dev (`vercel dev`) and for the static `portal/` shell (`python -m http.server` or `npx serve`).
2. **Navigate, snapshot, and screenshot the running UI** — to validate that the strategy panel actually opens, the current-state drawer toggles, the chat widget loads, etc.
3. **Pick selectors interactively** — when stakeholder feedback references "that button on the second card," the agent gets the selector without guessing.

### Default sensor: `browse-tool`

`browse-tool` (`~/Workspace/dev/tools/browse-tool`) is the default because Chrome DevTools MCP costs ~18k tokens of always-loaded schema, browse-tool's README costs a few hundred tokens loaded on-demand, and the four primitives the harness actually needs (`browse-start` / `browse-nav` / `browse-eval` / `browse-screenshot`) cover the entire stakeholder-prototype validation surface.

**Install** (once per initiative):

```bash
# Add browse-tool bins to PATH
export PATH="$HOME/Workspace/dev/tools/browse-tool/bin:$PATH"

# Make the README discoverable to the agent
# In Claude Code: /add-dir /Users/nino/Workspace/dev/tools/browse-tool
```

**Agent contract** — the `prototype/` directory's `CLAUDE.md` declares:

```markdown
## Browser sensor
- Default: browse-tool. See @~/Workspace/dev/tools/browse-tool/README.md
- Persistent profile: browse-tool picks profile by cwd basename automatically
- For most validation: browse-nav + browse-eval + browse-screenshot are sufficient
```

### Escalation: Chrome DevTools MCP

Promote to MCP only when the task description contains one of these triggers, because each is something `browse-eval` cannot synthesize from DOM access alone:

| Trigger phrase | Reason MCP is required |
|---|---|
| "capture network requests" / "watch XHR" | `browse-eval` can call `fetch` but cannot intercept ambient traffic |
| "stream console errors" / "log capture" | Same — `eval` reads page state, doesn't subscribe to console events |
| "lighthouse audit" / "perf trace" | MCP wraps the CDP performance domain directly |
| "accessibility tree" / "ARIA snapshot" | MCP exposes the a11y tree; DOM-only eval misses computed ARIA |

When none of these fire, the agent does not load MCP schemas. The reason is token economics: a Blueprint initiative's CLAUDE.md plus its docs/ tree already pushes context budget; 18k of unused MCP schema crowds out the design-docs the agent actually needs.

### Optional: ephemeral observability stack

For initiatives whose prototype includes telemetry (production-grade Rally HQ-tier work, not stakeholder mockups), wire a local LogQL/PromQL/TraceQL stack per worktree per Codex's pattern. Out of scope for typical stakeholder prototypes — `portal/` static-HTML initiatives skip this entirely.

---

## Stage 4 (restructured): Ralph Wiggum Loop

The current Stage 4 is a one-shot validation pass against screenshots, codebase, and data. The Codex pattern replaces this with a **closed convergence loop**: the agent produces a change, runs named reviewer agents, responds to each reviewer's feedback, and only exits when *all* reviewers pass.

### Reviewer roster (Blueprint-specific)

| Reviewer agent | Validates | Pass criterion |
|---|---|---|
| `citation-checker` | Every market-research citation in `docs/research/` and every strategy-panel claim resolves to a real source | Zero unresolved citations |
| `current-state-claim-verifier` | Every "this is what exists today" claim matches a screenshot in `prototype/current-state/` | Zero claims without a matching screenshot crop |
| `doc-quality-auditor` | Every shipped doc passes the four-check audit (so-what placement, mental math, logic gaps, scannable format) | All four checks green per doc |
| `terminology-linter` | No internal jargon leaks into user-facing copy | Zero terms outside the approved glossary |
| `prototype-smoke-runner` | All `@smoke`-tagged Playwright specs pass against the local boot | 100% pass |

### Loop shape

```
agent.produce_change()
loop:
  results = parallel_run(reviewers)
  if all(r.passed for r in results):
    break
  agent.respond_to_feedback(results)
end
mark_ready_for_stakeholder_share()
```

The reason for parallel reviewer execution is wall-clock: serial review would stall the loop on the slowest reviewer (typically `doc-quality-auditor`), and the reviewers are independent.

### What this replaces

Stage 7 (Iterate) keeps stakeholder feedback as a separate human-driven loop. Stage 4 stops being a one-shot and becomes the *automated convergence gate* before the share-link is released. The split is intentional because human review is expensive and should land on a prototype that already passed every check the agent can run.

---

## Knowledge base: map, not manual

### Current failure mode

Per-initiative `CLAUDE.md` files grow as the initiative evolves. By month two they hit the four failures Codex documented:

- **Context is scarce** — a 2000-line CLAUDE.md crowds out the actual design-docs and code
- **Too much guidance becomes non-guidance** — every rule "important," nothing prioritized
- **It rots instantly** — half the rules describe state from week one that no longer applies
- **Hard to verify** — single blob defeats freshness checks, coverage checks, ownership

### Proposed structure

Replace the monolithic CLAUDE.md with a short *map* plus a structured *system of record*:

```
my-initiative/
├── AGENTS.md                   # ~100 lines. Map only. Pointers to docs/.
├── ARCHITECTURE.md             # Top-level domain + layering map
├── docs/
│   ├── design-docs/
│   │   ├── index.md            # Catalog with verification-status column
│   │   └── core-beliefs.md     # Agent-first operating principles
│   ├── exec-plans/
│   │   ├── active/             # In-flight initiative work
│   │   ├── completed/          # Archived plans with decision logs
│   │   └── tech-debt-tracker.md
│   ├── product-specs/          # Per-feature specs the agent can resolve
│   ├── quality-scores.md       # Per-domain × per-layer grades, updated by janitor
│   └── references/             # Pointers to external corpora (BC, Cloudflare, etc.)
├── DESIGN.md                   # Visual/IA + architectural invariants (see next section)
├── prototype/
└── research/
```

The `AGENTS.md` file is a map. The docs/ tree is the territory. The reason for the split is that the agent loads AGENTS.md every session but resolves docs/ entries on demand — same scarcity principle as the MCP token argument.

### Verification-status column

`docs/design-docs/index.md` carries a status column per doc: `current` / `superseded-by:X` / `stale-needs-review`. The janitor (below) updates this column on its cadence.

---

## DESIGN.md additions: architectural invariants

Current DESIGN.md codifies five *visual/IA* rules. Codex enforces a parallel set of *architectural* invariants that prevent agent drift across the codebase. Blueprint's prototypes are smaller, so the set is smaller — but the principle (enforce invariants, not implementations) applies.

Append to `prototype/DESIGN.md`:

```markdown
## Architectural invariants

These are enforced mechanically via lints + structural tests. They constrain *what* must be true, not *how* it's implemented — the agent picks the library.

1. **Boundary parsing required** — every external input (URL params, postMessage, fetch response) is parsed at the boundary. Choice of parser (Zod, Valibot, hand-rolled) is unconstrained.
2. **Strategy-panel pages declare their own metadata** — page declares `window.PROTO_PAGE = { id }`; everything else flows from `_meta/<page-id>.json`. No inline strategy content in page HTML.
3. **Cross-cutting concerns through a single Providers interface** — analytics, feature flags, auth state, telemetry. Pages do not reach for these directly.
4. **One primary action per page (lint-enforced)** — already a visual rule. Promote to a structural check counting `[data-primary-cta]` per page.
```

### Lint errors as remediation prompts

When a custom lint fires, its error message must include the *fix*, not just the violation, because the agent that reads the error is the agent that will write the patch. The cost is one extra sentence per lint rule; the multiplier is every CI run that becomes self-healing.

Example diff:

```diff
- "Page has 2 primary CTAs"
+ "Page has 2 primary CTAs. Blueprint enforces one. Remove the [data-primary-cta] attribute from the secondary action and re-style as a tertiary link. See DESIGN.md rule 4."
```

---

## Janitor: continuous, not threshold-gated

The current `doc-surface-discipline-pattern.md` activates at >50 docs + ≥1 pivot. The Codex pattern runs the janitor *continuously* at low cost, because drift compounds otherwise — by the time you hit 50 docs, the cleanup is painful.

### Janitor tasks (run on cadence, not on threshold)

| Task | Cadence | Output |
|---|---|---|
| Scan `docs/design-docs/index.md` for files that haven't been touched + verification-status `current` | Daily | Open `stale-needs-review` annotation PR |
| Re-score every domain × layer in `quality-scores.md` | Per merge to main | Update the score table |
| Scan strategy-panel citations against the research corpus | Weekly | Open `citation-broken` PR per dead reference |
| Detect duplicated patterns across `prototype/` pages | Weekly | Open consolidation PR |

The reason for cadence vs. threshold is the Codex observation that AI debt is high-interest. Paying it down in small daily increments is cheaper than letting it compound and tackling it in painful bursts.

---

## First principle: "agent struggle is a missing capability"

Promote this to the Origin section of METHODOLOGY.md. When the agent fails at a stage, the response is *never* "try harder" or "prompt better." The response is:

1. Identify what's missing — tool, guardrail, doc, sensor, invariant
2. Encode it into the repo (lint, doc, skill, reviewer agent)
3. Have the agent itself write the encoding
4. Re-run the stage

The reason this matters is that the alternative — patching prompts session-by-session — produces zero compounding leverage. Every encoded capability multiplies across every future initiative.

---

## Migration plan

This patch lands in three increments to keep blast radius small:

### Increment 1 — Stage 0 + browse-tool default (low risk)

- Add Stage 0 section to METHODOLOGY.md
- Add browse-tool install instructions to `template/CLAUDE.md`
- Document the MCP escalation rubric in `docs/browser-legibility.md`

Reversibility: pure additive. Existing initiatives ignore Stage 0 until they need it.

### Increment 2 — Ralph Wiggum Loop + reviewer agents (medium risk)

- Write each reviewer as a Claude Code subagent definition under `template/.claude/agents/`
- Replace Stage 4's one-shot text with the loop shape
- Wire the loop into CI for new initiatives only

Reversibility: existing initiatives keep one-shot Stage 4. Migrate per-initiative.

### Increment 3 — Map-not-manual + janitor + invariants (higher risk)

- Restructure `template/` to use AGENTS.md + docs/ tree
- Add quality-scores.md + verification-status convention
- Activate janitor on cadence

Reversibility: scoped to new initiatives spawned from the updated template. Existing initiatives migrate when they hit the next pivot, not retroactively.

---

## Open questions to resolve before increment 2

1. **Reviewer agent definitions** — should they live in `~/Workspace/dev/wip/big-blueprint/template/.claude/agents/` (shared) or per-initiative? The shared path lets every initiative benefit from improvements, but per-initiative lets each project tune reviewer thresholds.
2. **Convergence loop runtime** — Claude Code's `Agent` tool with `isolation: "worktree"` per reviewer, or a single orchestrator agent that fans out and merges results? The orchestrator is simpler; the worktree-per-reviewer is more honest about isolation.
3. **Threshold for the prototype-smoke-runner** — block on any `@smoke` failure, or allow up to N flakes per Codex's "follow-up runs over blocking"? Blueprint's audience (VPs clicking a share-link) argues for blocking; Codex's argument was internal devs.

These don't block increment 1. Resolve when increment 2 starts.

---

## What this patch does *not* propose

- Throwing out the seven-stage pipeline. The pipeline is the value; this patch upgrades its sensors.
- Adopting Codex's "minimal blocking merge gates" for the stakeholder share-link. Blueprint's audience is different — the VP-clicks-Slack-link case still requires green gates.
- Adopting Codex's "0 lines of manually-written code" constraint. Blueprint isn't building a product end-to-end with the agent; it's producing strategic deliverables. The constraint doesn't transfer.

## Origin

Conversation 2026-05-25 reviewing the OpenAI harness engineering post against current BigBlueprint methodology. PDF source: `/Users/nino/Downloads/Harness engineering_ leveraging Codex in an agent-first world _ OpenAI.pdf`.
