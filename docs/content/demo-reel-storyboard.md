# Demo reel storyboard — /demo scene player

The portal route `/demo` (apps/portal) is an HTML scene player: it replays
REAL captured CLI transcripts with scripted typing/transitions, in two reels.
This doc is the contract the player implements — edit here first, then mirror
in `apps/portal/src/data/demo-scenes.ts`.

**Why HTML instead of a recorded video**: a recording rots the moment CLI
output changes, and this repo ships waves weekly. The player reads fixtures
captured from real runs (`apps/portal/scripts/capture-demo-fixtures.mjs` →
`src/data/demo-fixtures.json`); re-capture + re-record and the reel is current
again. The mp4 for social/decks is produced by screen-recording the autoplay
reel (`scripts/record-demo.mjs`), not by editing video.

**The no-fabrication rule**: terminal scenes replay captured output verbatim
(paths redacted, nothing else). The methodology's pitch is fact-checked
claims; a demo of Blueprint built on mocked CLI output fails its own gate.

## Scene types

| Type | Renders | Animation |
|---|---|---|
| `title` | kicker / headline / sub on an empty stage | fade+rise per line, stagger |
| `terminal` | macOS-style terminal chrome; types the command, streams the fixture's lines | typewriter (command), line-stream (output); outputs >28 lines burst-scroll; holds on `holdTail` lines |
| `stages` | the 7-stage pipeline ladder | stages light up sequentially with a check tick |
| `outro` | closing claim + install command | fade+rise |

Both reels share scene definitions; a scene lists which reels include it.

## Sizzle reel (autoplay — the social/deck cut; ~34s as recorded 2026-06-10)

| # | Scene | Fixture | Beat / caption |
|---|---|---|---|
| 1 | title | — | "AI-assisted projects move fast — and rot fast." / "Blueprint adds the checkpoints and the paper trail." |
| 2 | terminal | `init` | One command stamps a whole portal — burst-scroll the stamp report, end on `mechanical check: PASS` |
| 3 | stages | — | "Seven stages. Every gate enforced by a reviewer." |
| 4 | terminal | `review-list` | "The gates are executable — not a checklist in a wiki." (15 reviewers discovered) |
| 5 | terminal | `doctor-self` | "doctor is honest about what it didn't check." — the `not checked (by design)` block + `overall: PASS` |
| 6 | outro | — | "What ships is researched, prototyped, fact-checked, documented." + `npx @nino-chavez-labs/blueprint-cli init` |

## Deep walkthrough (stepped by default — the onboarding cut)

Adds the failure beats the sizzle omits. The fresh-stamp FAIL is the
centerpiece: gates with teeth, and the finding names the exact fix.

| # | Scene | Fixture | Beat / caption |
|---|---|---|---|
| 1 | title | — | same cold open |
| 2 | terminal | `init` | full stamp report, slower pace |
| 3 | terminal | `doctor-fresh` | a fresh stamp FAILS its own gate — placeholder content not yet replaced; honest state, named |
| 4 | terminal | `review-conformance-fresh` | the BLOCK finding in full: 12 files, the fix, the doc ref |
| 5 | stages | — | the pipeline those gates guard |
| 6 | terminal | `review-list` | reviewer discovery: canonical + org, shadowing rules |
| 7 | terminal | `review-stateful-claims` | the methodology gates itself — self-application PASS |
| 8 | terminal | `cost` | effort below anchor without `skip_justification` → BLOCKs at the step-6 gate |
| 9 | terminal | `fleet` | one registry classifies every consumer's drift |
| 10 | terminal | `upgrade-fresh` | terraform-plan style: dry-run by default, unpinned adopts the current release |
| 11 | terminal | `doctor-self` | the capstone green — including what it did NOT check |
| 12 | outro | — | same close |

## Player modes

- `?reel=sizzle|deep` — scene set (default sizzle).
- `?mode=auto|step` — autoplay vs click/keyboard advance (sizzle defaults
  auto, deep defaults step). No Play overlay — scenes are DOM animation, not
  media, so autoplay restrictions don't apply.
- `?record=1` — hides nav/controls chrome; the recording rig's stage.
- Deterministic pacing (fixed per-char/per-line delays, no randomness) so a
  recording is reproducible frame-for-frame.
- `prefers-reduced-motion`: typewriter/stream collapse to instant render.
- When the reel ends the player sets `window.__DEMO_DONE__ = true` — the
  recording script waits on it.

## Regeneration procedure (per wave, when CLI output changes)

1. `node apps/portal/scripts/capture-demo-fixtures.mjs` — re-capture transcripts.
2. Eyeball `/demo?reel=deep` — captions still match the output beats?
3. `node apps/portal/scripts/record-demo.mjs` — re-render the mp4/webm cut.
