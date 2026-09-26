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
import { isTemplateDoc } from './stage-model.mjs';
import { splitFrontmatter } from './yaml-scalar.mjs';

const SCHEMA = 'actor-output-boot/1';

function gitInfo(root) {
  try {
    const commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const subjects = execSync('git log -5 --pretty=%s', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n');
    return { commit, subjects };
  } catch { return { commit: 'no-git', subjects: [] }; }
}

// The command that regenerates derived/ in THIS repo. The brief prints it, so it
// must exist here: stamped initiatives shipped a brief that said `npm run derive`
// with no such script (wave 109), and a Review Portal stamp has no package.json.
export function refreshCommand(root) {
  let scripts = {};
  try { scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts ?? {}; } catch { /* no package.json */ }
  if (/account-derive\.mjs/.test(scripts.derive ?? '')) return 'npm run derive';
  if (existsSync(join(root, 'tools', 'lib', 'account-derive.mjs'))) return 'node tools/lib/account-derive.mjs --root .';
  return 'node $BLUEPRINT_HOME/template/tools/lib/account-derive.mjs --root .';
}

// Entries in an account directory, leaving out hidden files and templates, so
// the count agrees with the decisions index below.
function entryCount(dir) {
  return readdirSync(dir, { withFileTypes: true }).filter((e) => {
    if (e.name.startsWith('.')) return false;
    if (e.isFile() && e.name.endsWith('.md')) return !isTemplateDoc(e.name, readFileSync(join(dir, e.name), 'utf8'));
    return !e.name.startsWith('_');
  }).length;
}

function decisionsIndex(root, account) {
  const dirs = [].concat(account?.decisions ?? []).filter((d) => typeof d === 'string');
  const out = [];
  for (const d of dirs) {
    const abs = resolve(root, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((f) => f.endsWith('.md')).sort()) {
      const text = readFileSync(join(abs, f), 'utf8');
      if (isTemplateDoc(f, text)) continue;
      // The title is the first H1 after the frontmatter: the decision template's
      // frontmatter carries commented `# serves: …` lines, and an ADR copied
      // from it keeps them.
      const first = splitFrontmatter(text).body.split('\n').find((l) => l.startsWith('# '));
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
      return { path: item, exists, ...(exists && statSync(abs).isDirectory() ? { entries: entryCount(abs) } : {}) };
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
    refresh: refreshCommand(root),
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
  L.push(`Derived ${proj.generated_at} at commit \`${proj.as_of}\` — rerun \`${proj.refresh}\` to refresh; never hand-edit.`);
  L.push('');
  if (proj.as_of === 'no-git') {
    L.push(`This brief was derived before the first git commit, so it records no commit. Run \`${proj.refresh}\` again after the first commit.`);
    L.push('');
  }
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
  // The stamped decision template, an ADR copied from it that kept its commented
  // frontmatter lines, and a document that marks itself a template.
  const templateFrontmatter = (adr) => `---\nadr: ${adr}\n# serves: none   # ONLY for infrastructure/provenance\n---\n\n`;
  writeFileSync(join(fx, 'decisions', '_TEMPLATE.md'), `${templateFrontmatter('NNNN')}# ADR-NNNN — <decision title>\n`);
  writeFileSync(join(fx, 'decisions', '02-copied.md'), `${templateFrontmatter('0002')}# ADR-0002 — keep the comments\n`);
  writeFileSync(join(fx, 'decisions', '03-marked.md'), '---\ntemplate: true\n---\n# A marked template\n');
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
  ok(proj.account.decisions[0].exists && proj.account.decisions[0].entries === 2, 'account entry count leaves templates out');
  ok(proj.decisions.map((d) => d.file).join() === 'decisions/01-thing.md,decisions/02-copied.md', 'decisions index skips _TEMPLATE.md and template: true');
  ok(proj.decisions[0].title.includes('pick the thing'), 'decisions indexed by title');
  ok(proj.decisions[1].title === 'ADR-0002 — keep the comments', 'title is the H1, not a commented frontmatter line');
  const brief = readFileSync(join(outDir, 'recovery-brief.md'), 'utf8');
  ok(brief.includes('manifest verdict: PENDING') && brief.includes('PENDING is not green'), 'brief leads with the honest verdict');
  ok(brief.includes('never hand-edit'), 'brief declares itself derived');
  ok(brief.includes(`rerun \`${proj.refresh}\` to refresh`), 'brief names the projection\'s refresh command');
  const packet = JSON.parse(readFileSync(join(outDir, 'boot-packet.json'), 'utf8'));
  ok(packet.schema === SCHEMA && packet.as_of != null, 'boot packet is schema-stamped JSON with as_of');
  // the refresh command is one that exists in the repo being derived
  ok(refreshCommand(fx) === 'node $BLUEPRINT_HOME/template/tools/lib/account-derive.mjs --root .', 'refresh: no script, no local copy → methodology-home form');
  mkdirSync(join(fx, 'tools', 'lib'), { recursive: true });
  writeFileSync(join(fx, 'tools', 'lib', 'account-derive.mjs'), '');
  ok(refreshCommand(fx) === 'node tools/lib/account-derive.mjs --root .', 'refresh: stamped copy → node command');
  writeFileSync(join(fx, 'package.json'), JSON.stringify({ scripts: { derive: 'node tools/state-derive/index.mjs' } }));
  ok(refreshCommand(fx) === 'node tools/lib/account-derive.mjs --root .', 'refresh: a derive script that runs something else is not trusted');
  writeFileSync(join(fx, 'package.json'), JSON.stringify({ scripts: { derive: 'node tools/lib/account-derive.mjs --root .' } }));
  ok(refreshCommand(fx) === 'npm run derive', 'refresh: an account-derive npm script → npm run derive');
  // a brief derived before the first commit says so; one with a commit does not
  const firstCommitLine = 'derived before the first git commit';
  ok(renderRecoveryBrief({ ...proj, as_of: 'no-git' }).includes(firstCommitLine), 'no-git brief asks for a rerun after the first commit');
  ok(!renderRecoveryBrief({ ...proj, as_of: 'abc1234' }).includes(firstCommitLine), 'brief with a commit has no first-commit line');
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
