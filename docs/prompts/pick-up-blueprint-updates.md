# Prompt — Pick up Blueprint updates in an initiative already using it

Paste at the start of a session resuming work on a Blueprint initiative (or in a session where Blueprint work is already in flight) to bring the agent's context up to date with methodology changes.

## When to use this prompt

- The initiative was using Blueprint before the 2026-05-25 rename + v3 taxonomy + reviewer agents + I-5 invariant + smoke-runner strengthening landed.
- A new Claude session is resuming work on a Blueprint initiative and you want the methodology layer refreshed before any other work.
- You're not sure which Blueprint updates have been incorporated into a given initiative.

## Auto-injection option (per consumer initiative)

The prompt can be auto-injected via Claude Code's `SessionStart` hook configured in `.claude/settings.json` of the consumer initiative. See the example block at the end of this doc. The auto-injection is **opt-in per initiative** — never global — because not every project under `~/Workspace/dev/` uses Blueprint, and the prompt is noise in non-Blueprint sessions.

## The prompt

```
Blueprint was renamed from BigBlueprint on 2026-05-25. New location:
- GitHub: github.com/nino-chavez/blueprint
- Local: ~/Workspace/dev/tools/blueprint

Read these updates before continuing existing blueprint work — they change
how this initiative operates:

1. ~/Workspace/dev/tools/blueprint/docs/variant-selection.md
   — Three-variant taxonomy (greenfield / midstream / brownfield). If this
   initiative's blueprint.yml doesn't have a `variant:` key yet, add it.
   Default is greenfield; pick the actual variant if different.

2. ~/Workspace/dev/tools/blueprint/template/.claude/agents/blueprint/reviewers/
   — Seven new stage-gate reviewer agents replace the legacy `validator`.
   Variant-aware. They block premature stage completion (e.g., declaring
   Stage 1 complete with empty research/funnel/). Read reviewers/README.md
   for the roster.

3. ~/Workspace/dev/tools/blueprint/template/prototype/DESIGN.md
   §"Architectural Invariants" + §"I-5. JS Class Output ↔ CSS Coverage"
   — Five structural invariants now apply to every prototype. I-5 specifically
   catches the v3 portal CSS-gap failure mode (template ships JS shells
   emitting classes without matching CSS rules).

4. ~/Workspace/dev/tools/blueprint/template/.claude/agents/blueprint/reviewers/prototype-smoke-runner.md
   — Stage 6 ship gate now requires viewport screenshots per page via
   browse-tool AND CSS-coverage check, on top of @smoke Playwright. A 200
   response from curl + green @smoke is no longer enough.

5. Voice rules moved out of per-initiative CLAUDE.md:
   - ~/Workspace/dev/tools/blueprint/docs/voice-template.md (canonical)
   - ~/Workspace/dev/tools/blueprint/docs/voice-b2b-addendum.md (loaded only
     when b2b_edition.enabled: true)

6. Sweep this initiative for stale references: `big-blueprint` → `blueprint`,
   `BigBlueprint` → `Blueprint`, github.com/nino-chavez/big-blueprint →
   github.com/nino-chavez/blueprint. The Blueprint repo and Rally HQ already
   completed this sweep; this initiative may not have. Show the diff before
   committing — working trees may have unrelated WIP.

7. **Chrome canonical refresh** (2026-05-25 evening wave). The Pattern B
   chrome surface is now stamped + diffable:
   - `shared.css` is canonical chrome (do-not-edit). Project token overrides
     go in `project-tokens.css` (new file). Run:
       node ~/Workspace/dev/tools/blueprint/template/tools/blueprint-init/stamp.mjs \
         --mode=restamp-chrome --pattern=B --target=<this initiative root>
     to pull canonical chrome (shared.css, _portal-shell.js, proto-nav.js,
     proto-annotate.js, _headers, _redirects, docs/index.html).
   - If your `shared.css` has more lines than the template's, those extra
     lines are project drift. Lift them into `project-tokens.css` BEFORE
     restamping (restamp overwrites shared.css).
   - `portal-chrome-canonical-reviewer` will block portal commits with
     drifted chrome and emit a fix command. Wire it into your reviewer
     roster at Stage 3 + any portal-touching commit.

8. **Docs viewer is now manifest-driven** (2026-05-25 evening wave).
   The sidebar, TITLES, STRATEGIC_DOCS set, and default doc come from
   `_meta/index.json` `docs.tiers[]`. If your `blueprint/portal/docs/index.html`
   has hardcoded sidebar entries (the symptom: it lists Rally HQ docs, or
   any doc list that's not yours), restamp-chrome will replace the file.
   Before restamping, capture your project doc list into the manifest:
     {
       "docs": {
         "tiers": [
           {
             "label": "Strategic artifacts",
             "blurb": "...",
             "designed": true,
             "docs": [{ "id": "your-doc-slug", "title": "Your Doc Title" }, ...]
           },
           {
             "label": "Working documents",
             "blurb": "...",
             "designed": false,
             "docs": [...]
           }
         ],
         "default": null
       }
     }
   Schema: `template/portal/CONVENTIONS.md` § "Docs viewer manifest."

9. **Brand bar is now manifest-aware**. `_portal-shell.js` reads
   productName from `_meta/index.json` `name` (strips " Blueprint" suffix).
   Remove `window.PORTAL_SHELL_CONFIG` blocks from your portal HTML files —
   they short-circuit the manifest path. Keep `window.PROTO_PAGE` and
   `window.PROTO_CHAT_DISABLED` if you set them.

10. **Pilot profile is required at Stage 0 → Stage 1** (reconciliation item 3).
    Add to your `blueprint.yml`:
      pilot_profile:
        slug: ""
        display_name: ""
        pain_point: ""
        monetization_side: ""
        walkthrough_citation: ""
        competitors_in_scope: []
        out_of_scope_pilots: []
    Every field non-empty + walkthrough_citation must resolve to a real file.
    `pilot-profile-lock-reviewer` blocks Stage 1 until this is locked. Full
    rationale: `template/docs/methodology/pilot-profile-template.md`.

11. **Personas table gains a monetization column** (reconciliation item 5).
    If your initiative has a `personas.md` (or equivalent) and your pilot is
    multi-sided, add a `Monetization side` column + `Cross-side cost`
    column per row. Template: `template/docs/methodology/personas-template.md`.
    The `prescription-evidence-reviewer` (midstream/brownfield) now checks
    monetization-side coverage against declared sides.

12. **Confident-preview rule** (reconciliation item 4). Portals show ONE
    confident take per route — not variant walks. If your portal has
    `home-a.html` + `home-b.html` or `dashboard-modern/` + `dashboard-classic/`,
    converge in Stage 2, write the ADR, ship one. Full rule:
    `template/docs/methodology/confident-preview-rule.md`. Enforced by
    `design-principles-reviewer` (greenfield) at Stage 2→3 and by
    `portal-pattern-b-conformance-reviewer` at Stage 3 completion.

13. **METHODOLOGY-AMENDMENTS.md** at your initiative root captures
    methodology learnings specific to this initiative. Append-only,
    reverse-chronological. When you notice a methodology gap or add a
    workaround, log it there with scope=`Candidate for methodology promotion`
    so the methodology operator can grep for promotion candidates across
    initiatives. Full convention:
    `template/docs/methodology/methodology-amendments-convention.md`.

The first principle that drives all of this: agent struggle is a missing
capability. When you hit a failure that isn't covered by an existing reviewer
/ invariant / sensor / doc, the response is "what capability is missing, and
how do I encode it" — not "patch the prompt."
```

## Migration order for an existing initiative

Updates 1-6 above are reading + minor edits. Updates 7-13 are structural — they may rewrite files. Apply in this order to avoid losing work:

1. Read sections 1-6 first; absorb the methodology shape.
2. **Audit your `shared.css` BEFORE restamp.** Diff against `~/Workspace/dev/tools/blueprint/template/portal/shared.css`. Any lines in yours but not template's are project drift — lift them into `project-tokens.css` (create if absent).
3. **Audit your `docs/index.html` BEFORE restamp.** Capture your sidebar entries, TITLES, STRATEGIC_DOCS into `_meta/index.json` `docs.tiers[]` per section 8.
4. **Run `stamp.mjs --mode=restamp-chrome --pattern=B --target=<root>`.** This overwrites the canonical chrome files. project-tokens.css, _meta/*, pages/*, your project-specific code stays untouched.
5. **Remove `window.PORTAL_SHELL_CONFIG`** from each portal HTML file (section 9). The shell now reads from manifest.
6. **Lock the pilot profile** in `blueprint.yml` (section 10). Re-run `pilot-profile-lock-reviewer` to confirm.
7. **Add the monetization column** to personas if multi-sided (section 11).
8. **Audit for variant-shaped page names** (section 12). Move any variant walks to Stage 2.
9. **Create `METHODOLOGY-AMENDMENTS.md`** (section 13). Initially empty; populated as the initiative discovers methodology gaps.
10. **Open a PR + run all reviewers.** Stage 3 reviewers (`portal-pattern-b-conformance-reviewer` + `portal-chrome-canonical-reviewer`) catch leftover drift.

## Optional `SessionStart` hook (per consumer initiative)

If you want auto-injection on every session start in a specific Blueprint initiative, add this to that initiative's `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cat ~/Workspace/dev/tools/blueprint/docs/prompts/pick-up-blueprint-updates.md",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

The hook prints the prompt doc into the session's context window at startup. Claude reads it and applies the updates before acting on the user's first message.

**When to enable:** during the transition window when an initiative is catching up from pre-2026-05-25 Blueprint. Once the initiative is fully aligned with the new methodology, the hook is noise — remove it.

**When NOT to enable:** the Blueprint repo itself (would self-reference), or any non-Blueprint project (the prompt assumes Blueprint context).
