#!/usr/bin/env node
// Optional plan validation. No execution, provider calls, or approval decisions.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

function reject(message) { throw new Error(message); }
function shape(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some((key) => !keys.includes(key))
      || keys.some((key) => !Object.hasOwn(value, key))) {
    reject(`${label}: expected exactly ${keys.join(', ')}`);
  }
}
function strings(value, label, nonempty = false) {
  if (!Array.isArray(value) || (nonempty && !value.length)
      || value.some((item) => typeof item !== 'string' || !item.trim() || item !== item.trim())
      || new Set(value).size !== value.length) {
    reject(`${label}: expected ${nonempty ? 'a nonempty array' : 'an array'} of unique, nonblank strings`);
  }
}
function id(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    reject(`${label}: invalid ID (use letters, digits, dot, underscore, hyphen)`);
  }
}
function repoPath(value, root, label, fileOnly = false) {
  if (typeof value !== 'string' || !value || value !== value.trim()
      || /[\\*?\[\]{}\x00-\x1f\x7f]/.test(value) || /^[A-Za-z]:/.test(value)
      || value.startsWith('/') || (fileOnly && value.endsWith('/'))) {
    reject(`${label}: expected a literal repository-relative ${fileOnly ? 'file' : 'path'}; no globs`);
  }
  const parts = value.replace(/\/$/, '').split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    reject(`${label}: empty, dot, and parent path segments are not allowed`);
  }
  // Alias resolution is outside this lexical checker. Refuse known symlink
  // ancestors instead of silently blessing a scope that escapes its spelling.
  let resolved = root;
  for (let i = 0; i < parts.length; i++) {
    resolved = path.join(resolved, parts[i]);
    let info;
    try { info = lstatSync(resolved); }
    catch (error) { if (error.code === 'ENOENT') break; throw error; }
    if (info.isSymbolicLink()) reject(`${label}: symlink scopes are unsupported (${value})`);
    if (i < parts.length - 1 && !info.isDirectory()) reject(`${label}: parent is not a directory (${value})`);
  }
  return parts.join('/');
}
// Conservative on case-sensitive systems, portable to common macOS checkouts.
// Prefixes end on a segment boundary, so src/a never includes src/abc.
const fold = (value) => value.normalize('NFD').toLowerCase();
function overlaps(a, b) {
  a = fold(a); b = fold(b);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function parsePlan(text) {
  // JSON.parse checks grammar but discards earlier duplicate members. Scan the
  // valid JSON tokens too, retaining decoded member names per object. Strings
  // are whole tokens, so braces and key-looking text inside values stay inert.
  const plan = JSON.parse(text);
  const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g);
  const scopes = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '{') scopes.push(new Set());
    else if (token === '[') scopes.push(null);
    else if (token === '}' || token === ']') scopes.pop();
    else if (tokens[i + 1] === ':') {
      const key = JSON.parse(token);
      const keys = scopes[scopes.length - 1];
      if (keys.has(key)) reject(`duplicate JSON member: ${JSON.stringify(key)}`);
      keys.add(key);
    }
  }
  return plan;
}

function validate(plan, root) {
  shape(plan, ['version', 'source', 'requirements', 'tasks'], 'plan');
  if (plan.version !== 1) reject('version: expected 1');
  shape(plan.source, ['path', 'sha256'], 'source');
  const source = repoPath(plan.source.path, root, 'source.path', true);
  if (typeof plan.source.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(plan.source.sha256)) {
    reject('source.sha256: expected 64 lowercase hexadecimal characters');
  }
  const sourcePath = path.join(root, source);
  if (!statSync(sourcePath).isFile()) reject('source.path: must name a file');
  const actual = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
  if (actual !== plan.source.sha256) reject(`source.sha256: stale source (${source})`);
  strings(plan.requirements, 'requirements', true);
  for (const requirement of plan.requirements) id(requirement, 'requirement');
  if (!Array.isArray(plan.tasks) || !plan.tasks.length) reject('tasks: expected a nonempty array');
  const tasks = new Map();
  for (const task of plan.tasks) {
    shape(task, ['id', 'covers', 'reads', 'edits', 'depends_on', 'verification'], 'task');
    id(task.id, 'task.id');
    if (tasks.has(task.id)) reject(`task.id: duplicate ${task.id}`);
    for (const field of ['covers', 'reads', 'edits', 'depends_on', 'verification']) {
      strings(task[field], `${task.id}.${field}`, field === 'covers' || field === 'verification');
    }
    for (const field of ['reads', 'edits']) {
      task[field] = task[field].map((p) => repoPath(p, root, `${task.id}.${field}`));
      if (new Set(task[field].map(fold)).size !== task[field].length) reject(`${task.id}.${field}: duplicate normalized paths`);
    }
    tasks.set(task.id, task);
  }
  const covered = new Set();
  for (const task of tasks.values()) {
    for (const requirement of task.covers) {
      if (!plan.requirements.includes(requirement)) reject(`${task.id}.covers: unknown requirement ${requirement}`);
      covered.add(requirement);
    }
    for (const dependency of task.depends_on) {
      if (!tasks.has(dependency)) reject(`${task.id}.depends_on: unknown task ${dependency}`);
    }
  }
  for (const requirement of plan.requirements) {
    if (!covered.has(requirement)) reject(`requirements: uncovered ${requirement}`);
  }
  const ancestors = new Map();
  const visiting = new Set();
  function visit(taskId) {
    if (visiting.has(taskId)) reject(`depends_on: cycle through ${taskId}`);
    if (ancestors.has(taskId)) return ancestors.get(taskId);
    visiting.add(taskId);
    const dependencies = new Set();
    for (const dependency of tasks.get(taskId).depends_on) {
      dependencies.add(dependency);
      for (const ancestor of visit(dependency)) dependencies.add(ancestor);
    }
    visiting.delete(taskId);
    ancestors.set(taskId, dependencies);
    return dependencies;
  }
  for (const taskId of tasks.keys()) visit(taskId);
  const list = [...tasks.values()];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]; const b = list[j];
      if (ancestors.get(a.id).has(b.id) || ancestors.get(b.id).has(a.id)) continue;
      for (const [left, right] of [['edits', 'edits'], ['edits', 'reads'], ['reads', 'edits']]) {
        for (const first of a[left]) for (const second of b[right]) {
          if (overlaps(first, second)) {
            reject(`unordered conflict: ${a.id}.${left} ${first} overlaps ${b.id}.${right} ${second}; add a real dependency or narrow scopes`);
          }
        }
      }
    }
  }
  return `${tasks.size} tasks, ${covered.size} requirements`;
}

const args = process.argv.slice(2);
if ((args.length !== 2 && args.length !== 4) || args[0] !== '--plan' || !args[1]
    || args[1].startsWith('--') || (args.length === 4 && (args[2] !== '--root' || !args[3] || args[3].startsWith('--')))) {
  console.error('usage: bash check.sh --plan <json> [--root <repo>]');
  process.exit(2);
}
try {
  const root = realpathSync(path.resolve(args[3] || '.'));
  if (!statSync(root).isDirectory()) reject('root: must name a directory');
  const plan = parsePlan(readFileSync(path.resolve(args[1]), 'utf8'));
  const result = validate(plan, root);
  console.log(`PASS: structural checks passed (${result}).`);
  console.log('Coverage meaning, undeclared effects, approval, and runtime ordering still require review. Verification is planned, not performed.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
