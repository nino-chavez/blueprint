#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMAS = new Set([
  'blueprint-steering/0',
  'blueprint-steering/1',
  'blueprint-steering/2',
]);
const CLAIM_STATES = new Set([
  'satisfied',
  'open',
  'contradicted',
  'stale',
  'unobservable',
  'invalidated',
]);
const CLAIM_KINDS = new Set(['machine', 'human', 'decision']);
const EXECUTION_MODES = new Set([
  'agent-autonomous',
  'operator-inline',
  'operator-external',
  'external-actor',
]);
const EXECUTION_ROUTE_STRING_FIELDS = [
  'owner',
  'authority',
  'venue',
  'action',
  'artifact',
  'capture',
  'resume_when',
];
const COMPLETED_DISPOSITIONS = new Set(['accepted', 'completed']);
const ABSOLUTE_USER_PATH = /(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/;
const DELEGATION_STRING_FIELDS = [
  'delegating_actor',
  'delegate',
  'authorization_claim',
  'revision',
  'decision_record',
  'exercise_capture',
];
const DELEGATION_ARRAY_FIELDS = [
  'decision_classes',
  'allowed_effects',
  'prohibited_effects',
  'escalation_triggers',
];

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

function duplicateValues(items, field) {
  const counts = new Map();
  for (const item of items) {
    if (!isObject(item) || typeof item[field] !== 'string') continue;
    counts.set(item[field], (counts.get(item[field]) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
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

  if (!SCHEMAS.has(packet.schema)) {
    add('"schema"', `unsupported schema ${String(packet.schema)}; expected blueprint-steering/0, blueprint-steering/1, or blueprint-steering/2`);
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

  const requiredArrays = ['claims', 'journeys', 'incidents', 'dispositions', 'operator_touches'];
  if (['blueprint-steering/1', 'blueprint-steering/2'].includes(packet.schema)) {
    requiredArrays.push('execution_routes');
  }
  if (packet.schema === 'blueprint-steering/2') requiredArrays.push('decision_delegations');
  for (const field of requiredArrays) {
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
  for (const id of duplicateIds(packet.decision_delegations ?? [])) {
    add(`"id": "${id}"`, `duplicate decision delegation id ${id}`, 2);
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
    if (packet.schema === 'blueprint-steering/2' && claim.kind === 'decision') {
      if (typeof claim.decision_class !== 'string' || !claim.decision_class.trim()) {
        add(`"id": "${claim.id}"`, `decision claim ${claim.id} requires decision_class`);
      }
      if (!Array.isArray(claim.effects) || claim.effects.length === 0
          || claim.effects.some((effect) => typeof effect !== 'string' || !effect.trim())) {
        add(`"id": "${claim.id}"`, `decision claim ${claim.id} effects must be a non-empty string array`);
      }
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

  const delegationsById = new Map();
  if (packet.schema === 'blueprint-steering/2') {
    for (const delegation of packet.decision_delegations) {
      if (!isObject(delegation) || typeof delegation.id !== 'string' || !delegation.id) {
        add('"decision_delegations"', 'every decision delegation requires a non-empty id');
        continue;
      }
      if (!delegationsById.has(delegation.id)) delegationsById.set(delegation.id, delegation);
      for (const field of DELEGATION_STRING_FIELDS) {
        if (typeof delegation[field] !== 'string' || !delegation[field].trim()) {
          add(`"id": "${delegation.id}"`, `decision delegation ${delegation.id} requires ${field}`);
        }
      }
      for (const field of DELEGATION_ARRAY_FIELDS) {
        if (!Array.isArray(delegation[field]) || delegation[field].length === 0
            || delegation[field].some((item) => typeof item !== 'string' || !item.trim())) {
          add(`"id": "${delegation.id}"`, `decision delegation ${delegation.id} ${field} must be a non-empty string array`);
        }
      }
      if (typeof delegation.method_recommendation_default !== 'boolean') {
        add(`"id": "${delegation.id}"`, `decision delegation ${delegation.id} method_recommendation_default must be boolean`);
      }
      const authorization = claimsById.get(delegation.authorization_claim);
      if (!authorization) {
        add(`"authorization_claim": "${String(delegation.authorization_claim)}"`, `decision delegation ${delegation.id} references unknown authorization claim ${String(delegation.authorization_claim)}`);
      } else {
        if (authorization.kind !== 'human') {
          add(`"authorization_claim": "${delegation.authorization_claim}"`, `decision delegation ${delegation.id} authorization claim ${delegation.authorization_claim} must be human`);
        }
        if (authorization.state !== 'satisfied') {
          add(`"authorization_claim": "${delegation.authorization_claim}"`, `decision delegation ${delegation.id} authorization claim ${delegation.authorization_claim} must be satisfied`);
        }
        if (authorization.revision !== delegation.revision) {
          add(`"authorization_claim": "${delegation.authorization_claim}"`, `decision delegation ${delegation.id} revision must match authorization claim ${delegation.authorization_claim}`);
        }
      }
      const prohibited = new Set(delegation.prohibited_effects ?? []);
      for (const effect of delegation.allowed_effects ?? []) {
        if (prohibited.has(effect)) {
          add(`"id": "${delegation.id}"`, `decision delegation ${delegation.id} effect ${effect} cannot be both allowed and prohibited`);
        }
      }
    }
  }

  const delegatedRoutes = new Map();
  if (['blueprint-steering/1', 'blueprint-steering/2'].includes(packet.schema)) {
    for (const claimId of duplicateValues(packet.execution_routes, 'claim')) {
      add(`"claim": "${claimId}"`, `duplicate execution route for claim ${claimId}`, 2);
    }

    const routesByClaim = new Map();
    for (const route of packet.execution_routes) {
      if (!isObject(route) || typeof route.claim !== 'string' || !route.claim) {
        add('"execution_routes"', 'every execution route requires a non-empty claim');
        continue;
      }
      if (!routesByClaim.has(route.claim)) routesByClaim.set(route.claim, route);
      if (!claimsById.has(route.claim)) {
        add(`"claim": "${route.claim}"`, `execution route references unknown claim ${route.claim}`);
      }
      if (!EXECUTION_MODES.has(route.mode)) {
        add(`"claim": "${route.claim}"`, `execution route ${route.claim} has unsupported mode ${String(route.mode)}`);
      }
      for (const field of EXECUTION_ROUTE_STRING_FIELDS) {
        if (typeof route[field] !== 'string' || !route[field].trim()) {
          add(`"claim": "${route.claim}"`, `execution route ${route.claim} requires ${field}`);
        }
      }
      if (typeof route.blocking !== 'boolean') {
        add(`"claim": "${route.claim}"`, `execution route ${route.claim} blocking must be boolean`);
      }
      if (packet.schema === 'blueprint-steering/2') {
        const claim = claimsById.get(route.claim);
        if (route.delegation != null && (typeof route.delegation !== 'string' || !route.delegation.trim())) {
          add(`"claim": "${route.claim}"`, `execution route ${route.claim} delegation must be a non-empty string`);
        }
        if (route.mode === 'agent-autonomous' && claim?.kind === 'human') {
          add(`"claim": "${route.claim}"`, `human claim ${route.claim} may not use an agent-autonomous route`);
        }
        if (route.mode === 'agent-autonomous' && claim?.kind === 'decision') {
          const delegation = delegationsById.get(route.delegation);
          if (!delegation) {
            add(`"claim": "${route.claim}"`, `autonomous decision route ${route.claim} requires an authored decision delegation`);
          } else {
            delegatedRoutes.set(route.claim, delegation);
            if (route.owner !== delegation.delegate) {
              add(`"claim": "${route.claim}"`, `autonomous decision route ${route.claim} owner must match delegation ${delegation.id} delegate`);
            }
            if (route.blocking !== false) {
              add(`"claim": "${route.claim}"`, `autonomous decision route ${route.claim} must be non-blocking`);
            }
            if (route.capture !== delegation.decision_record) {
              add(`"claim": "${route.claim}"`, `autonomous decision route ${route.claim} capture must match delegation ${delegation.id} decision_record`);
            }
            if (delegation.method_recommendation_default !== true) {
              add(`"claim": "${route.claim}"`, `decision delegation ${delegation.id} does not allow the method recommendation to become the default`);
            }
            if (!delegation.decision_classes?.includes(claim.decision_class)) {
              add(`"claim": "${route.claim}"`, `decision delegation ${delegation.id} does not cover decision class ${String(claim.decision_class)}`);
            }
            const allowed = new Set(delegation.allowed_effects ?? []);
            const prohibited = new Set(delegation.prohibited_effects ?? []);
            for (const effect of claim.effects ?? []) {
              if (prohibited.has(effect)) {
                add(`"claim": "${route.claim}"`, `decision delegation ${delegation.id} prohibits effect ${effect}`);
              } else if (!allowed.has(effect)) {
                add(`"claim": "${route.claim}"`, `decision delegation ${delegation.id} does not allow effect ${effect}`);
              }
            }
          }
        } else if (route.delegation != null) {
          add(`"claim": "${route.claim}"`, `execution route ${route.claim} may reference a delegation only for an autonomous decision claim`);
        }
      }
    }

    for (const claim of packet.claims) {
      if (claim.active && ['human', 'decision'].includes(claim.kind) && !routesByClaim.has(claim.id)) {
        add(`"id": "${claim.id}"`, `active ${claim.kind} claim ${claim.id} requires an execution route`);
      }
    }
  }

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
    if (packet.schema === 'blueprint-steering/2' && disposition.delegation != null) {
      const delegation = delegationsById.get(disposition.delegation);
      const decisionClaim = claimsById.get(disposition.decision_claim);
      if (!delegation) {
        add(`"id": "${disposition.id}"`, `disposition ${disposition.id} references unknown decision delegation ${String(disposition.delegation)}`);
      }
      if (!decisionClaim || decisionClaim.kind !== 'decision') {
        add(`"id": "${disposition.id}"`, `disposition ${disposition.id} must reference a decision claim`);
      }
      if (!Array.isArray(disposition.effects) || disposition.effects.length === 0) {
        add(`"id": "${disposition.id}"`, `delegated disposition ${disposition.id} effects must be a non-empty array`);
      } else if (decisionClaim && JSON.stringify(disposition.effects) !== JSON.stringify(decisionClaim.effects)) {
        add(`"id": "${disposition.id}"`, `delegated disposition ${disposition.id} effects must match decision claim ${disposition.decision_claim}`);
      }
      if (typeof disposition.exercise_receipt !== 'string' || !disposition.exercise_receipt.trim()) {
        add(`"id": "${disposition.id}"`, `delegated disposition ${disposition.id} requires exercise_receipt`);
      }
      if (delegation && disposition.exercise_receipt !== delegation.exercise_capture) {
        add(`"id": "${disposition.id}"`, `delegated disposition ${disposition.id} exercise_receipt must match delegation ${delegation.id} exercise_capture`);
      }
    }
  }

  if (packet.schema === 'blueprint-steering/2') {
    for (const [claimId, delegation] of delegatedRoutes) {
      const claim = claimsById.get(claimId);
      if (claim?.state !== 'satisfied') continue;
      const exercised = packet.dispositions.find((disposition) => (
        COMPLETED_DISPOSITIONS.has(disposition.status)
        && disposition.delegation === delegation.id
        && disposition.decision_claim === claimId
        && disposition.exercise_receipt === delegation.exercise_capture
      ));
      if (!exercised) {
        add(`"id": "${claimId}"`, `satisfied delegated decision ${claimId} requires a matching completed disposition and exercise receipt`);
      }
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

function dependencyFrontier(ids, claimsById) {
  const frontier = [];
  const selected = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const claim = claimsById.get(id);
    if (!claim || claim.state === 'satisfied') return;
    const blockers = dependencyBlockers(claim, claimsById);
    if (blockers.length === 0) {
      if (!selected.has(id)) {
        selected.add(id);
        frontier.push(id);
      }
      return;
    }
    blockers.forEach(visit);
  }

  ids.forEach(visit);
  return frontier;
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
      ...(claim.kind === 'decision' && claim.decision_class
        ? { decision_class: claim.decision_class, effects: claim.effects }
        : {}),
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

function selectRecipe(packet, claimsById, routesByClaim, readiness, clusters, touchBudget) {
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

  const contradicted = active.filter((claim) => (
    claim.state === 'contradicted' || claim.state === 'invalidated'
  ));
  if (contradicted.length > 0) {
    return {
      id: 'repair-or-revise',
      reason: 'An active prerequisite or outcome is contradicted or invalidated and requires an explicit repair, revision, waiver, or re-charter.',
      targets: contradicted.map((claim) => claim.id),
    };
  }

  const unresolvedHumanReadiness = readiness.filter((item) => (
    ['open', 'stale', 'unobservable'].includes(claimsById.get(item.claim)?.state)
  ));
  const blockedHuman = unresolvedHumanReadiness.filter((item) => !item.ready);
  const readyHuman = unresolvedHumanReadiness.filter((item) => item.ready);
  const blockingReadyHuman = readyHuman.filter((item) => (
    routesByClaim.get(item.claim)?.blocking ?? true
  ));
  if (blockingReadyHuman.length > 0 && touchBudget.exhausted) {
    return {
      id: 'request-budget-disposition',
      reason: 'The human encounter is ready, but the declared operator-touch budget is exhausted.',
      targets: blockingReadyHuman.map((item) => item.claim),
    };
  }
  if (blockingReadyHuman.length > 0) {
    return {
      id: 'run-bounded-encounter',
      reason: 'Deterministic prerequisites are satisfied and a blocking human outcome is within its touch budget.',
      targets: blockingReadyHuman.map((item) => item.claim),
    };
  }
  if (blockedHuman.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'A human outcome is open, but its actionable prerequisites are not satisfied.',
      targets: dependencyFrontier(
        blockedHuman.flatMap((item) => item.blockers),
        claimsById,
      ),
    };
  }

  const allOpenMachine = active.filter((claim) => (
    claim.kind === 'machine' && ['open', 'unobservable'].includes(claim.state)
  ));
  const openMachine = allOpenMachine.filter((claim) => (
    dependencyBlockers(claim, claimsById).length === 0
  ));
  if (openMachine.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'Active machine-checkable claims remain open.',
      targets: openMachine.map((claim) => claim.id),
    };
  }
  if (allOpenMachine.length > 0) {
    return {
      id: 'implement-or-verify',
      reason: 'Active machine-checkable claims remain open behind unresolved prerequisites.',
      targets: dependencyFrontier(
        allOpenMachine.map((claim) => claim.id),
        claimsById,
      ),
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
      targets: dependencyFrontier(
        blockedDecision.flatMap((claim) => dependencyBlockers(claim, claimsById)),
        claimsById,
      ),
    };
  }

  const nonBlockingReadyHuman = readyHuman.filter((item) => (
    routesByClaim.get(item.claim)?.blocking === false
  ));
  if (nonBlockingReadyHuman.length > 0 && touchBudget.exhausted) {
    return {
      id: 'request-budget-disposition',
      reason: 'No autonomous work remains and the ready non-blocking human encounter has exhausted its touch budget.',
      targets: nonBlockingReadyHuman.map((item) => item.claim),
    };
  }
  if (nonBlockingReadyHuman.length > 0) {
    return {
      id: 'run-bounded-encounter',
      reason: 'No autonomous work remains; the ready non-blocking human outcome can now be collected.',
      targets: nonBlockingReadyHuman.map((item) => item.claim),
    };
  }

  const unresolved = active.filter((claim) => claim.state !== 'satisfied');
  if (unresolved.length > 0) {
    return {
      id: 'repair-or-revise',
      reason: 'Active claims remain unresolved in a state that requires an explicit revision or disposition.',
      targets: unresolved.map((claim) => claim.id),
    };
  }

  return {
    id: 'hold',
    reason: 'No unresolved active claim requires work or observation.',
    targets: [],
  };
}

function defaultExecutionRoute(target, claim, recipe) {
  if (!claim || claim.kind === 'machine') {
    return {
      target,
      mode: 'agent-autonomous',
      owner: 'agent',
      authority: 'authored initiative scope',
      venue: 'current-harness',
      action: `Execute ${recipe.id} for ${target} and update its authored evidence.`,
      artifact: `authored evidence for ${target}`,
      capture: 'initiative repository',
      resume_when: 'the target state is updated and the steering packet is re-evaluated',
      blocking: false,
      handoff_required: false,
      route_source: 'default-machine',
    };
  }

  return {
    target,
    mode: 'operator-inline',
    owner: 'operator',
    authority: 'unspecified in version-0 packet',
    venue: 'current task',
    action: `Resolve ${recipe.id} for ${target}.`,
    artifact: 'unspecified in version-0 packet',
    capture: 'unspecified in version-0 packet',
    resume_when: 'the operator response is captured in the authored packet',
    blocking: true,
    handoff_required: true,
    route_source: 'legacy-unspecified',
  };
}

function deriveNextActions(packet, recipe, claimsById, routesByClaim) {
  return recipe.targets.map((target) => {
    const route = routesByClaim.get(target);
    if (!route) return defaultExecutionRoute(target, claimsById.get(target), recipe);
    return {
      target,
      mode: route.mode,
      owner: route.owner,
      authority: route.authority,
      venue: route.venue,
      action: route.action,
      artifact: route.artifact,
      capture: route.capture,
      resume_when: route.resume_when,
      blocking: route.blocking,
      handoff_required: route.mode !== 'agent-autonomous',
      route_source: route.delegation ? 'authored-delegation' : 'authored',
      delegation: route.delegation ?? null,
    };
  });
}

export function evaluatePacket(packet, context = {}) {
  const errors = validatePacket(packet, context);
  if (errors.length > 0) throw new SteeringPacketError(errors);

  const claimsById = new Map(packet.claims.map((claim) => [claim.id, claim]));
  const routesByClaim = new Map((packet.execution_routes ?? []).map((route) => [route.claim, route]));
  const readiness = deriveReadiness(packet, claimsById);
  const clusters = deriveClusters(packet);
  const touchBudget = deriveTouchBudget(packet);
  const activeProjection = deriveActiveProjection(packet);
  const recipe = selectRecipe(packet, claimsById, routesByClaim, readiness, clusters, touchBudget);
  const nextActions = deriveNextActions(packet, recipe, claimsById, routesByClaim);
  const longitudinal = deriveLongitudinal(packet, clusters, touchBudget);

  return {
    schema: packet.schema === 'blueprint-steering/2'
      ? 'blueprint-steering-result/2'
      : 'blueprint-steering-result/1',
    packet_schema: packet.schema,
    initiative: packet.initiative,
    as_of: packet.as_of,
    current_revision: packet.current_revision,
    outcome: packet.outcome,
    status: 'VALID',
    next_recipe: recipe,
    next_actions: nextActions,
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
    '## Execution boundary',
    '',
  ];

  if (result.next_actions.length === 0) {
    lines.push('No action is currently selected; no handoff is required.');
  } else {
    for (const action of result.next_actions) {
      lines.push(
        `### \`${action.target}\``,
        '',
        `- Owner: ${action.owner}`,
        `- Mode: \`${action.mode}\``,
        `- Authority: ${action.authority}`,
        `- Venue: ${action.venue}`,
        `- Current task must pause: ${action.handoff_required && action.blocking ? 'yes' : 'no'}`,
        `- Action: ${action.action}`,
        `- Artifact: ${action.artifact}`,
        `- Capture: ${action.capture}`,
        `- Resume when: ${action.resume_when}`,
        `- Route source: \`${action.route_source}\``,
        ...(action.delegation ? [`- Delegation: \`${action.delegation}\``] : []),
        '',
      );
    }
  }

  lines.push(
    '## Encounter readiness',
    '',
    '| Journey | Human claim | Ready | Blockers |',
    '|---|---|---:|---|',
  );

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
  const owners = [...new Set(result.next_actions.map((action) => action.owner))];
  const handoff = result.next_actions.some((action) => action.handoff_required && action.blocking);
  process.stdout.write(
    `${result.initiative}: ${result.status}; next=${result.next_recipe.id}; `
    + `active=${result.longitudinal.active_claims}; historical=${result.longitudinal.historical_claims}; `
    + `clusters=${result.longitudinal.unresolved_clusters}; touches=${result.operator_touch_budget.used}/${result.operator_touch_budget.max}; `
    + `handoff=${handoff ? 'yes' : 'no'}; owners=${owners.length > 0 ? owners.join(',') : 'none'}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
