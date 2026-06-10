#!/usr/bin/env node
/**
 * record-demo — screen-record the /demo reel to a webm.
 *
 * The reel is deterministic (fixed pacing, no randomness), so the recording is
 * reproducible: re-capture fixtures, re-run this, and the cut is current again
 * — no video editing in the loop. Output lands in demo-recordings/ (gitignored;
 * regenerable, so throwaway by the shell/artifact rule).
 *
 *   node scripts/record-demo.mjs [--reel=sizzle|deep] [--base=http://localhost:4399]
 *
 * Expects the portal already serving (npm run preview -- --port 4399).
 * webm → mp4 for socials/decks: ffmpeg -i <in>.webm -c:v libx264 -pix_fmt yuv420p <out>.mp4
 */
import { mkdirSync, renameSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('record-demo: playwright not installed — run `npm i -D playwright` in apps/portal (browsers come from the shared ms-playwright cache, or `npx playwright install chromium`).');
  process.exit(2);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), 'true'];
  })
);
const reel = args.reel === 'deep' ? 'deep' : 'sizzle';
const base = args.base ?? 'http://localhost:4399';

const portalRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(portalRoot, 'demo-recordings');
mkdirSync(outDir, { recursive: true });

const size = { width: 1280, height: 800 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size } });
const page = await ctx.newPage();

const url = `${base}/demo?reel=${reel}&mode=auto&record=1`;
console.log(`recording ${url} ...`);
await page.goto(url, { waitUntil: 'networkidle' });
// The player flips this when the outro finishes; deep at reading pace can run long.
await page.waitForFunction('window.__DEMO_DONE__ === true', null, { timeout: 300_000 });
await page.waitForTimeout(1800); // hold the end frame

const video = page.video();
await ctx.close(); // flushes the recording
const tmp = await video.path();
const out = join(outDir, `blueprint-demo-${reel}.webm`);
renameSync(tmp, out);
await browser.close();
console.log(`wrote ${out}`);
