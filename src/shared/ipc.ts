export const IPC_CHANNELS = {
  getState: 'app:get-state',
  stateChanged: 'app:state-changed',
  createProject: 'projects:create',
  renameProject: 'projects:rename',
  deleteProject: 'projects:delete',
  resetProject: 'projects:reset',
  setActiveProject: 'projects:set-active',
  incrementActiveProject: 'projects:increment-active',
  decrementActiveProject: 'projects:decrement-active',
  nextProject: 'projects:next',
  setMode: 'overlay:set-mode',
  setOverlayLocked: 'overlay:set-locked',
  quitApp: 'app:quit'
} as const
