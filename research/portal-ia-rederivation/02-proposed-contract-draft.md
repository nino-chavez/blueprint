# Proposed replacement contract — reader manifest + artifact classes

**Date:** 2026-07-20
**Status:** DRAFT FOR TEAR-APART — not a decision. Becomes a `decisions/` ADR + wave only after operator review. Derived from `00-evidence-inventory.md` verdicts 1–7 and the `01` seed.

## The one-sentence contract

A Blueprint initiative declares its **readers**; the workflow emits the **artifact classes** their jobs require; the gate checks **every declared reader's job is served** — and nothing else.

"Portal" stops being a pattern you conform to and becomes, at most, a thin generated front door over the emitted set.

## 1. The `readers:` block (replaces `portal_type` + audience pills)

```yaml
readers:
  - id: operator            # who (role, not name; names live in research/)
    kind: human             # human | agent
    job: run                # run | recover | boot | evaluate | takeover | receive | orient | invest
    evidence: self          # self | named (cite research/ file) | assumed
  - id: next-session-agent
    kind: agent
    job: boot
    evidence: self
  - id: club-director       # film-room example
    kind: human
    job: receive            # counterparty: gets a deliverable, never the notes
    evidence: named          # demand-evidence capture (director interest; path de-named)
```

Rules:
- **Solo default** (verdict 7): a new initiative stamps with exactly `operator/run`, `operator/recover`, `agent/boot`. Readers are *added on evidence*, not assumed — the inverse of today's three-pill default.
- `evidence: assumed` is legal but inert: an assumed reader never gates anything and renders a visible "unvalidated reader" marker. Meeting a real one upgrades it to `named` with a citation. This is the validation-script discipline applied to IA.
- A `receive` (counterparty) reader **forbids** lens treatment by construction — see class 7.

## 2. The nine artifact classes (job → emission)

| # | Class | Job served | Mechanism (mostly already built) |
|---|---|---|---|
| 1 | `recovery-brief` | recover | Derived: built / decided / next from git + `decisions/` + state (the `blueprint-handoff` skill, mechanized + standing) |
| 2 | `agent-context` | boot | The SessionStart inject, promoted from hook side-channel to named, versioned artifact — the canonical layer's machine rendering |
| 3 | `live-proof` | evaluate | Try, unchanged — the one verb that earned its place |
| 4 | `runbook` | run | Operate items + event-day-runbook shape |
| 5 | `decision-lineage` | (all agents) | ADRs + invalidated-paths register; always emitted |
| 6 | `takeover-corpus` | takeover | handoff-corpus pattern; **activation-gated** (real transfer horizon) |
| 7 | `counterparty-export` | receive | GSI mechanism: whitelist projection + hard-fail leakage lint + frozen versioned bundles. **Never derived from portal/lens content; exclusion by construction** |
| 8 | `plain-answer` | orient | One-scroll, plain-language what/who/why — the artifact D.'s failed walk proved missing |
| 9 | `demand-log` | invest | validation-script shape; the operator-as-founder's own read |

Classes 1, 2, 5 are **always emitted** (every initiative has a future-self and a next agent). The rest emit iff a declared reader's job requires them.

## 3. The front door (what remains of "portal")

- **Optional.** An initiative whose only surfaces are a console + a runbook needs no front door (the decision tree's "the product may be the deliverable" branch, now the honored default instead of a footnote).
- When emitted: a **single generated index** listing the artifact set as entry lanes — "start here as \<reader\>" routing in the bc-subs replacement style. No switcher, no content hiding, no verb grid. The drawer primitive survives here as the way any artifact anchors to the thing it reviews (the one chrome element that held under contact).
- Voice-mode-per-class replaces voice-mode-per-route (the existing table maps over nearly 1:1).

## 4. Gates

- One reviewer: **reader-jobs-served** — reads the manifest, checks each declared reader's class set exists and is non-placeholder, walks each named reader's job to its decision. Replaces both portal-conformance reviewers.
- Per-class mechanical lints where they exist: leakage lint on `counterparty-export` (hard-fail), staleness on attested content, derived-not-hand-maintained on 1/2.
- The bespoke-escape ADR mechanism becomes unnecessary for IA (there is no fixed IA to escape); it survives only for genuine methodology divergences.

## 5. What happens to Patterns A and B

- **Initiative Portal (A):** retired as a contract. bc-subscriptions — its origin and only evidenced multi-audience consumer — already replaced it with canonical + lenses; that replacement is what §3 generates. `@blueprint/ui` survives as a component kit; `AudienceSwitcher` is deleted from the contract (already orphaned at origin).
- **Review Portal (B):** demoted from pattern to **artifact class candidate** — a `review` class (drawer + current-state anchor, the load-bearing subset) emitted when a redesign-shaped initiative declares a reviewer with evidence. The compare toggle and chat FAB are dropped from the mandatory set (fragile legs; zero observed use). Honest caveat: no Pattern B consumer ever had an external reader, so even the drawer's evidence is operator-self-QA — the class ships as candidate, not proven.
- **Existing consumers:** no forced migration. `portal_type:` values keep validating with a deprecation warn (the ADR-03 shim precedent). Consumers adopt the manifest on their next re-stamp; film-room is the first (its manifest is three lines + one counterparty).

## 6. Migration & sequencing (if ratified)

1. ADR in `decisions/` citing this research; wave entry; `blueprint fleet` check first (freeze rule).
2. Stamper: new default manifest (solo set); `readers:` schema in blueprint.yml; deprecation shim for `portal_type`.
3. Reader-jobs-served reviewer replaces the two portal-conformance reviewers; doctor check follows the manifest.
4. Front-door generator (thin index over emitted classes) in `template/`.
5. film-room re-stamp as first consumer; self-app manifest authored (its bespoke ADR-02 collapses into an ordinary manifest: `orient` + `evaluate` + `invest` readers).
6. Registry reconciliation rides along (ai-content-engine loss, remote-only rows).

## Known weak points (attack here first)

- **The nine classes are one abstraction away from the evidence.** The matrix is observed; the *class boundaries* are my cut. Alternative cuts exist (e.g., merge 1+2 as one canonical projection with two renderings; split 4 by human/agent executor).
- **`job:` enum may be premature.** Eight values from thirteen consumers; a ninth job will show up. Is the enum open or closed?
- **The front-door generator is new build** — everything else mostly renames existing mechanisms. Is a generated index worth building, or is a hand-authored index per initiative cheaper than the abstraction?
- **bc-subs' lens layer is not fully absorbed:** lenses (per-audience attested composition) are richer than entry lanes. Does the manifest need a `lens` concept for genuinely multi-audience initiatives, or does that stay consumer-side until a second multi-audience consumer exists?
