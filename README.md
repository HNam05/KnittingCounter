# Knitting Counter Overlay

Windows-first Electron desktop app for counting knitting stitches in a compact always-on-top overlay, with a larger manager view for project management. The app works fully offline and stores its data locally as JSON in the user's Electron app data folder.

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

If PowerShell script execution is blocked on your machine, use `cmd /c`:

```powershell
cmd /c npm install
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

This command creates a standalone Windows ZIP build in `release/`:

```powershell
cmd /c npm run dist
```

Output:

- `release/Knitting Counter Overlay-0.1.0-windows-x64.zip`
- `release/win-unpacked/Knitting Counter Overlay.exe`

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
  - `F9` open/focus manager
- Click-through lock mode for the compact overlay
- Corrupt JSON recovery with backup + fresh state creation
- Fully offline local-first behavior

## Data storage

The app stores its JSON state in Electron's per-user app data directory, not inside the extracted ZIP folder.

That means:

- end users can move the extracted app folder without losing saved projects
- source builds and packaged builds use the same local persistence model

## Post-MVP TODO

- Add tray support for quick show/hide and unlock access
- Add configurable hotkeys in the manager UI
- Add relative time labels beside the exact timestamps
- Add per-project notes or row counters
- Add export/import for manual JSON backups
