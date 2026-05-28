---
name: blueprint-triage
description: Triage stakeholder feedback after a Blueprint demo or doc review through a state machine of categories and dispositions. Use when feedback arrives from stakeholders and needs to be classified into actionable next steps with dispositions (accept, defer, decline, etc).
---

# /blueprint-triage

Triage stakeholder feedback after a Blueprint demo or doc review through a state machine of categories and dispositions.

## When to use

After sharing a Blueprint deliverable (prototype walkthrough, doc package, deck) and collecting feedback. Run before deciding which feedback to act on.

## Why a state machine

Stakeholder feedback after a demo arrives in three forms simultaneously: questions, opinions, and asks. Without structure, all three get treated equally and the team either:
- Implements every opinion (scope creep, deliverable drift)
- Implements only the loud asks (whoever pushed hardest wins)
- Implements nothing while "waiting for consensus" (deliverable goes stale)

The state machine forces explicit categorization + disposition so each piece of feedback has a defensible next action.

## Categories

Every piece of feedback gets exactly one category:

| Category | Definition |
|---|---|
| **bug** | The deliverable is wrong (factually inaccurate, broken link, contradicts another doc). Highest priority. |
| **scope-add** | A feature/section/finding that wasn't in scope but stakeholder wants it. Requires scope decision. |
| **scope-clarify** | The deliverable's scope is unclear; stakeholder wants the boundaries restated. Doc-level fix. |
| **opinion** | A preference about phrasing, framing, or emphasis that doesn't change facts. Discretionary. |
| **question** | Stakeholder doesn't understand something; needs clarification, not a change. |
| **kudos** | Positive feedback, no action required, but capture for retrospective. |

If feedback is ambiguous between categories, ask the maintainer once. Don't guess.

## States

Every categorized item gets one state:

| State | Meaning |
|---|---|
| **needs-review** | Just collected, not yet triaged |
| **scoped-in** | Will be addressed in this initiative; converted to a follow-up task |
| **deferred** | Acknowledged, but punted to a future initiative or the team's general backlog |
| **answered** | A question has been answered; no doc change needed |
| **wontfix** | Will not be addressed; rationale required |
| **clarified** | A scope-clarify was resolved by sharpening scope language in the doc |

State transitions: `needs-review` → one of the others. The maintainer can override at any time.

## Workflow

### Step 1 — Collect

Read the feedback source. Common locations:
- `feedback/[date]-[stakeholder].md` — written feedback in markdown
- A pasted Slack thread or email
- Notes from a live demo

If feedback isn't yet in `feedback/`, copy it there first so it's preserved alongside the deliverable.

### Step 2 — Categorize and recommend

For each piece of feedback, present a single line:

```
[N] "<feedback excerpt, ≤80 chars>" — category: <X>, recommend state: <Y>, rationale: <one sentence>
```

Cluster related items if multiple stakeholders raised the same thing — note "(also raised by: name1, name2)".

Wait for maintainer to confirm or override the recommendations before applying any state.

### Step 3 — Apply dispositions

For each item, take the disposition action:

- **scoped-in** → create a task entry in the relevant section of `docs/content/` or in a `followups.md` file. Reference the feedback source.
- **deferred** → write to `docs/content/deferred.md` with: feedback excerpt, source, rationale for deferral, suggested timing ("next initiative", "after deployment", etc.).
- **answered** → write the answer back to the stakeholder. If the question revealed a doc gap, also flag it as `scope-clarify` and address.
- **wontfix** → write to `docs/content/decisions.md` with: feedback excerpt, source, rationale ("contradicts our positioning", "out of scope by design", "factually incorrect — see verification report"). Polite, specific.
- **clarified** → update the affected doc with sharper scope language, reference the feedback that drove the change.
- **kudos** → log to `feedback/kudos.md`. Useful for retros and team morale.

### Step 4 — Update the validation report

If any feedback indicates the deliverable was inaccurate (`bug` category), feed it into `/blueprint-validate` as a Phase 2 reproduction. The validate loop should catch it — if not, the loop is missing a category.

### Step 5 — Send a triage summary

Compose one message back to stakeholders:

```
Triaged [N] pieces of feedback:
- Scoped in: [count]
- Deferred: [count] (see docs/content/deferred.md)
- Answered: [count]
- Won't fix: [count] (rationale below)
- Already addressed: [count]
- Thanks for the kudos!
```

Make scoped-in items visible in the deliverable update; make won't-fix rationale public so stakeholders see the reasoning.

## Anti-patterns

- **"We'll consider it"** — not a state. Use `deferred` with a specific timing or `wontfix` with a rationale.
- **Treating all feedback as scope-add** — most feedback is opinions or questions, not changes. Categorize first.
- **Skipping the rationale on wontfix** — the rationale is the reason the deliverable holds up under scrutiny. Always include.
- **Triaging in isolation** — every state change should be visible to the team in `docs/content/` or `feedback/`. No silent decisions.

## Output

A triage record at `feedback/[date]-triage.md`:

| # | Excerpt | Category | State | Disposition | Source |
|---|---------|----------|-------|-------------|--------|

Plus updates to: `docs/content/deferred.md`, `docs/content/decisions.md`, `feedback/kudos.md`, `followups.md` as applicable.

## Lineage

State-machine pattern adapted from [matt-pocock/skills `triage`](https://github.com/mattpocock/skills) (MIT). The categories are tuned for stakeholder-feedback-after-demo (Blueprint context), not GitHub-issue triage. AI disclaimer is opt-in per the workspace `triage` skill; for internal-stakeholder feedback, generally skip it.
