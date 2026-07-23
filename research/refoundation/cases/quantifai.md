---
canonical: false
status: evidence-ready-outcome-pending
date: 2026-07-22
initiative_shape: pilot-invalidation-and-recharter
period: 2026-07
---

# QuantifAI claim-control dossier

## Governing context

QuantifAI began with an enterprise buyer hypothesis, changed the presumed owner
after a real interview, then retired that pilot when the actual owner could not
be reached. It re-chartered around the initiating operator's own unit-of-work
cost problem and rewrote downstream artifacts rather than carrying the old
enterprise story forward.

This is the primary positive contrast to Film Room's delayed re-declaration.

## Incident QI-01 — a real interview contradicted the presumed owner

**Status:** evidenced positive control · **Confidence:** high

- **Intent before:** serve the organizational owner of AI-tool spend and
  administration.
- **Claim:** a platform-engineering lead was the pilot owner and should shape the
  first screen and competitive set.
- **Evidence at the time:** market/retrospective reasoning supported the initial
  profile, but the first stakeholder interview placed ownership in a separate
  finance-reporting function and reported no specific trigger incident.
- **Transition:** ADR-0002 re-targeted the pilot, changed first-screen priority,
  and explicitly left direct-owner walkthrough and local demand as open gates.
- **Classification:** `positive-control` primary; `intent-change` handled before
  downstream certainty hardened.
- **Earliest safe catch:** first direct stakeholder evidence, before treating a
  proxy walkthrough as buyer validation.
- **Candidate control to test:** actor ownership is a claim with evidence status;
  contradictory direct evidence invalidates downstream assumptions and requires
  explicit re-derivation.
- **Counterevidence:** the interviewee remained a proxy rather than the actual
  owner. The ADR correctly preserved that caveat instead of upgrading it.

**Sources**

- `quantifai-next:decisions/0002-pilot-retarget-ai-ops-cfo.md` (public text is
  de-named here to `enterprise AI-ops owner`).

## Incident QI-02 — an unreachable owner killed the enterprise pilot

**Status:** evidenced positive control · **Confidence:** high

- **Intent before:** validate the enterprise pilot through a direct owner
  walkthrough before Stage 3.
- **Claim:** the enterprise-internal buyer remained a viable pilot despite no
  direct access.
- **Evidence at the time:** the operator stated that owner feedback would not be
  available. The prior ADR had already made direct access a kill gate.
- **Transition:** ADR-0003 treated the gate as permanently failed, retired the
  enterprise pilot, and re-chartered around the operator as user zero.
- **Classification:** `positive-control` primary. The method stopped rather than
  laundering proxy evidence into buyer validation.
- **Earliest safe catch:** the moment access was known to be unavailable.
- **Candidate control to test:** actor outcomes declare evidence prerequisites
  and expiry/kill conditions; permanently unavailable validation cannot remain
  an indefinite pending excuse while downstream work proceeds.
- **Counterevidence:** pivoting to an available operator can be convenience, not
  truth. The re-charter needs its own evidence and kill questions.

**Sources**

- `quantifai-next:decisions/0003-pilot-retarget-solo-operator.md`.

## Incident QI-03 — re-chartering required downstream re-derivation

**Status:** evidenced positive control · **Confidence:** high

- **Intent before:** replace the enterprise owner with a solo operator whose
  unit of analysis is initiative/project/session cost and output.
- **Claim:** changing `pilot_profile` alone would be enough to continue.
- **Evidence at the time:** the new pilot changed competitors, feasibility,
  distribution, first-screen priority, terminology, funnel, and revenue
  sequencing. Some research remained valid at a narrower personal-scope grain.
- **Transition:** ADR-0003 enumerated downstream artifacts to replace, amend,
  retain, or demote to context and authored new kill questions.
- **Classification:** `positive-control` primary. It preserves evidence by scope
  instead of either rewriting history or carrying incompatible conclusions.
- **Earliest safe catch:** re-charter acceptance, before any old actor-specific
  artifact can serve the new pilot.
- **Candidate control to test:** scope changes declare affected claims and
  dependencies; downstream artifacts become retained, invalidated, or pending
  based on those links.
- **Counterevidence:** the re-derivation list was manually authored and may omit
  hidden dependencies. This supports a traceable claim graph, not necessarily
  a universal document list.

**Sources**

- `quantifai-next:decisions/0003-pilot-retarget-solo-operator.md`, downstream
  re-derivation section.

## Pending control QI-P1 — the easier pilot has not yet earned market scope

**Status:** partial/pending · **Confidence:** high on declared risk

The pivot deliberately re-enters an audience served by an earlier zero-user
attempt. The ADR therefore requires:

- a solo-market differentiation check;
- thirty days of dogfood that changes at least one real decision; and
- external pull before agency/billing investment.

These are not completed outcomes in the inspected evidence. The case proves a
well-formed claim ceiling and stop conditions, not product demand.

## Incident QI-04 — registry absence limits fleet authority

**Status:** evidenced · **Confidence:** high

QuantifAI has a current local manifest and active evidence but is absent from
`consumers.yml`. As with SE Docs Front Door, this is evidence that registration,
local existence, active use, and methodology conformance are separate claims.
It informs corpus discovery and fleet governance, not the product-initiative
kernel by itself.

## Operator ratification items

1. Did the solo pilot complete its 30-day decision-change test or receive any
   external pull after the inspected artifacts?
2. Was the enterprise owner truly unreachable by structural constraint, or was
   the initiative intentionally unwilling to spend the coordination cost? Both
   can justify retirement but imply different future controls.
3. Which downstream dependencies were missed, if any, by the manual
   re-derivation list?
