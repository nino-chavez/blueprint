#!/usr/bin/env node
/**
 * run-reviewers.mjs — run the EXECUTABLE reviewer gates that APPLY TO THIS
 * initiative's variant, against the current directory.
 *
 * Closes the foot-gun the mrr-automation dogfood (B′) surfaced: invoking a reviewer
 * `.mjs` directly fires its inline SELF-TEST (temp fixtures), not a review of your
 * initiative — a consumer sees "self-test PASS" and mistakes it for "my work passed."
 * This runner imports each applicable reviewer's default export (ADR-0002's
 * `review({targetDir})` — the interface IS the SDK) and runs it against cwd.
 *
 * VARIANT-AWARE: it runs only the reviewers in the declared variant's roster (the
 * roster below mirrors docs/variant-selection.md § "Reviewer agents per variant").
 * Running every reviewer would mis-fire — the greenfield/portal/prescription gates
 * BLOCK on a research initiative they don't apply to. Variants without a roster entry
 * run all discovered reviewers (prior behavior preserved), except:
 *
 * PORTAL-AWARE (decisions/11, wave 113): the three portal conformance reviewers run
 * only where `blueprint doctor` would run them. Both use tools/lib/
 * portal-reviewer-routing.mjs. Before this, an Initiative Portal stamp got 11 BLOCKs
 * from the two Review Portal reviewers, which can never apply to it.
 *
 * It also lists the spec-only (agent-run, no `.mjs`) gates so a green executable run
 * is never mistaken for full coverage — the judgment gates still need an agent pass.
 *
 * Usage:  node tools/run-reviewers.mjs        (from the initiative root)
 *         npm run reviewers                   (where the stamp wrote a package.json)
 * Exit:   0 = no blocks; 1 = at least one BLOCK or reviewer ERROR.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readTopLevelYamlScalar } from './lib/yaml-scalar.mjs';

const targetDir = process.cwd();
const reviewersDir = path.join(targetDir, '.claude', 'agents', 'blueprint', 'reviewers');

// Source of truth: docs/variant-selection.md § Reviewer agents per variant.
// Executable (.mjs) reviewers that apply per variant. Omit a variant → run all.
const VARIANT_ROSTER = {
  research: [
    'research-completeness-reviewer',
    'persona-fit-reviewer',
    'terminology-linter',
    'doc-currency-reviewer',
    'stateful-claim-lint-reviewer',
  ],
};
// Spec-only (agent-run) gates per variant, surfaced so the operator knows a green
// executable run is partial.
const SPEC_ONLY_BY_VARIANT = {
  research: ['doc-quality-auditor', 'fact-check-loop-reviewer'],
};

async function listFiles(dir, ext) {
  try {
    return (await fs.readdir(dir)).filter((f) => f.endsWith(ext) && !f.startsWith('_'));
  } catch {
    return [];
  }
}
const ymlText = await fs.readFile(path.join(targetDir, 'blueprint.yml'), 'utf8').catch(() => null);
const variant = readTopLevelYamlScalar(ymlText, 'variant') || 'greenfield';
// Parsed scalars reviewers expect from the harness (some key their scope on tier/variant).
const blueprintYml = { variant, tier: readTopLevelYamlScalar(ymlText, 'tier') };

const mjsFiles = await listFiles(reviewersDir, '.mjs');
const mdFiles = await listFiles(reviewersDir, '.md');
const allNames = mjsFiles.map((f) => f.replace(/\.mjs$/, ''));

const roster = VARIANT_ROSTER[variant];
let toRun = roster ? mjsFiles.filter((f) => roster.includes(f.replace(/\.mjs$/, ''))) : mjsFiles;
const skipped = roster ? allNames.filter((n) => !roster.includes(n)) : [];

// Portal reviewers apply by which portal this initiative has, decided by the rule
// `blueprint doctor` uses. A research roster already leaves them out. A copy of this
// runner without the routing helper keeps the old run-everything behavior, and says so.
const portalNotRun = [];
if (!roster) {
  try {
    const routing = await import('./lib/portal-reviewer-routing.mjs');
    const aoState = routing.readActorOutputState(targetDir);
    let actorOutputRoute = false;
    if (aoState.manifest && !aoState.ambiguous) {
      try {
        const { validateManifestFile } = await import('./lib/actor-output.mjs');
        actorOutputRoute = routing.isActorOutputRoute(aoState, validateManifestFile(aoState.manifestPath, { root: targetDir }).verdict);
      } catch { /* doctor treats a validator that throws as the legacy route */ }
    }
    const plan = routing.planPortalReviewers({ targetDir, portalType: routing.readPortalType(ymlText ?? '').value, actorOutputRoute });
    const why = {
      skip: 'the actor-output manifest is the contract (decisions/05)',
      bespoke: 'portal_type: bespoke — its gate is a divergence ADR, checked by `blueprint doctor`',
    };
    for (const name of routing.PORTAL_REVIEWERS) {
      if (plan.run.includes(name)) continue;
      const initiative = name === routing.INITIATIVE_PORTAL_REVIEWER;
      const state = initiative ? plan.initiative : plan.reviewPortal;
      portalNotRun.push(`${name} — ${why[state] ?? (initiative ? 'no apps/portal' : 'no Review Portal directory')}`);
    }
    toRun = toRun.filter((f) => {
      const name = f.replace(/\.mjs$/, '');
      return !routing.PORTAL_REVIEWERS.includes(name) || plan.run.includes(name);
    });
  } catch (e) {
    portalNotRun.push(`none skipped: tools/lib/portal-reviewer-routing.mjs could not load (${e.message}), so every portal reviewer runs. Copy it from $BLUEPRINT_HOME/template/tools/lib/.`);
  }
}

const executableNames = new Set(allNames);
const specOnly = roster
  ? (SPEC_ONLY_BY_VARIANT[variant] || [])
  : mdFiles.map((f) => f.replace(/\.md$/, '')).filter((n) => n !== 'README' && !executableNames.has(n));

const RANK = { PASS: 0, INFO: 0, SKIP: 0, WARN: 1, BLOCKED: 2, ERROR: 2 };
let worst = 'PASS';
const results = [];

for (const f of toRun) {
  const name = f.replace(/\.mjs$/, '');
  let mod;
  try {
    mod = await import(pathToFileURL(path.join(reviewersDir, f)).href);
  } catch (e) {
    results.push({ name, status: 'ERROR', detail: `import failed: ${e.message}`, findings: [] });
    worst = 'ERROR';
    continue;
  }
  if (typeof mod.default !== 'function') continue;
  try {
    const r = (await mod.default({ targetDir, blueprintYml })) || {};
    const status = r.status || 'PASS';
    results.push({ name, status, findings: r.findings || [] });
    if (RANK[status] > RANK[worst]) worst = status;
  } catch (e) {
    results.push({ name, status: 'ERROR', detail: e.message, findings: [] });
    worst = 'ERROR';
  }
}

console.log(`\nBlueprint reviewers — variant=${variant} — executable run against ${path.basename(targetDir)}\n`);
for (const res of results) {
  const blocks = (res.findings || []).filter((x) => x.severity === 'BLOCK');
  const warns = (res.findings || []).filter((x) => x.severity === 'WARN');
  const tags = [blocks.length ? `${blocks.length} block` : '', warns.length ? `${warns.length} warn` : '']
    .filter(Boolean)
    .join(', ');
  console.log(`  [${res.status.padEnd(7)}] ${res.name}${res.detail ? ` — ${res.detail}` : ''}${tags ? `  (${tags})` : ''}`);
  for (const b of blocks) console.log(`            BLOCK  ${b.location}: ${b.message}`);
  for (const w of warns) console.log(`            WARN   ${w.location}: ${w.message}`);
}

if (specOnly.length) {
  console.log(`\n  Agent-run gates (spec-only, NOT executed here — run via your agent harness):`);
  for (const n of specOnly) console.log(`    - ${n}`);
  console.log(`  A green run above is NOT full coverage until these judgment gates run.`);
}
if (skipped.length) {
  console.log(`\n  Not applicable to variant=${variant} (skipped): ${skipped.join(', ')}`);
}
if (portalNotRun.length) {
  console.log(`\n  Portal gates not run here (the same rule \`blueprint doctor\` uses):`);
  for (const n of portalNotRun) console.log(`    - ${n}`);
}
console.log('');
process.exit(worst === 'BLOCKED' || worst === 'ERROR' ? 1 : 0);
