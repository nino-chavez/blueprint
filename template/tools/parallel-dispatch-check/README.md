# `tools/parallel-dispatch-check`

Pre-dispatch sanity check for parallel agent dispatches. Codifies the wave 28 multi-operator-collab-pattern lightweight convention: *"if two agents will touch files in the same directory tree, dispatch them sequentially rather than in parallel."*

Promoted as canonical methodology infrastructure in wave 28 (2026-05-27) as an in-flight follow-on to the rally-hq worktree-isolation amendment.

## What's in here

- `check.sh` — bash script that takes file-glob lists from multiple parallel agents (one list per agent, comma-separated, one agent per arg) and warns when any two agents' globs overlap. Exit code 1 if overlap detected; exit code 0 if scopes are non-overlapping.

## Usage

Before dispatching N parallel agents, run:

```sh
bash template/tools/parallel-dispatch-check/check.sh \
  "src/components/Foo.tsx,src/lib/foo.ts" \
  "src/components/Bar.tsx,src/lib/bar.ts" \
  "tests/foo.test.ts,tests/bar.test.ts"
```

Each positional arg is one agent's file-glob list (comma-separated). The script expands globs against the working tree, computes pairwise intersection between agent file-sets, and:

- Exit 0 + "SAFE: no overlap" → safe to dispatch in parallel
- Exit 1 + "OVERLAP: agent <i> ↔ agent <j>: <files>" → switch to serial dispatch (or narrow one agent's scope)

## Why this exists

Rally-hq commit `0c074d5` was labeled "P20-only" but bundled P14a + P14b changes from a sibling worktree because two parallel agents' file scopes overlapped on `t/[slug]/+layout.svelte` and `team/[token]/+page.svelte`. Per-agent attribution was lost forever in git log. The rally-hq amendment (`apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md` worktree-isolation entry) recommended: *"add a pre-dispatch sanity check to the parent session: enumerate the file globs each agent's brief will touch; if any two overlap, switch to serial dispatch."* This is that check.

## What this is NOT

- Not a replacement for `isolation: "worktree"` in agent dispatches (still required)
- Not a runtime guard — it's a pre-flight check the parent session runs BEFORE dispatching
- Not a reviewer-enforced gate — manual operator discipline; the script lowers the cost of checking

## Reference

See `$BLUEPRINT_HOME/docs/patterns/multi-operator-collab-pattern.md` § "What consumers can do today" for the full lightweight-convention set (per-repo role declaration + worktree isolation + no-workaround success criterion). This tool addresses the worktree-isolation convention specifically.
