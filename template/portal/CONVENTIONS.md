# Blueprint Portal Conventions

**Mandatory rules for every prototype page in this portal shell. Future pages that don't follow these will get pulled out of the deploy until they do.**

This is the canonical convention set for big-blueprint **portal-mode** projects (static HTML + Cloudflare Pages Functions). For React/BigDesign projects, use `template/prototype/` instead.

---

## The Core Rule

**The product UI must be visually indistinguishable from what would actually ship. Anything that exists only because this is a prototype lives in the harness chrome, never in the page body.**

Reviewers should be able to look at any page and answer "yes, this is what we'd ship" without mentally subtracting prototype scaffolding. Mixing harness controls with product UI defeats the purpose of building the prototype.

The harness chrome is: the footer nav (`proto-nav.js`), strategy panel (right drawer), current-state panel (left drawer), proposed/split/shipped toggle, flow breadcrumb (when `?flow=...`), AI chat FAB, annotation FAB + markers. All fixed-position overlays. None live inside `.proposed-view` or `.shipped-view`.

---

## File layout (each new page)

```
portal/
├── _meta/
│   └── <page-id>.json        ← metadata (REQUIRED)
└── pages/
    └── <page-id>.html        ← page HTML
```

`<page-id>` is kebab-case, no `.html` suffix. Used in URLs, JS lookups, and the `_meta/index.json` `pages` array.

---

## Required: per-page metadata at `_meta/<page-id>.json`

```json
{
  "id": "<page-id>",
  "title": "Human-Readable Title",
  "group": "<one-of-your-manifest-groups>",
  "surface": "<production-surface-this-maps-to>",
  "phase": "MVP|Phase 1|Phase 2|Phase 3",
  "route": "/pages/<page-id>.html",
  "summary": "One-sentence description used on the portal index card.",
  "strategy": {
    "decision": "What design choice does this page make? (1 sentence)",
    "why": "Which finding from research/synthesis.md does it implement? Cite by # or rule. Inline markdown allowed.",
    "shipped": "How does the shipped product render this surface today? Cite source files. (1-2 sentences)",
    "gap": "Proposed vs shipped in one row.",
    "question": "What needs primary-research validation? (1 question)"
  },
  "currentState": {
    "route": "/path/in/shipped/app",
    "summary": "What exists today in the shipped product.",
    "sourceFiles": ["src/routes/.../+page.svelte"],
    "annotation": "How does the proposed differ from what's there now?"
  }
}
```

`proto-nav.js` reads this and renders the panels + footer nav entry. Pages declare only `window.PROTO_PAGE = { id: '<page-id>' };` — all other data lives in the JSON.

---

## Required: page HTML structure

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>{Page Title} — Blueprint</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../shared.css">
</head>
<body data-compare-root data-view="proposed">
  <section class="proposed-view">
    <!-- What we'd ship. Production-indistinguishable. -->
  </section>
  <section class="shipped-view">
    <!-- Mock or screenshot of what exists today. -->
  </section>
  <script>
    window.PROTO_PAGE = { id: '<page-id>' };
  </script>
  <script src="../proto-nav.js"></script>
  <script src="../chat-widget.js" defer></script>
  <script src="../proto-annotate.js" defer></script>
</body>
</html>
```

---

## Tokens & typography

Tokens live in `shared.css`. Never hardcode hex colors or px values in a page's `<style>` block. Customize tokens at the top of `shared.css` for your project's brand.

Default font stack: Inter (body + display) + JetBrains Mono (data). For projects that need a hero display font (sport, editorial, etc.), add `--font-hero` and reserve it for h1 / hero moments — never for body or small headings.

---

## Comparison toggle

Pages with a meaningful "different from shipped" story include both `.proposed-view` and `.shipped-view` sections inside `<body data-compare-root data-view="proposed">`. `proto-nav.js` auto-injects the toggle. Pages with no shipped equivalent can omit `.shipped-view`.

---

## Flow definitions

Multi-page journeys live in `_meta/index.json` under `flows`:

```json
{
  "id": "main-journey",
  "label": "Main journey",
  "summary": "How a primary persona moves through the product.",
  "pages": ["page-a", "page-b", "page-c"]
}
```

Append `?flow=<flow-id>` to any prototype URL and `proto-nav.js` renders a top-of-page breadcrumb with prev/next page links.

---

## Anti-patterns (reject any PR that does these)

| Anti-pattern | Why it fails |
|---|---|
| Inline `font-family: var(--font-hero)` on body text | Display fonts are unreadable at small sizes. Never. |
| Hardcoded hex colors | Tokens in `shared.css` exist for a reason. |
| "This is a mock" framing inside `.proposed-view` | Product UI must look like production. Put framing in the strategy panel. |
| Page-level `@media (prefers-color-scheme: dark)` blocks | Theme handling belongs in tokens. |
| Full PROTO_PAGE data inline | Whole point of `_meta/*.json` is centralization. |
| Hard-coded path arrays in nav code | `proto-nav.js` derives nav from `_meta/index.json`. Don't reinvent. |
| Heavy JS deps (React, Vue) | Portal is plain HTML / CSS / vanilla JS. Adding a framework requires explicit conversation. |
| Real customer data anywhere | Synthetic personas only. No real PII even in placeholders. |
| Direct edits to `_docs/` | `_docs/` is auto-copied by `scripts/prep-deploy.sh`. Edit canonical source. |

---

## Stage 7 (Iterate) — annotation overlay

Stakeholders enable per-browser annotation mode via:

```js
localStorage.setItem('rally-anno-enabled', 'true')
location.reload()
```

A 💬 FAB appears bottom-left. Toggle "Annotating" then click any element on the page to drop a note. Notes persist in localStorage keyed by page id. Console helpers: `window.rallyAnno.export()`, `window.rallyAnno.clear()`.

Notes are per-browser. Cross-stakeholder sync is a Phase-2 task — would add a Pages Function backed by Cloudflare KV.

---

## Deploy

```bash
# From blueprint/ root:
./portal/scripts/prep-deploy.sh
cd portal
wrangler pages deploy . --project-name <PROJECT_SLUG>-blueprint --branch main --commit-dirty=true
```

The `wrangler.toml` at `portal/` root is required so wrangler detects `functions/` and compiles them as Pages Functions.

### Required env vars on the Pages project

- `OPENROUTER_API_KEY` — set via `wrangler pages secret put`. Powers the chat function. Use the `blueprint-global` 1Password item (Developer Secrets vault) or rotate per-project.

### Optional: custom subdomain

```bash
# Attach <PROJECT_SLUG>-blueprint.<your-domain> as custom domain in Cloudflare dashboard
# Or via the Pages API + DNS API (see rally-hq blueprint deploy doc for a worked example)
```

---

## Versioning

v1 (2026-05-23). Material changes (renaming tokens, changing required metadata fields, breaking the page HTML contract) bump the major version and require updating all existing pages in the same PR.
