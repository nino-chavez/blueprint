#!/usr/bin/env node
// `npm run test:core`: the library self-tests plus the stamp-then-gate smoke.
// doctor.yml and release.yml both run it; the step list below is the only copy.
//
// A step passes only when it exits 0 AND prints its own pass line. Exit 0 alone
// proves nothing. test:core used to be an `&&` chain, and five of its steps
// passed `--selftest` to libraries that read only `--self-test`: they skipped
// their tests, printed nothing, and counted as passing (measured on origin/main
// 26e524b, 2026-09-25). A script whose entry guard never fires fails the same
// silent way, and no flag check inside the script can catch that, because the
// check never runs: from a checkout path containing a space, five more steps
// exited 0 with no output. Only a line the test prints itself separates "ran
// and passed" from "never ran". Every step runs even after one fails, so a run
// names all of its failures at once. A tools/lib file whose self-test has no
// step also fails the run. This script takes no arguments, so none can be
// misspelled.

import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIB = 'template/tools/lib';
const REVIEWERS = 'template/.claude/agents/blueprint/reviewers';
const TIMEOUT_MS = 10 * 60 * 1000;

// [script, args, pass line]. Each pattern anchors on the test's own summary line
// and leaves assertion counts out, so adding an assertion never breaks the gate.
const STEPS = [
  [`${LIB}/consumers-registry.mjs`, ['--self-test'], /^consumers-registry self-test: PASS\b/m],
  [`${LIB}/cost-dial.mjs`, ['--self-test'], /^cost-dial self-test: PASS\b/m],
  [`${LIB}/doctor.mjs`, ['--selftest'], /^doctor self-test: PASS\b/m],
  [`${LIB}/reviewer-registry.mjs`, ['--self-test'], /^reviewer-registry self-test: PASS\b/m],
  [`${LIB}/yaml-scalar.mjs`, ['--selftest'], /^yaml-scalar self-test: PASS\b/m],
  [`${LIB}/stage-model.mjs`, ['--selftest'], /^selftest OK \(/m],
  [`${LIB}/telemetry.mjs`, ['--self-test'], /^telemetry self-test: PASS\b/m],
  [`${LIB}/upgrade.mjs`, ['--self-test'], /^upgrade self-test: PASS\b/m],
  [`${LIB}/actor-output.mjs`, ['--selftest'], /^selftest OK \(/m],
  [`${LIB}/review-loop.mjs`, ['--selftest'], /^review-loop selftest: PASS\b/m],
  [`${LIB}/account-derive.mjs`, ['--selftest'], /^selftest OK \(/m],
  [`${LIB}/recipient-safety.mjs`, ['--selftest'], /^selftest OK \(/m],
  [`${LIB}/portal-derive.mjs`, ['--selftest'], /^selftest OK \(/m],
  [`${LIB}/encounter-audit.mjs`, ['--selftest'], /^encounter-audit self-test: PASS\b/m],
  [`${LIB}/invoked-directly.mjs`, ['--self-test'], /^invoked-directly self-test: PASS\b/m],
  [`${REVIEWERS}/persona-fit-reviewer.mjs`, ['--selftest'], /^persona-fit-reviewer self-test: PASS\b/m],
  [`${REVIEWERS}/pilot-profile-lock-reviewer.mjs`, ['--selftest'], /^ALL PASS$/m],
  [`${REVIEWERS}/design-principles-reviewer.mjs`, ['--selftest'], /^All \d+ assertions passed\.$/m],
  [`${REVIEWERS}/screen-composition-reviewer.mjs`, ['--selftest'], /^All \d+ assertions passed\.$/m],
  ['template/tools/blueprint-init/smoke.mjs', [], /^smoke green\b/m],
];

// null means pass; anything else is the reason the step failed.
function verdict(code, signal, stdout, pass) {
  if (signal) return `killed by ${signal}`;
  if (code !== 0) return `exit ${code}`;
  if (!pass.test(stdout)) return `exit 0 but no line matching ${pass}; the test may not have run (a flag it does not read, or an entry guard that did not fire)`;
  return null;
}

// The gate checks itself before anything relies on it: a silent exit 0 fails.
for (const [code, stdout, passes] of [[0, '', false], [0, 'unrelated\n', false], [1, 'x: PASS\n', false], [0, 'x: PASS\n', true]]) {
  if ((verdict(code, null, stdout, /^x: PASS\b/m) === null) !== passes) {
    console.error(`test-core: verdict() accepted the wrong case (exit ${code}, stdout ${JSON.stringify(stdout)})`);
    process.exit(2);
  }
}

function run([script, args, pass]) {
  return new Promise((resolve) => {
    let stdout = '';
    let timedOut = false;
    let settled = false;
    const finish = (why) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(why);
    };
    // stdin 'ignore': a child that reads stdin must not wait on ours forever.
    const child = spawn(process.execPath, [script, ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    child.on('error', (e) => finish(`could not start: ${e.message}`));
    child.on('close', (code, signal) => finish(timedOut ? `timed out after ${TIMEOUT_MS / 60000} min` : verdict(code, signal, stdout, pass)));
  });
}

if (process.argv.length > 2) {
  console.error(`test-core: takes no arguments (got: ${process.argv.slice(2).join(' ')})`);
  process.exit(2);
}

// A tools/lib self-test with no step here stops running without a word: a new
// lib nobody listed, or a row lost while resolving a merge conflict on this list.
// Scoped to tools/lib, where every self-test is already a step.
const listed = new Set(STEPS.map(([script]) => script));
const failures = readdirSync(join(ROOT, LIB))
  .filter((f) => f.endsWith('.mjs'))
  .map((f) => `${LIB}/${f}`)
  .filter((rel) => !listed.has(rel) && /['"]--self-?test['"]/.test(readFileSync(join(ROOT, rel), 'utf8')))
  .map((rel) => `${rel}: has a self-test but no step in bin/test-core.mjs`);

for (const step of STEPS) {
  const cmd = ['node', step[0], ...step[1]].join(' ');
  console.log(`\n── ${cmd}`);
  const why = await run(step);
  if (why) failures.push(`${cmd}: ${why}`);
}

if (failures.length) {
  console.error(`\ntest:core FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\ntest:core: all ${STEPS.length} steps ran and printed their pass lines`);
