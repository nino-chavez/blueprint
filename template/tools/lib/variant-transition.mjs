/**
 * variant-transition.mjs — preservation-first Blueprint variant migration.
 *
 * v1 is deliberately narrow: a Git-root initiative with an explicit top-level
 * `variant: greenfield` can transition to `research`. Planning is read-only.
 * Apply is plan-id pinned, create-if-absent, transactional within the process,
 * and receipt-backed. Cleanup is reported but never enacted.
 */

import {
  chmodSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
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

function transitionLockPath(target) {
  const gitPath = git(target, ['rev-parse', '--git-path', 'blueprint-variant-transition.lock']);
  return isAbsolute(gitPath) ? gitPath : resolve(target, gitPath);
}

function withTransitionLock(target, operation) {
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
  try {
    return operation();
  } finally {
    try {
      if (readFileSync(pathname, 'utf8') === `${token}\n`) unlinkSync(pathname);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

function invokeMutationHook(hook, event) {
  if (hook == null) return;
  if (typeof hook !== 'function') fail('mutationHook must be a function', 'INVALID_TEST_HOOK');
  hook(event);
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
    }
  }
}

function atomicWrite(pathname, bytes, mode, token, { expectedSha256 = null } = {}) {
  const temp = `${pathname}.variant-transition-${token}.tmp`;
  if (existsSync(temp)) fail(`transaction temp already exists: ${temp}`, 'TRANSACTION_COLLISION');
  let tempOwned = false;
  try {
    writeFileSync(temp, bytes, { flag: 'wx' });
    tempOwned = true;
    chmodSync(temp, mode);
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
  unlinkSync(pathname);
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
        writeFileSync(stagePath, stageBefore, { flag: 'wx' });
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
  let stageBefore = null;
  let stageRemoved = false;
  let step = 0;
  const checkpoint = () => {
    step += 1;
    if (failAfter === step) throw new Error(`injected transition failure after step ${step}`);
  };

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
    checkpoint();

    for (const action of plan.actions.filter((item) => item.kind === 'create-directory')) {
      invokeMutationHook(mutationHook, { operation: 'create-directory', path: action.path, target });
      assertTargetIdentity(target, plan.targetIdentity);
      ensureNoSymlinkPath(target, action.path);
      ensureDirTracked(target, join(target, action.path), createdDirs);
      checkpoint();
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
      writeFileSync(join(target, action.path), material.content, { flag: 'wx' });
      createdFiles.push(action.path);
      createdFileHashes.set(action.path, action.sha256);
      checkpoint();
    }

    const stageAction = plan.actions.find((item) => item.kind === 'archive-stage-state');
    if (stageAction) {
      const stagePath = join(target, stageAction.path);
      invokeMutationHook(mutationHook, { operation: 'archive-stage-state', path: stageAction.path, target });
      assertTargetIdentity(target, plan.targetIdentity);
      ensureNoSymlinkPath(target, stageAction.path);
      stageBefore = readFileSync(stagePath);
      if (sha256(stageBefore) !== stageAction.beforeSha256) {
        fail('stage state changed immediately before archive', 'CONCURRENT_MODIFICATION');
      }
      unlinkSync(stagePath);
      stageRemoved = true;
      checkpoint();
    }

    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    checkpoint();

    invokeMutationHook(mutationHook, { operation: 'write-receipt', path: plan.receiptPath, target });
    assertTargetIdentity(target, plan.targetIdentity);
    ensureNoSymlinkPath(target, plan.receiptPath);
    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    ensureDirTracked(target, dirname(receiptAbsolute), receiptDirs);
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
      createdDirectories: [...new Set(createdDirs)].sort(),
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
    writeFileSync(receiptTemp, receiptBytes, { flag: 'wx' });
    receiptFiles.push({ pathname: receiptTemp, sha256: receiptSha256 });
    ensureNoSymlinkPath(target, plan.receiptPath);
    // Last whole-operation check before the success receipt becomes visible.
    // A receipt may never certify a postimage that changed after verification.
    verifyAppliedPostimage(plan, target, createdFiles, createdDirs);
    assertTargetIdentity(target, plan.targetIdentity);
    linkSync(receiptTemp, receiptAbsolute);
    receiptFiles.push({ pathname: receiptAbsolute, sha256: receiptSha256 });
    unlinkSync(receiptTemp);
    receiptFiles.splice(receiptFiles.findIndex((item) => item.pathname === receiptTemp), 1);
    checkpoint();

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
    if (error instanceof VariantTransitionError) throw error;
    fail(`transition transaction failed and was restored — ${error.message}`, 'TRANSACTION_FAILED');
  }
}

export function applyVariantTransition(options = {}) {
  const target = requireGitRoot(options.targetDir || process.cwd());
  return withTransitionLock(target, () => applyVariantTransitionUnlocked({
    ...options,
    targetDir: target,
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
        writeFileSync(pathname, bytes, { flag: 'wx' });
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
  const rollbackReceiptFiles = [];
  let restoredStage = false;
  let step = 0;
  const checkpoint = () => {
    step += 1;
    if (failAfter === step) throw new Error(`injected rollback failure after step ${step}`);
  };

  try {
    for (const patched of receipt.patchedFiles) {
      invokeMutationHook(mutationHook, { operation: 'restore-file', path: patched.path, target });
      assertTargetIdentity(target, receipt.plan.targetIdentity);
      ensureNoSymlinkPath(target, patched.path);
      const current = readFileSync(join(target, patched.path));
      if (sha256(current) !== patched.afterSha256) {
        fail(`${patched.path} changed immediately before rollback restore`, 'CONCURRENT_MODIFICATION');
      }
      currentPatched.set(patched.path, current);
      const before = Buffer.from(patched.beforeBase64, 'base64');
      if (sha256(before) !== patched.beforeSha256) fail(`receipt preimage hash mismatch: ${patched.path}`, 'RECEIPT_CORRUPT');
      atomicWrite(
        join(target, patched.path),
        before,
        patched.mode,
        `${receiptId}-rollback`,
        { expectedSha256: patched.afterSha256 },
      );
      checkpoint();
    }
    for (const created of receipt.createdFiles) {
      invokeMutationHook(mutationHook, { operation: 'remove-created-file', path: created.path, target });
      assertTargetIdentity(target, receipt.plan.targetIdentity);
      ensureNoSymlinkPath(target, created.path);
      const current = readFileSync(join(target, created.path));
      if (sha256(current) !== created.sha256) {
        fail(`${created.path} changed immediately before rollback removal`, 'CONCURRENT_MODIFICATION');
      }
      currentCreated.set(created.path, current);
      unlinkSync(join(target, created.path));
      checkpoint();
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
      writeFileSync(join(target, receipt.archivedStageState.path), state, { flag: 'wx' });
      restoredStage = true;
      checkpoint();
    }
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    const directoryConflicts = removeEmptyDirs(target, rollbackPlan.removeDirectories);
    if (directoryConflicts.length) {
      fail(`rollback directory cleanup changed concurrently: ${directoryConflicts.join(' | ')}`, 'CONCURRENT_MODIFICATION');
    }

    const rollbackReceipt = {
      schema: ROLLBACK_SCHEMA,
      receiptId,
      rolledBackAt: new Date().toISOString(),
      target,
      restoredFiles: rollbackPlan.restoreFiles,
      removedFiles: rollbackPlan.removeFiles,
      removedDirectories: rollbackPlan.removeDirectories.filter((rel) => !existsSync(join(target, rel))),
      restoredStageState: rollbackPlan.restoreStageState,
      originalReceiptRetained: posixRel(relative(target, pathname)),
    };
    invokeMutationHook(mutationHook, {
      operation: 'write-rollback-receipt',
      path: rollbackPlan.rollbackReceiptPath,
      target,
    });
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    ensureNoSymlinkPath(target, rollbackPlan.rollbackReceiptPath);
    verifyRollbackPostimage(receipt, target);
    const rollbackReceiptBytes = Buffer.from(`${JSON.stringify(rollbackReceipt, null, 2)}\n`);
    const rollbackReceiptSha256 = sha256(rollbackReceiptBytes);
    const temp = `${rollbackAbsolute}.tmp`;
    writeFileSync(temp, rollbackReceiptBytes, { flag: 'wx' });
    rollbackReceiptFiles.push({ pathname: temp, sha256: rollbackReceiptSha256 });
    // Last whole-operation check before the rollback receipt becomes visible.
    verifyRollbackPostimage(receipt, target);
    assertTargetIdentity(target, receipt.plan.targetIdentity);
    linkSync(temp, rollbackAbsolute);
    rollbackReceiptFiles.push({ pathname: rollbackAbsolute, sha256: rollbackReceiptSha256 });
    unlinkSync(temp);
    rollbackReceiptFiles.splice(
      rollbackReceiptFiles.findIndex((item) => item.pathname === temp),
      1,
    );
    checkpoint();
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
      currentPatched,
      currentCreated,
      restoredStage,
      rollbackReceiptFiles,
    });
    if (error instanceof VariantTransitionError) throw error;
    fail(`rollback transaction failed and the applied state was restored — ${error.message}`, 'ROLLBACK_TRANSACTION_FAILED');
  }
}

export function rollbackVariantTransition(options = {}) {
  const target = requireGitRoot(options.targetDir || process.cwd());
  return withTransitionLock(target, () => rollbackVariantTransitionUnlocked({
    ...options,
    targetDir: target,
  }));
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
