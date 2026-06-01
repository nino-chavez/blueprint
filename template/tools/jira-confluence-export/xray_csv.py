#!/usr/bin/env python3
"""
Xray Test Case Importer CSV emitter (spike #685, test-management leg).

BigCommerce standardizes test management on **Xray** (embedded in Jira) — per
the BigEng RAG corpus: Payments (PI), IAM/Auth (ANA), and Catalog all use it;
Zephyr/TestRail/Qase have zero footprint. Bulk creation is via the **Test Case
Importer CSV** (Testing Board → Test Case Importer), the exact workflow IAM and
Payments document. This emitter produces that CSV from our substrate.

Mapping (grounded in domains/auth/quality/iam-xray-testing.md +
domains/payments/quality-space-pi/xray-approach-and-naming-convention.md):

  BRD AC bullet (Given/When/Then)  -> Xray **Manual Test** + Test Step
                                       (Action = Given+When, Expected = Then)
  e2e/behavior/*.feature Scenario  -> Xray **Cucumber Test** (Gherkin Definition)
  Per Story                        -> a **Test Set** ([US-N.M] …)
  Story AC coverage                -> Link "tests" (outward) = Story Jira key
  hive-meta.surface                -> Component Names
  Epic/Story                       -> Test Repository Folder hierarchy

CSV column contract (BigEng IAM doc):
  Issue ID, Issue Key, Project Key, Issue Type, Test Type, Summary, Description,
  Test Sets, Component Names, Preconditions, Link "tests" (outward), Action,
  Expected Result, Precondition Type, Gherkin Definition, Data,
  Test Repository Folder, Durable Team(s)

Rules: temp sequential Issue IDs for new rows; blank Issue Key = create; a Test's
step rows reuse the parent's Issue ID with blank Summary; list delimiter ';'.

IMPORTANT: Xray CSV import is a **UI wizard** (no REST), like Jira External
Import. This emitter produces the file; an admin uploads it via the Testing
Board. Xray is a Marketplace app — not on the free sandbox until its trial is
enabled, so this leg is dry-run-verifiable but not live-importable there yet.

Stdlib only. Consumes export.py output (_out/jira-issues.json) + .feature files.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = Path(__file__).parent / "_out"
FEATURE_DIR = REPO_ROOT / "e2e" / "behavior"
DURABLE_TEAM = "Subscriptions"

COLUMNS = [
    "Issue ID", "Issue Key", "Project Key", "Issue Type", "Test Type",
    "Summary", "Description", "Test Sets", "Component Names", "Preconditions",
    'Link "tests" (outward)', "Action", "Expected Result", "Precondition Type",
    "Gherkin Definition", "Data", "Test Repository Folder", "Durable Team(s)",
]

AC_SECTION_RE = re.compile(r"\*\*Acceptance criteria:\*\*\s*(.+?)(?:\n\n|\n\*\*|\Z)", re.DOTALL)
GWT_RE = re.compile(r"^\s*-\s*(.+)$", re.MULTILINE)


def parse_ac(description_md: str) -> list[str]:
    m = AC_SECTION_RE.search(description_md)
    if not m:
        return []
    return [b.strip() for b in GWT_RE.findall(m.group(1)) if b.strip()]


def split_given_when_then(ac: str) -> tuple[str, str]:
    """Split a 'Given X, When Y, Then Z' AC into (Action, Expected Result)."""
    then_split = re.split(r",?\s*\bThen\b\s*", ac, maxsplit=1, flags=re.IGNORECASE)
    action = then_split[0].strip().rstrip(",")
    expected = then_split[1].strip() if len(then_split) > 1 else "Behaviour matches the acceptance criterion."
    return action, expected


def parse_feature(path: Path) -> tuple[str, list[tuple[str, str]]]:
    """Return (feature_name, [(scenario_name, gherkin_body), ...])."""
    text = path.read_text(encoding="utf-8")
    feat_m = re.search(r"^Feature:\s*(.+)$", text, re.MULTILINE)
    feature = feat_m.group(1).strip() if feat_m else path.stem
    scenarios: list[tuple[str, str]] = []
    blocks = re.split(r"^\s*Scenario(?: Outline)?:\s*", text, flags=re.MULTILINE)[1:]
    for blk in blocks:
        lines = blk.splitlines()
        name = lines[0].strip()
        body = []
        for ln in lines[1:]:
            s = ln.strip()
            if re.match(r"^(Given|When|Then|And|But|\|)", s):
                body.append(s)
            elif s.startswith("@") or s.startswith("#") or not s:
                continue
            else:
                break
        scenarios.append((name, "\n".join(body)))
    return feature, scenarios


def build_rows(stories: list[dict], key_map: dict[str, str]) -> list[dict]:
    rows: list[dict] = []
    next_id = 1

    def link_for(ext_id: str) -> str:
        # Real Jira key if we imported already; else the BRD ref as a placeholder.
        return key_map.get(ext_id, ext_id)

    for story in stories:
        ext = story["external_id"]                       # US-1.1
        comp = ", ".join(story.get("components", []) or [])
        folder = f"Epic 1 — Merchant install/{ext} {story['summary']}"
        # --- Test Set per story --------------------------------------------
        ts_id = next_id; next_id += 1
        rows.append({**{c: "" for c in COLUMNS},
                     "Issue ID": ts_id, "Project Key": "", "Issue Type": "testset",
                     "Summary": f"[{ext}] {story['summary']}",
                     "Description": f"All tests covering {ext} (BRD).",
                     'Link "tests" (outward)': link_for(ext),
                     "Component Names": comp, "Durable Team(s)": DURABLE_TEAM})
        # --- Manual Tests from AC ------------------------------------------
        for ac in parse_ac(story["description_md"]):
            action, expected = split_given_when_then(ac)
            t_id = next_id; next_id += 1
            summary = (re.sub(r"^Given\s+", "", ac, flags=re.IGNORECASE)[:120]).strip()
            rows.append({**{c: "" for c in COLUMNS},
                         "Issue ID": t_id, "Project Key": "", "Issue Type": "test",
                         "Test Type": "Manual", "Summary": f"[{ext}] {summary}",
                         "Description": ac, "Test Sets": ts_id,
                         "Component Names": comp,
                         'Link "tests" (outward)': link_for(ext),
                         "Action": action, "Expected Result": expected,
                         "Test Repository Folder": folder, "Durable Team(s)": DURABLE_TEAM})
    return rows, next_id


def build_cucumber_rows(start_id: int) -> list[dict]:
    rows: list[dict] = []
    next_id = start_id
    if not FEATURE_DIR.exists():
        return rows
    for feat_path in sorted(FEATURE_DIR.glob("*.feature")):
        feature, scenarios = parse_feature(feat_path)
        for name, gherkin in scenarios:
            t_id = next_id; next_id += 1
            rows.append({**{c: "" for c in COLUMNS},
                         "Issue ID": t_id, "Project Key": "", "Issue Type": "test",
                         "Test Type": "Cucumber",
                         "Summary": f"[BDD] {name}",
                         "Description": f"Feature: {feature} ({feat_path.name})",
                         "Gherkin Definition": gherkin,
                         "Test Repository Folder": f"BDD/{feature}",
                         "Durable Team(s)": DURABLE_TEAM})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description="Xray Test Case Importer CSV emitter (#685)")
    ap.add_argument("--out", default=str(OUT_DIR))
    ap.add_argument("--key-map", help="JSON {external_id: jiraKey} from a prior Jira import, "
                                       "to populate the AC-coverage Link column with real keys")
    args = ap.parse_args()

    out = Path(args.out)
    stories = [i for i in json.loads((out / "jira-issues.json").read_text())
               if i["issue_type"] == "Story"]
    key_map = json.loads(Path(args.key_map).read_text()) if args.key_map else {}

    manual_rows, next_id = build_rows(stories, key_map)
    cucumber_rows = build_cucumber_rows(next_id)
    rows = manual_rows + cucumber_rows

    csv_path = out / "xray-tests.csv"
    out.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    n_sets = sum(1 for r in rows if r["Issue Type"] == "testset")
    n_manual = sum(1 for r in rows if r["Test Type"] == "Manual")
    n_cuke = sum(1 for r in rows if r["Test Type"] == "Cucumber")
    print(f"Xray CSV -> {csv_path}")
    print(f"  Test Sets:       {n_sets}")
    print(f"  Manual tests:    {n_manual}  (from BRD acceptance criteria)")
    print(f"  Cucumber tests:  {n_cuke}  (from e2e/behavior/*.feature Gherkin)")
    print(f"  total rows:      {len(rows)}")
    print(f"\nImport: Jira project → Testing Board → Test Case Importer → upload {csv_path.name}")
    print("  (requires the Xray app; list delimiter ';', date DD/MM/YYYY HH:mm)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
