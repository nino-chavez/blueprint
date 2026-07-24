#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'blueprint-source-influence/0';
const RESULT_SCHEMA = 'blueprint-source-influence-result/0';
const ABSOLUTE_USER_PATH = /(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/;
const HOLDOUT_STATES = new Set(['pre-unseal', 'post-unseal']);
const SOURCE_STATUSES = new Set(['sealed', 'unsealed']);
const CONTAMINATION_STATES = new Set(['none', 'disclosed']);

export const ROLE_POLICY = Object.freeze({
  'definition-input': Object.freeze({
    phases: Object.freeze(['definition', 'research', 'design', 'decision', 'implementation', 'verification']),
    uses: Object.freeze(['definition', 'evidence', 'comparison']),
  }),
  'prior-art': Object.freeze({
    phases: Object.freeze(['research', 'design', 'decision', 'implementation', 'verification']),
    uses: Object.freeze(['prior-art', 'evidence', 'comparison']),
  }),
  holdout: Object.freeze({
    phases: Object.freeze(['research', 'decision', 'verification']),
    uses: Object.freeze(['comparison', 'challenge']),
  }),
  'receipt-only': Object.freeze({
    phases: Object.freeze(['verification', 'operation']),
    uses: Object.freeze(['receipt', 'evidence']),
  }),
});

export class SourceInfluenceError extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.name = 'SourceInfluenceError';
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

function duplicateValues(items, field) {
  const counts = new Map();
  for (const item of items) {
    if (!isObject(item) || typeof item[field] !== 'string') continue;
    counts.set(item[field], (counts.get(item[field]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateManifest(manifest, { source = '', path = '<manifest>' } = {}) {
  const errors = [];
  const add = (needle, message, occurrence) => {
    errors.push(diagnostic(path, source, needle, message, occurrence));
  };

  if (!isObject(manifest)) {
    add('{', 'source-influence manifest must be a JSON object');
    return errors;
  }
  if (manifest.schema !== SCHEMA) {
    add('"schema"', `unsupported schema ${String(manifest.schema)}; expected ${SCHEMA}`);
  }
  for (const field of ['initiative', 'as_of_revision']) {
    if (!nonEmptyString(manifest[field])) add(`"${field}"`, `${field} must be a non-empty string`);
  }
  for (const field of ['sources', 'artifacts']) {
    if (!Array.isArray(manifest[field])) add(`"${field}"`, `${field} must be an array`);
  }
  if (errors.length > 0) return errors;

  if (ABSOLUTE_USER_PATH.test(JSON.stringify(manifest))) {
    add('{', 'manifest contains an absolute user path; use repository-relative or sanitized evidence');
  }

  for (const id of duplicateValues(manifest.sources, 'id')) {
    add(`"id": "${id}"`, `duplicate source id ${id}`, 2);
  }
  for (const artifactPath of duplicateValues(manifest.artifacts, 'path')) {
    add(`"path": "${artifactPath}"`, `duplicate artifact path ${artifactPath}`, 2);
  }

  const sourcesById = new Map();
  for (const sourceRecord of manifest.sources) {
    if (!isObject(sourceRecord) || !nonEmptyString(sourceRecord.id)) {
      add('"sources"', 'every source requires a non-empty id');
      continue;
    }
    if (!sourcesById.has(sourceRecord.id)) sourcesById.set(sourceRecord.id, sourceRecord);
    if (!ROLE_POLICY[sourceRecord.role]) {
      add(`"id": "${sourceRecord.id}"`, `source ${sourceRecord.id} has unsupported role ${String(sourceRecord.role)}`);
    }
    if (!nonEmptyString(sourceRecord.locator)) {
      add(`"id": "${sourceRecord.id}"`, `source ${sourceRecord.id} requires locator`);
    }
  }

  const artifactsByPath = new Map();
  for (const artifact of manifest.artifacts) {
    if (!isObject(artifact) || !nonEmptyString(artifact.path)) {
      add('"artifacts"', 'every artifact requires a non-empty path');
      continue;
    }
    if (!artifactsByPath.has(artifact.path)) artifactsByPath.set(artifact.path, artifact);
    for (const field of ['phase', 'kind', 'revision']) {
      if (!nonEmptyString(artifact[field])) {
        add(`"path": "${artifact.path}"`, `artifact ${artifact.path} requires ${field}`);
      }
    }
    if (!HOLDOUT_STATES.has(artifact.holdout_state)) {
      add(`"path": "${artifact.path}"`, `artifact ${artifact.path} holdout_state must be pre-unseal or post-unseal`);
    }
    if (!Array.isArray(artifact.citations)) {
      add(`"path": "${artifact.path}"`, `artifact ${artifact.path} citations must be an array`);
    }
  }

  for (const sourceRecord of manifest.sources.filter((item) => item?.role === 'holdout')) {
    for (const field of ['pinned_revision', 'baseline_revision', 'comparison_artifact']) {
      if (!nonEmptyString(sourceRecord[field])) {
        add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} requires ${field}`);
      }
    }
    if (!SOURCE_STATUSES.has(sourceRecord.status)) {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} status must be sealed or unsealed`);
    }
    if (!isObject(sourceRecord.unseal_condition)
        || !nonEmptyString(sourceRecord.unseal_condition.artifact)
        || !nonEmptyString(sourceRecord.unseal_condition.revision)) {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} requires an exact unseal_condition artifact and revision`);
    }
    if (!isObject(sourceRecord.contamination)
        || !CONTAMINATION_STATES.has(sourceRecord.contamination.status)
        || !nonEmptyString(sourceRecord.contamination.detail)) {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} requires a contamination status and disclosure detail`);
    }
    if (sourceRecord.status === 'unsealed' && !nonEmptyString(sourceRecord.unsealed_at_revision)) {
      add(`"id": "${sourceRecord.id}"`, `unsealed holdout source ${sourceRecord.id} requires unsealed_at_revision`);
    }
    if (sourceRecord.status === 'sealed' && sourceRecord.unsealed_at_revision != null) {
      add(`"id": "${sourceRecord.id}"`, `sealed holdout source ${sourceRecord.id} may not declare unsealed_at_revision`);
    }

    const comparison = artifactsByPath.get(sourceRecord.comparison_artifact);
    if (!comparison) {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} comparison_artifact does not resolve`);
    } else if (comparison.kind !== 'protocol' || comparison.holdout_state !== 'pre-unseal') {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} comparison_artifact must be a pre-unseal protocol`);
    }

    const condition = artifactsByPath.get(sourceRecord.unseal_condition?.artifact);
    if (!condition) {
      add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} unseal_condition artifact does not resolve`);
    } else {
      if (condition.kind !== 'decision' || condition.holdout_state !== 'pre-unseal') {
        add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} unseal_condition must resolve to a pre-unseal decision`);
      }
      if (condition.revision !== sourceRecord.unseal_condition.revision) {
        add(`"id": "${sourceRecord.id}"`, `holdout source ${sourceRecord.id} unseal_condition revision does not match its decision artifact`);
      }
    }
  }

  for (const artifact of manifest.artifacts) {
    if (!isObject(artifact) || !Array.isArray(artifact.citations)) continue;
    for (const citation of artifact.citations) {
      if (!isObject(citation) || !nonEmptyString(citation.source) || !nonEmptyString(citation.use)) {
        add(`"path": "${artifact.path}"`, `artifact ${artifact.path} has an invalid source citation`);
        continue;
      }
      const sourceRecord = sourcesById.get(citation.source);
      if (!sourceRecord) {
        add(`"source": "${citation.source}"`, `artifact ${artifact.path} cites unknown source ${citation.source}`);
        continue;
      }
      const policy = ROLE_POLICY[sourceRecord.role];
      if (!policy) continue;
      if (!policy.phases.includes(artifact.phase)) {
        add(`"path": "${artifact.path}"`, `source role ${sourceRecord.role} does not allow phase ${artifact.phase} in ${artifact.path}`);
      }
      if (!policy.uses.includes(citation.use)) {
        add(`"path": "${artifact.path}"`, `source role ${sourceRecord.role} does not allow claim use ${citation.use} in ${artifact.path}`);
      }
      if (sourceRecord.role === 'holdout') {
        if (artifact.holdout_state === 'pre-unseal') {
          const boundary = artifact.kind === 'decision' ? 'pre-unseal decision' : 'pre-unseal artifact';
          add(`"path": "${artifact.path}"`, `holdout source ${sourceRecord.id} may not influence ${boundary} ${artifact.path}`);
        }
        if (sourceRecord.status !== 'unsealed') {
          add(`"path": "${artifact.path}"`, `holdout source ${sourceRecord.id} remains sealed and may not be cited by ${artifact.path}`);
        }
      }
    }
  }

  return errors;
}

export function evaluateManifest(manifest, context = {}) {
  const errors = validateManifest(manifest, context);
  if (errors.length > 0) throw new SourceInfluenceError(errors);
  const roleCounts = {};
  for (const role of Object.keys(ROLE_POLICY)) {
    roleCounts[role] = manifest.sources.filter((sourceRecord) => sourceRecord.role === role).length;
  }
  return {
    schema: RESULT_SCHEMA,
    initiative: manifest.initiative,
    as_of_revision: manifest.as_of_revision,
    status: 'VALID',
    sources: manifest.sources.length,
    artifacts: manifest.artifacts.length,
    citations: manifest.artifacts.reduce(
      (total, artifact) => total + artifact.citations.length,
      0,
    ),
    role_counts: roleCounts,
    holdouts: manifest.sources
      .filter((sourceRecord) => sourceRecord.role === 'holdout')
      .map((sourceRecord) => ({
        id: sourceRecord.id,
        status: sourceRecord.status,
        pinned_revision: sourceRecord.pinned_revision,
        baseline_revision: sourceRecord.baseline_revision,
        comparison_artifact: sourceRecord.comparison_artifact,
        unsealed_at_revision: sourceRecord.unsealed_at_revision ?? null,
        contamination: sourceRecord.contamination.status,
      })),
  };
}

export function evaluateFile(inputPath) {
  const path = resolve(inputPath);
  const source = readFileSync(path, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch (error) {
    throw new SourceInfluenceError([
      `${displayPath(path)}:1: invalid JSON: ${error.message}`,
    ]);
  }
  return evaluateManifest(manifest, { source, path });
}

export function resultJson(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}

function parseArgs(argv) {
  const input = argv.find((arg) => !arg.startsWith('--'))
    ?? argv.find((arg) => arg.startsWith('--input='))?.slice('--input='.length);
  if (!input) throw new Error('usage: source-influence.mjs <manifest.json>');
  return { input };
}

async function main() {
  const { input } = parseArgs(process.argv.slice(2));
  const result = evaluateFile(input);
  process.stdout.write(
    `${result.initiative}: ${result.status}; sources=${result.sources}; `
    + `artifacts=${result.artifacts}; citations=${result.citations}; `
    + `holdouts=${result.holdouts.length}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
