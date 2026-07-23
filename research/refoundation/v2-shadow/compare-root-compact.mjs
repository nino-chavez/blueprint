#!/usr/bin/env node

// Compares Blueprint's explicit root shadow with the same root contract
// authored through the compact compiler. Source-version fingerprints and
// generated receipt IDs differ by adapter and are normalized; semantic fields
// and derived states remain in the comparison.

import { isDeepStrictEqual } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERATED = resolve(HERE, 'generated');
const CONSUMERS = resolve(GENERATED, 'consumers');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function replaceCurrent(value, sourceVersion) {
  if (value === sourceVersion) return '$CURRENT_SOURCE_VERSION';
  if (Array.isArray(value)) return value.map((entry) => replaceCurrent(entry, sourceVersion));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceCurrent(entry, sourceVersion)]));
  }
  return value;
}

function actor(value) {
  return {
    id: value.id,
    kinds: [...value.kinds].sort(),
    authority: [...value.authority].sort(),
  };
}

function claim(value, sourceVersion) {
  return replaceCurrent({
    id: value.id,
    statement: value.statement,
    charter_revision: value.charter_revision,
    scope: value.scope,
    owner: value.owner,
    depends_on: value.depends_on,
    evidence_requirement: value.evidence_requirement,
  }, sourceVersion);
}

function receipt(value, sourceVersion) {
  return replaceCurrent({
    claim: value.claim,
    result: value.result,
    object: value.object,
    oracle: value.oracle,
    observer: value.observer,
    scope: value.scope,
    source_version: value.source_version,
    observed_at: value.observed_at,
  }, sourceVersion);
}

function semanticProjection(value) {
  const sourceVersion = value.adapter_metadata.source_version;
  return {
    initiative: value.initiative,
    as_of: value.as_of,
    current_charter_revision: value.current_charter_revision,
    charters: value.charters.map((entry) => ({
      revision: entry.revision,
      intent: entry.intent,
      scope: entry.scope,
      actors: entry.actors.map(actor),
    })),
    claims: value.claims.map((entry) => claim(entry, sourceVersion)).sort((a, b) => a.id.localeCompare(b.id)),
    receipts: value.receipts.map((entry) => receipt(entry, sourceVersion)).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    dispositions: value.dispositions,
    checkpoints: value.checkpoints,
    modules: value.modules,
  };
}

function stateProjection(report) {
  return {
    claims: Object.fromEntries(Object.entries(report.kernel.claims).map(([id, entry]) => [id, entry.state])),
    checkpoints: Object.fromEntries(Object.entries(report.kernel.checkpoints).map(([id, entry]) => [id, entry.state])),
  };
}

const explicit = readJson(resolve(GENERATED, 'normalized.json'));
const compact = readJson(resolve(CONSUMERS, 'blueprint-self-compact.normalized.json'));
const explicitReport = readJson(resolve(GENERATED, 'shadow-report.json'));
const compactReport = readJson(resolve(CONSUMERS, 'blueprint-self-compact.shadow-report.json'));

const semanticEqual = isDeepStrictEqual(semanticProjection(explicit), semanticProjection(compact));
const statesEqual = isDeepStrictEqual(stateProjection(explicitReport), stateProjection(compactReport));
const kernelValid = compactReport.kernel.errors.length === 0;
const explicitLines = explicitReport.authoring.overlay_nonblank_lines;
const compactLines = compactReport.authoring.source_nonblank_lines;
const reductionPercent = Math.round((1 - compactLines / explicitLines) * 1000) / 10;
const passed = semanticEqual && statesEqual && kernelValid;

const output = {
  schema: 'blueprint-v2-root-compact-comparison/1',
  verdict: passed ? 'PASS' : 'FAIL',
  initiative: 'blueprint-self',
  semantic_equal: semanticEqual,
  states_equal: statesEqual,
  compact_kernel_valid: kernelValid,
  explicit_overlay_lines: explicitLines,
  compact_source_lines: compactLines,
  reduction_percent: reductionPercent,
  comparison_boundary: 'root charter, claim contracts, normalized receipt semantics, dispositions, checkpoints, modules, and derived states; adapter provenance, generated receipt IDs, and concrete current-checkout fingerprints excluded',
};

const markdown = `# Blueprint root compact dogfood\n\nVerdict: **${output.verdict}**. The compact root contract ${semanticEqual ? 'preserves' : 'does not preserve'} the explicit shadow semantics and derived states are ${statesEqual ? 'equal' : 'different'}.\n\n| Semantic projection | Derived states | Compact kernel | Explicit lines | Compact lines | Reduction |\n|---|---|---|---:|---:|---:|\n| ${semanticEqual ? 'equal' : 'DIFF'} | ${statesEqual ? 'equal' : 'DIFF'} | ${kernelValid ? 'valid' : 'BLOCKED'} | ${explicitLines} | ${compactLines} | ${reductionPercent}% |\n\nThe comparison excludes adapter/compiler provenance, generated receipt IDs, and the different concrete encodings of the current dirty-checkout fingerprint. It retains the receipt result, object, oracle, observer, scope, observation time, and current-version relationship.\n`;

writeFileSync(resolve(GENERATED, 'root-compact-comparison.json'), `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(resolve(GENERATED, 'root-compact-comparison.md'), markdown);
console.log(`${output.verdict}: root compact semantics=${semanticEqual ? 'equal' : 'DIFF'} states=${statesEqual ? 'equal' : 'DIFF'}; ${explicitLines} -> ${compactLines} lines (${reductionPercent}% reduction)`);
if (!passed) process.exitCode = 1;
