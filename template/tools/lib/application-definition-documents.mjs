// Shared document-input v1 inspection. Never emits an application gate pass.
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(value).digest('hex');
const loadedMethodHash = digest(readFileSync(new URL(import.meta.url)));
const nonempty = value => typeof value === 'string' && !!value.trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const check = (condition, message) => { if (!condition) throw new Error(message); };
function keys(value, allowed, at) {
  check(value && typeof value === 'object' && !Array.isArray(value), `${at}: object required`);
  check(Object.keys(value).every(key => allowed.includes(key)), `${at}: unknown field`);
}
function sourceFile(root, path) {
  check(nonempty(path) && !isAbsolute(path) && !path.includes('\\') && !path.split('/').some(p => ['..', '.', ''].includes(p)), 'source path must be relative without dot segments');
  const full = realpathSync(resolve(root, path));
  check(full.startsWith(root + sep), 'source path escapes declared root');
  return readFileSync(full);
}
function idPattern(inventory) {
  return `${escape(inventory.prefix)}\\d{${inventory.digits},}(?:\\.\\d+)*`;
}
const endBoundary = '(?![A-Za-z0-9_]|\\.\\d)';
function* markdownLines(body) {
  let fence, language;
  for (const [index, line] of body.split(/\r?\n/).entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !fence) {
      fence = marker[1];
      language = marker[2].trim().toLowerCase();
      continue;
    }
    if (marker && marker[1][0] === fence?.[0] && marker[1].length >= fence.length && !marker[2].trim()) {
      fence = undefined;
      language = undefined;
      continue;
    }
    yield { index, line, fenced: !!fence, example: !!fence && language !== 'mermaid' };
  }
}
function definitions(body, inventory) {
  const lead = { heading: /^#{1,6}\s+/, table: /^\s*\|\s*/, list: /^\s*[-*]\s+/ }[inventory.format];
  const matchId = new RegExp(`^(${idPattern(inventory)})${endBoundary}(?![-.][A-Za-z0-9_])`);
  const result = [];
  for (const { index, line, fenced } of markdownLines(body)) {
    if (fenced || !lead.test(line)) continue;
    const content = line.replace(lead, '').replace(/^(?:\*\*|`)/, '');
    const match = content.match(matchId);
    if (match) result.push({ id: match[1], path: inventory.source, line: index + 1 });
  }
  return result;
}

// Expand explicit numeric ranges and slash shorthand without assigning semantics.
// Each implied ID still has to exist in its owned inventory.
function references(line, inventory) {
  const matches = [];
  const namedRange = `-${idPattern(inventory)}${endBoundary}(?![-.][A-Za-z_])`;
  const malformedSuffix = `(?:(?!${namedRange})[-.][A-Za-z_](?:[A-Za-z0-9_.-]*[A-Za-z0-9_])?)?`;
  const pattern = new RegExp(`(?<![A-Za-z0-9_])(${idPattern(inventory)}${malformedSuffix})${endBoundary}`, 'g');
  for (const match of line.matchAll(pattern)) {
    const first = match[1];
    matches.push({ id: first });
    let current = first.slice(inventory.prefix.length);
    let tail = line.slice(match.index + first.length);
    const suffix = new RegExp(`^\\s*([/–—-])\\s*(?:${escape(inventory.prefix)})?(\\d+(?:\\.\\d+)*)${endBoundary}`);
    for (let next; (next = tail.match(suffix)); tail = tail.slice(next[0].length)) {
      const left = current.split('.');
      const right = next[2].includes('.') ? next[2].split('.') : [...left.slice(0, -1), next[2]];
      if (next[1] === '/') {
        right[right.length - 1] = right.at(-1).padStart(left.at(-1).length, '0');
        matches.push({ id: inventory.prefix + right.join('.') });
      } else {
        const a = Number(left.at(-1)), b = Number(right.at(-1));
        if (left.length !== right.length || left.slice(0, -1).join('.') !== right.slice(0, -1).join('.') || b < a || b - a > 200 || !Number.isSafeInteger(b)) {
          matches.push({ unsupported: first + next[0] });
        } else {
          for (let n = a + 1; n <= b; n++) matches.push({ id: inventory.prefix + [...left.slice(0, -1), String(n).padStart(left.at(-1).length, '0')].join('.') });
        }
      }
      current = right.join('.');
    }
  }
  return matches;
}

export function inspectDocuments(root, manifest, requiredRoles, entrypointHash) {
  const result = {
    state: 'absent', mode: 'document-input', source_status: 'fail',
    authority: 'not-verified', allowed_actions: [],
    review_required: ['scope and completeness', 'meaning and contradictions', 'actor handoffs and recovery branches', 'rendered journey comprehension', 'trusted human decisions'],
    limitations: ['Only declared ID namespaces are inspected.', 'Source identity and valid references do not prove completeness or approval.', 'Prose permissions, states, decisions and journey edges are not inferred.'],
    sources: [], inventories: [], references: [], external_references: [], errors: [],
  };
  const fail = (code, detail, location = {}) => result.errors.push({ code, detail, ...location });
  try {
    check(digest(readFileSync(new URL(import.meta.url))) === loadedMethodHash, 'document inspector changed after loading; restart the checker');
    root = realpathSync(root);
    keys(manifest, ['version', 'scope', 'sources', 'inventories'], 'manifest');
    check(manifest.version === 1, 'unsupported document manifest version');
    keys(manifest.scope, ['id', 'owner', 'boundary', 'extent', 'included', 'excluded'], 'scope');
    const scope = manifest.scope;
    check(['id', 'owner', 'boundary'].every(k => nonempty(scope[k])), 'scope id, declared owner and boundary required');
    check(['new-application', 'whole-application', 'bounded-change', 'non-application'].includes(scope.extent), 'unknown extent');
    check(Array.isArray(scope.included) && scope.included.length && scope.included.every(nonempty), 'included jobs required');
    check(Array.isArray(scope.excluded) && scope.excluded.every(nonempty), 'excluded jobs must be an array');
    if (['bounded-change', 'non-application'].includes(scope.extent)) check(scope.excluded.length, 'bounded input must name excluded jobs');
    result.scope = scope; // A declaration, not an authenticated scope decision.
    check(Array.isArray(manifest.sources) && manifest.sources.length, 'sources required');
    check(Array.isArray(manifest.inventories) && manifest.inventories.length, 'inventories required');
    const bodies = new Map(), paths = new Set();
    for (const source of manifest.sources) {
      keys(source, ['path', 'sha256', 'roles', 'scan_references'], 'source');
      check(nonempty(source.path) && !paths.has(source.path), 'unique source paths required');
      paths.add(source.path);
      check(/^[a-f0-9]{64}$/.test(source.sha256), 'source sha256 required');
      check(Array.isArray(source.roles) && source.roles.length && new Set(source.roles).size === source.roles.length && source.roles.every(r => [...requiredRoles, 'context', 'contract'].includes(r)), 'known source roles required');
      check(typeof source.scan_references === 'boolean', 'explicit scan_references boolean required');
      try {
        const bytes = sourceFile(root, source.path), actual = digest(bytes), body = bytes.toString('utf8');
        result.sources.push({ path: source.path, roles: source.roles, sha256: actual, matches: actual === source.sha256 });
        if (!body.trim()) fail('empty-source', 'source is empty', { path: source.path });
        if (actual !== source.sha256) fail('stale-source', 'source differs from pinned mapping', { path: source.path });
        bodies.set(source.path, body);
      } catch (error) { fail('source-read', error.message, { path: source.path }); }
    }
    const roles = ['new-application', 'whole-application'].includes(scope.extent) ? requiredRoles : ['brd', 'prd', 'stories'];
    for (const role of roles) if (!manifest.sources.some(s => bodies.has(s.path) && s.roles.includes(role))) fail('artifact-role', role);
    const names = new Set(), prefixes = new Set();
    for (const inventory of manifest.inventories) {
      keys(inventory, ['name', 'prefix', 'digits', 'source', 'format', 'unavailable_reason', 'evidence'], 'inventory');
      check(nonempty(inventory.name) && !names.has(inventory.name), 'unique inventory names required');
      names.add(inventory.name);
      check(/^[A-Z]+-?$/.test(inventory.prefix) && !prefixes.has(inventory.prefix), 'unique uppercase ID prefixes required');
      prefixes.add(inventory.prefix);
      check(Number.isInteger(inventory.digits) && inventory.digits >= 1 && inventory.digits <= 6, 'ID digit width must be 1..6');
      const external = inventory.source === null;
      let rows = [];
      if (external) {
        check(!inventory.format && nonempty(inventory.unavailable_reason), 'unavailable inventory needs reason, not a format');
        keys(inventory.evidence, ['source', 'text'], 'unavailable evidence');
        check(paths.has(inventory.evidence.source) && nonempty(inventory.evidence.text), 'unavailable inventory needs owned source evidence');
        if (!bodies.get(inventory.evidence.source)?.includes(inventory.evidence.text)) fail('evidence-anchor', 'unavailable inventory evidence not found', { path: inventory.evidence.source });
      } else {
        check(!inventory.unavailable_reason && !inventory.evidence, 'owned inventory cannot claim unavailable evidence');
        check(paths.has(inventory.source), 'inventory source must be declared');
        check(['heading', 'table', 'list'].includes(inventory.format), 'unsupported inventory format');
        if (bodies.has(inventory.source)) rows = definitions(bodies.get(inventory.source), inventory);
        if (!rows.length) fail('inventory-empty', inventory.name, { path: inventory.source });
        const ids = new Set();
        for (const row of rows) {
          if (ids.has(row.id)) fail('duplicate-definition', row.id, { path: row.path, line: row.line });
          ids.add(row.id);
        }
      }
      const owned = new Set(rows.map(r => r.id));
      result.inventories.push({ name: inventory.name, prefix: inventory.prefix, availability: external ? 'unavailable' : 'owned', ...(external ? { reason: inventory.unavailable_reason, evidence: inventory.evidence } : {}), records: rows });
      for (const source of manifest.sources.filter(s => s.scan_references && bodies.has(s.path))) {
        for (const { index, line, example } of markdownLines(bodies.get(source.path))) {
          if (example) continue;
          const seen = new Set();
          for (const reference of references(line, inventory)) {
            if (reference.unsupported) { fail('unsupported-range', reference.unsupported, { path: source.path, line: index + 1 }); continue; }
            if (seen.has(reference.id)) continue;
            seen.add(reference.id);
            const record = { id: reference.id, inventory: inventory.name, path: source.path, line: index + 1 };
            if (external) result.external_references.push(record);
            else {
              result.references.push(record);
              if (!owned.has(record.id)) fail('unknown-reference', record.id, { path: record.path, line: record.line });
            }
          }
        }
      }
    }
    result.method_hash = digest(Buffer.concat([readFileSync(new URL(import.meta.url)), Buffer.from(JSON.stringify([requiredRoles, entrypointHash]))]));
    result.input_hash = digest(JSON.stringify(manifest));
    result.fingerprint = digest(JSON.stringify([result.method_hash, result.input_hash, result.sources.map(s => [s.path, s.sha256])]));
    result.source_status = result.errors.length ? 'fail' : 'pass';
    result.state = result.errors.length ? 'absent' : 'pending';
  } catch (error) { fail('shape', error.message); }
  return result;
}
