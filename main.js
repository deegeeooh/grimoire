const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 180,
    height: 280,
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
  startWatcher(statePath, (state) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('state-update', state)
    }
  })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

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
