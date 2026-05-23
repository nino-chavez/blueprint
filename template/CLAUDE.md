# the original employer-prefixed name Project

Agent-assisted jig for product planning, prototyping, and stakeholder alignment. See `blueprint.yml` for project configuration.

## Optional Capabilities (Check `blueprint.yml`)

If your initiative has any of these enabled, follow the linked guidance:

| Flag | Reference doc | Read when starting |
|---|---|---|
| `b2b_edition.enabled: true` | `~/Workspace/dev/tools/big-blueprint/docs/bc-b2b-edition-context.md` + `bc-b2b-buyer-portal-integration.md` | Stage 1 research; copy both into `research/current-state/` |
| `hive.enabled: true` | `~/Workspace/dev/tools/big-blueprint/docs/hive-coordination-pattern.md` | Session start — register with Hive before any work |
| `cloudflare.enabled: true` | `~/Workspace/dev/tools/big-blueprint/docs/cloudflare-deployment-pattern.md` | Before writing infra code; produce ADR for CF resource inventory |
| `archaeology.enabled: true` | `~/Workspace/dev/tools/big-blueprint/docs/archaeology-substrate-pattern.md` | Stage 0 (project init) — run `bash tools/archaeology/scaffold.sh` BEFORE first commit so capture is live from minute one. Track 1-3 docs (`docs/inputs/`, `docs/iterations/`, `docs/audits/`) get auto-ingested. |
| `owner_spec.enabled: true` | `~/Workspace/dev/tools/big-blueprint/docs/owner-spec-pattern.md` | When project has >3 substrate tools — author `OWNER-SPEC.md` at `tools/<x>/OWNER-SPEC.md` capturing design rationale, failure modes, coupling, maintainer playbook. Freshness lint at `tools/owner-spec-lint/` (per-PR warning + nightly staleness report). Convention: `docs/methodology/owner-spec-convention.md`. Layer-B skills at `~/.claude/skills/<tool>-expert/` layer on top — never build a skill without an OWNER-SPEC first. |
| Marketplace app (any BC initiative) | `~/Workspace/dev/tools/big-blueprint/docs/bc-marketplace-context.md` | Stage 1 research; copy into `research/current-state/` |

## Pipeline

```
/blueprint-research → /blueprint-prototype → /blueprint-docs → /blueprint-validate → /blueprint-deploy
                                                                                            │
                                                                                            ▼
                                                                                  /blueprint-triage  (after stakeholder feedback)
```

Each stage has a skill definition in `.claude/skills/blueprint/` and uses agents defined in `.claude/agents/blueprint/`.

## Skills

| Command | Stage | What it does |
|---------|-------|-------------|
| `/blueprint-research` | Research | Codebase exploration, competitive analysis, market comparables |
| `/blueprint-prototype` | Prototype | Build HTML pages, strategy panels, current-state panels, landing page |
| `/blueprint-docs` | Documents | Generate strategy, feasibility, research, integration docs |
| `/blueprint-validate` | Validate | Fact-check against screenshots/code, audit quality. Diagnose-loop structured (build feedback loops → reproduce → hypothesise root cause → fix at cause) |
| `/blueprint-deploy` | Deploy | Package and deploy to Vercel |
| `/blueprint-triage` | Post-demo | Triage stakeholder feedback through state machine (bug / scope-add / opinion / question / kudos) with explicit dispositions |

## Agents

| Agent | Role |
|-------|------|
| `researcher` | Codebase exploration, screenshot analysis, web research, market benchmarks |
| `prototype-builder` | HTML/CSS pages matching existing product, strategy/current-state panel config |
| `doc-writer` | Strategic documents in internal-strategy voice with quality audit |
| `validator` | Fact-checking, quality audit, cross-document consistency |

## Document Voice: Internal Strategy

- "So what?" in the first sentence of every section
- Short context paragraphs (1-3 sentences), then bullets/tables for facts
- Bold labels for scannability
- Named owners and deadlines on every open question

### Quality Audit (before sharing)

1. Is the takeaway in the first sentence, or buried?
2. Do data presentations require mental math?
3. Does any section contradict another?
4. Is context in scannable format?
5. **Methodology check:** If data is presented with specific percentages or breakdowns, is the methodology stated? If a large portion of the data is uncategorized/unlabeled, does the doc explain how the breakdown was derived? A skeptical reader will ask "how do you know X if Y% is uncategorized?" — the document must answer this.

### Citation Rules

- Every factual claim must cite a source
- External sources must include a URL (not just a name)
- Internal data must cite the person, date range, and methodology
- If a claim cannot be verified, mark it as UNVERIFIED — do not present it at the same confidence level as verified claims

### Anti-Patterns

1. **Blog voice** — no narrative arcs, no provisional hedging
2. **Book prose** — no burying lists in sentences
3. **Slide-as-doc** — if content needs tables, use document format
4. **Duplicate content** — cross-reference other docs, don't repeat
5. **Unsourced claims** — every number needs a source. "Industry data shows..." is not a citation.
6. **"Deflection" language** — never use "deflect" or "deflection" to describe reducing support cases. Use "self-service resolution" or "resolve without support." Deflection implies pushing customers away from help.

### Additional Anti-Patterns When Targeting BC B2B Edition

(Apply if `blueprint.yml` has `b2b_edition.enabled: true`. See `docs/bc-b2b-edition-context.md` §10 for full list.)

7. **Calling B2B APIs from the browser.** `B2B_API_TOKEN` is server-only. Always proxy through your BFF.
8. **Treating "customer" and "buyer" as synonyms.** Customer is BC core; Buyer is B2B Edition entity tied to a Company. Use Buyer in B2B-specific copy.
9. **Using "RFQ" in user-facing copy.** BC's term is "Quote." RFQ is industry jargon, but the platform consistently uses Quote.
10. **Showing all products to all buyers.** Customer Groups + Categories = restricted catalogs. Mock data must respect this.
11. **Skipping the on-cart-created listener.** Quote-to-checkout breaks silently without it. Always wire.
12. **Designing buyer flows without naming the actor.** "User creates quote" is ambiguous. "Junior Buyer creates quote, routed to Senior Buyer" is the actual flow. See multi-actor role pattern in `bc-b2b-edition-context.md` §5.

## Prototype Design

See `prototype/DESIGN.md`. Key rules:
- Match existing product design language
- Mark new components as PROPOSED
- Customer terminology (check the product for actual labels)
- Savings-first framing
- One primary CTA per page
- Progressive disclosure

## Configuration

Edit `blueprint.yml` for: execution depth, voice modes, prototype settings, research scope, document package.

## Converter

`node docs/scripts/md-to-docs.mjs docs/content/my-doc.md --out docs/deliverables/`
