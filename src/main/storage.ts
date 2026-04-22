import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
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

export async function writeStateFile(filePath: string, state: PersistedState): Promise<void> {
  await ensureParentDirectory(filePath)

  const tempFilePath = `${filePath}.tmp`
  const payload = `${JSON.stringify(state, null, 2)}\n`

  await writeFile(tempFilePath, payload, 'utf8')

  try {
    await rename(tempFilePath, filePath)
  } catch {
    await writeFile(filePath, payload, 'utf8')
    await rm(tempFilePath, { force: true })
  }
}

export async function loadStateFile(userDataPath: string): Promise<LoadStateResult> {
  const dataFilePath = path.join(userDataPath, STATE_FILE_NAME)

  try {
    const raw = await readFile(dataFilePath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    const state = normalizeState(parsed)

    if (!state) {
      throw new Error('Stored data failed validation.')
    }

    return {
      state,
      dataFilePath,
      storageWarning: null
    }
  } catch (error) {
    const state = createDefaultState()

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeStateFile(dataFilePath, state)
      return {
        state,
        dataFilePath,
        storageWarning: null
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(userDataPath, `state.corrupt-${timestamp}.json`)

    try {
      await ensureParentDirectory(dataFilePath)
      await rename(dataFilePath, backupPath)
    } catch {
      // If the rename fails, the fresh state file still lets the app recover.
    }

    await writeStateFile(dataFilePath, state)

    return {
      state,
      dataFilePath,
      storageWarning: `Stored data was unreadable. A fresh file was created and the previous file was backed up near ${backupPath}.`
    }
  }
}
