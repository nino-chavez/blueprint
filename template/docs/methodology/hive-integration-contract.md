# Hive integration contract

How Blueprint integrates with a **Hive** coordination companion — defined as a
**substrate-agnostic MCP tool contract**, not a specific host. Blueprint owns the
methodology; Hive owns coordination, persistence, and (when it lands) identity.
**Integrate, not absorb** — Blueprint never reimplements Hive's internals, and Hive
never owns methodology.

## Why a contract, not a host

There are multiple Hive incarnations at different hosts:

| Hive | Host | State |
|---|---|---|
| subs-initiative `.hive` (`the-hive-worker`) | **Cloudflare Worker + D1** | **proven** — shipped in a real initiative |
| hackathon-hive | Vercel + Supabase | built (hackathon) |
| ai-hive (T.'s canonical design) | Supabase | architecture RFC (unbuilt) |

They **all expose the same `hive_*` MCP tool surface** — only the hosting differs.
So Blueprint integrates against that tool surface (the constant), not a host (the
variable). Whichever Hive an org runs, if it speaks these tools, Blueprint works
with it. Picking the canonical Hive to *run* is an org/Hive-owner decision, separate
from this contract; the contract holds regardless.

## The wiring (consumer side)

One field in `blueprint.yml`:

```yaml
hive:
  enabled: true
  mcp_endpoint: "https://<your-hive>/mcp"   # ANY host — the only required wiring
```

When `enabled`, the SessionStart flow registers the session with Hive before any
work (`docs/patterns/hive-coordination-pattern.md` covers when to use it). The
host-specific `blueprint.yml` fields (`cf_account`, `d1_database`, `mcp_server`,
`dashboard`) are optional and apply **only** if you self-host the Cloudflare
Worker + D1 reference implementation.

## The tool contract

A conforming Hive exposes these MCP tools (the proven subs-initiative surface,
~25 tools). Blueprint calls them; it does not implement them.

**Session lifecycle** — `hive_register_session`, `hive_deregister_session`,
`hive_heartbeat`, `hive_get_context`, `hive_subscribe`

**Projects & repos** — `hive_create_project`, `hive_list_projects`, `hive_link_repo`

**Tasks** — `hive_create_task`, `hive_claim_task`, `hive_release_task`,
`hive_update_task`, `hive_branch_merged`, `hive_mark_merged`, `hive_rollup_merged`

**Locks** (conflict-free parallel edits) — `hive_acquire_lock`, `hive_release_lock`

**Brainstorm / decisions** (the blackboard) — `hive_propose`, `hive_react`,
`hive_get_proposals`, `hive_archive_proposal`, `hive_approve_plan`,
`hive_log_decision`

**Status** — `hive_checkpoint`, `hive_status`

A Hive that implements this surface satisfies the contract. New tools are additive;
Blueprint depends only on the set above.

## The boundary (integrate-not-absorb)

| Blueprint owns | Hive owns |
|---|---|
| The methodology, stages, reviewers, the pipeline | Task board, locks, decision log, blackboard |
| `blueprint.yml`, the deliverables, the portal | Session identity, persistence, realtime sync |
| Calling the `hive_*` tools at the right moments | Implementing them; the host (CF/D1, Vercel/Supabase, …) |

Blueprint must never absorb Hive's persistence/identity/coordination into itself —
that is the named SaaS-creep failure mode. Access control across departments stays
the git host's job (CODEOWNERS + rulesets + `access.roles`); Hive is the *live
coordination* companion, not the access substrate.
