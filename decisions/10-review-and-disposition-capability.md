# Decision 10 — make review and disposition first-class; keep hosting adapter-owned

**Status:** Accepted 2026-07-23 after the Atelier convergence review and
three-history replay.

## Context

The refoundation session began by asking whether Film Room's failure was caused
by Claude, Blueprint, or both, and whether Blueprint was really a method for
steering agentic work.

Film Room exposed missing exact-candidate encounter and harness/operator
boundaries. Adaptive Commerce Content prospectively validated the headless
execution boundary, then exposed two additional gaps:

- a bespoke reader presentation was more useful than the automatically stamped
  generic portal; and
- the presentation invited review but offered no self-service capture,
  disposition, or return path.

Atelier independently attempted to become a general coordination substrate for
human and agent work. Its dashboard initiative explicitly rejected absorbing
Blueprint stage logic while promoting generic annotation, traceability,
presence, and triage primitives into Atelier ADR-057. ADR-018 preserved the
same authority rule the current session requires: external content never
auto-merges.

## Decision

Adopt the **Review and Disposition Loop** as a first-class Blueprint capability.

Blueprint owns:

- exact reviewed candidate;
- declared reader and outcome;
- review targets, asks, and authority;
- capture mode and adapter declaration;
- untrusted candidate-pinned submissions;
- disposition owner, state, rationale, and consequences;
- bounded automation policy; and
- return-to-reader receipt.

Blueprint does not own:

- a universal portal;
- a central feedback SaaS;
- identity, presence, or messaging transport;
- annotation coordinates or visual chrome; or
- automatic product acceptance.

Ship:

- `template/docs/methodology/review-disposition-loop.md`;
- the `blueprint-review-loop/1` contract and validator;
- `blueprint feedback` with optional `--gate`;
- optional doctor validation;
- Stage feedback recognition that delegates to the same semantic validator
  (directory presence cannot read green); and
- replay fixtures for Atelier, Film Room, and Adaptive Commerce Content.

## Why promotion is earned

The amendment convention treats similar findings in two or more initiatives as
strong promotion evidence. The pattern appears in three contrasting histories:

1. Atelier — generic self-service annotation and triage substrate;
2. Film Room — real exact-candidate feedback and disposition, mediated through
   a coding harness; and
3. Adaptive Commerce Content — bespoke reader artifact with declared questions
   but no capture adapter.

The promoted invariant is the shared semantic loop, not any one implementation.

## Honest limit

No current initiative has completed the entire desired combination:

- bespoke reader presentation;
- direct self-service capture;
- automated classification/proposed disposition;
- authority-safe application; and
- visible return to the reader.

The Adaptive Commerce Content review with Adam and the team is the prospective
test for that remaining combination. A hosted Cloudflare/D1 adapter remains a
candidate until then.

## Compatibility

The capability is opt-in. Existing Markdown feedback and triage continue to
satisfy Stage feedback gates. Existing consumers without
`review-contract.json` receive no new doctor finding. No portal renderer is
retired.

## Fleet and freeze

The pre-change fleet audit reported 15 registered consumers: five behind, ten
unpinned, and zero external consumers mid-migration. The template freeze was
not tripped.

## Consumer sync

No immediate restamp is required. Consumers author `review-contract.json` when
they next issue a human/team steering output and want the executable loop.

## Release boundary

This branch records the capability under `CHANGELOG.md` Unreleased. It does not
bump or publish the root package. The repository's established release path
versions the root package by hand because Changesets excludes a monorepo-root
package; `bin/release-if-unpublished.mjs` then publishes that exact version.
`npx changeset status` was run and reproduced the known root-package rejection,
so no ceremonial pending changeset is committed.
