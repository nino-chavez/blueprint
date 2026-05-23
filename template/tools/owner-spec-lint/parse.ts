import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import type { OwnerSpec, OwnerSpecFrontmatter } from './types.js';

const REPO_ROOT = process.cwd();

/** Find every OWNER-SPEC.md under tools/ and apps/ — anywhere a substrate primitive may live. */
export function findOwnerSpecs(roots: string[] = ['tools', 'apps']): string[] {
  const out: string[] = [];
  for (const root of roots) {
    const abs = join(REPO_ROOT, root);
    if (!existsSync(abs)) continue;
    walk(abs, out);
  }
  return out;
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name.startsWith('.')) continue;
    const full = join(dir, name);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walk(full, out);
    } else if (name === 'OWNER-SPEC.md') {
      out.push(full);
    }
  }
}

/** Parse minimal YAML frontmatter from an OWNER-SPEC.md. Hand-rolled — we control the shape and avoid a yaml dep. */
export function parseOwnerSpec(specPath: string): OwnerSpec | null {
  const raw = readFileSync(specPath, 'utf-8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    console.error(`[owner-spec-lint] ${specPath}: no frontmatter`);
    return null;
  }
  const yaml = fmMatch[1];
  const fm = parseSimpleYaml(yaml);

  // Validate required fields
  const required = ['tool', 'last_attested', 'max_unattested_days', 'couples_with', 'convention_version'] as const;
  for (const key of required) {
    if (!(key in fm)) {
      console.error(`[owner-spec-lint] ${specPath}: missing required field '${key}'`);
      return null;
    }
  }

  return {
    path: specPath,
    toolDir: dirname(specPath),
    frontmatter: fm as OwnerSpecFrontmatter,
  };
}

/**
 * Minimal YAML parser sufficient for OWNER-SPEC frontmatter:
 * - scalar: `key: value`
 * - integer: `key: 123` → number
 * - sequence: `key:\n  - item1\n  - item2` → string[]
 * Doesn't handle nested maps; OWNER-SPEC frontmatter doesn't need them.
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const inline = m[2];
    if (inline === '') {
      // Sequence on following lines
      const seq: string[] = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s+/)) {
        seq.push(lines[i].replace(/^\s+-\s+/, '').trim());
        i++;
      }
      out[key] = seq;
    } else {
      // Scalar
      const v = inline.trim();
      if (/^\d+$/.test(v)) {
        out[key] = parseInt(v, 10);
      } else {
        out[key] = v;
      }
      i++;
    }
  }
  return out;
}

/** Resolve a couples_with entry to a list of paths it claims to cover. */
export function resolveCoupling(entry: string): string[] {
  const abs = join(REPO_ROOT, entry);
  if (!existsSync(abs)) return [];
  const s = statSync(abs);
  if (s.isFile()) return [entry];
  if (s.isDirectory()) {
    // For directories, watch the dir as a unit — diff against the dir path string
    return [entry];
  }
  return [];
}

export function relativeFromRepoRoot(abs: string): string {
  return relative(REPO_ROOT, abs);
}
