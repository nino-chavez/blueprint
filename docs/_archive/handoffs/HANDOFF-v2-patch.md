# Handoff — Blueprint v2 Patch (Harness Engineering)

**Session date**: 2026-05-25
**Status**: Increment 1 landed and validated against two live initiatives. Increments 2–3 not started.
**Resume by reading**: this file → `METHODOLOGY-v2-harness-engineering-patch.md` → `docs/browser-legibility.md`.

## What this work is

A patch to Blueprint methodology distilled from OpenAI's *Harness engineering: leveraging Codex in an agent-first world* (Ryan Lopopolo, Feb 11, 2026). The patch adds an Application Legibility stage, replaces one-shot fact-check with a multi-reviewer convergence loop, restructures the per-initiative knowledge base, and codifies four cross-cutting disciplines.

Source PDF: `/Users/nino/Downloads/Harness engineering_ leveraging Codex in an agent-first world _ OpenAI.pdf`

## What landed this session

### Methodology layer (`tools/blueprint/`)

| File | What it is |
|---|---|
| `METHODOLOGY-v2-harness-engineering-patch.md` | Full proposal — separate doc for reversibility. Has not been merged into `METHODOLOGY.md` yet. |
| `docs/browser-legibility.md` | Canonical Stage 0 reference — browse-tool default + four-trigger MCP escalation rubric |
| `template/CLAUDE.md` | Stage 0 block added (browse-tool default + escalation table) |
| `README.md` | Registered browser-legibility.md in the Reference Library table |

### First consumer (`apps/rally-hq/blueprint/`)

| File | What it is |
|---|---|
| `CLAUDE.md` | New — initiative-scoped Stage 0 with concrete recipe against `serve.sh` on port 8765 |

**Validation**: booted `serve.sh` → ran the full recipe → confirmed `window.PROTO_PAGE` resolves on inner pages → clean teardown. End-to-end green.

### Second consumer (`apps/website-nc-v3/blueprint/`)

| File | What it is |
|---|---|
| `CLAUDE.md` | New — Stage 0 recipe adapted for v3's three-stage (diagnose/prescription/brief) variant |
| `serve.sh` | New — local server on port 8766 (Rally HQ holds 8765, both can run concurrently) |

**Validation**: same end-to-end pass. `window.PROTO_PAGE` on `case-ask-dad.html` resolved cleanly. One finding worth noting (below).

## What's still pending

### Immediate cleanup (10-minute task)

- **Promote Stage 0 from the v2 patch into `METHODOLOGY.md`.** Stage 0 is now validated against two live initiatives; leaving it in the proposal doc creates two sources of truth. Single Edit to insert a new section before current Stage 1, plus a note in the v2 patch marking Stage 0 as "landed." This is the recommended next slice on resume.

### Increment 2 — Ralph Wiggum Loop (not started)

Five reviewer agents need Claude Code subagent definitions before the loop can run:

| Agent | Validates |
|---|---|
| `citation-checker` | Every market-research citation + strategy-panel claim resolves to a real source |
| `current-state-claim-verifier` | "What exists today" claims match screenshots in `current-state/` |
| `doc-quality-auditor` | Four-check audit (so-what placement, mental math, logic gaps, scannable format) |
| `terminology-linter` | No internal jargon leaks into user-facing copy |
| `prototype-smoke-runner` | `@smoke`-tagged tests pass against local boot |

Plus the orchestrator that fans out, collects results, and decides convergence.

**Open questions** (must resolve before drafting agents):

1. **Reviewer agent location** — shared at `tools/blueprint/template/.claude/agents/` (every initiative inherits improvements) vs per-initiative (each project tunes thresholds). Trade-off: shared = compounding leverage, per-initiative = tunability.
2. **Convergence loop runtime** — single orchestrator agent that fans out and merges results (simpler), or worktree-per-reviewer via `Agent` tool with `isolation: "worktree"` (more honest about isolation, matches the multi-session-work-isolation rule in `~/.claude/CLAUDE.md`).
3. **Smoke-flake policy** — block on any `@smoke` failure (Blueprint's VP-clicks-share-link audience argues for this) vs follow-up runs (Codex's throughput argument). Resolution: probably block, because Blueprint's audience is different from Codex's, but worth confirming.

### Increment 3 — Map-not-manual + janitor + invariants (not started)

- Restructure `template/` to use short `AGENTS.md` (~100 lines) + structured `docs/` tree with `design-docs/`, `exec-plans/active|completed|tech-debt-tracker/`, `product-specs/`, `references/`, `quality-scores.md`
- Add `verification-status` column convention to design-docs index
- Activate continuous janitor (drop the >50-docs threshold)

Lowest urgency of the three increments — only bites large initiatives, and subs-initiative is the only existing one near that threshold.

### Items outside the three increments

- **DESIGN.md architectural-invariants section** — append four invariants to `template/prototype/DESIGN.md`:
  1. Boundary parsing required (library unconstrained — model picks Zod/Valibot/etc.)
  2. Strategy-panel pages declare own metadata via `window.PROTO_PAGE = { id }`
  3. Cross-cutting concerns through single Providers interface
  4. One primary CTA per page promoted to structural lint check
- **Lint errors as remediation prompts** — rewrite custom lint error messages to include the fix, not just the violation. Cheap, high-multiplier per Codex's pattern.
- **"Agent struggle = missing capability" promoted to Origin section** of `METHODOLOGY.md`. Currently in the v2 patch + two consumer CLAUDE.md files, not in canonical methodology.

### Rollout to remaining consumers

| Consumer | Status |
|---|---|
| `wip/subs-initiative/` | **Gated** — waits on next active session. Reason: 10 days idle, dual-shell layout (`prototype/` legacy Vite+React + `portal/`), existing top-level CLAUDE.md needing careful merge. Touching it cold is the kind of churn Codex's post explicitly warned against. |
| `wip/atelier-dashboard-blueprint/` | **Skip** — cold (2 weeks idle), explicitly deprioritized in this session |

## Findings worth remembering

1. **Recipe transfers cleanly between portal-shell initiatives** with only URL/path adjustments. Rally HQ → website-nc-v3 was a copy-edit, not a redesign.
2. **Per-page selectors are initiative-specific.** website-nc-v3's front-door case-study link query returned empty `[]` because the cluster IA uses card components, not direct anchor tags. The recipe is a *pattern*, not a *contract* — each CLAUDE.md selects its own queries. Worth codifying as guidance if it bites a third initiative.
3. **Profile-name override is necessary.** Default profile name = cwd basename = `blueprint`, which would collide across initiatives. Always override with `--profile-name <initiative-slug>-blueprint`.
4. **Port allocation matters.** Rally HQ holds 8765, website-nc-v3 holds 8766. Future initiatives should claim the next port up so all initiatives can run concurrently for cross-comparison.
5. **Parent CLAUDE.md vs blueprint CLAUDE.md scoping is load-bearing.** website-nc-v3's parent already established browse-tool as preferred — the blueprint CLAUDE.md inherits and only adds the recipe. Don't repeat parent context; reference it.

## Recommended resume sequence

1. **Read this handoff doc + the v2 patch doc** to restore context (5 min).
2. **Promote Stage 0 to METHODOLOGY.md** — small cleanup, removes doc drift (10 min).
3. **Resolve the three open questions for Increment 2** — async with Nino, or by writing them into ADRs in `tools/blueprint/docs/decisions/` if that pattern doesn't exist yet (30 min).
4. **Draft the five reviewer agents** as Claude Code subagent definitions in the location resolved at step 3 (2-3 hours).
5. **Wire the orchestrator** for the convergence loop (1-2 hours).
6. **Validate against Rally HQ** — same pattern as Stage 0 validation. Rally HQ stays the canonical first-application target.

## What this patch deliberately does NOT propose

- Throwing out the seven-stage pipeline. The pipeline is the value; this patch upgrades its sensors.
- Adopting Codex's "minimal blocking merge gates" for the stakeholder share-link. Blueprint's audience is different.
- Adopting Codex's "0 lines of manually-written code" constraint. Blueprint produces strategic deliverables, not end-to-end products.

## Cross-references

- v2 patch source: `tools/blueprint/METHODOLOGY-v2-harness-engineering-patch.md`
- Stage 0 reference: `tools/blueprint/docs/browser-legibility.md`
- Template: `tools/blueprint/template/CLAUDE.md`
- Rally HQ live consumer: `apps/rally-hq/blueprint/CLAUDE.md`
- v3 live consumer: `apps/website-nc-v3/blueprint/CLAUDE.md`
- browse-tool: `tools/browse-tool/` (README is the canonical interface ref)
- Original conversation context: this session's transcript references the harness PDF + builds on prior "going-forward on rallyhq" direction
