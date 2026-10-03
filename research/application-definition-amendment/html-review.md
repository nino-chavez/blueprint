---
canonical: false
status: rfc-accepted-implementation-pending
date: 2026-10-03
---

# HTML review kit

The standalone review page explains the proposed amendment and links to RFC #65. The visual review below predates filing. It does not file, accept, implement, or deploy the amendment. The source proposal, contract, checker, fixture, controls, and consumer files were not changed by the HTML work.

## What changed after production

The parent added the fixture's denied visitor journey, expanded BRD/PRD on first use, linked the actual RFC issue draft, shortened section headings, and distinguished current gate coverage from the proposed sequence. Keyboard testing then showed the skip link did not move focus into the main content. Adding `tabindex="-1"` to the main element fixed that failure; the same test then passed.

## Rendered and behavior checks

- Parent inspected the page in the in-app browser and opened desktop and phone captures directly. The missing-journey control visibly changed its selected state and result.
- Owned `template/tools/web-capture/capture.mjs` captured 1280px desktop, 390px phone, 320px reflow, and desktop with a dark system setting. All reached the footer, had the expected image dimensions, and reported no horizontal overflow or unloaded images. Phone captures were stitched from two segments. The page intentionally stays light. Named fonts use local system fallbacks; no fonts or other assets are fetched externally.
- Capture-tool self-test: 11 of 12 controls passed. The current Chromium 148 run did not reproduce the old tall single-shot wrap defect, so that particular negative control failed. Segmented capture and its size/wrap checks passed. No template/tool change was made. Parent and reviewer inspected sequential crops through the footer as a separate completeness check.
- `node research/application-definition-amendment/verify-html.mjs` passed all local-file/heading-link checks, all five keyboard-operated scenarios, one-selected-control checks, remedy presence, skip-link focus, print-media control hiding, and script/asset error checks. This checks print CSS behavior, not printed pagination or a physical printout.
- Whole-page captures and their sequential crops in `captures/review/` predate the focusability fix and RFC filing-status update. The blocked-control crop is refreshed by the behavior check. `html-checks.json` records the latest behavior check; the older frames do not verify the newer filing banner.
- No physical phone or screen-reader session was run. The browser illustration does not execute the research checker.

## Independent cold read

The read-only reviewer received only the rendered captures and the reader's job. Its raw result is `html-cold-review.md`. It correctly read the decision as reviewing a proposed RFC for filing, with no implementation approval, and found no blocking clarity issue. The parent's check of the worker's actual tool calls confirmed image inspection of all requested crops, not just its claim to have opened them.

The parent did not adopt two optional suggestions. Active-section navigation would not help the current non-sticky header during a long scroll. The suggested immediate result change and selected-state cue already exist; the parent observed the interaction, and the keyboard tests verify selection and result together. Static frames could not establish that behavior for the reviewer.

## Publication and preservation

The production output was integrated into the amendment checkout, then reviewed and corrected as described above. Private dispatch records and the original output archive remain local. They record requested model routes but no observed runtime identity, so this report makes no model-verification claim.

The public package includes the final sources, the reviewed captures and the check receipts. Publishing this research does not adopt the proposed gate or authorize its implementation.

## Filing update — 2026-10-03

The owner requested the next step after reviewing the local kit. [RFC #65](https://github.com/nino-chavez/blueprint/issues/65) is now filed with the amendment label. Its public body was read back and matched to the prepared text. The earlier review above records the state before filing. The issue is awaiting maintainer acceptance; no shared gate, consumer, implementation, commit, push, or deployment changed. The HTML status and links now point to the filed issue.

## Reproducing the checks

From the repository root, run `node research/application-definition-amendment/probe.mjs` for the dependency-free synthetic controls. The optional HTML check is `node research/application-definition-amendment/verify-html.mjs`; it requires Playwright and its Chromium browser installed in the local environment. Playwright is not a declared root dependency. The check writes `html-checks.json` and the blocked-control capture.

## Acceptance update — 2026-10-03

Nino approved the RFC after publication. The current page reports the accepted scope and phase structure, links the approval receipt, and identifies pilot setup as the next step. The earlier rendered reviews and filing receipt remain historical; they do not show this later status copy. No gate logic or layout changed.
