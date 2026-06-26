import { describe, it, expect } from 'vitest';

import {
  OBLIGATIONS,
  validateObligation,
  validateRegistry,
  renderTable,
  type ProofObligation,
} from '../index.ts';

function validMechanical(): ProofObligation {
  return {
    id: 'sample-obligation',
    claim: 'Does every X close? Prove it.',
    universeSource: { description: 'all X', enumeratedFrom: 'some-real-source.ts', completenessAttestedBy: 'mechanical-derive' },
    oracle: {
      kind: 'grep_present',
      tier: 'mechanical',
      how: 'grep each X against a producer site',
      binding: {
        sourceScope: ['src'],
        excludePaths: ['docs/', '**/*.test.*', '**/__mocks__/**'],
        bindToProducer: true,
        perArtifact: true,
        allowAttestationEscape: false,
      },
    },
    cadence: 'continuous',
    freshness: { ttlDays: null, asOf: 'commit' },
    status: 'active',
    engine: 'tools/sample',
    refs: [],
  };
}

describe('shipped seed registry', () => {
  it('the five ladder gates satisfy the contract', () => {
    expect(validateRegistry(OBLIGATIONS)).toEqual([]);
  });
  it('ships exactly the five ladder gates (instance-1 is a commented example)', () => {
    expect(OBLIGATIONS.map((o) => o.id)).toEqual(['g1-spec', 'g2-prototype', 'g3-presence', 'g4-behavior', 'g5-live']);
  });
  it('renders a table view', () => {
    expect(renderTable(OBLIGATIONS)).toContain('| obligation |');
  });
});

describe('axis 1 — rigged denominator', () => {
  it('rejects an obligation with no enumerated universe source', () => {
    const o = validMechanical();
    o.universeSource.enumeratedFrom = '';
    expect(validateObligation(o).some((e) => e.field === 'universeSource.enumeratedFrom')).toBe(true);
  });
  it('rejects an ACTIVE obligation resting on an unestablished universe', () => {
    const o = validMechanical();
    o.universeSource.completenessAttestedBy = 'none-yet';
    expect(validateObligation(o).some((e) => e.field === 'universeSource.completenessAttestedBy')).toBe(true);
  });
  it('allows a PROPOSED obligation with an unestablished universe', () => {
    const o = validMechanical();
    o.status = 'proposed';
    o.universeSource.completenessAttestedBy = 'none-yet';
    expect(validateObligation(o)).toEqual([]);
  });
});

describe('axes 2 + 3 — the four-guard law', () => {
  it('rejects a grep_present oracle with no binding', () => {
    const o = validMechanical();
    delete o.oracle.binding;
    expect(validateObligation(o).some((e) => e.field === 'oracle.binding')).toBe(true);
  });
  it('guard (a): rejects a binding that does not exclude the spec (spec-self-match vector)', () => {
    const o = validMechanical();
    o.oracle.binding!.excludePaths = ['**/*.test.*'];
    expect(validateObligation(o).some((e) => /prove itself/.test(e.message))).toBe(true);
  });
  it('guard (a): rejects a binding that does not exclude tests/mocks', () => {
    const o = validMechanical();
    o.oracle.binding!.excludePaths = ['docs/'];
    expect(validateObligation(o).some((e) => /fiction/.test(e.message))).toBe(true);
  });
  it('guard (b): rejects a mechanical-above-presence oracle that does not bind to a producer', () => {
    const o = validMechanical();
    o.oracle.binding!.bindToProducer = false;
    expect(validateObligation(o).some((e) => e.field === 'oracle.binding.bindToProducer')).toBe(true);
  });
  it('guard (c): rejects a per-block (non per-artifact) oracle', () => {
    const o = validMechanical();
    o.oracle.binding!.perArtifact = false;
    expect(validateObligation(o).some((e) => e.field === 'oracle.binding.perArtifact')).toBe(true);
  });
  it('guard (d): rejects an attestation oracle on a mechanically-checkable claim', () => {
    const o = validMechanical();
    o.oracle = { kind: 'attestation', tier: 'mechanical', how: 'someone vouches' };
    expect(validateObligation(o).some((e) => /attestation oracle/.test(e.message))).toBe(true);
  });
  it('allows an attestation oracle for a judgment-bearing claim', () => {
    const o = validMechanical();
    o.oracle = { kind: 'attestation', tier: 'judgment', how: 'human reviews UX state' };
    expect(validateObligation(o)).toEqual([]);
  });
});

describe('registry-level', () => {
  it('rejects duplicate ids', () => {
    expect(validateRegistry([validMechanical(), validMechanical()]).some((e) => e.message === 'duplicate obligation id')).toBe(true);
  });
});
