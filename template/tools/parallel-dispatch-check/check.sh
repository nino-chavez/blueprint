#!/usr/bin/env bash
# parallel-dispatch-check — warn when two parallel agents' file globs overlap.
# See template/tools/parallel-dispatch-check/README.md for full usage.
#
# Usage:
#   bash check.sh "agent1-glob1,agent1-glob2" "agent2-glob1" "agent3-glob1,..."
#
# Exit codes:
#   0 — no overlap; safe to dispatch in parallel
#   1 — overlap detected; switch to serial dispatch or narrow scope
#   2 — usage error (need ≥2 agent arg lists)

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: bash check.sh \"agent1-globs\" \"agent2-globs\" [\"agent3-globs\"...]" >&2
  echo "  each arg is a comma-separated list of file globs for one agent" >&2
  exit 2
fi

# Expand each agent's comma-separated globs into a sorted file-list.
# Use a temp dir so file-lists don't collide.
WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT

i=0
for agent_globs in "$@"; do
  i=$((i + 1))
  > "$WORK/agent-$i.files"
  # Split comma-separated globs; expand each against cwd; collect matches.
  IFS=',' read -ra GLOBS <<< "$agent_globs"
  for g in "${GLOBS[@]}"; do
    # Strip whitespace
    g=$(echo "$g" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$g" ]] && continue
    # Expand glob; nullglob makes missing matches produce nothing instead of literal pattern.
    # Note: `**` recursive matching is NOT supported (bash 3.2 on macOS lacks globstar).
    # For recursive scope, pipe `find` output through xargs instead.
    shopt -s nullglob
    for f in $g; do
      echo "$f" >> "$WORK/agent-$i.files"
    done
    shopt -u nullglob
  done
  # Dedupe + sort each agent's file list
  sort -u "$WORK/agent-$i.files" -o "$WORK/agent-$i.files"
done

N=$i

# Pairwise intersection check
overlap_found=0
for a in $(seq 1 $((N - 1))); do
  for b in $(seq $((a + 1)) $N); do
    # comm -12 prints lines common to both sorted files
    intersection=$(comm -12 "$WORK/agent-$a.files" "$WORK/agent-$b.files" || true)
    if [[ -n "$intersection" ]]; then
      overlap_found=1
      echo "OVERLAP: agent $a ↔ agent $b" >&2
      echo "$intersection" | sed 's/^/  /' >&2
    fi
  done
done

if [[ $overlap_found -eq 1 ]]; then
  echo "" >&2
  echo "FAIL: switch to serial dispatch, or narrow one agent's scope." >&2
  exit 1
fi

echo "SAFE: $N agents, no scope overlap. Safe to dispatch in parallel."
exit 0
