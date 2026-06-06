# Competitive positioning — Blueprint vs the spec-first field

**Stage 1 deliverable (competitive analysis), produced by applying Blueprint's own
research pipeline to itself, 2026-06-06.** Method: parallel web research on the
field + repo-grounded capability extraction + an adversarial critique pass that
red-penciled marketing claims, then re-grounded against `subs-initiative` and the
real consumer fleet after two operator corrections. Honesty standard: every claim
is tied to repo/competitor evidence; where competitors win, it says so; unverified
figures are flagged inline.

---

## TL;DR — the verdict

Blueprint is **not** best positioned as "a spec-first workflow for software
development." That lane (Agent OS, GitHub Spec Kit, AWS Kiro, BMAD) is judged on
one job — turn a spec into mergeable code — and positioning Blueprint there invites
the comparison it loses on.

The defensible position: **Blueprint + ai-hive *wraps* the spec-first lane** —
supplying the product-definition the spec-first tools assume you already did (front)
and the drift-controlled multi-agent implementation they lack (back), with a
reconciliation substrate keeping the build tethered to its spec. **Proven once, at
scale, on `subs-initiative`** (116k LOC shipped). The wrap is real; the
reproducibility is not yet.

---

## The pipeline scope — methodology vs system

The spec-first tools start *at* the spec and end *at* code. Blueprint's arc is wider
on both ends — but only as a **system** (Blueprint + ai-hive + a substrate), and the
seam is load-bearing (charter: "integrate, not absorb / companion stays separate").

```
research → strategy → prototype → fact-check → spec → hive-coordinated build → shipped code + deploy
└──────────────── Blueprint (methodology + gates) ─────────────┘  └──── ai-hive (coordination) ────┘
                          drift reconciliation substrate (state-derive / reconcile) spans the whole arc
```

| Layer | Owner | Job |
|---|---|---|
| Front + gates | **Blueprint** | 7-stage pipeline + the executable gates between stages |
| Build coordination | **ai-hive** (separate artifact) | multi-agent execution: task claims, file locks, append-only decision log, heartbeats |
| Drift reconciliation | **the substrate** | walks `docs/`, fails CI on drift between repo state and the spec/ADR layer |

The precise claim is **"Blueprint + ai-hive ships code,"** not "Blueprint ships
code." Drop the "+hive" and you credit the methodology with a build engine it
explicitly does not own.

---

## Comparison matrix

*Blueprint's column is repo-verified. Competitor cells are author/research-supplied
and **not** re-verified live this pass — treat figures as directional; re-check
before external use.*

| Dimension | **Blueprint (+hive)** | **Agent OS** | **Spec Kit** | **Kiro** | **Roll-your-own** |
|---|---|---|---|---|---|
| Primary output | Stakeholder portal (strategy + prototype + fact-checked docs) **and** shipped code via hive | Standards + shaped specs (delegates impl) | Specs + plans + tasks + generated code | Working code + PRs + specs/tests | Whatever you build each time |
| Ships production code | **Yes — via hive, proven on subs-initiative** (116k LOC) | No (orchestrates other tools) | Yes | Yes | Usually |
| Stage gates — executable? | **Yes** — 12 `.mjs` reviewers, CI/CLI-runnable | No (advisory) | No (self-attested) | Partial (Hooks) | No |
| Fact-check / anti-hallucination | **Yes — named Stage 4** | No | No | No (EARS = ambiguity, not truth) | No |
| Product-definition front | **Yes — research/strategy/prototype/fact-check** | Partial (standards) | No (starts at spec) | Weak (starts at spec→code) | Manual |
| Drift control over a long build | **Yes — reconciliation substrate** (subs-initiative: 542 commits ↔ 39 ADRs) | No | No (static specs, manual reconcile) | Partial (Hooks) | No |
| Multi-agent coordination | **Built (hive), not yet run under contention** | No | No | No (single-dev IDE) | No |
| Distribution + lock-in | npm CLI, git-native, no hosted service; hive = per-initiative CF/Supabase | GitHub repo, MIT | `uv tool`, MIT | SaaS + cloud lock-in, paid | None |
| Tool coupling | Authored for Claude Code; gates portable Node | Many agents | Many agents (broad) | Kiro IDE only | Your harness |
| Maturity / adoption | v0.1.0 (days old); ~12-consumer fleet across domains; **1 external** (early); full hive = **1 consumer** | Established | Large public following | GA, vendor-resourced, paying users | n/a |

---

## What genuinely sets Blueprint apart (defensible, evidence-tied)

1. **The wrap, proven end-to-end on subs-initiative.** No spec-first competitor does the
   product-definition front (research → strategy → prototype → fact-check, producing
   a spec worth feeding them) *and* the drift-controlled multi-agent back. Evidence:
   `subs-initiative` — BRD + 39 ratified ADRs + fact-check **before** the build,
   then 542 commits / 934 PRs / 116k LOC reconciled to those ADRs by the substrate.

2. **Executable completeness gates that run outside the agent.** 12 reviewers
   (`template/.claude/agents/blueprint/reviewers/*.mjs`) with a fixed
   `review() → {status, findings}` contract, runnable in CI — not prompts the agent
   grades itself against. The smoke-runner does a real JS-class ↔ CSS-coverage diff.
   The others (Spec Kit, Kiro, Agent OS) self-attest stage completeness.

3. **Fact-check as a first-class stage.** Stage 4 validates claims against
   screenshots/codebase/data. The spec-first tools reduce *ambiguity* (EARS,
   clarifying questions); none ask "is this assertion true against the source."

4. **Gates that refuse to lie.** The smoke-runner `WARN`s about what it could not
   verify rather than fabricating a green boot/screenshot — anti-hallucination
   applied to the tooling.

5. **Domain generalization.** The fleet carried billing/subscriptions, daily content
   ops, photography, SaaS-CX, a north-star dashboard, a public marketing site, and the
   methodology itself to deliverables. A code-centric spec-first tool can't show this
   spread.

Deliberately **not** claimed as moats: the portal's looks, the 7-stage sequence as a
list, the design-principles five rules, the cost dial, access control — partially
mechanized, mostly convention.

---

## The honest gaps (no softening)

1. **"Blueprint ships code" overclaims the seam** — it's **Blueprint + ai-hive**, and
   hive is a separate artifact by charter.
2. **Full hive = exactly one consumer.** rally-hq, blueprint-redesign, website-nc-v3
   have no `.hive/`. The coordination layer is bespoke-to-subs-initiative; only three
   lightweight conventions spread to others.
3. **Not productized.** `hive.enabled: false` in source; each initiative hand-copies
   `.hive/`, rebinds its own CF/Supabase, ~1hr manual bootstrap; `bootstrap.sh` "in
   progress." No `npx init` into the full system.
4. **Multi-operator coordination is built, never run under contention** (`enabled:
   false`, "flip once a second operator joins").
5. **External adoption = one, early.** Alex's media toolkit is a real non-Nino
   adopter (0→1 is categorical), but singular; the fleet is otherwise founder-
   dogfooded.
6. **Maturity.** CLI v0.1.0, published 2026-06-05 — *available*, not field-tested by
   teams that didn't author the methodology. Spec Kit/BMAD have communities; Kiro has
   a resourced product and paying users.
7. **Tool coupling.** Delivery (hooks/skills/CLAUDE.md injection) assumes Claude Code;
   a Cursor/Copilot team gets the docs, not the enforcement. The MIT toolkits span
   many agents.
8. **The false-green gap persists** — Fact-Check doesn't gate on runtime/browser; subs-initiative
   "shipped" Tier α is *sandbox*, not live in production stores.
9. **Roll-your-own wins at N=1.** For one project by a disciplined team, a hand-written
   CLAUDE.md + portal template is faster and perfectly fitted.

---

## Adoption reality

`consumers.yml` listed **3**; the actual fleet is **~12–14** across diverse domains:
blog (signal-dispatch), rally-hq (+ worktrees), blueprint-redesign, tna, ai-content-engine,
atelier-dashboard, subs-initiative, photography, the self-application — plus
operator-named ninochavez.co, promo-initiative, dms-north-star, and **Alex's media
toolkit (external)**. The registry under-counted because it is a hand-maintained
mirror that drifted (the exact failure `fleet` exists to surface). Reconciled
2026-06-06.

---

## Why use Blueprint, not roll your own

An **N≥2** argument, now with concrete evidence instead of projection: roll-your-own
re-discovers every failure at the prompt layer; Blueprint encodes it once at the repo
layer.

- Shipped an unstyled portal `curl`-200 green → the smoke gate fails that at commit.
- Project CSS leaking into every copied portal → the chrome byte-diff reviewer closes it.
- Concurrent sessions disagreeing on "what is Blueprint" (2026-05-25) → SessionStart
  injection + freeze rule.
- Lost learnings scrolling past the context window → the amendments convention turns a
  failure into a gate.

subs-initiative is the existence proof the encoded discipline holds a 542-commit multi-agent
build together. **Caveat:** it held *one operator's* build together — not yet a team
that didn't author the methodology. One line: **cheaper for one initiative, more
expensive for ten** — empirically demonstrated for one author's fleet, projected for
independent teams.

---

## Positioning recommendation

**Claim (defensible):**
- The wrap + the subs-initiative proof, scoped as a *reference implementation*.
- The product-definition front (research → strategy → fact-check before any spec) vs Spec Kit/Kiro.
- Drift control over long multi-agent builds (the substrate) — a genuine gap in the others.
- Domain generalization across a ~12-consumer fleet with a first external adopter.

**Do NOT claim (the pamphlet line):**
- ❌ "Blueprint ships production code." → only **Blueprint + hive**.
- ❌ "Reproducible / available / adopt-and-ship." → one bespoke, hand-bootstrapped rig; no `init`, no second full-hive consumer, no RBAC, Cloudflare-only.
- ❌ "Proven multi-agent / multi-operator." → built and designed, `enabled: false`, never run under a second operator.
- ❌ "Agent-agnostic." → say "authored for Claude Code; gates portable to any CI."
- ❌ "Battle-tested / proven." → "v0.1.0, dogfooded across the author's own fleet" — true and unembellishable.

**Sharpest honest frame:** spec-first tools answer *"is the code built right?"*
Blueprint answers *"are we building the right thing, can we prove it to three
audiences, and can a long multi-agent build stay tethered to its spec?"* Different
buyer, different budget. Blueprint wins by refusing the first lane and owning the
wrap — a lane currently unoccupied in the surveyed set, unproven by external
adoption, and possibly thin because the market routes this need through a deck + a
human analyst. Be confident about the category logic; honest that both adoption and
category demand are the unfinished work.

---

## Verified facts (this pass) + re-verify flags

**Repo/live-verified:** 12 executable reviewers; 6 dependency-free libs; CLI
`@nino-chavez-labs/blueprint-cli` v0.1.0 published 2026-06-05 (npm); `consumers.yml`
present (reconciled herein); subs-initiative: ~116,590 LOC TS, 542 commits, 934 PRs,
138 test files (research said 154 — flag), 65 Terraform files, 14+ CI/CD workflows,
admin deployed to BC sandbox, 39 ADRs, BRD→code traceability; `hive.enabled: false`
in source `blueprint.yml`; full `.hive/` exists only in subs-initiative.

**NOT verified — re-check before external use:** all competitor figures (Spec Kit /
BMAD star counts, Kiro GA + lock-in vendors) — author/research-supplied; the
subs-initiative assessment was static-only (no runtime verification); the four operator-named
non-local consumers (ninochavez.co, promo-initiative, dms-north-star, Alex's media
toolkit) are operator-declared, not locally confirmed; the "unoccupied category"
claim rests on a ~14-tool surveyed set, not an exhaustive market scan — and empty ≠
valuable.
