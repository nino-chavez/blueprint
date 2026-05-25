# @blueprint/portal

The unified family portal — front door across strategy, demos, build, operate, methodology, roadmap.

## Stack

- **Astro 5** — content-first, native markdown collections, fast SSR
- **React 19** islands for interactive parts (audience switcher, future live-iframe wrappers)
- **Tailwind 3** via PostCSS, consuming `@blueprint/design-tokens/tailwind` preset
- **`@blueprint/ui`** — family component kit (Shell, NavBar, LaneCard, AudienceSwitcher, StatusBadge, plus generic Button/Badge/Alert/Card/Tabs/Modal and roadmap viz Swimlane/TaskBar/DependencyArrow)

## Develop

```bash
npm install
npm run dev --workspace=@blueprint/portal
```

Opens on `http://localhost:4321` by default.

## Build

```bash
npm run build --workspace=@blueprint/portal
```

Outputs static-first build to `dist/`. Deployable to Cloudflare Pages, Netlify, Vercel, or any static host.

## IA — five verbs + Roadmap

| Route | Verb | What it answers |
|-------|------|-----------------|
| `/` | (overview) | What is this, who is it for, pick how to enter |
| `/discover` | Discover | North star, value prop, the bet (PRD/BRD/STRATEGY excerpts) |
| `/try` | Try | Live storefront + admin demos, guided scenarios |
| `/build` | Build | API, ADRs, SDKs, component library, integration patterns |
| `/operate` | Operate | Merchant + subscriber guides, dunning, support runbooks |
| `/inspect` | Inspect | Methodology, Hive substrate, decision lineage, derived state |
| `/roadmap` | Roadmap | Ready queue, epic progress, swimlane visualization |

The audience switcher (top-right) reorders lanes by audience priority — executive / discovery / internal — and persists to localStorage.

## What's in each slice

Slice 1 (this commit) — IA + shell + nav + lane-card landing pages. Content is placeholder.

Slices 2 + 3 wire live data and authored content excerpts. Slice 5 lights up live iframes for Try. Slice 7 locks brand identity.

See `redesign-branch-unified-family` memory or the running task list for the full plan.
