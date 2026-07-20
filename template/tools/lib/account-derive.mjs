// account-derive.mjs — build-order step 5 of decisions/05 (wave 89): the stable
// machine projection of the account layer, and the two intrinsic outputs every
// initiative stamps — the agent boot packet (derived JSON) and the maintainer
// recovery brief (derived markdown).
//
// Everything here is DERIVED from the manifest + the repo: rerunnable, never
// hand-maintained (the hand-copied-cursor anti-pattern this replaces). Artifacts
// carry as_of commit + generated_at so staleness is visible, and the manifest's
// own verdict (from actor-output.mjs) is embedded — a brief that says PENDING
// says so in its first lines.
//
// Dependency-free (matches template/tools/lib/*). CLI:
//   node account-derive.mjs --root <dir> [--manifest actor-output.yml] [--out derived]

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { parseManifest, validateManifest } from './actor-output.mjs';

const SCHEMA = 'actor-output-boot/1';

function gitInfo(root) {
  try {
    const commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const subjects = execSync('git log -5 --pretty=%s', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n');
    return { commit, subjects };
  } catch { return { commit: 'no-git', subjects: [] }; }
}

function decisionsIndex(root, account) {
  const dirs = [].concat(account?.decisions ?? []).filter((d) => typeof d === 'string');
  const out = [];
  for (const d of dirs) {
    const abs = resolve(root, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((f) => f.endsWith('.md')).sort()) {
      const first = readFileSync(join(abs, f), 'utf8').split('\n').find((l) => l.startsWith('# '));
      out.push({ file: join(d, f), title: first ? first.slice(2).trim() : f });
    }
  }
  return out;
}

// The stable machine projection: the account map resolved against disk, plus the
// manifest's structural summary and its live verdict.
export function deriveProjection(root, opts = {}) {
  const manifestPath = resolve(root, opts.manifest ?? 'actor-output.yml');
  const m = parseManifest(readFileSync(manifestPath, 'utf8'));
  const verdict = validateManifest(m, { root, localPaths: opts.localPaths ?? {} });
  const git = gitInfo(root);
  const account = {};
  for (const [k, v] of Object.entries(m.account ?? {}))
    account[k] = [].concat(v).map((item) => {
      if (typeof item !== 'string' || / /.test(item)) return { value: item, kind: 'note' };
      const abs = resolve(root, item);
      const exists = existsSync(abs);
      return { path: item, exists, ...(exists && statSync(abs).isDirectory() ? { entries: readdirSync(abs).filter((f) => !f.startsWith('.')).length } : {}) };
    });
  const actors = (m.actors ?? m.viewers ?? []).map((a) => ({
    id: a.id, kind: a.kind, evidence: a.evidence?.status,
    outcomes: (a.outcomes ?? []).map((o) => o.id),
  }));
  const outputs = (m.outputs ?? []).map((o) => ({ id: o.id, type: o.type, status: o.status ?? 'draft', serves: o.serves ?? [] }));
  return {
    schema: SCHEMA,
    initiative: m.initiative ?? 'unnamed',
    generated_at: new Date().toISOString(),
    as_of: git.commit,
    recent: git.subjects,
    account, actors, outputs,
    decisions: decisionsIndex(root, m.account),
    verdict: { state: verdict.verdict, route: verdict.route, errors: verdict.errors, pendings: verdict.pendings, warns: verdict.warns },
  };
}

export function renderBootPacket(proj) {
  // The versioned agent boot packet IS the projection — schema-stamped JSON an
  // agent can consume without reading the raw substrate.
  return JSON.stringify(proj, null, 2) + '\n';
}

export function renderRecoveryBrief(proj) {
  const L = [];
  L.push(`# ${proj.initiative} — recovery brief`);
  L.push('');
  L.push(`Derived ${proj.generated_at} at commit \`${proj.as_of}\` — rerun \`npm run derive\` to refresh; never hand-edit.`);
  L.push('');
  L.push(`## Where things stand — manifest verdict: ${proj.verdict.state}`);
  L.push('');
  if (proj.verdict.errors.length) { L.push('Blocked:'); for (const e of proj.verdict.errors) L.push(`- ${e}`); }
  if (proj.verdict.pendings.length) { L.push('Open (PENDING is not green):'); for (const p of proj.verdict.pendings) L.push(`- ${p}`); }
  if (!proj.verdict.errors.length && !proj.verdict.pendings.length) L.push('All declared outcomes served and proven.');
  L.push('');
  if (proj.recent.length) {
    L.push('## Recent movement (git)');
    L.push('');
    for (const s of proj.recent) L.push(`- ${s}`);
    L.push('');
  }
  L.push('## Outputs');
  L.push('');
  for (const o of proj.outputs) L.push(`- ${o.id} (${o.type}, ${o.status}) → ${o.serves.join(', ') || 'serves nothing'}`);
  L.push('');
  L.push('## The account (canonical truth)');
  L.push('');
  for (const [k, items] of Object.entries(proj.account))
    for (const it of items)
      L.push(it.kind === 'note' ? `- ${k}: ${it.value}` : `- ${k}: \`${it.path}\`${it.exists ? (it.entries != null ? ` (${it.entries} entries)` : '') : ' — MISSING'}`);
  L.push('');
  if (proj.decisions.length) {
    L.push('## Decisions');
    L.push('');
    for (const d of proj.decisions) L.push(`- \`${d.file}\` — ${d.title}`);
    L.push('');
  }
  return L.join('\n');
}

export function derive(root, opts = {}) {
  const outDir = resolve(root, opts.out ?? 'derived');
  mkdirSync(outDir, { recursive: true });
  // Two passes on purpose: the first write creates this derivation's own
  // artifacts, so a fresh clone's first run would otherwise embed a stale
  // BLOCKED ("derived/recovery-brief.md does not resolve") about itself.
  // The second projection validates against the now-existing files.
  let proj = deriveProjection(root, opts);
  writeFileSync(join(outDir, 'boot-packet.json'), renderBootPacket(proj));
  writeFileSync(join(outDir, 'recovery-brief.md'), renderRecoveryBrief(proj));
  proj = deriveProjection(root, opts);
  writeFileSync(join(outDir, 'boot-packet.json'), renderBootPacket(proj));
  writeFileSync(join(outDir, 'recovery-brief.md'), renderRecoveryBrief(proj));
  return { proj, outDir };
}

// ── CLI + self-test ────────────────────────────────────────────────
const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

function selftest() {
  let n = 0;
  const ok = (cond, label) => { n++; if (!cond) { console.error(`FAIL: ${label}`); process.exit(1); } };
  const fx = mkdtempSync(join(tmpdir(), 'bp-account-derive-'));
  mkdirSync(join(fx, 'decisions'), { recursive: true });
  writeFileSync(join(fx, 'decisions', '01-thing.md'), '# Decision 01 — pick the thing\nbody');
  writeFileSync(join(fx, 'HANDOFF.md'), 'state');
  writeFileSync(join(fx, 'actor-output.yml'), `
initiative: fixture
account:
  decisions: decisions/
  state: HANDOFF.md
actors:
  - id: maintainer
    kind: human
    evidence: { status: intrinsic }
    outcomes:
      - id: recover
        success:
          statement: resume
          proof:
            target: { method: observed-human, signal: resumes }
            interim: { method: cold-agent, signal: cold resume }
outputs:
  - id: recovery-brief
    type: recovery-brief
    serves: [maintainer.recover]
    status: planned
    renderer: derived-markdown
    clearance: internal
`);
  const { proj, outDir } = derive(fx);
  ok(proj.schema === SCHEMA && proj.initiative === 'fixture', 'projection carries schema + initiative');
  ok(proj.verdict.state === 'PENDING' && proj.verdict.pendings.length === 1, 'verdict embedded (planned-only → PENDING)');
  ok(proj.account.decisions[0].exists && proj.account.decisions[0].entries === 1, 'account resolved with entry counts');
  ok(proj.decisions.length === 1 && proj.decisions[0].title.includes('pick the thing'), 'decisions indexed by title');
  const brief = readFileSync(join(outDir, 'recovery-brief.md'), 'utf8');
  ok(brief.includes('manifest verdict: PENDING') && brief.includes('PENDING is not green'), 'brief leads with the honest verdict');
  ok(brief.includes('never hand-edit'), 'brief declares itself derived');
  const packet = JSON.parse(readFileSync(join(outDir, 'boot-packet.json'), 'utf8'));
  ok(packet.schema === SCHEMA && packet.as_of != null, 'boot packet is schema-stamped JSON with as_of');
  // rerunnable: second derivation overwrites cleanly
  derive(fx);
  ok(existsSync(join(outDir, 'boot-packet.json')), 'derivation is rerunnable');
  rmSync(fx, { recursive: true, force: true });
  console.log(`selftest OK (${n} assertions; projection + boot packet + recovery brief)`);
}

if (isEntry && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))) selftest();
else if (isEntry) {
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : dflt; };
  const root = arg('root', process.cwd());
  const { proj, outDir } = derive(root, { manifest: arg('manifest', 'actor-output.yml'), out: arg('out', 'derived') });
  console.log(`${proj.initiative}: derived boot-packet.json + recovery-brief.md → ${outDir} (verdict ${proj.verdict.state}, as_of ${proj.as_of})`);
}
