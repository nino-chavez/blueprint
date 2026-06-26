# Audit Discipline — Verification Against Canonical Sources

Methodology principle: self-attestation is not verification. Audits must resolve to ground truth, never trust an artifact's own claims about being verified.

## Rationale

An artifact can assert that something "was verified against canonical source X." Reading that assertion and treating it as evidence is a **circular audit** — you are verifying the artifact's verification, not verifying the claim itself. This fails when the artifact's self-check was wrong, incomplete, or misread.

The failure mode is silent: a charitable reviewer reads the artifact's verification timestamps and asserts-the-bug-as-honest-RED, then stamps "verified." No one caught that the verification was only a presence check, not a behavior check.

## The rule

When an artifact claims verification, **pull the canonical source yourself and re-verify the claim independently.**

- ✅ **Good**: Artifact says "verified against API docs." You resolve the API docs directly and re-check the claim.
- ❌ **Bad**: Artifact says "verified against API docs." You read the verification statement and accept it as sufficient.

Self-attested verification is a candidate hypothesis, not evidence.

## Mechanical verification companions

When auditing high-stakes claims (citations, implementation state, coverage), use mechanical tools where available:

- **Citations**: `tools/cited-url-lint/` — resolves claimed URLs, reports broken references.
- **Implementation state**: `tools/state-derive/` — derives presence from artifacts, not from claims.
- **Coverage matrices**: scenario-result artifacts (CI-generated) — ground truth for behavioral claims, never agent-predicted status.

Mechanical tools are not perfect, but they prevent circular audits by construction: they resolve to first-order evidence, not second-order claims.

## Application to reviewer agents

Reviewers checking verification-bearing claims (fact-check loops, completeness checks, coverage audits) must not accept the artifact's self-attestation. The chain is:

1. **Artifact makes a claim**: "X is true" or "Y was verified against source Z."
2. **Reviewer reads the artifact's verification statement**: NOT sufficient.
3. **Reviewer resolves source Z directly**: this is verification.
4. **Reviewer compares claim against ground truth**: this produces the audit result.

Skipping step 3 is the failure mode this rule exists to prevent.

## Drift watch

Audit processes that start with mechanical verification (step 1 above) but accept manual claims about "I checked this" without re-running the mechanical check are drifting toward circular audit. Mechanical verification is a contract: if you stop re-running it, you've degraded back to self-attestation.
