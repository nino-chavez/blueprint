// stage-model.mjs — the deterministic core of stage orchestration (ADR-0008).
//
// Declares the canonical stage model as DATA (not closures) and DERIVES an
// initiative's current stage state from artifacts-on-disk + blueprint.yml.
// Read-only: this lib reports; it does not gate or mutate. `blueprint stage
// status` renders it; `blueprint stage advance` previews the next transition.
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

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';

// ── fs helpers ─────────────────────────────────────────────────────
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const ls = (p) => (isDir(p) ? readdirSync(p) : []);
const read = (p) => (isFile(p) ? readFileSync(p, 'utf8') : '');
const mdCount = (p) => ls(p).filter((f) => f.endsWith('.md') && read(join(p, f)).trim().length > 40).length;
const anyContains = (p, re) => ls(p).some((f) => f.endsWith('.md') && re.test(read(join(p, f))));

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
  for (const line of yml.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.+?)\s*(?:#.*)?$/);
    if (m && m[1] === key) {
      const v = m[2].replace(/^["']|["']$/g, '').trim();
      return v === 'null' || v === '' ? null : v;
    }
  }
  return null;
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

  'name-match': ({ dirs, pattern, missState = 'absent' }, c) => {
    if (!Array.isArray(dirs) || !dirs.length || !pattern) return badParams('name-match', 'need dirs[] + pattern');
    const re = new RegExp(pattern, 'i');
    return dirs.some((d) => ls(join(c.root, d)).some((f) => re.test(f)))
      ? { state: 'pass', evidence: `${dirs.join('|')}: filename ~ /${pattern}/` }
      : { state: missState, evidence: `${dirs.join('|')}: no filename ~ /${pattern}/` };
  },

  'manual': ({ evidence }) => ({ state: 'partial', evidence: evidence || 'not derivable from disk — needs assertion' }),

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
    const f = ls(join(c.root, dir));
    const cap = f.some((x) => x.endsWith('.md') && !/triage|kudos/i.test(x));
    const tri = f.some((x) => /triage/i.test(x));
    if (cap && tri) return { state: 'pass', evidence: `${dir}: captures + triage present` };
    if (cap || tri) return { state: 'partial', evidence: `${dir}: partial (capture or triage, not both)` };
    return { state: 'absent', evidence: `${dir}: none` };
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
      { id: 'pilot-profile', derivable: true, kind: 'yml-block', params: { key: 'pilot_profile' } },
      { id: 'sensor-wired', derivable: false, kind: 'manual', params: { evidence: 'not derivable from disk — requires driving the running app' } },
    ] },
    { id: 1, name: 'Research', gates: [
      { id: 'research-artifacts', derivable: true, kind: 'dir-md-min', params: { dirs: ['research'], min: 2 } },
      { id: 'sibling-scan', derivable: true, kind: 'dir-contains', params: { dir: 'research', pattern: 'sibling|reference impl|internal reference|comparable' } },
      { id: 'reference-grading', derivable: true, kind: 'dir-contains', params: { dir: 'research', pattern: 'track|evidence-track|convention-track|reference quality', missState: 'partial' } },
    ] },
    { id: 2, name: 'Design Principles', gates: [
      { id: 'principles-doc', derivable: true, kind: 'name-match', params: { dirs: ['docs', 'research'], pattern: 'design-principle|design-system|principles' } },
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
      { id: 'decisions', derivable: true, kind: 'dir-md-min', params: { dirs: ['decisions', 'docs/decisions'], min: 1 } },
    ] },
    { id: 6, name: 'Deploy', gates: [
      { id: 'deploy-config', derivable: true, kind: 'deploy-signals', params: { paths: ['vercel.json', '.github/workflows'], distDir: 'apps/portal/dist' } },
      { id: 'live-url', derivable: false, kind: 'manual', params: { evidence: 'not derivable from disk — requires a reachability check' } },
    ] },
    { id: 7, name: 'Iterate', gates: [
      { id: 'feedback-triaged', derivable: true, kind: 'feedback-triaged', params: { dir: 'feedback' } },
    ] },
  ],
};

const BUILTIN_MODELS = { greenfield: GREENFIELD_MODEL };

// ── model loading (config-driven) ──────────────────────────────────
// Resolution order: blueprint.yml `stage_model:` scalar →
//   - a path ending in .json → load + parse that file
//   - a built-in name (e.g. 'greenfield') → that model
//   - unset / unknown → greenfield default (with a `note` when a name was
//     given we don't ship yet — midstream/brownfield/research are ADR-0008
//     rollout step d, PENDING).
export function loadStageModel(root) {
  const yml = read(join(root, 'blueprint.yml'));
  const sel = ymlScalar(yml, 'stage_model');
  if (sel && /\.json$/.test(sel)) {
    const p = isAbsolute(sel) ? sel : join(root, sel);
    try {
      const model = JSON.parse(read(p));
      // Consumer-authored JSON: validate the whole stage shape, not just that
      // `stages` is an array. A null stage element, or `gates` authored as an
      // object (a plausible YAML-map→JSON slip), otherwise throws out of
      // deriveStageStatus — which bin/blueprint.mjs calls with no try/catch.
      // Fail closed to greenfield rather than crash `stage status`.
      const stagesOk = Array.isArray(model?.stages)
        && model.stages.every((s) => s && typeof s === 'object' && Array.isArray(s.gates ?? []));
      if (!stagesOk) {
        return { model: GREENFIELD_MODEL, source: 'greenfield (fallback)', note: `stage_model '${sel}' has a malformed stages[] (need objects with gates[]) — using greenfield` };
      }
      return { model, source: p, note: null };
    } catch (e) {
      return { model: GREENFIELD_MODEL, source: 'greenfield (fallback)', note: `stage_model '${sel}' unreadable: ${e.message}` };
    }
  }
  if (sel && BUILTIN_MODELS[sel]) return { model: BUILTIN_MODELS[sel], source: sel, note: null };
  if (sel) return { model: GREENFIELD_MODEL, source: 'greenfield (fallback)', note: `stage_model '${sel}' not shipped yet (ADR-0008 rollout step d) — using greenfield` };
  return { model: GREENFIELD_MODEL, source: 'greenfield (default)', note: null };
}

// ── derivation ─────────────────────────────────────────────────────
export function deriveStageStatus({ root, assertions = {} }) {
  root = resolve(root);
  const { model, source, note } = loadStageModel(root);
  const ctx = { root, yml: read(join(root, 'blueprint.yml')) };

  const stages = model.stages.map((st) => {
    const gates = (st.gates || []).map((g) => {
      const kind = CHECK_KINDS[g.kind];
      let r;
      try {
        r = kind ? kind(g.params || {}, ctx)
          : { state: 'absent', evidence: `unknown check kind '${g.kind}'` };
      } catch (e) {
        r = { state: 'absent', evidence: `check '${g.kind}' errored: ${e.message}` };
      }
      // A non-derivable (agentic-shell) gate is satisfied by a RECORDED
      // assertion — the operator/reviewer confirmed the fuzzy edge. Derivable
      // gates ignore assertions: you cannot assert your way past a mechanical
      // check the disk contradicts.
      if (!g.derivable && r.state !== 'pass' && assertions[g.id]) {
        r = { state: 'pass', evidence: `asserted: ${assertions[g.id].evidence || 'confirmed'}` };
      }
      return { gate: g.id, derivable: g.derivable, kind: g.kind, ...r };
    });
    // Two notions, deliberately distinct:
    //  - artifactPass: all DERIVABLE gates pass — "how far the raw artifacts
    //    reach", independent of any assertion. Drives `artifactCursor`.
    //  - complete: EVERY gate passes (derivable by disk, non-derivable by a
    //    folded assertion) — the officially-confirmed position. Drives `cursor`
    //    and the advance frontier. Empty-gate stages are vacuously complete.
    const derivable = gates.filter((g) => g.derivable);
    const artifactPass = derivable.length > 0 && derivable.every((g) => g.state === 'pass');
    const complete = gates.every((g) => g.state === 'pass');
    return { id: st.id, name: st.name, gates, artifactPass, complete };
  });

  // Linear spine: a cursor is the highest N such that EVERY stage ≤ N holds the
  // property. artifactCursor uses artifactPass (disk reach); cursor uses
  // complete (disk + recorded assertions — you cannot be "confirmed through" a
  // stage whose shell gate nobody signed off).
  let artifactCursor = -1;
  for (const s of stages) { if (s.artifactPass) artifactCursor = s.id; else break; }
  let cursor = -1;
  for (const s of stages) { if (s.complete) cursor = s.id; else break; }

  const allGates = stages.flatMap((s) => s.gates);
  const derivableCount = allGates.filter((g) => g.derivable).length;
  return {
    variant: model.variant || 'greenfield',
    modelSource: source,
    modelNote: note,
    cursor,
    cursorName: cursor >= 0 ? stages.find((x) => x.id === cursor).name : null,
    artifactCursor,
    artifactCursorName: artifactCursor >= 0 ? stages.find((x) => x.id === artifactCursor).name : null,
    stages,
    derivableCount,
    nonderivableCount: allGates.length - derivableCount,
    totalGates: allGates.length,
    // frontier = first stage not yet CONFIRMED complete (what advance targets)
    nextStage: stages.find((s) => !s.complete) || null,
  };
}

// ── advance preview (dry-run; ADR-0008 rollout step c) ─────────────
// Reports whether the initiative may advance PAST its current cursor into the
// next stage: the next stage's derivable gates must all pass, and each
// non-derivable gate needs an assertion (assertion RECORDING — the state
// mutation — is deferred to a later slice; today advance is read-only preview).
export function previewAdvance({ root, assertions = {} }) {
  const st = deriveStageStatus({ root, assertions });
  const next = st.nextStage;
  if (!next) return { ...st, advance: { canAdvance: true, target: null, reason: 'all stages pass — pipeline complete' } };
  const blocking = next.gates.filter((g) => g.derivable && g.state !== 'pass');
  const needsAssertion = next.gates.filter((g) => !g.derivable && g.state !== 'pass');
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
  return true;
}

export function readStageState(root) {
  const p = join(resolve(root), STATE_REL);
  const empty = { cursor: -1, assertions: {}, history: [] };
  if (!existsSync(p)) return empty;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    if (!isValidStateShape(parsed)) return { ...empty, corrupt: true, error: 'state file is valid JSON but not a {assertions:{…}} object' };
    return { ...empty, ...parsed };
  } catch (e) { return { ...empty, corrupt: true, error: e.message }; }
}

// recordAdvance — advance the CONFIRMED cursor by completing the current
// frontier stage (the first not-yet-complete stage, computed from the
// ALREADY-recorded assertions so the target is fixed for this call and doesn't
// drift when new assertions are folded). The frontier completes iff its
// derivable gates pass on disk AND its non-derivable gates are covered by
// recorded ∪ new assertions. On success the confirmed cursor jumps to wherever
// disk-complete stages then reach. Dry-run by default; `now` injected for
// deterministic testing.
export function recordAdvance({ root, asserts = {}, execute = false, now }) {
  root = resolve(root);
  const prev = readStageState(root);
  if (prev.corrupt) {
    return { ok: false, corrupt: true, message: `${STATE_REL} is unparseable (${prev.error}) — refusing to overwrite; fix or remove it`, state: prev };
  }
  const stamp = now || new Date().toISOString();
  const recorded = prev.assertions || {};

  // frontier from recorded assertions only — the fixed target for this call
  const base = deriveStageStatus({ root, assertions: recorded });
  const frontier = base.nextStage;
  if (!frontier) return { ok: true, complete: true, cursor: base.cursor, message: 'all stages confirmed — pipeline complete', state: prev };

  // fold the new assertions and test whether THIS frontier completes
  const merged = { ...recorded };
  for (const [gate, evidence] of Object.entries(asserts)) merged[gate] = { evidence, at: stamp };
  const withNew = deriveStageStatus({ root, assertions: merged });
  const target = withNew.stages.find((s) => s.id === frontier.id);
  const blocking = target.gates.filter((g) => g.derivable && g.state !== 'pass');
  const stillNeeding = target.gates.filter((g) => !g.derivable && g.state !== 'pass');
  if (blocking.length || stillNeeding.length) {
    return {
      ok: false,
      target: { id: target.id, name: target.name },
      blocking: blocking.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      missingAssertions: stillNeeding.map((g) => ({ gate: g.gate, evidence: g.evidence })),
      state: prev,
    };
  }

  const state = {
    cursor: withNew.cursor,          // may jump past already-disk-complete stages
    advancedTo: withNew.cursorName,
    assertions: merged,
    history: [...(prev.history || []), { stage: frontier.id, at: stamp }],
  };
  if (execute) {
    mkdirSync(join(root, '.blueprint'), { recursive: true });
    writeFileSync(join(root, STATE_REL), JSON.stringify(state, null, 2) + '\n');
  }
  return { ok: true, target: { id: frontier.id, name: frontier.name }, cursor: withNew.cursor, wrote: execute ? STATE_REL : null, state };
}

// ── self-test (node stage-model.mjs --selftest) ────────────────────
function selftest() {
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

  // every gate references a known check kind
  for (const s of GREENFIELD_MODEL.stages)
    for (const g of s.gates)
      assert(CHECK_KINDS[g.kind], `gate ${g.id} kind '${g.kind}' registered`);

  // linear-spine cursor halts at first failing stage
  const fake = [{ stagePass: false, id: 0 }, { stagePass: true, id: 1 }];
  let cur = -1; for (const s of fake) { if (s.stagePass) cur = s.id; else break; }
  assert(cur === -1, 'linear-spine cursor halts at first gap');

  // malformed consumer models must fall back, never throw (loadStageModel guard)
  for (const bad of [{ stages: [null] }, { stages: [{ id: 0, gates: { x: 1 } }] }, { stages: {} }, {}]) {
    const v = Array.isArray(bad?.stages) && bad.stages.every((s) => s && typeof s === 'object' && Array.isArray(s.gates ?? []));
    assert(v === false, `malformed model rejected: ${JSON.stringify(bad)}`);
  }

  const res = deriveStageStatus({ root: process.cwd() });
  assert(res.stages.length === GREENFIELD_MODEL.stages.length, 'derives all stages');
  assert(res.totalGates === res.derivableCount + res.nonderivableCount, 'gate counts reconcile');
  const adv = previewAdvance({ root: process.cwd() });
  assert(adv.advance && typeof adv.advance.canAdvance === 'boolean', 'advance preview shape');

  // an assertion satisfies a non-derivable gate; a derivable gate ignores it
  const asserted = deriveStageStatus({ root: process.cwd(), assertions: { 'sensor-wired': { evidence: 'drove it' } } });
  const s0 = asserted.stages.find((s) => s.id === 0).gates.find((g) => g.gate === 'sensor-wired');
  assert(s0.state === 'pass', 'assertion satisfies non-derivable gate');
  const forged = deriveStageStatus({ root: process.cwd(), assertions: { 'principles-doc': { evidence: 'nope' } } });
  const s2 = forged.stages.find((s) => s.id === 2).gates.find((g) => g.gate === 'principles-doc');
  assert(s2.state !== 'pass', 'assertion does NOT override a derivable gate the disk contradicts');

  // frontier on this repo is Stage 0 (sensor-wired unasserted) — an assertion
  // gap, not a disk gap; recordAdvance dry-run must not write.
  const dry = recordAdvance({ root: process.cwd(), execute: false, now: '2026-01-01T00:00:00Z' });
  assert(dry.ok === false && dry.missingAssertions.some((g) => g.gate === 'sensor-wired'), 'frontier needs the shell assertion');
  assert(!(dry.blocking || []).length, 'no derivable blocker at the Stage-0 frontier here');
  // GREENFIELD SUCCESS PATH (the case finding #1 proved was unreachable):
  // asserting the frontier's shell gate completes it and advances the confirmed
  // cursor past every already-disk-complete stage.
  const ok = recordAdvance({ root: process.cwd(), asserts: { 'sensor-wired': 'drove it' }, execute: false, now: '2026-01-01T00:00:00Z' });
  assert(ok.ok === true && ok.cursor >= 1, 'asserting the frontier shell gate advances the confirmed cursor');
  assert(readStageState(process.cwd()).cursor === -1, 'dry-run wrote no state file');
  // corrupt state is flagged, never silently emptied
  assert(readStageState(process.cwd()).corrupt === undefined, 'absent state file is not corrupt');
  // state-shape guard: valid JSON that isn't a {assertions:{…}} object is corrupt
  for (const bad of [null, [], 'x', 42, { assertions: ['a'] }, { assertions: null }])
    assert(!isValidStateShape(bad), `rejected malformed state shape: ${JSON.stringify(bad)}`);
  assert(isValidStateShape({ cursor: 0, assertions: {} }) && isValidStateShape({ cursor: -1 }), 'valid state shapes accepted');
  console.log(`selftest OK (${GREENFIELD_MODEL.stages.length} stages, ${res.totalGates} gates, ${Object.keys(CHECK_KINDS).length} check kinds)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === '--selftest') selftest();
  else console.log(JSON.stringify(deriveStageStatus({ root: process.cwd() }), null, 2));
}
