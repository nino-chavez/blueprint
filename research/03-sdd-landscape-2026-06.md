---
stage: 1
status: evidence
date: 2026-06-11
method: 4 parallel research agents (internal re-read of committed research, live-landscape source-level repo reads, HN Algolia history, Reddit r/ClaudeAI + r/ClaudeCode scene)
full_transcript: (local Claude Code session transcript — not published)
---

# SDD landscape — verified June 2026 snapshot

**Stage 1 deliverable (landscape verification), produced 2026-06-11.** This is the
re-verification `02-competitive-positioning.md` flagged for itself ("competitor cells
not re-verified live this pass — re-check before external use"). Method: four parallel
agents — one re-reading the committed research against current repo/npm state, one
doing source-level reads of competitor repos (READMEs, gate scripts, workflow code),
one pulling Hacker News reception history via the Algolia API, one reading the Reddit
Claude-tooling scene via live-session JSON. Honesty standard unchanged from 02: every
competitor claim is tied to a cited source; where a competitor is better, it says so.

**Everything here is a dated snapshot.** Star counts are approximate, read via the
GitHub API on 2026-06-11; repos move fast in this category. If a claim about a tool
is wrong or stale, open an issue on this repo — corrections welcome.

---

## TL;DR — the verdict

"Spec-driven development" is now a named, crowded category: a Martin Fowler article
series defines its levels (spec-first / spec-anchored / spec-as-source), dedicated
trackers follow 30+ frameworks, and vendors (GitHub, AWS, Tessl, Augment) have
entered. Leaders by adoption: Superpowers (~224k stars), GitHub Spec Kit (~111k),
GSD (~64k), OpenSpec (~54k), BMAD (~49k).

Across the 14 tools source-read this pass, nobody combines Blueprint's three
load-bearing claims: (1) stage gates that are exit-code scripts checking artifact
**content and evidence** — gates elsewhere are human approve/reject prompts,
LLM-interpreted checklists, code-quality loops, or (Spec Kit) file-existence checks;
(2) a fact-check stage tracing **document** claims to research sources — Kiro and GSD
verify code against specs/summaries, nobody verifies prose against evidence; (3)
self-application receipts as a feature — only OpenSpec visibly dogfoods, and it
doesn't market that.

The reception evidence is the sobering half: methodology launches are the
worst-performing genre on HN (BMAD went 0-for-8; GitHub's own Spec Kit needed ~20
submissions for one 84-point hit), and Reddit's framework scene has produced its own
backlash genre. What cuts through is comparison content, receipts, and an upfront
token-cost answer — not launch announcements.

---

## (a) Category state

- **The category is named.** Martin Fowler's series ("Understanding
  Spec-Driven-Development: Kiro, Spec-Kit, and Tessl",
  martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) defines
  spec-first / spec-anchored / spec-as-source levels. specdriven.com/landscape tracks
  30+ frameworks (page 403'd to direct fetch; existence confirmed via search).
  Multiple "best SDD tools 2026" comparison sites exist (marktechpost, softwareseni,
  Augment's own comparison pages).
- **Leaders, approximate stars (GitHub API, 2026-06-11):** obra/superpowers ~224k
  (on the official Claude marketplace since Jan 2026); github/spec-kit ~111k ("most
  community-adopted", 30+ agent integrations); gsd-build/get-shit-done ~64k (created
  2025-12 — the fastest riser); ruvnet/ruflo ~59k (renamed from claude-flow);
  Fission-AI/OpenSpec ~54k; bmad-code-org/BMAD-METHOD ~49k;
  eyaltoledano/claude-task-master ~27k; SuperClaude ~23k. Kiro is the commercial IDE
  leader (Amazon, GA).
- **The published criticism of the field is Blueprint's wedge.** Fowler's core
  critique: LLM-interpreted checklists are "interpreted by AI... no 100% guarantee
  they will be respected", creating "a false sense of control." That is precisely the
  gap an exit-code gate closes — and no surveyed tool closes it at the
  content/evidence level (see whitespace, section c).

---

## (b) Per-tool gate findings — what the "gate" actually is, at source level

Source-level reads, 2026-06-11. For each tool: what its gate mechanism actually is,
what the tool does best, and a verdict (direct competitor / partial overlap /
different job).

| Tool | ~Stars | Gate mechanism (at source) | Verdict |
|---|---|---|---|
| GitHub Spec Kit | ~111k | Exit-code script on file EXISTENCE + human TTY approve + LLM checklists | Direct competitor (workflow shape) |
| GSD | ~64k | Formal gate taxonomy, mostly LLM/prompt-enforced; a few real exit-code scripts | Direct competitor (closest in spirit) |
| AWS Kiro | commercial | Property tests generated from EARS requirements; stage flow IDE-guided | Direct competitor (different layer) |
| OpenSpec | ~54k | Real CLI validator, structure/schema only; anti-gate philosophy | Direct competitor (artifact discipline) |
| BMAD-METHOD | ~49k | None executable — agent-run checklists and handoffs | Direct competitor (breadth) |
| PRP | ~2.2k | Real executable validation loops — code-quality commands, not stage gates | Partial overlap |
| ruflo (Claude Flow) | ~59k | SPARC plugin gates, orchestrator-agent-evaluated | Partial overlap |
| spec-workflow-mcp | ~4.2k | Mechanical block until HUMAN dashboard approval | Partial overlap |
| Tessl | commercial | Human approval between spec and implementation | Partial overlap (different bet) |
| Spec Kitty | ~1.3k | spec→plan→tasks→review→accept→merge CLI + kanban | Partial overlap (small) |
| Intent (Augment) | commercial | Verifier agent catches incompatibilities pre-PR | Partial overlap (closed) |
| Agent OS | ~4.8k | No gates — standards extraction/injection | Different job |
| Taskmaster | ~27k | No gates — task decomposition + research command | Different job |
| SuperClaude | ~23k | No gates — LLM-self-assessed confidence scoring | Different job |

### GitHub Spec Kit — direct competitor (workflow shape)

~111k stars, MIT, Python CLI `specify` + slash commands
(constitution→specify→clarify→plan→tasks→analyze→implement), extensions + presets,
30+ agent integrations.

- **Gate at source:** `scripts/bash/check-prerequisites.sh` is a real exit-code gate
  — on artifact file EXISTENCE (`--require-tasks` etc.), enforcing that
  spec.md/plan.md/tasks.md exist before the next phase. The workflow-engine "gate"
  step (`src/specify_cli/workflows/steps/gate/__init__.py`) is a human interactive
  approve/reject TTY prompt that falls back to PAUSED in CI. `/speckit.checklist` and
  `/speckit.analyze` are LLM-interpreted markdown ("unit tests for English"). No
  fact-check stage. Self-application: presets/self-test only, no receipts.
- **Best at:** reach. The most community-adopted tool in the category — the broadest
  agent support and the largest ecosystem of extensions.
- **Verdict:** direct competitor on workflow shape. Its gating is
  existence-check + human + LLM — no content-level executable gates. The existence
  check matters for Blueprint's own wording: Spec Kit DOES ship an exit-code gate
  script, so "only Blueprint has executable gates" would be false (see section c).
- Sources: github.com/github/spec-kit — README, `scripts/bash/check-prerequisites.sh`,
  `src/specify_cli/workflows/steps/gate/__init__.py` (read 2026-06-11).

### GSD / Get Shit Done — direct competitor (closest in spirit)

~64k stars in ~5 months (by TACHES; successor repo gsd-2 at ~7.7k). Meta-prompting +
SDD for Claude Code: REQUIREMENTS.md → PLAN.md → execute → SUMMARY.md →
VERIFICATION.md.

- **Gate at source:** a formal gate taxonomy (`get-shit-done/references/gates.md`)
  with four gate types — Pre-flight (blocks on missing artifacts), Revision loops
  (bounded at 3 iterations with stall detection), Escalation (pauses for human),
  Abort — plus a gate matrix mapping workflow phases to artifacts checked. Adversarial
  verifier agents (`agents/gsd-verifier.md`): "Do NOT trust SUMMARY.md claims...
  falsify the SUMMARY.md narrative", goal-backward verification, BLOCKER/WARNING
  classification. Gate EXECUTION is mostly LLM/prompt-side via the markdown
  references; a few real Node exit-code scripts exist (`bin/lib/ui-safety-gate.cjs`
  documents exit 0/1/2) plus a `pr-gate.yml` CI on its own repo.
- **Best at:** the adversarial-verifier stance — the strongest "distrust the agent's
  claims" posture in the field, and a formal gate vocabulary nobody else has. It
  verifies CODE claims against the codebase, not document claims against research
  sources.
- **Verdict:** closest direct competitor in spirit and the biggest threat — its
  growth proves demand for the verification-first pitch Blueprint shares. The
  difference is where verification runs: GSD's gates are predominantly LLM-enforced;
  the exit-code pieces are narrow.
- Sources: github.com/gsd-build/get-shit-done — repo tree, `agents/gsd-verifier.md`,
  `get-shit-done/references/gates.md`, `bin/lib/ui-safety-gate.cjs` (read 2026-06-11).

### AWS Kiro — direct competitor (different layer)

Amazon, commercial Code OSS-based IDE + CLI, GA (replaced Amazon Q Developer;
Bedrock-routed, Claude models). Specs = requirements.md (EARS notation) / design.md /
tasks.md; agent hooks as version-controlled JSON in `.kiro/hooks/`; checkpoints; team
plans.

- **Gate at source:** the headline GA capability is PROPERTY-BASED TESTING — Kiro
  translates EARS requirements into an "executable specification" and generates
  property tests checking that generated code matches the spec
  (kiro.dev/docs/specs/correctness). That is the most credible executable-verification
  story in the market — but it verifies code-vs-requirements, not stage progression;
  stage flow is IDE-guided with implicit human approval. No research/source-citation
  stage.
- **Best at:** property-based testing from requirements — genuinely executable spec
  verification at the code level, vendor-resourced.
- **Verdict:** direct competitor with the strongest executable-verification claim,
  operating at a different layer: IDE-bound, code-level, no document/evidence
  pipeline.
- Sources: kiro.dev/blog/general-availability/, kiro.dev/blog/property-based-testing/,
  kiro.dev/docs/specs/correctness/ (read 2026-06-11).

### OpenSpec — direct competitor (artifact discipline)

Fission-AI, ~54k stars, MIT, npm `@fission-ai/openspec`, Node 20+. Artifact-guided
workflow: `openspec/specs/` (living source of truth) + `changes/<id>/` (proposal.md,
spec deltas with ADDED/MODIFIED/REMOVED markers, design.md, tasks.md) → archive.

- **Gate at source:** `openspec validate --all --strict --json` is a real
  CI-runnable CLI validator — but it validates spec STRUCTURE/schema, not content or
  evidence. The README explicitly markets "no rigid phase gates" and attacks Spec Kit
  for having them. `/opsx:verify` (added 2026-02) is LLM-driven
  implementation-vs-spec checking. No fact-check.
- **Best at:** visible dogfooding — the only surveyed tool whose own repo carries its
  own methodology receipts: `openspec/changes/archive/` holds dated change folders
  (e.g. `2026-02-17-add-verify-skill` with proposal/design/specs/tasks). That is the
  closest existing thing to self-application receipts in the field, though OpenSpec
  doesn't market it. Also the strongest artifact discipline: every change requires
  the four-artifact folder.
- **Verdict:** direct competitor on artifact discipline and npm/Claude-skills
  distribution — and philosophically OPPOSED to blocking gates, which is the clean
  differentiation line.
- Sources: github.com/Fission-AI/OpenSpec — README, docs/cli.md,
  `openspec/changes/archive` tree (read 2026-06-11).

### BMAD-METHOD — direct competitor (breadth)

bmad-code-org, ~49k stars, MIT. v6 module ecosystem: 12+ role agents (PM, Architect,
Dev, UX), 34+ workflows, npm installer, web bundles (Gemini Gems / Custom GPTs) for
upfront research/brief/PRD/PRFAQ planning.

- **Gate at source:** none executable — checklists and handoffs are agent-run
  prompts. Artifact handoffs between agents (PRD→architecture→stories) are
  convention-enforced only. No fact-check (market-research workflows produce docs
  without claim tracing). No self-application.
- **Best at:** breadth. The only tool with Blueprint-comparable SCOPE — research and
  briefs through PRDs to implementation — and a large role-agent/workflow ecosystem
  serving it.
- **Verdict:** direct competitor on breadth, zero executable enforcement.
  (02-competitive-positioning.md named BMAD three times but never analyzed it; this
  entry closes that gap.)
- Sources: github.com/bmad-code-org/BMAD-METHOD — README (read 2026-06-11).

### PRP / PRPs-agentic-eng — partial overlap (closest philosophical neighbor)

Wirasm, ~2.2k stars, no license file. PRP = PRD + curated codebase intelligence +
runbook; `/prp-prd` → `/prp-plan` → `/prp-implement` "with validation loops";
`/prp-ralph` autonomous loop (Geoffrey Huntley's Ralph technique, stop-hook driven)
iterates until ALL validation commands pass (type-check, lint, tests, build), then
emits `<promise>COMPLETE</promise>`. Artifacts in `.claude/PRPs/`.

- **Gate at source:** genuinely executable validation — but the validations are
  standard code-quality commands gating "loop until green", not stage-progression
  artifact gates. No fact-check, no self-application.
- **Best at:** executable validation embedded in the artifact itself — the closest
  philosophical neighbor to Blueprint's gates, applied to implementation slices.
- **Verdict:** partial overlap — scope is implementation slices, not a product
  pipeline.
- Sources: github.com/Wirasm/PRPs-agentic-eng — README (read 2026-06-11).

### ruflo (formerly Claude Flow) — partial overlap (via SPARC plugin)

ruvnet/ruflo, ~59k stars, MIT. Agent meta-harness: swarms, adaptive memory, plugin
system.

- **Gate at source:** the relevant plugin is ruflo-sparc — 5-phase SPARC
  (Specification/Pseudocode/Architecture/Refinement/Completion) with "quality gates
  between each phase"; `sparc advance` attempts a gate check, gate results stored in
  memory tables (sparc-gates) for traceability. Verified in the plugin README: gates
  are orchestrator-agent-evaluated criteria (e.g. "covers all ACs"), not standalone
  exit-code scripts. `ruflo verify` is cryptographic supply-chain verification of
  ruflo's own installed bytes — integrity, not methodology receipts.
- **Best at:** orchestration scale — swarms, adaptive memory, a plugin ecosystem.
- **Verdict:** partial overlap via the SPARC plugin; the product's job is
  orchestration scale, not a method paper trail.
- Sources: github.com/ruvnet/ruflo — README, `plugins/ruflo-sparc/README.md`
  (read 2026-06-11).

### spec-workflow-mcp — partial overlap (mechanical human gate)

Pimzino, ~4.2k stars, GPL-3.0. MCP server: sequential Requirements→Design→Tasks,
real-time web dashboard + VSCode extension, approval workflow with revisions,
implementation logs.

- **Gate at source:** the MCP genuinely blocks until approved — the only other tool
  where "blocked until approved" is mechanical — but the check is a person through
  the dashboard, not a script. Sequential doc artifacts are required. No fact-check,
  no self-application. GPL-3.0 limits commercial embedding.
- **Best at:** mechanical blocking with a human in the loop, plus the live dashboard.
- **Verdict:** partial overlap.
- Sources: github.com/Pimzino/spec-workflow-mcp — README (read 2026-06-11).

### Tessl — partial overlap (different bet)

Commercial (Guy Podjarny, ex-Snyk; $125M from Index/Accel/GV/boldstart). Spec
Registry in open beta ("npm for specs", 10k+ library specs preventing API
hallucination); Framework in closed beta targeting spec-anchored/spec-as-source.
Human approval between spec and implementation.

- **Best at:** the Spec Registry — library specs at registry scale as an
  anti-hallucination substrate.
- **Verdict:** partial overlap, different bet — specs as source, not a gated
  pipeline.
- Sources: tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/
  (read 2026-06-11).

### Spec Kitty — partial overlap (small)

Priivacy-ai, ~1.3k stars, MIT. spec→plan→tasks→review→accept→merge CLI with kanban
dashboard, git worktrees, auto-merge.

- **Verdict:** partial overlap, small.
- Sources: github.com/Priivacy-ai/spec-kitty (read 2026-06-11).

### Intent — partial overlap (closed platform)

Augment Code, commercial "living specs platform". Coordinator drafts a blueprint,
dispatches parallel specialists; a Verifier catches incompatibilities pre-PR.

- **Best at:** parallel-specialist coordination with a built-in pre-PR verifier.
- **Verdict:** partial overlap, closed platform.
- Sources: augmentcode.com/tools/intent-vs-kiro,
  augmentcode.com/tools/best-spec-driven-development-tools (read 2026-06-11).

### Agent OS — different job

buildermethods/agent-os (Brian Casel / Builder Methods), ~4.8k stars, MIT, last push
2026-05-05. Repositioned in 2026 around standards: Discover Standards (extract
conventions from a codebase), Deploy Standards (inject contextually), Shape Spec,
Index Standards.

- **Best at:** standards extraction and contextual injection — making specs better by
  grounding them in the codebase's own conventions.
- **Verdict:** different job — context/standards injection; overlap only on "better
  specs". No gates, no fact-check, no artifact pipeline enforcement.
- Sources: github.com/buildermethods/agent-os — README (read 2026-06-11).

### Taskmaster (claude-task-master) — different job

eyaltoledano, ~27k stars, license NOASSERTION (MIT-with-Commons-Clause family; docs
at tryhamster.com). AI task management dropped into Cursor/Windsurf/etc: parse a PRD
into dependency-ordered tasks, expand/next/show, tags/workstreams, plus a `research`
command using a dedicated research model (Perplexity/xAI/OpenRouter) with project
context.

- **Best at:** PRD-to-dependency-ordered-task decomposition, and the dedicated
  research-model command.
- **Verdict:** different job — a task orchestration layer; its research command is
  informational, not evidentiary (no claims traced to sources). No gates.
- Sources: github.com/eyaltoledano/claude-task-master — README (read 2026-06-11).

### SuperClaude — different job

SuperClaude-Org, ~23k stars, MIT, last push 2026-04. Claude Code configuration
framework: commands, cognitive personas, modes, MCP integrations.

- **Gate at source:** its "confidence-based validation" is deep-research quality
  scoring — LLM-self-assessed source credibility 0.0-1.0 (threshold 0.6, target
  0.8) — not traced citations, not executable. No gates, no artifact pipeline, no
  self-application.
- **Best at:** breadth of Claude Code augmentation — personas, modes, MCP wiring.
- **Verdict:** different job — prompt/config augmentation. Reads as a 2025
  phenomenon: no longer in the top tier of 2026 community comparison tables.
- Sources: github.com/SuperClaude-Org/SuperClaude_Framework — README
  (read 2026-06-11).

### Not source-read this pass (flagged, not analyzed)

- **Superpowers** (obra, ~224k stars, on the official Claude marketplace since Jan
  2026) — the community's closest thing to a default per the Reddit scene read, with
  rising verbosity complaints in-thread. Its gate mechanics were NOT source-read this
  pass; no capability claims made here. Highest-priority follow-up read.
- **"Hermes"** — appears in landscape chatter; no substantive repo surfaced.
- **gstack** (~109k per the community comparison table) — appears in the community
  shortlist; not examined.
- **mattpocock/skills** (Matt Pocock / AI Hero — Total TypeScript's newer education
  business) — read as an addendum pass, 2026-07-13, separate from the 2026-06-11
  batch above. Verified via GitHub API: 168,175 stars, MIT license, pushed same day
  as this read. Repo structure checked (`scripts/` holds only `link-skills.sh` and
  `list-skills.sh` — installer plumbing, no gate/verification script found at that
  level). The ~20-skill roster (from its own README) spans the same lifecycle this
  landscape covers — research, `to-spec`, `to-tickets`, `implement`, `tdd`,
  `code-review`, `domain-modeling`, `diagnosing-bugs` — plus a `wayfinder` skill
  that maps foggy, too-large-for-one-session initiatives as a decision-ticket tree
  on the issue tracker before detailed specs exist. Individual skill prompt files
  (e.g. `code-review.md`, `grilling.md`) were NOT source-read this pass, so no gate
  mechanism is claimed — same caveat as the Superpowers row. What's real and
  distinctive: AI Hero's paid-course/newsletter audience backs this free repo, a
  distribution funnel no other row in this table has.

---

## (c) Whitespace — the unclaimed combination

The skeptical net across all 14 source-read tools. The combination nobody else
claims:

1. **Stage gates that are Node scripts with exit codes, checking artifact CONTENT
   and evidence, runnable in CI.** Everyone else gates via humans (Spec Kit's gate
   step, spec-workflow-mcp's dashboard, Tessl's approvals), LLM judgment (BMAD,
   SPARC, GSD's verifiers, /speckit.checklist), or code-quality loops (PRP, Kiro's
   property tests). **The wording caveat is load-bearing:** Spec Kit's
   `check-prerequisites.sh` IS an exit-code artifact gate — on file existence — so
   "only Blueprint has executable gates" overclaims. The defensible claim is
   "executable gates on artifact content and evidence, not just existence."
2. **A document-level fact-check stage tracing prose claims to research evidence
   paths.** Kiro verifies code against EARS requirements; GSD verifies code against
   the agent's own SUMMARY.md claims. Both are code-level. Nobody verifies DOCUMENTS
   against sources.
3. **Self-application receipts as a feature.** Only OpenSpec's
   `openspec/changes/archive/` comes close, and it is unmarketed.
4. **Product-scope pipeline.** Every SDD tool gates a code-feature pipeline
   (spec→plan→tasks→implement). None runs a seven-stage PRODUCT pipeline
   (research→design→prototype→fact-check→documents→deploy→iterate) producing strategy
   documents with evidence paths. BMAD is the only one with comparable breadth, and
   it has zero executable enforcement.

GSD's growth (~64k stars in ~5 months) is the demand evidence: the
verification-first pitch Blueprint shares is what the market is currently rewarding.

### Where Blueprint sits — its own caveats, stated plainly

The whitespace is real, but Blueprint's row carries its own flags:

- **Stage skills are Claude-Code-only.** The gates are portable Node, but the
  delivery surface (hooks/skills/CLAUDE.md injection) assumes Claude Code. A
  Cursor/Copilot team gets the docs, not the enforcement. Spec Kit, BMAD, and
  OpenSpec span many agents.
- **Adoption is one team engagement in flight plus one independent adopter.** Not a
  community. Every direct competitor above has more users than Blueprint.
- **The gates verify artifacts and copy; they don't make the work good.** An
  exit-code gate proves the evidence trail exists and the claims trace — it cannot
  prove the strategy is right or the prototype is the right prototype. Fowler's
  "false sense of control" criticism applies to over-trusting ANY gate, including
  these.

---

## (d) Reception evidence — what happens when methodology tools launch

### Hacker News base rates (Algolia API, 892 comparable Show HN posts, 2025-01 through 2026-06)

Distribution across the AI-coding-methodology/workflow space (via `search_by_date`,
which is not popularity-biased): median 2 points; 89.2% finish under 10 points; 6.7%
at 10-49; 4.0% at 50+. 67.2% land at 1-3 points with zero comments.

The "methodology" framing specifically underperforms even that base rate:

- **BMAD: 0-for-8.** Eight submissions 2025-08 through 2026-03 scored 4, 2, 2, 2, 2,
  2, 1, 1 points — zero comments on all. A methodology repo with tens of thousands of
  GitHub stars has effectively never registered on HN. The most direct comparable for
  a branded methodology launch.
- **Spec Kit: ~20 submissions for one 84-point hit.** GitHub's own brand needed ~20
  submissions over two months for a single 84-pt/42-cmt result (2025-11-03,
  hn:45798473); the next best was 15 pts; the other ~18 got 1-7. Fowler's ANALYSIS of
  SDD tools (128 pts) outperformed the tools themselves — commentary about
  methodology beats the methodology artifact.
- **Kiro's 1063-pt launch is not a counterexample** — that was an Amazon IDE product
  launch with a new artifact; its methodology-flavored follow-ups regressed (GA
  announcement: 7 pts).
- **The outlier:** GSD hit 473 pts/253 cmt (2026-03-17, hn:47417804) — profane
  memorable name, free runnable repo — and its top comments were still skeptical
  ("absolutely tore through tokens"). Points bought debate, not adoption consensus.

What 50+ point winners share: a falsifiable number in the title (Forge "53% to 99%",
687 pts), a runnable demo artifact (Godot-games skill, 337 pts), a pain-first hook
("Stop Claude Code from forgetting everything", 202 pts), known-builder credibility,
one concrete mechanism. None led with "methodology", "framework", or "spec-driven"
as the lead noun except GSD. What flops share: bare repo links with abstract category
titles, umbrella systems with no number and no demo, re-submissions, consultant
vocabulary. Process pitches without an artifact get dismissed as consultant-ware;
process attached to a runnable artifact gets argued with — which is what points look
like.

Honest base rate for a Blueprint-style launch (methodology + CLI + reviewer fleet,
solo non-famous author): modal outcome 1-3 points and zero comments; P(<10) ~ 0.89;
P(10-49) ~ 0.07; P(50+) ~ 0.04. Multiple submissions are normal and cheap. Expect
adversarial top comments about waterfall and token burn at any score.

### Reddit (r/ClaudeAI, r/ClaudeCode — live-session reads, June 2026)

- **The genre is saturated and has a backlash genre that outscores it.** "Please stop
  creating 'memory for your agent' frameworks" (r/ClaudeCode, 2026-02) got 254
  pts/156 cmt — more than almost any framework launch. Framework launches cap at
  roughly 50-250 pts; practitioner experience reports massively outperform them
  (2.3k pts for "6 Months of Hardcore Use").
- **The standing community question is obsolescence**, not selection: "Are
  spec-driven frameworks like Agent OS, BMAD, Superpowers or SpecKit still worth
  using, or have Claude Code and Codex made them redundant?" (2026-05). The
  community's own comparison repo concludes "All major workflows converge on the same
  architectural pattern: Research → Plan → Execute → Review → Ship" — a staged
  pipeline is commodity shape there, not novelty.
- **What cuts through:** anti-ceremony positioning (GSD launched as "For People Tired
  of Enterprise Theatre Frameworks"), evidence posts with numbers ("76K lines... 118
  functions up to 446x slower", 488 pts), meta-comparisons that name incumbents
  side-by-side, and long-horizon practitioner logs.
- **Vocabulary findings:** "spec-driven development"/"SDD" is fully lexicalized;
  "context engineering" and "harness" are established (Anthropic-endorsed); "Ralph
  loop" is the native term for autonomous looping. **"Gates" is NOT codified** — the
  community's working words are plan mode, phases, pipeline, verify, review,
  constitution, worktrees, subagents, skills. Cost objections have a fixed
  vocabulary: "token hungry", "token burn", "bloat", "ceremony", "death by
  structure", "enterprise theatre".
- **Visible unmet asks that map to Blueprint:** efficacy evidence ("Are there any
  real benchmarks showing these AI coding tools actually work?"),
  multi-session/multi-developer agent coordination ("cross-coordination between
  their agents is very lacking. MD files do not cut the mustard"), durable artifacts
  that survive context resets. The evidence-trail/self-application story maps to
  these; the pipeline stages do not.

---

## (e) Implications — inputs to the positioning decision

Recorded as decisions-inputs, not decisions. Each traces to the evidence above.

1. **Comparison content first, launch announcements never.** The launch-announcement
   genre is capped (HN: BMAD 0-for-8; Reddit: reflexive sarcasm). The formats that
   work are honest comparisons where Blueprint is one row among named incumbents —
   BMAD, Spec Kit, Superpowers, GSD must be named, generously — and practitioner
   experience reports with numbers. This document is the substrate for that content.
2. **"Gates" needs glossing.** The word is not codified in the community's
   vocabulary; gloss it as verification steps on first use. Speak
   SDD/context-engineering/harness natively — they are lexicalized.
3. **Token cost is the first objection on every framework thread.** Answer it in the
   first screen of anything public, in the community's own vocabulary ("token
   hungry", "ceremony").
4. **Never claim "the only executable gates."** Spec Kit's check-prerequisites.sh is
   an exit-code gate on file existence. The defensible claim: executable gates on
   artifact content and evidence.
5. **Lead with one falsifiable number or a 60-second runnable demo**, never with
   "methodology"/"framework"/"spec-driven" as the lead noun. The self-application
   receipts are the candidate numbers.
6. **A "what this doesn't do / when not to use it" section is the trust currency.**
   Anti-ceremony self-awareness is how GSD cut through; Blueprint's caveats (section
   c) belong in the public copy, not just here.
7. **The differentiated asks Blueprint can actually answer** are efficacy evidence,
   coordination across sessions/operators, and durable artifacts — not "we have
   stages" (commodity shape).

---

## Method + verification flags

- Four parallel agents, 2026-06-11: internal re-read (committed research vs current
  repo/npm state), live landscape (source-level reads of the repos/pages cited
  per-tool above), HN history (Algolia API: 9 relevance queries + 7 date-ordered
  queries for the unbiased distribution; thread-level comment reads on 4 key
  threads), Reddit scene (Reddit search/comments JSON via live browser session,
  top-of-year sort; pullpush.io archive ends May 2025, so coverage is point-in-time).
  Full transcript not published (matches the convention in 00-recon-synthesis.md).
- Star counts: GitHub API, 2026-06-11 — approximate and perishable.
- Upvote counts: point-in-time; r/ClaudeCode comment sampling was top-10 per thread.
- Superpowers, gstack: NOT source-read; star counts only. No gate claims made.
- mattpocock/skills: addendum pass, 2026-07-13 (not part of the 2026-06-11 batch).
  Star count/license/repo-structure verified via GitHub API same day; individual
  skill files NOT source-read. No gate claims made.
- specdriven.com/landscape returned 403 to direct fetch; existence confirmed via
  search.
- Corrections welcome: if a claim about your tool is wrong, open an issue on this
  repo.

## Sources

**Landscape addendum (2026-07-13):**
- github.com/mattpocock/skills (GitHub API: stargazers_count, license, pushed_at, contents/ and contents/scripts/ listing)
- aihero.dev/skills-wayfinder
- aihero.dev

**Landscape (source-level reads, 2026-06-11):**
- github.com/github/spec-kit (README; scripts/bash/check-prerequisites.sh; src/specify_cli/workflows/steps/gate/__init__.py)
- github.com/gsd-build/get-shit-done (repo tree; agents/gsd-verifier.md; get-shit-done/references/gates.md; bin/lib/ui-safety-gate.cjs)
- github.com/Fission-AI/OpenSpec (README; docs/cli.md; openspec/changes/archive tree)
- github.com/bmad-code-org/BMAD-METHOD (README)
- github.com/Wirasm/PRPs-agentic-eng (README)
- github.com/ruvnet/ruflo (README; plugins/ruflo-sparc/README.md)
- github.com/Pimzino/spec-workflow-mcp (README)
- github.com/buildermethods/agent-os (README)
- github.com/eyaltoledano/claude-task-master (README)
- github.com/SuperClaude-Org/SuperClaude_Framework (README)
- github.com/Priivacy-ai/spec-kitty
- kiro.dev/blog/general-availability/; kiro.dev/blog/property-based-testing/; kiro.dev/docs/specs/correctness/
- tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/
- augmentcode.com/tools/intent-vs-kiro; augmentcode.com/tools/best-spec-driven-development-tools
- martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- specdriven.com/landscape/ (403 to fetch; existence via search); softwareseni.com 30-plus-framework landscape piece; marktechpost.com 9-best-SDD-tools comparison

**HN (Algolia API):**
- hn.algolia.com/api/v1/search and search_by_date queries: "spec-driven", "Show HN" spec-driven, claude code workflow, agent orchestration, coding agents, context engineering, AI code review, spec-kit (32 deduped submissions), Kiro (50 stories), BMAD (8 submissions), superpowers claude, Ralph agent loop
- Thread reads: items/47417804 (GSD), items/47197595 (VSDD), items/45148180 (Disciplined LLM Collaboration), items/45935763 (Waterfall Strikes Back)

**Reddit (live-session JSON, top/year, 2026-06-11):**
- r/ClaudeCode/comments/1t2mym5 (spec-driven frameworks still worth using?, 2026-05); r/ClaudeAI/comments/1sybpya (11 workflow systems compared, 2026-04); r/ClaudeCode/comments/1r4asf6 (please stop creating memory frameworks, 2026-02); r/ClaudeAI/comments/1q4yjo0 (GSD launch, 2026-01); r/ClaudeCode/comments/1pba1ud (SDD comparison, 2025-12); r/ClaudeCode/comments/1ok1qxf (2025-10); r/ClaudeCode/comments/1nys03c (SuperClaude vs Claude Flow vs BMAD, 2025-10); r/ClaudeAI/comments/1sgltdd (2026-04); r/ClaudeAI/comments/1lquetd (Claude Code Divide, 2025-07); SuperClaude launch thread (2025-06)
- github.com/shanraisshan/claude-code-best-practice (community 11-workflow comparison + "all workflows converge" conclusion)
- GitHub API star counts (2026-06-11): obra/superpowers ~224k; github/spec-kit ~111k; gsd-build/get-shit-done ~64k; Fission-AI/OpenSpec ~54k; bmad-code-org/BMAD-METHOD ~49k; SuperClaude-Org/SuperClaude_Framework ~23k

**Internal re-read (2026-06-11):**
- research/02-competitive-positioning.md; research/01-canonical-research.md; research/00-recon-synthesis.md; CLAUDE.md; npm view @nino-chavez-labs/blueprint-cli (live: 0.3.0); template/.claude/agents/blueprint/reviewers/*.mjs count (15)
