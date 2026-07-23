# Film Room steering assessment

## Governing intent and scope ceiling

The current intent is to prepare one assisted design-partner beta in which an independent second operator, on a supported clean workstation, installs a signed package and reaches first value without developer intervention. Scheduled operator support is allowed. Payment, commercial validation, self-service distribution, and a public self-service launch remain outside the charter.

The evidence supports neither a single global “ready” nor a single global “not ready” label. Distribution programs are present and the actor-output structure has no blocking error; the signed-package and actor-outcome boundaries remain open. Therefore the `assisted-beta-ready` checkpoint is not satisfied.

## Boundary states

| Boundary | Precise state | Exact supporting evidence | What that evidence cannot prove |
|---|---|---|---|
| founder live workflow | **Open — no claim-compatible observed-task-run receipt.** | `docs/event-day-runbook.md` identifies itself as a “Founder-pilot record” and says it was written after a three-real-clip, scratch-database dress rehearsal with ingest → analyze → review → render green in 49 seconds. `docs/launch/readiness-plan.md` consequently labels the legacy founder-pilot level “Proven” from real-event throughput and output. But neither file records an observer, a dated encounter ledger, the maintainer explicitly acting as operator, or a run against the current source boundary. `research/current-state/2026-07-21-letspepper-workflow-encounter.md` is an observation of a separate Let's Pepper workflow, not a Film Room founder run. | A runbook, output, or legacy lifecycle label cannot establish the governing claim's required observed task run. The rehearsal also cannot prove a current full-event run, absence of `/classic` fallback, or operation through the packaged release. |
| distribution artifacts | **Satisfied — artifact-existence boundary only.** | A direct file check found all four declared artifacts: `apps/shell/release-profile.yml` (953 bytes), `apps/shell/scripts/build-release.sh` (830 bytes), `apps/shell/scripts/sign-notarize.sh` (4,775 bytes), and `apps/shell/scripts/verify-bundle.py` (3,400 bytes). Their contents respectively declare the release payload, stage/build the unsigned app, sign/notarize/staple the app and DMG, and verify staged payload/runtime/compliance. | Presence and plausible implementation do not prove that the programs ran successfully on this source snapshot, that credentials exist, or that a signed package was produced or inspected. |
| signed/package-inspection boundary | **Open — only unsigned and audit-package evidence exists.** | `docs/launch/receipts/distribution/2026-07-22-unsigned-sample-package.md` records a pass only for an unsigned `.app`; its trust section says the signature is ad hoc, `TeamIdentifier` is unset, `spctl` does not accept it, and there is no Developer ID signature, notarization ticket, DMG, or Gatekeeper claim. `docs/launch/receipts/distribution/2026-07-22-audit-app.md` explicitly marks its app ineligible for distribution. `docs/launch/known-issues-0.1.md` says no Developer ID/notarization receipt, signed app, DMG, stapling receipt, or Gatekeeper cold-install receipt exists. | The unsigned bundle verifier and audit app cannot prove the contents, signature chain, notarization/stapling, Gatekeeper acceptance, or identity of a current signed assisted-beta package. |
| second-operator first value | **Dependency-blocked and unobserved.** | The governing contract makes this claim depend on clean signed-package inspection. `docs/launch/cold-install-receipt.md` is an unfilled template: build identity, operator, observer, timings, interventions, and verdict are blank. `tests/visual/receipts/first-run-sample.json` passes the exact staged browser path, but names itself browser rather than native-package evidence. `docs/launch/receipts/visual-system/2026-07-22-release-transform.md` explicitly excludes native Tauri/WebKit, a signed app/DMG, Gatekeeper, clean-account install, and uncoached second-operator comprehension. | Tests, screenshots, an unsigned package, and a scripted browser walk cannot prove that an independent operator installed the signed product, reached useful output, recovered from an error, or did so without developer intervention. |
| current contract/gate health | **Structurally satisfied with zero blocking errors; actor-output outcome view remains `PENDING`.** | Running `npm run manifest:gate` on the frozen checkout returned `PENDING (route actor-output; 0 errors, 3 pending, 0 warns)`. The three pendings are human validation for `provenance-portal`, `scope-decision-aid`, and `event-delivery-report`, matching the pending assurance fields in `actor-output.yml`. The generated `derived/boot-packet.json` is stale (`as_of: 9620a60`) relative to current HEAD and was not used as current proof. | Zero structural errors proves that the current actor-output manifest resolves without a blocking structural error. It does not prove the three human outcomes, founder operation, package trust, or second-operator first value; those launch claims are not cleared by this gate. |

## Highest-leverage next move

The maintainer/release owner should create and inspect one exact, current, sample-inclusive signed candidate: run the existing release build, sign nested code and the app with a Developer ID Application identity, notarize and staple the app and DMG, rerun payload/source/sample verification against the post-sign candidate, record `codesign`, notarization, stapler, and Gatekeeper results, and attach the exact app/DMG hashes in a dated package-inspection receipt.

The maintainer or a delegated credentialed signer can supply this evidence on supported macOS; Apple notary/Gatekeeper results and the repository's bundle verifier supply the mechanical observations. This is the highest-leverage move because it closes the immediate dependency for the independent second-operator encounter. The second operator must still supply their own later first-value evidence; the signer cannot supply it for them.

## Work that should explicitly not happen next

- Do not invite the second operator or call the assisted beta ready before the exact signed candidate passes package inspection.
- Do not promote the unsigned app, audit app, browser simulation, validator pass, or output status label into evidence of signing, Gatekeeper acceptance, or a human outcome.
- Do not build payment, account, public marketing/download, self-service distribution, telemetry, or scalable support; those exceed the current ceiling.
- Do not add more AI or unrelated product features. The missing evidence is at the package and operator boundaries, not in feature count.
- Do not spend the next move merely regenerating stale derived views. The live structural gate already reports its state, and regeneration would not close a package or human receipt.

## Uncertainties and missing observations

- No compatible founder observed-task-run receipt identifies observer, source/package identity, full task, fallback use, or outcome.
- No current signed package identity, DMG hash, Developer ID identity, notarization/stapling result, Gatekeeper result, or post-sign content inspection is recorded.
- No independent second operator, supported clean-machine identity, elapsed-time record, wrong-turn/intervention log, recovery result, real-output result, or verdict is recorded.
- Native packaged startup/resize/lifecycle, screen-reader, actual 200% zoom, and live running/resume observations remain open according to the visual-system receipt.
- `docs/launch/known-issues-0.1.md` says the real human support address and response expectations are not designated, even though scheduled support is part of the current beta model.
- Compatibility performance/storage measurements on the exact candidate and design-partner event are absent.
- The actor-output gate's three pending human validations concern other declared outputs; its clean structure is orthogonal to the launch-package claims assessed here.

## Snapshot integrity

Assessment valid. Initial and final checks both observed HEAD `7ed37ae6bb49f72233aacbf16c078c60915b3d85` and dirty fingerprint `bd71e8c69200d1446e3a63aef29ddbbac068e8c00f8a96675a91916f3e8c77bf`. No Film Room writes were performed.
