const { app, BrowserWindow, ipcMain } = require('electron')

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.setPath('userData', require('path').join(require('os').homedir(), '.grimoire'))
const path = require('path')
const fs = require('fs')
const os = require('os')

const MANAGED_FILES = {
  persona: path.join(os.homedir(), '.claude', 'CLAUDE.md'),
  grim:    path.join(os.homedir(), '.claude', 'persona_grim.md'),
}
const psRunner = require('./bridge/ps-runner')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 200,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('renderer/index.html')
  win.setAlwaysOnTop(true, 'screen-saver')

  const { startWatcher } = require('./bridge/watcher')
  const statePath = path.join(__dirname, 'state', 'current.json')

  let lastState = null
  startWatcher(statePath, (state) => {
    lastState = state
    if (win && !win.isDestroyed()) {
      win.webContents.send('state-update', state)
    }
  })

  // Re-send state once renderer is ready (watcher may have fired before load)
  win.webContents.on('did-finish-load', () => {
    if (lastState) win.webContents.send('state-update', lastState)
  })

  psRunner.ensure()
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  app.whenReady().then(createWindow)
  app.on('window-all-closed', () => app.quit())
}

ipcMain.on('close-window', () => {
  if (win) win.close()
})

ipcMain.handle('get-config', () => {
  const configPath = path.join(__dirname, 'grimoire.config.json')
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
})

ipcMain.on('ask', async (_, message) => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'grimoire.config.json'), 'utf8'))
    const { sendMessage } = require('./agents/index')
    const response = await sendMessage(config, message)
    if (win && !win.isDestroyed()) win.webContents.send('ask-response', response)
  } catch (err) {
    if (win && !win.isDestroyed()) win.webContents.send('ask-error', err.message)
  }
})

ipcMain.on('set-steer', (_, steer) => {
  console.log('Steer:', steer)
})

ipcMain.on('save-memory', () => {
  const statePath = path.join(__dirname, 'state', 'current.json')
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    state.save_requested = true
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
  } catch {}
})

ipcMain.on('set-always-on-top', (_, pinned) => {
  if (win) win.setAlwaysOnTop(pinned, 'screen-saver')
})

ipcMain.on('focus-terminal', () => {
  psRunner.run('Focus-Terminal')
})

ipcMain.handle('read-file', (_, key) => {
  const filePath = MANAGED_FILES[key]
  if (!filePath) throw new Error(`Unknown file key: ${key}`)
  return fs.readFileSync(filePath, 'utf8')
})

ipcMain.handle('write-file', (_, key, content) => {
  const filePath = MANAGED_FILES[key]
  if (!filePath) throw new Error(`Unknown file key: ${key}`)
  fs.writeFileSync(filePath, content, 'utf8')
})

ipcMain.on('set-theme', (_, theme) => {
  const configPath = path.join(__dirname, 'grimoire.config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  config.theme = theme
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
})

ipcMain.on('toggle-breakdown', (_, open) => {
  if (!win) return
  const b = win.getBounds()
  win.setBounds({ x: b.x, y: b.y, width: open ? 390 : 200, height: 400 })
})
