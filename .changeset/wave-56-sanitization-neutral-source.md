---
"@nino-chavez-labs/blueprint-cli": minor
---

Wave 56 — public-repo sanitization + neutral template source identity.

**Changed — migration notes**

- **Template source identity is now neutral.** The stampable substrate's reference strings changed from the original source project's identifiers to `blueprint-example` / `Blueprint Example` / `@blueprint-example/` / `--bpx-` / `https://github.com/example/blueprint-example` / tagline `An example product initiative`. `stamp.mjs`'s substitution table and mechanical check now key on these. **Consumers stamped before this version**: `restamp-chrome` no longer rewrites the OLD source strings — if your tree still carries them, run one manual find/replace using the old→neutral pairs in your stamped CLAUDE.md history, or re-stamp.
- **Platform context packs unbundled.** The B2B edition / buyer-portal / marketplace context docs (activated by `b2b_edition.enabled: true`) are no longer published in the repo — they document a specific commerce platform and are supplied privately per engagement. The flag and `docs/context/voice-b2b-addendum.md` remain.
- **Tool rename:** Forge Signal → **Forge Signal** everywhere in prose. The `signal_forge:` blueprint.yml key is unchanged (compatibility).
- **Registry:** `consumers.yml` carries neutral slugs for de-named consumers; operator-local identities live in gitignored `consumers.local.yml`.
- Repositioning: README/METHODOLOGY now describe the full loop (research → BRD/PRD docs → prototype → fact-check → build handoff) instead of "jig".
