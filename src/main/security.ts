import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, session, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'

export function getBundledRendererEntryPath(): string {
  return path.join(__dirname, '../renderer/index.html')
}

function getTrustedDevServerUrl(): string | null {
  if (app.isPackaged || !process.env.ELECTRON_RENDERER_URL) {
    return null
  }

  try {
    return new URL(process.env.ELECTRON_RENDERER_URL).toString()
  } catch {
    return null
  }
}

export function resolveRendererTarget(
  bundledRendererPath: string
): { kind: 'url'; value: string } | { kind: 'file'; value: string } {
  const devServerUrl = getTrustedDevServerUrl()

  if (devServerUrl) {
    return { kind: 'url', value: devServerUrl }
  }

  return { kind: 'file', value: bundledRendererPath }
}

export function isTrustedRendererUrl(url: string, bundledRendererPath: string): boolean {
  const devServerUrl = getTrustedDevServerUrl()

  try {
    const parsedUrl = new URL(url)

    if (devServerUrl) {
      const trustedUrl = new URL(devServerUrl)
      return (
        parsedUrl.protocol === trustedUrl.protocol &&
        parsedUrl.hostname === trustedUrl.hostname &&
        parsedUrl.port === trustedUrl.port
      )
    }

    return parsedUrl.protocol === 'file:' && path.resolve(fileURLToPath(parsedUrl)) === path.resolve(bundledRendererPath)
  } catch {
    return false
  }
}

export function assertTrustedIpcSender(
  event: IpcMainInvokeEvent,
  window: BrowserWindow | null,
  bundledRendererPath: string
): void {
  const frameUrl = event.senderFrame?.url ?? event.sender.getURL()

  if (!window || window.isDestroyed() || event.sender !== window.webContents) {
    throw new Error('Unauthorized IPC sender.')
  }

  if (!isTrustedRendererUrl(frameUrl, bundledRendererPath)) {
    throw new Error('Untrusted renderer origin.')
  }
}

export function hardenWindowNavigation(window: BrowserWindow, bundledRendererPath: string): void {
  const blockUnexpectedNavigation = (event: { preventDefault: () => void }, url: string): void => {
    if (!isTrustedRendererUrl(url, bundledRendererPath)) {
      event.preventDefault()
    }
  }

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', blockUnexpectedNavigation)
  window.webContents.on('will-redirect', blockUnexpectedNavigation)
}

export function registerPermissionGuards(): void {
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
}
