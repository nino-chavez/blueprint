# Decision 0013 — make native Ingest entry operational

Status: accepted for the product candidate after the second native founder
encounter contradicted `repaired-candidate-founder-live-workflow`.

## Context

The exact `e1c21d9` application still opened a returning founder in Review when
the practice sample was present. After the founder switched to Ingest, the
visible **Choose…** control produced no folder picker or visible response.

Read-only diagnosis found two independent contracts:

- the main surface and boot state hardcoded Review whenever any clip existed,
  so the installed practice sample overrode the real-event entry path; and
- startup isolation moved the local service to a dynamic loopback port while
  the Tauri remote capability still authorized only `127.0.0.1:8766`.

The picker rejection was unhandled, turning a security-scope mismatch into an
apparently dead control.

## Decision

- A normal application launch enters Ingest regardless of practice-sample
  state. The explicit sample tour continues to enter Review, and explicit
  `start=` deep links continue to select their requested surface.
- The native capability authorizes HTTP only from `127.0.0.1`, on the dynamic
  port selected by the shell. It does not grant arbitrary hosts, weaken CSP, or
  restore a fixed port.
- Ingest and Setup picker calls disable and label their control while opening.
  A rejected or unavailable dialog restores the control, focuses the associated
  path field, and announces a visible drag-or-paste recovery action in the
  existing live status region.

## Evidence and candidate boundary

The prior contradiction and all exact-`e1c21d9` receipts remain historical.
This repair creates a new product candidate and cannot satisfy native-window or
founder-workflow claims until the exact rebuilt package is observed.

Required machine evidence:

- source contracts for default routing, loopback-only dynamic-port capability,
  and visible picker recovery;
- a browser encounter with saved setup plus installed sample proving a normal
  launch enters Ingest while sample-tour and explicit Review routes remain
  intact;
- simulated native-dialog success and rejection encounters;
- Tauri/Rust capability parsing, release-stage, bundle, and packaged-process
  checks; and
- a rebuilt unsigned application identified by exact hashes.

## Rollback

Revert this decision with the default-route, picker-recovery, capability, and
focused-test changes. Keep both failed founder encounters and all earlier
candidate receipts in history.
