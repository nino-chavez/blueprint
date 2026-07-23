#!/usr/bin/env node

// Root-only Blueprint v2 semantic shadow.
//
// Current root files remain authoritative. This adapter reads them, constructs
// a normalized K1 candidate, executes current actor-output/doctor/stage tools,
// turns only exact tool observations into receipts, and writes disposable
// reports under this research directory. It never edits template/, manifests,
// consumers, or release metadata.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseManifest, validateManifest } from '../../../template/tools/lib/actor-output.mjs';
import { runDoctor } from '../../../template/tools/lib/doctor.mjs';
import { deriveStageStatus, readStageState } from '../../../template/tools/lib/stage-model.mjs';
import { validate } from '../k1/validate-k1.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const OVERLAY_FILE = resolve(HERE, 'root-overlay.json');
const GENERATED = resolve(HERE, 'generated');

const read = (file) => readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const mapObject = (map) => Object.fromEntries(map.entries());
const nonBlankLines = (text) => text.split('\n').filter((line) => line.trim()).length;
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 12);

function portable(value) {
  if (typeof value === 'string') return value.replaceAll(ROOT, '<repo-root>');
  if (Array.isArray(value)) return value.map(portable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, portable(item)]));
  return value;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function sourceVersion() {
  const head = git(['rev-parse', '--short', 'HEAD']);
  const status = git(['status', '--porcelain=v1']);
  return `${head}${status ? `+dirty-${hash(status)}` : '+clean'}`;
}

function actorKind(actor) {
  return actor.kind === 'agent' ? 'agent' : actor.kind === 'team' ? 'team' : 'human';
}

function buildActors(legacy, overlay) {
  const actors = (legacy.actors ?? []).map((actor) => {
    const override = overlay.charter.actor_overrides?.[actor.id] ?? {};
    return {
      id: actor.id,
      kinds: override.kinds ?? [actorKind(actor)],
      authority: override.authority ?? [],
      mapping_provenance: {
        id: 'actor-output.yml',
        kinds: override.kinds ? 'explicit-overlay' : 'legacy-inferred',
        authority: override.authority ? 'explicit-overlay' : 'unavailable'
      }
    };
  });
  for (const actor of overlay.charter.additional_actors ?? []) actors.push({ ...actor, mapping_provenance: { source: 'explicit-overlay' } });
  return actors;
}

function proofTarget(outcome) {
  const proof = outcome.success?.proof;
  return proof?.target ?? (proof?.method ? proof : null);
}

function outcomeClaims(legacy, overlay) {
  const profiles = overlay.mapping.proof_methods ?? {};
  const claims = [];
  const notes = [];
  for (const actor of legacy.actors ?? []) {
    for (const outcome of actor.outcomes ?? []) {
      const target = proofTarget(outcome);
      const profile = target?.method ? profiles[target.method] : null;
      const id = `outcome:${actor.id}.${outcome.id}`;
      if (!profile) notes.push(`${id}: proof method ${target?.method ?? '<missing>'} has no safe K1 adapter; claim contract is invalid until explicitly mapped`);
      claims.push({
        id,
        statement: outcome.success?.statement,
        charter_revision: overlay.charter.revision,
        scope: { actor: actor.id },
        owner: overlay.mapping.default_claim_owner,
        depends_on: [],
        evidence_requirement: {
          object: profile?.object,
          oracle: profile?.oracle,
          observer: {
            actor: actor.id,
            role: actorKind(actor)
          }
        },
        mapping_provenance: {
          statement: `actor-output.yml#${actor.id}.${outcome.id}`,
          scope: 'conservative actor-specific inference',
          evidence_profile: target?.method ? `root-overlay.json#mapping.proof_methods.${target.method}` : 'unavailable',
          legacy_interim_proof_ignored: outcome.success?.proof?.interim?.method ?? null
        }
      });
    }
  }
  return { claims, notes };
}

function toolClaims(overlay, version) {
  return (overlay.tool_claims ?? []).map((claim) => ({
    id: claim.id,
    statement: claim.statement,
    charter_revision: overlay.charter.revision,
    scope: { repository: 'blueprint-root' },
    owner: overlay.mapping.default_claim_owner,
    depends_on: [],
    evidence_requirement: {
      object: claim.object,
      oracle: claim.oracle,
      observer: { actor: 'shadow-evaluator', role: 'agent' },
      freshness: { source_version: version }
    },
    mapping_provenance: { source: 'explicit-overlay', result: 'generated-from-current-tool-execution' }
  }));
}

function toolReceipt({ id, claim, result, object, oracle, version, at, source, observation }) {
  return {
    id,
    claim,
    result,
    observation,
    object,
    oracle: { method: oracle, executed: true },
    observer: { actor: 'shadow-evaluator', role_during_observation: 'agent' },
    scope: { repository: 'blueprint-root' },
    source_version: version,
    observed_at: at,
    source
  };
}

function reasonText(reasons = []) {
  return reasons.map((reason) => {
    if (reason.receipts) return `${reason.code} (${reason.receipts.map((r) => typeof r === 'string' ? r : r.receipt).join(', ')})`;
    if (reason.dependencies) return `${reason.code} (${reason.dependencies.map((d) => `${d.claim}:${d.state}`).join(', ')})`;
    return reason.code;
  }).join('; ');
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Blueprint v2 root shadow report', '');
  lines.push(`Derived at ${report.generated_at} from source version \`${report.source_version}\`. Generated output; rerun \`node research/refoundation/v2-shadow/shadow-root.mjs\`, never hand-edit.`, '');
  lines.push('## Outcome', '');
  lines.push(`- K1 contract: **${report.kernel.errors.length ? 'BLOCKED' : 'VALID'}** (${report.kernel.errors.length} errors, ${report.kernel.warns.length} warnings)`);
  lines.push(`- Current actor-output view: **${report.compatibility.actor_output.verdict}**`);
  lines.push(`- Current doctor view: **${report.compatibility.doctor.status.toUpperCase()}**`);
  lines.push(`- Current stage next frontier: **${report.compatibility.stage.next_frontier}**`);
  lines.push(`- Explicit overlay: ${report.authoring.overlay_nonblank_lines} nonblank lines; normalized projection: ${report.authoring.normalized_nonblank_lines} nonblank lines.`, '');
  lines.push('## Claims', '');
  lines.push('| Claim | State | Exact reason |');
  lines.push('|---|---|---|');
  for (const [id, entry] of Object.entries(report.kernel.claims)) lines.push(`| \`${id}\` | ${entry.state} | ${entry.reason.replaceAll('|', '\\|')} |`);
  lines.push('', '## Checkpoints', '');
  lines.push('| Checkpoint | State | Unsatisfied claims |');
  lines.push('|---|---|---|');
  for (const [id, entry] of Object.entries(report.kernel.checkpoints)) {
    const missing = entry.unsatisfied.map((item) => `${item.claim}:${item.state}`).join(', ') || 'none';
    lines.push(`| \`${id}\` | ${entry.state} | ${missing} |`);
  }
  lines.push('', '## Current-view comparison', '');
  lines.push(`Actor-output remains ${report.compatibility.actor_output.verdict} because ${report.compatibility.actor_output.pendings.length} pending obligation(s) remain. K1 separately satisfies the exact structural-gate claim and leaves outcome claims open; output lifecycle is not promoted to actor success.`, '');
  lines.push(`Doctor remains ${report.compatibility.doctor.status}; the K1 tool claim says only that doctor executed without a blocking result inside doctor's named boundary. It does not convert doctor warnings or untested runtime behavior into product readiness.`, '');
  lines.push(`The stage view reports ${report.compatibility.stage.stages_complete.length} non-contiguous stage(s) complete (${report.compatibility.stage.stages_complete.join(', ') || 'none'}), confirmed cursor ${report.compatibility.stage.confirmed_cursor}, and next frontier ${report.compatibility.stage.next_frontier}. K1 does not ingest that cursor as evidence; it is retained only for discrepancy analysis.`, '');
  lines.push('## Adapter notes', '');
  for (const note of report.mapping_notes) lines.push(`- ${note}`);
  lines.push('', '## Tool receipt provenance', '');
  for (const receipt of report.receipts) lines.push(`- \`${receipt.id}\` → \`${receipt.claim}\`: ${receipt.result}; ${receipt.source}`);
  lines.push('', '## Current warnings retained', '');
  for (const check of report.compatibility.doctor.checks.filter((check) => check.status !== 'pass' && check.status !== 'skip')) lines.push(`- doctor \`${check.name}\` ${check.status}: ${check.detail}`);
  for (const pending of report.compatibility.actor_output.pendings) lines.push(`- actor-output pending: ${pending}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const overlayText = read(OVERLAY_FILE);
  const overlay = JSON.parse(overlayText);
  const version = sourceVersion();
  const actorOutputFile = resolve(ROOT, 'actor-output.yml');
  if (!existsSync(actorOutputFile)) throw new Error('root actor-output.yml is required for this shadow adapter');
  const actorOutputText = read(actorOutputFile);
  const legacy = parseManifest(actorOutputText);

  const actorOutputReport = validateManifest(legacy, { root: ROOT, gate: true, rawText: actorOutputText });
  const doctor = await runDoctor({ home: ROOT, targetDir: ROOT });
  const recordedStage = readStageState(ROOT);
  const stage = deriveStageStatus({ root: ROOT, assertions: recordedStage.assertions ?? {} });

  const actors = buildActors(legacy, overlay);
  const outcome = outcomeClaims(legacy, overlay);
  const claims = [...outcome.claims, ...toolClaims(overlay, version)];
  const receipts = [
    toolReceipt({
      id: `actor-output-gate-${version}`,
      claim: 'actor-output-contract-has-no-blocking-error',
      result: actorOutputReport.errors.length ? 'contradicts' : 'supports',
      object: 'contract-validation',
      oracle: 'actor-output-gate',
      version,
      at: overlay.as_of,
      source: 'actor-output.yml + template/tools/lib/actor-output.mjs (executed by shadow adapter)',
      observation: `${actorOutputReport.verdict}: ${actorOutputReport.errors.length} errors, ${actorOutputReport.pendings.length} pending, ${actorOutputReport.warns.length} warnings`
    }),
    toolReceipt({
      id: `doctor-${version}`,
      claim: 'doctor-completes-without-blocking-result',
      result: doctor.status === 'block' ? 'contradicts' : 'supports',
      object: 'contract-validation',
      oracle: 'blueprint-doctor',
      version,
      at: overlay.as_of,
      source: 'template/tools/lib/doctor.mjs runDoctor() (executed by shadow adapter)',
      observation: `${doctor.status}: ${doctor.checks.filter((check) => check.status === 'warn').length} warnings; notChecked=${doctor.notChecked.join('; ')}`
    })
  ];

  const normalized = {
    initiative: legacy.initiative ?? 'blueprint-self',
    as_of: overlay.as_of,
    current_charter_revision: overlay.charter.revision,
    charters: [{
      revision: overlay.charter.revision,
      intent: overlay.charter.intent,
      scope: overlay.charter.scope,
      actors
    }],
    claims,
    receipts,
    dispositions: [],
    checkpoints: overlay.checkpoints ?? [],
    modules: overlay.modules ?? [],
    assertions: {},
    adapter_metadata: {
      schema: overlay.schema,
      source_version: version,
      authoritative_inputs: ['blueprint.yml', 'actor-output.yml', 'root-overlay.json'],
      derived_not_authoritative: true
    }
  };

  const kernel = validate(normalized, 'v2-shadow/generated/normalized.json');
  const normalizedText = `${JSON.stringify(normalized, null, 2)}\n`;
  const claimReport = {};
  for (const [id, state] of kernel.states) claimReport[id] = { state, reason: reasonText(kernel.stateReasons.get(id)) };
  const checkpointReport = {};
  for (const [id, state] of kernel.checkpointStates) checkpointReport[id] = { state, unsatisfied: kernel.checkpointReasons.get(id) ?? [] };

  const report = {
    schema: 'blueprint-v2-shadow-report/1',
    generated_at: overlay.as_of,
    source_version: version,
    authoring: {
      overlay_file: 'research/refoundation/v2-shadow/root-overlay.json',
      overlay_nonblank_lines: nonBlankLines(overlayText),
      normalized_nonblank_lines: nonBlankLines(normalizedText),
      normalized_records: {
        actors: actors.length,
        claims: claims.length,
        receipts: receipts.length,
        checkpoints: normalized.checkpoints.length,
        modules: normalized.modules.length
      }
    },
    kernel: {
      errors: kernel.errors,
      warns: kernel.warns,
      claims: claimReport,
      checkpoints: checkpointReport,
      receipt_evaluations: mapObject(kernel.receiptEvaluations)
    },
    compatibility: {
      actor_output: {
        verdict: actorOutputReport.verdict,
        errors: actorOutputReport.errors,
        pendings: actorOutputReport.pendings,
        warns: actorOutputReport.warns
      },
      doctor: portable(doctor),
      stage: {
        variant: stage.variant,
        source: stage.modelSource,
        confirmed_cursor: stage.cursor < 0 ? 'none' : `${stage.cursor}:${stage.cursorName}`,
        artifact_cursor: stage.artifactCursor < 0 ? 'none' : `${stage.artifactCursor}:${stage.artifactCursorName}`,
        next_frontier: stage.nextStage == null ? 'none' : `${stage.nextStage.id}:${stage.nextStage.name}`,
        stages_complete: stage.stagesComplete,
        stage_count: stage.stageCount,
        stages: stage.stages
      }
    },
    mapping_notes: [
      ...outcome.notes,
      'Legacy actor evidence and output lifecycle are not outcome receipts; all seven actor-outcome claims remain open until a compatible observation is ingested.',
      'Actor kinds and authority are absent from the legacy contract at K1 precision and therefore come from the explicit overlay.',
      'Proof-grade labels are mapped conservatively to oracle profiles; interim simulated proof is recorded as provenance and never ingested as target evidence.',
      'The dirty working-tree fingerprint is a research freshness key, not a release identifier.',
      'Stage state is comparison-only and creates no K1 receipt.'
    ],
    receipts
  };

  mkdirSync(GENERATED, { recursive: true });
  writeFileSync(resolve(GENERATED, 'normalized.json'), normalizedText);
  writeFileSync(resolve(GENERATED, 'shadow-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(GENERATED, 'shadow-report.md'), renderMarkdown(report));

  console.log(`v2 shadow: ${kernel.errors.length ? 'BLOCKED' : 'VALID'}; ${claims.length} claims, ${receipts.length} generated tool receipts`);
  console.log(`actor-output=${actorOutputReport.verdict} doctor=${doctor.status} stage-frontier=${report.compatibility.stage.next_frontier}`);
  console.log(`wrote ${resolve(GENERATED, 'normalized.json')}`);
  console.log(`wrote ${resolve(GENERATED, 'shadow-report.json')}`);
  console.log(`wrote ${resolve(GENERATED, 'shadow-report.md')}`);
  if (kernel.errors.length) process.exitCode = 1;
}

await main();
