# Blueprint Portal Template (Static HTML)

The canonical blueprint portal shell as of 2026-05-23. Static HTML + Cloudflare Pages Functions. Replaces the React/BigDesign prototype model for non-BC projects.

## When to use this

- New blueprint initiative that isn't BC/BigDesign-bound
- Stakeholder communication tool — interactive prototype + strategy docs + AI chat
- Cloudflare-first infrastructure (Pages + Workers + R2)

## When NOT to use this

- Project already on BigDesign / React 18.3 (use `template/prototype/` — the legacy Vite + React shell)
- Need server-side state beyond what Pages Functions can do (use a real Workers project)
- Need a build pipeline (this is intentionally zero-build)

## What's in here

```
portal/
├── _meta/
│   ├── index.json              ← portal manifest: groups, pages, flows
│   ├── example.json            ← per-page metadata template
│   └── <page-id>.json          ← one per page (see CONVENTIONS.md)
├── pages/
│   └── example.html            ← per-page HTML template
├── functions/
│   └── api/
│       └── chat.js             ← Pages Function: OpenRouter-backed chat
├── docs/
│   └── index.html              ← markdown viewer for blueprint docs
├── _docs/                      ← populated by scripts/prep-deploy.sh
├── scripts/
│   └── prep-deploy.sh          ← copies blueprint docs into _docs/
├── _headers                    ← Pages cache + noindex rules
├── wrangler.toml               ← Pages project config (REPLACE PROJECT_SLUG)
├── index.html                  ← portal entry (auto-renders cards from manifest)
├── shared.css                  ← tokens + layout primitives + components
├── proto-nav.js                ← footer nav + drawers + comparison toggle + flow mode
├── proto-annotate.js           ← annotation overlay (opt-in stakeholder notes)
├── chat-widget.js              ← chat FAB + window (calls functions/api/chat.js)
├── CONVENTIONS.md              ← MUST READ before adding a page
└── README.md                   ← this file
```

## Quick start for a new project

1. Copy `template/portal/` → `your-project/blueprint/portal/` (or `your-project/portal/`).
2. **Set your project name in `_meta/index.json` `name`.** The portal shell (brand bar at the top of every page) reads productName from this field automatically — you do not edit `index.html`, `prototype/index.html`, or `docs/index.html` for branding. Same for the docs viewer sidebar (reads from `_meta/index.json` `docs.tiers`).
3. Replace remaining `PROJECT_SLUG` / `PROJECT_NAME` placeholders in:
   - `wrangler.toml` — Cloudflare Pages project name
   - `pages/example.html` — placeholder copy in the example page (replace whole file when you author your first real page)
   - `<title>` tags in `index.html` and `prototype/index.html` — browser tab titles (the brand bar updates from manifest, but `<title>` is server-rendered before JS runs). Titles do NOT include a trailing " Blueprint" suffix — that's by design so consumers whose names already end in "Blueprint" (e.g., the dogfooding `blueprint-redesign` initiative) don't get "Blueprint Redesign Blueprint" in the tab. The brand bar's runtime `_portal-shell.js` `deriveProductName` strips " Blueprint" from `_meta/index.json` `name` for display, so the full "X Blueprint" identity still surfaces in manifests and metadata.
4. **Override design tokens in `project-tokens.css`** (NOT in `shared.css`). The canonical chrome at `shared.css` is template-owned and re-stamped from the methodology repo. Project token overrides live in the overlay file; the cascade picks them up.
5. **Populate `_meta/index.json` `docs.tiers`** with the docs your portal should expose. Each tier (Strategic / Working / Audits / whatever you name) is a sidebar group; each entry is `{ id, title }` where `id` is the markdown filename (without `.md`) in `_docs/`. The viewer is data-driven — no JS edits needed. See CONVENTIONS.md § "Docs viewer manifest."
6. Write your first page:
   - `_meta/<page-id>.json` (copy `example.json`, fill in)
   - `pages/<page-id>.html` (copy `example.html`, fill in)
   - Add `<page-id>` to `_meta/index.json` `pages` array
7. Customize `scripts/prep-deploy.sh` if your blueprint docs live elsewhere.
8. Deploy:
   ```bash
   ./scripts/prep-deploy.sh
   wrangler pages project create <PROJECT_SLUG>-blueprint --production-branch main --compatibility-flags nodejs_compat
   echo "$OPENROUTER_KEY" | wrangler pages secret put OPENROUTER_API_KEY --project-name <PROJECT_SLUG>-blueprint
   wrangler pages deploy . --project-name <PROJECT_SLUG>-blueprint --branch main --commit-dirty=true
   ```

### Stay current with methodology updates

When the Blueprint methodology bumps the canonical chrome (`shared.css`, `_portal-shell.js`, `proto-nav.js`, `proto-annotate.js`, `_headers`, `_redirects`, `docs/index.html`), re-stamp from your project root:

```bash
node ~/Workspace/dev/wip/blueprint/template/tools/blueprint-init/stamp.mjs \
  --mode=restamp-chrome --pattern=B \
  --target=$(pwd)
```

This overwrites the canonical chrome files from the methodology template but leaves `project-tokens.css`, `_meta/*`, `pages/*`, your `index.html` `<title>`, and everything else project-owned untouched. The `portal-chrome-canonical-reviewer` gate enforces this — if your chrome files drift from canonical, the gate blocks portal-touching commits with a `FIX_COMMAND` pointing here.

## Production reference

The Rally HQ blueprint at `apps/rally-hq/blueprint/portal/` is the worked example this template was extracted from. See `https://blueprint.rallyhq.app/` for the live deployment.

## See also

- `template/portal/CONVENTIONS.md` — the contract for every page
- `wip/blueprint/METHODOLOGY.md` — the 7-stage pipeline this fits into
- Rally HQ blueprint commit history under `apps/rally-hq/` for end-to-end examples
