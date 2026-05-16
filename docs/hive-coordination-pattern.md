# Hive Multi-Agent Coordination — When and How to Use

**Purpose:** Captures when a BigBlueprint initiative benefits from the Hive multi-agent coordination layer (originally developed in `bc-subscriptions`), and how to bootstrap it without re-deriving the pattern.

**Last updated:** 2026-05-08

**Source:** `bc-subscriptions/.hive/` and Paradigm B2B initiative (May 2026).

---

## What Hive Is

A Cloudflare-hosted task and coordination system designed for **multiple AI agents working the same repo in parallel**. It runs as:

- **MCP server** — Cloudflare Worker exposing ~20 MCP tools (`hive_register_session`, `hive_propose`, `hive_react`, `hive_synthesize`, `hive_claim_task`, `hive_acquire_lock`, etc.)
- **Dashboard SPA** — Cloudflare Pages, live brainstorm board + task pipeline, ~1s SSE latency
- **D1-backed storage** — projects, sessions, proposals, reactions, tasks, locks, decisions

It's a **build-time coordination layer**, not a product feature. It never ships in your application; it disappears when work is done.

---

## When to Use Hive

Use Hive when **all** of these are true:

1. The initiative has 5+ discrete work streams that can be parallelized
2. Multiple agent sessions will run concurrently (same conversation forking, or multiple developers + agents, or scheduled long-running agents)
3. Work streams touch overlapping files, decisions, or data
4. The timeline is short enough that serialized work won't fit (typical: <2 weeks)

Skip Hive when:

- It's a solo, sequential initiative (just track tasks in TaskCreate or a `TODO.md`)
- Work streams are fully independent (no shared file edits, no coupled decisions) — Hive's overhead exceeds its value
- Initiative is exploratory and you'll abandon half the work (no point coordinating throwaway code)

**Litmus test:** if you're about to spin up two Claude Code sessions on the same repo in parallel, you need Hive. If one session at a time is fine, you don't.

---

## What Hive Provides

| Primitive | What it solves |
|---|---|
| **Sessions** | "Who's currently working in this repo?" — register on start, deregister on stop |
| **Tasks** | Discrete work units with owners, states, dependencies |
| **Locks** | "I'm editing this file/dir/decision; don't touch it" — held by session, TTL'd |
| **Proposals** | "I'm thinking about X; here are options" — visible to all sessions before commit |
| **Reactions** | Other sessions vote / comment on a proposal |
| **Synthesis** | When proposals stabilize, the synthesis becomes a load-bearing decision |
| **Cycle detection** | Auto-detects A-blocks-B-blocks-A loops via proposal-edge parsing |
| **Stale-session reaper** | Cron-driven; releases abandoned locks after TTL |

---

## Bootstrap Sequence

Mirrors `bc-subscriptions/.hive/docs/BOOTSTRAP.md`. Adapted for any new initiative:

```bash
# 1. Copy .hive/ from bc-subscriptions into your initiative
cp -r ~/Workspace/dev/wip/bc-subscriptions/.hive ./.hive

# 2. Provision a dedicated Cloudflare account (recommended) or
#    use a separate D1 namespace within an existing account
wrangler d1 create paradigm-hive-d1
# capture the database_id

# 3. Update .hive/apps/mcp-server/wrangler.toml
#    - Change worker name (e.g., paradigm-hive-mcp)
#    - Update [[d1_databases]] binding with your new database_id
#    - Update routes if applicable

# 4. Apply schema migrations
cd .hive/apps/mcp-server
wrangler d1 migrations apply paradigm-hive-d1

# 5. Update .hive/apps/dashboard/ deploy target
#    - Project name: e.g., paradigm-hive-dashboard

# 6. Deploy MCP server
wrangler deploy

# 7. Deploy dashboard
cd ../dashboard
wrangler pages deploy dist --project-name=paradigm-hive-dashboard

# 8. Seed initial tasks
#    - Open dashboard URL
#    - Create your project
#    - Bulk-import tasks via dashboard UI or direct D1 INSERT

# 9. Update CLAUDE.md to require hive_register_session on session start

# 10. Verify by running a test session
```

Total time: ~1 hour if Cloudflare credentials are ready. Most of the time is account/secret provisioning, not the Hive itself.

---

## Working Rules for Agents (CLAUDE.md Snippet)

Once Hive is bootstrapped, every agent session must follow this:

### Session start

1. **Register:** `hive_register_session(project="<name>", agent_id=<unique-id>)`
2. **List available tasks:** `hive_list_tasks(status="pending", unblocked=true)`
3. **Claim a task:** `hive_claim_task(task_id=<id>)` — fails fast if held by another session
4. **Acquire locks** before editing shared resources: `hive_acquire_lock(resource=<path-or-decision>)`

### During work

If you face a decision the existing ADRs / specs don't cover:

1. Don't decide unilaterally. `hive_propose(...)` with options.
2. Other sessions react via `hive_react(...)`.
3. When stable, `hive_synthesize(...)` becomes the load-bearing decision.
4. If the decision is structural enough to need an ADR, write it (numbered next).

### When blocked

- Use `hive_add_dependency(task_id=B, depends_on=A)` so Hive prevents claiming B until A is done
- If A is unowned, claim it yourself or note the blocker on the task
- Never silently abandon a claimed task. Use `hive_release_task(task_id, reason)` so others can pick it up

### Task completion

1. Verify your work (tests, type-check, deploy preview)
2. `hive_complete_task(task_id=<id>, artifact_refs=["commit:abc123", "url:..."])`
3. Release locks: `hive_release_lock(resource=<...>)`
4. `hive_list_tasks` again — claim the next

---

## Integration with BigBlueprint Stages

Hive operates *across* BigBlueprint's seven stages, not as a stage of its own:

| Stage | Hive role |
|---|---|
| 1. Research | Per-source research is one task each (competitive analysis, codebase, screenshots) — agents claim |
| 2. Design Principles | DESIGN.md is one task (one agent owns). Synthesis if multiple agents have input |
| 3. Prototype | One task per flow; one task per slice within. Shared chrome blocks all flow tasks |
| 4. Fact-Check | One task per claim category. Validators distinct from prototype-builders |
| 5. Documents | One task per document. Doc-writer claims; can split if multi-author |
| 6. Deploy | Often one task; sometimes split per surface (preview vs. prod) |
| 7. Iterate | Each iteration cycle is a new round of tasks, decisions, proposals |

The dependency graph is the most useful Hive feature for BigBlueprint: prototype tasks block on Stage-1-research-complete; document tasks block on prototype-complete; deploy task blocks on fact-check-complete.

---

## Anti-Patterns

1. **Bootstrapping Hive when you don't need it.** One-agent initiatives don't need ~1 hour of CF setup.
2. **Skipping Hive once it's bootstrapped.** Working without registering = silent collisions. Document this in CLAUDE.md as non-negotiable.
3. **Using Hive for product-runtime coordination.** Hive is build-time. Don't import MCP tools into your shipping code.
4. **Cloning bc-subs `.hive/` and pointing at bc-subs' D1 / CF account.** Always rebind to your own. Sharing D1 means tasks from other initiatives leak into yours.
5. **Letting locks stale forever.** TTL stops this from killing you, but if you see stale locks frequently, something's broken in session lifecycle. Investigate.
6. **Treating proposals as voting.** Reactions inform; they don't auto-synthesize. A human (or claiming agent) decides when to synthesize.

---

## Decision Pattern

For any initiative considering Hive, capture as an ADR:

```markdown
# ADR-NNNN: Hive Multi-Agent Coordination

## Decision
[Adopt Hive | Defer Hive | Skip Hive]

## Context
- Number of expected concurrent agents: N
- Expected initiative duration: X weeks
- Number of overlapping work streams: M

## Consequences
[Easier / Harder / Unblocked]

## Alternatives
- TaskCreate-only (lighter)
- GitHub Issues + locks via PR (mature, slower)
- File-based locks (race-prone)
- Build your own (don't)
```

See `bc-subscriptions/docs/decisions/` and `paradigm-b2b/docs/decisions/0003-hive-coordination.md` for examples.

---

## Reference Sources

| Source | Path |
|---|---|
| bc-subscriptions Hive | `~/Workspace/dev/wip/bc-subscriptions/.hive/` |
| bc-subs ONBOARDING | `~/Workspace/dev/wip/bc-subscriptions/.hive/ONBOARDING.md` |
| bc-subs WAYS-OF-WORKING | `~/Workspace/dev/wip/bc-subscriptions/WAYS-OF-WORKING.md` |
| Paradigm B2B Hive ADR | `~/Workspace/dev/wip/paradigm-b2b/docs/decisions/0003-hive-coordination.md` |

---

## Known Failure Mode: GH-Closed / Hive-Open Drift

Over time, proposals accumulate where the GitHub issue is CLOSED but the Hive status is still `open` or `discussing`. This happens when:

- `hive_synthesize` is called without passing `proposal_ids` (most common)
- GH issues are closed manually or via synthesis sweeps without a matching commit subject reference
- Tasks are created directly from proposals, bypassing `hive_approve_plan`

**Fix:** Add the `hive-closure-sync.yml` template workflow, which includes a "Proposal drift sync" step that self-heals this on every push to main. Details in `docs/hive-closure-drift-sync-pattern.md`.

**Prevention:** Enforce in `CLAUDE.md` or `WAYS-OF-WORKING.md` that every `hive_synthesize` call must include `proposal_ids`.

---

## Relationship to BigBlueprint Methodology

When `blueprint.yml` has `hive.enabled: true`, Stage 3 (Prototype) and Stage 5 (Documents) parallelize across multiple agents using the workflow above. CLAUDE.md adds the "register on session start" rule. Other stages benefit but to a lesser degree.

When `hive.enabled: false`, BigBlueprint runs in solo mode — TaskCreate handles single-session task tracking, and there's no coordination overhead.
