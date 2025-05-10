import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createControlPanel, createNotepad } from './windows'
import { loadConfiguration, loadMetadata, saveContent, updateTitle } from './files'
import { appState } from './state'
import {
  CHANGE_OPACITY,
  CLOSE_WINDOW,
  CREATE_NOTE,
  OPEN_NOTE,
  SAVE_CONTENT,
  SAVE_TITLE,
  TOGGLE_EDIT,
  TOGGLE_EXPAND,
  TOGGLE_HIDE
} from '@shared/constants'
import { toggleEdit, toggleExpand, toggleHide, updateOpacity } from './controlPanel'

const createWindow = (): void => {
  appState.windows.main = createControlPanel()
}

const setupApplication = async () => {
  const [config, metadata] = await Promise.all([loadConfiguration(), loadMetadata()])

  if (config != null) appState.config = config
  if (metadata != null) appState.metadata = metadata

  createWindow()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupApplication()

  globalShortcut.register('CommandOrControl+H', toggleHide)
  globalShortcut.register('CommandOrControl+E', toggleEdit)
  globalShortcut.register('CommandOrControl+N', () => createNotepad({ name: 'New Note' }))

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle(CHANGE_OPACITY, (event, value) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  return updateOpacity(value)
})

ipcMain.handle(CREATE_NOTE, (event, data) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    const windowId = createNotepad(data)
    return { success: true, windowId: windowId }
  } catch (error) {
    console.error('Failed to open secondary window:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle(TOGGLE_HIDE, (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    toggleHide()
    return { success: true }
  } catch (error) {
    console.error('Failed to Toggle Hide:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle(TOGGLE_EDIT, (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    toggleEdit()
    return { success: true }
  } catch (error) {
    console.error('Failed to Toggle Edit:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle(TOGGLE_EXPAND, (event) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    toggleExpand()
    return { success: true }
  } catch (error) {
    console.error('Failed to Toggle Expand:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle(OPEN_NOTE, (event, data) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    const windowId = createNotepad(data)
    return { success: true, windowId: windowId }
  } catch (error) {
    console.error('Failed to open secondary window:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle(CLOSE_WINDOW, (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window && !window.isDestroyed()) {
    window.close()
    return { success: true }
  }

  return { success: false, error: 'Window not found or already destroyed' }
})

ipcMain.handle(SAVE_TITLE, (event, title: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)

  if (!window) return { success: false, error: 'Window not found' }

  return updateTitle(window, title)
    ? { success: true }
    : { success: false, error: 'Failed to Update Title' }
})

ipcMain.handle(SAVE_CONTENT, (event, content: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return { success: false, error: 'Window not found' }

  const title = appState.files.browserToTitle.get(window)
  if (!title) return { success: false, error: 'Failed to resolve Title' }

  return saveContent(title, content)
    ? { success: true }
    : { success: false, error: 'Failed to Save Content' }
})
