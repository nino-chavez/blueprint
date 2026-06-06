---
canonical: true
type: methodology
as_of_retrieval: 2026-06-01
hive_proposal_id: 80549326-1bcd-46a3-b16b-efd11aa7676b
github_issue: the subscriptions initiative's repo (private)/issues/685
sources:
  - url: docs/methodology/2026-05-14-jira-confluence-handoff-readiness.md
    retrieved_at: 2026-06-01
  - url: docs/rag/bc-internal-docs/process/quality/xray.md
    retrieved_at: 2026-06-01
  - url: docs/rag/bc-internal-docs/domains/auth/quality/iam-xray-testing.md
    retrieved_at: 2026-06-01
  - url: docs/rag/bc-internal-docs/domains/payments/quality-space-pi/xray-approach-and-naming-convention.md
    retrieved_at: 2026-06-01
---

# Full-SDLC coverage across the Atlassian suite

> **Portable pattern (big-blueprint).** A `big-blueprint`/`ai-hive`-shaped project
> can hydrate a full Atlassian SDLC (Jira + Confluence + Xray) **headlessly from
> its own substrate**. Tool: [`template/tools/jira-confluence-export/`](../template/tools/jira-confluence-export/)
> — start with its [`PORTABILITY.md`](../template/tools/jira-confluence-export/PORTABILITY.md)
> for what to adapt. This doc is the **`subs-initiative` reference case study**
> ([#685](the subscriptions initiative's repo (private)/issues/685)), proven
> end-to-end at full scale (238 Jira issues, 443 Xray tests, 134 Confluence
> pages). The product mapping + decision trail transfer to any project; the
> counts are subs-initiative-specific.

## Do we have the artifacts? (git-tracked source, 2026-06-01)

Yes — a near-complete SDLC corpus. Scoped to tracked files (not the ~40 worktree copies that inflate naive `find`):

| Artifact | Count | SDLC role |
|---|---|---|
| User stories w/ Acceptance Criteria (`BRD.md`) | **210** (each has AC + Phase/Priority/Effort/Persona) | requirements |
| Epics (GH `[Epic-N]`) | 67 | planning |
| Issues / merged PRs | 623 / 907 | planning / build |
| Test files (`.test.ts`/`.spec.ts`) | ~300 (e2e 55, visual 24, scenario 14, a11y 8, integration 5, smoke 4, security 3, contract 2) | test |
| BDD `.feature` (Gherkin) | 6 (`e2e/behavior/`) | test (Cucumber) |
| ADRs / dossiers / attestations | 65 / 65 / 42 | decide / build / govern |
| 10-gate DoD status files | 28 | verify |
| Methodology / runbooks / audits | 33 / 4 / 53 | knowledge / operate |
| `traceability.json` | 1 (Story↔slice↔ADR↔status) | the spine |
| CI workflows | 70 | build / release |

The gap was never *content* — it's that no single tool shows the idea→launch thread. That's what Atlassian provides.

## Idea → launch, mapped to Atlassian products

| Stage | Product | Substrate source | Exporter status |
|---|---|---|---|
| Ideate / discover | **Jira Product Discovery** | `[Spike]`/`[Decision]` proposals, `docs/strategy/`, `docs/diligence/`, north-star | — (stage 4) |
| Define / spec | **Confluence** (Requirements) | PRD, PRD-COMPANION, BRD (210 US+AC), ARCHITECTURE | ✅ pages |
| Decide / architect | **Confluence** (Decisions) | 65 ADRs + synthesis records | ✅ pages (ADR sample live) |
| Plan | **Jira Software** Epic→Story→Sub-task | 67 epics, 210 stories, Hive tasks; surface→Component, effort→Points, phase→Release | ✅ Epic+Story+links live; sub-tasks deferred |
| Build | **Bitbucket** / GitHub-for-Jira (smart commits) | 907 PRs, dossiers | — (native integration) |
| Test / QA | **Xray** (Test/Precondition/Test Set/Plan/Execution) | ~300 tests, 6 `.feature`, `traceability.json` | ✅ Xray CSV emitter |
| Verify / gate | **Compass → DX Fabric** ⚠️ (Compass EOL 2026-12-31) | 10-gate DoD, 28 epic-dod files | ✅ Compass payloads |
| Release / deploy | **Jira Releases** + **Bitbucket Deployments** + **JSM change** | 70 CI workflows, deploy-* | — (CI integration) |
| Operate / run | **JSM** (incident/change/on-call/SLO) + **Compass** (health) | 4 runbooks, ops-readiness attestation, observability, METRICS | partial (Compass) |
| Govern / attest | **Confluence** + **JSM** records | 42 attestations, GRC/SOC2/ITIL framework docs | ✅ pages (attestation tree stage 4) |
| Track / report | **Atlassian Goals** + **Analytics** | north-star, METRICS, traceability | — (cross-product) |

### The traceability spine (what delivers "full visibility")

`JPD idea → Confluence spec + ADR → Jira epic/story (with AC) → linked PR → Xray test execution → Compass gate → Jira Release → JSM change/incident → Goals status.`
Every node already exists in the substrate as structured data (`traceability.json` is the proof); Atlassian supplies the cross-linked UI. The exporter reproduces the left half of that chain today.

## Test management: Xray is the the commerce platform standard (grounded)

Per the BigEng internal-docs RAG corpus, **Xray** is the org standard — used by **Payments (`PI`), IAM/Auth (`ANA`), and Catalog**; **Zephyr / TestRail / Qase have zero footprint**. Test *execution* is Playwright-dominant. This overrode the initial instinct to model tests as Compass scorecards.

Xray specifics the exporter follows ([`xray.md`](../rag/bc-internal-docs/process/quality/xray.md), [`iam-xray-testing.md`](../rag/bc-internal-docs/domains/auth/quality/iam-xray-testing.md), [`payments naming`](../rag/bc-internal-docs/domains/payments/quality-space-pi/xray-approach-and-naming-convention.md)):
- Issue types: **Test (+ Steps), Precondition, Test Set, Test Plan, Test Execution**.
- Two load paths: **Test Case Importer CSV** (Testing Board, UI wizard) *or* the **Xray Cloud GraphQL API** (`createTest`, fully headless — `xray_graphql.py`). The GraphQL path proves the blueprint/hive automation thesis: tests hydrate with zero manual steps given an Xray API key.
- Tests cover a Story's **AC via the Test Coverage panel**; `Link "tests" (outward)` = story key.
- **Cucumber** test type carries a `Gherkin Definition` column → our `.feature` files map 1:1.
- Components, Test Repository folders, `Durable Team(s)` are first-class columns.

Mapping applied: BRD AC → Manual Test (Action = Given+When, Expected = Then); `.feature` scenario → Cucumber Test; Test Set per story; surface → Component.

## What the exporter produces today (`tools/jira-confluence-export/`)

| Emitter | Output | Live-proven |
|---|---|---|
| `export.py` → Jira | Epic + Stories + dependency links (REST v3, ADF) | ✅ `KAN-1`/`KAN-2` + `issueLink` 201 on sandbox |
| `export.py` → Confluence | ADR/methodology pages (REST v2, storage XHTML) | ✅ page `524290` on personal space |
| `xray_csv.py` | Xray Test Case Importer CSV (Manual + Cucumber) | dry-run (UI-wizard path) |
| `xray_graphql.py` | **Headless** Xray test creation via Xray Cloud GraphQL (createTest) + AC-coverage links | dry-run (needs Xray API key) |
| `compass.py` | Compass components + scorecard + per-epic results | dry-run (needs Compass provisioned) |

## Honest seams / gaps

1. **Backdating deferred** (2026-06-01) — real chronology rides as visible content, not `created` metadata. Affects velocity analytics.
2. **Sub-tasks not emitted** — the Hive-task↔Story mapping isn't reliably encoded; emitting it would be speculative.
3. **Per-epic vs per-component** — DoD gates are per-epic; Compass scorecards are per-component. No 1:1 map, so per-component gate results are not fabricated.
4. **Multi-actor attribution** — 907 PRs from one human + N autonomous sessions; collapse under one user + `via-claude-code` label + a Confluence methodology page.
5. **Provisioning** — the sandbox has Jira + Confluence only. JPD, Xray, Compass, JSM each need enabling before their legs go live. Xray + Compass imports are UI-wizard / GraphQL respectively (not the REST the proven legs use).
6. **No sprint history** — continuous flow renders as a flat backlog.
7. **⚠️ Compass is sunsetting into DX (EOL 2026-12-31).** [Atlassian is transitioning](https://www.atlassian.com/blog/company-news/the-next-chapter-for-compass) Compass catalog + scorecards into **DX Fabric**. The [migration](https://support.atlassian.com/compass/docs/migrate-from-compass-to-dx/) syncs **components** but **scorecards do NOT sync (must be recreated)**, and **alerts/operations move to JSM**. Implication for us (green-field): the `compass.py` component payloads are forward-portable (they're what migrates), and the scorecard definition is what you'd recreate in DX — but for a *new* setup, target **DX Fabric directly** rather than stand up Compass first. DX has its own ingestion API (getdx.com) that the verify-leg emitter should retarget before going live; this needs verification of DX's component/scorecard API shape. The operate-leg → JSM mapping is reinforced by this change.

## Recommended sequence (post-skeleton)

1. **Provision Xray + Compass** (trials) on a sandbox → flip those two legs from dry-run to live.
2. **Full Epic-1 then full-substrate** Jira+Confluence import (drop `--skeleton`).
3. **JPD + JSM** legs (ideas from spikes; runbooks/attestations → change/incident) once the delivery + test + verify legs are validated.
4. **Atlassian Goals** for the north-star idea→launch status thread.
