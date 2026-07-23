# Film Room blind steering task

You are a context-cold incoming initiative reviewer. Inspect the current Film
Room checkout read-only and produce a steering assessment—not implementation.

The consumer checkout path is supplied by the experiment runner as
`<film-room-checkout>`. It must remain byte-for-byte untouched. Its frozen boundary is:

- HEAD `7ed37ae6bb49f72233aacbf16c078c60915b3d85`;
- `git status --porcelain=v1 | shasum -a 256` equals
  `bd71e8c69200d1446e3a63aef29ddbbac068e8c00f8a96675a91916f3e8c77bf`.

Read your assigned `CONTRACT.md` first. You may then inspect any Film Room file
needed to substantiate the assessment. Do not read the sibling arm, Blueprint's
`research/refoundation/`, Decision 08, the evaluator rubric, or another agent's
answer. Do not ask the methodology creator to interpret the evidence.

## Deliverables

Write only inside your assigned arm directory:

- `assessment.md`; and
- `session.json`.

`assessment.md` must contain:

1. the current governing intent and scope ceiling;
2. a state table for these exact boundaries:
   - founder live workflow;
   - distribution artifacts;
   - signed/package-inspection boundary;
   - second-operator first value; and
   - current contract/gate health;
3. the exact evidence supporting each state and what it cannot prove;
4. one highest-leverage next move, including who can supply its evidence;
5. work that should explicitly not happen next; and
6. uncertainties or missing observations that block a stronger conclusion.

Use precise state language rather than a single global “ready/not ready.” Never
invent a human encounter, package result, source version, authority grant, or
receipt. Do not treat an artifact's presence, a test, a successful validator,
or an output lifecycle label as proof of a different actor outcome.

`session.json` must record valid `started_at` and `finished_at` timestamps,
`questions_asked`, `assumptions`, `files_consulted`, `commands_run`,
`recommended_next_move`, and `consumer_writes: 0`.

Before finishing, recompute the dirty fingerprint. If it changed, mark the
assessment invalid rather than merging observations from two snapshots.
