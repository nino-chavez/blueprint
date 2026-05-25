---
canonical: true
type: methodology-pattern
status: ratified
version: 1
last_updated: 2026-05-23
reference_implementation: subs-initiative (canary state-derive, 2026-05-23)
---

# OWNER-SPEC pattern

A two-layer pattern for capturing durable expert knowledge on substrate tools, with mechanical freshness automation.

## The problem

Every project accumulates one-off substrate primitives — derive tools, lint scripts, dashboards, ingesters, automation hooks. Their design rationale lives in operator heads, scattered Hive issues, and fragmented memory entries. Future sessions inherit confidently-misleading interfaces to undocumented complexity. Six months later the operator can't remember WHY they built a tool a specific way, and a fresh agent session has no source of truth to read.

The temptation is to build "expert-on-call agents" that wrap these tools. Without grounded knowledge, those agents confidently hallucinate from stale fragments — a worse problem than no agent at all.

## The pattern

**Two layers, in this order:**

### Layer A — `OWNER-SPEC.md` per substrate tool

A single canonical doc per substrate tool that captures durable expert knowledge. Lives at `tools/<tool-name>/OWNER-SPEC.md` (or `apps/<surface>/OWNER-SPEC.md` for app-level concerns). Read by humans, future sessions, and skill-mediated agents.

Required structure (machine-validated via lint):

```yaml
---
tool: <tool-name>
last_attested: <YYYY-MM-DD>
max_unattested_days: <int>
couples_with:
  - docs/decisions/NNNN-*.md
  - tools/<sibling>/
convention_version: 1
---

# Owner-spec: <tool-name>

## Purpose         — one paragraph; what it's for
## Why this shape  — alternatives considered + rejected
## Inputs/outputs  — what it reads/writes
## Failure modes seen — production incidents
## Coupling        — what breaks if this changes
## Maintainer playbook — how to add features, danger zones
## Known limits    — deferred decisions, escape hatches
```

### Layer B — Skill-mediated expert agent

Once an OWNER-SPEC exists and has been validated against real questions, a skill at `~/.claude/skills/<tool>-expert/SKILL.md` becomes the agent interface to the knowledge. The skill:

- Reads the OWNER-SPEC first as authority
- Inspects the actual code as truth
- When they disagree, surfaces drift (recommends re-attestation rather than silently working around)
- Refuses to fabricate cross-refs; flags OWNER-SPEC gaps explicitly
- Operates as expert-on-call for that tool

**Critical:** Never define a skill where the OWNER-SPEC doesn't exist. The skill will confidently hallucinate. **Layer-A-first** discipline is the central invariant.

## Mechanical freshness automation (the triggers axis)

Stale OWNER-SPECs are worse than no OWNER-SPECs — they confidently mislead. `tools/owner-spec-lint/` enforces freshness mechanically.

### Per-PR coupling check (warn, not block)

When a PR touches `tools/<x>/**` files, the lint expects `tools/<x>/OWNER-SPEC.md` to also be touched. If not, emits a GH Actions warning. Not blocking — small fixes (typo, test add) shouldn't require OWNER-SPEC churn.

### Nightly staleness report

`tools/owner-spec-lint/staleness.ts` walks every OWNER-SPEC and emits findings into `docs/audits/derived/_owner-spec-staleness.{json,md}`:

- OWNER-SPECs whose `last_attested + max_unattested_days < now()` AND whose tool dir has churned since
- OWNER-SPECs whose `couples_with` paths have been modified since `last_attested`

Surfaces on the project's status page under `/derive` alongside other derived health signals.

### Re-attestation

When the operator confirms an OWNER-SPEC is still accurate, they bump `last_attested:` to today. Same lifecycle pattern as the human-attestation substrate — manual flip, machine-tracked state, periodic re-attestation.

## Anti-patterns

| Anti-pattern | What goes wrong |
|---|---|
| **Skill without OWNER-SPEC** | Skill confidently hallucinates from training data + stale code reading |
| **Bulk-create OWNER-SPECs on the same day** | All expire on the same day → re-attestation cliff |
| **OWNER-SPEC as code-comment dump** | Misses the "why" + "what breaks if"; duplicates README |
| **Optional frontmatter** | `last_attested:` missing → staleness lint can't fire |
| **Ignore the per-PR warning indefinitely** | Pattern decays into "dead docs you ignore" |
| **Auto-flip `last_attested:` via CI** | Defeats the discipline; the operator confirming reality is the point |

## Tiering (stagger expiry cadence)

To avoid clumped re-attestation events, tier `max_unattested_days` per tool importance:

| Tier | max_unattested_days | When |
|---|---:|---|
| **Tier 1** (load-bearing primitives, CI-blocking output) | 60 | Substrate cascade, derive-state, hive-board-derive equivalents |
| **Tier 2** (significant primitives, lower urgency) | 90 | Dashboards, secondary derives, sweep tools |
| **Tier 3** (small surface, low-churn) | 180 | Utility scripts, signal aggregators |
| **Cohort docs** (multiple tools, one OWNER-SPEC) | 90–120 | Workflow substrate, harness hooks, Tier-3 cohort |

Stagger naturally so re-attestation happens in 3–4 batches across the year, not one annual cliff.

## When to write one

**Required for:**
- Substrate primitives (derive tools, lint scripts, dashboards)
- Any tool whose output is depended on by CI workflows
- Any tool whose design rationale required a `[Spec]` or `[Decision]` to ratify

**Not required for:**
- Trivial scripts (<50 lines, single-purpose, fully obvious from `--help`)
- One-shot migration scripts that won't be re-run
- Forks/customizations of off-the-shelf tools where upstream docs cover the surface

When in doubt: write one. The 30 minutes of authoring beats the 3 hours of re-derivation six months later.

## Inventory tracking

Maintain `docs/methodology/owner-spec-inventory.md` listing tools that should retro-acquire an OWNER-SPEC, ranked by tier. The per-PR lint only warns about EXISTING OWNER-SPECs; the inventory is the only "what's missing" tracker.

As OWNER-SPECs land, strike them from the inventory's "Inventory completed" table.

## Reference implementation

**subs-initiative** is the canary project (2026-05-23):
- Convention: `docs/methodology/owner-spec-convention.md`
- Canary OWNER-SPEC: `tools/state-derive/OWNER-SPEC.md`
- Lint: `tools/owner-spec-lint/`
- 28 OWNER-SPEC files across 5 Tier-1 tools, 11 Tier-2 tools, 10 Tier-3 cohort tools, 2 cohort docs (workflows + harness hooks)
- 5 Layer-B skills (one per Tier-1 tool)

## Activation in blueprint projects

When a project enables the OWNER-SPEC pattern:

1. **Copy the convention** at `template/docs/methodology/owner-spec-convention.md` into the project
2. **Copy the lint tool** at `template/tools/owner-spec-lint/` (zero deps; vendored)
3. **Copy both workflows** at `template/.github/workflows/owner-spec-{lint,staleness-nightly}.yml`
4. **Author OWNER-SPECs** for any substrate tools the project carries — start with one canary, prove the pattern, expand to other Tier-1 tools as natural maintenance touches them
5. **Add the working rule** to project CLAUDE.md under "Working rules":

   > **Substrate tools carry an `OWNER-SPEC.md`.** See `docs/methodology/owner-spec-convention.md`.

6. **Optionally build skills** at `~/.claude/skills/<tool>-expert/` once OWNER-SPECs have been validated

The pattern is portable across projects — methodology compounds regardless of project-specific stack choices.

## Cross-references

- [archaeology-substrate-pattern](archaeology-substrate-pattern.md) — substrate's memory; consumed by Layer-B skills via chat-island queries
- [doc-surface-discipline-pattern](doc-surface-discipline-pattern.md) — broader "the docs themselves are substrate" discipline that OWNER-SPECs participate in
- [register-pattern](register-pattern.md) — single-doc-as-register; OWNER-SPECs are a register for substrate-tool design rationale
- [inventory-as-evidence-pattern](inventory-as-evidence-pattern.md) — `owner-spec-inventory.md` is an inventory-as-evidence artifact
