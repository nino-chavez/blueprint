# BOOTSTRAP — stand up a fresh Hive with `blueprint hive setup`

Use this when you want **your own** Hive instance — your own Cloudflare Worker, D1,
and dashboard — for a coordinated team build. If you only want to *join* an existing
Hive, you don't need this: see [ONBOARDING.md](./ONBOARDING.md) (60 seconds).

> **First, decide if you even need this.** The full Hive substrate is the **"run"**
> rung of crawl → walk → run. Most multi-operator work is handled by the three
> zero-infrastructure conventions in
> [`docs/team-roles-and-conventions.md`](../../../docs/team-roles-and-conventions.md).
> Stand up this substrate only when the litmus there is met (5+ parallel streams, ≥2
> concurrent sessions on one repo, real file collisions, a tight deadline). Below that
> bar it's overhead. And read [`docs/hive-identity-gap.md`](../../../docs/hive-identity-gap.md)
> before any client-binding engagement — the trust model is a shared bearer token.

## What you provide vs. what the script does

The bootstrap is **one command** — `blueprint hive setup` — that runs ~18 scriptable
steps (create D1, patch config, migrate, set the bearer, deploy the Worker, wire the
dashboard, deploy Pages). Three things stay **manual by nature** (browser / judgment /
in-Claude-Code) and are listed below; the script checks the first and prints the other
two in its summary.

| Manual (you do these) | Scripted (`blueprint hive setup` does these) |
|---|---|
| `wrangler login` (one-time browser OAuth) | dep check · D1 create + capture id · patch `wrangler.toml` |
| Create the CF API token with the right scopes | migrate (local + remote) · generate + set the bearer |
| `hive_create_project` (in Claude Code, via MCP) | deploy Worker · wire + deploy the Pages dashboard · GH secrets |

## Prerequisites

- A **Cloudflare account** with Workers + D1 + Pages enabled, and your **account ID**
  (Cloudflare dashboard → right sidebar). You'll pass it as `--cf-account-id`.
- **`gh`**, **`npm`**, **Node ≥ 20** (22 recommended) on your PATH, and **Claude Code**.
- The **ai-hive kit vendored into your repo** (the script operates on it; it does not
  ship it — *integrate, not absorb*):
  ```bash
  # subtree it under .hive/ (the convention `blueprint hive setup` defaults to):
  git subtree add --prefix=.hive https://github.com/<your-ai-hive-fork> main --squash
  cd .hive/apps/mcp-server && npm install && cd -
  ```

### Manual step 1 — `wrangler login` (one-time, browser)

```bash
cd .hive/apps/mcp-server
npx wrangler login        # opens a browser; one-time per machine
npx wrangler whoami       # confirm the RIGHT account is selected
```

If `whoami` shows the wrong account, your CF login defaulted to a personal one — the
bootstrap pins `account_id` from `--cf-account-id`, so it'll still target the right one,
but verify here to avoid surprises. The script **aborts at step 2** if you're not logged
in — this is the precondition it checks, not one it performs.

## Run it — plan first, then execute

The command is **dry-run by default** (terraform-plan style): it prints every exact
command and file patch it *would* run, touching no live infrastructure. Review it, then
re-run with `--execute`.

```bash
# 1. PLAN — safe, reviewable, no CF mutation. Do this first.
blueprint hive setup --slug=<team-or-product>-hive --cf-account-id=<your-account-id>

# 2. EXECUTE — provisions for real once the plan looks right.
blueprint hive setup --slug=<team-or-product>-hive --cf-account-id=<your-account-id> --execute
```

- `--slug` names all three resources (`<slug>-mcp`, `<slug>-d1`, `<slug>-dashboard`).
  Lowercase alphanumeric + dashes. Pick `<team>-hive` or `<product>-hive`; use a distinct
  slug per Hive so siblings in one CF account don't collide.
- `--hive-dir` defaults to `./.hive`; pass it if your kit is elsewhere.
- **Idempotent.** A re-run reuses an existing D1 / Pages project rather than failing, and
  re-applies patches in place — so a mid-run failure is safe to fix and re-run.

The bearer token is generated with `crypto.randomBytes` and set as the `HIVE_AUTH_TOKEN`
Worker secret. It is printed **once**, at the end. Store it in 1Password and DM it to
teammates — never post it in a channel.

### Manual step 2 — the CF API token (browser), for GitHub auto-deploy

So merging-is-deploying (GitHub Actions runs `wrangler deploy` on push), the workflows
need a Cloudflare API token. Token creation is a browser step:

1. https://dash.cloudflare.com/profile/api-tokens → **Create Token** → start from
   **Edit Cloudflare Workers**.
2. Add two permission rows: **Account → D1: Edit** and **Account → Cloudflare Pages: Edit**.
3. Scope **Account Resources** to the specific account (not "All accounts"). 30-day TTL is fine.
4. Create, copy the token (shown once).

Then hand it to the script (it sets both repo secrets via `gh`):

```bash
blueprint hive setup --slug=<slug> --cf-account-id=<id> --execute \
  --cf-api-token="$(op read 'op://Developer Secrets/Cloudflare .../credential')"
```

Omit `--cf-api-token` and the script skips that step and prints the manual
`gh secret set CF_API_TOKEN` / `gh secret set CF_ACCOUNT_ID` fallback instead. (Optional:
`--github-token` sets `GITHUB_TOKEN` so proposals auto-create GitHub issues; without it,
artifacts still land in D1.)

### Manual step 3 — register the first project (in Claude Code, via MCP)

The script's summary ends with the `claude mcp add` line for the team and this prompt.
Run it in Claude Code once the Worker is up:

```
Use hive_create_project with name "<Team> — <concept>",
  github_repo "<your-org>/<repo>", default_branch "main". Report the project_id.
```

Share the **project_id** with the team — it's the join key. Then everyone follows
[ONBOARDING.md](./ONBOARDING.md).

## When it's done

You'll have a deployed Worker (`https://<slug>-mcp.<subdomain>.workers.dev`), a live
dashboard (`https://<slug>-dashboard.pages.dev`), auto-deploy on push to `main` for both,
and a first project ready for sessions. Hand the team
[`docs/team-roles-and-conventions.md`](../../../docs/team-roles-and-conventions.md) and
[ONBOARDING.md](./ONBOARDING.md).

## Troubleshooting

- **Stops at step 2 (`wrangler whoami` failed)** — run `npx wrangler login` in
  `.hive/apps/mcp-server` first (manual step 1).
- **Stops at step 1 (wrangler not resolvable)** — `cd .hive/apps/mcp-server && npm install`.
- **`migrations apply` fails with "table already exists"** — a prior `d1 execute --file`
  ran the SQL without recording it in the `d1_migrations` tracker. Record it:
  `npx wrangler d1 execute <slug>-d1 --remote --command "INSERT INTO d1_migrations (name) VALUES ('0001_init.sql')"`,
  then re-run. (Always use `migrations apply`, never `d1 execute --file`, so CI stays idempotent.)
- **D1 / Pages "already exists"** — not a failure; the script reuses them. Safe to re-run.
- **Couldn't parse the database_id / Worker URL** — wrangler changed its output format.
  The step prints the raw output; grab the value by hand and re-run from the next step
  (completed steps are idempotent).

## When NOT to bootstrap

- You only want to evaluate an existing Hive → join one instead (ONBOARDING.md, 60s).
- Your team is 1–2 people for under a week → the coordination overhead exceeds the win;
  stay on the conventions.
- You don't have CF admin → work with whoever provisioned the Hive you'll use.
