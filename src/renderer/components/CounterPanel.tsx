interface CounterPanelProps {
  count: number
  canCount: boolean
  lastCountedLabel: string
  variant: 'compact' | 'manager'
  onIncrement: () => void
  onDecrement: () => void
}

export function CounterPanel({
  count,
  canCount,
  lastCountedLabel,
  variant,
  onIncrement,
  onDecrement
}: CounterPanelProps): JSX.Element {
  return (
    <section className={`counter-panel counter-panel--${variant}`}>
      <div className="counter-panel__count" aria-live="polite">
        {count}
      </div>
      <div className="counter-panel__actions">
        <button
          className="count-button count-button--secondary"
          disabled={!canCount}
          onClick={onDecrement}
          type="button"
        >
          -
        </button>
        <button className="count-button count-button--primary" disabled={!canCount} onClick={onIncrement} type="button">
          +
        </button>
      </div>
      <p className="counter-panel__meta">{lastCountedLabel}</p>
    </section>
  )
}
