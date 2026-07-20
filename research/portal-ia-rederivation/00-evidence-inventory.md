# Portal IA re-derivation — fleet evidence inventory

**Date:** 2026-07-20
**Status:** evidence record (input to the redesign brainstorm; not a proposal)
**Method:** three parallel read-only fleet walks (bc-subscriptions origin; divergent/solo consumers; all four Pattern B consumers) + an inline walk of the self-application's feedback trail. Citations are `file:line` in the consumer repos, verified by the walking agent at read time.

**Provenance caveat (applies throughout):** every "persona walk" in this corpus is an agent simulation grounded in real named readers and real trigger events (the bc-subs CFO Slack thread; the self-app's D. bounce). Except for the operator's own self-QA and D.'s 2026-06-09 visit, there is **no logged human session** of any stakeholder loading any portal URL. Findings below are labeled accordingly; nothing here carries "verified" language for a read that wasn't observed.

---

## 1. The origin repo (bc-subscriptions) already replaced the IA

The 6-verb contract was extracted from bc-subscriptions and frozen fleet-wide. In its own origin:

- **The verbs were derived from the repo's content piles, not from readers.** `apps/portal/README.md:29-41` maps PRD/BRD→discover, demos→try, ADRs→build, guides→operate, methodology/Hive→inspect. The original pills were `executive / discovery / internal` — assumed archetypes; the five real named readers (VP Product, CPO, CFO/COO, two eng directors, the GSI estimator) first appear in the 2026-06-30 audit (`docs/audits/portal-ia-audit-2026-06-30.md:19-27`), triggered by a real Slack thread. Audience assumed at design time, grounded only after the fact.
- **Against real readers: 2 of 5 reached their goal** on the built portal (simulated walks, real personas). The CFO — the decision-maker — failed outright. On raw derived artifacts, **5 of 5 failed** (`docs/methodology/2026-06-30-delivery-packaging-blueprint.md:36-40`).
- **The audience switcher was deliberately deleted on 2026-06-25** ("the content-hiding switcher which the team deliberately removed", `delivery-packaging-blueprint.md:93`), replaced by role-based entry lanes — "routing is 'start here', not a content-hiding switcher." The component sits orphaned in `packages/ui/src/components/audience-switcher/`. The fleet-wide conformance gate still hard-requires it.
- **Verb autopsy:** `try` earned its place (live proof; sole Class-D survivor; absorbed `/operate`). `inspect` was ~40% of the site with no named reader — harness wearing a reader-facing verb's clothes — de-weighted behind one banner-labeled nav entry. `build` failed on the word itself (the GSI estimator read it as "run locally") and was demoted from verb to the `/engineering` audience lane. `discover` was a dead end (0 in / 0 out). Clean-room classification: ~43% of the corpus was agentic-process substrate a delivery-first team would never produce.
- **The two hardest reader-jobs could not be portal lenses at all:**
  - *Cold takeover* → the attested handoff-corpus (17 domains): intent, typed deltas, two human attestations — things derivation cannot produce (`docs/methodology/handoff-corpus-input-spec.md:40-59`).
  - *Commercial bid* → the air-gapped GSI package: positive sanitization with a hard-fail leakage lint, frozen identical per-vendor zips, own deploy. A lens **cites** internal canon; a counterparty artifact must **exclude** it — opposite operations (`docs/gsi-package/README.md`).
- **Replacement architecture already ratified there:** canonical layer (durable-derived + attested) + per-audience lens layer that cites, never authors (`delivery-packaging-blueprint.md:46-72`).

## 2. Divergent/solo consumers — two failure modes, not one

Walked: film-room (conformant A), atelier + tna (remotes; removed from disk), atelier-dashboard-blueprint (archived), ai-content-engine (**unrecoverable** — off disk, remote 404; its divergence ADR is lost; only `consumers.yml` classification survives).

- **Failure mode (a) — operator console** (film-room, ai-content-engine): one reader; the content-carrying IA is the execution-ordered pipeline. Film-room ADR-0004's principle states the reader-job logic the portal verbs violate: *"Jobs is not a destination, it is a status. Nobody's goal is 'go to Jobs.'"* Per `blueprint.yml`: only Try + Operate carry content; Inspect/Roadmap sources are `null`; the audience block is empty. The switcher is a **hazard**, not fluff: the corpus holds pilot-club negotiation prep the sole external audience must never see.
- **Failure mode (b) — product absorbs portal** (atelier, tna, atelier-dashboard): genuinely multi-audience, and still rejected the 6-verb portal, because the product itself is the surface. atelier ADR-001: a separate portal would be *"a second dashboard surface"* to maintain; audience distinctions live as role-aware routes **inside** the product. tna's deliverable is a marketing site read by buyers. atelier-dashboard was a one-shot design-review artifact whose feedback loop never fired.
- **Cross-cutting:** across every divergent consumer, only **Try** and **Operate** ever carried real content. No consumer had a reader whose job was "switch to the executive lens and inspect the roadmap."
- **Registry hygiene (side finding):** `consumers.yml` does not reflect that ai-content-engine is gone and atelier/tna are remote-only. The lost ai-content-engine ADR is a live demonstration of the promote-rationale rule: the divergence rationale most relevant to this re-derivation vanished with its repo.

## 3. Pattern B consumers — the reviewer persona is fictional on the evidence

Walked: rally-hq, website-nc, photography, blog. **Zero external redesign reviewers ever opened any Pattern B portal.** The only observed reader in all four is the operator doing self-QA (plus synthetic walk agents in rally-hq, one of which produced false negatives by reading HTML source instead of runtime).

- **rally-hq:** declared `broader` audience (pilot organizers, captains) never appears as an observed reader. The five-intent front door was observed failing ("two of five intent cards pointed at harness material") and torn out for three reader-lens pages. SSP second instance filed: class-membership ≠ lens-membership; multi-repo banner provenance.
- **website-nc:** every recorded interaction hit the bespoke hand-authored front door, never the canonical chrome; the operator showed up only to debug a false "live" badge, a content leak, and a crash. Real changes shipped into the live app; the review portal is vestigial.
- **photography:** pre-reader, stated plainly — no feedback artifact exists. Load-bearing chrome finding: the compare axis semantically collapsed (proposed IS shipped), yet "what changed" still landed **via the current-state drawer**. The drawer holds when the toggle collapses.
- **blog:** abandoned mid-flight; portal deployed but share gates never met; the reviewer's decide path was literally `status: 'blocked'`. Never reviewed by anyone.
- **Chrome autopsy:** the **drawer is the load-bearing primitive**; compare toggle and chat FAB are the fragile legs — chat disabled (rally-hq), collapsed (photography), unused (blog, website-nc). What transfers: anchor navigation to the artifact-under-review via the drawer — not the drawer+compare+chat triad.
- **Systemic:** in three of four repos the strongest signal is tooling strain, not reader behavior — the Pattern B stamp path "appears to have never been executed end-to-end" (website-nc, six same-week amendments); the stamper only scaffolds Pattern A, which biased photography's pattern choice; rally-hq's `restamp` dead-ends at exit 3. Several contracts were never reader-tested because the initiative never got far enough to have a reader.

## 4. The self-application — the contract's author defected first

- `decisions/02-portal-bespoke-product-site.md`: when the fold changed the portal's job to "product homepage," the 6-verb IA and switcher were **removed**; the conformance reviewer correctly blocked; the resolution was a bespoke-escape ADR rather than a contract fix. The contract's first response to a real job change was an escape hatch.
- `docs/content/validation-script.md` re-derived the reader set from observed humans months ago: casual visitor (D. — bounced; walk standing RED), evaluating team lead (R./V./J. — engaged with the artifacts, not the portal chrome), prospective contributor. Nobody in the log is an "executive." The observed readers replaced the pill taxonomy; the IA never caught up.

---

## Cross-fleet verdicts

1. **The 6-verb IA organized the builder's content, never the reader's job.** Its origin repo replaced it (canonical layer + lens layer) within five weeks of meeting real readers.
2. **The audience switcher is dead weight everywhere and a hazard in one place.** Deleted at origin 2026-06-25; empty-configured or fictional in every other consumer; a leak surface where the corpus holds counterparty-sensitive material. The conformance gate still enforces it fleet-wide.
3. **Only two verbs ever carried content across the whole fleet: Try (live proof) and Operate (run it).** Both survive in every replacement shape the fleet invented.
4. **Route-presence conformance is satisfiable while failing the reader** (film-room passed the gate and served nobody). Gates must re-anchor on declared-reader-jobs-served.
5. **Two reader-jobs are structurally not portal content:** cold takeover (attested corpus) and commercial counterparty (air-gapped, sanitization-linted export — exclusion by construction, never a lens).
6. **The most frequent actual reader of Blueprint artifacts is an agent** (next-session context recovery via the SessionStart inject), and no artifact class is designed for it — it's served by a hook side-channel.
7. **The fleet has no observed instance of a real multi-audience portal reader outside bc-subscriptions.** Multi-audience is the exception requiring evidence, not the stamped default.

## Next

`01-artifact-classes-seed.md` — the reader × job × artifact-class matrix distilled from this inventory; input to the redesign brainstorm. The proposal/ADR follows the brainstorm, not this doc.
