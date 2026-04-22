export type WindowMode = 'compact' | 'manager'
export type HotkeyAction = 'increment' | 'decrement' | 'nextProject' | 'toggleExpand'

export interface Project {
  id: string
  name: string
  count: number
  createdAt: string
  updatedAt: string
}

export interface HotkeyConfig {
  increment: string
  decrement: string
  nextProject: string
  toggleExpand: string
}

export interface OverlaySettings {
  locked: boolean
  x: number
  y: number
  width: number
  height: number
  mode: WindowMode
}

export interface AppSettings {
  hotkeys: HotkeyConfig
  overlay: OverlaySettings
}

export interface PersistedState {
  projects: Project[]
  activeProjectId: string | null
  settings: AppSettings
}

export interface HotkeyStatus {
  action: HotkeyAction
  accelerator: string
  registered: boolean
  message?: string
}

export interface RuntimeState {
  storageWarning: string | null
  hotkeyStatuses: HotkeyStatus[]
  dataFilePath: string
}

export interface AppSnapshot extends PersistedState {
  runtime: RuntimeState
}

export interface SetModeInput {
  mode: WindowMode
}

export interface SetActiveProjectInput {
  projectId: string | null
}

export interface CreateProjectInput {
  name: string
}

export interface RenameProjectInput {
  projectId: string
  name: string
}

export interface DeleteProjectInput {
  projectId: string
}

export interface ResetProjectInput {
  projectId: string
}

export interface SetOverlayLockedInput {
  locked: boolean
}
