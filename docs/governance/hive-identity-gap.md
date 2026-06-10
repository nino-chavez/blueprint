# Hive identity gap — read before a client or multi-team engagement

**Status:** known limitation, honest disclosure. Decide per-engagement.

The Hive coordination substrate authenticates with a **single shared bearer
token**. Anyone holding it can `hive_register_session(human_name='<any-name>')` and
then file proposals, claim tasks, and synthesize decisions — all attributed to
"the partner SA (T.)" with **no cryptographic proof of who actually acted.** The decision log is
therefore *spoofable and unauditable*: "when did we decide to change the auth
model, and who decided it?" is answered by an attribution anyone on the token could
have forged.

This is stated plainly in the substrate's own architecture notes ("anyone with the
bearer can register as anyone — acceptable for hackathon-tier trust"). A real
identity layer (per-session JWT) has been *proposed* but is **not shipped**.

## Why it's fine sometimes and a liability others

- **Hackathon / a small co-located team that trusts each other:** fine. The shared
  bearer is convenient and the decision log is honest-enough because everyone knows
  who's who.
- **A contractual client engagement:** a real liability. Client-binding decisions
  recorded against a spoofable identity fail a client/legal review. An unauditable
  "we decided X on date Y" is worse than no log if it's presented as authoritative.
- **A second team or any external contributor:** attribution-spoofing stops being
  theoretical the moment someone you don't fully trust holds the token.

## Options

| Option | Cost | What it buys |
|---|---|---|
| **(a) Trust-within-a-known-team + flag** | A `CLAUDE.md` rule "register with your real name"; a weekly decision-log audit folded into synthesis | Zero build. **Auditable but not enforceable.** Fine for a small, trusted, known-identity team |
| **(b) Per-operator Worker** | Each operator deploys their own Worker with a distinct bearer | Isolates a leaked token's blast radius to one identity — but **no shared board**, which defeats the entire point of the substrate. Skip it |
| **(c) Harden now (per-session JWT)** | Ship the real auth/identity machinery before operator #2 joins | Real, enforceable attribution. But this is **product-scope**, not methodology-scope — scope-ceiling A explicitly defers it |

## Recommendation

**For a first client engagement with a small, trusted, co-located team (≤3, known
identities): option (a), with eyes open.**

1. Add a `CLAUDE.md` rule: every operator registers with their **real** `human_name`.
2. Fold a 5-minute decision-log audit into the weekly synthesis (the cadence
   operator already owns that slot) — scan for attributions that don't match who was
   actually active.
3. **Log the gap in the engagement's risk register** as a known limitation, so the
   "client-binding decisions on spoofable identity" risk is on the record, not
   silent. This is the difference between accepting a risk and hiding one.

**The trigger to harden (c):** the moment a *second team* or an *external
contributor* joins. Attribution-spoofing is then a real exposure, not a theoretical
one. Hardening must land **before**, not during, that onboarding. Do not scale
bearer-only identity past one trusted team or onto anything adversarial.

**Skip (b)** — it isolates leaks but destroys the shared board.

## Why not the canonical pattern

Canonical-pattern-first (the operator's standing rule for auth/identity) says the
right shape is **per-principal credentials**, not a shared bearer. The custom shape
needs its "why not canonical" sentence, and the methodology has one: **scope-ceiling
A defers identity as product-scope, because real per-principal identity requires
auth + persistence machinery that expands Blueprint out of methodology-scope and
into a hosted-service product.**

That justification holds *for the methodology*. It does **not** automatically hold
for a contractually-binding client engagement — which is exactly why this is a
per-engagement decision the operator makes deliberately, not a default they inherit
silently. If the engagement's decisions are contractually load-bearing and the team
will grow, harden first.

## See also

- `docs/governance/team-roles-and-conventions.md` — the conventions + the litmus for when the
  substrate (and therefore this gap) even comes into play.
- `docs/patterns/hive-coordination-pattern.md` — the full substrate, when contention demands it.
