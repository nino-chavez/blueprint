# Definition-of-Done Verification Ladder

**Status: mechanical half ratified (wave 62).** Wave 52 shipped the spec side; instance 1 — the `blueprint-example` consumer — built the mechanical implementation, ratified the four delegated design decisions, and ran the ladder at scale across a real backlog. This doc now carries both halves: the principle + five gates (wave 52) and the resolved mechanical realization + verification discipline (wave 62). The check-primitive *code* — `scenario_passes` + the normalizer — shipped into `template/tools/` in **wave 63** (see § The mechanical half → Engine lift).

> **Generalized (2026-06-25, subs-initiative).** The five gates below are five **fixed** proof obligations. A real spec makes more claims than that, at finer grain (e.g. "did every normative requirement *inside* a story get verified, not just its ACs?"). The general form — register N obligations in one table, of which these five are rows — is [`proof-obligation-registry-pattern.md`](proof-obligation-registry-pattern.md). This doc's own note that "G4-green ≠ fully tested … recursed one gate up" is that pattern's starting point. Read this for the canonical five-gate spine; read the registry pattern to extend it.

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
- **`G4`-green ≠ fully tested.** G4 is satisfied by *at least one* passing behavioral scenario — it is NOT "the full test pyramid is present." A 100%-green G4 register can sit on a hollow pyramid (every AC covered by one thin scenario, zero E2E/BDD/unit depth). Reading "G4 verified" as "fully tested" is the same authority-bleed this ladder kills (presence read as function), recursed one gate up. Two companion controls in `test-discipline-pattern.md` address it: the **preventive** build-stage contract (the test is a gated co-deliverable of the code, sourced from the spec) and the **detective** per-AC × per-test-type coverage matrix.

## The four design decisions — resolved by instance 1 (wave 62)

Instance 1 ratified the design (its [Decision] + ADR) and built the mechanical half. The four delegated decisions resolved as:

1. **Behavioral oracle → a `scenario_passes` check primitive INSIDE state-derive** (not a sibling tool). It parses a CI-produced normalized results artifact (`_scenario-results.json`), keyed by AC id. This keeps ONE register, reuses derive-on-main, and stays deterministic + zero-dep — it reads *recorded evidence*, never executes tests. **Fail-safe contract: artifact absent / unparseable / stale (`as_of_commit != HEAD`) / no run for the AC / only-skipped → `unknown` → MANUAL_REVIEW; any `failed` run → NON-COMPLIANT; ≥1 `passed` + 0 `failed` → COMPLIANT.** A missing scenario can never read as a passing one. The staleness guard (`as_of_commit == HEAD`) is load-bearing: results from a prior commit are not evidence for current code. *Rejected:* a sibling `behavior-derive` tool (a second derive + join is more drift surface and violates the one-register rule).
2. **Per-AC ↔ scenario linkage → an AC-keyed `behavior-gate` capability category, NOT retrofitted scenario-coverage caps.** This is the load-bearing correction the design didn't anticipate: `scenario_passes` filters recorded runs by AC, and the AC↔scenario relation is **many-to-many** (one AC cited by several scenarios with mixed pass/fail; one scenario citing several ACs). Keying a *scenario-centric* cap by its primary AC false-reds a passing scenario that shares an AC with a failing one. So G4 gets its **own cap set, keyed by AC** (`g4-<story>-<ac>`, each deriving one `scenario_passes` check); the scenario-*coverage* caps stay G3 ("scenario authored"). The prose `§story.ac` references in test titles are formalized into machine-readable tags (an `acs: [...]` field on programmatic scenarios, `@ac:` tags on Gherkin) that the normalizer prefers over title-parsing; an **orphan-tag lint** fails any tag resolving to no real cap/story id (the join key is the contract).
3. **Blocked-external → a catalog field** (`blocked_external: { reason, blocking_ref, gates_blocked, gates_testable, review_when }`), rendered as a distinct `BLOCKED-EXTERNAL` state — not COMPLIANT, not RED, not a gap. A `review_when` staleness check prevents a block from becoming a permanent silent excuse. *Rejected:* a transient registry annotation (the block is intrinsic to the capability, so it belongs at source).
4. **Drift resistance → three mechanisms.** (a) Schema-backed caps MUST use `schema_has_table`/`schema_has_column` against the consolidated baseline, never `file_exists` on a numbered migration (a reconciliation found ~90% of one register's RED flags were *drift*, not regressions). (b) A catalog-currency lint flags any `file_exists`/`grep` check whose path no longer exists — the catalog is treated as an audited surface. (c) The #2 orphan-tag lint guards scenario↔AC linkage drift.

## What changed spec-side in wave 52 (already true)

- `state-derive` README + status table state the presence-oracle ceiling explicitly; `scenario-coverage` category documentation no longer implies a passing test.
- `docs/patterns/traceability-state-join-pattern.md` relabels its `implementationStatus` join as a G3 (presence) signal.
- `METHODOLOGY.md` no longer describes the state overlay as a check "against reality."

## The mechanical half (wave 62)

The resolutions above are the *design*. This section is what instance 1 BUILT and LEARNED running the ladder across a real backlog — the operational half. Three points correct or extend the design; the rest is hard-won discipline.

### Realization notes (what the build taught)

- **G4 lives in a dedicated `behavior-gate` category, one cap per AC** (decision #2). Adding the new cap status to the status union forces every status→style map on consuming surfaces to handle it — make those maps `Record<Status, …>` so the type checker enforces completeness. (Gotcha: a new cap status that isn't added to a dashboard's `Record<status,…>` map crashes the build. Rule: *adding a cap status requires updating all consuming status maps in the same change.*)
- **The normalizer is its own tool.** It turns each test runner's JSON reporter output into the `_scenario-results.json` contract, one run per AC a scenario cites (a scenario with no AC ref is keyed by its slug). It prefers the machine-readable `acs:`/`@ac:` tags; title-prose parsing is the drift-prone fallback.
- **Derive-time production, never commit the results file.** The derive-on-main job runs the scenario suite + normalizer **best-effort (continue-on-error)** *before* state-derive, stamping `as_of = HEAD` (so the staleness guard passes). The results file is **never committed** (not in the derive allowlist) → no new committed derived file re-introduces the derive-on-main rebase race. This satisfies "derive-on-main, never hand-commit" *without* the race a commit-the-file approach would cause.
- **Surface from the ONE register, never a second source.** G4/G5 render on the existing program/traceability surface (a gate-coverage view that reads the `behavior-gate` caps). An earlier attempt routed an epic rollup through a *second, unverifiable* datastore for the same data; it was demoted. The work-queue ordering (RED → backlog → verified) makes the surface the literal "what to do next." (G5's mechanical signal is the coarse *presence* of a live-run workflow — honestly labelled "presence, not pass-state"; deriving the live conclusion needs CI/Actions state, out of a presence tool's scope.)

### The operating model that makes it self-logging

`surface` (register, auto each release) → `log` (gate-coverage onto the work queue, auto via derive-on-main) → **`prioritize` (operator, a weekly ~5-min re-tier — the ONLY manual knob)** → `dispatch` (orchestrator, top-of-queue in priority order) → `verify` (per item, against the artifact). The operator never hand-checks for gaps; priority is the one human input.

### The verification discipline — 11 failure modes (guard every one in the dispatch brief)

When per-AC scenario authoring is parallelized across agents, the orchestrator holds ALL the judgment and must guard these. Every one was observed; each recurs.

1. **Code-inspection predictions are unreliable** — agents that can't run the suite predict per-AC status from reading code and are routinely wrong. ALWAYS verify the per-run artifact, never the agent's self-reported table.
2. **Assert-the-bug false-green** — an agent makes a known-gap AC "pass" by asserting the *current buggy* behavior and labelling it "honest RED." Tell: the assertion "breaks when the bug is fixed." A G4 scenario MUST assert the *required* behavior (pass = works / fail = honest-RED → cap NON-COMPLIANT). Forbid it explicitly.
3. **"CI green" ≠ scenarios pass** — the results job is non-blocking by design; a failing scenario still passes the job (so the register can carry an honest RED without blocking merges). Truth is the per-run artifact statuses, not the job conclusion.
4. **Invented-column / phantom-reference error** — a query referencing a column absent from the consolidated schema. CAN be a scenario bug OR a real product bug (if the bad reference is inside the invoked product code — see Present-but-broken). Grep the source to tell which.
5. **Crash-masquerading-as-honest-RED** — a seed/upstream crash (not the intended assertion) reds the AC for the wrong reason. Verify *which line* throws before documenting a gap.
6. **Path-filter + event lag** — source-only changes (and sometimes a PR synchronize) don't auto-fire the results workflow. Confirm a run exists for the PR HEAD; else dispatch it manually.
7. **FK-seed order** — seed FK-referenced rows in dependency order; watch for fixtures that hardcode a unique key (a second naive seed silently no-ops).
8. **Fake-coverage via presence assertion** (the G3-wearing-a-G4-label anti-pattern this ladder exists to kill). An agent asserts `expect(seededRow).toBeDefined()` — a row IT seeded — and calls it behavioral coverage; it passes verifying nothing. **Guard: every step must INVOKE a handler/service and assert the resulting STATE CHANGE, ideally with a CONTROL (the negative case behaves differently).**
9. **False-gap claim from not reading source** — an agent claims "X isn't implemented" → honest-RED, but X exists in a function it didn't read. **Guard: before accepting ANY honest-RED, grep the source to PROVE the behavior absent.**
10. **Secret-scanner false positives on TEST FIXTURES** (not just real secrets) — secret-*prefixed* literals and `…_key = '<long value>'` literals trip generic-key rules by identifier-proximity, not value entropy. Fix order: a computed/low-entropy non-prefixed value first; a scanner-ignore fingerprint only for genuine fixtures. Scanners scan the *introducing* commit across the PR range → squash/amend so no commit holds the literal.
11. **Mock/spy state bleed across steps of one scenario** (multi-step scenarios run as ONE test, so per-test setup/teardown doesn't fire between steps): (a) re-spying an already-mocked function keeps its prior call history, so "not called" assertions fail on a *sibling step's* call — clear the spy. (b) A global-scoped counter (e.g. a cross-tenant sweep's result count) is polluted by sibling scenarios sharing the in-process store — assert per-entity (`WHERE id = ?`), never the global count.

### Three strategic patterns the drain surfaced

- **The gate is the work-finder, not a scorecard.** Its purpose is to *surface what's missing*, and surfacing IS the path to feature-complete. G4 yield ≠ presence-count: backend epics (rule engines, transaction ops, workflows, compliance jobs) drain cleanly via an in-process harness; browser/UI-heavy epics overstate (only their server endpoints are harness-reachable); external-integration ACs are G5; static-absence ACs (e.g. "no card data in schema") are G3 grep, not G4. Don't dismiss a "low-yield" epic — cover what's reachable and surface the rest as honest G5/unbuilt gaps; that enumeration is the punch-list. A RED closes two ways: **fix the scenario** (scenario bug) OR **build the missing feature** (the honest-RED → reconciliation-ticket → build → flip-green loop).
- **Present-but-broken is the keystone payoff.** The highest-value finds are features that read G3-COMPLIANT but never worked — exactly the seam/behavior bugs presence-checks structurally cannot catch (instance 1 found a privacy data-export that crashed on every record, and an erasure path that crashed on an invalid constraint value — both COMPLIANT in the register, both broken). **A predicted-PASS that FAILs is OFTEN a real product bug, not a test error.** This is the concrete proof that presence ≠ function and the strongest single argument for the whole ladder.
- **Some REDs are spec conflicts to escalate, not code to write.** A RED can encode a BRD-vs-ADR or BRD-vs-schema conflict (a status enum that can't hold a required value without a high-risk migration → resolve by spec amendment, not a risky rebuild; a ratified data-lifecycle ADR that conflicts with a legal-retention requirement → escalate as a `[Decision]` for operator + legal). The orchestrator must distinguish *scenario bug* / *real product gap (build it)* / *spec conflict (escalate)* — and never autonomously resolve the third.

### Dispatch-brief hardening

Every G4-authoring brief pins the *required behavior per AC* (never "implement X"); the 11 guards verbatim; the harness template to mirror; the `acs:` join contract; "INVOKE the handler + assert the state change, with a control"; "grep to prove any claimed gap"; computed-not-literal test secrets; append-only catalog edits; never commit derived state. Model split: an execution agent for authoring-from-pinned-spec; the orchestrator holds all judgment — classification, verification, escalation.

### Catalog hygiene: `manual_review` is not a behavior gate

A failure mode that predates the ladder and lingers after adopting it: a **G3 presence cap** carrying `manual_review: true` (often with a "requires-browser" / "requires-runtime" note) to flag that "presence isn't the whole story." That conflates presence with behavior. A presence cap asserts *artifacts present* — full stop; whether the behavior works is **G4**, whether it's live is **G5**. Holding the presence cap at `MANUAL_REVIEW` to remember "the browser path is unverified" makes the cap do double duty as a behavior tracker, and it **understates built features** on every register-consuming surface (they read as "needs human review" when the artifacts are demonstrably present and the behavior is already G4-verified). Rule: **never use `manual_review` on a G3 presence cap to gate runtime/browser behavior** — author a G4 `behavior-gate` cap for the behavior and let the presence cap derive `COMPLIANT` for presence.

**Cleaning the drift safely — verify-by-derive.** Don't bulk-flip `manual_review:true → removed` to "make the register green" — that's the inverse of the trust-but-verify rule. Instead, for each candidate (a `manual_review` presence cap whose AC is already G4-`COMPLIANT`): remove the flag, **run the derive**, and keep the removal *only if the cap resolves `COMPLIANT`* (artifacts genuinely present → the flag was false). If it derives `NON-COMPLIANT`/`PARTIAL`, **revert** — that cap has real **path-drift** (its `file_exists`/`grep` targets moved/consolidated), a different problem; a false RED is worse than an honest `MANUAL_REVIEW`, so leave the flag and fix the derivation paths separately. The derive itself is the oracle that distinguishes "false flag" from "real drift" — never the agent's say-so. (Instance-1 audit: of 43 `manual_review` presence caps with a G4-verified AC, 29 were false flags cleanly removed; 14 were path-drift and correctly left flagged.)

### Engine lift (shipped — wave 63)

The check-primitive *code* now ships in the template: **`scenario_passes`** (`template/tools/state-derive/checks/scenario.ts`) wired into `runCheck`, the `unknown`→MANUAL_REVIEW fail-safe folded into `aggregateStatus` (backward-compatible — presence checks never set `unknown`, so static derivations are unchanged), the `ScenarioRun`/`ScenarioResults` contract + the `scenario_passes` `Check` variant in `types.ts`, and the **net-new normalizer** `template/tools/scenario-results/` (Jest/Vitest + Playwright reporter parsers → the artifact). Each ships a self-test per the template bar (`scenario.test.ts` 7 cases incl. the monotone + staleness guards; `scenario-results/index.test.ts` 7 cases). A consumer authoring G4 caps: add `behavior-gate` capabilities each deriving one `{ type: 'scenario_passes', ac }` check, run the suites → normalizer → `_scenario-results.json` in the derive-on-main job, and the register flips per the fail-safe contract.

## Upstreaming contract

Instance 1 files findings via `METHODOLOGY-AMENDMENTS.md` (see `methodology-amendments-convention.md`); the promotion wave reads those entries + the instance's ADR, not its commit history. The doc-half (this wave) ships the methodology; the engine-half (next wave) ships the behavioral primitive, the registry join fields, and the derive-on-main + scenario-status workflow wiring. A reviewer that flags gate-dishonest language on register-consuming surfaces remains a second-instance candidate.
