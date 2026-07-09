#!/usr/bin/env node
/**
 * blueprint-init/smoke.mjs — stamp-then-gate smoke test (wave 85).
 *
 * The encoded root cause of nine Pattern B defects logged by the ai-enablement
 * consumer (2026-07-08/09): the Pattern B stamp path had never been executed
 * end-to-end against its own gates. The stamp crashed on a TDZ ReferenceError,
 * shipped no reviewers, drifted its own chrome manifest, placed a file its
 * conformance gate rejects, kept a deploy-fatal placeholder token, and its
 * mechanical check scanned only Pattern A paths — every one invisible until a
 * consumer paid for it. This script makes "the stamper's output passes the
 * stamper's gates" a mechanical property:
 *
 *   1. Pattern B stamp into a temp dir → exit 0
 *   2. Imposition layer present (.claude reviewers + tools/lib + run-reviewers)
 *   3. portal-chrome-canonical-reviewer over the stamped tree → PASS
 *   4. portal-review-conformance-reviewer over the stamped tree → not BLOCKED
 *   5. No deploy-fatal placeholders in the stamped portal (wrangler.toml)
 *   6. Pattern A stamp --dry-run → exit 0 (flow/parse sanity)
 *
 * Run: node template/tools/blueprint-init/smoke.mjs   (from the repo root)
 * Exit: 0 = all green; 1 = any failure (each failure printed).
 */
import { promises as fs } from "node:fs";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCb);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = path.resolve(__dirname, "..", "..", "..");
const STAMP = path.join(__dirname, "stamp.mjs");

const failures = [];
const ok = (label) => console.log(`  ✓ ${label}`);
const bad = (label, detail) => {
  failures.push(label);
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
};

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "blueprint-smoke-"));
const target = path.join(tmp, "smoke-initiative");

try {
  // 1 — Pattern B stamp runs and exits 0 (the wave-85 TDZ crash regression).
  try {
    await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-test",
      "--display-name=Smoke Test",
      "--tagline=Smoke-test initiative",
      "--variant=brownfield",
      "--tier=1",
      "--portal-type=review",
      `--target=${target}`,
    ]);
    ok("Pattern B stamp exits 0");
  } catch (err) {
    const detail = [err.stdout, err.stderr].filter(Boolean).join("\n").trim().split("\n").slice(-3).join(" | ") || err.message;
    bad("Pattern B stamp exits 0", detail);
    console.error("\nSMOKE FAIL — stamp failed; remaining checks unreachable.");
    await fs.rm(tmp, { recursive: true, force: true });
    process.exit(1);
  }

  // 2 — imposition layer present (the Pattern A-only install gap).
  for (const rel of [
    ".claude/agents/blueprint/reviewers/portal-review-conformance-reviewer.mjs",
    ".claude/agents/lib/initiative-root.mjs",
    "tools/lib/cost-dial.mjs",
    "tools/run-reviewers.mjs",
  ]) {
    if (await fs.stat(path.join(target, rel)).catch(() => null)) ok(`stamped: ${rel}`);
    else bad(`stamped: ${rel}`, "missing — imposition layer gap");
  }

  // 3+4 — the stamped output passes the stamped gates.
  process.env.BLUEPRINT_HOME = BLUEPRINT_ROOT;
  for (const [name, allowWarn] of [
    ["portal-chrome-canonical-reviewer", false],
    ["portal-review-conformance-reviewer", true],
  ]) {
    const modPath = path.join(target, ".claude/agents/blueprint/reviewers", `${name}.mjs`);
    try {
      const mod = await import(pathToFileURL(modPath).href);
      const r = await mod.default({ targetDir: target });
      const pass = r.status === "PASS" || (allowWarn && r.status === "WARN");
      if (pass) ok(`${name}: ${r.status}`);
      else {
        const first = (r.findings || []).find((f) => f.severity === "BLOCK");
        bad(`${name}: ${r.status}`, first ? first.message.slice(0, 140) : "");
      }
    } catch (err) {
      bad(`${name} runs`, err.message.split("\n")[0]);
    }
  }

  // 5 — deploy-fatal placeholders (PROJECT_SLUG survived the binary copy path
  // pre-wave-85; mechanicalCheck also trips on it now, belt-and-braces here).
  const wrangler = await fs.readFile(path.join(target, "blueprint/portal/wrangler.toml"), "utf8").catch(() => "");
  if (wrangler.includes("PROJECT_SLUG")) bad("wrangler.toml deployable", "PROJECT_SLUG token survived the stamp");
  else if (wrangler.includes("smoke-test-blueprint")) ok("wrangler.toml deployable (name = smoke-test-blueprint)");
  else bad("wrangler.toml deployable", "expected name not found");

  // 6 — Pattern A dry-run sanity (flow + parse; no writes).
  try {
    await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-test-a",
      "--portal-type=initiative",
      `--target=${path.join(tmp, "smoke-a")}`,
      "--dry-run=true",
    ]);
    ok("Pattern A stamp --dry-run exits 0");
  } catch (err) {
    bad("Pattern A stamp --dry-run exits 0", (err.stderr || err.message).split("\n")[0]);
  }
} finally {
  await fs.rm(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nSMOKE FAIL — ${failures.length} check(s) failed. A stamped consumer would hit these on day one.`);
  process.exit(1);
}
console.log("\nsmoke green — the stamper's output passes the stamper's gates");
