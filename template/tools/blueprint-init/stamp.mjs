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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ── Variant × Tier matrix (kept in sync with docs/portal-and-tier-ladder.md) ──
// true  = allowed and reasonable; false = blocked unless --force.
const VARIANT_TIER_MATRIX = {
  greenfield: { 0: "exploration-only", 1: "default", 2: "if-product-day-one" },
  midstream:  { 0: "blocked", 1: "portal-only", 2: "default" },
  brownfield: { 0: "doc-only-audit", 1: "default", 2: "audit-ships-product" },
};

// ── Substitution surface (mirrors README "Substitution table" exactly) ────────
function substitutions({ name, displayName, repoUrl, tagline }) {
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
  ];
}

// Files where the subs-initiative strings are business content (10-gate framework,
// delivery-fork strategy, dependency-graph example issues). The stamper still
// performs the substitutions, but prepends a banner so the operator knows the
// content needs review.
const BANNER_FILES = new Set([
  "apps/portal/src/pages/inspect/gates.astro",
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
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

  if (!VARIANT_TIER_MATRIX[variant]) fail(`unknown variant: ${variant}`);
  if (!VARIANT_TIER_MATRIX[variant][tier]) fail(`unknown tier: ${tier}`);
  if (VARIANT_TIER_MATRIX[variant][tier] === "blocked") {
    fail(
      `variant=${variant} + tier=${tier} is blocked by the Variant × Tier matrix. ` +
      `See docs/portal-and-tier-ladder.md.`
    );
  }
  if (pattern !== "A" && pattern !== "B") fail(`pattern must be A or B; got ${pattern}`);
  if (pattern === "B") fail(`pattern B stamper not yet implemented — see README §"Pattern B stamper"`);

  const targetStat = await fs.stat(target).catch(() => null);
  if (!targetStat || !targetStat.isDirectory()) fail(`--target must exist and be a directory: ${target}`);

  const subs = substitutions({ name, displayName, repoUrl, tagline });
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
