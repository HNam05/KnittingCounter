import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/app.css'

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  override componentDidCatch(error: Error): void {
    console.error('Renderer startup failed:', error)
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="app-shell loading-shell crash-shell">
          <div className="crash-shell__content">
            <h1 className="crash-shell__title">The window failed to render</h1>
            <p className="crash-shell__body">A renderer error stopped the UI from loading.</p>
            <p className="crash-shell__body">Close the app and reopen the rebuilt packaged version.</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
)
