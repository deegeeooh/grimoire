# Grimoire — Installation Guide

Grimoire is an Electron widget that sits alongside Claude Code and shows a live view of what the AI is doing — its current focus, emotional state, and observations about you. The AI drives the display; you watch it work.

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- [Node.js](https://nodejs.org/) v18 or later
- Windows 10/11 (current version is Windows-only)

---

## 1. Get the files

Clone or download the repository into a local folder. Avoid paths under OneDrive or other sync folders — Electron has file locking issues with them.

```
C:\Users\YourName\Documents\ClaudeCode\grimoire\
```

Then install dependencies:

```powershell
cd C:\Users\YourName\Documents\ClaudeCode\grimoire
npm install
```

---

## 2. Set up your global Claude config

Claude Code loads `~/.claude/CLAUDE.md` at the start of every session, in every project. This is where you tell the AI to load Grimoire's rules.

Open (or create) `C:\Users\YourName\.claude\CLAUDE.md` and add the following imports, adjusting the paths to match where you installed Grimoire:

```
@C:/Users/YourName/Documents/ClaudeCode/grimoire/character.md

@C:/Users/YourName/Documents/ClaudeCode/grimoire/persona-rules.md

@C:/Users/YourName/Documents/ClaudeCode/grimoire/CLAUDE.md

@C:/Users/YourName/.claude/persona_grim.md

@C:/Users/YourName/.claude/system-rules.md
```

**What each file does:**

| File | Ships with Grimoire | Purpose |
|------|-------------------|---------|
| `character.md` | Yes | Grim's personality — sardonic, dry, warm undercurrent. **Skip this if you already have your own Claude persona.** |
| `persona-rules.md` | Yes | Rules for studying and building a profile of you over time |
| `CLAUDE.md` (grimoire) | Yes | Grimoire mechanics — state fields, emotion rules, hooks |
| `persona_grim.md` | No — you create it | Your personal profile. Starts blank, fills up over sessions. |
| `system-rules.md` | No — you create it | Your environment-specific rules (optional) |

---

## 3. Create your personal files

### Persona file

Create `C:\Users\YourName\.claude\persona_grim.md` with this starting structure:

```markdown
# Grim — [Your Name]

Living character study. Not a fact sheet.

## Thought bank

## Observed

## Theories

## Open questions

## Relationship state

## Session log
```

This file is yours — it won't be overwritten by Grimoire updates. The AI fills it in over time.

### System rules (optional)

Create `C:\Users\YourName\.claude\system-rules.md` for any environment-specific rules — shell preferences, tool paths, things specific to your machine. Leave it empty or skip the import line if you don't need it.

---

## 4. Configure Grimoire (optional)

Copy `grimoire.config.json.example` to `grimoire.config.json` and fill in:

```json
{
  "agent": {
    "apiKey": "sk-ant-...",
    "model": "claude-opus-4-7"
  }
}
```

The API key is only needed for the **Ask** feature (type a question directly in the widget). Core widget behavior — face animation, state display, emotion tracking — works without it.

---

## 5. Start Grimoire

```powershell
$exe = "C:\Users\YourName\Documents\ClaudeCode\grimoire\node_modules\electron\dist\electron.exe"
Start-Process -FilePath $exe -ArgumentList "." -WorkingDirectory "C:\Users\YourName\Documents\ClaudeCode\grimoire"
```

Or add this to a startup script. Grimoire also auto-starts when Claude Code begins a new session (via the `UserPromptSubmit` hook), so you may not need to launch it manually.

---

## 6. Hook setup

Grimoire uses Claude Code hooks to update the display automatically. Add the following to `~/.claude/settings.json` (global Claude Code settings):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/YourName/Documents/ClaudeCode/grimoire/hooks/session-init.js"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/YourName/Documents/ClaudeCode/grimoire/hooks/state-bridge.js pre-tool"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/YourName/Documents/ClaudeCode/grimoire/hooks/state-bridge.js stop"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/YourName/Documents/ClaudeCode/grimoire/hooks/state-bridge.js pre-compact"
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/YourName/Documents/ClaudeCode/grimoire/hooks/state-bridge.js post-compact"
          }
        ]
      }
    ]
  }
}
```

---

## How it works

Once running, Grimoire reads `state/current.json` every 150ms. The AI writes to this file — via the hooks automatically, and via its own judgment for things like emotion, observations, and sardonic commentary. You don't configure the AI's behavior directly; the imported rule files handle that.

The floppy disk icon (orange) in the top bar signals that memory is available to save. Clicking it tells the AI to write its current observations to your persona file. It turns green when done, then back to orange when new work starts.

---

## Reverting

All original files are backed up with a `.bak` extension alongside the originals. If something goes wrong, copy `.bak` back to the original filename.
