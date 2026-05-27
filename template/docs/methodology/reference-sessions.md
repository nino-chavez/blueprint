# Reference sessions

Sessions run on prior Blueprint initiatives that are canonical examples for methodology, tooling, or design patterns. Use these when onboarding a new initiative or when a current session encounters a pattern that "has been solved before."

---

## bc-promo-rules — Blueprint pipeline dogfood (2026-05-26)

**What it is**: The first complete run of the full Blueprint greenfield pipeline (Stages 1–6) on a net-new initiative, used simultaneously as a real product proposal and as a methodology audit.

**Why it is canonical**: Every stage of the pipeline was exercised end-to-end within a single session arc. Gate failures were caught and corrected in-session rather than post-deploy. Four methodology amendments were produced and promoted back into the blueprint template in the same session that discovered them.

**Gate failures caught in-session (and what they teach)**:
- Gate 3→4: PROTO_PAGE declarations missing on 6 portal pages. Fix: add `<script is:inline>window.PROTO_PAGE = { id: '...' };</script>` to every portal route. The gate reviewer should list this as a hard block, not a warning.
- Design coverage: 6 gaps including missing BigDesign DOM vocab (`bd-accordion`, `bd-form-group`, `bd-input`, `bd-button-group`), missing `data-audience-switcher` attribute, fabricated sprint estimates. Fix each in the portal before advancing.
- Fact-check: three categories of fabricated claims — sprint estimates with no source, a specific-company framing that implied documented incident, a Shopify date hedge stated as fact. Replace with relative scope labels, "representative scenario" framing, and hedged dates.

**Research patterns introduced**:
- [current-state-research-prompt.md](current-state-research-prompt.md) — "what needs to be true" frame, named from the CEL vs. typed-DSL investigation
- [architect-challenge-pattern.md](architect-challenge-pattern.md) — expression-surface comparison, named from the architectural-options analysis

**Scaffold contamination caught**:
- The stamped portal inherited bc-subscriptions strategy content verbatim (delivery-fork.astro contained a 20-row native-shape gap matrix with RabbitMQ/BigPay/Nomad references; strategy/index.astro had a bc-subscriptions delivery-fork entry). 
- Root cause: the stamper performed string substitutions but never blanked the archaeology WORKER_URL or replaced strategy page content with neutral skeletons.
- Fix: four stamp.mjs + template changes (see Amendment 1 in METHODOLOGY-AMENDMENTS.md in bc-promo-rules).

**Portal**: `bc-promo-rules.pages.dev` (Cloudflare Pages, deployed Stage 6)

**Repo**: `~/Workspace/dev/wip/bc-promo-rules`

---

## Adding a new entry

Add entries here when a session produces:
- A novel gate-failure mode and its fix
- A new methodology pattern worth naming and reusing
- A stamper/template gap discovered in production

Keep each entry under ~20 lines. The goal is "I've seen this before — see reference session X" retrieval, not a full narrative.
