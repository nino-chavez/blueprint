// stage-model.mjs — the deterministic core of stage orchestration (ADR-0008).
//
// Declares the canonical stage model as DATA (not closures) and DERIVES an
// initiative's current stage state from artifacts-on-disk + blueprint.yml.
// `blueprint stage status` renders derived state. `stage advance` verifies the
// next transition; only its explicit --execute path writes workflow state.
//
// Architecture (ADR-0008, "deterministic core / agentic shell"): stage
// SEQUENCING is deterministic and lives here in code; the fuzzy NODE work
// (writing research, drafting the prototype, judging feedback) stays with the
// agent. Each gate is classified `derivable` — true = a program can decide it
// mechanically (the deterministic core); false = it needs an agent/human
// assertion (the agentic shell edge). A run against the methodology repo itself
// found 11/14 gates derivable — the evidence this split is real, not aspirational.
//
// Config-driven (ADR-0008 rollout step c): the model is declarative data keyed
// by a small CHECK_KINDS registry, so it is inspectable and overridable. A
// consumer selects a model via `stage_model:` in blueprint.yml — the built-in
// `greenfield` (default), or a repo-relative path to a JSON model file. The
// check IMPLEMENTATIONS stay in this registry (they must inspect the fs);
// the STRUCTURE (stages, order, gates, derivable flags) is now config.
//
// Dependency-free by design (matches the other template/tools/lib/* tools). No
// YAML dep — a top-level-key scan is all the loader needs (scalar select +
// block presence); the model shape itself travels as JSON when overridden.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve, isAbsolute, sep, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { invokedDirectly } from './invoked-directly.mjs';
import { resolveReviewer } from './reviewer-registry.mjs';
import { parseManifest } from './actor-output.mjs';
import { evaluateReviewLoop } from './review-loop.mjs';
import { readTopLevelYamlScalar, splitFrontmatter } from './yaml-scalar.mjs';
import { inspectApplicationDefinition } from './application-definition.mjs';

// ── fs helpers ─────────────────────────────────────────────────────
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const ls = (p) => (isDir(p) ? readdirSync(p) : []);
const read = (p) => (isFile(p) ? readFileSync(p, 'utf8') : '');
// A template is not an artifact. Blueprint marks one with a `_` filename prefix
// (persona-fit-reviewer and the audit ingesters already skip `_TEMPLATE.md`);
// a document can also declare `template: true` in its frontmatter. The stamped
// decisions/_TEMPLATE.md relies on its name alone: a copy keeps the template's
// frontmatter, so a marker there would hide every ADR made from it. The
// account projection's decisions index uses this same test.
export function isTemplateDoc(name, text = '') {
  return name.startsWith('_') || readTopLevelYamlScalar(splitFrontmatter(text).frontmatter, 'template') === 'true';
}
// The research templates are filled in place: the stamper plants them at the
// path their gate matches, so neither the name nor a frontmatter marker can
// tell a filled file from an unfilled one. A marker would have to be removed by
// hand, and a forgotten one travels into the deliverable. The template's own
// placeholder lines are the marker instead: a gate lists them as `placeholders`,
// and its file counts once none remain, so filling the file is what clears it.
// Lines compare with whitespace removed, so a formatter re-padding the empty
// catalog row still matches. A placeholder that is a table row stops counting
// once another row of the file has text: a catalog grows by rows added around
// its blank one. isTemplateDoc stays out of these gates: its `_` prefix names
// real supporting research too (`research/_inventory.md`).
const squash = (s) => s.replace(/\s+/g, '');
const isRow = (l = '') => l.trim().startsWith('|');
const hasText = (l) => /[^\s|:-]/.test(l);
const isRule = (l) => isRow(l) && l.includes('-') && !hasText(l);
export function placeholderLeft(text, placeholders = []) {
  const wanted = new Set(placeholders.map(squash).filter(Boolean));
  if (!wanted.size) return null;
  const lines = text.split('\n');
  // a row with text that is neither a header (the row above a |---| rule) nor a placeholder
  const filledRow = lines.some((l, n) => isRow(l) && hasText(l) && !isRule(lines[n + 1]) && !wanted.has(squash(l)));
  const i = lines.findIndex((l) => wanted.has(squash(l)) && !(isRow(l) && filledRow));
  return i < 0 ? null : { line: i + 1, text: lines[i].trim() };
}
// A gate that declares no placeholders reads no file content.
const unfilledIn = (file, placeholders) => (placeholders.length && file.endsWith('.md') ? placeholderLeft(read(file), placeholders) : null);
const unfilledNote = (rel, left) => `${rel} still holds a template placeholder (line ${left.line}: ${left.text})`;
const mdCount = (p) => ls(p).filter((f) => {
  if (!f.endsWith('.md')) return false;
  const text = read(join(p, f));
  return text.trim().length > 40 && !isTemplateDoc(f, text);
}).length;
const anyContains = (p, re) => ls(p).some((f) => f.endsWith('.md') && re.test(read(join(p, f))));

// Layout tolerance (calibrated against the real consumer fleet, 2026-07-08):
// real initiatives keep blueprint work at the root OR nested under `blueprint/`.
// Rather than resolve to one root (first-existing-wins, which lets an empty root
// stub SHADOW real work under blueprint/), each gate is evaluated against BOTH
// candidate roots and the BEST result is taken (see deriveStageStatus). So the
// kinds themselves stay root-agnostic — they read `c.root`.
const rootDirs = (root) => (isDir(join(root, 'blueprint')) ? [root, join(root, 'blueprint')] : [root]);
const rankState = (s) => (s === 'pass' ? 2 : s === 'partial' ? 1 : 0);
// a directory is a populated "leg" only if it holds ≥1 non-hidden entry — an
// empty stamp-time subdir (or a .gitkeep placeholder) is not research.
const isPopulatedDir = (d) => isDir(d) && ls(d).some((f) => !f.startsWith('.'));

// ── minimal blueprint.yml readers (no YAML dep) ────────────────────
// ymlHasBlock: true if a TOP-LEVEL `key:` has a non-empty inline value or an
// indented body. Anchored to zero indent on purpose — a key nested under some
// other block must NOT satisfy a top-level gate (the wave-77 mis-nesting class:
// `project.audience` silently re-parented under `terminology:`, commit 44f50b4).
export function ymlHasBlock(yml, key) {
  const lines = yml.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/); // zero-indent only
    if (!m || m[1] !== key) continue;
    const inlineVal = m[2].trim();
    if (inlineVal && inlineVal !== 'null' && !inlineVal.startsWith('#')) return true;
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim() || lines[j].trim().startsWith('#')) continue;
      if (lines[j].match(/^(\s*)/)[1].length > 0) return true; // indented child = block body
      break;
    }
  }
  return false;
}
// ymlScalar: the inline value of a top-level `key:` (quotes stripped), or null.
export function ymlScalar(yml, key) {
  return readTopLevelYamlScalar(yml, key);
}

// ── pilot-profile policy parsing ───────────────────────────────────
// The 7 required fields (canonical set: pilot-profile-lock-reviewer.mjs, which
// owns SUBSTANCE validation — semantics, ADR-lock, drift. This gate answers only
// "is a complete profile declared" so `advance` can block mechanically).
const PILOT_SCALARS = ['slug', 'display_name', 'pain_point', 'monetization_side', 'walkthrough_citation'];
const PILOT_LISTS = ['competitors_in_scope', 'out_of_scope_pilots'];
// readPilotProfile: shallow line-scan of the top-level pilot_profile: block +
// the pilot_profile_policy: scalar. Children are flat scalars or lists (inline
// `[a]` or block `- a`); no nesting. Returns { policy, present, filled, missing }.
export function readPilotProfile(yml) {
  const policy = ymlScalar(yml, 'pilot_profile_policy');
  const present = ymlHasBlock(yml, 'pilot_profile');
  const lines = yml.split('\n');
  const fields = {};
  let inBlock = false, lastKey = null;
  for (const line of lines) {
    if (/^pilot_profile:\s*(#.*)?$/.test(line)) { inBlock = true; continue; }
    if (!inBlock) continue;
    if (/^\S/.test(line) && line.trim()) break; // dedent to next top-level key
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const kv = t.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      const raw = kv[2].replace(/\s+#.*$/, '').trim();
      if (raw.startsWith('[')) fields[lastKey] = raw.replace(/^\[|\]$/g, '').split(',').map((s) => s.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
      else fields[lastKey] = raw.replace(/^["']|["']$/g, '').trim();
    } else if (t.startsWith('- ') && lastKey) {
      if (!Array.isArray(fields[lastKey])) fields[lastKey] = [];
      fields[lastKey].push(t.slice(2).replace(/^["']|["']$/g, '').trim());
    }
  }
  const missing = [
    ...PILOT_SCALARS.filter((k) => !(typeof fields[k] === 'string' && fields[k].length)),
    ...PILOT_LISTS.filter((k) => !(Array.isArray(fields[k]) && fields[k].length)),
  ];
  return { policy, present, fields, missing, filled: missing.length === 0 };
}

// ── reviewer-freshness fingerprints (ADR-0009) ─────────────────────
// A reviewer-recorded PASS is reusable only while (a) the reviewer file itself
// is unchanged (its sha256 is its effective version) and (b) the content the
// reviewer declared as its inputs is unchanged. Glob dialect is deliberately
// minimal (documented in ADR-0009 #4): 'dir/**' = every file under dir
// recursively; anything else = an exact file path. Hidden entries and
// node_modules are skipped. Fingerprint = sha256 over sorted
// "relpath\0contentsha\n" lines — stable across platforms.
export function fileSha256(p) {
  try { return createHash('sha256').update(readFileSync(p)).digest('hex'); } catch { return null; }
}
function walkFiles(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, acc);
    else if (e.isFile()) acc.push(p);
  }
  return acc;
}
export function fingerprintInputs(root, globs) {
  if (!Array.isArray(globs) || !globs.length) return null;
  root = resolve(root);
  const pairs = [];
  // Label = root-relative posix path for in-tree files, the raw path for
  // absolute out-of-tree entries (an absolute walkthrough_citation is legal;
  // join-mangling it would silently drop it from the hash).
  const pushFile = (f) => pairs.push([f.startsWith(root + sep) ? f.slice(root.length + 1).split(sep).join('/') : f, f]);
  for (const g of globs) {
    if (typeof g !== 'string' || !g.trim()) continue;
    if (g.endsWith('/**')) walkFiles(join(root, g.slice(0, -3))).forEach(pushFile);
    else {
      const p = isAbsolute(g) ? g : join(root, g);
      try { if (statSync(p).isFile()) pushFile(p); } catch { /* absent input = absent from the hash */ }
    }
  }
  // Zero matched files → null, NOT the constant empty-digest (review of
  // e81ad3a): a typo'd glob that silently matches nothing would otherwise
  // produce a permanently-"fresh" fingerprint — the exact false-green class
  // this mechanism exists to kill. Null forces a rerun every time, same as
  // having no declared inputs.
  if (!pairs.length) return null;
  const h = createHash('sha256');
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  for (const [label, f] of pairs) h.update(`${label}\0${fileSha256(f)}\n`);
  return h.digest('hex');
}

// ── check-kind registry ────────────────────────────────────────────
// Each kind: (params, ctx) -> { state: 'pass'|'partial'|'absent', evidence }.
// `missState` lets a gate treat a miss as 'partial' (soft) vs 'absent' (hard).
// Params come from (possibly consumer-authored) JSON, so each kind validates
// its own params and returns a `bad-params` absent state rather than throwing
// or — worse — silently building `new RegExp(undefined)` (= /undefined/i, which
// matches the literal "undefined"). deriveStageStatus also try/catches each
// gate as a backstop.
const badParams = (kind, why) => ({ state: 'absent', evidence: `${kind}: bad params (${why})` });
const CHECK_KINDS = {
  'yml-block': ({ key }, c) => !key ? badParams('yml-block', 'missing key')
    : ymlHasBlock(c.yml, key)
      ? { state: 'pass', evidence: `blueprint.yml: ${key} present` }
      : { state: 'absent', evidence: `blueprint.yml: no ${key}` },

  // POLICY-AWARE pilot gate (wave 86 — closes the vacuous-pass the audit found:
  // presence-only checking let a stamped all-empty profile read as pass).
  // `pilot_profile_policy: required` (stamped on every new non-research
  // initiative) makes an unfilled profile BLOCK advance: all 7 fields non-empty
  // + walkthrough_citation resolving to a real file. POLICY-FIELD absence — not
  // profile absence — is the legacy exception (wave-84 calibration: mature
  // pre-policy initiatives must not pin to Stage -1), so legacy trees never
  // block here; pilot-profile-lock-reviewer still owns their substance.
  'pilot-profile': (_p, c) => {
    const { policy, present, fields, missing, filled } = readPilotProfile(c.yml);
    const citation = typeof fields.walkthrough_citation === 'string' ? fields.walkthrough_citation : '';
    const citationOk = citation && existsSync(isAbsolute(citation) ? citation : join(c.root, citation));
    if (policy === 'required') {
      if (!present) return { state: 'absent', evidence: 'policy=required but no pilot_profile block' };
      if (!filled) return { state: missing.length === 7 ? 'absent' : 'partial', evidence: `policy=required; unfilled: ${missing.join(', ')}` };
      if (!citationOk) return { state: 'partial', evidence: `policy=required; walkthrough_citation does not resolve: ${citation}` };
      return { state: 'pass', evidence: 'pilot_profile complete (7/7 fields, citation resolves)' };
    }
    // Legacy-tolerance passes are VACUOUS (post-commit review of 5dfee3c):
    // they satisfy the spine without a real populated artifact, so they must
    // not count toward stagesComplete coverage — same class as the wave-84
    // optional-absent exclusion, which this kind bypassed when it dropped the
    // `optional` flag. A populated profile (either mode) is real progress.
    if (!present) return { state: 'pass', vacuous: true, evidence: 'no pilot_profile (legacy pre-policy initiative — reviewer owns substance)' };
    return filled
      ? { state: 'pass', evidence: `pilot_profile present, 7/7 fields filled${citationOk ? ', citation resolves' : ' (citation unresolved — reviewer will flag)'}` }
      : { state: 'pass', vacuous: true, evidence: `pilot_profile present, ${7 - missing.length}/7 fields filled (legacy tolerance — reviewer owns substance)` };
  },

  'dir-md-min': ({ dirs, min }, c) => {
    if (!Array.isArray(dirs) || !dirs.length || typeof min !== 'number') return badParams('dir-md-min', 'need dirs[] + numeric min');
    const n = Math.max(...dirs.map((d) => mdCount(join(c.root, d))));
    if (n >= min) return { state: 'pass', evidence: `${dirs.join('|')}: ${n} artifacts` };
    if (n > 0) return { state: 'partial', evidence: `${dirs.join('|')}: ${n} (<${min})` };
    return { state: 'absent', evidence: `${dirs.join('|')}: none` };
  },

  'dir-contains': ({ dir, pattern, missState = 'absent' }, c) => (!dir || !pattern) ? badParams('dir-contains', 'need dir + pattern')
    : anyContains(join(c.root, dir), new RegExp(pattern, 'i'))
      ? { state: 'pass', evidence: `${dir}: matched /${pattern}/` }
      : { state: missState, evidence: `${dir}: no /${pattern}/ match` },

  'file-exists': ({ path }, c) => !path ? badParams('file-exists', 'missing path')
    : isFile(join(c.root, path))
      ? { state: 'pass', evidence: `${path} present` }
      : { state: 'absent', evidence: `${path} missing` },

  // A match still holding one of the gate's `placeholders` does not count; the
  // evidence names it and its first remaining placeholder line.
  'name-match': ({ dirs, pattern, placeholders = [], missState = 'absent' }, c) => {
    if (!Array.isArray(dirs) || !dirs.length || !pattern) return badParams('name-match', 'need dirs[] + pattern');
    if (!Array.isArray(placeholders)) return badParams('name-match', 'placeholders must be an array');
    const re = new RegExp(pattern, 'i');
    const unfilled = [];
    const counted = dirs.some((d) => ls(join(c.root, d)).some((f) => {
      if (!re.test(f)) return false;
      const left = unfilledIn(join(c.root, d, f), placeholders);
      if (left) unfilled.push(unfilledNote(join(d, f), left));
      return !left;
    }));
    return counted
      ? { state: 'pass', evidence: `${dirs.join('|')}: filename ~ /${pattern}/` }
      : { state: missState, evidence: unfilled.length ? unfilled.join('; ') : `${dirs.join('|')}: no filename ~ /${pattern}/` };
  },

  'manual': ({ evidence }) => ({ state: 'partial', evidence: evidence || 'not derivable from disk — needs assertion' }),

  // The application-definition mapping is an explicit, root-only opt-in. A
  // clean mapping proves only source identity and reference consistency; it is
  // intentionally still partial until substantive review and trusted authority
  // exist outside this deterministic core.
  'application-definition-source': (params, c) => {
    if (!isPlainObject(params) || Object.keys(params).length) return badParams('application-definition-source', 'takes no params');
    const source = inspectApplicationDefinition({ initiativeRoot: c.root });
    const metadata = {
      manifest: source.manifest ?? null,
      source_status: source.source_status,
      source_fingerprint: source.source_fingerprint ?? null,
      method_hash: source.method_hash ?? null,
      authority: 'not-verified',
      allowed_actions: [],
      review_required: source.review_required,
      errors: source.errors,
    };
    const detail = source.errors.map(error => `${error.path ? `${error.path}${error.line ? `:${error.line}` : ''}: ` : ''}${error.code}: ${error.detail}`).join('; ');
    if (source.execution_error) return { state: 'absent', evidence: `application definition cannot be inspected: ${detail}`, executionError: true, applicationDefinition: metadata };
    if (source.source_status !== 'pass') return { state: 'absent', evidence: `application definition source failed: ${detail}`, applicationDefinition: metadata };
    return { state: 'partial', evidence: 'application definition source verified; substantive review and trusted authority remain required', applicationDefinition: metadata };
  },

  'deploy-signals': ({ paths = [], distDir }, c) => {
    if (!Array.isArray(paths)) return badParams('deploy-signals', 'paths must be an array');
    const hits = paths.filter((p) => existsSync(join(c.root, p)));
    const dist = distDir && isDir(join(c.root, distDir));
    return (hits.length || dist)
      ? { state: 'pass', evidence: `deploy signals: ${[...hits, dist ? distDir : ''].filter(Boolean).join(', ')}` }
      : { state: 'absent', evidence: 'no deploy config detected' };
  },

  'feedback-triaged': ({ dir }, c) => {
    if (!dir) return badParams('feedback-triaged', 'missing dir');
    // A declared review loop owns this gate. Presence of one JSON file in each
    // directory is not enough: the exact-candidate, authority, disposition,
    // and return-to-reader checks must agree before Stage 7 can read green.
    if (existsSync(join(c.root, 'review-contract.json'))) {
      const review = evaluateReviewLoop({ root: c.root });
      const summary = `review-loop/1 ${review.verdict}: ${review.counts.submissions} submission(s), ${review.counts.dispositions} disposition(s), ${review.counts.open} open`;
      if (review.verdict === 'PASS' && review.counts.submissions > 0)
        return { state: 'pass', evidence: summary };
      if (review.verdict === 'BLOCKED')
        return { state: 'absent', evidence: `${summary}; ${review.errors[0] ?? 'invalid contract'}` };
      return {
        state: 'partial',
        evidence: `${summary}; ${review.pendings[0] ?? 'no observed feedback'}`,
      };
    }
    const f = ls(join(c.root, dir));
    // Legacy loop: capture + *triage.md at feedback/ root.
    const legacyCapture = f.some((x) => x.endsWith('.md') && !/triage|kudos/i.test(x));
    const legacyDisposition = f.some((x) => /triage/i.test(x));
    const cap = legacyCapture;
    const tri = legacyDisposition;
    if (cap && tri) return { state: 'pass', evidence: `${dir}: captures + dispositions present` };
    if (cap || tri) return { state: 'partial', evidence: `${dir}: partial (capture or disposition, not both)` };
    return { state: 'absent', evidence: `${dir}: none` };
  },

  // pass if ANY listed path is a file OR any listed dir has ≥1 non-hidden entry
  // that does not still hold one of the gate's `placeholders`.
  'any-exists': ({ paths = [], dirs = [], placeholders = [], missState = 'absent' }, c) => {
    if (!Array.isArray(paths) || !Array.isArray(dirs) || (!paths.length && !dirs.length)) return badParams('any-exists', 'need paths[] and/or dirs[]');
    if (!Array.isArray(placeholders)) return badParams('any-exists', 'placeholders must be an array');
    const fileHits = paths.filter((p) => existsSync(join(c.root, p)));
    const unfilled = [];
    const dirHits = dirs.filter((d) => ls(join(c.root, d)).some((f) => {
      if (f.startsWith('.')) return false;
      const left = unfilledIn(join(c.root, d, f), placeholders);
      if (left) unfilled.push(unfilledNote(join(d, f), left));
      return !left;
    })).map((d) => `${d}/`);
    const hits = [...fileHits, ...dirHits];
    return hits.length ? { state: 'pass', evidence: `present: ${hits.join(', ')}` }
      : { state: missState, evidence: [`none of: ${[...paths, ...dirs.map((d) => `${d}/`)].join(', ')}`, ...unfilled].join('; ') };
  },

  // LAYOUT-TOLERANT research/diagnose gate (calibrated 2026-07-08 — the strict
  // per-leg-by-canonical-name gate passed 0/7 real consumers). A "leg" = a
  // non-hidden subdir OR a substantive (>40 char) top-level .md file under
  // `<root|blueprint>/<dir>`, regardless of the leg's name (real initiatives use
  // architecture/, problem-space/, etc.). Excludes README + any `exclude` names
  // (e.g. research/sources for the research variant's Stage-0 intake). The
  // reviewer (`research-completeness-reviewer`) still enforces the RIGHT legs +
  // primary-source grounding; this gate answers only "did research happen".
  'research-legs': ({ dir = 'research', min = 1, exclude = [], placeholders = [] }, c) => {
    if (!Array.isArray(placeholders)) return badParams('research-legs', 'placeholders must be an array');
    const base = join(c.root, dir);
    if (!isDir(base)) return { state: 'absent', evidence: `${dir}/ not found (root or blueprint/)` };
    const skip = new Set(['readme.md', ...exclude.map((x) => x.toLowerCase())]);
    // a leg = a POPULATED subdir (not an empty stamp-time dir) OR a substantive
    // top-level .md file — an empty research/problem-space/ is not research, and
    // neither is a file still holding one of the gate's `placeholders`.
    const legs = ls(base).filter((f) => !f.startsWith('.') && !skip.has(f.toLowerCase()) &&
      (isPopulatedDir(join(base, f)) || (f.endsWith('.md') && read(join(base, f)).trim().length > 40
        && !unfilledIn(join(base, f), placeholders))));
    if (legs.length >= min) return { state: 'pass', evidence: `${dir}/: ${legs.length} legs (${legs.slice(0, 4).join(', ')}${legs.length > 4 ? '…' : ''})` };
    if (legs.length > 0) return { state: 'partial', evidence: `${dir}/: ${legs.length} leg(s) (<${min})` };
    return { state: 'absent', evidence: `${dir}/: no legs` };
  },

  // decisions/07 (wave 93): Stage-8 handoff is ACTOR-GATED — it demands the
  // handoff manifest only when the initiative declares a receiving actor
  // (kind: team, or an outcome id like receive-* / build-intake*). Without one
  // the stage passes as not-applicable: a solo local tool never hands off, so
  // it never pays this ceremony.
  'handoff-manifest': (_p, c) => {
    const mf = join(c.root, 'actor-output.yml');
    if (!existsSync(mf)) return { state: 'pass', evidence: 'no actor-output.yml — no receiving actor declared (handoff n/a, decisions/07)' };
    let m;
    try { m = parseManifest(read(mf)); } catch { return { state: 'partial', evidence: 'actor-output.yml unparseable — cannot determine receiving actor' }; }
    const actors = m.actors ?? m.viewers ?? [];
    const receiving = actors.filter((a) => a?.kind === 'team' || (a?.outcomes ?? []).some((o) => /^(receive-|build-intake)/.test(o?.id ?? '')));
    if (!receiving.length) return { state: 'pass', evidence: 'no receiving actor declared — handoff n/a (decisions/07 actor-gating)' };
    const hm = (m.outputs ?? []).filter((o) => o?.type === 'handoff-manifest');
    const serving = hm.filter((o) => ['ready', 'issued'].includes(o?.status));
    if (serving.length) return { state: 'pass', evidence: `receiving actor ${receiving.map((a) => a.id).join(', ')} served by handoff-manifest ${serving.map((o) => o.id).join(', ')}` };
    if (hm.length) return { state: 'partial', evidence: `handoff-manifest declared (${hm.map((o) => o.status).join(', ')}) but not ready/issued` };
    return { state: 'absent', evidence: `receiving actor ${receiving.map((a) => a.id).join(', ')} declared but NO handoff-manifest output — the build contract is missing (decisions/07)` };
  },
};

// ── the canonical greenfield model (declarative data) ──────────────
// gate: { id, derivable, kind, params }. Reordering/renaming/enabling stages,
// or swapping a gate's kind/params, is now a data edit — the ADR-0008 promotion
// of the pipeline from prose control flow to an inspectable model.
export const GREENFIELD_MODEL = {
  variant: 'greenfield',
  stages: [
    { id: 0, name: 'Application Legibility', gates: [
      // POLICY-AWARE (wave 86): pilot_profile_policy: required (stamped on new
      // initiatives) blocks advance until the 7 fields fill + citation resolves;
      // legacy trees WITHOUT the policy field never block here (wave-84
      // calibration — mature pre-policy initiatives must not pin to Stage -1).
      // Substance validation stays with pilot-profile-lock-reviewer.
      { id: 'pilot-profile', derivable: true, kind: 'pilot-profile', params: {}, reviewer: { name: 'pilot-profile-lock-reviewer', onWarn: 'pass' } },
      { id: 'sensor-wired', derivable: false, kind: 'manual', params: { evidence: 'not derivable from disk — requires driving the running app' } },
    ] },
    { id: 1, name: 'Research', gates: [
      // layout-tolerant legs; sibling-scan + reference-grading are enforced by
      // their reviewers (research-sibling-scanner / research-reference-grader).
      { id: 'research-legs', derivable: true, kind: 'research-legs', params: { dir: 'research', min: 2 } },
    ] },
    { id: 2, name: 'Design Principles', gates: [
      // canonical location is prototype/DESIGN.md (docs/variant-selection.md
      // § Greenfield Stage 2) — search prototype/ too, not just docs/research.
      { id: 'principles-doc', derivable: true, kind: 'name-match', params: { dirs: ['prototype', 'docs', 'research'], pattern: '^design\\.md$|design-principle|design-system|principles' } },
    ] },
    { id: 3, name: 'Prototype', gates: [
      { id: 'portal-shell', derivable: true, kind: 'file-exists', params: { path: 'apps/portal/package.json' } },
      { id: 'demo-storyboard', derivable: true, kind: 'name-match', params: { dirs: ['docs/content'], pattern: 'storyboard|demo-reel', missState: 'partial' } },
    ] },
    { id: 4, name: 'Fact-Check / Validate', gates: [
      { id: 'validation-report', derivable: true, kind: 'file-exists', params: { path: 'docs/content/validation-script.md' } },
      { id: 'claims-verified', derivable: false, kind: 'manual', params: { evidence: 'not derivable — a report existing ≠ claims verified' } },
    ] },
    { id: 5, name: 'Documents', gates: [
      { id: 'decisions', derivable: true, kind: 'dir-md-min', params: { dirs: ['decisions', 'docs/decisions'], min: 1 }, reviewer: { name: 'doc-quality-auditor', onWarn: 'pass' } },
    ] },
    { id: 6, name: 'Deploy', gates: [
      { id: 'deploy-config', derivable: true, kind: 'deploy-signals', params: { paths: ['vercel.json', '.github/workflows'], distDir: 'apps/portal/dist' } },
      { id: 'live-url', derivable: false, kind: 'manual', params: { evidence: 'not derivable from disk — requires a reachability check' } },
    ] },
    { id: 7, name: 'Iterate', gates: [
      { id: 'feedback-triaged', derivable: true, kind: 'feedback-triaged', params: { dir: 'feedback' } },
    ] },
    { id: 8, name: 'Handoff', gates: [
      { id: 'handoff-manifest', derivable: true, kind: 'handoff-manifest', params: {} },
    ] },
  ],
};

// MIDSTREAM — hybrid pipeline (docs/variant-selection.md § Midstream): an
// active mid-development product; the prototype revises in-flight work.
// Prescription precedes Design Principles (names which existing patterns to
// preserve vs revise). Stage 0 sensor is mandatory.
export const MIDSTREAM_MODEL = {
  variant: 'midstream',
  stages: [
    { id: 0, name: 'Application Legibility', gates: [
      { id: 'pilot-profile', derivable: true, kind: 'pilot-profile', params: {}, reviewer: { name: 'pilot-profile-lock-reviewer', onWarn: 'pass' } },
      { id: 'sensor-wired', derivable: false, kind: 'manual', params: { evidence: 'mandatory for midstream — the live touchpoint must be driven/captured' } },
    ] },
    { id: 1, name: 'Targeted Diagnose', gates: [
      // layout-tolerant: ≥2 diagnose legs (subdirs or files, any names, root or
      // blueprint/). research-completeness-reviewer enforces the scoped legs.
      { id: 'diagnose-legs', derivable: true, kind: 'research-legs', params: { dir: 'research', min: 2 } },
    ] },
    { id: 2, name: 'Prescription', gates: [
      { id: 'prescription', derivable: true, kind: 'name-match', params: { dirs: ['.', 'research', 'docs'], pattern: 'prescription' } },
    ] },
    { id: 3, name: 'Design Principles', gates: [
      { id: 'design-principles', derivable: true, kind: 'name-match', params: { dirs: ['prototype', 'docs', 'research'], pattern: '^design\\.md$|design-principle|design-system', missState: 'partial' } },
    ] },
    { id: 4, name: 'Prototype-as-Patch', gates: [
      { id: 'prototype-shell', derivable: true, kind: 'any-exists', params: { paths: ['apps/portal/package.json'], dirs: ['prototype'] } },
    ] },
    { id: 5, name: 'Fact-Check', gates: [
      { id: 'validation-report', derivable: true, kind: 'name-match', params: { dirs: ['docs/content', 'docs'], pattern: 'validation|fact-check', missState: 'partial' } },
      { id: 'claims-verified', derivable: false, kind: 'manual', params: { evidence: 'Ralph Wiggum convergence — reviewers pass' } },
    ] },
    { id: 6, name: 'Documents', gates: [
      { id: 'strategy-docs', derivable: true, kind: 'dir-md-min', params: { dirs: ['docs', 'decisions'], min: 1 }, reviewer: { name: 'doc-quality-auditor', onWarn: 'pass' } },
    ] },
    { id: 7, name: 'Deploy + Iterate', gates: [
      { id: 'deploy-config', derivable: true, kind: 'deploy-signals', params: { paths: ['vercel.json', '.github/workflows'], distDir: 'apps/portal/dist' } },
      { id: 'live-url', derivable: false, kind: 'manual', params: { evidence: 'not derivable from disk — requires a reachability check' } },
    ] },
    { id: 8, name: 'Handoff', gates: [
      { id: 'handoff-manifest', derivable: true, kind: 'handoff-manifest', params: {} },
    ] },
  ],
};

// BROWNFIELD — audit pipeline (docs/variant-selection.md § Brownfield): a mature
// live product; the diagnose + prescription docs ARE the deliverables, a
// prototype is optional. Stage 0 sensor mandatory (every audit claim grounds in
// a captured surface); Fact-Check mandatory whether or not a prototype ran.
export const BROWNFIELD_MODEL = {
  variant: 'brownfield',
  stages: [
    { id: 0, name: 'Application Legibility', gates: [
      { id: 'pilot-profile', derivable: true, kind: 'pilot-profile', params: {}, reviewer: { name: 'pilot-profile-lock-reviewer', onWarn: 'pass' } },
      { id: 'sensor-wired', derivable: false, kind: 'manual', params: { evidence: 'mandatory for brownfield — every audit claim grounds in a captured surface' } },
    ] },
    { id: 1, name: 'Diagnose', gates: [
      // layout-tolerant: ≥2 diagnose legs (subdirs or files, any names, root or
      // blueprint/). The canonical "all five populated" + the 01-diagnose
      // synthesis are enforced by research-completeness-reviewer — a mechanical
      // cursor gating on exact leg names passed 0/7 real consumers (calibrated
      // 2026-07-08: no initiative uses the canonical leg names verbatim).
      { id: 'diagnose-legs', derivable: true, kind: 'research-legs', params: { dir: 'research', min: 2 } },
    ] },
    { id: 2, name: 'Prescription', gates: [
      { id: 'prescription', derivable: true, kind: 'name-match', params: { dirs: ['.', 'research', 'docs'], pattern: 'prescription' } },
    ] },
    { id: 3, name: 'Design Brief', gates: [
      { id: 'design-brief', derivable: true, kind: 'name-match', params: { dirs: ['.', 'docs', 'research'], pattern: 'design-brief' } },
    ] },
    { id: 4, name: 'Prototype (optional)', gates: [
      { id: 'prototype-shell', derivable: true, optional: true, kind: 'any-exists', params: { paths: ['apps/portal/package.json'], dirs: ['prototype'] } },
    ] },
    { id: 5, name: 'Fact-Check', gates: [
      { id: 'validation-report', derivable: true, kind: 'name-match', params: { dirs: ['docs/content', 'docs'], pattern: 'validation|fact-check', missState: 'partial' } },
      { id: 'claims-verified', derivable: false, kind: 'manual', params: { evidence: 'Ralph Wiggum convergence — mandatory whether or not a prototype ran' } },
    ] },
    { id: 6, name: 'Documents', gates: [
      { id: 'package-docs', derivable: true, kind: 'dir-md-min', params: { dirs: ['docs', 'decisions'], min: 1 }, reviewer: { name: 'doc-quality-auditor', onWarn: 'pass' } },
    ] },
    { id: 7, name: 'Deploy + Iterate', gates: [
      { id: 'deploy-config', derivable: true, kind: 'deploy-signals', params: { paths: ['vercel.json', '.github/workflows'], distDir: 'apps/portal/dist' } },
      { id: 'live-url', derivable: false, kind: 'manual', params: { evidence: 'share-link is the brief if no prototype; the prototype if Stage 4 ran' } },
    ] },
    { id: 8, name: 'Handoff', gates: [
      { id: 'handoff-manifest', derivable: true, kind: 'handoff-manifest', params: {} },
    ] },
  ],
};

// RESEARCH — strategy pipeline (docs/variant-selection.md § Research): no product
// to build/audit; starts from input assets, ends in a decision memo. No app, so
// Stage 0 is Inputs Intake (not sensor wiring). Personas/JTBD is a MANDATORY
// Stage-1 gate. Portal optional (provenance-only) — the memo is the deliverable.
//
// The stamper plants the files Stages 0, 1 and 5 match, so each of those gates
// lists the placeholder lines only its unfilled template holds (see
// placeholderLeft): the empty row of the sources catalog stamp.mjs writes, and
// lines of template/research/*.template.md. The persona and memo lines are ones
// any real fill replaces; the catalog's empty row may stay once a real row is
// listed beside it.
const SOURCES_PLACEHOLDERS = ['| | | | | | |'];
const PERSONAS_PLACEHOLDERS = ['### <Persona name> (`<slug>`)', '- **JOB-1:** When …, I need to …, so I can …'];
const MEMO_PLACEHOLDERS = ['# Decision Memo — <Initiative>', '<One sentence: the specific decision or approval being requested.>'];
export const RESEARCH_MODEL = {
  variant: 'research',
  stages: [
    { id: 0, name: 'Inputs Intake', gates: [
      { id: 'sources-catalog', derivable: true, kind: 'any-exists', params: { dirs: ['research/sources'], placeholders: SOURCES_PLACEHOLDERS } },
    ] },
    { id: 1, name: 'Personas & JTBD', gates: [
      { id: 'personas-jtbd', derivable: true, kind: 'name-match', params: { dirs: ['research', '.'], pattern: 'personas-and-jtbd|personas.*jtbd|personas', placeholders: PERSONAS_PLACEHOLDERS }, reviewer: { name: 'persona-fit-reviewer', onWarn: 'block' } },
    ] },
    { id: 2, name: 'Research', gates: [
      // layout-tolerant: ≥3 research legs (any names), excluding the Stage-0
      // `sources/` intake dir so it isn't counted as a research leg. The
      // research-completeness-reviewer enforces the specific legs +
      // substance. Its executable binding blocks advancement when a counted
      // persona file masks a missing required leg. Source quality stays judged.
      // An unfilled personas template is not a leg; a filled one still counts.
      { id: 'research-legs', derivable: true, kind: 'research-legs', params: { dir: 'research', min: 3, exclude: ['sources'], placeholders: PERSONAS_PLACEHOLDERS }, reviewer: { name: 'research-completeness-reviewer', onWarn: 'block' } },
    ] },
    { id: 3, name: 'Synthesis & Decisions', gates: [
      { id: 'decisions', derivable: true, kind: 'dir-md-min', params: { dirs: ['decisions', 'docs/decisions'], min: 1 } },
    ] },
    { id: 4, name: 'Fact-Check', gates: [
      { id: 'cross-asset-reconciled', derivable: false, kind: 'manual', params: { evidence: 'cross-asset reconciliation + independent re-pull of any external claim' } },
    ] },
    { id: 5, name: 'Decision Memo', gates: [
      { id: 'decision-memo', derivable: true, kind: 'name-match', params: { dirs: ['docs', '.'], pattern: 'decision-memo', placeholders: MEMO_PLACEHOLDERS }, reviewer: { name: 'doc-quality-auditor', onWarn: 'pass' } },
    ] },
    { id: 6, name: 'Deliver', gates: [
      { id: 'delivered', derivable: false, kind: 'manual', params: { evidence: 'memo shared where the audience is (portal optional, provenance-only)' } },
    ] },
    { id: 7, name: 'Iterate', gates: [
      { id: 'feedback', derivable: true, optional: true, kind: 'feedback-triaged', params: { dir: 'feedback' } },
    ] },
    { id: 8, name: 'Handoff', gates: [
      { id: 'handoff-manifest', derivable: true, kind: 'handoff-manifest', params: {} },
    ] },
  ],
};

const BUILTIN_MODELS = {
  greenfield: GREENFIELD_MODEL,
  midstream: MIDSTREAM_MODEL,
  brownfield: BROWNFIELD_MODEL,
  research: RESEARCH_MODEL,
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const stableJson = (value) => Array.isArray(value)
  ? `[${value.map(stableJson).join(',')}]`
  : isPlainObject(value)
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const modelFingerprint = (model) => createHash('sha256').update(stableJson(model)).digest('hex');

function validateGate(gate, location, gateIds, phased) {
  if (!isPlainObject(gate)) return `${location} must be an object`;
  if (phased ? !isSlug(gate.id) : typeof gate.id !== 'string' || !gate.id.trim()) return `${location}.id must be ${phased ? 'a stable string slug' : 'nonempty'}`;
  if (phased && gateIds.has(gate.id)) return `${location}.id '${gate.id}' is not globally unique`;
  gateIds.add(gate.id);
  if (typeof gate.derivable !== 'boolean') return `${location}.derivable must be boolean`;
  if (typeof gate.kind !== 'string' || !Object.hasOwn(CHECK_KINDS, gate.kind)) return `${location}.kind '${gate.kind}' is not a known check kind`;
  if (gate.kind === 'application-definition-source' && gate.derivable !== true) return `${location}: application-definition-source must be derivable:true`;
  if (gate.kind === 'application-definition-source' && gate.optional === true) return `${location}: application-definition-source cannot be optional`;
  if (gate.params !== undefined && !isPlainObject(gate.params)) return `${location}.params must be an object`;
  if (gate.kind === 'application-definition-source' && gate.params && Object.keys(gate.params).length) return `${location}: application-definition-source takes no params`;
  if (gate.optional !== undefined && typeof gate.optional !== 'boolean') return `${location}.optional must be boolean`;
  if (gate.reviewer !== undefined) {
    if (!isPlainObject(gate.reviewer) || typeof gate.reviewer.name !== 'string' || !gate.reviewer.name.trim()) return `${location}.reviewer needs a nonempty name`;
    if (gate.reviewer.onWarn !== undefined && !['block', 'pass', 'ask'].includes(gate.reviewer.onWarn)) return `${location}.reviewer.onWarn must be block, pass, or ask`;
  }
  return null;
}

// A custom model is executable input, not a hint. Validation happens before any
// fallback decision so a typo cannot quietly select greenfield and report the
// wrong workflow as healthy.
export function validateStageModel(model) {
  if (!isPlainObject(model)) return 'model must be an object';
  if (!Array.isArray(model.stages)) return 'model.stages must be an array';
  const phased = model.stages.some((stage) => stage?.phases !== undefined);
  const gateIds = new Set();
  let previousId = -Infinity;
  for (let index = 0; index < model.stages.length; index++) {
    const stage = model.stages[index];
    const here = `stages[${index}]`;
    if (!isPlainObject(stage)) return `${here} must be an object`;
    if (!Number.isFinite(stage.id) || (phased && (!Number.isInteger(stage.id) || stage.id < 0 || stage.id <= previousId))) return `${here}.id must be ${phased ? 'a nonnegative integer in declared ascending order' : 'a number'}`;
    previousId = stage.id;
    if (typeof stage.name !== 'string' || !stage.name.trim()) return `${here}.name must be nonempty`;
    if (!Array.isArray(stage.gates ?? (phased ? null : []))) return `${here}.gates must be an array`;
    for (let gateIndex = 0; gateIndex < (stage.gates || []).length; gateIndex++) {
      const error = validateGate(stage.gates[gateIndex], `${here}.gates[${gateIndex}]`, gateIds, phased);
      if (error) return error;
    }
    if (stage.phases !== undefined) {
      if (!Array.isArray(stage.phases) || !stage.phases.length) return `${here}.phases must be a nonempty array when declared`;
      const phaseIds = new Set();
      for (let phaseIndex = 0; phaseIndex < stage.phases.length; phaseIndex++) {
        const phase = stage.phases[phaseIndex];
        const phaseHere = `${here}.phases[${phaseIndex}]`;
        if (!isPlainObject(phase)) return `${phaseHere} must be an object`;
        if (!isSlug(phase.id)) return `${phaseHere}.id must be a stable string slug`;
        if (phaseIds.has(phase.id)) return `${phaseHere}.id '${phase.id}' is duplicated in stage ${stage.id}`;
        phaseIds.add(phase.id);
        if (typeof phase.name !== 'string' || !phase.name.trim()) return `${phaseHere}.name must be nonempty`;
        if (!Array.isArray(phase.gates)) return `${phaseHere}.gates must be an array`;
        for (let gateIndex = 0; gateIndex < phase.gates.length; gateIndex++) {
          const error = validateGate(phase.gates[gateIndex], `${phaseHere}.gates[${gateIndex}]`, gateIds, phased);
          if (error) return error;
        }
      }
    }
  }
  return null;
}

// ── model loading (config-driven) ──────────────────────────────────
// Resolution order:
//   1. blueprint.yml `stage_model:` scalar —
//        - a path ending in .json → load + parse that file
//        - a built-in name (greenfield | midstream | brownfield | research) → that model
//   2. else blueprint.yml `variant:` scalar → the matching built-in model
//        (the field already exists and means exactly this — declare once)
//   3. else greenfield default
// Unknown names in (1)/(2) fall back to greenfield with a `note`.
export function loadStageModel(root) {
  const yml = read(join(root, 'blueprint.yml'));
  const sel = ymlScalar(yml, 'stage_model');
  if (sel && /\.json$/.test(sel)) {
    const p = isAbsolute(sel) ? sel : join(root, sel);
    try {
      const model = JSON.parse(read(p));
      const error = validateStageModel(model);
      if (error) return { model: null, source: p, error: `stage_model '${sel}' is invalid: ${error}` };
      return { model, source: p, note: null, fingerprint: modelFingerprint(model) };
    } catch (e) {
      return { model: null, source: p, error: `stage_model '${sel}' is unreadable: ${e.message}` };
    }
  }
  if (sel && Object.hasOwn(BUILTIN_MODELS, sel)) return { model: BUILTIN_MODELS[sel], source: sel, note: null, fingerprint: modelFingerprint(BUILTIN_MODELS[sel]) };
  if (sel) return { model: null, source: sel, error: `stage_model '${sel}' is not a known built-in model or JSON file` };
  // No explicit stage_model → follow the declared `variant` (all four variants
  // ship a model). This connects the existing blueprint.yml `variant` field to
  // the stage machine so consumers don't declare the shape twice.
  const variant = ymlScalar(yml, 'variant');
  if (variant && Object.hasOwn(BUILTIN_MODELS, variant)) return { model: BUILTIN_MODELS[variant], source: `variant:${variant}`, note: null, fingerprint: modelFingerprint(BUILTIN_MODELS[variant]) };
  return { model: GREENFIELD_MODEL, source: variant ? `greenfield (fallback)` : 'greenfield (default)', note: variant ? `variant '${variant}' has no stage model — using greenfield` : null, fingerprint: modelFingerprint(GREENFIELD_MODEL) };
}

// ── derivation ─────────────────────────────────────────────────────
function phaseDefinitions(model) {
  return model.stages.flatMap((stage) => (stage.phases || []).map((phase) => ({ stageId: stage.id, stageName: stage.name, phaseId: phase.id, phaseName: phase.name })));
}

function validateRecordedPhases(model, fingerprint, phaseState = {}) {
  if (!isValidStateShape(phaseState) || phaseState.corrupt) return 'phase state is malformed';
  const definitions = phaseDefinitions(model);
  const hasPhaseFields = phaseState.phaseCursor !== undefined || phaseState.phaseHistory !== undefined || phaseState.phaseModelFingerprint !== undefined;
  if (!definitions.length) {
    if (hasPhaseFields && ((phaseState.phaseHistory || []).length || phaseState.phaseCursor || phaseState.phaseModelFingerprint)) return 'phase state exists but the selected model declares no phases';
    return { history: [], cursor: null, definitions };
  }
  // Old state records are legitimate but establish no ordered phase credit.
  if (!hasPhaseFields) return { history: [], cursor: null, definitions };
  if (!Array.isArray(phaseState.phaseHistory)) return 'phaseHistory must be an array';
  if (phaseState.phaseModelFingerprint !== undefined && phaseState.phaseModelFingerprint !== fingerprint) return 'phase state belongs to a different selected model fingerprint';
  const history = phaseState.phaseHistory;
  if (history.length > definitions.length) return 'phaseHistory is longer than the selected model phase sequence';
  for (let index = 0; index < history.length; index++) {
    const entry = history[index];
    const expected = definitions[index];
    if (!isPlainObject(entry) || entry.stageId !== expected.stageId || entry.phaseId !== expected.phaseId) return `phaseHistory[${index}] is not the declared contiguous phase prefix (expected ${expected.stageId}/${expected.phaseId})`;
    if (entry.modelFingerprint !== fingerprint) return `phaseHistory[${index}] belongs to a different selected model fingerprint`;
  }
  const expectedCursor = history.length ? { stageId: history.at(-1).stageId, phaseId: history.at(-1).phaseId } : null;
  const cursor = phaseState.phaseCursor ?? null;
  if (expectedCursor ? cursor?.stageId !== expectedCursor.stageId || cursor?.phaseId !== expectedCursor.phaseId : cursor !== null) return 'phaseCursor does not match the last contiguous phaseHistory entry';
  return { history, cursor: expectedCursor, definitions };
}

function deriveGate(g, candidates, ctx, assertions) {
  const kind = CHECK_KINDS[g.kind];
  let r = null;
  const scopedCandidates = g.kind === 'application-definition-source' ? [ctx.root] : candidates;
  for (const cand of scopedCandidates) {
    let rr;
    try {
      rr = kind ? kind(g.params || {}, { ...ctx, root: cand })
        : { state: 'absent', evidence: `unknown check kind '${g.kind}'` };
    } catch (e) {
      rr = { state: 'absent', evidence: `check '${g.kind}' errored: ${e.message}` };
    }
    if (!r || rankState(rr.state) > rankState(r.state)) r = rr;
  }
  if (!g.derivable && r.state !== 'pass' && Object.hasOwn(assertions, g.id) && assertions[g.id]) r = { state: 'pass', evidence: `asserted: ${assertions[g.id].evidence || 'confirmed'}` };
  let vacuous = false;
  if (g.optional && r.state !== 'pass') {
    r = { ...r, state: 'pass', evidence: `${r.evidence} (optional)` };
    vacuous = true;
  }
  return { gate: g.id, derivable: g.derivable, kind: g.kind, vacuous, ...(g.reviewer && g.reviewer.name ? { reviewer: g.reviewer } : {}), ...r };
}

function validatePhaseAssertions(model, assertions, recordedPhases) {
  if (!recordedPhases.definitions.length) return null; // Legacy records retain their interpretation.
  if (!isPlainObject(assertions)) return 'assertions must be an object';
  const next = recordedPhases.definitions[recordedPhases.history.length];
  const all = new Map();
  const allowed = new Set();
  for (const stage of model.stages) {
    for (const gate of stage.gates) {
      all.set(gate.id, gate);
      if (!next || stage.id <= next.stageId) allowed.add(gate.id);
    }
    let throughCurrent = true;
    for (const phase of stage.phases || []) {
      for (const gate of phase.gates) {
        all.set(gate.id, gate);
        if (!next || stage.id < next.stageId || (stage.id === next.stageId && throughCurrent)) allowed.add(gate.id);
      }
      if (next && stage.id === next.stageId && phase.id === next.phaseId) throughCurrent = false;
    }
  }
  for (const [id, record] of Object.entries(assertions)) {
    if (!all.has(id)) return `unknown recorded assertion '${id}'`;
    if (!allowed.has(id)) return `recorded assertion '${id}' belongs to a later phase or stage; reconcile it before advancing`;
    if (all.get(id).derivable) return `recorded assertion '${id}' targets a derivable gate`;
    if (!isPlainObject(record) || typeof record.evidence !== 'string' || !record.evidence.trim() || record.evidence === 'true') return `recorded assertion '${id}' needs nonempty evidence`;
  }
  return null;
}

export function deriveStageStatus({ root, assertions = {}, phaseState = {} }) {
  root = resolve(root);
  const { model, source, note, error: modelError, fingerprint } = loadStageModel(root);
  if (modelError) return { variant: null, modelSource: source, modelNote: null, modelError, cursor: -1, cursorName: null, stagesComplete: [], stageCount: 0, artifactCursor: -1, artifactCursorName: null, stages: [], derivableCount: 0, nonderivableCount: 0, totalGates: 0, nextStage: null, phaseCursor: null, currentPhase: null, nextPhase: null };
  const recordedPhases = validateRecordedPhases(model, fingerprint, phaseState);
  const stateError = typeof recordedPhases === 'string' ? recordedPhases : validatePhaseAssertions(model, assertions, recordedPhases);
  if (stateError) return { variant: model.variant || 'greenfield', modelSource: source, modelNote: note, stateError, cursor: -1, cursorName: null, stagesComplete: [], stageCount: model.stages.length, artifactCursor: -1, artifactCursorName: null, stages: [], derivableCount: 0, nonderivableCount: 0, totalGates: 0, nextStage: null, phaseCursor: null, currentPhase: null, nextPhase: null, modelFingerprint: fingerprint };
  const ctx = { root, yml: read(join(root, 'blueprint.yml')) };

  const candidates = rootDirs(root); // [root] or [root, root/blueprint]
  const stages = model.stages.map((st) => {
    const gates = (st.gates || []).map((g) => deriveGate(g, candidates, ctx, assertions));
    const phases = (st.phases || []).map((phase) => {
      const gates = phase.gates.map((g) => deriveGate(g, candidates, ctx, assertions));
      const recorded = recordedPhases.history.some((entry) => entry.stageId === st.id && entry.phaseId === phase.id);
      const derivable = gates.filter((g) => g.derivable);
      return {
        id: phase.id,
        name: phase.name,
        gates,
        recorded,
        artifactPass: derivable.length === 0 ? true : derivable.every((g) => g.state === 'pass'),
        predicatesPass: gates.every((g) => g.state === 'pass'),
      };
    });
    // Two notions, deliberately distinct:
    //  - artifactPass: all DERIVABLE gates pass — "how far the raw artifacts
    //    reach", independent of any assertion. Drives `artifactCursor`.
    //  - complete: EVERY gate passes (derivable by disk, non-derivable by a
    //    folded assertion) — the officially-confirmed position. Drives `cursor`
    //    and the advance frontier. Empty-gate stages are vacuously complete.
    const derivable = gates.filter((g) => g.derivable);
    // A stage with NO derivable gates has no disk artifacts to reach — it is
    // vacuously artifact-passing (research's Fact-Check / Deliver are
    // all-non-derivable; without this the artifact cursor caps at the last
    // stage that has a derivable gate). Mirrors the empty-gate `complete` rule.
    const phaseArtifactPass = phases.every((phase) => phase.artifactPass);
    const phasePredicatesPass = phases.every((phase) => phase.predicatesPass);
    const phasesRecorded = phases.every((phase) => phase.recorded);
    const artifactPass = (derivable.length === 0 ? true : derivable.every((g) => g.state === 'pass')) && phaseArtifactPass;
    const complete = gates.every((g) => g.state === 'pass') && phasePredicatesPass && phasesRecorded;
    return { id: st.id, name: st.name, gates, phases, artifactPass, complete };
  });

  // Linear spine: a cursor is the highest N such that EVERY stage ≤ N holds the
  // property. artifactCursor uses artifactPass (disk reach); cursor uses
  // complete (disk + recorded assertions — you cannot be "confirmed through" a
  // stage whose shell gate nobody signed off).
  let artifactCursor = -1;
  for (const s of stages) { if (s.artifactPass) artifactCursor = s.id; else break; }
  let cursor = -1;
  for (const s of stages) { if (s.complete) cursor = s.id; else break; }

  // Coverage: real initiatives complete stages NON-CONTIGUOUSLY (research done,
  // Stage-2 skipped, decisions + deploy done — see case-study-subs-skipped-
  // stages-2-4.md). The linear spine under-reports them, so report both: the
  // spine (contiguous prefix) AND coverage (how many stages are complete at all).
  // Coverage = stages with real DISK progress: complete AND ≥1 derivable gate
  // that passed on disk (not a vacuous optional-absent pass, and not an
  // assertion — assertions live on non-derivable gates and are operator
  // confirmations, tracked by the confirmed cursor, not disk artifacts). Stops
  // an empty brownfield reporting Stage 4 (optional prototype) or an
  // assertion-only research Fact-Check from inflating coverage.
  const stagesComplete = stages
    .filter((s) => s.complete && [...s.gates, ...s.phases.flatMap((phase) => phase.gates)].some((g) => g.derivable && g.state === 'pass' && !g.vacuous))
    .map((s) => s.id);
  const allGates = stages.flatMap((s) => [...s.gates, ...s.phases.flatMap((phase) => phase.gates)]);
  const derivableCount = allGates.filter((g) => g.derivable).length;
  const nextStage = stages.find((s) => !s.complete) || null;
  const phaseAtFrontier = nextStage?.phases.find((phase) => !phase.recorded) || null;
  const currentPhase = phaseAtFrontier ? { stageId: nextStage.id, stageName: nextStage.name, id: phaseAtFrontier.id, name: phaseAtFrontier.name, recorded: false } : null;
  return {
    variant: model.variant || 'greenfield',
    modelSource: source,
    modelNote: note,
    cursor,
    cursorName: cursor >= 0 ? stages.find((x) => x.id === cursor).name : null,
    stagesComplete,
    stageCount: stages.length,
    artifactCursor,
    artifactCursorName: artifactCursor >= 0 ? stages.find((x) => x.id === artifactCursor).name : null,
    stages,
    derivableCount,
    nonderivableCount: allGates.length - derivableCount,
    totalGates: allGates.length,
    // frontier = first stage not yet CONFIRMED complete (what advance targets)
    nextStage,
    modelFingerprint: fingerprint,
    phaseCursor: recordedPhases.cursor,
    currentPhase,
    nextPhase: currentPhase,
  };
}

// ── advance preview (dry-run; ADR-0008 rollout step c) ─────────────
// Predicate-only view, with explicit assertions and phaseState inputs like
// deriveStageStatus. Use recordAdvance for reviewer verification as well.
export function previewAdvance({ root, assertions = {}, phaseState = {} }) {
  const st = deriveStageStatus({ root, assertions, phaseState });
  if (st.modelError || st.stateError) return { ...st, advance: { canAdvance: false, target: null, reason: st.modelError || st.stateError } };
  if (st.currentPhase) {
    const prefix = gatesThroughPhase(st, st.currentPhase);
    const blocking = prefix.filter((g) => g.derivable && g.state !== 'pass');
    const needsAssertion = prefix.filter((g) => !g.derivable && g.state !== 'pass');
    return {
      ...st,
      advance: {
        canAdvance: blocking.length === 0 && needsAssertion.length === 0,
        target: { id: st.currentPhase.stageId, name: st.currentPhase.stageName, phase: { id: st.currentPhase.id, name: st.currentPhase.name } },
        blocking: blocking.map((g) => ({ gate: g.gate, evidence: g.evidence })),
        needsAssertion: needsAssertion.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      },
    };
  }
  const next = st.nextStage;
  if (!next) return { ...st, advance: { canAdvance: true, target: null, reason: 'all stages pass — pipeline complete' } };
  const gates = gatesThroughPhase(st, { stageId: next.id });
  const blocking = gates.filter((g) => g.derivable && g.state !== 'pass');
  const needsAssertion = gates.filter((g) => !g.derivable && g.state !== 'pass');
  return {
    ...st,
    advance: {
      // advance is permitted when no DERIVABLE gate blocks AND every
      // non-derivable gate is covered by an assertion (needsAssertion empty).
      canAdvance: blocking.length === 0 && needsAssertion.length === 0,
      target: { id: next.id, name: next.name },
      blocking: blocking.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      needsAssertion: needsAssertion.map((g) => ({ gate: g.gate, evidence: g.evidence })),
    },
  };
}

// ── recorded state (ADR-0008 decision #3: a machine-read state file) ──
// Replaces the drift-prone hand-maintained STATE.md for the one thing a
// program should own: which stage the initiative is in, and the assertions
// that carried it past the agentic-shell (non-derivable) gates.
const STATE_REL = join('.blueprint', 'stage-state.json');

// readStageState — distinguishes ABSENT (fresh initiative) from CORRUPT (file
// exists but won't parse). Corrupt must never be silently treated as empty:
// this is the authoritative machine-owned record, and overwriting it would lose
// recorded assertions/history permanently (mirrors c698198's fall-back-with-a-
// note discipline for consumer JSON).
// A well-formed state file is a JSON OBJECT (not null/array/scalar) whose
// `assertions` (if present) is itself a plain object. Anything else is corrupt
// — parsing successfully is not the same as being the right shape, and
// overwriting a wrong-shaped file would still lose whatever the operator meant
// to keep there.
export function isValidStateShape(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  const a = parsed.assertions;
  if (a !== undefined && (a === null || typeof a !== 'object' || Array.isArray(a))) return false;
  // history is spread on advance (`[...(prev.history || []), …]`) — a non-array
  // here throws (number) or silently mangles (string spreads to chars); both are
  // the crash/clobber this guard exists to refuse.
  if (parsed.history !== undefined && !Array.isArray(parsed.history)) return false;
  // reviews (ADR-0009, additive): reviewer-recorded results keyed by gate id.
  const rv = parsed.reviews;
  if (rv !== undefined && (rv === null || typeof rv !== 'object' || Array.isArray(rv))) return false;
  const pc = parsed.phaseCursor;
  if (pc !== undefined && pc !== null && (!isPlainObject(pc) || !Number.isInteger(pc.stageId) || !isSlug(pc.phaseId))) return false;
  if (parsed.phaseHistory !== undefined && !Array.isArray(parsed.phaseHistory)) return false;
  if (parsed.phaseModelFingerprint !== undefined && (typeof parsed.phaseModelFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(parsed.phaseModelFingerprint))) return false;
  return true;
}

// ── reviewer-wired advance (ADR-0009) ──────────────────────────────
// Verify ONE mapped gate's reviewer at the frontier: reuse a fresh recorded
// PASS (reviewer-file hash + input fingerprint both match), otherwise run the
// reviewer now. A mapped-but-unresolvable reviewer is a HARD stop — a silently
// skipped reviewer is the wave-55 invocation-gated false green. WARN results
// are recorded for the audit trail but never reused (advisory findings should
// re-surface); only PASS earns fingerprint reuse.
async function verifyGateReviewer({ root, home, gate, recorded, stamp }) {
  const name = gate.reviewer.name;
  const onWarn = (gate.reviewer.onWarn === 'pass' || gate.reviewer.onWarn === 'ask') ? gate.reviewer.onWarn : 'block';
  const { entry } = resolveReviewer(name, { home, targetDir: root });
  if (!entry) return { ok: false, report: { gate: gate.gate, reviewer: name, ran: false, status: 'UNRESOLVED', note: 'mapped reviewer not found in methodology home or initiative — cannot verify, refusing to advance' } };
  const reviewerHash = fileSha256(entry.path);
  let mod;
  // The hash is also the cache key. Without it, a changed reviewer hashes as
  // stale but Node serves the already-imported old module in a long-lived CLI.
  try { mod = await import(`${pathToFileURL(entry.path).href}?v=${reviewerHash}`); }
  catch (e) { return { ok: false, report: { gate: gate.gate, reviewer: name, ran: false, status: 'LOAD-ERROR', note: e.message } }; }
  // `inputs` may be an array OR a function (root) => array — the function form
  // covers verdict inputs only knowable at runtime (e.g. the pilot reviewer's
  // walkthrough_citation target, which can point anywhere in the tree; review
  // of e81ad3a). A throwing inputs() degrades to null → always rerun.
  let globs = null;
  try { globs = typeof mod.inputs === 'function' ? mod.inputs(root) : mod.inputs; } catch { globs = null; }
  const fp = Array.isArray(globs) ? fingerprintInputs(root, globs) : null;
  if (recorded && recorded.status === 'PASS' && recorded.reviewerHash === reviewerHash && fp && recorded.fingerprint === fp) {
    return { ok: true, report: { gate: gate.gate, reviewer: name, ran: false, status: 'PASS', note: 'recorded result fresh (reviewer + inputs unchanged)' }, record: recorded };
  }
  let r;
  try { r = await mod.default({ targetDir: root, methodologyHome: home, gateId: gate.gate }); }
  catch (e) { return { ok: false, report: { gate: gate.gate, reviewer: name, ran: true, status: 'THREW', note: e.message } }; }
  const status = r && r.status;
  const firstBlock = ((r && r.findings) || []).find((f) => f.severity === 'BLOCK');
  const record = { reviewer: name, reviewerHash, fingerprint: fp, status, at: stamp };
  if (status === 'PASS') return { ok: true, report: { gate: gate.gate, reviewer: name, ran: true, status }, record };
  if (status === 'WARN') {
    if (onWarn === 'pass') return { ok: true, report: { gate: gate.gate, reviewer: name, ran: true, status: 'WARN', note: 'onWarn=pass — advisory, proceeding' }, record };
    const hint = onWarn === 'ask' ? ' (onWarn=ask — review the findings, then re-run advance after addressing or accept via the reviewer)' : '';
    return { ok: false, report: { gate: gate.gate, reviewer: name, ran: true, status: 'WARN', note: `onWarn=${onWarn} — transition refused${hint}` } };
  }
  return { ok: false, report: { gate: gate.gate, reviewer: name, ran: true, status: status || 'INVALID-RESULT', note: firstBlock ? firstBlock.message.slice(0, 160) : 'reviewer did not return PASS' } };
}

// Read-only workflow view for doctor. Unfinished artifacts/assertions and
// reviewer BLOCKs are pending work; inability to run a mapped check is an error.
// This does not record assertions or claim that a host startup hook executed.
export async function evaluateWorkflowReadiness({ root, home }) {
  const saved = readStageState(root);
  if (saved.corrupt) return { status: 'error', checks: [], detail: saved.error };
  const st = deriveStageStatus({ root, assertions: saved.assertions || {}, phaseState: saved });
  if (st.modelError || st.stateError) return { status: 'error', checks: [], detail: st.modelError || st.stateError };
  const checks = [];
  for (const stage of st.stages) {
    for (const phase of stage.phases) {
      if (!phase.recorded) checks.push({ stage: stage.id, phase: phase.id, gate: `phase:${phase.id}`, status: 'pending', detail: 'phase transition not recorded; run stage advance to verify and record it' });
    }
    for (const [phase, gate] of [
      ...stage.gates.map((gate) => [null, gate]),
      ...stage.phases.flatMap((phase) => phase.gates.map((gate) => [phase, gate])),
    ]) {
      const check = { stage: stage.id, ...(phase ? { phase: phase.id } : {}), gate: gate.gate, status: gate.executionError ? 'error' : gate.state === 'pass' ? 'pass' : 'pending', detail: gate.evidence };
      if (gate.applicationDefinition) check.application_definition = gate.applicationDefinition;
      if (gate.reviewer) {
        check.reviewer = gate.reviewer.name;
        check.ran = false;
        if (gate.state === 'pass') {
          const v = await verifyGateReviewer({ root, home, gate, stamp: new Date().toISOString() });
          check.ran = v.report.ran;
          check.reviewStatus = v.report.status;
          check.status = v.ok ? 'pass' : ['BLOCKED', 'WARN'].includes(v.report.status) ? 'pending' : 'error';
          check.detail = `${v.report.status}: ${v.report.note || gate.evidence}`;
        }
      }
      checks.push(check);
    }
  }
  return {
    status: checks.some(c => c.status === 'error') ? 'error' : checks.some(c => c.status === 'pending') ? 'pending' : 'ready',
    checks,
  };
}

export function readStageState(root) {
  const p = join(resolve(root), STATE_REL);
  const empty = { cursor: -1, assertions: {}, history: [] };
  if (!existsSync(p)) return empty;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    if (!isValidStateShape(parsed)) return { ...empty, corrupt: true, error: 'state file is valid JSON but malformed (need an object with assertions:{…}, history:[…])' };
    return { ...empty, ...parsed };
  } catch (e) { return { ...empty, corrupt: true, error: e.message }; }
}

function assertionProblems(asserts, allowedGates, allGates) {
  const allowed = new Map(allowedGates.map((gate) => [gate.gate, gate]));
  const all = new Set(allGates.map((gate) => gate.gate));
  const problems = [];
  for (const [gate, evidence] of Object.entries(asserts)) {
    const defined = allowed.get(gate);
    if (!defined) problems.push(all.has(gate) ? `assertion '${gate}' belongs to a later phase or stage` : `unknown assertion '${gate}'`);
    else if (defined.derivable) problems.push(`assertion '${gate}' targets a derivable gate and cannot override disk evidence`);
    else if (typeof evidence !== 'string' || evidence === 'true' || !evidence.trim()) problems.push(`assertion '${gate}' needs nonempty evidence`);
  }
  return problems;
}

function gatesThroughPhase(status, target) {
  const targetStageIndex = status.stages.findIndex((stage) => stage.id === target.stageId);
  const gates = [];
  for (let stageIndex = 0; stageIndex <= targetStageIndex; stageIndex++) {
    const stage = status.stages[stageIndex];
    gates.push(...stage.gates.map((gate) => ({ ...gate, stage: stage.id, stageName: stage.name })));
    const lastPhase = stage.id === target.stageId && target.id !== undefined ? stage.phases.findIndex((phase) => phase.id === target.id) : stage.phases.length - 1;
    for (let phaseIndex = 0; phaseIndex <= lastPhase; phaseIndex++) {
      const phase = stage.phases[phaseIndex];
      gates.push(...phase.gates.map((gate) => ({ ...gate, stage: stage.id, stageName: stage.name, phase: phase.id, phaseName: phase.name })));
    }
  }
  return gates;
}

// recordAdvance — advance the CONFIRMED cursor by completing the current
// frontier stage (the first not-yet-complete stage, computed from the
// ALREADY-recorded assertions so the target is fixed for this call and doesn't
// drift when new assertions are folded). The frontier completes iff its
// derivable gates pass on disk AND its non-derivable gates are covered by
// recorded ∪ new assertions. On success the confirmed cursor jumps to wherever
// disk-complete stages then reach. Dry-run by default; `now` injected for
// deterministic testing.
export async function recordAdvance({ root, asserts = {}, execute = false, now, home = null, expectedPhase = null }) {
  root = resolve(root);
  const prev = readStageState(root);
  if (prev.corrupt) {
    return { ok: false, corrupt: true, message: `${STATE_REL} is unparseable (${prev.error}) — refusing to overwrite; fix or remove it`, state: prev };
  }
  const stamp = now || new Date().toISOString();
  const recorded = prev.assertions || {};

  // frontier from recorded assertions only — the fixed target for this call
  const base = deriveStageStatus({ root, assertions: recorded, phaseState: prev });
  if (base.modelError || base.stateError) return { ok: false, modelError: base.modelError, stateError: base.stateError, message: base.modelError || base.stateError, state: prev };
  const frontier = base.nextStage || base.stages.at(-1);
  if (!frontier) return { ok: true, complete: true, cursor: base.cursor, message: 'stage model declares no stages', state: prev };

  const targetPhase = base.currentPhase;
  if (expectedPhase && (!targetPhase || targetPhase.id !== expectedPhase)) return { ok: false, inputError: true, message: `--phase=${expectedPhase} does not match the current phase${targetPhase ? ` '${targetPhase.id}'` : ' (this frontier has no phase)'}`, state: prev };
  const allGates = base.stages.flatMap((stage) => [...stage.gates, ...stage.phases.flatMap((phase) => phase.gates)]);
  const hasPhases = base.stages.some((stage) => stage.phases.length);
  if (!isPlainObject(asserts)) return { ok: false, inputError: true, message: 'asserts must be an object with gate IDs and evidence strings', state: prev };
  // Legacy models historically accepted an assertion collected ahead of its
  // stage; retain that behavior. Phased models restrict assertions to the
  // current frontier and its earlier prerequisites.
  const allowedGates = hasPhases
    ? gatesThroughPhase(base, { stageId: frontier.id, ...(targetPhase ? { id: targetPhase.id } : {}) })
    : allGates;
  const assertionErrors = assertionProblems(asserts, allowedGates, allGates);
  if (assertionErrors.length) return { ok: false, inputError: true, message: assertionErrors.join('; '), assertionErrors, state: prev };

  // fold the new assertions and test whether THIS frontier completes
  const merged = { ...recorded };
  for (const [gate, evidence] of Object.entries(asserts)) merged[gate] = { evidence, at: stamp };
  const withNew = deriveStageStatus({ root, assertions: merged, phaseState: prev });
  if (withNew.modelError || withNew.stateError) return { ok: false, modelError: withNew.modelError, stateError: withNew.stateError, message: withNew.modelError || withNew.stateError, state: prev };

  if (targetPhase) {
    const phaseHistory = [...(prev.phaseHistory || []), { stageId: targetPhase.stageId, phaseId: targetPhase.id, modelFingerprint: withNew.modelFingerprint, at: stamp }];
    const phaseCursor = { stageId: targetPhase.stageId, phaseId: targetPhase.id };
    const after = deriveStageStatus({ root, assertions: merged, phaseState: { ...prev, phaseHistory, phaseCursor, phaseModelFingerprint: withNew.modelFingerprint } });
    // Completing the last phase may pass through later disk-complete stages.
    // Verify that whole prefix before granting any of its numeric stage credit.
    const prefix = gatesThroughPhase(after, after.cursor > targetPhase.stageId ? { stageId: after.cursor } : targetPhase);
    const executionError = prefix.find((gate) => gate.executionError);
    if (executionError) return { ok: false, inputError: true, message: `${executionError.gate}: ${executionError.evidence}`, state: prev };
    const blocking = prefix.filter((gate) => gate.derivable && gate.state !== 'pass');
    const stillNeeding = prefix.filter((gate) => !gate.derivable && gate.state !== 'pass');
    const prevReviews = (prev.reviews && isPlainObject(prev.reviews)) ? prev.reviews : {};
    const reviews = { ...prevReviews };
    const reviewReports = [];
    for (const gate of prefix.filter((gate) => gate.state === 'pass' && gate.reviewer?.name)) {
      const v = await verifyGateReviewer({ root, home, gate, recorded: prevReviews[gate.gate], stamp });
      const report = { ...v.report, stage: gate.stage, stageName: gate.stageName, ...(gate.phase ? { phase: gate.phase, phaseName: gate.phaseName } : {}) };
      reviewReports.push(report);
      if (v.record) reviews[gate.gate] = v.record;
      if (!v.ok) return { ok: false, target: { id: frontier.id, name: frontier.name, phase: { id: targetPhase.id, name: targetPhase.name } }, blocking: blocking.map((gate) => ({ gate: gate.gate, evidence: gate.evidence, stage: gate.stage, phase: gate.phase })), missingAssertions: stillNeeding.map((gate) => ({ gate: gate.gate, evidence: gate.evidence, stage: gate.stage, phase: gate.phase })), reviewerBlocked: [report], reviews: reviewReports, state: prev };
    }
    if (blocking.length || stillNeeding.length) return {
      ok: false,
      target: { id: frontier.id, name: frontier.name, phase: { id: targetPhase.id, name: targetPhase.name } },
      blocking: blocking.map((gate) => ({ gate: gate.gate, evidence: gate.evidence, stage: gate.stage, phase: gate.phase })),
      missingAssertions: stillNeeding.map((gate) => ({ gate: gate.gate, evidence: gate.evidence, stage: gate.stage, phase: gate.phase })),
      reviews: reviewReports,
      state: prev,
    };
    const state = {
      cursor: after.cursor,
      advancedTo: after.cursorName,
      assertions: merged,
      ...(Object.keys(reviews).length ? { reviews } : {}),
      history: [...(prev.history || []), { stage: frontier.id, phase: targetPhase.id, at: stamp }],
      phaseCursor,
      phaseHistory,
      phaseModelFingerprint: withNew.modelFingerprint,
    };
    if (execute) {
      mkdirSync(join(root, '.blueprint'), { recursive: true });
      writeFileSync(join(root, STATE_REL), JSON.stringify(state, null, 2) + '\n');
    }
    return { ok: true, target: { id: frontier.id, name: frontier.name, phase: { id: targetPhase.id, name: targetPhase.name } }, cursor: after.cursor, phaseCursor, currentPhase: after.currentPhase, nextPhase: after.nextPhase, wrote: execute ? STATE_REL : null, reviews: reviewReports, state };
  }
  const target = withNew.stages.find((s) => s.id === frontier.id);
  const prefix = gatesThroughPhase(withNew, { stageId: Math.max(withNew.cursor, frontier.id) });
  const executionError = prefix.find((gate) => gate.executionError);
  if (executionError) return { ok: false, inputError: true, message: `${executionError.gate}: ${executionError.evidence}`, state: prev };
  const blocking = prefix.filter((g) => g.derivable && g.state !== 'pass');
  const stillNeeding = prefix.filter((g) => !g.derivable && g.state !== 'pass');
  // ADR-0009: VERIFY structurally satisfied gates with executable reviewers,
  // even when a later frontier gate is unfinished. Fresh PASSes are reused;
  // stale/absent ones run the reviewer here (read-only, so dry-run runs them
  // too and reports what --execute would record). Any non-passing reviewer
  // refuses the transition.
  const prevReviews = (prev.reviews && typeof prev.reviews === 'object' && !Array.isArray(prev.reviews)) ? prev.reviews : {};
  const reviews = { ...prevReviews };
  const reviewReports = [];
  // Verify mapped reviewers on the frontier AND on every stage the confirmed
  // cursor is about to jump past (review of e81ad3a: the cursor "may jump past
  // already-disk-complete stages" — without this walk, a mapped gate on a
  // passed-through stage would be confirmed with its reviewer never run, a
  // silent skip with no UNRESOLVED and no record).
  // Recheck the entire prefix, including stages already complete on disk or
  // recorded by an older model. Otherwise filled-looking research before the
  // frontier never runs its reviewer. Fresh receipts still avoid repeated work.
  for (const g of prefix.filter((x) => x.state === 'pass' && x.reviewer && x.reviewer.name)) {
      const v = await verifyGateReviewer({ root, home, gate: g, recorded: prevReviews[g.gate], stamp });
      const report = { ...v.report, stage: g.stage, stageName: g.stageName, ...(g.phase ? { phase: g.phase, phaseName: g.phaseName } : {}) };
      reviewReports.push(report);
      if (v.record) reviews[g.gate] = v.record;
      if (!v.ok) {
        return { ok: false, target: { id: target.id, name: target.name }, blocking: blocking.map(g => ({ gate: g.gate, evidence: g.evidence })), missingAssertions: stillNeeding.map(g => ({ gate: g.gate, evidence: g.evidence })), reviewerBlocked: [report], reviews: reviewReports, state: prev };
      }
  }

  if (blocking.length || stillNeeding.length) {
    return {
      ok: false,
      target: { id: target.id, name: target.name },
      blocking: blocking.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      missingAssertions: stillNeeding.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      reviews: reviewReports,
      state: prev,
    };
  }
  if (!base.nextStage) return { ok: true, complete: true, cursor: base.cursor, message: 'all stages confirmed — pipeline complete', reviews: reviewReports, state: prev };

  const state = {
    cursor: withNew.cursor,          // may jump past already-disk-complete stages
    advancedTo: withNew.cursorName,
    assertions: merged,
    ...(Object.keys(reviews).length ? { reviews } : {}),
    history: [...(prev.history || []), { stage: frontier.id, at: stamp }],
    ...(hasPhases ? { phaseCursor: prev.phaseCursor ?? null, phaseHistory: prev.phaseHistory || [], phaseModelFingerprint: withNew.modelFingerprint } : {}),
  };
  if (execute) {
    mkdirSync(join(root, '.blueprint'), { recursive: true });
    writeFileSync(join(root, STATE_REL), JSON.stringify(state, null, 2) + '\n');
  }
  return { ok: true, target: { id: frontier.id, name: frontier.name }, cursor: withNew.cursor, wrote: execute ? STATE_REL : null, reviews: reviewReports, state };
}

// ── self-test (node stage-model.mjs --selftest) ────────────────────
async function selftest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exit(1); } };
  const yml = 'project:\n  name: "x"\npilot_profile:\n  slug: "y"\nstage_model: "greenfield"\nempty_key: null\n';
  assert(ymlHasBlock(yml, 'pilot_profile'), 'top-level block detected');
  assert(!ymlHasBlock(yml, 'empty_key'), 'null block rejected');
  // wave-77 regression: a key nested under another block must NOT satisfy a
  // top-level gate (commit 44f50b4 — audience re-parented under terminology).
  assert(!ymlHasBlock('terminology:\n  pilot_profile:\n    slug: "z"\n', 'pilot_profile'), 'nested key rejected (zero-indent anchor)');
  assert(ymlScalar(yml, 'stage_model') === 'greenfield', 'scalar read (quoted)');
  assert(ymlScalar(yml, 'empty_key') === null, 'null scalar → null');
  assert(ymlScalar(yml, 'missing') === null, 'absent scalar → null');
  // bad-params must not throw and must not build /undefined/
  assert(CHECK_KINDS['dir-contains']({ dir: 'x' }, { root: process.cwd(), yml: '' }).state === 'absent', 'dir-contains missing pattern → absent, not /undefined/');
  assert(CHECK_KINDS['file-exists']({}, { root: process.cwd(), yml: '' }).state === 'absent', 'file-exists missing path → absent');

  // all four variant models are well-formed (every gate references a known
  // kind, carries a boolean derivable flag, and has a unique id per stage)
  assert(Object.keys(BUILTIN_MODELS).length === 4, 'four variant models registered');
  for (const [name, m] of Object.entries(BUILTIN_MODELS)) {
    assert(m.variant === name, `${name}: variant field matches registry key`);
    for (const s of m.stages) {
      const ids = s.gates.map((g) => g.gate ?? g.id);
      assert(new Set(ids).size === ids.length, `${name} stage ${s.id}: gate ids unique`);
      for (const g of s.gates) {
        assert(CHECK_KINDS[g.kind], `${name}: gate ${g.id} kind '${g.kind}' registered`);
        assert(typeof g.derivable === 'boolean', `${name}: gate ${g.id} has a derivable flag`);
      }
    }
  }
  // pilot-profile policy semantics (wave 86): required+empty blocks, legacy
  // (no policy field) never blocks, required+complete passes only when the
  // citation resolves to a real file.
  {
    const pp = CHECK_KINDS['pilot-profile'];
    const tmp = mkdtempSync(join(tmpdir(), 'bp-pilot-'));
    try {
      const emptyProfile = 'pilot_profile:\n  slug: ""\n  display_name: ""\n  pain_point: ""\n  monetization_side: ""\n  walkthrough_citation: ""\n  competitors_in_scope: []\n  out_of_scope_pilots: []\n';
      const fullProfile = 'pilot_profile:\n  slug: "x"\n  display_name: "X"\n  pain_point: "p"\n  monetization_side: "operator"\n  walkthrough_citation: "cite.md"\n  competitors_in_scope: ["a"]\n  out_of_scope_pilots:\n    - "b"\n';
      const req = 'pilot_profile_policy: required\n';
      assert(pp({}, { root: tmp, yml: req + emptyProfile }).state !== 'pass', 'policy=required + empty profile blocks');
      assert(pp({}, { root: tmp, yml: req }).state === 'absent', 'policy=required + no block is absent');
      assert(pp({}, { root: tmp, yml: '' }).state === 'pass', 'no policy + no profile = legacy pass');
      assert(pp({}, { root: tmp, yml: emptyProfile }).state === 'pass', 'no policy + empty profile = legacy tolerance');
      assert(pp({}, { root: tmp, yml: req + fullProfile }).state === 'partial', 'policy=required + filled but citation unresolved = partial');
      writeFileSync(join(tmp, 'cite.md'), 'walkthrough\n');
      assert(pp({}, { root: tmp, yml: req + fullProfile }).state === 'pass', 'policy=required + filled + citation resolves = pass');
      const parsed = readPilotProfile(req + fullProfile);
      assert(parsed.policy === 'required' && parsed.filled && parsed.fields.out_of_scope_pilots.length === 1, 'readPilotProfile parses block lists + policy');
      // legacy-tolerance passes are vacuous (must not count as stagesComplete
      // coverage — review of 5dfee3c); populated profiles are real progress.
      assert(pp({}, { root: tmp, yml: '' }).vacuous === true, 'legacy no-profile pass is vacuous');
      assert(pp({}, { root: tmp, yml: emptyProfile }).vacuous === true, 'legacy empty-profile pass is vacuous');
      assert(!pp({}, { root: tmp, yml: req + fullProfile }).vacuous, 'required+complete pass is real coverage');
      assert(!pp({}, { root: tmp, yml: fullProfile }).vacuous, 'no-policy populated profile is real coverage');
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // reviewer-freshness fingerprints (ADR-0009): deterministic, content- and
  // reviewer-sensitive, order-independent, minimal glob dialect.
  {
    const tmp = mkdtempSync(join(tmpdir(), 'bp-fp-'));
    try {
      mkdirSync(join(tmp, 'research'), { recursive: true });
      writeFileSync(join(tmp, 'blueprint.yml'), 'a: 1\n');
      writeFileSync(join(tmp, 'research', 'x.md'), 'one\n');
      const fp1 = fingerprintInputs(tmp, ['blueprint.yml', 'research/**']);
      const fp2 = fingerprintInputs(tmp, ['blueprint.yml', 'research/**']);
      assert(fp1 && fp1 === fp2, 'fingerprint deterministic');
      writeFileSync(join(tmp, 'research', 'x.md'), 'two\n');
      assert(fingerprintInputs(tmp, ['blueprint.yml', 'research/**']) !== fp1, 'fingerprint changes with input content');
      assert(fingerprintInputs(tmp, ['research/**']) !== fp1, 'fingerprint scoped to globs');
      assert(fingerprintInputs(tmp, []) === null && fingerprintInputs(tmp, null) === null, 'no declared inputs → null (never reused)');
      assert(fingerprintInputs(tmp, ['research/*.md']) === null, 'zero-match glob → null, not a constant fresh fingerprint (review of e81ad3a)');
      assert(fingerprintInputs(tmp, ['nope/**', 'also-missing.md']) === null, 'all-absent inputs → null');
      // state-shape: reviews must be a plain object when present
      assert(isValidStateShape({ assertions: {}, reviews: {} }), 'reviews object accepted');
      assert(!isValidStateShape({ assertions: {}, reviews: [] }), 'reviews array rejected');
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // handoff-manifest gate (decisions/07): actor-gated — n/a passes without a
  // receiving actor; a declared receiving actor with no handoff output is absent
  {
    const tmp = mkdtempSync(join(tmpdir(), 'bp-handoff-'));
    try {
      assert(CHECK_KINDS['handoff-manifest']({}, { root: tmp, yml: '' }).state === 'pass', 'handoff: no manifest → n/a pass');
      writeFileSync(join(tmp, 'actor-output.yml'), 'actors:\n  - id: maintainer\n    kind: human\n    outcomes:\n      - id: recover\n        success: { statement: x }\n');
      assert(CHECK_KINDS['handoff-manifest']({}, { root: tmp, yml: '' }).state === 'pass', 'handoff: no receiving actor → n/a pass');
      writeFileSync(join(tmp, 'actor-output.yml'), 'actors:\n  - id: platform-team\n    kind: team\n    outcomes:\n      - id: receive-handoff\n        success: { statement: accepts the package }\n');
      assert(CHECK_KINDS['handoff-manifest']({}, { root: tmp, yml: '' }).state === 'absent', 'handoff: receiving actor without manifest output → absent');
      writeFileSync(join(tmp, 'actor-output.yml'), 'actors:\n  - id: platform-team\n    kind: team\n    outcomes:\n      - id: receive-handoff\n        success: { statement: accepts the package }\noutputs:\n  - id: build-contract\n    type: handoff-manifest\n    serves: [platform-team.receive-handoff]\n    status: ready\n    artifact: docs/handoff.md\n');
      assert(CHECK_KINDS['handoff-manifest']({}, { root: tmp, yml: '' }).state === 'pass', 'handoff: serving handoff-manifest → pass');
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // any-exists finds a populated dir and is absent on a missing one
  assert(CHECK_KINDS['any-exists']({ dirs: ['research'] }, { root: process.cwd(), yml: '' }).state === 'pass', 'any-exists finds a populated dir');
  assert(CHECK_KINDS['any-exists']({ dirs: ['nope-xyz-123'] }, { root: process.cwd(), yml: '' }).state === 'absent', 'any-exists absent on missing dir');
  assert(CHECK_KINDS['any-exists']({}, { root: process.cwd(), yml: '' }).state === 'absent', 'any-exists bad-params → absent');

  // linear-spine cursor halts at first failing stage
  const fake = [{ stagePass: false, id: 0 }, { stagePass: true, id: 1 }];
  let cur = -1; for (const s of fake) { if (s.stagePass) cur = s.id; else break; }
  assert(cur === -1, 'linear-spine cursor halts at first gap');

  // Malformed explicit models refuse instead of substituting another workflow.
  for (const bad of [{ stages: [null] }, { stages: [{ id: 0, gates: { x: 1 } }] }, { stages: {} }, {}]) {
    assert(validateStageModel(bad), `malformed model rejected: ${JSON.stringify(bad)}`);
  }

  const res = deriveStageStatus({ root: process.cwd() });
  assert(res.stages.length === GREENFIELD_MODEL.stages.length, 'derives all stages');
  assert(res.totalGates === res.derivableCount + res.nonderivableCount, 'gate counts reconcile');
  const adv = previewAdvance({ root: process.cwd() });
  assert(adv.advance && typeof adv.advance.canAdvance === 'boolean', 'advance preview shape');

  // RFC #65 tracer bullet: selected models may opt into ordered phases. A
  // missing gate in the first phase must remain the frontier even when a later
  // phase's evidence is already present. Before phase support, phases[] was
  // ignored and this model appeared complete.
  {
    const phased = mkdtempSync(join(tmpdir(), 'bp-phases-red-'));
    try {
      writeFileSync(join(phased, 'blueprint.yml'), 'stage_model: model.json\n');
      writeFileSync(join(phased, 'model.json'), JSON.stringify({
        variant: 'phase-fixture',
        stages: [{
          id: 0,
          name: 'Design',
          gates: [],
          phases: [
            { id: 'definition', name: 'Definition', gates: [{ id: 'definition-file', derivable: true, kind: 'file-exists', params: { path: 'definition.md' } }] },
            { id: 'selection', name: 'Selection', gates: [{ id: 'selected-file', derivable: true, kind: 'file-exists', params: { path: 'selected.md' } }] },
          ],
        }],
      }));
      writeFileSync(join(phased, 'selected.md'), 'later evidence exists\n');
      const phaseStatus = deriveStageStatus({ root: phased });
      assert(phaseStatus.currentPhase?.id === 'definition', 'phases: missing first phase remains the current frontier');
      assert(phaseStatus.nextPhase?.id === 'definition', 'phases: later evidence cannot skip the first phase');
    } finally { rmSync(phased, { recursive: true, force: true }); }
  }

  // RFC #65 ordered-phase controls: transitions are explicit, one-at-a-time,
  // and every later transition rechecks the ordered predicate/reviewer prefix.
  {
    const phased = mkdtempSync(join(tmpdir(), 'bp-phases-'));
    const write = (rel, body) => { mkdirSync(join(phased, rel.split('/').slice(0, -1).join('/') || '.'), { recursive: true }); writeFileSync(join(phased, rel), body); };
    const reviewer = 'export const inputs = ["definition.md"]; export default async () => ({ status: "PASS", findings: [] });\n';
    const model = {
      variant: 'phase-fixture', stages: [{
        id: 0, name: 'Design', gates: [{ id: 'stage-file', derivable: true, kind: 'file-exists', params: { path: 'stage.md' } }], phases: [
          { id: 'definition', name: 'Definition', gates: [{ id: 'definition-file', derivable: true, kind: 'file-exists', params: { path: 'definition.md' }, reviewer: { name: 'phase-reviewer' } }] },
          { id: 'selection', name: 'Selection', gates: [{ id: 'selected', derivable: false, kind: 'manual', params: {} }] },
          { id: 'freeze', name: 'Freeze', gates: [{ id: 'freeze-file', derivable: true, kind: 'file-exists', params: { path: 'freeze.md' } }] },
        ],
      }, { id: 1, name: 'Delivery', gates: [{ id: 'delivery-file', derivable: true, kind: 'file-exists', params: { path: 'delivery.md' } }] }],
    };
    try {
      write('blueprint.yml', 'stage_model: model.json\n');
      write('model.json', JSON.stringify(model));
      write('.blueprint/reviewers/phase-reviewer.mjs', reviewer);
      write('freeze.md', 'prepopulated later phase evidence\n');
      let status = deriveStageStatus({ root: phased, phaseState: readStageState(phased) });
      assert(status.currentPhase?.id === 'definition' && status.nextPhase?.id === 'definition', 'phase order ignores prepopulated later evidence');
      for (const [asserts, label] of [
        [{ selected: 'skip ahead' }, 'later-phase assertion rejected'],
        [{ unknown: 'evidence' }, 'unknown assertion rejected'],
        [{ selected: '' }, 'evidence-free assertion rejected'],
      ]) {
        const attempt = await recordAdvance({ root: phased, asserts, home: null });
        assert(attempt.inputError, label);
      }
      write('stage.md', 'stage prerequisite\n'); write('definition.md', 'definition evidence\n');
      let first = await recordAdvance({ root: phased, execute: false, home: null, now: '2026-10-03T00:00:00Z' });
      assert(first.ok && first.target.phase.id === 'definition' && first.wrote === null && first.phaseCursor?.phaseId === 'definition', 'first phase dry-run qualifies definition only');
      assert(!existsSync(join(phased, STATE_REL)), 'phase dry-run does not write state');
      first = await recordAdvance({ root: phased, execute: true, home: null, now: '2026-10-03T00:00:00Z' });
      let saved = readStageState(phased);
      assert(first.ok && saved.phaseHistory.length === 1 && saved.phaseCursor.phaseId === 'definition', 'first phase records a fingerprinted transition');
      assert(saved.phaseHistory[0].modelFingerprint === first.state.phaseModelFingerprint, 'phase history binds the selected model fingerprint');
      // A changed earlier reviewer must block the next phase and leave history intact.
      write('.blueprint/reviewers/phase-reviewer.mjs', 'export default async () => { throw new Error("stale reviewer"); };\n');
      const beforeReviewerFailure = readFileSync(join(phased, STATE_REL), 'utf8');
      let blocked = await recordAdvance({ root: phased, asserts: { selected: 'selection recorded' }, execute: true, home: null });
      assert(!blocked.ok && blocked.reviewerBlocked?.[0].status === 'THREW', 'a stale earlier reviewer blocks a later phase');
      assert(readFileSync(join(phased, STATE_REL), 'utf8') === beforeReviewerFailure, 'reviewer failure never overwrites phase history');
      write('.blueprint/reviewers/phase-reviewer.mjs', reviewer);
      let selected = await recordAdvance({ root: phased, asserts: { selected: 'selection recorded' }, execute: true, home: null });
      assert(selected.ok && selected.phaseCursor.phaseId === 'selection', 'selection advances only after its assertion');
      // A changed earlier predicate also blocks the later phase and preserves state.
      rmSync(join(phased, 'definition.md'));
      const beforePredicateFailure = readFileSync(join(phased, STATE_REL), 'utf8');
      blocked = await recordAdvance({ root: phased, execute: true, home: null });
      assert(!blocked.ok && blocked.blocking.some((gate) => gate.gate === 'definition-file'), 'a stale earlier predicate blocks a later phase');
      assert(readFileSync(join(phased, STATE_REL), 'utf8') === beforePredicateFailure, 'predicate failure never overwrites phase history');
      write('definition.md', 'definition restored\n');
      const frozen = await recordAdvance({ root: phased, execute: true, home: null });
      assert(frozen.ok && frozen.phaseCursor.phaseId === 'freeze', 'prepopulated final evidence still requires its own recorded transition');
      saved = readStageState(phased);
      assert(deriveStageStatus({ root: phased, assertions: saved.assertions, phaseState: saved }).stagesComplete.includes(0), 'phase gates count as real stage coverage');
      // A completed phase must still gate subsequent unphased work.
      rmSync(join(phased, 'definition.md'));
      const beforeCompletedFailure = readFileSync(join(phased, STATE_REL), 'utf8');
      blocked = await recordAdvance({ root: phased, execute: true });
      assert(!blocked.ok && blocked.blocking.some((gate) => gate.gate === 'definition-file'), 'completed phase predicate stays blocking after the last phase');
      assert(readFileSync(join(phased, STATE_REL), 'utf8') === beforeCompletedFailure, 'completed-phase failure preserves history');
      write('definition.md', 'definition restored\n');
      write('delivery.md', 'delivery evidence\n');
      write('.blueprint/reviewers/phase-reviewer.mjs', 'export default async () => ({status:"BLOCKED",findings:[]});\n');
      blocked = await recordAdvance({ root: phased, execute: true });
      assert(!blocked.ok && blocked.reviewerBlocked?.[0].status === 'BLOCKED', 'completed phases recheck reviewers on the pipeline-complete path');
      write('.blueprint/reviewers/phase-reviewer.mjs', reviewer);
      const reorderedCursor = { ...saved, phaseCursor: { phaseId: 'freeze', stageId: 0 } };
      assert(!deriveStageStatus({ root: phased, phaseState: reorderedCursor }).stateError, 'phase cursor property order has no meaning');
      // Old numeric records remain readable but grant no phase completion.
      write('.blueprint/stage-state.json', JSON.stringify({ cursor: 0, assertions: {}, history: [{ stage: 0, at: 'old' }] }));
      status = deriveStageStatus({ root: phased, phaseState: readStageState(phased) });
      assert(!status.stateError && status.currentPhase?.id === 'definition', 'old cursor state grants no phase completion');
      // Skipped/reordered history is an error, never interpreted as empty.
      write('.blueprint/stage-state.json', JSON.stringify({ cursor: 0, assertions: {}, history: [], phaseCursor: { stageId: 0, phaseId: 'selection' }, phaseModelFingerprint: saved.phaseModelFingerprint, phaseHistory: [{ stageId: 0, phaseId: 'selection', modelFingerprint: saved.phaseModelFingerprint, at: 'bad' }] }));
      status = deriveStageStatus({ root: phased, phaseState: readStageState(phased) });
      assert(status.stateError?.includes('contiguous phase prefix'), 'skipped phase history is rejected as contradictory state');
      const corrupt = readStageState(phased);
      const rejected = await recordAdvance({ root: phased, home: null });
      assert(!rejected.ok && rejected.stateError && rejected.state.phaseCursor?.phaseId === corrupt.phaseCursor.phaseId, 'contradictory phase state is never silently emptied');
      // A selected model edit invalidates old phase history rather than changing its meaning.
      write('.blueprint/stage-state.json', JSON.stringify(saved));
      model.stages[0].phases.reverse(); write('model.json', JSON.stringify(model));
      status = deriveStageStatus({ root: phased, phaseState: readStageState(phased) });
      assert(status.stateError?.includes('different selected model fingerprint'), 'model fingerprint mismatch rejects reordered phase state');
      const unresolvedModel = structuredClone(model);
      unresolvedModel.stages[0].phases = [{ id: 'definition', name: 'Definition', gates: [{ id: 'definition-file', derivable: true, kind: 'file-exists', params: { path: 'definition.md' }, reviewer: { name: 'missing-phase-reviewer' } }] }];
      write('model.json', JSON.stringify(unresolvedModel));
      write('.blueprint/stage-state.json', JSON.stringify({ cursor: -1, assertions: {}, history: [] }));
      const unresolved = await recordAdvance({ root: phased, home: null });
      assert(!unresolved.ok && unresolved.reviewerBlocked?.[0].status === 'UNRESOLVED', 'an unresolved phase reviewer blocks advancement as an error');
      write('blueprint.yml', 'stage_model: missing.json\n');
      assert(deriveStageStatus({ root: phased }).modelError?.includes('unreadable'), 'unknown selected JSON model is an actionable error');
      write('model.json', JSON.stringify({ stages: [null] })); write('blueprint.yml', 'stage_model: model.json\n');
      assert(deriveStageStatus({ root: phased }).modelError?.includes('must be an object'), 'malformed selected model is an actionable error');
    } finally { rmSync(phased, { recursive: true, force: true }); }
  }

  // Mixed stage traversal, model validation, and persisted assertion controls.
  {
    const root = mkdtempSync(join(tmpdir(), 'bp-phase-mixed-'));
    const write = (rel, body) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), body); };
    const gate = (id, extra = {}) => ({ id, derivable: false, kind: 'manual', ...extra });
    const model = { stages: [
      { id: 0, name: 'Design', gates: [], phases: [{ id: 'definition', name: 'Definition', gates: [gate('definition-file', { derivable: true, kind: 'file-exists', params: { path: 'definition.md' } })] }] },
      { id: 1, name: 'Delivery', gates: [gate('delivery')] },
      { id: 2, name: 'Follow-up', gates: [], phases: [{ id: 'acceptance', name: 'Acceptance', gates: [gate('acceptance')] }] },
    ] };
    try {
      write('blueprint.yml', 'stage_model: model.json\n'); write('model.json', JSON.stringify(model)); write('definition.md', 'real fixture content\n');
      const ready = await evaluateWorkflowReadiness({ root });
      assert(ready.status === 'pending' && ready.checks.some((c) => c.phase === 'definition' && c.status === 'pending'), 'unrecorded phase is pending even when all its gates pass');
      const first = await recordAdvance({ root, execute: true });
      assert(first.ok && first.cursor === 0, 'first phase stops at the unfinished unphased stage');
      let saved = readStageState(root);
      assert(previewAdvance({ root, phaseState: saved, assertions: saved.assertions }).advance.target.id === 1, 'preview accepts persisted phase state');
      assert(!(await recordAdvance({ root, asserts: { acceptance: 'too early' }, execute: true })).ok, 'an unphased frontier cannot assert a future phase');
      const delivered = await recordAdvance({ root, asserts: { delivery: 'delivery checked' }, execute: true });
      assert(delivered.ok && delivered.state.phaseHistory.length === 1 && delivered.state.phaseCursor.phaseId === 'definition', 'unphased advancement preserves phase history');
      const accepted = await recordAdvance({ root, asserts: { acceptance: 'acceptance checked' }, execute: true });
      assert(accepted.ok && accepted.state.phaseHistory.length === 2 && accepted.cursor === 2, 'a later phased stage extends the same ordered history');
      assert((await recordAdvance({ root })).complete, 'complete mixed model remains complete');
      const malformedAssertions = [ { acceptance: { evidence: true } }, { acceptance: {} }, { acceptance: 'yes' }, { unknown: { evidence: 'yes' } } ];
      for (const assertions of malformedAssertions) {
        write(STATE_REL, JSON.stringify({ ...accepted.state, assertions: { ...accepted.state.assertions, ...assertions } }));
        const bytes = readFileSync(join(root, STATE_REL), 'utf8');
        const attempt = await recordAdvance({ root, execute: true });
        assert(!attempt.ok && attempt.stateError, 'malformed persisted assertion refuses advancement');
        assert(readFileSync(join(root, STATE_REL), 'utf8') === bytes, 'invalid saved assertions are not overwritten');
      }
      write(STATE_REL, JSON.stringify({ assertions: { acceptance: { evidence: 'valid text but future phase' } }, history: [] }));
      assert((await recordAdvance({ root })).stateError?.includes('later phase'), 'well-formed future saved assertion still refuses advancement');
      // A final phase cannot jump over a reviewer on a later complete stage.
      model.stages = model.stages.slice(0, 2);
      model.stages[1].gates = [gate('later-file', { derivable: true, kind: 'file-exists', params: { path: 'definition.md' }, reviewer: { name: 'later-reviewer' } })];
      write('model.json', JSON.stringify(model)); write(STATE_REL, JSON.stringify({ assertions: {}, history: [] }));
      write('.blueprint/reviewers/later-reviewer.mjs', 'export default async () => { throw new Error("must run before credit"); };\n');
      const rejected = await recordAdvance({ root, execute: true });
      assert(!rejected.ok && rejected.reviewerBlocked?.[0].stage === 1, 'last phase verifies passed-through unphased reviewers');
      assert(!readStageState(root).phaseHistory?.length, 'failed passed-through reviewer grants no phase credit');
      const invalid = [];
      for (const update of [
        (m) => { m.stages[0].id = -1; },
        (m) => { m.stages[1].id = 0; },
        (m) => { m.stages[0].phases.push(structuredClone(m.stages[0].phases[0])); },
        (m) => { m.stages[0].phases = []; },
        (m) => { m.stages[1].gates[0].id = 'definition-file'; },
        (m) => { m.stages[0].phases[0].gates[0].kind = 'toString'; },
        (m) => { m.stages[1].gates[0].reviewer = {}; },
      ]) { const bad = structuredClone(model); update(bad); invalid.push(bad); }
      for (const bad of invalid) assert(validateStageModel(bad), 'invalid phased model shape rejected');
      for (const legacy of [{ stages: [] }, { stages: [{ id: 0, name: 'Empty' }] }, { stages: [{ id: 0, name: 'Legacy', gates: [gate('approval.v1')] }] }]) {
        write('model.json', JSON.stringify(legacy)); write(STATE_REL, '{}');
        assert(!deriveStageStatus({ root }).modelError, 'legacy empty stages, omitted gates, and non-slug IDs remain valid');
      }
      write('model.json', JSON.stringify({ stages: [{ id: 0, name: 'Design', gates: [], phases: [{ id: 'definition', name: 'Definition', gates: [gate('constructor')] }] }] }));
      assert(!(await recordAdvance({ root })).ok, 'inherited object properties are not recorded assertions');
      write('blueprint.yml', 'stage_model: constructor\n');
      assert(deriveStageStatus({ root }).modelError, 'inherited object keys cannot select a built-in model');
    } finally { rmSync(root, { recursive: true, force: true }); }
  }

  // an assertion satisfies a non-derivable gate; a derivable gate ignores it
  const asserted = deriveStageStatus({ root: process.cwd(), assertions: { 'sensor-wired': { evidence: 'drove it' } } });
  const s0 = asserted.stages.find((s) => s.id === 0).gates.find((g) => g.gate === 'sensor-wired');
  assert(s0.state === 'pass', 'assertion satisfies non-derivable gate');
  const forged = deriveStageStatus({ root: process.cwd(), assertions: { 'principles-doc': { evidence: 'nope' } } });
  const s2 = forged.stages.find((s) => s.id === 2).gates.find((g) => g.gate === 'principles-doc');
  assert(s2.state !== 'pass', 'assertion does NOT override a derivable gate the disk contradicts');

  // frontier on this repo is Stage 0 (sensor-wired unasserted) — an assertion
  // gap, not a disk gap; recordAdvance dry-run must not write.
  const dry = await recordAdvance({ root: process.cwd(), execute: false, now: '2026-01-01T00:00:00Z' });
  assert(dry.ok === false && dry.missingAssertions.some((g) => g.gate === 'sensor-wired'), 'frontier needs the shell assertion');
  assert(!(dry.blocking || []).length, 'no derivable blocker at the Stage-0 frontier here');
  // GREENFIELD SUCCESS PATH (the case finding #1 proved was unreachable):
  // asserting the frontier's shell gate completes it and advances the confirmed
  // cursor past every already-disk-complete stage.
  // home = cwd (the methodology repo IS the home in selftest context) so the
  // pilot gate's mapped reviewer resolves; without home AND without stamped
  // initiative reviewers, a mapped gate refuses to advance (UNRESOLVED is a
  // hard stop by design — asserted below).
  const ok = await recordAdvance({ root: process.cwd(), asserts: { 'sensor-wired': 'drove it' }, execute: false, now: '2026-01-01T00:00:00Z', home: process.cwd() });
  assert(ok.ok === true && ok.cursor >= 1, 'asserting the frontier shell gate advances the confirmed cursor');
  assert((ok.reviews || []).some((r) => r.reviewer === 'pilot-profile-lock-reviewer' && r.ran === true), 'mapped reviewer ran at the frontier');
  const unresolved = await recordAdvance({ root: process.cwd(), asserts: { 'sensor-wired': 'drove it' }, execute: false, now: '2026-01-01T00:00:00Z' });
  assert(unresolved.ok === false && (unresolved.reviewerBlocked || []).some((r) => r.status === 'UNRESOLVED'), 'mapped-but-unresolvable reviewer refuses the transition (never silently skipped)');
  assert(readStageState(process.cwd()).cursor === -1, 'dry-run wrote no state file');
  // corrupt state is flagged, never silently emptied
  assert(readStageState(process.cwd()).corrupt === undefined, 'absent state file is not corrupt');
  // state-shape guard: valid JSON that isn't a {assertions:{…}} object is corrupt
  for (const bad of [null, [], 'x', 42, { assertions: ['a'] }, { assertions: null }, { history: 42 }, { history: 'note' }])
    assert(!isValidStateShape(bad), `rejected malformed state shape: ${JSON.stringify(bad)}`);
  assert(isValidStateShape({ cursor: 0, assertions: {} }) && isValidStateShape({ cursor: -1 }), 'valid state shapes accepted');

  // ── fs-based behavior tests (the prior tests were circular — fixtures shaped
  //    like the gates. These build real dir layouts and assert the calibration
  //    fixes hold.) ──
  const fx = mkdtempSync(join(tmpdir(), 'bp-stage-selftest-')); // unique — no concurrent-run race
  const mk = (p, body) => { mkdirSync(join(fx, p.split('/').slice(0, -1).join('/') || '.'), { recursive: true }); if (body != null) writeFileSync(join(fx, p), body); };
  const LONG = 'substantive content well over forty characters so mdCount counts it as real';
  try {
    rmSync(fx, { recursive: true, force: true });
    // research variant, empty leg subdirs + a personas stub → NOT 3 legs (empty
    // dirs are not research). Stage 2 must NOT pass.
    mkdirSync(join(fx, 'research', 'problem-space'), { recursive: true });
    mkdirSync(join(fx, 'research', 'competitive'), { recursive: true });
    mkdirSync(join(fx, 'research', 'prior-art'), { recursive: true });
    mk('research/personas-and-jtbd.md', LONG);
    mk('blueprint.yml', 'variant: research\n');
    let s = deriveStageStatus({ root: fx });
    let s2 = s.stages.find((x) => x.id === 2).gates.find((g) => g.gate === 'research-legs');
    assert(s2.state !== 'pass', 'empty leg subdirs do NOT pass research-legs');
    // now populate the legs → passes
    mk('research/problem-space/a.md', LONG); mk('research/competitive/a.md', LONG); mk('research/prior-art/a.md', LONG);
    s = deriveStageStatus({ root: fx });
    s2 = s.stages.find((x) => x.id === 2).gates.find((g) => g.gate === 'research-legs');
    assert(s2.state === 'pass', 'populated leg subdirs pass research-legs');

    // Stage 3 counts decisions, not templates: the stamped _TEMPLATE.md and a
    // frontmatter-marked template do not pass it; a real ADR does.
    const decisionsGate = () => deriveStageStatus({ root: fx }).stages.find((x) => x.id === 3).gates.find((g) => g.gate === 'decisions');
    mk('decisions/_TEMPLATE.md', `---\nadr: NNNN\n---\n# ADR-NNNN — <title>\n${LONG}\n`);
    mk('decisions/0000-template.md', `---\ntemplate: true\n---\n# Template\n${LONG}\n`);
    assert(decisionsGate().state === 'absent', 'templates alone do NOT pass the decisions gate');
    mk('decisions/0001-real.md', `---\nadr: 0001\n---\n# ADR-0001 — A real call\n${LONG}\n`);
    assert(decisionsGate().state === 'pass' && decisionsGate().evidence.endsWith(': 1 artifacts'), 'a real ADR passes; templates are not counted');

    // Stages 0, 1 and 5 count a stamped template once its placeholder lines are
    // gone. Built from the real template text, so a template edit that drops a
    // declared placeholder fails here, not in a consumer.
    const tpl = (f) => read(join(process.cwd(), 'template', 'research', f));
    const personasTpl = tpl('personas-and-jtbd.template.md');
    const memoTpl = tpl('decision-memo.template.md');
    for (const [text, list, f] of [[personasTpl, PERSONAS_PLACEHOLDERS, 'personas-and-jtbd'], [memoTpl, MEMO_PLACEHOLDERS, 'decision-memo']])
      for (const p of list) assert(text.split('\n').filter((l) => squash(l) === squash(p)).length === 1, `${f} template holds its placeholder once: ${p}`);
    rmSync(fx, { recursive: true, force: true });
    mk('blueprint.yml', 'variant: research\n');
    const catalog = '| Asset | Author | Date | Type | Where it lives | Verification status |\n|---|---|---|---|---|---|\n| | | | | | |\n';
    mk('research/sources/README.md', `# Source assets\n\n${catalog}`);
    mk('research/personas-and-jtbd.md', personasTpl);
    mk('docs/decision-memo.md', memoTpl);
    const gateOf = (id) => deriveStageStatus({ root: fx }).stages.flatMap((x) => x.gates).find((g) => g.gate === id);
    for (const [id, file] of [['sources-catalog', 'research/sources/README.md'], ['personas-jtbd', 'research/personas-and-jtbd.md'], ['decision-memo', 'docs/decision-memo.md']])
      assert(gateOf(id).state === 'absent' && gateOf(id).evidence.includes(`${file} still holds a template placeholder (line `), `an unfilled template does not pass ${id}`);
    assert(gateOf('research-legs').state === 'absent', 'an unfilled personas template is not a research leg');
    assert(!deriveStageStatus({ root: fx }).stagesComplete.some((id) => [0, 1, 5].includes(id)), 'unfilled templates complete no stage');
    assert(CHECK_KINDS['name-match']({ dirs: ['docs'], pattern: 'decision-memo' }, { root: fx, yml: '' }).state === 'pass', 'a gate that declares no placeholders is unchanged');
    // An edit that leaves the placeholders is not a fill: a serves line added to
    // the memo, the catalog's empty row re-padded by a formatter.
    mk('docs/decision-memo.md', memoTpl.replace('\n\n', '\n\nserves: none\nserves_reason: not drafted yet\n\n'));
    mk('research/sources/README.md', `# Source assets\n\n${catalog.replace('| | | | | | |', '|   |  |     |  | |   |')}`);
    assert(gateOf('decision-memo').state === 'absent' && gateOf('sources-catalog').state === 'absent', 'touching a template without filling it passes nothing');
    mk('research/sources/brief.pdf', 'x');
    assert(gateOf('sources-catalog').state === 'pass', 'a real input asset passes Stage 0 beside an unfilled catalog');
    rmSync(join(fx, 'research', 'sources', 'brief.pdf'));
    // A catalog grows by rows: a real row beside the blank one fills it.
    const assetRow = '| Brief | Owner | 2026-09-25 | Brief | here | read in full |';
    for (const [where, rows] of [['above', `${assetRow}\n| | | | | | |`], ['below', `| | | | | | |\n${assetRow}`]]) {
      mk('research/sources/README.md', `# Source assets\n\n${catalog.replace('| | | | | | |', rows)}`);
      assert(gateOf('sources-catalog').state === 'pass', `a catalog row ${where} the blank one passes Stage 0`);
    }
    // Filling each file passes its gate, and a filled personas file is a leg again.
    mk('research/sources/README.md', `# Source assets\n\n${catalog.replace('| | | | | | |', assetRow)}`);
    mk('research/personas-and-jtbd.md', personasTpl.replace('### <Persona name> (`<slug>`)', '### Buyer (`buyer`)')
      .replace('- **JOB-1:** When …, I need to …, so I can …', '- **JOB-1:** When a renewal is due, I need the numbers, so I can decide.'));
    mk('docs/decision-memo.md', memoTpl.replace('<Initiative>', 'Fixture').replace('<One sentence: the specific decision or approval being requested.>', 'Approve the fixture.'));
    for (const id of ['sources-catalog', 'personas-jtbd', 'decision-memo']) assert(gateOf(id).state === 'pass', `a filled template passes ${id}`);
    assert(gateOf('research-legs').state === 'partial', 'a filled personas file counts as a leg again');
    // Each placeholder blocks on its own: fill the rest of its list and the gate
    // still reads absent, naming the one left. The lines are literal, not the
    // model's lists, so dropping one from the model fails here.
    for (const [id, rel, text, list] of [
      ['personas-jtbd', 'research/personas-and-jtbd.md', personasTpl, ['### <Persona name> (`<slug>`)', '- **JOB-1:** When …, I need to …, so I can …']],
      ['decision-memo', 'docs/decision-memo.md', memoTpl, ['# Decision Memo — <Initiative>', '<One sentence: the specific decision or approval being requested.>']],
    ]) {
      for (const keep of list) {
        mk(rel, list.filter((p) => p !== keep).reduce((t, p) => t.replace(p, 'filled'), text));
        assert(gateOf(id).state === 'absent' && gateOf(id).evidence.includes(keep), `${id}: ${keep} blocks on its own`);
      }
    }
    // A placeholder left beside real content still blocks, and names its line.
    mk('research/personas-and-jtbd.md', '### Buyer (`buyer`)\n- **JOB-1:** When a renewal is due, I need the numbers.\n\n### <Persona name> (`<slug>`)\n');
    assert(gateOf('personas-jtbd').state === 'absent' && gateOf('personas-jtbd').evidence.includes('(line 4: ### <Persona name>'), 'a leftover placeholder blocks and names its line');
    assert(CHECK_KINDS['name-match']({ dirs: ['docs'], pattern: 'x', placeholders: 'nope' }, { root: fx, yml: '' }).evidence.includes('bad params'), 'non-array placeholders → bad params');
    assert(placeholderLeft('a\n\n', ['  ']) === null, 'a blank placeholder matches nothing');

    // multi-root: empty root research/ must NOT shadow populated blueprint/research/
    rmSync(fx, { recursive: true, force: true });
    mkdirSync(join(fx, 'research'), { recursive: true }); // empty root stub
    mk('blueprint/research/current-state/a.md', LONG); mk('blueprint/research/competitive/a.md', LONG);
    mk('blueprint.yml', 'variant: midstream\npilot_profile:\n  slug: x\n');
    s = deriveStageStatus({ root: fx });
    const leg = s.stages.find((x) => x.id === 1).gates.find((g) => g.gate === 'diagnose-legs');
    assert(leg.state === 'pass', 'blueprint/research/ is not shadowed by an empty root research/');

    // coverage excludes optional-only vacuous stages: empty brownfield → [] not [4]
    rmSync(fx, { recursive: true, force: true });
    mk('blueprint.yml', 'variant: brownfield\n');
    s = deriveStageStatus({ root: fx });
    assert(!s.stagesComplete.includes(4), 'optional-only Stage 4 not counted as coverage on an empty repo');

    // Review-loop/1 must be semantically closed; directory presence alone is
    // deliberately insufficient.
    rmSync(fx, { recursive: true, force: true });
    const contract = {
      schema_version: 'blueprint-review-loop/1',
      id: 'stage-fixture',
      status: 'issued',
      initiative: 'fixture',
      candidate: {
        revision: 'abc123456789',
        artifact: 'https://example.test/review',
        issued_at: '2026-07-23T12:00:00Z',
      },
      reader: {
        actor: 'reviewer',
        outcome: 'review-direction',
        identity: 'authenticated',
      },
      targets: [{
        id: 'direction',
        kind: 'decision',
        ref: 'decisions/0001.md',
        ask: 'Should this proceed?',
        authority: 'advise',
      }],
      capture: {
        mode: 'self-service',
        adapter: 'web-form',
        artifact: '/review#feedback',
        destination: 'feedback/submissions',
      },
      disposition: {
        owner: 'operator',
        destination: 'feedback/dispositions',
        return_to_reader: 'required',
        automation: {
          classify: 'agent-autonomous',
          propose: 'agent-autonomous',
          apply: 'human-authorized',
        },
      },
    };
    mk('review-contract.json', `${JSON.stringify(contract, null, 2)}\n`);
    let feedback = CHECK_KINDS['feedback-triaged']({ dir: 'feedback' }, { root: fx, yml: '' });
    assert(feedback.state === 'partial' && feedback.evidence.includes('no observed'), 'issued structured loop without a submission is partial');
    const submission = {
      schema_version: 'blueprint-review-submission/1',
      id: 'review-1',
      contract_id: 'stage-fixture',
      candidate_revision: 'abc123456789',
      reader_actor: 'reviewer',
      target_id: 'direction',
      category: 'question',
      body: 'How does the fallback work?',
      submitted_at: '2026-07-23T13:00:00Z',
      source: { adapter: 'web-form' },
    };
    mk('feedback/submissions/review-1.json', `${JSON.stringify(submission, null, 2)}\n`);
    feedback = CHECK_KINDS['feedback-triaged']({ dir: 'feedback' }, { root: fx, yml: '' });
    assert(feedback.state === 'partial' && feedback.evidence.includes('1 open'), 'structured submission without disposition is partial');
    const disposition = {
      schema_version: 'blueprint-review-disposition/1',
      id: 'review-1-disposition',
      contract_id: 'stage-fixture',
      submission_id: 'review-1',
      candidate_revision: 'abc123456789',
      state: 'answered',
      rationale: 'The fallback is documented.',
      decided_by: 'operator',
      consequences: [{ type: 'answer', ref: 'feedback/answers/review-1.md' }],
      return_to_reader: {
        status: 'sent',
        at: '2026-07-23T14:00:00Z',
        via: 'web-form',
        receipt: 'feedback/returns/review-1.json',
      },
    };
    mk('feedback/dispositions/review-1.json', `${JSON.stringify(disposition, null, 2)}\n`);
    feedback = CHECK_KINDS['feedback-triaged']({ dir: 'feedback' }, { root: fx, yml: '' });
    assert(feedback.state === 'pass' && feedback.evidence.includes('review-loop/1'), 'structured submission + disposition pass feedback gate');
  } finally {
    rmSync(fx, { recursive: true, force: true });
  }

  console.log(`selftest OK (${GREENFIELD_MODEL.stages.length} stages, ${res.totalGates} gates, ${Object.keys(CHECK_KINDS).length} check kinds)`);
}

if (invokedDirectly(import.meta.url)) {
  if (process.argv[2] === '--selftest') await selftest();
  else console.log(JSON.stringify(deriveStageStatus({ root: process.cwd() }), null, 2));
}
