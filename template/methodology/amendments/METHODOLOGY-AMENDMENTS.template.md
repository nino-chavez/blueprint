# Methodology Amendments — {Initiative Name}

This file captures methodology-level learnings specific to this initiative. Append at the top; supersede via new entry; never rewrite history. Full conventions:

- File shape + 3-scope axis: `~/Workspace/dev/tools/blueprint/template/docs/methodology/methodology-amendments-convention.md`
- 4-bucket taxonomy (where fixes land): `~/Workspace/dev/tools/blueprint/docs/amendment-classification-pattern.md`

Per methodology rule, no entry here is automatically promoted upstream. Methodology promotion is a separate operator session after evidence accumulates across ≥2 consumers. This file is the audit trail.

---

<!-- Entries below, newest first. Delete this comment + the example entry when filing your first real amendment. -->

## YYYY-MM-DD — Example amendment title (delete this entry when filing your first real one)

**Trigger**: One sentence — what observation in the initiative prompted the amendment

**Scope**: One of:
- `Per-initiative` — applies only to this initiative's specific shape
- `Candidate for methodology promotion` — operator believes it's a general pattern worth promoting
- `Already promoted` — landed in methodology repo at commit <SHA>

**Bucket** (per wave 27 classification taxonomy):
- `consumer-local` — fix stays in this initiative repo
- `template` — fix lands in `tools/blueprint/template/*`
- `reviewer` — fix lands in `tools/blueprint/template/.claude/agents/blueprint/reviewers/*`
- `methodology` — fix lands in `tools/blueprint/METHODOLOGY.md` / `docs/` / top-level conceptual artifacts

**Status**: One of:
- `Active` — current
- `Superseded by <YYYY-MM-DD entry>` — replaced
- `Promoted to methodology` — landed upstream at wave N (commit <SHA>)

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
