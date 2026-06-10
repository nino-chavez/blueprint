# Register Pattern — Immutable Append-Only Knowledge Stores

**Purpose:** Capture the shape used by knowledge registers (invalidated-paths, differentiators, known-limitations, etc.) — numbered entries, source citations, immutable once added, single file with domain sections, supersession via reference. The pattern inoculates against re-litigation of settled questions.

**Last updated:** 2026-05-16

**Source:** `subs-initiative/docs/differentiators.md` (May 2026) was the first instance — distilled into a reusable pattern during Hive #929 doc-reorg work when the paired `invalidated-paths.md` register was added.

---

## What problem this solves

Without a register, "we already considered this" knowledge lives scattered: ADR `Superseded-by` chains, synthesis notes from months ago, memory entries in agent persistence, casual mentions in PR descriptions. When a new proposal lands that re-relitigates a settled question, the reviewer either:

1. Doesn't know it was already settled → re-runs the analysis → wastes the cycle and possibly lands the wrong call
2. Vaguely remembers it was settled → has to spend an hour reconstructing the context to prove it
3. Knows it was settled but can't cite cleanly → the proposer feels stonewalled

A register makes "we already considered this" *citable* in seconds.

## The shape

A single markdown file with:

1. **Frontmatter:** `canonical: true` (the register IS canonical decision-lineage)
2. **Preamble** describing what the register is, what it's for, what it's NOT for, authority (each entry must cite source), maintenance cadence
3. **Source audits / source list** linking to upstream artifacts that seeded entries
4. **Numbered entries** in `## XX-NN — <title>` form, where `XX` is the register's prefix (`D-` for differentiators, `IP-` for invalidated-paths, `KL-` for known-limitations, etc.)
5. **Per-entry structure:**
   - `**Source:** <ADR + synthesis + memory + audit refs>`
   - `**Ruled out:** <date>` (for invalidated-paths) OR `**Claim:** <one line>` (for differentiators)
   - `**What was proposed / claimed:** <one line>`
   - `**Why ruled out / Why it's a differentiator:** <reason>`
   - `**Where future proposals hit this:** <pattern future agents will recognize>` (key for invalidated-paths)
   - `**Evidence:** <code paths, state-derive entries, screenshots>` (for differentiators)

## Invariants

These rules are what make the register a register and not just a doc:

1. **Immutable once added.** Entries are never rewritten. New understanding goes in a new entry that references the prior (`Supersedes: IP-05`).
2. **Source-cited.** Every entry names the ADR / synthesis ID / memory entry / audit that established the claim. No source = no entry.
3. **Append-only.** New entries get the next sequential number. Numbers never reused.
4. **Single file.** Splitting into per-domain files creates cross-link maintenance cost without payoff at typical register sizes. Use section headers for domains within the file.
5. **Section headers by domain** when the register has >10 entries: Architecture / Methodology / Process / Platform / etc. Allows skim-by-domain without splitting the file.

## Two standard instances

### Invalidated-Paths register — `docs/invalidated-paths.md`

**High-value default.** Apply to any project with at least one major pivot in its history.

Captures "we ruled out X, here's why and when, here's the pattern future proposals will hit." Each entry shapes future agents' search — when a new proposal says "let's split the delivery repo," the agent finds `IP-01 — Separate delivery repos per surface — Ruled out 2026-05-08` and either drops the proposal or files it as an explicit revision rather than a fresh question.

Seed retroactively by combing:
- ADR `Superseded-by` chains (the supersession itself is an invalidated-path)
- Synthesis notes that name "we considered X and rejected because Y"
- Memory entries flagged as pivots
- Major audit findings that reversed prior claims

### Differentiators register — `docs/differentiators.md`

**Optional, project-dependent.** Apply when the project has identifiable peer products and competitive positioning matters.

Captures "things this project already does that comparable products don't" — for partner/engineering-review evidence, for protecting against erosion (a future PR that would unwind a differentiator hits the entry), and as ADR cross-reference target.

Skip if the project has no direct peer products or competitive positioning is irrelevant (internal tooling, research projects, single-purpose utilities).

## Other instances the pattern supports

- **Known-limitations register** (`docs/known-limitations.md`) — solo projects without a marketplace. "What this can't do today and the constraint behind why" — useful when the limitation is intentional and explaining it once beats answering the same question repeatedly.
- **Vendor-edge-case register** (`docs/vendor-edge-cases.md`) — when a project integrates with a platform that has documented surprises. Each entry: edge case, vendor confirmation source, how the project handles it.
- **Anti-pattern register** (`docs/anti-patterns.md`) — when the project's domain has well-known wrong-paths that look right (e.g., "do not auto-retry on test failure without checking billing first" — the GHA-billing-block case from subs-initiative).

In each case the shape is identical: numbered entries, source citations, immutable, single file with section headers.

## Activation thresholds

| Register | Activates when |
|---|---|
| Invalidated-paths | ≥1 major pivot has happened; project has persistent multi-session work |
| Differentiators | Project has identifiable peer products; partner/review evidence matters |
| Known-limitations | Solo / non-marketplace project with recurring "can it do X?" questions |
| Vendor-edge-case | Project integrates with a platform that has documented surprises |
| Anti-pattern | Project's domain has well-known wrong-paths the team keeps hitting |

Don't preemptively create empty registers — they look like aspirations and rot. Create when there's ≥3 seed entries ready to land.

## Maintenance cadence

- **On ratification of a new ADR with deferred-build or supersession:** add the corresponding invalidated-path entry in the same PR. Mirror of the ADR-Spec pairing rule.
- **On synthesis of a `[Decision]` that resolves a fork:** if the rejected option is the kind of thing future agents would re-propose, add an invalidated-path entry.
- **Quarterly review** (optional): walk the register, mark entries as `## ARCHIVED` if their context no longer applies (very rare — usually a "ruled out" stays ruled out forever).

## Template skeletons

Copy from:
- `template/docs/invalidated-paths.md` — empty register with seed instructions
- `template/docs/differentiators.md` — empty register with seed instructions (optional per project)

Both ship with `canonical: true` frontmatter, the preamble structure, and example entries that the project customizes or deletes.

## Companion patterns

- **`doc-surface-discipline-pattern.md`** — the broader two-surface model registers fit into
- **`doc-discipline-micro-patterns.md`** — small patterns including "wrong-copy-is-signal" for handling drift between register and other sources

## Origin

Extracted from `subs-initiative/docs/differentiators.md` (2026-05-13) as the first register instance, then formalized as a pattern during Hive #929 (2026-05-16) when the paired `invalidated-paths.md` register was added with 10 seed entries from the project's 6+ major pivots.
