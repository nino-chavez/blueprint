# Hive Closure Drift Sync Pattern

**Purpose:** Prevent and self-heal the most common Hive lifecycle gap — GitHub issues closed without a corresponding Hive status transition, leaving proposals stuck as `open` or `discussing` indefinitely.

**Extracted from:** `bc-subscriptions` session 2026-05-16 (26 stale proposals swept, root cause fixed in `hive-closure-sync.yml`).

---

## The Problem

Hive proposal lifecycle is: `open → discussing → synthesized → approved → merged/archived`.

The `merged` transition is normally triggered by `hive_mark_merged` when a commit lands on main with `#NNN` in its subject. But proposals slip through when:

1. **`hive_synthesize` was called without `proposal_ids`** — the synthesis creates a GH issue and transitions the synthesis record, but the source proposals stay `open`/`discussing` forever.
2. **GH issue closed manually or via a sweep** — bookkeeping reaction closes the issue, but no commit subject referenced `#NNN` so `hive-closure-sync.yml` never fires `hive_mark_merged`.
3. **Tasks created directly from proposals** — skips the `hive_approve_plan` flow, so `hive_rollup_merged` never walks back to the source proposals.

Result: the Hive board fills with phantom open/discussing proposals whose GH issues are already CLOSED. The board becomes untrustworthy; agents spend time triaging noise.

---

## The Fix: Two-Part Approach

### Part 1 — One-shot cleanup script

`cleanup-stale-proposals.ts` (or `.js`) classifies stale proposals into categories and generates idempotent SQL for direct D1 application:

```
UPDATE proposals
   SET status = 'archived',
       description = description || '\n\n---\n**Archived:** <reason>'
 WHERE github_issue_number = <N>
   AND status NOT IN ('merged', 'archived', 'rejected');
```

Apply with wrangler:

```bash
CLOUDFLARE_API_TOKEN=<token> \
  npx wrangler d1 execute <your-d1-db> --remote --file=cleanup.sql \
  --config .hive/apps/mcp-server/wrangler.toml
```

Categories to classify:
- **Test/noise proposals** — titles containing `[Test]`, `(disregard)`, or duplicated within 24h
- **Epic stubs** — day-1 PRD placeholder proposals; progress tracked elsewhere (e.g. `_state.json`)
- **GH-closed/Hive-open drift** — GH issue CLOSED but Hive status still `open`/`discussing`

**Guard:** `AND status NOT IN ('merged', 'archived', 'rejected')` makes every UPDATE idempotent — safe to re-run.

### Part 2 — Self-healing workflow step (permanent)

Add a "Proposal drift sync" step to your `hive-closure-sync.yml` that runs on every push to main, after the existing rollup step:

```yaml
- name: Proposal drift sync (GH-closed → Hive-merged)
  if: always() && env.HIVE_AUTH_TOKEN != ''
  env:
    HIVE_AUTH_TOKEN: ${{ secrets.HIVE_AUTH_TOKEN }}
    MCP_ENDPOINT: https://<your-hive-mcp>.workers.dev/api/mcp
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    set -u

    fetch_proposals() {
      local status=$1
      local payload="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"hive_get_proposals\",\"arguments\":{\"status\":\"${status}\"}}}"
      curl -sS --max-time 30 -X POST "$MCP_ENDPOINT" \
        -H "Authorization: Bearer $HIVE_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        --data "$payload" 2>/dev/null \
      | sed -n 's/^data: //p' | head -1 \
      | python3 -c "
import sys, json
try:
    r = json.load(sys.stdin)
    proposals = json.loads(r['result']['content'][0]['text']).get('proposals', [])
    for p in proposals:
        if p.get('github_issue_number'):
            print(p['github_issue_number'])
except Exception:
    pass
" 2>/dev/null || true
    }

    all_gh_nums=$(
      fetch_proposals open
      fetch_proposals discussing
    )

    [ -z "$all_gh_nums" ] && exit 0

    drifted=0
    date_tag=$(date +%Y%m%d)

    while IFS= read -r gh_num; do
      [ -z "$gh_num" ] && continue
      state=$(gh issue view "$gh_num" --json state --jq '.state' 2>/dev/null || echo "")
      [ "$state" != "CLOSED" ] && continue

      close_sha=$(gh api "repos/${GITHUB_REPOSITORY}/issues/${gh_num}/timeline" \
        --jq '[.[] | select(.event=="closed")] | last | (.commit_id // empty)' \
        2>/dev/null || echo "")
      [ -z "$close_sha" ] || [ "$close_sha" = "null" ] && close_sha="gh-drift-${date_tag}"
      close_sha="${close_sha:0:40}"

      payload=$(printf \
        '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"hive_mark_merged","arguments":{"proposal_id":"%s","commit_sha":"%s","human_name":"hive-proposal-drift-sync"}}}' \
        "$gh_num" "$close_sha")

      response=$(curl -sS --max-time 15 -X POST "$MCP_ENDPOINT" \
        -H "Authorization: Bearer $HIVE_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        --data "$payload" 2>&1) || continue

      if echo "$response" | grep -q '"isError":true'; then
        echo "::warning::hive_mark_merged error for GH#${gh_num} (may be a task issue, not a proposal)"
      elif echo "$response" | grep -q '"idempotent":true'; then
        echo "::notice::GH#${gh_num} already recorded"
      else
        drifted=$((drifted + 1))
        echo "::notice::GH#${gh_num} → merged (drift sync)"
      fi
    done <<< "$all_gh_nums"

    echo "::notice::Proposal drift sync: ${drifted} proposals transitioned"
```

---

## Root Cause Discipline

Drift happens when agents call `hive_synthesize` without passing `proposal_ids`. The workflow fix catches the symptom; the discipline fix is upstream:

**Rule:** Every `hive_synthesize` call MUST include `proposal_ids` listing every proposal being synthesized. If you can't enumerate them, grep git log for the proposal numbers first.

Add this to your project's `CLAUDE.md` or `WAYS-OF-WORKING.md`:

> **`hive_synthesize` must include `proposal_ids`.** Omitting them leaves source proposals in `open`/`discussing` forever and requires manual drift-sync cleanup. If unsure which proposals are being synthesized, call `hive_get_proposals` and cross-reference against git log before synthesizing.

---

## See Also

- `docs/hive-coordination-pattern.md` — when/how to bootstrap Hive for a new initiative
- `template/.github/workflows/hive-closure-sync.yml` — full workflow template with all four steps
