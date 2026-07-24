---
canonical: false
status: preregistered-before-implementation
date: 2026-07-23
consumer: adaptive-commerce-content
consumer_revision: 2952971fbca158b7dd6cd7e8fe25fd5e397c45dc
evaluator_revision: 3caf71ba64ed57e1b0217515c26dcdb5aee87a35
template_change_authorized: false
public_cli_change_authorized: false
---

# Adaptive Commerce Content pilot-promotion preregistration

## Evidence boundary

The first prospective external steering pilot completed both sides of the
version-1 execution boundary:

- an operator supplied authenticated BigCommerce sandbox context, after which
  the agent completed the authorized read-only observation and returned to
  machine work; and
- the operator later delegated one reversible local product disposition, which
  the agent selected and recorded without treating the delegation as merchant
  acceptance or external-system authority.

The same initiative kept a late implementation POC sealed until its independent
direction and comparison rubric were committed. The post-validation comparison
retained that direction while adopting named hardening findings.

These are two concrete methodology findings from one consumer. They cross the
threshold for root experimental hardening. They do not cross the
`METHODOLOGY-AMENDMENTS.md` strong-promotion threshold of similar findings in
two or more initiatives, so this change may not alter `template/`, the public
CLI, or stamped defaults.

## Question A — bounded delegated decisions

Can steering version 2 make delegated local decision authority executable
without inventing a new kernel authority primitive?

The delegation is policy above the kernel. The human authorization remains a
human claim. The resulting product choice remains a decision claim and
disposition.

### Frozen contract

`blueprint-steering/2` adds authored decision delegations. A delegation must
name:

- the delegating actor and delegate;
- the exact satisfied human authorization claim and revision;
- decision classes;
- allowed and prohibited effects;
- escalation triggers;
- whether the method recommendation may become the default;
- the exact decision record and exercise receipt destinations.

An autonomous route for a decision claim must reference a delegation whose
class and effects cover that claim. Prohibited effects win. A completed
delegated decision must have a matching disposition and exercise receipt.

Version 0 and version 1 behavior remains unchanged.

### Preregistered delegation tests

1. A covered reversible local decision evaluates with an authored autonomous
   route and identifies the delegation.
2. The satisfied delegation claim does not satisfy a separate human product
   acceptance claim.
3. Missing authored delegation is rejected; no authority is inferred.
4. A prohibited external effect is rejected.
5. A decision class outside the delegated set is rejected.
6. A completed delegated decision without a matching exercise receipt is
   rejected.
7. Version 0 and version 1 expected recipes remain byte-deterministic.

## Question B — source influence and sealed holdouts

Can a small source-influence contract prevent a late reference from silently
becoming definition input while retaining honest post-validation use?

### Frozen contract

The research-only `blueprint-source-influence/0` manifest defines four source
roles:

- `definition-input`;
- `prior-art`;
- `holdout`; and
- `receipt-only`.

Each role has fixed allowed phases and claim uses. Holdouts additionally require
an exact pinned revision, independent baseline revision, preregistered
comparison artifact, exact unseal condition, unseal status/revision, and
contamination disclosure.

Artifacts declare their phase, kind, revision, and typed source citations. A
holdout citation in a pre-unseal decision is invalid. Post-unseal comparison is
valid only after the declared boundary and may not relabel the holdout as
definition evidence.

### Preregistered source-influence tests

1. A sanitized Adaptive Commerce Content protocol and post-validation fixture
   passes.
2. A holdout cited by a pre-unseal decision is rejected.
3. A holdout without an exact baseline, pin, comparison artifact, unseal
   condition, or contamination disclosure is rejected.
4. Post-unseal comparison while the source remains sealed is rejected.
5. A holdout used as definition input after unsealing is rejected.
6. A receipt-only source used to define the product is rejected.
7. Results are deterministic and contain no absolute user path.

## Stop and distribution rule

Passing both harnesses authorizes a root research disposition and another
consumer pilot. It does not authorize a methodology wave, a `template/`
change, a public command, or retroactive mutation of the completed consumer.

The next strong-promotion threshold is a second contrasting initiative that
uses the authored delegation or holdout contract prospectively. Until then,
the consumer amendments remain active candidates rather than “already
promoted.”
