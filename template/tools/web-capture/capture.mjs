#!/usr/bin/env node
// web-capture: full-page captures of a rendered web page for a judged-screen review, with the checks that
// make a capture trustworthy. See README.md. Needs Playwright (resolved from the current project or
// --playwright) and ImageMagick's `magick` for stitching and the wrap check.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const MAX_DEVICE_PX = 16000;   // Chrome paints at most 16,384 device px per screenshot; stay under it
const SEGMENT_CSS_PX = 6000;   // clipped segment height when a page is taller than that
const WRAP_PX = 16384;         // where a too-tall single shot starts repeating the page top

const STATES = {
  'desktop-light':      { vp: [1280, 800], dpr: 1, mobile: false, scheme: 'light' },
  'desktop-dark':       { vp: [1280, 800], dpr: 1, mobile: false, scheme: 'dark', explicitDark: true },
  'desktop-systemdark': { vp: [1280, 800], dpr: 1, mobile: false, scheme: 'dark' },
  'phone-light':        { vp: [390, 844], dpr: 2, mobile: true, scheme: 'light' },
  'phone-dark':         { vp: [390, 844], dpr: 2, mobile: true, scheme: 'dark', explicitDark: true },
  'reflow320-light':    { vp: [320, 700], dpr: 2, mobile: true, scheme: 'light' },
};

// The publish skeleton a claude.ai artifact fragment is wrapped in (charset, viewport, reset), so a fragment
// renders here as it does there.
const ARTIFACT_SKELETON = ['<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>', '</body></html>'];

function args(argv) {
  const a = { states: Object.keys(STATES), darkAttr: 'data-theme=dark' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = () => argv[++i];
    if (k === '--page') a.page = v();
    else if (k === '--out') a.out = v();
    else if (k === '--states') a.states = v().split(',');
    else if (k === '--dark-attr') a.darkAttr = v();
    else if (k === '--artifact-fragment') a.fragment = true;
    else if (k === '--playwright') a.playwright = v();
    else if (k === '--single-shot') a.singleShot = true;   // disables segmenting; for the self-test only
    else if (k === '--selftest') a.selftest = true;
    else if (k === '-h' || k === '--help') a.help = true;
    else throw new Error(`unknown argument ${k}`);
  }
  return a;
}

function loadPlaywright(p) {
  const req = createRequire(path.join(process.cwd(), 'noop.js'));
  const target = p || process.env.PLAYWRIGHT_MODULE || 'playwright';
  try { return req(target); } catch (e) {
    throw new Error(`Playwright not found (${target}). Run from a project that has it, or pass --playwright <path>.`);
  }
}

async function launch(pw) {
  try { return await pw.chromium.launch(); }
  catch { return await pw.chromium.launch({ channel: 'chrome' }); }   // when the bundled browser is absent
}

function magick(...a) { return execFileSync('magick', a, { encoding: 'utf8' }); }

function pageUrl(page, fragment, tmp) {
  if (/^https?:\/\//.test(page)) return page;
  let file = path.resolve(page);
  if (fragment) {
    file = path.join(tmp, 'wrapped.html');
    fs.writeFileSync(file, ARTIFACT_SKELETON[0] + fs.readFileSync(path.resolve(page), 'utf8') + ARTIFACT_SKELETON[1]);
  }
  return 'file://' + file;
}

// Measures what a reviewer cannot see in a frame: fonts that loaded, sideways overflow against the document's
// clientWidth (under mobile emulation window.innerWidth grows to fit overflow, so it hides it), page length.
async function measure(page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth, past = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > cw + 0.5 || r.left < -0.5) && past.length < 5)
        past.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} [${Math.round(r.left)},${Math.round(r.right)}]`);
    }
    return {
      fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))],
      overflowX: document.documentElement.scrollWidth > cw,
      overflowByInnerWidth: document.documentElement.scrollWidth > window.innerWidth,
      pastEdge: past,
      clientWidth: cw, innerWidth: window.innerWidth,
      height: document.documentElement.scrollHeight,
      screens: +(document.documentElement.scrollHeight / window.innerHeight).toFixed(1),
      ground: getComputedStyle(document.body).backgroundColor,
    };
  });
}

async function shoot(page, file, st, h, singleShot) {
  const [w] = st.vp;
  if (singleShot || h * st.dpr <= MAX_DEVICE_PX) {
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    return 1;
  }
  const parts = [];
  for (let y = 0; y < h; y += SEGMENT_CSS_PX) {
    const part = `${file}.part${parts.length}.png`;
    await page.screenshot({ path: part, fullPage: true, animations: 'disabled',
      clip: { x: 0, y, width: w, height: Math.min(SEGMENT_CSS_PX, h - y) } });
    parts.push(part);
  }
  magick(...parts, '-append', '+repage', file);   // +repage: a stitched image keeps the first part's canvas otherwise
  parts.forEach(p => fs.unlinkSync(p));
  return parts.length;
}

// Completeness, part 1: the image is exactly the page's size at the state's pixel density.
function complete(file, st, m) {
  const [w, h] = magick('identify', '-format', '%w %h', file).trim().split(' ').map(Number);
  const want = [st.vp[0] * st.dpr, Math.round(m.height * st.dpr)];
  return { imageSize: [w, h], expected: want, sizeOk: w === want[0] && Math.abs(h - want[1]) <= st.dpr };
}

// Completeness, part 2: a single shot taller than 16,384 px does not repeat the page top. A stitched image
// cannot wrap, so the check runs on single shots only; there, two matching bands mean a wrap.
function wrapCheck(file, segments) {
  if (segments > 1) return false;
  const [w, h] = magick('identify', '-format', '%w %h', file).trim().split(' ').map(Number);
  if (h <= WRAP_PX + 400) return false;
  try {
    execFileSync('magick', ['compare', '-metric', 'AE',
      '(', file, '+repage', '-crop', `${w}x400+0+0`, '+repage', ')',
      '(', file, '+repage', '-crop', `${w}x400+0+${WRAP_PX}`, '+repage', ')', 'null:'], { stdio: 'pipe' });
    return true;                        // exit 0: the band at 16,384 px repeats the page top
  } catch (e) {
    if (e.status === 1) return false;   // exit 1: the bands differ
    throw new Error(`wrap check could not run (magick exit ${e.status}): ${String(e.stderr || e.message).trim()}`);
  }
}

async function capture(a) {
  if (a.fragment && /^https?:\/\//.test(a.page)) throw new Error('--artifact-fragment wraps a local fragment file; it cannot wrap a URL');
  const pw = loadPlaywright(a.playwright);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'web-capture-'));
  const url = pageUrl(a.page, a.fragment, tmp);
  fs.mkdirSync(a.out, { recursive: true });
  const [attr, val] = a.darkAttr.split('=');
  const browser = await launch(pw);
  const receipt = { page: /^https?:/.test(a.page) ? a.page : path.resolve(a.page),
    wrappedIn: a.fragment ? 'artifact publish skeleton, as in capture.mjs' : null,
    taken: new Date().toISOString(), browser: browser.version(), states: {} };
  try {
    for (const id of a.states) {
      const st = STATES[id];
      if (!st) throw new Error(`unknown state ${id}`);
      const ctx = await browser.newContext({ viewport: { width: st.vp[0], height: st.vp[1] }, colorScheme: st.scheme,
        isMobile: st.mobile, hasTouch: st.mobile, deviceScaleFactor: st.dpr });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      if (st.explicitDark) {
        // A class is added to the root's classes; any other attribute is set. Replacing `class` would drop
        // the page's other root classes and capture a page no user sees.
        await page.evaluate(([k, v]) => k === 'class' ? document.documentElement.classList.add(...v.split(/\s+/))
          : document.documentElement.setAttribute(k, v), [attr, val]);
      }
      // Let the theme switch finish: finite transitions settle, bounded at two seconds.
      await page.evaluate(() => Promise.race([
        Promise.all(document.getAnimations().filter(an => an.effect?.getComputedTiming().iterations !== Infinity)
          .map(an => an.finished.catch(() => {}))),
        new Promise(r => setTimeout(r, 2000))]));
      const m = await measure(page);
      const file = path.join(a.out, `${id}.png`);
      const segments = await shoot(page, file, st, m.height, a.singleShot);
      const c = complete(file, st, m);
      c.wrapsToTop = wrapCheck(file, segments);
      receipt.states[id] = { ...m, segments, ...c };
      await ctx.close();
    }
  } finally { await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  fs.writeFileSync(path.join(a.out, 'receipt.json'), JSON.stringify(receipt, null, 1));
  return receipt;
}

// Each check must fail once on a page built to trip it, or a pass means nothing.
async function selftest(a) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'web-capture-selftest-'));
  const over = path.join(tmp, 'overflow.html'), tall = path.join(tmp, 'tall.html');
  fs.writeFileSync(over, '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0;padding:0 16px"><div style="margin-inline:-20px;height:40px;background:#ccc"></div>4 px past each edge</body>');
  const bands = Array.from({ length: 95 }, (_, i) => `<div style="height:100px;background:hsl(${i * 37 % 360} 60% 70%)">${i}</div>`).join('');
  fs.writeFileSync(tall, `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0">${bands}</body>`);
  const results = [];
  try {
    const r1 = await capture({ ...a, page: over, out: path.join(tmp, 'o'), states: ['phone-light'] });
    const s1 = r1.states['phone-light'];
    results.push(['overflow check catches 4 px past the edge (clientWidth)', s1.overflowX === true]);
    results.push(['the innerWidth test would have missed it (why clientWidth)', s1.overflowByInnerWidth === false]);
    const r2 = await capture({ ...a, page: tall, out: path.join(tmp, 't'), states: ['phone-light'] });
    const s2 = r2.states['phone-light'];
    results.push(['a 9,500 CSS px page at 2x is stitched from segments', s2.segments > 1]);
    results.push(['the stitched image is the full size and does not wrap', s2.sizeOk && !s2.wrapsToTop]);
    const r3 = await capture({ ...a, page: tall, out: path.join(tmp, 's'), states: ['phone-light'], singleShot: true });
    const s3 = r3.states['phone-light'];
    results.push(['a single shot of the same page trips the wrap check', s3.wrapsToTop === true]);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  return results.every(([, ok]) => ok);
}

const a = args(process.argv.slice(2));
if (a.help || (!a.selftest && (!a.page || !a.out))) {
  console.log('usage: capture.mjs --page <file|url> --out <dir> [--states a,b] [--dark-attr name=value] [--artifact-fragment] [--playwright <module>]\n       capture.mjs --selftest [--playwright <module>]');
  process.exit(a.help ? 0 : 2);
}
let r;
try {
  if (a.selftest) process.exit((await selftest(a)) ? 0 : 1);
  r = await capture(a);
} catch (e) { console.error(`web-capture: ${e.message}`); process.exit(2); }
let bad = 0;
for (const [id, s] of Object.entries(r.states)) {
  const flags = [s.overflowX && 'OVERFLOW ' + s.pastEdge.join(' '), !s.sizeOk && `SIZE ${s.imageSize} expected ${s.expected}`, s.wrapsToTop && 'WRAPS TO TOP'].filter(Boolean);
  if (flags.length) bad++;
  console.log(`${id.padEnd(19)} ${String(s.screens).padStart(5)} screens  ${s.segments} segment(s)  fonts: ${s.fonts.join(', ') || 'none'}  ${flags.join('; ') || 'ok'}`);
}
process.exit(bad ? 1 : 0);
