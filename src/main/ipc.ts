import { BrowserWindow, ipcMain } from 'electron'
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

export function registerIpcHandlers(store: AppStore): void {
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

  ipcMain.handle(IPC_CHANNELS.getState, () => store.getSnapshot())
  ipcMain.handle(IPC_CHANNELS.createProject, (_, input: CreateProjectInput) => store.createProject(input.name))
  ipcMain.handle(IPC_CHANNELS.renameProject, (_, input: RenameProjectInput) =>
    store.renameProject(input.projectId, input.name)
  )
  ipcMain.handle(IPC_CHANNELS.deleteProject, (_, input: DeleteProjectInput) => store.deleteProject(input.projectId))
  ipcMain.handle(IPC_CHANNELS.resetProject, (_, input: ResetProjectInput) => store.resetProject(input.projectId))
  ipcMain.handle(IPC_CHANNELS.setActiveProject, (_, input: SetActiveProjectInput) =>
    store.setActiveProject(input.projectId)
  )
  ipcMain.handle(IPC_CHANNELS.incrementActiveProject, () => store.incrementActiveProject())
  ipcMain.handle(IPC_CHANNELS.decrementActiveProject, () => store.decrementActiveProject())
  ipcMain.handle(IPC_CHANNELS.nextProject, () => store.nextProject())
  ipcMain.handle(IPC_CHANNELS.setMode, (_, input: SetModeInput) => store.setMode(input.mode))
  ipcMain.handle(IPC_CHANNELS.setOverlayLocked, (_, input: SetOverlayLockedInput) =>
    store.setOverlayLocked(input.locked)
  )
}

export function broadcastSnapshot(window: BrowserWindow | null, snapshot: AppSnapshot): void {
  if (!window || window.isDestroyed()) {
    return
  }

  window.webContents.send(IPC_CHANNELS.stateChanged, snapshot)
}
