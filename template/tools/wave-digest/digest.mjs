#!/usr/bin/env node
// Wave-log digest — parse the `## Wave log` section of a CLAUDE.md and emit
// a filtered digest. See template/tools/wave-digest/README.md for usage.
//
// No dependencies. Run with: node digest.mjs [flags]

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'

const args = Object.fromEntries(
  argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.length ? v.join('=') : true]
    })
)

const sourcePath = resolve(args.source || `${cwd()}/CLAUDE.md`)
const sinceN = args.since ? parseInt(args.since, 10) : 0
const keywordRe = args.keyword ? new RegExp(args.keyword, 'i') : null
const format = args.format || 'markdown'

if (!existsSync(sourcePath)) {
  console.error(`error: CLAUDE.md not found at ${sourcePath}`)
  console.error(`hint: pass --source=PATH to point at a different file`)
  exit(1)
}

const content = readFileSync(sourcePath, 'utf8')

// Extract the `## Wave log` section: from the heading to the next `## ` heading (or EOF)
const startMatch = content.match(/(?:^|\n)## Wave log[ \t]*\n/)
if (!startMatch) {
  console.error(`error: no "## Wave log" section found in ${sourcePath}`)
  exit(1)
}
const startIdx = startMatch.index + startMatch[0].length
const afterStart = content.slice(startIdx)
const endMatch = afterStart.match(/\n## /)
const sectionBody = endMatch ? afterStart.slice(0, endMatch.index) : afterStart

// Parse wave entries — each bullet starts with `- Wave N`
const entries = sectionBody
  .split(/\n(?=- Wave \d)/)
  .map(s => s.trim())
  .filter(s => s.startsWith('- Wave '))
  .map(body => {
    const m = body.match(/^- Wave (\d+)/)
    if (!m) return null
    // Trim trailing prose paragraphs that follow the last wave (anything after a blank line)
    const firstParagraph = body.split(/\n\n/)[0]
    return { n: parseInt(m[1], 10), body: firstParagraph }
  })
  .filter(Boolean)
  .sort((a, b) => a.n - b.n)

// Filter
const filtered = entries.filter(e => {
  if (e.n < sinceN) return false
  if (keywordRe && !keywordRe.test(e.body)) return false
  return true
})

// Render
const out = []
const header = `Wave log digest — ${filtered.length} of ${entries.length} entries`
out.push(format === 'markdown' ? `# ${header}` : header)
out.push('')

const filters = []
if (sinceN) filters.push(`since wave ${sinceN}`)
if (keywordRe) filters.push(`keyword /${keywordRe.source}/i`)
if (filters.length) {
  out.push(format === 'markdown' ? `**Filters**: ${filters.join(', ')}` : `Filters: ${filters.join(', ')}`)
  out.push('')
}

out.push(`**Source**: ${sourcePath}`)
out.push('')

for (const e of filtered) {
  out.push(e.body)
  out.push('')
}

console.log(out.join('\n'))
