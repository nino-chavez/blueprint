# Definition-of-Done Verification Ladder

**Status: spec-side (wave 52).** Instance 1 — the `blueprint-example` consumer — is standing up the mechanical implementation now; its ratified design gets upstreamed in a follow-up wave per the proof-first discipline (same sequencing as the Mom Test wave: spec first, mechanics after a live initiative proves the shape).

## The principle: a presence oracle is not a function oracle

`tools/state-derive` answers one question well: **do the expected code artifacts exist?** Every check primitive it ships is static — `file_exists`, `grep_present`/`grep_absent`/`grep_count`, `schema_has_table`/`schema_has_column`, `commit_message_grep`. None of them execute code, hit an endpoint, or assert that a test passed.

That makes `COMPLIANT` a **presence** verdict, not a **function** verdict. The failure mode this distinction prevents (observed on blueprint-example, 2026-06-10): a storefront widget injector emitted `<blueprint-example-widget>` while the PDP renderer read `[data-bcs-widget]`. Both files existed, both checks matched, the capability read COMPLIANT — and the feature was broken. Presence checks can never catch a seam bug, because seam bugs live in *behavior between* artifacts that each individually exist.

The bug isn't state-derive — it does exactly what it claims. The bug is **authority bleed**: a presence register gets enshrined as "the implementation-state authority," and "present" quietly starts meaning "built and working." Once a portal tile, a roadmap, or a stakeholder doc renders COMPLIANT as "shipped," the conflation is institutional.

## The five gates

For every acceptance criterion of every story, "done" decomposes into five mechanically answerable gates:

| Gate | Question | Oracle |
|---|---|---|
| **G1 spec** | Is the AC written in the spec corpus? | Traceability registry (BRD/PRD parse) |
| **G2 prototype** | Does a prototype screen exist for it? | Traceability `prototypePages` join |
| **G3 presence** | Are the expected code artifacts present? | `state-derive` (its ceiling — all it can ever assert) |
| **G4 behavior** | Does a runnable scenario exist **and pass**? | Behavioral layer: test-results evidence, not test-file presence |
| **G5 live** | Is it green against the deployed app + live environment? | Live E2E run — or an explicit `blocked-pending-external` marker |

Rules that make the ladder honest:

- **Monotone claims.** A gate cannot be claimed without the gates below it. "G4 green" with no G3 evidence is a register bug, not a feature state.
- **`blocked-pending-external` is a first-class state, not a gap.** "We haven't built it" and "it's blocked on a partner/vendor/beta" must render differently — collapsing them either hides real gaps or punishes teams for externalities. Blocked items carry a pointer to the blocking artifact (ticket, partner-track ID) and which gates remain testable despite the block.
- **One re-derivable register.** All five gates surface in a single mechanically regenerated view (the traceability registry is the natural host — it already joins G1–G3). Hand-maintained DoD spreadsheets are the thing this pattern exists to kill.
- **Derive-on-main, never hand-commit.** The register refreshes via CI on every push to the main/dev branch (the `derive-state-on-main` pattern in `docs/patterns/traceability-state-join-pattern.md` § Operationalizing). Derived outputs are automation-owned; a gate blocks hand commits.
- **Gate-honest language everywhere the register is rendered.** Surfaces consuming `_state.json` label COMPLIANT as *present* (G3), never *shipped/implemented/done*. "Done" is reserved for G4/G5.
- **The register surfaces the coverage gap; it does not assume coverage.** Per-AC scenario authoring is usually the bulk of the work. A DoD register whose G4 column is mostly empty is functioning correctly — it is the work queue.

## Design decisions delegated to instance 1

These are open until blueprint-example ratifies its design (Hive [Decision] + ADR); do not pre-build them in the template:

1. **Behavioral primitive vs sibling tool.** A `scenario_passes`-style check primitive inside state-derive (reading a CI-produced test-results artifact — keeps the tool deterministic and zero-dep, since it parses evidence rather than executing tests) vs a sibling `behavior-derive` tool joined downstream. Either way, the oracle is *recorded results*, not inline execution.
2. **Per-AC ↔ scenario linkage** in the traceability registry (candidate fields: `acVerified`, `scenarioStatus`) and the join-key contract that keeps it drift-resistant — the same discipline as the `BRD.md §US-X.Y:` reference prefix in `docs/patterns/traceability-state-join-pattern.md`.
3. **Blocked-external modeling** — where the marker lives (catalog field vs registry annotation) and how it expires.
4. **Drift resistance** — how the DoD checks avoid the catalog-drift failure mode (the subscriptions-initiative reconciliation found ~90% of one register's RED flags were drift, not regressions). Candidate: the defrag/doc-currency cadence treats the catalog itself as an audited surface.

## What changed spec-side in wave 52 (already true)

- `state-derive` README + status table state the presence-oracle ceiling explicitly; `scenario-coverage` category documentation no longer implies a passing test.
- `docs/patterns/traceability-state-join-pattern.md` relabels its `implementationStatus` join as a G3 (presence) signal.
- `METHODOLOGY.md` no longer describes the state overlay as a check "against reality."

## Upstreaming contract

Instance 1 files its findings via `METHODOLOGY-AMENDMENTS.md` (see `methodology-amendments-convention.md`). The promotion wave then ships: the behavioral primitive (or sibling tool), the registry join fields, the derive-on-main + scenario-status workflows in the stamper, and — if the second-instance rule is met — a reviewer that flags gate-dishonest language on register-consuming surfaces.
