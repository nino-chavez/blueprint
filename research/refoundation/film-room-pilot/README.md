# Film Room native-pilot packet

This directory preserves the second live consumer migration. It is
bound to the verified two-parent Film Room integration commit
`83d85fc92edcae2de323c5e7575cbd5acd0e385e`, not either parent and not the
older dirty release checkout.

The consumer change was applied in the in-repository worktree
`.worktrees/film-room-native-pilot` on branch
`codex/film-room-native-pilot`. The initial two-file commit is `b227625`; the
accepted-decision status follow-up is `5de85b0`; the first founder encounter
receipt is `0e89411`; and candidate-laundering hardening advances the preserved
native-pilot branch to `0db4285`.

The first isolated product repair lives on
`codex/film-room-first-run-entry-repair`: exact product commit `e1c21d9`
implements Decision 0012, semantic tip `c5ecf1e` adds candidate-specific tool
receipts, and evidence-only tip `5ec5398` preserves the second failed founder
encounter.

The second isolated repair lives on `codex/film-room-native-ingest-repair`:
exact product commit `5cc4fd2` implements Decision 0013, and semantic tip
`2a72970` advances active claims to that product. Evidence-only tip `0cd7aef`
then preserves real folder-panel success plus the manual-operator-config
founder contradiction.

The third isolated repair lives on
`codex/film-room-operator-config-onboarding`: exact product commit `5496edd`
implements Decision 0014. Semantic tip `ada6cf6` advances active claims while
preserving all 17 earlier receipts; in-progress encounter tip `a370647` adds
only the exact native-window recovery support receipt and leaves founder
operation open. Film Room `main`, the integration branch, and the native-pilot
branch remain unchanged.

After a separate Film Room Steering UX program completed with Blueprint frozen,
exact product `acbc2d0` was promoted to Film Room `origin/main`. Blueprint
observation resumed on isolated branch
`codex/film-room-blueprint-observation-acbc2d0`; semantic tip `9c22428` changes
only `blueprint-native.yml` plus Decision 0019 relative to that exact product.
Historical receipt blocks remain preserved and the replacement native/founder
claims are open. The app was opened at Ingest, but operator feedback and the
uninterrupted event were explicitly deferred, so no outcome receipt exists.

Later Film Room product candidate `463bf0b` is outside this packet. It inherits
no `acbc2d0` evidence and requires separate observation authorization.

The consumer change contains exactly:

- `proposed-blueprint-native.yml` → `blueprint-native.yml`; and
- `proposed-decision-0011.md` →
  `decisions/0011-native-blueprint-pilot.md`.

The native contract separates file/program presence, exact unsigned package
inspection, packaged-process startup, native-window observation, the current
visual matrix, launch information, signing/notarization, support authority,
founder operation, and second-operator activation. The committed derived view
shows:

- native migration boundary: satisfied;
- legacy actor-output clean-clone view: contradicted by absent gitignored
  account state plus two issued artifacts, with three human-validation pendings
  retained;
- exact operator-onboarding entry and unsigned package inspection: satisfied;
- exact operator-onboarding native window: satisfied;
- exact operator-onboarding full current-candidate matrix: contradicted;
- exact operator-onboarding launch information: open;
- founder-operated readiness: open for exact `5496edd`, while the `83d85fc`,
  `e1c21d9`, and `5cc4fd2` encounters remain contradicted; and
- assisted-beta readiness: contradicted.

The consumer write is not a product-readiness claim. It changes no Film Room
runtime or legacy contract and creates no generated consumer artifact. The
post-commit shadow is K1-valid with zero errors and warnings.

Completed application proof:

1. the proposal compiled and shadowed against exact `83d85fc`;
2. the live consumer files compiled and shadowed again after commit;
3. every expected checkpoint and claim ceiling matched;
4. `git diff --check` passed;
5. every tracked path outside the two pilot files was byte-identical to
   `83d85fc`;
6. the legacy actor-output gate retained exactly three clean-clone path errors
   and three human-validation pendings;
7. the Film Room worktree finished clean with no extra untracked or ignored
   state; and
8. the branch was pushed without a pull request or mutation of `main`; and
9. the first live founder encounter was appended as a contradictory receipt
   without changing product code or the two-path rollback surface;
10. all candidate-sensitive historical claims and receipts were pinned to
    exact `83d85fc` before the repair;
11. exact `e1c21d9` passed staged entry, package, and packaged-process
    verification; and
12. semantic tip `c5ecf1e` keeps the replacement native-window and founder
    claims open for fresh observation;
13. the second encounter contradiction is preserved at `5ec5398`;
14. Decision 0013 fixes normal launch, dynamic-loopback dialog capability, and
    visible picker recovery at `5cc4fd2`; and
15. semantic tip `2a72970` leaves the real native window and founder outcome
    open for fresh observation;
16. exact `5cc4fd2` real folder selection passes but Analyze's manual
    operator-config prerequisite contradicts founder operation at `0cd7aef`;
17. Decision 0014 repairs the setup-readiness and in-app provisioning boundary
    at `5496edd`; and
18. semantic tip `ada6cf6` leaves its native and founder outcomes open for a
    fresh encounter; and
19. keyboard Back restores the preserved draft and Analyze starts, satisfying
    the native recovery boundary at `a370647` while founder completion stays
    open; the missing visible return and misleading confirmation remain a
    usability finding.

Semantic rollback is append-only under Decision 0011. Mechanical branch removal
is an additional escape hatch, not a way to erase the migration evidence.
