import type {
  AppSnapshot,
  CreateProjectInput,
  DeleteProjectInput,
  RenameProjectInput,
  ResetProjectInput,
  SetActiveProjectInput,
  SetModeInput,
  SetOverlayLockedInput
} from './types'

export interface KnittingCounterApi {
  getState: () => Promise<AppSnapshot>
  subscribeState: (listener: (snapshot: AppSnapshot) => void) => () => void
  createProject: (input: CreateProjectInput) => Promise<AppSnapshot>
  renameProject: (input: RenameProjectInput) => Promise<AppSnapshot>
  deleteProject: (input: DeleteProjectInput) => Promise<AppSnapshot>
  resetProject: (input: ResetProjectInput) => Promise<AppSnapshot>
  setActiveProject: (input: SetActiveProjectInput) => Promise<AppSnapshot>
  incrementActiveProject: () => Promise<AppSnapshot>
  decrementActiveProject: () => Promise<AppSnapshot>
  nextProject: () => Promise<AppSnapshot>
  setMode: (input: SetModeInput) => Promise<AppSnapshot>
  setOverlayLocked: (input: SetOverlayLockedInput) => Promise<AppSnapshot>
}
