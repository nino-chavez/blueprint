# Archaeology Substrate Pattern

**Purpose:** Captures the day-0 pattern for an event-sourced archaeology substrate so future projects can answer "what did we know on date T, why did we pick X, who decided Z" without writing a new ad-hoc tool per question. Codifies the lesson learned on `bc-subscriptions` (May 2026) where five overlapping ingestion tools (session-mine, state-derive, hive-board-derive, drift sweeps, handoff dossiers) were each built reactively to answer a specific archaeological question — and would have collapsed into a single read-side query layer if the substrate had existed from project start.

**Last updated:** 2026-05-21

**Source:** `bc-subscriptions` — see [`docs/methodology/archaeology-substrate-design.md`](https://github.com/nino-chavez/bc-subscriptions/blob/dev/docs/methodology/archaeology-substrate-design.md) for the full design, and [`tools/archaeology/`](https://github.com/nino-chavez/bc-subscriptions/tree/dev/tools/archaeology) for the working implementation.

**Related patterns:**
- [`hive-coordination-pattern.md`](hive-coordination-pattern.md) — Hive is one of the six source streams the substrate ingests
- [`traceability-state-join-pattern.md`](traceability-state-join-pattern.md) — same family: derive joined views from canonical sources
- [`cloudflare-deployment-pattern.md`](cloudflare-deployment-pattern.md) — substrate runs on CF (D1 + R2 + Vectorize + Workers AI)
- [`inventory-as-evidence-pattern.md`](inventory-as-evidence-pattern.md) — substrate captures the evidence, inventories are read-side projections
- [`proposal-grain-pattern.md`](proposal-grain-pattern.md) — Hive ingester relies on this grain to make proposal events meaningful

---

## When to Use This Pattern

Use it when:

- Initiative will run for more than a few weeks (archaeological needs scale with history)
- Multi-agent / multi-session work is expected (capturing session JSONLs is the highest-value stream)
- The project will accumulate ADRs, Hive proposals, or any other ratified-decision artifacts
- Onboarding new engineers periodically (the substrate turns "write a handoff doc" into "run a query")
- Multiple projects in the same org would benefit from cross-project archaeology (single substrate federates by `project_id`)

Skip when:

- Throwaway prototype / spike that won't outlive the week
- Solo, single-session work with no Hive or multi-agent coordination
- Project has no ADRs, no Hive substrate, no GitHub usage (substrate has nothing to ingest)
- Strict regulatory environment where capturing session content creates compliance issues (substrate captures *everything* by default; opt-out is harder than opt-in)

---

## The Core Insight

> Five tools were built reactively. One substrate would have prevented all five.

Every archaeological need on `bc-subscriptions` produced a new tool:

| Question asked | Tool built |
|---|---|
| "What's currently shipped?" | `tools/state-derive` |
| "What's the open work?" | `tools/hive-board-derive` |
| "Which proposals are stale?" | drift-sweep scripts |
| "What inputs did we feed the AI?" | `tools/session-mine` |
| "How do we onboard Tom?" | handoff dossiers |

Each tool reads canonical sources and projects a derived view. Each was correct individually. Together they overlap heavily (all read Hive D1, all read GH, three read git log, two read sessions) and they ossify — once written, a tool answers exactly one question and rarely generalizes.

The substrate is the **layer underneath**: an append-only event log with explicit refs across all six streams. Each "tool" above becomes a read-side query, not a separate codebase.

---

## Six Source Streams

A project's history lives in six streams that are siloed by default:

| Stream | Canonical source | Captured by |
|---|---|---|
| Claude Code session JSONLs | `~/.claude/projects/<slug>/*.jsonl` | session ingester + `SessionEnd` hook |
| Git commits / branches / merges | local repo + GH | git ingester + post-receive hook |
| GitHub issues / PRs / comments | GH API | github ingester + repo webhook |
| Hive proposals / synthesis / decisions | Hive D1 (via `/api/derived`) | hive ingester + mirror in Hive Worker |
| ADRs | `docs/decisions/*.md` | adr ingester + post-merge GH Action |
| Auto-memory entries | `~/.claude/projects/<slug>/memory/*.md` | memory ingester + memory-write hook |

The substrate subscribes to all six.

---

## Event Model

### Canonical event shape

```ts
{
  event_id:     string  // ULID — sortable, generated server-side
  project_id:   string  // federation key
  source:       string  // session | git | github | hive | adr | memory
  source_id:    string  // session UUID, commit SHA, issue#, proposal#, ADR-NNNN, ...
  source_ts:    string  // RFC3339 — when the event happened
  ingest_ts:    string  // RFC3339 — when we landed it
  type:         string  // source-specific event type
  actor:        string  // user identity
  payload_json: string  // event-specific JSON
  blob_key:     string? // R2 key for large content
  refs:         Array<{kind: string, target: string}>
}
```

### The ref graph

`refs[]` is what makes archaeology queries answerable. Refs are `{kind, target}` where `target` is a fully-qualified `<source>:<source_id>`. Example refs an assistant_turn event might carry:

- `{kind: "in_branch",      target: "git:feature/payments-tokenization"}`
- `{kind: "while_claiming", target: "hive:task#74bf6d41"}`
- `{kind: "mentions",       target: "adr:ADR-0037"}`
- `{kind: "fetched_url",    target: "url:https://docs.bigcommerce.com/..."}`

Refs are indexed bidirectionally. "Everything that references ADR-0037" is a single index lookup. Walking from a PR backward through synthesis → proposals → originating session is a graph traversal.

---

## Storage Layout

| Storage | What it holds | Why |
|---|---|---|
| **D1** | events + refs + entities + ingest_bookmarks | Fast metadata + ref-traversal SQL queries |
| **R2** | Full session JSONLs, large diffs, large issue bodies > 32KB | D1 row limit avoidance; cold storage |
| **Vectorize** | Chunked + embedded text for semantic retrieval | The "ask anything" surface |
| **Workers AI** | Embedding model (`@cf/baai/bge-base-en-v1.5`) | Free-tier inference for chunk embedding |

D1 is the source of truth. Vectorize is a denormalized read-side index that can be rebuilt from scratch from D1 + R2 without data loss.

---

## Query Surface

Two endpoints on the Worker:

### `GET /timeline?subject=<ref>`

Returns the event stream for a single subject, ordered by `source_ts`. Subject is any ref: `adr:ADR-0055`, `hive:proposal#1426`, `github:issue#1426`, `session:dab917e9`, `file:tools/session-mine/mine.py`.

Use case: "show me the lineage of ADR-0055 from first proposal through ratification, including which sessions discussed it."

### `GET /derive?question=<text>`

Hybrid retrieval + synthesis: embed → Vectorize top-k → D1 metadata filter → Anthropic synthesis with citations.

Use case: "what knowledge inputs informed the payments tokenization design?" — returns prose answer plus a list of refs to source events.

---

## Day-0 Disciplines (the methodology layer)

The substrate is wiring. These five disciplines are what make it work over time:

### 1. Hooks before content

`scaffold.sh` installs archaeology capture hooks at project init, **same tier as `test-stack-baseline` and `bc-platform-verify`**. If you can write your first commit, archaeology is already capturing. There is no "we'll add it later" mode — by the time you want archaeology, you've already lost the history that would have made it valuable.

### 2. Refs are mandatory, not optional

Every spec, decision, proposal, and commit carries explicit refs to upstream and downstream artifacts. Lint blocks merge if refs missing. The `closes-keyword` and `synthesis-citation` checks in `code-review-bot` v1.3 are the prototype; generalize as `archaeology-refs-required`.

Examples of what becomes mandatory:
- Commit subjects: `closes #N` AND `(synthesis #N)` when applicable (already required on `bc-subscriptions`)
- ADR frontmatter: `synthesis-id`, `proposal_ids[]`, `superseded_by`
- Hive `<!-- hive-meta -->` block: extend with `originating_session_id`
- Memory frontmatter: extend with `created`, `updated`, `linked_session`, `linked_proposal` fields

### 3. Capture by default, curate by intent

The substrate captures everything. **No human ever runs "save this session"** — it's already there. Curation (like `claude-recall-cli` recipes) sits as a layer above the substrate, not in place of it.

### 4. Derived projections are read-side only

state-derive, hive-board-derive, session-mine, and any future "X-derive" tool — these become *cached views* of the event log, not separate ad-hoc pipelines. They are queries against `/derive` and `/timeline`, not standalone codebases.

### 5. Single substrate per org, federated by `project_id`

Not one Vectorize per project. Cross-project archaeology is the unlock; per-project silos defeat it. The schema supports federation from day one via the `project_id` column.

---

## Reference Implementation

`bc-subscriptions` (May 2026) ships the working substrate at [`tools/archaeology/`](https://github.com/nino-chavez/bc-subscriptions/tree/dev/tools/archaeology):

```
tools/archaeology/
├── worker/                # CF Worker — POST /events, GET /timeline, GET /derive
│   ├── src/index.ts
│   ├── schema/0001-events.sql
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
└── ingesters/             # One per source stream
    ├── _common.py         # Shared Event/Ref dataclasses + batched POST
    ├── sessions.py        # ✓ FULL (Claude Code JSONLs)
    ├── github.py          # ⊙ SKELETON
    ├── hive.py            # ⊙ SKELETON
    ├── git.py             # ⊙ SKELETON
    ├── adr.py             # ⊙ SKELETON
    └── memory.py          # ⊙ SKELETON
```

Hydration runbook: [`docs/runbooks/archaeology-hydration.md`](https://github.com/nino-chavez/bc-subscriptions/blob/dev/docs/runbooks/archaeology-hydration.md) — concrete CF provisioning + backfill commands, idempotent and resumable.

---

## Day-0 Bootstrap Sequence (for new projects)

When `scaffold.sh` provisions a new project that adopts this pattern:

1. **Create CF resources** (10 min via wrangler):
   - D1 database `<project>-archaeology`
   - R2 bucket `<project>-archaeology-blobs`
   - Vectorize index `<project>-archaeology-chunks` (768 dims, cosine)
   - Or: register with an existing org-level archaeology Worker (preferred — federation)

2. **Deploy archaeology Worker** if not federated yet, copying from `bc-subscriptions/tools/archaeology/worker/` as a template.

3. **Install capture hooks** automatically:
   - `~/.claude/settings.json` SessionEnd hook → invokes `sessions.py tail --jsonl=$CLAUDE_SESSION_JSONL`
   - `.github/workflows/archaeology-tail.yml` → on push, runs `git.py` + `adr.py` + `github.py` tail mode
   - `subs-hive-mcp` Worker config → mirrors writes to archaeology Worker
   - Claude Code memory-write hook (if available) → invokes `memory.py tail`

4. **Lint config**:
   - `.github/workflows/refs-required.yml` blocks merges with missing refs
   - `pre-push` hook (in `code-review-bot` lineage) checks commit subjects for closes/synthesis keywords

5. **First commit lands with capture already running.** No retroactive backfill needed for greenfield projects — the substrate has been recording since pre-first-commit.

---

## Retrofit Sequence (for existing projects, like bc-subscriptions)

For projects with accumulated history when adopting the pattern:

1. **Provision CF resources** (same as day-0 step 1)
2. **Deploy Worker** (same as day-0 step 2)
3. **Backfill in order** (each ingester is idempotent, resumable):
   - Sessions first (highest value, biggest payoff for `/derive` queries)
   - Git log (joins everything else via commit SHAs)
   - GitHub (issues + PRs + comments + reviews)
   - Hive (via `/api/derived` endpoints)
   - ADRs (small, fast)
   - Memory (small, fast)
4. **Install capture hooks** (day-0 step 3)
5. **Verify** with known-good queries (e.g., a question whose answer is already known — confirm `/derive` returns the right citations)
6. **Decommission legacy tools** only after backfill + verification

`bc-subscriptions` is the canonical retrofit case study — design doc + runbook capture the full sequence.

---

## What This Replaces / Consolidates

Five ad-hoc tools collapse into read-side queries:

| Legacy tool | Replacement query |
|---|---|
| `session-mine` | `GET /derive?question=what+inputs...` |
| `state-derive` (history) | `GET /timeline?subject=adr:ADR-NNNN` |
| `hive-board-derive` | `GET /timeline?subject=hive:project#...` (group by state in client) |
| Drift sweep scripts | `GET /derive?question=which+proposals+mention+X` |
| Handoff dossiers | `GET /derive?question=onboarding+new+engineer+on+X` |

`state-derive` for *current state* remains valuable — projecting "what's shipped right now" is a fast SQL projection, not an archaeological query. The archaeology substrate complements it, doesn't replace it.

---

## Costs (Back-of-Envelope)

| Component | Free tier | Expected baseline | Notes |
|---|---|---|---|
| D1 | 5 GB / 25M reads / 50K writes per day | ~50 MB per 1 yr of activity | well within free tier |
| R2 | 10 GB free | ~5 GB across 5 federated projects | well within free tier |
| Vectorize | 5M stored vectors / 30M queried dims/mo | ~85K vectors for 5 projects | well within free tier |
| Workers AI embeddings | 10K free requests/day | initial seed of 17K chunks per project → 2 days free OR ~$0.50 paid | one-time per project |
| Anthropic API (synthesis) | per-call billing | depends on `/derive` query volume; cache aggressively | only on synthesis path |

Bottom line: free-tier viable for years. Initial backfill embedding is the only meaningful cost (~$0.50 per project to do it in one shot).

---

## What This Pattern Is NOT

- **Not a code-search tool.** Code search is `ripgrep` + `gh code-search`. The substrate indexes *human and agent discourse about code*, not code itself.
- **Not a metrics platform.** Performance, errors, billing — those belong in dedicated systems. The substrate can reference metric events but doesn't host them.
- **Not a replacement for git or GitHub.** Git is canonical for code. GH is canonical for collaboration. The substrate is a *reading layer* over those, not a replacement.
- **Not a NotebookLM clone.** NotebookLM is corpus-scoped and chat-shaped; this pattern produces a queryable substrate that *can* power a NotebookLM-shaped UX, but the substrate itself is HTTP-first and headless.

---

## Open Questions for Future Refinement

Captured here so they don't get lost; not blocking initial adoption:

- **Privacy boundary**: session JSONLs can contain credentials paths and secret-bearing tool outputs. Sanitization rules must be inherited and extended per source.
- **Chunking strategy**: paragraph-level for assistant turns is a guess; iterate from query-quality evals.
- **GDPR / data-subject-access**: deletion path needs design before exposing externally.
- **Multi-tenant security**: single Worker for an org assumes internal trust; per-`project_id` tokens if exposing to customers.

---

## Lessons That Drove This Pattern

The bc-subscriptions retro that produced this pattern surfaced three reusable lessons:

1. **Reactive tool creation compounds.** Each new archaeological question that produces a new tool also produces overlap with three existing tools. The Nth tool costs N+1 lines of "this is similar to what X does but for question Y."

2. **Refs are the moat.** Without explicit refs between artifacts, every join is a heuristic regex over text. With refs, joins are O(1) index lookups. The discipline of "every artifact carries refs to its upstream and downstream" is what makes archaeology possible — the substrate alone, without the discipline, just stores siloed events in one database.

3. **Derive-don't-snapshot extends to onboarding.** The same axiom that produced `state-derive` (don't hand-curate "what's shipped" docs, derive them) applies to onboarding docs, handoff packages, drift sweeps, and any other "snapshot of state at time T" artifact. The substrate is the canonical derive-able layer for all of them.

---

## Next Steps

For future projects adopting this pattern:

1. Run `scaffold.sh` (once the template lands this pattern's hooks; in the meantime, follow the bootstrap sequence above manually)
2. Confirm the substrate is capturing — check the Worker's `/health` and that POST `/events` is receiving from each ingester
3. Set a 30-day reminder to re-verify capture is healthy; refs density on commits is the leading indicator
4. After 60 days, run `/derive` against a question whose answer you know — confirm the substrate has accumulated enough signal to be trusted
