const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const STAMP_FILE = path.join(os.tmpdir(), 'grim-session.stamp');
const STATE_FILE = 'C:\\Users\\Pepijn.Bakker\\Documents\\ClaudeCode\\grimoire\\state\\current.json';
const GRIMOIRE_DIR = 'C:\\Users\\Pepijn.Bakker\\Documents\\ClaudeCode\\grimoire';
const ELECTRON_EXE = path.join(GRIMOIRE_DIR, 'node_modules', 'electron', 'dist', 'electron.exe');

function isNewSession(sessionId) {
  try {
    return fs.readFileSync(STAMP_FILE, 'utf8').trim() !== sessionId;
  } catch {
    return true;
  }
}

function isGrimoireRunning() {
  try {
    return execSync('tasklist /FI "IMAGENAME eq electron.exe" /NH', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).includes('electron.exe');
  } catch {
    return false;
  }
}

function startGrimoire() {
  try {
    spawn(ELECTRON_EXE, ['.'], { cwd: GRIMOIRE_DIR, detached: true, stdio: 'ignore' }).unref();
  } catch {}
}

function patchState(patch) {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    Object.assign(state, patch);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch {}

  const sessionId = event.session_id || String(Date.now());

  if (!isGrimoireRunning()) startGrimoire();

  if (isNewSession(sessionId)) {
    fs.writeFileSync(STAMP_FILE, sessionId);
    patchState({ activity: 'waiting', emotion: 'idle' });
  }

  process.exit(0);
});
