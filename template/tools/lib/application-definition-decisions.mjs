// Host boundary for human decisions. Never loads a provider or approval from
// project files. A trusted host supplies identity policy and a fresh lookup;
// the lookup must authenticate direct-human origin using its own input channel.
// This library cannot turn exported chat roles or local JSON into that proof.
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inspectApplicationDefinition } from './application-definition.mjs';
import { loadStageModel } from './stage-model.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value === 'string' && !!value.trim();
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const methodFiles = ['application-definition-decisions.mjs', 'application-definition.mjs', 'application-definition-documents.mjs', 'stage-model.mjs', 'yaml-scalar.mjs'];
const methodHash = () => sha(JSON.stringify(methodFiles.map(name => [name, sha(readFileSync(new URL(name, import.meta.url)))])));
const loadedMethodHash = methodHash();
function requireThat(condition, code, message) {
  if (!condition) { const error = new Error(message); error.code = code; throw error; }
}
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return NaN;
  return new Date(ms).toISOString() === value.replace(/(?<!\.\d{3})Z$/, '.000Z') ? ms : NaN;
}
function hostPolicy(host) {
  requireThat(object(host) && ['provider', 'actor', 'role'].every(key => text(host[key])) && hex(host.method_hash), 'provider-unavailable', 'a trusted host must supply provider, actor, role and its policy/method hash');
  return { provider: host.provider, actor: host.actor, role: host.role, method_hash: host.method_hash };
}

/** Build an exact request for a host to present to its human reviewer.
 * requirement.review contains current reviewer input/method hashes and review
 * completion time supplied by that host. It is a binding, not a review PASS.
 * This slice supports draft-definition decisions only, not selection or freeze.
 */
export function applicationDecisionRequest({ initiativeRoot, requirement, host }) {
  requireThat(methodHash() === loadedMethodHash, 'method-changed', 'decision checker changed after loading; restart the checker');
  const policy = hostPolicy(host);
  requireThat(object(requirement) && requirement.kind === 'definition-review' && requirement.action === 'concepts', 'request', 'this adapter accepts only definition-review for concepts');
  requireThat(Number.isInteger(requirement.stage) && text(requirement.phase), 'request', 'an exact stage and phase are required');
  const review = requirement.review;
  requireThat(object(review) && hex(review.input_hash) && hex(review.method_hash) && Number.isFinite(timestamp(review.completed_at)), 'request', 'current review input/method hashes and UTC completion time are required');
  const root = realpathSync(initiativeRoot);
  const source = inspectApplicationDefinition({ initiativeRoot: root });
  requireThat(source.source_status === 'pass', 'source', source.errors.map(e => `${e.path || ''} ${e.detail}`).join('; '));
  const model = loadStageModel(root);
  requireThat(!model.error && hex(model.fingerprint), 'model', model.error || 'selected stage model cannot be fingerprinted');
  const phase = model.model.stages.find(stage => stage.id === requirement.stage)?.phases?.find(phase => phase.id === requirement.phase);
  requireThat(phase, 'request', 'the requested stage/phase does not exist in the selected model');
  requireThat(phase.gates.some(gate => gate.kind === 'application-definition-source'), 'request', 'the requested phase must own an application-definition-source check');
  const binding = {
    schema: 'blueprint-application-decision-request/1',
    subject: source.scope.id, kind: requirement.kind, action: requirement.action,
    stage: requirement.stage, phase: requirement.phase,
    source_fingerprint: source.source_fingerprint,
    model_fingerprint: model.fingerprint,
    review: { input_hash: review.input_hash, method_hash: review.method_hash, completed_at: review.completed_at },
    authority: policy,
    method_hash: loadedMethodHash,
  };
  return { ...binding, fingerprint: sha(JSON.stringify(binding)) };
}

/** Resolve a fresh canonical decision through a trusted, in-process host.
 * host.resolveDecision({decisionId, request, signal}) must return the current
 * record, including revocation/supersession. It must authenticate the source,
 * direct-human origin and account before returning origin: authenticated-human.
 * It must never infer that origin from userMessage, names, or a local receipt.
 * No CLI/YAML option supplies this capability. Missing hosts fail closed.
 * Even a verified human decision leaves application readiness pending here.
 */
export async function inspectApplicationDecision({ initiativeRoot, requirement, decisionId, host, now = Date.now, timeoutMs = 5000 }) {
  const result = { state: 'pending', mode: 'application-definition-decision', decision_status: 'unverified', authority: 'not-verified', allowed_actions: [], errors: [] };
  const fail = (code, detail) => { result.errors.push({ code, detail }); return result; };
  try {
    requireThat(text(decisionId), 'request', 'an exact host decision ID is required');
    requireThat(Number.isInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 30000, 'request', 'lookup timeout must be 1..30000 milliseconds');
    requireThat(typeof host?.resolveDecision === 'function', 'provider-unavailable', 'no authenticated host decision provider is installed');
    // Copy expectations before calling the host. Its returned object is not the
    // expected policy, and mutating the query must not mutate our comparison.
    const policy = hostPolicy(host);
    const requirementCopy = structuredClone(requirement);
    const root = realpathSync(initiativeRoot);
    const request = applicationDecisionRequest({ initiativeRoot: root, requirement: requirementCopy, host: policy });
    result.request = structuredClone(request);
    result.source_fingerprint = request.source_fingerprint;
    const controller = new AbortController();
    let timer, decision;
    try {
      decision = await Promise.race([
        Promise.resolve().then(() => host.resolveDecision({ decisionId, request: structuredClone(request), signal: controller.signal })),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('host decision lookup timed out')); }, timeoutMs); }),
      ]);
    } catch (error) { return fail('provider-error', error.message); }
    finally { clearTimeout(timer); }
    // The source can change while a network-backed host is answering.
    try {
      const current = applicationDecisionRequest({ initiativeRoot: root, requirement: requirementCopy, host: hostPolicy(host) });
      if (current.fingerprint !== request.fingerprint) return fail('inputs-changed', 'application inputs changed during the decision lookup');
    } catch (error) { return fail('inputs-changed', error.message); }
    if (decision === null || decision === undefined) return fail('missing', 'the host has no current decision with this ID');
    requireThat(object(decision) && decision.schema === 'blueprint-human-decision/1' && object(decision.source) && text(decision.source.id) && text(decision.source.revision), 'malformed-decision', 'host response needs a versioned decision and source record/revision');
    if (decision.id !== decisionId || ['provider', 'actor', 'role'].some(key => decision[key] !== policy[key])) return fail('identity', 'decision ID, provider, actor or role does not match the trusted host binding');
    if (decision.origin !== 'authenticated-human') return fail('provenance', 'the host did not authenticate direct-human origin');
    if (['revoked', 'superseded'].includes(decision.status)) return fail('revoked', 'the decision is revoked or superseded');
    requireThat(decision.status === 'active' && ['accept', 'reject'].includes(decision.verdict), 'malformed-decision', 'host response needs current status and an explicit verdict');
    if (decision.verdict !== 'accept') return fail('rejected', 'the human decision rejects this request');
    if (['subject', 'kind', 'action'].some(key => decision[key] !== request[key])) return fail('scope', 'decision subject, kind or permitted action differs from this request');
    if (decision.fingerprint !== request.fingerprint) return fail('stale', 'decision does not cover the current source, model, review and host method');
    const at = timestamp(decision.decided_at), clock = now();
    requireThat(Number.isFinite(clock), 'clock', 'host clock is unavailable');
    if (!Number.isFinite(at) || at > clock || at < timestamp(request.review.completed_at)) return fail('chronology', 'decision must follow the review and must not be in the future');
    if (decision.expires_at !== null) {
      const expires = timestamp(decision.expires_at);
      if (!Number.isFinite(expires) || expires <= at) return fail('chronology', 'decision expiry must follow its decision time');
      if (expires <= clock) return fail('expired', 'decision has expired');
    }
    result.decision_status = 'verified';
    result.authority = 'verified';
    result.decision = {
      id: decision.id, provider: decision.provider, actor: decision.actor, role: decision.role,
      decided_at: decision.decided_at, expires_at: decision.expires_at,
      source: { id: decision.source.id, revision: decision.source.revision },
    };
    // A human decision is one prerequisite. Substantive review, scope and
    // concept-work authority still belong to the eventual complete phase gate.
    return result;
  } catch (error) { return fail(error.code || 'inspection-error', error.message); }
}
