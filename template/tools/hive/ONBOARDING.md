# Hive — team onboarding

> **Adopting this kit?** This is the doc you hand to your team after running the
> bootstrap. Before sharing, find/replace the placeholders — `<HIVE_WORKER_URL>`,
> `<HIVE_DASHBOARD_URL>`, `<HIVE_REPO>`, `<BEARER>` — with the values your bootstrap
> (`template/tools/hive/BOOTSTRAP.md`) produced.

The Hive coordinates a small team (2–3 concurrent operators) building on one repo.
Its pipeline (propose → react → synthesize → approve → claim tasks) runs inside a
project; events stream live to the dashboard. You'll be set up in ~5 minutes.

**First, the three things a new team trips on** (read these before you start —
they're the most common first-week failures):

1. **Authority is territory-bound, not centralized.** Surface owners (DRIs) are the
   *review-of-record* for their surface, not gates that approve everyone's work.
   Read your project's DRI table before filing on a surface you don't own. (See
   `docs/governance/team-roles-and-conventions.md`.)
2. **Spec changes go through a proposal, never a direct PR.** The BRD/PRD and other
   spec artifacts are not "docs you can PR." A change is a `[Spec]` proposal →
   synthesis → PR. Editing a spec file in a PR with no synthesis reference is the
   #1 new-contributor violation.
3. **A reaped session is recoverable — don't panic.** If your laptop sleeps, the
   reaper marks your session dead after 15 minutes of no activity and releases your
   claimed tasks. Recovery: `hive_register_session` again and re-claim. Commit +
   push + `hive_heartbeat` before stepping away so nothing is lost.

## What you need

- A laptop with Claude Code installed.
- A GitHub account added as a collaborator on `<HIVE_REPO>` (DM your lead if the
  invite isn't in your email).
- The Hive bearer token — DM'd to you separately, **never** posted in a channel.

## Step 1 — connect Claude Code to the Hive

Paste this as a **single line** (whitespace from a multi-line paste breaks URL
parsing) — replace `<BEARER>` and `<HIVE_WORKER_URL>`:

```bash
claude mcp add --transport http hive <HIVE_WORKER_URL>/api/mcp --header "Authorization: Bearer <BEARER>"
```

Quit Claude Code **completely** (the whole app, not just the window), reopen it,
then in any chat run `/mcp`. You should see `hive` with 20 tools. If it shows
`failed`, see Troubleshooting.

## Step 2 — team lead: create the project

In Claude Code:

> Use `hive_create_project` with:
> - name: "<Team> — <concept>"
> - github_repo: "<your-org>/<repo>"
> - default_branch: "main"
>
> Tell me the project_id when it's done.

Capture the **project_id** (a UUID) and DM it to the team thread — it's the join
key for everyone.

## Step 3 — each member: register your session

Everyone (including the lead) runs:

> Use `hive_register_session` with project_id `<the project_id>` and human_name
> `<your real full name>`.

**Use your real name** — the decision log attributes to it, and the trust model is
a shared token (see `docs/governance/hive-identity-gap.md`). Capture your **session_id**.

Open `<HIVE_DASHBOARD_URL>`, pick your project from the dropdown, and the board
hydrates live as people propose / react / synthesize.

## Step 4 — operate

1. **Propose** — `hive_propose` (project_id, session_id, name, title, description,
   category). Auto-creates a GitHub issue with the `proposal` label.
2. **React** — `support` / `challenge` / `alternative` / `build_on` / `question` /
   `concern`.
3. **Synthesize** — `hive_synthesize` combines proposals into a plan with action
   items (title, description, priority 1–5, optional `file_scope`).
4. **Approve** — `hive_approve_plan` creates a task per action item.
5. **Claim** — `hive_claim_task` returns the exact branch name, worktree command,
   and your `file_scope`. **Use them, don't invent.** Work only within your
   file-scope.
6. **Done** — `hive_update_task` to `review` **when the PR opens** (unblocks
   downstream immediately), then `merged` once it lands.

Commit at tier boundaries with the task id + synthesis id; **push after each tier**
(pushed work survives a reaped session).

## The dashboard

`<HIVE_DASHBOARD_URL>` shows live per-project state: Proposals, Board (open →
claimed → in_progress → review → merged), Sessions (who's connected, last
heartbeat), Activity feed, Participants. Updates push within ~1s. (`hiveLatency()`
in the console dumps SSE p50/p95/p99; `localStorage.hiveDebug = '1'` enables event
breadcrumbs.)

## Troubleshooting

**`/mcp` shows `hive` as `failed: ... cannot be parsed as a URL`** — the setup
command was pasted across multiple lines. `claude mcp remove hive` and re-paste as
a single line.

**No toast / badge / chime when teammates propose** — hard-reload the dashboard
(Cmd+Shift+R); check the project dropdown matches your teammates'; in DevTools
Network you should see an active `/api/events?project_id=...` `text/event-stream`.

**Session went `dead`, tasks released** — the 15-minute reaper. `hive_register_session`
again and re-claim. Heartbeat or keep working steadily before stepping away.

**GitHub issue creation skipped on a proposal** — the project was created without
`github_repo`, or the Worker has no `GITHUB_TOKEN` secret. Check `wrangler secret
list`; set with `wrangler secret put GITHUB_TOKEN` if needed (issue creation is
optional — artifacts still land in D1 without it).

## What's running this

- **Worker:** `<HIVE_WORKER_URL>` (Cloudflare Workers + D1) — 20 MCP tools + the
  60-second stale-session reaper.
- **Dashboard:** `<HIVE_DASHBOARD_URL>` (Cloudflare Pages).
- **Bootstrap a fresh Hive:** `blueprint hive setup --slug=<x>` — see [`./BOOTSTRAP.md`](./BOOTSTRAP.md).
- **Coordination model + conventions:** `docs/governance/team-roles-and-conventions.md`.
- **The identity gap (read before client/multi-team use):** `docs/governance/hive-identity-gap.md`.
