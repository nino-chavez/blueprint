---
canonical: true
stage: 1
status: seeded
sources:
  - ~/Workspace/dev/wip/subs-initiative/.hive/apps/mcp-server/src/worker.ts
  - ~/Workspace/dev/wip/subs-initiative/.hive/apps/mcp-server/src/index.ts (deprecated)
  - ~/Workspace/dev/wip/ai-hive/README.md
  - ~/Workspace/dev/wip/ai-hive/ONBOARDING.md
related:
  - 01-ai-hive-as-companion.md
---

# Hive CLI vs MCP — protocol optionality investigation

## The question

ai-hive currently exposes its coordination surface via MCP (Model Context Protocol) over HTTP. Operators run `claude mcp add --transport http hive <worker-url>/api/mcp --header "Authorization: Bearer <token>"`, restart Claude Code, and the 20 hive tools become callable from inside an agent session.

**Should ai-hive also ship a CLI that wraps the same backend, giving operators the choice between MCP-as-tool-surface and CLI-as-shell-surface for the same operations?**

This investigation says yes, with a specific architecture: same Worker, same D1, additive REST/HTTP surface, thin CLI client. Both protocols coexist; neither replaces the other.

## Why this matters for the Blueprint redesign

ai-hive's distribution shape (Worker + D1 + dashboard + MCP) is the production-quality reference Blueprint itself should adopt (per `research/current-state/01-ai-hive-as-companion.md`). Settling the CLI vs MCP question on ai-hive also settles it for Blueprint's own future distribution — the same architectural questions apply.

Specifically: **agent portability** is the second-most-cited Blueprint production-quality gap (per the gap inventory). MCP-only locks consumers to Claude Code (and any other MCP-aware client). Adding a CLI unlocks the entire shell-scripted / CI-driven / non-agent surface area, including the non-Claude AI assistants that don't speak MCP.

## Current state — what the Worker already exposes

Read from `subs-initiative/.hive/apps/mcp-server/src/worker.ts`:

The subs-initiative hive Worker already exposes **multiple HTTP routes**, not just MCP:

| Route | Auth | Purpose | Caller |
|---|---|---|---|
| `/api/mcp` | Bearer token | MCP JSON-RPC; 20 hive tools | Agent (MCP client) |
| `/api/proposals/:id/reactions` | Origin allowlist | Quick-react write from the dashboard | Browser (dashboard SPA) |
| `/api/dashboard` (implied by code comments) | Public read | Read-only board state | Browser (dashboard SPA) |

The dashboard's quick-react endpoint is the proof-of-concept: it accepts an HTTP POST from the browser, mints an internal bearer token, and forwards to `/api/mcp` as a JSON-RPC `tools/call hive_react` subrequest. The canonical reaction handler in `@ai-hive/core/tools/brainstorm` runs unchanged. **One backend, two protocols, same business logic.**

This pattern generalizes. The architecture for CLI optionality already exists at the protocol layer; what's missing is (a) a complete REST surface across all 20 tools and (b) a CLI client that calls it.

## Protocol comparison

### MCP-as-tool-surface (current)

| Property | Detail |
|---|---|
| **Discovery** | Agent runs `/mcp`; sees the 20 tools with schema-driven argument hints. |
| **Auth** | Bearer token in `Authorization` header on `/api/mcp` POSTs. |
| **Invocation** | JSON-RPC `tools/call` with structured arguments validated against tool schema. |
| **Output shape** | Structured (typed payload), agent-readable directly. |
| **Real-time** | The hive dashboard SSE stream pushes updates; MCP tools themselves are request-response. |
| **Client requirement** | MCP-aware client (Claude Code, Cursor, custom MCP harness). |
| **Use case fit** | Agent-driven workflows: a session reasons about state and calls tools as part of its plan. |

### CLI-as-shell-surface (proposed)

| Property | Detail |
|---|---|
| **Discovery** | `hive --help` → command list; `hive proposal --help` → sub-command help. Same content as MCP tool schemas, different surface. |
| **Auth** | Bearer token from env var (`HIVE_TOKEN`) or config file (`~/.hive/config.toml`). |
| **Invocation** | `hive proposal create --title "..." --description "..." --project-id <uuid>` → POST `/api/v1/proposals`. |
| **Output shape** | Structured (JSON via `--json` flag) or human (text/table by default). |
| **Real-time** | Optional: `hive watch proposals --project-id <uuid>` connects to the SSE stream and prints updates. |
| **Client requirement** | A shell. Any shell. |
| **Use case fit** | Human-driven workflows, CI/CD, GitHub Actions, cron, agent harnesses that don't speak MCP, scripting in Make/bash/zsh. |

## What each protocol unlocks (and what it doesn't)

### Use cases MCP keeps as the right tool

- **In-session agent coordination.** When a Claude Code session is reasoning about a feature and the agent decides to lock a file before editing it (`hive_acquire_lock`), MCP is the right surface. The agent has the tool in its toolbox; the LLM picks it as part of its plan. A CLI subprocess invocation adds friction (the agent has to format the command, parse the output, recover from non-zero exits) for no benefit.
- **Schema-validated argument shapes.** MCP tool schemas are visible to the model; arguments are validated server-side; type mismatches return structured errors. A CLI can't replicate this — args are strings, errors are exit codes.
- **Live dashboard.** The SSE stream pushes activity to the dashboard. CLI users get this via `hive watch` but it's an opt-in poll-like loop, not the default surface.

### Use cases the CLI unlocks that MCP can't

- **GitHub Actions / CI.** *"On every push to main, derive the hive board and commit the markdown."* That's `hive board export --format=markdown > docs/hive/_board.md` in a workflow step. MCP requires a stateful agent session — wrong shape for CI.
- **Pre-commit / pre-push hooks.** *"Before pushing, check that you don't hold any hive locks."* `hive locks list --session=$HIVE_SESSION` in a git hook.
- **Cron-driven cleanup.** The `hive-closure-drift-sync-pattern.md` cleanup script is currently a one-shot TypeScript file applying SQL directly to D1. A CLI version (`hive sweep stale-proposals --apply`) makes it idempotent + reusable + observable, with structured logging.
- **Non-Claude agent harnesses.** Cursor mounts MCP. Codex (OpenAI's CLI) doesn't yet. A user who wants to coordinate with hive from Codex or a custom GPT-API harness has no path today. With CLI, they shell-execute it.
- **Onboarding inspection.** New team member runs `hive doctor` → checks connectivity, validates bearer token, lists registered sessions for the project. No agent session required.
- **Composition with standard Unix tools.** `hive proposals list --json | jq '.[] | select(.status=="open") | .title'`. MCP output goes into agent context, not into a pipe.
- **Headless agents in long-running jobs.** A scheduled agent runs unattended; it has no MCP client, just a shell. CLI is the only path.

### Cases where either works

- **Manual operator actions.** *"Mark this proposal as approved."* Either `hive_approve_plan` from inside a Claude Code session or `hive proposal approve <id>` from a terminal — operator preference.
- **One-off ingestion.** *"Import the existing GH issues as proposals."* Either tool works; CLI feels more natural for batch.

## Recommended architecture — same backend, dual surface

```
                       ┌─────────────────────────────┐
                       │  Cloudflare Worker (single) │
                       │                             │
   Agent ──────MCP────▶│  /api/mcp                   │
   (Claude Code,       │   ▲                         │
    Cursor, ...)       │   │                         │
                       │   │ shares handlers         │
                       │   ▼                         │
   CLI / curl / CI ──▶│  /api/v1/...     (REST)     │
                       │   - proposals               │
                       │   - reactions               │
                       │   - syntheses               │
                       │   - tasks                   │
                       │   - locks                   │
                       │   - sessions                │
                       │                             │
   Browser ─────HTTP──▶│  /api/dashboard  (public R) │
                       │  /api/proposals/.../react   │
                       │                             │
                       │           D1                │
                       └─────────────────────────────┘
```

### Why this works mechanically

The Worker's tool handlers in `@ai-hive/core/tools/*` are already protocol-agnostic. They take typed inputs, run business logic, return typed outputs. The MCP layer wraps them in JSON-RPC; a REST layer wraps them in HTTP method + path + JSON body. The subs-initiative Worker already does this in one direction (the dashboard's quick-react → `/api/mcp` subrequest); generalizing it to first-class REST is additive, not a rewrite.

### Why this is low-risk

- **Single source of truth.** Both protocols write to the same D1 tables via the same handlers. Schema migrations don't fork.
- **Auth surface stays simple.** Bearer token + origin allowlist already work; REST gets bearer auth, same as MCP.
- **Backward compatibility.** Existing MCP consumers don't change. Adding REST is purely additive.
- **Documentation single-source.** Generate both MCP tool schemas + REST OpenAPI from a shared TypeScript contract. CLI `--help` strings render from the same source.

### Why this is right-sized

- **Don't build a separate server.** A separate "ai-hive REST API" service would fragment auth, persistence, deploy story. Reuse the Worker.
- **Don't build a heavyweight CLI framework.** The 20 hive operations are a flat command set. `commander.js` or Node's built-in `parseArgs` is enough. No need for plugin systems, completion frameworks, etc.
- **Don't try to ship 20 commands at v1.** Ship the 6 most-CI-relevant: `proposal create`, `proposal list`, `proposal approve`, `task list`, `task claim`, `board export`. Add more as use cases surface.

## Implementation surface (rough order of magnitude)

| Component | Estimated effort | Output |
|---|---|---|
| Define shared TypeScript contract (input/output types per operation) | 1-2 days | `@ai-hive/contract` package; consumed by both MCP and REST layers |
| Add `/api/v1/*` REST routes to the Worker, wrapping existing handlers | 2-3 days | All 20 operations exposed via HTTP |
| Generate OpenAPI spec from the contract | 0.5 day | `docs/openapi.yaml`, auto-checked into repo |
| Build CLI (`packages/cli/`) — argument parsing, HTTP client, output formatting | 3-5 days | `hive` binary publishable via npm |
| Add `hive watch` SSE consumer for live updates | 1 day | CLI users can subscribe to the same stream the dashboard does |
| Auth: read `HIVE_TOKEN` from env, fall back to `~/.hive/config.toml`, fall back to `hive auth login` flow | 1 day | Frictionless first-run experience |
| Documentation — update README, ONBOARDING.md with CLI Mode | 1 day | Mode A (MCP), Mode B (CLI), Mode C (bootstrap own Worker) |

Total rough estimate: ~10-15 working days for a complete first version including docs. A minimum-viable surface (just `board export` + `proposal list` + auth) could ship in 2-3 days as a wedge to validate demand.

## Distribution

ai-hive's CLI publishes to npm as `@ai-hive/cli`. Installation:

```bash
npm install -g @ai-hive/cli                    # global install
npx @ai-hive/cli proposal list --project=<id>  # no-install run
brew install ai-hive                            # eventual homebrew formula
```

The CLI auto-detects the Worker URL via:
1. `HIVE_WORKER_URL` env var
2. `~/.hive/config.toml` `worker_url` key
3. `.hive/config.toml` in cwd or ancestor (per-project override)
4. Falls back to the public reference deploy (`ai-hive-mcp.example-account.workers.dev`) with a "you're using the shared deploy" warning

This mirrors how the subs-initiative portal's `blueprint-init` stamper resolves the canonical Blueprint repo via `BLUEPRINT_HOME` env var. Same pattern, applied to a different substrate.

## What this means for Blueprint redesign prescription

Three implications:

### 1. Blueprint should adopt the same dual-protocol shape

If Blueprint's redesign distribution targets `npx blueprint init` (per `research/current-state/02-blueprint-production-quality-gaps.md`), the same MCP-vs-CLI question applies. The recommendation: Blueprint ships a CLI as the primary surface (operator-driven adoption) AND an MCP server exposing the conformance reviewers as tools (agent-driven enforcement at stage gates). Both consume the same canonical methodology source.

### 2. Reviewer agents should be callable as both MCP tools and CLI subcommands

Currently `portal-pattern-a-conformance-reviewer.md` and `portal-pattern-b-conformance-reviewer.md` are markdown specs invoked by Claude Code's Agent tool. To run them in CI, an operator has no path. If they become tools — `blueprint review portal-pattern-a --target=./apps/portal/` returning structured PASS/BLOCKED/WARN — then GitHub Actions can run the reviewer on every PR. That closes the "reviewers are Claude-Code-locked" gap (gap #4 in the production-quality inventory).

### 3. The CLI / MCP duality is itself a Pattern A portal Inspect route

When the redesigned Blueprint portal exists, its Inspect lane should surface "current reviewer run results" — passing the conformance reviewers as a CLI invocation in CI populates a `docs/audits/_state.json`, which the portal's Inspect route renders. Same pattern subs-initiative uses for hive board derivation.

## Risks + open questions

- **Maintenance burden of dual protocols.** Mitigation: shared contract. The MCP handlers and REST handlers wrap the same business logic; only the wire format differs. If they drift, that's a methodology bug.
- **Auth UX divergence.** The MCP path uses bearer-in-header; the REST path uses bearer-in-header too. CLI reads from env / config / login flow. Same token everywhere. Auth surface stays simple if we resist the temptation to add OAuth, OIDC, etc. for v1.
- **Output formatting drift.** CLI defaults to human-readable; `--json` flag emits machine-readable. The JSON output should match the MCP tool's structured output exactly. Tested via contract tests.
- **Versioning.** When the REST API evolves, what breaks? Recommendation: version the path (`/api/v1/proposals`); CLI pinned to a contract version; both can deprecate gracefully. MCP tool schemas already version via the protocol.
- **Should the CLI also speak MCP-over-stdio for local agent harnesses that prefer stdio?** Possibly. The original `src/index.ts` stdio path was deprecated because it required a Supabase client at load time; that's no longer true after migration. Resurrecting stdio-MCP-via-CLI would let `claude mcp add --transport stdio hive 'hive mcp serve'` work — same trust model, no network hop. Marginal value, modest cost.

## Recommendation

Build the CLI. Ship the minimum-viable surface first (board export + proposal list + auth flow + doctor command — ~2-3 working days). Validate that operators reach for it in CI and ad-hoc shell contexts. Expand to the full 20-operation surface only when demand exists; don't preemptively bloat the binary.

The MCP surface stays exactly as it is. Adding REST + CLI doesn't change anything for current MCP consumers.

The Blueprint redesign should treat this CLI as the reference shape for its own future distribution. Same Cloudflare-first backend, same dual-protocol surface, same shared-contract maintenance discipline.

## Decision point for the redesign prescription

When Stage 2 prescription is written, this investigation feeds two prescription items:

1. **ai-hive ships a CLI alongside its MCP surface.** Recommended start: 2-3 day minimum-viable wedge (board export, proposal list, doctor, auth).
2. **Blueprint v1 distribution mirrors ai-hive's dual-protocol shape.** `npx blueprint init` as primary; `blueprint review <reviewer>` as CLI for CI; MCP server exposing the same reviewer set as tools for agent-driven enforcement.

Both items defer detailed engineering work to Stage 3. This document is the architectural foundation that prescription leans on.
