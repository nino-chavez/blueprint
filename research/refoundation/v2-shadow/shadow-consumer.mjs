#!/usr/bin/env node

// Read-only consumer shadow for the Blueprint re-foundation candidate.
//
// The adapter reads a consumer checkout plus a sanitized research overlay,
// executes only bounded current tools, and writes generated K1 projections
// under this repository. It never writes to the consumer checkout.
//
// Usage:
//   node research/refoundation/v2-shadow/shadow-consumer.mjs \
//     --overlay=research/refoundation/v2-shadow/consumer-overlays/film-room.json \
//     --root=/path/to/consumer

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseManifest, validateManifest } from '../../../template/tools/lib/actor-output.mjs';
import { runDoctor } from '../../../template/tools/lib/doctor.mjs';
import { validate } from '../k1/validate-k1.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = resolve(HERE, '../../..');
const GENERATED = resolve(HERE, 'generated/consumers');

const read = (file) => readFileSync(file, 'utf8');
const parseJson = (file) => JSON.parse(read(file));
const clone = (value) => JSON.parse(JSON.stringify(value));
const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12);
const nonBlankLines = (value) => value.split('\n').filter((line) => line.trim()).length;
const mapObject = (value) => Object.fromEntries(value.entries());

function option(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return entry?.slice(prefix.length);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

const overlayArg = option('overlay');
const rootArg = option('root');
if (!overlayArg || !rootArg) fail('Usage: shadow-consumer.mjs --overlay=<overlay.json> --root=<consumer-root>');

const OVERLAY_FILE = resolve(process.cwd(), overlayArg);
const CONSUMER_ROOT = resolve(process.cwd(), rootArg);
if (!existsSync(OVERLAY_FILE)) fail(`Overlay does not exist: ${overlayArg}`);
if (!existsSync(CONSUMER_ROOT) || !statSync(CONSUMER_ROOT).isDirectory()) fail(`Consumer root is not a directory: ${rootArg}`);

const overlayText = read(OVERLAY_FILE);
const overlay = JSON.parse(overlayText);
if (!/^[a-z0-9][a-z0-9-]*$/.test(overlay.initiative ?? '')) fail('Overlay initiative must be a safe lowercase slug');
const outputLabel = option('output-label') ?? overlay.initiative;
if (!/^[a-z0-9][a-z0-9-]*$/.test(outputLabel)) fail('Output label must be a safe lowercase slug');

function git(args) {
  return execFileSync('git', args, { cwd: CONSUMER_ROOT, encoding: 'utf8' }).trim();
}

function sourceVersion() {
  const head = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--porcelain=v1']);
  return status ? `${head}+dirty-${hash(status)}` : head;
}

const CURRENT_SOURCE_VERSION = sourceVersion();

function aliasString(value) {
  let result = value.replaceAll(CONSUMER_ROOT, '<consumer-root>').replaceAll(BLUEPRINT_ROOT, '<blueprint-root>');
  for (const [source, target] of Object.entries(overlay.actor_aliases ?? {})) result = result.replaceAll(source, target);
  return result;
}

function portable(value) {
  if (typeof value === 'string') return aliasString(value);
  if (Array.isArray(value)) return value.map(portable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [aliasString(key), portable(item)]));
  }
  return value;
}

function hydrate(value) {
  if (value === '$CURRENT_SOURCE_VERSION') return CURRENT_SOURCE_VERSION;
  if (Array.isArray(value)) return value.map(hydrate);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, hydrate(item)]));
  return value;
}

function actorId(value) {
  return overlay.actor_aliases?.[value] ?? value;
}

function actorRef(value) {
  if (typeof value !== 'string') return value;
  const split = value.indexOf('.');
  if (split === -1) return actorId(value);
  return `${actorId(value.slice(0, split))}.${value.slice(split + 1)}`;
}

function actorRole(kind) {
  if (kind === 'agent') return 'agent';
  if (kind === 'team') return 'team';
  return 'human';
}

function normalizeTime(value, fallback) {
  if (!value) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return `${value}T12:00:00Z`;
  return String(value);
}

function safePath(path) {
  const full = resolve(CONSUMER_ROOT, path);
  if (full !== CONSUMER_ROOT && !full.startsWith(`${CONSUMER_ROOT}${sep}`)) throw new Error(`Adapter path escapes consumer root: ${path}`);
  return full;
}

function artifactSourceVersion(output) {
  if (typeof output?.artifact !== 'string') return undefined;
  const full = safePath(output.artifact);
  if (!existsSync(full) || !statSync(full).isFile()) return undefined;
  try {
    const data = parseJson(full);
    for (const key of ['source_version', 'as_of_commit', 'as_of', 'version']) {
      if (data?.[key] != null) return String(data[key]);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function reasonText(reasons = []) {
  return reasons.map((reason) => {
    if (reason.receipts) return `${reason.code} (${reason.receipts.map((item) => typeof item === 'string' ? item : `${item.receipt}:${item.reasons.join('+')}`).join(', ')})`;
    if (reason.dependencies) return `${reason.code} (${reason.dependencies.map((item) => `${item.claim}:${item.state}`).join(', ')})`;
    return reason.code;
  }).join('; ');
}

function receiptForAdapter({ adapter, claim, result, observation, observedAt, observedVersion }) {
  return {
    id: `adapter:${adapter.id}`,
    claim: adapter.claim,
    result,
    observation,
    object: claim.evidence_requirement.object,
    oracle: {
      method: claim.evidence_requirement.oracle,
      executed: true,
    },
    observer: {
      actor: 'shadow-evaluator',
      role_during_observation: 'agent',
    },
    scope: claim.scope,
    source_version: observedVersion,
    observed_at: observedAt ?? overlay.as_of,
    source: `${adapter.type} adapter executed against ${adapter.path ?? `${(adapter.paths ?? []).length} declared paths`}`,
  };
}

const charters = hydrate(clone(overlay.charters ?? []));
const currentCharter = charters.find((entry) => entry.revision === overlay.current_charter_revision);
if (!currentCharter) fail(`Current charter revision ${overlay.current_charter_revision} is absent from overlay`);
currentCharter.actors ??= [];

function ensureCurrentActor(actor) {
  if (!currentCharter.actors.some((entry) => entry.id === actor.id)) currentCharter.actors.push(actor);
}

const claims = hydrate(clone(overlay.claims ?? []));
const receipts = hydrate(clone(overlay.receipts ?? []));
const mappingNotes = [];
const compatibility = {};
let actorOutputContext = null;

function addActorOutputProjection() {
  if (!overlay.actor_output) return;
  const path = overlay.actor_output.path ?? 'actor-output.yml';
  const full = safePath(path);
  if (!existsSync(full)) throw new Error(`Actor-output source does not exist: ${path}`);
  const text = read(full);
  const manifest = parseManifest(text);
  actorOutputContext = { path, text, manifest };
  const profiles = overlay.actor_output.proof_methods ?? {};
  const claimIds = new Set(claims.map((claim) => claim.id));

  for (const actor of manifest.actors ?? []) {
    const mappedActor = actorId(actor.id);
    if (!currentCharter.actors.some((entry) => entry.id === mappedActor)) {
      ensureCurrentActor({
        id: mappedActor,
        kinds: [actor.kind ?? 'human'],
        authority: [],
        mapping_provenance: 'legacy actor kind inferred; consequential authority unavailable',
      });
      mappingNotes.push(`Actor ${mappedActor} was absent from the overlay; its legacy kind was preserved but no authority was inferred.`);
    }
    for (const outcome of actor.outcomes ?? []) {
      const target = outcome.success?.proof?.target ?? (outcome.success?.proof?.method ? outcome.success.proof : null);
      const profile = profiles[target?.method];
      const id = `outcome:${mappedActor}.${outcome.id}`;
      if (claimIds.has(id)) throw new Error(`Duplicate overlay/actor-output claim: ${id}`);
      claimIds.add(id);
      claims.push({
        id,
        statement: portable(outcome.success?.statement),
        charter_revision: overlay.actor_output.claim_revision,
        scope: { actor: mappedActor },
        owner: actorId(overlay.actor_output.default_owner),
        depends_on: [],
        evidence_requirement: {
          object: profile?.object,
          oracle: profile?.oracle,
          observer: {
            ...(overlay.actor_output.observer_binding === 'actor' ? { actor: mappedActor } : {}),
            role: profile?.observer_role ?? actorRole(actor.kind),
          },
          ...(overlay.actor_output.freshness_binding === 'none'
            ? {}
            : { freshness: { source_version: CURRENT_SOURCE_VERSION } }),
        },
        mapping_provenance: {
          statement: `${path}#${mappedActor}.${outcome.id}`,
          target_proof: target?.method ?? null,
          interim_proof_not_promoted: outcome.success?.proof?.interim?.method ?? null,
        },
      });
      if (!profile) mappingNotes.push(`Outcome ${id} has no proof-method adapter for ${target?.method ?? '<missing>'}; K1 will reject the incomplete contract.`);
    }
  }

  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  let structuredCount = 0;
  let ignoredHumanStatuses = 0;
  for (const output of manifest.outputs ?? []) {
    if (output.assurance?.human_validation != null) ignoredHumanStatuses += 1;
    for (const [index, legacyReceipt] of (output.assurance?.receipts ?? []).entries()) {
      const profile = profiles[legacyReceipt.grade];
      if (!profile || !['pass', 'fail'].includes(legacyReceipt.result)) {
        mappingNotes.push(`Output ${output.id} receipt ${index} was not ingested because its grade/result has no exact adapter.`);
        continue;
      }
      for (const served of output.serves ?? []) {
        const mappedRef = actorRef(served);
        const claimId = `outcome:${mappedRef}`;
        const claim = byId.get(claimId);
        if (!claim) {
          mappingNotes.push(`Output ${output.id} receipt ${index} serves ${mappedRef}, which did not resolve to a generated claim.`);
          continue;
        }
        const observer = `receipt-observer-${hash(`${legacyReceipt.observer}|${legacyReceipt.grade}`)}`;
        ensureCurrentActor({
          id: observer,
          kinds: [profile.observer_role ?? 'agent', 'reviewer'],
          authority: ['issue-observation-receipt'],
          mapping_provenance: 'de-identified structured actor-output receipt observer',
        });
        const observedVersion = artifactSourceVersion(output);
        const normalized = {
          id: `actor-output:${output.id}:${index}:${mappedRef}`,
          claim: claimId,
          result: legacyReceipt.result === 'pass' ? 'supports' : 'contradicts',
          observation: `Structured ${legacyReceipt.grade} ${legacyReceipt.result} receipt attached to output ${output.id}; mapped only to declared served outcome ${mappedRef}.`,
          object: profile.object,
          oracle: { method: profile.oracle, executed: true },
          observer: {
            actor: observer,
            role_during_observation: profile.observer_role ?? 'agent',
          },
          scope: claim.scope,
          observed_at: normalizeTime(legacyReceipt.at, overlay.as_of),
          source: `${path} structured assurance receipt on output ${output.id}`,
        };
        if (observedVersion != null) normalized.source_version = observedVersion;
        receipts.push(normalized);
        structuredCount += 1;
      }
    }
  }
  mappingNotes.push(`Actor-output generated ${(manifest.actors ?? []).reduce((sum, actor) => sum + (actor.outcomes ?? []).length, 0)} outcome claims and ${structuredCount} claim-scoped receipt projection(s).`);
  if (ignoredHumanStatuses) mappingNotes.push(`${ignoredHumanStatuses} human-validation status field(s) were comparison-only; a status string is not a K1 receipt.`);
}

addActorOutputProjection();

async function executeAdapters() {
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  const summaries = [];
  for (const adapter of overlay.evidence_adapters ?? []) {
    const claim = byId.get(adapter.claim);
    if (!claim) throw new Error(`Evidence adapter ${adapter.id} references unknown claim ${adapter.claim}`);
    let receipt;
    let extra = {};

    if (adapter.type === 'all-files-exist') {
      const missing = (adapter.paths ?? []).filter((path) => !existsSync(safePath(path)));
      const result = missing.length ? 'contradicts' : 'supports';
      const observation = missing.length
        ? `${missing.length} of ${(adapter.paths ?? []).length} declared artifacts are absent: ${missing.join(', ')}`
        : `${(adapter.paths ?? []).length} of ${(adapter.paths ?? []).length} declared artifacts are present in the current checkout.`;
      receipt = receiptForAdapter({ adapter, claim, result, observation, observedVersion: CURRENT_SOURCE_VERSION });
      extra = { checked: (adapter.paths ?? []).length, missing };
    } else if (adapter.type === 'file-exists') {
      const present = existsSync(safePath(adapter.path));
      const result = present ? 'supports' : 'contradicts';
      const observation = present
        ? `Declared artifact ${adapter.path} is present in the current checkout.`
        : `Declared artifact ${adapter.path} is absent from the current checkout.`;
      receipt = receiptForAdapter({ adapter, claim, result, observation, observedVersion: CURRENT_SOURCE_VERSION });
      extra = { checked: 1, missing: present ? [] : [adapter.path] };
    } else if (adapter.type === 'state-summary') {
      const full = safePath(adapter.path);
      if (!existsSync(full)) {
        receipt = receiptForAdapter({
          adapter,
          claim,
          result: 'contradicts',
          observation: `Recorded state artifact ${adapter.path} is absent from the current checkout.`,
          observedVersion: CURRENT_SOURCE_VERSION,
        });
        extra = { artifact_present: false };
      } else {
        const data = parseJson(full);
        const allRows = data.capabilities ?? data.items ?? data.entries ?? data.claims ?? [];
        const rows = adapter.category
          ? allRows.filter((row) => (row.capability?.category ?? row.category) === adapter.category)
          : allRows;
        const statuses = {};
        for (const row of rows) {
          const status = row.status ?? 'UNKNOWN';
          statuses[status] = (statuses[status] ?? 0) + 1;
        }
        const observedVersion = data[adapter.source_version_field ?? 'as_of_commit'];
        const statusText = Object.entries(statuses).map(([status, count]) => `${status}=${count}`).join(', ') || 'no rows';
        receipt = receiptForAdapter({
          adapter,
          claim,
          result: 'supports',
          observation: `Recorded state artifact parsed ${rows.length} ${adapter.category ?? 'total'} row(s): ${statusText}.`,
          observedAt: normalizeTime(data.generated_at, overlay.as_of),
          observedVersion: observedVersion == null ? undefined : String(observedVersion),
        });
        extra = {
          artifact_present: true,
          rows: rows.length,
          statuses,
          recorded_source_version: observedVersion ?? null,
        };
      }
    } else if (adapter.type === 'actor-output-gate') {
      if (!actorOutputContext) {
        const path = overlay.actor_output?.path ?? 'actor-output.yml';
        const text = read(safePath(path));
        actorOutputContext = { path, text, manifest: parseManifest(text) };
      }
      const gate = validateManifest(actorOutputContext.manifest, {
        root: CONSUMER_ROOT,
        gate: true,
        rawText: actorOutputContext.text,
      });
      const result = gate.errors.length ? 'contradicts' : 'supports';
      const observation = `${gate.verdict}: ${gate.errors.length} blocking error(s), ${gate.pendings.length} pending obligation(s), ${gate.warns.length} warning(s).`;
      receipt = receiptForAdapter({ adapter, claim, result, observation, observedVersion: CURRENT_SOURCE_VERSION });
      compatibility.actor_output = {
        verdict: gate.verdict,
        errors: gate.errors.length,
        pendings: gate.pendings.length,
        warnings: gate.warns.length,
      };
      extra = compatibility.actor_output;
    } else if (adapter.type === 'blueprint-doctor') {
      const doctor = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: CONSUMER_ROOT });
      const counts = {};
      for (const check of doctor.checks ?? []) counts[check.status] = (counts[check.status] ?? 0) + 1;
      const result = ['fail', 'block'].includes(doctor.status) ? 'contradicts' : 'supports';
      const observation = `${String(doctor.status).toUpperCase()}: ${Object.entries(counts).map(([status, count]) => `${status}=${count}`).join(', ')}; ${doctor.notChecked?.length ?? 0} named not-checked boundary item(s).`;
      receipt = receiptForAdapter({ adapter, claim, result, observation, observedVersion: CURRENT_SOURCE_VERSION });
      compatibility.doctor = {
        status: doctor.status,
        check_counts: counts,
        nonpassing_checks: (doctor.checks ?? [])
          .filter((check) => check.status === 'fail' || check.status === 'warn')
          .map((check) => ({ name: check.name, status: check.status })),
        not_checked_count: doctor.notChecked?.length ?? 0,
      };
      extra = compatibility.doctor;
    } else {
      throw new Error(`Unknown evidence adapter type: ${adapter.type}`);
    }

    receipts.push(receipt);
    summaries.push({
      id: adapter.id,
      type: adapter.type,
      claim: adapter.claim,
      result: receipt.result,
      observation: receipt.observation,
      observed_source_version: receipt.source_version ?? null,
      ...extra,
    });
  }
  return summaries;
}

const adapterSummaries = await executeAdapters();

const normalized = portable({
  initiative: overlay.initiative,
  as_of: overlay.as_of,
  current_charter_revision: overlay.current_charter_revision,
  charters,
  claims,
  receipts,
  dispositions: hydrate(clone(overlay.dispositions ?? [])),
  checkpoints: hydrate(clone(overlay.checkpoints ?? [])),
  modules: hydrate(clone(overlay.modules ?? [])),
  assertions: {},
  adapter_metadata: {
    schema: overlay.schema,
    mode: overlay.mode,
    source_version: CURRENT_SOURCE_VERSION,
    source_checkout_read_only: true,
    overlay: relative(BLUEPRINT_ROOT, OVERLAY_FILE),
    derived_not_authoritative: true,
  },
});

const kernel = validate(normalized, `${overlay.initiative}.normalized.json`);
const normalizedText = `${JSON.stringify(normalized, null, 2)}\n`;
const claimReport = {};
for (const [id, state] of kernel.states) claimReport[id] = { state, reason: reasonText(kernel.stateReasons.get(id)) };
const checkpointReport = {};
for (const [id, state] of kernel.checkpointStates) {
  checkpointReport[id] = { state, unsatisfied: kernel.checkpointReasons.get(id) ?? [] };
}

const report = portable({
  schema: 'blueprint-v2-consumer-shadow-report/1',
  generated_at: overlay.as_of,
  initiative: overlay.initiative,
  source_version: CURRENT_SOURCE_VERSION,
  source_checkout_read_only: true,
  mode: overlay.mode,
  authoring: {
    overlay_file: relative(BLUEPRINT_ROOT, OVERLAY_FILE),
    overlay_nonblank_lines: nonBlankLines(overlayText),
    source_file: overlay.authoring_source?.file ?? null,
    source_nonblank_lines: overlay.authoring_source?.nonblank_lines ?? null,
    normalized_nonblank_lines: nonBlankLines(normalizedText),
    normalized_records: {
      actors: currentCharter.actors.length,
      claims: claims.length,
      receipts: receipts.length,
      checkpoints: normalized.checkpoints.length,
      modules: normalized.modules.length,
    },
  },
  sanitization: {
    absolute_paths_forbidden: true,
    source_actor_aliases_forbidden: true,
  },
  kernel: {
    errors: kernel.errors,
    warns: kernel.warns,
    claims: claimReport,
    checkpoints: checkpointReport,
    receipt_evaluations: mapObject(kernel.receiptEvaluations),
  },
  compatibility,
  adapters: adapterSummaries,
  mapping_notes: [
    ...mappingNotes,
    'Artifact-presence receipts prove only the named checkout boundary; they do not establish runtime or actor outcomes.',
    'Narrative claims in plans, case dossiers, comments, and status prose were not parsed into receipts.',
    'The dirty working-tree fingerprint is a research freshness key, not a release identifier.',
  ],
  receipts,
});

function renderMarkdown(value) {
  const lines = [];
  lines.push(`# Blueprint v2 consumer shadow: ${value.initiative}`, '');
  lines.push(`Derived at ${value.generated_at} from source version \`${value.source_version}\`. Generated read-only shadow output; rerun the consumer adapter and never hand-edit.`, '');
  lines.push('## Outcome', '');
  lines.push(`- K1 contract: **${value.kernel.errors.length ? 'BLOCKED' : 'VALID'}** (${value.kernel.errors.length} errors, ${value.kernel.warns.length} warnings)`);
  lines.push(`- Consumer checkout writes: **none**`);
  if (value.authoring.source_nonblank_lines != null) {
    lines.push(`- Compact source: ${value.authoring.source_nonblank_lines} nonblank lines; generated overlay: ${value.authoring.overlay_nonblank_lines}; normalized projection: ${value.authoring.normalized_nonblank_lines}.`);
  } else {
    lines.push(`- Explicit overlay: ${value.authoring.overlay_nonblank_lines} nonblank lines; normalized projection: ${value.authoring.normalized_nonblank_lines} nonblank lines.`);
  }
  if (value.compatibility.actor_output) lines.push(`- Current actor-output view: **${value.compatibility.actor_output.verdict}** (${value.compatibility.actor_output.errors} errors, ${value.compatibility.actor_output.pendings} pending, ${value.compatibility.actor_output.warnings} warnings)`);
  if (value.compatibility.doctor) lines.push(`- Current doctor view: **${String(value.compatibility.doctor.status).toUpperCase()}** (${Object.entries(value.compatibility.doctor.check_counts).map(([status, count]) => `${status}=${count}`).join(', ')})`);
  lines.push('', '## Claims', '');
  lines.push('| Claim | State | Exact reason |');
  lines.push('|---|---|---|');
  for (const [id, entry] of Object.entries(value.kernel.claims)) lines.push(`| \`${id}\` | ${entry.state} | ${entry.reason.replaceAll('|', '\\|')} |`);
  lines.push('', '## Checkpoints', '');
  lines.push('| Checkpoint | State | Unsatisfied claims |');
  lines.push('|---|---|---|');
  for (const [id, entry] of Object.entries(value.kernel.checkpoints)) {
    const missing = entry.unsatisfied.map((item) => `${item.claim}:${item.state}`).join(', ') || 'none';
    lines.push(`| \`${id}\` | ${entry.state} | ${missing} |`);
  }
  lines.push('', '## Adapter observations', '');
  for (const adapter of value.adapters) lines.push(`- \`${adapter.id}\` → \`${adapter.claim}\`: **${adapter.result}** — ${adapter.observation}`);
  lines.push('', '## Receipt compatibility', '');
  lines.push('| Receipt | Claim | Result | Compatible | Reasons |');
  lines.push('|---|---|---|---|---|');
  for (const [id, entry] of Object.entries(value.kernel.receipt_evaluations)) {
    lines.push(`| \`${id}\` | \`${entry.claim}\` | ${entry.result} | ${entry.compatible ? 'yes' : 'no'} | ${(entry.reasons ?? []).join(', ') || 'none'} |`);
  }
  lines.push('', '## Mapping notes', '');
  for (const note of value.mapping_notes) lines.push(`- ${note}`);
  if (value.kernel.errors.length) {
    lines.push('', '## Kernel errors', '');
    for (const error of value.kernel.errors) lines.push(`- ${error}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

mkdirSync(GENERATED, { recursive: true });
const base = resolve(GENERATED, outputLabel);
const reportText = `${JSON.stringify(report, null, 2)}\n`;
const markdownText = renderMarkdown(report);

function assertPortableOutput(label, text) {
  const forbidden = new Set([CONSUMER_ROOT, BLUEPRINT_ROOT]);
  for (const source of Object.keys(overlay.actor_aliases ?? {})) forbidden.add(source);
  for (const value of forbidden) {
    if (value && text.includes(value)) throw new Error(`${label} contains forbidden source value: ${value}`);
  }
  if (/(?:^|[\s"'=(])\/Users\//m.test(text) || /[A-Za-z]:\\Users\\/.test(text))
    throw new Error(`${label} contains an absolute user path`);
}

assertPortableOutput('normalized output', normalizedText);
assertPortableOutput('JSON report', reportText);
assertPortableOutput('Markdown report', markdownText);
writeFileSync(`${base}.normalized.json`, normalizedText);
writeFileSync(`${base}.shadow-report.json`, reportText);
writeFileSync(`${base}.shadow-report.md`, markdownText);

console.log(`${outputLabel}: ${kernel.errors.length ? 'BLOCKED' : 'VALID'}; ${claims.length} claims, ${receipts.length} receipts, ${adapterSummaries.length} adapters`);
for (const [id, state] of kernel.checkpointStates) console.log(`  checkpoint ${id}: ${state}`);
console.log(`  wrote ${relative(BLUEPRINT_ROOT, `${base}.normalized.json`)}`);
console.log(`  wrote ${relative(BLUEPRINT_ROOT, `${base}.shadow-report.json`)}`);
console.log(`  wrote ${relative(BLUEPRINT_ROOT, `${base}.shadow-report.md`)}`);
if (kernel.errors.length) process.exitCode = 1;
