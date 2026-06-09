# Market comparable — Glass (Ramp internal AI workspace)

**Comparable-evidence note, added wave 50 (2026-06-09).** Source: Shane Buchan
(software engineer, Ramp internal-AI team), "How We Built Glass: Vibe Coding a
Product Used by 700 People," X article, 2026-04 (~168K views as captured).
Single-source, first-party account by the builders — read it as a practitioner
testimony, not an audited case study.

**Sourcing caveat, stated up front**: Glass is an internal tool at one company
with mandated Okta SSO, pre-bundled internal CLIs, and a captive distribution
channel. The engineering lessons transfer; the adoption numbers (700 users,
"half the company") do not — they were purchased with distribution leverage no
external product has.

---

## Why this comparable matters to Blueprint

Glass is an independent rediscovery of Blueprint's core thesis by a team that
has never seen it: a three-person core team (a PM, an engineer, an IT engineer)
vibe-coded a product to real adoption, hit the entropy wall, and concluded that
**agent entropy is a missing-capability problem solved by mechanical gates plus
durable docs — not by better prompting**. Their words: "the engineering
discipline doesn't go away just because the AI is writing the code. If
anything, you need more of it."

Independent convergence from a well-resourced team is the strongest external
evidence the methodology's first principle has collected so far.

## The trajectory (their account)

1. **Demand first.** Weekend project → a PM "vibed harder" → ~20 daily users
   asking for more. "Glass had users before it had a team."
2. **The entropy wall.** Codebase "growing *outward*": every feature its own
   file/patterns, utilities reimplemented because the agent didn't know they
   existed, no shared design system, docs lagging so the agent couldn't
   reference what the product already did. Bugs at the seams; PRs unreviewable
   ("intentionally different or just inconsistently generated?").
3. **Retrofit, not rewrite.** "We could have stopped and rewritten everything.
   But we had users… So instead of fighting the vibe coding, we figured out how
   to do it better."

This trajectory is the canonical midstream-adoption path — codified as the
"entropy wall" litmus in `docs/variant-selection.md`.

## Their fixes → Blueprint's analogues

| Glass | Blueprint |
|---|---|
| **Defrag** — recurring skill that scans for fragmentation (duplicated components, inconsistent patterns, logic that should be shared) and fixes it; "every pass makes the codebase more coherent for the next thing the agent builds" | `defrag-reviewer` (wave 50 — this comparable prompted it): mechanical detection + agent-judged consolidation plan, cadence pass, never blocks |
| **Doc validation in the PR pipeline** — "if you add a feature, the docs need to describe it… the agent builds on top of existing capabilities instead of accidentally duplicating or contradicting them"; called the single biggest difference | `doc-currency-reviewer` (wave 50) for the mechanical class + Stage-4 validate / `doc-quality-auditor` for the semantic class |
| **Shared design system** — agent references what exists instead of generating from scratch | `template/` stamper substrate + portal conformance reviewers — same move at fleet level |
| **Pre-commit quality gates** — defrag/lint/type/doc checks before merge; "fragmentation gets caught at the door" | reviewer fleet + `blueprint doctor` + hooks |
| **Dojo** — skill marketplace; non-engineers publish markdown skills, Git made invisible (Glass writes the branch/PR/merge), 350+ skills shared | methodology-amendments convention (users become contributors); hive onboarding kit (wave 49) circles the same non-technical-contributor problem for teams |
| **Memory: write-once-read-many inspectable files** — "you know exactly what the agent knows, because it's all in files you can inspect" | committed `research/` + `decisions/` + SessionStart canonical-context injection |
| **"Glass reads its own blueprint, has tools to modify itself"** | the self-application — this repo as its own first consumer |
| **Division of labor** — "the agent writes the code; the pipeline checks the quality; the human makes the call: is this the right thing to build, and does it actually work?" | operator gates at every stage exit; reviewers PASS/BLOCK, humans decide |

## Where Glass diverges (and what it argues against us)

- **Sequencing.** Glass added structure *after* the wall — and would argue
  demand-first proved the product before any process spend. Blueprint's
  counter-bet is Tier 0: if day-zero structure is cheap enough, the wall tax
  never accrues. Glass is evidence the entry cost must stay near zero, or
  teams will rationally vibe first.
- **Runtime product vs methodology.** Glass ships an app (proxy connection
  layer, self-healing integrations, memory cron). Those surfaces have no
  Blueprint analogue and shouldn't — they are product features, not
  methodology capabilities.
- **Active repair beat passive detection.** Their defrag *fixes* on a cadence;
  Blueprint's gates only detected at the door until wave 50 closed that gap
  (proposal-only — write authority stays with the human, which is a deliberate
  divergence from Glass's auto-fixing skill).

## What was deliberately NOT adopted

- **Dojo-style git-invisible contribution UI** — deferred on the
  second-instance rule; wave 49's hive onboarding covers the one live team
  engagement.
- **Memory-synthesis cron** — SessionStart injection already serves the
  inspectable-context need.
- **Self-healing integrations** — runtime concern, out of scope.
