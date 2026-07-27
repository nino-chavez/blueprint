#!/usr/bin/env node

import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
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
  const symlinked = fixture('symlinked');
  rmSync(path.join(symlinked, 'docs'), { recursive: true });
  symlinkSync('research', path.join(symlinked, 'docs'));
  ok(errorCode(() => planVariantTransition({ targetDir: symlinked, home: ROOT })) === 'SYMLINK_PATH', 'symlinked planned path refuses');

  // 3. Plan mismatch, planned-path dirt, and unrelated dirt.
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
  commitFixture(stamped);
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

  const already = fixture('already', { blueprint: 'variant: research\nstage_model: research\n' });
  const alreadyPlan = planVariantTransition({ targetDir: already, home: ROOT });
  ok(alreadyPlan.status === 'already-transitioned' && alreadyPlan.actions.length === 0, 'completed research state is a no-op');

  console.log(`variant-transition self-test: PASS (${assertions} assertions)`);
} finally {
  rmSync(TEST_ROOT, { recursive: true, force: true });
}
