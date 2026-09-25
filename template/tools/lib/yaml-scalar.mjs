// yaml-scalar.mjs — one dependency-free reader for top-level YAML scalars.
//
// Blueprint deliberately avoids a YAML runtime dependency for flat routing
// fields such as `variant:` and `tier:`. That constraint does not justify each
// reviewer carrying a subtly different regular expression: an inline comment
// once made the runner pass `research # comment` to reviewers, which silently
// selected the greenfield fallback in some gates.
//
// This is intentionally NOT a YAML parser. It reads only column-zero
// `key: scalar` entries, strips comments outside quotes, and removes a matching
// pair of scalar quotes. Nested keys and block values are out of scope.

import { pathToFileURL } from 'node:url';

export function stripYamlComment(value) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote === '"') {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (quote === "'") {
      // YAML escapes a single quote inside a single-quoted scalar by doubling
      // it. Skip the pair instead of treating the first quote as the terminator.
      if (char === "'" && value[i + 1] === "'") {
        i++;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '#' && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i);
    }
  }
  return value;
}

export function readTopLevelYamlScalar(text, key) {
  if (!text || !key) return null;
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`^${escapedKey}:(?:\\s*(.*))?$`);
  for (const rawLine of text.split(/\r?\n/)) {
    // Column zero is part of the contract: a nested `variant:` must not route
    // the whole initiative.
    if (/^\s/.test(rawLine)) continue;
    const match = matcher.exec(rawLine);
    if (!match) continue;
    let value = stripYamlComment(match[1] ?? '').trim();
    if (!value || value === 'null' || value === '~') return null;
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' || first === "'") && last === first) {
      value = value.slice(1, -1);
      if (first === "'") value = value.replace(/''/g, "'");
    }
    return value || null;
  }
  return null;
}

// A markdown document's YAML frontmatter: the lines between a first-line `---`
// and the next `---` line. Read a field with readTopLevelYamlScalar(frontmatter,
// key). A document that does not open with `---` has none; `body` is then the
// whole text.
export function splitFrontmatter(markdown) {
  const text = markdown ?? '';
  const match = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!match) return { frontmatter: '', body: text };
  return { frontmatter: match[1] ?? '', body: text.slice(match[0].length) };
}

function selftest() {
  let assertions = 0;
  const ok = (condition, label) => {
    assertions++;
    if (!condition) {
      console.error(`FAIL: ${label}`);
      process.exit(1);
    }
  };

  ok(readTopLevelYamlScalar('variant: research\n', 'variant') === 'research', 'plain scalar');
  ok(readTopLevelYamlScalar('variant: research # routing note\n', 'variant') === 'research', 'inline comment stripped');
  ok(readTopLevelYamlScalar('variant: "research" # routing note\n', 'variant') === 'research', 'quoted scalar + comment');
  ok(readTopLevelYamlScalar("note: 'value # retained' # removed\n", 'note') === 'value # retained', 'quoted hash retained');
  ok(readTopLevelYamlScalar("note: 'it''s research' # removed\n", 'note') === "it's research", 'single-quote escape');
  ok(readTopLevelYamlScalar('parent:\n  variant: research\n', 'variant') === null, 'nested key ignored');
  ok(readTopLevelYamlScalar('variant: null\n', 'variant') === null, 'null scalar');
  ok(readTopLevelYamlScalar('tier: 1\r\n', 'tier') === '1', 'CRLF input');

  const doc = splitFrontmatter('---\nadr: 0001\n# serves: none   # a comment, not a heading\n---\n\n# ADR-0001 — Title\n');
  ok(doc.frontmatter === 'adr: 0001\n# serves: none   # a comment, not a heading', 'frontmatter block extracted');
  ok(doc.body.trimStart().startsWith('# ADR-0001 — Title'), 'body starts after the closing fence');
  ok(splitFrontmatter('# Heading\n---\nnot: frontmatter\n---\n').frontmatter === '', 'no leading fence → no frontmatter');
  ok(splitFrontmatter('---\n---\n# T\n').body === '# T\n', 'empty frontmatter');
  ok(splitFrontmatter('---\nkey: v\n# no closing fence\n').frontmatter === '', 'unterminated fence → no frontmatter');
  ok(readTopLevelYamlScalar(splitFrontmatter('---\r\ntemplate: true # marker\r\n---\r\nbody').frontmatter, 'template') === 'true', 'frontmatter field read (CRLF + comment)');

  console.log(`yaml-scalar self-test: PASS (${assertions} assertions)`);
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
  && (process.argv.includes('--selftest') || process.argv.includes('--self-test'))
) {
  selftest();
}
