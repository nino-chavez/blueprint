#!/usr/bin/env python3
"""
Xray Cloud GraphQL importer (spike #685, headless test-management leg).

Proves the automation thesis: a blueprint/hive-built project can hydrate Xray
test management **headlessly** — no CSV wizard. Creates Xray Tests (Manual from
BRD acceptance criteria; Cucumber from e2e/behavior/*.feature) directly via the
Xray Cloud GraphQL API, and optionally links each Test to its Story for AC
coverage.

API (verified against docs.getxray.app):
  - Auth:    POST https://xray.cloud.getxray.app/api/v2/authenticate
             body {"client_id": "...", "client_secret": "..."} -> bearer token (JSON string)
  - GraphQL: POST https://xray.cloud.getxray.app/api/v2/graphql  (Authorization: Bearer <token>)
  - createTest(testType:{name}, steps:[{action,data,result}], gherkin, jira:{fields:{...}})
      { test { issueId jira(fields:["key"]) } }

CREDENTIALS (operator-only): generate an Xray API key (client_id + client_secret)
in Jira → Apps → Xray → Settings → API Keys. Export as XRAY_CLIENT_ID /
XRAY_CLIENT_SECRET. The Xray app must be installed and enabled on a
**company-managed** project (team-managed projects don't host Xray).

SAFETY: --dry-run is the default; --execute sends mutations. Coverage links are
created only when --story-key-map is supplied (external_id -> Story Jira key in
the same project).

Stdlib only. Reuses parsers from xray_csv.py.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from xray_csv import parse_ac, split_given_when_then, parse_feature, FEATURE_DIR  # noqa: E402

OUT_DIR = Path(__file__).parent / "_out"
XRAY_BASE = "https://xray.cloud.getxray.app/api/v2"


def authenticate(client_id: str, client_secret: str) -> str:
    req = urllib.request.Request(
        f"{XRAY_BASE}/authenticate",
        data=json.dumps({"client_id": client_id, "client_secret": client_secret}).encode(),
        method="POST", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())   # the body IS the token (a JSON string)


def _link_coverage(test_key: str, story_key: str) -> None:
    """Create a Jira issue link (Xray 'Test' type) — Test tests Story — for AC
    coverage. Uses Atlassian creds + JIRA_SITE (set in main from --jira-site)."""
    import base64
    site = os.environ.get("_JIRA_SITE", "")
    email, tok = os.environ.get("ATLASSIAN_EMAIL", ""), os.environ.get("ATLASSIAN_API_TOKEN", "")
    if not (site and email and tok):
        return
    auth = "Basic " + base64.b64encode(f"{email}:{tok}".encode()).decode()
    payload = {"type": {"name": "Test"},
               "inwardIssue": {"key": story_key},    # Story 'is tested by'
               "outwardIssue": {"key": test_key}}    # Test 'tests' Story
    req = urllib.request.Request(f"{site}/rest/api/3/issueLink", data=json.dumps(payload).encode(),
                                 method="POST", headers={"Authorization": auth,
                                 "Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"   coverage-link {test_key}->{story_key} failed [{e.code}]\n")


def gql(token: str, query: str) -> dict:
    req = urllib.request.Request(
        f"{XRAY_BASE}/graphql",
        data=json.dumps({"query": query}).encode(),
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


# --------------------------------------------------------------------------- #
# Build structured Test models from the substrate (shared shape for dry + live)
# --------------------------------------------------------------------------- #
def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def build_tests(stories: list[dict]) -> list[dict]:
    tests: list[dict] = []
    for story in stories:
        ext = story["external_id"]
        for ac in parse_ac(story["description_md"]):
            action, expected = split_given_when_then(ac)
            tests.append({
                "type": "Manual", "covers": ext,
                "summary": f"[{ext}] {ac[:120]}",
                "steps": [{"action": action, "data": "", "result": expected}],
            })
    if FEATURE_DIR.exists():
        for fp in sorted(FEATURE_DIR.glob("*.feature")):
            feature, scenarios = parse_feature(fp)
            for name, gherkin in scenarios:
                tests.append({
                    "type": "Cucumber", "covers": None,
                    "summary": f"[BDD] {name}",
                    "gherkin": f"Scenario: {name}\n{gherkin}",
                })
    return tests


def mutation_for(test: dict, project_key: str) -> str:
    summary = _esc(test["summary"])
    jira = f'jira: {{ fields: {{ summary: "{summary}", project: {{ key: "{project_key}" }} }} }}'
    if test["type"] == "Cucumber":
        return (f'mutation {{ createTest( testType: {{ name: "Cucumber" }}, '
                f'gherkin: "{_esc(test["gherkin"])}", {jira} ) '
                f'{{ test {{ issueId jira(fields: ["key"]) }} warnings }} }}')
    steps = ", ".join(
        f'{{ action: "{_esc(s["action"])}", data: "{_esc(s.get("data",""))}", '
        f'result: "{_esc(s["result"])}" }}' for s in test["steps"])
    return (f'mutation {{ createTest( testType: {{ name: "Manual" }}, '
            f'steps: [{steps}], {jira} ) '
            f'{{ test {{ issueId jira(fields: ["key"]) }} warnings }} }}')


def main() -> int:
    ap = argparse.ArgumentParser(description="Xray Cloud GraphQL importer (#685)")
    ap.add_argument("--project-key", default="SUBSX", help="company-managed, Xray-enabled project")
    ap.add_argument("--out", default=str(OUT_DIR))
    ap.add_argument("--execute", action="store_true", help="send mutations (default: dry-run)")
    ap.add_argument("--story-key-map", help="JSON {external_id: storyKey} to link AC coverage")
    ap.add_argument("--jira-site", help="Jira site URL for coverage links (e.g. https://x.atlassian.net)")
    ap.add_argument("--limit", type=int, default=0, help="cap number of tests (0 = all)")
    args = ap.parse_args()
    if args.jira_site:
        os.environ["_JIRA_SITE"] = args.jira_site

    out = Path(args.out)
    stories = [i for i in json.loads((out / "jira-issues.json").read_text())
               if i["issue_type"] == "Story"]
    tests = build_tests(stories)
    if args.limit:
        tests = tests[:args.limit]

    n_manual = sum(1 for t in tests if t["type"] == "Manual")
    n_cuke = sum(1 for t in tests if t["type"] == "Cucumber")
    mode = "EXECUTE" if args.execute else "DRY-RUN"
    print(f"== Xray GraphQL importer [{mode}] -> project {args.project_key} ==")
    print(f"   {len(tests)} tests ({n_manual} Manual from AC, {n_cuke} Cucumber from .feature)")

    if not args.execute:
        for t in tests[:3]:
            print(f"   e.g. {t['type']}: {t['summary'][:70]}")
        print("   (dry-run — set XRAY_CLIENT_ID/SECRET + --execute to send)")
        return 0

    cid, secret = os.environ.get("XRAY_CLIENT_ID", ""), os.environ.get("XRAY_CLIENT_SECRET", "")
    if not (cid and secret):
        sys.stderr.write("[error] --execute needs XRAY_CLIENT_ID + XRAY_CLIENT_SECRET "
                          "(Jira → Apps → Xray → Settings → API Keys)\n")
        return 2
    try:
        token = authenticate(cid, secret)
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"[error] Xray auth failed [{e.code}]: {e.read().decode()[:300]}\n")
        return 2
    print("   authenticated with Xray Cloud ✓")

    story_keys = json.loads(Path(args.story_key_map).read_text()) if args.story_key_map else {}
    created = 0
    for t in tests:
        try:
            res = gql(token, mutation_for(t, args.project_key))
        except urllib.error.HTTPError as e:
            sys.stderr.write(f"   FAIL {t['summary'][:50]} [{e.code}]: {e.read().decode()[:200]}\n")
            continue
        errs = res.get("errors")
        if errs:
            sys.stderr.write(f"   GQL-ERR {t['summary'][:50]}: {json.dumps(errs)[:200]}\n")
            continue
        node = res["data"]["createTest"]["test"]
        key = node["jira"]["key"]
        created += 1
        print(f"   OK {t['type']:8} {key}  {t['summary'][:55]}")
        # AC coverage: a Jira issue link of type "Test" (Xray-provided) from the
        # Test to its Story. Created via Jira REST when --story-key-map is given.
        cov = story_keys.get(t.get("covers") or "")
        if cov:
            _link_coverage(key, cov)
    print(f"   created {created}/{len(tests)} Xray tests in {args.project_key}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
