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

---

## Verified App SDK + App Extensions surface (2026-05-09)

Pulled directly from the official BC dev portal (now hosted at `docs.bigcommerce.com/developer/...`; the older `developer.bigcommerce.com/docs/...` URLs 301 to the new host). Use this section as the canonical citation surface for `paradigm-b2b/apps/admin` work; the on-disk reference apps (`ask-bc`, `aisles-admin`) are *one team's choices* and may diverge from the spec — flagged below where they do.

### A. Packages BC actually ships

| Package | Version (2026-05-09) | Status | Source |
|---|---|---|---|
| `@bigcommerce/big-design` | **2.5.0** | Actively maintained (repo updated 2026-04-22) | npm registry; [github.com/bigcommerce/big-design](https://github.com/bigcommerce/big-design) |
| `@bigcommerce/app-extensions-sdk` | **NOT PUBLISHED** on npm (HTTP 404 at `registry.npmjs.org/@bigcommerce%2Fapp-extensions-sdk`) | n/a | npm registry direct query |
| `bigcommerce/app-sdk-js` (GitHub) | last updated **2023-10-06**, not archived | Stale; described in BC docs as "a simple JavaScript library used to manage apps in the control panel" — prevents control-panel logout while user is in app iframe | [github.com/bigcommerce/app-sdk-js](https://github.com/bigcommerce/app-sdk-js) |
| `bigcommerce/sample-app-extensions` (GitHub) | last updated **2023-06-03** | Reference Next.js starter for App Extensions registration via GraphQL Admin API | [github.com/bigcommerce/sample-app-extensions](https://github.com/bigcommerce/sample-app-extensions) |

**Surprise / spec divergence:** Despite frequent community references to a `@bigcommerce/app-extensions-sdk` package, **no such package is published on npm**. The official "App Extensions guide" (see B below) does not mention any SDK package name — App Extensions are registered via the **GraphQL Admin API** (`createAppExtension` / `updateAppExtension` / `deleteAppExtension` mutations), and the iframe content is just your app rendered at the registered URL. There is no JavaScript runtime contract beyond the iframe + `signed_payload_jwt` on `/load`. If `ask-bc` or `aisles-admin` import a package by that name, audit what they're actually pulling — likely an internal helper, not an official BC SDK.

### B. App Extensions: supported surface

Source: [docs.bigcommerce.com/developer/docs/integrations/apps/app-extensions/guide](https://docs.bigcommerce.com/developer/docs/integrations/apps/app-extensions/guide) (via `llms-full.txt`).

**Supported models** (extension menu items render in the **Action** menu of these native CP pages):
- `PRODUCTS` — View Products page row action menu
- `PRODUCT_DESCRIPTION` — Edit-a-Product page Description section
- `ORDERS` — View Orders page row action menu
- `CUSTOMERS` — View Customers page row action menu

**Limit:** max **2 App Extensions per model per app**.

**Context types** (apply to all models):
- `PANEL` — opens iframe in a side-panel overlay over the current CP page
- `LINK` — redirects to the app's dedicated iframe in the **Apps** sub-menu (multi-page workflows)

**Registration:** GraphQL Admin API mutations `createAppExtension` / `updateAppExtension` / `deleteAppExtension`; query via `store.appExtensions`. Requires `store_app_extensions_manage` OAuth scope on the app.

**Mapping to paradigm-b2b's 5 admin scenarios:**

| Scenario | Best surface | Rationale |
|---|---|---|
| MM2.3 At-risk dashboard | Standalone app page (LINK) | Cross-order rollup view; no single-row anchor |
| EE1.1 Partner approval | Standalone app page | Approval queue is its own list view |
| EE1.4 Unified pane | Standalone app page | Cross-entity composite |
| EE2.2 Pricing review | `ORDERS` PANEL extension *or* standalone | Per-order pricing context — PANEL gives in-context review without leaving Orders list |
| EE2.1 BOM admin | `PRODUCTS` or `PRODUCT_DESCRIPTION` PANEL | Per-product BOM editing fits PRODUCT_DESCRIPTION action menu |

Note: `CUSTOMERS` model is per-customer, not per-Company (B2B Edition's company-level entity is not a native CP page that App Extensions can target — Companies live in the B2B Buyer Portal app, not the BC native customer page).

### C. OAuth callback contract (verified)

Source: [docs.bigcommerce.com/developer/docs/integrations/apps/guide/handling-callbacks](https://docs.bigcommerce.com/developer/docs/integrations/apps/guide/handling-callbacks) and `.../guide/auth`.

**Callbacks:**
| Endpoint | Required | Origin | Payload | Response |
|---|---|---|---|---|
| `GET /auth` | Yes | Browser | URL-encoded query | Markup |
| `GET /load` | Yes | Browser | `signed_payload_jwt` query param | Markup |
| `GET /uninstall` | No | Server | `signed_payload_jwt` query param | JSON |
| `GET /remove_user` | No | Server | `signed_payload_jwt` query param | JSON |

**`signed_payload_jwt` claims** (HS256, signed with the app's client secret):
`aud` (client ID), `iss` ("bc"), `iat`, `nbf`, `exp` (24h after `nbf`), `jti`, `sub` (`stores/{STORE_HASH}`), `user.id`, `user.email`, `user.locale`, `owner.id`, `owner.email`, `url` (developer-configured deep-link path), `channel_id` (int or null).

**Token exchange** — `POST https://login.bigcommerce.com/oauth2/token`:
- Request body: `client_id`, `client_secret`, `code`, `scope`, `context`, `grant_type=authorization_code`, `redirect_uri`
- Response JSON: `access_token`, `scope`, `user{id,username,email}`, `owner{id,username,email}`, `context`, `account_uuid`

Track A's `/auth` implementation (port from `ask-bc`) should match exactly the field names above; `account_uuid` in particular is easy to miss but is needed for B2B Edition cross-app correlation.

### D. OAuth scopes (verbatim from docs)

Source: [docs.bigcommerce.com/developer/docs/overview/api-fundamentals/api-accounts](https://docs.bigcommerce.com/developer/docs/overview/api-fundamentals/api-accounts) (the `developer.bigcommerce.com/docs/start/authentication/api-accounts` URL silently redirects here).

Scopes follow the pattern `store_<area>` for modify and `store_<area>_read_only` for read. Verified scopes pulled from the live page:

`store_app_extensions_manage`, `store_cart_read_only`, `store_channel_listings_read_only`, `store_channel_settings_read_only`, `store_checkout_read_only`, `store_content_checkout_read_only`, `store_fulfillment_methods_manage`, `store_fulfillment_methods_read_only`, `store_inventory_read_only`, `store_locations_read_only`, `store_order_fulfillment_manage`, `store_order_fulfillment_read_only`, `store_sites_read_only`, `store_stored_payment_instruments_read_only`, `store_themes_manage`, `store_themes_read_only`, `store_translations_read_only`, `store_v2_content` / `_read_only`, `store_v2_customers` / `_read_only`, `store_v2_customers_login`, `store_v2_information` / `_read_only`, `store_v2_marketing` / `_read_only`, `store_v2_orders` / `_read_only`, `store_v2_products` / `_read_only`, `store_v2_transactions` / `_read_only`.

**B2B Edition scope** — Source: [docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/authentication](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/authentication).

- The B2B Edition scope is a **single unified `modify`-level scope**, not finer-grained read/write/RFQ-specific. The dev portal explicitly notes: *"If your store doesn't have B2B Edition enabled, the B2B Edition scope will not be available."*
- Server-to-server B2B API access requires a **store-level V3 API account** (Settings > Store-level API accounts > Create API Account) with the **B2B Edition scope set to `modify`**, not the marketplace app's OAuth grant.
- B2B requests use `X-Auth-Token` (the long-lived V3 token) + `X-Store-Hash` headers; do not expire by default.
- A historical B2B-specific `authToken` is **deprecated** in favor of the standard BigCommerce `X-Auth-Token`.
- BC also exposes a B2B Edition client ID `dl7c39mdpul6hyc489yk0vzxl6jesyx` for storefront login JWT flows (irrelevant for admin app, noted for completeness).

**Implication for paradigm-b2b:** the marketplace app's `/auth` OAuth grant gets the BC store scopes (orders, customers, products, app_extensions_manage, etc.). A *separate* store-level API account with B2B Edition `modify` must be provisioned per merchant to read Companies/Users/RFQ. Two-token model. This is officially documented; if `ask-bc` or `aisles-admin` show only a single-token flow they're skipping the B2B path or assuming pre-provisioned tokens.

### E. Sandbox testing flow (officially documented vs. inferable)

**Officially documented** (from App Extensions guide):
1. Create app profile in Developer Portal with required scopes (incl. `store_app_extensions_manage` if registering extensions).
2. Serve the draft app over HTTPS using ngrok.
3. Configure `.env` with Client ID, Client Secret, ngrok domain.
4. Add ngrok callback URLs (`/auth`, `/load`, `/uninstall`) to the app profile.
5. Install the draft app on a sandbox store (the Developer Portal exposes an Install link for draft apps; URL pattern is the standard `store-{hash}.mybigcommerce.com/manage/marketplace/apps/...` install).

**Inferable only from sample code, not spec:**
- The exact `db:setup` step shown in the BC Next.js starter (`npm run db:setup`) is starter-specific, not a platform contract.
- App Extensions GraphQL registration timing (register-on-install vs register-on-first-load) is an implementation choice; the spec only says they must be registered via the Admin API at some point.

### F. What surprised me / spec divergences to watch

1. **No `@bigcommerce/app-extensions-sdk` npm package exists** despite community references. App Extensions are pure GraphQL registration + iframe rendering. If the prototype scaffolds an import to it, that import is broken.
2. **`PRODUCT_DESCRIPTION` is a separate model** from `PRODUCTS`, surfacing inside the Edit-a-Product page's Description section action menu. Useful for EE2.1 BOM admin if BOM is conceptually a product attribute.
3. **B2B Edition is a single coarse `modify` scope** — there is no `b2b_companies_read_only` or RFQ-specific scope. Plan permission UX accordingly: granting B2B access is all-or-nothing.
4. **The `app-sdk-js` GitHub repo has not been touched since 2023-10-06** but is not archived. Treat it as the current canonical helper but expect to maintain a vendored fork if you need to patch.
5. **The official BC docs host has migrated** from `developer.bigcommerce.com/docs/*` to `docs.bigcommerce.com/developer/docs/*`. The old host 301-redirects, but downstream tools that hard-code old URLs will break. Update any LLM scrapes or citation lists.

