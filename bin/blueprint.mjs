#!/usr/bin/env node
/**
 * blueprint — the @nino-chavez-labs/blueprint-cli dispatcher.
 *
 * Thin ESM router over the methodology's tools. Step 2 of the blueprint-platform
 * build order (ADR-0001 dual-protocol distribution, ADR-0007 toolchain). Kept
 * dependency-free (hand-rolled arg parsing; commander is the named escalation if
 * the surface grows). Subcommands:
 *   init     scaffold a Pattern A/B portal (delegates to the canonical stamper)
 *   review   run an executable reviewer against a target   (real — step 3, ADR-0002/0006)
 *   cost     per-stage effort/model config + telemetry sweep (real — step 5, ADR-0003)
 *   fleet    classify consumer drift from consumers.yml     (real — step 7, ADR-0005)
 *   upgrade  preview/apply this consumer's pin bump         (real — step 8, ADR-0005)
 *   doctor   conformance / health check (the false-green guard) (real — step 12)
 *   hive     stand up the team coordination substrate (hive setup --slug=<x>)
 *   stage    derive pipeline position from artifacts-on-disk (stage status — ADR-0008)
 *   feedback validate a review/disposition loop pinned to an exact candidate
 *
 * The methodology home is resolved by bin/lib/blueprint-home.mjs.
 */
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolveBlueprintHome, BlueprintHomeError, readYamlScalar } from './lib/blueprint-home.mjs';

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
             discovers canonical + org reviewers (ADR-0006); blueprint review --list enumerates them
  cost       Per-stage effort/model config + telemetry    (blueprint cost [--target=<dir>] [--json])
  fleet      Classify consumer drift from consumers.yml    (blueprint fleet [--json] [--strict])
             current / behind / ahead / on-deprecated / unpinned / unresolvable
             exit 0 = clean (incl. unpinned); exit 1 = drift (behind/on-deprecated/unresolvable or suspect registry)
  upgrade    Preview/apply this consumer's pin bump        (blueprint upgrade [--target=<dir>] [--apply] [--ack-untagged] [--require-pin] [--json])
             dry-run by default (terraform-plan style); --apply writes the methodology_version bump (dirty-tree-guarded, breaking-gated)
  doctor     Conformance / health check                    (blueprint doctor [--target=<dir>] [--json])
             actually loads the config + every reviewer + runs portal conformance — the false-green guard
  hive       Stand up the team coordination substrate      (blueprint hive setup --slug=<x> --cf-account-id=<id> [--hive-dir=.hive] [--execute])
             dry-run PLAN by default (terraform-plan style); --execute provisions CF D1+Worker+Pages from a vendored ai-hive kit
             the "run" rung of crawl→walk→run — only when contention is real (docs/governance/team-roles-and-conventions.md litmus)
  stage      Derive/advance the initiative's pipeline position (blueprint stage <status|advance> [--target=<dir>] [--json])
             deterministic-core view (ADR-0008): status marks derivable vs. assertion-only gates; advance gates the next transition
             advance is dry-run by default; --execute records to .blueprint/stage-state.json; --assert-<gate>="…" confirms a shell gate
  feedback   Validate the reader review/disposition loop (blueprint feedback [--target=<dir>] [--json] [--gate])
             exact candidate + asks + authority + capture adapter + submissions + dispositions + return-to-reader

Global:
  -h, --help       Show help
  -v, --version    Show version

The methodology source resolves via:
  $BLUEPRINT_HOME -> blueprint.yml methodology_home -> the CLI's own package -> local dev paths.
`;

// Not-yet-built subcommands resolve the methodology home (proving the resolver +
// distribution wiring) and report their contract + build-order step rather than
// crashing. As of build-order step 12 every command is real, so this is empty —
// kept as the seam for any future not-yet-built subcommand.
const STUBS = {};

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

// review <name> [--target=<dir>] [--json] | review --list — discover reviewers
// across canonical + org sources (ADR-0006), then load the named one (ADR-0002
// contract) and run it against the target. Exit 1 on BLOCKED, 0 otherwise.
async function runReview(reviewArgv, home) {
  const { flags, positionals } = parseArgs(reviewArgv);
  const targetDir = resolve(flags.target || process.cwd());

  const libDir = join(home, 'template', 'tools', 'lib');
  let registry;
  try {
    registry = await import(pathToFileURL(join(libDir, 'reviewer-registry.mjs')).href);
  } catch (e) {
    console.error(`blueprint review: failed to load reviewer-registry from ${libDir} — ${e.message}`);
    process.exit(2);
  }

  // --list — enumerate discovered reviewers (canonical first, then org), with shadows.
  if (flags.list) {
    const { active, shadows } = registry.discoverReviewers({ home, targetDir });
    console.log(`blueprint review — ${active.length} reviewer(s) discovered  (target: ${targetDir})\n`);
    let cur = null;
    for (const r of active) {
      if (r.source !== cur) { cur = r.source; console.log(`  [${cur}]`); }
      console.log(`    ${r.name}${r.pkg ? `  (${r.pkg})` : ''}`);
    }
    if (shadows.length) {
      console.log('\n  shadowed (same name as a higher-precedence reviewer — NOT run):');
      for (const s of shadows) console.log(`    ! ${s.name} from ${s.source}${s.pkg ? ` (${s.pkg})` : ''} — shadowed by ${s.shadowedBy}`);
    }
    process.exit(0);
  }

  const name = positionals[0];
  if (!name) {
    console.error('blueprint review: missing reviewer name.');
    console.error('  usage: blueprint review <reviewer> [--target=<dir>] [--json]');
    console.error('         blueprint review --list [--target=<dir>]');
    process.exit(2);
  }

  const { entry, shadows } = registry.resolveReviewer(name, { home, targetDir });
  if (!entry) {
    console.error(`blueprint review: no executable reviewer '${name}' (canonical or org).`);
    console.error('  run `blueprint review --list` to see what is available.');
    process.exit(2);
  }
  for (const s of shadows) {
    console.error(`! '${name}' from ${s.source}${s.pkg ? ` (${s.pkg})` : ''} is SHADOWED by ${s.shadowedBy} — running the ${entry.source} one (canonical authority; an org reviewer may tighten via its OWN gate, never relax a canonical one).`);
  }

  const loaded = await registry.loadReviewer(entry.path);
  if (!loaded.ok) {
    console.error(`blueprint review: '${name}' (${entry.source}) — ${loaded.reason}`);
    process.exit(2);
  }

  let res;
  try {
    res = await loaded.fn({ targetDir, blueprintYml: { tier: readTier(targetDir) }, methodologyHome: home });
  } catch (e) {
    console.error(`blueprint review: '${name}' threw — ${e.stack || e.message}`);
    process.exit(2);
  }

  if (flags.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    const icon = res.status === 'PASS' ? '✓' : res.status === 'WARN' ? '!' : '✗';
    const src = entry.source === 'canonical' ? '' : `  [${entry.source}${entry.pkg ? `: ${entry.pkg}` : ''}]`;
    console.log(`${icon} ${res.status} — ${name}${src}  (${(res.metadata && res.metadata.targetSummary) || ''})`);
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

// upgrade [--target=<dir>] [--apply] [--ack-untagged] [--require-pin] [--json] —
// the DOWN channel, consumer-local (ADR-0005). Runs in a CONSUMER repo: reads
// THIS consumer's methodology_version pin, classifies it against the current
// methodology (reusing the fleet classifier, N=1), narrates the delta, and —
// only under --apply, dirty-tree-guarded + breaking-gated — bumps the pin.
// Default is a dry-run preview (terraform plan). v1 is pin-bump only; chrome
// re-stamp stays the separate `stamp.mjs --mode=restamp-chrome` step.
async function runUpgrade(upgradeArgv, home) {
  const { flags } = parseArgs(upgradeArgv);
  const targetDir = resolve(flags.target || process.cwd());
  const apply = !!flags.apply;
  const ackUntagged = !!flags['ack-untagged'];
  const requirePin = !!flags['require-pin'];

  if (!existsSync(join(targetDir, 'blueprint.yml'))) {
    console.error(`blueprint upgrade: no blueprint.yml at ${targetDir} — upgrade runs in a CONSUMER repo. cd into an initiative or pass --target=<dir>.`);
    process.exit(2);
  }

  const libDir = join(home, 'template', 'tools', 'lib');
  let reg, up;
  try {
    reg = await import(pathToFileURL(join(libDir, 'consumers-registry.mjs')).href);
    up = await import(pathToFileURL(join(libDir, 'upgrade.mjs')).href);
  } catch (e) {
    console.error(`blueprint upgrade: failed to load upgrade libs from ${libDir} — ${e.message}`);
    process.exit(2);
  }

  const pin = readYamlScalar(join(targetDir, 'blueprint.yml'), 'methodology_version');
  const gitProbe = reg.makeGitProbe(home);
  const current = reg.resolveCurrent(gitProbe);
  const verdict = reg.classifyConsumer({ repo: '(this consumer)', methodology_version: pin, deprecated_pin: false }, current, gitProbe);
  const delta = up.narrateChangelogDelta({ home, pin, current, verdictClass: verdict.class, gitProbe });
  const gate = up.computeGate(verdict, { ackUntagged });
  // upgrade-TO is `current`, shaped to match the pin: a semver pin bumps to the
  // version; a sha pin bumps to the short HEAD. An UNPINNED consumer adopts the
  // stable semver release identity (version) when one exists — friendlier and
  // forward-compatible — else the short HEAD.
  const shortHead = current.head ? current.head.slice(0, 7) : null;
  const to = pin
    ? (reg.looksLikeSemver(pin) ? current.version : shortHead)
    : (current.version || shortHead);

  // exit code (dry-run): 0 if current, 0 if unpinned (unless --require-pin), else 1.
  const driftExit = verdict.class === 'current' ? 0 : (verdict.class === 'unpinned' ? (requirePin ? 1 : 0) : 1);

  if (flags.json) {
    console.log(JSON.stringify({
      target: targetDir,
      pinned: pin,
      current,
      verdict: { class: verdict.class, distance: verdict.distance, distanceUnit: verdict.distanceUnit, reason: verdict.reason, breaking: verdict.breaking },
      delta,
      proposed: { from: pin, to, gate: gate.action },
      applied: false,
    }, null, 2));
    if (!apply) process.exit(driftExit);
  } else {
    const head7 = current.head ? current.head.slice(0, 7) : '???????';
    console.log(`blueprint upgrade — ${targetDir}`);
    console.log(`pinned: ${pin || '(unpinned)'}   methodology current: ${current.version || '?'} (HEAD ${head7})`);
    console.log(`verdict: ${verdict.class}${verdict.distance != null ? ` (${verdict.distance} ${verdict.distanceUnit})` : ''} — ${verdict.reason}`);
    if (delta.kind === 'commitlog') {
      console.log(`delta: no semver releases between ${(pin || '').slice(0, 7)} and current — methodology commit log (CHANGELOG narration begins once vX.Y.Z tags exist in range):`);
      for (const s of delta.entries.slice(0, 15)) console.log(`  ${s}`);
      if (delta.entries.length > 15) console.log(`  … ${delta.entries.length - 15} more`);
    } else if (delta.kind === 'changelog') {
      console.log('delta: CHANGELOG sections in range:');
      for (const s of delta.entries) console.log(s.split('\n').map((l) => `  ${l}`).join('\n'));
    } else {
      console.log('delta: (nothing to narrate — already current or no released versions in range)');
    }
    if (gate.action === 'noop') {
      console.log('gate: noop — already current.');
    } else if (gate.action.startsWith('refuse')) {
      console.log(`gate: REFUSE — ${gate.message}`);
    } else {
      console.log(`proposed: bump methodology_version ${pin || '(none)'} -> ${to} in blueprint.yml   [--apply to write]`);
      console.log(`gate: ${gate.action} — ${gate.message}`);
    }
  }

  if (!apply) {
    if (!flags.json) console.log(`\nexit ${driftExit} (dry-run; --apply to write)`);
    process.exit(driftExit);
  }

  // ── --apply path ──
  if (gate.action === 'noop') process.exit(0);
  if (gate.action.startsWith('refuse')) {
    if (!flags.json) console.log(`\nnot applied — ${gate.message}. exit 1`);
    process.exit(1);
  }
  // dirty-tree guard — makes "revert via git" true rather than asserted.
  if (up.isDirty(targetDir, ['blueprint.yml'])) {
    console.error(`blueprint upgrade: blueprint.yml at ${targetDir} has uncommitted changes; the revert hint would discard them. Commit or stash first, then re-run --apply.`);
    process.exit(2);
  }
  const res = up.bumpPin(targetDir, gate.action === 'insert' ? null : pin, to);
  if (!res.ok) {
    console.error(`blueprint upgrade: pin write failed — ${res.error}. blueprint.yml left unchanged or reverted.`);
    process.exit(2);
  }
  console.log(`applied: methodology_version ${res.mode === 'insert' ? 'inserted' : 'bumped'} -> ${to} in ${targetDir}/blueprint.yml`);
  if (up.isTracked(targetDir, 'blueprint.yml')) {
    console.log(`revert: git -C ${targetDir} checkout blueprint.yml`);
  } else if (res.mode === 'insert') {
    console.log(`revert: delete the inserted line  methodology_version: "${to}"`);
  } else {
    console.log(`revert: set methodology_version back to ${pin}`);
  }
  process.exit(0);
}

// doctor [--target=<dir>] [--json] — the conformance/health capstone. Actually
// loads the config + every discovered reviewer + runs portal conformance (real
// runtime verification, not a curl-200 / files-exist green) and reports what it
// did NOT check. exit 0 healthy (pass/warn), 1 on any FAIL, 2 on load error.
async function runDoctor(doctorArgv, home) {
  const { flags } = parseArgs(doctorArgv);
  const targetDir = resolve(flags.target || process.cwd());
  let doctor;
  try {
    doctor = await import(pathToFileURL(join(home, 'template', 'tools', 'lib', 'doctor.mjs')).href);
  } catch (e) {
    console.error(`blueprint doctor: failed to load doctor lib — ${e.message}`);
    process.exit(2);
  }

  const result = await doctor.runDoctor({ home, targetDir });

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'fail' ? 1 : 0);
  }

  const icon = { pass: '✓', warn: '!', fail: '✗', skip: '·' };
  console.log(`blueprint doctor — ${targetDir}\n`);
  for (const c of result.checks) {
    console.log(`  ${icon[c.status] || '?'} ${c.name.padEnd(20)} ${c.detail}`);
    if (c.remediation) console.log(`      fix: ${c.remediation}`);
  }
  console.log('\n  not checked (by design — a green here is not a build/browser green):');
  for (const n of result.notChecked) console.log(`    · ${n}`);
  console.log(`\noverall: ${result.status.toUpperCase()} → exit ${result.status === 'fail' ? 1 : 0}`);
  process.exit(result.status === 'fail' ? 1 : 0);
}

// hive <subcommand> — stand up / operate the team coordination substrate. v1
// has one subcommand: `setup`, which runs the dependency-free bootstrap
// (template/tools/hive/bootstrap.mjs) loaded from the methodology home. Default
// is a dry-run PLAN (no live CF mutation); --execute provisions for real. The
// kit itself is NOT vendored here (integrate-not-absorb) — point --hive-dir at
// the operator's vendored ai-hive checkout (defaults to ./.hive).
async function runHive(hiveArgv, home) {
  const { flags, positionals } = parseArgs(hiveArgv);
  const sub = positionals[0];

  if (sub !== 'setup') {
    console.error('blueprint hive: usage — blueprint hive setup --slug=<x> --cf-account-id=<id> [--hive-dir=.hive] [--execute]');
    console.error('  setup   provision a fresh Hive (CF D1 + Worker + Pages) from a vendored ai-hive kit');
    console.error('          dry-run plan by default; --execute applies. See template/tools/hive/BOOTSTRAP.md for the 3 manual steps.');
    process.exit(2);
  }

  // --hive-dir, else ./.hive if present (subtree convention), else cwd.
  let hiveDir = flags['hive-dir'];
  if (!hiveDir) hiveDir = existsSync(join(process.cwd(), '.hive')) ? join(process.cwd(), '.hive') : process.cwd();
  hiveDir = resolve(hiveDir);

  // Secrets prefer an explicit flag; env is the 1Password-injection fallback
  // (e.g. --cf-api-token="$(op read 'op://Developer Secrets/...')"). Never logged.
  const cfAccountId = flags['cf-account-id'] || process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const cfApiToken = flags['cf-api-token'] || process.env.CF_API_TOKEN;
  const githubToken = flags['github-token'] || process.env.GITHUB_TOKEN;

  let lib;
  try {
    lib = await import(pathToFileURL(join(home, 'template', 'tools', 'hive', 'bootstrap.mjs')).href);
  } catch (e) {
    console.error(`blueprint hive: failed to load bootstrap lib from ${home} — ${e.message}`);
    process.exit(2);
  }

  const result = await lib.bootstrap({
    slug: flags.slug,
    cfAccountId,
    hiveDir,
    execute: !!flags.execute,
    cfApiToken,
    githubToken,
    ghRepo: flags['gh-repo'],
  });

  if (!result.ok) {
    if (result.error) console.error(`\nblueprint hive setup: ${result.error}`);
    process.exit(1);
  }
  process.exit(0);
}

// stage <status|advance> — the deterministic-core view of the initiative's
// position in the pipeline (ADR-0008). `status` derives current stage from
// artifacts-on-disk + blueprint.yml and reports it, honestly marking which
// gates are machine-derivable vs. which need an agent/human assertion.
// `advance` gates the next transition: dry-run by default; --execute records
// the confirmed cursor + assertions to .blueprint/stage-state.json (wave 81).
// It validates and records — it does NOT dispatch the stage skill/agent;
// reviewer dispatch is scheduled per the ADR-0008 wave-86 addendum.
async function runStage(stageArgv, home) {
  const { flags, positionals } = parseArgs(stageArgv);
  const sub = positionals[0] || 'status';
  const targetDir = resolve(flags.target || process.cwd());

  if (sub !== 'status' && sub !== 'advance') {
    console.error('blueprint stage: usage — blueprint stage <status|advance> [--target=<dir>] [--json]');
    process.exit(2);
  }

  let lib;
  try {
    lib = await import(pathToFileURL(join(home, 'template', 'tools', 'lib', 'stage-model.mjs')).href);
  } catch (e) {
    console.error(`blueprint stage: failed to load stage-model lib — ${e.message}`);
    process.exit(2);
  }

  const icon = { pass: '✓', partial: '~', absent: '✗' };
  // --assert-<gate>=<evidence> flags record operator assertions for the
  // non-derivable (agentic-shell) gates. Any flag key starting `assert-` maps
  // to a gate id (dashes preserved, e.g. --assert-live-url="https://…").
  const asserts = {};
  for (const [k, v] of Object.entries(flags)) if (k.startsWith('assert-')) asserts[k.slice('assert-'.length)] = v;
  const state = lib.readStageState(targetDir);

  // Corrupt state file must not be silently discarded (it holds the recorded
  // assertions/history). Warn on every path; advance --execute refuses below.
  if (state.corrupt) console.error(`  ! .blueprint/stage-state.json is unparseable (${state.error}) — ignoring recorded state; fix or remove it`);

  if (sub === 'advance') {
    const execute = !!flags.execute;
    // Validate --assert-<gate> ids against the model's non-derivable gates, and
    // reject evidence-less bare flags — a typo'd or empty assertion silently
    // "satisfying" a shell gate defeats the whole recorded-confirmation point.
    const shellGateIds = new Set(
      lib.deriveStageStatus({ root: targetDir }).stages.flatMap((s) => s.gates).filter((g) => !g.derivable).map((g) => g.gate),
    );
    const assertErrors = [];
    for (const [gate, evidence] of Object.entries(asserts)) {
      if (!shellGateIds.has(gate)) assertErrors.push(`unknown assertable gate '${gate}' — non-derivable gates are: ${[...shellGateIds].join(', ') || '(none)'}`);
      // reject both the bare-flag sentinel ('true') and empty/whitespace
      // evidence (--assert-x= or --assert-x="$UNSET") — an evidence-less
      // confirmation defeats the recorded-confirmation purpose.
      else if (evidence === 'true' || !String(evidence).trim()) assertErrors.push(`--assert-${gate} needs evidence: --assert-${gate}="what you confirmed"`);
    }
    if (assertErrors.length) { for (const e of assertErrors) console.error(`  ✗ ${e}`); process.exit(2); }

    const res = await lib.recordAdvance({ root: targetDir, asserts, execute, home });
    if (flags.json) { console.log(JSON.stringify(res, null, 2)); process.exit(res.ok ? 0 : 1); }
    console.log(`blueprint stage advance${execute ? '' : ' (dry-run)'} — ${targetDir}\n`);
    if (res.corrupt) { console.error(`  ✗ ${res.message}`); process.exit(2); }
    if (res.complete) { console.log(`  ${res.message}`); process.exit(0); }
    console.log(`target frontier: Stage ${res.target.id} — ${res.target.name}\n`);
    if (!res.ok) {
      for (const g of res.blocking || []) console.log(`  ✗ ${g.gate.padEnd(20)} ${g.evidence}  (derivable — fix on disk, cannot assert)`);
      for (const g of res.missingAssertions || []) console.log(`  ~ ${g.gate.padEnd(20)} ${g.evidence}  (assert with --assert-${g.gate}="…")`);
      for (const rv of res.reviewerBlocked || []) console.log(`  ✗ ${rv.gate.padEnd(20)} reviewer ${rv.reviewer}: ${rv.status}${rv.note ? ` — ${rv.note}` : ''}`);
      console.log(`\n  BLOCKED — entry-guard not satisfied.`);
      process.exit(1);
    }
    // ADR-0009: mapped reviewers verified at the frontier (fresh recorded
    // PASSes reused; others ran just now — read-only either way).
    for (const rv of res.reviews || []) console.log(`  ${rv.status === 'PASS' ? '✓' : '~'} ${rv.gate.padEnd(20)} reviewer ${rv.reviewer}: ${rv.status}${rv.ran ? '' : ' (recorded, fresh)'}${rv.note ? ` — ${rv.note}` : ''}`);
    console.log(`  ✓ entry-guard satisfied — frontier Stage ${res.target.id} completes`);
    if (execute) console.log(`  ✓ recorded → ${res.wrote} (confirmed cursor now Stage ${res.cursor})`);
    else console.log(`  (dry-run — re-run with --execute to record; confirmed cursor would be Stage ${res.cursor})`);
    process.exit(0);
  }

  const res = lib.deriveStageStatus({ root: targetDir, assertions: state.assertions });
  if (flags.json) { console.log(JSON.stringify({ ...res, recordedCursor: state.cursor }, null, 2)); process.exit(0); }
  console.log(`blueprint stage status — ${targetDir}`);
  console.log(`model: ${res.variant} [${res.modelSource}]${res.modelNote ? `  (${res.modelNote})` : ''}\n`);
  for (const s of res.stages) {
    const passN = s.gates.filter((g) => g.state === 'pass').length;
    console.log(`Stage ${s.id} — ${s.name}   [${passN}/${s.gates.length} pass]${s.complete ? '' : '  ← not yet confirmed complete'}`);
    for (const g of s.gates) {
      const der = g.derivable ? '   ' : ' *?';
      console.log(`  ${icon[g.state] || '?'}${der} ${g.gate.padEnd(20)} ${g.evidence}`);
    }
  }
  console.log(`\n  legend: ✓ pass  ~ partial  ✗ absent    *? = NOT machine-derivable (needs agent/human assertion)`);
  console.log(`\nartifact cursor:  Stage ${res.artifactCursor} ${res.artifactCursor >= 0 ? `(${res.artifactCursorName})` : '(none)'}  — how far the disk artifacts reach (derivable gates only)`);
  console.log(`confirmed cursor: Stage ${res.cursor} ${res.cursor >= 0 ? `(${res.cursorName})` : '(none)'}  — all gates incl. recorded assertions (what \`advance\` moves)`);
  console.log(`stages complete:  ${res.stagesComplete.length}/${res.stageCount} [${res.stagesComplete.join(', ') || '—'}]  — coverage (may be non-contiguous; the spine stops at the first gap)`);
  if (res.nextStage) console.log(`frontier (advance target): Stage ${res.nextStage.id} — ${res.nextStage.name}`);
  console.log(`\nderivability: ${res.derivableCount}/${res.totalGates} gates machine-derivable, ${res.nonderivableCount}/${res.totalGates} need assertion`);
  console.log(`  the deterministic core owns the ${res.derivableCount}; the agentic shell owns the ${res.nonderivableCount}.`);
  process.exit(0);
}

// feedback [--target=<dir>] [--json] [--gate] — validate the optional
// renderer-independent review loop. The reader may contribute through a
// bespoke site, portal, native app, Slack, meeting, or an Atelier-style
// annotation substrate; the on-disk contract is identical. Default mode exits
// nonzero only for structural/authority errors. --gate additionally requires
// an issued loop to be closed and returned to the reader.
async function runFeedback(feedbackArgv, home) {
  const { flags } = parseArgs(feedbackArgv);
  if (flags.help || flags.h) {
    console.log(`Usage: blueprint feedback [--target=<dir>] [--json] [--gate]

Validate review-contract.json plus candidate-pinned submissions, dispositions,
and return-to-reader receipts.

  --target=<dir>  Initiative root (default: current directory)
  --json          Machine-readable result
  --gate          Require PASS; default mode exits nonzero only on BLOCKED
`);
    return;
  }
  const targetDir = resolve(flags.target || process.cwd());
  let lib;
  try {
    lib = await import(pathToFileURL(join(home, 'template', 'tools', 'lib', 'review-loop.mjs')).href);
  } catch (e) {
    console.error(`blueprint feedback: failed to load review-loop lib — ${e.message}`);
    process.exit(2);
  }
  const result = lib.evaluateReviewLoop({ root: targetDir });
  if (flags.json) {
    console.log(JSON.stringify({ target: targetDir, ...result }, null, 2));
  } else {
    console.log(`blueprint feedback — ${result.verdict}  (${targetDir})`);
    console.log(`  targets=${result.counts.targets} submissions=${result.counts.submissions} dispositions=${result.counts.dispositions} open=${result.counts.open}`);
    for (const error of result.errors) console.log(`  ERROR ${error}`);
    for (const pending of result.pendings) console.log(`  PEND  ${pending}`);
    for (const warn of result.warns) console.log(`  warn  ${warn}`);
  }
  const gate = !!flags.gate;
  process.exit(result.verdict === 'BLOCKED' || (gate && result.verdict !== 'PASS') ? 1 : 0);
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

  if (cmd === 'upgrade') {
    await runUpgrade(argv.slice(argv.indexOf('upgrade') + 1), home);
    return;
  }

  if (cmd === 'fleet') {
    await runFleet(argv.slice(argv.indexOf('fleet') + 1), home);
    return;
  }

  if (cmd === 'doctor') {
    await runDoctor(argv.slice(argv.indexOf('doctor') + 1), home);
    return;
  }

  if (cmd === 'hive') {
    await runHive(argv.slice(argv.indexOf('hive') + 1), home);
    return;
  }

  if (cmd === 'stage') {
    await runStage(argv.slice(argv.indexOf('stage') + 1), home);
    return;
  }

  if (cmd === 'feedback') {
    await runFeedback(argv.slice(argv.indexOf('feedback') + 1), home);
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
