---
canonical: true
---

# Multi-Operator Collaboration Pattern

**Status**: Promoted 2026-05-27 wave 28 from three-consumer evidence across three distinct failure modes (rally-hq attribution-loss + blueprint-redesign wrong-directory + peer-canonical-contamination + blog parallel-work coordination).

**Last updated**: 2026-05-27

**Source evidence**:
- `apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md` § "Worktree isolation leaks via the shared pre-commit hook" — commit `0c074d5` was labeled "P20-only" in the commit message but the actual diff bundled P14a + P14b changes from a sibling worktree. Per-agent attribution lost forever in `git log`.
- `wip/blueprint-redesign/METHODOLOGY-AMENDMENTS.md:243` § "Operating in the wrong directory on dogfooding work" — parallel-session confusion between `wip/blueprint` and `wip/blueprint-redesign`; resolution required per-repo CLAUDE.md role declarations + worktree conversion (commit `0230bde`).
- `wip/blueprint-redesign/portal/CONVENTIONS.md:210,250` — website-nc-v3 incident: consumer truncated 268 lines from `shared.css` mid-edit, then restored the missing chrome by `curl`-ing from a peer consumer's deploy. Promoted the peer's project-specific drift into a "canonical" position no doc declared.
- `apps/blog/.worktree/pilot-decision-gate/.blueprint/AGENTS.md:38` — pilot success criterion #3 explicitly names the parallel-work failure mode: *"No workaround emerges (agent doesn't reorder commits to land legal pieces while drifting; operator doesn't disable the hook)."*

**Related patterns**:
- [docs/operator-handoff-pattern.md](operator-handoff-pattern.md) (wave 25) — sibling: lowers cost of writing handoff for a specific session-transition reader. This pattern addresses coordination across simultaneous operators (not sequential handoffs).
- [docs/amendment-classification-pattern.md](amendment-classification-pattern.md) (wave 27) — both this and that pattern target the data shape of amendments; this pattern targets how amendments are *created* in collaborative settings.
- [docs/2026-05-27-loom-inspiration-candidates.md](2026-05-27-loom-inspiration-candidates.md) C5 — the inspiration candidate this wave closes
- [docs/2026-05-27-extended-audit-findings.md](2026-05-27-extended-audit-findings.md) — the audit that drove promotion

---

## Why this pattern exists

Every other Blueprint discipline scales operator work *within* a session — one operator, one initiative, one stage transition. This pattern is the only one that scales work *across* operators — simultaneous sessions, multiple agents touching one initiative, multiple consumers touching one methodology surface. The Loom recording at session-trigger 2026-05-27 named this gap explicitly: *"how were multiple people going to work around this? across independent agent sessions to collaborate on a single solution?"*

The extended audit (2026-05-27) found three distinct failure modes already accumulated across three consumers. Each fails differently because each is a different shape of multi-operator coordination problem:

| Sub-pattern | Failure mode | Source |
|---|---|---|
| **Attribution-loss** | Multiple parallel agents commit through a shared `.git/`; commit messages misattribute work between agents | rally-hq `0c074d5` — P20 commit bundled P14a+P14b |
| **Cross-context confusion** | Multiple parallel sessions touch sibling repos via `pwd`-only identity; wrong commits land in wrong repos | blueprint-redesign wrong-directory amendment |
| **Parallel-work workaround** | One operator's hook/gate gets bypassed by another operator (or by the agent reordering commits) | blog pilot success-criterion #3 |
| **Peer-canonical-contamination** *(adjacent — recovery-path failure)* | Consumer in emergency restore situation `curl`s from peer's deploy; peer drift becomes "canonical" | blueprint-redesign portal/CONVENTIONS.md:210 |

The fourth (peer-canonical) is adjacent: it's a recovery-path failure rather than an in-flight coordination failure, but it stems from the same root — no canonical "source of truth" surface that's discoverable from across operator-boundaries.

---

## The architectural shape (deferred build)

The shape this pattern points toward — but does NOT build this wave — is:

**Inline operator annotations on portal sections → structured bubble-up to AMENDMENTS / shared-state surfaces.**

Three layers:

1. **Annotation surface** — portal sections accept inline comments / proposals (UX shape borrowed from Figma's positional pinning per 2026-05-27 market comparison)
2. **Routing layer** — annotations route to the right destination based on bucket (per wave 27's 4-bucket taxonomy): consumer-local → STATE.md / handoff; template/reviewer/methodology → METHODOLOGY-AMENDMENTS.md
3. **Identity layer** — every annotation carries the producing operator's identity (which session / which agent / which working tree) so attribution survives in the destination artifact

The wave 27 amendment-classification taxonomy composes here: an annotation routes by bucket; the bucket determines the destination file; the destination's append-only convention preserves the entry.

---

## Why doc-only this wave

The pattern requires substrate that Blueprint does not currently own:

- **Auth / identity** — annotations need producer identity to scale beyond a single trusted operator
- **Persistence** — annotations live on the portal artifact, which is today stamped HTML; the surface needs a backend (or a structured commit convention) to carry annotations alongside content
- **UX** — positional pinning on rendered HTML is a non-trivial frontend build

These dependencies are real-product-scope, not methodology-scope. Shipping any of them prematurely would expand Blueprint into a different competence (it would become a SaaS, not a methodology distribution). The doc-only shape this wave ships:

1. Names the pattern with cross-consumer evidence
2. Documents the three sub-patterns + the architectural shape
3. Defers build to a `platform-feature` dogfood per wave 20's architect-challenge-pattern — which has not yet been exercised on a real initiative and which this build would naturally validate

The deferral is not "wait indefinitely." It is "the next wave-promotion candidate that has cross-consumer evidence AND uses the architect-challenge-pattern naturally is this one." When the dogfood happens (per the candidates-doc next-steps section), wave 28+N can author the substrate.

---

## What consumers can do today (without the substrate)

Three lightweight conventions consumers can adopt now to reduce the failure modes:

1. **Per-repo role declaration in CLAUDE.md** (already in use at `wip/blueprint/CLAUDE.md` and `wip/blueprint-redesign/CLAUDE.md`): every CLAUDE.md opens with `**Repo role: I am X.**` + a `pwd` verification check. Prevents cross-context confusion. Adopted by blueprint-redesign after its wrong-directory amendment.

2. **Worktree isolation per parallel agent** (existing global rule in `~/.claude/CLAUDE.md` § "Multi-session work isolation"): every parallel dispatch uses `isolation: "worktree"`. Rally-hq's `0c074d5` happened despite this rule because the `.git/` was still shared — known limitation, mitigated by serializing same-scope dispatches.

3. **No-workaround success criterion** (blog pilot pattern): when an executable enforcement (lint, hook, gate) is added, the rollout success criterion explicitly includes "no workaround emerges." Prevents the parallel-work pattern of "agent reorders commits to bypass the hook."

These three conventions are not the full pattern. They are friction-reducers consumers adopt while the substrate is deferred.

---

## When the substrate becomes a build candidate

Wave-promotion criteria (defer until met):

- A `platform-feature` dogfood per wave 20 names this pattern as its candidate platform-feature
- OR ≥1 consumer reports a coordination failure attributable to the missing substrate that the three lightweight conventions did NOT prevent
- OR ≥2 consumers begin maintaining bespoke annotation-like surfaces (issue trackers, side files, Slack threads) that an inline-annotation surface would replace

None of these is met today. The three lightweight conventions handle 80% of the observed failure modes. The substrate is the right next-step *when* one of the criteria fires.

---

## Cross-reference

Promotes inspiration-candidate **C5** from `docs/2026-05-27-loom-inspiration-candidates.md` based on the 2026-05-27 extended consumer audit (`docs/2026-05-27-extended-audit-findings.md`). Closes the C5 watch-and-promote loop. Loom's market analog (timestamped comments + reactions on a shared video) is structurally similar but operates on a different modality and on a different time-shape — comments-on-recording vs annotations-on-live-portal. The pattern this wave names is closer in shape to Figma's positional pinning + Notion's queryable comment rows + GitHub's PR suggestions-as-patches (per the market-comparison doc) — none of which exists yet for stamped-HTML portals; the dogfood would be the first.
