# Project.md

## Project Title
Knitting Counter Overlay

## One-line summary
Build a Windows-first Electron desktop app for knitters that shows a small always-on-top overlay for counting stitches while the user multitasks in other apps, with an expandable management view for multiple named projects stored locally and available offline.

---

## Product Goal
The app must let a user keep track of stitches while watching YouTube, browsing, or playing a strategy game, without needing a dedicated browser tab or constant focus on the app.

The experience should feel like a tiny desktop companion:
- always available
- very small in daily use
- expandable when needed
- works offline
- stores data locally
- simple enough for non-technical users

---

## Primary Users
1. A non-technical knitter who wants a simple counter.
2. The developer, who will distribute a portable ZIP build to friends.

---

## Target Platform
### Initial target
- Windows only

### Future targets
- macOS
- Linux

Do not optimize the first version for cross-platform edge cases. Build the first release for Windows and keep the codebase clean enough to support other platforms later.

---

## Distribution Model
### Release format for v1
- Portable ZIP download
- No installer required
- User downloads ZIP, extracts it, and runs the `.exe`

### Repository model
- The GitHub repository contains source code only
- Built binaries must not be committed into the main source tree
- Release artifacts should be produced by the build process and uploaded separately

### Offline requirement
- The app must work fully offline after download
- No login, no cloud sync, no backend

---

## Core Product Concept
The app has two UI states:

### 1. Compact Overlay
A very small always-on-top floating window that shows the currently active knitting project.

It should display:
- current project name
- current stitch count
- last counted timestamp
- plus and minus buttons
- expand button
- optional lock mode indicator

### 2. Expanded Manager
A larger resizable view used for project management and settings.

It should allow the user to:
- create a project
- rename a project
- delete a project
- switch active project
- manually count up or down
- reset a project
- configure hotkeys
- toggle lock mode
- change overlay appearance settings

The compact overlay is for everyday use.
The expanded manager is for occasional setup and management.

---

## Functional Requirements

## FR-1 Multiple projects
The user must be able to create multiple named projects.
Examples:
- Scarf
- Gloves
- Hat

Each project must have its own:
- unique id
- name
- stitch count
- created timestamp
- updated timestamp

## FR-2 Active project
There must always be one active project when at least one project exists.
The overlay always shows the active project.

## FR-3 Counting
The user must be able to:
- increment count by 1
- decrement count by 1
- optionally undo the last action

The main counting actions must be available through:
- compact overlay buttons
- expanded view buttons
- global hotkeys

## FR-4 Local persistence
All data must be saved locally on the user's computer.
Data must persist across app restarts.
The app must autosave immediately after every state-changing action.

## FR-5 Last counted indicator
Each project must show when it was last updated.
Show both:
- a human-friendly relative label if practical, for example `2 min ago`
- an exact timestamp somewhere in the UI

For v1, exact timestamp is mandatory. Relative time is optional but recommended.

## FR-6 Global hotkeys
The app must support global keyboard shortcuts so the user can count while another app is focused.

### Default hotkeys for v1
- `F8` → increment active project by 1
- `F7` → decrement active project by 1
- `F6` → switch to next project
- `F9` → expand or focus the manager window

Do not use Arrow Up and Arrow Down as default global hotkeys because they are likely to conflict with games, media controls, or general app navigation.

Hotkeys must be configurable later in the expanded manager.
For the first implementation, fixed defaults are acceptable if custom rebinding would slow the build too much.

## FR-7 Overlay always on top
The compact overlay must remain above normal application windows.

## FR-8 Click-through / lock mode
The overlay must support a lock mode where it ignores mouse events.
In this mode, clicks should pass through to the application below.
This allows the user to keep the overlay visible without blocking YouTube or another app.

When lock mode is active:
- mouse clicks must pass through the overlay
- keyboard shortcuts must still work
- the user must have an easy way to unlock it, such as a hotkey or tray/menu action

## FR-9 Expand / collapse
The compact overlay must be expandable into a larger manager view.
The user should not feel like there are two unrelated apps. It should feel like one app with two states.

## FR-10 Project management
The expanded manager must support:
- add project
- rename project
- delete project
- choose active project
- reset count with confirmation

## FR-11 Basic appearance controls
The user must be able to control at least:
- overlay position via drag
- compact vs expanded mode
- lock mode on/off

Optional v1 settings:
- opacity
- font size
- theme

## FR-12 Tray support
The app should minimize to the system tray or remain available through a tray icon.
This is recommended for usability, but if tray support significantly delays v1, it may be added immediately after the MVP.

---

## Non-Goals for v1
Do not build these in the first version:
- user accounts
- cloud sync
- online backup
- pattern libraries
- mobile companion app
- browser extension
- telemetry
- analytics
- collaboration features
- fancy animations or heavy visual effects

Keep v1 small and reliable.

---

## UX Requirements

## Compact Overlay UX
The compact overlay must:
- be small and readable
- show the count prominently
- allow extremely fast interaction
- avoid visual clutter
- be usable on top of dark and light backgrounds

Recommended layout:
- top row: project name + expand/settings button
- middle: large stitch count
- bottom row: minus button, plus button, last-updated label

The count should be the most visually dominant element.

## Expanded Manager UX
The expanded manager should have a clean split layout.
Suggested structure:
- left column: project list
- right panel: active project details and controls
- top bar: title, compact toggle, lock toggle
- lower section or modal: settings

## Input UX
The app must support:
- mouse
- keyboard shortcuts

Touch support is optional.

## Error UX
Destructive actions must require confirmation:
- delete project
- reset count

Regular counting actions must not require confirmation.

## Undo UX
Undo is strongly recommended for accidental key presses.
At minimum, support undo of the last count change for the active project.

---

## Technical Stack
Use:
- Electron
- TypeScript preferred
- Vite or another lightweight frontend setup if desired
- React is allowed but not required

Recommendation:
- Electron + TypeScript + React + minimal CSS

Keep dependencies low. Do not add heavy state management unless clearly useful.
React Context or a small local store is enough.

---

## Architecture Requirements

## App processes
Use a standard Electron separation:
- main process
- preload script
- renderer UI

### Main process responsibilities
- create and manage windows
- register global hotkeys
- handle tray behavior
- read/write project data to disk
- expose minimal safe APIs to renderer via IPC or context bridge

### Preload responsibilities
- expose a narrow secure API to the renderer
- do not expose full Node access to the renderer

### Renderer responsibilities
- render compact and expanded UI
- handle local user interactions
- call exposed APIs for persistence and system features

---

## Data Model
Use a local JSON data model.

### Root state shape
```json
{
  "projects": [
    {
      "id": "scarf-1",
      "name": "Scarf",
      "count": 128,
      "createdAt": "2026-04-22T19:20:00.000Z",
      "updatedAt": "2026-04-22T20:14:00.000Z"
    }
  ],
  "activeProjectId": "scarf-1",
  "settings": {
    "hotkeys": {
      "increment": "F8",
      "decrement": "F7",
      "nextProject": "F6",
      "toggleExpand": "F9"
    },
    "overlay": {
      "locked": false,
      "opacity": 0.92,
      "width": 260,
      "height": 140,
      "x": 40,
      "y": 40
    }
  }
}
```

### Project type
```ts
interface Project {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}
```

### Settings type
```ts
interface AppSettings {
  hotkeys: {
    increment: string;
    decrement: string;
    nextProject: string;
    toggleExpand: string;
  };
  overlay: {
    locked: boolean;
    opacity: number;
    width: number;
    height: number;
    x: number;
    y: number;
  };
}
```

### Notes on timestamps
Store timestamps as ISO strings in UTC.
Format for display in local time.

---

## Persistence Requirements

## Storage format
- JSON file on disk

## Storage behavior
- load on app startup
- save after every mutation
- write atomically if practical
- gracefully recover from missing file
- gracefully recover from corrupted file by backing it up and creating a fresh default file

## Default state behavior
On first launch:
- create a default project, for example `My Project`
- make it active

## Storage location for v1
Use Electron's default per-user application data location.
Do not implement custom portable folder storage in v1 unless it is trivial and stable.

---

## Window Behavior

## Compact overlay window requirements
- frameless or near-frameless preferred
- always on top
- small default size
- resizable optional
- movable by drag
- stays open while user uses other apps
- hidden from taskbar if appropriate
- can ignore mouse events in lock mode

## Expanded manager window behavior
Choose one of the following approaches and keep implementation simple:

### Preferred approach
Use a single window that can switch between compact and expanded layouts.
This keeps the mental model simple.

### Acceptable alternative
Use one compact window plus one manager window if that is much easier technically.
If using two windows, keep their styling and state tightly connected.

---

## Hotkey Behavior Details
Global shortcuts must work even when the app is not focused.

### Required behaviors
- increment active project count
- decrement active project count
- switch to next project
- bring up manager or toggle expanded mode

### Collision handling
If a hotkey cannot be registered:
- log the failure
- show a visible warning in the manager UI
- fall back gracefully instead of crashing

### Safety rule
Always unregister global shortcuts on app quit.

---

## Tray Behavior
If tray is implemented in v1, it should support:
- show overlay
- hide overlay
- toggle lock mode
- open manager
- quit app

If tray is not done in the first pass, structure the code so it can be added later without rewriting core logic.

---

## Suggested File Structure
This is a recommendation, not a strict requirement.

```text
knitting-counter/
├─ src/
│  ├─ main/
│  │  ├─ main.ts
│  │  ├─ windows.ts
│  │  ├─ shortcuts.ts
│  │  ├─ tray.ts
│  │  └─ storage.ts
│  ├─ preload/
│  │  └─ preload.ts
│  └─ renderer/
│     ├─ index.html
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ components/
│     │  ├─ CompactOverlay.tsx
│     │  ├─ ExpandedManager.tsx
│     │  ├─ ProjectList.tsx
│     │  ├─ CounterPanel.tsx
│     │  └─ SettingsPanel.tsx
│     ├─ styles/
│     │  └─ app.css
│     └─ types/
│        └─ state.ts
├─ assets/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ forge.config.ts
├─ README.md
└─ Project.md
```

---

## Implementation Plan for Codex

## Step 1 Setup the Electron app
- initialize Electron project
- use TypeScript
- configure a main process, preload script, and renderer
- add a build setup suitable for creating a Windows portable release

## Step 2 Create the data layer
- create types for project state and settings
- implement a storage module that loads and saves JSON
- provide default state when no data file exists
- validate loaded data enough to avoid crashes

## Step 3 Create the compact overlay UI
Build the small window first.
It must show:
- project name
- count
- last updated
- plus and minus buttons
- expand button
- lock toggle

## Step 4 Create the expanded manager UI
Add:
- project list
- add project
- rename project
- delete project
- select active project
- reset counter
- settings area

## Step 5 Implement global shortcuts
Register default hotkeys from the main process.
Wire them to storage updates and UI refresh.

## Step 6 Implement lock mode
When lock mode is enabled:
- window ignores mouse input
- the app remains visually visible
- hotkeys still work
- user can unlock through a safe method

## Step 7 Polish persistence and window state
Save:
- projects
- active project
- overlay size
- overlay position
- lock state
- hotkey settings if implemented

## Step 8 Prepare portable release build
Configure the build pipeline so a Windows user can download a ZIP, extract it, and run the app.

---

## Security Requirements
- Use `contextIsolation: true`
- Use a preload bridge instead of direct Node access in the renderer
- Avoid enabling unnecessary Electron web features
- Do not load remote content in production
- Keep the app local-first and offline-first

---

## Performance Requirements
- startup should feel instant or near-instant
- count changes should update immediately
- storage writes should be lightweight
- avoid unnecessary re-renders or large dependencies

This is a tiny utility app. It must feel fast.

---

## UI Style Requirements
Use a simple, clean desktop utility style.
The interface should feel:
- minimal
- readable
- compact
- calm
- practical

Do not design it like a flashy landing page.
Do not use strong gradients, glassmorphism, or heavy motion.
The product should feel useful, not trendy.

### Styling direction
- rounded corners okay, but restrained
- high readability
- strong count typography
- consistent spacing
- subtle shadows only if needed
- good dark-mode default

---

## Suggested MVP Acceptance Criteria
The MVP is complete only when all of the following are true:

1. The app launches as a compact always-on-top overlay.
2. The user can create at least two projects.
3. Each project stores its own stitch count.
4. The active project count can be incremented and decremented.
5. Default global hotkeys work while another app is focused.
6. Data is saved locally and survives a restart.
7. Each project shows a valid last-updated timestamp.
8. The user can expand the overlay into a management view.
9. The user can delete and rename projects.
10. The app can be packaged into a Windows portable release.

---

## Nice-to-have After MVP
Implement these only after the MVP works reliably:
- row counter per project
- per-project notes
- configurable hotkeys UI
- tray icon and tray menu
- relative time labels like `just now`
- export/import backup JSON
- opacity slider
- project sorting by last updated
- multiple counters inside one project
- repeat tracker for patterns

---

## What Codex Should Avoid
- do not overengineer the app
- do not add backend services
- do not add login systems
- do not add database dependencies for v1
- do not optimize for web deployment
- do not turn this into a browser extension
- do not use ArrowUp as the default global increment hotkey
- do not make visual polish more important than reliability

---

## Notes for Implementation Decisions
When there is a tradeoff, prefer:
- simpler architecture
- fewer dependencies
- local JSON over unnecessary databases
- stable Windows behavior over premature cross-platform abstraction
- clear UX over feature count

The first version must be easy to use and hard to break.

---

## Final Instruction to Codex
Build a small, reliable, Windows-first Electron utility that behaves like a real desktop companion for knitters.
The compact overlay is the main product.
The expanded manager exists to support it.
Prioritize always-on-top behavior, global shortcuts, local persistence, and a clean simple UI.
Do not drift into unnecessary complexity.
