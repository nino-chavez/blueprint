#!/usr/bin/env node
/**
 * blueprint — the @nino-chavez/blueprint-cli dispatcher.
 *
 * Thin ESM router over the methodology's tools. Step 2 of the blueprint-platform
 * build order (ADR-0001 dual-protocol distribution, ADR-0007 toolchain). Kept
 * dependency-free (hand-rolled arg parsing; commander is the named escalation if
 * the surface grows). Subcommands:
 *   init     scaffold a Pattern A/B portal (delegates to the canonical stamper)
 *   review   run an executable reviewer against a target   [stub — step 3, ADR-0002/0006]
 *   upgrade  pull non-breaking methodology updates          [stub — step 8, ADR-0005]
 *   fleet    report consumer drift from the registry        [stub — step 7, ADR-0005]
 *   cost     summarize per-stage effort/telemetry           [stub — step 5, ADR-0003]
 *   doctor   conformance / health check                     [stub — step 12]
 *
 * The methodology home is resolved by bin/lib/blueprint-home.mjs.
 */
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolveBlueprintHome, BlueprintHomeError } from './lib/blueprint-home.mjs';

const VERSION = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;

function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (const raw of argv) {
    const m = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? 'true';
    else if (/^-[a-z]$/i.test(raw)) flags[raw.slice(1)] = 'true';
    else positionals.push(raw);
  }
  return { flags, positionals };
}

const HELP = `blueprint v${VERSION} — Blueprint methodology CLI

Usage: blueprint <command> [options]

Commands:
  init       Scaffold a new Blueprint portal (Pattern A or B)
  review     Run an executable reviewer against a target  (blueprint review <name> [--target=<dir>] [--json])
  upgrade    Pull non-breaking methodology updates              (coming: step 8)
  fleet      Report consumer drift from the registry            (coming: step 7)
  cost       Summarize per-stage effort / telemetry             (coming: step 5)
  doctor     Conformance / health check                         (coming: step 12)

Global:
  -h, --help       Show help
  -v, --version    Show version

The methodology source resolves via:
  $BLUEPRINT_HOME -> blueprint.yml methodology_home -> the CLI's own package -> local dev paths.
`;

// Each not-yet-built subcommand resolves the methodology home (proving the
// resolver + distribution wiring) and reports its contract + which build-order
// step lands it. A real consumer running `blueprint <cmd>` today gets an honest
// "not yet, here's what it will do" — not a crash.
const STUBS = {
  upgrade: { step: 8,  adr: 'ADR-0005',            does: 'pull the semver-aware methodology delta and apply non-breaking migrations' },
  fleet:   { step: 7,  adr: 'ADR-0005',            does: 'read consumers.yml and report each consumer as behind / ahead / on-deprecated' },
  cost:    { step: 5,  adr: 'ADR-0003',            does: 'sweep .blueprint/telemetry.jsonl and summarize per-stage effort / model_tier / spend' },
  doctor:  { step: 12, adr: '(conformance)',       does: 'gate on runtime/browser verification — the false-green guard' },
};

function runInit(initArgv, home) {
  // init delegates to the canonical stamper; the CLI is a stable front door to it.
  const stamp = join(home, 'template', 'tools', 'blueprint-init', 'stamp.mjs');
  if (!existsSync(stamp)) {
    console.error(`blueprint init: stamper not found at ${stamp}`);
    process.exit(2);
  }
  const child = spawn(process.execPath, [stamp, ...initArgv], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
}

function readTier(targetDir) {
  // Minimal blueprint.yml read for the tier the reviewer gates on (no yaml dep).
  try {
    for (const line of readFileSync(join(targetDir, 'blueprint.yml'), 'utf8').split('\n')) {
      const m = /^\s*tier:\s*([0-9]+)/.exec(line);
      if (m) return Number(m[1]);
    }
  } catch {
    /* no blueprint.yml at the target */
  }
  return undefined;
}

// review <name> [--target=<dir>] [--json] — load the reviewer's .mjs (ADR-0002
// contract) and run it against the target. Exit 1 on BLOCKED, 0 otherwise.
async function runReview(reviewArgv, home) {
  const { flags, positionals } = parseArgs(reviewArgv);
  const name = positionals[0];
  const targetDir = resolve(flags.target || process.cwd());
  if (!name) {
    console.error('blueprint review: missing reviewer name.');
    console.error('  usage: blueprint review <reviewer> [--target=<dir>] [--json]');
    process.exit(2);
  }
  const reviewerPath = join(home, 'template', '.claude', 'agents', 'blueprint', 'reviewers', `${name}.mjs`);
  if (!existsSync(reviewerPath)) {
    console.error(`blueprint review: no executable reviewer '${name}'.`);
    console.error(`  expected: ${reviewerPath}`);
    console.error('  (only some reviewers have .mjs pairs so far — build-order step 3+.)');
    process.exit(2);
  }
  let fn;
  try {
    fn = (await import(pathToFileURL(reviewerPath).href)).default;
  } catch (e) {
    console.error(`blueprint review: failed to load '${name}': ${e.message}`);
    process.exit(2);
  }
  if (typeof fn !== 'function') {
    console.error(`blueprint review: '${name}' has no default export function (ADR-0002 review() contract).`);
    process.exit(2);
  }
  let res;
  try {
    res = await fn({ targetDir, blueprintYml: { tier: readTier(targetDir) }, methodologyHome: home });
  } catch (e) {
    console.error(`blueprint review: '${name}' threw — ${e.stack || e.message}`);
    process.exit(2);
  }

  if (flags.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    const icon = res.status === 'PASS' ? '✓' : res.status === 'WARN' ? '!' : '✗';
    console.log(`${icon} ${res.status} — ${name}  (${(res.metadata && res.metadata.targetSummary) || ''})`);
    for (const f of res.findings || []) {
      console.log(`\n  [${f.severity}] ${f.location}`);
      console.log(`    ${f.message}`);
      if (f.remediation) console.log(`    fix: ${f.remediation}`);
      if (f.reference) console.log(`    ref: ${f.reference}`);
    }
    if (!(res.findings || []).length) console.log('  no findings.');
  }
  process.exit(res.status === 'BLOCKED' ? 1 : 0);
}

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positionals } = parseArgs(argv);
  const cmd = positionals[0];

  if (flags.version || flags.v || cmd === 'version') {
    console.log(VERSION);
    return;
  }
  // Global help only when there is no subcommand; `<cmd> --help` passes through
  // to that subcommand (e.g. `blueprint init --help` -> the stamper's help).
  if (!cmd || cmd === 'help') {
    console.log(HELP);
    return;
  }

  let home;
  try {
    home = resolveBlueprintHome();
  } catch (e) {
    if (e instanceof BlueprintHomeError) {
      console.error(`blueprint: ${e.message}`);
      process.exit(2);
    }
    throw e;
  }

  if (cmd === 'init') {
    runInit(argv.slice(argv.indexOf('init') + 1), home);
    return;
  }

  if (cmd === 'review') {
    await runReview(argv.slice(argv.indexOf('review') + 1), home);
    return;
  }

  const stub = STUBS[cmd];
  if (stub) {
    console.log(`blueprint ${cmd} — not yet implemented (build-order step ${stub.step}, ${stub.adr}).`);
    console.log(`  Will: ${stub.does}.`);
    console.log(`  Methodology source resolved at: ${home}`);
    process.exit(3);
  }

  console.error(`blueprint: unknown command '${cmd}'. Run \`blueprint --help\`.`);
  process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
