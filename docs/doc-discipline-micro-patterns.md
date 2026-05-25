# Doc Discipline Micro-Patterns

**Purpose:** Capture small disciplines that are individually too compact for their own pattern doc but together form a useful collection. Each is a one-paragraph rule with a trigger condition and a worked example.

**Last updated:** 2026-05-16

**Source:** `bc-subscriptions` doc-reorg session (May 2026). Several emerged during the inventory pass and the [Spec] drafting; rather than padding each into a full pattern doc, captured here as micro-patterns.

---

## 1. Surface-existing-discipline before inventing new

**Rule:** When assessing a surface for a new convention, grep for the same idea already present in inconsistent form before designing something new. Lift the existing shape to a convention. Cheaper, less resistance, more likely to stick.

**Why:** A team that's already been doing X-but-inconsistently has internalized X's value. Formalizing what they're already trying to do reads as ratification, not imposition. Inventing a new mechanism reads as "the agent thinks they know better than us."

**Trigger:** Before proposing any new convention (frontmatter format, naming pattern, dir structure, registry shape), spend 5 minutes searching the existing surface for the same idea applied unevenly.

**Worked example:** `bc-subscriptions` doc reorg surfaced `canonical: true|false` frontmatter in 5 existing files (`_state.md`, `design_principles.md`, `differentiators.md`, `trust-restoration-lessons.md`, `day-0-bc-payments-beta-api.md`) — used unevenly. Lifting this to a project-wide lint-enforced convention was cheaper than designing a new classification mechanism, and reads to reviewers as "we're formalizing what we already do."

---

## 2. Capture ambiguity via secondary tags, not forced coin-flips

**Rule:** When primary classification has borderline cases, don't force a coin-flip — add a secondary tag that captures the ambiguity. Future readers (human or agent) see the borderline status explicitly and can re-decide with more context.

**Why:** Forced classification at the moment of borderline cases produces brittle assignments — the next session that touches the file may re-classify the other way, creating churn. Secondary tags say "I see this is borderline; here's the dimension on which it could go either way."

**Trigger:** Any taxonomy/classification work where some items genuinely span two buckets.

**Worked example:** `bc-subscriptions` 6-bucket doc taxonomy uses primary class (one of 6 buckets) + optional secondary tags: `→ invalidated-path-candidate`, `← divergent-with(<other-path>)`, `<phase>-closeout`. A handoff dossier whose task is in-flight-but-near-completion gets primary `decision-lineage` + secondary `→ ephemeral-when-shipped` rather than being forced into one bucket prematurely.

---

## 3. Wrong-copy-is-signal — divergence is data

**Rule:** When reconciling divergent docs (same information in multiple places with drift), the divergence itself is signal. The "wrong" copy is often closer to a true requirement the canonical missed. Reconcile divergence first; don't reflex-delete the off-canonical copy.

**Why:** Drift between copies usually happens because one author hit a requirement edge case that the other didn't. Treating the divergence as a bug to delete loses the requirement. Treating it as a question to investigate finds the missing requirement.

**Trigger:** Any duplicate / divergent classification during inventory work.

**Worked example:** `bc-subscriptions` README.md said "separate delivery repos per surface" while project memory said "one-repo strategy via synthesis #525." The divergence wasn't drift — it was the moment of the pivot, with the README not yet updated. Reflex-deleting the README line would have removed evidence of the pivot. Reconciling first (read both, identify the moment of divergence, update README to match the synthesis decision, add an invalidated-paths entry for the rejected approach) preserved the lineage.

---

## 4. Avoid multi-role template files

**Rule:** Any template file shipped in a project scaffold should declare its single primary doc-role (canonical-present, decision-lineage, ephemeral-artifact, derived-mechanical). A template file that mixes ≥2 roles will propagate drift to every downstream project that uses the template.

**Why:** Templates get stamped into many projects. Each project then inherits the role-confusion. A `STATE.md` template that holds "Current Status" + "Key Decisions" + "Active Blockers" + "Session Log" forces every downstream project to either (a) maintain four hand-tracked sections, (b) drift across the four, or (c) duplicate content with ADRs / hive substrate. All three failure modes happen.

**Trigger:** Before shipping a new template file in a template scaffold, classify its primary role using the 6-bucket taxonomy. If two roles fit, split into two template files.

**Worked example:** `bc-subscriptions` STATE.md (added per blueprint retrofit) mixed decision register (D-01..D-17, duplicates ADRs) + session state ("Next Steps") + blocker tracking. Filed for retirement in Hive #929 with the rows split: ADR-eligible rows → ADRs; reframe rows → invalidated-paths entries; session state → derived from hive board + `_state.json`. The template version (in blueprint) was refactored with tiered guidance so the multi-role failure doesn't propagate to other downstream projects.

---

## 5. Memory entries point at proposals, not duplicate them

**Rule:** When filing a foundational `[Spec]` or major decision, save a memory entry that **points at** the proposal — not one that duplicates the proposal's content. The memory entry's job is to make the proposal findable from a fresh session, not to be a parallel source of truth.

**Why:** Duplicating proposal content into memory creates two copies that drift. Pointing-only keeps the proposal as the single source. The memory entry says "go look at #NNN before proposing X" — that's enough.

**Trigger:** Every foundational `[Spec]` filing. Routine `[Decision-Fast]` decisions don't need memory entries; only the ones future sessions might re-propose against.

**Worked example:** `bc-subscriptions` `doc-reorg-in-flight.md` memory entry (2026-05-16) points at Hive #929 and names specific things future sessions might re-propose (new STATE.md-style register, "previously we thought X" hedges, 5th separate traceability count, moving to `spec/` subdir, splitting invalidated-paths). The entry is ~20 lines; the proposal is ~5000 words. The memory's job is the trigger, not the content.

---

## 6. Trigger-to-revisit on anchored forks

**Rule:** When anchoring a fork via `[Decision-Fast]` rather than punting to synthesis, the decision body must include an explicit trigger-to-revisit — the condition under which the anchored choice should be reopened. Without it, anchored decisions silently calcify and future agents either follow them past their useful life or silently re-litigate.

**Why:** Anchored forks save synthesis cycles, but anchored-without-trigger creates the worst kind of fossilized decision: it looks ratified but lacks the conditions under which it was the right call. Future agents either obey it past its expiry or quietly relitigate, neither good.

**Trigger:** Every `[Decision-Fast]` that resolves a fork (vs an emergent decision).

**Worked example:** `bc-subscriptions` decision `ade0ccd5` anchors two doc-reorg forks (stay-at-root, single-file register) with explicit triggers: "Either fork should be reopened if: (1) root surface grows past ~20 top-level `*.md` files, (2) invalidated-paths register grows past ~50 entries, (3) spec-vs-canon separation pain shows up in concrete reviewer/onboarding complaints. Until then, these anchors stand. File new `[Spec]` to revisit; do not silently relitigate."

---

## When to apply each

| Micro-pattern | Activates when |
|---|---|
| Surface-existing-discipline | Before proposing a new project convention |
| Capture-ambiguity-via-secondary-tags | Doing any classification work with ≥1 borderline case |
| Wrong-copy-is-signal | Reconciling divergent docs |
| Avoid multi-role template files | Shipping a new template file in a scaffold |
| Memory entries point at proposals | Filing a foundational `[Spec]` or major decision |
| Trigger-to-revisit on anchored forks | Logging any `[Decision-Fast]` that resolves a fork |

## Origin

Patterns surfaced during `bc-subscriptions` Hive #929 doc-reorg session (2026-05-16). Captured here rather than expanded into individual pattern docs because each is too compact to justify standalone treatment.
