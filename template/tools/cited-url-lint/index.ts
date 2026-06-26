#!/usr/bin/env node
/**
 * cited-url-lint — verifies that HTTP(S) URLs cited in markdown under docs/
 * actually resolve. Catches the failure mode where prose claims point to
 * fabricated, stale, or wrong-format documentation URLs.
 *
 * Usage (from project root):
 *   npx tsx tools/cited-url-lint/index.ts [directory]
 *   npx tsx tools/cited-url-lint/index.ts --offline    # skip network, lint cache only
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
 *   `tools/cited-url-lint/.url-cache.json` stores {url, status, checked_at}.
 *   Cache entries are reused if checked within the last 7 days. Bump
 *   --max-cache-age-days to override.
 *
 * Exit codes:
 *   0 — 0 broken URLs (or all broken URLs are allowed)
 *   1 — at least one broken URL outside the allowlist
 *   2 — invocation error
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const CACHE_PATH = join(__dirname, '.url-cache.json');
const ALLOWLIST_PATH = join(PROJECT_ROOT, '.cited-url-lint-allowlist');

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

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const offline = args.includes('--offline');
const maxCacheAgeDaysArg = args.find((a) => a.startsWith('--max-cache-age-days='));
const maxCacheAgeDays = maxCacheAgeDaysArg ? Number(maxCacheAgeDaysArg.split('=')[1]) : 7;
const positional = args.filter((a) => !a.startsWith('--'));
const targetDir = positional[0] ?? 'docs/architecture';

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

function loadAllowlist(): Allowlist {
  const out: Allowlist = { urls: new Set(), files: new Set() };
  if (!existsSync(ALLOWLIST_PATH)) return out;
  for (const raw of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
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

function loadCache(): Cache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
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

function extractCitations(file: string): Citation[] {
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
      if (/[{<]|\b:[A-Za-z_]/.test(url) || url.includes('...')) continue;
      citations.push({
        url,
        file: relative(PROJECT_ROOT, file),
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
    // HEAD first — many servers reject; fall back to GET with no body read.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
      }
    } finally {
      clearTimeout(t);
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

async function main(): Promise<void> {
  const absTarget = resolve(PROJECT_ROOT, targetDir);
  const files = walkMarkdown(absTarget);
  if (files.length === 0) {
    console.error(`cited-url-lint: no markdown files found under ${targetDir}`);
    process.exit(2);
  }

  const allowlist = loadAllowlist();
  const cache = loadCache();

  const allCitations: Citation[] = [];
  for (const f of files) {
    const rel = relative(PROJECT_ROOT, f);
    if (allowlist.files.has(rel)) continue;
    allCitations.push(...extractCitations(f));
  }

  // Dedupe URLs we need to check.
  const uniqueUrls = new Set<string>();
  for (const c of allCitations) {
    if (allowlist.urls.has(c.url)) continue;
    uniqueUrls.add(c.url);
  }

  console.log(
    `cited-url-lint: ${files.length} files, ${allCitations.length} citations, ${uniqueUrls.size} unique URLs`
  );

  // Check each URL (with cache).
  let checked = 0;
  let fromCache = 0;
  for (const url of uniqueUrls) {
    const cached = cache[url];
    if (cached && cacheFresh(cached, maxCacheAgeDays)) {
      fromCache++;
      continue;
    }
    if (offline) continue;
    process.stderr.write(`  checking ${url}\n`);
    cache[url] = await checkUrl(url);
    checked++;
    // small throttle to avoid hammering hosts
    await new Promise((r) => setTimeout(r, 50));
  }

  saveCache(cache);

  console.log(`cited-url-lint: ${fromCache} from cache, ${checked} freshly checked`);

  // Aggregate violations.
  const violations: Violation[] = [];
  for (const c of allCitations) {
    if (allowlist.urls.has(c.url)) continue;
    const entry = cache[c.url];
    if (!entry) continue; // offline + not cached — skip
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

  if (violations.length === 0) {
    console.log('cited-url-lint: clean');
    process.exit(0);
  }

  console.log(`\ncited-url-lint: ${violations.length} broken citations\n`);
  for (const v of violations) {
    const tag = v.status === 'error' ? `ERR (${v.error})` : `HTTP ${v.status}`;
    console.log(`  ${v.file}:${v.line}  ${tag}`);
    console.log(`    ${v.url}`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error('cited-url-lint: uncaught', e);
  process.exit(2);
});
