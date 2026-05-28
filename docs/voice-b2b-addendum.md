# Voice Addendum — BC B2B Edition

Loaded only when `blueprint.yml` has `b2b_edition.enabled: true`. The base voice rules are in `docs/voice-template.md`; this doc adds the B2B-specific anti-patterns and actor-naming requirements.

## Additional anti-patterns

The base anti-patterns (1-7) in `voice-template.md` apply unchanged. These extend the list for B2B contexts.

8. **Calling B2B APIs from the browser.** `B2B_API_TOKEN` is server-only. Always proxy through your BFF (Backend For Frontend) — Pages Function, Worker, or framework SSR route. Reason: the token grants company-wide read/write and must never leave the server.

9. **Treating "customer" and "buyer" as synonyms.** Customer is the BC core entity; Buyer is the B2B Edition entity tied to a Company. In B2B-specific copy, "Buyer" is precise and "Customer" is ambiguous.

10. **Using "RFQ" in user-facing copy.** BC's term is "Quote." RFQ is industry jargon BC's platform doesn't use. Even if stakeholders say RFQ, the user-facing copy uses Quote.

11. **Showing all products to all buyers.** Customer Groups + Categories = restricted catalogs. Any mock data, screenshot, or strategy panel that implies an unfiltered catalog for a B2B buyer fails to represent the platform.

12. **Skipping the `on-cart-created` listener.** Quote-to-checkout breaks silently without it. Strategy panels and integration docs must mention this listener whenever the quote flow is in scope.

13. **Designing buyer flows without naming the actor.** "User creates quote" is ambiguous. "Junior Buyer creates quote, routed to Senior Buyer for approval" is the actual flow. See the actor pattern below.

## Actor naming — multi-actor role pattern

Every B2B flow must name *which actor* (per `wip/subs-initiative/docs/decisions/0023-multi-actor-roles.md`):

- **Owner** — Company Admin or ultimate authority
- **Payer** — settles invoices (may differ from Owner)
- **Beneficiary** — receives goods (may differ from Owner & Payer)
- **Manager** — operates day-to-day with limited spending power
- **Org Admin** — configures Company-level settings

"The user creates a quote" → "The Junior Buyer creates a quote; the Senior Buyer approves it." The actor must be visible in the slice copy (or the strategy panel if implicit in the UI).

## Terminology overrides

These extend `terminology-linter`'s base ban list for B2B contexts:

| Never use | Always use | Why |
|---|---|---|
| User | Buyer | BC B2B Edition entity tied to a Company |
| Org / Organization | Company | BC term for the multi-buyer entity |
| RFQ | Quote | BC has Quote objects; RFQ is industry jargon BC doesn't use |
| Order admin | Senior Buyer / Company Admin | Specific B2B Edition roles |
| Customer (in B2B-specific copy) | Buyer or Company (specify) | Customer is BC core; ambiguous in B2B context |

## Platform-fidelity citations

Every storefront claim that touches B2B surfaces must cite a contract method from `docs/bc-b2b-buyer-portal-integration.md`. The `citation-checker` sub-agent enforces this.

| Surface | Required citation |
|---|---|
| Buyer login | `loginWithB2B()` server-side token exchange |
| PDP B2B button | `useAddToQuote()` or `useAddToShoppingList()` hook |
| Cart sync after quote acceptance | `on-cart-created` event listener |
| B2B catalog visibility | Customer Group filtering (BC core) |
| Per-buyer pricing | Customer Contracts (B2B Edition) — not Price Lists |

## References

- `~/Workspace/dev/tools/blueprint/docs/bc-b2b-edition-context.md` — data model, surfaces, ownership boundaries
- `~/Workspace/dev/tools/blueprint/docs/bc-b2b-buyer-portal-integration.md` — framework-agnostic integration contract
- `~/Workspace/dev/wip/subs-initiative/docs/decisions/0023-multi-actor-roles.md` — actor pattern source

## Origin

Carved out of `template/CLAUDE.md` 2026-05-25. Previously loaded into every initiative regardless of `b2b_edition` flag state. Now conditionally loaded.
