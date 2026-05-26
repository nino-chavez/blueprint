---
canonical: true
stage: 1
status: seeded
sources:
  - ~/Workspace/dev/wip/ai-hive/README.md
  - ~/Workspace/dev/wip/ai-hive/ONBOARDING.md
  - ~/Workspace/dev/wip/ai-hive/docs/BOOTSTRAP.md
  - ~/Workspace/dev/wip/subs-initiative/.hive/
  - ~/Workspace/dev/wip/subs-initiative/docs/hive/
  - ~/Workspace/dev/wip/subs-initiative/tools/hive-board-derive/
  - ~/Workspace/dev/wip/blueprint/docs/hive-coordination-pattern.md
  - ~/Workspace/dev/wip/blueprint/docs/hive-closure-drift-sync-pattern.md
---

# ai-hive as the alignment-layer companion to Blueprint

## What ai-hive is

A productized, installable kit for AI-agent + human team coordination. Three layers:

| Layer | What it does | Where it lives |
|---|---|---|
| Protocol | 20 MCP tools — `hive_propose`, `hive_react`, `hive_synthesize`, `hive_approve_plan`, `hive_create_task`, `hive_claim_task`, `hive_acquire_lock`, etc. | Cloudflare Worker, per-project |
| Persistence | Projects, sessions, proposals, reactions, syntheses, tasks, locks, decisions, checkpoints. | Cloudflare D1 (SQLite) |
| Live UI | Dashboard SPA subscribed to a server-sent-events stream. New activity surfaces ~1s after write. | Cloudflare Pages |

The kit ships as a standalone repo at `~/Workspace/dev/wip/ai-hive/`. Two modes of adoption per its own README:

- **Mode A — join an existing Hive.** Most common. Operator runs `claude mcp add --transport http hive <worker-url>/api/mcp --header "Authorization: Bearer <token>"`, restarts Claude Code, runs `/mcp`, sees the hive tools. Onboarding doc is 5-minute paste-and-go.
- **Mode B — bootstrap a fresh Hive.** Provision Cloudflare account / project, deploy Worker + D1 + dashboard via `docs/BOOTSTRAP.md` flow. Clone-to-live-URL in one command flow (the bootstrap automation is listed as in-progress).

This is the distribution shape Blueprint itself lacks.

## How subs-initiative composes Blueprint + ai-hive

subs-initiative is the only Blueprint reference project running both at full depth. Four named integration points:

### 1. Hive is the build-time coordination substrate

Multiple Claude Code sessions register via `hive_register_session`, propose changes via `hive_propose`, react/synthesize via the blackboard, and only spawn tasks via `hive_create_task` once a synthesis is approved. The locks (`hive_acquire_lock`) prevent two sessions stepping on each other's file edits.

Per `hive-coordination-pattern.md` litmus test: *"if you're about to spin up two Claude Code sessions on the same repo in parallel, you need Hive. If one session at a time is fine, you don't."*

Hive disappears at ship. It's build-time only.

### 2. Derive scripts make hive state agent-legible in repo

`tools/hive-board-derive/index.ts` pulls live hive D1 state + GitHub issue state, classifies open issues by lifecycle bucket (Shipped-not-closed / In-flight / Awaiting-impl-dispatch / Awaiting-synthesis / Reference / Stale / Other), writes deterministic markdown + JSON to `docs/hive/_board.json` and `docs/hive/_board.md`. The derived files are checked into the repo.

Sample bucket counts from a 2026-05-15 derive on subs-initiative:

| Bucket | Count |
|---|---|
| Shipped, not closed | 2 |
| Awaiting synthesis | 51 |
| Reference (long-lived trackers) | 27 |
| **Total open** | **80** |

This is precisely Lopopolo's pattern: *"what Codex can't see doesn't exist."* Live D1 state is illegible to a future agent session unless encoded into the repo as markdown. The derive bridges the substrate (D1) to the repo (markdown).

### 3. Pattern A portal surfaces hive state to stakeholders

`apps/portal/src/lib/derived.ts` and `apps/portal/src/components/DerivedRoadmap.tsx` read `docs/hive/_board.json` + `docs/audits/_state.json` and render dashboards on the portal's Inspect routes (`gates.astro`, `coverage.astro`, `dependencies.astro`, `attestations.astro`).

Result: stakeholders open `private-demo.example/inspect/` and see live-derived progress without touching the hive dashboard directly. The hive dashboard is for the build team; the portal Inspect routes are the externalized version for executive + discovery audiences.

This is the audience-switcher contract in action — same data, different presentation per audience pill.

### 4. Hive disappears at ship; derived artifacts remain

Per the coordination doc: *"it never ships in your application; it disappears when work is done."* The derived markdown + JSON stay as historical record. The portal continues to render them. This matches Blueprint's "shell is throwaway; artifacts are forever" rule (L7 encoding from 2026-05-25).

The lifecycle is:
1. Build phase: hive substrate live, agents/humans coordinate via MCP, dashboard tracks activity.
2. Derive (continuous): board state pulled into repo as markdown + JSON.
3. Ship: hive worker can be deprovisioned. The derive output is the durable record.
4. Post-ship: portal continues to surface the derived state as the inspect view.

## Failure modes encoded against

The 2026-05-16 stale-proposal sweep documented in `~/Workspace/dev/wip/blueprint/docs/hive-closure-drift-sync-pattern.md` is the canonical hive failure mode. 26 proposals stuck `open`/`discussing` indefinitely because GH issues got closed without a commit subject referencing `#NNN`, so `hive-closure-sync.yml` never fired `hive_mark_merged`.

Three code paths could leave a proposal stuck:
1. `hive_synthesize` called without `proposal_ids` — synthesis creates GH issue, source proposals stay open.
2. GH issue closed manually or via sweep — no commit subject referenced `#NNN`, so the closure-sync workflow doesn't fire.
3. Tasks created directly from proposals — skips `hive_approve_plan`, so `hive_rollup_merged` never walks back to source proposals.

The fix was two-part:
- One-shot cleanup script (`cleanup-stale-proposals.ts`) — classifies stale proposals + generates idempotent SQL for D1 application.
- Closure-sync GitHub Action — fires `hive_mark_merged` automatically on issue closure with sweep heuristics.

This is the encoded-response loop at the substrate layer. Same shape as Blueprint's reviewer-agent-at-stage-gate pattern, applied to hive lifecycle instead of methodology lifecycle.

## What ai-hive proves for Blueprint's distribution path

ai-hive is several maturity levels ahead of Blueprint on distribution. Specifically:

| Dimension | ai-hive today | Blueprint today |
|---|---|---|
| Standalone repo | Yes, productized | Yes, but treated as filesystem-copy source |
| Onboarding doc | 5-min paste-and-go, two modes (A / B) | Paste-a-prompt, single mode |
| Bootstrap automation | Worker + D1 + dashboard deployable via documented flow | Filesystem `cp -r` |
| Agent portability | Native MCP — Claude Code, Cursor, anything that mounts MCP | Locked to Claude Code agent reading markdown |
| Versioning | Worker deploy versioning, D1 schema migrations | Git log only |
| Public reference deploy | `ai-hive-mcp.example-account.workers.dev` | None |
| Real-time UI | SSE-driven dashboard, ~1s latency | None |

ai-hive shows what production-quality distribution looks like for Nino's tooling stack — same Cloudflare-first infrastructure, same Mode A / Mode B pattern, same MCP-tool-surface ergonomics. The Blueprint redesign prescription should adopt this distribution shape.

## The four-layer stack made explicit

```
Appleton's Ace           — multiplayer real-time alignment   (general code dev)
ai-hive                  — async blackboard alignment        (initiative scope) ← already exists
Blueprint                — methodology + scaffolding         (initiative deliverables)
Lopopolo's harness       — repo-discipline for agent code    (production codebase)
Codex / Claude Code      — agent runtime
```

ai-hive is the alignment-layer companion at exactly the right scope. The redesign prescription should name ai-hive explicitly as the load-bearing companion rather than treating it as an optional capability hidden behind `hive.enabled: true`.

Specifically: when an initiative declares `variant: midstream | brownfield` with `multi_operator: true`, ai-hive should be **mandatory**, not optional. The 2026-05-25 three-session reconciliation was a multi-operator initiative running without ai-hive coordination, and it produced the four-way drift the L1–L8 encodings now prevent.

## Open questions

- Should the canonical Blueprint distribution itself run on a hosted instance (`blueprint-mcp.<subdomain>.workers.dev`) that exposes both MCP tools and a REST API — same shape as ai-hive — instead of the filesystem-path-based current model? See `research/architecture/01-hive-cli-vs-mcp-with-optionality.md` for the protocol-choice investigation; same question applies to Blueprint's own distribution.
- Should the Blueprint portal templates (Pattern A's `apps/portal/` + Pattern B's `portal/`) ship hive-substrate-aware out of the box, with the substrate-derived dashboards as a permanently-present Inspect route that renders placeholder content when no substrate is wired? Currently the substrate-aware components are subs-initiative-specific and the stamper adds `REPLACE_FOR_PROJECT` banners.
- Does the ai-hive reaper / cleanup pattern (`tools/hive-board-derive/` + GitHub Actions sweeps) generalize to a Blueprint methodology-gardening pattern — a recurring agent that scans `template/` for inconsistencies between methodology docs, reviewer specs, and stamper behavior?
