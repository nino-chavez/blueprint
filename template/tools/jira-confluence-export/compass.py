#!/usr/bin/env python3
"""
Atlassian Compass emitter (spike #685, verify/operate leg).

Compass is Atlassian's software-catalog + scorecard product — the natural home
for the "are we launch-ready?" view. This emitter maps:

  apps/*                         -> Compass **Components** (services/apps/websites)
  10-gate Epic DoD               -> a Compass **Scorecard** definition (10 criteria)
  docs/audits/epic-dod/*.md      -> per-epic gate results (passed/10)

HONEST SEAM: the 10-gate DoD is scored **per-epic**, while Compass scorecards
attach **per-component**. There is no 1:1 epic->component map in the substrate,
so we DON'T fabricate per-component gate results. We emit:
  - real component payloads (grounded in apps/),
  - the scorecard *definition* (criteria = the 10 gates),
  - per-epic gate results as a separate, clearly-labeled dataset that an operator
    maps to components once an epic<->component ownership table exists.

Compass import is via its **GraphQL API** (no CSV; not the REST used elsewhere)
and Compass must be provisioned on the site — not on the free sandbox. So this
leg emits payloads + is dry-run only for now.

⚠️ COMPASS IS SUNSETTING INTO DX (EOL 2026-12-31). Atlassian is moving Compass
catalog + scorecards into DX Fabric. Migration syncs COMPONENTS but NOT scorecards
(recreate), and alerts/ops move to JSM. The component payloads below are
forward-portable (they're what migrates); the scorecard definition is what you'd
recreate in DX. For a green-field setup, target DX Fabric's ingestion API
(getdx.com) directly rather than Compass — retarget this emitter before going
live. See docs/methodology/sdlc-atlassian-coverage.md (gap #7).

Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = Path(__file__).parent / "_out"
APPS_DIR = REPO_ROOT / "apps"
DOD_DIR = REPO_ROOT / "docs" / "audits" / "epic-dod"
DOD_FRAMEWORK = REPO_ROOT / "docs" / "methodology" / "epic-definition-of-done.md"

# apps/* -> Compass component type (SERVICE | APPLICATION | LIBRARY | WEBSITE | OTHER)
TYPE_MAP = {
    "api": "SERVICE", "email-consumer": "SERVICE", "program": "SERVICE",
    "admin": "APPLICATION", "storefront-svelte": "APPLICATION",
    "storefront-catalyst": "APPLICATION",
    "portal": "WEBSITE", "docs-site": "WEBSITE", "status": "WEBSITE", "demos": "WEBSITE",
    "i18n": "LIBRARY",
}


def emit_components() -> list[dict]:
    comps = []
    for d in sorted(p for p in APPS_DIR.iterdir() if p.is_dir()):
        name = d.name
        comps.append({
            "name": f"subs-{name}",
            "type": TYPE_MAP.get(name, "OTHER"),
            "description": f"blueprint-example {name} surface",
            "ownerId": "<team-id>",                       # operator fills (Compass team)
            "links": [{"type": "REPOSITORY",
                       "url": "https://github.com/example/blueprint-example",
                       "name": f"apps/{name}"}],
            "labels": ["blueprint-example"],
        })
    return comps


def emit_scorecard() -> dict:
    gate_re = re.compile(r"^##\s*Gate\s*(\d+)\s*[—-]\s*(.+?)\s*$", re.MULTILINE)
    gates = []
    if DOD_FRAMEWORK.exists():
        for num, title in gate_re.findall(DOD_FRAMEWORK.read_text(encoding="utf-8")):
            gates.append({"id": f"gate-{num}", "name": f"Gate {num} — {title}",
                          "weight": 1, "required": int(num) in (1, 3, 5)})
    return {
        "name": "Epic Definition of Done (10-gate)",
        "description": "blueprint-example per-epic launch-readiness gates "
                       "(docs/methodology/epic-definition-of-done.md v0.4).",
        "criteria": gates,
        "scoringStrategy": "WEIGHTED",
    }


FM_RE = re.compile(r"^---\n(.*?)\n---", re.DOTALL)


def parse_epic_dod(path: Path) -> dict | None:
    m = FM_RE.search(path.read_text(encoding="utf-8"))
    if not m:
        return None
    fm = m.group(1)
    def field(name):
        fm_m = re.search(rf"^{name}:\s*(.+)$", fm, re.MULTILINE)
        return fm_m.group(1).strip().strip('"') if fm_m else None
    epic = field("epic")
    # gates attested: keys 1..10 appearing under the `attested:` block
    att_block = re.search(r"attested:\s*\n(.*?)(?:\n\S|\Z)", fm + "\n", re.DOTALL)
    passed = sorted({int(g) for g in re.findall(r"^\s+(\d+):", att_block.group(1), re.MULTILINE)}) \
        if att_block else []
    return {"epic": epic, "title": field("title"), "phase": field("phase"),
            "risk_tier": field("risk_tier"),
            "gates_passed": passed, "score": f"{len(passed)}/10"}


def emit_epic_results() -> list[dict]:
    results = []
    for f in sorted(DOD_DIR.glob("epic-*-dod-status.md")):
        r = parse_epic_dod(f)
        if r and r.get("epic"):
            results.append(r)
    return results


def main() -> int:
    ap = argparse.ArgumentParser(description="Compass component + scorecard emitter (#685)")
    ap.add_argument("--out", default=str(OUT_DIR))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    components = emit_components()
    scorecard = emit_scorecard()
    epic_results = emit_epic_results()

    payload = {"components": components, "scorecard": scorecard,
               "epic_gate_results": epic_results,
               "_note": "epic_gate_results are per-epic; attach to components once an "
                        "epic<->component ownership map exists. Import via Compass GraphQL "
                        "(component-create + scorecard-create); not REST/CSV."}
    (out / "compass.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(f"Compass payloads -> {out / 'compass.json'}")
    print(f"  Components:     {len(components)}  ({', '.join(c['name'] for c in components)})")
    print(f"  Scorecard:      '{scorecard['name']}' — {len(scorecard['criteria'])} criteria")
    print(f"  Epic results:   {len(epic_results)} epics scored")
    fully = [r['epic'] for r in epic_results if len(r['gates_passed']) == 10]
    print(f"    fully-green (10/10): {len(fully)} epics")
    print("  Import: Compass GraphQL (needs Compass provisioned — not on free sandbox).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
