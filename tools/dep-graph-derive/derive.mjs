#!/usr/bin/env node
/**
 * dep-graph-derive — emit a nodes/edges graph from ADR frontmatter.
 *
 * The edges already exist on disk: every ADR's frontmatter carries
 * supersedes / extends / informs / grounded_by / ratified_by. This pass walks
 * decisions/*.md, parses that frontmatter, and writes a small graph JSON the
 * portal renders as a force-graph island.
 *
 * Deliberately NOT wired to the archaeology substrate — those ingesters are
 * still skeletons, so the frontmatter on disk is the real edge store for v0.
 * When git.py/hive.py/adr.py land, this can read their refs[] instead; the
 * output shape stays the same.
 *
 * Dangling references (an `informs: ADR-0003` with no matching file) are NOT
 * dropped — they render as `planned`/`external` nodes so the graph shows the
 * holes in the why-chain rather than hiding them.
 *
 * Two edge stores, because consumers diverge:
 *   - structured frontmatter (supersedes/extends/informs/...) — blueprint's style
 *   - prose citations (`per ADR-0009`, `supersedes ADR-0011`) in the body —
 *     bc-subscriptions' style, where the why-chain lives in the text
 * The derive reads both so it generalizes across consumers regardless of which
 * convention an initiative actually follows.
 *
 * Usage: node tools/dep-graph-derive/derive.mjs [repoRoot] [--out PATH] [--decisions DIR]
 * Decisions dir: auto-detected (decisions/ then docs/decisions/) unless --decisions.
 * Writes: apps/portal/src/data/dep-graph.json (override with --out; "-" = stdout).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
// First bare arg (not a flag value) is repoRoot.
const flagValues = new Set(['--out', '--decisions'].map((f) => flag(f)).filter(Boolean));
const positional = argv.find((a) => !a.startsWith('--') && !flagValues.has(a));

const REPO_ROOT = resolve(positional || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const DECISIONS_DIR = resolve(REPO_ROOT, flag('--decisions') ||
  (existsSync(resolve(REPO_ROOT, 'decisions')) ? 'decisions' : 'docs/decisions'));
const OUT = flag('--out') === '-' ? '-' : resolve(REPO_ROOT, flag('--out') || 'apps/portal/src/data/dep-graph.json');

// ── minimal frontmatter parser ───────────────────────────────────────────────
// Handles the subset ADRs actually use: `key: scalar` and `key:` + `- item`
// list blocks. No YAML dependency — keep this pass zero-install.
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  let curKey = null;
  for (const raw of m[1].split('\n')) {
    if (!raw.trim()) continue;
    const listItem = raw.match(/^\s*-\s+(.*)$/);
    if (listItem && curKey) {
      (out[curKey] ||= []).push(unquote(listItem[1]));
      continue;
    }
    const kv = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) {
      curKey = kv[1];
      const val = kv[2].trim();
      out[curKey] = val === '' ? [] : unquote(val); // empty scalar -> list block follows
    }
  }
  return out;
}

const unquote = (s) => s.replace(/^["']|["']$/g, '').trim();

// ── reference normalization ──────────────────────────────────────────────────
// Targets in frontmatter are messy: "ADR-0003 cost/effort dial", a file path,
// "none", "pending — first non-Nino team". Extract a stable target id + a kind.
const NULLISH = /^(none|n\/a|pending\b|tbd)/i;

function resolveTarget(rawValue, knownIds) {
  const v = String(rawValue).trim();
  if (!v || NULLISH.test(v)) return null;

  // ADR-NNNN token anywhere in the string
  const adr = v.match(/ADR-?(\d+)/i);
  if (adr) {
    const num = adr[1];
    const id = matchKnown(num, knownIds) || `ADR-${num}`;
    return { id, label: v, kind: matchKnown(num, knownIds) ? 'adr' : 'planned' };
  }

  // file path -> basename slug. A path that escapes the decisions dir (`..`)
  // points at ANOTHER repo's file — never collapse it onto a local node even
  // when basenames collide (the blueprint-redesign prescription is not ours).
  if (v.includes('/') || v.endsWith('.md')) {
    const escapes = v.includes('..');
    const slug = basename(v).replace(/\.md$/, '');
    const local = escapes ? null : matchKnown(slug, knownIds);
    const id = local || (escapes ? `ext:${slug}` : slug);
    const kind = local ? 'adr' : /research/i.test(v) ? 'research' : 'external';
    return { id, label: basename(v), kind };
  }

  // bare prose reference (e.g. "Stage 1 research ...") — external node
  return { id: v.slice(0, 48), label: v, kind: 'external' };
}

// Match a target token against known ADR node ids by numeric prefix or slug.
function matchKnown(token, knownIds) {
  const t = String(token).toLowerCase();
  for (const id of knownIds) {
    const idl = id.toLowerCase();
    if (idl === t) return id;
    const prefix = id.match(/^(\d+)/);
    if (prefix && String(Number(prefix[1])) === String(Number(t))) return id;
  }
  return null;
}

const EDGE_FIELDS = [
  ['supersedes', 'supersedes'],
  ['superseded_by', 'superseded_by'],
  ['extends', 'extends'],
  ['informs', 'informs'],
  ['grounded_by', 'grounded_by'],
  ['ratified_by', 'ratified_by'],
];

// ── walk decisions/ ──────────────────────────────────────────────────────────
function build() {
  if (!existsSync(DECISIONS_DIR)) {
    return { generated_at: today(), source: 'decisions/ (absent)', nodes: [], edges: [] };
  }
  const files = readdirSync(DECISIONS_DIR).filter((f) => f.endsWith('.md')).sort();

  // First pass: register canonical ADR nodes by filename slug.
  const nodes = new Map();
  const fmByFile = {};
  const bodyByFile = {};
  for (const f of files) {
    const text = readFileSync(resolve(DECISIONS_DIR, f), 'utf8');
    const fm = parseFrontmatter(text);
    fmByFile[f] = fm;
    bodyByFile[f] = text.replace(/^---\n[\s\S]*?\n---/, ''); // body after frontmatter
    const id = f.replace(/\.md$/, '');
    const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
    nodes.set(id, {
      id,
      label: heading ? heading.trim() : id,
      kind: 'adr',
      stage: fm.stage !== undefined ? Number(fm.stage) : null,
      status: fm.status || null,
      canonical: fm.canonical === 'true' || fm.canonical === true,
      // repo-relative path so the UI can link a node to its decision file.
      path: relPath(resolve(DECISIONS_DIR, f)),
    });
  }
  const knownIds = [...nodes.keys()];
  const edgeSeen = new Set(); // dedupe by source|target (kind-agnostic)
  const edges = [];
  const addEdge = (source, target, kind) => {
    if (source === target) return;
    const key = `${source}|${target}`;
    if (edgeSeen.has(key)) return;
    edgeSeen.add(key);
    edges.push({ source, target, kind });
  };

  // Second pass: structured frontmatter edges. Placeholder nodes for danglers.
  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    const fm = fmByFile[f];
    for (const [field, edgeKind] of EDGE_FIELDS) {
      if (!(field in fm)) continue;
      const values = Array.isArray(fm[field]) ? fm[field] : [fm[field]];
      for (const v of values) {
        const tgt = resolveTarget(v, knownIds);
        if (!tgt) continue;
        if (!nodes.has(tgt.id)) {
          nodes.set(tgt.id, { id: tgt.id, label: tgt.label, kind: tgt.kind, stage: null, status: null });
        }
        addEdge(id, tgt.id, edgeKind);
      }
    }
  }

  // Third pass: prose citation edges (`per ADR-0009`). Body-text ADR-NNNN
  // tokens become 'cites' edges — the why-chain consumers keep in prose, not
  // frontmatter. Frontmatter edges already added win (dedupe is kind-agnostic).
  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    const cited = new Set();
    for (const m of bodyByFile[f].matchAll(/ADR-?(\d{3,4})/gi)) {
      const target = matchKnown(m[1], knownIds);
      if (target) cited.add(target);
    }
    for (const target of cited) addEdge(id, target, 'cites');
  }

  return {
    generated_at: today(),
    source: `${basename(DECISIONS_DIR)}/*.md — frontmatter edges + prose ADR-NNNN citations`,
    node_count: nodes.size,
    edge_count: edges.length,
    nodes: [...nodes.values()],
    edges,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const relPath = (abs) => relative(REPO_ROOT, abs);

const graph = build();
const json = JSON.stringify(graph, null, 2) + '\n';
if (OUT === '-') {
  process.stdout.write(json);
} else {
  writeFileSync(OUT, json);
  console.error(`dep-graph-derive: ${graph.node_count} nodes, ${graph.edge_count} edges -> ${OUT}`);
}
