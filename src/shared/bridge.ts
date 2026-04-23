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
} from './types'

export interface KnittingCounterApi {
  getState: () => Promise<AppSnapshot>
  subscribeState: (listener: (snapshot: AppSnapshot) => void) => () => void
  createProject: (input: CreateProjectInput) => Promise<AppSnapshot>
  renameProject: (input: RenameProjectInput) => Promise<AppSnapshot>
  updateProjectNotes: (input: UpdateProjectNotesInput) => Promise<AppSnapshot>
  updateProjectIcon: (input: UpdateProjectIconInput) => Promise<AppSnapshot>
  deleteProject: (input: DeleteProjectInput) => Promise<AppSnapshot>
  resetProject: (input: ResetProjectInput) => Promise<AppSnapshot>
  setActiveProject: (input: SetActiveProjectInput) => Promise<AppSnapshot>
  incrementActiveProject: () => Promise<AppSnapshot>
  decrementActiveProject: () => Promise<AppSnapshot>
  nextProject: () => Promise<AppSnapshot>
  setMode: (input: SetModeInput) => Promise<AppSnapshot>
  setOverlayLocked: (input: SetOverlayLockedInput) => Promise<AppSnapshot>
  quitApp: () => Promise<void>
}
