// bootstrap.mjs — `blueprint hive setup --slug=<x>`, the keystone the manual
// BOOTSTRAP.md (18 steps) collapses into one command. Stands up a fresh Hive
// coordination instance: a Cloudflare D1 + Worker + Pages dashboard derived from
// an ai-hive kit the operator has already vendored (subtree/clone). This is the
// "run" rung of crawl → walk → run (docs/team-roles-and-conventions.md) — only
// worth running when contention is real and the litmus is met.
//
// Shape mirrors the six libs under tools/lib/: dependency-free (node: builtins
// only — child_process / fs / crypto / path), a pure declarative PLANNER
// (buildPlan, fully testable offline) split from a side-effecting EXECUTOR
// (bootstrap with execute:true), and a `--self-test` block. It NEVER throws —
// every failure degrades to {ok:false, ...} so the CLI controls the exit code.
//
// terraform-plan discipline (same as upgrade.mjs): DEFAULT is a dry-run plan that
// prints every exact command + file patch without touching live, billable CF
// infra. The operator reviews the plan, then re-runs with execute:true. This also
// keeps the planner verifiable on a degraded network — only the execute path
// needs CF creds + clean egress.
//
// Integrate, not absorb (the ai-hive charter seam): this script does NOT vendor
// the kit. It operates against --hive-dir (the operator's .hive/ subtree or a
// cloned <slug>-hive), locating apps/mcp-server + apps/dashboard within it.
//
// Three steps stay MANUAL by nature (browser/judgment) and live in BOOTSTRAP.md,
// not here: `wrangler login` (one-time OAuth), creating the CF API token with the
// right scopes, and the in-Claude-Code `hive_create_project` MCP call. The script
// checks the login precondition and prints the other two in its summary.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';

// Node floor for the kit's wrangler/astro toolchain. 22 is recommended; 20 is the
// LTS floor we refuse below.
const MIN_NODE_MAJOR = 20;
// Default wrangler invocation. The kit installs wrangler as a devDep in
// apps/mcp-server (BOOTSTRAP step 4 `npm install`), so `npx wrangler` resolves
// there. Stored as argv (no shell) — overridable for tests.
const DEFAULT_WRANGLER = ['npx', 'wrangler'];

// ── pure helpers (no IO — the self-test's bread and butter) ──────────────────

/** A Hive slug names the Worker / D1 / Pages project; CF resource names are
 *  lowercase alphanumeric + dashes. Reject anything that would produce an
 *  invalid resource name rather than fail deep inside wrangler. */
export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return { ok: false, reason: 'slug is required (e.g. --slug=acme-hive)' };
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) {
    return { ok: false, reason: `slug "${slug}" must be lowercase alphanumeric + dashes, 3–40 chars, no leading/trailing dash` };
  }
  return { ok: true };
}

/** Resolve ${token} against ctx; an unresolved token renders visibly (never a
 *  silent empty string) so a half-materialized command is obvious in the plan. */
export function resolveTemplate(tpl, ctx) {
  return String(tpl).replace(/\$\{(\w+)\}/g, (_, k) => (ctx[k] != null ? String(ctx[k]) : `<unresolved:${k}>`));
}

/** Pull the D1 database_id out of `wrangler d1 create` (TOML block) or
 *  `wrangler d1 list --json` output. Returns the uuid or null. */
export function parseDatabaseId(text) {
  // Matches both the `wrangler d1 create` TOML line (database_id = "uuid") and
  // the `d1 list --json` form ("database_id": "uuid") — note the optional closing
  // quote of the JSON key before the colon.
  const m = /database_id"?\s*[:=]\s*"?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(String(text || ''));
  return m ? m[1] : null;
}

/** Find a named D1 db's id in `wrangler d1 list --json` (array of {name,uuid}). */
export function findD1Id(listText, name) {
  try {
    const arr = JSON.parse(listText);
    const hit = Array.isArray(arr) && arr.find((d) => d && (d.name === name || d.database_name === name));
    return hit ? (hit.uuid || hit.database_id || null) : null;
  } catch {
    // Non-JSON (older wrangler text table): fall back to a line scan.
    const line = String(listText || '').split('\n').find((l) => l.includes(name));
    return line ? (parseDatabaseId(line) || null) : null;
  }
}

/** Parse the Worker URL wrangler prints on deploy → {url, name, subdomain}. */
export function parseWorkerUrl(text) {
  const m = /(https:\/\/([a-z0-9-]+)\.([a-z0-9-]+)\.workers\.dev)/i.exec(String(text || ''));
  return m ? { url: m[1], name: m[2], subdomain: m[3] } : null;
}

/** Parse the Pages deployment URL → the canonical project URL string. */
export function parsePagesUrl(text) {
  const all = String(text || '').match(/https:\/\/[a-z0-9-]+\.pages\.dev/gi) || [];
  // Prefer the bare project URL (<project>.pages.dev) over a per-deploy hash URL
  // (<hash>.<project>.pages.dev) when both appear.
  const bare = all.find((u) => u.split('.').length === 3);
  return bare || all[0] || null;
}

/** Locate the kit's apps within --hive-dir. Returns absolute paths + ok/reasons. */
export function resolveHiveLayout(hiveDir) {
  const root = resolve(hiveDir);
  const mcpDir = join(root, 'apps', 'mcp-server');
  const dashDir = join(root, 'apps', 'dashboard');
  const wranglerToml = join(mcpDir, 'wrangler.toml');
  const migrationsDir = join(mcpDir, 'migrations');
  const appJs = join(dashDir, 'app.js');
  const reasons = [];
  if (!existsSync(root)) reasons.push(`--hive-dir not found: ${root}`);
  if (!existsSync(wranglerToml)) reasons.push(`missing apps/mcp-server/wrangler.toml under ${root}`);
  if (!existsSync(migrationsDir)) reasons.push(`missing apps/mcp-server/migrations/ under ${root}`);
  if (!existsSync(appJs)) reasons.push(`missing apps/dashboard/app.js under ${root}`);
  return { ok: reasons.length === 0, root, mcpDir, dashDir, wranglerToml, migrationsDir, appJs, reasons };
}

// ── the planner (pure, declarative, fully testable) ──────────────────────────

const patchStep = (id, title, file, edits) => ({ id, kind: 'patch', title, file, edits });
const execStep = (id, title, bin, args, extra = {}) => ({ id, kind: 'exec', title, cmd: { bin, args }, ...extra });

/**
 * Build the ordered bootstrap plan. Pure: no IO, no side effects. Tokens that are
 * only known at run time (${databaseId}, ${workerUrl}, ${cfSubdomain}, ${bearer})
 * stay as literal templates the executor resolves against a growing ctx; the two
 * known-at-plan-time values (${slug}, ${cfAccountId}) appear pre-resolvable.
 */
export function buildPlan(opts) {
  const { slug, mcpDir, dashDir, wranglerToml, appJs, wrangler = DEFAULT_WRANGLER } = opts;
  const wbin = wrangler[0];
  const wpre = wrangler.slice(1);
  const wr = (id, title, args, extra) => execStep(id, title, wbin, [...wpre, ...args], extra);

  const steps = [];

  // — preconditions —
  steps.push({ id: 'check-deps', kind: 'check', title: `Verify deps: gh, npm, node ≥${MIN_NODE_MAJOR}, and wrangler resolvable in apps/mcp-server` });
  steps.push({ id: 'check-login', kind: 'check', title: 'Verify `wrangler whoami` (you ran `wrangler login` — a one-time browser OAuth)', cwd: mcpDir });
  steps.push({ id: 'check-hive-dir', kind: 'check', title: 'Verify the ai-hive kit layout (apps/mcp-server + apps/dashboard)' });

  // — D1 —
  steps.push(wr('d1-create', `Create D1 database ${slug}-d1 (idempotent: reuse if it exists), capture database_id`,
    ['d1', 'create', `${slug}-d1`], { cwd: mcpDir, captures: 'databaseId', idempotent: true }));

  steps.push(patchStep('patch-wrangler-toml', 'Patch apps/mcp-server/wrangler.toml (name, account_id, D1 name + id)', wranglerToml, [
    { label: 'name', find: /^name\s*=\s*.*$/m, replace: 'name = "${slug}-mcp"' },
    { label: 'account_id', find: /^account_id\s*=\s*.*$/m, replace: 'account_id = "${cfAccountId}"' },
    { label: 'database_name', find: /^database_name\s*=\s*.*$/m, replace: 'database_name = "${slug}-d1"' },
    { label: 'database_id', find: /^database_id\s*=\s*.*$/m, replace: 'database_id = "${databaseId}"' },
  ]));

  steps.push(patchStep('patch-mcp-workflow', 'Patch .github/workflows/deploy-mcp-server.yml (remote migrations DB name)',
    join(opts.hiveRoot, '.github', 'workflows', 'deploy-mcp-server.yml'), [
      { label: 'migrations-db', find: /migrations\s+apply\s+\S+/g, replace: 'migrations apply ${slug}-d1' },
    ], ));

  steps.push(wr('d1-migrate-local', 'Apply migrations locally (for `wrangler dev`)',
    ['d1', 'migrations', 'apply', `${slug}-d1`, '--local'], { cwd: mcpDir }));
  steps.push(wr('d1-migrate-remote', 'Apply migrations to the production D1',
    ['d1', 'migrations', 'apply', `${slug}-d1`, '--remote'], { cwd: mcpDir }));

  // — secrets —
  steps.push(wr('secret-bearer', 'Generate a strong bearer (crypto.randomBytes) and set it as the HIVE_AUTH_TOKEN Worker secret',
    ['secret', 'put', 'HIVE_AUTH_TOKEN'], { cwd: mcpDir, generatesBearer: true }));
  steps.push({ id: 'secret-github', kind: 'exec-optional', title: 'Optional: set GITHUB_TOKEN Worker secret (enables auto-created GitHub issues) — only if --github-token given',
    cmd: { bin: wbin, args: [...wpre, 'secret', 'put', 'GITHUB_TOKEN'] }, cwd: mcpDir, needs: 'githubToken' });

  // — Worker deploy —
  steps.push(wr('worker-deploy', 'Deploy the Worker, capture its URL + CF subdomain',
    ['deploy'], { cwd: mcpDir, captures: 'workerUrl' }));

  // — dashboard wiring (needs the subdomain captured above) —
  steps.push(patchStep('patch-dashboard-appjs', 'Point the dashboard app.js at the new Worker host',
    appJs, [
      { label: 'mcp-host', find: /[a-z0-9-]+-mcp\.[a-z0-9-]+\.workers\.dev/g, replace: '${slug}-mcp.${cfSubdomain}.workers.dev' },
    ]));
  steps.push(patchStep('patch-redeploy', 'Point the dashboard redeploy.sh at the new Pages project (if present)',
    join(dashDir, 'redeploy.sh'), [
      { label: 'pages-project', find: /[a-z0-9-]+-dashboard/g, replace: '${slug}-dashboard' },
    ], ));
  steps.push(patchStep('patch-dashboard-workflow', 'Patch .github/workflows/deploy-dashboard.yml (Pages project name)',
    join(opts.hiveRoot, '.github', 'workflows', 'deploy-dashboard.yml'), [
      { label: 'pages-project', find: /--project-name=\S+/g, replace: '--project-name=${slug}-dashboard' },
    ], ));

  // — Pages —
  steps.push(wr('pages-create', `Create the Pages project ${slug}-dashboard (idempotent)`,
    ['pages', 'project', 'create', `${slug}-dashboard`, '--production-branch=main'],
    { cwd: mcpDir, env: { CLOUDFLARE_ACCOUNT_ID: '${cfAccountId}' }, idempotent: true }));
  steps.push(wr('pages-deploy', 'Deploy the dashboard to Pages, capture its URL',
    ['pages', 'deploy', dashDir, `--project-name=${slug}-dashboard`, '--branch=main', '--commit-dirty=true'],
    { cwd: mcpDir, env: { CLOUDFLARE_ACCOUNT_ID: '${cfAccountId}' }, captures: 'dashboardUrl' }));

  // — GitHub Actions auto-deploy secrets (token itself is created in the browser) —
  steps.push({ id: 'gh-secret-cf', kind: 'exec-optional', title: 'Set CF_API_TOKEN + CF_ACCOUNT_ID as GitHub repo secrets (auto-deploy) — only if --cf-api-token given',
    needs: 'cfApiToken', ghSecrets: true });

  // — terminal summary (manual handoff: hive_create_project + the MCP add line) —
  steps.push({ id: 'summary', kind: 'summary', title: 'Print the team handoff: Worker URL, dashboard URL, one-time bearer, MCP add line, hive_create_project prompt' });

  return { slug, hiveRoot: opts.hiveRoot, mcpDir, dashDir, steps };
}

// ── the executor (side-effecting; only on execute:true) ──────────────────────

function runCmd(bin, args, { cwd, input, env } = {}) {
  const r = spawnSync(bin, args, {
    cwd,
    input,
    encoding: 'utf8',
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (r.error) return { ok: false, status: null, stdout: '', stderr: String(r.error.message || r.error) };
  const stdout = r.stdout || '';
  const stderr = r.stderr || '';
  return { ok: r.status === 0, status: r.status, stdout, stderr };
}

function applyPatch(file, edits, ctx) {
  if (!existsSync(file)) return { ok: true, skipped: true, reason: `${file} absent — skipped` };
  let text = readFileSync(file, 'utf8');
  const applied = [];
  for (const e of edits) {
    const replacement = resolveTemplate(e.replace, ctx);
    if (replacement.includes('<unresolved:')) return { ok: false, reason: `patch ${e.label}: ${replacement}` };
    if (!e.find.test(text)) { applied.push(`${e.label}: no match (left as-is)`); continue; }
    // Reset lastIndex for /g regexes reused across .test/.replace.
    e.find.lastIndex = 0;
    text = text.replace(e.find, replacement);
    e.find.lastIndex = 0;
    applied.push(`${e.label} → ${replacement}`);
  }
  writeFileSync(file, text);
  return { ok: true, applied };
}

async function executeStep(step, ctx, layout, opts) {
  const wbin = (opts.wrangler || DEFAULT_WRANGLER)[0];
  const wpre = (opts.wrangler || DEFAULT_WRANGLER).slice(1);

  switch (step.id) {
    case 'check-deps': {
      for (const dep of ['gh', 'npm']) {
        const r = runCmd(dep, ['--version']);
        if (!r.ok) return { ok: false, error: `dependency '${dep}' not found on PATH (${r.stderr.trim() || 'not installed'})` };
      }
      const major = Number(process.versions.node.split('.')[0]);
      if (major < MIN_NODE_MAJOR) return { ok: false, error: `node ${process.versions.node} < ${MIN_NODE_MAJOR} (the kit's toolchain floor)` };
      const wv = runCmd(wbin, [...wpre, '--version'], { cwd: layout.mcpDir });
      if (!wv.ok) return { ok: false, error: `wrangler not resolvable in ${layout.mcpDir} — run \`npm install\` there first (${wv.stderr.trim()})` };
      return { ok: true, note: `gh ✓  npm ✓  node ${process.versions.node} ✓  wrangler ${wv.stdout.trim() || '✓'}` };
    }
    case 'check-login': {
      const r = runCmd(wbin, [...wpre, 'whoami'], { cwd: layout.mcpDir });
      if (!r.ok) return { ok: false, error: `\`wrangler whoami\` failed — run \`wrangler login\` (one-time browser OAuth) first.\n${r.stderr.trim()}` };
      return { ok: true, note: (r.stdout.match(/[^\n]*account[^\n]*/i) || [r.stdout.trim().split('\n')[0]])[0] };
    }
    case 'check-hive-dir':
      return layout.ok ? { ok: true } : { ok: false, error: `hive kit incomplete:\n  - ${layout.reasons.join('\n  - ')}` };

    case 'd1-create': {
      // Idempotent: reuse an existing db rather than failing on re-run.
      const list = runCmd(wbin, [...wpre, 'd1', 'list', '--json'], { cwd: layout.mcpDir });
      const existing = list.ok ? findD1Id(list.stdout, `${ctx.slug}-d1`) : null;
      if (existing) { ctx.databaseId = existing; return { ok: true, note: `reused existing ${ctx.slug}-d1 (${existing})` }; }
      const r = runCmd(wbin, [...wpre, 'd1', 'create', `${ctx.slug}-d1`], { cwd: layout.mcpDir });
      if (!r.ok) return { ok: false, error: `d1 create failed:\n${r.stderr.trim() || r.stdout.trim()}` };
      const id = parseDatabaseId(r.stdout) || parseDatabaseId(r.stderr);
      if (!id) return { ok: false, error: `d1 created but could not parse database_id from output:\n${r.stdout.trim()}` };
      ctx.databaseId = id;
      return { ok: true, note: `created ${ctx.slug}-d1 (${id})` };
    }

    case 'd1-migrate-local':
    case 'd1-migrate-remote': {
      const flag = step.id.endsWith('local') ? '--local' : '--remote';
      const r = runCmd(wbin, [...wpre, 'd1', 'migrations', 'apply', `${ctx.slug}-d1`, flag], { cwd: layout.mcpDir });
      if (!r.ok) return { ok: false, error: `migrations apply ${flag} failed:\n${r.stderr.trim() || r.stdout.trim()}` };
      return { ok: true };
    }

    case 'secret-bearer': {
      ctx.bearer = randomBytes(24).toString('hex'); // 48 hex chars — parity with `openssl rand -hex 24`
      const r = runCmd(wbin, [...wpre, 'secret', 'put', 'HIVE_AUTH_TOKEN'], { cwd: layout.mcpDir, input: ctx.bearer });
      if (!r.ok) return { ok: false, error: `secret put HIVE_AUTH_TOKEN failed:\n${r.stderr.trim()}` };
      return { ok: true, note: 'bearer generated + set (printed once in the summary)' };
    }
    case 'secret-github': {
      if (!opts.githubToken) return { ok: true, skipped: true, note: 'no --github-token — GitHub issue creation stays optional' };
      const r = runCmd(wbin, [...wpre, 'secret', 'put', 'GITHUB_TOKEN'], { cwd: layout.mcpDir, input: opts.githubToken });
      if (!r.ok) return { ok: false, error: `secret put GITHUB_TOKEN failed:\n${r.stderr.trim()}` };
      return { ok: true, note: 'GITHUB_TOKEN set' };
    }

    case 'worker-deploy': {
      const r = runCmd(wbin, [...wpre, 'deploy'], { cwd: layout.mcpDir });
      if (!r.ok) return { ok: false, error: `wrangler deploy failed:\n${r.stderr.trim() || r.stdout.trim()}` };
      const parsed = parseWorkerUrl(r.stdout) || parseWorkerUrl(r.stderr);
      if (!parsed) return { ok: false, error: `Worker deployed but no workers.dev URL found in output:\n${r.stdout.trim()}` };
      ctx.workerUrl = parsed.url;
      ctx.cfSubdomain = parsed.subdomain;
      return { ok: true, note: parsed.url };
    }

    case 'patch-wrangler-toml':
    case 'patch-mcp-workflow':
    case 'patch-dashboard-appjs':
    case 'patch-redeploy':
    case 'patch-dashboard-workflow': {
      const res = applyPatch(step.file, step.edits, ctx);
      if (!res.ok) return { ok: false, error: res.reason };
      if (res.skipped) return { ok: true, skipped: true, note: res.reason };
      return { ok: true, note: res.applied.join('; ') };
    }

    case 'pages-create': {
      const r = runCmd(wbin, [...wpre, 'pages', 'project', 'create', `${ctx.slug}-dashboard`, '--production-branch=main'],
        { cwd: layout.mcpDir, env: { CLOUDFLARE_ACCOUNT_ID: ctx.cfAccountId } });
      // Idempotent: a project that already exists is not a failure.
      if (!r.ok && /already exists|already in use/i.test(r.stderr + r.stdout)) return { ok: true, note: `${ctx.slug}-dashboard already exists — reused` };
      if (!r.ok) return { ok: false, error: `pages project create failed:\n${r.stderr.trim() || r.stdout.trim()}` };
      return { ok: true, note: `created ${ctx.slug}-dashboard` };
    }
    case 'pages-deploy': {
      const r = runCmd(wbin, [...wpre, 'pages', 'deploy', layout.dashDir, `--project-name=${ctx.slug}-dashboard`, '--branch=main', '--commit-dirty=true'],
        { cwd: layout.mcpDir, env: { CLOUDFLARE_ACCOUNT_ID: ctx.cfAccountId } });
      if (!r.ok) return { ok: false, error: `pages deploy failed:\n${r.stderr.trim() || r.stdout.trim()}` };
      ctx.dashboardUrl = parsePagesUrl(r.stdout) || parsePagesUrl(r.stderr) || `https://${ctx.slug}-dashboard.pages.dev`;
      return { ok: true, note: ctx.dashboardUrl };
    }

    case 'gh-secret-cf': {
      if (!opts.cfApiToken) return { ok: true, skipped: true, note: 'no --cf-api-token — set CF_API_TOKEN + CF_ACCOUNT_ID by hand (see BOOTSTRAP.md step "GitHub Actions")' };
      const repoArgs = opts.ghRepo ? ['--repo', opts.ghRepo] : [];
      const ghCwd = opts.ghRepo ? undefined : layout.root;
      const a = runCmd('gh', ['secret', 'set', 'CF_API_TOKEN', ...repoArgs], { cwd: ghCwd, input: opts.cfApiToken });
      if (!a.ok) return { ok: false, error: `gh secret set CF_API_TOKEN failed:\n${a.stderr.trim()}` };
      const b = runCmd('gh', ['secret', 'set', 'CF_ACCOUNT_ID', ...repoArgs], { cwd: ghCwd, input: ctx.cfAccountId });
      if (!b.ok) return { ok: false, error: `gh secret set CF_ACCOUNT_ID failed:\n${b.stderr.trim()}` };
      return { ok: true, note: 'CF_API_TOKEN + CF_ACCOUNT_ID set as repo secrets' };
    }

    case 'summary':
      return { ok: true };

    default:
      return { ok: false, error: `unknown step '${step.id}'` };
  }
}

function buildSummary(ctx, opts) {
  const worker = ctx.workerUrl || `https://${ctx.slug}-mcp.<subdomain>.workers.dev`;
  const dash = ctx.dashboardUrl || `https://${ctx.slug}-dashboard.pages.dev`;
  const lines = [];
  lines.push('');
  lines.push('━━━ Hive is up ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`  Worker (MCP):  ${worker}`);
  lines.push(`  Dashboard:     ${dash}`);
  if (ctx.bearer) {
    lines.push('');
    lines.push('  Bearer token (shown ONCE — store in 1Password, DM to teammates, never a channel):');
    lines.push(`    ${ctx.bearer}`);
  }
  lines.push('');
  lines.push('  Register Claude Code with this Hive (single line — give to each teammate):');
  lines.push(`    claude mcp add --transport http hive ${worker}/api/mcp --header "Authorization: Bearer ${ctx.bearer || '<BEARER>'}"`);
  lines.push('');
  lines.push('  Then (in Claude Code, by the lead) create the first project — the one MANUAL MCP step:');
  lines.push('    Use hive_create_project with name "<Team> — <concept>",');
  lines.push(`      github_repo "<your-org>/<repo>", default_branch "main". Report the project_id.`);
  if (!opts.cfApiToken) {
    lines.push('');
    lines.push('  STILL MANUAL — GitHub Actions auto-deploy:');
    lines.push('    Create a CF API token (Workers Scripts + D1 + Pages: Edit) at');
    lines.push('    https://dash.cloudflare.com/profile/api-tokens, then re-run with --cf-api-token=<token>');
    lines.push('    (or `gh secret set CF_API_TOKEN` + `gh secret set CF_ACCOUNT_ID` by hand).');
  }
  lines.push('');
  lines.push('  Hand the team docs/team-roles-and-conventions.md + the kit ONBOARDING.md.');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

function printPlan(plan, layout, opts, log) {
  // Seed the print ctx with the two known-at-plan-time values plus friendly
  // labels for the five run-time captures, so the plan reads ‹databaseId›
  // rather than the executor's <unresolved:…> sentinel.
  const ctx = { slug: plan.slug, cfAccountId: opts.cfAccountId };
  for (const cap of ['databaseId', 'workerUrl', 'cfSubdomain', 'dashboardUrl', 'bearer']) ctx[cap] = `‹${cap}›`;
  log(`blueprint hive setup — PLAN (dry-run; re-run with --execute to apply)\n`);
  log(`  slug:        ${plan.slug}   →  Worker ${plan.slug}-mcp · D1 ${plan.slug}-d1 · Pages ${plan.slug}-dashboard`);
  log(`  hive kit:    ${plan.hiveRoot}${layout.ok ? '' : '   ⚠ ' + layout.reasons.join('; ')}`);
  log(`  CF account:  ${opts.cfAccountId || '⚠ missing — pass --cf-account-id=<id>'}`);
  log('');
  let n = 0;
  for (const step of plan.steps) {
    n += 1;
    const optional = step.kind === 'exec-optional';
    const tag = optional ? ' (optional)' : '';
    log(`  ${String(n).padStart(2)}. ${step.title}${tag}`);
    if (step.kind === 'exec' || step.kind === 'exec-optional') {
      if (step.cmd) {
        const args = step.cmd.args.map((a) => resolveTemplate(a, ctx)).join(' ');
        const envp = step.env ? Object.entries(step.env).map(([k, v]) => `${k}=${resolveTemplate(v, ctx)} `).join('') : '';
        log(`        $ ${envp}${step.cmd.bin} ${args}${step.cwd ? `   (in ${step.cwd.replace(plan.hiveRoot, '.')})` : ''}`);
      } else if (step.ghSecrets) {
        log('        $ gh secret set CF_API_TOKEN   ·   gh secret set CF_ACCOUNT_ID');
      }
    } else if (step.kind === 'patch') {
      log(`        patch ${step.file.replace(plan.hiveRoot, '.')}`);
      for (const e of step.edits) log(`          ${e.label}: ${resolveTemplate(e.replace, ctx)}`);
    }
  }
  log('');
  log('  Captured at execute time: databaseId, workerUrl, cfSubdomain, dashboardUrl, bearer.');
  log('  Manual (not scripted — see BOOTSTRAP.md): wrangler login, CF API-token creation, hive_create_project.');
}

/**
 * Orchestrate the bootstrap. Default (execute:false) prints the plan and returns
 * without side effects. execute:true runs each step in order, threading a ctx of
 * captured values, stopping at the first failure. Never throws.
 *
 * @returns {Promise<{ok:boolean, planned?:boolean, executed?:boolean, ctx?:object, failedStep?:string, error?:string, warnings?:string[]}>}
 */
export async function bootstrap(opts) {
  const log = opts.logger || console.log;
  const v = validateSlug(opts.slug);
  if (!v.ok) return { ok: false, error: v.reason };
  if (!opts.cfAccountId) return { ok: false, error: 'CF account id required — pass --cf-account-id=<id> (find it in the Cloudflare dashboard sidebar)' };

  const hiveRoot = resolve(opts.hiveDir);
  const layout = resolveHiveLayout(hiveRoot);
  const plan = buildPlan({
    slug: opts.slug, cfAccountId: opts.cfAccountId, hiveRoot,
    mcpDir: layout.mcpDir, dashDir: layout.dashDir, wranglerToml: layout.wranglerToml, appJs: layout.appJs,
    wrangler: opts.wrangler,
  });

  if (!opts.execute) {
    printPlan(plan, layout, opts, log);
    return { ok: true, planned: true, warnings: layout.ok ? [] : layout.reasons };
  }

  if (!layout.ok) return { ok: false, error: `hive kit not found/complete:\n  - ${layout.reasons.join('\n  - ')}` };

  const ctx = { slug: opts.slug, cfAccountId: opts.cfAccountId };
  log(`blueprint hive setup — EXECUTE  (${opts.slug} → ${hiveRoot})\n`);
  let n = 0;
  for (const step of plan.steps) {
    n += 1;
    if (step.id === 'summary') { log(buildSummary(ctx, opts)); continue; }
    process.stdout.write && log(`  ${String(n).padStart(2)}. ${step.title}`);
    const r = await executeStep(step, ctx, layout, opts);
    if (!r.ok) {
      log(`      ✗ ${r.error}`);
      log(`\nstopped at step ${n} (${step.id}). Fix the above and re-run — completed steps are idempotent (D1/Pages reuse, patches re-match).`);
      return { ok: false, executed: true, failedStep: step.id, error: r.error, ctx };
    }
    if (r.skipped) log(`      · ${r.note || 'skipped'}`);
    else if (r.note) log(`      ✓ ${r.note}`);
    else log('      ✓');
  }
  return { ok: true, executed: true, ctx };
}

// ── self-test (node bootstrap.mjs --self-test) ───────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--self-test')) {
  const assert = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); } };
  let n = 0; const ok = (c, m) => { n += 1; assert(c, m); };

  // validateSlug
  ok(validateSlug('acme-hive').ok, 'valid slug accepted');
  ok(!validateSlug('Acme_Hive').ok, 'uppercase/underscore rejected');
  ok(!validateSlug('-x').ok, 'leading dash rejected');
  ok(!validateSlug('').ok, 'empty rejected');

  // resolveTemplate
  ok(resolveTemplate('${slug}-d1', { slug: 'acme' }) === 'acme-d1', 'template resolves known token');
  ok(resolveTemplate('${slug}.${x}', { slug: 'a' }) === 'a.<unresolved:x>', 'unresolved token renders visibly');

  // parsers
  ok(parseDatabaseId('database_id = "d90f1911-f72c-422d-a7d1-d8261c8223cc"') === 'd90f1911-f72c-422d-a7d1-d8261c8223cc', 'parseDatabaseId (toml)');
  ok(parseDatabaseId('"database_id": "4247d9f4-0557-4633-a93f-645835c2c3a1"') === '4247d9f4-0557-4633-a93f-645835c2c3a1', 'parseDatabaseId (json)');
  ok(parseDatabaseId('no id here') === null, 'parseDatabaseId none → null');
  ok(findD1Id('[{"name":"acme-d1","uuid":"d90f1911-f72c-422d-a7d1-d8261c8223cc"}]', 'acme-d1') === 'd90f1911-f72c-422d-a7d1-d8261c8223cc', 'findD1Id json');
  ok(findD1Id('[{"name":"other-d1","uuid":"xxxx"}]', 'acme-d1') === null, 'findD1Id miss → null');
  const wu = parseWorkerUrl('Published acme-mcp (1.2s)\n  https://acme-mcp.example-account.workers.dev');
  ok(wu && wu.url === 'https://acme-mcp.example-account.workers.dev' && wu.subdomain === 'example-account', 'parseWorkerUrl url+subdomain');
  ok(parseWorkerUrl('no url') === null, 'parseWorkerUrl none → null');
  ok(parsePagesUrl('Deployment: https://acme-dashboard.pages.dev') === 'https://acme-dashboard.pages.dev', 'parsePagesUrl bare');
  ok(parsePagesUrl('https://abc123.acme-dashboard.pages.dev preview\nhttps://acme-dashboard.pages.dev') === 'https://acme-dashboard.pages.dev', 'parsePagesUrl prefers bare project url');

  // buildPlan — pure, complete, parameterized
  const plan = buildPlan({ slug: 'acme-hive', cfAccountId: 'acct123', hiveRoot: '/tmp/kit', mcpDir: '/tmp/kit/apps/mcp-server', dashDir: '/tmp/kit/apps/dashboard', wranglerToml: '/tmp/kit/apps/mcp-server/wrangler.toml', appJs: '/tmp/kit/apps/dashboard/app.js' });
  const ids = plan.steps.map((s) => s.id);
  const expected = ['check-deps', 'check-login', 'check-hive-dir', 'd1-create', 'patch-wrangler-toml', 'patch-mcp-workflow', 'd1-migrate-local', 'd1-migrate-remote', 'secret-bearer', 'secret-github', 'worker-deploy', 'patch-dashboard-appjs', 'patch-redeploy', 'patch-dashboard-workflow', 'pages-create', 'pages-deploy', 'gh-secret-cf', 'summary'];
  ok(JSON.stringify(ids) === JSON.stringify(expected), `plan step order (${ids.join(',')})`);
  ok(plan.steps.find((s) => s.id === 'd1-create').cmd.args.includes('acme-hive-d1'), 'slug substituted into d1 create args');
  const pw = plan.steps.find((s) => s.id === 'patch-wrangler-toml');
  ok(pw.edits.length === 4 && pw.edits.every((e) => e.find instanceof RegExp && typeof e.replace === 'string'), 'wrangler.toml patch has 4 RegExp/string edits');
  ok(resolveTemplate(pw.edits.find((e) => e.label === 'database_id').replace, { databaseId: 'UUID' }) === 'database_id = "UUID"', 'patch replace interpolates a captured token');
  // every captured token referenced by a later patch is produced by an earlier exec step
  const captures = new Set(plan.steps.filter((s) => s.captures).map((s) => s.captures));
  ok(captures.has('databaseId') && captures.has('workerUrl'), 'plan declares databaseId + workerUrl captures');

  // bootstrap dry-run — no IO side effects, flags a missing kit as a warning, still plans
  const out = [];
  const r1 = await bootstrap({ slug: 'acme-hive', cfAccountId: 'acct123', hiveDir: '/no/such/kit', execute: false, logger: (s) => out.push(s) });
  ok(r1.ok && r1.planned && r1.warnings.length > 0, 'dry-run against missing kit → ok+planned+warnings');
  ok(out.join('\n').includes('acme-hive-d1'), 'dry-run plan prints resolved resource names');
  ok(out.join('\n').includes('--execute to apply'), 'dry-run tells the operator how to apply');

  // bootstrap guards
  const g1 = await bootstrap({ slug: 'BAD SLUG', cfAccountId: 'x', hiveDir: '/tmp', logger: () => {} });
  ok(!g1.ok && /slug/.test(g1.error), 'bad slug guarded');
  const g2 = await bootstrap({ slug: 'acme-hive', hiveDir: '/tmp', logger: () => {} });
  ok(!g2.ok && /account id/i.test(g2.error), 'missing CF account id guarded');

  console.log(`bootstrap self-test: PASS (${n} assertions)`);
}
