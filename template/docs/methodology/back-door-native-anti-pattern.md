# Back-door-native anti-pattern: reframing domain-named platform asks

**Status: canonical (wave 74).**

## The gap this closes

Platform-ask enumeration commonly includes candidates named after the consuming app's domain — e.g., `subscription.*` MES events, webhook events under `store/subscription/*` namespaces, native app-extension contexts named "subscription," or CP email templates prefixed with the app's domain noun. Each looks like a clean field-extension shim. But naming a platform surface after one app's domain is asking the platform to ratify that domain as a native concept — without anyone explicitly deciding to. This is **back-door nativization**: it achieves the business goal via implicit platform ratification rather than explicit decision, which makes it politically expensive (requires platform-team buy-in), structurally fragile (relies on the domain's continued prominence), and ecosystem-hostile (privileges one app over competitors).

## The principle

When a platform-ask names the consuming app's domain, reframe it to a general mechanism that benefits the whole marketplace ecosystem. The general mechanism solves the same problem for any app with the same need; the domain-named ask solves it only for us at the political cost of platform ratification.

## Reframing patterns

| Domain-named ask | General-mechanism reframe |
|---|---|
| `subscription.*` MES event topic | Sanctioned-app-emitted event topics with verified-by-installation signing; any marketplace app can emit and subscribe to verified event topics. |
| Domain-named webhook events (e.g., `webhook.store/subscription/*`) | Platform-amplified webhooks from sanctioned event topics; any app's events can be amplified. |
| App-extension context named after app domain (e.g., "subscription" context) | Marketplace-app-declared extension contexts; any app declares its context namespace. |
| CP email templates named after app domain | Platform-amplified email templates rendering app-emitted events; templates render any app's event payloads. |

### Worked examples from bc-subscriptions

`docs/feasibility/platform-shims.md` § A15 demonstrates the reframe. The enumeration initially included four domain-named compound asks (subscription event topics, webhook events, app-extension context, email templates). The reframe consolidated them into a single keystone ask: sanctioned-event topics with verified-by-installation signing, which subsumes all four use cases without domain nativization.

## Applicability and testing

**Trigger**: Any platform-side ask that names the consuming app's domain in the surface name (events, webhook paths, extension contexts, template categories).

**Gate**: Part of the three-pass research discipline (Pass 3). Required before platform-ask enumeration goes to stakeholder review. Failing candidates are reclassified under the reframed general mechanism (if available) or dropped as back-door-nativization anti-patterns.

**Tier**: T2 default. T3 escalates any reframing that changes the scope of the ask (e.g., consolidating four asks into one keystone) to ADR-level review.

## What this is, in one line

When a platform-ask names the consuming app's domain, reframe to a general mechanism benefiting any marketplace app — trading domain privilege for ecosystem benefit.
