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
import { join } from 'node:path';
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
  review     Run an executable reviewer against a target        (coming: step 3)
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
  review:  { step: 3,  adr: 'ADR-0002 / ADR-0006', does: 'run an executable .mjs reviewer — review({targetDir, blueprintYml, methodologyHome}) -> {status, findings[]} — against a target dir' },
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

function main() {
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

main();
