---
canonical: true
---

# Plain-Language & Diátaxis Pass — Methodology Pattern

A reusable audit-and-revision procedure for reader-facing copy. It makes a
surface's prose as plain as its reader needs, and organizes each page around a
single purpose (the Diátaxis model). Run it on any consumer's reader-facing
surfaces — a portal, a docs site, a knowledge base, a handoff package — new or
existing. This is the remediation the `terminology-linter` gate lacks: the
linter DETECTS internal jargon leaking into copy; this pass REWRITES the copy
plain and re-shapes it by purpose, without a glossary artifact.

This procedure is written to be executed directly. When you dispatch it, inline
this text into the agent's instructions — do not tell the agent to "go read the
plain-language pass." Describe what to do in words, here.

## Why this exists

On 2026-07-21 the `film-room` consumer's portal copy was a wall of insider
vocabulary: "provenance portal," "the adjudicated mock," "substrate,"
"harness-views," "portability boundaries," "headless CLI," "reader-job." Every
word was accurate to the operator; none of it landed for the person the portal
was actually for. The operator's instruction was blunt: "simplify all language
to the Diátaxis model, and to a person like they're a child or have a
concussion." The rewrite that followed — short sentences, jargon killed or
translated, each page written to one job — is the reference instance this
pattern is distilled from. It was then validated on `bc-subscriptions`
(2026-07-21): a four-site run across a real commerce project — internal
stakeholder portal, merchant guides, a vendor RFP package, and the developer +
handoff + spec canon — where the Step-1 reader-calibration split proved
load-bearing (the merchant guides got full plain-language while the vendor
contract and ADR-cited handoff invariants were held verbatim, 2 edits and 3
edits respectively). Two consumers have now run it, so treat the
plainness-calibration + Diátaxis procedure as canonical; keep refining it as
more consumers apply it.

The failure it prevents is subtler than "there is jargon." It is: **copy
written for the author's mental model instead of the reader's, and pages that
try to do four jobs at once.** Both make a reader work harder than the content
requires.

## Step 1 — Name the reader, set the plainness bar (do this FIRST)

This is the step the naive version skips, and skipping it is how a rewrite
damages good docs. "Plain" is relative to a reader. A subscriber portal and an
integration handoff do not share a reader, and must not share a bar.

Before touching a word, write one sentence: **who lands on this surface, and
what do they already know?** Then set the bar from the table:

| Reader | Examples | Bar | Domain vocabulary |
|---|---|---|---|
| **Lay** | end subscriber, a merchant with no technical background, a club director | Grade ~5–7. Explain like to a sharp friend who knows nothing about the domain. | Kill nearly all of it. Translate every technical term into plain words. |
| **Practitioner** | merchant admin, ops user, operator | Grade ~7–9. Plain connective prose; keep the product's own nouns. | Keep the product's nouns (subscription, plan, dunning, invoice). Define each on first use, inline. |
| **Developer / integrator** | GSI package reader, integration engineer, the team receiving a handoff | Clarity and structure, NOT a lower reading level. | KEEP full technical precision. "webhook," "idempotency," "proration," "entitlement," "endpoint" are the correct register — stripping them destroys meaning. |

The split that governs the whole pass:

- **Incidental jargon** — internal codenames, methodology vocabulary, needless
  abstraction ("provenance," "substrate," "adjudicated," "harness," "leverage,"
  "surface" as a verb). This is noise for every reader. **Kill it or rewrite it
  plain.**
- **Load-bearing domain vocabulary** — the precise term the reader needs and, at
  the developer bar, already knows. **Keep it. Define it on first use if the
  reader might not know it. Never move it to a glossary** (glossaries are
  banned — define inline, in a clause, or not at all).

If a surface's reader is developer-facing, say so out loud before rewriting, and
confirm the intent is "clearer structure, keep the technical terms" — not
"drop to grade-3." That is not overriding a "make it simple" instruction; it is
resolving *simple for whom* so you don't shred load-bearing precision on real
docs.

## Step 2 — Audit (find the problems)

Read the surface as its reader. Inventory, per page:

1. **Incidental jargon** present (list the terms).
2. **Undefined domain terms / acronyms** used before they are explained.
3. **Long or stacked sentences** — more than one idea per sentence, clause
   piled on clause, passive constructions hiding the actor.
4. **Purpose confusion** — a page trying to be a tutorial, a reference, and an
   argument at once (see Step 4).
5. **Author-model framing** — copy that names the system's internals instead of
   what the reader gets or does.

## Step 3 — Revise (rewrite plain, to the bar from Step 1)

- **Short sentences.** One idea each. Aim 8–18 words at the lay/practitioner
  bar; up to ~25 is fine for reference or developer prose where precision needs
  the room.
- **Common words for the connective tissue.** The verbs and glue should be
  ordinary even when the nouns are technical.
- **Active voice, concrete subject.** "The tool saves your files," not "Files
  are persisted by the system."
- **Kill incidental jargon** by rewriting into plain equivalents. Examples from
  the reference instance: "provenance" → "the record of how it was built";
  "substrate" → "the saved event data"; "headless CLI" → "it also runs from the
  command line."
- **Keep load-bearing domain terms**; define on first use in a clause the first
  time only. "a webhook (a message we send your server when something changes)."
- **Cut** hedging, marketing adjectives, and em-dash-stacked clauses.
- **Keep a calm, respectful tone.** Plain is not baby-talk and not
  condescension.

## Step 4 — Organize by Diátaxis (one job per page)

Diátaxis says every documentation page serves exactly one of four purposes.
Mixing them is what makes docs tiring. The four, in words:

- **Tutorial — learning by doing.** A guided first run for a beginner: "do
  these steps with me and you will have done X." Success is the reader finishing
  with a working result, not understanding every why.
- **How-to — a task recipe.** Ordered steps to reach one specific goal, for
  someone who already knows what they want. No teaching, no theory — just the
  path to the outcome.
- **Reference — look it up.** Dry, accurate, complete description of how a thing
  is: screens, fields, endpoints, config, limits. Optimized for scanning and
  trust, not for narrative.
- **Explanation — the why.** Background, trade-offs, decisions, context. Answers
  "why is it built this way," not "how do I do it."

Assign each page ONE purpose. Then move mismatched content to the page whose
purpose it fits: a how-to that keeps explaining loses the doer; a reference that
tells a story loses the scanner. Where it fits an existing text slot, a one-line
signpost naming the page's kind helps the reader (do not add new components or
sections to force it).

## Hard constraints (do not cross these)

- **Change only human-readable prose** — titles, headings, paragraphs, list
  text, card/label copy, `description=` and meta text. Never touch imports,
  components, props, data-loading, routes, CSS classes, structure, config
  values, IDs, frontmatter keys, or file names.
- **API/contract examples are load-bearing.** Do not reword field names, code
  fences, request/response payloads, CLI flags, or example values. Their wording
  is the contract.
- **Rewrite SOURCE, not generated output.** If a surface is derived (a
  generator builds it from other files), edit the source or templates the
  generator reads — never the build output, which is overwritten. Then re-run
  the generator and confirm the plain copy survives into the output.
- **Preserve every interpolation and escape exactly** — `${count}`, ternaries,
  unicode escapes (`→`), and quote-escaping inside string arrays. A bare
  apostrophe dropped into a single-quoted string breaks the build.
- **Preserve every fact. Invent nothing.** Keep every number, claim, and
  decision; say it more simply. If you are unsure a claim is true, keep the
  original meaning rather than embellish. (Audit discipline: a plain lie is
  still a lie.)

## Step 5 — Verify

1. **Build or regenerate** the surface; confirm it still builds. For derived
   surfaces, run the generator and confirm the rewritten copy reached the
   output.
2. **Jargon check** — the incidental terms are gone; every kept domain term is
   defined on first use.
3. **Fact check** — every number and claim survived unchanged.
4. **Run the project's own doc gates** if it has them (e.g. a docs audit,
   doc-redteam, handoff-lint, or the `terminology-linter`). The pass must not
   fight the project's existing checks — read any project glossary first so you
   do not simplify away a term the project treats as canonical.

## How to run it across many surfaces

- **One agent per surface.** Give each agent: the reader and bar (Step 1), the
  exact editable SOURCE paths, and this procedure inlined. Do not fan out one
  identical prompt across surfaces with different readers — a lay portal and a
  developer handoff need different bars.
- **Serialize surfaces that share a source.** If a knowledge base derives from
  the same files a handoff site uses, rewrite the shared source once, then
  regenerate both — parallel edits to a shared source collide.
- **Do the closest-to-validated surface first**, confirm the procedure holds on
  the real content, then fan out. Promote the pattern only after a second
  consumer has run it.

## Relationship to the terminology-linter

`terminology-linter` (Stage 5 → 6 gate) answers *is internal jargon leaking?* —
a binary check that BLOCKS. This pass answers *rewrite it plain, for this
reader, organized by purpose.* The linter finds; this pass fixes and reshapes.
Both obey the no-glossary rule: the remedy is a rewrite or an inline first-use
definition, never a `docs/terminology.md` artifact.

## Cross-references

- Detection gate: `template/.claude/agents/blueprint/reviewers/terminology-linter.md`
- Doc quality gate: `template/.claude/agents/blueprint/reviewers/doc-quality-auditor.md`
- Reference instance: `film-room` portal rewrite, 2026-07-21 (five pages: home
  as orientation, console as reference, running-it as how-to, under-the-hood and
  decisions as explanation).
