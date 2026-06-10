# Dependency Graph View Pattern

**Purpose:** Render the Hive substrate's `blocked_by` relationships as a
left→right layered DAG so the critical path to an end-to-end state is
visible at a glance.

**Extracted from:** `subs-initiative` session 2026-05-20 — ships as the
third tab of the `the-status-app` Cloudflare Pages deploy (alongside
`/gate-status` and `/attestations`).

---

## The Problem

Status grids (capability-by-capability tables, audit registers, swimlanes
bucketed by category) answer "what's the state of X?" They don't answer
"what's blocking the next shippable surface?" — even though that question
is the one operators ask most.

The data exists. Every Hive proposal carries `hive-meta.blocked_by` (a list
of issue numbers it depends on). Following those chains by hand across 100+
open issues is the task no operator does, so the answer never surfaces.

A first attempt at a frappe-gantt-inspired swimlane view failed because the
bar grammar implied an X-axis (time, position, quantity) that the data
didn't carry. Width was just `text-length + padding` — a chart costume on a
status grid. The honest visualization for `blocked_by` chains is a DAG
laid out left→right by topological depth.

---

## The Solution

Three components compose:

| Layer       | What it does                                                                 | subs-initiative location                       |
|-------------|------------------------------------------------------------------------------|-------------------------------------------------|
| Derive tool | Reads `docs/hive/_board.json`, reshapes into `{nodes, edges}` graph schema   | `tools/dep-graph-emit/`                         |
| Primitive   | React component: BFS column layout, ring-and-stroke critical-path highlight | `packages/ui/src/components/dependency-graph/`  |
| Dashboard   | Static HTML renderer with inline CSS + JS for graph layout                   | `tools/dep-graph-dashboard/`                    |

### Data flow

```
GH issues (hive-meta in body)
       │
       ▼
tools/hive-board-derive/        ── emits docs/hive/_board.json (committed)
       │
       ▼
tools/dep-graph-emit/           ── emits docs/audits/derived/_dep-graph.json
       │                            (CI-only; pure data reshape, no GH API calls)
       ▼
tools/dep-graph-dashboard/      ── emits apps/status/dist/dependencies.html
       │                            (inline CSS + inline JS; matches existing
       │                             dashboards' no-deps pattern)
       ▼
Cloudflare Pages /dependencies  ── clean-URL routing, no _redirects needed
```

### Status mapping (bucket → graph status)

`_board.json` from `hive-board-derive` already buckets open issues by
lifecycle. The derive tool maps each bucket to one of 5 graph statuses:

| `_board.json` bucket  | Graph status      | Rendering                          |
|-----------------------|-------------------|------------------------------------|
| `shipped-not-closed`  | `compliant`       | green fill, green leading edge     |
| `in-flight`           | `partial`         | yellow fill, yellow leading edge   |
| `awaiting-dispatch`   | `manual-review`   | blue fill (waiting for human)      |
| `awaiting-synthesis`  | `manual-review`   | blue fill                          |
| `stale`               | `non-compliant`   | red fill (forgotten / blocked)     |
| `reference` / `defer-*` / `other` | `neutral` | gray fill (no actionable status) |

Closed issues referenced by `blocked_by` but absent from the open-issues
array get stub nodes marked `compliant` so the graph stays connected and
shows "this dep was satisfied."

### Critical path

Computed by DP: `chain[id] = 1 + max(chain[parent])` over non-shipped
parents. The node with the highest `chain` value is the leaf of the
critical path; trace parents back to reconstruct. Ties broken by node
iteration order. Edges along the critical path render at `tone="brand"`
+ `strokeWidth=2.5` (vs default `1.5`); nodes get a 2px brand ring.

---

## Adoption sketch

subs-initiative is the first adopter. Three layers can flow into
`blueprint` on different time horizons:

### Phase A — this doc (now)

Land the pattern. Cross-link from `hive-coordination-pattern.md` and
`traceability-state-join-pattern.md`. No code yet.

### Phase B — templated derive tool (next adopter)

Vendor `tools/dep-graph-emit/` to `template/tools/dep-graph-emit/`. The
tool is already project-agnostic in shape — it reads `docs/hive/_board.json`
and writes `docs/audits/derived/_dep-graph.json`, both of which are part of
the Hive-substrate convention blueprint already prescribes.

One swap required: the hardcoded GitHub repo URL (`nino-chavez/subs-initiative`)
moves to a `blueprint.yml` field (`gh_repo`) and the tool reads it from there.

### Phase C — tool-shell route + primitive vendoring (deferred)

`template/apps/tool-shell/` is the canonical React shell for project
tooling (see `clustered-tool-surface-pattern.md`). The dependency-graph
view lands there as a route under the operator-internal cluster.

Two further questions to decide before Phase C:

1. **Where does the React primitive live?** subs-initiative has it in
   `packages/ui/`, but blueprint doesn't yet template a `packages/ui/`.
   Options:
   - Vendor the primitive directly into `template/apps/tool-shell/src/components/`
     (simple, no new templated package)
   - Bootstrap `template/packages/ui/` as a first templated package and put
     the primitive there (cleaner, more setup)
2. **What data does the route fetch?** Static JSON baked at CI time (current
   subs-initiative approach via `dep-graph-dashboard`) or live-fetch from a Worker
   that re-derives on demand? Static is simpler; live is fresher.

**Defer until:** a second project actually asks for the view. Premature
abstraction otherwise.

---

## When to adopt

A project should adopt the dependency-graph view when **all** are true:

- It uses Hive (or any substrate where issues carry a `blocked_by` list).
- It has enough cross-issue dependencies (>10) that critical-path is
  non-obvious from reading the board.
- Operators ask "what's blocking the next E2E surface?" — i.e., the data
  exists and the question is asked, but the answer requires manual
  chain-tracing.

Skip if the project's substrate is flat (no `blocked_by`), or if the issue
count is small enough that scrolling the board answers the question.

---

## Reference implementation (subs-initiative)

| File                                                                | Role                                              |
|---------------------------------------------------------------------|---------------------------------------------------|
| `tools/dep-graph-emit/index.ts`                                     | Derive tool — reshapes `_board.json` into graph   |
| `tools/dep-graph-emit/README.md`                                    | Schema + run instructions                         |
| `tools/dep-graph-dashboard/{index,render}.ts`                       | Static HTML renderer (matches dashboard family)   |
| `packages/ui/src/components/dependency-graph/dependency-graph.tsx`  | React primitive + `computeCriticalPath` helper    |
| `packages/ui/src/components/dependency-arrow/dependency-arrow.tsx`  | Rounded-elbow edge primitive (also new)           |
| `.github/workflows/deploy-status.yml`                               | CI wiring — two steps added beside existing flow  |

Live surface: `/dependencies` tab on the `the-status-app` Cloudflare Pages
deploy. Sample data shape: 126 nodes (108 open issues + 18 closed-stub
references) and 26 edges from a real `_board.json`.

---

## Cross-references

- [`hive-coordination-pattern`](hive-coordination-pattern.md) — the
  upstream Hive substrate model that `blocked_by` comes from
- [`traceability-state-join-pattern`](traceability-state-join-pattern.md)
  — adjacent pattern that joins `_state.json` into the traceability
  matrix; this view does the equivalent for `_board.json` on the graph
  surface
- [`clustered-tool-surface-pattern`](clustered-tool-surface-pattern.md)
  — `tool-shell` rationale (where Phase C would land)
