// recipient-safety.mjs — build-order step 4 of decisions/05 (wave 89):
// "recipient-safe" as a PROVEN state, not declared metadata.
//
// actor-output.mjs (R3) checks the DECLARATIONS: allowlist mode, denylist
// present, leakage_lint: required, human issuance, as_of, destination. This lib
// is the other half — it EXECUTES the proof at issuance time, generalizing the
// GSI package's sanitize.py mechanism:
//
//   1. Policy: `recipient-safety.yml` at the consumer root maps each forbidden
//      CLASSIFICATION the manifest names (pricing, negotiation, research/ …)
//      to concrete detectable patterns. A classification with no patterns is a
//      hard fail — an unexecutable denylist proves nothing.
//   2. Lint: every text file in the package is scanned BEFORE issuance; any
//      match is a hard fail with file/line/class. Hard-fail-before-write —
//      never write-then-check.
//   3. Attestation: a clean lint + `--attest --by <person>` records a
//      structured issuance receipt (sha256 of every file, as_of, destination,
//      issuer, timestamp) under derived/issuance/. Human issuance is a RECORDED
//      act, not a yaml field.
//   4. Verify: re-hashes the package against the recorded attestation — a
//      changed byte after attestation is a fail. "Configured to be checked" and
//      "recipient-safe proven" are different states; only 1–4 together earn the
//      second.
//
// Honest boundary: selector-level EXTRACTION from mixed-clearance sources (the
// BRD §9 projection) remains consumer tooling — this lib proves the issued
// bytes, whatever produced them.
//
// Dependency-free (matches template/tools/lib/*). CLI:
//   node recipient-safety.mjs lint   --root <dir> --output <id> --package <path>
//   node recipient-safety.mjs attest --root <dir> --output <id> --package <path> --by <person>
//   node recipient-safety.mjs verify --root <dir> --output <id> --package <path>

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, statSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { parseManifest } from './actor-output.mjs';

const TEXT_EXT = /\.(html?|md|txt|csv|json|ya?ml|xml|svg|js|mjs|ts|css)$/i;
const POLICY_FILE = 'recipient-safety.yml';

function listFiles(p) {
  const abs = resolve(p);
  if (statSync(abs).isFile()) return [abs];
  const out = [];
  for (const f of readdirSync(abs)) {
    if (f.startsWith('.')) continue;
    const child = join(abs, f);
    out.push(...(statSync(child).isDirectory() ? listFiles(child) : [child]));
  }
  return out;
}

export function loadPolicy(root) {
  const p = resolve(root, POLICY_FILE);
  if (!existsSync(p)) return null;
  const doc = parseManifest(readFileSync(p, 'utf8'));
  return doc.forbidden_patterns ?? null;
}

function findOutput(root, outputId, manifestName = 'actor-output.yml') {
  const m = parseManifest(readFileSync(resolve(root, manifestName), 'utf8'));
  const o = (m.outputs ?? []).find((o) => o.id === outputId);
  if (!o) throw new Error(`output "${outputId}" not declared in ${manifestName}`);
  return o;
}

// Execute the leakage lint. Returns { clean, hits, problems } — `problems` are
// policy-level failures (missing policy / unmapped classification), which fail
// exactly like hits: an unexecutable denylist proves nothing.
export function lintPackage({ root, output, packagePath }) {
  const hits = [], problems = [];
  const forbidden = output.projection?.forbidden ?? [];
  const policy = loadPolicy(root);
  if (!policy) problems.push(`no ${POLICY_FILE} at consumer root — the manifest's forbidden classifications are not executable`);
  const compiled = [];
  for (const cls of forbidden) {
    const pats = policy?.[cls];
    if (!Array.isArray(pats) || pats.length === 0) { problems.push(`classification "${cls}" has no patterns in ${POLICY_FILE}`); continue; }
    for (const p of pats) compiled.push({ cls, re: new RegExp(p, 'i') });
  }
  const files = listFiles(resolve(root, packagePath));
  for (const f of files) {
    if (!TEXT_EXT.test(f)) continue; // binaries (images, zips) are hashed at attestation, not pattern-scanned
    const lines = readFileSync(f, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++)
      for (const { cls, re } of compiled)
        if (re.test(lines[i])) hits.push({ file: relative(resolve(root), f), line: i + 1, class: cls, pattern: re.source });
  }
  return { clean: hits.length === 0 && problems.length === 0, hits, problems, filesScanned: files.length };
}

const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

function packageHashes(root, packagePath) {
  const base = resolve(root, packagePath);
  const entries = {};
  for (const f of listFiles(base)) entries[relative(statSync(base).isFile() ? resolve(base, '..') : base, f)] = sha256(f);
  return entries;
}

const attestPath = (root, outputId) => resolve(root, 'derived', 'issuance', `${outputId}.json`);

// Record the issuance attestation — only after a clean executed lint.
export function attestIssuance({ root, output, packagePath, by, now = new Date().toISOString() }) {
  const lint = lintPackage({ root, output, packagePath });
  if (!lint.clean) return { ok: false, lint };
  if (!by) return { ok: false, error: 'issuance requires --by <person> — human issuance is a recorded act, not a default' };
  const record = {
    schema: 'issuance-attestation/1',
    output: output.id,
    issued_by: by,
    at: now,
    as_of: output.projection?.as_of ?? null,
    destination: output.assurance?.destination ?? null,
    package: packagePath,
    files: packageHashes(root, packagePath),
    lint: { filesScanned: lint.filesScanned, classifications: output.projection?.forbidden ?? [] },
  };
  const dst = attestPath(root, output.id);
  mkdirSync(resolve(dst, '..'), { recursive: true });
  writeFileSync(dst, JSON.stringify(record, null, 2) + '\n');
  return { ok: true, record, path: dst };
}

// Verify a recorded attestation against the package as it exists NOW.
export function verifyIssuance({ root, output, packagePath }) {
  const p = attestPath(root, output.id);
  if (!existsSync(p)) return { ok: false, error: `no recorded issuance attestation for "${output.id}" — recipient-safe is not proven` };
  const record = JSON.parse(readFileSync(p, 'utf8'));
  const current = packageHashes(root, packagePath);
  const mismatches = [];
  for (const [f, h] of Object.entries(record.files)) {
    if (current[f] == null) mismatches.push(`${f}: missing from package`);
    else if (current[f] !== h) mismatches.push(`${f}: hash changed since attestation`);
  }
  for (const f of Object.keys(current)) if (record.files[f] == null) mismatches.push(`${f}: added after attestation`);
  return mismatches.length ? { ok: false, error: 'package differs from attested bytes', mismatches, record } : { ok: true, record };
}

// ── CLI + self-test ────────────────────────────────────────────────
const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

function selftest() {
  let n = 0;
  const ok = (cond, label) => { n++; if (!cond) { console.error(`FAIL: ${label}`); process.exit(1); } };
  const fx = mkdtempSync(join(tmpdir(), 'bp-recipient-safety-'));
  mkdirSync(join(fx, 'pkg'), { recursive: true });
  writeFileSync(join(fx, 'actor-output.yml'), `
initiative: fixture
actors:
  - id: counterparty
    kind: human
    evidence: { status: observed, source: pkg/note.md }
    outcomes:
      - id: verify
        success:
          statement: accepts delivery
          proof: { target: { method: observed-human, signal: accepted } }
outputs:
  - id: bundle
    type: issued-package
    serves: [counterparty.verify]
    status: issued
    clearance: recipient-safe
    projection:
      mode: allowlist
      sources: [substrate]
      forbidden: [pricing, negotiation]
      as_of: abc123
    assurance: { leakage_lint: required, issuance: human, destination: frozen-zip }
`);
  writeFileSync(join(fx, 'pkg', 'note.md'), 'Coverage report: 14 clips delivered, turnaround 36h.');
  const output = findOutput(fx, 'bundle');

  // 1. no policy file → lint FAILS (unexecutable denylist proves nothing)
  ok(!lintPackage({ root: fx, output, packagePath: 'pkg' }).clean, 'missing policy is a lint failure, not a pass');

  writeFileSync(join(fx, POLICY_FILE), `
forbidden_patterns:
  pricing: ['\\$\\s?\\d+', 'pricing', 'price list']
  negotiation: ['negotiat', 'walk-away']
`);
  // 2. clean package lints clean
  ok(lintPackage({ root: fx, output, packagePath: 'pkg' }).clean, 'clean package passes executed lint');

  // 3. leak → hard fail with file/line/class
  writeFileSync(join(fx, 'pkg', 'leak.md'), 'Our walk-away number is $4500.');
  const dirty = lintPackage({ root: fx, output, packagePath: 'pkg' });
  ok(!dirty.clean && dirty.hits.some((h) => h.class === 'negotiation' && h.file.endsWith('leak.md') && h.line === 1), 'leak caught with file/line/class');
  ok(dirty.hits.some((h) => h.class === 'pricing'), 'multiple classifications caught in one pass');

  // 4. attestation refuses a dirty package
  ok(attestIssuance({ root: fx, output, packagePath: 'pkg', by: 'operator' }).ok === false, 'attestation refuses a dirty package');
  rmSync(join(fx, 'pkg', 'leak.md'));

  // 5. attestation requires a human
  ok(attestIssuance({ root: fx, output, packagePath: 'pkg' }).ok === false, 'attestation without --by refused');

  // 6. clean attest records hashes + as_of + destination
  const att = attestIssuance({ root: fx, output, packagePath: 'pkg', by: 'operator', now: '2026-07-20T00:00:00Z' });
  ok(att.ok && att.record.as_of === 'abc123' && att.record.destination === 'frozen-zip' && Object.keys(att.record.files).length === 1, 'attestation records provenance + hashes');

  // 7. verify passes on untouched bytes, fails on tamper and on additions
  ok(verifyIssuance({ root: fx, output, packagePath: 'pkg' }).ok, 'verify passes on attested bytes');
  writeFileSync(join(fx, 'pkg', 'note.md'), 'Coverage report: 14 clips delivered, turnaround 36h. (edited)');
  ok(!verifyIssuance({ root: fx, output, packagePath: 'pkg' }).ok, 'verify fails on post-attestation edit');
  writeFileSync(join(fx, 'pkg', 'note.md'), 'Coverage report: 14 clips delivered, turnaround 36h.');
  writeFileSync(join(fx, 'pkg', 'extra.md'), 'added later');
  ok(!verifyIssuance({ root: fx, output, packagePath: 'pkg' }).ok, 'verify fails on file added after attestation');
  rmSync(join(fx, 'pkg', 'extra.md'));

  // 8. verify without any attestation → not proven
  const output2 = { ...output, id: 'never-attested' };
  ok(!verifyIssuance({ root: fx, output: output2, packagePath: 'pkg' }).ok, 'no attestation → not proven');

  rmSync(fx, { recursive: true, force: true });
  console.log(`selftest OK (${n} assertions; executed lint + recorded issuance + byte-verify)`);
}

if (isEntry && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))) selftest();
else if (isEntry) {
  const cmd = process.argv[2];
  const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
  const root = arg('root') ?? process.cwd();
  const output = findOutput(root, arg('output') ?? (() => { throw new Error('--output <id> required'); })());
  const packagePath = arg('package') ?? (() => { throw new Error('--package <path> required'); })();
  if (cmd === 'lint') {
    const r = lintPackage({ root, output, packagePath });
    for (const p of r.problems) console.log(`  POLICY ${p}`);
    for (const h of r.hits) console.log(`  LEAK   ${h.file}:${h.line} [${h.class}] /${h.pattern}/`);
    console.log(r.clean ? `clean — ${r.filesScanned} file(s) scanned` : 'DIRTY — do not issue');
    process.exit(r.clean ? 0 : 1);
  } else if (cmd === 'attest') {
    const r = attestIssuance({ root, output, packagePath, by: arg('by') });
    if (!r.ok) { console.error(r.error ?? 'lint dirty — attestation refused'); process.exit(1); }
    console.log(`attested → ${r.path}`);
  } else if (cmd === 'verify') {
    const r = verifyIssuance({ root, output, packagePath });
    if (!r.ok) { console.error(r.error); for (const m of r.mismatches ?? []) console.error(`  ${m}`); process.exit(1); }
    console.log(`verified — bytes match attestation by ${r.record.issued_by} at ${r.record.at}`);
  } else {
    console.error('usage: recipient-safety.mjs lint|attest|verify --root <dir> --output <id> --package <path> [--by <person>]');
    process.exit(2);
  }
}
