# parallel-dispatch-check

Check declared file scopes before assigning work. The optional plan mode also
checks source freshness, requirement coverage by ID, and task dependencies.
It runs locally with Bash and Node 18 or later, without package installation.

## check.sh

```text
bash tools/parallel-dispatch-check/check.sh --plan <json> [--root <repo>]
bash tools/parallel-dispatch-check/check.sh "agent1-globs" "agent2-globs" [...]
```

These paths apply to a newly stamped initiative. In Blueprint's source checkout,
prepend `template/`. Older stamps can run the tool from their methodology home.
No restamp is required to use it.

- `--plan` reads a JSON file, resolved from the current working directory.
- `--root` sets the repository root for source and scope paths. It defaults to
  the current working directory. It does not change how the plan file is found.
- Without flags, each argument is one writer's comma-separated edit globs.
  Legacy glob mode needs at least two writers and expands against the current directory.
- Exit `0` means the selected structural checks passed. Exit `1` means a plan,
  input file, or scope check failed. Exit `2` means the invocation is invalid.
- Output is diagnostic prose, not a machine-readable interface. Legacy success
  now says `PASS` instead of promising `SAFE`; its exit-code behavior is retained.

## Plan format

This illustrative plan assigns implementation and documentation independently.
Replace the placeholder digest with the SHA-256 of the exact source file bytes.
The placeholder intentionally fails validation.

```json
{
  "version": 1,
  "source": {
    "path": "docs/spec.md",
    "sha256": "REPLACE_WITH_64_LOWERCASE_HEX_CHARACTERS"
  },
  "requirements": ["REQ-1", "REQ-2"],
  "tasks": [
    {
      "id": "implementation",
      "covers": ["REQ-1"],
      "reads": ["docs/spec.md"],
      "edits": ["src/handler.ts", "tests/handler.test.ts"],
      "depends_on": [],
      "verification": ["Run the handler regression tests"]
    },
    {
      "id": "documentation",
      "covers": ["REQ-2"],
      "reads": ["docs/spec.md"],
      "edits": ["docs/usage.md"],
      "depends_on": [],
      "verification": ["Check the documented examples against the spec"]
    }
  ]
}
```

The source must name a regular file under the root. Its digest binds the plan
to those bytes. Requirement IDs name criteria in that source; a reviewer must
check their meaning and whether the source lists everything the task requires.
The checker does not extract or interpret requirements from prose.

All illustrated fields are required; unknown fields and duplicate JSON member
names are rejected, including escaped spellings of the same name. Requirements
and tasks must be nonempty. IDs use letters, digits, dots, underscores, or
hyphens, starting with a letter or digit. Requirement and task IDs must each be
unique within their own list.

Each task must cover at least one declared requirement and name at least one
planned verification step. Every requirement must be covered. `reads`, `edits`,
and `depends_on` can be empty. List entries must be unique, nonblank strings.
Verification steps are descriptions; the checker never executes them.

## Paths and ordering

Scopes are literal repository-relative paths with `/` separators. A path covers
itself and its descendants, with or without a trailing slash. `src/a` includes
`src/a/new.ts` but not `src/abc`. Future paths count without existing on disk.
Globs, absolute paths, backslashes, and empty, `.` or `..` segments are rejected.
Use explicit top-level scopes instead of a repository-wide `.` scope.

Paths compare without case and with Unicode normalization. This is deliberately
conservative on case-sensitive filesystems. Known symlinks along a declared
path are rejected. Hard-link aliases and symlinks beneath a directory scope
are not enumerated; review those separately. This is a check of declared names,
not a filesystem sandbox or a complete alias analysis.

Read/read sharing is allowed. Edit/edit and read/edit overlaps fail unless one
task depends on the other, directly or transitively. Shared prerequisites do
not order sibling tasks. Missing dependencies and cycles fail.

For example, documentation that reads the implementation's new handler must
include both `"reads": ["src/handler.ts"]` and
`"depends_on": ["implementation"]`. The host must wait for implementation to
finish and make its results available before documentation starts.
The checker does not schedule, merge, or refresh worktrees.

## Legacy limits

Glob mode compares equal names in expanded lists. Unmatched wildcards can
produce empty lists, and directory names do not expand their contents.
Bash 3.2 has no recursive `**` support. Read scopes, dependencies, and requirement
coverage are not represented. Inspect these cases manually or use plan mode.

A passing check in either mode is not permission to dispatch, evidence that
requirements are satisfied, or proof that tests ran. Undeclared shared effects
(databases, generated files, ports, external state) still need review.
Independent writers still need separate worktrees and the host's required route.

The shared [dispatch-wave skill](https://github.com/nino-chavez/agentic-ways-of-working/blob/main/skills/dispatch-wave/SKILL.md)
owns assignment and execution. The [review-to-decision reference](https://github.com/nino-chavez/agentic-ways-of-working/blob/main/docs/review-decisions.md)
owns findings and human-answer capture. This tool does not replace either owner.

## Verification and provenance

Run `node tools/parallel-dispatch-check/test.mjs` from a stamped initiative,
or prepend `template/` in Blueprint. Blueprint's `npm run test:core` runs that
suite and exercises the delivered checker through stamp smoke tests.

The original glob checker came from the wave-28 scope-overlap convention.
The optional plan mode follows [RFC #77](https://github.com/nino-chavez/blueprint/issues/77),
adapting the useful planning concepts reviewed in
[`@bridge_gpt/mcp-server` 0.2.70](https://cdn.jsdelivr.net/npm/@bridge_gpt/mcp-server@0.2.70/README.md).
It contains no Bridge code or dependency. Productivity benefits remain unmeasured.
