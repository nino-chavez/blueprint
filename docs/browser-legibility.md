# Browser Legibility Pattern

**Activates when**: any the original employer-prefixed name initiative needs the agent to validate its own UI work — i.e., every initiative with a `prototype/` or `portal/` shell.
**Reference for**: choosing between `browse-tool` (default, cheap) and Chrome DevTools MCP (escalation, heavy); install steps; per-worktree bootability.

## Why this pattern exists

Codex's harness engineering experiment (OpenAI, Feb 2026) treated *application legibility* as a Stage 0 prerequisite: the agent boots the app per git worktree, drives it via Chrome DevTools Protocol, queries a local observability stack, and validates its own fixes before opening a PR. Without this, every UI change requires a human to click through and confirm — which becomes the bottleneck once code throughput rises.

the original employer-prefixed name's audience (VPs clicking a Slack share-link) demands the same loop, but with a different cost ceiling. Chrome DevTools MCP alone costs ~18k tokens of always-loaded schema. Most stakeholder-prototype validation doesn't need network capture, console streaming, perf tracing, or accessibility-tree snapshots — it needs nav + DOM query + screenshot. So the default is a lighter primitive, and MCP escalates only when the task actually requires its capabilities.

## The default: `browse-tool`

`browse-tool` lives at `~/Workspace/dev/tools/browse-tool`. It is a set of small Bash-invokable CLIs (puppeteer-core under the hood) that connect to a single long-lived Chrome. State lives in `$TMPDIR/browse-tool-state.json`.

### Why it's the default

| Property | browse-tool | Chrome DevTools MCP |
|---|---|---|
| Schema cost | Few hundred tokens, loaded on demand via `@README.md` | ~18k tokens, always loaded |
| Profile per initiative | Yes — `~/.browse-tool/profiles/<cwd-basename>` auto-selected | No — single profile |
| Composability | Pipes, shell scripts, JSON output | MCP protocol calls only |
| Interactive selector picking | Yes — `browse-pick` | No |
| Adding a new command | One file in `bin/`, no protocol/rebuild/restart | Patch the MCP server |

The reason for the default is the token economics. Blueprint initiatives already push context with their docs/ tree (research, design-docs, exec-plans, references). 18k of unused MCP schema crowds out the design content the agent actually needs to reason from.

### Primitives

| Command | Use case |
|---|---|
| `browse-start` | Boot Chrome with the per-initiative persistent profile. Logged-in state survives sessions. |
| `browse-start --headless` | Same, without a visible window — for CI or background validation |
| `browse-start --profile` | First-run only: rsync your real Chrome profile (cookies, logins) into the persistent profile |
| `browse-start --reseed` | Force re-rsync after logging into a new account in real Chrome |
| `browse-stop` | Kill the managed Chrome and clear state |
| `browse-nav <url>` | Navigate active tab; `--new` for a new tab; `--wait` for `networkidle2` (default is `domcontentloaded`) |
| `browse-eval '<js>'` | Run JS in active page. Wrapped in `async () => { … }` so `return` and `await` both work. Result is JSON to stdout. |
| `browse-eval --file script.js` | Same but from a file — prefer this for non-trivial code |
| `browse-screenshot [--full] [--out path.png]` | Capture viewport or full page. Prints path so you can `Read` it. |
| `browse-tabs list` / `browse-tabs close <i>` | Tab management |
| `browse-pick` | Interactive picker — human hovers/clicks in Chrome, returns selector + element data as JSON. Use when stakeholder feedback references a specific element. |

### Per-worktree bootability

Codex's pattern was "app bootable per git worktree" so each PR has its own instance. browse-tool gives this for free because the profile is named after the cwd basename. Each worktree in `~/Workspace/dev/apps/rally-hq/.worktrees/<branch>` gets its own profile if the basename differs, or shares if not. For initiatives where parallel work needs profile isolation, override with `--profile-name <slug>`.

### Validation recipe (the common case)

```bash
# Stage 0 setup
browse-start

# Validate the prototype's home page renders
browse-nav http://localhost:5173 --wait
browse-screenshot --out /tmp/home.png

# Smoke-check that critical elements exist
browse-eval 'return document.querySelectorAll("[data-testid]").length'

# Validate strategy panel opens
browse-eval 'document.querySelector("[data-strategy-toggle]").click(); return document.querySelector("[data-strategy-panel]")?.classList.contains("open")'

browse-stop
```

That recipe covers ~80% of Blueprint validation. No MCP needed.

## Escalation: Chrome DevTools MCP

Only load MCP when the task actually requires capabilities browse-tool cannot synthesize from DOM access:

| Trigger phrase | Why MCP is required |
|---|---|
| "capture network requests" / "watch XHR" / "intercept fetch" | `browse-eval` can call `fetch`, but cannot subscribe to ambient network traffic the page generates |
| "stream console errors" / "log capture" / "watch for console.error" | `eval` reads page state at a point in time; it doesn't subscribe to the console event stream |
| "lighthouse audit" / "perf trace" / "core web vitals" | MCP wraps the CDP performance + lighthouse domains; browse-tool doesn't |
| "accessibility tree" / "ARIA snapshot" / "a11y audit" | MCP exposes the computed a11y tree directly; DOM-only `eval` misses computed roles, names, focus order |

When none of these fire, MCP schemas do not load. The agent's first reach is always browse-tool.

## Inferability — how the agent picks

Three places encode the choice so the agent self-routes without guessing:

1. **`prototype/CLAUDE.md` per initiative** declares the available browser sensors. Default: browse-tool only. Adding MCP requires an explicit override per the table above.
2. **The four-row escalation table** in this doc. The agent grep-matches the user's task description against the trigger phrases. Hit → load MCP. No hit → browse-tool only.
3. **The `template/CLAUDE.md` Stage 0 block** repeats the rubric so it's always in context for new initiatives.

If the agent is uncertain whether a task needs MCP, the rule is **start with browse-tool, escalate on second-pass failure** — because the cost of one wasted browse-tool attempt is trivial, and the cost of always loading MCP is paid every session.

## What this does NOT cover

- **Observability stack** (LogQL/PromQL/TraceQL per worktree). Codex wired Victoria Logs/Metrics/Traces into every worktree because they were building a production product with telemetry. Most Blueprint stakeholder prototypes don't have ambient telemetry to query. Out of scope; add per-initiative when the prototype includes a real backend.
- **Multi-page persistent state** (e.g., logged-in session that must survive across many test steps). Use `browse-start --profile` once to seed; the persistent profile then survives between commands.
- **Mobile viewports / device emulation**. browse-tool's Puppeteer connection supports `setViewport` via `browse-eval`, but if mobile testing becomes load-bearing, escalate to MCP's `emulate` capability.

## Origin

Distilled from the OpenAI Codex harness engineering post (Feb 2026) — specifically the "Increasing application legibility" section where they wired Chrome DevTools Protocol into the agent runtime. browse-tool is the lighter equivalent for Blueprint's audience, inspired by Mario Zechner's *What if you don't need MCP at all?* (Nov 2025) and built at `~/Workspace/dev/tools/browse-tool`. Conversation that triggered this: 2026-05-25 the original employer-prefixed name v2 patch.
