# Citation Correctness: Mechanical verification, not self-attestation

**Status: canonical (wave 74).** Closes a structural gap in the trust-but-verify policy: when agent-authored prose cites external sources (vendor docs, competitor changelogs, RFCs, code, API references), the policy says "verify against canonical source," but it offers no **mechanical sibling** to enforce that verification. The result: reviewers accept the artifact's own claims of verification ("verified against BigEng Docs") without re-checking against the actual source — a circular audit that silently fails when citations are broken.

## The gap this closes

The trust-but-verify policy (`METHODOLOGY.md` § Trust-but-verify) correctly mandates verification of agent-produced status artifacts. But citations are a distinct claim class with a distinct failure mode: prose can claim "verified against https://example.com/docs" while the cited URL actually returns 404. The substance of the claim can be correct (verified against an actual canonical source), but the citation format is wrong — and a cold-start engineer has no way to know whether to trust the claim or assume it was fabricated. The broken-citation pattern went undetected in three ways:

1. No mechanical lint existed to verify citations actually resolve.
2. Reviewers were not prohibited from accepting self-reported verification ("the artifact says it was verified").
3. The verification discipline did not name a tool, leaving "verify the citations" as an implicit human-judgment gate.

## The principle: mechanical verification, not self-attestation

Citation correctness is an **objective, mechanically verifiable** property. A URL either resolves or it does not. The lint is:

> **Do not accept an agent's claim that "citations were verified." Verify the citations yourself by running the mechanical lint and checking the results.**

This is distinct from the broader trust-but-verify policy: that policy covers claims about the *world* (what exists, what users want, what competitors do) where verification requires judgment. Citation verification is purely mechanical — run the tool, read the report, no human judgment needed except to decide whether an allowlist entry is justified.

## The build-stage contract (the preventive control)

Citations carrying authority assertions (e.g., "per the BC API docs," "as of the AWS whitepaper," "RFC-5234 states") must pass the citation-lint check:

1. **Mechanical gate.** The `tools/cited-url-lint/` tool walks markdown, extracts all `http(s)://` citations, and reports any that return 4xx or fail to connect (with a 7-day cache to avoid re-checking every run).
2. **No self-attestation.** When a reviewer receives a claim of the form "verified against source X," the reviewer's job is **not** to re-read the artifact's verification note. It is to resolve the URL and check it directly. If the lint has already run and the URL passes, the reviewer can trust the lint result. If the lint failed, the violation stands.
3. **Allowlist for edge cases.** URLs that require authentication, are behind anti-bot protection, or are legitimately cited as examples (code-block paths, internal URLs) can be allowlisted in `.cited-url-lint-allowlist` with a comment explaining why.

This composes with the trust-but-verify policy: the policy asks "verify the claim"; the citation-correctness pattern adds the mechanical half: "verify the *URLs* in the claim *automatically*."

## Why this discipline exists

A real example from discovery: a prose analysis claims "per the BC documentation at `https://docs.bigcommerce.com/developer/...mdx`" — the assertion sounds authoritative. The substantive claim (verified against actual BC sources) is correct. But the cited URL is a repo source-file path, not the rendered URL, so it 404s. A reader following the link gets a 404, then must choose: assume the claim is fabricated, or assume the citation format is just wrong. Without mechanical verification, both failure modes are silent.

The discipline prevents this by making citation verification automatic and non-negotiable — part of the gate, not a judgment call.

## When this pattern applies

Any Blueprint initiative producing prose that cites external authority (platform APIs, competitor docs, published standards, vendor guides, open-source code references, prior decisions in ADRs) runs the lint as part of fact-check gate convergence. Guidance:

- **Internal ADRs / decisions:** liens pointing to the repo itself (e.g., `docs/architecture/...md`, GitHub issue links) usually resolve reliably and don't need allowlisting. Run the lint; if it passes, you're done.
- **External authority citations:** run the lint, fix any 4xx results. If a URL is legitimately auth-required or behind anti-bot protection, add to the allowlist with a comment.
- **Example code / mock paths:** if your prose includes example URLs that aren't real (e.g., `https://api.example.com/v1/users`), either wrap them in code blocks (the lint skips indented code) or add to the allowlist. Prefer code blocks.

## Related patterns

- **Trust-but-verify** (`METHODOLOGY.md` § Trust-but-verify) — the broader policy this pattern is the mechanical half of
- **Test discipline** (`test-discipline-pattern.md`) — another preventive control that enforces mechanical gates at the build stage
- **DoD verification ladder** (`dod-verification-ladder-pattern.md`) — the gate framework that integrates all three checks
