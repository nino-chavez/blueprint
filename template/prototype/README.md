# Prototype Studio

React + Vite + BigDesign harness for BigBlueprint prototype slices. Each slice is a self-contained directory under `prototypes/` with its own routes, pages, mock data, and config. The Studio Home page auto-discovers slices.

Companion to: `../docs/` (research + strategy docs), `DESIGN.md` (extracted design tokens + principles), `CONVENTIONS.md` (mandatory slice rules).

## Stack

| Layer | Version |
|---|---|
| React | 18.3 (pinned — BigDesign requirement) |
| styled-components | 5.3 (pinned — BigDesign requirement) |
| @bigcommerce/big-design | 2.4 |
| @bigcommerce/big-design-patterns | 3.0 |
| bigcommerce-design-patterns | 0.15 |
| Vite | 5.4 |
| TypeScript | 5.5 |
| React Router | 6.15 |

## Quick Start

```bash
npm install
npm run dev
# Opens http://localhost:5174
```

## How It Works

- **Home page** (`/`) auto-discovers every slice under `prototypes/<name>/` that has a `routes.tsx` and `prototype.config.json`. Slice names starting with `_` (like `_template`) are filtered out.
- **Prototype routes** (`/prototypes/<name>/...`) are dynamically loaded via `React.lazy`.
- **Annotation overlay** is opt-in (set `localStorage.bds-annotations-enabled = 'true'` in devtools).
- **Clean mode** strips the harness for screenshots: append `?clean=1` to any prototype URL.

## Adding a Slice

**Read [CONVENTIONS.md](CONVENTIONS.md) before generating any slice.** It defines the mandatory `SliceShell` chrome pattern that separates real product UI from prototype harness controls. Slices that don't follow it will be rejected.

The mechanical recipe:

```bash
cp -r prototypes/_template prototypes/your-slice-name
```

Then:

1. Edit `prototype.config.json` — set `name`, `description`, `brdRef`, `phase`, `pages`, `flows`.
2. Edit `routes.tsx` — change the outer `<Route path="_template">` to `<Route path="your-slice-name">` and rename / add page imports.
3. Edit each page in `pages/` — update `sliceName` prop and `currentPageName` to match the config; replace placeholder UI with the real product surface.
4. Edit `data/mock.ts` — replace example types and data with what your slice needs.
5. `npm run typecheck` — must be clean.
6. Browser-verify each page — sidebar highlights, drawer opens, prev/next works, body has no prototype scaffolding.

Or run the `/blueprint-prototype` skill, which automates the same recipe and reads from your project's research output.

## File Layout

```
prototype/
├── package.json, vite.config.ts, tsconfig.json, vitest.config.ts, vercel.json
├── index.html
├── CONVENTIONS.md           # required reading
├── DESIGN.md                # extracted design tokens + principles
├── src/
│   ├── main.tsx, App.tsx
│   ├── components/
│   │   ├── SliceShell.tsx   # the chrome (top bar / sidebar / prev-next / drawer)
│   │   ├── PrototypeShell.tsx
│   │   ├── AnnotationOverlay.tsx
│   │   └── SliceLayout.ts   # SidebarGrid + Card primitives
│   ├── pages/
│   │   └── Home.tsx         # auto-discovers slices
│   └── generated/
│       └── traceability.json  # spec-anchor registry (empty in template)
└── prototypes/
    └── _template/           # skeleton slice — copy this when adding new slices
        ├── prototype.config.json
        ├── annotations.json
        ├── routes.tsx
        ├── data/mock.ts
        └── pages/{PageOne,PageTwo}.tsx
```

## Traceability (optional)

The harness has built-in support for spec ↔ prototype traceability via `src/generated/traceability.json`. Each slice page can declare `traces: ["US-1.2", "ARCH:3"]` and the SliceShell renders chips that link back to the source doc. The template ships an empty registry. Populate it from your project's spec docs (BRD, PRD, ARCHITECTURE) when you wire traceability up — typically with a script under `scripts/traceability/` that walks the docs and writes the registry.
