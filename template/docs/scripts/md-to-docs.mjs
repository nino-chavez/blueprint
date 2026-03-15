#!/usr/bin/env node
/**
 * Convert markdown files to HTML + Word (.docx)
 * Direct conversion — no AI rewriting. Your voice, your words.
 *
 * Usage: node scripts/md-to-docs.mjs content/my-doc.md [--out deliverables/]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import { Marked } from 'marked';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType,
} from 'docx';

const args = process.argv.slice(2);
const inputPath = args[0];
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : 'deliverables';

if (!inputPath) {
  console.error('Usage: node scripts/md-to-docs.mjs <input.md> [--out <dir>]');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const md = readFileSync(inputPath, 'utf-8');
const name = basename(inputPath, '.md');

// Strip frontmatter
const content = md.replace(/^---[\s\S]*?---\s*/, '');

// --- HTML ---
const marked = new Marked();
const htmlBody = marked.parse(content);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<style>
  :root { --fg: #1a1a1a; --bg: #fff; --accent: #2563eb; --muted: #6b7280; --border: #e5e7eb; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--fg); background: var(--bg); max-width: 860px; margin: 0 auto; padding: 3rem 2rem; line-height: 1.65; font-size: 15px; }
  h1 { font-size: 1.75rem; margin: 0 0 0.5rem; font-weight: 700; }
  h2 { font-size: 1.3rem; margin: 2rem 0 0.75rem; font-weight: 600; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
  h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; font-weight: 600; }
  p { margin: 0.6rem 0; }
  ul, ol { margin: 0.5rem 0 0.5rem 1.5rem; }
  li { margin: 0.25rem 0; }
  strong { font-weight: 600; }
  em { font-style: italic; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
  blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1rem 0; color: var(--muted); }
  code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 3px; font-size: 0.88em; }
  @media print { body { max-width: 100%; padding: 1rem; } }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

writeFileSync(join(outDir, `${name}.html`), html);
console.log(`✅ HTML: ${join(outDir, name + '.html')}`);

// --- DOCX ---
// Parse markdown into structured elements for docx
const lines = content.split('\n');
const docElements = [];
let inTable = false;
let tableRows = [];

function flushTable() {
  if (tableRows.length === 0) return;
  const rows = tableRows
    .filter(r => !r.match(/^\|[\s-:|]+\|$/)) // skip separator rows
    .map((row, idx) => {
      const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      return new TableRow({
        children: cells.map(cell => new TableCell({
          children: [new Paragraph({
            children: parseInlineFormatting(cell, idx === 0),
            spacing: { after: 40 },
          })],
          width: { size: Math.floor(9000 / Math.max(cells.length, 1)), type: WidthType.DXA },
        })),
      });
    });

  if (rows.length > 0) {
    docElements.push(new Table({
      rows,
      width: { size: 9000, type: WidthType.DXA },
    }));
    docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
  }
  tableRows = [];
  inTable = false;
}

function parseInlineFormatting(text, bold = false) {
  const runs = [];
  // Split on **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 22 }));
    } else if (part) {
      runs.push(new TextRun({ text: part, bold, size: 22 }));
    }
  }
  return runs;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Table rows
  if (line.trim().startsWith('|')) {
    inTable = true;
    tableRows.push(line.trim());
    continue;
  } else if (inTable) {
    flushTable();
  }

  // Skip frontmatter-like lines at top
  if (line.startsWith('**Type**:') || line.startsWith('**Date**:') || line.startsWith('**Status**:') || line.startsWith('**Audience**:') || line.startsWith('**Mode**:')) {
    docElements.push(new Paragraph({
      children: parseInlineFormatting(line),
      spacing: { after: 40 },
    }));
    continue;
  }

  // Headings
  if (line.startsWith('# ')) {
    docElements.push(new Paragraph({
      text: line.replace(/^# /, ''),
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
    }));
  } else if (line.startsWith('## ')) {
    docElements.push(new Paragraph({
      text: line.replace(/^## /, ''),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 120 },
    }));
  } else if (line.startsWith('### ')) {
    docElements.push(new Paragraph({
      text: line.replace(/^### /, ''),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 80 },
    }));
  }
  // Bullet points
  else if (line.match(/^- /)) {
    docElements.push(new Paragraph({
      children: parseInlineFormatting(line.replace(/^- /, '')),
      bullet: { level: 0 },
      spacing: { after: 40 },
    }));
  }
  // Numbered lists
  else if (line.match(/^\d+\. /)) {
    docElements.push(new Paragraph({
      children: parseInlineFormatting(line.replace(/^\d+\. /, '')),
      numbering: { reference: 'default-numbering', level: 0 },
      spacing: { after: 40 },
    }));
  }
  // Horizontal rule
  else if (line.match(/^---\s*$/)) {
    docElements.push(new Paragraph({
      text: '',
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
    }));
  }
  // Empty line
  else if (line.trim() === '') {
    // skip consecutive empties
  }
  // Regular paragraph
  else if (line.trim()) {
    docElements.push(new Paragraph({
      children: parseInlineFormatting(line),
      spacing: { after: 120 },
    }));
  }
}
flushTable(); // flush any trailing table

const doc = new Document({
  numbering: {
    config: [{
      reference: 'default-numbering',
      levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
    }],
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    children: docElements,
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(join(outDir, `${name}.docx`), buffer);
console.log(`✅ Word: ${join(outDir, name + '.docx')}`);
