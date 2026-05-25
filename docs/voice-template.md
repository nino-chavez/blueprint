# Voice Template — Internal Strategy

Canonical voice reference for Blueprint deliverables. Loaded on demand; not inlined into per-initiative `CLAUDE.md`. Reviewer agents (`doc-quality-auditor`, `terminology-linter`) enforce the rules in this doc.

## When to use which voice

Per `blueprint.yml` `voices:` block. The default per document type:

| Document type | Voice mode | Characteristics |
|---|---|---|
| Strategy / CX plan / Diagnose | `internal-strategy` | "We" voice, scannable, named owners |
| Technical feasibility / Prescription | `solution-architecture` | Precise, code references, open questions, options/trade-offs |
| Market research / Diagnose evidence | `evidence-led` | Cited sources, pattern → decision mapping |
| Integration plan / Design brief | `solution-architecture` | Code examples, phased rollout, named risks |

If `signal_forge.enabled: true`, the voice guides at `signal-forge/docs/voice/` are authoritative and this doc defers to them. Otherwise these rules apply.

## Internal Strategy — the core voice

- "So what?" in the **first sentence** of every section. Never bury the takeaway.
- Short context paragraphs (1-3 sentences) for "why," then structured elements (bullets, tables) for "what"
- Bullets for lists of facts, tables for data with comparison
- Bold labels for scannability
- Options presented as **benefit / trade-off / risk** triplets
- Named owners and deadlines on every open question and next step

## Quality audit — run before sharing

Every document passes these five checks. The `doc-quality-auditor` reviewer agent enforces them at the Stage 5 → Stage 6 gate.

1. **"So what?" placement** — Is the takeaway in the first sentence of each section, or buried? Sections that take ≥3 sentences of context before the conclusion fail.

2. **Mental math** — Do tables show conclusions, or require calculation? A raw-numbers table without a "so what" column or summary row fails. Bullet lists of numbers without comparison framing fail.

3. **Logic gaps** — Does any section contradict another? Cross-check claims across sections. Implicit contradictions (e.g., "this is the primary use case" appearing twice with different content) count as gaps.

4. **Scannable format** — Is context trapped in paragraphs? Paragraphs >5 sentences carrying multiple facts that could be a bulleted list fail. Walls of prose where a table would land cleaner fail.

5. **Methodology statement for derived data** — If the doc presents a percentage breakdown but also says a portion is uncategorized / unlabeled / UNVERIFIED, the doc must explicitly state how the breakdown was derived. The skeptical reader's "how do you know X if Y% is uncategorized?" must be answered in the doc.

## Citation rules

The `fact-check-loop-reviewer` (and its `citation-checker` sub-agent) enforce these at the Stage 4 convergence loop.

- **Every factual claim must cite a source.** "Industry data shows..." is not a citation.
- **External sources include a URL.** Not just a publisher name.
- **Internal data cites the person, date range, and methodology.** "Customer interviews, Q1 2026, n=12, conducted by N. Chavez" — not "internal research."
- **Unverifiable claims marked `UNVERIFIED`** at the same point in the doc. Never present unverified at the same confidence level as verified.

## Anti-patterns (universal)

The `terminology-linter` enforces the term-level bans; doc-quality-auditor catches the structural ones.

1. **Blog voice** — no narrative arcs, no provisional hedging in internal strategy docs. "Maybe we should consider..." → "We will." Provisional hedging belongs in thought-leadership writing, not internal strategy.

2. **Book prose** — no burying lists in sentences. "The three options are X, Y, and Z" should be a bulleted list, not a sentence.

3. **Slide-as-doc** — if content needs tables, use document format. Don't treat a doc like a deck with bullet stubs.

4. **Duplicate content across docs** — cross-reference, don't repeat. Two docs saying the same thing in slightly different words is drift waiting to happen.

5. **Unsourced claims** — see Citation Rules. Every number, every "studies show," every benchmark needs a source.

6. **"Deflection" language** — never use "deflect" or "deflection" to describe reducing support cases. Use "self-service resolution" or "resolve without support." Deflection implies pushing customers away from help; the framing matters.

7. **Internal jargon in user-facing copy** — see `terminology-linter` rules. User-facing copy uses the product's vocabulary, never internal team jargon.

## When targeting BC B2B Edition

Apply only if `blueprint.yml` has `b2b_edition.enabled: true`. See `docs/voice-b2b-addendum.md` for B2B-specific anti-patterns and actor-naming rules.

## Origin

Distilled from the BigCommerce Pricing & Packaging CX initiative (March 2026) and refined across Rally HQ, website-nc-v3, and Signal Dispatch blog audits. Moved out of `template/CLAUDE.md` 2026-05-25 per the context-efficiency sweep — voice rules are too long to inline per-session.
