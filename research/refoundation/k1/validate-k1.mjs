#!/usr/bin/env node

// Research-only evaluator for Blueprint re-foundation candidate K1.
// Deliberately outside template/ and production tooling. It proves that the
// candidate's core semantics are executable before any architecture decision.
//
// Usage:
//   node validate-k1.mjs file.json [...]
//   node validate-k1.mjs --selftest

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const RESULTS = new Set(['supports', 'contradicts', 'could-not-observe']);
const STATES = new Set([
  'satisfied',
  'open',
  'contradicted',
  'unobservable',
  'stale',
  'invalidated',
  'invalid',
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function isExpired(receipt, asOf) {
  if (!receipt.expires_at) return false;
  return new Date(receipt.expires_at).getTime() < new Date(asOf).getTime();
}

function valuesMatch(required, observed) {
  if (required == null) return true;
  if (Array.isArray(required)) return required.includes(observed);
  return required === observed;
}

function scopeMatches(required = {}, observed = {}) {
  return Object.entries(required).every(([key, value]) => valuesMatch(value, observed[key]));
}

function actorIndex(charters = []) {
  const result = new Map();
  for (const charter of charters) {
    for (const actor of charter.actors ?? []) {
      const key = `${charter.revision}:${actor.id}`;
      result.set(key, actor);
      result.set(`any:${actor.id}`, actor);
    }
  }
  return result;
}

function receiptCompatibility(receipt, claim, actors, asOf) {
  const requirement = claim.evidence_requirement ?? {};
  const reasons = [];

  if (!valuesMatch(requirement.object, receipt.object)) reasons.push('object');
  if (!valuesMatch(requirement.oracle, receipt.oracle?.method)) reasons.push('oracle');
  if (receipt.result !== 'could-not-observe' && receipt.oracle?.executed !== true)
    reasons.push('oracle-not-executed');

  const expectedScope = { ...(claim.scope ?? {}), ...(requirement.scope ?? {}) };
  if (!scopeMatches(expectedScope, receipt.scope ?? {})) reasons.push('scope');

  const observerReq = requirement.observer ?? {};
  if (observerReq.actor && observerReq.actor !== receipt.observer?.actor) reasons.push('observer-actor');
  if (observerReq.role && observerReq.role !== receipt.observer?.role_during_observation)
    reasons.push('observer-role');

  const observer = actors.get(`${claim.charter_revision}:${receipt.observer?.actor}`)
    ?? actors.get(`any:${receipt.observer?.actor}`);
  if (observerReq.independence === 'not-builder') {
    if (!observer || (observer.kinds ?? []).includes('builder') || receipt.observer?.independence !== 'not-builder')
      reasons.push('independence');
  }
  if (observerReq.independence === 'not-author') {
    if (receipt.observer?.actor === claim.owner || receipt.observer?.independence !== 'not-author')
      reasons.push('independence');
  }

  const freshness = requirement.freshness ?? {};
  if (isExpired(receipt, asOf)) reasons.push('expired');
  if (freshness.source_version && freshness.source_version !== receipt.source_version)
    reasons.push('source-version');

  return { compatible: reasons.length === 0, reasons };
}

function validate(document, file = '<memory>') {
  const errors = [];
  const warns = [];
  const E = (rule, message) => errors.push(`[${rule}] ${message}`);
  const W = (rule, message) => warns.push(`[${rule}] ${message}`);

  if (!document.initiative) E('K1-structure', 'initiative is required');
  if (!document.as_of || Number.isNaN(new Date(document.as_of).getTime()))
    E('K1-structure', 'as_of must be a valid timestamp');

  const charters = document.charters ?? [];
  const current = charters.find((c) => c.revision === document.current_charter_revision);
  if (!current) E('K1-charter', `current charter revision ${document.current_charter_revision} does not resolve`);

  const charterRevisions = new Set();
  for (const charter of charters) {
    if (charterRevisions.has(charter.revision)) E('K1-charter', `duplicate charter revision ${charter.revision}`);
    charterRevisions.add(charter.revision);
    if (!charter.intent) E('K1-charter', `charter ${charter.revision} has no intent`);
    const actorIds = new Set();
    for (const actor of charter.actors ?? []) {
      if (actorIds.has(actor.id)) E('K1-authority', `duplicate actor ${actor.id} in charter ${charter.revision}`);
      actorIds.add(actor.id);
    }
  }

  const actors = actorIndex(charters);
  const claims = new Map();
  for (const claim of document.claims ?? []) {
    if (claims.has(claim.id)) E('K1-claims', `duplicate claim ${claim.id}`);
    claims.set(claim.id, claim);
    if (!claim.statement) E('K1-claims', `claim ${claim.id} has no statement`);
    if (!charterRevisions.has(claim.charter_revision))
      E('K1-claims', `claim ${claim.id} references unknown charter revision ${claim.charter_revision}`);
    if (!claim.evidence_requirement?.object || !claim.evidence_requirement?.oracle)
      E('K1-claims', `claim ${claim.id} must declare evidence object and oracle`);
    if (/^(ready|done|working|usable|compliant|validated|shipped)$/i.test(String(claim.statement).trim()))
      E('K1-language', `claim ${claim.id} is an unscoped status word: ${claim.statement}`);
  }
  for (const claim of claims.values()) {
    for (const dep of claim.depends_on ?? [])
      if (!claims.has(dep)) E('K1-refs', `claim ${claim.id} depends on unknown claim ${dep}`);
  }

  const receipts = new Map();
  for (const receipt of document.receipts ?? []) {
    if (receipts.has(receipt.id)) E('K1-receipts', `duplicate receipt ${receipt.id}`);
    receipts.set(receipt.id, receipt);
    if (!claims.has(receipt.claim)) E('K1-refs', `receipt ${receipt.id} references unknown claim ${receipt.claim}`);
    if (!RESULTS.has(receipt.result)) E('K1-receipts', `receipt ${receipt.id} has invalid result ${receipt.result}`);
    if (receipt.result === 'could-not-observe' && receipt.oracle?.executed === true)
      W('K1-receipts', `receipt ${receipt.id} says could-not-observe although oracle executed; confirm observation semantics`);
    if (receipt.result !== 'could-not-observe' && receipt.oracle?.executed !== true)
      E('K1-receipts', `receipt ${receipt.id} claims ${receipt.result} but its oracle did not execute`);
    if (!receipt.observed_at || Number.isNaN(new Date(receipt.observed_at).getTime()))
      E('K1-receipts', `receipt ${receipt.id} has no valid observed_at`);
    if (!actors.get(`any:${receipt.observer?.actor}`))
      E('K1-authority', `receipt ${receipt.id} observer ${receipt.observer?.actor ?? '<missing>'} is not a charter actor`);
  }

  const invalidated = new Set();
  const retained = new Set();
  const retractedReceipts = new Map();
  const dispositionIds = new Set();
  for (const disposition of document.dispositions ?? []) {
    if (dispositionIds.has(disposition.id)) E('K1-dispositions', `duplicate disposition ${disposition.id}`);
    dispositionIds.add(disposition.id);
    const actor = actors.get(`any:${disposition.decided_by}`);
    if (!actor) E('K1-authority', `disposition ${disposition.id} decided by unknown actor ${disposition.decided_by}`);
    else if (!(actor.authority ?? []).includes(disposition.authority))
      E('K1-authority', `actor ${disposition.decided_by} lacks ${disposition.authority} for disposition ${disposition.id}`);
    if (!disposition.rationale) E('K1-dispositions', `disposition ${disposition.id} has no rationale`);
    for (const id of disposition.changes?.invalidates_claims ?? []) {
      if (!claims.has(id)) E('K1-refs', `disposition ${disposition.id} invalidates unknown claim ${id}`);
      invalidated.add(id);
    }
    for (const id of disposition.changes?.retains_claims ?? []) {
      if (!claims.has(id)) E('K1-refs', `disposition ${disposition.id} retains unknown claim ${id}`);
      retained.add(id);
    }
    if (disposition.action === 're-charter') {
      const revision = disposition.changes?.charter_revision;
      if (!charterRevisions.has(revision)) E('K1-charter', `re-charter ${disposition.id} targets unknown revision ${revision}`);
    }
    if (disposition.action === 'correct-receipt') {
      if (disposition.authority !== 'correct-receipt')
        E('K1-dispositions', `receipt correction ${disposition.id} must exercise correct-receipt authority`);
      if (!disposition.decided_at || Number.isNaN(new Date(disposition.decided_at).getTime()))
        E('K1-dispositions', `receipt correction ${disposition.id} has no valid decided_at`);

      const retractions = disposition.changes?.retracts_receipts ?? [];
      const replacements = disposition.changes?.replacement_receipts ?? [];
      const invalidations = new Set(disposition.changes?.invalidates_claims ?? []);
      if (!retractions.length)
        E('K1-dispositions', `receipt correction ${disposition.id} retracts no receipts`);

      const replacementRecords = [];
      for (const receiptId of replacements) {
        const receipt = receipts.get(receiptId);
        if (!receipt) E('K1-refs', `receipt correction ${disposition.id} replaces with unknown receipt ${receiptId}`);
        else replacementRecords.push(receipt);
      }
      for (const receiptId of retractions) {
        const receipt = receipts.get(receiptId);
        if (!receipt) {
          E('K1-refs', `receipt correction ${disposition.id} retracts unknown receipt ${receiptId}`);
          continue;
        }
        if (replacements.includes(receiptId))
          E('K1-dispositions', `receipt correction ${disposition.id} cannot retract and replace with ${receiptId}`);
        if (retractedReceipts.has(receiptId))
          E('K1-dispositions', `receipt ${receiptId} is retracted by both ${retractedReceipts.get(receiptId)} and ${disposition.id}`);
        else retractedReceipts.set(receiptId, disposition.id);

        const hasSameClaimReplacement = replacementRecords.some((replacement) => replacement.claim === receipt.claim);
        if (!hasSameClaimReplacement && !invalidations.has(receipt.claim))
          E('K1-dispositions', `receipt correction ${disposition.id} must replace ${receiptId} with a receipt for claim ${receipt.claim} or invalidate that claim`);
      }
      for (const replacement of replacementRecords) {
        const replacedClaims = retractions.map((receiptId) => receipts.get(receiptId)?.claim).filter(Boolean);
        if (!replacedClaims.includes(replacement.claim))
          E('K1-dispositions', `replacement receipt ${replacement.id} in ${disposition.id} does not match a retracted claim`);
      }
    }
  }
  for (const id of invalidated)
    if (retained.has(id)) E('K1-dispositions', `claim ${id} is both retained and invalidated`);

  const states = new Map();
  const stateReasons = new Map();
  const receiptEvaluations = new Map();
  const evaluating = new Set();
  const evaluateClaim = (id) => {
    if (states.has(id)) return states.get(id);
    if (evaluating.has(id)) {
      E('K1-claims', `claim dependency cycle at ${id}`);
      states.set(id, 'invalid');
      stateReasons.set(id, [{ code: 'dependency-cycle', claim: id }]);
      return 'invalid';
    }
    evaluating.add(id);
    const claim = claims.get(id);
    if (!claim) {
      stateReasons.set(id, [{ code: 'claim-missing', claim: id }]);
      evaluating.delete(id);
      return 'invalid';
    }
    if (invalidated.has(id)) {
      states.set(id, 'invalidated');
      stateReasons.set(id, [{ code: 'disposition-invalidated', claim: id }]);
      evaluating.delete(id);
      return 'invalidated';
    }

    const dependencyEntries = (claim.depends_on ?? []).map((dep) => ({ claim: dep, state: evaluateClaim(dep) }));
    const dependencyStates = dependencyEntries.map((entry) => entry.state);
    if (dependencyStates.includes('invalid') || dependencyStates.includes('invalidated')) {
      states.set(id, 'invalidated');
      stateReasons.set(id, [{ code: 'dependency-invalidated', dependencies: dependencyEntries.filter((entry) => ['invalid', 'invalidated'].includes(entry.state)) }]);
      evaluating.delete(id);
      return 'invalidated';
    }
    if (dependencyStates.some((s) => s !== 'satisfied')) {
      const ranked = ['contradicted', 'unobservable', 'stale', 'open'];
      const state = ranked.find((candidate) => dependencyStates.includes(candidate)) ?? 'open';
      states.set(id, state);
      stateReasons.set(id, [{ code: 'dependencies-unsatisfied', dependencies: dependencyEntries.filter((entry) => entry.state !== 'satisfied') }]);
      evaluating.delete(id);
      return state;
    }

    const candidates = [];
    for (const receipt of [...receipts.values()].filter((candidate) => candidate.claim === id)) {
      const correction = retractedReceipts.get(receipt.id);
      if (correction) {
        receiptEvaluations.set(receipt.id, {
          claim: id,
          result: receipt.result,
          compatible: false,
          reasons: ['retracted-by-disposition'],
          disposition: correction,
        });
      } else {
        candidates.push(receipt);
      }
    }
    const supporting = [];
    const contradicting = [];
    const couldNotObserve = [];
    const stale = [];
    const incompatible = [];
    for (const receipt of candidates) {
      const compatibility = receiptCompatibility(receipt, claim, actors, document.as_of);
      receiptEvaluations.set(receipt.id, { claim: id, result: receipt.result, ...compatibility });
      if (!compatibility.compatible) {
        const freshnessOnly = compatibility.reasons.length > 0
          && compatibility.reasons.every((r) => r === 'expired' || r === 'source-version');
        const target = freshnessOnly ? stale : incompatible;
        target.push({ receipt: receipt.id, reasons: compatibility.reasons });
        continue;
      }
      if (receipt.result === 'supports') supporting.push(receipt.id);
      if (receipt.result === 'contradicts') contradicting.push(receipt.id);
      if (receipt.result === 'could-not-observe') couldNotObserve.push(receipt.id);
    }

    let state = 'open';
    let reasons;
    if (contradicting.length) {
      state = 'contradicted';
      reasons = [{ code: 'compatible-contradiction', receipts: contradicting }];
    } else if (supporting.length) {
      state = 'satisfied';
      reasons = [{ code: 'compatible-support', receipts: supporting }];
    } else if (couldNotObserve.length) {
      state = 'unobservable';
      reasons = [{ code: 'could-not-observe', receipts: couldNotObserve }];
    } else if (stale.length) {
      state = 'stale';
      reasons = [{ code: 'stale-receipts', receipts: stale }];
    } else if (incompatible.length) {
      reasons = [{ code: 'no-compatible-receipt', receipts: incompatible }];
    } else {
      reasons = [{ code: 'no-receipts' }];
    }
    states.set(id, state);
    stateReasons.set(id, reasons);
    evaluating.delete(id);
    return state;
  };
  for (const id of claims.keys()) evaluateClaim(id);

  const checkpointStates = new Map();
  const checkpointReasons = new Map();
  for (const checkpoint of document.checkpoints ?? []) {
    const required = checkpoint.requires ?? [];
    if (!required.length) E('K1-checkpoints', `checkpoint ${checkpoint.id} has no required claims`);
    const claimStates = required.map((id) => {
      if (!claims.has(id)) E('K1-refs', `checkpoint ${checkpoint.id} references unknown claim ${id}`);
      return states.get(id) ?? 'invalid';
    });
    let state = 'satisfied';
    if (claimStates.includes('invalid')) state = 'invalid';
    else if (claimStates.includes('invalidated')) state = 'invalidated';
    else if (claimStates.includes('contradicted')) state = 'contradicted';
    else if (claimStates.includes('unobservable')) state = 'unobservable';
    else if (claimStates.includes('stale')) state = 'stale';
    else if (claimStates.some((s) => s !== 'satisfied')) state = 'open';
    checkpointStates.set(checkpoint.id, state);
    checkpointReasons.set(checkpoint.id, required.map((id) => ({ claim: id, state: states.get(id) ?? 'invalid' })).filter((entry) => entry.state !== 'satisfied'));
  }

  for (const module of document.modules ?? []) {
    if (!(module.activation_claims ?? []).length)
      E('K1-modules', `module ${module.id} has no activation claims (universal ceremony)`);
    for (const id of module.activation_claims ?? [])
      if (!claims.has(id)) E('K1-refs', `module ${module.id} activation references unknown claim ${id}`);
    if (module.requires_actor_kind) {
      const hasActor = [...actors.entries()].some(([key, actor]) => key.startsWith(`${document.current_charter_revision}:`)
        && (actor.kinds ?? []).includes(module.requires_actor_kind));
      if (!hasActor) E('K1-modules', `module ${module.id} requires actor kind ${module.requires_actor_kind}, absent from current charter`);
    }
  }

  for (const [id, expected] of Object.entries(document.assertions?.claims ?? {})) {
    if (!STATES.has(expected)) E('K1-assertions', `claim assertion ${id} uses unknown state ${expected}`);
    else if (states.get(id) !== expected)
      E('K1-assertions', `claim ${id} asserted ${expected}, derived ${states.get(id) ?? 'missing'}`);
  }
  for (const [id, expected] of Object.entries(document.assertions?.checkpoints ?? {})) {
    if (!STATES.has(expected)) E('K1-assertions', `checkpoint assertion ${id} uses unknown state ${expected}`);
    else if (checkpointStates.get(id) !== expected)
      E('K1-assertions', `checkpoint ${id} asserted ${expected}, derived ${checkpointStates.get(id) ?? 'missing'}`);
  }

  return { file, errors, warns, states, stateReasons, receiptEvaluations, checkpointStates, checkpointReasons };
}

function printResult(result) {
  const name = result.file.split('/').slice(-1)[0];
  console.log(`\n=== ${name}: ${result.errors.length ? 'FAIL' : 'PASS'} (${result.errors.length} errors, ${result.warns.length} warns)`);
  for (const [id, state] of result.states) console.log(`  claim ${id}: ${state}`);
  for (const [id, state] of result.checkpointStates) console.log(`  checkpoint ${id}: ${state}`);
  for (const error of result.errors) console.log(`  ERROR ${error}`);
  for (const warning of result.warns) console.log(`  warn  ${warning}`);
}

function filesIn(dir) {
  const full = resolve(HERE, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((name) => name.endsWith('.json')).sort().map((name) => join(full, name));
}

function selftest() {
  const tests = [
    ...filesIn('specimens').map((file) => ({ file, expect: 'pass' })),
    ...filesIn('fixtures').map((file) => ({ file, expect: 'fail' })),
  ];
  let failures = 0;
  for (const test of tests) {
    const result = validate(readJson(test.file), test.file);
    const actual = result.errors.length ? 'fail' : 'pass';
    const ok = actual === test.expect;
    console.log(`${ok ? 'ok' : 'NOT OK'} ${test.expect.toUpperCase()} ${test.file.split('/').slice(-1)[0]} — got ${actual.toUpperCase()} (${result.errors.length} errors)`);
    if (!ok) {
      printResult(result);
      failures += 1;
    }
  }
  console.log(`\n${tests.length - failures}/${tests.length} K1 research fixtures matched expected verdicts.`);
  process.exit(failures ? 1 : 0);
}

export { readJson, receiptCompatibility, validate, printResult };

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  if (process.argv[2] === '--selftest') selftest();

  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node validate-k1.mjs <file.json> [...] | --selftest');
    process.exit(2);
  }

  let failed = false;
  for (const file of files) {
    const result = validate(readJson(file), file);
    printResult(result);
    if (result.errors.length) failed = true;
  }
  process.exit(failed ? 1 : 0);
}
