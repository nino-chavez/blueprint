# Methodology Amendments — {Initiative Name}

This file captures methodology-level learnings specific to this initiative. Append at the top; supersede via new entry; never rewrite history. Full conventions:

- File shape + 3-scope axis: `$BLUEPRINT_HOME/template/docs/methodology/methodology-amendments-convention.md`
- 4-bucket taxonomy (where fixes land): `$BLUEPRINT_HOME/docs/patterns/amendment-classification-pattern.md`

Per methodology rule, no entry here is automatically promoted upstream. Methodology promotion is a separate operator session after evidence accumulates across ≥2 consumers. This file is the audit trail.

---

<!-- Entries below, newest first. Delete this comment + the example entry when filing your first real amendment. -->

## YYYY-MM-DD — Example amendment title (delete this entry when filing your first real one)

**Trigger**: One sentence

**Scope**: Per-initiative | Candidate for methodology promotion | Already promoted

**Bucket**: consumer-local | template | reviewer | methodology

Bucket meanings: `consumer-local` stays in this initiative; `template` changes
stampable files or shared tools; `reviewer` changes a reviewer contract;
`methodology` changes `METHODOLOGY.md`, `docs/`, or another public conceptual
artifact.

**Status**: Active | Superseded by <YYYY-MM-DD entry> | Promoted to methodology

### What the amendment is

Plain-prose body. Describe the gap, the workaround applied (if any), the proposed fix, and the rationale. Cite specific files / commits / sessions where evidence lives.

### Downstream artifacts updated (if any)

- `path/to/prescription.yml` — added P-item N
- `path/to/synthesis.md` — section X updated
- `path/to/STATE.md` — current state revised

### Upstream Blueprint-template gap this exposes (if any)

If the amendment scope is `Candidate for methodology promotion`, name the specific template/reviewer/methodology surface that would need to change. The bucket field above declares the layer; this section names the file/contract.

**References**:
- Commit SHA / PR link
- Session transcript path
- Related amendment entries (`[[entry-date]]` or markdown links)
