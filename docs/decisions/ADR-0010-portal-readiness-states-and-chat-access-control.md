---
canonical: true
adr: 0010
status: proposed
date: 2026-07-11
deciders: ["Nino Chavez"]
ratification: "PROPOSED — drafted wave 86 (2026-07-11); split from ADR-0009 per external review (separate architectural decisions); awaiting operator ratification"
scope_ceiling: "A — methodology-native + consumer-provisioned CF primitives (Turnstile widget, KV) where the consumer opts in"
depends_on:
  - ./ADR-0008-deterministic-core-agentic-shell-stage-orchestration.md
references:
  - "internal: ../../template/portal/CONVENTIONS.md — the manifest contracts (front_door, docs.tiers, chat) this extends"
  - "internal: ../../template/portal/functions/api/chat.OWNER-SPEC.md § Security posture — the wave-86 interim stance this ADR supersedes on adoption"
  - "incident: ../../WAVE-LOG.md wave 85 defect 7 — a stakeholder met stamped placeholder content ('five paths') on a deployed portal"
  - "external review: Codex audit rounds 1–3 (2026-07-11) — WARN-vs-BLOCK deployment-intent split and 'enforced by doctor/prep-deploy, not only documented' are its review conditions, accepted"
---

# ADR-0010 — Portal readiness states + hosted-chat access control

## Status

Proposed. Two related consumer-protection decisions that share one design
question — what the methodology may require a consumer to provision — split
from ADR-0009 per external review.

## Context

Pattern B stamps ship authoring skeletons by design ("Replace this hero"), and
nothing distinguishes a shell page from reviewed content on a deployed portal:
wave 85's defect 7 was a stakeholder meeting stamped placeholders live, and the
wave-86 audit reproduced the class. Separately, the hosted chat proxy has
wave-86 *mitigation* (caps, origin check, spend-cap doc) but no *access
control* — an enabled public chat still spends the operator's key up to its cap.

## Decision (proposed)

### Part 1 — page readiness states, mechanically enforced

1. **Three states in the page manifest** (`_meta/index.json` pages/slices):
   `shell` (as-stamped skeleton), `content-ready` (authored, not yet through
   Stage 4 fact-check), `stakeholder-ready` (fact-checked; zero placeholder
   markers; required metadata valid). The stamper writes `shell` on every page
   it creates; skills promote states as they do the work.

2. **`stakeholder-ready` is verified, not declared.** Promotion requires: no
   placeholder tripwire strings on the page ("Replace this hero", the
   CONVENTIONS placeholder set), page metadata complete, and the page's slice
   present in the manifest. A conformance reviewer owns the check; a hand-edited
   state that fails verification is a finding, not a state.

3. **Deployment intent decides severity.** `prep-deploy.sh` (and the deploy
   skill) take an explicit `--intent=preview|stakeholder`:
   - **preview/internal** + `shell` pages → WARN (listed, deploy proceeds);
   - **stakeholder** + ANY `shell` page → **BLOCK** (deploy refused; the list of
     unpromoted pages is the error message);
   - doctor reports the state census on every run either way.
   Enforcement lives in doctor + the deploy path — CONVENTIONS.md documents the
   contract but is not the enforcement (the audit's explicit condition).

### Part 2 — hosted-chat access control (supersedes the wave-86 interim posture)

4. **Chat stays default-off; enabling it on a stakeholder-intent deployment
   requires access control, not just caps.** The manifest gains
   `chat.access: 'off' | 'open-capped' | 'turnstile'`:
   - `off` (stamped default) — widget hidden, function rejects;
   - `open-capped` — wave-86 behavior, permitted for preview intent; on
     stakeholder intent it downgrades the deploy gate to WARN only when the
     OWNER-SPEC's spend-cap attestation line is present and current;
   - `turnstile` — widget solves a Turnstile challenge, function verifies the
     token server-side, plus a per-IP fixed-window rate limit in KV when a KV
     binding is provisioned (without KV: Turnstile only, documented).

5. **Provisioning is the consumer's, guided.** Turnstile widget + KV namespace
   are consumer-side resources; the stamper never provisions them. `blueprint
   doctor` recognizes each `chat.access` mode and verifies its preconditions
   (secret bound, sitekey present, KV binding named) instead of hoping.

## Consequences

Stakeholders can no longer meet skeletons: the wave-85 incident class gets a
blocking gate instead of a convention. The chat proxy's honest ceiling moves
from "spend cap" to "challenge + rate limit" where consumers opt in. Costs: a
manifest schema bump (CONVENTIONS v9), state-promotion friction in the skills
(deliberate — promotion IS the review), and a Turnstile/KV provisioning guide
the docs must carry.

## Rollout (on ratification)

(a) manifest states + stamper writes `shell`; (b) placeholder-tripwire
verification in the conformance reviewer; (c) `--intent` flag + gate in
prep-deploy/doctor; (d) `chat.access` modes + doctor precondition checks;
(e) smoke: stamped tree deploys as preview with WARN, refuses stakeholder
intent, and a promoted fixture passes. Freeze acknowledgment per wave; chrome
changes ride `restamp-chrome` as usual.
