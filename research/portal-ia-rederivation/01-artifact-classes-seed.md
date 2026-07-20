# Artifact classes a Blueprint run should emit — brainstorm seed

**Date:** 2026-07-20
**Status:** brainstorm seed (derived from `00-evidence-inventory.md`; to be torn apart before any contract is drafted)

The reframe the evidence forces: stop asking "what pages does the portal have," ask **"what artifact classes does a Blueprint run emit, for which reader, doing which job."** Every artifact in the fleet that got read maps to a reader-job; every one that didn't was builder-content wearing a reader's label. Most needed classes already exist as one-off inventions — they've never been named as the contract.

## The matrix (observed, not imagined)

| Reader | Job | Artifact class | Fleet instance (one-off today) |
|---|---|---|---|
| Future-you (weeks away) | Recover context, resume | Context-recovery brief: built / decided / next | HANDOFF.md, WAVE-LOG tail; film-room's portal-as-wished |
| **Agent, next session** | Boot with canonical context | Machine-readable projection of state + decisions | SessionStart hook inject — built, never named an artifact class |
| Evaluator / prospect | "Show me it works" | Live proof surface | `try` — the one verb that earned its place fleet-wide |
| Operator (human or agent) | Run the thing today | Runbook + console | event-day-runbook, ops consoles, `operate` items |
| Future agents (any) | Don't re-litigate | Decision lineage + invalidated-paths register | ADRs, register-pattern |
| Cold colleague / acquirer | Take over or extend | Attested takeover account, typed deltas | handoff-corpus (17 domains, bc-subs) |
| Commercial counterparty | Receive a deliverable, never the notes | Air-gapped, lint-sanitized, frozen export | GSI package; film-room delivery report |
| Casual visitor / stakeholder-lite | "What is this, is it for me" | One-scroll plain-language answer | Missing — D.'s failed walk is the evidence |
| Operator-as-founder | Keep investing or stop? | Demand-evidence log | validation-script.md |

## Design consequences to carry into the brainstorm

1. **The agent is a first-class reader nobody designed for.** The most frequent actual reader of Blueprint artifacts is the next session's agent, served today by a hook side-channel. Human-lens and agent-lens are two renderings of one canonical layer — bc-subs' replacement architecture (canonical + lenses) generalized one step: lenses per reader *kind*, not just per human audience.
2. **Composition replaces conformance.** `blueprint.yml` declares which readers exist (film-room: operator + agent + one counterparty; bc-subs: most of the matrix). The workflow emits that artifact set; the gate checks "every declared reader's job is served," not "six routes present." Route-presence was proven satisfiable-while-failing (verdict 4).
3. **The counterparty class is exclusion-by-construction.** Never a lens, never a pill — a separate artifact with a hard-fail sanitization lint (GSI mechanism). The one place the current IA is hazardous rather than merely unhelpful.
4. **Chrome that survived contact:** the drawer (anchor navigation to the artifact-under-review), live proof (Try), the runbook (Operate). Chrome that died everywhere: audience switcher, compare toggle, chat FAB, verb-grid front doors.
5. **Multi-audience is the evidenced exception, not the default** (verdict 7). The stamper's defaults should assume the solo/agent reader set and let evidence add readers — the inverse of today.

## Open questions for the brainstorm

- Does "portal" survive as a word, or is the deliverable a *manifest* (declared readers → emitted artifact set) with an optional thin front door over it?
- Where does the existing Review Portal drawer contract fold in — a lens over decision lineage, or its own class for redesign-shaped initiatives?
- What happens to the conformance reviewers — one gate per artifact class, or one reader-jobs-served gate reading the manifest?
- Migration: 13 consumers, two live patterns, bespoke escapes. What re-stamps, what gets grandfathered, what is just deleted?
