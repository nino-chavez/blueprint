# BC B2B Buyer Portal — Integration Contract

**Purpose:** Captures the framework-agnostic contract between a host storefront and BC's Buyer Portal SPA, so initiatives can integrate against any host (Catalyst / SvelteKit / Solid / Vue / Astro / Stencil) without re-deriving the protocol.

**Last updated:** 2026-05-08

**Source:** "Open Source Buyer Portal working with One Click Catalyst" integration guide (May 2026) + Paradigm B2B initiative (May 2026) port to SvelteKit + bc-subscriptions reference.

**Companion doc:** `bc-b2b-edition-context.md` covers the B2B Edition data model and surface inventory. This doc is *just* the integration contract.

---

## Two Integration Paths

| | **Path 1: OCC + Open-Source Buyer Portal** | **Path 2: Fork `catalyst-b2b-clean`** |
|---|---|---|
| Repos to manage | 2 (storefront + buyer portal) | 1 |
| Pre-built B2B components | None — implement from scratch | Auth flow, cart sync, PDP buttons, quote checkout, shopping lists |
| Time to working integration | Days | Hours |
| Customization ceiling | Total | Constrained by upstream |
| Frameworks supported | Any | Currently Catalyst (Next.js 16) only |
| Path 1 source | `github.com/bigcommerce/b2b-buyer-portal` (Buyer Portal repo) | — |
| Path 2 source | — | `github.com/CNanninga/catalyst/tree/feature/add-custom-b2b-loader/core` |

**For Catalyst initiatives:** Path 2 is almost always the right call — pre-built integration, faster to working state.

**For non-Catalyst initiatives (SvelteKit, Solid, Vue, Astro, Stencil):** Neither path applies directly. You port the contract below into your host framework. Reference Path 2 source for the *shape* of the integration; the contract itself is framework-agnostic.

---

## The Integration Contract

The host storefront must do five things:

### 1. Server-side: exchange BC customer access token for B2B token

```
POST https://api-b2b.bigcommerce.com/api/io/auth/customers/storefront
Headers:
  Accept: application/json
  Content-Type: application/json
  authToken: $B2B_API_TOKEN
Body:
  channelId: <BIGCOMMERCE_CHANNEL_ID>
  customerId: <from BC GraphQL login>
  customerAccessToken: { value: <token>, expiresAt: <ISO> }

Response: { data: { token: ["<b2bToken>"] } }
```

Extract `data.token[0]` → store in session as `b2bToken`. **Critical:** this happens server-side because `B2B_API_TOKEN` is a server-only secret.

### 2. Mount a `B2BLoader` component in the root layout

The loader picks one of three script sources based on env:

| Mode | Script source | Trigger |
|---|---|---|
| **Dev** | `${LOCAL_BUYER_PORTAL_HOST}` (default `http://localhost:3001`) | `LOCAL_BUYER_PORTAL_HOST` is set |
| **Prod default** | BC CDN (auto-resolved) | Neither `LOCAL_BUYER_PORTAL_HOST` nor `PROD_BUYER_PORTAL_URL` is set |
| **Prod custom** | `${PROD_BUYER_PORTAL_URL}` | `PROD_BUYER_PORTAL_URL` is set (forked portal) |

All three pass these props to the script:

| Prop | Source | Required for |
|---|---|---|
| `cartId` | session | All modes |
| `channelId` | env | All modes |
| `storeHash` | env | All modes |
| `token` | session (b2bToken from step 1) | All modes |
| `prodUrl` | env (`PROD_BUYER_PORTAL_URL`) | Prod custom only |
| `hashIndex` | env (`PROD_BUYER_PORTAL_HASH_INDEX`) | Prod custom only |
| `hashIndexLegacy` | env (`PROD_BUYER_PORTAL_HASH_INDEX_LEGACY`) | Prod custom only |
| `hashPolyfills` | env (`PROD_BUYER_PORTAL_HASH_POLYFILLS`) | Prod custom only |
| `environment` | env (`STAGING_B2B_CDN_ORIGIN === 'true' ? 'staging' : 'production'`) | Prod default only |

### 3. Wire the cart-creation event listener

```
sdk?.callbacks?.addEventListener('on-cart-created', handleCartCreated);
```

When a buyer creates a quote and accepts/converts it to a cart in the Buyer Portal, this event fires with the new `cartId`. The host must:

```
function handleCartCreated({ data: { cartId } }) {
  setCartId(cartId);                  // update host session
  router.refresh();                   // re-render to pick up new cart
}
```

This is the most common breakage point. Symptoms when broken: quote-checkout redirects to empty cart; cart items don't persist after quote acceptance.

### 4. Render the two PDP B2B buttons

Two buttons on the Product Detail Page:

| Button | Hook (Path 2 / React) | Handler |
|---|---|---|
| **Add to Quote** | `useAddToQuote()` | If `addToQuote.isEnabled`, render button calling `addToQuote.addProductToQuote(product)` |
| **Add to Shopping List** | `useAddToShoppingList()` | If `addToShoppingList.isEnabled`, render button calling `addToShoppingList.addProductToShoppingList(product)` |

Hooks are exposed by the loader script at runtime. Non-React hosts re-export equivalents from your B2B client package.

### 5. Add B2B i18n keys

```
{
  "Product": {
    "ProductDetails": {
      "addToQuote": "Add to quote",
      "addToShoppingList": "Add to shopping list"
    }
  }
}
```

Plus any custom keys for B2B-specific UX (compliance banners, bundle suggestions, etc.).

---

## Framework Port Table

The contract is framework-agnostic. Translate Catalyst (Path 2 reference) to your host:

| Catalyst (Next.js 16) | SvelteKit (Cloudflare adapter) | SolidStart | Vue (Nuxt) | Astro |
|---|---|---|---|---|
| `core/app/[locale]/layout.tsx` | `src/routes/+layout.svelte` | `src/root.tsx` | `app.vue` (default layout) | `src/layouts/Default.astro` |
| `core/auth/index.ts` (NextAuth) | `src/hooks.server.ts` + `src/lib/server/auth.ts` | `src/server/auth.ts` | `server/middleware/auth.ts` | `src/server/auth.ts` |
| `core/b2b/client.ts` (server) | `src/lib/server/b2b-client.ts` | `src/server/b2b-client.ts` | `server/lib/b2b-client.ts` | `src/server/b2b-client.ts` |
| `core/b2b/loader.tsx` (RSC) | `src/lib/components/B2BLoader.svelte` | `src/components/B2BLoader.tsx` | `components/B2BLoader.vue` | `src/components/B2BLoader.astro` |
| `core/b2b/script-{dev,prod,prod-custom}.tsx` | `src/lib/components/Script{Dev,Prod,ProdCustom}.svelte` | Solid components | Vue components | Astro components |
| `core/b2b/use-b2b-{auth,cart,sdk}.ts` (React hooks) | `src/lib/stores/b2b-{auth,cart,sdk}.ts` (Svelte stores) | Solid signals | Vue composables | (Astro: client islands w/ React or Vue) |
| `core/b2b/use-product-details.tsx` | `src/lib/stores/product-details.ts` | Solid signal | Vue composable | (Client island) |
| `core/vibes/.../product-detail-form.tsx` | `src/lib/components/ProductDetailForm.svelte` | `src/components/ProductDetailForm.tsx` | `components/ProductDetailForm.vue` | `src/components/ProductDetailForm.astro` |
| `core/messages/en.json` | `src/lib/i18n/en.json` | `src/locales/en.json` | `i18n/en.json` | `src/i18n/en.json` |

Stencil hosts (legacy BC themes) need a different approach — they're server-rendered Handlebars; client-side B2B integration uses inline `<script>` tags via Script Manager rather than component-based mounting.

---

## Required Environment Variables

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

# Buyer Portal — prod custom (only if forking)
PROD_BUYER_PORTAL_URL=
PROD_BUYER_PORTAL_HASH_INDEX=
PROD_BUYER_PORTAL_HASH_INDEX_LEGACY=
PROD_BUYER_PORTAL_HASH_POLYFILLS=

# Storefront session
STOREFRONT_SESSION_SECRET=     # HMAC key for cookie signing
```

---

## Common Troubleshooting Reference

| Symptom | Likely cause | Fix |
|---|---|---|
| No B2B functionality on pages | Buyer Portal scripts not loading | Check `LOCAL_BUYER_PORTAL_HOST` env, run buyer portal locally on `:3001`, confirm `<B2BLoader />` mounted in root layout |
| Console: preload warnings for `headless.js` | Loader not picking up env vars | Verify env reaches the server-side loader; for Cloudflare Workers, check binding/secret names match |
| User can't log in / B2B token not generated | GraphQL login mutation missing `expiresAt` field | Add `expiresAt` to the `customerAccessToken` selection in your login mutation |
| Quote checkout redirects to empty cart | `on-cart-created` listener not firing or cart ID not propagating | Verify `sdk?.callbacks?.addEventListener('on-cart-created', ...)` is mounted; ensure handler calls `setCartId(cartId)` and triggers re-render |
| Add-to-Quote button missing on PDP | B2B hooks not imported or `isEnabled` is false | Confirm `useAddToQuote()` is imported and `addToQuote.isEnabled` evaluates true (depends on B2B SDK initialized successfully) |
| `B2BLoader` failing silently | Env parsing error | Verify all required env vars present; for Cloudflare Workers check `wrangler.toml` and `wrangler secret` |

---

## Decision: Use BC CDN, Fork the Portal, or Build Your Own?

| Strategy | When | Implication |
|---|---|---|
| **Use BC CDN (default)** | You don't need to customize Portal UX beyond config | Zero infra; relinquish design control over /quotes, /shopping-lists, /account routes |
| **Fork `bigcommerce/b2b-buyer-portal`** | You need custom routes (e.g., BOM uploader inside quote flow), custom branding beyond config, or modified approval flows | Maintain a fork; manage rebases as upstream changes; own the deploy target |
| **Build your own portal** | You're rebuilding the entire B2B UX (rare; usually counter-productive) | Reimplement the SDK contract from scratch; lose BC-shipped maintenance | 

In practice, most initiatives start with BC CDN, identify one or two surfaces that need customization, and decide whether (a) the host storefront can absorb those surfaces (often yes) or (b) a fork is unavoidable (rarer than expected).

---

## Open Questions That Recur Per Initiative

These show up every time and need fact-checking against the specific merchant:

1. **Does the merchant's Buyer Portal config support what we need without a fork?** Most don't realize the config surface is large until they look.
2. **Are we customizing PDP, or also touching the Portal /quotes route?** PDP customization stays in the host. Portal-route customization needs a fork or a host-side redirect override.
3. **What's the merchant's Customer Group / Customer Contract structure?** Mocked data should respect catalog visibility rules; otherwise prototype claims will fail when run against real merchant data.
4. **Are approval workflows configured?** If yes, every quote-creation flow must show the approval step in mocks.
5. **Is multi-channel in play?** Per-channel B2B token issuance is supported but adds complexity; document if needed.

---

## Reference Apps

| Repo | Path / URL | Use For |
|---|---|---|
| Open-source Buyer Portal | `github.com/bigcommerce/b2b-buyer-portal` | Reference for forking; understand portal routes |
| Catalyst Path 2 fork | `github.com/CNanninga/catalyst/tree/feature/add-custom-b2b-loader/core` | Pre-wired Catalyst integration; copy `core/b2b/` for Catalyst hosts |
| Paradigm B2B (port to SvelteKit) | `github.com/Signal-x-Studio-LLC/paradigm-b2b` (private) | SvelteKit-on-Cloudflare port of the contract |
| `aisles-admin` (BC marketplace app) | `~/Workspace/dev/wip/aisles-admin/` | Marketplace app reference (separate from Portal integration) |

---

## Relationship to BigBlueprint Methodology

This doc fits Stage 1 (Research → existing-product analysis) of the BigBlueprint pipeline. For any initiative integrating B2B Edition:

1. Copy this doc into `research/current-state/`
2. Customize §"Framework Port Table" with the columns relevant to your host
3. In §"Open Questions That Recur Per Initiative," answer for your merchant
4. Use §"The Integration Contract" as the spec for Stage 3 prototype slices that touch B2B surfaces
5. Strategy panels in prototype slices cite contract methods (e.g., "calls `useAddToQuote().addProductToQuote(product)`") not abstract phrases

Pair with `bc-b2b-edition-context.md` (data model + surface inventory) and `bc-marketplace-context.md` (if your initiative also has a merchant-admin marketplace app).
