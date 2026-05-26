# template/methodology/voice/

Stage 2 voice-rules reference artifacts. Voice rules apply to Blueprint-the-product's own outputs (docs, CLI, portal microcopy) AND to each consumer initiative's microcopy and prose. Distinct from operator's published-prose voice (e.g., `signal-dispatch-voice-guide.md`) because the audience is agent + operator + stakeholder, not blog reader.

## What's here

| File | What it is |
|---|---|
| `EXAMPLE-voice-rules.md` | Worked example — blueprint-redesign's voice rules for Blueprint-the-product. 4-axis spine extracted via operator-grilled session: methodology-as-actor in 3rd-person abstract using role-names, grounded hedging, audience-tuned cadence, no brand-name-as-subject. |

## How to use

For a new consumer initiative entering Stage 2:

1. Read `EXAMPLE-voice-rules.md` to see how the 4-axis spine + anti-pattern list + good/bad examples are structured.
2. Run a grilling session with the operator (4 questions covering address, hedging, surface consistency, self-reference).
3. Author `decisions/0X-voice-rules.md` for your initiative with the operator-ratified spine.
4. Optionally extend with `forge-brand generate voice` to expand the anti-pattern corpus.
5. Audit the initiative's existing prose against the rules; fix violations before ratification.

## Origin

Authored during the blueprint-redesign dogfood (commit `22aaa9d` on `dogfood/self-redesign`). The 4-axis spine is the methodology's first formal voice-rules schema; it generalizes via the EXAMPLE shape rather than via canonical chrome.
