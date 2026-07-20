# Executed falsification — experimental validator over real specimens and real negative fixtures

**Date:** 2026-07-20
**Status:** the executed pass Codex round 4 correctly demanded. `05-specimen-walk.md`'s "receipts exercised by hand" was a design walk, not falsification — three of four seeded failures were comments demonstrating expected rules, not fixtures a validator rejected. This run replaces that claim with machine output.

## What ran

- **Validator:** `validator/validate.mjs` (~180 lines, node + the repo's existing `yaml` package; deliberately outside `template/` — research artifact, not the wave implementation).
- **Rules implemented (all eight from Codex's checklist):** R1 serves-references resolve · R2 output lifecycle + unserved/pending outcomes · R3 `recipient-safe` ⇒ allowlist + denylist + leakage lint + human issuance · R4 receipt grade cannot exceed provenance · R5 human outcomes cannot be proven served by agent-only proof · R6 typed preconditions (ordering enforceable) · R7 account/artifact/config paths resolve on disk when lifecycle requires · R8 legacy/new schema routing.
- **Path resolution is real:** specimen roots resolve via gitignored `specimens/roots.local.yml`; account paths, artifacts, and evidence sources are `stat`'d on the actual consumer repos.

## Results

| File | Expected | Got | Detail |
|---|---|---|---|
| specimens/film-room.yml | PASS | PASS | 2 warns: recovery-brief + boot-packet are `planned` → maintainer/agent outcomes PENDING, not green |
| specimens/blueprint-self.yml | PASS | PASS | 0 warns; product-site carries `human_validation: FAILING` honestly |
| specimens/se-docs-frontdoor.yml | PASS | PASS | 3 warns: slack-frontdoor planned; deflection-baseline precondition unmet (blocks go-live) |
| specimens/bc-subscriptions.yml | PASS | PASS | 1 warn: build-hire-buy served only by `decision-comparison(planned)` — PENDING |
| fixtures/film-room-clearance-leak.yml | FAIL | FAIL | 4× R3: cite-mode under recipient-safe + missing denylist/lint/issuance |
| fixtures/blueprint-self-grade-upgrade.yml | FAIL | FAIL | R4: `persona-walk-agent` provenance claiming `human_validation: passed` |
| fixtures/se-docs-missing-baseline.yml | FAIL | FAIL | R6: precondition unmet while blocked output `issued`; + R7: dangling `config_source` |
| fixtures/bc-subs-unserved-outcome.yml | FAIL | FAIL | R2: `unserved outcome: cfo-coo.build-hire-buy` — the true historical state |
| fixtures/dual-declaration.yml | FAIL | FAIL | R8: both schemas declared |
| fixtures/legacy-only.yml | PASS | PASS | R8 warn: routed to legacy reviewers, new rules skipped |

Dead-code check (ad-hoc mutation, not committed): reintroducing the original `filmroom.sqlite` transcription error trips R7 (`account.state does not resolve`), and giving a human outcome a `cold-agent` target proof trips R5. No implemented rule is unexercised.

## Codex round-4 findings, dispositions

1. **"Three of four seeded failures are comments"** — conceded; all four are now standalone fixture files a validator actually rejects (plus routing fixtures).
2. **SE baseline not mechanically expressible** — conceded and fixed: `freshness: baseline-before-golive` (open-vocabulary label) replaced with a typed precondition (`artifact` + `assertion: exists` + `blocks:`). Principle adopted into `04`: open vocabulary for human outcomes, typed assertions for mechanical assurances.
3. **Output lifecycle gap** — conceded and fixed: `status: planned | draft | ready | issued | retired`; only ready/issued serve an outcome; planned-only service reports PENDING. Film-room's recovery-brief/boot-packet and se-docs' slack-frontdoor are now honestly `planned`, and the validator says so instead of showing green.
4. **Human outcomes proven by cold-agent** — conceded and fixed schema-wide: `proof` now carries `target` (+ optional `interim`); "reader served" only ever from the target grade; the interim-grade question is resolved now, not deferred to the ADR.
5. **`filmroom.sqlite` factual error** — conceded (actual file is `data/filmroom.db`). Codex is right that it contradicted "mapped cleanly from real facts" — and it is exactly the error class R7 now catches mechanically, which is the strongest argument that path resolution belongs in the validator, not in an author's memory.

## Sanitization note

The original specimens introduced stakeholder first names, vendor names, and the employer domain into this public repo — violations of the standing sanitization rule (the `bc-subscriptions` codename itself is already public in 23 tracked mentions, so the filename stands). Rewritten specimens carry roles only; machine-local paths moved to gitignored `roots.local.yml`.

**Round 5 (Codex) caught the incomplete sweep:** the counterparty's name and one vendor name remained across `00`–`05` and the film-room specimen's resolvable demand path. Fixed: prose now says `pilot-club` / `the GSI estimator`; sensitive real paths resolve through `local:<key>` indirection in the gitignored roots map (an unmapped key is a validator ERROR, not a silent skip — verified). The public package now contains zero counterparty-identifying strings.

## Production acceptance criteria (Codex round 5 — adopted; ADR/build-order requirements, not architecture reopeners)

1. **Lint vs readiness:** the production CLI reports three states — `PASS` (valid + required outcomes served), `PENDING` (structurally valid; planned outputs or unmet receipts remain), `BLOCKED` (invalid/unsafe/stale/contradictory). A stage transition must never treat PENDING as green; the experimental validator's exit-0-on-warns is lint semantics only.
2. **Recipient safety is evidentiary, not declarative:** production must validate selector-level allowlists, require `as_of` and destination policy, actually execute the leakage lint, and verify a recorded issuance attestation — distinguishing "configured to be checked" from "recipient-safe proven."
3. **Structured receipts:** grade, validator/observer, timestamp, source/output version, result, evidence location, expiry — no string-sniffed provenance (the experimental `grade()` heuristic is a prototype shortcut, spoofable by naming).
4. **Legacy routing invokes the legacy reviewers**, not just a warn.
5. **Gate mode requires resolvable roots:** missing root mapping blocks (or uses a portable locator); skipped path validation can never produce green readiness.

## Verdict

Candidate B's falsification pass is now **executed, not simulated**: four specimens pass, five invalid fixtures fail on the exact named rules, the legacy-only fixture passes with a deprecation/routing warn, and the two schema gaps the specimens couldn't express (lifecycle, typed preconditions) are closed. Codex reran the suite independently and confirmed the results (round 5). Candidate B is ready for the ADR, wave design, and build order — pending the operator's four ratification calls in `04`, with Codex's recommended dispositions on record (ratify B; `actors:`; accept measured floor; four-consumer first wave).
