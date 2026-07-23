---
canonical: false
status: preregistered-before-implementation
date: 2026-07-23
scope: root research only
template_change_authorized: false
consumer_change_authorized: false
---

# Steering-layer experiment preregistration

## Question

Can a small, deterministic layer above Blueprint's semantic kernel improve
prospective work selection without weakening claim/evidence truth or imposing
human encounters before machine-checkable prerequisites are ready?

The semantic kernel is not under test here. Charter, claims, receipts,
authority, and dispositions remain the source of truth. This experiment tests
the missing recipe layer identified by the Film Room longitudinal audit.

## Frozen implementation boundary

Before implementation, the experiment defines:

- one dependency-free evaluator;
- one `blueprint-steering/0` JSON packet;
- four valid consumer-shape fixtures;
- four invalid/adversarial fixtures;
- deterministic JSON and Markdown projections;
- no writes outside `research/refoundation/steering-layer/` and root research
  recommendation files; and
- no `template/`, public CLI, or consumer change.

The evaluator may recommend work. It may not alter claims, issue receipts,
change intent, spend operator attention, or mutate a consumer.

## Author-facing packet

A packet declares:

- `initiative`, `current_revision`, and the intended outcome;
- exact claims with state, kind (`machine`, `human`, or `decision`), active
  status, dependencies, and revision;
- journeys whose ordered steps lead to one outcome and identify which claims
  require human evidence;
- append-only incidents with journey, claim, boundary, classification, and
  product revision;
- dispositions that can explicitly close a repeated-incident cluster;
- operator touches with purpose, required claim, and result;
- an operator-touch budget;
- optional longitudinal source metrics; and
- a cluster threshold per journey.

Historical claims stay present. The generated active projection lists current
claims and summarizes history rather than deleting it.

## Deterministic recipe priority

The evaluator must select exactly one next recipe:

1. unresolved repeated-incident cluster → `holistic-audit`;
2. stale active machine evidence → `refresh-evidence`;
3. contradicted active prerequisite/outcome → `repair-or-revise`;
4. open human claim with unmet deterministic prerequisites →
   `implement-or-verify`;
5. ready human claim with exhausted operator-touch budget →
   `request-budget-disposition`;
6. ready human claim within budget → `run-bounded-encounter`;
7. open machine claim → `implement-or-verify`;
8. open decision claim with its dependencies satisfied →
   `record-disposition`; and
9. no unresolved active claim → `hold`.

An unresolved cluster outranks another local repair. A stale oracle outranks
new work. A human encounter never outranks its deterministic prerequisites.

## Preregistered fixtures and expected results

| Fixture | Expected recipe | Required additional result |
|---|---|---|
| `self-dogfood-initial.json` | `implement-or-verify` | no human encounter; active view contains five claims |
| `film-room-longitudinal.json` | `holistic-audit` | unresolved cluster true; four touches exceed budget one; Settings return blocks founder readiness |
| `fleet-operation.json` | `repair-or-revise` | arrival remains satisfied while use and operation remain contradicted; no cluster |
| `bc-readiness.json` | `refresh-evidence` | stale state plus absent scenario result block receiving-team encounter |
| `self-dogfood-complete.json` | `record-disposition` | every machine prerequisite satisfied; only the decision remains open |

Invalid fixtures must reject:

- duplicate claim identifiers;
- unknown dependencies;
- incidents that reference an unknown journey; and
- a negative operator-touch budget.

## Success criteria

The experiment passes only if:

1. all valid fixture recipes and secondary expectations match;
2. all invalid fixtures fail with source-oriented diagnostics;
3. output is byte-deterministic across deletion and rebuild;
4. generated outputs contain no absolute user path;
5. the self-dogfood initial packet selects implementation before any human
   request;
6. the completed self-dogfood selects an explicit disposition, not a false
   project-success claim;
7. Film Room's repeated failures trigger a holistic audit before another local
   repair;
8. BC's stale/absent oracles trigger refresh before handoff observation;
9. active projection retains historical counts and revisions;
10. core, K1, compact, root-shadow, and cold-author tests remain green; and
11. `template/` and consumer product/configuration bytes remain unchanged.

## Stop conditions

Stop or revise if:

- any rule names Film Room, Fleet, BC, a model vendor, or a product-specific
  boundary;
- the evaluator infers a human result;
- historical evidence is deleted to make the active view small;
- repeated incidents are flattened into one current status;
- a ready decision is represented as automatic authority;
- the evaluator requires a server, package install, or network access;
- generated output becomes a second writable truth; or
- the self-dogfood needs methodology-creator intervention to interpret its next
  recipe.

## Distribution ceiling

Passing this experiment does not authorize a methodology wave. It can justify
continued root dogfood and a later prospective consumer pilot. Public opt-in
distribution still requires contrasting live evidence, support/rollback
behavior, and longitudinal operator results.
