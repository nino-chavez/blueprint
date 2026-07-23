#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'blueprint-steering/0';
const CLAIM_STATES = new Set([
  'satisfied',
  'open',
  'contradicted',
  'stale',
  'unobservable',
  'invalidated',
]);
const CLAIM_KINDS = new Set(['machine', 'human', 'decision']);
const COMPLETED_DISPOSITIONS = new Set(['accepted', 'completed']);
const ABSOLUTE_USER_PATH = /(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/;

export class SteeringPacketError extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.name = 'SteeringPacketError';
    this.errors = errors;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function displayPath(path) {
  const rel = relative(process.cwd(), path);
  return rel && !rel.startsWith('..') ? rel : path;
}

function sourceLine(source, needle, occurrence = 1) {
  const lines = source.split(/\r?\n/);
  let seen = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].includes(needle)) {
      seen += 1;
      if (seen === occurrence) return index + 1;
    }
  }
  return 1;
}

function diagnostic(path, source, needle, message, occurrence = 1) {
  return `${displayPath(path)}:${sourceLine(source, needle, occurrence)}: ${message}`;
}

function duplicateIds(items) {
  const counts = new Map();
  for (const item of items) {
    if (!isObject(item) || typeof item.id !== 'string') continue;
    counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
}

function detectDependencyCycle(claimsById) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) return id;
    if (visited.has(id)) return null;
    visiting.add(id);
    const claim = claimsById.get(id);
    for (const dependency of claim?.needs ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const id of claimsById.keys()) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
}

export function validatePacket(packet, { source = '', path = '<packet>' } = {}) {
  const errors = [];
  const add = (needle, message, occurrence) => {
    errors.push(diagnostic(path, source, needle, message, occurrence));
  };

  if (!isObject(packet)) {
    add('{', 'packet must be a JSON object');
    return errors;
  }

  if (packet.schema !== SCHEMA) {
    add('"schema"', `unsupported schema ${String(packet.schema)}; expected ${SCHEMA}`);
  }
  for (const field of ['initiative', 'as_of', 'current_revision', 'outcome']) {
    if (typeof packet[field] !== 'string' || !packet[field].trim()) {
      add(`"${field}"`, `${field} must be a non-empty string`);
    }
  }

  if (!isObject(packet.operator_touch_budget)
      || !Number.isInteger(packet.operator_touch_budget.max)
      || packet.operator_touch_budget.max < 0) {
    add('"operator_touch_budget"', 'operator_touch_budget.max must be a non-negative integer');
  }

  for (const field of ['claims', 'journeys', 'incidents', 'dispositions', 'operator_touches']) {
    if (!Array.isArray(packet[field])) add(`"${field}"`, `${field} must be an array`);
  }
  if (errors.length > 0) return errors;

  if (ABSOLUTE_USER_PATH.test(JSON.stringify(packet))) {
    add('{', 'packet contains an absolute user path; use repository-relative or sanitized evidence');
  }

  for (const id of duplicateIds(packet.claims)) {
    add(`"id": "${id}"`, `duplicate claim id ${id}`, 2);
  }
  for (const id of duplicateIds(packet.journeys)) {
    add(`"id": "${id}"`, `duplicate journey id ${id}`, 2);
  }
  for (const id of duplicateIds(packet.incidents)) {
    add(`"id": "${id}"`, `duplicate incident id ${id}`, 2);
  }
  for (const id of duplicateIds(packet.dispositions)) {
    add(`"id": "${id}"`, `duplicate disposition id ${id}`, 2);
  }
  for (const id of duplicateIds(packet.operator_touches)) {
    add(`"id": "${id}"`, `duplicate operator touch id ${id}`, 2);
  }

  const claimsById = new Map();
  for (const claim of packet.claims) {
    if (!isObject(claim) || typeof claim.id !== 'string' || !claim.id) {
      add('"claims"', 'every claim requires a non-empty id');
      continue;
    }
    if (!claimsById.has(claim.id)) claimsById.set(claim.id, claim);
    if (!CLAIM_STATES.has(claim.state)) {
      add(`"id": "${claim.id}"`, `claim ${claim.id} has unsupported state ${String(claim.state)}`);
    }
    if (!CLAIM_KINDS.has(claim.kind)) {
      add(`"id": "${claim.id}"`, `claim ${claim.id} has unsupported kind ${String(claim.kind)}`);
    }
    if (typeof claim.active !== 'boolean') {
      add(`"id": "${claim.id}"`, `claim ${claim.id} active must be boolean`);
    }
    if (typeof claim.revision !== 'string' || !claim.revision) {
      add(`"id": "${claim.id}"`, `claim ${claim.id} requires a revision`);
    }
    if (!Array.isArray(claim.needs)) {
      add(`"id": "${claim.id}"`, `claim ${claim.id} needs must be an array`);
    }
  }

  for (const claim of packet.claims) {
    if (!isObject(claim) || !Array.isArray(claim.needs)) continue;
    for (const dependency of claim.needs) {
      if (!claimsById.has(dependency)) {
        add(`"${dependency}"`, `claim ${claim.id} depends on unknown claim ${dependency}`);
      }
    }
  }
  const cycle = detectDependencyCycle(claimsById);
  if (cycle) add(`"id": "${cycle}"`, `claim dependency cycle includes ${cycle}`);

  const journeysById = new Map();
  for (const journey of packet.journeys) {
    if (!isObject(journey) || typeof journey.id !== 'string' || !journey.id) {
      add('"journeys"', 'every journey requires a non-empty id');
      continue;
    }
    if (!journeysById.has(journey.id)) journeysById.set(journey.id, journey);
    if (!claimsById.has(journey.outcome_claim)) {
      add(`"id": "${journey.id}"`, `journey ${journey.id} references unknown outcome claim ${String(journey.outcome_claim)}`);
    }
    if (!Array.isArray(journey.steps) || journey.steps.length === 0) {
      add(`"id": "${journey.id}"`, `journey ${journey.id} requires ordered steps`);
    } else {
      for (const step of journey.steps) {
        if (!claimsById.has(step)) {
          add(`"${step}"`, `journey ${journey.id} references unknown step claim ${step}`);
        }
      }
    }
    if (!Array.isArray(journey.human_claims)) {
      add(`"id": "${journey.id}"`, `journey ${journey.id} human_claims must be an array`);
    } else {
      for (const claimId of journey.human_claims) {
        if (!journey.steps?.includes(claimId)) {
          add(`"${claimId}"`, `journey ${journey.id} human claim ${claimId} is not an ordered step`);
        } else if (claimsById.get(claimId)?.kind !== 'human') {
          add(`"${claimId}"`, `journey ${journey.id} human claim ${claimId} is not kind human`);
        }
      }
    }
    if (!Number.isInteger(journey.cluster_threshold) || journey.cluster_threshold < 2) {
      add(`"id": "${journey.id}"`, `journey ${journey.id} cluster_threshold must be an integer of at least 2`);
    }
  }

  for (const incident of packet.incidents) {
    if (!isObject(incident) || typeof incident.id !== 'string' || !incident.id) {
      add('"incidents"', 'every incident requires a non-empty id');
      continue;
    }
    if (!journeysById.has(incident.journey)) {
      add(`"journey": "${String(incident.journey)}"`, `incident ${incident.id} references unknown journey ${String(incident.journey)}`);
    }
    if (!claimsById.has(incident.claim)) {
      add(`"claim": "${String(incident.claim)}"`, `incident ${incident.id} references unknown claim ${String(incident.claim)}`);
    }
    for (const field of ['boundary', 'classification', 'revision']) {
      if (typeof incident[field] !== 'string' || !incident[field]) {
        add(`"id": "${incident.id}"`, `incident ${incident.id} requires ${field}`);
      }
    }
  }

  for (const disposition of packet.dispositions) {
    if (!isObject(disposition) || typeof disposition.id !== 'string' || !disposition.id) {
      add('"dispositions"', 'every disposition requires a non-empty id');
      continue;
    }
    if (!journeysById.has(disposition.journey)) {
      add(`"journey": "${String(disposition.journey)}"`, `disposition ${disposition.id} references unknown journey ${String(disposition.journey)}`);
    }
    if (!Array.isArray(disposition.covers_incidents)) {
      add(`"id": "${disposition.id}"`, `disposition ${disposition.id} covers_incidents must be an array`);
    }
  }

  for (const touch of packet.operator_touches) {
    if (!isObject(touch) || typeof touch.id !== 'string' || !touch.id) {
      add('"operator_touches"', 'every operator touch requires a non-empty id');
      continue;
    }
    if (!journeysById.has(touch.journey)) {
      add(`"journey": "${String(touch.journey)}"`, `operator touch ${touch.id} references unknown journey ${String(touch.journey)}`);
    }
    if (!claimsById.has(touch.required_claim)) {
      add(`"required_claim": "${String(touch.required_claim)}"`, `operator touch ${touch.id} references unknown claim ${String(touch.required_claim)}`);
    }
    for (const field of ['purpose', 'result']) {
      if (typeof touch[field] !== 'string' || !touch[field]) {
        add(`"id": "${touch.id}"`, `operator touch ${touch.id} requires ${field}`);
      }
    }
  }

  return errors;
}

function countBy(items, keyOf) {
  const counts = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function dependencyBlockers(claim, claimsById) {
  return (claim.needs ?? []).filter((id) => claimsById.get(id)?.state !== 'satisfied');
}

function deriveReadiness(packet, claimsById) {
  const readiness = [];
  for (const journey of packet.journeys) {
    for (const humanClaimId of journey.human_claims) {
      const targetIndex = journey.steps.indexOf(humanClaimId);
      const priorSteps = journey.steps.slice(0, targetIndex);
      const declaredDependencies = claimsById.get(humanClaimId)?.needs ?? [];
      const prerequisites = [...new Set([...priorSteps, ...declaredDependencies])];
      const blockers = prerequisites.filter((id) => claimsById.get(id)?.state !== 'satisfied');
      readiness.push({
        journey: journey.id,
        claim: humanClaimId,
        ready: blockers.length === 0,
        blockers,
      });
    }
  }
  return readiness;
}

function dispositionCovers(disposition, incidentIds) {
  if (disposition.kind !== 'holistic-audit') return false;
  if (!COMPLETED_DISPOSITIONS.has(disposition.status)) return false;
  const covered = new Set(disposition.covers_incidents ?? []);
  return incidentIds.every((id) => covered.has(id));
}

function deriveClusters(packet) {
  const incidentsByJourney = new Map();
  for (const incident of packet.incidents) {
    const list = incidentsByJourney.get(incident.journey) ?? [];
    list.push(incident);
    incidentsByJourney.set(incident.journey, list);
  }

  return packet.journeys.map((journey) => {
    const incidents = incidentsByJourney.get(journey.id) ?? [];
    const incidentIds = incidents.map((incident) => incident.id);
    const thresholdMet = incidents.length >= journey.cluster_threshold;
    const closedBy = thresholdMet
      ? packet.dispositions.find((item) => item.journey === journey.id && dispositionCovers(item, incidentIds))
      : null;
    return {
      journey: journey.id,
      incident_count: incidents.length,
      threshold: journey.cluster_threshold,
      threshold_met: thresholdMet,
      unresolved: thresholdMet && !closedBy,
      incident_ids: incidentIds,
      closed_by: closedBy?.id ?? null,
    };
  });
}

function deriveTouchBudget(packet) {
  const used = packet.operator_touches.length;
  const max = packet.operator_touch_budget.max;
  return {
    max,
    used,
    remaining: Math.max(0, max - used),
    exhausted: used >= max,
    exceeded: used > max,
    touches: packet.operator_touches.map((touch) => ({
      id: touch.id,
      journey: touch.journey,
      purpose: touch.purpose,
      required_claim: touch.required_claim,
      result: touch.result,
    })),
  };
}

function deriveActiveProjection(packet) {
  const active = packet.claims.filter((claim) => claim.active);
  const historical = packet.claims.filter((claim) => !claim.active);
  return {
    current_revision: packet.current_revision,
    active_claims: active.map((claim) => ({
      id: claim.id,
      state: claim.state,
      kind: claim.kind,
      revision: claim.revision,
      needs: claim.needs,
    })),
    history_summary: {
      total: historical.length,
      by_state: countBy(historical, (claim) => claim.state),
      by_revision: countBy(historical, (claim) => claim.revision),
    },
  };
}

function deriveLongitudinal(packet, clusters, touchBudget) {
  const active = packet.claims.filter((claim) => claim.active);
  const historical = packet.claims.filter((claim) => !claim.active);
  const revisions = [...new Set(packet.claims.map((claim) => claim.revision))].sort();
  const baselineLines = packet.source_metrics?.baseline_lines ?? null;
  const currentLines = packet.source_metrics?.current_lines ?? null;
  const lineGrowth = Number.isFinite(baselineLines)
    && Number.isFinite(currentLines)
    && baselineLines > 0
    ? Number((currentLines / baselineLines).toFixed(3))
    : null;

  return {
    claims_total: packet.claims.length,
    active_claims: active.length,
    historical_claims: historical.length,
    revisions,
    incidents: packet.incidents.length,
    unresolved_clusters: clusters.filter((cluster) => cluster.unresolved).length,
    operator_touches: touchBudget.used,
    touch_budget_exceeded: touchBudget.exceeded,
    baseline_lines: baselineLines,
    current_lines: currentLines,
    line_growth_ratio: lineGrowth,
    decision_count: packet.source_metrics?.decision_count ?? null,
  };
}

function selectRecipe(packet, claimsById, readiness, clusters, touchBudget) {
  const active = packet.claims.filter((claim) => claim.active);
  const unresolvedClusters = clusters.filter((cluster) => cluster.unresolved);
  if (unresolvedClusters.length > 0) {
    return {
      id: 'holistic-audit',
      reason: 'Repeated incidents on the same outcome path require a journey-level disposition before another local repair.',
      targets: unresolvedClusters.map((cluster) => cluster.journey),
    };
  }

  const stale = active.filter((claim) => claim.kind === 'machine' && claim.state === 'stale');
  if (stale.length > 0) {
    return {
      id: 'refresh-evidence',
      reason: 'Active machine evidence is stale and must be rederived before downstream work or observation.',
      targets: stale.map((claim) => claim.id),
    };
  }

  const contradicted = active.filter((claim) => claim.state === 'contradicted');
  if (contradicted.length > 0) {
    return {
      id: 'repair-or-revise',
      reason: 'An active prerequisite or outcome is contradicted and requires an explicit repair, revision, waiver, or re-charter.',
      targets: contradicted.map((claim) => claim.id),
    };
  }

  const openHumanReadiness = readiness.filter((item) => claimsById.get(item.claim)?.state === 'open');
  const blockedHuman = openHumanReadiness.filter((item) => !item.ready);
  if (blockedHuman.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'A human outcome is open, but deterministic prerequisites are not satisfied.',
      targets: [...new Set(blockedHuman.flatMap((item) => item.blockers))],
    };
  }

  const readyHuman = openHumanReadiness.filter((item) => item.ready);
  if (readyHuman.length > 0 && touchBudget.exhausted) {
    return {
      id: 'request-budget-disposition',
      reason: 'The human encounter is ready, but the declared operator-touch budget is exhausted.',
      targets: readyHuman.map((item) => item.claim),
    };
  }
  if (readyHuman.length > 0) {
    return {
      id: 'run-bounded-encounter',
      reason: 'Deterministic prerequisites are satisfied and the human outcome is within its touch budget.',
      targets: readyHuman.map((item) => item.claim),
    };
  }

  const openMachine = active.filter((claim) => claim.kind === 'machine' && claim.state === 'open');
  if (openMachine.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'Active machine-checkable claims remain open.',
      targets: openMachine.map((claim) => claim.id),
    };
  }

  const readyDecision = active.filter((claim) => (
    claim.kind === 'decision'
    && claim.state === 'open'
    && dependencyBlockers(claim, claimsById).length === 0
  ));
  if (readyDecision.length > 0) {
    return {
      id: 'record-disposition',
      reason: 'All declared prerequisites are satisfied; an authorized disposition remains open.',
      targets: readyDecision.map((claim) => claim.id),
    };
  }

  const blockedDecision = active.filter((claim) => claim.kind === 'decision' && claim.state === 'open');
  if (blockedDecision.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'A decision remains open behind unsatisfied prerequisites.',
      targets: [...new Set(blockedDecision.flatMap((claim) => dependencyBlockers(claim, claimsById)))],
    };
  }

  return {
    id: 'hold',
    reason: 'No unresolved active claim requires work or observation.',
    targets: [],
  };
}

export function evaluatePacket(packet, context = {}) {
  const errors = validatePacket(packet, context);
  if (errors.length > 0) throw new SteeringPacketError(errors);

  const claimsById = new Map(packet.claims.map((claim) => [claim.id, claim]));
  const readiness = deriveReadiness(packet, claimsById);
  const clusters = deriveClusters(packet);
  const touchBudget = deriveTouchBudget(packet);
  const activeProjection = deriveActiveProjection(packet);
  const recipe = selectRecipe(packet, claimsById, readiness, clusters, touchBudget);
  const longitudinal = deriveLongitudinal(packet, clusters, touchBudget);

  return {
    schema: 'blueprint-steering-result/0',
    initiative: packet.initiative,
    as_of: packet.as_of,
    current_revision: packet.current_revision,
    outcome: packet.outcome,
    status: 'VALID',
    next_recipe: recipe,
    encounter_readiness: readiness,
    incident_clusters: clusters,
    operator_touch_budget: touchBudget,
    active_projection: activeProjection,
    longitudinal,
  };
}

export function evaluateFile(inputPath) {
  const path = resolve(inputPath);
  const source = readFileSync(path, 'utf8');
  let packet;
  try {
    packet = JSON.parse(source);
  } catch (error) {
    throw new SteeringPacketError([
      `${displayPath(path)}:1: invalid JSON: ${error.message}`,
    ]);
  }
  return evaluatePacket(packet, { source, path });
}

export function resultJson(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}

function tableCell(value) {
  return String(value).replaceAll('|', '\\|');
}

export function resultMarkdown(result) {
  const lines = [
    `# Blueprint steering result: ${result.initiative}`,
    '',
    `Derived at the authored boundary \`${result.as_of}\` for revision \`${result.current_revision}\`.`,
    '',
    '## Next recipe',
    '',
    `**${result.next_recipe.id}** — ${result.next_recipe.reason}`,
    '',
    `Targets: ${result.next_recipe.targets.length > 0 ? result.next_recipe.targets.map((item) => `\`${item}\``).join(', ') : 'none'}`,
    '',
    '## Encounter readiness',
    '',
    '| Journey | Human claim | Ready | Blockers |',
    '|---|---|---:|---|',
  ];

  if (result.encounter_readiness.length === 0) {
    lines.push('| — | — | — | none |');
  } else {
    for (const item of result.encounter_readiness) {
      lines.push(`| ${tableCell(item.journey)} | \`${tableCell(item.claim)}\` | ${item.ready ? 'yes' : 'no'} | ${item.blockers.length > 0 ? item.blockers.map((id) => `\`${tableCell(id)}\``).join(', ') : 'none'} |`);
    }
  }

  lines.push(
    '',
    '## Incident clusters',
    '',
    '| Journey | Incidents | Threshold | Unresolved | Closed by |',
    '|---|---:|---:|---:|---|',
  );
  if (result.incident_clusters.length === 0) {
    lines.push('| — | 0 | — | no | — |');
  } else {
    for (const cluster of result.incident_clusters) {
      lines.push(`| ${tableCell(cluster.journey)} | ${cluster.incident_count} | ${cluster.threshold} | ${cluster.unresolved ? 'yes' : 'no'} | ${cluster.closed_by ?? '—'} |`);
    }
  }

  lines.push(
    '',
    '## Operator-touch budget',
    '',
    `Used ${result.operator_touch_budget.used} of ${result.operator_touch_budget.max}; exceeded: ${result.operator_touch_budget.exceeded ? 'yes' : 'no'}.`,
    '',
    '## Active claims',
    '',
    '| Claim | State | Kind | Revision |',
    '|---|---|---|---|',
  );
  for (const claim of result.active_projection.active_claims) {
    lines.push(`| \`${tableCell(claim.id)}\` | ${claim.state} | ${claim.kind} | \`${tableCell(claim.revision)}\` |`);
  }

  lines.push(
    '',
    '## Historical summary',
    '',
    `Historical claims retained: ${result.active_projection.history_summary.total}.`,
    '',
    '## Longitudinal metrics',
    '',
    `Claims: ${result.longitudinal.active_claims} active / ${result.longitudinal.historical_claims} historical. Incidents: ${result.longitudinal.incidents}. Operator touches: ${result.longitudinal.operator_touches}. Line-growth ratio: ${result.longitudinal.line_growth_ratio ?? 'n/a'}.`,
    '',
    '> Generated view. Do not edit; update the authored steering packet and rebuild.',
    '',
  );
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { input: null, json: null, markdown: null };
  for (const arg of argv) {
    if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length);
    else if (arg.startsWith('--json=')) options.json = arg.slice('--json='.length);
    else if (arg.startsWith('--markdown=')) options.markdown = arg.slice('--markdown='.length);
    else if (!arg.startsWith('--') && !options.input) options.input = arg;
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!options.input) throw new Error('usage: steering.mjs --input=<packet.json> [--json=<result.json>] [--markdown=<result.md>]');
  return options;
}

function writeOutput(path, content) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), content, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = evaluateFile(options.input);
  if (options.json) writeOutput(options.json, resultJson(result));
  if (options.markdown) writeOutput(options.markdown, resultMarkdown(result));
  process.stdout.write(
    `${result.initiative}: ${result.status}; next=${result.next_recipe.id}; `
    + `active=${result.longitudinal.active_claims}; historical=${result.longitudinal.historical_claims}; `
    + `clusters=${result.longitudinal.unresolved_clusters}; touches=${result.operator_touch_budget.used}/${result.operator_touch_budget.max}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
