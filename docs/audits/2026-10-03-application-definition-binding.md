# The phase engine reads the declared application source packet

Verification record: implemented and locally tested on October 3, 2026, before
source publication. The user subsequently authorized push and merge. No consumer
is activated by this slice.

The phase engine now reads the declared application-definition document
mapping. Source defects appear in status, advance, and doctor output. Even a
clean source packet cannot complete the application phase while substantive
review and authority remain unverified.

The source scanner checks content hashes, declared IDs, and literal references.
It cannot decide whether the application covers every job or whether a person
approved the design. A passing source check therefore remains a pending phase.

## Select one manifest from one project root

`application_definition` in the initiative root's `blueprint.yml` names one JSON
document mapping. The manifest and its source paths are relative to that root.
A manifest can live under `blueprint/`; doing so does not change its source root.
The source gate does not use the generic best-result search across root and
nested folders. Existing artifact gates keep that behavior.

An undeclared passing manifest cannot rescue a broken declared one. Missing or
ambiguous declarations, unsupported schemas, and unsafe paths produce an
actionable diagnostic. If `blueprint/blueprint.yml` also declares a mapping,
it must resolve to the same selected file. It never supplies a fallback. No file or authority provider is discovered by guessing.

## Preserve the source inspector's limits

| Candidate | Test against the existing cases | Decision |
|---|---|---|
| Require the structured research fixture format | Its single-actor linear journey model cannot represent Aisles' operator-to-merchant handoff without losing meaning. Existing documents also lack some of its fields. | Reject for this slice. |
| Let document-source checks complete the phase | Both captured project packets can pass source checks while review questions and approval remain unresolved. | Reject. |
| Bind the owned document mapping and retain the review/authority hold | Preserves project IDs and prose, exposes source errors in the real engine, and grants no product action. | Select. |

Retain explicit phases and negative controls from the structured fixture.
Retain source locations and fingerprints from the document-only approach.
Do not retain fixed packet filenames, flattened fake stages, or an inference
that source integrity proves product approval.

The shared document inspector has one owner under `template/tools/lib`. The
research import delegates to it. The research packet's dated test and capture
receipts remain historical evidence; moving the implementation does not create
a fresh visual review or product approval.

## No local artifact can grant the missing authority

The new source gate is opt-in. Its clean-source result retains
`authority: not-verified`, empty allowed actions, and explicit review needs.
It cannot become optional or non-derivable, so an assertion cannot bypass it.
No built-in model, consumer configuration, or producing skill changes.

The named pilot reviewer and trusted human-decision source are still pending.
The source trial recommended Aisles as the whole-application integration case
and Gather Here as the bounded comparison. That recommendation is not their
activation or approval. The user was asked to bind the pilot owner/source; no
answer is inferred from elapsed time.

Do not substitute a JSON actor name, an agent-authored approval file, or a
dispatch receipt for a human decision. The host authority adapter, substantive
review, selected-baseline reconciliation, Gate F, producer preflight, and actual
consumer acceptance remain dependent work under RFC #65.

## Compatibility and migration boundary

The preceding optional-phase slice remains local in the same isolated worktree.
Its uncommitted source was preserved before this integration. Existing models
that do not select the new source check must keep their behavior.

The October 3 fleet check still reports 16 consumers, six behind and ten unpinned.
These are version diagnostics, not a live migration inventory. No conflicting
migration was identified in the checked work. This slice changes no consumer
files, pins, npm version, deployment configuration, or host setup.

## Verification

The parent independently reproduced three defects in the first implementation:
a conflicting nested configuration was accepted, a root configuration symlink
could escape the initiative, and the input inventory accepted an unknown schema.
All three now refuse, with permanent regression controls. Diagnostics also carry
the offending source path and error code into the public commands.

Executed checks:

- `npm run test:core`: all 24 registered steps ran and printed their pass lines.
- Application-definition self-test: valid sources stay pending; missing,
  duplicated, conflicting, escaped, or unsupported inputs refuse. Configuration
  changes alter the fingerprint. Changed checker code cannot reuse a cached
  implementation while claiming the new method hash.
- Document-input compatibility suite: 34 synthetic controls passed. This is
  scanner evidence, not product acceptance.
- Workflow smoke: all 15 aggregate checks passed, including a fresh stamped
  inspector, CLI text/JSON, actual refused writes, actionable errors, root/nested
  selection, stale sources, and rejected assertion/optional/parameter overrides.
  Doctor keeps configuration errors separate from healthy tool installation.
- The saved Aisles and Gather Here source snapshots produce the same research
  inspection results as the pre-move baseline, excluding changed method and
  fingerprint fields. In disposable initiative roots, both source checks pass,
  both phase checks remain partial, and actual advance attempts write no state.
  Staling a copied source fails each check. Original snapshot hashes are unchanged.
- `npm run manifest:check`: exit 0; existing human-outcome receipts remain pending.
- `git diff --check`: no whitespace errors. Main is clean and local branch tips
  match their pre-dispatch values.

One bounded independent review found no material issue on static inspection.
Its read-only sandbox denied temporary-fixture creation, so it did not execute
the tests; the runtime evidence above comes from the parent. The dispatch
receipt records requested Terra/high but exposes no observed model or effort.
Those runtime fields remain unverified. No additional broad review was launched.

Private reproduction and snapshot receipts live under the research packet's
ignored `.local/definition-integration-20261003/` directory. Public source and
regression tests contain no copied consumer documents. Historical packet capture
receipts retain their original scope; this code-only slice did not rerender the
HTML kit. Source checks do not establish semantic completeness, authentic human
approval, or consumer acceptance.
