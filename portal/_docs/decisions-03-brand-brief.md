---
canonical: true
stage: 2
status: operator-blocked
date: 2026-05-26
supersedes: none
informs:
  - portal/project-tokens.css (the destination for ratified brand decisions)
sources:
  - 02-design-system.md (§ L0 Class B — deferred brand tokens)
  - ../research/current-state/03-portal-surface-audit.md (§ audit-gap 2)
---

# Stage 2 Brand Brief — Blueprint-the-product

Operator-facing decision document for slice 4 of `decisions/02-design-system.md` § Implementation order. The L0 Class B tokens — brand color, type stack, surface treatment — were deferred from the design system because inventing them would reproduce the failure mode the methodology amendment exists to fix.

This brief names the decision points + the invocation path that closes audit-gap 2 (L0 borrowed from Rally HQ's Midnight & Copper palette via inherited canonical chrome).

## Why this is operator-blocked

The discipline declared in `decisions/02-design-system.md` § L0 Class B: an agent that invents a color palette, a font pairing, or a surface treatment for Blueprint-the-product reproduces the exact "agent fills void with templates" failure mode. The cross-audit reconciliation in `research/architecture/02-stage1-design-audit-template.md` validates this three times across three independent initiatives — including this one, where `project-tokens.css` is empty/commented and the inherited Rally HQ palette is visibly Rally HQ's, not Blueprint-the-product's.

Closing audit-gap 2 requires operator decisions about brand identity at the conceptual layer. The agent's role here is to surface what needs to be decided and to wire the forge-brand invocation; the brand decisions themselves are out-of-band.

## What needs to be decided

Eight decision points, ordered by upstream-leverage (each decision constrains the next):

### B1 — What is Blueprint-the-product, in one sentence?

Brand identity has to follow from what the thing IS. Candidate framings observable from the artifacts:

- "Agent-assisted pipeline for product planning, prototyping, and stakeholder alignment" (current METHODOLOGY.md tagline — process-led)
- "Production-quality methodology + scaffolding for initiative-scoped agent-assisted work" (current portal manifest tagline — outcome-led)
- "Blueprint applied to itself — Pattern B / Tier 1 / brownfield" (current portal footer — self-referential)

These read as drafts, not a settled identity. The brief needs an operator-ratified one-sentence identity statement that the visual + voice work can derive from.

### B2 — What is the brand register?

The register sits on the axis between editorial-architectural-precise (the prose-voice register Nino's signal-dispatch-voice-guide already defines) and consultant-deliverable-confident (Solution Architecture / Executive Advisory modes from the content-mode taxonomy). Blueprint v1 is a stakeholder-aligned methodology product; the register is likely closer to "editorial architectural" than "marketing SaaS." Operator confirms.

### B3 — Color palette

Currently borrowing Rally HQ's Electric Indigo (`--brand-*` hsl 235), Navy-Arena (`--arena-*`), Victory Gold (`--victory-*`), Live Coral (`--live-*`). Methodology-tool brand should probably NOT carry sport-app accent semantics. Two paths:

- **Operator-authored palette**: pick the hue (e.g., a quieter editorial accent) + accept forge-brand's WCAG validation.
- **forge-brand generator**: `npx tsx ~/Workspace/dev/tools/forge-brand/src/cli/index.ts generate palette --kit blueprint-brand-kit.json` — proposes options against the brand brief, validates contrast, operator picks.

### B4 — Type stack

Currently Inter (body/UI) + JetBrains Mono (mono) inherited from canonical chrome. The shared.css default loads Anton as `--font-hero` — a condensed display face that reads "sport poster," not "editorial methodology document." Blueprint-the-product's display register is closer to the Source Serif 4 / Inter combination from Signal Dispatch v2 work than Anton.

Decision: keep Inter + JetBrains Mono; replace Anton with an editorial display face (operator picks) OR drop the hero font entirely and use Inter weights 700-800 for hero treatments.

### B5 — Surface treatment (light/dark)

Currently `--bg: hsl(35, 25%, 98%)` (warm light cream from Rally HQ's Midnight & Copper system). Methodology docs typically read against warm-light backgrounds (lethain.com, Pragmatic Engineer, Stratechery all use warm-light). Likely retain shape but recalibrate to a Blueprint-specific neutral.

### B6 — Voice rules

The signal-dispatch-voice-guide.md covers prose voice for the operator's published work. Blueprint-the-product needs its own voice rules for: docs, error messages, CLI output (`@blueprint/cli` init wizard), portal microcopy. Distinct from operator's prose voice because the audience is "agent + operator + stakeholder" not "blog reader."

`forge-brand`'s `generate voice --kit ...` can propose voice rules from the brand brief; operator ratifies.

### B7 — Identity primitives (logo / wordmark)

The portal currently renders "Blueprint Redesign" as wordmark + accent. The methodology-product wordmark probably reads "Blueprint" (the redesign initiative is the dogfood, not the product). Operator decides:

- Is the wordmark just "Blueprint"?
- Is there a glyph / mark companion?
- What's the canonical lockup?

`forge-brand`'s `generate logo --kit ...` can produce concepts via AI image models; operator selects.

### B8 — Media templates

What artifacts does Blueprint-the-product ship? Social cards announcing methodology releases? Doc-page OG images? README banner? The brief should name the media template set; forge-brand's `media list` + `media render` produces them once the brief is settled.

## Invocation path (when operator is ready)

```bash
# Step 1 — Initialize brand-kit.json interactively or from this brief
cd ~/Workspace/dev/tools/forge-brand
npx tsx src/cli/index.ts init -o ~/Workspace/dev/wip/blueprint/template/brand/blueprint-brand-kit.json

# Step 2 — Run generators (each gates on operator approval)
npx tsx src/cli/index.ts generate palette --kit blueprint-brand-kit.json
npx tsx src/cli/index.ts generate fonts   --kit blueprint-brand-kit.json
npx tsx src/cli/index.ts generate voice   --kit blueprint-brand-kit.json
npx tsx src/cli/index.ts generate identity --kit blueprint-brand-kit.json
npx tsx src/cli/index.ts generate logo    --kit blueprint-brand-kit.json

# Step 3 — Export to consumer-side project-tokens.css
npx tsx src/cli/index.ts export css --kit blueprint-brand-kit.json -o ./blueprint-tokens.css

# Step 4 — Land ratified tokens in this initiative's project-tokens.css
# Merge ./blueprint-tokens.css :root block into portal/project-tokens.css :root
# under the "L0 Class B brand tokens" section. Re-run visual verification
# across the 5 wedge pages + front door + docs viewer + prototype studio.
```

The brand-kit.json itself belongs at the methodology repo level (`~/Workspace/dev/wip/blueprint/template/brand/blueprint-brand-kit.json`) because Blueprint-the-product is the brand owner, not this initiative. This initiative consumes the resulting tokens.

## What slice 3 of "do all in order" actually closes

Slice 3 in the instruction sequence was "invoke forge-brand for Blueprint-the-product." The agent cannot execute that without operator decisions because doing so would invent brand identity — the exact failure mode the methodology amendment exists to fix.

What slice 3 DOES close in this artifact:

1. **Decision points named** — 8 brief items above, each phrased as an operator question with the constraint context.
2. **Invocation path wired** — exact CLI commands, paths, and target file for the operator to follow when ready.
3. **Discipline honored** — no agent-invented brand decisions land in `portal/project-tokens.css`. The empty `project-tokens.css :root` block remains empty by design until the brief is ratified.
4. **Audit-gap 2 status update** — gap remains open; closure pathway is now explicit and operator-actionable rather than abstract.

## What this artifact does NOT do

- Does not invoke `forge-brand`. Operator runs the CLI when ready.
- Does not write speculative brand decisions into `portal/project-tokens.css`. Empty `:root` block stays empty.
- Does not rank the candidate B1 identity framings. Operator picks.
- Does not pre-commit to a palette family or a type stack. Operator decides via forge-brand's generator + review gates.

## Pickup state when operator returns

1. Read this brief.
2. Settle B1 (one-sentence identity) — everything downstream derives from it.
3. Run the forge-brand invocation path above; operator iterates with the generators.
4. Land the exported `:root` overrides into `portal/project-tokens.css`.
5. Run the visual verification pass across all 11 portal surfaces (5 wedge + front door + docs viewer + prototype studio + 3 chrome layers — though chrome is unaffected by `project-tokens.css` overrides).
6. Promote `decisions/03-brand-brief.md` status from `operator-blocked` → `ratified` with the settled brand brief inline.

## References

- `decisions/02-design-system.md` § L0 Class B — the deferred decision points this brief addresses
- `research/current-state/03-portal-surface-audit.md` § audit-gap 2 — the gap this brief closes
- `~/Workspace/dev/tools/forge-brand/` — the CLI tool that produces the artifacts
- `~/Workspace/dev/apps/blog/docs/signal-dispatch-voice-guide.md` — reference for Nino's published voice; Blueprint-the-product voice is distinct (different audience) but derives from the same operator's sensibility
- `METHODOLOGY-AMENDMENTS.md` § 2026-05-26 — the design-discipline track this brief honors
