#!/usr/bin/env node
/**
 * blueprint — the @nino-chavez/blueprint-cli dispatcher.
 *
 * Thin ESM router over the methodology's tools. Step 2 of the blueprint-platform
 * build order (ADR-0001 dual-protocol distribution, ADR-0007 toolchain). Kept
 * dependency-free (hand-rolled arg parsing; commander is the named escalation if
 * the surface grows). Subcommands:
 *   init     scaffold a Pattern A/B portal (delegates to the canonical stamper)
 *   review   run an executable reviewer against a target   (real — step 3, ADR-0002/0006)
 *   cost     per-stage effort/model config + telemetry sweep (real — step 5, ADR-0003)
 *   fleet    classify consumer drift from consumers.yml     (real — step 7, ADR-0005)
 *   upgrade  pull non-breaking methodology updates          [stub — step 8, ADR-0005]
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
  cost       Per-stage effort/model config + telemetry    (blueprint cost [--target=<dir>] [--json])
  fleet      Classify consumer drift from consumers.yml    (blueprint fleet [--json] [--strict])
             current / behind / ahead / on-deprecated / unpinned / unresolvable
             exit 0 = clean (incl. unpinned); exit 1 = drift (behind/on-deprecated/unresolvable or suspect registry)
  upgrade    Pull non-breaking methodology updates              (coming: step 8)
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

function fmtMs(ms) {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function fmtPct(rate) {
  return rate == null ? '—' : `${Math.round(rate * 100)}%`;
}

// cost [--target=<dir>] [--json] — resolve the blueprint.yml cost: block per
// stage (config view, always available) and sweep .blueprint/telemetry.jsonl
// (telemetry view, when present). Flags any stage resolved below its anchor with
// no skip_justification — the step-6 gate would BLOCK it. Loads the resolver +
// aggregator from the methodology home (same decoupling as `review`).
async function runCost(costArgv, home) {
  const { flags } = parseArgs(costArgv);
  const targetDir = resolve(flags.target || process.cwd());
  const libDir = join(home, 'template', 'tools', 'lib');
  let costDial, telemetry;
  try {
    costDial = await import(pathToFileURL(join(libDir, 'cost-dial.mjs')).href);
    telemetry = await import(pathToFileURL(join(libDir, 'telemetry.mjs')).href);
  } catch (e) {
    console.error(`blueprint cost: failed to load cost libs from ${libDir} — ${e.message}`);
    process.exit(2);
  }

  const costBlock = costDial.readCostBlock(targetDir);
  // Stage order: the anchored stages first, then any extra named in the block.
  const stageOrder = [
    ...Object.keys(costDial.ANCHORS),
    ...Object.keys(costBlock.stages || {}).filter((s) => !(s in costDial.ANCHORS)),
  ];
  const config = stageOrder.map((stage) => {
    const resolved = costDial.resolveCost(costBlock, stage);
    const up = costDial.underProcessed(stage, resolved);
    return { stage, ...resolved, belowAnchor: up.belowAnchor, anchor: up.anchor, dimensions: up.dimensions };
  });

  const records = telemetry.readTelemetry(targetDir);
  const summary = telemetry.summarizeTelemetry(records);

  if (flags.json) {
    console.log(JSON.stringify({ target: targetDir, config, telemetry: summary }, null, 2));
    process.exit(config.some((c) => c.belowAnchor) ? 1 : 0);
  }

  const hasYml = existsSync(join(targetDir, 'blueprint.yml'));
  console.log(`blueprint cost — ${hasYml ? targetDir : `${targetDir} (no blueprint.yml — showing built-in defaults)`}\n`);
  console.log('Resolved cost vector (blueprint.yml cost: → tools/lib/cost-dial.mjs):');
  console.log('  stage        effort   model    note');
  for (const c of config) {
    let note = c.skipJustification ? `skip_justification: ${c.skipJustification}` : '';
    if (c.belowAnchor) {
      const d = c.dimensions.map((x) => `${x.dim} ${x.got}<${x.anchor}`).join(', ');
      note = `⚠ below anchor (${d}) — no skip_justification → BLOCKs at step-6 gate`;
    }
    console.log(`  ${c.stage.padEnd(12)} ${String(c.effort).padEnd(8)} ${String(c.modelTier).padEnd(8)} ${note}`);
  }
  const flagged = config.filter((c) => c.belowAnchor);

  console.log(`\nTelemetry (${telemetry.TELEMETRY_REL}): ${records.length ? `${records.length} records` : 'none yet — anchors stay PROVISIONAL until ~10 cycles accumulate'}`);
  if (records.length) {
    console.log('  stage        runs   median   pass   tiers');
    for (const [stage, s] of Object.entries(summary.stages)) {
      const tiers = Object.entries(s.byTier).map(([t, v]) => `${t}×${v.count}`).join(' ');
      console.log(`  ${stage.padEnd(12)} ${String(s.count).padEnd(6)} ${fmtMs(s.medianDurationMs).padEnd(8)} ${fmtPct(s.passRate).padEnd(6)} ${tiers}`);
    }
    console.log('  (median = tier-weighted TIME proxy, not dollars — ADR-0003)');
  }

  if (flagged.length) {
    console.log(`\n${flagged.length} stage(s) resolve below anchor without justification; the step-6 cost gate would BLOCK them.`);
  }
  process.exit(flagged.length ? 1 : 0);
}

// fleet [--json] [--strict] — classify each registered consumer's drift from the
// current methodology version. Reads consumers.yml from the methodology HOME (not
// cwd; no --target — fleet is methodology-side). Read-only, visibility-only.
// Loads the lib from the methodology home (same decoupling as review/cost).
async function runFleet(fleetArgv, home) {
  const { flags } = parseArgs(fleetArgv);
  const libDir = join(home, 'template', 'tools', 'lib');
  let lib;
  try {
    lib = await import(pathToFileURL(join(libDir, 'consumers-registry.mjs')).href);
  } catch (e) {
    console.error(`blueprint fleet: failed to load consumers-registry lib from ${libDir} — ${e.message}`);
    process.exit(2);
  }

  const fleet = lib.computeFleet(home, undefined, { strict: !!flags.strict });

  if (fleet.emptyFile) {
    console.error(`blueprint fleet: consumers.yml at ${home} is empty — add a consumers: block to register consumers.`);
    process.exit(2);
  }
  if (!fleet.present) {
    console.error(`blueprint fleet: no consumers.yml at ${home} — the registry is methodology-side. Add one to register consumers (see docs/decisions/0005-consumer-registry-and-fleet.md).`);
    process.exit(2);
  }

  if (flags.json) {
    console.log(JSON.stringify(fleet, null, 2));
    process.exit(fleet.driftPresent ? 1 : 0);
  }

  const { current, summary, warnings } = fleet;
  const head7 = current.head ? current.head.slice(0, 7) : '???????';
  const tagNote = current.latestSemverTag ? `, latest tag ${current.latestSemverTag}` : ', no semver tags yet';
  console.log(`blueprint fleet — methodology @ ${home}`);
  console.log(`current: ${current.version || '(no package.json version)'}  (HEAD ${head7}${tagNote})\n`);

  if (!current.head) {
    console.log('! git HEAD unresolvable (not a git repo / broken HEAD / shallow clone) — sha-pinned consumers cannot be placed and show as unresolvable for that reason, not a pin defect.');
  }
  if (warnings.skippedItems > 0) {
    console.log(`! ${warnings.skippedItems} malformed/incomplete entr${warnings.skippedItems === 1 ? 'y' : 'ies'} skipped (missing repo or unparseable) — registry is suspect`);
  }
  if (warnings.duplicates.length > 0) {
    console.log(`! duplicate repo entries (last-wins): ${warnings.duplicates.join(', ')}`);
  }

  // Truncate-pad keeps the fixed-width table aligned even for long org/name slugs.
  const padTrunc = (s, w) => { s = String(s); return s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w); };
  console.log('  repo                                pattern  pin        class          distance      owner');
  for (const c of fleet.consumers) {
    const dist = c.distance == null ? '—' : `${c.distance} ${c.distanceUnit || ''}`.trim();
    console.log(
      `  ${padTrunc(c.repo, 35)} ${padTrunc(c.pattern || '—', 7)} ${padTrunc(c.pin || '—', 10)} ${padTrunc(c.class, 14)} ${padTrunc(dist, 13)} ${c.owner || '—'}`
    );
  }

  const staleRows = fleet.consumers.filter((c) => c.syncedAt);
  if (staleRows.length) {
    console.log(`\n  ~ pins are a mirror of each consumer's blueprint.yml (last synced: ${staleRows.map((c) => `${c.repo.split('/').pop()} ${c.syncedAt}`).join(', ')}); verify before acting.`);
  }

  console.log(
    `\n${summary.total} consumers: ${summary.behind} behind, ${summary.onDeprecated} on-deprecated, ${summary.unresolvable} unresolvable, ${summary.unpinned} unpinned (informational), ${summary.ahead} ahead → exit ${fleet.driftPresent ? 1 : 0}`
  );
  process.exit(fleet.driftPresent ? 1 : 0);
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

  if (cmd === 'cost') {
    await runCost(argv.slice(argv.indexOf('cost') + 1), home);
    return;
  }

  if (cmd === 'fleet') {
    await runFleet(argv.slice(argv.indexOf('fleet') + 1), home);
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
