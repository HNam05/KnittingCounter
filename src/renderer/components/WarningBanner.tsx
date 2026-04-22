interface WarningBannerProps {
  title: string
  body: string
  tone?: 'warning' | 'error'
  onDismiss?: () => void
}

export function WarningBanner({ title, body, tone = 'warning', onDismiss }: WarningBannerProps): JSX.Element {
  return (
    <section className={`warning-banner warning-banner--${tone}`}>
      <div className="warning-banner__content">
        <p className="warning-banner__title">{title}</p>
        <p className="warning-banner__body">{body}</p>
      </div>
      {onDismiss ? (
        <button className="ghost-button ghost-button--small" onClick={onDismiss} type="button">
          Dismiss
        </button>
      ) : null}
    </section>
  )
}
