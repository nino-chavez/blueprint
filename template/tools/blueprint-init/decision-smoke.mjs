// Synthetic host decisions only. No real person or product is approved here.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { applicationDecisionRequest, inspectApplicationDecision } from '../lib/application-definition-decisions.mjs';
import { recordAdvance } from '../lib/stage-model.mjs';

const root = mkdtempSync(join(tmpdir(), 'bp-decision-'));
const home = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => Date.parse('2026-10-03T12:00:00Z');
const requirement = {
  kind: 'definition-review', action: 'concepts', stage: 2, phase: 'definition',
  review: { input_hash: hash('synthetic review inputs'), method_hash: hash('synthetic review method'), completed_at: '2026-10-03T10:00:00Z' },
};
const host = { provider: 'synthetic-only', actor: 'synthetic-owner', role: 'product-owner', method_hash: hash('synthetic host method') };
let checks = 0;
async function check(name, fn) { await fn(); checks++; }
const put = (path, value) => writeFileSync(join(root, path), value);
try {
  const source = '## BR-01 — Request\n';
  const manifest = {
    version: 1, scope: { id: 'synthetic-app', owner: 'synthetic-owner', boundary: 'fixture', extent: 'bounded-change', included: ['request'], excluded: ['rest'] },
    sources: [{ path: 'requirements.md', sha256: hash(source), roles: ['brd', 'prd', 'stories'], scan_references: true }],
    inventories: [{ name: 'business', prefix: 'BR-', digits: 2, source: 'requirements.md', format: 'heading' }],
  };
  put('requirements.md', source);
  put('definition.json', JSON.stringify(manifest));
  put('blueprint.yml', 'stage_model: model.json\napplication_definition: definition.json\n');
  const model = { stages: [{ id: 2, name: 'Design', gates: [], phases: [{ id: 'definition', name: 'Definition', gates: [{ id: 'sources', kind: 'application-definition-source', derivable: true }] }] }] };
  put('model.json', JSON.stringify(model));
  const request = applicationDecisionRequest({ initiativeRoot: root, requirement, host });
  const decision = {
    schema: 'blueprint-human-decision/1', id: 'decision-1',
    provider: host.provider, actor: host.actor, role: host.role,
    origin: 'authenticated-human', status: 'active', verdict: 'accept',
    subject: request.subject, kind: requirement.kind, action: requirement.action,
    fingerprint: request.fingerprint, decided_at: '2026-10-03T11:00:00Z', expires_at: null,
    source: { id: 'host-record-1', revision: 'revision-1' },
  };
  let lookupCount = 0;
  let canonical = structuredClone(decision);
  const provider = { ...host, resolveDecision: async () => { lookupCount++; return structuredClone(canonical); } };
  const inspect = (overrides = {}) => inspectApplicationDecision({ initiativeRoot: root, requirement, host: provider, decisionId: decision.id, now, ...overrides });
  const blocked = async (overrides = {}, code) => {
    const result = await inspect(overrides);
    assert.notEqual(result.decision_status, 'verified');
    assert.equal(result.authority, 'not-verified');
    assert.deepEqual(result.allowed_actions, []);
    if (code) assert(result.errors.some(e => e.code === code), JSON.stringify(result.errors));
  };
  await check('exact synthetic decision verifies only authority', async () => {
    const result = await inspect();
    assert.equal(result.decision_status, 'verified');
    assert.equal(result.authority, 'verified');
    assert.equal(result.state, 'pending');
    assert.deepEqual(result.allowed_actions, []);
    assert.equal(result.decision.source.id, 'host-record-1');
  });
  await check('workspace approval JSON cannot replace a provider', async () => {
    put('approval.json', JSON.stringify({ ...decision, verified: true }));
    await blocked({ host: undefined }, 'provider-unavailable');
    await blocked({ host: { ...host, resolveDecision: true } }, 'provider-unavailable');
  });
  for (const [name, edit, code] of [
    ['wrong actor', { actor: 'someone-else' }, 'identity'],
    ['wrong role', { role: 'observer' }, 'identity'],
    ['wrong provider', { provider: 'other' }, 'identity'],
    ['agent message', { origin: 'agent' }, 'provenance'],
    ['exported user role', { origin: 'userMessage' }, 'provenance'],
    ['wrong decision id', { id: 'other' }, 'identity'],
    ['wrong scope', { subject: 'other-app' }, 'scope'],
    ['wrong kind', { kind: 'freeze' }, 'scope'],
    ['wrong action', { action: 'build' }, 'scope'],
    ['wrong fingerprint', { fingerprint: hash('old') }, 'stale'],
    ['revoked', { status: 'revoked' }, 'revoked'],
    ['superseded', { status: 'superseded' }, 'revoked'],
    ['rejected', { verdict: 'reject' }, 'rejected'],
    ['future decision', { decided_at: '2027-01-01T00:00:00Z' }, 'chronology'],
    ['decision before review', { decided_at: '2026-10-03T09:00:00Z' }, 'chronology'],
    ['expired', { expires_at: '2026-10-03T11:59:00Z' }, 'expired'],
    ['missing source revision', { source: { id: 'host-record-1' } }, 'malformed-decision'],
  ]) {
    await check(name, async () => { canonical = { ...decision, ...edit }; await blocked({}, code); });
  }
  canonical = structuredClone(decision);
  await check('lookups are fresh and revoked decisions stop verifying', async () => {
    const before = lookupCount;
    assert.equal((await inspect()).decision_status, 'verified');
    canonical.status = 'revoked'; await blocked({}, 'revoked');
    assert.equal(lookupCount, before + 2);
    canonical = structuredClone(decision);
  });
  await check('provider failure and malformed results fail closed', async () => {
    await blocked({ host: { ...host, resolveDecision: async () => { throw new Error('offline'); } } }, 'provider-error');
    await blocked({ host: { ...host, resolveDecision: async () => null } }, 'missing');
    await blocked({ host: { ...host, resolveDecision: async () => true } }, 'malformed-decision');
  });
  await check('lookup timeout aborts and cannot grant authority', async () => {
    let aborted = false;
    await blocked({ timeoutMs: 5, host: { ...host, resolveDecision: ({ signal }) => new Promise(() => signal.addEventListener('abort', () => { aborted = true; })) } }, 'provider-error');
    assert.equal(aborted, true);
  });
  await check('review and provider method changes invalidate old approval', async () => {
    await blocked({ requirement: { ...requirement, review: { ...requirement.review, method_hash: hash('new review') } } }, 'stale');
    await blocked({ host: { ...provider, method_hash: hash('new policy') } }, 'stale');
  });
  await check('stage model changes invalidate old approval', async () => {
    put('model.json', JSON.stringify({ ...model, variant: 'changed' }));
    await blocked({}, 'stale');
    put('model.json', JSON.stringify(model));
  });
  await check('invalid model and phase cannot form an approval request', async () => {
    await blocked({ requirement: { ...requirement, phase: 'missing' } }, 'request');
    put('model.json', '{invalid');
    await blocked({}, 'model');
    put('model.json', JSON.stringify(model));
  });
  await check('existing selection and freeze phases cannot request definition approval', async () => {
    const expanded = structuredClone(model);
    expanded.stages[0].phases.push(
      { id: 'selection', name: 'Selection', gates: [] },
      { id: 'freeze', name: 'Freeze', gates: [] },
    );
    put('model.json', JSON.stringify(expanded));
    for (const phase of ['selection', 'freeze']) {
      assert.throws(() => applicationDecisionRequest({ initiativeRoot: root, host, requirement: { ...requirement, phase } }), /definition-source/);
    }
    put('model.json', JSON.stringify(model));
  });
  await check('host policy changes during lookup invalidate the answer', async () => {
    const changingHost = { ...host, resolveDecision: async () => { changingHost.method_hash = hash('changed policy'); return decision; } };
    await blocked({ host: changingHost }, 'inputs-changed');
  });
  await check('source mutation during host lookup invalidates result', async () => {
    await blocked({ host: { ...host, resolveDecision: async () => { put('requirements.md', source + 'changed'); return decision; } } }, 'inputs-changed');
    put('requirements.md', source);
  });
  await check('host cannot change expected query by mutation', async () => {
    const result = await inspect({ host: { ...host, resolveDecision: async query => { query.request.action = 'build'; return { ...decision, action: 'build' }; } } });
    assert.notEqual(result.decision_status, 'verified');
    assert.equal(result.request.action, 'concepts');
  });
  await check('source-only phase remains blocked after a verified decision', async () => {
    assert.equal((await inspect()).decision_status, 'verified');
    const result = await recordAdvance({ root, home, execute: true });
    assert.equal(result.ok, false);
    assert.equal(existsSync(join(root, '.blueprint/stage-state.json')), false);
  });
  await check('fresh stamp delivers the decision verifier', async () => {
    const target = join(root, 'stamped'); mkdirSync(target);
    execFileSync(process.execPath, [join(home, 'template/tools/blueprint-init/stamp.mjs'), `--target=${target}`, '--name=decision-fixture', '--variant=research', '--tier=0'], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    const stamped = await import(pathToFileURL(join(target, 'tools/lib/application-definition-decisions.mjs')).href);
    assert.equal(typeof stamped.inspectApplicationDecision, 'function');
    const result = await stamped.inspectApplicationDecision({ initiativeRoot: root, requirement, decisionId: decision.id });
    assert.equal(result.authority, 'not-verified');
  });
  console.log(`decision-smoke: PASS (${checks} synthetic checks; no live approval)`);
} finally { rmSync(root, { recursive: true, force: true }); }
