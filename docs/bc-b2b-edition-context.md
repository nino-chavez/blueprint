# BigCommerce B2B Edition Context

**Purpose:** Captures everything known about BC B2B Edition's data model, APIs, surfaces, and integration mechanics — so future BigBlueprint initiatives targeting B2B don't have to re-discover this through docs and trial.

**Last updated:** 2026-05-09

**Discovery source:** Paradigm B2B initiative (May 2026) + bc-subscriptions architectural reference + BC's open-source `b2b-buyer-portal` repo + the "Open Source Buyer Portal working with One Click Catalyst" integration guide.

**Companion doc:** `bc-b2b-buyer-portal-integration.md` covers the framework-agnostic host-storefront integration contract. This doc is the data-model and surface inventory.

---

## 1. What B2B Edition Adds Beyond BC Core

BC core (any plan) gives you: products, orders, customers, customer groups, channels, price lists, scripts, themes, payment methods.

B2B Edition adds:

| Capability | What it is |
|---|---|
| **Companies** | Multi-buyer organizations with hierarchy. A Company has 1+ Buyers. |
| **Buyers** | Per-individual accounts under a Company. Buyer has roles, permissions, addresses. |
| **Buyer roles** | Senior Buyer, Junior Buyer, etc. — drives approval workflows and permissions |
| **Quotes** | First-class quote objects (RFQ → quote → order pipeline) |
| **Quote approval workflows** | Multi-step approval routing within a Company |
| **Customer Contracts** | Negotiated pricing agreements per Customer Group / Company |
| **Shopping Lists** | Saved lists buyers can re-order from |
| **Buyer Portal** | A separate React SPA buyers see for account, quotes, orders, lists, approvals |
| **Sales Rep Dashboard** | Internal-rep view onto Companies, Quotes, Buyers |
| **Per-buyer addresses** | Address books per buyer, not per company |
| **B2B-specific GraphQL & REST APIs** | Different endpoint host: `api-b2b.bigcommerce.com` |

The Buyer Portal is the most distinctive part — it's a UI that BC ships, not just APIs. Hosts of B2B-enabled storefronts embed the Buyer Portal via a script-loader. See `bc-b2b-buyer-portal-integration.md` for the contract.

---

## 2. The Two API Hosts

> **2026-05-09 architecture update (verified empirically against sandbox `cdfqf9k6zf`, after B2B Edition activation):** Standalone B2B API tokens are deprecated per Travis Poole (BC SA, 2026-05-08). However, **BC admin does not always expose the B2B-Edition scope as additive on an existing core token** — when that's the case, you create a **separate B2B-Edition-scoped token**, and the integration runs with two tokens (one for BC core, one for B2B). This is currently the operationally feasible path on the dev sandbox, and reads cleanly as principle-of-least-privilege.

### Verified auth pattern (2026-05-09)

| Host + Path | Purpose | Auth |
|---|---|---|
| `api.bigcommerce.com/stores/{hash}/v3/...` | BC core — products, orders, customers, channels, price lists | `X-Auth-Token` (core token) |
| `api-b2b.bigcommerce.com/api/v3/io/{resource}` | **B2B Management API** — Companies, Users, Orders, RFQ, Addresses | `X-Auth-Token` (B2B-scoped token) + `X-Store-Hash` |
| `api-b2b.bigcommerce.com/api/io/auth/customers/storefront` | **B2B Storefront token exchange** (`loginWithB2B`) | `X-Auth-Token` + `X-Store-Hash`; **NO `v3` segment** |

> **Path-pattern split is non-obvious.** The Management API is `v3`-versioned; the storefront token-exchange endpoint is **not**. An earlier audit assumed `v3` was uniform across the IO surface and got 404s for two days. Verified empirically — the no-v3 path returned a real JWT once B2B Edition was activated.

### Verified endpoint surface (sandbox `cdfqf9k6zf`, B2B-Edition-scoped token, 2026-05-09)

| Path | Status | Notes |
|---|---|---|
| `/api/io/auth/customers/storefront` (POST) | 200 | Storefront token exchange. Returns `{ data: { token: [<jwt>] }, code: 200 }`. JWT decodes to `bc_customer_id`, `store_hash`, `bc_channel_id`, `email`, `exp`. |
| `/api/v3/io/companies` | 200 | Companies list. |
| `/api/v3/io/users` | 200 | Buyers (per-individual accounts under a Company). |
| `/api/v3/io/orders` | 200 | B2B-side order index. |
| `/api/v3/io/rfq` | 200 | **Quotes feature** — URL path is `/rfq`, NOT `/quotes`. |
| `/api/v3/io/addresses` | 200 | Per-buyer address book. |
| `/api/v2/io/companies` | 200 | Legacy v2 companies endpoint still live alongside v3. |
| `/api/v3/io/quotes` | 404 | Confirms the `/rfq` naming (not `/quotes`). |
| `/api/v3/io/shopping-lists` (and `shoppingList`, `lists`, nested under companies/users) | 404 | Not exposed via the Management API. Treat as **storefront-SDK-only**: buyers create + read via `useAddToShoppingList()` from the Buyer Portal SDK; there is no server-side admin endpoint to list them. |
| `/api/v3/io/customer-contracts` (and variants) | 404 | Not exposed via the Management API. Customer Contracts surface as **price lists scoped to a customer group** in BC core: `api.bigcommerce.com/stores/{hash}/v3/pricelists` + `/v2/customer_groups`. Treat the "customer contract" UX as a price-list view, not a separate API. |
| `/api/v3/io/price-lists`, `priceLists` | 404 | Price lists are BC core: `api.bigcommerce.com/stores/{hash}/v3/pricelists` — verified 200. |
| `/api/v3/io/sales-staff`, `salesStaff` | 404 | Not at this path. Sales-staff surface is BC admin-only on this sandbox; not exposed for programmatic access. |
| BC core: `v3/pricelists` | 200 | Verified — price lists live here, not under api-b2b. |
| BC core: `v2/customer_groups` | 204 | Verified — customer groups exist on BC core; B2B Companies link to them via `customerGroupId`. |

### Required token scope grant

For an API account to access B2B Edition surfaces, grant B2B-related scopes in BC admin:

```
Settings → API Accounts → [your token] → grant B2B Edition scopes → save
```

Until the scope is added, B2B endpoints return 403 "Invalid access token" — this is expected, not a structural issue.

**Naming gotcha:** the B2B Edition's "Quotes" feature uses URL path `/rfq` (Request for Quote), NOT `/quotes`. Verified per `quotes.mdx` page on BC docs.

### Schema gotchas (verified 2026-05-09 by writing a seed script against sandbox `cdfqf9k6zf`)

These tripped a real seeding pass; document so future initiatives don't rediscover them:

1. **Company POST requires `admin*`-prefixed contact fields**, not bare ones.
   Required keys: `adminFirstName`, `adminLastName`, `adminEmail`, `adminPhoneNumber`. A bare `email` returns
   422 "Admin email is required" — misleading because the field exists in the payload, just under a different key.

2. **Company role IDs are sandbox-specific** — read them from `GET /api/v3/io/companies/roles` (plural, nested under companies).
   Returns `[{id, name, roleType, roleLevel}]` with names like "Admin", "Senior Buyer", "Junior Buyer".
   Don't hardcode IDs across environments.

3. **RFQ POST uses camelCase keys** despite the API returning snake_case-looking validation messages. Required body shape:
   ```json
   {
     "companyId": 12660609, "userId": 18298894, "channelId": 1,
     "quoteTitle": "...", "expiredAt": "06/01/2026",
     "contactInfo": {"name","email","phoneNumber","companyName"},
     "productList": [{"productId","variantId","quantity","basePrice","offeredPrice","productName","sku","discount"}],
     "subtotal": 0, "discount": 0, "grandTotal": 0, "totalAmount": 0,
     "currency": {"currencyCode": "USD", "currencyExchangeRate": 1}
   }
   ```
   `productId` must reference a real catalog product — `0` returns "Product not found in store".

4. **`expiredAt` is `MM/DD/YYYY` string** — NOT a unix timestamp, NOT `MM/DD/YY`.
   The API's error message claims `'%m/%D/%y' format` but only 4-digit years are actually accepted.

5. **Price list assignments POST takes a JSON array**, not a single object.
   `POST /v3/pricelists/assignments` with body `[{price_list_id, customer_group_id}]` (BC core, not B2B host).
   Single-object posts return "request payload has to be a JSON array".

6. **Companies default to approved when created with `customerGroupId`**.
   To create a "pending approval" demo company, omit `customerGroupId` on POST; flip status later with PUT and `companyStatus: 1`.

---

## 3. Data Model — Core Entities

```
Company
├── id, name, contactInfo, status (pending/approved/rejected)
├── extraFields[] (custom fields per merchant config)
├── companyAdmins[] (Buyers with admin role)
└── Buyers[]
    ├── id, email, firstName, lastName, role, phone
    ├── permissions[] (purchase, manage_users, manage_addresses, etc.)
    ├── addresses[] (own address book)
    ├── customerGroupId (drives pricing visibility)
    ├── shoppingLists[]
    └── orders[] / quotes[]

CustomerGroup (BC core, B2B uses heavily)
├── id, name, isGroupForGuests
└── categoryAccess (which categories visible)

PriceList (BC core, B2B uses heavily)
├── id, name, active
└── PriceListAssignments[]
    ├── customerGroupId | channelId | companyId
    └── PriceListRecords[]
        ├── productId / variantId
        ├── price, salePrice, retailPrice, mapPrice
        └── currency, dateRange

Quote (B2B Edition specific)
├── id, quoteNumber, customerId, companyId
├── status (open / sent / accepted / rejected / expired / converted)
├── lineItems[] (productId, variantId, qty, basePrice, finalPrice, discount)
├── subtotal, total, tax, shipping
├── notes[] (internal + customer-facing)
├── approvalWorkflow (which approver, when)
├── expirationDate
└── createdBy (sales rep) / requestedBy (buyer)

CustomerContract (B2B Edition specific)
├── id, customerId | companyId | customerGroupId
├── productAssignments[] (sku → contracted price)
├── volumeBreaks[] (qty thresholds with tiered prices)
├── effectiveDate, expirationDate
└── auto-renewal flag

ShoppingList (B2B Edition specific)
├── id, customerId, name, status (active / archived / shared)
├── lineItems[]
└── isPublic (shareable to other buyers in same Company)
```

**The pattern that recurs across all B2B initiatives:**

- **Pricing visibility** is filtered by Customer Group (B2B catalogs hide products from buyers not in the right group)
- **Per-buyer pricing** is set via Customer Contracts, not generic price lists
- **Quote-to-order** is the buying motion; cart-checkout is secondary for many B2B segments
- **Approval workflows** add steps between cart-add and order-submit

---

## 4. The Buyer Portal SPA

The Buyer Portal is a **React SPA** that BC builds, hosts, and serves from a CDN. Buyers visiting B2B-enabled storefronts see this Portal embedded into the host storefront — not as a separate page, but as a script-loaded component that takes over routes like `/account/*`, `/quotes/*`, `/shopping-lists/*`.

### Three deployment modes

| Mode | Where the portal JS comes from | Use case |
|---|---|---|
| **Dev** | Local dev server (`http://localhost:3001` after `yarn dev` in the open-source `b2b-buyer-portal` repo) | Active development with live reload |
| **Production (BC CDN)** | Default; loaded from BC's CDN | Most merchants — zero infra to manage |
| **Production (custom)** | Loaded from a self-hosted URL (your own fork of `bigcommerce/b2b-buyer-portal`) | When you need to customize the Portal beyond what config supports |

The integration host (your storefront — Catalyst, SvelteKit, etc.) selects the mode via env vars.

### What the Portal owns (you don't design these)

- Account dashboard
- Quote inbox + quote detail view
- Order history
- Shopping lists
- Address book
- User management (within Company)
- Approval inbox

### What the host storefront owns

- PDP (Product Detail Page) — including the **B2B-specific buttons** Add to Quote and Add to Shopping List that the Portal injects when active
- Cart, checkout
- Storefront chrome (header, footer, search, category nav)
- Login/registration UI (the host owns the form; the Portal handles the post-login session)

---

## 5. Multi-Actor Roles (B2B Pattern)

Cross-cutting roles you'll see in any B2B initiative — not B2B Edition's exact terminology, but the abstraction layer for "which actor is this":

| Role | Description | Example use case |
|---|---|---|
| **Owner** | Subscription/account holder, ultimate authority | Company Admin in B2B Edition |
| **Payer** | Settles invoices; may differ from Owner | Finance team, parent org |
| **Beneficiary** | Receives goods/services; may differ from Owner & Payer | End-user buyer |
| **Manager** | Operates day-to-day, has limited spending power | Senior Buyer with $5k/order cap |
| **Org Admin** | Configures Company-level settings (users, budgets, mandates) | IT or Procurement lead |

Reference: `bc-subscriptions/docs/decisions/0023-multi-actor-roles.md` formalized this for subscription billing. The same enum applies to B2B procurement, marketplace fulfillment, and gift-card/voucher flows.

**Why this matters for prototypes:** Strategy panels and design decisions need to explicitly name *which actor* a feature serves. "We let the user create a quote" is wrong — it's the Junior Buyer (constrained), with approval routing to the Senior Buyer or Org Admin. Make this visible.

---

## 6. Standard B2B Edition Surfaces

| Surface | Owner | Customizability |
|---|---|---|
| Storefront PDP | Host storefront | Full — including B2B button injection points |
| Storefront cart | Host storefront | Full |
| Storefront checkout | Host storefront | Full |
| Buyer Portal /account | BC Buyer Portal SPA | Config-only unless forked |
| Buyer Portal /quotes | BC Buyer Portal SPA | Config-only unless forked |
| Buyer Portal /shopping-lists | BC Buyer Portal SPA | Config-only unless forked |
| Buyer Portal /addresses | BC Buyer Portal SPA | Config-only unless forked |
| Sales Rep Dashboard | BC control panel | Config-only |
| Approval workflows | BC control panel + Buyer Portal | Workflow definition: control panel; UI: portal |
| Marketplace App (admin) | Your app, embedded in BC iframe | Full — see `bc-marketplace-context.md` |

**Implication for BigBlueprint prototype slices:** if your slice modifies a Buyer Portal surface, you need to either (a) accept the existing portal's UX and customize via config, (b) fork the portal, or (c) build the surface in your own host (storefront or marketplace app) instead. The decision is non-trivial — see `bc-b2b-buyer-portal-integration.md` §"Two Integration Paths" and ADR pattern in `bc-subscriptions/docs/decisions/`.

---

## 7. Authentication Flow

```
1. Buyer visits storefront, clicks Login
2. Storefront calls BC GraphQL `login` mutation
   Response: customerAccessToken (with expiresAt) + customer.entityId
3. Storefront server (or host BFF) calls B2B token-exchange:
   POST https://api-b2b.bigcommerce.com/api/io/auth/customers/storefront
   Headers: authToken: $B2B_API_TOKEN
   Body: { channelId, customerId, customerAccessToken }
   Response: { data: { token: ["<b2bToken>"] } }
4. Storefront stores b2bToken in session (HMAC-signed cookie recommended)
5. Storefront mounts Buyer Portal script with b2bToken passed as prop/data-attr
6. Buyer Portal SPA initializes, exchanges b2bToken for SDK session
7. Portal exposes hooks (useAddToQuote, useAddToShoppingList) to host storefront
8. Host PDP renders B2B buttons that call portal hooks
```

The critical event in this flow is **step 3** — the server-side token exchange. It must happen server-side because the `B2B_API_TOKEN` is a static high-privilege secret. Never put it in client-side code.

The other critical flow is **on-cart-created**:

```
1. Buyer creates a quote in the Portal
2. Buyer accepts the quote → Portal converts quote to a cart
3. Portal SDK fires the on-cart-created event with the new cartId
4. Host storefront listens for this event, calls setCartId(cartId), re-renders
5. Storefront /checkout now sees the new cart
```

This is the most common breakage point in B2B integrations. If quote-checkout silently empties the buyer's cart, the on-cart-created listener isn't wired.

---

## 8. Required Environment Variables

For any BigBlueprint initiative targeting B2B Edition, the host storefront needs:

```bash
# BC Core (from BC control panel → Settings → API Accounts)
BIGCOMMERCE_STORE_HASH=
BIGCOMMERCE_CHANNEL_ID=
BIGCOMMERCE_CLIENT_ID=
BIGCOMMERCE_CLIENT_SECRET=
BIGCOMMERCE_ACCESS_TOKEN=

# B2B Edition (from B2B Settings → API Configuration)
B2B_API_TOKEN=
B2B_API_HOST=https://api-b2b.bigcommerce.com/

# Buyer Portal — dev (only if running open-source portal locally)
LOCAL_BUYER_PORTAL_HOST=http://localhost:3001

# Buyer Portal — prod default (BC CDN)
STAGING_B2B_CDN_ORIGIN=false   # true = staging CDN, false = prod CDN

# Buyer Portal — prod custom (only if forking the portal)
PROD_BUYER_PORTAL_URL=
PROD_BUYER_PORTAL_HASH_INDEX=
PROD_BUYER_PORTAL_HASH_INDEX_LEGACY=
PROD_BUYER_PORTAL_HASH_POLYFILLS=

# Storefront session (recommendation: HMAC-signed cookie)
STOREFRONT_SESSION_SECRET=
```

In Cloudflare Workers, sensitive vars are set via `wrangler secret put`. Non-sensitive vars (`STAGING_B2B_CDN_ORIGIN`, `LOCAL_BUYER_PORTAL_HOST`) can live in `wrangler.toml`.

---

## 9. Ownership Boundary — B2B Edition Surfaces

| Surface | Owner | Influence |
|---|---|---|
| Buyer login UI | Host storefront | Full |
| Customer access token issuance | BC GraphQL | None (BC does this) |
| B2B token exchange | Your server-side BFF (BC supplies the API) | You control when, where, how cached |
| Buyer Portal SPA chrome | BC (BigCommerce ships it) | None — it's their UI |
| Buyer Portal /quotes route | BC Buyer Portal | Config-only unless forked |
| Quote object schema | BC B2B Edition | None |
| Quote approval workflow definitions | BC control panel | Configure via control panel; can't extend logic |
| Sales Rep Dashboard | BC control panel | None |
| PDP Add-to-Quote button | **Host storefront, using portal hooks** | Full — hook return values are docs |
| PDP Add-to-Shopping-List button | **Host storefront, using portal hooks** | Full |
| Cart sync after quote conversion | Portal fires event; host listens | Host owns the listener |
| Storefront approval inbox UI | Could be host OR portal | Portal owns by default; host can redirect to its own page |

---

## 10. Common Anti-Patterns (Initiative-Specific)

These show up in every B2B initiative; document and avoid:

1. **Calling B2B APIs from the browser.** `B2B_API_TOKEN` is server-only. Always proxy through your BFF.
2. **Treating `customer` and `buyer` as synonyms in copy.** They're distinct concepts in B2B. A Customer is the BC core entity; a Buyer is a B2B Edition entity tied to a Company.
3. **Using "RFQ" in user-facing copy.** BC's term is "Quote." RFQ is industry jargon some buyers know, but the platform consistently uses Quote.
4. **Showing all products to all buyers.** Customer Groups + Categories = restricted catalogs. Mock data must respect this — don't show product visibility that wouldn't exist at runtime.
5. **Skipping the on-cart-created listener.** Quote-to-checkout breaks silently without it. Always wire.
6. **Confusing Customer Contracts with Price Lists.** Price Lists are broad (per group/channel). Customer Contracts are negotiated, per-customer or per-company, often with volume breaks.
7. **Designing buyer flows without naming the actor.** "User creates quote" is ambiguous. "Junior Buyer creates quote, routed to Senior Buyer for approval" is the actual flow.

---

## 11. Reference Sources

| Source | Path / URL |
|---|---|
| Open-source Buyer Portal | `github.com/bigcommerce/b2b-buyer-portal` |
| Catalyst integration reference (Path 2) | `github.com/CNanninga/catalyst/tree/feature/add-custom-b2b-loader/core` |
| BC core API docs | `developer.bigcommerce.com/docs/rest-management/` |
| B2B Edition API docs | `developer.bigcommerce.com/docs/rest-b2b/` |
| Multi-actor role pattern | `bc-subscriptions/docs/decisions/0023-multi-actor-roles.md` |
| Marketplace app baseline | `bc-marketplace-context.md` (this same dir) |
| Buyer Portal integration contract | `bc-b2b-buyer-portal-integration.md` (this same dir) |
| Cloudflare deploy pattern | `cloudflare-deployment-pattern.md` (this same dir) |
| Hive coordination pattern | `hive-coordination-pattern.md` (this same dir) |

---

## 12. What Future BigBlueprint B2B Initiatives Don't Need to Re-Discover

- ✅ B2B Edition data model (Companies / Buyers / Quotes / Contracts / Lists)
- ✅ The two-API-host split (`api.bigcommerce.com` vs `api-b2b.bigcommerce.com`)
- ✅ How the Buyer Portal SPA loads and is configured
- ✅ Auth flow (customer access token → b2bToken exchange)
- ✅ Required env vars
- ✅ Ownership boundaries (host vs. Portal vs. BC control panel)
- ✅ Multi-actor role pattern
- ✅ Common anti-patterns
- ✅ Where the Sales Rep Dashboard lives (BC control panel — not yours to design)

What's still discoverable per-initiative:

- Specific approval workflow rules a merchant has configured
- Custom fields (extraFields on Companies/Buyers)
- Catalog access rules per Customer Group at the merchant
- Whether they use Klaviyo, Feedonomics, or other adjacent integrations
- Whether they need a forked Buyer Portal or can live with the BC-hosted one (decide via fact-check)

---

## Relationship to BigBlueprint Methodology

This doc fits Stage 1 (Research → existing-product analysis) of the BigBlueprint pipeline. When an initiative targets BC B2B Edition, copy this doc into the initiative's `research/current-state/` directory as the starting baseline, then layer initiative-specific findings (B2B sandbox screenshots, merchant-specific Customer Groups, etc.) on top.

Pair with `bc-marketplace-context.md` (if the initiative includes a marketplace app) and `bc-b2b-buyer-portal-integration.md` (always — it's the integration contract).
