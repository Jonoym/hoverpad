export const enum WindowType {
  Note = 'NOTE',
  Controls = 'CONTROLS'
}

// Invokers
export const CHANGE_OPACITY = 'change-opacity'
export const CREATE_NOTE = 'create-note'
export const TOGGLE_HIDE = 'toggle-hide'
export const TOGGLE_EDIT = 'toggle-edit'
export const TOGGLE_EXPAND = 'toggle-expand'
export const CLOSE_WINDOW = 'close-window'

export const SAVE_TITLE = 'save-title'
export const SAVE_CONTENT = 'save-content'
export const OPEN_NOTE = 'open-note'

// Listeners
export const SEND_TOGGLE_EDIT = 'send-toggle-edit'

export const appDirectoryName = '.hoverpad'
export const configurationsDirectoryName = 'config'
export const notesDirectoryName = 'notes'
export const archiveDirectoryName = 'archive'
export const configFileName = 'config.json'
export const metadataFileName = 'metadata.json'
