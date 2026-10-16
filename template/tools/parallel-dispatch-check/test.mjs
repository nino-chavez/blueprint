#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check.sh', import.meta.url));
const tmp = mkdtempSync(path.join(os.tmpdir(), 'dispatch plan test '));
const root = path.join(tmp, 'project with spaces');
mkdirSync(root);
const sourceText = '# Plan\nREQ-1: add the handler\nREQ-2: document its behavior\n';
writeFileSync(path.join(root, 'spec.md'), sourceText);
const task = (id, covers, edits) => ({ id, covers, reads: ['spec.md'], edits, depends_on: [], verification: ['Run the focused regression test'] });
const base = () => ({
  version: 1,
  source: { path: 'spec.md', sha256: createHash('sha256').update(sourceText).digest('hex') },
  requirements: ['REQ-1', 'REQ-2'],
  tasks: [task('code', ['REQ-1'], ['src/new.ts']), task('docs', ['REQ-2'], ['docs/new.md'])],
});
let cases = 0;
function run(args, cwd = tmp) {
  const result = spawnSync('bash', [script, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null, result.stderr);
  return result;
}
function check(label, mutate, expected = 1, message = /FAIL:/) {
  const plan = base();
  mutate(plan);
  const file = path.join(tmp, 'plan.json');
  writeFileSync(file, JSON.stringify(plan));
  const result = run(['--plan', file, '--root', root]);
  assert.equal(result.status, expected, `${label}: ${result.stdout}${result.stderr}`);
  assert.match(result.stdout + result.stderr, message, label);
  if (expected === 0) assert.doesNotMatch(result.stdout, /\bSAFE\b|authorized|accepted|complete/);
  cases++;
}
try {
  check('future disjoint edits and shared reads', () => {}, 0, /structural checks passed/);
  check('directory boundary is exact', (p) => { p.tasks[0].edits = ['src/a']; p.tasks[1].edits = ['src/abc']; }, 0, /structural checks passed/);
  check('read-only tasks may share directories', (p) => { for (const t of p.tasks) { t.edits = []; t.reads = ['src/']; } }, 0, /structural checks passed/);
  check('direct dependency orders an overlap', (p) => { p.tasks[1].reads = ['src/new.ts']; p.tasks[1].depends_on = ['code']; }, 0, /structural checks passed/);
  check('dependency order is independent of task array order', (p) => { p.tasks[0].edits = ['docs/']; p.tasks[0].depends_on = ['docs']; }, 0, /structural checks passed/);
  check('transitive dependency orders an overlap', (p) => { p.tasks.push(task('review', ['REQ-1'], ['src/new.ts'])); p.tasks[1].depends_on = ['code']; p.tasks[2].depends_on = ['docs']; }, 0, /structural checks passed/);
  check('shared prerequisite does not order siblings', (p) => { p.tasks.push(task('setup', ['REQ-1'], ['setup.txt'])); p.tasks[0].depends_on = ['setup']; p.tasks[1].depends_on = ['setup']; p.tasks[1].edits = ['src/']; }, 1, /unordered conflict/);
  check('exact future file conflict', (p) => { p.tasks[1].edits = ['src/new.ts']; }, 1, /unordered conflict/);
  check('future directory conflict', (p) => { p.tasks[1].edits = ['src/']; }, 1, /unordered conflict/);
  check('file prefix without slash remains conservative', (p) => { p.tasks[1].edits = ['src']; }, 1, /unordered conflict/);
  check('read after unordered edit', (p) => { p.tasks[1].reads = ['src/new.ts']; }, 1, /unordered conflict/);
  check('edit after unordered read', (p) => { p.tasks[0].reads = ['docs/']; }, 1, /unordered conflict/);
  check('case-folded paths conflict', (p) => { p.tasks[1].edits = ['SRC/NEW.ts']; }, 1, /unordered conflict/);
  check('unicode normalization aliases conflict', (p) => { p.tasks[0].edits = ['café/a']; p.tasks[1].edits = ['cafe\u0301/']; }, 1, /unordered conflict/);
  check('source changes stale the plan', (p) => { p.source.sha256 = '0'.repeat(64); }, 1, /stale source/);
  check('malformed digest', (p) => { p.source.sha256 = 'latest'; }, 1, /source.sha256/);
  check('missing source', (p) => { p.source.path = 'missing.md'; }, 1, /ENOENT/);
  mkdirSync(path.join(root, 'directory'));
  check('source must be a file', (p) => { p.source.path = 'directory'; }, 1, /must name a file/);
  check('source cannot have trailing slash', (p) => { p.source.path = 'spec.md/'; }, 1, /literal repository-relative file/);
  check('source paths cannot escape', (p) => { p.source.path = '../spec.md'; }, 1, /parent path segments/);
  check('unsupported version', (p) => { p.version = 2; }, 1, /version/);
  check('missing required key', (p) => { delete p.source; }, 1, /expected exactly/);
  check('unknown top-level field', (p) => { p.approved = true; }, 1, /expected exactly/);
  check('unknown source field', (p) => { p.source.ref = 'main'; }, 1, /expected exactly/);
  check('null source', (p) => { p.source = null; }, 1, /expected exactly/);
  check('empty requirements', (p) => { p.requirements = []; }, 1, /requirements/);
  check('non-array requirements', (p) => { p.requirements = 'REQ-1'; }, 1, /requirements/);
  check('duplicate requirements', (p) => { p.requirements.push('REQ-1'); }, 1, /requirements/);
  check('invalid requirement ID', (p) => { p.requirements[0] = 'REQ 1'; }, 1, /invalid ID/);
  check('uncovered requirement', (p) => { p.requirements.push('REQ-3'); }, 1, /uncovered REQ-3/);
  check('unknown requirement', (p) => { p.tasks[0].covers = ['REQ-3']; }, 1, /unknown requirement/);
  check('empty tasks', (p) => { p.tasks = []; }, 1, /tasks/);
  check('task not object', (p) => { p.tasks[0] = null; }, 1, /expected exactly/);
  check('duplicate task IDs', (p) => { p.tasks[1].id = 'code'; }, 1, /duplicate code/);
  check('invalid task ID', (p) => { p.tasks[0].id = ' code'; }, 1, /invalid ID/);
  check('unknown task field', (p) => { p.tasks[0].status = 'approved'; }, 1, /expected exactly/);
  for (const field of ['covers', 'reads', 'edits', 'depends_on', 'verification']) {
    check(`missing ${field}`, (p) => { delete p.tasks[0][field]; }, 1, /expected exactly/);
    check(`non-array ${field}`, (p) => { p.tasks[0][field] = null; }, 1, /expected .*array/);
    check(`blank ${field}`, (p) => { p.tasks[0][field] = [' ']; }, 1, /nonblank/);
    check(`duplicate ${field}`, (p) => { p.tasks[0][field] = ['a', 'a']; }, 1, /unique/);
  }
  check('empty coverage', (p) => { p.tasks[0].covers = []; }, 1, /nonempty array/);
  check('empty verification', (p) => { p.tasks[0].verification = []; }, 1, /nonempty array/);
  check('unknown dependency', (p) => { p.tasks[0].depends_on = ['missing']; }, 1, /unknown task/);
  check('self dependency', (p) => { p.tasks[0].depends_on = ['code']; }, 1, /cycle/);
  check('dependency cycle', (p) => { p.tasks[0].depends_on = ['docs']; p.tasks[1].depends_on = ['code']; }, 1, /cycle/);
  for (const scope of ['/src', '../src', './src', 'src//file', 'src/../file', 'src/*', 'src/?', 'src/[a]', 'src/{a,b}', 'C:/src', 'src\\file', 'src\nfile']) {
    check(`invalid scope ${JSON.stringify(scope)}`, (p) => { p.tasks[0].edits = [scope]; }, 1, /literal repository-relative|path segments/);
  }
  check('duplicate normalized scope', (p) => { p.tasks[0].edits = ['src', 'SRC/']; }, 1, /duplicate normalized/);
  check('existing parent must be a directory', (p) => { p.tasks[0].edits = ['spec.md/child']; }, 1, /parent is not a directory/);
  symlinkSync(root, path.join(root, 'alias'));
  check('symlink parent rejected', (p) => { p.tasks[0].edits = ['alias/future']; }, 1, /symlink/);
  symlinkSync(path.join(root, 'spec.md'), path.join(root, 'source-link'));
  check('symlink source rejected', (p) => { p.source.path = 'source-link'; }, 1, /symlink/);
  symlinkSync(path.join(tmp, 'absent'), path.join(root, 'dangling'));
  check('dangling symlink scope rejected', (p) => { p.tasks[0].reads = ['dangling']; }, 1, /symlink/);
  const planFile = path.join(root, 'plan.json');
  writeFileSync(planFile, JSON.stringify(base()));
  assert.equal(run(['--plan', 'plan.json'], root).status, 0, 'default root is cwd'); cases++;
  for (const [label, raw] of [
    ['duplicate edits', JSON.stringify(base()).replace('"edits":["docs/new.md"]', '"edits":["src/new.ts"],"edits":["docs/new.md"]')],
    ['escaped duplicate edits', JSON.stringify(base()).replace('"edits":["docs/new.md"]', String.raw`"edits":["src/new.ts"],"ed\u0069ts":["docs/new.md"]`)],
    ['duplicate version', JSON.stringify(base()).replace('"version":1', '"version":2,"version":1')],
    ['duplicate source path', JSON.stringify(base()).replace('"path":"spec.md"', '"path":"missing.md","path":"spec.md"')],
  ]) {
    writeFileSync(planFile, raw);
    const duplicate = run(['--plan', planFile, '--root', root]);
    assert.equal(duplicate.status, 1, label);
    assert.match(duplicate.stderr, /duplicate JSON member/, label); cases++;
  }
  check('key-looking text inside verification stays text', (p) => { p.tasks[0].verification = ['Check the "edits": ["a"] field; braces {} and a backslash \\ stay text']; }, 0, /structural checks passed/);
  writeFileSync(planFile, '{broken');
  assert.equal(run(['--plan', planFile, '--root', root]).status, 1, 'malformed JSON'); cases++;
  writeFileSync(planFile, 'null');
  assert.equal(run(['--plan', planFile, '--root', root]).status, 1, 'null JSON'); cases++;
  for (const args of [[], ['--plan'], ['--plan', '--root'], ['--plan', planFile, '--root'], ['--plan', planFile, '--other', root], ['--typo', planFile]]) {
    assert.equal(run(args).status, 2, `usage error ${args}`); cases++;
  }
  writeFileSync(path.join(root, 'one.txt'), 'one');
  writeFileSync(path.join(root, 'two.txt'), 'two');
  assert.equal(run(['one.txt', 'two.txt'], root).status, 0, 'legacy disjoint'); cases++;
  assert.equal(run(['*.txt', 'one.txt'], root).status, 1, 'legacy overlap'); cases++;
  const legacyGap = run(['src/*.brandnew', 'src/unfinished.brandnew'], root);
  assert.equal(legacyGap.status, 0, 'legacy exit behavior retained');
  assert.match(legacyGap.stdout, /Unmatched globs/);
  assert.doesNotMatch(legacyGap.stdout, /SAFE|Safe to dispatch/); cases++;
  // Changing actual source bytes, rather than only the plan digest, must fail.
  writeFileSync(planFile, JSON.stringify(base()));
  writeFileSync(path.join(root, 'spec.md'), sourceText + 'A changed condition.\n');
  const changed = run(['--plan', planFile, '--root', root]);
  assert.equal(changed.status, 1); assert.match(changed.stderr, /stale source/); cases++;
  console.log(`parallel-dispatch-check self-test: PASS (${cases} cases)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
