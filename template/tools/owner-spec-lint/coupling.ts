#!/usr/bin/env tsx
/**
 * Per-PR coupling check.
 *
 * Reads the diff between BASE_SHA and HEAD_SHA (env vars; CI passes them).
 * For each OWNER-SPEC found in the repo:
 *   - Determine its watched paths (the tool dir + couples_with entries)
 *   - If any watched path appears in the diff AND the OWNER-SPEC itself doesn't,
 *     emit a warning
 *
 * Warning, not error — small fixes (typo, test add) shouldn't require OWNER-SPEC churn.
 * Surfaces in the PR via GH Actions annotation; operator decides per-case.
 */

import { execSync } from 'node:child_process';
import { findOwnerSpecs, parseOwnerSpec, relativeFromRepoRoot } from './parse.js';
import type { CouplingFinding } from './types.js';

const BASE_SHA = process.env.BASE_SHA || process.env.GITHUB_BASE_REF || 'origin/main';
const HEAD_SHA = process.env.HEAD_SHA || process.env.GITHUB_SHA || 'HEAD';

function getChangedFiles(): string[] {
  try {
    const out = execSync(`git diff --name-only --diff-filter=ACMR ${BASE_SHA} ${HEAD_SHA}`, {
      encoding: 'utf-8',
    });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('[owner-spec-lint:coupling] git diff failed:', (e as Error).message);
    return [];
  }
}

function pathTouched(touchPath: string, changedFiles: string[]): boolean {
  // Treat couples_with entries as either file paths or directory prefixes
  const normalized = touchPath.replace(/\/$/, '');
  return changedFiles.some(
    (f) => f === normalized || f.startsWith(normalized + '/'),
  );
}

function main(): void {
  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    console.log('[owner-spec-lint:coupling] no changed files; nothing to check');
    return;
  }

  const specPaths = findOwnerSpecs();
  const findings: CouplingFinding[] = [];

  for (const specPath of specPaths) {
    const spec = parseOwnerSpec(specPath);
    if (!spec) continue;

    const specRel = relativeFromRepoRoot(spec.path);
    const toolDirRel = relativeFromRepoRoot(spec.toolDir);
    const watched = [toolDirRel, ...spec.frontmatter.couples_with];
    const touched = watched.filter((w) => pathTouched(w, changedFiles));
    if (touched.length === 0) continue;

    const specTouched = changedFiles.includes(specRel);
    if (specTouched) continue; // OWNER-SPEC was updated alongside; no warning

    findings.push({
      tool: spec.frontmatter.tool,
      spec_path: specRel,
      touched_files: touched,
      spec_touched: false,
    });
  }

  if (findings.length === 0) {
    console.log('[owner-spec-lint:coupling] OK — all touched substrate has its OWNER-SPEC updated, or no OWNER-SPEC watched paths changed');
    return;
  }

  // GitHub Actions warning format
  for (const f of findings) {
    const detail = `OWNER-SPEC drift candidate: this PR touched ${f.touched_files.join(', ')} but did not update ${f.spec_path}. Per the OWNER-SPEC convention (docs/methodology/owner-spec-convention.md), consider bumping last_attested or updating the relevant sections.`;
    console.log(`::warning file=${f.spec_path}::${detail}`);
  }

  // Emit a structured summary for downstream consumers
  console.log('');
  console.log('=== OWNER-SPEC coupling findings ===');
  for (const f of findings) {
    console.log(`- ${f.tool} (${f.spec_path})`);
    console.log(`  touched: ${f.touched_files.join(', ')}`);
  }
  console.log('');
  console.log('This is a warning, not a block. Convention: docs/methodology/owner-spec-convention.md');

  // Exit 0 — warning only. Per-PR check is not blocking by design.
  process.exit(0);
}

main();
