# apps/demos — Demo Storyboard

Hosted page that answers "where do I click to demo X" across your project's surfaces (prototype + production app(s) + admin). Same content doubles as how-to docs after release via the mode toggle.

Deploy target: a Cloudflare Pages project (e.g., `<your-project>-demos.pages.dev`).

## Why this exists

When a project supports multiple surfaces (prototype, production app, headless integrators, admin, etc.), demo knowledge becomes tribal: "ask Alex how to demo the gift flow." This page collapses that into one renderable index that stays honest because status badges can cross-check a mechanical capability tracker.

Doubles as **how-to docs at release** via the mode toggle — same content, presenter-paced demo script vs self-serve prose guide.

## Architecture

Static HTML — no build step. Four files:

- `scenarios.json` — the content (single source of truth)
- `index.html` — entry point
- `app.js` — vanilla-JS renderer
- `styles.css` — visual layer

Optional fifth file: `state.json` — capability-tracker output baked in at CI time by `deploy-demos.yml`.

## First-time setup

1. **Customize `scenarios.json`**:
   - Set `project_name` to your product's name.
   - Edit the `surfaces` array. Default scaffold has `prototype + main-app + admin` — replace with your actual surfaces (e.g., `prototype + ios + android + web + admin`).
   - Edit the `categories` array. Default scaffold has 4 generic buckets — rename/add/remove to fit your domain.
   - Replace the example scenarios with real ones.

2. **Customize `index.html`**:
   - Update `<title>` and `<h1>` with your project name.
   - Add cross-links in the `<nav class="header-nav">` block to your other Pages deploys (prototype harness, traceability matrix, etc.).

3. **Wire up the deploy workflow**:
   - Edit `.github/workflows/deploy-demos.yml`:
     - Replace `<PROJECT_NAME>` with your Cloudflare Pages project name.
     - Comment out the state-derive bake step if you don't have a capability tracker yet.
   - Ensure `CF_API_TOKEN` and `CF_ACCOUNT_ID` secrets are set in your GitHub repo settings.
   - Create the Pages project on Cloudflare (one-time): `npx wrangler pages project create <PROJECT_NAME>-demos`.

## Adding a scenario

Open `scenarios.json` and append to the `scenarios` array. Schema:

```json
{
  "id": "kebab-case-id",
  "category": "<id from categories[]>",
  "title": "Human-readable title",
  "summary": "1-2 sentence summary of what this demonstrates.",
  "brd_refs": ["US-N.N"],
  "state_capability_ids": ["capability-id-1", "..."],
  "prerequisites": ["What needs to be true before the demo can run"],
  "expected_outcome": "What success looks like",
  "surfaces": {
    "<surface-id>": {
      "status": "ready | partial | missing | not-applicable",
      "demo_url": "...",
      "demo_script": ["..."],
      "guide": "..."
    }
  }
}
```

### Status values

- `ready` — Feature works end-to-end on this surface. Demo it.
- `partial` — Works with caveats (specific edge cases, UI polish missing). Demo with caveat.
- `missing` — Not yet shipped on this surface. Use the guide field to explain why and what's tracked.
- `not-applicable` — Doesn't apply to this surface (e.g., admin-only features have no storefront).

### Writing copy

Write `demo_script` and `guide` content with the assumption it will become public docs at release. Two rules:

1. **No internal jargon.** "Ask Alex if X breaks" is not how docs work.
2. **No internal references.** "See ticket #NNN" is fine in spec docs; not here.

## state.json integration (optional)

If your project has a mechanical capability tracker (e.g., a script that checks your codebase against capability declarations and emits JSON), wire it up:

1. Output the tracker's JSON at `docs/audits/_state.json` (or your own path; update `deploy-demos.yml` accordingly).
2. Shape: `{ capabilities: [{ capability: { id: string }, status: 'COMPLIANT'|'PARTIAL'|'NON-COMPLIANT'|'MANUAL_REVIEW' }, ...] }`
3. In your scenarios, set `state_capability_ids` to the IDs the tracker emits.
4. The deploy workflow's "Bake state-derive output" step copies the file into the deploy dir at CI time so the runtime overlay resolves.

If you skip this, scenarios still render fine — status badges just reflect the declared values only, without mechanical cross-check.

## Local dev

Serve the directory with any static server:

```bash
cd apps/demos
python3 -m http.server 8000
# open http://localhost:8000
```

If you want the state-derive overlay locally:

```bash
cp ../../docs/audits/_state.json state.json
```

(This is gitignored — CI bakes it fresh on each deploy.)

## Mode toggle

The mode dropdown switches the per-surface body content:

- **Demo script (presenter)** — Numbered click-by-click steps. Optimized for live walkthroughs.
- **Guide (self-serve)** — Prose explanation. Optimized for someone reading without a presenter.

Both modes share the same `prerequisites`, `demo_url`, and `expected_outcome` — only the per-surface body switches.

## Cross-linking with the prototype harness

If your project uses the big-blueprint prototype harness (`template/prototype/`), it includes a `DemoStoryboardPanel` on the Home page that links to this demos page. Update the `href` in `template/prototype/src/pages/Home.tsx` to point at your deployed demos URL (e.g., `https://<your-project>-demos.pages.dev`).

## Origin

This pattern was extracted from `subs-initiative` (May 2026) where it answered "how do we demo across Stencil / Catalyst / custom-headless / BC Admin without each demo turning into a 'go ask Nino' moment." The schema-driven JSON + static renderer + CI-baked status overlay was the durable shape — codified here so future big-blueprint projects inherit it on day one.
