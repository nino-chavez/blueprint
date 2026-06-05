# Contributing to Blueprint

Blueprint is a methodology distribution: a canonical source (`METHODOLOGY.md`,
`docs/`, `template/`) that consumer initiatives stamp from and improve in the
field. This doc is the **UP channel** — how a fix or idea discovered in a
consumer flows back into the source — and the review boundary that governs it.

It is deliberately **Rust-RFC-lite** (ADR-0004): substantial changes need an RFC;
fixes and trivial changes are plain PRs. A single-maintainer methodology repo has
no SIGs or editor corps, so KEP/PEP ceremony would bottleneck the exact field
contributions this channel exists to accept.

## The one routing question

Every contribution fixes a problem at exactly one layer. The layer (the
**4-bucket taxonomy**, `docs/amendment-classification-pattern.md`) decides both
where the fix lands and whether it needs an RFC.

```
Does the fix only matter to your one initiative's domain shape?
├── Yes → consumer-local. It stays in YOUR repo. Nothing to send upstream.
│         (Record it in your METHODOLOGY-AMENDMENTS.md as Scope: Per-initiative.)
└── No → it is a promotion candidate. Which surface does it change?
    ├── A reviewer's rubric / gate        → reviewer    bucket  → RFC if it changes what passes/blocks
    ├── Other template/ files (stamper,   → template    bucket  → RFC if it changes the stamped contract;
    │   chrome, schema, scaffolds)                                  plain PR if it's a bug-fix to existing behavior
    └── METHODOLOGY.md / docs/ / a        → methodology  bucket  → ALWAYS an RFC (first-principles change)
        taxonomy / a stage definition
```

| Path | What it is | Process |
|---|---|---|
| **consumer-local** | Specific to your initiative; no other consumer hits it | Stays in your repo. Do not send a PR here. |
| **bug-fix** (any bucket) | Restores intended behavior; no contract change | **Plain PR.** Describe the bug, the fix, and the consumer that surfaced it. |
| **substantial** (template/reviewer/methodology) | New reviewer, new stage, a changed stamped contract, a taxonomy edit | **RFC first** (open an *Amendment / RFC* issue), then a PR that references it. |

If you are unsure, open the RFC issue — misrouting up is cheap; a silent
first-principles change is not.

## Filing an amendment from a consumer

Consumers already keep an append-only `METHODOLOGY-AMENDMENTS.md`
(`template/docs/methodology/methodology-amendments-convention.md`). To promote
one:

1. **Open an *Amendment / RFC* issue** (`.github/ISSUE_TEMPLATE/amendment-rfc.yml`).
   It captures the bucket, the substantial-vs-bug-fix routing, the consumer that
   surfaced it, and the evidence (a real commit / file / screenshot — never an
   imagined case).
2. For a **bug-fix**, you may open the PR immediately and link the issue.
3. For a **substantial** change, let the RFC issue settle first (an admin
   confirms the bucket and the shape). Then open the PR referencing it.

## Pull requests

- Reference the RFC/amendment issue (`Closes #NNN`) when there is one.
- Promotion-sensitive paths (`METHODOLOGY.md`, `docs/`, `template/`,
  `*AMENDMENTS*`, governance + distribution config) require an **admin review** —
  enforced by `CODEOWNERS` + the `main` ruleset (`docs/governance/`). This is the
  mechanical promotion authority; it is not optional.
- Methodology changes ship as **waves** (a freeze-rule acknowledgment + a
  consumer-sync note per wave; see `WAVE-LOG.md` and `CLAUDE.md`). A PR that lands
  a promotion should say which wave it belongs to.
- Keep the change minimal. Custom shapes that diverge from a canonical/vendor
  pattern must carry an explicit "why not canonical" sentence.

## Access & roles

Roles map to git-host teams + built-in repo roles via `access.roles` in
`blueprint.yml` (ADR-0004) — `admin` / `contributor` / `reviewer` / `stakeholder`.
Blueprint carries the **intent**; the git host **enforces** it (rulesets +
CODEOWNERS + team membership). There is no Blueprint-owned identity service
(scope ceiling A).
