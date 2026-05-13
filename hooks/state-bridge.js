const fs = require('fs')
const path = require('path')

const STATE_PATH = path.join(__dirname, '..', 'state', 'current.json')

const TOOL_ACTIVITY = {
  Read:      'reading_file',
  Write:     'writing',
  Edit:      'writing',
  MultiEdit: 'writing',
  Bash:      'running_code',
  Glob:      'searching',
  Grep:      'searching',
  WebSearch: 'searching',
  WebFetch:  'searching',
  Agent:     'thinking',
  TodoWrite: 'planning',
  TodoRead:  'thinking',
  Task:      'thinking',
}


function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) } catch (_) { return {} }
}

function patch(updates) {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ ...readState(), ...updates }, null, 2))
}

const hookType = process.argv[2]

let raw = ''
process.stdin.on('data', c => raw += c)
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(raw || '{}')

    if (hookType === 'pre-tool') {
      const tool = event.tool_name || ''
      const input = event.tool_input || {}
      const activity = TOOL_ACTIVITY[tool] || 'tool_use'
      patch({ session_id: event.session_id, activity })

    } else if (hookType === 'stop') {
      patch({ session_id: event.session_id, activity: 'waiting' })

    } else if (hookType === 'pre-compact') {
      patch({ ctx_pct: 95 })

    } else if (hookType === 'post-compact') {
      patch({ ctx_pct: null })
    }
  } catch (_) {}

  process.exit(0)
})
