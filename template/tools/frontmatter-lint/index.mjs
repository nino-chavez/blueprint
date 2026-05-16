#!/usr/bin/env node
// frontmatter-lint — enforces `canonical: true|false` frontmatter on docs/**/*.md
//
// Usage:
//   node tools/frontmatter-lint/index.mjs [<docs-dir>]
//
// Default docs-dir is `docs`. Exits 0 if every *.md under the dir (excluding
// rag/ and archive/) has valid `canonical: true|false` frontmatter; exits 1 if
// any file is missing the key or has an invalid value.
//
// Output:
//   <path>: <violation>
//   ...
//   N violations  (or "0 violations" on success)
//
// Source: ~/Workspace/dev/tools/big-blueprint/docs/doc-surface-discipline-pattern.md
//
// No external dependencies — uses only node:fs + node:path.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const EXCLUDED_SEGMENTS = new Set(['rag', 'archive', 'node_modules', '.git']);

/** Walk a directory tree and yield every *.md file path that isn't under an excluded segment. */
function* walkMarkdown(dir, root = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_SEGMENTS.has(entry.name)) continue;
      yield* walkMarkdown(fullPath, root);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield fullPath;
    }
  }
}

/** Parse YAML frontmatter from a string. Returns { frontmatter: object|null, hasBlock: boolean }. */
function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { frontmatter: null, hasBlock: false };
  }
  const endMarker = content.indexOf('\n---\n', 4);
  const endMarkerCrlf = content.indexOf('\n---\r\n', 4);
  const end = endMarker >= 0 ? endMarker : endMarkerCrlf;
  if (end < 0) return { frontmatter: null, hasBlock: false };
  const block = content.slice(4, end);
  const frontmatter = {};
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }
  return { frontmatter, hasBlock: true };
}

function classify(value) {
  if (value === 'true') return 'true';
  if (value === 'false') return 'false';
  return null;
}

function main() {
  const docsDir = process.argv[2] || 'docs';
  let root;
  try {
    root = statSync(docsDir).isDirectory() ? docsDir : null;
  } catch {
    root = null;
  }
  if (!root) {
    console.error(`error: ${docsDir} is not a directory`);
    process.exit(2);
  }

  const violations = [];
  for (const filePath of walkMarkdown(root)) {
    const relPath = relative(process.cwd(), filePath);
    const content = readFileSync(filePath, 'utf8');
    const { frontmatter, hasBlock } = parseFrontmatter(content);

    if (!hasBlock) {
      violations.push(`${relPath}: missing frontmatter block`);
      continue;
    }
    if (!('canonical' in frontmatter)) {
      violations.push(`${relPath}: missing 'canonical' key in frontmatter`);
      continue;
    }
    const classified = classify(frontmatter.canonical);
    if (!classified) {
      violations.push(`${relPath}: invalid 'canonical' value '${frontmatter.canonical}' (expected: true | false)`);
    }
  }

  for (const v of violations) console.log(v);
  if (violations.length === 0) {
    console.log('0 violations');
    process.exit(0);
  } else {
    console.log(`\n${violations.length} violation${violations.length === 1 ? '' : 's'}`);
    process.exit(1);
  }
}

main();
