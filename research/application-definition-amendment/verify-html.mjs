// Local review-kit checks. Run from this checkout with its Playwright dependency available.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = new URL('./', import.meta.url);
const output = new URL('captures/review/', dir);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url()));
  await page.goto(new URL('index.html', dir).href);
  await page.locator('.hero').screenshot({ path: fileURLToPath(new URL('source-input-desktop.png', output)) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.hero').screenshot({ path: fileURLToPath(new URL('source-input-phone.png', output)) });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const link of await page.locator('a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))) {
    const target = new URL(link, dir);
    if (link.startsWith('#')) assert.equal(await page.locator(link).count(), 1, link);
    else {
      if (target.protocol === 'https:') {
        const filing = JSON.parse(readFileSync(new URL('rfc-filing.json', dir), 'utf8'));
        assert.equal(target.href, filing.url, `Unverified external link: ${link}`);
        assert.equal(filing.remote_body_verified, true);
        assert.equal(filing.public_url_http_status, 200);
        continue;
      }
      assert.equal(target.protocol, 'file:', `Unexpected external link: ${link}`);
      assert.ok(existsSync(fileURLToPath(target)), `Missing target: ${link}`);
      if (target.hash && target.pathname.endsWith('.md')) {
        const headings = readFileSync(target, 'utf8').split('\n').filter(x => /^#+ /.test(x)).map(x => x.replace(/^#+ /, '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-'));
        assert.ok(headings.includes(target.hash.slice(1)), `Missing heading: ${link}`);
      }
    }
  }
  results.push('All local links and heading references resolve; external RFC link matches verified filing receipt');
  const cases = [
    ['Missing journey', 'Blocked: missing journey'],
    ['Unresolved permission', 'Blocked: permission unresolved'],
    ['Missing state', 'Blocked: state disposition missing'],
    ['Stale evidence', 'Blocked: evidence stale'],
    ['Complete draft', 'Ready for concepts'],
  ];
  for (const [name, expected] of cases) {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await button.press('Enter');
    assert.equal(await page.locator('[data-gate-state]').textContent(), expected);
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-scenario][aria-pressed="true"]').count(), 1);
    assert.ok((await page.locator('[data-gate-remedy]').textContent()).trim());
    if (name === 'Missing journey') await page.locator('[data-gate-demo]').screenshot({ path: fileURLToPath(new URL('gate-blocked.png', output)) });
  }
  results.push('All five scenarios work by keyboard, show a remedy, and keep one selected control');
  await page.reload();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to the recommendation');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  results.push('Skip link is first in keyboard order and moves focus into the main content');
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.scenario-tabs').isVisible(), false);
  assert.equal(await page.getByRole('heading', { name: 'Inspect the source packet' }).isVisible(), true);
  results.push('Print hides interactive controls and retains the source references');
  assert.deepEqual(errors, []);
  results.push('No script errors or failed asset requests');
  writeFileSync(new URL('html-checks.json', dir), JSON.stringify({ checked_at: new Date().toISOString(), status: 'pass', results }, null, 2) + '\n');
  console.log(results.map(x => `PASS ${x}`).join('\n'));
} finally {
  await browser.close();
}
