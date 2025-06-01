export const CONTROL_PANEL_ID = 'CONTROL_PANEL'

export const enum WindowType {
  Note = 'NOTE',
  ControlPanel = 'CONTROLS'
}

// Invokers
export const CHANGE_OPACITY = 'change-opacity'
export const CREATE_NOTE = 'create-note'
export const TOGGLE_HIDE = 'toggle-hide'
export const TOGGLE_EDIT = 'toggle-edit'
export const TOGGLE_EXPAND = 'toggle-expand'
export const CLOSE_WINDOW = 'close-window'

export const SAVE_NOTE = 'save-note'
export const OPEN_NOTE = 'open-note'
export const DELETE_NOTE = 'delete-note'
export const CLOSE_NOTE = 'close-note'
export const REFRESH_NOTES = 'refresh-notes'

// Listeners
export const SEND_TOGGLE_EDIT = 'send-toggle-edit'
export const SEND_NOTES_LIST = 'send-notes-list'
export const SEND_WINDOWS_INFORMATION = 'send-windows-info'

// Configuration Names
export const applicationName = 'Hoverpad'
export const appDirectoryName = '.hoverpad'
export const configurationsDirectoryName = 'config'
export const notesDirectoryName = 'notes'
export const archiveDirectoryName = 'archive'
export const configFilename = 'config.json'
export const windowsFilename = 'windows.json'
export const metadataFilename = 'metadata.json'
