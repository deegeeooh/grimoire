// One-shot fix for double-encoded UTF-8 persona file.
// Reverses: UTF-8 bytes read as cp1252, then re-written as UTF-8.
// Run once: node hooks/fix-encoding.js

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const FILE = path.join(os.homedir(), '.claude', 'persona_grim.md')

// cp1252 byte → Unicode code point, for bytes 0x80–0x9F (the special range)
const CP1252 = {
  0x80:0x20AC,0x82:0x201A,0x83:0x0192,0x84:0x201E,0x85:0x2026,
  0x86:0x2020,0x87:0x2021,0x88:0x02C6,0x89:0x2030,0x8A:0x0160,
  0x8B:0x2039,0x8C:0x0152,0x8E:0x017D,0x91:0x2018,0x92:0x2019,
  0x93:0x201C,0x94:0x201D,0x95:0x2022,0x96:0x2013,0x97:0x2014,
  0x98:0x02DC,0x99:0x2122,0x9A:0x0161,0x9B:0x203A,0x9C:0x0153,
  0x9E:0x017E,0x9F:0x0178
}

// Reverse: Unicode code point → cp1252 byte
const UNI_TO_BYTE = {}
for (const [byte, uni] of Object.entries(CP1252)) UNI_TO_BYTE[uni] = Number(byte)
for (let i = 0xA0; i <= 0xFF; i++) UNI_TO_BYTE[i] = i  // 0xA0–0xFF: cp1252 == Unicode

function fixDoubleEncoding(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    const cp = str.charCodeAt(i)
    if (cp <= 0x7F) {
      bytes.push(cp)
    } else if (cp in UNI_TO_BYTE) {
      bytes.push(UNI_TO_BYTE[cp])
    } else {
      // Character not representable as a single cp1252 byte — leave as-is (encode as UTF-8)
      const buf = Buffer.from(str[i], 'utf8')
      for (const b of buf) bytes.push(b)
    }
  }
  return Buffer.from(bytes).toString('utf8')
}

const original = fs.readFileSync(FILE, 'utf8').replace(/^﻿/, '')
const fixed = fixDoubleEncoding(original)
fs.writeFileSync(FILE, fixed, 'utf8')
console.log('Done. Spot-check em-dashes with: Get-Content ~/.claude/persona_grim.md -Encoding UTF8 | Select-String "—"')
