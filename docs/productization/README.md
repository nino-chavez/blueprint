# Blueprint productization — synthesis, decisions, and provenance

This directory is the methodology source's self-contained record of **why
Blueprint became a team-adoptable platform and how that maps to the code** — the
"why" promoted alongside the "what" so the rationale never lives only in a
consumer repo. Promoted from the `blueprint-platform` dogfood in wave 43.

## The goal (what this was)

> "Use Blueprint on itself to develop it and evolve it in a way that makes it
> adoptable and portable for teams."

The operator named six requirements; the dogfood expanded them (architect-surfaced
additions in brackets) and grouped them into six tracks:

| # | Original requirement | Track |
|---|---|---|
| 1 | Team-adoptable / portable (not just solo-Nino; stampable into any team's repos) | A, E |
| 2 | Cost-efficiency configurable "like the effort level of Claude Code" | B |
| 3 | Scalable operations + access control across departments/org | C |
| 4 | Bidirectional operational updates (push non-breaking down, accept fixes/requests up) | A |
| 5 | Fully documented | E |
| 6 | Onboarding / enablement ramp | E |
| + | [registry/fleet, semver+deprecation, contract tests, telemetry/FinOps, governance, plugin model, identity, certification] | A–F |

**Scope ceiling A — methodology-native**: no Blueprint-owned hosted server.
Everything runs on the git host + npm + local files. This is the single
constraint that shapes every decision below (a registry instead of a catalog
service; CODEOWNERS+rulesets instead of an auth service; `consumers.yml` mirror
instead of a control plane).

## What was built (the output, in the source)

A thin, dependency-free CLI (`@nino-chavez-labs/blueprint-cli`) — `init / review /
cost / fleet / upgrade / doctor`, all real — over six self-tested libs under
`template/tools/lib/`, plus governance + distribution artifacts. The build order
(steps 0–13) is complete.

## The decisions (the why) — ADR → feature → wave

Each ADR was promoted here from the dogfood; its internal cross-references
(`../research/…`, `../../blueprint-redesign/…`) resolve in that consumer, and the
research it cites is mirrored in this directory (below).

| ADR | Decision | Where it landed (source) | Track / waves |
|---|---|---|---|
| [ADR-0003](../decisions/ADR-0003-cost-effort-dial.md) | Configurable cost/effort dial — per-stage effort (Claude Code enum) + model_tier, skip-justification gate, local telemetry | `template/blueprint.yml cost:` + `tools/lib/cost-dial.mjs` + `telemetry.mjs` + `cost-gate-reviewer` | **B** / 35–36 |
| [ADR-0004](../decisions/ADR-0004-native-access-governance.md) | Access = the git host's identity + controls (CODEOWNERS, rulesets, Rust-RFC-lite, `access.roles`) | `.github/CODEOWNERS`, `docs/governance/`, `CONTRIBUTING.md`, `template/tools/triage/` | **C** / 39–40 |
| [ADR-0005](../decisions/ADR-0005-bidirectional-update-protocol.md) | Bidirectional update protocol (DOWN: push non-breaking; UP: accept field fixes) | `consumers.yml` + `tools/lib/consumers-registry.mjs` (`fleet`) + `upgrade.mjs` | **A** / 37–38 |
| [ADR-0006](../decisions/ADR-0006-native-extensibility.md) | Org-authored reviewers without forking — the `review()` signature is the SDK | `tools/lib/reviewer-registry.mjs` + `review --list` | **D** / 41 |
| [ADR-0007](../decisions/ADR-0007-versioning-distribution-toolchain.md) | Semver + Changesets + the npm CLI distribution toolchain | `package.json` + `bin/blueprint.mjs` + `bin/lib/blueprint-home.mjs` | **A/E** / 31–32 |

There is also a methodology-native [ADR-0005 consumer-registry-and-fleet](../decisions/0005-consumer-registry-and-fleet.md)
(distinct from the bidirectional-protocol ADR above) written directly in the
source during the fleet/upgrade work — it fixes the concrete `consumers.yml` +
`fleet` + `upgrade` shape, including the Upgrade (DOWN-channel) section.

## The input analysis (research + synthesis) — mirrored here

- [recon-synthesis.md](recon-synthesis.md) — the 6-agent gap analysis that found
  what the original six requirements missed (the evidence base for the tracks).
- [canonical-research.md](canonical-research.md) — vendor-canonical + internal-impl
  grounding for every primitive (the basis for every ADR's "why not canonical").
- [charter.md](charter.md) — the gap scorecard, the six tracks, and the
  scope-ceiling decision (A).
- [prescription.md](prescription.md) — what v1 ships/defers + the research-refined
  build order.

## The live dogfood (durable, public)

The productization initiative itself: **github.com/nino-chavez/blueprint-platform**
(a standalone public repo) with a deployed Pattern A portal at
**blueprint-platform.pages.dev** (the roadmap there renders the build order). Its
`decisions/` and `research/` are the originals these were promoted from; its
`METHODOLOGY-AMENDMENTS.md` is the running ledger of dogfooding learnings.

## What remains (operator-gated, not new build steps)

- Bind the governance ruleset: `docs/governance/apply-ruleset.sh` (needs `gh` admin).
- Publish the CLI: `npm publish @nino-chavez-labs/blueprint-cli` (then `npx … init` is
  the public scaffolder).
- Track **F (multi-operator / ai-hive)** — the one deferred track; integrate, do
  not absorb. A future initiative, not a remaining build step.
