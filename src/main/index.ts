import { app, BrowserWindow, ipcMain, globalShortcut, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { WindowType } from '@shared/constants'

interface WindowRegistry {
  main: BrowserWindow | null
  notes: Map<number, BrowserWindow>
}

interface ApplicationInfo {
  hidden: boolean
  editable: boolean
  opacity: number
}

interface Response {
  success: boolean
  error?: string
}

const windows: WindowRegistry = {
  main: null,
  notes: new Map()
}

const appInfo: ApplicationInfo = {
  hidden: false,
  editable: true,
  opacity: 1
}

let nextWindowId = 1

const createControlPanel = (): BrowserWindow => {
  const controlPanelWindow = new BrowserWindow({
    width: 883,
    height: 59,
    resizable: false,
    frame: false,
    transparent: true,
    // focusable: false,
    hasShadow: true,
    alwaysOnTop: true,
    fullscreenable: false,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const windowParams = new URLSearchParams({
    windowType: 'CONTROL_PANEL'
  }).toString()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    controlPanelWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
  } else {
    controlPanelWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
  }

  windows.main = controlPanelWindow

  controlPanelWindow.on('closed', () => {
    windows.main = null
    // Close all notes windows when main closes
    windows.notes.forEach((win) => {
      if (!win.isDestroyed()) win.close()
    })
    windows.notes.clear()
  })

  return controlPanelWindow
}

interface NotepadWindow {
  noteWindow: BrowserWindow
  windowId: number
}

const createNotepad = (data: { name: string }): NotepadWindow => {
  const windowId = nextWindowId++

  const noteWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    // hasShadow: true,
    alwaysOnTop: true,
    fullscreenable: false,
    // @ts-ignore this is valid and provides better functionality
    // parent: windows.main,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const windowParams = new URLSearchParams({
    windowType: WindowType.Note,
    windowId: windowId.toString(),
    ...{ editable: appInfo.editable.toString(), ...data }
  }).toString()

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    noteWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${windowParams}`)
  } else {
    noteWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: windowParams })
  }

  windows.notes.set(windowId, noteWindow)

  noteWindow.on('closed', () => {
    windows.notes.forEach((win) => {
      if (win === noteWindow && !win.isDestroyed()) win.close()
    })
    windows.notes.clear()
  })

  noteWindow.setIgnoreMouseEvents(!appInfo.editable)
  noteWindow.setOpacity(appInfo.opacity)

  noteWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return { noteWindow, windowId }
}

const updateOpacity = (value: number): Response => {
  const mainWindow = windows.main
  if (!mainWindow) return { success: false, error: 'Main window not found' }
  if (value < 0 || value > 1) return { success: false, error: 'Invalid opacity value' }
  mainWindow.setOpacity(value)

  for (const win of windows.notes.values()) {
    if (!win.isDestroyed()) {
      win.setOpacity(value)
    }
  }

  if (value !== 0) appInfo.opacity = value

  return { success: true }
}

const toggleHide = (): void => {
  if (appInfo.hidden) {
    appInfo.hidden = false
    updateOpacity(appInfo.opacity)
    updateEdit(appInfo.editable)
  } else {
    appInfo.hidden = true
    updateOpacity(0)
    updateEdit(false)
  }
}

const updateEdit = (state: boolean): Response => {
  const mainWindow = windows.main
  if (!mainWindow) return { success: false, error: 'Main window not found' }

  for (const win of windows.notes.values()) {
    if (!win.isDestroyed()) {
      win.setIgnoreMouseEvents(!state)
    }
  }

  return { success: true }
}

const toggleEdit = (): Response => {
  if (appInfo.hidden) return { success: false, error: 'Main window is hidden' }
  appInfo.editable = !appInfo.editable

  windows.main?.webContents.send('shortcut-toggle-edit', appInfo.editable)
  for (const win of windows.notes.values())
    win?.webContents.send('shortcut-toggle-edit', appInfo.editable)

  return updateEdit(appInfo.editable)
}

const createWindow = (): void => {
  windows.main = createControlPanel()
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

  createWindow()

  globalShortcut.register('CommandOrControl+H', toggleHide)
  globalShortcut.register('CommandOrControl+N', () => createNotepad({ name: 'New Note' }))
  globalShortcut.register('CommandOrControl+E', () => {
    toggleEdit()
  })

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

ipcMain.handle('change-opacity', (event, value) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  return updateOpacity(value)
})

ipcMain.handle('create-note', (event, data) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    const { windowId } = createNotepad(data)
    return { success: true, windowId: windowId }
  } catch (error) {
    console.error('Failed to open secondary window:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('button-toggle-hide', (event) => {
  console.log(globalShortcut.isRegistered('CommandOrControl+H'))

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

ipcMain.handle('button-toggle-edit', (event) => {
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

ipcMain.handle('open-note', (event, data) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender)
  if (!sourceWindow) return { success: false, error: 'Source window not found' }

  try {
    const { windowId } = createNotepad(data)
    return { success: true, windowId: windowId }
  } catch (error) {
    console.error('Failed to open secondary window:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window && !window.isDestroyed()) {
    window.close()
    return { success: true }
  }

  return { success: false, error: 'Window not found or already destroyed' }
})
