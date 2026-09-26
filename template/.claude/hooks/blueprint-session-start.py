#!/usr/bin/env python3
"""SessionStart hook — inject Blueprint canonical methodology into a fresh session.

Encoded response to the 2026-05-25 three-session failure mode: three live consumer
sessions reasoned from first principles instead of reading the canonical docs,
then disagreed about what Blueprint *is*. Failing to load the canonical sources
at session start is a direct violation of Blueprint's own first principle
applied to Blueprint itself.

This hook fires only when the cwd is a Blueprint initiative (detected by a
`blueprint.yml` in cwd or any ancestor). For non-Blueprint sessions, exit 0
silently — no injection.

Load order (codified, not arbitrary):
  1. METHODOLOGY.md            — what Blueprint is, the first principle, the pipeline
  2. docs/variant-selection.md — which pipeline shape applies to this initiative
  3. docs/portal-and-tier-ladder.md — which portal pattern (A/B) and which tier (0/1/2)

This order matches the question hierarchy any consumer session needs to answer
before proposing methodology changes from scratch.

Resolution (portable, no single hardcoded path): BLUEPRINT_HOME env var, else a
`methodology_home:` field in the initiative's blueprint.yml, else the local dev
path `~/Workspace/dev/tools/blueprint`, else an npm-installed
`@nino-chavez-labs/blueprint-cli`. A candidate counts only if it contains METHODOLOGY.md.

Output protocol: Claude Code SessionStart hooks emit a JSON object on stdout
with a `hookSpecificOutput.additionalContext` field. The content of that field
is injected into the session as a user-visible system reminder.

`--self-test` checks the npm fallback against the root package.json `name`,
then runs the hook through the global-rules cases against this source's own
rules docs; `npm run test:core` runs it.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


CANONICAL_DOCS = [
    "METHODOLOGY.md",
    "docs/variant-selection.md",
    "docs/portal-and-tier-ladder.md",
]

# The published npm package: the root package.json `name`. `--self-test` fails
# when the two disagree.
NPM_PACKAGE = "@nino-chavez-labs/blueprint-cli"


def find_blueprint_yml(start: Path) -> Path | None:
    """Walk up from `start` looking for `blueprint.yml`. Return its directory."""
    for d in [start, *start.parents]:
        if (d / "blueprint.yml").is_file():
            return d
    return None


def _read_yaml_scalar(blueprint_yml: Path, key: str) -> str | None:
    """Cheap top-level scan for a `<key>:` scalar value (no yaml dependency)."""
    try:
        for line in blueprint_yml.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped.startswith("#") or ":" not in stripped:
                continue
            k, _, val = stripped.partition(":")
            if k.strip() == key:
                val = val.split("#", 1)[0].strip().strip('"').strip("'")
                return val or None
    except Exception:
        pass
    return None


def _read_methodology_home(blueprint_yml: Path) -> str | None:
    return _read_yaml_scalar(blueprint_yml, "methodology_home")


def _read_methodology_version(blueprint_home: Path) -> str | None:
    """The methodology's current version — single source: package.json `version`."""
    try:
        pkg = json.loads((blueprint_home / "package.json").read_text(encoding="utf-8"))
        return pkg.get("version")
    except Exception:
        return None


def _npm_package_home() -> Path | None:
    """The methodology ships inside the npm package; locate it via `npm root -g`.

    This is the zero-config path for a team member who `npm install`s the CLI
    instead of cloning. Probed last (after env + blueprint.yml + local dev paths)
    so local sessions never pay the subprocess cost.
    """
    import shutil
    import subprocess

    if not shutil.which("npm"):
        return None
    try:
        root = subprocess.run(
            ["npm", "root", "-g"], capture_output=True, text=True, timeout=5
        ).stdout.strip()
    except Exception:
        return None
    if not root:
        return None
    return Path(root) / NPM_PACKAGE


def _candidate_homes(initiative_root: Path | None):
    """Yield candidate methodology homes in resolution priority order."""
    env = os.environ.get("BLUEPRINT_HOME")
    if env:
        yield Path(env).expanduser()
    if initiative_root is not None:
        field = _read_methodology_home(initiative_root / "blueprint.yml")
        if field:
            p = Path(field).expanduser()
            yield p if p.is_absolute() else (initiative_root / p)
    home = Path.home()
    yield home / "Workspace" / "dev" / "tools" / "blueprint"   # canonical local dev
    yield home / "Workspace" / "dev" / "wip" / "blueprint"     # legacy pre-rename
    npm = _npm_package_home()
    if npm is not None:
        yield npm


def resolve_blueprint_home(initiative_root: Path | None = None) -> Path | None:
    """Resolve the methodology source. A candidate must contain METHODOLOGY.md to
    count. Returns None if nothing resolves (caller emits remediation)."""
    for cand in _candidate_homes(initiative_root):
        try:
            if cand and (cand / "METHODOLOGY.md").is_file():
                return cand.resolve()
        except Exception:
            continue
    return None


def load_canonical(blueprint_home: Path) -> list[tuple[str, str]]:
    """Read each canonical doc; return [(label, content)]. Skip missing with a note."""
    out: list[tuple[str, str]] = []
    for rel in CANONICAL_DOCS:
        path = blueprint_home / rel
        if not path.is_file():
            out.append((rel, f"<MISSING — expected at {path}>"))
            continue
        try:
            out.append((rel, path.read_text(encoding="utf-8")))
        except Exception as exc:
            out.append((rel, f"<READ-FAILED — {exc}>"))
    return out


def _verify_global_rules(blueprint_home: Path) -> str:
    """Verify methodology-shaped global rules are installed.

    Returns the line main() adds to the session context: a warning when
    ~/.claude/CLAUDE.md lacks the rules block, a note when the two rules docs
    are missing from the methodology home, or "". The note names where the
    hook looked: returning nothing there hid a wrong path from wave 74 to wave
    116. An unreadable ~/.claude/CLAUDE.md still returns "" (wave 119 follow-up).
    """
    rules_dir = blueprint_home / "template" / "docs" / "methodology" / "global-rules"
    missing = [n for n in ("audit-discipline.md", "decision-bias.md") if not (rules_dir / n).is_file()]
    if missing:
        return (
            f"**Global-rules check did not run** — missing from `{rules_dir}`: "
            + ", ".join(f"`{n}`" for n in missing)
            + ". Nothing checked `~/.claude/CLAUDE.md` for the Blueprint rules block; "
            "update the methodology source or point `BLUEPRINT_HOME` at a complete copy."
        )

    # Check if the marker block exists in ~/.claude/CLAUDE.md
    claude_md = Path.home() / ".claude" / "CLAUDE.md"
    if not claude_md.is_file():
        msg = (
            "Methodology global rules not installed. Run:\n\n"
            "    cat >> ~/.claude/CLAUDE.md << 'EOF'\n"
            "    <!-- BEGIN blueprint-methodology-rules -->\n"
            "    ... (see template/CLAUDE.md for full snippet)\n"
            "    <!-- END blueprint-methodology-rules -->\n"
            "    EOF\n\n"
            "Or consult `$BLUEPRINT_HOME/template/CLAUDE.md § Methodology-shaped global rules`."
        )
        return f"**Global rules not installed** — {msg}"

    try:
        content = claude_md.read_text(encoding="utf-8")
        has_marker = "<!-- BEGIN blueprint-methodology-rules -->" in content
        if not has_marker:
            msg = (
                "Methodology global rules not installed. Run:\n\n"
                "    cat >> ~/.claude/CLAUDE.md << 'EOF'\n"
                "    <!-- BEGIN blueprint-methodology-rules -->\n"
                "    ... (see template/CLAUDE.md for full snippet)\n"
                "    <!-- END blueprint-methodology-rules -->\n"
                "    EOF\n\n"
                "Or consult `$BLUEPRINT_HOME/template/CLAUDE.md § Methodology-shaped global rules`."
            )
            return f"**Global rules not installed** — {msg}"
    except Exception:
        pass

    return ""


def main() -> int:
    try:
        payload = json.load(sys.stdin) if not sys.stdin.isatty() else {}
    except Exception:
        payload = {}

    cwd = Path(payload.get("cwd") or os.getcwd()).resolve()
    initiative_root = find_blueprint_yml(cwd)
    if initiative_root is None:
        return 0

    blueprint_home = resolve_blueprint_home(initiative_root)
    if blueprint_home is None:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "SessionStart",
                        "additionalContext": (
                            "# Blueprint canonical context unavailable\n\n"
                            "Could not locate the methodology source. Resolution order: "
                            "`$BLUEPRINT_HOME`, a `methodology_home:` field in this "
                            "initiative's blueprint.yml, the local dev path "
                            "`~/Workspace/dev/tools/blueprint`, then an npm-installed "
                            f"`{NPM_PACKAGE}`. None contained METHODOLOGY.md.\n\n"
                            "Fix: `export BLUEPRINT_HOME=/path/to/blueprint`, or "
                            f"`npm install -g {NPM_PACKAGE}`, or add "
                            "`methodology_home: <path>` to blueprint.yml.\n"
                        ),
                    }
                }
            )
        )
        return 0

    docs = load_canonical(blueprint_home)
    rules_line = _verify_global_rules(blueprint_home)

    header = (
        "# Blueprint canonical context (auto-loaded at SessionStart)\n\n"
        f"This initiative declares `blueprint.yml` at `{initiative_root}`. The three "
        "canonical Blueprint sources are inlined below in their codified order. Read "
        "them before reasoning about methodology shape, variant choice, or portal "
        "pattern — they exist precisely so consumer sessions stop re-deriving the "
        "methodology from first principles each time.\n\n"
        "**Source of truth**: the methodology source at `"
        f"{blueprint_home}`. If you propose a change to Blueprint methodology, "
        "the change lands in those files, not in this consumer session's notes.\n\n"
    )

    if rules_line:
        header += f"{rules_line}\n\n"

    methodology_version = _read_methodology_version(blueprint_home)
    pinned = _read_yaml_scalar(initiative_root / "blueprint.yml", "methodology_version")
    version_line = ""
    if methodology_version:
        version_line = f"**Methodology version**: `{methodology_version}`"
        if pinned and pinned != methodology_version:
            version_line += (
                f" — this initiative pins `methodology_version: {pinned}`, which differs. "
                "Run `blueprint upgrade` to review the changelog delta before proposing changes."
            )
        elif pinned:
            version_line += f" (initiative pinned to `{pinned}`, in sync)."
        version_line += "\n\n"

    body_parts: list[str] = [header, version_line]
    for label, content in docs:
        body_parts.append(f"---\n\n## `{label}`\n\n{content}\n\n")

    additional_context = "".join(body_parts)
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": additional_context,
                }
            }
        )
    )
    return 0


def _self_test_global_rules(source: Path) -> str | None:
    """Run the hook end to end through the global-rules cases.

    Cases (a) to (c) point BLUEPRINT_HOME at this methodology source, so the
    rules docs sit where the source really keeps them. A fixture laid out from
    the hook's own path would move with a wrong path and still pass. Case (d)
    uses a home holding only METHODOLOGY.md. Each case gets a fresh HOME and
    must exit 0 and print the canonical header, so a run that printed nothing
    cannot pass an absence check. Returns None on pass, else what failed.
    """
    import subprocess
    import tempfile

    warning = "**Global rules not installed**"
    note = "**Global-rules check did not run**"
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp).resolve()  # the hook names the resolved home; macOS /var is /private/var
        initiative = t / "initiative"
        initiative.mkdir()
        (initiative / "blueprint.yml").write_text("variant: greenfield\n", encoding="utf-8")
        bare = t / "bare-home"
        bare.mkdir()
        (bare / "METHODOLOGY.md").write_text("# fixture\n", encoding="utf-8")
        # (case, methodology home, ~/.claude/CLAUDE.md text or None, expected global-rules line)
        cases = [
            ("(a) no ~/.claude/CLAUDE.md", source, None, warning),
            ("(b) CLAUDE.md without the marker", source, "# my rules\n", warning),
            ("(c) CLAUDE.md with the marker", source, "<!-- BEGIN blueprint-methodology-rules -->\n", None),
            ("(d) home without the rules docs", bare, None, note),
        ]

        def run_case(n: int, case: str, home: Path, claude_md: str | None, want: str | None) -> str | None:
            scratch_home = t / f"home-{n}"
            scratch_home.mkdir()
            if claude_md is not None:
                (scratch_home / ".claude").mkdir()
                (scratch_home / ".claude" / "CLAUDE.md").write_text(claude_md, encoding="utf-8")
            try:
                # input= closes stdin: main() reads it to EOF, and an inherited stdin can hang.
                run = subprocess.run(
                    [sys.executable, str(Path(__file__).resolve())],
                    input=json.dumps({"cwd": str(initiative)}),
                    capture_output=True,
                    text=True,
                    timeout=30,
                    env={**os.environ, "HOME": str(scratch_home), "BLUEPRINT_HOME": str(home)},
                )
            except subprocess.TimeoutExpired:
                return f"{case}: the hook did not exit within 30s"
            if run.returncode != 0:
                return f"{case}: exit {run.returncode}: {run.stderr.strip()[:200]}"
            try:
                context = json.loads(run.stdout)["hookSpecificOutput"]["additionalContext"]
            except Exception:
                return f"{case}: stdout is not the hook's JSON: {run.stdout[:200]!r}"
            if not context.startswith("# Blueprint canonical context (auto-loaded"):
                return f"{case}: no canonical context header: {context[:200]!r}"
            # Only the header, above the inlined docs, carries the global-rules line.
            lines = [l for l in context.split("\n---\n", 1)[0].splitlines() if l.startswith((warning, note))]
            if not ((len(lines) == 1 and lines[0].startswith(want)) if want else not lines):
                got = " | ".join(l[:160] for l in lines) or "no global-rules line"
                return f"{case}: expected {want or 'no global-rules line'}, got {got}"
            if want == note:
                expected = bare / "template" / "docs" / "methodology" / "global-rules"
                if f"`{expected}`" not in lines[0]:
                    return f"{case}: the note does not name {expected}: {lines[0][:200]}"
            return None

        # Every case runs, so one run names all of its failures.
        failures = [f for f in (run_case(n, *c) for n, c in enumerate(cases)) if f]
    return "; ".join(failures) or None


def _self_test() -> int:
    """The npm fallback must find the package npm actually installs.

    Lays out a fake global npm root holding a package named by the root
    package.json, stubs `npm root -g` to print it, and resolves with no
    BLUEPRINT_HOME, no methodology_home, and an empty HOME, so the npm candidate
    is the only one that can match. package.json sits three directories above
    this file in the methodology source and in the npm package; an installed
    copy under ~/.claude/hooks/ has none, and the test fails rather than skips.
    Then runs the global-rules cases against that same source.
    """
    import shlex
    import tempfile

    def fail(why: str) -> int:
        print(f"blueprint-session-start self-test: FAIL — {why}")
        return 1

    pkg_json = Path(__file__).resolve().parents[3] / "package.json"
    try:
        name = json.loads(pkg_json.read_text(encoding="utf-8"))["name"]
    except Exception as exc:
        return fail(f"cannot read the package name from {pkg_json}: {exc}")
    if name != NPM_PACKAGE:
        return fail(f"NPM_PACKAGE is {NPM_PACKAGE!r} but package.json names {name!r}")

    saved = {k: os.environ.get(k) for k in ("PATH", "HOME", "BLUEPRINT_HOME")}
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        installed = t / "global" / name
        installed.mkdir(parents=True)
        (installed / "METHODOLOGY.md").write_text("# fixture\n", encoding="utf-8")
        npm = t / "bin" / "npm"
        npm.parent.mkdir()
        npm.write_text(f"#!/bin/sh\necho {shlex.quote(str(t / 'global'))}\n", encoding="utf-8")
        npm.chmod(0o755)
        initiative = t / "initiative"
        initiative.mkdir()
        (initiative / "blueprint.yml").write_text("variant: greenfield\n", encoding="utf-8")
        (t / "home").mkdir()
        try:
            os.environ["PATH"] = f"{npm.parent}{os.pathsep}{saved['PATH'] or ''}"
            os.environ["HOME"] = str(t / "home")
            os.environ.pop("BLUEPRINT_HOME", None)
            got = resolve_blueprint_home(initiative)
        finally:
            for k, v in saved.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
        if got != installed.resolve():
            return fail(f"npm fallback resolved {got}, expected {installed.resolve()}")
    failure = _self_test_global_rules(pkg_json.parent)
    if failure:
        return fail(failure)
    print("blueprint-session-start self-test: PASS")
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if args in (["--self-test"], ["--selftest"]):
        sys.exit(_self_test())
    if args:
        # Claude Code passes no arguments. A mistyped flag must not fall through
        # to main(), which exits 0 and would pass a test run that tested nothing.
        print(f"blueprint-session-start: unknown arguments {args}; expected none or --self-test", file=sys.stderr)
        sys.exit(2)
    sys.exit(main())
