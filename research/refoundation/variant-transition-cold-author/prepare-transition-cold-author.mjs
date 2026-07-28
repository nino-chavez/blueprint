#!/usr/bin/env node
// Prepares an isolated, disposable cold-author fixture. It never writes the
// candidate or this repository: the caller must provide an output under /private/tmp.

import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, 'fixture-baseline');
const PACKET_NAME = 'AUTHOR-PACKET-v4.md';
const AUTHOR_PACKET = join(HERE, PACKET_NAME);
const TMP = '/private/tmp/';
const FROZEN_CANDIDATE = 'd372a63ee31433b720f066e81f3ab17fe2c5a7fa';

function fail(message) { console.error(`prepare-transition-cold-author: ${message}`); process.exit(2); }
function args(argv) {
  const out = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
  }
  return out;
}
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function git(root, parts) { return execFileSync('git', ['-C', root, ...parts], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function tmpPath(value, label) {
  if (!value || !isAbsolute(value) || !resolve(value).startsWith(TMP)) fail(`${label} must be an explicit path under /private/tmp`);
  return resolve(value);
}
function inventory(root) {
  const records = [];
  const walk = (rel = '') => {
    for (const name of readdirSync(join(root, rel)).sort()) {
      const child = rel ? `${rel}/${name}` : name;
      const absolute = join(root, child);
      const stat = lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`baseline may not contain symlinks: ${child}`);
      if (stat.isDirectory()) walk(child);
      else if (stat.isFile()) records.push({ path: child.split(sep).join('/'), sha256: hash(readFileSync(absolute)), size: stat.size });
      else throw new Error(`baseline contains unsupported entry: ${child}`);
    }
  };
  walk();
  return records;
}
function allowedMaterials(baselineFiles) {
  return [
    PACKET_NAME,
    'candidate/bin/blueprint.mjs',
    'candidate-help.txt',
    ...baselineFiles.map((item) => `fixture/${item.path}`),
  ].sort();
}

const flags = args(process.argv.slice(2));
if (process.argv.includes('--self-test')) {
  const allowed = allowedMaterials([{ path: 'blueprint.yml' }, { path: 'docs/authored.md' }]);
  if (
    tmpPath('/private/tmp/allowed', 'self-test') !== '/private/tmp/allowed'
    || JSON.stringify(allowed) !== JSON.stringify([
      PACKET_NAME,
      'candidate-help.txt',
      'candidate/bin/blueprint.mjs',
      'fixture/blueprint.yml',
      'fixture/docs/authored.md',
    ])
  ) throw new Error('self-test failed');
  console.log('prepare-transition-cold-author self-test: PASS');
  process.exit(0);
}
if (flags.help) {
  console.log('Usage: node prepare-transition-cold-author.mjs --candidate-root=<candidate checkout> --author-id=<nonempty private identifier> --output=/private/tmp/<new-output-dir>');
  process.exit(0);
}
const candidate = flags['candidate-root'] ? resolve(flags['candidate-root']) : fail('--candidate-root is required');
const authorId = flags['author-id']?.trim() || fail('--author-id must be nonempty');
const output = tmpPath(flags.output, '--output');
if (!existsSync(candidate) || !lstatSync(candidate).isDirectory()) fail(`candidate root is not a directory: ${candidate}`);
if (!existsSync(join(candidate, '.git'))) fail(`candidate root is not a Git checkout: ${candidate}`);
if (!existsSync(BASELINE)) fail(`fixture baseline is missing: ${BASELINE}`);
if (!existsSync(AUTHOR_PACKET)) fail(`author packet is missing: ${AUTHOR_PACKET}`);
if (existsSync(output)) fail(`output must not already exist: ${output}`);

let candidateHead;
try { candidateHead = git(candidate, ['rev-parse', 'HEAD']); } catch { fail(`cannot read candidate HEAD: ${candidate}`); }
if (candidateHead !== FROZEN_CANDIDATE) fail(`candidate HEAD must be frozen revision ${FROZEN_CANDIDATE} (got ${candidateHead})`);
if (git(candidate, ['status', '--porcelain=v1'])) fail('candidate checkout must be clean');
const packagePath = join(candidate, 'package.json');
const candidateBin = join(candidate, 'bin', 'blueprint.mjs');
if (!existsSync(packagePath)) fail(`candidate package.json is missing: ${packagePath}`);
if (!existsSync(candidateBin)) fail(`candidate executable is missing: ${candidateBin}`);
let candidatePackage;
try { candidatePackage = JSON.parse(readFileSync(packagePath, 'utf8')); } catch { fail('candidate package.json is invalid JSON'); }

const baselineFiles = inventory(BASELINE);
mkdirSync(output, { recursive: false });
const fixture = join(output, 'fixture');
cpSync(BASELINE, fixture, { recursive: true, errorOnExist: true, dereference: false });
cpSync(AUTHOR_PACKET, join(output, PACKET_NAME), { errorOnExist: true });
let help;
try {
  const command = join(candidate, 'bin', 'blueprint.mjs');
  const common = { cwd: fixture, encoding: 'utf8', env: { ...process.env, BLUEPRINT_HOME: candidate } };
  const variantHelp = execFileSync(process.execPath, [command, 'variant', '--help'], common);
  const transitionHelp = execFileSync(process.execPath, [command, 'variant', 'transition', '--help'], common);
  help = [
    `candidate-command: node ${command}`,
    '',
    '$ blueprint variant --help',
    variantHelp.trim(),
    '',
    '$ blueprint variant transition --help',
    transitionHelp.trim(),
    '',
  ].join('\n');
  writeFileSync(join(output, 'candidate-help.txt'), help, { flag: 'wx' });
} catch (error) {
  rmSync(output, { recursive: true, force: true });
  fail(`unable to capture candidate help: ${error.message}`);
}
try {
  execFileSync('git', ['-C', fixture, 'init', '-q']);
  git(fixture, ['config', 'core.hooksPath', '/dev/null']);
  git(fixture, ['config', 'user.email', 'cold-author@example.invalid']);
  git(fixture, ['config', 'user.name', 'Cold Author Fixture']);
  git(fixture, ['add', '-A']);
  git(fixture, ['commit', '-qm', 'cold-author baseline']);
} catch (error) {
  rmSync(output, { recursive: true, force: true });
  fail(`unable to initialize fixture Git repository: ${error.message}`);
}
const manifest = {
  schema: 'blueprint-variant-transition-cold-author-fixture/1',
  prepared_at: new Date().toISOString(),
  candidate: { root: candidate, head: candidateHead, package_version: candidatePackage.version ?? null, package_sha256: hash(readFileSync(packagePath)) },
  fixture: { root: fixture, baseline_head: git(fixture, ['rev-parse', 'HEAD']), baseline_files: baselineFiles },
};
const manifestPath = join(output, 'fixture-manifest.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const observationId = randomUUID();
const boundary = {
  schema: 'blueprint-variant-transition-observation-boundary/1',
  observation_id: observationId,
  issued_at: new Date().toISOString(),
  author_id: `sha256:${hash(Buffer.from(`${observationId}\0${authorId}`))}`,
  candidate: {
    root: candidate,
    head: candidateHead,
    package_version: candidatePackage.version ?? null,
    package_sha256: hash(readFileSync(packagePath)),
    executable_sha256: hash(readFileSync(candidateBin)),
  },
  fixture: {
    root: fixture,
    baseline_head: manifest.fixture.baseline_head,
  },
  material_hashes: {
    [PACKET_NAME]: hash(readFileSync(join(output, PACKET_NAME))),
    'candidate-help.txt': hash(readFileSync(join(output, 'candidate-help.txt'))),
    'fixture-manifest.json': hash(readFileSync(manifestPath)),
  },
  allowed_materials: allowedMaterials(baselineFiles),
  facilitator_role: 'Blueprint methodology observation facilitator',
  attestation: {
    written_before_author_access: true,
    fresh_no_fork: true,
    no_prior_context: true,
    no_creator_contact: true,
  },
};
writeFileSync(join(output, 'observation-boundary.json'), `${JSON.stringify(boundary, null, 2)}\n`, { flag: 'wx' });
console.log(`prepared disposable fixture: ${fixture}`);
console.log(`manifest: ${manifestPath}`);
console.log(`observation boundary: ${join(output, 'observation-boundary.json')}`);
