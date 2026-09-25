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
 *   2. Imposition layer present (.claude reviewers + tools/lib + run-reviewers);
 *      the recovery brief's refresh command runs with no package.json
 *   3. portal-chrome-canonical-reviewer over the stamped tree → PASS
 *   4. portal-review-conformance-reviewer over the stamped tree → not BLOCKED
 *   5. No deploy-fatal placeholders in the stamped portal (wrangler.toml)
 *   6. Stamped Pattern B tree → FULL doctor; both conformance reviewers executed
 *   6b. The stamped runner runs the Review Portal reviewers doctor runs, no others
 *   7. Pattern A REAL stamp → exit 0, policy line + portal shell present; every
 *      package.json script target exists; the brief names `npm run derive`;
 *      `npm run reviewers` runs the stamped runner, which runs the portal
 *      reviewers doctor runs (none, on a fresh stamp)
 *   8. Pilot-gate integration: fresh stamp blocks advance; populated profile passes
 *   9. chat-widget deriveChatMeta: zero/custom/absent manifest cases
 *  10. ADR-0010: readiness census + intent-gated prep-deploy + verified promotion + chat default-off
 *  11. Research real stamp: memo/evidence tree, no portal, inline-comment routing;
 *      its package.json scripts run; derived/ skips the decision template and is
 *      rerun after the first commit; Stage 3 is not started until a real ADR exists
 *  12. Methodology-amendment templates share one canonical field shape
 *  13. Tier 0 is pre-portal (decisions/11): no portal on either portal type, the
 *      portal-free package.json runs, doctor/reader/runner gates hold, no stamped
 *      file passes a prototype gate; a Tier 1 re-stamp names the files to edit;
 *      research + --logo exits 0; the tier-ladder doc agrees
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
const check = (cond, label, detail) => (cond ? ok(label) : bad(label, detail));

// Every script in a stamped package.json must run against what the stamp wrote:
// each `node <file>` names a file and each `-w <dir>` a workspace that exists.
// Wave 109: research stamps shipped `-w apps/portal` scripts and no apps/portal.
async function missingScriptTargets(root) {
  const scripts = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")).scripts ?? {};
  const missing = [];
  for (const [name, cmd] of Object.entries(scripts)) {
    for (const [, kind, rel] of cmd.matchAll(/(node|-w)\s+(\S+)/g)) {
      const p = kind === "-w" ? path.join(root, rel, "package.json") : path.join(root, rel);
      if (!(await fs.stat(p).catch(() => null))) missing.push(`${name} → ${rel}`);
    }
  }
  return missing;
}

// The refresh command a stamped recovery brief prints must work in that stamp:
// an npm script its package.json defines, or a node script that exists.
async function briefRefreshCommand(root) {
  const brief = await fs.readFile(path.join(root, "derived", "recovery-brief.md"), "utf8").catch(() => "");
  const cmd = /rerun `([^`]+)` to refresh/.exec(brief)?.[1];
  if (!cmd) return { cmd, resolves: false, detail: "brief names no refresh command" };
  const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8").catch(() => "{}"));
  const npmScript = /^npm run (\S+)$/.exec(cmd)?.[1];
  if (npmScript) return { cmd, resolves: Boolean(pkg.scripts?.[npmScript]), detail: `${cmd}; scripts: ${Object.keys(pkg.scripts ?? {}).join(", ") || "none"}` };
  const nodeFile = /^node (\S+)/.exec(cmd)?.[1];
  if (nodeFile) return { cmd, resolves: Boolean(await fs.stat(path.join(root, nodeFile)).catch(() => null)), detail: cmd };
  return { cmd, resolves: false, detail: `unrecognized command: ${cmd}` };
}

// Every stamp carries tools/run-reviewers.mjs, and it must run exactly the portal
// reviewers `blueprint doctor` runs (decisions/11, wave 113): both read
// tools/lib/portal-reviewer-routing.mjs. Before, it ran all three on every
// non-research stamp — 11 BLOCKs on a fresh Initiative Portal stamp.
const PORTAL_REVIEWERS = ["portal-initiative-conformance-reviewer", "portal-chrome-canonical-reviewer", "portal-review-conformance-reviewer"];
async function runStampedReviewers(root, { viaNpm = false } = {}) {
  const [cmd, args] = viaNpm
    ? ["npm", ["run", "--silent", "reviewers"]]
    : [process.execPath, [path.join(root, "tools", "run-reviewers.mjs")]];
  const { code, out } = await execFile(cmd, args, { cwd: root })
    .then((r) => ({ code: 0, out: `${r.stdout}${r.stderr}` }), (e) => ({ code: e.code, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }));
  const rows = [...out.matchAll(/^\s+\[(\w+)\s*\] (\S+)/gm)].map(([, status, name]) => ({ status, name }));
  return {
    code,
    out,
    portal: rows.map((r) => r.name).filter((n) => PORTAL_REVIEWERS.includes(n)).sort(),
    errors: rows.filter((r) => r.status === "ERROR").map((r) => r.name),
  };
}
const doctorPortalReviewers = (doc) => PORTAL_REVIEWERS.filter((n) =>
  doc.checks.some((c) => c.name === "portal-conformance" && c.status !== "skip" && (c.detail || "").includes(n))).sort();

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
    "tools/lib/review-loop.mjs",
    "tools/lib/portal-reviewer-routing.mjs",
    "tools/run-reviewers.mjs",
  ]) {
    if (await fs.stat(path.join(target, rel)).catch(() => null)) ok(`stamped: ${rel}`);
    else bad(`stamped: ${rel}`, "missing — imposition layer gap");
  }
  // 2b — Pattern B writes no package.json, so its recovery brief must name a
  // refresh command that works without one (wave 109).
  const bRefresh = await briefRefreshCommand(target);
  check(bRefresh.resolves, "Pattern B brief's refresh command runs in the stamp", bRefresh.detail);

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

  // 6 — the stamped Pattern B tree passes FULL doctor, and both Pattern B
  // conformance reviewers demonstrably EXECUTED (wave 86 — doctor used to key
  // conformance on apps/portal existing, so Pattern B trees were never
  // doctor-covered; a skipped reviewer must read as a failure here, not green).
  const { runDoctor } = await import(pathToFileURL(path.join(BLUEPRINT_ROOT, "template", "tools", "lib", "doctor.mjs")).href);
  let bDoctor = null;
  try {
    const doc = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: target });
    bDoctor = doc;
    const conf = doc.checks.filter((c) => c.name === "portal-conformance");
    for (const reviewer of ["portal-chrome-canonical-reviewer", "portal-review-conformance-reviewer"]) {
      const row = conf.find((c) => (c.detail || "").includes(reviewer));
      // `skip` means the reviewer did NOT execute (file absent from the
      // methodology home) — the exact silent-green this tripwire guards
      // against; it must fail here (post-commit review of 5dfee3c).
      if (!row) bad(`doctor ran ${reviewer} on the stamped Pattern B tree`, `portal-conformance rows: ${JSON.stringify(conf.map((c) => c.detail))}`);
      else if (row.status === "fail" || row.status === "skip") bad(`doctor: ${reviewer} executed and not failing`, `${row.status} — ${row.detail}`);
      else ok(`doctor executed ${reviewer}: ${row.status}`);
    }
    if (doc.checks.some((c) => c.status === "fail")) bad("doctor over stamped Pattern B tree has no fails", doc.checks.filter((c) => c.status === "fail").map((c) => `${c.name}: ${c.detail}`).join(" | "));
    else ok(`doctor over stamped Pattern B tree: ${doc.status}`);
  } catch (err) {
    bad("doctor over stamped Pattern B tree", err.message);
  }

  // 6b — decisions/11: the stamped runner runs the portal reviewers doctor runs.
  // It used to add the Initiative Portal reviewer, which BLOCKs here.
  try {
    const run = await runStampedReviewers(target);
    check(run.errors.length === 0, "Pattern B runner: no reviewer ERRORs", run.errors.join(", "));
    check(run.portal.join() === "portal-chrome-canonical-reviewer,portal-review-conformance-reviewer",
      "Pattern B runner runs the two Review Portal reviewers and not the Initiative Portal one", run.portal.join(", ") || "none");
    if (bDoctor) {
      check(run.portal.join() === doctorPortalReviewers(bDoctor).join(), "Pattern B runner and doctor run the same portal reviewers",
        `runner [${run.portal.join(", ")}] doctor [${doctorPortalReviewers(bDoctor).join(", ")}]`);
    }
  } catch (err) {
    bad("Pattern B stamped runner", err.message);
  }

  // 7 — Pattern A REAL stamp (was dry-run-only; the npm artifact ships this
  // path, so release must exercise it — wave-86 review requirement).
  const aTarget = path.join(tmp, "smoke-a");
  try {
    await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-test-a",
      "--display-name=Smoke Test A",
      "--tagline=Pattern A smoke",
      "--portal-type=initiative",
      `--target=${aTarget}`,
    ]);
    ok("Pattern A real stamp exits 0");
  } catch (err) {
    bad("Pattern A real stamp exits 0", (err.stderr || err.message).split("\n").slice(-3).join(" | "));
  }
  const aYml = await fs.readFile(path.join(aTarget, "blueprint.yml"), "utf8").catch(() => "");
  if (/^pilot_profile_policy: required$/m.test(aYml)) ok("Pattern A stamp writes pilot_profile_policy: required");
  else bad("Pattern A stamp writes pilot_profile_policy: required", "policy line missing from stamped blueprint.yml");
  // Stamped EMPTY on purpose (judged-screen-pattern.md § 2a): an undeclared
  // design_intent WARNs, and must never be read as `preserve`.
  if (/^design_intent: ""/m.test(aYml)) ok("Pattern A stamp writes an empty design_intent");
  else bad("Pattern A stamp writes an empty design_intent", "design_intent line missing from stamped blueprint.yml");
  if (await fs.stat(path.join(aTarget, "apps", "portal", "package.json")).catch(() => null)) ok("Pattern A portal shell present");
  else bad("Pattern A portal shell present", "apps/portal/package.json missing");
  const aMissing = await missingScriptTargets(aTarget).catch((err) => [err.message]);
  check(aMissing.length === 0, "Pattern A package.json scripts all point at stamped files", aMissing.join(", "));
  const aRefresh = await briefRefreshCommand(aTarget);
  check(aRefresh.resolves && aRefresh.cmd === "npm run derive", "Pattern A brief's refresh command is its npm derive script", aRefresh.detail);

  // 7a — decisions/11: Initiative Portal stamps carry the runner too (the
  // adaptive-commerce-content amendment of 2026-07-23 found it missing), and it
  // runs the portal reviewers doctor runs. On a fresh stamp that is none: the
  // actor-output manifest is the contract, and there is no Review Portal.
  try {
    const aPkg = JSON.parse(await fs.readFile(path.join(aTarget, "package.json"), "utf8"));
    check(aPkg.scripts?.reviewers === "node tools/run-reviewers.mjs", "Pattern A package.json offers `npm run reviewers`", JSON.stringify(aPkg.scripts));
    const run = await runStampedReviewers(aTarget, { viaNpm: true });
    check(/variant=greenfield\b/.test(run.out) && !/Missing script|Cannot find module/.test(run.out),
      `Pattern A \`npm run reviewers\` executes the stamped runner (exit ${run.code})`, run.out.trim().split("\n").slice(0, 3).join(" | "));
    check(run.errors.length === 0, "Pattern A runner: no reviewer ERRORs", run.errors.join(", "));
    const aDoctor = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: aTarget });
    check(run.portal.length === 0 && doctorPortalReviewers(aDoctor).length === 0,
      "Pattern A runner and doctor both run no portal reviewer on a fresh stamp",
      `runner [${run.portal.join(", ")}] doctor [${doctorPortalReviewers(aDoctor).join(", ")}]`);
  } catch (err) {
    bad("Pattern A stamped runner", err.message);
  }

  // 7b — actor-output contract from birth (decisions/05, wave 89): a fresh stamp
  // carries the intrinsic manifest, its derived outputs exist, the gate verdict
  // is an EARNED PASS (outcomes served by real artifacts), and the migration key
  // sanctions portal_type coexisting — doctor would FAIL the pair without it.
  try {
    const ao = await import(new URL("../lib/actor-output.mjs", import.meta.url).href);
    const r = ao.validateManifestFile(path.join(aTarget, "actor-output.yml"), { root: aTarget, gate: true });
    if (r.route === "actor-output" && r.verdict === "PASS") ok("fresh stamp's actor-output manifest gates PASS (intrinsic outcomes served)");
    else bad("fresh stamp's actor-output manifest gates PASS (intrinsic outcomes served)", `route=${r.route} verdict=${r.verdict} — ${[...r.errors, ...r.pendings].join(" | ")}`);
    if (/^migration: actor-output$/m.test(aYml)) ok("stamped blueprint.yml sanctions the dual state (migration: actor-output)");
    else bad("stamped blueprint.yml sanctions the dual state (migration: actor-output)", "migration key missing — doctor FAILs manifest + portal_type");
  } catch (err) {
    bad("actor-output contract from birth", err.message);
  }

  // 7c — reader contract from birth (wave 96): the copy source map must be
  // valid even before the portal is built. Missing dist is an honest WARN, not
  // a false PASS or a BLOCK on a fresh scaffold.
  try {
    const encounter = await import(new URL("../lib/encounter-audit.mjs", import.meta.url).href);
    const r = await encounter.auditReaderContract({ targetDir: aTarget });
    if (r.status !== "BLOCKED" && r.metadata.surfaces === 1) ok("fresh stamp has a valid reader contract + copy source map");
    else bad("fresh stamp has a valid reader contract + copy source map", `${r.status}: ${r.findings.map((f) => f.message).join(" | ")}`);
  } catch (err) {
    bad("reader contract from birth", err.message);
  }

  // 7c — portal derivation (decisions/05 step 7, wave 90): an intrinsic fresh
  // stamp declares no portal views (maintainer + next-agent have no browsable
  // surface), so portal-derive is a clean no-op — the legacy verb shell renders
  // until a viewer-serving output declares views.
  try {
    const pd = await import(new URL("../lib/portal-derive.mjs", import.meta.url).href);
    const r = pd.derive(aTarget);
    if (r.ok && r.views.length === 0 && r.wrote === null) ok("intrinsic stamp: portal-derive is a clean no-op (no views declared)");
    else bad("intrinsic stamp: portal-derive is a clean no-op (no views declared)", `ok=${r.ok} views=${r.views?.length} wrote=${r.wrote} ${(r.errors ?? []).join(" | ")}`);
  } catch (err) {
    bad("portal derivation no-op on intrinsic stamp", err.message);
  }

  // 8 — pilot-gate integration (wave 86): a FRESH stamp must block advance on
  // the empty profile; populating all 7 fields + a real citation file unblocks
  // the gate. This is the required-for-new / legacy-exception contract proven
  // against actual `init` output, not a synthetic fixture.
  try {
    const sm = await import(pathToFileURL(path.join(BLUEPRINT_ROOT, "template", "tools", "lib", "stage-model.mjs")).href);
    const gateOf = (root) => sm.deriveStageStatus({ root }).stages.find((s) => s.id === 0).gates.find((g) => g.gate === "pilot-profile");
    const fresh = gateOf(aTarget);
    if (fresh.state !== "pass") ok(`fresh stamp: pilot-profile gate blocks (${fresh.state})`);
    else bad("fresh stamp: pilot-profile gate blocks", `expected non-pass, got pass (${fresh.evidence})`);
    let yml2 = aYml
      .replace('slug: ""', 'slug: "smoke-pilot"')
      .replace('display_name: ""', 'display_name: "Smoke Pilot"')
      .replace('pain_point: ""', 'pain_point: "A concrete failing thing."')
      .replace('monetization_side: ""', 'monetization_side: "operator"')
      .replace('walkthrough_citation: ""', 'walkthrough_citation: "research/walkthrough.md"')
      .replace("competitors_in_scope: []", 'competitors_in_scope: ["CompA"]')
      .replace("out_of_scope_pilots: []", 'out_of_scope_pilots: ["Other pilot"]');
    await fs.mkdir(path.join(aTarget, "research"), { recursive: true });
    await fs.writeFile(path.join(aTarget, "research", "walkthrough.md"), "smoke walkthrough\n");
    await fs.writeFile(path.join(aTarget, "blueprint.yml"), yml2);
    const filled = gateOf(aTarget);
    if (filled.state === "pass") ok("populated profile + citation: pilot-profile gate passes");
    else bad("populated profile + citation: pilot-profile gate passes", `${filled.state} — ${filled.evidence}`);

    // 8b — reviewer-wired advance + freshness (ADR-0009 rollout d): the mapped
    // pilot reviewer runs at the frontier; a recorded PASS is reused while the
    // reviewer + its declared inputs are unchanged; mutating an input forces a
    // rerun. Exercised against the REAL stamped tree and the REAL reviewer.
    const adv = (extra = {}) => sm.recordAdvance({ root: aTarget, asserts: { "sensor-wired": "smoke drove it" }, home: BLUEPRINT_ROOT, now: "2026-01-01T00:00:00Z", ...extra });
    const dry1 = await adv();
    if (dry1.ok && (dry1.reviews || []).some((r) => r.reviewer === "pilot-profile-lock-reviewer" && r.ran === true)) ok("advance runs the mapped pilot reviewer (dry-run)");
    else bad("advance runs the mapped pilot reviewer (dry-run)", JSON.stringify({ ok: dry1.ok, reviews: dry1.reviews, blocked: dry1.reviewerBlocked }));
    const exec1 = await adv({ execute: true });
    const statePath = path.join(aTarget, ".blueprint", "stage-state.json");
    const state1 = JSON.parse(await fs.readFile(statePath, "utf8"));
    if (exec1.ok && state1.reviews && state1.reviews["pilot-profile"] && state1.reviews["pilot-profile"].fingerprint) ok("--execute records reviewer result + input fingerprint");
    else bad("--execute records reviewer result + input fingerprint", JSON.stringify(state1.reviews || null));
    // rewind the shell assertion so Stage 0 is the frontier again (reviews kept)
    delete state1.assertions["sensor-wired"];
    state1.cursor = -1;
    await fs.writeFile(statePath, JSON.stringify(state1, null, 2) + "\n");
    const dry2 = await adv();
    const reused = (dry2.reviews || []).find((r) => r.reviewer === "pilot-profile-lock-reviewer");
    if (dry2.ok && reused && reused.ran === false) ok("fresh recorded PASS reused (no rerun)");
    else bad("fresh recorded PASS reused (no rerun)", JSON.stringify(dry2.reviews));
    await fs.writeFile(path.join(aTarget, "blueprint.yml"), (await fs.readFile(path.join(aTarget, "blueprint.yml"), "utf8")).replace("A concrete failing thing.", "A different failing thing."));
    const dry3 = await adv();
    const rerun = (dry3.reviews || []).find((r) => r.reviewer === "pilot-profile-lock-reviewer");
    if (rerun && rerun.ran === true) ok("stale input fingerprint forces reviewer rerun");
    else bad("stale input fingerprint forces reviewer rerun", JSON.stringify(dry3.reviews));
  } catch (err) {
    bad("pilot-gate integration", err.message);
  }

  // 9 — chat-widget copy derivation (wave 86): zero docs must NOT claim a read
  // corpus; custom manifest suggestions are honored; absent manifest is safe.
  try {
    const { createRequire } = await import("node:module");
    const req = createRequire(import.meta.url);
    const { deriveChatMeta } = req(path.join(BLUEPRINT_ROOT, "template", "portal", "chat-widget.js"));
    const zero = deriveChatMeta({ docs: { tiers: [] } });
    const absent = deriveChatMeta(null);
    const custom = deriveChatMeta({ docs: { tiers: [{ docs: [{ id: "a" }, { id: "b" }] }] }, chat: { suggestions: ["Custom Q?", "", "x".repeat(99)] } });
    if (zero.docCount === 0 && /not published/.test(zero.subtitle) && !/read the docs/.test(zero.greeting)) ok("chat copy: zero docs → honest subtitle/greeting");
    else bad("chat copy: zero docs → honest subtitle/greeting", JSON.stringify(zero));
    if (absent.suggestions.length === 4 && /not published/.test(absent.subtitle)) ok("chat copy: absent manifest → neutral defaults");
    else bad("chat copy: absent manifest → neutral defaults", JSON.stringify(absent));
    if (custom.docCount === 2 && custom.suggestions.length === 1 && custom.suggestions[0] === "Custom Q?") ok("chat copy: custom suggestions filtered + doc count real");
    else bad("chat copy: custom suggestions filtered + doc count real", JSON.stringify(custom));
  } catch (err) {
    bad("chat-widget copy derivation", err.message);
  }

  // 10 — readiness states + intent-gated deploy (ADR-0010 rollout e): the
  // stamped tree deploys as preview (shell WARNs), refuses stakeholder intent
  // (shell BLOCKs), a hand-promoted placeholder page is caught by the
  // conformance reviewer, and a genuinely promoted page unblocks the deploy.
  try {
    const bPortal = path.join(target, "blueprint", "portal");
    const exMeta = path.join(bPortal, "_meta", "example.json");
    const exHtml = path.join(bPortal, "pages", "example.html");
    const meta0 = JSON.parse(await fs.readFile(exMeta, "utf8"));
    if (meta0.readiness === "shell") ok("stamped page meta declares readiness: shell");
    else bad("stamped page meta declares readiness: shell", String(meta0.readiness));
    const prep = (intent) => execFile("bash", [path.join(bPortal, "scripts", "prep-deploy.sh"), `--intent=${intent}`]);
    await prep("preview").then(() => ok("prep-deploy --intent=preview proceeds with shell WARN"),
      (e) => bad("prep-deploy --intent=preview proceeds with shell WARN", (e.stderr || e.message).split("\n").slice(-3).join(" | ")));
    await prep("stakeholder").then(() => bad("prep-deploy --intent=stakeholder BLOCKS on shell page", "exited 0 — the gate did not refuse"),
      () => ok("prep-deploy --intent=stakeholder BLOCKS on shell page"));
    // hand-promote WITHOUT replacing placeholders → reviewer must BLOCK (4c)
    meta0.readiness = "stakeholder-ready";
    await fs.writeFile(exMeta, JSON.stringify(meta0, null, 2) + "\n");
    const rmod = await import(pathToFileURL(path.join(target, ".claude/agents/blueprint/reviewers/portal-review-conformance-reviewer.mjs")).href);
    const r1 = await rmod.default({ targetDir: target });
    if (r1.status === "BLOCKED" && r1.findings.some((f) => /placeholder content/.test(f.message))) ok("hand-promoted placeholder page → conformance BLOCK");
    else bad("hand-promoted placeholder page → conformance BLOCK", `${r1.status} — ${JSON.stringify(r1.findings.slice(0, 2).map((f) => f.message))}`);
    // genuinely promote: strip tripwires from the page HTML
    const html = await fs.readFile(exHtml, "utf8");
    await fs.writeFile(exHtml, html.replace(/Replace this hero/g, "Real hero copy").replace(/Replace this body/g, "Real body copy"));
    const r2 = await rmod.default({ targetDir: target });
    if (!r2.findings.some((f) => /placeholder content|stakeholder-ready/.test(f.message) && f.severity === "BLOCK")) ok("promoted page with real content clears readiness verification");
    else bad("promoted page with real content clears readiness verification", JSON.stringify(r2.findings.filter((f) => f.severity === "BLOCK").map((f) => f.message)));
    await prep("stakeholder").then(() => ok("prep-deploy --intent=stakeholder passes once no shell pages remain"),
      (e) => bad("prep-deploy --intent=stakeholder passes once no shell pages remain", (e.stderr || e.message).split("\n").slice(-3).join(" | ")));
    // chat access mode derivation (widget-side predicate)
    const { createRequire } = await import("node:module");
    const req2 = createRequire(import.meta.url);
    const { chatAccessMode } = req2(path.join(BLUEPRINT_ROOT, "template", "portal", "chat-widget.js"));
    if (chatAccessMode(null) === "off" && chatAccessMode({ chat: {} }) === "off" && chatAccessMode({ chat: { access: "everyone" } }) === "off" && chatAccessMode({ chat: { access: "open-capped" } }) === "open-capped") ok("chatAccessMode: default-off, opt-in only");
    else bad("chatAccessMode: default-off, opt-in only", "predicate returned unexpected modes");

    // 10b — review-of-ab0e084 gaps, each reproduced there before fixing:
    // open-capped + unattested spend cap must BLOCK a stakeholder deploy (the
    // template's own commented default line defeated the first cut's regex);
    // an attested date passes; an invalid readiness value BLOCKs instead of
    // downgrading to legacy-WARN; a stakeholder-ready meta with a missing page
    // file BLOCKs in the conformance reviewer.
    const idxPath = path.join(bPortal, "_meta", "index.json");
    const idx0 = JSON.parse(await fs.readFile(idxPath, "utf8"));
    idx0.chat = { ...(idx0.chat || {}), access: "open-capped" };
    await fs.writeFile(idxPath, JSON.stringify(idx0, null, 2) + "\n");
    await prep("stakeholder").then(() => bad("open-capped + unattested spend cap BLOCKS stakeholder deploy", "exited 0 — the template's default 'none # comment' line slipped the gate"),
      () => ok("open-capped + unattested spend cap BLOCKS stakeholder deploy"));
    const specPath = path.join(bPortal, "functions", "api", "chat.OWNER-SPEC.md");
    await fs.writeFile(specPath, (await fs.readFile(specPath, "utf8")).replace(/^spend_cap_attested:.*$/m, "spend_cap_attested: 2026-07-11"));
    await prep("stakeholder").then(() => ok("open-capped + attested spend cap passes stakeholder deploy"),
      (e) => bad("open-capped + attested spend cap passes stakeholder deploy", (e.stderr || e.message).split("\n").slice(-3).join(" | ")));
    meta0.readiness = "stakholder-ready"; // deliberate typo
    await fs.writeFile(exMeta, JSON.stringify(meta0, null, 2) + "\n");
    await prep("stakeholder").then(() => bad("invalid readiness value BLOCKS stakeholder deploy", "exited 0 — typo downgraded to legacy WARN"),
      () => ok("invalid readiness value BLOCKS stakeholder deploy"));
    meta0.readiness = "stakeholder-ready";
    await fs.writeFile(exMeta, JSON.stringify(meta0, null, 2) + "\n");
    await fs.rename(exHtml, exHtml + ".gone");
    const r3 = await rmod.default({ targetDir: target });
    if (r3.findings.some((f) => f.severity === "BLOCK" && /does not exist — nothing to verify/.test(f.message))) ok("stakeholder-ready meta with missing page file BLOCKS");
    else bad("stakeholder-ready meta with missing page file BLOCKS", JSON.stringify(r3.findings.filter((f) => f.severity === "BLOCK").map((f) => f.message)));
    await fs.rename(exHtml + ".gone", exHtml);
  } catch (err) {
    bad("readiness/intent gate integration", err.message);
  }

  // 11 — research is a first-class initial stamp, not a greenfield stamp with
  // a renamed scalar. Its decision-memo tree exists, product portal scaffolding
  // does not, and an inline comment on variant must survive runner routing.
  const researchTarget = path.join(tmp, "smoke-research");
  try {
    const researchStamp = await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-research",
      "--display-name=Smoke Research",
      "--variant=research",
      "--tier=0",
      `--target=${researchTarget}`,
    ]);
    ok("research real stamp exits 0");
    if (/stamping research decision\/evidence scaffold/.test(researchStamp.stdout)
      && !/stamping Initiative Portal scaffold/.test(researchStamp.stdout)) {
      ok("research stamp identifies the memo/evidence scaffold, not an Initiative Portal");
    } else {
      bad("research stamp identifies the memo/evidence scaffold, not an Initiative Portal", researchStamp.stdout.trim().split("\n")[0]);
    }
    for (const rel of [
      "research/sources/README.md",
      "research/personas-and-jtbd.md",
      "decisions/_TEMPLATE.md",
      "docs/decision-memo.md",
      "tools/run-reviewers.mjs",
      "tools/lib/yaml-scalar.mjs",
    ]) {
      if (await fs.stat(path.join(researchTarget, rel)).catch(() => null)) ok(`research stamped: ${rel}`);
      else bad(`research stamped: ${rel}`, "missing");
    }
    for (const rel of ["apps/portal", "packages"]) {
      if (await fs.stat(path.join(researchTarget, rel)).catch(() => null)) bad(`research omits ${rel}`, "unexpected product scaffold");
      else ok(`research omits ${rel}`);
    }

    // 11b — wave 109. The research package.json carries only commands this
    // stamp can run, the brief names one of them, derived/ skips the decision
    // template, Stage 3 reads not started until a real ADR exists, and the
    // first-commit instruction the stamp prints actually works.
    const researchPkg = JSON.parse(await fs.readFile(path.join(researchTarget, "package.json"), "utf8"));
    check(!researchPkg.workspaces && !researchPkg.overrides && Object.keys(researchPkg.scripts ?? {}).sort().join() === "derive,reviewers",
      "research package.json: derive + reviewers only, no portal workspaces", JSON.stringify(researchPkg));
    const researchMissing = await missingScriptTargets(researchTarget);
    check(researchMissing.length === 0, "research package.json scripts all point at stamped files", researchMissing.join(", "));
    const npmRun = (script) => execFile("npm", ["run", "--silent", script], { cwd: researchTarget })
      .then((r) => ({ code: 0, out: `${r.stdout}${r.stderr}` }), (e) => ({ code: e.code, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }));
    const deriveRun = await npmRun("derive");
    check(deriveRun.code === 0, "research `npm run derive` runs", `exit ${deriveRun.code} ${deriveRun.out.trim().split("\n").slice(-2).join(" | ")}`);
    // A fresh stamp's reviewers BLOCK (empty research legs), so the runner exits
    // 1. The check is that the script executes the runner, not that gates pass.
    const reviewersRun = await npmRun("reviewers");
    check(/variant=research\b/.test(reviewersRun.out) && !/Missing script|No workspaces found|Cannot find module/.test(reviewersRun.out),
      `research \`npm run reviewers\` executes the reviewer runner (exit ${reviewersRun.code})`, reviewersRun.out.trim().split("\n").slice(0, 3).join(" | "));
    const rRefresh = await briefRefreshCommand(researchTarget);
    check(rRefresh.resolves && rRefresh.cmd === "npm run derive", "research brief's refresh command is its npm derive script", rRefresh.detail);
    const packetOf = async () => JSON.parse(await fs.readFile(path.join(researchTarget, "derived", "boot-packet.json"), "utf8"));
    const briefOf = () => fs.readFile(path.join(researchTarget, "derived", "recovery-brief.md"), "utf8");
    const firstCommitLine = "derived before the first git commit";
    let packet = await packetOf();
    const rerunLine = (await briefOf()).includes(firstCommitLine);
    check(packet.as_of === "no-git" && rerunLine, "brief derived before any commit says to rerun after the first commit",
      `as_of=${packet.as_of}${packet.as_of === "no-git" ? "" : " (temp dir inside a git repo?)"}; rerun line ${rerunLine ? "present" : "missing"}`);
    check(/After the first commit, regenerate derived\/[^\n]*\n\s+npm run derive/.test(researchStamp.stdout),
      "stamp next steps say to regenerate derived/ after the first commit", researchStamp.stdout.trim().split("\n").slice(-4).join(" | "));
    check(packet.decisions.length === 0, "derived decisions list skips decisions/_TEMPLATE.md", JSON.stringify(packet.decisions));
    const sm = await import(pathToFileURL(path.join(BLUEPRINT_ROOT, "template", "tools", "lib", "stage-model.mjs")).href);
    const decisionsGate = () => sm.deriveStageStatus({ root: researchTarget }).stages.find((s) => s.id === 3).gates.find((g) => g.gate === "decisions");
    check(decisionsGate().state === "absent", "stage status: Stage 3 not started on a fresh research stamp", decisionsGate().evidence);
    // An ADR copied from the template keeps its commented frontmatter lines. It
    // must index under its own H1 and count toward Stage 3.
    const decisionTemplate = await fs.readFile(path.join(researchTarget, "decisions", "_TEMPLATE.md"), "utf8");
    await fs.writeFile(path.join(researchTarget, "decisions", "0001-smoke.md"),
      decisionTemplate.replace("adr: NNNN", "adr: 0001").replace(/^# ADR-NNNN — .*$/m, "# ADR-0001 — Smoke decision"));
    await npmRun("derive");
    packet = await packetOf();
    check(packet.decisions.length === 1 && packet.decisions[0].title === "ADR-0001 — Smoke decision",
      "an ADR copied from the template indexes under its own H1", JSON.stringify(packet.decisions));
    check(decisionsGate().state === "pass", "a real ADR passes Stage 3", decisionsGate().evidence);
    // The remedy the brief and next steps give: after the first commit, derive
    // records it. Hooks are off so a machine-wide commit hook cannot fire here.
    const git = (...args) => execFile("git", [
      "-c", "user.name=smoke", "-c", "user.email=smoke@example.invalid",
      "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args,
    ], { cwd: researchTarget });
    await git("init", "-q");
    await git("add", "-A");
    await git("commit", "-qm", "smoke: first commit");
    await npmRun("derive");
    packet = await packetOf();
    check(/^[0-9a-f]{7,}$/.test(packet.as_of) && !(await briefOf()).includes(firstCommitLine),
      "after the first commit, `npm run derive` records it and drops the rerun line", `as_of=${packet.as_of}`);
    const researchYmlPath = path.join(researchTarget, "blueprint.yml");
    const researchYml = await fs.readFile(researchYmlPath, "utf8");
    await fs.writeFile(researchYmlPath, researchYml.replace(/^variant: research$/m, "variant: research # routing regression"));
    const runner = await execFile(process.execPath, [path.join(researchTarget, "tools", "run-reviewers.mjs")], {
      cwd: researchTarget,
    }).catch((error) => ({ stdout: error.stdout || "", stderr: error.stderr || "" }));
    const runnerText = `${runner.stdout || ""}\n${runner.stderr || ""}`;
    if (/variant=research\b/.test(runnerText) && !/variant=greenfield\b/.test(runnerText)) {
      ok("research inline-comment scalar routes runner as research");
    } else {
      bad("research inline-comment scalar routes runner as research", runnerText.trim().split("\n").slice(0, 4).join(" | "));
    }
    const blockedTierTarget = path.join(tmp, "smoke-research-tier-2");
    await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-research-tier-2",
      "--variant=research",
      "--tier=2",
      `--target=${blockedTierTarget}`,
    ]).then(
      () => bad("research Tier 2 remains blocked", "stamp exited 0"),
      () => ok("research Tier 2 remains blocked"),
    );
    const reviewTarget = path.join(tmp, "smoke-research-review");
    await execFile(process.execPath, [
      STAMP,
      "--mode=stamp",
      "--name=smoke-research-review",
      "--variant=research",
      "--tier=1",
      "--portal-type=review",
      `--target=${reviewTarget}`,
    ]).then(
      () => bad("research initial stamp rejects Review Portal composition", "stamp exited 0"),
      () => ok("research initial stamp rejects Review Portal composition"),
    );
    if (await fs.stat(reviewTarget).catch(() => null)) {
      bad("rejected research Review Portal leaves no partial target", "target exists");
    } else {
      ok("rejected research Review Portal leaves no partial target");
    }
    const tierDoc = await fs.readFile(path.join(BLUEPRINT_ROOT, "docs", "portal-and-tier-ladder.md"), "utf8");
    const portalReadme = await fs.readFile(path.join(BLUEPRINT_ROOT, "template", "apps", "portal", "README.md"), "utf8");
    const consumerGuide = await fs.readFile(path.join(BLUEPRINT_ROOT, "template", "CLAUDE.md"), "utf8");
    if (/\| \*\*Research\*\* .* \*\*Blocked — choose the product variant/.test(tierDoc)) {
      ok("research Tier 2 documentation matches the runtime block");
    } else {
      bad("research Tier 2 documentation matches the runtime block", "matrix does not declare the block");
    }
    if (/--variant=greenfield\|midstream\|brownfield \\/.test(portalReadme)
      && !/--variant=[^\n]*research/.test(portalReadme)) {
      ok("Pattern A portal command excludes the portal-free research variant");
    } else {
      bad("Pattern A portal command excludes the portal-free research variant", "portal README advertises research");
    }
    if (
      /Research initial stamps are portal-free, so omit `--portal-type` and\s+`--pattern`/.test(consumerGuide)
      && /--variant=greenfield\|midstream\|brownfield \\\n\s+--tier=0\|1\|2 \\\n\s+--portal-type=initiative\|review\|bespoke/.test(consumerGuide)
      && /--variant=research \\\n\s+--tier=0\|1 \\\n\s+--target=/.test(consumerGuide)
    ) {
      ok("stamped consumer guide separates product portal flags from research init");
    } else {
      bad("stamped consumer guide separates product portal flags from research init", "explicit forms are contradictory");
    }
  } catch (err) {
    bad("research real stamp", (err.stderr || err.message).split("\n").slice(-3).join(" | "));
  }

  // 12 — the canonical convention and both shipped entry examples must expose
  // the same fields. Drift here made a consumer choose between incompatible
  // stamped instructions.
  try {
    const amendmentFiles = [
      path.join(BLUEPRINT_ROOT, "template", "docs", "methodology", "methodology-amendments-convention.md"),
      path.join(BLUEPRINT_ROOT, "template", "METHODOLOGY-AMENDMENTS.md"),
      path.join(BLUEPRINT_ROOT, "template", "methodology", "amendments", "METHODOLOGY-AMENDMENTS.template.md"),
    ];
    const expectedLines = [
      "**Trigger**: One sentence",
      "**Scope**: Per-initiative | Candidate for methodology promotion | Already promoted",
      "**Bucket**: consumer-local | template | reviewer | methodology",
      "**Status**: Active | Superseded by <YYYY-MM-DD entry> | Promoted to methodology",
      "**References**:",
    ];
    for (const file of amendmentFiles) {
      const text = await fs.readFile(file, "utf8");
      const missing = expectedLines.filter((line) => !text.includes(line));
      if (missing.length === 0) ok(`amendment entry shape: ${path.relative(BLUEPRINT_ROOT, file)}`);
      else bad(`amendment entry shape: ${path.relative(BLUEPRINT_ROOT, file)}`, `missing ${missing.join(" / ")}`);
    }
  } catch (err) {
    bad("amendment entry shape", err.message);
  }

  // 13 — decisions/11: Tier 0 is pre-portal for every variant. The stamper used
  // to copy a portal at Tier 0, where both portal reviewers skip it, and the
  // portal file then passed a prototype gate nobody worked for (decisions/11).
  const exists = (p) => fs.stat(p).then(() => true, () => false);
  const sm13 = await import(pathToFileURL(path.join(BLUEPRINT_ROOT, "template", "tools", "lib", "stage-model.mjs")).href);
  const encounter13 = await import(new URL("../lib/encounter-audit.mjs", import.meta.url).href);
  for (const [label, variant, portalType] of [
    ["greenfield Initiative Portal", "greenfield", "initiative"],
    ["brownfield Review Portal", "brownfield", "review"],
  ]) {
    const t0 = path.join(tmp, `smoke-tier0-${variant}`);
    try {
      const stamp0 = await execFile(process.execPath, [
        STAMP, "--mode=stamp", `--name=smoke-tier0-${variant}`, `--variant=${variant}`, "--tier=0", `--portal-type=${portalType}`, `--target=${t0}`,
      ]);
      check(/stamping pre-portal \(Tier 0\) scaffold/.test(stamp0.stdout), `Tier 0 ${label}: stamp names the pre-portal scaffold`, stamp0.stdout.split("\n")[0]);
      const portalDirs = [];
      for (const rel of ["apps/portal", "packages", "blueprint/portal", "portal"]) if (await exists(path.join(t0, rel))) portalDirs.push(rel);
      check(portalDirs.length === 0, `Tier 0 ${label}: no portal stamped`, portalDirs.join(", "));
      const absent = [];
      for (const rel of [".claude/agents/blueprint/reviewers", "tools/lib/portal-reviewer-routing.mjs", "tools/run-reviewers.mjs", "actor-output.yml", "reader-contract.json"]) {
        if (!(await exists(path.join(t0, rel)))) absent.push(rel);
      }
      check(absent.length === 0, `Tier 0 ${label}: imposition layer and contracts present`, `missing ${absent.join(", ")}`);
      const yml0 = await fs.readFile(path.join(t0, "blueprint.yml"), "utf8");
      check(/^tier: 0$/m.test(yml0) && new RegExp(`^portal_type: ${portalType}$`, "m").test(yml0) && /^pilot_profile_policy: required$/m.test(yml0),
        `Tier 0 ${label}: blueprint.yml keeps tier 0, the portal type for Tier 1, and the pilot-profile policy`);
      const pkg0 = JSON.parse(await fs.readFile(path.join(t0, "package.json"), "utf8"));
      check(!pkg0.workspaces && !pkg0.overrides && Object.keys(pkg0.scripts ?? {}).sort().join() === "derive,reviewers",
        `Tier 0 ${label}: package.json has derive + reviewers only`, JSON.stringify(pkg0));
      const missing0 = await missingScriptTargets(t0);
      check(missing0.length === 0, `Tier 0 ${label}: package.json scripts all point at stamped files`, missing0.join(", "));
      const derive0 = await execFile("npm", ["run", "--silent", "derive"], { cwd: t0 }).then(() => 0, (e) => e.code);
      check(derive0 === 0, `Tier 0 ${label}: \`npm run derive\` runs`, `exit ${derive0}`);
      const run0 = await runStampedReviewers(t0, { viaNpm: true });
      check(new RegExp(`variant=${variant}\\b`).test(run0.out) && run0.errors.length === 0,
        `Tier 0 ${label}: \`npm run reviewers\` runs with no reviewer ERRORs (exit ${run0.code})`,
        run0.errors.join(", ") || run0.out.trim().split("\n").slice(0, 2).join(" | "));
      const doc0 = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: t0 });
      check(run0.portal.length === 0 && doctorPortalReviewers(doc0).length === 0, `Tier 0 ${label}: runner and doctor both run no portal reviewer`,
        `runner [${run0.portal.join(", ")}] doctor [${doctorPortalReviewers(doc0).join(", ")}]`);
      const fails0 = doc0.checks.filter((c) => c.status === "fail");
      check(fails0.length === 0, `Tier 0 ${label}: full doctor has no fails (${doc0.status})`, fails0.map((c) => `${c.name}: ${c.detail}`).join(" | "));
      const reader0 = await encounter13.auditReaderContract({ targetDir: t0 });
      check(reader0.status !== "BLOCKED" && reader0.metadata.surfaces === 1, `Tier 0 ${label}: reader contract valid (${reader0.status})`,
        reader0.findings.map((f) => f.message).join(" | "));
      // Greenfield's portal-shell must not pass; brownfield's prototype stage is
      // optional, and an absent optional gate reads pass "(optional)" by design.
      const shell = sm13.deriveStageStatus({ root: t0 }).stages.flatMap((s) => s.gates).find((g) => /^(portal|prototype)-shell$/.test(g.gate));
      check(shell && (shell.state !== "pass" || /\(optional\)$/.test(shell.evidence)), `Tier 0 ${label}: no stamped file satisfies the prototype gate`,
        shell ? `${shell.gate}=${shell.state} — ${shell.evidence}` : "gate not found");
    } catch (err) {
      bad(`Tier 0 ${label} stamp`, (err.stderr || err.message).split("\n").slice(-3).join(" | "));
    }
  }

  // 13b — moving to Tier 1 re-runs the stamper at --tier=1. It adds the portal
  // and, because package.json and blueprint.yml are preserved, names both.
  try {
    const t0 = path.join(tmp, "smoke-tier0-greenfield");
    const restamp = await execFile(process.execPath, [
      STAMP, "--mode=stamp", "--name=smoke-tier0-greenfield", "--variant=greenfield", "--tier=1", "--portal-type=initiative", `--target=${t0}`,
    ]);
    check(await exists(path.join(t0, "apps", "portal", "package.json")), "Tier 0 → 1 re-stamp adds apps/portal");
    // The warning carries the keys to merge, from the stamper's own values.
    check(/WARNINGS[\s\S]*package\.json was preserved without npm workspaces[^\n]*"workspaces":\["apps\/\*","packages\/\*"\][^\n]*"overrides"/.test(restamp.stdout)
      && /blueprint\.yml was preserved with tier: 0, but this stamp ran with --tier=1/.test(restamp.stdout),
    "Tier 0 → 1 re-stamp warns about the preserved package.json (with the keys to add) and tier",
    restamp.stdout.split("\n").filter((l) => l.includes("!")).join(" | ") || "no warnings printed");
  } catch (err) {
    bad("Tier 0 → 1 re-stamp", (err.stderr || err.message).split("\n").slice(-3).join(" | "));
  }
  // The Review Portal path: it needs no workspaces, so only the tier warns, and
  // after the documented edit full doctor has no fails.
  try {
    const t0 = path.join(tmp, "smoke-tier0-brownfield");
    const restamp = await execFile(process.execPath, [
      STAMP, "--mode=stamp", "--name=smoke-tier0-brownfield", "--variant=brownfield", "--tier=1", "--portal-type=review", `--target=${t0}`,
    ]);
    check(await exists(path.join(t0, "blueprint", "portal", "index.html")), "Tier 0 → 1 Review Portal re-stamp adds blueprint/portal");
    check(/blueprint\.yml was preserved with tier: 0/.test(restamp.stdout) && !/package\.json was preserved without npm workspaces/.test(restamp.stdout),
      "Tier 0 → 1 Review Portal re-stamp warns about the tier only", restamp.stdout.split("\n").filter((l) => l.includes("!")).join(" | ") || "no warnings printed");
    const ymlPath = path.join(t0, "blueprint.yml");
    await fs.writeFile(ymlPath, (await fs.readFile(ymlPath, "utf8")).replace(/^tier: 0$/m, "tier: 1"));
    const doc1 = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: t0 });
    const fails1 = doc1.checks.filter((c) => c.status === "fail");
    check(fails1.length === 0 && doctorPortalReviewers(doc1).length === 2,
      `Tier 0 → 1 Review Portal: with tier: 1 set, doctor runs both portal reviewers and has no fails (${doc1.status})`,
      fails1.map((c) => `${c.name}: ${c.detail}`).join(" | ") || `portal reviewers [${doctorPortalReviewers(doc1).join(", ")}]`);
  } catch (err) {
    bad("Tier 0 → 1 Review Portal re-stamp", (err.stderr || err.message).split("\n").slice(-3).join(" | "));
  }

  // 13c — the logo belongs to a portal. Research + --logo used to exit 2 with
  // ENOENT on apps/portal/public after writing most of the scaffold.
  const logoFile = path.join(tmp, "smoke-logo.png");
  await fs.writeFile(logoFile, "not really a png");
  await execFile(process.execPath, [
    STAMP, "--mode=stamp", "--name=smoke-research-logo", "--variant=research", "--tier=0", `--logo=${logoFile}`, `--target=${path.join(tmp, "smoke-research-logo")}`,
  ]).then(
    (r) => check(/--logo \S+ \(no portal in this stamp/.test(r.stdout), "research stamp with --logo exits 0 and reports the logo skipped", r.stdout.split("\n").slice(-3).join(" | ")),
    (e) => bad("research stamp with --logo exits 0 and reports the logo skipped", (e.stderr || e.message).split("\n").slice(-2).join(" | ")),
  );

  // 13d — the doc and the stamper agree: Tier 0 is pre-portal, and the doc says
  // how to move to Tier 1.
  const ladder = await fs.readFile(path.join(BLUEPRINT_ROOT, "docs", "portal-and-tier-ladder.md"), "utf8");
  check(/\*\*No portal yet\.\*\*/.test(ladder) && /\| \*\*Brownfield\*\* \| Doc-only audit, no portal needed/.test(ladder)
    && /^### Moving from Tier 0 to Tier 1$/m.test(ladder),
  "tier-ladder doc: Tier 0 is pre-portal, as stamped, and it explains moving to Tier 1");
} finally {
  await fs.rm(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nSMOKE FAIL — ${failures.length} check(s) failed. A stamped consumer would hit these on day one.`);
  process.exit(1);
}
console.log("\nsmoke green — the stamper's output passes the stamper's gates");
