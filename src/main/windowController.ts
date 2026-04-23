import path from 'node:path'
import { app, BrowserWindow, screen, type Rectangle } from 'electron'
import type { AppSnapshot } from '../shared/types'
import type { AppStore } from './store'
import { getBundledRendererEntryPath, hardenWindowNavigation, resolveRendererTarget } from './security'

const MANAGER_MIN_WIDTH = 900
const MANAGER_MIN_HEIGHT = 760
const DEFAULT_MANAGER_WIDTH = 1120
const DEFAULT_MANAGER_HEIGHT = 920

export class WindowController {
  private readonly store: AppStore
  private mainWindow: BrowserWindow | null = null
  private managerBounds: Rectangle | null = null
  private moveTimeout: NodeJS.Timeout | null = null
  private resizeTimeout: NodeJS.Timeout | null = null

  constructor(store: AppStore) {
    this.store = store
  }

  getWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  async createWindow(): Promise<BrowserWindow> {
    const snapshot = this.store.getSnapshot()
    const { x, y, width, height } = snapshot.settings.overlay
    const bundledRendererPath = getBundledRendererEntryPath()

    this.mainWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      minWidth: width,
      minHeight: height,
      maxWidth: width,
      maxHeight: height,
      show: false,
      frame: false,
      resizable: false,
      maximizable: false,
      minimizable: true,
      fullscreenable: false,
      alwaysOnTop: true,
      skipTaskbar: false,
      autoHideMenuBar: true,
      backgroundColor: '#ffe8ef',
      title: 'Knitting Counter Overlay',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        devTools: !app.isPackaged
      }
    })

    this.mainWindow.removeMenu()
    this.registerWindowEvents()
    hardenWindowNavigation(this.mainWindow, bundledRendererPath)

    const rendererTarget = resolveRendererTarget(bundledRendererPath)

    if (rendererTarget.kind === 'url') {
      await this.mainWindow.loadURL(rendererTarget.value)
    } else {
      await this.mainWindow.loadFile(rendererTarget.value)
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
      this.focusManagerIfNeeded(this.store.getSnapshot())
    })

    this.applySnapshot(snapshot)
    return this.mainWindow
  }

  applySnapshot(snapshot: AppSnapshot): void {
    const window = this.mainWindow

    if (!window || window.isDestroyed()) {
      return
    }

    const { locked, mode, x, y, width, height } = snapshot.settings.overlay

    if (mode === 'compact') {
      const bounds = window.getBounds()

      if (bounds.x !== x || bounds.y !== y || bounds.width !== width || bounds.height !== height) {
        window.setBounds({ x, y, width, height })
      }

      window.setResizable(false)
      window.setMinimumSize(width, height)
      window.setMaximumSize(width, height)
      window.setAlwaysOnTop(true, 'floating')
      window.setIgnoreMouseEvents(locked, locked ? { forward: true } : undefined)
    } else {
      const nextBounds = this.resolveManagerBounds(x, y)
      const bounds = window.getBounds()
      const minimumSize = this.resolveManagerMinimumSize(nextBounds.x, nextBounds.y)

      if (
        bounds.x !== nextBounds.x ||
        bounds.y !== nextBounds.y ||
        bounds.width !== nextBounds.width ||
        bounds.height !== nextBounds.height
      ) {
        window.setBounds(nextBounds)
      }

      window.setResizable(true)
      window.setMinimumSize(minimumSize.width, minimumSize.height)
      window.setMaximumSize(10000, 10000)
      window.setAlwaysOnTop(false)
      window.setIgnoreMouseEvents(false)
    }
  }

  focusManager(): void {
    const snapshot = this.store.getSnapshot()
    this.focusManagerIfNeeded(snapshot)
  }

  focusWindow(): void {
    if (!this.mainWindow) {
      return
    }

    const snapshot = this.store.getSnapshot()

    if (snapshot.settings.overlay.mode === 'compact' && snapshot.settings.overlay.locked) {
      void this.store.setOverlayLocked(false).catch(() => undefined)
    }

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }

    this.mainWindow.show()
    this.mainWindow.focus()
  }

  forceInteractive(): void {
    this.mainWindow?.setIgnoreMouseEvents(false)
  }

  private focusManagerIfNeeded(snapshot: AppSnapshot): void {
    if (snapshot.settings.overlay.mode !== 'manager' || !this.mainWindow) {
      return
    }

    this.focusWindow()
  }

  private resolveManagerBounds(x: number, y: number): Rectangle {
    const preferredBounds =
      this.managerBounds
        ? {
            ...this.managerBounds,
            width: Math.max(this.managerBounds.width, DEFAULT_MANAGER_WIDTH),
            height: Math.max(this.managerBounds.height, DEFAULT_MANAGER_HEIGHT)
          }
        : {
            x: Math.max(0, x - 32),
            y: Math.max(0, y - 24),
            width: DEFAULT_MANAGER_WIDTH,
            height: DEFAULT_MANAGER_HEIGHT
          }

    return this.normalizeManagerBounds(preferredBounds)
  }

  private resolveManagerMinimumSize(x: number, y: number): Pick<Rectangle, 'width' | 'height'> {
    const workArea = screen.getDisplayNearestPoint({ x, y }).workArea

    return {
      width: Math.min(MANAGER_MIN_WIDTH, workArea.width),
      height: Math.min(MANAGER_MIN_HEIGHT, workArea.height)
    }
  }

  private normalizeManagerBounds(bounds: Rectangle): Rectangle {
    const workArea = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y }).workArea
    const minimumSize = this.resolveManagerMinimumSize(bounds.x, bounds.y)
    const width = Math.min(Math.max(bounds.width, minimumSize.width), workArea.width)
    const height = Math.min(Math.max(bounds.height, minimumSize.height), workArea.height)
    const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width)
    const y = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height)

    return { x, y, width, height }
  }

  private registerWindowEvents(): void {
    const window = this.mainWindow

    if (!window) {
      return
    }

    window.on('move', () => {
      if (this.moveTimeout) {
        clearTimeout(this.moveTimeout)
      }

      this.moveTimeout = setTimeout(() => {
        const currentWindow = this.mainWindow

        if (!currentWindow || currentWindow.isDestroyed()) {
          return
        }

        const bounds = currentWindow.getBounds()
        const mode = this.store.getSnapshot().settings.overlay.mode

        if (mode === 'manager') {
          this.managerBounds = this.normalizeManagerBounds(bounds)
        }

        void this.store.setOverlayPosition(bounds.x, bounds.y).catch(() => undefined)
      }, 120)
    })

    window.on('resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }

      this.resizeTimeout = setTimeout(() => {
        const currentWindow = this.mainWindow

        if (!currentWindow || currentWindow.isDestroyed()) {
          return
        }

        const bounds = currentWindow.getBounds()
        const mode = this.store.getSnapshot().settings.overlay.mode

        if (mode === 'compact') {
          void this.store.setOverlaySize(bounds.width, bounds.height).catch(() => undefined)
          return
        }

        this.managerBounds = this.normalizeManagerBounds(bounds)
      }, 120)
    })
  }
}
