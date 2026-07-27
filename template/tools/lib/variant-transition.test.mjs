#!/usr/bin/env node

import {
  appendFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyVariantTransition,
  planVariantRollback,
  planVariantTransition,
  rollbackVariantTransition,
} from './variant-transition.mjs';
import { deriveStageStatus } from './stage-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const STAMP = path.join(ROOT, 'template', 'tools', 'blueprint-init', 'stamp.mjs');
const BIN = path.join(ROOT, 'bin', 'blueprint.mjs');
const TEST_ROOT = mkdtempSync(path.join(os.tmpdir(), 'variant-transition-test-'));
let assertions = 0;

function ok(condition, label) {
  assertions += 1;
  if (!condition) throw new Error(`FAIL: ${label}`);
}

function sha(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function write(root, rel, content) {
  const pathname = path.join(root, rel);
  mkdirSync(path.dirname(pathname), { recursive: true });
  writeFileSync(pathname, content);
}

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commitFixture(root) {
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'variant-test@example.com');
  git(root, 'config', 'user.name', 'Variant Test');
  git(root, 'config', 'core.hooksPath', '/dev/null');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'fixture');
}

function fixture(name, {
  blueprint = 'variant: greenfield # keep routing note\nstage_model: greenfield # keep model note\ntier: 1\npilot_profile:\n  slug: authored\nportal:\n  repo_url: example\n',
  authoredPersona = true,
  emptyMemo = false,
  stageState = null,
} = {}) {
  const root = path.join(TEST_ROOT, name);
  mkdirSync(root);
  write(root, 'blueprint.yml', blueprint);
  if (authoredPersona) write(root, 'research/personas-and-jtbd.md', '# Authored personas\n\nDO NOT OVERWRITE\n');
  if (emptyMemo) write(root, 'docs/decision-memo.md', '');
  write(root, 'decisions/0001-authored.md', '# Authored decision\n');
  write(root, 'docs/authored.md', '# Authored doc\n');
  write(root, '.claude/sentinel.bin', Buffer.from([0, 255, 1, 2, 3]));
  write(root, 'tools/sentinel.txt', 'tool sentinel\n');
  write(root, 'apps/portal/sentinel.txt', 'portal sentinel\n');
  write(root, 'packages/sentinel.zero', '');
  if (stageState !== null) write(root, '.blueprint/stage-state.json', stageState);
  commitFixture(root);
  return root;
}

function walkSnapshot(root, { mtimes = false, excludeReceipts = false } = {}) {
  const records = [];
  const walk = (rel) => {
    const absolute = path.join(root, rel);
    for (const name of readdirSync(absolute).sort()) {
      if (!rel && name === '.git') continue;
      const childRel = rel ? `${rel}/${name}` : name;
      if (excludeReceipts && childRel.startsWith('.blueprint/variant-transitions')) continue;
      const child = path.join(root, childRel);
      const stat = lstatSync(child);
      if (stat.isSymbolicLink()) {
        records.push({ path: childRel, type: 'symlink' });
      } else if (stat.isDirectory()) {
        records.push({ path: childRel, type: 'directory', ...(mtimes ? { mtimeMs: stat.mtimeMs } : {}) });
        walk(childRel);
      } else {
        const bytes = readFileSync(child);
        records.push({
          path: childRel,
          type: 'file',
          size: bytes.length,
          sha256: sha(bytes),
          ...(mtimes ? { mtimeMs: stat.mtimeMs } : {}),
        });
      }
    }
  };
  walk('');
  return JSON.stringify(records);
}

function errorCode(fn) {
  try {
    fn();
  } catch (error) {
    return error.code || error.name;
  }
  return null;
}

try {
  // 1. Plan is a true read-only inventory, including mtimes.
  const base = fixture('base', { emptyMemo: true });
  const fixedTime = new Date('2026-01-02T03:04:05Z');
  utimesSync(path.join(base, 'blueprint.yml'), fixedTime, fixedTime);
  const beforePlan = walkSnapshot(base, { mtimes: true });
  const plan = planVariantTransition({ targetDir: base, home: ROOT });
  const afterPlan = walkSnapshot(base, { mtimes: true });
  ok(beforePlan === afterPlan, 'plan changes no bytes, paths, or mtimes');
  ok(plan.status === 'planned' && /^[a-f0-9]{64}$/.test(plan.planId), 'plan is content-addressed');
  ok(plan.actions.some((action) => action.kind === 'patch-file'), 'plan patches blueprint.yml');
  ok(plan.collisions.some((item) => item.path === 'research/personas-and-jtbd.md'), 'authored persona is PRESERVE');
  ok(plan.collisions.some((item) => item.path === 'docs/decision-memo.md' && item.size === 0), 'zero-byte scaffold collision is PRESERVE');
  ok(plan.cleanup.some((item) => item.path === 'apps/portal/' && item.automaticAction === 'none'), 'cleanup remains plan-only');

  const sentinelsBefore = new Map([
    ['research/personas-and-jtbd.md', sha(readFileSync(path.join(base, 'research/personas-and-jtbd.md')))],
    ['decisions/0001-authored.md', sha(readFileSync(path.join(base, 'decisions/0001-authored.md')))],
    ['docs/authored.md', sha(readFileSync(path.join(base, 'docs/authored.md')))],
    ['.claude/sentinel.bin', sha(readFileSync(path.join(base, '.claude/sentinel.bin')))],
    ['tools/sentinel.txt', sha(readFileSync(path.join(base, 'tools/sentinel.txt')))],
    ['apps/portal/sentinel.txt', sha(readFileSync(path.join(base, 'apps/portal/sentinel.txt')))],
    ['packages/sentinel.zero', sha(readFileSync(path.join(base, 'packages/sentinel.zero')))],
  ]);
  const applied = applyVariantTransition({ targetDir: base, home: ROOT, planId: plan.planId });
  ok(applied.applied && existsSync(path.join(base, applied.receiptPath)), 'apply writes a receipt after success');
  const appliedYml = readFileSync(path.join(base, 'blueprint.yml'), 'utf8');
  ok(appliedYml.includes('variant: research # keep routing note'), 'variant patch preserves inline comment');
  ok(appliedYml.includes('stage_model: research # keep model note'), 'stage_model patch preserves inline comment');
  ok(deriveStageStatus({ root: base }).variant === 'research', 'stage model resolves research after apply');
  ok(readdirSync(path.join(base, 'research/problem-space')).length === 0, 'research leg directory stays empty');
  ok(existsSync(path.join(base, 'apps/portal/sentinel.txt')), 'apply performs no cleanup deletion');
  for (const [rel, digest] of sentinelsBefore) {
    ok(sha(readFileSync(path.join(base, rel))) === digest, `preserves sentinel ${rel}`);
  }
  ok(planVariantTransition({ targetDir: base, home: ROOT }).status === 'already-transitioned', 'second plan is an honest already-transitioned no-op');

  const rollbackPreview = planVariantRollback({ targetDir: base, receiptId: plan.planId });
  ok(rollbackPreview.status === 'ready', 'rollback preflight is ready');
  rollbackVariantTransition({ targetDir: base, receiptId: plan.planId });
  const rolledYml = readFileSync(path.join(base, 'blueprint.yml'), 'utf8');
  ok(rolledYml.includes('variant: greenfield # keep routing note'), 'rollback restores exact variant line');
  ok(rolledYml.includes('stage_model: greenfield # keep model note'), 'rollback restores exact stage_model line');
  ok(!existsSync(path.join(base, 'research/sources/README.md')), 'rollback removes unchanged generated scaffold');
  ok(existsSync(path.join(base, 'docs/decision-memo.md')) && statSync(path.join(base, 'docs/decision-memo.md')).size === 0, 'rollback preserves pre-existing zero-byte collision');
  ok(existsSync(path.join(base, `.blueprint/variant-transitions/${plan.planId}/receipt.json`)), 'rollback retains original receipt');
  ok(existsSync(path.join(base, `.blueprint/variant-transitions/${plan.planId}/rollback.json`)), 'rollback appends rollback receipt');

  // 2. Shape and safety refusals are write-free.
  const duplicate = fixture('duplicate', { blueprint: 'variant: greenfield\nvariant: research\n' });
  ok(errorCode(() => planVariantTransition({ targetDir: duplicate, home: ROOT })) === 'VARIANT_SHAPE', 'duplicate variant refuses');
  const missing = fixture('missing', { blueprint: 'tier: 1\n' });
  ok(errorCode(() => planVariantTransition({ targetDir: missing, home: ROOT })) === 'VARIANT_SHAPE', 'missing variant refuses');
  const custom = fixture('custom', { blueprint: 'variant: greenfield\nstage_model: custom-model\n' });
  ok(errorCode(() => planVariantTransition({ targetDir: custom, home: ROOT })) === 'CUSTOM_STAGE_MODEL', 'custom stage model refuses');
  const corrupt = fixture('corrupt', { stageState: '{not json\n' });
  ok(errorCode(() => planVariantTransition({ targetDir: corrupt, home: ROOT })) === 'STAGE_STATE_CORRUPT', 'corrupt stage state refuses');
  const malformedStageStates = [
    ['array', '[]\n'],
    ['null', 'null\n'],
    ['scalar', '"state"\n'],
    ['history', '{"history":{}}\n'],
    ['reviews', '{"reviews":[]}\n'],
  ];
  for (const [name, body] of malformedStageStates) {
    const malformed = fixture(`malformed-stage-${name}`, { stageState: body });
    ok(
      errorCode(() => planVariantTransition({ targetDir: malformed, home: ROOT })) === 'STAGE_STATE_SHAPE',
      `parseable malformed stage state refuses: ${name}`,
    );
  }
  const symlinked = fixture('symlinked');
  rmSync(path.join(symlinked, 'docs'), { recursive: true });
  symlinkSync('research', path.join(symlinked, 'docs'));
  ok(errorCode(() => planVariantTransition({ targetDir: symlinked, home: ROOT })) === 'SYMLINK_PATH', 'symlinked planned path refuses');
  const receiptSymlinked = fixture('receipt-symlinked');
  const receiptEscape = path.join(TEST_ROOT, 'receipt-escape');
  mkdirSync(receiptEscape);
  mkdirSync(path.join(receiptSymlinked, '.blueprint'));
  symlinkSync(receiptEscape, path.join(receiptSymlinked, '.blueprint/variant-transitions'));
  ok(
    errorCode(() => planVariantTransition({ targetDir: receiptSymlinked, home: ROOT })) === 'SYMLINK_PATH',
    'symlinked receipt root refuses during read-only planning',
  );
  ok(readdirSync(receiptEscape).length === 0, 'receipt symlink refusal writes nothing outside target');

  // 3. Plan mismatch, planned-path dirt, and unrelated dirt.
  const pinnedParentA = path.join(TEST_ROOT, 'pinned-parent-a');
  const pinnedParentB = path.join(TEST_ROOT, 'pinned-parent-b');
  mkdirSync(pinnedParentA);
  mkdirSync(pinnedParentB);
  const pinnedTargetA = fixture('pinned-parent-a/initiative');
  const pinnedTargetB = fixture('pinned-parent-b/initiative');
  const pinnedTargetBBefore = walkSnapshot(pinnedTargetB);
  const lexicalParent = path.join(TEST_ROOT, 'pinned-parent-current');
  symlinkSync(pinnedParentA, lexicalParent);
  const lexicalTarget = path.join(lexicalParent, 'initiative');
  const pinnedPlan = planVariantTransition({ targetDir: lexicalTarget, home: ROOT });
  ok(pinnedPlan.target === realpathSync(pinnedTargetA), 'plan records the canonical Git-root target');
  const pinnedApply = applyVariantTransition({
    targetDir: lexicalTarget,
    home: ROOT,
    planId: pinnedPlan.planId,
    mutationHook(event) {
      if (event.operation === 'patch-file') {
        unlinkSync(lexicalParent);
        symlinkSync(pinnedParentB, lexicalParent);
      }
    },
  });
  ok(pinnedApply.applied, 'apply completes against the pinned canonical target');
  ok(
    readFileSync(path.join(pinnedTargetA, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'symlink-parent swap cannot redirect the scalar patch',
  );
  ok(
    walkSnapshot(pinnedTargetB) === pinnedTargetBBefore,
    'symlink-parent swap changes no bytes in the alternate checkout',
  );
  ok(
    !existsSync(path.join(pinnedTargetB, pinnedApply.receiptPath)),
    'symlink-parent swap cannot redirect the success receipt',
  );

  const rootSwapA = fixture('root-swap-a');
  const rootSwapB = fixture('root-swap-b');
  const rootSwapBBefore = walkSnapshot(rootSwapB);
  const rootSwapPlan = planVariantTransition({ targetDir: rootSwapA, home: ROOT });
  const rootSwapMoved = path.join(path.dirname(rootSwapPlan.target), 'root-swap-a-moved');
  ok(
    errorCode(() => applyVariantTransition({
      targetDir: rootSwapA,
      home: ROOT,
      planId: rootSwapPlan.planId,
      mutationHook(event) {
        if (event.operation === 'patch-file') {
          renameSync(event.target, rootSwapMoved);
          symlinkSync(realpathSync(rootSwapB), event.target);
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'apply recovery refuses a replaced canonical target root',
  );
  ok(
    walkSnapshot(rootSwapB) === rootSwapBBefore,
    'canonical-root replacement changes no bytes in the replacement checkout',
  );
  ok(
    readFileSync(path.join(rootSwapMoved, 'blueprint.yml'), 'utf8').includes('variant: greenfield'),
    'canonical-root replacement before mutation leaves the recorded checkout unchanged',
  );
  ok(
    lstatSync(rootSwapPlan.target).isSymbolicLink(),
    'recovery preserves the replacement root for operator resolution',
  );

  const mismatch = fixture('mismatch');
  const mismatchPlan = planVariantTransition({ targetDir: mismatch, home: ROOT });
  appendFileSync(path.join(mismatch, 'blueprint.yml'), '# changed after plan\n');
  ok(errorCode(() => applyVariantTransition({ targetDir: mismatch, home: ROOT, planId: mismatchPlan.planId })) === 'PLAN_MISMATCH', 'stale plan id refuses');

  const dirty = fixture('dirty');
  appendFileSync(path.join(dirty, 'blueprint.yml'), '# dirty before plan\n');
  const dirtyPlan = planVariantTransition({ targetDir: dirty, home: ROOT });
  ok(dirtyPlan.dirtyPlannedPaths.length > 0, 'plan reports a dirty planned path');
  ok(errorCode(() => applyVariantTransition({ targetDir: dirty, home: ROOT, planId: dirtyPlan.planId })) === 'PLANNED_PATH_DIRTY', 'apply refuses a dirty planned path');

  const unrelated = fixture('unrelated');
  write(unrelated, 'notes-unrelated.txt', 'uncommitted but out of scope\n');
  const unrelatedPlan = planVariantTransition({ targetDir: unrelated, home: ROOT });
  ok(unrelatedPlan.dirtyPlannedPaths.length === 0, 'unrelated dirty file does not block');
  applyVariantTransition({ targetDir: unrelated, home: ROOT, planId: unrelatedPlan.planId });
  ok(readFileSync(path.join(unrelated, 'notes-unrelated.txt'), 'utf8').includes('out of scope'), 'unrelated dirty file survives apply');

  // 3b. A Git-metadata lock serializes writers; final preimage checks preserve
  // external edits made after preflight.
  const locked = fixture('locked');
  const lockedPlan = planVariantTransition({ targetDir: locked, home: ROOT });
  const rawLockPath = git(locked, 'rev-parse', '--git-path', 'blueprint-variant-transition.lock');
  const lockPath = path.isAbsolute(rawLockPath) ? rawLockPath : path.resolve(locked, rawLockPath);
  writeFileSync(lockPath, 'independent writer\n', { flag: 'wx' });
  ok(
    errorCode(() => applyVariantTransition({ targetDir: locked, home: ROOT, planId: lockedPlan.planId })) === 'TRANSITION_LOCKED',
    'active transition lock blocks apply before writes',
  );
  rmSync(lockPath);
  ok(readFileSync(path.join(locked, 'blueprint.yml'), 'utf8').includes('variant: greenfield'), 'locked apply leaves blueprint unchanged');

  const rollbackLocked = fixture('rollback-locked');
  const rollbackLockedPlan = planVariantTransition({ targetDir: rollbackLocked, home: ROOT });
  applyVariantTransition({ targetDir: rollbackLocked, home: ROOT, planId: rollbackLockedPlan.planId });
  const rawRollbackLockPath = git(rollbackLocked, 'rev-parse', '--git-path', 'blueprint-variant-transition.lock');
  const rollbackLockPath = path.isAbsolute(rawRollbackLockPath)
    ? rawRollbackLockPath
    : path.resolve(rollbackLocked, rawRollbackLockPath);
  writeFileSync(rollbackLockPath, 'independent writer\n', { flag: 'wx' });
  ok(
    errorCode(() => rollbackVariantTransition({
      targetDir: rollbackLocked,
      receiptId: rollbackLockedPlan.planId,
    })) === 'TRANSITION_LOCKED',
    'active transition lock blocks rollback before writes',
  );
  rmSync(rollbackLockPath);
  ok(
    readFileSync(path.join(rollbackLocked, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'locked rollback leaves the applied state unchanged',
  );
  const foreignReceipt = fixture('foreign-receipt', {
    blueprint: 'variant: greenfield\nstage_model: greenfield\ntier: 1\n# unrelated repository history\n',
  });
  write(
    foreignReceipt,
    `.blueprint/variant-transitions/${rollbackLockedPlan.planId}/receipt.json`,
    readFileSync(
      path.join(
        rollbackLocked,
        `.blueprint/variant-transitions/${rollbackLockedPlan.planId}/receipt.json`,
      ),
    ),
  );
  ok(
    errorCode(() => planVariantRollback({
      targetDir: foreignReceipt,
      receiptId: rollbackLockedPlan.planId,
    })) === 'RECEIPT_TARGET_MISMATCH',
    'copied receipt cannot authorize rollback in unrelated repository history',
  );

  const concurrentApply = fixture('concurrent-apply');
  const concurrentApplyPlan = planVariantTransition({ targetDir: concurrentApply, home: ROOT });
  ok(
    errorCode(() => applyVariantTransition({
      targetDir: concurrentApply,
      home: ROOT,
      planId: concurrentApplyPlan.planId,
      mutationHook(event) {
        if (event.operation === 'patch-file') {
          appendFileSync(path.join(concurrentApply, 'blueprint.yml'), '# concurrent author edit\n');
        }
      },
    })) === 'CONCURRENT_MODIFICATION',
    'apply final preimage check detects a concurrent blueprint edit',
  );
  ok(
    readFileSync(path.join(concurrentApply, 'blueprint.yml'), 'utf8').endsWith('# concurrent author edit\n'),
    'apply preserves the concurrent blueprint edit',
  );
  ok(!existsSync(path.join(concurrentApply, '.blueprint/variant-transitions')), 'concurrent apply refusal leaves no receipt');

  const concurrentRecovery = fixture('concurrent-recovery');
  const concurrentRecoveryPlan = planVariantTransition({ targetDir: concurrentRecovery, home: ROOT });
  let changedAfterPatch = false;
  ok(
    errorCode(() => applyVariantTransition({
      targetDir: concurrentRecovery,
      home: ROOT,
      planId: concurrentRecoveryPlan.planId,
      mutationHook(event) {
        if (!changedAfterPatch && event.operation === 'create-file') {
          changedAfterPatch = true;
          appendFileSync(path.join(concurrentRecovery, 'blueprint.yml'), '# concurrent edit after patch\n');
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'apply recovery reports rather than overwrites a post-write concurrent edit',
  );
  ok(
    readFileSync(path.join(concurrentRecovery, 'blueprint.yml'), 'utf8').includes('# concurrent edit after patch'),
    'apply recovery preserves a post-write concurrent edit',
  );

  const recoverySymlinkSwap = fixture('recovery-symlink-swap');
  const recoverySymlinkSwapPlan = planVariantTransition({
    targetDir: recoverySymlinkSwap,
    home: ROOT,
  });
  const recoverySymlinkBlueprintBefore = readFileSync(
    path.join(recoverySymlinkSwap, 'blueprint.yml'),
  );
  const recoveryEscape = path.join(TEST_ROOT, 'recovery-symlink-escape');
  const recoveryEscapeReadme = path.join(recoveryEscape, 'README.md');
  const canonicalSourcesReadme = readFileSync(
    path.join(ROOT, 'template/research/sources-index.template.md'),
  );
  mkdirSync(recoveryEscape);
  writeFileSync(recoveryEscapeReadme, canonicalSourcesReadme);
  ok(
    errorCode(() => applyVariantTransition({
      targetDir: recoverySymlinkSwap,
      home: ROOT,
      planId: recoverySymlinkSwapPlan.planId,
      mutationHook(event) {
        if (event.operation === 'create-file' && event.path === 'docs/decision-memo.md') {
          rmSync(path.join(recoverySymlinkSwap, 'research/sources'), { recursive: true });
          symlinkSync(recoveryEscape, path.join(recoverySymlinkSwap, 'research/sources'));
          throw new Error('force recovery after swapping a created-directory ancestor');
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'apply recovery refuses a swapped symlink ancestor',
  );
  ok(
    readFileSync(recoveryEscapeReadme).equals(canonicalSourcesReadme),
    'apply recovery preserves the outside file byte-for-byte',
  );
  ok(
    lstatSync(path.join(recoverySymlinkSwap, 'research/sources')).isSymbolicLink(),
    'apply recovery preserves the swapped symlink for operator resolution',
  );
  ok(
    readFileSync(path.join(recoverySymlinkSwap, 'blueprint.yml')).equals(recoverySymlinkBlueprintBefore),
    'apply recovery restores the safe blueprint preimage after a symlink swap',
  );

  const finalApplyRace = fixture('final-apply-race');
  const finalApplyRacePlan = planVariantTransition({ targetDir: finalApplyRace, home: ROOT });
  ok(
    errorCode(() => applyVariantTransition({
      targetDir: finalApplyRace,
      home: ROOT,
      planId: finalApplyRacePlan.planId,
      mutationHook(event) {
        if (event.operation === 'write-receipt') {
          appendFileSync(path.join(finalApplyRace, 'blueprint.yml'), '# edit at receipt boundary\n');
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'apply refuses to receipt a postimage changed at the final receipt boundary',
  );
  ok(
    readFileSync(path.join(finalApplyRace, 'blueprint.yml'), 'utf8').includes('# edit at receipt boundary'),
    'final apply verification preserves the receipt-boundary edit',
  );
  ok(
    !existsSync(path.join(finalApplyRace, `.blueprint/variant-transitions/${finalApplyRacePlan.planId}/receipt.json`)),
    'failed final apply verification leaves no success receipt',
  );

  // 4. Stage state requires explicit archival and round-trips on rollback.
  const stateBody = '{"schema":"test","cursor":2,"assertions":{"x":"y"}}\n';
  const withState = fixture('with-state', { stageState: stateBody });
  const stateBlockedPlan = planVariantTransition({ targetDir: withState, home: ROOT });
  ok(stateBlockedPlan.stageState.requiresAcceptance, 'existing stage state requires acceptance');
  ok(errorCode(() => applyVariantTransition({ targetDir: withState, home: ROOT, planId: stateBlockedPlan.planId })) === 'STAGE_RESET_REQUIRED', 'apply refuses unaccepted stage reset');
  const statePlan = planVariantTransition({ targetDir: withState, home: ROOT, acceptStageReset: true });
  applyVariantTransition({
    targetDir: withState,
    home: ROOT,
    planId: statePlan.planId,
    acceptStageReset: true,
  });
  ok(!existsSync(path.join(withState, '.blueprint/stage-state.json')), 'accepted apply archives/removes incompatible stage state');
  rollbackVariantTransition({ targetDir: withState, receiptId: statePlan.planId });
  ok(readFileSync(path.join(withState, '.blueprint/stage-state.json'), 'utf8') === stateBody, 'rollback restores exact archived stage state');

  const rollbackStageSymlink = fixture('rollback-stage-symlink', { stageState: stateBody });
  const rollbackStageSymlinkPlan = planVariantTransition({
    targetDir: rollbackStageSymlink,
    home: ROOT,
    acceptStageReset: true,
  });
  applyVariantTransition({
    targetDir: rollbackStageSymlink,
    home: ROOT,
    planId: rollbackStageSymlinkPlan.planId,
    acceptStageReset: true,
  });
  const externalStage = path.join(TEST_ROOT, 'external-stage-state.json');
  writeFileSync(externalStage, 'external state\n');
  symlinkSync(externalStage, path.join(rollbackStageSymlink, '.blueprint/stage-state.json'));
  ok(
    errorCode(() => planVariantRollback({
      targetDir: rollbackStageSymlink,
      receiptId: rollbackStageSymlinkPlan.planId,
    })) === 'SYMLINK_PATH',
    'rollback preflight rejects a symlinked stage-state destination',
  );
  ok(readFileSync(externalStage, 'utf8') === 'external state\n', 'stage-state symlink refusal leaves its target untouched');

  // 5. Injected apply failure restores bytes/paths and leaves no receipt.
  const injected = fixture('injected');
  const injectedBefore = walkSnapshot(injected);
  const injectedPlan = planVariantTransition({ targetDir: injected, home: ROOT });
  ok(errorCode(() => applyVariantTransition({
    targetDir: injected,
    home: ROOT,
    planId: injectedPlan.planId,
    failAfter: 3,
  })) === 'TRANSACTION_FAILED', 'injected apply failure is reported');
  ok(walkSnapshot(injected) === injectedBefore, 'injected apply failure restores the complete preimage');
  ok(!existsSync(path.join(injected, '.blueprint/variant-transitions')), 'failed apply leaves no receipt');

  // 6. Edited generated content blocks rollback before any write.
  const edited = fixture('edited');
  const editedPlan = planVariantTransition({ targetDir: edited, home: ROOT });
  applyVariantTransition({ targetDir: edited, home: ROOT, planId: editedPlan.planId });
  appendFileSync(path.join(edited, 'research/sources/README.md'), '\nAuthored after transition.\n');
  const editedRollback = planVariantRollback({ targetDir: edited, receiptId: editedPlan.planId });
  ok(editedRollback.status === 'blocked', 'rollback preview blocks edited generated scaffold');
  ok(errorCode(() => rollbackVariantTransition({ targetDir: edited, receiptId: editedPlan.planId })) === 'ROLLBACK_BLOCKED', 'rollback refuses edited generated scaffold');
  ok(readFileSync(path.join(edited, 'blueprint.yml'), 'utf8').includes('variant: research'), 'blocked rollback makes no scalar write');

  const concurrentRollback = fixture('concurrent-rollback');
  const concurrentRollbackPlan = planVariantTransition({ targetDir: concurrentRollback, home: ROOT });
  applyVariantTransition({ targetDir: concurrentRollback, home: ROOT, planId: concurrentRollbackPlan.planId });
  let editedGenerated = false;
  ok(
    errorCode(() => rollbackVariantTransition({
      targetDir: concurrentRollback,
      receiptId: concurrentRollbackPlan.planId,
      mutationHook(event) {
        if (!editedGenerated && event.operation === 'remove-created-file') {
          editedGenerated = true;
          appendFileSync(path.join(concurrentRollback, event.path), '\nConcurrent authored edit.\n');
        }
      },
    })) === 'CONCURRENT_MODIFICATION',
    'rollback final preimage check detects an edit after preview',
  );
  ok(
    readFileSync(path.join(concurrentRollback, 'research/sources/README.md'), 'utf8').includes('Concurrent authored edit.'),
    'rollback preserves the concurrently edited generated file',
  );
  ok(
    readFileSync(path.join(concurrentRollback, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'failed concurrent rollback restores the applied scalar state',
  );

  const finalRollbackRace = fixture('final-rollback-race');
  const finalRollbackRacePlan = planVariantTransition({ targetDir: finalRollbackRace, home: ROOT });
  applyVariantTransition({ targetDir: finalRollbackRace, home: ROOT, planId: finalRollbackRacePlan.planId });
  const recreatedAtReceipt = 'Authored at rollback receipt boundary.\n';
  ok(
    errorCode(() => rollbackVariantTransition({
      targetDir: finalRollbackRace,
      receiptId: finalRollbackRacePlan.planId,
      mutationHook(event) {
        if (event.operation === 'write-rollback-receipt') {
          write(finalRollbackRace, 'research/sources/README.md', recreatedAtReceipt);
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'rollback refuses to receipt a removal reversed at the final receipt boundary',
  );
  ok(
    readFileSync(path.join(finalRollbackRace, 'research/sources/README.md'), 'utf8') === recreatedAtReceipt,
    'final rollback verification preserves the receipt-boundary recreation',
  );
  ok(
    readFileSync(path.join(finalRollbackRace, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'failed final rollback verification restores the applied scalar state',
  );
  ok(
    !existsSync(path.join(
      finalRollbackRace,
      `.blueprint/variant-transitions/${finalRollbackRacePlan.planId}/rollback.json`,
    )),
    'failed final rollback verification leaves no rollback receipt',
  );

  const rollbackRootSwapA = fixture('rollback-root-swap-a');
  const rollbackRootSwapB = fixture('rollback-root-swap-b');
  const rollbackRootSwapPlan = planVariantTransition({
    targetDir: rollbackRootSwapA,
    home: ROOT,
  });
  applyVariantTransition({
    targetDir: rollbackRootSwapA,
    home: ROOT,
    planId: rollbackRootSwapPlan.planId,
  });
  const rollbackRootSwapBBefore = walkSnapshot(rollbackRootSwapB);
  const rollbackRootSwapMoved = path.join(
    path.dirname(rollbackRootSwapPlan.target),
    'rollback-root-swap-a-moved',
  );
  ok(
    errorCode(() => rollbackVariantTransition({
      targetDir: rollbackRootSwapA,
      receiptId: rollbackRootSwapPlan.planId,
      mutationHook(event) {
        if (event.operation === 'restore-file') {
          renameSync(event.target, rollbackRootSwapMoved);
          symlinkSync(realpathSync(rollbackRootSwapB), event.target);
        }
      },
    })) === 'RECOVERY_CONFLICT',
    'rollback recovery refuses a replaced canonical target root',
  );
  ok(
    walkSnapshot(rollbackRootSwapB) === rollbackRootSwapBBefore,
    'rollback root replacement changes no bytes in the replacement checkout',
  );
  ok(
    readFileSync(path.join(rollbackRootSwapMoved, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'rollback root replacement before mutation leaves the applied checkout unchanged',
  );
  ok(
    lstatSync(rollbackRootSwapPlan.target).isSymbolicLink(),
    'rollback recovery preserves the replacement root for operator resolution',
  );

  // 7. A modified receipt cannot expand rollback authority.
  const tampered = fixture('tampered');
  const tamperedPlan = planVariantTransition({ targetDir: tampered, home: ROOT });
  const tamperedApply = applyVariantTransition({ targetDir: tampered, home: ROOT, planId: tamperedPlan.planId });
  const tamperedReceiptPath = path.join(tampered, tamperedApply.receiptPath);
  const tamperedReceipt = JSON.parse(readFileSync(tamperedReceiptPath, 'utf8'));
  tamperedReceipt.createdDirectories.push('../outside');
  writeFileSync(tamperedReceiptPath, `${JSON.stringify(tamperedReceipt, null, 2)}\n`);
  ok(
    ['RECEIPT_CORRUPT', 'UNSAFE_PATH'].includes(errorCode(() => planVariantRollback({ targetDir: tampered, receiptId: tamperedPlan.planId }))),
    'tampered receipt cannot expand rollback paths',
  );
  ok(readFileSync(path.join(tampered, 'blueprint.yml'), 'utf8').includes('variant: research'), 'tampered receipt refusal makes no scalar write');

  const tamperedEmptyAncestor = fixture('tampered-empty-ancestor', { authoredPersona: false });
  mkdirSync(path.join(tamperedEmptyAncestor, 'research'));
  const tamperedEmptyPlan = planVariantTransition({
    targetDir: tamperedEmptyAncestor,
    home: ROOT,
  });
  const tamperedEmptyApply = applyVariantTransition({
    targetDir: tamperedEmptyAncestor,
    home: ROOT,
    planId: tamperedEmptyPlan.planId,
  });
  const tamperedEmptyReceiptPath = path.join(
    tamperedEmptyAncestor,
    tamperedEmptyApply.receiptPath,
  );
  const tamperedEmptyReceipt = JSON.parse(readFileSync(tamperedEmptyReceiptPath, 'utf8'));
  tamperedEmptyReceipt.createdDirectories.push('research');
  writeFileSync(
    tamperedEmptyReceiptPath,
    `${JSON.stringify(tamperedEmptyReceipt, null, 2)}\n`,
  );
  ok(
    errorCode(() => planVariantRollback({
      targetDir: tamperedEmptyAncestor,
      receiptId: tamperedEmptyPlan.planId,
    })) === 'RECEIPT_CORRUPT',
    'tampered receipt cannot claim a pre-existing empty ancestor',
  );
  ok(
    lstatSync(path.join(tamperedEmptyAncestor, 'research')).isDirectory(),
    'tampered empty-ancestor refusal preserves the pre-existing directory',
  );

  // 8. Injected rollback failure restores the fully applied state.
  const rollbackInjected = fixture('rollback-injected');
  const rollbackInjectedPlan = planVariantTransition({ targetDir: rollbackInjected, home: ROOT });
  applyVariantTransition({ targetDir: rollbackInjected, home: ROOT, planId: rollbackInjectedPlan.planId });
  const appliedSnapshot = walkSnapshot(rollbackInjected);
  ok(errorCode(() => rollbackVariantTransition({
    targetDir: rollbackInjected,
    receiptId: rollbackInjectedPlan.planId,
    failAfter: 2,
  })) === 'ROLLBACK_TRANSACTION_FAILED', 'injected rollback failure is reported');
  ok(walkSnapshot(rollbackInjected) === appliedSnapshot, 'injected rollback failure restores the complete applied state');
  rollbackVariantTransition({ targetDir: rollbackInjected, receiptId: rollbackInjectedPlan.planId });

  // 9. A real initial stamp transitions, derives research, and rolls back.
  const stamped = path.join(TEST_ROOT, 'stamped');
  execFileSync(process.execPath, [
    STAMP,
    '--mode=stamp',
    '--name=transition-stamp',
    '--variant=greenfield',
    '--tier=1',
    `--target=${stamped}`,
  ], { stdio: 'ignore' });
  write(stamped, 'research/personas-and-jtbd.md', '# Authored after initial stamp\n\nDO NOT OVERWRITE\n');
  commitFixture(stamped);
  const beforeLegacyRestamp = walkSnapshot(stamped, { mtimes: true });
  let legacyRestampRejected = false;
  try {
    execFileSync(process.execPath, [
      STAMP,
      '--mode=stamp',
      '--name=transition-stamp',
      '--variant=research',
      '--tier=0',
      `--target=${stamped}`,
    ], { stdio: 'ignore' });
  } catch {
    legacyRestampRejected = true;
  }
  ok(legacyRestampRejected, 'legacy init cannot be reused as a variant migration');
  ok(walkSnapshot(stamped, { mtimes: true }) === beforeLegacyRestamp, 'rejected legacy restamp changes no bytes, paths, or mtimes');
  ok(
    readFileSync(path.join(stamped, 'research/personas-and-jtbd.md'), 'utf8').includes('DO NOT OVERWRITE'),
    'rejected legacy restamp preserves authored research',
  );
  ok(
    readFileSync(path.join(stamped, 'blueprint.yml'), 'utf8').includes('variant: greenfield'),
    'rejected legacy restamp preserves the original variant',
  );
  const stampedPlan = JSON.parse(execFileSync(process.execPath, [
    BIN,
    'variant',
    'transition',
    '--to=research',
    `--target=${stamped}`,
    '--json',
  ], {
    encoding: 'utf8',
    env: { ...process.env, BLUEPRINT_HOME: ROOT },
  }));
  ok(stampedPlan.status === 'planned', 'CLI dispatcher emits the transition plan');
  applyVariantTransition({ targetDir: stamped, home: ROOT, planId: stampedPlan.planId });
  ok(deriveStageStatus({ root: stamped }).variant === 'research', 'real greenfield stamp derives research after transition');
  rollbackVariantTransition({ targetDir: stamped, receiptId: stampedPlan.planId });
  ok(readFileSync(path.join(stamped, 'blueprint.yml'), 'utf8').includes('variant: greenfield'), 'real stamp rollback restores greenfield');

  const copiedOriginal = fixture('copied-original');
  const copiedPlan = planVariantTransition({ targetDir: copiedOriginal, home: ROOT });
  applyVariantTransition({ targetDir: copiedOriginal, home: ROOT, planId: copiedPlan.planId });
  const copiedCheckout = path.join(TEST_ROOT, 'copied-checkout');
  cpSync(copiedOriginal, copiedCheckout, { recursive: true, preserveTimestamps: true });
  ok(
    errorCode(() => planVariantRollback({
      targetDir: copiedCheckout,
      receiptId: copiedPlan.planId,
    })) === 'RECEIPT_TARGET_MISMATCH',
    'copied checkout cannot claim moved-checkout rollback while the original target exists',
  );
  ok(
    readFileSync(path.join(copiedCheckout, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'copied-checkout refusal makes no rollback write',
  );
  rmSync(copiedOriginal, { recursive: true, force: true });
  ok(
    errorCode(() => planVariantRollback({
      targetDir: copiedCheckout,
      receiptId: copiedPlan.planId,
    })) === 'RECEIPT_TARGET_MISMATCH',
    'copied checkout cannot impersonate a move after the original is removed',
  );
  ok(
    readFileSync(path.join(copiedCheckout, 'blueprint.yml'), 'utf8').includes('variant: research'),
    'deleted-original copy refusal makes no rollback write',
  );

  const portableOriginal = fixture('portable-original');
  const portablePlan = planVariantTransition({ targetDir: portableOriginal, home: ROOT });
  applyVariantTransition({ targetDir: portableOriginal, home: ROOT, planId: portablePlan.planId });
  const portableMoved = path.join(TEST_ROOT, 'portable-moved');
  renameSync(portableOriginal, portableMoved);
  ok(
    planVariantRollback({ targetDir: portableMoved, receiptId: portablePlan.planId }).status === 'ready',
    'rollback receipt remains valid after checkout directory rename',
  );
  rollbackVariantTransition({ targetDir: portableMoved, receiptId: portablePlan.planId });
  ok(
    readFileSync(path.join(portableMoved, 'blueprint.yml'), 'utf8').includes('variant: greenfield'),
    'moved-checkout rollback restores the preimage',
  );

  const already = fixture('already', { blueprint: 'variant: research\nstage_model: research\n' });
  const alreadyPlan = planVariantTransition({ targetDir: already, home: ROOT });
  ok(alreadyPlan.status === 'already-transitioned' && alreadyPlan.actions.length === 0, 'completed research state is a no-op');

  console.log(`variant-transition self-test: PASS (${assertions} assertions)`);
} finally {
  rmSync(TEST_ROOT, { recursive: true, force: true });
}
