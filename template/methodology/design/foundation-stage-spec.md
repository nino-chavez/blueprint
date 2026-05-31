---
canonical: true
---

# Foundation: Design System + IA — Stage Spec

**Stage placement**: runs after Stage 1 (Research / design-discovery sub-track) and BEFORE any feature prototyping or feature-spec implementation. It consumes the Stage 1 surface inventory (L5) and produces the standing contracts that all downstream feature work renders INTO.

**Why this stage exists (the gap it closes)**: the Blueprint feature pipeline is organized around FEATURES and CAPABILITIES. Each feature spec owns its own surface. But the contracts that govern *how every page is laid out and navigated* are CROSS-CUTTING — they belong to no single feature, because every feature consumes them. In a feature-driven process these contracts have no author. The result: the project emerges bottom-up — each page invents its own scope, layout, and navigation — and the symptom is a steady stream of nav/layout "bugs" that look like one-offs but descend from one missing decision: the project never declared a scope model or an archetype per page. The curative primitives are often already present in the codebase but unadopted, because a primitive that nobody is required to use decays to near-zero adoption. Multi-session / multi-agent development amplifies the drift: nothing carries a prior layout decision into the next session, so each agent re-derives the grammar from whatever page it lands on.

This stage is the binding-and-enforcement layer above the wave-8 design-discovery sub-track. Wave 8 added the design *inventory* (L5 surfaces) and *dictionary* (L0–L4 primitives) — *what exists*. This stage adds what an inventory and a dictionary cannot supply on their own: the *binding* of primitives to pages (scope + archetype per route) and the *machine enforcement* that keeps the binding from decaying. A dictionary that names a `PageContainer` does not make N routes use it; only a manifest plus a linter that fails the build does.

**Reference implementation**: Rally HQ (`~/Workspace/dev/apps/rally-hq`). Its `src/routes/manage/events/[slug]/+layout.svelte` is the canonical entity-scoped layout; its `docs/LAYOUT_TAXONOMY.md` is the prose contract; its `tests/e2e/surfaces.ts` manifest + `src/lib/surface-coverage.test.ts` + `lint:design` gate are the enforcement scaffold seed. Rally HQ is also the cautionary case: ~7 of 99 routes adopted the (already-built) primitives before this stage existed, which is what the stage prevents.

**Done-criterion**: feature prototyping does not start until all five declarations below exist and the enforcement scaffold gates the build. A project that begins feature work without them will re-derive layout grammar per page and accrue the drift this stage exists to prevent.

---

## What every project must DECLARE (the five contracts)

### 1. Scope model — account-scope vs entity-scope

Every route belongs to exactly one scope. The scope determines what navigation chrome the route renders.

| Scope | Renders | Examples (generic) | Hard rule |
|---|---|---|---|
| **account-scope** | The account/workspace navigation list (the user moving between their own top-level surfaces) | dashboard root, settings root, admin root, billing root, profile root | Renders the scope nav list |
| **entity-scope** | An entity header + breadcrumbs for the specific object being viewed/edited | a single record's detail/edit/sub-pages (`/things/[id]`, `/things/[id]/sub`) | **MUST NOT render the account nav list.** An entity route that renders account nav-items is the seed defect this contract prevents. |

The project declares its scope roots: which route prefixes are account-scope roots, and which sub-trees flip to entity-scope. The boundary is usually "a dynamic segment that names a specific entity instance" (`[id]`, `[slug]`), but the project declares it explicitly rather than relying on convention. The reference impl is a `+layout` (or framework equivalent) at each scope boundary: the account-scope layout renders the nav list; the entity-scope layout renders the entity header + breadcrumbs and explicitly does NOT mount the account nav.

### 2. Archetype taxonomy + per-archetype layout/nav prescription

The project declares a CLOSED set of page archetypes. Each route is assigned exactly one. A canonical starting taxonomy (adapt names to the domain; keep the set closed):

| Archetype | Job (one per page) | Layout / nav prescription |
|---|---|---|
| **LIST** | Browse/filter a collection | List container + filters + row/card primitive; account-scope nav; empty/loading/error states required |
| **ENTITY-DETAIL** | View one object | Entity header + breadcrumbs; entity-scope (no account nav); sub-pages are tabs IF each tab is a leaf (see §3) |
| **CONFIG-FORM** | Edit one cohesive config | One `FormField` set, one primary save; one action per page |
| **WIZARD** | Multi-step guided flow | Step indicator + single forward action per step; no competing CTAs |
| **DASHBOARD** | At-a-glance status | Summary cards/widgets whose primary content IS the metrics; progressive disclosure to detail routes |
| **OPERATIONAL-CONSOLE** | Live/real-time operation | Dense, action-oriented; minimal chrome; the one archetype allowed to break the "calm marketing" layout rules |
| **MARKETING** | Public positioning surface | Public chrome; no account nav; SEO-indexable |
| **STATIC** | Legal / docs / reference | Minimal public chrome; content-first |

For each archetype the project names: which shell/container it uses, which header it renders, whether it renders the scope nav, whether it has a hero, and its footer treatment. This is the prescription downstream feature work renders into — a feature spec picks an archetype, not a bespoke layout.

### 3. Layout grammar — the tab-vs-subtree rule

A standing rule that resolves the most common structural drift:

> A **tab** is a leaf — one job, one save context. A feature with **3+ sections that save independently** is a **subtree**, not a tabbed page: it graduates to its own route with sub-navigation.

The failure this prevents: a single tabbed surface stacking multiple independent-save sections behind one tab (a settings page is the canonical seed violation). When that shape appears, the rule says split it into a subtree with sub-nav. The linter (§5) flags tab subtrees that violate this so the graduation happens at design time, not after the bug reports.

### 4. Token / type / icon + component-anatomy contracts

Declared once, project-wide, so no page re-invents them:

- **Token contract (L0)** — semantic tokens are the only colors components reference. Raw scale colors (e.g. a `*-50…*-900` ramp) are forbidden in components because they invert/break under theme switches; dark-mode behavior is defined ONCE at the token layer, never per-component. (The wave-8 design-system dictionary supplies the L0 decisions; this contract binds components to the *semantic* layer over them.)
- **Type contract** — the type ramp + which token each text role uses (`heading`, `body`, `muted`).
- **Icon contract** — one icon set, one sizing scale.
- **Component-anatomy contracts** — exactly ONE canonical implementation of each load-bearing primitive: one `FormField` (label + control + error + hint), one page `Container`, one set of `state/{Loading, Empty, Error}` surfaces, one entity header. Named in the dictionary and bound to archetypes so the default path is to use them, not to hand-roll an equivalent.

### 5. The enforcement scaffold — routes manifest + design linter

Declarations that aren't machine-enforced decay. The scaffold is two pieces:

**(a) Routes manifest** — a single source-of-truth file mapping every route to its `scope` (account / entity) and `archetype` (from §2). This is the contract the linter checks against. Extend whatever route-inventory infra the project already has (e.g. a `surfaces.ts`) rather than inventing a parallel one.

**(b) Design linter** — a build-gating check that fails when:
- a route has no manifest entry (every route must declare scope + archetype);
- an entity-scope route renders account nav-items (§1 violation);
- a tab subtree violates the tab-vs-subtree rule (§3 violation);
- a page references raw scale colors instead of semantic tokens (§4 violation);
- a page hand-rolls a primitive that has a canonical anatomy contract (§4 violation), where statically detectable.

A useful manifest-level coherence check the reference impl ships (and that costs nothing to add): `ENTITY-DETAIL ⟹ entity-scope`, `MARKETING ⟹ public-scope`, and `entity-scope ⟹ the route carries a dynamic [param]` (an entity route addresses a specific instance, so an entity-scope route with no parameter is a misclassification). These catch the most common scope/archetype mislabels at the manifest layer, before any DOM render.

The linter gates the build (CI or local pre-push). The discipline is **reconcile + enforce, never sweep**: for an existing project, declare scope + archetype per route in the manifest, bind the existing primitives to archetypes, then let the linter hold the line. A one-time manual sweep of every route decays the moment a new route lands without the gate; the gate does not.

---

## How this stage runs

1. **Read the Stage 1 surface inventory** (the L5 `research/surface-audit.md` + L0–L4 dictionary). This stage consumes it; it does not re-derive it.
2. **Author the scope model** — assign every inventoried route a scope; declare the scope roots and boundary rule.
3. **Author the archetype taxonomy** — fix the closed set; assign every route an archetype; write the per-archetype layout/nav prescription.
4. **Author the token/type/icon + component-anatomy contracts** — bind components to semantic tokens; name the one canonical `FormField` / `Container` / `state/*` / entity-header.
5. **Stand up the enforcement scaffold** — write the routes manifest (scope + archetype per route) and the design linter; wire it as a build gate.
6. **Bind primitives to archetypes** — make adoption the default path. For an existing project, reconcile against the manifest; do not sweep.

Only when steps 1–6 are done does feature prototyping / feature-spec implementation begin. Feature specs then pick a scope + archetype from these contracts; they do not author layout grammar.

## Variant notes

- **greenfield** — author the contracts ahead of build from the planned surface map; the manifest starts as a forecast and is reconciled as routes land.
- **midstream / brownfield** — the acute case. The product already has N routes that emerged bottom-up. This stage runs as a reconciliation: inventory (Stage 1) → declare scope + archetype per existing route → bind existing primitives → stand up the gate → reconcile + enforce. This is where the "primitives present but unadopted" pathology lives and where the stage pays for itself.
- **multi-session / multi-agent** — the manifest is the artifact that carries layout decisions across sessions; without it each session re-derives the grammar. For these projects the enforcement scaffold is not optional polish — it is the only thing that makes prior decisions survive a fresh session.

## What this stage does NOT do

- It does not design individual features — those are feature specs that render into these contracts.
- It does not author the L0–L4 dictionary — that is the Stage 1 design-discovery sub-track (wave 8). This stage consumes it and adds scope/archetype binding + enforcement.
- It does not prescribe a specific framework's routing mechanism — `+layout`, nested layouts, route groups, and middleware are all valid carriers for the scope-boundary contract; the project declares which it uses.

## References

- Wave-8 design-discovery sub-track (the inventory + dictionary this stage binds): `METHODOLOGY.md` § Stage 1 "Design-discovery sub-track" + § Stage 2 "Design-system dictionary"; `template/methodology/design/audit-template.md`; `template/methodology/design/EXAMPLE-design-system.md`.
- Reference implementation (entity-scoped layout): `~/Workspace/dev/apps/rally-hq/src/routes/manage/events/[slug]/+layout.svelte`.
- Reference contract + enforcement scaffold: rally-hq `docs/LAYOUT_TAXONOMY.md` (prose contract), `tests/e2e/surfaces.ts` (manifest), `src/lib/surface-coverage.test.ts` (drift + coherence guard), `lint:design` gate.
- Originating evidence: rally-hq 2026-05-31 7-dimension nav/layout audit + the rally-hq `METHODOLOGY-AMENDMENTS.md` entry "Feature-driven specs have no author for cross-cutting IA/design/layout."
