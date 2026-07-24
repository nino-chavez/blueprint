// review-loop.mjs — renderer-independent review and disposition contract.
//
// Blueprint owns the semantics of a review loop, not the presentation shell or
// hosted feedback service. A portal, bespoke site, native app, Slack exchange,
// or Atelier-style annotation harness may all adapt into the same three files:
//
//   review-contract.json
//   feedback/submissions/*.json
//   feedback/dispositions/*.json
//
// The contract pins the exact candidate, reader, asks, authority, capture
// adapter, and disposition policy. Submissions are untrusted observations:
// they can never set claim/product/evidence status directly. Dispositions close
// the loop and, when required, record the return to the reader.
//
// Dependency-free and synchronous by design so doctor, stage-model, and the
// public CLI can all reuse the same evaluator.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

export const CONTRACT_SCHEMA = 'blueprint-review-loop/1';
export const SUBMISSION_SCHEMA = 'blueprint-review-submission/1';
export const DISPOSITION_SCHEMA = 'blueprint-review-disposition/1';

const CONTRACT_STATUSES = new Set(['planned', 'ready', 'issued', 'retired']);
const IDENTITIES = new Set(['authenticated', 'invited', 'anonymous', 'mediated']);
const TARGET_KINDS = new Set(['artifact', 'claim', 'decision', 'screen', 'methodology']);
const TARGET_AUTHORITIES = new Set(['inform', 'advise', 'decide', 'approve']);
const CAPTURE_MODES = new Set(['self-service', 'mediated']);
const CLASSIFICATION_MODES = new Set(['agent-autonomous', 'human']);
const APPLY_MODES = new Set(['none', 'human-authorized', 'delegated']);
const RETURN_MODES = new Set(['required', 'best-effort', 'not-required']);
const CATEGORIES = new Set([
  'bug',
  'scope-add',
  'scope-clarify',
  'opinion',
  'question',
  'kudos',
  'market-signal',
  'methodology-gap',
  'approval',
]);
const DISPOSITION_STATES = new Set([
  'scoped-in',
  'deferred',
  'answered',
  'wontfix',
  'clarified',
  'logged',
  'duplicate',
]);
const RETURN_STATES = new Set(['pending', 'sent', 'not-required']);
const CONSEQUENCE_TYPES = new Set([
  'none',
  'work-item',
  'decision',
  'methodology-amendment',
  'answer',
  'evidence-candidate',
]);
const FORBIDDEN_SUBMISSION_FIELDS = [
  'accepted',
  'claim_status',
  'decision_status',
  'evidence_grade',
  'product_status',
  'receipt',
];

const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const exactRevision = (v) =>
  nonempty(v) &&
  v.trim().length >= 7 &&
  !/^(head|main|master|latest|current|tip)$/i.test(v.trim()) &&
  !/\s/.test(v.trim());
const relativePath = (v) =>
  nonempty(v) &&
  !v.startsWith('/') &&
  !v.startsWith('~') &&
  !v.includes('\\') &&
  !v.split('/').includes('..');

function readJson(file, errors, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function readJsonDir(root, rel, errors, label) {
  if (!relativePath(rel)) {
    errors.push(`${label} must be a safe relative path`);
    return [];
  }
  const dir = resolve(root, rel);
  if (!existsSync(dir)) return [];
  let files;
  try {
    files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  } catch (error) {
    errors.push(`${label} cannot be read: ${error.message}`);
    return [];
  }
  return files
    .map((name) => ({ name, value: readJson(join(dir, name), errors, `${label}/${name}`) }))
    .filter((item) => item.value != null);
}

function validateContract(contract, errors, warns) {
  if (!isObject(contract)) {
    errors.push('review contract must be a JSON object');
    return { targets: new Map() };
  }
  if (contract.schema_version !== CONTRACT_SCHEMA)
    errors.push(`schema_version must be "${CONTRACT_SCHEMA}"`);
  if (!nonempty(contract.id)) errors.push('contract id is required');
  if (!CONTRACT_STATUSES.has(contract.status))
    errors.push(`contract status must be one of: ${[...CONTRACT_STATUSES].join(', ')}`);
  if (!nonempty(contract.initiative)) errors.push('initiative is required');

  if (!isObject(contract.candidate)) errors.push('candidate object is required');
  else {
    if (!exactRevision(contract.candidate.revision))
      errors.push('candidate.revision must be an exact, non-floating revision');
    if (!nonempty(contract.candidate.artifact))
      errors.push('candidate.artifact is required');
    if (contract.status === 'issued' && !nonempty(contract.candidate.issued_at))
      errors.push('issued contract requires candidate.issued_at');
  }

  if (!isObject(contract.reader)) errors.push('reader object is required');
  else {
    if (!nonempty(contract.reader.actor)) errors.push('reader.actor is required');
    if (!nonempty(contract.reader.outcome)) errors.push('reader.outcome is required');
    if (!IDENTITIES.has(contract.reader.identity))
      errors.push(`reader.identity must be one of: ${[...IDENTITIES].join(', ')}`);
  }

  const targets = new Map();
  if (!Array.isArray(contract.targets) || contract.targets.length === 0) {
    errors.push('targets must contain at least one review target');
  } else {
    for (const [index, target] of contract.targets.entries()) {
      if (!isObject(target)) {
        errors.push(`targets[${index}] must be an object`);
        continue;
      }
      if (!nonempty(target.id)) errors.push(`targets[${index}].id is required`);
      else if (targets.has(target.id)) errors.push(`duplicate target id "${target.id}"`);
      else targets.set(target.id, target);
      if (!TARGET_KINDS.has(target.kind))
        errors.push(`target ${target.id ?? index} kind must be one of: ${[...TARGET_KINDS].join(', ')}`);
      if (!nonempty(target.ref)) errors.push(`target ${target.id ?? index} ref is required`);
      if (!nonempty(target.ask)) errors.push(`target ${target.id ?? index} ask is required`);
      if (!TARGET_AUTHORITIES.has(target.authority))
        errors.push(`target ${target.id ?? index} authority must be one of: ${[...TARGET_AUTHORITIES].join(', ')}`);
    }
  }

  if (!isObject(contract.capture)) errors.push('capture object is required');
  else {
    if (!CAPTURE_MODES.has(contract.capture.mode))
      errors.push(`capture.mode must be one of: ${[...CAPTURE_MODES].join(', ')}`);
    if (!nonempty(contract.capture.adapter)) errors.push('capture.adapter is required');
    if (!relativePath(contract.capture.destination))
      errors.push('capture.destination must be a safe relative path');
    if (contract.capture.mode === 'self-service' && !nonempty(contract.capture.artifact))
      errors.push('self-service capture requires capture.artifact (URL, route, or mounted surface)');
    if (contract.capture.mode === 'mediated') {
      if (!nonempty(contract.capture.mediated_by))
        errors.push('mediated capture requires capture.mediated_by');
      if (!nonempty(contract.capture.reason))
        errors.push('mediated capture requires an explicit reason');
      if (contract.reader?.identity !== 'mediated')
        warns.push('capture is mediated but reader.identity is not "mediated"');
    }
  }

  if (!isObject(contract.disposition)) errors.push('disposition object is required');
  else {
    if (!nonempty(contract.disposition.owner)) errors.push('disposition.owner is required');
    if (!relativePath(contract.disposition.destination))
      errors.push('disposition.destination must be a safe relative path');
    if (!RETURN_MODES.has(contract.disposition.return_to_reader))
      errors.push(`disposition.return_to_reader must be one of: ${[...RETURN_MODES].join(', ')}`);
    const automation = contract.disposition.automation;
    if (!isObject(automation)) errors.push('disposition.automation object is required');
    else {
      if (!CLASSIFICATION_MODES.has(automation.classify))
        errors.push(`automation.classify must be one of: ${[...CLASSIFICATION_MODES].join(', ')}`);
      if (!CLASSIFICATION_MODES.has(automation.propose))
        errors.push(`automation.propose must be one of: ${[...CLASSIFICATION_MODES].join(', ')}`);
      if (!APPLY_MODES.has(automation.apply))
        errors.push(`automation.apply must be one of: ${[...APPLY_MODES].join(', ')}`);
      if (automation.apply === 'delegated' && !nonempty(automation.delegation_ref))
        errors.push('delegated automation.apply requires automation.delegation_ref');
      if (automation.apply !== 'delegated' && automation.delegation_ref != null)
        warns.push('automation.delegation_ref is ignored unless automation.apply is "delegated"');
    }
  }

  return { targets };
}

function validateSubmission(item, contract, targets, errors) {
  const s = item.value;
  const label = `submission ${item.name}`;
  if (!isObject(s)) {
    errors.push(`${label} must be an object`);
    return null;
  }
  if (s.schema_version !== SUBMISSION_SCHEMA)
    errors.push(`${label} schema_version must be "${SUBMISSION_SCHEMA}"`);
  if (!nonempty(s.id)) errors.push(`${label} id is required`);
  if (s.contract_id !== contract.id)
    errors.push(`${label} contract_id does not match review contract`);
  if (s.candidate_revision !== contract.candidate?.revision)
    errors.push(`${label} candidate_revision does not match exact reviewed candidate`);
  if (s.reader_actor !== contract.reader?.actor)
    errors.push(`${label} reader_actor does not match review contract`);
  if (!targets.has(s.target_id))
    errors.push(`${label} target_id "${s.target_id ?? ''}" is not declared`);
  if (!CATEGORIES.has(s.category))
    errors.push(`${label} category must be one of: ${[...CATEGORIES].join(', ')}`);
  if (!nonempty(s.body)) errors.push(`${label} body is required`);
  if (!nonempty(s.submitted_at)) errors.push(`${label} submitted_at is required`);
  if (!isObject(s.source) || !nonempty(s.source.adapter))
    errors.push(`${label} source.adapter is required`);
  else if (s.source.adapter !== contract.capture?.adapter)
    errors.push(`${label} source.adapter must match capture.adapter`);
  for (const field of FORBIDDEN_SUBMISSION_FIELDS)
    if (Object.prototype.hasOwnProperty.call(s, field))
      errors.push(`${label} contains forbidden authority-laundering field "${field}"`);
  return s;
}

function validateDisposition(item, contract, submissions, targets, errors, pendings) {
  const d = item.value;
  const label = `disposition ${item.name}`;
  if (!isObject(d)) {
    errors.push(`${label} must be an object`);
    return null;
  }
  if (d.schema_version !== DISPOSITION_SCHEMA)
    errors.push(`${label} schema_version must be "${DISPOSITION_SCHEMA}"`);
  if (!nonempty(d.id)) errors.push(`${label} id is required`);
  if (d.contract_id !== contract.id)
    errors.push(`${label} contract_id does not match review contract`);
  if (d.candidate_revision !== contract.candidate?.revision)
    errors.push(`${label} candidate_revision does not match exact reviewed candidate`);
  const submission = submissions.get(d.submission_id);
  if (!submission) errors.push(`${label} references unknown submission "${d.submission_id ?? ''}"`);
  if (!DISPOSITION_STATES.has(d.state))
    errors.push(`${label} state must be one of: ${[...DISPOSITION_STATES].join(', ')}`);
  if (!nonempty(d.rationale)) errors.push(`${label} rationale is required`);
  if (d.decided_by !== contract.disposition?.owner)
    errors.push(`${label} decided_by must match disposition.owner`);
  if (!Array.isArray(d.consequences) || d.consequences.length === 0) {
    errors.push(`${label} consequences must contain at least one typed consequence`);
  } else {
    for (const [index, consequence] of d.consequences.entries()) {
      if (!isObject(consequence) || !CONSEQUENCE_TYPES.has(consequence.type))
        errors.push(`${label} consequence[${index}] has unknown type`);
      else if (consequence.type !== 'none' && !nonempty(consequence.ref))
        errors.push(`${label} consequence[${index}] type ${consequence.type} requires ref`);
    }
  }
  if (d.state === 'scoped-in' && !d.consequences?.some((c) => c.type !== 'none'))
    errors.push(`${label} scoped-in state requires a non-none consequence`);

  const returned = d.return_to_reader;
  if (!isObject(returned) || !RETURN_STATES.has(returned.status)) {
    errors.push(`${label} return_to_reader.status must be one of: ${[...RETURN_STATES].join(', ')}`);
  } else {
    const required = contract.disposition?.return_to_reader === 'required';
    if (required && returned.status === 'not-required')
      errors.push(`${label} cannot mark return not-required when the contract requires it`);
    if (required && returned.status === 'pending')
      pendings.push(`${label} has not yet returned the disposition to the reader`);
    if (returned.status === 'sent') {
      if (!nonempty(returned.at))
        errors.push(`${label} returned status sent requires return_to_reader.at`);
      if (!nonempty(returned.via))
        errors.push(`${label} returned status sent requires return_to_reader.via`);
      if (!nonempty(returned.receipt))
        errors.push(`${label} returned status sent requires return_to_reader.receipt`);
    }
  }

  if (submission?.category === 'approval') {
    const target = targets.get(submission.target_id);
    const claimsConsequence =
      d.state === 'scoped-in' ||
      d.consequences?.some((c) => ['decision', 'evidence-candidate'].includes(c.type));
    if (target && !['decide', 'approve'].includes(target.authority) && claimsConsequence)
      errors.push(`${label} treats an approval submission as consequential for target authority "${target.authority}"`);
  }
  return d;
}

export function evaluateReviewLoop({
  root,
  contractPath = 'review-contract.json',
  contract: suppliedContract,
  submissions: suppliedSubmissions,
  dispositions: suppliedDispositions,
} = {}) {
  const errors = [];
  const warns = [];
  const pendings = [];
  const absRoot = resolve(root ?? process.cwd());
  const fullContractPath = resolve(absRoot, contractPath);
  const contract = suppliedContract ?? (
    existsSync(fullContractPath)
      ? readJson(fullContractPath, errors, contractPath)
      : null
  );
  if (!contract) {
    if (!errors.length) errors.push(`${contractPath} does not exist`);
    return {
      verdict: 'BLOCKED',
      errors,
      warns,
      pendings,
      counts: { targets: 0, submissions: 0, dispositions: 0, open: 0 },
    };
  }

  const { targets } = validateContract(contract, errors, warns);
  const submissionItems = suppliedSubmissions
    ? suppliedSubmissions.map((value, index) => ({ name: value.id ?? `inline-${index}`, value }))
    : readJsonDir(absRoot, contract.capture?.destination, errors, 'capture destination');
  const dispositionItems = suppliedDispositions
    ? suppliedDispositions.map((value, index) => ({ name: value.id ?? `inline-${index}`, value }))
    : readJsonDir(absRoot, contract.disposition?.destination, errors, 'disposition destination');

  const submissions = new Map();
  for (const item of submissionItems) {
    const submission = validateSubmission(item, contract, targets, errors);
    if (!submission?.id) continue;
    if (submissions.has(submission.id)) errors.push(`duplicate submission id "${submission.id}"`);
    else submissions.set(submission.id, submission);
  }

  const dispositions = new Map();
  for (const item of dispositionItems) {
    const disposition = validateDisposition(item, contract, submissions, targets, errors, pendings);
    if (!disposition?.submission_id) continue;
    if (dispositions.has(disposition.submission_id))
      errors.push(`multiple dispositions reference submission "${disposition.submission_id}"`);
    else dispositions.set(disposition.submission_id, disposition);
  }

  const open = [...submissions.keys()].filter((id) => !dispositions.has(id));
  for (const id of open) pendings.push(`submission "${id}" has no disposition`);
  if (['planned', 'ready'].includes(contract.status))
    pendings.push(`review contract is ${contract.status}, not issued`);
  if (contract.status === 'issued' && submissions.size === 0)
    pendings.push('issued review contract has no observed reader submission');
  if (contract.status === 'retired' && submissions.size === 0)
    pendings.push('retired review contract has no observed reader submission');
  if (contract.status === 'retired' && open.length > 0)
    errors.push(`retired review contract still has ${open.length} open submission(s)`);

  return {
    verdict: errors.length ? 'BLOCKED' : pendings.length ? 'PENDING' : 'PASS',
    contract,
    errors,
    warns,
    pendings,
    counts: {
      targets: targets.size,
      submissions: submissions.size,
      dispositions: dispositions.size,
      open: open.length,
    },
  };
}

function selftest() {
  let assertions = 0;
  const ok = (condition, label) => {
    assertions += 1;
    if (!condition) {
      console.error(`FAIL: ${label}`);
      process.exit(1);
    }
  };
  const root = mkdtempSync(join(tmpdir(), 'blueprint-review-loop-'));
  mkdirSync(join(root, 'feedback', 'submissions'), { recursive: true });
  mkdirSync(join(root, 'feedback', 'dispositions'), { recursive: true });

  const contract = {
    schema_version: CONTRACT_SCHEMA,
    id: 'direction-review',
    status: 'issued',
    initiative: 'fixture',
    candidate: {
      revision: 'abc123456789',
      artifact: 'https://example.test/review',
      issued_at: '2026-07-23T12:00:00Z',
    },
    reader: {
      actor: 'review-team',
      outcome: 'review-direction',
      identity: 'authenticated',
    },
    targets: [{
      id: 'direction',
      kind: 'decision',
      ref: 'decisions/0001.md',
      ask: 'Should this direction proceed?',
      authority: 'advise',
    }],
    capture: {
      mode: 'self-service',
      adapter: 'web-form',
      artifact: '/review#feedback',
      destination: 'feedback/submissions',
    },
    disposition: {
      owner: 'product-operator',
      destination: 'feedback/dispositions',
      return_to_reader: 'required',
      automation: {
        classify: 'agent-autonomous',
        propose: 'agent-autonomous',
        apply: 'human-authorized',
      },
    },
  };
  writeFileSync(join(root, 'review-contract.json'), JSON.stringify(contract, null, 2));

  let result = evaluateReviewLoop({ root });
  ok(result.verdict === 'PENDING' && result.counts.submissions === 0, 'issued contract without feedback is pending');

  const submission = {
    schema_version: SUBMISSION_SCHEMA,
    id: 'feedback-1',
    contract_id: contract.id,
    candidate_revision: contract.candidate.revision,
    reader_actor: contract.reader.actor,
    target_id: 'direction',
    category: 'question',
    body: 'How does the fallback work?',
    submitted_at: '2026-07-23T13:00:00Z',
    source: { adapter: 'web-form' },
  };
  writeFileSync(join(root, 'feedback', 'submissions', 'feedback-1.json'), JSON.stringify(submission, null, 2));
  result = evaluateReviewLoop({ root });
  ok(result.verdict === 'PENDING' && result.counts.open === 1, 'undispositioned submission is pending');

  const disposition = {
    schema_version: DISPOSITION_SCHEMA,
    id: 'disposition-1',
    contract_id: contract.id,
    submission_id: submission.id,
    candidate_revision: contract.candidate.revision,
    state: 'answered',
    rationale: 'The fallback is the approved static unit.',
    decided_by: contract.disposition.owner,
    consequences: [{ type: 'answer', ref: 'feedback/answers/fallback.md' }],
    return_to_reader: {
      status: 'sent',
      at: '2026-07-23T14:00:00Z',
      via: 'web-form',
      receipt: 'feedback/returns/feedback-1.json',
    },
  };
  writeFileSync(join(root, 'feedback', 'dispositions', 'disposition-1.json'), JSON.stringify(disposition, null, 2));
  result = evaluateReviewLoop({ root });
  ok(result.verdict === 'PASS' && result.counts.open === 0, 'closed and returned loop passes');

  const stale = { ...submission, id: 'feedback-stale', candidate_revision: 'different-revision' };
  result = evaluateReviewLoop({ root, contract, submissions: [stale], dispositions: [] });
  ok(result.verdict === 'BLOCKED' && result.errors.some((e) => e.includes('exact reviewed candidate')), 'candidate laundering blocks');

  const laundering = { ...submission, accepted: true };
  result = evaluateReviewLoop({ root, contract, submissions: [laundering], dispositions: [] });
  ok(result.verdict === 'BLOCKED' && result.errors.some((e) => e.includes('authority-laundering')), 'submission cannot set acceptance');

  const wrongAdapter = {
    ...submission,
    source: { adapter: 'copied-from-somewhere-else' },
  };
  result = evaluateReviewLoop({ root, contract, submissions: [wrongAdapter], dispositions: [] });
  ok(result.errors.some((e) => e.includes('must match capture.adapter')), 'submission provenance must match the declared adapter');

  const unreceipted = structuredClone(disposition);
  delete unreceipted.return_to_reader.receipt;
  result = evaluateReviewLoop({
    root,
    contract,
    submissions: [submission],
    dispositions: [unreceipted],
  });
  ok(result.errors.some((e) => e.includes('return_to_reader.receipt')), 'sent return requires a durable receipt');

  const noAdapter = structuredClone(contract);
  delete noAdapter.capture.artifact;
  result = evaluateReviewLoop({ root, contract: noAdapter, submissions: [], dispositions: [] });
  ok(result.errors.some((e) => e.includes('self-service capture requires')), 'self-service requires a reachable adapter');

  const mediated = structuredClone(contract);
  mediated.status = 'ready';
  mediated.reader.identity = 'mediated';
  mediated.capture = {
    mode: 'mediated',
    adapter: 'meeting-notes',
    destination: 'feedback/submissions',
    mediated_by: 'operator',
    reason: 'The reader has no authenticated write surface.',
  };
  result = evaluateReviewLoop({ root, contract: mediated, submissions: [], dispositions: [] });
  ok(
    result.verdict === 'PENDING' &&
      result.errors.length === 0 &&
      result.pendings.some((p) => p.includes('not issued')),
    'honestly mediated ready contract is structurally valid but cannot pass closure'
  );

  const delegated = structuredClone(contract);
  delegated.status = 'ready';
  delegated.disposition.automation.apply = 'delegated';
  result = evaluateReviewLoop({ root, contract: delegated, submissions: [], dispositions: [] });
  ok(result.errors.some((e) => e.includes('delegation_ref')), 'delegated apply requires authority reference');

  const approval = { ...submission, id: 'approval-1', category: 'approval' };
  const approvalDisposition = {
    ...disposition,
    id: 'approval-disposition',
    submission_id: 'approval-1',
    state: 'scoped-in',
    consequences: [{ type: 'decision', ref: 'decisions/0001.md' }],
  };
  result = evaluateReviewLoop({
    root,
    contract,
    submissions: [approval],
    dispositions: [approvalDisposition],
  });
  ok(result.errors.some((e) => e.includes('authority "advise"')), 'advisory reader cannot launder approval');

  rmSync(root, { recursive: true, force: true });
  console.log(`review-loop selftest: PASS (${assertions} assertions)`);
}

const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isEntry && process.argv.includes('--selftest')) selftest();
else if (isEntry) {
  const rootIx = process.argv.indexOf('--root');
  const root = rootIx > -1 ? process.argv[rootIx + 1] : process.cwd();
  const result = evaluateReviewLoop({ root });
  console.log(`review loop: ${result.verdict} (${result.counts.submissions} submissions, ${result.counts.dispositions} dispositions, ${result.counts.open} open)`);
  for (const error of result.errors) console.log(`  ERROR ${error}`);
  for (const pending of result.pendings) console.log(`  PEND  ${pending}`);
  for (const warn of result.warns) console.log(`  warn  ${warn}`);
  const gate = process.argv.includes('--gate');
  process.exit(result.verdict === 'BLOCKED' || (gate && result.verdict !== 'PASS') ? 1 : 0);
}
