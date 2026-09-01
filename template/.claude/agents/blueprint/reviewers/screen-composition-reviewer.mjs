/**
 * screen-composition-reviewer.mjs — executable pair for the paired .md spec.
 * Implements the ADR-0002 reviewer contract so the judged-screen gate's
 * MECHANICAL half runs outside Claude Code (CLI / CI / any node):
 *
 *   export default async function review({ targetDir, blueprintYml, methodologyHome })
 *     -> { status: 'PASS'|'WARN'|'BLOCKED', findings: [...], metadata: {...} }
 *
 * Gate rule (see judged-screen-pattern.md): every surface declared in the
 * experience brief must carry a COLD screen review — a reviewer who did not
 * build it, judging real device captures — recorded under
 * docs/evidence/screen-reviews/. This file checks that the RECORD exists and is
 * well-formed. It does NOT and cannot judge the screen; that is the .md's
 * protocol, run by a human or a second model.
 *
 * Scope honesty (charter): dependency-free frontmatter + section scan. It
 * verifies presence, required fields, cold:true, reviewer≠implementer, an
 * `accept` verdict, and build currency against a declared release marker. A
 * well-formed record asserting a judgment nobody made passes this reviewer —
 * the mechanical half can only ever check the paperwork, and saying so is the
 * point (see judged-screen-pattern.md § 3, "How it relates to the DoD ladder").
 *
 * SURFACE LIST SOURCE — the experience brief's `## Surfaces` section, not a
 * `screens:` list in blueprint.yml. Reason: template/tools/lib/yaml-scalar.mjs
 * reads TOP-LEVEL SCALARS only (deliberately not a YAML parser), so a list in
 * blueprint.yml would need a net-new parser, and it would put the roster of
 * surfaces in a second place. The brief already owns what surfaces exist.
 *
 * STRICT MODE — `screen_review_policy: strict` (top-level scalar in
 * blueprint.yml), NOT a `--strict` CLI flag. Reason: bin/blueprint.mjs
 * `runReview` calls the reviewer with `{ targetDir, blueprintYml: { tier },
 * methodologyHome }` and forwards no argv, so a CLI flag could never reach a
 * reviewer. A declared policy scalar mirrors `pilot_profile_policy: required`.
 * A direct importer (CI script, another reviewer) may also pass `strict: true`
 * in the context object. Default (absent) is WARN — format-on-touch, the same
 * rollout ui-rendering-contract-tier.md specifies.
 *
 * Dependency-free node ESM. Never throws.
 *
 * Reference: screen-composition-reviewer.md (paired spec),
 *            docs/methodology/judged-screen-pattern.md (owns the rule).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { findInitiativeRoot } from '../../lib/initiative-root.mjs';
import { readTopLevelYamlScalar, stripYamlComment } from '../../../../tools/lib/yaml-scalar.mjs';

const NAME = 'screen-composition-reviewer';
const REVIEW_DIR = path.join('docs', 'evidence', 'screen-reviews');
const PATTERN_REF = 'docs/methodology/judged-screen-pattern.md';

const exists = (p) => fs.access(p).then(() => true, () => false);
const read = (p) => fs.readFile(p, 'utf8').then((s) => s, () => null);

function result(status, findings, targetSummary, startedAt) {
  return { status, findings, metadata: { reviewer: NAME, targetSummary, durationMs: Date.now() - startedAt } };
}

function finalize(findings, targetSummary, startedAt) {
  const status = findings.some((f) => f.severity === 'BLOCK')
    ? 'BLOCKED'
    : findings.some((f) => f.severity === 'WARN')
    ? 'WARN'
    : 'PASS';
  return result(status, findings, targetSummary, startedAt);
}

// ── Frontmatter ──────────────────────────────────────────────────────────────
// Minimal, dependency-free reader for the fixed screen-review header shape:
// scalars, an inline `[a, b]` array, and a block `-` list. Not a YAML parser.
export function parseFrontmatter(text) {
  if (!text) return null;
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) return null;
  const out = {};
  let listKey = null;
  const unquote = (s) => s.replace(/^(["'])(.*)\1$/, '$2').trim();
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^[ \t]+-[ \t]+(.*)$/);
    if (item && listKey) {
      const v = unquote(stripYamlComment(item[1]).trim());
      if (v) out[listKey].push(v);
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const raw = stripYamlComment(kv[2]).trim();
    if (raw === '') {
      listKey = key;
      out[key] = [];
      continue;
    }
    listKey = null;
    if (/^\[[\s\S]*\]$/.test(raw)) {
      out[key] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    } else {
      out[key] = unquote(raw);
    }
  }
  return out;
}

// ── Surface roster ───────────────────────────────────────────────────────────
// Pull the `## Surfaces` section out of the experience brief and read its list
// bullets. Backticks/quotes stripped; compared case-insensitively.
export function extractSurfaces(briefText) {
  if (!briefText) return [];
  // Line scan rather than a section regex — a lookahead for "next ## heading or
  // end of input" is exactly the shape that goes subtly wrong (JS has no \\Z).
  const lines = briefText.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##[ \t]+Surfaces[ \t]*$/.test(l));
  if (start === -1) return [];
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##[ \t]/.test(lines[i])) break;
    body.push(lines[i]);
  }
  const out = [];
  for (const m of body.join('\n').matchAll(/^[ \t]*[-*][ \t]+(.+?)[ \t]*$/gm)) {
    const name = m[1]
      .replace(/`/g, '')
      .replace(/^(["'])(.*)\1$/, '$2')
      .split(/\s+[—–-]\s+/)[0] // allow "today — the default tab"
      .trim()
      .toLowerCase();
    if (name) out.push(name);
  }
  return [...new Set(out)];
}

// A declared release marker and a recorded build match when they are equal, or
// when one is a prefix of the other and long enough to be a commit sha.
export function markerMatches(marker, recorded) {
  if (!marker || !recorded) return false;
  const a = String(marker).trim().toLowerCase();
  const b = String(recorded).trim().toLowerCase();
  if (a === b) return true;
  if (a.length >= 7 && b.startsWith(a)) return true;
  if (b.length >= 7 && a.startsWith(b)) return true;
  return false;
}

const REQUIRED_FIELDS = ['surface', 'device', 'reviewer', 'implementer', 'cold', 'states', 'verdict'];

async function listReviewFiles(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort();
  } catch {
    return [];
  }
}

export default async function review({ targetDir, blueprintYml, strict } = {}) {
  const startedAt = Date.now();
  const findings = [];
  const artifactsRoot = findInitiativeRoot(targetDir);

  const ymlText = (await read(path.join(artifactsRoot, 'blueprint.yml'))) || '';
  const policy =
    (blueprintYml && typeof blueprintYml.screen_review_policy === 'string'
      ? blueprintYml.screen_review_policy
      : readTopLevelYamlScalar(ymlText, 'screen_review_policy')) || '';
  const isStrict = strict === true || policy.toLowerCase() === 'strict';
  const sev = isStrict ? 'BLOCK' : 'WARN';
  const policyLabel = isStrict ? 'strict' : 'warn';

  const releaseMarker = readTopLevelYamlScalar(ymlText, 'release_marker') || null;

  // ── 1. Locate the experience brief ─────────────────────────────────────────
  // Absent brief → not applicable. Whether the brief SHOULD exist is
  // design-principles-reviewer check 10; duplicating that finding here would put
  // one rule in two places.
  const briefCandidates = [
    path.join(artifactsRoot, 'prototype', 'EXPERIENCE-BRIEF.md'),
    path.join(artifactsRoot, 'portal', 'EXPERIENCE-BRIEF.md'),
  ];
  let briefPath = null;
  for (const p of briefCandidates) {
    if (await exists(p)) {
      briefPath = p;
      break;
    }
  }
  if (!briefPath) {
    return result(
      'PASS',
      [],
      'no EXPERIENCE-BRIEF.md — no surfaces declared; brief presence is design-principles-reviewer check 10',
      startedAt,
    );
  }

  const briefRel = path.relative(targetDir, briefPath);
  const surfaces = extractSurfaces(await read(briefPath));
  if (!surfaces.length) {
    findings.push({
      severity: 'WARN',
      location: briefRel,
      message: 'Experience brief has no `## Surfaces` section (or it lists no surfaces) — the screen-review gate has nothing to enumerate.',
      remediation:
        'Add a `## Surfaces` section to the brief listing one surface per bullet. That list is the roster this gate walks; without it a surface can ship with no cold review and nothing notices.',
      reference: `${PATTERN_REF} § 2a`,
    });
    return finalize(findings, `${briefRel}; surfaces=0; policy=${policyLabel}`, startedAt);
  }

  // ── 2. Index the recorded screen reviews by their `surface` field ──────────
  const reviewDirAbs = path.join(artifactsRoot, REVIEW_DIR);
  const files = await listReviewFiles(reviewDirAbs);
  const bySurface = new Map();
  const malformed = [];
  for (const f of files) {
    const fm = parseFrontmatter(await read(path.join(reviewDirAbs, f)));
    if (!fm || !fm.surface) {
      malformed.push(f);
      continue;
    }
    const key = String(fm.surface).toLowerCase();
    // Several reviews can exist for one surface (one per build). Prefer the one
    // matching a declared release_marker; otherwise the last file in readdir
    // order wins. NOT "the newest" — build ids do not sort reliably (today-9
    // sorts after today-12), and with no marker declared nothing else catches a
    // stale pick, so the marker is what makes this deterministic.
    const prev = bySurface.get(key);
    if (prev && releaseMarker) {
      const recorded = (e) => (e.fm.build !== undefined && String(e.fm.build).trim() !== '' ? e.fm.build : e.fm.commit);
      const candidate = { file: f, fm };
      if (markerMatches(releaseMarker, recorded(prev)) && !markerMatches(releaseMarker, recorded(candidate))) continue;
    }
    bySurface.set(key, { file: f, fm });
  }
  for (const f of malformed) {
    findings.push({
      severity: sev,
      location: `${REVIEW_DIR}/${f}`,
      message: 'Screen-review file has no parseable frontmatter, or no `surface:` field — it cannot be matched to a declared surface.',
      remediation: `Give the file the fixed frontmatter block: ${REQUIRED_FIELDS.join(', ')}, plus build (or commit).`,
      reference: `${PATTERN_REF} § 3`,
    });
  }

  // ── 3. Per-surface checks ──────────────────────────────────────────────────
  const tally = { reviewed: 0, cold: 0, independent: 0, accepted: 0, current: 0 };
  for (const surface of surfaces) {
    const hit = bySurface.get(surface);
    if (!hit) {
      findings.push({
        severity: sev,
        location: `${REVIEW_DIR}/${surface}-<build>.md`,
        message: `Surface '${surface}' has no screen review recorded — the rendered frame has not been judged by anyone who did not build it.`,
        remediation:
          'Run the cold screen review (real device captures per representative state, a reviewer who has not read the spec, brief rationale, or source) and record it. Passing tests and source verification do not satisfy this item.',
        reference: `${PATTERN_REF} § 3`,
      });
      continue;
    }
    tally.reviewed += 1;
    const loc = `${REVIEW_DIR}/${hit.file}`;
    const fm = hit.fm;

    // 3a. Required fields present and non-empty.
    const missing = REQUIRED_FIELDS.filter((k) => {
      const v = fm[k];
      if (v === undefined || v === null) return true;
      if (Array.isArray(v)) return v.length === 0;
      return String(v).trim() === '';
    });
    const hasBuild = ['build', 'commit'].some((k) => fm[k] !== undefined && String(fm[k]).trim() !== '');
    if (!hasBuild) missing.push('build (or commit)');
    if (missing.length) {
      findings.push({
        severity: sev,
        location: loc,
        message: `Screen review for '${surface}' is missing required frontmatter field(s): ${missing.join(', ')}.`,
        remediation: `The record is the only machine-checkable half of this gate. Fill every field: ${REQUIRED_FIELDS.join(', ')}, plus build (or commit).`,
        reference: `${PATTERN_REF} § 3`,
      });
    }

    // 3b. cold: true — the whole point of the reviewer.
    const cold = String(fm.cold).toLowerCase() === 'true';
    if (cold) tally.cold += 1;
    else {
      findings.push({
        severity: sev,
        location: loc,
        message: `Screen review for '${surface}' is not marked \`cold: true\` — a reviewer carrying the spec, the brief's rationale, or the implementation cannot see the frame the user sees.`,
        remediation:
          'Re-run the review with someone (a second model, session, or person) who has read only the brief\'s five job questions, then record cold: true.',
        reference: `${PATTERN_REF} § 3`,
      });
    }

    // 3c. Reviewer is not the implementer.
    const reviewer = String(fm.reviewer || '').trim().toLowerCase();
    const implementer = String(fm.implementer || '').trim().toLowerCase();
    if (reviewer && implementer && reviewer !== implementer) tally.independent += 1;
    else if (reviewer && implementer) {
      findings.push({
        severity: sev,
        location: loc,
        message: `Screen review for '${surface}' names the same party as reviewer and implementer ('${fm.reviewer}') — this is self-attestation, not a cold review.`,
        remediation: 'The reviewer must not be the implementer. Name a second model, session, or person.',
        reference: `${PATTERN_REF} § 3; global-rules/audit-discipline.md`,
      });
    }

    // 3d. Verdict accepted.
    const verdict = String(fm.verdict || '').trim().toLowerCase();
    if (verdict === 'accept') tally.accepted += 1;
    else {
      findings.push({
        severity: sev,
        location: loc,
        message: `Screen review for '${surface}' carries verdict '${fm.verdict || '(none)'}' — the surface is not accepted.`,
        remediation:
          'Act on the review (remove / combine / demote / disclose), then re-review the new build cold. A revise verdict is a work item, not a blocker to record.',
        reference: `${PATTERN_REF} § 3`,
      });
    }

    // 3e. Build currency — only when a release marker is declared.
    if (releaseMarker) {
      const recorded = fm.build !== undefined && String(fm.build).trim() !== '' ? fm.build : fm.commit;
      if (markerMatches(releaseMarker, recorded)) tally.current += 1;
      else {
        findings.push({
          severity: sev,
          location: loc,
          message: `Screen review for '${surface}' records build '${recorded || '(none)'}' but blueprint.yml declares release_marker '${releaseMarker}' — the accepted frame is not the frame shipping.`,
          remediation:
            'Re-run the cold review against captures from the current build, or update release_marker if the declaration is the stale half.',
          reference: `${PATTERN_REF} § 3`,
        });
      }
    }
  }

  const currentLabel = releaseMarker ? `${tally.current}/${surfaces.length}` : 'no release marker declared';
  const summary =
    `${briefRel}; surfaces=${surfaces.length}; reviewed=${tally.reviewed}/${surfaces.length}; ` +
    `cold=${tally.cold}/${surfaces.length}; independent=${tally.independent}/${surfaces.length}; ` +
    `accepted=${tally.accepted}/${surfaces.length}; current=${currentLabel}; policy=${policyLabel}`;
  return finalize(findings, summary, startedAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// Self-test — `node screen-composition-reviewer.mjs` exercises the gate against
// inline fixtures and exits non-zero on any failed assertion. Matches the libs'
// guarded-main pattern.
// ─────────────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const os = await import('node:os');

  let passed = 0;
  const check = (name, cond) => {
    if (!cond) {
      console.error(`FAIL: ${name}`);
      process.exit(1);
    }
    passed += 1;
    console.log(`ok   ${name}`);
  };

  const mkTmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'screen-composition-test-'));
  async function writeFile(dir, rel, content) {
    const fp = path.join(dir, rel);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, content, 'utf8');
  }

  const BRIEF = `# Experience brief

## Surfaces
- today
- \`settings\`

## The job, in five questions
1. What is happening now?
`;

  const goodReview = (over = {}) => {
    const f = {
      surface: 'today',
      build: '12',
      device: 'iPhone 15 Pro, iOS 18.2',
      reviewer: 'session-b',
      implementer: 'session-a',
      cold: 'true',
      states: '[active, upcoming, empty, failure, largest-text]',
      verdict: 'accept',
      ...over,
    };
    return `---\n${Object.entries(f).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\nThe eye lands on the date first.\n`;
  };

  // Fixture 1 — both surfaces reviewed, cold, independent, accepted → PASS.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('complete → PASS', res.status === 'PASS');
    check('complete → zero findings', res.findings.length === 0);
    check('metadata.reviewer is set', res.metadata.reviewer === NAME);
    check('metadata has durationMs', typeof res.metadata.durationMs === 'number');
    check('summary reports 2/2 reviewed', /reviewed=2\/2/.test(res.metadata.targetSummary));
    check('summary reports no release marker', /no release marker declared/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2 — no experience brief → PASS, not applicable (no duplicate gate).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const res = await review({ targetDir: dir });
    check('no brief → PASS', res.status === 'PASS');
    check('no brief → points at design-principles-reviewer', /design-principles-reviewer check 10/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3 — a declared surface with no review → WARN by default.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview());
    const res = await review({ targetDir: dir });
    check('missing review → WARN', res.status === 'WARN');
    check('names the unreviewed surface', res.findings.some((f) => /'settings' has no screen review/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3b — same tree under strict policy → BLOCKED.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\nscreen_review_policy: strict\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview());
    const res = await review({ targetDir: dir });
    check('missing review under strict policy → BLOCKED', res.status === 'BLOCKED');
    check('strict reported in summary', /policy=strict/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3c — strict passed directly in the context object (direct importer).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    const res = await review({ targetDir: dir, strict: true });
    check('context strict:true → BLOCKED', res.status === 'BLOCKED');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 4 — cold:false is caught even though every other field is fine.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview({ cold: 'false' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('cold:false → WARN', res.status === 'WARN');
    check('cold finding present', res.findings.some((f) => /not marked `cold: true`/.test(f.message)));
    check('summary reports cold=1/2', /cold=1\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 5 — reviewer === implementer is self-attestation.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview({ reviewer: 'session-a' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('reviewer === implementer → WARN', res.status === 'WARN');
    check('self-attestation finding present', res.findings.some((f) => /self-attestation, not a cold review/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 6 — verdict: revise is not an accepted surface.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview({ verdict: 'revise' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('verdict revise → WARN', res.status === 'WARN');
    check('verdict finding present', res.findings.some((f) => /carries verdict 'revise'/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 7 — a stale build against a declared release marker.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\nrelease_marker: "14"\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-14.md', goodReview({ surface: 'settings', build: '14' }));
    const res = await review({ targetDir: dir });
    check('stale build vs release marker → WARN', res.status === 'WARN');
    check('currency finding names both', res.findings.some((f) => /records build '12'/.test(f.message) && /release_marker '14'/.test(f.message)));
    check('summary reports current=1/2', /current=1\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 7b — with a marker declared, the matching review wins regardless of
  // readdir order (today-9 sorts AFTER today-12, so last-wins would pick stale).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\nrelease_marker: "12"\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview({ build: '12' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/today-9.md', goodReview({ build: '9' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('marker-matching review beats readdir order → PASS', res.status === 'PASS');
    check('summary reports current=2/2', /current=2\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 8 — missing required fields (no implementer, empty states).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(
      dir,
      'docs/evidence/screen-reviews/today-12.md',
      `---\nsurface: today\nbuild: 12\ndevice: iPhone 15 Pro\nreviewer: session-b\ncold: true\nverdict: accept\n---\n\nbody\n`,
    );
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('missing fields → WARN', res.status === 'WARN');
    const mf = res.findings.find((f) => /missing required frontmatter field/.test(f.message));
    check('names implementer and states', mf && /implementer/.test(mf.message) && /states/.test(mf.message));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 9 — brief present but no `## Surfaces` section → WARN, nothing to walk.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', '# Experience brief\n\n## The job\n- what is happening now\n');
    const res = await review({ targetDir: dir });
    check('no Surfaces section → WARN', res.status === 'WARN');
    check('surfaces=0 in summary', /surfaces=0/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10 — portal/ shell location is found too.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'portal/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('portal/EXPERIENCE-BRIEF.md → PASS', res.status === 'PASS');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 11 — never throws on a nonexistent targetDir.
  {
    const res = await review({ targetDir: '/nonexistent/path/does/not/exist-xyz' });
    check('nonexistent targetDir → does not throw, PASS not-applicable', res.status === 'PASS');
  }

  // Unit — frontmatter parser.
  check('parseFrontmatter reads scalars', parseFrontmatter('---\nsurface: today\n---\n').surface === 'today');
  check('parseFrontmatter reads inline array', JSON.stringify(parseFrontmatter('---\nstates: [a, b]\n---\n').states) === '["a","b"]');
  check(
    'parseFrontmatter reads block list',
    JSON.stringify(parseFrontmatter('---\nstates:\n  - a\n  - b\n---\n').states) === '["a","b"]',
  );
  check('parseFrontmatter strips comments', parseFrontmatter('---\nbuild: 12  # ship\n---\n').build === '12');
  check('parseFrontmatter returns null without a block', parseFrontmatter('# no frontmatter\n') === null);

  // Unit — surface extraction.
  check('extractSurfaces reads bullets', JSON.stringify(extractSurfaces('## Surfaces\n- today\n- `settings`\n')) === '["today","settings"]');
  check('extractSurfaces stops at next heading', JSON.stringify(extractSurfaces('## Surfaces\n- today\n\n## Job\n- not-a-surface\n')) === '["today"]');
  check('extractSurfaces drops trailing gloss', JSON.stringify(extractSurfaces('## Surfaces\n- today — the default tab\n')) === '["today"]');
  check('extractSurfaces returns [] with no section', extractSurfaces('# brief\n').length === 0);

  // Unit — release-marker matching.
  check('markerMatches exact', markerMatches('12', '12'));
  check('markerMatches sha prefix', markerMatches('a1b2c3d4e5f6', 'a1b2c3d'));
  check('markerMatches rejects different builds', !markerMatches('14', '12'));
  check('markerMatches rejects short prefix', !markerMatches('1', '12'));

  console.log(`\nAll ${passed} assertions passed.`);
}
