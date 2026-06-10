#!/usr/bin/env node
/**
 * Design-system completeness lint.
 *
 * Parses `prototype/DESIGN.md` frontmatter and asserts the 15-dimension
 * contract from `big-blueprint/docs/case-studies/design-system-audit.md`.
 *
 * Hard requirements (fail = exit 1):
 *   D-1  colors.primary set (not "#000000")
 *   D-2  typography.ramp has ≥ 10 entries; each is a 5-key tuple
 *   D-2  weights_in_use length ≤ 3
 *   D-2  numerals.tabular declared
 *   D-2  italics policy declared
 *   D-3  iconography.library set
 *   D-4  spacing scale + rationale + elevation strategy
 *   D-5  motion.durations + motion.easings
 *   D-7  a11y.focus_visible: true, contrast_target: WCAG AA, one_h1_per_route: true
 *   D-8  responsive.mobile_nav set
 *   D-9  data_formatting.date + data_formatting.number
 *
 * Soft warnings (log, exit 0):
 *   D-1  colors.dark.enabled: false → "dark mode tokens declared; build deferred"
 *   D-6  no equivalent automated check — manual
 *
 * Wire into `/blueprint-validate` Phase 0.
 *
 * Usage:  node prototype/scripts/lint-design-system.mjs
 * Exit:   0 clean, 1 missing required fields
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Resolve DESIGN.md whether invoked from project root or from prototype/
const candidates = [
  resolve(process.cwd(), 'prototype/DESIGN.md'),
  resolve(process.cwd(), 'DESIGN.md'),
  resolve(process.cwd(), '../DESIGN.md'),
];
const designMd = candidates.find(existsSync);
if (!designMd) {
  console.error(`FAIL  could not find DESIGN.md (tried: ${candidates.join(', ')})`);
  process.exit(1);
}
const raw = readFileSync(designMd, 'utf8');

// Extract YAML frontmatter (between first two `---`)
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) {
  console.error('FAIL  no frontmatter found in DESIGN.md');
  process.exit(1);
}
const fm = fmMatch[1];

const failures = [];
const warnings = [];

function check(name, predicate, hint) {
  if (predicate) {
    console.log(`pass   ${name}`);
  } else {
    failures.push({ name, hint });
    console.log(`FAIL   ${name}  ←  ${hint}`);
  }
}
function warn(name, predicate, hint) {
  if (!predicate) {
    warnings.push({ name, hint });
    console.log(`warn   ${name}  ←  ${hint}`);
  }
}

// — D-1 Color —
check(
  'D-1 colors.primary set (not placeholder)',
  /^\s*primary:\s*["']?#(?!000000["']?\s*$)[0-9A-Fa-f]{6,8}["']?/m.test(fm),
  'set colors.primary to the brand hex; "#000000" is the template placeholder',
);

// — D-2 Typography —
check(
  'D-2 typography.ramp present',
  /^\s*ramp:/m.test(fm),
  'add typography.ramp with (size, leading, weight, tracking, family) tuples per token',
);
// Count ramp tuples — each entry has `{ size: ... }` inline-object format
const rampLineCount = (fm.match(/\{\s*size:/g) || []).length;
check(
  'D-2 typography.ramp has ≥ 10 entries',
  rampLineCount >= 10,
  `found ${rampLineCount}; need at least h1/h2/h3/h4/body/body_em/sm/xs/eyebrow/code`,
);
check(
  'D-2 weights_in_use declared',
  /weights_in_use:/m.test(fm),
  'declare weights_in_use: [400, 500, 600] — three weights total, no 700 in chrome (DP-14)',
);
const weightsMatch = fm.match(/weights_in_use:\s*\[([^\]]+)\]/);
if (weightsMatch) {
  const weightCount = weightsMatch[1].split(',').filter(s => s.trim()).length;
  check(
    'D-2 weights_in_use length ≤ 3',
    weightCount <= 3,
    `found ${weightCount} weights; cap at 3 per DP-14`,
  );
}
check(
  'D-2 numerals.tabular declared',
  /numerals:[\s\S]*?tabular:/m.test(fm),
  'declare numerals.tabular: [counter, timestamp, trace_id, code, ...] per DP-14',
);
check(
  'D-2 italics policy declared',
  /italics:[\s\S]*?forbidden_in:/m.test(fm),
  'declare italics.allowed_in / italics.forbidden_in — never italics in chrome',
);

// — D-3 Iconography —
check(
  'D-3 iconography.library set',
  /iconography:[\s\S]*?library:\s*["']?[a-z][a-z0-9-]+/m.test(fm),
  'set iconography.library to "lucide-react" | "heroicons" | "phosphor" | name of host design system',
);

// — D-4 Spacing / elevation —
check(
  'D-4 spacing.rationale declared',
  /spacing:[\s\S]*?rationale:/m.test(fm),
  'declare spacing rationale: "4px base" or "8px base" etc.',
);
check(
  'D-4 elevation.strategy declared',
  /elevation:[\s\S]*?strategy:\s*["']?(flat|layered)/m.test(fm),
  'declare elevation.strategy: flat | layered',
);

// — D-5 Motion —
check(
  'D-5 motion.durations declared',
  /motion:[\s\S]*?durations:/m.test(fm),
  'declare motion.durations.fast / base / slow',
);
check(
  'D-5 motion.easings declared',
  /motion:[\s\S]*?easings:/m.test(fm),
  'declare motion.easings.standard / emphasized',
);

// — D-7 A11y —
check(
  'D-7 a11y.focus_visible: true',
  /a11y:[\s\S]*?focus_visible:\s*true/m.test(fm),
  'declare a11y.focus_visible: true and apply *:focus-visible globally',
);
check(
  'D-7 a11y.contrast_target',
  /a11y:[\s\S]*?contrast_target:\s*["']?WCAG/m.test(fm),
  'declare a11y.contrast_target: "WCAG AA"',
);
check(
  'D-7 a11y.one_h1_per_route',
  /a11y:[\s\S]*?one_h1_per_route:\s*true/m.test(fm),
  'declare a11y.one_h1_per_route: true',
);

// — D-8 Responsive —
check(
  'D-8 responsive.mobile_nav set',
  /responsive:[\s\S]*?mobile_nav:\s*["']?[a-z]/m.test(fm),
  'set responsive.mobile_nav: "off-canvas" | "bottom" | "collapse"',
);

// — D-9 Data formatting —
check(
  'D-9 data_formatting.date',
  /data_formatting:[\s\S]*?date:/m.test(fm),
  'declare data_formatting.date.relative_under / absolute_format',
);
check(
  'D-9 data_formatting.number',
  /data_formatting:[\s\S]*?number:/m.test(fm),
  'declare data_formatting.number.compact_above / thousands_separator',
);

// — Soft: dark mode tokens —
warn(
  'D-1 colors.dark.enabled (soft)',
  /dark:[\s\S]*?enabled:\s*true/m.test(fm),
  'dark mode tokens declared but `enabled: false` — fine for prototype; flip true when built',
);

console.log('\n' + '-'.repeat(60));
console.log(`${failures.length === 0 ? 'PASS' : 'FAIL'}  ${failures.length} required, ${warnings.length} warnings`);
if (failures.length) {
  console.log('\nFailed checks:');
  failures.forEach((f) => console.log(`  · ${f.name}\n    → ${f.hint}`));
}
process.exit(failures.length > 0 ? 1 : 0);
