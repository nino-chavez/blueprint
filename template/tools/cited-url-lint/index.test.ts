import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { run } from './index.ts';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'index.ts');

// `.invalid` is reserved (RFC 2606): these never resolve and never land in a real cache.
const URL_ONE = 'https://cited-url-lint-fixture.invalid/one';
const URL_TWO = 'https://cited-url-lint-fixture.invalid/two';
const TWO_CITATIONS = `# Fixture\n\nSee ${URL_ONE} and\n[two](${URL_TWO}).\n`; // lines 3 and 4

// The CLI tests run index.ts the way a caller does. Node strips types natively
// from 22.18 (22.6 behind a flag); on an older runtime they report as skipped.
const canRunTs = Boolean((process.features as { typescript?: unknown }).typescript);

let roots: string[] = [];
afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  roots = [];
});

/** A throwaway project directory holding `files`, removed after each test. */
function project(files: Record<string, string>): string {
  // realpath: on macOS tmpdir() is /var/..., while a child's cwd reports /private/var/...
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'cited-url-lint-')));
  roots.push(root);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

/** Runs the lint in-process from `cwd`. `cached` seeds a fresh cache; omit it for no cache file. */
async function lint(cwd: string, args: string[], cached?: Record<string, number>) {
  const cachePath = join(cwd, 'url-cache.test.json');
  if (cached) {
    const checked_at = new Date().toISOString();
    const entries = Object.entries(cached).map(([url, status]) => [url, { status, checked_at }]);
    writeFileSync(cachePath, JSON.stringify(Object.fromEntries(entries)));
  }
  const lines: string[] = [];
  const code = await run(args, { cwd, cachePath, log: (l) => lines.push(l), err: (l) => lines.push(l) });
  return { code, out: lines.join('\n'), cachePath };
}

describe('CLI invoked by absolute path from another project (observed 2026-09-24)', () => {
  const cli = (cwd: string, ...args: string[]) =>
    spawnSync(process.execPath, [TOOL, ...args], { cwd, encoding: 'utf8', input: '', timeout: 30_000 });

  it.skipIf(!canRunTs)("resolves a relative directory against the caller's cwd and prints it", () => {
    const caller = project({ 'research/real.md': TWO_CITATIONS });
    const r = cli(caller, 'research', '--offline');
    expect(r.stdout).toContain(`1 files, 2 citations, 2 unique URLs under ${join(caller, 'research')}`);
    expect(r.stdout).not.toMatch(/\bclean\b/);
    expect(r.status).toBe(0);
  });

  it.skipIf(!canRunTs)('exits non-zero under --fail-on-empty when nothing was checked', () => {
    const caller = project({ 'research/real.md': TWO_CITATIONS });
    const r = cli(caller, 'research', '--offline', '--fail-on-empty');
    expect(r.stdout).toContain('nothing was checked');
    expect(r.status).toBe(3);
  });
});

describe('relative paths resolve against the caller, not the tool', () => {
  it('scans the default docs/architecture under cwd', async () => {
    const root = project({ 'docs/architecture/adr.md': `Source: ${URL_ONE}\n` });
    const r = await lint(root, ['--offline'], { [URL_ONE]: 200 });
    expect(r.out).toContain(`1 files, 1 citations, 1 unique URLs under ${join(root, 'docs/architecture')}`);
    expect(r.out).toContain('cited-url-lint: clean — 1 unique URLs resolved');
    expect(r.code).toBe(0);
  });

  it('takes an absolute directory from any cwd and reports paths relative to cwd', async () => {
    const target = project({ 'research/real.md': TWO_CITATIONS });
    const elsewhere = project({});
    const r = await lint(elsewhere, [join(target, 'research'), '--offline'], { [URL_ONE]: 404, [URL_TWO]: 200 });
    expect(r.out).toContain(`under ${join(target, 'research')}`);
    expect(r.out).toContain(`${relative(elsewhere, join(target, 'research/real.md'))}:3  HTTP 404`);
    expect(r.code).toBe(1);
  });

  it('reads the allowlist from cwd, matching files by their cwd-relative path', async () => {
    const root = project({ 'research/real.md': TWO_CITATIONS });
    const cached = { [URL_ONE]: 404, [URL_TWO]: 200 };

    const broken = await lint(root, ['research', '--offline'], cached);
    expect(broken.out).toContain('research/real.md:3  HTTP 404');
    expect(broken.code).toBe(1);

    writeFileSync(join(root, '.cited-url-lint-allowlist'), `allow-url:${URL_ONE}\n`);
    const urlAllowed = await lint(root, ['research', '--offline'], cached);
    expect(urlAllowed.out).toContain('cited-url-lint: clean — 1 unique URLs resolved');
    expect(urlAllowed.code).toBe(0);

    writeFileSync(join(root, '.cited-url-lint-allowlist'), 'research/real.md\n');
    const fileAllowed = await lint(root, ['research', '--offline'], cached);
    expect(fileAllowed.out).toContain(
      `0 citations found under ${join(root, 'research')} (1 of 1 files allowlisted) — nothing was checked`
    );
    expect(fileAllowed.code).toBe(0);
  });
});

describe('a scan that checks nothing never says "clean"', () => {
  it('0 citations: says so, exits 0, and exits 3 under --fail-on-empty', async () => {
    const root = project({ 'research/notes.md': '# No links here\n' });
    const r = await lint(root, ['research']);
    expect(r.out).toContain(`cited-url-lint: 0 citations found under ${join(root, 'research')} — nothing was checked`);
    expect(r.out).not.toMatch(/\bclean\b/);
    expect(r.code).toBe(0);
    expect((await lint(root, ['research', '--fail-on-empty'])).code).toBe(3);
  });

  it('every citation allowlisted: nothing was checked', async () => {
    const root = project({
      'research/real.md': TWO_CITATIONS,
      '.cited-url-lint-allowlist': `allow-url:${URL_ONE}\nallow-url:${URL_TWO}\n`,
    });
    const r = await lint(root, ['research', '--fail-on-empty']);
    expect(r.out).toContain(`all 2 citations under ${join(root, 'research')} are allowlisted — nothing was checked`);
    expect(r.out).not.toMatch(/\bclean\b/);
    expect(r.code).toBe(3);
  });

  it('--offline with no cached result: nothing was checked, and no cache file is written', async () => {
    const root = project({ 'research/real.md': TWO_CITATIONS });
    const r = await lint(root, ['research', '--offline', '--fail-on-empty']);
    expect(r.out).toContain('none of 2 unique URLs has a cached result (--offline) — nothing was checked');
    expect(r.out).not.toMatch(/\bclean\b/);
    expect(r.code).toBe(3);
    expect(existsSync(r.cachePath)).toBe(false);
  });

  it('--offline with a partial cache: names what went unchecked, never "clean"', async () => {
    const root = project({ 'research/real.md': TWO_CITATIONS });
    const r = await lint(root, ['research', '--offline', '--fail-on-empty'], { [URL_ONE]: 200 });
    expect(r.out).toContain('1 from cache, 0 freshly checked, 1 not checked (--offline, no cached result)');
    expect(r.out).toContain('no broken citations among 1 checked URLs; 1 not checked');
    expect(r.out).not.toMatch(/\bclean\b/);
    expect(r.code).toBe(0); // something was checked, so --fail-on-empty does not fire
  });
});

describe('invocation errors exit 2 instead of being ignored', () => {
  it.each([
    [['research', '--fail-on-emtpy'], 'unknown flag --fail-on-emtpy'],
    [['research', 'docs'], 'expected one directory, got 2: research docs'],
    [['research', '--max-cache-age-days=soon'], '--max-cache-age-days=soon is not a non-negative number of days'],
  ])('rejects %j', async (args, message) => {
    const root = project({ 'research/notes.md': '# No links here\n', 'docs/notes.md': '# No links here\n' });
    const r = await lint(root, args);
    expect(r.out).toContain(message);
    expect(r.code).toBe(2);
  });

  it('names the absolute directory when it holds no markdown', async () => {
    const root = project({});
    const r = await lint(root, ['nope']);
    expect(r.out).toContain(`no markdown files found under ${join(root, 'nope')}`);
    expect(r.code).toBe(2);
  });
});

describe('checking URLs over the network', () => {
  let server: Server;
  let base: string;
  beforeEach(async () => {
    // /page fails HEAD but serves GET, as salesforce.com and northdata.com did.
    // /drops-head drops the connection on HEAD, so fetch throws. /gone fails both.
    server = createServer((req, res) => {
      if (req.url === '/drops-head' && req.method === 'HEAD') {
        req.socket.destroy();
        return;
      }
      res.statusCode = req.method === 'GET' && (req.url === '/page' || req.url === '/drops-head') ? 200 : 404;
      res.end();
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  });

  it('retries as GET a HEAD that errors or drops the connection, and still reports a URL that fails both', async () => {
    const root = project({ 'research/real.md': `One: ${base}/page\nTwo: ${base}/gone\nThree: ${base}/drops-head\n` });
    const r = await lint(root, ['research']);
    expect(r.out).toContain('0 from cache, 3 freshly checked');
    expect(r.out).toContain('research/real.md:2  HTTP 404');
    expect(r.out).not.toMatch(/research\/real\.md:[13]\b/);
    expect(r.code).toBe(1);
  });
});
