# Decision 0014 — keep operator configuration inside Film Room

Status: accepted for the product candidate after the third native founder
encounter contradicted `native-ingest-candidate-founder-live-workflow`.

## Context

The exact `5cc4fd2` application opened in Ingest and the real macOS folder
panel populated the selected camera-card folder and event name. Analyze then
stopped because the packaged profile had no `config/operator.json`. The visible
failure told the founder to copy and manually edit an example JSON file in
application support.

The configuration writer already existed in Settings. The failure came from
two conflicting readiness definitions:

- first-run routing treated either saved operator configuration **or any
  Library clip** as completion; and
- the Settings activation card used that routing state as proof that archive,
  finished-work, and camera-pattern choices had been saved.

Installing the private practice clip therefore made **Use my footage** appear
ready without creating or validating the real-footage configuration.

## Decision

Real-footage setup readiness is independent from first-run routing and Library
contents.

- A complete existing `operator.json` remains authoritative and requires no
  migration or rewrite.
- Settings reports **Use my footage** only when all three operator choices are
  readable and non-empty: archive folder, finished-work folder, and camera file
  patterns.
- The practice sample never fabricates those machine-specific choices.
- The local API exposes a read-only readiness result and rejects Analyze with a
  structured `setup_required` response when setup is absent, partial, or
  unreadable.
- Ingest turns that refusal into a visible **Open Settings** recovery. It keeps
  the selected camera-card folder, event name, shot date, and venue in
  same-origin session storage and restores them after Settings.
- Settings remains the one authoring surface for the operator choices. A valid
  save is atomic; invalid input or an I/O failure leaves the previous file
  unchanged.
- New saves require absolute archive and finished-work paths and filename-only,
  non-recursive camera patterns. Existing valid files continue to be read
  without an automatic rewrite.

Do not derive an archive from a camera card, invent a finished-work location,
silently create machine-specific values, inspect the founder's footage, or
require terminal, file-copy, or manual-JSON intervention.

## Evidence and candidate boundary

The native-window success and operator-config contradiction remain bound to
exact product revision `5cc4fd2`. This repair creates a new product candidate.
The prior receipts cannot establish its native-window or founder-workflow
claims.

Required evidence includes:

- absent, partial, malformed, and existing-valid configuration checks;
- a sample-installed browser encounter that keeps real-footage setup incomplete;
- visible, keyboard-operable Ingest recovery with draft preservation;
- successful in-app provisioning followed by an accepted Analyze request over
  disposable synthetic paths;
- validation that failed setup writes do not alter existing configuration;
- release-profile, rendered-data/CSP, lifecycle, startup, package, and
  secret/path checks; and
- an exact unsigned application artifact identified by hashes.

## Rollback

Revert this decision with the operator-readiness helper, structured API
precondition, Ingest recovery, Settings readiness change, and focused tests.
Keep the third founder contradiction and native-window receipt in history.
Rollback must not delete or rewrite an existing operator configuration.
