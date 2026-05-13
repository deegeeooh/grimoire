// Base eye ry = 6. All eye animation uses scaleY relative to this.
const BASE_EYE_RY = 6

// Brow path structure: M {ox},{oy} Q {cx},{cy} {ix},{iy}
// Mouth path structure: M {lx},{ly} Q {cx},{cy} {rx},{ry}
// Smile = control point cy > endpoint y (bulges down = ∪)
// Frown = control point cy < endpoint y (bulges up = ∩)
const EMOTIONS = {
  idle:       { eyeScale: 1.0,  browL: 'M25,38 Q40,33 55,38', browR: 'M65,38 Q80,33 95,38', mouth: 'M42,78 Q60,80 78,78', accent: '#555555' },
  curious:    { eyeScale: 1.5,  browL: 'M25,34 Q40,28 55,34', browR: 'M65,34 Q80,28 95,34', mouth: 'M44,78 Q60,78 76,78', accent: '#7bb8f0' },
  focused:    { eyeScale: 0.58, browL: 'M25,39 Q40,37 55,38', browR: 'M65,38 Q80,37 95,39', mouth: 'M42,79 Q60,79 78,79', accent: '#c8a2f0' },
  amused:     { eyeScale: 1.0,  browL: 'M25,35 Q40,30 55,35', browR: 'M65,35 Q80,30 95,35', mouth: 'M40,76 Q60,92 80,76', accent: '#f0c060' },
  skeptical:  { eyeScale: 0.83, browL: 'M25,35 Q40,30 55,35', browR: 'M65,39 Q80,37 95,36', mouth: 'M42,77 Q60,82 78,79', accent: '#909090' },
  satisfied:  { eyeScale: 0.58, browL: 'M25,38 Q40,35 55,38', browR: 'M65,38 Q80,35 95,38', mouth: 'M42,76 Q60,88 78,76', accent: '#70c878' },
  frustrated: { eyeScale: 0.67, browL: 'M25,36 Q40,43 55,45', browR: 'M65,45 Q80,43 95,36', mouth: 'M42,83 Q60,76 78,83', accent: '#f07070' },
  surprised:  { eyeScale: 1.83, browL: 'M25,31 Q40,25 55,31', browR: 'M65,31 Q80,25 95,31', mouth: 'M48,77 Q60,91 72,77', accent: '#f0d470' },
  concerned:  { eyeScale: 1.17, browL: 'M25,42 Q40,36 55,34', browR: 'M65,34 Q80,36 95,42', mouth: 'M42,81 Q60,77 78,81', accent: '#f0a060' }
}

const ACTIVITY_LABELS = {
  idle:         null,
  waiting:      null,
  reading_file: 'reviewing',
  writing:      'editing',
  thinking:     'thinking',
  planning:     'planning',
  running_code: 'running',
  searching:    'exploring',
  tool_use:     'working',
}


const $ = id => document.getElementById(id)
const eyeL    = $('eye-l'),   eyeR    = $('eye-r')
const pupilL  = $('pupil-l'), pupilR  = $('pupil-r')
const browL   = $('brow-l'),  browR   = $('brow-r')
const mouthEl = $('mouth')

function applyEmotion(name) {
  const e = EMOTIONS[name] || EMOTIONS.idle

  // Eye scale — uses CSS transform so transitions fire
  const s = e.eyeScale
  eyeL.style.transform   = `scaleY(${s})`
  eyeR.style.transform   = `scaleY(${s})`
  pupilL.style.transform = `scaleY(${s})`
  pupilR.style.transform = `scaleY(${s})`

  // Path morphing via CSS d property (Chromium supports this)
  browL.style.d   = `path("${e.browL}")`
  browR.style.d   = `path("${e.browR}")`
  mouthEl.style.d = `path("${e.mouth}")`

  document.documentElement.style.setProperty('--accent', e.accent)
}

function applyState(state) {
  if (!state) return
  applyEmotion(state.emotion || 'idle')

  const pct = state.ctx_pct ?? null
  const showCtx = pct !== null && pct >= 80
  $('title-label').textContent = showCtx ? `ctx: ${pct}%` : 'Grimoire'
  $('title-label').style.color = showCtx ? '#f07070' : ''

  if (state.project_name !== undefined) {
    const cpct = state.completion_pct ?? null
    $('project-name-text').textContent = state.project_name || '—'
    $('completion-pct').textContent = cpct !== null ? `- ${cpct}%` : ''
  }
  if (state.project_desc !== undefined) {
    $('project-desc-text').textContent = state.project_desc || ''
  }
  $('project-text').textContent = state.project_line || '—'

  if (state.thought !== undefined) {
    $('thought-text').textContent = state.thought ? `» ${state.thought}` : '—'
  }
  const action = ACTIVITY_LABELS[state.activity] ?? null
  const topicEl = $('topic-text')
  if (action) {
    topicEl.textContent = state.topic ? `${state.topic} · ${action}` : action
    topicEl.dataset.state = 'active'
  } else {
    topicEl.textContent = state.idle_topic || '—'
    topicEl.dataset.state = 'idle'
  }

  const memEl = $('mem-indicator')
  memEl.classList.remove('dirty', 'clean')
  if (state.mem_state === 'dirty') memEl.classList.add('dirty')
  else if (state.mem_state === 'clean') memEl.classList.add('clean')
}

// ── Mem indicator ──────────────────────────────────────────

$('mem-indicator').addEventListener('click', () => {
  if ($('mem-indicator').classList.contains('dirty')) {
    window.grimoire.saveMemory()
  }
})

// ── Gear panel ─────────────────────────────────────────────

const gearBtn   = $('gear-btn')
const gearPanel = $('gear-panel')
let activeMode = null
const activeModifiers = new Set()

gearBtn.addEventListener('click', () => {
  gearPanel.classList.toggle('hidden')
  gearBtn.classList.toggle('active')
})

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'))
    if (activeMode === mode) {
      activeMode = null
    } else {
      activeMode = mode
      btn.classList.add('active')
    }
    window.grimoire.setSteer({ mode: activeMode, modifiers: [...activeModifiers] })
  })
})

document.querySelectorAll('.modifier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const m = btn.dataset.modifier
    if (activeModifiers.has(m)) {
      activeModifiers.delete(m)
      btn.classList.remove('active')
    } else {
      activeModifiers.add(m)
      btn.classList.add('active')
    }
    window.grimoire.setSteer({ mode: activeMode, modifiers: [...activeModifiers] })
  })
})

// ── Ask ────────────────────────────────────────────────────

const askInput   = $('ask-input')
const askOverlay = $('ask-overlay')
const askResp    = $('ask-response')

askInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return
  const msg = askInput.value.trim()
  if (!msg) return
  window.grimoire.ask(msg)
  askInput.value = ''
  askResp.textContent = '...'
  askOverlay.classList.remove('hidden')
  gearPanel.classList.add('hidden')
  gearBtn.classList.remove('active')
})

askOverlay.addEventListener('click', () => askOverlay.classList.add('hidden'))

window.grimoire.onAskResponse(response => { askResp.textContent = response })
window.grimoire.onAskError(err => { askResp.textContent = `(${err})` })

// ── State bridge ───────────────────────────────────────────

window.grimoire.onStateUpdate(applyState)

// ── Pin toggle ─────────────────────────────────────────────

let pinned = true
$('pin-btn').addEventListener('click', () => {
  pinned = !pinned
  window.grimoire.setAlwaysOnTop(pinned)
  $('pin-btn').classList.toggle('active', pinned)
})

// ── Focus terminal ─────────────────────────────────────────

$('focus-btn').addEventListener('click', () => window.grimoire.focusTerminal())

// ── Close ──────────────────────────────────────────────────

$('close-btn').addEventListener('click', () => window.grimoire.closeWindow())

// ── Init ───────────────────────────────────────────────────

applyEmotion('idle')
