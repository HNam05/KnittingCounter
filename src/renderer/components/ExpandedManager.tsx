import { useEffect, useState, type FormEvent } from 'react'
import type { AppSnapshot, Project } from '../../shared/types'
import { CounterPanel } from './CounterPanel'
import { ProjectList } from './ProjectList'
import { WarningBanner } from './WarningBanner'

interface ExpandedManagerProps {
  snapshot: AppSnapshot
  activeProject: Project | null
  lastCountedLabel: string
  exactTimestamp: string
  localError: string | null
  onClearLocalError: () => void
  onCreateProject: (name: string) => Promise<void>
  onRenameProject: (projectId: string, name: string) => Promise<void>
  onDeleteProject: (projectId: string) => Promise<void>
  onResetProject: (projectId: string) => Promise<void>
  onSelectProject: (projectId: string) => Promise<void>
  onIncrement: () => Promise<void>
  onDecrement: () => Promise<void>
  onCollapse: () => Promise<void>
  onSetLocked: (locked: boolean) => Promise<void>
}

export function ExpandedManager({
  snapshot,
  activeProject,
  lastCountedLabel,
  exactTimestamp,
  localError,
  onClearLocalError,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onResetProject,
  onSelectProject,
  onIncrement,
  onDecrement,
  onCollapse,
  onSetLocked
}: ExpandedManagerProps): JSX.Element {
  const [newProjectName, setNewProjectName] = useState('')
  const [renameValue, setRenameValue] = useState(activeProject?.name ?? '')

  useEffect(() => {
    setRenameValue(activeProject?.name ?? '')
  }, [activeProject?.id, activeProject?.name])

  const failedHotkeys = snapshot.runtime.hotkeyStatuses.filter((status) => !status.registered)

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newProjectName.trim()) {
      return
    }

    await onCreateProject(newProjectName)
    setNewProjectName('')
  }

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeProject || !renameValue.trim()) {
      return
    }

    await onRenameProject(activeProject.id, renameValue)
  }

  const handleDelete = async () => {
    if (!activeProject) {
      return
    }

    const confirmed = window.confirm(`Delete "${activeProject.name}"? This cannot be undone.`)

    if (confirmed) {
      await onDeleteProject(activeProject.id)
    }
  }

  const handleReset = async () => {
    if (!activeProject) {
      return
    }

    const confirmed = window.confirm(`Reset "${activeProject.name}" back to 0 stitches?`)

    if (confirmed) {
      await onResetProject(activeProject.id)
    }
  }

  return (
    <main className="app-shell manager-shell">
      <header className="manager-header">
        <div className="manager-header__copy">
          <p className="eyebrow">Knitting Counter Overlay</p>
          <h1 className="manager-header__title">Project manager</h1>
        </div>
        <div className="manager-header__actions no-drag">
          <label className="toggle-chip">
            <input
              checked={snapshot.settings.overlay.locked}
              onChange={(event) => void onSetLocked(event.target.checked)}
              type="checkbox"
            />
            <span>Lock compact overlay</span>
          </label>
          <button className="ghost-button" onClick={() => void onCollapse()} type="button">
            Compact mode
          </button>
        </div>
      </header>

      <div className="manager-layout">
        <aside className="manager-sidebar">
          <section className="sidebar-section">
            <div className="section-header">
              <h2 className="section-title">Projects</h2>
              <p className="section-subtitle">{snapshot.projects.length} total</p>
            </div>

            <form className="project-form" onSubmit={(event) => void handleCreateSubmit(event)}>
              <label className="field">
                <span className="field__label">New project</span>
                <input
                  autoFocus={snapshot.projects.length === 0}
                  className="text-input"
                  maxLength={60}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Scarf, hat, socks..."
                  type="text"
                  value={newProjectName}
                />
              </label>
              <button className="primary-button" type="submit">
                Add project
              </button>
            </form>
          </section>

          <ProjectList
            activeProjectId={snapshot.activeProjectId}
            onSelectProject={(projectId) => void onSelectProject(projectId)}
            projects={snapshot.projects}
          />
        </aside>

        <section className="manager-content">
          {snapshot.runtime.storageWarning ? (
            <WarningBanner body={snapshot.runtime.storageWarning} title="Storage recovery" />
          ) : null}

          {failedHotkeys.map((status) => (
            <WarningBanner
              key={status.action}
              body={status.message ?? `${status.accelerator} could not be registered.`}
              title={`Hotkey unavailable: ${status.accelerator}`}
            />
          ))}

          {localError ? (
            <WarningBanner body={localError} onDismiss={onClearLocalError} title="Action failed" tone="error" />
          ) : null}

          {activeProject ? (
            <>
              <section className="detail-surface">
                <div className="detail-surface__header">
                  <div>
                    <p className="eyebrow">Active project</p>
                    <h2 className="detail-surface__title">{activeProject.name}</h2>
                  </div>
                  <div className="status-cluster">
                    <span className="status-pill">Hotkeys: F8/F7/F6/F9</span>
                    <span className="status-pill">Data: local JSON</span>
                  </div>
                </div>

                <CounterPanel
                  canCount={true}
                  count={activeProject.count}
                  lastCountedLabel={lastCountedLabel}
                  onDecrement={() => void onDecrement()}
                  onIncrement={() => void onIncrement()}
                  variant="manager"
                />
              </section>

              <section className="detail-grid">
                <section className="detail-section">
                  <div className="section-header">
                    <h3 className="section-title">Rename project</h3>
                    <p className="section-subtitle">Names stay local to this machine.</p>
                  </div>
                  <form className="project-form" onSubmit={(event) => void handleRenameSubmit(event)}>
                    <label className="field">
                      <span className="field__label">Project name</span>
                      <input
                        className="text-input"
                        maxLength={60}
                        onChange={(event) => setRenameValue(event.target.value)}
                        type="text"
                        value={renameValue}
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      Save name
                    </button>
                  </form>
                </section>

                <section className="detail-section">
                  <div className="section-header">
                    <h3 className="section-title">Project details</h3>
                    <p className="section-subtitle">Exact timestamps update after each count change.</p>
                  </div>
                  <dl className="detail-list">
                    <div>
                      <dt>Last counted</dt>
                      <dd>{exactTimestamp}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(activeProject.createdAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Project ID</dt>
                      <dd className="detail-list__mono">{activeProject.id}</dd>
                    </div>
                  </dl>
                </section>
              </section>

              <section className="danger-row">
                <button className="ghost-button" onClick={handleReset} type="button">
                  Reset count
                </button>
                <button className="danger-button" onClick={handleDelete} type="button">
                  Delete project
                </button>
              </section>
            </>
          ) : (
            <section className="empty-manager">
              <p className="eyebrow">Empty state</p>
              <h2 className="empty-manager__title">Create your first knitting project</h2>
              <p className="empty-manager__body">
                The compact overlay is ready, but counting stays disabled until you add a named project.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  )
}
