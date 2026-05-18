// Targeted insert into persona_grim.md without rewriting the whole file.
// Usage:
//   append to end of a section (insert before next section header):
//     '{"before":"## Theories","content":"- New observation."}' | node hooks/append-memory.js
//
//   prepend to start of a section (insert after header — for session log):
//     '{"after":"## Session log (most recent first)","content":"\n- 2026-05-19: entry"}' | node hooks/append-memory.js
//
// For content with em-dashes or apostrophes, use PowerShell here-string:
//     @'
//     {"before":"## Theories","content":"- Pepijn's observation — filed."}
//     '@ | node hooks/append-memory.js

const fs = require('fs')
const path = require('path')
const os = require('os')

const PERSONA_FILE = path.join(os.homedir(), '.claude', 'persona_grim.md')

let input = ''
process.stdin.on('data', d => input += d)
process.stdin.on('end', () => {
  try {
    const op = JSON.parse(input.replace(/^﻿/, '').trim())
    const text = fs.readFileSync(PERSONA_FILE, 'utf8').replace(/\r\n/g, '\n')
    const lines = text.split('\n')

    const marker = op.before !== undefined ? op.before : op.after
    const idx = lines.findIndex(l => l.startsWith(marker))
    if (idx === -1) { process.stderr.write(`Marker not found: ${marker}\n`); process.exit(1) }

    let insertAt
    if (op.after !== undefined) {
      insertAt = idx + 1
    } else {
      // Insert before any blank lines that precede the section header
      insertAt = idx
      while (insertAt > 0 && lines[insertAt - 1].trim() === '') insertAt--
    }

    lines.splice(insertAt, 0, ...op.content.split('\n'))

    fs.writeFileSync(PERSONA_FILE, lines.join('\n'), 'utf8')
    process.stdout.write('ok\n')
  } catch (e) {
    process.stderr.write(e.message + '\n')
    process.exit(1)
  }
})
