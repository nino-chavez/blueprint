# Variant transition preregistration — pre-implementation disposition

**Date:** 2026-07-27  
**Timing:** before implementation  
**Disposition:** two corrections accepted; all other frozen expectations stand

Reviewing the preregistered scaffold set against the current canonical runner
and stage model surfaced two contract errors before code was written:

1. `tools/run-reviewers.mjs` now imports the centralized
   `tools/lib/yaml-scalar.mjs`. Creating the runner without that one exact
   dependency would produce a broken transition for every older consumer. The
   bounded create-if-absent set therefore adds that file. This is not authority
   to refresh or overwrite the broad `tools/lib` imposition layer.
2. Adding visible README files to `research/problem-space/`,
   `research/competitive/`, and `research/prior-art/` would make
   `stage-model.mjs` count all three as populated research legs. The transition
   would move the Stage 2 artifact cursor without research. Those three entries
   are corrected to empty directories, matching a fresh research stamp and
   keeping the gate honest.

The parent preregistration is corrected in this commit so its test oracle is
coherent. Git history retains the initial preregistration and this disposition;
implementation still begins only after both.
