# Workflow readiness fixes — 2026-10-01

The local changes prevent research advancement from bypassing its reviewers.
They also stop ready artifacts from counting as observed outcomes. Doctor now
shows unfinished workflow separately from tooling and conformance checks.

The work was prepared on `codex/workflow-readiness-current-20261001`, based on
`a4f1ff182fe849d898d2df401711b0b4da6f659b`. The user authorized source push and
merge after the local review. No npm version bump, consumer update, or host
installation is included. The existing main workflows own release checks and
the portal refresh; their results must be checked separately after merge.

## Reproduced defects and resulting behavior

| Reproduction | Before | With these changes |
|---|---|---|
| Competitive research, prior art, and a populated personas file; no problem-space content | The structural count passes and advancement can bypass the completeness reviewer | The count remains structural; the bound reviewer refuses advancement |
| Filled-looking personas with no resolvable jobs | Advancement does not run persona-fit | Persona-fit refuses advancement, including after an older stage record |
| Doctor on a fresh research stamp | Tooling checks do not expose stage readiness | Tooling stays healthy; workflow reports pending artifacts, assertions, and reviews |
| Fresh research onboarding at `47b4ae1` | Advertised root guide absent; no Codex entry point | Wave 123 already supplies the guide; this change adds a Codex pointer and shared startup steps |
| Ready outputs, proof targets, no receipts | Manifest PASS; recovery brief says all outcomes are proven | Manifest PENDING; recovery prose makes no proof claim |

Persona-fit needs a narrow Stage-1 invocation: the later memo cannot be a
prerequisite for beginning research. The optional reviewer argument `gateId`
selects that check. Direct persona reviews still inspect decisions and the memo.
No new reviewer binding was added to the other variants.

## Verification

The regression runner is `template/tools/blueprint-init/workflow-smoke.mjs`.
Its original ten controls failed on `47b4ae1` before implementation. The final
runner has thirteen checks, including an apparently complete pipeline and an
unresolvable reviewer. Both negative cases fail closed.

`npm run test:core` runs the existing library, reviewer, stamp, and hook tests,
plus this regression runner. All 23 steps ran and printed their pass lines.
Stamp checks cover both portal types and research, existing instruction files,
symlinks, public CLI delivery, and dry-run behavior. Passing the hook's self-test proves fixture behavior;
it does not prove that a live host trusted or executed that hook.

Read-only calibration against the preserved and repaired consumer manifests is
saved in [the JSON receipt](2026-10-01-workflow-readiness.json). The preserved
manifest hash matches the triggering report. It now yields PENDING with no
structural errors. Its old documents separately fail doc-currency because of
three broken links; that existing failure is unrelated to unfinished research.
The repaired consumer passes both mapped research reviews and remains pending
for later work and outcome receipts. Neither stage-state file changed.

## Compatibility and limits

- Doctor retains `checks`, `status`, and `notChecked`. It adds `health` and
  `workflow`. Pending workflow can change PASS to WARN without making the CLI
  exit nonzero. Missing or broken mapped reviewers still fail the command.
- `stage status` remains an artifact-and-assertion view. Reviewer bindings are
  enforced by `stage advance`; doctor runs them read-only for readiness.
- Existing manifests need no schema migration. Missing receipts now prevent
  PASS even when `human_validation` was omitted. Receipts retain the existing
  output-level scope; the validator checks their declarations, not whether the
  observation happened, remained current, or measured a real benefit.
- Existing `CLAUDE.md` and `AGENTS.md` files remain project-owned. A consumer
  update must review its startup instructions rather than expect re-stamp to
  overwrite them. No shared Codex or Claude configuration was changed.
- The new research bindings were checked against synthetic negative controls
  and the triggering research consumer. This is not full-fleet acceptance or
  evidence of improved human outcomes.

The fleet command reports version drift, not live migration state. The explicit
task authority covers this scoped source change while the consumer keeps its
local checks. No concurrent migration conflict was identified. Consumer installation remains a separate, unperformed step.
