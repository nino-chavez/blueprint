# Current-state research prompt

## What it is

Before writing any design document (architectural options analysis, proposal body, spec section), a research pass that answers **"what needs to be true for this design to work?"** — grounded in the platform's actual behavior today, not assumed capabilities.

## Why it exists

Blueprint's Stage 1–2 research phase (inputs + synthesis) can produce documents that treat aspirational or hypothetical capabilities as established fact. When those documents reach the proposal stage, stakeholders challenge claims that aren't sourced — and the session burns turns re-researching things that should have been established on the first pass.

The pattern was named from the bc-promo-rules initiative, where the architectural-options analysis for "CEL expression engine" required confirming:
- Does BC's Promotions API actually expose condition hooks extensible enough for email-domain evaluation?
- What does the Promotions data model look like for customer context at evaluation time?
- Does BC's public API surface `customer.email` at promotion-evaluation time, or only post-checkout?

These were answerable from `docs.bigcommerce.com` in ~20 minutes. Without asking the question explicitly, the research skipped them — and they surfaced as gaps in the Gate 4 fact-check.

## The frame

Before writing a design doc that depends on platform behavior, ask explicitly:

> **"What needs to be true for this design to work — and is each of those things actually true in the platform today?"**

Structure the answer as a checklist:

```
[ ] <Capability or behavior the design depends on>
    Source: <docs.bigcommerce.com URL or internal doc path>
    Verdict: confirmed / unconfirmed / false (see note)
    Note: <what was actually found, if different from assumption>
```

Any `unconfirmed` or `false` item should either:
- Block the design from advancing to a proposal, or
- Be explicitly scoped as a spike/open question with a `<!-- hive-meta gate: blocked-by -->` entry

## Where it appears in the pipeline

- **Stage 1 (inputs)**: run before finalizing feasibility research
- **Stage 2 (synthesis)**: cite confirmed capabilities in synthesis
- **Stage 3 (portal)**: feasibility section links to confirmed sources, not assumptions

## Relation to the architect-challenge pattern

The "what needs to be true" frame is the *research* entry point. The [architect-challenge pattern](architect-challenge-pattern.md) is the *design* entry point — it asks "what does Option A require that Option B doesn't, and is that requirement met?" They compose: research first establishes the landscape; architect challenge then picks between options.

## Anti-patterns

- Citing a capability that was "mentioned in a Slack thread" without a `docs.bigcommerce.com` source
- Treating a BC internal RAG doc reference as equivalent to a verified public-API contract
- Deferring "check if this works" to a spike after a proposal is already ratified
