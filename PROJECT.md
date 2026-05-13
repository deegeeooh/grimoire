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
- Gear panel: steer presets, persona, about me, statistics
- Ask input wired to Claude API
- Config-driven persona (Grim as default)
- Agent abstraction layer (Claude now, expandable later)

**Out (post-MVP):**
- Dashboard (sessions, memory, persona editor)
- Multi-session support
- Other agent integrations
- CLI writer utility for non-Claude-Code environments
- Distribution packaging

---

## Layout — Compact Widget (Option B)

```
┌───────────────────┐
│ [ctx: 14%]  [💾]  │  ← context health + memory save indicator
│                   │
│    ( face )       │  ← animated SVG face, dominant
│                   │
│  skeptical        │  ← emotion label
│  this fn is...    │  ← thought line (truncated)
│                   │
│ [ask input..] [⚙] │  ← ask input + gear icon
└───────────────────┘
```

Gear panel (overlay):
```
┌───────────────────┐
│ [hurry][explore]  │  ← mode presets (mutually exclusive)
│ [explain][just do]│
│ [learning]        │
│ [minimise tokens] │  ← modifier presets (stackable)
│ ───────────────── │
│ [persona...]      │  → persona settings
│ [about me...]     │  → memory view (what Grim knows about you)
│ [statistics...]   │  → session stats
└───────────────────┘
```

---

## Emotion Set

`idle` · `curious` · `focused` · `amused` · `skeptical` · `satisfied` · `frustrated` · `surprised` · `concerned`

---

## Data Flow

```
Claude Code hooks
      ↓
  current.json  (state file, overwritten each tick)
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
  "emotion": "skeptical",
  "intensity": 0.6,
  "activity": "reading_file",
  "thought": "this function is doing way too much",
  "ctx_pct": 14
}
```

---

## Config Schema (grimoire.config.json)

```json
{
  "persona": {
    "name": "Grim",
    "emotions": ["idle", "curious", "focused", "amused", "skeptical", "satisfied", "frustrated", "surprised", "concerned"]
  },
  "agent": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "apiKey": ""
  },
  "steer": {
    "modes": [
      { "id": "hurry", "label": "I'm in a hurry", "description": "Be concise, skip exploration" },
      { "id": "explore", "label": "Let's explore", "description": "Don't rush to solutions" },
      { "id": "explain", "label": "Explain as you go", "description": "Narrate decisions" },
      { "id": "just-do", "label": "Just do it", "description": "Minimal confirmation, take initiative" },
      { "id": "learning", "label": "I'm learning", "description": "Slower, more explanation" }
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
| Packaging | electron-builder | Colleagues may not have Claude Code |

---

## Project Structure

```
grimoire/
  main.js                  ← Electron main process
  package.json
  grimoire.config.json     ← persona + agent + steer config
  renderer/
    index.html             ← compact widget
    style.css
    renderer.js            ← UI logic + gear panel
    face.svg               ← SVG face
  agents/
    index.js               ← generic sendMessage() interface
    claude.js              ← Anthropic implementation
  bridge/
    watcher.js             ← watches current.json, sends to renderer
  state/
    current.json           ← written by hooks (placeholder for now)
```

---

## Roles

- **PO:** Pepijn
- **Dev:** Grim

---

## Status

Node.js installing. Ready to scaffold once confirmed.
