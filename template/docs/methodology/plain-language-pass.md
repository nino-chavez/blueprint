---
canonical: true
---

# Reader-Clarity & Diátaxis Pass — Methodology Pattern

A reusable audit-and-revision procedure for reader-facing copy. It makes a
surface as clear as its reader needs without erasing technical precision or
deliberate voice. Run it on any consumer's reader-facing surfaces — a portal, a
docs site, a knowledge base, a handoff package, generated copy, or UI — new or
existing. Diátaxis applies to documentation structure; it is not a universal
shape for controls, captions, essays, or chat answers. This is the remediation
the `terminology-linter` gate lacks: the linter detects lexical leakage; this
pass repairs the reader's actual encounter.

## Position in the writing stack

Reader clarity is one layer of a larger decision order. Apply the layers in
this sequence; a later layer cannot repair an earlier failure:

1. **Truth and evidence** — keep verified or observed evidence, stakeholder
   reports, and agent hypotheses distinct. The Mom Test pattern governs human
   evidence collection; it is not a prose style.
2. **Reader and job** — declare the reader, their task, and the artifact's
   primary purpose. Diátaxis assigns jobs to documentation only.
3. **Argument** — organize the material under one controlling point. Minto and
   SCQA may help identify the reader's question and put the answer first; do not
   expose those labels or their consultant cadence by default.
4. **Cognitive load** — use explicit subjects, stable vocabulary, short blocks,
   and one idea per sentence when the material is difficult. “CTE-based
   writing” is local shorthand for respectful low-memory-load writing, not an
   established framework, a simulated diagnosis, or a grade-level target.
5. **Voice** — apply the declared register without weakening evidence, the
   reader's job, or precision locks.
6. **Surface mechanics** — apply documentation, portal, email, chat, or public
   prose conventions only to their own surfaces.

Counts, sentence lengths, question rates, and other corpus measurements are
diagnostics unless a local contract explicitly promotes one to a gate. Do not
add a question, self-correction, process beat, or open ending merely to satisfy
a voice pattern. Agent or stakeholder steering during a session is not a change
in point of view unless new evidence changed the claim.

This procedure is written to be executed directly. When you dispatch it, inline
this text into the agent's instructions — do not tell the agent to "go read the
plain-language pass." Describe what to do in words, here.

## Why this exists

On 2026-07-21 the `film-room` consumer's portal copy was a wall of insider
vocabulary: "provenance portal," "the adjudicated mock," "substrate,"
"harness-views," "portability boundaries," "headless CLI," "reader-job." Every
word was accurate to the operator; none of it landed for the person the portal
was actually for. The operator repeatedly asked for explanations that would
still work with very little available working memory. Treat that as a severity
signal, not a literal voice: low cognitive load must remain respectful. The
rewrite that followed — answer first, short sentences, jargon killed or
translated, each documentation page written to one job — is the reference
instance this pattern is distilled from. It was then validated on `bc-subscriptions`
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

## Step 0 — Map the encounter and its owning sources

Before reading authoring files, identify what the reader actually receives:
rendered HTML, a live UI, generated Markdown, a document export, or a caption
payload. Build or regenerate it when possible.

Then trace every visible text path back to its owner. Copy often lives in
`blueprint.yml`, JSON, content collections, prompt templates, or database-backed
records rather than the component that renders it. Record the map in
`reader-contract.json` when the repository has more than one copy-bearing
surface. A source-only pass is incomplete until the rendered encounter has been
opened and checked.

## Step 1 — Name the reader, set the plainness bar (do this FIRST)

This is the step the naive version skips, and skipping it is how a rewrite
damages good docs. "Plain" is relative to a reader. A subscriber portal and an
integration handoff do not share a reader, and must not share a bar.

Before touching a word, write one sentence: **who lands on this surface, and
what do they already know?** Then set the bar from the table:

| Reader | Examples | Bar | Domain vocabulary |
|---|---|---|---|
| **Lay** | end subscriber, a merchant new to the domain, a club director | Ordinary connective language and enough context to act without project history. | Replace internal vocabulary. Keep a necessary public term only when the reader needs it, and define it nearby. |
| **Practitioner** | merchant admin, ops user, operator | Plain connective prose; assume the work, not the implementation. | Keep the product's useful nouns (subscription, plan, dunning, invoice). Define an unfamiliar one on first use. |
| **Specialist / integrator** | GSI package reader, integration engineer, the team receiving a handoff | Clear structure with full technical precision. | Keep exact terms such as webhook, idempotency, proration, entitlement, and endpoint. Stripping them destroys meaning. |

The split that governs the whole pass:

- **Incidental jargon** — internal codenames, methodology vocabulary, needless
  abstraction ("provenance," "substrate," "adjudicated," "harness," "leverage,"
  "surface" as a verb). This is noise for every reader. **Kill it or rewrite it
  plain.**
- **Load-bearing domain vocabulary** — the precise term the reader needs and, at
  the developer bar, already knows. **Keep it.** Define it on first use if the
  reader might not know it. Define inline by default. Use a glossary only when
  the repository's declared terminology policy requires controlled vocabulary.

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

- **One main idea per sentence when the material is difficult.** Treat sentence
  length as a review signal, not a grade-level target; precise reference or
  specialist prose may need more room.
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

## Step 4 — For documentation, organize by Diátaxis (one job per page)

Use Diátaxis to give each documentation page one primary purpose. Secondary
material is fine when it directly supports that job; unbounded mixing is what
makes docs tiring. The four, in words:

- **Tutorial — learning by doing.** A guided first run for a beginner: "do
  these steps with me and you will have done X." Success is the reader finishing
  with a working result, not understanding every why.
- **How-to — a task recipe.** Ordered steps to reach one specific goal, for
  someone who already knows what they want. Include only the context needed to
  follow the path safely; move broader teaching or theory elsewhere.
- **Reference — look it up.** Dry, accurate, complete description of how a thing
  is: screens, fields, endpoints, config, limits. Optimized for scanning and
  trust, not for narrative.
- **Explanation — the why.** Background, trade-offs, decisions, context. Answers
  "why is it built this way," not "how do I do it."

Assign each documentation page ONE primary purpose. A how-to that keeps
explaining loses the doer; a reference that tells a story loses the scanner. If
the authorized scope includes information architecture, move mismatched content
to the page whose purpose it fits. If the scope is prose-only, record the
required move as a finding instead of violating the scope or pretending wording
alone fixed the page.

## Hard constraints (do not cross these)

- **Change only copy-bearing values unless structural work was authorized** —
  titles, headings, paragraphs, list text, card/label copy, `description=` and
  meta text, including those values when they live in config or data files.
  Never change imports, components, data-loading behavior, routes, CSS classes,
  behavioral config, IDs, frontmatter keys, or file names during a prose-only
  pass.
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
- **Preserve claim status and scope.** A repo-grounded observation does not
  become a causal, quality, value, or population-level conclusion during a
  rewrite. A general claim does not become the author's personal experience,
  and one person's case does not become a general rule.

## Step 5 — Verify

1. **Build or regenerate** every affected surface; confirm it still builds.
2. **Open the rendered encounter** — confirm the rewritten copy reached the
   output and makes sense in its real navigation, control, and help context.
3. **Jargon check** — the incidental terms are gone; every kept domain term is
   defined on first use.
4. **Fact check** — every number and claim survived unchanged.
5. **Run the project's own gates** if it has them (e.g. `encounter-audit-reviewer`, a docs audit,
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
reader, organized by purpose.* `encounter-audit-reviewer` answers *did the fix
reach the built thing, and can the reader use it there?* The terminology posture
is local: inline definition is the default; a controlled glossary remains valid
when `blueprint.yml` or the product's own contract calls for one.

## Cross-references

- Detection gate: `template/.claude/agents/blueprint/reviewers/terminology-linter.md`
- Rendered encounter gate: `template/.claude/agents/blueprint/reviewers/encounter-audit-reviewer.md`
- Doc quality gate: `template/.claude/agents/blueprint/reviewers/doc-quality-auditor.md`
- Reference instance: `film-room` portal rewrite, 2026-07-21 (five pages: home
  as orientation, console as reference, running-it as how-to, under-the-hood and
  decisions as explanation).
