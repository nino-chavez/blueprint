# Prototype Slice Conventions

**Mandatory rules for every slice in this prototype studio. Slices that don't follow these will be rejected during review.**

## The Core Rule

**The product UI must be visually indistinguishable from production. Anything that exists only because this is a prototype lives in the harness chrome, never in the page body.**

Reviewers should be able to look at any page and answer "yes, this is what we'd ship" without mentally subtracting prototype scaffolding. Mixing harness controls with product UI defeats the purpose of building the prototype.

---

## Required Architecture for Every Page

Every page in every slice **must**:

1. Import and use `SliceShell` from `@/components/SliceShell` as the outermost component
2. Import its slice's `prototype.config.json` as `sliceConfig` and pass it through
3. Pass `currentPageName` matching one of the page names in `sliceConfig.pages[].name`
4. Place all interactive harness controls (scenario switchers, reset buttons, simulate-error toggles) inside the `tools` prop
5. Place all explanatory prototype context ("in production this renders inside…", spec coverage notes) inside the `notes` prop
6. Render only clean production UI inside `children` — no `<Panel header="Prototype controls">`, no inline "Spec: Epic X" footers, no inline "this would render inside…" `Message` components

### The shape

```tsx
import { SliceShell, SliceConfig } from '@/components/SliceShell';
import sliceConfig from '../prototype.config.json';

export const SomePage: FunctionComponent = () => {
  const [scenario, setScenario] = useState<Scenario>('default');

  const tools = (
    <FormGroup>
      <Select label="Scenario" value={scenario} onOptionChange={setScenario} options={[...]} />
    </FormGroup>
  );

  const notes = (
    <Text marginBottom="none">
      What this surface is, where it renders in production, which user stories it maps to.
    </Text>
  );

  return (
    <SliceShell
      config={sliceConfig as SliceConfig}
      sliceName="some-slice-name"
      currentPageName="Some Page"
      tools={tools}
      notes={notes}
    >
      <Page header={<Header title="Real product title" description="..." />}>
        {/* clean product UI only */}
      </Page>
    </SliceShell>
  );
};
```

---

## What SliceShell Provides Automatically

You don't render any of these — they come from the chrome:

- **Top bar** — back-to-Studio link, slice name, spec ref, phase badge, prototype-tools toggle
- **Left sidebar** — numbered list of all pages in the slice (current highlighted), suggested flows
- **Bottom prev/next bar** — labeled with previous and next page names
- **Right drawer** — slides in when "Prototype tools" is clicked, holds `notes` + `tools` + auto-generated spec coverage section. Yellow-tinted to be visually distinct from product UI.

Reviewers always know:
- What slice they're in (top bar)
- What page within that slice (sidebar number + bold)
- What's next (bottom bar)
- What's a real product behavior vs. a harness affordance (drawer is yellow + collapsible; product UI never has prototype-only UI)

---

## What `tools` and `notes` Are For

| Bucket | Purpose | Examples |
|---|---|---|
| `notes` | Explain the surface — what is it, where does it render in production, which spec stories does it cover, what should reviewers look for. Read-only. | "App Extension PANEL surface from US-4.1. In production this renders inside the host's product edit page (right-rail panel context)." |
| `tools` | Interactive harness affordances that don't exist in production — scenario pickers, reset buttons, simulate-error triggers, state jump-to controls. | A `<Select>` that switches between three regional scenarios; a `<Button>` that resets a multi-step process; a button that simulates a third-party connection revoke. |

If you find yourself wanting to put either kind of content **outside** the drawer, stop and put it inside instead.

---

## What Should Never Appear in Page Children

These are anti-patterns. If you see any of them in a slice page, that slice has not been brought up to convention:

```tsx
// ❌ Inline "Prototype controls" panel
<Panel header="Prototype controls">
  <Select label="Scenario" ... />
  <Button>Reset</Button>
</Panel>

// ❌ Inline spec footer
<Box>
  <Small>Spec: Epic 1 (US-1.1 OAuth handshake)</Small>
</Box>

// ❌ Inline "in production this renders..." Message
<Message
  type="info"
  messages={[{ text: 'In production this panel renders inside…' }]}
/>

// ❌ "Skip to next page" button in product UI
<Button variant="subtle" onClick={() => navigate('/prototypes/.../welcome')}>
  Skip to welcome
</Button>
```

All four belong in the drawer (`tools` or `notes`).

---

## Distinguishing Real Product Navigation from Harness Navigation

Some buttons advance the user through the **product flow** (real CTAs the merchant or end user would click). These belong in the page body.

Other buttons let the **reviewer** jump around the prototype for inspection (skip, jump-to-step, simulate-error). These belong in the drawer.

| Belongs in product UI | Belongs in `tools` drawer |
|---|---|
| "Continue to processor setup" — real onboarding CTA | "Skip to welcome" — reviewer shortcut |
| "Edit plan" — real merchant action | "Jump to Review step" — reviewer shortcut |
| "Re-test all" — real ops action surfaced when health degraded | "Reset to initial state (1 degraded)" — reviewer setup |
| "Run test charge" — real validation step | "Simulate third-party revoke" — reviewer setup |

When in doubt: would a real user ever click this button? If no, it goes in the drawer.

---

## Slice Config Requirements

Every slice's `prototype.config.json` must include:

```json
{
  "name": "Human-readable slice name",
  "description": "1-2 sentences on what the slice covers",
  "brdRef": "Epic N — Short epic name",
  "phase": "MVP" | "P2" | "P3",
  "pages": [
    { "name": "Page Name", "route": "/", "story": "US-N.1, US-N.2" }
  ],
  "flows": [
    { "name": "Flow name", "steps": ["Page Name", "Other Page"] }
  ]
}
```

The `pages[].name` strings are the source of truth — they appear in the sidebar, the prev/next bar, and must match the `currentPageName` prop on each page exactly.

---

## Routes File Pattern

`routes.tsx` mounts each page under the slice path. Standard shape:

```tsx
import { FunctionComponent } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageOne } from './pages/PageOne';
import { PageTwo } from './pages/PageTwo';

const SomeSliceRoutes: FunctionComponent = () => {
  return (
    <Routes>
      <Route path="some-slice-name">
        <Route index element={<PageOne />} />
        <Route path="page-two" element={<PageTwo />} />
      </Route>
    </Routes>
  );
};

export default SomeSliceRoutes;
```

---

## File Layout

```
prototypes/<slice-name>/
├── prototype.config.json    # slice metadata (used by SliceShell)
├── annotations.json         # empty array — for AnnotationOverlay
├── routes.tsx               # default-exports a FunctionComponent
├── data/
│   └── mock.ts              # all typed mock data for this slice
└── pages/
    ├── PageOne.tsx          # uses SliceShell, currentPageName="Page One"
    └── PageTwo.tsx          # uses SliceShell, currentPageName="Page Two"
```

---

## Path Aliases

`@/` resolves to `prototype/src/`. Use `@/components/SliceShell` from anywhere in `prototypes/`.

Configured in both `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`).

---

## When Adding a New Slice

1. Read this file. Re-read it.
2. Copy `prototypes/_template/` to `prototypes/<your-slice-name>/`.
3. Update `prototype.config.json` with real fields (`name`, `description`, `brdRef`, `phase`, `pages`, `flows`).
4. Update `routes.tsx` so the outer `<Route path="...">` matches your slice directory name (not `_template`), and rename / add page imports.
5. Update each page's `sliceName` prop and `currentPageName` to match the config.
6. Replace mock data and product UI with the real surface.
7. Run `npm run typecheck` — must be clean before considering the slice done.
8. Browser-verify each page — confirm sidebar nav highlights correctly, drawer opens, harness controls work.
9. Confirm: looking at the page with the drawer closed, does the body look like real product UI, no prototype scaffolding visible? If no, fix it before declaring done.

The Studio Home page rediscovers slices on reload — no edits to `Home.tsx` needed when adding a slice. Slices whose directory name starts with `_` (like `_template`) are filtered out of the Home page.
