---
canonical: true
---

# tool-shell — Cluster shell for project tooling

A minimal Vite + React + react-router-dom skeleton that hosts your project's tooling apps as routes under a single deploy. Used by the `clustered` mode of `blueprint.yml`'s `tool_surface` config.

## What this is

The shell that turns N separate tooling deploys into 1 (per auth cluster). You stamp it twice — once for the operator-internal cluster, once for the stakeholder-shareable cluster — then port your existing apps in as React route components.

See `~/Workspace/dev/tools/big-blueprint/docs/clustered-tool-surface-pattern.md` for the rationale, auth-cleavage discipline, and activation thresholds.

## When to use

Per `blueprint.yml`:

```yaml
tool_surface:
  mode: clustered                    # this template applies
```

If you set `mode: separate`, keep each tool app as its own deploy and skip this template. If you set `mode: unified`, use one copy of this template hosting both clusters.

## Setup

Copy this directory twice for the clustered case:

```bash
cp -r template/apps/tool-shell apps/tool-operator
cp -r template/apps/tool-shell apps/tool-public
```

Then per copy, edit `wrangler.toml` to set the Pages project name (e.g., `<project>-tool-internal` and `<project>-tool-public`), and `src/App.tsx` to mount the apps for that cluster.

## Porting your existing apps

The shell ships route stubs for the four canonical tooling surfaces. Port your existing apps in as the route components — don't iframe them (iframes break shared nav, shared auth, deep linking).

| Stub route | What to mount |
|---|---|
| `/board` | Hive board view (currently `.hive/apps/dashboard/`'s vanilla-JS app — needs React port for the unified shell) |
| `/prototype/*` | Existing prototype `<App />` from `prototype/src/App.tsx` (already React) |
| `/traceability` | Existing `<TraceabilityMatrix />` from `prototype/src/pages/TraceabilityMatrix.tsx` |
| `/demos/*` | Existing demos app from `apps/demos/` (currently vanilla — port or iframe-then-port-later) |

If the existing app is already React (prototype, traceability), the port is mostly route-merging. If it's vanilla (Hive dashboard, demos), the port is heavier — plan it as a separate slice rather than bundling with the shell scaffold.

## Deploy

Same `wrangler-action` pattern as other CF Pages apps in the project:

```yaml
- uses: cloudflare/wrangler-action@v4
  with:
    apiToken: ${{ secrets.CF_API_TOKEN }}
    accountId: ${{ secrets.CF_ACCOUNT_ID }}
    command: pages deploy apps/tool-operator/dist --project-name=<project>-tool-internal --branch=main
```

For the operator cluster, gate the CF Pages project behind CF Access in the Cloudflare dashboard. For the shareable cluster, leave it public (or attach signed-link auth if the content warrants).

## What this template does NOT include

- The actual Hive board / prototype slices / demo storyboard logic (those live in your project's existing apps)
- A design system (the shell uses minimal inline styles; bring your own — the platform design system in BC projects, Tailwind in others, etc.)
- Auth setup (configured at the CF Pages project level, not in the shell code)

## Companion docs

- `~/Workspace/dev/tools/big-blueprint/docs/clustered-tool-surface-pattern.md` — the discipline this template implements
- `~/Workspace/dev/tools/big-blueprint/docs/hive-coordination-pattern.md` — what the Hive dashboard surfaces look like
- `~/Workspace/dev/tools/big-blueprint/template/apps/demos/README.md` — the existing demo storyboard pattern
