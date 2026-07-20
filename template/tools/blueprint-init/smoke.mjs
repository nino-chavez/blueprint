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
 *   6. Stamped Pattern B tree → FULL doctor; both conformance reviewers executed
 *   7. Pattern A REAL stamp → exit 0, policy line + portal shell present
 *   8. Pilot-gate integration: fresh stamp blocks advance; populated profile passes
 *   9. chat-widget deriveChatMeta: zero/custom/absent manifest cases
 *  10. ADR-0010: readiness census + intent-gated prep-deploy + verified promotion + chat default-off
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

  // 6 — the stamped Pattern B tree passes FULL doctor, and both Pattern B
  // conformance reviewers demonstrably EXECUTED (wave 86 — doctor used to key
  // conformance on apps/portal existing, so Pattern B trees were never
  // doctor-covered; a skipped reviewer must read as a failure here, not green).
  try {
    const { runDoctor } = await import(pathToFileURL(path.join(BLUEPRINT_ROOT, "template", "tools", "lib", "doctor.mjs")).href);
    const doc = await runDoctor({ home: BLUEPRINT_ROOT, targetDir: target });
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
  if (await fs.stat(path.join(aTarget, "apps", "portal", "package.json")).catch(() => null)) ok("Pattern A portal shell present");
  else bad("Pattern A portal shell present", "apps/portal/package.json missing");

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
} finally {
  await fs.rm(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nSMOKE FAIL — ${failures.length} check(s) failed. A stamped consumer would hit these on day one.`);
  process.exit(1);
}
console.log("\nsmoke green — the stamper's output passes the stamper's gates");
