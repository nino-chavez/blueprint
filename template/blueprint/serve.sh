#!/usr/bin/env bash
# Blueprint Prototype — local static server
# Serves the prototype/ directory for local validation during development.
#
# Usage: ./serve.sh [port]
# Default port: 8765
#
# Prerequisites:
#   - Python 3 (for http.server)
#   - prototype/ directory exists (run from blueprint root)

set -euo pipefail
PORT="${1:-8765}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROTOTYPE_DIR="$SCRIPT_DIR/prototype"

if [ ! -d "$PROTOTYPE_DIR" ]; then
  echo "error: prototype/ not found at $PROTOTYPE_DIR" >&2
  exit 1
fi

# Kill anything on the port first so re-running is safe
if command -v lsof &>/dev/null; then
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
fi

echo "Serving $PROTOTYPE_DIR at http://localhost:$PORT/"
cd "$PROTOTYPE_DIR"
exec python3 -m http.server "$PORT"
