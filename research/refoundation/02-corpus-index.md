---
canonical: false
status: active-index
date: 2026-07-22
depends_on:
  - research/refoundation/00-charter.md
  - research/refoundation/01-incident-record-contract.md
---

# Re-foundation corpus index

## Registry snapshot and its limit

`node bin/blueprint.mjs fleet --json` run on 2026-07-22 against the current
working tree reported:

- 14 registered consumers;
- 5 behind the current `0.7.0` methodology;
- 9 unpinned;
- 0 classified current; and
- no malformed or duplicate registry rows.

This is a visibility snapshot, not an authoritative adoption census.
`consumers.yml` explicitly describes itself as a hand-maintained mirror, and the
snapshot demonstrates that limit: Film Room's local `blueprint.yml` declares
`0.7.0` while the registry row still mirrors `0.6.0`.

Local discovery also found current manifests absent from the registry:

- `quantifai-next`;
- `se-docs-frontdoor`; and
- `fleet-observability`.

Conversely, some registry entries are remote-only, archived, removed from disk,
or verified only by operator declaration. A future definition of "consumer"
must distinguish at least declaration, local manifest, active execution,
methodology-origin evidence, and observed external adoption. The re-foundation
does not use registry membership as a proxy for evidentiary quality.

## Public-safe source aliases

Consumer citations in this package use `<alias>:<repo-relative path>` so the
public methodology repository does not commit machine-local roots or private
identities.

| Alias | Registry/public identity | Local evidence posture |
|---|---|---|
| `blueprint-self` | this repository's root self-application | verified local |
| `film-room` | `nino-chavez/film-room` | verified local; no public remote required for this study |
| `private/subs-initiative` | de-named subscriptions initiative | verified local methodology-origin evidence; intentionally unpinned/no `blueprint.yml` |
| `rally-hq` | `nino-chavez/rally-hq` | verified local |
| `se-docs-frontdoor` | currently unregistered | verified local; no remote |
| `quantifai-next` | currently unregistered | verified local |
| `fleet-observability` | currently unregistered | verified local |
| `external-a/media-toolkit` | de-named external adopter | registry + public validation-log evidence only; underlying corpus not yet located |

Session IDs may appear as source locators, but transcript text is not copied
unless the minimum excerpt is necessary, source-sampled, and public-safe.

## Primary case selection

| Case | Why it is not interchangeable with another case | Dossier status |
|---|---|---|
| Film Room | Separates founder-proven value from later distributable-product readiness; includes existing-rule violations and a delayed scope transition | evidence ready |
| BC Subscriptions | Demonstrates presence/function authority bleed at large codebase scale and supplies the G1–G5 response | evidence ready |
| Rally HQ | Live midstream SaaS with real users, synthetic Blueprint research, state drift, stakeholder projections, and runtime-vs-source reviewer errors | evidence ready |
| SE Docs Front Door | Primary product surface is configured external behavior; multi-actor outcome and baseline precondition; code is the fallback | evidence ready, real pilot outcome pending |
| QuantifAI | Positive control for killing an unreachable pilot and re-deriving downstream scope before further build commitment | evidence ready, market outcome pending |
| Fleet Observability | Lean solo dogfood control; protects against universal launch/handoff ceremony | shape verified; incident audit partial |
| external adopter | Only evidence of transfer beyond the creator's tacit workspace; necessary for adoption claims | metadata only until underlying artifacts are located |

## Supporting capability-map cases

These consumers inform the later current-system map. They do not receive a full
counterfactual replay unless they falsify a primary-case conclusion.

| Consumer | Distinct supporting evidence |
|---|---|
| Website NC | Brownfield Tier 2 public surface; fresh Pattern-B stamps failed their own gates, separating tooling defects from kernel defects |
| Signal Dispatch / Blog | Variant is determined by the work, not existence of an earlier product; also surfaced provenance/JTBD continuity loss |
| Photography | Midstream Tier 2, observed end-user demand, privacy/identity boundaries, nested initiative root |
| Blueprint self-application | Recursive governance, reader validation, and methodology/output coupling; never counts as external validation |
| Atelier | Potential coordination/DoD/handoff boundary case; registry path must be re-verified before use |
| AI Content Engine, TNA, Promotions, DMS North Star, Atelier Dashboard | Registry or historical evidence only in the current workspace; admit only for a unique incident shape |

Film Room worktrees and archived Blueprint copies are not independent consumers.
They are alternate checkouts or historical states of an already represented
case.

## Existing fleet research reused

The study inherits, but does not blindly trust, the executed evidence in:

- `research/portal-ia-rederivation/00-evidence-inventory.md` — cross-fleet reader
  and portal findings, including the observed-human caveat;
- `research/portal-ia-rederivation/05-specimen-walk.md` — four real consumer
  manifests mapped to actor/output outcomes; and
- `research/portal-ia-rederivation/06-validator-run.md` — executed positive and
  negative fixtures for lifecycle, clearance, proof grade, typed preconditions,
  path resolution, and legacy routing.

Those findings answer a narrower output-contract question. The re-foundation
must not infer that actor-output is therefore the whole kernel. It is one
field-tested candidate capability among intent, claim, authority, evidence, and
transition controls.

## Coverage matrix

| Required dimension | Primary evidence |
|---|---|
| Greenfield creation | Film Room initial arc; QuantifAI; Fleet Observability |
| Midstream live revision | Film Room distribution arc; Rally HQ |
| Large code-shipping program | BC Subscriptions |
| Non-code/configure-first | SE Docs Front Door |
| Solo operator | Film Room, QuantifAI, Fleet Observability |
| Multiple human actors | Rally HQ, SE Docs Front Door, BC Subscriptions |
| Commercial/distribution boundary | Film Room; BC counterparty package |
| Pilot invalidation/re-charter | QuantifAI positive control; Film Room delayed contrast |
| Presence vs behavior/live | BC Subscriptions; Film Room packaged-app audit |
| Reader/outcome evidence | Rally HQ; actor-output specimens; Blueprint self validation log |
| External transfer | external adopter, presently metadata-only |
| Low-ceremony falsification | Fleet Observability |

## Known evidence limitations

1. Most cases share one operator. Repetition across repositories is not the same
   as independent adoption.
2. Many persona walks are agent simulations. They may expose defects but cannot
   establish observed-human success.
3. Claude-to-Codex comparisons are role- and context-confounded. No same-packet,
   same-tools, blind-evaluation experiment has been run.
4. Registry state is a mirror and the current worktree is dirty; this snapshot
   must be reproduced before any migration decision.
5. The external-adopter evidence currently establishes adoption, not method
   effectiveness.
6. Recent initiatives were created after many Blueprint controls existed; they
   are useful positive/negative controls but not proof that those controls work
   over a long lifecycle.

## Corpus completion gate

The corpus is ready for operator ratification when:

- each primary local case has an incident dossier using the record contract;
- every incident distinguishes intent, claim, evidence, and authority;
- disputed or transcript-only claims are labeled;
- the external adopter is either evidenced or explicitly excluded from causal
  conclusions; and
- the operator can remove or correct incidents before any kernel is proposed.
