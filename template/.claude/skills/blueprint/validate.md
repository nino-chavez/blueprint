# /blueprint-validate

Validation phase of a the original employer-prefixed name initiative. Fact-checks claims, audits copy/UX, and verifies feasibility against source code.

## When to use
Before sharing any deliverable with stakeholders. Run after docs and prototype are built.

## What it does

### 1. Fact-check documents against screenshots
For every claim about the current product state:
- Open the relevant screenshot
- Verify the claim is accurate
- Flag: ACCURATE / INACCURATE / PARTIALLY ACCURATE / UNVERIFIED
- For inaccurate claims: provide the fix with evidence

### 2. Fact-check documents against source code
If `research.codebase_path` is set:
- For every claim about what exists in the codebase, verify by reading the actual files
- Check: do the models exist? Are the methods named correctly? Are the routes defined?
- Flag any dead code, stub views, or features behind feature flags
- Verify data availability for each proposed capability

### 3. Audit document quality
Run the four-check audit on every document:
- "So what?" placement
- Mental math in data presentations
- Logic gaps between sections
- Scannable format

### 4. Audit prototype copy and UX
For every prototype page:
- Check terminology against DESIGN.md rules
- Verify savings-first framing on all cost-related copy
- Confirm one primary CTA per page
- Check that PROPOSED markers are on all new components
- Verify current-state panel mapping is accurate

### 5. Cross-document consistency
- Same data presented the same way across all docs
- No redundant content (use cross-references)
- Reading order / document relationships stated
- Audience-appropriate detail level (no code in strategy docs)

## Output
A validation report with:
- Each claim, its verdict, and fix if needed
- Severity ranking: CRITICAL / HIGH / MEDIUM / LOW
- Specific text replacements for inaccurate claims

## When to re-run
- After any document revision
- After prototype copy changes
- After new research is incorporated
- Before every deployment
