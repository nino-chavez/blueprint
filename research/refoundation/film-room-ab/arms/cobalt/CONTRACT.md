# Initiative contract — cobalt

Treat the current Film Room Blueprint sources as the governing contract:

- `blueprint.yml` — midstream assisted-beta configuration, launch trigger, and
  artifact/experience profiles;
- `actor-output.yml` — actors, outcomes, outputs, assurance, and PENDING gate;
- `launch-contract.yml` — lifecycle ownership and declared release gates; and
- existing decisions, research, launch receipts, and runbooks as supporting
  evidence.

Read-only current method executions at the frozen snapshot:

```text
npm run manifest:gate
actor-output.yml: PENDING (0 errors, 3 pending, 0 warns)
pending human validation:
- provenance-portal
- scope-decision-aid
- event-delivery-report

npm run launch:contract
launch contract: PASS — 10 lifecycle states are owned and gated
```

Lifecycle labels (`ready`, `issued`), structural validation, and launch-contract
PASS retain their declared meanings. Use the governing sources to determine
what they establish and which actor outcomes remain unproven. Do not assume
that a file, status label, test, or validator proves a human outcome it does not
observe.
