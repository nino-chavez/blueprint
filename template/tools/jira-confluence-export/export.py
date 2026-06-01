#!/usr/bin/env python3
"""
Substrate -> Jira + Confluence exporter (spike #685).

Extracts the bc-subscriptions substrate (GH issues, BRD stories, ADRs,
dossiers, attestations, methodology) into an instance-agnostic intermediate
model, then emits import payloads:

  - Jira issues  -> _out/jira-issues.json   (one Epic + N Stories)
  - Confluence   -> _out/confluence-pages.json

DESIGN NOTES
------------
* HONEST PATH (default). Per the 2026-06-01 decision to defer backdating, the
  real Jan-Jun build chronology is preserved *as visible content* (a
  "## Build timeline" section and a "Source" provenance line in each issue
  description), NOT smuggled into Jira's `created` metadata. Everything imports
  stamped "now", authored by the importing user. No misrepresentation; trivial
  headless REST automation; see README.md for the full tradeoff.

* BACKDATE PATH (deferred). The same intermediate model can feed a Jira
  External-Import JSON emitter that lands real dates in `created` + a synthetic
  `history` changelog. That emitter is intentionally NOT built yet (UI-wizard
  import only, no REST, integrity caveats). The `--emit jira-import-json` flag
  is reserved and errors out with a pointer to the README.

* Description bodies are emitted as clean Markdown. Format conversion
  (Markdown -> ADF for Jira v3, Markdown -> Confluence storage XHTML) is the
  importer's job, keeping this extractor format-neutral.

Scope of this slice: Epic-1 (GH #30) + US-1.1..1.7, plus the handful of
Epic-1-relevant ADRs/methodology docs, as the spike's validation target.
Scaling to the full 67-epic / 623-issue substrate is a follow-on flag.

Stdlib only. Shells out to `gh` and `git`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

# Repo root = three levels up from this file (tools/jira-confluence-export/export.py)
REPO_ROOT = Path(__file__).resolve().parents[2]
BRD = REPO_ROOT / "BRD.md"
DECISIONS_DIR = REPO_ROOT / "docs" / "decisions"
METHODOLOGY_DIR = REPO_ROOT / "docs" / "methodology"
ATTESTATIONS_DIR = REPO_ROOT / "docs" / "attestations"
GH_REPO = "nino-chavez/bc-subscriptions"

# Epic-N hive surface -> Jira Component name (mapping table, methodology doc)
SURFACE_TO_COMPONENT = {
    "api": "API",
    "merchant-admin": "Merchant Admin",
    "storefront": "Storefront",
    "prototype": "Prototype",
    "cross-cutting": "Cross-cutting",
}


# --------------------------------------------------------------------------- #
# Intermediate model (instance-agnostic)
# --------------------------------------------------------------------------- #
@dataclass
class JiraIssue:
    external_id: str            # stable key for parent/link wiring, e.g. "EPIC-1", "US-1.1"
    issue_type: str             # "Epic" | "Story" | "Sub-task" | "Spike"
    summary: str
    description_md: str         # clean Markdown; importer converts to ADF
    labels: list[str] = field(default_factory=list)
    components: list[str] = field(default_factory=list)
    parent_external_id: Optional[str] = None   # Story -> Epic, Sub-task -> Story
    priority: Optional[str] = None             # P0/P1/.. -> mapped by importer
    story_points: Optional[float] = None
    status_hint: Optional[str] = None          # To Do / In Progress / Done (honest: informational)
    source_ref: Optional[str] = None           # provenance, e.g. "BRD.md §US-1.1"
    gh_number: Optional[int] = None
    real_created: Optional[str] = None          # ISO date from git/gh, surfaced as CONTENT only
    depends_on: list[str] = field(default_factory=list)  # upstream US-N.M (this is blocked by)
    blocks: list[str] = field(default_factory=list)      # downstream US-N.M (this blocks)


@dataclass
class ConfluencePage:
    external_id: str
    title: str
    space_hint: str             # "Decisions" | "Methodology" | "Handoffs" | "Audits"
    body_md: str
    source_path: str
    real_created: Optional[str] = None
    labels: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Shell helpers
# --------------------------------------------------------------------------- #
def _run(cmd: list[str]) -> str:
    try:
        return subprocess.run(
            cmd, cwd=REPO_ROOT, capture_output=True, text=True, check=True
        ).stdout
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"[warn] command failed: {' '.join(cmd)}\n{e.stderr}\n")
        return ""


def gh_issue(number: int) -> dict:
    out = _run(["gh", "issue", "view", str(number), "--repo", GH_REPO,
                "--json", "number,title,state,labels,body,createdAt"])
    return json.loads(out) if out else {}


def first_commit_date_matching(pattern: str) -> Optional[str]:
    """Earliest commit date whose subject/body mentions `pattern` — the honest
    'when did work on this start' signal, surfaced as content."""
    out = _run(["git", "log", "--reverse", "--format=%aI", f"--grep={pattern}", "-i"])
    lines = [l for l in out.splitlines() if l.strip()]
    return lines[0][:10] if lines else None


# --------------------------------------------------------------------------- #
# Extractors
# --------------------------------------------------------------------------- #
HIVE_META_RE = re.compile(r"<!--\s*hive-meta\s*(.*?)-->", re.DOTALL)


def parse_hive_meta(body: str) -> dict:
    m = HIVE_META_RE.search(body or "")
    if not m:
        return {}
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta


def extract_epic(number: int) -> JiraIssue:
    issue = gh_issue(number)
    title = issue.get("title", f"Epic #{number}")
    # Strip "[Proposal] [Epic-N] " noise for a clean Jira summary
    summary = re.sub(r"^\[Proposal\]\s*\[Epic-\d+\]\s*", "", title).strip()
    meta = parse_hive_meta(issue.get("body", ""))
    surface = meta.get("surface", "cross-cutting")
    component = SURFACE_TO_COMPONENT.get(surface, "Cross-cutting")
    created = (issue.get("createdAt") or "")[:10] or None
    return JiraIssue(
        external_id="EPIC-1",
        issue_type="Epic",
        summary=summary,
        description_md=_epic_description(issue, meta),
        labels=["via-claude-code", "substrate-export"],
        components=[component],
        status_hint="In Progress",
        source_ref=f"GH #{number}",
        gh_number=number,
        real_created=created,
    )


def _epic_description(issue: dict, meta: dict) -> str:
    body = (issue.get("body") or "").strip()
    # Drop the hive-meta HTML comment block from the human-facing description
    body = HIVE_META_RE.sub("", body).strip()
    parts = [body]
    tl = []
    if issue.get("createdAt"):
        tl.append(f"- Proposal filed: {issue['createdAt'][:10]} (GH #{issue.get('number')})")
    if meta.get("phase"):
        tl.append(f"- Phase: {meta['phase']}")
    if tl:
        parts.append("## Build timeline (real dates, preserved as content)\n" + "\n".join(tl))
    parts.append(f"_Source of truth: GH #{issue.get('number')} / Hive substrate. "
                 f"Imported via tools/jira-confluence-export (spike #685)._")
    return "\n\n".join(p for p in parts if p)


STORY_HEADER_RE = re.compile(r"^####\s+US-(\d+)\.(\d+):\s*(.+?)\s*$", re.MULTILINE)
META_LINE_RE = re.compile(
    r"\*\*Phase:\*\*\s*(?P<phase>[^·\n]+?)"
    r"(?:\s*·\s*\*\*Priority:\*\*\s*(?P<priority>[^·\n]+?))?"
    r"(?:\s*·\s*\*\*Effort:\*\*\s*(?P<effort>[^·\n]+?))?"
    r"(?:\s*·\s*\*\*Persona:\*\*\s*(?P<persona>[^·\n]+?))?\s*$",
    re.MULTILINE,
)
EFFORT_TO_POINTS = {"XS": 1, "S": 2, "M": 3, "L": 5, "XL": 8}


def extract_stories(epic_major: int) -> list[JiraIssue]:
    if not BRD.exists():
        sys.stderr.write("[warn] BRD.md not found\n")
        return []
    text = BRD.read_text(encoding="utf-8")
    headers = list(STORY_HEADER_RE.finditer(text))
    stories: list[JiraIssue] = []
    for i, m in enumerate(headers):
        major, minor, title = int(m.group(1)), int(m.group(2)), m.group(3).strip()
        if major != epic_major:
            continue
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        body = text[start:end].strip()
        depends_on, blocks = _parse_dependencies(body, major)
        meta = META_LINE_RE.search(body)
        priority = (meta.group("priority").strip() if meta and meta.group("priority") else None)
        effort = (meta.group("effort").strip() if meta and meta.group("effort") else None)
        points = EFFORT_TO_POINTS.get((effort or "").upper())
        sid = f"US-{major}.{minor}"
        real = first_commit_date_matching(sid)
        desc = _story_description(body, sid, real)
        stories.append(JiraIssue(
            external_id=sid,
            issue_type="Story",
            summary=title,
            description_md=desc,
            labels=["via-claude-code", "substrate-export"],
            components=["Merchant Admin"],
            parent_external_id="EPIC-1",
            priority=priority,
            story_points=points,
            status_hint=_status_from_phase(meta.group("phase") if meta else None),
            source_ref=f"BRD.md §{sid}",
            real_created=real,
            depends_on=depends_on,
            blocks=blocks,
        ))
    return stories


UPSTREAM_RE = re.compile(r"Upstream:\s*(.+)", re.IGNORECASE)
DOWNSTREAM_RE = re.compile(r"Downstream:\s*(.+)", re.IGNORECASE)
US_REF_RE = re.compile(r"US-(\d+)\.(\d+)")


def _parse_dependencies(body: str, epic_major: int,
                        same_epic_only: bool = True) -> tuple[list[str], list[str]]:
    """Extract upstream (blocked-by) and downstream (blocks) US-N.M refs from the
    BRD Dependencies section. Same-epic-only for the Epic-1 sample; full-substrate
    (--all) keeps cross-epic refs too."""
    def refs(pattern: re.Pattern) -> list[str]:
        m = pattern.search(body)
        if not m:
            return []
        return sorted({f"US-{a}.{b}" for a, b in US_REF_RE.findall(m.group(1))
                       if (not same_epic_only or int(a) == epic_major)})
    return refs(UPSTREAM_RE), refs(DOWNSTREAM_RE)


# --------------------------------------------------------------------------- #
# Full-substrate extraction (--all)
# --------------------------------------------------------------------------- #
def extract_all_epics() -> tuple[list[JiraIssue], dict[int, str]]:
    """All [Epic-N] GH issues -> Epic records. Returns (epics, {major: component})."""
    out = _run(["gh", "issue", "list", "--repo", GH_REPO, "--state", "all",
                "--search", "[Epic-", "--limit", "200",
                "--json", "number,title,body,createdAt"])
    data = json.loads(out) if out else []
    by_n: dict[int, dict] = {}
    for issue in data:
        m = re.search(r"\[Epic-(\d+)\]", issue["title"])
        if not m:
            continue
        n = int(m.group(1))
        if n not in by_n or issue["number"] < by_n[n]["number"]:
            by_n[n] = issue   # canonical stub = lowest issue number per epic
    epics: list[JiraIssue] = []
    comp_by_major: dict[int, str] = {}
    for n, issue in sorted(by_n.items()):
        meta = parse_hive_meta(issue.get("body", ""))
        component = SURFACE_TO_COMPONENT.get(meta.get("surface", "cross-cutting"), "Cross-cutting")
        comp_by_major[n] = component
        epics.append(JiraIssue(
            external_id=f"EPIC-{n}", issue_type="Epic",
            summary=re.sub(r"^\[Proposal\]\s*\[Epic-\d+\]\s*", "", issue["title"]).strip(),
            description_md=_epic_description(issue, meta),
            labels=["via-claude-code", "substrate-export"], components=[component],
            status_hint="In Progress", source_ref=f"GH #{issue['number']}",
            gh_number=issue["number"], real_created=(issue.get("createdAt") or "")[:10] or None))
    return epics, comp_by_major


def extract_all_stories(comp_by_major: dict[int, str]) -> list[JiraIssue]:
    """All BRD US-N.M -> Story records, parented to EPIC-{major}, cross-epic links kept."""
    text = BRD.read_text(encoding="utf-8")
    headers = list(STORY_HEADER_RE.finditer(text))
    stories: list[JiraIssue] = []
    for i, m in enumerate(headers):
        major, minor, title = int(m.group(1)), int(m.group(2)), m.group(3).strip()
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        body = text[start:end].strip()
        depends_on, blocks = _parse_dependencies(body, major, same_epic_only=False)
        meta = META_LINE_RE.search(body)
        priority = (meta.group("priority").strip() if meta and meta.group("priority") else None)
        effort = (meta.group("effort").strip() if meta and meta.group("effort") else None)
        sid = f"US-{major}.{minor}"
        # skip per-story git grep at scale (210x) — provenance line carries the ref
        stories.append(JiraIssue(
            external_id=sid, issue_type="Story", summary=title,
            description_md=_story_description(body, sid, None),
            labels=["via-claude-code", "substrate-export"],
            components=[comp_by_major.get(major, "Cross-cutting")],
            parent_external_id=f"EPIC-{major}" if major in comp_by_major else None,
            priority=priority, story_points=EFFORT_TO_POINTS.get((effort or "").upper()),
            status_hint=_status_from_phase(meta.group("phase") if meta else None),
            source_ref=f"BRD.md §{sid}", depends_on=depends_on, blocks=blocks))
    return stories


def _status_from_phase(phase: Optional[str]) -> str:
    # Honest/informational only — real done-state should join _state.json in the
    # full-substrate version. For the sample we map the BRD phase coarsely.
    if not phase:
        return "To Do"
    return "In Progress" if phase.strip().upper() == "MVP" else "To Do"


def _story_description(body: str, sid: str, real_created: Optional[str]) -> str:
    parts = [body]
    if real_created:
        parts.append("## Build timeline (real dates, preserved as content)\n"
                     f"- First commit referencing {sid}: {real_created}")
    parts.append(f"_Source of truth: BRD.md §{sid}. Imported via "
                 f"tools/jira-confluence-export (spike #685)._")
    return "\n\n".join(parts)


FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
# Tight, install/auth-specific vocabulary so the Epic-1 *sample* stays a sample.
# Word-boundaried to avoid "auth" matching "author/authority". Matched against
# the H1 title only (not the whole body) to keep relevance high-precision.
EPIC1_RELEVANCE = re.compile(
    r"\boauth\b|\binstall\b|\buninstall\b|app extension|\bwebhook\b|"
    r"\bauthentication\b|\bonboarding\b|signed[- ]payload|access[- ]token|"
    r"\boperator auth\b|tenant (?:data )?isolation",
    re.IGNORECASE,
)


def _doc_to_page(path: Path, space_hint: str, require_relevance: bool) -> Optional[ConfluencePage]:
    raw = path.read_text(encoding="utf-8")
    body = FRONTMATTER_RE.sub("", raw).strip()
    h1_match = H1_RE.search(body)
    relevance_target = h1_match.group(1) if h1_match else path.name
    if require_relevance and not EPIC1_RELEVANCE.search(relevance_target):
        return None
    title = h1_match.group(1).strip() if h1_match else path.stem
    created = first_commit_date_matching(path.name)
    return ConfluencePage(
        external_id=f"{space_hint.lower()}:{path.stem}",
        title=title,
        space_hint=space_hint,
        body_md=body,
        source_path=str(path.relative_to(REPO_ROOT)),
        real_created=created,
        labels=["via-claude-code", "substrate-export"],
    )


def extract_confluence_pages(full: bool = False) -> list[ConfluencePage]:
    pages: list[ConfluencePage] = []
    # ADRs: all in --all mode, else only Epic-1-relevant.
    if DECISIONS_DIR.exists():
        for adr in sorted(DECISIONS_DIR.glob("0*.md")):
            if adr.name.startswith("0000"):
                continue
            page = _doc_to_page(adr, "Decisions", require_relevance=not full)
            if page:
                pages.append(page)
    if full:
        # All methodology + all attestations (the audit-ready knowledge base).
        for md in sorted(METHODOLOGY_DIR.glob("*.md")):
            page = _doc_to_page(md, "Methodology", require_relevance=False)
            if page:
                pages.append(page)
        if ATTESTATIONS_DIR.exists():
            for att in sorted(ATTESTATIONS_DIR.rglob("*.md")):
                if att.name.startswith("_"):   # skip _SCHEMA / _TEMPLATE
                    continue
                page = _doc_to_page(att, "Compliance", require_relevance=False)
                if page:
                    pages.append(page)
    else:
        meta_doc = METHODOLOGY_DIR / "2026-05-14-jira-confluence-handoff-readiness.md"
        if meta_doc.exists():
            page = _doc_to_page(meta_doc, "Methodology", require_relevance=False)
            if page:
                pages.append(page)
    return pages


# --------------------------------------------------------------------------- #
# Emit
# --------------------------------------------------------------------------- #
def emit(out_dir: Path, issues: list[JiraIssue], pages: list[ConfluencePage]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "jira-issues.json").write_text(
        json.dumps([asdict(i) for i in issues], indent=2), encoding="utf-8")
    (out_dir / "confluence-pages.json").write_text(
        json.dumps([asdict(p) for p in pages], indent=2), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Substrate -> Jira/Confluence exporter (spike #685)")
    ap.add_argument("--epic", type=int, default=1, help="Epic major number (default: 1)")
    ap.add_argument("--epic-issue", type=int, default=30, help="GH issue # for the epic (default: 30)")
    ap.add_argument("--out", default=str(Path(__file__).parent / "_out"), help="output dir")
    ap.add_argument("--all", action="store_true",
                    help="full substrate: all epics + all stories + all ADRs/methodology/attestations")
    ap.add_argument("--emit", default="rest", choices=["rest", "jira-import-json"],
                    help="rest = honest REST payloads (default); jira-import-json = DEFERRED backdate path")
    args = ap.parse_args()

    if args.emit == "jira-import-json":
        sys.stderr.write(
            "[error] The backdating External-Import JSON emitter is deferred per the "
            "2026-06-01 decision. See tools/jira-confluence-export/README.md "
            "('Deferred: the backdate path').\n")
        return 2

    out_dir = Path(args.out)
    if args.all:
        epics, comp_by_major = extract_all_epics()
        stories = extract_all_stories(comp_by_major)
        pages = extract_confluence_pages(full=True)
        issues = [*epics, *stories]
        emit(out_dir, issues, pages)
        n_links = sum(len(s.depends_on) for s in stories)
        print(f"Exported FULL SUBSTRATE -> {out_dir}")
        print(f"  Jira issues:      {len(issues)} ({len(epics)} Epics + {len(stories)} Stories)")
        print(f"  dependency links: {n_links} (cross-epic included)")
        print(f"  Confluence pages: {len(pages)} "
              f"({sum(1 for p in pages if p.space_hint=='Decisions')} ADR, "
              f"{sum(1 for p in pages if p.space_hint=='Methodology')} methodology, "
              f"{sum(1 for p in pages if p.space_hint=='Compliance')} attestation)")
        return 0

    epic = extract_epic(args.epic_issue)
    stories = extract_stories(args.epic)
    pages = extract_confluence_pages()
    issues = [epic, *stories]
    emit(out_dir, issues, pages)

    print(f"Exported Epic-{args.epic} (GH #{args.epic_issue}) -> {out_dir}")
    print(f"  Jira issues:      {len(issues)} (1 Epic + {len(stories)} Stories)")
    for s in stories:
        pts = f"{s.story_points}pt" if s.story_points else "—"
        print(f"    {s.external_id:<8} {s.priority or '—':<4} {pts:<4} {s.summary}")
    print(f"  Confluence pages: {len(pages)}")
    for p in pages:
        print(f"    [{p.space_hint}] {p.title}  ({p.source_path})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
