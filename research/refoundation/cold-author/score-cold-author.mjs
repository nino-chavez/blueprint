#!/usr/bin/env node

// Sealed scorer for the independent compact-author usability observation.
// It compiles the authored source, executes the read-only root shadow, and
// checks the scenario's consequential semantics rather than YAML spelling.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const SUBMISSION = resolve(HERE, 'submission');
const SOURCE = resolve(SUBMISSION, 'submission.yml');
const EXPLANATION = resolve(SUBMISSION, 'explanation.md');
const SESSION = resolve(SUBMISSION, 'session.json');
const SHADOW_ROOT = resolve(ROOT, 'research/refoundation/v2-shadow');
const GENERATED = resolve(SHADOW_ROOT, 'generated');
const OVERLAY = resolve(GENERATED, 'cold-author-overlay.json');
const REPORT = resolve(GENERATED, 'consumers/cold-author-submission.shadow-report.json');
const NORMALIZED = resolve(GENERATED, 'consumers/cold-author-submission.normalized.json');
const SCORE_JSON = resolve(GENERATED, 'cold-author-score.json');
const SCORE_MD = resolve(GENERATED, 'cold-author-score.md');
const COMPILER = resolve(SHADOW_ROOT, 'compile-compact.mjs');
const SHADOW = resolve(SHADOW_ROOT, 'shadow-consumer.mjs');

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const read = (file) => readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const lines = (value) => value.split('\n').filter((line) => line.trim()).length;
const run = (script, args) => spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: 'utf8' });

for (const [id, file] of [
  ['submission-present', SOURCE],
  ['explanation-present', EXPLANATION],
  ['session-present', SESSION],
]) add(id, existsSync(file), existsSync(file) ? 'present' : 'missing');

let sourceText = '';
let explanationText = '';
let session = null;
if (existsSync(SOURCE)) sourceText = read(SOURCE);
if (existsSync(EXPLANATION)) explanationText = read(EXPLANATION);
if (existsSync(SESSION)) {
  try {
    session = json(SESSION);
    add('session-json-valid', true, 'valid JSON');
  } catch (error) {
    add('session-json-valid', false, error.message);
  }
}

if (sourceText) {
  add('authoring-budget', lines(sourceText) <= 65, `${lines(sourceText)} nonblank lines; limit 65`);
  add('portable-source', !/(?:^|[\s"'=(])\/Users\//m.test(sourceText), 'absolute user paths are forbidden');
}

if (session) {
  const started = new Date(session.started_at).getTime();
  const finished = new Date(session.finished_at).getTime();
  const durationMinutes = (finished - started) / 60000;
  add('session-times-valid', Number.isFinite(started) && Number.isFinite(finished) && finished >= started, `duration=${Number.isFinite(durationMinutes) ? durationMinutes : 'invalid'} minutes`);
  add('session-within-observation-window', Number.isFinite(durationMinutes) && durationMinutes <= 60, `duration=${durationMinutes} minutes; limit 60`);
  add('attempts-recorded', Number.isInteger(session.attempts) && session.attempts >= 1, `attempts=${session.attempts}`);
  add('questions-recorded', Array.isArray(session.questions_asked), `${session.questions_asked?.length ?? 'invalid'} question(s)`);
  add('assumptions-recorded', Array.isArray(session.assumptions), `${session.assumptions?.length ?? 'invalid'} assumption(s)`);
  add('creator-independent', session.methodology_creator_interventions === 0, `interventions=${session.methodology_creator_interventions}`);
}

let compile = null;
let shadow = null;
if (sourceText) {
  compile = run(COMPILER, [`--source=${SOURCE}`, `--output=${OVERLAY}`]);
  add('compact-compiles', compile.status === 0, (compile.stderr || compile.stdout).trim());
  if (compile.status === 0) {
    shadow = run(SHADOW, [`--overlay=${OVERLAY}`, `--root=${ROOT}`, '--output-label=cold-author-submission']);
    add('kernel-valid', shadow.status === 0, (shadow.stderr || shadow.stdout).trim());
  }
}

if (shadow?.status === 0 && existsSync(REPORT) && existsSync(NORMALIZED)) {
  const report = json(REPORT);
  const normalized = json(NORMALIZED);
  const expectedClaims = {
    'reporter-artifact-present': 'satisfied',
    'manual-report-observed': 'satisfied',
    'scheduled-report-arrives': 'unobservable',
  };
  const expectedCheckpoints = {
    'manual-operation-proven': 'satisfied',
    'scheduled-operation-proven': 'unobservable',
  };
  const actualClaimIds = Object.keys(report.kernel.claims).sort();
  const actualCheckpointIds = Object.keys(report.kernel.checkpoints).sort();
  add('exact-claim-set', JSON.stringify(actualClaimIds) === JSON.stringify(Object.keys(expectedClaims).sort()), actualClaimIds.join(', '));
  add('exact-checkpoint-set', JSON.stringify(actualCheckpointIds) === JSON.stringify(Object.keys(expectedCheckpoints).sort()), actualCheckpointIds.join(', '));
  for (const [id, expected] of Object.entries(expectedClaims)) {
    add(`claim-state:${id}`, report.kernel.claims[id]?.state === expected, `expected=${expected} actual=${report.kernel.claims[id]?.state ?? 'missing'}`);
  }
  for (const [id, expected] of Object.entries(expectedCheckpoints)) {
    add(`checkpoint-state:${id}`, report.kernel.checkpoints[id]?.state === expected, `expected=${expected} actual=${report.kernel.checkpoints[id]?.state ?? 'missing'}`);
  }

  const byClaim = new Map(normalized.claims.map((claim) => [claim.id, claim]));
  add('manual-dependency-preserved', JSON.stringify(byClaim.get('manual-report-observed')?.depends_on) === JSON.stringify(['reporter-artifact-present']), JSON.stringify(byClaim.get('manual-report-observed')?.depends_on));
  add('scheduled-dependency-preserved', JSON.stringify(byClaim.get('scheduled-report-arrives')?.depends_on) === JSON.stringify(['manual-report-observed']), JSON.stringify(byClaim.get('scheduled-report-arrives')?.depends_on));
  add('schedule-scope-preserved', byClaim.get('scheduled-report-arrives')?.scope?.schedule === 'daily-window', JSON.stringify(byClaim.get('scheduled-report-arrives')?.scope));

  const evaluations = Object.values(report.kernel.receipt_evaluations);
  const manual = evaluations.find((entry) => entry.claim === 'manual-report-observed');
  const scheduled = evaluations.find((entry) => entry.claim === 'scheduled-report-arrives');
  add('manual-receipt-compatible', manual?.result === 'supports' && manual?.compatible === true, JSON.stringify(manual));
  add('scheduled-receipt-honest', scheduled?.result === 'could-not-observe' && scheduled?.compatible === true, JSON.stringify(scheduled));
  add('ongoing-module-bounded', normalized.modules.length === 1 && normalized.modules[0].id === 'ongoing-operation' && JSON.stringify(normalized.modules[0].activation_claims) === JSON.stringify(['scheduled-report-arrives']), JSON.stringify(normalized.modules));
}

if (explanationText) {
  const lower = explanationText.toLowerCase();
  for (const id of ['reporter-artifact-present', 'manual-report-observed', 'scheduled-report-arrives', 'manual-operation-proven', 'scheduled-operation-proven']) {
    add(`explanation-names:${id}`, lower.includes(id), `must name ${id}`);
  }
  add('explanation-distinguishes-scheduled-proof', lower.includes('manual') && lower.includes('scheduled') && /(cannot|does not|doesn't|insufficient)/.test(lower), 'must explain why manual evidence does not prove scheduled delivery');
  add('explanation-uses-derived-states', lower.includes('satisfied') && lower.includes('unobservable'), 'must predict satisfied and unobservable states');
}

const failed = checks.filter((check) => !check.passed);
const score = {
  schema: 'blueprint-cold-author-score/1',
  verdict: failed.length ? 'FAIL' : 'PASS',
  generated_at: new Date().toISOString(),
  independent_by_record: session?.methodology_creator_interventions === 0,
  metrics: {
    nonblank_source_lines: sourceText ? lines(sourceText) : null,
    attempts: session?.attempts ?? null,
    questions_asked: Array.isArray(session?.questions_asked) ? session.questions_asked.length : null,
    assumptions: Array.isArray(session?.assumptions) ? session.assumptions.length : null,
    duration_minutes: session ? (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000 : null,
  },
  checks,
};

const markdown = [
  '# Blueprint compact cold-author score',
  '',
  `Verdict: **${score.verdict}** (${checks.length - failed.length}/${checks.length} checks passed).`,
  '',
  `- Authored nonblank lines: ${score.metrics.nonblank_source_lines ?? 'not recorded'}`,
  `- Attempts: ${score.metrics.attempts ?? 'not recorded'}`,
  `- Questions asked: ${score.metrics.questions_asked ?? 'not recorded'}`,
  `- Recorded duration: ${score.metrics.duration_minutes ?? 'not recorded'} minutes`,
  `- Methodology-creator interventions: ${session?.methodology_creator_interventions ?? 'not recorded'}`,
  '',
  '| Check | Result | Detail |',
  '|---|---|---|',
  ...checks.map((check) => `| ${check.id} | ${check.passed ? 'pass' : 'FAIL'} | ${String(check.detail).replaceAll('|', '\\|').replaceAll('\n', ' ')} |`),
  '',
].join('\n');

mkdirSync(GENERATED, { recursive: true });
writeFileSync(SCORE_JSON, `${JSON.stringify(score, null, 2)}\n`);
writeFileSync(SCORE_MD, markdown);
console.log(`${score.verdict}: ${checks.length - failed.length}/${checks.length} cold-author checks passed`);
for (const check of failed) console.log(`  FAIL ${check.id}: ${check.detail}`);
console.log(`  wrote research/refoundation/v2-shadow/generated/cold-author-score.json`);
console.log(`  wrote research/refoundation/v2-shadow/generated/cold-author-score.md`);
if (failed.length) process.exitCode = 1;
