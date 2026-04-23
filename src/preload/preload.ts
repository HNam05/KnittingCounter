import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { KnittingCounterApi } from '../shared/bridge'
import type {
  AppSnapshot,
  CreateProjectInput,
  DeleteProjectInput,
  RenameProjectInput,
  ResetProjectInput,
  SetActiveProjectInput,
  SetModeInput,
  SetOverlayLockedInput,
  UpdateProjectIconInput,
  UpdateProjectNotesInput
} from '../shared/types'

const api: KnittingCounterApi = {
  getState: () => ipcRenderer.invoke(IPC_CHANNELS.getState),
  subscribeState: (listener) => {
    const wrappedListener = (_event: unknown, snapshot: AppSnapshot) => {
      listener(snapshot)
    }

    ipcRenderer.on(IPC_CHANNELS.stateChanged, wrappedListener)

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.stateChanged, wrappedListener)
    }
  },
  createProject: (input: CreateProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.createProject, input),
  renameProject: (input: RenameProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.renameProject, input),
  updateProjectNotes: (input: UpdateProjectNotesInput) => ipcRenderer.invoke(IPC_CHANNELS.updateProjectNotes, input),
  updateProjectIcon: (input: UpdateProjectIconInput) => ipcRenderer.invoke(IPC_CHANNELS.updateProjectIcon, input),
  deleteProject: (input: DeleteProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.deleteProject, input),
  resetProject: (input: ResetProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.resetProject, input),
  setActiveProject: (input: SetActiveProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.setActiveProject, input),
  incrementActiveProject: () => ipcRenderer.invoke(IPC_CHANNELS.incrementActiveProject),
  decrementActiveProject: () => ipcRenderer.invoke(IPC_CHANNELS.decrementActiveProject),
  nextProject: () => ipcRenderer.invoke(IPC_CHANNELS.nextProject),
  setMode: (input: SetModeInput) => ipcRenderer.invoke(IPC_CHANNELS.setMode, input),
  setOverlayLocked: (input: SetOverlayLockedInput) => ipcRenderer.invoke(IPC_CHANNELS.setOverlayLocked, input),
  quitApp: () => ipcRenderer.invoke(IPC_CHANNELS.quitApp)
}

contextBridge.exposeInMainWorld('knittingCounter', api)
