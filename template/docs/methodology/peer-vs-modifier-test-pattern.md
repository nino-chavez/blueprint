# Peer-vs-modifier test: determining document structure when a third option emerges

**Status: canonical (wave 74).**

## The gap this closes

When analysis produces a third option to an existing binary choice, the default bias is to read it through the existing artifact — treating it as a modifier amendment to the existing doc. This compounds into invisible scope: strategy documents, ADRs, fork-aware priority rules, and roadmaps all inherit the binary's structure, and the new option keeps being squeezed into one of the existing lanes rather than being recognized as a structurally distinct peer. The result: a third lane that should have its own strategy doc instead lives as an amendment to the binary, making the peer status permanently ambiguous.

## The principle

When a third option emerges to a binary, the document structure is the durable expression of the peer-vs-modifier call. Enumerating the failure modes of all three options determines whether the new option is a peer (earns a sibling doc at the same directory depth) or a modifier (amends the existing doc).

## The test: failure-mode enumeration

For each of the three options, enumerate **failure modes** — concrete ways the option can go wrong. If the new option has a failure mode that neither of the two originals has, it is a **peer** and earns its own sibling document. If all its failure modes are already represented in the original binary, it is a **modifier** and amends an existing doc.

### Example from bc-subscriptions

The existing binary: Marketplace-first vs. Native-ready approaches to delivery. A third option emerged: using platform shims as a temporary bridge. The failure-mode test revealed:

- Marketplace-first failure modes: feature parity lag, marketplace discovery, vendor stability
- Native-ready failure modes: platform-team allocation, API cost of nativization, multi-merchant onboarding complexity
- Shim-collaborative failure modes: **shim deprecation path** (how to cleanly unwind platform asks once app matures) and **shim-vendor coupling** (the app becomes structurally dependent on a platform surface that could disappear)

The new failure modes were not present in either original, so shim-collaborative earns its own strategy doc (`docs/strategy/delivery-shim-path.md`) rather than amending `delivery-fork.md`.

### Corollary: fork-aware priority accepts new lanes

When a new lane is established (peer status confirmed), fork-aware priority tiebreaker rules must explicitly name it. If the original binary had "portable > substrate-A," the new three-lane tiebreaker becomes "portable > shim-collaborative > substrate-A" — or another ordering per the initiative's criteria. Silent omission of the new lane from priority rules is the failure mode this prevents.

## Applicability

**Trigger**: Any analysis thread produces a third option to an existing binary choice (two-fork decision suddenly has a third path).

**Gate**: Apply before advancing the new option through stakeholder review. The gate produces two artifacts: (1) the new peer doc or the amendment, and (2) an ADR or decision-fast proposal updating fork-aware priority if the peer status is confirmed.

**Tier**: T1 (substance decision, applies across tiers).

## What this is, in one line

When a third option emerges to a binary, enumerate failure modes of all three; new failure modes = peer (earn own doc), no new failure modes = modifier (amend existing doc).
