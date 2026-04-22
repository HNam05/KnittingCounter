import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type {
  AppSnapshot,
  CreateProjectInput,
  DeleteProjectInput,
  RenameProjectInput,
  ResetProjectInput,
  SetActiveProjectInput,
  SetModeInput,
  SetOverlayLockedInput
} from '../shared/types'
import type { AppStore } from './store'
import { assertTrustedIpcSender } from './security'

const PROJECT_NAME_MAX_LENGTH = 60
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type WindowGetter = () => BrowserWindow | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertTrustedEvent(event: IpcMainInvokeEvent, getWindow: WindowGetter, bundledRendererPath: string): void {
  assertTrustedIpcSender(event, getWindow(), bundledRendererPath)
}

function readProjectName(input: unknown): string {
  if (!isRecord(input) || typeof input.name !== 'string') {
    throw new Error('Invalid project payload.')
  }

  const trimmedName = input.name.trim()

  if (!trimmedName || trimmedName.length > PROJECT_NAME_MAX_LENGTH) {
    throw new Error(`Project names must be between 1 and ${PROJECT_NAME_MAX_LENGTH} characters.`)
  }

  return trimmedName
}

function readProjectId(input: unknown): string {
  if (!isRecord(input) || typeof input.projectId !== 'string' || !UUID_PATTERN.test(input.projectId)) {
    throw new Error('Invalid project identifier.')
  }

  return input.projectId
}

function readNullableProjectId(input: unknown): string | null {
  if (!isRecord(input)) {
    throw new Error('Invalid project selection payload.')
  }

  if (input.projectId === null) {
    return null
  }

  if (typeof input.projectId !== 'string' || !UUID_PATTERN.test(input.projectId)) {
    throw new Error('Invalid project identifier.')
  }

  return input.projectId
}

function readMode(input: unknown): SetModeInput['mode'] {
  if (!isRecord(input) || (input.mode !== 'compact' && input.mode !== 'manager')) {
    throw new Error('Invalid overlay mode.')
  }

  return input.mode
}

function readLocked(input: unknown): boolean {
  if (!isRecord(input) || typeof input.locked !== 'boolean') {
    throw new Error('Invalid lock payload.')
  }

  return input.locked
}

function assertProjectExists(store: AppStore, projectId: string): void {
  if (!store.getSnapshot().projects.some((project) => project.id === projectId)) {
    throw new Error('Unknown project identifier.')
  }
}

export function registerIpcHandlers(store: AppStore, getWindow: WindowGetter, bundledRendererPath: string): void {
  ipcMain.removeHandler(IPC_CHANNELS.getState)
  ipcMain.removeHandler(IPC_CHANNELS.createProject)
  ipcMain.removeHandler(IPC_CHANNELS.renameProject)
  ipcMain.removeHandler(IPC_CHANNELS.deleteProject)
  ipcMain.removeHandler(IPC_CHANNELS.resetProject)
  ipcMain.removeHandler(IPC_CHANNELS.setActiveProject)
  ipcMain.removeHandler(IPC_CHANNELS.incrementActiveProject)
  ipcMain.removeHandler(IPC_CHANNELS.decrementActiveProject)
  ipcMain.removeHandler(IPC_CHANNELS.nextProject)
  ipcMain.removeHandler(IPC_CHANNELS.setMode)
  ipcMain.removeHandler(IPC_CHANNELS.setOverlayLocked)

  ipcMain.handle(IPC_CHANNELS.getState, (event) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.getSnapshot()
  })
  ipcMain.handle(IPC_CHANNELS.createProject, (event, input: CreateProjectInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.createProject(readProjectName(input))
  })
  ipcMain.handle(IPC_CHANNELS.renameProject, (event, input: RenameProjectInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    const projectId = readProjectId(input)
    assertProjectExists(store, projectId)
    return store.renameProject(projectId, readProjectName(input))
  })
  ipcMain.handle(IPC_CHANNELS.deleteProject, (event, input: DeleteProjectInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    const projectId = readProjectId(input)
    assertProjectExists(store, projectId)
    return store.deleteProject(projectId)
  })
  ipcMain.handle(IPC_CHANNELS.resetProject, (event, input: ResetProjectInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    const projectId = readProjectId(input)
    assertProjectExists(store, projectId)
    return store.resetProject(projectId)
  })
  ipcMain.handle(IPC_CHANNELS.setActiveProject, (event, input: SetActiveProjectInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    const projectId = readNullableProjectId(input)

    if (projectId !== null) {
      assertProjectExists(store, projectId)
    }

    return store.setActiveProject(projectId)
  })
  ipcMain.handle(IPC_CHANNELS.incrementActiveProject, (event) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.incrementActiveProject()
  })
  ipcMain.handle(IPC_CHANNELS.decrementActiveProject, (event) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.decrementActiveProject()
  })
  ipcMain.handle(IPC_CHANNELS.nextProject, (event) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.nextProject()
  })
  ipcMain.handle(IPC_CHANNELS.setMode, (event, input: SetModeInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.setMode(readMode(input))
  })
  ipcMain.handle(IPC_CHANNELS.setOverlayLocked, (event, input: SetOverlayLockedInput) => {
    assertTrustedEvent(event, getWindow, bundledRendererPath)
    return store.setOverlayLocked(readLocked(input))
  })
}

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: AppSnapshot): void {
  if (!window || window.isDestroyed()) {
    return
  }

  window.webContents.send(IPC_CHANNELS.stateChanged, snapshot)
}
