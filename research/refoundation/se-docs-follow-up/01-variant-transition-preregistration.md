# Variant transition v1 — preregistration

**Frozen before implementation:** 2026-07-27  
**Status:** preregistered candidate; not published  
**Initial scope:** existing `greenfield` initiative → `research`  
**Evidence anchor:** SE Docs Front Door commits `b78910f`, `5289a86`, and
completed state `95f6191`

## Why this is a migration defect

SE Docs began as a defensible greenfield product initiative. A later sponsor
input changed its deliverable into a decision memo and made research the correct
pipeline. At pre-transition commit `b78910f`, the initiative already contained
an authored `research/personas-and-jtbd.md` with SHA-256
`f4720ff3fa0f04debd6d347588155602b7ea50b49660a62ec840baecd4bceed1`.

Re-running `blueprint-init --variant=research` was not a transition:

- `scaffoldResearch()` unconditionally copied the blank persona, decision memo,
  decision-record, runner, and source-index templates;
- the general copy path also overwrote imposition-layer files;
- the existing `blueprint.yml` was preserved, so authored artifacts could be
  overwritten while the declared variant stayed greenfield;
- dry-run created directories, so it was not read-only;
- no cleanup, rollback, or preservation receipt existed.

SE Docs therefore switched the scalar by hand in `5289a86`. That protected the
consumer, but it does not constitute a reusable migration capability.

## Command and authority boundary

The candidate operation is separate from the initial stamper:

```text
blueprint variant transition --to=research --target=<initiative>
blueprint variant transition --to=research --target=<initiative> --apply --plan-id=<sha256>
blueprint variant rollback --target=<initiative> --receipt=<receipt-id> --apply
```

Planning is the default and is strictly read-only. Applying requires the exact
plan id recomputed from current state. Rollback is a separate explicit action.
The initial `blueprint init` / `blueprint-init` path remains a create-once
scaffolder and gains no ad hoc destructive re-stamp behavior.

This first version supports only an explicit top-level `variant: greenfield`
transitioning to `research`. Missing, duplicated, malformed, or other source
variants refuse. An absent `stage_model` is valid; `greenfield` changes to
`research`; `research` is already compatible; any other declared value refuses.

## Frozen expected behavior

### Plan

A plan reports, deterministically:

- the exact before/after patch to top-level `variant` and, when applicable,
  `stage_model`, preserving trailing comments and unrelated bytes;
- missing research scaffolds that can be created;
- every existing scaffold collision with type, size, and SHA-256 and a
  `PRESERVE` disposition — including zero-byte files;
- an inventory and digest of existing files under `research/`, `decisions/`,
  `docs/`, `.claude/`, `tools/`, `apps/`, and `packages/`;
- stage-state disposition;
- a cleanup plan for now-inapplicable product scaffolding and config, with
  reasons and dependencies;
- the rollback boundary and receipt path.

Plan mode creates no files or directories, changes no content, and changes no
mtime. Existing symlinks on any planned path or path ancestor refuse rather
than being followed.

### Apply

Apply must:

1. recompute the plan and match the supplied plan id;
2. allow unrelated dirty work but refuse if any planned path changed or is
   dirty;
3. patch only the two allowed top-level scalars;
4. create a research scaffold only when its exact destination is absent;
5. never overwrite an existing file, including an empty file;
6. never copy product portal/packages or the broad `.claude` / `tools/lib`
   imposition layer as part of a variant transition;
7. perform no cleanup deletion;
8. complete transactionally or restore the pre-apply bytes;
9. write an append-only receipt only after verification succeeds.

If `.blueprint/stage-state.json` exists, planning must surface that research and
greenfield stage cursors are not interchangeable. Apply refuses unless the
operator explicitly accepts archival/reset; accepted state is stored in the
receipt before the original is removed.

The created scaffold set is bounded to:

- `research/sources/README.md`
- `research/personas-and-jtbd.md`
- `decisions/_TEMPLATE.md`
- `docs/decision-memo.md`
- `tools/run-reviewers.mjs`
- `tools/lib/yaml-scalar.mjs`

The operation may also create the three empty research-leg directories from a
fresh research stamp: `research/problem-space/`, `research/competitive/`, and
`research/prior-art/`. They stay empty so a transition cannot falsely satisfy
the Stage 2 populated-leg gate. Directory creation never implies authority to
replace an existing directory tree.

### Cleanup plan

The plan may identify `pilot_profile`, portal configuration, `apps/portal/`,
`packages/`, workspace scripts, and reader-contract/build dependencies as
review candidates. It must not delete or rewrite them. SE Docs demonstrates why:
its portal and packages remain temporary but load-bearing until a memo-rendering
surface replaces their build and reader contracts. Cleanup is a later
operator-authored change with its own diff and rollback.

### Rollback

A receipt contains pre/post hashes, exact patched preimages, created-file
hashes, preserved-file inventory, optional archived stage state, cleanup
recommendations, methodology revision, and plan id.

Rollback preflights the entire operation before writing:

- restore patched files only when their current hash matches the recorded
  post-apply hash;
- remove a created scaffold only when it is still byte-identical to the
  candidate template;
- refuse if any created scaffold was edited;
- restore archived stage state only when no replacement state exists;
- retain the original receipt and append a rollback receipt.

Rollback does not enact the cleanup plan and does not erase transition history.

## Preregistered tests

The candidate is not ready unless all of these pass:

1. plan is byte- and mtime-read-only;
2. inline-comment scalars patch and roll back without losing comments;
3. duplicate/missing variant, custom stage model, symlinked paths, and corrupt
   stage state refuse without writes;
4. plan-id mismatch and dirty planned paths refuse; unrelated dirty files
   survive;
5. authored, empty, and binary sentinels under every protected root retain
   hashes through apply and rollback;
6. missing scaffolds are created once and a second plan is an idempotent no-op;
7. injected mid-transaction failure restores every preimage and leaves no
   receipt;
8. rollback refuses after a generated scaffold is edited;
9. cleanup remains plan-only;
10. a fresh greenfield stamp transitions to the research stage model and rolls
    back;
11. immutable archives of SE Docs `b78910f` and `95f6191` prove the authored
    persona file is preserved; the completed state produces an honest no-op or
    already-transitioned result;
12. focused self-tests, `npm run test:core`, stamp smoke, doctor, and
    `git diff --check` pass at their documented bars.

## Promotion ceiling and rejected expansions

Implementation on a candidate branch is not public validation or authorization
to publish. Decision 08’s compatibility, upgrade/doctor/fleet, support-window,
rollback, and live-consumer ceilings still apply. A second contrasting live
transition and an operator-owned support/rollback encounter are required before
public release is considered.

This work does not add a universal problem-statement stage, an SE Docs-specific
variant, a portal requirement, model allowlisting, or any steering-layer
semantics. It does not mutate SE Docs Front Door.
