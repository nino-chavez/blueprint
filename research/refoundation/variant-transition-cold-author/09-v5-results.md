---
status: passed-guided-packet-workflow
date: 2026-07-27
candidate_revision: d372a63ee31433b720f066e81f3ab17fe2c5a7fa
scorer_revision: bdf1741d16593c77d51488eab5712c07bec29df0
observation_id: 1d98afa4-12b6-448b-9c62-39031645345f
score: 27/27
---

# Variant-transition cold-author v5 — results

## Disposition

**PASS (27/27).** V5 clears `continued cold-author success` only for the
guided packet/candidate workflow at frozen transition candidate
`d372a63ee31433b720f066e81f3ab17fe2c5a7fa`.

The v5 packet, preparer, and scorer were committed together at
`bdf1741d16593c77d51488eab5712c07bec29df0` before boundary issuance and author
access. The scorer file used for evaluation was byte-identical to that commit.
The boundary was issued at `2026-07-28T02:22:02.423Z`; the author began at
`2026-07-28T02:22:33Z`.

The fresh author:

- completed in 32 seconds;
- made exactly one successful plan invocation and one successful matching apply
  invocation;
- captured the first invocation's JSON using the prospectively corrected
  packet recipe;
- asked zero questions and received zero methodology-creator interventions;
- used plan ID
  `0ce83e48e0db64e9e3d3482ffad095f81d3c675f8686a5203f912b37de380236`;
- preserved both authored sentinels;
- created only the planned transition substrate and append-only receipt; and
- ran neither operator-review-only cleanup nor rollback.

The sealed scorer independently verified all 27 boundary, transcript, decision,
plan/apply, preservation, receipt, status, cleanup, and explanation checks. A
separate post-result integrity check confirmed the baseline-absent plan/apply
captures were ordinary non-symlink files inside the disposable fixture. That
check is corroboration, not a retroactively added pass criterion.

## Evidence identities

| Artifact | SHA-256 |
|---|---|
| frozen v5 scorer | `47b562cf9a72df886887809b40187d234692b31542afc66688359cba40682532` |
| supplied v5 packet | `a33363a4a2f5f68b05e0c645e00d1d2e37812f4752dcced7a674b11066cfe508` |
| observation boundary | `773dc44250460a90a51942fd8a7654053f0fbf1324397fd68d31098e7c6a8591` |
| fixture manifest | `ca2069449c3db6e75c926c6f0db36dc28fa843f1d76519cebe30649d80d7f1b6` |
| author session | `1ad569cd4942ab114da1eae2cf3827e232d1a48c121e385d283280f0e525ae71` |
| dry-run JSON | `8cdac96dcfa7074a6edd55e6cdadf02c3cbc41a10ea411fc9ac5a2cb125af8e5` |
| apply JSON | `3a2c24b4027a4a1f3519d8db3d7be235aa030b4075a870ba817fc2c972f9c4c1` |
| author explanation | `566d6f70eeb9733bc94f0ab1b893573e864627a40fcb3b0e2e38a37850356a9f` |
| transition decision | `e4f35578bebe59dd3009ac25d7ed78ecf81e9b5d038b0d946d09e0a8d95b4ffa` |
| append-only receipt | `bbf19234695e4cf3c9ebee7a3a1b4510aeeef215e65b8293ff44b8b7d52235f8` |
| sealed score | `ea0a649e4eb0418ee0018572e25317d26d3d51489cdc4147071cb91e368046fb` |

## Claim ceiling

V4 remains **FAIL (24/27)** and is not superseded as evidence. Its author
repeated a successful plan because the packet required retained JSON without
showing how to capture the first invocation. V5 validates the prospective
packet correction; it does not erase that discoverability gap.

This pass does not show that bare CLI help is sufficient, that output capture
is independently discoverable, or that a first-class output option is
unnecessary. It is disposable fixture usability evidence, not a consumer,
pilot, initiative-intent receipt, prospective external transition, prospective
rollback, delayed preservation check, or support-operations result.

The cold-author clearance is pinned to the transition behavior at `d372a63`.
Reopen it if transition CLI, plan, receipt, or decision semantics change before
release.

## Remaining gates

The capability remains `candidate`. Its remaining evidence gates are:

1. prospective external transition;
2. prospective external rollback; and
3. delayed preservation check.

Release/version and Wave authorization, plus migration-freeze clearance or
waiver, remain separate authorization gates.

