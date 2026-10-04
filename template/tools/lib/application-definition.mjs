// application-definition.mjs — dormant source inspection for a declared
// document-input v1 mapping. This verifies inputs only; it never verifies a
// reviewer, decision authority, or phase completion.
import { existsSync, readFileSync, realpathSync, statSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { readTopLevelYamlScalar } from './yaml-scalar.mjs';
import { inspectDocuments } from './application-definition-documents.mjs';
import { invokedDirectly } from './invoked-directly.mjs';

const REQUIRED_ROLES = ['brd', 'prd', 'stories', 'pages', 'interactions', 'journeys-words', 'journeys-visual'];
const sha = value => createHash('sha256').update(value).digest('hex');
const methodFiles = ['application-definition.mjs', 'application-definition-documents.mjs', 'yaml-scalar.mjs'];
const methodPaths = methodFiles.map(name => fileURLToPath(new URL(name, import.meta.url)));
const methodHash = () => sha(JSON.stringify(methodPaths.map((path, index) => [methodFiles[index], sha(readFileSync(path))])));
const loadedMethodHash = methodHash();
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const noPathEscape = (value) => typeof value === 'string' && value.trim() && !isAbsolute(value) && !value.includes('\\') && !value.split('/').some(part => !part || part === '.' || part === '..');
const baseResult = () => ({ state: 'absent', mode: 'application-definition-source', source_status: 'fail', authority: 'not-verified', allowed_actions: [], review_required: ['substantive multi-actor review', 'trusted human authority decision'], errors: [] });

function declarations(yml) {
  const root = [], nested = [];
  for (const raw of yml.split(/\r?\n/)) {
    const match = /^(\s*)application_definition:(?:\s*(.*))?$/.exec(raw);
    if (!match) continue;
    (match[1] ? nested : root).push({ value: match[2] ?? '', line: raw });
  }
  return { root, nested };
}
function contained(root, rel, label) {
  if (!noPathEscape(rel)) throw new Error(`${label} must be a relative path without dot segments`);
  const path = resolve(root, rel);
  const actual = realpathSync(path);
  if (!actual.startsWith(root + sep)) throw new Error(`${label} escapes initiative root`);
  if (!statSync(actual).isFile()) throw new Error(`${label} is not a file`);
  return actual;
}

export function resolveApplicationDefinition(initiativeRoot) {
  try {
    const root = realpathSync(resolve(initiativeRoot));
    const ymlPath = contained(root, 'blueprint.yml', 'root blueprint.yml');
    const yml = readFileSync(ymlPath, 'utf8');
    const found = declarations(yml);
    if (found.root.length !== 1) throw new Error(found.root.length ? 'duplicate root application_definition declarations' : 'missing root application_definition declaration');
    const declared = readTopLevelYamlScalar(yml, 'application_definition');
    if (!declared || !noPathEscape(declared)) throw new Error('root application_definition must select one relative JSON mapping');
    const manifestPath = contained(root, declared, 'application_definition');
    if (!manifestPath.endsWith('.json')) throw new Error('application_definition must select a JSON mapping');
    const configInputs = [['blueprint.yml', yml]];
    const nestedRel = 'blueprint/blueprint.yml';
    if (existsSync(join(root, nestedRel))) {
      const nestedPath = contained(root, nestedRel, 'nested blueprint.yml');
      const nestedYml = readFileSync(nestedPath, 'utf8');
      const nestedFound = declarations(nestedYml).root;
      if (nestedFound.length > 1) throw new Error('duplicate nested application_definition declarations');
      if (nestedFound.length) {
        const nested = readTopLevelYamlScalar(nestedYml, 'application_definition');
        if (!noPathEscape(nested) || resolve(root, 'blueprint', nested) !== resolve(root, declared)) throw new Error('nested blueprint.yml application_definition conflicts with the root selector');
      }
      configInputs.push([nestedRel, nestedYml]);
    }
    const manifestBytes = readFileSync(manifestPath, 'utf8');
    let manifest;
    try { manifest = JSON.parse(manifestBytes); } catch (error) { throw new Error(`application_definition JSON is unreadable: ${error.message}`); }
    if (!plain(manifest)) throw new Error('application_definition JSON must contain one mapping object');
    return { ok: true, initiativeRoot: root, yml, ymlPath, declaration: declared, manifestPath, manifest, manifestBytes, configInputs };
  } catch (error) { return { ok: false, error: error.message }; }
}

// A precise list for cache/freshness callers. It deliberately throws instead of
// omitting an unreadable or unsafe dynamic input, so a changed declaration can
// never leave a recorded result falsely fresh.
export function applicationDefinitionInputs(initiativeRoot) {
  const inspection = inspectApplicationDefinition({ initiativeRoot });
  if (inspection.source_status !== 'pass') throw new Error(inspection.errors.map(error => error.detail).join('; '));
  const resolved = resolveApplicationDefinition(initiativeRoot);
  if (!resolved.ok) throw new Error(resolved.error);
  if (!Array.isArray(resolved.manifest.sources)) throw new Error('application_definition manifest sources must be an array');
  // Absolute file inventory, not reviewer-registry globs. Recompute per check.
  const inputs = [resolved.manifestPath, ...methodPaths, ...resolved.configInputs.map(([path]) => contained(resolved.initiativeRoot, path, 'configuration'))];
  for (const source of resolved.manifest.sources) inputs.push(contained(resolved.initiativeRoot, source?.path, 'declared source'));
  for (const path of inputs) readFileSync(path);
  return [...new Set(inputs)].sort();
}

export function inspectApplicationDefinition({ initiativeRoot }) {
  try {
    // Node caches imported code: never label old execution with a new disk hash.
    if (methodHash() !== loadedMethodHash) return { ...baseResult(), execution_error: true, errors: [{ code: 'method-changed', detail: 'application definition checker changed after loading; restart the checker' }] };
    const resolved = resolveApplicationDefinition(initiativeRoot);
    if (!resolved.ok) return { ...baseResult(), execution_error: true, errors: [{ code: 'configuration', detail: resolved.error }] };
    const configHash = sha(JSON.stringify([resolved.declaration, resolved.configInputs, resolved.manifestBytes]));
    const result = inspectDocuments(resolved.initiativeRoot, resolved.manifest, REQUIRED_ROLES, loadedMethodHash);
    result.mode = 'application-definition-source';
    result.manifest = relative(resolved.initiativeRoot, resolved.manifestPath).split(sep).join('/');
    result.declaration = resolved.declaration;
    result.config_hash = configHash;
    result.source_fingerprint = sha(JSON.stringify([configHash, result.fingerprint, result.sources.map(source => [source.path, source.sha256])]));
    result.authority = 'not-verified'; result.allowed_actions = [];
    if (result.errors.some(error => error.code === 'shape')) result.execution_error = true;
    if (result.errors.length) { result.source_status = 'fail'; result.state = 'absent'; }
    else result.state = 'pending';
    return result;
  } catch (error) { return { ...baseResult(), execution_error: true, errors: [{ code: 'inspection-error', detail: error.message }] }; }
}

async function selftest() {
  const root = mkdtempSync(join(tmpdir(), 'bp-application-definition-'));
  try {
    const source = '## BR-01 — Request\n';
    const manifest = { version: 1, scope: { id: 'fixture', owner: 'owner', boundary: 'fixture', extent: 'bounded-change', included: ['one'], excluded: ['rest'] }, sources: [{ path: 'requirements.md', sha256: sha(source), roles: ['brd', 'prd', 'stories'], scan_references: true }], inventories: [{ name: 'business', prefix: 'BR-', digits: 2, source: 'requirements.md', format: 'heading' }] };
    mkdirSync(join(root, 'blueprint')); writeFileSync(join(root, 'requirements.md'), source); writeFileSync(join(root, 'blueprint', 'definition.json'), JSON.stringify(manifest)); writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
    const good = inspectApplicationDefinition({ initiativeRoot: root });
    assert.equal(good.source_status, 'pass'); assert.equal(good.state, 'pending'); assert.equal(good.authority, 'not-verified'); assert.deepEqual(good.allowed_actions, []); assert(good.source_fingerprint && good.method_hash);
    assert(applicationDefinitionInputs(root).some(path => path.endsWith('/blueprint/definition.json')), 'input inventory includes the selected mapping');
    const methodA = inspectDocuments(root, manifest, REQUIRED_ROLES, 'checker-a').method_hash;
    const methodB = inspectDocuments(root, manifest, REQUIRED_ROLES, 'checker-b').method_hash;
    assert.notEqual(methodA, methodB, 'checker entrypoint changes invalidate the inspection method fingerprint');
    const missing = structuredClone(manifest); missing.sources[0].path = 'missing.md';
    writeFileSync(join(root, 'blueprint', 'definition.json'), JSON.stringify(missing)); assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).source_status, 'fail', 'missing declared source fails');
    assert.throws(() => applicationDefinitionInputs(root), /ENOENT|declared source/, 'dynamic input inventory fails closed on a missing source');
    writeFileSync(join(root, 'blueprint', 'definition.json'), JSON.stringify(manifest)); symlinkSync('/etc/hosts', join(root, 'escape.md'));
    const escaped = structuredClone(manifest); escaped.sources.push({ path: 'escape.md', sha256: sha('x'), roles: ['context'], scan_references: false });
    writeFileSync(join(root, 'blueprint', 'definition.json'), JSON.stringify(escaped)); assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).source_status, 'fail', 'symlink source escape fails');
    writeFileSync(join(root, 'blueprint', 'definition.json'), JSON.stringify(manifest));
    writeFileSync(join(root, 'blueprint.yml'), 'application_definition: missing.json\n'); assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true);
    writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\napplication_definition: blueprint/definition.json\n'); assert.equal(resolveApplicationDefinition(root).ok, false);
    writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
    writeFileSync(join(root, 'blueprint/blueprint.yml'), 'application_definition: other.json\n');
    assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'conflicting nested config file rejects');
    writeFileSync(join(root, 'blueprint/blueprint.yml'), 'application_definition: definition.json\n');
    assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).source_status, 'pass', 'the same selected file is unambiguous');
    writeFileSync(join(root, 'blueprint.yml'), 'variant: research\n');
    assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'nested-only config cannot select');
    rmSync(join(root, 'blueprint/blueprint.yml'));
    writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
    writeFileSync(join(root, 'blueprint/definition.json'), JSON.stringify({ ...manifest, version: 99 }));
    assert.throws(() => applicationDefinitionInputs(root), /unsupported/, 'unknown schema cannot provide a freshness input list');
    writeFileSync(join(root, 'blueprint/definition.json'), JSON.stringify(manifest));
    const configHash = inspectApplicationDefinition({ initiativeRoot: root }).source_fingerprint;
    writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n# changed\n');
    assert.notEqual(inspectApplicationDefinition({ initiativeRoot: root }).source_fingerprint, configHash);
    const outside = mkdtempSync(join(tmpdir(), 'bp-definition-outside-'));
    try {
      writeFileSync(join(outside, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
      rmSync(join(root, 'blueprint.yml')); symlinkSync(join(outside, 'blueprint.yml'), join(root, 'blueprint.yml'));
      assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'configuration symlink escape rejects');
      rmSync(join(root, 'blueprint.yml')); writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
      writeFileSync(join(outside, 'definition.json'), JSON.stringify(manifest));
      symlinkSync(join(outside, 'definition.json'), join(root, 'outside.json'));
      writeFileSync(join(root, 'blueprint.yml'), 'application_definition: outside.json\n');
      assert.equal(inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'manifest symlink escape rejects');
      writeFileSync(join(root, 'blueprint.yml'), 'application_definition: blueprint/definition.json\n');
    } finally { rmSync(outside, { recursive: true, force: true }); }
    const methodCopy = join(root, 'method'); mkdirSync(methodCopy);
    for (const name of [...methodFiles, 'invoked-directly.mjs']) copyFileSync(new URL(name, import.meta.url), join(methodCopy, name));
    const copied = await import(pathToFileURL(join(methodCopy, 'application-definition.mjs')).href);
    assert.equal(copied.inspectApplicationDefinition({ initiativeRoot: root }).source_status, 'pass');
    const scannerPath = join(methodCopy, 'application-definition-documents.mjs');
    writeFileSync(scannerPath, readFileSync(scannerPath, 'utf8') + '\n// method changed\n');
    assert.equal(copied.inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'cached checker detects changed method bytes');
    const refreshed = await import(pathToFileURL(join(methodCopy, 'application-definition.mjs')).href + '?fresh');
    assert.equal(refreshed.inspectApplicationDefinition({ initiativeRoot: root }).execution_error, true, 'fresh wrapper cannot hide a cached dependency');
    console.log('application-definition self-test: PASS');
  } finally { rmSync(root, { recursive: true, force: true }); }
}
if (invokedDirectly(import.meta.url) && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))) await selftest();
