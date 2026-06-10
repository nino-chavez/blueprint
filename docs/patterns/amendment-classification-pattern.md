---
canonical: true
---

# Amendment-Classification Pattern

**Status**: Promoted 2026-05-27 wave 27 from cross-consumer evidence (rally-hq 4 amendments + blueprint-redesign 6 amendments + explicit operator-named "10+ next cycle" forecast).

**Last updated**: 2026-05-27

**Source evidence**:
- `apps/rally-hq/blueprint/METHODOLOGY-AMENDMENTS.md` — 4 entries, hand-bucketed by priority (highest-severity-first) and impact-scope (single-consumer vs cross-consumer risk)
- `wip/blueprint-redesign/METHODOLOGY-AMENDMENTS.md` — 6 entries from a single session, hand-bucketed by wave-promotion order
- `wip/blueprint-redesign/WAVE-2-BACKLOG.md:76` (operator-named promotion-bar): *"Wave-N amendment-promotion ordering — six amendments shipped as 6 waves in this session. Future iterations may surface 10+ amendments; methodology might need a triage convention (which amendments are MVP vs deferred?)."*
- `wip/blueprint-redesign/METHODOLOGY-AMENDMENTS.md:48` (manual bucketing already in practice): *"Wave 14 = audit-chrome + portal.dir (RH §1). Wave 15 = chrome divergence classification (RH §1 gap 3). Wave 16 = brand_axes (RH §3). Wave 14 is the highest-priority load-bearing change (silent destruction risk against 4 consumers)."*

**Related patterns**:
- [template/docs/methodology/methodology-amendments-convention.md](../../template/docs/methodology/methodology-amendments-convention.md) — the append-only amendment file shape this pattern operates on
- [docs/_archive/2026-05-27-loom-inspiration-candidates.md](../_archive/2026-05-27-loom-inspiration-candidates.md) C4 — the inspiration candidate this wave closes
- [docs/_archive/2026-05-27-extended-audit-findings.md](../_archive/2026-05-27-extended-audit-findings.md) — the audit that drove promotion

---

## Why this pattern exists

Per the amendments convention, when ≥1 amendment is filed across initiatives, the methodology operator periodically greps all `METHODOLOGY-AMENDMENTS.md` files to find promotion candidates. With ≤5 amendments across ≤2 consumers, manual triage is cheap and works. The pattern this wave promotes activates when **amendment volume exceeds operator manual-triage capacity** — which two consumers have now signaled (blueprint-redesign forecast 10+/cycle; rally-hq + blueprint-redesign together already at 10 across recent sessions).

The amendments convention already declares the 3 scopes (`Per-initiative` / `Candidate for methodology promotion` / `Already promoted`). This pattern adds a **second axis** — *where the fix lands* — that the existing convention is silent on. Both axes are needed when amendment volume scales.

## The 4-bucket taxonomy (fix-location axis)

Every amendment fixes a problem at exactly one layer:

| Bucket | Meaning | Where the fix lands | Example from existing amendments |
|---|---|---|---|
| **consumer-local** | The problem is specific to this initiative's shape; no other consumer will hit it | Initiative repo only; never promoted upstream | rally-hq's "monetization audience-side missing" — specific to rally-hq's three-sided model |
| **template** | The methodology's template files (the substrate consumers stamp from) need updating | `template/` in the methodology source repo | Wave 17's promo-initiative scaffold contamination — `stamp.mjs` + reviewer banner enforcement |
| **reviewer** | A reviewer agent's rubric or gate-condition needs updating | `template/.claude/agents/blueprint/reviewers/` | Wave 19 — portal-pattern-conformance-reviewers needed a `REPLACE_FOR_PROJECT` grep check |
| **methodology** | The methodology's first-principles, taxonomies, or stage definitions need updating | `METHODOLOGY.md`, `docs/`, top-level conceptual artifacts | Wave 8 — design-discipline track added to METHODOLOGY.md |

The bucket is independent of the scope (an amendment can be `Candidate for methodology promotion` scope AND `reviewer` bucket — the candidacy is about whether it gets promoted; the bucket is about where the fix would land if promoted).

## The decision tree

When triaging an amendment (manually or automatically):

```
Does the fix only matter to this one initiative's domain shape?
├── Yes → consumer-local. Stays in initiative repo. Mark Scope: Per-initiative.
└── No → continue:
    │
    Does the fix change template files (stamp.mjs, reviewers, template/*)?
    ├── Yes, primarily reviewer rubric → reviewer bucket
    ├── Yes, primarily other template files → template bucket
    └── No (changes only docs/conceptual artifacts) → methodology bucket
```

The decision tree is mechanical when the fix has been authored. It is harder *before* the fix is authored — that's where automated classification adds value (suggests bucket from amendment text alone, accepting some misclassification).

## Manual vs automated triage — when to flip

**Stay manual when**:
- Total amendments across all consumers ≤ 10 in a rolling 30-day window
- The operator can grep `METHODOLOGY-AMENDMENTS.md` across initiatives in <5 minutes per pass
- Misclassification cost (an amendment files at the wrong bucket) is low because the operator reviews every promotion candidate anyway

**Flip to automated when**:
- ≥10 amendments in a 30-day window (the volume the blueprint-redesign operator forecast)
- Multi-amendment promotion sessions are common (multiple amendments per wave-promotion cycle)
- Cross-consumer pattern detection becomes the bottleneck (operator has to read all amendments to find the patterns that recur across consumers)

The flip is a build-vs-buy decision. Per the 2026-05-27 market comparison (`docs/_archive/2026-05-27-loom-market-comparison.md` C4): **buy via GitHub Copilot SDK** — amendments already live in markdown in initiative repos; a custom triage app shipped as a GitHub Action can classify by reading the AMENDMENTS file + emitting promotion-candidate labels. Per-developer pricing ($10-39/mo) fits Blueprint's distribution shape; closed-taxonomy SaaS options (Zendesk, Jira Rovo) do not.

## What this wave ships

**Doc-only this wave.** No tool, no reviewer, no schema change. The deliverable is:

1. This canonical pattern doc — names the 4-bucket taxonomy, the decision tree, the manual→automated flip criteria
2. Updates to the amendments-convention doc are NOT needed — this pattern composes ABOVE that doc (the convention is about file shape; this pattern is about classification of entries in the file)

**Defer to second-consumer adoption of automated triage**:
- Custom GitHub Action with Copilot SDK classifier
- 4-bucket label set in GitHub repo settings
- Aggregation across consumers (cross-consumer pattern detection)

The defer-bar matches waves 24-26: ship the pattern doc when 2+ consumers signal the need; ship the tool when ≥1 consumer adopts and reports back on accuracy. Today the consumers are still operating manually (and the manual process is documented as working); building the tool now is premature.

## When this pattern lands as a tool

The future tool's shape would be:

```yaml
# .github/workflows/triage-amendments.yml (consumer-side)
on:
  push:
    paths: ['**/METHODOLOGY-AMENDMENTS.md', '**/blueprint/METHODOLOGY-AMENDMENTS.md']
jobs:
  classify:
    runs-on: ubuntu-latest
    steps:
      - uses: nino-chavez/blueprint-amendment-triage@v1
        with:
          repo: ${{ github.repository }}
          methodology-source: nino-chavez/blueprint
          buckets: [consumer-local, template, reviewer, methodology]
```

The action reads new amendment entries, sends each through Copilot SDK with the bucket taxonomy as the classifier prompt, labels the issue/PR/commit with the suggested bucket, and notifies the methodology operator when the bucket is `template|reviewer|methodology` (the three upstream-promotion-candidate buckets).

The pattern doc above is sufficient for the manual workflow today. The tool sketch above is the build-when-triggered path.

---

## Cross-reference

Promotes inspiration-candidate **C4** from `docs/_archive/2026-05-27-loom-inspiration-candidates.md` based on the 2026-05-27 extended consumer audit (`docs/_archive/2026-05-27-extended-audit-findings.md`). Closes the C4 watch-and-promote loop. Loom's market analog (AI categorization of action items) is structurally similar but operates on a fixed taxonomy (action / decision / blocker); this pattern's taxonomy is methodology-distribution-specific (where the fix lands across the layered substrate).
