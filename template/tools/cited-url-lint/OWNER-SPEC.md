---
tool: cited-url-lint
last_attested: 2026-09-25
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
- `<directory>` — the tree to scan; default `docs/architecture` (highest-risk citation surface). Relative paths resolve against the **working directory**, never against where the tool lives, so run it from the root of the project you are checking. The stamper does not copy this tool into initiatives; an initiative runs the template's copy by absolute path from its own root: `npx tsx $BLUEPRINT_HOME/template/tools/cited-url-lint/index.ts research`
- `.cited-url-lint-allowlist` — read from the working directory; one entry per line:
  - bare path → skip that file entirely (relative to the working directory)
  - `allow-url:<url>` → skip that specific URL across all files
  - `#` starts a comment when it opens the line or follows whitespace, so an entry can end in one: `allow-url:<url>  # requires auth`. A `#` right after other text is part of the entry, so a URL fragment stays: `allow-url:https://host/page#section` matches only that exact URL.
- `.url-cache.json` beside the tool — persistent URL → {status, checked_at} cache; entries fresh within `--max-cache-age-days` (default 7). Keyed by URL alone, so every project run through one copy shares it. Gitignored, so a fresh checkout starts with no cache.

### Outputs
- Console, in order:
  - a summary line naming the absolute directory scanned: `F files, C citations, U unique URLs under <dir>`
  - a count line: from cache, freshly checked, and under `--offline` how many had no cached result
  - one verdict:
    - `clean — N unique URLs resolved`, only when every unique URL has a verdict and none is broken
    - file:line + HTTP status (or error) for each broken citation
    - `<reason> — nothing was checked`, when no URL got a verdict: 0 citations found (naming any files the allowlist skipped), every citation allowlisted, or `--offline` with no cached result for any of them
    - `no broken citations among V checked URLs; Z not checked`, when `--offline` could check only some
- Exit 0 (no broken citations, including both "not checked" verdicts), 1 (broken URLs found), 2 (invocation error: unknown flag, more than one directory, bad `--max-cache-age-days`, no markdown files), 3 (nothing was checked and `--fail-on-empty` was passed)
- Cache file updated in place, only when a URL was freshly checked

### Flags
- `--offline` — skip network; report violations from cache only (useful in CI without egress, or for pre-commit speed). A stale entry still serves as the verdict.
- `--fail-on-empty` — exit 3 instead of 0 when nothing was checked
- `--max-cache-age-days=N` — override cache freshness window (default 7)
- Any other `--` flag is an error (exit 2), so a misspelled `--fail-on-empty` cannot silently switch the gate off.

## Coupling

- `docs/` corpus — primary target
- `.cited-url-lint-allowlist` — per-URL or per-file exemptions
- METHODOLOGY.md "Citation Correctness" section (pattern doc: `docs/methodology/citation-correctness-pattern.md`) — this tool is the mechanical complement to that policy

## Maintainer playbook

- **Found a broken URL that's actually intentional** (e.g., a known-redirect, a private link with a known 401, an API endpoint that requires auth): add an `allow-url:<url>` line to `.cited-url-lint-allowlist` with a comment explaining why.
- **A page that loads in a browser is reported broken**: re-run with `--max-cache-age-days=0` first. A cached failure lasts the whole cache window, including one recorded by an older version of this tool. If it still fails, check the field notes below before allowlisting.
- **CI run too slow**: prefer `--offline` mode; populate the cache via a nightly scheduled run.
- **Widen scope from `docs/architecture` to `docs/` wholesale**: first populate the cache via one online run, then commit the resulting `.url-cache.json` (it is gitignored by default) or wire it to a workflow artifact, so PRs aren't re-checking thousands of URLs each.
- **Bump `last_attested:`** when scope or schema changes.

## Danger zones

- **A green result over nothing.** A scan that finds no citations, or checks none of them, is not clean. The tool says `nothing was checked` and never `clean` in that case, and a gate should pass `--fail-on-empty` so the exit code carries it too. Before 2026-09-25 a relative `<directory>` resolved against the tool's own project, and a run from an initiative scanned the template's `research/` (7 files, 0 citations) and printed `clean`. This is the self-attestation the citation-correctness pattern exists to catch.
- **False positives from bot-blocked hosts.** Some hosts (Cloudflare-protected, some documentation sites) reject non-browser clients. The tool retries any failed HEAD as GET, whether it returned an error status, timed out, or dropped the connection. That clears servers that mishandle HEAD. It does not impersonate a browser, so a host that filters on User-Agent still fails. Allowlist those rather than disabling the check. Measured cases are in the field notes below.
- **Cache staleness.** If a URL silently changes meaning (200 OK but returning a different page), this tool will not catch it. The check is *resolution*, not *content correctness*. For content correctness, deeper verification is the right tool.
- **Network flakiness in CI.** Egress restrictions and rate-limited hosts can produce error states that aren't real failures. The 7-day cache window avoids re-hitting those hosts, but it also keeps a transient failure for the whole window; refresh with `--max-cache-age-days=0`. For tight CI, use `--offline`.

## Known limits

- Doesn't detect URLs inside code blocks vs prose — treats both the same. (Could exclude fenced code blocks in a future revision.)
- Doesn't follow markdown link reference style (`[text][ref]` … `[ref]: url`). Only catches inline links and bare URLs.
- Only `http(s)://` URLs are extracted. A citation written as a bare domain (`example.com/path`) is prose to this tool and is never checked, so de-linking a citation to quiet the lint also removes it from the check.
- Doesn't check anchor fragments (`#foo`) — only verifies the page resolves, not that the anchor target exists.
- A truncated URL is checked in its truncated form. See field note (a).
- Single-shot — no retry policy for transient failures. Re-run to recheck.

## Field notes: 2026-09-24 run over an initiative's `research/`

One run over 240 citations (165 unique URLs) in the intent-composition initiative, re-measured on 2026-09-25 with Node's `fetch`.

**(a) A truncated citation is checked, not skipped.** The trailing-punctuation strip runs before the `...` templated-URL skip. So `https://kandid.ai/blog/dynamic-storefront-playbook-...` loses its dots, is checked as `…playbook-`, and reports 404. Reordering the two checks would skip it as templated instead.

The order stays. A reader cannot follow a truncated URL either, so the finding is correct, and reordering would turn a loud finding into a silent skip. What is wrong is the evidence: the report shows a URL the author never wrote. The better fix is a separate "truncated, not checkable" finding that quotes the URL as written. A Unicode ellipsis (`…`) is not stripped at all, so that URL is checked with the character in it.

**(b) Legitimate pages that failed Node's `fetch`.**

| URL | What `fetch` got | Cause | Handling |
|---|---|---|---|
| `salesforce.com/news/stories/agentforce-commerce-announcement/` | HEAD 500, GET 200 | Server mishandles HEAD | Retried as GET since 2026-09-25 |
| `northdata.com`, `www.northdata.com` | HEAD 404, GET 200 | Server mishandles HEAD | Retried as GET |
| `support.optimizely.com/hc/en-us/articles/35021463311501` | HEAD 404, GET 200 | Server mishandles HEAD | Retried as GET |
| `partners.bigcommerce.com/directory/` | 406 to HEAD and GET | Rejects every User-Agent tried except a full browser string, including curl's and a self-identifying `cited-url-lint/1.0` | Allowlist. The tool does not impersonate a browser |
| `catalyst.dev/docs/getting-started`, `trylexsis.com/blogs/top-nosto-alternatives-shopify-2026` | Timed out on 2026-09-24; 200 in 0.6–3.5 s on 2026-09-25 | Transient. The old 10 s budget was shared by HEAD and the GET retry | 15 s per request, and a HEAD that times out is retried as GET, since 2026-09-25 |
| 7 URLs on `contentful.com` and `ninetailed.io` | 429 to every request shape | Rate limiting. The 50 ms throttle is global, not per host | Re-run later, or allowlist |

A browser User-Agent would have fixed one of these URLs. Retrying HEAD as GET fixed four, on three sites.

## Wiring (recommended patterns)

This tool ships as a standalone script. Suggested wiring patterns (consumer-implementation varies):

- `.github/workflows/` — run `--offline --fail-on-empty` on PR (fast, uses cache), full check nightly. The cache is gitignored, so restore it from the nightly run's artifact; without it every PR run checks nothing, and `--fail-on-empty` makes that fail instead of pass.
- pre-push hook in code-review tooling — run fast `--offline` variant pre-push
- CI blocking gate — use `--offline --fail-on-empty` for speed; populate cache via nightly job
