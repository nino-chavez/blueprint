#!/usr/bin/env node
/**
 * blueprint-init/stamp.mjs — mechanically-checkable Initiative Portal scaffolder.
 *
 * Replaces the 2026-05-25 "copy template/apps/portal/ and remember to de-bc-ize"
 * pattern that left blueprint-example strings embedded in 6+ files. The stamper
 * substitutes a fixed token set, renames the logo, writes blueprint.yml, and
 * runs a post-stamp grep to confirm no unexpected source strings remain.
 *
 * See ./README.md for the full contract.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
const execFile = promisify(execFileCb);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ── Variant × Tier matrix (kept in sync with docs/portal-and-tier-ladder.md) ──
// true  = allowed and reasonable; false = blocked unless --force.
const VARIANT_TIER_MATRIX = {
  greenfield: { 0: "exploration-only", 1: "default", 2: "if-product-day-one" },
  midstream:  { 0: "blocked", 1: "portal-only", 2: "default" },
  brownfield: { 0: "doc-only-audit", 1: "default", 2: "audit-ships-product" },
  research:   { 0: "default", 1: "portal-optional-provenance", 2: "blocked" },
};

// ── Review Portal canonical chrome manifest (wave 74, 2026-06-27) ───────────
// Two profiles model the two consumer relationships to canonical chrome.
//
// PROFILE A (methodology-themed, default): consumer's brand is a thin override.
// Files in template/portal/ that are CANONICAL CHROME — methodology-owned,
// consumer-uneditable. `--mode=restamp-chrome` overwrites these files in the
// consumer's portal from template canonical; anything not in this list
// (project-tokens.css, _meta/*, pages/*, index.html, etc.) is left untouched.
//
// PROFILE B (consumer-themed, opt-in): consumer owns shared.css (design system);
// canonical primitives split into separate file. Byte-identity enforced only on
// canonical-primitives.css; consumer's shared.css is out of scope.
//
// Adding a file: the file must be byte-identical to template canonical
// after stamp (no PROJECT_NAME-style substitutions). If the file needs any
// per-project substitution, it does not belong in chrome — move it to the
// project-owned overlay surface (project-tokens.css, _meta, etc.).
//
// Origin: rally-hq amendment 2026-05-26 (the portal-chrome-canonical-reviewer
// model breaks for brand-owning consumers). See docs/methodology/chrome-profile-pattern.md.

const PATTERN_B_CHROME_FILES_PROFILE_A = [
  "shared.css",
  "_portal-shell.js",
  "proto-nav.js",
  "proto-annotate.js",
  "chat-widget.js",
  "theme-switcher.js",
  "_headers",
  "_redirects",
  "docs/index.html",
];

// Profile B: shared.css is consumer-owned; canonical primitives are byte-identical
const PATTERN_B_CHROME_FILES_PROFILE_B = [
  "canonical-primitives.css",  // NEW: the genuinely universal primitives
  "_portal-shell.js",
  "proto-nav.js",
  "proto-annotate.js",
  "chat-widget.js",
  "theme-switcher.js",
  "_headers",
  "_redirects",
  "docs/index.html",
];

// Backwards compat: existing code references PATTERN_B_CHROME_FILES directly
const PATTERN_B_CHROME_FILES = PATTERN_B_CHROME_FILES_PROFILE_A;

// Candidate locations a Review Portal consumer might place its portal. Resolve in
// order; first existing directory wins. Reflects the path-drift observed
// across rally-hq (blueprint/portal/) and the canonical (portal/) shapes.
//
// 2026-05-27 wave 14: the resolver now reads `prototype.portal_dir` from the
// consumer's blueprint.yml first; this candidate list is the fallback for
// first-time stamps and for consumers that haven't declared portal_dir. Source:
// rally-hq amendment 2026-05-26 (gap 1) — rally-hq's portal at blueprint/prototype/
// was outside this candidate list because the directory predates the canonical
// Review Portal contract.
const PATTERN_B_PORTAL_CANDIDATES = [
  "portal",
  "blueprint/portal",
];

// ── Substitution surface (mirrors README "Substitution table" exactly) ────────
function substitutions({ name, displayName, repoUrl, tagline, theme }) {
  const shortPrefix = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "bp";
  return [
    // Order matters: longer specific strings before shorter generic ones.
    // The template tree carries the neutral source identity "blueprint-example"
    // (2026-06-10 sanitization: the public repo names no real source project);
    // these rules parameterize it into the consumer's identity at stamp time.
    { from: "https://github.com/example/blueprint-example", to: repoUrl },
    { from: "An example product initiative", to: tagline },
    { from: "@blueprint-example/", to: `@${name}/` },
    { from: "Blueprint Example", to: displayName },
    { from: "--bpx-", to: `--${shortPrefix}-` },
    { from: "blueprint-example", to: name },
    // Explicit fill-me tokens the de-narrated pages use for brand + repo, so the
    // generic shell carries no reference-project name (PortalNav brand, Layout
    // fullTitle, strategy REPO const). NOTE: the banner prose "REPLACE_FOR_PROJECT —"
    // (space-dash) is a DIFFERENT token and is intentionally not matched here.
    { from: "REPLACE_FOR_PROJECT_NAME", to: displayName },
    { from: "REPLACE_FOR_PROJECT_REPO", to: repoUrl },
    { from: "REPLACE_FOR_PROJECT_TAGLINE", to: tagline },
    // Wave 85: the Pattern B shells used a placeholder vocabulary the table
    // never covered — consumers shipped a literal PROJECT_SLUG in wrangler.toml
    // and the first `wrangler pages deploy` failed on the project name. Only
    // PROJECT_SLUG joins the table: it appears solely in string/prose contexts.
    // (A bare PROJECT_NAME rule would clobber Layout.astro's PROJECT_NAME JS
    // identifier — the Pattern B shells now use REPLACE_FOR_PROJECT_NAME.)
    { from: "PROJECT_SLUG", to: name },
    // Multi-theme registry (2026-05-26 wave 11): the stamper writes the
    // initiative's chosen theme into <html> as data-theme so the default applies
    // before JS loads. Runtime theme-switcher.js can override at the operator's
    // choosing (it reads ?theme= query param + localStorage first).
    { from: '<html lang="en">', to: `<html lang="en" data-theme="${theme}">` },
    // The archaeology WORKER_URL and the reference initiative's satellite URLs
    // were blanked IN the template tree itself (2026-06-10 sanitization), so the
    // historical blank-at-stamp rules are gone: a stamped portal is born with an
    // empty WORKER_URL (the component renders the disabled "substrate not yet
    // configured" state) and no external reference-project endpoints.
  ];
}

// Files where the reference-project strings are business content (10-gate framework,
// delivery-fork strategy, dependency-graph example issues) OR substrate-aware
// governance pages that will fail at build time if the initiative doesn't run
// Hive / state-derive (the substrate produces docs/audits/derived/_state.json
// and docs/hive/_board.json; `loadState`/`loadBoard` throw ENOENT without them).
// The stamper still performs the substitutions, but prepends a banner so the
// operator knows the content needs review or the page needs deletion.
const BANNER_FILES = new Set([
  "apps/portal/src/pages/inspect/gates.astro",
  "apps/portal/src/pages/inspect/coverage.astro",
  "apps/portal/src/pages/inspect/attestations.astro",
  "apps/portal/src/pages/inspect/dependencies.astro",
  "apps/portal/src/pages/strategy/delivery-fork.astro",
  "apps/portal/src/pages/strategy/index.astro",
  "packages/ui/preview/dep-graph-data.js",
]);

const BANNER_LINES = {
  ".astro": [
    "<!--",
    "  REPLACE_FOR_PROJECT — this surface carries example/placeholder content from the",
    "  Blueprint reference template. Populate it from your initiative's deliverables (or",
    "  delete it) before sharing with stakeholders. The portal-initiative-conformance-",
    "  reviewer treats this banner as a block — resolve before sharing.",
    "-->",
    "",
  ].join("\n"),
  ".js": [
    "/**",
    " * REPLACE_FOR_PROJECT — this file carries example/placeholder data from the",
    " * Blueprint reference template. Replace before shipping to stakeholders.",
    " */",
    "",
  ].join("\n"),
};

// Extensions the stamper performs substitutions inside. Skip binary assets.
// Wave 85: .toml added — wrangler.toml rode the binary path, preserving its
// PROJECT_SLUG token through every stamp (and hiding it from mechanicalCheck).
const TEXT_EXTS = new Set([
  ".astro", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs",
  ".json", ".md", ".css", ".html", ".yml", ".yaml", ".toml",
]);

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    const m = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    args[m[1]] = m[2] ?? "true";
  }
  return args;
}

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(2);
}

async function readMaybe(p) {
  try { return await fs.readFile(p, "utf8"); } catch { return null; }
}

// Directories that are never source: deps, VCS, and build output. Skipping
// `dist`/`dist-story`/`.astro` keeps mechanicalCheck off generated artifacts
// (rendered HTML legitimately contains business content from banner pages).
const WALK_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "dist-story",
  ".astro",
]);

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (WALK_SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function applySubstitutions(content, subs) {
  let next = content;
  for (const { from, to } of subs) {
    next = next.split(from).join(to);
  }
  return next;
}

// Insert the REPLACE_FOR_PROJECT banner without breaking the file's syntax.
// For an .astro file that opens with a `---` frontmatter fence, the HTML-comment
// banner must NOT go above the opening fence (that turns the fence into the
// frontmatter and parses the comment as JS — esbuild then chokes on the em-dash).
// Place it immediately after the closing fence, where `<!-- -->` is valid markup.
// All other files (and .astro files with no frontmatter) get a simple prepend.
function insertBanner(content, banner, ext) {
  if (ext === ".astro") {
    const lines = content.split("\n");
    if (lines[0]?.trim() === "---") {
      let closeIdx = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "---") { closeIdx = i; break; }
      }
      if (closeIdx !== -1) {
        const head = lines.slice(0, closeIdx + 1).join("\n");
        const rest = lines.slice(closeIdx + 1).join("\n");
        return `${head}\n${banner}${rest.startsWith("\n") ? rest.slice(1) : rest}`;
      }
    }
  }
  return banner + content;
}

async function copyTree({ src, dst, subs, dryRun, log }) {
  const entries = await walk(src);
  for (const srcFile of entries) {
    const rel = path.relative(src, srcFile);
    const dstFile = path.join(dst, rel);
    await fs.mkdir(path.dirname(dstFile), { recursive: true });

    const ext = path.extname(srcFile);
    const isText = TEXT_EXTS.has(ext);

    if (!isText) {
      log.copied.push(rel);
      if (!dryRun) await fs.copyFile(srcFile, dstFile);
      continue;
    }

    const raw = await fs.readFile(srcFile, "utf8");
    let next = applySubstitutions(raw, subs);

    const relFromBlueprintRoot = path.relative(BLUEPRINT_ROOT, srcFile);
    const templateRelKey = relFromBlueprintRoot.replace(/^template\//, "");
    if (BANNER_FILES.has(templateRelKey)) {
      const banner = BANNER_LINES[ext] || BANNER_LINES[".js"];
      next = insertBanner(next, banner, ext);
      log.banner.push(rel);
    } else {
      log.stamped.push(rel);
    }

    if (!dryRun) await fs.writeFile(dstFile, next, "utf8");
  }
}

async function renameLogo(target, dryRun, log) {
  const src = path.join(target, "apps/portal/public/project-logo.png");
  const dst = path.join(target, "apps/portal/public/project-logo.png");
  const exists = await fs.stat(src).catch(() => null);
  if (!exists) return;
  if (dryRun) {
    log.renamed.push("apps/portal/public/project-logo.png → project-logo.png");
    return;
  }
  await fs.rename(src, dst);
  log.renamed.push("apps/portal/public/project-logo.png → project-logo.png");
}

async function replaceLogo(logoSrc, target, dryRun, log) {
  if (!logoSrc) return;
  const dst = path.join(target, "apps/portal/public/project-logo.png");
  if (dryRun) {
    log.renamed.push(`copied ${logoSrc} → apps/portal/public/project-logo.png`);
    return;
  }
  await fs.copyFile(path.resolve(logoSrc), dst);
  log.renamed.push(`copied ${logoSrc} → apps/portal/public/project-logo.png`);
}

// Write the workspace-root package.json so the four @blueprint/* "*" deps in
// apps/portal resolve to the local workspace packages (apps/*, packages/*)
// instead of the npm registry (where they do not exist). Without this, a
// freshly-stamped portal can't `npm install`. skip-if-exists, like
// writeBlueprintYml — never clobber an operator-customized workspace root.
async function writeWorkspaceRoot({ target, name, dryRun, log }) {
  const dst = path.join(target, "package.json");
  const existing = await readMaybe(dst);
  if (existing) {
    log.skipped.push("package.json (workspace root already exists; preserved)");
    return;
  }
  const pkg = {
    name: `${name}-workspace`,
    private: true,
    workspaces: ["apps/*", "packages/*"],
    scripts: {
      dev: "npm run dev -w apps/portal",
      build: "npm run build -w apps/portal",
      typecheck: "npm run typecheck -w apps/portal",
    },
  };
  if (dryRun) {
    log.skipped.push("package.json (workspace root; dry-run; would write)");
    return;
  }
  await fs.writeFile(dst, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  log.stamped.push("package.json (workspace root)");
}

async function writeBlueprintYml({ target, name, variant, tier, portalType, tagline, repoUrl, dryRun, log }) {
  const dst = path.join(target, "blueprint.yml");
  const existing = await readMaybe(dst);
  if (existing) {
    log.skipped.push("blueprint.yml (already exists; preserved)");
    return;
  }
  const header = [
    `# Blueprint Configuration — stamped by template/tools/blueprint-init on ${new Date().toISOString().slice(0, 10)}`,
    "",
    "project:",
    `  name: "${name}"`,
    `  description: "${tagline}"`,
    `  product: ""`,
    "  audience:",
    "    leadership: []",
    "    engineering: []",
    "    broader: []",
    "",
    "# Pipeline shape — see Blueprint docs/variant-selection.md (methodology source)",
    `variant: ${variant}`,
    "",
    "# Deliverable sophistication — see Blueprint docs/portal-and-tier-ladder.md (methodology source)",
    "# Variant × Tier matrix codified in that doc; do not deviate without an ADR.",
    `tier: ${tier}`,
    "",
  ];
  // Research variant: deliverable is a decision memo, not a product. Emit a
  // research-shaped config (no portal block) + machine-readable stage requirements
  // the reviewer gates read. All other variants get the Initiative Portal config.
  const researchBody = [
    "# Research variant — deliverable is docs/decision-memo.md. The portal is OPTIONAL",
    "# provenance only and is NOT stamped by default. Gates: persona-fit-reviewer,",
    "# research-completeness-reviewer (3 legs), fact-check-loop-reviewer, doc-quality-auditor.",
    "",
    "# Machine-readable stage requirements — the reviewer gates read this block.",
    "stages:",
    "  stage_0:",
    '    output: "research/sources/"',
    "  stage_1:",
    '    output: "research/personas-and-jtbd.md"',
    "    requires:",
    '      - "research/sources/"',
    '      - "research/personas-and-jtbd.md"',
    "  stage_2:",
    "    requires:",
    '      - "research/problem-space/"',
    '      - "research/competitive/"',
    '      - "research/prior-art/"',
    "  stage_5:",
    '    output: "docs/decision-memo.md"',
    "",
    "decisions:",
    '  dir: "decisions"               # NNNN-slug.md ADRs; each carries a serves: persona-job tag',
    "",
    "execution:",
    "  depth: standard",
    "",
  ];
  const portalBody = [
    "# ──────────────────────────────────────────────────────────────────",
    "# Pilot profile — REQUIRED before Stage 0 → 1. `blueprint stage advance`",
    "# and pilot-profile-lock-reviewer BOTH block until every field below is",
    "# filled and walkthrough_citation resolves to a real file.",
    "# Reference: template/docs/methodology/pilot-profile-template.md",
    "# pilot_profile_policy: required is stamped on every new initiative;",
    "# initiatives stamped before the field existed lack it and get legacy",
    "# tolerance (the reviewer still audits their substance).",
    "# ──────────────────────────────────────────────────────────────────",
    "pilot_profile_policy: required",
    "pilot_profile:",
    '  slug: ""                          # short id, e.g., "tournament-organizer"',
    '  display_name: ""                  # e.g., "Tournament Organizer (regional, multi-court)"',
    '  pain_point: ""                    # one-sentence specific pain this initiative addresses',
    '  monetization_side: ""             # who pays / whose budget — name the side',
    '  walkthrough_citation: ""          # path to a REAL artifact: interview transcript, walkthrough',
    '                                    # doc, observation notes. NOT "I imagined this user."',
    "  competitors_in_scope: []          # competitors derived FROM this pilot, not arbitrary picks",
    "  out_of_scope_pilots: []           # pilots deliberately not targeted — naming them prevents drift",
    "",
    "# Portal type — which portal harness this initiative uses",
    "# initiative = Initiative Portal (Astro + @blueprint/ui, multi-audience platform front-door)",
    "# review     = Review Portal (static HTML + drawers, brownfield audit/redesign)",
    "# bespoke    = custom portal with mandatory divergence ADR in decisions/",
    `portal_type: ${portalType}`,
    "# decisions/05 (actor-output contract): actor-output.yml at the root is the",
    "# live contract; portal_type routes the legacy chrome only. The migration key",
    "# below sanctions the pair — doctor FAILs portal_type + manifest without it.",
    "migration: actor-output",
    "",
    "# ──────────────────────────────────────────────────────────────────",
    "# Portal harness config (Initiative Portal). Read by apps/portal/src/lib/portal-config.ts.",
    "# Tier-0 default: ZERO data sources wired. The portal builds green and shows the",
    "# decisions catalog + strategy excerpts; every optional substrate section hides.",
    "# Wire a source = set its path to a repo-relative file that exists, then rebuild.",
    "# A typo'd path simply keeps the section hidden — it never crashes the build.",
    "# ──────────────────────────────────────────────────────────────────",
    "portal:",
    `  repo_url: "${repoUrl}"`,
    "  decisions:",
    `    dir: "decisions"               # folder of NNNN-slug.md decision records (ADRs)`,
    `    # filename_pattern: "^(?:ADR-)?(\\\\d{4})-(.+)\\\\.md$"  # override the matcher if your ADRs are named differently`,
    "  # Optional derived-data sources. Each is a repo-relative path to a JSON file",
    "  # produced by a consumer-side derive tool. null = section hidden (Tier 0).",
    "  sources:",
    "    state: null                    # capability state-derive   → enables Inspect/coverage",
    "    board: null                    # work-board derive         → enables Roadmap",
    "    epic_footprints: null          # per-epic footprint derive → enriches Roadmap epic progress",
    "    attestations: null             # gate attestations derive  → enables Inspect/attestations",
    "    proposals: null                # proposal/issue derive     → enables Inspect/dependencies",
    "    dep_graph: null                # dependency-graph derive   → enables the dep-graph view",
    "    scenarios: null                # demo scenarios json       → enables Try/scenarios",
    "    build_order: null              # build-order plan          → enables Roadmap build order",
    "  # 10-gate Epic-DoD compliance grid. Off by default; needs an epics model + a",
    "  # state-derive tool. enabled:false keeps @blueprint/gate-derive yielding empty.",
    "  gates:",
    "    enabled: false",
    "    epics_source: null             # repo-relative module/json supplying the EPICS list",
    "    gate_labels: []                # 10 labels for the gate columns; empty = generic",
    "  # board:    bucket labels, phase order, epic-tracker issue range (see portal-config.ts)",
    "  # excerpts: strategy-doc excerpts to surface on the home/strategy pages",
    "  # home / operate / inspect / surfaces / archaeology: navigation + content (Phase B)",
    "",
    "execution:",
    "  depth: standard",
    "",
  ];
  const yml = [...header, ...(variant === "research" ? researchBody : portalBody)].join("\n");
  if (dryRun) {
    log.skipped.push("blueprint.yml (dry-run; would write)");
    return;
  }
  await fs.writeFile(dst, yml, "utf8");
  log.stamped.push("blueprint.yml");
}

// writeActorOutputManifest — decisions/05 (wave 89): every stamped initiative
// starts on the actor-output contract with the intrinsic manifest (maintainer +
// next-agent, ~18 functional lines) and its two derived outputs materialized,
// so the fresh stamp's gate verdict is an EARNED PASS, not a promise. External
// actors get added by the consumer as they become real — with evidence.
async function writeActorOutputManifest({ target, name, dryRun, log }) {
  const dst = path.join(target, "actor-output.yml");
  if (await readMaybe(dst)) {
    log.skipped.push("actor-output.yml (already exists; preserved)");
    return;
  }
  if (dryRun) {
    log.skipped.push("actor-output.yml (dry-run; would write)");
    return;
  }
  const yml = [
    "# actor-output.yml — this initiative's actor-output contract (Blueprint decisions/05).",
    "# Stamped intrinsic-only: maintainer + next-agent. Add external actors (reviewers,",
    "# counterparties) WITH evidence as they become real — an assumed actor gates nothing.",
    "# Validate:  node $BLUEPRINT_HOME/template/tools/lib/actor-output.mjs actor-output.yml --root . --gate",
    "# Re-derive: node $BLUEPRINT_HOME/template/tools/lib/account-derive.mjs --root .",
    "",
    `initiative: ${name}`,
    "",
    "account:",
    "  decisions: decisions/",
    "  config: blueprint.yml",
    "",
    "actors:",
    "  - id: maintainer",
    "    kind: human",
    "    evidence: { status: intrinsic }",
    "    outcomes:",
    "      - id: recover-context",
    "        success:",
    "          statement: resume work without re-deriving state",
    "          proof:",
    "            target: { method: observed-human, signal: operator resumes without re-derivation }",
    "            interim: { method: cold-agent, signal: cold session resumes from the derived brief alone }",
    "  - id: next-agent",
    "    kind: agent",
    "    evidence: { status: intrinsic }",
    "    outcomes:",
    "      - id: bootstrap",
    "        success:",
    "          statement: boot with canonical context",
    "          proof:",
    "            target: { method: cold-agent, signal: agent cites current state from the boot packet alone }",
    "",
    "outputs:",
    "  - id: recovery-brief",
    "    type: recovery-brief",
    "    serves: [maintainer.recover-context]",
    "    status: ready",
    "    artifact: derived/recovery-brief.md",
    "    renderer: derived-markdown",
    "    clearance: internal",
    "  - id: boot-packet",
    "    type: agent-boot-packet",
    "    serves: [next-agent.bootstrap]",
    "    status: ready",
    "    artifact: derived/boot-packet.json",
    "    renderer: derived-json",
    "    clearance: internal",
    "",
  ].join("\n");
  await fs.writeFile(dst, yml, "utf8");
  log.stamped.push("actor-output.yml");
  // The manifest's account + artifacts must resolve or the fresh stamp reports
  // BLOCKED about itself: ensure decisions/ exists, then materialize the two
  // derived outputs. Non-fatal — a derivation failure is reported, not thrown.
  try {
    const decisionsDir = path.join(target, "decisions");
    if (!(await fs.stat(decisionsDir).catch(() => null))) {
      await fs.mkdir(decisionsDir, { recursive: true });
      await fs.writeFile(path.join(decisionsDir, ".gitkeep"), "");
    }
    const { derive } = await import(new URL("../lib/account-derive.mjs", import.meta.url).href);
    const { proj } = derive(target);
    log.stamped.push(`derived/boot-packet.json + derived/recovery-brief.md (verdict ${proj.verdict.state})`);
  } catch (e) {
    log.skipped.push(`derived outputs (derivation failed: ${e.message} — run account-derive.mjs manually)`);
  }
}

// Substrate de-narration tripwires. These strings are narrative leaks from the
// reference initiative's substrate (governance jargon and example-issue markers).
// The reference URLs themselves were removed from the template tree in the
// 2026-06-10 sanitization, so URL tripwires are gone; what remains guards
// against substrate NARRATIVE re-entering stamped pages via bad merges.
const SUBSTRATE_TRIPWIRES = [
  "five-actor",
  "trust axioms",
  "synthesis #",
  "[Epic-",
  // Wave 85: front-door leak markers — the source project's doc slugs and hero
  // copy shipped verbatim inside the Pattern B index.html until the ai-enablement
  // consumer's operator met "five paths" on a deployed portal and asked what
  // they were. index.html is manifest-driven now; these tripwires keep it so.
  "cx-strategy",
  "validation-jtbd-dry-run",
  "One front door,",
  "PROJECT_SLUG",
];

async function mechanicalCheck({ target, log }) {
  const offenders = [];
  // Scope to STAMPED paths only — apps/portal + packages + the root package.json.
  // Walking the whole target false-flags evidence docs (CLAUDE.md, research/*.md,
  // blueprint.yml) that legitimately cite the example/reference project.
  const scopedRoots = [
    path.join(target, "apps/portal"),
    path.join(target, "packages"),
    // Wave 85: Pattern B portal scope — without these the check was VACUOUS
    // for review-portal stamps (nothing exists under apps/portal), so
    // "mechanical check: PASS" shipped source-project strings untested.
    path.join(target, "portal"),
    path.join(target, "blueprint/portal"),
  ];
  const allFiles = [];
  for (const root of scopedRoots) {
    const stat = await fs.stat(root).catch(() => null);
    if (stat && stat.isDirectory()) allFiles.push(...(await walk(root)));
  }
  const rootPkg = path.join(target, "package.json");
  if (await fs.stat(rootPkg).catch(() => null)) allFiles.push(rootPkg);

  const tripwires = [
    "blueprint-example",
    "An example product initiative",
    ...SUBSTRATE_TRIPWIRES,
  ];
  for (const f of allFiles) {
    const rel = path.relative(target, f);
    if (!TEXT_EXTS.has(path.extname(f))) continue;
    const content = await fs.readFile(f, "utf8");
    for (const tw of tripwires) {
      if (content.includes(tw)) {
        // The banner files are expected to retain the strings inside their business
        // content; the banner header itself surfaces that. Tolerate hits inside
        // banner files, fail elsewhere.
        const isBannerExpected = [...BANNER_FILES].some((b) => rel.endsWith(b.split("/").slice(-1)[0]));
        if (!isBannerExpected) {
          offenders.push({ file: rel, token: tw });
          break;
        }
      }
    }
  }
  log.mechanicalCheck = offenders;
  return offenders;
}

function printReport(log) {
  const fmt = (xs) => (xs.length ? xs.map((x) => `    - ${x}`).join("\n") : "    (none)");
  console.log(`\n— blueprint-init report —`);
  console.log(`  copied (binary):\n${fmt(log.copied)}`);
  console.log(`  stamped (text + substitutions applied):\n${fmt(log.stamped)}`);
  console.log(`  banner (example content; REPLACE_FOR_PROJECT header added):\n${fmt(log.banner)}`);
  console.log(`  renamed / replaced:\n${fmt(log.renamed)}`);
  console.log(`  skipped:\n${fmt(log.skipped)}`);
  if (log.mechanicalCheck && log.mechanicalCheck.length) {
    console.log(`  UNEXPECTED RESIDUAL STRINGS (stamper bug — fix template/tools/blueprint-init/stamp.mjs):`);
    for (const o of log.mechanicalCheck) console.log(`    ! ${o.file} :: ${o.token}`);
  } else {
    console.log(`  mechanical check: PASS (no unexpected residual source strings)`);
  }
}

// Minimal yaml field extractor — reads a single `prototype.portal_dir: <value>`
// key from blueprint.yml without a full yaml dependency. Returns null if the
// file or the key is absent. Tolerates trailing comments and indentation
// variations. Strict enough: any quoting / multi-line value falls back to null
// and the resolver continues to the candidate list.
async function readPortalDirFromBlueprintYml(target) {
  const yml = await fs.readFile(path.join(target, "blueprint.yml"), "utf8").catch(() => null);
  if (!yml) return null;
  // Look for `portal_dir:` inside the `prototype:` block. We don't enforce
  // block-scope rigorously; if any top-level-or-nested `portal_dir:` appears
  // with a string value, we take it. Real conflicts will surface as
  // "no portal directory found" errors downstream — preferred shape over
  // silent multi-key drift.
  const lines = yml.split("\n");
  for (const raw of lines) {
    const stripped = raw.replace(/#.*$/, "").trimEnd();
    const m = stripped.match(/^\s*portal_dir:\s*["']?([^"'\s]+)["']?\s*$/);
    if (m && m[1] && m[1] !== '""' && m[1] !== "''") return m[1];
  }
  return null;
}

// Read chrome_profile from blueprint.yml (default: methodology-themed).
// Wave 74 (2026-06-27): two-profile model for chrome ownership.
async function readChromeProfileFromBlueprintYml(target) {
  const yml = await fs.readFile(path.join(target, "blueprint.yml"), "utf8").catch(() => null);
  if (!yml) return "methodology-themed";
  const lines = yml.split("\n");
  for (const raw of lines) {
    const stripped = raw.replace(/#.*$/, "").trimEnd();
    const m = stripped.match(/^\s*chrome_profile:\s*["']?([^"'\s]+)["']?\s*$/);
    if (m && m[1] && m[1] !== '""' && m[1] !== "''") {
      const val = m[1].toLowerCase();
      if (val === "consumer-themed" || val === "methodology-themed") return val;
    }
  }
  return "methodology-themed";  // default
}

// Select the correct chrome manifest based on profile.
function getChromeManifestForProfile(profile) {
  return profile === "consumer-themed"
    ? PATTERN_B_CHROME_FILES_PROFILE_B
    : PATTERN_B_CHROME_FILES_PROFILE_A;
}

async function resolvePatternBPortalDir(target, { portalDirOverride } = {}) {
  // Priority 1: explicit --portal-dir CLI flag (operator escape hatch).
  // Priority 2: prototype.portal_dir in target's blueprint.yml.
  // Priority 3: PATTERN_B_PORTAL_CANDIDATES fallback list.
  // This shape closes rally-hq amendment 2026-05-26 gap 1: consumers whose
  // portal directory predates the canonical contract declare their path
  // explicitly rather than rename or fork the resolver.
  const sources = [];
  if (portalDirOverride) sources.push({ src: "--portal-dir flag", val: portalDirOverride });
  const fromYml = await readPortalDirFromBlueprintYml(target);
  if (fromYml) sources.push({ src: "blueprint.yml prototype.portal_dir", val: fromYml });
  for (const cand of PATTERN_B_PORTAL_CANDIDATES) sources.push({ src: "candidate fallback", val: cand });

  for (const { src, val } of sources) {
    const p = path.isAbsolute(val) ? val : path.join(target, val);
    const stat = await fs.stat(p).catch(() => null);
    if (stat && stat.isDirectory()) {
      // Trace resolution source for the report — helps debug "wrong portal
      // found" cases without re-running the resolver in verbose mode.
      return { dir: p, source: src };
    }
  }
  return null;
}

function failPortalDirNotFound(target) {
  fail(
    `--mode=restamp-chrome --portal-type=review: no portal directory found under ${target}. ` +
    `Resolver tried in order: --portal-dir CLI flag, blueprint.yml prototype.portal_dir, fallback candidates [${PATTERN_B_PORTAL_CANDIDATES.join(", ")}]. ` +
    `If your portal lives elsewhere, declare prototype.portal_dir in blueprint.yml (recommended) or pass --portal-dir=<relpath> on the CLI.`
  );
}

// Wave 15 (2026-05-27): classify a diverged chrome file against the canonical
// file's git history. If the consumer's content matches any recent canonical
// version, the divergence is LAG (restamp safe — consumer is N waves behind).
// If no canonical version matches in the last HISTORY_LOOKBACK commits, the
// divergence is CUSTOMIZATION-OR-ROT (operator review required before
// restamp). Source: rally-hq amendment 2026-05-26 gap 3 — extends wave 14
// audit-chrome with the diagnostic step that distinguishes the three causes.
const HISTORY_LOOKBACK = 30; // commits per file; covers ~10 methodology waves with headroom

async function classifyDivergenceCause({ relFromTemplateRoot, consumerContent }) {
  // The canonical file's path inside the methodology repo (relative to repo root).
  const fileInRepo = path.join("template/portal", relFromTemplateRoot);

  // Walk the file's git history. `git log --format=%H -n N -- <path>` returns
  // commit SHAs that touched the file, newest first. We then fetch each
  // historical version via `git show <SHA>:<path>` and compare against the
  // consumer's current content.
  let logOut;
  try {
    const r = await execFile("git", ["log", `--format=%H %ct`, "-n", String(HISTORY_LOOKBACK), "--", fileInRepo], { cwd: BLUEPRINT_ROOT });
    logOut = r.stdout;
  } catch (e) {
    return { kind: "unknown", reason: `git log failed: ${e.message.split("\n")[0]}` };
  }

  const entries = logOut.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [sha, ts] = line.split(/\s+/);
    return { sha, ts };
  });

  if (entries.length === 0) {
    // File never appeared in canonical history — either added in working tree
    // or canonical path mismatch. Treat as unknown.
    return { kind: "unknown", reason: "no canonical history for this path" };
  }

  for (const { sha, ts } of entries) {
    let historical;
    try {
      const r = await execFile("git", ["show", `${sha}:${fileInRepo}`], { cwd: BLUEPRINT_ROOT, maxBuffer: 16 * 1024 * 1024 });
      historical = r.stdout;
    } catch {
      // File may not have existed at this commit (renames, additions). Skip.
      continue;
    }
    if (historical === consumerContent) {
      // Match — consumer is on this exact canonical version. LAG.
      const date = new Date(parseInt(ts, 10) * 1000).toISOString().split("T")[0];
      return { kind: "lag", commit: sha.substring(0, 7), date };
    }
  }

  // No historical match within lookback window. Either customization (consumer
  // intentionally diverged) or rot (unintentional drift from a prior canonical
  // state that's beyond the lookback). Operator review required.
  return { kind: "customization-or-rot", lookback: HISTORY_LOOKBACK };
}

// Compute a per-file divergence classification by comparing consumer content
// against canonical. Returns one of: byte-identical, diverged, missing-consumer,
// missing-canonical. Diverged entries include line +/- counts for the audit
// report. Source: rally-hq amendment 2026-05-26 gap 3 — without per-file
// classification, the operator can't distinguish lag from customization from rot.
async function classifyChromeFile(srcPath, dstPath) {
  const [srcExists, dstExists] = await Promise.all([
    fs.stat(srcPath).catch(() => null),
    fs.stat(dstPath).catch(() => null),
  ]);
  if (!srcExists) return { status: "missing-canonical" };
  if (!dstExists) return { status: "missing-consumer" };
  const [srcContent, dstContent] = await Promise.all([
    fs.readFile(srcPath, "utf8"),
    fs.readFile(dstPath, "utf8"),
  ]);
  if (srcContent === dstContent) return { status: "byte-identical" };
  const srcLines = srcContent.split("\n").length;
  const dstLines = dstContent.split("\n").length;
  return { status: "diverged", srcLines, dstLines, delta: dstLines - srcLines };
}

async function restampChromePatternB({ target, dryRun, acceptOverwrite, portalDirOverride, log }) {
  const resolved = await resolvePatternBPortalDir(target, { portalDirOverride });
  if (!resolved) failPortalDirNotFound(target);
  const { dir: portalDir, source: portalDirSource } = resolved;
  console.log(`  portal resolved: ${portalDir} (source: ${portalDirSource})`);

  const srcRoot = path.join(BLUEPRINT_ROOT, "template/portal");

  // Wave 74 (2026-06-27): read chrome_profile from blueprint.yml to select
  // the correct manifest. Defaults to methodology-themed (Profile A) for
  // backward compatibility.
  const profile = await readChromeProfileFromBlueprintYml(target);
  const chromeFiles = getChromeManifestForProfile(profile);
  console.log(`  chrome profile: ${profile} (${chromeFiles.length} files in manifest)`);

  // Wave 14 (2026-05-27): pre-flight divergence check. Block destructive
  // overwrite of customized chrome unless operator explicitly accepts.
  // Source: rally-hq amendment 2026-05-26 gap 2 — shared.css byte-identical
  // contract assumes pristine canonical baseline; for Profile B, only
  // canonical-primitives.css is subject to byte-identity enforcement.
  const classifications = [];
  for (const rel of chromeFiles) {
    const cls = await classifyChromeFile(path.join(srcRoot, rel), path.join(portalDir, rel));
    classifications.push({ rel, ...cls });
  }
  const diverged = classifications.filter((c) => c.status === "diverged");
  const acceptedSet = new Set((acceptOverwrite || "").split(",").map((s) => s.trim()).filter(Boolean));

  // AMENDMENT 2 (2026-06-27): treat --accept-overwrite as scope, not consent.
  // Overwrite accepted files; skip un-accepted diverged files instead of blocking.
  const skippedDiverged = diverged.filter((c) => !acceptedSet.has(c.rel) && !acceptedSet.has("ALL"));
  if (skippedDiverged.length && !dryRun) {
    console.log(`\n  diverged files not in --accept-overwrite (skipped):`);
    for (const c of skippedDiverged) {
      console.log(`    SKIPPED ${c.rel} (diverged, not in --accept-overwrite)`);
      log.skipped.push(`${c.rel} (diverged; skipped per scoped --accept-overwrite)`);
    }
  }

  const missing = [];
  for (const c of classifications) {
    const { rel, status } = c;
    const src = path.join(srcRoot, rel);
    const dst = path.join(portalDir, rel);
    if (status === "missing-canonical") {
      missing.push(`canonical missing in template: ${rel}`);
      continue;
    }
    if (status === "missing-consumer") {
      log.skipped.push(`${rel} (no consumer copy; not creating — re-run full stamp for first-time setup)`);
      continue;
    }
    // AMENDMENT 2: skip diverged files not in --accept-overwrite
    if (status === "diverged" && !acceptedSet.has(rel) && !acceptedSet.has("ALL")) {
      continue;
    }
    if (dryRun) {
      const stamp = status === "byte-identical"
        ? `${rel} (dry-run; would re-write byte-identical content)`
        : `${rel} (dry-run; would overwrite — Δ=${c.delta >= 0 ? "+" : ""}${c.delta} lines${acceptedSet.has(rel) || acceptedSet.has("ALL") ? "; accepted" : ""})`;
      log.stamped.push(stamp);
      continue;
    }
    await fs.mkdir(path.dirname(dst), { recursive: true });
    const content = await fs.readFile(src, "utf8");
    await fs.writeFile(dst, content, "utf8");
    const tag = status === "byte-identical" ? "" : ` (was diverged; overwrite accepted)`;
    log.stamped.push(`${rel} (chrome refreshed from canonical)${tag}`);
  }
  if (missing.length) {
    console.error("error: canonical chrome files missing from template (methodology repo broken):");
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(2);
  }
  // Ensure project-tokens.css exists in the consumer's portal so the overlay
  // contract holds. Create it from canonical if absent; never overwrite.
  const overlayDst = path.join(portalDir, "project-tokens.css");
  const overlayExists = await fs.stat(overlayDst).catch(() => null);
  if (!overlayExists) {
    const overlaySrc = path.join(srcRoot, "project-tokens.css");
    if (await fs.stat(overlaySrc).catch(() => null)) {
      if (!dryRun) {
        const content = await fs.readFile(overlaySrc, "utf8");
        await fs.writeFile(overlayDst, content, "utf8");
      }
      log.stamped.push(`project-tokens.css (created from canonical — your project tokens go here)`);
    }
  } else {
    log.skipped.push(`project-tokens.css (preserved; consumer overlay)`);
  }
  console.log(`blueprint-init: restamped ${PATTERN_B_CHROME_FILES.length} chrome files in ${portalDir}`);
}

// Wave 14 (2026-05-27): read-only divergence audit. Outputs per chrome file
// status without modifying anything. Source: rally-hq amendment 2026-05-26 —
// "introduce a --mode=audit-chrome read-only diff command BEFORE restamp-chrome."
// Wave 74 (2026-06-27): profile-aware — selects manifest based on chrome_profile.
async function auditChromePatternB({ target, portalDirOverride }) {
  const resolved = await resolvePatternBPortalDir(target, { portalDirOverride });
  if (!resolved) failPortalDirNotFound(target);
  const { dir: portalDir, source: portalDirSource } = resolved;

  // Wave 74: read profile to select correct manifest
  const profile = await readChromeProfileFromBlueprintYml(target);
  const chromeFiles = getChromeManifestForProfile(profile);

  console.log(`\n— blueprint-init audit-chrome —`);
  console.log(`  target:         ${target}`);
  console.log(`  portal:         ${portalDir} (source: ${portalDirSource})`);
  console.log(`  canonical from: ${path.join(BLUEPRINT_ROOT, "template/portal")}`);
  console.log(`  chrome profile: ${profile}`);
  console.log(`  manifest:       ${chromeFiles.length} chrome files\n`);

  const srcRoot = path.join(BLUEPRINT_ROOT, "template/portal");
  const rows = [];
  for (const rel of chromeFiles) {
    const cls = await classifyChromeFile(path.join(srcRoot, rel), path.join(portalDir, rel));
    // Wave 15: for diverged files, run git-history classification to distinguish
    // lag from customization from rot. Only call the classifier when divergence
    // is established; byte-identical / missing don't need it.
    if (cls.status === "diverged") {
      const consumerContent = await fs.readFile(path.join(portalDir, rel), "utf8");
      cls.cause = await classifyDivergenceCause({ relFromTemplateRoot: rel, consumerContent });
    }
    rows.push({ rel, ...cls });
  }

  const tally = {
    "byte-identical": 0,
    "diverged": 0,
    "missing-consumer": 0,
    "missing-canonical": 0,
  };
  const causeTally = { lag: 0, "customization-or-rot": 0, unknown: 0 };
  for (const r of rows) {
    tally[r.status]++;
    if (r.cause) causeTally[r.cause.kind] = (causeTally[r.cause.kind] || 0) + 1;

    let label;
    if (r.status === "diverged") {
      const causeStr = r.cause?.kind === "lag"
        ? `LAG (matches canonical @ ${r.cause.commit} ${r.cause.date})`
        : r.cause?.kind === "customization-or-rot"
          ? `CUSTOMIZATION-OR-ROT (no canonical match in last ${r.cause.lookback} commits)`
          : `UNKNOWN (${r.cause?.reason || "no classification"})`;
      label = `diverged Δ=${r.delta >= 0 ? "+" : ""}${r.delta} :: ${causeStr}`;
    } else {
      label = r.status;
    }

    const icon = r.status === "byte-identical" ? "✓" : r.status === "diverged" ? "⚠" : "✗";
    console.log(`  ${icon} ${r.rel.padEnd(28)} ${label}`);
  }
  console.log(``);
  console.log(`  Tally: ${tally["byte-identical"]} byte-identical · ${tally["diverged"]} diverged · ${tally["missing-consumer"]} missing-consumer · ${tally["missing-canonical"]} missing-canonical`);
  if (tally["diverged"] > 0) {
    console.log(`  Divergence causes: ${causeTally.lag} LAG · ${causeTally["customization-or-rot"]} CUSTOMIZATION-OR-ROT · ${causeTally.unknown || 0} UNKNOWN`);
  }
  console.log(``);

  if (tally["diverged"] > 0) {
    const lagFiles = rows.filter((r) => r.cause?.kind === "lag").map((r) => r.rel);
    const customFiles = rows.filter((r) => r.cause?.kind === "customization-or-rot").map((r) => r.rel);

    console.log(`  Divergence interpretation (wave 15 git-history classification):`);
    console.log(`  - LAG: consumer's file matches an older canonical version. Restamp is safe — it pulls the consumer forward to current canonical.`);
    console.log(`  - CUSTOMIZATION-OR-ROT: no canonical version in the last ${HISTORY_LOOKBACK} commits matches consumer's file. Either intentional customization (e.g., shared.css carries the design system) or drift beyond lookback. Restamp would erase consumer's content — manual review required.`);
    console.log(``);
    if (lagFiles.length) {
      console.log(`  Restamp safely (LAG-classified, can pass --accept-overwrite without losing work):`);
      console.log(`    --mode=restamp-chrome --portal-type=review --target=${target} --accept-overwrite=${lagFiles.join(",")}`);
      console.log(``);
    }
    if (customFiles.length) {
      console.log(`  Manual review required (CUSTOMIZATION-OR-ROT — do NOT add to --accept-overwrite without diffing):`);
      for (const f of customFiles) console.log(`    - ${f}`);
      console.log(`  Diff each against canonical: git diff $(git -C ${BLUEPRINT_ROOT} rev-parse HEAD):template/portal/<file> -- ${portalDir}/<file>`);
    }
  } else {
    console.log(`  No divergence. Restamp is safe to run without --accept-overwrite.`);
  }
}

// AMENDMENT 1 (2026-06-27): Pattern B initial stamp.
// Copy template/portal/ to the resolved portal directory with narrow substitutions
// (project name in _meta/index.json, repo URL, brand token). Mirrors Pattern A
// stamp logic but targets the portal directory directly instead of apps/portal.
async function stampPatternB({ target, name, displayName, repoUrl, tagline, theme, dryRun, portalDirOverride, log }) {
  // Resolve the portal directory (or create blueprint/portal as default for initial stamp).
  let resolved = await resolvePatternBPortalDir(target, { portalDirOverride });
  let portalDir = resolved?.dir;

  if (!portalDir) {
    // No existing portal found; create one at the default location (blueprint/portal).
    const defaultPortalRel = "blueprint/portal";
    portalDir = path.join(target, defaultPortalRel);
    if (!dryRun) await fs.mkdir(portalDir, { recursive: true });
    log.copied.push(`${defaultPortalRel}/ (dir created for initial stamp)`);
  }

  const subs = substitutions({ name, displayName, repoUrl, tagline, theme });
  const srcRoot = path.join(BLUEPRINT_ROOT, "template/portal");

  // Copy the portal tree with substitutions applied.
  await copyTree({
    src: srcRoot,
    dst: portalDir,
    subs,
    dryRun,
    log,
  });

  // Wave 85: chrome-manifest files must land BYTE-IDENTICAL to canonical —
  // copyTree applies substitutions (incl. the wave-11 data-theme swap), which
  // drifted docs/index.html against portal-chrome-canonical-reviewer on every
  // fresh stamp. Re-copy the Profile A manifest verbatim.
  for (const rel of PATTERN_B_CHROME_FILES_PROFILE_A) {
    const chromeSrc = path.join(srcRoot, rel);
    if (await fs.stat(chromeSrc).catch(() => null)) {
      if (!dryRun) {
        await fs.mkdir(path.dirname(path.join(portalDir, rel)), { recursive: true });
        await fs.copyFile(chromeSrc, path.join(portalDir, rel));
      }
    }
  }
  log.stamped.push("chrome manifest re-copied byte-identical (portal-chrome-canonical-reviewer contract)");

  // (wrangler.toml's PROJECT_SLUG is handled by the substitution table now
  // that .toml is a TEXT_EXTS member — wave 85.)

  // Wave 85: canonical-primitives.css is the Profile B (consumer-themed)
  // import; under the default Profile A the conformance reviewer correctly
  // rejects it as an orphan top-level stylesheet. Not stamped by default —
  // Profile B consumers pull it via restamp-chrome --accept-overwrite.
  if (!dryRun) await fs.rm(path.join(portalDir, "canonical-primitives.css"), { force: true });
  log.skipped.push("canonical-primitives.css (Profile B import — pull via restamp-chrome when opting into consumer-themed)");

  // Ensure project-tokens.css exists as the consumer's overlay surface.
  const overlayDst = path.join(portalDir, "project-tokens.css");
  const overlayExists = await fs.stat(overlayDst).catch(() => null);
  if (!overlayExists) {
    const overlaySrc = path.join(srcRoot, "project-tokens.css");
    if (await fs.stat(overlaySrc).catch(() => null)) {
      if (!dryRun) {
        const content = await fs.readFile(overlaySrc, "utf8");
        await fs.writeFile(overlayDst, content, "utf8");
      }
      log.stamped.push(`project-tokens.css (created from canonical — your project tokens go here)`);
    }
  } else {
    log.skipped.push(`project-tokens.css (preserved; consumer overlay)`);
  }

  console.log(`blueprint-init: stamped Review Portal into ${portalDir}`);
}

async function modeRestampChrome(args) {
  // Accept --portal-type (canonical) or deprecated --pattern=A/B
  let portalType = args["portal-type"] ? args["portal-type"].toLowerCase() : null;
  if (!portalType && args["pattern"]) {
    const legacyMap = { a: "initiative", b: "review" };
    portalType = legacyMap[args["pattern"].toLowerCase()] || null;
    if (portalType) console.warn(`  WARN: --pattern=${args["pattern"]} is deprecated. Use --portal-type=${portalType} (wave 72).`);
  }
  const target = args["target"] ? path.resolve(args["target"].replace(/^~/, process.env.HOME || "")) : null;
  const dryRun = args["dry-run"] === "true";
  const acceptOverwrite = args["accept-overwrite"] || null;
  const portalDirOverride = args["portal-dir"] || null;
  if (!target) fail(`--mode=restamp-chrome: --target is required`);
  if (portalType !== "initiative" && portalType !== "review") fail(`--mode=restamp-chrome: --portal-type must be initiative or review; got "${portalType || args["portal-type"] || args["pattern"] || "(none)"}"`);
  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || !targetStat.isDirectory()) fail(`--target must exist and be a directory: ${target}`);

  const log = { copied: [], stamped: [], banner: [], renamed: [], skipped: [], mechanicalCheck: [] };
  if (portalType === "review") {
    await restampChromePatternB({ target, dryRun, acceptOverwrite, portalDirOverride, log });
  } else {
    fail(`--mode=restamp-chrome --portal-type=initiative not yet implemented. The Initiative Portal canonical chrome surface (packages/ui, packages/design-tokens, src/styles) needs an audit before a manifest can be declared. See README §"Restamping Initiative Portal chrome".`);
  }
  printReport(log);
}

// Wave 14 (2026-05-27): audit-chrome mode handler. Read-only; no writes.
async function modeAuditChrome(args) {
  // Accept --portal-type (canonical) or deprecated --pattern=B
  let portalType = args["portal-type"] ? args["portal-type"].toLowerCase() : null;
  if (!portalType && args["pattern"]) {
    const legacyMap = { a: "initiative", b: "review" };
    portalType = legacyMap[args["pattern"].toLowerCase()] || null;
    if (portalType) console.warn(`  WARN: --pattern=${args["pattern"]} is deprecated. Use --portal-type=${portalType} (wave 72).`);
  }
  const target = args["target"] ? path.resolve(args["target"].replace(/^~/, process.env.HOME || "")) : null;
  const portalDirOverride = args["portal-dir"] || null;
  if (!target) fail(`--mode=audit-chrome: --target is required`);
  if (portalType !== "review") fail(`--mode=audit-chrome: --portal-type=review is required (Initiative Portal audit not yet implemented)`);
  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || !targetStat.isDirectory()) fail(`--target must exist and be a directory: ${target}`);
  await auditChromePatternB({ target, portalDirOverride });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args["mode"] || "stamp";

  if (mode === "restamp-chrome") {
    await modeRestampChrome(args);
    return;
  }
  if (mode === "audit-chrome") {
    await modeAuditChrome(args);
    return;
  }
  if (mode !== "stamp") fail(`unknown --mode=${mode} (valid: stamp, restamp-chrome, audit-chrome)`);

  // --name is the only required flag (wave 61): every other flag derives a
  // sensible default so the published one-liner runs as printed. The audit
  // that forced this: every init command on the product site errored when
  // pasted, because the stamper demanded all 8 flags — category convention
  // (create-astro, create-next-app) is scaffold-with-defaults. Explicit flags
  // always win; every applied default is printed (nothing silent).
  if (!args["name"]) {
    fail(
      `--name is required.\n` +
      `  minimal:  node stamp.mjs --name=my-initiative\n` +
      `  defaults: display-name (title-cased name), tagline, repo-url placeholder,\n` +
      `            --variant=greenfield --tier=1 --portal-type=initiative --target=./<name> (created if missing)`
    );
  }

  const name = args["name"];
  const titleCased = name
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  const defaulted = [];
  const withDefault = (flag, value) => {
    if (args[flag]) return args[flag];
    defaulted.push(`${flag}=${JSON.stringify(value)}`);
    return value;
  };

  const displayName = withDefault("display-name", titleCased);
  const repoUrl = withDefault("repo-url", `https://github.com/your-org/${name}`).replace(/\/$/, "");
  const tagline = withDefault("tagline", `${displayName} — a Blueprint initiative`);
  const variant = withDefault("variant", "greenfield");
  const tier = String(withDefault("tier", "1"));
  // Accept --portal-type (canonical) or deprecated --pattern=A/B (backward compat, warns).
  let portalType;
  if (args["portal-type"]) {
    portalType = args["portal-type"].toLowerCase();
  } else if (args["pattern"]) {
    const legacyMap = { a: "initiative", b: "review" };
    const mapped = legacyMap[args["pattern"].toLowerCase()];
    if (!mapped) fail(`--pattern must be A or B (deprecated alias); use --portal-type=initiative|review instead`);
    portalType = mapped;
    console.warn(`  WARN: --pattern=${args["pattern"]} is deprecated. Use --portal-type=${mapped} (wave 72).`);
  } else {
    portalType = "initiative";
    defaulted.push(`portal-type="initiative"`);
  }
  const target = path.resolve(withDefault("target", `./${name}`).replace(/^~/, process.env.HOME || ""));
  const dryRun = args["dry-run"] === "true";
  const logoSrc = args["logo"] || null;
  const theme = (args["theme"] || "slate").toLowerCase();
  const VALID_THEMES = new Set(["slate", "coral", "forest", "minimal", "custom"]);
  if (!VALID_THEMES.has(theme)) {
    fail(`--theme must be one of: ${[...VALID_THEMES].join(", ")}; got ${theme}`);
  }

  if (!VARIANT_TIER_MATRIX[variant]) fail(`unknown variant: ${variant}`);
  if (!VARIANT_TIER_MATRIX[variant][tier]) fail(`unknown tier: ${tier}`);
  if (VARIANT_TIER_MATRIX[variant][tier] === "blocked") {
    fail(
      `variant=${variant} + tier=${tier} is blocked by the Variant × Tier matrix. ` +
      `See docs/portal-and-tier-ladder.md.`
    );
  }
  if (portalType !== "initiative" && portalType !== "review" && portalType !== "bespoke") {
    fail(`--portal-type must be initiative, review, or bespoke; got ${portalType}`);
  }
  if (portalType === "review") {
    // AMENDMENT 1 (2026-06-27): Pattern B initial stamp now implemented.
    // Wave 85 (ai-enablement consumer, 9 defects): the outer Pattern A
    // `const log` sits in its temporal dead zone here — every fresh Pattern B
    // stamp crashed on ReferenceError. Block-scoped log fixes it.
    const log = { copied: [], stamped: [], banner: [], renamed: [], skipped: [], mechanicalCheck: [] };
    const portalDirOverride = args["portal-dir"] || null;
    // Wave 85: the imposition layer (.claude reviewers + tools/lib +
    // run-reviewers) is installed into EVERY stamped initiative — the
    // 2026-06-16 install-gap fix wired it for Pattern A only, so Pattern B
    // consumers got a portal with no stage gates.
    const subs = substitutions({ name, displayName, repoUrl, tagline, theme });
    await copyTree({
      src: path.join(BLUEPRINT_ROOT, "template/.claude"),
      dst: path.join(target, ".claude"),
      subs,
      dryRun,
      log,
    });
    await copyTree({
      src: path.join(BLUEPRINT_ROOT, "template/tools/lib"),
      dst: path.join(target, "tools/lib"),
      subs,
      dryRun,
      log,
    });
    if (!dryRun) {
      await fs.mkdir(path.join(target, "tools"), { recursive: true });
      await fs.copyFile(
        path.join(BLUEPRINT_ROOT, "template/tools/run-reviewers.mjs"),
        path.join(target, "tools/run-reviewers.mjs")
      );
    }
    log.copied.push("tools/run-reviewers.mjs");
    await stampPatternB({ target, name, displayName, repoUrl, tagline, theme, dryRun, portalDirOverride, log });
    await writeBlueprintYml({ target, name, variant, tier, portalType, tagline, repoUrl, dryRun, log });
    await writeActorOutputManifest({ target, name, dryRun, log });
    if (!dryRun) await mechanicalCheck({ target, name, log });
    printReport(log);
    if (log.mechanicalCheck && log.mechanicalCheck.length) process.exit(1);
    if (!dryRun) printNextSteps({ variant, portalType, target });
    return;
  }

  // Create a missing target (category convention: scaffolders create their
  // directory). Refuse only when the path exists and isn't a directory.
  const targetStat = await fs.stat(target).catch(() => null);
  if (targetStat && !targetStat.isDirectory()) fail(`--target exists and is not a directory: ${target}`);
  if (!targetStat && !dryRun) await fs.mkdir(target, { recursive: true });

  const subs = substitutions({ name, displayName, repoUrl, tagline, theme });
  const log = { copied: [], stamped: [], banner: [], renamed: [], skipped: [], mechanicalCheck: [] };

  console.log(`blueprint-init: stamping Initiative Portal scaffold into ${target}${targetStat ? "" : " (created)"}`);
  console.log(`  variant=${variant} tier=${tier} (${VARIANT_TIER_MATRIX[variant][tier]})`);
  console.log(`  name=${name} display-name="${displayName}"`);
  console.log(`  repo-url=${repoUrl}`);
  if (defaulted.length) console.log(`  defaulted: ${defaulted.join("  ")}`);
  console.log(`  dry-run=${dryRun}`);

  // Variant-fit hint (METHODOLOGY-AMENDMENTS 2026-06-25, promoted wave 78 on
  // its 2nd instance): greenfield-by-default hands decision/strategy work the
  // full product-build pipeline. Both instances (mrr-automation, chapterzero)
  // surfaced the mis-fit only at Stage 5, after the portal scaffold was built
  // and mostly throwaway.
  if (!args["variant"]) {
    console.log(
      `  HINT: variant defaulted to greenfield — the product-build pipeline. If this initiative is\n` +
      `        a decision driven by a brief / deck / dataset (no product, no codebase), re-run with\n` +
      `        --variant=research: portal-optional, provenance-only, deliverable is a decision memo.\n` +
      `        Pre-stamp fit check: docs/variant-selection.md (top).`
    );
  }

  // Imposition layer — installed into EVERY stamped initiative so the SessionStart
  // hook + reviewer agents are present (fixes the install gap; see
  // METHODOLOGY-AMENDMENTS 2026-06-16). settings.json is project-level.
  await copyTree({
    src: path.join(BLUEPRINT_ROOT, "template/.claude"),
    dst: path.join(target, ".claude"),
    subs,
    dryRun,
    log,
  });

  // Reviewer infra the stamped .claude reviewers import via ../../../../tools/lib/*
  // (cost-dial, registry, doctor). Without this a reviewer with a module-level
  // tools/lib import ERRORs when run from the initiative (Phase-3 fix).
  await copyTree({
    src: path.join(BLUEPRINT_ROOT, "template/tools/lib"),
    dst: path.join(target, "tools/lib"),
    subs,
    dryRun,
    log,
  });

  if (variant === "research") {
    // Research variant: deliverable is a decision memo, not a portal. Scaffold the
    // research pipeline; skip the portal (opt-in later as optional provenance per
    // docs/variant-selection.md § Research).
    await scaffoldResearch({ target, dryRun, log });
  } else {
    await copyTree({
      src: path.join(BLUEPRINT_ROOT, "template/apps/portal"),
      dst: path.join(target, "apps/portal"),
      subs,
      dryRun,
      log,
    });
    await copyTree({
      src: path.join(BLUEPRINT_ROOT, "template/packages"),
      dst: path.join(target, "packages"),
      subs,
      dryRun,
      log,
    });
  }
  await writeWorkspaceRoot({ target, name, dryRun, log });
  await renameLogo(target, dryRun, log);
  if (logoSrc) await replaceLogo(logoSrc, target, dryRun, log);
  await writeBlueprintYml({ target, name, variant, tier, portalType, tagline, repoUrl, dryRun, log });
  await writeActorOutputManifest({ target, name, dryRun, log });

  if (!dryRun) await mechanicalCheck({ target, name, log });
  printReport(log);

  if (log.mechanicalCheck && log.mechanicalCheck.length) process.exit(1);
  if (!dryRun) printNextSteps({ variant, portalType, target });
}

// First-five-minutes pointer, printed ONLY after a successful non-dry-run stamp
// (wave 86 — stamped consumers never receive the hosted /learn route; the
// stamped CLAUDE.md is the full onboarding map, this is just the on-ramp).
// Variant-aware: research has no pilot_profile (personas/JTBD instead) and no
// portal shell.
function printNextSteps({ variant, portalType, target }) {
  console.log(`\n  next steps (shell is ready; content is not — that's the pipeline's job):`);
  if (variant === "research") {
    console.log(`    1. Catalog your input assets into research/sources/ (Stage 0: Inputs Intake).`);
    console.log(`    2. Ground personas/JTBD: research/personas-and-jtbd.md (Stage 1 gate).`);
    console.log(`    3. Run \`blueprint stage status --target=${target}\` to see the derived pipeline position.`);
    console.log(`    4. Open the initiative in your agent harness and run /blueprint-research.`);
  } else {
    console.log(`    1. Fill pilot_profile in blueprint.yml (all 7 fields + a real walkthrough_citation`);
    console.log(`       file) — \`blueprint stage advance\` blocks until it's populated.`);
    console.log(`    2. Run \`blueprint stage status --target=${target}\` to see the derived pipeline position.`);
    console.log(`    3. Open the initiative in your agent harness and run /blueprint-research (Stage 1).`);
    if (portalType === "review") console.log(`    4. The portal shell ships placeholder pages by design — /blueprint-prototype fills them.`);
    else console.log(`    4. apps/portal builds green with placeholder content by design — /blueprint-prototype fills it.`);
  }
  console.log(`    Full map: the stamped CLAUDE.md at the initiative root.`);
}

// Research-variant scaffolding: the decision-memo pipeline structure + templates.
// Function declaration (hoisted) so main() above can call it.
async function scaffoldResearch({ target, dryRun, log }) {
  const dirs = [
    "research/sources",
    "research/problem-space",
    "research/competitive",
    "research/prior-art",
    "decisions",
    "docs",
    "tools",
  ];
  for (const d of dirs) {
    if (!dryRun) await fs.mkdir(path.join(target, d), { recursive: true });
    log.copied.push(`${d}/ (dir)`);
  }
  const files = [
    ["template/research/personas-and-jtbd.template.md", "research/personas-and-jtbd.md"],
    ["template/research/decision-memo.template.md", "docs/decision-memo.md"],
    ["template/research/decision-record.template.md", "decisions/_TEMPLATE.md"],
    ["template/tools/run-reviewers.mjs", "tools/run-reviewers.mjs"],
  ];
  for (const [src, dst] of files) {
    if (!dryRun) await fs.copyFile(path.join(BLUEPRINT_ROOT, src), path.join(target, dst));
    log.copied.push(dst);
  }
  const sourcesStub = [
    "# Source assets — provenance catalog",
    "",
    "Stage 0 (research variant). One row per input asset (brief, deck, dataset, dashboard).",
    "Confidential binaries are not committed — catalog them here with provenance and link out.",
    "This is the source-of-record every downstream claim must resolve to.",
    "",
    "| Asset | Author | Date | Type | Where it lives | Verification status |",
    "|---|---|---|---|---|---|",
    "| | | | | | |",
    "",
  ].join("\n");
  if (!dryRun) await fs.writeFile(path.join(target, "research/sources/README.md"), sourcesStub, "utf8");
  log.copied.push("research/sources/README.md");
}

main().catch((e) => { console.error(e); process.exit(2); });
