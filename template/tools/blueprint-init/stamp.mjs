#!/usr/bin/env node
/**
 * blueprint-init/stamp.mjs — mechanically-checkable Pattern A portal scaffolder.
 *
 * Replaces the 2026-05-25 "copy template/apps/portal/ and remember to de-bc-ize"
 * pattern that left subs-initiative strings embedded in 6+ files. The stamper
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
};

// ── Pattern B canonical chrome manifest ──────────────────────────────────────
// Files in template/portal/ that are CANONICAL CHROME — methodology-owned,
// consumer-uneditable. `--mode=restamp-chrome --pattern=B` overwrites these
// files in the consumer's portal from template canonical; anything not in
// this list (project-tokens.css, _meta/*, pages/*, index.html, etc.) is left
// untouched.
//
// Adding a file here: the file must be byte-identical to template canonical
// after stamp (no PROJECT_NAME-style substitutions). If the file needs any
// per-project substitution, it does not belong in chrome — move it to the
// project-owned overlay surface (project-tokens.css, _meta, etc.).
//
// docs/index.html (added 2026-05-25 evening): data-driven from
// _meta/index.json `docs.tiers`, so the viewer JS/CSS/HTML structure is now
// truly canonical chrome with zero project-specific defaults.
//
// chat-widget.js (added 2026-05-25 evening): the prior version's Rally HQ
// brand string in the header comment was excised; the widget itself was
// always project-agnostic. Now canonical.
//
// theme-switcher.js (added 2026-05-26 wave 9 — multi-theme registry): runtime
// theme picker that reads ?theme= query param + localStorage and applies one
// of the 4 canonical themes (slate / coral / forest / minimal) declared in
// shared.css [data-theme] blocks. Initiative-side switcher promoted to chrome
// so every Pattern B portal gets the preview-switcher for free.
const PATTERN_B_CHROME_FILES = [
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

// Candidate locations a Pattern B consumer might place its portal. Resolve in
// order; first existing directory wins. Reflects the path-drift observed
// across rally-hq (blueprint/portal/) and the canonical (portal/) shapes.
//
// 2026-05-27 wave 14: the resolver now reads `prototype.portal_dir` from the
// consumer's blueprint.yml first; this candidate list is the fallback for
// first-time stamps and for consumers that haven't declared portal_dir. Source:
// rally-hq amendment 2026-05-26 (gap 1) — rally-hq's portal at blueprint/prototype/
// was outside this candidate list because the directory predates the canonical
// Pattern B contract.
const PATTERN_B_PORTAL_CANDIDATES = [
  "portal",
  "blueprint/portal",
];

// ── Substitution surface (mirrors README "Substitution table" exactly) ────────
function substitutions({ name, displayName, repoUrl, tagline, theme }) {
  const shortPrefix = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "bp";
  return [
    // Order matters: longer specific strings before shorter generic ones.
    { from: "the subscriptions initiative's repo (private)", to: repoUrl },
    { from: "An example product initiative", to: tagline },
    { from: "@subs-initiative/", to: `@${name}/` },
    { from: "BC Subscriptions", to: displayName },
    { from: "/project-logo.png", to: "/project-logo.png" },
    { from: "--bcs-", to: `--${shortPrefix}-` },
    { from: "subs-initiative", to: name },
    // Multi-theme registry (2026-05-26 wave 11): the stamper writes the
    // initiative's chosen theme into <html> as data-theme so the default applies
    // before JS loads. Runtime theme-switcher.js can override at the operator's
    // choosing (it reads ?theme= query param + localStorage first).
    { from: '<html lang="en">', to: `<html lang="en" data-theme="${theme}">` },
  ];
}

// Files where the subs-initiative strings are business content (10-gate framework,
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
    "  REPLACE_FOR_PROJECT — this file contains example business content carried over",
    "  from the subs-initiative reference initiative. Rewrite or delete before sharing",
    "  with stakeholders. The portal-pattern-a-conformance-reviewer treats this banner",
    "  as a warning, not a block.",
    "-->",
    "",
  ].join("\n"),
  ".js": [
    "/**",
    " * REPLACE_FOR_PROJECT — this file contains example data carried over from the",
    " * subs-initiative reference initiative. Replace before shipping to stakeholders.",
    " */",
    "",
  ].join("\n"),
};

// Extensions the stamper performs substitutions inside. Skip binary assets.
const TEXT_EXTS = new Set([
  ".astro", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs",
  ".json", ".md", ".css", ".html", ".yml", ".yaml",
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

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
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
      next = banner + next;
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

async function writeBlueprintYml({ target, name, variant, tier, pattern, tagline, dryRun, log }) {
  const dst = path.join(target, "blueprint.yml");
  const existing = await readMaybe(dst);
  if (existing) {
    log.skipped.push("blueprint.yml (already exists; preserved)");
    return;
  }
  const yml = [
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
    "# Pipeline shape — see ~/Workspace/dev/wip/blueprint/docs/variant-selection.md",
    `variant: ${variant}`,
    "",
    "# Deliverable sophistication — see ~/Workspace/dev/wip/blueprint/docs/portal-and-tier-ladder.md",
    "# Variant × Tier matrix codified in that doc; do not deviate without an ADR.",
    `tier: ${tier}`,
    "",
    "# Portal pattern (A = platform-portal, B = redesign-review-portal)",
    `portal_pattern: ${pattern}`,
    "",
    "execution:",
    "  depth: standard",
    "",
  ].join("\n");
  if (dryRun) {
    log.skipped.push("blueprint.yml (dry-run; would write)");
    return;
  }
  await fs.writeFile(dst, yml, "utf8");
  log.stamped.push("blueprint.yml");
}

async function mechanicalCheck({ target, log }) {
  const offenders = [];
  const allFiles = await walk(target);
  const tripwires = [
    "subs-initiative",
    "An example product initiative",
    "/project-logo.png",
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
    `--mode=restamp-chrome --pattern=B: no portal directory found under ${target}. ` +
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

  // Wave 14 (2026-05-27): pre-flight divergence check. Block destructive
  // overwrite of customized chrome unless operator explicitly accepts.
  // Source: rally-hq amendment 2026-05-26 gap 2 — shared.css byte-identical
  // contract assumes pristine canonical baseline; rally-hq's shared.css IS
  // the design system, not chrome surrounding one. Without this gate, a
  // restamp silently overwrites the consumer's design system.
  const classifications = [];
  for (const rel of PATTERN_B_CHROME_FILES) {
    const cls = await classifyChromeFile(path.join(srcRoot, rel), path.join(portalDir, rel));
    classifications.push({ rel, ...cls });
  }
  const diverged = classifications.filter((c) => c.status === "diverged");
  const acceptedSet = new Set((acceptOverwrite || "").split(",").map((s) => s.trim()).filter(Boolean));
  const blockedDiverged = diverged.filter((c) => !acceptedSet.has(c.rel) && !acceptedSet.has("ALL"));
  if (blockedDiverged.length && !dryRun) {
    console.error(`\nerror: --mode=restamp-chrome --pattern=B refusing to overwrite diverged chrome.`);
    console.error(`The following files diverge from canonical (the chrome you'd be replacing):`);
    for (const c of blockedDiverged) {
      console.error(`  - ${c.rel} (consumer=${c.dstLines} lines, canonical=${c.srcLines} lines, Δ=${c.delta >= 0 ? "+" : ""}${c.delta})`);
    }
    console.error(``);
    console.error(`Run --mode=audit-chrome --pattern=B --target=${target} first to classify each divergence (lag / customization / rot).`);
    console.error(`To force overwrite anyway, re-run with --accept-overwrite=<file1>,<file2>,... or --accept-overwrite=ALL.`);
    console.error(`This gate exists because canonical-baseline assumption can silently overwrite a consumer's design system.`);
    process.exit(3);
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
async function auditChromePatternB({ target, portalDirOverride }) {
  const resolved = await resolvePatternBPortalDir(target, { portalDirOverride });
  if (!resolved) failPortalDirNotFound(target);
  const { dir: portalDir, source: portalDirSource } = resolved;
  console.log(`\n— blueprint-init audit-chrome —`);
  console.log(`  target:         ${target}`);
  console.log(`  portal:         ${portalDir} (source: ${portalDirSource})`);
  console.log(`  canonical from: ${path.join(BLUEPRINT_ROOT, "template/portal")}`);
  console.log(`  manifest:       ${PATTERN_B_CHROME_FILES.length} chrome files in PATTERN_B_CHROME_FILES\n`);

  const srcRoot = path.join(BLUEPRINT_ROOT, "template/portal");
  const rows = [];
  for (const rel of PATTERN_B_CHROME_FILES) {
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
      console.log(`    --mode=restamp-chrome --pattern=B --target=${target} --accept-overwrite=${lagFiles.join(",")}`);
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

async function modeRestampChrome(args) {
  const pattern = (args["pattern"] || "").toUpperCase();
  const target = args["target"] ? path.resolve(args["target"].replace(/^~/, process.env.HOME || "")) : null;
  const dryRun = args["dry-run"] === "true";
  const acceptOverwrite = args["accept-overwrite"] || null;
  const portalDirOverride = args["portal-dir"] || null;
  if (!target) fail(`--mode=restamp-chrome: --target is required`);
  if (pattern !== "A" && pattern !== "B") fail(`--mode=restamp-chrome: --pattern must be A or B; got "${args["pattern"]}"`);
  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || !targetStat.isDirectory()) fail(`--target must exist and be a directory: ${target}`);

  const log = { copied: [], stamped: [], banner: [], renamed: [], skipped: [], mechanicalCheck: [] };
  if (pattern === "B") {
    await restampChromePatternB({ target, dryRun, acceptOverwrite, portalDirOverride, log });
  } else {
    fail(`--mode=restamp-chrome --pattern=A not yet implemented. The Pattern A canonical chrome surface (packages/ui, packages/design-tokens, src/styles) needs an audit before a manifest can be declared. See README §"Restamping Pattern A chrome".`);
  }
  printReport(log);
}

// Wave 14 (2026-05-27): audit-chrome mode handler. Read-only; no writes.
async function modeAuditChrome(args) {
  const pattern = (args["pattern"] || "").toUpperCase();
  const target = args["target"] ? path.resolve(args["target"].replace(/^~/, process.env.HOME || "")) : null;
  const portalDirOverride = args["portal-dir"] || null;
  if (!target) fail(`--mode=audit-chrome: --target is required`);
  if (pattern !== "B") fail(`--mode=audit-chrome: --pattern=B is required (Pattern A audit not yet implemented)`);
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

  const required = ["name", "display-name", "repo-url", "tagline", "variant", "tier", "pattern", "target"];
  const missing = required.filter((k) => !args[k]);
  if (missing.length) fail(`missing required flags: ${missing.join(", ")}`);

  const name = args["name"];
  const displayName = args["display-name"];
  const repoUrl = args["repo-url"].replace(/\/$/, "");
  const tagline = args["tagline"];
  const variant = args["variant"];
  const tier = String(args["tier"]);
  const pattern = args["pattern"].toUpperCase();
  const target = path.resolve(args["target"].replace(/^~/, process.env.HOME || ""));
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
  if (pattern !== "A" && pattern !== "B") fail(`pattern must be A or B; got ${pattern}`);
  if (pattern === "B") fail(`pattern B initial stamp not yet implemented. For chrome refresh on an existing Pattern B portal, run with --mode=restamp-chrome --pattern=B --target=<path>. See README §"Pattern B stamper".`);

  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || !targetStat.isDirectory()) fail(`--target must exist and be a directory: ${target}`);

  const subs = substitutions({ name, displayName, repoUrl, tagline, theme });
  const log = { copied: [], stamped: [], banner: [], renamed: [], skipped: [], mechanicalCheck: [] };

  console.log(`blueprint-init: stamping Pattern A scaffold into ${target}`);
  console.log(`  variant=${variant} tier=${tier} (${VARIANT_TIER_MATRIX[variant][tier]})`);
  console.log(`  name=${name} display-name="${displayName}"`);
  console.log(`  repo-url=${repoUrl}`);
  console.log(`  dry-run=${dryRun}`);

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
  await renameLogo(target, dryRun, log);
  if (logoSrc) await replaceLogo(logoSrc, target, dryRun, log);
  await writeBlueprintYml({ target, name, variant, tier, pattern, tagline, dryRun, log });

  if (!dryRun) await mechanicalCheck({ target, name, log });
  printReport(log);

  if (log.mechanicalCheck && log.mechanicalCheck.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(2); });
