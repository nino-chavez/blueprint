# Three-pass research discipline for platform-feature initiatives

**Status: canonical (wave 74).**

## The gap this closes

Platform-feature research commonly stops after two passes — Pass 1 produces "what exists" (current state), and Pass 2 produces "what needs to be true" (option space via architect challenge). This yields the right shape (enumeration + recommendation), but misses scope-disguising classifications. A candidate can satisfy Pass 1 (real gap exists) and Pass 2 (would be true if platform changed) while actually representing a **federation initiative** (spanning multiple bounded contexts), a **behavior-ownership question** (not a platform ask), or **pure-application work** disguised as a shim. Without Pass 3, the recommendation ships with its highest-leverage item misclassified.

## The principle

After the architect challenge produces an option space (Pass 2), re-test each candidate against eight architectural principles. Candidates that fail the re-test are reclassified as native work, application work, or compound initiatives requiring further decomposition. This pass catches classifications that mask scope.

## Pass 3: the eight architectural-principles re-test

Walk each platform-ask candidate through these tests:

1. **Single bounded context** — The candidate extends a single service boundary, not a federation spanning multiple. If it requires changes across N independent contexts, it is a multi-bounded-context initiative, not a shim.
2. **Existing extension pattern** — The candidate uses an existing BC platform extension point (webhooks, app extensions, MES event topics, etc.) rather than asking for a new surface type. Reuse patterns generalize; new surface types require platform ratification.
3. **Single source of truth** — Platform owns exactly one definition; the app sits inside. If the app and platform must both own a definition and stay in sync, it is a behavior-ownership question, not a shim.
4. **Data, not behavior** — The candidate extends data surfaces (event payloads, API response fields, schema columns), not behavioral rules. If the platform must execute logic that interprets the app's domain, it is behavior-ownership.
5. **Public-goods benefit** — The candidate solves a problem for any marketplace app, not uniquely for us. If only one app benefits, it is application work, not platform work.
6. **Doesn't implicitly anoint our domain** — Platform asks are named after general mechanisms (events, contexts, templates), not after consuming app domains (subscription.*, loyalty.*, reviews.*). See `back-door-native-anti-pattern.md` for reframing.
7. **Forward-compatibility** — The candidate does not conflict with known platform roadmap. Candidates that would break future platform features are reclassified as waiting-on-platform.
8. **Reversibility** — The candidate can be cleanly deprecated if usage does not materialize. If the platform is permanently committed once the surface exists, the cost is permanent, not option-like.

### Worked examples from bc-subscriptions

See `docs/feasibility/platform-shims.md` § C (four misclassified-as-shim native reclassifications) and § D (two misclassified-as-shim pure-app items). The headline example: B2B Edition federated identity was initially classified as "the highest-leverage single shim" — Pass 3 caught that it spans three bounded contexts (storefront, admin, B2B Edition) and actually requires a federation initiative, not a shim.

## Applicability

**Required for**: Any platform-feature initiative producing platform-side asks (greenfield marketplace-app projects producing a shim-lane strategy). Applies at Stage 2 → Stage 3 gate (required before option enumeration goes to stakeholder review).

**Tier**: T2 default (standard). T3 escalates to reviewing all failing-Pass-3 candidates for ADR-level decisions (federation initiatives, behavior-ownership questions are policy calls, not just classification calls).

## What this is, in one line

Pass 3 re-tests Pass-2 option candidates against eight architectural principles to surface scope-disguising classifications (federation initiatives, behavior-ownership questions, pure-app work) before stakeholder review.
