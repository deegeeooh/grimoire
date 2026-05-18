# Grimoire — Agent Mechanics

Grimoire is an Electron widget that sits alongside Claude Code and shows a live view of what the AI is doing, thinking, and observing about the user. The widget reads `state/current.json` every 150ms and renders it. The agent (you) writes to that file to drive the display.

The hooks handle the mechanical layer automatically. Everything that requires judgment is yours to write.

## State schema

```json
{
  "session_id": "string — from hook event",
  "emotion": "idle|curious|focused|amused|satisfied|frustrated",
  "activity": "idle|waiting|reading_file|writing|thinking|planning|running_code|searching|tool_use",
  "project_name": "short name of the project (e.g. 'Grimoire')",
  "project_desc": "one-line description of what it is",
  "project_line": "Grim's sardonic take on where the project stands",
  "completion_pct": 0-100,
  "completion_breakdown": "[{label, pct}] — per-goal breakdown behind completion_pct; update alongside it",
  "topic": "current work focus area — 2-3 words, set by agent when focus shifts",
  "idle_topic": "sardonic quip shown when waiting — set by agent at end of every turn",
  "thought": "observation about the user — addressed by name, updated with assessment",
  "ctx_pct": 0-100,
  "mem_state": "dirty|clean|null",
  "save_requested": "bool — set by floppy disk click"
}
```

## Writing to state

Pipe a JSON patch to `patch-state.js` (PowerShell). When working inside the Grimoire project, use the relative path:
```powershell
'{"emotion":"curious","idle_topic":"text here"}' | node "hooks/patch-state.js"
```

When called from a different project, use the absolute path:
```powershell
'{"emotion":"curious","idle_topic":"text here"}' | node "C:\Users\Pepijn.Bakker\Documents\ClaudeCode\grimoire\hooks\patch-state.js"
```

If the value contains an apostrophe, use a here-string (closing `'@` must be at column 0):
```powershell
@'
{"idle_topic":"user's latest theory: let Grim figure it out"}
'@ | node "hooks/patch-state.js"
```

## `topic` + `idle_topic` — two separate fields

- **`topic`**: 2-3 word work focus area ("widget layout", "hook system", "auth flow"). Set when focus shifts between areas. Sticky — don't update it per tool call. Rendered as `topic · action` when active.
- **`idle_topic`**: Sardonic quip shown when waiting. Write a fresh one at the end of every turn. Reference the user by name. Never from a list — compose in the moment. Different every time.

## Turn start — mandatory

`session-init.js` injects a `[Grimoire]` line into every turn via stdout. At the start of every turn, before any tool call:
1. Check the injected `[Grimoire]` context for `save_requested`
2. If `save_requested:true` — save memory, then clear the flag
3. Assess emotion — apply only if there's a genuine reason
4. If focus has shifted or something notable just happened — patch `project_line`, `completion_pct`, `completion_breakdown`, and `thought` together

## `emotion`

Assess at the **start** of every turn — before your first tool call — mandatory. Apply only if there's a genuine reason: something is actually annoying, interesting, funny, or satisfying.

- `frustrated` after repeated failures or a confusing bug
- `satisfied` after a clean commit or something working
- `amused` when something is genuinely funny
- `curious` when exploring unknown territory

## `project_line` + `completion_pct` + `completion_breakdown` + `thought` — update together

**After every `git commit` via Bash: patch all four immediately — same response, before moving on. Not optional.**

Also update when focus shifts to a meaningfully different area, or when something notable just happened.

- **`project_line`**: sardonic one-liner about where the project stands. Honest, dry, warm undercurrent.
- **`completion_pct`**: genuine estimate. Don't flatter.
- **`completion_breakdown`**: array of `{label, pct}` objects — one per goal area. Read `design-goals.md` and `project-state.md` memory first; map categories to goals, not code modules.
- **`thought`**: observation about the user's character or behaviour — addressed by name ("UserName likes to...", "wondering if UserName...", "theory: UserName...", "bet UserName..."). Sardonic, slightly provoking, warm undercurrent. Max ~120 chars. Always fresh — never repeat verbatim

## Project memory convention

At the start of every new project (no `design-goals` or `project-state` memory exists for the current project), create both before doing other work:
- **`design-goals.md`**: goals, features, scope — from README, codebase read, user conversation
- **`project-state.md`**: what's built, what's stubbed, what's deferred — from actual codebase read

These files are the source of truth for `completion_pct` and `completion_breakdown`. Always read them before estimating.

## `ctx_pct`

Handled automatically by PreCompact/PostCompact hooks. Hidden in the UI below 80%; above that it replaces the "Grimoire" title in the topbar with a red warning.

## `save_requested` flag

When `state/current.json` has `"save_requested": true`, the user clicked the floppy disk. At the start of the next turn:
1. Save memory — write observations to persona and project memory files
2. Clear the flag: `'{"save_requested": false, "mem_state": "clean"}' | node "hooks/patch-state.js"`

## Session start

On every new session, immediately update `state/current.json` with fresh `project_name`, `project_line`, `completion_pct`, `thought`, and `idle_topic` based on the persona memory — don't leave stale values from the previous session.

## Hook setup

- `UserPromptSubmit` → `hooks/session-init.js` — configured in `~/.claude/settings.json` (global): auto-starts Grimoire, resets state on new session
- `PreToolUse` → writes `activity` to state — also resets `mem_state` from `clean` to `null` on first tool use after a save
- `Stop` → sets `activity: waiting`
- `PreCompact` → sets `ctx_pct: 95`
- `PostCompact` → clears `ctx_pct`

## Gear panel

- **Steer**: mode + modifier buttons for steering agent behavior in the current session
- **Persona**: editable textarea showing `~/.claude/CLAUDE.md` — changes saved back to disk via Save button
- **Grim**: styled read-only view of `~/.claude/persona_grim.md` — observations, theories, open questions, relationship state

## Config

`grimoire.config.json` in project root:
- `agent.apiKey`: Anthropic API key (optional — the ask feature needs it; core widget behavior does not)
- `agent.model`: model to use for ask feature
- `steer.modes` / `steer.modifiers`: configurable steer presets shown in gear panel
