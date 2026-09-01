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

const REQUIRED_FIELDS = ['surface', 'kind', 'device', 'reviewer', 'implementer', 'cold', 'states', 'verdict'];
const KINDS = ['cold', 'conformance'];
// Which reviews each intent owes. A cold review is required under EVERY intent —
// a `preserve` change still ships a frame nobody judged. Conformance is owed
// only where a selected direction exists to conform to. Undeclared intent asks
// for cold only and stays silent about conformance: design-principles-reviewer
// owns the "declare design_intent" WARN, and two reviewers nagging about one
// missing field is how a gate gets tuned out.
const REQUIRED_KINDS_BY_INTENT = { preserve: ['cold'], refit: ['cold', 'conformance'], rethink: ['cold', 'conformance'] };
// Accepted brief locations — judged-screen-pattern.md § 2b owns this set.
const BRIEF_PATHS = [
  ['prototype', 'EXPERIENCE-BRIEF.md'],
  ['portal', 'EXPERIENCE-BRIEF.md'],
  ['docs', 'design', 'experience-brief.md'],
];

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

  const intentRaw =
    (blueprintYml && typeof blueprintYml.design_intent === 'string'
      ? blueprintYml.design_intent
      : readTopLevelYamlScalar(ymlText, 'design_intent')) || '';
  const intent = intentRaw.trim().toLowerCase();
  const requiredKinds = REQUIRED_KINDS_BY_INTENT[intent] || ['cold'];
  const intentDeclared = Boolean(REQUIRED_KINDS_BY_INTENT[intent]);
  // Same vocabulary design-principles-reviewer reports, so one blueprint.yml
  // never gets two different words for the same value.
  const intentLabel = intentDeclared ? intent : intentRaw.trim() ? `unknown (${intentRaw.trim()})` : 'undeclared';

  // ── 1. Locate the experience brief ─────────────────────────────────────────
  // Absent brief → not applicable. Whether the brief SHOULD exist is
  // design-principles-reviewer check 10; duplicating that finding here would put
  // one rule in two places.
  let briefPath = null;
  for (const parts of BRIEF_PATHS) {
    const p = path.join(artifactsRoot, ...parts);
    if (await exists(p)) {
      briefPath = p;
      break;
    }
  }
  if (!briefPath) {
    // Declaring a design_intent is what adopts the pattern. Before that, silence:
    // an initiative that never opted in is not failing a gate it was not offered.
    // After it, a missing surface roster is a real gap — without one, nothing
    // declares which surfaces exist, so the cold review this gate requires under
    // EVERY intent (§ 3) has nothing to be required against, and the reviewer
    // would PASS a tree with zero screen reviews. That silent pass is the exact
    // failure class this pattern exists to name.
    if (!intentDeclared) {
      return result(
        'PASS',
        [],
        `no EXPERIENCE-BRIEF.md and design-intent=${intentLabel} — pattern not adopted; brief presence is design-principles-reviewer check 10`,
        startedAt,
      );
    }
    findings.push({
      severity: sev,
      location: 'prototype/EXPERIENCE-BRIEF.md (or portal/, or docs/design/experience-brief.md)',
      message: `design_intent is '${intentLabel}' but there is no EXPERIENCE-BRIEF.md, so no surface roster exists — nothing declares which surfaces need a cold review, and this gate would pass a build no one judged.`,
      remediation:
        'Add a `## Surfaces` list naming one surface per bullet. Under `preserve` that section can be the whole brief; `refit` and `rethink` owe the rest of it too (design-principles-reviewer check 10).',
      reference: `${PATTERN_REF} § 2a`,
    });
    return finalize(findings, `no EXPERIENCE-BRIEF.md; design-intent=${intentLabel}; policy=${policyLabel}`, startedAt);
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
  // Keyed by surface AND kind — one surface can owe two reviews asking different
  // questions, and a conformance pass must never satisfy the cold requirement.
  const byKey = new Map();
  const collisions = new Map();
  const malformed = [];
  const keyOf = (surface, kind) => `${String(surface).toLowerCase()}::${kind}`;
  for (const f of files) {
    const fm = parseFrontmatter(await read(path.join(reviewDirAbs, f)));
    if (!fm || !fm.surface) {
      malformed.push(f);
      continue;
    }
    // A record with no `kind` indexes as cold so it still matches its surface,
    // and separately earns a missing-required-field finding. Silently dropping
    // it would report "no cold review recorded", which points at the wrong fix.
    const kind = KINDS.includes(String(fm.kind || '').trim().toLowerCase())
      ? String(fm.kind).trim().toLowerCase()
      : 'cold';
    const key = keyOf(fm.surface, kind);
    // Several reviews can exist for one surface+kind (one per build). Prefer the
    // one matching a declared release_marker; otherwise the last file in readdir
    // order wins. NOT "the newest" — build ids do not sort reliably (today-9
    // sorts after today-12), and with no marker declared nothing else catches a
    // stale pick, so the marker is what makes this deterministic.
    const prev = byKey.get(key);
    if (prev) {
      collisions.set(key, (collisions.get(key) || 1) + 1);
      if (releaseMarker) {
        const recorded = (e) => (e.fm.build !== undefined && String(e.fm.build).trim() !== '' ? e.fm.build : e.fm.commit);
        if (markerMatches(releaseMarker, recorded(prev)) && !markerMatches(releaseMarker, recorded({ fm }))) continue;
      }
    }
    byKey.set(key, { file: f, fm, kind });
  }

  // A surface accumulates several cold reviews over its life — a `rethink`
  // starts with one against the build being rethought (§ 2c step 1), and a
  // retrofit reviews the shipped build before the new one (§ 9). That is
  // correct. Ambiguity about WHICH ONE the gate is reading is not: without a
  // release_marker the last file in readdir order wins, and build ids do not
  // sort reliably. Report it rather than pick, because picking silently is how
  // a stale accept passes for a fresh one.
  if (!releaseMarker) {
    for (const [key, n] of collisions) {
      const [surface, kind] = key.split('::');
      findings.push({
        severity: sev,
        location: REVIEW_DIR,
        message: `Surface '${surface}' has ${n} '${kind}' reviews recorded and blueprint.yml declares no release_marker — nothing identifies which one is current, so this gate would read whichever sorts last.`,
        remediation:
          'Declare release_marker in blueprint.yml (a build number or commit sha). Several reviews per surface is expected across builds; ambiguity about which is current is not.',
        reference: `${PATTERN_REF} § 2c`,
      });
    }
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

  // ── 3. Per-surface, per-required-kind checks ────────────────────────────────
  const total = surfaces.length * requiredKinds.length;
  const tally = { reviewed: 0, discipline: 0, independent: 0, accepted: 0, current: 0 };
  for (const surface of surfaces) {
    for (const kind of requiredKinds) {
      const hit = byKey.get(keyOf(surface, kind));
      if (!hit) {
        findings.push({
          severity: sev,
          location: `${REVIEW_DIR}/${surface}-<build>-${kind}.md`,
          message:
            kind === 'cold'
              ? `Surface '${surface}' has no blind cold review recorded — the rendered frame has not been judged on sight by anyone who did not build it.`
              : `Surface '${surface}' has no direction-conformance review recorded, and design_intent is '${intentLabel}' — nothing checks whether what shipped is the direction that was selected.`,
          remediation:
            kind === 'cold'
              ? 'Run the blind cold review (real device captures per representative state, a reviewer who has not read the spec, brief rationale, or source) and record it with kind: cold. Passing tests and source verification do not satisfy this item.'
              : 'Run the direction-conformance review: read the direction record and the selection ADR, then the same captures, and record it with kind: conformance and cold: false. A cold pass does not prove conformance — a screen can read well and be a different product than the one selected.',
          reference: `${PATTERN_REF} § 3${kind === 'cold' ? 'a' : 'b'}`,
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
          message: `Screen review for '${surface}' (${kind}) is missing required frontmatter field(s): ${missing.join(', ')}.`,
          remediation: `The record is the only machine-checkable half of this gate. Fill every field: ${REQUIRED_FIELDS.join(', ')}, plus build (or commit).`,
          reference: `${PATTERN_REF} § 3a`,
        });
      }

      // 3b. The `cold` flag must match the kind. A cold review carrying context
      // is not cold; a conformance review claiming cold:true has misunderstood
      // its job, because reading the direction record IS its job.
      const coldFlag = String(fm.cold).trim().toLowerCase();
      const wantCold = kind === 'cold' ? 'true' : 'false';
      if (coldFlag === wantCold) tally.discipline += 1;
      else {
        findings.push({
          severity: sev,
          location: loc,
          message:
            kind === 'cold'
              ? `Blind cold review for '${surface}' is not marked \`cold: true\` — a reviewer carrying the spec, the brief's rationale, or the implementation cannot see the frame the user sees.`
              : `Conformance review for '${surface}' is marked \`cold: ${fm.cold}\`, but a conformance reviewer reads the direction record and the selection ADR. That is the job, so the record must say \`cold: false\`.`,
          remediation:
            kind === 'cold'
              ? "Re-run the review with someone (a second model, session, or person) who has read only the brief's five job questions, then record cold: true."
              : 'Set cold: false on the conformance record. If the reviewer genuinely read nothing but the screens, that was a cold review — record it as kind: cold and run conformance separately.',
          reference: `${PATTERN_REF} § 3${kind === 'cold' ? 'a' : 'b'}`,
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
          message: `Screen review for '${surface}' (${kind}) names the same party as reviewer and implementer ('${fm.reviewer}') — this is self-attestation, not a review.`,
          remediation: 'The reviewer must not be the implementer. Name a second model, session, or person.',
          reference: `${PATTERN_REF} § 3a; global-rules/audit-discipline.md`,
        });
      }

      // 3d. Verdict accepted.
      const verdict = String(fm.verdict || '').trim().toLowerCase();
      if (verdict === 'accept') tally.accepted += 1;
      else {
        findings.push({
          severity: sev,
          location: loc,
          message: `Screen review for '${surface}' (${kind}) carries verdict '${fm.verdict || '(none)'}' — the surface is not accepted.`,
          remediation:
            'Act on the review (remove / combine / demote / disclose), then re-review the new build. A revise verdict is a work item, not a blocker to record.',
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
            message: `Screen review for '${surface}' (${kind}) records build '${recorded || '(none)'}' but blueprint.yml declares release_marker '${releaseMarker}' — the accepted frame is not the frame shipping.`,
            remediation:
              'Re-run the review against captures from the current build, or update release_marker if the declaration is the stale half.',
            reference: `${PATTERN_REF} § 3`,
          });
        }
      }
    }
  }

  const currentLabel = releaseMarker ? `${tally.current}/${total}` : 'no release marker declared';
  const summary =
    `${briefRel}; design-intent=${intentLabel}; required=${requiredKinds.join('+')}; ` +
    `surfaces=${surfaces.length}; reviewed=${tally.reviewed}/${total}; ` +
    `cold-discipline=${tally.discipline}/${total}; independent=${tally.independent}/${total}; ` +
    `accepted=${tally.accepted}/${total}; current=${currentLabel}; policy=${policyLabel}`;
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
      kind: 'cold',
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
  // A conformance record: reads the direction, so cold is false by contract.
  const conformanceReview = (over = {}) => goodReview({ kind: 'conformance', cold: 'false', ...over });

  // Lay down both required reviews for both fixture surfaces.
  async function writeBothKinds(dir, over = {}) {
    for (const surface of ['today', 'settings']) {
      await writeFile(dir, `docs/evidence/screen-reviews/${surface}-12-cold.md`, goodReview({ surface, ...over }));
      await writeFile(dir, `docs/evidence/screen-reviews/${surface}-12-conformance.md`, conformanceReview({ surface, ...over }));
    }
  }

  // Fixture 1 — undeclared intent: a cold review per surface is enough, and the
  // reviewer stays SILENT about conformance (design-principles-reviewer owns the
  // "declare design_intent" WARN; two reviewers nagging is how a gate gets
  // tuned out).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('undeclared intent + cold reviews → PASS', res.status === 'PASS');
    check('undeclared intent → zero findings', res.findings.length === 0);
    check('metadata.reviewer is set', res.metadata.reviewer === NAME);
    check('metadata has durationMs', typeof res.metadata.durationMs === 'number');
    check('summary reports required=cold only', /required=cold;/.test(res.metadata.targetSummary));
    check('summary reports design-intent=undeclared', /design-intent=undeclared/.test(res.metadata.targetSummary));
    check('summary reports no release marker', /no release marker declared/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 1b — preserve owes cold only, exactly like undeclared.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('preserve + cold reviews → PASS', res.status === 'PASS');
    check('preserve requires cold only', /design-intent=preserve; required=cold;/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 1c — refit owes BOTH kinds; cold alone is not enough.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('refit with cold only → WARN', res.status === 'WARN');
    check('names the missing conformance review', res.findings.some((f) => /has no direction-conformance review recorded/.test(f.message)));
    check('conformance findings for both surfaces', res.findings.filter((f) => /no direction-conformance review/.test(f.message)).length === 2);
    check('summary reports required=cold+conformance', /required=cold\+conformance/.test(res.metadata.targetSummary));
    check('summary counts 2 of 4 reviewed', /reviewed=2\/4/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 1d — rethink with both kinds recorded → PASS.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeBothKinds(dir);
    const res = await review({ targetDir: dir });
    check('rethink + both kinds → PASS', res.status === 'PASS');
    check('summary counts 4 of 4 reviewed', /reviewed=4\/4/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 1e — a conformance record does NOT satisfy the cold requirement.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    for (const surface of ['today', 'settings']) {
      await writeFile(dir, `docs/evidence/screen-reviews/${surface}-12-conformance.md`, conformanceReview({ surface }));
    }
    const res = await review({ targetDir: dir });
    check('conformance alone → WARN', res.status === 'WARN');
    check('cold requirement still unmet', res.findings.filter((f) => /has no blind cold review recorded/.test(f.message)).length === 2);
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2 — no brief AND no declared intent → PASS. The pattern was never
  // adopted; an initiative is not failing a gate it was not offered.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const res = await review({ targetDir: dir });
    check('no brief + undeclared intent → PASS', res.status === 'PASS');
    check('no brief → points at design-principles-reviewer', /design-principles-reviewer check 10/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2b — preserve with a direction record and NO brief must NOT pass
  // silently. Without a surface roster the cold review § 3 requires under every
  // intent has nothing to be required against, and this reviewer would green a
  // build nobody judged.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\ndesign_direction: "DIRECTION.md"\n');
    await writeFile(dir, 'DIRECTION.md', '# Direction\n\nThesis.\n');
    const res = await review({ targetDir: dir });
    check('preserve + no surface roster → WARN, not a silent PASS', res.status === 'WARN');
    check('names the missing roster', res.findings.some((f) => /no surface roster exists/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2c — a preserve brief may be the `## Surfaces` section and nothing
  // else; with the cold review recorded that is a PASS.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', '# Experience brief\n\n## Surfaces\n- today\n');
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    const res = await review({ targetDir: dir });
    check('preserve + roster-only brief + cold review → PASS', res.status === 'PASS');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2e — the docs/design/ brief location is accepted (§ 2b).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\n');
    await writeFile(dir, 'docs/design/experience-brief.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('docs/design/experience-brief.md → PASS', res.status === 'PASS');
    check('summary names the docs/design brief', /docs\/design\/experience-brief\.md/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2d — an unrecognized intent reports the SAME label
  // design-principles-reviewer reports, so one file never gets two words.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: redesign\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeBothKinds(dir);
    const res = await review({ targetDir: dir });
    check('unknown intent reports unknown (value)', /design-intent=unknown \(redesign\)/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3 — a declared surface with no review → WARN by default.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    const res = await review({ targetDir: dir });
    check('missing review → WARN', res.status === 'WARN');
    check('names the unreviewed surface', res.findings.some((f) => /'settings' has no blind cold review/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3b — same tree under strict policy → BLOCKED.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\nscreen_review_policy: strict\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
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

  // Fixture 4 — cold:false on a COLD record is caught.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview({ cold: 'false' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('cold record with cold:false → WARN', res.status === 'WARN');
    check('cold finding present', res.findings.some((f) => /not marked `cold: true`/.test(f.message)));
    check('summary reports cold-discipline=1/2', /cold-discipline=1\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 4b — the inverse: cold:true on a CONFORMANCE record is caught, because
  // reading the direction record is that reviewer's job.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeBothKinds(dir);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-conformance.md', conformanceReview({ cold: 'true' }));
    const res = await review({ targetDir: dir });
    check('conformance record claiming cold:true → WARN', res.status === 'WARN');
    check('names the misunderstanding', res.findings.some((f) => /a conformance reviewer reads the direction record/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 5 — reviewer === implementer is self-attestation.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview({ reviewer: 'session-a' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('reviewer === implementer → WARN', res.status === 'WARN');
    check('self-attestation finding present', res.findings.some((f) => /self-attestation, not a review/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 6 — verdict: revise is not an accepted surface.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview({ verdict: 'revise' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
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
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-14-cold.md', goodReview({ surface: 'settings', build: '14' }));
    const res = await review({ targetDir: dir });
    check('stale build vs release marker → WARN', res.status === 'WARN');
    check('currency finding names both', res.findings.some((f) => /records build '12'/.test(f.message) && /release_marker '14'/.test(f.message)));
    check('summary reports current=1/2', /current=1\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 7b — with a marker declared, the matching review wins regardless of
  // readdir order (today-9 sorts AFTER today-12, so last-wins would pick stale).
  // Still true now that the index is keyed by surface AND kind.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\nrelease_marker: "12"\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview({ build: '12' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/today-9-cold.md', goodReview({ build: '9' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('marker-matching review beats readdir order → PASS', res.status === 'PASS');
    check('summary reports current=2/2', /current=2\/2/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 7c — two cold reviews for one surface and NO release_marker: the
  // gate cannot tell which is current, so it says so instead of picking. This
  // is the § 2c step 1 / § 9 case, where an older cold review legitimately
  // coexists with the current one.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview({ build: '12' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/today-9-cold.md', goodReview({ build: '9' }));
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('two cold reviews + no marker → WARN', res.status === 'WARN');
    check('ambiguity finding names the count', res.findings.some((f) => /has 2 'cold' reviews recorded and blueprint\.yml declares no release_marker/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 8 — missing required fields (no implementer, empty states).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    await writeFile(
      dir,
      'docs/evidence/screen-reviews/today-12-cold.md',
      `---\nsurface: today\nkind: cold\nbuild: 12\ndevice: iPhone 15 Pro\nreviewer: session-b\ncold: true\nverdict: accept\n---\n\nbody\n`,
    );
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('missing fields → WARN', res.status === 'WARN');
    const mf = res.findings.find((f) => /missing required frontmatter field/.test(f.message));
    check('names implementer and states', mf && /implementer/.test(mf.message) && /states/.test(mf.message));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 8b — a record with NO kind still matches its surface as cold AND
  // earns a missing-field finding. Both paths, not one.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', BRIEF);
    const noKind = goodReview().replace(/^kind: cold\n/m, '');
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', noKind);
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
    const res = await review({ targetDir: dir });
    check('kindless record → WARN', res.status === 'WARN');
    check(
      'kindless record reports the missing FIELD, not a missing review',
      res.findings.some((f) => /missing required frontmatter field\(s\): kind/.test(f.message)),
    );
    check('kindless record does NOT report a missing cold review', !res.findings.some((f) => /has no blind cold review/.test(f.message)));
    check('kindless record still counts as reviewed', /reviewed=2\/2/.test(res.metadata.targetSummary));
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
    await writeFile(dir, 'docs/evidence/screen-reviews/today-12-cold.md', goodReview());
    await writeFile(dir, 'docs/evidence/screen-reviews/settings-12-cold.md', goodReview({ surface: 'settings' }));
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
