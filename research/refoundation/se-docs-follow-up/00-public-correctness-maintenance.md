# SE Docs follow-up — public correctness maintenance

**Status:** candidate implementation, not published  
**Evidence cutoff:** completed SE Docs Front Door state `95f6191`  
**Boundary:** public correctness only; no steering promotion and no consumer mutation

## Authority and freeze check

This maintenance was opened after reading the repository charter, the last
`WAVE-LOG.md` entry (Wave 97), and the refoundation rollout ceiling in Decision
08. `blueprint fleet --json` reported 15 registered consumers, with 5 behind
and 10 unpinned. No registry or wave evidence identified an external consumer
currently migrating to this methodology checkout. The template freeze was
therefore not tripped. Drift in the fleet remains an operator concern; this
candidate does not restamp or update any consumer.

## Findings promoted as correctness defects

| Finding | Exact evidence | Candidate correction | Regression |
|---|---|---|---|
| Top-level YAML scalars were parsed by divergent regular expressions. `variant: research # comment` could be routed as an unknown value and fall through to greenfield behavior. | SE Docs `HANDOFF.md` at `95f6191`; local reproduction against the runner and reviewer parsers. | One dependency-free, quote-aware top-level scalar reader used by the runner, stage model, home resolver, and every executable reviewer that reads `variant`. | `yaml-scalar.mjs --selftest`, reviewer self-tests, and a real research stamp whose commented variant line must still print `variant=research`. |
| An expected-absent decision artifact named by `preconditions[].artifact` was evaluated twice: R6 correctly reported PENDING and the raw R7 citation scan incorrectly raised ERROR. | SE Docs amendment “Typed preconditions cannot express ‘this decision has not been made’” at `95f6191`. | For `assertion: exists`, R6 exclusively owns that exact artifact path. Other raw citations still receive R7 existence checks. | `actor-output.mjs --selftest` asserts an absent `decisions/9999-pending.md` remains PENDING with no ERROR; the existing unrelated missing-citation test remains BLOCKED. |
| `persona-fit-reviewer` required the literal methodology phrase “what each persona can do” in a stakeholder memo. | SE Docs decision memo and amendment at `95f6191`. The reader-facing heading is “What changes for each of you”; commit `95393aa` needed a traceability-footnote workaround. | Require a substantive table row or list item for every served persona, with a resolvable `<slug>/JOB-n` trace on that line. Do not prescribe a heading, the word “persona,” or an English verb list. | The reviewer self-test passes reader-language rows, blocks a literal-only footnote, and retains the unanchored-decision block. |
| The canonical amendment convention and the two shipped examples disagreed on the entry fields and scope/status vocabulary; active init guidance also omitted the research variant or described the stamper as portal-only. | SE Docs authoring encounter through `95f6191`; comparison of the three template surfaces and active init docs. | Share `Trigger`, `Scope`, `Bucket`, `Status`, and `References` with identical option vocabulary; document research as a portal-free initial stamp and include it in active variant guidance. | Stamp smoke asserts all exact amendment field lines and exercises a real `--variant=research --tier=0` stamp. |

## Support and rollback

The scalar helper is deliberately not a general YAML parser: it accepts only
column-zero scalar keys, removes comments only outside quotes, and ignores
nested keys. That boundary is now shared rather than reimplemented. A rollback
must revert the helper and all consumers together; reverting only the helper
would break stamped imports.

R6’s exemption is exact and limited to `assertion: exists` precondition
artifacts. It does not exempt arbitrary citations or other assertion types.

The persona check establishes mechanical traceability, not prose quality.
Whether an outcome is genuinely useful remains an agent-run judgment gate.
Rollback is a single reviewer/template change; existing memos using the old
literal continue to pass when they also carry same-line job traces.

No existing amendment entry is rewritten. The reconciliation changes only the
instructions new entries receive. No CLI package is published by this work.

## Candidate verification

The candidate imposition layer was overlaid onto an immutable `git archive` of
SE Docs commit `95f6191` in a temporary directory. The executable research
roster produced zero blocks: four PASS rows, the expected terminology WARN,
and the expected portal-over-promotion WARN. The spec-only judgment gates
remained explicitly unexecuted. This replay is compatibility evidence, not a
human acceptance receipt.

## Explicit non-expansions

This evidence does not justify a universal problem-statement stage, an SE
Docs-specific variant, a portal requirement, model allowlisting, or promotion
of the experimental steering layer. Variant-transition behavior is specified
and implemented on a separate candidate history because its preservation and
rollback contract is materially larger than these correctness fixes.
