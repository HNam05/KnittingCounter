import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { COMPACT_OVERLAY_HEIGHT, COMPACT_OVERLAY_WIDTH, PROJECT_NOTES_MAX_LENGTH, writeStateFile } from './storage'
import type { ProjectIconId } from '../shared/projectIcons'
import type { AppSnapshot, HotkeyStatus, PersistedState, Project, RuntimeState, WindowMode } from '../shared/types'

type PersistedMutation = (state: PersistedState) => boolean
const SAVE_FAILURE_TEMPLATE = 'The app could not save changes to %PATH%.'

export class AppStore extends EventEmitter {
  private readonly dataFilePath: string
  private readonly initialStorageWarning: string | null
  private state: PersistedState
  private runtime: RuntimeState
  private mutationQueue: Promise<void> = Promise.resolve()

  constructor(initialState: PersistedState, dataFilePath: string, storageWarning: string | null) {
    super()
    this.state = initialState
    this.dataFilePath = dataFilePath
    this.initialStorageWarning = storageWarning
    this.runtime = {
      storageWarning,
      hotkeyStatuses: [],
      dataFilePath
    }
  }

  getSnapshot(): AppSnapshot {
    return structuredClone({
      ...this.state,
      runtime: this.runtime
    })
  }

  setHotkeyStatuses(statuses: HotkeyStatus[]): void {
    this.runtime.hotkeyStatuses = statuses
    this.emitChange()
  }

  async createProject(name: string): Promise<AppSnapshot> {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return this.getSnapshot()
    }

    return this.updatePersistedState((state) => {
      const timestamp = new Date().toISOString()
      const project: Project = {
        id: randomUUID(),
        name: trimmedName,
        iconId: null,
        notes: '',
        count: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      }

      state.projects.push(project)

      if (!state.activeProjectId) {
        state.activeProjectId = project.id
      }

      return true
    })
  }

  async renameProject(projectId: string, name: string): Promise<AppSnapshot> {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return this.getSnapshot()
    }

    return this.updatePersistedState((state) => {
      const project = state.projects.find((item) => item.id === projectId)

      if (!project || project.name === trimmedName) {
        return false
      }

      project.name = trimmedName
      return true
    })
  }

  async updateProjectNotes(projectId: string, notes: string): Promise<AppSnapshot> {
    const normalizedNotes = notes.trimEnd().slice(0, PROJECT_NOTES_MAX_LENGTH)

    return this.updatePersistedState((state) => {
      const project = state.projects.find((item) => item.id === projectId)

      if (!project || project.notes === normalizedNotes) {
        return false
      }

      project.notes = normalizedNotes
      return true
    })
  }

  async updateProjectIcon(projectId: string, iconId: ProjectIconId | null): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const project = state.projects.find((item) => item.id === projectId)

      if (!project || project.iconId === iconId) {
        return false
      }

      project.iconId = iconId
      return true
    })
  }

  async deleteProject(projectId: string): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const index = state.projects.findIndex((project) => project.id === projectId)

      if (index < 0) {
        return false
      }

      state.projects.splice(index, 1)

      if (state.projects.length === 0) {
        state.activeProjectId = null
        return true
      }

      if (state.activeProjectId === projectId) {
        const nextProject = state.projects[index] ?? state.projects[index - 1] ?? null
        state.activeProjectId = nextProject?.id ?? null
      }

      return true
    })
  }

  async resetProject(projectId: string): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const project = state.projects.find((item) => item.id === projectId)

      if (!project || project.count === 0) {
        return false
      }

      project.count = 0
      project.updatedAt = new Date().toISOString()
      return true
    })
  }

  async setActiveProject(projectId: string | null): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      if (projectId === null) {
        if (state.projects.length > 0 || state.activeProjectId === null) {
          return false
        }

        state.activeProjectId = null
        return true
      }

      if (!state.projects.some((project) => project.id === projectId) || state.activeProjectId === projectId) {
        return false
      }

      state.activeProjectId = projectId
      return true
    })
  }

  async incrementActiveProject(): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const project = this.findActiveProject(state)

      if (!project) {
        return false
      }

      project.count += 1
      project.updatedAt = new Date().toISOString()
      return true
    })
  }

  async decrementActiveProject(): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const project = this.findActiveProject(state)

      if (!project || project.count === 0) {
        return false
      }

      project.count = Math.max(0, project.count - 1)
      project.updatedAt = new Date().toISOString()
      return true
    })
  }

  async nextProject(): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      if (state.projects.length < 2 || !state.activeProjectId) {
        return false
      }

      const currentIndex = state.projects.findIndex((project) => project.id === state.activeProjectId)

      if (currentIndex < 0) {
        state.activeProjectId = state.projects[0]?.id ?? null
        return true
      }

      const nextIndex = (currentIndex + 1) % state.projects.length
      state.activeProjectId = state.projects[nextIndex]?.id ?? null
      return true
    })
  }

  async setMode(mode: WindowMode): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      if (state.settings.overlay.mode === mode) {
        return false
      }

      state.settings.overlay.mode = mode
      return true
    })
  }

  async showManager(): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const nextLocked = false
      const nextMode: WindowMode = 'manager'

      if (state.settings.overlay.mode === nextMode && state.settings.overlay.locked === nextLocked) {
        return false
      }

      state.settings.overlay.mode = nextMode
      state.settings.overlay.locked = nextLocked
      return true
    })
  }

  async setOverlayLocked(locked: boolean): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      if (state.settings.overlay.locked === locked) {
        return false
      }

      state.settings.overlay.locked = locked
      return true
    })
  }

  async setOverlayPosition(x: number, y: number): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const nextX = Math.round(x)
      const nextY = Math.round(y)

      if (state.settings.overlay.x === nextX && state.settings.overlay.y === nextY) {
        return false
      }

      state.settings.overlay.x = nextX
      state.settings.overlay.y = nextY
      return true
    })
  }

  async setOverlaySize(width: number, height: number): Promise<AppSnapshot> {
    return this.updatePersistedState((state) => {
      const nextWidth = Math.min(COMPACT_OVERLAY_WIDTH, Math.round(width))
      const nextHeight = Math.min(COMPACT_OVERLAY_HEIGHT, Math.round(height))

      if (state.settings.overlay.width === nextWidth && state.settings.overlay.height === nextHeight) {
        return false
      }

      state.settings.overlay.width = nextWidth
      state.settings.overlay.height = nextHeight
      return true
    })
  }

  private findActiveProject(state: PersistedState): Project | undefined {
    return state.projects.find((project) => project.id === state.activeProjectId)
  }

  private async updatePersistedState(mutation: PersistedMutation): Promise<AppSnapshot> {
    let nextSnapshot: AppSnapshot | null = null

    const operation = this.mutationQueue
      .catch(() => undefined)
      .then(async () => {
        const nextState = structuredClone(this.state)
        const didChange = mutation(nextState)

        if (!didChange) {
          nextSnapshot = this.getSnapshot()
          return
        }

        try {
          await writeStateFile(this.dataFilePath, nextState)
        } catch {
          this.runtime.storageWarning = this.createSaveFailureWarning()
          nextSnapshot = this.getSnapshot()
          this.emitChange(nextSnapshot)
          throw new Error('The app could not save this change.')
        }

        this.state = nextState
        this.runtime.storageWarning = this.initialStorageWarning
        nextSnapshot = this.getSnapshot()
        this.emitChange(nextSnapshot)
      })

    this.mutationQueue = operation.then(
      () => undefined,
      () => undefined
    )

    await operation
    return nextSnapshot ?? this.getSnapshot()
  }

  private createSaveFailureWarning(): string {
    const saveFailureWarning = SAVE_FAILURE_TEMPLATE.replace('%PATH%', this.dataFilePath)

    return this.initialStorageWarning ? `${this.initialStorageWarning} ${saveFailureWarning}` : saveFailureWarning
  }

  private emitChange(snapshot = this.getSnapshot()): void {
    this.emit('changed', snapshot)
  }
}
