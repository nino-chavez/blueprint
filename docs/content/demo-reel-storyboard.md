# Demo storyboard — /demo scene player (job-ordered rebuild)

The portal route `/demo` (apps/portal) plays two cuts from one scene script.
This doc is the contract the player implements — edit here first, then mirror
in `apps/portal/src/data/demo-scenes.ts`.

**v2 (2026-06-10): rebuilt job-first.** v1 was a feature tour of the CLI's
operations layer — terminal scene after terminal scene, no artifacts, the job
never on screen. The rebuild follows an IDEA through the pipeline: what you
type, what the agent produced, what the gate said, what ships. The spine is
the self-application (the initiative that productized Blueprint itself),
because it's the one initiative whose artifacts are public and checkable.

## The three no-fabrication rules

1. **Terminal scenes replay captured CLI transcripts** verbatim (paths
   redacted, nothing else) — `scripts/capture-demo-fixtures.mjs` →
   `src/data/demo-fixtures.json`. Re-capture per wave; the demo re-renders.
2. **Artifact scenes quote real repo files** with their path on the pane and
   trims marked `…` (sources: `blueprint.yml`, `research/00-recon-synthesis.md`,
   `decisions/01-prescription.md` — re-verify quotes when those files change).
3. **Prompt scenes show only what you type** (`/blueprint-research`). The
   agent's response is never invented — the artifact scene that follows IS
   the response, as it actually landed in the repo.

A demo of a fact-checking methodology built on mocked output fails its own
gate; these rules are the reason an HTML demo can be honest where a produced
video drifts.

## Design tests (from the mom-test log, `docs/content/validation-script.md`)

- **D. — casual visitor (A1 disconfirmed):** can she say what Blueprint is
  after the sizzle *without parsing monospace*? Captions carry the story in
  plain language; terminal scenes are spectacle (the stamp burst, the green
  capstone), not required reading. Receipts beat is prose cards, not CLI.
  **Jargon rule:** the CLI on screen may say `pattern=A` / `variant` / `tier`
  — the fixture is verbatim — but the CAPTION must translate every such term
  the first time it appears (pattern = full project site vs lighter
  redesign review; variant = new idea vs existing app; tier = deliverable
  depth). Sizzle captions carry no config keys at all. A term neither
  translated nor self-evident is a defect (2026-06-10 operator finding:
  "pattern-a … even I don't know what that maps to").
- **R. — incumbent personal loop ("hard part is team alignment"):** does the
  walkthrough show the team seam, not just a better kitchen? The fleet beat
  is framed as "every project on one pinned methodology — alignment checked,
  not hoped," and the gates are presented as a *shared* definition of done.
- **V. — artifact reviewer ("solo cycle is demo, not prod"):** does it show
  evidence and where humans sign off? Artifact scenes show `grounded_by` /
  evidence-path structure; the fact-check beat says agent gates LAYER UNDER
  team sign-offs (PM/Eng), citing the governance doc's position.

## Scene types

| Type | Renders | Honesty source |
|---|---|---|
| `title` | kicker / headline / sub | — |
| `terminal` | terminal chrome; types command, streams fixture lines (burst >28) | captured transcript |
| `prompt` | Claude Code pane; types skill invocation(s), no response shown | what you'd type |
| `artifact` | file pane: path + stage badge + "real file · this repo" + excerpt | quoted repo file |
| `receipts` | three prose proof cards, staggered | summarizes real artifacts |
| `stages` | 7-stage ladder lighting up | homepage stage list |
| `outro` | claim + install command + /learn + /inspect links | — |

## Sizzle (autoplay, ~35s — the attention-budget cut)

Job arc: idea → workspace → receipts → gates → ship.

| # | Scene | Beat |
|---|---|---|
| 1 | title | "You have an idea." / "An agent can build it fast. Fast isn't the problem — proof is." |
| 2 | terminal `init` | the workspace materializes (burst-scroll spectacle); caption says what it is in plain words |
| 3 | receipts | "The agent does the work. Blueprint keeps the receipts." — research / decisions / fact-check cards |
| 4 | terminal `doctor-self` | the honest green: what it didn't check is on record |
| 5 | stages | "Seven stages. A gate between each." |
| 6 | outro | "Ship work that holds up." + install + tutorial/receipts links |

## Deep walkthrough (stepped — the "how would I use this with MY idea" cut)

Job-ordered: each beat is (what you do) → (what landed) → (what the gate said).

| # | Scene | Beat |
|---|---|---|
| 1 | title | everything here is real; the initiative shown productized Blueprint itself |
| 2 | terminal `init` | day zero — stamp the workspace (existing app = `variant: brownfield`) |
| 3 | artifact `blueprint.yml` | stage 0: name the pain before any work; pilot profile is a gate |
| 4 | prompt `/blueprint-research` | stages are skills; the agent fans out |
| 5 | artifact `research/00-recon-synthesis.md` | what landed: method + findings + evidence paths (6 agents, ~612k tokens) |
| 6 | terminal `review-research-fresh` | skip ahead → the gate names what's missing; done is defined |
| 7 | artifact `decisions/01-prescription.md` | decisions cite their research (`grounded_by`) and what they authorize (`informs`) |
| 8 | prompt `/blueprint-prototype` `/blueprint-docs` | prototype tests the decision, docs capture the rationale |
| 9 | terminal `review-stateful-claims` | fact-check is a stage; agent gates layer under team sign-offs |
| 10 | terminal `doctor-fresh` | ship gate BEFORE the work: placeholders FAIL |
| 11 | terminal `doctor-self` | ship gate AFTER: honest green — this site deploys from it |
| 12 | stages | the pipeline you just walked |
| 13 | terminal `fleet` | the team seam: one pinned methodology across every project |
| 14 | outro | your turn: install + /learn tutorial + /inspect receipts |

Known-honest gap: the self-app itself currently BLOCKs
`research-completeness-reviewer` (its research predates the leg-directory
convention), so the walkthrough never claims that gate passes — the
before/after teeth arc uses `doctor` (fresh FAIL → self PASS), which is true.

## Player modes

- `?reel=sizzle|deep` — scene set (default sizzle).
- `?mode=auto|step` — sizzle defaults auto, deep defaults step. No Play
  overlay — scenes are DOM animation, not media; autoplay restrictions
  don't apply.
- `?record=1` — hides nav/controls chrome; the recording rig's stage.
- Deterministic pacing (fixed delays, no randomness) → reproducible recording.
- `prefers-reduced-motion`: typewriter/stream collapse to instant render.
- Reel end sets `window.__DEMO_DONE__ = true` — the recording script waits on it.

## Regeneration procedure (per wave, when CLI output or quoted files change)

1. `node apps/portal/scripts/capture-demo-fixtures.mjs` — re-capture transcripts.
2. Re-verify the three artifact excerpts in `demo-scenes.ts` against their sources.
3. Eyeball `/demo?reel=deep` — captions still match the beats?
4. `node apps/portal/scripts/record-demo.mjs` — re-render the webm cut
   (`ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4` for socials).
