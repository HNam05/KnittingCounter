import { access, mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AppSettings, PersistedState, Project } from '../shared/types'

const STATE_FILE_NAME = 'state.json'
export const COMPACT_OVERLAY_WIDTH = 252
export const COMPACT_OVERLAY_HEIGHT = 156

const defaultSettings: AppSettings = {
  hotkeys: {
    increment: 'F8',
    decrement: 'F7',
    nextProject: 'F6',
    toggleExpand: 'F9'
  },
  overlay: {
    locked: false,
    x: 48,
    y: 48,
    width: COMPACT_OVERLAY_WIDTH,
    height: COMPACT_OVERLAY_HEIGHT,
    mode: 'compact'
  }
}

export interface LoadStateResult {
  state: PersistedState
  dataFilePath: string
  storageWarning: string | null
}

export function createDefaultState(): PersistedState {
  return {
    projects: [],
    activeProjectId: null,
    settings: structuredClone(defaultSettings)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.count === 'number' &&
    Number.isFinite(value.count) &&
    value.count >= 0 &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  )
}

function normalizeState(value: unknown): PersistedState | null {
  if (!isRecord(value) || !Array.isArray(value.projects) || !isRecord(value.settings)) {
    return null
  }

  const projects = value.projects.filter(isProject).map((project) => ({
    ...project,
    count: Math.max(0, Math.floor(project.count))
  }))

  if (projects.length !== value.projects.length) {
    return null
  }

  const settings = value.settings
  const hotkeys = settings.hotkeys
  const overlay = settings.overlay

  if (
    !isRecord(hotkeys) ||
    typeof hotkeys.increment !== 'string' ||
    typeof hotkeys.decrement !== 'string' ||
    typeof hotkeys.nextProject !== 'string' ||
    typeof hotkeys.toggleExpand !== 'string' ||
    !isRecord(overlay) ||
    typeof overlay.locked !== 'boolean' ||
    typeof overlay.x !== 'number' ||
    typeof overlay.y !== 'number' ||
    typeof overlay.width !== 'number' ||
    typeof overlay.height !== 'number' ||
    (overlay.mode !== 'compact' && overlay.mode !== 'manager')
  ) {
    return null
  }

  const activeProjectId =
    typeof value.activeProjectId === 'string' && projects.some((project) => project.id === value.activeProjectId)
      ? value.activeProjectId
      : projects[0]?.id ?? null

  return {
    projects,
    activeProjectId: projects.length === 0 ? null : activeProjectId,
    settings: {
      hotkeys: {
        increment: hotkeys.increment,
        decrement: hotkeys.decrement,
        nextProject: hotkeys.nextProject,
        toggleExpand: hotkeys.toggleExpand
      },
      overlay: {
        locked: overlay.locked,
        x: Math.round(overlay.x),
        y: Math.round(overlay.y),
        width: COMPACT_OVERLAY_WIDTH,
        height: COMPACT_OVERLAY_HEIGHT,
        mode: 'compact'
      }
    }
  }
}

async function ensureParentDirectory(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}

async function writeTextFileSynced(filePath: string, payload: string): Promise<void> {
  await writeFile(filePath, payload, 'utf8')

  const handle = await open(filePath, 'r+')

  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export async function writeStateFile(filePath: string, state: PersistedState): Promise<void> {
  await ensureParentDirectory(filePath)

  const tempFilePath = `${filePath}.tmp`
  const backupFilePath = `${filePath}.bak`
  const payload = `${JSON.stringify(state, null, 2)}\n`
  const hasExistingFile = await fileExists(filePath)

  await writeTextFileSynced(tempFilePath, payload)

  if (hasExistingFile) {
    await rm(backupFilePath, { force: true })
    await rename(filePath, backupFilePath)
  }

  try {
    await rename(tempFilePath, filePath)
  } catch (error) {
    if (hasExistingFile) {
      try {
        await rename(backupFilePath, filePath)
      } catch {
        // Preserve the backup file if the rollback fails so the last known-good
        // state remains available for manual recovery.
      }
    }

    await rm(tempFilePath, { force: true })
    throw error
  }

  if (hasExistingFile) {
    await rm(backupFilePath, { force: true })
  }
}

async function recoverInvalidStoredData(userDataPath: string, dataFilePath: string): Promise<LoadStateResult> {
  const state = createDefaultState()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(userDataPath, `state.corrupt-${timestamp}.json`)

  try {
    await ensureParentDirectory(dataFilePath)
    await rename(dataFilePath, backupPath)
  } catch {
    return {
      state,
      dataFilePath,
      storageWarning:
        `Stored data was invalid, but the app could not move it to a backup at ${backupPath}. ` +
        `Fix or move ${dataFilePath} before saving again.`
    }
  }

  try {
    await writeStateFile(dataFilePath, state)
  } catch {
    try {
      await rename(backupPath, dataFilePath)
    } catch {
      // Keep the backup file in place if the restore also fails.
    }

    return {
      state,
      dataFilePath,
      storageWarning:
        `Stored data was invalid and a backup was created at ${backupPath}, ` +
        `but the fresh state file could not be written.`
    }
  }

  return {
    state,
    dataFilePath,
    storageWarning: `Stored data was invalid. A fresh file was created and the previous file was backed up to ${backupPath}.`
  }
}

export async function loadStateFile(userDataPath: string): Promise<LoadStateResult> {
  const dataFilePath = path.join(userDataPath, STATE_FILE_NAME)
  const initialState = createDefaultState()
  let raw: string

  try {
    raw = await readFile(dataFilePath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await writeStateFile(dataFilePath, initialState)
        return {
          state: initialState,
          dataFilePath,
          storageWarning: null
        }
      } catch {
        return {
          state: initialState,
          dataFilePath,
          storageWarning: `A new data file could not be created at ${dataFilePath}.`
        }
      }
    }

    return {
      state: initialState,
      dataFilePath,
      storageWarning: `Stored data could not be read from ${dataFilePath}. Check file permissions or close any program locking the file and try again.`
    }
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const state = normalizeState(parsed)

    if (!state) {
      return recoverInvalidStoredData(userDataPath, dataFilePath)
    }

    return {
      state,
      dataFilePath,
      storageWarning: null
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return recoverInvalidStoredData(userDataPath, dataFilePath)
    }

    throw error
  }
}
