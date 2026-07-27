---
canonical: true
stage: 2
status: seeded
date: 2026-05-26
supersedes: none
informs:
  - portal/_meta/index.json (manifest taglines + group labels)
  - portal/templates/wedge-page.html (meta-strip + body conventions)
  - brand/blueprint-brand-kit.json (voice block; forge-brand generate voice extends)
sources:
  - 03-brand-brief.md (B6 voice rules)
  - 2026-05-26 operator grilling session (4-question voice-spine extraction)
related:
  - apps/blog/docs/signal-dispatch-voice-guide.md (operator's published-prose voice; Blueprint's voice is distinct because audience is agent + operator + stakeholder, NOT blog reader)
---

# Blueprint Voice Rules — v0.1

Voice rules for Blueprint-the-product: docs, CLI output, portal microcopy, error messages, methodology prose. Distinct from operator's published-prose voice (`signal-dispatch-voice-guide.md`) because the audience is the agent + operator + stakeholder loop, not a blog reader.

Extracted from a 4-question operator grilling session on 2026-05-26. Spine documented below; concrete examples + anti-patterns will be extended by `forge-brand generate voice` invocation against `brand/blueprint-brand-kit.json` once this seed is ratified.

## The four-axis spine

### Axis A — Address: methodology-as-actor in third-person abstract

The methodology / the CLI / the stamper / the init flow / the portal is the subject of declarative sentences. **The reader is the observer, not the actor**. Don't address the reader as "you" except in direct-instruction contexts (e.g., `--help` output, error-recovery hints).

Apparent tension resolved: the operator picked both *"Blueprint asks the variant"* (methodology-as-actor) AND *"The methodology produces..."* (third-person abstract, no brand-name subject). The reconciliation: **Blueprint IS the actor, but the actor is named by ROLE, not by BRAND.**

```
✓ The methodology declares variants in blueprint.yml.
✓ The CLI asks three questions at init.
✓ The stamper writes the chrome at scaffold time.
✗ Blueprint declares variants in blueprint.yml.        (brand-name as subject)
✗ You declare the variant in blueprint.yml.            (reader-as-actor)
```

Subject taxonomy:

| Role-name | When |
|---|---|
| `the methodology` | high-level architectural claims, stage definitions, variant decisions |
| `the CLI` / `@blueprint/cli` | command-line tool actions, init flow |
| `the stamper` | `stamp.mjs` operations (scaffold, restamp-chrome) |
| `the init flow` | scaffold-time interactions specifically |
| `the portal` | stakeholder-facing surface |
| `the dictionary` / `the audit` / `the brief` | named artifacts |
| `the SessionStart hook` | runtime methodology-loading behavior |
| Pronoun "Blueprint" | acceptable for pronoun-disambiguation OR in titles / headers, NOT in routine subjects |

### Axis B — Hedging: grounded, not zero-hedged or academic

Settled facts are stated declaratively. Proposals are named as proposals. The recommended path is named as recommended. No academic hedging (`may`, `typically`, `generally`, `depending on`) and no zero-hedging absolutism.

```
✓ Wedge 1 is the proposed closure for Gap 1.
✓ The recommended path is npx @blueprint/cli init.
✓ For greenfield initiatives, the diagnose stage is skipped.
✓ The dictionary closes audit-gap 1 structurally; visible closure ships in Stage 3.
✗ Wedge 1 closes Gap 1.                                (zero-hedging on a proposal)
✗ Wedge 1 may close Gap 1, depending on adoption.     (academic hedge stack)
✗ The recommended path is generally npx @blueprint/cli init.  (qualifier spray)
```

Grounded markers in Blueprint's vocabulary: `the proposed`, `the recommended`, `for X, the path is`, `structurally closes`, `defers to`, `is operator-blocked`, `is candidate for`.

Anti-pattern markers (NEVER use): `may`, `might`, `could`, `would tend to`, `typically`, `generally`, `often`, `usually`, `depending on`, `it is possible that`.

### Axis C — Surface cadence: audience-tuned, shared register

Same voice principles across all surfaces; length and explanatory depth tune to audience.

| Surface | Cadence | Length | Subject density |
|---|---|---|---|
| CLI output | terse imperative, fact-only | ≤8 words per output line | high (one role-subject per line) |
| Docs / methodology prose | methodical-explanatory | full sentences, paragraph-formed | medium (subjects can recur across sentences) |
| Portal microcopy | neutral-confident | brief but full sentences | low (subject often implicit) |
| Error messages | precise, recovery-led | one fact + one fix | high |
| Success confirmations | understated declarative | one fact, no celebration | medium |

```
CLI:     Variant declared: brownfield.  Tier: 1.  Pattern: B.
Docs:    The variant declaration constrains which stages apply.
         Brownfield initiatives run a current-state diagnose stage
         before prescription; greenfield initiatives skip it.
Portal:  Audit-gap 2 closed via the theme registry.
Error:   blueprint.yml missing required field 'variant'.
         Fix: add 'variant: greenfield | midstream | brownfield | research'.
Success: Stamp complete. 8 files written. 0 conflicts.
```

### Axis D — Self-reference: role-names, never brand-name as subject

(Subsumed in Axis A — listed here for completeness.) The brand-name "Blueprint" appears in:
- Page titles, document titles, header logos
- Methodology-level claims where disambiguation matters ("Blueprint produces deliverables, Lopopolo's harness produces code")
- Pronoun-position never (no "Blueprint's methodology asks..." — use "the methodology asks...")

The brand-name does NOT appear as the subject of routine declarative sentences. The methodology / the CLI / the stamper / the portal does the work; the brand-name labels the system, not the verbs.

## Anti-patterns (carry-forward checklist)

Apply during prose review before publishing any Blueprint-the-product output:

1. **Reader-as-actor** — any sentence with "you" as subject in non-instructional context. Replace with role-subject.
2. **Brand-name as subject** — any sentence starting "Blueprint [verb]..." in routine prose. Replace with role-subject.
3. **Academic hedge stack** — any sentence with two+ qualifiers (`may`, `typically`, `often`, `depending on`). Trim or recommit as grounded.
4. **Zero-hedge over-claims** — settled facts pose as fact; proposals must be named as proposals. Check verb tense + naming.
5. **Voice drift across surfaces** — CLI output writing in docs cadence (verbose) or docs writing in CLI cadence (cryptic). Match audience.
6. **Corporate-jargon vocabulary** — `leverage`, `synergy`, `unpack`, `circle back`, `deep dive`, `drive value`, `holistic`. NEVER. Inherits the operator's published-prose anti-patterns.
7. **Celebration language** — success messages stay understated. No `great`, `awesome`, `perfect`, `absolutely`. Stating the result IS the celebration.
8. **Subject-implicit ambiguity** — passive voice ("Variants are declared in blueprint.yml") can sometimes work, but if the named role-subject would clarify, prefer it ("The methodology declares variants in blueprint.yml").

## Carry-over from operator's published-prose voice

Compatible:
- Anti-corporate-jargon (entire list — see `signal-dispatch-voice-guide.md` § corporate-jargon)
- Anti-celebration ("great" / "awesome" / "perfect" are banned across both voices)
- Short sentence default (Blueprint inherits ~12-word median sentence target)

Distinct (because audience differs):
- Operator's published voice is self-interrogating + provisional ("but wait — is that actually true?"). Blueprint's voice is **grounded, not self-interrogating**. Methodology product shouldn't perform doubt about its own decisions; it declares decisions confidently with their named provisional status.
- Operator's published voice is conversational + colloquial. Blueprint's voice is **precise, methodical**. Solution Architecture register.
- Operator's published voice frequently uses imperative openings ("Stop. Look at the actual error."). Blueprint's voice uses role-subject openings ("The CLI fails when X. The recovery is Y.").

## What this artifact does NOT do

- Does not generate the full anti-pattern + example corpus that `forge-brand generate voice` produces. The seed above goes into `brand/blueprint-brand-kit.json` → voice block; generator extends it with proposed anti-patterns + examples; operator ratifies.
- Does not specify error-message templates (next iteration once `@blueprint/cli` exists).
- Does not specify portal microcopy library (this initiative's portal copy can serve as the canonical reference once it's audited against these rules).

## Closure path

1. Seed the kit's voice block with the four axes + role-name taxonomy.
2. Run `forge-brand generate voice --kit brand/blueprint-brand-kit.json` to produce anti-pattern + example proposals.
3. Operator ratifies generator outputs; merge into this artifact.
4. Audit existing Blueprint outputs (CLI mock, docs, portal copy) against the rules; fix violations.
5. Promote this artifact from `seeded` → `ratified` when audit completes clean.

## References

- `decisions/03-brand-brief.md` § B6 — the operator-blocked decision this artifact closes
- `apps/blog/docs/signal-dispatch-voice-guide.md` — operator's published-prose voice (compatible anti-patterns, distinct register)
- `tools/forge-brand/src/cli/index.ts generate voice` — generator that extends this seed
