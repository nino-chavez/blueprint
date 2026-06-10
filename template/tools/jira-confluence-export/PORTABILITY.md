# Porting the Atlassian SDLC export to your project

This tool hydrates a full Atlassian SDLC (Jira + Confluence + Xray) **headlessly
from a project's substrate** — derived from a `big-blueprint`/`ai-hive`-shaped
repo (GH issues + BRD stories + ADRs + `.feature` files + DoD gates). It was
proven end-to-end on `subs-initiative` (spike #685): 238 Jira issues (28 epics +
210 stories) + dependency links, 443 Xray tests with AC-coverage, 134 Confluence
pages — all via API. See [`docs/_archive/atlassian-sdlc-export.md`](../../../docs/_archive/atlassian-sdlc-export.md)
for the full product mapping + decision trail.

## What you adapt (project-specific constants)

| File | Constant | Change to |
|---|---|---|
| `export.py` | `GH_REPO` | your `owner/repo` |
| `export.py` | `BRD` / `DECISIONS_DIR` / `METHODOLOGY_DIR` / `ATTESTATIONS_DIR` | your spec + corpus paths |
| `export.py` | `SURFACE_TO_COMPONENT` | your `hive-meta.surface` → Jira Component map |
| `export.py` | `STORY_HEADER_RE` / `META_LINE_RE` | your BRD story-heading + metadata-line format |
| `xray_csv.py` / `xray_graphql.py` | `FEATURE_DIR`, `DURABLE_TEAM` | your `.feature` dir + team name |
| `compass.py` | `APPS_DIR`, `DOD_DIR`, `DOD_FRAMEWORK`, `TYPE_MAP` | your services + DoD gate doc |
| `importer.py` | the `the-org-production-host` prod-guard | your org's prod host(s) to refuse |

## Operator one-time setup (per the subs-initiative run)

1. **Free Atlassian Cloud site** where you are admin (personal site is fine).
2. **Jira: company-managed project** — team-managed projects can't host Xray.
3. **Confluence space** (note its numeric id).
4. **Atlassian API token** → `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN`.
5. **Xray** (Marketplace app) installed; generate an **Xray API key** (Apps →
   Xray → Settings → API Keys) → `XRAY_CLIENT_ID` / `XRAY_CLIENT_SECRET`.
6. **Add Xray issue types to the project's issue-type scheme** via REST
   (`PUT /rest/api/3/issuetypescheme/{id}/issuetype`) — they don't auto-attach.

## Run order

```bash
python3 export.py --all                 # substrate -> _out/*.json (full) ; or default = sample
python3 importer.py --execute --site … --project-key … --key-map-out keys.json
python3 importer.py --execute --skip-jira --site … --space-id …    # Confluence
python3 xray_graphql.py --execute --project-key … --story-key-map keys.json --jira-site …
python3 compass.py                       # Compass payloads (or retarget DX Fabric)
```

## Hard-won lessons (don't relearn these)

- **Honest path, not backdating.** Real dates ride as visible *content* (a "Build
  timeline" section), not in `created` metadata. Backdating needs the UI-only
  External Import wizard, is detectable, and is fabrication-adjacent for audit
  audiences. The API path stamps "now" — that's fine and honest.
- **Converters need inline + tables, not just block structure.** Markdown→ADF
  (Jira) and Markdown→storage-XHTML (Confluence) must handle `**bold**`,
  `` `code` ``, `[links]()`, and `| tables |`, and strip `<!-- comments -->`,
  or content renders as literal markdown. (This was the #1 iteration cost.)
- **Update descriptions in place (PUT), never delete+recreate** — recreate
  orphans dependency links and Xray AC-coverage.
- **Bulk hits rate limits + network drops.** Retry on HTTP 429 (Retry-After)
  AND on URLError/connection-reset. Confluence Cloud throttles harder than Jira.
- **Nest Confluence pages** under category parent pages (resolve existing parent
  ids on fill-runs) — flat-at-root is unusable at corpus scale.
- **Xray test content** (steps, gherkin) lives in Xray, set via GraphQL
  `createTest`; bare Jira `Test` issues won't carry steps. CSV importer is
  UI-only — GraphQL is the headless path.
- **Confluence code blocks: use `<pre>`, not `<ac:structured-macro name="code">`.**
  The storage code macro is rejected on v2 page create ("Content contains
  unsupported extensions and cannot be edited in Fabric editor") — it silently
  drops every page with a code fence. Plain `<pre>` is Fabric-safe.
- **Compass is sunsetting → DX Fabric (EOL 2026-12-31).** For green-field,
  target DX directly; component payloads are forward-portable, scorecards aren't.
