// Research reproduction only. Does not install or implement a proposed gate.
// Temporary fixtures and the result stay inside this isolated research directory.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deriveStageStatus } from '../../template/tools/lib/stage-model.mjs';
import review from '../../template/.claude/agents/blueprint/reviewers/doc-quality-auditor.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const fixture = mkdtempSync(join(here, '.probe-'));
const rows = [];
const put = (p, text) => {
  mkdirSync(dirname(join(fixture, p)), { recursive: true });
  writeFileSync(join(fixture, p), text);
};
const stage = id => deriveStageStatus({ root: fixture }).stages.find(s => s.id === id);
const check = (condition, explanation) => { if (!condition) throw new Error(explanation); };
try {
  put('blueprint.yml', 'variant: greenfield\n');
  rows.push({ case: 'no-design-or-decision', documents: stage(5), handoff: stage(8) });
  check(stage(5).gates[0].state !== 'pass', 'Missing decisions must be detected.');

  put('decisions/0001-stack.md', '# Choose a managed stack\n\nThe application uses a managed database and server rendering.\n');
  const onlyStack = await review({ targetDir: fixture });
  rows.push({ case: 'stack-decision-only', documents: stage(5), documentReview: onlyStack });
  check(stage(5).gates[0].state === 'pass', 'Expected the existing decision-presence gate to pass.');
  check(onlyStack.status === 'PASS', 'Expected the attribution reviewer to pass outside its deliverable scope.');

  put('docs/prd.md', '# Private answers\n\nOnly the authorized respondent may update their answer.\n');
  put('docs/technical-design.md', '# Proposed save\n\nEvery signed-in person may overwrite any answer without an ownership check.\n');
  const contradictory = await review({ targetDir: fixture });
  rows.push({ case: 'contradictory-permissions', documents: stage(5), documentReview: contradictory });
  check(contradictory.status === 'PASS', 'Expected semantic contradiction to remain outside the mechanical reviewer.');

  put('docs/content/figures.md', '# Sample analysis\n\n59% are invoice inquiries.\n\n84.7% of cases are uncategorized.\n');
  const inScope = await review({ targetDir: fixture });
  rows.push({ case: 'known-in-scope-attribution-defect', documentReview: inScope });
  check(inScope.status === 'BLOCKED', 'The reviewer must reject a defect it is designed to detect.');

  put('actor-output.yml', 'actors:\n  - id: build-team\n    kind: team\n    outcomes:\n      - id: receive-handoff\n        success: { statement: receives implementation contract }\n');
  rows.push({ case: 'receiving-actor-without-handoff', handoff: stage(8) });
  check(stage(8).gates[0].state === 'absent', 'A receiving actor must require a handoff declaration.');
  put('docs/handoff.md', '# Build handoff\n\nUse the selected stack.\n');
  put('actor-output.yml', 'actors:\n  - id: build-team\n    kind: team\n    outcomes:\n      - id: receive-handoff\n        success: { statement: receives implementation contract }\noutputs:\n  - id: build-contract\n    type: handoff-manifest\n    serves: [build-team.receive-handoff]\n    status: ready\n    artifact: docs/handoff.md\n');
  rows.push({ case: 'handoff-without-feature-contracts', handoff: stage(8) });
  check(stage(8).gates[0].state === 'pass', 'Expected declaration-level handoff gate to pass.');

  const sources = ['template/tools/lib/stage-model.mjs', 'template/.claude/agents/blueprint/reviewers/doc-quality-auditor.mjs'];
  const result = {
    observedAt: new Date().toISOString(),
    scope: 'Stage 5 and Stage 8 individual gates plus the mechanical document reviewer; not full advancement, doctor, actor-output validation, or runtime acceptance.',
    sources: Object.fromEntries(sources.map(p => [p, createHash('sha256').update(readFileSync(join(repo, p))).digest('hex')])),
    negativeControls: ['no decision detected', 'in-scope attribution defect blocked', 'receiving actor without handoff detected'],
    rows,
  };
  writeFileSync(join(here, 'current-gates.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('Current-gate research reproduction passed; narrow coverage and deliberate defects recorded in current-gates.json.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
