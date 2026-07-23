#!/usr/bin/env node

// Proves that compact authoring changes author burden, not K1 semantics.
// Compares the explicit-overlay and compact-compiled normalized projections for
// each consumer after removing only recipe/compiler provenance and receipt IDs.

import { isDeepStrictEqual } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONSUMERS = resolve(HERE, 'generated/consumers');
const OUTPUT_JSON = resolve(HERE, 'generated/compact-comparison.json');
const OUTPUT_MD = resolve(HERE, 'generated/compact-comparison.md');
const NAMES = ['film-room', 'fleet-observability', 'bc-subscriptions'];
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function actor(value) {
  return { id: value.id, kinds: value.kinds, authority: value.authority };
}

function claim(value) {
  return {
    id: value.id,
    statement: value.statement,
    charter_revision: value.charter_revision,
    scope: value.scope,
    owner: value.owner,
    depends_on: value.depends_on,
    evidence_requirement: value.evidence_requirement,
  };
}

function receipt(value) {
  return {
    claim: value.claim,
    result: value.result,
    object: value.object,
    oracle: value.oracle,
    observer: value.observer,
    scope: value.scope,
    source_version: value.source_version,
    observed_at: value.observed_at,
  };
}

function semanticProjection(value) {
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
    claims: value.claims.map(claim).sort((a, b) => a.id.localeCompare(b.id)),
    receipts: value.receipts.map(receipt).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
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

const cases = [];
let failed = false;
for (const name of NAMES) {
  const baseline = readJson(resolve(CONSUMERS, `${name}.normalized.json`));
  const compact = readJson(resolve(CONSUMERS, `${name}-compact.normalized.json`));
  const baselineReport = readJson(resolve(CONSUMERS, `${name}.shadow-report.json`));
  const compactReport = readJson(resolve(CONSUMERS, `${name}-compact.shadow-report.json`));
  const semanticEqual = isDeepStrictEqual(semanticProjection(baseline), semanticProjection(compact));
  const statesEqual = isDeepStrictEqual(stateProjection(baselineReport), stateProjection(compactReport));
  const kernelValid = compactReport.kernel.errors.length === 0;
  const baselineLines = baselineReport.authoring.overlay_nonblank_lines;
  const compactLines = compactReport.authoring.source_nonblank_lines;
  const reductionPercent = Math.round((1 - compactLines / baselineLines) * 1000) / 10;
  const passed = semanticEqual && statesEqual && kernelValid;
  if (!passed) failed = true;
  cases.push({
    initiative: name,
    passed,
    semantic_equal: semanticEqual,
    states_equal: statesEqual,
    compact_kernel_valid: kernelValid,
    explicit_overlay_lines: baselineLines,
    compact_source_lines: compactLines,
    reduction_percent: reductionPercent,
    claims: Object.keys(compactReport.kernel.claims).length,
    receipts: compactReport.authoring.normalized_records.receipts,
  });
}

const totals = cases.reduce((result, entry) => ({
  explicit_overlay_lines: result.explicit_overlay_lines + entry.explicit_overlay_lines,
  compact_source_lines: result.compact_source_lines + entry.compact_source_lines,
}), { explicit_overlay_lines: 0, compact_source_lines: 0 });
totals.reduction_percent = Math.round((1 - totals.compact_source_lines / totals.explicit_overlay_lines) * 1000) / 10;

const output = {
  schema: 'blueprint-v2-compact-comparison/1',
  verdict: failed ? 'FAIL' : 'PASS',
  comparison_boundary: 'charters, claim contracts, normalized receipt semantics, dispositions, checkpoints, modules, and derived states; compiler provenance and receipt IDs excluded',
  cases,
  totals,
};

const lines = [
  '# Blueprint compact authoring comparison',
  '',
  `Verdict: **${output.verdict}**. Generated evidence; rerun \`node research/refoundation/v2-shadow/compare-compact.mjs\`.`,
  '',
  '| Consumer | Semantic projection | Derived states | Explicit lines | Compact lines | Reduction |',
  '|---|---|---|---:|---:|---:|',
  ...cases.map((entry) => `| ${entry.initiative} | ${entry.semantic_equal ? 'equal' : 'DIFF'} | ${entry.states_equal ? 'equal' : 'DIFF'} | ${entry.explicit_overlay_lines} | ${entry.compact_source_lines} | ${entry.reduction_percent}% |`),
  `| **Total** |  |  | **${totals.explicit_overlay_lines}** | **${totals.compact_source_lines}** | **${totals.reduction_percent}%** |`,
  '',
  'The comparison excludes only recipe/compiler provenance and receipt IDs. It retains charter intent/scope/authority, claim statements and compatibility contracts, normalized receipt observations, dispositions, checkpoints, modules, and all derived claim/checkpoint states.',
  '',
];

mkdirSync(dirname(OUTPUT_JSON), { recursive: true });
writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(OUTPUT_MD, `${lines.join('\n')}\n`);
console.log(`${output.verdict}: ${cases.filter((entry) => entry.passed).length}/${cases.length} compact projections preserve semantics; ${totals.explicit_overlay_lines} -> ${totals.compact_source_lines} lines (${totals.reduction_percent}% reduction)`);
if (failed) process.exitCode = 1;
