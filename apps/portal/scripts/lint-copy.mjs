#!/usr/bin/env node
// lint-copy.mjs — fails the portal build when copy contradicts the product.
// Ground truth lives OUTSIDE the portal: the CLI's HELP 'Commands:' block
// (command count), the root package.json (cli version), METHODOLOGY.md stage
// order (4 Fact-Check precedes 5 Documents). Copy restating those facts rots
// silently — the wave-59 stateful-claim lesson — so this parses the sources
// each run instead of hardcoding them. Wired as `prebuild`: npm runs it before
// `build` automatically, so CI inherits the gate with zero workflow changes.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const portalDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(portalDir, '..', '..');
const pagesDir = join(portalDir, 'src', 'pages');

const failures = [];
const fail = (file, line, expected, found, msg) =>
  failures.push(`${relative(repoRoot, file)}:${line}  ${msg}\n      expected: ${expected}\n      found:    ${found}`);

function walk(dir, exts) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p, exts);
    return exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}
const lines = (file) => readFileSync(file, 'utf8').split('\n');

const pageFiles = walk(pagesDir, ['.astro', '.md']);
// README + root blueprint.yml restate the same facts (the 2026-06-10 audit's
// stale-count defects hit exactly those two files) — same guards apply.
const repoCopyFiles = [join(repoRoot, 'README.md'), join(repoRoot, 'blueprint.yml')].filter(existsSync);
const copyFiles = [...pageFiles, ...walk(join(portalDir, 'src', 'data'), ['.ts']), ...repoCopyFiles];

// ── 1. Command-count truth — parse the HELP 'Commands:' block, never hardcode.
const binPath = join(repoRoot, 'bin', 'blueprint.mjs');
const cmdNames = [];
let inCommands = false;
for (const l of lines(binPath)) {
  if (/^Commands:/.test(l)) { inCommands = true; continue; }
  if (inCommands && /^Global:/.test(l)) break;
  if (inCommands) {
    const m = /^ {2}([a-z][a-z-]*)\s{2,}/.exec(l); // continuation lines indent deeper
    if (m) cmdNames.push(m[1]);
  }
}
if (cmdNames.length === 0) {
  console.error(`lint-copy: could not parse the Commands: block from ${binPath} — fix the parser before trusting this lint.`);
  process.exit(1);
}
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const toNum = (w) => NUM[w.toLowerCase()] ?? Number(w);
// Plural "N commands" / "N CLI commands", plus adjectival "N-command". Bare
// singular ("one command scaffolds") is usage phrasing, not a count claim.
const countRes = [/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(?:CLI\s+)?commands\b/gi,
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)-command\b/gi];
for (const file of copyFiles) {
  lines(file).forEach((l, i) => {
    for (const re of countRes) for (const m of l.matchAll(re)) {
      if (toNum(m[1]) !== cmdNames.length) {
        fail(file, i + 1, `${cmdNames.length} commands (${cmdNames.join(', ')} — bin/blueprint.mjs HELP)`, `"${m[0]}"`, 'command-count claim contradicts the CLI');
      }
    }
  });
}

// ── 2. Version truth — a 0.x.y literal near the word "version" asserts the cli
// version; it must match the root package.json. De-rotted copy (no literal) passes.
const pkgVersion = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;
for (const file of pageFiles) {
  const ls = lines(file);
  ls.forEach((l, i) => {
    for (const m of l.matchAll(/\b0\.\d+\.\d+\b/g)) {
      const nearVersion = ls.slice(Math.max(0, i - 3), i + 4).some((x) => /version/i.test(x));
      if (nearVersion && m[0] !== pkgVersion) {
        fail(file, i + 1, `${pkgVersion} (root package.json)`, m[0], 'stale blueprint-cli version literal');
      }
    }
  });
}

// ── 3. Stage-order truth — METHODOLOGY.md: 4 Fact-Check before 5 Documents,
// so /blueprint-validate must precede /blueprint-docs in any chain on one line.
for (const file of copyFiles) {
  lines(file).forEach((l, i) => {
    const d = l.indexOf('/blueprint-docs');
    const v = l.indexOf('/blueprint-validate');
    if (d !== -1 && v !== -1 && d < v) {
      fail(file, i + 1, '/blueprint-validate before /blueprint-docs (stage 4 precedes stage 5)', l.trim(), 'skill chain out of stage order');
    }
  });
}

// ── 4. Dead internal routes — every href="/..." (astro) and [text](/...) (md)
// must hit a page (or, for paths with an extension, a public/ asset). Query
// strings/anchors stripped; /#x is index.
const HREF_RES = { '.astro': [/href="(\/[^"#?]*)/g], '.md': [/\]\((\/[^)#?]*)/g] };
for (const file of pageFiles) {
  const res = HREF_RES[file.endsWith('.md') ? '.md' : '.astro'];
  lines(file).forEach((l, i) => {
    for (const re of res) for (const m of l.matchAll(re)) {
      const p = m[1];
      if (/\.[a-z0-9]+$/i.test(p)) {
        if (!existsSync(join(portalDir, 'public', p))) {
          fail(file, i + 1, `an asset at public${p}`, `href="${p}" (no such file)`, 'dead asset link');
        }
        continue;
      }
      const base = p.replace(/^\/+|\/+$/g, '');
      const candidates = base === ''
        ? ['index.astro', 'index.md']
        : [`${base}.astro`, `${base}.md`, join(base, 'index.astro'), join(base, 'index.md')];
      if (!candidates.some((c) => existsSync(join(pagesDir, c)))) {
        fail(file, i + 1, `a route file under src/pages (${candidates.join(' | ')})`, `href="${p}" (no matching page)`, 'dead internal route');
      }
    }
  });
}

if (failures.length) {
  console.error(`lint-copy: ${failures.length} finding(s) — portal copy contradicts the product\n`);
  for (const f of failures) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`lint-copy: ok — ${cmdNames.length} CLI commands, version ${pkgVersion}, ${copyFiles.length} copy files checked`);
