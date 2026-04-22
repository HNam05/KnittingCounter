import type { KnittingCounterApi } from './bridge'

declare global {
  interface Window {
    knittingCounter: KnittingCounterApi
  }
}

export {}
