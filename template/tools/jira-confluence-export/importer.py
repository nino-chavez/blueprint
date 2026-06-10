#!/usr/bin/env python3
"""
Headless REST PROD_HOST_GUARD = __import__("os").environ.get("JIRA_PROD_HOST_GUARD", "")  # org production host substring to refuse
importer for the substrate -> Jira/Confluence export (spike #685).

Consumes export.py output (_out/jira-issues.json, _out/confluence-pages.json) and
creates the artifacts in a target Atlassian Cloud instance via REST:

  - Jira issues  -> POST /rest/api/3/issue   (description converted Markdown -> ADF)
  - Confluence   -> POST /wiki/api/v2/pages   (body converted Markdown -> storage XHTML)

HONEST PATH ONLY. Everything is created stamped "now", authored by the token's
user. Real build dates ride along as visible CONTENT (the "## Build timeline"
section export.py emits), never in `created` metadata. This is the deferred-
backdate posture decided 2026-06-01 — see README.md.

WALKING SKELETON. `--skeleton` imports exactly 1 Epic + 1 Story + 1 page: the
minimum that exercises the whole path (auth, ADF, storage XHTML, Epic->Story
parent link, space targeting). Prove that round-trip before scaling.

SAFETY. `--dry-run` is the DEFAULT. It prints the exact REST calls without
sending anything. A live run requires BOTH `--execute` AND credentials, and
targets only the instance/project/space you name — never corporate prod by
default (the connected MCP instance is the org's production Atlassian site; this
importer deliberately does not read that connection and requires an explicit
--site so synthetic data cannot leak into prod by accident).

Credentials (live run): set ATLASSIAN_EMAIL + ATLASSIAN_API_TOKEN env vars.
Create a token at https://id.atlassian.com/manage-profile/security/api-tokens
on YOUR free sandbox site where you are admin.

Stdlib only.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

OUT_DIR = Path(__file__).parent / "_out"

# P-tier -> Jira priority name (sandbox default scheme). Tune per target instance.
PRIORITY_MAP = {"P0": "Highest", "P1": "High", "P2": "Medium", "P3": "Low", "Backlog": "Lowest"}


# --------------------------------------------------------------------------- #
# Minimal Markdown -> ADF (Atlassian Document Format) for Jira v3 descriptions.
# Block-level only: headings (##), bullet lists (- ), fenced code, paragraphs.
# Inline markup is left as literal text (acceptable for a spike; round-trips safely).
# --------------------------------------------------------------------------- #
def _strip_comments(md: str) -> str:
    return re.sub(r"<!--.*?-->", "", md, flags=re.DOTALL)


def _adf_inline(text: str) -> list[dict]:
    """Markdown inline -> ADF text nodes with marks (code/strong/link/em)."""
    text = text.strip()
    if not text:
        return [{"type": "text", "text": " "}]
    patterns = [
        ("code", re.compile(r"`([^`]+)`")),
        ("strong", re.compile(r"\*\*([^*]+)\*\*")),
        ("link", re.compile(r"\[([^\]]+)\]\(([^)]+)\)")),
        ("em", re.compile(r"(?<![*\w])\*([^*\n]+)\*(?![*\w])")),
    ]
    nodes: list[dict] = []
    pos = 0
    while pos < len(text):
        best = best_kind = None
        for kind, pat in patterns:
            m = pat.search(text, pos)
            if m and (best is None or m.start() < best.start()):
                best, best_kind = m, kind
        if not best:
            nodes.append({"type": "text", "text": text[pos:]})
            break
        if best.start() > pos:
            nodes.append({"type": "text", "text": text[pos:best.start()]})
        if best_kind == "link":
            nodes.append({"type": "text", "text": best.group(1),
                          "marks": [{"type": "link", "attrs": {"href": best.group(2)}}]})
        else:
            nodes.append({"type": "text", "text": best.group(1), "marks": [{"type": best_kind}]})
        pos = best.end()
    return nodes or [{"type": "text", "text": " "}]


def _adf_table(header: list[str], rows: list[list[str]]) -> dict:
    def cell(kind: str, txt: str) -> dict:
        return {"type": kind, "content": [{"type": "paragraph", "content": _adf_inline(txt)}]}
    content = [{"type": "tableRow", "content": [cell("tableHeader", h) for h in header]}]
    for r in rows:
        content.append({"type": "tableRow", "content": [cell("tableCell", c) for c in r]})
    return {"type": "table", "content": content}


def md_to_adf(md: str) -> dict:
    content: list[dict] = []
    lines = _strip_comments(md).splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1  # closing fence
            content.append({"type": "codeBlock", "content": [
                {"type": "text", "text": "\n".join(code)}]} if code else {"type": "codeBlock"})
            continue
        if line.lstrip().startswith("|") and i + 1 < len(lines) and _is_table_sep(lines[i + 1]):
            cells = lambda row: [c.strip() for c in row.strip().strip("|").split("|")]
            header = cells(line)
            i += 2
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append(cells(lines[i]))
                i += 1
            content.append(_adf_table(header, rows))
            continue
        h = len(line) - len(line.lstrip("#"))
        if 1 <= h <= 6 and line[h:h + 1] == " ":
            content.append({"type": "heading", "attrs": {"level": min(h, 6)},
                            "content": _adf_inline(line[h + 1:].strip())})
            i += 1
            continue
        if line.lstrip().startswith("> "):
            quote: list[str] = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                quote.append(lines[i].lstrip()[1:].strip())
                i += 1
            content.append({"type": "blockquote", "content": [
                {"type": "paragraph", "content": _adf_inline(" ".join(quote))}]})
            continue
        if line.lstrip().startswith(("- ", "* ")):
            items: list[dict] = []
            while i < len(lines) and lines[i].lstrip().startswith(("- ", "* ")):
                items.append({"type": "listItem", "content": [
                    {"type": "paragraph", "content": _adf_inline(lines[i].lstrip()[2:].strip())}]})
                i += 1
            content.append({"type": "bulletList", "content": items})
            continue
        if re.match(r"^\s*\d+\.\s", line):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s", lines[i]):
                item_text = re.sub(r"^[ ]*\d+\.[ ]+", "", lines[i])
                items.append({"type": "listItem", "content": [
                    {"type": "paragraph", "content": _adf_inline(item_text)}]})
                i += 1
            content.append({"type": "orderedList", "content": items})
            continue
        para: list[str] = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "```", ">")) \
                and not lines[i].lstrip().startswith(("- ", "* ", "|")) \
                and not re.match(r"^\s*\d+\.\s", lines[i]):
            para.append(lines[i].strip())
            i += 1
        text = " ".join(para).strip()
        if text:
            content.append({"type": "paragraph", "content": _adf_inline(text)})
    if not content:
        content = [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]
    return {"type": "doc", "version": 1, "content": content}


# --------------------------------------------------------------------------- #
# Minimal Markdown -> Confluence storage format (XHTML subset).
# --------------------------------------------------------------------------- #
def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _inline(s: str) -> str:
    """Markdown inline -> storage XHTML: code, bold, italic, links. Escapes first."""
    s = _esc(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![*\w])\*([^*]+)\*(?![*\w])", r"<em>\1</em>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
    return s


def _is_table_sep(line: str) -> bool:
    return bool(re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", line)) and "-" in line


def md_to_storage(md: str) -> str:
    html: list[str] = []
    lines = _strip_comments(md).splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1
            # Fabric-safe code block. The <ac:structured-macro name="code"> storage
            # macro is rejected on v2 create ("unsupported extensions"); <pre> works.
            html.append(f"<pre>{_esc(chr(10).join(code))}</pre>")
            continue
        # table: header row followed by a |---|---| separator
        if line.lstrip().startswith("|") and i + 1 < len(lines) and _is_table_sep(lines[i + 1]):
            def cells(row: str) -> list[str]:
                return [c.strip() for c in row.strip().strip("|").split("|")]
            header = cells(line)
            i += 2
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append(cells(lines[i]))
                i += 1
            thead = "".join(f"<th>{_inline(c)}</th>" for c in header)
            body = "".join("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in r) + "</tr>" for r in rows)
            html.append(f"<table><tbody><tr>{thead}</tr>{body}</tbody></table>")
            continue
        h = len(line) - len(line.lstrip("#"))
        if 1 <= h <= 6 and line[h:h + 1] == " ":
            html.append(f"<h{min(h,6)}>{_inline(line[h + 1:].strip())}</h{min(h,6)}>")
            i += 1
            continue
        if line.lstrip().startswith("> "):
            quote: list[str] = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                quote.append(lines[i].lstrip()[1:].strip())
                i += 1
            html.append(f"<blockquote><p>{_inline(' '.join(quote))}</p></blockquote>")
            continue
        if line.lstrip().startswith(("- ", "* ")):
            items: list[str] = []
            while i < len(lines) and lines[i].lstrip().startswith(("- ", "* ")):
                items.append(f"<li>{_inline(lines[i].lstrip()[2:].strip())}</li>")
                i += 1
            html.append("<ul>" + "".join(items) + "</ul>")
            continue
        if re.match(r"^\s*\d+\.\s", line):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s", lines[i]):
                item_text = re.sub(r"^[ ]*\d+\.[ ]+", "", lines[i])
                items.append(f"<li>{_inline(item_text)}</li>")
                i += 1
            html.append("<ol>" + "".join(items) + "</ol>")
            continue
        para: list[str] = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "```", ">")) \
                and not lines[i].lstrip().startswith(("- ", "* ", "|")) \
                and not re.match(r"^\s*\d+\.\s", lines[i]):
            para.append(lines[i].strip())
            i += 1
        html.append(f"<p>{_inline(' '.join(para))}</p>")
    return "".join(html)


# --------------------------------------------------------------------------- #
# REST client
# --------------------------------------------------------------------------- #
class Atlassian:
    def __init__(self, site: str, email: str, token: str, dry_run: bool):
        self.site = site.rstrip("/")
        self.dry_run = dry_run
        raw = f"{email}:{token}".encode()
        self.auth = "Basic " + base64.b64encode(raw).decode()
        self.last_error = ""

    def get(self, path: str) -> Optional[dict]:
        req = urllib.request.Request(f"{self.site}{path}", method="GET", headers={
            "Authorization": self.auth, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            self.last_error = e.read().decode()[:400]
            sys.stderr.write(f"  FAIL GET {self.site}{path} [{e.code}]: {self.last_error}\n")
            return None

    def post(self, path: str, payload: dict, label: str) -> Optional[dict]:
        url = f"{self.site}{path}"
        if self.dry_run:
            print(f"  DRY-RUN POST {url}\n    {label}")
            return None
        data = json.dumps(payload).encode()
        for attempt in range(5):
            req = urllib.request.Request(url, data=data, method="POST", headers={
                "Authorization": self.auth, "Content-Type": "application/json",
                "Accept": "application/json"})
            try:
                with urllib.request.urlopen(req) as resp:
                    raw = resp.read().decode().strip()
                    body = json.loads(raw) if raw else {}   # issueLink returns 201 empty
                    print(f"  OK   POST {url} -> {body.get('key') or body.get('id') or resp.status}  ({label})")
                    self.last_error = ""
                    return body
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < 4:        # rate-limited: honor Retry-After
                    wait = int(e.headers.get("Retry-After", 2 ** attempt))
                    import time
                    time.sleep(min(wait, 30))
                    continue
                self.last_error = e.read().decode()[:400]
                sys.stderr.write(f"  FAIL POST {url} [{e.code}]: {self.last_error}\n")
                return None
            except (urllib.error.URLError, OSError) as e:   # connection reset / timeout
                if attempt < 4:
                    import time
                    time.sleep(2 ** attempt)
                    continue
                self.last_error = str(e)
                sys.stderr.write(f"  FAIL POST {url} [network]: {e}\n")
                return None
        return None

    def put(self, path: str, payload: dict, label: str) -> bool:
        url = f"{self.site}{path}"
        if self.dry_run:
            print(f"  DRY-RUN PUT {url}  ({label})")
            return True
        data = json.dumps(payload).encode()
        for attempt in range(5):
            req = urllib.request.Request(url, data=data, method="PUT", headers={
                "Authorization": self.auth, "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req):
                    return True
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < 4:
                    wait = int(e.headers.get("Retry-After", 2 ** attempt))
                    import time
                    time.sleep(min(wait, 30))
                    continue
                sys.stderr.write(f"  FAIL PUT {url} [{e.code}]: {e.read().decode()[:200]}\n")
                return False
            except (urllib.error.URLError, OSError) as e:   # connection reset / timeout
                if attempt < 4:
                    import time
                    time.sleep(2 ** attempt)
                    continue
                sys.stderr.write(f"  FAIL PUT {url} [network]: {e}\n")
                return False
        return False


def update_descriptions(client: Atlassian, issues: list[dict], key_map: dict[str, str]) -> int:
    """Re-render and PUT each issue's description (in place — preserves keys/links/coverage)."""
    ok = 0
    for issue in issues:
        key = key_map.get(issue["external_id"])
        if not key:
            continue
        adf = md_to_adf(issue["description_md"])
        if client.put(f"/rest/api/3/issue/{key}", {"fields": {"description": adf}},
                      f"{key} desc"):
            ok += 1
    return ok


def import_jira(client: Atlassian, issues: list[dict], project_key: str,
                skeleton: bool) -> dict[str, str]:
    """Create issues; return external_id -> created Jira key. Epics first so
    Stories can reference the parent key."""
    epics = [i for i in issues if i["issue_type"] == "Epic"]
    stories = [i for i in issues if i["issue_type"] == "Story"]
    if skeleton:
        epics, stories = epics[:1], stories[:1]
    key_map: dict[str, str] = {}

    for epic in epics:
        payload = {"fields": {
            "project": {"key": project_key},
            "issuetype": {"name": "Epic"},
            "summary": epic["summary"],
            "description": md_to_adf(epic["description_md"]),
            "labels": epic.get("labels", []),
        }}
        res = client.post("/rest/api/3/issue", payload, f"Epic: {epic['summary']}")
        key_map[epic["external_id"]] = (res or {}).get("key", f"<{epic['external_id']}>")

    for story in stories:
        fields = {
            "project": {"key": project_key},
            "issuetype": {"name": "Story"},
            "summary": story["summary"],
            "description": md_to_adf(story["description_md"]),
            "labels": story.get("labels", []),
        }
        parent_ext = story.get("parent_external_id")
        if parent_ext and parent_ext in key_map:
            # Team-managed projects link Story->Epic via parent; company-managed
            # use the Epic Link custom field. Parent works for team-managed sandbox.
            fields["parent"] = {"key": key_map[parent_ext]}
        pr = story.get("priority")
        if pr and pr in PRIORITY_MAP:
            fields["priority"] = {"name": PRIORITY_MAP[pr]}
        res = client.post("/rest/api/3/issue", {"fields": fields}, f"Story: {story['summary']}")
        # Team-managed projects often don't enable Priority — retry without it.
        if res is None and "priority" in fields and "priority" in client.last_error.lower():
            fields.pop("priority")
            sys.stderr.write("  retry: dropping unsupported 'priority' field\n")
            res = client.post("/rest/api/3/issue", {"fields": fields}, f"Story: {story['summary']}")
        key_map[story["external_id"]] = (res or {}).get("key", f"<{story['external_id']}>")

    # --- issue links from BRD dependencies (this story 'is blocked by' upstream) ---
    link_targets = stories if not skeleton else stories[:1]
    for story in link_targets:
        src = key_map.get(story["external_id"])
        for up in story.get("depends_on", []):
            if up in key_map:
                client.post("/rest/api/3/issueLink", {
                    "type": {"name": "Blocks"},
                    "inwardIssue": {"key": key_map[up]},   # upstream blocks ...
                    "outwardIssue": {"key": src},          # ... this story
                }, f"link: {up} blocks {story['external_id']}")
    return key_map


PARENT_TITLES = {
    "Decisions": "Architecture Decision Records (ADRs)",
    "Methodology": "Methodology",
    "Compliance": "Compliance Attestations",
    "Handoffs": "Handoffs", "Audits": "Audits",
}


def import_confluence(client: Atlassian, pages: list[dict], space_id: str,
                      skeleton: bool) -> None:
    if skeleton:
        pages = pages[:1]
    # Create one parent page per category so children nest instead of dumping at root.
    parents: dict[str, Optional[str]] = {}
    for hint in sorted({p["space_hint"] for p in pages}):
        title = PARENT_TITLES.get(hint, hint)
        res = client.post("/wiki/api/v2/pages", {
            "spaceId": space_id, "status": "current", "title": title,
            "body": {"representation": "storage",
                     "value": f"<p>{_esc(title)} — derived from the blueprint-example "
                              f"substrate via tools/jira-confluence-export.</p>"}},
            f"Parent: {title}")
        pid = (res or {}).get("id")
        if not pid:   # already exists (400) — look up its id so children still nest
            import urllib.parse
            found = client.get(f"/wiki/api/v2/spaces/{space_id}/pages"
                               f"?title={urllib.parse.quote(title)}&limit=1")
            results = (found or {}).get("results", [])
            pid = results[0]["id"] if results else None
        parents[hint] = pid
    for page in pages:
        payload = {
            "spaceId": space_id, "status": "current", "title": page["title"],
            "body": {"representation": "storage", "value": md_to_storage(page["body_md"])},
        }
        pid = parents.get(page["space_hint"])
        if pid:
            payload["parentId"] = pid
        client.post("/wiki/api/v2/pages", payload, f"Page: {page['title']}")


def main() -> int:
    ap = argparse.ArgumentParser(description="REST importer for substrate export (spike #685)")
    ap.add_argument("--site", help="Atlassian site base URL, e.g. https://your-sandbox.atlassian.net")
    ap.add_argument("--project-key", default="SUBS", help="Jira project key (default: SUBS)")
    ap.add_argument("--space-id", help="Confluence space numeric ID (skip Confluence if omitted)")
    ap.add_argument("--skeleton", action="store_true", help="import only 1 Epic + 1 Story + 1 page")
    ap.add_argument("--skip-jira", action="store_true", help="skip Jira (e.g. Confluence on a separate site)")
    ap.add_argument("--key-map-out", help="write {external_id: jiraKey} JSON (feeds Xray coverage links)")
    ap.add_argument("--update-descriptions", metavar="KEYMAP",
                    help="re-render + PUT descriptions in place for issues in this {ext:key} map "
                         "(no create — preserves keys/links/coverage)")
    ap.add_argument("--execute", action="store_true", help="actually POST (default is dry-run)")
    ap.add_argument("--out", default=str(OUT_DIR))
    args = ap.parse_args()

    out = Path(args.out)
    issues = json.loads((out / "jira-issues.json").read_text())
    pages = json.loads((out / "confluence-pages.json").read_text())

    dry_run = not args.execute
    email = os.environ.get("ATLASSIAN_EMAIL", "")
    token = os.environ.get("ATLASSIAN_API_TOKEN", "")
    site = args.site or "https://DRY-RUN.atlassian.net"

    if args.execute:
        missing = [n for n, v in [("--site", args.site), ("ATLASSIAN_EMAIL", email),
                                  ("ATLASSIAN_API_TOKEN", token)] if not v]
        if missing:
            sys.stderr.write(f"[error] --execute requires: {', '.join(missing)}\n")
            return 2
        if PROD_HOST_GUARD and PROD_HOST_GUARD in site:
            sys.stderr.write("[error] refusing to import synthetic data into corporate prod "
                             "(the org's production Atlassian site). Use a free sandbox site.\n")
            return 2

    mode = "EXECUTE" if args.execute else "DRY-RUN"

    if args.update_descriptions:
        key_map = json.loads(Path(args.update_descriptions).read_text())
        print(f"== Importer [{mode}] — UPDATE {len(key_map)} descriptions in place -> {site} ==")
        n = update_descriptions(Atlassian(site, email, token, dry_run), issues, key_map)
        print(f"  updated {n} descriptions")
        return 0

    scope = "SKELETON (1 Epic + 1 Story + 1 page)" if args.skeleton else "full export"
    print(f"== Importer [{mode}] — {scope} -> {site} ==")

    if not args.skip_jira:
        key_map = import_jira(Atlassian(site, email, token, dry_run), issues,
                              args.project_key, args.skeleton)
        print("  Jira key map:", {k: v for k, v in key_map.items()})
        if args.key_map_out and not dry_run:
            Path(args.key_map_out).write_text(json.dumps(
                {k: v for k, v in key_map.items() if v and not v.startswith("<")}, indent=2))
            print(f"  wrote key map -> {args.key_map_out}")

    if args.space_id or dry_run:
        import_confluence(Atlassian(site, email, token, dry_run), pages,
                          args.space_id or "<space-id>", args.skeleton)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
