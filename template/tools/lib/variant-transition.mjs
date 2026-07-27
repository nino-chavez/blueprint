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
  const root = git(declared, ['rev-parse', '--show-toplevel']);
  if (realpathSync(root) !== realpathSync(declared)) {
    fail(`transition target must be the Git worktree root (got ${declared}; Git root is ${root})`, 'TARGET_NOT_GIT_ROOT');
  }
  return declared;
}

function gitHead(target) {
  return git(target, ['rev-parse', 'HEAD']);
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
  try {
    JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`${rel} is corrupt and cannot be archived safely — ${error.message}`, 'STAGE_STATE_CORRUPT');
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
  return publicPlan({ ...core, dirtyPlannedPaths });
}

function materialMap(home) {
  return new Map(scaffoldMaterials(home).map((material) => [material.path, material]));
}

function ensureDirTracked(target, absoluteDir, createdDirs) {
  const missing = [];
  let cursor = absoluteDir;
  while (cursor !== target && !existsSync(cursor)) {
    missing.push(cursor);
    cursor = dirname(cursor);
  }
  if (cursor === target || cursor.startsWith(`${target}${sep}`)) {
    for (const dir of missing.reverse()) {
      mkdirSync(dir);
      createdDirs.push(posixRel(relative(target, dir)));
    }
    return;
  }
  fail(`refusing to create a directory outside transition target: ${absoluteDir}`, 'UNSAFE_PATH');
}

function atomicWrite(pathname, bytes, mode, token) {
  const temp = `${pathname}.variant-transition-${token}.tmp`;
  if (existsSync(temp)) fail(`transaction temp already exists: ${temp}`, 'TRANSACTION_COLLISION');
  writeFileSync(temp, bytes, { flag: 'wx' });
  chmodSync(temp, mode);
  renameSync(temp, pathname);
  return temp;
}

function removeEmptyDirs(target, rels) {
  for (const rel of [...new Set(rels)].sort((a, b) => b.split('/').length - a.split('/').length)) {
    const absolute = join(target, rel);
    try {
      rmdirSync(absolute);
    } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error?.code)) throw error;
    }
  }
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

function rollbackApplyFailure({
  target,
  token,
  blueprintBefore,
  blueprintMode,
  blueprintChanged,
  createdFiles,
  createdDirs,
  stageBefore,
  stageRemoved,
  receiptFiles,
  receiptDirs,
}) {
  for (const pathname of receiptFiles) {
    try { unlinkSync(pathname); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  }
  if (stageRemoved && stageBefore) {
    ensureDirTracked(target, dirname(join(target, '.blueprint/stage-state.json')), createdDirs);
    writeFileSync(join(target, '.blueprint/stage-state.json'), stageBefore, { flag: 'wx' });
  }
  for (const rel of [...createdFiles].reverse()) {
    try { unlinkSync(join(target, rel)); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  }
  if (blueprintChanged) {
    atomicWrite(join(target, 'blueprint.yml'), blueprintBefore, blueprintMode, `${token}-restore`);
  }
  removeEmptyDirs(target, [...receiptDirs, ...createdDirs]);
}

export function applyVariantTransition({
  targetDir,
  home = DEFAULT_HOME,
  to = 'research',
  planId,
  acceptStageReset = false,
  failAfter = null,
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
  if (existsSync(dirname(receiptAbsolute))) {
    fail(`receipt directory already exists for plan ${plan.planId}`, 'RECEIPT_EXISTS');
  }
  const materials = materialMap(resolve(home));
  const blueprintPath = join(target, 'blueprint.yml');
  const blueprintBefore = readFileSync(blueprintPath);
  const blueprintMode = statSync(blueprintPath).mode & 0o777;
  const blueprintPatch = computeBlueprintPatch(blueprintBefore.toString('utf8'));
  const blueprintAfter = Buffer.from(blueprintPatch.next);
  const createdFiles = [];
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
    atomicWrite(blueprintPath, blueprintAfter, blueprintMode, plan.planId);
    blueprintChanged = true;
    checkpoint();

    for (const action of plan.actions.filter((item) => item.kind === 'create-directory')) {
      ensureDirTracked(target, join(target, action.path), createdDirs);
      checkpoint();
    }
    for (const action of plan.actions.filter((item) => item.kind === 'create-file')) {
      const material = materials.get(action.path);
      if (!material || material.sha256 !== action.sha256) {
        fail(`canonical scaffold changed after planning: ${action.path}`, 'CANONICAL_SCAFFOLD_CHANGED');
      }
      ensureDirTracked(target, dirname(join(target, action.path)), createdDirs);
      writeFileSync(join(target, action.path), material.content, { flag: 'wx' });
      createdFiles.push(action.path);
      checkpoint();
    }

    const stageAction = plan.actions.find((item) => item.kind === 'archive-stage-state');
    if (stageAction) {
      const stagePath = join(target, stageAction.path);
      stageBefore = readFileSync(stagePath);
      if (sha256(stageBefore) !== stageAction.beforeSha256) {
        fail('stage state changed after planning', 'PLAN_MISMATCH');
      }
      unlinkSync(stagePath);
      stageRemoved = true;
      checkpoint();
    }

    if (sha256(readFileSync(blueprintPath)) !== plan.actions.find((item) => item.kind === 'patch-file').afterSha256) {
      fail('blueprint.yml did not match the planned postimage', 'TRANSACTION_VERIFY_FAILED');
    }
    for (const action of plan.actions.filter((item) => item.kind === 'create-file')) {
      if (sha256(readFileSync(join(target, action.path))) !== action.sha256) {
        fail(`created scaffold failed byte verification: ${action.path}`, 'TRANSACTION_VERIFY_FAILED');
      }
    }
    verifyPreservation(plan, target, createdFiles, createdDirs);
    checkpoint();

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
    const receiptTemp = `${receiptAbsolute}.tmp`;
    writeFileSync(receiptTemp, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
    receiptFiles.push(receiptTemp);
    renameSync(receiptTemp, receiptAbsolute);
    receiptFiles.splice(receiptFiles.indexOf(receiptTemp), 1);
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
      token: plan.planId,
      blueprintBefore,
      blueprintMode,
      blueprintChanged,
      createdFiles,
      createdDirs,
      stageBefore,
      stageRemoved,
      receiptFiles: [...receiptFiles, receiptAbsolute],
      receiptDirs,
    });
    if (error instanceof VariantTransitionError) throw error;
    fail(`transition transaction failed and was restored — ${error.message}`, 'TRANSACTION_FAILED');
  }
}

function receiptPath(target, receiptId) {
  if (!receiptId || !/^[a-f0-9]{64}$/.test(receiptId)) {
    fail('--receipt must be a 64-character transition receipt id', 'RECEIPT_ID_REQUIRED');
  }
  return join(target, '.blueprint', 'variant-transitions', receiptId, 'receipt.json');
}

function validateReceiptShape(receipt, receiptId, target) {
  if (receipt.schema !== RECEIPT_SCHEMA || receipt.receiptId !== receiptId) {
    fail('transition receipt schema or identity is invalid', 'RECEIPT_CORRUPT');
  }
  if (resolve(receipt.target) !== target || resolve(receipt.plan?.target || '') !== target) {
    fail(`receipt belongs to a different target: ${receipt.target}`, 'RECEIPT_TARGET_MISMATCH');
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
  const expectedDirectoryCandidates = new Set();
  const addAncestors = (rel) => {
    let cursor = validateRelative(rel);
    while (cursor.includes('/')) {
      cursor = cursor.slice(0, cursor.lastIndexOf('/'));
      expectedDirectoryCandidates.add(cursor);
    }
  };
  for (const action of receipt.plan.actions) {
    if (action.kind === 'create-directory') {
      expectedDirectoryCandidates.add(validateRelative(action.path));
      addAncestors(action.path);
    }
    if (action.kind === 'create-file') addAncestors(action.path);
  }

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

  if (!Array.isArray(receipt.createdDirectories)) fail('receipt created-directory set is invalid', 'RECEIPT_CORRUPT');
  for (const rel of receipt.createdDirectories) {
    validateRelative(rel);
    if (!expectedDirectoryCandidates.has(rel)) {
      fail(`receipt names an unplanned created directory: ${rel}`, 'RECEIPT_CORRUPT');
    }
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
  if (receipt.archivedStageState && existsSync(join(target, receipt.archivedStageState.path))) {
    conflicts.push(`${receipt.archivedStageState.path} has replacement state; rollback will not overwrite it`);
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
  if (existsSync(rollbackPath)) conflicts.push('rollback receipt already exists');
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

export function rollbackVariantTransition({ targetDir, receiptId, failAfter = null } = {}) {
  const rollbackPlan = planVariantRollback({ targetDir, receiptId });
  if (rollbackPlan.status !== 'ready') {
    fail(`rollback is blocked: ${rollbackPlan.conflicts.join(' | ')}`, 'ROLLBACK_BLOCKED');
  }
  const target = rollbackPlan.target;
  const { receipt, pathname } = loadReceipt(target, receiptId);
  const rollbackAbsolute = join(target, rollbackPlan.rollbackReceiptPath);
  const currentPatched = new Map();
  const currentCreated = new Map();
  let restoredStage = false;
  let step = 0;
  const checkpoint = () => {
    step += 1;
    if (failAfter === step) throw new Error(`injected rollback failure after step ${step}`);
  };

  try {
    for (const patched of receipt.patchedFiles) {
      currentPatched.set(patched.path, readFileSync(join(target, patched.path)));
      const before = Buffer.from(patched.beforeBase64, 'base64');
      if (sha256(before) !== patched.beforeSha256) fail(`receipt preimage hash mismatch: ${patched.path}`, 'RECEIPT_CORRUPT');
      atomicWrite(join(target, patched.path), before, patched.mode, `${receiptId}-rollback`);
      checkpoint();
    }
    for (const created of receipt.createdFiles) {
      currentCreated.set(created.path, readFileSync(join(target, created.path)));
      unlinkSync(join(target, created.path));
      checkpoint();
    }
    if (receipt.archivedStageState) {
      const state = Buffer.from(receipt.archivedStageState.beforeBase64, 'base64');
      if (sha256(state) !== receipt.archivedStageState.sha256) fail('archived stage-state hash mismatch', 'RECEIPT_CORRUPT');
      ensureDirTracked(target, dirname(join(target, receipt.archivedStageState.path)), []);
      writeFileSync(join(target, receipt.archivedStageState.path), state, { flag: 'wx' });
      restoredStage = true;
      checkpoint();
    }
    removeEmptyDirs(target, rollbackPlan.removeDirectories);

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
    const temp = `${rollbackAbsolute}.tmp`;
    writeFileSync(temp, `${JSON.stringify(rollbackReceipt, null, 2)}\n`, { flag: 'wx' });
    renameSync(temp, rollbackAbsolute);
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
    try { unlinkSync(`${rollbackAbsolute}.tmp`); } catch (cleanupError) { if (cleanupError?.code !== 'ENOENT') throw cleanupError; }
    try { unlinkSync(rollbackAbsolute); } catch (cleanupError) { if (cleanupError?.code !== 'ENOENT') throw cleanupError; }
    if (restoredStage && receipt.archivedStageState) {
      unlinkSync(join(target, receipt.archivedStageState.path));
    }
    for (const rel of [...receipt.createdDirectories].sort((a, b) => a.split('/').length - b.split('/').length)) {
      ensureDirTracked(target, join(target, rel), []);
    }
    for (const [rel, bytes] of currentCreated) {
      ensureDirTracked(target, dirname(join(target, rel)), []);
      if (!existsSync(join(target, rel))) writeFileSync(join(target, rel), bytes, { flag: 'wx' });
    }
    for (const patched of receipt.patchedFiles) {
      const bytes = currentPatched.get(patched.path);
      if (bytes) atomicWrite(join(target, patched.path), bytes, patched.mode, `${receiptId}-rollback-restore`);
    }
    if (error instanceof VariantTransitionError) throw error;
    fail(`rollback transaction failed and the applied state was restored — ${error.message}`, 'ROLLBACK_TRANSACTION_FAILED');
  }
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
