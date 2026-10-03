import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { evaluate, evaluateDocuments } from './gate.mjs';

const hash = s => createHash('sha256').update(s).digest('hex');
const gate = new URL('./gate.mjs', import.meta.url);
let passed = 0;
function test(name, run) {
  const parent = mkdtempSync(join(tmpdir(), 'bp-document-input-')), root = join(parent, 'source');
  mkdirSync(root);
  const text = {
    'requirements.md': '| **BR-01** | Submit a request. |\n| **BR-02** | Approve the request. |\n',
    'stories.md': '## US-01 — Complete the request\nTrace: BR-01/02.\n- **AC-01.1** Given input, save it.\n- **AC-01.2** Given a pending request, find it.\n- **AC-01.3** Given a decision, return to the requester.\n',
    'application.md': '## I01 — Submit\nRequester submits to reviewer.\n## I02 — Decide\nReviewer approves or returns the request.\n## J01 — Request and decision\nUS-01 uses I01–I02; covers AC-01.1–01.3.\n```mermaid\nflowchart LR\n  A --> B\n  B --> C\n  B --> A\n```\n',
  };
  for (const [path, body] of Object.entries(text)) writeFileSync(join(root, path), body);
  const manifest = {
    version: 1,
    scope: { id: 'fictional-request', owner: 'Declared owner', boundary: 'Fictional request application', extent: 'whole-application', included: ['Request and decision'], excluded: [] },
    sources: [
      { path: 'requirements.md', roles: ['brd', 'prd'], scan_references: true },
      { path: 'stories.md', roles: ['stories'], scan_references: true },
      { path: 'application.md', roles: ['pages', 'interactions', 'journeys-words', 'journeys-visual'], scan_references: true },
    ].map(s => ({ ...s, sha256: hash(text[s.path]) })),
    inventories: [
      { name: 'business', prefix: 'BR-', digits: 2, source: 'requirements.md', format: 'table' },
      { name: 'stories', prefix: 'US-', digits: 2, source: 'stories.md', format: 'heading' },
      { name: 'acceptance', prefix: 'AC-', digits: 2, source: 'stories.md', format: 'list' },
      { name: 'interactions', prefix: 'I', digits: 2, source: 'application.md', format: 'heading' },
      { name: 'journeys', prefix: 'J', digits: 2, source: 'application.md', format: 'heading' },
    ],
  };
  const edit = (path, transform, repin = true) => {
    writeFileSync(join(root, path), transform(readFileSync(join(root, path), 'utf8')));
    if (repin) manifest.sources.find(s => s.path === path).sha256 = hash(readFileSync(join(root, path)));
  };
  try { run({ root, parent, manifest, edit }); passed++; }
  catch (error) { process.stderr.write(`FAIL: ${name}\n`); throw error; }
  finally { rmSync(parent, { recursive: true, force: true }); }
}
function pending(result) {
  assert.equal(result.source_status, 'pass', JSON.stringify(result.errors));
  assert.equal(result.state, 'pending');
  assert.equal(result.authority, 'not-verified');
  assert.deepEqual(result.allowed_actions, []);
  assert(result.review_required.length);
}
function blocked(result, code) {
  assert.equal(result.source_status, 'fail');
  assert.equal(result.state, 'absent');
  assert.deepEqual(result.allowed_actions, []);
  assert(result.errors.some(e => e.code === code), JSON.stringify(result.errors));
}

test('valid documents remain pending and source files remain unchanged', ({ root, manifest }) => {
  const before = manifest.sources.map(s => readFileSync(join(root, s.path)));
  const result = evaluateDocuments(root, manifest);
  pending(result);
  assert.equal(result.inventories[0].records[0].line, 1);
  assert.equal(result.inventories[0].records[0].id, 'BR-01');
  assert(result.references.some(r => r.id === 'AC-01.2' && r.path === 'application.md'));
  assert(result.references.some(r => r.id === 'BR-02' && r.path === 'stories.md'));
  manifest.sources.forEach((s, i) => assert.deepEqual(readFileSync(join(root, s.path)), before[i]));
});
test('prose actor handoff and branches are retained without inferred single-actor continuity', ({ root, manifest }) => {
  pending(evaluateDocuments(root, manifest));
  assert(readFileSync(join(root, 'application.md'), 'utf8').includes('Reviewer approves or returns'));
});
test('malformed ID suffix cannot pass as a valid prefix', ({ root, manifest, edit }) => {
  edit('application.md', s => s + '\nUse US-01-retired and US-01.retired.\n');
  const result = evaluateDocuments(root, manifest);
  blocked(result, 'unknown-reference');
  assert(result.errors.some(e => e.detail === 'US-01-retired'));
  assert(result.errors.some(e => e.detail === 'US-01.retired'));
});
test('malformed definition cannot define its valid prefix', ({ root, manifest, edit }) => {
  edit('stories.md', s => s.replace('## US-01 —', '## US-01-retired —'));
  blocked(evaluateDocuments(root, manifest), 'inventory-empty');
});
test('fenced examples do not create broken references', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\n```text\nI99\n```\n');
  pending(evaluateDocuments(root, manifest));
});
test('owned Mermaid references are still checked', ({ root, manifest, edit }) => {
  edit('application.md', s => s.replace('  A --> B', '  A -->|I99| B'));
  blocked(evaluateDocuments(root, manifest), 'unknown-reference');
});
test('stale source fails without refreshing its pin', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\nChanged acceptance.\n', false);
  blocked(evaluateDocuments(root, manifest), 'stale-source');
});
test('repinning changes fingerprint but does not grant review or approval', ({ root, manifest, edit }) => {
  const before = evaluateDocuments(root, manifest);
  edit('stories.md', s => s + '\nChanged acceptance.\n');
  const after = evaluateDocuments(root, manifest);
  pending(after);
  assert.notEqual(before.fingerprint, after.fingerprint);
});
test('unknown interaction fails with its source location', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\nUse I99.\n');
  const result = evaluateDocuments(root, manifest);
  blocked(result, 'unknown-reference');
  assert(result.errors.some(e => e.detail === 'I99' && e.path === 'stories.md' && e.line === 7));
});
test('removed definition is detected after repinning', ({ root, manifest, edit }) => {
  edit('application.md', s => s.replace('## I02 — Decide', '## Decision'));
  blocked(evaluateDocuments(root, manifest), 'unknown-reference');
});
test('missing middle of decimal range is detected', ({ root, manifest, edit }) => {
  edit('stories.md', s => s.replace('- **AC-01.2** Given a pending request, find it.\n', ''));
  const result = evaluateDocuments(root, manifest);
  blocked(result, 'unknown-reference');
  assert(result.errors.some(e => e.detail === 'AC-01.2'));
});
test('slash chains and integer shorthand preserve exact IDs', ({ root, manifest, edit }) => {
  edit('application.md', s => s + '\nBR-01/02/01 and I01–02 and I01-I02 and BR-01-BR-02 and AC-01.1/01.2/01.3.\n');
  pending(evaluateDocuments(root, manifest));
});
test('unsupported descending and cross-section ranges fail', ({ root, manifest, edit }) => {
  edit('application.md', s => s + '\nBR-02–01 and AC-01.1–02.3.\n');
  blocked(evaluateDocuments(root, manifest), 'unsupported-range');
});
test('unbounded numeric expansion is rejected', ({ root, manifest, edit }) => {
  edit('application.md', s => s + '\nI01–999999999999999999.\n');
  blocked(evaluateDocuments(root, manifest), 'unsupported-range');
});
test('duplicate owned definition is detected', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\n## US-01 — Duplicate\n');
  blocked(evaluateDocuments(root, manifest), 'duplicate-definition');
});
test('fenced examples do not count as definitions', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\n```markdown\n## US-01 — Example\n```\n');
  pending(evaluateDocuments(root, manifest));
});
test('empty and missing sources fail', ({ root, manifest, edit }) => {
  edit('requirements.md', () => '');
  blocked(evaluateDocuments(root, manifest), 'empty-source');
  rmSync(join(root, 'application.md'));
  blocked(evaluateDocuments(root, manifest), 'source-read');
});
test('missing whole-application role fails', ({ root, manifest }) => {
  manifest.sources[2].roles = ['pages', 'interactions', 'journeys-words'];
  blocked(evaluateDocuments(root, manifest), 'artifact-role');
});
test('bounded slice does not invent a whole-app visual requirement', ({ root, manifest }) => {
  manifest.scope.extent = 'bounded-change';
  manifest.scope.excluded = ['Other application surfaces and historical selection review'];
  manifest.sources[2].roles = ['contract'];
  pending(evaluateDocuments(root, manifest));
});
test('bounded scope must declare exclusions', ({ root, manifest }) => {
  manifest.scope.extent = 'bounded-change';
  blocked(evaluateDocuments(root, manifest), 'shape');
});
test('unavailable exported inventory stays explicit and unverified', ({ root, manifest, edit }) => {
  edit('stories.md', s => s + '\nPrivate inventory omitted. See V-01/V-02.\n');
  manifest.inventories.push({ name: 'views', prefix: 'V-', digits: 2, source: null, unavailable_reason: 'Not exported.', evidence: { source: 'stories.md', text: 'Private inventory omitted.' } });
  const result = evaluateDocuments(root, manifest);
  pending(result);
  assert.equal(result.external_references.length, 2);
  assert.equal(result.inventories.at(-1).availability, 'unavailable');
});
test('unavailable reason requires matching source anchor', ({ root, manifest }) => {
  manifest.inventories.push({ name: 'views', prefix: 'V-', digits: 2, source: null, unavailable_reason: 'Not exported.', evidence: { source: 'stories.md', text: 'This is not in the source.' } });
  blocked(evaluateDocuments(root, manifest), 'evidence-anchor');
});
test('path traversal and absolute sources fail', ({ root, manifest }) => {
  for (const path of ['../outside.md', '/etc/hosts']) {
    const copy = structuredClone(manifest);
    copy.sources[0].path = path;
    blocked(evaluateDocuments(root, copy), 'source-read');
  }
});
test('symlink outside declared root fails', ({ root, parent, manifest }) => {
  writeFileSync(join(parent, 'outside.md'), 'Outside');
  symlinkSync(join(parent, 'outside.md'), join(root, 'escape.md'));
  manifest.sources.push({ path: 'escape.md', sha256: hash('Outside'), roles: ['context'], scan_references: false });
  blocked(evaluateDocuments(root, manifest), 'source-read');
});
for (const [name, mutate] of [
  ['version', m => m.version = 2],
  ['approval field', m => m.approval = 'approved by owner'],
  ['unknown extent', m => m.scope.extent = 'auto-pass'],
  ['malformed hash', m => m.sources[0].sha256 = 'anything'],
  ['duplicate source', m => m.sources.push(m.sources[0])],
  ['duplicate prefix', m => m.inventories[1].prefix = 'BR-'],
  ['unsupported selector', m => m.inventories[0].format = 'eval'],
  ['undeclared inventory source', m => m.inventories[0].source = 'other.md'],
]) test(`malformed ${name} fails closed`, ({ root, manifest }) => {
  mutate(manifest);
  blocked(evaluateDocuments(root, manifest), 'shape');
});
test('structured gate never falls back to document mode', ({ root }) => {
  const result = evaluate(root);
  assert.equal(result.state, 'absent');
  assert(result.errors.some(e => e.code === 'shape'));
});
test('CLI exposes pending and nonzero failure status with bounded subprocess IO', ({ root, parent, manifest, edit }) => {
  const path = join(parent, 'mapping.json');
  writeFileSync(path, JSON.stringify(manifest));
  const run = (...args) => spawnSync(process.execPath, [gate.pathname, ...args], { input: '', timeout: 10000, encoding: 'utf8' });
  let child = run('--documents', root, path);
  assert.equal(child.status, 0, child.stderr);
  pending(JSON.parse(child.stdout));
  edit('requirements.md', s => s + '\nChanged\n', false);
  child = run('--documents', root, path);
  assert.equal(child.status, 1, child.stderr);
  blocked(JSON.parse(child.stdout), 'stale-source');
  assert.equal(run('--not-documents', root, path).status, 2);
});
const caseArgs = process.argv.slice(2);
assert.equal(caseArgs.length % 3, 0, 'Use repeated --case <source-root> <mapping.json> arguments.');
for (let index = 0; index < caseArgs.length; index += 3) {
  assert.equal(caseArgs[index], '--case');
  const sourceRoot = resolve(caseArgs[index + 1]);
  const manifest = JSON.parse(readFileSync(caseArgs[index + 2], 'utf8'));
  pending(evaluateDocuments(sourceRoot, manifest));
  const before = manifest.sources.map(s => hash(readFileSync(join(sourceRoot, s.path))));
  const root = mkdtempSync(join(tmpdir(), 'bp-document-case-'));
  try {
    // A successful inspection above establishes containment before copying.
    for (const source of manifest.sources) {
      mkdirSync(dirname(join(root, source.path)), { recursive: true });
      copyFileSync(join(sourceRoot, source.path), join(root, source.path));
    }
    const source = manifest.sources.find(s => s.scan_references);
    const original = readFileSync(join(root, source.path));
    writeFileSync(join(root, source.path), Buffer.concat([original, Buffer.from('\nChanged source for a negative control.\n')]));
    blocked(evaluateDocuments(root, manifest), 'stale-source');
    passed++;
    const inventory = manifest.inventories.find(i => i.source !== null);
    const missing = inventory.prefix + '9'.repeat(Math.max(6, inventory.digits));
    writeFileSync(join(root, source.path), Buffer.concat([original, Buffer.from(`\nUnknown reference: ${missing}.\n`)]));
    source.sha256 = hash(readFileSync(join(root, source.path)));
    const unknown = evaluateDocuments(root, manifest);
    blocked(unknown, 'unknown-reference');
    assert(unknown.errors.some(e => e.detail === missing));
    passed++;
    writeFileSync(join(root, source.path), original);
    source.sha256 = hash(original);
    const good = evaluateDocuments(root, manifest);
    const records = good.inventories.flatMap(i => i.records);
    const referenced = records.find(r => good.references.some(ref => ref.id === r.id && (ref.path !== r.path || ref.line !== r.line)));
    assert(referenced, 'case needs an owned definition referenced elsewhere for the deletion control');
    const lines = readFileSync(join(root, referenced.path), 'utf8').split(/\r?\n/);
    lines.splice(referenced.line - 1, 1);
    writeFileSync(join(root, referenced.path), lines.join('\n'));
    manifest.sources.find(s => s.path === referenced.path).sha256 = hash(readFileSync(join(root, referenced.path)));
    const removed = evaluateDocuments(root, manifest);
    blocked(removed, 'unknown-reference');
    assert(removed.errors.some(e => e.detail === referenced.id));
    passed++;
  } finally {
    rmSync(root, { recursive: true, force: true });
    manifest.sources.forEach((s, i) => assert.equal(hash(readFileSync(join(sourceRoot, s.path))), before[i], 'case source changed'));
  }
}
console.log(`PASS: ${passed} document-input controls (${caseArgs.length / 3} supplied case snapshots; no product acceptance).`);
