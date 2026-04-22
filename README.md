# Knitting Counter Overlay

Windows-first Electron desktop app for counting knitting stitches in a compact always-on-top overlay, with a larger manager view for project management. The app works fully offline and stores its data locally as JSON in Electron's per-user app data folder.

## What the app is

- A small desktop overlay for daily counting
- A larger manager view for adding and organizing projects
- Fully offline
- No backend, no login, no cloud sync
- Distributed to end users as a standalone Windows ZIP

## End-user release

End users do **not** need to install Node.js, npm, Electron, or any developer tooling.

The packaged Windows release is a standalone ZIP archive:

- Extract `release/Knitting Counter Overlay-0.1.0-windows-x64.zip`
- Open the extracted folder
- Run `Knitting Counter Overlay.exe`

The ZIP already contains the Electron runtime and everything needed to run the app after extraction.

## Developer setup

These steps are only for building or modifying the app from source.

### Prerequisites

- Windows
- Node.js 22+
- npm 10+

### Install dependencies

Use `npm ci` so local installs stay pinned to the reviewed lockfile.

If PowerShell script execution is blocked on your machine, use `cmd /c`:

```powershell
cmd /c npm ci
```

## Run locally

Development mode:

```powershell
cmd /c npm run dev
```

Production build only:

```powershell
cmd /c npm run build
```

## Build the portable Windows release

For a local packaging check, this command creates an unsigned Windows ZIP build in `release/` and writes a `SHA256SUMS.txt` manifest for the generated `.zip` and `.exe` artifacts:

```powershell
cmd /c npm run dist
```

For a distributable signed release, run:

```powershell
cmd /c npm run dist:signed
```

Output:

- `release/Knitting Counter Overlay-0.1.0-windows-x64.zip`
- `release/win-unpacked/Knitting Counter Overlay.exe`
- `release/SHA256SUMS.txt`

`npm run dist` disables Windows executable editing so local packaging works without the extra code-signing toolchain requirements on developer machines.

`npm run dist:signed` keeps Electron Builder's signing path enabled. If Windows code-signing credentials are configured for `electron-builder`, the generated executable is signed during packaging. Distributed releases should ship from this signed path together with the checksum manifest.

## Features in the MVP

- Compact always-on-top overlay
- Expanded manager mode in the same window
- Multiple named projects
- Active-project counting with local autosave
- Exact last-counted timestamps in the UI
- Global hotkeys:
  - `F8` increment
  - `F7` decrement
  - `F6` next project
  - `F9` open or focus manager
- Click-through lock mode for the compact overlay
- Corrupt JSON recovery with backup plus fresh state creation
- Fully offline local-first behavior

## How It Technically Works

### Stack

- Electron
- TypeScript
- React
- `electron-vite` for development and production bundling
- `electron-builder` for the Windows portable ZIP

### Process split

The app uses the standard secure Electron split:

- `src/main`
  - owns the application lifecycle
  - loads and saves local JSON state
  - registers global hotkeys
  - creates and controls the window
  - is the single source of truth for app state
- `src/preload`
  - exposes a narrow safe API with `contextBridge`
  - forwards renderer requests through IPC
- `src/renderer`
  - renders the React UI
  - subscribes to state snapshots from the main process
  - never gets direct Node.js access
- `src/shared`
  - contains shared TypeScript types and IPC channel names

### Current source structure

```text
.
├─ Background/
│  ├─ Counter.jpg
│  └─ Pink.png
├─ src/
│  ├─ main/
│  │  ├─ ipc.ts
│  │  ├─ main.ts
│  │  ├─ shortcuts.ts
│  │  ├─ storage.ts
│  │  ├─ store.ts
│  │  └─ windowController.ts
│  ├─ preload/
│  │  └─ preload.ts
│  ├─ renderer/
│  │  ├─ components/
│  │  │  ├─ CompactOverlay.tsx
│  │  │  ├─ CounterPanel.tsx
│  │  │  ├─ ExpandedManager.tsx
│  │  │  ├─ ProjectList.tsx
│  │  │  └─ WarningBanner.tsx
│  │  ├─ styles/
│  │  │  └─ app.css
│  │  ├─ App.tsx
│  │  ├─ index.html
│  │  └─ main.tsx
│  └─ shared/
│     ├─ bridge.ts
│     ├─ global.d.ts
│     ├─ ipc.ts
│     └─ types.ts
├─ package.json
├─ electron.vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
└─ README.md
```

## Runtime flow

### 1. App startup

At startup, [`src/main/main.ts`](src/main/main.ts) does the following:

1. Waits for Electron `app.whenReady()`
2. Removes the default app menu
3. Loads the persisted JSON state from `app.getPath('userData')`
4. Creates the in-memory `AppStore`
5. Registers IPC handlers
6. Creates the single `BrowserWindow`
7. Registers global hotkeys
8. Sends the first full state snapshot to the renderer

The main process drives the app. The renderer does not own the canonical state.

### 2. State ownership

[`src/main/store.ts`](src/main/store.ts) contains the `AppStore`, which is the core mutation layer.

It is responsible for:

- creating projects
- renaming projects
- deleting projects
- resetting counts
- incrementing and decrementing counts
- switching the active project
- switching compact or manager mode
- toggling overlay lock state
- persisting after every successful mutation

The store emits a fresh snapshot after each change. That snapshot is used both to update the window behavior and to refresh the renderer UI.

### 3. IPC bridge

[`src/preload/preload.ts`](src/preload/preload.ts) exposes a small `window.knittingCounter` API.

That API includes methods like:

- `getState()`
- `createProject(...)`
- `renameProject(...)`
- `deleteProject(...)`
- `resetProject(...)`
- `setActiveProject(...)`
- `incrementActiveProject()`
- `decrementActiveProject()`
- `nextProject()`
- `setMode(...)`
- `setOverlayLocked(...)`
- `subscribeState(...)`

The renderer only talks to Electron through this bridge.

### 4. Renderer boot

[`src/renderer/App.tsx`](src/renderer/App.tsx) requests the initial snapshot with `getState()` and subscribes to future updates with `subscribeState(...)`.

The renderer then decides between two UI modes:

- compact overlay
- expanded manager

That decision is based on `snapshot.settings.overlay.mode`, which comes from the main process.

## Window behavior

[`src/main/windowController.ts`](src/main/windowController.ts) controls a **single** `BrowserWindow`.

### Compact mode

In compact mode the window is:

- frameless
- fixed-size
- always on top
- taskbar-visible for easier recovery
- optionally click-through when locked

Current compact size in code:

- width: `252`
- height: `156`

### Manager mode

In manager mode the same window is expanded and becomes:

- larger
- resizable
- not always on top
- normal-clickable even if compact mode had been locked before

This keeps the UX feeling like one app instead of two separate windows.

### Lock and click-through

When the compact overlay is locked, the main process calls Electron's `setIgnoreMouseEvents(true, { forward: true })`.

That means:

- the overlay stays visible
- mouse clicks pass through to the app underneath
- global hotkeys still work
- `F9` can recover the manager view

## Data model

Shared types live in [`src/shared/types.ts`](src/shared/types.ts).

The persisted state shape is:

```ts
interface PersistedState {
  projects: Project[]
  activeProjectId: string | null
  settings: {
    hotkeys: {
      increment: string
      decrement: string
      nextProject: string
      toggleExpand: string
    }
    overlay: {
      locked: boolean
      x: number
      y: number
      width: number
      height: number
      mode: 'compact' | 'manager'
    }
  }
}
```

Each project stores:

- `id`
- `name`
- `count`
- `createdAt`
- `updatedAt`

The renderer also receives runtime-only fields that are **not** stored in the JSON file:

- hotkey registration status
- storage recovery warning
- absolute data file path

## Persistence

[`src/main/storage.ts`](src/main/storage.ts) handles load, validation, normalization, recovery, and file writes.

### Storage location

The file is stored in Electron's per-user app data directory.

Typical Windows path:

```text
%APPDATA%\Knitting Counter Overlay\state.json
```

This is intentionally outside the extracted ZIP folder, so users can move or replace the app folder without losing their saved projects.

### First launch

On first launch, if the file does not exist, the app creates a valid empty state:

- `projects: []`
- `activeProjectId: null`
- default hotkeys
- default compact overlay settings

The current MVP starts with **0 projects**. The user creates the first project manually.

### Validation and recovery

On load, the storage layer:

- checks that the JSON has the expected shape
- validates each project
- repairs invalid `activeProjectId` values
- clamps counts to non-negative integers

If the JSON is corrupt or invalid:

- the broken file is renamed to `state.corrupt-<timestamp>.json`
- a fresh empty `state.json` is written
- a recovery warning is surfaced to the manager UI

### Save behavior

After every successful state change, the app saves immediately.

Writes are done through a temporary file and rename flow:

1. write `state.json.tmp`
2. rename it to `state.json`
3. fall back to direct write if rename fails

The store also serializes writes through a promise queue so rapid changes do not overlap each other.

## Global hotkeys

[`src/main/shortcuts.ts`](src/main/shortcuts.ts) registers these default global shortcuts:

- `F8` increment active project
- `F7` decrement active project
- `F6` switch to next project
- `F9` expand or focus manager

### Hold suppression

Electron's `globalShortcut` API does not expose true keyup handling, so the app uses a small latch to prevent held keys from repeating too fast.

Current behavior:

- one tap counts once
- holding `F8`, `F7`, or `F6` does not rapidly repeat

### Failure handling

If a hotkey cannot be registered:

- the app does not crash
- the failed status is stored in runtime state
- the manager UI shows a warning banner

All global shortcuts are unregistered on app quit.

## Renderer structure

Main renderer files:

- [`src/renderer/App.tsx`](src/renderer/App.tsx)
  - loads initial state
  - subscribes to snapshots
  - switches between compact and manager views
  - contains startup and renderer-failure fallbacks
- [`src/renderer/components/CompactOverlay.tsx`](src/renderer/components/CompactOverlay.tsx)
  - small overlay view
  - project name
  - count
  - hotkey hint text
  - increment flash image using `Background/Counter.jpg`
- [`src/renderer/components/ExpandedManager.tsx`](src/renderer/components/ExpandedManager.tsx)
  - project CRUD
  - lock toggle
  - count controls
  - storage and hotkey warnings
- [`src/renderer/styles/app.css`](src/renderer/styles/app.css)
  - girly pink theme
  - compact and manager layouts
  - Pink background image
  - counter flash animation

## Security model

The app keeps the Electron surface intentionally narrow:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- no direct Node.js access in the renderer
- no remote content loading in production
- a restrictive renderer CSP
- denied navigation, popups, and permission prompts by default
- validated IPC senders and payloads in the main process
- all mutations go through the preload bridge and IPC handlers

This keeps the project simple while still following the normal secure Electron structure.

## Build and packaging

Packaging is configured in [`package.json`](package.json).

### Build pipeline

- `npm run dev`
  - starts Electron with `electron-vite` in development mode
- `npm run build`
  - runs TypeScript type-checking
  - bundles main, preload, and renderer output into `out/`
- `npm run dist`
  - runs the build
  - packages the app with `electron-builder`
  - creates a Windows ZIP artifact

### Portable release behavior

The packaged ZIP contains:

- the Electron runtime
- the app code bundled into the release
- `Knitting Counter Overlay.exe`

The end user only needs to extract and run it.

## Data storage summary

The app stores its JSON state in Electron's per-user app data directory, not inside the extracted ZIP folder.

That means:

- end users can move the extracted app folder without losing saved projects
- source builds and packaged builds use the same local persistence model
- project data stays local to the machine

## Post-MVP TODO

- Add tray support for quick show, hide, and unlock access
- Add configurable hotkeys in the manager UI
- Add relative time labels beside the exact timestamps
- Add per-project notes or row counters
- Add export and import for manual JSON backups
