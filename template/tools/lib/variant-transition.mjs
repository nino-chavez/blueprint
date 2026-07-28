/**
 * variant-transition.mjs — preservation-first Blueprint variant migration.
 *
 * v1 is deliberately narrow: a Git-root initiative with an explicit top-level
 * `variant: greenfield` can transition to `research`. Planning is read-only.
 * Apply is plan-id pinned, create-if-absent, journaled before mutation, and
 * receipt-backed. Interrupted apply/rollback operations recover explicitly to
 * their pre-operation state. Cleanup is reported but never enacted.
 */

import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTopLevelYamlScalar, stripYamlComment } from './yaml-scalar.mjs';
import { isValidStateShape } from './stage-model.mjs';

export const PLAN_SCHEMA = 'blueprint-variant-transition-plan/1';
export const RECEIPT_SCHEMA = 'blueprint-variant-transition-receipt/1';
export const ROLLBACK_SCHEMA = 'blueprint-variant-transition-rollback/1';
export const JOURNAL_SCHEMA = 'blueprint-variant-transition-journal/1';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_HOME = resolve(MODULE_DIR, '..', '..', '..');
const PROTECTED_ROOTS = ['research', 'decisions', 'docs', '.claude', 'tools', 'apps', 'packages'];
const RESEARCH_DIRS = [
  'research/sources',
  'research/problem-space',
  'research/competitive',
  'research/prior-art',
  'decisions',
  'docs',
  'tools/lib',
];
const SCAFFOLD_SOURCES = [
  ['template/research/sources-index.template.md', 'research/sources/README.md'],
  ['template/research/personas-and-jtbd.template.md', 'research/personas-and-jtbd.md'],
  ['template/research/decision-memo.template.md', 'docs/decision-memo.md'],
  ['template/research/decision-record.template.md', 'decisions/_TEMPLATE.md'],
  ['template/tools/run-reviewers.mjs', 'tools/run-reviewers.mjs'],
  ['template/tools/lib/yaml-scalar.mjs', 'tools/lib/yaml-scalar.mjs'],
];
const LOCK_BASENAME = 'blueprint-variant-transition.lock';
const JOURNAL_BASENAME = 'blueprint-variant-transition.journal.json';

export class VariantTransitionError extends Error {
  constructor(message, code = 'VARIANT_TRANSITION_ERROR') {
    super(message);
    this.name = 'VariantTransitionError';
    this.code = code;
  }
}

function fail(message, code) {
  throw new VariantTransitionError(message, code);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortedObject(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortedObject(value));
}

function posixRel(value) {
  return value.split(sep).join('/');
}

function validateRelative(rel) {
  if (!rel || isAbsolute(rel)) fail(`unsafe transition path: ${rel}`, 'UNSAFE_PATH');
  const parts = rel.replaceAll('\\', '/').split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) {
    fail(`unsafe transition path: ${rel}`, 'UNSAFE_PATH');
  }
  return parts.join('/');
}

function safeLstat(pathname) {
  try {
    return lstatSync(pathname);
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

function git(target, args, { optional = false } = {}) {
  try {
    return execFileSync('git', ['-C', target, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (optional) return null;
    const detail = String(error?.stderr || error?.message || '').trim().split('\n')[0];
    fail(`git ${args.join(' ')} failed at ${target}${detail ? ` — ${detail}` : ''}`, 'GIT_REQUIRED');
  }
}

function requireGitRoot(targetDir) {
  const declared = resolve(targetDir);
  const stat = safeLstat(declared);
  if (!stat || !stat.isDirectory()) fail(`transition target is not a directory: ${declared}`, 'TARGET_INVALID');
  if (stat.isSymbolicLink()) fail(`transition target may not be a symlink: ${declared}`, 'SYMLINK_PATH');
  const canonical = realpathSync(declared);
  const root = git(canonical, ['rev-parse', '--show-toplevel']);
  if (realpathSync(root) !== canonical) {
    fail(`transition target must be the Git worktree root (got ${declared}; Git root is ${root})`, 'TARGET_NOT_GIT_ROOT');
  }
  // Pin all later joins to the resolved worktree root. A lexical path whose
  // parent is a symlink may be retargeted after preflight; carrying the
  // canonical root prevents that swap from redirecting writes or receipts.
  return canonical;
}

function directoryIdentity(target) {
  let stat;
  try {
    stat = lstatSync(target, { bigint: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      fail(`transition target disappeared: ${target}`, 'TARGET_IDENTITY_CHANGED');
    }
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail(`transition target identity is no longer a real directory: ${target}`, 'TARGET_IDENTITY_CHANGED');
  }
  return {
    device: stat.dev.toString(),
    inode: stat.ino.toString(),
  };
}

function assertTargetIdentity(target, expected) {
  const current = directoryIdentity(target);
  if (
    !expected
    || current.device !== expected.device
    || current.inode !== expected.inode
  ) {
    fail(`transition target directory changed after preflight: ${target}`, 'TARGET_IDENTITY_CHANGED');
  }
}

function assertRecoveryTargetIdentity(target, expected, operation) {
  try {
    assertTargetIdentity(target, expected);
  } catch (error) {
    fail(
      `${operation} recovery refused a replaced target root; inspect the recorded directory before any manual action (${error.message})`,
      'RECOVERY_CONFLICT',
    );
  }
}

function gitHead(target) {
  return git(target, ['rev-parse', 'HEAD']);
}

function gitMetadataPath(target, basename) {
  const gitPath = git(target, ['rev-parse', '--git-path', basename]);
  return isAbsolute(gitPath) ? gitPath : resolve(target, gitPath);
}

function transitionLockPath(target) {
  return gitMetadataPath(target, LOCK_BASENAME);
}

function transitionJournalPath(target) {
  return gitMetadataPath(target, JOURNAL_BASENAME);
}

function fsyncDirectory(pathname) {
  let descriptor;
  try {
    descriptor = openSync(pathname, 'r');
    fsyncSync(descriptor);
  } finally {
    if (descriptor != null) closeSync(descriptor);
  }
}

function durableCreateJson(pathname, value, token) {
  const temp = `${pathname}.${token}.tmp`;
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  let descriptor;
  try {
    descriptor = openSync(temp, 'wx', 0o600);
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    linkSync(temp, pathname);
    fsyncDirectory(dirname(pathname));
    unlinkSync(temp);
    fsyncDirectory(dirname(pathname));
    return { bytes, sha256: sha256(bytes) };
  } catch (error) {
    if (descriptor != null) closeSync(descriptor);
    try { unlinkSync(temp); } catch (cleanupError) { if (cleanupError?.code !== 'ENOENT') throw cleanupError; }
    throw error;
  }
}

function durableUnlink(pathname) {
  try {
    unlinkSync(pathname);
    fsyncDirectory(dirname(pathname));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function parseLockToken(raw) {
  const value = String(raw || '').trim();
  const match = /^(\d+):(\d+):([a-f0-9]{64})$/.exec(value);
  if (!match) return null;
  return { value, pid: Number(match[1]), startedAt: Number(match[2]), nonce: match[3] };
}

function lockOwnerAlive(lock) {
  if (!lock || !Number.isSafeInteger(lock.pid) || lock.pid <= 0) return null;
  try {
    process.kill(lock.pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    if (error?.code === 'EPERM') return true;
    return null;
  }
}

function readLockState(target) {
  const pathname = transitionLockPath(target);
  const stat = safeLstat(pathname);
  if (!stat) return { pathname, present: false, raw: null, parsed: null, alive: false };
  if (!stat.isFile() || stat.isSymbolicLink()) {
    return { pathname, present: true, raw: null, parsed: null, alive: null };
  }
  const raw = readFileSync(pathname, 'utf8');
  const parsed = parseLockToken(raw);
  return { pathname, present: true, raw, parsed, alive: lockOwnerAlive(parsed) };
}

function acquireTransitionLock(target) {
  const pathname = transitionLockPath(target);
  const token = `${process.pid}:${Date.now()}:${sha256(`${target}:${Math.random()}`)}`;
  try {
    writeFileSync(pathname, `${token}\n`, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      fail(
        `another variant transition/rollback holds ${pathname}; remove a stale lock only after verifying no operation is active`,
        'TRANSITION_LOCKED',
      );
    }
    throw error;
  }
  return { pathname, token };
}

function releaseTransitionLock({ pathname, token }) {
  try {
    if (readFileSync(pathname, 'utf8') === `${token}\n`) durableUnlink(pathname);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function withTransitionLock(target, operation) {
  if (safeLstat(transitionJournalPath(target))) {
    fail(
      'an interrupted variant operation requires `blueprint variant recover` before another transition or rollback',
      'RECOVERY_REQUIRED',
    );
  }
  const lock = acquireTransitionLock(target);
  try {
    return operation(lock);
  } finally {
    releaseTransitionLock(lock);
  }
}

function invokeMutationHook(hook, event) {
  if (hook == null) return;
  if (typeof hook !== 'function') fail('mutationHook must be a function', 'INVALID_TEST_HOOK');
  hook(event);
}

function buildJournal({ operation, target, targetIdentity, gitBaseline, lockToken, payload }) {
  const core = {
    schema: JOURNAL_SCHEMA,
    operation,
    target,
    targetIdentity,
    gitBaseline,
    lockToken,
    createdAt: new Date().toISOString(),
    payload,
  };
  return { ...core, journalId: sha256(stableJson(core)) };
}

function validateJournalShape(journal, target) {
  if (!journal || journal.schema !== JOURNAL_SCHEMA) {
    fail('variant transition journal schema is invalid', 'JOURNAL_CORRUPT');
  }
  const { journalId, ...core } = journal;
  if (!/^[a-f0-9]{64}$/.test(journalId || '') || sha256(stableJson(core)) !== journalId) {
    fail('variant transition journal identity is invalid', 'JOURNAL_CORRUPT');
  }
  if (!['transition-apply', 'transition-rollback'].includes(journal.operation)) {
    fail('variant transition journal operation is invalid', 'JOURNAL_CORRUPT');
  }
  if (
    typeof journal.target !== 'string'
    || !isAbsolute(journal.target)
    || !journal.targetIdentity
    || !/^\d+$/.test(journal.targetIdentity.device || '')
    || !/^\d+$/.test(journal.targetIdentity.inode || '')
  ) {
    fail('variant transition journal target identity is invalid', 'JOURNAL_CORRUPT');
  }
  assertTargetIdentity(target, journal.targetIdentity);
  if (
    typeof journal.gitBaseline !== 'string'
    || !/^[a-f0-9]{40,64}$/.test(journal.gitBaseline)
    || git(target, ['merge-base', '--is-ancestor', journal.gitBaseline, 'HEAD'], { optional: true }) === null
  ) {
    fail('variant transition journal Git baseline is not an ancestor of the current checkout', 'JOURNAL_TARGET_MISMATCH');
  }
  if (!parseLockToken(journal.lockToken)) {
    fail('variant transition journal lock token is invalid', 'JOURNAL_CORRUPT');
  }
  if (!journal.payload || typeof journal.payload !== 'object' || Array.isArray(journal.payload)) {
    fail('variant transition journal payload is invalid', 'JOURNAL_CORRUPT');
  }
  return journal;
}

function createJournal(target, lock, journal) {
  const pathname = transitionJournalPath(target);
  if (safeLstat(pathname)) {
    fail('an interrupted variant operation already has a recovery journal', 'RECOVERY_REQUIRED');
  }
  durableCreateJson(pathname, journal, journal.journalId);
  return pathname;
}

function loadJournal(target) {
  const pathname = transitionJournalPath(target);
  const stat = safeLstat(pathname);
  if (!stat) return { pathname, journal: null };
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail('variant transition journal is not a regular Git-metadata file', 'JOURNAL_CORRUPT');
  }
  let journal;
  try {
    journal = JSON.parse(readFileSync(pathname, 'utf8'));
  } catch (error) {
    fail(`variant transition journal is corrupt: ${error.message}`, 'JOURNAL_CORRUPT');
  }
  return { pathname, journal: validateJournalShape(journal, target) };
}

function methodologyIdentity(home, materials) {
  const head = git(home, ['rev-parse', 'HEAD'], { optional: true });
  const scaffoldDigest = sha256(stableJson(materials.map(({ source, path, sha256: hash, size }) => ({
    source,
    path,
    sha256: hash,
    size,
  }))));
  return { head, scaffoldDigest };
}

function ensureNoSymlinkPath(target, rel) {
  validateRelative(rel);
  let cursor = target;
  for (const part of rel.split('/')) {
    cursor = join(cursor, part);
    const stat = safeLstat(cursor);
    if (stat?.isSymbolicLink()) {
      fail(`planned path traverses a symlink: ${posixRel(relative(target, cursor))}`, 'SYMLINK_PATH');
    }
  }
}

function scalarOccurrences(text, key) {
  const found = [];
  let start = 0;
  while (start < text.length) {
    const newline = text.indexOf('\n', start);
    const lineEnd = newline === -1 ? text.length : newline;
    const bodyEnd = text[lineEnd - 1] === '\r' ? lineEnd - 1 : lineEnd;
    const body = text.slice(start, bodyEnd);
    if (body.startsWith(`${key}:`)) {
      const tail = body.slice(key.length + 1);
      found.push({
        start,
        end: bodyEnd,
        line: body,
        tail,
        value: readTopLevelYamlScalar(`${body}\n`, key),
      });
    }
    if (newline === -1) break;
    start = newline + 1;
  }
  return found;
}

function patchScalar(text, key, to) {
  const occurrences = scalarOccurrences(text, key);
  if (occurrences.length !== 1) {
    fail(`expected exactly one top-level ${key}: declaration; found ${occurrences.length}`, 'SCALAR_SHAPE');
  }
  const occurrence = occurrences[0];
  if (!occurrence.value) fail(`top-level ${key}: has no scalar value`, 'SCALAR_SHAPE');
  const beforeComment = stripYamlComment(occurrence.tail);
  const comment = occurrence.tail.slice(beforeComment.length);
  const leading = beforeComment.match(/^\s*/)?.[0] ?? '';
  const trailing = beforeComment.match(/\s*$/)?.[0] || '';
  const trimmed = beforeComment.trim();
  const quote = ((trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))) ? trimmed[0] : '';
  const rendered = quote ? `${quote}${to}${quote}` : to;
  const nextLine = `${key}:${leading}${rendered}${trailing}${comment}`;
  const next = text.slice(0, occurrence.start) + nextLine + text.slice(occurrence.end);
  return {
    next,
    change: {
      key,
      from: occurrence.value,
      to,
      beforeLine: occurrence.line,
      afterLine: nextLine,
    },
  };
}

function computeBlueprintPatch(text) {
  const variants = scalarOccurrences(text, 'variant');
  if (variants.length !== 1) {
    fail(`expected exactly one top-level variant: declaration; found ${variants.length}`, 'VARIANT_SHAPE');
  }
  const from = variants[0].value;
  if (!from) fail('top-level variant: has no scalar value', 'VARIANT_SHAPE');

  const stageModels = scalarOccurrences(text, 'stage_model');
  if (stageModels.length > 1) {
    fail(`expected at most one top-level stage_model: declaration; found ${stageModels.length}`, 'STAGE_MODEL_SHAPE');
  }
  const stageModel = stageModels[0]?.value ?? null;
  if (stageModels.length === 1 && !stageModel) {
    fail('top-level stage_model: has no scalar value', 'STAGE_MODEL_SHAPE');
  }
  if (stageModel && stageModel !== 'greenfield' && stageModel !== 'research') {
    fail(`custom stage_model '${stageModel}' cannot be translated by greenfield→research v1`, 'CUSTOM_STAGE_MODEL');
  }

  if (from === 'research') {
    if (stageModel === 'greenfield') {
      fail('variant is already research but stage_model is greenfield; repair the contradictory declaration explicitly', 'CONTRADICTORY_MODEL');
    }
    return { status: 'already-transitioned', from, to: 'research', next: text, changes: [] };
  }
  if (from !== 'greenfield') {
    fail(`greenfield→research v1 cannot transition from '${from}'`, 'UNSUPPORTED_FROM_VARIANT');
  }

  let next = text;
  const changes = [];
  const variantPatch = patchScalar(next, 'variant', 'research');
  next = variantPatch.next;
  changes.push(variantPatch.change);
  if (stageModel === 'greenfield') {
    const modelPatch = patchScalar(next, 'stage_model', 'research');
    next = modelPatch.next;
    changes.push(modelPatch.change);
  }
  return { status: 'planned', from, to: 'research', next, changes };
}

function recordAt(target, rel) {
  const absolute = join(target, rel);
  const stat = safeLstat(absolute);
  if (!stat) return null;
  if (stat.isSymbolicLink()) {
    return { path: rel, type: 'symlink', target: readlinkSync(absolute) };
  }
  if (stat.isDirectory()) return { path: rel, type: 'directory' };
  if (!stat.isFile()) return { path: rel, type: 'other', size: stat.size };
  const bytes = readFileSync(absolute);
  return {
    path: rel,
    type: 'file',
    size: bytes.length,
    mode: stat.mode & 0o777,
    sha256: sha256(bytes),
  };
}

function treeInventory(target, rootRel) {
  const root = join(target, rootRel);
  const rootStat = safeLstat(root);
  if (!rootStat) {
    return { root: rootRel, exists: false, entries: [], count: 0, digest: sha256('[]') };
  }
  if (rootStat.isSymbolicLink()) {
    const entries = [{ path: rootRel, type: 'symlink', target: readlinkSync(root) }];
    return { root: rootRel, exists: true, entries, count: 1, digest: sha256(stableJson(entries)) };
  }
  if (!rootStat.isDirectory()) {
    const entries = [recordAt(target, rootRel)];
    return { root: rootRel, exists: true, entries, count: 1, digest: sha256(stableJson(entries)) };
  }

  const entries = [];
  const walk = (relativeDir) => {
    const absoluteDir = join(target, relativeDir);
    for (const name of readdirSync(absoluteDir).sort()) {
      const rel = posixRel(join(relativeDir, name));
      const record = recordAt(target, rel);
      entries.push(record);
      if (record.type === 'directory') walk(rel);
    }
  };
  walk(rootRel);
  return {
    root: rootRel,
    exists: true,
    entries,
    count: entries.length,
    digest: sha256(stableJson(entries)),
  };
}

function protectedInventory(target) {
  return PROTECTED_ROOTS.map((root) => treeInventory(target, root));
}

function scaffoldMaterials(home) {
  return SCAFFOLD_SOURCES.map(([source, targetPath]) => {
    const sourcePath = join(home, source);
    const stat = safeLstat(sourcePath);
    if (!stat?.isFile() || stat.isSymbolicLink()) {
      fail(`canonical transition scaffold is missing or unsafe: ${source}`, 'CANONICAL_SCAFFOLD_MISSING');
    }
    const content = readFileSync(sourcePath);
    return {
      source,
      path: targetPath,
      content,
      size: content.length,
      sha256: sha256(content),
    };
  });
}

function stageStatePlan(target, acceptStageReset) {
  const rel = '.blueprint/stage-state.json';
  ensureNoSymlinkPath(target, rel);
  const stat = safeLstat(join(target, rel));
  if (!stat) return { path: rel, status: 'absent', requiresAcceptance: false };
  if (!stat.isFile()) fail(`${rel} is not a regular file`, 'STAGE_STATE_SHAPE');
  const bytes = readFileSync(join(target, rel));
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`${rel} is corrupt and cannot be archived safely — ${error.message}`, 'STAGE_STATE_CORRUPT');
  }
  if (!isValidStateShape(parsed)) {
    fail(`${rel} is valid JSON but not a canonical stage-state object`, 'STAGE_STATE_SHAPE');
  }
  return {
    path: rel,
    status: acceptStageReset ? 'archive-and-reset' : 'requires-explicit-reset',
    requiresAcceptance: !acceptStageReset,
    size: bytes.length,
    sha256: sha256(bytes),
  };
}

function cleanupPlan(target) {
  const blueprint = existsSync(join(target, 'blueprint.yml'))
    ? readFileSync(join(target, 'blueprint.yml'), 'utf8')
    : '';
  const candidates = [
    ['blueprint.yml#pilot_profile', /^pilot_profile:\s*(?:#.*)?$/m.test(blueprint), 'Remove or archive the obsolete greenfield pilot block only after its replacement intent is explicit.'],
    ['blueprint.yml#portal', /^portal:\s*(?:#.*)?$/m.test(blueprint), 'Reconcile portal configuration separately; scalar transition does not rewrite nested YAML.'],
    ['apps/portal/', existsSync(join(target, 'apps/portal')), 'Delete only after a replacement reader surface and build path exist.'],
    ['packages/', existsSync(join(target, 'packages')), 'Delete only after no remaining build or import depends on these workspaces.'],
    ['package.json workspace scripts', existsSync(join(target, 'package.json')), 'Reconcile scripts/workspaces after product scaffolding disposition.'],
    ['reader-contract.json', existsSync(join(target, 'reader-contract.json')), 'Update only when the research deliverable has an actual rendered encounter.'],
  ];
  return candidates.map(([path, present, reason]) => ({
    path,
    present: Boolean(present),
    disposition: 'operator-review-only',
    automaticAction: 'none',
    reason,
  }));
}

function plannedDirtyPaths(target, actions) {
  const paths = [...new Set(actions
    .filter((action) => ['patch-file', 'create-file', 'archive-stage-state'].includes(action.kind))
    .map((action) => action.path))].sort();
  if (paths.length === 0) return [];
  const output = git(target, ['status', '--porcelain=v1', '--untracked-files=all', '--', ...paths]);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

function publicPlan(planCore) {
  const planId = sha256(stableJson(planCore));
  return {
    ...planCore,
    planId,
    receiptPath: `.blueprint/variant-transitions/${planId}/receipt.json`,
  };
}

export function planVariantTransition({
  targetDir,
  home = DEFAULT_HOME,
  to = 'research',
  acceptStageReset = false,
} = {}) {
  if (to !== 'research') fail(`variant transition v1 supports only --to=research (got '${to}')`, 'UNSUPPORTED_TO_VARIANT');
  const target = requireGitRoot(targetDir || process.cwd());
  const targetIdentity = directoryIdentity(target);
  const blueprintPath = join(target, 'blueprint.yml');
  ensureNoSymlinkPath(target, 'blueprint.yml');
  const blueprintStat = safeLstat(blueprintPath);
  if (!blueprintStat?.isFile()) fail(`blueprint.yml is missing at ${target}`, 'BLUEPRINT_MISSING');
  const blueprintBytes = readFileSync(blueprintPath);
  const blueprintText = blueprintBytes.toString('utf8');
  const patch = computeBlueprintPatch(blueprintText);
  const materials = scaffoldMaterials(resolve(home));
  const actions = [];
  const collisions = [];

  if (patch.status === 'planned') {
    actions.push({
      kind: 'patch-file',
      path: 'blueprint.yml',
      beforeMode: blueprintStat.mode & 0o777,
      beforeSha256: sha256(blueprintBytes),
      afterSha256: sha256(Buffer.from(patch.next)),
      changes: patch.changes,
    });

    for (const rel of RESEARCH_DIRS) {
      ensureNoSymlinkPath(target, rel);
      const stat = safeLstat(join(target, rel));
      if (!stat) {
        actions.push({ kind: 'create-directory', path: rel });
      } else if (!stat.isDirectory()) {
        fail(`research scaffold directory collides with a non-directory: ${rel}`, 'SCAFFOLD_COLLISION');
      }
    }

    for (const material of materials) {
      ensureNoSymlinkPath(target, material.path);
      const record = recordAt(target, material.path);
      if (!record) {
        actions.push({
          kind: 'create-file',
          path: material.path,
          source: material.source,
          size: material.size,
          sha256: material.sha256,
        });
      } else {
        if (record.type !== 'file') {
          fail(`research scaffold file collides with ${record.type}: ${material.path}`, 'SCAFFOLD_COLLISION');
        }
        collisions.push({ ...record, source: material.source, disposition: 'PRESERVE' });
      }
    }
  }

  const stageState = stageStatePlan(target, acceptStageReset);
  if (patch.status === 'planned' && stageState.status === 'archive-and-reset') {
    actions.push({
      kind: 'archive-stage-state',
      path: stageState.path,
      beforeSha256: stageState.sha256,
      size: stageState.size,
    });
  }

  const inventory = protectedInventory(target);
  const methodology = methodologyIdentity(resolve(home), materials);
  const core = {
    schema: PLAN_SCHEMA,
    status: patch.status,
    target,
    targetIdentity,
    from: patch.from,
    to: patch.to,
    git: { head: gitHead(target) },
    methodology,
    actions,
    collisions,
    protectedRoots: inventory,
    stageState,
    cleanup: cleanupPlan(target),
    rollback: {
      patchedFiles: actions.filter((action) => action.kind === 'patch-file').map((action) => action.path),
      createdFiles: actions.filter((action) => action.kind === 'create-file').map((action) => action.path),
      createdDirectories: actions.filter((action) => action.kind === 'create-directory').map((action) => action.path),
      stageState: stageState.status === 'archive-and-reset' ? 'restore-if-no-replacement-exists' : 'unchanged',
      receiptRetention: 'append-only',
    },
  };
  const dirtyPlannedPaths = plannedDirtyPaths(target, actions);
  const plan = publicPlan({ ...core, dirtyPlannedPaths });
  // Receipt authority must stay inside the initiative. Check the complete
  // content-addressed path during read-only planning; apply checks it again
  // immediately before directory creation.
  ensureNoSymlinkPath(target, plan.receiptPath);
  assertTargetIdentity(target, targetIdentity);
  return plan;
}

function materialMap(home) {
  return new Map(scaffoldMaterials(home).map((material) => [material.path, material]));
}

function ensureDirTracked(target, absoluteDir, createdDirs) {
  const root = resolve(target);
  const destination = resolve(absoluteDir);
  const rawRelative = posixRel(relative(root, destination));
  if (!rawRelative) return;
  const safeRelative = validateRelative(rawRelative);
  let cursor = root;
  let cursorRelative = '';
  for (const part of safeRelative.split('/')) {
    cursor = join(cursor, part);
    cursorRelative = cursorRelative ? `${cursorRelative}/${part}` : part;
    const stat = safeLstat(cursor);
    if (stat?.isSymbolicLink()) {
      fail(`refusing to traverse a symlink while creating ${cursorRelative}`, 'SYMLINK_PATH');
    }
    if (stat && !stat.isDirectory()) {
      fail(`directory path collides with a non-directory: ${cursorRelative}`, 'SCAFFOLD_COLLISION');
    }
    if (!stat) {
      try {
        mkdirSync(cursor);
      } catch (error) {
        // A competing creator may have won between lstat and mkdir. Accept
        // only a real directory; never follow a newly introduced symlink.
        if (error?.code !== 'EEXIST') throw error;
        const current = safeLstat(cursor);
        if (!current?.isDirectory() || current.isSymbolicLink()) {
          fail(`unsafe concurrent directory creation at ${cursorRelative}`, 'CONCURRENT_MODIFICATION');
        }
        continue;
      }
      createdDirs.push(cursorRelative);
      fsyncDirectory(dirname(cursor));
    }
  }
}

function durableCreateFile(pathname, bytes, {
  mode = 0o644,
  flushDirectory = true,
} = {}) {
  let descriptor;
  try {
    descriptor = openSync(pathname, 'wx', mode);
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    if (descriptor != null) closeSync(descriptor);
  }
  if (flushDirectory) fsyncDirectory(dirname(pathname));
}

function atomicWrite(pathname, bytes, mode, token, { expectedSha256 = null } = {}) {
  const temp = `${pathname}.variant-transition-${token}.tmp`;
  if (existsSync(temp)) fail(`transaction temp already exists: ${temp}`, 'TRANSACTION_COLLISION');
  let tempOwned = false;
  try {
    durableCreateFile(temp, bytes, { mode, flushDirectory: false });
    tempOwned = true;
    if (expectedSha256) {
      const current = safeLstat(pathname);
      if (
        !current?.isFile()
        || current.isSymbolicLink()
        || sha256(readFileSync(pathname)) !== expectedSha256
      ) {
        fail(`concurrent modification detected immediately before replacing ${pathname}`, 'CONCURRENT_MODIFICATION');
      }
    }
    renameSync(temp, pathname);
    fsyncDirectory(dirname(pathname));
    tempOwned = false;
    return temp;
  } finally {
    if (tempOwned) {
      try { unlinkSync(temp); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    }
  }
}

function currentRegularFileHash(pathname) {
  const stat = safeLstat(pathname);
  if (!stat) return { status: 'absent', sha256: null };
  if (!stat.isFile() || stat.isSymbolicLink()) return { status: 'unsafe', sha256: null };
  return { status: 'file', sha256: sha256(readFileSync(pathname)) };
}

function guardedRegularFileHash(target, rel) {
  const safeRel = validateRelative(rel);
  ensureNoSymlinkPath(target, safeRel);
  return currentRegularFileHash(join(target, safeRel));
}

function recoveryRegularFileHash(target, pathname, conflicts, label) {
  let rel;
  try {
    rel = validateRelative(posixRel(relative(resolve(target), resolve(pathname))));
    return guardedRegularFileHash(target, rel);
  } catch (error) {
    conflicts.push(`${label} has an unsafe recovery path; preserved (${error.message})`);
    return { status: 'unsafe', sha256: null };
  }
}

function removeOwnedFile(target, pathname, expectedSha256, conflicts, label) {
  const current = recoveryRegularFileHash(target, pathname, conflicts, label);
  if (current.status === 'absent') return;
  if (current.status !== 'file' || current.sha256 !== expectedSha256) {
    if (current.status !== 'unsafe') conflicts.push(`${label} changed concurrently; preserved`);
    return;
  }
  durableUnlink(pathname);
}

function removeEmptyDirs(target, rels, conflicts = []) {
  for (const rel of [...new Set(rels)].sort((a, b) => b.split('/').length - a.split('/').length)) {
    const absolute = join(target, rel);
    try {
      ensureNoSymlinkPath(target, validateRelative(rel));
    } catch (error) {
      conflicts.push(`${rel} has an unsafe cleanup path; preserved (${error.message})`);
      continue;
    }
    const stat = safeLstat(absolute);
    if (!stat) continue;
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      conflicts.push(`${rel} is no longer a transition-owned directory; preserved`);
      continue;
    }
    try {
      rmdirSync(absolute);
      fsyncDirectory(dirname(absolute));
    } catch (error) {
      if (['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error?.code)) continue;
      if (error?.code === 'ENOTDIR') {
        conflicts.push(`${rel} changed during directory cleanup; preserved`);
        continue;
      }
      throw error;
    }
  }
  return conflicts;
}

function verifyPreservation(plan, target, createdFiles, createdDirs) {
  const allowedNew = new Set([...createdFiles, ...createdDirs]);
  for (const before of plan.protectedRoots) {
    const after = treeInventory(target, before.root);
    const beforeMap = new Map(before.entries.map((entry) => [entry.path, entry]));
    const afterMap = new Map(after.entries.map((entry) => [entry.path, entry]));
    for (const [path, record] of beforeMap) {
      const current = afterMap.get(path);
      if (!current || stableJson(current) !== stableJson(record)) {
        fail(`preservation verification failed for ${path}`, 'PRESERVATION_FAILED');
      }
    }
    for (const path of afterMap.keys()) {
      if (!beforeMap.has(path) && !allowedNew.has(path)) {
        fail(`unplanned path appeared during transition: ${path}`, 'PRESERVATION_FAILED');
      }
    }
  }
  for (const collision of plan.collisions) {
    const current = recordAt(target, collision.path);
    if (!current || stableJson(current) !== stableJson({
      path: collision.path,
      type: collision.type,
      size: collision.size,
      mode: collision.mode,
      sha256: collision.sha256,
    })) {
      fail(`PRESERVE collision changed during transition: ${collision.path}`, 'PRESERVATION_FAILED');
    }
  }
}

function verifyAppliedPostimage(plan, target, createdFiles, createdDirs) {
  assertTargetIdentity(target, plan.targetIdentity);
  const patch = plan.actions.find((item) => item.kind === 'patch-file');
  const blueprint = guardedRegularFileHash(target, 'blueprint.yml');
  if (!patch || blueprint.status !== 'file' || blueprint.sha256 !== patch.afterSha256) {
    fail('blueprint.yml does not match the planned postimage', 'TRANSACTION_VERIFY_FAILED');
  }
  for (const action of plan.actions.filter((item) => item.kind === 'create-file')) {
    const current = guardedRegularFileHash(target, action.path);
    if (current.status !== 'file' || current.sha256 !== action.sha256) {
      fail(`created scaffold failed byte verification: ${action.path}`, 'TRANSACTION_VERIFY_FAILED');
    }
  }
  verifyPreservation(plan, target, createdFiles, createdDirs);
  assertTargetIdentity(target, plan.targetIdentity);
}

function rollbackApplyFailure({
  target,
  targetIdentity,
  token,
  blueprintBefore,
  blueprintMode,
  blueprintAfterSha256,
  blueprintChanged,
  createdFiles,
  createdFileHashes,
  createdDirs,
  stageBefore,
  stageRemoved,
  receiptFiles,
  receiptDirs,
}) {
  assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
  const conflicts = [];
  for (const { pathname, sha256: expectedSha256 } of receiptFiles) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
    removeOwnedFile(target, pathname, expectedSha256, conflicts, pathname);
  }
  if (stageRemoved && stageBefore) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
    const stagePath = join(target, '.blueprint/stage-state.json');
    let stagePathSafe = true;
    try {
      ensureNoSymlinkPath(target, '.blueprint/stage-state.json');
    } catch (error) {
      stagePathSafe = false;
      conflicts.push(`.blueprint/stage-state.json has an unsafe recovery path; preserved (${error.message})`);
    }
    if (!stagePathSafe) {
      // Never inspect or write through the unsafe ancestor.
    } else if (safeLstat(stagePath)) {
      conflicts.push('.blueprint/stage-state.json was recreated concurrently; preserved');
    } else {
      ensureDirTracked(target, dirname(stagePath), createdDirs);
      try {
        durableCreateFile(stagePath, stageBefore);
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        conflicts.push('.blueprint/stage-state.json was recreated concurrently; preserved');
      }
    }
  }
  for (const rel of [...createdFiles].reverse()) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
    removeOwnedFile(target, join(target, rel), createdFileHashes.get(rel), conflicts, rel);
  }
  if (blueprintChanged) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
    const blueprintPath = join(target, 'blueprint.yml');
    const current = currentRegularFileHash(blueprintPath);
    if (current.status === 'file' && current.sha256 === blueprintAfterSha256) {
      atomicWrite(
        blueprintPath,
        blueprintBefore,
        blueprintMode,
        `${token}-restore`,
        { expectedSha256: blueprintAfterSha256 },
      );
    } else if (current.status !== 'file' || current.sha256 !== sha256(blueprintBefore)) {
      conflicts.push('blueprint.yml changed concurrently after transition write; preserved');
    }
  }
  assertRecoveryTargetIdentity(target, targetIdentity, 'apply');
  removeEmptyDirs(target, [...receiptDirs, ...createdDirs], conflicts);
  if (conflicts.length) {
    fail(
      `transaction recovery preserved concurrent edits: ${conflicts.join(' | ')}`,
      'RECOVERY_CONFLICT',
    );
  }
}

function applyVariantTransitionUnlocked({
  targetDir,
  home = DEFAULT_HOME,
  to = 'research',
  planId,
  acceptStageReset = false,
  failAfter = null,
  mutationHook = null,
  lockToken,
} = {}) {
  if (!planId || !/^[a-f0-9]{64}$/.test(planId)) {
    fail('--apply requires the exact 64-character --plan-id from a fresh plan', 'PLAN_ID_REQUIRED');
  }
  const plan = planVariantTransition({ targetDir, home, to, acceptStageReset });
  if (plan.planId !== planId) {
    fail(`plan id mismatch: supplied ${planId}, current state produces ${plan.planId}`, 'PLAN_MISMATCH');
  }
  if (plan.status !== 'planned') {
    return { ok: true, applied: false, status: plan.status, planId: plan.planId, target: plan.target };
  }
  if (plan.stageState.requiresAcceptance) {
    fail('stage state exists; re-plan and apply with --accept-stage-reset', 'STAGE_RESET_REQUIRED');
  }
  if (plan.dirtyPlannedPaths.length > 0) {
    fail(`planned paths are dirty: ${plan.dirtyPlannedPaths.join(' | ')}`, 'PLANNED_PATH_DIRTY');
  }

  const target = plan.target;
  const receiptAbsolute = join(target, plan.receiptPath);
  ensureNoSymlinkPath(target, plan.receiptPath);
  if (existsSync(dirname(receiptAbsolute))) {
    fail(`receipt directory already exists for plan ${plan.planId}`, 'RECEIPT_EXISTS');
  }
  const materials = materialMap(resolve(home));
  const blueprintPath = join(target, 'blueprint.yml');
  const blueprintBefore = readFileSync(blueprintPath);
  const blueprintMode = statSync(blueprintPath).mode & 0o777;
  const blueprintPatch = computeBlueprintPatch(blueprintBefore.toString('utf8'));
  const blueprintAfter = Buffer.from(blueprintPatch.next);
  const blueprintAction = plan.actions.find((item) => item.kind === 'patch-file');
  if (!blueprintAction || sha256(blueprintBefore) !== blueprintAction.beforeSha256) {
    fail('blueprint.yml changed after transition preflight', 'PLAN_MISMATCH');
  }
  const createdFiles = [];
  const createdFileHashes = new Map();
  const createdDirs = [];
  const receiptFiles = [];
  const receiptDirs = [];
  let blueprintChanged = false;
  const stageAction = plan.actions.find((item) => item.kind === 'archive-stage-state');
  const stageBefore = stageAction ? readFileSync(join(target, stageAction.path)) : null;
  let stageRemoved = false;
  let step = 0;
  const checkpoint = (operation, path) => {
    step += 1;
    invokeMutationHook(mutationHook, { operation: `after-${operation}`, path, target });
    if (failAfter === step) throw new Error(`injected transition failure after step ${step}`);
  };
  const expectedCreatedDirs = expectedCreatedDirectories(plan);
  const receipt = {
    schema: RECEIPT_SCHEMA,
    receiptId: plan.planId,
    appliedAt: new Date().toISOString(),
    target,
    plan,
    patchedFiles: [{
      path: 'blueprint.yml',
      beforeSha256: sha256(blueprintBefore),
      afterSha256: sha256(blueprintAfter),
      mode: blueprintMode,
      beforeBase64: blueprintBefore.toString('base64'),
    }],
    createdFiles: plan.actions
      .filter((item) => item.kind === 'create-file')
      .map((item) => ({ path: item.path, sha256: item.sha256, source: item.source })),
    createdDirectories: expectedCreatedDirs,
    archivedStageState: stageBefore ? {
      path: '.blueprint/stage-state.json',
      sha256: sha256(stageBefore),
      beforeBase64: stageBefore.toString('base64'),
    } : null,
    cleanup: plan.cleanup,
    rollbackBoundary: plan.rollback,
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  const receiptSha256 = sha256(receiptBytes);
  const receiptTemp = `${receiptAbsolute}.tmp`;
  const supportDirectories = [
    '.blueprint',
    '.blueprint/variant-transitions',
    posixRel(dirname(plan.receiptPath)),
  ].filter((rel) => !safeLstat(join(target, rel)));
  const journal = buildJournal({
    operation: 'transition-apply',
    target,
    targetIdentity: plan.targetIdentity,
    gitBaseline: plan.git.head,
    lockToken,
    payload: {
      planId: plan.planId,
      blueprint: {
        path: 'blueprint.yml',
        beforeSha256: blueprintAction.beforeSha256,
        afterSha256: blueprintAction.afterSha256,
        beforeBase64: blueprintBefore.toString('base64'),
        mode: blueprintMode,
      },
      createdFiles: receipt.createdFiles,
      createdDirectories: expectedCreatedDirs,
      supportDirectories,
      archivedStageState: receipt.archivedStageState,
      successReceipt: {
        path: plan.receiptPath,
        tempPath: posixRel(relative(target, receiptTemp)),
        sha256: receiptSha256,
      },
    },
  });
  const journalPath = createJournal(target, { token: lockToken }, journal);
  invokeMutationHook(mutationHook, { operation: 'journal-created', path: journalPath, target });

  try {
    invokeMutationHook(mutationHook, { operation: 'patch-file', path: 'blueprint.yml', target });
    assertTargetIdentity(target, plan.targetIdentity);
    atomicWrite(
      blueprintPath,
      blueprintAfter,
      blueprintMode,
      plan.planId,
      { expectedSha256: blueprintAction.beforeSha256 },
    );
    blueprintChanged = true;
    checkpoint('patch-file', 'blueprint.yml');

    for (const action of plan.actions.filter((item) => item.kind === 'create-directory')) {
      invokeMutationHook(mutationHook, { operation: 'create-directory', path: action.path, target });
      assertTargetIdentity(target, plan.targetIdentity);
      ensureNoSymlinkPath(target, action.path);
      ensureDirTracked(target, join(target, action.path), createdDirs);
      checkpoint('create-directory', action.path);
    }
    for (const action of plan.actions.filter((item) => item.kind === 'create-file')) {
      const material = materials.get(action.path);
      if (!material || material.sha256 !== action.sha256) {
        fail(`canonical scaffold changed after planning: ${action.path}`, 'CANONICAL_SCAFFOLD_CHANGED');
      }
      invokeMutationHook(mutationHook, { operation: 'create-file', path: action.path, target });
      assertTargetIdentity(target, plan.targetIdentity);
      ensureNoSymlinkPath(target, action.path);
      ensureDirTracked(target, dirname(join(target, action.path)), createdDirs);
      durableCreateFile(join(target, action.path), material.content);
      createdFiles.push(action.path);
      createdFileHashes.set(action.path, action.sha256);
      checkpoint('create-file', action.path);
    }

    if (stageAction) {
      const stagePath = join(target, stageAction.path);
      invokeMutationHook(mutationHook, { operation: 'archive-stage-state', path: stageAction.path, target });
      assertTargetIdentity(target, plan.targetIdentity);
      ensureNoSymlinkPath(target, stageAction.path);
      const currentStage = readFileSync(stagePath);
      if (sha256(currentStage) !== stageAction.beforeSha256) {
        fail('stage state changed immediately before archive', 'CONCURRENT_MODIFICATION');
      }
      durableUnlink(stagePath);
      stageRemoved = true;
      checkpoint('archive-stage-state', stageAction.path);
    }

    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    checkpoint('verify-postimage', 'blueprint.yml');

    invokeMutationHook(mutationHook, { operation: 'write-receipt', path: plan.receiptPath, target });
    assertTargetIdentity(target, plan.targetIdentity);
    ensureNoSymlinkPath(target, plan.receiptPath);
    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    ensureDirTracked(target, dirname(receiptAbsolute), receiptDirs);
    durableCreateFile(receiptTemp, receiptBytes);
    receiptFiles.push({ pathname: receiptTemp, sha256: receiptSha256 });
    ensureNoSymlinkPath(target, plan.receiptPath);
    // Last whole-operation check before the success receipt becomes visible.
    // A receipt may never certify a postimage that changed after verification.
    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    assertTargetIdentity(target, plan.targetIdentity);
    linkSync(receiptTemp, receiptAbsolute);
    fsyncDirectory(dirname(receiptAbsolute));
    receiptFiles.push({ pathname: receiptAbsolute, sha256: receiptSha256 });
    unlinkSync(receiptTemp);
    fsyncDirectory(dirname(receiptAbsolute));
    receiptFiles.splice(receiptFiles.findIndex((item) => item.pathname === receiptTemp), 1);
    checkpoint('publish-receipt', plan.receiptPath);
    durableUnlink(journalPath);

    return {
      ok: true,
      applied: true,
      status: 'applied',
      target,
      planId: plan.planId,
      receiptPath: plan.receiptPath,
      createdFiles: receipt.createdFiles.map((item) => item.path),
      preservedCollisions: plan.collisions.map((item) => item.path),
      cleanup: plan.cleanup,
    };
  } catch (error) {
    rollbackApplyFailure({
      target,
      targetIdentity: plan.targetIdentity,
      token: plan.planId,
      blueprintBefore,
      blueprintMode,
      blueprintAfterSha256: blueprintAction.afterSha256,
      blueprintChanged,
      createdFiles,
      createdFileHashes,
      createdDirs,
      stageBefore,
      stageRemoved,
      receiptFiles,
      receiptDirs,
    });
    durableUnlink(journalPath);
    if (error instanceof VariantTransitionError) throw error;
    fail(`transition transaction failed and was restored — ${error.message}`, 'TRANSACTION_FAILED');
  }
}

export function applyVariantTransition(options = {}) {
  const target = requireGitRoot(options.targetDir || process.cwd());
  return withTransitionLock(target, (lock) => applyVariantTransitionUnlocked({
    ...options,
    targetDir: target,
    lockToken: lock.token,
  }));
}

function receiptPath(target, receiptId) {
  if (!receiptId || !/^[a-f0-9]{64}$/.test(receiptId)) {
    fail('--receipt must be a 64-character transition receipt id', 'RECEIPT_ID_REQUIRED');
  }
  return join(target, '.blueprint', 'variant-transitions', receiptId, 'receipt.json');
}

function expectedCreatedDirectories(plan) {
  const preexisting = new Set();
  for (const inventory of plan.protectedRoots || []) {
    if (inventory.exists) preexisting.add(validateRelative(inventory.root));
    for (const entry of inventory.entries || []) {
      if (entry.type === 'directory') preexisting.add(validateRelative(entry.path));
    }
  }

  const candidates = new Set();
  const addDirectoryAndAncestors = (rel) => {
    let cursor = validateRelative(rel);
    while (cursor) {
      candidates.add(cursor);
      if (!cursor.includes('/')) break;
      cursor = cursor.slice(0, cursor.lastIndexOf('/'));
    }
  };
  for (const action of plan.actions || []) {
    if (action.kind === 'create-directory') addDirectoryAndAncestors(action.path);
    if (action.kind === 'create-file') addDirectoryAndAncestors(posixRel(dirname(action.path)));
  }
  return [...candidates].filter((rel) => !preexisting.has(rel)).sort();
}

function validateReceiptShape(receipt, receiptId, target) {
  if (receipt.schema !== RECEIPT_SCHEMA || receipt.receiptId !== receiptId) {
    fail('transition receipt schema or identity is invalid', 'RECEIPT_CORRUPT');
  }
  if (
    typeof receipt.target !== 'string'
    || !isAbsolute(receipt.target)
    || receipt.plan?.target !== receipt.target
  ) {
    fail('transition receipt target provenance is invalid', 'RECEIPT_CORRUPT');
  }
  const { planId, receiptPath: plannedReceiptPath, ...planCore } = receipt.plan || {};
  const expectedReceiptPath = `.blueprint/variant-transitions/${receiptId}/receipt.json`;
  if (
    receipt.plan?.schema !== PLAN_SCHEMA
    || planId !== receiptId
    || plannedReceiptPath !== expectedReceiptPath
    || sha256(stableJson(planCore)) !== receiptId
  ) {
    fail('transition receipt contains a modified or invalid plan', 'RECEIPT_CORRUPT');
  }
  const recordedIdentity = receipt.plan?.targetIdentity;
  const currentIdentity = directoryIdentity(target);
  if (
    !recordedIdentity
    || !/^\d+$/.test(recordedIdentity.device || '')
    || !/^\d+$/.test(recordedIdentity.inode || '')
    || recordedIdentity.device !== currentIdentity.device
    || recordedIdentity.inode !== currentIdentity.inode
  ) {
    fail(
      'current worktree root is not the directory that received the transition',
      'RECEIPT_TARGET_MISMATCH',
    );
  }
  // A receipt records the original absolute checkout path as provenance, but
  // rollback authority survives a same-filesystem directory rename. Device
  // and inode identity distinguish that rename from a copied checkout; Git
  // ancestry supplies an additional repository-history boundary.
  const baseline = receipt.plan?.git?.head;
  if (
    typeof baseline !== 'string'
    || !/^[a-f0-9]{40,64}$/.test(baseline)
    || git(target, ['merge-base', '--is-ancestor', baseline, 'HEAD'], { optional: true }) === null
  ) {
    fail('current repository history does not descend from the transition receipt baseline', 'RECEIPT_TARGET_MISMATCH');
  }

  const planCreateFiles = new Map(
    receipt.plan.actions
      .filter((action) => action.kind === 'create-file')
      .map((action) => [action.path, action]),
  );
  const planPatches = new Map(
    receipt.plan.actions
      .filter((action) => action.kind === 'patch-file')
      .map((action) => [action.path, action]),
  );

  if (!Array.isArray(receipt.patchedFiles) || receipt.patchedFiles.length !== planPatches.size) {
    fail('receipt patched-file set does not match its plan', 'RECEIPT_CORRUPT');
  }
  for (const patched of receipt.patchedFiles) {
    const rel = validateRelative(patched.path);
    const action = planPatches.get(rel);
    const before = Buffer.from(patched.beforeBase64 || '', 'base64');
    if (
      !action
      || action.beforeMode !== patched.mode
      || action.beforeSha256 !== patched.beforeSha256
      || action.afterSha256 !== patched.afterSha256
      || sha256(before) !== patched.beforeSha256
    ) {
      fail(`receipt patch preimage is invalid: ${rel}`, 'RECEIPT_CORRUPT');
    }
  }

  if (!Array.isArray(receipt.createdFiles) || receipt.createdFiles.length !== planCreateFiles.size) {
    fail('receipt created-file set does not match its plan', 'RECEIPT_CORRUPT');
  }
  for (const created of receipt.createdFiles) {
    const rel = validateRelative(created.path);
    const action = planCreateFiles.get(rel);
    if (!action || action.sha256 !== created.sha256 || action.source !== created.source) {
      fail(`receipt created-file entry is invalid: ${rel}`, 'RECEIPT_CORRUPT');
    }
  }

  if (!Array.isArray(receipt.createdDirectories)) {
    fail('receipt created-directory set is invalid', 'RECEIPT_CORRUPT');
  }
  const actualCreatedDirectories = receipt.createdDirectories.map(validateRelative).sort();
  const expectedDirectories = expectedCreatedDirectories(receipt.plan);
  if (
    new Set(actualCreatedDirectories).size !== actualCreatedDirectories.length
    || stableJson(actualCreatedDirectories) !== stableJson(expectedDirectories)
  ) {
    fail('receipt created-directory set does not match the pre-transition inventory', 'RECEIPT_CORRUPT');
  }

  const stageAction = receipt.plan.actions.find((action) => action.kind === 'archive-stage-state');
  if (receipt.archivedStageState) {
    const rel = validateRelative(receipt.archivedStageState.path);
    const before = Buffer.from(receipt.archivedStageState.beforeBase64 || '', 'base64');
    if (
      rel !== '.blueprint/stage-state.json'
      || !stageAction
      || stageAction.beforeSha256 !== receipt.archivedStageState.sha256
      || sha256(before) !== receipt.archivedStageState.sha256
    ) {
      fail('receipt archived stage state is invalid', 'RECEIPT_CORRUPT');
    }
  } else if (stageAction) {
    fail('receipt omitted the planned stage-state archive', 'RECEIPT_CORRUPT');
  }
}

function loadReceipt(target, receiptId) {
  const pathname = receiptPath(target, receiptId);
  ensureNoSymlinkPath(target, posixRel(relative(target, pathname)));
  const stat = safeLstat(pathname);
  if (!stat?.isFile()) fail(`transition receipt not found: ${pathname}`, 'RECEIPT_MISSING');
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(pathname, 'utf8'));
  } catch (error) {
    fail(`transition receipt is corrupt: ${error.message}`, 'RECEIPT_CORRUPT');
  }
  validateReceiptShape(receipt, receiptId, target);
  return { receipt, pathname };
}

function descendants(target, rel) {
  const absolute = join(target, rel);
  const stat = safeLstat(absolute);
  if (!stat?.isDirectory()) return [];
  const output = [];
  const walk = (dirRel) => {
    for (const name of readdirSync(join(target, dirRel)).sort()) {
      const child = posixRel(join(dirRel, name));
      output.push(recordAt(target, child));
      if (output.at(-1).type === 'directory') walk(child);
    }
  };
  walk(rel);
  return output;
}

export function planVariantRollback({ targetDir, receiptId } = {}) {
  const target = requireGitRoot(targetDir || process.cwd());
  const { receipt, pathname } = loadReceipt(target, receiptId);
  const conflicts = [];

  for (const patched of receipt.patchedFiles) {
    ensureNoSymlinkPath(target, patched.path);
    const record = recordAt(target, patched.path);
    if (!record || record.type !== 'file' || record.sha256 !== patched.afterSha256) {
      conflicts.push(`${patched.path} no longer matches the transition postimage`);
    }
  }
  for (const created of receipt.createdFiles) {
    ensureNoSymlinkPath(target, created.path);
    const record = recordAt(target, created.path);
    if (!record || record.type !== 'file' || record.sha256 !== created.sha256) {
      conflicts.push(`${created.path} was removed or edited after transition`);
    }
  }
  if (receipt.archivedStageState) {
    ensureNoSymlinkPath(target, receipt.archivedStageState.path);
    if (existsSync(join(target, receipt.archivedStageState.path))) {
      conflicts.push(`${receipt.archivedStageState.path} has replacement state; rollback will not overwrite it`);
    }
  }

  const allowedFiles = new Set(receipt.createdFiles.map((item) => item.path));
  const allowedDirs = new Set(receipt.createdDirectories);
  for (const dir of receipt.createdDirectories) {
    for (const record of descendants(target, dir)) {
      if (record.type === 'directory') {
        if (!allowedDirs.has(record.path)) conflicts.push(`${record.path} was added inside a transition-created directory`);
      } else if (!allowedFiles.has(record.path)) {
        conflicts.push(`${record.path} was added inside a transition-created directory`);
      }
    }
  }

  const rollbackPath = join(dirname(pathname), 'rollback.json');
  ensureNoSymlinkPath(target, posixRel(relative(target, rollbackPath)));
  if (existsSync(rollbackPath)) conflicts.push('rollback receipt already exists');
  assertTargetIdentity(target, receipt.plan.targetIdentity);
  return {
    schema: ROLLBACK_SCHEMA,
    status: conflicts.length ? 'blocked' : 'ready',
    target,
    receiptId,
    receiptPath: posixRel(relative(target, pathname)),
    rollbackReceiptPath: posixRel(relative(target, rollbackPath)),
    restoreFiles: receipt.patchedFiles.map((item) => item.path),
    removeFiles: receipt.createdFiles.map((item) => item.path),
    removeDirectories: [...receipt.createdDirectories].sort((a, b) => b.split('/').length - a.split('/').length),
    restoreStageState: receipt.archivedStageState?.path ?? null,
    conflicts: [...new Set(conflicts)].sort(),
  };
}

function restoreRollbackFailure({
  target,
  targetIdentity,
  receipt,
  receiptId,
  currentPatched,
  currentCreated,
  restoredStage,
  rollbackReceiptFiles,
}) {
  assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
  const conflicts = [];
  for (const { pathname, sha256: expectedSha256 } of rollbackReceiptFiles) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
    removeOwnedFile(target, pathname, expectedSha256, conflicts, pathname);
  }
  if (restoredStage && receipt.archivedStageState) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
    removeOwnedFile(
      target,
      join(target, receipt.archivedStageState.path),
      receipt.archivedStageState.sha256,
      conflicts,
      receipt.archivedStageState.path,
    );
  }
  for (const rel of [...receipt.createdDirectories].sort((a, b) => a.split('/').length - b.split('/').length)) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
    try {
      ensureDirTracked(target, join(target, rel), []);
    } catch (error) {
      conflicts.push(`${rel} could not be restored safely: ${error.message}`);
    }
  }
  for (const [rel, bytes] of currentCreated) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
    const pathname = join(target, rel);
    const current = recoveryRegularFileHash(target, pathname, conflicts, rel);
    if (current.status === 'absent') {
      try {
        ensureDirTracked(target, dirname(pathname), []);
        durableCreateFile(pathname, bytes);
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        conflicts.push(`${rel} was recreated concurrently; preserved`);
      }
    } else if (current.status !== 'file' || current.sha256 !== sha256(bytes)) {
      conflicts.push(`${rel} was recreated concurrently with different content; preserved`);
    }
  }
  for (const patched of receipt.patchedFiles) {
    assertRecoveryTargetIdentity(target, targetIdentity, 'rollback');
    const bytes = currentPatched.get(patched.path);
    if (!bytes) continue;
    const pathname = join(target, patched.path);
    const current = recoveryRegularFileHash(target, pathname, conflicts, patched.path);
    if (current.status === 'file' && current.sha256 === patched.beforeSha256) {
      atomicWrite(
        pathname,
        bytes,
        patched.mode,
        `${receiptId}-rollback-restore`,
        { expectedSha256: patched.beforeSha256 },
      );
    } else if (current.status !== 'file' || current.sha256 !== patched.afterSha256) {
      conflicts.push(`${patched.path} changed concurrently during rollback; preserved`);
    }
  }
  if (conflicts.length) {
    fail(
      `rollback recovery preserved concurrent edits: ${conflicts.join(' | ')}`,
      'RECOVERY_CONFLICT',
    );
  }
}

function verifyRollbackPostimage(receipt, target) {
  assertTargetIdentity(target, receipt.plan.targetIdentity);
  for (const patched of receipt.patchedFiles) {
    const current = guardedRegularFileHash(target, patched.path);
    if (current.status !== 'file' || current.sha256 !== patched.beforeSha256) {
      fail(`${patched.path} changed after rollback restore`, 'TRANSACTION_VERIFY_FAILED');
    }
  }
  for (const created of receipt.createdFiles) {
    ensureNoSymlinkPath(target, created.path);
    if (safeLstat(join(target, created.path))) {
      fail(`${created.path} reappeared after rollback removal`, 'TRANSACTION_VERIFY_FAILED');
    }
  }
  if (receipt.archivedStageState) {
    const current = guardedRegularFileHash(target, receipt.archivedStageState.path);
    if (current.status !== 'file' || current.sha256 !== receipt.archivedStageState.sha256) {
      fail(`${receipt.archivedStageState.path} changed after rollback restore`, 'TRANSACTION_VERIFY_FAILED');
    }
  }
  assertTargetIdentity(target, receipt.plan.targetIdentity);
}

function rollbackVariantTransitionUnlocked({
  targetDir,
  receiptId,
  failAfter = null,
  mutationHook = null,
  lockToken,
} = {}) {
  const rollbackPlan = planVariantRollback({ targetDir, receiptId });
  if (rollbackPlan.status !== 'ready') {
    fail(`rollback is blocked: ${rollbackPlan.conflicts.join(' | ')}`, 'ROLLBACK_BLOCKED');
  }
  const target = rollbackPlan.target;
  const { receipt, pathname } = loadReceipt(target, receiptId);
  const rollbackAbsolute = join(target, rollbackPlan.rollbackReceiptPath);
  const currentPatched = new Map();
  const currentCreated = new Map();
  const restoredPatchedPaths = new Set();
  const removedCreatedPaths = new Set();
  const rollbackReceiptFiles = [];
  let restoredStage = false;
  let step = 0;
  const checkpoint = (operation, path) => {
    step += 1;
    invokeMutationHook(mutationHook, { operation: `after-${operation}`, path, target });
    if (failAfter === step) throw new Error(`injected rollback failure after step ${step}`);
  };
  for (const patched of receipt.patchedFiles) {
    const current = readFileSync(join(target, patched.path));
    if (sha256(current) !== patched.afterSha256) {
      fail(`${patched.path} changed before rollback journal creation`, 'CONCURRENT_MODIFICATION');
    }
    currentPatched.set(patched.path, current);
  }
  for (const created of receipt.createdFiles) {
    const current = readFileSync(join(target, created.path));
    if (sha256(current) !== created.sha256) {
      fail(`${created.path} changed before rollback journal creation`, 'CONCURRENT_MODIFICATION');
    }
    currentCreated.set(created.path, current);
  }
  const rollbackReceipt = {
    schema: ROLLBACK_SCHEMA,
    receiptId,
    rolledBackAt: new Date().toISOString(),
    target,
    restoredFiles: rollbackPlan.restoreFiles,
    removedFiles: rollbackPlan.removeFiles,
    removedDirectories: rollbackPlan.removeDirectories,
    restoredStageState: rollbackPlan.restoreStageState,
    originalReceiptRetained: posixRel(relative(target, pathname)),
  };
  const rollbackReceiptBytes = Buffer.from(`${JSON.stringify(rollbackReceipt, null, 2)}\n`);
  const rollbackReceiptSha256 = sha256(rollbackReceiptBytes);
  const rollbackTemp = `${rollbackAbsolute}.tmp`;
  const journal = buildJournal({
    operation: 'transition-rollback',
    target,
    targetIdentity: receipt.plan.targetIdentity,
    gitBaseline: receipt.plan.git.head,
    lockToken,
    payload: {
      receiptId,
      patchedFiles: receipt.patchedFiles.map((patched) => ({
        path: patched.path,
        appliedSha256: patched.afterSha256,
        appliedBase64: currentPatched.get(patched.path).toString('base64'),
        restoredSha256: patched.beforeSha256,
        mode: patched.mode,
      })),
      createdFiles: receipt.createdFiles.map((created) => ({
        path: created.path,
        sha256: created.sha256,
        appliedBase64: currentCreated.get(created.path).toString('base64'),
      })),
      createdDirectories: receipt.createdDirectories,
      restoredStageState: receipt.archivedStageState
        ? { path: receipt.archivedStageState.path, sha256: receipt.archivedStageState.sha256 }
        : null,
      successReceipt: {
        path: rollbackPlan.rollbackReceiptPath,
        tempPath: posixRel(relative(target, rollbackTemp)),
        sha256: rollbackReceiptSha256,
      },
    },
  });
  const journalPath = createJournal(target, { token: lockToken }, journal);
  invokeMutationHook(mutationHook, { operation: 'journal-created', path: journalPath, target });

  try {
    for (const patched of receipt.patchedFiles) {
      invokeMutationHook(mutationHook, { operation: 'restore-file', path: patched.path, target });
      assertTargetIdentity(target, receipt.plan.targetIdentity);
      ensureNoSymlinkPath(target, patched.path);
      const current = readFileSync(join(target, patched.path));
      if (sha256(current) !== patched.afterSha256) {
        fail(`${patched.path} changed immediately before rollback restore`, 'CONCURRENT_MODIFICATION');
      }
      const before = Buffer.from(patched.beforeBase64, 'base64');
      if (sha256(before) !== patched.beforeSha256) fail(`receipt preimage hash mismatch: ${patched.path}`, 'RECEIPT_CORRUPT');
      atomicWrite(
        join(target, patched.path),
        before,
        patched.mode,
        `${receiptId}-rollback`,
        { expectedSha256: patched.afterSha256 },
      );
      restoredPatchedPaths.add(patched.path);
      checkpoint('restore-file', patched.path);
    }
    for (const created of receipt.createdFiles) {
      invokeMutationHook(mutationHook, { operation: 'remove-created-file', path: created.path, target });
      assertTargetIdentity(target, receipt.plan.targetIdentity);
      ensureNoSymlinkPath(target, created.path);
      const current = readFileSync(join(target, created.path));
      if (sha256(current) !== created.sha256) {
        fail(`${created.path} changed immediately before rollback removal`, 'CONCURRENT_MODIFICATION');
      }
      durableUnlink(join(target, created.path));
      removedCreatedPaths.add(created.path);
      checkpoint('remove-created-file', created.path);
    }
    if (receipt.archivedStageState) {
      invokeMutationHook(mutationHook, {
        operation: 'restore-stage-state',
        path: receipt.archivedStageState.path,
        target,
      });
      assertTargetIdentity(target, receipt.plan.targetIdentity);
      ensureNoSymlinkPath(target, receipt.archivedStageState.path);
      const state = Buffer.from(receipt.archivedStageState.beforeBase64, 'base64');
      if (sha256(state) !== receipt.archivedStageState.sha256) fail('archived stage-state hash mismatch', 'RECEIPT_CORRUPT');
      ensureDirTracked(target, dirname(join(target, receipt.archivedStageState.path)), []);
      durableCreateFile(join(target, receipt.archivedStageState.path), state);
      restoredStage = true;
      checkpoint('restore-stage-state', receipt.archivedStageState.path);
    }
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    const directoryConflicts = removeEmptyDirs(target, rollbackPlan.removeDirectories);
    if (directoryConflicts.length) {
      fail(`rollback directory cleanup changed concurrently: ${directoryConflicts.join(' | ')}`, 'CONCURRENT_MODIFICATION');
    }

    invokeMutationHook(mutationHook, {
      operation: 'write-rollback-receipt',
      path: rollbackPlan.rollbackReceiptPath,
      target,
    });
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    ensureNoSymlinkPath(target, rollbackPlan.rollbackReceiptPath);
    verifyRollbackPostimage(receipt, target);
    const temp = rollbackTemp;
    durableCreateFile(temp, rollbackReceiptBytes);
    rollbackReceiptFiles.push({ pathname: temp, sha256: rollbackReceiptSha256 });
    // Last whole-operation check before the rollback receipt becomes visible.
    verifyRollbackPostimage(receipt, target);
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    linkSync(temp, rollbackAbsolute);
    fsyncDirectory(dirname(rollbackAbsolute));
    rollbackReceiptFiles.push({ pathname: rollbackAbsolute, sha256: rollbackReceiptSha256 });
    unlinkSync(temp);
    fsyncDirectory(dirname(rollbackAbsolute));
    rollbackReceiptFiles.splice(
      rollbackReceiptFiles.findIndex((item) => item.pathname === temp),
      1,
    );
    checkpoint('publish-rollback-receipt', rollbackPlan.rollbackReceiptPath);
    durableUnlink(journalPath);
    return {
      ok: true,
      rolledBack: true,
      status: 'rolled-back',
      target,
      receiptId,
      rollbackReceiptPath: rollbackPlan.rollbackReceiptPath,
      originalReceiptRetained: rollbackPlan.receiptPath,
    };
  } catch (error) {
    restoreRollbackFailure({
      target,
      targetIdentity: receipt.plan.targetIdentity,
      receipt,
      receiptId,
      currentPatched: new Map(
        [...currentPatched].filter(([path]) => restoredPatchedPaths.has(path)),
      ),
      currentCreated: new Map(
        [...currentCreated].filter(([path]) => removedCreatedPaths.has(path)),
      ),
      restoredStage,
      rollbackReceiptFiles,
    });
    durableUnlink(journalPath);
    if (error instanceof VariantTransitionError) throw error;
    fail(`rollback transaction failed and the applied state was restored — ${error.message}`, 'ROLLBACK_TRANSACTION_FAILED');
  }
}

export function rollbackVariantTransition(options = {}) {
  const target = requireGitRoot(options.targetDir || process.cwd());
  return withTransitionLock(target, (lock) => rollbackVariantTransitionUnlocked({
    ...options,
    targetDir: target,
    lockToken: lock.token,
  }));
}

function recoveryFileState(target, rel) {
  const safeRel = validateRelative(rel);
  ensureNoSymlinkPath(target, safeRel);
  return currentRegularFileHash(join(target, safeRel));
}

function validateEncodedFile(record, label, {
  base64Key = 'beforeBase64',
  hashKey = 'beforeSha256',
} = {}) {
  const rel = validateRelative(record?.path);
  const bytes = Buffer.from(record?.[base64Key] || '', 'base64');
  const hash = record?.[hashKey];
  if (!/^[a-f0-9]{64}$/.test(hash || '') || sha256(bytes) !== hash) {
    fail(`${label} preimage is invalid: ${rel}`, 'JOURNAL_CORRUPT');
  }
  return { rel, bytes, hash };
}

function planApplyJournalRecovery(target, journal) {
  const payload = journal.payload;
  if (
    !/^[a-f0-9]{64}$/.test(payload.planId || '')
    || !Array.isArray(payload.createdFiles)
    || !Array.isArray(payload.createdDirectories)
    || !Array.isArray(payload.supportDirectories)
    || !payload.successReceipt
  ) {
    fail('apply recovery journal payload is incomplete', 'JOURNAL_CORRUPT');
  }
  const blueprint = validateEncodedFile(payload.blueprint, 'apply blueprint');
  if (!/^[a-f0-9]{64}$/.test(payload.blueprint.afterSha256 || '')) {
    fail('apply blueprint postimage hash is invalid', 'JOURNAL_CORRUPT');
  }
  const createdFiles = payload.createdFiles.map((item) => {
    const path = validateRelative(item.path);
    if (!/^[a-f0-9]{64}$/.test(item.sha256 || '')) {
      fail(`apply created-file hash is invalid: ${path}`, 'JOURNAL_CORRUPT');
    }
    return { path, sha256: item.sha256 };
  });
  const createdDirectories = payload.createdDirectories.map(validateRelative);
  const supportDirectories = payload.supportDirectories.map(validateRelative);
  if (
    new Set(createdDirectories).size !== createdDirectories.length
    || new Set(supportDirectories).size !== supportDirectories.length
  ) {
    fail('apply recovery journal directory sets contain duplicates', 'JOURNAL_CORRUPT');
  }
  const successPath = validateRelative(payload.successReceipt.path);
  const successTempPath = validateRelative(payload.successReceipt.tempPath);
  const successHash = payload.successReceipt.sha256;
  if (!/^[a-f0-9]{64}$/.test(successHash || '')) {
    fail('apply success-receipt hash is invalid', 'JOURNAL_CORRUPT');
  }
  let stage = null;
  if (payload.archivedStageState) {
    stage = validateEncodedFile(payload.archivedStageState, 'archived stage state', {
      base64Key: 'beforeBase64',
      hashKey: 'sha256',
    });
  }

  const successState = recoveryFileState(target, successPath);
  const blueprintState = recoveryFileState(target, blueprint.rel);
  const createdStates = createdFiles.map((item) => ({
    ...item,
    state: recoveryFileState(target, item.path),
  }));
  const stageState = stage ? recoveryFileState(target, stage.rel) : null;
  const postimageComplete = successState.status === 'file'
    && successState.sha256 === successHash
    && blueprintState.status === 'file'
    && blueprintState.sha256 === payload.blueprint.afterSha256
    && createdStates.every((item) => item.state.status === 'file' && item.state.sha256 === item.sha256)
    && (!stage || stageState.status === 'absent');
  if (postimageComplete) {
    return {
      terminal: 'completed',
      actions: [],
      conflicts: [],
      detail: `transition ${payload.planId} completed; only stale journal/lock metadata remains`,
    };
  }

  const actions = [];
  const conflicts = [];
  if (successState.status !== 'absent') {
    conflicts.push(
      successState.status === 'file' && successState.sha256 === successHash
        ? `${successPath} exists but the complete transition postimage does not verify`
        : `${successPath} does not match the journaled success receipt`,
    );
  }
  const tempState = recoveryFileState(target, successTempPath);
  if (tempState.status === 'file' && tempState.sha256 === successHash) {
    actions.push({ kind: 'remove-file', path: successTempPath, expectedSha256: successHash });
  } else if (tempState.status !== 'absent') {
    conflicts.push(`${successTempPath} is not the journal-owned receipt temporary file`);
  }
  for (const item of [...createdStates].reverse()) {
    if (item.state.status === 'absent') continue;
    if (item.state.status === 'file' && item.state.sha256 === item.sha256) {
      actions.push({ kind: 'remove-file', path: item.path, expectedSha256: item.sha256 });
    } else {
      conflicts.push(`${item.path} changed after the interrupted transition; preserved`);
    }
  }
  if (blueprintState.status === 'file' && blueprintState.sha256 === payload.blueprint.afterSha256) {
    actions.push({
      kind: 'restore-file',
      path: blueprint.rel,
      expectedSha256: payload.blueprint.afterSha256,
      bytesBase64: blueprint.bytes.toString('base64'),
      mode: payload.blueprint.mode,
    });
  } else if (!(blueprintState.status === 'file' && blueprintState.sha256 === blueprint.hash)) {
    conflicts.push(`${blueprint.rel} matches neither the transition preimage nor postimage; preserved`);
  }
  if (stage) {
    if (stageState.status === 'absent') {
      actions.push({
        kind: 'create-file',
        path: stage.rel,
        bytesBase64: stage.bytes.toString('base64'),
        sha256: stage.hash,
      });
    } else if (!(stageState.status === 'file' && stageState.sha256 === stage.hash)) {
      conflicts.push(`${stage.rel} was recreated with different content; preserved`);
    }
  }
  for (const path of [...createdDirectories, ...supportDirectories]
    .sort((a, b) => b.split('/').length - a.split('/').length)) {
    actions.push({ kind: 'remove-directory-if-empty', path });
  }
  return {
    terminal: 'pre-operation',
    actions,
    conflicts: [...new Set(conflicts)].sort(),
    detail: `restore interrupted transition ${payload.planId} to its greenfield preimage`,
  };
}

function planRollbackJournalRecovery(target, journal) {
  const payload = journal.payload;
  if (
    !/^[a-f0-9]{64}$/.test(payload.receiptId || '')
    || !Array.isArray(payload.patchedFiles)
    || !Array.isArray(payload.createdFiles)
    || !Array.isArray(payload.createdDirectories)
    || !payload.successReceipt
  ) {
    fail('rollback recovery journal payload is incomplete', 'JOURNAL_CORRUPT');
  }
  const patched = payload.patchedFiles.map((item) => {
    const encoded = validateEncodedFile(item, 'rollback applied file', {
      base64Key: 'appliedBase64',
      hashKey: 'appliedSha256',
    });
    if (!/^[a-f0-9]{64}$/.test(item.restoredSha256 || '')) {
      fail(`rollback restored-file hash is invalid: ${encoded.rel}`, 'JOURNAL_CORRUPT');
    }
    return { ...item, path: encoded.rel, bytes: encoded.bytes };
  });
  const created = payload.createdFiles.map((item) => {
    const encoded = validateEncodedFile(item, 'rollback created file', {
      base64Key: 'appliedBase64',
      hashKey: 'sha256',
    });
    return { ...item, path: encoded.rel, bytes: encoded.bytes };
  });
  const directories = payload.createdDirectories.map(validateRelative);
  if (new Set(directories).size !== directories.length) {
    fail('rollback recovery journal directory set contains duplicates', 'JOURNAL_CORRUPT');
  }
  const successPath = validateRelative(payload.successReceipt.path);
  const successTempPath = validateRelative(payload.successReceipt.tempPath);
  const successHash = payload.successReceipt.sha256;
  if (!/^[a-f0-9]{64}$/.test(successHash || '')) {
    fail('rollback success-receipt hash is invalid', 'JOURNAL_CORRUPT');
  }
  const successState = recoveryFileState(target, successPath);
  const patchedStates = patched.map((item) => ({ ...item, state: recoveryFileState(target, item.path) }));
  const createdStates = created.map((item) => ({ ...item, state: recoveryFileState(target, item.path) }));
  const restoredStage = payload.restoredStageState
    ? { ...payload.restoredStageState, path: validateRelative(payload.restoredStageState.path) }
    : null;
  if (restoredStage && !/^[a-f0-9]{64}$/.test(restoredStage.sha256 || '')) {
    fail('rollback stage-state hash is invalid', 'JOURNAL_CORRUPT');
  }
  const stageState = restoredStage ? recoveryFileState(target, restoredStage.path) : null;
  const rollbackPostimageComplete = successState.status === 'file'
    && successState.sha256 === successHash
    && patchedStates.every((item) => item.state.status === 'file' && item.state.sha256 === item.restoredSha256)
    && createdStates.every((item) => item.state.status === 'absent')
    && (!restoredStage || (stageState.status === 'file' && stageState.sha256 === restoredStage.sha256));
  if (rollbackPostimageComplete) {
    return {
      terminal: 'completed',
      actions: [],
      conflicts: [],
      detail: `rollback ${payload.receiptId} completed; only stale journal/lock metadata remains`,
    };
  }

  const actions = [];
  const conflicts = [];
  if (successState.status !== 'absent') {
    conflicts.push(
      successState.status === 'file' && successState.sha256 === successHash
        ? `${successPath} exists but the complete rollback postimage does not verify`
        : `${successPath} does not match the journaled rollback receipt`,
    );
  }
  const tempState = recoveryFileState(target, successTempPath);
  if (tempState.status === 'file' && tempState.sha256 === successHash) {
    actions.push({ kind: 'remove-file', path: successTempPath, expectedSha256: successHash });
  } else if (tempState.status !== 'absent') {
    conflicts.push(`${successTempPath} is not the journal-owned rollback temporary file`);
  }
  for (const path of [...directories].sort((a, b) => a.split('/').length - b.split('/').length)) {
    actions.push({ kind: 'create-directory-if-absent', path });
  }
  for (const item of patchedStates) {
    if (item.state.status === 'file' && item.state.sha256 === item.restoredSha256) {
      actions.push({
        kind: 'restore-file',
        path: item.path,
        expectedSha256: item.restoredSha256,
        bytesBase64: item.bytes.toString('base64'),
        mode: item.mode,
      });
    } else if (!(item.state.status === 'file' && item.state.sha256 === item.appliedSha256)) {
      conflicts.push(`${item.path} matches neither the applied nor rollback postimage; preserved`);
    }
  }
  for (const item of createdStates) {
    if (item.state.status === 'absent') {
      actions.push({
        kind: 'create-file',
        path: item.path,
        bytesBase64: item.bytes.toString('base64'),
        sha256: item.sha256,
      });
    } else if (!(item.state.status === 'file' && item.state.sha256 === item.sha256)) {
      conflicts.push(`${item.path} was recreated with different content; preserved`);
    }
  }
  if (restoredStage) {
    if (stageState.status === 'file' && stageState.sha256 === restoredStage.sha256) {
      actions.push({ kind: 'remove-file', path: restoredStage.path, expectedSha256: restoredStage.sha256 });
    } else if (stageState.status !== 'absent') {
      conflicts.push(`${restoredStage.path} changed after interrupted rollback; preserved`);
    }
  }
  return {
    terminal: 'pre-operation',
    actions,
    conflicts: [...new Set(conflicts)].sort(),
    detail: `restore interrupted rollback ${payload.receiptId} to its applied preimage`,
  };
}

export function planVariantRecovery({
  targetDir,
  recoveryLockToken = null,
} = {}) {
  const target = requireGitRoot(targetDir || process.cwd());
  const lock = readLockState(target);
  let loaded;
  try {
    loaded = loadJournal(target);
  } catch (error) {
    return {
      status: 'blocked',
      target,
      operation: null,
      terminal: null,
      actions: [],
      conflicts: [error.message],
      lock: {
        present: lock.present,
        alive: lock.alive,
        valid: !!lock.parsed,
      },
    };
  }
  const { pathname: journalPath, journal } = loaded;
  if (!journal) {
    if (!lock.present) {
      return {
        status: 'none',
        target,
        operation: null,
        terminal: 'unchanged',
        actions: [],
        conflicts: [],
        lock: { present: false, alive: false, valid: true },
      };
    }
    if (!lock.parsed || lock.alive !== false) {
      return {
        status: lock.alive === true ? 'active' : 'blocked',
        target,
        operation: null,
        terminal: null,
        actions: [],
        conflicts: [lock.parsed ? 'variant operation lock owner is still active' : 'variant operation lock is malformed'],
        lock: { present: true, alive: lock.alive, valid: !!lock.parsed },
      };
    }
    return {
      status: 'stale-lock',
      target,
      operation: null,
      terminal: 'unchanged',
      actions: [{ kind: 'clear-stale-lock', path: lock.pathname }],
      conflicts: [],
      lock: { present: true, alive: false, valid: true, token: lock.parsed.value },
    };
  }

  const usingRecoveryLock = recoveryLockToken && lock.parsed?.value === recoveryLockToken;
  const conflicts = [];
  if (!usingRecoveryLock && lock.present) {
    if (!lock.parsed) conflicts.push('variant operation lock is malformed');
    else if (lock.parsed.value !== journal.lockToken) conflicts.push('variant operation lock token does not match the recovery journal');
    else if (lock.alive !== false) conflicts.push('variant operation lock owner is still active');
  }
  const operationPlan = journal.operation === 'transition-apply'
    ? planApplyJournalRecovery(target, journal)
    : planRollbackJournalRecovery(target, journal);
  conflicts.push(...operationPlan.conflicts);
  return {
    status: conflicts.length
      ? 'blocked'
      : (operationPlan.terminal === 'completed' ? 'completed-stale-metadata' : 'interrupted'),
    target,
    operation: journal.operation,
    journalId: journal.journalId,
    journalPath,
    terminal: operationPlan.terminal,
    detail: operationPlan.detail,
    actions: operationPlan.actions,
    conflicts: [...new Set(conflicts)].sort(),
    lock: {
      present: lock.present,
      alive: lock.alive,
      valid: !!lock.parsed,
      token: lock.parsed?.value ?? null,
      journalToken: journal.lockToken,
    },
  };
}

function executeRecoveryAction(target, action, token) {
  if (action.kind === 'remove-file') {
    const state = recoveryFileState(target, action.path);
    if (state.status === 'absent') return;
    if (state.status !== 'file' || state.sha256 !== action.expectedSha256) {
      fail(`recovery preimage changed before removing ${action.path}`, 'RECOVERY_CONFLICT');
    }
    durableUnlink(join(target, action.path));
    return;
  }
  if (action.kind === 'restore-file') {
    const bytes = Buffer.from(action.bytesBase64, 'base64');
    atomicWrite(
      join(target, action.path),
      bytes,
      action.mode || 0o644,
      `${token}-recover`,
      { expectedSha256: action.expectedSha256 },
    );
    return;
  }
  if (action.kind === 'create-directory-if-absent') {
    ensureNoSymlinkPath(target, action.path);
    ensureDirTracked(target, join(target, action.path), []);
    return;
  }
  if (action.kind === 'create-file') {
    const bytes = Buffer.from(action.bytesBase64, 'base64');
    if (sha256(bytes) !== action.sha256) fail(`recovery bytes changed for ${action.path}`, 'JOURNAL_CORRUPT');
    ensureNoSymlinkPath(target, action.path);
    ensureDirTracked(target, dirname(join(target, action.path)), []);
    durableCreateFile(join(target, action.path), bytes);
    return;
  }
  if (action.kind === 'remove-directory-if-empty') {
    const conflicts = removeEmptyDirs(target, [action.path]);
    if (conflicts.length || safeLstat(join(target, action.path))) {
      fail(
        `recovery could not remove transition-owned directory ${action.path}${conflicts.length ? `: ${conflicts.join(' | ')}` : ''}`,
        'RECOVERY_CONFLICT',
      );
    }
    return;
  }
  fail(`unsupported recovery action: ${action.kind}`, 'JOURNAL_CORRUPT');
}

export function recoverVariantTransition({ targetDir } = {}) {
  const target = requireGitRoot(targetDir || process.cwd());
  const initial = planVariantRecovery({ targetDir: target });
  if (initial.status === 'none') {
    return { ok: true, recovered: false, status: 'none', target, terminal: 'unchanged', actions: [] };
  }
  if (initial.conflicts.length) {
    fail(`variant recovery is blocked: ${initial.conflicts.join(' | ')}`, 'RECOVERY_BLOCKED');
  }
  const priorLock = readLockState(target);
  if (priorLock.present) {
    if (!priorLock.parsed || priorLock.alive !== false) {
      fail('variant recovery cannot take over an active or malformed lock', 'RECOVERY_BLOCKED');
    }
    if (
      initial.lock.journalToken
      && priorLock.parsed.value !== initial.lock.journalToken
    ) {
      fail('variant recovery lock token changed after planning', 'RECOVERY_BLOCKED');
    }
    durableUnlink(priorLock.pathname);
  }
  const recoveryLock = acquireTransitionLock(target);
  try {
    if (initial.status === 'stale-lock') {
      return {
        ok: true,
        recovered: true,
        status: 'recovered',
        target,
        operation: null,
        terminal: 'unchanged',
        actions: initial.actions,
      };
    }
    const fresh = planVariantRecovery({
      targetDir: target,
      recoveryLockToken: recoveryLock.token,
    });
    if (fresh.conflicts.length || !['interrupted', 'completed-stale-metadata', 'stale-lock'].includes(fresh.status)) {
      fail(`variant recovery state changed after lock acquisition: ${fresh.conflicts.join(' | ') || fresh.status}`, 'RECOVERY_BLOCKED');
    }
    assertTargetIdentity(target, loadJournal(target).journal?.targetIdentity || directoryIdentity(target));
    for (const action of fresh.actions) executeRecoveryAction(target, action, fresh.journalId || 'stale-lock');
    const verified = planVariantRecovery({
      targetDir: target,
      recoveryLockToken: recoveryLock.token,
    });
    const expected = fresh.terminal === 'completed' ? 'completed-stale-metadata' : 'interrupted';
    if (verified.status !== expected || verified.conflicts.length) {
      fail(`recovery postimage verification failed: ${verified.conflicts.join(' | ') || verified.status}`, 'RECOVERY_CONFLICT');
    }
    durableUnlink(transitionJournalPath(target));
    return {
      ok: true,
      recovered: true,
      status: fresh.terminal === 'completed' ? 'completed' : 'recovered',
      target,
      operation: fresh.operation,
      terminal: fresh.terminal,
      actions: fresh.actions,
    };
  } finally {
    releaseTransitionLock(recoveryLock);
  }
}

export function inspectVariantTransitionState({ targetDir } = {}) {
  const target = requireGitRoot(targetDir || process.cwd());
  const recovery = planVariantRecovery({ targetDir: target });
  if (recovery.status !== 'none') {
    const map = {
      active: 'active',
      blocked: 'corrupt',
      interrupted: 'interrupted',
      'completed-stale-metadata': 'interrupted',
      'stale-lock': 'interrupted',
    };
    return {
      status: map[recovery.status] || 'corrupt',
      target,
      recovery,
      receipts: [],
    };
  }
  const rootRel = '.blueprint/variant-transitions';
  try {
    ensureNoSymlinkPath(target, rootRel);
  } catch (error) {
    return { status: 'corrupt', target, detail: error.message, receipts: [] };
  }
  const root = join(target, rootRel);
  const stat = safeLstat(root);
  if (!stat) return { status: 'none', target, receipts: [] };
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    return { status: 'corrupt', target, detail: `${rootRel} is not a real directory`, receipts: [] };
  }
  const entries = readdirSync(root).sort();
  const unexpected = entries.filter((name) => !/^[a-f0-9]{64}$/.test(name));
  if (unexpected.length) {
    return {
      status: 'corrupt',
      target,
      detail: `unexpected transition support entries: ${unexpected.join(', ')}`,
      receipts: [],
    };
  }
  const ids = entries;
  const receipts = [];
  for (const id of ids) {
    try {
      const { receipt } = loadReceipt(target, id);
      const rollbackPathname = join(target, rootRel, id, 'rollback.json');
      if (safeLstat(rollbackPathname)) {
        const rollback = JSON.parse(readFileSync(rollbackPathname, 'utf8'));
        if (rollback.schema !== ROLLBACK_SCHEMA || rollback.receiptId !== id) {
          throw new Error('rollback receipt shape is invalid');
        }
        receipts.push({ receiptId: id, status: 'rolled-back', rollbackAvailable: false });
      } else {
        const rollbackPlan = planVariantRollback({ targetDir: target, receiptId: id });
        receipts.push({
          receiptId: id,
          status: rollbackPlan.status === 'ready' ? 'applied' : 'applied-rollback-blocked',
          rollbackAvailable: rollbackPlan.status === 'ready',
          conflicts: rollbackPlan.conflicts,
        });
      }
      void receipt;
    } catch (error) {
      receipts.push({ receiptId: id, status: 'corrupt', rollbackAvailable: false, conflicts: [error.message] });
    }
  }
  if (!receipts.length) return { status: 'none', target, receipts: [] };
  if (receipts.some((item) => item.status === 'corrupt') || receipts.filter((item) => item.status !== 'rolled-back').length > 1) {
    return { status: 'corrupt', target, receipts };
  }
  const active = receipts.find((item) => item.status !== 'rolled-back');
  return { status: active?.status || 'rolled-back', target, receipts };
}

export function formatTransitionPlan(plan) {
  const lines = [
    `blueprint variant transition — ${plan.status}`,
    `target: ${plan.target}`,
    `transition: ${plan.from} -> ${plan.to}`,
    `plan-id: ${plan.planId}`,
  ];
  if (plan.status === 'already-transitioned') {
    lines.push('no actions — target already declares the research variant.');
    return lines.join('\n');
  }
  for (const action of plan.actions) {
    if (action.kind === 'patch-file') {
      for (const change of action.changes) lines.push(`PATCH ${action.path}: ${change.key} ${change.from} -> ${change.to}`);
    } else if (action.kind === 'create-file') {
      lines.push(`CREATE ${action.path} (${action.size} bytes; ${action.source})`);
    } else if (action.kind === 'create-directory') {
      lines.push(`CREATE-DIR ${action.path}/`);
    } else if (action.kind === 'archive-stage-state') {
      lines.push(`ARCHIVE ${action.path} (${action.size} bytes)`);
    }
  }
  for (const collision of plan.collisions) {
    lines.push(`PRESERVE ${collision.path} (${collision.size} bytes; sha256 ${collision.sha256})`);
  }
  if (plan.stageState.requiresAcceptance) {
    lines.push(`BLOCK ${plan.stageState.path}: re-plan with --accept-stage-reset to archive/reset incompatible cursor state.`);
  }
  for (const dirty of plan.dirtyPlannedPaths) lines.push(`BLOCK dirty planned path: ${dirty}`);
  lines.push('cleanup: plan only; no deletion or nested-config rewrite is authorized.');
  lines.push(`apply: re-run with --apply --plan-id=${plan.planId}${plan.stageState.status === 'archive-and-reset' ? ' --accept-stage-reset' : ''}`);
  return lines.join('\n');
}

export function formatRollbackPlan(plan) {
  const lines = [
    `blueprint variant rollback — ${plan.status}`,
    `target: ${plan.target}`,
    `receipt: ${plan.receiptId}`,
  ];
  for (const path of plan.restoreFiles) lines.push(`RESTORE ${path}`);
  for (const path of plan.removeFiles) lines.push(`REMOVE-IF-UNCHANGED ${path}`);
  if (plan.restoreStageState) lines.push(`RESTORE ${plan.restoreStageState}`);
  for (const conflict of plan.conflicts) lines.push(`BLOCK ${conflict}`);
  if (plan.status === 'ready') lines.push(`apply: re-run with --apply --receipt=${plan.receiptId}`);
  return lines.join('\n');
}
