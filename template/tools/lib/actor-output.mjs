// actor-output.mjs — the actor-output contract validator (decisions/05, wave 89).
//
// Validates an initiative's actor-output manifest: canonical account → actor
// outcome contracts → outputs (lifecycle + projection/clearance) → assurance
// receipts. Productizes the eight rule families proven by the experimental
// validator (research/portal-ia-rederivation/validator/) against four consumer
// specimens and five negative fixtures.
//
// Three-state verdict (never conflate lint with readiness):
//   PASS    — contract valid AND every declared outcome served by a ready/issued
//             output with no unmet obligations.
//   PENDING — structurally valid; planned/draft outputs, missing proofs, or
//             unmet-but-unblocking preconditions remain. A stage transition
//             MUST NOT treat PENDING as green.
//   BLOCKED — invalid, unsafe (clearance/grade violation), contradictory, or —
//             in gate mode — unverifiable (unresolvable root).
//
// Structured receipts only: provenance is a record {grade, observer, at, result},
// never a sniffed string. `human_validation: passed` requires an observed-human
// receipt; a legacy `validated_by:` string is a BLOCK with a migration message.
//
// Dependency-free by design (matches the other template/tools/lib/* tools).
// The manifest is authored YAML — comments carry the honesty notes the ceremony
// ratification assumed — so this lib carries its own SUBSET parser (nested maps,
// block/inline lists, inline flow maps, quoted scalars, comments). Not a YAML
// implementation; parse failures on exotic YAML are BLOCKs, by design.

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// ── YAML-subset parser ─────────────────────────────────────────────
// Strip a trailing comment: '#' at line start, or preceded by whitespace,
// outside single/double quotes.
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}
// Split on `sep` at depth 0 (outside {}, [], quotes).
function splitTop(s, sep) {
  const parts = []; let depth = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    if (c === '}' || c === ']' || c === ')') depth--;
    if (c === sep && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}
function parseScalar(s) {
  s = s.trim();
  if (s.startsWith('{')) {
    const obj = {};
    for (const part of splitTop(s.replace(/^\{|\}$/g, ''), ',')) {
      const ix = part.indexOf(': ');
      if (ix === -1) throw new Error(`flow-map entry has no "key: value": ${part.trim()}`);
      obj[part.slice(0, ix).trim()] = parseScalar(part.slice(ix + 2));
    }
    return obj;
  }
  if (s.startsWith('[')) return splitTop(s.replace(/^\[|\]$/g, ''), ',').map(parseScalar);
  const uq = s.replace(/^["']|["']$/g, '');
  return uq === 'null' || uq === '' ? null : uq;
}
export function parseManifest(text) {
  const lines = [];
  for (const raw of text.split('\n')) {
    const t = stripComment(raw);
    if (!t.trim()) continue;
    lines.push({ indent: t.match(/^ */)[0].length, text: t.trim() });
  }
  let i = 0;
  function parseNode(minIndent) {
    if (i >= lines.length || lines[i].indent < minIndent) return null;
    return lines[i].text.startsWith('- ') ? parseList(lines[i].indent) : parseMap(lines[i].indent);
  }
  function parseMap(indent) {
    const obj = {};
    while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith('- ')) {
      const ln = lines[i];
      const m = ln.text.match(/^([A-Za-z0-9_.\/-]+):(?:\s+(.*))?$/);
      if (!m) throw new Error(`unparseable map line: "${ln.text}"`);
      i++;
      if (m[2] !== undefined && m[2] !== '') obj[m[1]] = parseScalar(m[2]);
      else obj[m[1]] = (i < lines.length && lines[i].indent > indent) ? parseNode(indent + 1) : null;
    }
    return obj;
  }
  function parseList(indent) {
    const arr = [];
    while (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('- ')) {
      const rest = lines[i].text.slice(2);
      const kv = rest.match(/^([A-Za-z0-9_.\/-]+):(?:\s+(.*))?$/);
      if (kv) {
        // `- key: …` opens a map whose first entry sits on the dash line:
        // rewrite the line as the entry at indent+2 and let parseMap consume it
        // plus the following deeper lines.
        lines[i] = { indent: indent + 2, text: rest };
        arr.push(parseMap(indent + 2));
      } else { arr.push(parseScalar(rest)); i++; }
    }
    return arr;
  }
  const doc = parseNode(0) ?? {};
  if (i < lines.length) throw new Error(`trailing unparsed content at: "${lines[i].text}"`);
  return doc;
}

// ── validation ─────────────────────────────────────────────────────
const STATUSES = ['planned', 'draft', 'ready', 'issued', 'retired'];
const SERVING = ['ready', 'issued'];
const GRADES = ['mechanical', 'cold-agent', 'simulated-walk', 'observed-human'];
const PATHY = (s) => typeof s === 'string' && /^[A-Za-z0-9_.\/-]+$/.test(s) && /[\/.]/.test(s);

// validateManifest(manifest, { root, localPaths, gate }) → report
//   root       — absolute initiative root for on-disk resolution (required in gate mode)
//   localPaths — de-named `local:<key>` → relative-path map (kept out of public manifests)
//   gate       — true = readiness gate semantics (unverifiable ⇒ BLOCKED);
//                false/absent = lint semantics (unverifiable ⇒ warn + skip)
export function validateManifest(m, opts = {}) {
  const { root = null, localPaths = {}, gate = false } = opts;
  const errors = [], warns = [], pendings = [];
  const E = (rule, msg) => errors.push(`[${rule}] ${msg}`);
  const W = (rule, msg) => warns.push(`[${rule}] ${msg}`);
  const P = (rule, msg) => pendings.push(`[${rule}] ${msg}`);
  const report = (route) => ({
    route, errors, warns, pendings,
    verdict: errors.length ? 'BLOCKED' : pendings.length ? 'PENDING' : 'PASS',
  });

  // R8 — routing: legacy portal_type vs actor-output schema, mutually exclusive.
  let actors = m.actors;
  if (m.viewers != null) {
    if (actors != null) E('R8-routing', 'both actors: and viewers: declared — viewers: is the deprecated alias, keep one');
    else { actors = m.viewers; W('R8-routing', 'viewers: is deprecated — rename to actors: (decisions/05)'); }
  }
  const hasLegacy = m.portal_type != null;
  const hasNew = actors != null || m.outputs != null;
  if (hasLegacy && hasNew) { E('R8-routing', 'both legacy portal_type and actor-output schema declared — pick one (or an explicit migration: mode)'); return report('conflict'); }
  if (hasLegacy) { W('R8-routing', `legacy portal_type=${m.portal_type} — route to the existing portal reviewers (caller must INVOKE them, not just warn) + deprecation notice`); return report('legacy'); }
  if (!hasNew) { E('R8-routing', 'no schema declared (neither portal_type nor actors/outputs)'); return report('none'); }

  // Root resolution: gate mode BLOCKS without a verifiable root — skipped path
  // validation must never produce green readiness.
  if (!root && gate) E('R7-paths', 'gate mode requires a resolvable initiative root — path validation cannot be skipped for a readiness verdict');
  else if (!root) W('R7-paths', 'no initiative root supplied — path resolution skipped (lint only; a gate would BLOCK)');
  const onDisk = (p) => (root ? existsSync(resolve(root, p)) : null);
  const deref = (p) => {
    if (typeof p !== 'string' || !p.startsWith('local:')) return { path: p };
    const mapped = localPaths[p.slice(6)];
    if (!mapped) return root ? { error: `de-named path key "${p}" not mapped in the local roots map` } : { path: null };
    return { path: mapped };
  };
  const checkPath = (rule, label, value) => {
    const r = deref(value);
    if (r.error) E(rule, `${label}: ${r.error}`);
    else if (r.path && PATHY(r.path) && onDisk(r.path) === false) E(rule, `${label} does not resolve: ${value}`);
  };

  // Actors + outcomes (R1 refs, R5 proof-grade compatibility)
  const outcomes = new Map(); // "actor.outcome" -> { actor, outcome, servedBy }
  const actorIds = new Set();
  for (const a of actors ?? []) {
    if (actorIds.has(a.id)) E('R1-refs', `duplicate actor id ${a.id}`);
    actorIds.add(a.id);
    if (!['human', 'agent'].includes(a.kind)) E('R1-refs', `actor ${a.id} kind must be human|agent, got "${a.kind}"`);
    if (a.evidence?.status === 'observed' && !a.evidence?.source) E('R1-refs', `actor ${a.id} is observed but cites no source`);
    if (a.evidence?.source) checkPath('R7-paths', `actor ${a.id} evidence source`, a.evidence.source);
    for (const o of a.outcomes ?? []) {
      outcomes.set(`${a.id}.${o.id}`, { actor: a, outcome: o, servedBy: [] });
      if (!o.success?.statement) E('R1-refs', `outcome ${a.id}.${o.id} has no success statement`);
      const proof = o.success?.proof;
      if (!proof) { P('R5-proof', `outcome ${a.id}.${o.id} has no proof block — legal while drafting, can never yield a "reader served" receipt`); continue; }
      const target = proof.target ?? (proof.method ? proof : null);
      if (!target?.method) { E('R5-proof', `outcome ${a.id}.${o.id} proof has no target method`); continue; }
      if (!GRADES.includes(target.method)) E('R5-proof', `outcome ${a.id}.${o.id} target method "${target.method}" is not a known evidence grade`);
      if (a.kind === 'human' && target.method !== 'observed-human')
        E('R5-proof', `human outcome ${a.id}.${o.id} has target proof "${target.method}" — agent/simulated proof can never establish "reader served"; declare it as interim under an observed-human target`);
      if (a.kind === 'agent' && target.method === 'observed-human')
        W('R5-proof', `agent outcome ${a.id}.${o.id} targets observed-human — unusual; confirm intended`);
    }
  }

  // Outputs (R1 refs, R2 lifecycle, R3 clearance, R4 receipts, R7 paths)
  const outputIds = new Set();
  for (const o of m.outputs ?? []) {
    if (outputIds.has(o.id)) E('R1-refs', `duplicate output id ${o.id}`);
    outputIds.add(o.id);
    const status = o.status ?? 'draft';
    if (!o.status) W('R2-lifecycle', `output ${o.id} has no status — defaulting to draft (does not serve)`);
    if (!STATUSES.includes(status)) E('R2-lifecycle', `output ${o.id} has unknown status "${status}"`);
    for (const ref of o.serves ?? []) {
      const t = outcomes.get(ref);
      if (!t) { E('R1-refs', `output ${o.id} serves unknown outcome "${ref}"`); continue; }
      t.servedBy.push({ id: o.id, status });
    }

    // R3 — recipient-safe is a proven state, not declared metadata.
    if (o.clearance === 'recipient-safe') {
      if (o.projection?.mode !== 'allowlist')
        E('R3-clearance', `output ${o.id} is recipient-safe but projection.mode is "${o.projection?.mode ?? 'absent'}" — recipient-safe REQUIRES allowlist projection (cite-mode may reference any internal content)`);
      if (!Array.isArray(o.projection?.forbidden) || o.projection.forbidden.length === 0)
        E('R3-clearance', `output ${o.id} is recipient-safe with no forbidden classifications (leakage lint has no denylist)`);
      if (o.projection?.as_of == null)
        E('R3-clearance', `output ${o.id} is recipient-safe without as_of source versioning`);
      if (o.assurance?.leakage_lint !== 'required')
        E('R3-clearance', `output ${o.id} is recipient-safe without leakage_lint: required (hard-fail-before-write)`);
      if (o.assurance?.issuance !== 'human')
        E('R3-clearance', `output ${o.id} is recipient-safe without human issuance attestation`);
      if (o.assurance?.destination == null)
        E('R3-clearance', `output ${o.id} is recipient-safe without a destination policy (frozen bundle vs gated preview vs public)`);
    }

    // R4 — receipts are structured records; grade never inferred from strings.
    if (o.assurance?.validated_by != null)
      E('R4-receipts', `output ${o.id} uses legacy validated_by string — migrate to structured receipts: [{grade, observer, at, result, evidence?}]`);
    const receipts = o.assurance?.receipts ?? [];
    if (!Array.isArray(receipts)) E('R4-receipts', `output ${o.id} receipts must be a list`);
    else for (const [ix, r] of receipts.entries()) {
      for (const field of ['grade', 'observer', 'at', 'result'])
        if (r?.[field] == null) E('R4-receipts', `output ${o.id} receipt[${ix}] missing required field "${field}"`);
      if (r?.grade != null && !GRADES.includes(r.grade)) E('R4-receipts', `output ${o.id} receipt[${ix}] unknown grade "${r.grade}"`);
      if (r?.result != null && !['pass', 'fail'].includes(r.result)) E('R4-receipts', `output ${o.id} receipt[${ix}] result must be pass|fail`);
    }
    const hv = o.assurance?.human_validation;
    if (hv === 'passed') {
      const backing = Array.isArray(receipts) && receipts.some((r) => r?.grade === 'observed-human' && r?.result === 'pass');
      if (!backing) E('R4-receipts', `output ${o.id} claims human_validation: passed with no observed-human pass receipt — lower grades may claim "contract-legible"/"agent-usable" only, never "reader served"`);
    } else if (hv === 'FAILING' || hv === 'pending') {
      P('R4-receipts', `output ${o.id} human_validation is ${hv} — outcome success unproven`);
    }

    // R7 — declared artifacts resolve once lifecycle requires them.
    if (o.artifact && SERVING.includes(status)) checkPath('R7-paths', `output ${o.id} (status ${status}) artifact`, o.artifact);
    if (o.config_source && status !== 'planned') checkPath('R7-paths', `output ${o.id} (status ${status}) config_source`, o.config_source);
    for (const s of o.projection?.sources ?? [])
      if (SERVING.includes(status)) checkPath('R7-paths', `output ${o.id} projection source`, s);
  }

  // R2 — every declared outcome is served by something real.
  for (const [ref, { servedBy }] of outcomes) {
    if (servedBy.length === 0) E('R2-lifecycle', `unserved outcome: ${ref} — declared actor need with no output serving it`);
    else if (!servedBy.some((s) => SERVING.includes(s.status)))
      P('R2-lifecycle', `outcome ${ref} is served only by ${servedBy.map((s) => `${s.id}(${s.status})`).join(', ')} — PENDING, not green`);
  }

  // R6 — typed preconditions: enforceable orderings, not open-vocabulary labels.
  for (const p of m.preconditions ?? []) {
    if (!outputIds.has(p.blocks)) { E('R6-preconds', `precondition ${p.id} blocks unknown output "${p.blocks}"`); continue; }
    if (p.assertion !== 'exists') { E('R6-preconds', `precondition ${p.id} has unknown assertion "${p.assertion}"`); continue; }
    const blocked = (m.outputs ?? []).find((o) => o.id === p.blocks);
    const r = deref(p.artifact);
    if (r.error) { E('R6-preconds', `precondition ${p.id}: ${r.error}`); continue; }
    const met = r.path ? onDisk(r.path) : null;
    if (met === false) {
      if (SERVING.includes(blocked.status ?? 'draft'))
        E('R6-preconds', `precondition ${p.id} UNMET (${p.artifact} missing) but blocked output ${p.blocks} is ${blocked.status} — ordering violated`);
      else P('R6-preconds', `precondition ${p.id} unmet (${p.artifact} missing) — ${p.blocks} may not advance to ready/issued until it exists`);
    }
  }

  // R7 — account paths always resolve (the account is canonical truth).
  for (const [k, v] of Object.entries(m.account ?? {}))
    for (const item of Array.isArray(v) ? v : [v])
      if (typeof item === 'string') checkPath('R7-paths', `account.${k}`, item);

  return report('actor-output');
}

// Convenience: parse + validate a manifest file.
export function validateManifestFile(file, opts = {}) {
  let m;
  try { m = parseManifest(readFileSync(file, 'utf8')); }
  catch (e) { return { route: 'unparseable', verdict: 'BLOCKED', errors: [`[parse] ${e.message}`], warns: [], pendings: [] }; }
  return validateManifest(m, opts);
}

// ── CLI + self-test ────────────────────────────────────────────────
function selftest() {
  let n = 0;
  const ok = (cond, label) => { n++; if (!cond) { console.error(`FAIL: ${label}`); process.exit(1); } };
  const fx = mkdtempSync(join(tmpdir(), 'bp-actor-output-'));
  mkdirSync(join(fx, 'decisions'), { recursive: true });
  mkdirSync(join(fx, 'research'), { recursive: true });
  writeFileSync(join(fx, 'HANDOFF.md'), 'state');
  writeFileSync(join(fx, 'research', 'demand.md'), 'observed');

  const BASE = `
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
          statement: resume without re-derivation
          proof:
            target: { method: observed-human, signal: operator resumes }
            interim: { method: cold-agent, signal: cold session resumes }
  - id: reviewer
    kind: human
    evidence: { status: observed, source: local:demand }
    outcomes:
      - id: verify
        success:
          statement: accepts the delivery
          proof: { target: { method: observed-human, signal: accepted without round-trip } }
outputs:
  - id: brief
    type: recovery-brief
    serves: [maintainer.recover]
    status: ready
    artifact: HANDOFF.md
    clearance: internal
  - id: package
    type: issued-package
    serves: [reviewer.verify]
    status: issued
    clearance: recipient-safe
    projection:
      mode: allowlist
      sources: [substrate]
      forbidden: [research/, pricing]
      as_of: abc123
    assurance:
      leakage_lint: required
      issuance: human
      destination: private-handoff
      receipts:
        - { grade: observed-human, observer: operator, at: 2026-07-20, result: pass }
      human_validation: passed
`;
  const opts = { root: fx, localPaths: { demand: 'research/demand.md' } };

  // 1. parser handles the specimen shape (nested maps, dash-maps, flow maps, inline lists)
  const m = parseManifest(BASE);
  ok(m.actors.length === 2 && m.actors[0].outcomes[0].success.proof.interim.method === 'cold-agent', 'parser: nested structure');
  ok(m.outputs[1].projection.forbidden.length === 2, 'parser: inline list');

  // 2. fully-served, receipted manifest → PASS
  ok(validateManifest(m, opts).verdict === 'PASS', 'valid manifest PASSes');

  // 3. planned-only serving → PENDING (never green)
  const pend = parseManifest(BASE.replace('status: ready', 'status: planned'));
  const rp = validateManifest(pend, opts);
  ok(rp.verdict === 'PENDING' && rp.pendings.some((p) => p.includes('maintainer.recover')), 'planned-only service is PENDING');

  // 4. clearance leak (cite under recipient-safe) → BLOCKED
  const leak = parseManifest(BASE.replace('mode: allowlist', 'mode: cite'));
  ok(validateManifest(leak, opts).verdict === 'BLOCKED', 'recipient-safe + cite BLOCKs');

  // 5. passed without an observed-human receipt → BLOCKED; legacy validated_by → BLOCKED
  const nog = parseManifest(BASE.replace('grade: observed-human', 'grade: simulated-walk'));
  ok(validateManifest(nog, opts).errors.some((e) => e.includes('no observed-human pass receipt')), 'grade upgrade BLOCKs');
  const legacyBy = parseManifest(BASE.replace('human_validation: passed', 'validated_by: persona-walk-agent'));
  ok(validateManifest(legacyBy, opts).errors.some((e) => e.includes('legacy validated_by')), 'validated_by string BLOCKs');

  // 6. human outcome with agent-only target proof → BLOCKED
  const agentProof = parseManifest(BASE.replace('target: { method: observed-human, signal: operator resumes }', 'target: { method: cold-agent, signal: agent resumes }'));
  ok(validateManifest(agentProof, opts).errors.some((e) => e.includes('human outcome maintainer.recover')), 'agent proof for human outcome BLOCKs');

  // 7. serves-ref + unserved-outcome errors
  const badRef = parseManifest(BASE.replace('serves: [maintainer.recover]', 'serves: [maintainer.nonexistent]'));
  const rb = validateManifest(badRef, opts);
  ok(rb.errors.some((e) => e.includes('unknown outcome')) && rb.errors.some((e) => e.includes('unserved outcome: maintainer.recover')), 'bad ref + unserved outcome BLOCK');

  // 8. typed precondition: unmet + blocked output issued → BLOCKED; planned → PENDING
  const PRE = BASE + `preconditions:
  - id: baseline
    artifact: research/baseline.md
    assertion: exists
    blocks: package
`;
  ok(validateManifest(parseManifest(PRE), opts).errors.some((e) => e.includes('ordering violated')), 'unmet precondition on issued output BLOCKs');
  const prePlanned = parseManifest(PRE.replace('status: issued', 'status: planned'));
  ok(validateManifest(prePlanned, opts).verdict === 'PENDING', 'unmet precondition on planned output is PENDING');

  // 9. path resolution: bad account path BLOCKs; unmapped local: key BLOCKs
  ok(validateManifest(parseManifest(BASE.replace('state: HANDOFF.md', 'state: MISSING.md')), opts).errors.some((e) => e.includes('account.state')), 'bad account path BLOCKs');
  ok(validateManifest(m, { ...opts, localPaths: {} }).errors.some((e) => e.includes('not mapped')), 'unmapped local: key BLOCKs');

  // 10. gate vs lint: no root → gate BLOCKs, lint warns
  ok(validateManifest(m, { gate: true }).verdict === 'BLOCKED', 'gate mode without root BLOCKs');
  const lint = validateManifest(m, {});
  ok(lint.verdict !== 'BLOCKED' && lint.warns.some((w) => w.includes('path resolution skipped')), 'lint mode without root warns');

  // 11. routing: legacy-only routes; dual declaration conflicts; viewers: aliases with warn
  const legacy = validateManifest({ portal_type: 'initiative' }, opts);
  ok(legacy.route === 'legacy' && legacy.verdict === 'PASS', 'legacy-only routes to legacy reviewers');
  ok(validateManifest({ portal_type: 'initiative', actors: [] }, opts).route === 'conflict', 'dual declaration is a conflict');
  const alias = validateManifest(parseManifest(BASE.replace('actors:', 'viewers:')), opts);
  ok(alias.verdict === 'PASS' && alias.warns.some((w) => w.includes('deprecated')), 'viewers: alias works with deprecation warn');

  // 12. unparseable file → BLOCKED, not a throw
  const badFile = join(fx, 'bad.yml');
  writeFileSync(badFile, 'actors:\n  - id: x\n    outcomes: [}{');
  ok(validateManifestFile(badFile, opts).verdict === 'BLOCKED', 'unparseable manifest BLOCKs');

  rmSync(fx, { recursive: true, force: true });
  console.log(`selftest OK (${n} assertions; 8 rule families, 3-state verdict)`);
}

// Entry-module guard: without it, a PARENT process invoked with --selftest that
// merely imports this lib (doctor does) would re-trigger this block on import.
const isEntry = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isEntry && process.argv.includes('--selftest')) selftest();
else if (isEntry && process.argv[2]) {
  const file = process.argv[2];
  const gate = process.argv.includes('--gate');
  const rootIx = process.argv.indexOf('--root');
  const r = validateManifestFile(file, { gate, root: rootIx > -1 ? process.argv[rootIx + 1] : null });
  console.log(`${file}: ${r.verdict} (route ${r.route}; ${r.errors.length} errors, ${r.pendings.length} pending, ${r.warns.length} warns)`);
  for (const e of r.errors) console.log(`  ERROR ${e}`);
  for (const p of r.pendings) console.log(`  PEND  ${p}`);
  for (const w of r.warns) console.log(`  warn  ${w}`);
  process.exit(r.verdict === 'BLOCKED' ? 1 : 0);
}
