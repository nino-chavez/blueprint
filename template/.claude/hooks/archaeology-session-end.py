#!/usr/bin/env python3
"""SessionEnd hook — feed completed Claude Code session JSONL into the archaeology
substrate.

scaffold.sh copies this file to ~/.claude/hooks/ at install time and prompts the
operator to add it to ~/.claude/settings.json under hooks.SessionEnd.

Hook input (stdin): JSON payload that includes at minimum:
  - session_id      — UUID of the session
  - transcript_path — absolute path to the session's .jsonl on disk
  - cwd             — working directory where the session ran

Scoping rule: only ingest sessions whose cwd is inside the project (matched by
PROJECT_MARKER below). Otherwise this hook would slurp every Claude session into
this project's substrate, which is wrong by federation design — each project's
substrate is keyed by `project_id` and owns its own session corpus.

Output: a one-line status to stdout (visible in chat). Exit 0 always — never
block a session-end on a substrate hiccup. The backfill side is idempotent, so a
miss is recoverable by running `sessions.py backfill` later.

Templated values (scaffold.sh substitutes these at install time):
  - PROJECT_MARKER:   substring to match in cwd (e.g. "blueprint-example")
  - INGESTER_PATH:    absolute path to tools/archaeology/ingesters/sessions.py
  - WORKER_URL:       https://<slug>-archaeology.<subdomain>.workers.dev
  - PROJECT_ID:       full project name passed via ARCHAEOLOGY_PROJECT_ID
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

PROJECT_MARKER = "{{PROJECT_ID}}"
INGESTER_PATH = Path("{{INGESTER_PATH}}")  # e.g. /Users/me/Workspace/dev/wip/myproject/tools/archaeology/ingesters/sessions.py
TOKEN_FILE = Path.home() / ".config" / "archaeology" / "ingest-token"
WORKER_URL = "{{WORKER_URL}}"
TIMEOUT_S = 60


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        print("[archaeology] SessionEnd hook: malformed stdin payload")
        return 0

    transcript_path = payload.get("transcript_path")
    cwd = payload.get("cwd", "") or ""

    if PROJECT_MARKER not in cwd:
        return 0

    if not transcript_path or not Path(transcript_path).exists():
        print(f"[archaeology] SessionEnd: no transcript at {transcript_path!r}")
        return 0

    if not INGESTER_PATH.exists():
        print(f"[archaeology] SessionEnd: ingester missing at {INGESTER_PATH}")
        return 0

    if not TOKEN_FILE.exists():
        print(f"[archaeology] SessionEnd: token missing at {TOKEN_FILE}")
        return 0

    token = TOKEN_FILE.read_text().strip()

    env = {
        **os.environ,
        "ARCHAEOLOGY_INGEST_TOKEN": token,
        "ARCHAEOLOGY_WORKER_URL": WORKER_URL,
        "ARCHAEOLOGY_PROJECT_ID": PROJECT_MARKER,
    }

    try:
        result = subprocess.run(
            ["python3", str(INGESTER_PATH), "tail", "--jsonl", transcript_path],
            env=env,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        print(f"[archaeology] SessionEnd: ingest timed out after {TIMEOUT_S}s")
        return 0
    except Exception as e:
        print(f"[archaeology] SessionEnd: ingest crashed: {e}")
        return 0

    if result.returncode != 0:
        tail = (result.stderr or "")[-300:]
        print(f"[archaeology] SessionEnd: ingest rc={result.returncode}: {tail}")
        return 0

    try:
        stats = json.loads(result.stdout)
        print(
            f"[archaeology] session {Path(transcript_path).stem[:8]} → "
            f"inserted={stats.get('inserted', 0)} "
            f"skipped={stats.get('skipped', 0)} "
            f"errors={stats.get('errors', 0)}"
        )
    except (json.JSONDecodeError, ValueError):
        print(f"[archaeology] session ingested (raw output: {result.stdout[:200]})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
