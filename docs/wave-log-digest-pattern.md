---
canonical: true
---

# Wave-Log Digest Pattern

**Status**: Promoted 2026-05-27 wave 26 from converging evidence (wave 23 self-evidence + rally-hq onboarding burden).

**Last updated**: 2026-05-27

**Source evidence**:
- Wave 23 (2026-05-27, `e823f76`) — `METHODOLOGY.md` gained a `## State of the methodology` front matter section because the methodology grew past one-sitting reading. The wave-23 fix addressed framing register; it did not address the wall-of-content problem the framing acknowledged.
- `apps/rally-hq/blueprint/CLAUDE.md` (332 lines) + `apps/rally-hq/blueprint/STATE.md` (406 lines) = 738 lines of onboarding context for any new operator picking up the rally-hq Blueprint initiative cold.

**Related patterns**:
- [docs/operator-handoff-pattern.md](operator-handoff-pattern.md) (wave 25) — sibling pattern: lowers the cost of writing context for a specific session-transition reader. This pattern lowers the cost of reading context for a general-onboarding reader.
- [docs/2026-05-27-loom-inspiration-candidates.md](2026-05-27-loom-inspiration-candidates.md) C3 — the inspiration candidate this wave closes.

---

## Why this pattern exists

The wave log in `~/Workspace/dev/tools/blueprint/CLAUDE.md` accretes one entry per methodology wave. At wave 26 it has crossed ~1000 lines. A new contributor or returning operator (post 30-day gap) needs context filtered by their actual question — *"what changed since wave N"*, *"what's load-bearing for the reviewer system"*, *"what's the substrate-vs-discipline distinction"*. The full log is the authoritative source; reading it cold every time costs more than the question warrants.

The same pattern applies to any consumer initiative with a long-running wave-log-equivalent (rally-hq's CLAUDE.md + STATE.md combination, bc-subscriptions' CHANGELOG, etc.). The convention this wave promotes is: **the wave-log is the load-bearing onboarding text; the digest tool is a filter over it.** Both layers stay; the tool exists to narrow the read.

---

## When to use a digest

- A new contributor reading the methodology fresh and wants the latest N waves before reading older history
- A returning operator after a 30+ day gap wants only entries since last context
- A consumer operator wants to know "what's new since I last synced" before pulling forward
- A reviewer wants only entries matching a specific keyword (e.g., "reviewer," "schema," "stamp")

**Skip when**:
- Reading the full wave log is the actual goal (first-time deep onboarding)
- The question is semantic ("what does X *mean*") rather than locational ("where did X land") — the tool is a filter, not a summarizer

---

## The tool

`template/tools/wave-digest/digest.mjs` — small Node script (~60 lines, no dependencies) that:

1. Reads a `CLAUDE.md` file (defaults to `./CLAUDE.md`)
2. Extracts the `## Wave log` section
3. Filters entries by `--since=N` and/or `--keyword=<regex>`
4. Emits the filtered subset as markdown (or plain text)

Usage examples:

```sh
# All waves since wave 22
node template/tools/wave-digest/digest.mjs --since=22

# All waves matching "reviewer"
node template/tools/wave-digest/digest.mjs --keyword=reviewer

# Combine: schema or stamp changes since wave 20
node template/tools/wave-digest/digest.mjs --since=20 --keyword="schema|stamp"

# Different source repo (a consumer's CLAUDE.md)
node template/tools/wave-digest/digest.mjs --source=../rally-hq/blueprint/CLAUDE.md
```

The tool is intentionally narrow: no LLM, no semantic understanding, no "what's load-bearing for surface X" feature. It is a deterministic filter over the existing wave-log convention. Richer features (semantic search, auto-summary, change-impact analysis) defer to second-consumer evidence under the same gating discipline waves 24-25 applied.

---

## How the wave-log convention enables the filter

The tool depends on three properties of the wave-log convention:

1. **Wave log is a section** anchored by `## Wave log` heading. The parser finds the section by heading match.
2. **Each wave is one bullet** starting with `- Wave N — ` (where N is the wave number). The parser splits entries by this pattern.
3. **Each wave entry is one logical line** (markdown allows soft-wrap in source, but no internal `\n` in the bullet). The parser treats each entry as opaque text after extracting the wave number.

Consumer wave logs that follow these conventions get the digest tool for free. Consumer logs that diverge (e.g., multi-line per-wave entries) would need the tool extended or use a regex-based grep alternative.

---

## Composition with wave 23's front-matter framing

Wave 23 added a `## State of the methodology` front matter to `METHODOLOGY.md` that sets the reader's reading register. Wave 26 adds a tool that surfaces the relevant subset of the wave log for the reader's specific question. The two compose:

- A new contributor reads wave 23's front matter first (sets register), then runs `digest.mjs --since=20` (gets recent context), then reads the most-relevant 2-3 full wave entries that matter for their work.
- Total onboarding: ~5 minutes vs ~30 minutes reading the full log.

---

## Why this is doc + tool, not a reviewer

Same reasoning as wave 25's operator-handoff pattern: the demand is reader-driven, not methodology-driven. The tool lowers the read cost; it does not force any wave-log writer to write differently. The existing wave-log convention is already structured enough for the tool to work — no methodology-level discipline change required.

**Future amendment candidates** (defer until evidence accumulates):
- Semantic-summary mode (LLM-backed) once digest filter alone proves insufficient for the "what's load-bearing for X" question
- Cross-repo digest (run against multiple consumer wave-logs simultaneously) once ≥3 consumers carry wave-log-equivalents
- Wave-impact diff (what waves touched template/X/) once the dependency-tracking question recurs

---

## Cross-reference

Promotes inspiration-candidate **C3** from `docs/2026-05-27-loom-inspiration-candidates.md` based on the consumer-evidence audit at the same date. Closes the C3 watch-and-promote loop. Loom's market analog (chapters + summary on a video) is structurally similar but operates on a different modality — the wave log is already textual and pre-chunked at the entry level; the work is filtering, not chunking-then-summarizing.
