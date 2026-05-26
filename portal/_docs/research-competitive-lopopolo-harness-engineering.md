---
canonical: true
stage: 1
status: seeded
source_url: (OpenAI Engineering blog, 2026-02-11)
source_local: ~/Downloads/Harness engineering_ leveraging Codex in an agent-first world _ OpenAI.pdf
---

# Lopopolo — Harness engineering: leveraging Codex in an agent-first world

**Author**: Ryan Lopopolo, OpenAI Member of Technical Staff (with Victor Zhu, Zach Brock)
**Published**: 2026-02-11
**Why it matters for Blueprint**: The first-principle that drives Blueprint (`METHODOLOGY.md § "First Principle: Agent Struggle Is a Missing Capability"`) is cited from this piece. It's the closest published methodology peer to Blueprint, several maturity levels ahead in implementation.

## The experiment

OpenAI built and shipped an internal beta of a software product with **0 lines of manually-written code** over 5 months. Outputs after 5 months:
- ~1 million lines across application logic, infrastructure, tooling, documentation, internal developer utilities
- 1,500 PRs opened + merged
- Throughput: 3.5 PRs / engineer / day, *increasing* as the team grew (3 → 7 engineers)
- Hundreds of internal users, including daily power users
- 0 manually-written code, ever

Direct quote: *"Humans steer. Agents execute."*

The "no manually-written code" rule wasn't a stunt — it was the constraint that forced the team to build what was necessary to increase agent velocity by orders of magnitude.

## Load-bearing claims

### 1. The engineering job is redesigning the environment, not writing code

> "What changes when a software engineering team's primary job is no longer to write code, but to design environments, specify intent, and build feedback loops that allow Codex agents to do reliable work."

The first-principle echo: *"when something failed, the fix was almost never 'try harder.' Because the only way to make progress was to get Codex to do the work, human engineers always stepped into the task and asked: 'what capability is missing, and how do we make it both legible and enforceable for the agent?'"*

This is METHODOLOGY.md § "First Principle" verbatim. Blueprint inherits this principle and applies it to the *initiative* layer (research → prototype → docs → ship); Lopopolo applies it to the *production codebase* layer.

### 2. Application legibility is the bottleneck-mover

Once code throughput went up, human QA capacity became the bottleneck. Response: make the application UI, logs, and metrics directly legible to Codex.

Concrete encodings:
- App bootable per git worktree → Codex can launch one instance per change.
- Chrome DevTools Protocol wired into agent runtime + skills for DOM snapshots, screenshots, navigation. *"Codex drives the app with Chrome DevTools MCP to validate its work."*
- Observability stack ephemeral per worktree — VictoriaLogs / VictoriaMetrics / VictoriaTraces exposed via LogQL/PromQL/TraceQL APIs. Prompts like *"ensure service maintains 99.9% reliability"* become tractable because the agent can query its own telemetry.

Blueprint parallel: Stage 0 (Application Legibility) + `browse-tool` as the default sensor + Chrome DevTools MCP escalation rubric. Same pattern, smaller surface (Blueprint's prototypes don't need full observability stacks).

### 3. Repository as system-of-record; short AGENTS.md as map

The team tried "one big AGENTS.md." It failed in predictable ways:
- **Context is a scarce resource.** Giant instruction files crowd out task, code, and relevant docs.
- **Too much guidance becomes non-guidance.** When everything is "important," nothing is. Agents end up pattern-matching locally.
- **It rots instantly.** Monolithic manual = graveyard of stale rules. Agents can't tell what's still true; humans stop maintaining it; the file quietly becomes an attractive nuisance.
- **It's hard to verify.** A single blob doesn't lend itself to mechanical checks.

The solution: short AGENTS.md (~100 lines) as the **table of contents**. Structured `docs/` directory as the **system of record**. Layout:

```
AGENTS.md
ARCHITECTURE.md
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   └── ...
├── exec-plans/
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
├── product-specs/
│   ├── index.md
│   ├── new-user-onboarding.md
│   └── ...
└── references/
    ├── design-system-reference-llms.txt
    ├── nixpacks-llms.txt
    ├── uv-llms.txt
    └── ...
DESIGN.md
FRONTEND.md
PLANS.md
PRODUCT_SENSE.md
QUALITY_SCORE.md
```

Direct quote: *"Give Codex a map, not a 1,000-page instruction manual."*

Blueprint parallel: `template/CLAUDE.md` is the AGENTS.md analog (~100 lines, map not manual). `docs/` is the structured system of record. The SessionStart hook just made the three load-bearing canonical docs mandatory inject.

### 4. What Codex can't see doesn't exist

> "From the agent's point of view, anything it can't access in-context while running effectively doesn't exist. Knowledge that lives in Google Docs, chat threads, or people's heads are not accessible to the system. Repository-local, versioned artifacts (e.g., code, markdown, schemas, executable plans) are all it can see."

Encoding implication: push more context into the repo over time. Slack discussion that aligned the team on an architectural pattern? If it isn't discoverable to the agent, it's illegible — same as it would be unknown to a new hire joining three months later.

Blueprint parallel: this is exactly why ai-hive's `tools/hive-board-derive/` matters in subs-initiative. Live D1 state is illegible to a future agent session unless derived to repo-local markdown. The 2026-05-25 reconciliation failure was the same pattern at the methodology layer — three sessions had aligned context in their heads but no shared repo-local artifact.

### 5. Enforced invariants, not micromanaged implementations

> "By enforcing invariants, not micromanaging implementations, we let agents ship fast without undermining the foundation."

Concrete: require Codex to *parse data shapes at the boundary*, but not be prescriptive about how (the model likes Zod; the team didn't specify). Layered domain architecture (Types → Config → Repo → Service → Runtime → UI) with strictly validated dependency directions, enforced mechanically via custom linters + structural tests.

Critical detail: *"Because the lints are custom, we write the error messages to inject remediation instructions into agent context."* The lint failure isn't just "this is broken" — it's a remediation prompt the agent reads and acts on.

> "In a human-first workflow, these rules might feel pedantic or constraining. With agents, they become multipliers: once encoded, they apply everywhere at once."

Blueprint parallel: reviewer agents at stage gates ARE the invariant-enforcement layer. But they're markdown specs the agent reads and pattern-matches, not custom lints with structural tests + remediation-instruction-injecting error messages. **This is Blueprint's most concrete production-quality gap.**

### 6. Throughput changes the merge philosophy

> "As Codex's throughput increased, many conventional engineering norms became counterproductive. The repository operates with minimal blocking merge gates. Pull requests are short-lived. Test flakes are often addressed with follow-up runs rather than blocking progress indefinitely. In a system where agent throughput far exceeds human attention, corrections are cheap, and waiting is expensive. This would be irresponsible in a low-throughput environment. Here, it's often the right tradeoff."

Implication: gates that exist to slow humans (manual review on every PR, blocking on every flake) are wrong when the agent can fix the issue cheaper than the wait costs. Blueprint's reviewer agents need to be designed with this in mind — they should block *substantive* issues (CSS gap on portal pages, missing portal pattern primitives) and *not* block on flake-class issues (formatting drift).

### 7. Entropy and garbage collection are continuous

> "Full agent autonomy also introduces novel problems. Codex replicates patterns that already exist in the repository — even uneven or suboptimal ones. Over time, this inevitably leads to drift."

Initial response: Fridays were "AI slop cleanup day" (20% of the week). Didn't scale. Replaced with **golden principles** encoded as opinionated mechanical rules + a recurring cleanup process. Background Codex tasks scan for deviations, update quality grades, open targeted refactoring PRs.

Direct quote: *"Tech debt in an agent-generated codebase compounds like an unpaid interest loan: it's almost always better to pay it down continuously in small increments than to let it compound and tackle it in painful bursts."*

Blueprint parallel: the 2026-05-25 reconciliation was the equivalent of a "painful burst" cleanup of methodology drift. The encoded response (SessionStart hook + methodology freeze rule + reviewer wiring) is the continuous-payment equivalent. But Blueprint has no *automated* doc-gardening agent — no background task that scans `template/` for inconsistencies between methodology docs, reviewer specs, and stamper behavior. This is the second concrete production-quality gap.

### 8. Layered architecture as early prerequisite, not late-stage refactor

> "This is the kind of architecture you usually postpone until you have hundreds of engineers. With coding agents, it's an early prerequisite: the constraints are what allows speed without decay or architectural drift."

Implication for Blueprint: the Variant × Tier matrix + Pattern A/B selection are this. They're constraints that allow speed because consumer sessions don't re-derive structure each time. The L3 encoding (matrix at top of `docs/portal-and-tier-ladder.md`) is exactly this principle.

## Lopopolo's open questions

From the closing section: *"What we don't yet know is how architectural coherence evolves over years in a fully agent-generated system. We're still learning where human judgment adds the most leverage and how to encode that judgment so it compounds."*

> "Our most difficult challenges now center on designing environments, feedback loops, and control systems that help agents accomplish our goal."

Blueprint inherits these open questions. The redesign prescription should be explicit about which parts are settled (the first principle, the encoded-response loop, the variant taxonomy, the tier ladder, the portal patterns) and which parts are still being learned (how the reviewer set evolves, how doc-gardening works at scale, how a Blueprint update propagates across consumer initiatives).

## Patterns to adopt in production-quality Blueprint

| Lopopolo pattern | Blueprint adoption |
|---|---|
| Short AGENTS.md as table of contents + structured `docs/` as system of record | Already adopted (`template/CLAUDE.md` + `docs/`). Validate by audit. |
| Custom lints with error messages that inject remediation instructions | **Not yet adopted.** Reviewer agents are markdown specs, not executable lints. This is the highest-leverage upgrade. |
| Doc-gardening agent — background task scanning for stale or inconsistent docs | **Not yet adopted.** Would prevent the next four-way-drift episode without human reconciliation. |
| Repo-local versioned artifacts only — anything in Google Docs / Slack / heads is illegible | Partially adopted. ai-hive in subs-initiative gets this right via `hive-board-derive`. Blueprint itself does too, but consumer methodology assumptions sometimes still drift to Slack. |
| Layered architecture enforced mechanically via custom linters + structural tests | Variant × Tier matrix + Pattern A/B is the conceptual equivalent. Mechanical enforcement (CI lint) is missing. |
| Application legibility — wire the app into the agent runtime (DevTools, observability) | Adopted at the prototype/portal level via `browse-tool` + Chrome DevTools MCP escalation. Not extended to methodology-as-an-application. |

## Direct quotes worth keeping

- "Humans steer. Agents execute."
- "What capability is missing, and how do we make it both legible and enforceable for the agent?"
- "Give Codex a map, not a 1,000-page instruction manual."
- "What Codex can't see doesn't exist."
- "By enforcing invariants, not micromanaging implementations, we let agents ship fast without undermining the foundation."
- "Tech debt in an agent-generated codebase compounds like an unpaid interest loan."
- "Our most difficult challenges now center on designing environments, feedback loops, and control systems."
