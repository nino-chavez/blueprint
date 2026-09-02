/**
 * design-principles-reviewer.mjs — executable pair for the paired .md spec.
 * Implements the ADR-0002 reviewer contract so the Stage 2 → Stage 3 greenfield
 * design gate runs outside Claude Code (CLI / CI / any node):
 *
 *   export default async function review({ targetDir, blueprintYml, methodologyHome })
 *     -> { status: 'PASS'|'BLOCKED'|'WARN', findings: [...], metadata: {...} }
 *
 * Gate rule (see design-principles-reviewer.md): a greenfield initiative MUST NOT
 * enter Stage 3 (prototype) until DESIGN.md codifies the five visual rules, the
 * testing baseline, the four architectural invariants, and acknowledges the
 * confident-preview rule. Prototype-builder agents reach for components and copy
 * that don't exist in the source product when DESIGN.md is incomplete; this gate
 * catches that when the fix is one doc edit, not a per-page rework pass.
 *
 * Scope honesty (charter): this is a dependency-free line-scan / glob / grep
 * reviewer. It is a SUBSTANCE-PRESENCE check, not a semantic one — it verifies
 * each required rule/category/invariant is NAMED somewhere in DESIGN.md (a rule
 * in a paragraph counts the same as a rule in a numbered list, per the .md), and
 * does NOT validate that the prose under each name is correct or complete. The
 * variant gate is read from a TOP-LEVEL scalar `variant:` in blueprint.yml via
 * line-scan (no nested-YAML parse); blueprintYml.variant is preferred when the
 * runner already parsed it. Dependency-free node ESM. Never throws.
 *
 * Reference: design-principles-reviewer.md (paired spec),
 *            docs/methodology/confident-preview-rule.md, METHODOLOGY.md Stage 2.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { findInitiativeRoot } from '../../lib/initiative-root.mjs';
import { readTopLevelYamlScalar } from '../../../../tools/lib/yaml-scalar.mjs';

const NAME = 'design-principles-reviewer';

const exists = (p) => fs.access(p).then(() => true, () => false);
const read = (p) => fs.readFile(p, 'utf8').then((s) => s, () => null);

function result(status, findings, targetSummary, startedAt) {
  return { status, findings, metadata: { reviewer: NAME, targetSummary, durationMs: Date.now() - startedAt } };
}

function finalize(findings, targetSummary, startedAt) {
  const status = findings.some((f) => f.severity === 'BLOCK')
    ? 'BLOCKED'
    : findings.some((f) => f.severity === 'WARN')
    ? 'WARN'
    : 'PASS';
  return result(status, findings, targetSummary, startedAt);
}

// ── Required-content matchers ────────────────────────────────────────────────
// Each entry: a human label + a list of alternate phrasings (any one match counts
// it present). Matching is case-insensitive substring — the spec calls for a
// SUBSTANCE check ("a rule named in a paragraph counts the same as a rule in a
// numbered list"), so we look for the rule's NAME, not its formatting.

const VISUAL_RULES = [
  { label: 'Match the existing product', any: ['match the existing product', 'match existing product', 'matches the existing product', 'PROPOSED'] },
  { label: 'Customer terminology', any: ['customer terminology', 'customer-facing terminology', "customer's terminology", 'customer language'] },
  { label: 'Savings-first / positive framing', any: ['savings-first', 'savings first', 'positive framing', 'positive-framing'] },
  { label: 'One primary action per page', any: ['one primary action', 'single primary action', 'one primary cta', 'single primary cta'] },
  { label: 'Progressive disclosure', any: ['progressive disclosure'] },
];

const TESTING_CATEGORIES = [
  { label: 'linting', any: ['lint', 'linting', 'eslint'] },
  { label: 'typing', any: ['typecheck', 'type-check', 'type check', 'typing', 'typescript', 'tsc'] },
  { label: 'unit', any: ['unit test', 'unit-test', 'unit tests', 'vitest', 'jest'] },
  { label: 'E2E (@smoke Playwright)', any: ['e2e', '@smoke', 'playwright', 'end-to-end', 'end to end'] },
  { label: 'Lighthouse-CI', any: ['lighthouse'] },
  { label: 'Gitleaks / Dependabot', any: ['gitleaks', 'dependabot', 'secret scan', 'dependency scan'] },
];

const ARCHITECTURAL_INVARIANTS = [
  { label: 'Boundary parsing required', any: ['boundary parsing', 'boundary-parsing', 'parse at the boundary', 'parse at boundary', 'boundary parse'] },
  { label: 'Pages declare own metadata (window.PROTO_PAGE)', any: ['window.proto_page', 'proto_page', 'page identifier', 'declare own metadata', 'declare its own metadata'] },
  { label: 'Cross-cutting concerns via single Providers interface', any: ['providers interface', 'single providers', 'provider interface', 'cross-cutting concerns through', 'cross-cutting concern through'] },
  { label: 'One primary CTA promoted to structural lint', any: ['primary cta', 'cta lint', 'structural lint', 'lint check', 'primary-cta'] },
];

// Confident-preview rule — acknowledged via a section header, a sentence in the
// rules list, or a cross-reference to the canonical doc.
const CONFIDENT_PREVIEW = {
  any: [
    'confident preview',
    'confident-preview',
    'not a deliberation venue',
    'deliberation venue',
    'one confident take',
    'one take per route',
    'stakeholder review surface',
    'confident-preview-rule.md',
  ],
};

// Judged-screen pattern (promotion candidate) — checks 10 and 11.
// The object/action/state matrix is what prevents an interaction being invented
// from a boolean at implementation time. Matched by its name or by a table
// header carrying Object + Owner, since projects render it either way.
const MATRIX_PHRASES = [
  'object / action / state',
  'object/action/state',
  'object, action, state',
  'object, action, and state',
  'object, action and state',
  'object-action-state',
  'action / state matrix',
  'action/state matrix',
];
const MATRIX_TABLE_HEADER = /^\s*\|[^\n]*\bobject\b[^\n]*\bowner\b[^\n]*\|/im;

// Concept records — a `## Concepts` list in the brief, or concept files on disk.
const CONCEPT_DIRS = [
  ['prototype', 'concepts'],
  ['portal', 'concepts'],
  ['research', 'design-explorations'],
  ['docs', 'design', 'concepts'],
];
// Accepted artifact locations — judged-screen-pattern.md § 2b owns this set.
const BRIEF_PATHS = [
  ['prototype', 'EXPERIENCE-BRIEF.md'],
  ['portal', 'EXPERIENCE-BRIEF.md'],
  ['docs', 'design', 'experience-brief.md'],
];
// The matrix may live in the brief, in the direction record, or on its own.
const MATRIX_PATHS = [['DIRECTION.md'], ['docs', 'design', 'object-action-state.md']];
// A selection ADR names the chosen concept AND the rejected ones.
const ADR_CONCEPT_WORDS = ['concept', 'divergent'];
const ADR_SELECTION_WORDS = ['chose', 'chosen', 'selected', 'rejected', 'alternatives considered'];
// Attribution — who made the pick. This matches a LINE, never a human: an agent
// can write "the operator chose". The finding text says exactly that.
const ADR_ATTRIBUTION_WORDS = ['operator', 'selected by', 'chosen by', 'decided by', 'human'];

// Variant-shaped page names — convergence violation if found in the planned page
// list. Mirrors the regex set named in the .md (-a/-b/-c suffix, -variant-,
// -v\d.) plus the explicit examples (home-a, dashboard-modern, dashboard-classic).
const VARIANT_NAME_PATTERNS = [/-(a|b|c)$/i, /-variant-/i, /-v\d+$/i, /-v\d+\./i];
const VARIANT_NAME_LITERALS = ['home-a', 'home-b', 'dashboard-modern', 'dashboard-classic', 'dashboard-a', 'dashboard-b'];

function countPresent(text, specs) {
  const lower = text.toLowerCase();
  const present = [];
  const missing = [];
  for (const s of specs) {
    if (s.any.some((needle) => lower.includes(needle.toLowerCase()))) present.push(s.label);
    else missing.push(s.label);
  }
  return { present, missing };
}

// Read the top-level `variant:` scalar from blueprint.yml by line-scan. We only
// honor a TOP-LEVEL (column-0) key so a nested `variant:` deeper in the YAML
// can't be misread — no full YAML parse, shape is a flat scalar per the consumer
// CLAUDE.md (`variant: greenfield`). Strips quotes and trailing comments.
function variantFromYmlText(ymlText) {
  return readTopLevelYamlScalar(ymlText, 'variant')?.toLowerCase() ?? null;
}

// Extract candidate "planned page" names from DESIGN.md to flag variant-shaped
// names. Heuristic + dependency-free: pull tokens that look like page/route
// slugs — markdown links/code spans/list items referencing *.astro/*.html/*.tsx
// or bare kebab slugs in a list. Over-collecting is safe (we only test each
// token against the variant regex); under-collecting is the real risk, so we
// cast a wide net across code spans, links, and list bullets.
function extractPlannedPageNames(designText) {
  const names = new Set();
  if (!designText) return names;
  // 1. file-ish references: foo-bar.astro / home-a.html / dashboard-v2.tsx
  for (const m of designText.matchAll(/([A-Za-z0-9][A-Za-z0-9-]*)\.(astro|html|tsx|jsx|vue|svelte)\b/g)) {
    names.add(m[1].toLowerCase());
  }
  // 2. inline code spans: `home-a`, `dashboard-modern`
  for (const m of designText.matchAll(/`([A-Za-z0-9][A-Za-z0-9-]*)`/g)) {
    names.add(m[1].toLowerCase());
  }
  // 3. markdown list bullets that are bare kebab slugs (a planned-page list)
  for (const m of designText.matchAll(/^\s*[-*]\s+([A-Za-z0-9][A-Za-z0-9-]*)\s*$/gm)) {
    names.add(m[1].toLowerCase());
  }
  return names;
}

function variantShapedNames(names) {
  const hits = [];
  for (const n of names) {
    if (VARIANT_NAME_LITERALS.includes(n) || VARIANT_NAME_PATTERNS.some((re) => re.test(n))) hits.push(n);
  }
  return hits;
}

// Count list bullets under a named `## <heading>` section. Line scan, not a
// section regex — a "next heading or end of input" lookahead is the shape that
// goes subtly wrong (JS has no \\Z).
function countSectionBullets(text, heading) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  const re = new RegExp(`^##[ \\t]+${heading}[ \\t]*$`, 'i');
  const start = lines.findIndex((l) => re.test(l));
  if (start === -1) return 0;
  let n = 0;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##[ \t]/.test(lines[i])) break;
    if (/^[ \t]*[-*][ \t]+\S/.test(lines[i])) n += 1;
  }
  return n;
}

// One concept record is one file, or one directory holding at least one such
// file — projects that keep a CONCEPT.md, a composition, and its renders
// together use a folder per concept. A README describing the set is not a
// concept.
const CONCEPT_FILE = /\.(md|html|png|jpg|jpeg|svg|pdf)$/i;
async function countFilesIn(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let n = 0;
    for (const e of entries) {
      if (e.name.startsWith('_') || /^readme\./i.test(e.name)) continue;
      if (e.isDirectory()) {
        const inner = await fs.readdir(path.join(dir, e.name)).catch(() => []);
        if (inner.some((f) => CONCEPT_FILE.test(f))) n += 1;
      } else if (CONCEPT_FILE.test(e.name)) {
        n += 1;
      }
    }
    return n;
  } catch {
    return 0;
  }
}

// A selection ADR in decisions/ — names concepts and names a choice among them.
// Walk decisions/ recursively — § 2b accepts the selection ADR anywhere under
// it, and projects that group ADRs into subdirectories are not skipping the gate.
async function walkMarkdown(dir, rel = '') {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const child = path.join(dir, e.name);
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walkMarkdown(child, childRel)));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(childRel);
  }
  return out;
}

async function findSelectionAdr(decisionsDir) {
  const files = await walkMarkdown(decisionsDir);
  if (!files.length) return { file: null, attributed: false };
  for (const f of files.sort()) {
    const text = (await read(path.join(decisionsDir, f))) || '';
    const lower = text.toLowerCase();
    if (ADR_CONCEPT_WORDS.some((w) => lower.includes(w)) && ADR_SELECTION_WORDS.some((w) => lower.includes(w))) {
      return { file: f, attributed: ADR_ATTRIBUTION_WORDS.some((w) => lower.includes(w)) };
    }
  }
  return { file: null, attributed: false };
}

export default async function review({ targetDir, blueprintYml }) {
  const startedAt = Date.now();
  const findings = [];

  // Resolve the artifacts root (handles both blueprint.yml-at-root and blueprint.yml-in-subdir).
  const artifactsRoot = findInitiativeRoot(targetDir);

  // ── 1. Variant gate ────────────────────────────────────────────────────────
  // Greenfield-only. Prefer a variant the runner already parsed; else line-scan
  // blueprint.yml on disk. Absent/unknown variant → continue (the .md: "If
  // variant: greenfield is not declared or implied (no variant key), continue").
  let variant = blueprintYml && typeof blueprintYml.variant === 'string' ? blueprintYml.variant.toLowerCase() : null;
  if (!variant) {
    const ymlText = await read(path.join(artifactsRoot, 'blueprint.yml'));
    variant = variantFromYmlText(ymlText);
  }
  if (variant === 'midstream' || variant === 'brownfield' || variant === 'research') {
    return result('PASS', [], `out of scope for this variant (${variant})`, startedAt);
  }
  const variantNote = variant === 'greenfield' ? 'greenfield' : 'no variant key — proceeding as greenfield';

  // ── 2. Locate DESIGN.md (prototype/ then portal/) ───────────────────────────
  const candidatePaths = [
    path.join(artifactsRoot, 'prototype', 'DESIGN.md'),
    path.join(artifactsRoot, 'portal', 'DESIGN.md'),
  ];
  let designPath = null;
  for (const p of candidatePaths) {
    if (await exists(p)) {
      designPath = p;
      break;
    }
  }
  if (!designPath) {
    findings.push({
      severity: 'BLOCK',
      location: 'prototype/DESIGN.md (or portal/DESIGN.md)',
      message: 'No DESIGN.md found in prototype/ or portal/ — the Stage 2 design contract is missing.',
      remediation:
        'Author prototype/DESIGN.md before Stage 3. It must codify the five visual rules, the testing baseline, the four architectural invariants, and acknowledge the confident-preview rule. Template: docs/methodology/ + design-principles-reviewer.md.',
      reference: 'design-principles-reviewer.md',
    });
    return finalize(findings, `${variantNote}; DESIGN.md missing`, startedAt);
  }

  const designRel = path.relative(targetDir, designPath);
  const designText = (await read(designPath)) || '';
  if (!designText.trim()) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: 'DESIGN.md exists but is empty (or unreadable) — no design contract to gate on.',
      remediation: 'Populate DESIGN.md with the five visual rules, testing baseline, architectural invariants, and confident-preview acknowledgment.',
      reference: 'design-principles-reviewer.md',
    });
    return finalize(findings, `${variantNote}; ${designRel} empty`, startedAt);
  }

  // ── 3. Five visual rules ─────────────────────────────────────────────────────
  const visual = countPresent(designText, VISUAL_RULES);
  if (visual.missing.length) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: `Missing ${visual.missing.length}/5 visual rule(s): ${visual.missing.join(', ')}.`,
      remediation: `Name each missing visual rule in DESIGN.md (a paragraph mention counts). Present: ${visual.present.length}/5.`,
      reference: 'design-principles-reviewer.md#3-visual-rules',
    });
  }

  // ── 4. Testing baseline ──────────────────────────────────────────────────────
  const testing = countPresent(designText, TESTING_CATEGORIES);
  if (testing.missing.length) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: `Testing baseline incomplete — missing categor(ies): ${testing.missing.join(', ')}.`,
      remediation:
        'DESIGN.md must name every Stage-2 baseline category: linting + typing, unit (non-trivial logic), E2E @smoke Playwright, Lighthouse-CI, Gitleaks + Dependabot. Paraphrase is fine; each must be named.',
      reference: 'design-principles-reviewer.md#4-testing-baseline; METHODOLOGY.md Stage 2',
    });
  }

  // ── 5. Four architectural invariants ─────────────────────────────────────────
  // The .md treats these as required for NEW initiatives but allows initiatives
  // that predate the v2 patch to skip them with a note (WARN, follow-up, not a
  // block). We can't tell "predates v2" from a static scan, so: missing ALL four
  // reads as a pre-v2 doc → WARN follow-up; missing SOME (the block is partially
  // present, so it was attempted) → BLOCK the gaps.
  const invariants = countPresent(designText, ARCHITECTURAL_INVARIANTS);
  if (invariants.missing.length === ARCHITECTURAL_INVARIANTS.length) {
    findings.push({
      severity: 'WARN',
      location: designRel,
      message: 'No architectural-invariants block found — DESIGN.md may predate the v2 patch.',
      remediation:
        'Add the four invariants (boundary parsing; window.PROTO_PAGE page metadata; single Providers interface; one-primary-CTA structural lint). Required for new initiatives; existing pre-v2 docs may add them as a follow-up.',
      reference: 'design-principles-reviewer.md#5-architectural-invariants',
    });
  } else if (invariants.missing.length) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: `Architectural-invariants block present but missing ${invariants.missing.length}/4: ${invariants.missing.join(', ')}.`,
      remediation: `Name each missing invariant in DESIGN.md. Present: ${invariants.present.length}/4.`,
      reference: 'design-principles-reviewer.md#5-architectural-invariants',
    });
  }

  // ── 6. Confident-preview rule ────────────────────────────────────────────────
  const cpAcknowledged = CONFIDENT_PREVIEW.any.some((n) => designText.toLowerCase().includes(n.toLowerCase()));
  if (!cpAcknowledged) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: 'Confident-preview rule not acknowledged — DESIGN.md does not state the portal is a stakeholder review surface (one confident take per route), nor cross-reference confident-preview-rule.md.',
      remediation:
        'Add a "Confident preview" / "Not a deliberation venue" acknowledgment, or cross-reference docs/methodology/confident-preview-rule.md.',
      reference: 'design-principles-reviewer.md#6-confident-preview; docs/methodology/confident-preview-rule.md',
    });
  }

  // Planned variant pages → convergence violation (BLOCK) even if the rule text
  // is acknowledged. Scan DESIGN.md's planned-page references for variant-shaped
  // names.
  const plannedNames = extractPlannedPageNames(designText);
  const variantPages = variantShapedNames(plannedNames);
  if (variantPages.length) {
    findings.push({
      severity: 'BLOCK',
      location: designRel,
      message: `Planned variant pages detected (${variantPages.join(', ')}) — confident-preview rule requires convergence in Stage 2, not multiple takes shipped to stakeholders.`,
      remediation:
        'Converge to one take per route before Stage 3. Move variant-walking to scratch (Tier 0 design-principles) or to decisions/ ADRs — the portal is the stakeholder deliverable, not a "pick one" surface.',
      reference: 'design-principles-reviewer.md#6-confident-preview; docs/methodology/confident-preview-rule.md',
    });
  }

  // ── 7. Three-pass research discipline (platform-feature initiatives only) ────
  // Detect if this is a platform-feature initiative by looking for docs/feasibility/ directory.
  const feasibilityDir = path.join(artifactsRoot, 'docs', 'feasibility');
  const hasFeasibilityDocs = await exists(feasibilityDir);
  let threePassState = 'N/A'; // default for non-platform initiatives

  if (hasFeasibilityDocs) {
    // Scan for Pass 3 mentions in feasibility/ — look in *.md files
    try {
      const files = await fs.readdir(feasibilityDir);
      const mdFiles = files.filter((f) => f.endsWith('.md'));
      let pass3Found = false;
      for (const fname of mdFiles) {
        const content = await read(path.join(feasibilityDir, fname));
        if (content && (content.toLowerCase().includes('pass 3') || content.toLowerCase().includes('architectural principles'))) {
          pass3Found = true;
          break;
        }
      }
      threePassState = pass3Found ? 'documented' : 'missing';
      if (!pass3Found) {
        findings.push({
          severity: 'BLOCK',
          location: 'docs/feasibility/',
          message: 'Platform-ask enumeration detected (feasibility/ docs present) but Pass 3 (architectural-principles re-test) not documented.',
          remediation:
            'Document Pass 3 results in docs/feasibility/ or strategy docs. See three-pass-research-discipline-pattern.md for the eight tests.',
          reference: 'design-principles-reviewer.md#7-three-pass; three-pass-research-discipline-pattern.md',
        });
      }
    } catch (_e) {
      // If reading fails, skip this check (best-effort)
      threePassState = 'N/A';
    }
  }

  // ── 8. Peer-vs-modifier test (when multiple strategy forks detected) ─────────
  // Detect multiple strategy docs in docs/strategy/ — if found, check for peer-vs-modifier documentation.
  const strategyDir = path.join(artifactsRoot, 'docs', 'strategy');
  const hasStrategyDocs = await exists(strategyDir);
  let peerVsModifierState = 'N/A';

  if (hasStrategyDocs) {
    try {
      const files = await fs.readdir(strategyDir);
      const strategyMds = files.filter((f) => f.endsWith('.md'));
      if (strategyMds.length > 1) {
        // Multiple strategy docs exist — check for peer-vs-modifier test result
        let peerVsModifierFound = false;
        for (const fname of strategyMds) {
          const content = await read(path.join(strategyDir, fname));
          if (content && (content.toLowerCase().includes('peer-vs-modifier') || content.toLowerCase().includes('peer or modifier'))) {
            peerVsModifierFound = true;
            break;
          }
        }
        peerVsModifierState = peerVsModifierFound ? 'documented' : 'undocumented';
        if (!peerVsModifierFound) {
          findings.push({
            severity: 'WARN',
            location: 'docs/strategy/',
            message: `Multiple strategy docs detected (${strategyMds.join(', ')}) — peer-vs-modifier test result not explicitly documented.`,
            remediation:
              'Document whether each new strategic option is a peer or a modifier (see peer-vs-modifier-test-pattern.md). Recommend a statement in each doc: "This is a [peer|modifier] because..."',
            reference: 'design-principles-reviewer.md#8-peer-vs-modifier; peer-vs-modifier-test-pattern.md',
          });
        }
      }
    } catch (_e) {
      // If reading fails, skip this check (best-effort)
      peerVsModifierState = 'N/A';
    }
  }

  // ── 9. Back-door-native anti-pattern (platform-ask initiatives) ─────────────
  // Detect domain-named platform asks (e.g., subscription.*, loyalty.* patterns) in feasibility or strategy docs.
  let backDoorNativeState = 'N/A';

  if (hasFeasibilityDocs || hasStrategyDocs) {
    try {
      let domainNamedAsksFound = [];
      const dirs = [hasFeasibilityDocs && feasibilityDir, hasStrategyDocs && strategyDir].filter(Boolean);

      for (const dir of dirs) {
        const files = await fs.readdir(dir);
        for (const fname of files.filter((f) => f.endsWith('.md'))) {
          const content = await read(path.join(dir, fname));
          if (!content) continue;
          // Look for domain-named patterns: subscription.*, loyalty.*, reviews.*, etc.
          // Match any lowercase-word followed by .* or _*
          const matches = content.match(/([a-z_]+)\.\*|([a-z_]+)_\*/g) || [];
          if (matches.length > 0) {
            domainNamedAsksFound.push(...matches);
          }
        }
      }

      backDoorNativeState = domainNamedAsksFound.length === 0 ? 'compliant' : 'domain-named-asks-detected';
      if (domainNamedAsksFound.length > 0) {
        findings.push({
          severity: 'BLOCK',
          location: 'docs/feasibility/ or docs/strategy/',
          message: `Domain-named platform asks detected: ${[...new Set(domainNamedAsksFound)].join(', ')} — reframe to general mechanisms per back-door-native-anti-pattern.md.`,
          remediation:
            'Replace domain-named asks (e.g., "subscription.*" events) with general-mechanism reframes (e.g., "sanctioned-app-emitted event topics"). See back-door-native-anti-pattern.md for four reframe patterns.',
          reference: 'design-principles-reviewer.md#9-back-door-native; back-door-native-anti-pattern.md',
        });
      }
    } catch (_e) {
      // If reading fails, skip this check (best-effort)
      backDoorNativeState = 'N/A';
    }
  }

  // ── 10 + 11. Judged-screen artifacts, routed by design_intent ───────────────
  // WARN, never BLOCK: judged-screen-pattern.md is a PROMOTION CANDIDATE whose
  // gate stays WARN until a second product has run it end to end. Blocking on
  // one instance inherits that instance's blind spots.
  //
  // The intent decides what Stage 2 owes, so a one-line copy fix does not owe a
  // concept exercise and a genuine redesign cannot skip one:
  //   preserve → design_direction points at a record that EXISTS; no brief.
  //   refit    → brief + matrix; no concepts.
  //   rethink  → brief + matrix + >=2 concepts + a selection ADR.
  const ymlTextCache = (await read(path.join(artifactsRoot, 'blueprint.yml'))) || '';
  const designIntentRaw =
    (blueprintYml && typeof blueprintYml.design_intent === 'string'
      ? blueprintYml.design_intent
      : readTopLevelYamlScalar(ymlTextCache, 'design_intent')) || '';
  const designIntent = designIntentRaw.trim().toLowerCase();
  const KNOWN_INTENTS = ['preserve', 'refit', 'rethink'];
  const intentDeclared = KNOWN_INTENTS.includes(designIntent);
  const designIntentState = intentDeclared ? designIntent : designIntentRaw.trim() ? `unknown (${designIntentRaw.trim()})` : 'undeclared';

  if (!intentDeclared) {
    findings.push({
      severity: 'WARN',
      location: 'blueprint.yml',
      message: designIntentRaw.trim()
        ? `design_intent is '${designIntentRaw.trim()}' — not one of preserve | refit | rethink. (WARN: judged-screen-pattern.md is a promotion candidate.)`
        : 'No design_intent declared — nothing says how much design work this change is, so neither reviewer can tell a copy fix from a redesign. Undeclared is not `preserve`. (WARN: judged-screen-pattern.md is a promotion candidate.)',
      remediation:
        'Declare design_intent in blueprint.yml: preserve (approved direction stands; set design_direction), refit (change presentation, keep behavior; author the brief), or rethink (the direction is the question; brief + concepts + selection ADR).',
      reference: 'design-principles-reviewer.md#10-experience-brief; docs/methodology/judged-screen-pattern.md § 2a',
    });
  }

  // ── 10. preserve → a direction record that exists ───────────────────────────
  let briefPath = null;
  for (const parts of BRIEF_PATHS) {
    const p = path.join(artifactsRoot, ...parts);
    if (await exists(p)) {
      briefPath = p;
      break;
    }
  }
  const briefText = briefPath ? (await read(briefPath)) || '' : '';

  let experienceBriefState = briefPath ? 'present' : 'missing';
  let directionState = 'n/a';

  // `preserve` AND `refit` both work inside a direction someone already
  // approved, so both owe the pointer. `rethink` creates the direction — its
  // selection ADR IS the record — so it owes no prior pointer. Requiring the
  // § 3b conformance review under `refit` while nothing guaranteed a record to
  // read against would be a gate with no artifact behind it.
  const directionRequired = designIntent === 'preserve' || designIntent === 'refit';
  const declaredDirectionPath = (readTopLevelYamlScalar(ymlTextCache, 'design_direction') || '').trim();
  if (directionRequired && !declaredDirectionPath) {
    directionState = 'missing';
    findings.push({
      severity: 'WARN',
      location: 'blueprint.yml',
      message: `design_intent is \`${designIntent}\` but no design_direction is declared — nothing names the approved direction this change works inside, and the conformance review has no record to read against. (WARN: judged-screen-pattern.md is a promotion candidate.)`,
      remediation:
        'Set design_direction to the repo-relative path of the approved direction record (a DIRECTION.md or a decisions/ ADR). Under `rethink` the selection ADR is that record and no pointer is owed.',
      reference: 'design-principles-reviewer.md#10-experience-brief; docs/methodology/judged-screen-pattern.md § 2a',
    });
  } else if (declaredDirectionPath) {
    // Checked whenever declared, under every intent: a dangling pointer is a
    // dangling pointer regardless of which intent wrote it.
    if (!(await exists(path.join(artifactsRoot, declaredDirectionPath)))) {
      directionState = 'dangling';
      findings.push({
        severity: 'WARN',
        location: 'blueprint.yml',
        message: `design_direction points at '${declaredDirectionPath}', which does not exist — a pointer to a deleted direction record is not an approved direction. (WARN: judged-screen-pattern.md is a promotion candidate.)`,
        remediation: 'Point design_direction at a record that exists, or change design_intent if the direction is genuinely open.',
        reference: 'design-principles-reviewer.md#10-experience-brief; docs/methodology/judged-screen-pattern.md § 2a',
      });
    } else {
      directionState = 'present';
    }
  }

  // ── 10. refit + rethink → the brief, carrying the matrix ────────────────────
  const briefRequired = designIntent === 'refit' || designIntent === 'rethink';
  if (briefRequired) {
    if (!briefPath) {
      findings.push({
        severity: 'WARN',
        location: 'prototype/EXPERIENCE-BRIEF.md (or portal/EXPERIENCE-BRIEF.md)',
        message: `design_intent is \`${designIntent}\` but there is no EXPERIENCE-BRIEF.md — Stage 2 has no record of the user's situation and job, so the screen review has no standard to judge against. (WARN: judged-screen-pattern.md is a promotion candidate.)`,
        remediation:
          'Author the experience brief: the job in five questions, a `## Surfaces` list, five character attributes, five anti-goals, a density target, hierarchy / content / motion / platform principles, and the object / action / state matrix.',
        reference: 'design-principles-reviewer.md#10-experience-brief; docs/methodology/judged-screen-pattern.md § 2b',
      });
    } else {
      // The matrix counts wherever § 2b accepts it: in the brief, in the
      // direction record (including whatever design_direction names), or on its
      // own. Checking the brief alone would fail a project that keeps its
      // object model beside the direction, which is a layout choice, not a gap.
      const matrixTexts = [briefText];
      for (const parts of MATRIX_PATHS) matrixTexts.push((await read(path.join(artifactsRoot, ...parts))) || '');
      if (declaredDirectionPath) matrixTexts.push((await read(path.join(artifactsRoot, declaredDirectionPath))) || '');
      const hasMatrix = matrixTexts.some(
        (t) => t && (MATRIX_PHRASES.some((phrase) => t.toLowerCase().includes(phrase)) || MATRIX_TABLE_HEADER.test(t)),
      );
      experienceBriefState = hasMatrix ? 'present' : 'present-no-matrix';
      if (!hasMatrix) {
        findings.push({
          severity: 'WARN',
          location: path.relative(targetDir, briefPath),
          message:
            'EXPERIENCE-BRIEF.md has no object / action / state matrix — nothing records who owns each object the screen shows, so an interaction can be invented from a boolean at implementation time. (WARN: judged-screen-pattern.md is a promotion candidate.)',
          remediation:
            'Add the matrix: one row per object with owner, valid actions, states, and reverse action. Write the owner column first — an object owned by an external source grants no local action.',
          reference: 'design-principles-reviewer.md#10-experience-brief; docs/methodology/judged-screen-pattern.md § 2b',
        });
      }
    }
  }

  // ── 11. rethink → divergent concepts + a selection ADR ──────────────────────
  let conceptCount = 0;
  let selectionAdr = null;
  let attribution = null;
  if (designIntent === 'rethink') {
    conceptCount = countSectionBullets(briefText, 'Concepts');
    for (const parts of CONCEPT_DIRS) {
      conceptCount = Math.max(conceptCount, await countFilesIn(path.join(artifactsRoot, ...parts)));
    }
    const adr = await findSelectionAdr(path.join(artifactsRoot, 'decisions'));
    selectionAdr = adr.file;
    attribution = adr.attributed;
    const missingBits = [];
    if (conceptCount < 2) missingBits.push(`only ${conceptCount} divergent concept(s) recorded (need at least 2)`);
    if (!selectionAdr) missingBits.push('no selection ADR in decisions/');
    if (missingBits.length) {
      findings.push({
        severity: 'WARN',
        location: 'decisions/ + prototype/concepts/ (or a `## Concepts` list in the brief)',
        message: `design_intent is \`rethink\` but Stage 2 convergence is unevidenced — ${missingBits.join('; ')}. confident-preview-rule.md sends variant deliberation upstream to Stage 2; without a record, the convergence it presumes never happened. (WARN: judged-screen-pattern.md is a promotion candidate.)`,
        remediation:
          'Author whole-screen concepts on the same representative states, then converge with an ADR in decisions/ naming the chosen concept, the rejected ones, what the choice buys, and who chose.',
        reference: 'design-principles-reviewer.md#11-divergent-concepts; docs/methodology/judged-screen-pattern.md § 2c',
      });
    } else if (!attribution) {
      // Scope honesty: this sees whether an attribution LINE exists. It cannot
      // tell a human selector from an agent that wrote "the operator chose" —
      // claiming otherwise would be the authority bleed this pattern is about,
      // reproduced inside its own reviewer.
      findings.push({
        severity: 'WARN',
        location: `decisions/${selectionAdr}`,
        message:
          'The selection ADR does not attribute the choice to anyone. This check sees whether an attribution line is present; it cannot verify a human made the selection. (WARN: judged-screen-pattern.md is a promotion candidate.)',
        remediation:
          'Name who chose, in the ADR. A selection an agent made for itself is the agent\'s first draft with a decision record attached — see judged-screen-pattern.md § 2c and film-room decisions/0010 item 5.',
        reference: 'design-principles-reviewer.md#11-divergent-concepts; docs/methodology/judged-screen-pattern.md § 2c',
      });
    }
  }

  // ── Report line (mirrors the .md "How to report" block) ──────────────────────
  const cpState = !cpAcknowledged ? 'missing' : variantPages.length ? 'violated-by-planned-variants' : 'acknowledged';
  const summary =
    `variant=${variantNote.startsWith('greenfield') ? 'greenfield' : variantNote}; ` +
    `${designRel}; visual=${visual.present.length}/5; ` +
    `testing=${testing.missing.length ? 'incomplete' : 'present'}; ` +
    `invariants=${invariants.present.length}/4; confident-preview=${cpState}; ` +
    `three-pass=${threePassState}; peer-vs-modifier=${peerVsModifierState}; back-door-native=${backDoorNativeState}; ` +
    `design-intent=${designIntentState}; direction=${directionState}; ` +
    `experience-brief=${briefRequired ? experienceBriefState : 'not-required'}; ` +
    `concepts=${designIntent === 'rethink' ? `${conceptCount}/adr=${selectionAdr ? 'present' : 'absent'}` : 'not-required'}`;
  return finalize(findings, summary, startedAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// Self-test — `node design-principles-reviewer.mjs` exercises the gate against
// inline fixtures and exits non-zero on any failed assertion. Matches the libs'
// guarded-main pattern. Writes fixtures to a tmp dir, runs review(), cleans up.
// ─────────────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const os = await import('node:os');

  let passed = 0;
  const check = (name, cond) => {
    if (!cond) {
      console.error(`FAIL: ${name}`);
      process.exit(1);
    }
    passed += 1;
    console.log(`ok   ${name}`);
  };

  async function mkTmp() {
    return fs.mkdtemp(path.join(os.tmpdir(), 'design-principles-test-'));
  }
  async function writeFile(dir, rel, content) {
    const fp = path.join(dir, rel);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, content, 'utf8');
  }

  // Checks 10/11 (judged-screen) artifacts. Any fixture asserting PASS needs
  // these, since a missing brief or unevidenced convergence is a WARN.
  async function writeJudgedScreenArtifacts(dir, intent = 'rethink') {
    let yml = await fs.readFile(path.join(dir, 'blueprint.yml'), 'utf8').catch(() => '');
    if (!/^design_intent:/m.test(yml)) yml += `design_intent: ${intent}\n`;
    // preserve and refit work inside an existing direction, so both owe the pointer.
    if ((intent === 'preserve' || intent === 'refit') && !/^design_direction:/m.test(yml)) {
      yml += 'design_direction: "DIRECTION.md"\n';
      await writeFile(dir, 'DIRECTION.md', '# Direction\n\nThesis: the product does its job live.\n');
    }
    await writeFile(dir, 'blueprint.yml', yml);
    await writeFile(
      dir,
      'prototype/EXPERIENCE-BRIEF.md',
      `# Experience brief

## Surfaces
- home

## The job, in five questions
1. What is happening now?

## Object / action / state matrix

| Object | Owner | Valid actions | States | Reverse action |
|---|---|---|---|---|
| Task | the user | complete, edit | open, done | reopen |

## Concepts
- concept-a — a single stacked list
- concept-b — a two-column split
- concept-c — a timeline
`,
    );
    await writeFile(
      dir,
      'decisions/0001-screen-concept-selection.md',
      '# Concept selection\n\nThe operator chose concept-b. concept-a and concept-c were rejected.\n',
    );
  }

  // A complete, passing DESIGN.md fixture.
  const COMPLETE_DESIGN = `# DESIGN.md

## Visual rules
1. Match the existing product — components mirror the source app.
2. Customer terminology everywhere; no internal jargon.
3. Savings-first / positive framing on every value statement.
4. One primary action per page; secondary actions are de-emphasized.
5. Progressive disclosure for advanced settings.

## Testing baseline
Linting (eslint) + typing (tsc) run on every commit. Unit tests cover
non-trivial logic via vitest. E2E @smoke Playwright suite. Lighthouse-CI budget.
Gitleaks secret scan + Dependabot dependency updates.

## Architectural invariants
- Boundary parsing required at every input edge (library unconstrained).
- Pages declare own metadata via window.PROTO_PAGE = { id }.
- Cross-cutting concerns flow through a single Providers interface.
- One primary CTA per page promoted to a structural lint check.

## Confident preview
This portal is a stakeholder review surface, not a deliberation venue —
one confident take per route. See docs/methodology/confident-preview-rule.md.

## Planned pages
- \`home\`
- \`dashboard\`
- \`settings\`
`;

  // Fixture 1 — complete greenfield → PASS, no findings.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ntier: 1\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const res = await review({ targetDir: dir });
    check('complete greenfield → PASS', res.status === 'PASS');
    check('complete greenfield → zero findings', res.findings.length === 0);
    check('metadata.reviewer is set', res.metadata.reviewer === NAME);
    check('metadata has durationMs', typeof res.metadata.durationMs === 'number');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2 — midstream variant → PASS out-of-scope regardless of DESIGN.md.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: midstream\n');
    const res = await review({ targetDir: dir });
    check('midstream → PASS', res.status === 'PASS');
    check('midstream → out-of-scope summary', /out of scope/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 2b — brownfield via blueprintYml object (runner pre-parsed) → PASS.
  {
    const dir = await mkTmp();
    const res = await review({ targetDir: dir, blueprintYml: { variant: 'brownfield' } });
    check('brownfield (object) → PASS out-of-scope', res.status === 'PASS' && /brownfield/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3 — greenfield, no DESIGN.md → BLOCKED.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const res = await review({ targetDir: dir });
    check('no DESIGN.md → BLOCKED', res.status === 'BLOCKED');
    check('no DESIGN.md → one BLOCK finding', res.findings.length === 1 && res.findings[0].severity === 'BLOCK');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 3b — portal/DESIGN.md (alternate location) is found.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'portal/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const res = await review({ targetDir: dir });
    check('portal/DESIGN.md found → PASS', res.status === 'PASS');
    check('portal path in summary', /portal\/DESIGN\.md/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 4 — missing some visual rules + missing testing categories → BLOCKED
  // with the specific gaps named.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    // Only two visual rules named; "One primary action" is intentionally absent
    // here AND nothing in the invariants leaks a CTA mention, so the matcher must
    // report exactly 3 missing (Customer terminology, Savings-first, One primary
    // action). Invariants below avoid the "primary CTA" phrasing to keep the
    // visual-rule count honest.
    const partial = `# DESIGN.md
## Visual rules
- Match the existing product.
- Progressive disclosure.

## Architectural invariants
- Boundary parsing required.
- Pages declare own metadata via window.PROTO_PAGE.
- Single Providers interface for cross-cutting concerns.
- The single-action constraint is promoted to a structural lint check.

## Confident preview
Stakeholder review surface, one confident take per route.
`;
    await writeFile(dir, 'prototype/DESIGN.md', partial);
    const res = await review({ targetDir: dir });
    check('partial visual+testing → BLOCKED', res.status === 'BLOCKED');
    const visualF = res.findings.find((f) => /visual rule/.test(f.message));
    check('names 3 missing visual rules', visualF && /3\/5/.test(visualF.message));
    check('flags missing testing baseline', res.findings.some((f) => /Testing baseline/.test(f.message)));
    check('invariants pass (all 4 present, no invariant finding)', !res.findings.some((f) => /invariant/i.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 5 — no architectural invariants AT ALL → WARN (pre-v2 follow-up),
  // everything else present so it's WARN, not BLOCKED.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const noInvariants = COMPLETE_DESIGN
      .replace(/## Architectural invariants[\s\S]*?## Confident preview/, '## Confident preview');
    await writeFile(dir, 'prototype/DESIGN.md', noInvariants);
    const res = await review({ targetDir: dir });
    check('no invariants block → WARN (not BLOCKED)', res.status === 'WARN');
    check('WARN finding mentions predate v2', res.findings.some((f) => f.severity === 'WARN' && /predate the v2/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 6 — confident-preview not acknowledged → BLOCKED.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const noCp = COMPLETE_DESIGN.replace(/## Confident preview[\s\S]*?(?=## Planned pages)/, '');
    await writeFile(dir, 'prototype/DESIGN.md', noCp);
    const res = await review({ targetDir: dir });
    check('no confident-preview → BLOCKED', res.status === 'BLOCKED');
    check('confident-preview finding present', res.findings.some((f) => /Confident-preview rule not acknowledged/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 7 — planned variant pages → BLOCKED even though the rule is
  // acknowledged in prose.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    const withVariants = COMPLETE_DESIGN.replace(
      /## Planned pages[\s\S]*$/,
      `## Planned pages
- \`home-a\`
- \`home-b\`
- \`dashboard-modern\`
- \`settings-v2\`
`,
    );
    await writeFile(dir, 'prototype/DESIGN.md', withVariants);
    const res = await review({ targetDir: dir });
    check('planned variant pages → BLOCKED', res.status === 'BLOCKED');
    const vf = res.findings.find((f) => /Planned variant pages detected/.test(f.message));
    check('names the variant pages', vf && /home-a/.test(vf.message) && /dashboard-modern/.test(vf.message));
    check('summary reports violated-by-planned-variants', /violated-by-planned-variants/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 8 — never throws on a nonexistent targetDir; degrades to BLOCKED.
  {
    const res = await review({ targetDir: '/nonexistent/path/does/not/exist-xyz' });
    check('nonexistent targetDir → does not throw, BLOCKED', res.status === 'BLOCKED');
    await fs.rm('/tmp/__noop_design_principles', { recursive: true, force: true }).catch(() => {});
  }

  // Fixture 9 — no variant key at all → proceeds as greenfield (gates apply).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'project:\n  name: "x"\n');
    const res = await review({ targetDir: dir });
    check('no variant key → still gates (BLOCKED on missing DESIGN.md)', res.status === 'BLOCKED');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10 — no design_intent at all → WARN (never BLOCK), and undeclared is
  // NOT read as preserve.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('undeclared design_intent → WARN, not BLOCKED', res.status === 'WARN');
    check('declare-intent finding present', res.findings.some((f) => /No design_intent declared/.test(f.message)));
    check('no BLOCK findings from checks 10/11', !res.findings.some((f) => f.severity === 'BLOCK'));
    check('summary reports design-intent=undeclared', /design-intent=undeclared/.test(res.metadata.targetSummary));
    check(
      'undeclared does not demand a brief',
      !res.findings.some((f) => /no EXPERIENCE-BRIEF/.test(f.message)) && /experience-brief=not-required/.test(res.metadata.targetSummary),
    );
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10b — an unrecognized intent value is named back.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: redesign\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('unknown intent → WARN naming the value', res.findings.some((f) => /design_intent is 'redesign'/.test(f.message)));
    check('summary reports the unknown value', /design-intent=unknown \(redesign\)/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10c — preserve with a direction record that exists → PASS, no brief
  // and no concepts demanded.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\ndesign_direction: "DIRECTION.md"\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeFile(dir, 'DIRECTION.md', '# Direction\n\nThesis: the product does its job live.\n');
    const res = await review({ targetDir: dir });
    check('preserve + existing direction → PASS', res.status === 'PASS');
    check('preserve demands no brief', /experience-brief=not-required/.test(res.metadata.targetSummary));
    check('preserve demands no concepts', /concepts=not-required/.test(res.metadata.targetSummary));
    check('summary reports direction=present', /direction=present/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10d — preserve pointing at a record that does not exist → WARN.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\ndesign_direction: "DIRECTION.md"\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('preserve + dangling direction → WARN', res.status === 'WARN');
    check('dangling finding names the path', res.findings.some((f) => /points at 'DIRECTION\.md', which does not exist/.test(f.message)));
    check('summary reports direction=dangling', /direction=dangling/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10e — preserve with no design_direction at all → WARN.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: preserve\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('preserve without design_direction → WARN', res.status === 'WARN');
    check('missing-direction finding present', res.findings.some((f) => /no design_direction is declared/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10f — refit demands the brief but NOT concepts.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('refit without brief → WARN', res.status === 'WARN');
    check('refit names the intent in the finding', res.findings.some((f) => /design_intent is `refit` but there is no EXPERIENCE-BRIEF/.test(f.message)));
    check('refit also owes a direction pointer', res.findings.some((f) => /design_intent is `refit` but no design_direction is declared/.test(f.message)));
    check('refit demands no concepts', !res.findings.some((f) => /convergence is unevidenced/.test(f.message)));
    check('summary reports concepts=not-required', /concepts=not-required/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10g — refit with a brief carrying the matrix → PASS.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'refit');
    const res = await review({ targetDir: dir });
    check('refit + brief with matrix → PASS', res.status === 'PASS');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 10h — brief present but the object/action/state matrix is absent.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'refit');
    const brief = await fs.readFile(path.join(dir, 'prototype/EXPERIENCE-BRIEF.md'), 'utf8');
    await writeFile(
      dir,
      'prototype/EXPERIENCE-BRIEF.md',
      brief.replace(/## Object \/ action \/ state matrix[\s\S]*?(?=## Concepts)/, ''),
    );
    const res = await review({ targetDir: dir });
    check('brief without matrix → WARN', res.status === 'WARN');
    check('matrix finding present', res.findings.some((f) => /no object \/ action \/ state matrix/.test(f.message)));
    check('summary reports present-no-matrix', /experience-brief=present-no-matrix/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 11 — rethink without concepts → WARN naming the intent.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    const res = await review({ targetDir: dir });
    check('rethink without concepts → WARN', res.status === 'WARN');
    check('convergence finding present', res.findings.some((f) => /design_intent is `rethink` but Stage 2 convergence is unevidenced/.test(f.message)));
    check('summary reports adr=absent', /adr=absent/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 11b — concepts on disk (not in the brief) satisfy check 11.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const brief = await fs.readFile(path.join(dir, 'prototype/EXPERIENCE-BRIEF.md'), 'utf8');
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', brief.replace(/## Concepts[\s\S]*$/, ''));
    await writeFile(dir, 'prototype/concepts/concept-a.md', 'stacked list\n');
    await writeFile(dir, 'prototype/concepts/concept-b.md', 'two-column split\n');
    const res = await review({ targetDir: dir });
    check('concepts on disk → PASS', res.status === 'PASS');
    check('summary counts 2 concepts', /concepts=2\/adr=present/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 11b2 — a folder per concept counts once each; the set's README
  // is not a concept; the direction record's "Object, action, and state"
  // heading is the matrix.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const brief = await fs.readFile(path.join(dir, 'prototype/EXPERIENCE-BRIEF.md'), 'utf8');
    await writeFile(
      dir,
      'prototype/EXPERIENCE-BRIEF.md',
      brief.replace(/## Object \/ action \/ state matrix[\s\S]*?(?=## Concepts)/, '').replace(/## Concepts[\s\S]*$/, ''),
    );
    await writeFile(dir, 'DIRECTION.md', '# Direction\n\n## Object, action, and state matrix\n\n| Thing | Who | Actions |\n|---|---|---|\n| a | b | c |\n');
    await writeFile(dir, 'docs/design/concepts/README.md', 'The set.\n');
    await writeFile(dir, 'docs/design/concepts/alpha/CONCEPT.md', 'stacked list\n');
    await writeFile(dir, 'docs/design/concepts/alpha/01-alpha.png', 'x');
    await writeFile(dir, 'docs/design/concepts/beta/CONCEPT.md', 'two-column split\n');
    await writeFile(dir, 'docs/design/concepts/gamma/notes.txt', 'not a record\n');
    const res = await review({ targetDir: dir });
    check('folder-per-concept → PASS', res.status === 'PASS');
    check('summary counts 2 concept folders, not the README or the empty folder', /concepts=2\/adr=present/.test(res.metadata.targetSummary));
    check('"Object, action, and state" heading in DIRECTION.md is the matrix', !res.findings.some((f) => /no object \/ action \/ state matrix/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 11c — a selection ADR with no attribution WARNs, and the message
  // says what the check actually saw (a line, not a human).
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    await writeFile(dir, 'decisions/0001-screen-concept-selection.md', '# Concept selection\n\nconcept-b won. concept-a and concept-c were rejected.\n');
    const res = await review({ targetDir: dir });
    check('unattributed selection ADR → WARN', res.status === 'WARN');
    const af = res.findings.find((f) => /does not attribute the choice/.test(f.message));
    check('attribution finding disclaims what it proved', af && /cannot verify a human made the selection/.test(af.message));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 12 — the alternate layout (docs/design/…) is accepted everywhere:
  // brief, matrix on its own file, concepts dir, and an ADR in a subdirectory.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeFile(dir, 'docs/design/experience-brief.md', '# Experience brief\n\n## Surfaces\n- today\n');
    await writeFile(
      dir,
      'docs/design/object-action-state.md',
      '# Object / action / state\n\n| Object | Owner | Valid actions | States | Reverse action |\n|---|---|---|---|---|\n| Task | the user | complete | open, done | reopen |\n',
    );
    await writeFile(dir, 'docs/design/concepts/concept-a.md', 'stacked list\n');
    await writeFile(dir, 'docs/design/concepts/concept-b.md', 'two-column split\n');
    await writeFile(dir, 'decisions/design/0001-concept-selection.md', '# Concept selection\n\nThe operator chose concept-b; concept-a was rejected.\n');
    const res = await review({ targetDir: dir });
    check('docs/design layout → PASS', res.status === 'PASS');
    check('matrix found outside the brief', /experience-brief=present;/.test(res.metadata.targetSummary));
    check('nested ADR found', /adr=present/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 12b — the matrix may live in the record design_direction names.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\ndesign_direction: "docs/DIRECTION.md"\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeFile(dir, 'prototype/EXPERIENCE-BRIEF.md', '# Experience brief\n\n## Surfaces\n- today\n');
    await writeFile(
      dir,
      'docs/DIRECTION.md',
      '# Direction\n\n## Object / action / state matrix\n\n| Object | Owner |\n|---|---|\n| Task | the user |\n',
    );
    const res = await review({ targetDir: dir });
    check('matrix in the design_direction record → PASS', res.status === 'PASS');
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 13 — the reproduced hole: refit with a brief and NO direction record
  // used to pass while screen-composition still demanded a conformance review
  // against a record that need not exist. A § 3b requirement with no artifact
  // behind it is the same shape as the preserve/roster hole, one intent over.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: refit\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeFile(
      dir,
      'prototype/EXPERIENCE-BRIEF.md',
      '# Experience brief\n\n## Surfaces\n- today\n\n## Object / action / state matrix\n\n| Object | Owner |\n|---|---|\n| Task | the user |\n',
    );
    const res = await review({ targetDir: dir });
    check('refit + brief + no direction record → WARN, not a silent PASS', res.status === 'WARN');
    check('names the conformance consequence', res.findings.some((f) => /the conformance review has no record to read against/.test(f.message)));
    check('summary reports direction=missing', /direction=missing/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 13b — a dangling pointer is caught under ANY intent that declares
  // one, not just preserve. rethink owes no pointer, but declaring a broken one
  // is still a broken pointer.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\ndesign_direction: "gone.md"\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const res = await review({ targetDir: dir });
    check('dangling pointer under rethink → WARN', res.status === 'WARN');
    check('dangling finding names the path', res.findings.some((f) => /points at 'gone\.md', which does not exist/.test(f.message)));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Fixture 13c — rethink owes NO direction pointer; its selection ADR is the record.
  {
    const dir = await mkTmp();
    await writeFile(dir, 'blueprint.yml', 'variant: greenfield\ndesign_intent: rethink\n');
    await writeFile(dir, 'prototype/DESIGN.md', COMPLETE_DESIGN);
    await writeJudgedScreenArtifacts(dir, 'rethink');
    const res = await review({ targetDir: dir });
    check('rethink without a design_direction → PASS', res.status === 'PASS');
    check('summary reports direction=n/a', /direction=n\/a/.test(res.metadata.targetSummary));
    await fs.rm(dir, { recursive: true, force: true });
  }

  // Unit: variantFromYmlText only honors top-level scalar.
  check('variantFromYmlText reads top-level', variantFromYmlText('variant: greenfield\n') === 'greenfield');
  check('variantFromYmlText strips quotes+comment', variantFromYmlText('variant: "midstream"  # note\n') === 'midstream');
  check('variantFromYmlText ignores nested', variantFromYmlText('foo:\n  variant: brownfield\n') === null);

  console.log(`\nAll ${passed} assertions passed.`);
}
