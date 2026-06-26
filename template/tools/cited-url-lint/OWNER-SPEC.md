---
tool: cited-url-lint
last_attested: 2026-06-26
max_unattested_days: 90
couples_with:
  - docs/
  - .cited-url-lint-allowlist
convention_version: 1
---

# Owner-spec: cited-url-lint

## Purpose

Verifies that HTTP(S) URLs cited in markdown under `docs/` actually resolve (do not return 4xx or fail to connect). Catches the failure mode where agent-authored prose cites fabricated, stale, or wrong-format documentation URLs that look authoritative but 404 when followed.

Sister rule to the trust-but-verify pattern in METHODOLOGY.md. That pattern catches drift in *status artifacts*; this tool catches drift in *citations*.

## Origin

Discovered during real-verification audits of platform claims and external documentation. Prose cites URLs like `https://docs.example.com/api-reference/...mdx` (repo source-file paths, not rendered URLs) that 404 at the live site. The substantive claims are often correct and verifiable against actual sources, but the cited URLs are not the path to verify them. A cold-start engineer following the citation would conclude the claim was fabricated.

No mechanical lint existed for this class of error. This tool fills that gap.

## Inputs / outputs

### Inputs
- `docs/<target>/**/*.md` — default target is `docs/architecture` (highest-risk citation surface); pass any directory as positional arg
- `.cited-url-lint-allowlist` — one entry per line:
  - bare path → skip that file entirely
  - `allow-url:<url>` → skip that specific URL across all files
  - `#` for comments
- `tools/cited-url-lint/.url-cache.json` — persistent URL → {status, checked_at} cache; entries fresh within `--max-cache-age-days` (default 7)

### Outputs
- Console: file:line + HTTP status (or error) for each broken citation
- Exit 0 (clean), 1 (broken URLs found), 2 (invocation error)
- Cache file updated in place

### Flags
- `--offline` — skip network; report violations from cache only (useful in CI without egress, or for pre-commit speed)
- `--max-cache-age-days=N` — override cache freshness window (default 7)

## Coupling

- `docs/` corpus — primary target
- `.cited-url-lint-allowlist` — per-URL or per-file exemptions
- METHODOLOGY.md "Citation Correctness" section (pattern doc: `docs/methodology/citation-correctness-pattern.md`) — this tool is the mechanical complement to that policy

## Maintainer playbook

- **Found a broken URL that's actually intentional** (e.g., a known-redirect, a private link with a known 401, an API endpoint that requires auth): add an `allow-url:<url>` line to `.cited-url-lint-allowlist` with a comment explaining why.
- **CI run too slow**: prefer `--offline` mode; populate the cache via a nightly scheduled run.
- **Widen scope from `docs/architecture` to `docs/` wholesale**: first populate the cache via one online run, then commit the resulting `.url-cache.json` (or wire it to a workflow artifact) so PRs aren't re-checking thousands of URLs each.
- **Bump `last_attested:`** when scope or schema changes.

## Danger zones

- **False positives from bot-blocked hosts.** Some hosts (Cloudflare-protected, some documentation sites) return 403 or fail HEAD-then-GET retries. The tool falls back to GET on 403/405, but heavily-protected hosts may still flag. Allowlist them rather than disabling the check.
- **Cache staleness.** If a URL silently changes meaning (200 OK but returning a different page), this tool will not catch it. The check is *resolution*, not *content correctness*. For content correctness, deeper verification is the right tool.
- **Network flakiness in CI.** Egress restrictions and rate-limited hosts can produce error states that aren't real failures. The 7-day cache window absorbs most of this; for tight CI, use `--offline`.

## Known limits

- Doesn't detect URLs inside code blocks vs prose — treats both the same. (Could exclude fenced code blocks in a future revision.)
- Doesn't follow markdown link reference style (`[text][ref]` … `[ref]: url`). Only catches inline links and bare URLs.
- Doesn't check anchor fragments (`#foo`) — only verifies the page resolves, not that the anchor target exists.
- Single-shot — no retry policy for transient failures. Re-run to recheck.

## Wiring (recommended patterns)

This tool ships as a standalone script. Suggested wiring patterns (consumer-implementation varies):

- `.github/workflows/` — run `--offline` on PR (fast, uses cache), full check nightly
- pre-push hook in code-review tooling — run fast `--offline` variant pre-push
- CI blocking gate — use `--offline` for speed; populate cache via nightly job
