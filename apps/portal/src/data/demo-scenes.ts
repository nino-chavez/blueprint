/**
 * Demo reel scene script — the data half of /demo.
 *
 * Mirrors docs/content/demo-reel-storyboard.md (edit the storyboard first,
 * then this). Terminal scenes replay fixtures captured from REAL CLI runs
 * (scripts/capture-demo-fixtures.mjs → demo-fixtures.json) — never inline
 * fabricated output here.
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
  /** Which reels include this scene; deep is a superset of sizzle. */
  reels: Reel[];
  /** Caption shown under the stage while the scene plays. */
  caption?: string;
}

export type Scene = SceneBase &
  (
    | { type: 'title'; kicker: string; headline: string; sub?: string }
    | { type: 'terminal'; fixture: string; /** ms to dwell on the finished transcript (auto mode) */ holdMs?: number }
    | { type: 'stages' }
    | { type: 'outro'; headline: string; sub: string; command: string }
  );

export const SCENES: Scene[] = [
  {
    type: 'title',
    reels: ['sizzle', 'deep'],
    kicker: 'blueprint',
    headline: 'AI-assisted projects move fast — and rot fast.',
    sub: 'Blueprint adds the checkpoints and the paper trail.',
  },
  {
    type: 'terminal',
    reels: ['sizzle', 'deep'],
    fixture: 'init',
    caption: 'One command stamps a whole portal — validated against the variant × tier matrix.',
    holdMs: 2600,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'doctor-fresh',
    caption: 'A fresh stamp fails its own gate — placeholder content, named. Gates have teeth.',
    holdMs: 3600,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'review-conformance-fresh',
    caption: 'The finding in full: the 12 files, the exact fix, the doc reference.',
    holdMs: 4200,
  },
  {
    type: 'stages',
    reels: ['sizzle', 'deep'],
    caption: 'Seven stages. Every gate enforced by a reviewer.',
  },
  {
    type: 'terminal',
    reels: ['sizzle', 'deep'],
    fixture: 'review-list',
    caption: 'The gates are executable — not a checklist in a wiki.',
    holdMs: 2800,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'review-stateful-claims',
    caption: 'The methodology gates itself — Blueprint is its own first consumer.',
    holdMs: 2800,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'cost',
    caption: 'Effort below anchor without justification BLOCKs at the gate — spend is a dial, not a vibe.',
    holdMs: 3600,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'fleet',
    caption: "One registry classifies every consumer's drift from the methodology.",
    holdMs: 3600,
  },
  {
    type: 'terminal',
    reels: ['deep'],
    fixture: 'upgrade-fresh',
    caption: 'Terraform-plan style: dry-run by default, --apply to write.',
    holdMs: 3200,
  },
  {
    type: 'terminal',
    reels: ['sizzle', 'deep'],
    fixture: 'doctor-self',
    caption: "doctor is honest about what it didn't check.",
    holdMs: 3600,
  },
  {
    type: 'outro',
    reels: ['sizzle', 'deep'],
    headline: 'What ships is researched, prototyped, fact-checked, documented.',
    sub: 'MIT · on npm · Blueprint is its own first consumer.',
    command: 'npx @nino-chavez-labs/blueprint-cli init',
  },
];

export function reelScenes(reel: Reel): Scene[] {
  return SCENES.filter((s) => s.reels.includes(reel));
}
