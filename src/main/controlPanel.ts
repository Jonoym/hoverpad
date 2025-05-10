import { SEND_TOGGLE_EDIT } from '@shared/constants'
import { appState } from './state'
import { controlPanelClosed, controlPanelOpen } from './windows'

interface Response {
  success: boolean
  error?: string
}

export const updateOpacity = (value: number): Response => {
  const mainWindow = appState.windows.main
  if (!mainWindow) return { success: false, error: 'Main window not found' }
  if (value < 0 || value > 1) return { success: false, error: 'Invalid opacity value' }
  mainWindow.setOpacity(value)

  for (const win of appState.windows.idToNoteBrowser.values()) {
    if (!win.isDestroyed()) {
      win.setOpacity(value)
    }
  }

  if (value !== 0) appState.config.opacity = value

  return { success: true }
}

export const toggleHide = (): void => {
  if (appState.config.hidden) {
    appState.config.hidden = false
    updateOpacity(appState.config.opacity)
    updateEdit(appState.config.editable)
  } else {
    appState.config.hidden = true
    updateOpacity(0)
    updateEdit(false)
  }
}

export const updateEdit = (state: boolean): Response => {
  const mainWindow = appState.windows.main
  if (!mainWindow) return { success: false, error: 'Main window not found' }

  for (const win of appState.windows.idToNoteBrowser.values()) {
    if (!win.isDestroyed()) {
      win.setIgnoreMouseEvents(!state)
    }
  }

  return { success: true }
}

export const toggleEdit = (): Response => {
  if (appState.config.hidden) return { success: false, error: 'Main window is hidden' }
  appState.config.editable = !appState.config.editable

  appState.windows.main?.webContents.send(SEND_TOGGLE_EDIT, appState.config.editable)
  for (const win of appState.windows.idToNoteBrowser.values())
    win?.webContents.send(SEND_TOGGLE_EDIT, appState.config.editable)

  return updateEdit(appState.config.editable)
}

export const toggleExpand = (): Response => {
  const controlPanel = appState.windows.main
  appState.config.expanded = !appState.config.expanded

  controlPanel?.setResizable(true)
  if (appState.config.expanded) {
    controlPanel?.setSize(controlPanelOpen.width, controlPanelOpen.height)
  } else {
    controlPanel?.setSize(controlPanelClosed.width, controlPanelClosed.height)
  }
  controlPanel?.setResizable(false)
  return { success: true }
}
