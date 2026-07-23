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

function actionFor(result, target) {
  return result.next_actions.find((item) => item.target === target);
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
equal(
  actionFor(validResults.get('headless-machine.json'), 'local-feasibility-evidence')?.mode,
  'agent-autonomous',
  'headless machine work defaults to agent-autonomous',
);
equal(
  actionFor(validResults.get('headless-machine.json'), 'local-feasibility-evidence')?.venue,
  'current-harness',
  'headless machine work remains in the current harness',
);
equal(
  actionFor(validResults.get('headless-machine.json'), 'local-feasibility-evidence')?.handoff_required,
  false,
  'headless machine work requires no handoff',
);
equal(
  actionFor(
    validResults.get('headless-operator-external.json'),
    'operator-observes-sandbox-install',
  )?.venue,
  'BigCommerce sandbox control panel',
  'external operator route names its exact venue',
);
equal(
  actionFor(
    validResults.get('headless-operator-external.json'),
    'operator-observes-sandbox-install',
  )?.handoff_required,
  true,
  'external operator route requires a handoff',
);
equal(
  actionFor(
    validResults.get('headless-operator-external.json'),
    'operator-observes-sandbox-install',
  )?.capture,
  'feedback/sandbox-install-result.md',
  'external operator route names its capture destination',
);
equal(
  actionFor(
    validResults.get('headless-operator-external.json'),
    'operator-observes-sandbox-install',
  )?.resume_when,
  'the install result is captured at the exact candidate revision',
  'external operator route names its resume condition',
);

const invalidExpectations = {
  'duplicate-claim.json': 'duplicate claim id same',
  'unknown-dependency.json': 'depends on unknown claim missing',
  'unknown-journey.json': 'references unknown journey missing',
  'negative-budget.json': 'operator_touch_budget.max must be a non-negative integer',
  'missing-execution-route.json': 'active human claim human-outcome requires an execution route',
  'duplicate-execution-route.json': 'duplicate execution route for claim human-outcome',
  'unsupported-execution-mode.json': 'execution route human-outcome has unsupported mode telepathy',
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
equal(
  actionFor(evaluatePacket(readyHumanPacket({ max: 1, touches: [] })), 'human-outcome')?.route_source,
  'legacy-unspecified',
  'version-0 human work remains valid but exposes its unspecified legacy route',
);

const nonBlockingHumanPacket = readyHumanPacket({ max: 1, touches: [] });
nonBlockingHumanPacket.schema = 'blueprint-steering/1';
nonBlockingHumanPacket.claims.splice(1, 0, {
  id: 'local-machine-work',
  state: 'open',
  kind: 'machine',
  active: true,
  revision: 'one',
  needs: [],
});
nonBlockingHumanPacket.execution_routes = [
  {
    claim: 'human-outcome',
    mode: 'operator-external',
    owner: 'operator',
    authority: 'perform the bounded observation',
    venue: 'named external system',
    action: 'Perform the bounded observation.',
    artifact: 'research/encounter.md',
    capture: 'feedback/encounter.md',
    resume_when: 'the observation is captured',
    blocking: false,
  },
];
equal(
  evaluatePacket(nonBlockingHumanPacket).next_recipe.targets,
  ['local-machine-work'],
  'ready non-blocking human work does not interrupt remaining autonomous work',
);

function nestedHumanBoundaryPacket() {
  return {
    schema: 'blueprint-steering/1',
    initiative: 'nested-human-boundary',
    as_of: '2026-07-23T22:40:35Z',
    current_revision: 'frontier-v1',
    outcome: 'The final decision follows an exact sandbox observation.',
    operator_touch_budget: { max: 2 },
    claims: [
      {
        id: 'local-proof',
        state: 'satisfied',
        kind: 'machine',
        active: true,
        revision: 'frontier-v1',
        needs: [],
      },
      {
        id: 'sandbox-auth',
        state: 'open',
        kind: 'human',
        active: true,
        revision: 'frontier-v1',
        needs: ['local-proof'],
      },
      {
        id: 'sandbox-inspection',
        state: 'open',
        kind: 'machine',
        active: true,
        revision: 'frontier-v1',
        needs: ['sandbox-auth'],
      },
      {
        id: 'final-acceptance',
        state: 'open',
        kind: 'human',
        active: true,
        revision: 'frontier-v1',
        needs: ['sandbox-inspection'],
      },
    ],
    journeys: [
      {
        id: 'sandbox-to-decision',
        outcome_claim: 'final-acceptance',
        steps: [
          'local-proof',
          'sandbox-auth',
          'sandbox-inspection',
          'final-acceptance',
        ],
        human_claims: ['sandbox-auth', 'final-acceptance'],
        cluster_threshold: 2,
      },
    ],
    incidents: [],
    dispositions: [],
    operator_touches: [],
    execution_routes: [
      {
        claim: 'sandbox-auth',
        mode: 'operator-external',
        owner: 'operator',
        authority: 'authenticate to the bounded sandbox',
        venue: 'named sandbox',
        action: 'Authenticate and return.',
        artifact: 'docs/sandbox.md',
        capture: 'research/sandbox.md',
        resume_when: 'the authenticated context is available',
        blocking: true,
      },
      {
        claim: 'final-acceptance',
        mode: 'operator-inline',
        owner: 'operator',
        authority: 'accept or reject the exact evidence',
        venue: 'current task',
        action: 'Review the exact evidence.',
        artifact: 'docs/decision.md',
        capture: 'decisions/disposition.md',
        resume_when: 'the disposition is captured',
        blocking: true,
      },
    ],
  };
}

const nestedHumanResult = evaluatePacket(nestedHumanBoundaryPacket());
equal(
  nestedHumanResult.next_recipe.id,
  'run-bounded-encounter',
  'ready nested human boundary selects bounded encounter',
);
equal(
  nestedHumanResult.next_recipe.targets,
  ['sandbox-auth'],
  'nested boundary targets only the current actionable human claim',
);
equal(
  nestedHumanResult.next_actions.map((action) => action.mode),
  ['operator-external'],
  'nested boundary emits only the authored external route',
);

const postAuthenticationPacket = nestedHumanBoundaryPacket();
postAuthenticationPacket.claims.find((claim) => claim.id === 'sandbox-auth').state = 'satisfied';
equal(
  evaluatePacket(postAuthenticationPacket).next_recipe.targets,
  ['sandbox-inspection'],
  'satisfied nested human boundary reveals only the next machine frontier',
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

const staleHumanPacket = readyHumanPacket({ max: 1, touches: [] });
staleHumanPacket.claims.find((claim) => claim.id === 'human-outcome').state = 'stale';
equal(
  evaluatePacket(staleHumanPacket).next_recipe.id,
  'run-bounded-encounter',
  'ready stale human evidence selects a bounded re-observation instead of hold',
);

const unresolvedMachinePacket = readyHumanPacket({ max: 1, touches: [] });
unresolvedMachinePacket.claims = [{
  id: 'machine-ready',
  state: 'unobservable',
  kind: 'machine',
  active: true,
  revision: 'one',
  needs: [],
}];
unresolvedMachinePacket.journeys = [];
equal(
  evaluatePacket(unresolvedMachinePacket).next_recipe.id,
  'implement-or-verify',
  'unobservable active machine claim selects implementation or verification instead of hold',
);

const invalidatedMachinePacket = structuredClone(unresolvedMachinePacket);
invalidatedMachinePacket.claims[0].state = 'invalidated';
equal(
  evaluatePacket(invalidatedMachinePacket).next_recipe.id,
  'repair-or-revise',
  'invalidated active claim selects repair or revision instead of hold',
);

const unusualDecisionPacket = structuredClone(unresolvedMachinePacket);
unusualDecisionPacket.claims[0].kind = 'decision';
unusualDecisionPacket.claims[0].state = 'stale';
equal(
  evaluatePacket(unusualDecisionPacket).next_recipe.id,
  'repair-or-revise',
  'unmapped unresolved active state falls back to repair or revision instead of hold',
);

const satisfiedPacket = structuredClone(unresolvedMachinePacket);
satisfiedPacket.claims[0].state = 'satisfied';
equal(
  evaluatePacket(satisfiedPacket).next_recipe.id,
  'hold',
  'hold is selected only when no active claim is unresolved',
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
