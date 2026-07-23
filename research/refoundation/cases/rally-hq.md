---
canonical: false
status: evidence-ready
date: 2026-07-22
initiative_shape: live-midstream-saas
period: 2026-05..2026-07
---

# Rally HQ claim-control dossier

## Governing context

Rally HQ is a live tournament product with real users and declared stakeholder
groups. Its Blueprint initiative targets in-flight north-star surfaces rather
than the whole mature product. It is therefore the corpus's clearest live
midstream case.

The evidence also carries an important limit: `execution.depth` describes the
Blueprint research as synthetic. Real users exist, but most portal/persona
fitness findings are agent walks or operator self-QA rather than observed
external-reader sessions.

## Incident RH-01 — product age was mistaken for work shape

**Status:** evidenced · **Confidence:** high

- **Intent before:** revise north-star surfaces in an active product using its
  existing design and operational substrate.
- **Claim:** because the initiative was attached to an existing product, an
  earlier workflow could be force-fit into the greenfield model.
- **Evidence at the time:** the product was live, the work touched an active
  in-flight area, and existing research/design artifacts mapped naturally to a
  targeted diagnose and prescription. The force-fit produced retrofit feel and
  left the prescription stage missing.
- **Transition:** Rally HQ formally adopted the midstream variant and mapped its
  existing artifacts into the scoped sequence.
- **Classification:** `method-gap` at the historical time; later a
  `positive-control` for the variant taxonomy. The portable invariant is that
  lifecycle shape is determined by the work and claim boundary, not repository
  age.
- **Earliest safe catch:** initiative declaration, before artifacts are mapped
  into the wrong stage semantics.
- **Candidate control to test:** derive work shape from current product state,
  intended change, and evidence blast radius rather than a fixed greenfield
  default.
- **Counterevidence:** variants may be compatibility views rather than kernel
  primitives. This incident proves a scope distinction, not necessarily the
  current four-name taxonomy.

**Sources**

- `rally-hq:blueprint.yml` header and variant declaration.
- Blueprint's archived variant-taxonomy handoff, which names Rally HQ as the
  midstream adoption case.

## Incident RH-02 — advisory state synchronization did not survive parallel work

**Status:** evidenced · **Confidence:** high

- **Intent before:** `prescription.yml` owns item status while the roadmap owns
  sequence and gates; both are served as current initiative state.
- **Claim:** a written maintenance rule was sufficient to keep the two views
  coherent.
- **Evidence at the time:** the roadmap froze while twelve arcs shipped; six
  items marked planned were verifiably in production; duplicate item IDs and
  missing active items survived a same-day comprehensive rewrite.
- **Transition:** the consumer added an executable drift guard joining the
  registry and view. Its first dry run caught errors in the session that wrote
  the advisory rule.
- **Classification:** `enforcement-gap` primary; `stale-evidence` contributing.
- **Earliest safe catch:** whenever a state-owning registry or status-bearing
  view changes. Both artifacts and their declared division of authority already
  existed.
- **Candidate control to test:** status has one authority; every projection
  derives or asserts synchronization against it, and a projection carries the
  source version/freshness it represents.
- **Counterevidence:** sequence and gate rationale are authored judgments and
  should not be generated from the status registry. The successful control
  checks shared claims without erasing distinct artifact jobs.

**Sources**

- `rally-hq:blueprint/METHODOLOGY-AMENDMENTS.md`, 2026-06-11
  roadmap/status-registry sync entry.
- `rally-hq:src/lib/blueprint-roadmap-sync.test.ts`.

## Incident RH-03 — portal conformance served the builder's corpus, not readers

**Status:** evidenced on structure; external human fitness unobserved ·
**Confidence:** high on structure, medium on reader effect

- **Intent before:** give leadership/partners, product/CX, and engineering useful
  paths through the initiative account.
- **Claim:** a conformant Pattern-B portal and its global navigation represented
  a stakeholder-ready surface.
- **Evidence at the time:** approximately 94 served files gave construction
  harness and recipient account equal weight; two of five front-door intent
  cards pointed at harness material. Across Pattern-B consumers, no external
  redesign reviewer was logged opening the portal.
- **Transition:** Rally HQ classified product/harness/delivery surfaces,
  de-weighted rather than deleted harness material, and built three thin reader
  lenses. Persona walks then exposed terminology and framing defects.
- **Classification:** `oracle-claim-mismatch` primary; `authority-violation`
  contributing where simulated readers were allowed to imply human fitness.
- **Earliest safe catch:** before route/component conformance could render as
  reader readiness. Declared actor outcomes and actual observation grades were
  knowable independently of route presence.
- **Candidate control to test:** output fitness is evaluated against an
  evidenced actor outcome; structural conformance may prove safety/availability
  prerequisites but cannot upgrade to "reader served."
- **Counterevidence:** the portal engine and drawer/citation primitives remained
  useful. The intervention was mainly information architecture and claim
  altitude, not evidence that every portal component failed.

**Sources**

- `rally-hq:blueprint/METHODOLOGY-AMENDMENTS.md`, 2026-07-02
  stakeholder-surface-packaging entry.
- `blueprint-self:research/portal-ia-rederivation/00-evidence-inventory.md`.

## Incident RH-04 — source inspection produced runtime visibility false negatives

**Status:** evidenced · **Confidence:** high

- **Intent before:** use persona-walk agents to evaluate what declared readers
  can see and do on the portal.
- **Claim:** source-level inspection could determine whether drawers and
  citation chips were visible to the reader.
- **Evidence at the time:** those affordances were rendered by JavaScript at
  runtime. Static walkers reported some as missing; live browser inspection
  showed them present.
- **Transition:** the amendment required runtime/browser inspection before a
  visibility claim counts.
- **Classification:** `oracle-claim-mismatch` primary. The observer used an
  oracle incapable of seeing the claimed behavior.
- **Earliest safe catch:** reviewer protocol selection. The claim itself named
  runtime visibility.
- **Candidate control to test:** each claim declares a compatible observation
  method; an incompatible oracle yields unknown/could-not-observe, not fail or
  pass.
- **Counterevidence:** source inspection remains valid for source-owned copy,
  data contracts, and static safety rules. The control is claim-specific.

**Sources**

- `rally-hq:blueprint/METHODOLOGY-AMENDMENTS.md`, 2026-07-02 delta 5.

## Incident RH-05 — a guard narrated a failure it never observed

**Status:** evidenced · **Confidence:** high

- **Intent before:** a pre-push hook blocks drift and tells the operator what to
  repair.
- **Claim:** any nonzero exit from a silenced test runner meant the design-token
  document had drifted.
- **Evidence at the time:** in a fresh worktree, the runner dependency was
  missing; the checker never ran. The wrapper replaced every possible nonzero
  exit with one specific drift story.
- **Transition:** the consumer added a runner preflight with a truthful
  could-not-run message while preserving fail-closed behavior.
- **Classification:** `tooling-defect` primary. It supports a portable
  truthful-verdict invariant but does not require a new methodology stage.
- **Earliest safe catch:** wrapper design or a negative fixture where the runner
  is absent.
- **Candidate control to test:** verdict states distinguish failed, blocked,
  pending, and could-not-run; a wrapper cannot narrate evidence the underlying
  observer did not produce.
- **Counterevidence:** the guard correctly failed closed. Only its diagnosis and
  implied evidence were wrong.

**Sources**

- `rally-hq:blueprint/METHODOLOGY-AMENDMENTS.md`, 2026-07-02 hook-wrapper entry.

## Positive control RH-P1 — class and lens were separated

**Status:** evidenced structure · **Confidence:** high

Rally HQ preserved canonical/harness artifacts while composing smaller
actor-specific views. It also discovered that artifact class and lens
membership are independent: material de-weighted in global navigation may be
the exact account an engineering evaluator needs.

**Preservation requirement:** a future kernel should separate canonical truth,
actor outcome, and projection. It should not encode a universal navigation or
delete evidence merely because one reader should not see it first.

## Operator ratification items

1. Which Rally HQ stakeholders actually reviewed initiative outputs outside the
   operator? Current evidence says the portal walks were simulated.
2. Is variant vocabulary itself valuable, or is RH-01 better represented by a
   general re-charter/blast-radius rule?
3. Should truthful `could-not-run` be a kernel verdict invariant or remain a
   tooling quality rule?
