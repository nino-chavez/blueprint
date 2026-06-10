---
canonical: true
---

# METHODOLOGY-AMENDMENTS.md — Append-Only Convention

A Blueprint initiative that learns something new about HOW the methodology should be applied to its specific shape captures that learning in `METHODOLOGY-AMENDMENTS.md` at the initiative root. The file is append-only: every amendment is a new dated entry. Prior entries are not deleted or rewritten — they're the audit trail.

This convention is canonical methodology infrastructure. The file shape, the entry shape, and the append-only rule are all template-owned.

## Why this exists

Methodology learning happens at every initiative. The rally-hq monetization-axis miss, the blog session's "not a deliberation venue" diagnosis, the v3 chrome-canonical drift — all started as initiative-level learnings that eventually landed in the methodology repo. The path from "we noticed this in our initiative" → "this is in the methodology" runs through:

1. The initiative captures the learning in its own `METHODOLOGY-AMENDMENTS.md`
2. After a few initiatives capture similar learnings, the methodology repo promotes the pattern (new doc, new reviewer, new schema field)
3. The original initiative-level amendments remain as the audit trail that justified the methodology change

Without step 1, the path collapses. Learnings live in session transcripts that scroll past the cache window, or in commit messages on private branches no methodology operator reads. The 2026-05-25 reconciliation existed BECAUSE three sessions independently re-derived methodology insights — that re-derivation cost time precisely because there was no per-initiative amendments file the methodology operator could grep across.

## The file shape

Initiative root: `METHODOLOGY-AMENDMENTS.md`. Frontmatter optional. Reverse-chronological. Each entry is a section with this shape:

```markdown
## YYYY-MM-DD — <Short title of the amendment>

**Trigger**: <One sentence — what observation in the initiative prompted the amendment>
**Scope**: <Per-initiative | Candidate for methodology promotion | Already promoted (link to methodology PR/commit)>
**Status**: <Active | Superseded by <YYYY-MM-DD entry> | Promoted to methodology>

<Body — what the amendment is, why, what it changes about how the initiative runs the methodology>

**References**:
- <commit, PR, or session transcript link>
- <related amendment entries>
```

## Append-only rule

- New amendments append at the TOP of the file (reverse-chronological).
- Existing entries are not deleted. If an amendment is superseded, change its `**Status**:` line to `Superseded by <date>` and add a new entry that supersedes it.
- The body of an existing entry can be lightly edited for typos or clarity, but not for material content. Material updates are new entries.

## Three scopes, three meanings

| Scope | When to use | Example |
|---|---|---|
| **Per-initiative** | The amendment applies only to how THIS initiative runs Blueprint. It's not a general pattern. | "We skip Stage 5 (Documents) because this initiative is a one-pager + prototype only; replace the doc gate with a one-pager content audit." |
| **Candidate for methodology promotion** | The amendment is initiative-local now, but the operator believes it's a general pattern worth promoting. | "We added a personas-monetization-side column because cross-side cost was invisible without it. Likely useful for any multi-sided initiative." |
| **Already promoted** | The amendment has landed in the methodology repo. The entry remains as the audit trail. | "Confident preview rule (link to methodology PR)." |

## Reading the file across initiatives

The methodology operator periodically greps `METHODOLOGY-AMENDMENTS.md` across initiatives to find candidates for promotion:

```bash
# run from your workspace root (the directory that holds your initiatives)
for dir in wip/*/ apps/*/; do
  if [ -f "$dir/METHODOLOGY-AMENDMENTS.md" ]; then
    echo "=== $dir ==="
    grep -A 2 "Scope.*[Cc]andidate" "$dir/METHODOLOGY-AMENDMENTS.md"
  fi
done
```

Amendments scoped "Candidate for methodology promotion" that appear in 2+ initiatives are strong candidates for the next methodology bump.

## What goes in vs. what does NOT go in

**In:**
- New ways to run the methodology against your initiative's specific shape
- Methodology gaps the initiative discovered (e.g., "the SessionStart hook didn't load doc X")
- Local deviations from the standard pipeline (with reason)
- Hooks that the initiative added beyond what the methodology supplies

**NOT in:**
- Implementation decisions about the product itself (those go in `decisions/` ADRs)
- Day-to-day work tracking (use STATE.md or Hive)
- Code-level conventions (those go in the codebase or CLAUDE.md)
- Bug fixes in your initiative's own code (commit messages are sufficient)

The test: would a methodology operator reading this entry across N initiatives find it useful for evolving the methodology? If yes, it goes here. If no, it goes somewhere else.

## Relationship to ADRs

ADRs (`decisions/NNNN-*.md`) capture product/architectural decisions for the initiative. METHODOLOGY-AMENDMENTS.md captures methodology decisions for the initiative.

A pilot-profile amendment is an ADR (architectural — it changes downstream artifacts).
A "we skip Stage 5" amendment is a METHODOLOGY-AMENDMENTS entry (methodology — it changes how the pipeline runs).
A "we added a monetization-side column to personas" amendment is BOTH (methodology change AND a downstream artifact). Write both; cross-link.

## Cross-references

- Schema source: this file (canonical at `template/docs/methodology/methodology-amendments-convention.md`)
- Sibling conventions: `template/docs/methodology/pilot-profile-template.md`, `template/docs/methodology/personas-template.md`
- Trigger incident: 2026-05-25 three-session reconciliation; full diagnosis in `docs/_archive/2026-05-25-three-session-reconciliation.md`. The reconciliation existed because per-initiative learning didn't have a structured home; this convention is the encoded response.
