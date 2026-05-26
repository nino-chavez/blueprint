---
canonical: true
stage: 1
status: seeded
sources:
  - 01-ai-hive-as-companion.md
  - ../competitive/01-lopopolo-harness-engineering.md
  - ../competitive/02-appleton-zero-alignment.md
  - ../competitive/03-adjacent-tools.md
  - ../architecture/01-hive-cli-vs-mcp-with-optionality.md
---

# Current-state Blueprint — production-quality gap inventory

Eight gaps, ordered by what a new adopter would hit first. Each gap maps to (a) the named pattern from a primary source that closes it, (b) the evidence in the current Blueprint repo, and (c) what closing the gap looks like in Stage 2 prescription.

## Gap 1 — Distribution is filesystem-coupled

**What an adopter hits.** "Where is Blueprint?" The answer today is *"clone `github.com/nino-chavez/blueprint` to `~/Workspace/dev/wip/blueprint/`."* Path-coupled. Breaks for anyone who doesn't mirror Nino's workspace layout. The `template/.claude/hooks/blueprint-session-start.py` defaults `BLUEPRINT_HOME` to `~/Workspace/dev/wip/blueprint`; consumers have to set the env var or replicate the path.

**Named pattern that closes it.** Universal across scaffolder tooling (Backstage, CRA, Vite, Yeoman, Cookiecutter): one-command `npx <name> init` distribution. ai-hive's Mode A (`claude mcp add --transport http hive <url>`) is the equivalent for runtime-substrate.

**Evidence in repo.** `template/.claude/hooks/blueprint-session-start.py` line resolving `BLUEPRINT_HOME` to a filesystem path. `template/CLAUDE.md` references like `~/Workspace/dev/wip/blueprint/docs/variant-selection.md`.

**Prescription shape.** Publish `@blueprint/cli` to npm. `npx @blueprint/cli init` invokes the L5 stamper. The methodology repo is accessed via a versioned canonical URL or a packaged-with-the-CLI bundle, not a filesystem path. Both modes (npx invoke + local clone for power users) supported.

---

## Gap 2 — No versioning or upgrade path

**What an adopter hits.** "What version of Blueprint am I on?" No answer. No semver. No changelog beyond git log. When the methodology evolves, consumer initiatives have no signal that an upgrade is available, and no migration guide to follow. The `docs/prompts/pick-up-blueprint-updates.md` prompt is the human migration mechanism.

**Named pattern that closes it.** Semver releases (universal). Backstage's CHANGELOG.md + semver. ai-hive's D1 schema migrations + Worker deploy versioning. npm package versioning.

**Evidence in repo.** No `VERSION` file. No `CHANGELOG.md` at root. Methodology evolves via git commits with no version-pin discipline.

**Prescription shape.** Adopt semver. Each release tagged + published to npm. Changelog auto-generated from conventional commits (the repo already uses `feat()`/`chore()`/`docs()` prefixes — half the discipline is in place). Consumer `blueprint.yml` declares `methodology_version: 1.x.x`; the SessionStart hook checks compatibility on session open.

---

## Gap 3 — Discoverability is "Nino tells someone about it"

**What an adopter hits.** "What is Blueprint?" Answer: read METHODOLOGY.md cold on GitHub. There is no marketing surface, no hosted docs site, no example gallery, no quickstart screencast. New operators learn it by reading the repo.

**Named pattern that closes it.** Hosted docs site (Backstage's docs.backstage.io, Next.js's nextjs.org, Linear's developers.linear.app). Public reference deploy that demonstrates the tool on itself (ai-hive's `ai-hive-mcp.example-account.workers.dev`).

**Evidence in repo.** No docs site. No deploy. The `template/portal/` exists as a template but no hosted "Blueprint applied to Blueprint" instance shows the methodology in action.

**Prescription shape.** The Blueprint-redesign initiative *is itself the response to this gap.* The Pattern B portal at `wip/blueprint-redesign/portal/` becomes the hosted Blueprint reference. Deploy at `blueprint.<some-tld>` (custom domain) or `blueprint-redesign.pages.dev` (initial). The portal demonstrates the methodology by being its own deliverable.

---

## Gap 4 — Reviewers are Claude-Code-locked

**What an adopter hits.** "Can I run the conformance reviewers in CI?" No. The reviewer agents are markdown specs invoked by Claude Code's Agent tool. A consumer using Cursor / Codex / Copilot / a custom harness has no path. A CI workflow has no path. The reviewers are audit specs an agent reads; they're not lint-shaped invocable tools.

**Named pattern that closes it.** Lopopolo: *"custom linters (Codex-generated, of course!) and structural tests"* with error messages that *"inject remediation instructions into agent context."* Backstage's plugin SDK pattern (per-template policies as code, not docs). ai-hive's MCP-as-tool-surface pattern.

**Evidence in repo.** `template/.claude/agents/blueprint/reviewers/portal-pattern-{a,b}-conformance-reviewer.md` — both are markdown describing what to check. The L6 wiring (Stage 3 + portal-touching-commit gates) tells an agent *when* to run them; it doesn't make them executable code.

**Prescription shape.** Reviewers become executable. Each markdown spec gets a paired `.mjs` (or `.ts`) implementation that runs without an agent. CLI: `blueprint review portal-pattern-a --target=./apps/portal/` returns PASS/BLOCKED/WARN as structured output. MCP tool: the same logic wrapped as `blueprint_review_portal_pattern_a` for in-session agent enforcement. CI workflow: GitHub Action calling the CLI on every PR. Error output injects remediation instructions per Lopopolo's pattern.

---

## Gap 5 — No tests on the stamper or reviewers

**What an adopter hits.** The stamper at `template/tools/blueprint-init/stamp.mjs` has one smoke test (the run I executed this morning). The reviewer specs have no automated harness verifying they catch what they claim to catch. If I break the stamper's banner-injection logic, no test fails.

**Named pattern that closes it.** Lopopolo: *"100% test coverage"* on internal helpers. Backstage's contract tests for scaffolders. ai-hive's GitHub Actions deploy validation.

**Evidence in repo.** No `test/` directory under `template/tools/`. No CI workflow that exercises the stamper against a known-good fixture.

**Prescription shape.** Contract tests for each reviewer: a fixture directory representing a passing portal + a fixture representing each failure mode (missing audience switcher, renamed routes, etc.); the reviewer runs against each and the test asserts the expected PASS/BLOCKED/WARN. Stamper has integration tests: stamp into a temp dir, assert the substitution table applied correctly, assert the mechanical grep passes. All wired into CI on the methodology repo. ai-hive's `.github/workflows/` pattern is the reference.

---

## Gap 6 — No telemetry / feedback loop

**What an adopter hits.** The methodology accumulates only via Nino's direct observation. If 30 consumers adopt Blueprint and 25 of them get stuck at the same Stage 1 → Stage 2 transition, there's no way to surface that. The encoded-response loop relies on Nino noticing failure modes in his own sessions.

**Named pattern that closes it.** Lopopolo's "doc-gardening agent" — a recurring background task that scans for stale/inconsistent docs and opens fix-up PRs. Anonymous opt-in telemetry (sentry-style) for CLI invocations. Adoption-pattern dashboards.

**Evidence in repo.** No telemetry. No usage dashboard. The 2026-05-25 four-way drift was caught only because Nino personally read three sessions' outputs and noticed disagreement.

**Prescription shape.** Two parts: (a) optional anonymous CLI telemetry — `blueprint stage-completed`, `blueprint reviewer-blocked` events posted to a Cloudflare-hosted aggregator; operators opt in via `blueprint config set telemetry.enabled=true`. (b) Methodology-gardening agent — a scheduled Claude Code task that runs against the methodology repo, scans for inconsistencies between METHODOLOGY.md, the reviewer specs, and the stamper behavior, and opens PRs to fix drift. Per Lopopolo: continuous payment, not painful bursts.

---

## Gap 7 — Onboarding is "paste the right prompt"

**What an adopter hits.** A new operator has to know to paste `docs/prompts/add-blueprint-to-project.md` in a fresh session. The decision to adopt Blueprint is gated on knowing the right prompt exists. The methodology hides itself behind a UX cliff.

**Named pattern that closes it.** ai-hive's 5-minute Mode A onboarding (`claude mcp add ... && /mcp`). CRA-style scaffold flow (`npx create-next-app && cd && npm run dev`). Linear's sign-up tour.

**Evidence in repo.** `docs/prompts/add-blueprint-to-project.md` (just rewritten today as part of the L1–L8 work) — improved but still a paste-prompt UX, not an inline-tool UX.

**Prescription shape.** Replace paste-prompt with `npx @blueprint/cli init`. The CLI handles the variant + tier + pattern decision tree interactively (per the existing prompts but as an inquirer-style flow). It stamps the scaffold via the L5 stamper. It installs the SessionStart hook automatically. The paste-prompt remains as a fallback for operators who prefer not to install Node tooling.

---

## Gap 8 — No integration surface

**What an adopter hits.** Blueprint doesn't talk to anything. No Linear/Jira sync, no Slack notifications, no PR comments on portal-touching commits. The artifacts are durable; the *workflow integration* isn't.

**Named pattern that closes it.** ai-hive's GitHub Actions `hive-closure-sync.yml` (issue closure → hive lifecycle event). Linear/Jira webhook ecosystems. Backstage's GitHub / GitLab / Jira plugins.

**Evidence in repo.** No GitHub Actions workflows in `template/.github/`. No mention of Slack / Linear / Jira anywhere in the methodology.

**Prescription shape.** Defer most of this. Pick the two highest-leverage integrations for v1: (a) GitHub Actions runner that invokes the conformance reviewers on every PR (closes Gap 4 + Gap 8 simultaneously); (b) GitHub issue derive → portal Inspect route (mirrors subs-initiative hive-board-derive). All other tracker integrations stay opt-in plugins post-v1.

---

## Gap 9 — Pattern B template is rally-hq with placeholders

**What an adopter hits.** Within hours of scaffolding a Pattern B portal during this initiative (2026-05-25, late afternoon), the front-door page rendered rally-hq's lane cards ("Validate · Operate · Phased plan: Phase 1 (~17 hrs) free-mode launch keystones..."), the `/docs/` index rendered rally-hq's doc taxonomy (`cx-strategy`, `business-model`, `monetization-narrative`), the chat backend's system prompt declared "You are a research/design assistant grounded in the Rally HQ Blueprint," and `proto-nav.js` rendered tournament-lifecycle UI. The `template/portal/` directory in `wip/blueprint/` is rally-hq's portal copy-pasted with three (3) `PROJECT_NAME` placeholders. Everything else — lane cards in `index.html`, system prompt + `HTTP-Referer` in `functions/api/chat.js`, doc taxonomy in `docs/index.html`, tournament-lifecycle UI in `proto-nav.js`, `--tournament-accent` CSS variables in `shared.css`, JSDoc references to JTBD in `_portal-shell.js` — was inherited verbatim. The methodology repo's "Pattern B template" is not a template; it's a snapshot of rally-hq.

**How it manifests.** A new initiative scaffolds Pattern B by `cp -r template/portal/` per the documented flow (Pattern B has no stamper — L5 deferred it). The three placeholders get replaced. The HTTP 200 smoke test passes. The portal renders rally-hq's content under the new project's branding. Self-attestation, unchecked, ships a portal that says "rally-hq-blueprint · synthetic design study" in the footer of a different initiative.

**Named pattern that closes it.** Mechanically-checkable stamping (Cookiecutter, Backstage's scaffolder, Hygen). The L5 Pattern A stamper at `template/tools/blueprint-init/stamp.mjs` already proves the pattern works in this stack. Pattern B's substitution surface is wider than the L5 deferral named — not just project-name and repo-url, but also lane-card content, chat system prompts, doc index, navigation hrefs, and aesthetic CSS variable names.

**Evidence in repo.** Grep reproduces it mechanically:
```bash
grep -rln "rally-hq\|tournament\|JTBD\|cx-strategy\|monetization-narrative\|free-mode launch" \
  wip/blueprint/template/portal/
```
Returns ~25 matches across index.html, proto-nav.js, shared.css, _portal-shell.js, chat-widget.js, docs/index.html, functions/api/chat.js. None of these are placeholder strings — they're actual rally-hq content.

**Prescription shape revision.** This gap is the wrong shape for the original prescription's deferred-Pattern-B-stamper assumption. Two changes follow:

1. **Pattern B stamper escalates from v2 to Wedge 1.** `npx @blueprint/cli init --pattern=B` must work mechanically, with a substitution surface that covers the lane cards, chat backend, doc index, and CSS variable names — not just the three `PROJECT_NAME` placeholders. Ships alongside the Pattern A flow.
2. **`template/portal/` regenerates as a generic substrate.** Before the Pattern B stamper can work, the source has to stop being rally-hq's portal. The template either gets stripped of rally-hq specifics (preserving only the Pattern B shell primitives — drawers, comparison toggle, chat FAB, I-2/I-3/I-5 invariants) or gets re-extracted from a different reference (any non-rally-hq Pattern B initiative). This is a methodology-repo PR that lands once the L8 freeze lifts (i.e., after this redesign initiative settles).

**Why this isn't an L5 mistake (and why it's an L5-adjacent learning).** L5's stamper covered Pattern A specifically. The deferral language for Pattern B (in `template/tools/blueprint-init/README.md`) said "Pattern B has a narrower substitution surface (project name in `index.html`, repo URL in `functions/api/chat.js`, brand in `_portal-shell.js`)." That assessment was wrong — the substitution surface is wide. The Pattern B reviewer at `portal-pattern-b-conformance-reviewer.md` was supposed to catch this at Stage 3, but the reviewer is a markdown spec invoked by an agent, gated on portal-touching commits in `apps/portal/` or `portal/` — and the Stage 3 gate didn't fire because the initiative copy-stamped its portal at Stage 1, not Stage 3. **The reviewer wired-but-not-actually-blocking is a separate methodology bug** (call it Gap 9.5) but the load-bearing finding is the template content.

---

## Summary — the nine gaps mapped to their closures

| # | Gap | Named pattern that closes it | Maps to which prescription wedge |
|---|---|---|---|
| 1 | Filesystem-coupled distribution | `npx <name> init` | Distribution shape |
| 2 | No versioning | Semver + changelog | Distribution shape |
| 3 | Discoverability | Hosted reference deploy | Self-applying redesign |
| 4 | Reviewers are Claude-Code-locked | Executable lints with remediation injection | Agent portability |
| 5 | No tests | Contract tests + CI | Production discipline |
| 6 | No telemetry | Doc-gardening agent + opt-in telemetry | Continuous-payment maintenance |
| 7 | Onboarding | CLI scaffold flow | Distribution shape |
| 8 | No integrations | GitHub Actions + portal-side derive | Wedge-narrow integration |
| 9 | Pattern B template is rally-hq with placeholders | Mechanically-checkable Pattern B stamper + regenerated generic substrate | Distribution shape |

Six of nine collapse into two prescription wedges:

- **Distribution wedge** (Gaps 1, 2, 7, 9): `npx @blueprint/cli init` + semver + changelog + interactive scaffold flow + Pattern B stamper. **Wedge 1 now ships both Pattern A and Pattern B stampers, not just Pattern A.**
- **Agent portability wedge** (Gap 4 + half of Gap 8): reviewers become executable lints, callable as CLI subcommands AND MCP tools AND GitHub Actions.

The other three (Gaps 3, 5, 6) are independent prescription items:

- **Self-applying redesign**: this initiative produces the hosted reference deploy that closes Gap 3.
- **Contract tests in CI**: closes Gap 5 — straightforward engineering work, no methodology change.
- **Methodology-gardening agent**: closes Gap 6 — a recurring background task that scans for drift. Lower priority for v1 because consumer scale is currently small; high priority for v2 when consumer count grows.

## What gets explicitly deferred

- **Multi-operator real-time alignment surface.** That's Appleton's Ace's territory. Blueprint leans on ai-hive (already exists) for async-blackboard coordination and explicitly does NOT try to replicate Ace's real-time workspace. Defer indefinitely.
- **Custom-stack Pattern A variants** (`@blueprint/ui-svelte`, `@blueprint/ui-next`). Defer until a real consumer initiative needs a non-React variant.
- **Tracker integrations beyond GitHub** (Linear / Jira). Defer until v2; opt-in plugins post-v1.
- **Hosted SaaS Blueprint instance** with multi-tenancy / billing / etc. Defer indefinitely. Blueprint's value isn't multi-tenant; it's the methodology-plus-scaffolding-as-distributable-artifact.

## Output: the prescription has two load-bearing wedges

When Stage 2 prescription is written, the two wedges above are the spine:

1. **Distribution wedge** — `npx @blueprint/cli init` with both Pattern A and Pattern B stampers, semver, hosted reference deploy, interactive scaffold flow. Closes Gaps 1, 2, 7, 9.
2. **Agent portability wedge** — executable reviewers via CLI + MCP + GitHub Actions, with remediation-injection error messages. Closes Gap 4 and half of Gap 8.

Three independent items hang off them (tests in CI, methodology-gardening agent, contract-test discipline). Everything else defers.

This is what the redesigned portal communicates to stakeholders: "production-quality Blueprint closes these two wedges + three independent items; here's what each looks like in prototype form."

## Discovery note — Gap 9

Gap 9 was discovered late on 2026-05-25 during Stage 3 prototype work on this initiative. The redesign portal's index.html was showing rally-hq's lane cards. The root cause traced back to `wip/blueprint/template/portal/` being a rally-hq snapshot with three placeholders, not a generic Pattern B substrate. The L8 methodology-freeze rule (added the same morning) prevents fixing the methodology repo mid-redesign; the fix lands as a methodology-repo PR once this initiative settles. In the meantime, the redesign portal's runtime-facing files (index.html, docs/index.html, functions/api/chat.js, _portal-shell.js, proto-nav.js) were edited locally to strip rally-hq content.

The reviewer agent that *should* have caught this at scaffold time (`portal-pattern-b-conformance-reviewer.md`) is gated on Stage 3 commits in the portal directory — but the rally-hq content arrived during Stage 0 (template copy-stamp), before the Stage 3 gate fires. **The reviewer's trigger is wired at the wrong stage for this failure mode.** Sub-gap 9.5 to track.
