# Archaeology Substrate Pattern

**Purpose:** Captures the day-0 pattern for an event-sourced archaeology substrate so future projects can answer "what did we know on date T, why did we pick X, who decided Z" without writing a new ad-hoc tool per question. Codifies the lesson learned on `bc-subscriptions` (May 2026) where five overlapping ingestion tools (session-mine, state-derive, hive-board-derive, drift sweeps, handoff dossiers) were each built reactively to answer a specific archaeological question — and would have collapsed into a single read-side query layer if the substrate had existed from project start.

**Last updated:** 2026-05-22

**Status:** Proven in production on `bc-subscriptions` (Phase 6 smoke test passed 2026-05-22). 47K session events + 62 ADRs + 18 inputs + 68 iterations + 43 audits ingested; 15K chunks embedded; `/derive` answers archaeological questions with correctly-grounded citations across both repo docs and live session JSONLs.

**Source:** `bc-subscriptions` — see [`docs/methodology/archaeology-substrate-design.md`](https://github.com/nino-chavez/bc-subscriptions/blob/dev/docs/methodology/archaeology-substrate-design.md) for the full design, [`tools/archaeology/`](https://github.com/nino-chavez/bc-subscriptions/tree/dev/tools/archaeology) for the working implementation, and [`docs/runbooks/archaeology-hydration.md`](https://github.com/nino-chavez/bc-subscriptions/blob/dev/docs/runbooks/archaeology-hydration.md) for the provisioning runbook.

**Template:** [`blueprint/template/tools/archaeology/`](../template/tools/archaeology/) — drop-in scaffold with `scaffold.sh` for one-command bootstrap.

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

### `GET /derive/stream?question=<text>&context=<page-path>`

Same retrieval as `/derive` but streams the synthesis as Server-Sent Events. Emits four event types: `retrieval` (the ranked top-k chunks, sent first so the client can render citation chips before tokens arrive), `token` (per-token deltas from the synthesis), `done` (terminal), `error`. Used by the chat surface below.

### `GET /admin/derive-stats?days=<n>&top=<n>` — operator-only

Token-gated (reuses `ARCHAEOLOGY_INGEST_TOKEN`). Returns JSON aggregates over the `derive_log` table: daily call counts, top-N questions, top-N IP-hashes (sha256-truncated for privacy), synthesis-vs-retrieval breakdown, retrieval depth + duration stats, page-context popularity, today's headroom against the daily cap. Use this to monitor cost, spot recurring questions worth promoting to a FAQ, and detect abuse via IP fan-out.

---

## Interrogation Surface (Chat)

A drop-in React island that turns the substrate into a public "ask anything" surface, mounted as a global island in your project's portal. Provided in the template at [`template/tools/archaeology/web/ArchaeologyChat.tsx`](../template/tools/archaeology/web/ArchaeologyChat.tsx).

**Design intent:** the substrate captures and indexes; this UI lets visitors interrogate it from inside the portal pages they're already reading. Borrows the framing from [Signal-x-Studio-LLC/resonance](https://github.com/Signal-x-Studio-LLC/resonance) — "documents respond when questioned" — but lands as a chat fixture rather than inline source-badges, because our portal pages are hand-authored summaries (not AI-generated documents with built-in claim provenance). Inline citations would carry a permanent authoring/maintenance tax for low signal; chat-only citations are derived live with zero drift.

**Mechanics:**

- Fixed-bottom-right "Ask the substrate" button on every portal page until activated
- Click → drawer opens with chat surface; question is sent to `/derive/stream` with `context=<current page path>`
- Page context is prepended to the synthesis system prompt so the LLM scopes answers when retrieval supports it
- `[E:event_id]` markers in the streamed answer render as numbered citation chips
- Click a chip → secondary drawer fetches the event from `/timeline` and shows source / source_id / timestamp / payload
- localStorage persistence of last 30 messages per visitor (no server-side per-user state)

**Spend protection:**

- Per-IP daily cap (default 50/day, env: `DERIVE_PER_IP_CAP`)
- Global daily cap (default 200/day, env: `DERIVE_DAILY_CAP`)
- Audit log in `derive_log` D1 table with `sha256(ip)[:16]` for privacy-preserving review
- Both caps enforced before the Anthropic API is called — no abuse vector for spend

**Integration shape:** the component is portal-agnostic. Reference integration mounts it in the Astro layout; Next.js + vanilla React recipes are in [`web/README.md`](../template/tools/archaeology/web/README.md). Empty-state suggestions are customizable per project via the `getSuggestions` prop.

**Why this works for trust restoration:** a skeptic lands on (say) the `/inspect/gates` page, sees the prose summary, and can ask follow-ups grounded in what they were just reading. Every load-bearing claim in the answer carries a numbered citation chip; one click opens the actual session turn / ADR / audit / manifest entry that supports it. The pages stay readable; the substrate stays authoritative; the chat is the bridge.

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

## Freshness (Tail Mode)

Backfill gets the initial state in. Tail mode keeps it current. Without tail wires, the substrate drifts the moment a new ADR / audit / session lands.

### Two valid tail patterns

1. **Event-triggered (preferred for low-latency capture).** A hook on the source system fires when state changes, calling the ingester's `tail` mode with a single artifact.
2. **Re-run backfill on change-event (acceptable for batch capture).** A GH Action on push touching a relevant path re-runs the full backfill ingester. The substrate's `(source, source_id, type, source_ts)` UNIQUE constraint dedupes, so this is cheap and safe.

Use #1 when latency matters (sessions disappear from disk if you don't capture them); use #2 when the source is already in a versioned artifact (a doc edit landed in git is already durable, so a few-minute lag is fine).

### Per-source tail triggers

| Source | Tail trigger | Pattern |
|---|---|---|
| sessions | Claude Code `SessionEnd` hook in `~/.claude/settings.json` | event-triggered (#1) |
| inputs / iterations / audits | GH Action on push touching `docs/{inputs,iterations,audits}/**` | re-run backfill (#2) |
| ADR | Post-merge GH Action diffing `docs/decisions/` | re-run backfill or event-triggered (#1 cleaner) |
| GitHub | Repo webhook → Worker endpoint `POST /events/github-webhook` | event-triggered (#1) |
| Hive | One `fetch()` mirror in the Hive Worker's mutation handlers | event-triggered (#1) |
| Git commits | GH Action on push with `--since <bookmark>` | re-run backfill (#2) |
| Auto-memory | Claude Code memory-write hook (when available) or nightly cron walk | event-triggered (#1) or batch |

### What ships pre-wired in the template

[`blueprint/template/tools/archaeology/`](../template/tools/archaeology/) ships with two tail wires already configured:

- **Sessions** — `template/.claude/hooks/archaeology-session-end.py` (copied to `~/.claude/hooks/` by `scaffold.sh`)
- **Track 1-3 docs** — `template/.github/workflows/archaeology-tail-docs.yml`

The other five sources have skeleton ingesters with finalized contracts; tail wiring is incremental work that doesn't change the substrate API.

### Why idempotency matters here

Every ingester emits events keyed by `(source, source_id, type, source_ts)`. The Worker's `INSERT … ON CONFLICT DO NOTHING` makes re-ingestion of the same event a no-op. This is what makes tail mode safe — a hook that misfires, a GH Action that runs twice, an operator who manually re-runs backfill — none of them corrupt the substrate. The worst case is a no-op.

---

## Known Issues & Gotchas

Captured from the bc-subscriptions production hydration so the next project doesn't re-discover them:

### CF token Vectorize scope is not implied

Cloudflare API tokens minted for "edit D1/R2/Workers" do *not* automatically include Vectorize. If you try `wrangler vectorize create` with such a token, you get error code 10000 ("Authentication error") even though D1/R2 creates succeeded with the same token. Mint with **Account / Vectorize / Edit** explicitly.

### CF bot protection (code 1010) rejects default Python `urllib` User-Agent

`Python-urllib/3.X` is on Cloudflare's challenge list. Worker rejects POST /events with HTTP 403 + body code 1010 if the default UA is in use. Template's `_common.py` sets `User-Agent: archaeology-ingester/<version>`; preserve this when forking.

### Workers AI free tier ceiling

10K requests/day on the free embedding model (`@cf/baai/bge-base-en-v1.5`). `embed_drive.py` has a `--daily-limit` flag (default 9500) that exits before crossing into paid territory. Initial backfill embedding is the only meaningful cost (~17K chunks per project ≈ 2 days at free tier or ~$0.50 paid); ongoing tail well under the daily ceiling.

### Two-phase install is mandatory

Backfill first, tail wires second. If you wire tail before backfilling, you'll have a permanent gap from project-start to tail-wiring-date. The substrate is append-only — there's no way to retroactively fill an event from a session that was never captured.

### Curated sources first; sessions second

The Worker's `/embed` endpoint orders pending events as `ORDER BY CASE source WHEN 'inputs' THEN 0 WHEN 'iterations' THEN 1 WHEN 'audits' THEN 2 ELSE 3 END`. Curated artifacts (manifest entries, ADR lineage rows, audit docs) are tiny and high-signal; they embed first so `/derive` is useful within minutes, not after the full session corpus drains. If you reorder this, expect early `/derive` calls to return session noise instead of curated answers.

### Synthesis is optional but transformative

`/derive` without `ANTHROPIC_API_KEY` returns top-k ranked chunks (retrieval only). With the key set, the Worker calls Claude with a system prompt that *requires* `[E:event_id]` inline citations. The retrieval-only path is good enough to verify substrate correctness; the synthesis path turns it into an "ask anything" surface. Both are wired in the template.

---

## Reference Implementation

`bc-subscriptions` (May 2026) is the canonical retrofit case study. [`tools/archaeology/`](https://github.com/nino-chavez/bc-subscriptions/tree/dev/tools/archaeology) is the working implementation that this template was derived from:

```
tools/archaeology/
├── worker/                # CF Worker — POST /events, /embed; GET /timeline, /derive, /derive/stream, /embed/stats, /admin/derive-stats, /health
│   ├── src/index.ts
│   ├── schema/0001-events.sql
│   ├── schema/0002-embed-state.sql
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── embed_drive.py         # Driver: loops POST /embed until queue drained
├── web/                   # Interrogation surface (chat island)
│   ├── ArchaeologyChat.tsx  # React island — mount in your portal layout
│   └── README.md
└── ingesters/
    ├── _common.py         # Shared Event/Ref dataclasses + batched POST
    ├── sessions.py        # ✓ FULL — Claude Code JSONLs (SessionEnd hook for tail)
    ├── inputs.py          # ✓ FULL — docs/inputs/_manifest.yaml provenance entries
    ├── iterations.py      # ✓ FULL — docs/iterations/_history.md (ADR lineage + IPs)
    ├── audits.py          # ✓ FULL — docs/audits/*.md (categorized)
    ├── adr.py             # ⊙ SKELETON (contract finalized)
    ├── github.py          # ⊙ SKELETON
    ├── hive.py            # ⊙ SKELETON
    ├── git.py             # ⊙ SKELETON
    └── memory.py          # ⊙ SKELETON
```

Hydration runbook: [`docs/runbooks/archaeology-hydration.md`](https://github.com/nino-chavez/bc-subscriptions/blob/dev/docs/runbooks/archaeology-hydration.md) — concrete CF provisioning + backfill commands, idempotent and resumable.

### Phase 6 smoke test outcome (the moment we knew it worked)

Query: `did we include Stripe Billing as an input`

Top retrieval: `inputs/gap_declared :: gap-stripe-billing-factsheet` (score 0.750), followed by 17 session chunks that mention "Stripe Billing" in pitch-frame discussions.

Synthesis answer (Claude Sonnet 4.6):
> Yes, Stripe Billing was included as an input, but as a positioning/competitive reference rather than a dedicated research artifact. Specifically, Stripe Billing is referenced across multiple substrate documents: PRD §16 Architectural Alternatives Considered, §6.4 Gateway Matrix, and STRATEGY.md ICP exclusion [E:01KS6T8P77H60A7TSKG7D26AS6]. … What is **not** present is a dedicated stripe-billing-factsheet.md … [E:01KS6TPKM9RKQ2YJF0C0HT0DJK].

The first citation resolves to the `inputs/gap_declared` event (repo doc); the second resolves to a `session/assistant_turn` event from 2026-05-07 that literally said *"The differentiator vs Recharge / Stripe Billing isn't features — it's no parallel catalog, no reconciliation tax…"*. The substrate joined a repo doc with a live session JSONL turn in one citation-bound answer.

---

## Day-0 Bootstrap Sequence (for new projects)

Set `archaeology.enabled: true` in `blueprint.yml`, then run the scaffold:

```bash
# From the consuming project's root
cd tools/archaeology
bash scaffold.sh
```

`scaffold.sh` is idempotent. It does:

1. **Templatize** `{{PROJECT_SLUG}}`, `{{PROJECT_ID}}`, `{{CLAUDE_SESSION_DIR_SLUG}}` placeholders in `wrangler.toml`, `package.json`, `_common.py`, `embed_drive.py`, `sessions.py`, `web/ArchaeologyChat.tsx`.
2. **Install** worker dependencies (`npm install` inside `worker/`).
3. **Provision** CF resources (D1 + R2 + Vectorize), populating `database_id` in `wrangler.toml`. Skips any that already exist.
4. **Generate** an ingest token (`~/.config/archaeology/ingest-token`, 0600), push it to the Worker as `ARCHAEOLOGY_INGEST_TOKEN`, and to the GH repo as a secret.
5. **Apply** the D1 schema (`schema/0001-events.sql` + `schema/0002-embed-state.sql` + `schema/0003-rate-limits.sql`).
6. **Deploy** the Worker, parse its assigned `*.workers.dev` subdomain from the deploy output, and substitute `{{CF_WORKERS_SUBDOMAIN}}` into the files that reference it (chat island + ingesters + driver). Verify `/health` returns `{"ok":true}`.
7. **Install** the Claude Code SessionEnd hook to `~/.claude/hooks/archaeology-session-end.py` (the operator still adds the hook block to `~/.claude/settings.json` — see `template/.claude/settings.json.example`).
8. **Report** next-step commands (backfill + embed + first smoke query + optional chat-surface mount in your portal).

After scaffold:

- **First commit lands with sessions-tail already capturing.** Sessions JSONLs flow in on every `SessionEnd`.
- **First push touching `docs/{inputs,iterations,audits}/`** fires the GH Action and ingests those surfaces.
- **Optional one-shot mount**: copy `web/ArchaeologyChat.tsx` into your portal's component directory and add `<ArchaeologyChat client:idle pageContext={currentPath} />` to your layout. See [`web/README.md`](../template/tools/archaeology/web/README.md) for per-framework recipes.
- **Remaining sources** (adr/github/hive/git/memory) are skeleton ingesters — wire their tail triggers per the table in §Freshness as you need them.

### Lint config (recommended, not bundled)

For projects that want to enforce ref-density at PR time:

- `.github/workflows/refs-required.yml` blocks merges if commit subjects lack `closes #N` / `(synthesis #N)` when appropriate
- A `pre-push` hook (in the `code-review-bot` lineage) checks commit subjects locally

These aren't part of the archaeology template — they're a separate discipline that *complements* archaeology by ensuring the events the substrate captures actually carry refs.

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
