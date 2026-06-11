#!/usr/bin/env node
/**
 * capture-demo-fixtures — record REAL blueprint CLI output as demo fixtures.
 *
 * The /demo scene player replays these transcripts; it never fabricates CLI
 * output (the methodology's pitch is fact-checked claims — a demo built on
 * mocked terminal output would fail its own gate). Re-run this script whenever
 * CLI output changes; the demo re-renders from the new fixtures.
 *
 *   node scripts/capture-demo-fixtures.mjs
 *
 * Writes src/data/demo-fixtures.json. The only mutation applied to captured
 * output is PATH REDACTION (machine-local absolute paths → stable display
 * paths) so fixtures are commit-safe; every line is otherwise verbatim.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const portalRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(portalRoot, '..', '..');
const cli = join(repoRoot, 'bin', 'blueprint.mjs');

const scratch = mkdtempSync(join(tmpdir(), 'bp-demo-'));
const target = join(scratch, 'field-guide');
mkdirSync(target);

// Display command = the real argv rendered in the npx form (derived, not
// hand-written: a hand-trimmed display drifts into showing a command that
// would FAIL if a viewer typed it — the init stamper requires every flag).
const NPX = 'npx @nino-chavez-labs/blueprint-cli';
function displayFor(argv) {
  return [NPX, ...argv.slice(1)]
    .map((a) => redact(a))
    .map((a) => (/[ ]/.test(a) ? a.replace(/^(--[^=]+=)(.*)$/, '$1"$2"') : a))
    .join(' ');
}
const SCENARIOS = [
  {
    id: 'init',
    argv: [
      cli, 'init',
      '--name=field-guide', '--display-name=Field Guide',
      '--repo-url=https://github.com/acme/field-guide',
      '--tagline=A field guide initiative',
      '--variant=greenfield', '--tier=1', '--pattern=A', `--target=${target}`,
    ],
  },
  {
    id: 'review-list',
    display: 'blueprint review --list',
    argv: [cli, 'review', '--list', `--target=${target}`],
  },
  {
    id: 'review-conformance-fresh',
    display: 'blueprint review portal-pattern-a-conformance-reviewer',
    argv: [cli, 'review', 'portal-pattern-a-conformance-reviewer', `--target=${target}`],
  },
  {
    id: 'review-research-fresh',
    display: 'blueprint review research-completeness-reviewer',
    argv: [cli, 'review', 'research-completeness-reviewer', `--target=${target}`],
  },
  {
    id: 'review-stateful-claims',
    display: 'blueprint review stateful-claim-lint-reviewer',
    argv: [cli, 'review', 'stateful-claim-lint-reviewer', `--target=${repoRoot}`],
  },
  {
    id: 'doctor-self',
    display: 'blueprint doctor',
    argv: [cli, 'doctor', `--target=${repoRoot}`],
  },
  {
    id: 'doctor-fresh',
    display: 'blueprint doctor',
    argv: [cli, 'doctor', `--target=${target}`],
  },
  {
    id: 'cost',
    display: 'blueprint cost',
    argv: [cli, 'cost', `--target=${repoRoot}`],
  },
  {
    id: 'fleet',
    display: 'blueprint fleet',
    argv: [cli, 'fleet'],
  },
  {
    id: 'upgrade-fresh',
    display: 'blueprint upgrade',
    argv: [cli, 'upgrade', `--target=${target}`],
  },
];

function redact(line) {
  return line
    .replaceAll(target, '~/work/field-guide')
    .replaceAll(scratch, '~/work')
    .replaceAll(repoRoot, '~/dev/blueprint')
    .replaceAll(process.env.HOME ?? '/nonexistent', '~');
}

const fixtures = {};
for (const s of SCENARIOS) {
  const t0 = Date.now();
  const res = spawnSync(process.execPath, s.argv, { encoding: 'utf8' });
  const durationMs = Date.now() - t0;
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`.replace(/\n$/, '');
  fixtures[s.id] = {
    command: s.display ?? displayFor(s.argv),
    exitCode: res.status ?? -1,
    durationMs,
    lines: out.split('\n').map(redact),
  };
  console.log(`  captured ${s.id}  (exit ${res.status}, ${durationMs}ms, ${fixtures[s.id].lines.length} lines)`);
}

rmSync(scratch, { recursive: true, force: true });

const outPath = join(portalRoot, 'src', 'data', 'demo-fixtures.json');
writeFileSync(outPath, JSON.stringify({
  capturedAt: new Date().toISOString(),
  pathsRedacted: true,
  fixtures,
}, null, 2) + '\n');
console.log(`\nwrote ${outPath}`);
