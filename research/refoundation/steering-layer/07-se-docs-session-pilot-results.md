---
canonical: false
status: validated-root-retrospective-pilot
date: 2026-07-27
scope: root research only
template_changed: false
consumer_changed: false
prospective_external_threshold_met: false
depends_on:
  - research/refoundation/steering-layer/06-se-docs-session-pilot-preregistration.md
qualified_by:
  - research/refoundation/steering-layer/08-se-docs-completed-state-reconciliation.md
---

# SE Docs Front Door session pilot results

> **Completed-state qualification:** this pilot froze the consumer through
> `bb4c459` while the re-founding session was still in progress. Exact completed
> state `95f6191` says greenfield was defensible at founding and classifies the
> case as right-variant, changed-problem-mid-flight. P1 below is therefore a
> synthetic promotion hypothesis, not validated SE Docs history. The historical
> result is preserved below; `08-se-docs-completed-state-reconciliation.md`
> controls its interpretation.

## Verdict

SE Docs Front Door reinforces the refoundation; it does not call for another
semantic rewrite.

The refounded K1 kernel already represents the consequential transition:
operator-authorized re-charter, invalidated old claims, retained history,
current evidence, and new open claims. No new stage, variant, portal, receipt
type, or charter primitive is justified.

The pilot did expose one defect in the experimental recipe selector. When all
machine work was blocked on a dependency-ready decision, the evaluator
targeted the right decision but labeled the recipe `implement-or-verify`.
Moving ready-decision selection ahead of blocked-machine fallback now returns
`record-disposition` and the authored operator route. All prior recipes remain
unchanged.

The larger public-start problem remains a promotion candidate: the current
stamper asks the caller to choose a variant before Blueprint has established
the governed outcome. An agent can explicitly choose the wrong variant and
bypass the only default warning. The tested intake packet shows the desired
control boundary, but this retrospective pilot does not authorize shipping it.

## What happened

### Founding sequence

1. The operator supplied a problem and asked Blueprint to help define,
   research, and shape the solution.
2. Claude performed substantial primary research and a useful 16-question
   decision loop.
3. Before reading `docs/variant-selection.md`, it invoked the stamper with an
   explicit `--variant=greenfield`.
4. The initial commit contained 230 files and 30,681 inserted lines, including
   an Initiative Portal and product-build pipeline.
5. The session later concluded that the correct prototype was a configured
   enterprise chat pilot, not repository software.
6. The handoff nevertheless declared “Stage 1 closed” and directed the next
   session toward `prototype/DESIGN.md`, channel instructions, and portal
   reviewer cleanup.

The agent did not fail to reason about configure versus build. It reached that
decision. It failed to bind the decision to the initiative's starting recipe,
and Blueprint let green gates coexist with the wrong frame.

### Re-founding sequence

1. A sponsor kickoff supplied new primary evidence.
2. Claude initially treated the notes as additions to the current solution
   frame.
3. The operator corrected the task: extract the agnostic intent rather than
   treating the notes as prescription.
4. The session then identified the causal inversion. The corpus was not merely
   scattered and noisy; it was the output of a documentation process with
   structural truncation and decay.
5. A canonical problem statement superseded the founding frame, downstream
   assertions were marked stale or invalid, and the next recipe changed from
   product design to research and boundary disposition.

This was a legitimate re-charter boundary. More research alone could not
authorize it, and continuing the old gates would have made the initiative more
internally consistent around the wrong problem.

## Attribution

| Finding | Agent execution | Blueprint contract | Disposition |
|---|---|---|---|
| Explicit greenfield stamp before variant-fit review | Claude chose the wrong recipe and did not read the canonical decision tree | `init` accepts the choice and only warns when `--variant` is omitted | mixed; method owns prevention |
| 30,681-line portal/product scaffold for a configure-first decision | Claude continued with stamped work that did not test the highest uncertainty | greenfield default and portal-heavy stamp made irrelevant work look canonical | mixed |
| Configure-first decision and bounded fallback triggers | strong model work | current method could preserve the ADR but not reconcile it with the starting recipe | positive control |
| Sponsor input first treated as additive | model initially overfit the new notes to the existing solution | no current public charter/re-charter control interrupts downstream stages | mixed |
| Operator correction produced a first-principles problem account | strong recovery after steering | K1 already models the authorized transition exactly | positive control |
| Missing decision artifacts produce both PENDING and ERROR | not model-dependent; reproduced directly | R6 expects the precondition artifact to be absent while raw R7 citation scanning requires it to exist | deterministic template bug; separate fix candidate |
| Amendment entry omitted the required bucket until a later correction | Claude read the canonical convention but missed a second template | the canonical convention and stamped root file omit the bucket present in the detailed template | documentation contract inconsistency |
| Two research subagents rejected an oversized prompt | model/runtime execution problem | not evidence for a semantic Blueprint change | no methodology change |

The result matches the Film Room conclusion: this is not “Claude bad, Codex
good.” A capable executor can recover when corrected and can still make an
uncontrolled choice when the method leaves authority and work selection
implicit.

## Preregistered results

### Steering packet 1 — intake

Before the fix:

- target: `governing-frame-selected`;
- recipe: `implement-or-verify` — wrong;
- route: `operator-inline` — right.

After the fix:

- recipe: `record-disposition`;
- only target: `governing-frame-selected`;
- authority: operator selects the governed output and starting recipe;
- downstream scaffold work remains blocked.

This is the only evaluator-code change.

### Steering packet 2 — re-frame required

The unchanged evaluator selected:

- recipe `repair-or-revise`;
- only target `founding-frame-valid`;
- operator authority `change-intent`;
- capture in the current problem account; and
- no census, prototype, or portal action.

The external kickoff is evidence. It does not re-charter by itself.

### Steering packet 3 — re-framed

The unchanged evaluator selected:

- recipe `implement-or-verify`;
- only target `corpus-census-bounds-reliable-subset`;
- default `agent-autonomous` route; and
- one retained historical claim.

The operator is no longer asked to steer work the agent can perform. The next
operator route remains downstream of the census.

### K1 transition

The new retrospective specimen passed with:

- all three retrieval-first claims `invalidated`;
- current problem frame `satisfied`;
- corpus census `open`;
- boundary dispositions `open`;
- sponsor memo `open`;
- old checkpoint `invalidated`;
- current-frame checkpoint `satisfied`; and
- first-intervention checkpoint `open`.

This confirms that “problem changed” is charter/disposition behavior, not a
missing universal pipeline stage.

## Verification

| Check | Result |
|---|---|
| Frozen steering expectation before implementation | one expected failure: intake mislabeled `implement-or-verify` |
| Steering suite after fix | 148/148 assertions |
| Existing steering fixture recipes | unchanged |
| K1 suite | 19/19 expected verdicts |
| New K1 specimen | pass, 0 errors |
| Current Blueprint core/stamp suite | pass |
| Absolute-path rejection and deterministic rebuild | pass |
| Diff whitespace check | pass |
| SE Docs consumer writes | none |
| `template/` changes | none |
| public CLI changes | none |

## Confirmed promotion candidates

### P1 — Charter-first start boundary

**Evidence:** two prior initiatives are already named in the current variant
selection warning; SE Docs adds a third case where the agent explicitly
supplied the wrong variant, so a default warning could not help.

**Desired behavior:** before stamping, represent the governing-output choice as
an authorized decision. Built software, configured service, and
decision/strategy are outcomes, not folder layouts. Downstream scaffolding
depends on that disposition.

**Do not implement as:** natural-language intent guessing, another required
document, or a universal operator interruption. If the authored frame is
unambiguous and already accepted, the packet can record it without another
touch. Ambiguity or a change of intent is what creates the authority boundary.

**Promotion gate:** a prospective external initiative must use this start
boundary before work begins and demonstrate that the selected recipe improves
the actual work sequence.

### P2 — Preconditions must not self-contradict citation validation

The live validator was independently reproduced with a planned output and a
missing `decisions/9999-pending.md` precondition. It returned:

- R6 PENDING because the artifact correctly does not exist; and
- R7 ERROR because the same raw path does not exist.

The resulting verdict is BLOCKED. R7 should exclude exact
`preconditions[].artifact` paths from raw citation-existence scanning; R6
already owns their expected-absence semantics. This is a deterministic
template bug, not a new assertion type requirement.

Fix it on a separate template-authorized branch with a regression test. It is
outside this pilot's distribution ceiling.

### P3 — One canonical amendment entry shape

The stamped root `METHODOLOGY-AMENDMENTS.md` and canonical convention define
Trigger, Scope, Status, body, and References. The detailed amendment template
also requires Bucket. The consumer agent followed the first source, then had
to discover and retrofit the second.

The canonical convention and stamped file should either include Bucket or
explicitly say it is optional. This is a documentation/schema consistency fix,
not evidence for another reviewer.

### P4 — Public init documentation is stale

The stamper implements the research variant, but its own flags table still
lists only `greenfield | midstream | brownfield`, and its explicit usage example
uses greenfield. Correcting the table is low-risk reader maintenance. It does
not solve P1 by itself.

## Rejected changes

- **No universal problem-statement stage.** Versioned charter and re-charter
  are the general mechanism. A problem statement can be the current evidence
  artifact when the initiative needs one.
- **No se-docs-specific variant.** Configure-first is an intervention choice,
  not a fifth lifecycle.
- **No portal requirement.** The initiative's product may be an externally
  configured surface and its review deliverable may be a memo.
- **No model allowlist.** The failure is reproducible as a missing control,
  independent of Claude or Codex.
- **No claim that Blueprint's prospective steering threshold is met.** The
  JSONL replay is retrospective and creator-interpreted.

## Disposition

Keep the selector fix and fixtures root-only on the isolated pilot branch.
Treat them as stronger retrospective evidence for the steering layer.

Do not merge them into the public methodology or count SE Docs as the required
prospective external pilot. Use the charter-first intake packet on the next
new, independently run initiative before any scaffold is created. Separately,
schedule the actor-output precondition bug and amendment-shape inconsistency as
bounded template maintenance after the template-edit boundary is explicitly
accepted.
