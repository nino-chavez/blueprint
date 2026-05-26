---
canonical: true
adr: 0001
status: accepted
date: 2026-05-25
deciders: ["Nino Chavez"]
informs: 01-prescription.md
references:
  - ../research/architecture/01-hive-cli-vs-mcp-with-optionality.md
  - ../research/competitive/03-adjacent-tools.md
  - ../research/current-state/01-ai-hive-as-companion.md
---

# ADR-0001 — Dual-protocol distribution shape

## Context

Blueprint v1 needs a distribution shape that closes the eight production-quality gaps (per `research/current-state/02-blueprint-production-quality-gaps.md`). Three of those gaps (1, 2, 7 — filesystem coupling, no versioning, paste-prompt onboarding) collapse into a distribution wedge. One more (Gap 4 — reviewers Claude-Code-locked) and half of Gap 8 collapse into an agent-portability wedge. Together these are the load-bearing v1 scope.

The architectural question: what *surface(s)* does Blueprint expose? Pure CLI? Pure MCP? Pure hosted service? Some combination?

The CLI-vs-MCP investigation on ai-hive (`research/architecture/01-hive-cli-vs-mcp-with-optionality.md`) settled the same question for the alignment-layer companion: same Worker, additive REST API surface, thin CLI client; CLI and MCP coexist; same business logic in both. The subs-initiative Worker already proves the pattern (dashboard quick-react route → MCP subrequest, single source of truth).

This ADR ratifies that Blueprint adopts the same architecture.

## Decision

**Blueprint v1 ships three invocation surfaces over a single canonical methodology source:**

1. **CLI** — `@blueprint/cli` published to npm. Primary operator surface. `blueprint init`, `blueprint review <name>`, `blueprint upgrade`. Auth-free for read-only operations on the canonical source; bearer-auth for future hosted operations (deferred to v2).

2. **MCP server** — exposes the canonical reviewers as MCP tools. Callable from Claude Code, Cursor, any MCP-aware client. Primary agent-in-session surface. Initial deploy as embedded MCP capability in the CLI (`blueprint mcp serve`) — stdio transport; HTTP transport deferred to v2 with hosted server.

3. **GitHub Actions** — `.github/workflows/blueprint-review.yml` template ships in the consumer scaffold; invokes the CLI; posts findings as PR comments. Primary CI/automation surface.

All three consume the **single source of business logic** in the methodology repo: the canonical docs (`METHODOLOGY.md` + `docs/variant-selection.md` + `docs/portal-and-tier-ladder.md`) for context; the executable reviewer implementations (`.mjs` per ADR-0002) for enforcement; the L5 stamper for scaffolding.

## Status

Accepted, 2026-05-25.

## Consequences

### Positive

- **Closes Gap 4** (Claude-Code-locked reviewers). The MCP surface keeps current consumers; the CLI unlocks Cursor / Codex / custom-harness / any-shell consumers; GitHub Actions unlocks CI.
- **Closes Gap 1** (filesystem coupling). `npx @blueprint/cli init` replaces "clone to `~/Workspace/dev/wip/blueprint`" as the canonical adoption path.
- **Closes Gap 7** (paste-prompt onboarding). CLI interactive flow replaces paste-the-right-prompt.
- **Parallel to ai-hive's planned architecture.** Two of Nino's tools converge on the same dual-protocol shape; future Cloudflare-hosted versions of both share the same Worker pattern. Reduces architecture surface area.
- **Backstage-shaped plugin path is preserved.** Reviewers are markdown specs paired with `.mjs` implementations (per ADR-0002); third-party reviewers can be added by dropping a paired spec+impl into the registry. The plugin SDK is deferred to v2 but not blocked.

### Negative

- **Dual maintenance surface.** Every reviewer needs its MCP-tool-schema export AND its CLI-subcommand wiring. Mitigation: both wrap the same `.mjs` business logic; the wire format differs but the business logic doesn't. A shared TypeScript contract (`@blueprint/contract`) holds the input/output types.
- **Bigger v1 package.** `@blueprint/cli` ships an MCP server + a CLI + a scaffolder. ~5-10 MB instead of ~500 KB. Acceptable cost for the agent-portability win.
- **MCP-via-stdio onboarding adds a step.** Operators who want the in-session tool surface run `claude mcp add --transport stdio blueprint 'npx @blueprint/cli mcp serve'`. One extra command at install time; same MCP-tool ergonomics afterward.

### Neutral

- **HTTP transport deferred to v2.** v1 MCP is stdio-only (CLI subprocess). Hosted Worker comes later when there's proven multi-consumer demand.
- **No GraphQL / gRPC.** REST + MCP only. Future protocol additions need a separate ADR.

## Alternatives considered

### Alternative 1 — CLI only, no MCP

Ship `@blueprint/cli` and drop the MCP surface. Operators run `blueprint review` from a shell or CI; agents shell-out to the same command.

**Rejected.** Loses the in-session structured-tool ergonomics MCP gives. Agents inside Claude Code reach for tools naturally during planning; making them shell-out is friction the LLM works around inconsistently. The current markdown-reviewer-invoked-by-agent pattern works (when Claude Code is the runtime); abandoning MCP entirely would regress that case for zero structural gain.

### Alternative 2 — MCP only, no CLI

Keep the MCP-only shape; add HTTP transport to support more agents.

**Rejected.** Doesn't close Gap 4 in the way that matters. The "non-Claude consumers" surface includes operators running shell scripts, CI workflows, GitHub Actions, cron-driven jobs — none of which have MCP clients. The MCP-only path leaves all of those gaps open.

### Alternative 3 — Hosted service from day one

Ship a Cloudflare Worker + D1 backend as the canonical Blueprint instance; CLI is a thin client of the hosted service.

**Rejected for v1.** Adds auth + billing + multi-tenancy + hosting cost before there's proven demand from external consumers. The npm + filesystem-cache trust model is correct for v1 (operators trust npm; the methodology repo's canonical source is read-only). Hosted server deferred to v2 with a clear demand signal.

### Alternative 4 — Backstage-style plugin SDK from day one

Build the full plugin registry pattern: reviewers as installable npm packages with a manifest contract; CLI dynamically loads them.

**Rejected for v1.** No external consumer authoring reviewers yet. SDK design without a real consumer produces an over-engineered surface that the first actual third-party plugin author would push back on. The canonical-set-only path is correct for v1; SDK design lands in v2 once at least one third-party plugin author exists to inform the contract.

## Implementation notes

The CLI package layout (sketch — actual code lands in Stage 3):

```
@blueprint/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts          → invokes stamper + scaffolds + writes blueprint.yml
│   │   ├── review.ts        → loads reviewer registry; runs requested reviewer; formats output
│   │   ├── upgrade.ts       → semver-aware methodology version bump
│   │   ├── mcp.ts           → spawns MCP server over stdio
│   │   └── doctor.ts        → checks SessionStart hook installed, canonical-docs accessible
│   ├── lib/
│   │   ├── contract.ts      → shared input/output types per operation
│   │   ├── reviewer-registry.ts  → loads canonical .mjs reviewers + future plugin reviewers
│   │   └── stamper-wrap.ts  → wraps template/tools/blueprint-init/stamp.mjs
│   └── index.ts             → CLI entry point (commander.js)
├── package.json
└── bin/
    └── blueprint            → shebang Node script
```

The MCP-over-stdio server in `commands/mcp.ts` exposes the reviewer registry as tools. Tool schemas generated from the shared contract; tool implementations call the same `.mjs` reviewers as the CLI.

GitHub Action template ships at `template/.github/workflows/blueprint-review.yml` and gets stamped into consumer scaffolds:

```yaml
name: Blueprint Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx -y @blueprint/cli@latest review --all --format=github-actions
```

The `--format=github-actions` flag emits GitHub's annotation format so findings surface inline on the PR diff. Blocking findings fail the check.

## Follow-ups

- **ADR-0002** ratifies the executable-reviewer implementation pattern this ADR depends on.
- **Stage 3** prototypes the CLI in `prototype/` (or directly in `wip/blueprint/template/tools/cli/` after v1 ships — Stage 3 first proves the shape).
- **v2 ADR** (future): HTTP transport for MCP + hosted Worker decision.
- **v2 ADR** (future): plugin registry contract for third-party reviewers.

## References

- `research/architecture/01-hive-cli-vs-mcp-with-optionality.md` — the protocol-comparison investigation this ADR builds on.
- `research/competitive/01-lopopolo-harness-engineering.md` — Lopopolo's "custom linters with remediation injection" pattern that the CLI surface must support.
- `research/current-state/01-ai-hive-as-companion.md` — ai-hive's dual-protocol Worker pattern that proves the architecture works at scale.
