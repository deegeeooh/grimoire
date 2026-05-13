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
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
$script:cachedTermPid = $null
function Show-Window {
  param($hwnd)
  if ([Win32]::IsIconic($hwnd)) { [Win32]::ShowWindowAsync($hwnd, 9) }
  elseif ([Win32]::IsZoomed($hwnd)) { [Win32]::ShowWindowAsync($hwnd, 3) }
  else { [Win32]::ShowWindowAsync($hwnd, 5) }
  [Win32]::keybd_event(0x12, 0, 0x0001, [UIntPtr]::Zero)
  [Win32]::SwitchToThisWindow($hwnd, $true)
  [Win32]::SetForegroundWindow($hwnd) | Out-Null
  [Win32]::keybd_event(0x12, 0, 0x0003, [UIntPtr]::Zero)
}
function Focus-Terminal {
  if ($script:cachedTermPid) {
    $cached = Get-Process -Id $script:cachedTermPid -ErrorAction SilentlyContinue
    if ($cached -and $cached.MainWindowHandle -ne [IntPtr]::Zero) {
      Show-Window $cached.MainWindowHandle
      return
    }
    $script:cachedTermPid = $null
  }
  $target = Get-Process -Name 'WindowsTerminal' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($target) {
    $script:cachedTermPid = $target.Id
    Show-Window $target.MainWindowHandle
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
