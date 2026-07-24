# Review-loop replay

These fixtures test the renderer-independent review/disposition contract against
three contrasting histories.

| Fixture | What it proves | Honest limit |
|---|---|---|
| Atelier | A generic substrate can provide self-service annotations, traceability, presence, and triage without absorbing Blueprint stages | No observed reviewer submission/disposition survives in the archived initiative; the loop remains `PENDING` |
| Film Room | A real operator encounter can be pinned to an exact product candidate, classified, dispositioned, and returned | Capture was mediated through Codex; it was not reader self-service |
| Adaptive Commerce Content | A bespoke review artifact can declare exact readers, asks, authority, and a candidate | The deployed site has no write adapter and no Adam/team submission yet; the loop remains `PENDING` |

Run:

```bash
node research/refoundation/review-loop/test-replays.mjs
```

The replay validates the contract and the convergence boundary. It does not
claim that a hosted self-service adapter has been prospectively validated.
