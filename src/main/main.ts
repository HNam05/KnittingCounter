import { app, Menu } from 'electron'
import { broadcastSnapshot, registerIpcHandlers } from './ipc'
import { getBundledRendererEntryPath, registerPermissionGuards } from './security'
import { loadStateFile } from './storage'
import { AppStore } from './store'
import { registerGlobalHotkeys, unregisterGlobalHotkeys } from './shortcuts'
import { WindowController } from './windowController'

const APP_ID = 'com.hanne.knittingcounteroverlay'

let store: AppStore | null = null
let windowController: WindowController | null = null

async function bootstrap(): Promise<void> {
  Menu.setApplicationMenu(null)
  registerPermissionGuards()

  const { state, dataFilePath, storageWarning } = await loadStateFile(app.getPath('userData'))
  store = new AppStore(state, dataFilePath, storageWarning)
  windowController = new WindowController(store)

  registerIpcHandlers(
    store,
    () => windowController?.getWindow() ?? null,
    getBundledRendererEntryPath()
  )

  store.on('changed', (snapshot) => {
    windowController?.applySnapshot(snapshot)
    broadcastSnapshot(windowController?.getWindow() ?? null, snapshot)
  })

  await windowController.createWindow()
  if (store.getSnapshot().settings.overlay.mode === 'compact' && store.getSnapshot().settings.overlay.locked) {
    try {
      await store.setOverlayLocked(false)
    } catch {
      windowController.forceInteractive()
    }
  }
  registerGlobalHotkeys(store, windowController)
  broadcastSnapshot(windowController.getWindow(), store.getSnapshot())
}

app.setAppUserModelId(APP_ID)

app.whenReady().then(async () => {
  await bootstrap()

  app.on('activate', async () => {
    if (!windowController?.getWindow()) {
      await bootstrap()
      return
    }

    windowController.focusWindow()
  })
})

app.on('will-quit', () => {
  unregisterGlobalHotkeys()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
