# Agent output discipline: the return value is the conclusion, not the corpus

**Status: canonical (wave 73).** Surfaced while assessing a token-compression tool (Headroom, `extraheadroom.com`) against Blueprint's own practice. The tool's lever — compress verbose tool output / logs before they reach the model — is something Blueprint already does at the orchestration layer: a dispatched agent reads a corpus and returns a finding, so the verbose intermediate data never touches the orchestrator's context. But that discipline was only encoded in `dispatch.md` ("Reporting expectations"), never in `research.md`, where the widest read fan-out in the pipeline happens. This pattern names the discipline so every research and dispatch agent inherits it.

## The gap this closes

A research or dispatch agent reads broadly — dozens of files, screenshots, tool outputs, web pages — to answer one question. When it returns, the cheap move is to hand the orchestrator the raw material it read: file contents, full command output, untrimmed search results. The orchestrator then pays, in its own context window, to re-read what the agent already read and already understood. The read fan-out was supposed to *save* the orchestrator that cost; dumping the corpus back spends it twice. (This is the same waste a token-compression proxy targets inside a single session — verbose tool output bloating the context — except here the fix is free and structural: it lives in what the agent chooses to return.)

## The principle: return the finding, not the file

> **An agent's return value is the synthesized conclusion plus citations — never the corpus it read to get there.**

The orchestrator keeps the *finding* and a *pointer* (a `file:line`, URL, screenshot reference, or event id) it can follow if it needs the original. It does not keep the bytes. This is delegation-as-compression: the verbose intermediate data stays in the subagent's context and dies with it; only the distilled result crosses back. A 50-file read returns a paragraph and a citation list, not 50 files.

## The rule

- **Synthesis-first.** Return claims and recommendations organized by category, not a transcript of what was read.
- **Every load-bearing claim cites a source** — `file:line`, URL, screenshot reference, or event id. A claim with no pointer is unverifiable, and "uncited claim" is itself a finding.
- **Bounded size.** The return is sized to the conclusion, not the input. "Returned a raw file/tool dump" is a defect to flag in post-flight cross-review, not an acceptable default.
- **Pointers over payloads.** When the orchestrator may need an original, hand it the path/URL to re-fetch on demand, not the inlined content.

## Configurable rigor — tier-bound

Like test discipline, the bar tracks the project `--tier`:

- **Tier 3 / regulated** — strict: synthesis-only returns, every claim cited, raw dumps rejected at cross-review.
- **Tier 2 / standard** — synthesis-first with citations; brief verbatim excerpts allowed only where exact wording is load-bearing (a contract clause, an error string).
- **Tier 1 / prototype** — lenient: keep returns conclusion-shaped, but don't gate on citation completeness for throwaway exploration.

## What this is, in one line

`dispatch.md` already says *what an agent reports* (file path, line count, unresolved cross-refs). This says *what an agent must NOT report* — the corpus it read — and why: the read fan-out only pays off if the conclusion, not the input, is what crosses back.
