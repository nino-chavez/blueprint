// capability-support.mjs — validate methodology capability support records and
// derive a mirror-only fleet compatibility view. This module never reads a
// consumer receipt or infers transition intent.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  looksLikeSemver,
  looksLikeSha,
  semverCmp,
} from './consumers-registry.mjs';

export const CAPABILITY_SCHEMA = 'blueprint-capability-support/1';
export const VARIANT_TRANSITION_CAPABILITY = 'variant-transition';
export const VARIANTS = ['greenfield', 'midstream', 'brownfield', 'research'];
export const DEFAULT_CAPABILITY_REL = 'docs/compatibility/variant-transition-v1.json';

const TRANSITION_SCHEMAS = {
  plan: 'blueprint-variant-transition-plan/1',
  receipt: 'blueprint-variant-transition-receipt/1',
  rollback: 'blueprint-variant-transition-rollback/1',
  journal: 'blueprint-variant-transition-journal/1',
};

function plainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function validVariantList(value) {
  return Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((variant) => VARIANTS.includes(variant));
}

export function validateCapabilityRecord(record) {
  const errors = [];
  if (!plainObject(record)) return { ok: false, errors: ['record must be an object'] };
  if (record.schema !== CAPABILITY_SCHEMA) errors.push(`schema must be ${CAPABILITY_SCHEMA}`);
  if (record.capability !== VARIANT_TRANSITION_CAPABILITY) errors.push(`capability must be ${VARIANT_TRANSITION_CAPABILITY}`);
  if (!['candidate', 'released'].includes(record.status)) errors.push('status must be candidate or released');

  if (!plainObject(record.operation)) {
    errors.push('operation must be an object');
  } else {
    if (!validVariantList(record.operation.from)) errors.push('operation.from must be a unique non-empty known-variant array');
    if (!validVariantList(record.operation.to)) errors.push('operation.to must be a unique non-empty known-variant array');
  }

  if (!plainObject(record.schemas)) {
    errors.push('schemas must be an object');
  } else {
    for (const [name, expected] of Object.entries(TRANSITION_SCHEMAS)) {
      if (record.schemas[name] !== expected) errors.push(`schemas.${name} must be ${expected}`);
    }
  }

  const introduced = record.distribution?.introduced_in;
  if (record.status === 'candidate' && introduced != null) errors.push('candidate distribution.introduced_in must be null');
  if (record.status === 'released' && !looksLikeSemver(introduced)) errors.push('released distribution.introduced_in must be semver');

  const support = record.support_window;
  if (!plainObject(support)) {
    errors.push('support_window must be an object');
  } else {
    if (!Number.isInteger(support.minimum_minor_releases) || support.minimum_minor_releases < 1) {
      errors.push('support_window.minimum_minor_releases must be a positive integer');
    }
    if (!Number.isInteger(support.minimum_days) || support.minimum_days < 1) {
      errors.push('support_window.minimum_days must be a positive integer');
    }
    if (support.starts_at !== 'first-public-opt-in') {
      errors.push('support_window.starts_at must be first-public-opt-in');
    }
    if (!['pending', 'accepted'].includes(support.owner_acceptance)) {
      errors.push('support_window.owner_acceptance must be pending or accepted');
    }
    if (support.owner_acceptance === 'accepted' && !(typeof support.owner === 'string' && support.owner.trim())) {
      errors.push('accepted support owner must be named');
    }
    if (support.owner_acceptance === 'pending' && support.owner != null) {
      errors.push('pending support owner must remain null');
    }
    for (const field of ['coverage', 'exclusions']) {
      if (!Array.isArray(support[field]) || support[field].length === 0 || support[field].some((item) => typeof item !== 'string' || !item.trim())) {
        errors.push(`support_window.${field} must be a non-empty string array`);
      }
    }
  }

  if (!Array.isArray(record.remaining_gates) || record.remaining_gates.some((gate) => typeof gate !== 'string' || !gate.trim())) {
    errors.push('remaining_gates must be an array of non-empty strings');
  }
  return { ok: errors.length === 0, errors };
}

export function readCapabilityRecord(home, capabilityPath) {
  const path = capabilityPath || join(home, DEFAULT_CAPABILITY_REL);
  let record;
  try {
    record = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { present: false, path, record: null, validation: { ok: false, errors: [error.message] } };
  }
  return { present: true, path, record, validation: validateCapabilityRecord(record) };
}

function sourceEligibility(entry, capability) {
  if (!VARIANTS.includes(entry.variant)) return 'unknown';
  return capability.operation.from.includes(entry.variant) ? 'eligible' : 'unsupported-source';
}

function releasedDistribution(pin, capability, gitProbe) {
  const introduced = capability.distribution.introduced_in;
  if (pin == null) return { availability: 'unknown', evaluatedVersion: null, reason: 'consumer is unpinned' };
  if (looksLikeSemver(pin)) {
    const compatible = semverCmp(pin, introduced) >= 0;
    return {
      availability: compatible ? 'compatible' : 'behind-capability',
      evaluatedVersion: pin,
      reason: compatible ? `pin ${pin} includes release ${introduced}` : `pin ${pin} predates release ${introduced}`,
    };
  }
  if (looksLikeSha(pin)) {
    const atPin = gitProbe?.packageVersionAt?.(pin) || null;
    if (!looksLikeSemver(atPin)) {
      return { availability: 'unknown', evaluatedVersion: null, reason: 'SHA package version is unresolvable' };
    }
    const compatible = semverCmp(atPin, introduced) >= 0;
    return {
      availability: compatible ? 'compatible' : 'behind-capability',
      evaluatedVersion: atPin,
      reason: compatible ? `SHA resolves to package ${atPin}` : `SHA resolves to package ${atPin}, before ${introduced}`,
    };
  }
  return { availability: 'unknown', evaluatedVersion: null, reason: 'pin shape is unresolvable' };
}

export function computeCapabilityFleet(registry, capabilityRead, opts = {}) {
  const validation = capabilityRead.validation;
  const capability = capabilityRead.record;
  if (!validation.ok || !capability) {
    return {
      schema: CAPABILITY_SCHEMA,
      capability: VARIANT_TRANSITION_CAPABILITY,
      valid: false,
      errors: validation.errors,
      consumers: [],
      readyForPromotion: false,
    };
  }

  const candidate = capability.status === 'candidate' || capability.distribution.introduced_in == null;
  const consumers = registry.consumers.map((entry) => {
    const distribution = candidate
      ? { availability: 'not-distributed', evaluatedVersion: null, reason: 'capability has no authorized public release' }
      : releasedDistribution(entry.methodology_version, capability, opts.gitProbe);
    return {
      repo: entry.repo,
      mirroredVariant: VARIANTS.includes(entry.variant) ? entry.variant : null,
      variantSyncedAt: entry.variant_synced_at ?? null,
      sourceEligibility: sourceEligibility(entry, capability),
      pin: entry.methodology_version,
      distributionAvailability: distribution.availability,
      evaluatedVersion: distribution.evaluatedVersion,
      reason: distribution.reason,
    };
  });
  const count = (field, value) => consumers.filter((consumer) => consumer[field] === value).length;
  const ownerAccepted = capability.support_window.owner_acceptance === 'accepted';
  return {
    schema: CAPABILITY_SCHEMA,
    capability: capability.capability,
    valid: true,
    status: capability.status,
    introducedIn: capability.distribution.introduced_in,
    registryAuthority: 'dated-mirror',
    disclaimer: 'Eligibility is not transition intent, receipt state, applied state, or validation.',
    supportWindow: capability.support_window,
    remainingGates: capability.remaining_gates,
    registryWarnings: registry.fieldWarnings,
    consumers,
    summary: {
      total: consumers.length,
      eligible: count('sourceEligibility', 'eligible'),
      unsupportedSource: count('sourceEligibility', 'unsupported-source'),
      unknownSource: count('sourceEligibility', 'unknown'),
      notDistributed: count('distributionAvailability', 'not-distributed'),
      compatible: count('distributionAvailability', 'compatible'),
      behindCapability: count('distributionAvailability', 'behind-capability'),
      unknownDistribution: count('distributionAvailability', 'unknown'),
    },
    readyForPromotion:
      capability.status === 'released' &&
      ownerAccepted &&
      capability.remaining_gates.length === 0 &&
      registry.fieldWarnings.length === 0,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--self-test')) {
  const assert = (condition, message) => {
    if (!condition) {
      console.error(`FAIL: ${message}`);
      process.exit(1);
    }
  };
  const base = {
    schema: CAPABILITY_SCHEMA,
    capability: VARIANT_TRANSITION_CAPABILITY,
    status: 'candidate',
    operation: { from: ['greenfield'], to: ['research'] },
    schemas: { ...TRANSITION_SCHEMAS },
    distribution: { introduced_in: null },
    support_window: {
      minimum_minor_releases: 2,
      minimum_days: 90,
      starts_at: 'first-public-opt-in',
      owner: null,
      owner_acceptance: 'pending',
      coverage: ['status', 'recovery planning', 'recovery execution', 'rollback preflight', 'rollback execution'],
      exclusions: ['authored post-transition changes', 'non-Git or nested layouts', 'other variant pairs', 'cleanup execution'],
    },
    remaining_gates: ['prospective transition'],
  };
  assert(validateCapabilityRecord(base).ok, 'candidate record validates');
  assert(!validateCapabilityRecord({ ...base, schema: 'wrong/1' }).ok, 'invalid schema rejected');
  assert(!validateCapabilityRecord({ ...base, operation: { from: ['GREEN'], to: ['research'] } }).ok, 'invalid variant rejected');
  assert(!validateCapabilityRecord({ ...base, distribution: { introduced_in: '0.8.0' } }).ok, 'candidate release contradiction rejected');
  assert(!validateCapabilityRecord({ ...base, support_window: { ...base.support_window, owner_acceptance: 'accepted' } }).ok, 'accepted owner cannot be missing');

  const registry = {
    fieldWarnings: [],
    consumers: [
      { repo: 'a/eligible', variant: 'greenfield', variant_synced_at: '2026-07-27', methodology_version: '0.8.0' },
      { repo: 'a/unsupported', variant: 'midstream', variant_synced_at: '2026-07-27', methodology_version: '0.7.0' },
      { repo: 'a/unknown', variant: null, variant_synced_at: null, methodology_version: null },
      { repo: 'a/sha', variant: 'greenfield', variant_synced_at: '2026-07-27', methodology_version: 'abcdef0' },
      { repo: 'a/bad-pin', variant: 'greenfield', variant_synced_at: '2026-07-27', methodology_version: 'nope' },
    ],
  };
  const candidate = computeCapabilityFleet(registry, { record: base, validation: validateCapabilityRecord(base) });
  assert(candidate.consumers.every((consumer) => consumer.distributionAvailability === 'not-distributed'), 'candidate is not distributed to every consumer');
  assert(candidate.summary.eligible === 3 && candidate.summary.unsupportedSource === 1 && candidate.summary.unknownSource === 1, 'source eligibility uses explicit mirror only');
  assert(
    candidate.disclaimer.includes('not transition intent') &&
      candidate.consumers.every((consumer) => !Object.keys(consumer).some((key) => /receipt|applied|validated/i.test(key))),
    'view disclaims intent and emits no receipt-state field',
  );

  const released = {
    ...base,
    status: 'released',
    distribution: { introduced_in: '0.8.0' },
    support_window: { ...base.support_window, owner: 'operator', owner_acceptance: 'accepted' },
    remaining_gates: [],
  };
  const releasedView = computeCapabilityFleet(
    registry,
    { record: released, validation: validateCapabilityRecord(released) },
    { gitProbe: { packageVersionAt: (pin) => pin === 'abcdef0' ? '0.8.1' : null } },
  );
  assert(releasedView.consumers[0].distributionAvailability === 'compatible', 'current semver pin compatible');
  assert(releasedView.consumers[1].distributionAvailability === 'behind-capability', 'behind semver pin classified');
  assert(releasedView.consumers[2].distributionAvailability === 'unknown', 'unpinned remains unknown');
  assert(releasedView.consumers[3].distributionAvailability === 'compatible', 'resolvable SHA package version classified');
  assert(releasedView.consumers[4].distributionAvailability === 'unknown', 'unresolvable pin remains unknown');
  assert(releasedView.readyForPromotion, 'released, accepted, gate-free record is mechanically ready');

  const warned = computeCapabilityFleet(
    { ...registry, fieldWarnings: [{ repo: 'a/x', field: 'variant', value: 'GREEN', reason: 'invalid' }] },
    { record: released, validation: validateCapabilityRecord(released) },
  );
  assert(warned.registryWarnings.length === 1 && !warned.readyForPromotion, 'registry field warnings are visible and block readiness');

  const home = fileURLToPath(new URL('../../../', import.meta.url));
  const cli = join(home, 'bin', 'blueprint.mjs');
  const cliResult = spawnSync(
    process.execPath,
    [cli, 'fleet', '--capability=variant-transition', '--json'],
    { encoding: 'utf8', env: { ...process.env, BLUEPRINT_HOME: home } },
  );
  const cliView = JSON.parse(cliResult.stdout);
  assert(cliResult.status === 1 && cliView.status === 'candidate' && cliView.summary.notDistributed === cliView.summary.total, 'CLI candidate view is non-green and entirely not-distributed');
  const unknownCli = spawnSync(
    process.execPath,
    [cli, 'fleet', '--capability=not-real', '--json'],
    { encoding: 'utf8', env: { ...process.env, BLUEPRINT_HOME: home } },
  );
  assert(unknownCli.status === 2 && /unknown capability/.test(unknownCli.stderr), 'CLI rejects unknown capability');

  console.log('capability-support self-test: PASS (16 assertions)');
}
