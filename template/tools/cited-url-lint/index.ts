#!/usr/bin/env node
/**
 * cited-url-lint — verifies that HTTP(S) URLs cited in markdown under docs/
 * actually resolve. Catches the failure mode where prose claims point to
 * fabricated, stale, or wrong-format documentation URLs.
 *
 * Usage (from the root of the project whose markdown you are checking):
 *   npx tsx tools/cited-url-lint/index.ts [directory]
 *   npx tsx $BLUEPRINT_HOME/template/tools/cited-url-lint/index.ts [directory]
 *   ... --offline          # skip network, lint cache only
 *   ... --fail-on-empty    # exit 3 when nothing was checked
 *
 * Relative paths resolve against the working directory, never against where
 * this file lives: <directory>, its default, .cited-url-lint-allowlist, and
 * the file paths in the report. So one copy (the template's, for an
 * initiative that was not stamped with it) can lint any project run from that
 * project's root. The summary line prints the absolute directory scanned.
 *
 * By default, <directory> is "docs/architecture" (highest-risk citation
 * surface). Pass another directory to widen scope. Plain "docs/" works but is
 * slow on first run because no URL cache exists yet.
 *
 * Allowlist:
 *   Files listed in .cited-url-lint-allowlist (one URL per line, or one
 *   markdown-relative-path per line) are exempt. URLs starting with
 *   "allow-url:" skip per-URL; bare paths skip per-file.
 *
 * Cache:
 *   `.url-cache.json` beside this file stores {url, status, checked_at}. It
 *   is keyed by URL alone, so every project run through this copy shares it.
 *   Cache entries are reused if checked within the last 7 days. Bump
 *   --max-cache-age-days to override.
 *
 * Exit codes:
 *   0 — 0 broken URLs (or all broken URLs are allowed); also when nothing was
 *       checked, which the output says in place of "clean"
 *   1 — at least one broken URL outside the allowlist
 *   2 — invocation error (unknown flag, more than one directory, bad
 *       --max-cache-age-days, no markdown files under <directory>)
 *   3 — nothing was checked and --fail-on-empty was passed
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_PATH = join(__dirname, '.url-cache.json');
const ALLOWLIST_FILE = '.cited-url-lint-allowlist';
const DEFAULT_TARGET = 'docs/architecture';
const REQUEST_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Citation {
  url: string;
  file: string;
  line: number;
}

interface CacheEntry {
  status: number | 'error';
  error?: string;
  checked_at: string;
}

interface Cache {
  [url: string]: CacheEntry;
}

interface Allowlist {
  urls: Set<string>;
  files: Set<string>;
}

interface Violation {
  url: string;
  file: string;
  line: number;
  status: number | 'error';
  error?: string;
}

export interface RunContext {
  /** Base for every relative path: <directory>, the allowlist, report paths. */
  cwd: string;
  cachePath?: string;
  log?: (line: string) => void;
  err?: (line: string) => void;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Options {
  offline: boolean;
  failOnEmpty: boolean;
  maxCacheAgeDays: number;
  target: string;
}

class UsageError extends Error {}

// A flag this parser does not know is an error, not a no-op: a misspelled
// --fail-on-empty that was silently dropped would switch the gate off.
function parseArgs(args: string[]): Options {
  const opts: Options = { offline: false, failOnEmpty: false, maxCacheAgeDays: 7, target: DEFAULT_TARGET };
  const positional: string[] = [];
  for (const a of args) {
    if (a === '--offline') opts.offline = true;
    else if (a === '--fail-on-empty') opts.failOnEmpty = true;
    else if (a.startsWith('--max-cache-age-days=')) {
      opts.maxCacheAgeDays = Number(a.slice('--max-cache-age-days='.length));
      if (!Number.isFinite(opts.maxCacheAgeDays) || opts.maxCacheAgeDays < 0) {
        throw new UsageError(`${a} is not a non-negative number of days`);
      }
    } else if (a.startsWith('--')) {
      throw new UsageError(`unknown flag ${a} (known: --offline, --fail-on-empty, --max-cache-age-days=N)`);
    } else positional.push(a);
  }
  if (positional.length > 1) {
    throw new UsageError(`expected one directory, got ${positional.length}: ${positional.join(' ')}`);
  }
  opts.target = positional[0] ?? DEFAULT_TARGET;
  return opts;
}

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

function loadAllowlist(path: string): Allowlist {
  const out: Allowlist = { urls: new Set(), files: new Set() };
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('allow-url:')) {
      out.urls.add(line.slice('allow-url:'.length).trim());
    } else {
      out.files.add(line);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

function loadCache(path: string): Cache {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(path: string, cache: Cache): void {
  writeFileSync(path, JSON.stringify(cache, null, 2));
}

function cacheFresh(entry: CacheEntry, maxAgeDays: number): boolean {
  const ageMs = Date.now() - new Date(entry.checked_at).getTime();
  return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Markdown walk + URL extraction
// ---------------------------------------------------------------------------

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.worktrees')) continue;
      out.push(...walkMarkdown(full));
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

// Matches markdown link syntax + bare URLs. Excludes anchors-only (#foo).
// Captures: [text](url), <url>, and bare http(s)://… URLs.
const URL_RE = /\bhttps?:\/\/[^\s)>\]]+/g;

function extractCitations(file: string, baseDir: string): Citation[] {
  const text = readFileSync(file, 'utf8');
  const citations: Citation[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let m: RegExpExecArray | null;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(lines[i])) !== null) {
      // Strip trailing punctuation that's not really part of the URL.
      let url = m[0].replace(/[.,;:!?'"`]+$/, '');
      // Skip templated URLs (placeholder syntax: {foo}, :foo, <foo>, ...).
      // These are API shape illustrations, not resolvable citations.
      // Runs after the strip, so a trailing "..." is checked, not skipped:
      // OWNER-SPEC.md field note (a) has why that order stays.
      if (/[{<]|\b:[A-Za-z_]/.test(url) || url.includes('...')) continue;
      citations.push({
        url,
        file: relative(baseDir, file),
        line: i + 1,
      });
    }
  }
  return citations;
}

// ---------------------------------------------------------------------------
// URL checking
// ---------------------------------------------------------------------------

async function checkUrl(url: string): Promise<CacheEntry> {
  const checked_at = new Date().toISOString();
  try {
    // HEAD first to skip the body. Some servers fail HEAD but serve GET
    // (measured 2026-09-25: salesforce.com HEAD 500, northdata.com HEAD 404,
    // both GET 200), and a reader's browser sends GET — so any HEAD failure
    // is retried as GET. Each request gets its own timeout.
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (res.status >= 400) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    }
    return { status: res.status, checked_at };
  } catch (e) {
    return { status: 'error', error: (e as Error).message, checked_at };
  }
}

function isBroken(entry: CacheEntry): boolean {
  if (entry.status === 'error') return true;
  if (typeof entry.status === 'number' && entry.status >= 400) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function run(args: string[], ctx: RunContext): Promise<number> {
  const log = ctx.log ?? ((line: string) => console.log(line));
  const err = ctx.err ?? ((line: string) => console.error(line));
  const cachePath = ctx.cachePath ?? CACHE_PATH;

  let opts: Options;
  try {
    opts = parseArgs(args);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    err(`cited-url-lint: ${e.message}`);
    return 2;
  }

  const absTarget = resolve(ctx.cwd, opts.target);
  const files = walkMarkdown(absTarget);
  if (files.length === 0) {
    err(`cited-url-lint: no markdown files found under ${absTarget}`);
    return 2;
  }

  const allowlist = loadAllowlist(join(ctx.cwd, ALLOWLIST_FILE));
  const cache = loadCache(cachePath);

  const allCitations: Citation[] = [];
  for (const f of files) {
    const rel = relative(ctx.cwd, f);
    if (allowlist.files.has(rel)) continue;
    allCitations.push(...extractCitations(f, ctx.cwd));
  }

  // Dedupe URLs we need to check.
  const uniqueUrls = new Set<string>();
  for (const c of allCitations) {
    if (allowlist.urls.has(c.url)) continue;
    uniqueUrls.add(c.url);
  }

  log(
    `cited-url-lint: ${files.length} files, ${allCitations.length} citations, ${uniqueUrls.size} unique URLs under ${absTarget}`
  );

  // Check each URL (with cache). Every unique URL lands in exactly one count.
  // Offline, a stale entry is still the verdict used, so it counts as cached.
  let checked = 0;
  let fromCache = 0;
  let unchecked = 0;
  for (const url of uniqueUrls) {
    const cached = cache[url];
    if (cached && (opts.offline || cacheFresh(cached, opts.maxCacheAgeDays))) {
      fromCache++;
      continue;
    }
    if (opts.offline) {
      unchecked++;
      continue;
    }
    err(`  checking ${url}`);
    cache[url] = await checkUrl(url);
    checked++;
    // small throttle to avoid hammering hosts
    await new Promise((r) => setTimeout(r, 50));
  }

  if (checked > 0) saveCache(cachePath, cache);

  const notChecked = unchecked > 0 ? `, ${unchecked} not checked (--offline, no cached result)` : '';
  log(`cited-url-lint: ${fromCache} from cache, ${checked} freshly checked${notChecked}`);

  // Aggregate violations.
  const violations: Violation[] = [];
  for (const c of allCitations) {
    if (allowlist.urls.has(c.url)) continue;
    const entry = cache[c.url];
    if (!entry) continue; // offline + not cached — counted as not checked above
    if (isBroken(entry)) {
      violations.push({
        url: c.url,
        file: c.file,
        line: c.line,
        status: entry.status,
        error: entry.error,
      });
    }
  }

  if (violations.length > 0) {
    log(`\ncited-url-lint: ${violations.length} broken citations\n`);
    for (const v of violations) {
      const tag = v.status === 'error' ? `ERR (${v.error})` : `HTTP ${v.status}`;
      log(`  ${v.file}:${v.line}  ${tag}`);
      log(`    ${v.url}`);
    }
    return 1;
  }

  // "clean" is only ever said about URLs that were actually checked. A green
  // result over nothing is the self-attestation this tool exists to catch.
  const verified = fromCache + checked;
  if (verified === 0) {
    const reason =
      allCitations.length === 0
        ? `0 citations found under ${absTarget}`
        : uniqueUrls.size === 0
          ? `all ${allCitations.length} citations under ${absTarget} are allowlisted`
          : `none of ${uniqueUrls.size} unique URLs has a cached result (--offline)`;
    log(`cited-url-lint: ${reason} — nothing was checked`);
    return opts.failOnEmpty ? 3 : 0;
  }
  if (unchecked > 0) {
    log(
      `cited-url-lint: no broken citations among ${verified} checked URLs; ${unchecked} not checked (--offline, no cached result)`
    );
    return 0;
  }
  log(`cited-url-lint: clean — ${verified} unique URLs resolved`);
  return 0;
}

// Run only when executed directly, so tests can import run(). Real paths on
// both sides: comparing import.meta.url to argv as strings misses a symlinked
// path (macOS /var -> /private/var), and the tool would exit 0 having run nothing.
function invokedDirectly(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(__filename);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  run(process.argv.slice(2), { cwd: process.cwd() }).then(
    (code) => process.exit(code),
    (e) => {
      console.error('cited-url-lint: uncaught', e);
      process.exit(2);
    }
  );
}
