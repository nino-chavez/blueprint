#!/usr/bin/env node
/**
 * D-7 — WCAG AA contrast audit.
 *
 * Ships with every the original employer-prefixed name initiative. Populate `COLORS` and `PAIRINGS`
 * with the tokens from this project's `prototype/DESIGN.md` frontmatter.
 *
 * AA targets (per W3C WCAG 2.1):
 *   - Normal text   (< 18px / < 14px bold): 4.5:1
 *   - Large text    (≥ 18px / ≥ 14px bold): 3.0:1
 *   - UI components (icons, graphical):     3.0:1
 *
 * Wire into `/blueprint-validate` Phase 0 as a mechanical gate.
 *
 * Usage:  node prototype/scripts/audit-contrast.mjs
 * Exit:   0 if all pass, 1 if any fail
 */

// ─── REPLACE with this project's tokens from DESIGN.md frontmatter ──────
const COLORS = {
  // Brand
  primary:        '#000000',   // REPLACE
  primary_hover:  '#000000',   // REPLACE
  // Text
  ink:            '#0F172A',   // REPLACE if different
  ink_muted:      '#475569',
  ink_subtle:     '#64748B',   // do NOT use slate-400 (#94A3B8) — fails AA on white at 2.5:1
  ink_inverse:    '#F8FAFC',
  // Surfaces
  background:     '#FFFFFF',
  card:           '#FFFFFF',
  raised:         '#F5F5F1',
  // Semantic (defaults that pass; replace if customized)
  success:        '#15803D',
  warning:        '#B45309',
  error:          '#B91C1C',
  info:           '#1E40AF',
};

// ─── REPLACE with this project's actual text-on-surface pairings ────────
const PAIRINGS = [
  ['ink',         'background', 'body text on background',     'AA'],
  ['ink',         'card',       'body text on card',           'AA'],
  ['ink_muted',   'background', 'muted text',                  'AA'],
  ['ink_muted',   'card',       'muted text on card',          'AA'],
  ['ink_subtle',  'background', 'subtle text (eyebrow ≥ 10px)', 'AA'],
  ['primary',     'background', 'primary link',                'AA'],
  ['primary',     'card',       'primary link on card',        'AA'],
  ['ink_inverse', 'primary',    'inverse text on primary CTA', 'AA'],
  ['success',     'card',       'success text',                'AA'],
  ['warning',     'card',       'warning text',                'AA'],
  ['error',       'card',       'error text',                  'AA'],
  ['info',        'card',       'info text',                   'AA'],
];

// ─── WCAG math (don't touch) ────────────────────────────────────────────
function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m.map((c) => parseInt(c, 16));
}
function srgbToLin(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance([r, g, b]) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrast(fg, bg) {
  const L1 = luminance(hexToRgb(fg));
  const L2 = luminance(hexToRgb(bg));
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

const targets = { AA: 4.5, 'AA-large': 3.0, UI: 3.0 };

console.log('WCAG AA contrast audit — prototype tokens\n');
console.log('FG'.padEnd(16), 'BG'.padEnd(14), 'Ratio'.padEnd(8), 'Target'.padEnd(12), 'Use');
console.log('-'.repeat(92));

let pass = 0;
let fail = 0;
for (const [fgKey, bgKey, use, kind] of PAIRINGS) {
  const fg = COLORS[fgKey];
  const bg = COLORS[bgKey];
  if (!fg || !bg) {
    console.log(`SKIP ${fgKey}/${bgKey} — missing token`);
    continue;
  }
  const ratio = contrast(fg, bg);
  const target = targets[kind];
  const ok = ratio >= target;
  console.log(
    fgKey.padEnd(16),
    bgKey.padEnd(14),
    ratio.toFixed(2).padEnd(8),
    `${kind} (${target})`.padEnd(12),
    `${ok ? 'pass' : 'FAIL'} · ${use}`,
  );
  ok ? pass++ : fail++;
}

console.log('-'.repeat(92));
console.log(`${pass}/${pass + fail} pairings pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
