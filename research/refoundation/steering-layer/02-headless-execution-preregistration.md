---
canonical: false
status: preregistered-before-implementation
date: 2026-07-23
scope: root research only
template_change_authorized: false
consumer_methodology_change_authorized: false
---

# Headless execution-boundary follow-up

## Trigger

The first prospective external pilot reached `run-bounded-encounter` after its
machine research. The generated result named a human claim but did not say:

- whether the operator actually needed to stop the current Codex task;
- what the agent could continue doing autonomously;
- where the requested action happened;
- what artifact crossed the boundary;
- where the result returned; or
- what resumed the initiative.

The operator correctly described the result as murky for a non-UI initiative.
The pilot also showed that a declared human claim can accidentally manufacture
an authorization gate even when prior “go” authority already covers local,
reversible work.

## Question

Can the steering layer distinguish claim truth, decision authority, and work
routing so a headless initiative always says who acts next, where they act,
whether a handoff is required, and how the current harness resumes?

## Frozen change

Add an opt-in `blueprint-steering/1` packet while keeping
`blueprint-steering/0` valid.

Version 1 adds `execution_routes`. Active human and decision claims require one
route. Machine claims default to agent-autonomous work in the current harness
unless a route overrides them.

Each route declares:

- `claim`
- `mode`: `agent-autonomous`, `operator-inline`, `operator-external`, or
  `external-actor`
- `owner`
- `authority`
- `venue`
- `action`
- `artifact`
- `capture`
- `resume_when`
- `blocking`

The generated result adds `next_actions`. Markdown adds an Execution boundary
section. A handoff exists only when the selected action mode is not
`agent-autonomous`.

## Recipe semantics

- **Readiness is not interruption.** A human claim becoming ready does not by
  itself explain the venue or justify inventing a gate.
- **Prior authority is authored upstream.** If local work is already authorized,
  the packet should keep that work as active machine claims rather than insert
  an operator-acceptance claim prematurely.
- **Current harness is the default workspace.** Machine work remains in the
  current coding harness unless the packet names an external venue.
- **Inline operator action stays inline.** `operator-inline` means the agent
  presents the bounded packet in the current task and the reply resumes it.
- **External action is explicit.** `operator-external` names the system, the
  artifact to use, the capture destination, and the resume condition.

## Preregistered tests

1. Every existing version-0 fixture remains valid and retains its recipe.
2. A version-1 headless machine recipe selects `agent-autonomous`,
   `current-harness`, and no handoff.
3. A version-1 ready operator-external claim names the BigCommerce sandbox
   control panel, requires a handoff, and carries exact capture/resume fields.
4. A version-1 active human or decision claim with no route is rejected.
5. Duplicate routes and unsupported modes are rejected with source-oriented
   diagnostics.
6. JSON and Markdown remain byte-deterministic and contain no absolute user
   path.
7. The evaluator still cannot issue a receipt, spend a touch, change a claim,
   or infer operator authority.

## Distribution ceiling

Passing this follow-up authorizes updating the prospective consumer packet and
continuing root dogfood. It does not authorize a template, CLI, or public
methodology wave.
