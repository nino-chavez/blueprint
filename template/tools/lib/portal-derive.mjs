// portal-derive.mjs — build-order step 7 of decisions/05 (wave 90): derive the
// portal's view set from the actor-output manifest instead of stamping a fixed
// verb spine.
//
// The rule both hand-reshapes converged on (blueprint-self, film-room —
// METHODOLOGY-AMENDMENTS evidence, 2026-07-20): a portal page exists only when
// a declared output serves a declared actor outcome; nav labels name the
// reader's job, not a canonical verb; and the interim proof is an EXECUTED walk
// of the built dist — every view populated, no dead end, no empty-state shell.
//
// A portal-bearing output declares its views in the manifest:
//
//   - id: provenance-portal
//     type: harness-views
//     serves: [build-evaluator.assess-build]
//     artifact: apps/portal
//     views:
//       - { path: /try, label: The console, presents: console }
//       - { path: /strategy, label: Decisions, presents: decisions }
//
// `presents` is optional and must resolve to a declared output id or an
// account key — the view surfaces that thing for this portal's reader. This
// lib validates the declaration, emits derived/portal-views.json (the shell's
// nav/source of truth — never hand-edited), and `--check <dist>` executes the
// walk against a built dist. A manifest with no portal views is a clean no-op:
// intrinsic initiatives (maintainer + next-agent) have no browsable surface
// and stamp none.
//
// Dependency-free (matches template/tools/lib/*). CLI:
//   node portal-derive.mjs --root <dir> [--manifest actor-output.yml] [--out derived]
//   node portal-derive.mjs --root <dir> --check <dist-dir>   (derive + executed walk)

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { parseManifest } from './actor-output.mjs';

const SCHEMA = 'portal-views/1';

// Markers that betray a config-shell page rendered without content — the exact
// state the two reshapes deleted pages over. Any of these in a view's html
// fails the walk.
const EMPTY_STATE_MARKERS = [/No [a-z -]+ (?:are |is )?configured/i, /not configured/i];
const MIN_VIEW_BYTES = 500;

function asOf(root) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch { return 'no-git'; }
}

// Extract + validate the view declarations from a parsed manifest. Returns
// { views, errors } — views carry their owning output id + clearance so the
// shell and the walk know what they are rendering.
export function deriveViews(m) {
  const errors = [];
  const views = [];
  const outputs = m?.outputs ?? [];
  const outputIds = new Set(outputs.map((o) => o?.id).filter(Boolean));
  const accountKeys = new Set(Object.keys(m?.account ?? {}));

  for (const o of outputs) {
    const declared = o?.views;
    if (declared == null) continue;
    if (!Array.isArray(declared)) { errors.push(`output ${o.id}: views must be a list`); continue; }
    for (const [ix, v] of declared.entries()) {
      const where = `output ${o.id} views[${ix}]`;
      const path = typeof v?.path === 'string' ? v.path : null;
      const label = typeof v?.label === 'string' ? v.label : null;
      if (!path || !path.startsWith('/')) { errors.push(`${where}: path must be a /-prefixed string`); continue; }
      if (!label) { errors.push(`${where}: label (the reader-job nav label) is required`); continue; }
      if (v.presents != null && !outputIds.has(v.presents) && !accountKeys.has(v.presents))
        errors.push(`${where}: presents "${v.presents}" resolves to no declared output id or account key`);
      views.push({
        path, label,
        ...(v.presents != null ? { presents: v.presents } : {}),
        output: o.id,
        clearance: o.clearance ?? 'internal',
      });
    }
  }

  const seen = new Set();
  for (const v of views) {
    if (seen.has(v.path)) errors.push(`duplicate view path ${v.path}`);
    seen.add(v.path);
  }
  return { views, errors };
}

// Executed walk of a built dist: the front door plus every declared view must
// exist, carry real content, and show no empty-state shell. This is the
// mechanical form of the simulated-walk interim proof.
export function checkDist(distDir, views) {
  const problems = [];
  const targets = [{ path: '/', label: 'front door' }, ...views];
  for (const t of targets) {
    const rel = t.path === '/' ? 'index.html' : `${t.path.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
    const file = join(distDir, rel);
    if (!existsSync(file)) { problems.push(`${t.path} (${t.label}): ${rel} missing from dist`); continue; }
    const html = readFileSync(file, 'utf8');
    if (statSync(file).size < MIN_VIEW_BYTES) { problems.push(`${t.path} (${t.label}): under ${MIN_VIEW_BYTES} bytes — shell, not content`); continue; }
    for (const marker of EMPTY_STATE_MARKERS)
      if (marker.test(html)) problems.push(`${t.path} (${t.label}): empty-state marker ${marker} — page renders a config shell`);
  }
  return { pass: problems.length === 0, checked: targets.length, problems };
}

// Derive + write derived/portal-views.json. No portal views declared → no file
// written (and any stale one is removed), exit clean: deletion-not-hiding
// applies to the derived artifact too.
export function derive(root, opts = {}) {
  const manifestPath = resolve(root, opts.manifest ?? 'actor-output.yml');
  const m = parseManifest(readFileSync(manifestPath, 'utf8'));
  const { views, errors } = deriveViews(m);
  const outDir = resolve(root, opts.out ?? 'derived');
  const outFile = join(outDir, 'portal-views.json');
  if (errors.length) return { ok: false, errors, views };
  if (views.length === 0) {
    if (existsSync(outFile)) rmSync(outFile);
    return { ok: true, views, wrote: null };
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify({
    schema: SCHEMA,
    initiative: m.initiative ?? null,
    as_of: asOf(root),
    views,
  }, null, 2) + '\n');
  return { ok: true, views, wrote: outFile };
}

// ── selftest ─────────────────────────────────────────────────────────────────

function selftest() {
  let n = 0;
  const ok = (cond, msg) => { n++; if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); } };
  const fx = mkdtempSync(join(tmpdir(), 'portal-derive-'));
  const write = (rel, s) => { mkdirSync(join(fx, rel, '..'), { recursive: true }); writeFileSync(join(fx, rel), s); };

  const MANIFEST = `initiative: fx
account:
  decisions: decisions/
actors:
  - id: viewer
    kind: human
    evidence: { status: assumed }
    outcomes:
      - id: assess
        success:
          statement: judges the build
          proof:
            target: { method: observed-human, signal: real viewer }
outputs:
  - id: console
    type: live-surface
    serves: [viewer.assess]
    status: ready
  - id: portal
    type: harness-views
    serves: [viewer.assess]
    status: ready
    clearance: recipient-safe
    views:
      - { path: /try, label: The console, presents: console }
      - { path: /strategy, label: Decisions, presents: decisions }
`;
  write('actor-output.yml', MANIFEST);

  // 1. derive extracts views with owning output + clearance
  const r = derive(fx);
  ok(r.ok && r.views.length === 2, 'derive extracts two views');
  ok(r.views[0].output === 'portal' && r.views[0].clearance === 'recipient-safe', 'views carry owner + clearance');
  ok(r.views[1].presents === 'decisions', 'presents resolves to an account key');
  const written = JSON.parse(readFileSync(join(fx, 'derived', 'portal-views.json'), 'utf8'));
  ok(written.schema === SCHEMA && written.views.length === 2, 'portal-views.json written with schema');

  // 2. presents that resolves nowhere is an error
  const bad = parseManifest(MANIFEST.replace('presents: console', 'presents: ghost'));
  ok(deriveViews(bad).errors.some((e) => e.includes('ghost')), 'unresolvable presents is an error');

  // 3. duplicate paths are an error
  const dup = parseManifest(MANIFEST.replace('/strategy', '/try'));
  ok(deriveViews(dup).errors.some((e) => e.includes('duplicate')), 'duplicate view path is an error');

  // 4. intrinsic manifest (no views) is a clean no-op and removes a stale file
  write('novel/actor-output.yml', MANIFEST.split('\n').filter((l) => !/views:|path: \/|presents/.test(l)).join('\n'));
  mkdirSync(join(fx, 'novel', 'derived'), { recursive: true });
  writeFileSync(join(fx, 'novel', 'derived', 'portal-views.json'), '{"stale":true}');
  const noop = derive(join(fx, 'novel'));
  ok(noop.ok && noop.views.length === 0 && noop.wrote === null, 'no declared views is a clean no-op');
  ok(!existsSync(join(fx, 'novel', 'derived', 'portal-views.json')), 'stale portal-views.json removed on no-op');

  // 5. executed walk: passing dist
  const page = (t) => `<!doctype html><html><head><title>${t}</title></head><body>${'x'.repeat(600)}</body></html>`;
  write('dist/index.html', page('home'));
  write('dist/try/index.html', page('try'));
  write('dist/strategy/index.html', page('strategy'));
  ok(checkDist(join(fx, 'dist'), r.views).pass, 'walk passes on a populated dist');

  // 6. walk fails on a missing view page
  rmSync(join(fx, 'dist', 'strategy'), { recursive: true });
  const miss = checkDist(join(fx, 'dist'), r.views);
  ok(!miss.pass && miss.problems.some((p) => p.includes('/strategy')), 'walk fails when a view page is missing');

  // 7. walk fails on an empty-state shell
  write('dist/strategy/index.html', page('strategy').replace('</body>', 'No excerpts are configured for this initiative.</body>'));
  ok(!checkDist(join(fx, 'dist'), r.views).pass, 'walk fails on an empty-state marker');

  // 8. walk fails on a sub-minimum shell page
  write('dist/strategy/index.html', '<html><body>thin</body></html>');
  ok(checkDist(join(fx, 'dist'), r.views).problems.some((p) => p.includes('bytes')), 'walk fails on a thin shell page');

  rmSync(fx, { recursive: true, force: true });
  console.log(`selftest OK (${n} assertions; derive + no-op + executed walk)`);
}

const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isEntry && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))) selftest();
else if (isEntry) {
  const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
  const root = arg('root') ?? '.';
  const r = derive(root, { manifest: arg('manifest') ?? undefined, out: arg('out') ?? undefined });
  if (!r.ok) { for (const e of r.errors) console.error(`  ERROR ${e}`); process.exit(1); }
  console.log(r.wrote ? `derived ${r.views.length} view(s) → ${r.wrote}` : 'no portal views declared — nothing to derive');
  const dist = arg('check');
  if (dist) {
    const walk = checkDist(resolve(root, dist), r.views);
    for (const p of walk.problems) console.error(`  WALK  ${p}`);
    console.log(walk.pass ? `walk OK — ${walk.checked} view(s) populated, no dead end` : 'walk FAILED — do not issue');
    if (!walk.pass) process.exit(1);
  }
}
