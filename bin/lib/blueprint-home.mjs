/**
 * blueprint-home.mjs — resolve the methodology home (the dir containing
 * METHODOLOGY.md + docs/ + template/) for @nino-chavez-labs/blueprint-cli.
 *
 * Mirrors the SessionStart hook's resolution (template/.claude/hooks/
 * blueprint-session-start.py) and adds a "the CLI's own package root" probe,
 * which is the primary path for an npm-installed CLI. A candidate counts only
 * if it contains METHODOLOGY.md. Resolution order:
 *   1. $BLUEPRINT_HOME (explicit override)
 *   2. methodology_home declared in the nearest blueprint.yml (cwd or ancestors)
 *   3. the CLI's own package root (this file ships inside the methodology package)
 *   4. local dev paths (~/Workspace/dev/tools/blueprint, legacy wip/blueprint)
 * Throws BlueprintHomeError with remediation when nothing resolves.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

export class BlueprintHomeError extends Error {}

const MARKER = 'METHODOLOGY.md';

function hasMarker(dir) {
  try {
    return Boolean(dir) && existsSync(join(dir, MARKER));
  } catch {
    return false;
  }
}

function expandHome(p) {
  return p.startsWith('~') ? join(homedir(), p.slice(1)) : p;
}

/** Walk up from `start` to the filesystem root, yielding each directory. */
function* ancestors(start) {
  let dir = resolve(start);
  while (true) {
    yield dir;
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}

/** Read a top-level scalar from a blueprint.yml without a yaml dependency. */
export function readYamlScalar(ymlPath, key) {
  try {
    for (const line of readFileSync(ymlPath, 'utf8').split('\n')) {
      const s = line.trim();
      if (s.startsWith('#') || !s.includes(':')) continue;
      const idx = s.indexOf(':');
      if (s.slice(0, idx).trim() !== key) continue;
      const val = s.slice(idx + 1).split('#')[0].trim().replace(/^["']|["']$/g, '');
      return val || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function findInitiativeRoot(start) {
  for (const dir of ancestors(start)) {
    if (existsSync(join(dir, 'blueprint.yml'))) return dir;
  }
  return null;
}

/**
 * Resolve the methodology home — an absolute path containing METHODOLOGY.md.
 * @param {{ cwd?: string, env?: Record<string, string|undefined> }} [opts]
 * @returns {string}
 */
export function resolveBlueprintHome(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const env = opts.env ?? process.env;
  const candidates = [];

  // 1. explicit override
  if (env.BLUEPRINT_HOME) candidates.push(expandHome(env.BLUEPRINT_HOME));

  // 2. methodology_home in the nearest blueprint.yml
  const initRoot = findInitiativeRoot(cwd);
  if (initRoot) {
    const field = readYamlScalar(join(initRoot, 'blueprint.yml'), 'methodology_home');
    if (field) {
      const p = expandHome(field);
      candidates.push(p.startsWith('/') ? p : resolve(initRoot, p));
    }
  }

  // 3. the CLI's own package root (this file ships inside the methodology package)
  for (const dir of ancestors(dirname(fileURLToPath(import.meta.url)))) {
    if (hasMarker(dir)) {
      candidates.push(dir);
      break;
    }
  }

  // 4. local dev paths (fallback for un-pinned local sessions)
  const home = homedir();
  candidates.push(join(home, 'Workspace', 'dev', 'tools', 'blueprint'));
  candidates.push(join(home, 'Workspace', 'dev', 'wip', 'blueprint'));

  for (const c of candidates) {
    if (hasMarker(c)) return resolve(c);
  }

  throw new BlueprintHomeError(
    'Could not locate the Blueprint methodology source. Resolution order: ' +
      '$BLUEPRINT_HOME, a `methodology_home:` field in the nearest blueprint.yml, ' +
      "the CLI's own package, then local dev paths — none contained METHODOLOGY.md.\n" +
      'Fix: `export BLUEPRINT_HOME=/path/to/blueprint`, reinstall ' +
      '`npm i -g @nino-chavez-labs/blueprint-cli`, or add `methodology_home: <path>` to blueprint.yml.'
  );
}
