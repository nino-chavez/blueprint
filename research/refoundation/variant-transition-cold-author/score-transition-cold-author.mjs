#!/usr/bin/env node
// Sealed scorer for the disposable variant-transition cold-author exercise.
// It reads the candidate and fixture only, and writes reports only under /private/tmp.

import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = '/private/tmp/';
const DECISION_SCHEMA = 'blueprint-variant-transition-decision/1';
const RECEIPT_SCHEMA = 'blueprint-variant-transition-receipt/1';
const FROZEN_CANDIDATE = 'd372a63ee31433b720f066e81f3ab17fe2c5a7fa';
const PACKET_NAME = 'AUTHOR-PACKET-v3.md';
function args(argv) { const out = {}; for (const arg of argv) { const m = /^--([^=]+)=(.*)$/.exec(arg); if (m) out[m[1]] = m[2]; } return out; }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function git(root, parts) { return execFileSync('git', ['-C', root, ...parts], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function date(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [y, m, d] = value.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d)); return x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d; }
function safeJson(path) { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; } }
function tmpPath(value) { if (!value || !isAbsolute(value) || !resolve(value).startsWith(TMP)) throw new Error('--output must be an explicit path under /private/tmp'); return resolve(value); }
function tmpFixture(value) { if (!value || !isAbsolute(value) || !resolve(value).startsWith(TMP)) throw new Error('--fixture must be an explicit path under /private/tmp'); return resolve(value); }
function relativePath(value) { return typeof value === 'string' && value && !value.startsWith('/') && !value.split('/').includes('..') && !value.split('/').includes('.'); }
function decisionValid(value) { return value && typeof value === 'object' && !Array.isArray(value) && value.schema === DECISION_SCHEMA && typeof value.accountable_party === 'string' && value.accountable_party.trim() && typeof value.rollback_route === 'string' && value.rollback_route.trim() && date(value.receipt_review_at) && value.acknowledged === true; }
function allowedMaterials(baselineFiles) {
  return [
    PACKET_NAME,
    'candidate/bin/blueprint.mjs',
    'candidate-help.txt',
    ...(Array.isArray(baselineFiles) ? baselineFiles.map((item) => `fixture/${item.path}`) : []),
  ].sort();
}
function boundaryShapeValid(value) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.schema === 'blueprint-variant-transition-observation-boundary/1'
    && typeof value.observation_id === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.observation_id)
    && Number.isFinite(new Date(value.issued_at).getTime())
    && /^sha256:[0-9a-f]{64}$/.test(value.author_id || '')
    && typeof value.candidate?.root === 'string'
    && /^[0-9a-f]{40,64}$/.test(value.candidate?.head || '')
    && (value.candidate?.package_version === null || typeof value.candidate?.package_version === 'string')
    && /^[0-9a-f]{64}$/.test(value.candidate?.package_sha256 || '')
    && /^[0-9a-f]{64}$/.test(value.candidate?.executable_sha256 || '')
    && typeof value.fixture?.root === 'string'
    && /^[0-9a-f]{40,64}$/.test(value.fixture?.baseline_head || '')
    && [PACKET_NAME, 'candidate-help.txt', 'fixture-manifest.json']
      .every((path) => /^[0-9a-f]{64}$/.test(value.material_hashes?.[path] || ''))
    && Array.isArray(value.allowed_materials)
    && new Set(value.allowed_materials).size === value.allowed_materials.length
    && value.allowed_materials.every((path) => typeof path === 'string' && path)
    && typeof value.facilitator_role === 'string'
    && value.facilitator_role.trim()
    && value.attestation?.written_before_author_access === true
    && value.attestation?.fresh_no_fork === true
    && value.attestation?.no_prior_context === true
    && value.attestation?.no_creator_contact === true;
}
function commandAttemptsValid(value) {
  return Array.isArray(value)
    && value.length === 2
    && value[0]?.operation === 'plan'
    && typeof value[0]?.command === 'string'
    && value[0].command.includes('variant transition')
    && !value[0].command.includes(' --apply')
    && value[0]?.exit_code === 0
    && value[0]?.output_path === 'cold-author-plan.json'
    && value[1]?.operation === 'apply'
    && typeof value[1]?.command === 'string'
    && value[1].command.includes('variant transition')
    && value[1].command.includes(' --apply')
    && value[1]?.exit_code === 0
    && value[1]?.output_path === 'cold-author-apply.json';
}
function receiptFiles(root) {
  const base = join(root, '.blueprint', 'variant-transitions');
  if (!existsSync(base)) return [];
  const results = [];
  for (const id of readdirSync(base)) { const file = join(base, id, 'receipt.json'); if (existsSync(file) && lstatSync(file).isFile()) results.push(file); }
  return results;
}

if (process.argv.includes('--self-test')) {
  const good = { schema: DECISION_SCHEMA, accountable_party: 'operator', rollback_route: 'rollback', receipt_review_at: '2026-02-28', acknowledged: true };
  const goodBoundary = {
    schema: 'blueprint-variant-transition-observation-boundary/1',
    observation_id: '123e4567-e89b-42d3-a456-426614174000',
    issued_at: '2026-07-27T12:00:00.000Z',
    author_id: `sha256:${'a'.repeat(64)}`,
    candidate: {
      root: '/private/tmp/candidate',
      head: FROZEN_CANDIDATE,
      package_version: '0.8.0',
      package_sha256: 'c'.repeat(64),
      executable_sha256: '2'.repeat(64),
    },
    fixture: { root: '/private/tmp/run/fixture', baseline_head: 'd'.repeat(40) },
    material_hashes: {
      [PACKET_NAME]: 'e'.repeat(64),
      'candidate-help.txt': 'f'.repeat(64),
      'fixture-manifest.json': '1'.repeat(64),
    },
    allowed_materials: allowedMaterials([{ path: 'blueprint.yml' }]),
    facilitator_role: 'test facilitator',
    attestation: { written_before_author_access: true, fresh_no_fork: true, no_prior_context: true, no_creator_contact: true },
  };
  if (
    !decisionValid(good)
    || decisionValid({ ...good, receipt_review_at: '2026-02-30' })
    || decisionValid({ ...good, acknowledged: false })
    || !boundaryShapeValid(goodBoundary)
    || boundaryShapeValid({ ...goodBoundary, attestation: { ...goodBoundary.attestation, fresh_no_fork: false } })
    || boundaryShapeValid({ ...goodBoundary, author_id: 'raw-author-id' })
    || !commandAttemptsValid([
      { operation: 'plan', command: 'blueprint variant transition --json', exit_code: 0, output_path: 'cold-author-plan.json' },
      { operation: 'apply', command: 'blueprint variant transition --apply', exit_code: 0, output_path: 'cold-author-apply.json' },
    ])
    || commandAttemptsValid([
      { operation: 'plan', command: 'blueprint variant transition --json', exit_code: 1, output_path: 'cold-author-plan.json' },
      { operation: 'apply', command: 'blueprint variant transition --apply', exit_code: 0, output_path: 'cold-author-apply.json' },
    ])
  ) throw new Error('self-test failed');
  console.log('score-transition-cold-author self-test: PASS');
  process.exit(0);
}
const flags = args(process.argv.slice(2));
if (flags.help) { console.log('Usage: node score-transition-cold-author.mjs --fixture=/private/tmp/<output>/fixture --candidate-root=<candidate checkout> --output=/private/tmp/<new-score-dir>'); process.exit(0); }
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
let fixture; let candidate; let output;
try { fixture = tmpFixture(flags.fixture); candidate = flags['candidate-root'] ? resolve(flags['candidate-root']) : (() => { throw new Error('--candidate-root is required'); })(); output = tmpPath(flags.output); } catch (error) { console.error(`score-transition-cold-author: ${error.message}`); process.exit(2); }
const manifest = safeJson(join(dirname(fixture), 'fixture-manifest.json'));
const boundary = safeJson(join(dirname(fixture), 'observation-boundary.json'));
add('fixture-manifest-valid', manifest?.schema === 'blueprint-variant-transition-cold-author-fixture/1', 'prepared fixture manifest');
add('observation-boundary-valid', boundaryShapeValid(boundary), 'sealed v1 observation boundary');
add('fixture-is-git-root', existsSync(fixture) && (() => { try { return git(fixture, ['rev-parse', '--show-toplevel']) === fixture; } catch { return false; } })(), fixture);
add('fixture-baseline-head-unchanged', Boolean(manifest) && (() => { try { return git(fixture, ['rev-parse', 'HEAD']) === manifest.fixture.baseline_head; } catch { return false; } })(), manifest?.fixture?.baseline_head ?? 'missing');
const packagePath = join(candidate, 'package.json');
add(
  'boundary-candidate-and-baseline-bindings',
  boundaryShapeValid(boundary)
    && boundary.candidate.root === candidate
    && boundary.fixture.root === fixture
    && boundary.candidate.head === manifest?.candidate?.head
    && boundary.candidate.head === FROZEN_CANDIDATE
    && boundary.candidate.package_version === manifest?.candidate?.package_version
    && boundary.candidate.package_sha256 === manifest?.candidate?.package_sha256
    && boundary.fixture.baseline_head === manifest?.fixture?.baseline_head,
  boundary?.observation_id ?? 'missing boundary',
);
add('candidate-head-frozen-and-unchanged', Boolean(boundary) && (() => { try { return git(candidate, ['rev-parse', 'HEAD']) === boundary.candidate.head; } catch { return false; } })(), boundary?.candidate?.head ?? 'missing');
add('candidate-checkout-clean', (() => { try { return git(candidate, ['status', '--porcelain=v1']) === ''; } catch { return false; } })(), candidate);
add('candidate-package-unchanged', Boolean(boundary) && existsSync(packagePath) && hash(readFileSync(packagePath)) === boundary.candidate.package_sha256, boundary?.candidate?.package_sha256 ?? 'missing');
add(
  'candidate-executable-unchanged',
  Boolean(boundary) && existsSync(join(candidate, 'bin', 'blueprint.mjs'))
    && hash(readFileSync(join(candidate, 'bin', 'blueprint.mjs'))) === boundary.candidate.executable_sha256,
  boundary?.candidate?.executable_sha256 ?? 'missing',
);
const materialRoot = dirname(fixture);
add(
  'boundary-material-hashes',
  boundaryShapeValid(boundary)
    && JSON.stringify(Object.keys(boundary.material_hashes).sort()) === JSON.stringify([PACKET_NAME, 'candidate-help.txt', 'fixture-manifest.json'].sort())
    && Object.entries(boundary.material_hashes).every(([path, digest]) => existsSync(join(materialRoot, path)) && hash(readFileSync(join(materialRoot, path))) === digest),
  'packet, help, and manifest hashes',
);
const expectedAllowed = allowedMaterials(manifest?.fixture?.baseline_files);
add(
  'boundary-allowed-material-set',
  boundaryShapeValid(boundary) && JSON.stringify(boundary.allowed_materials) === JSON.stringify(expectedAllowed),
  `${boundary?.allowed_materials?.length ?? 'invalid'} allowed material(s)`,
);
const session = safeJson(join(fixture, 'cold-author-session.json'));
const started = new Date(session?.started_at).getTime(); const finished = new Date(session?.finished_at).getTime();
const issued = new Date(boundary?.issued_at).getTime();
const durationMinutes = (finished - started) / 60000;
add(
  'session-valid',
  Number.isFinite(started) && Number.isFinite(finished) && finished >= started && durationMinutes <= 60
    && Number.isInteger(session?.attempts) && session.attempts === session?.command_attempts?.length
    && Array.isArray(session?.questions_asked) && Array.isArray(session?.assumptions)
    && session?.methodology_creator_interventions === 0
    && Number.isFinite(issued) && issued <= started
    && session?.observation_id === boundary?.observation_id
    && commandAttemptsValid(session?.command_attempts),
  session ? `duration=${durationMinutes}; attempts=${session.attempts}; questions=${session.questions_asked?.length ?? 'invalid'}; interventions=${session.methodology_creator_interventions}` : 'missing or invalid cold-author-session.json',
);
add('exact-command-attempts', commandAttemptsValid(session?.command_attempts), 'plan then apply; both exit 0; exact output paths');
const planOutput = safeJson(join(fixture, 'cold-author-plan.json'));
const applyOutput = safeJson(join(fixture, 'cold-author-apply.json'));
const receipts = receiptFiles(fixture); add('exactly-one-receipt', receipts.length === 1, `${receipts.length} receipt(s)`);
const receipt = receipts.length === 1 ? safeJson(receipts[0]) : null;
const receiptDirectoryId = receipts.length === 1 ? dirname(receipts[0]).split('/').pop() : null;
add('receipt-valid-applied', receipt?.schema === RECEIPT_SCHEMA && receipt?.receiptId === receipt?.plan?.planId && receipt?.receiptId === receiptDirectoryId && receipt?.plan?.status === 'planned', receipt ? 'schema, id, directory, and plan status' : 'missing/invalid receipt');
add('transition-status-applied', Boolean(receipt) && !existsSync(join(dirname(receipts[0] || fixture), 'rollback.json')), 'receipt has not been rolled back');
const decisionPath = receipt?.plan?.transitionDecision?.path;
const decisionFile = relativePath(decisionPath) ? join(fixture, decisionPath) : null;
const decision = decisionFile && existsSync(decisionFile) && lstatSync(decisionFile).isFile() ? safeJson(decisionFile) : null;
add('decision-schema-and-path-valid', decisionPath === 'decisions/variant-transition.json' && Boolean(decisionFile) && decisionValid(decision), decisionPath ?? 'missing');
add('decision-bound-to-plan', Boolean(decision) && receipt?.plan?.transitionDecision?.sha256 === hash(readFileSync(decisionFile)) && JSON.stringify(receipt.plan.transitionDecision.declaration) === JSON.stringify({ schema: DECISION_SCHEMA, accountable_party: decision.accountable_party.trim(), rollback_route: decision.rollback_route.trim(), receipt_review_at: decision.receipt_review_at, acknowledged: true }), decisionPath ?? 'missing');
add(
  'recorded-plan-valid',
  Boolean(decision)
    && planOutput?.status === 'planned'
    && /^[0-9a-f]{64}$/.test(planOutput?.planId || '')
    && planOutput?.transitionDecision?.path === decisionPath
    && planOutput?.transitionDecision?.sha256 === hash(readFileSync(decisionFile))
    && JSON.stringify(planOutput?.transitionDecision?.declaration) === JSON.stringify(receipt?.plan?.transitionDecision?.declaration),
  planOutput?.planId ?? 'missing/invalid cold-author-plan.json',
);
add(
  'recorded-apply-valid',
  applyOutput?.applied === true
    && applyOutput?.status === 'applied'
    && applyOutput?.planId === planOutput?.planId
    && applyOutput?.planId === receipt?.plan?.planId
    && applyOutput?.receiptPath === receipt?.plan?.receiptPath,
  applyOutput?.planId ?? 'missing/invalid cold-author-apply.json',
);
add(
  'recorded-command-bindings',
  commandAttemptsValid(session?.command_attempts)
    && session.command_attempts[0].command.includes('--transition-decision=decisions/variant-transition.json')
    && session.command_attempts[1].command.includes('--transition-decision=decisions/variant-transition.json')
    && session.command_attempts[1].command.includes(`--plan-id=${planOutput?.planId}`),
  'commands bind the decision path and exact dry-run plan id',
);
const blueprint = existsSync(join(fixture, 'blueprint.yml')) ? readFileSync(join(fixture, 'blueprint.yml'), 'utf8') : '';
add('research-variant-and-stage', /^variant:\s*research\s*(?:#.*)?$/m.test(blueprint) && (!/^stage_model:/m.test(blueprint) || /^stage_model:\s*research\s*(?:#.*)?$/m.test(blueprint)), 'variant and stage_model are research');
const sentinels = manifest?.fixture?.baseline_files?.filter((item) => item.path !== 'blueprint.yml') ?? [];
add('authored-sentinel-preserved', sentinels.length > 0 && sentinels.every((item) => existsSync(join(fixture, item.path)) && hash(readFileSync(join(fixture, item.path))) === item.sha256), `${sentinels.length} baseline sentinel(s)`);
add('cleanup-unapplied', Array.isArray(receipt?.cleanup) && receipt.cleanup.every((item) => item.automaticAction === 'none'), 'receipt cleanup remains operator-review-only');
let journalClear = false; try { journalClear = !existsSync(git(fixture, ['rev-parse', '--git-path', 'blueprint-variant-transition.journal.json'])); } catch { /* check remains false */ }
add('no-interrupted-or-corrupt-journal', journalClear, 'no transition journal present');
const statusRun = spawnSync(
  process.execPath,
  [join(candidate, 'bin', 'blueprint.mjs'), 'variant', 'status', `--target=${fixture}`, '--json'],
  { cwd: fixture, encoding: 'utf8', env: { ...process.env, BLUEPRINT_HOME: candidate } },
);
const status = (() => { try { return JSON.parse(statusRun.stdout); } catch { return null; } })();
add('candidate-status-applied', statusRun.status === 0 && status?.status === 'applied', statusRun.stderr || statusRun.stdout || 'no status output');
const explanation = existsSync(join(fixture, 'cold-author-explanation.md')) ? readFileSync(join(fixture, 'cold-author-explanation.md'), 'utf8') : '';
const lowerExplanation = explanation.toLowerCase();
add(
  'explanation-complete',
  Boolean(receipt?.plan?.planId) && explanation.includes(receipt.plan.planId)
    && lowerExplanation.includes('preserv') && lowerExplanation.includes('creat')
    && lowerExplanation.includes('cleanup') && lowerExplanation.includes('rollback')
    && lowerExplanation.includes('review'),
  explanation ? 'must name plan id and explain preservation, creation, operator-review-only cleanup, rollback execution, and review' : 'missing cold-author-explanation.md',
);
const failed = checks.filter((check) => !check.passed);
const score = { schema: 'blueprint-variant-transition-cold-author-score/1', verdict: failed.length ? 'FAIL' : 'PASS', generated_at: new Date().toISOString(), fixture, candidate, checks };
if (existsSync(output)) { console.error(`score-transition-cold-author: output must not already exist: ${output}`); process.exit(2); }
mkdirSync(output, { recursive: false });
writeFileSync(join(output, 'score.json'), `${JSON.stringify(score, null, 2)}\n`, { flag: 'wx' });
writeFileSync(join(output, 'score.md'), ['# Variant transition cold-author score', '', `Verdict: **${score.verdict}** (${checks.length - failed.length}/${checks.length})`, '', '| Check | Result | Detail |', '|---|---|---|', ...checks.map((c) => `| ${c.id} | ${c.passed ? 'pass' : 'FAIL'} | ${String(c.detail).replaceAll('|', '\\|')} |`), ''].join('\n'), { flag: 'wx' });
console.log(`${score.verdict}: ${checks.length - failed.length}/${checks.length} checks passed`);
console.log(`wrote ${join(output, 'score.json')} and ${join(output, 'score.md')}`);
if (failed.length) process.exitCode = 1;
