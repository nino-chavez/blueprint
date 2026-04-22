# BigCommerce Marketplace App Context

**Purpose:** Captures everything known about how a BC marketplace app renders within the merchant control panel and dev portal — so future BigBlueprint initiatives targeting BC apps don't have to re-discover this through screenshots and trial.

**Last updated:** 2026-04-21

**Discovery source:** Live BC control panel + dev portal screenshots, plus working reference apps on disk (`aisles-admin`, `ask-bc`).

---

## 1. Reference Apps on Disk

The canonical pattern sources for BC marketplace apps in this workspace. Read the source first, prototype second.

| Project | Path | Use For |
|---|---|---|
| `aisles-admin` | `~/Workspace/dev/wip/aisles-admin/src/app/stores/[storeHash]/` | Production-ready BigDesign + Next.js patterns: tabs, KPI tiles, forms, tables, empty states. Closest analog to a typical merchant-admin surface. |
| `ask-bc` | `~/Workspace/dev/wip/ask-bc/src/` | OAuth install flow, App Extension registration, agent runtime patterns, Cloudflare Worker integration. |

Both follow the same stack (Next.js 16/15 + BigDesign 2.x + Neon + Upstash). Initiative prototypes targeting BC marketplace apps should use an identical stack so components transfer directly to production.

---

## 2. Where the App Lives in the Merchant UI

After install, a marketplace app appears in the merchant control panel's left nav under **Apps**, alongside other installed apps.

```
Apps  ▼
├── App marketplace          ← /manage/marketplace/apps/homepage
├── My apps                  ← /manage/marketplace/apps/my-apps
├── Develop                  ← partner dev section
├── [Pinned shortcuts]       ← One-Click Catalyst, Smile.io, etc.
├── ──────                   ← installed apps follow
├── Local DMS
├── Ask BC
├── Aisles Admin
└── [Your app]
```

Clicking the app name loads it in an iframe at `/manage/app/{appId}`.

---

## 3. URL Patterns

| Surface | URL Pattern | Owner |
|---|---|---|
| BC marketplace home | `store-{hash}.mybigcommerce.com/manage/marketplace/apps/homepage` | BC |
| My Apps list | `store-{hash}.mybigcommerce.com/manage/marketplace/apps/my-apps` | BC |
| App listing detail (pre-install) | `store-{hash}.mybigcommerce.com/manage/marketplace/apps/{appId}` | BC, content from dev-portal Listing Information tab |
| OAuth consent screen | `store-{hash}.mybigcommerce.com/manage/app/{appId}` (pre-install state) | BC |
| Installed app iframe | `store-{hash}.mybigcommerce.com/manage/app/{appId}` (post-install) | You, inside iframe |
| Dev portal home | `build.bigcommerce.com/?utm_source=dev_center` | BC |
| Dev portal app config | `build.bigcommerce.com/apps/{appId}` | BC |

---

## 4. Iframe Canvas Behavior (Critical for Prototyping)

When a merchant clicks an installed app from the left nav, BC loads the app inside an iframe at `/manage/app/{appId}`. The chrome behavior:

**BC keeps rendered around the iframe:**
- Left dark navigation rail (full height)
- Top dark header bar (search, notifications, account, View storefronts button)
- Default store selector

**Inside the iframe — the app owns 100% of the canvas:**
- No BC-injected breadcrumb
- No back button
- No framing chrome
- The app's `<Page header={<Header title="..." description="..." />}>` IS the top of visible content
- Content area starts immediately below BC's top header bar
- Width: fills the area to the right of left nav, edge to edge

**Implication for BigBlueprint prototypes:** Slices that render `<Page>` chrome are visually identical to what they'd look like in production. No "BC chrome wrapper" required for design fidelity. If stakeholder demos need to feel "in context," an optional `BCChromeWrapper` mock can be added — polish, not necessity.

---

## 5. Install Flow Surfaces (BC-Owned — You Do Not Design These)

The merchant install flow has three BC-rendered surfaces before the app gets control:

### 5.1 App Listing Page
URL: `/manage/marketplace/apps/{appId}`

Layout:
- Top: `← Apps` breadcrumb
- Left content area: app icon + name + (configurable) marketing copy, screenshots, description, reviews
- Right rail: "App Installation" card with Price + big blue "Install" button + scope checklist

For dev-built apps the left content is sparse (just icon + name). Marketing-rich listings (Klaviyo etc.) populate the left area via the Listing Information tab in the dev portal.

### 5.2 OAuth Consent Screen
URL: `/manage/app/{appId}` (pre-install state)

Layout:
- Top: `← Back` link
- Heading: "{App Name} is requesting to update its access to your BigCommerce store."
- Body: "By installing this app, {App Name} will be able to:" with green checkmark scope list
- Below: "{App Name} will not be able to:" with red X negative list (e.g., "Access your password")
- Right rail: blue "Confirm" button + BigCommerce terms of service link

This is **rendered entirely by BigCommerce.** Apps have zero design control. The scope list shown is sourced from the app's Scopes tab in the dev portal.

### 5.3 Post-Install First Load
URL: `/manage/app/{appId}` (post-install state, served as iframe content)

After Confirm, BC POSTs OAuth credentials to the app's `/api/auth` callback, then redirects the merchant to `/api/load` with a `signed_payload_jwt`. The app verifies the JWT, mints a session, and renders its first-run welcome surface. **This is the first surface the app owns.**

**Implication for BigBlueprint prototype slices:** "Install" or "onboarding" slices should model surfaces 5.3 onward — the post-install welcome / setup wizard. Surfaces 5.1 and 5.2 are BC-owned reference material, not designable. Document them in the strategy panel rather than prototyping them.

---

## 6. Ownership Boundary — App vs. BC

| Surface | Owner | Influence |
|---|---|---|
| Merchant left nav placement | BC | Auto on install — no influence |
| Top header bar | BC | None |
| Marketplace home grid | BC | None |
| Marketplace category/filter pages | BC | Submit category metadata in Listing Information |
| App listing visual chrome | BC | None |
| App listing left-content (description, screenshots, marketing) | App, via dev portal | Listing Information tab |
| OAuth consent scope list | App, via dev portal | Scopes tab |
| OAuth consent visual layout | BC | None |
| Inside-iframe canvas (post-install) | **App** | 100% — this is the prototype design surface |
| App Extension PANEL slot location | BC | App registers via GraphQL `createAppExtension`; BC decides where panels appear on Product/Order/Customer edit pages |
| App Extension PANEL content | **App** | App renders React inside the panel iframe |
| Uninstall confirmation dialog | BC | None |
| OAuth callback URLs | App, via dev portal | App Information tab — Auth, Load, Uninstall callbacks |

---

## 7. Dev Portal Structure

URL: `build.bigcommerce.com/apps/{appId}`

Three tabs per app:

### 7.1 App Information
Configures the OAuth handshake.
- **Client credentials:** Client ID, Client Secret, Account UUID
- **Callback URLs:**
  - Auth → `/api/auth` — receives OAuth code on install
  - Load → `/api/load` — receives signed_payload_jwt on every load
  - Uninstall → `/api/uninstall` — receives uninstall webhook
- **App users:** which BC users can load this app

### 7.2 Scopes
Configures what shows on the OAuth consent screen (§5.2). Examples observed in Ask BC's scope list: View and modify products / orders / customers / themes / inventory / app extensions / B2B Edition / carts / channels / fulfillment methods / store locations / system logs / order fulfillments / sites and routes / store translations / site content / customer information / store information / marketing information / orders / order transactions, plus Customer Login.

### 7.3 Listing Information
Drives the marketplace listing page (§5.1). App icon, name, description, screenshots, categories, pricing.

---

## 8. BigDesign Patterns Observed (from Aisles Reference)

When prototyping merchant-admin slices, default to these patterns. They produce visual fidelity matching real BC apps without thinking.

### Page chrome
```tsx
<Page header={<Header title="Aisles" description="AI-powered storefront personalization" />}>
  {/* tabs immediately under header */}
  <Tabs items={[...]} activeTab={tab} onTabClick={setTab} />
  {/* content sections */}
</Page>
```

### KPI tile row (analytics dashboards)
6 tiles in a horizontal `<Flex>`, each a `<Panel>` with:
- Small label ("Generations", "Today's Cost")
- Large number ("23", "$0.0064")
- Optional sub-label ("9 sessions", "1 generations")

### Table with export
- Section heading on left
- "Export CSV" button (`<Button variant="secondary">`) on right
- Standard `<Table>` with sortable columns

### Form layout
- 3-column `<Flex>` with `<Input>` / `<Select>` fields
- Right-aligned action button at the same row baseline
- Empty / disabled states: button greyed when no input

### Empty state
- Centered `<Text>` inside a `<Panel>` body
- e.g., "No rules yet. Create your first merchandising rule to control AI behavior."

### Action button placement
- Primary CTA (blue, solid): top-right of section
- Secondary CTA: subtle/outlined variant
- Destructive: standard with explicit confirm modal

### Tabs
Standard BigDesign `<Tabs>` placed directly below the page header. Tabs render as text labels with underline active state — minimal chrome.

---

## 9. Standard BC Marketplace App Stack

| Layer | Version | Notes |
|---|---|---|
| React | 18.3 | **Pinned — BigDesign requirement; do not upgrade** |
| styled-components | 5.3 | **Pinned — BigDesign requirement; do not upgrade** |
| @bigcommerce/big-design | 2.4 | Core component library |
| @bigcommerce/big-design-patterns | 3.0 | Page, Header, ActionBar |
| bigcommerce-design-patterns | 0.15 | 22 extended patterns (CardGrid, AnchorNav, DashboardLayout, etc.) |
| @bigcommerce/big-design-icons | 1.4 | Icon set |
| @bigcommerce/big-design-theme | 1.1 | Theme tokens — `theme.colors.*`, `theme.spacing.*` |

Component selection priority:
1. `bigcommerce-design-patterns` (extended patterns) — check first
2. `@bigcommerce/big-design-patterns` (Page, Header, ActionBar)
3. `@bigcommerce/big-design` (50+ primitives)
4. Custom — last resort, never raw HTML tags

---

## 10. Hard Constraints (from BigDesign)

1. **React 18 only** — do not upgrade to 19
2. **styled-components 5 only** — do not upgrade to 6
3. **Theme tokens only** — never raw hex (`#3366FF`) or pixel values; always `theme.colors.primary` / `theme.spacing.medium`
4. **No raw HTML tags** in slice code — use `<Text>`, `<Box>`, `<Flex>`, `<Grid>`, `<H1>`–`<H4>` instead of `<div>`, `<span>`, `<p>`
5. **Partitioned cookies required** for the iframe context (Chrome 3rd-party cookie restrictions): `httpOnly`, `Secure`, `SameSite=none`, `Partitioned`

---

## 11. Reference: Real Reference App Source Locations

When generating a slice, read the analogous Aisles or Ask BC source first:

```
~/Workspace/dev/wip/aisles-admin/
├── src/app/stores/[storeHash]/
│   ├── layout.tsx          # iframe layout chrome
│   ├── page.tsx            # main app page (Merchandising Rules / Analytics / Layout Preview)
│   └── api/                # API routes
├── src/app/api/auth/route.ts        # OAuth callback handler
├── src/app/api/load/route.ts        # signed_payload_jwt verification
├── src/middleware.ts                # iframe-context cookie/auth handling
└── src/lib/                         # shared utilities

~/Workspace/dev/wip/ask-bc/
├── src/app/api/auth/route.ts        # OAuth handshake
├── src/app/api/load/route.ts        # JWT verification + redirect
├── src/app/api/uninstall/route.ts   # uninstall cleanup
├── src/lib/bigcommerce/             # BC API client + App Extension registration
└── workers/agent-runtime/           # Cloudflare Worker pattern
```

---

## 12. Still Missing (Lower Priority)

One reference screenshot has not been captured:

**App Extension PANEL in context** — what a third-party app's panel looks like rendered on a BC Product / Order / Customer edit page. Needed for any slice modeling a panel surface (e.g., a "Subscriptions" panel on a Product or Customer page).

**Approximation until captured:** BC's PANEL extension context renders as a right-rail panel under the main edit form. Klaviyo and Smile.io both register them on customer pages — easy to capture next time you're in BC admin.

---

## 13. What Future BigBlueprint Initiatives Don't Need to Re-Discover

- ✅ Where the app lives in BC nav
- ✅ URL patterns for merchant + dev portal surfaces
- ✅ What chrome BC keeps vs. what the app owns inside the iframe
- ✅ The full install flow (listing → consent → first-load)
- ✅ Which surfaces are BC-owned (not designable) vs. the app's
- ✅ Dev portal tab structure (App Info / Scopes / Listing Information)
- ✅ Source of the consent-screen scope list (dev portal Scopes tab)
- ✅ BigDesign component patterns matching real BC apps
- ✅ Hard constraints on React/styled-components/theme tokens
- ✅ Reference source code locations on disk

If a future session adds new findings (e.g., the App Extension PANEL screenshot), update §12 and the relevant section above.

---

## Relationship to BigBlueprint Methodology

This doc fits Stage 1 (Research → existing-product analysis) of the BigBlueprint pipeline (`METHODOLOGY.md` §3.1). When an initiative targets a BC marketplace app, this doc is the existing-product baseline — initiatives can reference it as the "current state" of BC's app-host environment without re-running the discovery.

For new BC-targeted initiatives, copy this file into the initiative's `research/current-state/` directory as a starting point, then layer initiative-specific findings on top.
