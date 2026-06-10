# Team roles & conventions — running a Blueprint initiative with more than one operator

**When to read this:** the moment a second person (or a second concurrent agent
session) joins a Blueprint initiative. Solo Blueprint needs none of this; the cost
below is only worth paying when work is genuinely parallel.

**The crawl → walk → run rule:** most multi-operator work is handled by *team
discipline*, not server machinery. Adopt the three conventions below first (zero
infrastructure). Stand up the full Hive coordination substrate (`docs/hive-
coordination-pattern.md`) only when contention is real — see the litmus at the end.
Don't pre-provision infrastructure for parallelism you don't yet have.

---

## The three lightweight conventions (day 1, zero infra)

Each was promoted into the methodology because it kills a *specific*, observed
multi-operator failure — not as defensive ceremony. They work at the
team-discipline layer with no server, no D1, no tokens.

### 1. Per-repo role declaration

Every initiative's `CLAUDE.md` opens with `Repo role: I am [X]` and a `pwd`
verification before any commit. A session that finds itself in the wrong
directory stops and switches, rather than committing to the wrong repo.

- **Failure it prevents:** attribution loss and wrong-repo commits — a session
  bundling several operators' work into one commit, or committing methodology-source
  edits from a consumer checkout (and vice versa).
- **Cost:** a few lines in each `CLAUDE.md`. The methodology source and every
  consumer already carry this (it's the inverse-charter pattern).

### 2. Worktree isolation per parallel agent

Any time more than one session has independent work in flight against the same
repo, **each session operates in its own git worktree**, not the shared checkout.
Sessions sharing a checkout switch each other's branches under each other's feet;
commits land on the wrong branch.

- **Failure it prevents:** cross-session branch clobbering; commits on the wrong
  branch.
- **Enforcement:** this is mechanically enforced on machines running the
  `worktree-guard` hook — a `PreToolUse` gate that DENIES contended git ops (commit,
  branch create/switch) from the *shared* checkout when another session's lock is
  live, and tells you to create a worktree. Commits from inside a worktree are
  always allowed; a solo session in the shared checkout is never blocked. On a
  machine without the hook, it's a `CLAUDE.md` rule until the hook is ported.
- **The flow for a dispatched session:** first instruction is
  `git -C <repo> worktree add <path> -b <branch> && cd <path>`; push from the
  worktree; the main session cleans up after merge with `git worktree remove`.

### 3. No-workaround success criterion

Any hook, lint, gate, or convention rollout names **"no workaround emerges"** in its
own rationale. A gate that an agent can reorder commits or rename files to dodge is
not a gate.

- **Failure it prevents:** an agent silently routing *around* a discipline (e.g.,
  reordering commits to dodge a pre-commit hook) instead of satisfying it.
- **Cost:** a sentence in each gate's design. It forces you to ask "can this be
  bypassed?" before you trust it.

These three handle the large majority of observed multi-operator failure with zero
infrastructure. Adopt them before anything heavier.

---

## The team operating model (when work is genuinely parallel)

The model below is the one proven on `subs-initiative` (the reference Blueprint +
hive engagement). It applies whether coordination is by git + the conventions
(crawl/walk) or by the full substrate (run).

### Authority is territory-bound, not centralized

Surfaces (e.g. prototype, admin, storefront, infra) have a **DRI** — a directly
responsible individual who is the *review-of-record* for that surface, **not** a
gate that blocks others. New contributors routinely mis-read this as "one person
approves everything." It's the opposite: authority is distributed by territory.
Read the DRI table before filing work on a surface you don't own.

### The cadence operator runs synthesis

One named operator (with a named backup) runs a **weekly synthesis** (~30 min,
Friday-anchored on subs-initiative): open proposals → ratified decisions (ADRs in
`docs/decisions/`), action items → tasks. The cadence is the heartbeat that keeps
parallel work converging instead of forking. Fold a 5-minute decision-log audit
into this slot (see `docs/governance/hive-identity-gap.md` for why).

### Spec changes go through proposal, never PR-first

The BRD/PRD and other spec artifacts are **not** "docs you can PR." A change to a
spec is a `[Spec]` proposal → synthesis → PR, never a PR that edits the spec
directly. This is the single most common new-contributor violation; catch it at
review (a PR that edits a spec file with no synthesis/decision reference in the
commit).

### Work discipline (per session)

- **Register / orient first:** know who's active, what's claimed, and the recent
  decisions before you start (the substrate exposes this; without it, read the
  board + ask).
- **Claim, then stay in your file-scope.** When the coordination layer hands you a
  task it returns the exact worktree command, branch name, and file-scope — **use
  them, don't invent.** Work only within the declared file-scope; if you need a file
  outside it, file a scope-expansion proposal rather than reaching across.
- **Commit at tier boundaries** with the task id (and synthesis id, when using the
  substrate). **Push after each tier** — pushed work survives a session being reaped.
- **Move a task to `review` when the PR opens, not on merge** — it unblocks
  downstream work immediately.

---

## Litmus — when to escalate from conventions to the full substrate

Stay on the conventions until **all** of these are true; then stand up the Hive
substrate (`docs/patterns/hive-coordination-pattern.md`):

- 5+ discrete parallel work streams, **and**
- ≥2 concurrent agent sessions on the same repo, **and**
- overlapping files / decisions (real collision risk), **and**
- a tight timeline (<~2 weeks) where "who's editing this?" friction compounds.

Below that bar, the substrate is overhead. The trigger is **observed, not
scheduled**: when a worktree conflict or a "who owns this file right now" question
*recurs*, that's the signal to escalate — not a date on a plan.

The canonical phrasing (`hive-coordination-pattern.md`): *"if you're about to spin
up two Claude Code sessions on the same repo in parallel, you need Hive. If one
session at a time is fine, you don't."*

Before relying on the substrate for a real deadline, read `docs/governance/hive-identity-gap.md`
(the trust model is a shared bearer token — a known limitation that matters for
client-binding decisions) and run a contention/chaos test first.
