# Handoff — {short title naming the work or transition}

**Last updated:** YYYY-MM-DD
**Working tree:** `{absolute path to the repo this handoff is written FROM}`
**Most recent commit:** `{sha} {short message}`
**Destination:** `{path or repo this handoff is written TO, if cross-repo}`

Read this first before {resuming work on / executing the dispatch / running the next stage}.

---

## What's live

{Currently-operating state the next operator inherits. URLs of deployed resources, active sessions, external integrations. Delete this section if the work isn't cross-repo and no deployed surface is relevant.}

| | URL / value |
|---|---|
| {Resource name} | `{URL or identifier}` |

---

## What's done

{Completed work the next operator can build on. Use a checked list; one line per item.}

- [x] {Completed item with brief description}
- [x] {Completed item with brief description}

---

## What's pending

{Concrete next actions in priority or dependency order. The reader should be able to start work from the top of this list without re-deriving what to do next.}

- [ ] {Pending item — 1-2 sentences, with file paths or commit references where relevant}
- [ ] {Pending item — 1-2 sentences}

---

## Sequencing / dependencies

{OPTIONAL. Use when pending items have non-obvious order. Delete if pending-list order is self-explanatory.}

1. {Item A} first because {reason X}
2. {Item B} depends on A's completion of {specific output Y}
3. {Item C} can run in parallel with B; merges at {convergence point Z}

---

## Local refs / secrets

{OPTIONAL. Use when the next operator needs local-only state (credentials, cached tokens, machine-specific paths). NEVER commit anything containing actual secret values — reference paths only.}

| File | Contents | When you need it |
|---|---|---|
| `~/.config/{path}` | {description of what the file contains} | {trigger — when in the workflow this is needed} |

---

## What this doc is NOT

{OPTIONAL. Use when downstream readers might confuse the handoff's scope with an adjacent artifact (the prescription, a STATE.md, an ADR, etc.). Be explicit about the boundary.}

- Not {scope-A — name the adjacent artifact this handoff is sometimes mistaken for}
- Not {scope-B}

---

## References

{Source artifacts, prior handoffs in the same initiative, related ADRs, methodology promotion records.}

- {Path or URL}
- {Path or URL}
