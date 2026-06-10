# Clustered Tool-Surface Pattern — Unify by Auth Profile, Not by Vibes

**Purpose:** Capture the discipline for deciding whether the *tooling* a project ships (Hive dashboard, prototype harness, demo storyboard, traceability matrix, etc.) lives on one deploy surface, many, or somewhere in between. The pattern names the real cleavage — **auth profile** — and codifies it as a `blueprint.yml` config rather than a per-project rediscovery.

**Last updated:** 2026-05-16

**Source:** `subs-initiative` operates three tooling surfaces today (`private-demo.example`, `private-demo.example`, `private-demo.example`) with cross-nav header links. Cross-nav drift surfaced repeatedly (most recently when the Hive dashboard's Docs link wasn't visibly removed after the deploy broke for 3 consecutive tag pushes). The pattern emerged when asking: "should this be configurable from project init rather than something each project rediscovers?"

---

## The trap this prevents

The naive framing is "should the tool surfaces be unified into one app, or kept separate?" That binary misses the real constraint. Some surfaces are operator-internal (auth-gated to the team running the project); others are stakeholder-shareable (intentionally public or signed-link). Unifying *across* that auth boundary either exposes private surfaces or auth-gates surfaces meant to be openly shared.

The right cleavage is **auth profile**, not "all together vs all separate."

## The three modes

`blueprint.yml` exposes `tool_surface.mode` as the config knob. Three values:

| Mode | What ships | When to use |
|---|---|---|
| **`separate`** | Each tool app is its own deploy (current `subs-initiative` pattern) | Existing projects with deployed URLs other things already link to; teams that want stack freedom per surface; surfaces with fundamentally different rebuild cadences |
| **`clustered`** (default) | Two deploys grouped by auth profile: one operator-internal shell + one stakeholder-shareable shell | New projects. Stable surface count. Distinct operator vs reviewer audiences. Avoids cross-nav drift while respecting auth boundaries. |
| **`unified`** | All tool surfaces on one deploy, auth-gated at top level | Solo project + single audience. Or open-source projects where everything is public. Rare. |

## The clusters in `clustered` mode

### Operator-internal cluster

- Hive dashboard (proposals / board / presence / activity / participants)
- Future operator dashboards (state-derive, infrastructure health, etc.)
- Auth: CF Access (or equivalent) gated to the team

Audience: you + dispatched agents. Things only the team should see.

### Stakeholder-shareable cluster

- Prototype harness (the design oracle + per-feature slices)
- Traceability matrix
- Demo storyboard

Audience: reviewers, partners, future hires. Things meant to be shared with a link.

Auth: public, or signed-link via CF Access if signal value warrants.

## Why this isn't unified

Auth profiles are immutable across surfaces. The Hive dashboard CAN'T be public (it contains proposal drafts, internal coordination state, agent session metadata). The prototype harness MUST be shareable (it's literally how you brief stakeholders). One deploy can't satisfy both.

## Why this isn't separate

Within an auth cluster, the surfaces have the same audience, the same auth profile, and the same maintenance contract. Splitting them into separate deploys creates the cross-nav drift problem (link goes stale, deploy breaks invisibly, manual updates required when a surface is added/removed). Within-cluster unification eliminates this without breaching the auth boundary.

## `blueprint.yml` schema

```yaml
tool_surface:
  mode: clustered                    # unified | clustered (recommended) | separate

  operator_cluster:
    enabled: true                    # set false if no operator-internal tooling needed
    auth: cloudflare-access          # cloudflare-access | basic-auth | none
    apps:                            # which apps mount into the operator shell
      hive_dashboard: true
      infra_status: false            # opt-in for state-derive / health dashboards
    deploy_name: ""                  # e.g., "myproject-tool-internal" (defaults to <project>-tool-internal)

  shareable_cluster:
    enabled: true                    # set false if no public-facing tool surface
    auth: public                     # public | signed-link
    apps:
      prototype: true
      traceability: true
      demos: true
    deploy_name: ""                  # e.g., "myproject-tool-public" (defaults to <project>-tool-public)
```

## When `unified` is the right call

Rare, but worth naming:

- Solo project where the operator + the audience are the same person
- Open-source projects where the Hive dashboard is intentionally public (rare — most contain internal coordination noise)
- Internal-only research projects with no external stakeholder ever
- Project lifetime <2 weeks (doesn't earn the clustered split's setup cost)

If you're not sure, default to `clustered`. It's the path of least regret.

## When `separate` is the right call

- Existing projects with deployed URLs other things link to (e.g., `subs-initiative` — three surfaces are linked from memory entries, Slack, external docs; migration cost > maintenance benefit)
- Surfaces that genuinely need different rebuild cadences (e.g., a long-build SPA paired with a fast-iteration static site that you don't want to wait on)
- Teams strongly preferring stack independence per surface (one team owns dashboard, another owns prototype; coordinating shell upgrades is overhead)

## Activation thresholds

| Choice | Activates when |
|---|---|
| `clustered` (default) | New project with ≥2 tool surfaces and distinct operator/shareable audiences |
| `unified` | Solo, single-audience, <2-week project; OR fully-public open-source |
| `separate` | Existing project with deployed-URL liability; OR genuinely-distinct rebuild cadences |

## What ships in the template

`template/apps/tool-shell/` provides a minimal Vite + React + react-router-dom shell that mounts the cluster's apps as routes. Per cluster, the operator clones it twice (once for operator, once for shareable) or once (if only one cluster is enabled), then ports their actual apps in as route components.

The template is a skeleton — it doesn't ship the actual Hive board, prototype slices, or demo storyboard logic. Those come from the project's existing apps. The shell provides:

- React Router with the standard route stubs
- A `Sidebar` component matching the existing dashboard's nav pattern
- A `wrangler.toml` for CF Pages deploy
- A `README.md` documenting the porting pattern

## Retrofit guidance

For an existing project on `separate` mode, retrofit cost is mostly URL migration (redirects, link audits, memory entry updates). Worth it when:

- A new sibling project is about to launch (build the unified template against the existing one, then ship the new project on it from day 0 — two-stones-one-bird)
- Cross-nav drift has caused ≥2 visible incidents (the existing maintenance pain is bounded but real)

Don't worth-it when:

- Surface count is stable and cross-nav is working
- Deployed URLs are linked from many external surfaces (the migration tax compounds)
- Team is small and the maintenance pain is invisible

## Companion patterns

- `doc-surface-discipline-pattern.md` — the broader doc-classification rubric this fits into (the tool surfaces ARE the canonical-present surface for the project's tooling)
- `tiered-orchestration-pattern.md` — operator-cluster vs shareable-cluster is the same auth cleavage that drives Orchestrator (operator) vs Implementer (operator) vs surfaced-via-traceability (shareable)
- `hive-coordination-pattern.md` — the Hive dashboard is one tenant of the operator cluster

## Origin

Pattern surfaced during `subs-initiative` session 2026-05-16 when asking whether `blueprint` should make tool-surface deployment a configurable choice rather than a per-project rediscovery. The trigger was watching the same cross-nav drift bug hit twice (Docs link removed at source but stale on live; deploy workflow broken for 3 tag pushes). The auth-cleavage framing emerged when distinguishing "unify the product" (rejected by ADR-0005 in subs-initiative) from "unify the tooling around the project."
