/**
 * Demo scene script — the data half of /demo.
 *
 * Mirrors docs/content/demo-reel-storyboard.md (edit the storyboard first,
 * then this). Job-ordered, not feature-ordered: the walkthrough follows an
 * idea through the pipeline — what you type, what the agent produced, what
 * the gate said — using the self-application as the spine, because it's the
 * one initiative whose artifacts are public and checkable.
 *
 * Two no-fabrication rules:
 *  - terminal scenes replay fixtures captured from REAL CLI runs
 *    (scripts/capture-demo-fixtures.mjs → demo-fixtures.json);
 *  - artifact scenes quote REAL files in this repo (path on the pane;
 *    trims marked with …). prompt scenes show only what YOU type — never
 *    invented agent output.
 */
import fixturesJson from './demo-fixtures.json';

export type Reel = 'sizzle' | 'deep';

export interface Fixture {
  command: string;
  exitCode: number;
  durationMs: number;
  lines: string[];
}

const FIXTURES = (fixturesJson as { fixtures: Record<string, Fixture> }).fixtures;

export function fixtureFor(id: string): Fixture {
  const f = FIXTURES[id];
  if (!f) throw new Error(`demo fixture '${id}' missing — re-run scripts/capture-demo-fixtures.mjs`);
  return f;
}

/** The seven-stage pipeline, same public framing as the homepage grid. */
export const STAGES: ReadonlyArray<readonly [string, string]> = [
  ['Research', 'competitive analysis, codebase, comparables'],
  ['Design', "define scope — what the prototype will and won't do"],
  ['Prototype', 'HTML pages matching the real product'],
  ['Fact-check', 'every claim validated against source'],
  ['Document', 'strategy, feasibility, integration plans'],
  ['Deploy', 'one portal — docs + prototype + chat'],
  ['Iterate', 'stakeholder feedback, triaged'],
] as const;

interface SceneBase {
  /** Which reels include this scene; deep is the teaching cut. */
  reels: Reel[];
  /** Caption shown under the stage — carries the teaching, so panes stay clean. */
  caption?: string;
}

export type Scene = SceneBase &
  (
    | { type: 'title'; kicker?: string; headline: string; sub?: string }
    | { type: 'terminal'; fixture: string; /** auto-mode dwell on the finished transcript */ holdMs?: number }
    | { type: 'prompt'; commands: string[] }
    | { type: 'artifact'; path: string; stage: string; excerpt: string }
    | { type: 'receipts'; cards: { title: string; line: string }[] }
    | { type: 'stages' }
    | { type: 'outro'; headline: string; sub: string; command: string }
  );

// Real-file excerpts (trims marked with …). Sources verified 2026-06-10:
// blueprint.yml (root), research/00-recon-synthesis.md, decisions/01-prescription.md.
const EXCERPT_BLUEPRINT_YML = `project:
  name: "blueprint-platform"
  product: "Blueprint methodology"

pilot_profile:
  pain_point: "A team that wants to run initiatives with
    Blueprint cannot adopt it without re-deriving shape from
    a single operator's machine … so adoption stalls at
    'read METHODOLOGY.md and hope.'"
  walkthrough_citation: "research/00-recon-synthesis.md"`;

const EXCERPT_RECON = `method: 6-agent recon workflow
        (5 parallel domain readers + 1 synthesis)
…
6 agents, ~612k tokens, 102 tool uses.

### 1. Self-application (blueprint-redesign)
- ADR-0001 is a one-way invocation-surface decision, NOT a
  bidirectional update channel. … Updates are unidirectional:
  consumers PULL via \`blueprint upgrade\`.
- Evidence: blueprint-redesign/decisions/
  {ADR-0001,ADR-0002,01-prescription}.md`;

const EXCERPT_PRESCRIPTION = `stage: 2
grounded_by: "research/01-canonical-research.md
              (Stage 1 canonical-pattern research)"
informs:
  - "ADR-0003 cost/effort dial"
  - "ADR-0005 bidirectional non-breaking update protocol"
  - "ADR-0006 native extensibility (org-authored reviewers)"
  …
ratified_by: "pending — first non-Nino team consumer"`;

export const SCENES: Scene[] = [
  // ── cold open ──────────────────────────────────────────────────────────
  {
    type: 'title',
    reels: ['sizzle'],
    kicker: 'blueprint',
    headline: 'You have an idea.',
    sub: 'The agent builds fast. Blueprint keeps the receipts.',
  },
  {
    type: 'title',
    reels: ['deep'],
    kicker: 'the deep walkthrough',
    headline: 'Run a real idea through Blueprint.',
    sub: 'Everything here is real: the initiative shown is the one that productized Blueprint itself, and every artifact is a file in its public repo.',
  },

  // ── day zero: stamp ────────────────────────────────────────────────────
  // One scene, two captions: the sizzle stays jargon-free; the deep cut
  // translates each flag the viewer just watched being typed.
  {
    type: 'terminal',
    reels: ['sizzle'],
    fixture: 'init',
    caption: 'One command sets up the whole workspace: research, decisions, prototype, and a shareable project site. Works for a new idea or an existing app.',
    holdMs: 2600,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'init',
    caption: 'Day zero — one required flag, and every default is echoed back. The choices you can override: new idea or existing app (variant), how deep the deliverables go (tier), full project site or lighter redesign review (pattern).',
    holdMs: 3400,
  },

  // ── stage 0: the config IS the contract ────────────────────────────────
  {
    type: 'artifact',
    reels: ['deep'],
    path: 'blueprint.yml',
    stage: 'stage 0 · pilot profile',
    excerpt: EXCERPT_BLUEPRINT_YML,
    caption: 'Before any work: name the pain and who feels it. The pilot profile is a gate, not paperwork — the next stage is blocked without it.',
  },

  // ── stage 1: research, then its gate ───────────────────────────────────
  {
    type: 'prompt',
    reels: ['deep'],
    commands: ['/blueprint-research'],
    caption: 'Each stage is a Claude Code skill. The agent fans out — you review what lands.',
  },
  {
    type: 'artifact',
    reels: ['deep'],
    path: 'research/00-recon-synthesis.md',
    stage: 'stage 1 · what landed',
    excerpt: EXCERPT_RECON,
    caption: 'Findings with evidence paths and the method on record — not vibes. This file is in the repo today.',
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'review-research-fresh',
    caption: "Try to skip ahead and the gate names exactly what's missing — 'done' is defined for every stage.",
    holdMs: 4200,
  },

  // ── the receipts, compressed (sizzle's plain-language proof beat) ──────
  {
    type: 'receipts',
    reels: ['sizzle'],
    caption: 'The agent does the work. Blueprint keeps the receipts.',
    cards: [
      { title: 'Research', line: '6-agent recon, ~612k tokens — findings with evidence paths' },
      { title: 'Decisions', line: 'ADRs that cite the research grounding them' },
      { title: 'Fact-check', line: 'every claim checked against source before ship' },
    ],
  },

  // ── stages 2–5: decide, build, document, fact-check ────────────────────
  {
    type: 'artifact',
    reels: ['deep'],
    path: 'decisions/01-prescription.md',
    stage: 'stage 2 · the decision record',
    excerpt: EXCERPT_PRESCRIPTION,
    caption: 'Decisions cite the research that grounds them and the ADRs they authorize. The paper trail is structural, not voluntary.',
  },
  {
    type: 'prompt',
    reels: ['deep'],
    commands: ['/blueprint-prototype', '/blueprint-validate', '/blueprint-docs'],
    caption: 'The prototype tests the decision, fact-check gates it, the docs capture the rationale — validate sits between build and write-up.',
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'review-stateful-claims',
    caption: "Fact-check is a stage, not a hope: claims are checked against the source. These are automated checks — your team's sign-offs (PM, Eng) sit on top.",
    holdMs: 3000,
  },

  // ── the ship gate, before and after ────────────────────────────────────
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'doctor-fresh',
    caption: 'The ship gate, before the work: a workspace full of placeholder pages FAILS. You cannot share a site of stubs.',
    holdMs: 3600,
  },
  {
    type: 'terminal',
    reels: ['sizzle', 'deep'],
    fixture: 'doctor-self',
    caption: "The same gate after the work: honest green — what it did NOT check is on record. This site deploys from that green.",
    holdMs: 3600,
  },

  // ── the map, now earned ────────────────────────────────────────────────
  {
    type: 'stages',
    reels: ['sizzle', 'deep'],
    caption: "Seven stages. A gate between each — work doesn't advance until it passes.",
  },

  // ── the team seam ──────────────────────────────────────────────────────
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'fleet',
    caption: "One report across every project running Blueprint: who's current, who's fallen behind. Team alignment is checked, not hoped.",
    holdMs: 3600,
  },

  // ── do ─────────────────────────────────────────────────────────────────
  {
    type: 'outro',
    reels: ['sizzle', 'deep'],
    headline: 'Ship work that holds up.',
    sub: 'This site is Blueprint output — its receipts are public.',
    command: 'npx @nino-chavez-labs/blueprint-cli init --name=my-initiative',
  },
];

export function reelScenes(reel: Reel): Scene[] {
  return SCENES.filter((s) => s.reels.includes(reel));
}
