#!/usr/bin/env node

// Research compiler for a compact author-facing Blueprint contract.
//
// This is deliberately a recipe/compiler layer over K1, not a new kernel. It
// expands named actor and evidence profiles into the explicit shadow overlay
// consumed by shadow-consumer.mjs. Generated overlays are disposable.
//
// Usage:
//   node research/refoundation/v2-shadow/compile-compact.mjs \
//     --source=research/refoundation/v2-shadow/compact/film-room.yml \
//     --output=research/refoundation/v2-shadow/generated/compact-overlays/film-room.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseManifest } from '../../../template/tools/lib/actor-output.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = resolve(HERE, '../../..');
const read = (file) => readFileSync(file, 'utf8');
const nonBlankLines = (text) => text.split('\n').filter((line) => line.trim()).length;
let diagnosticText = '';
let diagnosticFile = '<compact-source>';

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function sourceLine(needle) {
  if (!diagnosticText) return null;
  const lines = diagnosticText.split('\n');
  const index = needle == null ? -1 : lines.findIndex((line) => line.includes(String(needle)));
  return index === -1 ? 1 : index + 1;
}

function fail(message, needle = null) {
  const line = sourceLine(needle);
  console.error(line == null ? message : `${diagnosticFile}:${line}: ${message}`);
  process.exit(2);
}

const sourceArg = option('source');
const outputArg = option('output');
if (!sourceArg || !outputArg) fail('Usage: compile-compact.mjs --source=<compact.yml> --output=<generated-overlay.json>');
const SOURCE = resolve(process.cwd(), sourceArg);
const OUTPUT = resolve(process.cwd(), outputArg);
if (!existsSync(SOURCE)) fail(`Compact source does not exist: ${sourceArg}`);
if (OUTPUT !== BLUEPRINT_ROOT && !OUTPUT.startsWith(`${BLUEPRINT_ROOT}${sep}`)) fail('Generated compact overlay must remain inside the Blueprint repository');

const sourceText = read(SOURCE);
diagnosticText = sourceText;
diagnosticFile = relative(BLUEPRINT_ROOT, SOURCE);
const compact = parseManifest(sourceText);
if (compact.schema !== 'blueprint-compact/0') fail(`Unsupported compact schema: ${compact.schema ?? '<missing>'}`);
if (compact.profiles !== 'k1-research-0') fail(`Unsupported profile set: ${compact.profiles ?? '<missing>'}`, 'profiles:');
if (!/^[a-z0-9][a-z0-9-]*$/.test(compact.initiative ?? '')) fail('initiative must be a safe lowercase slug');
if (!compact.as_of || Number.isNaN(new Date(compact.as_of).getTime())) fail('as_of must be a valid timestamp', 'as_of:');

const ACTOR_PROFILES = {
  'operator-builder': {
    kinds: ['human', 'operator', 'builder', 'pilot-user'],
    authority: ['authorize-work', 'change-intent', 'disposition-transition', 'accept-risk', 'observe-own-operational-outcome'],
    default_role: 'operator',
  },
  'agent-worker': {
    kinds: ['agent'],
    authority: ['execute-authorized-work', 'issue-tool-receipt', 'propose-disposition'],
    default_role: 'agent',
  },
  'decision-maker': {
    kinds: ['human', 'decision-maker', 'pilot-user'],
    authority: ['issue-own-outcome-receipt', 'decide-counterparty-scope'],
    default_role: 'decision-maker',
  },
  'pilot-operator': {
    kinds: ['human', 'operator', 'pilot-user'],
    authority: ['issue-own-outcome-receipt'],
    default_role: 'pilot-user',
  },
  'receiving-team': {
    kinds: ['team', 'pilot-user'],
    authority: ['issue-own-outcome-receipt', 'accept-handoff'],
    default_role: 'team',
  },
};

const SHADOW_ACTOR = {
  id: 'shadow-evaluator',
  kinds: ['agent', 'reviewer'],
  authority: ['issue-tool-receipt'],
  profile: 'compiler-system-actor',
};

const PROOF_METHODS = {
  'observed-human': { object: 'actor-outcome', oracle: 'observed-human-encounter', observer_role: 'human' },
  'cold-agent': { object: 'agent-outcome', oracle: 'cold-agent-run', observer_role: 'agent' },
  'simulated-walk': { object: 'simulated-actor-outcome', oracle: 'simulated-walk', observer_role: 'agent' },
  mechanical: { object: 'contract-validation', oracle: 'mechanical-check', observer_role: 'agent' },
};

function number(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) fail(`${label} must be an integer`);
  return parsed;
}

function scalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function scope(value = {}) {
  return Object.fromEntries(Object.entries(value ?? {}).map(([key, item]) => [key, scalar(item)]));
}

function list(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail(`duplicate ${label}: ${value}`, value);
    seen.add(value);
  }
}

function safeRelativePath(value, label, needle = value) {
  if (typeof value !== 'string' || !value) fail(`${label} must be a non-empty relative path`, needle);
  const normalized = normalize(value);
  if (isAbsolute(value) || normalized === '..' || normalized.startsWith(`..${sep}`))
    fail(`${label} escapes the consumer root: ${value}`, needle);
  return value;
}

const currentRevision = number(compact.charter?.revision, 'charter.revision');
if (!compact.charter?.intent) fail('charter.intent is required');
if (!compact.operator) fail('operator is required');

function expandActor(declaration, fallback = null) {
  if (typeof declaration === 'string') {
    if (!fallback) fail(`actor ${declaration} needs an explicit profile`);
    return { ...fallback };
  }
  const profileName = declaration.profile ?? fallback?.profile;
  const profile = profileName ? ACTOR_PROFILES[profileName] : null;
  if (profileName && !profile) fail(`unknown actor profile ${profileName} for ${declaration.id}`, profileName);
  if (!profile && !fallback) fail(`actor ${declaration.id} has no profile`, declaration.id);
  const baseKinds = declaration.profile ? profile.kinds : (fallback?.kinds ?? profile.kinds);
  const baseAuthority = declaration.profile ? profile.authority : (fallback?.authority ?? profile.authority);
  const removeKinds = new Set(list(declaration.remove_kinds));
  const removeAuthority = new Set(list(declaration.remove_authority));
  const addKinds = list(declaration.add_kinds);
  const addAuthority = list(declaration.add_authority);
  unique(addKinds, `added kind for actor ${declaration.id}`);
  unique(addAuthority, `added authority for actor ${declaration.id}`);
  for (const kind of removeKinds) if (!baseKinds.includes(kind)) fail(`actor ${declaration.id} removes unknown kind ${kind}`, kind);
  for (const authority of removeAuthority)
    if (!baseAuthority.includes(authority)) fail(`actor ${declaration.id} removes unknown authority ${authority}`, authority);
  for (const kind of addKinds) {
    if (baseKinds.includes(kind)) fail(`actor ${declaration.id} adds existing kind ${kind}`, kind);
    if (removeKinds.has(kind)) fail(`actor ${declaration.id} both adds and removes kind ${kind}`, kind);
  }
  for (const authority of addAuthority) {
    if (baseAuthority.includes(authority)) fail(`actor ${declaration.id} adds existing authority ${authority}`, authority);
    if (removeAuthority.has(authority)) fail(`actor ${declaration.id} both adds and removes authority ${authority}`, authority);
  }
  return {
    id: declaration.id ?? fallback.id,
    kinds: [...baseKinds.filter((kind) => !removeKinds.has(kind)), ...addKinds],
    authority: [...baseAuthority.filter((authority) => !removeAuthority.has(authority)), ...addAuthority],
    profile: profileName,
  };
}

const actorDefinitions = new Map();
for (const declaration of compact.actors ?? []) {
  const actor = expandActor(declaration);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(actor.id ?? '')) fail(`invalid actor id ${actor.id ?? '<missing>'}`, actor.id);
  if (actorDefinitions.has(actor.id)) fail(`duplicate actor ${actor.id}`);
  actorDefinitions.set(actor.id, actor);
}
if (!actorDefinitions.has(compact.operator)) fail(`operator ${compact.operator} is not declared in actors`);

const currentActors = [...actorDefinitions.values(), SHADOW_ACTOR];
const charters = [];
for (const prior of compact.history ?? []) {
  const actors = list(prior.actors).map((declaration) => {
    const id = typeof declaration === 'string' ? declaration : declaration.id;
    const actor = actorDefinitions.get(id);
    if (!actor) fail(`history revision ${prior.revision} references unknown actor ${id}`);
    return expandActor(declaration, actor);
  });
  charters.push({
    revision: number(prior.revision, 'history.revision'),
    intent: prior.intent,
    scope: scope(prior.scope),
    actors,
  });
}
charters.push({
  revision: currentRevision,
  intent: compact.charter.intent,
  scope: scope(compact.charter.scope),
  actors: currentActors,
});
unique(charters.map((charter) => charter.revision), 'charter revision');

const adapters = [];

function actorForClaim(claim) {
  if (!claim.actor) fail(`claim ${claim.id} evidence ${claim.evidence} requires actor`, claim.id);
  const actor = actorDefinitions.get(claim.actor);
  if (!actor) fail(`claim ${claim.id} references unknown actor ${claim.actor}`, claim.actor);
  return actor;
}

function claimFreshness(claim, enabled = true) {
  if (!enabled) return {};
  const authored = claim.source_version ?? 'current';
  if (typeof authored !== 'string' || !authored)
    fail(`claim ${claim.id} source_version must be current or a non-empty exact version`, claim.id);
  return {
    freshness: {
      source_version: authored === 'current' ? '$CURRENT_SOURCE_VERSION' : authored,
    },
  };
}

function evidenceFor(claim) {
  const baseRepositoryScope = { repository: compact.initiative };
  const explicitScope = scope(claim.scope);
  const shadow = { actor: 'shadow-evaluator', role: 'agent' };
  let requirement;
  let derivedScope;

  if (claim.evidence === 'observed-task') {
    const actor = actorForClaim(claim);
    const profile = ACTOR_PROFILES[actor.profile];
    derivedScope = { actor: claim.actor, ...explicitScope };
    requirement = {
      object: 'actor-outcome',
      oracle: 'observed-task-run',
      observer: { actor: claim.actor, role: profile.default_role },
      ...claimFreshness(claim, claim.fresh === 'current'),
    };
  } else if (claim.evidence === 'pilot-task') {
    actorForClaim(claim);
    derivedScope = { actor: claim.actor, ...explicitScope };
    requirement = {
      object: 'actor-outcome',
      oracle: 'observed-task-run',
      observer: { actor: claim.actor, role: 'pilot-user', independence: 'not-builder' },
      ...claimFreshness(claim, claim.fresh !== 'none'),
    };
  } else if (claim.evidence === 'live-scheduled-run') {
    actorForClaim(claim);
    derivedScope = { actor: claim.actor, ...explicitScope };
    requirement = {
      object: 'live-behavior',
      oracle: 'observed-scheduled-run',
      observer: { actor: claim.actor, role: 'operator' },
      ...claimFreshness(claim, claim.fresh !== 'none'),
    };
  } else if (claim.evidence === 'handoff-run') {
    actorForClaim(claim);
    derivedScope = { actor: claim.actor, ...explicitScope };
    requirement = {
      object: 'actor-outcome',
      oracle: 'observed-handoff-run',
      observer: { actor: claim.actor, role: 'team', independence: 'not-builder' },
      ...claimFreshness(claim, claim.fresh === 'current'),
    };
  } else if (claim.evidence === 'files') {
    if (!list(claim.paths).length) fail(`claim ${claim.id} files evidence requires paths`);
    for (const path of list(claim.paths)) safeRelativePath(path, `claim ${claim.id} evidence path`, path);
    derivedScope = { ...baseRepositoryScope, boundary: claim.id, ...explicitScope };
    requirement = { object: 'artifact-presence', oracle: 'all-files-exist', observer: shadow, ...claimFreshness(claim) };
    adapters.push({ id: `${compact.initiative}-${claim.id}`, type: 'all-files-exist', claim: claim.id, paths: list(claim.paths) });
  } else if (claim.evidence === 'file') {
    if (!claim.source) fail(`claim ${claim.id} file evidence requires source`);
    safeRelativePath(claim.source, `claim ${claim.id} evidence source`, claim.source);
    derivedScope = { ...baseRepositoryScope, artifact: claim.source, ...explicitScope };
    requirement = { object: 'artifact-presence', oracle: 'file-exists', observer: shadow, ...claimFreshness(claim) };
    adapters.push({ id: `${compact.initiative}-${claim.id}`, type: 'file-exists', claim: claim.id, path: claim.source });
  } else if (claim.evidence === 'package-inspection') {
    const actor = claim.actor ? actorForClaim(claim) : null;
    const profile = actor ? ACTOR_PROFILES[actor.profile] : null;
    derivedScope = { ...baseRepositoryScope, boundary: claim.id, ...explicitScope };
    requirement = {
      object: 'artifact-content',
      oracle: 'package-inspection',
      observer: actor
        ? { actor: actor.id, role: profile.default_role }
        : shadow,
      ...claimFreshness(claim, claim.fresh !== 'none'),
    };
  } else if (claim.evidence === 'actor-output-gate') {
    derivedScope = { ...baseRepositoryScope, ...(claim.scope_exact ? {} : { contract: 'actor-output' }), ...explicitScope };
    requirement = { object: 'contract-validation', oracle: 'actor-output-gate', observer: shadow, ...claimFreshness(claim) };
    adapters.push({ id: `${compact.initiative}-${claim.id}`, type: 'actor-output-gate', claim: claim.id });
  } else if (claim.evidence === 'doctor') {
    derivedScope = { ...baseRepositoryScope, ...(claim.scope_exact ? {} : { contract: 'blueprint-doctor' }), ...explicitScope };
    requirement = { object: 'contract-validation', oracle: 'blueprint-doctor', observer: shadow, ...claimFreshness(claim) };
    adapters.push({ id: `${compact.initiative}-${claim.id}`, type: 'blueprint-doctor', claim: claim.id });
  } else if (claim.evidence === 'state') {
    if (!claim.source) fail(`claim ${claim.id} state evidence requires source`);
    safeRelativePath(claim.source, `claim ${claim.id} evidence source`, claim.source);
    derivedScope = {
      ...baseRepositoryScope,
      artifact: claim.source,
      ...(claim.category ? { category: claim.category } : {}),
      ...explicitScope,
    };
    requirement = {
      object: claim.object ?? (claim.category === 'behavior-gate' ? 'behavior-state-register' : 'implementation-state-register'),
      oracle: 'recorded-state-derive',
      observer: shadow,
      ...claimFreshness(claim),
    };
    adapters.push({
      id: `${compact.initiative}-${claim.id}`,
      type: 'state-summary',
      claim: claim.id,
      path: claim.source,
      source_version_field: claim.version_field ?? 'as_of_commit',
      ...(claim.category ? { category: claim.category } : {}),
    });
  } else {
    fail(`claim ${claim.id} uses unknown evidence profile ${claim.evidence}`);
  }

  return { scope: derivedScope, requirement };
}

const claims = [];
for (const compactClaim of compact.claims ?? []) {
  if (!compactClaim.id || !compactClaim.says) fail('every compact claim requires id and says');
  const evidence = evidenceFor(compactClaim);
  claims.push({
    id: compactClaim.id,
    statement: compactClaim.says,
    charter_revision: compactClaim.charter ? number(compactClaim.charter, `claim ${compactClaim.id} charter`) : currentRevision,
    scope: evidence.scope,
    owner: compactClaim.owner ?? compact.operator,
    depends_on: list(compactClaim.needs),
    evidence_requirement: evidence.requirement,
    recipe_provenance: { evidence_profile: compactClaim.evidence },
  });
}
unique(claims.map((claim) => claim.id), 'claim');

if (compact.imports?.actor_output) safeRelativePath(compact.imports.actor_output, 'imports.actor_output', compact.imports.actor_output);
if (compact.imports?.actor_output_observer && compact.imports.actor_output_observer !== 'actor')
  fail(`imports.actor_output_observer only supports actor, got ${compact.imports.actor_output_observer}`, 'actor_output_observer');
if (compact.imports?.actor_output_freshness && !['current', 'none'].includes(compact.imports.actor_output_freshness))
  fail(`imports.actor_output_freshness must be current or none, got ${compact.imports.actor_output_freshness}`, 'actor_output_freshness');
const claimById = new Map(claims.map((claim) => [claim.id, claim]));
const importedClaim = (id) => compact.imports?.actor_output && /^outcome:[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/.test(id);
const knownClaim = (id) => claimById.has(id) || importedClaim(id);
for (const claim of claims) {
  for (const dependency of claim.depends_on) {
    if (!knownClaim(dependency)) fail(`claim ${claim.id} depends on unknown claim ${dependency}`, dependency);
  }
}

const visiting = new Set();
const visited = new Set();
function visitClaim(id) {
  if (visited.has(id) || !claimById.has(id)) return;
  if (visiting.has(id)) fail(`claim dependency cycle includes ${id}`, id);
  visiting.add(id);
  for (const dependency of claimById.get(id).depends_on) visitClaim(dependency);
  visiting.delete(id);
  visited.add(id);
}
for (const id of claimById.keys()) visitClaim(id);

const nativeReceipts = [];
for (const authored of compact.receipts ?? []) {
  if (!authored.id) fail('every native receipt requires id', 'receipts:');
  const claim = claimById.get(authored.claim);
  if (!claim) fail(`native receipt ${authored.id} references unknown or imported claim ${authored.claim}`, authored.claim);
  if (!['supports', 'contradicts', 'could-not-observe'].includes(authored.result))
    fail(`native receipt ${authored.id} has invalid result ${authored.result}`, authored.result);
  if (authored.via !== claim.evidence_requirement.oracle)
    fail(`native receipt ${authored.id} oracle ${authored.via ?? '<missing>'} does not match claim oracle ${claim.evidence_requirement.oracle}`, authored.via ?? authored.id);
  const observerActor = actorDefinitions.get(authored.observer);
  if (!observerActor) fail(`native receipt ${authored.id} observer ${authored.observer} is not a declared actor`, authored.observer);
  if (!authored.role) fail(`native receipt ${authored.id} requires observer role`, authored.id);
  const expectedObserver = claim.evidence_requirement.observer ?? {};
  if (expectedObserver.actor && expectedObserver.actor !== authored.observer)
    fail(`native receipt ${authored.id} observer ${authored.observer} does not match required actor ${expectedObserver.actor}`, authored.observer);
  if (expectedObserver.role && expectedObserver.role !== authored.role)
    fail(`native receipt ${authored.id} role ${authored.role} does not match required role ${expectedObserver.role}`, authored.role);
  if (expectedObserver.independence && expectedObserver.independence !== authored.independence)
    fail(`native receipt ${authored.id} must declare independence ${expectedObserver.independence}`, authored.id);
  if (expectedObserver.independence === 'not-builder' && observerActor.kinds.includes('builder'))
    fail(`native receipt ${authored.id} observer ${authored.observer} is a builder but the claim requires not-builder independence`, authored.id);
  if (!authored.at || Number.isNaN(new Date(authored.at).getTime())) fail(`native receipt ${authored.id} requires valid at timestamp`, authored.id);
  if (!authored.observation) fail(`native receipt ${authored.id} requires observation`, authored.id);
  if (!authored.source) fail(`native receipt ${authored.id} requires source`, authored.id);
  if (authored.expires_at && Number.isNaN(new Date(authored.expires_at).getTime()))
    fail(`native receipt ${authored.id} has invalid expires_at`, authored.expires_at);
  const authoredScope = scope(authored.scope);
  for (const [key, value] of Object.entries(authoredScope)) {
    if (claim.scope[key] != null && claim.scope[key] !== value)
      fail(`native receipt ${authored.id} changes claim scope ${key}`, key);
  }
  const needsVersion = claim.evidence_requirement.freshness?.source_version != null;
  if (needsVersion && authored.source_version == null)
    fail(`native receipt ${authored.id} must declare source_version current or an exact version`, authored.id);
  const sourceVersion = authored.source_version === 'current' ? '$CURRENT_SOURCE_VERSION' : authored.source_version;
  nativeReceipts.push({
    id: authored.id,
    claim: authored.claim,
    result: authored.result,
    observation: authored.observation,
    object: claim.evidence_requirement.object,
    oracle: {
      method: authored.via,
      executed: authored.result !== 'could-not-observe',
    },
    observer: {
      actor: authored.observer,
      role_during_observation: authored.role,
      ...(authored.independence ? { independence: authored.independence } : {}),
    },
    scope: { ...claim.scope, ...authoredScope },
    ...(sourceVersion != null ? { source_version: sourceVersion } : {}),
    observed_at: authored.at,
    ...(authored.expires_at ? { expires_at: authored.expires_at } : {}),
    source: authored.source,
    recipe_provenance: { native_receipt: true, claim_contract_reused: true },
  });
}
unique(nativeReceipts.map((receipt) => receipt.id), 'native receipt');

const checkpoints = (compact.checkpoints ?? []).map((checkpoint) => ({
  id: checkpoint.id,
  requires: list(checkpoint.requires),
}));
unique(checkpoints.map((checkpoint) => checkpoint.id), 'checkpoint');
for (const checkpoint of checkpoints) {
  if (!checkpoint.requires.length) fail(`checkpoint ${checkpoint.id} has no required claims`, checkpoint.id);
  for (const claim of checkpoint.requires)
    if (!knownClaim(claim)) fail(`checkpoint ${checkpoint.id} references unknown claim ${claim}`, claim);
}

const modules = (compact.modules ?? []).map((module) => ({
  id: module.id,
  activation_claims: list(module.claims),
  ...(module.actor_kind ? { requires_actor_kind: module.actor_kind } : {}),
}));
unique(modules.map((module) => module.id), 'module');
for (const module of modules) {
  if (!module.activation_claims.length) fail(`module ${module.id} has no activation claims`, module.id);
  for (const claim of module.activation_claims)
    if (!knownClaim(claim)) fail(`module ${module.id} references unknown claim ${claim}`, claim);
}

const dispositions = [];
if (compact.recharter) {
  const decidedBy = compact.recharter.by ?? compact.operator;
  const authority = compact.recharter.authority ?? 'change-intent';
  const actor = actorDefinitions.get(decidedBy);
  if (!compact.recharter.id) fail('recharter requires id', 'recharter:');
  if (!actor) fail(`recharter decision maker ${decidedBy} is not a declared actor`, decidedBy);
  if (!actor.authority.includes(authority)) fail(`actor ${decidedBy} lacks ${authority} authority for recharter`, compact.recharter.id);
  if (!compact.recharter.rationale) fail('recharter requires rationale', 'recharter:');
  if (!compact.recharter.at || Number.isNaN(new Date(compact.recharter.at).getTime())) fail('recharter requires valid at timestamp', 'recharter:');
  const retained = list(compact.recharter.retains);
  const invalidated = list(compact.recharter.invalidates);
  for (const claim of [...retained, ...invalidated])
    if (!knownClaim(claim)) fail(`recharter references unknown claim ${claim}`, claim);
  for (const claim of retained)
    if (invalidated.includes(claim)) fail(`recharter both retains and invalidates claim ${claim}`, claim);
  dispositions.push({
    id: compact.recharter.id,
    action: 're-charter',
    proposed_by: decidedBy,
    decided_by: decidedBy,
    authority,
    basis: list(compact.recharter.basis),
    changes: {
      charter_revision: currentRevision,
      retains_claims: retained,
      invalidates_claims: invalidated,
    },
    rationale: compact.recharter.rationale,
    decided_at: compact.recharter.at,
  });
}

const receiptById = new Map(nativeReceipts.map((receipt) => [receipt.id, receipt]));
const correctedReceipts = new Set();
for (const correction of compact.corrections ?? []) {
  if (!correction.id) fail('every receipt correction requires id', 'corrections:');
  const decidedBy = correction.by ?? compact.operator;
  const actor = actorDefinitions.get(decidedBy);
  if (!actor) fail(`receipt correction ${correction.id} decision maker ${decidedBy} is not a declared actor`, decidedBy);
  if (!actor.authority.includes('correct-receipt'))
    fail(`actor ${decidedBy} lacks correct-receipt authority for receipt correction ${correction.id}`, correction.id);
  if (!correction.rationale) fail(`receipt correction ${correction.id} requires rationale`, correction.id);
  if (!correction.at || Number.isNaN(new Date(correction.at).getTime()))
    fail(`receipt correction ${correction.id} requires valid at timestamp`, correction.id);

  const retractions = list(correction.receipts ?? correction.receipt);
  const replacements = list(correction.replacements);
  const invalidated = list(correction.invalidates);
  if (!retractions.length) fail(`receipt correction ${correction.id} retracts no receipts`, correction.id);
  for (const claim of invalidated)
    if (!knownClaim(claim)) fail(`receipt correction ${correction.id} invalidates unknown claim ${claim}`, claim);

  const replacementRecords = replacements.map((receiptId) => {
    const receipt = receiptById.get(receiptId);
    if (!receipt) fail(`receipt correction ${correction.id} replaces with unknown native receipt ${receiptId}`, receiptId);
    return receipt;
  });
  for (const receiptId of retractions) {
    const receipt = receiptById.get(receiptId);
    if (!receipt) fail(`receipt correction ${correction.id} retracts unknown native receipt ${receiptId}`, receiptId);
    if (replacements.includes(receiptId))
      fail(`receipt correction ${correction.id} cannot retract and replace with ${receiptId}`, receiptId);
    if (correctedReceipts.has(receiptId)) fail(`native receipt ${receiptId} is corrected more than once`, receiptId);
    correctedReceipts.add(receiptId);
    const matchingReplacement = replacementRecords.some((replacement) => replacement.claim === receipt.claim);
    if (!matchingReplacement && !invalidated.includes(receipt.claim))
      fail(`receipt correction ${correction.id} must replace ${receiptId} with a native receipt for claim ${receipt.claim} or invalidate that claim`, receiptId);
  }
  for (const replacement of replacementRecords) {
    const correctedClaims = retractions.map((receiptId) => receiptById.get(receiptId)?.claim);
    if (!correctedClaims.includes(replacement.claim))
      fail(`replacement receipt ${replacement.id} in ${correction.id} does not match a retracted claim`, replacement.id);
  }
  dispositions.push({
    id: correction.id,
    action: 'correct-receipt',
    decided_by: decidedBy,
    authority: 'correct-receipt',
    changes: {
      retracts_receipts: retractions,
      replacement_receipts: replacements,
      invalidates_claims: invalidated,
    },
    rationale: correction.rationale,
    decided_at: correction.at,
  });
}
unique(dispositions.map((disposition) => disposition.id), 'disposition');

const overlay = {
  schema: 'blueprint-v2-consumer-shadow-overlay/1',
  initiative: compact.initiative,
  as_of: compact.as_of,
  mode: compact.imports?.actor_output ? 'actor-output' : 'native',
  actor_aliases: compact.imports?.actor_aliases ?? {},
  current_charter_revision: currentRevision,
  charters,
  ...(compact.imports?.actor_output ? {
    actor_output: {
      path: compact.imports.actor_output,
      claim_revision: currentRevision,
      default_owner: compact.operator,
      proof_methods: PROOF_METHODS,
      ...(compact.imports.actor_output_observer === 'actor' ? { observer_binding: 'actor' } : {}),
      ...(compact.imports.actor_output_freshness === 'none' ? { freshness_binding: 'none' } : {}),
    },
  } : {}),
  claims,
  receipts: nativeReceipts,
  dispositions,
  checkpoints,
  modules,
  evidence_adapters: adapters,
  authoring_source: {
    file: relative(BLUEPRINT_ROOT, SOURCE),
    nonblank_lines: nonBlankLines(sourceText),
    compiler: 'research/refoundation/v2-shadow/compile-compact.mjs',
    profile_set: compact.profiles,
  },
};

mkdirSync(dirname(OUTPUT), { recursive: true });
const overlayText = `${JSON.stringify(overlay, null, 2)}\n`;
if (/(?:^|[\s"'=(])\/Users\//m.test(overlayText) || /[A-Za-z]:\\Users\\/.test(overlayText))
  fail('compiled overlay contains an absolute user path; use a consumer-relative source or sanitized observation', '/Users/');
writeFileSync(OUTPUT, overlayText);
console.log(`${compact.initiative}: ${nonBlankLines(sourceText)} compact lines -> ${claims.length} explicit claim(s), ${nativeReceipts.length} native receipt(s), ${adapters.length} adapter(s), ${modules.length} module(s)`);
console.log(`  wrote ${relative(BLUEPRINT_ROOT, OUTPUT)}`);
