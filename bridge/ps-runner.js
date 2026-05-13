const { spawn } = require('child_process')
const { writeFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')

const INIT_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$script:cachedTermPid = $null
function Focus-Terminal {
  if ($script:cachedTermPid) {
    $cached = Get-Process -Id $script:cachedTermPid -ErrorAction SilentlyContinue
    if ($cached -and $cached.MainWindowHandle -ne [IntPtr]::Zero) {
      [Win32]::ShowWindowAsync($cached.MainWindowHandle, 9)
      [Win32]::SetForegroundWindow($cached.MainWindowHandle)
      return
    }
    $script:cachedTermPid = $null
  }
  $target = Get-Process -Name 'WindowsTerminal' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($target) {
    $script:cachedTermPid = $target.Id
    [Win32]::ShowWindowAsync($target.MainWindowHandle, 9)
    [Win32]::SetForegroundWindow($target.MainWindowHandle)
  }
}
Write-Host "GRIMOIRE_READY"
`

const initPath = join(tmpdir(), 'grimoire-ps-init.ps1')
writeFileSync(initPath, INIT_SCRIPT, 'utf8')

let proc = null
let ready = false
const queue = []

function ensure() {
  if (proc && !proc.killed) return

  proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '-'], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  ready = false

  proc.stdout.on('data', chunk => {
    if (!ready && chunk.toString().includes('GRIMOIRE_READY')) {
      ready = true
      while (queue.length) proc.stdin.write(queue.shift())
    }
  })

  proc.on('exit', () => { proc = null; ready = false })

  proc.stdin.write(`. '${initPath}'\n`)
}

function run(cmd) {
  ensure()
  const line = cmd + '\n'
  if (ready) proc.stdin.write(line)
  else queue.push(line)
}

module.exports = { ensure, run }
