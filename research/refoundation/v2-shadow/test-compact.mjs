#!/usr/bin/env node

// Research self-test for the compact authoring/compiler layer.

import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const FIXTURES = resolve(HERE, 'compact/fixtures');
const GENERATED = resolve(HERE, 'generated');
const COMPILER = resolve(HERE, 'compile-compact.mjs');
const SHADOW = resolve(HERE, 'shadow-consumer.mjs');
const digest = (value) => createHash('sha256').update(value).digest('hex');

mkdirSync(GENERATED, { recursive: true });
const temp = mkdtempSync(resolve(GENERATED, 'compact-selftest-'));
let failures = 0;

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: 'utf8' });
}

function check(condition, message, detail = '') {
  console.log(`${condition ? 'ok' : 'NOT OK'} ${message}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures += 1;
}

try {
  const positive = resolve(FIXTURES, 'receipt-positive.yml');
  const firstOutput = resolve(temp, 'receipt-first.json');
  const first = run(COMPILER, [`--source=${positive}`, `--output=${firstOutput}`]);
  check(first.status === 0, 'positive native-receipt fixture compiles', first.stderr.trim());

  if (first.status === 0) {
    const firstBytes = readFileSync(firstOutput);
    rmSync(firstOutput);
    const rebuilt = run(COMPILER, [`--source=${positive}`, `--output=${firstOutput}`]);
    check(rebuilt.status === 0, 'deleted generated overlay rebuilds', rebuilt.stderr.trim());
    if (rebuilt.status === 0) {
      const rebuiltBytes = readFileSync(firstOutput);
      check(digest(firstBytes) === digest(rebuiltBytes), 'compact compilation is byte-deterministic');
      const shadow = run(SHADOW, [
        `--overlay=${firstOutput}`,
        `--root=${ROOT}`,
        '--output-label=compact-receipt-fixture',
      ]);
      check(shadow.status === 0, 'native receipt shadow is K1-valid', shadow.stderr.trim());
      if (shadow.status === 0) {
        const report = JSON.parse(readFileSync(resolve(GENERATED, 'consumers/compact-receipt-fixture.shadow-report.json'), 'utf8'));
        check(report.kernel.claims['solo-operation-observed']?.state === 'satisfied', 'native receipt satisfies its exact claim');
        check(report.kernel.checkpoints['solo-operation-ready']?.state === 'satisfied', 'native receipt satisfies its checkpoint');
        const outputs = [
          resolve(GENERATED, 'consumers/compact-receipt-fixture.normalized.json'),
          resolve(GENERATED, 'consumers/compact-receipt-fixture.shadow-report.json'),
          resolve(GENERATED, 'consumers/compact-receipt-fixture.shadow-report.md'),
        ];
        check(outputs.every((file) => !readFileSync(file, 'utf8').includes('/Users/')), 'generated receipt outputs contain no absolute user path');
      }
    }
  }

  const packageSource = resolve(FIXTURES, 'package-inspection-receipt.yml');
  const packageOutput = resolve(temp, 'package-inspection.json');
  const packageCompile = run(COMPILER, [`--source=${packageSource}`, `--output=${packageOutput}`]);
  check(packageCompile.status === 0, 'named-agent package-inspection receipt compiles', packageCompile.stderr.trim());
  if (packageCompile.status === 0) {
    const packageShadow = run(SHADOW, [
      `--overlay=${packageOutput}`,
      `--root=${ROOT}`,
      '--output-label=compact-package-inspection-fixture',
    ]);
    check(packageShadow.status === 0, 'package-inspection receipt shadow is K1-valid', packageShadow.stderr.trim());
    if (packageShadow.status === 0) {
      const report = JSON.parse(readFileSync(resolve(GENERATED, 'consumers/compact-package-inspection-fixture.shadow-report.json'), 'utf8'));
      check(report.kernel.claims['unsigned-package-inspects-cleanly']?.state === 'satisfied', 'named release-agent receipt satisfies its exact package claim');
      check(report.kernel.checkpoints['unsigned-package-observed']?.state === 'satisfied', 'named release-agent receipt satisfies the package checkpoint');
    }
  }

  const pinnedSource = resolve(FIXTURES, 'pinned-source-version.yml');
  const pinnedOutput = resolve(temp, 'pinned-source-version.json');
  const pinnedCompile = run(COMPILER, [`--source=${pinnedSource}`, `--output=${pinnedOutput}`]);
  check(pinnedCompile.status === 0, 'exact candidate-version fixture compiles', pinnedCompile.stderr.trim());
  if (pinnedCompile.status === 0) {
    const pinnedOverlay = JSON.parse(readFileSync(pinnedOutput, 'utf8'));
    check(
      pinnedOverlay.claims[0]?.evidence_requirement?.freshness?.source_version === 'candidate-v2',
      'claim freshness preserves the authored exact candidate version',
    );
    const pinnedShadow = run(SHADOW, [
      `--overlay=${pinnedOutput}`,
      `--root=${ROOT}`,
      '--output-label=compact-pinned-source-fixture',
    ]);
    check(pinnedShadow.status === 0, 'historical candidate receipt shadow is K1-valid', pinnedShadow.stderr.trim());
    if (pinnedShadow.status === 0) {
      const report = JSON.parse(readFileSync(resolve(GENERATED, 'consumers/compact-pinned-source-fixture.shadow-report.json'), 'utf8'));
      check(report.kernel.claims['current-package-inspects-cleanly']?.state === 'stale', 'older candidate receipt becomes stale against the exact new candidate');
      check(report.kernel.checkpoints['current-package-observed']?.state === 'stale', 'stale candidate evidence keeps the current package checkpoint stale');
    }
  }

  const correctionSource = resolve(FIXTURES, 'correction-positive.yml');
  const correctionOutput = resolve(temp, 'correction.json');
  const correctionCompile = run(COMPILER, [`--source=${correctionSource}`, `--output=${correctionOutput}`]);
  check(correctionCompile.status === 0, 'authorized receipt-correction fixture compiles', correctionCompile.stderr.trim());
  if (correctionCompile.status === 0) {
    const correctionShadow = run(SHADOW, [
      `--overlay=${correctionOutput}`,
      `--root=${ROOT}`,
      '--output-label=compact-correction-fixture',
    ]);
    check(correctionShadow.status === 0, 'receipt-correction shadow is K1-valid', correctionShadow.stderr.trim());
    if (correctionShadow.status === 0) {
      const report = JSON.parse(readFileSync(resolve(GENERATED, 'consumers/compact-correction-fixture.shadow-report.json'), 'utf8'));
      check(report.kernel.claims['operation-observed']?.state === 'contradicted', 'corrected contradiction controls the claim state');
      check(report.kernel.checkpoints['operation-gate']?.state === 'contradicted', 'corrected contradiction controls the checkpoint');
      const original = report.kernel.receipt_evaluations['mistaken-support'];
      check(original?.compatible === false && original?.reasons?.includes('retracted-by-disposition'), 'retracted receipt remains visible but is excluded from evaluation');
    }
  }

  const negatives = [
    ['unknown-profile.yml', /unknown actor profile/],
    ['unknown-profile-version.yml', /Unsupported profile set/],
    ['unauthorized-recharter.yml', /lacks change-intent authority/],
    ['missing-actor.yml', /references unknown actor/],
    ['unsafe-path.yml', /escapes the consumer root/],
    ['absolute-path-in-prose.yml', /contains an absolute user path/],
    ['unknown-dependency.yml', /depends on unknown claim/],
    ['dependency-cycle.yml', /dependency cycle/],
    ['receipt-oracle-mismatch.yml', /does not match claim oracle/],
    ['receipt-self-certification.yml', /builder but the claim requires not-builder independence/],
    ['unauthorized-receipt-correction.yml', /lacks correct-receipt authority/],
    ['cross-claim-receipt-correction.yml', /must replace receipt-a with a native receipt for claim behavior-a/],
  ];
  for (const [file, expected] of negatives) {
    const result = run(COMPILER, [
      `--source=${resolve(FIXTURES, file)}`,
      `--output=${resolve(temp, `${file}.json`)}`,
    ]);
    const diagnostic = result.stderr.trim();
    check(result.status === 2 && expected.test(diagnostic), `${file} is rejected`, diagnostic);
    check(/compact\/fixtures\/[^:]+\.yml:\d+:/.test(diagnostic), `${file} diagnostic cites a source line`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\n${failures ? 'FAIL' : 'PASS'} compact self-test (${failures} failure${failures === 1 ? '' : 's'}).`);
process.exit(failures ? 1 : 0);
