#!/usr/bin/env node
// Experimental candidate-B manifest validator — research artifact, deliberately OUTSIDE
// template/. Exists to prove the contract's rules are mechanically checkable against
// real specimens and real negative fixtures (Codex round 4 pre-ADR requirement).
// Usage: node validate.mjs <manifest.yml> [...more]   — exit 1 if any manifest has errors.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOTS_FILE = join(HERE, '..', 'specimens', 'roots.local.yml');
const ROOTS = existsSync(ROOTS_FILE) ? parse(readFileSync(ROOTS_FILE, 'utf8')) : {};

const STATUSES = ['planned', 'draft', 'ready', 'issued', 'retired'];
const SERVING = ['ready', 'issued'];           // lifecycle states that count as serving an outcome
const PATHY = (s) => typeof s === 'string' && /^[A-Za-z0-9_.\/-]+$/.test(s) && /[\/.]/.test(s);

// Evidence-grade lattice: what a receipt's provenance may claim. Everything below
// observed-human may NOT claim "reader served" (human_validation: passed).
function grade(v) {
  const s = String(v).toLowerCase();
  if (/observed-human|^human:/.test(s)) return 'observed-human';
  if (/persona-walk|simulated/.test(s)) return 'simulated-walk';
  if (/cold-agent|agent/.test(s)) return 'cold-agent';
  if (/mechanical|lint|build/.test(s)) return 'mechanical';
  return null;
}

function validate(file) {
  const m = parse(readFileSync(file, 'utf8'));
  const errors = [], warns = [];
  const E = (rule, msg) => errors.push(`[${rule}] ${msg}`);
  const W = (rule, msg) => warns.push(`[${rule}] ${msg}`);

  // R8 — schema routing (legacy portal_type vs viewer-output schema)
  const hasLegacy = m.portal_type != null;
  const hasNew = m.viewers != null || m.outputs != null;
  if (hasLegacy && hasNew) {
    E('R8-routing', `both legacy portal_type and viewer-output schema declared — pick one (or an explicit migration: mode)`);
    return { file, errors, warns };
  }
  if (hasLegacy) {
    W('R8-routing', `legacy portal_type=${m.portal_type} — routed to existing portal reviewers + deprecation warn; new rules skipped`);
    return { file, errors, warns };
  }
  if (!hasNew) { E('R8-routing', 'no schema declared (neither portal_type nor viewers/outputs)'); return { file, errors, warns }; }

  const rcfg = ROOTS[m.initiative];
  const root = typeof rcfg === 'string' ? rcfg : rcfg?.root;
  const localMap = (rcfg && typeof rcfg === 'object' && rcfg.paths) || {};
  if (!root) W('R7-paths', `no root for initiative "${m.initiative}" in roots.local.yml — path resolution skipped`);
  const onDisk = (p) => root ? existsSync(resolve(root, p)) : null;
  // De-named path indirection: "local:<key>" resolves via the roots map, so public
  // specimens never carry counterparty-identifying filenames.
  const deref = (p) => {
    if (typeof p !== 'string' || !p.startsWith('local:')) return { path: p };
    const mapped = localMap[p.slice(6)];
    if (!mapped) return root ? { error: `de-named path key "${p}" not mapped in roots.local.yml` } : { path: null };
    return { path: mapped };
  };

  // Index viewers/outcomes/outputs
  const outcomes = new Map();                   // "viewer.outcome" -> {viewer, outcome}
  const viewerIds = new Set();
  for (const v of m.viewers ?? []) {
    if (viewerIds.has(v.id)) E('R1-refs', `duplicate viewer id ${v.id}`);
    viewerIds.add(v.id);
    if (v.evidence?.status === 'observed' && !v.evidence?.source)
      E('R1-refs', `viewer ${v.id} is observed but cites no source`);
    if (v.evidence?.source) {
      const r = deref(v.evidence.source);
      if (r.error) E('R7-paths', `viewer ${v.id}: ${r.error}`);
      else if (r.path && PATHY(r.path) && onDisk(r.path) === false)
        E('R7-paths', `viewer ${v.id} evidence source does not resolve: ${v.evidence.source}`);
    }
    for (const o of v.outcomes ?? []) {
      outcomes.set(`${v.id}.${o.id}`, { viewer: v, outcome: o, servedBy: [] });
      const proof = o.success?.proof;
      if (!o.success?.statement) E('R1-refs', `outcome ${v.id}.${o.id} has no success statement`);
      if (!proof) { W('R1-refs', `outcome ${v.id}.${o.id} has no proof block — legal while drafting, can never yield a "reader served" receipt`); continue; }
      const target = proof.target ?? (proof.method ? proof : null);   // legacy single-proof = target
      if (!target?.method) { E('R5-proof', `outcome ${v.id}.${o.id} proof has no target method`); continue; }
      // R5 — proof-grade / viewer-kind compatibility
      if (v.kind === 'human' && target.method !== 'observed-human')
        E('R5-proof', `human outcome ${v.id}.${o.id} has target proof "${target.method}" — agent/simulated proof can never establish "reader served"; use it as interim under an observed-human target`);
      if (v.kind === 'agent' && target.method === 'observed-human')
        W('R5-proof', `agent outcome ${v.id}.${o.id} targets observed-human — unusual; confirm intended`);
    }
  }

  const outputIds = new Set();
  for (const o of m.outputs ?? []) {
    if (outputIds.has(o.id)) E('R1-refs', `duplicate output id ${o.id}`);
    outputIds.add(o.id);
    const status = o.status ?? 'draft';
    if (!o.status) W('R2-lifecycle', `output ${o.id} has no status — defaulting to draft (does not serve)`);
    if (!STATUSES.includes(status)) E('R2-lifecycle', `output ${o.id} has unknown status "${status}"`);

    // R1 — serves references resolve
    for (const ref of o.serves ?? []) {
      const target = outcomes.get(ref);
      if (!target) { E('R1-refs', `output ${o.id} serves unknown outcome "${ref}"`); continue; }
      target.servedBy.push({ id: o.id, status });
    }

    // R3 — recipient-safe is a proven state, not declared metadata
    if (o.clearance === 'recipient-safe') {
      if (o.projection?.mode !== 'allowlist')
        E('R3-clearance', `output ${o.id} is recipient-safe but projection.mode is "${o.projection?.mode ?? 'absent'}" — recipient-safe REQUIRES allowlist projection (cite-mode may reference any internal content)`);
      if (!Array.isArray(o.projection?.forbidden) || o.projection.forbidden.length === 0)
        E('R3-clearance', `output ${o.id} is recipient-safe with no forbidden classifications (leakage lint has no denylist)`);
      if (o.assurance?.leakage_lint !== 'required')
        E('R3-clearance', `output ${o.id} is recipient-safe without leakage_lint: required (hard-fail-before-write)`);
      if (o.assurance?.issuance !== 'human')
        E('R3-clearance', `output ${o.id} is recipient-safe without human issuance attestation`);
    }

    // R4 — receipt grade cannot exceed its provenance
    const hv = o.assurance?.human_validation;
    if (hv === 'passed') {
      const by = o.assurance?.validated_by;
      if (!by) E('R4-grades', `output ${o.id} claims human_validation: passed with no validated_by provenance`);
      else {
        const g = grade(by);
        if (g !== 'observed-human')
          E('R4-grades', `output ${o.id} claims human_validation: passed but provenance "${by}" is grade ${g ?? 'unknown'} — a ${g === 'simulated-walk' ? 'simulated-walk receipt may claim "contract-legible" only' : 'non-human receipt cannot claim "reader served"'}`);
      }
    }

    // R7 — declared artifacts resolve when lifecycle requires them
    if (o.artifact && SERVING.includes(status) && onDisk(o.artifact) === false)
      E('R7-paths', `output ${o.id} (status ${status}) declares artifact that does not resolve: ${o.artifact}`);
    if (o.config_source && status !== 'planned' && onDisk(o.config_source) === false)
      E('R7-paths', `output ${o.id} (status ${status}) declares config_source that does not resolve: ${o.config_source}`);
    for (const s of o.projection?.sources ?? [])
      if (PATHY(s) && SERVING.includes(status) && onDisk(s) === false)
        E('R7-paths', `output ${o.id} projection source does not resolve: ${s}`);
  }

  // R2 — every declared outcome is served by something real
  for (const [ref, { servedBy }] of outcomes) {
    if (servedBy.length === 0) E('R2-lifecycle', `unserved outcome: ${ref} — declared viewer need with no output serving it`);
    else if (!servedBy.some((s) => SERVING.includes(s.status)))
      W('R2-lifecycle', `outcome ${ref} is served only by ${servedBy.map((s) => `${s.id}(${s.status})`).join(', ')} — PENDING, not green`);
  }

  // R6 — typed preconditions are enforceable orderings
  for (const p of m.preconditions ?? []) {
    if (!outputIds.has(p.blocks)) { E('R6-preconds', `precondition ${p.id} blocks unknown output "${p.blocks}"`); continue; }
    const blocked = (m.outputs ?? []).find((o) => o.id === p.blocks);
    const met = p.assertion === 'exists' ? onDisk(p.artifact) : null;
    if (met === false) {
      if (SERVING.includes(blocked.status ?? 'draft'))
        E('R6-preconds', `precondition ${p.id} UNMET (${p.artifact} missing) but blocked output ${p.blocks} is ${blocked.status} — ordering violated`);
      else W('R6-preconds', `precondition ${p.id} unmet (${p.artifact} missing) — ${p.blocks} may not advance to ready/issued until it exists`);
    }
  }

  // R7 — account paths always resolve (the account is canonical truth)
  for (const [k, v] of Object.entries(m.account ?? {}))
    for (const item of Array.isArray(v) ? v : [v]) {
      const r = deref(item);
      if (r.error) E('R7-paths', `account.${k}: ${r.error}`);
      else if (r.path && PATHY(r.path) && onDisk(r.path) === false)
        E('R7-paths', `account.${k} does not resolve: ${item}`);
    }

  return { file, errors, warns };
}

let anyErrors = false;
for (const file of process.argv.slice(2)) {
  const { errors, warns } = validate(file);
  const name = file.split('/').slice(-1)[0];
  console.log(`\n=== ${name}: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} errors, ${warns.length} warns)`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  for (const w of warns) console.log(`  warn  ${w}`);
  if (errors.length) anyErrors = true;
}
process.exit(anyErrors ? 1 : 0);
