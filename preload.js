const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('grimoire', {
  onStateUpdate: (cb) => ipcRenderer.on('state-update', (_, state) => cb(state)),
  onAskResponse: (cb) => ipcRenderer.on('ask-response', (_, response) => cb(response)),
  onAskError:    (cb) => ipcRenderer.on('ask-error',    (_, err)      => cb(err)),
  ask:           (msg)   => ipcRenderer.send('ask', msg),
  setSteer:      (steer) => ipcRenderer.send('set-steer', steer),
  closeWindow:   ()       => ipcRenderer.send('close-window'),
  getConfig:     ()       => ipcRenderer.invoke('get-config'),
  setAlwaysOnTop:(pinned) => ipcRenderer.send('set-always-on-top', pinned),
  focusTerminal: ()       => ipcRenderer.send('focus-terminal'),
  saveMemory:    ()       => ipcRenderer.send('save-memory'),
  readFile:       (key)            => ipcRenderer.invoke('read-file', key),
  writeFile:      (key, content)   => ipcRenderer.invoke('write-file', key, content),
  toggleBreakdown:(open)           => ipcRenderer.send('toggle-breakdown', open)
})
