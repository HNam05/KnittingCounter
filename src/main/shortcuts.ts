import { globalShortcut } from 'electron'
import type { HotkeyAction, HotkeyStatus } from '../shared/types'
import type { AppStore } from './store'
import type { WindowController } from './windowController'

// Electron's globalShortcut API does not expose global keyup events, so the
// Windows key autorepeat needs to be suppressed with a small one-shot latch.
const COUNT_HOTKEY_INITIAL_SUPPRESSION_MS = 850
const COUNT_HOTKEY_RELEASE_GAP_MS = 140

interface HotkeyRegistration {
  action: HotkeyAction
  accelerator: string
  handler: () => void
}

function createSinglePressHandler(handler: () => void): () => void {
  let isLatched = false
  let firstTriggerAt = 0
  let lastTriggerAt = 0
  let releaseTimer: NodeJS.Timeout | null = null

  const scheduleReleaseCheck = (): void => {
    if (releaseTimer) {
      clearTimeout(releaseTimer)
    }

    const checkRelease = (): void => {
      const now = Date.now()
      const remainingInitialSuppression = COUNT_HOTKEY_INITIAL_SUPPRESSION_MS - (now - firstTriggerAt)
      const remainingReleaseGap = COUNT_HOTKEY_RELEASE_GAP_MS - (now - lastTriggerAt)

      if (remainingInitialSuppression <= 0 && remainingReleaseGap <= 0) {
        isLatched = false
        releaseTimer = null
        return
      }

      releaseTimer = setTimeout(
        checkRelease,
        Math.max(remainingInitialSuppression, remainingReleaseGap, 16)
      )
    }

    releaseTimer = setTimeout(
      checkRelease,
      Math.max(
        COUNT_HOTKEY_INITIAL_SUPPRESSION_MS - (Date.now() - firstTriggerAt),
        COUNT_HOTKEY_RELEASE_GAP_MS,
        16
      )
    )
  }

  return () => {
    const now = Date.now()

    if (!isLatched) {
      isLatched = true
      firstTriggerAt = now
      lastTriggerAt = now
      handler()
      scheduleReleaseCheck()
      return
    }

    lastTriggerAt = now
    scheduleReleaseCheck()
  }
}

export function registerGlobalHotkeys(store: AppStore, windowController: WindowController): void {
  globalShortcut.unregisterAll()

  const hotkeys = store.getSnapshot().settings.hotkeys

  const registrations: HotkeyRegistration[] = [
    {
      action: 'increment',
      accelerator: hotkeys.increment,
      handler: createSinglePressHandler(() => {
        void store.incrementActiveProject()
      })
    },
    {
      action: 'decrement',
      accelerator: hotkeys.decrement,
      handler: createSinglePressHandler(() => {
        void store.decrementActiveProject()
      })
    },
    {
      action: 'nextProject',
      accelerator: hotkeys.nextProject,
      handler: createSinglePressHandler(() => {
        void store.nextProject()
      })
    },
    {
      action: 'toggleExpand',
      accelerator: hotkeys.toggleExpand,
      handler: () => {
        void store.showManager()
        windowController.focusManager()
      }
    }
  ]

  const statuses: HotkeyStatus[] = registrations.map((registration) => {
    const registered = globalShortcut.register(registration.accelerator, registration.handler)

    return {
      action: registration.action,
      accelerator: registration.accelerator,
      registered,
      message: registered ? undefined : `${registration.accelerator} is unavailable on this machine.`
    }
  })

  store.setHotkeyStatuses(statuses)
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll()
}
