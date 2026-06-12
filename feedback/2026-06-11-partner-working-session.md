# Feedback — partner working session, "T." (the partner SA, co-development)

Captured 2026-06-11 (meeting earlier that day). Identities anonymized for the public
repo; verbatim retained in `feedback/raw/2026-06-11-partner-working-session-verbatim.md`
(gitignored, local only). This is the **first substantive co-development working session
with the partner SA (T.)** — the wave-49 team-adoption engagement already in the
validation Log (A3, n=1). Earlier captures were market-validation contacts (casual
visitor, two internal eng threads); this one is different in kind: an already-converted
adopter surfacing concrete technical gaps while using Blueprint + hive on a live client
build. Two next-steps came out of it, one of which is the methodology-gap analysis filed
this same day in `METHODOLOGY-AMENDMENTS.md`.

## The session (condensed)

Four threads, two of them load-bearing:

1. **Node-graph visualization over rigid dashboards.** T. and the author converged on a
   node-based graph (heatmap-like) to visualize data/decision dependencies and navigate
   complex project context, explicitly *instead of* traditional rigid dashboards. The
   author's adjacent concern: AI struggles to produce novel UI and defaults to generic
   results; the aspiration is ergonomic, sci-fi-grade interfaces (Minority Report / Star
   Wars), not another dashboard. Floated a graph database (or Supabase + Claude MCP
   connectors) as the backing store.

2. **Audit trail for the "why" behind decisions.** Around the "defrag" idea — upfront
   constraints mitigate downstream failure, but systems still drift as they evolve. T.'s
   point: you need an audit trail with *clear connection points between decision nodes* to
   recover the "why" behind a choice and manage dependencies. Constraints alone don't
   survive evolution; the trail does.

3. **Coordinated-update scaling.** T. wants an architecture that absorbs massive,
   coordinated updates (the "Google monorepo" shape) without untangling messy context
   windows or burning excess compute per change. The author noted the value of embedding
   process invariants to hold quality as the system grows.

4. **Field pain (the evidence).** T. described a live client engagement where he is forced
   to act as BA + PM + solutions-architect because the project team lacks direction and
   needs constant guidance — and a platform incident (a per-product modifier hard-limit
   that broke ~300 stores, including a major headless B2B client) where a teammate ("A.")
   marked the issue addressed by repeatedly citing documentation that did not match the
   immediate, complex reality.

The author also updated T. on independent work: Blueprint restructured as a subdomain of
his site, a site-audit tool, and seeding on Hacker News / Reddit / LinkedIn for personal
ownership.

## What this is (in methodology terms)

The session converts two of the meeting's threads into **field evidence** and two into
**methodology-gap candidates** — the candidates are filed in `METHODOLOGY-AMENDMENTS.md`
(2026-06-11 entry, "Blueprint↔Hive gaps"); this capture records the evidence half.

1. **Present-but-broken DoD, observed in the wild (strong).** "A. marked it addressed by
   citing docs that don't match reality" is the exact failure class the DoD verification
   ladder (waves 52/62/63) exists to kill: *claimed done via presence/citation, not
   verified behavior*. First field sighting of the anti-pattern outside the
   self-application — and it lands on the partner who is already running the methodology,
   which is why it reads as a wiring gap (the ladder isn't reaching the team coordination
   layer), not a market objection. Feeds gap B in the amendments entry.

2. **The team-alignment / role-confusion problem, observed in the wild (strong).** "Forced
   to be BA + PM + SA because the team has no direction" is the A3 problem-half made
   concrete on a real engagement — a third independent source after R. and V., and the
   first from inside the partner's own delivery, not a pitch reaction. This is *gave*
   behavior (he's staking client delivery on the gap), not a said-opinion.

3. **A graph/audit-trail ask that mostly maps to already-shipped substrate.** The "node
   graph + why-behind-each-node audit trail" is not a greenfield request: archaeology
   already stores typed `refs[]` edges and answers "why" via `/derive` with `[E:id]`
   citations; ADR frontmatter already carries `supersedes`/`extends`/`informs`; the portal
   config already has a `dep_graph: null` placeholder. What's missing is the *surface* and
   the *finished edges*, not the store — so the partner partially re-derived shipped
   capability, which is itself an onboarding/changelog-visibility signal. Feeds gaps A and
   C in the amendments entry.

## Mom Test annotations

- **Gave**: time + reputation, ongoing. T. is mid-engagement staking client delivery on
  Blueprint + hive; the session was co-development, not evaluation. Strongest commitment
  class in the Log after the original wave-49 stake — this deepens A3 from "adopting" to
  "co-developing and surfacing gaps from real use."
- **Said vs gave**: the field anecdotes (A. citing docs; BA+PM+SA overload) are *observed
  events on a live job*, the evidence class that counts — not speculation about our tool.
- **Discount**: the "Google monorepo" / sci-fi-UI aspirations are direction, not
  requirements; logged as vision, not scoped. The graph-database instinct is checked in the
  amendments entry (the edge store already exists; a graph DB is premature).
- **Assumptions touched**: A3 strengthened (third problem-half source, first from the
  partner's own delivery; co-development depth) — see `docs/content/validation-script.md`
  Log row.
