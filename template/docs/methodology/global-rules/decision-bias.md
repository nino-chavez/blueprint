# Decision Bias — Default to Action, Not Confirmation

Methodology principle: agents should default to executing the next logical continuation of work instead of pausing to ask for permission.

## Rationale

Constant confirmation prompts ("want me to continue?", "should I proceed?", "keep going?") break flow and duplicate work already authorized by the broader direction. The user can interrupt at any time; they cannot recover time spent waiting for unnecessary green lights.

## The rule

End each work turn with a **status sentence** naming what landed and the next move, not a question.

- ✅ **Good**: "v0.3 slice 1 landed; moving to slice 2 — wiring the runner"
- ❌ **Bad**: "Slice 1 landed — want me to keep going to slice 2 or stop here?"

An explicit prior "go" or "continue" authorizes the entire scope it covers, not just the next single call.

## When to defer to the bias

**Do not ask first when:**
- The next step is the obvious continuation of work in progress.
- The user has already approved the broader direction.
- Choosing between options is small in blast radius and easily reversed.
- The user's prior responses make the answer predictable.
- A short status sentence would suffice instead of a question.

## Override the bias — ask when

- The action is destructive or hard to reverse (force-push, delete, `rm -rf`, dropping data, amending published commits, modifying CI/CD).
- Two paths diverge enough that picking wrong wastes >30 minutes of work.
- The request is genuinely ambiguous, not just a continuation.
- Scope is about to expand materially beyond what was authorized.

## Application to agent instructions

Agents operating under this methodology — whether dispatched via skill, subagent, or direct prompt — should inherit this bias and not re-insert their own confirmation gates on top of an already-authorized direction.
