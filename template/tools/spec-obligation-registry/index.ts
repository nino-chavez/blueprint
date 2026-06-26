/**
 * template/tools/spec-obligation-registry — the portable proof-obligation registry.
 *
 * Generalizes the DoD verification ladder (template/docs/methodology/
 * dod-verification-ladder-pattern.md) from five FIXED gates to N obligations.
 * Pattern: template/docs/methodology/proof-obligation-registry-pattern.md.
 *
 * Every "did we X? prove it" claim is one PROOF OBLIGATION with a uniform shape:
 *
 *   claim → universe-source → oracle/tier → cadence → freshness → verdict
 *
 * This file ships seeded with the FIVE LADDER GATES only (project-agnostic) plus
 * one commented instance-1 example. A consumer appends the obligations its own
 * spec implies and wires `validate` as a CI gate next to its DoD-ladder derive.
 *
 * THE LAW (generalizes the audit-discipline rule to the whole prover): a proof's
 * evidence must come from a source the claim does NOT control. The three failure
 * axes the contract resists — rigged denominator / too-weak oracle / oracle
 * self-reference — are enforced by `validateObligation`:
 *   1. `universeSource.enumeratedFrom` required; an active obligation may not rest
 *      on an unestablished universe.
 *   2. `oracle.tier` explicit; mechanical-above-presence must `bindToProducer`.
 *   3. a `grep_present` oracle must declare a four-guard `SourceGrepBinding`
 *      (source-scoped · producer-bound · per-artifact · no-attest-escape).
 *
 * Pure core (no IO); `main()` runs `validate` (CI gate) or `list` (table view).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tier = 'mechanical' | 'behavioral' | 'judgment' | 'external';

export interface Freshness {
  /** Days a PROVEN verdict stays valid; null = valid until the source commit changes. */
  ttlDays: number | null;
  asOf: 'commit' | 'run';
}

/**
 * WHERE the complete set the claim quantifies over is enumerated from — the
 * anti-rigged-denominator. A registry entry with no real `enumeratedFrom` is rejected.
 */
export interface UniverseSource {
  description: string;
  /** A concrete, re-derivable enumeration source (a file, a parse, a table). */
  enumeratedFrom: string;
  completenessAttestedBy:
    | 'mechanical-derive'
    | 'human-signature'
    | 'adversarial-search'
    | 'none-yet';
}

/** The four-guard binding for a mechanical source-grep oracle (the operational form of THE LAW). */
export interface SourceGrepBinding {
  /** (a) impl/emit-source dirs ONLY. */
  sourceScope: string[];
  /** (a) the spec, derived projections, and tests/mocks — never evidence. */
  excludePaths: string[];
  /** (b) match a real producer/emit call, not a const name-array or comment. */
  bindToProducer: boolean;
  /** (c) assert each named artifact independently. */
  perArtifact: boolean;
  /** (d) false for mechanically-checkable artifacts — they may not attest their way out. */
  allowAttestationEscape: boolean;
}

export interface Oracle {
  kind: 'grep_present' | 'schema' | 'scenario_pass' | 'count' | 'attestation' | 'live_run';
  tier: Tier;
  /** Required iff kind === 'grep_present'. */
  binding?: SourceGrepBinding;
  how: string;
}

export type Cadence = 'continuous' | 'on-demand' | 'periodic';

export interface ProofObligation {
  id: string;
  claim: string;
  universeSource: UniverseSource;
  oracle: Oracle;
  cadence: Cadence;
  freshness: Freshness;
  /** active = enforced; proposed = registered hole; subsumes-ladder-gate = a DoD-ladder gate. */
  status: 'active' | 'proposed' | 'subsumes-ladder-gate';
  /** The tool/workflow that runs this obligation, or '' if not yet built. */
  engine: string;
  refs: string[];
}

// ---------------------------------------------------------------------------
// The registry — the five ladder gates (the project-agnostic seed)
// ---------------------------------------------------------------------------
//
// Consumers: adapt the `enumeratedFrom` / `engine` / scope paths to your repo,
// then append the obligations YOUR spec implies. See the commented instance-1
// example below the array.

const LADDER_FRESHNESS: Freshness = { ttlDays: null, asOf: 'commit' };

export const OBLIGATIONS: ProofObligation[] = [
  {
    id: 'g1-spec',
    claim: 'Is every AC written in the spec corpus? Prove it.',
    universeSource: {
      description: 'The full AC set of the spec.',
      enumeratedFrom: 'traceability registry (BRD/PRD parse)',
      completenessAttestedBy: 'mechanical-derive',
    },
    oracle: { kind: 'count', tier: 'mechanical', how: 'Traceability registry parse of spec ACs.' },
    cadence: 'continuous',
    freshness: LADDER_FRESHNESS,
    status: 'subsumes-ladder-gate',
    engine: 'tools/coverage-matrix-derive',
    refs: ['dod-verification-ladder-pattern.md'],
  },
  {
    id: 'g2-prototype',
    claim: 'Does a prototype screen exist for every story? Prove it.',
    universeSource: {
      description: 'All spec stories.',
      enumeratedFrom: 'traceability registry brd-story entries',
      completenessAttestedBy: 'mechanical-derive',
    },
    oracle: { kind: 'count', tier: 'mechanical', how: 'traceability prototypePages join.' },
    cadence: 'continuous',
    freshness: LADDER_FRESHNESS,
    status: 'subsumes-ladder-gate',
    engine: 'tools/coverage-matrix-derive',
    refs: ['dod-verification-ladder-pattern.md'],
  },
  {
    id: 'g3-presence',
    claim: 'Are the expected code artifacts present for every AC? Prove it.',
    universeSource: {
      description: 'All AC capability caps in the state-derive catalog.',
      enumeratedFrom: 'state-derive catalog cap ids',
      completenessAttestedBy: 'mechanical-derive',
    },
    oracle: {
      kind: 'grep_present',
      tier: 'mechanical',
      how: 'state-derive static checks (file_exists/grep_present/schema). PRESENCE, not function.',
      binding: {
        sourceScope: ['apps/', 'packages/', 'src/'],
        excludePaths: ['docs/', '**/*.test.*', '**/__mocks__/**'],
        bindToProducer: false, // G3 is presence by definition — its ceiling
        perArtifact: true,
        allowAttestationEscape: false,
      },
    },
    cadence: 'continuous',
    freshness: LADDER_FRESHNESS,
    status: 'subsumes-ladder-gate',
    engine: 'tools/state-derive',
    refs: ['dod-verification-ladder-pattern.md'],
  },
  {
    id: 'g4-behavior',
    claim: 'Does a runnable scenario exist AND pass, joined to the AC? Prove it.',
    universeSource: {
      description: 'All ACs that can reach a behavioral gate.',
      enumeratedFrom: 'traceability registry brd-story entries minus terminal-elsewhere',
      completenessAttestedBy: 'mechanical-derive',
    },
    oracle: {
      kind: 'scenario_pass',
      tier: 'behavioral',
      how: 'Recorded scenario-results evidence keyed by AC id (not test-file presence).',
    },
    cadence: 'continuous',
    freshness: LADDER_FRESHNESS,
    status: 'subsumes-ladder-gate',
    engine: 'tools/scenario-results',
    refs: ['dod-verification-ladder-pattern.md'],
  },
  {
    id: 'g5-live',
    claim: 'Is it green against the deployed app + live environment? Prove it.',
    universeSource: {
      description: 'ACs whose terminal gate is live/external.',
      enumeratedFrom: 'state-derive catalog blocked_external + terminal-gate caps',
      completenessAttestedBy: 'human-signature',
    },
    oracle: { kind: 'live_run', tier: 'external', how: 'Live E2E run or an explicit blocked-pending-external marker.' },
    cadence: 'periodic',
    freshness: { ttlDays: 30, asOf: 'run' },
    status: 'subsumes-ladder-gate',
    engine: '',
    refs: ['dod-verification-ladder-pattern.md'],
  },

  // --- INSTANCE-1 EXAMPLE (commented — uncomment + adapt to register the
  //     requirement-grain completeness obligation one grain BELOW the AC):
  //
  // {
  //   id: 'requirement-completeness',
  //   claim: 'Does every normative requirement INSIDE a story close to a verification hook? Prove it.',
  //   universeSource: {
  //     description: "A story's normative deeper-section requirements (telemetry, data-contract, SLOs).",
  //     enumeratedFrom: 'story <!-- normative-requirements --> blocks (parseable authoring format)',
  //     completenessAttestedBy: 'human-signature',
  //   },
  //   oracle: {
  //     kind: 'grep_present',
  //     tier: 'mechanical',
  //     how: 'each named artifact closes to a cap / grep against a producer site / scenario, or routes to an attestation.',
  //     binding: {
  //       sourceScope: ['apps/api/src', 'packages', 'src'],
  //       excludePaths: ['BRD.md', 'PRD.md', 'docs/', '**/*.test.*', '**/__mocks__/**'],
  //       bindToProducer: true,
  //       perArtifact: true,
  //       allowAttestationEscape: false,
  //     },
  //   },
  //   cadence: 'continuous',
  //   freshness: { ttlDays: null, asOf: 'commit' },
  //   status: 'active',
  //   engine: 'tools/requirement-completeness-lint',
  //   refs: ['proof-obligation-registry-pattern.md'],
  // },
];

// ---------------------------------------------------------------------------
// Validation — the structural contract (pure; this is what CI enforces)
// ---------------------------------------------------------------------------

export interface ValidationError {
  obligationId: string;
  field: string;
  message: string;
}

/** Paths that must never count as evidence for a mechanical proof (THE LAW). */
const FORBIDDEN_EVIDENCE_HINTS = ['BRD.md', 'PRD.md', 'docs/'];

export function validateObligation(o: ProofObligation): ValidationError[] {
  const errs: ValidationError[] = [];
  const push = (field: string, message: string) => errs.push({ obligationId: o.id, field, message });

  if (!o.id || !/^[a-z0-9-]+$/.test(o.id)) push('id', 'id must be non-empty kebab-case');
  if (!o.claim.trim()) push('claim', 'claim is required');

  // Axis 1 — rigged denominator.
  if (!o.universeSource?.enumeratedFrom?.trim()) {
    push('universeSource.enumeratedFrom', 'every obligation must name where its complete set is enumerated from (anti-rigged-denominator)');
  }
  if (o.status === 'active' && o.universeSource?.completenessAttestedBy === 'none-yet') {
    push('universeSource.completenessAttestedBy', 'an active obligation cannot have an unestablished universe — establish it or mark status: proposed');
  }

  // Axis 2 + 3 — mechanical source-grep oracles must declare the four-guard binding.
  if (o.oracle?.kind === 'grep_present') {
    const b = o.oracle.binding;
    if (!b) {
      push('oracle.binding', 'a grep_present oracle MUST declare a four-guard SourceGrepBinding (THE LAW)');
    } else {
      if (!b.sourceScope?.length) push('oracle.binding.sourceScope', 'guard (a): must scope to impl/emit-source dirs');
      const excludesSpec = FORBIDDEN_EVIDENCE_HINTS.some((h) => b.excludePaths?.some((p) => p.includes(h)));
      if (!excludesSpec) {
        push('oracle.binding.excludePaths', 'guard (a)/oracle-self-reference: must exclude the spec + derived docs so a claim cannot prove itself');
      }
      const excludesTests = b.excludePaths?.some((p) => /test|mock|spec/i.test(p));
      if (!excludesTests) {
        push('oracle.binding.excludePaths', 'guard (a): must exclude tests/mocks so a fiction cannot satisfy the proof');
      }
      if (!b.perArtifact) push('oracle.binding.perArtifact', 'guard (c): must assert each named artifact independently');
      if (o.oracle.tier === 'mechanical' && o.id !== 'g3-presence' && !b.bindToProducer) {
        push('oracle.binding.bindToProducer', 'guard (b): a mechanical proof above presence must bind to a real producer site, not a name-array');
      }
    }
  }

  // Axis 3 — attestation may not be the escape hatch for a mechanically-provable claim.
  if (o.oracle?.kind === 'attestation' && o.oracle.tier !== 'judgment' && o.oracle.tier !== 'external') {
    push('oracle', 'guard (d): only judgment/external claims may use an attestation oracle');
  }

  if (!o.freshness || (o.freshness.ttlDays !== null && o.freshness.ttlDays <= 0)) {
    push('freshness', 'freshness.ttlDays must be null or a positive number of days');
  }

  return errs;
}

export function validateRegistry(obligations: ProofObligation[] = OBLIGATIONS): ValidationError[] {
  const errs: ValidationError[] = [];
  const seen = new Set<string>();
  for (const o of obligations) {
    if (seen.has(o.id)) errs.push({ obligationId: o.id, field: 'id', message: 'duplicate obligation id' });
    seen.add(o.id);
    errs.push(...validateObligation(o));
  }
  return errs;
}

export function renderTable(obligations: ProofObligation[] = OBLIGATIONS): string {
  const rows = obligations.map((o) => {
    const status = o.status === 'active' ? 'ACTIVE' : o.status === 'proposed' ? 'proposed' : 'ladder';
    return `| ${o.id} | ${status} | ${o.oracle.tier} | ${o.cadence} | ${o.universeSource.enumeratedFrom} | ${o.engine || '—'} |`;
  });
  return [
    '| obligation | status | tier | cadence | universe-source | engine |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(): void {
  const mode = process.argv[2] ?? 'validate';
  if (mode === 'list') {
    process.stdout.write(renderTable() + '\n');
    return;
  }
  const errs = validateRegistry();
  if (errs.length === 0) {
    process.stdout.write(`spec-obligation-registry: ${OBLIGATIONS.length} obligations, contract OK\n`);
    process.exit(0);
  }
  process.stderr.write(`spec-obligation-registry: ${errs.length} contract violation(s):\n`);
  for (const e of errs) process.stderr.write(`  [${e.obligationId}] ${e.field}: ${e.message}\n`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
