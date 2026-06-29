# UI-Rendering-Contract Tier — spec the non-happy-path, or ship it by accident

**Status: single-initiative (subs-initiative, 2026-06-29) — promotion candidate.** This is a spec-authoring discipline, promotion-ready as a pattern now; the portable lint engine that enforces it stays consumer-local until a second initiative builds it. It is one obligation class of [`proof-obligation-registry-pattern.md`](proof-obligation-registry-pattern.md) (each UI state is a "did we render X correctly? prove it" obligation) and it supplies the G1 material the [`dod-verification-ladder-pattern.md`](dod-verification-ladder-pattern.md) cannot evaluate when it was never authored.

## The gap class

A story template that specifies system state transitions and a happy-path acceptance criterion has **no place to say what the user sees when the system is not on the happy path** — loading, error, empty, every non-happy-path domain status, and keyboard/focus behavior. So the implementer authors that contract *at implementation time*, silently, with no gate. The result is plausible-looking, user-hostile UX that passes every existing check:

- A `past_due` subscription renders a red badge with **zero action affordance** — the user is stranded with no path to fix the thing the badge is warning them about.
- A country field is a raw 2-character text input — the user must know `GB`, not `UK`.
- A mutation form has no error branch — a rejected API call leaves a permanent spinner.
- A custom expand/collapse control is a `<div onClick>` with no `role`/`tabIndex` — keyboard users cannot reach the actions inside it.

None of these are caught by the DoD ladder (G1 answers "yes" for *"user can view subscriptions"* — a real AC exists; it answers "not applicable" for *"past_due renders an update-PM CTA"* because **that AC was never written**, and G2–G5 are all downstream of G1). None are caught by a prototype→production traceability sweep (it walks the surfaces that exist; absence is invisible). None are caught by a behavioral scenario (it tests that cancel *succeeds*, not that the DOM is keyboard-reachable). **The gap is *before* every one of these checks has material to evaluate.**

## Why it is a spec-tier cause, not a framework one (the inverse-profile proof)

When the subs-initiative swept three design languages, the gap appeared in all of them with an **inverse profile**:

- A framework with **no** baked-in state rendering (hand-rolled Svelte/Tailwind) → error and edge-status are the most-missing states.
- A framework that **does** bake in error/badge rendering (a component library) → those states are covered, and the silence shows through exactly where the library does *not* help: **loading, focus, keyboard-reachability**.

Same gap, complementary symptoms. A component library masks the gap on the states it auto-provides and exposes it on the ones it does not. The contract tier is what forces the floor **regardless of framework** — which is why it belongs in the spec, not in a lint that pattern-matches one framework's idioms. (The lone full-coverage surface in the sweep was the same framework and same author as the broken ones — proof the floor is *author-dependent*, i.e. a missing template, not an impossible bar.)

## The contract: a `ui-states` block, required on every UI-surface story

Add a **visible** `**UI states.**` section to the story template (visible, not an HTML comment — the designer/implementer must *see* the contract; the lint parses the fence). It carries the 6-state matrix:

```yaml
ui_states:
  surface: <route | component>
  idle:        { render: <at-rest>, primary_action: <happy CTA> }
  inputs:                                   # form surfaces only — kills raw-text-for-enumerable-domain
    - { field: <name>, control: <select|radio|date|text|hosted>, allowed_values: <source of truth> }
  loading:     { trigger: <call>, render: <skeleton; submit disabled; no double-submit> }
  error:       { surfaced_at: <inline, NOT a vanishing toast>, render: <copy>, recovery: <retry CTA> }
  empty:       { render: <copy>, cta: <next action — never blank> }
  edge_status:                              # every non-happy-path domain status THIS surface renders
    - { status: <domain status>, badge: <label>, affordance: <REQUIRED — never a dead-end badge> }
  disabled_focus:                           # keyboard reachability + focus management
    keyboard:   <reachable in N steps; tab order; NO div-onClick dead-ends>
    focus_move: <focus enters opened panel; returns to trigger on close>
    guard:      <no accidental destructive action; typed-confirm only>
  closes:                                   # binds a state to a render assertion (see Enforcement)
    edge_status.past_due: render:portalDetail#pastDueShowsUpdatePmCta
```

`edge_status` is **surface-appropriate, never a fixed enum list** — a wizard carries `draft`/`step-invalid`, a dashboard carries `loading`/`empty`-heavy states, a form carries validation edges. The invariant is *every entry has an `affordance`*, never *"must contain past_due."*

**Trigger predicate** — a story is in the `ui-states` universe iff its persona is a human actor (Subscriber / Merchant / Support-Ops / CS-Rep / Buyer / etc.). System-only and Developer-only personas are exempt. This is the partition that separates UI-surface stories from backend/webhook stories without a manual list.

## Enforcement — extend the body-descending completeness lint; do NOT build a new reviewer

The host is whatever completeness lint **descends into the story body** (the "one grain below the AC" lint — instance-1 of the proof-obligation registry). The `ui-states` rule is an additive fenced-yaml parser + closure binding on that engine. Three reasons it is not a new bespoke DOM/ARIA reviewer: a new reviewer forks the closure machinery and the AC↔scenario join the project already owns; a grep-for-ARIA reviewer is framework-coupled (it would miss the inverse-profile gaps in a component-library app); and minimum-complexity says reuse the proven block-parser + WARN/ERROR format-on-touch rollout.

The MVP rule is **content-aware, not key-presence** — key-presence alone passes a story that hand-waves the highest-density gap. ERROR on:

1. any `edge_status` entry with empty/missing `affordance` (the dead-end guard — the `past_due` defect directly);
2. `error` missing `surfaced_at` or `recovery` (the vanishing-toast guard);
3. an `inputs` field over an enumerable domain typed `control: text` with no `allowed_values` (the raw-enum-input guard);
4. `disabled_focus` on a surface with custom (non-native) controls unless `keyboard` names a concrete reachability assertion (see the harness note — this is where the gap is largest and key-presence enforcement is weakest).

Rollout is **format-on-touch**: a story *with* the block is ERROR on any defect; a story *without* it is WARN (a `--strict` flag promotes). Same machinery a project already runs for any other body-grain backlog.

## The harness reality you must not hand-wave

Binding a state to a passing render assertion (`closes: render:<page-object#method>`) is cheap **for the states your existing component/e2e tier already asserts** — badge visibility, `getByRole` presence, empty/error copy. It is **not free for two of them**, and pretending otherwise ships an enforcement tier that mechanically passes on the easy cases while the real defects stay un-queued:

- **Focus-mgmt / keyboard.** Presence assertions (`getByRole`) do *not* assert focus movement, tab order, or the keyboard-reachability of `div-onClick` controls. This is typically the *most-missing* state and the *least-tooled* one. You must build the capability: Playwright `keyboard.press('Tab')` sequencing + `:focus` checks, or axe-core for the dead-end class. Own it explicitly in the plan.
- **Component-level inline panels.** A `page.goto` harness only reaches route-mounted components. Inline panels rendered inside a parent need a component-mount tier (testing-library/framework) or must be driven through their parent route. Decide per surface; do not assume route-harness reach.

Keep the binding rail minimal: bind to the *existing* component/e2e tier. Do **not** put a net-new scenario/demo render-state rail on the critical path — its only marginal value is keeping demo tours in sync, which does not justify foundation-tier cost.

## Retrofix recipe for an existing project

1. **Partition** stories by the persona predicate → the UI-surface universe (the denominator).
2. **Land the lint in WARN** + the `ui-states` block schema + an authoring guide. One PR, no behavior change.
3. **Prove the loop on a genuinely broken surface** (not an already-fixed one — verify in the working tree which is which): author its `ui-states` block, add one render assertion that is RED before the fix and GREEN after, fix it. This retires a real defect and exercises schema + harness + lint end-to-end before scaling.
4. **Author top-down by severity**, format-on-touch. A red render assertion is the confirmed work item — do not pre-triage built-vs-unbuilt from presence/tag proxies (the gate-ladder-is-the-queue discipline). Authoring the assertion *is* the enumeration; a separate big-bang manual audit duplicates it and goes stale.
5. **Reconcile duplicate surfaces first.** Two routes rendering the same domain object with divergent state coverage will get the same contract specced twice on diverging code — pick the canonical one before authoring.

## Authoring discipline (the promotion-gate lesson)

This pattern was first captured from a **single** surface's audit, and that single-slice version got two things materially wrong (it scoped the gap to one surface; it proposed a new reviewer) and missed the hardest finding (focus-mgmt). All three corrections fell out of a breadth pass across the other design languages and the enforcement substrate. **An amendment scoped from one slice must be re-grounded by a deliberate breadth pass before it is promoted into a template** — otherwise the slice's framing and its tooling blind spots are inherited by every project that adopts it. That breadth pass is the difference between a pattern and a parochial habit.

## Relationship to existing patterns

- [`dod-verification-ladder-pattern.md`](dod-verification-ladder-pattern.md) — the `ui-states` block is **G1 material**. The ladder is an honest oracle; it cannot evaluate an edge-state contract that was never authored. This pattern is what makes the non-happy-path states *exist* as G1 claims the ladder can then drive to G2/G4.
- [`proof-obligation-registry-pattern.md`](proof-obligation-registry-pattern.md) — each `ui-states` entry is one obligation (`claim: this state renders correctly → universe: the status enum / the 6-state matrix → oracle: a render assertion → freshness: as-of-commit`). The trigger-predicate partition is the obligation's universe-source.
- The single-slice→breadth-pass discipline above is the amendment-process analogue of the registry's **rigged-denominator** failure axis: a faithful capture of too-narrow a universe.
