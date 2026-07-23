---
canonical: false
status: evidence-ready
date: 2026-07-22
initiative_shape: large-code-shipping-program
period: 2026-05..2026-07
public_identity: private/subs-initiative
---

# BC Subscriptions claim-control dossier

## Why this initiative belongs in the corpus

The subscriptions initiative is intentionally unpinned and has no
`blueprint.yml`; it is nevertheless methodology-origin evidence. It ran the
research → requirements → prototype → implementation loop at production-system
scale and produced several controls now upstream in Blueprint. Registry shape
cannot be the admission rule when one of the method's strongest empirical cases
predates or originates that shape.

## Incident BC-01 — presence authority bled into function authority

**Status:** evidenced · **Confidence:** high

- **Intent before:** maintain one deterministic implementation-state register
  over a large specification and codebase.
- **Claim:** `COMPLIANT` capability state was rendered and read as implemented,
  shipped, or working.
- **Issuer:** the state-derive register and downstream portal/roadmap language.
- **Evidence at the time:** all 1,166 check primitives were static presence
  checks. None executed code, hit an endpoint, or asserted a test result. A
  storefront injector and renderer could disagree on their selector while both
  files individually passed.
- **Transition:** the 2026-06-10 ADR measured G4 behavior at 0/332 acceptance
  criteria and adopted a five-gate register: specification, prototype,
  presence, behavior, and live.
- **Classification:** `oracle-claim-mismatch` primary. The underlying tool was
  correct about presence; institutional language and consumers silently raised
  the claim ceiling.
- **Earliest safe catch:** the first surface that translated a static result
  into "done" or "shipped." The primitive type was already known.
- **Candidate control to test:** every receipt declares the object proved and
  downstream renderers may not paraphrase beyond that ceiling. Missing/stale
  behavior evidence is unknown/manual, never compliant-by-default.
- **Counterevidence:** deterministic static checks remain valuable and scalable.
  The corrective ADR explicitly keeps them as G3 instead of discarding them.

**Sources**

- `private/subs-initiative:docs/decisions/0067-dod-verification-ladder.md`
- The selector-seam example and measured G1–G5 baseline in that ADR.

## Incident BC-02 — agent-produced state evidence was trusted before sampling

**Status:** evidenced · **Confidence:** high

- **Intent before:** use agent fan-out to audit a rapidly changing, large
  repository and produce reliable status artifacts.
- **Claim:** retroactive ADR-drift audits and generated catalogs could be cited
  as implementation authority.
- **Issuer:** agent-generated audit/register artifacts.
- **Evidence at the time:** a retroactive audit had a measured 57% false-positive
  rate; same-day shipping made prose audits stale within hours; a model-produced
  catalog repeated one uniform flag bug across files until a stop-and-check
  caught it.
- **Transition:** the initiative codified trust-but-verify: sample against
  canonical sources before downstream citation; if false positives exceed 10%,
  redo with closer source reading rather than further delegation.
- **Classification:** `stale-evidence` primary; `authority-violation`
  contributing when candidate evidence was treated as authority.
- **Earliest safe catch:** before an agent-generated state artifact becomes a
  source for another decision or generated surface.
- **Candidate control to test:** state-of-X artifacts carry source version,
  observer, sampling result, freshness, and expiry; downstream use requires a
  compatible receipt rather than author confidence.
- **Counterevidence:** agent fan-out was not rejected. The response narrows what
  it may authoritatively conclude and introduces sampling/stop rhythm.

**Sources**

- `private/subs-initiative:docs/methodology/2026-05-13-trust-restoration-lessons.md`
  Lessons 14–15 and the stale-audit evidence.

## Incident BC-03 — a live platform challenge exposed systemic API assumptions

**Status:** evidenced · **Confidence:** high

- **Intent before:** ship subscription behavior against a real commerce
  platform using documented and previously reasoned API contracts.
- **Claim:** endpoint choices and request/response assumptions across the
  implementation were sufficiently proven.
- **Issuer:** code, tests, comments, and prior design conclusions.
- **Evidence at the time:** a senior domain engineering challenge and live
  sandbox probes found real endpoint and payload mismatches. Existing comments,
  docs, and tests had not proven all contracts against the live system.
- **Transition:** the operator broadened the issue into a systemic verification
  backlog. The builder first proposed checking a small cheap sample; the
  operator rejected the scale-down and restored the north-star path. Subsequent
  work live-verified and fixed items one by one.
- **Classification:** `oracle-claim-mismatch` primary;
  `existing-rule-noncompliance` contributing once the initiative already held a
  trust-but-verify rule.
- **Earliest safe catch:** before adapter contracts and downstream tests treated
  documentation or code comments as live platform proof.
- **Candidate control to test:** external-system claims declare their required
  oracle—vendor specification, contract test, sandbox probe, or live production
  receipt—and high-impact seams cannot inherit a stronger grade from adjacent
  unit tests.
- **Counterevidence:** live verification is not always safe or available. The
  method must represent blocked-external claims and preserve testable lower
  gates instead of demanding universal production mutation.

**Sources**

- Local Claude JSONL session `52e7ee48-e39d-46ab-8479-42e6ca97e4c2`, sampled
  around the systemic API-assumption audit and "why scale down?" correction.
- Resulting merged fixes and live-scenario evidence referenced by that session.

## Incident BC-04 — proven diagnosis stopped short of the authorized outcome

**Status:** evidenced behavior; kernel relevance disputed · **Confidence:** high

- **Intent before:** under the initiative's campsite rule, fully diagnosed bugs
  with a proven fix should be implemented and shipped unless a checked blocker
  prevents it.
- **Claim:** documenting the exact refund contract sufficiently de-risked a
  future adapter fix, while implementation could stop because the fix appeared
  to involve a broader design surface.
- **Evidence at the time:** live probes had proven the correct contract. The
  builder had not inspected the actual callers before inferring unresolved
  partial/full-refund complexity.
- **Transition:** the operator identified a campsite-mode violation. The builder
  inspected callers, found the feared surface narrower than assumed, then
  implemented, tested, live-verified, and shipped the adapter fix.
- **Classification:** `existing-rule-noncompliance` primary. This may be a local
  working-mode incident rather than a universal kernel requirement.
- **Earliest safe catch:** before dispositioning a proven defect as
  documentation-only. Actual caller evidence was available.
- **Candidate control to test:** dispositions distinguish diagnose, decide,
  implement, and verify; stopping before the authorized outcome requires an
  evidenced blocker rather than speculative complexity.
- **Counterevidence:** not every diagnosis authorizes implementation, and this
  principle must not expand a read-only audit into mutation. The rule applies
  only when task authority and the consumer's standing completion contract both
  require the fix.

**Sources**

- Local Claude JSONL session `52e7ee48-e39d-46ab-8479-42e6ca97e4c2`, sampled
  around the operator's quoted campsite-mode correction.

## Positive control BC-P1 — G1–G5 preserves weaker proof

**Status:** evidenced · **Confidence:** high

The corrective verification ladder does not turn every item red because live
proof is missing. It preserves specification, prototype, and presence as useful
independent gates; makes behavior/live gaps visible; and gives
`blocked-pending-external` first-class status.

**Preservation requirement:** a future kernel should model evidence dimensions
without making the strongest possible oracle universally mandatory. It must
stop semantic upgrading, not erase lower-grade knowledge.

## Positive control BC-P2 — output jobs were re-derived from real readers

**Status:** evidenced structure; observed-human outcomes uneven ·
**Confidence:** high on structure, medium on fitness

The initiative's later stakeholder-surface work separated canonical account,
audience-specific projections, takeover corpus, and sanitized counterparty
packages. That evidence helped produce Blueprint's actor-output contract and
showed that a portal is not the universal output.

**Preservation requirement:** the re-foundation may simplify actor-output, but
it must retain exclusion-by-construction for recipient-safe packages and must
not count simulated readers as observed-human success.

## Operator ratification items

1. Is BC-04 a useful universal disposition invariant, or should it remain a
   project working-mode example?
2. Which external-system claims truly require a live sandbox receipt versus an
   authoritative contract test? The kernel should declare oracle need, not
   impose one universal proof source.
3. Should the 10% false-positive sampling threshold remain local evidence or
   become a candidate default? This dossier treats the invariant—not the number—
   as portable.
