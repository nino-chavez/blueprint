# Review and disposition loop

Blueprint makes review a first-class initiative capability without making one
portal, feedback service, or coordination substrate mandatory.

The invariant is:

> A declared reader reviews an exact candidate through a reachable adapter;
> their contribution is captured without gaining authority it was not given;
> a disposition records the consequence; and the result returns to the reader.

The presentation can be a Blueprint portal, bespoke site, native product,
document, meeting, Slack thread, or an external annotation system. The method
owns the contract and receipts. The adapter owns rendering, identity, transport,
and storage implementation.

## When to author the contract

Create `review-contract.json` when an output asks a human or team to influence,
approve, challenge, or evaluate live initiative work. A steering packet remains
the reader-facing invitation; the review contract is its executable loop.

Do not create one for:

- a purely informational orientation brief;
- an agent-only mechanical review;
- an internal implementation test with no human reader; or
- feedback already closed before Blueprint entered the initiative.

Use the example at
`docs/methodology/examples/review-contract.example.json`.
Companion examples show the adapter output and disposition record:
`review-submission.example.json` and `review-disposition.example.json`.

## Three durable records

### 1. `review-contract.json`

Declares:

- the exact candidate revision and artifact;
- the reader actor and intended outcome;
- review targets, asks, and authority (`inform`, `advise`, `decide`, `approve`);
- capture mode and adapter;
- submission and disposition destinations;
- who owns disposition;
- what classification/proposal/application work may be automated; and
- whether the result must return to the reader.

Floating revisions such as `main`, `HEAD`, `latest`, and `current` are invalid.
Feedback about one candidate cannot be relabeled as evidence for another.

`planned` and `ready` contracts are structurally valid but remain `PENDING`;
they have not yet invited a reader. `issued` remains `PENDING` until a real
submission arrives. `retired` is valid only with no open submissions, and a
retired-but-unused review remains honestly `PENDING` rather than counting as a
completed loop.

### 2. `feedback/submissions/*.json`

A submission is untrusted reader input pinned to:

- the contract;
- exact candidate revision;
- reader actor;
- declared target; and
- capture adapter.

A submission can report a bug, scope request, question, opinion, market signal,
methodology gap, kudos, or approval. It cannot set acceptance, claim state,
evidence grade, decision state, or product status. Those fields are rejected as
authority laundering.

Verbatim private material stays outside git. Store a redacted/paraphrased
submission record in the initiative, following the privacy rules in
`/blueprint-triage`.

### 3. `feedback/dispositions/*.json`

A disposition closes one submission with:

- a state;
- rationale;
- the declared decision owner;
- typed consequences; and
- return-to-reader status.

`scoped-in` must point to real work. `answered` points to an answer.
`methodology-amendment` points to `METHODOLOGY-AMENDMENTS.md`. A required reader
return remains pending until it is actually sent. `sent` requires a timestamp,
the channel used, and a durable receipt reference; a timestamp alone does not
prove the reader received the result.

## Self-service versus mediated capture

`capture.mode: self-service` means the reader can contribute through the
artifact without the operator copying their words into Blueprint. It requires a
declared adapter artifact or route. The contract validator proves the
declaration and the records it produces; the wave-96 reader encounter audit (or
an adapter-specific test) must prove that the route is actually reachable and
writable. A string in the contract is not runtime evidence.

`capture.mode: mediated` is honest and valid when identity, access, privacy, or
the review venue prevents direct capture. It must name:

- who mediates;
- why mediation is necessary; and
- the canonical submission destination.

The method prefers self-service capture when the reader can reasonably use it.
It does not pretend mediation has disappeared when it has not.

## Relationship to the reader encounter contract

The two contracts close different halves of the reader experience:

- `reader-contract.json` + `encounter-audit` prove the outbound presentation:
  the intended reader can reach the declared content and its copy traces to
  owned sources.
- `review-contract.json` + `blueprint feedback` prove the inbound steering
  loop: the reader's exact-candidate input is captured, dispositioned under
  declared authority, and returned.

An initiative may need either or both. A polished deployed presentation with no
review adapter can pass the reader encounter and remain `PENDING` here—the
Adaptive Commerce Content replay is the deliberate example.

## Automation and authority

The loop can be operator-light:

- classification may be agent-autonomous;
- a proposed disposition may be agent-autonomous;
- reversible application may be delegated through an exact authority record.

The loop is never authority-free:

- external input never mutates canonical state directly;
- `automation.apply: delegated` requires `delegation_ref`;
- `human-authorized` keeps application at the decision owner;
- approval from an advisory reader does not become acceptance; and
- public or anonymous feedback receives the same untrusted-input treatment.

This is the same boundary Atelier reached independently: generic annotations,
traceability, presence, and triage may belong to a reusable substrate, while
Blueprint-specific stages and gates remain a usage pattern. Blueprint therefore
ships the semantic contract and adapters may implement it; Blueprint does not
absorb Atelier or require its stack.

## CLI

```bash
# Structural and authority validation. PENDING exits zero so work can continue.
blueprint feedback

# Closure gate. Requires a valid loop with every submission dispositioned and
# every required return sent.
blueprint feedback --gate

# Machine-readable status for a harness or CI job.
blueprint feedback --json
```

`blueprint doctor` automatically validates the loop when
`review-contract.json` exists. Stage feedback gates recognize both the legacy
Markdown capture/triage pair and the structured submission/disposition
directories. A structured Stage feedback gate reads green only when the
contract validator reads `PASS` and at least one real submission has been
closed; empty directories or a merely ready contract cannot satisfy it.

## What Blueprint does not standardize

- portal navigation or visual design;
- a central SaaS feedback datastore;
- identity provider;
- annotation coordinates;
- Slack, email, Figma, or meeting transport;
- a universal reviewer dashboard; or
- automatic product acceptance.

Those are adapter or initiative decisions. A hosted reference adapter should be
promoted only after a prospective reader uses it without operator mediation.
