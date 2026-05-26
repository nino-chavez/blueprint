---
canonical: false
---

# Methodology Amendments — blueprint-redesign

This file captures methodology-level learnings specific to this initiative. Append at the top; supersede via new entry; never rewrite history. Full convention: `~/Workspace/dev/wip/blueprint/template/docs/methodology/methodology-amendments-convention.md`.

This initiative is unique: it IS Blueprint applied to itself. Every methodology gap surfaced here is a first-hand data point on the canonical methodology, since the same operator runs both repos sequentially per the methodology freeze rule.

---

<!-- Entries below, newest first. -->

## 2026-05-25 — Pattern B `prototype/index.html` title template collides when project name contains "Blueprint"

**Trigger**: The canonical template at `~/Workspace/dev/wip/blueprint/template/portal/prototype/index.html` line 7 declares `<title>Prototype Studio — PROJECT_NAME Blueprint</title>`. When `PROJECT_NAME` is substituted with this consumer's display name "Blueprint Redesign", the rendered title becomes "Prototype Studio — Blueprint Redesign Blueprint" — a visible duplication in the browser tab.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 2 (commit `3eb88be` in `wip/blueprint/`). Methodology chose amendment option 1 (drop trailing " Blueprint" suffix from `<title>` tags) instead of option 2 (substitution dedupe) because investigation showed `PROJECT_NAME` is not auto-substituted by `stamp.mjs` — it's a manual operator step per `portal/README.md`. The brand bar's runtime `deriveProductName` already strips " Blueprint" from the manifest `name` for display, so title-tag alignment is consistency, not regression. Pick up via `--mode=restamp-chrome` after next manual `<title>` pass.

For typical consumer names ("rally-hq", "subs-initiative", "website-nc-v3") the convention reads naturally: "Prototype Studio — rally-hq Blueprint". The template's substitution assumes consumer project names will not already contain the word "Blueprint" — an assumption this initiative is the first to violate, since it is Blueprint applied to itself.

`prototype/index.html` is NOT in `PATTERN_B_CHROME_FILES` (confirmed by reading `template/tools/blueprint-init/stamp.mjs` line 46–55) so the consumer can hand-edit the `<title>` without tripping the chrome-canonical reviewer. The hand-edit is the unblock; the methodology gap remains.

Candidate solutions for methodology promotion:

1. **Drop the trailing "Blueprint" suffix from the template**: change canonical to `<title>Prototype Studio — PROJECT_NAME</title>`. Cleaner across all consumers; loses the "this is a Blueprint deliverable" cue in the tab.
2. **Detect and dedupe in substitution**: extend `stamp.mjs` substitutions to check whether `PROJECT_NAME` ends with "Blueprint" (case-insensitive) and skip the suffix when it does. Preserves the cue for normal consumers; handles the dogfooding case automatically.

Option 2 is more general (also handles future "Foo Blueprint" or "Blueprint Studio" project names) and is invisible to consumers whose names don't trigger it. Recommend option 2.

**References**:
- Consumer-side fix in this commit: `portal/prototype/index.html` line 7
- Template source: `~/Workspace/dev/wip/blueprint/template/portal/prototype/index.html` line 7
- Chrome manifest (confirms `prototype/index.html` is consumer-owned): `template/tools/blueprint-init/stamp.mjs` line 46–55

---

## 2026-05-25 — Pattern B docs viewer requires markdown duplication into portal/_docs/

**Trigger**: Migrating blueprint-redesign from its custom path-index `docs/index.html` to the canonical sidebar viewer (wave 4 of the 2026-05-25 reconciliation) required copying 9 markdown files from canonical authoring paths (`decisions/`, `research/competitive/`, `research/current-state/`, `research/architecture/`) into `portal/_docs/` because the canonical viewer fetches `/_docs/<id>.md` directly with no path-mapping layer.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 4 (commit `b9ecc90` in `wip/blueprint/`) + ADR-0003. Methodology chose amendment option 1 (build step). `_meta/index.json` `docs.tiers[].docs[]` schema extended with optional `source` field; `template/portal/scripts/prep-deploy.sh` rewritten as manifest-driven (no more hardcoded Rally HQ SOURCES table). Consumer migration here: add `source` field to each of the 9 doc entries in this initiative's `_meta/index.json` pointing at the canonical authoring path, then delete the 9 duplicated copies from `portal/_docs/` and let `prep-deploy.sh` re-sync them.

The canonical viewer was just shipped (commit `86baf7c`) and has zero published consumers yet — blueprint-redesign is the first to consume it. The duplication cost is real:

- 9 markdown files now exist in two paths (canonical authoring path + `portal/_docs/<prefixed-id>.md`)
- Edits in one place don't propagate; the operator has to remember to sync
- Cloudflare Pages deploys only see `portal/_docs/` (parent paths are outside the Pages root), so symlinks fail at deploy

Candidate solutions for methodology promotion:

1. **Build step**: `scripts/sync-portal-docs.sh` that runs on Cloudflare Pages build, copies canonical paths → `portal/_docs/`. Single source authoring; rendered copy at deploy. Adds a build step to the "static HTML, zero build" Pattern B claim.
2. **Manifest path mapping**: extend `docs.tiers[].docs[]` entries with `{ id, title, source: "decisions/01-prescription.md" }`. Viewer reads `source` to resolve fetch URL when present. Requires the consumer's portal to deploy with the parent directory inside the deploy root.
3. **Author in `portal/_docs/` directly**: move docs FROM canonical paths INTO `portal/_docs/`. Breaks the canonical doc-discipline directory convention but gives the viewer a single source.

Option 1 is most aligned with how Pattern B consumers operate (rally-hq, subs-initiative both deploy from their portal root). Recommend the methodology surface this as an open ADR.

**References**:
- Migration commit (this initiative): TBD after commit lands
- Methodology canonical viewer: `~/Workspace/dev/wip/blueprint/template/portal/docs/index.html` line 691 (`fetch('/_docs/${docId}.md')`)
- Trigger conversation: dogfooding migration of blueprint-redesign to wave-4 methodology

---

## 2026-05-25 — Template's CONVENTIONS.md + OWNER-SPEC.md docs not audited in wave 4 storage-key rename

**Trigger**: After running `stamp.mjs --mode=restamp-chrome --pattern=B` on blueprint-redesign and pulling the latest `template/portal/CONVENTIONS.md`, `proto-annotate.OWNER-SPEC.md`, and `proto-nav.OWNER-SPEC.md` from the methodology repo, the docs STILL contain stale `rally-anno-enabled`, `rally-anno-notes-v1`, `rally-hq-blueprint-chrome-preview` storage-key references. The wave 4 audit updated the JS code paths (which the chrome restamp delivers byte-identical to consumers) but did not audit the prose documentation that ships alongside the chrome.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 3 (commit `68d85f9` in `wip/blueprint/`). Methodology chose amendment option 2 (fix this time, defer manifest extension to a future ADR if a third audit-miss occurs). 7 stale refs in `CONVENTIONS.md` + `proto-annotate.OWNER-SPEC.md` + `chat.OWNER-SPEC.md` migrated to `blueprint-*` namespace, audited against the JS source of truth. Pick up via next manual sync of these prose docs into this initiative's `portal/` directory (these files are consumer-owned copies, not chrome-canonical).

A consumer reading `CONVENTIONS.md` line 8 sees `localStorage.setItem('rally-anno-enabled','true')` and would integrate their tooling against the wrong key. The chrome-canonical-reviewer doesn't catch this because it only diffs `PATTERN_B_CHROME_FILES` (8 files) — the prose docs are not in the manifest.

Candidate solutions for methodology promotion:

1. **Extend PATTERN_B_CHROME_FILES with the prose docs**: add `CONVENTIONS.md`, `proto-annotate.OWNER-SPEC.md`, `proto-nav.OWNER-SPEC.md` to the chrome manifest. Restamp pulls latest; consumers can't drift these. Risk: consumers may want project-specific append-only sections; chrome manifest forbids edits.
2. **Re-audit the prose docs in the methodology repo and ship a fix commit** (the simpler, lower-risk move). Pair with a manifest extension only if a second drift incident occurs.

Recommend option 2 short-term; track option 1 as a future ADR if a third audit miss occurs.

**References**:
- Stale references confirmed: `grep "rally-anno-" template/portal/CONVENTIONS.md template/portal/proto-annotate.OWNER-SPEC.md`
- Wave 4 commit that should have caught this: `86baf7c`

---

## 2026-05-25 — Operating in the wrong directory on dogfooding work

**Trigger**: A session opened in `wip/blueprint/` (the methodology repo) to "continue the work on applying blueprint to itself" — and ran 4 substantive commits on the methodology repo before realizing the dogfooding consumer at `wip/blueprint-redesign/` was the intended target. The methodology-repo commits were independently legitimate (encoding waves 2–4 of the 2026-05-25 reconciliation), but the dogfooding exercise was paused for a full session by operator/agent confusion about which repo was which.

**Scope**: Candidate for methodology promotion
**Status**: Resolved 2026-05-25 by methodology wave 6 fix 1 (commit `0cc1f9b` in `wip/blueprint/`). Methodology chose amendment option 2 (per-repo CLAUDE.md opening-line convention). New `wip/blueprint/CLAUDE.md` declares "Repo role: I am the Blueprint methodology source"; `wip/blueprint/template/CLAUDE.md` opens with "Repo role: I am a Blueprint consumer initiative." Both include `pwd`-check guidance. This consumer's `CLAUDE.md` was already updated with the same convention at `a35a1e2` (the consumer-side patch that surfaced this amendment).

The mismatch is structural: methodology source (`wip/blueprint/`) and dogfooding consumer (`wip/blueprint-redesign/`) have similar-shaped names, both contain Blueprint artifacts, and both have legitimate parallel work streams. The methodology freeze rule (`template/CLAUDE.md` § 2) sequences them — but doesn't help the operator notice WHICH repo a session is supposed to operate in.

Candidate solutions for methodology promotion:

1. **SessionStart hook check**: when opening a session in a Blueprint-shaped repo, the hook should print the repo's role (methodology source vs consumer initiative) prominently. The existing `blueprint-session-start.py` hook walks up for `blueprint.yml` — extend it to ALSO detect whether `cwd` matches `wip/blueprint/` (methodology source) and print a distinct banner.
2. **Per-repo `.claude/CLAUDE.md` opening line**: methodology repo and consumer repo each declare "I am the methodology source / I am consumer initiative X" as the first sentence of their CLAUDE.md. The session opener can't miss it.

Recommend option 2 (no code, just convention). Option 1 is the harder encoding if option 2 fails.

**References**:
- This session's commits in the wrong-then-right directory: `wip/blueprint/` at `0731ccb`, `ecedef3`, `86baf7c`, `6d4a3d8` (all methodology-side, legitimate)
- The recovery: `wip/blueprint-redesign/` migration (this commit)
