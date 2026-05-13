const fs = require('fs');

const STATE_FILE = 'C:\\Users\\Pepijn.Bakker\\Documents\\ClaudeCode\\grimoire\\state\\current.json';

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const patch = JSON.parse(raw.replace(/^﻿/, ''));
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    Object.assign(state, patch);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    process.stderr.write(e.message + '\n');
    process.exit(1);
  }
});
