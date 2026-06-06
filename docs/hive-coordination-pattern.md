# Hive Multi-Agent Coordination — When and How to Use

**Purpose:** Captures when a Blueprint initiative benefits from the Hive multi-agent coordination layer (originally developed in `subs-initiative`), and how to bootstrap it without re-deriving the pattern.

**Last updated:** 2026-06-06

**Source:** `subs-initiative/.hive/` and a B2B client engagement initiative (May 2026).

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

**Use the scripted bootstrap — `blueprint hive setup`.** The manual sequence below
was the original path; as of wave 49 it collapses into one terraform-plan-style
command that provisions a fresh Hive (CF D1 + Worker + Pages dashboard) from a
vendored ai-hive kit:

```bash
# vendor the ai-hive kit into your repo (integrate, not absorb), then:
blueprint hive setup --slug=<team-or-product>-hive --cf-account-id=<id>            # dry-run PLAN — reviewable, no live mutation
blueprint hive setup --slug=<team-or-product>-hive --cf-account-id=<id> --execute  # provision for real
```

It is idempotent (D1/Pages reuse-if-exists, patches re-match) and dry-run by
default. The full walkthrough — prerequisites, the three inherently-manual steps
it can't script (`wrangler login`, CF API-token creation, `hive_create_project`),
and troubleshooting — lives in **`template/tools/hive/BOOTSTRAP.md`**
(implementation: `template/tools/hive/bootstrap.mjs`). To *join* an existing Hive
rather than stand one up, see `template/tools/hive/ONBOARDING.md` (~60 seconds).

> **Read the litmus first.** Most multi-operator work needs only the three
> zero-infrastructure conventions in `docs/team-roles-and-conventions.md`, not
> this substrate. Stand up a Hive only when contention is real (the gate in
> "When to Use Hive" above). And before any client-binding engagement, read
> `docs/hive-identity-gap.md` — the trust model is a shared bearer token.

Total time: ~10 minutes via `blueprint hive setup` once Cloudflare credentials are
ready; most of that is account/secret provisioning, not the Hive itself.

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

## Integration with Blueprint Stages

Hive operates *across* Blueprint's seven stages, not as a stage of its own:

| Stage | Hive role |
|---|---|
| 1. Research | Per-source research is one task each (competitive analysis, codebase, screenshots) — agents claim |
| 2. Design Principles | DESIGN.md is one task (one agent owns). Synthesis if multiple agents have input |
| 3. Prototype | One task per flow; one task per slice within. Shared chrome blocks all flow tasks |
| 4. Fact-Check | One task per claim category. Validators distinct from prototype-builders |
| 5. Documents | One task per document. Doc-writer claims; can split if multi-author |
| 6. Deploy | Often one task; sometimes split per surface (preview vs. prod) |
| 7. Iterate | Each iteration cycle is a new round of tasks, decisions, proposals |

The dependency graph is the most useful Hive feature for Blueprint: prototype tasks block on Stage-1-research-complete; document tasks block on prototype-complete; deploy task blocks on fact-check-complete.

---

## Anti-Patterns

1. **Bootstrapping Hive when you don't need it.** One-agent initiatives don't need ~1 hour of CF setup.
2. **Skipping Hive once it's bootstrapped.** Working without registering = silent collisions. Document this in CLAUDE.md as non-negotiable.
3. **Using Hive for product-runtime coordination.** Hive is build-time. Don't import MCP tools into your shipping code.
4. **Cloning subs-initiative `.hive/` and pointing at subs-initiative' D1 / CF account.** Always rebind to your own. Sharing D1 means tasks from other initiatives leak into yours.
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

See `subs-initiative/docs/decisions/` and `paradigm-b2b/docs/decisions/0003-hive-coordination.md` for examples.

---

## Reference Sources

| Source | Path |
|---|---|
| subs-initiative Hive | `~/Workspace/dev/wip/subs-initiative/.hive/` |
| subs-initiative ONBOARDING | `~/Workspace/dev/wip/subs-initiative/.hive/ONBOARDING.md` |
| subs-initiative WAYS-OF-WORKING | `~/Workspace/dev/wip/subs-initiative/WAYS-OF-WORKING.md` |
| a B2B client engagement Hive ADR | `~/Workspace/dev/wip/paradigm-b2b/docs/decisions/0003-hive-coordination.md` |

---

## Known Failure Mode: GH-Closed / Hive-Open Drift

Over time, proposals accumulate where the GitHub issue is CLOSED but the Hive status is still `open` or `discussing`. This happens when:

- `hive_synthesize` is called without passing `proposal_ids` (most common)
- GH issues are closed manually or via synthesis sweeps without a matching commit subject reference
- Tasks are created directly from proposals, bypassing `hive_approve_plan`

**Fix:** Add the `hive-closure-sync.yml` template workflow, which includes a "Proposal drift sync" step that self-heals this on every push to main. Details in `docs/hive-closure-drift-sync-pattern.md`.

**Prevention:** Enforce in `CLAUDE.md` or `WAYS-OF-WORKING.md` that every `hive_synthesize` call must include `proposal_ids`.

---

## Relationship to Blueprint Methodology

When `blueprint.yml` has `hive.enabled: true`, Stage 3 (Prototype) and Stage 5 (Documents) parallelize across multiple agents using the workflow above. CLAUDE.md adds the "register on session start" rule. Other stages benefit but to a lesser degree.

When `hive.enabled: false`, Blueprint runs in solo mode — TaskCreate handles single-session task tracking, and there's no coordination overhead.
