---
layout: ../../layouts/DocLayout.astro
title: Getting Started
description: "Install Blueprint and scaffold your first portal in five minutes."
---

# Getting Started

The on-ramp for running Blueprint for the first time. Five minutes to a scaffolded portal you can build on.

## 1. What you need

- **Node.js >= 18.** The CLI checks nothing else; it is dependency-free (hand-rolled arg parsing, no `node_modules` to install for the CLI itself).
- **The Blueprint CLI.** Install global or run on demand:

  ```bash
  npm install -g @nino-chavez-labs/blueprint-cli
  # or, no install:
  npx @nino-chavez-labs/blueprint-cli <command>
  ```

  The binary is `blueprint`. `npm view @nino-chavez-labs/blueprint-cli version` shows the latest published version — releases ship continuously, so check npm rather than this page.

- **A target directory** for the new initiative — where the portal gets stamped (e.g. `~/projects/my-project`). Defaults to `./<name>` and is created when missing.
- **A browser sensor**, only when you reach Stage 0 legibility against a running prototype. The default is `browse-tool`; wire it later, not now. Skip it for scaffolding.

Verify the install:

```bash
blueprint --version    # prints the installed version
blueprint --help
```

If the installed version trails `npm view @nino-chavez-labs/blueprint-cli version`, reinstall before continuing.

## 2. The mental model

Blueprint runs a **7-stage pipeline**: Legibility (0) -> Research (1) -> Design Principles (2) -> Prototype (3) -> Fact-Check (4) -> Documents (5) -> Deploy (6), with Iterate (7) after stakeholders see it. Each stage gate is an **executable reviewer** — `research-completeness-reviewer`, `doc-quality-auditor`, `prototype-smoke-runner`, and the rest — that has to PASS before the next stage unblocks. You drive the producing stages with slash-command skills: `/blueprint-research`, `/blueprint-prototype`, `/blueprint-validate`, `/blueprint-docs`, `/blueprint-deploy`, `/blueprint-triage`.

Before any of that, three orthogonal choices set the shape of the work. **Variant** is what you're doing: Greenfield (build a north-star prototype), Midstream (revise a live in-flight product), or Brownfield (audit + prescribe against a mature product). **Tier** is how far you've gone: Tier 0 (pre-portal scratch, <=1 week), Tier 1 (a portal exists — the default starting point), Tier 2 (portal plus live product surfaces). **Pattern** is the portal's IA: Pattern A (platform-portal, multi-surface product with a fixed route contract and an audience switcher) or Pattern B (redesign-review-portal, current-state-vs-proposed comparison for a brownfield audit). Pick variant, tier, and pattern before you scaffold — the wrong pattern forces a rebuild.

## 3. Install and scaffold your first portal

`blueprint init` scaffolds a Pattern A portal at Tier 1. Under the hood it *stamps*: copies the template, substitutes your name/repo/tagline for a fixed token set, writes `blueprint.yml`, and finishes with a post-stamp grep — a search proving no strings from the template's source project leaked into your copy.

`--name` is the only required flag — every other flag derives a default, and every applied default is echoed back on a `defaulted:` line so nothing is silent:

```bash
blueprint init --name=my-project
```

The explicit form, when you want to set everything yourself (any flag overrides its default):

```bash
blueprint init \
  --name=my-project \
  --display-name="My Project" \
  --repo-url=https://github.com/owner/my-project \
  --tagline="One-line product tagline" \
  --variant=greenfield \
  --tier=1 \
  --pattern=A \
  --target=~/projects/my-project
```

Flag notes:

- `--name` is the project slug (used in package metadata, footer brand, file substitutions). Required.
- `--display-name`, `--tagline`, `--repo-url` default to a title-cased name, a generic tagline, and a placeholder URL — replace the placeholder before sharing the portal.
- `--variant` is `greenfield` (default), `midstream`, or `brownfield`.
- `--tier` is `0`, `1`, or `2`. Tier 1 is the default — the starting point for a serious initiative.
- `--pattern=A` is the supported initial stamp today. **Pattern B has no initial-stamp path yet** — the stamper supports Pattern B only through `--mode=restamp-chrome`, which refreshes the shared shell files (the "chrome") of an existing portal, not a fresh scaffold. Pattern B initiatives copy `template/portal/` from the methodology repo instead.
- `--target` is the path to the new initiative root. Defaults to `./<name>`; created when missing.

## 4. What you just got

After the stamp runs, the output reports three things:

- **copied (binary)** — assets carried over verbatim (logos, images).
- **stamped (text + substitutions applied)** — every file where the source slug was replaced with your `--name` / `--display-name` / `--repo-url`.
- **mechanical check: PASS** — the post-stamp grep found no unexpected residual source strings. If it fails, it lists the residuals as a stamper bug, not your problem to patch.

The target directory now holds a **Tier 1 Pattern A portal**: the `apps/portal/` Astro + React shell (canonical IA — overview, discover, try, build, operate, inspect, roadmap), the `packages/` workspace it consumes (`@blueprint/ui`, `@blueprint/design-tokens`), and a stamped `blueprint.yml` declaring your variant, tier, and pattern. Content is placeholder by design — Tier 1 means the front door exists, not that it's filled in.

Sanity-check the scaffold without building or deploying anything:

```bash
blueprint doctor --target=~/projects/my-project
```

`doctor` loads the config, every discovered reviewer, and runs portal conformance, then tells you what it did **not** check (full build, browser verification, deploy connectivity) so a green here is never mistaken for a deploy green.

## Where to next

Scaffolding is Stage 0-to-1 plumbing. The **[Tutorial](/learn/tutorial)** walks the whole pipeline end to end — every stage, every reviewer gate, deploy, verify — but on the *other* path: an existing-product redesign (Pattern B, the lighter review portal), which exercises every gate without scaffolding in the way. That is deliberate, not a mismatch with what you just built.

Your freshly stamped full-site workspace (Pattern A) follows the same stages. Run the same skills in the same order against it — `/blueprint-research`, `/blueprint-prototype`, `/blueprint-validate`, `/blueprint-docs`, `/blueprint-deploy` — and the tutorial's stage sections map 1:1. Only the tutorial's "Scaffold the portal" step doesn't apply; `blueprint init` already did that for you.

Prefer watching first? The [demo](/demo?reel=deep) shows that exact flow compressed into a step-through walkthrough.

Start the Tutorial once `blueprint doctor` reports PASS.
