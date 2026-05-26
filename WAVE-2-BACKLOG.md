# Wave 2 Backlog — blueprint-redesign

What wave 2 of "Blueprint applied to itself" will audit when it runs. Captured at end of wave 1 (`dogfood-v1` @ commit `cc4f62f`, methodology main at `59ab781` after 6 promotion waves 8-13).

The reason this artifact exists: wave 1 derived its discovery target from scratch (Stage 1 portal surface audit, etc.). Wave 2 should NOT re-derive — the wave-1 work explicitly named what's open, deferred, and awaiting evidence. Future-session-self reads this backlog as the wave-2 starting point.

## Trigger conditions

Wave 2 runs productively when ONE of these events occurs (not before):

| Trigger | What it produces | Watch for |
|---|---|---|
| Second consumer initiative restamps to methodology waves 8-13 | Real-world evidence of whether the theme registry, design-discipline track, and Stage 4 degrade-path actually work for a non-dogfood consumer | Rally HQ is the cited natural reviewer (`HANDOFF.md`). Watch for: `restamp-chrome --pattern=B --theme=<name>` runs in rally-hq's git log; new amendments in rally-hq's `METHODOLOGY-AMENDMENTS.md`; new audit artifacts in rally-hq's `research/` |
| `@blueprint/cli init` actual implementation lands | Whether the methodology's prescription survives implementation. Wedge 1's CLI mocked in this portal but never built | New `template/tools/blueprint-init/cli.mjs` or `npx @blueprint/cli` package on npm |
| Reviewer plugin runtime lands | Whether Wedge 2 prescription survives implementation | New `template/.claude/agents/blueprint/reviewers/*.mjs` files (paired executables alongside `.md` specs) |
| forge-site relocation runs | Reveals whether the design-discipline track's `template/methodology/design/` directory absorbs forge-site's archetypes/modules/playbook structure cleanly | Movement of `~/Workspace/dev/tools/forge-site/` content into methodology; deletion of `tools/forge-site/` |
| External reviewer ratifies seeded artifacts | Closes the wave-1 Stage 4 carry-forward judgment claims | `decisions/02-design-system.md` + `decisions/04-voice-rules.md` status changes from `seeded` to `ratified` with named reviewer |
| 60-day idle elapses with no trigger above | Confirms the methodology held — wave 2 audits drift rather than activity | Date-based check; runs as a passive audit if no other signal |

## Open judgment claims (wave 1 Stage 4 carry-forward)

From `research/current-state/04-stage4-fact-check.md` § Judgment claims requiring external reviewer:

1. **Solution Architecture register reads correctly** — does the voice rules artifact + portal prose actually land as Solution Architecture, or did it drift into editorial register? Wave 2 audit: re-read the 5 wedge pages + voice rules; mark any sentence that drifts.
2. **Design system completeness** — does L0–L4 dictionary cover every gap a real consumer initiative will hit? Wave 2 audit: cross-reference rally-hq's (or next consumer's) design system against this initiative's L0–L4 to find missing primitives.
3. **Voice rules sufficiency** — do the 4 axes + 6 anti-patterns actually prevent voice drift in future sessions? Wave 2 audit: scan any wave-2-period commits for anti-pattern violations.
4. **Multi-theme contrast across surfaces** — visually verified on `gap-inventory` only at wave 1. Other 10 surfaces (front door, 4 other wedge pages, docs viewer, prototype studio, 3 chrome layers) need re-verification post-B5 surface theming. Wave 2 audit: visual sweep across all 11 surfaces × 4 themes = 44 spot-checks.

## Wave-1-punted items (do these in wave 2)

Items explicitly deferred in wave 1 with rationale, ready to pick up:

| Item | Why punted in wave 1 | What wave 2 needs |
|---|---|---|
| forge-site relocation | Audit required before move; out of wave 1 scope | forge-site audit + decision on archetypes/modules/playbook directory structure under `template/methodology/design/` |
| Consumer migration for rally-hq, website-nc-v3, subs-initiative | Each consumer is a separate restamp + visual verify; needs operator coordination | Run `restamp-chrome --pattern=B --theme=<name>` against each; document any drift; capture new amendments if surfaced |
| `@blueprint/cli init` build | CLI doesn't exist; prescription mocked in portal only | Build `@blueprint/cli` package + npm publish; surface gaps in the methodology when init flow doesn't fit a real initiative |
| Reviewer plugin runtime | Wedge 2 prescription described, not built | Build the runtime per ADR-0002; surface gaps when reviewers don't compose as predicted |
| `forge-brand generate voice` extension | Voice rules seeded; AI-extension gated on operator | Run generator; ratify proposed anti-patterns + examples; merge into `decisions/04-voice-rules.md` |
| Prototype studio iframe content | Studio shell + slices populated in wave 1; actual prototype iframes for wedge-1 / wedge-2 not authored | Author 1-2 prototype iframes (e.g., terminal mock of `@blueprint/cli init`); validates that wedge-1 prescription has visual evidence beyond prose |
| Pattern A stamper implementation | `stamp.mjs` fails fast on `--pattern=A`; only Pattern B works | Implement Pattern A stamp path; required for tier-2 consumer initiatives |

## Methodology-level questions wave 2 will likely surface

Things that wave 1 didn't have evidence for but will likely come up:

- **Wave-cadence convention itself** — should methodology codify "Blueprint applied to itself" as a recurring discipline? If yes, METHODOLOGY.md gains a "Wave cadence" section. If no, the dogfood pattern stays implicit.
- **External-reviewer assignment mechanism** — Stage 4 degrade-path says "next consumer initiative is the natural reviewer." But which consumer becomes the reviewer for THIS dogfood's seeded artifacts? Needs an explicit hand-off (does rally-hq commit to reviewing on its next session, or does this happen passively?).
- **Wave-N amendment-promotion ordering** — six amendments shipped as 6 waves in this session. Future iterations may surface 10+ amendments; methodology might need a triage convention (which amendments are MVP vs deferred?).
- **Cross-consumer audit convergence** — wave 1's cross-audit reconciliation used 3 dogfoods to validate the design-discipline framing. Wave 2+ could keep adding to the cross-audit corpus; methodology may want a registry of "audits that informed amendment X."

## Wave 2 audit shape (when triggered)

When a trigger fires, wave 2 runs:

1. **Stage 1 re-audit** — re-run the L5 surface audit on this initiative's portal. Compare to wave-1 audit; identify drift.
2. **External evidence integration** — read the triggering event's artifacts (rally-hq amendments, CLI implementation diff, etc.). Identify what's new in the wave-2 scope.
3. **Cross-audit refresh** — if new consumer audits exist (rally-hq, blog, others), re-run the cross-audit reconciliation in `research/architecture/02-stage1-design-audit-template.md`. Check whether the canonical audit template still holds.
4. **Judgment-claim review** — re-evaluate the four judgment claims above against current evidence; ratify or carry-forward.
5. **Punted-item closure** — work through the wave-1-punted items table; close what's now actionable.
6. **New gaps captured** — surface anything wave 2 reveals that wave 1 missed; append to `METHODOLOGY-AMENDMENTS.md`.
7. **Methodology promotion** — wave N (where N ≥ 14) commits to methodology main.

## Predicted wave-2 commit shape

Estimating from this backlog:

- 3-5 amendments from cross-audit refresh + consumer-restamp findings
- 1-3 closures of wave-1-punted items (forge-site, voice generator, prototype iframes)
- 1-2 methodology promotion waves (waves 14, 15)
- Stage 4 re-run; ratification of wave-1 seeded artifacts if judgment-claim reviewers are now available

Wave 2 is meaningfully smaller than wave 1 because wave 1 established the architecture; wave 2 refines. Successive waves should asymptotically approach zero new discoveries as the methodology matures (if it converges) or oscillate (if it doesn't, which itself is signal).

## Heuristic for "is wave 2 ready?"

Sufficient conditions (any one is enough):
- A trigger condition above has fired
- Wave-1 punted items have accumulated to the point that closing 3+ in a batch is more efficient than ad-hoc one-offs
- Cross-audit consumer corpus has grown by ≥1 audit (e.g., subs-initiative runs its own surface audit and produces convergent or divergent findings)

Insufficient conditions (don't trigger wave 2 on these alone):
- Time-passed without trigger
- Operator hunch that "we should check"
- Methodology changes that don't touch dogfood-scoped concerns

If insufficient: extend the wait. Premature wave-2 produces re-audit of unchanged state and consumes session time without adding methodology value.

## References

- `dogfood-v1` tag at commit `cc4f62f` — wave-1 rest-state
- Methodology main `59ab781` — post-promotion (waves 8-13)
- `HANDOFF.md` — wave-1's methodology-promotion handoff (now consumed by waves 8-13)
- `METHODOLOGY-AMENDMENTS.md` — appendable amendment log; wave 2 entries land here
- `~/Workspace/dev/wip/blueprint/CLAUDE.md` § Wave log — methodology-side commit history
