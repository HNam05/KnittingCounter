import { useEffect, useRef, useState } from 'react'
import { CompactOverlay } from './components/CompactOverlay'
import { ExpandedManager } from './components/ExpandedManager'
import type { AppSnapshot, Project } from '../shared/types'

function formatExactTimestamp(value: string | null): string {
  if (!value) {
    return 'No activity yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(new Date(value))
}

export default function App(): JSX.Element {
  const api = typeof window.knittingCounter === 'undefined' ? null : window.knittingCounter
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [incrementFlashKey, setIncrementFlashKey] = useState(0)
  const previousCompactStateRef = useRef<{
    mode: 'compact' | 'manager'
    projectId: string | null
    count: number
  } | null>(null)

  useEffect(() => {
    if (!api) {
      setLocalError('The Electron bridge did not load. Close the app and reopen the packaged build.')
      return
    }

    let mounted = true

    const load = async () => {
      try {
        const initialSnapshot = await api.getState()

        if (mounted) {
          setSnapshot(initialSnapshot)
        }
      } catch {
        if (mounted) {
          setLocalError('The app could not load its local state.')
        }
      }
    }

    const unsubscribe = api.subscribeState((nextSnapshot) => {
      if (mounted) {
        setSnapshot(nextSnapshot)
      }
    })

    void load()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [api])

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setLocalError(null)
      await action()
    } catch {
      setLocalError('Something went wrong while applying that change.')
    }
  }

  const activeProject: Project | null =
    snapshot?.projects.find((project) => project.id === snapshot.activeProjectId) ?? null

  useEffect(() => {
    if (!snapshot) {
      return
    }

    const nextCompactState = {
      mode: snapshot.settings.overlay.mode,
      projectId: activeProject?.id ?? null,
      count: activeProject?.count ?? 0
    }

    const previousCompactState = previousCompactStateRef.current

    if (
      previousCompactState &&
      previousCompactState.mode === 'compact' &&
      nextCompactState.mode === 'compact' &&
      previousCompactState.projectId !== null &&
      previousCompactState.projectId === nextCompactState.projectId &&
      nextCompactState.count > previousCompactState.count
    ) {
      setIncrementFlashKey((current) => current + 1)
    }

    previousCompactStateRef.current = nextCompactState
  }, [activeProject?.count, activeProject?.id, snapshot])

  if (!api) {
    return (
      <main className="app-shell loading-shell crash-shell">
        <div className="crash-shell__content">
          <h1 className="crash-shell__title">Unable to start the app</h1>
          <p className="crash-shell__body">The secure Electron bridge is missing.</p>
          <p className="crash-shell__body">Launch the packaged `Knitting Counter Overlay.exe` again from the rebuilt `release\\win-unpacked` folder.</p>
        </div>
      </main>
    )
  }

  if (!snapshot) {
    return (
      <main className="app-shell loading-shell">
        <p className="loading-copy">Loading Knitting Counter Overlay...</p>
        {localError ? <p className="loading-copy">{localError}</p> : null}
      </main>
    )
  }

  const lastCountedLabel = activeProject
    ? `Last counted: ${formatExactTimestamp(activeProject.updatedAt)}`
    : 'Last counted: add a project first'

  const exactTimestamp = activeProject ? formatExactTimestamp(activeProject.updatedAt) : 'No activity yet'

  if (snapshot.settings.overlay.mode === 'compact') {
    return (
      <CompactOverlay
        activeCount={activeProject?.count ?? 0}
        activeProjectName={activeProject?.name ?? null}
        hasMultipleProjects={snapshot.projects.length > 1}
        incrementFlashKey={incrementFlashKey}
        isLocked={snapshot.settings.overlay.locked}
        onOpenManager={() => void runAction(() => window.knittingCounter.setMode({ mode: 'manager' }))}
        onQuitApp={() => void runAction(() => window.knittingCounter.quitApp())}
      />
    )
  }

  return (
    <ExpandedManager
      activeProject={activeProject}
      exactTimestamp={exactTimestamp}
      lastCountedLabel={lastCountedLabel}
      localError={localError}
      onClearLocalError={() => setLocalError(null)}
      onCollapse={() => runAction(() => window.knittingCounter.setMode({ mode: 'compact' }))}
      onCreateProject={(name) => runAction(() => window.knittingCounter.createProject({ name }))}
      onDecrement={() => runAction(() => window.knittingCounter.decrementActiveProject())}
      onDeleteProject={(projectId) => runAction(() => window.knittingCounter.deleteProject({ projectId }))}
      onIncrement={() => runAction(() => window.knittingCounter.incrementActiveProject())}
      onRenameProject={(projectId, name) => runAction(() => window.knittingCounter.renameProject({ projectId, name }))}
      onResetProject={(projectId) => runAction(() => window.knittingCounter.resetProject({ projectId }))}
      onSelectProject={(projectId) => runAction(() => window.knittingCounter.setActiveProject({ projectId }))}
      onSetLocked={(locked) => runAction(() => window.knittingCounter.setOverlayLocked({ locked }))}
      onUpdateProjectIcon={(projectId, iconId) =>
        runAction(() => window.knittingCounter.updateProjectIcon({ projectId, iconId }))
      }
      onUpdateNotes={(projectId, notes) => runAction(() => window.knittingCounter.updateProjectNotes({ projectId, notes }))}
      onQuitApp={() => runAction(() => window.knittingCounter.quitApp())}
      snapshot={snapshot}
    />
  )
}
