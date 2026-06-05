// classify.mjs — the amendment/RFC triage classifier (ADR-0004 step 10, the UP
// channel). Maps an issue to the 4-bucket taxonomy + the RFC-vs-PR routing, and
// emits the label set the triage workflow applies. Dependency-free ESM, never
// throws; pure function + a CLI mode that reads a GitHub issue event for the
// dormant `amendment-triage.yml` workflow.
//
// Primary path: the amendment-RFC issue FORM already collects the bucket + kind
// as structured dropdowns (.github/ISSUE_TEMPLATE/amendment-rfc.yml), rendered by
// GitHub as `### <label>` + value. We read the operator's DECLARED choice — not a
// guess. Heuristic keyword inference is the fallback for free-form issues only.
//
// Reference: docs/amendment-classification-pattern.md (the taxonomy + decision
// tree), CONTRIBUTING.md (the routing).

export const BUCKETS = ['consumer-local', 'template', 'reviewer', 'methodology'];

// Pull the value under a `### <label>` heading (GitHub issue-form rendering):
// the first non-empty, non-heading line after the heading.
export function sectionValue(body, label) {
  if (typeof body !== 'string') return null;
  const lines = body.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.replace(/^#+\s*/, '').trim().toLowerCase() === label.toLowerCase());
  if (idx < 0) return null;
  for (let i = idx + 1; i < lines.length; i++) {
    const s = lines[i].trim();
    if (s === '') continue;
    if (/^#{1,6}\s/.test(lines[i])) break; // next heading → section empty
    if (s === '_No response_') return null; // GitHub's empty-field sentinel
    return s;
  }
  return null;
}

function declaredBucket(body) {
  const v = sectionValue(body, 'Fix-location bucket');
  if (!v) return null;
  const head = v.split('—')[0].split('-')[0].trim().toLowerCase(); // "template", "consumer", ...
  // The options read "consumer-local — …" / "template — …" / "reviewer — …" / "methodology — …".
  const token = v.split('—')[0].trim().toLowerCase();
  if (BUCKETS.includes(token)) return token;
  if (head === 'consumer') return 'consumer-local';
  return BUCKETS.find((b) => token.startsWith(b)) || null;
}

function declaredKind(body) {
  const v = sectionValue(body, 'Change kind (routes RFC vs plain PR)') || sectionValue(body, 'Change kind');
  if (!v) return null;
  const token = v.split('—')[0].trim().toLowerCase();
  if (token.startsWith('bug')) return 'bug-fix';
  if (token.startsWith('substantial')) return 'rfc';
  return null;
}

// Keyword heuristic — fallback ONLY when the form fields are absent (a free-form
// issue). Order matters: a reviewer lives inside template/, so check it first.
function heuristicBucket(text) {
  const t = (text || '').toLowerCase();
  if (/\breviewer\b|rubric|gate-condition|\.mjs reviewer|reviewers\//.test(t)) return 'reviewer';
  if (/methodology\.md|taxonomy|first[- ]principle|stage definition|\bdocs\//.test(t)) return 'methodology';
  if (/\bstamp(er)?\b|chrome|scaffold|\bschema\b|template\//.test(t)) return 'template';
  return 'consumer-local'; // safest default: do not auto-promote an unclear issue
}

/**
 * Classify an issue → { bucket, kind, source, labels, rationale }.
 *   source: 'declared' (from the form) | 'heuristic' (keyword inference)
 *   kind:   'rfc' (substantial) | 'bug-fix' | null (unknown)
 * Labels are the set the workflow applies; never throws.
 */
export function classifyIssue({ title = '', body = '' } = {}) {
  let bucket = declaredBucket(body);
  let source = 'declared';
  if (!bucket) { bucket = heuristicBucket(`${title}\n${body}`); source = 'heuristic'; }

  const kind = declaredKind(body); // null when free-form

  const labels = ['amendment', `bucket:${bucket}`];
  if (kind) labels.push(`kind:${kind}`, kind === 'rfc' ? 'needs-rfc' : 'pr-ok');
  if (bucket === 'consumer-local') labels.push('stays-in-consumer');
  if (source === 'heuristic') labels.push('triage:needs-human'); // a guess — flag for review

  const rationale =
    source === 'declared'
      ? `bucket declared in the issue form (${bucket})`
      : `bucket inferred from keywords (${bucket}) — no form fields; needs a human confirm`;

  return { bucket, kind, source, labels, rationale };
}

// ── CLI: read a GitHub issue event JSON and print labels (for the workflow) ───
// Usage (in amendment-triage.yml): node classify.mjs "$GITHUB_EVENT_PATH"
//   prints one label per line on stdout; the workflow applies them.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && !process.argv.includes('--self-test')) {
  const eventPath = process.argv[2];
  if (eventPath) {
    import('node:fs').then(({ readFileSync }) => {
      let issue = {};
      try { issue = JSON.parse(readFileSync(eventPath, 'utf8')).issue || {}; } catch { /* no event */ }
      const { labels } = classifyIssue({ title: issue.title || '', body: issue.body || '' });
      console.log(labels.join('\n'));
    });
  }
}

// ── Self-test (node classify.mjs --self-test) ────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--self-test')) {
  const assert = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); } };

  const form = (bucket, kind) =>
    `### Fix-location bucket\n\n${bucket}\n\n### Change kind (routes RFC vs plain PR)\n\n${kind}\n\n### Problem\n\nx\n`;

  // Declared path — each bucket.
  let r = classifyIssue({ title: '[RFC] x', body: form('template — stamper / chrome / schema', 'substantial — new reviewer/stage') });
  assert(r.bucket === 'template' && r.kind === 'rfc' && r.source === 'declared', 'declared template + substantial');
  assert(r.labels.includes('bucket:template') && r.labels.includes('needs-rfc') && !r.labels.includes('triage:needs-human'), 'template rfc labels');

  r = classifyIssue({ body: form('reviewer — a reviewer rubric', 'bug-fix — restores behavior') });
  assert(r.bucket === 'reviewer' && r.kind === 'bug-fix' && r.labels.includes('pr-ok'), 'declared reviewer + bug-fix → pr-ok');

  r = classifyIssue({ body: form('consumer-local — specific to one initiative', 'bug-fix — x') });
  assert(r.bucket === 'consumer-local' && r.labels.includes('stays-in-consumer'), 'consumer-local → stays-in-consumer');

  r = classifyIssue({ body: form('methodology — METHODOLOGY.md / docs', 'substantial — taxonomy edit') });
  assert(r.bucket === 'methodology' && r.kind === 'rfc', 'declared methodology + substantial');

  // Heuristic fallback — free-form, no form fields.
  r = classifyIssue({ title: 'the stamper chrome scaffold is wrong', body: 'template/ files drift' });
  assert(r.bucket === 'template' && r.source === 'heuristic' && r.labels.includes('triage:needs-human'), 'heuristic → template + needs-human');
  r = classifyIssue({ title: 'a reviewer gate misfires', body: 'the .mjs reviewer rubric' });
  assert(r.bucket === 'reviewer' && r.source === 'heuristic', 'heuristic reviewer (checked before template)');
  r = classifyIssue({ title: 'METHODOLOGY.md taxonomy gap', body: 'the stage definition' });
  assert(r.bucket === 'methodology' && r.source === 'heuristic', 'heuristic methodology');
  r = classifyIssue({ title: 'something vague', body: 'no keywords here' });
  assert(r.bucket === 'consumer-local' && r.source === 'heuristic', 'heuristic default → consumer-local (no auto-promote)');

  // Robustness.
  assert(classifyIssue({}).bucket === 'consumer-local', 'empty issue → consumer-local, no throw');
  assert(classifyIssue({ body: 123 }).labels.includes('amendment'), 'non-string body → never throws');
  assert(sectionValue('### Fix-location bucket\n\n_No response_\n', 'Fix-location bucket') === null, 'empty-field sentinel → null');
  r = classifyIssue({ body: form('template — x', 'substantial — y') });
  assert(r.kind === 'rfc', 'kind parsed with the long label too');

  console.log('classify self-test: PASS (13 assertions)');
}
