# Architect challenge pattern

## What it is

A structured design tool for comparing implementation options when the choice involves a **language or expression mechanism** (rule DSL, condition grammar, event predicate, query language) rather than a pure build-vs-buy or host-vs-integrate decision.

## Why it exists

Standard build/buy matrices capture deployment cost, vendor lock-in, and integration effort — but they don't surface the hidden cost of **what the expression mechanism makes possible later**. A typed-condition approach (Option A) and a general expression language like CEL (Option B) have similar short-term implementation costs but very different long-term surface areas.

The pattern was named from the promo-initiative initiative, where comparing "typed condition DSL" vs. "CEL expression engine" required asking questions none of the standard matrices prompted — specifically: what can a merchant author *express* in each option, and what can the platform *validate* in each?

## The challenge frame

For each option under consideration, answer:

**1. Expression surface** — What can be expressed that cannot be expressed in the other option?

**2. Validation surface** — What can the platform validate statically (before save) vs. only at runtime?

**3. Authoring surface** — What does the merchant/operator UI look like? Can a non-technical user author it?

**4. Escape hatch** — When this option turns out not to cover a use case, what is the migration path?

**5. Evaluation cost** — What is the p95 latency of evaluating this option at the call site (e.g., promotion evaluation at checkout)?

## Format

Present as a side-by-side comparison table with one row per challenge dimension. Each cell should be 1–2 sentences. Source claims that depend on platform behavior against verified docs (not assumptions).

## The architectural fork heuristic

If the two options have **identical short-term costs** but **different long-term expression surfaces**, default to the option with the *smaller* expression surface. The reason: a narrow surface is fully testable; a wide surface (general expression language) carries an implicit maintenance commitment to every construct a user might write. This is the "typed-condition DSL wins ties" heuristic from promo-initiative.

Escalate to a full [strategic fork entry](../../../apps/portal/src/pages/strategy/) when the two options require **different organizational commitments** (team ownership, partner dependencies, runtime platform) — not just different code paths.

## Relation to the current-state research prompt

Run the [current-state research prompt](current-state-research-prompt.md) before applying this pattern. The architect challenge depends on knowing which platform capabilities are actually available — without that, the comparison table rows are speculative.

## Anti-patterns

- Comparing options at the level of "lines of code" without asking what the expression surface allows
- Treating CEL/JSONLogic/similar as a "smaller scope" option because it's a library, not a build
- Omitting the evaluation-cost row (latency is often the deciding factor at a promotion-evaluation call site)
- Deciding between options before confirming which platform capabilities each requires
