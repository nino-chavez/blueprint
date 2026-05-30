# Invariants Registry Pattern — Load-Bearing Facts grep Can't Surface, Plus the Protocol That Makes Agents Use Them

**Purpose:** Capture the shape used to record the facts a codebase quietly depends on but that search cannot surface — a column written but never read, a flag whose two values are indistinguishable to the runtime, an environment where "local" means "production" — *and* the session-start protocol that converts a multi-file re-investigation into a cheap cited-artifact confirmation. The registry inoculates against agents re-deriving settled, expensive-to-rediscover knowledge every session.

**Last updated:** 2026-05-30

**Source:** `rally-hq` (May 2026). Seeded when a product-design question ("should batch team-loading be a public/private toggle?") forced a codebase map that surfaced a write-only column (`registration_mode`). Distilled into a reusable pattern across the same session, then validated cold in a fresh session.

---

## What problem this solves

Three existing Blueprint patterns already cover adjacent ground; this one fills the gap between them:

- **[inventory-as-evidence](inventory-as-evidence-pattern.md)** / state-derive records *capabilities* — "is feature X shipped." Mechanical, generated, stamped.
- **[register-pattern](register-pattern.md)** records *ruled-out decisions* — "we already considered X, here's why not." Immutable, append-only.
- **ADRs** (`docs/decisions/`) record *why* a live decision was made.

None of them records the third category: **load-bearing facts that are true, non-obvious, costly to get wrong, and invisible to grep-for-existence.** A write-only column shows up in a schema grep as a healthy NOT-NULL column; the truth — that the runtime ignores it — is only visible by grepping for the *absence* of reads, a move an agent only makes if it already suspects the problem. So every session that touches the subsystem re-derives the landmine from scratch, or worse, steps on it.

The cost is context budget. On an AI-built project where sessions drift and compact, re-deriving these facts is the dominant token sink: a grep returns 60 match lines an agent then reads 300 lines of source to interpret, to extract 4 facts. The registry pre-pays that interpretation once.

## The shape (three layers, three truth-sources)

| Layer | File | Question it answers | Truth source | Lifecycle |
|---|---|---|---|---|
| **Why we decided** | `docs/decisions/NNNN-*.md` (ADR) | why this, not the alternative | intent | immutable / supersede |
| **What's dangerous** | `docs/INVARIANTS.md` | the landmine the code depends on | human judgment | edited as understanding deepens |
| **Is it true now** | `docs/state/_state.md` (generated) | does the invariant currently hold | code | regenerated + CI-enforced |

`INVARIANTS.md` is two-tier: a thin index (one line per landmine, cheap to load at session start) over detailed entries. Each enforceable invariant is declared **once** as a check in the state-derive catalog under a new `invariant` category — the same engine that already generates capability status. The grep pattern lives only in the catalog; it is never duplicated into prose. A CI drift-guard imports the catalog and `deriveAll`, failing the build the moment an invariant is re-armed.

## Invariants of the pattern

1. **Mechanically-checkable facts go in the state-derive catalog**, not hand-written prose. The doc is generated; the human file holds only the narrative *why-it's-dangerous*.
2. **Environment facts that have no source signal** ("local DB is prod") stay as `verified-against: <sha>` entries — honestly marked unverifiable, never dressed up as enforced.
3. **The unit is a claim plus its verifier.** A claim with no executable verifier is either a `verified-against` stamp or it doesn't belong in the enforced layer.
4. **The registry is a trust-and-routing layer over doc sprawl, not another doc.** Its job is to route to the one current artifact, or supersede it — never to add a 41st prose file of unknown freshness.

## The session protocol — the part that actually changes behavior

A registry that is loaded but not *used* changes nothing. The protocol, injected at session start (consumer `CLAUDE.md`, or a `blueprint-session-start.py`-style hook):

1. Read the registry index at session start; read the relevant entry before changing **or reasoning about** a covered subsystem.
2. **When an entry says "Settled (ADR-NNNN)", the investigation is done.** Lead with that answer and **confirm it cheaply** — read the cited ADR + the one gate line + the `inv-*` COMPLIANT status. Do **not** re-map the subsystem with an Explore fan-out to re-derive a recorded decision.
3. Verify, yes — the registry can lag uncommitted work — but verify by *confirming the cited artifacts*, not by re-investigating from source.

This preserves trust-but-verify (the model should confirm; suppressing that is dangerous when the registry is stale) while killing the cost of verification.

### Validation evidence

Same cold prompt, fresh session, before and after the protocol was wired:

| | Before protocol | After protocol |
|---|---|---|
| Verify method | re-mapped the subsystem (Explore fan-out) | confirmed 3 cited artifacts |
| Cost | 26 tool uses, **112.5k tokens** | direct reads, **no Explore agent** |
| Wall-clock | ~2m26s | **56s** |
| Caught uncommitted state | no | yes |

The first run *read* the registry and then re-investigated anyway — proving that loading is necessary but not sufficient. The behavioral change came from two edits: an entry that **leads with the verdict** (`Settled (ADR-NNNN)`) and a `CLAUDE.md` rule that routes verification to *confirmation* rather than *re-derivation*.

## What this does and doesn't buy

- **Reliably:** answer quality and confidence reached in one grounded turn — the registry becomes the load-bearing citation, not a re-derived guess.
- **Conditionally:** token reduction — and only via *cheap confirmation*, never via skipped verification. Do not promise "10× less context"; a trustworthy agent verifies, and verification costs tokens. The honest claim is "re-investigation collapses to confirmation."

## Open work — the transducer

The registry's top link is still manual: a human decides what's a landmine and writes the entry. The missing piece, shared across our session-capture tooling (archaeology, recall, `to-prd`), is a **transducer** — a session→typed-artifact step that distils a session's durable {decisions, invariants, intents} and emits the correct artifact (ADR for *why*, catalog entry for *enforceable invariant*, spec for *intent*) with a backlink to the session and a verifier forward to code. Its acceptance criterion is an **eval** (does it extract the right decision?), not a unit test — the extraction is LLM-driven and non-deterministic. That is the next build, and the genuinely novel one.

## Adoption checklist for a consumer

1. Add an `invariant` category to the project's state-derive catalog; declare each mechanically-checkable landmine as checks.
2. Add a CI drift-guard that runs the catalog and fails on `NON-COMPLIANT`.
3. Write `docs/INVARIANTS.md` (two-tier index + entries); generated status comes from `_state.md`, not hand-asserted.
4. Adopt `docs/decisions/` for the immutable *why*; record the decision that motivated each invariant.
5. Wire the session protocol into the consumer's `CLAUDE.md` (read-first + confirm-cheaply + "Settled → investigation done").
