# Blueprint instruction fixes — October 1, 2026

The template now defers worker routing and browser profile selection to their configured owner. Every independent writer gets a worktree. Publication follows the authority already supplied by the task or project workflow.

Ordinary project startup no longer installs global hooks or appends rules. The existing project-local hook and manual-context fallback remain. The hook now reports only what it checked: absence of the legacy marker does not prove equivalent rules are missing.

## Parent corrections

Cross-review found two paths that could restore the old behavior: the referenced browser guide still prescribed per-task profiles, and the hook emitted a global append recipe. Both owners were corrected in this change. The browser guide also distinguishes application, tab, hostname, and port isolation from persistent login state.

The dispatch adapter now supports the portable route when no required host dispatcher exists. A required route's failure still blocks fallback. Its source example is referenced through dispatch-wave so the stamper does not relabel historical commits as consumer history.

## Verification

The initial stamp now creates the root `CLAUDE.md` from the canonical template. An existing file or symlink is preserved, including on re-stamp; dry-run does not write it. Before this correction the command promised a root guide but never created one. Delivery checks cover Initiative Portal, Review Portal, and research stamps.

The stamper smoke suite passes after three root-guide delivery controls failed against the prior implementation. Existing-file preservation and dry-run checks also pass.

The hook's existing end-to-end self-test was extended to reject a startup context that prescribes appending to the global Claude file. That control failed against the original output and passes after the fix. Its missing-file, missing-marker, existing-marker, source-location, and npm-resolution cases pass.

A fresh research-tier stamp passed its mechanical check and carried the corrected dispatch, smoke-runner, and hook sources. The final receipt in the parent audit package records file comparisons and cleanup. This checks distribution and emitted context; it does not prove live host trust or browser behavior.

## Rollout

This is an unreleased source change. No methodology pin, package version, live hook, model setting, or consumer was changed by this worktree. Consumer instruction patches follow after the parent completes this source review. A copied hook needs its own authorized update; changing the template does not update an installed copy. Publish and installation on the receiving Mac remain separate steps.
