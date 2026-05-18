// Eye path structure: M lx,cy  A rx,ryBot 0 0 1 rx,cy  A rx,ryLid 0 0 1 lx,cy  Z
// ryBot = bottom arc depth. ryLid = top lid arc depth (smaller = heavier lid = more sardonic).
// Brow path: M ox,oy  Q cx,cy  ix,iy
// Mouth path: M lx,ly  Q cx,cy  rx,ry   (control cy > endpoints = smile; < = frown)
// Eye path: M lx,cy  A rx,ryBot 0 0 1 rx,cy  A rx,ryLid 0 0 1 lx,cy  Z
// ryBot = bottom arc depth. ryLid = top lid (smaller = heavier lid). 0.5 = effectively closed.
// Glasses path: two ellipse frames + bridge, shown only for focused.
const GLASSES = 'M28,52 A12,7 0 1 0 52,52 A12,7 0 1 0 28,52 M52,52 L68,52 M68,52 A12,7 0 1 0 92,52 A12,7 0 1 0 68,52'

const EMOTIONS = {
  idle: {
    eyeL: 'M29,52 A11,6 0 0 1 51,52 A11,3 0 0 1 29,52 Z',
    eyeR: 'M69,52 A11,6 0 0 1 91,52 A11,3 0 0 1 69,52 Z',
    eyeFill: '#2a9898', glow: 'rgba(42,152,152,0.35)',  pupilScale: 0.55, glasses: 0,
    browL: 'M25,36 Q40,31 55,38',  browR: 'M65,38 Q80,34 95,38',
    mouth: 'M42,80 Q58,80 76,75',
    accent: '#2a8888'
  },
  curious: {
    eyeL: 'M29,52 A11,8 0 0 1 51,52 A11,8 0 0 1 29,52 Z',
    eyeR: 'M69,52 A11,8 0 0 1 91,52 A11,8 0 0 1 69,52 Z',
    eyeFill: '#30d0e0', glow: 'rgba(48,208,224,0.5)',   pupilScale: 1.25, glasses: 0,
    browL: 'M25,32 Q40,26 55,32',  browR: 'M65,32 Q80,26 95,32',
    mouth: 'M44,78 Q60,78 76,78',
    accent: '#3ab8d0'
  },
  focused: {
    eyeL: 'M29,52 A11,6 0 0 1 51,52 A11,2 0 0 1 29,52 Z',
    eyeR: 'M69,52 A11,6 0 0 1 91,52 A11,2 0 0 1 69,52 Z',
    eyeFill: '#1a78a8', glow: 'rgba(26,120,168,0.4)',   pupilScale: 0.35, glasses: 1,
    browL: 'M25,40 Q40,38 55,39',  browR: 'M65,39 Q80,38 95,40',
    mouth: 'M42,80 Q60,80 78,80',
    accent: '#4a90b8'
  },
  amused: {
    eyeL: 'M29,52 A11,6 0 0 1 51,52 A11,4 0 0 1 29,52 Z',
    eyeR: 'M69,52 A11,6 0 0 1 91,52 A11,4 0 0 1 69,52 Z',
    eyeFill: '#30c898', glow: 'rgba(48,200,152,0.4)',   pupilScale: 1.0,  glasses: 0,
    browL: 'M25,33 Q40,27 55,33',  browR: 'M65,33 Q80,27 95,33',
    mouth: 'M38,75 Q60,95 82,75',
    accent: '#38b890'
  },
  satisfied: {
    eyeL: 'M29,52 A11,0.5 0 0 1 51,52 A11,0.5 0 0 1 29,52 Z',
    eyeR: 'M69,52 A11,0.5 0 0 1 91,52 A11,0.5 0 0 1 69,52 Z',
    eyeFill: '#208870', glow: 'rgba(32,136,112,0.35)',  pupilScale: 0.01, glasses: 0,
    browL: 'M25,39 Q40,36 55,39',  browR: 'M65,39 Q80,36 95,39',
    mouth: 'M40,77 Q60,90 80,77',
    accent: '#70c878'
  },
  frustrated: {
    eyeL: 'M29,53 A11,5 0 0 1 51,53 A11,2 0 0 1 29,53 Z',
    eyeR: 'M69,53 A11,5 0 0 1 91,53 A11,2 0 0 1 69,53 Z',
    eyeFill: '#c03030', glow: 'rgba(192,48,48,0.5)',    pupilScale: 0.4,  glasses: 0,
    browL: 'M25,39 Q40,43 55,42',  browR: 'M65,42 Q80,43 95,39',
    mouth: 'M40,80 Q60,78 80,80',
    accent: '#f07070'
  }
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
const glassesEl = $('glasses')
const mouthEl = $('mouth')

function applyEmotion(name) {
  const e = EMOTIONS[name] || EMOTIONS.idle

  eyeL.style.d = `path("${e.eyeL}")`
  eyeR.style.d = `path("${e.eyeR}")`
  document.documentElement.style.setProperty('--eye-fill', e.eyeFill)
  document.documentElement.style.setProperty('--glow', e.glow)

  pupilL.style.transform = `scaleY(${e.pupilScale})`
  pupilR.style.transform = `scaleY(${e.pupilScale})`

  glassesEl.setAttribute('d', e.glasses ? GLASSES : '')
  glassesEl.style.opacity = e.glasses

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
    $('thought-tooltip').textContent = state.thought || ''
  }
  const action = ACTIVITY_LABELS[state.activity] ?? null
  const topicEl = $('topic-text')
  if (action) {
    topicEl.classList.remove('scrolling')
    topicEl.textContent = state.topic ? `${state.topic} · ${action}` : action
    topicEl.dataset.state = 'active'
  } else {
    const idleText = state.idle_topic || '—'
    const sep = '   ·   '
    topicEl.classList.remove('scrolling')
    topicEl.textContent = idleText
    topicEl.dataset.state = 'idle'
    requestAnimationFrame(() => {
      if (topicEl.scrollWidth <= topicEl.offsetWidth) return
      // Measure one loop unit with subpixel precision before doubling
      const ruler = document.createElement('span')
      ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:9px;font-family:ui-monospace,monospace;letter-spacing:0.03em'
      ruler.textContent = idleText + sep
      document.body.appendChild(ruler)
      const dist = ruler.getBoundingClientRect().width
      document.body.removeChild(ruler)
      topicEl.textContent = idleText + sep + idleText
      topicEl.style.setProperty('--ticker-dist', `-${dist}px`)
      topicEl.style.setProperty('--ticker-duration', `${Math.max(5, dist / 40)}s`)
      topicEl.classList.add('scrolling')
    })
  }

  const memEl = $('mem-indicator')
  memEl.classList.remove('dirty', 'pending', 'clean')
  if (state.save_requested) { memEl.classList.add('pending'); memEl.title = 'Saving next turn...' }
  else if (state.mem_state === 'dirty') { memEl.classList.add('dirty'); memEl.title = 'Save memory' }
  else if (state.mem_state === 'clean') { memEl.classList.add('clean'); memEl.title = 'Memory saved' }
  else { memEl.title = 'Save memory' }
}

// ── Mem indicator ──────────────────────────────────────────

$('mem-indicator').addEventListener('click', () => {
  if (!$('mem-indicator').classList.contains('clean')) {
    window.grimoire.saveMemory()
  }
})

// ── Gear panel ─────────────────────────────────────────────

const gearBtn   = $('gear-btn')
const gearPanel = $('gear-panel')
let activeMode = null
const activeModifiers = new Set()

// ── Panel tabs ─────────────────────────────────────────────

let activeTab = 'steer'

async function switchTab(tab) {
  document.querySelectorAll('.panel-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'))
  $(`tab-${tab}`).classList.remove('hidden')
  activeTab = tab

  if (tab === 'persona') await loadPersona()
  if (tab === 'grim')    await loadGrim()
}

document.querySelectorAll('.panel-tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
})

gearBtn.addEventListener('click', () => {
  const opening = gearPanel.classList.toggle('hidden')
  gearBtn.classList.toggle('active', !gearPanel.classList.contains('hidden'))
  if (!gearPanel.classList.contains('hidden') && activeTab !== 'steer') {
    switchTab(activeTab)
  }
})

// ── Steer ──────────────────────────────────────────────────

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

// ── Persona tab ────────────────────────────────────────────

const personaEditor = $('persona-editor')
const personaSave   = $('persona-save')

async function loadPersona() {
  try {
    personaEditor.value = await window.grimoire.readFile('persona')
  } catch (e) {
    personaEditor.value = `(error loading file: ${e.message})`
  }
}

personaSave.addEventListener('click', async () => {
  personaSave.textContent = '...'
  try {
    await window.grimoire.writeFile('persona', personaEditor.value)
    personaSave.textContent = 'Saved'
    setTimeout(() => { personaSave.textContent = 'Save' }, 1200)
  } catch (e) {
    personaSave.textContent = 'Error'
    setTimeout(() => { personaSave.textContent = 'Save' }, 1500)
  }
})

// ── Grim tab ───────────────────────────────────────────────

const grimContent = $('grim-content')

const GRIM_SECTIONS = new Set(['Observed', 'Theories', 'Open questions', 'Relationship state'])

function renderGrim(text) {
  grimContent.innerHTML = ''
  let visible = false
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      visible = GRIM_SECTIONS.has(line.slice(3))
      if (!visible) continue
      const el = document.createElement('div')
      el.className = 'grim-header'
      el.textContent = line.slice(3)
      grimContent.appendChild(el)
      continue
    }
    if (!visible) continue
    const el = document.createElement('div')
    if (line.startsWith('# ')) {
      el.className = 'grim-title'
      el.textContent = line.slice(2)
    } else if (line.startsWith('- **')) {
      el.className = 'grim-entry'
      el.textContent = line
    } else {
      el.className = 'grim-line'
      el.textContent = line
    }
    grimContent.appendChild(el)
  }
}

async function loadGrim() {
  try {
    const text = await window.grimoire.readFile('grim')
    renderGrim(text)
  } catch (e) {
    grimContent.textContent = `(error loading file: ${e.message})`
  }
}

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

// ── Thought tooltip ────────────────────────────────────────

const thoughtTooltip = $('thought-tooltip')
$('thought-bar').addEventListener('mouseenter', () => {
  if (!thoughtTooltip.textContent) return
  const bar = $('thought-bar').getBoundingClientRect()
  const widget = document.getElementById('widget').getBoundingClientRect()
  thoughtTooltip.style.bottom = (widget.bottom - bar.top + 4) + 'px'
  thoughtTooltip.style.display = 'block'
})
$('thought-bar').addEventListener('mouseleave', () => {
  thoughtTooltip.style.display = 'none'
})

// ── Init ───────────────────────────────────────────────────

applyEmotion('idle')
