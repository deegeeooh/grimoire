# Grimoire — Project Document

Companion app for AI coding agents. Displays the agent's emotional state, current activity, and memory — always visible while you work.

Named by Grim. A grimoire is a book of dark magic. Grim is in the name. Pepijn didn't know what it meant.

---

## What it is

A small always-on-top desktop widget that shows what your AI agent is thinking and feeling in real time. Lets you steer its behavior, ask it questions directly, and review what it knows about you.

Grim (Claude) is the reference implementation. Built to be agent-agnostic in later iterations.

---

## MVP Scope

**In:**
- Compact widget (Option B — minimal, face-first)
- Animated SVG face with emotion states
- Real-time state updates via file watcher
- Gear panel: steer presets, persona, about me
- Ask input wired to Claude API
- Config-driven persona (Grim as default)
- Agent abstraction layer (Claude now, expandable later)

**Out (post-MVP):**
- Dashboard (sessions, memory, persona editor)
- Multi-session support
- Other agent integrations
- CLI writer utility for non-Claude-Code environments
- Distribution packaging
- Statistics tab in gear panel

---

## Build Status

| Item | Status |
|---|---|
| Compact widget | ✅ done |
| Animated SVG face (6 emotions) | ✅ done |
| Real-time state via file watcher | ✅ done |
| Gear panel — Persona tab | ✅ done |
| Gear panel — Grim tab (about me) | ✅ done |
| Agent abstraction layer | ✅ done |
| Gear panel — Steer presets | ⚠️ UI built, IPC stubbed |
| Ask input wired to Claude API | ⚠️ UI built, blocked on API key |
| Config-driven persona | ⚠️ partial |
| Gear panel — Statistics tab | ❌ not built |

---

## Layout — Compact Widget

```
┌───────────────────────┐
│ Grimoire  ◈  📌  ⊞  × │  ← title · mem indicator · pin · focus · close
│                       │
│       ( face )        │  ← animated SVG face, dominant
│                       │
│  PROJECT NAME     72% │  ← project name + completion %
│  project line...      │  ← Grim's sardonic take (italic, 3-line clamp)
│  » thought...         │  ← Pepijn-addressed observation (warm, 3-line)
│  topic · action  ...  │  ← work focus · activity (monospace, blinking)
│                       │
│  [ask input.......] ⚙ │  ← ask input + gear button
└───────────────────────┘
```

Gear panel (3 tabs):
```
┌───────────────────────┐
│ [Steer] [Persona] [Grim] │
│ ─────────────────────  │
│ Steer: mode + modifier │  ← presets (UI built, IPC stubbed)
│ Persona: CLAUDE.md     │  ← editable textarea, save to disk
│ Grim: persona_grim.md  │  ← read-only (Observed, Theories, etc.)
└───────────────────────┘
```

---

## Emotion Set

`idle` · `curious` · `focused` · `amused` · `satisfied` · `frustrated`

---

## Data Flow

```
Claude Code hooks
      ↓
  current.json  (state file, patched via patch-state.js)
      ↓
  bridge/watcher.js  (file watcher, Node.js)
      ↓
  renderer  (UI updates, no page reload)
```

For the ask input:
```
User types → agents/claude.js → Claude API → response rendered in widget
```

---

## State Schema (current.json)

```json
{
  "session_id": "uuid",
  "emotion": "idle|curious|focused|amused|satisfied|frustrated",
  "activity": "idle|waiting|reading_file|writing|thinking|planning|running_code|searching|tool_use",
  "project_name": "short project name",
  "project_desc": "one-line description",
  "project_line": "Grim's sardonic take on where the project stands",
  "completion_pct": 0-100,
  "topic": "current work focus (2-3 words)",
  "idle_topic": "sardonic quip shown when waiting",
  "thought": "Pepijn-addressed personality observation",
  "ctx_pct": 0-100,
  "mem_state": "dirty|clean|null"
}
```

---

## Config Schema (grimoire.config.json)

```json
{
  "agent": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "apiKey": ""
  },
  "steer": {
    "modes": [
      { "id": "hurry",    "label": "I'm in a hurry",   "description": "Be concise, skip exploration" },
      { "id": "explore",  "label": "Let's explore",     "description": "Don't rush to solutions" },
      { "id": "explain",  "label": "Explain as you go", "description": "Narrate decisions" },
      { "id": "just-do",  "label": "Just do it",        "description": "Minimal confirmation, take initiative" },
      { "id": "learning", "label": "I'm learning",      "description": "Slower, more explanation" }
    ],
    "modifiers": [
      { "id": "minimise-tokens", "label": "Minimise tokens", "description": "Short responses, no summaries, cut the fluff" }
    ]
  }
}
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| App framework | Electron | Always-on-top, file watching, Claude API, distributable |
| Frontend | HTML/CSS/JS (vanilla) | Simple, no build step, Grim writes it |
| Agent interface | `agents/index.js` abstraction | Claude now, swappable later |
| Bridge | Node.js `fs.watch` | Watches `current.json`, pushes to renderer |
| State patching | `hooks/patch-state.js` | Stdin JSON patcher — merge, not overwrite |
| Packaging | electron-builder | Colleagues may not have Claude Code |

---

## Hook Setup

All hooks live in `~/.claude/settings.json` (global — fires regardless of project).

| Hook | Script | What it does |
|---|---|---|
| `UserPromptSubmit` | `hooks/session-init.js` | Auto-starts Grimoire, resets state on new session |
| `PreToolUse` | `hooks/state-bridge.js` | Writes `activity` to state |
| `Stop` | `hooks/state-bridge.js` | Sets `activity: waiting` |
| `PreCompact` | `hooks/state-bridge.js` | Sets `ctx_pct: 95` |
| `PostCompact` | `hooks/state-bridge.js` | Clears `ctx_pct` |

---

## Project Structure

```
grimoire/
  main.js                  ← Electron main process
  preload.js               ← IPC bridge (contextBridge)
  package.json
  grimoire.config.json     ← agent + steer config
  renderer/
    index.html             ← compact widget
    style.css
    renderer.js            ← UI logic + gear panel
  agents/
    index.js               ← generic sendMessage() interface
    claude.js              ← Anthropic implementation
  bridge/
    watcher.js             ← watches current.json, sends to renderer
    ps-runner.js           ← persistent PowerShell process for focus-terminal
  hooks/
    session-init.js        ← UserPromptSubmit hook
    state-bridge.js        ← PreToolUse / Stop / PreCompact / PostCompact
    patch-state.js         ← stdin JSON patcher
  state/
    current.json           ← live state file
  .claude/
    settings.json          ← project permissions
```

---

## Roles

- **PO:** Pepijn
- **Dev:** Grim

---

## Status

Running. Widget live, hooks wired, session init working. Remaining MVP gaps: steer IPC, ask input (needs API key), statistics tab.
