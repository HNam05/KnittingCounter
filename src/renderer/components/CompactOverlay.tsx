import counterFlashImage from '../../../Background/Counter.jpg'

interface CompactOverlayProps {
  activeProjectName: string | null
  activeCount: number
  hasMultipleProjects: boolean
  isLocked: boolean
  incrementFlashKey: number
  onOpenManager: () => void
}

export function CompactOverlay({
  activeProjectName,
  activeCount,
  hasMultipleProjects,
  isLocked,
  incrementFlashKey,
  onOpenManager,
}: CompactOverlayProps): JSX.Element {
  const hotkeyLine = `F8 +1  ·  F7 -1${hasMultipleProjects ? '  ·  F6 next' : ''}  ·  F9 manager`
  const statusLine = isLocked
    ? 'Locked: press F9 or click the taskbar icon'
    : activeProjectName
      ? 'Double-click the overlay or press F9 for manager'
      : 'No project yet: press F9 to create one'

  return (
    <main className={`app-shell compact-shell${isLocked ? ' compact-shell--locked' : ''}`} onDoubleClick={isLocked ? undefined : onOpenManager}>
      {incrementFlashKey > 0 ? (
        <img
          key={incrementFlashKey}
          alt=""
          aria-hidden="true"
          className="compact-shell__increment-flash"
          src={counterFlashImage}
        />
      ) : null}

      <header className="compact-name-row">
        <p className="compact-name-row__label">{activeProjectName ?? 'No project selected'}</p>
      </header>

      <section className="compact-count-panel" aria-live="polite">
        <div className="compact-count-panel__count">{activeProjectName ? activeCount : '--'}</div>
      </section>

      <footer className="compact-footer compact-footer--minimal">
        <p className="compact-footer__hotkeys">{hotkeyLine}</p>
        <p className="compact-footer__status compact-footer__status--full">{statusLine}</p>
      </footer>
    </main>
  )
}
