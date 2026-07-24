#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROLE_POLICY,
  SourceInfluenceError,
  evaluateFile,
  evaluateManifest,
  resultJson,
} from './source-influence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, 'fixtures', 'adaptive-holdout.json');
const base = JSON.parse(readFileSync(FIXTURE, 'utf8'));
let assertions = 0;
let failures = 0;

function check(condition, label) {
  assertions += 1;
  if (condition) process.stdout.write(`ok ${label}\n`);
  else {
    failures += 1;
    process.stderr.write(`not ok ${label}\n`);
  }
}

function equal(actual, expected, label) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}${JSON.stringify(actual) === JSON.stringify(expected) ? '' : ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
  );
}

function caught(manifest, label) {
  let error = null;
  try {
    evaluateManifest(manifest, {
      source: JSON.stringify(manifest, null, 2),
      path: join(HERE, 'fixtures', label),
    });
  } catch (candidate) {
    error = candidate;
  }
  return error;
}

const valid = evaluateFile(FIXTURE);
equal(valid.status, 'VALID', 'sanitized adaptive holdout fixture is valid');
equal(valid.role_counts, {
  'definition-input': 1,
  'prior-art': 1,
  holdout: 1,
  'receipt-only': 1,
}, 'all four source roles remain visible');
equal(valid.holdouts[0].baseline_revision, 'independent-baseline', 'holdout result retains exact independent baseline');
equal(valid.holdouts[0].pinned_revision, 'holdout-revision', 'holdout result retains exact pinned revision');
equal(
  resultJson(valid),
  resultJson(evaluateFile(FIXTURE)),
  'source-influence result is byte-deterministic',
);
check(!/(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/.test(resultJson(valid)), 'result contains no absolute user path');

const preUnsealDecision = structuredClone(base);
preUnsealDecision.artifacts.find(
  (artifact) => artifact.path === 'decisions/0004-local-direction.md',
).citations.push({ source: 'late-poc', use: 'comparison' });
const preUnsealDecisionError = caught(preUnsealDecision, 'pre-unseal-decision.json');
check(preUnsealDecisionError instanceof SourceInfluenceError, 'pre-unseal holdout decision is rejected');
check(
  preUnsealDecisionError?.message.includes('may not influence pre-unseal decision decisions/0004-local-direction.md'),
  'pre-unseal decision reports the contamination boundary',
);

for (const field of [
  'pinned_revision',
  'baseline_revision',
  'comparison_artifact',
  'unseal_condition',
  'contamination',
]) {
  const missingField = structuredClone(base);
  delete missingField.sources.find((source) => source.id === 'late-poc')[field];
  const error = caught(missingField, `missing-${field}.json`);
  check(error instanceof SourceInfluenceError, `holdout missing ${field} is rejected`);
  check(error?.message.includes(`requires ${field === 'unseal_condition' ? 'an exact unseal_condition' : field === 'contamination' ? 'a contamination status' : field}`), `holdout missing ${field} reports its contract`);
}

const stillSealed = structuredClone(base);
const sealedSource = stillSealed.sources.find((source) => source.id === 'late-poc');
sealedSource.status = 'sealed';
delete sealedSource.unsealed_at_revision;
const sealedError = caught(stillSealed, 'sealed-post-comparison.json');
check(
  sealedError?.message.includes('remains sealed and may not be cited'),
  'post-unseal comparison is rejected while the holdout remains sealed',
);

const definitionUse = structuredClone(base);
definitionUse.artifacts.find(
  (artifact) => artifact.path === 'research/prior-art/late-poc-post-validation.md',
).citations[0].use = 'definition';
const definitionUseError = caught(definitionUse, 'holdout-as-definition.json');
check(
  definitionUseError?.message.includes('source role holdout does not allow claim use definition'),
  'unsealed holdout cannot be relabeled as definition input',
);

const receiptAsDefinition = structuredClone(base);
receiptAsDefinition.artifacts.find(
  (artifact) => artifact.path === 'docs/charter.md',
).citations.push({ source: 'sandbox-observation', use: 'definition' });
const receiptAsDefinitionError = caught(receiptAsDefinition, 'receipt-as-definition.json');
check(
  receiptAsDefinitionError?.message.includes('source role receipt-only does not allow phase definition'),
  'receipt-only source cannot influence the definition phase',
);
check(
  receiptAsDefinitionError?.message.includes('source role receipt-only does not allow claim use definition'),
  'receipt-only source cannot be assigned a definition claim use',
);

const undisclosedContamination = structuredClone(base);
undisclosedContamination.sources.find(
  (source) => source.id === 'late-poc',
).contamination.detail = '';
check(
  caught(undisclosedContamination, 'empty-contamination.json')?.message.includes('requires a contamination status and disclosure detail'),
  'contamination disclosure cannot be empty',
);

const wrongUnsealRevision = structuredClone(base);
wrongUnsealRevision.sources.find(
  (source) => source.id === 'late-poc',
).unseal_condition.revision = 'different-decision';
check(
  caught(wrongUnsealRevision, 'wrong-unseal-revision.json')?.message.includes('unseal_condition revision does not match'),
  'unseal condition is bound to the exact decision revision',
);

const unsafe = structuredClone(base);
unsafe.sources[0].locator = '/Users/example/private/idea.html';
check(
  caught(unsafe, 'unsafe-path.json')?.message.includes('manifest contains an absolute user path'),
  'absolute user paths are rejected',
);

equal(
  Object.keys(ROLE_POLICY),
  ['definition-input', 'prior-art', 'holdout', 'receipt-only'],
  'role policy has no implicit fifth source role',
);

if (failures > 0) {
  process.stderr.write(`\nFAIL source-influence self-test (${failures} failures, ${assertions} assertions).\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\nPASS source-influence self-test (${assertions} assertions).\n`);
}
