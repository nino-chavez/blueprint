# `tools/wave-digest`

Small Node script (no dependencies) that filters the `## Wave log` section of a `CLAUDE.md` file. Surface a relevant subset of methodology waves without reading the full log.

Promoted as canonical methodology infrastructure in wave 26 (2026-05-27).

## What's in here

- `digest.mjs` — the filter script. Reads a CLAUDE.md, extracts the `## Wave log` section, filters by `--since=N` and/or `--keyword=<regex>`, emits markdown (or plain text).

## Usage

From any directory with a CLAUDE.md (or pass `--source`):

```sh
# All waves since wave 22
node template/tools/wave-digest/digest.mjs --since=22

# All waves matching "reviewer"
node template/tools/wave-digest/digest.mjs --keyword=reviewer

# Combine: schema or stamp changes since wave 20
node template/tools/wave-digest/digest.mjs --since=20 --keyword="schema|stamp"

# Different source repo (a consumer's CLAUDE.md)
node template/tools/wave-digest/digest.mjs --source=../rally-hq/blueprint/CLAUDE.md

# Plain text output (default is markdown)
node template/tools/wave-digest/digest.mjs --since=24 --format=plain
```

## Flags

| Flag | Default | Meaning |
|---|---|---|
| `--source=PATH` | `./CLAUDE.md` | Path to the CLAUDE.md file to read |
| `--since=N` | `0` (all) | Only show waves with number ≥ N |
| `--keyword=REGEX` | (none) | Only show waves whose body matches the regex (case-insensitive) |
| `--format=FMT` | `markdown` | `markdown` or `plain` |

## What this is NOT

- Not an LLM-backed semantic summarizer — the tool is a deterministic filter; the source text is unchanged
- Not a reviewer-enforced gate — it's a reader-side tool, not a writer-side requirement
- Not a replacement for reading the full wave log first-time — it's a returning-reader / specific-question tool

## Convention dependency

The tool depends on three wave-log properties (see `docs/patterns/wave-log-digest-pattern.md`):
1. A section anchored by `## Wave log`
2. Each wave on a bullet starting `- Wave N — `
3. Each wave entry as one logical line (markdown soft-wrap OK; no internal `\n`)

Consumer logs that follow these conventions get the tool for free.

## Reference

See `docs/patterns/wave-log-digest-pattern.md` for full pattern documentation including when to use a digest, how it composes with wave 23's front-matter framing, and what future amendments are deferred to second-consumer evidence.
