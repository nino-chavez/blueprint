// portal-reviewer-routing.mjs — which portal conformance reviewers apply to an
// initiative. One owner for `blueprint doctor` (checks 2b, 6, 6b) and the
// stamped tools/run-reviewers.mjs, so the two cannot disagree about which
// portal gates an initiative faces (decisions/11, wave 113). Before this, the
// runner ran all three portal reviewers on every non-research stamp: an
// Initiative Portal stamp got 11 BLOCKs from the two Review Portal gates.
//
// Dependency-free ESM. Never throws.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { invokedDirectly } from './invoked-directly.mjs';
import { readTopLevelYamlScalar } from './yaml-scalar.mjs';

export const INITIATIVE_PORTAL_REVIEWER = 'portal-initiative-conformance-reviewer';
export const REVIEW_PORTAL_REVIEWERS = ['portal-chrome-canonical-reviewer', 'portal-review-conformance-reviewer'];
export const PORTAL_REVIEWERS = [INITIATIVE_PORTAL_REVIEWER, ...REVIEW_PORTAL_REVIEWERS];

// portal_type (wave 72), else the deprecated portal_pattern with A/B mapped to
// the current names. `legacy` is true when only portal_pattern is declared.
export function readPortalType(ymlText) {
  const current = readTopLevelYamlScalar(ymlText, 'portal_type');
  if (current) return { value: current.toLowerCase(), legacy: false };
  const legacy = readTopLevelYamlScalar(ymlText, 'portal_pattern');
  if (!legacy) return { value: null, legacy: false };
  const value = legacy.toLowerCase();
  return { value: value === 'a' ? 'initiative' : value === 'b' ? 'review' : value, legacy: true };
}

// A Review Portal is a directory with chrome: index.html plus the page manifest
// or the nav script (wave 86). A bare index.html is not one.
export function findReviewPortalRoot(targetDir) {
  return ['portal', join('blueprint', 'portal')].find((rel) =>
    existsSync(join(targetDir, rel, 'index.html'))
    && (existsSync(join(targetDir, rel, '_meta', 'index.json')) || existsSync(join(targetDir, rel, 'proto-nav.js')))) ?? null;
}

// decisions/05 dual-validation shim. An actor-output.yml at the root routes
// output validation to the manifest. Declaring a legacy portal key as well is
// ambiguous authority unless blueprint.yml says `migration: actor-output`.
export function readActorOutputState(targetDir) {
  const manifestPath = join(targetDir, 'actor-output.yml');
  if (!existsSync(manifestPath)) return { manifest: false, manifestPath, hasLegacyKey: false, ambiguous: false };
  let ymlText = '';
  try { ymlText = readFileSync(join(targetDir, 'blueprint.yml'), 'utf8'); } catch { /* absent: no legacy key */ }
  const hasLegacyKey = readTopLevelYamlScalar(ymlText, 'portal_type') != null
    || readTopLevelYamlScalar(ymlText, 'portal_pattern') != null;
  const migrationMode = readTopLevelYamlScalar(ymlText, 'migration') === 'actor-output';
  return { manifest: true, manifestPath, hasLegacyKey, ambiguous: hasLegacyKey && !migrationMode };
}

// The manifest is the contract once it exists, is unambiguous, and did not
// validate BLOCKED. `verdict` comes from actor-output.mjs validateManifestFile;
// a caller whose validation threw has no verdict and stays on the legacy route.
export function isActorOutputRoute(state, verdict) {
  return Boolean(state && state.manifest && !state.ambiguous && verdict !== 'BLOCKED');
}

// Which portal reviewers run. `initiative` and `reviewPortal` are each:
//   'run'     — run the reviewer(s)
//   'skip'    — the actor-output manifest is the contract (Initiative Portal only;
//               the Review Portal reviewers are renderer checks and keep running)
//   'bespoke' — portal_type: bespoke; the gate is a divergence ADR, not a reviewer
//   'absent'  — no such portal on disk
export function planPortalReviewers({ targetDir, portalType, actorOutputRoute }) {
  const hasInitiativePortal = existsSync(join(targetDir, 'apps', 'portal'));
  const reviewPortalRoot = findReviewPortalRoot(targetDir);
  let initiative = 'absent';
  if (hasInitiativePortal) initiative = actorOutputRoute ? 'skip' : portalType === 'bespoke' ? 'bespoke' : 'run';
  let reviewPortal = 'absent';
  if (reviewPortalRoot) reviewPortal = portalType === 'bespoke' && !actorOutputRoute ? 'bespoke' : 'run';
  const run = [
    ...(initiative === 'run' ? [INITIATIVE_PORTAL_REVIEWER] : []),
    ...(reviewPortal === 'run' ? REVIEW_PORTAL_REVIEWERS : []),
  ];
  return { hasInitiativePortal, reviewPortalRoot, initiative, reviewPortal, run };
}

function selftest() {
  let assertions = 0;
  const ok = (condition, label) => {
    assertions++;
    if (!condition) {
      console.error(`FAIL: ${label}`);
      process.exit(1);
    }
  };
  const root = mkdtempSync(join(tmpdir(), 'portal-routing-'));
  const fixture = (name, files) => {
    const dir = join(root, name);
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(join(dir, rel, '..'), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    mkdirSync(dir, { recursive: true });
    return dir;
  };
  try {
    ok(readPortalType('portal_type: Review\n').value === 'review', 'portal_type read and lowercased');
    const legacy = readPortalType('portal_pattern: A\n');
    ok(legacy.value === 'initiative' && legacy.legacy, 'legacy portal_pattern A maps to initiative');
    ok(readPortalType('variant: research\n').value === null, 'no portal key → null');

    const empty = fixture('empty', {});
    const none = planPortalReviewers({ targetDir: empty, portalType: 'initiative', actorOutputRoute: false });
    ok(none.initiative === 'absent' && none.reviewPortal === 'absent' && none.run.length === 0, 'no portal on disk → nothing runs');

    const a = fixture('a', { 'apps/portal/package.json': '{}' });
    ok(planPortalReviewers({ targetDir: a, portalType: 'initiative', actorOutputRoute: true }).initiative === 'skip', 'actor-output route skips the Initiative Portal reviewer');
    ok(planPortalReviewers({ targetDir: a, portalType: 'initiative', actorOutputRoute: false }).run.join() === INITIATIVE_PORTAL_REVIEWER, 'legacy route runs only the Initiative Portal reviewer');
    ok(planPortalReviewers({ targetDir: a, portalType: 'bespoke', actorOutputRoute: false }).initiative === 'bespoke', 'bespoke apps/portal gates on the ADR');

    const bare = fixture('bare', { 'portal/index.html': '<html>' });
    ok(findReviewPortalRoot(bare) === null, 'index.html without chrome markers is not a Review Portal');
    const b = fixture('b', { 'blueprint/portal/index.html': '<html>', 'blueprint/portal/_meta/index.json': '{}' });
    ok(findReviewPortalRoot(b) === join('blueprint', 'portal'), 'blueprint/portal with a manifest is a Review Portal');
    const bPlan = planPortalReviewers({ targetDir: b, portalType: 'review', actorOutputRoute: true });
    ok(bPlan.reviewPortal === 'run' && bPlan.run.join() === REVIEW_PORTAL_REVIEWERS.join(), 'Review Portal reviewers run even on the actor-output route');
    ok(planPortalReviewers({ targetDir: b, portalType: 'bespoke', actorOutputRoute: false }).reviewPortal === 'bespoke', 'bespoke Review Portal tree gates on the ADR');
    ok(planPortalReviewers({ targetDir: b, portalType: 'bespoke', actorOutputRoute: true }).reviewPortal === 'run', 'bespoke on the actor-output route still runs renderer checks');

    ok(readActorOutputState(empty).manifest === false, 'no manifest → no actor-output state');
    const ambiguous = fixture('ambiguous', { 'actor-output.yml': 'initiative: x\n', 'blueprint.yml': 'portal_type: initiative\n' });
    ok(readActorOutputState(ambiguous).ambiguous === true, 'manifest + portal_type without migration key is ambiguous');
    const migrating = fixture('migrating', { 'actor-output.yml': 'initiative: x\n', 'blueprint.yml': 'portal_type: initiative\nmigration: actor-output\n' });
    const state = readActorOutputState(migrating);
    ok(state.ambiguous === false && state.hasLegacyKey, 'migration key sanctions the dual state');
    ok(isActorOutputRoute(state, 'PASS') && isActorOutputRoute(state, 'PENDING'), 'PASS and PENDING manifests engage the route');
    ok(!isActorOutputRoute(state, 'BLOCKED'), 'a BLOCKED manifest falls back to the legacy route');
    ok(!isActorOutputRoute(readActorOutputState(ambiguous), 'PASS'), 'an ambiguous declaration never engages the route');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  console.log(`portal-reviewer-routing self-test: PASS (${assertions} assertions)`);
}

if (
  invokedDirectly(import.meta.url)
  && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))
) {
  selftest();
}
