---
canonical: true
type: methodology
status: ratified
version: 1
last_updated: 2026-05-23
---

# OWNER-SPEC convention

A single canonical doc per substrate tool that captures durable expert knowledge — the operator's diary for the tool. Read by humans, future sessions, and skill-mediated agents. Lives at `tools/<tool-name>/OWNER-SPEC.md` (or `apps/<surface>/OWNER-SPEC.md` for app-level concerns).

## Why this exists

Substrate tools (state-derive, hive-board-derive, archaeology, attestation-derive, code-review-bot, frontmatter-lint, derive-state-on-main workflows, claude session-mining hooks, etc.) accumulate as one-off scripts. Their design rationale lives in operator heads, scattered Hive issues, and fragmented memory entries. Future sessions inherit a confidently-misleading interface to undocumented complexity.

`OWNER-SPEC.md` solves the foundation problem. Once foundation exists, skill-mediated expert agents become a cheap, accurate interface to it (see `~/.claude/skills/<tool>-expert/`).

## What goes in an OWNER-SPEC

Required sections, in order:

```markdown
---
tool: <tool-name>
last_attested: <YYYY-MM-DD>
max_unattested_days: <int>      # how stale before staleness lint flags
output_schema_hash: <hex>        # optional; computed from a stable subset of the tool's output
couples_with:                    # paths/files whose changes may invalidate this OWNER-SPEC
  - docs/decisions/NNNN-*.md
  - tools/<sibling>/
  - apps/<surface>/
convention_version: 1            # which version of this convention doc the OWNER-SPEC follows
---

# Owner-spec: <tool-name>

## Purpose
One paragraph: what this tool exists for.

## Why this shape
Alternatives considered + rejected. Design constraints that bound the implementation.

## Inputs / outputs
What it reads, what it writes, expected formats. Reference the output schema hash if applicable.

## Failure modes seen
Production incidents, what they taught us. Cross-reference Hive issues / commits / ADRs.

## Coupling
Other substrate that breaks if this changes. Should match the frontmatter `couples_with` list.

## Maintainer playbook
- How to add a feature
- Common edits and where they go
- Danger zones — what NOT to touch without deep thought

## Open questions / known limits
Deferred decisions, known imprecisions, escape hatches.
```

## Staleness automation

OWNER-SPECs that go stale silently are worse than no OWNER-SPECs. The convention is enforced by `tools/owner-spec-lint/`:

### Per-PR check (warn, not block)

When a PR touches `tools/<x>/**` files, the lint expects `tools/<x>/OWNER-SPEC.md` to also be touched. If not, emit a warning on the PR with a link to this convention. Not blocking — small fixes (typo, test addition) shouldn't require touching the OWNER-SPEC. But the warning surfaces the question.

### Nightly periodic check (report)

`tools/owner-spec-lint/staleness.ts` walks every `OWNER-SPEC.md` and emits a report into `docs/audits/derived/_owner-spec-staleness.{json,md}` listing:

- OWNER-SPECs whose `last_attested + max_unattested_days < now()` AND whose tool directory has had commits since `last_attested`
- OWNER-SPECs whose `couples_with` paths have changed since `last_attested`
- OWNER-SPECs whose `output_schema_hash` no longer matches the actual tool output (if declared)

Surfaces on the status page under `/derive` so the operator sees pending owner-spec attestations alongside the rest of the substrate health.

### Re-attestation

When the operator (or a session) confirms the OWNER-SPEC is still accurate, they bump `last_attested:` to today's date in the frontmatter. This is the same lifecycle pattern as the human-attestation substrate (Hive #1269) — manual flip, machine-tracked state, periodic re-attestation.

## When to write one

Required for:
- Substrate primitives: state-derive, hive-board-derive, attestation-derive, archaeology, code-review-bot, frontmatter-lint
- Any tool whose output is depended on by CI workflows
- Any tool whose design rationale required a `[Spec]` or `[Decision]` to ratify

Not required for:
- Trivial scripts (<50 lines, single-purpose, fully obvious from `--help`)
- One-shot migration scripts that won't be re-run
- Forks/customizations of off-the-shelf tools where upstream docs cover the surface

When in doubt: write one. The 30 minutes of authoring beats the 3 hours of re-derivation six months later.

## When to update one

The frontmatter triggers + the per-PR lint enforce most cases. Manual triggers:

1. **Feature add** — the maintainer playbook section gets a new entry, last_attested bumps.
2. **Failure mode learned** — append to "Failure modes seen", bump last_attested.
3. **Coupling change** — referenced ADR amended, sibling tool refactored: update `couples_with`, bump last_attested.
4. **Convention version bump** — this doc evolves to v2: each OWNER-SPEC needs `convention_version: 2` + a confirmation that it still satisfies the v2 contract.

## Skill-mediated agents (Layer B)

Once an OWNER-SPEC exists, define a skill at `~/.claude/skills/<tool>-expert/` that:
- Reads the OWNER-SPEC as its primary knowledge source
- Has Read/Grep/Bash tools to inspect the actual implementation
- Operates as expert-on-call for that tool

The skill answers questions like:
- "Why does state-derive output JSON not SQLite?"
- "What happens if I add a new check primitive?"
- "Is this output mismatch a regression or expected?"

Skills are cheap to spin up (~1 hour each) BUT only useful when grounded in an accurate OWNER-SPEC. Don't define a skill without first writing the OWNER-SPEC; the skill will just confidently hallucinate.

## Anti-patterns

- **OWNER-SPEC as code-comment dump.** The README covers what; the OWNER-SPEC covers why, when-to-touch, and what-breaks-if.
- **Optional-everywhere frontmatter.** If `last_attested` is missing, staleness lint can't fire. The convention requires it.
- **Skill-first.** Defining `~/.claude/skills/state-derive-expert/` before writing `tools/state-derive/OWNER-SPEC.md` produces a confident-but-ungrounded agent. Always Layer A first.
- **Bulk-creating OWNER-SPECs without re-attestation cadence.** Writing 8 OWNER-SPECs in one weekend creates 8 documents that all expire on the same day. Stagger creation; let `last_attested` dates spread naturally.

## Cross-refs

- Pattern home: this doc + `tools/owner-spec-lint/`
- First canary: `tools/state-derive/OWNER-SPEC.md`
- Companion substrate: human-attestation substrate per Hive #1269
- Convention compounding: portable per [Hive #1519](the subscriptions initiative's repo (private)/issues/1519) — methodology compounds regardless of fork outcome
- Big-blueprint replication: template adoption is operator-driven; do after state-derive canary proves the pattern
