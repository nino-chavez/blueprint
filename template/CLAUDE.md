# BigInitiative Project

## Document Generation

Follow the Internal Strategy voice for all documents:
- Short context paragraphs + bullets/tables for facts
- "So what?" in the first sentence of every section
- Tables show conclusions, not require mental math
- No logic gaps between sections
- No metadata fluff (Type: POV / Mode: advisory)

### Document Quality Audit

Before sharing, validate every section:
1. Is the takeaway in the first sentence, or buried?
2. Do data presentations require mental math?
3. Does any section contradict another?
4. Is context trapped in paragraphs where it should be scannable?

### Anti-Patterns

1. **Blog voice** — no narrative arcs, no provisional hedging
2. **Book prose** — no burying lists in sentences
3. **Slide-as-doc** — if content needs tables, use document format

## Prototype Design

See `prototype/DESIGN.md` for full rules. Key points:
- Match the existing product's design language
- Use savings-first framing for cost-related copy
- One primary CTA per page
- Mark new components as PROPOSED
- Add current-state screenshots for comparison

## Converter

`node docs/scripts/md-to-docs.mjs docs/content/my-doc.md --out docs/deliverables/`
