---
canonical: true
adr: 0002
status: accepted
date: 2026-05-25
deciders: ["Nino Chavez"]
informs: 01-prescription.md
depends_on: ADR-0001-dual-protocol-distribution.md
references:
  - ../research/competitive/01-lopopolo-harness-engineering.md
  - ../research/competitive/03-adjacent-tools.md
---

# ADR-0002 — Reviewers as executable plugins

## Context

Blueprint's reviewer agents currently exist as markdown specifications in `template/.claude/agents/blueprint/reviewers/`. Each spec describes:

- What the reviewer checks
- When it fires (which stage gate)
- How to report findings

A Claude Code agent reads the spec, pattern-matches against the repo, and emits a structured response. The pattern works when Claude Code is the runtime; it does not work when:

- A non-Claude agent (Cursor without Claude, Codex CLI, custom GPT-API harness) tries to invoke the reviewer
- CI / GitHub Actions needs to run the reviewer without a paid agent session
- The methodology-gardening agent (per the prescription) needs to validate reviewer behavior programmatically

Lopopolo's "Harness engineering" piece names the production-grade pattern: *"We enforce these rules with custom linters and structural tests, plus a small set of taste invariants."* The lint error messages *"inject remediation instructions into agent context."* This is the shape Blueprint's reviewers need.

ADR-0001 ratifies the dual-protocol distribution shape (CLI + MCP + GitHub Actions). This ADR ratifies what the reviewers themselves become so they can be invoked across all three surfaces.

## Decision

**Each reviewer ships as a paired markdown spec + executable `.mjs` implementation.**

The markdown spec stays as the canonical human-readable description (what it checks, when it fires, why it exists). The `.mjs` implementation is the executable lint that all three invocation surfaces consume.

### Pair shape

```
template/.claude/agents/blueprint/reviewers/
├── portal-pattern-a-conformance-reviewer.md      ← human-readable spec (canonical)
├── portal-pattern-a-conformance-reviewer.mjs     ← executable lint (paired)
├── portal-pattern-b-conformance-reviewer.md
├── portal-pattern-b-conformance-reviewer.mjs
├── research-completeness-reviewer.md
├── research-completeness-reviewer.mjs
└── ... (all 9 reviewers)
```

### Executable interface

Every `.mjs` exports a default async function with the same signature:

```ts
export default async function review({
  targetDir: string,           // absolute path to the initiative root
  blueprintYml: BlueprintConfig, // parsed blueprint.yml (variant, tier, pattern, etc.)
  methodologyHome: string,      // absolute path to the canonical methodology
}): Promise<ReviewResult>;
```

`ReviewResult` is:

```ts
interface ReviewResult {
  status: 'PASS' | 'BLOCKED' | 'WARN';
  findings: Array<{
    severity: 'BLOCK' | 'WARN';
    location: string;           // file path or "global"
    message: string;            // one-line summary
    remediation: string;        // explicit fix instructions (Lopopolo's injection pattern)
    reference?: string;         // pointer to the canonical doc / pattern that named this rule
  }>;
  metadata: {
    reviewer: string;           // reviewer name
    targetSummary: string;      // one-line "I reviewed X" for human output
    durationMs: number;
  };
}
```

### Three consumers, single business logic

- **CLI** (`blueprint review portal-pattern-a --target=./apps/portal/`) imports the `.mjs` and invokes its default export. Output formatted per `--format=human|json|github-actions`.
- **MCP tool** (`blueprint mcp serve` exposes one tool per reviewer) wraps the `.mjs` invocation in a tool handler. Tool schema derived from the shared contract.
- **GitHub Actions** (`.github/workflows/blueprint-review.yml`) runs the CLI with `--format=github-actions`, posting findings as PR annotations.

### Remediation injection

Per Lopopolo: *"Because the lints are custom, we write the error messages to inject remediation instructions into agent context."*

Every finding includes a `remediation` field — explicit, actionable text describing how to fix the issue. Example for a missing audience switcher:

```
{
  "severity": "BLOCK",
  "location": "apps/portal/src/layouts/Layout.astro",
  "message": "AudienceSwitcher component not rendered in layout",
  "remediation": "Import { AudienceSwitcher } from '@blueprint/ui/audience-switcher' at the top of Layout.astro, then render <AudienceSwitcher /> inside the navbar slot. The IA contract requires the switcher on every page; placeholder labels are fine for routes not yet authored.",
  "reference": "docs/portal-and-tier-ladder.md#pattern-a-the-ia-contract-mandatory"
}
```

The remediation field is what agents read when they consume the lint output. A passing agent that reads "BLOCK: AudienceSwitcher missing. Fix: import + render in Layout.astro navbar slot" can act on it directly. A human reading the same output gets the same actionable text.

## Status

Accepted, 2026-05-25.

## Consequences

### Positive

- **Closes Gap 4** (Claude-Code-locked reviewers) at the implementation layer. The CLI / MCP / GitHub Actions surfaces in ADR-0001 have something concrete to invoke.
- **Closes Gap 5** (no tests) becomes tractable. Each `.mjs` can be unit-tested with fixture directories; CI runs the suite. Markdown-spec reviewers couldn't be tested mechanically.
- **Closes half of Gap 6** (methodology-gardening agent). The agent can mechanically verify that each `.mjs` implementation matches what the paired `.md` spec describes — drift between the two surfaces becomes a fix-up PR.
- **Lopopolo-pattern remediation injection.** Agents reading the lint output get actionable fix instructions, not just "this is broken." Same pattern as Lopopolo's OpenAI team.
- **Plugin path preserved.** Third-party reviewers (deferred to v2) follow the same paired-file convention; the registry just discovers more pairs. No SDK redesign needed when external authors arrive.

### Negative

- **Dual maintenance per reviewer.** Spec changes need to propagate to the implementation, and vice versa. Mitigation: methodology-gardening agent (independent item 3 in the prescription) checks the pair for consistency; differences surface as fix-up PRs.
- **More code to ship.** 9 reviewer `.mjs` files instead of 9 markdown specs. Each is ~150-300 lines of TypeScript/JS. Total maintenance load: modest; each reviewer's logic is constrained to a handful of `grep` / `Glob` / `Read` operations (matching what the current markdown specs already describe).
- **Behavior must match spec or the spec lies.** The pair is only as honest as its consistency. If the `.mjs` checks for `AudienceSwitcher` but the spec says `AudienceToggle`, the spec is wrong — and consumers reading the spec get misled. Drift detection is mandatory.

### Neutral

- **Markdown specs stay canonical for the human-readable description.** The `.mjs` is the executable truth; the `.md` is the explanation. When they disagree, the `.md` gets updated to reflect the `.mjs` (per the gardening agent's PRs).
- **No reviewer framework dependency.** The `.mjs` files are plain Node ESM modules. No `@blueprint/reviewer-sdk` package; just a stable interface contract. This keeps the dependency surface tiny.

## Alternatives considered

### Alternative 1 — Markdown specs only (status quo)

Keep the current pattern; reviewers are markdown that Claude Code reads + pattern-matches.

**Rejected.** Doesn't close Gap 4. Non-Claude consumers and CI workflows have no path. The whole point of this ADR is to break the Claude-Code lock-in.

### Alternative 2 — Replace markdown specs with `.mjs` only

Drop the `.md` files; the `.mjs` files have JSDoc / TSDoc as the canonical description.

**Rejected.** Human-readable explanation buried in code comments is worse than dedicated markdown for a methodology audience. The spec describes *why* the rule exists and *what failure mode it catches*; the code describes *how* it checks. Two surfaces, two audiences. Drift between them is the cost; the gardening agent pays it.

### Alternative 3 — Backstage-style plugin SDK with manifest packages

Each reviewer ships as a separate npm package (`@blueprint/reviewer-portal-pattern-a`) with a `blueprint-reviewer.json` manifest. CLI / MCP dynamically loads packages from `node_modules`.

**Rejected for v1.** No external plugin authors yet. SDK design without a real consumer over-engineers the contract. The canonical-set-only path is correct for v1; SDK is v2 work after at least one third-party author exists. Until then, third parties fork the methodology repo + add `.mjs` files to their copy of the registry.

### Alternative 4 — WASM-compiled reviewers for sandboxed CI execution

Each reviewer compiles to WASM for hermetic execution in untrusted environments.

**Rejected as overengineering.** Reviewers run against the consumer's own repo in trusted CI contexts (GitHub Actions, etc.). Hermetic execution adds compilation complexity for no security gain in the v1 trust model. Revisit if a hosted Blueprint server (deferred to v2) runs reviewers against untrusted consumer code on shared infrastructure.

## Implementation notes

### Reviewer implementation example (sketch)

```js
// template/.claude/agents/blueprint/reviewers/portal-pattern-a-conformance-reviewer.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

export default async function review({ targetDir, blueprintYml }) {
  const findings = [];
  const portalDir = path.join(targetDir, 'apps', 'portal');

  // Check 1 — portal exists
  if (!await exists(portalDir)) {
    findings.push({
      severity: 'BLOCK',
      location: 'apps/portal/',
      message: 'No apps/portal/ directory found',
      remediation: 'Run `npx @blueprint/cli init --pattern=A` to scaffold the Pattern A portal, or check whether this initiative declared the wrong portal_pattern in blueprint.yml.',
      reference: 'docs/portal-and-tier-ladder.md#pattern-a-platform-portal',
    });
    return finalize(findings, 'portal-pattern-a-conformance-reviewer');
  }

  // Check 2 — six canonical routes
  const requiredRoutes = ['index', 'discover', 'try', 'build', 'operate', 'inspect', 'roadmap'];
  for (const route of requiredRoutes) {
    const routeFile = path.join(portalDir, 'src/pages', `${route}.astro`);
    if (!await exists(routeFile)) {
      findings.push({
        severity: 'BLOCK',
        location: `apps/portal/src/pages/${route}.astro`,
        message: `Required IA route '${route}' missing`,
        remediation: `Create apps/portal/src/pages/${route}.astro. Placeholder content is fine for routes not yet authored; the contract requires the route file exists. See template/apps/portal/src/pages/${route}.astro for the canonical starter.`,
        reference: 'docs/portal-and-tier-ladder.md#pattern-a-the-ia-contract-mandatory',
      });
    }
  }

  // ... (Checks 3-7 from the markdown spec, each as code)

  return finalize(findings, 'portal-pattern-a-conformance-reviewer');
}

function finalize(findings, reviewer) {
  const blockers = findings.filter(f => f.severity === 'BLOCK');
  const warns = findings.filter(f => f.severity === 'WARN');
  return {
    status: blockers.length > 0 ? 'BLOCKED' : (warns.length > 0 ? 'WARN' : 'PASS'),
    findings,
    metadata: { reviewer, targetSummary: '...', durationMs: 0 },
  };
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
```

### Contract test fixture layout

```
template/tests/reviewers/portal-pattern-a/
├── passing/
│   ├── apps/portal/src/pages/{index,discover,try,build,operate,inspect,roadmap}.astro
│   ├── apps/portal/src/layouts/Layout.astro     (with AudienceSwitcher)
│   ├── apps/portal/package.json                  (with @blueprint/ui dep)
│   └── blueprint.yml
└── failing-missing-discover/
    └── apps/portal/src/pages/{index,try,build,operate,inspect,roadmap}.astro  ← no discover.astro
```

CI test:

```js
import review from '../portal-pattern-a-conformance-reviewer.mjs';
test('PASS on canonical layout', async () => {
  const r = await review({ targetDir: 'tests/fixtures/portal-pattern-a/passing', ... });
  expect(r.status).toBe('PASS');
});
test('BLOCK on missing discover route', async () => {
  const r = await review({ targetDir: 'tests/fixtures/portal-pattern-a/failing-missing-discover', ... });
  expect(r.status).toBe('BLOCKED');
  expect(r.findings).toContainEqual(expect.objectContaining({
    message: expect.stringContaining('discover'),
    severity: 'BLOCK',
  }));
});
```

## Migration plan

Each existing markdown spec gets its `.mjs` pair in order of impact:

1. **Portal pattern A + B conformance reviewers** (highest leverage; catch the failure mode that triggered the 2026-05-25 reconciliation).
2. **Research completeness reviewer** (gates Stage 1 → 2).
3. **Design principles reviewer + prescription evidence reviewer** (gate Stage 2 → 3, variant-dependent).
4. **Doc quality auditor + terminology linter** (gate Stage 5 → 6).
5. **Prototype smoke runner** (Stage 6 ship gate; already partially executable since it boots the prototype + drives browse-tool — this one becomes the easiest migration).
6. **Fact-check loop reviewer** (orchestrator; complex case — runs other reviewers as sub-checks).

Each migration is one PR. The markdown spec gets updated alongside the new `.mjs` so the two stay consistent at landing time. The gardening agent (independent item 3) enforces consistency thereafter.

## Follow-ups

- **Stage 3 prototype work** ships a CLI that runs at least one executable reviewer end-to-end. Portal Pattern A conformance is the right first target — it has the clearest pass/fail signal.
- **v2 ADR**: plugin registry contract for third-party reviewers; lands when at least one external author exists to inform the surface.
- **Stage 4 fact-check** validates that each `.mjs` reviewer's findings match its paired `.md` spec's description. First test of the gardening-agent pattern.

## References

- `research/competitive/01-lopopolo-harness-engineering.md` — Lopopolo's "custom linters with remediation injection" pattern this ADR adopts.
- `ADR-0001-dual-protocol-distribution.md` — ratifies the three invocation surfaces this ADR's `.mjs` reviewers feed.
- Current markdown specs at `template/.claude/agents/blueprint/reviewers/*.md` — the canonical descriptions that get `.mjs` pairs.
