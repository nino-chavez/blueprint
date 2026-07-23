---
canonical: false
status: evidence-ready-outcome-pending
date: 2026-07-22
initiative_shape: configure-first-multi-actor
period: 2026-07
---

# SE Docs Front Door claim-control dossier

## Governing context

The initiative aims to reduce repeated senior-domain-expert interruptions by
giving sales engineers cited, authority-labeled answers in an existing
enterprise chat environment. The primary product surface is vendor-hosted
configuration. A custom application is a contingent fallback.

This case is a counterexample to treating repository implementation as the
universal work or output. It is not yet proof that the configured product
achieves the human outcome: the live pilot remains pending.

## Incident SE-01 — canonical code prototyping would test the fallback

**Status:** evidenced decision; live outcome pending · **Confidence:** high

- **Intent before:** test the highest-risk assumptions behind a cited-answer
  front door using the organization's actual sources, permissions, and users.
- **Claim:** the canonical built-prototype stage was the appropriate next
  evidence generator.
- **Evidence at the time:** the riskiest unknowns were shared-source visibility,
  prompt-level authority labeling, citation quality, source scoping, and
  available telemetry. Code written outside the live environment could not
  answer them; it would prototype only the fallback branch.
- **Transition:** ADR-0001 declared a configure-first pilot protocol as the
  prototype and named the exact failures that would activate a thin custom
  build.
- **Classification:** `positive-control` primary; historical `method-gap`
  pressure against a universal built-prototype interpretation.
- **Earliest safe catch:** work-plan selection, before code is written.
- **Candidate control to test:** choose work and oracle from the claim's highest
  uncertainty; a prototype is an evidence-generating intervention, not
  necessarily software authored in the repository.
- **Counterevidence:** the configured path depends on enterprise access and
  vendor capabilities. If named failure triggers fire, code becomes the correct
  experiment.

**Sources**

- `se-docs-frontdoor:decisions/0001-configure-first-pilot-as-prototype.md`
- `se-docs-frontdoor:blueprint.yml` Stage-2 deviation.

## Incident SE-02 — success would become unmeasurable if launch preceded baseline

**Status:** evidenced positive control · **Confidence:** high

- **Intent before:** evaluate whether the front door reduces senior-expert
  interruption, with weekly active use as a secondary signal.
- **Claim:** the configured surface could be issued once its configuration and
  pilot protocol existed.
- **Evidence at the time:** no pre-launch interruption baseline had been
  recorded. Launching first would destroy the initiative's ability to compare
  the primary outcome against prior behavior.
- **Transition:** the actor-output manifest declares a typed
  `deflection-baseline` precondition that blocks issuing the configured surface;
  the current state remains `PENDING`.
- **Classification:** `positive-control` primary. This is a transition correctly
  refusing green before an irreversible measurement boundary.
- **Earliest safe catch:** before pilot go-live.
- **Candidate control to test:** a claim may declare evidence prerequisites that
  must be captured before an irreversible action; unmet prerequisites render
  pending, not failed or passed.
- **Counterevidence:** the baseline file's existence does not prove its quality.
  Human outcome still requires an observed pilot receipt.

**Sources**

- `se-docs-frontdoor:actor-output.yml` preconditions and planned
  `slack-frontdoor` output.
- `blueprint-self:research/portal-ia-rederivation/06-validator-run.md` — executed
  missing-baseline fixture.

## Incident SE-03 — the product output may not be a repository artifact

**Status:** evidenced model pressure · **Confidence:** high

- **Intent before:** declare which outputs serve sponsor, end-user, senior
  expert, and maintainer outcomes.
- **Claim:** an output contract based only on files/paths could describe the
  primary product surface.
- **Evidence at the time:** the Slack/channel configuration is externally
  rendered; the repository can hold its config source and proof but not the
  running surface itself.
- **Transition:** the manifest introduced a `configured-surface` output with an
  external renderer and retained repository artifacts for protocol, decision,
  and recovery outputs.
- **Classification:** `method-gap` pressure against artifact-only output
  semantics; currently a `positive-control` in actor-output.
- **Earliest safe catch:** schema design, before requiring every served outcome
  to resolve to a local artifact.
- **Candidate control to test:** distinguish canonical account, work/control
  source, product surface, and evidence receipt. Each may live in a different
  system.
- **Counterevidence:** external surfaces still need a resolvable control source,
  version, and observation path. "External" cannot become a path-validation
  escape hatch.

**Sources**

- `se-docs-frontdoor:actor-output.yml` configured-surface declaration.
- `blueprint-self:research/portal-ia-rederivation/07-se-docs-frontdoor-correction.md`.

## Incident SE-04 — registry absence hid a valid consumer from fleet-derived research

**Status:** evidenced · **Confidence:** high

- **Intent before:** use the consumer registry to inventory the fleet and derive
  cross-consumer output requirements.
- **Claim:** the registry-driven sweep covered the relevant consumers.
- **Evidence at the time:** SE Docs Front Door existed locally with a stamped
  manifest and distinct configure-first shape but was absent from
  `consumers.yml`; an initial external review incorrectly flagged it as absent.
- **Transition:** direct workspace verification found the consumer and added it
  to the actor-output specimen set. The registry remains unreconciled.
- **Classification:** `stale-evidence` primary; `enforcement-gap` contributing.
- **Earliest safe catch:** corpus construction. Registry membership and local
  consumer existence are different claims.
- **Candidate control to test:** an evidence inventory declares its discovery
  scope and reconciliation grade; absence from a mirror never proves absence
  from the fleet.
- **Counterevidence:** filesystem discovery also misses remote-only consumers.
  No single discovery source is universal.

**Sources**

- `blueprint-self:research/portal-ia-rederivation/03-structure-comparison.md`
  correction note.
- `se-docs-frontdoor:blueprint.yml`.

## Claim ceiling and preservation requirement

SE Docs Front Door currently proves that the initiative has a coherent
configure-first plan, actor/outcome contract, and blocking baseline
precondition. It does **not** prove interruption deflection, answer quality, or
adoption. A future kernel must be able to call this a successful pending
initiative rather than either greenwashing it or calling the method failed.

## Operator ratification items

1. Has the live pilot since run or produced observed-human evidence outside the
   current repository state?
2. Is `configured-surface` a necessary kernel concept, or can a more general
   external outcome/surface reference cover it?
3. Which registry action should adoption require, if any? The corpus treats
   discovery truth and registration governance as separate concerns.
