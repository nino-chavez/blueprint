// Controlled regressions for the wedding initiative's workflow gaps.
// Synthetic evidence tests the gates, not the quality of real research.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, symlinkSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { deriveStageStatus, recordAdvance, RESEARCH_MODEL } from '../lib/stage-model.mjs';
import { runDoctor } from '../lib/doctor.mjs';
import { validateManifest } from '../lib/actor-output.mjs';
import { renderRecoveryBrief } from '../lib/account-derive.mjs';
import { inspectApplicationDefinition, resolveApplicationDefinition } from '../lib/application-definition.mjs';

const home = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = mkdtempSync(join(tmpdir(), 'blueprint-workflow-'));
const put = (rel, body) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), body); };
let failures = 0, checks = 0;
async function test(name, fn) {
  checks++;
  try { await fn(); console.log(`PASS: ${name}`); }
  catch (e) { failures++; console.error(`FAIL: ${name}: ${e.message}`); }
}
const personas = '### Planner (`planner`)\nSource: research/sources/brief.md\nJOB-1: Choose a grounded direction. Acceptance: can identify the evidence for the choice.\n';
const advance = (execute = false) => recordAdvance({ root, home, execute, asserts: { 'cross-asset-reconciled': 'Synthetic fixture assertion' } });
try {
  const stdout = execFileSync(process.execPath, [join(home, 'template/tools/blueprint-init/stamp.mjs'), `--target=${root}`, '--name=workflow-fixture', '--display-name=Workflow fixture', '--variant=research', '--tier=0'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  await test('fresh stamp delivers both entry points and names the canonical map', () => {
    assert(existsSync(join(root, 'CLAUDE.md')), 'advertised CLAUDE.md missing');
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /CLAUDE\.md/);
    assert.match(stdout, /AGENTS\.md/);
    assert.match(readFileSync(join(root, 'CLAUDE.md'), 'utf8'), /blueprint stage advance/);
    assert(existsSync(join(root, '.claude/skills/blueprint/research.md')), 'direct-read research instructions resolve');
  });
  await test('fresh doctor separates healthy tools from unfinished workflow', async () => {
    const d = await runDoctor({ home, targetDir: root });
    assert.notEqual(d.health?.status, undefined);
    assert.notEqual(d.health.status, 'fail');
    assert.equal(d.workflow?.status, 'pending');
    assert(d.workflow.checks.some(c => c.gate === 'personas-jtbd' && c.status === 'pending'));
  });
  await test('public CLI delivers Codex startup and preserves existing instruction symlinks', () => {
    const target = mkdtempSync(join(tmpdir(), 'blueprint-entry-'));
    const args = [join(home, 'bin/blueprint.mjs'), 'init', `--target=${target}`, '--name=entry-fixture', '--variant=research', '--tier=0'];
    const run = () => execFileSync(process.execPath, args, { env: { ...process.env, BLUEPRINT_HOME: home }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    try {
      run();
      assert.match(readFileSync(join(target, 'AGENTS.md'), 'utf8'), /CLAUDE\.md/);
      for (const name of ['AGENTS.md', 'CLAUDE.md']) {
        rmSync(join(target, name));
        symlinkSync('project-owned-missing.md', join(target, name));
      }
      run();
      for (const name of ['AGENTS.md', 'CLAUDE.md']) assert.equal(readlinkSync(join(target, name)), 'project-owned-missing.md');
      assert(!existsSync(join(target, 'project-owned-missing.md')));
    } finally { rmSync(target, { recursive: true, force: true }); }
  });
  await test('fresh stamp and public CLI support phases and reject a skipped phase selector', async () => {
    const target = mkdtempSync(join(tmpdir(), 'blueprint-phase-cli-'));
    const cli = (args) => execFileSync(process.execPath, [join(home, 'bin/blueprint.mjs'), 'stage', ...args, `--target=${target}`], {
      env: { ...process.env, BLUEPRINT_HOME: home }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
    });
    try {
      execFileSync(process.execPath, [join(home, 'template/tools/blueprint-init/stamp.mjs'), `--target=${target}`, '--name=phase-fixture', '--variant=research', '--tier=0'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
      writeFileSync(join(target, 'blueprint.yml'), 'stage_model: model.json\n');
      writeFileSync(join(target, 'definition.md'), 'definition evidence\n');
      writeFileSync(join(target, 'model.json'), JSON.stringify({ variant: 'cli-phase-fixture', stages: [{
        id: 0, name: 'Design', gates: [], phases: [
          { id: 'definition', name: 'Definition', gates: [{ id: 'definition-file', derivable: true, kind: 'file-exists', params: { path: 'definition.md' } }] },
          { id: 'selection', name: 'Selection', gates: [{ id: 'selected', derivable: false, kind: 'manual', params: {} }] },
        ],
      }] }));
      const json = JSON.parse(cli(['status', '--json']));
      assert.equal(json.currentPhase.id, 'definition');
      const stamped = await import(pathToFileURL(join(target, 'tools/lib/stage-model.mjs')).href);
      assert.equal(stamped.deriveStageStatus({ root: target }).currentPhase.id, 'definition');
      assert.match(cli(['status']), /current phase: 0\/definition — Definition/);
      try {
        cli(['advance', '--phase=selection', '--json']);
        assert.fail('a later phase selector must not skip the current phase');
      } catch (e) {
        assert.equal(e.status, 2);
        assert.match(e.stdout, /does not match the current phase/);
      }
      const advanceJson = JSON.parse(cli(['advance', '--phase=definition', '--json']));
      assert.equal(advanceJson.ok, true);
      assert.equal(advanceJson.target.phase.id, 'definition');
      assert.equal(existsSync(join(target, '.blueprint/stage-state.json')), false, 'dry-run preserves phase state');
      const phaseDoctor = await runDoctor({ home, targetDir: target });
      assert(phaseDoctor.workflow.checks.some((check) => check.phase === 'selection' && check.gate === 'selected'), 'doctor includes phase gates in workflow readiness');
      assert.match(cli(['advance', '--phase=definition', '--execute']), /Phase definition completes within Stage 0/);
      assert.equal(JSON.parse(cli(['status', '--json'])).currentPhase.id, 'selection');
      const corruptState = JSON.parse(readFileSync(join(target, '.blueprint/stage-state.json'), 'utf8'));
      corruptState.phaseHistory[0].phaseId = 'selection';
      writeFileSync(join(target, '.blueprint/stage-state.json'), JSON.stringify(corruptState));
      const corruptDoctor = await runDoctor({ home, targetDir: target });
      assert.equal(corruptDoctor.workflow.status, 'error');
      assert.equal(corruptDoctor.checks.find((c) => c.name === 'stage-model').status, 'pass', 'corrupt workflow state does not mean a broken stage-model installation');
      writeFileSync(join(target, 'model.json'), JSON.stringify({ stages: [null] }));
      try {
        cli(['status', '--json']);
        assert.fail('a malformed selected model must refuse CLI status');
      } catch (e) {
        assert.equal(e.status, 2);
        assert.match(e.stdout, /must be an object/);
      }
      const badDoctor = await runDoctor({ home, targetDir: target });
      assert.equal(badDoctor.status, 'fail');
      assert.equal(badDoctor.workflow.status, 'error');
    } finally { rmSync(target, { recursive: true, force: true }); }
  });
  await test('declared application-definition source is root-only, fail-closed, and never advances a phase', async () => {
    const target = mkdtempSync(join(tmpdir(), 'blueprint-application-definition-'));
    const cli = (args) => execFileSync(process.execPath, [join(home, 'bin/blueprint.mjs'), 'stage', ...args, `--target=${target}`], {
      env: { ...process.env, BLUEPRINT_HOME: home }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
    });
    const put = (path, value) => writeFileSync(join(target, path), value);
    const source = '## BR-01 — Request\n';
    const manifest = {
      version: 1,
      scope: { id: 'fixture', owner: 'fixture owner', boundary: 'fixture boundary', extent: 'bounded-change', included: ['request'], excluded: ['all other work'] },
      sources: [{ path: 'requirements.md', sha256: createHash('sha256').update(source).digest('hex'), roles: ['brd', 'prd', 'stories'], scan_references: true }],
      inventories: [{ name: 'business', prefix: 'BR-', digits: 2, source: 'requirements.md', format: 'heading' }],
    };
    const gate = { id: 'definition-source', derivable: true, kind: 'application-definition-source', params: {} };
    const model = (check = gate) => ({ stages: [{ id: 0, name: 'Definition', gates: [], phases: [{ id: 'source', name: 'Source', gates: [check] }] }] });
    const config = 'application_definition: definition.json\nstage_model: model.json\n';
    const rejected = (args, exitCode) => {
      try { cli(args); assert.fail('command must refuse'); }
      catch (error) { assert.equal(error.status, exitCode); return args.includes('--json') ? error.stdout : error.stdout + error.stderr; }
    };
    try {
      execFileSync(process.execPath, [join(home, 'template/tools/blueprint-init/stamp.mjs'), `--target=${target}`, '--name=application-definition-fixture', '--variant=research', '--tier=0'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
      put('requirements.md', source);
      put('definition.json', JSON.stringify(manifest));
      put('model.json', JSON.stringify(model()));
      put('blueprint.yml', config);
      // A valid undeclared nested packet must never rescue a bad root selection.
      mkdirSync(join(target, 'blueprint'));
      put('blueprint/requirements.md', source);
      put('blueprint/decoy.json', JSON.stringify(manifest));
      const sourceResult = inspectApplicationDefinition({ initiativeRoot: target });
      assert.equal(sourceResult.source_status, 'pass');
      assert.equal(sourceResult.state, 'pending');
      assert.equal(sourceResult.authority, 'not-verified');
      assert.deepEqual(sourceResult.allowed_actions, []);
      assert(sourceResult.method_hash && sourceResult.source_fingerprint);
      const stamped = await import(pathToFileURL(join(target, 'tools/lib/application-definition.mjs')).href);
      assert.equal(stamped.inspectApplicationDefinition({ initiativeRoot: target }).source_status, 'pass', 'fresh stamp includes the shared inspector');
      const status = JSON.parse(cli(['status', '--json']));
      const result = status.stages[0].phases[0].gates[0];
      assert.equal(result.state, 'partial');
      assert.equal(result.applicationDefinition.manifest, 'definition.json');
      assert.equal(result.applicationDefinition.authority, 'not-verified');
      for (const execute of [[], ['--execute']]) {
        const refused = JSON.parse(rejected(['advance', '--phase=source', '--json', ...execute], 1));
        assert.equal(refused.ok, false);
        assert.equal(existsSync(join(target, '.blueprint/stage-state.json')), false, 'clean source cannot write or advance');
      }
      const doctor = await runDoctor({ home, targetDir: target });
      assert.notEqual(doctor.health.status, 'fail');
      assert.equal(doctor.workflow.status, 'pending');
      assert.equal(doctor.workflow.checks.find(c => c.gate === 'definition-source').status, 'pending');
      put('blueprint/blueprint.yml', 'application_definition: decoy.json\n');
      assert.equal(inspectApplicationDefinition({ initiativeRoot: target }).execution_error, true, 'conflicting nested file rejects');
      assert.match(cli(['status']), /nested blueprint.yml application_definition conflicts/);
      rmSync(join(target, 'blueprint/blueprint.yml'));
      put('blueprint.yml', 'application_definition: missing.json\nstage_model: model.json\n');
      assert.equal(inspectApplicationDefinition({ initiativeRoot: target }).execution_error, true, 'bad root does not fall back to valid nested packet');
      assert.match(cli(['status']), /missing.json/);
      assert.match(rejected(['advance', '--execute'], 2), /missing.json/);
      const brokenDoctor = await runDoctor({ home, targetDir: target });
      assert.notEqual(brokenDoctor.health.status, 'fail');
      assert.equal(brokenDoctor.workflow.status, 'error');
      assert.match(brokenDoctor.workflow.checks.find(c => c.gate === gate.id).detail, /missing.json/);
      put('blueprint/blueprint.yml', 'application_definition: decoy.json\n');
      put('blueprint.yml', 'stage_model: model.json\n');
      assert.equal(resolveApplicationDefinition(target).ok, false, 'nested-only config file never selects');
      rmSync(join(target, 'blueprint/blueprint.yml'));
      put('blueprint.yml', config + 'application_definition: definition.json\n');
      assert.equal(resolveApplicationDefinition(target).ok, false, 'duplicate root declaration rejects');
      put('blueprint.yml', config);
      const unsafe = structuredClone(manifest);
      unsafe.sources[0].path = '../outside.md';
      put('definition.json', JSON.stringify(unsafe));
      assert.equal(inspectApplicationDefinition({ initiativeRoot: target }).source_status, 'fail', 'path escape fails closed');
      put('definition.json', JSON.stringify(manifest));
      put('requirements.md', 'changed');
      assert.equal(inspectApplicationDefinition({ initiativeRoot: target }).source_status, 'fail', 'stale source fails');
      assert.match(cli(['status']), /requirements.md: stale-source/);
      assert.match(rejected(['advance', '--execute'], 1), /requirements.md: stale-source/);
      put('definition.json', JSON.stringify({ ...manifest, version: 2 }));
      assert.equal(inspectApplicationDefinition({ initiativeRoot: target }).execution_error, true, 'unknown schema is a workflow execution error');
      put('definition.json', JSON.stringify(manifest));
      put('requirements.md', source);
      for (const invalid of [{ ...gate, derivable: false }, { ...gate, optional: true }, { ...gate, params: { path: 'decoy.json' } }]) {
        put('model.json', JSON.stringify(model(invalid)));
        assert(deriveStageStatus({ root: target }).modelError, 'assertion, optional and alternate-path overrides reject');
      }
      assert.equal(existsSync(join(target, '.blueprint/stage-state.json')), false, 'all refused attempts preserve absent phase state');
    } finally { rmSync(target, { recursive: true, force: true }); }
  });
  put('research/sources/brief.md', 'Synthetic input brief catalogued for the workflow regression.');
  put('research/personas-and-jtbd.md', personas);
  put('research/competitive/findings.md', 'Synthetic competitor evidence. '.repeat(30));
  put('research/prior-art/findings.md', 'Synthetic prior-art evidence. '.repeat(30));
  put('decisions/0001.md', '# Direction\nserves: planner/JOB-1\nSynthetic direction with enough text to count as an artifact.');
  await test('missing problem-space cannot advance despite three counted items', async () => {
    assert.equal(deriveStageStatus({ root }).stages.find(s => s.id === 2).artifactPass, true, 'reproduction must exercise the permissive structural count');
    const r = await advance();
    assert.equal(r.ok, false);
    assert(r.reviewerBlocked?.some(c => c.reviewer === 'research-completeness-reviewer'));
    assert(!existsSync(join(root, '.blueprint/stage-state.json')));
  });
  await test('doctor exposes missing research through a live reviewer', async () => {
    const d = await runDoctor({ home, targetDir: root });
    assert.equal(d.workflow?.status, 'pending');
    const c = d.workflow.checks.find(c => c.reviewer === 'research-completeness-reviewer');
    assert.equal(c.status, 'pending');
    assert.match(c.detail, /problem-space/);
    assert.notEqual(d.health.status, 'fail');
  });
  put('research/problem-space/findings.md', 'Synthetic problem-space evidence. '.repeat(30));
  await test('populated research advances without demanding a future memo', async () => {
    const r = await advance(true);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert(r.reviews.some(c => c.reviewer === 'persona-fit-reviewer' && c.status === 'PASS'));
    assert(r.reviews.some(c => c.reviewer === 'research-completeness-reviewer' && c.status === 'PASS'));
  });
  put('research/personas-and-jtbd.md', '# Personas\nA filled-looking file with enough text but no grounded persona jobs.');
  await test('an already recorded stage cannot hide invalidated personas', async () => {
    const before = readFileSync(join(root, '.blueprint/stage-state.json'), 'utf8');
    const frontier = deriveStageStatus({ root, assertions: JSON.parse(before).assertions }).nextStage;
    assert(frontier.id > 1, 'regression must have later unfinished work');
    const r = await advance(true);
    assert.equal(r.ok, false);
    assert.equal(r.target.id, frontier.id, 'missing work must retain its own frontier stage');
    assert(r.reviewerBlocked?.some(c => c.reviewer === 'persona-fit-reviewer' && c.stage === 1));
    let cli;
    try {
      execFileSync(process.execPath, [join(home, 'bin/blueprint.mjs'), 'stage', 'advance', `--target=${root}`], { env: { ...process.env, BLUEPRINT_HOME: home }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
      assert.fail('invalidated personas must block the CLI');
    } catch (e) {
      assert.equal(e.status, 1);
      cli = e.stdout;
    }
    assert.match(cli, new RegExp(`target frontier: Stage ${frontier.id} `));
    assert.match(cli, /Stage 1.*reviewer persona-fit-reviewer/);
    assert.equal(readFileSync(join(root, '.blueprint/stage-state.json'), 'utf8'), before);
  });
  put('research/personas-and-jtbd.md', personas);
  const originalYml = readFileSync(join(root, 'blueprint.yml'), 'utf8');
  await test('an apparently complete pipeline still verifies mapped reviewers', async () => {
    try {
      put('model.json', JSON.stringify({ ...RESEARCH_MODEL, stages: RESEARCH_MODEL.stages.slice(0, 3) }));
      put('blueprint.yml', originalYml + '\nstage_model: model.json\n');
      put('research/problem-space/findings.md', 'stub');
      assert.equal(deriveStageStatus({ root }).nextStage, null);
      const r = await recordAdvance({ root, home });
      assert.equal(r.ok, false);
      assert(r.reviewerBlocked.some(c => c.reviewer === 'research-completeness-reviewer'));
    } finally {
      put('blueprint.yml', originalYml);
      put('research/problem-space/findings.md', 'Synthetic problem-space evidence. '.repeat(30));
    }
  });
  await test('a missing mapped reviewer is an execution error, not pending work', async () => {
    try {
      const model = structuredClone(RESEARCH_MODEL);
      model.stages[0].gates[0].reviewer = { name: 'nonexistent-regression-reviewer' };
      put('model.json', JSON.stringify(model));
      put('blueprint.yml', originalYml + '\nstage_model: model.json\n');
      const d = await runDoctor({ home, targetDir: root });
      assert.equal(d.workflow.status, 'error');
      assert.equal(d.status, 'fail');
      assert(d.workflow.checks.some(c => c.reviewStatus === 'UNRESOLVED'));
    } finally { put('blueprint.yml', originalYml); }
  });
  const manifest = {
    actors: [{ id: 'reader', kind: 'human', evidence: { status: 'intrinsic' }, outcomes: [{ id: 'choose', success: { statement: 'Choose a direction', proof: { target: { method: 'observed-human' } } } }] }],
    outputs: [{ id: 'memo', type: 'decision-memo', serves: ['reader.choose'], status: 'ready', artifact: 'decisions/0001.md', clearance: 'internal' }],
  };
  await test('ready artifact without receipts is structurally valid but pending', () => {
    const r = validateManifest(manifest, { root, gate: true });
    assert.deepEqual(r.errors, []);
    assert.equal(r.verdict, 'PENDING');
    assert(r.pendings.some(p => /receipt/.test(p)));
  });
  const receipt = (grade, result = 'pass') => ({ grade, result, observer: 'synthetic-test', at: '2026-10-01' });
  await test('interim and failed receipts cannot prove a human outcome', () => {
    for (const r of [receipt('cold-agent'), receipt('observed-human', 'fail')]) {
      manifest.outputs[0].assurance = { receipts: [r] };
      assert.equal(validateManifest(manifest, { root }).verdict, 'PENDING');
    }
    manifest.outputs[0].assurance.receipts = [receipt('observed-human')];
    assert.equal(validateManifest(manifest, { root }).verdict, 'PASS');
  });
  await test('agent outcomes also require the declared target receipt', () => {
    manifest.actors[0].kind = 'agent';
    manifest.actors[0].outcomes[0].success.proof.target.method = 'cold-agent';
    manifest.outputs[0].assurance = { receipts: [] };
    assert.equal(validateManifest(manifest, { root }).verdict, 'PENDING');
    manifest.outputs[0].assurance.receipts = [receipt('cold-agent')];
    assert.equal(validateManifest(manifest, { root }).verdict, 'PASS');
  });
  await test('a pass summary never claims independently proven outcomes', () => {
    const text = renderRecoveryBrief({ initiative: 'fixture', generated_at: 'test', as_of: 'fixture', refresh: 'test', verdict: { state: 'PASS', errors: [], pendings: [], warns: [] }, recent: [], outputs: [], decisions: [], actors: [], account: [] });
    assert(!text.includes('All declared outcomes served and proven.'));
    assert.match(text, /receipt|validation/i);
  });
} finally { rmSync(root, { recursive: true, force: true }); }
if (failures) { console.error(`workflow-smoke: FAIL (${failures}/${checks})`); process.exitCode = 1; }
else console.log(`workflow-smoke: PASS (${checks} checks)`);
