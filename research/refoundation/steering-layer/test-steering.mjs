#!/usr/bin/env node

import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SteeringPacketError,
  evaluateFile,
  evaluatePacket,
  resultJson,
  resultMarkdown,
} from './steering.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, 'fixtures');
const expected = JSON.parse(readFileSync(join(fixtureDir, 'expected.json'), 'utf8'));
let failures = 0;
let assertions = 0;

function check(condition, label) {
  assertions += 1;
  if (condition) {
    process.stdout.write(`ok ${label}\n`);
  } else {
    failures += 1;
    process.stderr.write(`not ok ${label}\n`);
  }
}

function equal(actual, expectedValue, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expectedValue);
  check(
    actualJson === expectedJson,
    actualJson === expectedJson ? label : `${label} — expected ${expectedJson}, got ${actualJson}`,
  );
}

function readinessFor(result, claim) {
  return result.encounter_readiness.find((item) => item.claim === claim);
}

const validResults = new Map();
for (const [fixture, wanted] of Object.entries(expected)) {
  const result = evaluateFile(join(fixtureDir, fixture));
  validResults.set(fixture, result);
  equal(result.next_recipe.id, wanted.recipe, `${fixture} selects ${wanted.recipe}`);
  equal(result.longitudinal.active_claims, wanted.active_claims, `${fixture} active claim count`);
  equal(result.longitudinal.historical_claims, wanted.historical_claims, `${fixture} historical claim count`);
  equal(result.operator_touch_budget.used, wanted.touches_used, `${fixture} touch count`);
  equal(result.operator_touch_budget.exceeded, wanted.touch_budget_exceeded, `${fixture} touch budget`);
  equal(result.longitudinal.unresolved_clusters, wanted.unresolved_clusters, `${fixture} unresolved cluster count`);

  const firstJson = resultJson(result);
  const secondJson = resultJson(evaluateFile(join(fixtureDir, fixture)));
  equal(firstJson, secondJson, `${fixture} JSON is deterministic`);
  check(!/(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/.test(firstJson), `${fixture} output has no absolute user path`);
  check(resultMarkdown(result).includes('Generated view. Do not edit'), `${fixture} markdown marks generated ownership`);
}

equal(
  readinessFor(validResults.get('film-room-longitudinal.json'), 'founder-live-workflow')?.blockers,
  expected['film-room-longitudinal.json'].founder_blockers,
  'Film Room founder readiness names the preregistered blocker',
);
equal(
  readinessFor(validResults.get('bc-readiness.json'), 'receiving-team-accepts')?.blockers,
  expected['bc-readiness.json'].receiver_blockers,
  'BC receiving encounter names stale and absent prerequisites',
);
check(
  validResults.get('film-room-longitudinal.json').active_projection.history_summary.total === 3,
  'active projection retains Film Room historical count',
);
check(
  Object.keys(validResults.get('film-room-longitudinal.json').active_projection.history_summary.by_revision).length === 3,
  'active projection retains Film Room historical revisions',
);

const invalidExpectations = {
  'duplicate-claim.json': 'duplicate claim id same',
  'unknown-dependency.json': 'depends on unknown claim missing',
  'unknown-journey.json': 'references unknown journey missing',
  'negative-budget.json': 'operator_touch_budget.max must be a non-negative integer',
};
for (const [fixture, message] of Object.entries(invalidExpectations)) {
  const path = join(fixtureDir, 'invalid', fixture);
  let caught = null;
  try {
    evaluateFile(path);
  } catch (error) {
    caught = error;
  }
  check(caught instanceof SteeringPacketError, `${fixture} is rejected`);
  check(caught?.message.includes(message), `${fixture} reports ${message}`);
  check(new RegExp(`${fixture}:\\d+:`).test(caught?.message ?? ''), `${fixture} diagnostic cites a source line`);
}

const filmPacket = JSON.parse(readFileSync(join(fixtureDir, 'film-room-longitudinal.json'), 'utf8'));
filmPacket.dispositions.push({
  id: 'journey-audit-completed',
  kind: 'holistic-audit',
  status: 'completed',
  journey: 'founder-event',
  covers_incidents: filmPacket.incidents.map((incident) => incident.id),
});
const closedClusterResult = evaluatePacket(filmPacket);
equal(closedClusterResult.longitudinal.unresolved_clusters, 0, 'completed holistic disposition closes the incident cluster');
equal(closedClusterResult.next_recipe.id, 'repair-or-revise', 'closed cluster reveals the current contradicted prerequisite');

function readyHumanPacket({ max, touches }) {
  return {
    schema: 'blueprint-steering/0',
    initiative: 'bounded-human-encounter',
    as_of: '2026-07-23T21:00:00Z',
    current_revision: 'one',
    outcome: 'A human observes the exact bounded outcome.',
    operator_touch_budget: { max },
    claims: [
      {
        id: 'machine-ready',
        state: 'satisfied',
        kind: 'machine',
        active: true,
        revision: 'one',
        needs: [],
      },
      {
        id: 'human-outcome',
        state: 'open',
        kind: 'human',
        active: true,
        revision: 'one',
        needs: ['machine-ready'],
      },
    ],
    journeys: [
      {
        id: 'bounded-journey',
        outcome_claim: 'human-outcome',
        steps: ['machine-ready', 'human-outcome'],
        human_claims: ['human-outcome'],
        cluster_threshold: 2,
      },
    ],
    incidents: [],
    dispositions: [],
    operator_touches: touches,
  };
}

equal(
  evaluatePacket(readyHumanPacket({ max: 1, touches: [] })).next_recipe.id,
  'run-bounded-encounter',
  'ready human claim within budget selects bounded encounter',
);

const hiddenDependencyPacket = readyHumanPacket({ max: 1, touches: [] });
hiddenDependencyPacket.claims.splice(1, 0, {
  id: 'machine-not-shown-in-journey',
  state: 'open',
  kind: 'machine',
  active: true,
  revision: 'one',
  needs: [],
});
hiddenDependencyPacket.claims.find((claim) => claim.id === 'human-outcome').needs = [
  'machine-ready',
  'machine-not-shown-in-journey',
];
equal(
  readinessFor(evaluatePacket(hiddenDependencyPacket), 'human-outcome')?.blockers,
  ['machine-not-shown-in-journey'],
  'human readiness includes declared dependencies omitted from the displayed journey',
);
equal(
  evaluatePacket(readyHumanPacket({
    max: 1,
    touches: [
      {
        id: 'touch-one',
        journey: 'bounded-journey',
        purpose: 'prior-attempt',
        required_claim: 'human-outcome',
        result: 'open',
      },
    ],
  })).next_recipe.id,
  'request-budget-disposition',
  'ready human claim at budget limit requests disposition',
);

const unsafePacket = readyHumanPacket({ max: 1, touches: [] });
unsafePacket.outcome = 'Read /Users/example/private.txt';
let unsafeError = null;
try {
  evaluatePacket(unsafePacket, {
    source: JSON.stringify(unsafePacket, null, 2),
    path: join(fixtureDir, 'unsafe-dynamic.json'),
  });
} catch (error) {
  unsafeError = error;
}
check(unsafeError instanceof SteeringPacketError, 'absolute user path is rejected');

const evaluatorSource = readFileSync(join(here, 'steering.mjs'), 'utf8');
check(
  !/(film-room|fleet-observability|bc-subscriptions|claude|codex)/i.test(evaluatorSource),
  'evaluator contains no consumer-specific or runtime-vendor rule',
);

const tempRoot = mkdtempSync(join(tmpdir(), 'blueprint-steering-test-'));
try {
  const outputA = join(tempRoot, 'a.json');
  const outputB = join(tempRoot, 'b.json');
  writeFileSync(outputA, resultJson(validResults.get('self-dogfood-initial.json')), 'utf8');
  writeFileSync(outputB, resultJson(evaluateFile(join(fixtureDir, 'self-dogfood-initial.json'))), 'utf8');
  equal(readFileSync(outputA, 'utf8'), readFileSync(outputB, 'utf8'), 'deleted-output rebuild is byte-deterministic');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

if (failures > 0) {
  process.stderr.write(`\nFAIL steering-layer self-test (${failures} failures, ${assertions} assertions).\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\nPASS steering-layer self-test (${assertions} assertions).\n`);
}
