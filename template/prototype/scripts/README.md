# Prototype scripts — design-system gates

These scripts implement Phase 0 of `/blueprint-validate`. Mechanical pass/fail; no diagnosis required.

## audit-contrast.mjs

WCAG AA contrast pass on every text-on-surface token pairing. Replace `COLORS` and `PAIRINGS` at the top with this project's actual tokens from `prototype/DESIGN.md` frontmatter.

```bash
node prototype/scripts/audit-contrast.mjs
```

Exit 0 = all pass · Exit 1 = at least one fail · Output names every pairing + ratio + target.

**Common fix patterns when a pairing fails:**
- Slate-400 (`#94A3B8`) typically fails AA on white (2.5:1). Move to slate-500 (`#64748B`, 4.5:1+).
- Amber-500 (`#F59E0B`) fails AA on white. Use amber-700 (`#B45309`) for text.
- Green-500 fails AA. Use green-700 / emerald-800.

Wire into CI as a gate so token changes can't silently regress contrast.

## lint-design-system.mjs

Parses `prototype/DESIGN.md` frontmatter and asserts the 15-dimension contract from `$BLUEPRINT_HOME/docs/case-studies/design-system-audit.md`.

```bash
node prototype/scripts/lint-design-system.mjs
```

Checks 17 hard requirements (D-1 through D-9) and 1 soft warning (D-1 dark mode). Hard failure = exit 1; soft warning = exit 0 with a `warn` line. The contract:

- D-1 brand primary set (not placeholder); dark mode tokens declared
- D-2 typography ramp with ≥10 tuple entries; weights_in_use ≤ 3; tabular numerals declared; italic policy declared
- D-3 iconography library named
- D-4 spacing rationale + elevation strategy
- D-5 motion durations + easings
- D-7 focus_visible, contrast_target = WCAG AA, one_h1_per_route
- D-8 responsive mobile_nav decision
- D-9 data formatting rules for date + number

When a check fails, the output includes a one-line hint with the exact frontmatter to add.

## Wiring

Add to `package.json`:

```json
{
  "scripts": {
    "audit": "node prototype/scripts/audit-contrast.mjs && node prototype/scripts/lint-design-system.mjs",
    "validate": "npm run typecheck && npm run build && npm run audit"
  }
}
```

Then CI / pre-deploy / `/blueprint-validate` Phase 0 runs `npm run validate`.

## Adding new gates

Other mechanical checks worth scripting (open for next initiative):

- Heading hierarchy lint (single h1 per route file)
- `font-display` size lint (no `font-display` below 20px per DP-11)
- Eyebrow-token consolidation (no ad-hoc `uppercase tracking-wider text-[10px]` recipes)
- Forbidden routes (`/agents`, `/brainstorm`, `/execute`, `/continuity`)
- Banned terminology sweep (per DESIGN.md `terminology.ban`)

Each can be ~30 lines of grep + exit code. Keep them in this directory; wire each into the `audit` script.
