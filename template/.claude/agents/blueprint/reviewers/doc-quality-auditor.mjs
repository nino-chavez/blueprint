/**
 * doc-quality-auditor.mjs — executable pair for doc-quality-auditor.md.
 *
 * Wave 99: the mechanical half of check 5 ("methodology statement for derived
 * data"). Check 5 has been ratified methodology carrying CRITICAL severity
 * since the reviewer was authored; ADR-0002 says the .mjs implements the .md,
 * and this half was never built. Until now the highest-stakes claim class in a
 * stakeholder document — a derived figure — was graded only by judgment, by the
 * same class of system that produced it.
 *
 * The failure it encodes against is documented in-tree
 * (docs/case-studies/case-study-pp-cx.md:91) — the origin initiative shipped an
 * external "88%" that was actually 92%, and a percentage breakdown over an
 * admittedly-incomplete denominator ("if 84.7% of cases are uncategorized, how
 * do you know 59% are invoice inquiries?"). Both were caught by an external AI
 * review; neither by a gate.
 *
 * ADR-0002 reviewer contract:
 *   export default async function review({ targetDir, blueprintYml, methodologyHome })
 *     -> { status: 'PASS'|'WARN'|'BLOCKED', findings: [...], metadata: {...} }
 *
 * TWO CHECKS — the mechanical subset. Checks 1-4 of the .md (so-what placement,
 * mental math, logic gaps, scannable format) are judgment and stay agent-only.
 *
 *   1. derivation-methodology — BLOCK. A deliverable with >=2 percentage figures
 *      AND a line where a percentage sits next to an incompleteness marker
 *      (uncategorized / unlabeled / unclassified / unverified / not categorized)
 *      AND no derivation declaration anywhere in the doc. This is check 5's
 *      described shape, mechanized.
 *   2. figure-attribution — WARN. A block containing a risky-shaped figure
 *      (N%, "N of M", $N, Nx) with no attribution in the same block: no link,
 *      no named source, no footnote, no illustrative/hypothetical marker.
 *
 * THE DERIVATION PREDICATE IS STRUCTURAL, NOT LEXICAL — the load-bearing design
 * decision. A lexical predicate (any occurrence of "methodology"/"derived")
 * fails on the one real case: case-study-pp-cx.md:93 reads "The methodology
 * answer (...) resolved the logic gap", so ambient prose would satisfy it and
 * C2 would pass. A declaration must be something the author wrote deliberately:
 *   <!-- derivation: <source> — <how it was computed> -->   (adjacent comment)
 *   ## Methodology   /   **Methodology:**                    (same document)
 *
 * HONEST SCOPE:
 *   - Deliverables only: docs/content/**.md, docs/decision-memo.md (+ any
 *     decision-memo*.md in docs/ or root), and the brownfield/midstream root
 *     trio's markdown members (01-diagnose.md, 03-design-brief.md). NOT scanned:
 *     case-studies, decisions/ADRs, _archive, WAVE-LOG, METHODOLOGY-AMENDMENTS,
 *     feedback, productization/self-application docs, date-prefixed files.
 *   - 02-prescription.yml is deliberately NOT scanned — it is YAML, where line
 *     blocks and fences do not carry the same meaning. Figures there are
 *     agent-verified.
 *   - The deliverable set is the UNION of paths that exist, not a variant-gated
 *     selection. A misdeclared `variant:` would silently narrow the scan set —
 *     the exact class doctor's stage-model check exists to catch. Every path in
 *     the union is a deliverable in some variant, so the union cannot over-reach.
 *   - Bare `N/M` ratios are NOT treated as figures: the shape collides with
 *     dates and versions, and "N of M" covers the readable form.
 *   - `~` (approximately) does NOT exempt a figure from attribution. An
 *     approximation is still a claim about the world and still needs a source.
 *     `illustrative` / `hypothetical` / `example` DO exempt — they declare the
 *     number is not a claim.
 *   - Under-matching by design. Novel figure phrasings won't match; the judgment
 *     variant ("is this number actually right?") is agent-verified territory.
 *     A looser matcher would manufacture noise into a BLOCK-severity gate.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const NAME = 'doc-quality-auditor';
const MAX_FINDINGS = 40;

// Deliverable surfaces, per the .md's "docs/content/ (or the equivalent
// location per the variant)". Union of what exists — see HONEST SCOPE.
const DELIVERABLE_DIRS = ['docs/content'];
const DELIVERABLE_FILES = ['01-diagnose.md', '03-design-brief.md', 'docs/decision-memo.md'];
const MEMO_DIRS = ['docs', '.'];
const DATE_PREFIXED = /^\d{4}-\d{2}-\d{2}-/;

// Declared inputs for ADR-0009 fingerprint freshness: a recorded PASS is reused
// only while these files are unchanged. Must mirror collectDeliverables() — a
// glob narrower than what the review actually reads would let an edited
// deliverable ride a stale PASS. Zero matches → fingerprintInputs returns null
// → the reviewer reruns every advance (the fail-safe, not a false-green).
export const inputs = ['docs/content/**', 'docs/decision-memo.md', '01-diagnose.md', '03-design-brief.md'];

export const jurisdiction = {
  description: 'derived-figure attribution + derivation methodology in shipping deliverables',
  roots: DELIVERABLE_DIRS,
  rootFiles: DELIVERABLE_FILES,
  extensions: ['.md'],
  excludes: ['_archive', 'case-studies', 'decisions', 'productization', 'feedback', 'node_modules', '.git'],
};

const read = (p) => fs.readFile(p, 'utf8').then((s) => s, () => null);

// Blank out fenced blocks while PRESERVING line count — example output
// legitimately contains figures, and findings carry line numbers.
function blankFences(src) {
  const lines = src.split('\n');
  let inFence = false;
  return lines
    .map((l) => {
      if (/^\s*```/.test(l)) { inFence = !inFence; return ''; }
      return inFence ? '' : l;
    })
    .join('\n');
}

// ── figure shapes ────────────────────────────────────────────────────────────
// `Nx` multipliers are deliberately NOT a figure shape. Fleet calibration
// (film-room, wave 99) found every instance was domain vocabulary — "straight
// 4x cuts" in a video-editing spec — not a derived claim. It was the weakest of
// the four shapes and contributed only noise; a multiplier that IS a claim
// ("3x faster than the baseline") reads as a percentage or a count elsewhere.
const PERCENT = /\b\d{1,3}(?:\.\d+)?%/g;
const N_OF_M = /\b\d[\d,]*\s+of\s+\d[\d,]*\b/gi;
const CURRENCY = /\$\d[\d,]*(?:\.\d+)?\s*[KMB]?\b/gi;
const FIGURE_PATTERNS = [PERCENT, N_OF_M, CURRENCY];

function figuresIn(text) {
  const out = [];
  for (const re of FIGURE_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) out.push(m[0]);
  }
  return out;
}

// ── check-1 predicates ───────────────────────────────────────────────────────
const INCOMPLETENESS = /\b(?:uncategoriz(?:ed|able)|uncategorised|unlabell?ed|unclassified|unverified|not\s+categoriz(?:ed)?|not\s+classified|no\s+category)\b/i;

// Structural, never lexical — see the header note.
const DERIVATION_DECL = [
  /<!--\s*derivation\s*:/i,
  /^#{1,6}\s*methodolog(?:y|ies)\b/im,
  /^\s*\*\*methodolog(?:y|ies)\s*:?\*\*/im,
];
const hasDerivationDecl = (body) => DERIVATION_DECL.some((re) => re.test(body));

// ── check-2 predicates ───────────────────────────────────────────────────────
// Every entry must be a phrase an author writes ON PURPOSE to attribute. Bare
// discourse words are excluded even when they read like attribution: `per`
// ("42% per quarter", "cost per seat", and \b even matches inside "per-user")
// and `from the` ("42% from the baseline") appear in ordinary analytical prose
// and would exempt almost any block. Caught by an isolation probe the fixtures
// missed — every passing fixture also carried a real link, so the weak branches
// were never exercised alone.
// Fleet calibration (film-room + docracles, wave 99) added the last two: a bare
// arXiv/DOI identifier and a backtick'd internal artifact path are BOTH real
// attribution forms Blueprint research docs use constantly, and both were
// false-positiving. Real examples caught: "audio alone locates 89% of
// highlights — arXiv:2501.16100" and "~70% of auto-clips need manual cleanup
// (`analogous-creator-clipping.md`)".
const ATTRIBUTION = [
  /\[[^\]]*\]\([^)]+\)/,             // markdown link
  /https?:\/\//,                      // bare URL
  /\[\^[^\]]+\]/,                     // footnote reference
  /\b(?:sources?|according to|cited|citing|derived from)\b/i,
  /\(\s*(?:19|20)\d{2}\s*\)/,         // (2024) — a dated source
  /\b(?:arxiv:\s*\d{4}\.\d{4,5}|doi:\s*10\.\d{4,9}\/|\b10\.\d{4,9}\/\S+)/i,
  /`[^`\s]*\.(?:md|yml|yaml|json|ts|tsx|js|mjs|py|sql)`/,  // internal artifact ref
];
// These declare the number is NOT a claim about the world, so attribution is
// not owed. Deliberately excludes: ~ / approx / estimate (still world-claims);
// `for example` / `e.g.` (discourse markers, not declarations about the figure);
// `sample` ("sample size of 400" is a claim, not a disclaimer).
// Fleet calibration (film-room, wave 99) added the explicit-disclaimer forms:
// "**Pricing (proposal, NOT validated):** $1,500–1,800/yr" is a STRONGER
// disclosure than `illustrative`, and was false-positiving.
// `proposal` / `proposed` were considered and REJECTED as too ambient — "the
// proposed plan lifts conversion 20%" is a claim, not a disclaimer. Only the
// explicit not-yet-established forms qualify.
const NOT_A_CLAIM = /\b(?:illustrative|hypothetical|placeholder|mock|not validated|unvalidated|not verified|TBD)\b/i;

const hasAttribution = (block) => ATTRIBUTION.some((re) => re.test(block)) || NOT_A_CLAIM.test(block);

// ── deliverable collection ───────────────────────────────────────────────────
async function walkMd(dir, acc = []) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkMd(full, acc);
    else if (e.name.endsWith('.md') && !DATE_PREFIXED.test(e.name)) acc.push(full);
  }
  return acc;
}

async function collectDeliverables(targetDir) {
  const found = new Set();
  for (const d of DELIVERABLE_DIRS) {
    for (const f of await walkMd(path.join(targetDir, d))) found.add(f);
  }
  for (const f of DELIVERABLE_FILES) {
    const p = path.join(targetDir, f);
    if ((await read(p)) !== null) found.add(p);
  }
  // decision-memo*.md by name-match, mirroring the research stage model's gate.
  for (const d of MEMO_DIRS) {
    let entries;
    try { entries = await fs.readdir(path.join(targetDir, d)); } catch { continue; }
    for (const n of entries) {
      if (n.endsWith('.md') && /decision-memo/i.test(n) && !DATE_PREFIXED.test(n)) {
        found.add(path.join(targetDir, d, n));
      }
    }
  }
  return [...found].sort();
}

// Contiguous non-blank line runs — a paragraph, a table, a list.
function blocks(lines) {
  const out = [];
  let cur = null;
  lines.forEach((text, i) => {
    if (text.trim() === '') { if (cur) { out.push(cur); cur = null; } return; }
    if (!cur) cur = { start: i + 1, lines: [] };
    cur.lines.push(text);
  });
  if (cur) out.push(cur);
  return out;
}

// ── the review ───────────────────────────────────────────────────────────────
export default async function review({ targetDir }) {
  const startedAt = Date.now();
  const findings = [];
  const counters = { docs: 0, figures: 0, blocked: 0, warned: 0 };

  const docs = await collectDeliverables(targetDir);
  counters.docs = docs.length;

  if (!docs.length) {
    return {
      status: 'PASS',
      findings: [{
        severity: 'INFO', check: 'scope',
        location: targetDir,
        message: 'No deliverable documents found (docs/content/, decision-memo, 01-diagnose.md, 03-design-brief.md) — mechanical checks skipped. Checks 1-4 of the spec (so-what, mental math, logic gaps, scannable) are judgment and remain agent-run.',
      }],
      metadata: { reviewer: NAME, targetSummary: 'docs=0, figures=0 (no deliverable surface)', durationMs: Date.now() - startedAt },
    };
  }

  const push = (severity, check, file, line, message, remediation) => {
    if (severity === 'BLOCK') counters.blocked++; else if (severity === 'WARN') counters.warned++;
    if (findings.length >= MAX_FINDINGS) return;
    findings.push({
      severity, check, file, line,
      location: `${file}:${line}`,
      message,
      remediation,
      fix: remediation,
    });
  };

  for (const docPath of docs) {
    const raw = await read(docPath);
    if (raw === null) continue;
    const body = blankFences(raw);
    const rel = path.relative(targetDir, docPath);
    const lines = body.split('\n');

    // ── check 1: derivation-methodology (BLOCK) ──
    const pctCount = (body.match(PERCENT) || []).length;
    if (pctCount >= 2 && !hasDerivationDecl(body)) {
      const hit = lines.findIndex((l) => INCOMPLETENESS.test(l) && /\d{1,3}(?:\.\d+)?%/.test(l));
      if (hit !== -1) {
        push('BLOCK', 'derivation-methodology', rel, hit + 1,
          `Percentage breakdown (${pctCount} figures) over an admittedly-incomplete set, with no derivation declared — "${lines[hit].trim().slice(0, 120)}". A skeptical reader asks: if part of the set is unclassified, how is the breakdown known?`,
          'Add a `<!-- derivation: <source> — <how computed> -->` comment next to the figures, or a `## Methodology` section stating how the breakdown was produced. Prose that merely mentions methodology does not satisfy this — the declaration must be deliberate.');
      }
    }

    // ── check 2: figure-attribution (WARN), one finding per block ──
    for (const b of blocks(lines)) {
      const text = b.lines.join('\n');
      const figs = figuresIn(text);
      if (!figs.length) continue;
      counters.figures += figs.length;
      if (hasAttribution(text)) continue;
      const sample = figs.slice(0, 3).join(', ');
      push('WARN', 'figure-attribution', rel, b.start,
        `${figs.length} unattributed figure${figs.length > 1 ? 's' : ''} (${sample}${figs.length > 3 ? ', …' : ''}) — no source, link, footnote, or illustrative marker in this block.`,
        'Name the source inline, link it, add a footnote, or mark the number `illustrative` if it is not a claim about the world. "~" and "approx" do not exempt — an approximation is still a claim.');
    }
  }

  if (findings.length >= MAX_FINDINGS) {
    findings.push({
      severity: 'INFO', check: 'scope', location: targetDir,
      message: `Finding cap (${MAX_FINDINGS}) reached — ${counters.blocked} block(s) and ${counters.warned} warn(s) detected in total. Fix the reported set and re-run.`,
    });
  }

  const status = counters.blocked > 0 ? 'BLOCKED' : counters.warned > 0 ? 'WARN' : 'PASS';
  const summary = `docs=${counters.docs}, figures=${counters.figures}, blocks=${counters.blocked}, warns=${counters.warned}`;
  return { status, findings, metadata: { reviewer: NAME, targetSummary: summary, durationMs: Date.now() - startedAt } };
}

// ── Self-test (node doc-quality-auditor.mjs --self-test) ─────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--self-test')) {
  const os = await import('node:os');
  let n = 0;
  const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); } n++; };

  const mk = async () => fs.mkdtemp(path.join(os.tmpdir(), 'dqa-'));
  const w = (root, rel, s) => fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true }).then(() => fs.writeFile(path.join(root, rel), s));

  // C2 — reconstructed from the real pp-cx numbers (case-study-pp-cx.md:91).
  const C2 = [
    '# Billing case baseline',
    '',
    '| Category | Share |',
    '|---|---|',
    '| Invoice inquiries | 59% |',
    '| Payment failures | 21% |',
    '',
    'Note that 84.7% of cases are uncategorized in the source system.',
    '',
  ].join('\n');

  // 1. C2 with no derivation declaration → BLOCKED.
  let t = await mk();
  await w(t, 'docs/content/baseline.md', C2);
  let r = await review({ targetDir: t });
  ok(r.status === 'BLOCKED', `C2 without derivation → BLOCKED (got ${r.status})`);
  ok(r.findings.some((f) => f.check === 'derivation-methodology'), 'C2 raises derivation-methodology');

  // 2. THE LEXICAL-PREDICATE REGRESSION — ambient prose mentioning methodology
  //    must NOT satisfy the declaration. This is the pp-cx:93 sentence verbatim
  //    in shape ("The methodology answer ... resolved the logic gap").
  await w(t, 'docs/content/baseline.md', `${C2}\nThe methodology answer resolved the logic gap.\n`);
  r = await review({ targetDir: t });
  ok(r.status === 'BLOCKED', `ambient "methodology" prose still BLOCKS (got ${r.status})`);

  // 3. A deliberate declaration clears it — comment form and heading form.
  await w(t, 'docs/content/baseline.md', `<!-- derivation: SFDC export 2026-03 — subjects classified by Claude, not reason codes -->\n${C2}`);
  r = await review({ targetDir: t });
  ok(!r.findings.some((f) => f.check === 'derivation-methodology'), 'derivation comment clears check 1');
  await w(t, 'docs/content/baseline.md', `${C2}\n## Methodology\n\nSubjects were classified from the email export.\n`);
  r = await review({ targetDir: t });
  ok(!r.findings.some((f) => f.check === 'derivation-methodology'), 'Methodology heading clears check 1');

  // 4. figure-attribution — unattributed WARNs, attributed and illustrative do not.
  let t2 = await mk();
  await w(t2, 'docs/content/memo.md', 'Adoption reached 42% this quarter.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'WARN' && r.findings.some((f) => f.check === 'figure-attribution'), `unattributed figure → WARN (got ${r.status})`);

  await w(t2, 'docs/content/memo.md', 'Adoption reached 42% this quarter, per the [Q3 board deck](https://example.com/q3).\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'PASS', `linked source → PASS (got ${r.status}: ${JSON.stringify(r.findings[0] || null)})`);

  await w(t2, 'docs/content/memo.md', 'An illustrative target: adoption reaching 42% this quarter.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'PASS', `illustrative marker → PASS (got ${r.status})`);

  // 5. "~" does NOT exempt — an approximation is still a world-claim.
  await w(t2, 'docs/content/memo.md', 'Roughly ~90% of the docs are reference mode.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'WARN', `"~90%" still warns — approximation is not attribution (got ${r.status})`);

  // 6. Fenced example output must not match, and line numbers stay true.
  let t3 = await mk();
  await w(t3, 'docs/content/guide.md', 'Sourced from the [ledger](https://example.com/l).\n\n```\nexample output: 99% coverage, 3 of 4 gates\n```\n');
  r = await review({ targetDir: t3 });
  ok(r.status === 'PASS', `fenced figures ignored (got ${r.status}: ${JSON.stringify(r.findings[0] || null)})`);

  // 7. Date-prefixed files are out of jurisdiction (point-in-time records).
  await w(t3, 'docs/content/2026-06-11-launch-posts.md', 'We shipped 15 of 18 reviewers.\n');
  r = await review({ targetDir: t3 });
  ok(r.status === 'PASS', `date-prefixed deliverable skipped (got ${r.status})`);

  // 8. Consumer repo with no deliverable surface → PASS + INFO, never throws.
  const t4 = await mk();
  await fs.writeFile(path.join(t4, 'README.md'), 'We hit 99% of 400 targets.\n');
  r = await review({ targetDir: t4 });
  ok(r.status === 'PASS' && r.findings.some((f) => f.check === 'scope'), 'no deliverable surface → PASS + INFO');
  ok(/docs=0/.test(r.metadata.targetSummary), 'summary reports files scanned');

  // 9. REGRESSION — weak attribution branches must not exempt on their own.
  //    Every other passing fixture also carries a real link, so these branches
  //    are only exercised in isolation here. A bare discourse word satisfying
  //    "has a source" is the defect this pins.
  for (const weak of [
    'Adoption reached 42% per quarter.',
    'Revenue grew 18% from the baseline.',
    'Churn hit 12%, e.g. in the enterprise tier.',
    'Coverage is 61% — for example across the top accounts.',
    'A sample of 400 users converted at 9%.',
  ]) {
    await w(t2, 'docs/content/memo.md', `${weak}\n`);
    r = await review({ targetDir: t2 });
    ok(r.status === 'WARN', `weak-attribution isolation: "${weak}" must WARN (got ${r.status})`);
  }
  // …while a real attribution phrase still exempts, with no link present.
  await w(t2, 'docs/content/memo.md', 'Adoption reached 42%, according to the Q3 board deck.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'PASS', `"according to" alone exempts (got ${r.status})`);

  // 9b. FLEET-CALIBRATION REGRESSION (film-room + docracles, wave 99). Both
  //     shapes are attribution forms Blueprint research docs use constantly,
  //     and both false-positived on the first real consumer run. Strings are
  //     reduced from the genuine lines.
  for (const cited of [
    'Audio alone locates 89% of highlights — arXiv:2501.16100.',
    'Roughly 70% of auto-clips need manual cleanup (`analogous-creator-clipping.md`).',
    'Coverage sits at 31% (doi: 10.1145/3372297).',
    '**Pricing (proposal, NOT validated):** $1,500-1,800/yr platform.',
  ]) {
    await w(t2, 'docs/content/memo.md', `${cited}\n`);
    r = await review({ targetDir: t2 });
    ok(r.status === 'PASS', `fleet-calibrated attribution exempts: "${cited}" (got ${r.status})`);
  }
  // …but `proposed` alone stays a claim — rejected as too ambient.
  await w(t2, 'docs/content/memo.md', 'The proposed plan lifts conversion 20%.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'WARN', `"proposed" alone does not exempt (got ${r.status})`);
  // Nx multipliers are not a figure shape — domain vocabulary, not a claim.
  await w(t2, 'docs/content/memo.md', 'Drag-order manifests plus straight 4x cuts.\n');
  r = await review({ targetDir: t2 });
  ok(r.status === 'PASS', `"4x cuts" is not a figure (got ${r.status})`);

  // 10. Root-trio and memo deliverables are reached.
  const t5 = await mk();
  await fs.writeFile(path.join(t5, '01-diagnose.md'), 'Conversion sits at 12%.\n');
  r = await review({ targetDir: t5 });
  ok(r.status === 'WARN' && r.findings[0].file === '01-diagnose.md', 'brownfield root trio scanned');
  await fs.rm(path.join(t5, '01-diagnose.md'));
  await fs.mkdir(path.join(t5, 'docs'), { recursive: true });
  await fs.writeFile(path.join(t5, 'docs', 'decision-memo.md'), 'Option A costs $40,000.\n');
  r = await review({ targetDir: t5 });
  ok(r.status === 'WARN' && r.findings[0].file === path.join('docs', 'decision-memo.md'), 'research decision-memo scanned');

  for (const d of [t, t2, t3, t4, t5]) await fs.rm(d, { recursive: true, force: true });
  console.log(`doc-quality-auditor self-test: PASS (${n} assertions)`);
}
