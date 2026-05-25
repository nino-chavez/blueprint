# Cloudflare Deployment Pattern

**Purpose:** Captures the CF-native deployment pattern (wrangler configs, path-scoped GitHub Actions, secrets, multi-environment) so initiatives targeting Cloudflare don't have to derive it.

**Last updated:** 2026-05-08

**Source:** `bc-subscriptions` and Paradigm B2B initiative (May 2026).

**Related:** `hive-coordination-pattern.md` (Hive runs on CF using this same pattern). `bc-marketplace-context.md` and `bc-b2b-edition-context.md` (BC initiatives often pair with CF for the agent runtime).

---

## When to Use This Pattern

Use it when:

- Initiative deploys to Cloudflare Workers, Pages, or both
- Multi-app monorepo (bc-subscriptions, paradigm-b2b shape: `apps/*`, `packages/*`, `prototype/`, `.hive/`)
- Path-scoped CI/CD (changes in `apps/api/**` should only trigger api deploy, not storefront)
- Cloudflare-native primitives in use (D1, KV, R2, Vectorize, Workers AI, Queues)

Skip when:

- Single-app, deploy-everywhere-on-push project (just use one workflow)
- Vercel-coupled framework (Next.js 16 + OpenNext is Vercel-native; CF works but fights the framework)
- Static-only sites without backend (just `wrangler pages deploy` once)

---

## CF Resource Inventory (Reference Map)

| Primitive | Use case | bc-subs example | Paradigm example |
|---|---|---|---|
| **Worker** | API, agent runtime, MCP server | `subs-api`, `subs-storefront-svelte`, `subs-hive-mcp` | `paradigm-api`, `paradigm-storefront`, `paradigm-hive-mcp` |
| **Pages** | Static SPA, prototype, admin UI, dashboard | `subs-prototype`, `subs-admin`, `hive-dashboard-cwu` | `paradigm-prototype`, `paradigm-admin`, `paradigm-hive-dashboard` |
| **D1** | Transactional state (orders, signals, configs) | `subs-api-d1`, `subs-hive-d1` | `paradigm-api-d1`, `paradigm-hive-d1` |
| **Workers AI** | LLM inference (chat, vision, embeddings) | (none Phase 1) | `@cf/meta/llama-3.3-70b`, `@cf/meta/llama-3.2-11b-vision` |
| **Vectorize** | RAG, semantic search | (reserved) | `paradigm-rag` |
| **KV** | Caching, idempotency, session state | (reserved) | `paradigm-cache` |
| **R2** | File uploads, generated PDFs, exports | (reserved) | `paradigm-uploads` |
| **Queues** | Outbox events, async work | `subs-events` | `paradigm-events` |
| **Cron Triggers** | Scheduled jobs (forecasting, scans, backfills) | charge dispatch every minute | at-risk scan every 5 min, vectorize backfill every 6 hr |
| **Rate Limiter** | Per-customer / per-store limits | magic-link send caps | LLM call caps per scenario |
| **Durable Objects** | Distributed coordination | (reserved) | (reserved) |

---

## Wrangler Config Conventions

### Per-app `wrangler.toml`

Each app under `apps/*/` has its own `wrangler.toml`. Top-level `infra/cloudflare/wrangler.toml` only exists if there's a primary API Worker that lives at the repo root rather than under `apps/`.

```toml
name = "paradigm-api"
main = "src/worker.ts"
compatibility_date = "2026-04-01"
compatibility_flags = ["nodejs_compat"]

# Plain vars (committed, non-sensitive)
[vars]
ENVIRONMENT = "preview"
BIGCOMMERCE_CHANNEL_ID = "1"
LOCAL_BUYER_PORTAL_HOST = "http://localhost:3001"

# D1
[[d1_databases]]
binding = "DB"
database_name = "paradigm-api-d1"
database_id = "<from wrangler d1 create>"

# KV
[[kv_namespaces]]
binding = "CACHE"
id = "<from wrangler kv namespace create>"

# R2
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "paradigm-uploads"

# Vectorize
[[vectorize]]
binding = "VECTORIZE"
index_name = "paradigm-rag"

# Workers AI
[ai]
binding = "AI"

# Queues (producer)
[[queues.producers]]
binding = "QUEUE"
queue = "paradigm-events"

# Queues (consumer)
[[queues.consumers]]
queue = "paradigm-events"
max_batch_size = 10

# Cron triggers
[triggers]
crons = ["*/5 * * * *", "0 */6 * * *"]

# Per-environment overrides
[env.production]
name = "paradigm-api"
[env.production.vars]
ENVIRONMENT = "production"
```

### Secrets management

| Type | How to set | When |
|---|---|---|
| **Plain vars** | `[vars]` in `wrangler.toml` (committed) | Non-sensitive: channel IDs, environment flags, public URLs |
| **Secrets** | `wrangler secret put NAME` | Sensitive: API tokens, encryption keys, OAuth secrets |
| **GitHub Actions secrets** | Repo settings → Secrets and variables | CF API tokens used by deploy workflows |

**Never commit** these to `wrangler.toml`:
- `BIGCOMMERCE_ACCESS_TOKEN`
- `B2B_API_TOKEN`
- `STOREFRONT_SESSION_SECRET`
- `CREDENTIAL_ENCRYPTION_KEY`
- Any OAuth `CLIENT_SECRET`
- Any 3rd-party API keys (PROS, Stripe, Klaviyo, Anthropic, etc.)

---

## Path-Scoped GitHub Actions

The pattern: one workflow per app, triggered only when paths under that app change.

### Example: `.github/workflows/deploy-paradigm-api.yml`

```yaml
name: Deploy paradigm-api

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'packages/**'                  # shared packages affect this app
      - '.github/workflows/deploy-paradigm-api.yml'
  workflow_dispatch:                   # manual trigger for prod promotion

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm --filter=./apps/api typecheck

      - name: Apply D1 migrations
        working-directory: apps/api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npx wrangler d1 migrations apply paradigm-api-d1 --remote

      - name: Deploy
        working-directory: apps/api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npx wrangler deploy
```

### Per-initiative workflow inventory

bc-subscriptions has 8 workflows; paradigm-b2b mirrors with project-specific names:

| Workflow file | Trigger path | Action |
|---|---|---|
| `deploy-{prefix}-api.yml` | `apps/api/**` | `wrangler deploy` (with D1 migrations) |
| `deploy-{prefix}-storefront.yml` | `apps/storefront/**` | Build (SvelteKit / similar) → `wrangler deploy` |
| `deploy-{prefix}-admin.yml` | `apps/admin/**` | Vite build → `wrangler pages deploy dist` |
| `deploy-{prefix}-prototype.yml` | `prototype/**` | Build → `wrangler pages deploy dist` |
| `deploy-{prefix}-hive-mcp.yml` | `.hive/apps/mcp-server/**` | `wrangler deploy` (with D1 migrations) |
| `deploy-{prefix}-hive-dashboard.yml` | `.hive/apps/dashboard/**` | `wrangler pages deploy` |
| `hive-auto-merge-tasks.yml` | workflow_run | Auto-merge Hive task PRs |
| `hive-stranded-audit.yml` | cron | Reap orphaned sessions |

### Promotion model

- Push to `main` → auto-deploy to **preview** environment (wrangler `--env=preview` or default)
- Tagged release `v*.*.*` → manual `workflow_dispatch` to promote to **production**
- Optional: branch protection requiring CI green before merge to `main`

---

## Multi-Environment Strategy

Two common shapes:

### Single CF account, multiple environments via wrangler `[env.*]`

```toml
[env.preview]
name = "paradigm-api-preview"
[[env.preview.d1_databases]]
binding = "DB"
database_id = "<preview db id>"

[env.production]
name = "paradigm-api"
[[env.production.d1_databases]]
binding = "DB"
database_id = "<prod db id>"
```

Deploy: `wrangler deploy --env=production`. Same code, different bindings.

**Use when:** Initiative is small, single-team, hackathon-style. bc-subs uses this shape.

### Separate CF accounts per environment

Account A (Dev): all preview workers, D1s, etc.
Account B (Prod): isolated production resources.

Each account has its own `CLOUDFLARE_API_TOKEN`. Wrangler config differs (or use a per-account `wrangler.toml`). GitHub Actions branches on environment.

**Use when:** Production isolation matters (different team access, audit boundaries, blast-radius limits). Most enterprise rollouts go this way eventually.

For Blueprint initiatives:
- **Demo/POC:** single account, `[env.*]` overrides — fastest setup
- **Production:** separate account — defer until promoting to ongoing operation

---

## Cron, Queues, and Cost Management

### Cron triggers

Defined in `wrangler.toml` `[triggers]`. Each cron firing = one Worker invocation. Costs apply to free-tier limits (100k requests/day on free plan).

Don't schedule sub-minute crons unless absolutely required. `*/1 * * * *` is fine for most use cases.

### Queues

Free tier covers <1M messages/month. Producer rate is up to ~5k msg/sec; consumer batch size is configurable (10–100 default).

Pattern: producer in any Worker (publishes outbox events); consumer is the same Worker subscribing via `[[queues.consumers]]`. For paradigm-b2b, `paradigm-events` is produced by `paradigm-api` and consumed by `paradigm-api` (same worker, separate handler).

### Workers AI

Costs vary per model. Track via `agent_traces` D1 table (model, input/output tokens, latency, scenario). Rate-limit per-customer to prevent runaway demo-day spend.

| Model | Approximate cost per call | Rate limit recommendation |
|---|---|---|
| `@cf/meta/llama-3.3-70b-instruct` | ~$0.0001 / 1k tokens | 100 req/hr per customer |
| `@cf/meta/llama-3.2-11b-vision-instruct` | ~$0.0005 / image | 20 req/hr per customer |
| `@cf/baai/bge-m3` (embeddings) | ~$0.00001 / 1k tokens | (use for indexing, not user-facing) |
| `@cf/meta/llama-3.2-3b-instruct` | ~$0.00005 / 1k tokens | 1000 req/hr per store |

(Costs approximate; check current Cloudflare pricing.)

### Cost envelope for a typical demo initiative

Assuming ~10k LLM calls / month, ~50k Vectorize queries / month, modest D1/R2/KV usage:

- Workers: free tier
- Workers AI: ~$5–50 / month
- D1: free tier (<5GB)
- Vectorize: free tier (<30M dimensions)
- R2: free tier (<10GB)
- KV: free tier (<1GB)
- Queues: free tier (<1M msg/month)

**Total:** ~$50/month at demo-rehearsal scale. Document any escape from this in an ADR.

---

## Local Development

### Wrangler dev

```bash
cd apps/api
wrangler dev   # local Worker simulator with bindings
```

Wrangler dev binds to local D1, KV, R2 emulators. Workers AI calls go to real Cloudflare (no local emulator). Vectorize same.

For SvelteKit / Next.js storefronts using `adapter-cloudflare` / `@cloudflare/next-on-pages`:

```bash
cd apps/storefront
pnpm dev       # framework dev server (no CF runtime)
# OR
pnpm build && wrangler pages dev .svelte-kit/cloudflare/   # CF runtime preview
```

### Multi-Worker local dev

If apps depend on each other (storefront calls api), run both in separate terminals:

```bash
# Terminal 1
cd apps/api && wrangler dev --port 8787

# Terminal 2
cd apps/storefront && API_URL=http://localhost:8787 pnpm dev
```

---

## Common Issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `wrangler deploy` fails: "binding not found" | Resource not provisioned in CF | Run `wrangler d1 create` / `kv namespace create` / etc., update `wrangler.toml` with returned ID |
| Worker deploys but returns 500 | Missing secret | `wrangler secret list` to compare; `wrangler secret put NAME` |
| D1 migration fails | Schema drift between local and remote | Apply migrations explicitly: `wrangler d1 migrations apply <db> --remote` |
| Cron not firing | `[triggers]` in wrangler.toml not applied to deployed worker | Re-run `wrangler deploy` after editing |
| GH Action deploys wrong env | `--env` flag missing or branch logic wrong | Check workflow file for `--env=production` flag and trigger branch logic |
| Hive worker can't reach Hive D1 | Cross-account D1 binding not allowed | Both must be in same CF account; or separate Hive instance per account |

---

## Reference Sources

| Source | Path / URL |
|---|---|
| bc-subscriptions wrangler configs | `~/Workspace/dev/wip/bc-subscriptions/{infra/cloudflare,apps/*/}wrangler.toml` |
| bc-subs GitHub Actions | `~/Workspace/dev/wip/bc-subscriptions/.github/workflows/` |
| Cloudflare Workers docs | `developers.cloudflare.com/workers/` |
| Wrangler CLI docs | `developers.cloudflare.com/workers/wrangler/` |
| Workers AI model catalog | `developers.cloudflare.com/workers-ai/models/` |

---

## Relationship to Blueprint Methodology

When `blueprint.yml` has `cloudflare.enabled: true`:

- Stage 6 (Deploy) uses `wrangler deploy` / `wrangler pages deploy` instead of Vercel
- Stage 1 (Research) includes `cloudflare-deployment-pattern.md` (this doc) in `research/current-state/`
- ADR-0004 pattern (Cloudflare infrastructure inventory) becomes mandatory before any code is written

When `cloudflare.enabled: false`, the default Vercel deploy target applies and this doc is informational only.
