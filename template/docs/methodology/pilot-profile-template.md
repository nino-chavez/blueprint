---
canonical: true
---

# Pilot Profile — Methodology Reference

The pilot profile is a Blueprint initiative's locked declaration of WHO the work is for, WHAT pain they have, and WHICH real artifact grounds that claim. It's the Stage 0 → Stage 1 gate. Without a locked pilot, Stage 1 research drifts toward whichever pilot the agent finds easiest to imagine, and Stage 2 prescriptions land on the wrong audience.

## Why this exists

On 2026-05-22, an initiative (`apps/rally-hq`) ran a competitive walkthrough against `vs-volleyballlife.com`. The declared pilot was "tournament organizer" but no structured field locked that declaration. As Stage 1 research progressed, the agent's framing drifted toward "Let's Pepper" — a different competitor targeting a different pilot (player + coach + parent). The drift was invisible until a separate session noticed the framing-level findings ("multi-sport is a moat") didn't match the original pilot's actual pain.

The cost was a partial Stage 1 redo and explicit ADR work to re-lock the pilot. The encoding was: `pilot_profile:` becomes a structured field in `blueprint.yml`, populated before Stage 1, and a reviewer agent (`pilot-profile-lock-reviewer`) blocks Stage 1 progression until every field is non-empty and grounded.

## The fields and why each is required

| Field | What it captures | Failure mode if empty or weak |
|---|---|---|
| `slug` | Short stable id (e.g., `tournament-organizer`). | Pilot identity drifts via informal renaming across docs ("the organizer" / "tourney runner" / "the operator"). |
| `display_name` | Human-readable, specific enough to disambiguate (e.g., "Tournament Organizer (regional, multi-court)"). | Generic profile ("Coach") that fits multiple actual pilots and lets the work drift to whichever is convenient. |
| `pain_point` | One sentence. The specific operational or experiential pain the initiative addresses. | Vague pain ("better tournaments") that justifies any feature direction post-hoc. |
| `monetization_side` | Which side of the multi-sided market this pilot occupies. | Initiative drifts across monetization axes mid-stream — design for the player side, monetization model assumes the organizer side, neither earns. |
| `walkthrough_citation` | Path to a real artifact (interview, competitive walkthrough doc, observation notes, screenshot set). | The pilot is imagined, not observed. Research finds patterns that fit the imagination, not the real user. |
| `competitors_in_scope` | Competitors selected because they target the same pilot. | Competitive scope is a vibes list — the agent compares to whoever has the prettiest landing page, not whoever serves the same pilot. |
| `out_of_scope_pilots` | Other plausible pilots the initiative could have targeted but won't. | Without naming them, scope drift toward an adjacent pilot has no friction. Naming them surfaces the choice. |

## When to fill it

Stage 0, before Stage 1 starts. The reviewer agent (`pilot-profile-lock-reviewer`) refuses to clear Stage 1 → Stage 2 until every field is populated and the citation resolves to a real file.

If you don't have the walkthrough artifact yet, Stage 0 expands to include the walkthrough first. The methodology change here is "no synthetic pilot profiles" — every initiative must ground in observable user evidence before it can deliberate design principles.

## When to amend it (and how)

The pilot lock is not permanent. Pilots evolve as the work proceeds — a regional tournament organizer learns that a sub-segment (multi-day club tournaments vs. single-day high-school showcases) is materially different and re-anchors. That's a legitimate amendment.

The methodology requires:

1. **Write an ADR** (`decisions/NNNN-pilot-profile-amendment.md`) naming the prior profile, the new profile, the disqualifier, and which downstream artifacts (Stage 1 research, Stage 2 design principles, prototype copy) need to be re-evaluated.
2. **Update `blueprint.yml` `pilot_profile:` fields** to match the ADR.
3. **Run the reviewer again** to confirm the lock is back in place.

The reason for the ADR overhead: amendments are real, but silent amendments are the drift mode this whole rule prevents. The overhead is the friction that surfaces the choice.

## Multi-pilot initiatives

Some initiatives legitimately serve multiple pilots (a B2B portal with Buyer + Buyer Manager + Org Admin actors; a marketplace serving both sides). For these, `pilot_profile:` becomes the *primary* pilot — the one the deliverable is optimized for. Secondary pilots get their own `secondary_pilots:` list (not in the schema yet; add when the second multi-pilot initiative needs it).

The single-pilot lock applies to single-pilot initiatives, which is most of them. Multi-pilot is the exception, declared explicitly.

## Cross-references

- Schema: `template/blueprint.yml` § `pilot_profile:`
- Reviewer: `template/.claude/agents/blueprint/reviewers/pilot-profile-lock-reviewer.md`
- Trigger incident: 2026-05-22 rally-hq vs-volleyballlife walkthrough; full diagnosis in `docs/2026-05-25-three-session-reconciliation.md` § "Rally HQ session caught"
- Methodology first principle: `METHODOLOGY.md` § "First Principle: Agent Struggle Is a Missing Capability" — this reviewer is the encoded response to the rally-hq pilot-drift failure mode
